"""Phase 5: Add sample project constraints

Revision ID: phase5_20251225
Revises: 202512251400
Create Date: 2025-12-25 21:05:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'phase5_20251225'
down_revision = '202512251400'
branch_labels = None
depends_on = None

def upgrade():
    """
    Phase 5: 添加样品-项目约束
    
    1. 将 samples.project_id 改为 NOT NULL
    2. 修改外键为 CASCADE 删除
    3. 添加索引
    4. 创建触发器防止跨项目引用
    """
    
    # 1. 修改 samples.project_id 为 NOT NULL
    # 注意：Phase 4已清洗数据，所有样品都有project_id
    op.alter_column('samples', 'project_id',
                    existing_type=sa.UUID(),
                    nullable=False)
    
    # 2. 修改外键为 CASCADE 删除
    op.drop_constraint('samples_project_id_fkey', 'samples', type_='foreignkey')
    op.create_foreign_key(
        'samples_project_id_fkey',
        'samples', 'projects',
        ['project_id'], ['id'],
        ondelete='CASCADE'
    )
    
    # 3. 添加索引（如果不存在）
    # 注意：某些索引可能已存在，使用if_not_exists
    try:
        op.create_index('idx_samples_project', 'samples', ['project_id'], unique=False)
    except:
        pass  # 索引可能已存在
    
    try:
        op.create_index('idx_tasks_project', 'tasks', ['project_id'], unique=False)
    except:
        pass
    
    try:
        op.create_index('idx_tasks_sample', 'tasks', ['sample_id'], unique=False)
    except:
        pass
    
    # 4. 创建PostgreSQL触发器函数
    op.execute("""
        CREATE OR REPLACE FUNCTION check_task_sample_project()
        RETURNS TRIGGER AS $$
        BEGIN
            -- 如果任务有关联样品
            IF NEW.sample_id IS NOT NULL THEN
                -- 检查样品是否属于同一项目
                IF NOT EXISTS (
                    SELECT 1 FROM samples 
                    WHERE id = NEW.sample_id 
                    AND project_id = NEW.project_id
                ) THEN
                    RAISE EXCEPTION 'Task sample must belong to the same project. Task project: %, Sample project: %',
                        NEW.project_id,
                        (SELECT project_id FROM samples WHERE id = NEW.sample_id);
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # 5. 创建触发器
    op.execute("""
        CREATE TRIGGER task_sample_project_check
        BEFORE INSERT OR UPDATE ON tasks
        FOR EACH ROW EXECUTE FUNCTION check_task_sample_project();
    """)
    
    print("✅ Phase 5: 数据库约束添加complete!")

def downgrade():
    """回滚 Phase 5 的更改"""
    
    # 删除触发器
    op.execute("DROP TRIGGER IF EXISTS task_sample_project_check ON tasks")
    
    # 删除触发器函数
    op.execute("DROP FUNCTION IF EXISTS check_task_sample_project()")
    
    # 删除索引
    try:
        op.drop_index('idx_tasks_sample', 'tasks')
    except:
        pass
    
    try:
        op.drop_index('idx_tasks_project', 'tasks')
    except:
        pass
    
    try:
        op.drop_index('idx_samples_project', 'samples')
    except:
        pass
    
    # 恢复外键（移除CASCADE）
    op.drop_constraint('samples_project_id_fkey', 'samples', type_='foreignkey')
    op.create_foreign_key(
        'samples_project_id_fkey',
        'samples', 'projects',
        ['project_id'], ['id']
    )
    
    # 恢复 nullable=True
    op.alter_column('samples', 'project_id',
                    existing_type=sa.UUID(),
                    nullable=True)
