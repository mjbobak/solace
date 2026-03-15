#!/usr/bin/env python3
"""
Seed categorization rules for auto-assigning budget IDs to transactions.

Rules are matched against transaction descriptions (case-insensitive).
Pattern types:
  - "contains":    pattern appears anywhere in description
  - "startswith":  description starts with pattern
  - "exact":       description exactly equals pattern

Priority: higher number = checked first (default 0).
First matching rule wins per transaction.

Run with: python backend/scripts/seed_categorization_rules.py
"""

import logging
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.app.db.database import SessionLocal  # noqa: E402
from backend.app.db.models.budget import Budget  # noqa: E402
from backend.app.db.models.categorization_rule import CategorizationRule  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Rules: each entry maps a description pattern to a budget expense_label.
# The seed script resolves expense_label → budget_id at runtime.
#
# pattern_type options: "contains" (default), "startswith", "exact"
# priority: higher = checked first (use higher values for more specific rules)
RULES = [
    # --- ENTERTAINMENT & SUBSCRIPTIONS ---
    {"pattern": "NETFLIX", "expense_label": "SUB - NETFLIX"},
    {"pattern": "AMAZON PRIME", "expense_label": "SUB - AMAZON PRIME"},
    {"pattern": "AMAZON DIGITAL", "expense_label": "SUB - AMAZON PRIME"},
    {"pattern": "PRIMEVIDEO", "expense_label": "SUB - AMAZON PRIME"},
    {"pattern": "YOUTUBE PREMIUM", "expense_label": "SUB - YOUTUBE PREMIUM"},
    {"pattern": "YOUTUBE.COM/MUSIC", "expense_label": "SUB - YOUTUBE PREMIUM"},
    {"pattern": "DISNEY PLUS", "expense_label": "SUB - DISNEY+"},
    {"pattern": "DISNEY+", "expense_label": "SUB - DISNEY+"},
    {"pattern": "COSTCO MEMBERSHIP", "expense_label": "SUB - COSTCO", "priority": 10},
    {"pattern": "APPLE.COM/BILL", "expense_label": "SUB - APPLE FAMILY PLAN"},
    {"pattern": "TESLA PREMIUM", "expense_label": "SUB - TESLA NAVIGATION"},
    # --- DAILY LIVING ---
    {"pattern": "TRADER JOE", "expense_label": "GROCERIES"},
    {"pattern": "WHOLE FOODS", "expense_label": "GROCERIES"},
    {"pattern": "COSTCO WHSE", "expense_label": "GROCERIES"},
    {"pattern": "COSTCO GAS", "expense_label": "GAS", "priority": 10},  # Before general COSTCO
    {"pattern": "SAFEWAY", "expense_label": "GROCERIES"},
    {"pattern": "KROGER", "expense_label": "GROCERIES"},
    {"pattern": "SPROUTS", "expense_label": "GROCERIES"},
    {"pattern": "RALPH'S", "expense_label": "GROCERIES"},
    {"pattern": "RALPHS", "expense_label": "GROCERIES"},
    {"pattern": "VONS", "expense_label": "GROCERIES"},
    {"pattern": "ALDI", "expense_label": "GROCERIES"},
    # --- TRANSPORTATION / GAS ---
    {"pattern": "SHELL OIL", "expense_label": "GAS"},
    {"pattern": "CHEVRON", "expense_label": "GAS"},
    {"pattern": "ARCO", "expense_label": "GAS"},
    {"pattern": "BP#", "expense_label": "GAS"},
    {"pattern": "EXXON", "expense_label": "GAS"},
    {"pattern": "MOBIL", "expense_label": "GAS"},
    {"pattern": "76 ", "expense_label": "GAS"},
    {"pattern": "CIRCLE K", "expense_label": "GAS"},
    {"pattern": "SPEEDWAY", "expense_label": "GAS"},
    {"pattern": "WAWA", "expense_label": "GAS"},
    # --- UTILITIES ---
    {"pattern": "SDG&E", "expense_label": "UTILS - ELECTRICITY"},
    {"pattern": "PG&E", "expense_label": "UTILS - ELECTRICITY"},
    {"pattern": "SO CAL GAS", "expense_label": "UTILS - GAS"},
    {"pattern": "SOCAL GAS", "expense_label": "UTILS - GAS"},
    {"pattern": "SOUTHERN CALIFORNIA GAS", "expense_label": "UTILS - GAS"},
    {"pattern": "COMCAST", "expense_label": "UTILS - INTERNET"},
    {"pattern": "XFINITY", "expense_label": "UTILS - INTERNET"},
    {"pattern": "AT&T", "expense_label": "UTILS - PHONE"},
    {"pattern": "VERIZON", "expense_label": "UTILS - PHONE"},
    {"pattern": "T-MOBILE", "expense_label": "UTILS - PHONE"},
    {"pattern": "WASTE MANAGEMENT", "expense_label": "UTILS - TRASH"},
    {"pattern": "REPUBLIC SERVICES", "expense_label": "UTILS - TRASH"},
    {"pattern": "WATER DISTRICT", "expense_label": "UTILS - WATER/SEWER"},
    {"pattern": "CITY WATER", "expense_label": "UTILS - WATER/SEWER"},
    # --- FOOD & DRINK ---
    {"pattern": "DOORDASH", "expense_label": "FOOD & DRINK"},
    {"pattern": "UBER EATS", "expense_label": "FOOD & DRINK"},
    {"pattern": "GRUBHUB", "expense_label": "FOOD & DRINK"},
    {"pattern": "STARBUCKS", "expense_label": "FOOD & DRINK"},
    {"pattern": "MCDONALD'S", "expense_label": "FOOD & DRINK"},
    {"pattern": "MCDONALDS", "expense_label": "FOOD & DRINK"},
    {"pattern": "CHIPOTLE", "expense_label": "FOOD & DRINK"},
    {"pattern": "CHICK-FIL-A", "expense_label": "FOOD & DRINK"},
    {"pattern": "CHICK FIL A", "expense_label": "FOOD & DRINK"},
    {"pattern": "PANERA", "expense_label": "FOOD & DRINK"},
    {"pattern": "IN-N-OUT", "expense_label": "FOOD & DRINK"},
    {"pattern": "IN N OUT", "expense_label": "FOOD & DRINK"},
    {"pattern": "PANDA EXPRESS", "expense_label": "FOOD & DRINK"},
    {"pattern": "SUBWAY", "expense_label": "FOOD & DRINK"},
    {"pattern": "TACO BELL", "expense_label": "FOOD & DRINK"},
    {"pattern": "DOMINO'S", "expense_label": "FOOD & DRINK"},
    {"pattern": "PIZZA HUT", "expense_label": "FOOD & DRINK"},
]


def seed_rules() -> None:
    """
    Seed the database with initial categorization rules.

    Clears existing rules and inserts fresh data.
    Resolves expense_label → budget_id at runtime.
    """
    db = SessionLocal()
    try:
        # Build expense_label → budget_id lookup
        budgets = db.query(Budget).all()
        label_to_id = {b.expense_label.upper(): b.id for b in budgets}

        if not label_to_id:
            logger.error("No budgets found. Run seed_budgets.py first.")
            return

        # Clear existing rules
        deleted = db.query(CategorizationRule).delete()
        if deleted > 0:
            logger.info(f"Cleared {deleted} existing rules")

        # Insert rules
        inserted = 0
        skipped = 0
        for rule_def in RULES:
            label = rule_def["expense_label"].upper()
            budget_id = label_to_id.get(label)

            if budget_id is None:
                logger.warning(f"No budget found for label '{rule_def['expense_label']}', skipping")
                skipped += 1
                continue

            rule = CategorizationRule(
                pattern=rule_def["pattern"],
                pattern_type=rule_def.get("pattern_type", "contains"),
                budget_id=budget_id,
                priority=rule_def.get("priority", 0),
            )
            db.add(rule)
            inserted += 1

        db.commit()
        logger.info(f"✅ Seeded {inserted} categorization rules ({skipped} skipped)")

    except Exception as e:
        logger.error(f"❌ Error seeding rules: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_rules()
