/**
 * Route Generator for Escape Topology
 * 
 * Generates evacuation routes from home to shelters using:
 * 1. OSRM for real road-following geometries (primary)
 * 2. Synthetic curved lines as fallback
 * 
 * Route scoring includes:
 * - Distance and time factors
 * - Scenario-based risk
 * - Household constraint modifiers
 * - Fire zone exposure penalties
 */

import type { 
  LatLng, 
  HouseholdProfile, 
  ScenarioId, 
  RouteOption, 
  RoutePoint,
  RouteOptionLabel 
} from '../types';
import { SHELTERS } from '../config/shelters';
import { fetchOSRMRoute, type OSRMRouteResult } from './osrmClient';
import { calculateETAMultiplier, generateConstraintExplanations } from './householdModifiers';
import { 
  calculateFireExposure, 
  calculateFirePenalty, 
  isRouteBlocked, 
  generateFireWarning 
} from './fireExposure';

/**
 * Cache for OSRM route results
 * Key: "lat,lng:shelterId" (home location + shelter)
 * Routes don't change with scenario, so we can reuse geometry
 */
const routeCache = new Map<string, OSRMRouteResult>();

/**
 * Clear the route cache
 * Call when home location changes significantly
 */
export function clearRouteCache(): void {
  routeCache.clear();
  console.log('Route cache cleared');
}

/**
 * Get current cache size (for debugging)
 */
export function getRouteCacheSize(): number {
  return routeCache.size;
}

/**
 * Generate a unique route ID
 */
function generateRouteId(): string {
  return `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371; // Earth's radius in km
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate synthetic route geometry (fallback when OSRM unavailable)
 * Creates a curved path between start and end points
 */
function generateSyntheticGeometry(start: LatLng, end: LatLng, variation: number = 0): RoutePoint[] {
  const points: RoutePoint[] = [];
  const numPoints = 12;
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    
    const lat = start.lat + (end.lat - start.lat) * t;
    const lng = start.lng + (end.lng - start.lng) * t;
    
    const curveOffset = Math.sin(t * Math.PI) * variation * 0.015;
    const perpAngle = Math.atan2(end.lng - start.lng, end.lat - start.lat) + Math.PI / 2;
    
    points.push({
      lat: lat + curveOffset * Math.cos(perpAngle),
      lng: lng + curveOffset * Math.sin(perpAngle),
    });
  }
  
  return points;
}

/**
 * Generate cache key for route lookup
 */
function getCacheKey(home: LatLng, shelterId: string): string {
  const lat = home.lat.toFixed(4);
  const lng = home.lng.toFixed(4);
  return `${lat},${lng}:${shelterId}`;
}

/**
 * Fetch route geometry from OSRM or cache
 */
async function getRouteGeometry(
  home: LatLng,
  shelter: typeof SHELTERS[0],
  variationIndex: number
): Promise<{
  geometry: RoutePoint[];
  durationSeconds: number;
  distanceMeters: number;
  source: 'osrm' | 'synthetic';
  roadNames: string[];
}> {
  const cacheKey = getCacheKey(home, shelter.id);
  
  // Check cache first
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return {
      geometry: cached.geometry,
      durationSeconds: cached.durationSeconds,
      distanceMeters: cached.distanceMeters,
      source: 'osrm',
      roadNames: cached.roadNames,
    };
  }
  
  // Try OSRM
  const osrmResult = await fetchOSRMRoute(home, shelter.location);
  
  if (osrmResult) {
    // Cache the result
    routeCache.set(cacheKey, osrmResult);
    
    return {
      geometry: osrmResult.geometry,
      durationSeconds: osrmResult.durationSeconds,
      distanceMeters: osrmResult.distanceMeters,
      source: 'osrm',
      roadNames: osrmResult.roadNames,
    };
  }
  
  // Fallback to synthetic geometry
  console.warn(`OSRM route fetch failed for ${shelter.name}, using synthetic route geometry`);
  
  const straightLineDistance = calculateDistance(home, shelter.location);
  const estimatedDistance = straightLineDistance * 1.4;
  const estimatedDuration = (estimatedDistance / 40) * 3600;
  
  return {
    geometry: generateSyntheticGeometry(home, shelter.location, variationIndex),
    durationSeconds: estimatedDuration,
    distanceMeters: estimatedDistance * 1000,
    source: 'synthetic',
    roadNames: [],
  };
}

/**
 * Calculate a base risk score based on scenario and route direction
 */
function calculateBaseRiskScore(
  home: LatLng,
  shelter: LatLng,
  scenarioId: ScenarioId
): number {
  let risk = 0.2; // Lower base risk since fire exposure adds more
  
  switch (scenarioId) {
    case 'FIRE_FROM_HILLS':
      const goingNorth = shelter.lat > home.lat;
      const goingEast = shelter.lng > home.lng;
      if (goingNorth) risk += 0.1;
      if (goingEast) risk += 0.05;
      break;
      
    case 'NIGHT_EVAC':
      risk += 0.08;
      break;
      
    case 'TYPICAL_HIGH_RISK':
    default:
      break;
  }
  
  // Small random variation
  risk += (Math.random() - 0.5) * 0.06;
  
  return Math.max(0, Math.min(1, risk));
}

/**
 * Generate notes for a route based on its characteristics
 */
function generateRouteNotes(
  label: RouteOptionLabel,
  riskScore: number,
  scenarioId: ScenarioId,
  source: 'osrm' | 'synthetic',
  isBlocked: boolean,
  fireWarning?: string
): string[] {
  const notes: string[] = [];
  
  // Fire-related notes first (most important)
  if (isBlocked) {
    notes.push('⚠️ Route passes through active fire - NOT RECOMMENDED');
  } else if (fireWarning) {
    notes.push(fireWarning);
  }
  
  // Label-based notes
  switch (label) {
    case 'PRIMARY':
      if (!isBlocked) {
        notes.push('Recommended route based on current conditions');
      }
      break;
    case 'ALTERNATE':
      notes.push('Good alternative if primary route is congested');
      break;
    case 'LAST_RESORT':
      notes.push('Use only if other routes are blocked');
      break;
  }
  
  // Scenario-specific notes
  switch (scenarioId) {
    case 'FIRE_FROM_HILLS':
      if (riskScore < 0.4 && !isBlocked) {
        notes.push('Routes away from fire direction');
      }
      break;
    case 'NIGHT_EVAC':
      notes.push('Well-lit main roads preferred');
      break;
  }
  
  if (source === 'synthetic') {
    notes.push('Route geometry simplified for this demo');
  }
  
  return notes;
}

/**
 * Sort shelters by suitability for the given scenario and home location
 */
function rankShelters(
  homeLocation: LatLng,
  scenarioId: ScenarioId
): typeof SHELTERS {
  return [...SHELTERS].sort((a, b) => {
    const distA = calculateDistance(homeLocation, a.location);
    const distB = calculateDistance(homeLocation, b.location);
    
    if (scenarioId === 'FIRE_FROM_HILLS') {
      const northPenaltyA = Math.max(0, a.location.lat - homeLocation.lat) * 50;
      const northPenaltyB = Math.max(0, b.location.lat - homeLocation.lat) * 50;
      return (distA + northPenaltyA) - (distB + northPenaltyB);
    }
    
    return distA - distB;
  });
}

/**
 * Main route generation function
 * 
 * Fetches routes to all shelters, scores them with fire exposure, and returns top 3
 * Uses OSRM for real road geometries with synthetic fallback
 * Applies household constraint modifiers to ETAs
 */
export async function generateRoutes(
  homeLocation: LatLng,
  household: HouseholdProfile,
  scenarioId: ScenarioId
): Promise<RouteOption[]> {
  const rankedShelters = rankShelters(homeLocation, scenarioId);
  
  // Calculate household ETA multiplier once
  const etaMultiplier = calculateETAMultiplier(household);
  const constraintExplanations = generateConstraintExplanations(household);
  
  // Fetch routes to all shelters in parallel
  const routePromises = rankedShelters.map(async (shelter, index) => {
    const routeData = await getRouteGeometry(homeLocation, shelter, index);
    
    const baseMinutes = routeData.durationSeconds / 60;
    const distanceKm = routeData.distanceMeters / 1000;
    
    // Calculate base risk (without fire exposure)
    const baseRiskScore = calculateBaseRiskScore(homeLocation, shelter.location, scenarioId);
    
    // Calculate fire zone exposure
    const fireExposure = calculateFireExposure(routeData.geometry, scenarioId);
    const firePenalty = calculateFirePenalty(fireExposure);
    const blocked = isRouteBlocked(fireExposure);
    const fireWarning = generateFireWarning(fireExposure);
    
    // Combined risk score (clamped to 0-1)
    const totalRiskScore = Math.min(1, baseRiskScore + firePenalty);
    
    // Calculate base ETA range (before household modifiers)
    const baseEtaMin = Math.round(baseMinutes * 0.9);
    const baseEtaMax = Math.round(baseMinutes * 1.3);
    
    // Apply household multiplier to get adjusted range
    const adjustedEtaMin = Math.round(baseEtaMin * etaMultiplier);
    const adjustedEtaMax = Math.round(baseEtaMax * etaMultiplier);
    
    return {
      shelter,
      geometry: routeData.geometry,
      baseMinutes,
      distanceKm: Math.round(distanceKm * 10) / 10,
      baseRiskScore,
      riskScore: totalRiskScore,
      fireExposure,
      firePenalty,
      isBlocked: blocked,
      fireWarning,
      baseEtaRange: [Math.max(5, baseEtaMin), Math.max(10, baseEtaMax)] as [number, number],
      etaRange: [Math.max(5, adjustedEtaMin), Math.max(10, adjustedEtaMax)] as [number, number],
      source: routeData.source,
      roadNames: routeData.roadNames,
    };
  });
  
  const routeResults = await Promise.all(routePromises);
  
  // Separate blocked and non-blocked routes
  const nonBlockedRoutes = routeResults.filter(r => !r.isBlocked);
  const blockedRoutes = routeResults.filter(r => r.isBlocked);
  
  // Score and sort non-blocked routes
  const scoredRoutes = nonBlockedRoutes.map(r => ({
    ...r,
    combinedScore: 
      (r.distanceKm / 30) * 0.25 +      // Distance factor (25%)
      (r.etaRange[1] / 60) * 0.25 +     // Time factor (25%)
      r.riskScore * 0.50,               // Risk factor including fire (50%)
  }));
  
  scoredRoutes.sort((a, b) => a.combinedScore - b.combinedScore);
  
  // If we don't have 3 non-blocked routes, add blocked ones with warning
  const sortedBlockedRoutes = blockedRoutes.map(r => ({
    ...r,
    combinedScore: 999 + r.riskScore, // Ensure they sort last
  }));
  sortedBlockedRoutes.sort((a, b) => a.combinedScore - b.combinedScore);
  
  // Combine: non-blocked first, then blocked if needed
  const allSortedRoutes = [...scoredRoutes, ...sortedBlockedRoutes];
  
  const labels: RouteOptionLabel[] = ['PRIMARY', 'ALTERNATE', 'LAST_RESORT'];
  
  const routes: RouteOption[] = allSortedRoutes.slice(0, 3).map((r, index) => {
    const label = labels[index];
    
    // Build notes
    const notes = generateRouteNotes(
      label, 
      r.riskScore, 
      scenarioId, 
      r.source, 
      r.isBlocked,
      r.fireWarning
    );
    
    return {
      id: generateRouteId(),
      label,
      geometry: r.geometry,
      etaMinutesRange: r.etaRange,
      distanceKm: r.distanceKm,
      notes,
      riskScore: r.riskScore,
      endsAtShelterName: r.shelter.name,
      baseMinutes: r.baseMinutes,
      baseEtaRange: r.baseEtaRange,
      source: r.source,
      roadNames: r.roadNames,
      householdConstraints: constraintExplanations.length > 0 ? constraintExplanations : undefined,
      fireExposure: r.fireExposure,
      isBlocked: r.isBlocked,
      fireWarning: r.fireWarning,
    };
  });
  
  return routes;
}