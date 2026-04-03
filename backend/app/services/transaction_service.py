"""Transaction service for business logic."""

import logging
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from backend.app.db.models.budget import Budget
from backend.app.db.models.transaction import Transaction, TransactionStatus
from backend.app.models.csv_upload import ParsedTransaction
from backend.app.models.transaction import TransactionCreate, TransactionUpdate
from backend.app.services.base_service import BaseService

logger = logging.getLogger(__name__)

DUPLICATE_IMPORT_FILTER_REASON = "Already imported (matched on date, description, amount, and account)"


class TransactionService(BaseService[Transaction, TransactionCreate, TransactionUpdate]):
    """
    Service for managing transactions.

    Inherits from BaseService for standard CRUD operations and adds
    domain-specific methods for transaction filtering and querying.
    """

    def __init__(self, db: Session):
        """Initialize service with database session."""
        super().__init__(db=db, model=Transaction)

    @staticmethod
    def _normalize_spread_fields(
        update_data: dict,
        fallback_transaction_date: date,
    ) -> None:
        """Keep spread metadata and legacy is_accrual flag in sync."""
        has_spread_start = "spread_start_date" in update_data
        has_spread_months = "spread_months" in update_data
        has_legacy_flag = "is_accrual" in update_data

        if has_spread_start or has_spread_months:
            spread_start = update_data.get("spread_start_date")
            spread_months = update_data.get("spread_months")

            if (spread_start is None) != (spread_months is None):
                raise ValueError("spread_start_date and spread_months must be provided together")

            if spread_start is None and spread_months is None:
                update_data["spread_start_date"] = None
                update_data["spread_months"] = None
                update_data["is_accrual"] = False
                return

            update_data["spread_start_date"] = spread_start.replace(day=1)
            update_data["is_accrual"] = True
            return

        if not has_legacy_flag:
            return

        if update_data["is_accrual"]:
            update_data["spread_start_date"] = fallback_transaction_date.replace(day=1)
            update_data["spread_months"] = 12
            update_data["is_accrual"] = True
            return

        update_data["spread_start_date"] = None
        update_data["spread_months"] = None
        update_data["is_accrual"] = False

    @staticmethod
    def _normalize_duplicate_text(value: Optional[str]) -> str:
        """Normalize text fields used in duplicate matching."""
        return " ".join((value or "").strip().upper().split())

    @staticmethod
    def _normalize_duplicate_amount(value: Decimal) -> Decimal:
        """Normalize imported amounts to 2 decimal places for matching."""
        return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @classmethod
    def _build_duplicate_signature(
        cls,
        *,
        transaction_date: date,
        description: str,
        amount: Decimal,
        account: Optional[str],
    ) -> tuple[date, str, Decimal, str]:
        """Build a normalized signature used to identify duplicate imports."""
        return (
            transaction_date,
            cls._normalize_duplicate_text(description),
            cls._normalize_duplicate_amount(amount),
            cls._normalize_duplicate_text(account),
        )

    def _get_existing_duplicate_signatures(
        self,
        *,
        user_id: int,
        transaction_dates: set[date],
    ) -> set[tuple[date, str, Decimal, str]]:
        """Load existing transaction signatures for the relevant transaction dates."""
        if not transaction_dates:
            return set()

        existing_transactions = (
            self.db.query(
                self.model.transaction_date,
                self.model.description,
                self.model.amount,
                self.model.account,
            )
            .filter(
                and_(
                    self.model.user_id == user_id,
                    self.model.status != TransactionStatus.DELETED.value,
                    self.model.transaction_date.in_(sorted(transaction_dates)),
                )
            )
            .all()
        )

        return {
            self._build_duplicate_signature(
                transaction_date=transaction_date,
                description=description,
                amount=amount,
                account=account,
            )
            for transaction_date, description, amount, account in existing_transactions
        }

    def flag_existing_import_duplicates(
        self,
        transactions: List[ParsedTransaction],
        *,
        user_id: int,
    ) -> int:
        """Mark preview rows as filtered when they match already-imported transactions."""
        transaction_dates = {
            txn.transaction_date or txn.post_date
            for txn in transactions
            if not txn.validation_errors
        }
        existing_signatures = self._get_existing_duplicate_signatures(
            user_id=user_id,
            transaction_dates=transaction_dates,
        )

        duplicate_count = 0
        for txn in transactions:
            if txn.validation_errors or txn.is_filtered:
                continue

            signature = self._build_duplicate_signature(
                transaction_date=txn.transaction_date or txn.post_date,
                description=txn.description,
                amount=txn.amount,
                account=txn.account_name,
            )
            if signature not in existing_signatures:
                continue

            txn.is_filtered = True
            txn.filter_reason = DUPLICATE_IMPORT_FILTER_REASON
            duplicate_count += 1

        return duplicate_count

    def split_existing_import_duplicates(
        self,
        transactions: List[TransactionCreate],
        *,
        user_id: int,
    ) -> tuple[List[TransactionCreate], int]:
        """Partition bulk-import rows into new transactions and duplicates."""
        transaction_dates = {txn.date for txn in transactions}
        existing_signatures = self._get_existing_duplicate_signatures(
            user_id=user_id,
            transaction_dates=transaction_dates,
        )

        new_transactions: List[TransactionCreate] = []
        skipped_duplicates = 0

        for txn in transactions:
            signature = self._build_duplicate_signature(
                transaction_date=txn.date,
                description=txn.description,
                amount=txn.amount,
                account=txn.account,
            )
            if signature in existing_signatures:
                skipped_duplicates += 1
                continue

            new_transactions.append(txn)

        return new_transactions, skipped_duplicates

    def create(self, obj_in: TransactionCreate, user_id: int, **extra_fields) -> Transaction:
        """
        Create a new transaction with user_id injection.

        Args:
            obj_in: Transaction creation data
            user_id: ID of the user creating the transaction
            **extra_fields: Additional fields to set

        Returns:
            Created transaction

        Note:
            The create method automatically converts the 'date' field from
            Pydantic to 'transaction_date' in the database via model_dump().
        """
        obj_data = obj_in.model_dump(exclude_none=True)

        # Map 'date' to 'transaction_date' for database column
        if "date" in obj_data:
            obj_data["transaction_date"] = obj_data.pop("date")

        self._normalize_spread_fields(
            obj_data,
            fallback_transaction_date=obj_data["transaction_date"],
        )

        # Inject user_id and any extra fields
        obj_data["user_id"] = user_id
        obj_data.update(extra_fields)

        # Create model instance
        db_obj = self.model(**obj_data)

        # Persist to database
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)

        return db_obj

    def update(self, id: int, obj_in: TransactionUpdate, **extra_fields) -> Optional[Transaction]:
        """
        Update an existing transaction.

        Args:
            id: Transaction ID
            obj_in: Pydantic schema with update data
            **extra_fields: Additional fields to update

        Returns:
            Updated transaction if found, None otherwise

        Note:
            Maps 'date' to 'transaction_date' for database column.
        """
        db_obj = self.get_by_id(id)
        if not db_obj:
            return None

        # Get update data (exclude unset fields for partial updates)
        update_data = obj_in.model_dump(exclude_unset=True)

        # Map 'date' to 'transaction_date' if present
        if "date" in update_data:
            update_data["transaction_date"] = update_data.pop("date")

        fallback_transaction_date = update_data.get("transaction_date", db_obj.transaction_date)
        self._normalize_spread_fields(
            update_data,
            fallback_transaction_date=fallback_transaction_date,
        )

        update_data.update(extra_fields)

        # Update model instance
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        self.db.commit()
        self.db.refresh(db_obj)

        return db_obj

    def get_by_date_range(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Transaction]:
        """
        Get transactions within a date range for a user.

        Args:
            user_id: User ID to filter by
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            List of transactions in the date range
        """
        return (
            self.db.query(self.model)
            .options(
                joinedload(self.model.category),
                joinedload(self.model.budget).joinedload(Budget.category),
            )
            .filter(
                and_(
                    self.model.user_id == user_id,
                    self.model.status != TransactionStatus.DELETED.value,
                    self.model.transaction_date >= start_date,
                    self.model.transaction_date <= end_date,
                )
            )
            .order_by(self.model.transaction_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_account(
        self,
        user_id: int,
        account: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Transaction]:
        """
        Get transactions for a specific account.

        Args:
            user_id: User ID to filter by
            account: Account name to filter by
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            List of transactions for the account
        """
        return (
            self.db.query(self.model)
            .options(
                joinedload(self.model.category),
                joinedload(self.model.budget).joinedload(Budget.category),
            )
            .filter(
                and_(
                    self.model.user_id == user_id,
                    self.model.status != TransactionStatus.DELETED.value,
                    self.model.account == account,
                )
            )
            .order_by(self.model.transaction_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_category(
        self,
        user_id: int,
        category_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Transaction]:
        """
        Get transactions for a specific category.

        Args:
            user_id: User ID to filter by
            category_id: Category ID to filter by
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            List of transactions in the category
        """
        return (
            self.db.query(self.model)
            .options(
                joinedload(self.model.category),
                joinedload(self.model.budget).joinedload(Budget.category),
            )
            .filter(
                and_(
                    self.model.user_id == user_id,
                    self.model.status != TransactionStatus.DELETED.value,
                    self.model.category_id == category_id,
                )
            )
            .order_by(self.model.transaction_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_unreviewed(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Transaction]:
        """
        Get unreviewed transactions (pending review) for a user.

        Args:
            user_id: User ID to filter by
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            List of unreviewed transactions
        """
        from backend.app.db.models import ReviewStatus

        return (
            self.db.query(self.model)
            .options(
                joinedload(self.model.category),
                joinedload(self.model.budget).joinedload(Budget.category),
            )
            .filter(
                and_(
                    self.model.user_id == user_id,
                    self.model.status != TransactionStatus.DELETED.value,
                    self.model.review_status == ReviewStatus.PENDING.value,
                )
            )
            .order_by(self.model.transaction_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def bulk_create(
        self,
        transactions: List[TransactionCreate],
        user_id: int,
        import_batch_id: str,
    ) -> int:
        """
        Create multiple transactions from a bulk import.

        Args:
            transactions: List of transactions to create
            user_id: User ID for all transactions
            import_batch_id: Batch ID to track the import

        Returns:
            Number of transactions created

        Raises:
            ValueError: If transactions list is empty
        """
        if not transactions:
            raise ValueError("Cannot bulk create with empty transaction list")

        created_count = 0
        for obj_in in transactions:
            try:
                self.create(obj_in, user_id=user_id, import_batch_id=import_batch_id)
                created_count += 1
            except Exception as e:
                # Log error but continue processing remaining transactions
                logger.exception("Error creating transaction during bulk import: %s", e)
                continue

        return created_count
