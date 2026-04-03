"""Tests for categorization rule seeding and matching behavior."""

from datetime import date
from decimal import Decimal

from backend.app.etl.csv_etl_service import CsvEtlService
from backend.app.models.csv_upload import ParsedTransaction
from backend.app.services.categorization_service import CategorizationService
from backend.scripts.seed_categorization_rules import RULES, build_rule_models


def _seed_budgets_for_rules(db_session, sample_expense_category):
    """Create one budget row for every unique expense label referenced by RULES."""
    from backend.app.db.models.budget import Budget

    budgets = {}
    for expense_label in sorted({rule["expense_label"] for rule in RULES}):
        budget = Budget(
            expense_type="ESSENTIAL",
            expense_category_id=sample_expense_category.id,
            expense_label=expense_label,
            budgeted=100.0,
            is_accrual=False,
        )
        db_session.add(budget)
        db_session.flush()
        budgets[expense_label] = budget

    db_session.commit()
    return budgets


def _seed_rules_from_script(db_session, sample_expense_category):
    budgets = _seed_budgets_for_rules(db_session, sample_expense_category)
    label_to_id = {expense_label.upper(): budget.id for expense_label, budget in budgets.items()}
    rule_models, missing_labels = build_rule_models(label_to_id)

    assert missing_labels == []

    db_session.add_all(rule_models)
    db_session.commit()

    return budgets


class TestCategorizationService:
    """Service-level matching tests for the rebuilt seed data."""

    def test_seed_data_resolves_all_expense_labels(self):
        """Every hardcoded rule label should resolve cleanly when budgets exist."""
        label_to_id = {
            expense_label.upper(): index
            for index, expense_label in enumerate(sorted({rule["expense_label"] for rule in RULES}), start=1)
        }

        rule_models, missing_labels = build_rule_models(label_to_id)

        assert missing_labels == []
        assert len(rule_models) == len(RULES)

    def test_contains_rule_categorizes_consistent_merchant_family(self, db_session, sample_expense_category):
        """Durable contains rules should categorize stable recurring merchants."""
        budgets = _seed_rules_from_script(db_session, sample_expense_category)
        service = CategorizationService(db_session)
        transaction = ParsedTransaction(
            row_number=2,
            account="2939",
            account_name="Chase Checking",
            transaction_date=None,
            post_date=date(2026, 4, 3),
            description="ComEd monthly autopay confirmation",
            amount=Decimal("240.00"),
        )

        service.categorize([transaction])

        assert transaction.budget_id == budgets["UTILS - Electricity"].id
        assert transaction.auto_categorized is True

    def test_startswith_rules_cover_variable_suffixes(self, db_session, sample_expense_category):
        """Prefix rules should absorb variable trailing IDs from the bank feed."""
        budgets = _seed_rules_from_script(db_session, sample_expense_category)
        service = CategorizationService(db_session)
        transactions = [
            ParsedTransaction(
                row_number=2,
                account="2939",
                account_name="Chase Checking",
                transaction_date=None,
                post_date=date(2026, 4, 3),
                description="T-MOBILE         PCS SVC    9999999         WEB ID: 0000450304",
                amount=Decimal("100.00"),
            ),
            ParsedTransaction(
                row_number=3,
                account="2939",
                account_name="Chase Checking",
                transaction_date=None,
                post_date=date(2026, 4, 3),
                description="ILD529 DIR ACH   CONTRIB    000099999999999 WEB ID: 2276312584",
                amount=Decimal("50.00"),
            ),
            ParsedTransaction(
                row_number=4,
                account="2939",
                account_name="Chase Checking",
                transaction_date=None,
                post_date=date(2026, 4, 3),
                description="Zelle payment to Rocio - Montessori CC JPM99future123",
                amount=Decimal("500.00"),
            ),
            ParsedTransaction(
                row_number=5,
                account="1466",
                account_name="Chase Credit Card",
                transaction_date=date(2026, 4, 3),
                post_date=date(2026, 4, 3),
                description="TARGET        00077777",
                amount=Decimal("84.25"),
            ),
        ]

        service.categorize(transactions)

        assert transactions[0].budget_id == budgets["UTILS - Phone"].id
        assert transactions[1].budget_id == budgets["529A"].id
        assert transactions[2].budget_id == budgets["Day Care"].id
        assert transactions[3].budget_id == budgets["Home Shopping"].id
        assert all(transaction.auto_categorized is True for transaction in transactions)

    def test_startswith_rule_beats_broader_contains_rule(self, db_session, sample_expense_category):
        """Higher-priority startswith rules should beat broader contains rules."""
        budgets = _seed_rules_from_script(db_session, sample_expense_category)
        service = CategorizationService(db_session)
        transaction = ParsedTransaction(
            row_number=2,
            account="1466",
            account_name="Chase Credit Card",
            transaction_date=date(2026, 4, 3),
            post_date=date(2026, 4, 3),
            description="TARGET        00088888",
            amount=Decimal("25.00"),
        )

        service.categorize([transaction])

        assert transaction.budget_id == budgets["Home Shopping"].id
        assert transaction.auto_categorized is True

    def test_ambiguous_descriptions_remain_uncategorized(self, db_session, sample_expense_category):
        """Explicitly excluded ambiguous descriptions should not be auto-categorized."""
        _seed_rules_from_script(db_session, sample_expense_category)
        service = CategorizationService(db_session)
        transactions = [
            ParsedTransaction(
                row_number=2,
                account="2939",
                account_name="Chase Checking",
                transaction_date=None,
                post_date=date(2026, 4, 3),
                description="SERVICEMAC PMT   MTGE PAYMT 5110249801      WEB ID: 4823070213",
                amount=Decimal("3955.28"),
            ),
            ParsedTransaction(
                row_number=3,
                account="2939",
                account_name="Chase Checking",
                transaction_date=None,
                post_date=date(2026, 4, 3),
                description="VILLAGE OF LAGRANGE",
                amount=Decimal("120.00"),
            ),
            ParsedTransaction(
                row_number=4,
                account="1466",
                account_name="Chase Credit Card",
                transaction_date=date(2026, 4, 3),
                post_date=date(2026, 4, 3),
                description="TARGET CARD SRVC PAYMENT    H     999999999 WEB ID: 3411721810",
                amount=Decimal("110.00"),
            ),
        ]

        service.categorize(transactions)

        assert all(transaction.budget_id is None for transaction in transactions)
        assert all(transaction.auto_categorized is False for transaction in transactions)

    def test_low_frequency_patterns_are_not_seeded(self, db_session, sample_expense_category):
        """Patterns with fewer than three historical matches should stay manual."""
        _seed_rules_from_script(db_session, sample_expense_category)
        service = CategorizationService(db_session)
        transactions = [
            ParsedTransaction(
                row_number=2,
                account="1466",
                account_name="Chase Credit Card",
                transaction_date=date(2026, 4, 3),
                post_date=date(2026, 4, 3),
                description="PAYPAL *DSW",
                amount=Decimal("42.00"),
            ),
            ParsedTransaction(
                row_number=3,
                account="1466",
                account_name="Chase Credit Card",
                transaction_date=date(2026, 4, 3),
                post_date=date(2026, 4, 3),
                description="ETSY  INC.",
                amount=Decimal("18.00"),
            ),
        ]

        service.categorize(transactions)

        assert all(transaction.budget_id is None for transaction in transactions)
        assert all(transaction.auto_categorized is False for transaction in transactions)

    def test_seed_rules_do_not_override_servicemac_split(self, db_session, sample_expense_category):
        """The seeded rules should not interfere with the existing ServiceMac ETL split."""
        service = CsvEtlService()
        _seed_rules_from_script(db_session, sample_expense_category)
        categorization_service = CategorizationService(db_session)
        transactions = service._build_chase_2939_transactions(
            row_number=2,
            post_date=date(2026, 3, 2),
            description="SERVICEMAC PMT   MTGE PAYMT 5110249801      WEB ID: 4823070213",
            details="DEBIT",
            amount=Decimal("3955.28"),
        )

        categorization_service.categorize(transactions)

        assert [transaction.amount for transaction in transactions] == [Decimal("2955.28"), Decimal("1000.00")]
        assert [transaction.budget_id for transaction in transactions] == [6, 28]
        assert all(transaction.auto_categorized is True for transaction in transactions)
