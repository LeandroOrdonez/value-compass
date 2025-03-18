import os
import httpx
from typing import Dict, List, Any, Optional
from datetime import date, datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

class DataServiceClient:
    """Client for interacting with the Data Service API"""
    
    def __init__(self):
        self.base_url = os.getenv("DATA_SERVICE_URL", "http://data-service:8000")
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)
    
    async def get_historical_data(self, ticker: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """Get historical price data for a ticker"""
        params = {}
        if start_date:
            params["start_date"] = start_date.isoformat()
        if end_date:
            params["end_date"] = end_date.isoformat()
            
        response = await self.client.get(f"/stocks/{ticker}/historical", params=params)
        response.raise_for_status()
        return response.json()
    
    async def get_financial_data(self, ticker: str) -> Dict[str, Any]:
        """Get fundamental financial data for a ticker"""
        response = await self.client.get(f"/stocks/{ticker}/financials")
        response.raise_for_status()
        return response.json()
    
    async def get_peer_companies(self, industry: str) -> List[Dict[str, Any]]:
        """Get peer companies for a given industry"""
        response = await self.client.get(f"/industry/{industry}/peers")
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
