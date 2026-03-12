"""Planning-oriented API routes."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.services.planning_year_service import PlanningYearService

router = APIRouter(prefix="/planning", tags=["planning"])


@router.get("/years", response_model=List[int])
async def get_planning_years(db: Session = Depends(get_db)):
    """Return planning years backed by dated data in the system."""
    return PlanningYearService(db).list_years()
