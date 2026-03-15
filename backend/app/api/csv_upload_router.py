"""CSV upload API endpoints."""

import logging
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import ReviewStatus, TransactionStatus
from backend.app.etl.csv_etl_service import CsvEtlService
from backend.app.models.csv_upload import CsvParseResult, CsvUploadConfirm
from backend.app.models.transaction import TransactionCreate
from backend.app.services.categorization_service import CategorizationService
from backend.app.services.transaction_service import TransactionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/transactions/upload", tags=["csv-upload"])

# TODO: Replace with actual auth context
DEFAULT_USER_ID = 1


@router.post("/preview", response_model=CsvParseResult)
async def preview_csv_upload(
    files: List[UploadFile] = File(..., description="CSV files to upload (1466.csv, 2939.csv, etc.)"),
    db: Session = Depends(get_db),
) -> CsvParseResult:
    """
    Parse and preview CSV files without saving to database.

    - Accepts multiple CSV files (e.g., Chase 1466 and 2939 files)
    - Auto-categorizes transactions using saved rules
    - Returns parsed transactions with filter status and validation errors
    - No database changes - safe to preview

    **File naming requirements:**
    - Must contain account number (1466 for credit card, 2939 for checking)
    - Example: Chase1466_Activity.csv, Chase2939_Activity.csv

    **Response includes:**
    - total_count: Total transactions in files
    - import_count: Transactions that will be imported (not filtered)
    - filtered_count: Transactions filtered out by rules
    - error_count: Transactions with validation errors
    - parse_errors: File-level errors if any
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    # Validate file types
    for file in files:
        if not file.filename:
            raise HTTPException(status_code=400, detail="File has no filename")

        if not (file.filename.endswith(".csv") or file.filename.endswith(".CSV")):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.filename}. Only .csv files are supported.",
            )

    try:
        etl_service = CsvEtlService()
        result = await etl_service.parse_csv_files(files)

        # Apply categorization rules to auto-assign budget IDs
        categorization_service = CategorizationService(db)
        categorization_service.categorize(result.transactions)

        return result
    except Exception as e:
        logger.error(f"Preview error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")


@router.post("/confirm", status_code=201)
async def confirm_csv_upload(
    confirm: CsvUploadConfirm,
    db: Session = Depends(get_db),
) -> dict:
    """
    Confirm and save transactions to database.

    - Accepts edited transaction data from frontend
    - Only imports transactions where is_filtered=False
    - Auto-categorized transactions saved with review_status=auto_categorized
    - Uncategorized transactions saved with review_status=pending
    - Tracks import batch with unique batch ID

    **Request body:**
    - transactions: Array of ParsedTransaction (may be edited from preview)
    - import_batch_id: UUID tracking this import batch

    **Response:**
    - count: Number of transactions successfully imported
    - import_batch_id: The batch ID for tracking
    """
    transaction_service = TransactionService(db)

    # Filter out transactions marked as filtered
    to_import = [t for t in confirm.transactions if not t.is_filtered]

    if not to_import:
        raise HTTPException(
            status_code=400,
            detail="No transactions to import (all were filtered out or invalid)",
        )

    # Convert ParsedTransaction to TransactionCreate
    transaction_creates = []
    for txn in to_import:
        # Skip transactions with validation errors
        if txn.validation_errors:
            logger.warning(f"Skipping row {txn.row_number} due to errors: {txn.validation_errors}")
            continue

        # Use post_date as transaction_date if transaction_date is None
        transaction_date = txn.transaction_date or txn.post_date

        # Preserve auto-categorized status if budget_id was assigned
        review_status = ReviewStatus.AUTO_CATEGORIZED if txn.auto_categorized else ReviewStatus.PENDING

        transaction_creates.append(
            TransactionCreate(
                date=transaction_date,
                post_date=txn.post_date,
                description=txn.description,
                merchant=txn.description,  # Use description as merchant
                amount=txn.amount,
                account=txn.account_name,
                chase_category=txn.chase_category,
                budget_id=txn.budget_id,
                is_accrual=False,
                status=TransactionStatus.ACTIVE,
                review_status=review_status,
                import_batch_id=confirm.import_batch_id,
            )
        )

    if not transaction_creates:
        raise HTTPException(
            status_code=400,
            detail="No valid transactions to import after filtering errors",
        )

    # Bulk create transactions
    try:
        created_count = transaction_service.bulk_create(
            transaction_creates,
            user_id=DEFAULT_USER_ID,
            import_batch_id=confirm.import_batch_id,
        )

        logger.info(f"Successfully imported {created_count} transactions (batch: {confirm.import_batch_id})")

        return {
            "message": f"Successfully imported {created_count} transactions",
            "import_batch_id": confirm.import_batch_id,
            "count": created_count,
        }
    except Exception as e:
        logger.error(f"Import failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
