<!--
  RouteExplanation.vue
  
  Displays the "Why this route?" and "Things to watch" sections
  for a selected route.
  
  Props:
  - route: The RouteOption being explained
  - scenarioId: The selected scenario
  - household: The household profile
-->

<template>
    <div class="route-explanation">
      <!-- Why this route? -->
      <div class="explanation-section explanation-section--positives">
        <h4 class="section-title">
          <span class="section-icon section-icon--positive">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
            </svg>
          </span>
          Why this route?
        </h4>
        <ul class="explanation-list">
          <li v-for="(item, index) in explanation.positives" :key="'pos-' + index">
            {{ item }}
          </li>
        </ul>
      </div>
  
      <!-- Things to watch -->
      <div class="explanation-section explanation-section--cautions">
        <h4 class="section-title">
          <span class="section-icon section-icon--caution">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
            </svg>
          </span>
          Things to watch
        </h4>
        <ul class="explanation-list explanation-list--cautions">
          <li v-for="(item, index) in explanation.cautions" :key="'cau-' + index">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import type { RouteOption, ScenarioId, HouseholdProfile } from '../types';
  import { explainRoute } from '../utils/routeExplainer';
  
  const props = defineProps<{
    route: RouteOption;
    scenarioId: ScenarioId;
    household: HouseholdProfile;
  }>();
  
  // Generate explanations
  const explanation = computed(() => {
    return explainRoute(props.route, props.scenarioId, props.household);
  });
  </script>
  
  <style scoped>
  .route-explanation {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .explanation-section {
    padding: var(--space-4);
    border-radius: var(--radius-lg);
  }
  
  .explanation-section--positives {
    background-color: #f0fdf4; /* Green-50 */
    border: 1px solid #bbf7d0; /* Green-200 */
  }
  
  .explanation-section--cautions {
    background-color: #fffbeb; /* Amber-50 */
    border: 1px solid #fde68a; /* Amber-200 */
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-3) 0;
  }
  
  .section-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: var(--radius-full);
  }
  
  .section-icon svg {
    width: 16px;
    height: 16px;
  }
  
  .section-icon--positive {
    color: #16a34a; /* Green-600 */
  }
  
  .section-icon--caution {
    color: #d97706; /* Amber-600 */
  }
  
  .explanation-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .explanation-list li {
    position: relative;
    padding-left: var(--space-5);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
  }
  
  .explanation-list li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .explanation-section--positives .explanation-list li::before {
    background-color: #4ade80; /* Green-400 */
  }
  
  .explanation-section--cautions .explanation-list li::before {
    background-color: #fbbf24; /* Amber-400 */
  }
  </style>