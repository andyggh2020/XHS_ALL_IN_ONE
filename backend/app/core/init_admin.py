"""Initialize the first admin user for the membership system.

Run with: python -m backend.app.core.init_admin

This script promotes the first user in the database to admin status
and upgrades them to enterprise membership level.
"""
from __future__ import annotations

from backend.app.core.database import SessionLocal, init_db
from backend.app.models import User


def init_first_admin() -> None:
    init_db()
    db = SessionLocal()
    try:
        user = db.query(User).order_by(User.id.asc()).first()
        if user is None:
            print("No users found. Please register first via the UI.")
            return
        if not user.is_admin:
            user.is_admin = True
            user.membership_level = "enterprise"
            db.commit()
            print(f"User '{user.username}' (ID={user.id}) promoted to admin + enterprise.")
        else:
            print(f"User '{user.username}' is already admin.")
    finally:
        db.close()


if __name__ == "__main__":
    init_first_admin()
