from __future__ import annotations

from datetime import timedelta
from typing import Optional

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_admin, get_current_user
from backend.app.core.time import shanghai_now
from backend.app.models import User
from backend.app.models.user import MEMBERSHIP_LEVELS

router = APIRouter(prefix="/admin", tags=["admin"])


class UserListItem(BaseModel):
    id: int
    username: str
    is_admin: bool
    membership_level: str
    membership_expires_at: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class UpdateMembershipPayload(BaseModel):
    membership_level: Optional[str] = Field(None, pattern="^(free|pro|enterprise)$")
    is_admin: Optional[bool] = None
    expires_in_days: Optional[int] = Field(None, ge=1, le=3650)


class MembershipPlan(BaseModel):
    level: str
    name: str
    price_monthly: int
    price_yearly: int
    features: list[str]


MEMBERSHIP_PLANS: list[MembershipPlan] = [
    MembershipPlan(
        level="free",
        name="免费版",
        price_monthly=0,
        price_yearly=0,
        features=["单账号绑定", "每日 50 条采集", "基础搜索", "内容库管理", "Excel 导出"],
    ),
    MembershipPlan(
        level="pro",
        name="专业版",
        price_monthly=99,
        price_yearly=948,
        features=["5 个账号绑定", "每日 500 条采集", "AI 智能改写", "AI 图片处理", "一键发布", "定时发布"],
    ),
    MembershipPlan(
        level="enterprise",
        name="企业版",
        price_monthly=299,
        price_yearly=2868,
        features=["无限账号绑定", "不限量采集", "AI 高级改写", "AI 封面生成", "全自动运营 7×24", "视频发布", "API 开放"],
    ),
]


def _serialize_user_item(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "is_admin": user.is_admin,
        "membership_level": user.membership_level,
        "membership_expires_at": user.membership_expires_at.isoformat() if user.membership_expires_at else None,
        "created_at": user.created_at.isoformat() if user.created_at else "",
    }


@router.get("/users", response_model=dict)
def list_users(
    q: Optional[str] = Query(None, description="搜索用户名"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """管理员获取用户列表"""
    stmt = select(User)
    if q:
        stmt = stmt.where(User.username.contains(q.strip()))
    stmt = stmt.order_by(User.created_at.desc())

    total = db.scalar(select(User.id).select_from(stmt.subquery())) or 0
    users = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [_serialize_user_item(u) for u in users],
    }


@router.put("/users/{user_id}")
def update_user_membership(
    user_id: int,
    payload: UpdateMembershipPayload,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """管理员修改用户会员等级"""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    if payload.membership_level is not None:
        user.membership_level = payload.membership_level

    if payload.is_admin is not None:
        user.is_admin = payload.is_admin

    if payload.expires_in_days is not None:
        user.membership_expires_at = shanghai_now() + timedelta(days=payload.expires_in_days)
    elif payload.membership_level == "free":
        user.membership_expires_at = None

    db.commit()
    db.refresh(user)
    return _serialize_user_item(user)


@router.get("/membership/plans", response_model=list[MembershipPlan])
def get_membership_plans():
    """获取会员方案列表"""
    return MEMBERSHIP_PLANS


@router.get("/membership/me")
def get_my_membership(current_user: User = Depends(get_current_user)):
    """当前用户的会员信息"""
    return _serialize_user_item(current_user)
