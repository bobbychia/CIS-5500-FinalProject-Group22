"""
Database session factory. Wire SQLAlchemy engine to DATABASE_URL when ready.
For Milestone 4 mentor check-in, endpoints can return mock data until queries are connected.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

_engine = None
_SessionLocal: sessionmaker | None = None


def get_engine():
    global _engine
    if not settings.database_url:
        return None
    if _engine is None:
        _engine = create_engine(settings.database_url, pool_pre_ping=True)
    return _engine


def get_session_factory() -> sessionmaker | None:
    global _SessionLocal
    engine = get_engine()
    if engine is None:
        return None
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _SessionLocal


def get_db() -> Session | None:
    """FastAPI dependency: yields a DB session or None if DATABASE_URL unset."""
    factory = get_session_factory()
    if factory is None:
        yield None
        return
    db = factory()
    try:
        yield db
    finally:
        db.close()
