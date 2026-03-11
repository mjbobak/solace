"""Tests for database initialization helpers."""

from sqlalchemy import create_engine, inspect, text

from backend.app.db import init_db as init_db_module


def test_drop_legacy_income_tables_removes_only_obsolete_tables(monkeypatch, tmp_path):
    """Legacy income tables should be removed without touching current tables."""
    db_path = tmp_path / "init-db-test.sqlite"
    engine = create_engine(f"sqlite:///{db_path}")

    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE income_deductions (id INTEGER PRIMARY KEY)"))
        connection.execute(
            text("CREATE TABLE income_effective_ranges (id INTEGER PRIMARY KEY)")
        )
        connection.execute(text("CREATE TABLE incomes (id INTEGER PRIMARY KEY)"))
        connection.execute(
            text("CREATE TABLE household_members (id INTEGER PRIMARY KEY)")
        )
        connection.execute(
            text("CREATE TABLE income_sources (id INTEGER PRIMARY KEY)")
        )

    monkeypatch.setattr(init_db_module, "engine", engine)

    init_db_module._drop_legacy_income_tables()

    remaining_tables = set(inspect(engine).get_table_names())

    assert "income_sources" in remaining_tables
    assert "income_deductions" not in remaining_tables
    assert "income_effective_ranges" not in remaining_tables
    assert "incomes" not in remaining_tables
    assert "household_members" not in remaining_tables
