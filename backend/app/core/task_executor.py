"""
异步任务执行引擎

提供轻量级的异步任务执行能力，使用ThreadPoolExecutor + Redis
适用于MVP阶段的简单扫描任务
"""
import asyncio
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Callable, Any, Optional
from datetime import timedelta

import redis  # 同步Redis (worker线程用)
import redis.asyncio as aioredis  # 异步Redis (API用)

from app.core.config import settings

logger = logging.getLogger(__name__)


class TaskExecutor:
    """异步任务执行器"""
    
    def __init__(self, max_workers: int = 4):
        """
        初始化任务执行器
        
        Args:
            max_workers: 最大并发worker数量
        """
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.redis_async: Optional[aioredis.Redis] = None  # 异步Redis (API调用)
        self.redis_sync: Optional[redis.Redis] = None      # 同步Redis (Worker线程)
        self.task_registry: Dict[str, Callable] = {}
        self._initialized = False
        logger.info(f"TaskExecutor initialized with {max_workers} workers")
    
    async def init_redis(self):
        """初始化Redis连接（异步和同步）"""
        if self._initialized:
            return
            
        try:
            # 异步Redis (用于API调用)
            self.redis_async = await aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis_async.ping()
            logger.info("Async Redis connection established")
            
            # 同步Redis (用于Worker线程)
            self.redis_sync = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True
            )
            self.redis_sync.ping()
            logger.info("Sync Redis connection established")
            
            self._initialized = True
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def close(self):
        """关闭资源"""
        if self.redis_async:
            await self.redis_async.close()
        if self.redis_sync:
            self.redis_sync.close()
        self.executor.shutdown(wait=True)
        logger.info("TaskExecutor closed")
    
    def register_task(self, task_type: str):
        """
        装饰器：注册任务类型
        
        Usage:
            @task_executor.register_task("ping_scan")
            def ping_scan_worker(task_id, params, progress_callback):
                ...
        """
        def decorator(func: Callable):
            self.task_registry[task_type] = func
            logger.info(f"Registered task type: {task_type}")
            return func
        return decorator
    
    async def submit_task(
        self, 
        task_id: str, 
        task_type: str, 
        params: dict
    ) -> bool:
        """
        提交任务到执行器
        
        Args:
            task_id: 任务ID
            task_type: 任务类型（必须已注册）
            params: 任务参数
            
        Returns:
            bool: 提交成功返回True
        """
        if not self._initialized:
            await self.init_redis()
        
        if task_type not in self.task_registry:
            logger.error(f"Unknown task type: {task_type}")
            raise ValueError(f"Unknown task type: {task_type}")
        
        # 设置初始状态 (使用同步Redis，线程安全)
        self.redis_sync.hset(
            f"task:{task_id}",
            mapping={
                "status": "queued",
                "progress": 0,
                "message": "任务已提交，等待执行",
                "type": task_type
            }
        )
        self.redis_sync.expire(f"task:{task_id}", 86400)
        
        # 提交到线程池
        task_func = self.task_registry[task_type]
        loop = asyncio.get_event_loop()
        
        loop.run_in_executor(
            self.executor,
            self._run_task_wrapper,
            task_id,
            task_type,
            task_func,
            params
        )
        
        logger.info(f"Task {task_id} ({task_type}) submitted to executor")
        return True
    
    def _run_task_wrapper(
        self,
        task_id: str,
        task_type: str,
        task_func: Callable,
        params: dict
    ):
        """
        任务包装器：运行在worker线程中
        捕获异常并更新状态
        """
        logger.info(f"Starting task {task_id} ({task_type})")
        
        try:
            # 更新为运行中 (使用同步Redis)
            self.redis_sync.hset(
                f"task:{task_id}",
                mapping={
                    "status": "running",
                    "message": "任务执行中..."
                }
            )
            
            # 执行任务（同步函数）
            result = task_func(
                task_id=task_id,
                params=params,
                progress_callback=self._create_progress_callback(task_id)
            )
            
            # 更新为完成
            self.redis_sync.hset(
                f"task:{task_id}",
                mapping={
                    "status": "completed",
                    "progress": 100,
                    "message": "任务执行完成",
                    "result": json.dumps(result, ensure_ascii=False)
                }
            )
            
            # 同步状态到数据库
            self._sync_status_to_db(task_id, "completed")
            
            logger.info(f"Task {task_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Task {task_id} failed: {str(e)}", exc_info=True)
            self.redis_sync.hset(
                f"task:{task_id}",
                mapping={
                    "status": "failed",
                    "message": f"任务执行失败: {str(e)}",
                    "error": str(e)
                }
            )
            
            # 同步状态到数据库
            self._sync_status_to_db(task_id, "failed")
    
    def _sync_status_to_db(self, task_id: str, status: str):
        """
        同步任务状态到数据库（简化版 - 只更新status）
        
        Args:
            task_id: 任务ID (string)
            status: 任务状态
        """
        try:
            import uuid
            from sqlalchemy import create_engine, text
            from app.core.config import settings
            
            logger.info(f"Attempting to sync task {task_id} status to database: {status}")
            
            # 创建同步数据库连接（在worker线程中使用）
            db_url = settings.DATABASE_URL.replace('+asyncpg', '+psycopg2')
            engine = create_engine(db_url, pool_pre_ping=True)
            
            with engine.connect() as conn:
                # 只更新status和updated_at (Task表没有result字段)
                query = text("""
                    UPDATE tasks 
                    SET status = :status, updated_at = NOW()
                    WHERE id = :task_id
                """)
                
                # 转换task_id为UUID
                try:
                    if isinstance(task_id, str):
                        task_uuid = uuid.UUID(task_id)
                    else:
                        task_uuid = task_id
                except (ValueError, AttributeError) as e:
                    logger.error(f"Invalid task_id format: {task_id}, error: {e}")
                    return
                
                # 执行更新
                result_proxy = conn.execute(query, {"status": status, "task_id": task_uuid})
                conn.commit()
                
                rows_affected = result_proxy.rowcount
                if rows_affected > 0:
                    logger.info(f"✅ Successfully synced task {task_id} status ({status}) to database")
                else:
                    logger.warning(f"⚠️ No rows updated for task {task_id} - task may not exist in database")
                
        except Exception as e:
            logger.error(f"❌ Failed to sync task {task_id} status to database: {e}", exc_info=True)
    
    def _create_progress_callback(self, task_id: str) -> Callable:
        """创建进度回调函数（支持structured logging）"""
        def progress_callback(progress: int, message: str = "", level: str = "INFO", data: dict = None):
            """
            更新任务进度并记录日志
            
            Args:
                progress: 进度百分比 (0-100)
                message: 状态消息
                level: 日志级别 (DEBUG/INFO/WARN/ERROR)
                data: 额外数据（可选）
            """
            try:
                from datetime import datetime
                
                # 更新进度
                self.redis_sync.hset(
                    f"task:{task_id}",
                    mapping={
                        "progress": min(100, max(0, progress)),
                        "message": message
                    }
                )
                self.redis_sync.expire(f"task:{task_id}", 86400)
                
                # 存储详细日志
                log_entry = {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "level": level,
                    "message": message,
                    "progress": progress
                }
                if data:
                    log_entry["data"] = data
                
                # 追加到日志列表（最多保留200条）
                log_key = f"task:{task_id}:logs"
                self.redis_sync.rpush(log_key, json.dumps(log_entry))
                self.redis_sync.ltrim(log_key, -200, -1)
                self.redis_sync.expire(log_key, 86400)
                
            except Exception as e:
                logger.error(f"Failed to update progress for task {task_id}: {e}")
        
        return progress_callback
    
    async def get_task_status(self, task_id: str) -> Optional[dict]:
        """
        获取任务状态（用于API调用）
        
        Args:
            task_id: 任务ID
            
        Returns:
            dict: 任务状态数据，不存在返回None
        """
        if not self._initialized:
            await self.init_redis()
            
        key = f"task:{task_id}"
        data = await self.redis_async.hgetall(key)
        
        if not data:
            return None
        
        # 转换progress为int
        if "progress" in data:
            data["progress"] = int(data["progress"])
        
        return data
    
    async def get_task_logs(
        self, 
        task_id: str, 
        limit: int = 200,
        level: str = None
    ) -> list:
        """
        获取任务日志
        
        Args:
            task_id: 任务ID
            limit: 返回日志条数（默认200）
            level: 过滤日志级别（可选）
            
        Returns:
            list: 日志列表
        """
        if not self._initialized:
            await self.init_redis()
        
        log_key = f"task:{task_id}:logs"
        # 获取最近N条日志
        logs = await self.redis_async.lrange(log_key, -limit, -1)
        
        parsed_logs = []
        for log in logs:
            try:
                entry = json.loads(log)
                # 级别过滤
                if level and entry.get("level") != level:
                    continue
                parsed_logs.append(entry)
            except json.JSONDecodeError:
                continue
        
        return parsed_logs
    
    async def cancel_task(self, task_id: str) -> bool:
        """
        取消任务（标记为cancelled）
        
        Args:
            task_id: 任务ID
            
        Returns:
            bool: 成功返回True
        """
        status = await self.get_task_status(task_id)
        if not status:
            return False
        
        if status["status"] in ["completed", "failed", "cancelled"]:
            return False
        
        # 使用同步Redis
        self.redis_sync.hset(
            f"task:{task_id}",
            mapping={
                "status": "cancelled",
                "message": "任务已取消"
            }
        )
        
        # 同步状态到数据库
        self._sync_status_to_db(task_id, "cancelled")
        
        logger.info(f"Task {task_id} cancelled")
        return True


# 全局单例
task_executor = TaskExecutor(max_workers=4)
