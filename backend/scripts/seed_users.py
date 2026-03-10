#!/usr/bin/env python3
"""
Seed database with default admin user.

Creates a default admin user if no users exist in the database.

Run with: python backend/scripts/seed_users.py
"""

import logging

# Add project root to path for imports
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.app.auth.password import hash_password  # noqa: E402
from backend.app.db.database import SessionLocal  # noqa: E402
from backend.app.db.models.user import User  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def seed_users() -> None:
    """
    Seed the database with a default admin user if none exist.

    Creates an admin user with username 'admin' and password 'admin123' if
    the users table is empty.
    """
    db = SessionLocal()
    try:
        # Check if users exist
        user_count = db.query(User).count()
        if user_count > 0:
            logger.info(f"Database already has {user_count} user(s). Skipping seed.")
            return

        # Create default admin user
        admin_password_hash = hash_password("admin123")
        admin = User(
            username="admin",
            password_hash=admin_password_hash,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        logger.info("✅ Successfully created default admin user")
        logger.info("   Username: admin")
        logger.info("   Password: admin123")
        logger.info("   ⚠️  Change this password in production!")

    except Exception as e:
        logger.error(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
