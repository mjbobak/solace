"""CSV upload and preview schemas."""

from datetime import date as date_type
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class ParsedTransaction(BaseModel):
    """Single transaction parsed from CSV file."""

    preview_id: str = Field(default="", description="Unique identifier for this parsed preview row")
    row_number: int = Field(..., description="Original CSV row number (for tracking)")
    account: str = Field(..., description="Account identifier (1466 or 2939)")
    account_name: str = Field(..., description="Display name (Chase Credit Card or Chase Checking)")
    transaction_date: Optional[date_type] = Field(None, description="Transaction date (None for checking account)")
    post_date: date_type = Field(..., description="Post date")
    description: str = Field(..., description="Transaction description")
    details: Optional[str] = Field(None, description="Raw bank details column when provided by source CSV")
    amount: Decimal = Field(..., description="Transaction amount (positive)")
    chase_category: Optional[str] = Field(
        None, max_length=100, description="Original Chase category (credit card only)"
    )
    is_filtered: bool = Field(default=False, description="True if should be excluded from import")
    filter_reason: Optional[str] = Field(None, description="Why transaction is filtered")
    validation_errors: List[str] = Field(default_factory=list, description="Parse errors for this row")
    budget_id: Optional[int] = Field(None, description="Budget ID assigned by auto-categorization rule")
    auto_categorized: bool = Field(default=False, description="True if budget_id was assigned by a rule")


class CsvParseResult(BaseModel):
    """Result of parsing multiple CSV files."""

    transactions: List[ParsedTransaction] = Field(..., description="All parsed transactions")
    total_count: int = Field(..., description="Total transactions parsed")
    import_count: int = Field(..., description="Transactions that will be imported (not filtered)")
    filtered_count: int = Field(..., description="Transactions filtered out")
    error_count: int = Field(..., description="Transactions with validation errors")
    parse_errors: List[str] = Field(default_factory=list, description="File-level parsing errors")


class CsvUploadConfirm(BaseModel):
    """Confirmation request for batch import."""

    transactions: List[ParsedTransaction] = Field(..., description="Transactions to import (may be edited by user)")
    import_batch_id: str = Field(..., description="UUID tracking this import batch")


class CsvUploadConfirmResult(BaseModel):
    """Result returned after a confirmed CSV import."""

    message: str = Field(..., description="Human-readable import summary")
    import_batch_id: str = Field(..., description="UUID tracking this import batch")
    count: int = Field(..., description="Number of newly created transactions")
    skipped_duplicates: int = Field(default=0, description="Transactions skipped because they matched existing imports")
