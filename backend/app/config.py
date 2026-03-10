"""Application configuration."""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env file if it exists
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)


class Settings:
    """Application settings from environment variables."""

    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080")  # 7 days default
    )

    # Application
    APP_NAME: str = "Family Finance API"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # Database
    DEV_MODE: bool = os.getenv("DEV_MODE", "True").lower() == "true"


settings = Settings()
