/**
 * Fire Zone Definitions for Escape Topology
 * 
 * Static GeoJSON polygon definitions for fire hazard zones per scenario.
 * These zones represent fictional fire conditions for demonstration.
 * 
 * Coordinates are [longitude, latitude] pairs (GeoJSON standard).
 * Polygons are defined as outer rings only (no holes) for simplicity.
 * 
 * Region bounds for reference:
 * - SW: { lat: 38.55, lng: -121.05 }
 * - NE: { lat: 38.91, lng: -120.59 }
 * - Center: { lat: 38.73, lng: -120.82 }
 */

import type { 
    ScenarioId, 
    FireZone, 
    ScenarioFireZones, 
    FireZoneFeatureCollection 
  } from '../types';
  
  // ============================================
  // Scenario: TYPICAL_HIGH_RISK
  // General elevated risk, no specific fire location
  // Zones are spread across high-risk terrain areas
  // ============================================
  
  const TYPICAL_HIGH_RISK_ZONES: FireZone[] = [
    // Warning zone in the northeastern hills (general high-risk terrain)
    {
      id: 'typical-warning-ne',
      level: 'warning',
      name: 'Northeast Hills Warning',
      coordinates: [
        [-120.72, 38.85],
        [-120.62, 38.85],
        [-120.59, 38.78],
        [-120.65, 38.72],
        [-120.75, 38.75],
        [-120.72, 38.85],
      ],
    },
    // Warning zone in the eastern foothills
    {
      id: 'typical-warning-e',
      level: 'warning',
      name: 'Eastern Foothills Warning',
      coordinates: [
        [-120.68, 38.72],
        [-120.60, 38.68],
        [-120.59, 38.60],
        [-120.65, 38.58],
        [-120.72, 38.62],
        [-120.70, 38.68],
        [-120.68, 38.72],
      ],
    },
  ];
  
  // ============================================
  // Scenario: FIRE_FROM_HILLS
  // Active fire approaching from the north/northeast
  // More severe zones in that direction
  // ============================================
  
  const FIRE_FROM_HILLS_ZONES: FireZone[] = [
    // Active fire zone - northeastern corner
    {
      id: 'hills-active-ne',
      level: 'active',
      name: 'Ridge Fire - Active',
      coordinates: [
        [-120.68, 38.91],
        [-120.59, 38.91],
        [-120.59, 38.84],
        [-120.64, 38.82],
        [-120.70, 38.85],
        [-120.68, 38.91],
      ],
    },
    // Immediate threat zone - spreading south from active fire
    {
      id: 'hills-immediate-1',
      level: 'immediate',
      name: 'Ridge Fire - Immediate Threat',
      coordinates: [
        [-120.72, 38.86],
        [-120.64, 38.82],
        [-120.59, 38.84],
        [-120.59, 38.76],
        [-120.66, 38.72],
        [-120.74, 38.76],
        [-120.76, 38.82],
        [-120.72, 38.86],
      ],
    },
    // Second immediate threat zone - eastern flank
    {
      id: 'hills-immediate-2',
      level: 'immediate',
      name: 'Eastern Flank - Immediate Threat',
      coordinates: [
        [-120.66, 38.72],
        [-120.59, 38.76],
        [-120.59, 38.65],
        [-120.64, 38.62],
        [-120.70, 38.66],
        [-120.66, 38.72],
      ],
    },
    // Warning zone - broad area south and west of fire
    {
      id: 'hills-warning-sw',
      level: 'warning',
      name: 'Southwest Warning Zone',
      coordinates: [
        [-120.82, 38.82],
        [-120.74, 38.76],
        [-120.70, 38.66],
        [-120.64, 38.62],
        [-120.59, 38.65],
        [-120.59, 38.55],
        [-120.75, 38.55],
        [-120.85, 38.60],
        [-120.90, 38.70],
        [-120.88, 38.78],
        [-120.82, 38.82],
      ],
    },
    // Warning zone - northern exposure
    {
      id: 'hills-warning-n',
      level: 'warning',
      name: 'Northern Warning Zone',
      coordinates: [
        [-120.90, 38.88],
        [-120.76, 38.82],
        [-120.72, 38.86],
        [-120.68, 38.91],
        [-120.90, 38.91],
        [-120.90, 38.88],
      ],
    },
  ];
  
  // ============================================
  // Scenario: NIGHT_EVAC
  // Similar fire threat to TYPICAL but with emphasis
  // on visibility concerns (handled in routing, not zones)
  // Zones are moderate - the challenge is navigation, not fire proximity
  // ============================================
  
  const NIGHT_EVAC_ZONES: FireZone[] = [
    // Moderate warning zone in the hills
    {
      id: 'night-warning-hills',
      level: 'warning',
      name: 'Foothill Warning Zone',
      coordinates: [
        [-120.75, 38.88],
        [-120.65, 38.88],
        [-120.60, 38.80],
        [-120.59, 38.70],
        [-120.65, 38.65],
        [-120.75, 38.68],
        [-120.80, 38.75],
        [-120.78, 38.82],
        [-120.75, 38.88],
      ],
    },
    // Small immediate threat zone - reported fire start
    {
      id: 'night-immediate-start',
      level: 'immediate',
      name: 'Fire Origin - Immediate Threat',
      coordinates: [
        [-120.68, 38.85],
        [-120.62, 38.85],
        [-120.60, 38.80],
        [-120.64, 38.78],
        [-120.70, 38.80],
        [-120.68, 38.85],
      ],
    },
  ];
  
  // ============================================
  // Scenario Data Map
  // ============================================
  
  const SCENARIO_FIRE_ZONES: Record<ScenarioId, ScenarioFireZones> = {
    TYPICAL_HIGH_RISK: {
      scenarioId: 'TYPICAL_HIGH_RISK',
      zones: TYPICAL_HIGH_RISK_ZONES,
      windDirection: 'W',
      windDescription: 'Light westerly winds, 5-10 mph',
    },
    FIRE_FROM_HILLS: {
      scenarioId: 'FIRE_FROM_HILLS',
      zones: FIRE_FROM_HILLS_ZONES,
      windDirection: 'N',
      windDescription: 'Strong downslope winds from north, 20-30 mph',
    },
    NIGHT_EVAC: {
      scenarioId: 'NIGHT_EVAC',
      zones: NIGHT_EVAC_ZONES,
      windDirection: 'E',
      windDescription: 'Moderate easterly winds, 10-15 mph',
    },
  };
  
  // ============================================
  // Public API
  // ============================================
  
  /**
   * Get fire zones for a specific scenario
   */
  export function getFireZonesForScenario(scenarioId: ScenarioId): ScenarioFireZones {
    return SCENARIO_FIRE_ZONES[scenarioId];
  }
  
  /**
   * Get all fire zone polygons for a scenario as a flat array
   */
  export function getFireZonePolygons(scenarioId: ScenarioId): FireZone[] {
    return SCENARIO_FIRE_ZONES[scenarioId].zones;
  }
  
  /**
   * Convert fire zones to GeoJSON FeatureCollection for MapLibre
   */
  export function getFireZonesAsGeoJSON(scenarioId: ScenarioId): FireZoneFeatureCollection {
    const zones = getFireZonePolygons(scenarioId);
    
    return {
      type: 'FeatureCollection',
      features: zones.map(zone => ({
        type: 'Feature',
        properties: {
          id: zone.id,
          level: zone.level,
          name: zone.name,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [zone.coordinates], // GeoJSON needs array of rings
        },
      })),
    };
  }
  
  /**
   * Get wind information for a scenario
   */
  export function getWindInfo(scenarioId: ScenarioId): {
    direction: string;
    description: string;
  } | null {
    const data = SCENARIO_FIRE_ZONES[scenarioId];
    if (!data.windDirection) return null;
    
    const directionNames: Record<string, string> = {
      N: 'North',
      S: 'South',
      E: 'East',
      W: 'West',
    };
    
    return {
      direction: directionNames[data.windDirection] || data.windDirection,
      description: data.windDescription || '',
    };
  }
  
  /**
   * Check if a point is inside any fire zone for a scenario
   * Uses ray casting algorithm for point-in-polygon test
   */
  export function getZoneLevelAtPoint(
    scenarioId: ScenarioId,
    point: { lat: number; lng: number }
  ): { level: FireZoneLevel; zoneName: string } | null {
    const zones = getFireZonePolygons(scenarioId);
    
    // Check zones in order of severity (active first)
    const orderedZones = [...zones].sort((a, b) => {
      const order = { active: 0, immediate: 1, warning: 2 };
      return order[a.level] - order[b.level];
    });
    
    for (const zone of orderedZones) {
      if (isPointInPolygon(point, zone.coordinates)) {
        return { level: zone.level, zoneName: zone.name };
      }
    }
    
    return null;
  }
  
  /**
   * Ray casting algorithm for point-in-polygon test
   */
  function isPointInPolygon(
    point: { lat: number; lng: number },
    polygon: [number, number][]
  ): boolean {
    const x = point.lng;
    const y = point.lat;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }
  
  // Type export for FireZoneLevel (re-export for convenience)
  export type { FireZoneLevel } from '../types';