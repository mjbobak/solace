"""Transaction SQLAlchemy ORM model."""

from datetime import date
from enum import Enum

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.app.db.database import Base


class TransactionStatus(str, Enum):
    """Transaction status enumeration."""

    ACTIVE = "active"  # Normal active transaction
    DELETED = "deleted"  # Soft deleted transaction
    VOID = "void"  # Voided/cancelled transaction


class ReviewStatus(str, Enum):
    """Review status enumeration."""

    PENDING = "pending"  # Needs review after import
    REVIEWED = "reviewed"  # User has reviewed
    AUTO_CATEGORIZED = "auto_categorized"  # Auto-categorized by rule engine


class Transaction(Base):
    """
    Transaction database model.

    Stores individual spending transactions with categorization and review status.
    Each transaction belongs to a user and can be categorized by expense category.
    """

    __tablename__ = "transactions"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # User relationship
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
        comment="Foreign key to users table",
    )

    # Transaction details
    transaction_date = Column(
        Date,
        nullable=False,
        index=True,
        comment="Date transaction occurred",
    )
    post_date = Column(
        Date,
        nullable=True,
        comment="Date transaction posted to account (may differ from transaction_date)",
    )
    description = Column(
        String(255),
        nullable=False,
        comment="Transaction description",
    )
    merchant = Column(
        String(255),
        nullable=True,
        comment="Merchant name",
    )
    account = Column(
        String(100),
        nullable=True,
        index=True,
        comment="Account name (e.g., Discover, Chase Checking)",
    )
    amount = Column(
        Numeric(10, 2),
        nullable=False,
        comment="Transaction amount",
    )

    # Categorization
    category_id = Column(
        Integer,
        ForeignKey("expense_categories.id"),
        nullable=True,
        index=True,
        comment="Foreign key to expense_categories table (deprecated, use budget_id)",
    )
    budget_id = Column(
        Integer,
        ForeignKey("budgets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Foreign key to budgets table for linking to specific budget items",
    )
    is_accrual = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="True for quarterly/annual items",
    )
    spread_start_date = Column(
        Date,
        nullable=True,
        comment="First month covered by spread payment, normalized to first day of month",
    )
    spread_months = Column(
        Integer,
        nullable=True,
        comment="Number of months the payment is spread across",
    )

    # Status tracking
    status = Column(
        String(20),
        default=TransactionStatus.ACTIVE.value,
        nullable=False,
        index=True,
        comment="Transaction status (active, deleted, void)",
    )
    review_status = Column(
        String(20),
        default=ReviewStatus.PENDING.value,
        nullable=False,
        comment="Review status (pending, reviewed, auto_categorized)",
    )

    # Import tracking
    import_batch_id = Column(
        String(100),
        nullable=True,
        comment="Import batch identifier for bulk imports",
    )

    # Chase/Bank categorization
    chase_category = Column(
        String(100),
        nullable=True,
        comment="Original Chase category for future smart categorization",
    )

    # Timestamps (auto-managed by SQLAlchemy)
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        comment="When this transaction was created",
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="When this transaction was last updated",
    )

    # Relationships
    user = relationship("User", back_populates="transactions")
    category = relationship("ExpenseCategory", back_populates="transactions")
    budget = relationship("Budget", back_populates="transactions")

    # Composite indexes for common query patterns
    __table_args__ = (
        Index("ix_transactions_user_date", "user_id", "transaction_date"),
        Index("ix_transactions_user_account", "user_id", "account"),
        Index("ix_transactions_user_category", "user_id", "category_id"),
        Index("ix_transactions_user_spread_start", "user_id", "spread_start_date"),
    )

    @property
    def date(self) -> date:
        """Alias for transaction_date to support Pydantic serialization."""
        return self.transaction_date

    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, date={self.transaction_date}, amount={self.amount})>"
