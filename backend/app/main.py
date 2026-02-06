"""
IoT Security Testing Platform - Unified Backend

Single FastAPI application combining all services:
- Authentication & Authorization
- Project & Sample Management
- Task Execution & Monitoring
- File Management
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.projects import router as projects_router
from app.api.samples import router as samples_router
from app.api.tasks import router as tasks_router
from app.api.reports import router as reports_router
from app.api.dashboard import router as dashboard_router
import app.workers  # Initialize workers and register them
import logging
import traceback

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

# CORS Middleware - Must be added early
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Global exception handler for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions with proper CORS headers"""
    logger.error(f"Unhandled exception for {request.method} {request.url}: {exc}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "error": str(exc) if settings.DEBUG else "Internal server error"
        }
    )

# Exception handler for HTTP exceptions
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with proper CORS headers"""
    logger.warning(f"HTTP {exc.status_code} for {request.method} {request.url}: {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with proper CORS headers"""
    logger.warning(f"Validation error for {request.method} {request.url}: {exc.errors()}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()}
    )

# Include routers
app.include_router(auth_router, prefix="/api/v1", tags=["Authentication"])
app.include_router(projects_router, prefix="/api/v1", tags=["Projects"])
app.include_router(samples_router, prefix="/api/v1", tags=["Samples"])
app.include_router(tasks_router, prefix="/api/v1", tags=["Tasks"])
app.include_router(reports_router, prefix="/api/v1", tags=["Reports"])
app.include_router(dashboard_router, prefix="/api/v1", tags=["Dashboard"])

@app.on_event("startup")
async def startup_event():
    """Initialize resources on startup"""
    logger.info("🚀 IoT Security Platform starting...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug Mode: {settings.DEBUG}")
    
    # Initialize task executor
    from app.core.task_executor import task_executor
    await task_executor.init_redis()
    logger.info("✅ Task executor initialized")
    
    # CRITICAL: Explicitly register all workers
    try:
        from app.workers.ping_scan import ping_scan_worker
        from app.workers.nmap_scan import nmap_scan_worker
        from app.workers.vuln_scan import vuln_scan_worker
        from app.workers.fuzzing_worker import fuzzing_worker
        
        # Force registration
        task_executor.task_registry["ping_scan"] = ping_scan_worker
        task_executor.task_registry["nmap_scan"] = nmap_scan_worker
        task_executor.task_registry["vuln_scan"] = vuln_scan_worker
        task_executor.task_registry["fuzzing"] = fuzzing_worker
        
        logger.info(f"✅ Registered workers: {list(task_executor.task_registry.keys())}")
        logger.info(f"🎉 Total workers registered: {len(task_executor.task_registry)}")
    except Exception as e:
        logger.error(f"❌ Failed to register workers: {e}")
        import traceback
        traceback.print_exc()

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
