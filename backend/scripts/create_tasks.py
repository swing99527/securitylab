#!/usr/bin/env python3
"""Quick script to create task data with correct constraints"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import sys
sys.path.insert(0, '/Users/chenshangwei/code/securityLab/backend')

from app.core.config import settings
from app.models import User, Project, Sample, Task

async def main():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get users
        users = (await session.execute(select(User))).scalars().all()
        eng1 = users[1] if len(users) > 1 else users[0]
        eng2 = users[2] if len(users) > 2 else users[0]
        
        # Get projects and samples
        projects = (await session.execute(select(Project).order_by(Project.created_at))).scalars().all()
        samples = (await session.execute(select(Sample).order_by(Sample.created_at))).scalars().all()
        
        print(f'Found: {len(projects)} projects, {len(samples)} samples')
        
        # Create tasks - CORRECT CONSTRAINTS!
        # type: nmap_scan, vuln_scan, firmware_analysis, fuzzing, pentest
        # status: queued, running, paused, completed, failed, cancelled
        tasks = [
            Task(code='TASK-IOT-2025-0001-001', name='Network Port Scan', type='nmap_scan',
                 status='completed', priority='high', progress=100,
                 project_id=projects[0].id, sample_id=samples[0].id, assignee_id=eng1.id,
                 config={'target': '192.168.1.100'},
                 start_time=datetime.now()-timedelta(days=2), end_time=datetime.now()-timedelta(days=1)),
            Task(code='TASK-IOT-2025-0001-002', name='Firmware Analysis', type='firmware_analysis',
                 status='running', priority='high', progress=65,
                 project_id=projects[0].id, sample_id=samples[0].id, assignee_id=eng1.id,
                 start_time=datetime.now()-timedelta(hours=5)),
            Task(code='TASK-IOT-2025-0002-001', name='Penetration Test', type='pentest',
                 status='running', priority='high', progress=40,
                 project_id=projects[1].id, sample_id=samples[2].id, assignee_id=eng2.id,
                 start_time=datetime.now()-timedelta(hours=8)),
            Task(code='TASK-IOT-2025-0003-001', name='Vulnerability Scan', type='vuln_scan',
                 status='queued', priority='medium', progress=0,
                 project_id=projects[2].id, sample_id=samples[4].id, assignee_id=eng1.id),
            Task(code='TASK-IOT-2025-0005-001', name='Fuzzing Test', type='fuzzing',
                 status='completed', priority='high', progress=100,
                 project_id=projects[4].id, sample_id=samples[7].id, assignee_id=eng2.id,
                 start_time=datetime.now()-timedelta(days=10), end_time=datetime.now()-timedelta(days=6)),
        ]
        
        for t in tasks:
            session.add(t)
        await session.commit()
        
        # Verify
        count = (await session.execute(select(Task))).scalars().all()
        print(f'\\nCreated {len(tasks)} tasks. Total in DB: {len(count)}')
        for t in count[:5]:
            print(f'  {t.code}: {t.name} [{t.status}]')

if __name__ == '__main__':
    asyncio.run(main())
