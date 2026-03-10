"""Tests for budget API router."""

import pytest
from fastapi.testclient import TestClient

from backend.app.db.models.budget import Budget
from backend.app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


class TestBudgetRouterRead:
    """Tests for reading budgets via API."""

    def test_get_all_budgets(self, client, db_session):
        """Test getting all budgets."""
        # Create test data
        budget1 = Budget(
            expense_type="ESSENTIAL",
            expense_category="DAILY LIVING",
            expense_label="GROCERIES",
            budgeted=1200.0,
            is_accrual=False,
        )
        budget2 = Budget(
            expense_type="FUNSIES",
            expense_category="ENTERTAINMENT",
            expense_label="MOVIES",
            budgeted=100.0,
            is_accrual=False,
        )
        db_session.add(budget1)
        db_session.add(budget2)
        db_session.commit()

        response = client.get("/api/budgets")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["expense_label"] == "GROCERIES"
        assert data[1]["expense_label"] == "MOVIES"

    def test_get_budgets_with_pagination(self, client, db_session):
        """Test pagination when getting budgets."""
        # Create 5 budgets
        for i in range(5):
            budget = Budget(
                expense_type="ESSENTIAL",
                expense_category="DAILY LIVING",
                expense_label=f"BUDGET_{i}",
                budgeted=1000.0,
                is_accrual=False,
            )
            db_session.add(budget)
        db_session.commit()

        # Test first page
        response = client.get("/api/budgets?skip=0&limit=2")
        assert response.status_code == 200
        assert len(response.json()) == 2

        # Test second page
        response = client.get("/api/budgets?skip=2&limit=2")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_get_budgets_by_expense_type(self, client, db_session):
        """Test filtering budgets by expense type."""
        # Create mixed budgets
        for i in range(3):
            budget = Budget(
                expense_type="ESSENTIAL",
                expense_category="DAILY LIVING",
                expense_label=f"ESSENTIAL_{i}",
                budgeted=1000.0,
                is_accrual=False,
            )
            db_session.add(budget)

        for i in range(2):
            budget = Budget(
                expense_type="FUNSIES",
                expense_category="ENTERTAINMENT",
                expense_label=f"FUNSIES_{i}",
                budgeted=500.0,
                is_accrual=False,
            )
            db_session.add(budget)
        db_session.commit()

        # Filter by type
        response = client.get("/api/budgets?expense_type=ESSENTIAL")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all(b["expense_type"] == "ESSENTIAL" for b in data)

    def test_get_budget_by_id(self, client, db_session):
        """Test getting a specific budget by ID."""
        budget = Budget(
            expense_type="ESSENTIAL",
            expense_category="DAILY LIVING",
            expense_label="GROCERIES",
            budgeted=1200.0,
            is_accrual=False,
        )
        db_session.add(budget)
        db_session.commit()

        response = client.get(f"/api/budgets/{budget.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == budget.id
        assert data["expense_label"] == "GROCERIES"
        assert data["budgeted"] == 1200.0

    def test_get_budget_not_found(self, client):
        """Test getting non-existent budget returns 404."""
        response = client.get("/api/budgets/9999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestBudgetRouterCreate:
    """Tests for creating budgets via API."""

    def test_create_budget(self, client, db_session):
        """Test creating a budget."""
        payload = {
            "expense_type": "ESSENTIAL",
            "expense_category": "DAILY LIVING",
            "expense_label": "GROCERIES",
            "budgeted": 1200.0,
            "is_accrual": False,
        }

        response = client.post("/api/budgets", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["expense_label"] == "GROCERIES"
        assert data["budgeted"] == 1200.0
        assert data["id"] is not None
        assert data["created_at"] is not None

    def test_create_budget_duplicate_label_fails(self, client, db_session):
        """Test that creating a budget with duplicate label fails."""
        # Create first budget
        budget = Budget(
            expense_type="ESSENTIAL",
            expense_category="DAILY LIVING",
            expense_label="GROCERIES",
            budgeted=1200.0,
            is_accrual=False,
        )
        db_session.add(budget)
        db_session.commit()

        # Try to create duplicate
        payload = {
            "expense_type": "ESSENTIAL",
            "expense_category": "DAILY LIVING",
            "expense_label": "GROCERIES",
            "budgeted": 1500.0,
            "is_accrual": False,
        }

        response = client.post("/api/budgets", json=payload)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_create_budget_with_accrual(self, client):
        """Test creating a budget with accrual flag set."""
        payload = {
            "expense_type": "ESSENTIAL",
            "expense_category": "UTILITIES",
            "expense_label": "PROPERTY TAXES",
            "budgeted": 2000.0,
            "is_accrual": True,
        }

        response = client.post("/api/budgets", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["is_accrual"] is True

    def test_create_budget_invalid_data(self, client):
        """Test creating a budget with invalid data fails."""
        # Missing required field
        payload = {
            "expense_type": "ESSENTIAL",
            "expense_category": "DAILY LIVING",
            # Missing expense_label
            "budgeted": 1200.0,
        }

        response = client.post("/api/budgets", json=payload)

        assert response.status_code == 422  # Pydantic validation error


class TestBudgetRouterUpdate:
    """Tests for updating budgets via API."""

    def test_update_budget(self, client, db_session):
        """Test updating a budget."""
        budget = Budget(
            expense_type="ESSENTIAL",
            expense_category="DAILY LIVING",
            expense_label="GROCERIES",
            budgeted=1200.0,
            is_accrual=False,
        )
        db_session.add(budget)
        db_session.commit()

        payload = {"budgeted": 1500.0}

        response = client.put(f"/api/budgets/{budget.id}", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["budgeted"] == 1500.0
        assert data["expense_label"] == "GROCERIES"  # Unchanged

    def test_update_budget_not_found(self, client):
        """Test updating non-existent budget returns 404."""
        payload = {"budgeted": 1500.0}

        response = client.put("/api/budgets/9999", json=payload)

        assert response.status_code == 404

    def test_partial_update(self, client, db_session):
        """Test partial update of budget fields."""
        budget = Budget(
            expense_type="ESSENTIAL",
            expense_category="DAILY LIVING",
            expense_label="GROCERIES",
            budgeted=1200.0,
            is_accrual=False,
        )
        db_session.add(budget)
        db_session.commit()

        # Update only category
        payload = {"expense_category": "UTILITIES"}

        response = client.put(f"/api/budgets/{budget.id}", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["expense_category"] == "UTILITIES"
        assert data["budgeted"] == 1200.0  # Unchanged

    def test_update_multiple_fields(self, client, db_session):
        """Test updating multiple fields at once."""
        budget = Budget(
            expense_type="ESSENTIAL",
            expense_category="DAILY LIVING",
            expense_label="GROCERIES",
            budgeted=1200.0,
            is_accrual=False,
        )
        db_session.add(budget)
        db_session.commit()

        payload = {
            "budgeted": 1500.0,
            "is_accrual": True,
            "expense_category": "FOOD & DINING",
        }

        response = client.put(f"/api/budgets/{budget.id}", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["budgeted"] == 1500.0
        assert data["is_accrual"] is True
        assert data["expense_category"] == "FOOD & DINING"


class TestBudgetRouterDelete:
    """Tests for deleting budgets via API."""

    def test_delete_budget(self, client, db_session):
        """Test deleting a budget."""
        budget = Budget(
            expense_type="ESSENTIAL",
            expense_category="DAILY LIVING",
            expense_label="GROCERIES",
            budgeted=1200.0,
            is_accrual=False,
        )
        db_session.add(budget)
        db_session.commit()

        response = client.delete(f"/api/budgets/{budget.id}")

        assert response.status_code == 204

        # Verify it's deleted
        verify_response = client.get(f"/api/budgets/{budget.id}")
        assert verify_response.status_code == 404

    def test_delete_budget_not_found(self, client):
        """Test deleting non-existent budget returns 404."""
        response = client.delete("/api/budgets/9999")

        assert response.status_code == 404


class TestBudgetRouterIntegration:
    """Integration tests for budget operations."""

    def test_full_crud_cycle(self, client, db_session):
        """Test full CRUD cycle: create, read, update, delete."""
        # Create
        create_payload = {
            "expense_type": "ESSENTIAL",
            "expense_category": "DAILY LIVING",
            "expense_label": "GROCERIES",
            "budgeted": 1200.0,
            "is_accrual": False,
        }
        create_response = client.post("/api/budgets", json=create_payload)
        assert create_response.status_code == 201
        budget_id = create_response.json()["id"]

        # Read
        read_response = client.get(f"/api/budgets/{budget_id}")
        assert read_response.status_code == 200
        assert read_response.json()["expense_label"] == "GROCERIES"

        # Update
        update_payload = {"budgeted": 1500.0}
        update_response = client.put(f"/api/budgets/{budget_id}", json=update_payload)
        assert update_response.status_code == 200
        assert update_response.json()["budgeted"] == 1500.0

        # Delete
        delete_response = client.delete(f"/api/budgets/{budget_id}")
        assert delete_response.status_code == 204

        # Verify deletion
        verify_response = client.get(f"/api/budgets/{budget_id}")
        assert verify_response.status_code == 404
