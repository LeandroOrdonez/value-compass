from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP

from app.database.database import Base

class ValuationRule(Base):
    __tablename__ = "valuation_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    is_default = Column(Boolean, default=False)
    user_id = Column(Integer, nullable=True)  # If null, it's a system rule
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Rule definitions stored as JSON
    rule_config = Column(JSON)
    
    # Relationships
    valuation_scores = relationship("ValuationScore", back_populates="rule")

class ValuationScore(Base):
    __tablename__ = "valuation_scores"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    rule_id = Column(Integer, ForeignKey("valuation_rules.id"))
    score = Column(Float)  # Overall score
    score_components = Column(JSON)  # Individual score components
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    rule = relationship("ValuationRule", back_populates="valuation_scores")
