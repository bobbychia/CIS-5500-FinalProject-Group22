import { useMemo, useState } from "react";
import FilterSidebar from "../components/FilterSidebar.jsx";
import ZipAreaList from "../components/ZipAreaList.jsx";
import SearchNav from "../components/SearchNav.jsx";
import { buildZipSearchQuery } from "../lib/searchQuery.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { useZipAreasSearch } from "../hooks/useZipAreasSearch.js";
import "../App.css";

/** Wait after last keystroke before hitting /api/zip-areas (heavy Query 1). */
const SEARCH_DEBOUNCE_MS = 500;

const PAGE_SIZE = 30;

export default function MainSearchPage() {
  const [filters, setFilters] = useState({
    city: "",
    state: "PA",
    search_mode: "explore",
    min_avg_price: "",
    max_avg_price: "",
    min_total_income: "",
    max_total_income: "",
    min_schools: "",
    max_schools: "",
    bed_rounds: "",
  });
  const [page, setPage] = useState(0);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  const debouncedFilters = useDebouncedValue(filters, SEARCH_DEBOUNCE_MS);
  const query = useMemo(
    () => buildZipSearchQuery({ ...debouncedFilters, offset: page * PAGE_SIZE }),
    [debouncedFilters, page]
  );
  const { data, loading, error } = useZipAreasSearch(query);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const waitingForDebounce =
    JSON.stringify(filters) !== JSON.stringify(debouncedFilters);

  return (
    <div className="page layout">
      <header className="topbar">
        <h1>Neighborhood & ZIP search</h1>
        <p className="tagline">
          Flexible filters over ZIP-level summaries — income, price, schools, and bedrooms (Milestone 3
          Query 1). CIS 5500
        </p>
        <SearchNav />
      </header>
      <div className="shell">
        <FilterSidebar filters={filters} onChange={handleFiltersChange} />
        <div className="results-column">
          {waitingForDebounce && (
            <p className="hint debounce-hint" role="status">
              Search runs shortly after you stop typing — this avoids overloading the server.
            </p>
          )}
          <ZipAreaList loading={loading} error={error} response={data} />
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
