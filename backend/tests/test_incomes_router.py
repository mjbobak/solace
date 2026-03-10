"""Tests for income router endpoints."""

import pytest


@pytest.fixture
def sample_income(db_session):
    """Create sample income entries for testing."""
    from datetime import date

    from backend.app.db.models.income import Income, IncomeEffectiveRange

    income = Income(
        stream="Test Salary",
        type="regular",
        frequency="monthly",
    )
    db_session.add(income)
    db_session.flush()

    # Add effective range
    range_entry = IncomeEffectiveRange(
        income_id=income.id,
        start_date=date.today(),
        end_date=None,
        gross_amount=5000.0,
        net_amount=3500.0,
        periods=12,
    )
    db_session.add(range_entry)
    db_session.commit()
    db_session.refresh(income)

    return income


def test_delete_income_stream_success(client, db_session):
    """Test deleting all entries for a stream."""
    from datetime import date

    from backend.app.db.models.income import Income, IncomeEffectiveRange

    # Create 3 entries with same stream name
    stream_name = "Test Stream"
    for i in range(3):
        income = Income(
            stream=stream_name,
            type="regular",
            frequency="monthly",
        )
        db_session.add(income)
        db_session.flush()

        range_entry = IncomeEffectiveRange(
            income_id=income.id,
            start_date=date.today(),
            end_date=None,
            gross_amount=5000.0 + i,
            net_amount=3500.0 + i,
            periods=12,
        )
        db_session.add(range_entry)

    db_session.commit()

    # Delete the stream
    response = client.delete(f"/api/incomes/stream/{stream_name}")
    assert response.status_code == 204

    # Verify all entries deleted
    response = client.get("/api/incomes/")
    incomes = response.json()
    assert not any(i["stream"] == stream_name for i in incomes)


def test_delete_income_stream_not_found(client):
    """Test deleting non-existent stream returns 404."""
    response = client.delete("/api/incomes/stream/NonExistent")
    assert response.status_code == 404
    assert "No income entries found" in response.json()["detail"]


def test_delete_income_stream_preserves_others(client, db_session):
    """Test that deleting one stream doesn't affect others."""
    from datetime import date

    from backend.app.db.models.income import Income, IncomeEffectiveRange

    # Create Stream A and Stream B
    for stream_name in ["Stream A", "Stream B"]:
        income = Income(
            stream=stream_name,
            type="regular",
            frequency="monthly",
        )
        db_session.add(income)
        db_session.flush()

        range_entry = IncomeEffectiveRange(
            income_id=income.id,
            start_date=date.today(),
            end_date=None,
            gross_amount=5000.0,
            net_amount=3500.0,
            periods=12,
        )
        db_session.add(range_entry)

    db_session.commit()

    # Delete Stream A
    response = client.delete("/api/incomes/stream/Stream A")
    assert response.status_code == 204

    # Verify Stream B still exists and A is gone
    response = client.get("/api/incomes/")
    incomes = response.json()
    assert any(i["stream"] == "Stream B" for i in incomes)
    assert not any(i["stream"] == "Stream A" for i in incomes)


def test_delete_income_stream_with_spaces(client, db_session):
    """Test deleting stream with spaces in name (URL encoding)."""
    from datetime import date

    from backend.app.db.models.income import Income, IncomeEffectiveRange

    stream_name = "Test Stream With Spaces"
    income = Income(
        stream=stream_name,
        type="regular",
        frequency="monthly",
    )
    db_session.add(income)
    db_session.flush()

    range_entry = IncomeEffectiveRange(
        income_id=income.id,
        start_date=date.today(),
        end_date=None,
        gross_amount=5000.0,
        net_amount=3500.0,
        periods=12,
    )
    db_session.add(range_entry)
    db_session.commit()

    # Delete with URL encoding
    response = client.delete(f"/api/incomes/stream/{stream_name}")
    assert response.status_code == 204

    # Verify deleted
    response = client.get("/api/incomes/")
    incomes = response.json()
    assert not any(i["stream"] == stream_name for i in incomes)
