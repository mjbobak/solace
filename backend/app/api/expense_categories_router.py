"""API router for expense category management."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.models.category import ExpenseCategory, ExpenseCategoryCreate, ExpenseCategoryUpdate
from backend.app.services.category_service import ExpenseCategoryService

router = APIRouter(tags=["expense-categories"])


@router.get("/expense-categories", response_model=List[ExpenseCategory])
async def get_all_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> List[ExpenseCategory]:
    """
    Get all expense categories.

    Returns categories sorted alphabetically by name.

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        db: Database session

    Returns:
        List of expense categories sorted by name
    """
    service = ExpenseCategoryService(db)
    categories = service.get_all(skip=skip, limit=limit)
    # Sort alphabetically by name
    return sorted(categories, key=lambda c: c.name)


@router.get("/expense-categories/{category_id}", response_model=ExpenseCategory)
async def get_category(
    category_id: int,
    db: Session = Depends(get_db),
) -> ExpenseCategory:
    """
    Get a single expense category by ID.

    Args:
        category_id: Category ID
        db: Database session

    Returns:
        The expense category

    Raises:
        HTTPException 404: Category not found
    """
    service = ExpenseCategoryService(db)
    category = service.get_by_id(category_id)

    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    return category


@router.post("/expense-categories", response_model=ExpenseCategory, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
) -> ExpenseCategory:
    """
    Create a new expense category.

    Args:
        category_in: Category creation request data
        db: Database session

    Returns:
        The created expense category

    Raises:
        HTTPException 400: Category name already exists
    """
    service = ExpenseCategoryService(db)

    try:
        category = service.create(category_in)
        return category
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/expense-categories/{category_id}", response_model=ExpenseCategory)
async def update_category(
    category_id: int,
    category_in: ExpenseCategoryUpdate,
    db: Session = Depends(get_db),
) -> ExpenseCategory:
    """
    Update an expense category.

    Args:
        category_id: Category ID to update
        category_in: Category update data
        db: Database session

    Returns:
        The updated expense category

    Raises:
        HTTPException 404: Category not found
        HTTPException 400: New name already exists
    """
    from sqlalchemy.exc import IntegrityError

    service = ExpenseCategoryService(db)
    category = service.get_by_id(category_id)

    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    try:
        updated_category = service.update(category_id, category_in)
        return updated_category
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except IntegrityError as e:
        db.rollback()
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name already exists")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Database error occurred")


@router.delete("/expense-categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
) -> None:
    """
    Delete an expense category.

    A category can only be deleted if it's not used by any budget entries.

    Args:
        category_id: Category ID to delete
        db: Database session

    Raises:
        HTTPException 404: Category not found
        HTTPException 400: Category is in use by budget entries
    """
    service = ExpenseCategoryService(db)
    category = service.get_by_id(category_id)

    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Check if category can be deleted
    can_delete, reason = service.can_delete(category_id)
    if not can_delete:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)

    service.delete(category_id)


@router.get("/expense-categories/{category_id}/usage")
async def get_category_usage(
    category_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """
    Get usage count for a category (how many budgets use it).

    Args:
        category_id: Category ID
        db: Database session

    Returns:
        Dictionary with 'usage_count' field showing number of budgets using this category

    Raises:
        HTTPException 404: Category not found
    """
    service = ExpenseCategoryService(db)
    category = service.get_by_id(category_id)

    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    count = service.get_usage_count(category_id)
    return {"usage_count": count}
