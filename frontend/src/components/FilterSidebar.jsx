import { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Slider } from "primereact/slider";
import CitySearch from "./CitySearch.jsx";

const BED_ROUND_OPTIONS = [
  { k: "1", label: "1+ Beds" },
  { k: "2", label: "2+ Beds" },
  { k: "3", label: "3+ Beds" },
  { k: "4", label: "4+ Beds" },
  { k: "5", label: "5+ Beds" },
];

const API_BASE = "";
const SCH_FLEX_MAX = 40;

function numOrEmpty(v) {
  if (v === "" || v == null || Number.isNaN(Number(v))) return null;
  return Number(v);
}

export default function FilterSidebar({ filters, onChange }) {
  const [states, setStates] = useState([]);
  const [hist, setHist] = useState(null);
  const [priceDomain, setPriceDomain] = useState([0, 2_500_000]);

  const stateOptions = useMemo(
    () => [{ label: "Any", value: "" }, ...states.map((s) => ({ label: s, value: s }))],
    [states]
  );

  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  function patch(p) {
    onChange({ ...filters, ...p });
  }

  function clearOptionalRefine() {
    onChange({
      ...filters,
      min_avg_price: "",
      max_avg_price: "",
      min_total_income: "",
      max_total_income: "",
      min_schools: "",
      max_schools: "",
      bed_rounds: "",
    });
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/meta/states`)
      .then((r) => r.json())
      .then((d) => setStates(d.items || []))
      .catch(() => setStates([]));
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (filters.state?.trim()) sp.set("state", filters.state.trim());
    fetch(`${API_BASE}/api/meta/price-histogram?${sp}`)
      .then((r) => r.json())
      .then((d) => {
        setHist(d);
        if (d.price_min != null && d.price_max != null) {
          const lo = Math.floor(d.price_min);
          const hi = Math.ceil(d.price_max);
          setPriceDomain([lo, Math.max(lo + 1, hi)]);
        }
      })
      .catch(() => {});
  }, [filters.state]);

  const priceMin = String(filters.min_avg_price ?? "").trim() === "" ? priceDomain[0] : Number(filters.min_avg_price);
  const priceMax = String(filters.max_avg_price ?? "").trim() === "" ? priceDomain[1] : Number(filters.max_avg_price);
  const incMin =
    String(filters.min_total_income ?? "").trim() === "" ? 0 : Number(filters.min_total_income);
  const incMax =
    String(filters.max_total_income ?? "").trim() === ""
      ? 20_000_000
      : Number(filters.max_total_income);

  const schMin = String(filters.min_schools ?? "").trim() === "" ? 0 : Number(filters.min_schools);
  const schMax = String(filters.max_schools ?? "").trim() === "" ? SCH_FLEX_MAX : Number(filters.max_schools);

  const bedSelected = (filters.bed_rounds || "").split(",").filter(Boolean);

  function toggleBed(k) {
    const set = new Set(bedSelected);
    if (set.has(k)) set.delete(k);
    else set.add(k);
    const s = [...set].sort().join(",");
    update("bed_rounds", s);
  }

  return (
    <aside className="sidebar-wrap">
      <div className="filter-panel">
        <div className="panel-header-row">
          <div>
            <h2 className="panel-title">Flexible Filters</h2>
            <p className="panel-subtitle">像 Airbnb 的筛选器一样清爽，但保留你的原始查询逻辑。</p>
          </div>
          <Button
            type="button"
            label="Reset"
            className="p-button-text p-button-sm text-600 p-0"
            onClick={clearOptionalRefine}
          />
        </div>

        <div className="filter-section">
          <h3 className="filter-title">Location</h3>
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
                onChange={(e) => update("state", e.value)}
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

        <div className="filter-section">
          <h3 className="filter-title">Price Range</h3>
          {hist?.bins?.length > 0 && (
            <div className="hist-bars" aria-hidden>
              {hist.bins.map((b) => {
                const mx = Math.max(1, ...hist.bins.map((x) => x.count));
                return (
                  <div key={b.bin_id} className="hist-bar-wrap" title={b.label}>
                    <div
                      className="hist-bar"
                      style={{ height: `${Math.min(100, 8 + (b.count / mx) * 92)}%` }}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <Slider
            value={[Math.min(priceMin, priceMax), Math.max(priceMin, priceMax)]}
            onChange={(e) => {
              const [a, b] = e.value;
              patch({ min_avg_price: String(a), max_avg_price: String(b) });
            }}
            range
            min={priceDomain[0]}
            max={priceDomain[1]}
            className="w-full mb-4"
          />
          <div className="flex align-items-center gap-2">
            <div className="flex-1">
              <InputNumber
                value={numOrEmpty(filters.min_avg_price)}
                onValueChange={(e) => update("min_avg_price", e.value == null ? "" : String(e.value))}
                placeholder="Min"
                className="w-full"
                inputClassName="w-full"
                min={0}
                useGrouping
                prefix="$"
              />
            </div>
            <span className="text-500">-</span>
            <div className="flex-1">
              <InputNumber
                value={numOrEmpty(filters.max_avg_price)}
                onValueChange={(e) => update("max_avg_price", e.value == null ? "" : String(e.value))}
                placeholder="Max"
                className="w-full"
                inputClassName="w-full"
                min={0}
                useGrouping
                prefix="$"
              />
            </div>
          </div>
        </div>

        <div className="filter-section">
          <h3 className="filter-title">Total ZIP Income</h3>
          <Slider
            value={[incMin, Math.max(incMin, incMax)]}
            onChange={(e) => {
              const [a, b] = e.value;
              patch({ min_total_income: String(a), max_total_income: String(b) });
            }}
            range
            min={0}
            max={20_000_000}
            step={50_000}
            className="w-full mb-4"
          />
          <div className="flex align-items-center gap-2">
            <div className="flex-1">
              <InputNumber
                value={numOrEmpty(filters.min_total_income)}
                onValueChange={(e) =>
                  update("min_total_income", e.value == null ? "" : String(e.value))
                }
                placeholder="Min"
                className="w-full"
                inputClassName="w-full"
                min={0}
                useGrouping
                prefix="$"
              />
            </div>
            <span className="text-500">-</span>
            <div className="flex-1">
              <InputNumber
                value={numOrEmpty(filters.max_total_income)}
                onValueChange={(e) =>
                  update("max_total_income", e.value == null ? "" : String(e.value))
                }
                placeholder="Max"
                className="w-full"
                inputClassName="w-full"
                min={0}
                useGrouping
                prefix="$"
              />
            </div>
          </div>
        </div>

        <div className="filter-section">
          <h3 className="filter-title">Bedrooms</h3>
          <div className="filter-chip-list">
            {BED_ROUND_OPTIONS.map((o) => {
              const isSelected = bedSelected.includes(o.k);
              return (
                <div
                  key={o.k}
                  className={`filter-chip ${isSelected ? "is-active" : ""}`}
                  onClick={() => toggleBed(o.k)}
                >
                  {o.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="filter-section">
          <h3 className="filter-title">Schools in ZIP</h3>
          <div className="flex align-items-center gap-2 mb-3">
            <div className="flex-1">
              <InputNumber
                value={numOrEmpty(filters.min_schools)}
                onValueChange={(e) => update("min_schools", e.value == null ? "" : String(e.value))}
                placeholder="Min"
                className="w-full"
                inputClassName="w-full"
                min={0}
              />
            </div>
            <span className="text-500">-</span>
            <div className="flex-1">
              <InputNumber
                value={numOrEmpty(filters.max_schools)}
                onValueChange={(e) => update("max_schools", e.value == null ? "" : String(e.value))}
                placeholder="Max"
                className="w-full"
                inputClassName="w-full"
                min={0}
              />
            </div>
          </div>
          <div className="filter-chip-list">
            {[
              { a: 0, b: 2, l: "0-2" },
              { a: 3, b: 5, l: "3-5" },
              { a: 6, b: SCH_FLEX_MAX, l: "6+" },
            ].map((x) => (
              <div
                key={x.l}
                className="filter-chip"
                onClick={() => patch({ min_schools: String(x.a), max_schools: String(x.b) })}
              >
                {x.l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
