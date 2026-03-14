"""Pydantic models for the rebuilt income domain."""

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

IncomeComponentType = Literal["base_pay", "bonus", "commission", "overtime", "other"]
IncomeComponentMode = Literal["recurring", "occurrence"]
IncomeOccurrenceStatus = Literal["expected", "actual"]
TaxAdvantagedBucketType = Literal["401k", "hsa", "fsa_daycare", "fsa_medical"]


class TaxAdvantagedBucketEntryBase(BaseModel):
    """Typed annual tax-advantaged bucket amount."""

    bucket_type: TaxAdvantagedBucketType
    annual_amount: float = Field(..., ge=0)


class TaxAdvantagedBucketEntryUpdate(TaxAdvantagedBucketEntryBase):
    """Update payload for a single tax-advantaged bucket entry."""


class TaxAdvantagedBucketEntryResponse(TaxAdvantagedBucketEntryBase):
    """Read model for a single tax-advantaged bucket entry."""


class TaxAdvantagedInvestmentsResponse(BaseModel):
    """Year-scoped tax-advantaged totals for dashboard use."""

    entries: list[TaxAdvantagedBucketEntryResponse] = Field(default_factory=list)
    locked_total: float = 0
    spendable_total: float = 0
    total: float = 0


class IncomeYearSettingsUpdate(BaseModel):
    """Update payload for year-scoped income settings."""

    tax_advantaged_buckets: Optional[list[TaxAdvantagedBucketEntryUpdate]] = None
    emergency_fund_balance: Optional[float] = Field(None, ge=0)


class IncomeYearSettingsResponse(BaseModel):
    """Resource response for year-scoped income settings."""

    tax_advantaged_buckets: list[TaxAdvantagedBucketEntryResponse] = Field(
        default_factory=list
    )
    emergency_fund_balance: float = 0
    year: int
    created_at: datetime
    updated_at: datetime


class IncomeProjectionTotalsResponse(BaseModel):
    """Committed vs planned income totals for a projection scope."""

    committed_gross: float = 0
    committed_cash_net: float = 0
    committed_net: float = 0
    planned_gross: float = 0
    planned_cash_net: float = 0
    planned_net: float = 0


class IncomeSourceBase(BaseModel):
    """Base income source fields."""

    name: str = Field(..., min_length=1, max_length=200)
    is_active: bool = True
    sort_order: int = Field(0, ge=0)


class IncomeSourceCreate(IncomeSourceBase):
    """Create payload for income sources."""


class IncomeSourceUpdate(BaseModel):
    """Update payload for income sources."""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = Field(None, ge=0)


class IncomeSourceResponse(IncomeSourceBase):
    """Resource response for income sources."""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IncomeComponentBase(BaseModel):
    """Base income component fields."""

    component_type: IncomeComponentType
    component_mode: IncomeComponentMode
    label: Optional[str] = Field(None, max_length=120)


class IncomeComponentCreate(IncomeComponentBase):
    """Create payload for income components."""


class IncomeComponentUpdate(BaseModel):
    """Update payload for income components."""

    component_type: Optional[IncomeComponentType] = None
    component_mode: Optional[IncomeComponentMode] = None
    label: Optional[str] = Field(None, max_length=120)


class IncomeComponentResponse(IncomeComponentBase):
    """Resource response for income components."""

    id: int
    source_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IncomeComponentVersionBase(BaseModel):
    """Base recurring version fields."""

    start_date: date
    end_date: Optional[date] = None
    gross_amount: float = Field(..., gt=0)
    net_amount: float = Field(..., gt=0)
    periods_per_year: int = Field(..., gt=0, le=366)


class IncomeComponentVersionCreate(IncomeComponentVersionBase):
    """Create payload for recurring versions."""


class IncomeComponentVersionUpdate(BaseModel):
    """Update payload for recurring versions."""

    start_date: Optional[date] = None
    end_date: Optional[date] = None
    gross_amount: Optional[float] = Field(None, gt=0)
    net_amount: Optional[float] = Field(None, gt=0)
    periods_per_year: Optional[int] = Field(None, gt=0, le=366)


class IncomeComponentVersionResponse(IncomeComponentVersionBase):
    """Resource response for recurring versions."""

    id: int
    component_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IncomeOccurrenceBase(BaseModel):
    """Base occurrence fields."""

    status: IncomeOccurrenceStatus
    planned_date: date
    paid_date: Optional[date] = None
    gross_amount: float = Field(..., ge=0)
    net_amount: float = Field(..., ge=0)


class IncomeOccurrenceCreate(IncomeOccurrenceBase):
    """Create payload for one-time occurrences."""


class IncomeOccurrenceUpdate(BaseModel):
    """Update payload for one-time occurrences."""

    status: Optional[IncomeOccurrenceStatus] = None
    planned_date: Optional[date] = None
    paid_date: Optional[date] = None
    gross_amount: Optional[float] = Field(None, ge=0)
    net_amount: Optional[float] = Field(None, ge=0)


class IncomeOccurrenceResponse(IncomeOccurrenceBase):
    """Resource response for one-time occurrences."""

    id: int
    component_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectedIncomeComponentResponse(IncomeComponentResponse):
    """Component plus raw children and year totals."""

    totals: IncomeProjectionTotalsResponse
    current_version: Optional[IncomeComponentVersionResponse] = None
    versions: list[IncomeComponentVersionResponse] = Field(default_factory=list)
    occurrences: list[IncomeOccurrenceResponse] = Field(default_factory=list)


class ProjectedIncomeSourceResponse(IncomeSourceResponse):
    """Source plus nested components and totals."""

    totals: IncomeProjectionTotalsResponse
    components: list[ProjectedIncomeComponentResponse] = Field(default_factory=list)


class IncomeYearProjectionResponse(BaseModel):
    """Top-level year-scoped read model for the income tab."""

    year: int
    totals: IncomeProjectionTotalsResponse
    emergency_fund_balance: float = 18000
    tax_advantaged_investments: TaxAdvantagedInvestmentsResponse = Field(
        default_factory=TaxAdvantagedInvestmentsResponse
    )
    sources: list[ProjectedIncomeSourceResponse] = Field(default_factory=list)
