"""User SQLAlchemy ORM model."""

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.app.db.database import Base


class User(Base):
    """
    User database model.

    Stores user authentication data with hashed passwords.
    """

    __tablename__ = "users"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # User fields
    username = Column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
        comment="Username for login",
    )
    password_hash = Column(
        String(255),
        nullable=False,
        comment="Hashed password",
    )

    # Timestamps (auto-managed by SQLAlchemy)
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        comment="When this user was created",
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="When this user was last updated",
    )

    # Relationships
    transactions = relationship("Transaction", back_populates="user")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}')>"
