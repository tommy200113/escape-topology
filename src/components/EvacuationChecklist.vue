<!--
  EvacuationChecklist.vue
  
  A preparation checklist for evacuation.
  Items are customized based on household profile.
-->

<template>
    <div class="evacuation-checklist">
      <div class="checklist-intro">
        <p>Use this checklist to prepare for evacuation. Check off items as you complete them.</p>
      </div>
      
      <div class="checklist-sections">
        <!-- Essential Items -->
        <div class="checklist-section">
          <h4 class="checklist-section-title">Essential Items</h4>
          <ul class="checklist-items">
            <li v-for="item in essentialItems" :key="item" class="checklist-item">
              <span class="checklist-checkbox"></span>
              <span class="checklist-text">{{ item }}</span>
            </li>
          </ul>
        </div>
        
        <!-- Documents -->
        <div class="checklist-section">
          <h4 class="checklist-section-title">Important Documents</h4>
          <ul class="checklist-items">
            <li v-for="item in documentItems" :key="item" class="checklist-item">
              <span class="checklist-checkbox"></span>
              <span class="checklist-text">{{ item }}</span>
            </li>
          </ul>
        </div>
        
        <!-- Vehicle -->
        <div v-if="household.vehicle === 'has_car'" class="checklist-section">
          <h4 class="checklist-section-title">Vehicle Preparation</h4>
          <ul class="checklist-items">
            <li v-for="item in vehicleItems" :key="item" class="checklist-item">
              <span class="checklist-checkbox"></span>
              <span class="checklist-text">{{ item }}</span>
            </li>
          </ul>
        </div>
        
        <!-- Family-specific -->
        <div v-if="household.children > 0" class="checklist-section">
          <h4 class="checklist-section-title">For Children</h4>
          <ul class="checklist-items">
            <li v-for="item in childrenItems" :key="item" class="checklist-item">
              <span class="checklist-checkbox"></span>
              <span class="checklist-text">{{ item }}</span>
            </li>
          </ul>
        </div>
        
        <!-- Pets -->
        <div v-if="household.pets" class="checklist-section">
          <h4 class="checklist-section-title">For Pets</h4>
          <ul class="checklist-items">
            <li v-for="item in petItems" :key="item" class="checklist-item">
              <span class="checklist-checkbox"></span>
              <span class="checklist-text">{{ item }}</span>
            </li>
          </ul>
        </div>
        
        <!-- Mobility needs -->
        <div v-if="household.mobility !== 'none'" class="checklist-section">
          <h4 class="checklist-section-title">Mobility & Medical</h4>
          <ul class="checklist-items">
            <li v-for="item in mobilityItems" :key="item" class="checklist-item">
              <span class="checklist-checkbox"></span>
              <span class="checklist-text">{{ item }}</span>
            </li>
          </ul>
        </div>
        
        <!-- Before Leaving -->
        <div class="checklist-section">
          <h4 class="checklist-section-title">Before Leaving Home</h4>
          <ul class="checklist-items">
            <li v-for="item in beforeLeavingItems" :key="item" class="checklist-item">
              <span class="checklist-checkbox"></span>
              <span class="checklist-text">{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import type { HouseholdProfile } from '../types';
  
  const props = defineProps<{
    household: HouseholdProfile;
  }>();
  
  // Essential items (always shown)
  const essentialItems = [
    'Water (1 gallon per person per day, 3-day supply)',
    'Non-perishable food and manual can opener',
    'First aid kit',
    'Flashlight and extra batteries',
    'Phone charger / portable battery pack',
    'Cash in small bills',
    'Change of clothes for each person',
    'Blankets or sleeping bags',
    'Basic toiletries',
    'Prescription medications (at least 7-day supply)',
  ];
  
  // Document items
  const documentItems = [
    'Photo ID / Driver\'s license',
    'Insurance policies (home, auto, health)',
    'Bank account information',
    'Medical records and prescriptions list',
    'Emergency contact list',
    'Copies of important documents in waterproof bag',
  ];
  
  // Vehicle items
  const vehicleItems = [
    'Keep gas tank at least half full',
    'Check tire pressure and spare tire',
    'Keep emergency kit in vehicle',
    'Know alternate routes to destination',
    'Charge phone before departing',
  ];
  
  // Children items
  const childrenItems = computed(() => {
    const items = [
      'Diapers, formula, baby food (if applicable)',
      'Comfort items (favorite toy, blanket)',
      'Games or activities for the journey',
      'Snacks and drinks',
      'Child identification information',
    ];
    return items;
  });
  
  // Pet items
  const petItems = [
    'Pet carrier or leash',
    'Pet food and water (3-day supply)',
    'Pet medications',
    'Vaccination records',
    'Recent photo of pet (in case of separation)',
    'Familiar items (toy, blanket) to reduce stress',
  ];
  
  // Mobility items
  const mobilityItems = computed(() => {
    const items = [
      'Wheelchair, walker, or mobility aids',
      'Extra batteries for medical devices',
      'List of medical conditions and medications',
      'Contact information for doctors',
    ];
    
    if (props.household.mobility === 'wheelchair') {
      items.push('Verify destination is wheelchair accessible');
      items.push('Plan for assistance loading/unloading equipment');
    }
    
    return items;
  });
  
  // Before leaving items
  const beforeLeavingItems = [
    'Turn off gas, electricity, and water if time permits',
    'Close all windows and doors',
    'Leave a note with your destination and contact info',
    'Take a quick video/photos of home for insurance',
    'Confirm all household members and pets are accounted for',
    'Check emergency broadcasts one more time before departing',
  ];
  </script>
  
  <style scoped>
  .evacuation-checklist {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .checklist-intro {
    padding: var(--space-3);
    background-color: var(--color-gray-50);
    border-radius: var(--radius-md);
  }
  
  .checklist-intro p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
  
  .checklist-sections {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .checklist-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .checklist-section-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
    padding-bottom: var(--space-1);
    border-bottom: 1px solid var(--color-border);
  }
  
  .checklist-items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .checklist-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
  }
  
  .checklist-checkbox {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-top: 2px;
    border: 2px solid var(--color-gray-300);
    border-radius: var(--radius-sm);
    background-color: var(--color-surface);
  }
  
  .checklist-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
  }
  </style>