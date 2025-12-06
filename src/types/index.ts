/**
 * Core type definitions for Escape Topology
 * 
 * These types define the domain model for the evacuation planning tool.
 */

// ============================================
// Geographic Types
// ============================================

/** Geographic coordinates */
export type LatLng = {
  lat: number;
  lng: number;
};

/** Route point with optional elevation */
export type RoutePoint = {
  lat: number;
  lng: number;
  elevation?: number;
};

// ============================================
// Household Profile Types
// ============================================

export type MobilityLevel = 'none' | 'limited' | 'wheelchair';
export type VehicleAccess = 'has_car' | 'needs_transport';

export type HouseholdProfile = {
  adults: number;
  children: number;
  mobility: MobilityLevel;
  vehicle: VehicleAccess;
  pets: boolean;
  notes?: string;
};

// ============================================
// Scenario Types
// ============================================

export type ScenarioId = 
  | 'TYPICAL_HIGH_RISK' 
  | 'FIRE_FROM_HILLS' 
  | 'NIGHT_EVAC';

export type CardinalDirection = 'N' | 'S' | 'E' | 'W';

export type Scenario = {
  id: ScenarioId;
  name: string;
  description: string;
  visualHint?: {
    direction?: CardinalDirection;
    isNight?: boolean;
  };
};

// ============================================
// Fire Zone Types (Milestone 13)
// ============================================

/** Fire zone threat level - determines visual styling and route scoring */
export type FireZoneLevel = 'active' | 'immediate' | 'warning';

/** A single fire zone polygon */
export type FireZone = {
  id: string;
  level: FireZoneLevel;
  name: string;
  /** GeoJSON polygon coordinates [lng, lat][] - outer ring only for simplicity */
  coordinates: [number, number][];
};

/** Fire zones for a specific scenario */
export type ScenarioFireZones = {
  scenarioId: ScenarioId;
  zones: FireZone[];
  /** Wind direction for this scenario (for display) */
  windDirection?: CardinalDirection;
  /** Wind speed description */
  windDescription?: string;
};

/** GeoJSON Feature for a fire zone (for MapLibre rendering) */
export type FireZoneFeature = GeoJSON.Feature<GeoJSON.Polygon, {
  id: string;
  level: FireZoneLevel;
  name: string;
}>;

/** GeoJSON FeatureCollection of fire zones */
export type FireZoneFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon, {
  id: string;
  level: FireZoneLevel;
  name: string;
}>;

// ============================================
// Route Types
// ============================================

export type RouteOptionLabel = 'PRIMARY' | 'ALTERNATE' | 'LAST_RESORT';

/** Source of route geometry */
export type RouteSource = 'osrm' | 'synthetic';

/** Route exposure to fire zones (Milestone 15) */
export type RouteFireExposure = {
  /** Does route pass through any fire zone? */
  isExposed: boolean;
  /** Highest threat level encountered */
  maxLevel?: FireZoneLevel;
  /** Distance in km through each zone level */
  exposureByLevel: {
    active: number;
    immediate: number;
    warning: number;
  };
  /** Total exposed distance in km */
  totalExposedKm: number;
  /** Percentage of route that is exposed */
  exposurePercent: number;
};

export type RouteOption = {
  id: string;
  label: RouteOptionLabel;
  geometry: RoutePoint[];
  etaMinutesRange: [number, number];
  distanceKm: number;
  notes: string[];
  riskScore: number; // 0–1 scale, lower is safer
  endsAtShelterName: string;
  
  // Added in Milestone 11 for OSRM integration
  /** Base travel time in minutes (before household modifiers) */
  baseMinutes?: number;
  /** Source of the route geometry */
  source?: RouteSource;
  /** Road names along the route (from OSRM) */
  roadNames?: string[];
  
  // Added in Milestone 12 for household constraints
  /** Base ETA range before household modifiers were applied */
  baseEtaRange?: [number, number];
  /** Explanations for household-based time adjustments */
  householdConstraints?: string[];
  
  // Added in Milestone 15 for fire zone exposure
  /** Fire zone exposure analysis */
  fireExposure?: RouteFireExposure;
  /** Is this route blocked by active fire? */
  isBlocked?: boolean;
  /** Warning message if route has significant exposure */
  fireWarning?: string;
};

// ============================================
// Shelter Types
// ============================================

export type ShelterType = 'community_center' | 'school' | 'civic_hall' | 'recreation_center';

export type Shelter = {
  id: string;
  name: string;
  location: LatLng;
  type: ShelterType;
};

// ============================================
// Application State Types
// ============================================

export type AppStep = 1 | 2 | 3 | 4;

// ============================================
// Route Cache Types (for store)
// ============================================

/** Cached OSRM route data */
export type CachedRouteData = {
  geometry: RoutePoint[];
  durationSeconds: number;
  distanceMeters: number;
  roadNames: string[];
  fetchedAt: number; // timestamp
};

/** Route cache keyed by "lat,lng:shelterId" */
export type RouteCache = Map<string, CachedRouteData>;