<!--
  StepHeader.vue
  
  Displays the current step information and navigation controls.
  
  Features:
  - Step title and description
  - Back button (when not on step 1)
  - Next button (enabled based on validation)
  - Step progress indicator
  - Loading state for async route generation
-->

<template>
  <div class="step-header">
    <div class="step-header-content">
      <!-- Left side: Back button + Step info -->
      <div class="step-header-left">
        <button 
          v-if="currentStep > 1"
          class="btn btn-secondary btn-back"
          :disabled="isLoading"
          @click="handleBack"
        >
          <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
          </svg>
          Back
        </button>
        
        <div class="step-info">
          <span class="step-badge">Step {{ currentStep }} of 4</span>
          <h2 class="step-title">{{ stepTitle }}</h2>
          <p class="step-description">{{ stepDescription }}</p>
        </div>
      </div>
      
      <!-- Right side: Next button -->
      <div class="step-header-right">
        <button
          v-if="currentStep < 4"
          class="btn btn-primary btn-next"
          :disabled="!canProceed || isLoading"
          @click="handleNext"
        >
          <span v-if="isLoading" class="btn-loading">
            <span class="btn-spinner"></span>
            Generating...
          </span>
          <span v-else>
            {{ nextButtonText }}
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
            </svg>
          </span>
        </button>
      </div>
    </div>
    
    <!-- Progress bar -->
    <div class="step-progress">
      <div 
        class="step-progress-fill" 
        :style="{ width: `${(currentStep / 4) * 100}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '../stores/appStore';

const store = useAppStore();

// Local loading state
const isLoading = ref(false);

// Reactive state from store
const currentStep = computed(() => store.currentStep);
const canProceed = computed(() => store.canProceedToNextStep);

// Step content configuration
const stepConfig = {
  1: {
    title: 'Locate your home',
    description: 'Click on the map to set your home location',
    nextButton: 'Continue',
  },
  2: {
    title: 'Household profile',
    description: 'Tell us about your household for personalized routes',
    nextButton: 'Continue',
  },
  3: {
    title: 'Select scenario',
    description: 'Choose a wildfire scenario to plan for',
    nextButton: 'Generate routes',
  },
  4: {
    title: 'Your escape routes',
    description: 'Review your evacuation options',
    nextButton: '',
  },
};

const stepTitle = computed(() => stepConfig[currentStep.value].title);
const stepDescription = computed(() => stepConfig[currentStep.value].description);
const nextButtonText = computed(() => stepConfig[currentStep.value].nextButton);

// Event handlers
function handleBack(): void {
  store.goToPreviousStep();
}

async function handleNext(): Promise<void> {
  isLoading.value = true;
  try {
    await store.goToNextStep();
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.step-header {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.step-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  gap: var(--space-4);
}

.step-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.step-header-right {
  flex-shrink: 0;
}

/* Back button */
.btn-back {
  padding: var(--space-2) var(--space-3);
}

/* Step info */
.step-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.step-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.step-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.step-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

/* Next button */
.btn-next {
  padding: var(--space-2) var(--space-4);
}

/* Icons in buttons */
.icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Loading state */
.btn-loading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Progress bar */
.step-progress {
  height: 3px;
  background-color: var(--color-gray-100);
}

.step-progress-fill {
  height: 100%;
  background-color: var(--color-primary-500);
  transition: width var(--transition-normal);
}
</style>