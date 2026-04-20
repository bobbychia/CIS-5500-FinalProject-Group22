/**
 * Centralized API client for the CIS 5500 Housing Search backend.
 *
 * Vite proxies `/api/*` to http://127.0.0.1:8000 (see vite.config.js), so in
 * development we can use relative URLs. In production you can override via
 * VITE_API_BASE.
 *
 * All helper function names / paths / query-params match the FastAPI routes in
 * backend/app/routers/*.py. If the backend signature changes, update this file.
 */

export const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) || "";

function buildUrl(path, params) {
  const url = `${API_BASE}${path}`;
  if (!params) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s === "") continue;
    qs.set(k, s);
  }
  const q = qs.toString();
  return q ? `${url}?${q}` : url;
}

async function requestJson(url, { signal, timeoutMs } = {}) {
  const ac = new AbortController();
  const onAbort = () => ac.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) ac.abort(signal.reason);
    else signal.addEventListener("abort", onAbort, { once: true });
  }
  const timer = timeoutMs
    ? setTimeout(() => ac.abort(new DOMException("Timeout", "TimeoutError")), timeoutMs)
    : null;
  try {
    const r = await fetch(url, { signal: ac.signal });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      throw new Error(body || r.statusText || `HTTP ${r.status}`);
    }
    return await r.json();
  } finally {
    if (timer) clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}

/* ---------------------------- /api/zip-areas ---------------------------- */

/**
 * GET /api/zip-areas
 * Search that maps to Milestone 3 Queries 1–4 via `search_mode`.
 * @param {object} params (same names as backend query params)
 * @param {object} [opts] { signal, timeoutMs }
 */
export function searchZipAreas(params, opts) {
  return requestJson(buildUrl("/api/zip-areas", params), opts);
}

/**
 * GET /api/zip-areas/{zip_code}
 * Combined ZIP detail (Queries 7–10). Does NOT return city/state/hero_url.
 */
export function getZipDetail(zipCode, opts) {
  return requestJson(buildUrl(`/api/zip-areas/${encodeURIComponent(zipCode)}`), opts);
}

/**
 * GET /api/zip-areas/{zip_code}/score
 * Composite score + 1–5 star rating.
 */
export function getZipScore(zipCode, opts) {
  return requestJson(buildUrl(`/api/zip-areas/${encodeURIComponent(zipCode)}/score`), opts);
}

/**
 * GET /api/zip-areas/scores?zips=19104,19120
 * Batch composite scores.
 */
export function getZipScoresBatch(zipCodes, opts) {
  const zips = (Array.isArray(zipCodes) ? zipCodes : [zipCodes])
    .map((z) => String(z).trim())
    .filter(Boolean)
    .join(",");
  return requestJson(buildUrl("/api/zip-areas/scores", { zips }), opts);
}

/** GET /api/zip-areas/{zip_code}/housing */
export function getZipHousing(zipCode, opts) {
  return requestJson(buildUrl(`/api/zip-areas/${encodeURIComponent(zipCode)}/housing`), opts);
}

/** GET /api/zip-areas/{zip_code}/education */
export function getZipEducation(zipCode, opts) {
  return requestJson(buildUrl(`/api/zip-areas/${encodeURIComponent(zipCode)}/education`), opts);
}

/** GET /api/zip-areas/{zip_code}/income */
export function getZipIncome(zipCode, opts) {
  return requestJson(buildUrl(`/api/zip-areas/${encodeURIComponent(zipCode)}/income`), opts);
}

/** GET /api/zip-areas/{zip_code}/income-bracket */
export function getZipIncomeBrackets(zipCode, opts) {
  return requestJson(
    buildUrl(`/api/zip-areas/${encodeURIComponent(zipCode)}/income-bracket`),
    opts
  );
}

/** GET /api/zip-areas/ranked/by-income (Query 5) */
export function getZipsRankedByIncome(params = {}, opts) {
  return requestJson(buildUrl("/api/zip-areas/ranked/by-income", params), opts);
}

/** GET /api/zip-areas/ranked/by-price (Query 6) */
export function getZipsRankedByPrice(params = {}, opts) {
  return requestJson(buildUrl("/api/zip-areas/ranked/by-price", params), opts);
}

/* ------------------------------ /api/meta ------------------------------ */

/** GET /api/meta/states */
export function getStates(opts) {
  return requestJson(buildUrl("/api/meta/states"), opts);
}

/** GET /api/meta/cities */
export function getCities({ q = "", state, restrictState = false, limit = 20 } = {}, opts) {
  const params = { q: q ?? "", limit };
  const st = state != null ? String(state).trim() : "";
  if (st) params.state = st;
  if (restrictState) params.restrict_state = "true";
  return requestJson(buildUrl("/api/meta/cities", params), opts);
}

/** GET /api/meta/price-histogram */
export function getPriceHistogram({ state } = {}, opts) {
  return requestJson(buildUrl("/api/meta/price-histogram", { state: state ?? null }), opts);
}

/* --------------------------- URL builders --------------------------- */

/** Build just the query string for /api/zip-areas (used by useZipAreasSearch). */
export function zipAreasSearchUrl(params) {
  return buildUrl("/api/zip-areas", params);
}

const FEATURE_IMAGES = {
  liberty: "https://images.unsplash.com/photo-1546436836-07a91091f160?auto=format&fit=crop&w=1400&q=80",
  philly: "https://images.unsplash.com/photo-1569761316261-9a8696fa2ca3?auto=format&fit=crop&w=1400&q=80",
  goldenGate: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1400&q=80",
  boston: "https://images.unsplash.com/photo-1501973801540-537f08ccae7b?auto=format&fit=crop&w=1400&q=80",
  chicago: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80",
  hollywood: "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?auto=format&fit=crop&w=1400&q=80",
  dc: "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?auto=format&fit=crop&w=1400&q=80",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
  seattle: "https://images.unsplash.com/photo-1502175353174-a7a70e73b362?auto=format&fit=crop&w=1400&q=80",
  austin: "https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&w=1400&q=80",
  nashville: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1400&q=80",
  vegas: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
  mountainLake: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80",
  skyline: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1400&q=80",
  desert: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1400&q=80",
  capitol: "https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?auto=format&fit=crop&w=1400&q=80",
  riverfront: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=80",
  harbor: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=80",
  arch: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=1400&q=80",
  canyon: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80",
  lighthouse: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
  forest: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80",
  bridge: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1400&q=80",
};

const CITY_FEATURE_IMAGE_MAP = {
  "new york": FEATURE_IMAGES.liberty,
  "new york city": FEATURE_IMAGES.liberty,
  "buffalo": FEATURE_IMAGES.liberty,
  "albany": FEATURE_IMAGES.liberty,
  "philadelphia": FEATURE_IMAGES.philly,
  "pittsburgh": FEATURE_IMAGES.bridge,
  "lancaster": FEATURE_IMAGES.capitol,
  "wayne": FEATURE_IMAGES.mountainLake,
  "king of prussia": FEATURE_IMAGES.skyline,
  "harrisburg": FEATURE_IMAGES.capitol,
  "allentown": FEATURE_IMAGES.philly,
  "reading": FEATURE_IMAGES.philly,
  "newark": FEATURE_IMAGES.skyline,
  "jersey city": FEATURE_IMAGES.liberty,
  "trenton": FEATURE_IMAGES.capitol,
  "atlantic city": FEATURE_IMAGES.harbor,
  "boston": FEATURE_IMAGES.boston,
  "cambridge": FEATURE_IMAGES.boston,
  "worcester": FEATURE_IMAGES.boston,
  "providence": FEATURE_IMAGES.harbor,
  "new haven": FEATURE_IMAGES.harbor,
  "hartford": FEATURE_IMAGES.capitol,
  "portland": FEATURE_IMAGES.lighthouse,
  "portsmouth": FEATURE_IMAGES.lighthouse,
  "chicago": FEATURE_IMAGES.chicago,
  "springfield": FEATURE_IMAGES.capitol,
  "detroit": FEATURE_IMAGES.skyline,
  "ann arbor": FEATURE_IMAGES.forest,
  "milwaukee": FEATURE_IMAGES.harbor,
  "madison": FEATURE_IMAGES.capitol,
  "minneapolis": FEATURE_IMAGES.riverfront,
  "saint paul": FEATURE_IMAGES.riverfront,
  "st paul": FEATURE_IMAGES.riverfront,
  "cleveland": FEATURE_IMAGES.harbor,
  "columbus": FEATURE_IMAGES.capitol,
  "cincinnati": FEATURE_IMAGES.bridge,
  "indianapolis": FEATURE_IMAGES.capitol,
  "des moines": FEATURE_IMAGES.capitol,
  "omaha": FEATURE_IMAGES.riverfront,
  "kansas city": FEATURE_IMAGES.arch,
  "st louis": FEATURE_IMAGES.arch,
  "saint louis": FEATURE_IMAGES.arch,
  "wichita": FEATURE_IMAGES.plains || FEATURE_IMAGES.capitol,
  "fargo": FEATURE_IMAGES.forest,
  "sioux falls": FEATURE_IMAGES.canyon,
  "bismarck": FEATURE_IMAGES.capitol,
  "rapid city": FEATURE_IMAGES.canyon,
  "denver": FEATURE_IMAGES.mountainLake,
  "boulder": FEATURE_IMAGES.mountainLake,
  "colorado springs": FEATURE_IMAGES.mountainLake,
  "salt lake city": FEATURE_IMAGES.desert,
  "boise": FEATURE_IMAGES.forest,
  "billings": FEATURE_IMAGES.mountainLake,
  "missoula": FEATURE_IMAGES.forest,
  "jackson": FEATURE_IMAGES.mountainLake,
  "phoenix": FEATURE_IMAGES.desert,
  "scottsdale": FEATURE_IMAGES.desert,
  "tucson": FEATURE_IMAGES.desert,
  "las vegas": FEATURE_IMAGES.vegas,
  "reno": FEATURE_IMAGES.vegas,
  "los angeles": FEATURE_IMAGES.hollywood,
  "hollywood": FEATURE_IMAGES.hollywood,
  "san francisco": FEATURE_IMAGES.goldenGate,
  "san diego": FEATURE_IMAGES.beach,
  "sacramento": FEATURE_IMAGES.capitol,
  "san jose": FEATURE_IMAGES.goldenGate,
  "oakland": FEATURE_IMAGES.goldenGate,
  "portland, or": FEATURE_IMAGES.forest,
  "portland or": FEATURE_IMAGES.forest,
  "portland": FEATURE_IMAGES.lighthouse,
  "salem": FEATURE_IMAGES.forest,
  "eugene": FEATURE_IMAGES.forest,
  "seattle": FEATURE_IMAGES.seattle,
  "tacoma": FEATURE_IMAGES.seattle,
  "spokane": FEATURE_IMAGES.forest,
  "olympia": FEATURE_IMAGES.seattle,
  "honolulu": FEATURE_IMAGES.beach,
  "anchorage": FEATURE_IMAGES.mountainLake,
  "juneau": FEATURE_IMAGES.mountainLake,
  "miami": FEATURE_IMAGES.beach,
  "orlando": FEATURE_IMAGES.beach,
  "tampa": FEATURE_IMAGES.beach,
  "jacksonville": FEATURE_IMAGES.harbor,
  "tallahassee": FEATURE_IMAGES.capitol,
  "atlanta": FEATURE_IMAGES.skyline,
  "savannah": FEATURE_IMAGES.harbor,
  "charleston": FEATURE_IMAGES.harbor,
  "columbia": FEATURE_IMAGES.capitol,
  "charlotte": FEATURE_IMAGES.skyline,
  "raleigh": FEATURE_IMAGES.capitol,
  "durham": FEATURE_IMAGES.forest,
  "greensboro": FEATURE_IMAGES.forest,
  "nashville": FEATURE_IMAGES.nashville,
  "memphis": FEATURE_IMAGES.riverfront,
  "knoxville": FEATURE_IMAGES.forest,
  "louisville": FEATURE_IMAGES.riverfront,
  "lexington": FEATURE_IMAGES.forest,
  "birmingham": FEATURE_IMAGES.skyline,
  "montgomery": FEATURE_IMAGES.capitol,
  "mobile": FEATURE_IMAGES.harbor,
  "new orleans": FEATURE_IMAGES.harbor,
  "baton rouge": FEATURE_IMAGES.capitol,
  "jackson": FEATURE_IMAGES.capitol,
  "little rock": FEATURE_IMAGES.capitol,
  "dallas": FEATURE_IMAGES.skyline,
  "houston": FEATURE_IMAGES.skyline,
  "austin": FEATURE_IMAGES.austin,
  "san antonio": FEATURE_IMAGES.austin,
  "fort worth": FEATURE_IMAGES.skyline,
  "el paso": FEATURE_IMAGES.desert,
  "oklahoma city": FEATURE_IMAGES.capitol,
  "tulsa": FEATURE_IMAGES.skyline,
  "albuquerque": FEATURE_IMAGES.desert,
  "santa fe": FEATURE_IMAGES.desert,
  "richmond": FEATURE_IMAGES.capitol,
  "virginia beach": FEATURE_IMAGES.beach,
  "norfolk": FEATURE_IMAGES.harbor,
  "washington": FEATURE_IMAGES.dc,
  "arlington": FEATURE_IMAGES.dc,
  "baltimore": FEATURE_IMAGES.harbor,
};

const STATE_FEATURE_IMAGE_MAP = {
  NY: FEATURE_IMAGES.liberty,
  PA: FEATURE_IMAGES.philly,
  CA: FEATURE_IMAGES.goldenGate,
  MA: FEATURE_IMAGES.boston,
  IL: FEATURE_IMAGES.chicago,
  DC: FEATURE_IMAGES.dc,
  FL: FEATURE_IMAGES.beach,
  WA: FEATURE_IMAGES.seattle,
  TX: FEATURE_IMAGES.austin,
  TN: FEATURE_IMAGES.nashville,
  NV: FEATURE_IMAGES.vegas,
  CO: FEATURE_IMAGES.mountainLake,
  AZ: FEATURE_IMAGES.desert,
  UT: FEATURE_IMAGES.desert,
  NM: FEATURE_IMAGES.desert,
  OR: FEATURE_IMAGES.forest,
  AK: FEATURE_IMAGES.mountainLake,
  HI: FEATURE_IMAGES.beach,
  GA: FEATURE_IMAGES.skyline,
  SC: FEATURE_IMAGES.harbor,
  NC: FEATURE_IMAGES.skyline,
  LA: FEATURE_IMAGES.harbor,
  MD: FEATURE_IMAGES.harbor,
  NJ: FEATURE_IMAGES.liberty,
  VA: FEATURE_IMAGES.dc,
  MI: FEATURE_IMAGES.skyline,
  WI: FEATURE_IMAGES.harbor,
  MN: FEATURE_IMAGES.riverfront,
  MO: FEATURE_IMAGES.arch,
  OH: FEATURE_IMAGES.bridge,
  IN: FEATURE_IMAGES.capitol,
  IA: FEATURE_IMAGES.capitol,
  NE: FEATURE_IMAGES.riverfront,
  KS: FEATURE_IMAGES.capitol,
  OK: FEATURE_IMAGES.capitol,
  KY: FEATURE_IMAGES.forest,
  AL: FEATURE_IMAGES.skyline,
  MS: FEATURE_IMAGES.capitol,
  AR: FEATURE_IMAGES.capitol,
  CT: FEATURE_IMAGES.harbor,
  RI: FEATURE_IMAGES.harbor,
  ME: FEATURE_IMAGES.lighthouse,
  NH: FEATURE_IMAGES.lighthouse,
  VT: FEATURE_IMAGES.forest,
  DE: FEATURE_IMAGES.harbor,
  ID: FEATURE_IMAGES.forest,
  MT: FEATURE_IMAGES.mountainLake,
  WY: FEATURE_IMAGES.mountainLake,
  ND: FEATURE_IMAGES.forest,
  SD: FEATURE_IMAGES.canyon,
  WV: FEATURE_IMAGES.forest,
};

function isPlaceholderThumb(url) {
  return !url || url.includes("placehold.co");
}

export function cityFeatureImage({ city, state, thumbUrl, zipCode } = {}) {
  const key = String(city || "").trim().toLowerCase();
  if (CITY_FEATURE_IMAGE_MAP[key]) return CITY_FEATURE_IMAGE_MAP[key];
  const stateKey = String(state || "").trim().toUpperCase();
  if (STATE_FEATURE_IMAGE_MAP[stateKey]) return STATE_FEATURE_IMAGE_MAP[stateKey];
  if (!isPlaceholderThumb(thumbUrl)) return thumbUrl;

  const locationBits = [city, state, zipCode].filter(Boolean).join(" ");
  return `https://placehold.co/1280x720/e9ecef/1f2937?text=${encodeURIComponent(locationBits || "Ideal Nest")}`;
}

/** Deterministic placeholder image for a ZIP, matching backend thumb style. */
export function zipThumbUrl(zipCode) {
  const z = String(zipCode || "").trim() || "?????";
  return `https://placehold.co/1280x640/e2e8f0/1e293b?text=ZIP+${encodeURIComponent(z)}`;
}
