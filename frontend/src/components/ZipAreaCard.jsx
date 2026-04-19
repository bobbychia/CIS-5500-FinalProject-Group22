import { Link } from "react-router-dom";

export default function ZipAreaCard({ area: z }) {
  return (
    <Link to={`/zip/${encodeURIComponent(z.zip_code)}`}>
      <div className="clean-card">
        <div className="card-img-wrap">
          <img
            src={z.thumb_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
            alt={`Property in ${z.zip_code}`}
            loading="lazy"
          />
          <div className="card-image-overlay" />
          <div className="card-top-meta">
            <span className="card-zip-badge">ZIP {z.zip_code}</span>
            <span className="card-icon-button">
              <i className="pi pi-heart" />
            </span>
          </div>
          <div className="card-bottom-meta">
            <span className="card-ghost-pill">
              <i className="pi pi-chart-line" />
              ${z.avg_price_per_sqft != null ? z.avg_price_per_sqft.toFixed(0) : "—"}/sqft
            </span>
            <span className="card-ghost-pill">
              <i className="pi pi-book" />
              {z.num_schools ?? "—"} schools
            </span>
          </div>
        </div>

        <div className="card-content">
          <div className="card-price-row">
            <div>
              <h2 className="card-price">
              {z.avg_housing_price != null ? `$${Math.round(z.avg_housing_price).toLocaleString()}` : "Price N/A"}
              </h2>
              <p className="card-location">
                <i className="pi pi-map-marker mr-1" />
                {z.city ?? "Unknown City"}, {z.state ?? "—"}
              </p>
            </div>
            <div className="card-rating">
              <div>{z.income_price_ratio != null ? z.income_price_ratio.toFixed(2) : "—"}</div>
              <small className="text-500">value score</small>
            </div>
          </div>

          <div className="card-specs">
            <span className="card-spec-pill">
              {z.avg_bedrooms ? Math.round(z.avg_bedrooms) : "—"} bd
            </span>
            <span className="card-spec-pill">
              {z.avg_bathrooms ? Math.round(z.avg_bathrooms) : "—"} ba
            </span>
            <span className="card-spec-pill">
              {z.avg_house_size ? Math.round(z.avg_house_size).toLocaleString() : "—"} sqft
            </span>
          </div>

          <div className="card-footer">
            <div className="card-footer-stat">
              <span>Total income</span>
              <strong>
                {z.total_income != null ? `$${Math.round(z.total_income / 1000000)}M` : "—"}
              </strong>
            </div>
            <div className="card-footer-stat">
              <span>Enrollment</span>
              <strong>{z.avg_school_enrollment != null ? Math.round(z.avg_school_enrollment) : "—"}</strong>
            </div>
            <div className="card-footer-stat">
              <span>Market</span>
              <strong>Neighborhood</strong>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
