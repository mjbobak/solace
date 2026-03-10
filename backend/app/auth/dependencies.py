"""FastAPI dependencies for authentication."""

import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.app.auth.jwt import decode_access_token
from backend.app.db.database import get_db
from backend.app.db.models.user import User
from backend.app.models.auth import User as UserSchema

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Session = Depends(get_db),
) -> UserSchema:
    """
    Dependency to get the current authenticated user from JWT token.

    Args:
        credentials: HTTP Bearer credentials (JWT token)
        db: Database session

    Returns:
        User schema

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Extract token
    token = credentials.credentials

    # Decode token
    token_data = decode_access_token(token)
    if token_data is None:
        logger.warning("Invalid token provided")
        raise credentials_exception

    # Get user from database
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        logger.warning(f"User {token_data.user_id} not found in database")
        raise credentials_exception

    # Convert to schema (excludes password_hash)
    return UserSchema.from_orm(user)


# Type alias for dependency injection
CurrentUser = Annotated[UserSchema, Depends(get_current_user)]
