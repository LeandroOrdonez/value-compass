from fastapi import APIRouter, Depends, HTTPException, Body, Query, BackgroundTasks
from fastapi.responses import FileResponse
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
import os

from app.database.database import get_db
from app.models.models import Report, ReportSchedule
from app.tasks.report_tasks import generate_portfolio_report, generate_basket_report

router = APIRouter()

@router.post("/generate", response_model=Dict[str, Any])
async def generate_report(
    background_tasks: BackgroundTasks,
    report_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """Generate a report for a portfolio or stock basket"""
    user_id = report_data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    title = report_data.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="title is required")
    
    description = report_data.get("description")
    parameters = report_data.get("parameters", {})
    
    # Check if portfolio_id or basket_id is provided
    portfolio_id = report_data.get("portfolio_id")
    basket_id = report_data.get("basket_id")
    
    if not portfolio_id and not basket_id:
        raise HTTPException(
            status_code=400, 
            detail="Either portfolio_id or basket_id must be provided"
        )
    
    if portfolio_id and basket_id:
        raise HTTPException(
            status_code=400, 
            detail="Only one of portfolio_id or basket_id can be provided"
        )
    
    # Queue report generation in background
    if portfolio_id:
        # Portfolio report
        background_tasks.add_task(
            generate_portfolio_report,
            user_id,
            portfolio_id,
            title,
            description,
            parameters
        )
        report_type = "portfolio"
    else:
        # Basket report
        background_tasks.add_task(
            generate_basket_report,
            user_id,
            basket_id,
            title,
            description,
            parameters
        )
        report_type = "basket"
    
    return {
        "message": f"Report generation for {report_type} started. The report will be available shortly.",
        "status": "pending",
        "user_id": user_id,
        "title": title
    }

@router.get("/list", response_model=List[Dict[str, Any]])
async def list_reports(
    user_id: int,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """List reports for a user"""
    reports = db.query(Report).filter(Report.user_id == user_id).order_by(
        Report.generated_at.desc()
    ).offset(offset).limit(limit).all()
    
    result = []
    for report in reports:
        # Create file URL and determine status
        file_url = None
        status = "pending"
        
        if report.file_path and os.path.exists(report.file_path):
            file_name = os.path.basename(report.file_path)
            file_url = f"/report-files/{file_name}"
            status = "completed"
        
        result.append({
            "id": report.id,
            "title": report.title,
            "description": report.description,
            "report_type": report.report_type,
            "generated_at": report.generated_at,
            "portfolio_id": report.portfolio_id,
            "basket_id": report.basket_id,
            "file_url": file_url,
            "status": status,
            "type": "portfolio" if report.portfolio_id else "basket",
            "target_id": report.portfolio_id if report.portfolio_id else report.basket_id,
            "created_at": report.generated_at.isoformat() if report.generated_at else None
        })
    
    return result

@router.get("/view/{report_id}")
async def view_report(report_id: int, db: Session = Depends(get_db)):
    """View a generated report"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    # The file path is relative to 'reports' directory
    file_name = os.path.basename(report.file_path)
    return {"file_url": f"/report-files/{file_name}", "status": "completed"}

@router.delete("/delete/{report_id}", response_model=Dict[str, str])
async def delete_report(report_id: int, db: Session = Depends(get_db)):
    """Delete a report"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Delete the file if it exists
    if os.path.exists(report.file_path):
        os.remove(report.file_path)
    
    # Delete from database
    db.delete(report)
    db.commit()
    
    return {"message": "Report deleted successfully"}

@router.post("/schedule", response_model=Dict[str, Any])
async def schedule_report(schedule_data: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Schedule a recurring report"""
    user_id = schedule_data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    title = schedule_data.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="title is required")
    
    frequency = schedule_data.get("frequency")
    if not frequency or frequency not in ["daily", "weekly", "monthly", "quarterly"]:
        raise HTTPException(status_code=400, detail="Valid frequency is required (daily, weekly, monthly, quarterly)")
    
    # Check if portfolio_id or basket_id is provided
    portfolio_id = schedule_data.get("portfolio_id")
    basket_id = schedule_data.get("basket_id")
    
    if not portfolio_id and not basket_id:
        raise HTTPException(
            status_code=400, 
            detail="Either portfolio_id or basket_id must be provided"
        )
    
    if portfolio_id and basket_id:
        raise HTTPException(
            status_code=400, 
            detail="Only one of portfolio_id or basket_id can be provided"
        )
    
    # Create schedule
    report_schedule = ReportSchedule(
        user_id=user_id,
        title=title,
        description=schedule_data.get("description"),
        report_type="portfolio" if portfolio_id else "basket",
        portfolio_id=portfolio_id,
        basket_id=basket_id,
        frequency=frequency,
        day_of_week=schedule_data.get("day_of_week"),  # For weekly reports
        day_of_month=schedule_data.get("day_of_month"),  # For monthly reports
        parameters=schedule_data.get("parameters")
    )
    
    db.add(report_schedule)
    db.commit()
    db.refresh(report_schedule)
    
    return {
        "id": report_schedule.id,
        "user_id": report_schedule.user_id,
        "title": report_schedule.title,
        "frequency": report_schedule.frequency,
        "report_type": report_schedule.report_type,
        "created_at": report_schedule.created_at
    }

@router.get("/schedules", response_model=List[Dict[str, Any]])
async def list_report_schedules(
    user_id: int,
    db: Session = Depends(get_db)
):
    """List report schedules for a user"""
    schedules = db.query(ReportSchedule).filter(
        ReportSchedule.user_id == user_id
    ).order_by(ReportSchedule.created_at.desc()).all()
    
    result = []
    for schedule in schedules:
        result.append({
            "id": schedule.id,
            "title": schedule.title,
            "description": schedule.description,
            "report_type": schedule.report_type,
            "frequency": schedule.frequency,
            "is_active": schedule.is_active,
            "portfolio_id": schedule.portfolio_id,
            "basket_id": schedule.basket_id,
            "created_at": schedule.created_at
        })
    
    return result

@router.delete("/schedule/{schedule_id}", response_model=Dict[str, str])
async def delete_report_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """Delete a report schedule"""
    schedule = db.query(ReportSchedule).filter(ReportSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Report schedule not found")
    
    # Delete from database
    db.delete(schedule)
    db.commit()
    
    return {"message": "Report schedule deleted successfully"}

@router.put("/schedule/{schedule_id}/toggle", response_model=Dict[str, Any])
async def toggle_report_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """Toggle a report schedule active status"""
    schedule = db.query(ReportSchedule).filter(ReportSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Report schedule not found")
    
    # Toggle is_active
    schedule.is_active = not schedule.is_active
    db.commit()
    db.refresh(schedule)
    
    return {
        "id": schedule.id,
        "is_active": schedule.is_active,
        "message": f"Report schedule {'activated' if schedule.is_active else 'deactivated'} successfully"
    }
