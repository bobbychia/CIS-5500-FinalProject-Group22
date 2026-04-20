import { useCallback, useEffect, useRef, useState } from "react";
import { AutoComplete } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { getCities } from "../lib/api.js";

/**
 * City typeahead — calls GET /api/meta/cities via `getCities` in lib/api.js.
 *
 * Matches backend behaviour (backend/app/routers/meta.py::city_suggest):
 *  - `q` is an optional case-insensitive substring
 *  - if state is provided AND restrict_state=true, results are scoped to state
 *  - restrict_state=false lets suggestions span all states (Expedia-style)
 */
export default function CitySearch({ value, state, onChange, onPick, label = "City", hideLabel = false }) {
  const [items, setItems] = useState([]);
  const abortRef = useRef(null);

  const runFetch = useCallback(
    (q) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      getCities(
        {
          q: (q || "").trim(),
          state: state?.trim() || null,
          restrictState: Boolean(state?.trim()),
          limit: 20,
        },
        { signal: ac.signal }
      )
        .then((d) => {
          if (!ac.signal.aborted) setItems(d.items || []);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setItems([]);
        });
    },
    [state]
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!value?.trim()) return;
    runFetch(value);
  }, [state]);

  const completeMethod = (e) => {
    runFetch(e.query);
  };

  return (
    <div className="city-field">
      {!hideLabel ? (
        <label htmlFor="city-ac" className="block text-sm font-semibold text-700 mb-2">
          {label}
        </label>
      ) : null}
      <div className="city-field-row">
        <AutoComplete
          inputId="city-ac"
          value={value}
          suggestions={items}
          completeMethod={completeMethod}
          onChange={(e) => onChange(e.value ?? "")}
          onSelect={(e) => onPick(e.value)}
          placeholder="e.g. Philadelphia"
          className="flex-1 w-full"
          inputClassName="w-full"
          delay={280}
          minLength={0}
          showEmptyMessage
          emptyMessage="No suggestions — main search still matches by substring; try spelling or state."
        />
        {value ? (
          <Button
            type="button"
            icon="pi pi-times"
            rounded
            text
            severity="secondary"
            aria-label="Clear city"
            onClick={() => onPick("")}
          />
        ) : null}
      </div>
    </div>
  );
}
