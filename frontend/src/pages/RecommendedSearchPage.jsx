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
      <SearchNav />
      <section className="curated-intro">
        <div className="wrap">
          <p className="eyebrow eyebrow--accent">Quick</p>
          <h1 className="display display--lg">Preset shortcuts for faster home discovery.</h1>
        </div>
      </section>

      <div className="shell shell--editorial">
        <RecommendedSidebar filters={filters} onChange={setFilters} />
        <div className="results-column results-panel">
          <div className="results-header">
            <div>
              <h2 className="results-title">Quick neighborhood picks</h2>
            </div>
            <span className="results-mode-badge">
              <i className="pi pi-sparkles"></i>
              Smart preset
            </span>
          </div>
          <ZipAreaList
            loading={loading}
            error={error}
            response={data}
            idleMessage={
              filters.search_mode == null || filters.search_mode === ""
                ? "Select a quick preset on the left to view matching neighborhoods."
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
