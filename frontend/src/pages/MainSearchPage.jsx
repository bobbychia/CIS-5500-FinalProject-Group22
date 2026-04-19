import { useMemo, useState } from "react";
import FilterSidebar from "../components/FilterSidebar.jsx";
import ZipAreaList from "../components/ZipAreaList.jsx";
import SearchNav from "../components/SearchNav.jsx";
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
    bed_rounds: "",
  });

  const debouncedFilters = useDebouncedValue(filters, SEARCH_DEBOUNCE_MS);
  const query = useMemo(() => buildZipSearchQuery(debouncedFilters), [debouncedFilters]);
  const { data, loading, error } = useZipAreasSearch(query);

  const waitingForDebounce =
    JSON.stringify(filters) !== JSON.stringify(debouncedFilters);

  return (
    <div className="page layout">
      <div className="shell">
        <FilterSidebar filters={filters} onChange={setFilters} />
        <div className="results-column results-panel">
          <div className="results-toolbar">
            <SearchNav />
          </div>
          {waitingForDebounce && (
            <div className="preview-banner mb-4">
              <div className="preview-banner__icon">
                <i className="pi pi-spin pi-spinner" />
              </div>
              <div>
                <p className="m-0 preview-banner__title">正在更新结果</p>
                <p className="m-0 preview-banner__text">输入停止后会自动刷新，避免频繁请求。</p>
              </div>
            </div>
          )}
          <div className="results-header">
            <div>
              <h2 className="results-title">Neighborhood results</h2>
              <p className="results-subtitle">左侧筛选，右侧直接看结果，页面结构更干净。</p>
            </div>
            <span className="results-mode-badge">
              <i className="pi pi-bolt"></i>
              Live query
            </span>
          </div>
          <ZipAreaList loading={loading} error={error} response={data} />
        </div>
      </div>
    </div>
  );
}
