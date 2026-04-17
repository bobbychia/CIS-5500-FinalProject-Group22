"""Shared FastAPI dependencies."""

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db


def require_db(db: Session | None = Depends(get_db)) -> Session:
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Database not configured. Copy backend/.env.example to backend/.env and set DATABASE_URL (including password).",
        )
    return db
