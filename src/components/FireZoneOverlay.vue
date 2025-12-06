<!--
  FireZoneOverlay.vue
  
  Renders fire hazard zone polygons on the map.
  
  Features:
  - Three zone levels with distinct styling (active, immediate, warning)
  - Proper layer ordering (warning below, active on top)
  - Smooth transitions when scenario changes
  - Inserted below route lines but above base map
-->

<template>
    <div class="fire-zone-overlay-container" />
  </template>
  
  <script setup lang="ts">
  import { watch, onMounted, onUnmounted, computed } from 'vue';
  import type { Map as MapLibreMap } from 'maplibre-gl';
  import type { ScenarioId, FireZoneLevel } from '../types';
  import { getFireZonesAsGeoJSON } from '../config/fireZones';
  import { FIRE_ZONE_STYLES, getZoneLevelsInOrder } from '../config/fireZoneConfig';
  
  // Props
  const props = defineProps<{
    map: MapLibreMap | null;
    scenarioId: ScenarioId | null;
    visible?: boolean;
  }>();
  
  // Default visibility
  const isVisible = computed(() => props.visible ?? true);
  
  // Source and layer IDs
  const SOURCE_ID = 'fire-zones-source';
  const getLayerId = (level: FireZoneLevel) => `fire-zone-layer-${level}`;
  const getOutlineLayerId = (level: FireZoneLevel) => `fire-zone-outline-${level}`;
  
  // Track if layers have been added
  let layersAdded = false;
  
  /**
   * Add or update fire zone layers on the map
   */
  function updateFireZones(): void {
    const map = props.map;
    const scenarioId = props.scenarioId;
    
    if (!map || !map.isStyleLoaded()) {
      return;
    }
    
    // Remove existing layers and source if no scenario
    if (!scenarioId) {
      removeFireZones();
      return;
    }
    
    // Get GeoJSON data for the scenario
    const geojson = getFireZonesAsGeoJSON(scenarioId);
    
    // Check if source exists
    if (map.getSource(SOURCE_ID)) {
      // Update existing source data
      (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      // Add new source
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geojson,
      });
      
      // Add layers for each zone level (in order: warning, immediate, active)
      addZoneLayers(map);
    }
    
    // Update visibility
    updateVisibility();
  }
  
  /**
   * Add map layers for each zone level
   */
  function addZoneLayers(map: MapLibreMap): void {
    const zoneLevels = getZoneLevelsInOrder(); // ['warning', 'immediate', 'active']
    
    // Find insertion point - below route layers, above base map
    // Look for the first symbol layer to insert below labels
    const layers = map.getStyle().layers;
    let insertBeforeId: string | undefined;
    
    if (layers) {
      for (const layer of layers) {
        if (layer.type === 'symbol') {
          insertBeforeId = layer.id;
          break;
        }
      }
    }
    
    // Add layers in order (warning first/bottom, active last/top)
    for (const level of zoneLevels) {
      const style = FIRE_ZONE_STYLES[level];
      const layerId = getLayerId(level);
      const outlineId = getOutlineLayerId(level);
      
      // Fill layer
      map.addLayer(
        {
          id: layerId,
          type: 'fill',
          source: SOURCE_ID,
          filter: ['==', ['get', 'level'], level],
          paint: {
            'fill-color': style.fillColor,
            'fill-opacity': isVisible.value ? style.fillOpacity : 0,
          },
        },
        insertBeforeId
      );
      
      // Outline layer
      map.addLayer(
        {
          id: outlineId,
          type: 'line',
          source: SOURCE_ID,
          filter: ['==', ['get', 'level'], level],
          paint: {
            'line-color': style.strokeColor,
            'line-width': style.strokeWidth,
            'line-opacity': isVisible.value ? style.strokeOpacity : 0,
          },
        },
        insertBeforeId
      );
    }
    
    layersAdded = true;
  }
  
  /**
   * Remove all fire zone layers from the map
   */
  function removeFireZones(): void {
    const map = props.map;
    if (!map) return;
    
    const zoneLevels = getZoneLevelsInOrder();
    
    try {
      // Remove layers (in reverse order)
      for (const level of [...zoneLevels].reverse()) {
        const layerId = getLayerId(level);
        const outlineId = getOutlineLayerId(level);
        
        if (map.getLayer(outlineId)) {
          map.removeLayer(outlineId);
        }
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      }
      
      // Remove source
      if (map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID);
      }
    } catch (e) {
      console.debug('FireZoneOverlay cleanup:', e);
    }
    
    layersAdded = false;
  }
  
  /**
   * Update layer visibility
   */
  function updateVisibility(): void {
    const map = props.map;
    if (!map || !layersAdded) return;
    
    const zoneLevels = getZoneLevelsInOrder();
    
    for (const level of zoneLevels) {
      const style = FIRE_ZONE_STYLES[level];
      const layerId = getLayerId(level);
      const outlineId = getOutlineLayerId(level);
      
      try {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(
            layerId,
            'fill-opacity',
            isVisible.value ? style.fillOpacity : 0
          );
        }
        if (map.getLayer(outlineId)) {
          map.setPaintProperty(
            outlineId,
            'line-opacity',
            isVisible.value ? style.strokeOpacity : 0
          );
        }
      } catch (e) {
        // Ignore errors if layers don't exist
      }
    }
  }
  
  // Watch for scenario changes
  watch(
    () => props.scenarioId,
    (newScenario, oldScenario) => {
      if (newScenario !== oldScenario && props.map) {
        updateFireZones();
      }
    }
  );
  
  // Watch for map changes
  watch(
    () => props.map,
    (newMap) => {
      if (newMap && props.scenarioId) {
        if (newMap.isStyleLoaded()) {
          updateFireZones();
        } else {
          newMap.once('style.load', updateFireZones);
        }
      }
    }
  );
  
  // Watch for visibility changes
  watch(isVisible, updateVisibility);
  
  // Initialize when mounted
  onMounted(() => {
    if (props.map && props.scenarioId) {
      if (props.map.isStyleLoaded()) {
        updateFireZones();
      } else {
        props.map.once('style.load', updateFireZones);
      }
    }
  });
  
  // Cleanup on unmount
  onUnmounted(() => {
    removeFireZones();
  });
  
  // Expose methods for parent components
  defineExpose({
    refresh: updateFireZones,
  });
  </script>
  
  <style scoped>
  .fire-zone-overlay-container {
    /* Hidden container - component renders to map */
    display: none;
  }
  </style>