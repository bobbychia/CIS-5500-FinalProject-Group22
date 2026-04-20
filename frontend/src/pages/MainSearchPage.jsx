import { useEffect, useMemo, useRef, useState } from "react";
import FilterSidebar from "../components/FilterSidebar.jsx";
import SearchNav from "../components/SearchNav.jsx";
import ZipAreaList from "../components/ZipAreaList.jsx";
import { buildZipSearchQuery } from "../lib/searchQuery.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { useZipAreasSearch } from "../hooks/useZipAreasSearch.js";
import "../App.css";

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
    min_avg_bedrooms: "",
    max_avg_bedrooms: "",
    bed_rounds: "",
  });

  const debouncedFilters = useDebouncedValue(filters, SEARCH_DEBOUNCE_MS);
  const query = useMemo(() => buildZipSearchQuery(debouncedFilters), [debouncedFilters]);
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
        <section className="find-page__intro wrap">
          <p className="eyebrow eyebrow--accent">Find</p>
          <h1 className="display display--lg">Refine neighborhoods that fit your life</h1>
        </section>

        <div ref={resultsAnchorRef} className="shell find-shell">
          <div className="find-shell__filters">
            <FilterSidebar filters={filters} onChange={setFilters} />
          </div>
          <div className="results-column find-shell__results">
            {waitingForDebounce ? (
              <div className="find-page__status">
                <i className="pi pi-spin pi-spinner" />
                Updating your matches...
              </div>
            ) : null}

            <ZipAreaList
              loading={loading}
              error={error}
              response={data}
              heading="Homes and neighborhoods"
              subheading="ZIP code, city, state, pricing, education density, and local income at a glance."
              showMoreStep={9}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
