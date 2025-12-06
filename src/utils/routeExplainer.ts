/**
 * Route Explainer for Escape Topology
 * 
 * Generates human-readable explanations for why a route is recommended
 * and what cautions users should be aware of.
 * 
 * Explanations are based on:
 * - Route properties (distance, ETA, risk score, label)
 * - Selected scenario (fire direction, time of day)
 * - Household profile (mobility, pets, vehicle access)
 */

import type { RouteOption, ScenarioId, HouseholdProfile } from '../types';

export interface RouteExplanation {
  positives: string[];
  cautions: string[];
}

/**
 * Generate explanations for a route
 */
export function explainRoute(
  route: RouteOption,
  scenarioId: ScenarioId,
  household: HouseholdProfile
): RouteExplanation {
  const positives: string[] = [];
  const cautions: string[] = [];

  // === POSITIVES ===

  // Route label-based positives
  switch (route.label) {
    case 'PRIMARY':
      positives.push('This is the recommended route based on current conditions and your household profile.');
      break;
    case 'ALTERNATE':
      positives.push('A solid backup option if the primary route becomes congested or blocked.');
      break;
    case 'LAST_RESORT':
      positives.push('Available as an emergency option if other routes are unavailable.');
      break;
  }

  // Distance-based positives
  if (route.distanceKm < 10) {
    positives.push(`Short distance (${route.distanceKm} km) means less time on the road.`);
  } else if (route.distanceKm < 20) {
    positives.push(`Moderate distance (${route.distanceKm} km) with good road conditions expected.`);
  }

  // Risk-based positives
  if (route.riskScore < 0.3) {
    positives.push('This route passes through lower-risk areas with good clearance from vegetation.');
  } else if (route.riskScore < 0.5) {
    positives.push('Route maintains reasonable distance from highest-risk zones.');
  }

  // ETA-based positives
  const [minETA, maxETA] = route.etaMinutesRange;
  if (maxETA <= 15) {
    positives.push(`Quick evacuation time (${minETA}–${maxETA} minutes) under normal traffic.`);
  } else if (maxETA <= 30) {
    positives.push(`Reasonable travel time (${minETA}–${maxETA} minutes) to reach safety.`);
  }

  // Scenario-specific positives
  switch (scenarioId) {
    case 'FIRE_FROM_HILLS':
      if (route.riskScore < 0.4) {
        positives.push('Route heads away from the fire direction, reducing exposure to advancing flames.');
      }
      break;
    case 'NIGHT_EVAC':
      if (route.label === 'PRIMARY') {
        positives.push('Uses well-lit main roads that are easier to navigate in darkness.');
      }
      break;
    case 'TYPICAL_HIGH_RISK':
      if (route.label === 'PRIMARY') {
        positives.push('Optimized for general high-risk conditions with balanced safety factors.');
      }
      break;
  }

  // Household-specific positives
  if (household.pets) {
    positives.push(`${route.endsAtShelterName} accepts pets, so your animals can stay with you.`);
  }

  if (household.mobility !== 'none' && route.label === 'PRIMARY') {
    positives.push('Destination has accessible facilities for those with mobility needs.');
  }

  if (household.children > 0 && route.label === 'PRIMARY') {
    positives.push('Shelter has family-friendly accommodations and support services.');
  }

  // === CAUTIONS ===

  // Risk-based cautions
  if (route.riskScore >= 0.7) {
    cautions.push('This route passes near high-risk areas. Use only if other options are blocked.');
  } else if (route.riskScore >= 0.5) {
    cautions.push('Some sections of this route are in elevated-risk zones. Stay alert and move quickly.');
  }

  // Distance-based cautions
  if (route.distanceKm >= 25) {
    cautions.push(`Longer route (${route.distanceKm} km) – ensure you have adequate fuel before departing.`);
  }

  // ETA-based cautions
  if (maxETA > 45) {
    cautions.push('Extended travel time expected. Prepare supplies for the journey (water, medications).');
  }

  // Label-based cautions
  if (route.label === 'LAST_RESORT') {
    cautions.push('This route has higher risk factors. Only use if primary and alternate routes are unavailable.');
  }

  // Scenario-specific cautions
  switch (scenarioId) {
    case 'FIRE_FROM_HILLS':
      if (route.riskScore >= 0.5) {
        cautions.push('Fire is spreading from the hills. Conditions may change rapidly – monitor emergency alerts.');
      }
      cautions.push('Expect heavier traffic as others evacuate. Leave early if possible.');
      break;
    case 'NIGHT_EVAC':
      cautions.push('Reduced visibility at night. Drive carefully and watch for pedestrians and debris.');
      if (route.label !== 'PRIMARY') {
        cautions.push('Back roads may be harder to navigate in darkness. Consider the primary route if possible.');
      }
      break;
    case 'TYPICAL_HIGH_RISK':
      cautions.push('Conditions can change quickly during high-risk periods. Stay tuned to emergency broadcasts.');
      break;
  }

  // Household-specific cautions
  if (household.mobility === 'wheelchair') {
    cautions.push('Allow extra time for loading mobility equipment. Consider having assistance available.');
  } else if (household.mobility === 'limited') {
    cautions.push('Plan for additional time needed for household members with mobility limitations.');
  }

  if (household.vehicle === 'needs_transport') {
    cautions.push('Coordinate with neighbors or emergency services for transportation assistance.');
  }

  if (household.pets) {
    cautions.push('Prepare pet carriers and supplies in advance. Keep pets secured during transport.');
  }

  if (household.children > 0 && household.children >= 2) {
    cautions.push('With multiple children, ensure everyone is accounted for before departing.');
  }

  if (household.adults === 1 && (household.children > 0 || household.pets)) {
    cautions.push('As a single adult with dependents, consider pre-arranging help from neighbors if needed.');
  }

  // Deduplicate and limit
  const uniquePositives = [...new Set(positives)].slice(0, 5);
  const uniqueCautions = [...new Set(cautions)].slice(0, 5);

  return {
    positives: uniquePositives,
    cautions: uniqueCautions,
  };
}

/**
 * Get a short summary for the route (one sentence)
 */
export function getRouteSummary(
  route: RouteOption,
  scenarioId: ScenarioId
): string {
  const distance = route.distanceKm;
  const [minETA, maxETA] = route.etaMinutesRange;
  
  let summary = `${distance} km to ${route.endsAtShelterName} (${minETA}–${maxETA} min)`;
  
  if (route.label === 'PRIMARY') {
    summary += ' – Recommended';
  } else if (route.label === 'LAST_RESORT') {
    summary += ' – Emergency backup';
  }
  
  return summary;
}