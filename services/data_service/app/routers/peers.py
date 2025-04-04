from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.adapters.factory import get_data_source

router = APIRouter()

@router.get("/{industry}/peers", response_model=List[Dict[str, Any]])
async def get_industry_peers(industry: str, db: Session = Depends(get_db)):
    """Get peer companies for a specific industry"""
    try:
        # Get data from the adapter
        data_source = get_data_source()
        data = await data_source.get_peer_companies(industry)
        
        return data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve peer companies: {str(e)}")

@router.get("/search", response_model=List[Dict[str, Any]])
async def search_stocks(query: str, db: Session = Depends(get_db)):
    """Search for stocks by name or ticker"""
    try:
        # Get data from the adapter
        data_source = get_data_source()
        data = await data_source.search_stocks(query)
        
        return data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search stocks: {str(e)}")
        
@router.get("/trending", response_model=List[Dict[str, Any]])
async def get_trending_stocks(count: Optional[int] = Query(5, description="Number of trending stocks to return"), 
                             db: Session = Depends(get_db)):
    """Get trending stocks from Yahoo Finance"""
    try:
        # Get data from the adapter
        data_source = get_data_source()
        data = await data_source.get_trending_stocks(count)
        
        return data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve trending stocks: {str(e)}")
