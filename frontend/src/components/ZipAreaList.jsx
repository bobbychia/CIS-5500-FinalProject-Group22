import { useEffect, useMemo, useRef, useState } from "react";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import ZipAreaCard from "./ZipAreaCard.jsx";
import { previewResponse } from "../lib/uiPreviewData.js";
import { getZipScoresBatch } from "../lib/api.js";
import { normalizeZipCode } from "../lib/zipCode.js";

/**
 * Results list. Batch-fetches /api/zip-areas/scores for star_rating on cards.
 */
export default function ZipAreaList({
  loading,
  error,
  response,
  idleMessage,
  heading,
  subheading,
  hideHeader = false,
  showMoreStep = null,
}) {
  const showingPreview = Boolean(error) && !response?.items?.length;
  const effectiveResponse = showingPreview ? previewResponse : response;
  const [scoresByItemsSig, setScoresByItemsSig] = useState({});

  const allItems = effectiveResponse?.items ?? [];
  const itemsSignature = useMemo(
    () => allItems.map((x) => `${x.zip_code ?? x.id}`).join("|"),
    [allItems]
  );

  const [visibleCount, setVisibleCount] = useState(() =>
    showMoreStep != null ? showMoreStep : Number.POSITIVE_INFINITY
  );

  useEffect(() => {
    if (showMoreStep != null) {
      setVisibleCount(showMoreStep);
    } else {
      setVisibleCount(Number.POSITIVE_INFINITY);
    }
  }, [itemsSignature, showMoreStep, showingPreview]);

  const displayedItems = useMemo(() => {
    if (showMoreStep == null) return allItems;
    return allItems.slice(0, Math.min(visibleCount, allItems.length));
  }, [allItems, showMoreStep, visibleCount]);

  const totalCount = effectiveResponse?.total ?? allItems.length ?? 0;
  const headingText = heading || (totalCount > 0 ? `${totalCount.toLocaleString()} results` : "Results");
  const hasMore =
    showMoreStep != null && allItems.length > 0 && displayedItems.length < allItems.length;

  const scoreMap = scoresByItemsSig[itemsSignature] ?? {};
  const itemsSigRef = useRef(itemsSignature);
  itemsSigRef.current = itemsSignature;

  useEffect(() => {
    if (showingPreview) return;
    const items = displayedItems;
    if (!items.length) return;
    const zips = items.map((x) => x.zip_code).filter(Boolean);
    if (!zips.length) return;

    const sigAtRequest = itemsSignature;
    let cancelled = false;
    getZipScoresBatch(zips)
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return;
        if (sigAtRequest !== itemsSigRef.current) return;
        setScoresByItemsSig((outer) => {
          const prev = outer[sigAtRequest] ?? {};
          const m = { ...prev };
          for (const r of rows) {
            const k = normalizeZipCode(r?.zip_code);
            if (k) m[k] = r;
          }
          for (const z of zips) {
            const k = normalizeZipCode(z);
            if (k && m[k] === undefined) {
              m[k] = { zip_code: k, star_rating: null, final_score: null };
            }
          }
          return { ...outer, [sigAtRequest]: m };
        });
      })
      .catch(() => {
        if (!cancelled && sigAtRequest === itemsSigRef.current) {
          setScoresByItemsSig((outer) => ({
            ...outer,
            [sigAtRequest]: Object.fromEntries(
              zips.map((z) => {
                const k = normalizeZipCode(z);
                return [k, { zip_code: k, star_rating: null, final_score: null }];
              })
            ),
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showingPreview, displayedItems, itemsSignature]);

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
  if (!allItems.length) {
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
        {displayedItems.map((z) => {
          const zk = normalizeZipCode(z.zip_code);
          const row = scoreMap[zk];
          return (
            <li key={z.id}>
              <ZipAreaCard area={z} score={row} />
            </li>
          );
        })}
      </ul>
      {hasMore ? (
        <div className="find-show-more-wrap">
          <button
            type="button"
            className="find-show-more"
            onClick={() => setVisibleCount((c) => c + showMoreStep)}
          >
            Show more
          </button>
        </div>
      ) : null}
    </section>
  );
}
