import os
import httpx
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class ValuationServiceClient:
    """Client for interacting with the Valuation Service API"""
    
    def __init__(self):
        self.base_url = os.getenv("VALUATION_SERVICE_URL", "http://valuation-service:8000")
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)
    
    async def get_valuation_score(self, ticker: str, rule_id: Optional[int] = None) -> Dict[str, Any]:
        """Get valuation score for a ticker"""
        params = {}
        if rule_id:
            params["rule_id"] = str(rule_id)
            
        response = await self.client.post(f"/valuation/score?ticker={ticker}", params=params)
        response.raise_for_status()
        return response.json()
    
    async def get_valuation_scores_batch(self, tickers: List[str], rule_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get valuation scores for multiple tickers"""
        params = {}
        if rule_id:
            params["rule_id"] = str(rule_id)
            
        response = await self.client.post(f"/valuation/batch", json=tickers, params=params)
        response.raise_for_status()
        return response.json()
    
    async def get_valuation_rules(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get available valuation rules"""
        params = {}
        if user_id:
            params["user_id"] = str(user_id)
            
        response = await self.client.get("/valuation/rules", params=params)
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
