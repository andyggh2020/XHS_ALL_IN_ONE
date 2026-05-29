"""Vercel Serverless Function entry point."""
import os
import sys
from pathlib import Path

_api_root = Path(__file__).resolve().parent
_project_root = _api_root.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

from backend.app.api import accounts, admin, ai, auth, auto_tasks, drafts, files, keyword_groups, login_sessions, model_configs, notes, notifications, publish, search, tags, tasks
from backend.app.api.platforms import registry
from backend.app.api.platforms.xhs import analytics, crawl, creator, monitoring, pc
from backend.app.core.config import get_settings
from backend.app.core.database import init_db
from backend.app.services.scheduler_service import run_due_auto_tasks, shutdown_due_publish_scheduler, start_due_publish_scheduler

settings = get_settings()

app = FastAPI(title=settings.api_title)

# CORS
origins = [o.strip() for o in settings.backend_cors_origins.split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "spider-xhs"}

# Register all API routes
app.include_router(registry.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(login_sessions.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(drafts.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(model_configs.router, prefix="/api")
app.include_router(tags.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(keyword_groups.router, prefix="/api")
app.include_router(publish.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(pc.router, prefix="/api")
app.include_router(creator.router, prefix="/api")
app.include_router(crawl.router, prefix="/api")
app.include_router(monitoring.router, prefix="/api")
app.include_router(auto_tasks.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# Try to find frontend build directory
frontend_dist = Path.cwd() / "frontend" / "dist"
if not frontend_dist.is_dir():
    frontend_dist = _project_root / "frontend" / "dist"

if frontend_dist.is_dir():
    print(f"[vercel] serving frontend from {frontend_dist}")
    # Mount static files (serves index.html, assets/*, etc.)
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")

    # SPA fallback middleware
    @app.middleware("http")
    async def _spa_fallback(request: Request, call_next):
        response = await call_next(request)
        path = request.url.path
        if (
            response.status_code == 404
            and not path.startswith("/api")
            and "." not in path.split("/")[-1]
        ):
            idx = frontend_dist / "index.html"
            if idx.exists():
                return FileResponse(str(idx))
        return response
else:
    print(f"[vercel] WARNING: frontend_dist NOT FOUND at {frontend_dist}")
