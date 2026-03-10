"""Income API router."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.models.income import (
    EffectiveRangeCreate,
    EffectiveRangeResponse,
    EffectiveRangeUpdate,
    IncomeCreate,
    IncomeResponse,
    IncomeUpdate,
)
from backend.app.services.income_service import IncomeService

router = APIRouter(prefix="/incomes", tags=["incomes"])


def get_income_service(db: Session = Depends(get_db)) -> IncomeService:
    """Dependency to get income service."""
    return IncomeService(db)


@router.get("", response_model=List[IncomeResponse])
async def list_incomes(
    skip: int = 0,
    limit: int = 100,
    income_type: str | None = None,
    service: IncomeService = Depends(get_income_service),
):
    """List all income entries with optional type filter."""
    if income_type:
        return service.get_by_type(income_type, skip=skip, limit=limit)
    return service.get_all(skip=skip, limit=limit)


@router.get("/{income_id}", response_model=IncomeResponse)
async def get_income(income_id: int, service: IncomeService = Depends(get_income_service)):
    """Get income by ID."""
    income = service.get_by_id(income_id)
    if not income:
        raise HTTPException(status_code=404, detail=f"Income with id {income_id} not found")
    return income


@router.post("", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
async def create_income(income_in: IncomeCreate, service: IncomeService = Depends(get_income_service)):
    """Create new income entry with effective ranges."""
    try:
        return service.create(income_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{income_id}", response_model=IncomeResponse)
async def update_income(
    income_id: int,
    income_in: IncomeUpdate,
    service: IncomeService = Depends(get_income_service),
):
    """Update income entry (does not affect effective ranges)."""
    income = service.get_by_id(income_id)
    if not income:
        raise HTTPException(status_code=404, detail=f"Income with id {income_id} not found")

    try:
        return service.update(income_id, income_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_income(income_id: int, service: IncomeService = Depends(get_income_service)):
    """Delete income entry (cascade deletes ranges and deductions)."""
    if not service.exists(income_id):
        raise HTTPException(status_code=404, detail=f"Income with id {income_id} not found")

    service.delete(income_id)


# ========== Effective Range Endpoints ==========


@router.post("/{income_id}/ranges", response_model=EffectiveRangeResponse, status_code=status.HTTP_201_CREATED)
async def add_effective_range(
    income_id: int,
    range_in: EffectiveRangeCreate,
    service: IncomeService = Depends(get_income_service),
):
    """Add new effective range to existing income."""
    try:
        return service.add_effective_range(income_id, range_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/ranges/{range_id}", response_model=EffectiveRangeResponse)
async def update_effective_range(
    range_id: int,
    range_in: EffectiveRangeUpdate,
    service: IncomeService = Depends(get_income_service),
):
    """Update existing effective range."""
    try:
        return service.update_effective_range(range_id, range_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/ranges/{range_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_effective_range(range_id: int, service: IncomeService = Depends(get_income_service)):
    """Delete effective range (prevents deleting last range)."""
    try:
        deleted = service.delete_effective_range(range_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Effective range with id {range_id} not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{income_id}/ranges/current", response_model=EffectiveRangeResponse)
async def get_current_range(income_id: int, service: IncomeService = Depends(get_income_service)):
    """Get currently active effective range for income."""
    current_range = service.get_current_effective_range(income_id)
    if not current_range:
        raise HTTPException(
            status_code=404,
            detail=f"No active effective range found for income {income_id}",
        )
    return current_range


# ========== Stream-level Operations ==========


@router.delete("/stream/{stream_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_income_stream(stream_name: str, service: IncomeService = Depends(get_income_service)):
    """
    Delete all income entries for a given stream name.

    Args:
        stream_name: The name of the income stream to delete

    Returns:
        204 No Content on success

    Raises:
        404 Not Found if no entries exist for the stream
    """
    try:
        service.delete_by_stream(stream_name)
        return None
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
