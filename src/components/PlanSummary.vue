<!--
  PlanSummary.vue
  
  A printable evacuation plan summary.
  Displays all relevant information in a print-friendly format.
-->

<template>
    <div class="plan-summary-overlay" @click.self="$emit('close')">
      <div class="plan-summary">
        <!-- Header with close and print buttons -->
        <div class="plan-actions no-print">
          <button class="btn btn-secondary btn-close-plan" @click="$emit('close')">
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
            Close
          </button>
          <button class="btn btn-primary btn-print" @click="handlePrint">
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd" />
            </svg>
            Print Plan
          </button>
        </div>
  
        <div class="plan-summary-content">
          <!-- Plan Header -->
          <header class="plan-header">
            <h1>My Evacuation Plan</h1>
            <p class="plan-subtitle">Escape Topology - Wildfire Evacuation Planning</p>
            <p class="plan-date">Generated: {{ formattedDate }}</p>
          </header>
  
          <!-- Home Location -->
          <section class="plan-section">
            <h3 class="section-title">
              <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Home Location
            </h3>
            <div class="section-content">
              <p class="location-coords">
                Coordinates: {{ homeLocation?.lat.toFixed(5) }}°N, {{ Math.abs(homeLocation?.lng || 0).toFixed(5) }}°W
              </p>
              <p class="location-region">Region: Example Wildfire Foothills Region, CA</p>
            </div>
          </section>
  
          <!-- Household Profile -->
          <section class="plan-section">
            <h3 class="section-title">
              <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
              Household Profile
            </h3>
            <div class="section-content household-grid">
              <div class="household-item">
                <span class="item-label">Adults:</span>
                <span class="item-value">{{ household?.adults }}</span>
              </div>
              <div class="household-item">
                <span class="item-label">Children:</span>
                <span class="item-value">{{ household?.children }}</span>
              </div>
              <div class="household-item">
                <span class="item-label">Mobility:</span>
                <span class="item-value">{{ formatMobility(household?.mobility) }}</span>
              </div>
              <div class="household-item">
                <span class="item-label">Vehicle:</span>
                <span class="item-value">{{ formatVehicle(household?.vehicle) }}</span>
              </div>
              <div class="household-item">
                <span class="item-label">Pets:</span>
                <span class="item-value">{{ household?.pets ? 'Yes' : 'No' }}</span>
              </div>
              <div v-if="household?.notes" class="household-item household-item--full">
                <span class="item-label">Notes:</span>
                <span class="item-value">{{ household.notes }}</span>
              </div>
            </div>
          </section>
  
          <!-- Scenario -->
          <section class="plan-section">
            <h3 class="section-title">
              <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
              Scenario Planned For
            </h3>
            <div class="section-content">
              <p class="scenario-name">{{ scenario?.name }}</p>
              <p class="scenario-description">{{ scenario?.description }}</p>
            </div>
          </section>
  
          <!-- Selected Route -->
          <section v-if="selectedRoute" class="plan-section route-highlight">
            <h3 class="section-title">
              <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" />
              </svg>
              Your Evacuation Route
            </h3>
            <div class="section-content">
              <div class="route-main-info">
                <div class="route-badge" :class="`route-badge--${selectedRoute.label.toLowerCase()}`">
                  {{ formatRouteLabel(selectedRoute.label) }}
                </div>
                <h4 class="route-destination">{{ selectedRoute.endsAtShelterName }}</h4>
              </div>
              
              <div class="route-stats-grid">
                <div class="route-stat">
                  <span class="stat-label">Distance</span>
                  <span class="stat-value">{{ selectedRoute.distanceKm }} km</span>
                </div>
                <div class="route-stat">
                  <span class="stat-label">Estimated Time</span>
                  <span class="stat-value">{{ selectedRoute.etaMinutesRange[0] }}–{{ selectedRoute.etaMinutesRange[1] }} min</span>
                </div>
                <div class="route-stat">
                  <span class="stat-label">Risk Level</span>
                  <span class="stat-value">{{ formatRiskLevel(selectedRoute.riskScore) }}</span>
                </div>
              </div>
  
              <!-- Route Explanation -->
              <div v-if="household && scenarioId" class="route-explanation-section">
                <RouteExplanation 
                  :route="selectedRoute" 
                  :scenario-id="scenarioId" 
                  :household="household" 
                />
              </div>
            </div>
          </section>
  
          <!-- Alternate Routes -->
          <section v-if="alternateRoutes.length > 0" class="plan-section">
            <h3 class="section-title">
              <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd" />
                <path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clip-rule="evenodd" />
              </svg>
              Backup Routes
            </h3>
            <div class="section-content">
              <div class="alternate-routes">
                <div v-for="route in alternateRoutes" :key="route.id" class="alternate-route">
                  <div class="route-badge" :class="`route-badge--${route.label.toLowerCase()}`">
                    {{ formatRouteLabel(route.label) }}
                  </div>
                  <div class="alternate-route-info">
                    <span class="alternate-destination">{{ route.endsAtShelterName }}</span>
                    <span class="alternate-stats">{{ route.distanceKm }} km · {{ route.etaMinutesRange[0] }}–{{ route.etaMinutesRange[1] }} min</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
  
          <!-- Evacuation Checklist -->
          <section v-if="household" class="plan-section">
            <h3 class="section-title">
              <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
              </svg>
              Evacuation Checklist
            </h3>
            <div class="section-content">
              <EvacuationChecklist :household="household" />
            </div>
          </section>
  
          <!-- Disclaimer -->
          <section class="plan-disclaimer">
            <h4>Important Notice</h4>
            <p>
              This evacuation plan is generated by Escape Topology, a demonstration prototype using 
              <strong>fictional data</strong>. Do not rely on this plan for actual emergency decisions. 
              Always follow official evacuation orders from local authorities, fire departments, and 
              emergency management agencies. Real conditions may differ significantly from this planning scenario.
            </p>
            <p>
              For official emergency information, contact your local fire department or visit 
              <strong>www.readyforwildfire.org</strong> (California) or <strong>www.ready.gov</strong> (Federal).
            </p>
          </section>
  
          <!-- Print footer -->
          <footer class="print-footer print-only">
            <p>Generated by Escape Topology · {{ formattedDate }} · For planning purposes only</p>
          </footer>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import { useAppStore } from '../stores/appStore';
  import { getScenario } from '../config/scenarios';
  import RouteExplanation from './RouteExplanation.vue';
  import EvacuationChecklist from './EvacuationChecklist.vue';
  import type { MobilityLevel, VehicleAccess, RouteOptionLabel } from '../types';
  
  defineEmits<{
    close: [];
  }>();
  
  const store = useAppStore();
  
  // Data from store
  const homeLocation = computed(() => store.homeLocation);
  const household = computed(() => store.householdProfile);
  const scenarioId = computed(() => store.selectedScenarioId);
  const selectedRoute = computed(() => store.selectedRoute);
  const routes = computed(() => store.routeOptions);
  
  // Get scenario details
  const scenario = computed(() => {
    if (!scenarioId.value) return null;
    return getScenario(scenarioId.value);
  });
  
  // Get alternate routes (not the selected one)
  const alternateRoutes = computed(() => {
    if (!selectedRoute.value) return routes.value;
    return routes.value.filter(r => r.id !== selectedRoute.value?.id);
  });
  
  // Formatted date
  const formattedDate = computed(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  });
  
  // Format helpers
  function formatMobility(mobility?: MobilityLevel): string {
    switch (mobility) {
      case 'none': return 'No limitations';
      case 'limited': return 'Some limitations';
      case 'wheelchair': return 'Wheelchair/mobility device';
      default: return 'Unknown';
    }
  }
  
  function formatVehicle(vehicle?: VehicleAccess): string {
    switch (vehicle) {
      case 'has_car': return 'Personal vehicle';
      case 'needs_transport': return 'Needs transportation';
      default: return 'Unknown';
    }
  }
  
  function formatRouteLabel(label: RouteOptionLabel): string {
    switch (label) {
      case 'PRIMARY': return 'Recommended';
      case 'ALTERNATE': return 'Alternate';
      case 'LAST_RESORT': return 'Last Resort';
      default: return label;
    }
  }
  
  function formatRiskLevel(score: number): string {
    if (score < 0.3) return 'Lower';
    if (score < 0.5) return 'Moderate';
    if (score < 0.7) return 'Elevated';
    return 'High';
  }
  
  // Print handler
  function handlePrint(): void {
    window.print();
  }
  </script>
  
  <style scoped>
  .plan-summary-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: var(--z-modal);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    overflow-y: auto;
  }
  
  .plan-summary {
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    background-color: var(--color-surface);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    overflow-y: auto;
  }
  
  .plan-actions {
    position: sticky;
    top: 0;
    display: flex;
    justify-content: space-between;
    padding: var(--space-4);
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    z-index: 10;
  }
  
  .plan-actions .icon {
    width: 16px;
    height: 16px;
  }
  
  .plan-summary-content {
    padding: var(--space-6);
  }
  
  /* Header */
  .plan-header {
    text-align: center;
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-4);
    border-bottom: 2px solid var(--color-primary-500);
  }
  
  .plan-header h1 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-1) 0;
  }
  
  .plan-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
  
  .plan-date {
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    margin: var(--space-2) 0 0 0;
  }
  
  /* Sections */
  .plan-section {
    margin-bottom: var(--space-6);
    padding: var(--space-4);
    background-color: var(--color-gray-50);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-3) 0;
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }
  
  .section-title .icon {
    width: 20px;
    height: 20px;
    color: var(--color-primary-500);
  }
  
  .section-content {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
  
  /* Home location */
  .location-coords {
    font-family: var(--font-family-mono);
    margin: 0 0 var(--space-1) 0;
  }
  
  .location-region {
    margin: 0;
  }
  
  /* Household grid */
  .household-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }
  
  .household-item {
    display: flex;
    gap: var(--space-2);
  }
  
  .household-item--full {
    grid-column: span 2;
  }
  
  .item-label {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .item-value {
    color: var(--color-text-secondary);
  }
  
  /* Scenario */
  .scenario-name {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-2) 0;
  }
  
  .scenario-description {
    margin: 0;
    line-height: var(--line-height-relaxed);
  }
  
  /* Route highlight */
  .route-highlight {
    background-color: #f0fdf4;
    border-color: #bbf7d0;
    border-left: 4px solid #22c55e;
  }
  
  .route-main-info {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  
  .route-destination {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }
  
  .route-badge {
    display: inline-flex;
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: var(--radius-sm);
  }
  
  .route-badge--primary {
    background-color: #dcfce7;
    color: #166534;
  }
  
  .route-badge--alternate {
    background-color: #fef9c3;
    color: #854d0e;
  }
  
  .route-badge--last_resort {
    background-color: #ffedd5;
    color: #9a3412;
  }
  
  .route-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
    padding: var(--space-3);
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
  }
  
  .route-stat {
    text-align: center;
  }
  
  .stat-label {
    display: block;
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    margin-bottom: var(--space-1);
  }
  
  .stat-value {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
  
  .route-explanation-section {
    margin-top: var(--space-4);
  }
  
  /* Alternate routes */
  .alternate-routes {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .alternate-route {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    background-color: var(--color-surface);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }
  
  .alternate-route-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  
  .alternate-destination {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .alternate-stats {
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
  }
  
  /* Disclaimer */
  .plan-disclaimer {
    margin-top: var(--space-6);
    padding: var(--space-4);
    background-color: #fef3c7;
    border: 2px solid #f59e0b;
    border-radius: var(--radius-lg);
  }
  
  .plan-disclaimer h4 {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: #92400e;
    margin: 0 0 var(--space-2) 0;
  }
  
  .plan-disclaimer p {
    font-size: var(--font-size-sm);
    color: #78350f;
    margin: 0 0 var(--space-2) 0;
    line-height: var(--line-height-relaxed);
  }
  
  .plan-disclaimer p:last-child {
    margin-bottom: 0;
  }
  
  /* Print only elements */
  .print-only {
    display: none;
  }
  
  .print-footer {
    text-align: center;
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    margin-top: var(--space-6);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }
  </style>