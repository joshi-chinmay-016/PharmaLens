"""create_investigation_audit_logs

Revision ID: c494fa13f499
Revises: 8e696d6552c4
Create Date: 2026-10-23 16:18:15.771272

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c494fa13f499'
down_revision: Union[str, None] = '8e696d6552c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'investigation_audit_logs' not in tables:
        op.create_table(
            'investigation_audit_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('investigation_id', sa.Integer(), nullable=False),
            sa.Column('event_type', sa.String(length=60), nullable=False),
            sa.Column('actor', sa.String(length=100), nullable=False, server_default='QA Lead Investigator'),
            sa.Column('entity_type', sa.String(length=50), nullable=True),
            sa.Column('entity_id', sa.String(length=100), nullable=True),
            sa.Column('action_summary', sa.Text(), nullable=False),
            sa.Column('details_json', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['investigation_id'], ['investigations.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_investigation_audit_logs_id'), 'investigation_audit_logs', ['id'], unique=False)
        op.create_index(op.f('ix_investigation_audit_logs_investigation_id'), 'investigation_audit_logs', ['investigation_id'], unique=False)
        op.create_index(op.f('ix_investigation_audit_logs_event_type'), 'investigation_audit_logs', ['event_type'], unique=False)
        op.create_index(op.f('ix_investigation_audit_logs_created_at'), 'investigation_audit_logs', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_investigation_audit_logs_created_at'), table_name='investigation_audit_logs')
    op.drop_index(op.f('ix_investigation_audit_logs_event_type'), table_name='investigation_audit_logs')
    op.drop_index(op.f('ix_investigation_audit_logs_investigation_id'), table_name='investigation_audit_logs')
    op.drop_index(op.f('ix_investigation_audit_logs_id'), table_name='investigation_audit_logs')
    op.drop_table('investigation_audit_logs')
