/** Build GET /api/zip-areas query string from filter state. */

function appendOptionalNum(q, key, raw) {
  const t = String(raw ?? "").trim();
  if (t === "" || Number.isNaN(Number(t))) return;
  q.set(key, t);
}

export function buildZipSearchQuery(filters) {
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

  appendOptionalNum(q, "min_avg_price", filters.min_avg_price);
  appendOptionalNum(q, "max_avg_price", filters.max_avg_price);
  appendOptionalNum(q, "min_total_income", filters.min_total_income);
  appendOptionalNum(q, "max_total_income", filters.max_total_income);
  appendOptionalNum(q, "min_schools", filters.min_schools);
  appendOptionalNum(q, "max_schools", filters.max_schools);
  if (filters.bed_rounds?.trim()) q.set("bed_rounds", filters.bed_rounds.trim());

  return q.toString();
}
