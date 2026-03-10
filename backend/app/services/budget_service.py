"""Budget service for business logic."""

# ============================================================================
# Unified Budget Service (New)
# ============================================================================
from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.db.models.budget import Budget
from backend.app.models.budget import BudgetCreate, BudgetUpdate
from backend.app.services.base_service import BaseService


class BudgetService(BaseService[Budget, BudgetCreate, BudgetUpdate]):
    """
    Service for managing unified budget entries.

    Inherits from BaseService for standard CRUD operations and adds
    domain-specific methods for budget filtering and querying.
    """

    def __init__(self, db: Session):
        """Initialize service with database session."""
        super().__init__(db=db, model=Budget)

    def create(self, obj_in: BudgetCreate, **extra_fields) -> Budget:
        """
        Create a new budget entry with validation.

        Args:
            obj_in: Budget creation data
            **extra_fields: Additional fields to set

        Returns:
            Created budget entry

        Raises:
            ValueError: If a budget with the same expense_label already exists
        """
        # Validate unique expense_label
        existing = self.get_by_field("expense_label", obj_in.expense_label)
        if existing:
            raise ValueError(f"Budget with label '{obj_in.expense_label}' already exists")

        return super().create(obj_in, **extra_fields)

    def get_by_type(self, expense_type: str, skip: int = 0, limit: int = 100) -> List[Budget]:
        """
        Get all budgets of a specific expense type.

        Args:
            expense_type: Type to filter by (ESSENTIAL or FUNSIES)
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            List of budgets matching the type
        """
        return self.get_many_by_field("expense_type", expense_type, skip=skip, limit=limit)

    def get_by_category(self, expense_category_id: int, skip: int = 0, limit: int = 100) -> List[Budget]:
        """
        Get all budgets for a specific category.

        Args:
            expense_category_id: Category ID to filter by
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            List of budgets in the category
        """
        return self.get_many_by_field("expense_category_id", expense_category_id, skip=skip, limit=limit)

    def get_by_label(self, expense_label: str) -> Optional[Budget]:
        """
        Get a budget by its expense label.

        Args:
            expense_label: Expense label to search for

        Returns:
            Budget if found, None otherwise
        """
        return self.get_by_field("expense_label", expense_label)
