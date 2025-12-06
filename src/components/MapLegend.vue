<!--
  MapLegend.vue
  
  Legend overlay explaining map symbology.
  
  Shows:
  - Fire zone levels (when visible)
  - Risk gradient with labels
  - Route line styles (primary, alternate, last-resort)
  - Shelter marker
  - Wind direction (when fire zones visible)
  - Disclaimer text
-->

<template>
    <Transition name="legend-fade">
      <div v-if="visible" class="map-legend">
        <div class="legend-header">
          <span class="legend-title">Map Legend</span>
        </div>
        
        <div class="legend-content">
          <!-- Fire Zones (shown when applicable) -->
          <div v-if="showFireZones" class="legend-section">
            <span class="legend-section-title">Fire Hazard Zones</span>
            <div class="legend-items">
              <div v-for="zone in fireZoneLegendItems" :key="zone.level" class="legend-item">
                <div 
                  class="zone-sample" 
                  :style="{ 
                    backgroundColor: zone.color,
                    borderColor: zone.strokeColor 
                  }"
                />
                <div class="zone-info">
                  <span class="legend-item-label">{{ zone.name }}</span>
                  <span class="zone-description">{{ zone.description }}</span>
                </div>
              </div>
            </div>
            
            <!-- Wind indicator -->
            <div v-if="windInfo" class="wind-indicator">
              <div class="wind-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                </svg>
              </div>
              <div class="wind-info">
                <span class="wind-direction">Wind: {{ windInfo.direction }}</span>
                <span class="wind-description">{{ windInfo.description }}</span>
              </div>
            </div>
          </div>
          
          <!-- Risk Gradient -->
          <div class="legend-section">
            <span class="legend-section-title">Wildfire Risk</span>
            <div class="risk-gradient">
              <div class="risk-gradient-bar" />
              <div class="risk-gradient-labels">
                <span>Lower</span>
                <span>Moderate</span>
                <span>Higher</span>
              </div>
            </div>
          </div>
          
          <!-- Route Styles -->
          <div class="legend-section">
            <span class="legend-section-title">Evacuation Routes</span>
            <div class="legend-items">
              <div class="legend-item">
                <div class="route-sample route-sample--primary" />
                <span class="legend-item-label">Primary Route</span>
              </div>
              <div class="legend-item">
                <div class="route-sample route-sample--alternate" />
                <span class="legend-item-label">Alternate Route</span>
              </div>
              <div class="legend-item">
                <div class="route-sample route-sample--last-resort" />
                <span class="legend-item-label">Last Resort</span>
              </div>
            </div>
          </div>
          
          <!-- Shelter Marker -->
          <div class="legend-section">
            <span class="legend-section-title">Locations</span>
            <div class="legend-items">
              <div class="legend-item">
                <div class="shelter-sample">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="10" width="16" height="11" rx="1" fill="#475569" stroke="#334155" stroke-width="1"/>
                    <path d="M2 11L12 4L22 11" stroke="#334155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="#64748b"/>
                    <rect x="10" y="15" width="4" height="6" rx="0.5" fill="#cbd5e1"/>
                    <rect x="6" y="12" width="3" height="2.5" rx="0.5" fill="#cbd5e1"/>
                    <rect x="15" y="12" width="3" height="2.5" rx="0.5" fill="#cbd5e1"/>
                  </svg>
                </div>
                <span class="legend-item-label">Evacuation Shelter</span>
              </div>
              <div class="legend-item">
                <div class="home-sample">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                  </svg>
                </div>
                <span class="legend-item-label">Your Home</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Disclaimer -->
        <div class="legend-disclaimer">
          <svg class="disclaimer-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
          </svg>
          <span>
            Fire zones and risk visualization are for demonstration only. 
            Always follow official evacuation orders.
          </span>
        </div>
      </div>
    </Transition>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import type { ScenarioId, FireZoneLevel } from '../types';
  import { FIRE_ZONE_STYLES, getZoneLevelsInOrder } from '../config/fireZoneConfig';
  import { getWindInfo } from '../config/fireZones';
  
  const props = defineProps<{
    visible: boolean;
    showFireZones?: boolean;
    scenarioId?: ScenarioId | null;
  }>();
  
  // Fire zone legend items
  const fireZoneLegendItems = computed(() => {
    // Return in reverse order (active first, then immediate, then warning)
    return getZoneLevelsInOrder().reverse().map(level => {
      const style = FIRE_ZONE_STYLES[level];
      return {
        level,
        name: style.displayName,
        description: style.description,
        color: style.fillColor,
        strokeColor: style.strokeColor,
      };
    });
  });
  
  // Wind information for current scenario
  const windInfo = computed(() => {
    if (!props.scenarioId) return null;
    return getWindInfo(props.scenarioId);
  });
  </script>
  
  <style scoped>
  .map-legend {
    position: absolute;
    bottom: var(--space-4);
    right: var(--space-4);
    width: 240px;
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-sticky);
    overflow: hidden;
  }
  
  .legend-header {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border-subtle);
  }
  
  .legend-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
  
  .legend-content {
    padding: var(--space-3) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-height: 400px;
    overflow-y: auto;
  }
  
  .legend-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .legend-section-title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  /* Fire Zone Samples */
  .zone-sample {
    width: 24px;
    height: 16px;
    border-radius: 3px;
    border: 2px solid;
    flex-shrink: 0;
  }
  
  .zone-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  
  .zone-description {
    font-size: 10px;
    color: var(--color-text-tertiary);
    line-height: 1.3;
  }
  
  /* Wind Indicator */
  .wind-indicator {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: var(--space-2);
    background-color: var(--color-gray-50);
    border-radius: var(--radius-md);
    margin-top: var(--space-2);
  }
  
  .wind-icon {
    width: 20px;
    height: 20px;
    color: var(--color-gray-500);
    flex-shrink: 0;
  }
  
  .wind-icon svg {
    width: 100%;
    height: 100%;
  }
  
  .wind-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  
  .wind-direction {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .wind-description {
    font-size: 10px;
    color: var(--color-text-tertiary);
    line-height: 1.3;
  }
  
  /* Risk Gradient */
  .risk-gradient {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  
  .risk-gradient-bar {
    height: 12px;
    border-radius: 6px;
    background: linear-gradient(
      to right,
      var(--color-risk-low) 0%,
      var(--color-risk-moderate) 40%,
      var(--color-risk-high) 70%,
      var(--color-risk-severe) 100%
    );
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .risk-gradient-labels {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: var(--color-text-tertiary);
  }
  
  /* Legend Items */
  .legend-items {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  
  .legend-item-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-primary);
  }
  
  /* Route Samples */
  .route-sample {
    width: 32px;
    height: 4px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  
  .route-sample--primary {
    background-color: var(--color-route-primary);
    box-shadow: 0 0 4px var(--color-route-primary);
  }
  
  .route-sample--alternate {
    background-color: var(--color-route-alternate);
    box-shadow: 0 0 4px var(--color-route-alternate);
  }
  
  .route-sample--last-resort {
    background-color: var(--color-route-last-resort);
    box-shadow: 0 0 4px var(--color-route-last-resort);
  }
  
  /* Shelter/Home Samples */
  .shelter-sample,
  .home-sample {
    width: 32px;
    display: flex;
    justify-content: center;
    flex-shrink: 0;
  }
  
  /* Disclaimer */
  .legend-disclaimer {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background-color: var(--color-gray-50);
    border-top: 1px solid var(--color-border-subtle);
  }
  
  .disclaimer-icon {
    width: 14px;
    height: 14px;
    color: var(--color-text-tertiary);
    flex-shrink: 0;
    margin-top: 1px;
  }
  
  .legend-disclaimer span {
    font-size: 10px;
    line-height: 1.4;
    color: var(--color-text-tertiary);
  }
  
  /* Transition */
  .legend-fade-enter-active,
  .legend-fade-leave-active {
    transition: opacity var(--transition-normal), transform var(--transition-normal);
  }
  
  .legend-fade-enter-from,
  .legend-fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
  </style>