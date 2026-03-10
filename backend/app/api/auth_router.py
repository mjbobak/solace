"""Authentication router."""

import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import CurrentUser
from backend.app.auth.jwt import create_access_token
from backend.app.config import settings
from backend.app.db.database import get_db
from backend.app.models.auth import Token, User, UserLogin
from backend.app.services.user_service import UserService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Login endpoint - authenticate user and return JWT token.

    Args:
        user_credentials: Username and password
        db: Database session

    Returns:
        JWT access token

    Raises:
        HTTPException: If credentials are invalid
    """
    user_service = UserService(db)

    # Authenticate user
    user = user_service.authenticate_user(
        user_credentials.username,
        user_credentials.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(
        data={"user_id": user.id, "username": user.username},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    logger.info(f"User logged in: {user.username}")

    return Token(access_token=access_token)


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: CurrentUser):
    """
    Get current authenticated user information.

    Args:
        current_user: Current user from JWT token

    Returns:
        User information (without password)
    """
    return current_user


@router.post("/logout")
async def logout(current_user: CurrentUser):
    """
    Logout endpoint (client-side token deletion).

    Note: With JWT, logout is handled client-side by deleting the token.
    This endpoint exists for consistency and could be extended for token
    blacklisting if needed.

    Args:
        current_user: Current user from JWT token

    Returns:
        Success message
    """
    logger.info(f"User logged out: {current_user.username}")
    return {"message": "Successfully logged out"}
