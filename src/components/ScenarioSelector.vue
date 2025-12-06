<!--
  ScenarioSelector.vue
  
  Displays the 3 scenario options for Step 3.
  User must select exactly one scenario to proceed.
-->

<template>
    <div class="scenario-selector">
      <div class="selector-intro">
        <p>
          Choose a scenario that best matches the conditions you want to plan for. 
          Each scenario affects which routes are recommended and how risks are displayed.
        </p>
      </div>
  
      <div class="scenario-list">
        <ScenarioCard
          v-for="scenario in scenarios"
          :key="scenario.id"
          :scenario="scenario"
          :selected="selectedScenarioId === scenario.id"
          @select="handleSelect"
        />
      </div>
      
      <!-- Info box about scenario effects -->
      <div v-if="selectedScenario" class="scenario-info">
        <div class="info-header">
          <svg class="info-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
          </svg>
          <span class="info-title">How this affects your routes</span>
        </div>
        <p class="info-text">{{ scenarioEffectText }}</p>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import { useAppStore } from '../stores/appStore';
  import { getAllScenarios } from '../config/scenarios';
  import ScenarioCard from './ScenarioCard.vue';
  import type { ScenarioId } from '../types';
  
  const store = useAppStore();
  
  // Get all scenarios for display
  const scenarios = getAllScenarios();
  
  // Current selection from store
  const selectedScenarioId = computed(() => store.selectedScenarioId);
  const selectedScenario = computed(() => {
    if (!selectedScenarioId.value) return null;
    return scenarios.find(s => s.id === selectedScenarioId.value) || null;
  });
  
  // Effect descriptions for each scenario
  const scenarioEffects: Record<ScenarioId, string> = {
    TYPICAL_HIGH_RISK: 
      'Routes will be optimized for general safety, balancing distance, road quality, and proximity to risk areas. All standard evacuation routes will be considered.',
    FIRE_FROM_HILLS: 
      'Routes heading away from the northeast will be prioritized. The system will avoid roads that run toward the fire direction and favor routes with natural barriers.',
    NIGHT_EVAC: 
      'Well-lit main roads and highways will be strongly preferred over smaller back roads. Routes will prioritize simplicity and clear navigation over shortest distance.',
  };
  
  const scenarioEffectText = computed(() => {
    if (!selectedScenarioId.value) return '';
    return scenarioEffects[selectedScenarioId.value];
  });
  
  // Handle scenario selection
  function handleSelect(id: ScenarioId): void {
    store.setSelectedScenario(id);
  }
  </script>
  
  <style scoped>
  .scenario-selector {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  
  .selector-intro {
    padding: var(--space-4);
    background-color: var(--color-primary-50);
    border-radius: var(--radius-lg);
    border-left: 4px solid var(--color-primary-500);
  }
  
  .selector-intro p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }
  
  .scenario-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  
  /* Info box */
  .scenario-info {
    padding: var(--space-4);
    background-color: var(--color-gray-50);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
  }
  
  .info-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }
  
  .info-icon {
    width: 20px;
    height: 20px;
    color: var(--color-primary-500);
    flex-shrink: 0;
  }
  
  .info-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
  
  .info-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }
  </style>