/**
 * IRS ZIP-level income brackets use numeric codes 1–6 (see csv/IRS_Final.csv),
 * aligned with SOI AGI six-bin ordering. Labels are compact ranges (<, –, ≥).
 */

export const IRS_INCOME_BRACKET_SHORT = {
  1: "< 25k",
  2: "25k – 50k",
  3: "50k – 75k",
  4: "75k – 100k",
  5: "100k – 200k",
  6: "≥ 200k",
};

/** Same numeric ranges as SHORT; kept for call sites that still ask for "long". */
export const IRS_INCOME_BRACKET_LONG = { ...IRS_INCOME_BRACKET_SHORT };

/** Short label for radar axis; long matches short (compact range notation everywhere). */
export function formatIrsIncomeBracket(raw, style = "long") {
  if (raw == null || raw === "—") return "—";
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw).trim(), 10);
  if (!Number.isNaN(n) && n >= 1 && n <= 6) {
    return style === "short" ? IRS_INCOME_BRACKET_SHORT[n] : IRS_INCOME_BRACKET_LONG[n];
  }
  const s = String(raw).replace(/\$/g, "").replace(/\s+/g, " ").trim();
  return s || "—";
}
