"""enhance_report_model_with_metadata_fields

Revision ID: 202512251400
Revises: 
Create Date: 2025-12-25 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '202512251400'
down_revision = '9b27010ba04d'  # Reference to previous migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add client and testing organization fields
    op.add_column('reports', sa.Column('client_company', sa.String(length=200), nullable=True))
    op.add_column('reports', sa.Column('client_contact', sa.String(length=100), nullable=True))
    op.add_column('reports', sa.Column('client_address', sa.String(length=300), nullable=True))
    op.add_column('reports', sa.Column('testing_organization', sa.String(length=200), nullable=True))
    
    # Add test object information fields
    op.add_column('reports', sa.Column('product_name', sa.String(length=200), nullable=True))
    op.add_column('reports', sa.Column('product_model', sa.String(length=100), nullable=True))
    op.add_column('reports', sa.Column('manufacturer', sa.String(length=200), nullable=True))
    op.add_column('reports', sa.Column('manufacturer_address', sa.String(length=300), nullable=True))
    op.add_column('reports', sa.Column('sample_info', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    
    # Add test standards and scope fields
    op.add_column('reports', sa.Column('test_standards', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('reports', sa.Column('test_scope', sa.Text(), nullable=True))
    op.add_column('reports', sa.Column('test_methodology', sa.Text(), nullable=True))
    op.add_column('reports', sa.Column('test_limitations', sa.Text(), nullable=True))
    op.add_column('reports', sa.Column('test_period_start', sa.DateTime(timezone=True), nullable=True))
    op.add_column('reports', sa.Column('test_period_end', sa.DateTime(timezone=True), nullable=True))
    
    # Add conclusion fields
    op.add_column('reports', sa.Column('security_rating', sa.String(length=20), nullable=True))
    op.add_column('reports', sa.Column('compliance_status', sa.String(length=50), nullable=True))
    op.add_column('reports', sa.Column('certification_recommendation', sa.Text(), nullable=True))
    op.add_column('reports', sa.Column('conclusion', sa.Text(), nullable=True))
    
    # Add signature tracking fields
    op.add_column('reports', sa.Column('tester_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('reports', sa.Column('approver_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Create foreign keys
    op.create_foreign_key('fk_reports_tester_id', 'reports', 'users', ['tester_id'], ['id'])
    op.create_foreign_key('fk_reports_approver_id', 'reports', 'users', ['approver_id'], ['id'])
    
    # Add check constraints
    op.create_check_constraint(
        'chk_report_security_rating',
        'reports',
        "security_rating IN ('excellent', 'good', 'fair', 'poor') OR security_rating IS NULL"
    )
    op.create_check_constraint(
        'chk_report_compliance_status',
        'reports',
        "compliance_status IN ('pass', 'fail', 'conditional_pass') OR compliance_status IS NULL"
    )
    
    # Add indexes
    op.create_index('idx_reports_compliance', 'reports', ['compliance_status'], unique=False)


def downgrade() -> None:
    # Remove indexes
    op.drop_index('idx_reports_compliance', table_name='reports')
    
    # Remove check constraints
    op.drop_constraint('chk_report_compliance_status', 'reports', type_='check')
    op.drop_constraint('chk_report_security_rating', 'reports', type_='check')
    
    # Remove foreign keys
    op.drop_constraint('fk_reports_approver_id', 'reports', type_='foreignkey')
    op.drop_constraint('fk_reports_tester_id', 'reports', type_='foreignkey')
    
    # Remove columns
    op.drop_column('reports', 'approver_id')
    op.drop_column('reports', 'tester_id')
    op.drop_column('reports', 'conclusion')
    op.drop_column('reports', 'certification_recommendation')
    op.drop_column('reports', 'compliance_status')
    op.drop_column('reports', 'security_rating')
    op.drop_column('reports', 'test_period_end')
    op.drop_column('reports', 'test_period_start')
    op.drop_column('reports', 'test_limitations')
    op.drop_column('reports', 'test_methodology')
    op.drop_column('reports', 'test_scope')
    op.drop_column('reports', 'test_standards')
    op.drop_column('reports', 'sample_info')
    op.drop_column('reports', 'manufacturer_address')
    op.drop_column('reports', 'manufacturer')
    op.drop_column('reports', 'product_model')
    op.drop_column('reports', 'product_name')
    op.drop_column('reports', 'testing_organization')
    op.drop_column('reports', 'client_address')
    op.drop_column('reports', 'client_contact')
    op.drop_column('reports', 'client_company')
