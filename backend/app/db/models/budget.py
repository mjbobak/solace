"""Budget SQLAlchemy ORM model."""

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.app.db.database import Base


class Budget(Base):
    """
    Budget database model.

    Stores budget entries with expense classification and budgeted amounts.
    Calculated fields (spent, remaining, percentage) are NOT stored here
    and will be computed from the transactions table when needed.
    """

    __tablename__ = "budgets"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Budget fields (from mockBudgetData.ts)
    expense_type = Column(
        String(20),
        nullable=False,
        index=True,
        comment="ESSENTIAL or FUNSIES",
    )
    expense_category_id = Column(
        Integer,
        ForeignKey("expense_categories.id"),
        nullable=False,
        index=True,
        comment="Foreign key to expense_categories table",
    )
    expense_label = Column(
        String(200),
        nullable=False,
        comment="Specific label like ALL THINGS DAISY, GROCERIES, etc.",
    )
    expense_label_note = Column(
        String(500),
        nullable=True,
        comment="Optional descriptive note for the expense label",
    )
    is_investment = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="True when this budget item should count toward investments/wealth contributions",
    )
    budgeted = Column(
        Float,
        nullable=False,
        comment="Budgeted amount for this category",
    )
    is_accrual = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="True for quarterly/annual items",
    )

    # Relationships
    category = relationship("ExpenseCategory", back_populates="budgets")
    transactions = relationship("Transaction", back_populates="budget")

    # Timestamps (auto-managed by SQLAlchemy)
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        comment="When this budget was created",
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="When this budget was last updated",
    )

    # Composite index for filtering by type and category
    __table_args__ = (Index("ix_budgets_type_category", "expense_type", "expense_category_id"),)

    @property
    def expense_category(self) -> str:
        """Return the category name from the relationship."""
        return self.category.name if self.category else ""

    @expense_category.setter
    def expense_category(self, value: str) -> None:
        """Setter is a no-op - the category is determined by expense_category_id."""
        pass

    def __repr__(self) -> str:
        return f"<Budget(id={self.id}, label='{self.expense_label}', budgeted={self.budgeted})>"
