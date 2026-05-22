"""create organization table

Revision ID: 0002
Revises: 
Create Date: 2026-05-22
"""

from alembic import op
import sqlalchemy as sa

revision = '0002'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'organization',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('organization_code', sa.String(50), nullable=False, unique=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_org_email', 'organization', ['email'])
    op.create_index('idx_org_code', 'organization', ['organization_code'])

def downgrade():
    op.drop_table('organization')