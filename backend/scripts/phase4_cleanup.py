"""
Phase 4: 数据清洗 - 通过后端数据库连接执行
使用已有的数据库配置，无需输入密码
"""
import asyncio
import sys
sys.path.insert(0, '/Users/chenshangwei/code/securityLab/backend')

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.core.database import engine

async def main():
    print("=" * 70)
    print("Phase 4: 数据清洗开始")
    print("=" * 70)
    
    # 使用后端已有的engine
    async with engine.begin() as conn:
        try:
            # Step 1: 创建临时表记录清洗前状态
            await conn.execute(text("""
                CREATE TEMP TABLE IF NOT EXISTS pre_cleanup_tasks AS
                SELECT 
                    t.id as task_id,
                    t.name as task_name,
                    t.project_id as task_project_id,
                    t.sample_id as sample_id,
                    s.name as sample_name,
                    s.project_id as sample_project_id
                FROM tasks t
                LEFT JOIN samples s ON t.sample_id = s.id
                WHERE t.sample_id IS NOT NULL
            """))
            
            # 检查清洗前不一致数
            result = await conn.execute(text("""
                SELECT COUNT(*) as count
                FROM pre_cleanup_tasks
                WHERE task_project_id != sample_project_id
            """))
            before_count = result.scalar()
            print(f"\n✓ 清洗前不一致任务数: {before_count}")
            
            # Step 2-5: 执行样品复制和任务更新
            print("\n开始创建样品副本...")
            
            # 样品1: 小米智能门锁Pro - 项目7e6dc6d7
            await conn.execute(text("""
                INSERT INTO samples (id, code, name, model, manufacturer, project_id, status, location, notes, created_at, updated_at)
                SELECT gen_random_uuid(), 'SPL-20251225-CP1', name, model, manufacturer,
                       '7e6dc6d7-be2e-4ce2-98ca-a8ef49fd07dc', status, location,
                       COALESCE(notes, '') || ' [Phase4复制]', NOW(), NOW()
                FROM samples WHERE id = 'eee78df9-91aa-4fc8-aac7-2464b740ec2e'
                RETURNING id
            """))
            new_id = (await conn.execute(text("SELECT id FROM samples WHERE code = 'SPL-20251225-CP1'"))).scalar()
            await conn.execute(text(f"""
                UPDATE tasks SET sample_id = '{new_id}', updated_at = NOW()
                WHERE project_id = '7e6dc6d7-be2e-4ce2-98ca-a8ef49fd07dc'
                AND sample_id = 'eee78df9-91aa-4fc8-aac7-2464b740ec2e'
            """))
            print("  ✓ CP1 创建并更新")
            
            # 样品1: 小米智能门锁Pro - 项目c24e423f
            await conn.execute(text("""
                INSERT INTO samples (id, code, name, model, manufacturer, project_id, status, location, notes, created_at, updated_at)
                SELECT gen_random_uuid(), 'SPL-20251225-CP2', name, model, manufacturer,
                       'c24e423f-9555-4d95-98d9-bdbf4582c30d', status, location,
                       COALESCE(notes, '') || ' [Phase4复制]', NOW(), NOW()
                FROM samples WHERE id = 'eee78df9-91aa-4fc8-aac7-2464b740ec2e'
            """))
            new_id = (await conn.execute(text("SELECT id FROM samples WHERE code = 'SPL-20251225-CP2'"))).scalar()
            await conn.execute(text(f"""
                UPDATE tasks SET sample_id = '{new_id}', updated_at = NOW()
                WHERE project_id = 'c24e423f-9555-4d95-98d9-bdbf4582c30d'
                AND sample_id = 'eee78df9-91aa-4fc8-aac7-2464b740ec2e'
            """))
            print("  ✓ CP2 创建并更新")
            
            # 样品2: 小米智能门锁青春版 - 项目7e6dc6d7
            await conn.execute(text("""
                INSERT INTO samples (id, code, name, model, manufacturer, project_id, status, location, notes, created_at, updated_at)
                SELECT gen_random_uuid(), 'SPL-20251225-CP3', name, model, manufacturer,
                       '7e6dc6d7-be2e-4ce2-98ca-a8ef49fd07dc', status, location,
                       COALESCE(notes, '') || ' [Phase4复制]', NOW(), NOW()
                FROM samples WHERE id = '8d6b5ab7-6cd6-45b5-a59e-4d1a19af0e62'
            """))
            new_id = (await conn.execute(text("SELECT id FROM samples WHERE code = 'SPL-20251225-CP3'"))).scalar()
            await conn.execute(text(f"""
                UPDATE tasks SET sample_id = '{new_id}', updated_at = NOW()
                WHERE project_id = '7e6dc6d7-be2e-4ce2-98ca-a8ef49fd07dc'
                AND sample_id = '8d6b5ab7-6cd6-45b5-a59e-4d1a19af0e62'
            """))
            print("  ✓ CP3 创建并更新")
            
            # 样品3: 大疆机甲大师S1 - 项目e5294498
            await conn.execute(text("""
                INSERT INTO samples (id, code, name, model, manufacturer, project_id, status, location, notes, created_at, updated_at)
                SELECT gen_random_uuid(), 'SPL-20251225-CP4', name, model, manufacturer,
                       'e5294498-a011-4df8-a284-247f541da04e', status, location,
                       COALESCE(notes, '') || ' [Phase4复制]', NOW(), NOW()
                FROM samples WHERE id = '95771117-32a2-4633-9d24-c09a84909a49'
            """))
            new_id = (await conn.execute(text("SELECT id FROM samples WHERE code = 'SPL-20251225-CP4'"))).scalar()
            await conn.execute(text(f"""
                UPDATE tasks SET sample_id = '{new_id}', updated_at = NOW()
                WHERE project_id = 'e5294498-a011-4df8-a284-247f541da04e'
                AND sample_id = '95771117-32a2-4633-9d24-c09a84909a49'
            """))
            print("  ✓ CP4 创建并更新")
            
            # 样品3: 大疆机甲大师S1 - 项目c24e423f
            await conn.execute(text("""
                INSERT INTO samples (id, code, name, model, manufacturer, project_id, status, location, notes, created_at, updated_at)
                SELECT gen_random_uuid(), 'SPL-20251225-CP5', name, model, manufacturer,
                       'c24e423f-9555-4d95-98d9-bdbf4582c30d', status, location,
                       COALESCE(notes, '') || ' [Phase4复制]', NOW(), NOW()
                FROM samples WHERE id = '95771117-32a2-4633-9d24-c09a84909a49'
            """))
            new_id = (await conn.execute(text("SELECT id FROM samples WHERE code = 'SPL-20251225-CP5'"))).scalar()
            await conn.execute(text(f"""
                UPDATE tasks SET sample_id = '{new_id}', updated_at = NOW()
                WHERE project_id = 'c24e423f-9555-4d95-98d9-bdbf4582c30d'
                AND sample_id = '95771117-32a2-4633-9d24-c09a84909a49'
            """))
            print("  ✓ CP5 创建并更新")
            
            # 样品3: 大疆机甲大师S1 - 项目d8e49504
            await conn.execute(text("""
                INSERT INTO samples (id, code, name, model, manufacturer, project_id, status, location, notes, created_at, updated_at)
                SELECT gen_random_uuid(), 'SPL-20251225-CP6', name, model, manufacturer,
                       'd8e49504-59db-491d-8063-6bf86553af2b', status, location,
                       COALESCE(notes, '') || ' [Phase4复制]', NOW(), NOW()
                FROM samples WHERE id = '95771117-32a2-4633-9d24-c09a84909a49'
            """))
            new_id = (await conn.execute(text("SELECT id FROM samples WHERE code = 'SPL-20251225-CP6'"))).scalar()
            await conn.execute(text(f"""
                UPDATE tasks SET sample_id = '{new_id}', updated_at = NOW()
                WHERE project_id = 'd8e49504-59db-491d-8063-6bf86553af2b'
                AND sample_id = '95771117-32a2-4633-9d24-c09a84909a49'
            """))
            print("  ✓ CP6 创建并更新")
            
            # 样品4: DJI Tello无人机 - 项目d8e49504
            await conn.execute(text("""
                INSERT INTO samples (id, code, name, model, manufacturer, project_id, status, location, notes, created_at, updated_at)
                SELECT gen_random_uuid(), 'SPL-20251225-CP7', name, model, manufacturer,
                       'd8e49504-59db-491d-8063-6bf86553af2b', status, location,
                       COALESCE(notes, '') || ' [Phase4复制]', NOW(), NOW()
                FROM samples WHERE id = 'fba02002-3d24-4fc3-ac1d-1a4dddf7f7c1'
            """))
            new_id = (await conn.execute(text("SELECT id FROM samples WHERE code = 'SPL-20251225-CP7'"))).scalar()
            await conn.execute(text(f"""
                UPDATE tasks SET sample_id = '{new_id}', updated_at = NOW()
                WHERE project_id = 'd8e49504-59db-491d-8063-6bf86553af2b'
                AND sample_id = 'fba02002-3d24-4fc3-ac1d-1a4dddf7f7c1'
            """))
            print("  ✓ CP7 创建并更新")
            
            # 验证
            print("\n" + "=" * 70)
            print("验证清洗结果...")
            print("=" * 70)
            
            result = await conn.execute(text("""
                SELECT COUNT(*) FROM tasks t
                JOIN samples s ON t.sample_id = s.id
                WHERE t.project_id != s.project_id
            """))
            after_count = result.scalar()
            
            result = await conn.execute(text("""
                SELECT COUNT(*) FROM samples WHERE code LIKE 'SPL-20251225-CP%'
            """))
            new_samples = result.scalar()
            
            print(f"\n✓ 清洗后不一致数: {after_count} (期望: 0)")
            print(f"✓ 新创建样品数: {new_samples} (期望: 7)")
            
            if after_count == 0 and new_samples == 7:
                print("\n" + "=" * 70)
                print("✅ 验证通过！事务将自动提交")
                print("=" * 70)
                return True
            else:
                raise Exception(f"验证失败: 不一致={after_count}, 新样品={new_samples}")
                
        except Exception as e:
            print(f"\n❌ 错误: {e}")
            print("事务将回滚")
            raise

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        print("\n🎉 Phase 4 数据清洗成功！")
    except Exception as e:
        print(f"\n⚠️ Phase 4 失败: {e}")
        sys.exit(1)
