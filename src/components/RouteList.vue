<!--
  RouteList.vue
  
  Displays the list of generated routes for Step 4.
  Shows route cards and detailed explanations for the selected route.
  Includes "Save My Plan" button to generate printable summary.
-->

<template>
    <div class="route-list">
      <!-- Header -->
      <div class="route-list-header">
        <p class="route-intro">
          Based on your home location, household profile, and selected scenario, 
          we've generated {{ routes.length }} evacuation route options.
        </p>
      </div>
      
      <!-- Route cards -->
      <div class="route-cards">
        <RouteCard
          v-for="route in routes"
          :key="route.id"
          :route="route"
          :selected="selectedRouteId === route.id"
          @select="handleSelect"
        />
      </div>
      
      <!-- Selected route explanations -->
      <Transition name="fade">
        <div v-if="selectedRoute && householdProfile && selectedScenarioId" class="route-details">
          <h3 class="details-title">
            Route to {{ selectedRoute.endsAtShelterName }}
          </h3>
          
          <div class="route-summary">
            <div class="summary-item">
              <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd" />
              </svg>
              <span>{{ selectedRoute.etaMinutesRange[0] }}–{{ selectedRoute.etaMinutesRange[1] }} min</span>
            </div>
            <div class="summary-item">
              <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
              </svg>
              <span>{{ selectedRoute.distanceKm }} km</span>
            </div>
            <div class="summary-item">
              <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" />
              </svg>
              <span>{{ selectedRoute.endsAtShelterName }}</span>
            </div>
          </div>
          
          <!-- Explanations component -->
          <RouteExplanation
            :route="selectedRoute"
            :scenario-id="selectedScenarioId"
            :household="householdProfile"
          />
        </div>
      </Transition>
      
      <!-- Save Plan Button -->
      <div class="save-plan-section">
        <button class="btn btn-primary btn-save-plan" @click="showPlanSummary = true">
          <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          Save My Evacuation Plan
        </button>
        <p class="save-plan-hint">Generate a printable summary with your route and preparation checklist</p>
      </div>
      
      <!-- Empty state -->
      <div v-if="routes.length === 0" class="empty-state">
        <p>No routes could be generated. Please try adjusting your selections.</p>
      </div>
      
      <!-- Plan Summary Modal -->
      <Teleport to="body">
        <Transition name="modal">
          <PlanSummary v-if="showPlanSummary" @close="showPlanSummary = false" />
        </Transition>
      </Teleport>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useAppStore } from '../stores/appStore';
  import RouteCard from './RouteCard.vue';
  import RouteExplanation from './RouteExplanation.vue';
  import PlanSummary from './PlanSummary.vue';
  
  const store = useAppStore();
  
  // Local state
  const showPlanSummary = ref(false);
  
  // Data from store
  const routes = computed(() => store.routeOptions);
  const selectedRouteId = computed(() => store.selectedRouteId);
  const selectedRoute = computed(() => store.selectedRoute);
  const householdProfile = computed(() => store.householdProfile);
  const selectedScenarioId = computed(() => store.selectedScenarioId);
  
  // Handle route selection
  function handleSelect(id: string): void {
    store.setSelectedRoute(id);
  }
  </script>
  
  <style scoped>
  .route-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  
  .route-list-header {
    padding: var(--space-4);
    background-color: var(--color-primary-50);
    border-radius: var(--radius-lg);
    border-left: 4px solid var(--color-primary-500);
  }
  
  .route-intro {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }
  
  .route-cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  
  /* Route details section */
  .route-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .details-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }
  
  /* Route summary stats */
  .route-summary {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    padding: var(--space-3);
    background-color: var(--color-gray-50);
    border-radius: var(--radius-md);
  }
  
  .summary-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
  
  .summary-item .icon {
    width: 16px;
    height: 16px;
    color: var(--color-gray-400);
  }
  
  /* Save plan section */
  .save-plan-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-4);
    background-color: var(--color-gray-50);
    border-radius: var(--radius-lg);
    border: 1px dashed var(--color-border);
  }
  
  .btn-save-plan {
    padding: var(--space-3) var(--space-6);
    font-size: var(--font-size-base);
  }
  
  .btn-save-plan .icon {
    width: 20px;
    height: 20px;
  }
  
  .save-plan-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    margin: 0;
  }
  
  /* Empty state */
  .empty-state {
    padding: var(--space-8);
    text-align: center;
    color: var(--color-text-tertiary);
  }
  
  /* Fade transition */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity var(--transition-normal);
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  /* Modal transition */
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity var(--transition-normal);
  }
  
  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }
  </style>