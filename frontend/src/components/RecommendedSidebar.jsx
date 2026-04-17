import { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Panel } from "primereact/panel";
import CitySearch from "./CitySearch.jsx";

const MODES = [
  {
    value: "explore",
    label: "Best Value Areas",
    hint: "Top ZIPs by income ÷ price — schools & prices in one view (Query 1)",
  },
  {
    value: "beats_state",
    label: "Strong Neighborhoods",
    hint: "Lower than state avg home price, higher income, 3+ schools (Query 2)",
  },
  {
    value: "range_filters",
    label: "Balanced Neighborhoods",
    hint: "Mid-range price, income & school counts — your “well-balanced” preset (Query 3)",
  },
  {
    value: "beats_national",
    label: "High Income, Better Value",
    hint: "Below national avg $/sqft but above national income — smart value (Query 4)",
  },
];

const API_BASE = "";

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
    fetch(`${API_BASE}/api/meta/states`)
      .then((r) => r.json())
      .then((d) => setStates(d.items || []))
      .catch(() => setStates([]));
  }, []);

  const mode = filters.search_mode;
  const showParams = mode != null && mode !== "";

  return (
    <aside className="sidebar-wrap">
      <div className="flex flex-column gap-3">
        <h2 className="m-0 text-xl">Recommended searches</h2>

        <Panel header="Choose a query" toggleable collapsed={false}>
          <p className="mt-0 text-sm text-color-secondary">
            Tap a preset — its parameter panel appears below. No flexible sliders on this page.
          </p>
          <div className="flex flex-column gap-2">
            {MODES.map((m) => (
              <Button
                key={m.value}
                type="button"
                label={m.label}
                className="text-left white-space-normal h-auto py-2 justify-content-start"
                icon={mode === m.value ? "pi pi-check" : "pi pi-angle-right"}
                severity={mode === m.value ? undefined : "secondary"}
                outlined={mode !== m.value}
                onClick={() => update("search_mode", m.value)}
                title={m.hint}
              />
            ))}
          </div>
        </Panel>

        {showParams && (
          <>
            <Panel header="Parameters" toggleable collapsed={false}>
              <p className="mt-0 text-sm text-color-secondary">
                {mode === "explore" &&
                  "Query 1: optional city and state narrow ZIPs before ranking by income ÷ price."}
                {mode === "beats_state" &&
                  "Query 2: compares each ZIP to its state’s averages. Choose state for meaningful results; city is optional."}
                {mode === "range_filters" &&
                  "Query 3: set the mid-range bands below, then optional city/state."}
                {mode === "beats_national" &&
                  "Query 4: national $/sqft vs income benchmarks. Optional city and state."}
              </p>

              <h3 className="text-sm font-semibold mb-2">Where</h3>
              <div className="flex flex-column gap-3">
                <CitySearch
                  value={filters.city}
                  state={filters.state}
                  onChange={(v) => update("city", v)}
                  onPick={(city) => update("city", city)}
                />
                <div>
                  <label htmlFor="rec-state-dd" className="field-label">
                    State
                  </label>
                  <Dropdown
                    inputId="rec-state-dd"
                    value={filters.state}
                    options={stateOptions}
                    onChange={(e) => update("state", e.value)}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Any"
                    className="w-full"
                    filter={states.length > 10}
                    showClear
                  />
                </div>
                <p className="m-0 text-sm text-color-secondary">
                  City matches as a substring; state is exact.
                </p>
              </div>
            </Panel>

            {mode === "range_filters" && (
              <Panel header="Balanced preset (Query 3 bands)" toggleable collapsed={false}>
                <p className="mt-0 text-sm text-color-secondary">Numeric window for this preset.</p>
                <div className="grid">
                  <div className="col-6">
                    <label className="field-label">Min price</label>
                    <InputNumber
                      value={numOrEmpty(filters.min_avg_price_q3)}
                      onValueChange={(e) =>
                        update("min_avg_price_q3", e.value == null ? "" : String(e.value))
                      }
                      className="w-full"
                      min={0}
                      useGrouping
                    />
                  </div>
                  <div className="col-6">
                    <label className="field-label">Max price</label>
                    <InputNumber
                      value={numOrEmpty(filters.max_avg_price_q3)}
                      onValueChange={(e) =>
                        update("max_avg_price_q3", e.value == null ? "" : String(e.value))
                      }
                      className="w-full"
                      min={0}
                      useGrouping
                    />
                  </div>
                  <div className="col-6">
                    <label className="field-label">Min income</label>
                    <InputNumber
                      value={numOrEmpty(filters.min_total_income_q3)}
                      onValueChange={(e) =>
                        update("min_total_income_q3", e.value == null ? "" : String(e.value))
                      }
                      className="w-full"
                      min={0}
                      useGrouping
                    />
                  </div>
                  <div className="col-6">
                    <label className="field-label">Max income</label>
                    <InputNumber
                      value={numOrEmpty(filters.max_total_income_q3)}
                      onValueChange={(e) =>
                        update("max_total_income_q3", e.value == null ? "" : String(e.value))
                      }
                      className="w-full"
                      min={0}
                      useGrouping
                    />
                  </div>
                  <div className="col-6">
                    <label className="field-label">Min schools</label>
                    <InputNumber
                      value={numOrEmpty(filters.min_schools_q3)}
                      onValueChange={(e) =>
                        update("min_schools_q3", e.value == null ? "" : String(e.value))
                      }
                      className="w-full"
                      min={0}
                      useGrouping={false}
                    />
                  </div>
                  <div className="col-6">
                    <label className="field-label">Max schools</label>
                    <InputNumber
                      value={numOrEmpty(filters.max_schools_q3)}
                      onValueChange={(e) =>
                        update("max_schools_q3", e.value == null ? "" : String(e.value))
                      }
                      className="w-full"
                      min={0}
                      useGrouping={false}
                    />
                  </div>
                </div>
              </Panel>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
