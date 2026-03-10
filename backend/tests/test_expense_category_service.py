"""
Tests for ExpenseCategoryService.
"""

import pytest
from sqlalchemy.orm import Session

from backend.app.models.category import ExpenseCategoryCreate, ExpenseCategoryUpdate
from backend.app.services.category_service import ExpenseCategoryService


class TestExpenseCategoryServiceCreate:
    """Test expense category creation."""

    def test_create_category(self, db_session: Session):
        """Test creating an expense category."""
        service = ExpenseCategoryService(db_session)
        category_data = ExpenseCategoryCreate(name="Groceries")

        category = service.create(category_data)

        assert category.id is not None
        assert category.name == "Groceries"
        assert category.created_at is not None

    def test_create_duplicate_name_raises_error(self, db_session: Session):
        """Test that duplicate category names are rejected."""
        service = ExpenseCategoryService(db_session)

        # Create first category
        category_data = ExpenseCategoryCreate(name="Groceries")
        service.create(category_data)

        # Try to create duplicate
        with pytest.raises(ValueError, match="already exists"):
            service.create(category_data)

    def test_create_case_insensitive_duplicate(self, db_session: Session):
        """Test that duplicate category names are rejected (case-insensitive)."""
        service = ExpenseCategoryService(db_session)

        # Create category
        service.create(ExpenseCategoryCreate(name="Groceries"))

        # Try to create with different case
        with pytest.raises(ValueError, match="already exists"):
            service.create(ExpenseCategoryCreate(name="GROCERIES"))

    def test_create_validates_name_length(self, db_session: Session):
        """Test that category name length is validated."""

        # Empty name should fail at Pydantic validation level
        with pytest.raises(ValueError):
            ExpenseCategoryCreate(name="")


class TestExpenseCategoryServiceQueries:
    """Test expense category query methods."""

    def test_get_by_id(self, db_session: Session):
        """Test getting category by ID."""
        service = ExpenseCategoryService(db_session)

        # Create category
        category = service.create(ExpenseCategoryCreate(name="Groceries"))

        # Retrieve by ID
        retrieved = service.get_by_id(category.id)

        assert retrieved is not None
        assert retrieved.id == category.id
        assert retrieved.name == "Groceries"

    def test_get_all_categories(self, db_session: Session):
        """Test getting all categories."""
        service = ExpenseCategoryService(db_session)

        # Create multiple categories
        names = ["Groceries", "Transportation", "Entertainment"]
        for name in names:
            service.create(ExpenseCategoryCreate(name=name))

        # Get all
        all_categories = service.get_all()

        assert len(all_categories) >= 3
        assert all(cat.name in names for cat in all_categories if cat.name in names)

    def test_get_nonexistent_category(self, db_session: Session):
        """Test getting a category that doesn't exist."""
        service = ExpenseCategoryService(db_session)

        result = service.get_by_id(9999)

        assert result is None


class TestExpenseCategoryServiceDeletion:
    """Test expense category deletion logic."""

    def test_can_delete_unused_category(self, db_session: Session):
        """Test that unused categories can be deleted."""
        service = ExpenseCategoryService(db_session)

        # Create category
        category = service.create(ExpenseCategoryCreate(name="Groceries"))

        # Check if can delete
        can_delete, reason = service.can_delete(category.id)

        assert can_delete is True
        assert reason == ""

    def test_can_delete_used_category(self, db_session: Session, sample_budget):
        """Test that categories in use cannot be deleted."""
        service = ExpenseCategoryService(db_session)

        # sample_budget uses expense_category_id
        category_id = sample_budget.expense_category_id

        # Check if can delete
        can_delete, reason = service.can_delete(category_id)

        assert can_delete is False
        assert "used by 1 budget entry" in reason

    def test_delete_unused_category(self, db_session: Session):
        """Test deleting an unused category."""
        service = ExpenseCategoryService(db_session)

        # Create category
        category = service.create(ExpenseCategoryCreate(name="Groceries"))
        category_id = category.id

        # Delete it
        service.delete(category_id)

        # Verify it's gone
        assert service.get_by_id(category_id) is None

    def test_get_usage_count_zero(self, db_session: Session):
        """Test getting usage count for unused category."""
        service = ExpenseCategoryService(db_session)

        category = service.create(ExpenseCategoryCreate(name="Groceries"))

        count = service.get_usage_count(category.id)

        assert count == 0

    def test_get_usage_count_nonzero(self, db_session: Session, sample_budget):
        """Test getting usage count for category in use."""
        service = ExpenseCategoryService(db_session)

        category_id = sample_budget.expense_category_id

        count = service.get_usage_count(category_id)

        assert count >= 1


class TestExpenseCategoryServiceUpdate:
    """Test expense category update functionality."""

    def test_update_category_name(self, db_session: Session):
        """Test updating a category's name."""
        service = ExpenseCategoryService(db_session)

        # Create category
        category = service.create(ExpenseCategoryCreate(name="Groceries"))

        # Update name
        updated = service.update(category.id, ExpenseCategoryUpdate(name="Food"))

        assert updated.name == "Food"

    def test_update_preserves_id(self, db_session: Session):
        """Test that update preserves the category ID."""
        service = ExpenseCategoryService(db_session)

        # Create category
        original = service.create(ExpenseCategoryCreate(name="Groceries"))
        original_id = original.id

        # Update
        updated = service.update(original_id, ExpenseCategoryUpdate(name="Food"))

        assert updated.id == original_id
