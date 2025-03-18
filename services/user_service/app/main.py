from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import users, auth, portfolio, baskets
from app.database.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Value Compass User Service",
    description="API for user management, authentication, and portfolio management",
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
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(portfolio.router, prefix="/users", tags=["Portfolio"])
app.include_router(baskets.router, prefix="/users", tags=["Baskets"])

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Value Compass User Service API"}
