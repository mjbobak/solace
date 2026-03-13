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
            text(
                "CREATE TABLE income_component_version_deductions (id INTEGER PRIMARY KEY)"
            )
        )
        connection.execute(
            text("CREATE TABLE income_occurrence_deductions (id INTEGER PRIMARY KEY)")
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
    assert "income_component_version_deductions" not in remaining_tables
    assert "income_occurrence_deductions" not in remaining_tables


def test_ensure_income_sources_schema_removes_legacy_member_id_and_preserves_rows(monkeypatch, tmp_path):
    """Legacy income_sources tables should be rebuilt to match the current ORM schema."""
    db_path = tmp_path / "init-db-income-sources.sqlite"
    engine = create_engine(f"sqlite:///{db_path}")

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE income_sources (
                    id INTEGER PRIMARY KEY,
                    member_id INTEGER NOT NULL,
                    name VARCHAR(200) NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    sort_order INTEGER NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )
        connection.execute(
            text(
                """
                INSERT INTO income_sources (id, member_id, name, is_active, sort_order)
                VALUES (1, 99, 'Salary', 1, 3)
                """
            )
        )

    monkeypatch.setattr(init_db_module, "engine", engine)

    init_db_module._ensure_income_sources_schema()

    inspector = inspect(engine)
    column_names = {
        column["name"] for column in inspector.get_columns("income_sources")
    }

    assert "member_id" not in column_names
    assert {"id", "name", "is_active", "sort_order", "created_at", "updated_at"} <= column_names

    with engine.begin() as connection:
        rows = connection.execute(
            text("SELECT id, name, is_active, sort_order FROM income_sources")
        ).fetchall()

    assert rows == [(1, "Salary", 1, 3)]
