<!--
  HomeMarker.vue
  
  Renders a pulsing blue marker at the user's home location.
  
  This component doesn't render DOM elements itself - it manages
  a MapLibre marker that's added directly to the map.
  
  Props:
  - map: The MapLibre map instance
  - location: The LatLng coordinates for the marker
-->

<template>
    <!-- This component renders via MapLibre, not Vue DOM -->
  </template>
  
  <script setup lang="ts">
  import { watch, onMounted, onUnmounted, shallowRef } from 'vue';
  import maplibregl from 'maplibre-gl';
  import type { LatLng } from '../types';
  
  const props = defineProps<{
    map: maplibregl.Map | null;
    location: LatLng | null;
  }>();
  
  // Store marker reference
  const marker = shallowRef<maplibregl.Marker | null>(null);
  
  // Create the marker element
  function createMarkerElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'home-marker';
    el.innerHTML = `
      <div class="home-marker-pulse"></div>
      <div class="home-marker-dot"></div>
    `;
    return el;
  }
  
  // Add or update marker on map
  function updateMarker(): void {
    // Remove existing marker if any
    if (marker.value) {
      marker.value.remove();
      marker.value = null;
    }
    
    // Don't add if no map or location
    if (!props.map || !props.location) {
      return;
    }
    
    // Create new marker
    const el = createMarkerElement();
    marker.value = new maplibregl.Marker({
      element: el,
      anchor: 'center',
    })
      .setLngLat([props.location.lng, props.location.lat])
      .addTo(props.map);
  }
  
  // Watch for changes to map or location
  watch(
    () => [props.map, props.location],
    () => updateMarker(),
    { immediate: true }
  );
  
  // Cleanup on unmount
  onUnmounted(() => {
    if (marker.value) {
      marker.value.remove();
      marker.value = null;
    }
  });
  </script>
  
  <style>
  /* 
    These styles are global because the marker element is created
    outside of Vue's scoped style system (added directly to map DOM)
  */
  .home-marker {
    position: relative;
    width: 24px;
    height: 24px;
  }
  
  .home-marker-dot {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 14px;
    height: 14px;
    background-color: var(--color-primary-500);
    border: 3px solid var(--color-white);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
    z-index: 2;
  }
  
  .home-marker-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 24px;
    background-color: var(--color-primary-400);
    border-radius: 50%;
    opacity: 0.6;
    z-index: 1;
    animation: home-pulse 2s ease-out infinite;
  }
  
  @keyframes home-pulse {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.6;
    }
    100% {
      transform: translate(-50%, -50%) scale(2.5);
      opacity: 0;
    }
  }
  </style>