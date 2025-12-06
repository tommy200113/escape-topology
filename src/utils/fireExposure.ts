/**
 * Fire Exposure Calculator for Escape Topology
 * 
 * Calculates how much a route passes through fire hazard zones.
 * Uses point-in-polygon testing along the route geometry.
 * 
 * Results are used for:
 * - Route risk score adjustment
 * - Blocking routes through active fire
 * - User warnings about fire exposure
 */

import type { 
    RoutePoint, 
    ScenarioId, 
    FireZoneLevel, 
    RouteFireExposure,
    FireZone 
  } from '../types';
  import { getFireZonePolygons } from '../config/fireZones';
  import { FIRE_ZONE_ROUTE_PENALTIES, FIRE_ZONE_THRESHOLDS } from '../config/fireZoneConfig';
  
  /**
   * Calculate distance between two points in kilometers (Haversine)
   */
  function haversineDistance(p1: RoutePoint, p2: RoutePoint): number {
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
  
  /**
   * Find which zone (if any) contains a point
   * Returns the highest severity zone if point is in multiple zones
   */
  function getZoneAtPoint(
    point: RoutePoint,
    zones: FireZone[]
  ): FireZoneLevel | null {
    // Check in order of severity (active first)
    const severityOrder: FireZoneLevel[] = ['active', 'immediate', 'warning'];
    
    for (const level of severityOrder) {
      for (const zone of zones) {
        if (zone.level === level && isPointInPolygon(point, zone.coordinates)) {
          return level;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Interpolate points along a route segment for more accurate exposure calculation
   * Returns additional points between start and end
   */
  function interpolateSegment(
    start: RoutePoint,
    end: RoutePoint,
    maxDistanceKm: number = 0.2 // Sample every 200m
  ): RoutePoint[] {
    const distance = haversineDistance(start, end);
    
    if (distance <= maxDistanceKm) {
      return []; // No interpolation needed
    }
    
    const numPoints = Math.ceil(distance / maxDistanceKm);
    const points: RoutePoint[] = [];
    
    for (let i = 1; i < numPoints; i++) {
      const t = i / numPoints;
      points.push({
        lat: start.lat + (end.lat - start.lat) * t,
        lng: start.lng + (end.lng - start.lng) * t,
      });
    }
    
    return points;
  }
  
  /**
   * Calculate fire zone exposure for a route
   */
  export function calculateFireExposure(
    geometry: RoutePoint[],
    scenarioId: ScenarioId
  ): RouteFireExposure {
    const zones = getFireZonePolygons(scenarioId);
    
    // Initialize exposure tracking
    const exposureByLevel = {
      active: 0,
      immediate: 0,
      warning: 0,
    };
    
    let totalRouteDistance = 0;
    let maxLevel: FireZoneLevel | undefined;
    
    // Process each segment of the route
    for (let i = 0; i < geometry.length - 1; i++) {
      const start = geometry[i];
      const end = geometry[i + 1];
      const segmentDistance = haversineDistance(start, end);
      
      totalRouteDistance += segmentDistance;
      
      // Get interpolated points for more accurate sampling
      const interpolatedPoints = interpolateSegment(start, end);
      const allPoints = [start, ...interpolatedPoints, end];
      
      // Calculate what portion of segment is in each zone
      const pointsInZone: Record<FireZoneLevel, number> = {
        active: 0,
        immediate: 0,
        warning: 0,
      };
      
      for (const point of allPoints) {
        const zoneLevel = getZoneAtPoint(point, zones);
        if (zoneLevel) {
          pointsInZone[zoneLevel]++;
        }
      }
      
      // Distribute segment distance based on point sampling
      const totalSamples = allPoints.length;
      for (const level of ['active', 'immediate', 'warning'] as FireZoneLevel[]) {
        if (pointsInZone[level] > 0) {
          const portionInZone = pointsInZone[level] / totalSamples;
          exposureByLevel[level] += segmentDistance * portionInZone;
          
          // Track max severity level
          if (!maxLevel || getSeverityRank(level) < getSeverityRank(maxLevel)) {
            maxLevel = level;
          }
        }
      }
    }
    
    // Calculate totals
    const totalExposedKm = exposureByLevel.active + exposureByLevel.immediate + exposureByLevel.warning;
    const exposurePercent = totalRouteDistance > 0 
      ? Math.round((totalExposedKm / totalRouteDistance) * 100) 
      : 0;
    
    return {
      isExposed: totalExposedKm > 0,
      maxLevel,
      exposureByLevel: {
        active: Math.round(exposureByLevel.active * 100) / 100,
        immediate: Math.round(exposureByLevel.immediate * 100) / 100,
        warning: Math.round(exposureByLevel.warning * 100) / 100,
      },
      totalExposedKm: Math.round(totalExposedKm * 100) / 100,
      exposurePercent,
    };
  }
  
  /**
   * Get severity rank (lower = more severe)
   */
  function getSeverityRank(level: FireZoneLevel): number {
    const ranks: Record<FireZoneLevel, number> = {
      active: 0,
      immediate: 1,
      warning: 2,
    };
    return ranks[level];
  }
  
  /**
   * Calculate risk score penalty based on fire exposure
   */
  export function calculateFirePenalty(exposure: RouteFireExposure): number {
    let penalty = 0;
    
    // Add penalties for each zone type based on distance
    // Scale by exposure amount (more distance = more penalty)
    if (exposure.exposureByLevel.active > 0) {
      penalty += FIRE_ZONE_ROUTE_PENALTIES.active;
    }
    
    if (exposure.exposureByLevel.immediate > 0) {
      // Scale immediate penalty by distance (up to full penalty at 2km)
      const scaledPenalty = Math.min(
        FIRE_ZONE_ROUTE_PENALTIES.immediate,
        FIRE_ZONE_ROUTE_PENALTIES.immediate * (exposure.exposureByLevel.immediate / 2)
      );
      penalty += scaledPenalty;
    }
    
    if (exposure.exposureByLevel.warning > 0) {
      // Scale warning penalty by distance (up to full penalty at 5km)
      const scaledPenalty = Math.min(
        FIRE_ZONE_ROUTE_PENALTIES.warning,
        FIRE_ZONE_ROUTE_PENALTIES.warning * (exposure.exposureByLevel.warning / 5)
      );
      penalty += scaledPenalty;
    }
    
    return penalty;
  }
  
  /**
   * Determine if a route should be blocked
   */
  export function isRouteBlocked(exposure: RouteFireExposure): boolean {
    if (!FIRE_ZONE_THRESHOLDS.blockOnActive) {
      return false;
    }
    return exposure.exposureByLevel.active > 0;
  }
  
  /**
   * Generate warning message for route fire exposure
   */
  export function generateFireWarning(exposure: RouteFireExposure): string | undefined {
    if (!exposure.isExposed) {
      return undefined;
    }
    
    // Check for active fire (route blocked)
    if (exposure.exposureByLevel.active > 0) {
      return 'BLOCKED: Route passes through active fire zone';
    }
    
    // Check for immediate threat
    if (exposure.exposureByLevel.immediate >= FIRE_ZONE_THRESHOLDS.immediateWarningThreshold) {
      const distance = exposure.exposureByLevel.immediate.toFixed(1);
      return `WARNING: ${distance} km through immediate threat zone`;
    }
    
    // Check for warning zone
    if (exposure.exposureByLevel.warning >= FIRE_ZONE_THRESHOLDS.warningCautionThreshold) {
      const distance = exposure.exposureByLevel.warning.toFixed(1);
      return `Caution: ${distance} km through warning zone`;
    }
    
    return undefined;
  }
  
  /**
   * Get exposure summary for display
   */
  export function getExposureSummary(exposure: RouteFireExposure): {
    level: 'safe' | 'caution' | 'warning' | 'blocked';
    label: string;
    color: string;
  } {
    if (exposure.exposureByLevel.active > 0) {
      return {
        level: 'blocked',
        label: 'Blocked',
        color: '#dc2626', // Red
      };
    }
    
    if (exposure.exposureByLevel.immediate >= FIRE_ZONE_THRESHOLDS.immediateWarningThreshold) {
      return {
        level: 'warning',
        label: 'High Exposure',
        color: '#f97316', // Orange
      };
    }
    
    if (exposure.exposureByLevel.warning >= FIRE_ZONE_THRESHOLDS.warningCautionThreshold) {
      return {
        level: 'caution',
        label: 'Some Exposure',
        color: '#eab308', // Yellow
      };
    }
    
    if (exposure.isExposed) {
      return {
        level: 'caution',
        label: 'Minimal Exposure',
        color: '#84cc16', // Lime
      };
    }
    
    return {
      level: 'safe',
      label: 'Clear Route',
      color: '#22c55e', // Green
    };
  }