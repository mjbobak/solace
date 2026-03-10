"""CategorizationRule SQLAlchemy ORM model."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.app.db.database import Base


class CategorizationRule(Base):
    """
    Categorization rule for auto-assigning budget_id to transactions.

    Matches transaction descriptions against patterns to automatically
    assign transactions to budget line items during CSV import.
    Higher priority rules are checked first; the first match wins.
    """

    __tablename__ = "categorization_rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    pattern = Column(
        String(255),
        nullable=False,
        comment="Text pattern to match against transaction description (case-insensitive)",
    )
    pattern_type = Column(
        String(20),
        nullable=False,
        default="contains",
        comment="Match type: contains, exact, or startswith",
    )
    budget_id = Column(
        Integer,
        ForeignKey("budgets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Budget line item to assign when pattern matches",
    )
    priority = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Higher priority rules are checked first",
    )
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        comment="When this rule was created",
    )

    budget = relationship("Budget")

    def __repr__(self) -> str:
        return f"<CategorizationRule(id={self.id}, pattern='{self.pattern}', type='{self.pattern_type}')>"
