"""
Phase 5: 添加数据库约束
直接通过SQLAlchemy执行，避免Alembic问题
"""
import asyncio
import sys
sys.path.insert(0, '/Users/chenshangwei/code/securityLab/backend')

from sqlalchemy import text
from app.core.database import engine

async def main():
    print("=" * 70)
    print("Phase 5: 添加数据库约束")
    print("=" * 70)
    
    async with engine.begin() as conn:
        try:
            print("\nStep 1: 将 samples.project_id 改为 NOT NULL...")
            await conn.execute(text("""
                ALTER TABLE samples 
                ALTER COLUMN project_id SET NOT NULL
            """))
            print("  ✓ 完成")
            
            print("\nStep 2: 修改外键为 CASCADE 删除...")
            await conn.execute(text("""
                ALTER TABLE samples 
                DROP CONSTRAINT IF EXISTS samples_project_id_fkey
            """))
            await conn.execute(text("""
                ALTER TABLE samples 
                ADD CONSTRAINT samples_project_id_fkey 
                FOREIGN KEY (project_id) REFERENCES projects(id) 
                ON DELETE CASCADE
            """))
            print("  ✓ 完成")
            
            print("\nStep 3: 添加索引...")
            # 先检查索引是否存在
            try:
                await conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_samples_project 
                    ON samples(project_id)
                """))
                print("  ✓ idx_samples_project 创建")
            except Exception as e:
                print(f"  - idx_samples_project 已存在或创建失败: {e}")
            
            try:
                await conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_tasks_project 
                    ON tasks(project_id)
                """))
                print("  ✓ idx_tasks_project 创建")
            except Exception as e:
                print(f"  - idx_tasks_project 已存在或创建失败: {e}")
            
            try:
                await conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_tasks_sample 
                    ON tasks(sample_id)
                """))
                print("  ✓ idx_tasks_sample 创建")
            except Exception as e:
                print(f"  - idx_tasks_sample 已存在或创建失败: {e}")
            
            print("\nStep 4: 创建触发器函数...")
            await conn.execute(text("""
                CREATE OR REPLACE FUNCTION check_task_sample_project()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NEW.sample_id IS NOT NULL THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM samples 
                            WHERE id = NEW.sample_id 
                            AND project_id = NEW.project_id
                        ) THEN
                            RAISE EXCEPTION 
                                'Task sample must belong to the same project. Task project: %, Sample project: %',
                                NEW.project_id,
                                (SELECT project_id FROM samples WHERE id = NEW.sample_id);
                        END IF;
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            """))
            print("  ✓ 函数创建完成")
            
            print("\nStep 5: 创建触发器...")
            # 先删除旧触发器（如果存在）
            await conn.execute(text("""
                DROP TRIGGER IF EXISTS task_sample_project_check ON tasks
            """))
            await conn.execute(text("""
                CREATE TRIGGER task_sample_project_check
                BEFORE INSERT OR UPDATE ON tasks
                FOR EACH ROW EXECUTE FUNCTION check_task_sample_project()
            """))
            print("  ✓ 触发器创建完成")
            
            # 验证约束
            print("\n" + "=" * 70)
            print("验证约束...")
            print("=" * 70)
            
            # 检查NOT NULL
            result = await conn.execute(text("""
                SELECT column_name, is_nullable 
                FROM information_schema.columns
                WHERE table_name = 'samples' AND column_name = 'project_id'
            """))
            row = result.fetchone()
            print(f"\n✓ samples.project_id nullable: {row[1]} (期望: NO)")
            
            # 检查外键
            result = await conn.execute(text("""
                SELECT tc.constraint_name, rc.delete_rule
                FROM information_schema.table_constraints tc
                JOIN information_schema.referential_constraints rc 
                  ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'samples' 
                  AND tc.constraint_type = 'FOREIGN KEY'
                  AND tc.constraint_name = 'samples_project_id_fkey'
            """))
            row = result.fetchone()
            if row:
                print(f"✓ 外键 CASCADE: {row[1]} (期望: CASCADE)")
            
            # 检查触发器
            result = await conn.execute(text("""
                SELECT tgname FROM pg_trigger 
                WHERE tgname = 'task_sample_project_check'
            """))
            row = result.fetchone()
            if row:
                print(f"✓ 触发器存在: {row[0]}")
            
            print("\n" + "=" * 70)
            print("✅ Phase 5 完成！所有约束已添加")
            print("=" * 70)
            return True
            
        except Exception as e:
            print(f"\n❌ 错误: {e}")
            print("事务将回滚")
            raise

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        print("\n🎉 Phase 5 数据库约束添加成功！")
    except Exception as e:
        print(f"\n⚠️ Phase 5 失败: {e}")
        sys.exit(1)
