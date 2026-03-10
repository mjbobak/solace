"""ExpenseCategory SQLAlchemy ORM model."""

from sqlalchemy import Column, DateTime, Index, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.app.db.database import Base


class ExpenseCategory(Base):
    """
    Expense category database model.

    Stores categories for budget entries (e.g., CHILDREN, DAILY LIVING, etc.).
    Categories are shared across all users and can be customized.
    """

    __tablename__ = "expense_categories"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Category fields
    name = Column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
        comment="Category name (e.g., CHILDREN, DAILY LIVING)",
    )

    # Timestamp
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        comment="When this category was created",
    )

    # Relationships to budgets and transactions
    budgets = relationship("Budget", back_populates="category")
    transactions = relationship("Transaction", back_populates="category")

    # Index on creation time for sorting
    __table_args__ = (Index("ix_expense_categories_created_at", "created_at"),)

    def __repr__(self) -> str:
        return f"<ExpenseCategory(id={self.id}, name='{self.name}')>"
