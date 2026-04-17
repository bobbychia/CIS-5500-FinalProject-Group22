"""
Facets: histogram, states, city typeahead (Expedia-style narrowing).
"""

import re

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.deps import require_db

router = APIRouter()


def _norm_state(s: str | None) -> str | None:
    if not s or not str(s).strip():
        return None
    return str(s).strip().upper()


@router.get("/price-histogram")
def price_histogram(
    state: str | None = Query(None, description="Optional state to scope averages"),
    db: Session = Depends(require_db),
):
    """
    Histogram of average listing price per ZIP (for slider + bar chart).
    Bins are fixed bands in dollars.
    """
    st = _norm_state(state)
    sql = text(
        """
        WITH hs AS (
            SELECT AVG(r.price) AS avgp
            FROM Real_Estate r
            JOIN Location l ON r.zip_code = l.zip_code
            WHERE r.price IS NOT NULL AND r.price >= 50000
              AND (:state IS NULL OR UPPER(TRIM(l.state)) = :state)
            GROUP BY r.zip_code
        ),
        binned AS (
            SELECT
                CASE
                    WHEN avgp < 200000 THEN 1
                    WHEN avgp < 400000 THEN 2
                    WHEN avgp < 600000 THEN 3
                    WHEN avgp < 800000 THEN 4
                    WHEN avgp < 1200000 THEN 5
                    ELSE 6
                END AS bin_id,
                CASE
                    WHEN avgp < 200000 THEN '0–200k'
                    WHEN avgp < 400000 THEN '200k–400k'
                    WHEN avgp < 600000 THEN '400k–600k'
                    WHEN avgp < 800000 THEN '600k–800k'
                    WHEN avgp < 1200000 THEN '800k–1.2M'
                    ELSE '1.2M+'
                END AS label,
                CASE
                    WHEN avgp < 200000 THEN 0
                    WHEN avgp < 400000 THEN 200000
                    WHEN avgp < 600000 THEN 400000
                    WHEN avgp < 800000 THEN 600000
                    WHEN avgp < 1200000 THEN 800000
                    ELSE 1200000
                END AS bin_min,
                CASE
                    WHEN avgp < 200000 THEN 200000
                    WHEN avgp < 400000 THEN 400000
                    WHEN avgp < 600000 THEN 600000
                    WHEN avgp < 800000 THEN 800000
                    WHEN avgp < 1200000 THEN 1200000
                    ELSE 5000000
                END AS bin_max,
                avgp
            FROM hs
        )
        SELECT bin_id, label, bin_min, bin_max, COUNT(*)::int AS count
        FROM binned
        GROUP BY bin_id, label, bin_min, bin_max
        ORDER BY bin_id
        """
    )
    rows = db.execute(sql, {"state": st}).mappings().all()
    bounds = db.execute(
        text(
            """
            SELECT MIN(avgp)::float AS mn, MAX(avgp)::float AS mx
            FROM (
                SELECT AVG(r.price) AS avgp
                FROM Real_Estate r
                JOIN Location l ON r.zip_code = l.zip_code
                WHERE r.price IS NOT NULL AND r.price >= 50000
                  AND (:state IS NULL OR UPPER(TRIM(l.state)) = :state)
                GROUP BY r.zip_code
            ) t
            """
        ),
        {"state": st},
    ).mappings().first()
    mn = bounds["mn"] if bounds and bounds["mn"] is not None else 0.0
    mx = bounds["mx"] if bounds and bounds["mx"] is not None else 2_000_000.0
    return {
        "bins": [dict(r) for r in rows],
        "price_min": mn,
        "price_max": mx,
    }


@router.get("/states")
def list_states(db: Session = Depends(require_db)):
    rows = db.execute(
        text("SELECT DISTINCT state FROM Location WHERE state IS NOT NULL ORDER BY state")
    ).all()
    return {"items": [r[0] for r in rows]}


@router.get("/cities")
def city_suggest(
    q: str = Query("", max_length=120, description="Typeahead — case-insensitive substring"),
    state: str | None = Query(None, description="If restrict_state=true, only cities in this state"),
    restrict_state: bool = Query(
        False,
        description="When true, filter by state (typing Boston while PA is selected returns nothing). Default false so suggestions work like Expedia.",
    ),
    limit: int = Query(15, ge=1, le=40),
    db: Session = Depends(require_db),
):
    """Distinct city names for autocomplete. By default searches all states so 'Boston' matches even if sidebar state is PA."""
    st = _norm_state(state) if restrict_state else None
    # Collapse repeated spaces so "san  diego" matches DB "San Diego"
    qq = re.sub(r"\s+", " ", (q or "").strip())
    sql = text(
        """
        SELECT DISTINCT TRIM(city) AS city
        FROM Location
        WHERE city IS NOT NULL AND TRIM(city) <> ''
          AND (:state IS NULL OR UPPER(TRIM(state)) = :state)
          AND (
            :q = ''
            OR LOWER(TRIM(city)) LIKE '%' || LOWER(:q) || '%'
          )
        ORDER BY
          CASE
            WHEN :q = '' THEN 0
            WHEN LOWER(TRIM(city)) LIKE LOWER(:q) || '%' THEN 0
            ELSE 1
          END,
          city ASC
        LIMIT :limit
        """
    )
    rows = db.execute(sql, {"state": st, "q": qq, "limit": limit}).all()
    return {"items": [r[0] for r in rows]}
