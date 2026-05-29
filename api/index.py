"""Vercel Serverless Function entry point.

All API routes are handled by the FastAPI app from backend.app.main.
"""
import os
import sys
from pathlib import Path

# Ensure project root is in sys.path for imports like backend.app.*
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

# Health check
@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "service": "spider-xhs"}

# Debug: check if frontend files exist
@app.get("/api/debug", tags=["debug"])
def debug():
    import os
    root = Path(__file__).resolve().parent
    paths_to_check = [
        ("root", root),
        ("root/frontend", root / "frontend"),
        ("root/frontend/dist", root / "frontend" / "dist"),
        ("root/frontend/dist/index.html", root / "frontend" / "dist" / "index.html"),
        ("root/public", root / "public"),
        ("root/public/index.html", root / "public" / "index.html"),
        ("cwd", Path.cwd()),
        ("cwd/frontend/dist", Path.cwd() / "frontend" / "dist"),
    ]
    result = {}
    for name, p in paths_to_check:
        result[name] = {"exists": p.exists(), "is_dir": p.is_dir() if p.exists() else None}
        if p.exists() and p.is_dir():
            try:
                result[name]["files"] = [str(f.relative_to(p)) for f in p.iterdir()][:20]
            except Exception:
                result[name]["files"] = "error listing"
    result["env_debug"] = {k: v for k, v in sorted(os.environ.items()) if "VERCEL" in k or "FRONTEND" in k or "DATABASE" in k or "SECRET" in k}
    return result

# Import all API routes
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

# Serve frontend static files + SPA fallback
frontend_candidates = [
    Path(__file__).resolve().parent / "frontend" / "dist",
    Path(__file__).resolve().parent.parent / "frontend" / "dist",
    Path.cwd() / "frontend" / "dist",
    Path(__file__).resolve().parent / "public",
    Path(__file__).resolve().parent.parent / "public",
    Path.cwd() / "public",
]

frontend_dist = None
for candidate in frontend_candidates:
    if candidate.is_dir() and (candidate / "index.html").exists():
        frontend_dist = candidate
        break

print(f"[vercel] frontend_dist = {frontend_dist}")

if frontend_dist:
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")

    @app.middleware("http")
    async def _spa_fallback(request: Request, call_next):
        response = await call_next(request)
        path = request.url.path
        if (
            response.status_code == 404
            and not path.startswith("/api")
            and "." not in path.split("/")[-1]
        ):
            return FileResponse(str(frontend_dist / "index.html"))
        return response
