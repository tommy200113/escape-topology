<!--
  App.vue
  
  Root component for Escape Topology.
  
  Layout structure:
  - Fixed header with app branding
  - Step header with navigation (Back/Next buttons)
  - Main content area with:
    - Map (always visible)
    - Step panels (conditionally shown based on current step)
  - Fixed footer with disclaimer
-->

<template>
  <div class="app-layout">
    <!-- App header (branding) -->
    <header class="app-header">
      <div class="header-content">
        <div class="header-brand">
          <h1 class="header-title">Escape Topology</h1>
          <span class="header-tagline">Wildfire Evacuation Planning</span>
        </div>
        
        <!-- Reset button (useful during development/testing) -->
        <button 
          v-if="hasProgress"
          class="btn btn-secondary btn-reset"
          @click="handleReset"
        >
          Start Over
        </button>
      </div>
    </header>
    
    <!-- Step header with navigation -->
    <StepHeader />

    <!-- Main content area -->
    <main class="app-main">
      <!-- Map is always visible -->
      <MapContainer />
      
      <!-- Step 2: Household Form Panel -->
      <Transition name="slide-in">
        <StepPanel v-if="currentStep === 2">
          <HouseholdForm />
        </StepPanel>
      </Transition>
      
      <!-- Step 3: Scenario Selection -->
      <Transition name="slide-in">
        <StepPanel v-if="currentStep === 3">
          <ScenarioSelector />
        </StepPanel>
      </Transition>
      
      <!-- Step 4: Routes -->
      <Transition name="slide-in">
        <StepPanel v-if="currentStep === 4">
          <RouteList />
        </StepPanel>
      </Transition>
    </main>

    <!-- Footer with disclaimer -->
    <footer class="app-footer">
      <div class="footer-content">
        <p class="footer-disclaimer">
          <strong>Demo Only:</strong> Escape Topology is a demonstration prototype 
          using fictional data. Do not use this tool for real emergency decisions. 
          Always follow official evacuation orders from local authorities.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MapContainer from './components/MapContainer.vue';
import StepHeader from './components/StepHeader.vue';
import StepPanel from './components/StepPanel.vue';
import HouseholdForm from './components/HouseholdForm.vue';
import ScenarioSelector from './components/ScenarioSelector.vue';
import RouteList from './components/RouteList.vue';
import { useAppStore } from './stores/appStore';

const store = useAppStore();

// Reactive state from store
const currentStep = computed(() => store.currentStep);

// Show reset button if user has made any progress
const hasProgress = computed(() => {
  return store.homeLocation !== null || store.currentStep > 1;
});

function handleReset(): void {
  if (confirm('Start over? This will clear your home location and all selections.')) {
    store.resetAll();
  }
}
</script>

<style scoped>
.app-layout {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

/* App header (branding) */
.app-header {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border-subtle);
  z-index: var(--z-sticky);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 100%;
  padding: var(--space-2) var(--space-4);
}

.header-brand {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.header-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.header-tagline {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.btn-reset {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-3);
}

/* Main content */
.app-main {
  position: relative;
  overflow: hidden;
}

/* Slide-in transition for panels */
.slide-in-enter-active,
.slide-in-leave-active {
  transition: transform var(--transition-normal), opacity var(--transition-normal);
}

.slide-in-enter-from,
.slide-in-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

/* Footer */
.app-footer {
  background-color: var(--color-gray-100);
  border-top: 1px solid var(--color-border);
  z-index: var(--z-sticky);
}

.footer-content {
  padding: var(--space-2) var(--space-4);
}

.footer-disclaimer {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-align: center;
  line-height: var(--line-height-normal);
}

.footer-disclaimer strong {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}
</style>