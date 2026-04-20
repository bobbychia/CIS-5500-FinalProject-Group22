import { useEffect, useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import CitySearch from "./CitySearch.jsx";
import { getStates } from "../lib/api.js";

const MODES = [
  {
    value: "explore",
    label: "Best Value Areas",
    hint: "Top ZIPs by income ÷ price — schools & prices in one view",
  },
  {
    value: "beats_state",
    label: "Strong Neighborhoods",
    hint: "Lower than state avg home price, higher income, 3+ schools",
  },
  {
    value: "range_filters",
    label: "Balanced Neighborhoods",
    hint: "Mid-range price, income & school counts",
  },
  {
    value: "beats_national",
    label: "High Income, Better Value",
    hint: "Below national avg $/sqft but above national income",
  },
];

function numOrEmpty(v) {
  if (v === "" || v == null || Number.isNaN(Number(v))) return null;
  return Number(v);
}

export default function RecommendedSidebar({ filters, onChange }) {
  const [states, setStates] = useState([]);

  const stateOptions = useMemo(
    () => [{ label: "Any", value: "" }, ...states.map((s) => ({ label: s, value: s }))],
    [states]
  );

  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  useEffect(() => {
    let cancelled = false;
    getStates()
      .then((d) => {
        if (!cancelled) setStates(d.items || []);
      })
      .catch(() => {
        if (!cancelled) setStates([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mode = filters.search_mode;
  const showParams = mode != null && mode !== "";

  return (
    <aside className="sidebar-wrap">
      <div className="filter-panel">
        <div className="panel-header-row">
          <div>
            <h2 className="panel-title">Quick Presets</h2>
          </div>
        </div>

        <div className="flex flex-column gap-3 mb-5">
          {MODES.map((m) => {
            const isSelected = mode === m.value;
            return (
              <div
                key={m.value}
                className={`filter-preset ${isSelected ? "is-active" : ""}`}
                onClick={() => update("search_mode", m.value)}
              >
                <div className="flex align-items-center gap-2 mb-1">
                  <i className={`pi ${isSelected ? "pi-check-circle" : "pi-circle"}`}></i>
                  <span className="font-bold">{m.label}</span>
                </div>
                <div className="text-sm pl-4">{m.hint}</div>
              </div>
            );
          })}
        </div>

        {showParams && (
          <div className="filter-section pt-0 border-top-1 surface-border mt-4 pt-4">
            <h3 className="filter-title">Location Refinement</h3>
            <div className="flex flex-column gap-3">
              <CitySearch
                value={filters.city}
                state={filters.state}
                onChange={(v) => update("city", v)}
                onPick={(city) => update("city", city)}
              />
              <div>
                <label className="block text-sm font-semibold text-700 mb-2">State</label>
                <Dropdown
                  value={filters.state}
                  options={stateOptions}
                  onChange={(e) => update("state", e.value ?? "")}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Any State"
                  className="w-full"
                  filter={states.length > 10}
                  showClear
                />
              </div>
            </div>
          </div>
        )}

        {mode === "range_filters" && (
          <div className="filter-section">
            <h3 className="filter-title">Balanced Preset Bounds</h3>
            <div className="grid">
              <div className="col-6 mb-2">
                <label className="block text-xs text-500 font-bold mb-1">Min Price</label>
                <InputNumber value={numOrEmpty(filters.min_avg_price_q3)} onValueChange={(e) => update("min_avg_price_q3", e.value == null ? "" : String(e.value))} className="w-full" inputClassName="w-full" min={0} useGrouping prefix="$" />
              </div>
              <div className="col-6 mb-2">
                <label className="block text-xs text-500 font-bold mb-1">Max Price</label>
                <InputNumber value={numOrEmpty(filters.max_avg_price_q3)} onValueChange={(e) => update("max_avg_price_q3", e.value == null ? "" : String(e.value))} className="w-full" inputClassName="w-full" min={0} useGrouping prefix="$" />
              </div>
              <div className="col-6 mb-2">
                <label className="block text-xs text-500 font-bold mb-1">Min Income</label>
                <InputNumber value={numOrEmpty(filters.min_total_income_q3)} onValueChange={(e) => update("min_total_income_q3", e.value == null ? "" : String(e.value))} className="w-full" inputClassName="w-full" min={0} useGrouping prefix="$" />
              </div>
              <div className="col-6 mb-2">
                <label className="block text-xs text-500 font-bold mb-1">Max Income</label>
                <InputNumber value={numOrEmpty(filters.max_total_income_q3)} onValueChange={(e) => update("max_total_income_q3", e.value == null ? "" : String(e.value))} className="w-full" inputClassName="w-full" min={0} useGrouping prefix="$" />
              </div>
              <div className="col-6 mb-2">
                <label className="block text-xs text-500 font-bold mb-1">Min Schools</label>
                <InputNumber value={numOrEmpty(filters.min_schools_q3)} onValueChange={(e) => update("min_schools_q3", e.value == null ? "" : String(e.value))} className="w-full" inputClassName="w-full" min={0} useGrouping={false} />
              </div>
              <div className="col-6 mb-2">
                <label className="block text-xs text-500 font-bold mb-1">Max Schools</label>
                <InputNumber value={numOrEmpty(filters.max_schools_q3)} onValueChange={(e) => update("max_schools_q3", e.value == null ? "" : String(e.value))} className="w-full" inputClassName="w-full" min={0} useGrouping={false} />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
