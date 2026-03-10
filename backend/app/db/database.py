"""
SQLAlchemy database configuration and session management.

Provides:
- Database URL configuration (SQLite)
- SQLAlchemy engine and session factory
- Declarative base for all models
- FastAPI dependency for database sessions
"""

import os
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# Determine database path based on environment
if os.getenv("DEV_MODE", "True").lower() == "true":
    # Development: local SQLite file
    db_path = Path(__file__).parent.parent.parent.parent / "data" / "database.db"
    DATABASE_URL = f"sqlite:///{db_path}"
else:
    # Production (Docker): mounted volume
    DATABASE_URL = "sqlite:////app/data/database.db"

# Create SQLAlchemy engine
# check_same_thread=False is required for SQLite with async/FastAPI
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,  # Set to True for SQL debugging
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for all ORM models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for database sessions.

    Yields a database session and ensures it's properly closed after use.

    Usage in routes:
        @router.get("/budgets")
        async def get_budgets(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
