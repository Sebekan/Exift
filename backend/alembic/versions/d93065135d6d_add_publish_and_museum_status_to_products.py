"""add is_published and museum_status to products

Revision ID: d93065135d6d
Revises: 2331e09e138d
Create Date: 2026-08-14 00:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd93065135d6d'
down_revision: Union[str, None] = '2331e09e138d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column("products", sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("products", sa.Column("museum_status", sa.String(length=20), nullable=False, server_default="none"))
    op.alter_column("products", "is_published", server_default=None)
    op.alter_column("products", "museum_status", server_default=None)


def downgrade() -> None:
    op.drop_column("products", "museum_status")
    op.drop_column("products", "is_published")
