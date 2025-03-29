import yfinance as yf
import pandas as pd
import yahooquery as yq
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
        """
        Search for stocks based on a query string.
        Uses yfinance search capabilities to find relevant stocks.
        
        Args:
            query: Search term (company name, ticker, or sector)
            
        Returns:
            List of dictionaries containing stock information
        """
        result = []
        
        # First, try direct ticker lookup if query looks like a ticker
        if len(query) <= 5 and query.upper() == query:
            print(f"Direct ticker lookup for {query}")
            try:
                stock = yf.Ticker(query)
                info = stock.info
                if info and "symbol" in info:
                    result.append({
                        "ticker": info.get("symbol", query),
                        "name": info.get("shortName", ""),
                        "sector": info.get("sector", ""),
                        "industry": info.get("industry", ""),
                        "market_cap": info.get("marketCap", None),
                        "price": info.get("currentPrice", None),
                        "currency": info.get("currency", "USD"),
                        "exchange": info.get("exchange", ""),
                        "country": info.get("country", ""),
                        "logo_url": info.get("logo_url", ""),
                        "website": info.get("website", ""),
                        "pe_ratio": info.get("trailingPE", None),
                        "dividend_yield": info.get("dividendYield", None),
                        "52week_high": info.get("fiftyTwoWeekHigh", None),
                        "52week_low": info.get("fiftyTwoWeekLow", None)
                    })
            except Exception as e:
                # Not a valid ticker, continue with search
                pass
                
        # Direct search didn't yield results, try using Yahoo Finance search
        if not result:
            # Common sectors for categorization
            sectors = ["Technology", "Healthcare", "Financial Services", "Consumer Cyclical", 
                       "Communication Services", "Industrial", "Energy", "Basic Materials", 
                       "Consumer Defensive", "Real Estate", "Utilities"]
            
            # Common large cap stocks by sector
            sector_stocks = {
                "Technology": ["AAPL", "MSFT", "NVDA", "AVGO", "ORCL"],
                "Healthcare": ["JNJ", "LLY", "PFE", "MRK", "ABBV"],
                "Financial Services": ["JPM", "BAC", "WFC", "GS", "MS"],
                "Consumer Cyclical": ["AMZN", "TSLA", "HD", "MCD", "NKE"],
                "Communication Services": ["GOOG", "META", "DIS", "CMCSA", "NFLX"],
                "Industrial": ["UPS", "HON", "CAT", "DE", "BA"],
                "Energy": ["XOM", "CVX", "COP", "SLB", "EOG"],
                "Basic Materials": ["LIN", "APD", "DD", "FCX", "NEM"],
                "Consumer Defensive": ["PG", "KO", "PEP", "WMT", "COST"],
                "Real Estate": ["AMT", "PLD", "CCI", "PSA", "EQIX"],
                "Utilities": ["NEE", "DUK", "SO", "AEP", "XEL"]
            }
            
            # Check if query is a sector
            query_lower = query.lower()
            matched_sector = None
            for sector in sectors:
                if query_lower in sector.lower():
                    matched_sector = sector
                    break
            
            # If sector match, return top stocks in that sector
            if matched_sector and matched_sector in sector_stocks:
                for ticker in sector_stocks[matched_sector]:
                    try:
                        stock = yf.Ticker(ticker)
                        info = stock.info
                        if info and "symbol" in info:
                            result.append({
                                "ticker": info.get("symbol", ticker),
                                "name": info.get("shortName", ""),
                                "sector": info.get("sector", matched_sector),
                                "industry": info.get("industry", ""),
                                "market_cap": info.get("marketCap", None),
                                "price": info.get("currentPrice", None),
                                "pe_ratio": info.get("trailingPE", None),
                                "dividend_yield": info.get("dividendYield", None)
                            })
                    except Exception as e:
                        continue
            
            # Otherwise search for company name or partial ticker match
            else:
                # Extended list of common companies
                common_companies = {
                    "apple": "AAPL", "microsoft": "MSFT", "google": "GOOG", "alphabet": "GOOGL",
                    "amazon": "AMZN", "meta": "META", "facebook": "META", "netflix": "NFLX",
                    "tesla": "TSLA", "nvidia": "NVDA", "intel": "INTC", "amd": "AMD",
                    "coca-cola": "KO", "pepsi": "PEP", "johnson": "JNJ", "jpmorgan": "JPM",
                    "exxon": "XOM", "chevron": "CVX", "walmart": "WMT", "target": "TGT",
                    "disney": "DIS", "nike": "NKE", "mcdonalds": "MCD", "starbucks": "SBUX",
                    "boeing": "BA", "ge": "GE", "3m": "MMM", "ibm": "IBM", "oracle": "ORCL",
                    "cisco": "CSCO", "verizon": "VZ", "att": "T", "pfizer": "PFE", "merck": "MRK"
                }
                
                for company, ticker in common_companies.items():
                    if query_lower in company or query_lower in ticker.lower():
                        try:
                            stock = yf.Ticker(ticker)
                            info = stock.info
                            if info and "symbol" in info:
                                result.append({
                                    "ticker": info.get("symbol", ticker),
                                    "name": info.get("shortName", ""),
                                    "sector": info.get("sector", ""),
                                    "industry": info.get("industry", ""),
                                    "market_cap": info.get("marketCap", None),
                                    "price": info.get("currentPrice", None),
                                    "currency": info.get("currency", "USD"),
                                    "pe_ratio": info.get("trailingPE", None),
                                    "dividend_yield": info.get("dividendYield", None)
                                })
                        except Exception as e:
                            continue
                            
                # If still no results, try a few popular ETFs
                if not result:
                    etfs = ["SPY", "QQQ", "VTI", "VOO", "IWM", "VEA", "VWO", "BND", "AGG", "GLD"]
                    for etf in etfs:
                        if query_lower in etf.lower() or "etf" in query_lower or "fund" in query_lower:
                            try:
                                stock = yf.Ticker(etf)
                                info = stock.info
                                if info and "symbol" in info:
                                    result.append({
                                        "ticker": info.get("symbol", etf),
                                        "name": info.get("shortName", ""),
                                        "asset_class": "ETF",
                                        "category": info.get("category", ""),
                                        "market_cap": info.get("totalAssets", None),
                                        "price": info.get("currentPrice", None),
                                        "expense_ratio": info.get("annualReportExpenseRatio", None),
                                        "yield": info.get("yield", None)
                                    })
                            except Exception as e:
                                continue
        
        # Sort results by market cap if available
        result = sorted(result, key=lambda x: x.get("market_cap", 0) if x.get("market_cap") else 0, reverse=True)
        
        return result
        
    async def get_trending_stocks(self, count: Optional[int] = 5) -> List[Dict[str, Any]]:
        """
        Get trending stocks from Yahoo Finance using yahooquery.
        
        Args:
            count: Number of trending stocks to return (default 5)
            
        Returns:
            List of dictionaries containing trending stock information
        """
        result = []
        try:
            # Get trending stocks using yahooquery
            trending_data = yq.get_trending()
            
            # Extract quotes from trending data
            # Yahoo Finance trending data usually returns quotes from US market
            # We'll take the top quotes from US market (quotes[0])
            if trending_data and 'quotes' in trending_data and len(trending_data['quotes']) > 0:
                trending_symbols = [quote['symbol'] for quote in trending_data['quotes']][:count+5]  # Get a few extra in case some fail
                
                # Get detailed information for each trending symbol
                for symbol in trending_symbols:
                    try:
                        stock = yf.Ticker(symbol)
                        info = stock.info
                        
                        if info and "symbol" in info:
                            result.append({
                                "ticker": info.get("symbol", symbol),
                                "name": info.get("shortName", ""),
                                "sector": info.get("sector", ""),
                                "industry": info.get("industry", ""),
                                "market_cap": info.get("marketCap", None),
                                "price": info.get("currentPrice", info.get("regularMarketPrice", None)),
                                "change_percent": str(round(info.get("regularMarketChangePercent", 0.0), 2)),
                                "currency": info.get("currency", "USD"),
                                "is_trending": True
                            })
                            
                            # Stop once we have enough stocks
                            if len(result) >= count:
                                break
                    except Exception as e:
                        # Skip failed lookups
                        continue
        
        except Exception as e:
            # If trending fails, fall back to popular tech stocks
            print(f"Error fetching trending stocks: {e}")
            fallback_tickers = ["AAPL", "MSFT", "GOOG", "AMZN", "META", "NVDA", "TSLA", "NFLX"]
            for ticker in fallback_tickers:
                try:
                    stock = yf.Ticker(ticker)
                    info = stock.info
                    if info and "symbol" in info:
                        result.append({
                            "ticker": info.get("symbol", ticker),
                            "name": info.get("shortName", ""),
                            "sector": info.get("sector", ""),
                            "industry": info.get("industry", ""),
                            "market_cap": info.get("marketCap", None),
                            "price": info.get("currentPrice", info.get("regularMarketPrice", None)),
                            "change_percent": str(round(info.get("regularMarketChangePercent", 0.0) * 100, 2)),
                            "currency": info.get("currency", "USD"),
                            "is_trending": False  # Mark as not actually trending
                        })
                        
                        # Stop once we have enough stocks
                        if len(result) >= count:
                            break
                except Exception as e:
                    # Skip failed lookups
                    continue
                    
        return result
