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
      <div className="shell">
        <RecommendedSidebar filters={filters} onChange={setFilters} />
        <div className="results-column results-panel">
          <div className="results-toolbar">
            <SearchNav />
          </div>
          <div className="results-header">
            <div>
              <h2 className="results-title">Curated neighborhoods</h2>
              <p className="results-subtitle">保留预设筛选器和右侧结果区，不再显示顶部大区块。</p>
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
                ? "Select a curated preset on the left to view top neighborhoods."
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
