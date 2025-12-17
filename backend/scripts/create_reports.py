#!/usr/bin/env python3
"""Create sample report data"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import sys
sys.path.insert(0, '/Users/chenshangwei/code/securityLab/backend')

from app.core.config import settings
from app.models import User, Project, Report

async def main():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get users
        users = (await session.execute(select(User))).scalars().all()
        admin = users[0]
        eng1 = users[1] if len(users) > 1 else users[0]
        eng2 = users[2] if len(users) > 2 else users[0]
        reviewer = users[3] if len(users) > 3 else users[0]
        
        # Get projects
        projects = (await session.execute(select(Project).order_by(Project.created_at))).scalars().all()
        
        print(f'Found: {len(projects)} projects, {len(users)} users')
        
        # Create sample reports with structured sections
        reports = [
            Report(
                code='RPT-IOT-2025-0001-001',
                title='智能门锁安全检测报告',
                project_id=projects[0].id,
                version='v1.2',
                status='pending_review',
                author_id=eng1.id,
                reviewer_id=reviewer.id,
                content={
                    'template': 'iot_security_v1',
                    'metadata': {
                        'version': 'v1.2',
                        'created_at': (datetime.now() - timedelta(days=5)).isoformat(),
                        'last_modified': (datetime.now() - timedelta(days=1)).isoformat(),
                    },
                    'sections': [
                        {
                            'id': 'overview',
                            'title': '概述',
                            'level': 1,
                            'order': 1,
                            'content': '本报告针对Alpha智能门锁进行全面安全检测，评估其网络安全性能和合规性。',
                            'subsections': [
                                {
                                    'id': 'overview-purpose',
                                    'title': '测试目的',
                                    'level': 2,
                                    'order': 1,
                                    'content': '评估产品网络安全性能，发现潜在安全风险。'
                                },
                                {
                                    'id': 'overview-scope',
                                    'title': '测试范围',
                                    'level': 2,
                                    'order': 2,
                                    'content': '涵盖固件安全、通信协议、认证机制、数据保护等方面。'
                                }
                            ]
                        },
                        {
                            'id': 'environment',
                            'title': '测试环境',
                            'level': 1,
                            'order': 2,
                            'content': '使用专业的网络安全测试设备和工具进行评估。'
                        },
                        {
                            'id': 'results',
                            'title': '测试结果',
                            'level': 1,
                            'order': 3,
                            'subsections': [
                                {
                                    'id': 'results-access',
                                    'title': '访问控制测试',
                                    'level': 2,
                                    'order': 1,
                                    'content': '测试结果显示密码策略基本符合要求，但默认凭证未强制更改。'
                                },
                                {
                                    'id': 'results-data',
                                    'title': '数据保护测试',
                                    'level': 2,
                                    'order': 2,
                                    'content': '敏感数据采用AES-256加密存储，符合要求。'
                                }
                            ]
                        },
                        {
                            'id': 'vulnerabilities',
                            'title': '漏洞详情',
                            'level': 1,
                            'order': 4,
                            'vulnerabilities': [
                                {
                                    'id': 'VULN-001',
                                    'severity': 'critical',
                                    'title': '弱密码策略',
                                    'cvss': 7.5,
                                    'description': '默认密码未强制修改，存在安全隐患。',
                                    'recommendation': '强制用户首次登录时修改默认密码。'
                                },
                                {
                                    'id': 'VULN-002',
                                    'severity': 'high',
                                    'title': 'TLS版本过低',
                                    'cvss': 6.8,
                                    'description': '检测到TLS 1.1仍然启用。',
                                    'recommendation': '禁用TLS 1.1，仅支持TLS 1.2及以上。'
                                }
                            ]
                        }
                    ],
                    'statistics': {
                        'findings': 5,
                        'critical': 1,
                        'high': 2,
                        'medium': 2
                    }
                },
                created_at=datetime.now() - timedelta(days=5),
                updated_at=datetime.now() - timedelta(days=1)
            ),
            Report(
                code='RPT-IOT-2025-0002-001',
                title='AI玩具安全评估报告',
                project_id=projects[1].id,
                version='v1.0',
                status='draft',
                author_id=eng2.id,
                content={
                    'template': 'iot_security_v1',
                    'metadata': {
                        'version': 'v1.0',
                        'created_at': (datetime.now() - timedelta(days=2)).isoformat(),
                        'progress': 60
                    },
                    'sections': [
                        {
                            'id': 'overview',
                            'title': '概述',
                            'level': 1,
                            'order': 1,
                            'content': 'BetaTech AI玩具初步安全评估，测试进行中。'
                        },
                        {
                            'id': 'environment',
                            'title': '测试环境',
                            'level': 1,
                            'order': 2,
                            'content': '测试环境配置完成，正在进行各项安全测试。'
                        }
                    ],
                    'statistics': {
                        'findings': 0,
                        'critical': 0,
                        'high': 0
                    }
                },
                created_at=datetime.now() - timedelta(days=2),
                updated_at=datetime.now()
            ),
            Report(
                code='RPT-IOT-2025-0005-001',
                title='智能手表安全审计报告',
                project_id=projects[4].id,
                version='v2.1',
                status='approved',
                author_id=eng1.id,
                reviewer_id=reviewer.id,
                approved_at=datetime.now() - timedelta(days=3),
                content={
                    'template': 'iot_security_v1',
                    'metadata': {
                        'version': 'v2.1',
                        'created_at': (datetime.now() - timedelta(days=15)).isoformat(),
                        'last_modified': (datetime.now() - timedelta(days=3)).isoformat(),
                    },
                    'sections': [
                        {
                            'id': 'overview',
                            'title': '概述',
                            'level': 1,
                            'order': 1,
                            'content': 'EpsilonWatch智能手表安全审计已完成，所有发现的问题均已解决。'
                        },
                        {
                            'id': 'vulnerabilities',
                            'title': '漏洞详情',
                            'level': 1,
                            'order': 2,
                            'vulnerabilities': [
                                {
                                    'id': 'VULN-W001',
                                    'severity': 'medium',
                                    'title': '心率数据未加密',
                                    'cvss': 5.3,
                                    'description': '健康数据传输过程中未加密。',
                                    'recommendation': '实施端到端加密。',
                                    'status': 'resolved'
                                }
                            ]
                        },
                        {
                            'id': 'conclusion',
                            'title': '结论',
                            'level': 1,
                            'order': 3,
                            'content': '所有漏洞已修复，产品符合安全标准。'
                        }
                    ],
                    'statistics': {
                        'findings': 8,
                        'critical': 0,
                        'high': 0,
                        'medium': 3,
                        'all_resolved': True
                    }
                },
                created_at=datetime.now() - timedelta(days=15),
                updated_at=datetime.now() - timedelta(days=3)
            ),
            Report(
                code='RPT-IOT-2025-0003-001',
                title='智能摄像头渗透测试报告',
                project_id=projects[2].id,
                version='v1.1',
                status='rejected',
                author_id=eng2.id,
                reviewer_id=reviewer.id,
                content={
                    'template': 'iot_security_v1',
                    'metadata': {
                        'version': 'v1.1',
                        'created_at': (datetime.now() - timedelta(days=8)).isoformat(),
                        'rejection_reason': '需要补充漏洞详情和复现步骤'
                    },
                    'sections': [
                        {
                            'id': 'overview',
                            'title': '概述',
                            'level': 1,
                            'order': 1,
                            'content': 'GammaCam智能摄像头安全测试报告。'
                        },
                        {
                            'id': 'vulnerabilities',
                            'title': '漏洞详情',
                            'level': 1,
                            'order': 2,
                            'content': '发现多个安全问题，需要补充详细信息。'
                        }
                    ],
                    'statistics': {
                        'findings': 3,
                        'critical': 1,
                        'high': 2
                    }
                },
                created_at=datetime.now() - timedelta(days=8),
                updated_at=datetime.now() - timedelta(days=2)
            ),
        ]
        
        for r in reports:
            session.add(r)
        await session.commit()
        
        # Verify
        count_result = await session.execute(select(Report))
        created = count_result.scalars().all()
        print(f'\\n✅ Created {len(reports)} reports. Total in DB: {len(created)}')
        for r in created[:5]:
            print(f'  {r.code}: {r.title} [{r.status}]')

if __name__ == '__main__':
    asyncio.run(main())
