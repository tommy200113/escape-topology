/**
 * riskConfig.ts
 * 
 * Configuration for the procedural risk overlay.
 * Centralized settings for easy tuning.
 */

/**
 * Risk overlay rendering and generation settings
 */
export const RISK_OVERLAY_CONFIG = {
    // Grid resolution (cells across the region)
    // 128x128 provides good balance of detail and performance
    // Can be increased to 256 for smoother gradients
    gridResolution: 128,
    
    // Number of high-risk ridge "spines"
    numSpines: 3,
    
    // Opacity settings by risk level
    // Lower risk = more transparent, keeps map readable
    opacity: {
      low: 0.22,       // 0.0 - 0.3 risk
      moderate: 0.35,  // 0.3 - 0.5 risk
      high: 0.45,      // 0.5 - 0.7 risk
      severe: 0.50,    // 0.7 - 1.0 risk
    },
    
    // Risk thresholds for color stops
    thresholds: {
      low: 0.3,
      moderate: 0.5,
      high: 0.7,
      // Anything above high is severe
    },
    
    // Scenario bias multiplier for "Fire from Hills"
    // Applied as gradient from 1.0 (opposite edge) to this value (fire edge)
    scenarioBiasMultiplier: 1.25,
  };
  
  /**
   * Risk colors (matching design tokens from base.css)
   * These are the raw hex values for canvas rendering
   */
  export const RISK_COLORS = {
    low: '#4ade80',       // --color-risk-low (green)
    moderate: '#facc15',  // --color-risk-moderate (yellow)
    high: '#f97316',      // --color-risk-high (orange)
    severe: '#ef4444',    // --color-risk-severe (red)
  };
  
  /**
   * Convert hex color to RGB components
   */
  export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      return { r: 0, g: 0, b: 0 };
    }
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }
  
  /**
   * Get interpolated color and opacity for a risk value
   */
  export function getRiskColorAndOpacity(risk: number): {
    r: number;
    g: number;
    b: number;
    a: number;
  } {
    const config = RISK_OVERLAY_CONFIG;
    const colors = RISK_COLORS;
    
    // Determine color based on risk level
    let color: string;
    let opacity: number;
    
    if (risk < config.thresholds.low) {
      color = colors.low;
      opacity = config.opacity.low;
    } else if (risk < config.thresholds.moderate) {
      color = colors.moderate;
      opacity = config.opacity.moderate;
    } else if (risk < config.thresholds.high) {
      color = colors.high;
      opacity = config.opacity.high;
    } else {
      color = colors.severe;
      opacity = config.opacity.severe;
    }
    
    const rgb = hexToRgb(color);
    
    // Scale opacity slightly by actual risk value within the band
    // This creates smoother visual transitions
    const riskWithinBand = risk < config.thresholds.low
      ? risk / config.thresholds.low
      : risk < config.thresholds.moderate
      ? (risk - config.thresholds.low) / (config.thresholds.moderate - config.thresholds.low)
      : risk < config.thresholds.high
      ? (risk - config.thresholds.moderate) / (config.thresholds.high - config.thresholds.moderate)
      : (risk - config.thresholds.high) / (1 - config.thresholds.high);
    
    // Modulate opacity slightly within band (±10%)
    const opacityModulation = 0.9 + riskWithinBand * 0.2;
    
    return {
      ...rgb,
      a: Math.min(1, opacity * opacityModulation),
    };
  }
  
  /**
   * Get blended color between two risk levels for smooth gradients
   */
  export function getBlendedRiskColor(risk: number): {
    r: number;
    g: number;
    b: number;
    a: number;
  } {
    const config = RISK_OVERLAY_CONFIG;
    const colors = RISK_COLORS;
    
    // Define color stops
    const stops = [
      { risk: 0, color: hexToRgb(colors.low), opacity: config.opacity.low * 0.5 },
      { risk: config.thresholds.low, color: hexToRgb(colors.low), opacity: config.opacity.low },
      { risk: config.thresholds.moderate, color: hexToRgb(colors.moderate), opacity: config.opacity.moderate },
      { risk: config.thresholds.high, color: hexToRgb(colors.high), opacity: config.opacity.high },
      { risk: 1, color: hexToRgb(colors.severe), opacity: config.opacity.severe },
    ];
    
    // Find surrounding stops
    let lower = stops[0];
    let upper = stops[stops.length - 1];
    
    for (let i = 0; i < stops.length - 1; i++) {
      if (risk >= stops[i].risk && risk <= stops[i + 1].risk) {
        lower = stops[i];
        upper = stops[i + 1];
        break;
      }
    }
    
    // Interpolate
    const t = upper.risk === lower.risk 
      ? 0 
      : (risk - lower.risk) / (upper.risk - lower.risk);
    
    return {
      r: Math.round(lower.color.r + (upper.color.r - lower.color.r) * t),
      g: Math.round(lower.color.g + (upper.color.g - lower.color.g) * t),
      b: Math.round(lower.color.b + (upper.color.b - lower.color.b) * t),
      a: lower.opacity + (upper.opacity - lower.opacity) * t,
    };
  }