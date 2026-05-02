/** Backend encodes grades as: -2 = PK, -1 = KG, 1–12 = grade. */

function gradeToken(n) {
  if (n == null || Number.isNaN(n)) return null;
  if (n === -2) return "PK";
  if (n === -1) return "K";
  if (n >= 1 && n <= 12) return `${n}年级`;
  if (n > 12) return `${n}年级`;
  return null;
}

/** Human-readable span for ZIP education summary (Chinese labels). */
export function formatZipGradeSpan(low, high) {
  if (low == null || high == null || Number.isNaN(low) || Number.isNaN(high)) return "—";
  if (low >= 1 && high >= 1 && low <= 12 && high <= 12) {
    if (low === high) return `${low}年级`;
    return `${low}–${high}年级`;
  }
  const a = gradeToken(low);
  const b = gradeToken(high);
  if (!a || !b) return "—";
  if (low === high) return a;
  return `${a}–${b}`;
}
