/**
 * riskField.ts
 * 
 * Procedural risk field generation for wildfire visualization.
 * 
 * Creates a deterministic risk grid based on:
 * - Seeded pseudo-random noise for organic patterns
 * - NE-SW oriented ridge "spines" for high-risk zones
 * - Scenario-based modulation (fire direction bias)
 * 
 * The risk field is intentionally abstract - it represents
 * relative wildfire risk for demonstration, not real fire data.
 */

import type { ScenarioId, LatLng } from '../types';
import { REGION } from '../config/mapConfig';
import { RISK_OVERLAY_CONFIG } from '../config/riskConfig';

// -----------------------------------------
// Seeded Random Number Generator
// -----------------------------------------

/**
 * Simple seeded PRNG (Mulberry32)
 * Returns a function that produces deterministic random numbers 0-1
 */
function createSeededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Hash a string to a number (for seed generation)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// -----------------------------------------
// Noise Functions
// -----------------------------------------

/**
 * 2D value noise with interpolation
 * Creates smooth, organic-looking patterns
 */
function createValueNoise(seed: number, scale: number = 1): (x: number, y: number) => number {
  const random = createSeededRandom(seed);
  const permutation: number[] = [];
  const gradients: number[] = [];
  
  // Generate permutation table and random values
  for (let i = 0; i < 256; i++) {
    permutation[i] = i;
    gradients[i] = random();
  }
  
  // Shuffle permutation
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }
  
  // Extend permutation table
  for (let i = 0; i < 256; i++) {
    permutation[256 + i] = permutation[i];
  }
  
  // Smoothstep interpolation
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  
  return (x: number, y: number): number => {
    x = x * scale;
    y = y * scale;
    
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    
    const u = fade(xf);
    const v = fade(yf);
    
    const aa = gradients[permutation[permutation[xi] + yi]];
    const ab = gradients[permutation[permutation[xi] + yi + 1]];
    const ba = gradients[permutation[permutation[xi + 1] + yi]];
    const bb = gradients[permutation[permutation[xi + 1] + yi + 1]];
    
    return lerp(
      lerp(aa, ba, u),
      lerp(ab, bb, u),
      v
    );
  };
}

/**
 * Multi-octave noise (fractal Brownian motion)
 * Combines multiple noise layers for more natural patterns
 */
function createFBMNoise(
  seed: number,
  octaves: number = 4,
  persistence: number = 0.5,
  lacunarity: number = 2.0
): (x: number, y: number) => number {
  const noises = Array.from({ length: octaves }, (_, i) => 
    createValueNoise(seed + i * 1000, Math.pow(lacunarity, i))
  );
  
  return (x: number, y: number): number => {
    let total = 0;
    let amplitude = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      total += noises[i](x, y) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
    }
    
    return total / maxValue;
  };
}

// -----------------------------------------
// Ridge/Spine Generation
// -----------------------------------------

/**
 * Calculate distance from a point to a line segment
 */
function distanceToLineSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  
  if (lengthSq === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }
  
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  
  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;
  
  return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);
}

/**
 * Generate ridge spines oriented NE-SW
 * Returns a function that calculates "ridge influence" at any point
 */
function createRidgeField(seed: number, numSpines: number = 3): (x: number, y: number) => number {
  const random = createSeededRandom(seed);
  
  // Generate spines with NE-SW orientation
  // Angle is roughly 30-60 degrees from horizontal (NE-SW direction)
  const spines: Array<{
    x1: number; y1: number;
    x2: number; y2: number;
    width: number;
    intensity: number;
  }> = [];
  
  for (let i = 0; i < numSpines; i++) {
    // Start point somewhere in the region
    const startX = 0.1 + random() * 0.3; // SW side
    const startY = 0.1 + random() * 0.8;
    
    // End point NE of start (NE-SW orientation)
    const angle = (30 + random() * 30) * Math.PI / 180; // 30-60 degrees
    const length = 0.5 + random() * 0.5;
    
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;
    
    spines.push({
      x1: startX,
      y1: startY,
      x2: Math.min(1, endX),
      y2: Math.min(1, endY),
      width: 0.08 + random() * 0.12, // Ridge width (normalized)
      intensity: 0.6 + random() * 0.4, // How "hot" this ridge is
    });
  }
  
  return (x: number, y: number): number => {
    let maxInfluence = 0;
    
    for (const spine of spines) {
      const dist = distanceToLineSegment(x, y, spine.x1, spine.y1, spine.x2, spine.y2);
      
      // Gaussian falloff from ridge center
      const normalizedDist = dist / spine.width;
      const influence = spine.intensity * Math.exp(-normalizedDist * normalizedDist * 2);
      
      maxInfluence = Math.max(maxInfluence, influence);
    }
    
    return maxInfluence;
  };
}

// -----------------------------------------
// Scenario Modulation
// -----------------------------------------

/**
 * Apply scenario-specific bias to the risk field
 */
function applyScenarioBias(
  baseRisk: number,
  normalizedX: number,
  normalizedY: number,
  scenario: ScenarioId
): number {
  switch (scenario) {
    case 'FIRE_FROM_HILLS':
      // Fire approaching from the north/hills
      // Risk increases toward the north (higher Y in our coordinate system)
      // Gradient from 1.0 (south) to 1.25 (north)
      const northBias = 1.0 + (normalizedY * 0.25);
      return Math.min(1, baseRisk * northBias);
    
    case 'NIGHT_EVAC':
      // Night evacuation - same base risk, differences handled in routing
      return baseRisk;
    
    case 'TYPICAL_HIGH_RISK':
    default:
      // Standard high-risk day - no additional bias
      return baseRisk;
  }
}

// -----------------------------------------
// Main Risk Field Generator
// -----------------------------------------

export type RiskGrid = {
  width: number;
  height: number;
  data: Float32Array;
  bounds: {
    sw: LatLng;
    ne: LatLng;
  };
};

/**
 * Generate a complete risk grid for the region
 * 
 * @param scenario - The wildfire scenario to generate for
 * @param seed - Optional seed for deterministic generation (defaults to scenario-based)
 * @returns RiskGrid with normalized risk values 0-1
 */
export function generateRiskGrid(
  scenario: ScenarioId,
  seed?: number
): RiskGrid {
  const config = RISK_OVERLAY_CONFIG;
  const width = config.gridResolution;
  const height = config.gridResolution;
  
  // Use scenario-based seed if not provided
  const baseSeed = seed ?? hashString(scenario + '_escape_topology_v1');
  
  // Create noise functions
  const fbmNoise = createFBMNoise(baseSeed, 4, 0.5, 2.0);
  const ridgeField = createRidgeField(baseSeed + 12345, config.numSpines);
  
  // Create detail noise for variation
  const detailNoise = createValueNoise(baseSeed + 99999, 8);
  
  // Allocate grid
  const data = new Float32Array(width * height);
  
  // Generate risk values
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Normalized coordinates 0-1
      const nx = x / (width - 1);
      const ny = y / (height - 1);
      
      // Base noise layer (organic variation)
      const baseNoise = fbmNoise(nx * 4, ny * 4);
      
      // Ridge influence (high-risk spines)
      const ridgeInfluence = ridgeField(nx, ny);
      
      // Detail variation
      const detail = detailNoise(nx, ny) * 0.15;
      
      // Combine: ridges are primary driver, noise adds variation
      // Ridge areas get high risk, other areas get lower noise-based risk
      let risk = ridgeInfluence * 0.7 + baseNoise * 0.25 + detail;
      
      // Add some baseline risk (nowhere is completely safe in fire season)
      risk = 0.1 + risk * 0.85;
      
      // Apply scenario-specific modulation
      risk = applyScenarioBias(risk, nx, ny, scenario);
      
      // Clamp to valid range
      risk = Math.max(0, Math.min(1, risk));
      
      data[y * width + x] = risk;
    }
  }
  
  return {
    width,
    height,
    data,
    bounds: {
      sw: REGION.bounds.sw,
      ne: REGION.bounds.ne,
    },
  };
}

/**
 * Get risk value at a specific lat/lng location
 * Uses bilinear interpolation for smooth values
 */
export function getRiskAt(
  grid: RiskGrid,
  location: LatLng
): number {
  const { sw, ne } = grid.bounds;
  
  // Normalize location to 0-1 within bounds
  const nx = (location.lng - sw.lng) / (ne.lng - sw.lng);
  const ny = (location.lat - sw.lat) / (ne.lat - sw.lat);
  
  // Check if outside bounds
  if (nx < 0 || nx > 1 || ny < 0 || ny > 1) {
    return 0;
  }
  
  // Convert to grid coordinates
  const gx = nx * (grid.width - 1);
  const gy = ny * (grid.height - 1);
  
  // Bilinear interpolation
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(x0 + 1, grid.width - 1);
  const y1 = Math.min(y0 + 1, grid.height - 1);
  
  const fx = gx - x0;
  const fy = gy - y0;
  
  const v00 = grid.data[y0 * grid.width + x0];
  const v10 = grid.data[y0 * grid.width + x1];
  const v01 = grid.data[y1 * grid.width + x0];
  const v11 = grid.data[y1 * grid.width + x1];
  
  const v0 = v00 * (1 - fx) + v10 * fx;
  const v1 = v01 * (1 - fx) + v11 * fx;
  
  return v0 * (1 - fy) + v1 * fy;
}

/**
 * Get risk level category for a given risk value
 */
export function getRiskLevel(risk: number): 'low' | 'moderate' | 'high' | 'severe' {
  if (risk < 0.3) return 'low';
  if (risk < 0.5) return 'moderate';
  if (risk < 0.7) return 'high';
  return 'severe';
}