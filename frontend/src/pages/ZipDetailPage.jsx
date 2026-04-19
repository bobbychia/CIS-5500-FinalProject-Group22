import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { ProgressSpinner } from "primereact/progressspinner";
import { useNavigate, useParams } from "react-router-dom";
import "../App.css";
import { getPreviewDetail } from "../lib/uiPreviewData.js";

const API_BASE = "";

export default function ZipDetailPage() {
  const navigate = useNavigate();
  const { zipCode } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const previewDetail = getPreviewDetail(zipCode);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/zip-areas/${encodeURIComponent(zipCode)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then(setDetail)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [zipCode]);

  const content = detail ?? previewDetail;
  const bracketRows =
    content?.irs_by_bracket?.map((row, index) => ({
      id: index,
      income_bracket: row.income_bracket ?? "—",
      num_returns: row.num_returns?.toLocaleString?.() ?? row.num_returns ?? "—",
      total_income: row.total_income?.toLocaleString?.() ?? row.total_income ?? "—",
    })) ?? [];

  return (
    <div className="page layout">
      <header className="topbar shadow-1">
        <div className="topbar-left">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="text-900"
          />
          <h1>
            Nest<span className="text-primary">Scope</span>
          </h1>
        </div>
        <div className="topbar-actions">
          <span className="nav-utility-chip">
            <i className="pi pi-map-marker mr-2" />
            ZIP Insights
          </span>
        </div>
      </header>

      <main className="detail-shell">
        {loading && (
          <div className="flex justify-content-center py-8">
            <ProgressSpinner />
          </div>
        )}
        {!loading && content && (
          <>
            <section className="detail-hero-grid">
              <div className="detail-hero detail-hero--main">
                <img src={content.hero_url} alt={`${content.city} hero`} />
                <div className="detail-hero__overlay">
                  <span className="detail-pill">Top-tier neighborhood snapshot</span>
                  <h1 className="detail-title">
                    ZIP {content.zip_code}
                  </h1>
                  <p className="detail-subtitle">
                    {content.city || "Unknown City"}, {content.state || "—"}
                  </p>
                </div>
              </div>
              <div className="detail-hero-stack">
                <div className="detail-mini-card">
                  <span className="detail-mini-card__label">Average list price</span>
                  <strong>${content.housing?.avg_housing_price?.toLocaleString() ?? "—"}</strong>
                </div>
                <div className="detail-mini-card">
                  <span className="detail-mini-card__label">Schools in ZIP</span>
                  <strong>{content.education?.total_schools ?? "—"}</strong>
                </div>
                <div className="detail-mini-card detail-mini-card--accent">
                  <span className="detail-mini-card__label">Total IRS income</span>
                  <strong>${content.irs_totals?.total_income?.toLocaleString() ?? "—"}</strong>
                </div>
              </div>
            </section>

            <div className="detail-content-grid">
              <section className="detail-card">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">Housing</p>
                    <h2>Market profile</h2>
                  </div>
                </div>
                <div className="detail-metric-grid">
                  <div className="detail-metric-card">
                    <span>Average price</span>
                    <strong>${content.housing?.avg_housing_price?.toLocaleString() ?? "—"}</strong>
                  </div>
                  <div className="detail-metric-card">
                    <span>Average size</span>
                    <strong>{content.housing?.avg_house_size?.toLocaleString() ?? "—"} sqft</strong>
                  </div>
                  <div className="detail-metric-card">
                    <span>Bedrooms</span>
                    <strong>{content.housing?.avg_bedrooms ?? "—"}</strong>
                  </div>
                  <div className="detail-metric-card">
                    <span>Bathrooms</span>
                    <strong>{content.housing?.avg_bathrooms ?? "—"}</strong>
                  </div>
                </div>
              </section>

              <aside className="detail-card detail-card--sticky">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">IRS</p>
                    <h2>Income overview</h2>
                  </div>
                </div>
                <div className="detail-income-total">
                  <span>Total income</span>
                  <strong>${content.irs_totals?.total_income?.toLocaleString() ?? "—"}</strong>
                </div>
                <div className="detail-income-list">
                  <div>
                    <span>Wages</span>
                    <strong>${content.irs_totals?.total_wage_income?.toLocaleString() ?? "—"}</strong>
                  </div>
                  <div>
                    <span>Capital gains</span>
                    <strong>${content.irs_totals?.total_capital_gain?.toLocaleString() ?? "—"}</strong>
                  </div>
                  <div>
                    <span>Dividends</span>
                    <strong>${content.irs_totals?.total_dividend_income?.toLocaleString() ?? "—"}</strong>
                  </div>
                  <div>
                    <span>Interest</span>
                    <strong>${content.irs_totals?.total_interest_income?.toLocaleString() ?? "—"}</strong>
                  </div>
                </div>
              </aside>

              <section className="detail-card">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">Education</p>
                    <h2>School landscape</h2>
                  </div>
                </div>
                <div className="detail-metric-grid detail-metric-grid--two">
                  <div className="detail-metric-card detail-metric-card--soft">
                    <span>Total schools</span>
                    <strong>{content.education?.total_schools ?? "—"}</strong>
                  </div>
                  <div className="detail-metric-card detail-metric-card--soft">
                    <span>Average enrollment</span>
                    <strong>{content.education?.avg_school_enrollment?.toFixed(0) ?? "—"}</strong>
                  </div>
                </div>
              </section>

              <section className="detail-card detail-card--full">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">Distribution</p>
                    <h2>Income brackets</h2>
                  </div>
                </div>
                <DataTable
                  value={bracketRows}
                  dataKey="id"
                  size="small"
                  className="detail-table"
                  stripedRows
                >
                  <Column field="income_bracket" header="Income bracket" />
                  <Column field="num_returns" header="Returns" />
                  <Column field="total_income" header="Total income" />
                </DataTable>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
