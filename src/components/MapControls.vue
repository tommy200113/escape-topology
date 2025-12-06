<!--
  MapControls.vue
  
  Additional map control buttons (beyond the default zoom).
  
  Features:
  - Reset view button
  - Focus on home button
  - Positioned near the zoom controls
-->

<template>
    <div class="map-controls">
      <!-- Reset View Button -->
      <button
        class="control-button"
        :disabled="isTransitioning"
        title="Reset view"
        @click="handleResetView"
      >
        <svg class="control-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <!-- Focus Home Button (only shown when home is set) -->
      <button
        v-if="hasHome"
        class="control-button"
        :disabled="isTransitioning"
        title="Focus on home"
        @click="handleFocusHome"
      >
        <svg class="control-icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      </button>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import type { Map as MapLibreMap } from 'maplibre-gl';
  import type { LatLng } from '../types';
  import { useCameraControls } from '../composables/useCameraControls';
  
  const props = defineProps<{
    map: MapLibreMap | null;
    home: LatLng | null;
  }>();
  
  const emit = defineEmits<{
    (e: 'reset-view'): void;
    (e: 'focus-home'): void;
  }>();
  
  const { isTransitioning, focusOnHome, resetView } = useCameraControls();
  
  const hasHome = computed(() => props.home !== null);
  
  function handleResetView(): void {
    if (props.map) {
      resetView(props.map);
      emit('reset-view');
    }
  }
  
  function handleFocusHome(): void {
    if (props.map && props.home) {
      focusOnHome(props.map, props.home);
      emit('focus-home');
    }
  }
  </script>
  
  <style scoped>
  .map-controls {
    position: absolute;
    top: var(--space-3);
    right: calc(var(--space-3) + 40px); /* Position left of zoom controls */
    display: flex;
    flex-direction: column;
    gap: 1px;
    background-color: white;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    z-index: var(--z-sticky);
  }
  
  .control-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background-color: white;
    border: none;
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }
  
  .control-button:hover:not(:disabled) {
    background-color: var(--color-gray-100);
  }
  
  .control-button:active:not(:disabled) {
    background-color: var(--color-gray-200);
  }
  
  .control-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .control-button:not(:last-child) {
    border-bottom: 1px solid var(--color-gray-200);
  }
  
  .control-icon {
    width: 18px;
    height: 18px;
    color: var(--color-gray-700);
  }
  </style>