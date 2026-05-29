"""Vercel Serverless Function entry point."""
import os
import sys
from pathlib import Path

_api_root = Path(__file__).resolve().parent
_project_root = _api_root.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse, JSONResponse

from backend.app.api import accounts, admin, ai, auth, auto_tasks, drafts, files, keyword_groups, login_sessions, model_configs, notes, notifications, publish, search, tags, tasks
from backend.app.api.platforms import registry
from backend.app.api.platforms.xhs import analytics, crawl, creator, monitoring, pc
from backend.app.core.config import get_settings
from backend.app.core.database import init_db as _init_db

settings = get_settings()

# Initialize database - catch errors so the app still starts
_db_init_ok = True
_db_init_error = ""
try:
    _init_db()
except Exception as _e:
    _db_init_ok = False
    _db_init_error = f"{type(_e).__name__}: {_e}"

app = FastAPI(title=settings.api_title)

origins = [o.strip() for o in settings.backend_cors_origins.split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "spider-xhs", "db_ok": _db_init_ok}

@app.get("/api/_debug")
def _debug():
    cwd = Path.cwd()
    frontend_dirs = list(cwd.rglob("dist/index.html"))
    return {
        "cwd": str(cwd),
        "db_init_ok": _db_init_ok,
        "db_init_error": _db_init_error,
        "frontend_dist_exists": (cwd / "frontend" / "dist").is_dir(),
        "public_exists": (cwd / "public").is_dir(),
        "dist_index_html_exists": (cwd / "frontend" / "dist" / "index.html").exists(),
        "dist_files": [str(f.relative_to(cwd / "frontend" / "dist")) for f in (cwd / "frontend" / "dist").iterdir()][:30] if (cwd / "frontend" / "dist").is_dir() else [],
        "rglob_index": [str(f) for f in frontend_dirs],
    }

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

# --- Frontend serving ---
# Try to find index.html in multiple locations
INDEX_CANDIDATES = [
    Path.cwd() / "frontend" / "dist" / "index.html",
    _project_root / "frontend" / "dist" / "index.html",
    Path.cwd() / "public" / "index.html",
    _project_root / "public" / "index.html",
]

index_html = None
for candidate in INDEX_CANDIDATES:
    if candidate.exists():
        index_html = candidate
        break

if index_html:
    @app.get("/")
    async def _root():
        return FileResponse(str(index_html))

    @app.api_route("/{path:path}", methods=["GET"])
    async def _spa_fallback(path: str):
        return FileResponse(str(index_html))
