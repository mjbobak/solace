"""
Restoration script to restore budget data from backup files.

This script:
1. Ensures database schema is created (via init_db)
2. Restores backed-up expense_categories and budgets

Usage:
    python backend/app/db/restore_from_backup.py
"""

import json
from pathlib import Path

from sqlalchemy import text

# Database path
DB_PATH = Path(__file__).parent.parent.parent.parent / "backend" / "data" / "database.db"
BACKUP_DIR = Path(__file__).parent.parent.parent.parent / "backend" / "data" / "backups"


def ensure_schema():
    """Ensure database schema is created."""
    print("Step 1: Ensuring database schema exists...")

    # Delete empty database file if it exists
    if DB_PATH.exists() and DB_PATH.stat().st_size == 0:
        DB_PATH.unlink()
        print("  ✓ Removed empty database file")

    # Import init_db to trigger schema creation
    from backend.app.db.init_db import init_db

    init_db()
    print("  ✓ Database schema created with budget_id column")


def restore_data():
    """Restore backed-up data from JSON files."""
    print("\nStep 2: Restoring data from backups...")

    # Find the most recent backup files
    backup_files = sorted(BACKUP_DIR.glob("expense_categories_*.json"))
    if not backup_files:
        raise FileNotFoundError("No expense_categories backup files found")

    latest_categories_file = backup_files[-1]
    backup_files = sorted(BACKUP_DIR.glob("budgets_*.json"))
    if not backup_files:
        raise FileNotFoundError("No budgets backup files found")

    latest_budgets_file = backup_files[-1]

    print(f"  Using backups from: {latest_categories_file.name}")

    # Connect to database
    from backend.app.db.database import SessionLocal

    session = SessionLocal()

    # Restore expense_categories first (FK dependency)
    with open(latest_categories_file, "r") as f:
        categories = json.load(f)

    for cat in categories:
        session.execute(
            text(
                """
            INSERT INTO expense_categories (id, name, created_at)
            VALUES (:id, :name, :created_at)
        """
            ),
            cat,
        )

    session.commit()
    print(f"  ✓ Restored {len(categories)} expense categories")

    # Restore budgets
    with open(latest_budgets_file, "r") as f:
        budgets = json.load(f)

    for budget in budgets:
        session.execute(
            text(
                """
            INSERT INTO budgets (
                id, expense_type, expense_category_id, expense_label,
                expense_label_note, budgeted, is_accrual, created_at, updated_at
            )
            VALUES (
                :id, :expense_type, :expense_category_id, :expense_label,
                :expense_label_note, :budgeted, :is_accrual, :created_at, :updated_at
            )
        """
            ),
            budget,
        )

    session.commit()
    print(f"  ✓ Restored {len(budgets)} budgets")

    session.close()


def verify_data():
    """Verify restored data integrity."""
    print("\nStep 3: Verifying data integrity...")

    from backend.app.db.database import SessionLocal

    session = SessionLocal()

    # Check expense_categories count
    cat_count = session.execute(text("SELECT COUNT(*) FROM expense_categories")).scalar()
    print(f"  ✓ Expense categories count: {cat_count}")

    # Check budgets count
    budget_count = session.execute(text("SELECT COUNT(*) FROM budgets")).scalar()
    print(f"  ✓ Budgets count: {budget_count}")

    # Check transactions table has budget_id column
    columns = session.execute(text("PRAGMA table_info(transactions)")).fetchall()
    has_budget_id = any(col[1] == "budget_id" for col in columns)

    if has_budget_id:
        print("  ✓ transactions.budget_id column exists")
    else:
        print("  ✗ ERROR: transactions.budget_id column missing!")
        session.close()
        return False

    session.close()
    return True


def main():
    """Run the restoration."""
    print("=" * 60)
    print("DATABASE RESTORATION: Restore Budgets from Backup")
    print("=" * 60)

    try:
        # Step 1: Ensure schema
        ensure_schema()

        # Step 2: Restore data
        restore_data()

        # Step 3: Verify
        success = verify_data()

        if success:
            print("\n" + "=" * 60)
            print("✓ RESTORATION COMPLETED SUCCESSFULLY")
            print("=" * 60)
            print("\nNext steps:")
            print("1. Restart your backend server")
            print("2. Navigate to the Spending page")
            print("3. Verify budget data is intact and transactions load")
        else:
            print("\n" + "=" * 60)
            print("✗ RESTORATION FAILED - Please check errors above")
            print("=" * 60)

    except Exception as e:
        print(f"\n✗ ERROR during restoration: {e}")
        print("\nBackup files are safe in:", BACKUP_DIR)
        import traceback

        traceback.print_exc()
        raise


if __name__ == "__main__":
    main()
