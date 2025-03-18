from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.models import ValuationRule

router = APIRouter()

@router.post("/custom", response_model=Dict[str, Any])
async def create_custom_rule(rule_data: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Create a custom valuation rule"""
    try:
        # Check if the name is already taken
        existing_rule = db.query(ValuationRule).filter(ValuationRule.name == rule_data.get('name')).first()
        if existing_rule:
            raise HTTPException(status_code=400, detail=f"Rule with name '{rule_data.get('name')}' already exists")
        
        # Required fields validation
        required_fields = ['name', 'description', 'user_id', 'rule_config']
        for field in required_fields:
            if field not in rule_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Rule config validation (basic)
        rule_config = rule_data.get('rule_config')
        if not isinstance(rule_config, dict) or 'metrics' not in rule_config:
            raise HTTPException(status_code=400, detail="Invalid rule_config format")
        
        # Create the custom rule
        custom_rule = ValuationRule(
            name=rule_data.get('name'),
            description=rule_data.get('description'),
            user_id=rule_data.get('user_id'),
            is_default=False,  # Custom rules can't be default
            rule_config=rule_config
        )
        
        db.add(custom_rule)
        db.commit()
        db.refresh(custom_rule)
        
        return {
            "id": custom_rule.id,
            "name": custom_rule.name,
            "description": custom_rule.description,
            "user_id": custom_rule.user_id,
            "is_default": custom_rule.is_default,
            "created_at": custom_rule.created_at,
            "updated_at": custom_rule.updated_at
        }
    
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create custom rule: {str(e)}")

@router.put("/custom/{rule_id}", response_model=Dict[str, Any])
async def update_custom_rule(rule_id: int, rule_data: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Update a custom valuation rule"""
    try:
        # Get the existing rule
        rule = db.query(ValuationRule).filter(ValuationRule.id == rule_id).first()
        if not rule:
            raise HTTPException(status_code=404, detail=f"Rule with id {rule_id} not found")
        
        # Check if user owns the rule
        if rule.user_id is None:
            raise HTTPException(status_code=403, detail="Cannot modify system rules")
        
        # Update fields if provided
        if 'name' in rule_data:
            # Check if the new name is already taken by another rule
            if rule_data['name'] != rule.name:
                existing_rule = db.query(ValuationRule).filter(
                    ValuationRule.name == rule_data['name'],
                    ValuationRule.id != rule_id
                ).first()
                if existing_rule:
                    raise HTTPException(status_code=400, detail=f"Rule with name '{rule_data['name']}' already exists")
            rule.name = rule_data['name']
        
        if 'description' in rule_data:
            rule.description = rule_data['description']
        
        if 'rule_config' in rule_data:
            # Basic validation
            rule_config = rule_data['rule_config']
            if not isinstance(rule_config, dict) or 'metrics' not in rule_config:
                raise HTTPException(status_code=400, detail="Invalid rule_config format")
            rule.rule_config = rule_config
        
        db.commit()
        db.refresh(rule)
        
        return {
            "id": rule.id,
            "name": rule.name,
            "description": rule.description,
            "user_id": rule.user_id,
            "is_default": rule.is_default,
            "created_at": rule.created_at,
            "updated_at": rule.updated_at
        }
    
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update custom rule: {str(e)}")

@router.delete("/custom/{rule_id}", response_model=Dict[str, Any])
async def delete_custom_rule(rule_id: int, db: Session = Depends(get_db)):
    """Delete a custom valuation rule"""
    try:
        # Get the existing rule
        rule = db.query(ValuationRule).filter(ValuationRule.id == rule_id).first()
        if not rule:
            raise HTTPException(status_code=404, detail=f"Rule with id {rule_id} not found")
        
        # Check if user owns the rule
        if rule.user_id is None:
            raise HTTPException(status_code=403, detail="Cannot delete system rules")
        
        # Delete the rule
        db.delete(rule)
        db.commit()
        
        return {"message": f"Rule '{rule.name}' deleted successfully"}
    
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete custom rule: {str(e)}")
