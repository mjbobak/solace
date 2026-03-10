"""Budget Pydantic models for request/response."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

# ============================================================================
# Unified Budget Table Schemas (New)
# ============================================================================


class BudgetBase(BaseModel):
    """Base budget schema with common fields."""

    expense_type: str = Field(
        ...,
        min_length=1,
        max_length=20,
        description="ESSENTIAL or FUNSIES",
        examples=["ESSENTIAL", "FUNSIES"],
    )
    expense_category_id: Optional[int] = Field(
        None,
        gt=0,
        description="Foreign key to expense_categories table (use either this or expense_category)",
        examples=[1, 2, 3],
    )
    expense_category: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Category name (used as alternative to expense_category_id)",
        examples=["DAILY LIVING", "ENTERTAINMENT"],
    )
    expense_label: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Specific label like ALL THINGS DAISY, GROCERIES, etc.",
        examples=["ALL THINGS DAISY", "GROCERIES", "MORTGAGE"],
    )
    expense_label_note: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional descriptive note for the expense label",
        examples=["Diapers, Creams, Wipes, etc.", "Includes utilities and internet"],
    )
    budgeted: float = Field(
        ...,
        ge=0,
        description="Budgeted amount for this category",
        examples=[400.0, 1200.0, 2500.0],
    )
    is_accrual: bool = Field(
        default=False,
        description="True for quarterly/annual items, False for regular monthly items",
    )


class BudgetCreate(BudgetBase):
    """Schema for creating a budget entry."""

    pass


class BudgetUpdate(BaseModel):
    """Schema for updating a budget entry (all fields optional)."""

    expense_type: Optional[str] = Field(
        None,
        min_length=1,
        max_length=20,
        description="ESSENTIAL or FUNSIES",
    )
    expense_category_id: Optional[int] = Field(
        None,
        gt=0,
        description="Foreign key to expense_categories table (use either this or expense_category)",
    )
    expense_category: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Category name (used as alternative to expense_category_id)",
    )
    expense_label: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="Specific label like ALL THINGS DAISY, GROCERIES, etc.",
    )
    expense_label_note: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional descriptive note for the expense label",
    )
    budgeted: Optional[float] = Field(None, ge=0, description="Budgeted amount")
    is_accrual: Optional[bool] = Field(None, description="True for quarterly/annual items")


class BudgetResponse(BudgetBase):
    """Schema for budget API responses."""

    id: int = Field(..., description="Budget ID")
    created_at: datetime = Field(..., description="When this budget was created")
    updated_at: datetime = Field(..., description="When this budget was last updated")
    expense_category: Optional[str] = Field(
        None,
        description="Category name (populated from the relationship if available)",
    )

    class Config:
        from_attributes = True  # Enable ORM mode for SQLAlchemy models
