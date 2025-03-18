import os
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import jinja2
import aiofiles
from typing import Dict, List, Any, Optional
import io
import uuid

from app.services.data_client import DataServiceClient
from app.services.valuation_client import ValuationServiceClient
from app.services.user_client import UserServiceClient
from app.database.database import SessionLocal
from app.models.models import Report

async def generate_portfolio_report(user_id: int, portfolio_id: int, title: str, description: Optional[str] = None, parameters: Optional[Dict[str, Any]] = None):
    """Generate a report for a user's portfolio"""
    # Initialize services
    data_client = DataServiceClient()
    valuation_client = ValuationServiceClient()
    user_client = UserServiceClient()
    
    try:
        # Get portfolio information
        portfolio = await user_client.get_portfolio(user_id, portfolio_id)
        holdings = await user_client.get_portfolio_holdings(user_id, portfolio_id)
        
        if not holdings:
            return {"error": "No holdings found in portfolio"}
        
        # Get tickers from holdings
        tickers = [holding["ticker"] for holding in holdings]
        
        # Get valuation scores
        rule_id = parameters.get("rule_id") if parameters else None
        valuation_scores = await valuation_client.get_valuation_scores_batch(tickers, rule_id)
        
        # Get historical data for each ticker
        start_date = (datetime.now() - timedelta(days=30)).date()  # Default to last 30 days
        if parameters and "start_date" in parameters:
            try:
                start_date = datetime.strptime(parameters["start_date"], "%Y-%m-%d").date()
            except:
                pass
        
        historical_data = {}
        financial_data = {}
        for ticker in tickers:
            historical_data[ticker] = await data_client.get_historical_data(ticker, start_date)
            financial_data[ticker] = await data_client.get_financial_data(ticker)
        
        # Generate report
        report_html = await generate_portfolio_html_report(
            portfolio,
            holdings,
            historical_data,
            financial_data,
            valuation_scores
        )
        
        # Save report to file
        report_filename = f"portfolio_{portfolio_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        report_path = os.path.join("reports", report_filename)
        
        async with aiofiles.open(report_path, "w") as f:
            await f.write(report_html)
        
        # Save report metadata to database
        db = SessionLocal()
        try:
            report = Report(
                user_id=user_id,
                portfolio_id=portfolio_id,
                title=title,
                description=description,
                report_type="portfolio",
                file_path=report_path,
                parameters=parameters
            )
            
            db.add(report)
            db.commit()
            db.refresh(report)
            
            return {"report_id": report.id, "file_path": report_path}
        finally:
            db.close()
            
    finally:
        # Close service clients
        await data_client.close()
        await valuation_client.close()
        await user_client.close()

async def generate_basket_report(user_id: int, basket_id: int, title: str, description: Optional[str] = None, parameters: Optional[Dict[str, Any]] = None):
    """Generate a report for a user's custom stock basket"""
    # Initialize services
    data_client = DataServiceClient()
    valuation_client = ValuationServiceClient()
    user_client = UserServiceClient()
    
    try:
        # Get basket information
        basket = await user_client.get_basket(user_id, basket_id)
        basket_stocks = await user_client.get_basket_stocks(user_id, basket_id)
        
        if not basket_stocks:
            return {"error": "No stocks found in basket"}
        
        # Get tickers from basket
        tickers = [stock["ticker"] for stock in basket_stocks]
        
        # Get valuation scores
        rule_id = parameters.get("rule_id") if parameters else None
        valuation_scores = await valuation_client.get_valuation_scores_batch(tickers, rule_id)
        
        # Get historical data for each ticker
        start_date = (datetime.now() - timedelta(days=30)).date()  # Default to last 30 days
        if parameters and "start_date" in parameters:
            try:
                start_date = datetime.strptime(parameters["start_date"], "%Y-%m-%d").date()
            except:
                pass
        
        historical_data = {}
        financial_data = {}
        for ticker in tickers:
            historical_data[ticker] = await data_client.get_historical_data(ticker, start_date)
            financial_data[ticker] = await data_client.get_financial_data(ticker)
        
        # Generate report
        report_html = await generate_basket_html_report(
            basket,
            basket_stocks,
            historical_data,
            financial_data,
            valuation_scores
        )
        
        # Save report to file
        report_filename = f"basket_{basket_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        report_path = os.path.join("reports", report_filename)
        
        async with aiofiles.open(report_path, "w") as f:
            await f.write(report_html)
        
        # Save report metadata to database
        db = SessionLocal()
        try:
            report = Report(
                user_id=user_id,
                basket_id=basket_id,
                title=title,
                description=description,
                report_type="basket",
                file_path=report_path,
                parameters=parameters
            )
            
            db.add(report)
            db.commit()
            db.refresh(report)
            
            return {"report_id": report.id, "file_path": report_path}
        finally:
            db.close()
            
    finally:
        # Close service clients
        await data_client.close()
        await valuation_client.close()
        await user_client.close()

async def generate_portfolio_html_report(portfolio, holdings, historical_data, financial_data, valuation_scores):
    """Generate HTML report for a portfolio"""
    # Load Jinja2 template
    template_loader = jinja2.FileSystemLoader(searchpath="./app/templates")
    template_env = jinja2.Environment(loader=template_loader)
    template = template_env.get_template("portfolio_report.html")
    
    # Generate performance charts
    performance_chart_path = await generate_performance_chart(historical_data, holdings)
    allocation_chart_path = await generate_allocation_chart(holdings, financial_data)
    valuation_chart_path = await generate_valuation_chart(valuation_scores)
    
    # Prepare template variables
    template_vars = {
        "portfolio": portfolio,
        "holdings": holdings,
        "financial_data": financial_data,
        "valuation_scores": valuation_scores,
        "performance_chart": performance_chart_path,
        "allocation_chart": allocation_chart_path,
        "valuation_chart": valuation_chart_path,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Render template
    html_output = template.render(template_vars)
    return html_output

async def generate_basket_html_report(basket, basket_stocks, historical_data, financial_data, valuation_scores):
    """Generate HTML report for a stock basket"""
    # Load Jinja2 template
    template_loader = jinja2.FileSystemLoader(searchpath="./app/templates")
    template_env = jinja2.Environment(loader=template_loader)
    template = template_env.get_template("basket_report.html")
    
    # Generate performance charts
    performance_chart_path = await generate_basket_performance_chart(historical_data, basket_stocks)
    valuation_chart_path = await generate_valuation_chart(valuation_scores)
    
    # Prepare template variables
    template_vars = {
        "basket": basket,
        "stocks": basket_stocks,
        "financial_data": financial_data,
        "valuation_scores": valuation_scores,
        "performance_chart": performance_chart_path,
        "valuation_chart": valuation_chart_path,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Render template
    html_output = template.render(template_vars)
    return html_output

async def generate_performance_chart(historical_data, holdings):
    """Generate a performance chart for portfolio holdings"""
    plt.figure(figsize=(10, 6))
    
    # Create a dataframe with the closing prices
    dfs = []
    for ticker in historical_data:
        if historical_data[ticker]:
            df = pd.DataFrame(historical_data[ticker])
            df = df[["date", "close"]]
            df.set_index("date", inplace=True)
            df.columns = [ticker]
            dfs.append(df)
    
    if dfs:
        # Combine all dataframes
        combined_df = pd.concat(dfs, axis=1)
        
        # Normalize to starting value
        normalized_df = combined_df / combined_df.iloc[0] * 100
        
        # Plot
        normalized_df.plot(figsize=(10, 6))
        plt.title('Normalized Performance (%)')
        plt.ylabel('Performance (%)')
        plt.xlabel('Date')
        plt.grid(True, alpha=0.3)
        plt.legend(loc='upper left')
        
        # Save to a file
        filename = f"performance_{uuid.uuid4().hex}.png"
        filepath = os.path.join("reports", filename)
        plt.savefig(filepath)
        plt.close()
        
        return filename
    
    return None

async def generate_basket_performance_chart(historical_data, basket_stocks):
    """Generate a performance chart for basket stocks"""
    plt.figure(figsize=(10, 6))
    
    # Create a dataframe with the closing prices
    dfs = []
    for ticker in historical_data:
        if historical_data[ticker]:
            df = pd.DataFrame(historical_data[ticker])
            df = df[["date", "close"]]
            df.set_index("date", inplace=True)
            df.columns = [ticker]
            dfs.append(df)
    
    if dfs:
        # Combine all dataframes
        combined_df = pd.concat(dfs, axis=1)
        
        # Normalize to starting value
        normalized_df = combined_df / combined_df.iloc[0] * 100
        
        # Plot
        normalized_df.plot(figsize=(10, 6))
        plt.title('Normalized Performance (%)')
        plt.ylabel('Performance (%)')
        plt.xlabel('Date')
        plt.grid(True, alpha=0.3)
        plt.legend(loc='upper left')
        
        # Save to a file
        filename = f"performance_{uuid.uuid4().hex}.png"
        filepath = os.path.join("reports", filename)
        plt.savefig(filepath)
        plt.close()
        
        return filename
    
    return None

async def generate_allocation_chart(holdings, financial_data):
    """Generate a sector allocation chart for portfolio holdings"""
    # Extract sector information
    sectors = {}
    for holding in holdings:
        ticker = holding["ticker"]
        shares = holding["shares"]
        
        if ticker in financial_data and financial_data[ticker]:
            sector = financial_data[ticker].get("sector", "Unknown")
            market_cap = financial_data[ticker].get("market_cap", 0)
            
            if sector not in sectors:
                sectors[sector] = 0
            
            # Calculate value of holding
            if market_cap and "close" in financial_data[ticker]:
                price = financial_data[ticker]["close"]
                value = shares * price
                sectors[sector] += value
    
    if sectors:
        # Create pie chart
        plt.figure(figsize=(10, 6))
        plt.pie(sectors.values(), labels=sectors.keys(), autopct='%1.1f%%', startangle=90)
        plt.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle
        plt.title('Portfolio Sector Allocation')
        
        # Save to a file
        filename = f"allocation_{uuid.uuid4().hex}.png"
        filepath = os.path.join("reports", filename)
        plt.savefig(filepath)
        plt.close()
        
        return filename
    
    return None

async def generate_valuation_chart(valuation_scores):
    """Generate a valuation score chart"""
    if not valuation_scores:
        return None
    
    # Extract scores
    tickers = []
    scores = []
    
    for score_data in valuation_scores:
        if "ticker" in score_data and "score" in score_data:
            tickers.append(score_data["ticker"])
            scores.append(score_data["score"])
    
    if tickers and scores:
        # Create bar chart
        plt.figure(figsize=(12, 6))
        plt.bar(tickers, scores)
        plt.title('Valuation Scores')
        plt.ylabel('Score')
        plt.axhline(y=50, color='r', linestyle='-', alpha=0.3)  # 50 is neutral score
        plt.xticks(rotation=45)
        plt.grid(axis='y', alpha=0.3)
        
        # Save to a file
        filename = f"valuation_{uuid.uuid4().hex}.png"
        filepath = os.path.join("reports", filename)
        plt.savefig(filepath)
        plt.close()
        
        return filename
    
    return None
