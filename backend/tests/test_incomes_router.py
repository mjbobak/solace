"""Tests for the source-first income router and projection model."""

from datetime import date

from backend.app.db.models.income import (
    IncomeComponent,
    IncomeComponentVersion,
    IncomeOccurrence,
    IncomeSource,
    IncomeYearSettings,
    IncomeYearTaxAdvantagedBucket,
)


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


def get_projection(client, year: int) -> dict:
    response = client.get(f"/api/incomes/projection?year={year}")
    assert response.status_code == 200
    return response.json()


def update_year_settings(
    client,
    year: int,
    *,
    tax_advantaged_buckets: list[dict] | None = None,
    emergency_fund_balance: float | None = None,
    primary_runway_source_id: int | None = None,
    secondary_runway_source_id: int | None = None,
) -> dict:
    payload: dict[str, object] = {}
    if tax_advantaged_buckets is not None:
        payload["tax_advantaged_buckets"] = tax_advantaged_buckets
    if emergency_fund_balance is not None:
        payload["emergency_fund_balance"] = emergency_fund_balance
    if primary_runway_source_id is not None:
        payload["primary_runway_source_id"] = primary_runway_source_id
    if secondary_runway_source_id is not None:
        payload["secondary_runway_source_id"] = secondary_runway_source_id

    response = client.put(
        f"/api/incomes/year-settings/{year}",
        json=payload,
    )
    assert response.status_code == 200
    return response.json()


def prorated_annual_total(
    *,
    amount_per_period: float,
    periods_per_year: int,
    start_date: date,
    end_date: date | None,
    year: int,
) -> float:
    year_start = date(year, 1, 1)
    year_end = date(year, 12, 31)
    effective_start = max(start_date, year_start)
    effective_end = min(end_date or year_end, year_end)
    overlap_days = (effective_end - effective_start).days + 1
    return round((amount_per_period * periods_per_year * overlap_days) / 365, 2)


def test_income_projection_rolls_up_source_component_and_bonus_totals(client):
    """Projection returns top-level sources with nested components and correct totals."""
    source_a = create_source(client, "Acme Corp")
    source_b = create_source(client, "Bright Labs")

    base_a = create_component(
        client,
        source_a["id"],
        component_type="base_pay",
        component_mode="recurring",
        label="Base pay",
    )
    bonus_a = create_component(
        client,
        source_a["id"],
        component_type="bonus",
        component_mode="occurrence",
        label="Annual bonus",
    )
    base_b = create_component(
        client,
        source_b["id"],
        component_type="base_pay",
        component_mode="recurring",
        label="Base pay",
    )

    create_version(
        client,
        base_a["id"],
        start_date="2026-01-01",
        gross_amount=8000,
        net_amount=6000,
        periods_per_year=12,
    )
    create_version(
        client,
        base_b["id"],
        start_date="2026-01-01",
        gross_amount=5000,
        net_amount=4000,
        periods_per_year=12,
    )
    create_occurrence(
        client,
        bonus_a["id"],
        status="actual",
        planned_date="2026-03-15",
        paid_date="2026-03-20",
        gross_amount=10000,
        net_amount=7000,
    )
    create_occurrence(
        client,
        bonus_a["id"],
        status="expected",
        planned_date="2026-12-15",
        gross_amount=8000,
        net_amount=5600,
    )

    projection = get_projection(client, 2026)

    assert projection["year"] == 2026
    assert projection["emergency_fund_balance"] == 18000
    assert projection["tax_advantaged_investments"] == {
        "entries": [
            {"bucket_type": "401k", "annual_amount": 0},
            {"bucket_type": "hsa", "annual_amount": 0},
            {"bucket_type": "fsa_daycare", "annual_amount": 0},
            {"bucket_type": "fsa_medical", "annual_amount": 0},
        ],
        "locked_total": 0,
        "spendable_total": 0,
        "total": 0,
    }
    assert len(projection["sources"]) == 2
    assert projection["sources"][0]["name"] == "Acme Corp"
    assert len(projection["sources"][0]["components"]) == 2

    expected_committed_net = (6000 * 12) + (4000 * 12) + 7000
    expected_planned_net = expected_committed_net + 5600

    assert projection["totals"]["committed_cash_net"] == expected_committed_net
    assert projection["totals"]["committed_net"] == expected_committed_net
    assert projection["totals"]["planned_cash_net"] == expected_planned_net
    assert projection["totals"]["planned_net"] == expected_planned_net
    assert projection["sources"][0]["totals"]["planned_cash_net"] == (6000 * 12) + 7000 + 5600
    assert projection["sources"][0]["totals"]["planned_net"] == (6000 * 12) + 7000 + 5600
    assert projection["sources"][1]["totals"]["planned_cash_net"] == 4000 * 12
    assert projection["sources"][1]["totals"]["planned_net"] == 4000 * 12


def test_year_settings_can_be_created_updated_and_returned_in_projection(client, db_session):
    """Year-scoped dashboard settings should persist and flow through the projection read model."""
    created = update_year_settings(
        client,
        2026,
        tax_advantaged_buckets=[
            {"bucket_type": "401k", "annual_amount": 19500},
            {"bucket_type": "hsa", "annual_amount": 1000},
            {"bucket_type": "fsa_daycare", "annual_amount": 2500},
            {"bucket_type": "fsa_medical", "annual_amount": 500},
        ],
    )
    assert created["year"] == 2026
    assert created["tax_advantaged_buckets"] == [
        {"bucket_type": "401k", "annual_amount": 19500},
        {"bucket_type": "hsa", "annual_amount": 1000},
        {"bucket_type": "fsa_daycare", "annual_amount": 2500},
        {"bucket_type": "fsa_medical", "annual_amount": 500},
    ]
    assert created["emergency_fund_balance"] == 18000
    assert created["primary_runway_source_id"] is None
    assert created["secondary_runway_source_id"] is None

    projection = get_projection(client, 2026)
    assert projection["emergency_fund_balance"] == 18000
    assert projection["primary_runway_source_id"] is None
    assert projection["secondary_runway_source_id"] is None
    assert projection["tax_advantaged_investments"] == {
        "entries": [
            {"bucket_type": "401k", "annual_amount": 19500},
            {"bucket_type": "hsa", "annual_amount": 1000},
            {"bucket_type": "fsa_daycare", "annual_amount": 2500},
            {"bucket_type": "fsa_medical", "annual_amount": 500},
        ],
        "locked_total": 20500,
        "spendable_total": 3000,
        "total": 23500,
    }
    assert projection["totals"]["committed_cash_net"] == 0
    assert projection["totals"]["committed_net"] == 2500
    assert projection["totals"]["planned_cash_net"] == 0
    assert projection["totals"]["planned_net"] == 2500

    updated = update_year_settings(
        client,
        2026,
        tax_advantaged_buckets=[
            {"bucket_type": "401k", "annual_amount": 22000},
            {"bucket_type": "hsa", "annual_amount": 1500},
            {"bucket_type": "fsa_daycare", "annual_amount": 3000},
            {"bucket_type": "fsa_medical", "annual_amount": 250},
        ],
        emergency_fund_balance=24000,
    )
    assert updated["tax_advantaged_buckets"][0] == {
        "bucket_type": "401k",
        "annual_amount": 22000,
    }
    assert updated["emergency_fund_balance"] == 24000
    assert updated["primary_runway_source_id"] is None
    assert updated["secondary_runway_source_id"] is None

    db_row = db_session.query(IncomeYearSettings).filter(IncomeYearSettings.year == 2026).one()
    assert db_row.emergency_fund_balance == 24000
    assert db_row.primary_runway_source_id is None
    assert db_row.secondary_runway_source_id is None
    bucket_rows = (
        db_session.query(IncomeYearTaxAdvantagedBucket)
        .filter(IncomeYearTaxAdvantagedBucket.year_settings_id == db_row.id)
        .order_by(IncomeYearTaxAdvantagedBucket.bucket_type.asc())
        .all()
    )
    assert [(bucket.bucket_type, bucket.annual_amount) for bucket in bucket_rows] == [
        ("401k", 22000),
        ("fsa_daycare", 3000),
        ("fsa_medical", 250),
        ("hsa", 1500),
    ]

    projection = get_projection(client, 2026)
    assert projection["emergency_fund_balance"] == 24000
    assert projection["primary_runway_source_id"] is None
    assert projection["secondary_runway_source_id"] is None


def test_year_settings_can_store_runway_source_ids(client, db_session):
    """Runway scenarios should persist stable source ids instead of matching source names."""
    primary_source = create_source(client, "Main Job")
    secondary_source = create_source(client, "Side Gig")

    updated = update_year_settings(
        client,
        2026,
        primary_runway_source_id=primary_source["id"],
        secondary_runway_source_id=secondary_source["id"],
    )

    assert updated["primary_runway_source_id"] == primary_source["id"]
    assert updated["secondary_runway_source_id"] == secondary_source["id"]

    db_row = db_session.query(IncomeYearSettings).filter(IncomeYearSettings.year == 2026).one()
    assert db_row.primary_runway_source_id == primary_source["id"]
    assert db_row.secondary_runway_source_id == secondary_source["id"]

    projection = get_projection(client, 2026)
    assert projection["primary_runway_source_id"] == primary_source["id"]
    assert projection["secondary_runway_source_id"] == secondary_source["id"]


def test_year_settings_partial_updates_preserve_existing_values(client, db_session):
    """Saving one year setting should not overwrite the others."""
    primary_source = create_source(client, "Main Job")
    secondary_source = create_source(client, "Side Gig")

    update_year_settings(
        client,
        2026,
        tax_advantaged_buckets=[
            {"bucket_type": "401k", "annual_amount": 19500},
            {"bucket_type": "hsa", "annual_amount": 1200},
            {"bucket_type": "fsa_daycare", "annual_amount": 1500},
            {"bucket_type": "fsa_medical", "annual_amount": 300},
        ],
        emergency_fund_balance=21000,
        primary_runway_source_id=primary_source["id"],
        secondary_runway_source_id=secondary_source["id"],
    )

    updated = update_year_settings(client, 2026, emergency_fund_balance=26000)

    assert updated["tax_advantaged_buckets"][0] == {
        "bucket_type": "401k",
        "annual_amount": 19500,
    }
    assert updated["emergency_fund_balance"] == 26000
    assert updated["primary_runway_source_id"] == primary_source["id"]
    assert updated["secondary_runway_source_id"] == secondary_source["id"]

    db_row = db_session.query(IncomeYearSettings).filter(IncomeYearSettings.year == 2026).one()
    assert db_row.emergency_fund_balance == 26000
    assert db_row.primary_runway_source_id == primary_source["id"]
    assert db_row.secondary_runway_source_id == secondary_source["id"]
    bucket_rows = (
        db_session.query(IncomeYearTaxAdvantagedBucket)
        .filter(IncomeYearTaxAdvantagedBucket.year_settings_id == db_row.id)
        .count()
    )
    assert bucket_rows == 4


def test_promotion_mid_year_auto_closes_open_version_and_prorates_year_total(client, db_session):
    """Adding a new recurring version closes the prior open version and prorates totals."""
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
    create_version(
        client,
        component["id"],
        start_date="2026-07-01",
        gross_amount=9000,
        net_amount=6500,
        periods_per_year=12,
    )

    first_version = (
        db_session.query(IncomeComponentVersion)
        .filter(IncomeComponentVersion.component_id == component["id"])
        .order_by(IncomeComponentVersion.start_date.asc())
        .first()
    )
    assert first_version is not None
    assert first_version.end_date == date(2026, 6, 30)

    projection = get_projection(client, 2026)
    planned_net = projection["sources"][0]["components"][0]["totals"]["planned_net"]
    expected_planned_net = prorated_annual_total(
        amount_per_period=5000,
        periods_per_year=12,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 6, 30),
        year=2026,
    ) + prorated_annual_total(
        amount_per_period=6500,
        periods_per_year=12,
        start_date=date(2026, 7, 1),
        end_date=None,
        year=2026,
    )

    assert round(planned_net, 2) == expected_planned_net


def test_source_name_can_be_updated_and_reflected_in_projection(client):
    """Updating a source name should return the new name and surface in the projection."""
    source = create_source(client, "Acme Corp")

    response = client.put(
        f"/api/incomes/sources/{source['id']}",
        json={"name": "Acme Holdings"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Acme Holdings"

    projection = get_projection(client, 2026)
    assert projection["sources"][0]["name"] == "Acme Holdings"


def test_overlapping_versions_are_rejected_but_adjacent_versions_are_allowed(client):
    """Recurring versions enforce non-overlap while still allowing adjacent date ranges."""
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
        end_date="2026-06-30",
        gross_amount=6000,
        net_amount=4500,
        periods_per_year=12,
    )

    overlap_response = client.post(
        f"/api/incomes/components/{component['id']}/versions",
        json={
            "start_date": "2026-06-15",
            "gross_amount": 6500,
            "net_amount": 4800,
            "periods_per_year": 12,
        },
    )
    assert overlap_response.status_code == 400
    assert "cannot overlap" in overlap_response.json()["detail"]

    adjacent_response = client.post(
        f"/api/incomes/components/{component['id']}/versions",
        json={
            "start_date": "2026-07-01",
            "gross_amount": 6500,
            "net_amount": 4800,
            "periods_per_year": 12,
        },
    )
    assert adjacent_response.status_code == 201


def test_recurring_version_allows_net_greater_than_gross_for_reimbursements(client):
    """Recurring versions should allow effectively all-net reimbursements like FSA payouts."""
    source = create_source(client, "FSA Day Care")
    component = create_component(
        client,
        source["id"],
        component_type="other",
        component_mode="recurring",
        label="Dependent care reimbursement",
    )

    response = client.post(
        f"/api/incomes/components/{component['id']}/versions",
        json={
            "start_date": "2026-01-01",
            "gross_amount": 1,
            "net_amount": 250,
            "periods_per_year": 12,
        },
    )

    assert response.status_code == 201
    assert response.json()["gross_amount"] == 1
    assert response.json()["net_amount"] == 250


def test_expected_bonus_moves_from_planned_only_to_committed_when_marked_actual(client):
    """Updating an expected bonus to actual moves its value into committed totals."""
    source = create_source(client, "Acme Corp")
    component = create_component(
        client,
        source["id"],
        component_type="bonus",
        component_mode="occurrence",
        label="Annual bonus",
    )

    occurrence = create_occurrence(
        client,
        component["id"],
        status="expected",
        planned_date="2026-12-15",
        gross_amount=5000,
        net_amount=3500,
    )

    before_update = get_projection(client, 2026)
    assert before_update["totals"]["committed_net"] == 0
    assert before_update["totals"]["planned_net"] == 3500

    response = client.put(
        f"/api/incomes/occurrences/{occurrence['id']}",
        json={"status": "actual", "paid_date": "2026-12-20"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "actual"

    after_update = get_projection(client, 2026)
    assert after_update["totals"]["committed_net"] == 3500
    assert after_update["totals"]["planned_net"] == 3500


def test_zero_amount_bonus_occurrence_is_returned_in_projection_without_error(client):
    """Existing zero-amount bonus rows should still serialize in the income projection."""
    source = create_source(client, "Acme Corp")
    component = create_component(
        client,
        source["id"],
        component_type="bonus",
        component_mode="occurrence",
        label="Placeholder bonus",
    )

    response = client.post(
        f"/api/incomes/components/{component['id']}/occurrences",
        json={
            "status": "expected",
            "planned_date": "2026-12-15",
            "gross_amount": 0,
            "net_amount": 0,
        },
    )
    assert response.status_code == 201

    projection = get_projection(client, 2026)
    occurrence = projection["sources"][0]["components"][0]["occurrences"][0]
    assert occurrence["gross_amount"] == 0
    assert occurrence["net_amount"] == 0


def test_recurring_version_can_be_updated_and_projection_reflects_new_values(client):
    """Updating a recurring version should change the projected totals for that component."""
    source = create_source(client, "Acme Corp")
    component = create_component(
        client,
        source["id"],
        component_type="base_pay",
        component_mode="recurring",
        label="Base pay",
    )
    version = create_version(
        client,
        component["id"],
        start_date="2026-01-01",
        gross_amount=6000,
        net_amount=4500,
        periods_per_year=12,
    )

    response = client.put(
        f"/api/incomes/versions/{version['id']}",
        json={
            "start_date": "2026-01-01",
            "end_date": "2026-09-30",
            "gross_amount": 6500,
            "net_amount": 5000,
            "periods_per_year": 12,
        },
    )
    assert response.status_code == 200
    assert response.json()["net_amount"] == 5000
    assert response.json()["end_date"] == "2026-09-30"

    projection = get_projection(client, 2026)
    expected_net = prorated_annual_total(
        amount_per_period=5000,
        periods_per_year=12,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 9, 30),
        year=2026,
    )
    assert round(projection["sources"][0]["components"][0]["totals"]["planned_net"], 2) == expected_net


def test_recurring_version_can_be_deleted_and_removed_from_projection(client):
    """Deleting a recurring version should remove its contribution from the year projection."""
    source = create_source(client, "Acme Corp")
    component = create_component(
        client,
        source["id"],
        component_type="base_pay",
        component_mode="recurring",
        label="Base pay",
    )
    version = create_version(
        client,
        component["id"],
        start_date="2026-01-01",
        gross_amount=6000,
        net_amount=4500,
        periods_per_year=12,
    )

    response = client.delete(f"/api/incomes/versions/{version['id']}")
    assert response.status_code == 204

    projection = get_projection(client, 2026)
    assert projection["totals"]["planned_net"] == 0
    assert projection["sources"][0]["components"][0]["versions"] == []


def test_bonus_occurrence_can_be_updated_and_projection_reflects_new_values(client):
    """Updating a bonus occurrence should change both its timing and projected totals."""
    source = create_source(client, "Acme Corp")
    component = create_component(
        client,
        source["id"],
        component_type="bonus",
        component_mode="occurrence",
        label="Annual bonus",
    )
    occurrence = create_occurrence(
        client,
        component["id"],
        status="expected",
        planned_date="2026-12-15",
        gross_amount=5000,
        net_amount=3500,
    )

    response = client.put(
        f"/api/incomes/occurrences/{occurrence['id']}",
        json={
            "status": "actual",
            "planned_date": "2026-11-15",
            "paid_date": "2026-11-20",
            "gross_amount": 7200,
            "net_amount": 5100,
        },
    )
    assert response.status_code == 200
    assert response.json()["status"] == "actual"
    assert response.json()["net_amount"] == 5100

    projection = get_projection(client, 2026)
    component_projection = projection["sources"][0]["components"][0]
    assert component_projection["totals"]["committed_net"] == 5100
    assert component_projection["occurrences"][0]["paid_date"] == "2026-11-20"


def test_bonus_occurrence_can_be_deleted_and_removed_from_projection(client):
    """Deleting a bonus occurrence should remove it from the projection totals."""
    source = create_source(client, "Acme Corp")
    component = create_component(
        client,
        source["id"],
        component_type="bonus",
        component_mode="occurrence",
        label="Annual bonus",
    )
    occurrence = create_occurrence(
        client,
        component["id"],
        status="actual",
        planned_date="2026-03-15",
        paid_date="2026-03-20",
        gross_amount=5000,
        net_amount=3500,
    )

    response = client.delete(f"/api/incomes/occurrences/{occurrence['id']}")
    assert response.status_code == 204

    projection = get_projection(client, 2026)
    assert projection["totals"]["committed_net"] == 0
    assert projection["sources"][0]["components"][0]["occurrences"] == []


def test_deleting_source_cascades_components_versions_and_occurrences(client, db_session):
    """Deleting a source removes all nested income records and preserves other sources."""
    source = create_source(client, "Acme Corp")
    other_source = create_source(client, "Bright Labs")

    base_component = create_component(
        client,
        source["id"],
        component_type="base_pay",
        component_mode="recurring",
        label="Base pay",
    )
    bonus_component = create_component(
        client,
        source["id"],
        component_type="bonus",
        component_mode="occurrence",
        label="Annual bonus",
    )
    create_component(
        client,
        other_source["id"],
        component_type="base_pay",
        component_mode="recurring",
        label="Base pay",
    )
    create_version(
        client,
        base_component["id"],
        start_date="2026-01-01",
        gross_amount=6000,
        net_amount=4500,
        periods_per_year=12,
    )
    create_occurrence(
        client,
        bonus_component["id"],
        status="actual",
        planned_date="2026-03-15",
        gross_amount=5000,
        net_amount=3500,
        paid_date="2026-03-20",
    )

    delete_response = client.delete(f"/api/incomes/sources/{source['id']}")
    assert delete_response.status_code == 204

    assert db_session.query(IncomeSource).filter(IncomeSource.id == source["id"]).count() == 0
    assert db_session.query(IncomeComponent).filter(IncomeComponent.source_id == source["id"]).count() == 0
    assert db_session.query(IncomeComponentVersion).count() == 0
    assert db_session.query(IncomeOccurrence).count() == 0

    projection = get_projection(client, 2026)
    assert len(projection["sources"]) == 1
    assert projection["sources"][0]["name"] == "Bright Labs"
