from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.database.database import get_db
from app.models.models import User, Portfolio, PortfolioHolding
from app.auth.auth import get_current_active_user

router = APIRouter()

# Pydantic models for validation
class PortfolioCreate(BaseModel):
    name: str
    description: Optional[str] = None

class PortfolioResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class PortfolioHoldingCreate(BaseModel):
    ticker: str
    shares: float
    cost_basis: Optional[float] = None
    purchase_date: Optional[datetime] = None
    notes: Optional[str] = None

class PortfolioHoldingResponse(BaseModel):
    id: int
    ticker: str
    shares: float
    cost_basis: Optional[float]
    purchase_date: Optional[datetime]
    notes: Optional[str]
    
    class Config:
        orm_mode = True

class PortfolioHoldingUpdate(BaseModel):
    shares: Optional[float] = None
    cost_basis: Optional[float] = None
    purchase_date: Optional[datetime] = None
    notes: Optional[str] = None

@router.post("/portfolio", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio(portfolio_data: PortfolioCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Create a new portfolio for the current user"""
    # Check if portfolio name already exists for this user
    existing_portfolio = db.query(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Portfolio.name == portfolio_data.name
    ).first()
    
    if existing_portfolio:
        raise HTTPException(status_code=400, detail="Portfolio with this name already exists")
    
    # Create new portfolio
    new_portfolio = Portfolio(
        user_id=current_user.id,
        name=portfolio_data.name,
        description=portfolio_data.description
    )
    
    db.add(new_portfolio)
    db.commit()
    db.refresh(new_portfolio)
    
    return new_portfolio

@router.get("/portfolio", response_model=List[PortfolioResponse])
async def get_user_portfolios(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get all portfolios for the current user"""
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    return portfolios

@router.get("/portfolio/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(portfolio_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get a specific portfolio by ID"""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    return portfolio

@router.put("/portfolio/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(portfolio_id: int, portfolio_data: PortfolioUpdate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Update a portfolio"""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Check if new name is already taken by another portfolio
    if portfolio_data.name and portfolio_data.name != portfolio.name:
        existing_portfolio = db.query(Portfolio).filter(
            Portfolio.user_id == current_user.id,
            Portfolio.name == portfolio_data.name,
            Portfolio.id != portfolio_id
        ).first()
        
        if existing_portfolio:
            raise HTTPException(status_code=400, detail="Portfolio with this name already exists")
        
        portfolio.name = portfolio_data.name
    
    # Update description if provided
    if portfolio_data.description is not None:
        portfolio.description = portfolio_data.description
    
    db.commit()
    db.refresh(portfolio)
    
    return portfolio

@router.delete("/portfolio/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(portfolio_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Delete a portfolio"""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Delete the portfolio
    db.delete(portfolio)
    db.commit()
    
    return None

# Portfolio holdings endpoints
@router.post("/portfolio/{portfolio_id}/holding", response_model=PortfolioHoldingResponse, status_code=status.HTTP_201_CREATED)
async def add_portfolio_holding(portfolio_id: int, holding_data: PortfolioHoldingCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Add a new holding to a portfolio"""
    # Check if portfolio exists and belongs to user
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Check if ticker already exists in this portfolio
    existing_holding = db.query(PortfolioHolding).filter(
        PortfolioHolding.portfolio_id == portfolio_id,
        PortfolioHolding.ticker == holding_data.ticker
    ).first()
    
    if existing_holding:
        # Update existing holding instead of creating a new one
        existing_holding.shares += holding_data.shares
        
        # Update cost basis if provided (weighted average)
        if holding_data.cost_basis is not None:
            if existing_holding.cost_basis is not None:
                # Calculate weighted average cost basis
                existing_shares = existing_holding.shares - holding_data.shares
                existing_cost = existing_holding.cost_basis * existing_shares
                new_cost = holding_data.cost_basis * holding_data.shares
                existing_holding.cost_basis = (existing_cost + new_cost) / existing_holding.shares
            else:
                existing_holding.cost_basis = holding_data.cost_basis
        
        # Update notes if provided
        if holding_data.notes:
            if existing_holding.notes:
                existing_holding.notes += f"\n{holding_data.notes}"
            else:
                existing_holding.notes = holding_data.notes
        
        db.commit()
        db.refresh(existing_holding)
        
        return existing_holding
    
    # Create new holding
    new_holding = PortfolioHolding(
        portfolio_id=portfolio_id,
        ticker=holding_data.ticker,
        shares=holding_data.shares,
        cost_basis=holding_data.cost_basis,
        purchase_date=holding_data.purchase_date or datetime.now(),
        notes=holding_data.notes
    )
    
    db.add(new_holding)
    db.commit()
    db.refresh(new_holding)
    
    return new_holding

@router.get("/portfolio/{portfolio_id}/holding", response_model=List[PortfolioHoldingResponse])
async def get_portfolio_holdings(portfolio_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get all holdings for a portfolio"""
    # Check if portfolio exists and belongs to user
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.portfolio_id == portfolio_id).all()
    return holdings

@router.put("/portfolio/{portfolio_id}/holding/{holding_id}", response_model=PortfolioHoldingResponse)
async def update_portfolio_holding(portfolio_id: int, holding_id: int, holding_data: PortfolioHoldingUpdate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Update a portfolio holding"""
    # Check if portfolio exists and belongs to user
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Check if holding exists
    holding = db.query(PortfolioHolding).filter(
        PortfolioHolding.id == holding_id,
        PortfolioHolding.portfolio_id == portfolio_id
    ).first()
    
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    # Update fields if provided
    if holding_data.shares is not None:
        holding.shares = holding_data.shares
    
    if holding_data.cost_basis is not None:
        holding.cost_basis = holding_data.cost_basis
    
    if holding_data.purchase_date is not None:
        holding.purchase_date = holding_data.purchase_date
    
    if holding_data.notes is not None:
        holding.notes = holding_data.notes
    
    db.commit()
    db.refresh(holding)
    
    return holding

@router.delete("/portfolio/{portfolio_id}/holding/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio_holding(portfolio_id: int, holding_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Delete a portfolio holding"""
    # Check if portfolio exists and belongs to user
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Check if holding exists
    holding = db.query(PortfolioHolding).filter(
        PortfolioHolding.id == holding_id,
        PortfolioHolding.portfolio_id == portfolio_id
    ).first()
    
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    # Delete the holding
    db.delete(holding)
    db.commit()
    
    return None
