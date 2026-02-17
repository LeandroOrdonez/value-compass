from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List, Any

from app.database.database import get_db
from app.models.models import User, Portfolio, PortfolioHolding, StockBasket, BasketStock

router = APIRouter()


@router.get("/users/{user_id}/portfolio", response_model=List[Dict[str, Any]])
async def get_user_portfolios(user_id: int, db: Session = Depends(get_db)):
    """Internal: Get all portfolios for a user (no auth required)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    portfolios = db.query(Portfolio).filter(Portfolio.user_id == user_id).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        }
        for p in portfolios
    ]


@router.get("/users/{user_id}/portfolio/{portfolio_id}", response_model=Dict[str, Any])
async def get_portfolio(user_id: int, portfolio_id: int, db: Session = Depends(get_db)):
    """Internal: Get a specific portfolio (no auth required)"""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == user_id,
    ).first()

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    return {
        "id": portfolio.id,
        "name": portfolio.name,
        "description": portfolio.description,
        "created_at": portfolio.created_at,
        "updated_at": portfolio.updated_at,
    }


@router.get("/users/{user_id}/portfolio/{portfolio_id}/holding", response_model=List[Dict[str, Any]])
async def get_portfolio_holdings(user_id: int, portfolio_id: int, db: Session = Depends(get_db)):
    """Internal: Get holdings for a portfolio (no auth required)"""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == user_id,
    ).first()

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    holdings = db.query(PortfolioHolding).filter(
        PortfolioHolding.portfolio_id == portfolio_id
    ).all()

    return [
        {
            "id": h.id,
            "ticker": h.ticker,
            "shares": h.shares,
            "cost_basis": h.cost_basis,
            "purchase_date": h.purchase_date,
            "notes": h.notes,
        }
        for h in holdings
    ]


@router.get("/users/{user_id}/customBaskets", response_model=List[Dict[str, Any]])
async def get_user_baskets(user_id: int, db: Session = Depends(get_db)):
    """Internal: Get stock baskets for a user (no auth required)"""
    baskets = db.query(StockBasket).filter(
        (StockBasket.created_by == user_id) | (StockBasket.is_public == True)
    ).all()

    return [
        {
            "id": b.id,
            "name": b.name,
            "description": b.description,
            "is_public": b.is_public,
            "created_by": b.created_by,
            "created_at": b.created_at,
            "updated_at": b.updated_at,
        }
        for b in baskets
    ]


@router.get("/users/{user_id}/customBaskets/{basket_id}", response_model=Dict[str, Any])
async def get_basket(user_id: int, basket_id: int, db: Session = Depends(get_db)):
    """Internal: Get a specific stock basket (no auth required)"""
    basket = db.query(StockBasket).filter(StockBasket.id == basket_id).first()

    if not basket:
        raise HTTPException(status_code=404, detail="Basket not found")

    if not basket.is_public and basket.created_by != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "id": basket.id,
        "name": basket.name,
        "description": basket.description,
        "is_public": basket.is_public,
        "created_by": basket.created_by,
        "created_at": basket.created_at,
        "updated_at": basket.updated_at,
    }


@router.get("/users/{user_id}/customBaskets/{basket_id}/stocks", response_model=List[Dict[str, Any]])
async def get_basket_stocks(user_id: int, basket_id: int, db: Session = Depends(get_db)):
    """Internal: Get stocks in a basket (no auth required)"""
    basket = db.query(StockBasket).filter(StockBasket.id == basket_id).first()

    if not basket:
        raise HTTPException(status_code=404, detail="Basket not found")

    if not basket.is_public and basket.created_by != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    stocks = db.query(BasketStock).filter(BasketStock.basket_id == basket_id).all()

    return [
        {
            "id": s.id,
            "ticker": s.ticker,
            "weight": s.weight,
        }
        for s in stocks
    ]
