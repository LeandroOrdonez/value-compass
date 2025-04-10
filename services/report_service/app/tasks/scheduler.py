from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor, ProcessPoolExecutor
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.models import ReportSchedule, Alert
from app.tasks.report_tasks import generate_portfolio_report, generate_basket_report
from app.tasks.alert_tasks import check_price_alerts, check_valuation_score_alerts

# Create a scheduler
scheduler = None

def start_scheduler():
    """Start the APScheduler"""
    global scheduler
    
    if scheduler is None:
        # Configure jobstores and executors
        jobstores = {
            'default': SQLAlchemyJobStore(url=os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/valuecompass"))
        }
        executors = {
            'default': ThreadPoolExecutor(20),
            'processpool': ProcessPoolExecutor(5)
        }
        job_defaults = {
            'coalesce': False,
            'max_instances': 3
        }
        
        scheduler = AsyncIOScheduler(jobstores=jobstores, executors=executors, job_defaults=job_defaults)
        
        # Start scheduler before adding jobs
        scheduler.start()
        
        # Add or update scheduled jobs
        try:
            # Remove existing jobs if they exist
            try:
                scheduler.remove_job('daily_scheduler')
                scheduler.remove_job('price_alerts')
                scheduler.remove_job('valuation_alerts')
            except:
                pass  # Job doesn't exist, which is fine
            
            # Add scheduled jobs
            scheduler.add_job(schedule_daily_tasks, 'cron', hour=0, minute=0, id='daily_scheduler', replace_existing=True)
            scheduler.add_job(check_price_alerts, 'interval', minutes=15, id='price_alerts', replace_existing=True)
            scheduler.add_job(check_valuation_score_alerts, 'cron', hour=8, minute=0, id='valuation_alerts', replace_existing=True)
            
            print("Scheduler started and jobs added.")
        except Exception as e:
            print(f"Error adding jobs to scheduler: {e}")
            # Continue even if there was an error adding jobs
    
def shutdown_scheduler():
    """Shut down the APScheduler"""
    global scheduler
    
    if scheduler:
        scheduler.shutdown()
        scheduler = None
        print("Scheduler shut down.")

async def schedule_daily_tasks():
    """Schedule tasks for reports based on configured schedules"""
    db = SessionLocal()
    try:
        now = datetime.now()
        active_schedules = db.query(ReportSchedule).filter(ReportSchedule.is_active == True).all()
        
        for schedule in active_schedules:
            should_run = False
            
            # Check if schedule should run today based on frequency
            if schedule.frequency == 'daily':
                should_run = True
            elif schedule.frequency == 'weekly' and schedule.day_of_week == now.weekday():
                should_run = True
            elif schedule.frequency == 'monthly' and schedule.day_of_month == now.day:
                should_run = True
            elif schedule.frequency == 'quarterly' and now.day == 1 and now.month in [1, 4, 7, 10]:
                should_run = True
            
            if should_run:
                # Schedule report generation
                if schedule.portfolio_id is not None:
                    # Portfolio report
                    run_time = now + timedelta(hours=1)  # Schedule for 1 hour from now
                    scheduler.add_job(
                        generate_portfolio_report,
                        'date',
                        run_date=run_time,
                        args=[schedule.user_id, schedule.portfolio_id, schedule.title, schedule.description, schedule.parameters],
                        id=f'portfolio_report_{schedule.id}_{now.strftime("%Y%m%d%H%M%S")}'  # Unique ID
                    )
                elif schedule.basket_id is not None:
                    # Basket report
                    run_time = now + timedelta(hours=1)  # Schedule for 1 hour from now
                    scheduler.add_job(
                        generate_basket_report,
                        'date',
                        run_date=run_time,
                        args=[schedule.user_id, schedule.basket_id, schedule.title, schedule.description, schedule.parameters],
                        id=f'basket_report_{schedule.id}_{now.strftime("%Y%m%d%H%M%S")}'  # Unique ID
                    )
    finally:
        db.close()
