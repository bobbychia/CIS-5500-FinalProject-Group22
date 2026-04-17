import { useMemo, useState } from "react";
import RecommendedSidebar from "../components/RecommendedSidebar.jsx";
import ZipAreaList from "../components/ZipAreaList.jsx";
import SearchNav from "../components/SearchNav.jsx";
import { buildRecommendedZipQuery } from "../lib/recommendedQuery.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { useZipAreasSearch } from "../hooks/useZipAreasSearch.js";
import "../App.css";

const SEARCH_DEBOUNCE_MS = 500;

export default function RecommendedSearchPage() {
  const [filters, setFilters] = useState({
    search_mode: null,
    city: "",
    state: "PA",
    min_avg_price_q3: "150000",
    max_avg_price_q3: "500000",
    min_total_income_q3: "100000",
    max_total_income_q3: "400000",
    min_schools_q3: "3",
    max_schools_q3: "20",
  });

  const debouncedFilters = useDebouncedValue(filters, SEARCH_DEBOUNCE_MS);
  const query = useMemo(() => buildRecommendedZipQuery(debouncedFilters), [debouncedFilters]);
  const { data, loading, error } = useZipAreasSearch(query);

  return (
    <div className="page layout">
      <header className="topbar">
        <h1>Recommended searches</h1>
        <p className="tagline">
          Four preset Milestone 3 queries (Q1–Q4). Pick one to open its parameters — no flexible
          sliders here.
        </p>
        <SearchNav />
      </header>
      <div className="shell">
        <RecommendedSidebar filters={filters} onChange={setFilters} />
        <ZipAreaList
          loading={loading}
          error={error}
          response={data}
          idleMessage={
            filters.search_mode == null || filters.search_mode === ""
              ? "Choose a preset on the left to run a search."
              : null
          }
        />
      </div>
    </div>
  );
}
