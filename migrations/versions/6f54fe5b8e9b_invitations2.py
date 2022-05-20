"""invitations2

Revision ID: 6f54fe5b8e9b
Revises: ca4e025593c5
Create Date: 2022-03-27 21:18:50.783151

"""
import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision = "6f54fe5b8e9b"
down_revision = "ca4e025593c5"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "invitations",
        sa.Column("id", sa.Integer(), nullable=True),
        sa.Column("invitee_email", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("responded", sa.Boolean(), nullable=False),
        sa.Column("story_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["story_id"],
            ["stories.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.drop_column("player_orders", "invitation_accepted")


def downgrade():
    op.add_column(
        "player_orders",
        sa.Column(
            "invitation_accepted", sa.BOOLEAN(), autoincrement=False, nullable=False
        ),
    )
    op.drop_table("invitations")
