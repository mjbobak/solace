"""Transactions API router."""

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import TransactionStatus
from backend.app.models.transaction import Transaction, TransactionCreate, TransactionUpdate
from backend.app.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["transactions"])

# TODO: Replace with actual user from auth context
DEFAULT_USER_ID = 1


def _populate_transaction_fields(transaction) -> None:
    """Populate category_name and budget fields from relationships."""
    # Populate category name (deprecated)
    if transaction.category:
        transaction.category_name = transaction.category.name
    else:
        transaction.category_name = None

    # Populate budget fields
    if transaction.budget:
        transaction.budget_label = transaction.budget.expense_label
        transaction.budget_category = transaction.budget.category.name if transaction.budget.category else None
        transaction.budget_type = transaction.budget.expense_type
    else:
        transaction.budget_label = None
        transaction.budget_category = None
        transaction.budget_type = None


@router.get("", response_model=List[Transaction])
async def get_transactions(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = Query(None, description="Filter transactions from this date"),
    end_date: Optional[date] = Query(None, description="Filter transactions to this date"),
    account: Optional[str] = Query(None, description="Filter by account name"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    db: Session = Depends(get_db),
):
    """
    Get all transactions with optional filtering.

    Query Parameters:
        skip: Number of records to skip (pagination offset)
        limit: Maximum number of records to return
        start_date: Filter transactions from this date (inclusive)
        end_date: Filter transactions to this date (inclusive)
        account: Filter by account name
        category_id: Filter by category ID

    Returns:
        List of transactions
    """
    from sqlalchemy.orm import joinedload

    from backend.app.db.models.budget import Budget

    service = TransactionService(db)
    user_id = DEFAULT_USER_ID

    # Apply date range filter if provided
    if start_date and end_date:
        transactions = service.get_by_date_range(user_id, start_date, end_date, skip=skip, limit=limit)
    # Apply account filter if provided
    elif account:
        transactions = service.get_by_account(user_id, account, skip=skip, limit=limit)
    # Apply category filter if provided
    elif category_id:
        transactions = service.get_by_category(user_id, category_id, skip=skip, limit=limit)
    # Get all transactions for user
    else:
        transactions = (
            db.query(service.model)
            .options(joinedload(service.model.category), joinedload(service.model.budget).joinedload(Budget.category))
            .filter(service.model.user_id == user_id)
            .filter(service.model.status != TransactionStatus.DELETED.value)
            .order_by(service.model.transaction_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    # Populate category_name and budget fields from relationships
    for transaction in transactions:
        _populate_transaction_fields(transaction)

    return transactions


@router.get("/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """
    Get a specific transaction by ID.

    Args:
        transaction_id: Transaction ID
        db: Database session

    Returns:
        Transaction if found

    Raises:
        HTTPException: 404 if transaction not found
    """
    service = TransactionService(db)
    transaction = service.get_by_id(transaction_id)

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Verify user owns this transaction
    user_id = DEFAULT_USER_ID
    if transaction.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Populate budget fields
    _populate_transaction_fields(transaction)

    return transaction


@router.post("", response_model=Transaction, status_code=201)
async def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    """
    Create a new transaction.

    Args:
        transaction: Transaction data
        db: Database session

    Returns:
        Created transaction

    Raises:
        HTTPException: 400 if validation fails
    """
    service = TransactionService(db)
    user_id = DEFAULT_USER_ID

    try:
        created = service.create(transaction, user_id=user_id)
        _populate_transaction_fields(created)
        return created
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating transaction: {str(e)}")


@router.put("/{transaction_id}", response_model=Transaction)
async def update_transaction(
    transaction_id: int,
    transaction: TransactionUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an existing transaction (partial updates supported).

    Args:
        transaction_id: Transaction ID
        transaction: Transaction update data
        db: Database session

    Returns:
        Updated transaction

    Raises:
        HTTPException: 404 if transaction not found
        HTTPException: 403 if user doesn't own the transaction
    """
    service = TransactionService(db)
    user_id = DEFAULT_USER_ID

    # Verify user owns this transaction
    existing = service.get_by_id(transaction_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if existing.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        updated = service.update(transaction_id, transaction)
        if not updated:
            raise HTTPException(status_code=404, detail="Transaction not found")
        _populate_transaction_fields(updated)
        return updated
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating transaction: {str(e)}")


@router.patch("/{transaction_id}/categorize")
async def categorize_transaction(
    transaction_id: int,
    category_id: int = Query(..., description="Category ID"),
    db: Session = Depends(get_db),
):
    """
    Update only the category of a transaction.

    Args:
        transaction_id: Transaction ID
        category_id: New category ID
        db: Database session

    Returns:
        Updated transaction

    Raises:
        HTTPException: 404 if transaction not found
    """
    service = TransactionService(db)
    user_id = DEFAULT_USER_ID

    # Verify user owns this transaction
    existing = service.get_by_id(transaction_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if existing.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    update = TransactionUpdate(category_id=category_id)
    updated = service.update(transaction_id, update)
    _populate_transaction_fields(updated)

    return updated


@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """
    Soft delete a transaction (sets status to 'deleted').

    Args:
        transaction_id: Transaction ID
        db: Database session

    Raises:
        HTTPException: 404 if transaction not found
        HTTPException: 403 if user doesn't own the transaction
    """
    service = TransactionService(db)
    user_id = DEFAULT_USER_ID

    # Verify user owns this transaction
    existing = service.get_by_id(transaction_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if existing.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Soft delete - set status to deleted instead of hard delete
    from backend.app.db.models import TransactionStatus

    update = TransactionUpdate(status=TransactionStatus.DELETED)
    service.update(transaction_id, update)
