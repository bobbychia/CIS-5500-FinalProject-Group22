import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { SelectButton } from "primereact/selectbutton";
import { Link } from "react-router-dom";
import CitySearch from "../components/CitySearch.jsx";
import SearchNav from "../components/SearchNav.jsx";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { getStates, getZipsRankedByIncome, getZipsRankedByPrice, zipThumbUrl } from "../lib/api.js";
import "../App.css";

const MODE_OPTIONS = [
  { label: "Top total income", value: "income" },
  { label: "Lowest avg price", value: "price" },
];

export default function RankingsPage() {
  const [mode, setMode] = useState("income");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [limit, setLimit] = useState(50);
  const [states, setStates] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stateOptions = useMemo(
    () => [{ label: "Any", value: "" }, ...states.map((item) => ({ label: item, value: item }))],
    [states]
  );

  useEffect(() => {
    let cancelled = false;
    getStates()
      .then((data) => {
        if (!cancelled) setStates(data.items || []);
      })
      .catch(() => {
        if (!cancelled) setStates([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const debouncedCity = useDebouncedValue(city, 400);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = {
      state: state?.trim() || null,
      city: debouncedCity?.trim() || null,
      limit: Math.max(1, Math.min(200, Number(limit) || 50)),
      offset: 0,
    };

    const fetcher = mode === "income" ? getZipsRankedByIncome : getZipsRankedByPrice;
    fetcher(params)
      .then((data) => {
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(String(e.message || e));
          setRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, state, debouncedCity, limit]);

  const tableRows = rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    metric: mode === "income" ? row.total_income : row.avg_housing_price,
  }));

  const issueTitle =
    mode === "income"
      ? "2026 Top 50 Valuable ZIPs"
      : "2026 Most Affordable ZIPs";
  return (
    <div className="page layout page--browse">
      <SearchNav />

      <main className="rankings-page">
        <section className="rankings-hero wrap wrap--wide fade-in">
          <div className="rankings-hero__copy">
            <p className="eyebrow eyebrow--accent">Rank</p>
            <h1 className="display display--lg rankings-hero__title">{issueTitle}</h1>
          </div>

          <div className="rankings-toolbar">
            <div className="rankings-toolbar__group">
              <span className="rankings-toolbar__label">Lens</span>
              <SelectButton
                value={mode}
                options={MODE_OPTIONS}
                onChange={(e) => e.value && setMode(e.value)}
              />
            </div>

            <div className="rankings-toolbar__group rankings-toolbar__group--city">
              <span className="rankings-toolbar__label">City</span>
              <CitySearch value={city} state={state} onChange={setCity} onPick={setCity} hideLabel />
            </div>

            <div className="rankings-toolbar__group">
              <span className="rankings-toolbar__label">State</span>
              <Dropdown
                value={state}
                options={stateOptions}
                onChange={(e) => setState(e.value ?? "")}
                optionLabel="label"
                optionValue="value"
                placeholder="Any State"
                className="w-full"
                filter={states.length > 10}
                showClear
              />
            </div>

            <div className="rankings-toolbar__group">
              <span className="rankings-toolbar__label">Rows</span>
              <InputNumber
                value={limit}
                onValueChange={(e) => setLimit(e.value ?? 50)}
                min={1}
                max={200}
                showButtons
                buttonLayout="horizontal"
                className="w-full"
                inputClassName="w-full"
                decrementButtonClassName="p-button-secondary"
                incrementButtonClassName="p-button-secondary"
              />
            </div>
          </div>
        </section>

        <section className="wrap wrap--wide">
          {loading ? (
            <div className="empty-state">
              <ProgressSpinner style={{ width: 50, height: 50 }} strokeWidth="4" />
              <p className="empty-state__title">Building the issue...</p>
            </div>
          ) : null}

          {!loading && error ? (
            <Message
              severity="error"
              text={`Could not load rankings: ${error}`}
              className="w-full mb-3"
            />
          ) : null}

          {!loading && !error && tableRows.length === 0 ? (
            <div className="empty-state">
              <i className="pi pi-chart-line empty-state__icon" />
              <p className="empty-state__title">No rows for this issue.</p>
              <p className="empty-state__deck">Adjust the city, state, or raise the row limit.</p>
            </div>
          ) : null}

          {!loading && !error && tableRows.length > 0 ? (
            <div className="rankings-list">
              {tableRows.map((row, index) => (
                <motion.article
                  key={`${row.zip_code}-${mode}`}
                  className={`magazine-entry ${index % 2 === 1 ? "is-reverse" : ""}`}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.55, ease: [0.2, 0.7, 0.3, 1] }}
                >
                  <div className="magazine-entry__media">
                    <img
                      src={row.thumb_url || zipThumbUrl(row.zip_code)}
                      alt={`ZIP ${row.zip_code}`}
                      loading="lazy"
                    />
                  </div>

                  <div className="magazine-entry__body">
                    <p className="magazine-entry__index">#{String(row.rank).padStart(2, "0")}</p>
                    <h2 className="magazine-entry__title">
                      ZIP {row.zip_code}
                      <span>{row.city ? ` · ${row.city}` : ""}</span>
                    </h2>
                    <p className="magazine-entry__deck">
                      {row.city || "Unknown City"}
                      {row.state ? `, ${row.state}` : ""}
                    </p>

                    <div className="magazine-entry__facts">
                      <div>
                        <span className="magazine-entry__label">
                          {mode === "income" ? "Total IRS income" : "Average list price"}
                        </span>
                        <strong className="magazine-entry__metric">
                          {row.metric != null ? `$${Math.round(row.metric).toLocaleString()}` : "—"}
                        </strong>
                      </div>
                      <div>
                        <span className="magazine-entry__label">ZIP code</span>
                        <strong className="magazine-entry__metric magazine-entry__metric--small">
                          {row.zip_code}
                        </strong>
                      </div>
                    </div>

                    <Link
                      to={`/zip/${encodeURIComponent(row.zip_code)}`}
                      state={{ city: row.city, state: row.state, thumb_url: row.thumb_url ?? null }}
                      className="magazine-entry__link"
                    >
                      Read the profile
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
