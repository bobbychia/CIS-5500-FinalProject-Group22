import { useEffect, useMemo, useRef, useState } from "react";
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
  const resultsAnchorRef = useRef(null);

  const waitingForDebounce =
    JSON.stringify(filters) !== JSON.stringify(debouncedFilters);

  useEffect(() => {
    resultsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [debouncedFilters]);

  return (
    <div className="page layout page--browse">
      <SearchNav />
      <main className="find-page">
        <section className="curated-intro">
          <div className="wrap">
            <p className="eyebrow eyebrow--accent">Quick</p>
            <h1 className="display display--lg">Preset shortcuts for faster discovery</h1>
          </div>
        </section>

        <div ref={resultsAnchorRef} className="shell find-shell">
          <div className="find-shell__filters">
            <RecommendedSidebar filters={filters} onChange={setFilters} />
          </div>
          <div className="results-column find-shell__results results-panel">
            {waitingForDebounce ? (
              <div className="find-page__status">
                <i className="pi pi-spin pi-spinner" />
                Updating your matches...
              </div>
            ) : null}

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
              hideHeader
              idleMessage={
                filters.search_mode == null || filters.search_mode === ""
                  ? "Select a quick preset on the left to view matching neighborhoods."
                  : null
              }
              showMoreStep={9}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
