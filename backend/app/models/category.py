"""Expense Category Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ExpenseCategoryBase(BaseModel):
    """Base expense category schema."""

    name: str = Field(..., min_length=1, max_length=100, description="Category name")


class ExpenseCategoryCreate(ExpenseCategoryBase):
    """Schema for creating an expense category."""

    pass


class ExpenseCategoryUpdate(BaseModel):
    """Schema for updating an expense category."""

    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Category name")


class ExpenseCategory(ExpenseCategoryBase):
    """Complete expense category schema for API responses."""

    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility
