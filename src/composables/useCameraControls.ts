/**
 * useCameraControls.ts
 * 
 * Composable for camera control helpers.
 * 
 * Features:
 * - Focus on home location
 * - Focus on route (fit bounds)
 * - Reset to default view
 * - Smooth, non-disorienting transitions
 */

import { ref } from 'vue';
import type { Map as MapLibreMap, LngLatBoundsLike } from 'maplibre-gl';
import type { LatLng, RouteOption } from '../types';
import { CAMERA, REGION, getRegionCenterLngLat } from '../config/mapConfig';

// Camera transition configuration
const CAMERA_CONFIG = {
  // Duration for camera movements (ms)
  flyToDuration: 1200,
  easeToDuration: 800,
  
  // Padding around bounds (px)
  boundsPadding: {
    top: 100,
    bottom: 100,
    left: 350, // Account for sidebar
    right: 50,
  },
  
  // Default pitch for route views
  routePitch: 45,
  
  // Zoom levels
  homeZoom: 14,
  minRouteZoom: 10,
  maxRouteZoom: 14,
};

// Track if we're currently animating
const isTransitioning = ref(false);

/**
 * Check if reduced motion is preferred
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on motion preference
 */
function getAnimationDuration(baseDuration: number): number {
  return prefersReducedMotion() ? 0 : baseDuration;
}

/**
 * Focus camera on home location
 */
export function focusOnHome(map: MapLibreMap, home: LatLng): void {
  if (!map || isTransitioning.value) return;
  
  isTransitioning.value = true;
  
  map.easeTo({
    center: [home.lng, home.lat],
    zoom: CAMERA_CONFIG.homeZoom,
    pitch: CAMERA.defaultPitch,
    bearing: CAMERA.defaultBearing,
    duration: getAnimationDuration(CAMERA_CONFIG.easeToDuration),
  });
  
  map.once('moveend', () => {
    isTransitioning.value = false;
  });
}

/**
 * Focus camera on a route (fit bounds to show full route)
 */
export function focusOnRoute(
  map: MapLibreMap,
  route: RouteOption,
  home?: LatLng | null
): void {
  if (!map || isTransitioning.value) return;
  
  // Collect all points to include in bounds
  const points: [number, number][] = route.geometry.map(p => [p.lng, p.lat]);
  
  // Include home if provided
  if (home) {
    points.push([home.lng, home.lat]);
  }
  
  if (points.length === 0) return;
  
  // Calculate bounds
  let minLng = points[0][0];
  let maxLng = points[0][0];
  let minLat = points[0][1];
  let maxLat = points[0][1];
  
  for (const [lng, lat] of points) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  
  const bounds: LngLatBoundsLike = [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
  
  isTransitioning.value = true;
  
  map.fitBounds(bounds, {
    padding: CAMERA_CONFIG.boundsPadding,
    pitch: CAMERA_CONFIG.routePitch,
    bearing: CAMERA.defaultBearing,
    duration: getAnimationDuration(CAMERA_CONFIG.flyToDuration),
    maxZoom: CAMERA_CONFIG.maxRouteZoom,
  });
  
  map.once('moveend', () => {
    isTransitioning.value = false;
  });
}

/**
 * Reset camera to default Step 4 overview
 */
export function resetView(map: MapLibreMap): void {
  if (!map || isTransitioning.value) return;
  
  isTransitioning.value = true;
  
  map.easeTo({
    center: getRegionCenterLngLat(),
    zoom: CAMERA.initialZoom,
    pitch: CAMERA.defaultPitch,
    bearing: CAMERA.defaultBearing,
    duration: getAnimationDuration(CAMERA_CONFIG.easeToDuration),
  });
  
  map.once('moveend', () => {
    isTransitioning.value = false;
  });
}

/**
 * Composable hook
 */
export function useCameraControls() {
  return {
    isTransitioning,
    focusOnHome,
    focusOnRoute,
    resetView,
    CAMERA_CONFIG,
  };
}