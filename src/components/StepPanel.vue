<!--
  StepPanel.vue
  
  A reusable side panel for step-specific content.
  Displays on the left side of the map with a semi-transparent backdrop.
  
  Used for:
  - Step 2: Household form
  - Step 3: Scenario selection
  - Step 4: Route list and details
-->

<template>
    <div class="step-panel">
      <div class="step-panel-content">
        <slot></slot>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  // No props needed for now - just a layout wrapper
  </script>
  
  <style scoped>
  .step-panel {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 400px;
    max-width: 90vw;
    background-color: var(--color-surface);
    border-right: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-overlay);
    overflow-y: auto;
  }
  
  .step-panel-content {
    padding: var(--space-6);
  }
  
  /* Smooth scrollbar */
  .step-panel::-webkit-scrollbar {
    width: 6px;
  }
  
  .step-panel::-webkit-scrollbar-track {
    background: var(--color-gray-100);
  }
  
  .step-panel::-webkit-scrollbar-thumb {
    background: var(--color-gray-300);
    border-radius: var(--radius-full);
  }
  
  .step-panel::-webkit-scrollbar-thumb:hover {
    background: var(--color-gray-400);
  }
  </style>