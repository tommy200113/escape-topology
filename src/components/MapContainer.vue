<!--
  MapContainer.vue
  
  The main map component for Escape Topology.
  
  Responsibilities:
  - Initialize and manage the MapLibre GL JS map instance
  - Configure 3D terrain with proper encoding
  - Handle click events for home location selection (Step 1)
  - Display the home marker, route lines, fire zones, risk overlay, shelters, legend
  - Provide camera controls
  
  Terrain is a visual enhancement only - console logging, no UI indicators.
-->

<template>
  <div class="map-container">
    <div ref="mapRef" class="map-canvas"></div>
    
    <!-- Home marker -->
    <HomeMarker 
      :map="map" 
      :location="homeLocation" 
    />
    
    <!-- Fire zone overlay (rendered below routes) -->
    <FireZoneOverlay
      :map="map"
      :scenario-id="selectedScenarioId"
      :visible="showFireZones"
    />
    
    <!-- Route lines -->
    <RouteLines
      ref="routeLinesRef"
      :map="map"
      :routes="routeOptions"
      :selected-route-id="selectedRouteId"
    />
    
    <!-- Risk overlay (procedural gradient) -->
    <RiskOverlay
      :map="map"
      :scenario="selectedScenarioId"
      :visible="showRiskOverlay"
    />
    
    <!-- Shelter markers -->
    <ShelterMarkers
      :map="map"
      :shelters="shelters"
      :selected-shelter-id="selectedShelterId"
      :visible="showShelters"
    />
    
    <!-- Map legend -->
    <MapLegend 
      :visible="showLegend" 
      :show-fire-zones="showFireZones"
      :scenario-id="selectedScenarioId"
    />
    
    <!-- Custom map controls -->
    <MapControls
      v-if="showMapControls"
      :map="map"
      :home="homeLocation"
      @reset-view="handleResetView"
      @focus-home="handleFocusHome"
    />
    
    <!-- Map loading indicator -->
    <Transition name="fade">
      <div v-if="isLoading" class="map-loading">
        <div class="map-loading-spinner"></div>
        <span class="map-loading-text">Loading map...</span>
      </div>
    </Transition>
    
    <!-- Region label overlay (top-left) -->
    <div class="region-label">
      <span class="region-name">{{ regionName }}</span>
      <span class="region-subtitle">{{ regionSubtitle }}</span>
    </div>
    
    <!-- Out of bounds message -->
    <Transition name="slide-up">
      <div v-if="showOutOfBoundsMessage" class="out-of-bounds-message">
        <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
        <span>Please select a location within the demo region</span>
      </div>
    </Transition>
    
    <!-- Click hint (shown when no home set) -->
    <Transition name="fade">
      <div v-if="showClickHint && !homeLocation" class="click-hint">
        <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clip-rule="evenodd" />
        </svg>
        <span>Click anywhere on the map to set your home</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef, watch } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  REGION,
  CAMERA,
  TILES,
  TERRAIN_CONFIG,
  INTERACTION,
  getRegionCenterLngLat,
} from '../config/mapConfig';
import { SHELTERS } from '../config/shelters';
import { useAppStore } from '../stores/appStore';
import { useCameraControls } from '../composables/useCameraControls';
import HomeMarker from './HomeMarker.vue';
import RouteLines from './RouteLines.vue';
import RiskOverlay from './RiskOverlay.vue';
import FireZoneOverlay from './FireZoneOverlay.vue';
import ShelterMarkers from './ShelterMarkers.vue';
import MapLegend from './MapLegend.vue';
import MapControls from './MapControls.vue';

// ============================================
// Suppress known OpenFreeMap style errors
// These are harmless errors from their tile style having null values
// ============================================
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = String(args[0] ?? '');
  if (message.includes('Expected value to be of type number, but found null')) {
    return; // Suppress OpenFreeMap style noise
  }
  originalConsoleError.apply(console, args);
};

// Store
const store = useAppStore();

// Camera controls
const { focusOnRoute } = useCameraControls();

// Refs
const mapRef = ref<HTMLElement | null>(null);
const map = shallowRef<maplibregl.Map | null>(null);
const routeLinesRef = ref<InstanceType<typeof RouteLines> | null>(null);
const isLoading = ref(true);
const showClickHint = ref(false);
const showOutOfBoundsMessage = ref(false);

// Internal terrain state (for debugging, not exposed in UI)
const terrainState = ref<{ loaded: boolean; source: 'maptiler' | 'terrarium' | 'none' }>({
  loaded: false,
  source: 'none',
});

// Track if we've done initial camera focus for Step 4
const hasInitialFocus = ref(false);

// Shelters data
const shelters = SHELTERS;

// Computed from store
const homeLocation = computed(() => store.homeLocation);
const currentStep = computed(() => store.currentStep);
const routeOptions = computed(() => store.routeOptions);
const selectedRouteId = computed(() => store.selectedRouteId);
const selectedScenarioId = computed(() => store.selectedScenarioId);

// Get selected route object
const selectedRoute = computed(() => {
  if (!selectedRouteId.value || !routeOptions.value) return null;
  return routeOptions.value.find(r => r.id === selectedRouteId.value) ?? null;
});

// Get selected shelter ID from the selected route
const selectedShelterId = computed(() => {
  if (!selectedRoute.value) return null;
  const shelter = shelters.find(s => s.name === selectedRoute.value!.endsAtShelterName);
  return shelter?.id ?? null;
});

// Visibility controls
const showFireZones = computed(() => currentStep.value >= 3 && selectedScenarioId.value !== null);
const showRiskOverlay = computed(() => currentStep.value >= 3 && selectedScenarioId.value !== null);
const showShelters = computed(() => currentStep.value >= 3);
const showLegend = computed(() => currentStep.value >= 3);
const showMapControls = computed(() => currentStep.value >= 3);

// Region display info
const regionName = REGION.name;
const regionSubtitle = REGION.displaySubtitle;

// Timer for out of bounds message
let outOfBoundsTimer: ReturnType<typeof setTimeout> | null = null;

// Terrain source ID constant
const TERRAIN_SOURCE_ID = 'terrain-dem';

/**
 * Initialize 3D terrain with fallback chain
 */
function initializeTerrain(mapInstance: maplibregl.Map): void {
  if (!TERRAIN_CONFIG.enabled) {
    console.log('3D terrain disabled in config');
    terrainState.value = { loaded: false, source: 'none' };
    return;
  }

  // Try MapTiler first if API key is available
  if (TERRAIN_CONFIG.maptiler) {
    try {
      mapInstance.addSource(TERRAIN_SOURCE_ID, {
        type: 'raster-dem',
        url: TERRAIN_CONFIG.maptiler.url,
        tileSize: TERRAIN_CONFIG.maptiler.tileSize,
        maxzoom: 12,
      });
      
      mapInstance.setTerrain({
        source: TERRAIN_SOURCE_ID,
        exaggeration: TERRAIN_CONFIG.exaggeration,
      });
      
      terrainState.value = { loaded: true, source: 'maptiler' };
      console.log('3D terrain enabled with MapTiler');
      return;
    } catch (error) {
      console.warn('MapTiler terrain failed, trying fallback:', error);
      try {
        if (mapInstance.getSource(TERRAIN_SOURCE_ID)) {
          mapInstance.removeSource(TERRAIN_SOURCE_ID);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  }
  
  // Fallback to AWS Terrarium
  try {
    mapInstance.addSource(TERRAIN_SOURCE_ID, {
      type: 'raster-dem',
      tiles: TERRAIN_CONFIG.terrarium.tiles,
      tileSize: TERRAIN_CONFIG.terrarium.tileSize,
      encoding: TERRAIN_CONFIG.terrarium.encoding,
      maxzoom: TERRAIN_CONFIG.terrarium.maxzoom,
    });
    
    mapInstance.setTerrain({
      source: TERRAIN_SOURCE_ID,
      exaggeration: TERRAIN_CONFIG.exaggeration,
    });
    
    terrainState.value = { loaded: true, source: 'terrarium' };
    console.log('3D terrain fallback: AWS Terrarium');
    return;
  } catch (error) {
    console.warn('AWS Terrarium terrain failed:', error);
  }
  
  terrainState.value = { loaded: false, source: 'none' };
  console.log('3D terrain unavailable, continuing without elevation');
}

/**
 * Handle terrain errors that occur after initial setup
 */
function handleTerrainError(mapInstance: maplibregl.Map): void {
  if (terrainState.value.source !== 'maptiler') return;
  
  console.warn('MapTiler terrain failed during tile loading, attempting fallback');
  
  try {
    mapInstance.setTerrain(null);
    if (mapInstance.getSource(TERRAIN_SOURCE_ID)) {
      mapInstance.removeSource(TERRAIN_SOURCE_ID);
    }
    
    mapInstance.addSource(TERRAIN_SOURCE_ID, {
      type: 'raster-dem',
      tiles: TERRAIN_CONFIG.terrarium.tiles,
      tileSize: TERRAIN_CONFIG.terrarium.tileSize,
      encoding: TERRAIN_CONFIG.terrarium.encoding,
      maxzoom: TERRAIN_CONFIG.terrarium.maxzoom,
    });
    
    mapInstance.setTerrain({
      source: TERRAIN_SOURCE_ID,
      exaggeration: TERRAIN_CONFIG.exaggeration,
    });
    
    terrainState.value = { loaded: true, source: 'terrarium' };
    console.log('3D terrain fallback: AWS Terrarium (after MapTiler failure)');
  } catch (e) {
    terrainState.value = { loaded: false, source: 'none' };
    console.log('3D terrain unavailable after fallback attempt');
  }
}

// Show out of bounds message temporarily
function flashOutOfBoundsMessage(): void {
  showOutOfBoundsMessage.value = true;
  
  if (outOfBoundsTimer) {
    clearTimeout(outOfBoundsTimer);
  }
  
  outOfBoundsTimer = setTimeout(() => {
    showOutOfBoundsMessage.value = false;
  }, 3000);
}

// Handle map click for home selection
function handleMapClick(e: maplibregl.MapMouseEvent): void {
  if (currentStep.value !== 1) return;
  
  const { lng, lat } = e.lngLat;
  const location = { lat, lng };
  
  const success = store.setHomeLocation(location);
  
  if (!success) {
    flashOutOfBoundsMessage();
  }
}

// Handle reset view event
function handleResetView(): void {
  console.log('View reset');
}

// Handle focus home event
function handleFocusHome(): void {
  console.log('Focused on home');
}

// Auto-focus on route when selected
function autoFocusOnRoute(): void {
  if (!map.value || !selectedRoute.value) return;
  
  setTimeout(() => {
    if (map.value && selectedRoute.value) {
      focusOnRoute(map.value, selectedRoute.value, homeLocation.value);
    }
  }, 100);
}

// Watch for step changes to handle initial Step 4 focus
watch(currentStep, (newStep, oldStep) => {
  if (newStep === 4 && oldStep !== 4) {
    hasInitialFocus.value = false;
    
    if (selectedRoute.value) {
      setTimeout(() => {
        if (!hasInitialFocus.value && map.value && selectedRoute.value) {
          hasInitialFocus.value = true;
          focusOnRoute(map.value, selectedRoute.value, homeLocation.value);
        }
      }, 300);
    }
  }
});

// Watch for route selection changes
watch(selectedRouteId, (newId, oldId) => {
  if (newId && newId !== oldId && currentStep.value === 4) {
    autoFocusOnRoute();
  }
});

// Update cursor style when step changes
watch(currentStep, (step) => {
  if (map.value) {
    map.value.getCanvas().style.cursor = step === 1 ? 'crosshair' : '';
  }
});

// Initialize map on mount
onMounted(() => {
  if (!mapRef.value) return;

  const mapInstance = new maplibregl.Map({
    container: mapRef.value,
    style: TILES.style,
    center: getRegionCenterLngLat(),
    zoom: CAMERA.initialZoom,
    minZoom: CAMERA.minZoom,
    maxZoom: CAMERA.maxZoom,
    pitch: CAMERA.defaultPitch,
    bearing: CAMERA.defaultBearing,
    maxPitch: CAMERA.maxPitch,
    
    dragRotate: INTERACTION.allowRotation,
    touchZoomRotate: INTERACTION.allowRotation,
    doubleClickZoom: INTERACTION.doubleClickZoom,
    scrollZoom: INTERACTION.scrollZoom,
  });

  // Add navigation controls
  const navControl = new maplibregl.NavigationControl({
    showCompass: INTERACTION.allowRotation,
    visualizePitch: true,
  });
  mapInstance.addControl(navControl, 'top-right');

  // Initialize terrain when style loads
  mapInstance.on('style.load', () => {
    initializeTerrain(mapInstance);
  });

  // Handle load complete
  mapInstance.on('load', () => {
    isLoading.value = false;
    
    setTimeout(() => {
      showClickHint.value = true;
    }, 500);
  });

  // Handle click events
  mapInstance.on('click', handleMapClick);
  
  // Change cursor on hover (Step 1 only)
  mapInstance.on('mousemove', () => {
    if (currentStep.value === 1) {
      mapInstance.getCanvas().style.cursor = 'crosshair';
    } else {
      mapInstance.getCanvas().style.cursor = '';
    }
  });

  // Handle map errors
  mapInstance.on('error', (e) => {
    const error = e as any;
    
    if (error?.error?.message?.includes('Expected value to be of type number')) {
      return;
    }
    
    if (error?.error?.message?.includes('403') || error?.error?.status === 403) {
      handleTerrainError(mapInstance);
      return;
    }
    
    console.error('Map error:', e);
  });

  // Assign the map instance
  map.value = mapInstance;
});

// Cleanup on unmount
onUnmounted(() => {
  if (outOfBoundsTimer) {
    clearTimeout(outOfBoundsTimer);
  }
  
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

// Expose map instance and terrain state
defineExpose({
  getMap: () => map.value,
  getTerrainState: () => terrainState.value,
});
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--color-gray-100);
}

.map-canvas {
  width: 100%;
  height: 100%;
}

/* Loading overlay */
.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  background-color: var(--color-gray-100);
  z-index: var(--z-overlay);
}

.map-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.map-loading-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--transition-normal);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Region label - subtle overlay in top-left */
.region-label {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  z-index: var(--z-sticky);
  pointer-events: none;
}

.region-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.region-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

/* Out of bounds message */
.out-of-bounds-message {
  position: absolute;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-risk-high);
  color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-overlay);
}

.out-of-bounds-message .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Click hint */
.click-hint {
  position: absolute;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  z-index: var(--z-sticky);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.click-hint .icon {
  width: 20px;
  height: 20px;
  color: var(--color-primary-500);
  flex-shrink: 0;
}
</style>