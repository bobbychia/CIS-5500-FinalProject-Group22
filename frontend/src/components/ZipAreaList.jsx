import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import ZipAreaCard from "./ZipAreaCard.jsx";
import { previewResponse } from "../lib/uiPreviewData.js";

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
  const showingPreview = Boolean(error) && !response?.items?.length;
  const effectiveResponse = showingPreview ? previewResponse : response;

  if (idleMessage && !loading && !error) {
    return (
      <section className="results flex flex-column align-items-center justify-content-center h-full py-8">
        <i className="pi pi-search text-400 mb-3" style={{ fontSize: '2.5rem' }}></i>
        <p className="text-600 font-medium text-lg">{idleMessage}</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="results flex flex-column align-items-center justify-content-center h-full py-8">
        <ProgressSpinner style={{ width: 50, height: 50 }} strokeWidth="4" animationDuration=".5s" />
        <p className="mt-4 font-semibold text-lg text-800">Finding homes...</p>
      </section>
    );
  }
  if (error) {
    if (!showingPreview) {
      return (
        <section className="results py-4">
          <Message severity="error" text={`Could not load results: ${error}`} className="w-full mb-3" />
          <Message severity="info" text="Ensure backend is running: uvicorn app.main:app --reload" className="w-full" />
        </section>
      );
    }
  }
  if (!effectiveResponse?.items?.length) {
    return (
      <section className="results flex flex-column align-items-center justify-content-center py-8 text-center">
        <i className="pi pi-home text-300 mb-4" style={{ fontSize: '4rem' }}></i>
        <h2 className="m-0 text-2xl text-900 mb-2">No exact matches</h2>
        <p className="m-0 text-600 max-w-20rem mb-4 line-height-3">
          Try changing or removing some of your filters to see more results.
        </p>
      </section>
    );
  }

  return (
    <section className="results">
      <div className="flex justify-content-between align-items-center mb-4">
        <h2 className="m-0 text-xl font-bold text-900">
          {effectiveResponse.total > 0 ? `${effectiveResponse.total.toLocaleString()} results` : 'Results'}
        </h2>
        <span className="text-600 text-sm font-medium bg-white border-1 surface-border px-3 py-1 border-round-3xl">
          {modeLabel(effectiveResponse.search_mode)}
        </span>
      </div>
      <ul className="card-grid">
        {effectiveResponse.items.map((z) => (
          <li key={z.id}>
            <ZipAreaCard area={z} />
          </li>
        ))}
      </ul>
    </section>
  );
}
