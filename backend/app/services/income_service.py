"""Income service for business logic."""

from datetime import date
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from backend.app.db.models.income import Income, IncomeDeduction, IncomeEffectiveRange
from backend.app.models.income import (
    DeductionCreate,
    EffectiveRangeCreate,
    EffectiveRangeUpdate,
    IncomeCreate,
    IncomeUpdate,
)
from backend.app.services.base_service import BaseService


class IncomeService(BaseService[Income, IncomeCreate, IncomeUpdate]):
    """Service for managing income entries."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        super().__init__(db=db, model=Income)

    def get_by_id(self, id: int) -> Optional[Income]:
        """Get income by ID with all relationships loaded."""
        return (
            self.db.query(Income)
            .options(joinedload(Income.effective_ranges).joinedload(IncomeEffectiveRange.deductions))
            .filter(Income.id == id)
            .first()
        )

    def get_all(
        self, skip: int = 0, limit: int = 100, order_by: str = "created_at", order_dir: str = "desc"
    ) -> list[Income]:
        """Get all incomes with relationships loaded."""
        query = self.db.query(Income).options(
            joinedload(Income.effective_ranges).joinedload(IncomeEffectiveRange.deductions)
        )

        # Apply ordering
        if hasattr(Income, order_by):
            column = getattr(Income, order_by)
            query = query.order_by(column.desc() if order_dir == "desc" else column.asc())

        return query.offset(skip).limit(limit).all()

    def create(self, obj_in: IncomeCreate, **extra_fields) -> Income:
        """Create income with effective ranges and deductions."""
        # Create income entry
        income_data = obj_in.model_dump(exclude={"effective_ranges"})
        income = Income(**income_data, **extra_fields)
        self.db.add(income)
        self.db.flush()  # Get income.id without committing

        # Create effective ranges with deductions
        for range_data in obj_in.effective_ranges:
            self._create_effective_range(income.id, range_data)

        self.db.commit()
        self.db.refresh(income)
        return income

    def _create_effective_range(self, income_id: int, range_in: EffectiveRangeCreate) -> IncomeEffectiveRange:
        """Create effective range with optional deductions."""
        range_data = range_in.model_dump(exclude={"deductions"})
        effective_range = IncomeEffectiveRange(income_id=income_id, **range_data)
        self.db.add(effective_range)
        self.db.flush()

        # Create deductions if provided
        if range_in.deductions:
            self._create_deductions(effective_range.id, range_in.deductions)

        return effective_range

    def _create_deductions(self, range_id: int, deductions_in: DeductionCreate) -> IncomeDeduction:
        """Create deduction record."""
        deduction = IncomeDeduction(income_effective_range_id=range_id, **deductions_in.model_dump())
        self.db.add(deduction)
        return deduction

    def add_effective_range(self, income_id: int, range_in: EffectiveRangeCreate) -> IncomeEffectiveRange:
        """Add new effective range to existing income."""
        # Verify income exists
        income = self.get_by_id(income_id)
        if not income:
            raise ValueError(f"Income with id {income_id} not found")

        effective_range = self._create_effective_range(income_id, range_in)
        self.db.commit()
        self.db.refresh(effective_range)
        return effective_range

    def update_effective_range(self, range_id: int, range_in: EffectiveRangeUpdate) -> IncomeEffectiveRange:
        """Update existing effective range."""
        effective_range = self.db.query(IncomeEffectiveRange).filter(IncomeEffectiveRange.id == range_id).first()

        if not effective_range:
            raise ValueError(f"Effective range with id {range_id} not found")

        # Update range fields
        update_data = range_in.model_dump(exclude={"deductions"}, exclude_unset=True)
        for field, value in update_data.items():
            setattr(effective_range, field, value)

        # Update deductions if provided
        if range_in.deductions is not None:
            if effective_range.deductions:
                # Update existing deductions
                for field, value in range_in.deductions.model_dump(exclude_unset=True).items():
                    setattr(effective_range.deductions, field, value)
            else:
                # Create new deductions
                self._create_deductions(range_id, range_in.deductions)

        self.db.commit()
        self.db.refresh(effective_range)
        return effective_range

    def delete_effective_range(self, range_id: int) -> bool:
        """Delete effective range (cascade deletes deductions)."""
        effective_range = self.db.query(IncomeEffectiveRange).filter(IncomeEffectiveRange.id == range_id).first()

        if not effective_range:
            return False

        # Verify this isn't the last range
        income = self.get_by_id(effective_range.income_id)
        if income and len(income.effective_ranges) <= 1:
            raise ValueError("Cannot delete the last effective range. Income must have at least one range.")

        self.db.delete(effective_range)
        self.db.commit()
        return True

    def get_by_type(self, income_type: str, skip: int = 0, limit: int = 100) -> list[Income]:
        """Get incomes by type (regular or bonus)."""
        return (
            self.db.query(Income)
            .options(joinedload(Income.effective_ranges).joinedload(IncomeEffectiveRange.deductions))
            .filter(Income.type == income_type)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_current_effective_range(self, income_id: int) -> Optional[IncomeEffectiveRange]:
        """Get the currently active effective range for an income."""
        today = date.today()
        return (
            self.db.query(IncomeEffectiveRange)
            .filter(
                IncomeEffectiveRange.income_id == income_id,
                IncomeEffectiveRange.start_date <= today,
                or_(IncomeEffectiveRange.end_date is None, IncomeEffectiveRange.end_date >= today),
            )
            .first()
        )

    def delete_by_stream(self, stream_name: str) -> int:
        """
        Delete all income entries with the given stream name.

        Args:
            stream_name: The name of the income stream to delete

        Returns:
            Number of entries deleted

        Raises:
            ValueError: If no entries found with the given stream name
        """
        # Find all entries with this stream name
        entries = self.db.query(Income).filter(Income.stream == stream_name).all()

        if not entries:
            raise ValueError(f"No income entries found for stream '{stream_name}'")

        # Delete each entry (cascade will handle ranges and deductions)
        deleted_count = len(entries)
        for entry in entries:
            self.db.delete(entry)

        self.db.commit()
        return deleted_count
