/**
 * Lightweight client-side geocoding for the "location" text column on coach_profiles.
 *
 * TODO: replace with real lat/lng columns on coach_profiles and server-side distance
 * filtering once a migration adds those columns. See supabase/migrations/*_discover_coaches_rpc.sql
 * for the intended shape.
 */

export type LatLng = [number, number];

export const CITY_COORDS: Record<string, LatLng> = {
  "los angeles": [34.0522, -118.2437],
  chicago: [41.8781, -87.6298],
  austin: [30.2672, -97.7431],
  miami: [25.7617, -80.1918],
  "new york": [40.7128, -74.006],
  "san diego": [32.7157, -117.1611],
  "tel aviv": [32.0853, 34.7818],
  jerusalem: [31.7683, 35.2137],
  haifa: [32.794, 34.9896],
  "ramat gan": [32.0684, 34.8248],
  herzliya: [32.1629, 34.8447],
  netanya: [32.3215, 34.8532],
  "rishon lezion": [31.9642, 34.8045],
  "petah tikva": [32.0867, 34.8869],
  "beer sheva": [31.2518, 34.7913],
  ashdod: [31.8044, 34.6553],
  london: [51.5074, -0.1278],
  paris: [48.8566, 2.3522],
  berlin: [52.52, 13.405],
  barcelona: [41.3874, 2.1686],
  madrid: [40.4168, -3.7038],
  rome: [41.9028, 12.4964],
  amsterdam: [52.3676, 4.9041],
  dubai: [25.2048, 55.2708],
  toronto: [43.6532, -79.3832],
  sydney: [-33.8688, 151.2093],
  "san francisco": [37.7749, -122.4194],
  boston: [42.3601, -71.0589],
  seattle: [47.6062, -122.3321],
  denver: [39.7392, -104.9903],
  atlanta: [33.749, -84.388],
  dallas: [32.7767, -96.797],
  houston: [29.7604, -95.3698],
  phoenix: [33.4484, -112.074],
  philadelphia: [39.9526, -75.1652],
  "las vegas": [36.1699, -115.1398],
  portland: [45.5051, -122.675],
};

export function geocodeLocation(location: string | null | undefined): LatLng | null {
  if (!location) return null;
  const lower = location.toLowerCase().trim();

  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) return coords;
  }

  const firstPart = lower.split(",")[0].trim();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (firstPart === city || city.includes(firstPart)) return coords;
  }

  return null;
}

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in kilometers between two [lat, lng] points. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
