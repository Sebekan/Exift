"""add email verification fields to users

Revision ID: 2331e09e138d
Revises: 608fdff86eb2
Create Date: 2026-08-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2331e09e138d'
down_revision: Union[str, None] = '608fdff86eb2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column("users", sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("verification_token", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column("verification_token_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.create_unique_constraint("uq_users_verification_token", "users", ["verification_token"])
    op.alter_column("users", "is_verified", server_default=None)


def downgrade() -> None:
    op.drop_constraint("uq_users_verification_token", "users", type_="unique")
    op.drop_column("users", "verification_token_expires_at")
    op.drop_column("users", "verification_token")
    op.drop_column("users", "is_verified")
