import yfinance as yf
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta

from app.adapters.data_source import DataSource

class YahooFinanceAdapter(DataSource):
    """Yahoo Finance implementation of the DataSource interface"""

    async def get_historical_data(self, ticker: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        # Default to last year if no dates provided
        if not start_date:
            start_date = (datetime.now() - timedelta(days=365)).date()
        if not end_date:
            end_date = datetime.now().date()

        # Get data from Yahoo Finance
        stock = yf.Ticker(ticker)
        hist = stock.history(start=start_date, end=end_date)

        # Convert to list of dictionaries
        result = []
        for index, row in hist.iterrows():
            result.append({
                "date": index.date(),
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": int(row["Volume"]),
                "adjusted_close": float(row["Close"])  # Yahoo already adjusts Close
            })

        return result

    async def get_financial_data(self, ticker: str) -> Dict[str, Any]:
        stock = yf.Ticker(ticker)

        # Get basic info
        info = stock.info

        # Create financial data dictionary
        financial_data = {
            "ticker": ticker,
            "name": info.get("shortName", ""),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "pe_ratio": info.get("trailingPE", None),
            "pb_ratio": info.get("priceToBook", None),
            "dividend_yield": info.get("dividendYield", None),
            "market_cap": info.get("marketCap", None),
            "eps": info.get("trailingEps", None),
            "revenue": info.get("totalRevenue", None),
            "profit_margin": info.get("profitMargins", None),
            "debt_to_equity": info.get("debtToEquity", None),
            "roe": info.get("returnOnEquity", None),
            "current_ratio": info.get("currentRatio", None),
            "date": datetime.now().date()
        }

        return financial_data

    async def get_peer_companies(self, industry: str) -> List[Dict[str, Any]]:
        # In a real implementation, we would search for companies in the same industry
        # For demonstration, we'll return a dummy list for specific industries
        industry_peers = {
            "Technology": ["AAPL", "MSFT", "GOOG", "META", "AMZN"],
            "Financial Services": ["JPM", "BAC", "WFC", "C", "GS"],
            "Healthcare": ["JNJ", "PFE", "MRK", "ABBV", "UNH"],
            "Consumer Cyclical": ["AMZN", "HD", "MCD", "NKE", "SBUX"],
            "Energy": ["XOM", "CVX", "COP", "BP", "SHEL"]
        }

        peers = industry_peers.get(industry, [])
        result = []

        # Get basic info for each peer
        for peer_ticker in peers:
            try:
                stock = yf.Ticker(peer_ticker)
                info = stock.info
                result.append({
                    "ticker": peer_ticker,
                    "name": info.get("shortName", ""),
                    "sector": info.get("sector", ""),
                    "industry": info.get("industry", ""),
                    "market_cap": info.get("marketCap", None)
                })
            except Exception as e:
                # Skip failed lookups
                continue

        return result

    async def search_stocks(self, query: str) -> List[Dict[str, Any]]:
        # In a real implementation, we would use a search API
        # For demonstration, we'll return a dummy list for specific queries
        common_tickers = {
            "apple": "AAPL",
            "microsoft": "MSFT",
            "google": "GOOG",
            "amazon": "AMZN",
            "facebook": "META",
            "netflix": "NFLX",
            "tesla": "TSLA"
        }

        query = query.lower()
        result = []

        # Check if query matches any common company
        for company, ticker in common_tickers.items():
            if query in company or query in ticker.lower():
                try:
                    stock = yf.Ticker(ticker)
                    info = stock.info
                    result.append({
                        "ticker": ticker,
                        "name": info.get("shortName", ""),
                        "sector": info.get("sector", ""),
                        "industry": info.get("industry", ""),
                    })
                except Exception as e:
                    # Skip failed lookups
                    continue

        return result
