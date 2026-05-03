import { useEffect, useMemo, useState } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SearchNav from "../components/SearchNav.jsx";
import { cityFeatureImage, getZipDetail, getZipScore } from "../lib/api.js";
import { getPreviewDetail } from "../lib/uiPreviewData.js";
import "../App.css";

function formatMoney(value) {
  return value != null ? `$${Math.round(value).toLocaleString()}` : "—";
}

function formatCompactMoney(value) {
  return value != null ? `$${Math.round(value / 1_000_000).toLocaleString()}M` : "—";
}

const INCOME_PIE_COLORS = ["#D4573A", "#0F0F0F", "#3b82f6", "#94a3b8"];

/** Editorial housing bars: accent, forest, slate, umber — tuned to warm paper bg. */
const HOUSING_BAR_FILLS = ["#D4573A", "#3d5c4e", "#5a6978", "#9a7b56"];

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
        city: detail.city ?? navState.city ?? null,
        state: detail.state ?? navState.state ?? null,
        housing: detail.housing ?? null,
        education: detail.education ?? null,
        irs_totals: detail.irs_totals ?? null,
        irs_by_bracket: detail.irs_by_bracket ?? [],
      }
    : null;

  const content = realContent ?? previewDetail;

  const heroUrl = useMemo(
    () =>
      cityFeatureImage({
        city: content?.city,
        state: content?.state,
        thumbUrl: navState.thumb_url ?? null,
        zipCode: content?.zip_code,
      }),
    [content?.city, content?.state, navState.thumb_url, content?.zip_code]
  );

  const locationLabel =
    [content?.city, content?.state].filter(Boolean).join(", ") || "United States";
  const starLine =
    score?.star_rating != null
      ? `${"★".repeat(score.star_rating)}${"☆".repeat(Math.max(0, 5 - score.star_rating))}`
      : null;

  const incomeTrendData =
    content?.irs_by_bracket?.map((row) => ({
      bracket: row.income_bracket?.replace("$", "").replace(" - ", " to ") ?? "—",
      totalIncome: Number(((row.total_income ?? 0) / 1_000_000).toFixed(1)),
      returns: row.num_returns ?? 0,
    })) ?? [];

  const incomeMixPie = useMemo(() => {
    const t = content?.irs_totals;
    if (!t) return { slices: [], sum: 0 };
    const slices = [
      { name: "Wages", value: Math.max(0, Number(t.total_wage_income ?? 0)) },
      { name: "Capital gains", value: Math.max(0, Number(t.total_capital_gain ?? 0)) },
      { name: "Dividends", value: Math.max(0, Number(t.total_dividend_income ?? 0)) },
      { name: "Interest", value: Math.max(0, Number(t.total_interest_income ?? 0)) },
    ].filter((s) => s.value > 0);
    const sum = slices.reduce((a, s) => a + s.value, 0);
    return { slices, sum };
  }, [content?.irs_totals]);

  const incomeRadarData = useMemo(() => {
    const rows = content?.irs_by_bracket ?? [];
    if (rows.length === 0) return [];
    const maxInc = Math.max(...rows.map((r) => Number(r.total_income ?? 0)), 1);
    const maxRet = Math.max(...rows.map((r) => Number(r.num_returns ?? 0)), 1);
    return rows.map((row) => {
      const raw = String(row.income_bracket ?? "—").replace(/\$/g, "");
      const short = raw.length > 18 ? `${raw.slice(0, 17)}…` : raw;
      return {
        subject: short || "—",
        income: Math.round(((Number(row.total_income) || 0) / maxInc) * 100),
        returns: Math.round(((Number(row.num_returns) || 0) / maxRet) * 100),
      };
    });
  }, [content?.irs_by_bracket]);

  const housingChartData = useMemo(() => {
    const h = content?.housing;
    const priceK = Number(((h?.avg_housing_price ?? 0) / 100_000).toFixed(4));
    const sizeU = Number(((h?.avg_house_size ?? 0) / 500).toFixed(4));
    const beds = Number(h?.avg_bedrooms ?? 0);
    const baths = Number(h?.avg_bathrooms ?? 0);
    const rows = [
      { label: "Price", unit: priceK },
      { label: "Size", unit: sizeU },
      { label: "Beds", unit: beds },
      { label: "Baths", unit: baths },
    ];
    const maxU = Math.max(...rows.map((r) => r.unit), 1e-9);
    return rows.map((r, i) => ({
      label: r.label,
      value: Number(Math.min(5, (r.unit / maxU) * 5).toFixed(2)),
      fill: HOUSING_BAR_FILLS[i % HOUSING_BAR_FILLS.length],
    }));
  }, [content?.housing]);

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
            <section className="article-hero article-hero--split">
              <div className="article-hero__intro">
                <p className="eyebrow eyebrow--accent">Neighborhood profile</p>
                <h1 className="article-hero__headline">
                  ZIP {content.zip_code}
                  {content.city ? (
                    <>
                      {" "}
                      · <span className="article-hero__place">{content.city}</span>
                    </>
                  ) : null}
                </h1>
                <p className="article-hero__loc-line">
                  {locationLabel}
                  {starLine ? (
                    <>
                      {" "}
                      <span className="article-hero__stars" aria-label="Composite rating">
                        {starLine}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>

              <div className="article-hero__media">
                <img src={heroUrl} alt={`ZIP ${content.zip_code}`} />
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
                    <p className="article-chart-frame__subdeck">
                      Bars use a 0–5 score for <strong>this ZIP only</strong>: price (per $100k), size (per 500 sqft),
                      beds, and baths are scaled so the tallest bar here is 5.
                    </p>
                  </div>
                  <div className="article-chart">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        data={housingChartData}
                        barCategoryGap="30%"
                        margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                      >
                        <CartesianGrid vertical={false} stroke="rgba(15,15,15,0.08)" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 5]}
                          ticks={[0, 1, 2, 3, 4, 5]}
                          interval={0}
                          minTickGap={0}
                          width={40}
                          allowDecimals
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(15,15,15,0.04)" }}
                          formatter={(v) => [`${v} / 5 (within this ZIP)`, "Score"]}
                        />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                          {housingChartData.map((entry, i) => (
                            <Cell key={entry.label} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            <section className="article-section">
              <div className="article-section__heading">
                <span className="article-section__eyebrow">Education</span>
                <h2 className="article-section__title">School resource</h2>
              </div>

              <div className="article-section__body">
                <div className="article-school-solo">
                  <span className="article-school-solo__n">{content.education?.total_schools ?? "—"}</span>
                  <span className="article-school-solo__txt"> schools in this ZIP</span>
                </div>
              </div>
            </section>

            <section className="article-section article-section--income-stack">
              <header className="article-income-stack__header">
                <span className="article-section__eyebrow">Income</span>
                <h2 className="article-section__title">Income composition</h2>
                <p className="article-section__deck">
                  Mix, bracket shape, and filings trend—same read whether you arrived from Find, Quick, or Rank.
                </p>
              </header>

              <div className="article-income-trio">
                <div className="article-chart-frame article-chart-frame--trio">
                  <div className="article-chart-frame__header">
                    <p className="article-chart-frame__eyebrow">Composition</p>
                    <h3 className="article-chart-frame__title article-chart-frame__title--trio">Income mix</h3>
                  </div>
                  <div className="article-chart article-chart--trio">
                    {incomeMixPie.sum > 0 ? (
                      <ResponsiveContainer width="100%" height={268}>
                        <PieChart>
                          <Pie
                            data={incomeMixPie.slices}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={82}
                            paddingAngle={2}
                          >
                            {incomeMixPie.slices.map((_, i) => (
                              <Cell key={i} fill={INCOME_PIE_COLORS[i % INCOME_PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatMoney(Number(value))} />
                          <Legend
                            wrapperStyle={{ fontSize: "11px" }}
                            formatter={(value) => (
                              <span style={{ color: "var(--ink-muted)" }}>{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="article-chart__empty">No income mix for this ZIP.</p>
                    )}
                  </div>
                </div>

                <div className="article-chart-frame article-chart-frame--trio">
                  <div className="article-chart-frame__header">
                    <p className="article-chart-frame__eyebrow">By bracket</p>
                    <h3 className="article-chart-frame__title article-chart-frame__title--trio">Bracket radar</h3>
                  </div>
                  <div className="article-chart article-chart--trio article-chart--radar">
                    {incomeRadarData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={268}>
                        <RadarChart data={incomeRadarData} cx="50%" cy="50%" outerRadius="72%">
                          <PolarGrid stroke="rgba(15,15,15,0.12)" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: "var(--ink-muted)", fontSize: 9 }}
                          />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name="Income"
                            dataKey="income"
                            stroke="#D4573A"
                            fill="#D4573A"
                            fillOpacity={0.28}
                            strokeWidth={1.2}
                          />
                          <Radar
                            name="Returns"
                            dataKey="returns"
                            stroke="#0F0F0F"
                            fill="#0F0F0F"
                            fillOpacity={0.1}
                            strokeWidth={1.2}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: "11px", paddingTop: 6 }}
                            formatter={(value) => <span style={{ color: "var(--ink-muted)" }}>{value}</span>}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="article-chart__empty">No bracket curve.</p>
                    )}
                  </div>
                </div>

                <div className="article-chart-frame article-chart-frame--trio">
                  <div className="article-chart-frame__header">
                    <p className="article-chart-frame__eyebrow">By bracket</p>
                    <h3 className="article-chart-frame__title article-chart-frame__title--trio">Trend & filings</h3>
                  </div>
                  <div className="article-chart article-chart--trio">
                    <ResponsiveContainer width="100%" height={268}>
                      <LineChart data={incomeTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid vertical={false} stroke="rgba(15,15,15,0.08)" />
                        <XAxis dataKey="bracket" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis
                          yAxisId="income"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          width={32}
                        />
                        <YAxis
                          yAxisId="returns"
                          orientation="right"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          width={32}
                        />
                        <Tooltip />
                        <Area
                          yAxisId="income"
                          type="monotone"
                          dataKey="totalIncome"
                          stroke="#D4573A"
                          strokeWidth={1.2}
                          fill="rgba(212, 87, 58, 0.08)"
                        />
                        <Line
                          yAxisId="returns"
                          type="monotone"
                          dataKey="returns"
                          stroke="#0F0F0F"
                          strokeWidth={1.1}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="article-income article-income--after-trio">
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
            </section>

            <section className="article-section article-section--appendix-unified">
              <header className="article-appendix-header">
                <span className="article-section__eyebrow">Appendix</span>
                <h2 className="article-section__title">Bracket distribution</h2>
              </header>

              <div className="bracket-appendix">
                <div className="bracket-appendix__legend" aria-hidden>
                  <div className="bracket-appendix__legend-barside">
                    <span>#</span>
                    <span>Bracket</span>
                    <span className="bracket-appendix__legend-share-hint">Share vs max in ZIP</span>
                  </div>
                  <div className="bracket-appendix__legend-stats">
                    <span>Returns</span>
                    <span>Total income</span>
                  </div>
                </div>
                {(content.irs_by_bracket || []).map((row, index, arr) => {
                  const maxIncome = Math.max(
                    1,
                    ...arr.map((item) => item.total_income ?? 0)
                  );
                  const width = `${Math.max(6, ((row.total_income ?? 0) / maxIncome) * 100)}%`;
                  const isLast = index === arr.length - 1;

                  return (
                    <div
                      key={`${row.income_bracket}-${index}`}
                      className={`bracket-appendix__row ${isLast ? "bracket-appendix__row--accent" : ""}`}
                    >
                      <div className="bracket-appendix__barside">
                        <div className="bracket-appendix__meta">
                          <span className="bracket-appendix__idx">{index + 1}</span>
                          <span className="bracket-appendix__label">{row.income_bracket ?? "—"}</span>
                        </div>
                        <div className="bracket-appendix__track">
                          <div className="bracket-appendix__fill" style={{ width }} />
                        </div>
                      </div>
                      <div className="bracket-appendix__stats">
                        <div className="bracket-appendix__stat">
                          <span className="bracket-appendix__stat-label">Returns</span>
                          <span className="bracket-appendix__stat-value">
                            {(row.num_returns ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="bracket-appendix__stat">
                          <span className="bracket-appendix__stat-label">Total income</span>
                          <span className="bracket-appendix__stat-value">{formatMoney(row.total_income)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
