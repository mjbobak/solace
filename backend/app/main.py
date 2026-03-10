import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.auth_router import router as auth_router
from backend.app.api.budgets_router import router as budgets_router
from backend.app.api.csv_upload_router import router as csv_upload_router
from backend.app.api.expense_categories_router import router as expense_categories_router
from backend.app.api.incomes_router import router as incomes_router
from backend.app.api.transactions_router import router as transactions_router
from backend.app.db.init_db import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - runs on startup and shutdown."""
    # Startup
    logging.info("Initializing database...")
    init_db()
    logging.info("Database initialization complete.")
    yield
    # Shutdown
    logging.info("Application shutting down...")


app = FastAPI(
    title="Family Finance API",
    description="API for managing personal finances, budgets, and transactions",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(budgets_router, prefix="/api")
app.include_router(csv_upload_router, prefix="/api")
app.include_router(expense_categories_router, prefix="/api")
app.include_router(incomes_router, prefix="/api")
app.include_router(transactions_router, prefix="/api")
