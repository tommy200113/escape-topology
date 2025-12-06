/**
 * Scenario Definitions for Escape Topology
 * 
 * These scenarios represent different wildfire conditions that affect
 * evacuation route recommendations. Each scenario has:
 * - A unique ID for state management
 * - Display name and description for the UI
 * - Visual hints for map rendering (direction, time of day)
 * - Routing hints for the route generation algorithm
 * 
 * For MVP, we have 3 scenarios:
 * 1. Typical High-Risk Day - baseline conditions
 * 2. Fire Approaching from Hills - directional threat from north/east
 * 3. Night-Time Evacuation - reduced visibility, prefer main roads
 */

import type { Scenario, ScenarioId } from '../types';

/**
 * Scenario definitions
 */
export const SCENARIOS: Record<ScenarioId, Scenario> = {
  TYPICAL_HIGH_RISK: {
    id: 'TYPICAL_HIGH_RISK',
    name: 'Typical High-Risk Day',
    description: 'Hot, dry conditions with moderate winds. Fire risk is elevated across the region, but no active fire nearby. Good visibility and all roads open.',
    visualHint: {
      // No specific direction - general elevated risk
    },
  },
  
  FIRE_FROM_HILLS: {
    id: 'FIRE_FROM_HILLS',
    name: 'Fire Approaching from Hills',
    description: 'Active fire spreading from the northeast hills, driven by downslope winds. Higher urgency to evacuate away from the fire direction. Some roads may become congested.',
    visualHint: {
      direction: 'N', // Fire coming from north/northeast
    },
  },
  
  NIGHT_EVAC: {
    id: 'NIGHT_EVAC',
    name: 'Night-Time Evacuation',
    description: 'Evacuation ordered after dark. Reduced visibility makes navigation harder. Main roads and well-lit routes are strongly preferred over back roads.',
    visualHint: {
      isNight: true,
    },
  },
};

/**
 * Get scenario by ID
 */
export function getScenario(id: ScenarioId): Scenario {
  return SCENARIOS[id];
}

/**
 * Get all scenarios as an array (for rendering lists)
 */
export function getAllScenarios(): Scenario[] {
  return Object.values(SCENARIOS);
}

/**
 * Scenario icon mappings (for UI display)
 * These are descriptive keys that the component will use to render appropriate icons
 */
export const SCENARIO_ICONS: Record<ScenarioId, string> = {
  TYPICAL_HIGH_RISK: 'sun',
  FIRE_FROM_HILLS: 'flame',
  NIGHT_EVAC: 'moon',
};

/**
 * Scenario color accents (for visual distinction)
 */
export const SCENARIO_COLORS: Record<ScenarioId, { bg: string; border: string; icon: string }> = {
  TYPICAL_HIGH_RISK: {
    bg: 'var(--color-risk-moderate)',
    border: 'var(--color-risk-moderate)',
    icon: 'var(--color-risk-high)',
  },
  FIRE_FROM_HILLS: {
    bg: 'var(--color-risk-severe)',
    border: 'var(--color-risk-severe)',
    icon: 'var(--color-risk-severe)',
  },
  NIGHT_EVAC: {
    bg: 'var(--color-primary-500)',
    border: 'var(--color-primary-500)',
    icon: 'var(--color-primary-600)',
  },
};