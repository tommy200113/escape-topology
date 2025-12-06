/**
 * Fire Zone Visual Configuration
 * 
 * Centralized styling and behavior settings for fire zone rendering.
 * These values are used by the FireZoneOverlay component.
 */

import type { FireZoneLevel } from '../types';

/**
 * Visual styling for each fire zone level
 */
export const FIRE_ZONE_STYLES: Record<FireZoneLevel, {
  /** Fill color (hex) */
  fillColor: string;
  /** Fill opacity (0-1) */
  fillOpacity: number;
  /** Stroke/outline color (hex) */
  strokeColor: string;
  /** Stroke width in pixels */
  strokeWidth: number;
  /** Stroke opacity (0-1) */
  strokeOpacity: number;
  /** Display name for legend */
  displayName: string;
  /** Short description */
  description: string;
}> = {
  active: {
    fillColor: '#dc2626',      // Red-600
    fillOpacity: 0.5,
    strokeColor: '#991b1b',    // Red-800
    strokeWidth: 2,
    strokeOpacity: 0.9,
    displayName: 'Active Fire',
    description: 'Fire currently burning - DO NOT ENTER',
  },
  immediate: {
    fillColor: '#f97316',      // Orange-500
    fillOpacity: 0.4,
    strokeColor: '#c2410c',    // Orange-700
    strokeWidth: 2,
    strokeOpacity: 0.8,
    displayName: 'Immediate Threat',
    description: 'Fire expected within 1-2 hours',
  },
  warning: {
    fillColor: '#eab308',      // Yellow-500
    fillOpacity: 0.3,
    strokeColor: '#a16207',    // Yellow-700
    strokeWidth: 1.5,
    strokeOpacity: 0.7,
    displayName: 'Warning Zone',
    description: 'Elevated risk - prepare to evacuate',
  },
};

/**
 * Route scoring penalties for passing through fire zones
 * These are added to the base risk score
 */
export const FIRE_ZONE_ROUTE_PENALTIES: Record<FireZoneLevel, number> = {
  active: 1.0,      // Effectively blocks the route (adds 100% to risk)
  immediate: 0.4,   // Significant penalty
  warning: 0.15,    // Moderate penalty
};

/**
 * Thresholds for route warnings and blocking
 */
export const FIRE_ZONE_THRESHOLDS = {
  /** If route passes through active fire zone, it's blocked */
  blockOnActive: true,
  /** Minimum exposure (km) in immediate zone to trigger warning */
  immediateWarningThreshold: 0.5,
  /** Minimum exposure (km) in warning zone to trigger caution */
  warningCautionThreshold: 1.0,
};

/**
 * Z-index ordering for map layers (lower = rendered first/below)
 */
export const FIRE_ZONE_LAYER_ORDER = {
  warning: 1,
  immediate: 2,
  active: 3,
};

/**
 * Animation settings for fire zones (optional pulsing effect)
 */
export const FIRE_ZONE_ANIMATION = {
  enabled: false,  // Set to true for animated zones
  pulseDuration: 2000,  // ms
  pulseOpacityRange: [0.3, 0.6] as [number, number],
};

/**
 * Get all zone levels in rendering order (bottom to top)
 */
export function getZoneLevelsInOrder(): FireZoneLevel[] {
  return ['warning', 'immediate', 'active'];
}

/**
 * Get display info for a zone level
 */
export function getZoneDisplayInfo(level: FireZoneLevel): {
  name: string;
  description: string;
  color: string;
} {
  const style = FIRE_ZONE_STYLES[level];
  return {
    name: style.displayName,
    description: style.description,
    color: style.fillColor,
  };
}