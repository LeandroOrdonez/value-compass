from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.adapters.factory import get_data_source
from app.models.models import Stock, HistoricalData

router = APIRouter()

@router.get("/{ticker}/historical", response_model=List[Dict[str, Any]])
async def get_historical_data(
    ticker: str,
    start_date: Optional[date] = Query(None, description="Start date for historical data"),
    end_date: Optional[date] = Query(None, description="End date for historical data"),
    db: Session = Depends(get_db)
):
    """Get historical price data for a specific ticker"""
    ticker = ticker.upper()
    
    try:
        # Get data from the adapter
        data_source = get_data_source()
        data = await data_source.get_historical_data(ticker, start_date, end_date)
        
        # Check if we have data for this stock in the database
        stock = db.query(Stock).filter(Stock.ticker == ticker).first()
        
        # If stock doesn't exist, create it
        if not stock:
            # Get financial data to get company details
            financial_data = await data_source.get_financial_data(ticker)
            
            stock = Stock(
                ticker=ticker,
                name=financial_data.get("name", ""),
                sector=financial_data.get("sector", ""),
                industry=financial_data.get("industry", ""),
                country=financial_data.get("country", ""),
                last_updated=datetime.now().date()
            )
            db.add(stock)
            db.commit()
            db.refresh(stock)
        
        # Store historical data in database
        for item in data:
            # Check if we already have this data point
            existing = db.query(HistoricalData).filter(
                HistoricalData.stock_id == stock.id,
                HistoricalData.date == item["date"]
            ).first()
            
            if not existing:
                hist_data = HistoricalData(
                    stock_id=stock.id,
                    date=item["date"],
                    open=item["open"],
                    high=item["high"],
                    low=item["low"],
                    close=item["close"],
                    volume=item["volume"],
                    adjusted_close=item["adjusted_close"]
                )
                db.add(hist_data)
        
        db.commit()
        
        return data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve historical data: {str(e)}")
