"""Tests for the CSV upload API router."""

from datetime import date
from decimal import Decimal

from backend.app.db.models.transaction import ReviewStatus, Transaction, TransactionStatus


class TestCsvUploadRouter:
    """Test CSV preview and confirm flows."""

    def test_preview_filters_transactions_that_were_already_imported(self, client, db_session, sample_user):
        """Preview should mark matching transactions as filtered duplicates."""
        db_session.add(
            Transaction(
                user_id=sample_user.id,
                transaction_date=date(2026, 3, 3),
                post_date=date(2026, 3, 4),
                description="COFFEE SHOP",
                merchant="COFFEE SHOP",
                account="Chase Credit Card",
                amount=Decimal("6.25"),
                is_accrual=False,
                status=TransactionStatus.ACTIVE.value,
                review_status=ReviewStatus.PENDING.value,
            )
        )
        db_session.commit()

        csv_content = "\n".join(
            [
                "Transaction Date,Post Date,Description,Category,Type,Amount,Memo",
                "03/03/2026,03/04/2026,coffee shop,Food & Drink,Sale,-6.25,",
                "03/05/2026,03/06/2026,BOOK STORE,Shopping,Sale,-12.99,",
            ]
        )

        response = client.post(
            "/api/transactions/upload/preview",
            files=[("files", ("Chase1466_Activity.csv", csv_content, "text/csv"))],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 2
        assert data["import_count"] == 1
        assert data["filtered_count"] == 1
        assert data["transactions"][0]["is_filtered"] is True
        assert "Already imported" in data["transactions"][0]["filter_reason"]
        assert data["transactions"][1]["is_filtered"] is False

    def test_confirm_skips_duplicate_transactions(self, client, db_session, sample_user):
        """Confirm should skip duplicates even if a matching row is sent for import."""
        db_session.add(
            Transaction(
                user_id=sample_user.id,
                transaction_date=date(2026, 3, 7),
                post_date=date(2026, 3, 7),
                description="GROCERY STORE",
                merchant="GROCERY STORE",
                account="Chase Checking",
                amount=Decimal("42.15"),
                is_accrual=False,
                status=TransactionStatus.ACTIVE.value,
                review_status=ReviewStatus.PENDING.value,
            )
        )
        db_session.commit()

        response = client.post(
            "/api/transactions/upload/confirm",
            json={
                "import_batch_id": "batch-123",
                "transactions": [
                    {
                        "row_number": 2,
                        "account": "2939",
                        "account_name": "Chase Checking",
                        "transaction_date": None,
                        "post_date": "2026-03-07",
                        "description": "grocery  store",
                        "details": "DEBIT",
                        "amount": "42.15",
                        "chase_category": None,
                        "is_filtered": False,
                        "filter_reason": None,
                        "validation_errors": [],
                        "budget_id": None,
                        "auto_categorized": False,
                    },
                    {
                        "row_number": 3,
                        "account": "2939",
                        "account_name": "Chase Checking",
                        "transaction_date": None,
                        "post_date": "2026-03-08",
                        "description": "Gas Station",
                        "details": "DEBIT",
                        "amount": "30.00",
                        "chase_category": None,
                        "is_filtered": False,
                        "filter_reason": None,
                        "validation_errors": [],
                        "budget_id": None,
                        "auto_categorized": False,
                    },
                ],
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["count"] == 1
        assert data["skipped_duplicates"] == 1
        assert "skipped 1 duplicate" in data["message"]
        assert db_session.query(Transaction).count() == 2
