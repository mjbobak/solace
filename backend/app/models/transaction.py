"""Transaction Pydantic schemas."""

from datetime import date as date_type
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, model_validator

from backend.app.db.models import ReviewStatus, TransactionStatus


class TransactionBase(BaseModel):
    """Base transaction schema with common fields."""

    date: date_type = Field(..., description="Transaction date")
    post_date: Optional[date_type] = Field(None, description="Date transaction posted to account")
    description: str = Field(..., min_length=1, max_length=255, description="Transaction description")
    merchant: Optional[str] = Field(None, max_length=255, description="Merchant name")
    amount: Decimal = Field(..., description="Transaction amount")
    account: Optional[str] = Field(None, max_length=100, description="Account name")
    category_id: Optional[int] = Field(None, description="Category ID (deprecated, use budget_id)")
    budget_id: Optional[int] = Field(None, description="Budget ID - links to specific budget item")
    is_accrual: bool = Field(default=False, description="True for quarterly/annual items")
    spread_start_date: Optional[date_type] = Field(
        None,
        description="First day of the first month covered by the spread payment",
    )
    spread_months: Optional[int] = Field(
        None,
        ge=1,
        le=36,
        description="Number of months covered by the spread payment",
    )
    status: TransactionStatus = Field(default=TransactionStatus.ACTIVE, description="Transaction status")
    review_status: ReviewStatus = Field(default=ReviewStatus.PENDING, description="Review status")
    import_batch_id: Optional[str] = Field(None, description="Import batch identifier")
    chase_category: Optional[str] = Field(
        None, max_length=100, description="Original Chase category for smart categorization"
    )


class TransactionCreate(TransactionBase):
    """Schema for creating a transaction."""

    @model_validator(mode="after")
    def validate_spread_fields(self) -> "TransactionCreate":
        if (self.spread_start_date is None) != (self.spread_months is None):
            raise ValueError("spread_start_date and spread_months must be provided together")

        return self


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction (all fields optional for partial updates)."""

    date: Optional[date_type] = None
    post_date: Optional[date_type] = None
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    merchant: Optional[str] = Field(None, max_length=255)
    amount: Optional[Decimal] = None
    account: Optional[str] = Field(None, max_length=100)
    category_id: Optional[int] = None
    budget_id: Optional[int] = None
    is_accrual: Optional[bool] = None
    spread_start_date: Optional[date_type] = None
    spread_months: Optional[int] = Field(default=None, ge=1, le=36)
    status: Optional[TransactionStatus] = None
    review_status: Optional[ReviewStatus] = None
    import_batch_id: Optional[str] = None
    chase_category: Optional[str] = Field(None, max_length=100)

    @model_validator(mode="after")
    def validate_spread_fields(self) -> "TransactionUpdate":
        if (self.spread_start_date is None) != (self.spread_months is None):
            provided_fields = self.model_fields_set
            if "spread_start_date" in provided_fields or "spread_months" in provided_fields:
                raise ValueError("spread_start_date and spread_months must be provided together")

        return self


class Transaction(TransactionBase):
    """Complete transaction schema with metadata for API responses."""

    id: int
    user_id: int
    category_name: Optional[str] = Field(None, description="Category name (deprecated, use budget_label)")
    budget_label: Optional[str] = Field(None, description="Budget item label (e.g., 'Daisy Essentials')")
    budget_category: Optional[str] = Field(None, description="Budget category name (e.g., 'CHILDREN')")
    budget_type: Optional[str] = Field(None, description="Budget type (ESSENTIAL or FUNSIES)")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility
        populate_by_name = True  # Allow both field name and alias for input
