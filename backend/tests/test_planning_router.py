"""Tests for planning-year discovery."""

from datetime import date

from backend.app.db.models.transaction import Transaction


def create_source(client, name: str) -> dict:
    response = client.post("/api/incomes/sources", json={"name": name})
    assert response.status_code == 201
    return response.json()


def create_component(
    client,
    source_id: int,
    *,
    component_type: str,
    component_mode: str,
    label: str | None = None,
) -> dict:
    response = client.post(
        f"/api/incomes/sources/{source_id}/components",
        json={
            "component_type": component_type,
            "component_mode": component_mode,
            "label": label,
        },
    )
    assert response.status_code == 201
    return response.json()


def create_version(
    client,
    component_id: int,
    *,
    start_date: str,
    gross_amount: float,
    net_amount: float,
    periods_per_year: int,
    end_date: str | None = None,
) -> dict:
    response = client.post(
        f"/api/incomes/components/{component_id}/versions",
        json={
            "start_date": start_date,
            "end_date": end_date,
            "gross_amount": gross_amount,
            "net_amount": net_amount,
            "periods_per_year": periods_per_year,
        },
    )
    assert response.status_code == 201
    return response.json()


def create_occurrence(
    client,
    component_id: int,
    *,
    status: str,
    planned_date: str,
    gross_amount: float,
    net_amount: float,
    paid_date: str | None = None,
) -> dict:
    response = client.post(
        f"/api/incomes/components/{component_id}/occurrences",
        json={
            "status": status,
            "planned_date": planned_date,
            "paid_date": paid_date,
            "gross_amount": gross_amount,
            "net_amount": net_amount,
        },
    )
    assert response.status_code == 201
    return response.json()


def create_transaction(
    db_session,
    *,
    user_id: int,
    transaction_date: date,
    is_accrual: bool = False,
    spread_start_date: date | None = None,
    spread_months: int | None = None,
) -> Transaction:
    transaction = Transaction(
        user_id=user_id,
        transaction_date=transaction_date,
        post_date=transaction_date,
        description="Planning year seed",
        merchant="Planner",
        account="Checking",
        amount=100.0,
        is_accrual=is_accrual,
        spread_start_date=spread_start_date,
        spread_months=spread_months,
        status="active",
        review_status="pending",
    )
    db_session.add(transaction)
    db_session.commit()
    db_session.refresh(transaction)
    return transaction


def test_planning_years_only_include_years_backed_by_data(client, db_session, sample_user):
    create_transaction(
        db_session,
        user_id=sample_user.id,
        transaction_date=date(2024, 6, 15),
    )
    create_transaction(
        db_session,
        user_id=sample_user.id,
        transaction_date=date(2025, 11, 20),
        is_accrual=True,
        spread_start_date=date(2025, 11, 1),
        spread_months=4,
    )

    source = create_source(client, "Acme Corp")
    component = create_component(
        client,
        source["id"],
        component_type="base_pay",
        component_mode="recurring",
        label="Base pay",
    )
    create_version(
        client,
        component["id"],
        start_date="2026-01-01",
        gross_amount=7000,
        net_amount=5000,
        periods_per_year=12,
    )

    response = client.get("/api/planning/years")

    assert response.status_code == 200
    assert response.json() == [2025, 2026]


def test_planning_years_include_explicit_future_year_data(client):
    source = create_source(client, "Bright Labs")
    component = create_component(
        client,
        source["id"],
        component_type="bonus",
        component_mode="occurrence",
        label="Retention bonus",
    )
    create_occurrence(
        client,
        component["id"],
        status="expected",
        planned_date="2027-02-15",
        gross_amount=5000,
        net_amount=3500,
    )

    response = client.get("/api/planning/years")

    assert response.status_code == 200
    assert response.json() == [2025, 2027]
