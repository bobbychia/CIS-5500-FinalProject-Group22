import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SearchNav from "../components/SearchNav.jsx";
import { getStates } from "../lib/api.js";
import { landingProductStats, landingWallItems } from "../lib/landingWallData.js";
import "../App.css";

function splitIntoColumns(items, columnCount) {
  return Array.from({ length: columnCount }, (_, columnIndex) =>
    items.filter((item) => item.column === columnIndex)
  );
}

export default function LandingPage() {
  const [stateCount, setStateCount] = useState(50);
  const [wallItems, setWallItems] = useState(landingWallItems);
  const columns = useMemo(() => splitIntoColumns(wallItems, 5), [wallItems]);

  useEffect(() => {
    let cancelled = false;

    getStates()
      .then((payload) => {
        if (!cancelled) {
          const count = payload?.items?.length;
          setStateCount(count || 50);
        }
      })
      .catch(() => {
        if (!cancelled) setStateCount(50);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled(
      landingWallItems.map(async (item) => {
        if (!item.pageTitle) return item;

        try {
          const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.pageTitle)}`
          );
          if (!response.ok) return item;

          const payload = await response.json();
          return {
            ...item,
            image: payload.originalimage?.source || payload.thumbnail?.source || item.image,
          };
        } catch {
          return item;
        }
      })
    ).then((results) => {
      if (cancelled) return;

      setWallItems(
        results.map((result, index) =>
          result.status === "fulfilled" ? result.value : landingWallItems[index]
        )
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page layout">
      <SearchNav />

      <main className="landing-page">
        <section className="landing-hero wrap wrap--wide">
          <div className="landing-hero__copy">
            <p className="eyebrow eyebrow--accent fade-in">Ideal Nest</p>
            <h1 className="display display--xl fade-in fade-in-d1">
              <span className="line">Find where</span>{" "}
              <span className="line display--italic">you belong</span>
            </h1>
            <p className="deck landing-hero__deck fade-in fade-in-d2">
              Across {stateCount} states, {landingProductStats.cityCount.toLocaleString()}+ cities,
              and {landingProductStats.zipCount.toLocaleString()}+ ZIP codes, Ideal Nest curates
              promising homes through school access, neighborhood income, and home-layout signals,
              so every search feels more personal, more informed, and a little closer to home.
            </p>

            <div className="landing-hero__actions fade-in fade-in-d3">
              <Link className="landing-cta landing-cta--primary" to="/find">
                find
              </Link>
              <Link className="landing-cta" to="/quick">
                quick
              </Link>
              <Link className="landing-cta" to="/rank">
                rank
              </Link>
            </div>
          </div>

          <div className="landing-wall" aria-label="United States landmark wall">
            {columns.map((column, columnIndex) => (
              <div
                key={`column-${columnIndex}`}
                className={`landing-wall__column ${columnIndex % 2 === 1 ? "is-offset" : ""}`}
              >
                <div className={`landing-wall__track ${columnIndex % 2 === 1 ? "is-reverse" : ""}`}>
                  {[...column, ...column].map((item, itemIndex) => (
                    <motion.article
                      key={`${item.id}-${itemIndex}`}
                      className="landing-wall__card"
                      initial={{ opacity: 0, y: 28 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * (columnIndex + itemIndex), duration: 0.48 }}
                    >
                      <img src={item.image} alt={`${item.landmark} in ${item.state}`} />
                      <div className="landing-wall__shade" />
                      <div className="landing-wall__label">
                        <span>{item.state}</span>
                        <strong>{item.landmark}</strong>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
