from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from datetime import date, datetime, timedelta

from app.services.data_client import DataServiceClient

class ValuationService:
    """Service for calculating valuation scores"""
    
    def __init__(self):
        self.data_client = DataServiceClient()
    
    async def close(self):
        await self.data_client.close()
    
    async def calculate_score(self, ticker: str, rule_config: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate a valuation score based on the given rule configuration"""
        # Get financial data
        financial_data = await self.data_client.get_financial_data(ticker)
        
        # Get historical data if needed
        historical_data = None
        if any(metric.startswith('historical_') for metric in rule_config.get('metrics', {})):
            start_date = (datetime.now() - timedelta(days=365)).date()
            historical_data = await self.data_client.get_historical_data(ticker, start_date)
        
        # Get peer data if needed
        peer_data = None
        if any(metric.startswith('peer_') for metric in rule_config.get('metrics', {})):
            industry = financial_data.get('industry')
            if industry:
                peer_data = await self.data_client.get_peer_companies(industry)
        
        # Calculate individual scores
        score_components = {}
        for metric_name, metric_config in rule_config.get('metrics', {}).items():
            score_components[metric_name] = self._calculate_metric_score(
                ticker, metric_name, metric_config, financial_data, historical_data, peer_data
            )
        
        # Calculate overall score using weightings
        total_weight = sum(metric_config.get('weight', 1) for metric_config in rule_config.get('metrics', {}).values())
        overall_score = 0
        
        for metric_name, metric_config in rule_config.get('metrics', {}).items():
            weight = metric_config.get('weight', 1)
            overall_score += score_components[metric_name] * (weight / total_weight)
        
        return {
            'ticker': ticker,
            'score': overall_score,
            'score_components': score_components
        }
    
    def _calculate_metric_score(self, ticker: str, metric_name: str, metric_config: Dict[str, Any], 
                               financial_data: Dict[str, Any], 
                               historical_data: Optional[List[Dict[str, Any]]] = None,
                               peer_data: Optional[List[Dict[str, Any]]] = None) -> float:
        """Calculate the score for a single metric"""
        # Basic financial metrics
        if metric_name == 'pe_ratio':
            return self._score_pe_ratio(financial_data.get('pe_ratio'), metric_config)
        elif metric_name == 'pb_ratio':
            return self._score_pb_ratio(financial_data.get('pb_ratio'), metric_config)
        elif metric_name == 'dividend_yield':
            return self._score_dividend_yield(financial_data.get('dividend_yield'), metric_config)
        elif metric_name == 'debt_to_equity':
            return self._score_debt_to_equity(financial_data.get('debt_to_equity'), metric_config)
        elif metric_name == 'profit_margin':
            return self._score_profit_margin(financial_data.get('profit_margin'), metric_config)
        elif metric_name == 'roe':
            return self._score_roe(financial_data.get('roe'), metric_config)
        
        # Historical metrics
        elif metric_name == 'historical_volatility' and historical_data:
            return self._score_historical_volatility(historical_data, metric_config)
        
        # Peer comparison metrics
        elif metric_name == 'peer_pe_ratio' and peer_data:
            return self._score_peer_comparison(financial_data.get('pe_ratio'), 'pe_ratio', peer_data, metric_config)
        elif metric_name == 'peer_pb_ratio' and peer_data:
            return self._score_peer_comparison(financial_data.get('pb_ratio'), 'pb_ratio', peer_data, metric_config)
        
        # Default score if metric not implemented
        return 50.0
    
    def _score_pe_ratio(self, pe_ratio: Optional[float], config: Dict[str, Any]) -> float:
        """Score P/E ratio - lower is generally better"""
        if pe_ratio is None or pe_ratio <= 0:
            return config.get('default_score', 50.0)
        
        ideal_range = config.get('ideal_range', [5, 15])
        max_pe = config.get('max_pe', 50)
        
        if pe_ratio < 0:
            # Negative earnings
            return config.get('negative_score', 20.0)
        elif pe_ratio < ideal_range[0]:
            # Potentially undervalued, but could be a value trap
            score = 80 + (ideal_range[0] - pe_ratio) * 2
            return min(score, 100.0)
        elif pe_ratio <= ideal_range[1]:
            # Ideal range
            position = (ideal_range[1] - pe_ratio) / (ideal_range[1] - ideal_range[0])
            return 70 + position * 30
        else:
            # Higher than ideal
            score = 70 * (max_pe - pe_ratio) / (max_pe - ideal_range[1])
            return max(score, 0.0)
    
    def _score_pb_ratio(self, pb_ratio: Optional[float], config: Dict[str, Any]) -> float:
        """Score P/B ratio - lower is generally better"""
        if pb_ratio is None or pb_ratio <= 0:
            return config.get('default_score', 50.0)
        
        ideal_range = config.get('ideal_range', [0.5, 2.0])
        max_pb = config.get('max_pb', 10)
        
        if pb_ratio < 0:
            # Negative book value
            return config.get('negative_score', 20.0)
        elif pb_ratio < ideal_range[0]:
            # Potentially undervalued, but could be a value trap
            score = 80 + (ideal_range[0] - pb_ratio) * 10
            return min(score, 100.0)
        elif pb_ratio <= ideal_range[1]:
            # Ideal range
            position = (ideal_range[1] - pb_ratio) / (ideal_range[1] - ideal_range[0])
            return 70 + position * 30
        else:
            # Higher than ideal
            score = 70 * (max_pb - pb_ratio) / (max_pb - ideal_range[1])
            return max(score, 0.0)
    
    def _score_dividend_yield(self, dividend_yield: Optional[float], config: Dict[str, Any]) -> float:
        """Score dividend yield - higher is generally better"""
        if dividend_yield is None:
            return config.get('default_score', 50.0)
        
        # Convert from decimal to percentage if needed
        if dividend_yield > 0 and dividend_yield < 0.01:
            dividend_yield *= 100
        
        ideal_range = config.get('ideal_range', [2.0, 6.0])
        max_yield = config.get('max_yield', 15.0)
        
        if dividend_yield <= 0:
            # No dividend
            return config.get('zero_score', 40.0)
        elif dividend_yield < ideal_range[0]:
            # Below ideal range
            position = dividend_yield / ideal_range[0]
            return 40 + position * 30
        elif dividend_yield <= ideal_range[1]:
            # Ideal range
            position = (dividend_yield - ideal_range[0]) / (ideal_range[1] - ideal_range[0])
            return 70 + position * 20
        elif dividend_yield <= max_yield:
            # Above ideal but below max (could be unsustainable)
            position = 1 - (dividend_yield - ideal_range[1]) / (max_yield - ideal_range[1])
            return 70 + position * 20
        else:
            # Extremely high yield, likely unsustainable
            return config.get('unsustainable_score', 50.0)
    
    def _score_debt_to_equity(self, debt_to_equity: Optional[float], config: Dict[str, Any]) -> float:
        """Score debt-to-equity ratio - lower is generally better"""
        if debt_to_equity is None:
            return config.get('default_score', 50.0)
        
        ideal_range = config.get('ideal_range', [0, 1.0])
        max_ratio = config.get('max_ratio', 3.0)
        
        if debt_to_equity < 0:
            # Negative equity
            return config.get('negative_score', 10.0)
        elif debt_to_equity <= ideal_range[0]:
            # No debt
            return 100.0
        elif debt_to_equity <= ideal_range[1]:
            # Ideal range
            position = (ideal_range[1] - debt_to_equity) / (ideal_range[1] - ideal_range[0])
            return 80 + position * 20
        elif debt_to_equity <= max_ratio:
            # Above ideal but below max
            position = (max_ratio - debt_to_equity) / (max_ratio - ideal_range[1])
            return 40 + position * 40
        else:
            # Extremely high debt
            return max(0, 40 - (debt_to_equity - max_ratio) * 10)
    
    def _score_profit_margin(self, profit_margin: Optional[float], config: Dict[str, Any]) -> float:
        """Score profit margin - higher is generally better"""
        if profit_margin is None:
            return config.get('default_score', 50.0)
        
        # Convert from decimal to percentage if needed
        if profit_margin > 0 and profit_margin < 0.01:
            profit_margin *= 100
        
        ideal_range = config.get('ideal_range', [10.0, 25.0])
        
        if profit_margin < 0:
            # Negative profit
            return max(0, 40 + profit_margin)  # Lower score for more negative margin
        elif profit_margin < ideal_range[0]:
            # Below ideal range
            position = profit_margin / ideal_range[0]
            return 40 + position * 40
        elif profit_margin <= ideal_range[1]:
            # Ideal range
            position = (profit_margin - ideal_range[0]) / (ideal_range[1] - ideal_range[0])
            return 80 + position * 20
        else:
            # Above ideal range
            extra = min(25, profit_margin - ideal_range[1])
            bonus = extra * 0.4  # Diminishing returns for very high margins
            return min(100, 100 + bonus)
    
    def _score_roe(self, roe: Optional[float], config: Dict[str, Any]) -> float:
        """Score Return on Equity - higher is generally better"""
        if roe is None:
            return config.get('default_score', 50.0)
        
        # Convert from decimal to percentage if needed
        if roe > 0 and roe < 0.01:
            roe *= 100
        
        ideal_range = config.get('ideal_range', [10.0, 20.0])
        
        if roe < 0:
            # Negative ROE
            return max(0, 40 + roe)  # Lower score for more negative ROE
        elif roe < ideal_range[0]:
            # Below ideal range
            position = roe / ideal_range[0]
            return 40 + position * 40
        elif roe <= ideal_range[1]:
            # Ideal range
            position = (roe - ideal_range[0]) / (ideal_range[1] - ideal_range[0])
            return 80 + position * 20
        else:
            # Above ideal range
            extra = min(20, roe - ideal_range[1])
            bonus = extra * 0.5  # Diminishing returns for very high ROE
            return min(100, 100 + bonus)
    
    def _score_historical_volatility(self, historical_data: List[Dict[str, Any]], config: Dict[str, Any]) -> float:
        """Score volatility - lower is generally better"""
        if not historical_data or len(historical_data) < 20:
            return config.get('default_score', 50.0)
        
        # Calculate daily returns
        closes = [item['close'] for item in historical_data]
        daily_returns = [(closes[i] / closes[i-1] - 1) for i in range(1, len(closes))]
        
        # Calculate annualized volatility (standard deviation of returns * sqrt(252))
        volatility = np.std(daily_returns) * np.sqrt(252) * 100  # as percentage
        
        ideal_range = config.get('ideal_range', [10.0, 25.0])
        max_volatility = config.get('max_volatility', 50.0)
        
        if volatility <= ideal_range[0]:
            # Very low volatility
            return 100.0
        elif volatility <= ideal_range[1]:
            # Ideal range
            position = (ideal_range[1] - volatility) / (ideal_range[1] - ideal_range[0])
            return 70 + position * 30
        elif volatility <= max_volatility:
            # Above ideal but below max
            position = (max_volatility - volatility) / (max_volatility - ideal_range[1])
            return 40 + position * 30
        else:
            # Extremely volatile
            return max(0, 40 - (volatility - max_volatility) * 0.8)
    
    def _score_peer_comparison(self, value: Optional[float], metric: str, peer_data: List[Dict[str, Any]], config: Dict[str, Any]) -> float:
        """Score metric compared to peers"""
        if value is None or not peer_data:
            return config.get('default_score', 50.0)
        
        # Extract metric values from peers
        peer_values = []
        for peer in peer_data:
            peer_value = peer.get(metric)
            if peer_value is not None and peer_value > 0:  # Only positive values
                peer_values.append(peer_value)
        
        if not peer_values:
            return config.get('default_score', 50.0)
        
        # Calculate percentile ranking
        if metric in ['pe_ratio', 'pb_ratio', 'debt_to_equity']:  
            # Lower is better
            percentile = sum(1 for x in peer_values if x >= value) / len(peer_values) * 100
        else:  
            # Higher is better
            percentile = sum(1 for x in peer_values if x <= value) / len(peer_values) * 100
        
        # Convert to a score (0-100)
        return percentile

    async def calculate_scores_batch(self, tickers: List[str], rule_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Calculate valuation scores for multiple tickers"""
        results = []
        for ticker in tickers:
            try:
                score_data = await self.calculate_score(ticker, rule_config)
                results.append(score_data)
            except Exception as e:
                # Log the error and continue with next ticker
                print(f"Error calculating score for {ticker}: {str(e)}")
                results.append({
                    'ticker': ticker,
                    'score': 0,
                    'score_components': {},
                    'error': str(e)
                })
        
        return results
