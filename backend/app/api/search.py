from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models import Note, PlatformAccount, PublishJob, Task, User

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def search(
    q: str = Query(..., min_length=1, max_length=100, description="搜索关键词"),
    limit: int = Query(5, ge=1, le=20, description="每类结果最大数量"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, list[dict[str, Any]]]:
    keyword = f"%{q.strip()}%"

    # 搜索笔记
    notes = db.execute(
        select(Note)
        .where(
            Note.user_id == current_user.id,
            or_(Note.title.ilike(keyword), Note.content.ilike(keyword), Note.author_name.ilike(keyword)),
        )
        .order_by(Note.created_at.desc())
        .limit(limit)
    ).scalars().all()

    # 搜索账号
    accounts = db.execute(
        select(PlatformAccount)
        .where(
            PlatformAccount.user_id == current_user.id,
            PlatformAccount.nickname.ilike(keyword),
        )
        .order_by(PlatformAccount.created_at.desc())
        .limit(limit)
    ).scalars().all()

    # 搜索发布任务
    jobs = db.execute(
        select(PublishJob)
        .where(
            PublishJob.user_id == current_user.id,
            or_(PublishJob.title.ilike(keyword), PublishJob.body.ilike(keyword)),
        )
        .order_by(PublishJob.created_at.desc())
        .limit(limit)
    ).scalars().all()

    # 搜索任务中心
    tasks = db.execute(
        select(Task)
        .where(
            Task.user_id == current_user.id,
            Task.task_type.ilike(keyword),
        )
        .order_by(Task.created_at.desc())
        .limit(limit)
    ).scalars().all()

    result: dict[str, list[dict[str, Any]]] = {
        "notes": [
            {"id": n.id, "title": n.title or "未命名", "author": n.author_name or "", "url": f"/platforms/xhs/notes/{n.id}"}
            for n in notes
        ],
        "accounts": [
            {
                "id": a.id,
                "nickname": a.nickname or "未命名",
                "sub_type": a.sub_type or "",
                "url": "/platforms/xhs/accounts",
            }
            for a in accounts
        ],
        "publish_jobs": [
            {
                "id": j.id,
                "title": j.title or "未命名",
                "status": j.status,
                "url": f"/platforms/xhs/publish?job={j.id}",
            }
            for j in jobs
        ],
        "tasks": [
            {
                "id": t.id,
                "task_type": t.task_type,
                "status": t.status,
                "url": "/tasks",
            }
            for t in tasks
        ],
    }

    return result
