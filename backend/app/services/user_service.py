"""User service for authentication operations."""

import logging
from typing import Optional

from sqlalchemy.orm import Session

from backend.app.auth.password import hash_password, verify_password
from backend.app.db.models.user import User
from backend.app.models.auth import UserCreate

logger = logging.getLogger(__name__)


class UserService:
    """Service for user management and authentication."""

    def __init__(self, db: Session):
        self.db = db

    def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Get user by username.

        Args:
            username: Username to search for

        Returns:
            User model if found, None otherwise
        """
        return self.db.query(User).filter(User.username == username).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Get user by ID.

        Args:
            user_id: User ID to search for

        Returns:
            User model if found, None otherwise
        """
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, user_data: UserCreate) -> User:
        """
        Create a new user with hashed password.

        Args:
            user_data: User creation data

        Returns:
            Created user model

        Raises:
            ValueError: If username already exists
        """
        # Check if username exists
        existing_user = self.get_user_by_username(user_data.username)
        if existing_user:
            raise ValueError(f"Username '{user_data.username}' already exists")

        # Hash password
        password_hash = hash_password(user_data.password)

        # Create user
        db_user = User(
            username=user_data.username,
            password_hash=password_hash,
        )

        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)

        logger.info(f"Created user: {user_data.username} (ID: {db_user.id})")
        return db_user

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """
        Authenticate user with username and password.

        Args:
            username: Username
            password: Plain text password

        Returns:
            User model if authenticated, None otherwise
        """
        user = self.get_user_by_username(username)

        if not user:
            logger.warning(f"Authentication failed: user '{username}' not found")
            return None

        if not verify_password(password, user.password_hash):
            logger.warning(f"Authentication failed: invalid password for user '{username}'")
            return None

        logger.info(f"User authenticated: {username}")
        return user
