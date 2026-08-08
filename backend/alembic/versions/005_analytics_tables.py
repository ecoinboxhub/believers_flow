"""Add analytics aggregation tables

Revision ID: 005
Revises: 004
Create Date: 2026-07-26

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'analytics_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('event_data', postgresql.JSONB(), nullable=True, server_default='{}'),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_analytics_events_type', 'analytics_events', ['event_type'])
    op.create_index('idx_analytics_events_user', 'analytics_events', ['user_id'])
    op.create_index('idx_analytics_events_created', 'analytics_events', ['created_at'])

    op.create_table(
        'analytics_daily',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('metric', sa.String(100), nullable=False),
        sa.Column('value', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('metadata', postgresql.JSONB(), nullable=True, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('date', 'metric', name='uq_analytics_daily_date_metric'),
    )
    op.create_index('idx_analytics_daily_date', 'analytics_daily', ['date', 'metric'])


def downgrade():
    op.drop_index('idx_analytics_daily_date')
    op.drop_table('analytics_daily')
    op.drop_index('idx_analytics_events_created')
    op.drop_index('idx_analytics_events_user')
    op.drop_index('idx_analytics_events_type')
    op.drop_table('analytics_events')