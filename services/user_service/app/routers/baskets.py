from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.database.database import get_db
from app.models.models import User, StockBasket, BasketStock
from app.auth.auth import get_current_active_user

router = APIRouter()

# Pydantic models for validation
class StockBasketCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    stocks: List[str] = []  # List of ticker symbols

class StockBasketResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_public: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class StockBasketUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class BasketStockCreate(BaseModel):
    ticker: str
    weight: Optional[float] = 1.0

class BasketStockResponse(BaseModel):
    id: int
    ticker: str
    weight: float
    
    class Config:
        orm_mode = True

class BasketStockUpdate(BaseModel):
    weight: float

@router.post("/customBaskets", response_model=StockBasketResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_basket(basket_data: StockBasketCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Create a new custom stock basket"""
    # Check if basket name already exists for this user
    existing_basket = db.query(StockBasket).filter(
        StockBasket.name == basket_data.name,
        StockBasket.created_by == current_user.id
    ).first()
    
    if existing_basket:
        raise HTTPException(status_code=400, detail="Basket with this name already exists")
    
    # Create new basket
    new_basket = StockBasket(
        name=basket_data.name,
        description=basket_data.description,
        is_public=basket_data.is_public,
        created_by=current_user.id
    )
    
    db.add(new_basket)
    db.commit()
    db.refresh(new_basket)
    
    # Add stocks to basket
    for ticker in basket_data.stocks:
        basket_stock = BasketStock(
            basket_id=new_basket.id,
            ticker=ticker,
            weight=1.0  # Default equal weighting
        )
        db.add(basket_stock)
    
    # Add the basket to user's baskets
    current_user.stock_baskets.append(new_basket)
    
    db.commit()
    db.refresh(new_basket)
    
    return new_basket

@router.get("/customBaskets", response_model=List[StockBasketResponse])
async def get_user_baskets(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get all stock baskets for the current user"""
    # Get user's custom baskets and public baskets
    baskets = db.query(StockBasket).filter(
        (StockBasket.created_by == current_user.id) | 
        (StockBasket.is_public == True)
    ).all()
    
    return baskets

@router.get("/customBaskets/{basket_id}", response_model=StockBasketResponse)
async def get_stock_basket(basket_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get a specific stock basket by ID"""
    basket = db.query(StockBasket).filter(StockBasket.id == basket_id).first()
    
    if not basket:
        raise HTTPException(status_code=404, detail="Basket not found")
    
    # Check if user has access to this basket
    if not basket.is_public and basket.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this basket")
    
    return basket

@router.put("/customBaskets/{basket_id}", response_model=StockBasketResponse)
async def update_stock_basket(basket_id: int, basket_data: StockBasketUpdate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Update a stock basket"""
    basket = db.query(StockBasket).filter(StockBasket.id == basket_id).first()
    
    if not basket:
        raise HTTPException(status_code=404, detail="Basket not found")
    
    # Check if user owns this basket
    if basket.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to update this basket")
    
    # Check if new name is already taken by another basket
    if basket_data.name and basket_data.name != basket.name:
        existing_basket = db.query(StockBasket).filter(
            StockBasket.name == basket_data.name,
            StockBasket.created_by == current_user.id,
            StockBasket.id != basket_id
        ).first()
        
        if existing_basket:
            raise HTTPException(status_code=400, detail="Basket with this name already exists")
        
        basket.name = basket_data.name
    
    # Update other fields if provided
    if basket_data.description is not None:
        basket.description = basket_data.description
    
    if basket_data.is_public is not None:
        basket.is_public = basket_data.is_public
    
    db.commit()
    db.refresh(basket)
    
    return basket

@router.delete("/customBaskets/{basket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stock_basket(basket_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Delete a stock basket"""
    basket = db.query(StockBasket).filter(StockBasket.id == basket_id).first()
    
    if not basket:
        raise HTTPException(status_code=404, detail="Basket not found")
    
    # Check if user owns this basket
    if basket.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this basket")
    
    # Delete the basket
    db.delete(basket)
    db.commit()
    
    return None

# Basket stocks endpoints
@router.get("/customBaskets/{basket_id}/stocks", response_model=List[BasketStockResponse])
async def get_basket_stocks(basket_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get all stocks in a basket"""
    basket = db.query(StockBasket).filter(StockBasket.id == basket_id).first()
    
    if not basket:
        raise HTTPException(status_code=404, detail="Basket not found")
    
    # Check if user has access to this basket
    if not basket.is_public and basket.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this basket")
    
    stocks = db.query(BasketStock).filter(BasketStock.basket_id == basket_id).all()
    return stocks

@router.post("/customBaskets/{basket_id}/stocks", response_model=BasketStockResponse, status_code=status.HTTP_201_CREATED)
async def add_stock_to_basket(basket_id: int, stock_data: BasketStockCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Add a stock to a basket"""
    basket = db.query(StockBasket).filter(StockBasket.id == basket_id).first()
    
    if not basket:
        raise HTTPException(status_code=404, detail="Basket not found")
    
    # Check if user owns this basket
    if basket.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to modify this basket")
    
    # Check if stock already exists in this basket
    existing_stock = db.query(BasketStock).filter(
        BasketStock.basket_id == basket_id,
        BasketStock.ticker == stock_data.ticker
    ).first()
    
    if existing_stock:
        raise HTTPException(status_code=400, detail=f"Stock {stock_data.ticker} is already in this basket")
    
    # Add stock to basket
    new_stock = BasketStock(
        basket_id=basket_id,
        ticker=stock_data.ticker,
        weight=stock_data.weight
    )
    
    db.add(new_stock)
    db.commit()
    db.refresh(new_stock)
    
    return new_stock

@router.put("/customBaskets/{basket_id}/stocks/{stock_id}", response_model=BasketStockResponse)
async def update_basket_stock(basket_id: int, stock_id: int, stock_data: BasketStockUpdate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Update a stock in a basket"""
    basket = db.query(StockBasket).filter(StockBasket.id == basket_id).first()
    
    if not basket:
        raise HTTPException(status_code=404, detail="Basket not found")
    
    # Check if user owns this basket
    if basket.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to modify this basket")
    
    # Check if stock exists
    stock = db.query(BasketStock).filter(
        BasketStock.id == stock_id,
        BasketStock.basket_id == basket_id
    ).first()
    
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found in this basket")
    
    # Update stock weight
    stock.weight = stock_data.weight
    
    db.commit()
    db.refresh(stock)
    
    return stock

@router.delete("/customBaskets/{basket_id}/stocks/{stock_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_stock_from_basket(basket_id: int, stock_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Remove a stock from a basket"""
    basket = db.query(StockBasket).filter(StockBasket.id == basket_id).first()
    
    if not basket:
        raise HTTPException(status_code=404, detail="Basket not found")
    
    # Check if user owns this basket
    if basket.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to modify this basket")
    
    # Check if stock exists
    stock = db.query(BasketStock).filter(
        BasketStock.id == stock_id,
        BasketStock.basket_id == basket_id
    ).first()
    
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found in this basket")
    
    # Remove stock from basket
    db.delete(stock)
    db.commit()
    
    return None
