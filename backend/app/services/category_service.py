"""Expense Category service."""

import logging

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.db.models.budget import Budget
from backend.app.db.models.expense_category import ExpenseCategory
from backend.app.models.category import ExpenseCategoryCreate, ExpenseCategoryUpdate
from backend.app.services.base_service import BaseService

logger = logging.getLogger(__name__)


class ExpenseCategoryService(BaseService[ExpenseCategory, ExpenseCategoryCreate, ExpenseCategoryUpdate]):
    """Service for expense category management."""

    def __init__(self, db: Session):
        super().__init__(db=db, model=ExpenseCategory)

    def create(self, obj_in: ExpenseCategoryCreate, **extra_fields) -> ExpenseCategory:
        """
        Create an expense category with case-insensitive uniqueness validation.

        Args:
            obj_in: Category creation data
            **extra_fields: Additional fields

        Returns:
            Created category

        Raises:
            ValueError: If category name already exists (case-insensitive)
        """
        # Validate case-insensitive uniqueness
        existing = (
            self.db.query(ExpenseCategory).filter(func.lower(ExpenseCategory.name) == obj_in.name.lower()).first()
        )

        if existing:
            raise ValueError(f"Category '{obj_in.name}' already exists (case-insensitive)")

        # Call parent create method
        category = super().create(obj_in, **extra_fields)
        logger.info(f"Created expense category: {category.name}")
        return category

    def can_delete(self, category_id: int) -> tuple[bool, str]:
        """
        Check if a category can be deleted (not in use by any budget).

        Args:
            category_id: Category ID to check

        Returns:
            Tuple of (can_delete, reason). If can_delete is False, reason explains why.
        """
        count = self.db.query(Budget).filter(Budget.expense_category_id == category_id).count()

        if count > 0:
            return (False, f"Category is used by {count} budget {'entry' if count == 1 else 'entries'}")

        return (True, "")

    def get_usage_count(self, category_id: int) -> int:
        """
        Get the number of budgets using this category.

        Args:
            category_id: Category ID

        Returns:
            Number of budgets using this category
        """
        return self.db.query(Budget).filter(Budget.expense_category_id == category_id).count()
