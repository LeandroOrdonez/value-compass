from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP

from app.database.database import Base

user_basket_association = Table(
    'user_basket_association',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('basket_id', Integer, ForeignKey('stock_baskets.id'))
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    portfolios = relationship("Portfolio", back_populates="user")
    stock_baskets = relationship("StockBasket", secondary=user_basket_association, back_populates="users")

class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    description = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="portfolios")
    holdings = relationship("PortfolioHolding", back_populates="portfolio")

class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    ticker = Column(String, index=True)
    shares = Column(Float)
    cost_basis = Column(Float, nullable=True)  # Cost per share
    purchase_date = Column(DateTime, nullable=True)  # Date of purchase
    notes = Column(String, nullable=True)
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="holdings")

class StockBasket(Base):
    __tablename__ = "stock_baskets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)  # If true, any user can see and use it
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for system baskets
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    users = relationship("User", secondary=user_basket_association, back_populates="stock_baskets")
    stocks = relationship("BasketStock", back_populates="basket")

class BasketStock(Base):
    __tablename__ = "basket_stocks"

    id = Column(Integer, primary_key=True, index=True)
    basket_id = Column(Integer, ForeignKey("stock_baskets.id"))
    ticker = Column(String, index=True)
    weight = Column(Float, default=1.0)  # Used for weighted baskets
    
    # Relationships
    basket = relationship("StockBasket", back_populates="stocks")
