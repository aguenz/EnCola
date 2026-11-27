import type {Coordinates} from '../types';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Haversine distance in meters between two WGS84 coordinates.
 */
export function haversineDistanceMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Interpolates a coordinate along a polyline given progress t in [0, 1].
 */
export function interpolateAlongRoute(
  polyline: [number, number][],
  progress: number
): Coordinates {
  if (polyline.length === 0) return {lat: 10.4932, lng: -66.8548};
  if (polyline.length === 1) return {lat: polyline[0][0], lng: polyline[0][1]};

  const clamped = Math.max(0, Math.min(1, progress));
  const totalSegments = polyline.length - 1;
  const scaled = clamped * totalSegments;
  const idx = Math.min(Math.floor(scaled), totalSegments - 1);
  const localT = scaled - idx;

  const [lat1, lng1] = polyline[idx];
  const [lat2, lng2] = polyline[idx + 1];

  return {
    lat: lat1 + (lat2 - lat1) * localT,
    lng: lng1 + (lng2 - lng1) * localT,
  };
}

/**
 * Generates a unique 6-character alphanumeric voucher code (no ambiguous 0/O/1/I).
 */
export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Formats remaining milliseconds as MM:SS for countdown displays.
 */
export function formatCountdown(msRemaining: number): string {
  const safeSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
