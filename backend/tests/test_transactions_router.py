"""Tests for the Transactions API router."""

from datetime import date


class TestTransactionsRouterRead:
    """Test GET endpoints."""

    def test_get_all_transactions(self, client):
        """Test GET /api/transactions returns empty list initially."""
        response = client.get("/api/transactions")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_all_transactions_with_data(self, client, sample_transaction):
        """Test GET /api/transactions returns transactions."""
        response = client.get("/api/transactions")

        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert any(t["id"] == sample_transaction.id for t in data)

    def test_get_single_transaction(self, client, sample_transaction):
        """Test GET /api/transactions/{id} returns single transaction."""
        response = client.get(f"/api/transactions/{sample_transaction.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_transaction.id
        assert data["description"] == sample_transaction.description

    def test_get_transaction_not_found(self, client):
        """Test GET /api/transactions/{id} returns 404 for non-existent transaction."""
        response = client.get("/api/transactions/99999")

        assert response.status_code == 404

    def test_get_transactions_with_date_range_filter(self, client, sample_user):
        """Test GET /api/transactions with date range filters."""
        # Create transactions
        client.post(
            "/api/transactions",
            json={
                "date": "2025-01-10",
                "description": "Early",
                "amount": 10.0,
            },
        )
        client.post(
            "/api/transactions",
            json={
                "date": "2025-01-20",
                "description": "Late",
                "amount": 20.0,
            },
        )

        # Query with date range
        response = client.get("/api/transactions?start_date=2025-01-15&end_date=2025-01-25")

        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert all(date.fromisoformat(t["date"]) <= date(2025, 1, 25) for t in data)

    def test_get_transactions_with_account_filter(self, client):
        """Test GET /api/transactions with account filter."""
        # Create transactions
        client.post(
            "/api/transactions",
            json={
                "date": "2025-01-15",
                "description": "Discover",
                "amount": 50.0,
                "account": "Discover",
            },
        )
        client.post(
            "/api/transactions",
            json={
                "date": "2025-01-15",
                "description": "Chase",
                "amount": 75.0,
                "account": "Chase Checking",
            },
        )

        # Query by account
        response = client.get("/api/transactions?account=Discover")

        assert response.status_code == 200
        data = response.json()
        assert all(t["account"] == "Discover" for t in data)


class TestTransactionsRouterCreate:
    """Test POST endpoints."""

    def test_create_transaction(self, client):
        """Test POST /api/transactions creates a transaction."""
        response = client.post(
            "/api/transactions",
            json={
                "date": "2025-01-15",
                "description": "Coffee",
                "merchant": "Starbucks",
                "amount": 5.50,
                "account": "Discover",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["id"] is not None
        assert data["description"] == "Coffee"
        assert data["amount"] == "5.50"
        assert data["user_id"] == 1  # Default hardcoded user

    def test_create_transaction_minimal_fields(self, client):
        """Test POST /api/transactions with minimal required fields."""
        response = client.post(
            "/api/transactions",
            json={
                "date": "2025-01-15",
                "description": "Grocery Store",
                "amount": 100.00,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["description"] == "Grocery Store"
        assert data["status"] == "active"
        assert data["review_status"] == "pending"

    def test_create_transaction_invalid_data(self, client):
        """Test POST /api/transactions with invalid data."""
        response = client.post(
            "/api/transactions",
            json={
                "description": "No Date",
                "amount": 50.0,
                # Missing required 'date' field
            },
        )

        assert response.status_code == 422  # Validation error

    def test_create_transaction_with_all_fields(self, client):
        """Test POST /api/transactions with all fields populated."""
        response = client.post(
            "/api/transactions",
            json={
                "date": "2025-01-15",
                "post_date": "2025-01-16",
                "description": "Full Transaction",
                "merchant": "Test Store",
                "amount": 50.0,
                "account": "Discover",
                "category_id": None,
                "spread_start_date": "2025-01-01",
                "spread_months": 6,
                "status": "active",
                "review_status": "pending",
                "import_batch_id": "batch-001",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["is_accrual"] is True
        assert data["spread_start_date"] == "2025-01-01"
        assert data["spread_months"] == 6
        assert data["import_batch_id"] == "batch-001"

    def test_create_transaction_with_legacy_accrual_backfills_spread(self, client):
        """Test legacy is_accrual input backfills a default 12-month spread."""
        response = client.post(
            "/api/transactions",
            json={
                "date": "2025-07-15",
                "description": "Legacy Charge",
                "amount": 120.0,
                "is_accrual": True,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["spread_start_date"] == "2025-07-01"
        assert data["spread_months"] == 12
        assert data["is_accrual"] is True


class TestTransactionsRouterUpdate:
    """Test PUT/PATCH endpoints."""

    def test_update_transaction(self, client, sample_transaction):
        """Test PUT /api/transactions/{id} updates a transaction."""
        response = client.put(
            f"/api/transactions/{sample_transaction.id}",
            json={
                "date": "2025-01-15",
                "description": "Updated Description",
                "amount": 75.0,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Updated Description"
        assert data["amount"] == "75.00"

    def test_update_transaction_not_found(self, client):
        """Test PUT /api/transactions/{id} returns 404 for non-existent transaction."""
        response = client.put(
            "/api/transactions/99999",
            json={
                "date": "2025-01-15",
                "description": "Updated",
                "amount": 50.0,
            },
        )

        assert response.status_code == 404

    def test_categorize_transaction(self, client, sample_transaction):
        """Test PATCH /api/transactions/{id}/categorize updates category."""
        response = client.patch(f"/api/transactions/{sample_transaction.id}/categorize?category_id=5")

        assert response.status_code == 200
        data = response.json()
        assert data["category_id"] == 5

    def test_partial_update_transaction(self, client, sample_transaction):
        """Test PUT with partial update (only update description)."""
        response = client.put(
            f"/api/transactions/{sample_transaction.id}",
            json={
                "description": "New Description",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "New Description"
        # Other fields should remain unchanged
        assert data["amount"] == str(sample_transaction.amount)

    def test_update_transaction_spread_fields(self, client, sample_transaction):
        """Test PUT updates spread metadata without clearing unrelated fields."""
        response = client.put(
            f"/api/transactions/{sample_transaction.id}",
            json={
                "spread_start_date": "2025-02-01",
                "spread_months": 6,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["spread_start_date"] == "2025-02-01"
        assert data["spread_months"] == 6
        assert data["is_accrual"] is True

    def test_clear_transaction_spread_fields(self, client, sample_transaction):
        """Test PUT can clear spread metadata."""
        client.put(
            f"/api/transactions/{sample_transaction.id}",
            json={
                "spread_start_date": "2025-01-01",
                "spread_months": 12,
            },
        )

        response = client.put(
            f"/api/transactions/{sample_transaction.id}",
            json={
                "spread_start_date": None,
                "spread_months": None,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["spread_start_date"] is None
        assert data["spread_months"] is None
        assert data["is_accrual"] is False


class TestTransactionsRouterDelete:
    """Test DELETE endpoints."""

    def test_delete_transaction(self, client, sample_transaction):
        """Test DELETE /api/transactions/{id} soft deletes a transaction."""
        response = client.delete(f"/api/transactions/{sample_transaction.id}")

        assert response.status_code == 204

        # Verify it's marked as deleted
        get_response = client.get(f"/api/transactions/{sample_transaction.id}")
        if get_response.status_code == 200:
            data = get_response.json()
            assert data["status"] == "deleted"

    def test_delete_transaction_not_found(self, client):
        """Test DELETE /api/transactions/{id} returns 404 for non-existent."""
        response = client.delete("/api/transactions/99999")

        assert response.status_code == 404

    def test_delete_already_deleted_transaction(self, client, sample_transaction):
        """Test deleting an already deleted transaction."""
        # Delete once
        client.delete(f"/api/transactions/{sample_transaction.id}")

        # Try to delete again
        response = client.delete(f"/api/transactions/{sample_transaction.id}")

        # Should succeed even if already deleted (idempotent)
        assert response.status_code == 204


class TestTransactionsRouterIntegration:
    """Integration tests combining multiple operations."""

    def test_create_read_update_delete_flow(self, client):
        """Test complete CRUD flow."""
        # Create
        create_response = client.post(
            "/api/transactions",
            json={
                "date": "2025-01-15",
                "description": "CRUD Test",
                "amount": 50.0,
            },
        )
        assert create_response.status_code == 201
        transaction_id = create_response.json()["id"]

        # Read
        read_response = client.get(f"/api/transactions/{transaction_id}")
        assert read_response.status_code == 200
        assert read_response.json()["description"] == "CRUD Test"

        # Update
        update_response = client.put(
            f"/api/transactions/{transaction_id}",
            json={"description": "Updated CRUD Test", "amount": 75.0},
        )
        assert update_response.status_code == 200
        assert update_response.json()["description"] == "Updated CRUD Test"

        # Delete
        delete_response = client.delete(f"/api/transactions/{transaction_id}")
        assert delete_response.status_code == 204

    def test_multiple_transactions_filtering(self, client):
        """Test creating multiple transactions and filtering them."""
        # Create multiple transactions
        for i in range(3):
            client.post(
                "/api/transactions",
                json={
                    "date": f"2025-01-{15 + i}",
                    "description": f"Transaction {i}",
                    "amount": 50.0 + i,
                    "account": "Discover" if i % 2 == 0 else "Chase",
                },
            )

        # Get all
        response = client.get("/api/transactions")
        assert response.status_code == 200
        all_txns = response.json()
        assert len(all_txns) >= 3

        # Filter by account
        discover_response = client.get("/api/transactions?account=Discover")
        discover_txns = discover_response.json()
        assert all(t["account"] == "Discover" for t in discover_txns)
