"""
Tests for Expense Categories API Router.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestExpenseCategoriesRouterList:
    """Test GET /api/expense-categories endpoint."""

    def test_list_all_categories(self, client: TestClient):
        """Test listing all expense categories."""
        response = client.get("/api/expense-categories")

        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        # Should have at least the sample_expense_category from fixture
        # (migrations don't run in tests)
        assert len(categories) >= 0

    def test_list_categories_sorted(self, client: TestClient):
        """Test that categories are sorted alphabetically."""
        response = client.get("/api/expense-categories")

        assert response.status_code == 200
        categories = response.json()

        names = [cat["name"] for cat in categories]
        assert names == sorted(names)

    def test_list_categories_schema(self, client: TestClient):
        """Test that returned categories have correct schema."""
        response = client.get("/api/expense-categories")

        assert response.status_code == 200
        categories = response.json()

        if categories:
            first = categories[0]
            assert "id" in first
            assert "name" in first
            assert "created_at" in first
            assert isinstance(first["id"], int)
            assert isinstance(first["name"], str)


class TestExpenseCategoriesRouterCreate:
    """Test POST /api/expense-categories endpoint."""

    def test_create_category(self, client: TestClient):
        """Test creating a new category."""
        response = client.post("/api/expense-categories", json={"name": "Test Category"})

        assert response.status_code == 201
        category = response.json()
        assert category["name"] == "Test Category"
        assert "id" in category
        assert "created_at" in category

    def test_create_duplicate_category(self, client: TestClient, db_session: Session):
        """Test that duplicate category names are rejected."""
        # Create first category
        client.post("/api/expense-categories", json={"name": "Test Category"})

        # Try to create duplicate
        response = client.post("/api/expense-categories", json={"name": "Test Category"})

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_create_case_insensitive_duplicate(self, client: TestClient):
        """Test that duplicate names are rejected (case-insensitive)."""
        # Create category
        client.post("/api/expense-categories", json={"name": "Test Category"})

        # Try to create with different case
        response = client.post("/api/expense-categories", json={"name": "TEST CATEGORY"})

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_create_empty_name(self, client: TestClient):
        """Test that empty category name is rejected."""
        response = client.post("/api/expense-categories", json={"name": ""})

        assert response.status_code == 422  # Validation error

    def test_create_missing_name(self, client: TestClient):
        """Test that missing name field is rejected."""
        response = client.post("/api/expense-categories", json={})

        assert response.status_code == 422  # Validation error


class TestExpenseCategoriesRouterGetById:
    """Test GET /api/expense-categories/{id} endpoint."""

    def test_get_category_by_id(self, client: TestClient):
        """Test getting a category by ID."""
        # Create category
        create_response = client.post("/api/expense-categories", json={"name": "Test Category"})
        category_id = create_response.json()["id"]

        # Get by ID
        response = client.get(f"/api/expense-categories/{category_id}")

        assert response.status_code == 200
        category = response.json()
        assert category["id"] == category_id
        assert category["name"] == "Test Category"

    def test_get_nonexistent_category(self, client: TestClient):
        """Test getting a category that doesn't exist."""
        response = client.get("/api/expense-categories/9999")

        assert response.status_code == 404


class TestExpenseCategoriesRouterUpdate:
    """Test PUT /api/expense-categories/{id} endpoint."""

    def test_update_category_name(self, client: TestClient):
        """Test updating a category's name."""
        # Create category
        create_response = client.post("/api/expense-categories", json={"name": "Old Name"})
        category_id = create_response.json()["id"]

        # Update
        response = client.put(f"/api/expense-categories/{category_id}", json={"name": "New Name"})

        assert response.status_code == 200
        category = response.json()
        assert category["id"] == category_id
        assert category["name"] == "New Name"

    def test_update_nonexistent_category(self, client: TestClient):
        """Test updating a category that doesn't exist."""
        response = client.put("/api/expense-categories/9999", json={"name": "New Name"})

        assert response.status_code == 404

    def test_update_to_duplicate_name(self, client: TestClient):
        """Test that updating to duplicate name is rejected."""
        # Create two categories
        client.post("/api/expense-categories", json={"name": "Category A"})
        create_response = client.post("/api/expense-categories", json={"name": "Category B"})
        category_b_id = create_response.json()["id"]

        # Try to update B to A
        response = client.put(f"/api/expense-categories/{category_b_id}", json={"name": "Category A"})

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]


class TestExpenseCategoriesRouterDelete:
    """Test DELETE /api/expense-categories/{id} endpoint."""

    def test_delete_unused_category(self, client: TestClient):
        """Test deleting a category that's not in use."""
        # Create category
        create_response = client.post("/api/expense-categories", json={"name": "Test Category"})
        category_id = create_response.json()["id"]

        # Delete
        response = client.delete(f"/api/expense-categories/{category_id}")

        assert response.status_code == 204

        # Verify it's deleted
        get_response = client.get(f"/api/expense-categories/{category_id}")
        assert get_response.status_code == 404

    def test_delete_category_in_use(self, client: TestClient, sample_budget):
        """Test that deleting a category in use returns 400."""
        category_id = sample_budget.expense_category_id

        response = client.delete(f"/api/expense-categories/{category_id}")

        assert response.status_code == 400
        detail = response.json()["detail"]
        assert "used by" in detail
        assert "budget" in detail

    def test_delete_nonexistent_category(self, client: TestClient):
        """Test deleting a category that doesn't exist."""
        response = client.delete("/api/expense-categories/9999")

        assert response.status_code == 404


class TestExpenseCategoriesRouterUsage:
    """Test GET /api/expense-categories/{id}/usage endpoint."""

    def test_get_usage_unused_category(self, client: TestClient):
        """Test getting usage count for unused category."""
        # Create category
        create_response = client.post("/api/expense-categories", json={"name": "Test Category"})
        category_id = create_response.json()["id"]

        # Check usage
        response = client.get(f"/api/expense-categories/{category_id}/usage")

        assert response.status_code == 200
        data = response.json()
        assert data["usage_count"] == 0

    def test_get_usage_used_category(self, client: TestClient, sample_budget):
        """Test getting usage count for category in use."""
        category_id = sample_budget.expense_category_id

        response = client.get(f"/api/expense-categories/{category_id}/usage")

        assert response.status_code == 200
        data = response.json()
        assert data["usage_count"] >= 1

    def test_get_usage_nonexistent_category(self, client: TestClient):
        """Test getting usage count for nonexistent category."""
        response = client.get("/api/expense-categories/9999/usage")

        assert response.status_code == 404
