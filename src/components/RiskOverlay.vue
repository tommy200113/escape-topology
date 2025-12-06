<!--
  RiskOverlay.vue
  
  Renders the procedural wildfire risk overlay on the map.
  
  This component:
  - Generates a risk grid based on the current scenario
  - Renders the grid to a canvas with color-coded risk levels
  - Adds the canvas as an image layer to the MapLibre map
  
  The overlay uses variable opacity to keep the base map readable
  while highlighting high-risk areas.
-->

<template>
    <!-- This component renders directly to the map, no visible template -->
    <div class="risk-overlay-container" />
  </template>
  
  <script setup lang="ts">
  import { watch, onMounted, onUnmounted, computed } from 'vue';
  import type { Map as MapLibreMap, ImageSource } from 'maplibre-gl';
  import type { ScenarioId } from '../types';
  import { generateRiskGrid, type RiskGrid } from '../utils/riskField';
  import { getBlendedRiskColor } from '../config/riskConfig';
  import { REGION } from '../config/mapConfig';
  
  // Props - scenario can be ScenarioId, null, or undefined
  const props = withDefaults(
    defineProps<{
      map: MapLibreMap | null;
      scenario?: ScenarioId | null;
      visible?: boolean;
    }>(),
    {
      scenario: null,
      visible: true,
    }
  );
  
  // Normalize scenario to handle undefined
  const normalizedScenario = computed(() => props.scenario ?? null);
  
  // Default visibility to true
  const isVisible = computed(() => props.visible ?? true);
  
  // Internal state
  const sourceId = 'risk-overlay-source';
  const layerId = 'risk-overlay-layer';
  let currentGrid: RiskGrid | null = null;
  let canvas: HTMLCanvasElement | null = null;
  
  /**
   * Generate canvas image from risk grid
   */
  function renderGridToCanvas(grid: RiskGrid): HTMLCanvasElement {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = grid.width;
    newCanvas.height = grid.height;
    
    const ctx = newCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Create image data
    const imageData = ctx.createImageData(grid.width, grid.height);
    const data = imageData.data;
    
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        // Flip Y axis (canvas Y increases downward, but we want north at top)
        const gridY = grid.height - 1 - y;
        const risk = grid.data[gridY * grid.width + x];
        
        // Get blended color for smooth gradients
        const color = getBlendedRiskColor(risk);
        
        const i = (y * grid.width + x) * 4;
        data[i] = color.r;
        data[i + 1] = color.g;
        data[i + 2] = color.b;
        data[i + 3] = Math.round(color.a * 255);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return newCanvas;
  }
  
  /**
   * Add or update the risk overlay on the map
   */
  function updateOverlay(): void {
    const map = props.map;
    const scenario = normalizedScenario.value;
    
    if (!map || !scenario) {
      removeOverlay();
      return;
    }
    
    // Check if map style is loaded
    if (!map.isStyleLoaded()) {
      return;
    }
    
    // Generate new risk grid
    currentGrid = generateRiskGrid(scenario);
    
    // Render to canvas
    canvas = renderGridToCanvas(currentGrid);
    
    // Get bounds for the image
    const bounds = REGION.bounds;
    const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
      [bounds.sw.lng, bounds.ne.lat], // top-left
      [bounds.ne.lng, bounds.ne.lat], // top-right
      [bounds.ne.lng, bounds.sw.lat], // bottom-right
      [bounds.sw.lng, bounds.sw.lat], // bottom-left
    ];
    
    // Check if source already exists
    if (map.getSource(sourceId)) {
      // Update existing source
      const source = map.getSource(sourceId) as ImageSource;
      source.updateImage({
        url: canvas.toDataURL(),
        coordinates,
      });
    } else {
      // Add new source
      map.addSource(sourceId, {
        type: 'image',
        url: canvas.toDataURL(),
        coordinates,
      });
      
      // Add layer (below labels, above base map)
      // Find the first symbol layer to insert below it
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
      
      map.addLayer(
        {
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: {
            'raster-opacity': isVisible.value ? 1 : 0,
            'raster-fade-duration': 300,
          },
        },
        firstSymbolId // Insert below labels
      );
    }
    
    // Update visibility
    updateVisibility();
  }
  
  /**
   * Remove the overlay from the map
   */
  function removeOverlay(): void {
    const map = props.map;
    if (!map) return;
    
    try {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    } catch (e) {
      // Ignore errors during cleanup (map might be in invalid state)
      console.debug('RiskOverlay cleanup:', e);
    }
    
    currentGrid = null;
    canvas = null;
  }
  
  /**
   * Update layer visibility
   */
  function updateVisibility(): void {
    const map = props.map;
    if (!map) return;
    
    try {
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'raster-opacity', isVisible.value ? 1 : 0);
      }
    } catch (e) {
      // Ignore errors if layer doesn't exist
    }
  }
  
  // Watch for scenario changes
  watch(
    normalizedScenario,
    (newScenario, oldScenario) => {
      if (newScenario !== oldScenario && props.map) {
        updateOverlay();
      }
    }
  );
  
  // Watch for map changes
  watch(
    () => props.map,
    (newMap) => {
      if (newMap && normalizedScenario.value) {
        // Wait for map to be ready
        if (newMap.isStyleLoaded()) {
          updateOverlay();
        } else {
          newMap.once('style.load', updateOverlay);
        }
      }
    }
  );
  
  // Watch for visibility changes
  watch(isVisible, updateVisibility);
  
  // Initialize when mounted (if map and scenario are already set)
  onMounted(() => {
    if (props.map && normalizedScenario.value) {
      if (props.map.isStyleLoaded()) {
        updateOverlay();
      } else {
        props.map.once('style.load', updateOverlay);
      }
    }
  });
  
  // Cleanup on unmount
  onUnmounted(() => {
    removeOverlay();
  });
  
  // Expose methods for parent components
  defineExpose({
    refresh: updateOverlay,
    getGrid: () => currentGrid,
  });
  </script>
  
  <style scoped>
  .risk-overlay-container {
    /* Hidden container - component renders to map */
    display: none;
  }
  </style>