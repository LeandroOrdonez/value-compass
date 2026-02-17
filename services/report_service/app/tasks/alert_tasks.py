from app.services.data_client import DataServiceClient
from app.services.valuation_client import ValuationServiceClient
from app.database.database import SessionLocal
from app.models.models import Alert, NotificationLog
from datetime import datetime, timedelta

async def check_price_alerts():
    """Check for price-based alerts that need to be triggered"""
    # Initialize data service
    data_client = DataServiceClient()
    
    try:
        # Get active price and percentage change alerts
        db = SessionLocal()
        try:
            active_alerts = db.query(Alert).filter(
                Alert.is_active == True,
                Alert.alert_type.in_(["price", "percentage_change"])
            ).all()
            
            # Group alerts by ticker to minimize API calls
            ticker_alerts = {}
            for alert in active_alerts:
                if alert.ticker not in ticker_alerts:
                    ticker_alerts[alert.ticker] = []
                ticker_alerts[alert.ticker].append(alert)
            
            # Check each ticker
            for ticker, alerts in ticker_alerts.items():
                try:
                    # Get current data and 1-day historical data
                    financial_data = await data_client.get_financial_data(ticker)
                    historical_data = await data_client.get_historical_data(
                        ticker, 
                        (datetime.now() - timedelta(days=2)).date()
                    )
                    
                    if not financial_data or not historical_data or len(historical_data) < 2:
                        continue
                    
                    current_price = financial_data.get("current_price") or financial_data.get("close")
                    previous_close = historical_data[0]["close"] if len(historical_data) > 1 else None
                    
                    if not current_price:
                        continue
                    
                    # Calculate daily change if needed
                    daily_change_pct = None
                    if previous_close and previous_close > 0:
                        daily_change_pct = (current_price - previous_close) / previous_close * 100
                    
                    # Check each alert
                    for alert in alerts:
                        should_trigger = False
                        message = ""
                        
                        if alert.alert_type == "price":
                            # Check price against threshold
                            if alert.parameters and "direction" in alert.parameters:
                                if alert.parameters["direction"] == "above" and current_price >= alert.threshold:
                                    should_trigger = True
                                    message = f"{ticker} price is above {alert.threshold}: current price is {current_price}"
                                elif alert.parameters["direction"] == "below" and current_price <= alert.threshold:
                                    should_trigger = True
                                    message = f"{ticker} price is below {alert.threshold}: current price is {current_price}"
                        
                        elif alert.alert_type == "percentage_change" and daily_change_pct is not None:
                            # Check daily percentage change against threshold
                            if alert.parameters and "direction" in alert.parameters:
                                if alert.parameters["direction"] == "up" and daily_change_pct >= alert.threshold:
                                    should_trigger = True
                                    message = f"{ticker} price increased by {daily_change_pct:.2f}% today (threshold: {alert.threshold}%)"
                                elif alert.parameters["direction"] == "down" and daily_change_pct <= -alert.threshold:
                                    should_trigger = True
                                    message = f"{ticker} price decreased by {abs(daily_change_pct):.2f}% today (threshold: {alert.threshold}%)"
                        
                        # Trigger the alert if conditions are met
                        if should_trigger:
                            # Update alert last_triggered_at
                            alert.last_triggered_at = datetime.now()
                            
                            # Create notification log
                            notification = NotificationLog(
                                user_id=alert.user_id,
                                alert_id=alert.id,
                                notification_type="email",  # Default to email
                                status="pending",
                                message=message
                            )
                            
                            db.add(notification)
                    
                    db.commit()
                    
                except Exception as e:
                    print(f"Error checking alerts for {ticker}: {str(e)}")
                    continue
                
        finally:
            db.close()
    
    finally:
        await data_client.close()

async def check_valuation_score_alerts():
    """Check for valuation score-based alerts that need to be triggered"""
    # Initialize valuation service
    valuation_client = ValuationServiceClient()
    
    try:
        # Get active valuation score alerts
        db = SessionLocal()
        try:
            active_alerts = db.query(Alert).filter(
                Alert.is_active == True,
                Alert.alert_type == "valuation_score"
            ).all()
            
            # Group alerts by ticker to minimize API calls
            ticker_alerts = {}
            for alert in active_alerts:
                if alert.ticker not in ticker_alerts:
                    ticker_alerts[alert.ticker] = []
                ticker_alerts[alert.ticker].append(alert)
            
            # Check each ticker
            for ticker, alerts in ticker_alerts.items():
                try:
                    # Get valuation score
                    rule_id = alerts[0].parameters.get("rule_id") if alerts[0].parameters else None
                    score_data = await valuation_client.get_valuation_score(ticker, rule_id)
                    
                    if not score_data or "score" not in score_data:
                        continue
                    
                    current_score = score_data["score"]
                    
                    # Check each alert
                    for alert in alerts:
                        should_trigger = False
                        message = ""
                        
                        # Check score against threshold
                        if alert.parameters and "direction" in alert.parameters:
                            if alert.parameters["direction"] == "above" and current_score >= alert.threshold:
                                should_trigger = True
                                message = f"{ticker} valuation score is above {alert.threshold}: current score is {current_score}"
                            elif alert.parameters["direction"] == "below" and current_score <= alert.threshold:
                                should_trigger = True
                                message = f"{ticker} valuation score is below {alert.threshold}: current score is {current_score}"
                        
                        # Trigger the alert if conditions are met
                        if should_trigger:
                            # Update alert last_triggered_at
                            alert.last_triggered_at = datetime.now()
                            
                            # Create notification log
                            notification = NotificationLog(
                                user_id=alert.user_id,
                                alert_id=alert.id,
                                notification_type="email",  # Default to email
                                status="pending",
                                message=message
                            )
                            
                            db.add(notification)
                    
                    db.commit()
                    
                except Exception as e:
                    print(f"Error checking valuation alerts for {ticker}: {str(e)}")
                    continue
                
        finally:
            db.close()
    
    finally:
        await valuation_client.close()
