"""add ping_scan to task types

Revision ID: 9b27010ba04d
Revises: 
Create Date: 2025-12-17 17:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9b27010ba04d'
down_revision = None  # Will be updated after we find the last revision
depends_on = None


def upgrade() -> None:
    """Add ping_scan and other missing task types to chk_task_type constraint"""
    
    # Drop the existing constraint
    op.execute('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS chk_task_type')
    
    # Add new constraint with ALL task types including existing ones
    op.execute("""
        ALTER TABLE tasks ADD CONSTRAINT chk_task_type
          CHECK (type IN (
              'ping_scan',
              'nmap_scan',
              'vuln_scan',
              'firmware_analysis',
              'fuzzing',
              'pentest',
              'protocol_test',
              'wifi_security',
              'ai_security',
              'privacy_test',
              'data_security'
          ))
    """)


def downgrade() -> None:
    """Revert to original task types (without ping_scan)"""
    
    op.execute('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS chk_task_type')
    
    # Restore original constraint without ping_scan
    op.execute("""
        ALTER TABLE tasks ADD CONSTRAINT chk_task_type
          CHECK (type IN (
              'nmap_scan',
              'vuln_scan',
              'firmware_analysis',
              'fuzzing',
              'protocol_test',
              'wifi_security',
              'ai_security',
              'privacy_test',
              'data_security'
          ))
    """)
