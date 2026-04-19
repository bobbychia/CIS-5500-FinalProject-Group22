import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Divider } from "primereact/divider";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Panel } from "primereact/panel";
import { Slider } from "primereact/slider";
import CitySearch from "./CitySearch.jsx";

const BED_ROUND_OPTIONS = [
  { k: "1", label: "~1 BR" },
  { k: "2", label: "~2 BR" },
  { k: "3", label: "~3 BR" },
  { k: "4", label: "~4 BR" },
  { k: "5", label: "~5+ BR" },
];

const API_BASE = "";

const SCH_FLEX_MAX = 40;

function numOrEmpty(v) {
  if (v === "" || v == null || Number.isNaN(Number(v))) return null;
  return Number(v);
}

/** Homepage flexible search (Query 1 + optional refinements). */
export default function FilterSidebar({ filters, onChange }) {
  const navigate = useNavigate();
  const [zipInput, setZipInput] = useState("");

  function handleZipSearch(e) {
    e.preventDefault();
    const z = zipInput.trim();
    if (z.length === 5 && /^\d{5}$/.test(z)) {
      navigate(`/zip/${z}`);
    }
  }
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

  const priceMin =
    String(filters.min_avg_price ?? "").trim() === ""
      ? priceDomain[0]
      : Number(filters.min_avg_price);
  const priceMax =
    String(filters.max_avg_price ?? "").trim() === ""
      ? priceDomain[1]
      : Number(filters.max_avg_price);

  const incMin =
    String(filters.min_total_income ?? "").trim() === "" ? 0 : Number(filters.min_total_income);
  const incMax =
    String(filters.max_total_income ?? "").trim() === ""
      ? 20_000_000
      : Number(filters.max_total_income);

  const schMin =
    String(filters.min_schools ?? "").trim() === "" ? 0 : Number(filters.min_schools);
  const schMax =
    String(filters.max_schools ?? "").trim() === "" ? SCH_FLEX_MAX : Number(filters.max_schools);

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
      <div className="flex flex-column gap-3">
        <h2 className="m-0 text-xl">Flexible search</h2>

        <form onSubmit={handleZipSearch} className="flex gap-2">
          <InputText
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value)}
            placeholder="Go to ZIP (e.g. 19104)"
            maxLength={5}
            className="w-full"
          />
          <Button type="submit" icon="pi pi-search" disabled={!/^\d{5}$/.test(zipInput.trim())} />
        </form>

        <Panel header="Where" toggleable collapsed={false}>
          <div className="flex flex-column gap-3">
            <CitySearch
              value={filters.city}
              state={filters.state}
              onChange={(v) => update("city", v)}
              onPick={(city) => update("city", city)}
            />
            <div>
              <label htmlFor="state-dd" className="field-label">
                State
              </label>
              <Dropdown
                inputId="state-dd"
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
              City uses substring match; state is exact. Suggestions respect the selected state.
            </p>
          </div>
        </Panel>

        <Panel header="Optional refinement" toggleable>
          <div className="flex justify-content-end mb-2">
            <Button type="button" label="Clear" size="small" text onClick={clearOptionalRefine} />
          </div>
          <p className="mt-0 text-sm text-color-secondary">
            Narrow by price, income, schools, and bedrooms (Query 1). Leave empty for no extra
            bounds besides city/state.
          </p>

          <h3 className="text-sm font-semibold m-0 mb-2">Average listing price (ZIP)</h3>
          {hist?.bins?.length > 0 && (
            <div className="hist-bars" aria-hidden>
              {hist.bins.map((b) => {
                const mx = Math.max(1, ...hist.bins.map((x) => x.count));
                return (
                  <div key={b.bin_id} className="hist-bar-wrap" title={b.label}>
                    <div
                      className="hist-bar"
                      style={{
                        height: `${Math.min(100, 8 + (b.count / mx) * 72)}px`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <div className="grid mb-3">
            <div className="col-6">
              <label className="field-label">Min</label>
              <InputNumber
                value={numOrEmpty(filters.min_avg_price)}
                onValueChange={(e) => update("min_avg_price", e.value == null ? "" : String(e.value))}
                placeholder="Min"
                className="w-full"
                min={0}
                useGrouping
              />
            </div>
            <div className="col-6">
              <label className="field-label">Max</label>
              <InputNumber
                value={numOrEmpty(filters.max_avg_price)}
                onValueChange={(e) => update("max_avg_price", e.value == null ? "" : String(e.value))}
                placeholder="Max"
                className="w-full"
                min={0}
                useGrouping
              />
            </div>
          </div>
          <Slider
            value={[Math.min(priceMin, priceMax), Math.max(priceMin, priceMax)]}
            onChange={(e) => {
              const [a, b] = e.value;
              patch({
                min_avg_price: String(a),
                max_avg_price: String(b),
              });
            }}
            range
            min={priceDomain[0]}
            max={priceDomain[1]}
            className="w-full mb-4"
          />

          <Divider />

          <h3 className="text-sm font-semibold m-0 mb-2">Total ZIP income (IRS)</h3>
          <Slider
            value={[incMin, Math.max(incMin, incMax)]}
            onChange={(e) => {
              const [a, b] = e.value;
              patch({
                min_total_income: String(a),
                max_total_income: String(b),
              });
            }}
            range
            min={0}
            max={20_000_000}
            step={50_000}
            className="w-full mb-3"
          />
          <div className="grid">
            <div className="col-6">
              <label className="field-label">Min</label>
              <InputNumber
                value={numOrEmpty(filters.min_total_income)}
                onValueChange={(e) =>
                  update("min_total_income", e.value == null ? "" : String(e.value))
                }
                className="w-full"
                min={0}
                useGrouping
              />
            </div>
            <div className="col-6">
              <label className="field-label">Max</label>
              <InputNumber
                value={numOrEmpty(filters.max_total_income)}
                onValueChange={(e) =>
                  update("max_total_income", e.value == null ? "" : String(e.value))
                }
                className="w-full"
                min={0}
                useGrouping
              />
            </div>
          </div>

          <Divider />

          <h3 className="text-sm font-semibold m-0 mb-2">Schools (count in ZIP)</h3>
          <Slider
            value={[schMin, Math.max(schMin, schMax)]}
            onChange={(e) => {
              const [a, b] = e.value;
              patch({
                min_schools: String(a),
                max_schools: String(b),
              });
            }}
            range
            min={0}
            max={SCH_FLEX_MAX}
            className="w-full mb-3"
          />
          <div className="grid mb-3">
            <div className="col-6">
              <label className="field-label">Min</label>
              <InputNumber
                value={numOrEmpty(filters.min_schools)}
                onValueChange={(e) => update("min_schools", e.value == null ? "" : String(e.value))}
                className="w-full"
                min={0}
                max={SCH_FLEX_MAX}
                useGrouping={false}
              />
            </div>
            <div className="col-6">
              <label className="field-label">Max</label>
              <InputNumber
                value={numOrEmpty(filters.max_schools)}
                onValueChange={(e) => update("max_schools", e.value == null ? "" : String(e.value))}
                className="w-full"
                min={0}
                max={SCH_FLEX_MAX}
                useGrouping={false}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { a: 0, b: 2, l: "0–2" },
              { a: 3, b: 5, l: "3–5" },
              { a: 6, b: SCH_FLEX_MAX, l: "6+" },
            ].map((x) => (
              <Button
                key={x.l}
                type="button"
                label={`${x.l} schools`}
                size="small"
                outlined
                onClick={() => patch({ min_schools: String(x.a), max_schools: String(x.b) })}
              />
            ))}
          </div>

          <Divider />

          <h3 className="text-sm font-semibold m-0 mb-2">Typical bedrooms (ZIP avg)</h3>
          <p className="text-sm text-color-secondary mt-0">Rounded average bedrooms in set:</p>
          <div className="flex flex-column gap-2">
            {BED_ROUND_OPTIONS.map((o) => (
              <div key={o.k} className="flex align-items-center gap-2">
                <Checkbox
                  inputId={`bed-${o.k}`}
                  checked={bedSelected.includes(o.k)}
                  onChange={() => toggleBed(o.k)}
                />
                <label htmlFor={`bed-${o.k}`} className="m-0 cursor-pointer">
                  {o.label}
                </label>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </aside>
  );
}
