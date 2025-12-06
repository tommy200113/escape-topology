<!--
  ShelterMarkers.vue
  
  Renders shelter location markers on the map.
  
  Features:
  - Custom SVG markers for each shelter
  - Selected shelter (route destination) shows label always
  - Other shelters show label on hover
  - Smooth hover interactions
-->

<template>
    <div class="shelter-markers-container" />
  </template>
  
  <script setup lang="ts">
  import { watch, onMounted, onUnmounted, computed, ref } from 'vue';
  import maplibregl, { type Map as MapLibreMap, Marker, Popup } from 'maplibre-gl';
  import type { Shelter } from '../types';
  
  // Props
  const props = defineProps<{
    map: MapLibreMap | null;
    shelters: Shelter[];
    selectedShelterId?: string | null;
    visible?: boolean;
  }>();
  
  // Default visibility
  const isVisible = computed(() => props.visible ?? true);
  
  // Track created markers
  const markers = ref(new Map<string, Marker>());
  // @ts-ignore - MapLibre Popup type recursion issue
  const popups = ref<Map<string, Popup>>(new Map());
  
  /**
   * Create SVG marker element for a shelter
   */
  function createMarkerElement(shelter: Shelter, isSelected: boolean): HTMLDivElement {
    const container = document.createElement('div');
    container.className = `shelter-marker ${isSelected ? 'shelter-marker--selected' : ''}`;
    container.dataset.shelterId = shelter.id;
    
    // SVG icon - minimalist building/civic hall shape
    container.innerHTML = `
      <svg 
        width="${isSelected ? 32 : 24}" 
        height="${isSelected ? 32 : 24}" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        class="shelter-icon"
      >
        <!-- Building base -->
        <rect 
          x="4" y="10" 
          width="16" height="11" 
          rx="1" 
          fill="${isSelected ? '#2563eb' : '#475569'}"
          stroke="${isSelected ? '#1d4ed8' : '#334155'}"
          stroke-width="1"
        />
        <!-- Roof -->
        <path 
          d="M2 11L12 4L22 11" 
          stroke="${isSelected ? '#1d4ed8' : '#334155'}" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          fill="${isSelected ? '#3b82f6' : '#64748b'}"
        />
        <!-- Door -->
        <rect 
          x="10" y="15" 
          width="4" height="6" 
          rx="0.5" 
          fill="${isSelected ? '#bfdbfe' : '#cbd5e1'}"
        />
        <!-- Windows -->
        <rect x="6" y="12" width="3" height="2.5" rx="0.5" fill="${isSelected ? '#bfdbfe' : '#cbd5e1'}"/>
        <rect x="15" y="12" width="3" height="2.5" rx="0.5" fill="${isSelected ? '#bfdbfe' : '#cbd5e1'}"/>
      </svg>
    `;
    
    // Add label for selected shelter
    if (isSelected) {
      const label = document.createElement('div');
      label.className = 'shelter-label shelter-label--visible';
      label.textContent = shelter.name;
      container.appendChild(label);
    }
    
    return container;
  }
  
  /**
   * Create hover popup for non-selected shelters
   */
  function createPopup(shelter: Shelter): Popup {
    return new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -12],
      className: 'shelter-popup',
    }).setHTML(`
      <div class="shelter-popup-content">
        <span class="shelter-popup-name">${shelter.name}</span>
        <span class="shelter-popup-type">${formatShelterType(shelter.type)}</span>
      </div>
    `);
  }
  
  /**
   * Format shelter type for display
   */
  function formatShelterType(type: Shelter['type']): string {
    const typeLabels: Record<Shelter['type'], string> = {
      community_center: 'Community Center',
      school: 'School',
      civic_hall: 'Civic Hall',
      recreation_center: 'Recreation Center',
    };
    return typeLabels[type] || type;
  }
  
  /**
   * Add all shelter markers to the map
   */
  function addMarkers(): void {
    const map = props.map;
    if (!map) return;
    
    // Clear existing markers
    removeMarkers();
    
    // Add marker for each shelter
    for (const shelter of props.shelters) {
      const isSelected = shelter.id === props.selectedShelterId;
      
      // Create marker element
      const element = createMarkerElement(shelter, isSelected);
      
      // Create marker
      const marker = new maplibregl.Marker({
        element,
        anchor: 'bottom',
      })
        .setLngLat([shelter.location.lng, shelter.location.lat]);
      
      // Add to map if visible
      if (isVisible.value) {
        marker.addTo(map);
      }
      
      // Create popup for non-selected shelters
      if (!isSelected) {
        const popup = createPopup(shelter);
        popups.value.set(shelter.id, popup);
        
        // Show popup on hover
        element.addEventListener('mouseenter', () => {
          if (map && isVisible.value) {
            popup
              .setLngLat([shelter.location.lng, shelter.location.lat])
              .addTo(map);
          }
        });
        
        element.addEventListener('mouseleave', () => {
          popup.remove();
        });
      }
      
      markers.value.set(shelter.id, marker);
    }
  }
  
  /**
   * Remove all markers from the map
   */
  function removeMarkers(): void {
    for (const marker of markers.value.values()) {
      marker.remove();
    }
    markers.value.clear();
    
    for (const popup of popups.value.values()) {
      popup.remove();
    }
    popups.value.clear();
  }
  
  /**
   * Update marker visibility
   */
  function updateVisibility(): void {
    const map = props.map;
    if (!map) return;
    
    for (const [_shelterId, marker] of markers.value.entries()) {
      if (isVisible.value) {
        marker.addTo(map);
      } else {
        marker.remove();
      }
    }
    
    // Also hide popups when not visible
    if (!isVisible.value) {
      for (const popup of popups.value.values()) {
        popup.remove();
      }
    }
  }
  
  // Watch for shelter changes or selection changes
  watch(
    [() => props.shelters, () => props.selectedShelterId],
    () => {
      if (props.map) {
        addMarkers();
      }
    },
    { deep: true }
  );
  
  // Watch for map changes
  watch(
    () => props.map,
    (newMap) => {
      if (newMap) {
        if (newMap.isStyleLoaded()) {
          addMarkers();
        } else {
          newMap.once('style.load', addMarkers);
        }
      }
    }
  );
  
  // Watch for visibility changes
  watch(isVisible, updateVisibility);
  
  // Initialize when mounted
  onMounted(() => {
    if (props.map && props.shelters.length > 0) {
      if (props.map.isStyleLoaded()) {
        addMarkers();
      } else {
        props.map.once('style.load', addMarkers);
      }
    }
  });
  
  // Cleanup on unmount
  onUnmounted(() => {
    removeMarkers();
  });
  
  // Expose methods
  defineExpose({
    refresh: addMarkers,
  });
  </script>
  
  <style>
  /* 
    Note: Using non-scoped styles because markers are added directly to the map DOM.
    Prefix all classes with 'shelter-' to avoid conflicts.
  */
  
  .shelter-markers-container {
    display: none;
  }
  
  .shelter-marker {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.15s ease;
  }
  
  .shelter-marker:hover {
    transform: scale(1.1);
  }
  
  .shelter-marker--selected {
    z-index: 10;
  }
  
  .shelter-marker--selected:hover {
    transform: scale(1.05);
  }
  
  .shelter-icon {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }
  
  .shelter-marker--selected .shelter-icon {
    filter: drop-shadow(0 3px 6px rgba(37, 99, 235, 0.4));
  }
  
  /* Permanent label for selected shelter */
  .shelter-label {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 4px;
    padding: 4px 8px;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    font-size: 12px;
    font-weight: 600;
    color: #1e40af;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  
  .shelter-label--visible {
    opacity: 1;
  }
  
  /* Popup styles for hover */
  .shelter-popup .maplibregl-popup-content {
    padding: 0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }
  
  .shelter-popup .maplibregl-popup-tip {
    border-top-color: white;
  }
  
  .shelter-popup-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 12px;
  }
  
  .shelter-popup-name {
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
  }
  
  .shelter-popup-type {
    font-size: 11px;
    color: #6b7280;
  }
  </style>