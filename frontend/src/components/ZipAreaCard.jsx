import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cityFeatureImage } from "../lib/api.js";

/**
 * A search-result card for one ZIP.
 *
 * Only reads fields actually returned by the backend's ZipAreaCard schema
 * (see backend/app/schemas/zip_area.py):
 *   id, zip_code, city, state, avg_housing_price, total_income, num_schools,
 *   avg_school_enrollment, income_price_ratio, avg_price_per_sqft, thumb_url
 *
 * `score` is optional and, when present, is attached by the parent list after
 * fetching /api/zip-areas/scores. It has the shape { final_score, star_rating }.
 */
export default function ZipAreaCard({ area: z, score }) {
  const pricePerSqft =
    z.avg_price_per_sqft != null ? `$${Math.round(z.avg_price_per_sqft)}/sqft` : null;
  const incomeRatio =
    z.income_price_ratio != null ? z.income_price_ratio.toFixed(2) : "—";
  const stars = score?.star_rating ?? null;
  const accentLabel =
    stars >= 4
      ? "Editor's pick"
      : (z.num_schools ?? 0) >= 10
        ? "Family-first"
        : "Value watch";
  const heroImage = cityFeatureImage({
    city: z.city,
    state: z.state,
    thumbUrl: z.thumb_url,
    zipCode: z.zip_code,
  });

  return (
    <Link
      className="editorial-card-link"
      to={`/zip/${encodeURIComponent(z.zip_code)}`}
      state={{ city: z.city ?? null, state: z.state ?? null, thumb_url: z.thumb_url ?? null }}
    >
      <motion.article
        className="editorial-card"
        whileHover={{ y: -8, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        <div className="editorial-card__media">
          <img
            src={heroImage}
            alt={`Property in ${z.zip_code}`}
            loading="lazy"
          />
          <div className="editorial-card__shade" />
          <div className="editorial-card__badge">
            <span>{accentLabel}</span>
          </div>
          <div className="editorial-card__overlay">
            <div>
              <div className="editorial-card__zip">ZIP {z.zip_code}</div>
              <p className="editorial-card__location editorial-card__location--overlay">
                {z.city ?? "Unknown City"}, {z.state ?? "—"}
              </p>
            </div>
            <span className="editorial-card__rating">
              <i className="pi pi-sparkles" />
              {stars != null ? `${stars}/5` : incomeRatio}
            </span>
          </div>
        </div>

        <div className="editorial-card__body">
          <p className="editorial-card__location">
            {z.city ?? "Unknown City"}, {z.state ?? "—"}
          </p>
          <p className="editorial-card__price">
            {z.avg_housing_price != null
              ? `$${Math.round(z.avg_housing_price).toLocaleString()}`
              : "Price N/A"}
          </p>
          <div className="editorial-card__meta">
            <span>
              <strong>{z.num_schools ?? "—"}</strong> schools
            </span>
            <span>
              <strong>
                {z.avg_school_enrollment != null
                  ? Math.round(z.avg_school_enrollment).toLocaleString()
                  : "—"}
              </strong>{" "}
              avg enrollment
            </span>
            <span>
              <strong>
                {z.total_income != null
                  ? `$${Math.round(z.total_income / 1_000_000).toLocaleString()}M`
                  : "—"}
              </strong>{" "}
              income
            </span>
            <span>
              <strong>{pricePerSqft ?? "—"}</strong> per sqft
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
