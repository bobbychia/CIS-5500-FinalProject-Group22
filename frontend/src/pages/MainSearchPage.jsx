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

  const debouncedFilters = useDebouncedValue(filters, SEARCH_DEBOUNCE_MS);
  const query = useMemo(() => buildZipSearchQuery(debouncedFilters), [debouncedFilters]);
  const { data, loading, error } = useZipAreasSearch(query);

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
        <FilterSidebar filters={filters} onChange={setFilters} />
        <div className="results-column">
          {waitingForDebounce && (
            <p className="hint debounce-hint" role="status">
              Search runs shortly after you stop typing — this avoids overloading the server.
            </p>
          )}
          <ZipAreaList loading={loading} error={error} response={data} />
        </div>
      </div>
    </div>
  );
}
