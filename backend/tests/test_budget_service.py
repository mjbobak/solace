"""Tests for budget service."""

import pytest

from backend.app.models.budget import BudgetCreate, BudgetUpdate
from backend.app.services.budget_service import BudgetService


class TestBudgetServiceCreate:
    """Tests for budget creation."""

    def test_create_budget(self, db_session):
        """Test creating a budget entry."""
        service = BudgetService(db_session)
        budget_data = BudgetCreate(
            expense_type="ESSENTIAL",
            expense_category="DAILY LIVING",
            expense_label="GROCERIES",
            budgeted=1200.0,
            is_accrual=False,
        )

        budget = service.create(budget_data)

        assert budget.id is not None
        assert budget.expense_label == "GROCERIES"
        assert budget.budgeted == 1200.0
        assert budget.expense_type == "ESSENTIAL"
        assert budget.created_at is not None
        assert budget.updated_at is not None

    def test_create_duplicate_label_fails(self, db_session, sample_budget):
        """Test that creating a budget with duplicate label fails."""
        service = BudgetService(db_session)
        budget_data = BudgetCreate(
            expense_type="ESSENTIAL",
            expense_category="DAILY LIVING",
            expense_label=sample_budget.expense_label,  # Duplicate
            budgeted=1500.0,
            is_accrual=False,
        )

        with pytest.raises(ValueError, match="already exists"):
            service.create(budget_data)

    def test_create_multiple_budgets(self, db_session):
        """Test creating multiple budgets with different labels."""
        service = BudgetService(db_session)

        labels = ["GROCERIES", "GAS", "MORTGAGE"]
        for label in labels:
            budget_data = BudgetCreate(
                expense_type="ESSENTIAL",
                expense_category="DAILY LIVING",
                expense_label=label,
                budgeted=1000.0,
                is_accrual=False,
            )
            service.create(budget_data)

        # Verify all were created
        all_budgets = service.get_all()
        assert len(all_budgets) == 3


class TestBudgetServiceRead:
    """Tests for reading budgets."""

    def test_get_by_id(self, db_session, sample_budget):
        """Test getting budget by ID."""
        service = BudgetService(db_session)
        budget = service.get_by_id(sample_budget.id)

        assert budget is not None
        assert budget.id == sample_budget.id
        assert budget.expense_label == sample_budget.expense_label

    def test_get_by_id_not_found(self, db_session):
        """Test getting non-existent budget returns None."""
        service = BudgetService(db_session)
        budget = service.get_by_id(9999)

        assert budget is None

    def test_get_all(self, db_session):
        """Test getting all budgets."""
        service = BudgetService(db_session)

        # Create multiple budgets
        for i in range(3):
            budget_data = BudgetCreate(
                expense_type="ESSENTIAL",
                expense_category="DAILY LIVING",
                expense_label=f"BUDGET_{i}",
                budgeted=1000.0,
                is_accrual=False,
            )
            service.create(budget_data)

        all_budgets = service.get_all()
        assert len(all_budgets) == 3

    def test_get_all_with_pagination(self, db_session):
        """Test pagination when getting all budgets."""
        service = BudgetService(db_session)

        # Create 5 budgets
        for i in range(5):
            budget_data = BudgetCreate(
                expense_type="ESSENTIAL",
                expense_category="DAILY LIVING",
                expense_label=f"BUDGET_{i}",
                budgeted=1000.0,
                is_accrual=False,
            )
            service.create(budget_data)

        # Test pagination
        page1 = service.get_all(skip=0, limit=2)
        page2 = service.get_all(skip=2, limit=2)
        page3 = service.get_all(skip=4, limit=2)

        assert len(page1) == 2
        assert len(page2) == 2
        assert len(page3) == 1

    def test_get_by_type(self, db_session):
        """Test getting budgets by expense type."""
        service = BudgetService(db_session)

        # Create mixed types
        for i in range(3):
            budget_data = BudgetCreate(
                expense_type="ESSENTIAL",
                expense_category="DAILY LIVING",
                expense_label=f"ESSENTIAL_{i}",
                budgeted=1000.0,
                is_accrual=False,
            )
            service.create(budget_data)

        for i in range(2):
            budget_data = BudgetCreate(
                expense_type="FUNSIES",
                expense_category="ENTERTAINMENT",
                expense_label=f"FUNSIES_{i}",
                budgeted=500.0,
                is_accrual=False,
            )
            service.create(budget_data)

        # Query by type
        essential = service.get_by_type("ESSENTIAL")
        funsies = service.get_by_type("FUNSIES")

        assert len(essential) == 3
        assert len(funsies) == 2
        assert all(b.expense_type == "ESSENTIAL" for b in essential)
        assert all(b.expense_type == "FUNSIES" for b in funsies)

    def test_get_by_category(self, db_session):
        """Test getting budgets by category."""
        service = BudgetService(db_session)

        # Create budgets in different categories
        for i in range(3):
            budget_data = BudgetCreate(
                expense_type="ESSENTIAL",
                expense_category="DAILY LIVING",
                expense_label=f"LIVING_{i}",
                budgeted=1000.0,
                is_accrual=False,
            )
            service.create(budget_data)

        for i in range(2):
            budget_data = BudgetCreate(
                expense_type="ESSENTIAL",
                expense_category="UTILITIES",
                expense_label=f"UTILS_{i}",
                budgeted=200.0,
                is_accrual=False,
            )
            service.create(budget_data)

        # Query by category
        living = service.get_by_category("DAILY LIVING")
        utils = service.get_by_category("UTILITIES")

        assert len(living) == 3
        assert len(utils) == 2
        assert all(b.expense_category == "DAILY LIVING" for b in living)
        assert all(b.expense_category == "UTILITIES" for b in utils)

    def test_get_by_label(self, db_session, sample_budget):
        """Test getting budget by expense label."""
        service = BudgetService(db_session)
        budget = service.get_by_label(sample_budget.expense_label)

        assert budget is not None
        assert budget.expense_label == sample_budget.expense_label


class TestBudgetServiceUpdate:
    """Tests for updating budgets."""

    def test_update_budget(self, db_session, sample_budget):
        """Test updating a budget."""
        service = BudgetService(db_session)
        update_data = BudgetUpdate(budgeted=1500.0)

        updated = service.update(sample_budget.id, update_data)

        assert updated is not None
        assert updated.budgeted == 1500.0
        assert updated.expense_label == sample_budget.expense_label  # Unchanged

    def test_update_budget_not_found(self, db_session):
        """Test updating non-existent budget returns None."""
        service = BudgetService(db_session)
        update_data = BudgetUpdate(budgeted=1500.0)

        result = service.update(9999, update_data)

        assert result is None

    def test_partial_update(self, db_session, sample_budget):
        """Test partial update of budget fields."""
        service = BudgetService(db_session)
        original_label = sample_budget.expense_label

        # Update only category
        update_data = BudgetUpdate(expense_category="NEW CATEGORY")
        updated = service.update(sample_budget.id, update_data)

        assert updated.expense_category == "NEW CATEGORY"
        assert updated.expense_label == original_label  # Unchanged
        assert updated.budgeted == sample_budget.budgeted  # Unchanged

    def test_update_multiple_fields(self, db_session, sample_budget):
        """Test updating multiple fields at once."""
        service = BudgetService(db_session)

        update_data = BudgetUpdate(
            budgeted=2000.0,
            is_accrual=True,
            expense_category="NEW CATEGORY",
        )
        updated = service.update(sample_budget.id, update_data)

        assert updated.budgeted == 2000.0
        assert updated.is_accrual is True
        assert updated.expense_category == "NEW CATEGORY"
        assert updated.expense_label == sample_budget.expense_label  # Unchanged


class TestBudgetServiceDelete:
    """Tests for deleting budgets."""

    def test_delete_budget(self, db_session, sample_budget):
        """Test deleting a budget."""
        service = BudgetService(db_session)

        success = service.delete(sample_budget.id)

        assert success is True
        assert service.get_by_id(sample_budget.id) is None

    def test_delete_budget_not_found(self, db_session):
        """Test deleting non-existent budget returns False."""
        service = BudgetService(db_session)

        success = service.delete(9999)

        assert success is False


class TestBudgetServiceUtilities:
    """Tests for utility methods."""

    def test_count(self, db_session):
        """Test counting budgets."""
        service = BudgetService(db_session)

        # Create some budgets
        for i in range(3):
            budget_data = BudgetCreate(
                expense_type="ESSENTIAL",
                expense_category="DAILY LIVING",
                expense_label=f"BUDGET_{i}",
                budgeted=1000.0,
                is_accrual=False,
            )
            service.create(budget_data)

        count = service.count()
        assert count == 3

    def test_exists(self, db_session, sample_budget):
        """Test checking if budget exists."""
        service = BudgetService(db_session)

        assert service.exists(sample_budget.id) is True
        assert service.exists(9999) is False
