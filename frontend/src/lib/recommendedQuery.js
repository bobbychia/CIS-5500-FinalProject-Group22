/** GET /api/zip-areas for recommended presets only — city/state + Query 3 bands when applicable. No optional refinement. */

export function buildRecommendedZipQuery(filters) {
  if (filters.search_mode == null || filters.search_mode === "") {
    return null;
  }
  const q = new URLSearchParams();
  q.set("search_mode", filters.search_mode);
  if (filters.city?.trim()) q.set("city", filters.city.trim());
  if (filters.state?.trim()) q.set("state", filters.state.trim());
  if (filters.offset) q.set("offset", filters.offset);

  if (filters.search_mode === "range_filters") {
    q.set("min_avg_price_q3", filters.min_avg_price_q3);
    q.set("max_avg_price_q3", filters.max_avg_price_q3);
    q.set("min_total_income_q3", filters.min_total_income_q3);
    q.set("max_total_income_q3", filters.max_total_income_q3);
    q.set("min_schools_q3", filters.min_schools_q3);
    q.set("max_schools_q3", filters.max_schools_q3);
  }

  return q.toString();
}
