"""add_expense_categories_table - Move categories to dedicated table

Revision ID: e5f6g7h8i9j0
Revises: 7d28317fbfe1
Create Date: 2026-01-04 14:45:00.000000

Migration to:
1. Create expense_categories table
2. Seed 13 default categories (fixes ENTERAINMENT typo)
3. Migrate existing budget categories to foreign keys
4. Add referential integrity
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy import text

from alembic import op

revision: str = "e5f6g7h8i9j0"
down_revision: Union[str, None] = "7d28317fbfe1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Default categories to seed
DEFAULT_CATEGORIES = [
    "CHILDREN",
    "DAILY LIVING",
    "DEBT OBLIGATIONS",
    "ENTERTAINMENT",  # Fixed from ENTERAINMENT
    "ENTERTAINMENT & SUBSCRIPTIONS",
    "FLEXIBLE FAMILY SPENDING",
    "FLEXIBLE PERSONAL SPENDING",
    "HEALTH",
    "INVESTMENTS",
    "PERSONAL ESCROW",
    "RESERVES",
    "TRANSPORTATION",
    "UTILITY",
]


def upgrade() -> None:
    # Create expense_categories table
    op.create_table(
        "expense_categories",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_expense_categories_name"),
    )
    op.create_index("ix_expense_categories_name", "expense_categories", ["name"], unique=False)
    op.create_index(
        "ix_expense_categories_created_at",
        "expense_categories",
        ["created_at"],
        unique=False,
    )
    op.create_index("ix_expense_categories_id", "expense_categories", ["id"], unique=False)

    # Seed default categories
    conn = op.get_bind()
    for category in DEFAULT_CATEGORIES:
        conn.execute(
            text("INSERT INTO expense_categories (name, created_at) VALUES (:name, CURRENT_TIMESTAMP)"),
            {"name": category},
        )

    # Due to SQLite limitations, we'll do a table recreation approach
    # Create new budgets table with expense_category_id instead of expense_category
    conn.execute(
        text("""
        CREATE TABLE budgets_new (
            id INTEGER NOT NULL PRIMARY KEY,
            expense_type VARCHAR(20) NOT NULL,
            expense_category_id INTEGER NOT NULL,
            expense_label VARCHAR(200) NOT NULL,
            expense_label_note VARCHAR(500),
            budgeted FLOAT NOT NULL,
            is_accrual BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(expense_category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT
        )
        """)
    )

    # Migrate data: copy from old table, mapping expense_category string to ID
    # Handle the ENTERAINMENT -> ENTERTAINMENT typo
    # First, collect all unique categories from budgets
    result = conn.execute(text("SELECT DISTINCT expense_category FROM budgets"))
    budget_categories = [row[0] for row in result]

    # For each category, find or create the matching entry in expense_categories
    for budget_cat in budget_categories:
        # Map typo to correct name
        normalized_cat = "ENTERTAINMENT" if budget_cat == "ENTERAINMENT" else budget_cat

        # Check if this category exists in expense_categories
        check = conn.execute(
            text("SELECT id FROM expense_categories WHERE name = :name"), {"name": normalized_cat}
        ).first()

        if not check:
            # Category doesn't exist, insert it
            conn.execute(
                text("INSERT INTO expense_categories (name, created_at) VALUES (:name, CURRENT_TIMESTAMP)"),
                {"name": normalized_cat},
            )

    # Now migrate the budget data
    conn.execute(
        text("""
        INSERT INTO budgets_new (
            id, expense_type, expense_category_id, expense_label,
            expense_label_note, budgeted, is_accrual, created_at, updated_at
        )
        SELECT
            b.id,
            b.expense_type,
            ec.id,
            b.expense_label,
            b.expense_label_note,
            b.budgeted,
            b.is_accrual,
            b.created_at,
            b.updated_at
        FROM budgets b
        JOIN expense_categories ec ON ec.name = (
            CASE
                WHEN b.expense_category = 'ENTERAINMENT'
                THEN 'ENTERTAINMENT'
                ELSE b.expense_category
            END
        )
        """)
    )

    # Verify all budgets were migrated
    old_count = conn.execute(text("SELECT COUNT(*) FROM budgets")).scalar()
    new_count = conn.execute(text("SELECT COUNT(*) FROM budgets_new")).scalar()

    if old_count != new_count:
        raise Exception(
            f"Data migration failed: {old_count} budgets in old table but {new_count} in new table. "
            "This may indicate invalid category values."
        )

    # Drop old table and rename new one
    conn.execute(text("DROP TABLE budgets"))
    conn.execute(text("ALTER TABLE budgets_new RENAME TO budgets"))

    # Create indices (the table recreation doesn't preserve them)
    op.create_index("ix_budgets_id", "budgets", ["id"], unique=False)
    op.create_index("ix_budgets_expense_type", "budgets", ["expense_type"], unique=False)
    op.create_index(
        "ix_budgets_expense_category_id",
        "budgets",
        ["expense_category_id"],
        unique=False,
    )
    op.create_index(
        "ix_budgets_type_category",
        "budgets",
        ["expense_type", "expense_category_id"],
        unique=False,
    )


def downgrade() -> None:
    # Drop all indices we created
    op.drop_index("ix_budgets_type_category", table_name="budgets")
    op.drop_index("ix_budgets_expense_category_id", table_name="budgets")
    op.drop_index("ix_budgets_expense_type", table_name="budgets")
    op.drop_index("ix_budgets_id", table_name="budgets")

    # Recreate old budgets table with expense_category VARCHAR
    conn = op.get_bind()
    conn.execute(
        text("""
        CREATE TABLE budgets_old (
            id INTEGER NOT NULL PRIMARY KEY,
            expense_type VARCHAR(20) NOT NULL,
            expense_category VARCHAR(100) NOT NULL,
            expense_label VARCHAR(200) NOT NULL,
            expense_label_note VARCHAR(500),
            budgeted FLOAT NOT NULL,
            is_accrual BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """)
    )

    # Migrate data back: join category names back
    conn.execute(
        text("""
        INSERT INTO budgets_old (
            id, expense_type, expense_category, expense_label,
            expense_label_note, budgeted, is_accrual, created_at, updated_at
        )
        SELECT
            b.id,
            b.expense_type,
            ec.name,
            b.expense_label,
            b.expense_label_note,
            b.budgeted,
            b.is_accrual,
            b.created_at,
            b.updated_at
        FROM budgets b
        JOIN expense_categories ec ON ec.id = b.expense_category_id
        """)
    )

    # Drop new table and rename old one
    conn.execute(text("DROP TABLE budgets"))
    conn.execute(text("ALTER TABLE budgets_old RENAME TO budgets"))

    # Restore old indices
    op.create_index("ix_budgets_id", "budgets", ["id"], unique=False)
    op.create_index("ix_budgets_expense_type", "budgets", ["expense_type"], unique=False)
    op.create_index("ix_budgets_expense_category", "budgets", ["expense_category"], unique=False)
    op.create_index(
        "ix_budgets_type_category",
        "budgets",
        ["expense_type", "expense_category"],
        unique=False,
    )

    # Drop expense_categories table and indices
    op.drop_index("ix_expense_categories_id", table_name="expense_categories")
    op.drop_index("ix_expense_categories_created_at", table_name="expense_categories")
    op.drop_index("ix_expense_categories_name", table_name="expense_categories")
    op.drop_table("expense_categories")
