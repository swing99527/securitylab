#!/usr/bin/env python3
"""
Database seed data script
Create test data for projects, samples, and tasks
"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import sys
import os

# Ensure the project root directory is in the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models import User, Project, Sample, Task, AuditLog, Report
from app.core.security import hash_password

async def seed_database():
    """填充数据库"""
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 清理旧数据
        print("清理旧数据...")
        from sqlalchemy import delete
        await session.execute(delete(AuditLog))
        await session.execute(delete(Report))
        await session.execute(delete(Task))
        await session.execute(delete(Sample))
        await session.execute(delete(Project))
        await session.execute(delete(User))
        await session.commit()

        # 1. 创建用户（演示账号）
        print("创建用户...")
        users = [
            # 管理员
            User(
                email="admin@stuailab.com",
                password_hash=hash_password("123456"),
                name="张管理员",
                role="admin",
                department="信息安全实验室",
                status="active"
            ),
            # 主管
            User(
                email="director@stuailab.com",
                password_hash=hash_password("123456"),
                name="李主管",
                role="director",
                department="检测中心",
                status="active"
            ),
            # 项目经理
            User(
                email="manager@stuailab.com",
                password_hash=hash_password("123456"),
                name="王经理",
                role="manager",
                department="项目部",
                status="active"
            ),
            # 工程师
            User(
                email="engineer@stuailab.com",
                password_hash=hash_password("123456"),
                name="陈工程师",
                role="engineer",
                department="检测中心",
                status="active"
            ),
            # 审核员
            User(
                email="reviewer@stuailab.com",
                password_hash=hash_password("123456"),
                name="赵审核员",
                role="reviewer",
                department="质量部",
                status="active"
            ),
            # 签字人
            User(
                email="signer@stuailab.com",
                password_hash=hash_password("123456"),
                name="孙签字人",
                role="signer",
                department="质量部",
                status="active"
            ),
            # 样品管理员
            User(
                email="sample@stuailab.com",
                password_hash=hash_password("123456"),
                name="周样品员",
                role="sample_admin",
                department="样品库",
                status="active"
            ),
            # 客户
            User(
                email="client@example.com",
                password_hash=hash_password("123456"),
                name="客户A",
                role="client",
                department="外部客户",
                status="active"
            ),
        ]

        
        for user in users:
            session.add(user)
        await session.commit()
        
        
        # 刷新以获取ID
        for user in users:
            await session.refresh(user)
        
        admin_user = users[0]  # 管理员
        director_user = users[1]  # 主管
        manager_user = users[2]  # 项目经理
        engineer_user = users[3]  # 工程师
        reviewer_user = users[4]  # 审核员

        
        # 2. 创建项目
        print("创建项目...")
        projects = [
            Project(
                code="IOT-2025-0001",
                name="智能门锁安全检测",
                client="小米智能科技有限公司",
                standard="EN 18031, GB/T 37988",
                status="in_progress",
                progress=35,
                manager_id=admin_user.id,
                deadline=datetime.now() + timedelta(days=30),
            ),
            Project(
                code="IOT-2025-0002",
                name="AI智能玩具安全评估",
                client="大疆创新科技有限公司",
                standard="EN 71, EN 18031",
                status="in_progress",
                progress=60,
                manager_id=manager_user.id,
                deadline=datetime.now() + timedelta(days=20),
            ),
            Project(
                code="IOT-2025-0003",
                name="智能摄像头渗透测试",
                client="海康威视数字技术股份有限公司",
                standard="EN 18031, GB/T 35273",
                status="pending",
                progress=10,
                manager_id=admin_user.id,
                deadline=datetime.now() + timedelta(days=45),
            ),
            Project(
                code="IOT-2025-0004",
                name="智能音箱隐私检测",
                client="华为技术有限公司",
                standard="EN 18031, GDPR",
                status="pending",
                progress=5,
                manager_id=manager_user.id,
                deadline=datetime.now() + timedelta(days=60),
            ),
            Project(
                code="IOT-2025-0005",
                name="智能手表安全审计",
                client="Apple Inc.",
                standard="EN 18031, ISO 27001",
                status="completed",
                progress=100,
                manager_id=engineer_user.id,
                deadline=datetime.now() - timedelta(days=5),
            ),
        ]
        
        for project in projects:
            session.add(project)
        await session.commit()
        
        for project in projects:
            await session.refresh(project)
        
        # 3. 创建样品
        print("创建样品...")
        samples = [
            # 智能门锁项目样品
            Sample(
                code="SPL-20251216-001",
                name="小米智能门锁Pro",
                model="XMZNMS01",
                manufacturer="小米",
                status="in_use",
                location="实验室A区",
                project_id=projects[0].id,
                notes="支持指纹、密码、NFC多种开锁方式",
            ),
            Sample(
                code="SPL-20251216-002",
                name="小米智能门锁青春版",
                model="XMZNMS02",
                manufacturer="小米",
                status="in_stock",
                location="样品库B架",
                project_id=projects[0].id,
                notes="经济型款式",
            ),
            # AI玩具项目样品
            Sample(
                code="SPL-20251216-003",
                name="大疆机甲大师S1",
                model="DJ-RMS1",
                manufacturer="大疆",
                status="in_use",
                location="实验室C区",
                project_id=projects[1].id,
                notes="教育机器人，含视觉识别功能",
            ),
            Sample(
                code="SPL-20251216-004",
                name="DJI Tello无人机",
                model="DJ-TELLO",
                manufacturer="大疆",
                status="in_use",
                location="实验室C区",
                project_id=projects[1].id,
                notes="编程教育无人机",
            ),
            # 智能摄像头项目样品
            Sample(
                code="SPL-20251216-005",
                name="海康威视网络摄像机",
                model="HK-IPC-001",
                manufacturer="海康威视",
                status="in_stock",
                location="样品库A架",
                project_id=projects[2].id,
                notes="4K高清，支持云存储",
            ),
            Sample(
                code="SPL-20251216-006",
                name="海康威视球型摄像机",
                model="HK-IPC-002",
                manufacturer="海康威视",
                status="in_stock",
                location="样品库A架",
                project_id=projects[2].id,
                notes="360度旋转，夜视功能",
            ),
            # 智能音箱项目样品
            Sample(
                code="SPL-20251216-007",
                name="华为AI音箱2",
                model="HW-AI-SPK2",
                manufacturer="华为",
                status="in_stock",
                location="样品库C架",
                project_id=projects[3].id,
                notes="支持HiLink智能家居控制",
            ),
            # 智能手表项目样品
            Sample(
                code="SPL-20251215-001",
                name="Apple Watch Series 8",
                model="APL-W-S8",
                manufacturer="Apple",
                status="returned",
                location="样品归还区",
                project_id=projects[4].id,
                notes="已完成检测，待退还",
            ),
        ]
        
        for sample in samples:
            session.add(sample)
        await session.commit()
        
        for sample in samples:
            await session.refresh(sample)
        
        # 4. 创建任务
        print("创建任务...")
        tasks = [
            # 智能门锁项目任务
            Task(
                code="TASK-IOT-2025-0001-001",
                name="网络端口扫描",
                type="nmap_scan",
                status="completed",
                priority="high",
                progress=100,
                project_id=projects[0].id,
                sample_id=samples[0].id,
                assignee_id=engineer_user.id,
                config={"target": "192.168.1.100", "ports": "1-65535"},
                start_time=datetime.now() - timedelta(days=2),
                end_time=datetime.now() - timedelta(days=1, hours=20),
            ),
            Task(
                code="TASK-IOT-2025-0001-002",
                name="固件安全分析",
                type="firmware_analysis",
                status="running",
                priority="high",
                progress=65,
                project_id=projects[0].id,
                sample_id=samples[0].id,
                assignee_id=engineer_user.id,
                config={"firmware_path": "/uploads/xiaomi_lock_v2.3.bin"},
                start_time=datetime.now() - timedelta(hours=5),
            ),
            Task(
                code="TASK-IOT-2025-0001-003",
                name="蓝牙协议测试",
                type="fuzzing",
                status="queued",
                priority="medium",
                progress=0,
                project_id=projects[0].id,
                sample_id=samples[0].id,
                assignee_id=engineer_user.id,
                config={"protocol": "BLE 5.0"},
            ),
            # AI玩具项目任务
            Task(
                code="TASK-IOT-2025-0002-001",
                name="Wi-Fi安全检测",
                type="pentest",
                status="completed",
                priority="high",
                progress=100,
                project_id=projects[1].id,
                sample_id=samples[2].id,
                assignee_id=engineer_user.id,
                config={"ssid": "DJI-RMS1", "encryption": "WPA2"},
                start_time=datetime.now() - timedelta(days=3),
                end_time=datetime.now() - timedelta(days=2),
            ),
            Task(
                code="TASK-IOT-2025-0002-002",
                name="视觉AI算法安全评估",
                type="pentest",
                status="running",
                priority="high",
                progress=40,
                project_id=projects[1].id,
                sample_id=samples[2].id,
                assignee_id=engineer_user.id,
                config={"model_type": "YOLOv5"},
                start_time=datetime.now() - timedelta(hours=8),
            ),
            Task(
                code="TASK-IOT-2025-0002-003",
                name="模糊测试-无人机通信",
                type="fuzzing",
                status="queued",
                priority="medium",
                progress=0,
                project_id=projects[1].id,
                sample_id=samples[3].id,
                assignee_id=engineer_user.id,
                config={"target_protocol": "MAVLink"},
            ),
            # 智能摄像头项目任务
            Task(
                code="TASK-IOT-2025-0003-001",
                name="RTSP流安全测试",
                type="fuzzing",
                status="queued",
                priority="high",
                progress=0,
                project_id=projects[2].id,
                sample_id=samples[4].id,
                assignee_id=engineer_user.id,
                config={"protocol": "RTSP", "port": 554},
            ),
            Task(
                code="TASK-IOT-2025-0003-002",
                name="固件逆向分析",
                type="firmware_analysis",
                status="queued",
                priority="high",
                progress=0,
                project_id=projects[2].id,
                sample_id=samples[4].id,
                assignee_id=engineer_user.id,
                config={"firmware_version": "v5.7.3"},
            ),
            # 智能音箱项目任务
            Task(
                code="TASK-IOT-2025-0004-001",
                name="语音隐私检测",
                type="pentest",
                status="queued",
                priority="medium",
                progress=0,
                project_id=projects[3].id,
                sample_id=samples[6].id,
                assignee_id=engineer_user.id,
                config={"test_scenarios": ["wake_word", "recording", "upload"]},
            ),
            # 智能手表项目任务（已完成）
            Task(
                code="TASK-IOT-2025-0005-001",
                name="健康数据安全审计",
                type="pentest",
                status="completed",
                priority="high",
                progress=100,
                project_id=projects[4].id,
                sample_id=samples[7].id,
                assignee_id=engineer_user.id,
                config={"data_types": ["heart_rate", "sleep", "steps"]},
                start_time=datetime.now() - timedelta(days=10),
                end_time=datetime.now() - timedelta(days=6),
            ),
        ]
        
        for task in tasks:
            session.add(task)
        await session.commit()
        
        print(f"\n✅ 数据库填充完成!")
        print(f"   - 用户: {len(users)}")
        print(f"   - 项目: {len(projects)}")
        print(f"   - 样品: {len(samples)}")
        print(f"   - 任务: {len(tasks)}")

if __name__ == "__main__":
    asyncio.run(seed_database())

