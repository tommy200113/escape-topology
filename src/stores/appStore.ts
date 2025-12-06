/**
 * App Store - Central state management for Escape Topology
 * 
 * Manages:
 * - Wizard step navigation
 * - Home location
 * - Household profile
 * - Selected scenario
 * - Route options and selection
 * - Route caching for OSRM results
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  LatLng, 
  HouseholdProfile, 
  ScenarioId, 
  RouteOption, 
  AppStep,
  Scenario 
} from '../types';
import { isWithinRegion } from '../config/mapConfig';
import { generateRoutes, clearRouteCache } from '../utils/routeGenerator';
import { getScenario } from '../config/scenarios';

export const useAppStore = defineStore('app', () => {
  // ============================================
  // State
  // ============================================
  
  const currentStep = ref<AppStep>(1);
  const homeLocation = ref<LatLng | null>(null);
  const householdProfile = ref<HouseholdProfile | null>(null);
  const selectedScenarioId = ref<ScenarioId | null>(null);
  const routeOptions = ref<RouteOption[]>([]);
  const selectedRouteId = ref<string | null>(null);
  
  // Loading state for async route generation
  const isGeneratingRoutes = ref(false);
  const routeGenerationError = ref<string | null>(null);
  
  // Track last home location used for route generation
  // Used to determine if cache should be cleared
  const lastRouteHomeLocation = ref<LatLng | null>(null);

  // ============================================
  // Computed / Getters
  // ============================================
  
  const hasValidHome = computed(() => {
    return homeLocation.value !== null && isWithinRegion(homeLocation.value);
  });
  
  const hasValidHousehold = computed(() => {
    if (!householdProfile.value) return false;
    const h = householdProfile.value;
    return h.adults >= 1 && h.mobility && h.vehicle;
  });
  
  const hasSelectedScenario = computed(() => {
    return selectedScenarioId.value !== null;
  });
  
  const canProceedToNextStep = computed(() => {
    switch (currentStep.value) {
      case 1:
        return hasValidHome.value;
      case 2:
        return hasValidHousehold.value;
      case 3:
        return hasSelectedScenario.value;
      case 4:
        return false;
      default:
        return false;
    }
  });
  
  const selectedRoute = computed(() => {
    if (!selectedRouteId.value) return null;
    return routeOptions.value.find(r => r.id === selectedRouteId.value) || null;
  });
  
  const selectedScenario = computed((): Scenario | null => {
    if (!selectedScenarioId.value) return null;
    return getScenario(selectedScenarioId.value);
  });

  // ============================================
  // Actions
  // ============================================
  
  function setHomeLocation(location: LatLng): boolean {
    if (isWithinRegion(location)) {
      // Check if location changed significantly (more than ~100m)
      if (lastRouteHomeLocation.value) {
        const latDiff = Math.abs(location.lat - lastRouteHomeLocation.value.lat);
        const lngDiff = Math.abs(location.lng - lastRouteHomeLocation.value.lng);
        if (latDiff > 0.001 || lngDiff > 0.001) {
          // Location changed significantly, clear cache
          clearRouteCache();
        }
      }
      
      homeLocation.value = location;
      return true;
    }
    return false;
  }
  
  function clearHomeLocation(): void {
    homeLocation.value = null;
    clearRouteCache();
  }
  
  function setHouseholdProfile(profile: HouseholdProfile): void {
    householdProfile.value = profile;
  }
  
  function clearHouseholdProfile(): void {
    householdProfile.value = null;
  }
  
  function setSelectedScenario(scenarioId: ScenarioId): void {
    selectedScenarioId.value = scenarioId;
  }
  
  function clearSelectedScenario(): void {
    selectedScenarioId.value = null;
  }
  
  /**
   * Generate routes based on current state
   * Called when moving from Step 3 to Step 4
   * 
   * This is now an async function that fetches from OSRM
   */
  async function generateAndSetRoutes(): Promise<void> {
    if (!homeLocation.value || !householdProfile.value || !selectedScenarioId.value) {
      console.warn('Cannot generate routes: missing required data');
      routeGenerationError.value = 'Missing required data for route generation';
      return;
    }
    
    isGeneratingRoutes.value = true;
    routeGenerationError.value = null;
    
    try {
      const routes = await generateRoutes(
        homeLocation.value,
        householdProfile.value,
        selectedScenarioId.value
      );
      
      routeOptions.value = routes;
      lastRouteHomeLocation.value = { ...homeLocation.value };
      
      // Auto-select the primary route
      if (routes.length > 0) {
        selectedRouteId.value = routes[0].id;
      }
    } catch (error) {
      console.error('Route generation failed:', error);
      routeGenerationError.value = 'Failed to generate routes. Please try again.';
    } finally {
      isGeneratingRoutes.value = false;
    }
  }
  
  /**
   * Re-generate routes (e.g., when scenario changes in Step 4)
   * Reuses cached OSRM geometries, only recalculates scoring
   */
  async function regenerateRoutes(): Promise<void> {
    if (currentStep.value === 4) {
      await generateAndSetRoutes();
    }
  }
  
  /**
   * Set the selected route
   */
  function setSelectedRoute(routeId: string): void {
    selectedRouteId.value = routeId;
  }
  
  /**
   * Clear routes
   */
  function clearRoutes(): void {
    routeOptions.value = [];
    selectedRouteId.value = null;
    routeGenerationError.value = null;
  }
  
  async function goToNextStep(): Promise<void> {
    if (canProceedToNextStep.value && currentStep.value < 4) {
      const nextStep = (currentStep.value + 1) as AppStep;
      
      // Generate routes when entering Step 4
      if (nextStep === 4) {
        await generateAndSetRoutes();
      }
      
      currentStep.value = nextStep;
    }
  }
  
  function goToPreviousStep(): void {
    if (currentStep.value > 1) {
      // Clear routes when leaving Step 4
      if (currentStep.value === 4) {
        clearRoutes();
      }
      
      currentStep.value = (currentStep.value - 1) as AppStep;
    }
  }
  
  function goToStep(step: AppStep): void {
    if (step < currentStep.value) {
      // Clear routes if going back from Step 4
      if (currentStep.value === 4 && step < 4) {
        clearRoutes();
      }
      currentStep.value = step;
      return;
    }
    
    if (step === currentStep.value + 1 && canProceedToNextStep.value) {
      goToNextStep();
    }
  }
  
  function resetAll(): void {
    currentStep.value = 1;
    homeLocation.value = null;
    householdProfile.value = null;
    selectedScenarioId.value = null;
    routeOptions.value = [];
    selectedRouteId.value = null;
    routeGenerationError.value = null;
    lastRouteHomeLocation.value = null;
    clearRouteCache();
  }

  return {
    // State
    currentStep,
    homeLocation,
    householdProfile,
    selectedScenarioId,
    routeOptions,
    selectedRouteId,
    isGeneratingRoutes,
    routeGenerationError,
    
    // Getters
    hasValidHome,
    hasValidHousehold,
    hasSelectedScenario,
    canProceedToNextStep,
    selectedRoute,
    selectedScenario,
    
    // Actions
    setHomeLocation,
    clearHomeLocation,
    setHouseholdProfile,
    clearHouseholdProfile,
    setSelectedScenario,
    clearSelectedScenario,
    generateAndSetRoutes,
    regenerateRoutes,
    setSelectedRoute,
    clearRoutes,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetAll,
  };
});