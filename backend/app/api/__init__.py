"""API routers package"""
from fastapi import APIRouter

# Auth router
auth = APIRouter()

@auth.get("/health")
async def auth_health():
    return {"module": "auth", "status": "ok"}

# Projects router
projects = APIRouter()

@projects.get("/projects")
async def list_projects():
    return {"projects": [], "message": "Projects endpoint ready"}

# Samples router  
samples = APIRouter()

@samples.get("/samples")
async def list_samples():
    return {"samples": [], "message": "Samples endpoint ready"}

# Tasks router
tasks = APIRouter()

@tasks.get("/tasks")
async def list_tasks():
    return {"tasks": [], "message": "Tasks endpoint ready"}

# Files router
files = APIRouter()

@files.get("/files")
async def list_files():
    return {"files": [], "message": "Files endpoint ready"}

# Compliance router
compliance = APIRouter()

@compliance.get("/compliance")
async def list_compliance():
    return {"items": [], "message": "Compliance endpoint ready"}

# Knowledge base router
knowledge = APIRouter()

@knowledge.get("/knowledge")
async def list_knowledge():
    return {"articles": [], "message": "Knowledge base endpoint ready"}

#from .auth import router as auth
from .projects import router as projects
from .samples import router as samples
from .tasks import router as tasks
#from .files import router as files
#from .compliance import router as compliance
#from .knowledge import router as knowledge
from .dashboard import router as dashboard

router = APIRouter()

router.include_router(auth)
router.include_router(projects)
router.include_router(samples)
router.include_router(tasks)
router.include_router(files)
router.include_router(compliance)
router.include_router(knowledge)
router.include_router(dashboard)
