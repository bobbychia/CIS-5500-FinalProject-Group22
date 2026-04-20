import { useEffect, useState } from "react";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import ZipAreaCard from "./ZipAreaCard.jsx";
import { previewResponse } from "../lib/uiPreviewData.js";
import { getZipScoresBatch } from "../lib/api.js";

/**
 * Results list.
 *
 * When `response` contains real results (i.e. not the preview fallback), also
 * batch-fetches GET /api/zip-areas/scores to decorate each card with its
 * composite score / star rating.
 */
export default function ZipAreaList({
  loading,
  error,
  response,
  idleMessage,
  heading,
  subheading,
  hideHeader = false,
}) {
  const showingPreview = Boolean(error) && !response?.items?.length;
  const effectiveResponse = showingPreview ? previewResponse : response;
  const [scoreMap, setScoreMap] = useState({});
  const totalCount = effectiveResponse?.total ?? effectiveResponse?.items?.length ?? 0;
  const headingText = heading || (totalCount > 0 ? `${totalCount.toLocaleString()} results` : "Results");

  useEffect(() => {
    if (showingPreview) {
      setScoreMap({});
      return;
    }
    const items = effectiveResponse?.items ?? [];
    if (!items.length) {
      setScoreMap({});
      return;
    }
    const zips = items.map((x) => x.zip_code).filter(Boolean);
    if (!zips.length) return;

    let cancelled = false;
    getZipScoresBatch(zips)
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return;
        const m = {};
        for (const r of rows) {
          if (r?.zip_code) m[r.zip_code] = r;
        }
        setScoreMap(m);
      })
      .catch(() => {
        if (!cancelled) setScoreMap({});
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showingPreview,
    effectiveResponse?.items?.map?.((x) => x.zip_code).join(","),
  ]);

  if (idleMessage && !loading && !error) {
    return (
      <section className="empty-state">
        <i className="pi pi-search empty-state__icon" />
        <p className="empty-state__title">{idleMessage}</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="empty-state">
        <ProgressSpinner style={{ width: 50, height: 50 }} strokeWidth="4" animationDuration=".5s" />
        <p className="empty-state__title">Finding homes...</p>
      </section>
    );
  }
  if (error) {
    if (!showingPreview) {
      return (
        <section className="results-block">
          <Message severity="error" text={`Could not load results: ${error}`} className="w-full mb-3" />
          <Message severity="info" text="Ensure backend is running: uvicorn app.main:app --reload" className="w-full" />
        </section>
      );
    }
  }
  if (!effectiveResponse?.items?.length) {
    return (
      <section className="empty-state">
        <i className="pi pi-home empty-state__icon" />
        <h2 className="empty-state__title">No exact matches</h2>
        <p className="empty-state__deck">Try changing or removing some of your filters to see more results.</p>
      </section>
    );
  }

  return (
    <section className="results-block">
      {!hideHeader ? (
        <div className="results-block__header">
          <div>
            <h2 className="results-title">{headingText}</h2>
            {subheading ? <p className="results-subtitle">{subheading}</p> : null}
          </div>
        </div>
      ) : null}
      <ul className="card-grid">
        {effectiveResponse.items.map((z) => (
          <li key={z.id}>
            <ZipAreaCard area={z} score={scoreMap[z.zip_code]} />
          </li>
        ))}
      </ul>
    </section>
  );
}
