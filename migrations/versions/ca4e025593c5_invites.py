"""invites

Revision ID: ca4e025593c5
Revises: 2ec8b84d5cce
Create Date: 2022-03-24 00:37:32.589585

"""
import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision = "ca4e025593c5"
down_revision = "2ec8b84d5cce"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "player_orders", sa.Column("invitation_accepted", sa.Boolean(), nullable=False)
    )
    op.add_column("story_segments", sa.Column("order", sa.Integer(), nullable=False))


def downgrade():
    op.drop_column("story_segments", "order")
    op.drop_column("player_orders", "invitation_accepted")
