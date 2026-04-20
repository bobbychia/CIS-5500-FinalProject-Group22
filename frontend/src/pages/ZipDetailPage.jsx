import { useEffect, useMemo, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { ProgressSpinner } from "primereact/progressspinner";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SearchNav from "../components/SearchNav.jsx";
import { getZipDetail, getZipScore, zipThumbUrl } from "../lib/api.js";
import { getPreviewDetail } from "../lib/uiPreviewData.js";
import "../App.css";

function formatMoney(value) {
  return value != null ? `$${Math.round(value).toLocaleString()}` : "—";
}

function formatCompactMoney(value) {
  return value != null ? `$${Math.round(value / 1_000_000).toLocaleString()}M` : "—";
}

export default function ZipDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { zipCode } = useParams();
  const [detail, setDetail] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navState = location.state || {};
  const previewDetail = useMemo(() => getPreviewDetail(zipCode), [zipCode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    setScore(null);

    Promise.allSettled([getZipDetail(zipCode), getZipScore(zipCode)])
      .then((results) => {
        if (cancelled) return;

        const [detailResult, scoreResult] = results;

        if (detailResult.status === "fulfilled") {
          setDetail(detailResult.value);
        } else {
          setError(String(detailResult.reason?.message || detailResult.reason));
        }

        if (scoreResult.status === "fulfilled") {
          setScore(scoreResult.value);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [zipCode]);

  const realContent = detail
    ? {
        zip_code: detail.zip_code,
        city: navState.city ?? null,
        state: navState.state ?? null,
        hero_url: navState.thumb_url || zipThumbUrl(detail.zip_code),
        housing: detail.housing ?? null,
        education: detail.education ?? null,
        irs_totals: detail.irs_totals ?? null,
        irs_by_bracket: detail.irs_by_bracket ?? [],
      }
    : null;

  const content = realContent ?? previewDetail;
  const locationLabel =
    [content?.city, content?.state].filter(Boolean).join(", ") || "United States";
  const starLine =
    score?.star_rating != null
      ? `${"★".repeat(score.star_rating)}${"☆".repeat(Math.max(0, 5 - score.star_rating))}`
      : null;
  const bracketRows =
    content?.irs_by_bracket?.map((row, index) => ({
      id: index,
      income_bracket: row.income_bracket ?? "—",
      num_returns: row.num_returns?.toLocaleString?.() ?? row.num_returns ?? "—",
      total_income: row.total_income != null ? formatMoney(row.total_income) : "—",
    })) ?? [];

  const incomeTrendData =
    content?.irs_by_bracket?.map((row) => ({
      bracket: row.income_bracket?.replace("$", "").replace(" - ", " to ") ?? "—",
      totalIncome: Number(((row.total_income ?? 0) / 1_000_000).toFixed(1)),
      returns: row.num_returns ?? 0,
    })) ?? [];

  const incomeMixData = [
    {
      label: "Wages",
      value: Math.round((content?.irs_totals?.total_wage_income ?? 0) / 1_000_000),
    },
    {
      label: "Capital gains",
      value: Math.round((content?.irs_totals?.total_capital_gain ?? 0) / 1_000_000),
    },
    {
      label: "Dividends",
      value: Math.round((content?.irs_totals?.total_dividend_income ?? 0) / 1_000_000),
    },
    {
      label: "Interest",
      value: Math.round((content?.irs_totals?.total_interest_income ?? 0) / 1_000_000),
    },
  ];

  const housingChartData = [
    {
      label: "Price",
      value: Number(((content?.housing?.avg_housing_price ?? 0) / 100_000).toFixed(1)),
    },
    {
      label: "Size",
      value: Number(((content?.housing?.avg_house_size ?? 0) / 500).toFixed(1)),
    },
    {
      label: "Beds",
      value: Number(content?.housing?.avg_bedrooms ?? 0),
    },
    {
      label: "Baths",
      value: Number(content?.housing?.avg_bathrooms ?? 0),
    },
  ];

  return (
    <div className="page layout">
      <SearchNav />

      <button type="button" className="article-back" onClick={() => navigate(-1)}>
        <i className="pi pi-arrow-left" />
        Back
      </button>

      <main className="article">
        {loading ? (
          <div className="empty-state">
            <ProgressSpinner />
            <p className="empty-state__title">Loading ZIP article...</p>
          </div>
        ) : null}

        {!loading && error && !realContent ? (
          <div className="wrap wrap--narrow">
            <p className="article-error">Could not load ZIP {zipCode}: {error}. Showing preview data instead.</p>
          </div>
        ) : null}

        {!loading && content ? (
          <>
            <section className="article-hero">
              <div className="article-hero__intro">
                <p className="eyebrow eyebrow--accent">Neighborhood profile</p>
                <h1 className="article-hero__headline">
                  ZIP {content.zip_code} · {content.city || "Editorial edition"}
                </h1>
                <p className="article-hero__summary">
                  A slower read on price, schools, and income structure in {locationLabel}.
                  {starLine ? ` Current composite rating: ${starLine}.` : ""}
                </p>
              </div>

              <div className="article-hero__media">
                <img src={content.hero_url} alt={`ZIP ${content.zip_code}`} />
              </div>
            </section>

            <section className="article-kpis">
              <div className="article-kpi">
                <span className="article-kpi__label">Average list price</span>
                <span className="article-kpi__value">{formatMoney(content.housing?.avg_housing_price)}</span>
                <span className="article-kpi__hint">Approximate editorial entry point.</span>
              </div>
              <div className="article-kpi">
                <span className="article-kpi__label">Schools in ZIP</span>
                <span className="article-kpi__value">{content.education?.total_schools ?? "—"}</span>
                <span className="article-kpi__hint">Total school count returned by the backend.</span>
              </div>
              <div className="article-kpi">
                <span className="article-kpi__label">Total IRS income</span>
                <span className="article-kpi__value">{formatCompactMoney(content.irs_totals?.total_income)}</span>
                <span className="article-kpi__hint">Shown in millions for easier scanning.</span>
              </div>
              <div className="article-kpi">
                <span className="article-kpi__label">Composite rating</span>
                <span className="article-kpi__value">{starLine || "Pending"}</span>
                <span className="article-kpi__hint">Star score from the ZIP scoring endpoint.</span>
              </div>
            </section>

            <section className="article-section">
              <div className="article-section__heading">
                <span className="article-section__eyebrow">Housing</span>
                <h2 className="article-section__title">Market profile</h2>
                <p className="article-section__deck">
                  Housing is presented as a calm ledger: fewer numbers, more breathing room, one minimal chart.
                </p>
              </div>

              <div className="article-section__body">
                <div className="article-metric-grid article-metric-grid--four">
                  <div className="article-metric">
                    <span className="article-metric__label">Average price</span>
                    <span className="article-metric__value">{formatMoney(content.housing?.avg_housing_price)}</span>
                  </div>
                  <div className="article-metric">
                    <span className="article-metric__label">Average size</span>
                    <span className="article-metric__value">
                      {content.housing?.avg_house_size != null
                        ? `${Math.round(content.housing.avg_house_size).toLocaleString()} sqft`
                        : "—"}
                    </span>
                  </div>
                  <div className="article-metric">
                    <span className="article-metric__label">Bedrooms</span>
                    <span className="article-metric__value">{content.housing?.avg_bedrooms ?? "—"}</span>
                  </div>
                  <div className="article-metric">
                    <span className="article-metric__label">Bathrooms</span>
                    <span className="article-metric__value">{content.housing?.avg_bathrooms ?? "—"}</span>
                  </div>
                </div>

                <div className="article-chart-frame">
                  <div className="article-chart-frame__header">
                    <p className="article-chart-frame__eyebrow">Scaled view</p>
                    <h3 className="article-chart-frame__title">Housing proportions</h3>
                  </div>
                  <div className="article-chart">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={housingChartData} barCategoryGap="30%">
                        <CartesianGrid vertical={false} stroke="rgba(15,15,15,0.08)" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: "rgba(15,15,15,0.04)" }} />
                        <Bar dataKey="value" fill="#0F0F0F" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            <section className="article-section">
              <div className="article-section__heading">
                <span className="article-section__eyebrow">Education</span>
                <h2 className="article-section__title">School landscape</h2>
                <p className="article-section__deck">
                  Education stays understated: just count, scale, and enough context to anchor the rest of the profile.
                </p>
              </div>

              <div className="article-section__body">
                <div className="article-metric-grid">
                  <div className="article-metric">
                    <span className="article-metric__label">Total schools</span>
                    <span className="article-metric__value">{content.education?.total_schools ?? "—"}</span>
                    <span className="article-metric__hint">All schools surfaced in this ZIP.</span>
                  </div>
                  <div className="article-metric">
                    <span className="article-metric__label">Average enrollment</span>
                    <span className="article-metric__value">
                      {content.education?.avg_school_enrollment != null
                        ? Math.round(content.education.avg_school_enrollment).toLocaleString()
                        : "—"}
                    </span>
                    <span className="article-metric__hint">A simple proxy for school scale.</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="article-section">
              <div className="article-section__heading">
                <span className="article-section__eyebrow">Income</span>
                <h2 className="article-section__title">Income composition</h2>
                <p className="article-section__deck">
                  Minimal charts, thin lines, and restrained color keep the page closer to an editorial spread than a dashboard.
                </p>
              </div>

              <div className="article-section__body">
                <div className="article-chart-frame">
                  <div className="article-chart-frame__header">
                    <p className="article-chart-frame__eyebrow">By bracket</p>
                    <h3 className="article-chart-frame__title">Income versus returns</h3>
                  </div>
                  <div className="article-chart">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={incomeTrendData}>
                        <CartesianGrid vertical={false} stroke="rgba(15,15,15,0.08)" />
                        <XAxis dataKey="bracket" tickLine={false} axisLine={false} />
                        <YAxis yAxisId="income" tickLine={false} axisLine={false} />
                        <YAxis yAxisId="returns" orientation="right" tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Area
                          yAxisId="income"
                          type="monotone"
                          dataKey="totalIncome"
                          stroke="#D4573A"
                          strokeWidth={1.25}
                          fill="rgba(212, 87, 58, 0.08)"
                        />
                        <Line
                          yAxisId="returns"
                          type="monotone"
                          dataKey="returns"
                          stroke="#0F0F0F"
                          strokeWidth={1.15}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="article-chart-frame">
                  <div className="article-chart-frame__header">
                    <p className="article-chart-frame__eyebrow">Totals in millions</p>
                    <h3 className="article-chart-frame__title">Income mix</h3>
                  </div>
                  <div className="article-chart">
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={incomeMixData}>
                        <CartesianGrid vertical={false} stroke="rgba(15,15,15,0.08)" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#0F0F0F"
                          strokeWidth={1.2}
                          fill="rgba(15,15,15,0.06)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="article-income">
                  <div className="article-income__total">
                    <span className="article-metric__label">Total IRS income</span>
                    <p className="article-income__total-value">{formatMoney(content.irs_totals?.total_income)}</p>
                  </div>

                  <div className="article-income__breakdown">
                    <div className="article-income__row">
                      <span className="article-income__row-label">Wages</span>
                      <span className="article-income__row-value">{formatMoney(content.irs_totals?.total_wage_income)}</span>
                    </div>
                    <div className="article-income__row">
                      <span className="article-income__row-label">Capital gains</span>
                      <span className="article-income__row-value">{formatMoney(content.irs_totals?.total_capital_gain)}</span>
                    </div>
                    <div className="article-income__row">
                      <span className="article-income__row-label">Dividends</span>
                      <span className="article-income__row-value">{formatMoney(content.irs_totals?.total_dividend_income)}</span>
                    </div>
                    <div className="article-income__row">
                      <span className="article-income__row-label">Interest</span>
                      <span className="article-income__row-value">{formatMoney(content.irs_totals?.total_interest_income)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="article-section">
              <div className="article-section__heading">
                <span className="article-section__eyebrow">Appendix</span>
                <h2 className="article-section__title">Bracket distribution</h2>
                <p className="article-section__deck">
                  The dense table is pushed to the end like an appendix, so the article can stay spacious up front.
                </p>
              </div>

              <div className="article-section__body">
                <div className="bracket-dist">
                  {(content.irs_by_bracket || []).map((row, index) => {
                    const maxIncome = Math.max(
                      1,
                      ...(content.irs_by_bracket || []).map((item) => item.total_income ?? 0)
                    );
                    const width = `${Math.max(8, ((row.total_income ?? 0) / maxIncome) * 100)}%`;

                    return (
                      <div
                        key={`${row.income_bracket}-${index}`}
                        className={`bracket-dist__row ${index === (content.irs_by_bracket || []).length - 1 ? "bracket-dist__row--accent" : ""}`}
                      >
                        <span className="bracket-dist__label">{row.income_bracket}</span>
                        <div className="bracket-dist__bar-track">
                          <div className="bracket-dist__bar-fill" style={{ width }} />
                        </div>
                        <span className="bracket-dist__value">{formatCompactMoney(row.total_income)}</span>
                      </div>
                    );
                  })}
                </div>

                <DataTable
                  value={bracketRows}
                  dataKey="id"
                  size="small"
                  className="detail-table appendix-table"
                  stripedRows
                >
                  <Column field="income_bracket" header="Income bracket" />
                  <Column field="num_returns" header="Returns" />
                  <Column field="total_income" header="Total income" />
                </DataTable>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
