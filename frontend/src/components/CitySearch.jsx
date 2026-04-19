import { useCallback, useEffect, useRef, useState } from "react";
import { AutoComplete } from "primereact/autocomplete";
import { Button } from "primereact/button";

const API_BASE = "";

/**
 * City typeahead via GET /api/meta/cities — PrimeReact AutoComplete + abort stale requests.
 */
export default function CitySearch({ value, state, onChange, onPick }) {
  const [items, setItems] = useState([]);
  const abortRef = useRef(null);

  const runFetch = useCallback(
    (q) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const sp = new URLSearchParams();
      const qt = (q || "").trim();
      if (qt) sp.set("q", qt);
      if (state?.trim()) {
        sp.set("state", state.trim());
        sp.set("restrict_state", "true");
      } else {
        sp.set("restrict_state", "false");
      }
      sp.set("limit", "20");
      fetch(`${API_BASE}/api/meta/cities?${sp.toString()}`, { signal: ac.signal })
        .then(async (r) => {
          if (!r.ok) throw new Error(await r.text());
          return r.json();
        })
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
      <label htmlFor="city-ac" className="block text-sm font-semibold text-700 mb-2">
        City
      </label>
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
