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
