import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { useNavigate, useParams } from "react-router-dom";
import "../App.css";

const API_BASE = "";

export default function ZipDetailPage() {
  const navigate = useNavigate();
  const { zipCode } = useParams();
  const [detail, setDetail] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API_BASE}/api/zip-areas/${encodeURIComponent(zipCode)}`).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(r.statusText))
      ),
      fetch(`${API_BASE}/api/zip-areas/${encodeURIComponent(zipCode)}/score`).then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([detailData, scoreData]) => {
        setDetail(detailData);
        setScore(scoreData);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [zipCode]);

  const bracketRows =
    detail?.irs_by_bracket?.map((row, i) => ({
      id: i,
      income_bracket: row.income_bracket ?? "—",
      num_returns: row.num_returns ?? "—",
      total_income: row.total_income?.toLocaleString() ?? "—",
    })) ?? [];

  return (
    <div className="page">
      <header className="topbar">
        <div className="flex flex-wrap gap-2 align-items-center">
          <Button
            label="Flexible search"
            icon="pi pi-arrow-left"
            text
            className="text-white"
            onClick={() => navigate("/")}
          />
          <Button
            label="Recommended searches"
            icon="pi pi-star"
            text
            className="text-white"
            onClick={() => navigate("/recommended")}
          />
        </div>
      </header>
      <main className="detail">
        {loading && (
          <div className="flex justify-content-center py-6">
            <ProgressSpinner />
          </div>
        )}
        {error && <Message severity="error" text={error} className="w-full" />}
        {detail && (
          <div className="flex flex-column gap-3">
            <h1 className="m-0 text-3xl">ZIP {detail.zip_code}</h1>

            {score && (
              <Card title="Overall Score">
                <p className="m-0 text-2xl font-bold">
                  {"★".repeat(score.star_rating)}{"☆".repeat(5 - score.star_rating)}
                  {" "}({score.star_rating}/5)
                </p>
                <p className="m-0 text-sm text-color-secondary mt-1">
                  Composite score: {score.final_score?.toFixed(4)} (value 50% · income 30% · schools 20%)
                </p>
              </Card>
            )}

            <Card title="Housing (Query 7)">
              {detail.housing ? (
                <ul className="list-none p-0 m-0">
                  <li>Avg price: ${detail.housing.avg_housing_price?.toLocaleString() ?? "—"}</li>
                  <li>Avg sqft: {detail.housing.avg_house_size?.toLocaleString() ?? "—"}</li>
                  <li>Avg beds: {detail.housing.avg_bedrooms ?? "—"}</li>
                  <li>Avg baths: {detail.housing.avg_bathrooms ?? "—"}</li>
                </ul>
              ) : (
                <p className="m-0">No housing rows.</p>
              )}
            </Card>

            <Card title="Schools (Query 8)">
              {detail.education ? (
                <ul className="list-none p-0 m-0">
                  <li>Schools: {detail.education.total_schools ?? "—"}</li>
                  <li>Avg enrollment: {detail.education.avg_school_enrollment?.toFixed(1) ?? "—"}</li>
                </ul>
              ) : (
                <p className="m-0">No education rows.</p>
              )}
            </Card>

            <Card title="IRS totals (Query 9)">
              {detail.irs_totals ? (
                <ul className="list-none p-0 m-0">
                  <li>Total income: {detail.irs_totals.total_income?.toLocaleString() ?? "—"}</li>
                  <li>Wages: {detail.irs_totals.total_wage_income?.toLocaleString() ?? "—"}</li>
                  <li>Interest: {detail.irs_totals.total_interest_income?.toLocaleString() ?? "—"}</li>
                  <li>Dividends: {detail.irs_totals.total_dividend_income?.toLocaleString() ?? "—"}</li>
                  <li>Capital gains: {detail.irs_totals.total_capital_gain?.toLocaleString() ?? "—"}</li>
                </ul>
              ) : (
                <p className="m-0">No IRS rows.</p>
              )}
            </Card>

            <Card title="Income brackets (Query 10)">
              {bracketRows.length ? (
                <DataTable value={bracketRows} dataKey="id" size="small" stripedRows>
                  <Column field="income_bracket" header="Bracket" />
                  <Column field="num_returns" header="Returns" />
                  <Column field="total_income" header="Total income" />
                </DataTable>
              ) : (
                <p className="m-0">No bracket rows.</p>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
