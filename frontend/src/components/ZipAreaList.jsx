import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import ZipAreaCard from "./ZipAreaCard.jsx";

const MODE_LABELS = {
  explore: "Best Value Areas",
  beats_state: "Strong Neighborhoods",
  range_filters: "Balanced Neighborhoods",
  beats_national: "High Income, Better Value",
};

function modeLabel(mode) {
  return MODE_LABELS[mode] || mode;
}

export default function ZipAreaList({ loading, error, response, idleMessage }) {
  if (idleMessage && !loading && !error) {
    return (
      <section className="results flex flex-column gap-2">
        <Message severity="info" text={idleMessage} />
      </section>
    );
  }

  if (loading) {
    return (
      <section className="results flex flex-column align-items-center gap-3 py-5">
        <ProgressSpinner style={{ width: 48, height: 48 }} strokeWidth="4" />
        <p className="m-0 font-semibold">Loading ZIP summaries…</p>
        <p className="m-0 text-sm text-color-secondary text-center max-w-30rem">
          Aggregating IRS, listings, and schools per ZIP can take a few seconds — especially for a
          whole state with no city. Adding a city (or more filters) usually speeds this up.
        </p>
      </section>
    );
  }
  if (error) {
    return (
      <section className="results flex flex-column gap-2">
        <Message severity="error" text={`Could not load results: ${error}`} />
        <Message
          severity="info"
          text="Set DATABASE_URL in backend/.env and run uvicorn app.main:app --reload"
        />
      </section>
    );
  }
  if (!response?.items?.length) {
    return (
      <section className="results">
        <Message
          severity="warn"
          text="No ZIP codes match. Try widening filters or another search mode."
        />
        {response?.search_mode && (
          <p className="meta mt-2">Preset: {modeLabel(response.search_mode)}</p>
        )}
      </section>
    );
  }

  return (
    <section className="results">
      <p className="meta">
        Showing {response.items.length} of {response.total} ·{" "}
        <strong>{modeLabel(response.search_mode)}</strong>
      </p>
      <ul className="card-grid">
        {response.items.map((z) => (
          <li key={z.id}>
            <ZipAreaCard area={z} />
          </li>
        ))}
      </ul>
    </section>
  );
}
