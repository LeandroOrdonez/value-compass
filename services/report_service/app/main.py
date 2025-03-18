from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routers import reports, alerts
from app.database.database import engine, Base
from app.tasks.scheduler import start_scheduler, shutdown_scheduler

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Value Compass Report Service",
    description="API for generating reports and managing alerts",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create reports directory if it doesn't exist
os.makedirs("reports", exist_ok=True)

# Serve static files (generated reports)
app.mount("/reports", StaticFiles(directory="reports"), name="reports")

# Include routers
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Value Compass Report Service API"}

@app.on_event("startup")
async def startup_event():
    """Start the scheduler when the application starts"""
    start_scheduler()

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown the scheduler when the application stops"""
    shutdown_scheduler()
