/**
 * Map Configuration for Escape Topology
 * 
 * This file centralizes all map-related settings including:
 * - Region definition (center, bounds, zoom levels)
 * - Tile sources (base map, terrain)
 * - Default camera settings
 * 
 * The region is a fictional "Example Wildfire Foothills Region" anchored
 * in real California Sierra Nevada foothill geography for realistic terrain.
 * 
 * To swap regions in the future, update the REGION constant and
 * associated shelter/risk data files.
 */

import type { LatLng } from '../types';

/**
 * Region Configuration
 * 
 * Centered on a fictional area in the Sierra Nevada foothills.
 * The coordinates roughly correspond to the area between Placerville
 * and the Eldorado National Forest - chosen for realistic WUI terrain
 * (canyons, ridges, mixed forest/grassland) without referencing a
 * specific town or known disaster site.
 */
export const REGION = {
  // Display name shown in the UI
  name: 'Example Wildfire Foothills Region, CA',
  displaySubtitle: '(Demo)',
  
  // Center point of the region
  center: {
    lat: 38.73,
    lng: -120.82,
  } as LatLng,
  
  // Bounding box for the region [sw, ne]
  // Users should select homes within this area
  bounds: {
    sw: { lat: 38.55, lng: -121.05 } as LatLng,
    ne: { lat: 38.91, lng: -120.59 } as LatLng,
  },
  
  // Approximate dimensions for reference
  // ~40km x 40km area, suitable for 10-30 mile evacuation routes
  approximateSizeKm: {
    width: 40,
    height: 40,
  },
};

/**
 * Camera / View Settings
 * 
 * These define the default map view. The moderate pitch (tilt) allows
 * users to see terrain elevation without being disorienting.
 */
export const CAMERA = {
  // Initial zoom level (region overview)
  initialZoom: 10,
  
  // Zoom range
  minZoom: 8,
  maxZoom: 16,
  
  // Pitch (tilt) in degrees
  // 52° provides dramatic terrain visibility while keeping the map readable
  defaultPitch: 52,
  maxPitch: 65,
  
  // Bearing (rotation) - 0 = north up
  // We keep north up for clarity; can be unlocked later if needed
  defaultBearing: 0,
  
  // Animation duration for camera movements (ms)
  flyToDuration: 1500,
};

/**
 * MapTiler API Key
 * Loaded from environment variable (set in .env file)
 * See .env.example for setup instructions
 */
const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || '';

/**
 * Terrain Configuration
 * 
 * 3D terrain is a visual enhancement, not a core dependency.
 * The app should work perfectly without terrain enabled.
 * 
 * Fallback chain: MapTiler → AWS Terrarium → no terrain
 */
export const TERRAIN_CONFIG = {
  // Whether to attempt enabling terrain at all
  enabled: true,
  
  // Exaggeration factor for terrain relief
  // 1.0 = realistic, 1.5 = visually obvious hills, 2.0 = dramatic
  // Using 1.9 for prominent but not cartoonish hills
  exaggeration: 1.9,
  
  // MapTiler terrain source (primary - requires API key)
  maptiler: MAPTILER_API_KEY ? {
    url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_API_KEY}`,
    tileSize: 512,
  } : null,
  
  // AWS Terrarium terrain source (fallback - no API key needed)
  terrarium: {
    tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
    tileSize: 256,
    encoding: 'terrarium' as const,
    maxzoom: 15,
  },
};

/**
 * Hillshade Configuration
 * 
 * Hillshade adds shadows/highlights based on simulated sun position,
 * making terrain relief visible even at low camera pitch.
 */
export const HILLSHADE_CONFIG = {
  enabled: true,
  
  // Sun direction (0 = north, 90 = east, 180 = south, 270 = west)
  // 315 = northwest, classic cartographic convention
  illuminationDirection: 315,
  
  // How pronounced the shading effect is (0-1)
  exaggeration: 0.5,
  
  // Shadow color (for slopes facing away from sun)
  shadowColor: '#3d4a5c',
  
  // Highlight color (for slopes facing sun)
  highlightColor: '#ffffff',
  
  // Accent color (affects overall tone)
  accentColor: '#4a6178',
};

/**
 * Atmospheric/Fog Configuration
 * 
 * Fog adds depth perception by fading distant terrain,
 * creating a more realistic and immersive 3D effect.
 */
export const FOG_CONFIG = {
  enabled: true,
  
  // Base fog color at horizon
  color: '#e8eef5',
  
  // Sky color at high altitude  
  highColor: '#a8c4e0',
  
  // How much fog blends into the horizon (0-1)
  horizonBlend: 0.08,
  
  // Fog density range [start, end] in terms of pitch
  // Lower values = fog appears closer
  range: [1, 12] as [number, number],
  
  // Star intensity (0 = no stars, only relevant for dark themes)
  starIntensity: 0,
};

/**
 * Tile Sources
 * 
 * Base map uses OpenFreeMap tiles (clean, light style).
 */
export const TILES = {
  // Base map style
  // Using OpenFreeMap's positron style - clean, light, minimal
  style: 'https://tiles.openfreemap.org/styles/positron',
};

/**
 * Interaction Constraints
 * 
 * These settings keep the map usable and prevent disorientation.
 */
export const INTERACTION = {
  // Whether to allow map rotation (bearing change)
  // Disabled for MVP to keep north-up orientation
  allowRotation: false,
  
  // Whether to allow pitch (tilt) adjustment by user
  // Enabled but constrained by maxPitch
  allowPitchAdjustment: true,
  
  // Double-click zoom
  doubleClickZoom: true,
  
  // Scroll zoom
  scrollZoom: true,
};

/**
 * Helper: Check if a location is within the region bounds
 */
export function isWithinRegion(location: LatLng): boolean {
  return (
    location.lat >= REGION.bounds.sw.lat &&
    location.lat <= REGION.bounds.ne.lat &&
    location.lng >= REGION.bounds.sw.lng &&
    location.lng <= REGION.bounds.ne.lng
  );
}

/**
 * Helper: Get the center of the region as [lng, lat] array
 * (MapLibre uses [lng, lat] order)
 */
export function getRegionCenterLngLat(): [number, number] {
  return [REGION.center.lng, REGION.center.lat];
}

/**
 * Helper: Get region bounds as MapLibre LngLatBoundsLike
 */
export function getRegionBounds(): [[number, number], [number, number]] {
  return [
    [REGION.bounds.sw.lng, REGION.bounds.sw.lat],
    [REGION.bounds.ne.lng, REGION.bounds.ne.lat],
  ];
}