/**
 * Pure TypeScript Haversine distance calculator.
 * Computes the great-circle distance between two points on a sphere given their longitudes and latitudes.
 * Zero external geo dependencies.
 */

const EARTH_RADIUS_KM = 6371.0;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180.0;
}

/**
 * Calculates the great-circle distance in kilometers between two coordinates.
 * @param lat1 Latitude of origin point
 * @param lon1 Longitude of origin point
 * @param lat2 Latitude of destination point
 * @param lon2 Longitude of destination point
 * @returns Distance in kilometers (rounded to 2 decimal places)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Helper to find the nearest point from an origin among an array of target points.
 */
export function findNearestPoint<T extends { lat: number; lng: number }>(
  originLat: number,
  originLng: number,
  points: T[]
): { item: T; distanceKm: number } | null {
  if (!points || points.length === 0) return null;

  let nearestItem: T = points[0];
  let minDistance = calculateHaversineDistance(originLat, originLng, points[0].lat, points[0].lng);

  for (let i = 1; i < points.length; i++) {
    const dist = calculateHaversineDistance(originLat, originLng, points[i].lat, points[i].lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestItem = points[i];
    }
  }

  return { item: nearestItem, distanceKm: minDistance };
}
