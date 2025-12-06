/**
 * OSRM Client for Escape Topology
 * 
 * Thin wrapper around the OSRM public demo API for fetching
 * real road-following route geometries.
 */

import type { LatLng } from '../types';

/**
 * Response from OSRM route API
 */
export interface OSRMRouteResponse {
  code: string;
  routes: Array<{
    geometry: {
      type: 'LineString';
      coordinates: [number, number][];
    };
    duration: number;
    distance: number;
    legs: Array<{
      duration: number;
      distance: number;
      summary: string;
      steps: Array<{
        name: string;
        duration: number;
        distance: number;
      }>;
    }>;
  }>;
  waypoints: Array<{
    name: string;
    location: [number, number];
  }>;
}

/**
 * Parsed route result from OSRM
 */
export interface OSRMRouteResult {
  geometry: LatLng[];
  durationSeconds: number;
  distanceMeters: number;
  roadNames: string[];
}

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Fetch a route from OSRM between two points
 */
export async function fetchOSRMRoute(
  start: LatLng,
  end: LatLng
): Promise<OSRMRouteResult | null> {
  const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;
  const url = `${OSRM_BASE_URL}/${coordinates}?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`OSRM request failed with status ${response.status}`);
      return null;
    }

    const data: OSRMRouteResponse = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn('OSRM returned no valid routes:', data.code);
      return null;
    }

    const route = data.routes[0];

    const geometry: LatLng[] = route.geometry.coordinates.map(([lng, lat]) => ({
      lat,
      lng,
    }));

    const roadNames: string[] = [];
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        if (step.name && !roadNames.includes(step.name) && step.name !== '') {
          roadNames.push(step.name);
        }
      }
    }

    return {
      geometry,
      durationSeconds: route.duration,
      distanceMeters: route.distance,
      roadNames,
    };
  } catch (error) {
    console.warn('OSRM route fetch failed:', error);
    return null;
  }
}

/**
 * Generate a cache key for a route request
 */
export function generateRouteCacheKey(start: LatLng, endShelterId: string): string {
  const startLat = start.lat.toFixed(4);
  const startLng = start.lng.toFixed(4);
  return `${startLat},${startLng}:${endShelterId}`;
}