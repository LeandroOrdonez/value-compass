import os
from dotenv import load_dotenv
from app.adapters.data_source import DataSource
from app.adapters.yahoo_finance import YahooFinanceAdapter

load_dotenv()

def get_data_source() -> DataSource:
    """Factory function to get the configured data source"""
    source_type = os.getenv("DATA_SOURCE", "yahoo")
    
    if source_type.lower() == "yahoo":
        return YahooFinanceAdapter()
    else:
        # Default to Yahoo Finance
        return YahooFinanceAdapter()
