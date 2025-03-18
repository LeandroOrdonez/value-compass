from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import date

from app.database.database import Base

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, unique=True, index=True)
    name = Column(String)
    sector = Column(String)
    industry = Column(String)
    country = Column(String)
    last_updated = Column(Date, default=date.today)

    # Relationships
    historical_data = relationship("HistoricalData", back_populates="stock")
    financial_data = relationship("FinancialData", back_populates="stock")

class HistoricalData(Base):
    __tablename__ = "historical_data"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    date = Column(Date, index=True)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Integer)
    adjusted_close = Column(Float)

    # Relationships
    stock = relationship("Stock", back_populates="historical_data")

class FinancialData(Base):
    __tablename__ = "financial_data"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    date = Column(Date, index=True)
    pe_ratio = Column(Float)
    pb_ratio = Column(Float)
    dividend_yield = Column(Float)
    market_cap = Column(Float)
    eps = Column(Float)
    revenue = Column(Float)
    debt_to_equity = Column(Float)
    profit_margin = Column(Float)
    roe = Column(Float)
    current_ratio = Column(Float)
    
    # Relationships
    stock = relationship("Stock", back_populates="financial_data")
