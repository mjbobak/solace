"""
Pytest configuration and fixtures for backend tests.
"""

from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.db.database import Base

# Import all models to ensure they're registered with Base.metadata
from backend.app.db.models import (
    budget,  # noqa: F401
    categorization_rule,  # noqa: F401
    expense_category,  # noqa: F401
    income,  # noqa: F401
    transaction,  # noqa: F401
)


@pytest.fixture(scope="function")
def db_session():
    """
    Create a fresh in-memory database for each test.

    This ensures test isolation and fast execution.
    """
    # Create in-memory SQLite database
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create session
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    yield session

    # Cleanup
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_user(db_session):
    """Create a sample user for testing."""
    from backend.app.auth.password import hash_password
    from backend.app.db.models.user import User

    user = User(username="testuser", password_hash=hash_password("password123"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    return user


@pytest.fixture
def sample_expense_category(db_session):
    """Create a sample expense category for testing."""
    from backend.app.db.models.expense_category import ExpenseCategory

    category = ExpenseCategory(name="DAILY LIVING")
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)

    return category


@pytest.fixture
def sample_budget(db_session, sample_expense_category):
    """Create a sample budget entry for testing."""
    from backend.app.db.models.budget import Budget

    budget_ = Budget(
        expense_type="ESSENTIAL",
        expense_category_id=sample_expense_category.id,
        expense_label="GROCERIES",
        budgeted=1200.0,
        is_accrual=False,
    )

    db_session.add(budget_)
    db_session.commit()
    db_session.refresh(budget_)

    return budget_


@pytest.fixture
def sample_transaction(db_session, sample_user):
    """Create a sample transaction for testing."""
    from backend.app.db.models.transaction import Transaction

    txn = Transaction(
        user_id=sample_user.id,
        transaction_date=date(2025, 1, 15),
        post_date=date(2025, 1, 16),
        description="Test Transaction",
        merchant="Test Store",
        account="Test Account",
        amount=50.00,
        category_id=None,
        is_accrual=False,
        status="active",
        review_status="pending",
    )

    db_session.add(txn)
    db_session.commit()
    db_session.refresh(txn)

    return txn


@pytest.fixture
def client(db_session):
    """Create a TestClient with an in-memory database for API testing."""
    from backend.app.db.database import get_db
    from backend.app.main import app

    # Override get_db dependency to use test session
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    # Clean up
    app.dependency_overrides.clear()
