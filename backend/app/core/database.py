from __future__ import annotations

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from backend.app.core.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()

# Vercel's Prisma Postgres integration injects DATABASE_URL env var which overrides
# our sqlite config. Explicitly use sqlite when DATABASE_TYPE is set to sqlite.
_connect_args = {}
_database_url = settings.database_url
if settings.database_type == "sqlite":
    import os as _os
    db_path = settings.database_sqlite_path
    try:
        _os.makedirs(_os.path.dirname(_os.path.abspath(db_path)) or ".", exist_ok=True)
    except OSError:
        import tempfile
        db_name = _os.path.basename(db_path) or "spider_xhs.db"
        db_path = _os.path.join(tempfile.gettempdir(), db_name)
        _os.makedirs(_os.path.dirname(_os.path.abspath(db_path)), exist_ok=True)
    _database_url = f"sqlite:///{db_path}"
    _connect_args["check_same_thread"] = False

engine = create_engine(_database_url, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@event.listens_for(engine, "connect")
def _configure_sqlite_connection(dbapi_connection, connection_record) -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=MEMORY")
    cursor.close()


def init_db(bind=engine) -> None:
    import backend.app.models  # noqa: F401

    _run_alembic_migrations()
    _add_user_membership_columns(bind)
    _normalize_model_config_names(bind)
    _normalize_sqlite_datetime_storage(bind)
    _seed_default_admin(bind)


def _add_user_membership_columns(bind) -> None:
    """Add is_admin, membership_level, membership_expires_at columns if missing."""
    inspector = inspect(bind)
    if "users" not in inspector.get_table_names():
        return
    existing = {c["name"] for c in inspector.get_columns("users")}
    with bind.begin() as conn:
        if "is_admin" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0"))
        if "membership_level" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN membership_level VARCHAR(20) DEFAULT 'free'"))
        if "membership_expires_at" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN membership_expires_at DATETIME"))


def _run_alembic_migrations() -> None:
    try:
        from alembic import command
        from alembic.config import Config

        import os

        ini_path = os.path.join(os.path.dirname(__file__), "..", "..", "alembic.ini")
        ini_path = os.path.normpath(ini_path)
        if not os.path.exists(ini_path):
            Base.metadata.create_all(bind=engine)
            return

        alembic_cfg = Config(ini_path)
        alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)

        inspector = inspect(engine)
        has_tables = bool(inspector.get_table_names())
        has_alembic = "alembic_version" in inspector.get_table_names()

        if has_tables and not has_alembic:
            command.stamp(alembic_cfg, "head")
        else:
            command.upgrade(alembic_cfg, "head")
    except ImportError:
        Base.metadata.create_all(bind=engine)


def _normalize_model_config_names(bind) -> None:
    inspector = inspect(bind)
    table_names = set(inspector.get_table_names())
    if "model_configs" not in table_names:
        return

    with bind.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE IF NOT EXISTS app_migrations ("
                "name VARCHAR(128) PRIMARY KEY, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL)"
            )
        )
        applied = connection.execute(
            text("SELECT name FROM app_migrations WHERE name = 'normalize_legacy_gpt_54_model_name_v1'")
        ).first()
        if applied:
            return
        connection.execute(text("UPDATE model_configs SET model_name = 'gpt-5.4' WHERE model_name = 'gpt5.4'"))
        connection.execute(text("INSERT INTO app_migrations (name) VALUES ('normalize_legacy_gpt_54_model_name_v1')"))


def _normalize_sqlite_datetime_storage(bind) -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    datetime_columns = {
        "users": ["created_at"],
        "platform_accounts": ["created_at", "updated_at"],
        "account_cookie_versions": ["created_at"],
        "login_sessions": ["created_at"],
        "notes": ["created_at"],
        "model_configs": ["created_at"],
        "ai_drafts": ["created_at"],
        "ai_generated_assets": ["created_at"],
        "publish_jobs": ["created_at", "published_at"],
        "tasks": ["created_at"],
        "monitoring_targets": ["created_at", "updated_at", "last_refreshed_at"],
        "monitoring_snapshots": ["created_at"],
        "keyword_groups": ["created_at", "updated_at"],
        "api_logs": ["created_at"],
    }
    with bind.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE IF NOT EXISTS app_migrations ("
                "name VARCHAR(128) PRIMARY KEY, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL)"
            )
        )
        applied = connection.execute(
            text("SELECT name FROM app_migrations WHERE name = 'sqlite_datetime_asia_shanghai_v1'")
        ).first()

        inspector = inspect(bind)
        table_names = set(inspector.get_table_names())
        if not applied:
            for table_name, column_names in datetime_columns.items():
                if table_name not in table_names:
                    continue
                existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
                for column_name in column_names:
                    if column_name not in existing_columns:
                        continue
                    connection.execute(
                        text(f"UPDATE {table_name} SET {column_name} = datetime({column_name}, '+8 hours') WHERE {column_name} IS NOT NULL")
                    )
            connection.execute(text("INSERT INTO app_migrations (name) VALUES ('sqlite_datetime_asia_shanghai_v1')"))

        scheduled_at_applied = connection.execute(
            text("SELECT name FROM app_migrations WHERE name = 'sqlite_publish_scheduled_at_asia_shanghai_v1'")
        ).first()
        if scheduled_at_applied:
            return
        if "publish_jobs" in table_names and "scheduled_at" in {column["name"] for column in inspector.get_columns("publish_jobs")}:
            connection.execute(
                text("UPDATE publish_jobs SET scheduled_at = datetime(scheduled_at, '+8 hours') WHERE scheduled_at IS NOT NULL")
            )
        connection.execute(text("INSERT INTO app_migrations (name) VALUES ('sqlite_publish_scheduled_at_asia_shanghai_v1')"))


def _seed_default_admin(bind) -> None:
    """Create a default admin user if no users exist yet (useful for fresh Vercel deploys)."""
    inspector = inspect(bind)
    if "users" not in inspector.get_table_names():
        return
    from backend.app.core.security import hash_password
    from sqlalchemy import select as sa_select
    from backend.app.models import User
    with SessionLocal() as db:
        existing = db.scalar(sa_select(User).where(User.username == "admin"))
        if existing is None:
            admin = User(
                username="admin",
                password_hash=hash_password("admin123"),
                is_admin=True,
                membership_level="admin",
            )
            db.add(admin)
            db.commit()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
