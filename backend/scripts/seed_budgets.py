#!/usr/bin/env python3
"""
Seed database with budget data from mockBudgetData.ts.

This script imports the 41 budget entries from the frontend mock data
into the SQLite database, excluding calculated fields (spent, remaining, percentage).

Run with: python backend/scripts/seed_budgets.py
"""

import logging

# Add project root to path for imports
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.app.db.database import SessionLocal  # noqa: E402
from backend.app.db.models.budget import Budget  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def infer_is_investment(expense_category: str) -> bool:
    return "INVEST" in expense_category.strip().upper()

# Mock budget data extracted from src/features/budget/services/mockBudgetData.ts
# Includes: id, expenseType, expenseCategory, expenseLabel, budgeted, isAccrual
# Excludes: spent, remaining, percentage (calculated fields)
MOCK_BUDGETS = [
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "CHILDREN",
        "expense_label": "ALL THINGS DAISY",
        "budgeted": 400,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "CHILDREN",
        "expense_label": "DAY CARE",
        "budgeted": 1500,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "DAILY LIVING",
        "expense_label": "GROCERIES",
        "budgeted": 1200,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "DEBT OBLIGATIONS",
        "expense_label": "CAR LOAN",
        "budgeted": 450,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "DEBT OBLIGATIONS",
        "expense_label": "FEES",
        "budgeted": 100,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "DEBT OBLIGATIONS",
        "expense_label": "MORTGAGE",
        "budgeted": 2500,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "ENTERAINMENT",
        "expense_label": "DAISY ACTIVITIES",
        "budgeted": 200,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "ENTERAINMENT",
        "expense_label": "MEMBERSHIPS",
        "budgeted": 150,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "ENTERTAINMENT & SUBSCRIPTIONS",
        "expense_label": "SUB - AMAZON PRIME",
        "budgeted": 15,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "ENTERTAINMENT & SUBSCRIPTIONS",
        "expense_label": "SUB - APPLE CARE IPHONE",
        "budgeted": 10,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "ENTERTAINMENT & SUBSCRIPTIONS",
        "expense_label": "SUB - APPLE FAMILY PLAN",
        "budgeted": 20,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "ENTERTAINMENT & SUBSCRIPTIONS",
        "expense_label": "SUB - COSTCO",
        "budgeted": 10,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "ENTERTAINMENT & SUBSCRIPTIONS",
        "expense_label": "SUB - DISNEY+",
        "budgeted": 12,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "ENTERTAINMENT & SUBSCRIPTIONS",
        "expense_label": "SUB - NETFLIX",
        "budgeted": 18,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "ENTERTAINMENT & SUBSCRIPTIONS",
        "expense_label": "SUB - TESLA NAVIGATION",
        "budgeted": 10,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "ENTERTAINMENT & SUBSCRIPTIONS",
        "expense_label": "SUB - YOUTUBE PREMIUM",
        "budgeted": 12,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "FLEXIBLE FAMILY SPENDING",
        "expense_label": "BABYSITTING",
        "budgeted": 200,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "FLEXIBLE FAMILY SPENDING",
        "expense_label": "CLEANING SERVICE",
        "budgeted": 300,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "FLEXIBLE FAMILY SPENDING",
        "expense_label": "FOOD & DRINK",
        "budgeted": 400,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "FLEXIBLE FAMILY SPENDING",
        "expense_label": "GIFTS",
        "budgeted": 250,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "FLEXIBLE FAMILY SPENDING",
        "expense_label": "HOME SHOPPING",
        "budgeted": 300,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "FLEXIBLE FAMILY SPENDING",
        "expense_label": "TRAVEL",
        "budgeted": 800,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "FLEXIBLE FAMILY SPENDING",
        "expense_label": "WEDDINGS",
        "budgeted": 500,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "FLEXIBLE PERSONAL SPENDING",
        "expense_label": "ANGELA",
        "budgeted": 300,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "FLEXIBLE PERSONAL SPENDING",
        "expense_label": "MARTY",
        "budgeted": 300,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "HEALTH",
        "expense_label": "HEALTH & WELLNESS",
        "budgeted": 250,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "INVESTMENTS",
        "expense_label": "529A",
        "budgeted": 500,
        "is_accrual": False,
    },
    {
        "expense_type": "FUNSIES",
        "expense_category": "INVESTMENTS",
        "expense_label": "ADDITIONAL MORTGAGE PAYMENT",
        "budgeted": 1000,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "PERSONAL ESCROW",
        "expense_label": "CAR INSURANCE",
        "budgeted": 200,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "PERSONAL ESCROW",
        "expense_label": "HOME INSURANCE",
        "budgeted": 150,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "PERSONAL ESCROW",
        "expense_label": "PROPERTY TAXES",
        "budgeted": 600,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "RESERVES",
        "expense_label": "RESERVES",
        "budgeted": 1000,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "TRANSPORTATION",
        "expense_label": "GAS",
        "budgeted": 300,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "TRANSPORTATION",
        "expense_label": "VEHICLE REGISTRATION",
        "budgeted": 100,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "TRANSPORTATION",
        "expense_label": "WORK TRANSPORTATION",
        "budgeted": 200,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "UTILITY",
        "expense_label": "UTILS - ELECTRICITY",
        "budgeted": 150,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "UTILITY",
        "expense_label": "UTILS - GAS",
        "budgeted": 80,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "UTILITY",
        "expense_label": "UTILS - INTERNET",
        "budgeted": 100,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "UTILITY",
        "expense_label": "UTILS - PHONE",
        "budgeted": 120,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "UTILITY",
        "expense_label": "UTILS - TRASH",
        "budgeted": 50,
        "is_accrual": False,
    },
    {
        "expense_type": "ESSENTIAL",
        "expense_category": "UTILITY",
        "expense_label": "UTILS - WATER/SEWER",
        "budgeted": 90,
        "is_accrual": False,
    },
]


def seed_budgets() -> None:
    """
    Seed the database with mock budget entries.

    Clears existing budgets and inserts fresh data from MOCK_BUDGETS.
    """
    db = SessionLocal()
    try:
        # Clear existing budgets
        deleted_count = db.query(Budget).delete()
        if deleted_count > 0:
            logger.info(f"Cleared {deleted_count} existing budget entries")

        # Insert mock data
        for data in MOCK_BUDGETS:
            budget = Budget(
                **data,
                is_investment=infer_is_investment(data["expense_category"]),
            )
            db.add(budget)

        db.commit()
        logger.info(f"✅ Successfully seeded {len(MOCK_BUDGETS)} budget entries")

        # Verify
        count = db.query(Budget).count()
        logger.info(f"Verification: {count} budgets in database")

    except Exception as e:
        logger.error(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_budgets()
