"""Income domain database models."""

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.app.db.database import Base


class IncomeSource(Base):
    """Stable parent record for a job, employer, or other income origin."""

    __tablename__ = "income_sources"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True, server_default="1")
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    components = relationship(
        "IncomeComponent",
        back_populates="source",
        cascade="all, delete-orphan",
    )

    __table_args__ = (Index("ix_income_sources_name", "name"),)

    def __repr__(self) -> str:
        return f"<IncomeSource(id={self.id}, name='{self.name}')>"


class IncomeComponent(Base):
    """A compensation lane within an income source."""

    __tablename__ = "income_components"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_id = Column(Integer, ForeignKey("income_sources.id", ondelete="CASCADE"), nullable=False, index=True)
    component_type = Column(String(32), nullable=False, index=True)
    component_mode = Column(String(20), nullable=False, index=True)
    label = Column(String(120), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    source = relationship("IncomeSource", back_populates="components")
    versions = relationship(
        "IncomeComponentVersion",
        back_populates="component",
        cascade="all, delete-orphan",
    )
    occurrences = relationship(
        "IncomeOccurrence",
        back_populates="component",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_income_components_source_type_mode", "source_id", "component_type", "component_mode"),
    )

    def __repr__(self) -> str:
        return (
            f"<IncomeComponent(id={self.id}, source_id={self.source_id}, "
            f"type='{self.component_type}', mode='{self.component_mode}')>"
        )


class IncomeComponentVersion(Base):
    """Effective-dated version for recurring compensation."""

    __tablename__ = "income_component_versions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    component_id = Column(Integer, ForeignKey("income_components.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    gross_amount = Column(Float, nullable=False)
    net_amount = Column(Float, nullable=False)
    periods_per_year = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    component = relationship("IncomeComponent", back_populates="versions")
    deductions = relationship(
        "IncomeComponentVersionDeduction",
        back_populates="version",
        uselist=False,
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_income_component_versions_component_dates", "component_id", "start_date", "end_date"),
    )

    def __repr__(self) -> str:
        return (
            f"<IncomeComponentVersion(id={self.id}, component_id={self.component_id}, "
            f"start_date={self.start_date}, end_date={self.end_date})>"
        )


class IncomeComponentVersionDeduction(Base):
    """Optional deduction breakdown for a recurring version."""

    __tablename__ = "income_component_version_deductions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    version_id = Column(
        Integer,
        ForeignKey("income_component_versions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    federal_tax = Column(Float, nullable=True)
    state_tax = Column(Float, nullable=True)
    fica = Column(Float, nullable=True)
    retirement = Column(Float, nullable=True)
    health_insurance = Column(Float, nullable=True)
    other = Column(Float, nullable=True)

    version = relationship("IncomeComponentVersion", back_populates="deductions")

    def __repr__(self) -> str:
        return f"<IncomeComponentVersionDeduction(id={self.id}, version_id={self.version_id})>"


class IncomeOccurrence(Base):
    """Dated one-time income event, such as a bonus."""

    __tablename__ = "income_occurrences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    component_id = Column(Integer, ForeignKey("income_components.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, index=True)
    planned_date = Column(Date, nullable=False)
    paid_date = Column(Date, nullable=True)
    gross_amount = Column(Float, nullable=False)
    net_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    component = relationship("IncomeComponent", back_populates="occurrences")
    deductions = relationship(
        "IncomeOccurrenceDeduction",
        back_populates="occurrence",
        uselist=False,
        cascade="all, delete-orphan",
    )

    __table_args__ = (Index("ix_income_occurrences_component_dates", "component_id", "planned_date", "paid_date"),)

    def __repr__(self) -> str:
        return (
            f"<IncomeOccurrence(id={self.id}, component_id={self.component_id}, "
            f"status='{self.status}', planned_date={self.planned_date})>"
        )


class IncomeOccurrenceDeduction(Base):
    """Optional deduction breakdown for an occurrence."""

    __tablename__ = "income_occurrence_deductions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    occurrence_id = Column(
        Integer,
        ForeignKey("income_occurrences.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    federal_tax = Column(Float, nullable=True)
    state_tax = Column(Float, nullable=True)
    fica = Column(Float, nullable=True)
    retirement = Column(Float, nullable=True)
    health_insurance = Column(Float, nullable=True)
    other = Column(Float, nullable=True)

    occurrence = relationship("IncomeOccurrence", back_populates="deductions")

    def __repr__(self) -> str:
        return f"<IncomeOccurrenceDeduction(id={self.id}, occurrence_id={self.occurrence_id})>"
