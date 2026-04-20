/** Normalize ZIP strings for score map keys (e.g. 19104 vs "19104"). */
export function normalizeZipCode(zip) {
  if (zip == null || zip === "") return "";
  const digits = String(zip).replace(/\D/g, "");
  if (!digits.length) return String(zip).trim();
  return digits.length <= 5 ? digits.padStart(5, "0") : digits;
}
