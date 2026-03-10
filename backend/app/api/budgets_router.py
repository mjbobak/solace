"""Budget API router."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.models.budget import BudgetCreate, BudgetResponse, BudgetUpdate
from backend.app.services.budget_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=List[BudgetResponse])
async def get_all_budgets(
    skip: int = 0,
    limit: int = 100,
    expense_type: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Get all budget entries with optional filtering.

    Args:
        skip: Number of records to skip (pagination offset)
        limit: Maximum number of records to return
        expense_type: Optional filter by expense type (ESSENTIAL or FUNSIES)
        db: Database session

    Returns:
        List of budget entries
    """
    service = BudgetService(db)

    if expense_type:
        budgets = service.get_by_type(expense_type, skip=skip, limit=limit)
    else:
        budgets = service.get_all(skip=skip, limit=limit)

    return budgets


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(budget_id: int, db: Session = Depends(get_db)):
    """
    Get a specific budget entry by ID.

    Args:
        budget_id: Budget ID
        db: Database session

    Returns:
        Budget entry if found

    Raises:
        HTTPException: 404 if budget not found
    """
    service = BudgetService(db)
    budget = service.get_by_id(budget_id)

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    return budget


@router.post("", response_model=BudgetResponse, status_code=201)
async def create_budget(budget: BudgetCreate, db: Session = Depends(get_db)):
    """
    Create a new budget entry.

    Args:
        budget: Budget data (supports either expense_category_id or expense_category name)
        db: Database session

    Returns:
        Created budget entry

    Raises:
        HTTPException: 400 if validation fails or category not found
        HTTPException: 404 if category name doesn't exist
    """
    from backend.app.db.models.expense_category import ExpenseCategory

    service = BudgetService(db)

    try:
        # Convert category name to ID if needed
        if budget.expense_category and not budget.expense_category_id:
            category = db.query(ExpenseCategory).filter(ExpenseCategory.name == budget.expense_category).first()
            if not category:
                raise HTTPException(status_code=404, detail=f"Category '{budget.expense_category}' not found")
            budget.expense_category_id = category.id
        elif not budget.expense_category_id:
            raise HTTPException(status_code=400, detail="Either expense_category or expense_category_id is required")

        return service.create(budget)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: int, budget: BudgetUpdate, db: Session = Depends(get_db)):
    """
    Update an existing budget entry (partial updates supported).

    Args:
        budget_id: Budget ID
        budget: Budget update data (only provided fields are updated, supports expense_category name)
        db: Database session

    Returns:
        Updated budget entry

    Raises:
        HTTPException: 404 if budget not found or category not found
    """
    from backend.app.db.models.expense_category import ExpenseCategory

    service = BudgetService(db)

    # Convert category name to ID if needed
    if budget.expense_category and not budget.expense_category_id:
        category = db.query(ExpenseCategory).filter(ExpenseCategory.name == budget.expense_category).first()
        if not category:
            raise HTTPException(status_code=404, detail=f"Category '{budget.expense_category}' not found")
        budget.expense_category_id = category.id

    updated = service.update(budget_id, budget)

    if not updated:
        raise HTTPException(status_code=404, detail="Budget not found")

    return updated


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    """
    Delete a budget entry by ID.

    Args:
        budget_id: Budget ID
        db: Database session

    Raises:
        HTTPException: 404 if budget not found
    """
    service = BudgetService(db)
    success = service.delete(budget_id)

    if not success:
        raise HTTPException(status_code=404, detail="Budget not found")
