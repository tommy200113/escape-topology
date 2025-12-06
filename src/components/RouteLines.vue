<!--
  RouteLines.vue
  
  Renders evacuation route lines on the map.
  
  Features:
  - Different colors for primary, alternate, and last-resort routes
  - Selected route is highlighted with glow effect
  - Smooth draw-in animation when route is selected
  - Non-selected routes shown at reduced opacity
-->

<template>
  <div class="route-lines-container" />
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted, computed, ref } from 'vue';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { RouteOption, RouteOptionLabel } from '../types';
import { useRouteAnimation } from '../composables/useRouteAnimation';

// Props
const props = defineProps<{
  map: MapLibreMap | null;
  routes: RouteOption[];
  selectedRouteId?: string | null;
}>();

// Animation composable
const { animateRoute, cancelAnimation, getAnimatedGeometry, isAnimating } = useRouteAnimation();

// Track if this is initial render
const hasAnimatedInitial = ref(false);

// Source and layer IDs
const SOURCE_PREFIX = 'route-source-';
const LAYER_PREFIX = 'route-layer-';
const GLOW_LAYER_PREFIX = 'route-glow-';

// Route colors by label
const ROUTE_COLORS: Record<RouteOptionLabel, string> = {
  PRIMARY: '#22c55e',      // Green
  ALTERNATE: '#eab308',    // Yellow
  LAST_RESORT: '#f97316',  // Orange
};

// Route styling
const ROUTE_STYLES = {
  selected: {
    width: 6,
    opacity: 1,
    glowWidth: 12,
    glowOpacity: 0.4,
  },
  unselected: {
    width: 4,
    opacity: 0.5,
    glowWidth: 0,
    glowOpacity: 0,
  },
};

/**
 * Convert route geometry to GeoJSON
 */
function routeToGeoJSON(route: RouteOption, animated: boolean = false, progress: number = 1): GeoJSON.Feature {
  const geometry = animated ? getAnimatedGeometry(route, progress) : route.geometry;
  
  return {
    type: 'Feature',
    properties: {
      id: route.id,
      label: route.label,
    },
    geometry: {
      type: 'LineString',
      coordinates: geometry.map(p => [p.lng, p.lat]),
    },
  };
}

/**
 * Add or update route layers on the map
 */
function updateRoutes(animatedRouteId?: string, animationProgress: number = 1): void {
  const map = props.map;
  if (!map || !map.isStyleLoaded()) return;
  
  const selectedId = props.selectedRouteId;
  
  // Process each route
  for (const route of props.routes) {
    const sourceId = SOURCE_PREFIX + route.id;
    const layerId = LAYER_PREFIX + route.id;
    const glowLayerId = GLOW_LAYER_PREFIX + route.id;
    const isSelected = route.id === selectedId;
    const isAnimated = route.id === animatedRouteId && isAnimating.value;
    
    // Get style based on selection state
    const style = isSelected ? ROUTE_STYLES.selected : ROUTE_STYLES.unselected;
    const color = ROUTE_COLORS[route.label];
    
    // Create GeoJSON (with animation if applicable)
    const geojson = routeToGeoJSON(
      route,
      isAnimated,
      isAnimated ? animationProgress : 1
    );
    
    // Check if source exists
    if (map.getSource(sourceId)) {
      // Update existing source
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
      
      // Update layer styles
      if (map.getLayer(glowLayerId)) {
        map.setPaintProperty(glowLayerId, 'line-width', style.glowWidth);
        map.setPaintProperty(glowLayerId, 'line-opacity', style.glowOpacity);
      }
      
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'line-width', style.width);
        map.setPaintProperty(layerId, 'line-opacity', style.opacity);
      }
    } else {
      // Add new source
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
      });
      
      // Find the first symbol layer to insert below labels
      const layers = map.getStyle().layers;
      let firstSymbolId: string | undefined;
      if (layers) {
        for (const layer of layers) {
          if (layer.type === 'symbol') {
            firstSymbolId = layer.id;
            break;
          }
        }
      }
      
      // Add glow layer (underneath main line)
      map.addLayer(
        {
          id: glowLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': color,
            'line-width': style.glowWidth,
            'line-opacity': style.glowOpacity,
            'line-blur': 4,
          },
        },
        firstSymbolId
      );
      
      // Add main line layer
      map.addLayer(
        {
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': color,
            'line-width': style.width,
            'line-opacity': style.opacity,
          },
        },
        firstSymbolId
      );
    }
  }
  
  // Reorder layers so selected route is on top
  if (selectedId) {
    const selectedGlowLayer = GLOW_LAYER_PREFIX + selectedId;
    const selectedLineLayer = LAYER_PREFIX + selectedId;
    
    // Move selected route layers to top (within route layers)
    for (const route of props.routes) {
      if (route.id !== selectedId) {
        const layerId = LAYER_PREFIX + route.id;
        const glowId = GLOW_LAYER_PREFIX + route.id;
        
        if (map.getLayer(layerId) && map.getLayer(selectedLineLayer)) {
          try {
            map.moveLayer(glowId, selectedGlowLayer);
            map.moveLayer(layerId, selectedGlowLayer);
          } catch (e) {
            // Ignore errors if layers don't exist
          }
        }
      }
    }
  }
}

/**
 * Remove all route layers from the map
 */
function removeRoutes(): void {
  const map = props.map;
  if (!map) return;
  
  for (const route of props.routes) {
    const sourceId = SOURCE_PREFIX + route.id;
    const layerId = LAYER_PREFIX + route.id;
    const glowLayerId = GLOW_LAYER_PREFIX + route.id;
    
    try {
      if (map.getLayer(glowLayerId)) {
        map.removeLayer(glowLayerId);
      }
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Start animation for a route
 */
function startRouteAnimation(routeId: string): void {
  animateRoute(
    routeId,
    (progress) => {
      updateRoutes(routeId, progress);
    },
    () => {
      // Animation complete - ensure full route is drawn
      updateRoutes();
    }
  );
}

// Watch for route changes
watch(
  () => props.routes,
  (newRoutes, oldRoutes) => {
    if (props.map && newRoutes.length > 0) {
      // Check if this is initial load with routes
      if (!hasAnimatedInitial.value && props.selectedRouteId) {
        hasAnimatedInitial.value = true;
        startRouteAnimation(props.selectedRouteId);
      } else {
        updateRoutes();
      }
    } else if (newRoutes.length === 0) {
      removeRoutes();
      hasAnimatedInitial.value = false;
    }
  },
  { deep: true }
);

// Watch for selection changes
watch(
  () => props.selectedRouteId,
  (newId, oldId) => {
    if (newId && newId !== oldId && props.map) {
      // Animate the newly selected route
      startRouteAnimation(newId);
    } else {
      updateRoutes();
    }
  }
);

// Watch for map changes
watch(
  () => props.map,
  (newMap) => {
    if (newMap && props.routes.length > 0) {
      if (newMap.isStyleLoaded()) {
        // Initial render - animate if there's a selected route
        if (props.selectedRouteId && !hasAnimatedInitial.value) {
          hasAnimatedInitial.value = true;
          startRouteAnimation(props.selectedRouteId);
        } else {
          updateRoutes();
        }
      } else {
        newMap.once('style.load', () => {
          if (props.selectedRouteId && !hasAnimatedInitial.value) {
            hasAnimatedInitial.value = true;
            startRouteAnimation(props.selectedRouteId);
          } else {
            updateRoutes();
          }
        });
      }
    }
  }
);

// Initialize on mount
onMounted(() => {
  if (props.map && props.routes.length > 0) {
    if (props.map.isStyleLoaded()) {
      if (props.selectedRouteId && !hasAnimatedInitial.value) {
        hasAnimatedInitial.value = true;
        startRouteAnimation(props.selectedRouteId);
      } else {
        updateRoutes();
      }
    } else {
      props.map.once('style.load', () => {
        if (props.selectedRouteId && !hasAnimatedInitial.value) {
          hasAnimatedInitial.value = true;
          startRouteAnimation(props.selectedRouteId);
        } else {
          updateRoutes();
        }
      });
    }
  }
});

// Cleanup on unmount
onUnmounted(() => {
  cancelAnimation();
  removeRoutes();
});

// Expose for parent
defineExpose({
  refresh: () => updateRoutes(),
});
</script>

<style scoped>
.route-lines-container {
  display: none;
}
</style>