/**
 * Haversine distance calculation utility.
 * Returns the great-circle distance between two coordinate pairs in kilometres.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the Haversine (great-circle) distance between two points on Earth.
 * @param lat1 - Latitude of point 1 in degrees
 * @param lng1 - Longitude of point 1 in degrees
 * @param lat2 - Latitude of point 2 in degrees
 * @param lng2 - Longitude of point 2 in degrees
 * @returns Distance in kilometres
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Check if a staff member is within the geo-fence radius of a customer.
 * @param staffLat - Staff latitude in degrees
 * @param staffLng - Staff longitude in degrees
 * @param customerLat - Customer latitude in degrees
 * @param customerLng - Customer longitude in degrees
 * @param radiusMeters - Geo-fence radius in meters
 * @returns true if staff is within the geo-fence
 */
export function isWithinGeoFence(
  staffLat: number,
  staffLng: number,
  customerLat: number,
  customerLng: number,
  radiusMeters: number
): boolean {
  return haversineDistance(staffLat, staffLng, customerLat, customerLng) * 1000 <= radiusMeters;
}
