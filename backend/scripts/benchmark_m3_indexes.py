#!/usr/bin/env python3
"""
Compare Milestone 3 Query 1–10 wall time without vs with optional DB indexes.

Steps (one transaction):
  1. DROP six idx_m3_* indexes (if present)
  2. Run each query from app/sql/milestone3.py; each query is timed (min ms over 5 runs after one warm-up)
  3. CREATE indexes + ANALYZE from backend/sql/milestone3_indexes.sql
  4. Run the same timings again

Prints a markdown table to stdout. Requires DATABASE_URL in backend/.env (same as FastAPI).
Run from repo root: python backend/scripts/benchmark_m3_indexes.py
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
sys.path.insert(0, str(ROOT))

from app.db import get_engine  # noqa: E402
from app.sql import milestone3 as m  # noqa: E402

INDEX_NAMES = [
    "idx_m3_education_zip",
    "idx_m3_irs_income_zip",
    "idx_m3_real_estate_zip_beds_ok",
    "idx_m3_real_estate_zip_ppsqft_ok",
    "idx_m3_real_estate_zip_price_ok",
    "idx_m3_location_state_norm",
    "idx_m3_location_state",
]


def _drop_all(conn) -> None:
    for name in INDEX_NAMES:
        conn.execute(text(f"DROP INDEX IF EXISTS {name}"))


def _create_all(conn) -> None:
    sql_path = ROOT / "sql" / "milestone3_indexes.sql"
    raw = sql_path.read_text(encoding="utf-8")
    parts = []
    buf: list[str] = []
    for line in raw.splitlines():
        if line.strip().startswith("--"):
            continue
        buf.append(line)
        if ";" in line:
            chunk = "\n".join(buf).strip()
            if chunk:
                parts.append(chunk if chunk.endswith(";") else chunk + ";")
            buf = []
    tail = "\n".join(buf).strip()
    if tail:
        parts.append(tail if tail.endswith(";") else tail + ";")
    for stmt in parts:
        conn.execute(text(stmt))


def _bench_ms(conn, sql: str, params: dict, runs: int = 5) -> float:
    conn.execute(text(sql), params).all()
    best = float("inf")
    for _ in range(runs):
        t0 = time.perf_counter()
        conn.execute(text(sql), params).all()
        best = min(best, (time.perf_counter() - t0) * 1000)
    return best


def _all_queries() -> list[tuple[str, str, dict]]:
    explore = {
        "city": None,
        "state": "PA",
        "min_avg_price": None,
        "max_avg_price": None,
        "min_total_income": None,
        "max_total_income": None,
        "min_schools": None,
        "max_schools": None,
        "min_avg_bedrooms": None,
        "max_avg_bedrooms": None,
        "bed_rounds": None,
        "limit": 30,
        "offset": 0,
    }
    q3 = {"city": None, "state": "PA", "limit": 30, "offset": 0}
    rank = {"state": "PA", "city": None, "limit": 50, "offset": 0}
    zp = {"zip": "19104"}
    return [
        ("1 explore", m.SQL_QUERY1, explore),
        ("2 beats_state", m.SQL_QUERY2, explore),
        ("3 range_filters", m.SQL_QUERY3, q3),
        ("4 beats_national", m.SQL_QUERY4, explore),
        ("5 ranked income", m.SQL_QUERY5, rank),
        ("6 ranked price", m.SQL_QUERY6, rank),
        ("7 housing zip", m.SQL_QUERY7, zp),
        ("8 education zip", m.SQL_QUERY8, zp),
        ("9 irs totals zip", m.SQL_QUERY9, zp),
        ("10 irs brackets zip", m.SQL_QUERY10, zp),
    ]


def run_suite(conn) -> list[tuple[str, float]]:
    return [(label, _bench_ms(conn, sql, p)) for label, sql, p in _all_queries()]


def main() -> int:
    engine = get_engine()
    if engine is None:
        print("DATABASE_URL not set.", file=sys.stderr)
        return 1

    with engine.begin() as conn:
        _drop_all(conn)
        before = run_suite(conn)
        _create_all(conn)
        after = run_suite(conn)

    print("Milestone 3 — Query 1–10 timing (ms, min of 5 runs; SQL from milestone3.py unchanged)")
    print("Params: state=PA, city=NULL, limit=30 (rankings 50), zip=19104 for 7–10")
    print("Indexes: backend/sql/milestone3_indexes.sql (re-applied at end of run)")
    print()
    print("| Query | Without indexes | With indexes | Speedup |")
    print("|-------|----------------:|-------------:|--------:|")
    for (lb, b), (_, a) in zip(before, after, strict=True):
        sp = b / a if a > 0 else float("inf")
        print(f"| {lb} | {b:.2f} | {a:.2f} | {sp:.2f}x |")
    print()
    print("End state: indexes exist on the database (script recreates them after the “without” pass).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
