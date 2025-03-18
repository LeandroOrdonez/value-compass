from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import valuation, custom
from app.database.database import engine, Base, SessionLocal
from app.seed_data import seed_default_rules

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed default valuation rules
db = SessionLocal()
try:
    seed_default_rules(db)
finally:
    db.close()

app = FastAPI(
    title="Value Compass Valuation Service",
    description="API for calculating stock valuation scores",
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
app.include_router(valuation.router, prefix="/valuation", tags=["Valuation"])
app.include_router(custom.router, prefix="/valuation", tags=["Custom Valuation"])

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Value Compass Valuation Service API"}
