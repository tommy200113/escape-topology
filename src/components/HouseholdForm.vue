<!--
  HouseholdForm.vue
  
  Form for collecting household information in Step 2.
  
  Fields:
  - Adults (required, number, min 1)
  - Children (number, min 0)
  - Mobility level (required, select)
  - Vehicle access (required, select)
  - Pets (checkbox)
  - Additional notes (optional textarea)
  
  The form updates the store in real-time as users type,
  and validation is checked by the store's computed properties.
-->

<template>
    <div class="household-form">
      <div class="form-intro">
        <p>
          This information helps us recommend evacuation routes that work for 
          your household's specific needs.
        </p>
      </div>
  
      <form @submit.prevent class="form-fields">
        <!-- Adults -->
        <div class="form-group">
          <label for="adults" class="form-label">
            Adults in household
            <span class="required">*</span>
          </label>
          <input
            id="adults"
            v-model.number="form.adults"
            type="number"
            min="1"
            max="20"
            class="form-input"
            placeholder="1"
            required
          />
          <p class="form-hint">Number of adults (18+) who will evacuate</p>
        </div>
  
        <!-- Children -->
        <div class="form-group">
          <label for="children" class="form-label">
            Children in household
          </label>
          <input
            id="children"
            v-model.number="form.children"
            type="number"
            min="0"
            max="20"
            class="form-input"
            placeholder="0"
          />
          <p class="form-hint">Number of children under 18</p>
        </div>
  
        <!-- Mobility -->
        <div class="form-group">
          <label for="mobility" class="form-label">
            Mobility considerations
            <span class="required">*</span>
          </label>
          <select
            id="mobility"
            v-model="form.mobility"
            class="form-select"
            required
          >
            <option value="" disabled>Select mobility level</option>
            <option value="none">No mobility limitations</option>
            <option value="limited">Some mobility limitations</option>
            <option value="wheelchair">Wheelchair or mobility device</option>
          </select>
          <p class="form-hint">This affects route recommendations for accessibility</p>
        </div>
  
        <!-- Vehicle -->
        <div class="form-group">
          <label for="vehicle" class="form-label">
            Vehicle access
            <span class="required">*</span>
          </label>
          <select
            id="vehicle"
            v-model="form.vehicle"
            class="form-select"
            required
          >
            <option value="" disabled>Select vehicle access</option>
            <option value="has_car">Have personal vehicle</option>
            <option value="needs_transport">Need transportation assistance</option>
          </select>
          <p class="form-hint">Whether your household has a vehicle for evacuation</p>
        </div>
  
        <!-- Pets -->
        <div class="form-group">
          <label class="form-checkbox-label">
            <input
              v-model="form.pets"
              type="checkbox"
              class="form-checkbox"
            />
            <span class="checkbox-text">We have pets to evacuate</span>
          </label>
          <p class="form-hint">Routes will prioritize pet-friendly shelters when available</p>
        </div>
  
        <!-- Notes -->
        <div class="form-group">
          <label for="notes" class="form-label">
            Additional notes
            <span class="optional">(optional)</span>
          </label>
          <textarea
            id="notes"
            v-model="form.notes"
            class="form-textarea"
            rows="3"
            placeholder="Any other considerations for your evacuation plan..."
          ></textarea>
        </div>
      </form>
  
      <!-- Validation message -->
      <div v-if="showValidationHint" class="validation-hint">
        <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
        </svg>
        <span>Please fill in all required fields to continue</span>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, watch, computed } from 'vue';
  import { useAppStore } from '../stores/appStore';
  import type { MobilityLevel, VehicleAccess } from '../types';
  
  const store = useAppStore();
  
  // Form state - initialize from store if available
  const form = reactive({
    adults: store.householdProfile?.adults ?? 1,
    children: store.householdProfile?.children ?? 0,
    mobility: (store.householdProfile?.mobility ?? '') as MobilityLevel | '',
    vehicle: (store.householdProfile?.vehicle ?? '') as VehicleAccess | '',
    pets: store.householdProfile?.pets ?? false,
    notes: store.householdProfile?.notes ?? '',
  });
  
  // Show validation hint when form is incomplete
  const showValidationHint = computed(() => {
    return !store.hasValidHousehold && (form.adults > 0 || form.mobility || form.vehicle);
  });
  
  // Update store whenever form changes
  watch(
    form,
    (newForm) => {
      // Only update store if we have valid required fields
      if (newForm.adults >= 1 && newForm.mobility && newForm.vehicle) {
        store.setHouseholdProfile({
          adults: newForm.adults,
          children: newForm.children || 0,
          mobility: newForm.mobility as MobilityLevel,
          vehicle: newForm.vehicle as VehicleAccess,
          pets: newForm.pets,
          notes: newForm.notes || undefined,
        });
      } else {
        // Clear profile if required fields missing
        store.clearHouseholdProfile();
      }
    },
    { deep: true, immediate: true }
  );
  </script>
  
  <style scoped>
  .household-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  
  .form-intro {
    padding: var(--space-4);
    background-color: var(--color-primary-50);
    border-radius: var(--radius-lg);
    border-left: 4px solid var(--color-primary-500);
  }
  
  .form-intro p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }
  
  .form-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .form-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .required {
    color: var(--color-risk-high);
    margin-left: var(--space-1);
  }
  
  .optional {
    color: var(--color-text-tertiary);
    font-weight: var(--font-weight-normal);
    margin-left: var(--space-1);
  }
  
  .form-input,
  .form-select,
  .form-textarea {
    padding: var(--space-3);
    font-size: var(--font-size-base);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }
  
  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px var(--color-primary-100);
  }
  
  .form-input:hover,
  .form-select:hover,
  .form-textarea:hover {
    border-color: var(--color-gray-300);
  }
  
  .form-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
    background-position: right var(--space-3) center;
    background-repeat: no-repeat;
    background-size: 20px;
    padding-right: var(--space-10);
  }
  
  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }
  
  .form-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    margin: 0;
  }
  
  /* Checkbox styling */
  .form-checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    cursor: pointer;
  }
  
  .form-checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    accent-color: var(--color-primary-600);
  }
  
  .checkbox-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
  }
  
  /* Validation hint */
  .validation-hint {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background-color: var(--color-gray-100);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
  
  .validation-hint .icon {
    width: 20px;
    height: 20px;
    color: var(--color-primary-500);
    flex-shrink: 0;
  }
  </style>