"""Income API router for the source-first income domain."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.models.income import (
    AnnualAdjustmentCreate,
    AnnualAdjustmentResponse,
    AnnualAdjustmentUpdate,
    IncomeComponentCreate,
    IncomeComponentResponse,
    IncomeComponentUpdate,
    IncomeComponentVersionCreate,
    IncomeComponentVersionResponse,
    IncomeComponentVersionUpdate,
    IncomeOccurrenceCreate,
    IncomeOccurrenceResponse,
    IncomeOccurrenceUpdate,
    IncomeSourceCreate,
    IncomeSourceResponse,
    IncomeSourceUpdate,
    IncomeYearProjectionResponse,
    IncomeYearSettingsResponse,
    IncomeYearSettingsUpdate,
)
from backend.app.services.income_service import IncomeService

router = APIRouter(prefix="/incomes", tags=["incomes"])


def get_income_service(db: Session = Depends(get_db)) -> IncomeService:
    """Dependency to resolve the income service."""
    return IncomeService(db)


def _handle_value_error(error: ValueError) -> HTTPException:
    detail = str(error)
    if "not found" in detail.lower():
        return HTTPException(status_code=404, detail=detail)
    return HTTPException(status_code=400, detail=detail)


@router.get("/projection", response_model=IncomeYearProjectionResponse)
async def get_income_projection(
    year: int,
    service: IncomeService = Depends(get_income_service),
):
    """Return the year-scoped nested income read model."""
    return service.get_year_projection(year)


@router.put(
    "/year-settings/{year}",
    response_model=IncomeYearSettingsResponse,
)
async def update_income_year_settings(
    year: int,
    settings_in: IncomeYearSettingsUpdate,
    service: IncomeService = Depends(get_income_service),
):
    """Create or update year-scoped investment settings for income views."""
    try:
        return service.serialize_year_settings(service.upsert_year_settings(year, settings_in))
    except ValueError as error:
        raise _handle_value_error(error)


@router.post(
    "/annual-adjustments",
    response_model=AnnualAdjustmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_annual_adjustment(
    adjustment_in: AnnualAdjustmentCreate,
    service: IncomeService = Depends(get_income_service),
):
    """Create a year-scoped annual adjustment."""
    try:
        return service.serialize_annual_adjustment(
            service.create_annual_adjustment(adjustment_in)
        )
    except ValueError as error:
        raise _handle_value_error(error)


@router.put(
    "/annual-adjustments/{adjustment_id}",
    response_model=AnnualAdjustmentResponse,
)
async def update_annual_adjustment(
    adjustment_id: int,
    adjustment_in: AnnualAdjustmentUpdate,
    service: IncomeService = Depends(get_income_service),
):
    """Update a year-scoped annual adjustment."""
    try:
        return service.serialize_annual_adjustment(
            service.update_annual_adjustment(adjustment_id, adjustment_in)
        )
    except ValueError as error:
        raise _handle_value_error(error)


@router.delete(
    "/annual-adjustments/{adjustment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_annual_adjustment(
    adjustment_id: int,
    service: IncomeService = Depends(get_income_service),
):
    """Delete a year-scoped annual adjustment."""
    try:
        service.delete_annual_adjustment(adjustment_id)
    except ValueError as error:
        raise _handle_value_error(error)


@router.get("/sources", response_model=List[IncomeSourceResponse])
async def list_income_sources(service: IncomeService = Depends(get_income_service)):
    """List top-level income sources."""
    return [service.serialize_source(source) for source in service.list_sources()]


@router.post("/sources", response_model=IncomeSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_income_source(
    source_in: IncomeSourceCreate,
    service: IncomeService = Depends(get_income_service),
):
    """Create a top-level income source."""
    try:
        return service.serialize_source(service.create_source(source_in))
    except ValueError as error:
        raise _handle_value_error(error)


@router.put("/sources/{source_id}", response_model=IncomeSourceResponse)
async def update_income_source(
    source_id: int,
    source_in: IncomeSourceUpdate,
    service: IncomeService = Depends(get_income_service),
):
    """Update an income source."""
    try:
        return service.serialize_source(service.update_source(source_id, source_in))
    except ValueError as error:
        raise _handle_value_error(error)


@router.delete("/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_income_source(
    source_id: int,
    service: IncomeService = Depends(get_income_service),
):
    """Delete an income source and its nested components."""
    try:
        service.delete_source(source_id)
    except ValueError as error:
        raise _handle_value_error(error)


@router.post(
    "/sources/{source_id}/components", response_model=IncomeComponentResponse, status_code=status.HTTP_201_CREATED
)
async def create_income_component(
    source_id: int,
    component_in: IncomeComponentCreate,
    service: IncomeService = Depends(get_income_service),
):
    """Create an income component under a source."""
    try:
        return service.serialize_component(service.create_component(source_id, component_in))
    except ValueError as error:
        raise _handle_value_error(error)


@router.put("/components/{component_id}", response_model=IncomeComponentResponse)
async def update_income_component(
    component_id: int,
    component_in: IncomeComponentUpdate,
    service: IncomeService = Depends(get_income_service),
):
    """Update an income component."""
    try:
        return service.serialize_component(service.update_component(component_id, component_in))
    except ValueError as error:
        raise _handle_value_error(error)


@router.delete("/components/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_income_component(
    component_id: int,
    service: IncomeService = Depends(get_income_service),
):
    """Delete an income component."""
    try:
        service.delete_component(component_id)
    except ValueError as error:
        raise _handle_value_error(error)


@router.post(
    "/components/{component_id}/versions",
    response_model=IncomeComponentVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_component_version(
    component_id: int,
    version_in: IncomeComponentVersionCreate,
    service: IncomeService = Depends(get_income_service),
):
    """Create a recurring version under a recurring component."""
    try:
        return service.serialize_version(service.create_version(component_id, version_in))
    except ValueError as error:
        raise _handle_value_error(error)


@router.put("/versions/{version_id}", response_model=IncomeComponentVersionResponse)
async def update_component_version(
    version_id: int,
    version_in: IncomeComponentVersionUpdate,
    service: IncomeService = Depends(get_income_service),
):
    """Update a recurring version."""
    try:
        return service.serialize_version(service.update_version(version_id, version_in))
    except ValueError as error:
        raise _handle_value_error(error)


@router.delete("/versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_component_version(
    version_id: int,
    service: IncomeService = Depends(get_income_service),
):
    """Delete a recurring version."""
    try:
        service.delete_version(version_id)
    except ValueError as error:
        raise _handle_value_error(error)


@router.post(
    "/components/{component_id}/occurrences",
    response_model=IncomeOccurrenceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_income_occurrence(
    component_id: int,
    occurrence_in: IncomeOccurrenceCreate,
    service: IncomeService = Depends(get_income_service),
):
    """Create a one-time occurrence under an occurrence component."""
    try:
        return service.serialize_occurrence(service.create_occurrence(component_id, occurrence_in))
    except ValueError as error:
        raise _handle_value_error(error)


@router.put("/occurrences/{occurrence_id}", response_model=IncomeOccurrenceResponse)
async def update_income_occurrence(
    occurrence_id: int,
    occurrence_in: IncomeOccurrenceUpdate,
    service: IncomeService = Depends(get_income_service),
):
    """Update a one-time occurrence."""
    try:
        return service.serialize_occurrence(service.update_occurrence(occurrence_id, occurrence_in))
    except ValueError as error:
        raise _handle_value_error(error)


@router.delete("/occurrences/{occurrence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_income_occurrence(
    occurrence_id: int,
    service: IncomeService = Depends(get_income_service),
):
    """Delete a one-time occurrence."""
    try:
        service.delete_occurrence(occurrence_id)
    except ValueError as error:
        raise _handle_value_error(error)
