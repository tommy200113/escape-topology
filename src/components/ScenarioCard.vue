<!--
  ScenarioCard.vue
  
  A selectable card displaying a single scenario option.
  
  Props:
  - scenario: The scenario object to display
  - selected: Whether this card is currently selected
  
  Emits:
  - select: When the card is clicked
-->

<template>
    <button
      class="scenario-card"
      :class="{ 'scenario-card--selected': selected }"
      @click="$emit('select', scenario.id)"
    >
      <!-- Icon -->
      <div 
        class="scenario-icon" 
        :class="[`scenario-icon--${scenario.id.toLowerCase()}`]"
        :data-selected="selected"
      >
        <!-- Sun icon for typical high-risk -->
        <svg v-if="iconType === 'sun'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        
        <!-- Flame icon for fire from hills -->
        <svg v-else-if="iconType === 'flame'" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 23c-4.97 0-9-3.58-9-8 0-2.52 1.17-4.83 3.15-6.87.6-.62 1.25-1.17 1.85-1.63V4c0-.55.45-1 1-1s1 .45 1 1v3.26c.6-.33 1.2-.6 1.78-.81C11.26 5.02 10 3.04 10 2c0-.55.45-1 1-1 3.87 0 7 4.13 7 9 0 1.27-.24 2.49-.67 3.6.9.76 1.67 1.72 2.24 2.78.35.65.43 1.41.22 2.12-.21.71-.68 1.31-1.31 1.68C16.95 21.33 14.54 23 12 23z"/>
        </svg>
        
        <!-- Moon icon for night evacuation -->
        <svg v-else-if="iconType === 'moon'" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
        </svg>
      </div>
      
      <!-- Content -->
      <div class="scenario-content">
        <h3 class="scenario-name">{{ scenario.name }}</h3>
        <p class="scenario-description">{{ scenario.description }}</p>
      </div>
      
      <!-- Selection indicator -->
      <div class="scenario-check" :class="{ 'scenario-check--visible': selected }">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
        </svg>
      </div>
    </button>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import type { Scenario, ScenarioId } from '../types';
  import { SCENARIO_ICONS } from '../config/scenarios';
  
  const props = defineProps<{
    scenario: Scenario;
    selected: boolean;
  }>();
  
  defineEmits<{
    select: [id: ScenarioId];
  }>();
  
  // Get icon type for this scenario
  const iconType = computed(() => SCENARIO_ICONS[props.scenario.id]);
  </script>
  
  <style scoped>
  .scenario-card {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    width: 100%;
    padding: var(--space-4);
    background-color: var(--color-surface);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    text-align: left;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .scenario-card:hover {
    border-color: var(--color-gray-300);
    background-color: var(--color-gray-50);
  }
  
  .scenario-card--selected {
    border-color: var(--color-primary-500);
    background-color: var(--color-primary-50);
  }
  
  .scenario-card--selected:hover {
    border-color: var(--color-primary-600);
    background-color: var(--color-primary-50);
  }
  
  /* Icon base styles */
  .scenario-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }
  
  .scenario-icon svg {
    width: 24px;
    height: 24px;
  }
  
  /* Sun icon - Typical High Risk */
  .scenario-icon--typical_high_risk {
    background-color: #fef3c7; /* Warm yellow tint */
    color: #d97706; /* Amber-600 */
  }
  
  .scenario-icon--typical_high_risk[data-selected="true"] {
    background-color: #fde68a; /* Brighter yellow */
    color: #b45309; /* Amber-700 - darker for contrast */
    box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.2);
  }
  
  /* Flame icon - Fire from Hills */
  .scenario-icon--fire_from_hills {
    background-color: #fee2e2; /* Light red tint */
    color: #dc2626; /* Red-600 */
  }
  
  .scenario-icon--fire_from_hills[data-selected="true"] {
    background-color: #fecaca; /* Brighter red */
    color: #b91c1c; /* Red-700 - darker for contrast */
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
  }
  
  /* Moon icon - Night Evacuation */
  .scenario-icon--night_evac {
    background-color: #e0e7ff; /* Light indigo tint */
    color: #4f46e5; /* Indigo-600 */
  }
  
  .scenario-icon--night_evac[data-selected="true"] {
    background-color: #c7d2fe; /* Brighter indigo */
    color: #3730a3; /* Indigo-700 - darker for contrast */
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
  }
  
  /* Content */
  .scenario-content {
    flex: 1;
    min-width: 0;
  }
  
  .scenario-name {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-1) 0;
  }
  
  .scenario-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }
  
  /* Selection check */
  .scenario-check {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    color: var(--color-primary-500);
    opacity: 0;
    transform: scale(0.8);
    transition: all var(--transition-fast);
  }
  
  .scenario-check--visible {
    opacity: 1;
    transform: scale(1);
  }
  
  .scenario-check svg {
    width: 100%;
    height: 100%;
  }
  </style>