import { Card } from "primereact/card";
import { Link } from "react-router-dom";

export default function ZipAreaCard({ area: z }) {
  const header = (
    <Link className="text-primary font-bold text-lg no-underline" to={`/zip/${encodeURIComponent(z.zip_code)}`}>
      ZIP {z.zip_code}
    </Link>
  );

  return (
    <Card className="shadow-2 h-full" header={header}>
      <p className="text-color-secondary m-0 mb-2">
        {z.city ?? "—"}, {z.state ?? "—"}
      </p>
      <div className="mb-2 border-round overflow-hidden" style={{ maxHeight: 140 }}>
        <img
          src={z.thumb_url}
          alt=""
          loading="lazy"
          className="w-full"
          style={{ objectFit: "cover", display: "block" }}
        />
      </div>
      <ul className="list-none p-0 m-0 mb-2 text-sm">
        <li>
          Avg list $
          {z.avg_housing_price != null ? Math.round(z.avg_housing_price).toLocaleString() : "—"}
        </li>
        <li>Schools {z.num_schools ?? "—"}</li>
        <li>
          $/sqft (Q4) {z.avg_price_per_sqft != null ? z.avg_price_per_sqft.toFixed(0) : "—"}
        </li>
      </ul>
      <p className="text-sm m-0 mb-1">
        <span className="font-semibold">Income ÷ avg price:</span>{" "}
        {z.income_price_ratio != null ? z.income_price_ratio.toFixed(2) : "—"}
      </p>
      <p className="text-sm m-0 mb-1">
        <span className="font-semibold">Total ZIP income (IRS):</span>{" "}
        {z.total_income != null ? Math.round(z.total_income).toLocaleString() : "—"}
      </p>
      <p className="text-sm m-0">
        <span className="font-semibold">Avg enrollment:</span>{" "}
        {z.avg_school_enrollment != null ? z.avg_school_enrollment.toFixed(0) : "—"}
      </p>
    </Card>
  );
}
