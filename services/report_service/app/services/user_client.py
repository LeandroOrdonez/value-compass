import os
import httpx
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class UserServiceClient:
    """Client for interacting with the User Service API"""
    
    def __init__(self, token: Optional[str] = None):
        self.base_url = os.getenv("USER_SERVICE_URL", "http://user-service:8000")
        self.token = token
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)
        
        # Set authorization header if token is provided
        if token:
            self.client.headers.update({"Authorization": f"Bearer {token}"})
    
    async def get_user_profile(self, user_id: int) -> Dict[str, Any]:
        """Get user profile information"""
        response = await self.client.get(f"/users/{user_id}")
        response.raise_for_status()
        return response.json()
    
    async def get_portfolios(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all portfolios for a user"""
        response = await self.client.get(f"/users/{user_id}/portfolio")
        response.raise_for_status()
        return response.json()
    
    async def get_portfolio(self, user_id: int, portfolio_id: int) -> Dict[str, Any]:
        """Get a specific portfolio"""
        response = await self.client.get(f"/users/{user_id}/portfolio/{portfolio_id}")
        response.raise_for_status()
        return response.json()
    
    async def get_portfolio_holdings(self, user_id: int, portfolio_id: int) -> List[Dict[str, Any]]:
        """Get holdings for a portfolio"""
        response = await self.client.get(f"/users/{user_id}/portfolio/{portfolio_id}/holding")
        response.raise_for_status()
        return response.json()
    
    async def get_stock_baskets(self, user_id: int) -> List[Dict[str, Any]]:
        """Get stock baskets for a user"""
        response = await self.client.get(f"/users/{user_id}/customBaskets")
        response.raise_for_status()
        return response.json()
    
    async def get_basket(self, user_id: int, basket_id: int) -> Dict[str, Any]:
        """Get a specific stock basket"""
        response = await self.client.get(f"/users/{user_id}/customBaskets/{basket_id}")
        response.raise_for_status()
        return response.json()
    
    async def get_basket_stocks(self, user_id: int, basket_id: int) -> List[Dict[str, Any]]:
        """Get stocks in a basket"""
        response = await self.client.get(f"/users/{user_id}/customBaskets/{basket_id}/stocks")
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
