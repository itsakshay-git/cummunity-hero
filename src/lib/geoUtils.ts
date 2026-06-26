/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula. Returns distance in meters.
 */
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Resolves a city name from a community area name string.
 */
export function getCityFromArea(areaName?: string): string | null {
  if (!areaName) return null;
  const parts = areaName.split(',');
  const lastPart = parts[parts.length - 1].trim();
  const lowerLast = lastPart.toLowerCase();
  if (lowerLast === 'pune') return 'Pune';
  if (lowerLast === 'mumbai') return 'Mumbai';
  if (lowerLast === 'bangalore') return 'Bangalore';
  if (lowerLast === 'delhi') return 'Delhi';
  if (lowerLast === 'chennai') return 'Chennai';
  if (lowerLast === 'chandrapur') return 'Chandrapur';
  return lastPart;
}

