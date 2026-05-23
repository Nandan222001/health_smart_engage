"""create organization details table

Revision ID: 0005_create_organization_details_table
Revises: 0004_create_super_admin_table
Create Date: 2026-05-23 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0005_create_organization_details_table'
down_revision = '0004_create_super_admin_table'
branch_labels = None
depend_on = None


def upgrade() -> None:
    op.create_table(
        'organization_details',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organization.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organization_name', sa.String(length=255), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('industry_type', sa.String(length=100), nullable=True),
        sa.Column('subscription_plan', sa.String(length=100), nullable=True),
        sa.Column('governance_hierarchy', sa.String(length=255), nullable=True),
        sa.Column('knowledgebase_data_upload', sa.String(length=255), nullable=True),
        sa.Column('certifications', sa.JSON(), nullable=True),
        sa.Column('active_modules', sa.JSON(), nullable=True),
        sa.Column('sites', sa.Integer(), nullable=True),
        sa.Column('zones', sa.Integer(), nullable=True),
        sa.Column('total_active_workers', sa.Integer(), nullable=True),
        sa.Column('admin_count', sa.Integer(), nullable=True),
        sa.Column('site_engineers', sa.Integer(), nullable=True),
        sa.Column('site_inspectors', sa.Integer(), nullable=True),
        sa.Column('workers', sa.Integer(), nullable=True),
        sa.Column('contractors', sa.Integer(), nullable=True),
        sa.Column('shift_pattern', sa.String(length=100), nullable=True),
        sa.Column('high_risk_work_categories', sa.JSON(), nullable=True),
        sa.Column('permit_to_work', sa.Boolean(), nullable=True),
        sa.Column('daily_toolbox_talk', sa.Boolean(), nullable=True),
        sa.Column('onsite_clinic', sa.Boolean(), nullable=True),
        sa.Column('incident_frequency_rate', sa.String(length=50), nullable=True),
        sa.Column('last_audit_date', sa.Date(), nullable=True),
        sa.Column('evacuation_drill_cadence', sa.String(length=100), nullable=True),
        sa.Column('emergency_contact_name', sa.String(length=255), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=50), nullable=True),
        sa.Column('primary_admin_name', sa.String(length=255), nullable=True),
        sa.Column('admin_email', sa.String(length=255), nullable=True),
        sa.Column('admin_phone', sa.String(length=50), nullable=True),
        sa.Column('admin_designation', sa.String(length=100), nullable=True),
        sa.Column('target_go_live_date', sa.Date(), nullable=True),
        sa.Column('integration_needs', sa.String(length=255), nullable=True),
        sa.Column('training_plan', sa.Text(), nullable=True),
        sa.Column('additional_notes', sa.Text(), nullable=True),
        sa.Column('logo_url', sa.String(length=512), nullable=True),
        sa.Column('plan_kpi_limit', sa.String(length=50), nullable=True),
        sa.Column('kpi_selection', sa.String(length=255), nullable=True),
        sa.Column('custom_kpi', sa.String(length=255), nullable=True),
        sa.Column('critical_action_closure_sla_hours', sa.Integer(), nullable=True),
        sa.Column('standard_action_closure_sla_hours', sa.Integer(), nullable=True),
        sa.Column('kpi_reporting_cadence', sa.String(length=100), nullable=True),
        sa.Column('data_use_confirmed', sa.Boolean(), nullable=True),
        sa.Column('leadership_approved', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_organization_details_organization_id', 'organization_details', ['organization_id'])


def downgrade() -> None:
    op.drop_index('ix_organization_details_organization_id', table_name='organization_details')
    op.drop_table('organization_details')
