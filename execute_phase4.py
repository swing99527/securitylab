#!/usr/bin/env python3
"""
Phase 4: 数据清洗执行脚本
通过SQLAlchemy执行，无需手动输入数据库密码
"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# 数据库连接（从backend配置中获取）
DATABASE_URL = "postgresql+asyncpg://postgres@localhost/securitylabdb"

async def execute_cleanup():
    """执行数据清洗"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            print("=" * 60)
            print("Phase 4: 开始数据清洗")
            print("=" * 60)
            
            # 开始事务
            async with session.begin():
                # 读取SQL文件
                with open('/Users/chenshangwei/code/securityLab/phase4_cleanup.sql', 'r') as f:
                    sql_content = f.read()
                
                # 移除BEGIN和COMMIT语句（我们用Python的事务管理）
                sql_content = sql_content.replace('BEGIN;', '')
                sql_content = sql_content.replace('-- 如果一切正常，手动执行: COMMIT;', '')
                sql_content = sql_content.replace('-- 如果有问题，执行: ROLLBACK;', '')
                
                # 分割SQL语句并执行
                statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]
                
                for i, stmt in enumerate(statements):
                    if stmt:
                        print(f"\n执行语句 {i+1}/{len(statements)}...")
                        result = await session.execute(text(stmt))
                        
                        # 尝试获取结果
                        try:
                            rows = result.fetchall()
                            if rows:
                                for row in rows:
                                    print("  ", dict(row._mapping))
                        except:
                            pass
                
                # 最终验证
                print("\n" + "=" * 60)
                print("最终验证")
                print("=" * 60)
                
                # 检查不一致数
                result = await session.execute(text("""
                    SELECT COUNT(*) as count
                    FROM tasks t
                    JOIN samples s ON t.sample_id = s.id
                    WHERE t.project_id != s.project_id
                """))
                mismatch_count = result.scalar()
                
                print(f"\n✓ 清洗后不一致数: {mismatch_count}")
                
                # 检查新样品数
                result = await session.execute(text("""
                    SELECT COUNT(*) as count
                    FROM samples
                    WHERE code LIKE 'SPL-20251225-CP%'
                """))
                new_samples = result.scalar()
                
                print(f"✓ 新创建样品数: {new_samples}")
                
                # 决策点
                if mismatch_count == 0 and new_samples == 7:
                    print("\n" + "=" * 60)
                    print("✅ 验证通过！准备提交事务...")
                    print("=" * 60)
                    # session.begin()的上下文会自动commit
                    return True
                else:
                    print("\n" + "=" * 60)
                    print(f"❌ 验证失败！")
                    print(f"   不一致数: {mismatch_count} (期望0)")
                    print(f"   新样品数: {new_samples} (期望7)")
                    print("=" * 60)
                    raise Exception("验证失败，事务将回滚")
                    
        except Exception as e:
            print(f"\n❌ 错误: {e}")
            print("事务已回滚")
            return False
        finally:
            await engine.dispose()

if __name__ == "__main__":
    success = asyncio.run(execute_cleanup())
    if success:
        print("\n🎉 Phase 4 数据清洗成功完成！")
    else:
        print("\n⚠️  Phase 4 数据清洗失败，已回滚")
