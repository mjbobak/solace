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

The hardcoded RULES list below was rebuilt from the live development database on
April 3, 2026 using manually budgeted transactions as the source of truth.
The seed is intentionally conservative:
  - Only patterns with at least 3 historical matches are considered
  - Only patterns with fully consistent historical outcomes are seeded
  - Prefer durable contains/startswith patterns over exact strings
  - Exclude ambiguous families the current matcher cannot safely disambiguate

Run with: python backend/scripts/seed_categorization_rules.py
Inspect with: python backend/scripts/seed_categorization_rules.py --derive
"""

from __future__ import annotations

import argparse
import logging
import sys
from collections import Counter, defaultdict
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session  # noqa: E402

from backend.app.db.database import SessionLocal  # noqa: E402
from backend.app.db.models.budget import Budget  # noqa: E402
from backend.app.db.models.categorization_rule import CategorizationRule  # noqa: E402
from backend.app.db.models.transaction import Transaction, TransactionStatus  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

MIN_HISTORY_COUNT = 3
STARTSWITH_PRIORITY = 50
CONTAINS_PRIORITY = 10

AMBIGUOUS_DESCRIPTIONS = {
    "SERVICEMAC PMT   MTGE PAYMT 5110249801      WEB ID: 4823070213",
    "VILLAGE OF LAGRANGE",
    "AAA CLUB/INSUR 0200057EA",
    "GOOGLE *GOOGLE ONE",
    "TST* OBERWEIS DAIRY - WES",
}
AMBIGUOUS_PREFIXES = (
    "SERVICEMAC PMT   MTGE PAYMT",
    "VILLAGE OF LAGRANGE",
    "VILLAGE OF LA GRANGE",
)

PREFIX_RULES = [
    {
        "pattern": "T-MOBILE",
        "pattern_type": "startswith",
        "expense_label": "UTILS - Phone",
        "priority": STARTSWITH_PRIORITY,
    },
    {
        "pattern": "ILD529 DIR ACH",
        "pattern_type": "startswith",
        "expense_label": "529A",
        "priority": STARTSWITH_PRIORITY,
    },
    {
        "pattern": "ZELLE PAYMENT TO ROCIO - MONTESSORI CC",
        "pattern_type": "startswith",
        "expense_label": "Day Care",
        "priority": STARTSWITH_PRIORITY,
    }
]

CONTAINS_RULES = [
    {"pattern": "AAFCU", "expense_label": "Car Loan"},
    {"pattern": "AMOCO", "expense_label": "Gas"},
    {"pattern": "APPLE.COM/BILL", "expense_label": "SUB - Apple Care iPhone"},
    {"pattern": "CASEYS", "expense_label": "Food & Drink & Date Nights"},
    {"pattern": "CHIPOTLE", "expense_label": "Food & Drink & Date Nights"},
    {"pattern": "COMCAST", "expense_label": "UTILS - Internet"},
    {"pattern": "COMED", "expense_label": "UTILS - Electricity"},
    {"pattern": "COSTCO WHSE", "expense_label": "Groceries"},
    {"pattern": "CRUMBL", "expense_label": "Food & Drink & Date Nights"},
    {"pattern": "FLOOD BROS", "expense_label": "UTILS - Trash"},
    {"pattern": "IL TOLLWAY-AUTOREPLENISH", "expense_label": "Travel"},
    {"pattern": "JEWEL OSCO", "expense_label": "Groceries"},
    {"pattern": "JEWEL-OSCO.COM", "expense_label": "Groceries"},
    {"pattern": "JIMMY JOHNS", "expense_label": "Food & Drink & Date Nights"},
    {"pattern": "MARIANOS", "expense_label": "Groceries"},
    {"pattern": "MENARDS", "expense_label": "Home Shopping"},
    {"pattern": "NETFLIX", "expense_label": "TV Subscriptions"},
    {"pattern": "NICOR", "expense_label": "UTILS - Gas"},
    {"pattern": "PARK CHICAGO MOBILE", "expense_label": "Travel"},
    {"pattern": "PARK DISTRICT OF LA GRAN", "expense_label": "Health & Wellness"},
    {"pattern": "HULU", "expense_label": "TV Subscriptions"},
    {"pattern": "SAWYER + M* MINI MUSIC", "expense_label": "Daisy Activities"},
    {"pattern": "SPOTHERO", "expense_label": "Travel"},
    {"pattern": "THE HOME DEPOT", "expense_label": "Home Shopping"},
    {"pattern": "TJMAXX", "expense_label": "Home Shopping"},
    {"pattern": "TRADER JOE", "expense_label": "Groceries"},
    {"pattern": "WALGREENS", "expense_label": "Groceries"},
    {"pattern": "YOGA BY DEGREES", "expense_label": "Health & Wellness"},
]
for rule in CONTAINS_RULES:
    rule["pattern_type"] = "contains"
    rule["priority"] = CONTAINS_PRIORITY

RULES = PREFIX_RULES + CONTAINS_RULES


def _normalize_description(description: str) -> str:
    return description.strip().upper()


def _is_ambiguous(description: str) -> bool:
    normalized = _normalize_description(description)
    return normalized in AMBIGUOUS_DESCRIPTIONS or normalized.startswith(AMBIGUOUS_PREFIXES)


def _load_historical_descriptions(db: Session) -> list[tuple[str, str]]:
    rows = (
        db.query(Transaction.description, Budget.expense_label)
        .join(Budget, Budget.id == Transaction.budget_id)
        .filter(Transaction.status == TransactionStatus.ACTIVE.value)
        .filter(Transaction.budget_id.isnot(None))
        .all()
    )
    return [(_normalize_description(description), expense_label) for description, expense_label in rows]


def _pattern_counts(
    descriptions: list[tuple[str, str]],
    *,
    pattern: str,
    pattern_type: str,
) -> Counter[str]:
    counts: Counter[str] = Counter()
    normalized_pattern = _normalize_description(pattern)

    for description, expense_label in descriptions:
        if _is_ambiguous(description):
            continue

        matched = False
        if pattern_type == "contains":
            matched = normalized_pattern in description
        elif pattern_type == "startswith":
            matched = description.startswith(normalized_pattern)
        elif pattern_type == "exact":
            matched = description == normalized_pattern

        if matched:
            counts[expense_label] += 1

    return counts


def build_rule_models(label_to_id: dict[str, int]) -> tuple[list[CategorizationRule], list[str]]:
    """Resolve RULES into ORM models and collect any missing budget labels."""
    models: list[CategorizationRule] = []
    missing_labels: list[str] = []

    for rule_def in RULES:
        label = rule_def["expense_label"].upper()
        budget_id = label_to_id.get(label)

        if budget_id is None:
            missing_labels.append(rule_def["expense_label"])
            continue

        models.append(
            CategorizationRule(
                pattern=rule_def["pattern"],
                pattern_type=rule_def["pattern_type"],
                budget_id=budget_id,
                priority=rule_def["priority"],
            )
        )

    return models, missing_labels


def derive_rule_candidates(db: Session) -> dict[str, list[dict[str, str | int]]]:
    """
    Inspect the live database and print conservative candidate diagnostics.

    The hardcoded RULES list remains the deterministic source of truth for
    seeding. This function validates that each current rule still meets the
    consistency and frequency threshold and also prints stable exact strings for
    human review when refining the seed in the future.
    """

    descriptions = _load_historical_descriptions(db)

    seeded_rules = []
    for rule in RULES:
        counts = _pattern_counts(descriptions, pattern=rule["pattern"], pattern_type=rule["pattern_type"])
        seeded_rules.append(
            {
                **rule,
                "count": sum(counts.values()),
                "budgets_seen": len(counts),
            }
        )

    exact_history: dict[str, Counter[str]] = defaultdict(Counter)
    for description, expense_label in descriptions:
        if _is_ambiguous(description):
            continue
        exact_history[description][expense_label] += 1

    exact_candidates = []
    for description, counts in exact_history.items():
        total = sum(counts.values())
        if total < MIN_HISTORY_COUNT or len(counts) != 1:
            continue
        exact_candidates.append(
            {
                "pattern": description,
                "pattern_type": "exact",
                "expense_label": next(iter(counts)),
                "count": total,
            }
        )

    return {
        "seeded": sorted(seeded_rules, key=lambda rule: (-int(rule["count"]), str(rule["pattern"]))),
        "exact_review": sorted(
            exact_candidates,
            key=lambda rule: (-int(rule["count"]), str(rule["expense_label"]), str(rule["pattern"])),
        ),
    }


def print_derived_rules() -> None:
    """Print current seeded-rule diagnostics plus exact-string review candidates."""
    db = SessionLocal()
    try:
        candidates = derive_rule_candidates(db)
    finally:
        db.close()

    print("# Seeded rule diagnostics")
    for rule in candidates["seeded"]:
        print(rule)

    print("\n# Stable exact descriptions for review")
    for rule in candidates["exact_review"]:
        print(rule)

    print("\n# Explicit exclusions")
    for description in sorted(AMBIGUOUS_DESCRIPTIONS):
        print(description)


def seed_rules() -> None:
    """
    Seed the database with initial categorization rules.

    Clears existing rules and inserts fresh data.
    Resolves expense_label -> budget_id at runtime.
    """
    db = SessionLocal()
    try:
        budgets = db.query(Budget).all()
        label_to_id = {budget.expense_label.upper(): budget.id for budget in budgets}

        if not label_to_id:
            logger.error("No budgets found. Run seed_budgets.py first.")
            return

        rules_to_insert, missing_labels = build_rule_models(label_to_id)
        if missing_labels:
            for label in missing_labels:
                logger.warning(f"No budget found for label '{label}', skipping")

        deleted = db.query(CategorizationRule).delete()
        if deleted > 0:
            logger.info(f"Cleared {deleted} existing rules")

        db.add_all(rules_to_insert)
        db.commit()
        logger.info(f"✅ Seeded {len(rules_to_insert)} categorization rules ({len(missing_labels)} skipped)")

    except Exception as exc:
        logger.error(f"❌ Error seeding rules: {exc}")
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed or derive categorization rules.")
    parser.add_argument(
        "--derive",
        action="store_true",
        help="Inspect the live database and print conservative rule diagnostics instead of seeding.",
    )
    args = parser.parse_args()

    if args.derive:
        print_derived_rules()
        return

    seed_rules()


if __name__ == "__main__":
    main()
