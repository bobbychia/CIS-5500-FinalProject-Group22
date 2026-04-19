import { useMemo, useState } from "react";
import RecommendedSidebar from "../components/RecommendedSidebar.jsx";
import ZipAreaList from "../components/ZipAreaList.jsx";
import SearchNav from "../components/SearchNav.jsx";
import { buildRecommendedZipQuery } from "../lib/recommendedQuery.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { useZipAreasSearch } from "../hooks/useZipAreasSearch.js";
import "../App.css";

const SEARCH_DEBOUNCE_MS = 500;
const PAGE_SIZE = 30;

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
  const [page, setPage] = useState(0);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  const debouncedFilters = useDebouncedValue(filters, SEARCH_DEBOUNCE_MS);
  const query = useMemo(
    () => buildRecommendedZipQuery({ ...debouncedFilters, offset: page * PAGE_SIZE }),
    [debouncedFilters, page]
  );
  const { data, loading, error } = useZipAreasSearch(query);
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="page layout">
      <header className="topbar">
        <h1>Recommended searches</h1>
        <p className="tagline">
          Pick a preset query to explore ZIP-level insights — no flexible sliders here.
        </p>
        <SearchNav />
      </header>
      <div className="shell">
        <RecommendedSidebar filters={filters} onChange={handleFiltersChange} />
        <div className="results-column">
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
          {totalPages > 1 && (
            <div className="flex justify-content-center align-items-center gap-3 mt-3">
              <button onClick={() => setPage(0)} disabled={page === 0}>«</button>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>‹</button>
              <span>Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>›</button>
              <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>»</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
