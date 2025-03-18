from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.models import Alert, NotificationLog, AlertType

router = APIRouter()

@router.post("/set", response_model=Dict[str, Any])
async def set_alert(alert_data: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Set up an alert for a specific stock"""
    user_id = alert_data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    ticker = alert_data.get("ticker")
    if not ticker:
        raise HTTPException(status_code=400, detail="ticker is required")
    
    alert_type = alert_data.get("alert_type")
    if not alert_type or alert_type not in [e.value for e in AlertType]:
        raise HTTPException(status_code=400, detail=f"Valid alert_type is required: {', '.join([e.value for e in AlertType])}")
    
    threshold = alert_data.get("threshold")
    if alert_type != "news" and not threshold:
        raise HTTPException(status_code=400, detail="threshold is required for non-news alerts")
    
    # Create the alert
    alert = Alert(
        user_id=user_id,
        ticker=ticker,
        alert_type=alert_type,
        threshold=threshold,
        parameters=alert_data.get("parameters")
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return {
        "id": alert.id,
        "user_id": alert.user_id,
        "ticker": alert.ticker,
        "alert_type": alert.alert_type,
        "threshold": alert.threshold,
        "is_active": alert.is_active,
        "created_at": alert.created_at
    }

@router.get("/list", response_model=List[Dict[str, Any]])
async def list_alerts(
    user_id: int,
    active_only: bool = Query(False),
    ticker: Optional[str] = Query(None),
    alert_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List alerts for a user"""
    query = db.query(Alert).filter(Alert.user_id == user_id)
    
    if active_only:
        query = query.filter(Alert.is_active == True)
    
    if ticker:
        query = query.filter(Alert.ticker == ticker)
    
    if alert_type:
        query = query.filter(Alert.alert_type == alert_type)
    
    alerts = query.order_by(Alert.created_at.desc()).all()
    
    result = []
    for alert in alerts:
        result.append({
            "id": alert.id,
            "ticker": alert.ticker,
            "alert_type": alert.alert_type,
            "threshold": alert.threshold,
            "is_active": alert.is_active,
            "parameters": alert.parameters,
            "created_at": alert.created_at,
            "last_triggered_at": alert.last_triggered_at
        })
    
    return result

@router.delete("/delete/{alert_id}", response_model=Dict[str, str])
async def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    """Delete an alert"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Delete from database
    db.delete(alert)
    db.commit()
    
    return {"message": "Alert deleted successfully"}

@router.put("/toggle/{alert_id}", response_model=Dict[str, Any])
async def toggle_alert(alert_id: int, db: Session = Depends(get_db)):
    """Toggle an alert active status"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Toggle is_active
    alert.is_active = not alert.is_active
    db.commit()
    db.refresh(alert)
    
    return {
        "id": alert.id,
        "is_active": alert.is_active,
        "message": f"Alert {'activated' if alert.is_active else 'deactivated'} successfully"
    }

@router.get("/notifications", response_model=List[Dict[str, Any]])
async def list_notifications(
    user_id: int,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """List notifications for a user"""
    notifications = db.query(NotificationLog).filter(
        NotificationLog.user_id == user_id
    ).order_by(NotificationLog.sent_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for notification in notifications:
        result.append({
            "id": notification.id,
            "notification_type": notification.notification_type,
            "status": notification.status,
            "message": notification.message,
            "sent_at": notification.sent_at,
            "alert_id": notification.alert_id,
            "report_id": notification.report_id
        })
    
    return result
