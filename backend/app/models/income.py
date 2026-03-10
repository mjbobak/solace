"""Income Pydantic models for API requests/responses."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

# ========== Deduction Schemas ==========


class DeductionBase(BaseModel):
    """Base deduction schema."""

    federal_tax: Optional[float] = Field(None, ge=0, description="Federal tax per pay period")
    state_tax: Optional[float] = Field(None, ge=0, description="State tax per pay period")
    fica: Optional[float] = Field(None, ge=0, description="FICA per pay period")
    retirement: Optional[float] = Field(None, ge=0, description="Retirement contribution per pay period")
    health_insurance: Optional[float] = Field(None, ge=0, description="Health insurance per pay period")
    other: Optional[float] = Field(None, ge=0, description="Other deductions per pay period")


class DeductionCreate(DeductionBase):
    """Schema for creating deduction."""

    pass


class DeductionUpdate(DeductionBase):
    """Schema for updating deduction (all optional)."""

    pass


class DeductionResponse(DeductionBase):
    """Schema for deduction response."""

    id: int = Field(..., description="Deduction ID")

    class Config:
        from_attributes = True


# ========== Effective Range Schemas ==========


class EffectiveRangeBase(BaseModel):
    """Base effective range schema."""

    start_date: date = Field(..., description="When this range becomes effective")
    end_date: Optional[date] = Field(None, description="When this range ends (null = ongoing)")
    gross_amount: float = Field(..., gt=0, description="Gross amount per pay period")
    net_amount: float = Field(..., gt=0, description="Net amount per pay period")
    periods: int = Field(..., gt=0, le=365, description="Pay periods per year")


class EffectiveRangeCreate(EffectiveRangeBase):
    """Schema for creating effective range."""

    deductions: Optional[DeductionCreate] = Field(None, description="Deduction breakdown")


class EffectiveRangeUpdate(BaseModel):
    """Schema for updating effective range (all optional)."""

    start_date: Optional[date] = None
    end_date: Optional[date] = None
    gross_amount: Optional[float] = Field(None, gt=0)
    net_amount: Optional[float] = Field(None, gt=0)
    periods: Optional[int] = Field(None, gt=0, le=365)
    deductions: Optional[DeductionUpdate] = None


class EffectiveRangeResponse(EffectiveRangeBase):
    """Schema for effective range response."""

    id: int = Field(..., description="Range ID")
    income_id: int = Field(..., description="Parent income ID")
    deductions: Optional[DeductionResponse] = Field(None, description="Deduction breakdown")

    class Config:
        from_attributes = True


# ========== Income Schemas ==========


class IncomeBase(BaseModel):
    """Base income schema."""

    stream: str = Field(..., min_length=1, max_length=200, description="Income stream name")
    type: str = Field(..., description="'regular' or 'bonus'")
    frequency: Optional[str] = Field(None, description="'annual', 'quarterly', 'monthly', 'one-time'")
    received_date: Optional[date] = Field(None, description="Received date (for bonuses)")


class IncomeCreate(IncomeBase):
    """Schema for creating income."""

    effective_ranges: list[EffectiveRangeCreate] = Field(
        ..., min_length=1, description="At least one effective range required"
    )


class IncomeUpdate(BaseModel):
    """Schema for updating income (all optional)."""

    stream: Optional[str] = Field(None, min_length=1, max_length=200)
    type: Optional[str] = None
    frequency: Optional[str] = None
    received_date: Optional[date] = None


class IncomeResponse(IncomeBase):
    """Schema for income response."""

    id: int = Field(..., description="Income ID")
    created_at: datetime
    updated_at: datetime
    effective_ranges: list[EffectiveRangeResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
