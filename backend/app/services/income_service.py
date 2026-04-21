"""Income domain service and year projection logic."""

from __future__ import annotations

from calendar import isleap
from datetime import date, timedelta
from typing import Iterable, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from backend.app.db.models.income import (
    IncomeAnnualAdjustment,
    IncomeComponent,
    IncomeComponentVersion,
    IncomeOccurrence,
    IncomeSource,
    IncomeYearSettings,
    IncomeYearTaxAdvantagedBucket,
)
from backend.app.models.income import (
    AnnualAdjustmentCreate,
    AnnualAdjustmentResponse,
    AnnualAdjustmentTotalsResponse,
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
    IncomeProjectionTotalsResponse,
    IncomeSourceCreate,
    IncomeSourceResponse,
    IncomeSourceUpdate,
    IncomeYearProjectionResponse,
    IncomeYearSettingsResponse,
    IncomeYearSettingsUpdate,
    ProjectedIncomeComponentResponse,
    ProjectedIncomeSourceResponse,
    TaxAdvantagedBucketEntryResponse,
    TaxAdvantagedBucketEntryUpdate,
    TaxAdvantagedInvestmentsResponse,
)

TAX_ADVANTAGED_BUCKET_METADATA = {
    "401k": {
        "is_spendable": False,
        "counts_toward_net": False,
    },
    "hsa": {
        "is_spendable": False,
        "counts_toward_net": False,
    },
    "fsa_daycare": {
        "is_spendable": True,
        "counts_toward_net": True,
    },
    "fsa_medical": {
        "is_spendable": True,
        "counts_toward_net": False,
    },
}
TAX_ADVANTAGED_BUCKET_TYPES = tuple(TAX_ADVANTAGED_BUCKET_METADATA)


def _is_spendable_tax_advantaged_bucket(bucket_type: str) -> bool:
    return bool(TAX_ADVANTAGED_BUCKET_METADATA[bucket_type]["is_spendable"])


def _counts_toward_net_tax_advantaged_bucket(bucket_type: str) -> bool:
    return bool(TAX_ADVANTAGED_BUCKET_METADATA[bucket_type]["counts_toward_net"])


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None

    normalized_value = value.strip()
    return normalized_value or None


def _normalize_required_text(value: str) -> str:
    normalized_value = value.strip()
    if not normalized_value:
        raise ValueError("Label is required")
    return normalized_value


def _normalize_annual_adjustment_amount(value: float) -> float:
    normalized_value = round(float(value), 2)
    if normalized_value == 0:
        raise ValueError("Annual adjustment amount must be non-zero")
    return normalized_value


def _blank_projection_totals() -> dict[str, object]:
    return {
        "committed_gross": 0.0,
        "committed_cash_net": 0.0,
        "committed_net": 0.0,
        "planned_gross": 0.0,
        "planned_cash_net": 0.0,
        "planned_net": 0.0,
    }


def _projection_response(values: dict[str, object]) -> IncomeProjectionTotalsResponse:
    return IncomeProjectionTotalsResponse(
        committed_gross=round(float(values["committed_gross"]), 2),
        committed_cash_net=round(float(values["committed_cash_net"]), 2),
        committed_net=round(float(values["committed_net"]), 2),
        planned_gross=round(float(values["planned_gross"]), 2),
        planned_cash_net=round(float(values["planned_cash_net"]), 2),
        planned_net=round(float(values["planned_net"]), 2),
    )


def _add_projection_values(
    totals: dict[str, object],
    *,
    gross: float,
    net: float,
    include_in_committed: bool,
) -> None:
    if include_in_committed:
        totals["committed_gross"] = float(totals["committed_gross"]) + gross
        totals["committed_cash_net"] = float(totals["committed_cash_net"]) + net
        totals["committed_net"] = float(totals["committed_net"]) + net

    totals["planned_gross"] = float(totals["planned_gross"]) + gross
    totals["planned_cash_net"] = float(totals["planned_cash_net"]) + net
    totals["planned_net"] = float(totals["planned_net"]) + net


def _roll_up_projection_totals(
    parent: dict[str, object],
    child: IncomeProjectionTotalsResponse,
) -> None:
    parent["committed_gross"] = float(parent["committed_gross"]) + child.committed_gross
    parent["committed_cash_net"] = float(parent["committed_cash_net"]) + child.committed_cash_net
    parent["committed_net"] = float(parent["committed_net"]) + child.committed_net
    parent["planned_gross"] = float(parent["planned_gross"]) + child.planned_gross
    parent["planned_cash_net"] = float(parent["planned_cash_net"]) + child.planned_cash_net
    parent["planned_net"] = float(parent["planned_net"]) + child.planned_net


def _ranges_overlap(
    left_start: date,
    left_end: date | None,
    right_start: date,
    right_end: date | None,
) -> bool:
    left_effective_end = left_end or date.max
    right_effective_end = right_end or date.max
    return left_start <= right_effective_end and right_start <= left_effective_end


def _version_intersection_days(version: IncomeComponentVersion, year: int) -> int:
    year_start = date(year, 1, 1)
    year_end = date(year, 12, 31)
    effective_start = max(version.start_date, year_start)
    effective_end = min(version.end_date or year_end, year_end)
    if effective_start > effective_end:
        return 0
    return (effective_end - effective_start).days + 1


def _days_in_year(year: int) -> int:
    return 366 if isleap(year) else 365


class IncomeService:
    """CRUD and projection operations for the source-first income domain."""

    def __init__(self, db: Session):
        self.db = db

    def list_sources(self) -> list[IncomeSource]:
        return self.db.query(IncomeSource).order_by(IncomeSource.sort_order.asc(), IncomeSource.name.asc()).all()

    def create_source(self, source_in: IncomeSourceCreate) -> IncomeSource:
        sort_order = source_in.sort_order
        if sort_order == 0 and self.db.query(IncomeSource.id).count() > 0:
            sort_order = self._next_source_sort_order()

        source = IncomeSource(
            name=source_in.name.strip(),
            is_active=source_in.is_active,
            sort_order=sort_order,
        )
        self.db.add(source)
        return self._commit_and_refresh(source)

    def update_source(self, source_id: int, source_in: IncomeSourceUpdate) -> IncomeSource:
        source = self._get_source_or_raise(source_id)
        updates = source_in.model_dump(exclude_unset=True)

        if "name" in updates and updates["name"] is not None:
            source.name = updates["name"].strip()
        if "is_active" in updates and updates["is_active"] is not None:
            source.is_active = updates["is_active"]
        if "sort_order" in updates and updates["sort_order"] is not None:
            source.sort_order = updates["sort_order"]

        return self._commit_and_refresh(source)

    def delete_source(self, source_id: int) -> None:
        source = self._get_source_or_raise(source_id)
        self.db.delete(source)
        self.db.commit()

    def create_component(self, source_id: int, component_in: IncomeComponentCreate) -> IncomeComponent:
        self._get_source_or_raise(source_id)
        component = IncomeComponent(
            source_id=source_id,
            component_type=component_in.component_type,
            component_mode=component_in.component_mode,
            label=_normalize_optional_text(component_in.label),
        )
        self.db.add(component)
        return self._commit_and_refresh(component)

    def update_component(self, component_id: int, component_in: IncomeComponentUpdate) -> IncomeComponent:
        component = self._get_component_or_raise(component_id)
        updates = component_in.model_dump(exclude_unset=True)

        if "component_type" in updates and updates["component_type"] is not None:
            component.component_type = updates["component_type"]
        if "component_mode" in updates and updates["component_mode"] is not None:
            component.component_mode = updates["component_mode"]
        if "label" in updates:
            component.label = _normalize_optional_text(updates["label"])

        return self._commit_and_refresh(component)

    def delete_component(self, component_id: int) -> None:
        component = self._get_component_or_raise(component_id)
        self.db.delete(component)
        self.db.commit()

    def create_version(self, component_id: int, version_in: IncomeComponentVersionCreate) -> IncomeComponentVersion:
        component = self._get_component_or_raise(component_id)
        self._ensure_component_mode(component, expected_mode="recurring")
        self._validate_amounts(version_in.gross_amount, version_in.net_amount)
        self._validate_date_range(version_in.start_date, version_in.end_date)
        self._auto_close_previous_version(component_id, version_in.start_date)
        self._ensure_no_version_overlap(component_id, version_in.start_date, version_in.end_date)

        version = IncomeComponentVersion(
            component_id=component_id,
            start_date=version_in.start_date,
            end_date=version_in.end_date,
            gross_amount=version_in.gross_amount,
            net_amount=version_in.net_amount,
            periods_per_year=version_in.periods_per_year,
        )
        self.db.add(version)
        saved_version = self._commit_and_refresh(version)
        return self._get_version_or_raise(saved_version.id)

    def update_version(self, version_id: int, version_in: IncomeComponentVersionUpdate) -> IncomeComponentVersion:
        version = self._get_version_or_raise(version_id)
        updates = version_in.model_dump(exclude_unset=True)

        next_start = updates.get("start_date", version.start_date)
        next_end = updates.get("end_date", version.end_date)
        next_gross = updates.get("gross_amount", version.gross_amount)
        next_net = updates.get("net_amount", version.net_amount)

        self._validate_date_range(next_start, next_end)
        self._validate_amounts(next_gross, next_net)
        self._ensure_no_version_overlap(version.component_id, next_start, next_end, exclude_version_id=version.id)

        for field, value in updates.items():
            setattr(version, field, value)

        self.db.commit()
        return self._get_version_or_raise(version_id)

    def delete_version(self, version_id: int) -> None:
        version = self._get_version_or_raise(version_id)
        self.db.delete(version)
        self.db.commit()

    def create_occurrence(self, component_id: int, occurrence_in: IncomeOccurrenceCreate) -> IncomeOccurrence:
        component = self._get_component_or_raise(component_id)
        self._ensure_component_mode(component, expected_mode="occurrence")
        self._validate_amounts(occurrence_in.gross_amount, occurrence_in.net_amount)

        paid_date = occurrence_in.paid_date
        if occurrence_in.status == "expected":
            paid_date = None
        elif paid_date is None:
            paid_date = occurrence_in.planned_date

        occurrence = IncomeOccurrence(
            component_id=component_id,
            status=occurrence_in.status,
            planned_date=occurrence_in.planned_date,
            paid_date=paid_date,
            gross_amount=occurrence_in.gross_amount,
            net_amount=occurrence_in.net_amount,
        )
        self.db.add(occurrence)
        saved_occurrence = self._commit_and_refresh(occurrence)
        return self._get_occurrence_or_raise(saved_occurrence.id)

    def update_occurrence(self, occurrence_id: int, occurrence_in: IncomeOccurrenceUpdate) -> IncomeOccurrence:
        occurrence = self._get_occurrence_or_raise(occurrence_id)
        updates = occurrence_in.model_dump(exclude_unset=True)

        next_gross = updates.get("gross_amount", occurrence.gross_amount)
        next_net = updates.get("net_amount", occurrence.net_amount)
        self._validate_amounts(next_gross, next_net)

        for field, value in updates.items():
            setattr(occurrence, field, value)

        if occurrence.status == "expected":
            occurrence.paid_date = None
        elif occurrence.paid_date is None:
            occurrence.paid_date = occurrence.planned_date

        self.db.commit()
        return self._get_occurrence_or_raise(occurrence_id)

    def delete_occurrence(self, occurrence_id: int) -> None:
        occurrence = self._get_occurrence_or_raise(occurrence_id)
        self.db.delete(occurrence)
        self.db.commit()

    def create_annual_adjustment(
        self,
        adjustment_in: AnnualAdjustmentCreate,
    ) -> IncomeAnnualAdjustment:
        adjustment = IncomeAnnualAdjustment(
            year=adjustment_in.year,
            label=_normalize_required_text(adjustment_in.label),
            effective_date=adjustment_in.effective_date,
            status=adjustment_in.status,
            amount=_normalize_annual_adjustment_amount(adjustment_in.amount),
        )
        self.db.add(adjustment)
        return self._commit_and_refresh(adjustment)

    def update_annual_adjustment(
        self,
        adjustment_id: int,
        adjustment_in: AnnualAdjustmentUpdate,
    ) -> IncomeAnnualAdjustment:
        adjustment = self._get_annual_adjustment_or_raise(adjustment_id)
        updates = adjustment_in.model_dump(exclude_unset=True)

        if "label" in updates and updates["label"] is not None:
            adjustment.label = _normalize_required_text(updates["label"])
        if "effective_date" in updates and updates["effective_date"] is not None:
            adjustment.effective_date = updates["effective_date"]
        if "status" in updates and updates["status"] is not None:
            adjustment.status = updates["status"]
        if "amount" in updates and updates["amount"] is not None:
            adjustment.amount = _normalize_annual_adjustment_amount(
                updates["amount"]
            )

        return self._commit_and_refresh(adjustment)

    def delete_annual_adjustment(self, adjustment_id: int) -> None:
        adjustment = self._get_annual_adjustment_or_raise(adjustment_id)
        self.db.delete(adjustment)
        self.db.commit()

    def upsert_year_settings(
        self,
        year: int,
        settings_in: IncomeYearSettingsUpdate,
    ) -> IncomeYearSettings:
        updates = settings_in.model_dump(exclude_unset=True)
        runway_source_selection = self._validate_runway_source_selection(updates)

        settings = self.db.query(IncomeYearSettings).filter(IncomeYearSettings.year == year).first()
        if settings is None:
            settings = IncomeYearSettings(
                year=year,
                emergency_fund_balance=(
                    settings_in.emergency_fund_balance
                    if settings_in.emergency_fund_balance is not None
                    else 18000
                ),
                primary_runway_source_id=runway_source_selection["primary"],
                secondary_runway_source_id=runway_source_selection["secondary"],
            )
            self.db.add(settings)
        else:
            if (
                "emergency_fund_balance" in updates
                and settings_in.emergency_fund_balance is not None
            ):
                settings.emergency_fund_balance = settings_in.emergency_fund_balance
            if "primary_runway_source_id" in updates:
                settings.primary_runway_source_id = runway_source_selection["primary"]
            if "secondary_runway_source_id" in updates:
                settings.secondary_runway_source_id = runway_source_selection["secondary"]
        self.db.flush()

        if settings_in.tax_advantaged_buckets is not None:
            self._replace_tax_advantaged_buckets(
                settings,
                settings_in.tax_advantaged_buckets,
            )

        return self._commit_and_refresh(settings)

    def get_year_projection(self, year: int) -> IncomeYearProjectionResponse:
        sources = self._load_sources_with_income()
        year_settings = self._get_year_settings(year)
        tax_advantaged_investments = self._tax_advantaged_investments_response(year_settings)
        annual_adjustments = self._load_annual_adjustments(year)
        annual_adjustment_totals = self._annual_adjustment_totals(annual_adjustments)
        projected_sources: list[ProjectedIncomeSourceResponse] = []
        household_totals = _blank_projection_totals()

        for source in sources:
            component_responses: list[ProjectedIncomeComponentResponse] = []
            source_totals = _blank_projection_totals()
            components = sorted(
                source.components,
                key=lambda component: (
                    component.component_mode,
                    component.component_type,
                    (component.label or "").lower(),
                    component.id,
                ),
            )

            for component in components:
                component_response = self._project_component(component, year)
                component_responses.append(component_response)
                _roll_up_projection_totals(source_totals, component_response.totals)

            source_response = ProjectedIncomeSourceResponse(
                **self._source_payload(source),
                totals=_projection_response(source_totals),
                components=component_responses,
            )
            projected_sources.append(source_response)
            _roll_up_projection_totals(household_totals, source_response.totals)

        self._roll_up_annual_adjustment_totals(
            household_totals,
            annual_adjustment_totals,
        )
        household_totals["committed_net"] = float(household_totals["committed_net"]) + float(
            sum(
                entry.annual_amount
                for entry in tax_advantaged_investments.entries
                if _counts_toward_net_tax_advantaged_bucket(entry.bucket_type)
            )
        )
        household_totals["planned_net"] = float(household_totals["planned_net"]) + float(
            sum(
                entry.annual_amount
                for entry in tax_advantaged_investments.entries
                if _counts_toward_net_tax_advantaged_bucket(entry.bucket_type)
            )
        )

        return IncomeYearProjectionResponse(
            year=year,
            totals=_projection_response(household_totals),
            emergency_fund_balance=round(
                float(year_settings.emergency_fund_balance if year_settings else 18000),
                2,
            ),
            primary_runway_source_id=(
                year_settings.primary_runway_source_id if year_settings else None
            ),
            secondary_runway_source_id=(
                year_settings.secondary_runway_source_id if year_settings else None
            ),
            tax_advantaged_investments=tax_advantaged_investments,
            annual_adjustment_totals=annual_adjustment_totals,
            annual_adjustments=[
                self._annual_adjustment_response(adjustment)
                for adjustment in annual_adjustments
            ],
            sources=projected_sources,
        )

    def serialize_annual_adjustment(
        self,
        adjustment: IncomeAnnualAdjustment,
    ) -> AnnualAdjustmentResponse:
        return self._annual_adjustment_response(adjustment)

    def serialize_source(self, source: IncomeSource) -> IncomeSourceResponse:
        return IncomeSourceResponse(**self._source_payload(source))

    def serialize_component(self, component: IncomeComponent) -> IncomeComponentResponse:
        return IncomeComponentResponse(**self._component_payload(component))

    def serialize_version(self, version: IncomeComponentVersion) -> IncomeComponentVersionResponse:
        return self._version_response(version)

    def serialize_occurrence(self, occurrence: IncomeOccurrence) -> IncomeOccurrenceResponse:
        return self._occurrence_response(occurrence)

    def serialize_year_settings(
        self,
        settings: IncomeYearSettings,
    ) -> IncomeYearSettingsResponse:
        return IncomeYearSettingsResponse(
            year=settings.year,
            tax_advantaged_buckets=self._tax_advantaged_bucket_entry_responses(settings),
            emergency_fund_balance=settings.emergency_fund_balance,
            primary_runway_source_id=settings.primary_runway_source_id,
            secondary_runway_source_id=settings.secondary_runway_source_id,
            created_at=settings.created_at,
            updated_at=settings.updated_at,
        )

    def _project_component(self, component: IncomeComponent, year: int) -> ProjectedIncomeComponentResponse:
        component_totals = _blank_projection_totals()
        versions = sorted(component.versions, key=lambda version: (version.start_date, version.id), reverse=True)
        occurrences = sorted(
            component.occurrences,
            key=lambda occurrence: (occurrence.paid_date or occurrence.planned_date, occurrence.id),
            reverse=True,
        )

        for version in versions:
            overlap_days = _version_intersection_days(version, year)
            if overlap_days == 0:
                continue

            factor = overlap_days / _days_in_year(year)
            gross = version.gross_amount * version.periods_per_year * factor
            net = version.net_amount * version.periods_per_year * factor
            _add_projection_values(
                component_totals,
                gross=gross,
                net=net,
                include_in_committed=True,
            )

        for occurrence in occurrences:
            effective_date = occurrence.paid_date or occurrence.planned_date
            if effective_date.year != year:
                continue

            _add_projection_values(
                component_totals,
                gross=occurrence.gross_amount,
                net=occurrence.net_amount,
                include_in_committed=occurrence.status == "actual",
            )

        return ProjectedIncomeComponentResponse(
            **self._component_payload(component),
            totals=_projection_response(component_totals),
            current_version=self._current_version_response(versions, year),
            versions=[self._version_response(version) for version in versions],
            occurrences=[self._occurrence_response(occurrence) for occurrence in occurrences],
        )

    def _current_version_response(
        self,
        versions: Iterable[IncomeComponentVersion],
        year: int,
    ) -> Optional[IncomeComponentVersionResponse]:
        year_start = date(year, 1, 1)
        year_end = date(year, 12, 31)
        matching_version = next(
            (
                version
                for version in versions
                if _ranges_overlap(version.start_date, version.end_date, year_start, year_end)
            ),
            None,
        )
        if matching_version is not None:
            return self._version_response(matching_version)

        latest_version = next(iter(versions), None)
        return self._version_response(latest_version) if latest_version is not None else None

    def _load_sources_with_income(self) -> list[IncomeSource]:
        return (
            self.db.query(IncomeSource)
            .options(
                joinedload(IncomeSource.components).joinedload(IncomeComponent.versions),
                joinedload(IncomeSource.components).joinedload(IncomeComponent.occurrences),
            )
            .order_by(IncomeSource.sort_order.asc(), IncomeSource.name.asc())
            .all()
        )

    def _load_annual_adjustments(self, year: int) -> list[IncomeAnnualAdjustment]:
        return (
            self.db.query(IncomeAnnualAdjustment)
            .filter(IncomeAnnualAdjustment.year == year)
            .order_by(
                IncomeAnnualAdjustment.effective_date.desc(),
                IncomeAnnualAdjustment.id.desc(),
            )
            .all()
        )

    def _next_source_sort_order(self) -> int:
        current = self.db.query(func.max(IncomeSource.sort_order)).scalar()
        return 0 if current is None else int(current) + 1

    def _get_source_or_raise(self, source_id: int) -> IncomeSource:
        source = self.db.query(IncomeSource).filter(IncomeSource.id == source_id).first()
        if source is None:
            raise ValueError(f"Income source {source_id} not found")
        return source

    def _get_component_or_raise(self, component_id: int) -> IncomeComponent:
        component = (
            self.db.query(IncomeComponent)
            .options(
                joinedload(IncomeComponent.versions),
                joinedload(IncomeComponent.occurrences),
            )
            .filter(IncomeComponent.id == component_id)
            .first()
        )
        if component is None:
            raise ValueError(f"Income component {component_id} not found")
        return component

    def _get_version_or_raise(self, version_id: int) -> IncomeComponentVersion:
        version = self.db.query(IncomeComponentVersion).filter(IncomeComponentVersion.id == version_id).first()
        if version is None:
            raise ValueError(f"Income component version {version_id} not found")
        return version

    def _get_occurrence_or_raise(self, occurrence_id: int) -> IncomeOccurrence:
        occurrence = self.db.query(IncomeOccurrence).filter(IncomeOccurrence.id == occurrence_id).first()
        if occurrence is None:
            raise ValueError(f"Income occurrence {occurrence_id} not found")
        return occurrence

    def _get_annual_adjustment_or_raise(self, adjustment_id: int) -> IncomeAnnualAdjustment:
        adjustment = (
            self.db.query(IncomeAnnualAdjustment)
            .filter(IncomeAnnualAdjustment.id == adjustment_id)
            .first()
        )
        if adjustment is None:
            raise ValueError(f"Annual adjustment {adjustment_id} not found")
        return adjustment

    def _ensure_component_mode(self, component: IncomeComponent, *, expected_mode: str) -> None:
        if component.component_mode != expected_mode:
            raise ValueError(
                f"Income component {component.id} uses mode '{component.component_mode}', expected '{expected_mode}'"
            )

    def _validate_amounts(self, gross_amount: float, net_amount: float) -> None:
        # Reimbursements and other tax-advantaged income can legitimately
        # arrive as effectively all-net cash, so we only rely on schema-level
        # positivity checks here.
        return None

    def _validate_date_range(self, start_date: date, end_date: date | None) -> None:
        if end_date is not None and start_date > end_date:
            raise ValueError("Start date must be on or before end date")

    def _commit_and_refresh(self, instance):
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def _auto_close_previous_version(self, component_id: int, new_start_date: date) -> None:
        previous_version = (
            self.db.query(IncomeComponentVersion)
            .filter(
                IncomeComponentVersion.component_id == component_id,
                IncomeComponentVersion.start_date < new_start_date,
                IncomeComponentVersion.end_date.is_(None),
            )
            .order_by(IncomeComponentVersion.start_date.desc())
            .first()
        )
        if previous_version is not None:
            previous_version.end_date = new_start_date - timedelta(days=1)

    def _ensure_no_version_overlap(
        self,
        component_id: int,
        start_date: date,
        end_date: date | None,
        *,
        exclude_version_id: int | None = None,
    ) -> None:
        versions = (
            self.db.query(IncomeComponentVersion).filter(IncomeComponentVersion.component_id == component_id).all()
        )

        for version in versions:
            if exclude_version_id is not None and version.id == exclude_version_id:
                continue
            if _ranges_overlap(version.start_date, version.end_date, start_date, end_date):
                raise ValueError("Recurring component versions cannot overlap")

    def _source_payload(self, source: IncomeSource) -> dict[str, object]:
        return {
            "id": source.id,
            "name": source.name,
            "is_active": source.is_active,
            "sort_order": source.sort_order,
            "created_at": source.created_at,
            "updated_at": source.updated_at,
        }

    def _annual_adjustment_response(
        self,
        adjustment: IncomeAnnualAdjustment,
    ) -> AnnualAdjustmentResponse:
        return AnnualAdjustmentResponse(
            id=adjustment.id,
            year=adjustment.year,
            label=adjustment.label,
            effective_date=adjustment.effective_date,
            status=adjustment.status,
            amount=round(float(adjustment.amount), 2),
            created_at=adjustment.created_at,
            updated_at=adjustment.updated_at,
        )

    def _annual_adjustment_totals(
        self,
        adjustments: Iterable[IncomeAnnualAdjustment],
    ) -> AnnualAdjustmentTotalsResponse:
        committed_total = 0.0
        planned_total = 0.0

        for adjustment in adjustments:
            amount = round(float(adjustment.amount), 2)
            planned_total += amount
            if adjustment.status == "actual":
                committed_total += amount

        return AnnualAdjustmentTotalsResponse(
            committed=round(committed_total, 2),
            planned=round(planned_total, 2),
        )

    def _roll_up_annual_adjustment_totals(
        self,
        household_totals: dict[str, object],
        annual_adjustment_totals: AnnualAdjustmentTotalsResponse,
    ) -> None:
        household_totals["committed_cash_net"] = float(
            household_totals["committed_cash_net"]
        ) + float(annual_adjustment_totals.committed)
        household_totals["committed_net"] = float(household_totals["committed_net"]) + float(
            annual_adjustment_totals.committed
        )
        household_totals["planned_cash_net"] = float(
            household_totals["planned_cash_net"]
        ) + float(annual_adjustment_totals.planned)
        household_totals["planned_net"] = float(household_totals["planned_net"]) + float(
            annual_adjustment_totals.planned
        )

    def _component_payload(self, component: IncomeComponent) -> dict[str, object]:
        return {
            "id": component.id,
            "source_id": component.source_id,
            "component_type": component.component_type,
            "component_mode": component.component_mode,
            "label": component.label,
            "created_at": component.created_at,
            "updated_at": component.updated_at,
        }

    def _version_response(self, version: IncomeComponentVersion) -> IncomeComponentVersionResponse:
        return IncomeComponentVersionResponse(
            id=version.id,
            component_id=version.component_id,
            start_date=version.start_date,
            end_date=version.end_date,
            gross_amount=version.gross_amount,
            net_amount=version.net_amount,
            periods_per_year=version.periods_per_year,
            created_at=version.created_at,
            updated_at=version.updated_at,
        )

    def _occurrence_response(self, occurrence: IncomeOccurrence) -> IncomeOccurrenceResponse:
        return IncomeOccurrenceResponse(
            id=occurrence.id,
            component_id=occurrence.component_id,
            status=occurrence.status,
            planned_date=occurrence.planned_date,
            paid_date=occurrence.paid_date,
            gross_amount=occurrence.gross_amount,
            net_amount=occurrence.net_amount,
            created_at=occurrence.created_at,
            updated_at=occurrence.updated_at,
        )

    def _get_year_settings(self, year: int) -> Optional[IncomeYearSettings]:
        return (
            self.db.query(IncomeYearSettings)
            .options(joinedload(IncomeYearSettings.tax_advantaged_buckets))
            .filter(IncomeYearSettings.year == year)
            .first()
        )

    def _tax_advantaged_investments_response(
        self,
        settings: Optional[IncomeYearSettings],
    ) -> TaxAdvantagedInvestmentsResponse:
        entries = self._tax_advantaged_bucket_entry_responses(settings)
        locked_total = round(
            sum(entry.annual_amount for entry in entries if not _is_spendable_tax_advantaged_bucket(entry.bucket_type)),
            2,
        )
        spendable_total = round(
            sum(entry.annual_amount for entry in entries if _is_spendable_tax_advantaged_bucket(entry.bucket_type)),
            2,
        )
        return TaxAdvantagedInvestmentsResponse(
            entries=entries,
            locked_total=locked_total,
            spendable_total=spendable_total,
            total=round(locked_total + spendable_total, 2),
        )

    def _tax_advantaged_bucket_entry_responses(
        self,
        settings: Optional[IncomeYearSettings],
    ) -> list[TaxAdvantagedBucketEntryResponse]:
        bucket_amounts = {
            bucket.bucket_type: round(float(bucket.annual_amount), 2)
            for bucket in (settings.tax_advantaged_buckets if settings else [])
            if bucket.bucket_type in TAX_ADVANTAGED_BUCKET_METADATA
        }
        return [
            TaxAdvantagedBucketEntryResponse(
                bucket_type=bucket_type,
                annual_amount=bucket_amounts.get(bucket_type, 0),
            )
            for bucket_type in TAX_ADVANTAGED_BUCKET_TYPES
        ]

    def _validate_runway_source_id(self, source_id: object) -> int | None:
        if source_id is None:
            return None

        normalized_source_id = int(source_id)
        source_exists = (
            self.db.query(IncomeSource.id)
            .filter(IncomeSource.id == normalized_source_id)
            .first()
        )
        if source_exists is None:
            raise ValueError(f"Income source {normalized_source_id} not found")

        return normalized_source_id

    def _validate_runway_source_selection(
        self,
        updates: dict[str, object],
    ) -> dict[str, int | None]:
        runway_source_selection = {
            "primary": self._validate_runway_source_id(
                updates.get("primary_runway_source_id"),
            ),
            "secondary": self._validate_runway_source_id(
                updates.get("secondary_runway_source_id"),
            ),
        }

        if (
            runway_source_selection["primary"] is not None
            and runway_source_selection["secondary"] is not None
            and runway_source_selection["primary"]
            == runway_source_selection["secondary"]
        ):
            raise ValueError(
                "Primary and secondary runway scenarios must use different income sources"
            )

        return runway_source_selection

    def _replace_tax_advantaged_buckets(
        self,
        settings: IncomeYearSettings,
        bucket_updates: list[TaxAdvantagedBucketEntryUpdate],
    ) -> None:
        seen_types: set[str] = set()
        for entry in bucket_updates:
            if entry.bucket_type in seen_types:
                raise ValueError(f"Duplicate tax-advantaged bucket '{entry.bucket_type}'")
            seen_types.add(entry.bucket_type)

        existing_by_type = {bucket.bucket_type: bucket for bucket in settings.tax_advantaged_buckets}
        desired_amounts = {entry.bucket_type: float(entry.annual_amount) for entry in bucket_updates}

        for bucket_type in TAX_ADVANTAGED_BUCKET_TYPES:
            next_amount = desired_amounts.get(bucket_type, 0.0)
            existing_bucket = existing_by_type.get(bucket_type)
            if existing_bucket is None:
                settings.tax_advantaged_buckets.append(
                    IncomeYearTaxAdvantagedBucket(
                        bucket_type=bucket_type,
                        annual_amount=next_amount,
                    )
                )
                continue

            existing_bucket.annual_amount = next_amount
