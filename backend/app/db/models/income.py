"""Income database models."""

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.app.db.database import Base


class Income(Base):
    """Income entry model - represents an income stream."""

    __tablename__ = "incomes"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Core fields
    stream = Column(String(200), nullable=False, comment="Income stream name (e.g., 'Marty Salary')")
    type = Column(String(20), nullable=False, index=True, comment="'regular' or 'bonus'")
    frequency = Column(String(20), nullable=True, comment="'annual', 'quarterly', 'monthly', 'one-time' (for bonuses)")
    received_date = Column(Date, nullable=True, comment="Actual received date (for bonuses)")

    # Timestamps
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    effective_ranges = relationship(
        "IncomeEffectiveRange",
        back_populates="income",
        cascade="all, delete-orphan",
        order_by="IncomeEffectiveRange.start_date.desc()",
    )

    # Indexes
    __table_args__ = (Index("ix_incomes_type_stream", "type", "stream"),)

    def __repr__(self) -> str:
        return f"<Income(id={self.id}, stream='{self.stream}', type='{self.type}')>"


class IncomeEffectiveRange(Base):
    """Income effective date range - tracks salary changes over time."""

    __tablename__ = "income_effective_ranges"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign key
    income_id = Column(Integer, ForeignKey("incomes.id", ondelete="CASCADE"), nullable=False, index=True)

    # Date range
    start_date = Column(Date, nullable=False, comment="When this income amount becomes effective")
    end_date = Column(Date, nullable=True, comment="When this income amount ends (null = ongoing)")

    # Amounts (per pay period, NOT annualized)
    gross_amount = Column(Float, nullable=False, comment="Gross income per pay period")
    net_amount = Column(Float, nullable=False, comment="Net income per pay period")
    periods = Column(Integer, nullable=False, comment="Number of pay periods per year (26, 24, 52, 12, etc.)")

    # Relationships
    income = relationship("Income", back_populates="effective_ranges")
    deductions = relationship(
        "IncomeDeduction",
        back_populates="effective_range",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # Indexes
    __table_args__ = (Index("ix_income_ranges_income_dates", "income_id", "start_date", "end_date"),)

    def __repr__(self) -> str:
        return f"<IncomeEffectiveRange(id={self.id}, income_id={self.income_id}, start={self.start_date}, end={self.end_date})>"


class IncomeDeduction(Base):
    """Income deduction breakdown - detailed tax and deduction amounts."""

    __tablename__ = "income_deductions"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign key (one-to-one with effective range)
    income_effective_range_id = Column(
        Integer, ForeignKey("income_effective_ranges.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )

    # Deduction amounts (per pay period)
    federal_tax = Column(Float, nullable=True, comment="Federal tax per pay period")
    state_tax = Column(Float, nullable=True, comment="State tax per pay period")
    fica = Column(Float, nullable=True, comment="FICA (Social Security + Medicare) per pay period")
    retirement = Column(Float, nullable=True, comment="401k/retirement contribution per pay period")
    health_insurance = Column(Float, nullable=True, comment="Health insurance premium per pay period")
    other = Column(Float, nullable=True, comment="Other deductions per pay period")

    # Relationship
    effective_range = relationship("IncomeEffectiveRange", back_populates="deductions")

    def __repr__(self) -> str:
        return f"<IncomeDeduction(id={self.id}, range_id={self.income_effective_range_id})>"
