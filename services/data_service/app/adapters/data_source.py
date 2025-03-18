from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import date

class DataSource(ABC):
    """Abstract base class for stock data sources"""

    @abstractmethod
    async def get_historical_data(self, ticker: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """Get historical price data for a ticker"""
        pass

    @abstractmethod
    async def get_financial_data(self, ticker: str) -> Dict[str, Any]:
        """Get fundamental financial data for a ticker"""
        pass

    @abstractmethod
    async def get_peer_companies(self, industry: str) -> List[Dict[str, Any]]:
        """Get peer companies for a given industry"""
        pass

    @abstractmethod
    async def search_stocks(self, query: str) -> List[Dict[str, Any]]:
        """Search for stocks by name or ticker"""
        pass
