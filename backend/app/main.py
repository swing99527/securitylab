"""
IoT Security Testing Platform - Unified Backend

Single FastAPI application combining all services:
- Authentication & Authorization
- Project & Sample Management
- Task Execution & Monitoring
- File Management
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.projects import router as projects_router
from app.api.samples import router as samples_router
from app.api.tasks import router as tasks_router
from app.api.reports import router as reports_router
import app.workers  # Initialize workers and register them
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="IoT Security Testing Platform API",
    description="Backend API for IoT Security Lab Testing System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1", tags=["Authentication"])
app.include_router(projects_router, prefix="/api/v1", tags=["Projects"])
app.include_router(samples_router, prefix="/api/v1", tags=["Samples"])
app.include_router(tasks_router, prefix="/api/v1", tags=["Tasks"])
app.include_router(reports_router, prefix="/api/v1", tags=["Reports"])

@app.on_event("startup")
async def startup_event():
    """Initialize resources on startup"""
    logger.info("🚀 IoT Security Platform starting...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug Mode: {settings.DEBUG}")
    
    # Initialize task executor
    from app.core.task_executor import task_executor
    import app.workers  # Register task types
    await task_executor.init_redis()
    logger.info("✅ Task executor initialized")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on shutdown"""
    logger.info("👋 IoT Security Platform shutting down...")
    
    # Close task executor
    from app.core.task_executor import task_executor
    await task_executor.close()
    logger.info("✅ Task executor closed")

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "iot-security-platform",
        "version": "1.0.0"
    }

@app.get("/", include_in_schema=False)
async def root():
    """Redirect to API documentation"""
    return RedirectResponse(url="/api/docs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
