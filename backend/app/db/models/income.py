"""Income domain database models."""

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
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

    __table_args__ = (Index("ix_income_components_source_type_mode", "source_id", "component_type", "component_mode"),)

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

    __table_args__ = (Index("ix_income_component_versions_component_dates", "component_id", "start_date", "end_date"),)

    def __repr__(self) -> str:
        return (
            f"<IncomeComponentVersion(id={self.id}, component_id={self.component_id}, "
            f"start_date={self.start_date}, end_date={self.end_date})>"
        )


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

    __table_args__ = (Index("ix_income_occurrences_component_dates", "component_id", "planned_date", "paid_date"),)

    def __repr__(self) -> str:
        return (
            f"<IncomeOccurrence(id={self.id}, component_id={self.component_id}, "
            f"status='{self.status}', planned_date={self.planned_date})>"
        )


class IncomeYearSettings(Base):
    """Year-scoped household investment settings used by the income dashboard."""

    __tablename__ = "income_year_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    year = Column(Integer, nullable=False, unique=True, index=True)
    contributions_401k = Column(Float, nullable=False, default=0, server_default="0")
    emergency_fund_balance = Column(
        Float,
        nullable=False,
        default=18000,
        server_default="18000",
    )
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    tax_advantaged_buckets = relationship(
        "IncomeYearTaxAdvantagedBucket",
        back_populates="year_settings",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            "<IncomeYearSettings("
            f"year={self.year}, "
            f"contributions_401k={self.contributions_401k}, "
            f"emergency_fund_balance={self.emergency_fund_balance}"
            ")>"
        )


class IncomeYearTaxAdvantagedBucket(Base):
    """Annual household tax-advantaged bucket stored per planning year."""

    __tablename__ = "income_year_tax_advantaged_buckets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    year_settings_id = Column(
        Integer,
        ForeignKey("income_year_settings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    bucket_type = Column(String(32), nullable=False, index=True)
    annual_amount = Column(Float, nullable=False, default=0, server_default="0")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    year_settings = relationship("IncomeYearSettings", back_populates="tax_advantaged_buckets")

    __table_args__ = (
        UniqueConstraint(
            "year_settings_id",
            "bucket_type",
            name="uq_income_year_tax_advantaged_bucket_type",
        ),
    )

    def __repr__(self) -> str:
        return (
            "<IncomeYearTaxAdvantagedBucket("
            f"year_settings_id={self.year_settings_id}, "
            f"bucket_type='{self.bucket_type}', "
            f"annual_amount={self.annual_amount}"
            ")>"
        )
