/**
 * Household Constraint Modifiers for Escape Topology
 * 
 * Calculates time adjustments and generates explanations based on
 * household profile characteristics that affect evacuation time.
 * 
 * Modifiers are multiplicative and stack:
 * - Mobility limitations add time for preparation/loading
 * - Children add time for gathering and securing
 * - Pets add time for carriers and loading
 * - No vehicle means waiting for assistance
 */

import type { HouseholdProfile } from '../types';

/**
 * Individual modifier values
 * These represent percentage increases to base travel time
 */
const MODIFIER_VALUES = {
  // Mobility
  mobilityLimited: 0.15,      // +15% for limited mobility
  mobilityWheelchair: 0.25,   // +25% for wheelchair users
  
  // Dependents
  childrenSmall: 0.10,        // +10% for 1-2 children
  childrenMany: 0.18,         // +18% for 3+ children
  
  // Pets
  pets: 0.08,                 // +8% for pets
  
  // Transportation
  needsTransport: 0.30,       // +30% if waiting for transport assistance
};

/**
 * Calculate the ETA multiplier based on household constraints
 * 
 * @param household - The household profile
 * @returns A multiplier >= 1.0 to apply to base ETA
 */
export function calculateETAMultiplier(household: HouseholdProfile): number {
  let multiplier = 1.0;
  
  // Mobility constraints
  if (household.mobility === 'wheelchair') {
    multiplier += MODIFIER_VALUES.mobilityWheelchair;
  } else if (household.mobility === 'limited') {
    multiplier += MODIFIER_VALUES.mobilityLimited;
  }
  
  // Children
  if (household.children >= 3) {
    multiplier += MODIFIER_VALUES.childrenMany;
  } else if (household.children >= 1) {
    multiplier += MODIFIER_VALUES.childrenSmall;
  }
  
  // Pets
  if (household.pets) {
    multiplier += MODIFIER_VALUES.pets;
  }
  
  // Transportation needs
  if (household.vehicle === 'needs_transport') {
    multiplier += MODIFIER_VALUES.needsTransport;
  }
  
  return multiplier;
}

/**
 * Generate human-readable explanations for time adjustments
 * 
 * @param household - The household profile
 * @returns Array of explanation strings (empty if no adjustments)
 */
export function generateConstraintExplanations(household: HouseholdProfile): string[] {
  const explanations: string[] = [];
  
  // Mobility explanations
  if (household.mobility === 'wheelchair') {
    explanations.push('Extra time for mobility equipment loading');
  } else if (household.mobility === 'limited') {
    explanations.push('Extra time for mobility assistance');
  }
  
  // Children explanations
  if (household.children >= 3) {
    explanations.push(`Extra time for ${household.children} children`);
  } else if (household.children >= 1) {
    explanations.push(
      household.children === 1 
        ? 'Extra time for 1 child' 
        : `Extra time for ${household.children} children`
    );
  }
  
  // Pets explanation
  if (household.pets) {
    explanations.push('Extra time for pet preparation');
  }
  
  // Transportation explanation
  if (household.vehicle === 'needs_transport') {
    explanations.push('Includes wait time for transportation assistance');
  }
  
  return explanations;
}

/**
 * Get a summary of household constraints for display
 * 
 * @param household - The household profile
 * @returns Object with multiplier and explanations
 */
export function getHouseholdConstraintSummary(household: HouseholdProfile): {
  multiplier: number;
  percentageIncrease: number;
  explanations: string[];
  hasConstraints: boolean;
} {
  const multiplier = calculateETAMultiplier(household);
  const explanations = generateConstraintExplanations(household);
  
  return {
    multiplier,
    percentageIncrease: Math.round((multiplier - 1) * 100),
    explanations,
    hasConstraints: multiplier > 1.0,
  };
}

/**
 * Apply multiplier to an ETA range
 * 
 * @param etaRange - [min, max] in minutes
 * @param multiplier - The multiplier to apply
 * @returns Adjusted [min, max] range, rounded to whole minutes
 */
export function applyETAMultiplier(
  etaRange: [number, number],
  multiplier: number
): [number, number] {
  return [
    Math.round(etaRange[0] * multiplier),
    Math.round(etaRange[1] * multiplier),
  ];
}