"""
ZIP-level search & detail — wired to Milestone 3 SQL (Location, Real_Estate, IRS_Income, Education).
"""

import re
from concurrent.futures import ThreadPoolExecutor
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session, sessionmaker

from app.db import get_session_factory
from app.deps import require_db
from app.schemas.zip_area import (
    EducationSummary,
    HousingSummary,
    IrsBracketRow,
    IrsTotals,
    ZipAreaCard,
    ZipDetailResponse,
    ZipScoreResponse,
    ZipSearchResponse,
)
from app.sql import milestone3 as sql

router = APIRouter()


def _q_none(s: str | None) -> str | None:
    if s is None:
        return None
    t = str(s).strip()
    return t if t else None


def _norm_city(s: str | None) -> str | None:
    """Trim and collapse internal whitespace so typeahead / URL match DB city strings."""
    t = _q_none(s)
    if t is None:
        return None
    return re.sub(r"\s+", " ", t)


class SearchMode(str, Enum):
    explore = "explore"  # Query 1
    range_filters = "range_filters"  # Query 3
    beats_state = "beats_state"  # Query 2
    beats_national = "beats_national"  # Query 4


def _zip_search_count_scalar(factory: sessionmaker, count_sql: str, count_params: dict):
    """Run COUNT query on its own Session (must not share the request Session across threads)."""
    s = factory()
    try:
        return s.execute(text(count_sql), count_params).scalar_one()
    finally:
        s.close()


def _row_to_card(row: dict, mode: SearchMode) -> ZipAreaCard:
    z = str(row.get("zip_code") or "").strip()
    avg_ppsq = row.get("avg_price_per_sqft")
    if hasattr(avg_ppsq, "__float__"):
        avg_ppsq = float(avg_ppsq) if avg_ppsq is not None else None
    return ZipAreaCard(
        id=z,
        zip_code=z,
        city=row.get("city"),
        state=row.get("state"),
        avg_housing_price=float(row["avg_housing_price"])
        if row.get("avg_housing_price") is not None
        else None,
        total_income=float(row["total_income"]) if row.get("total_income") is not None else None,
        num_schools=int(row["num_schools"]) if row.get("num_schools") is not None else None,
        avg_school_enrollment=float(row["avg_school_enrollment"])
        if row.get("avg_school_enrollment") is not None
        else None,
        income_price_ratio=float(row["income_price_ratio"])
        if row.get("income_price_ratio") is not None
        else None,
        avg_price_per_sqft=avg_ppsq,
        thumb_url=f"https://placehold.co/640x360/e2e8f0/1e293b?text=ZIP+{z}",
    )


@router.get("", response_model=ZipSearchResponse)
def search_zip_areas(
    search_mode: SearchMode = Query(SearchMode.explore, description="Maps to M3 Query 1–4"),
    city: str | None = Query(None, description="City — case-insensitive match to Location.city"),
    state: str | None = Query(None, description="State — case-insensitive (e.g. pa or PA)"),
    min_avg_price: float | None = Query(None, ge=0, description="Optional floor on ZIP avg listing price"),
    max_avg_price: float | None = Query(None, ge=0, description="Optional cap on ZIP avg listing price"),
    min_total_income: float | None = Query(None, ge=0, description="Optional min aggregated IRS income for ZIP"),
    max_total_income: float | None = Query(None, ge=0, description="Optional max aggregated IRS income"),
    min_schools: int | None = Query(None, ge=0, description="Optional min school count"),
    max_schools: int | None = Query(None, ge=0, description="Optional max school count"),
    min_avg_bedrooms: float | None = Query(None, ge=0, description="Optional min avg bedrooms in ZIP"),
    max_avg_bedrooms: float | None = Query(None, ge=0, description="Optional max avg bedrooms in ZIP"),
    bed_rounds: str | None = Query(
        None,
        description="Comma-separated integers; ZIP matches if ROUND(avg beds) is in this set (OR).",
    ),
    min_avg_price_q3: float = Query(150_000, ge=0, description="Query 3 mode: min avg price (required band)"),
    max_avg_price_q3: float = Query(500_000, ge=0, description="Query 3 mode: max avg price"),
    min_total_income_q3: float = Query(100_000, ge=0, description="Query 3 mode: min income"),
    max_total_income_q3: float = Query(400_000, ge=0, description="Query 3 mode: max income"),
    min_schools_q3: int = Query(3, ge=0, description="Query 3 mode: min schools"),
    max_schools_q3: int = Query(20, ge=0, description="Query 3 mode: max schools"),
    limit: int = Query(30, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(require_db),
):
    city_p = _norm_city(city)
    state_p = _q_none(state)
    state_upper = state_p.upper() if state_p else None
    br = _q_none(bed_rounds)

    explore_filters = {
        "city": city_p,
        "state": state_upper,
        "min_avg_price": min_avg_price,
        "max_avg_price": max_avg_price,
        "min_total_income": min_total_income,
        "max_total_income": max_total_income,
        "min_schools": min_schools,
        "max_schools": max_schools,
        "min_avg_bedrooms": min_avg_bedrooms,
        "max_avg_bedrooms": max_avg_bedrooms,
        "bed_rounds": br,
    }

    if search_mode == SearchMode.explore:
        count_sql, main_sql = sql.SQL_QUERY1_COUNT, sql.SQL_QUERY1
        count_params = {**explore_filters}
        main_params = {**explore_filters, "limit": limit, "offset": offset}
    elif search_mode == SearchMode.range_filters:
        count_sql, main_sql = sql.SQL_QUERY3_COUNT, sql.SQL_QUERY3
        count_params = {
            "city": city_p,
            "state": state_upper,
            "min_avg_price_q3": min_avg_price_q3,
            "max_avg_price_q3": max_avg_price_q3,
            "min_total_income_q3": min_total_income_q3,
            "max_total_income_q3": max_total_income_q3,
            "min_schools_q3": min_schools_q3,
            "max_schools_q3": max_schools_q3,
        }
        main_params = {**count_params, "limit": limit, "offset": offset}
    elif search_mode == SearchMode.beats_state:
        count_sql, main_sql = sql.SQL_QUERY2_COUNT, sql.SQL_QUERY2
        count_params = {**explore_filters}
        main_params = {**explore_filters, "limit": limit, "offset": offset}
    else:
        count_sql, main_sql = sql.SQL_QUERY4_COUNT, sql.SQL_QUERY4
        count_params = {**explore_filters}
        main_params = {**explore_filters, "limit": limit, "offset": offset}

    factory = get_session_factory()
    if factory is None:
        raise HTTPException(status_code=503, detail="Database not configured.")

    try:
        # COUNT and list query are independent: overlap wall time (count uses a second pooled Session).
        with ThreadPoolExecutor(max_workers=1) as pool:
            fut_count = pool.submit(_zip_search_count_scalar, factory, count_sql, count_params)
            rows = db.execute(text(main_sql), main_params).mappings().all()
            total = fut_count.result()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e!s}") from e

    items = [_row_to_card(dict(r), search_mode) for r in rows]
    return ZipSearchResponse(
        items=items,
        total=int(total or 0),
        limit=limit,
        offset=offset,
        search_mode=search_mode.value,
    )


@router.get("/{zip_code}/score", response_model=ZipScoreResponse)
def zip_score(zip_code: str, db: Session = Depends(require_db)):
    """Cached composite score and star rating for one ZIP."""
    z = zip_code.strip()
    if not z.isdigit() or len(z) != 5:
        raise HTTPException(status_code=400, detail="zip_code must be a 5-digit string")
    try:
        row = db.execute(text(sql.SQL_QUERY_SCORE), {"zip": z}).mappings().first()
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Database query failed: {ex!s}") from ex
    if not row:
        raise HTTPException(status_code=404, detail="No score data for this ZIP")
    return ZipScoreResponse(
        zip_code=z,
        final_score=float(row["final_score"]) if row.get("final_score") is not None else None,
        star_rating=int(row["star_rating"]) if row.get("star_rating") is not None else None,
    )


@router.get("/scores", response_model=list[ZipScoreResponse])
def batch_scores(
    zips: str = Query(..., description="Comma-separated ZIP codes e.g. 19104,19120"),
    db: Session = Depends(require_db),
):
    """Composite scores for multiple ZIPs in one request."""
    zip_list = [z.strip() for z in zips.split(",") if z.strip().isdigit() and len(z.strip()) == 5]
    if not zip_list:
        return []
    try:
        rows = db.execute(text(sql.SQL_QUERY_SCORE_BATCH), {"zips": zip_list}).mappings().all()
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Database query failed: {ex!s}") from ex
    return [
        ZipScoreResponse(
            zip_code=str(r["zip_code"]),
            final_score=float(r["final_score"]) if r.get("final_score") is not None else None,
            star_rating=int(r["star_rating"]) if r.get("star_rating") is not None else None,
        )
        for r in rows
    ]


@router.get("/ranked/by-income", response_model=list[dict])
def ranked_by_income(
    state: str | None = Query(None),
    city: str | None = Query(None),
    limit: int = Query(30, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(require_db),
):
    """Query 5 — ZIP codes ranked by total IRS income (highest first)."""
    try:
        rows = db.execute(text(sql.SQL_QUERY5), {
            "state": state.upper().strip() if state else None,
            "city": city.strip() if city else None,
            "limit": limit,
            "offset": offset,
        }).mappings().all()
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Database query failed: {ex!s}") from ex
    return [
        {**dict(r), "total_income": round(float(r["total_income"]), 2) if r.get("total_income") is not None else None}
        for r in rows
    ]


@router.get("/ranked/by-price", response_model=list[dict])
def ranked_by_price(
    state: str | None = Query(None),
    city: str | None = Query(None),
    limit: int = Query(30, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(require_db),
):
    """Query 6 — ZIP codes ranked by average housing price (cheapest first)."""
    try:
        rows = db.execute(text(sql.SQL_QUERY6), {
            "state": state.upper().strip() if state else None,
            "city": city.strip() if city else None,
            "limit": limit,
            "offset": offset,
        }).mappings().all()
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Database query failed: {ex!s}") from ex
    return [
        {**dict(r), "avg_housing_price": round(float(r["avg_housing_price"]), 2) if r.get("avg_housing_price") is not None else None}
        for r in rows
    ]


@router.get("/{zip_code}/housing", response_model=HousingSummary)
def zip_housing(zip_code: str, db: Session = Depends(require_db)):
    """Query 7 — housing summary for one ZIP."""
    z = zip_code.strip()
    if not z.isdigit() or len(z) != 5:
        raise HTTPException(status_code=400, detail="zip_code must be a 5-digit string")
    try:
        h = db.execute(text(sql.SQL_QUERY7), {"zip": z}).mappings().first()
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Database query failed: {ex!s}") from ex
    if not h:
        raise HTTPException(status_code=404, detail="No housing data for this ZIP")
    return HousingSummary(
        zip_code=z,
        avg_housing_price=round(float(h["avg_housing_price"])) if h.get("avg_housing_price") is not None else None,
        avg_house_size=round(float(h["avg_house_size"])) if h.get("avg_house_size") is not None else None,
        avg_bedrooms=round(float(h["avg_bedrooms"])) if h.get("avg_bedrooms") is not None else None,
        avg_bathrooms=round(float(h["avg_bathrooms"])) if h.get("avg_bathrooms") is not None else None,
    )


@router.get("/{zip_code}/education", response_model=EducationSummary)
def zip_education(zip_code: str, db: Session = Depends(require_db)):
    """Query 8 — school summary for one ZIP."""
    z = zip_code.strip()
    if not z.isdigit() or len(z) != 5:
        raise HTTPException(status_code=400, detail="zip_code must be a 5-digit string")
    try:
        e = db.execute(text(sql.SQL_QUERY8), {"zip": z}).mappings().first()
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Database query failed: {ex!s}") from ex
    if not e:
        raise HTTPException(status_code=404, detail="No education data for this ZIP")
    return EducationSummary(
        zip_code=z,
        total_schools=int(e["total_schools"]) if e.get("total_schools") is not None else None,
        avg_school_enrollment=float(e["avg_school_enrollment"]) if e.get("avg_school_enrollment") is not None else None,
    )


@router.get("/{zip_code}/income", response_model=IrsTotals)
def zip_income(zip_code: str, db: Session = Depends(require_db)):
    """Query 9 — IRS income totals for one ZIP."""
    z = zip_code.strip()
    if not z.isdigit() or len(z) != 5:
        raise HTTPException(status_code=400, detail="zip_code must be a 5-digit string")
    try:
        ir = db.execute(text(sql.SQL_QUERY9), {"zip": z}).mappings().first()
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Database query failed: {ex!s}") from ex
    if not ir:
        raise HTTPException(status_code=404, detail="No IRS data for this ZIP")
    return IrsTotals(
        zip_code=z,
        total_income=float(ir["total_income"]) if ir.get("total_income") is not None else None,
        total_wage_income=float(ir["total_wage_income"]) if ir.get("total_wage_income") is not None else None,
        total_interest_income=float(ir["total_interest_income"]) if ir.get("total_interest_income") is not None else None,
        total_dividend_income=float(ir["total_dividend_income"]) if ir.get("total_dividend_income") is not None else None,
        total_capital_gain=float(ir["total_capital_gain"]) if ir.get("total_capital_gain") is not None else None,
    )


@router.get("/{zip_code}/income-bracket", response_model=list[IrsBracketRow])
def zip_income_bracket(zip_code: str, db: Session = Depends(require_db)):
    """Query 10 — IRS income by bracket for one ZIP."""
    z = zip_code.strip()
    if not z.isdigit() or len(z) != 5:
        raise HTTPException(status_code=400, detail="zip_code must be a 5-digit string")
    try:
        rows = db.execute(text(sql.SQL_QUERY10), {"zip": z}).mappings().all()
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Database query failed: {ex!s}") from ex
    return [
        IrsBracketRow(
            zip_code=z,
            income_bracket=str(r["income_bracket"]) if r.get("income_bracket") is not None else None,
            num_returns=int(r["num_returns"]) if r.get("num_returns") is not None else None,
            total_income=float(r["total_income"]) if r.get("total_income") is not None else None,
            wage_income=float(r["wage_income"]) if r.get("wage_income") is not None else None,
            interest_income=float(r["interest_income"]) if r.get("interest_income") is not None else None,
            dividend_income=float(r["dividend_income"]) if r.get("dividend_income") is not None else None,
            capital_gain=float(r["capital_gain"]) if r.get("capital_gain") is not None else None,
        )
        for r in rows
    ]


@router.get("/{zip_code}", response_model=ZipDetailResponse)
def zip_detail(zip_code: str, db: Session = Depends(require_db)):
    """Milestone 3 queries 7–10 for one ZIP."""
    z = zip_code.strip()
    if not z.isdigit() or len(z) != 5:
        raise HTTPException(status_code=400, detail="zip_code must be a 5-digit string")

    p = {"zip": z}
    try:
        loc = db.execute(
            text(
                """
                SELECT TRIM(city) AS city, TRIM(state) AS state
                FROM Location
                WHERE zip_code = :zip
                LIMIT 1
                """
            ),
            p,
        ).mappings().first()
        h = db.execute(text(sql.SQL_QUERY7), p).mappings().first()
        e = db.execute(text(sql.SQL_QUERY8), p).mappings().first()
        ir = db.execute(text(sql.SQL_QUERY9), p).mappings().first()
        br = db.execute(text(sql.SQL_QUERY10), p).mappings().all()
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Database query failed: {ex!s}") from ex

    loc_city = None
    loc_state = None
    if loc:
        c = loc.get("city")
        s = loc.get("state")
        if c is not None and str(c).strip():
            loc_city = str(c).strip()
        if s is not None and str(s).strip():
            loc_state = str(s).strip()

    housing = None
    if h:
        housing = HousingSummary(
            zip_code=z,
            avg_housing_price=round(float(h["avg_housing_price"])) if h.get("avg_housing_price") is not None else None,
            avg_house_size=round(float(h["avg_house_size"])) if h.get("avg_house_size") is not None else None,
            avg_bedrooms=round(float(h["avg_bedrooms"])) if h.get("avg_bedrooms") is not None else None,
            avg_bathrooms=round(float(h["avg_bathrooms"])) if h.get("avg_bathrooms") is not None else None,
        )
    education = None
    if e:
        education = EducationSummary(
            zip_code=z,
            total_schools=int(e["total_schools"]) if e.get("total_schools") is not None else None,
            avg_school_enrollment=float(e["avg_school_enrollment"])
            if e.get("avg_school_enrollment") is not None
            else None,
        )
    irs_totals = None
    if ir:
        irs_totals = IrsTotals(
            zip_code=z,
            total_income=float(ir["total_income"]) if ir.get("total_income") is not None else None,
            total_wage_income=float(ir["total_wage_income"])
            if ir.get("total_wage_income") is not None
            else None,
            total_interest_income=float(ir["total_interest_income"])
            if ir.get("total_interest_income") is not None
            else None,
            total_dividend_income=float(ir["total_dividend_income"])
            if ir.get("total_dividend_income") is not None
            else None,
            total_capital_gain=float(ir["total_capital_gain"])
            if ir.get("total_capital_gain") is not None
            else None,
        )
    irs_by_bracket = []
    for row in br:
        d = dict(row)
        irs_by_bracket.append(
            IrsBracketRow(
                zip_code=z,
                income_bracket=str(d.get("income_bracket")) if d.get("income_bracket") is not None else None,
                num_returns=int(d["num_returns"]) if d.get("num_returns") is not None else None,
                total_income=float(d["total_income"]) if d.get("total_income") is not None else None,
                wage_income=float(d["wage_income"]) if d.get("wage_income") is not None else None,
                interest_income=float(d["interest_income"])
                if d.get("interest_income") is not None
                else None,
                dividend_income=float(d["dividend_income"])
                if d.get("dividend_income") is not None
                else None,
                capital_gain=float(d["capital_gain"]) if d.get("capital_gain") is not None else None,
            )
        )

    if housing is None and education is None and irs_totals is None and not irs_by_bracket:
        raise HTTPException(status_code=404, detail="No data for this ZIP")

    return ZipDetailResponse(
        zip_code=z,
        city=loc_city,
        state=loc_state,
        housing=housing,
        education=education,
        irs_totals=irs_totals,
        irs_by_bracket=irs_by_bracket,
    )
