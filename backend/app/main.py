import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.redis import redis_client
from app.core.database import engine
from app.exceptions.handlers import add_exception_handlers
from app.api.v1.health import routes as health_routes
from app.api.v1.profile import routes as profile_routes
from app.api.v1.scan import routes as scan_routes
from app.api.v1.scoring import routes as scoring_routes
from app.api.v1.recommendations import routes as recommendation_routes
from app.api.v1.auth import routes as auth_routes
from app.api.v1.analytics import routes as analytics_routes
from app.api.v1.admin import routes as admin_routes
from app.api.v1.system import routes as system_routes
from app.api.v1.chat import routes as chat_routes
from app.middleware.rate_limiter import RateLimitMiddleware
from app.middleware.logger import StructuredLogMiddleware
import sentry_sdk

setup_logging()
logger = logging.getLogger(__name__)

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

import time
from app.models import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("✓ Configuration Loaded")
    
    # Verify Database Connection with retry loop
    db_connected = False
    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
                logger.info("✓ Database Connected successfully")
                db_connected = True
                
                # Ensure tables exist
                try:
                    Base.metadata.create_all(bind=engine)
                    logger.info("✓ Database tables verified/initialized")
                except Exception as table_err:
                    logger.warning(f"Note on table creation: {table_err}")
                break
        except Exception as e:
            if attempt < max_retries:
                logger.warning(f"Database connection attempt {attempt}/{max_retries} failed ({e}). Retrying in 2s...")
                time.sleep(2)
            else:
                logger.error(f"Database connection failed after {max_retries} attempts: {e}")
                raise e
        
    # Log Pipeline Configuration
    logger.info("✓ AI Pipeline Enabled")
    logger.info(f"  - Stage 1: Vision Extraction Model Loaded ({settings.GEMINI_MODEL})")
    logger.info(f"  - Stage 2: Reasoning Model Loaded ({settings.GROQ_REASONING_MODEL})")
        
    # Connect to Redis
    try:
        await redis_client.connect()
    except Exception as redis_err:
        logger.warning(f"Redis connection warning: {redis_err}")

    logger.info("✓ API Started successfully")
    yield
    
    # Shutdown actions
    await redis_client.disconnect()
    logger.info("API shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# Custom Middlewares
app.add_middleware(RateLimitMiddleware)
app.add_middleware(StructuredLogMiddleware)

# CORS Middleware
origins = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Exception Handlers
add_exception_handlers(app)

# Include Routers
app.include_router(auth_routes.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(analytics_routes.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(admin_routes.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(system_routes.router, prefix="/api/v1/system", tags=["System"])
app.include_router(health_routes.router, prefix="/api/v1/health", tags=["Health"])
app.include_router(profile_routes.router, prefix="/api/v1/profile", tags=["Profile"])
app.include_router(scan_routes.router, prefix="/api/v1/scan", tags=["Scan"])
app.include_router(scoring_routes.router, prefix="/api/v1/scoring", tags=["Scoring"])
app.include_router(recommendation_routes.router, prefix="/api/v1/recommendations", tags=["Recommendations"])
app.include_router(chat_routes.router, prefix="/api/v1/chat", tags=["Chat"])
