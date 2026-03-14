"""
Database initialization module.

Runs on application startup to create all tables from SQLAlchemy models.
Uses Alembic migrations in production, but falls back to creating tables
if migration hasn't been run yet.
"""

import logging

from sqlalchemy import inspect, text

from backend.app.db.database import Base, SessionLocal, engine

logger = logging.getLogger(__name__)

LEGACY_INCOME_TABLES = (
    "income_deductions",
    "income_effective_ranges",
    "incomes",
    "household_members",
    "income_component_version_deductions",
    "income_occurrence_deductions",
)
TAX_ADVANTAGED_BUCKET_TABLE = "income_year_tax_advantaged_buckets"


def init_db() -> None:
    """
    Initialize database and create all tables.

    This function:
    1. Imports all models (via models/__init__.py)
    2. Creates tables that don't exist yet
    3. Creates a default admin user if no users exist
    4. Is idempotent - safe to call multiple times

    Called from main.py lifespan manager on application startup.
    """
    # Import all models to register them with Base.metadata
    # This import ensures all SQLAlchemy models are loaded
    # before creating tables
    from backend.app.db.models import budget, expense_category, income, transaction, user  # noqa: F401

    # Create all tables defined in models
    Base.metadata.create_all(bind=engine)
    _ensure_income_sources_schema()
    _ensure_income_year_settings_columns()
    _ensure_income_year_tax_advantaged_buckets_schema()
    _backfill_legacy_401k_buckets()
    _drop_legacy_income_tables()
    _ensure_transaction_spread_columns()
    _migrate_legacy_transaction_spreads()

    logger.info("Database initialized - all tables created")

    # Create default admin user if no users exist
    _create_default_admin()


def _create_default_admin() -> None:
    """
    Create a default admin user if none exist.

    This ensures the application is usable immediately after startup
    without requiring separate initialization steps.
    """
    from backend.app.auth.password import hash_password
    from backend.app.db.models.user import User

    db = SessionLocal()
    try:
        # Check if users exist
        user_count = db.query(User).count()
        if user_count > 0:
            return

        # Create default admin user
        admin_password_hash = hash_password("admin123")
        admin = User(
            username="admin",
            password_hash=admin_password_hash,
        )
        db.add(admin)
        db.commit()

        logger.info("Created default admin user: username=admin, password=admin123")
        logger.warning("⚠️  Please change the default password in production!")

    except Exception as e:
        logger.error(f"Error creating default admin user: {e}")
        db.rollback()
    finally:
        db.close()


def _drop_legacy_income_tables() -> None:
    """Remove obsolete income tables from pre-rebuild databases."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    tables_to_drop = [
        table_name
        for table_name in LEGACY_INCOME_TABLES
        if table_name in existing_tables
    ]

    if not tables_to_drop:
        return

    with engine.begin() as connection:
        for table_name in tables_to_drop:
            connection.execute(text(f"DROP TABLE IF EXISTS {table_name}"))

    logger.info(
        "Removed legacy income tables: %s",
        ", ".join(tables_to_drop),
    )


def _ensure_income_sources_schema() -> None:
    """Rebuild legacy income_sources tables that still require member_id."""
    inspector = inspect(engine)
    if "income_sources" not in inspector.get_table_names():
        return

    columns = {
        column["name"] for column in inspector.get_columns("income_sources")
    }
    if "member_id" not in columns:
        return

    with engine.begin() as connection:
        connection.execute(text("PRAGMA foreign_keys=OFF"))
        connection.execute(
            text(
                """
                CREATE TABLE income_sources__new (
                    id INTEGER NOT NULL PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    is_active BOOLEAN DEFAULT '1' NOT NULL,
                    sort_order INTEGER NOT NULL,
                    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
                    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL
                )
                """
            )
        )
        connection.execute(
            text(
                """
                INSERT INTO income_sources__new (id, name, is_active, sort_order, created_at, updated_at)
                SELECT id, name, is_active, sort_order, created_at, updated_at
                FROM income_sources
                """
            )
        )
        connection.execute(text("DROP TABLE income_sources"))
        connection.execute(text("ALTER TABLE income_sources__new RENAME TO income_sources"))
        connection.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS ix_income_sources_id
                ON income_sources (id)
                """
            )
        )
        connection.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS ix_income_sources_name
                ON income_sources (name)
                """
            )
        )
        connection.execute(text("PRAGMA foreign_keys=ON"))

    logger.info("Rebuilt legacy income_sources schema without member_id")


def _ensure_income_year_settings_columns() -> None:
    """Add missing year-settings columns to existing databases."""
    inspector = inspect(engine)
    if "income_year_settings" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns("income_year_settings")
    }
    statements: list[str] = []

    if "emergency_fund_balance" not in existing_columns:
        statements.append(
            """
            ALTER TABLE income_year_settings
            ADD COLUMN emergency_fund_balance FLOAT DEFAULT 18000 NOT NULL
            """
        )

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

    if statements:
        logger.info("Ensured income year settings columns exist")


def _ensure_income_year_tax_advantaged_buckets_schema() -> None:
    """Create the year bucket table for existing SQLite databases if needed."""
    inspector = inspect(engine)
    if TAX_ADVANTAGED_BUCKET_TABLE in inspector.get_table_names():
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                f"""
                CREATE TABLE {TAX_ADVANTAGED_BUCKET_TABLE} (
                    id INTEGER NOT NULL PRIMARY KEY,
                    year_settings_id INTEGER NOT NULL,
                    bucket_type VARCHAR(32) NOT NULL,
                    annual_amount FLOAT DEFAULT 0 NOT NULL,
                    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
                    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
                    CONSTRAINT uq_income_year_tax_advantaged_bucket_type
                        UNIQUE (year_settings_id, bucket_type),
                    FOREIGN KEY(year_settings_id)
                        REFERENCES income_year_settings (id)
                        ON DELETE CASCADE
                )
                """
            )
        )
        connection.execute(
            text(
                f"""
                CREATE INDEX IF NOT EXISTS ix_{TAX_ADVANTAGED_BUCKET_TABLE}_year_settings_id
                ON {TAX_ADVANTAGED_BUCKET_TABLE} (year_settings_id)
                """
            )
        )
        connection.execute(
            text(
                f"""
                CREATE INDEX IF NOT EXISTS ix_{TAX_ADVANTAGED_BUCKET_TABLE}_bucket_type
                ON {TAX_ADVANTAGED_BUCKET_TABLE} (bucket_type)
                """
            )
        )

    logger.info("Ensured income year tax-advantaged bucket table exists")


def _backfill_legacy_401k_buckets() -> None:
    """Migrate legacy year-level 401k values into the bucket table once."""
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if "income_year_settings" not in tables or TAX_ADVANTAGED_BUCKET_TABLE not in tables:
        return

    columns = {
        column["name"] for column in inspector.get_columns("income_year_settings")
    }
    if "contributions_401k" not in columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                f"""
                INSERT INTO {TAX_ADVANTAGED_BUCKET_TABLE} (
                    year_settings_id,
                    bucket_type,
                    annual_amount,
                    created_at,
                    updated_at
                )
                SELECT
                    settings.id,
                    '401k',
                    settings.contributions_401k,
                    settings.created_at,
                    settings.updated_at
                FROM income_year_settings AS settings
                WHERE COALESCE(settings.contributions_401k, 0) > 0
                  AND NOT EXISTS (
                    SELECT 1
                    FROM {TAX_ADVANTAGED_BUCKET_TABLE} AS buckets
                    WHERE buckets.year_settings_id = settings.id
                      AND buckets.bucket_type = '401k'
                  )
                """
            )
        )


def _ensure_transaction_spread_columns() -> None:
    """Add spread-payment columns to existing SQLite databases if needed."""
    inspector = inspect(engine)
    if "transactions" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns("transactions")
    }
    statements: list[str] = []

    if "spread_start_date" not in existing_columns:
        statements.append(
            """
            ALTER TABLE transactions
            ADD COLUMN spread_start_date DATE DEFAULT NULL
            """
        )

    if "spread_months" not in existing_columns:
        statements.append(
            """
            ALTER TABLE transactions
            ADD COLUMN spread_months INTEGER DEFAULT NULL
            """
        )

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
        connection.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS ix_transactions_user_spread_start
                ON transactions (user_id, spread_start_date)
                """
            )
        )

    if statements:
        logger.info("Ensured transaction spread-payment columns exist")


def _migrate_legacy_transaction_spreads() -> None:
    """Backfill legacy is_accrual rows to a 12-month spread window."""
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                UPDATE transactions
                SET spread_start_date = date(transaction_date, 'start of month'),
                    spread_months = 12
                WHERE is_accrual = 1
                  AND (spread_start_date IS NULL OR spread_months IS NULL)
                """
            )
        )
