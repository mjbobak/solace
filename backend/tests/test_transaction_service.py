"""Tests for the TransactionService."""

from datetime import date
from decimal import Decimal

import pytest

from backend.app.db.models.transaction import ReviewStatus, Transaction, TransactionStatus
from backend.app.models.csv_upload import ParsedTransaction
from backend.app.models.transaction import TransactionCreate, TransactionUpdate
from backend.app.services.transaction_service import (
    DUPLICATE_IMPORT_FILTER_REASON,
    TransactionService,
)


class TestTransactionServiceCreate:
    """Test transaction creation."""

    def test_create_transaction(self, db_session, sample_user):
        """Test creating a single transaction."""
        service = TransactionService(db_session)

        transaction_data = TransactionCreate(
            date=date(2025, 1, 15),
            post_date=date(2025, 1, 16),
            description="Coffee",
            merchant="Starbucks",
            amount=5.50,
            account="Discover",
            category_id=None,
            is_accrual=False,
            status=TransactionStatus.ACTIVE,
            review_status=ReviewStatus.PENDING,
            import_batch_id=None,
        )

        result = service.create(transaction_data, user_id=sample_user.id)

        assert result.id is not None
        assert result.user_id == sample_user.id
        assert result.transaction_date == date(2025, 1, 15)
        assert result.post_date == date(2025, 1, 16)
        assert result.description == "Coffee"
        assert result.amount == 5.50
        assert result.account == "Discover"

    def test_create_transaction_with_minimal_fields(self, db_session, sample_user):
        """Test creating a transaction with only required fields."""
        service = TransactionService(db_session)

        transaction_data = TransactionCreate(
            date=date(2025, 1, 15),
            description="Grocery Store",
            amount=100.00,
        )

        result = service.create(transaction_data, user_id=sample_user.id)

        assert result.user_id == sample_user.id
        assert result.transaction_date == date(2025, 1, 15)
        assert result.description == "Grocery Store"
        assert result.amount == 100.00
        assert result.status == TransactionStatus.ACTIVE.value
        assert result.review_status == ReviewStatus.PENDING.value

    def test_create_transaction_with_spread_fields(self, db_session, sample_user):
        """Test creating a transaction with explicit spread metadata."""
        service = TransactionService(db_session)

        transaction_data = TransactionCreate(
            date=date(2025, 1, 15),
            description="Car Insurance",
            amount=600.00,
            spread_start_date=date(2025, 1, 1),
            spread_months=6,
        )

        result = service.create(transaction_data, user_id=sample_user.id)

        assert result.spread_start_date == date(2025, 1, 1)
        assert result.spread_months == 6
        assert result.is_accrual is True

    def test_create_transaction_with_legacy_accrual_defaults_to_year_long_spread(
        self,
        db_session,
        sample_user,
    ):
        """Test legacy is_accrual input is normalized into spread metadata."""
        service = TransactionService(db_session)

        transaction_data = TransactionCreate(
            date=date(2025, 7, 15),
            description="Legacy Annual Charge",
            amount=120.00,
            is_accrual=True,
        )

        result = service.create(transaction_data, user_id=sample_user.id)

        assert result.spread_start_date == date(2025, 7, 1)
        assert result.spread_months == 12
        assert result.is_accrual is True


class TestTransactionServiceRead:
    """Test transaction reading/retrieval."""

    def test_get_by_id(self, db_session, sample_transaction):
        """Test getting a transaction by ID."""
        service = TransactionService(db_session)

        result = service.get_by_id(sample_transaction.id)

        assert result is not None
        assert result.id == sample_transaction.id
        assert result.description == sample_transaction.description

    def test_get_by_id_not_found(self, db_session):
        """Test getting a non-existent transaction."""
        service = TransactionService(db_session)

        result = service.get_by_id(99999)

        assert result is None

    def test_get_all(self, db_session, sample_user, sample_transaction):
        """Test getting all transactions."""
        service = TransactionService(db_session)

        # Create another transaction
        txn_data = TransactionCreate(
            date=date(2025, 1, 20),
            description="Another Transaction",
            amount=75.00,
        )
        service.create(txn_data, user_id=sample_user.id)

        results = service.get_all()

        assert len(results) >= 2
        assert any(t.id == sample_transaction.id for t in results)

    def test_get_by_date_range(self, db_session, sample_user):
        """Test filtering transactions by date range."""
        service = TransactionService(db_session)

        # Create transactions on different dates
        service.create(
            TransactionCreate(date=date(2025, 1, 10), description="Early", amount=10.0),
            user_id=sample_user.id,
        )
        service.create(
            TransactionCreate(date=date(2025, 1, 15), description="Middle", amount=15.0),
            user_id=sample_user.id,
        )
        service.create(
            TransactionCreate(date=date(2025, 1, 20), description="Late", amount=20.0),
            user_id=sample_user.id,
        )

        # Query for middle date range
        results = service.get_by_date_range(
            sample_user.id,
            date(2025, 1, 12),
            date(2025, 1, 18),
        )

        assert len(results) == 1
        assert results[0].description == "Middle"

    def test_get_by_account(self, db_session, sample_user):
        """Test filtering transactions by account."""
        service = TransactionService(db_session)

        # Create transactions on different accounts
        service.create(
            TransactionCreate(
                date=date(2025, 1, 15),
                description="Discover Purchase",
                amount=50.0,
                account="Discover",
            ),
            user_id=sample_user.id,
        )
        service.create(
            TransactionCreate(
                date=date(2025, 1, 15),
                description="Chase Purchase",
                amount=75.0,
                account="Chase Checking",
            ),
            user_id=sample_user.id,
        )

        results = service.get_by_account(sample_user.id, "Discover")

        assert len(results) == 1
        assert results[0].account == "Discover"

    def test_get_unreviewed(self, db_session, sample_user):
        """Test filtering unreviewed transactions."""
        service = TransactionService(db_session)

        # Create unreviewed transaction
        service.create(
            TransactionCreate(
                date=date(2025, 1, 15),
                description="Unreviewed",
                amount=50.0,
                review_status=ReviewStatus.PENDING,
            ),
            user_id=sample_user.id,
        )

        # Create reviewed transaction
        service.create(
            TransactionCreate(
                date=date(2025, 1, 16),
                description="Reviewed",
                amount=75.0,
                review_status=ReviewStatus.REVIEWED,
            ),
            user_id=sample_user.id,
        )

        results = service.get_unreviewed(sample_user.id)

        assert len(results) == 1
        assert results[0].description == "Unreviewed"


class TestTransactionServiceUpdate:
    """Test transaction updates."""

    def test_update_transaction(self, db_session, sample_transaction):
        """Test updating a transaction."""
        service = TransactionService(db_session)

        update_data = TransactionUpdate(
            description="Updated Description",
            amount=75.00,
        )

        result = service.update(sample_transaction.id, update_data)

        assert result is not None
        assert result.description == "Updated Description"
        assert result.amount == 75.00

    def test_update_nonexistent_transaction(self, db_session):
        """Test updating a non-existent transaction."""
        service = TransactionService(db_session)

        update_data = TransactionUpdate(description="Updated")

        result = service.update(99999, update_data)

        assert result is None

    def test_update_transaction_spread_fields(self, db_session, sample_transaction):
        """Test updating spread metadata on an existing transaction."""
        service = TransactionService(db_session)

        update_data = TransactionUpdate(
            spread_start_date=date(2025, 2, 1),
            spread_months=6,
        )

        result = service.update(sample_transaction.id, update_data)

        assert result is not None
        assert result.spread_start_date == date(2025, 2, 1)
        assert result.spread_months == 6
        assert result.is_accrual is True


class TestTransactionServiceDuplicateImports:
    """Test duplicate detection for CSV imports."""

    def test_flag_existing_import_duplicates_marks_preview_rows(self, db_session, sample_user):
        """Preview rows that match an existing import should be filtered."""
        db_session.add(
            Transaction(
                user_id=sample_user.id,
                transaction_date=date(2026, 3, 1),
                post_date=date(2026, 3, 2),
                description="Coffee Shop",
                merchant="Coffee Shop",
                account="Chase Credit Card",
                amount=Decimal("6.25"),
                is_accrual=False,
                status=TransactionStatus.ACTIVE.value,
                review_status=ReviewStatus.PENDING.value,
            )
        )
        db_session.commit()

        service = TransactionService(db_session)
        preview_transactions = [
            ParsedTransaction(
                row_number=2,
                account="1466",
                account_name="Chase Credit Card",
                transaction_date=date(2026, 3, 1),
                post_date=date(2026, 3, 2),
                description="  coffee   shop ",
                amount=Decimal("6.25"),
                chase_category="Food & Drink",
            ),
            ParsedTransaction(
                row_number=3,
                account="1466",
                account_name="Chase Credit Card",
                transaction_date=date(2026, 3, 1),
                post_date=date(2026, 3, 2),
                description="Different Merchant",
                amount=Decimal("6.25"),
                chase_category="Food & Drink",
            ),
        ]

        duplicate_count = service.flag_existing_import_duplicates(preview_transactions, user_id=sample_user.id)

        assert duplicate_count == 1
        assert preview_transactions[0].is_filtered is True
        assert preview_transactions[0].filter_reason == DUPLICATE_IMPORT_FILTER_REASON
        assert preview_transactions[1].is_filtered is False

    def test_split_existing_import_duplicates_skips_matches(self, db_session, sample_user):
        """Bulk import should keep only transactions that do not already exist."""
        db_session.add(
            Transaction(
                user_id=sample_user.id,
                transaction_date=date(2026, 3, 5),
                post_date=date(2026, 3, 5),
                description="Grocery Store",
                merchant="Grocery Store",
                account="Chase Checking",
                amount=Decimal("42.15"),
                is_accrual=False,
                status=TransactionStatus.ACTIVE.value,
                review_status=ReviewStatus.PENDING.value,
            )
        )
        db_session.commit()

        service = TransactionService(db_session)
        transactions = [
            TransactionCreate(
                date=date(2026, 3, 5),
                post_date=date(2026, 3, 5),
                description="grocery   store",
                merchant="grocery   store",
                amount=Decimal("42.15"),
                account="Chase Checking",
            ),
            TransactionCreate(
                date=date(2026, 3, 6),
                post_date=date(2026, 3, 6),
                description="Gas Station",
                merchant="Gas Station",
                amount=Decimal("30.00"),
                account="Chase Checking",
            ),
        ]

        new_transactions, skipped_duplicates = service.split_existing_import_duplicates(
            transactions,
            user_id=sample_user.id,
        )

        assert skipped_duplicates == 1
        assert len(new_transactions) == 1
        assert new_transactions[0].description == "Gas Station"

    def test_update_transaction_clear_spread_fields(self, db_session, sample_transaction):
        """Test clearing spread metadata resets the legacy flag."""
        service = TransactionService(db_session)
        service.update(
            sample_transaction.id,
            TransactionUpdate(
                spread_start_date=date(2025, 1, 1),
                spread_months=12,
            ),
        )

        result = service.update(
            sample_transaction.id,
            TransactionUpdate(spread_start_date=None, spread_months=None),
        )

        assert result is not None
        assert result.spread_start_date is None
        assert result.spread_months is None
        assert result.is_accrual is False


class TestTransactionServiceDelete:
    """Test transaction deletion (soft delete via status field)."""

    def test_delete_transaction(self, db_session, sample_transaction):
        """Test deleting a transaction."""
        service = TransactionService(db_session)

        # Verify transaction exists
        txn = service.get_by_id(sample_transaction.id)
        assert txn is not None

        # Delete it
        success = service.delete(sample_transaction.id)

        assert success is True

        # Verify it's deleted (hard delete)
        txn = service.get_by_id(sample_transaction.id)
        assert txn is None

    def test_delete_nonexistent_transaction(self, db_session):
        """Test deleting a non-existent transaction."""
        service = TransactionService(db_session)

        success = service.delete(99999)

        assert success is False


class TestTransactionServiceBulkCreate:
    """Test bulk transaction creation."""

    def test_bulk_create_transactions(self, db_session, sample_user):
        """Test creating multiple transactions at once."""
        service = TransactionService(db_session)

        transactions = [
            TransactionCreate(date=date(2025, 1, 15), description="Txn 1", amount=10.0),
            TransactionCreate(date=date(2025, 1, 16), description="Txn 2", amount=20.0),
            TransactionCreate(date=date(2025, 1, 17), description="Txn 3", amount=30.0),
        ]

        count = service.bulk_create(transactions, sample_user.id, "batch-001")

        assert count == 3

        # Verify all were created
        all_txns = service.get_all()
        assert len(all_txns) == 3

    def test_bulk_create_empty_list(self, db_session, sample_user):
        """Test bulk creating with empty list."""
        service = TransactionService(db_session)

        with pytest.raises(ValueError):
            service.bulk_create([], sample_user.id, "batch-001")

    def test_bulk_create_with_import_batch_id(self, db_session, sample_user):
        """Test bulk create sets import_batch_id correctly."""
        service = TransactionService(db_session)

        transactions = [
            TransactionCreate(date=date(2025, 1, 15), description="Txn 1", amount=10.0),
        ]

        service.bulk_create(transactions, sample_user.id, "batch-csv-import")

        result = service.get_all()[0]
        assert result.import_batch_id == "batch-csv-import"


class TestTransactionServiceExistence:
    """Test transaction existence checks."""

    def test_exists_returns_true(self, db_session, sample_transaction):
        """Test exists returns True for existing transaction."""
        service = TransactionService(db_session)

        exists = service.exists(sample_transaction.id)

        assert exists is True

    def test_exists_returns_false(self, db_session):
        """Test exists returns False for non-existent transaction."""
        service = TransactionService(db_session)

        exists = service.exists(99999)

        assert exists is False
