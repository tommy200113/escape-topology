/**
 * shelters.ts
 * 
 * Fictional evacuation shelter locations for the demo region.
 * These are strategically placed at lower-risk areas around
 * the perimeter of the region.
 */

import type { Shelter } from '../types';

/**
 * Evacuation shelters in the demo region
 * 
 * Positioned at realistic locations:
 * - Community centers and schools at valley/lowland positions
 * - Generally south and west of the higher-risk foothill areas
 * - Named with generic California-style names
 */
export const SHELTERS: Shelter[] = [
  {
    id: 'shelter-valley-community',
    name: 'Valley View Community Center',
    location: {
      lat: 38.62,
      lng: -120.95,
    },
    type: 'community_center',
  },
  {
    id: 'shelter-pine-ridge-school',
    name: 'Pine Ridge Elementary',
    location: {
      lat: 38.68,
      lng: -120.88,
    },
    type: 'school',
  },
  {
    id: 'shelter-oak-hollow-civic',
    name: 'Oak Hollow Civic Hall',
    location: {
      lat: 38.58,
      lng: -120.78,
    },
    type: 'civic_hall',
  },
  {
    id: 'shelter-riverside-rec',
    name: 'Riverside Recreation Center',
    location: {
      lat: 38.75,
      lng: -121.00,
    },
    type: 'recreation_center',
  },
  {
    id: 'shelter-golden-hills-school',
    name: 'Golden Hills High School',
    location: {
      lat: 38.85,
      lng: -120.72,
    },
    type: 'school',
  },
];

/**
 * Get a shelter by ID
 */
export function getShelterById(id: string): Shelter | undefined {
  return SHELTERS.find(shelter => shelter.id === id);
}

/**
 * Get a shelter by name (case-insensitive partial match)
 */
export function getShelterByName(name: string): Shelter | undefined {
  const lowerName = name.toLowerCase();
  return SHELTERS.find(shelter => 
    shelter.name.toLowerCase().includes(lowerName)
  );
}