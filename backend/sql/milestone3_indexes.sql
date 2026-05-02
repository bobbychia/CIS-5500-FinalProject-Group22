-- Milestone 3: optional btree / partial indexes for ZIP-area workloads (Postgres).
-- Apply with: cd backend && psql "$DATABASE_URL" -f sql/milestone3_indexes.sql
-- (strip sqlalchemy +psycopg2 prefix to plain postgresql:// for psql if needed.)
-- Or: python scripts/benchmark_m3_indexes.py  (creates indexes at end of benchmark)

CREATE INDEX IF NOT EXISTS idx_m3_location_state ON location (state);

-- Matches WHERE UPPER(TRIM(l.state)) = UPPER(TRIM(:state)) on Quick / search modes 2–4.
CREATE INDEX IF NOT EXISTS idx_m3_location_state_norm ON location ((upper(trim(state))));

CREATE INDEX IF NOT EXISTS idx_m3_real_estate_zip_price_ok
  ON real_estate (zip_code)
  WHERE price IS NOT NULL AND price >= 50000;

CREATE INDEX IF NOT EXISTS idx_m3_real_estate_zip_ppsqft_ok
  ON real_estate (zip_code)
  WHERE house_size > 0 AND price IS NOT NULL AND price >= 50000;

CREATE INDEX IF NOT EXISTS idx_m3_real_estate_zip_beds_ok
  ON real_estate (zip_code)
  WHERE price IS NOT NULL AND price >= 50000 AND bedrooms IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_m3_irs_income_zip ON irs_income (zip_code);

CREATE INDEX IF NOT EXISTS idx_m3_education_zip ON education (zip_code);

ANALYZE location;
ANALYZE real_estate;
ANALYZE irs_income;
ANALYZE education;
