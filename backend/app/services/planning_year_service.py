"""System-backed planning year discovery."""

from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from backend.app.db.models.income import IncomeComponentVersion, IncomeOccurrence
from backend.app.db.models.transaction import Transaction, TransactionStatus

MINIMUM_PLANNING_YEAR = 2025


def _last_year_for_month_span(start_date: date, months: int) -> int:
    """Return the final calendar year touched by an inclusive month span."""
    month_offset = max(months - 1, 0)
    return start_date.year + ((start_date.month - 1 + month_offset) // 12)


def _add_year_range(years: set[int], start_year: int, end_year: int) -> None:
    """Add every year in the inclusive range, honoring the planning floor."""
    for year in range(max(start_year, MINIMUM_PLANNING_YEAR), end_year + 1):
        years.add(year)


class PlanningYearService:
    """Compute the years that should be available in planning dropdowns."""

    def __init__(self, db: Session):
        self.db = db

    def list_years(self) -> list[int]:
        years = {MINIMUM_PLANNING_YEAR}

        self._add_transaction_years(years)
        self._add_income_version_years(years)
        self._add_income_occurrence_years(years)

        return sorted(years)

    def _add_transaction_years(self, years: set[int]) -> None:
        transactions = (
            self.db.query(
                Transaction.transaction_date,
                Transaction.spread_start_date,
                Transaction.spread_months,
                Transaction.is_accrual,
            )
            .filter(Transaction.status != TransactionStatus.DELETED.value)
            .all()
        )

        for transaction_date, spread_start_date, spread_months, is_accrual in transactions:
            if spread_start_date and spread_months:
                _add_year_range(
                    years,
                    spread_start_date.year,
                    _last_year_for_month_span(spread_start_date, spread_months),
                )
                continue

            if is_accrual:
                _add_year_range(
                    years,
                    transaction_date.year,
                    _last_year_for_month_span(transaction_date.replace(day=1), 12),
                )
                continue

            if transaction_date.year >= MINIMUM_PLANNING_YEAR:
                years.add(transaction_date.year)

    def _add_income_version_years(self, years: set[int]) -> None:
        versions = self.db.query(
            IncomeComponentVersion.start_date,
            IncomeComponentVersion.end_date,
        ).all()

        for start_date, end_date in versions:
            end_year = end_date.year if end_date else start_date.year
            _add_year_range(years, start_date.year, end_year)

    def _add_income_occurrence_years(self, years: set[int]) -> None:
        occurrences = self.db.query(
            IncomeOccurrence.planned_date,
            IncomeOccurrence.paid_date,
        ).all()

        for planned_date, paid_date in occurrences:
            if planned_date.year >= MINIMUM_PLANNING_YEAR:
                years.add(planned_date.year)
            if paid_date and paid_date.year >= MINIMUM_PLANNING_YEAR:
                years.add(paid_date.year)
