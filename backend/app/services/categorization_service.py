"""Categorization service for auto-assigning budget IDs to transactions."""

import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.db.models.categorization_rule import CategorizationRule
from backend.app.models.csv_upload import ParsedTransaction

logger = logging.getLogger(__name__)


class CategorizationService:
    """
    Service for auto-categorizing transactions using rule-based matching.

    Loads rules from the database ordered by priority (highest first) and
    applies them against transaction descriptions. First match wins.
    """

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db

    def categorize(self, transactions: List[ParsedTransaction]) -> List[ParsedTransaction]:
        """
        Apply categorization rules to a list of parsed transactions.

        Skips filtered transactions and transactions with validation errors.
        Sets budget_id and auto_categorized=True on matched transactions.

        Args:
            transactions: Parsed transactions from ETL

        Returns:
            Same list with budget_id and auto_categorized populated where rules matched
        """
        rules = self._load_rules()
        if not rules:
            logger.info("No categorization rules found, skipping auto-categorization")
            return transactions

        matched = 0
        for txn in transactions:
            if txn.is_filtered or txn.validation_errors:
                continue

            budget_id = self._match(txn.description, rules)
            if budget_id is not None:
                txn.budget_id = budget_id
                txn.auto_categorized = True
                matched += 1

        logger.info(f"Auto-categorized {matched}/{len(transactions)} transactions")
        return transactions

    def _load_rules(self) -> List[CategorizationRule]:
        """Load all active rules ordered by priority descending, then id ascending."""
        return (
            self.db.query(CategorizationRule)
            .order_by(CategorizationRule.priority.desc(), CategorizationRule.id.asc())
            .all()
        )

    def _match(self, description: str, rules: List[CategorizationRule]) -> Optional[int]:
        """
        Find the first matching rule for a transaction description.

        Matching is case-insensitive. First match by priority wins.

        Args:
            description: Transaction description to test
            rules: Rules in priority order

        Returns:
            budget_id of first matching rule, or None
        """
        desc = description.upper()
        for rule in rules:
            pattern = rule.pattern.upper()
            if rule.pattern_type == "exact" and desc == pattern:
                return rule.budget_id
            elif rule.pattern_type == "startswith" and desc.startswith(pattern):
                return rule.budget_id
            elif rule.pattern_type == "contains" and pattern in desc:
                return rule.budget_id
        return None
