from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.database import get_db
from app.adapters.factory import get_data_source
from app.models.models import Stock, FinancialData

router = APIRouter()

@router.get("/{ticker}/financials", response_model=Dict[str, Any])
async def get_financial_data(ticker: str, db: Session = Depends(get_db)):
    """Get financial data for a specific ticker"""
    ticker = ticker.upper()
    
    try:
        # Get data from the adapter
        data_source = get_data_source()
        data = await data_source.get_financial_data(ticker)
        
        # Check if we have data for this stock in the database
        stock = db.query(Stock).filter(Stock.ticker == ticker).first()
        
        # If stock doesn't exist, create it
        if not stock:
            stock = Stock(
                ticker=ticker,
                name=data.get("name", ""),
                sector=data.get("sector", ""),
                industry=data.get("industry", ""),
                country=data.get("country", ""),
                last_updated=datetime.now().date()
            )
            db.add(stock)
            db.commit()
            db.refresh(stock)
        else:
            # Update stock information
            stock.name = data.get("name", stock.name)
            stock.sector = data.get("sector", stock.sector)
            stock.industry = data.get("industry", stock.industry)
            stock.last_updated = datetime.now().date()
            db.commit()
        
        # Store financial data in database
        today = datetime.now().date()
        
        # Check if we already have financial data for today
        existing = db.query(FinancialData).filter(
            FinancialData.stock_id == stock.id,
            FinancialData.date == today
        ).first()
        
        if not existing:
            financial_data = FinancialData(
                stock_id=stock.id,
                date=today,
                pe_ratio=data.get("pe_ratio"),
                pb_ratio=data.get("pb_ratio"),
                dividend_yield=data.get("dividend_yield"),
                market_cap=data.get("market_cap"),
                eps=data.get("eps"),
                revenue=data.get("revenue"),
                debt_to_equity=data.get("debt_to_equity"),
                profit_margin=data.get("profit_margin"),
                roe=data.get("roe"),
                current_ratio=data.get("current_ratio")
            )
            db.add(financial_data)
            db.commit()
        
        return data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve financial data: {str(e)}")
