"""Add payment_transactions table for idempotency and audit logging

Revision ID: 004
Revises: 003
Create Date: 2026-07-26

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'payment_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('reference', sa.String(255), nullable=False, unique=True),
        sa.Column('plan', sa.String(50), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=True),
        sa.Column('currency', sa.String(10), nullable=True, server_default='USD'),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('flutterwave_id', sa.String(100), nullable=True),
        sa.Column('idempotency_key', sa.String(255), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True, server_default='{}'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reference'),
    )
    op.create_index('idx_payment_tx_reference', 'payment_transactions', ['reference'])
    op.create_index('idx_payment_tx_user', 'payment_transactions', ['user_id'])
    op.create_index('idx_payment_tx_status', 'payment_transactions', ['status'])
    op.create_index('idx_payment_tx_idempotency', 'payment_transactions', ['idempotency_key'])


def downgrade():
    op.drop_index('idx_payment_tx_idempotency')
    op.drop_index('idx_payment_tx_status')
    op.drop_index('idx_payment_tx_user')
    op.drop_index('idx_payment_tx_reference')
    op.drop_table('payment_transactions')