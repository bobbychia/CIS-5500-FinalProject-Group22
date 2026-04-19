import { Card } from "primereact/card";
import { Link } from "react-router-dom";

export default function ZipAreaCard({ area: z }) {
  const priceK = z.avg_housing_price != null ? `$${Math.round(z.avg_housing_price / 1000)}K` : "—";

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
      <ul className="list-none p-0 m-0 text-sm">
        <li>Value: {z.income_price_ratio != null ? z.income_price_ratio.toFixed(1) : "—"}</li>
        <li>Avg Price: {priceK}</li>
        <li>Schools: {z.num_schools ?? "—"}</li>
      </ul>
    </Card>
  );
}
