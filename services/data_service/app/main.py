from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import historical, financials, peers
from app.database.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Value Compass Data Service",
    description="API for retrieving financial data from various sources",
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

# Include routers
app.include_router(historical.router, prefix="/stocks", tags=["Historical Data"])
app.include_router(financials.router, prefix="/stocks", tags=["Financial Data"])
app.include_router(peers.router, prefix="/industry", tags=["Industry Data"])

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Value Compass Data Service API"}
