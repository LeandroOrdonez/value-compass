from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.valuation import ValuationService
from app.models.models import ValuationRule, ValuationScore

router = APIRouter()

@router.post("/score", response_model=Dict[str, Any])
async def calculate_score(ticker: str, rule_id: int = None, db: Session = Depends(get_db)):
    """Calculate valuation score for a given ticker using a specified rule"""
    try:
        # Get the rule from the database
        if rule_id:
            rule = db.query(ValuationRule).filter(ValuationRule.id == rule_id).first()
            if not rule:
                raise HTTPException(status_code=404, detail=f"Valuation rule with ID {rule_id} not found")
        else:
            # Use the default rule if none specified
            rule = db.query(ValuationRule).filter(ValuationRule.is_default == True).first()
            if not rule:
                raise HTTPException(status_code=404, detail="No default valuation rule found")
        
        # Create valuation service
        valuation_service = ValuationService()
        
        try:
            # Calculate score
            score_data = await valuation_service.calculate_score(ticker, rule.rule_config)
            
            # Save score to the database
            valuation_score = ValuationScore(
                ticker=ticker,
                rule_id=rule.id,
                score=score_data['score'],
                score_components=score_data['score_components']
            )
            db.add(valuation_score)
            db.commit()
            
            return {
                "ticker": ticker,
                "rule_name": rule.name,
                "score": score_data['score'],
                "score_components": score_data['score_components']
            }
        finally:
            # Close the valuation service
            await valuation_service.close()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate valuation score: {str(e)}")

@router.post("/batch", response_model=List[Dict[str, Any]])
async def calculate_scores_batch(tickers: List[str] = Body(...), rule_id: int = None, db: Session = Depends(get_db)):
    """Calculate valuation scores for multiple tickers"""
    try:
        # Get the rule from the database
        if rule_id:
            rule = db.query(ValuationRule).filter(ValuationRule.id == rule_id).first()
            if not rule:
                raise HTTPException(status_code=404, detail=f"Valuation rule with ID {rule_id} not found")
        else:
            # Use the default rule if none specified
            rule = db.query(ValuationRule).filter(ValuationRule.is_default == True).first()
            if not rule:
                raise HTTPException(status_code=404, detail="No default valuation rule found")
        
        # Create valuation service
        valuation_service = ValuationService()
        
        try:
            # Calculate scores in batch
            scores_data = await valuation_service.calculate_scores_batch(tickers, rule.rule_config)
            
            # Save scores to the database
            for score_data in scores_data:
                # Skip failed calculations
                if 'error' in score_data:
                    continue
                    
                valuation_score = ValuationScore(
                    ticker=score_data['ticker'],
                    rule_id=rule.id,
                    score=score_data['score'],
                    score_components=score_data['score_components']
                )
                db.add(valuation_score)
            
            db.commit()
            
            # Add rule name to each result
            for score_data in scores_data:
                score_data['rule_name'] = rule.name
            
            return scores_data
        finally:
            # Close the valuation service
            await valuation_service.close()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate valuation scores: {str(e)}")

@router.get("/rules", response_model=List[Dict[str, Any]])
async def get_valuation_rules(user_id: int = None, db: Session = Depends(get_db)):
    """Get available valuation rules"""
    try:
        # Query rules
        if user_id:
            # Get system rules and user's custom rules
            rules = db.query(ValuationRule).filter(
                (ValuationRule.user_id == None) | (ValuationRule.user_id == user_id)
            ).all()
        else:
            # Get only system rules
            rules = db.query(ValuationRule).filter(ValuationRule.user_id == None).all()
        
        # Convert to list of dictionaries
        result = []
        for rule in rules:
            result.append({
                "id": rule.id,
                "name": rule.name,
                "description": rule.description,
                "is_default": rule.is_default,
                "user_id": rule.user_id,
                "created_at": rule.created_at,
                "updated_at": rule.updated_at
            })
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve valuation rules: {str(e)}")
