"""
Parameterized SQL from Milestone 3 (tables: Location, Real_Estate, IRS_Income, Education).
Use with sqlalchemy.text() and bound parameters.
"""

# --- Query 1 (complex): ZIP summary for explore + income/price ratio ---
# LocationScope narrows ZIPs first so aggregates do not scan the full nation when state/city filters are set.
SQL_QUERY1 = """
WITH LocationScope AS (
    SELECT zip_code
    FROM Location
    WHERE (:state IS NULL OR UPPER(TRIM(state)) = UPPER(TRIM(:state)))
      AND (
        :city IS NULL
        OR LOWER(TRIM(city)) LIKE '%' || LOWER(TRIM(:city)) || '%'
      )
),
IncomeSummary AS (
    SELECT zip_code,
           SUM(num_returns) AS total_returns,
           SUM(total_income) AS total_income
    FROM IRS_Income
    WHERE zip_code IN (SELECT zip_code FROM LocationScope)
    GROUP BY zip_code
),
SchoolSummary AS (
    SELECT zip_code,
           COUNT(*) AS num_schools,
           AVG(enrollment) AS avg_school_enrollment
    FROM Education
    WHERE zip_code IN (SELECT zip_code FROM LocationScope)
    GROUP BY zip_code
),
HousingSummary AS (
    SELECT zip_code,
           AVG(price) AS avg_housing_price,
           AVG(house_size) AS avg_house_size
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000
      AND zip_code IN (SELECT zip_code FROM LocationScope)
    GROUP BY zip_code
),
BedroomAgg AS (
    SELECT zip_code, AVG(bedrooms) AS avg_bedrooms
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000 AND bedrooms IS NOT NULL
      AND zip_code IN (SELECT zip_code FROM LocationScope)
    GROUP BY zip_code
)
SELECT
    l.zip_code,
    l.city,
    l.state,
    h.avg_housing_price,
    i.total_income,
    COALESCE(s.num_schools, 0)::int AS num_schools,
    COALESCE(s.avg_school_enrollment, 0) AS avg_school_enrollment,
    (i.total_income::numeric / NULLIF(h.avg_housing_price, 0)) AS income_price_ratio
FROM Location l
JOIN HousingSummary h ON l.zip_code = h.zip_code
JOIN IncomeSummary i ON l.zip_code = i.zip_code
LEFT JOIN SchoolSummary s ON l.zip_code = s.zip_code
LEFT JOIN BedroomAgg br ON l.zip_code = br.zip_code
WHERE l.zip_code IN (SELECT zip_code FROM LocationScope)
  AND (:min_avg_price IS NULL OR h.avg_housing_price >= :min_avg_price)
  AND (:max_avg_price IS NULL OR h.avg_housing_price <= :max_avg_price)
  AND (:min_total_income IS NULL OR i.total_income >= :min_total_income)
  AND (:max_total_income IS NULL OR i.total_income <= :max_total_income)
  AND (:min_schools IS NULL OR COALESCE(s.num_schools, 0) >= :min_schools)
  AND (:max_schools IS NULL OR COALESCE(s.num_schools, 0) <= :max_schools)
  AND (:min_avg_bedrooms IS NULL OR COALESCE(br.avg_bedrooms, 0) >= :min_avg_bedrooms)
  AND (:max_avg_bedrooms IS NULL OR COALESCE(br.avg_bedrooms, 0) <= :max_avg_bedrooms)
  AND (
    :bed_rounds IS NULL
    OR TRIM(:bed_rounds) = ''
    OR ROUND(COALESCE(br.avg_bedrooms, 0))::int = ANY(string_to_array(:bed_rounds, ',')::int[])
  )
ORDER BY income_price_ratio DESC NULLS LAST, h.avg_housing_price ASC
LIMIT :limit OFFSET :offset
"""

SQL_QUERY1_COUNT = """
WITH LocationScope AS (
    SELECT zip_code
    FROM Location
    WHERE (:state IS NULL OR UPPER(TRIM(state)) = UPPER(TRIM(:state)))
      AND (
        :city IS NULL
        OR LOWER(TRIM(city)) LIKE '%' || LOWER(TRIM(:city)) || '%'
      )
),
IncomeSummary AS (
    SELECT zip_code, SUM(total_income) AS total_income
    FROM IRS_Income
    WHERE zip_code IN (SELECT zip_code FROM LocationScope)
    GROUP BY zip_code
),
SchoolSummary AS (
    SELECT zip_code, COUNT(*) AS num_schools
    FROM Education
    WHERE zip_code IN (SELECT zip_code FROM LocationScope)
    GROUP BY zip_code
),
HousingSummary AS (
    SELECT zip_code, AVG(price) AS avg_housing_price
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000
      AND zip_code IN (SELECT zip_code FROM LocationScope)
    GROUP BY zip_code
),
BedroomAgg AS (
    SELECT zip_code, AVG(bedrooms) AS avg_bedrooms
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000 AND bedrooms IS NOT NULL
      AND zip_code IN (SELECT zip_code FROM LocationScope)
    GROUP BY zip_code
)
SELECT COUNT(*)::int AS cnt
FROM Location l
JOIN HousingSummary h ON l.zip_code = h.zip_code
JOIN IncomeSummary i ON l.zip_code = i.zip_code
LEFT JOIN SchoolSummary s ON l.zip_code = s.zip_code
LEFT JOIN BedroomAgg br ON l.zip_code = br.zip_code
WHERE l.zip_code IN (SELECT zip_code FROM LocationScope)
  AND (:min_avg_price IS NULL OR h.avg_housing_price >= :min_avg_price)
  AND (:max_avg_price IS NULL OR h.avg_housing_price <= :max_avg_price)
  AND (:min_total_income IS NULL OR i.total_income >= :min_total_income)
  AND (:max_total_income IS NULL OR i.total_income <= :max_total_income)
  AND (:min_schools IS NULL OR COALESCE(s.num_schools, 0) >= :min_schools)
  AND (:max_schools IS NULL OR COALESCE(s.num_schools, 0) <= :max_schools)
  AND (:min_avg_bedrooms IS NULL OR COALESCE(br.avg_bedrooms, 0) >= :min_avg_bedrooms)
  AND (:max_avg_bedrooms IS NULL OR COALESCE(br.avg_bedrooms, 0) <= :max_avg_bedrooms)
  AND (
    :bed_rounds IS NULL
    OR TRIM(:bed_rounds) = ''
    OR ROUND(COALESCE(br.avg_bedrooms, 0))::int = ANY(string_to_array(:bed_rounds, ',')::int[])
  )
"""

# --- Query 3 (complex): multi-range filter ---
SQL_QUERY3 = """
WITH HousingSummary AS (
    SELECT zip_code, AVG(price) AS avg_housing_price
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000
    GROUP BY zip_code
),
SchoolSummary AS (
    SELECT zip_code,
           AVG(CASE WHEN enrollment > 0 THEN enrollment END) AS avg_school_enrollment,
           COUNT(*) AS num_schools
    FROM Education
    GROUP BY zip_code
),
NationalBenchmarks AS (
    SELECT
        (SELECT AVG(avg_housing_price) FROM HousingSummary) AS national_avg_housing_price,
        (SELECT AVG(avg_school_enrollment) FROM SchoolSummary WHERE avg_school_enrollment IS NOT NULL) AS national_avg_school_enrollment
)
SELECT
    l.zip_code,
    l.city,
    l.state,
    h.avg_housing_price,
    s.avg_school_enrollment,
    s.num_schools,
    NULL::float AS total_income,
    NULL::float AS income_price_ratio,
    NULL::float AS avg_price_per_sqft
FROM Location l
JOIN HousingSummary h ON l.zip_code = h.zip_code
JOIN SchoolSummary s ON l.zip_code = s.zip_code
CROSS JOIN NationalBenchmarks nb
WHERE h.avg_housing_price > nb.national_avg_housing_price
  AND s.avg_school_enrollment < nb.national_avg_school_enrollment
  AND s.num_schools >= 3
  AND (:city IS NULL OR LOWER(TRIM(l.city)) LIKE '%' || LOWER(TRIM(:city)) || '%')
  AND (:state IS NULL OR UPPER(TRIM(l.state)) = UPPER(TRIM(:state)))
ORDER BY h.avg_housing_price DESC, s.avg_school_enrollment ASC
LIMIT :limit OFFSET :offset
"""

SQL_QUERY3_COUNT = """
WITH HousingSummary AS (
    SELECT zip_code, AVG(price) AS avg_housing_price
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000
    GROUP BY zip_code
),
SchoolSummary AS (
    SELECT zip_code,
           AVG(CASE WHEN enrollment > 0 THEN enrollment END) AS avg_school_enrollment,
           COUNT(*) AS num_schools
    FROM Education
    GROUP BY zip_code
),
NationalBenchmarks AS (
    SELECT
        (SELECT AVG(avg_housing_price) FROM HousingSummary) AS national_avg_housing_price,
        (SELECT AVG(avg_school_enrollment) FROM SchoolSummary WHERE avg_school_enrollment IS NOT NULL) AS national_avg_school_enrollment
)
SELECT COUNT(*)::int AS cnt
FROM Location l
JOIN HousingSummary h ON l.zip_code = h.zip_code
JOIN SchoolSummary s ON l.zip_code = s.zip_code
CROSS JOIN NationalBenchmarks nb
WHERE h.avg_housing_price > nb.national_avg_housing_price
  AND s.avg_school_enrollment < nb.national_avg_school_enrollment
  AND s.num_schools >= 3
  AND (:city IS NULL OR LOWER(TRIM(l.city)) LIKE '%' || LOWER(TRIM(:city)) || '%')
  AND (:state IS NULL OR UPPER(TRIM(l.state)) = UPPER(TRIM(:state)))
"""

# --- Query 2 (complex): below state avg price, above state avg income, 3+ schools ---
SQL_QUERY2 = """
WITH IncomeSummary AS (
    SELECT zip_code, SUM(total_income) AS total_income
    FROM IRS_Income
    GROUP BY zip_code
),
SchoolSummary AS (
    SELECT zip_code, COUNT(*) AS num_schools
    FROM Education
    GROUP BY zip_code
),
HousingSummary AS (
    SELECT zip_code, AVG(price) AS avg_housing_price
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000
    GROUP BY zip_code
),
ZipSummary AS (
    SELECT
        l.zip_code,
        l.city,
        l.state,
        h.avg_housing_price,
        i.total_income,
        COALESCE(s.num_schools, 0)::int AS num_schools
    FROM Location l
    JOIN HousingSummary h ON l.zip_code = h.zip_code
    JOIN IncomeSummary i ON l.zip_code = i.zip_code
    LEFT JOIN SchoolSummary s ON l.zip_code = s.zip_code
),
StateBenchmarks AS (
    SELECT
        state,
        AVG(avg_housing_price) AS state_avg_housing_price,
        AVG(total_income) AS state_avg_total_income
    FROM ZipSummary
    GROUP BY state
),
BedroomAgg AS (
    SELECT zip_code, AVG(bedrooms) AS avg_bedrooms
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000 AND bedrooms IS NOT NULL
    GROUP BY zip_code
)
SELECT
    z.zip_code,
    z.city,
    z.state,
    z.avg_housing_price,
    z.total_income,
    z.num_schools,
    NULL::float AS avg_school_enrollment,
    (z.total_income::numeric / NULLIF(z.avg_housing_price, 0)) AS income_price_ratio
FROM ZipSummary z
JOIN StateBenchmarks s ON z.state = s.state
LEFT JOIN BedroomAgg br ON z.zip_code = br.zip_code
WHERE z.avg_housing_price < s.state_avg_housing_price
  AND z.total_income > s.state_avg_total_income
  AND z.num_schools >= 3
  AND (:state IS NULL OR UPPER(TRIM(z.state)) = UPPER(TRIM(:state)))
  AND (:city IS NULL OR LOWER(TRIM(z.city)) = LOWER(TRIM(:city)))
  AND (:min_avg_price IS NULL OR z.avg_housing_price >= :min_avg_price)
  AND (:max_avg_price IS NULL OR z.avg_housing_price <= :max_avg_price)
  AND (:min_total_income IS NULL OR z.total_income >= :min_total_income)
  AND (:max_total_income IS NULL OR z.total_income <= :max_total_income)
  AND (:min_schools IS NULL OR z.num_schools >= :min_schools)
  AND (:max_schools IS NULL OR z.num_schools <= :max_schools)
  AND (:min_avg_bedrooms IS NULL OR COALESCE(br.avg_bedrooms, 0) >= :min_avg_bedrooms)
  AND (:max_avg_bedrooms IS NULL OR COALESCE(br.avg_bedrooms, 0) <= :max_avg_bedrooms)
  AND (
    :bed_rounds IS NULL
    OR TRIM(:bed_rounds) = ''
    OR ROUND(COALESCE(br.avg_bedrooms, 0))::int = ANY(string_to_array(:bed_rounds, ',')::int[])
  )
ORDER BY z.total_income DESC, z.avg_housing_price ASC
LIMIT :limit OFFSET :offset
"""

SQL_QUERY2_COUNT = """
WITH IncomeSummary AS (
    SELECT zip_code, SUM(total_income) AS total_income
    FROM IRS_Income
    GROUP BY zip_code
),
SchoolSummary AS (
    SELECT zip_code, COUNT(*) AS num_schools
    FROM Education
    GROUP BY zip_code
),
HousingSummary AS (
    SELECT zip_code, AVG(price) AS avg_housing_price
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000
    GROUP BY zip_code
),
ZipSummary AS (
    SELECT
        l.zip_code,
        l.city,
        l.state,
        h.avg_housing_price,
        i.total_income,
        COALESCE(s.num_schools, 0)::int AS num_schools
    FROM Location l
    JOIN HousingSummary h ON l.zip_code = h.zip_code
    JOIN IncomeSummary i ON l.zip_code = i.zip_code
    LEFT JOIN SchoolSummary s ON l.zip_code = s.zip_code
),
StateBenchmarks AS (
    SELECT
        state,
        AVG(avg_housing_price) AS state_avg_housing_price,
        AVG(total_income) AS state_avg_total_income
    FROM ZipSummary
    GROUP BY state
),
BedroomAgg AS (
    SELECT zip_code, AVG(bedrooms) AS avg_bedrooms
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000 AND bedrooms IS NOT NULL
    GROUP BY zip_code
)
SELECT COUNT(*)::int AS cnt
FROM ZipSummary z
JOIN StateBenchmarks s ON z.state = s.state
LEFT JOIN BedroomAgg br ON z.zip_code = br.zip_code
WHERE z.avg_housing_price < s.state_avg_housing_price
  AND z.total_income > s.state_avg_total_income
  AND z.num_schools >= 3
  AND (:state IS NULL OR UPPER(TRIM(z.state)) = UPPER(TRIM(:state)))
  AND (:city IS NULL OR LOWER(TRIM(z.city)) = LOWER(TRIM(:city)))
  AND (:min_avg_price IS NULL OR z.avg_housing_price >= :min_avg_price)
  AND (:max_avg_price IS NULL OR z.avg_housing_price <= :max_avg_price)
  AND (:min_total_income IS NULL OR z.total_income >= :min_total_income)
  AND (:max_total_income IS NULL OR z.total_income <= :max_total_income)
  AND (:min_schools IS NULL OR z.num_schools >= :min_schools)
  AND (:max_schools IS NULL OR z.num_schools <= :max_schools)
  AND (:min_avg_bedrooms IS NULL OR COALESCE(br.avg_bedrooms, 0) >= :min_avg_bedrooms)
  AND (:max_avg_bedrooms IS NULL OR COALESCE(br.avg_bedrooms, 0) <= :max_avg_bedrooms)
  AND (
    :bed_rounds IS NULL
    OR TRIM(:bed_rounds) = ''
    OR ROUND(COALESCE(br.avg_bedrooms, 0))::int = ANY(string_to_array(:bed_rounds, ',')::int[])
  )
"""

# --- Query 4 (complex): price/sqft below national avg, income above national avg ---
SQL_QUERY4 = """
WITH IncomeSummary AS (
    SELECT zip_code, SUM(total_income) AS total_income
    FROM IRS_Income
    GROUP BY zip_code
),
ZipPricePerSqft AS (
    SELECT
        zip_code,
        AVG(price::numeric / NULLIF(house_size, 0)) AS avg_price_per_sqft
    FROM Real_Estate
    WHERE house_size > 0 AND price IS NOT NULL AND price >= 50000
    GROUP BY zip_code
),
NationalBenchmarks AS (
    SELECT AVG(price::numeric / NULLIF(house_size, 0)) AS national_avg_price_per_sqft
    FROM Real_Estate
    WHERE house_size > 0 AND price IS NOT NULL AND price >= 50000
),
NationalIncome AS (
    SELECT AVG(total_income) AS national_avg_total_income
    FROM IncomeSummary
),
SchoolSummary AS (
    SELECT zip_code, COUNT(*)::int AS num_schools
    FROM Education
    GROUP BY zip_code
),
BedroomAgg AS (
    SELECT zip_code, AVG(bedrooms) AS avg_bedrooms
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000 AND bedrooms IS NOT NULL
    GROUP BY zip_code
)
SELECT
    l.zip_code,
    l.city,
    l.state,
    h.avg_housing_price,
    i.total_income,
    COALESCE(ss.num_schools, 0)::int AS num_schools,
    NULL::float AS avg_school_enrollment,
    (i.total_income::numeric / NULLIF(h.avg_housing_price, 0)) AS income_price_ratio,
    zp.avg_price_per_sqft
FROM Location l
JOIN (
    SELECT zip_code, AVG(price) AS avg_housing_price
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000
    GROUP BY zip_code
) h ON l.zip_code = h.zip_code
JOIN IncomeSummary i ON l.zip_code = i.zip_code
JOIN ZipPricePerSqft zp ON l.zip_code = zp.zip_code
LEFT JOIN SchoolSummary ss ON l.zip_code = ss.zip_code
LEFT JOIN BedroomAgg br ON l.zip_code = br.zip_code
CROSS JOIN NationalBenchmarks nb
CROSS JOIN NationalIncome ni
WHERE zp.avg_price_per_sqft < nb.national_avg_price_per_sqft
  AND i.total_income > ni.national_avg_total_income
  AND (:state IS NULL OR UPPER(TRIM(l.state)) = UPPER(TRIM(:state)))
  AND (:city IS NULL OR LOWER(TRIM(l.city)) = LOWER(TRIM(:city)))
  AND (:min_avg_price IS NULL OR h.avg_housing_price >= :min_avg_price)
  AND (:max_avg_price IS NULL OR h.avg_housing_price <= :max_avg_price)
  AND (:min_total_income IS NULL OR i.total_income >= :min_total_income)
  AND (:max_total_income IS NULL OR i.total_income <= :max_total_income)
  AND (:min_schools IS NULL OR COALESCE(ss.num_schools, 0) >= :min_schools)
  AND (:max_schools IS NULL OR COALESCE(ss.num_schools, 0) <= :max_schools)
  AND (:min_avg_bedrooms IS NULL OR COALESCE(br.avg_bedrooms, 0) >= :min_avg_bedrooms)
  AND (:max_avg_bedrooms IS NULL OR COALESCE(br.avg_bedrooms, 0) <= :max_avg_bedrooms)
  AND (
    :bed_rounds IS NULL
    OR TRIM(:bed_rounds) = ''
    OR ROUND(COALESCE(br.avg_bedrooms, 0))::int = ANY(string_to_array(:bed_rounds, ',')::int[])
  )
ORDER BY i.total_income DESC, zp.avg_price_per_sqft ASC
LIMIT :limit OFFSET :offset
"""

SQL_QUERY4_COUNT = """
WITH IncomeSummary AS (
    SELECT zip_code, SUM(total_income) AS total_income
    FROM IRS_Income
    GROUP BY zip_code
),
ZipPricePerSqft AS (
    SELECT
        zip_code,
        AVG(price::numeric / NULLIF(house_size, 0)) AS avg_price_per_sqft
    FROM Real_Estate
    WHERE house_size > 0 AND price IS NOT NULL AND price >= 50000
    GROUP BY zip_code
),
NationalBenchmarks AS (
    SELECT AVG(price::numeric / NULLIF(house_size, 0)) AS national_avg_price_per_sqft
    FROM Real_Estate
    WHERE house_size > 0 AND price IS NOT NULL AND price >= 50000
),
NationalIncome AS (
    SELECT AVG(total_income) AS national_avg_total_income
    FROM IncomeSummary
),
SchoolSummary AS (
    SELECT zip_code, COUNT(*)::int AS num_schools
    FROM Education
    GROUP BY zip_code
),
BedroomAgg AS (
    SELECT zip_code, AVG(bedrooms) AS avg_bedrooms
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000 AND bedrooms IS NOT NULL
    GROUP BY zip_code
)
SELECT COUNT(*)::int AS cnt
FROM Location l
JOIN (
    SELECT zip_code, AVG(price) AS avg_housing_price
    FROM Real_Estate
    WHERE price IS NOT NULL AND price >= 50000
    GROUP BY zip_code
) h ON l.zip_code = h.zip_code
JOIN IncomeSummary i ON l.zip_code = i.zip_code
JOIN ZipPricePerSqft zp ON l.zip_code = zp.zip_code
LEFT JOIN SchoolSummary ss ON l.zip_code = ss.zip_code
LEFT JOIN BedroomAgg br ON l.zip_code = br.zip_code
CROSS JOIN NationalBenchmarks nb
CROSS JOIN NationalIncome ni
WHERE zp.avg_price_per_sqft < nb.national_avg_price_per_sqft
  AND i.total_income > ni.national_avg_total_income
  AND (:state IS NULL OR UPPER(TRIM(l.state)) = UPPER(TRIM(:state)))
  AND (:city IS NULL OR LOWER(TRIM(l.city)) = LOWER(TRIM(:city)))
  AND (:min_avg_price IS NULL OR h.avg_housing_price >= :min_avg_price)
  AND (:max_avg_price IS NULL OR h.avg_housing_price <= :max_avg_price)
  AND (:min_total_income IS NULL OR i.total_income >= :min_total_income)
  AND (:max_total_income IS NULL OR i.total_income <= :max_total_income)
  AND (:min_schools IS NULL OR COALESCE(ss.num_schools, 0) >= :min_schools)
  AND (:max_schools IS NULL OR COALESCE(ss.num_schools, 0) <= :max_schools)
  AND (:min_avg_bedrooms IS NULL OR COALESCE(br.avg_bedrooms, 0) >= :min_avg_bedrooms)
  AND (:max_avg_bedrooms IS NULL OR COALESCE(br.avg_bedrooms, 0) <= :max_avg_bedrooms)
  AND (
    :bed_rounds IS NULL
    OR TRIM(:bed_rounds) = ''
    OR ROUND(COALESCE(br.avg_bedrooms, 0))::int = ANY(string_to_array(:bed_rounds, ',')::int[])
  )
"""

# --- Query 7 ---
SQL_QUERY7 = """
SELECT
    zip_code,
    AVG(price) AS avg_housing_price,
    AVG(house_size) AS avg_house_size,
    AVG(bedrooms) AS avg_bedrooms,
    AVG(bathrooms) AS avg_bathrooms
FROM Real_Estate
WHERE zip_code = :zip
  AND price IS NOT NULL
  AND price >= 50000
GROUP BY zip_code
"""

# --- Query 8 ---
SQL_QUERY8 = """
SELECT
    zip_code,
    COUNT(*)::int AS total_schools,
    AVG(enrollment) AS avg_school_enrollment
FROM Education
WHERE zip_code = :zip
GROUP BY zip_code
"""

# --- Query 9 ---
SQL_QUERY9 = """
SELECT
    zip_code,
    SUM(total_income) AS total_income,
    SUM(wage_income) AS total_wage_income,
    SUM(interest_income) AS total_interest_income,
    SUM(dividend_income) AS total_dividend_income,
    SUM(capital_gain) AS total_capital_gain
FROM IRS_Income
WHERE zip_code = :zip
GROUP BY zip_code
"""

# --- Query 10 ---
SQL_QUERY10 = """
SELECT
    zip_code,
    income_bracket,
    num_returns,
    total_income,
    wage_income,
    interest_income,
    dividend_income,
    capital_gain
FROM IRS_Income
WHERE zip_code = :zip
ORDER BY income_bracket
"""

# --- Query 5.5: Composite score and star rating for one ZIP ---
SQL_QUERY_SCORE_BATCH = """
WITH Base AS (
    SELECT
        l.zip_code,
        AVG(r.price) AS avg_price,
        SUM(i.total_income) AS total_income,
        COUNT(DISTINCT e.school_id) AS school_count,
        AVG(e.enrollment) AS avg_enrollment
    FROM Location l
    JOIN Real_Estate r ON l.zip_code = r.zip_code
    JOIN IRS_Income i ON l.zip_code = i.zip_code
    LEFT JOIN Education e ON l.zip_code = e.zip_code
    WHERE r.price IS NOT NULL AND r.price >= 50000
    GROUP BY l.zip_code
),
ValueCalc AS (
    SELECT *, total_income::numeric / NULLIF(avg_price, 0) AS value_ratio
    FROM Base
),
Stats AS (
    SELECT
        MIN(value_ratio) AS min_val, MAX(value_ratio) AS max_val,
        MIN(total_income) AS min_inc, MAX(total_income) AS max_inc,
        MIN(school_count) AS min_sch, MAX(school_count) AS max_sch
    FROM ValueCalc
),
Normalized AS (
    SELECT
        v.zip_code,
        (v.value_ratio - s.min_val) / NULLIF(s.max_val - s.min_val, 0) AS value_score,
        (v.total_income - s.min_inc) / NULLIF(s.max_inc - s.min_inc, 0) AS income_score,
        (v.school_count - s.min_sch) / NULLIF(s.max_sch - s.min_sch, 0) AS school_score
    FROM ValueCalc v CROSS JOIN Stats s
),
FinalScore AS (
    SELECT *,
        (0.5 * value_score + 0.3 * income_score + 0.2 * school_score) AS final_score
    FROM Normalized
)
SELECT
    zip_code,
    ROUND(final_score::numeric, 4) AS final_score,
    CASE
        WHEN final_score < 0.2 THEN 1
        WHEN final_score < 0.4 THEN 2
        WHEN final_score < 0.6 THEN 3
        WHEN final_score < 0.8 THEN 4
        ELSE 5
    END AS star_rating
FROM FinalScore
WHERE zip_code = ANY(:zips)
"""

SQL_QUERY_SCORE = """
WITH Base AS (
    SELECT
        l.zip_code,
        AVG(r.price) AS avg_price,
        SUM(i.total_income) AS total_income,
        COUNT(DISTINCT e.school_id) AS school_count,
        AVG(e.enrollment) AS avg_enrollment
    FROM Location l
    JOIN Real_Estate r ON l.zip_code = r.zip_code
    JOIN IRS_Income i ON l.zip_code = i.zip_code
    LEFT JOIN Education e ON l.zip_code = e.zip_code
    WHERE r.price IS NOT NULL AND r.price >= 50000
    GROUP BY l.zip_code
),
ValueCalc AS (
    SELECT *,
        total_income::numeric / NULLIF(avg_price, 0) AS value_ratio
    FROM Base
),
Stats AS (
    SELECT
        MIN(value_ratio) AS min_val, MAX(value_ratio) AS max_val,
        MIN(total_income) AS min_inc, MAX(total_income) AS max_inc,
        MIN(school_count) AS min_sch, MAX(school_count) AS max_sch
    FROM ValueCalc
),
Normalized AS (
    SELECT
        v.zip_code,
        (v.value_ratio - s.min_val) / NULLIF(s.max_val - s.min_val, 0) AS value_score,
        (v.total_income - s.min_inc) / NULLIF(s.max_inc - s.min_inc, 0) AS income_score,
        (v.school_count - s.min_sch) / NULLIF(s.max_sch - s.min_sch, 0) AS school_score
    FROM ValueCalc v CROSS JOIN Stats s
),
FinalScore AS (
    SELECT *,
        (0.5 * value_score + 0.3 * income_score + 0.2 * school_score) AS final_score
    FROM Normalized
)
SELECT
    zip_code,
    ROUND(final_score::numeric, 4) AS final_score,
    CASE
        WHEN final_score < 0.2 THEN 1
        WHEN final_score < 0.4 THEN 2
        WHEN final_score < 0.6 THEN 3
        WHEN final_score < 0.8 THEN 4
        ELSE 5
    END AS star_rating
FROM FinalScore
WHERE zip_code = :zip
"""

# --- Query 5: ZIP codes ranked by total income ---
SQL_QUERY5 = """
WITH IncomeSummary AS (
    SELECT zip_code, SUM(total_income) AS total_income
    FROM IRS_Income
    GROUP BY zip_code
)
SELECT
    l.zip_code,
    l.city,
    l.state,
    i.total_income
FROM Location l
JOIN IncomeSummary i ON l.zip_code = i.zip_code
WHERE (:state IS NULL OR UPPER(TRIM(l.state)) = UPPER(TRIM(:state)))
  AND (:city IS NULL OR LOWER(TRIM(l.city)) LIKE '%' || LOWER(TRIM(:city)) || '%')
ORDER BY i.total_income DESC
LIMIT :limit OFFSET :offset
"""

# --- Query 6: ZIP codes ranked by average housing price (cheapest first) ---
SQL_QUERY6 = """
SELECT
    l.zip_code,
    l.city,
    l.state,
    AVG(r.price) AS avg_housing_price
FROM Location l
JOIN Real_Estate r ON l.zip_code = r.zip_code
WHERE r.price IS NOT NULL
  AND r.price >= 50000
  AND (:state IS NULL OR UPPER(TRIM(l.state)) = UPPER(TRIM(:state)))
  AND (:city IS NULL OR LOWER(TRIM(l.city)) LIKE '%' || LOWER(TRIM(:city)) || '%')
GROUP BY l.zip_code, l.city, l.state
ORDER BY avg_housing_price ASC
LIMIT :limit OFFSET :offset
"""
