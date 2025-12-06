<!--
  RouteCard.vue
  
  Displays a single route option as a selectable card.
  Shows adjusted ETA with household constraint indicators.
  Displays fire zone exposure warnings.
-->

<template>
  <button
    class="route-card"
    :class="[
      `route-card--${route.label.toLowerCase()}`,
      { 
        'route-card--selected': selected,
        'route-card--blocked': route.isBlocked 
      }
    ]"
    @click="$emit('select', route.id)"
  >
    <!-- Blocked banner -->
    <div v-if="route.isBlocked" class="blocked-banner">
      <svg class="blocked-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
      <span>Route Blocked - Active Fire</span>
    </div>
    
    <!-- Route label badge -->
    <div class="route-badge" :class="`route-badge--${route.label.toLowerCase()}`">
      {{ labelText }}
    </div>
    
    <!-- Route info -->
    <div class="route-info">
      <div class="route-destination">
        <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" />
        </svg>
        <span class="destination-name">{{ route.endsAtShelterName }}</span>
      </div>
      
      <div class="route-stats">
        <div class="stat">
          <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd" />
          </svg>
          <span>{{ route.etaMinutesRange[0] }}–{{ route.etaMinutesRange[1] }} min</span>
          <!-- Constraint indicator -->
          <span v-if="hasConstraints" class="constraint-badge" :title="constraintTooltip">
            <svg class="constraint-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
            </svg>
          </span>
        </div>
        <div class="stat">
          <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
          </svg>
          <span>{{ route.distanceKm }} km</span>
        </div>
      </div>
      
      <!-- Fire exposure indicator -->
      <div v-if="fireExposureSummary && fireExposureSummary.level !== 'safe'" class="fire-exposure">
        <div 
          class="fire-exposure-badge"
          :style="{ backgroundColor: fireExposureSummary.color }"
        >
          <svg class="fire-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />
          </svg>
          <span>{{ fireExposureSummary.label }}</span>
        </div>
        <span v-if="route.fireExposure" class="fire-exposure-detail">
          {{ formatExposureDetail(route.fireExposure) }}
        </span>
      </div>
      
      <!-- Constraint explanations (shown when card is selected) -->
      <div v-if="selected && hasConstraints" class="constraint-details">
        <p v-for="(constraint, idx) in route.householdConstraints" :key="idx" class="constraint-item">
          {{ constraint }}
        </p>
      </div>
      
      <!-- Fire warning details (shown when card is selected) -->
      <div v-if="selected && route.fireExposure?.isExposed" class="fire-details">
        <p class="fire-detail-title">Fire Zone Exposure:</p>
        <ul class="fire-detail-list">
          <li v-if="route.fireExposure.exposureByLevel.active > 0" class="fire-detail-item fire-detail--active">
            Active fire: {{ route.fireExposure.exposureByLevel.active.toFixed(1) }} km
          </li>
          <li v-if="route.fireExposure.exposureByLevel.immediate > 0" class="fire-detail-item fire-detail--immediate">
            Immediate threat: {{ route.fireExposure.exposureByLevel.immediate.toFixed(1) }} km
          </li>
          <li v-if="route.fireExposure.exposureByLevel.warning > 0" class="fire-detail-item fire-detail--warning">
            Warning zone: {{ route.fireExposure.exposureByLevel.warning.toFixed(1) }} km
          </li>
        </ul>
        <p class="fire-detail-percent">
          {{ route.fireExposure.exposurePercent }}% of route exposed
        </p>
      </div>
    </div>
    
    <!-- Risk indicator -->
    <div class="route-risk">
      <div class="risk-bar">
        <div 
          class="risk-fill" 
          :style="{ width: `${Math.min(route.riskScore * 100, 100)}%` }"
          :class="riskClass"
        ></div>
      </div>
      <span class="risk-label">{{ riskLabel }}</span>
    </div>
    
    <!-- Selection indicator -->
    <div class="route-check" :class="{ 'route-check--visible': selected }">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
      </svg>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RouteOption, RouteFireExposure } from '../types';
import { getExposureSummary } from '../utils/fireExposure';

const props = defineProps<{
  route: RouteOption;
  selected: boolean;
}>();

defineEmits<{
  select: [id: string];
}>();

// Label display text
const labelText = computed(() => {
  if (props.route.isBlocked) {
    return 'Blocked';
  }
  switch (props.route.label) {
    case 'PRIMARY':
      return 'Recommended';
    case 'ALTERNATE':
      return 'Alternate';
    case 'LAST_RESORT':
      return 'Last Resort';
    default:
      return props.route.label;
  }
});

// Check if route has household constraints
const hasConstraints = computed(() => {
  return props.route.householdConstraints && props.route.householdConstraints.length > 0;
});

// Tooltip for constraint indicator
const constraintTooltip = computed(() => {
  if (!hasConstraints.value) return '';
  return 'Time adjusted for household needs:\n' + props.route.householdConstraints!.join('\n');
});

// Fire exposure summary
const fireExposureSummary = computed(() => {
  if (!props.route.fireExposure) return null;
  return getExposureSummary(props.route.fireExposure);
});

// Format exposure detail text
function formatExposureDetail(exposure: RouteFireExposure): string {
  if (exposure.totalExposedKm > 0) {
    return `${exposure.totalExposedKm.toFixed(1)} km through hazard zones`;
  }
  return '';
}

// Risk level classification
const riskClass = computed(() => {
  const score = props.route.riskScore;
  if (props.route.isBlocked) return 'risk--blocked';
  if (score < 0.3) return 'risk--low';
  if (score < 0.5) return 'risk--moderate';
  if (score < 0.7) return 'risk--high';
  return 'risk--severe';
});

const riskLabel = computed(() => {
  if (props.route.isBlocked) return 'Blocked';
  const score = props.route.riskScore;
  if (score < 0.3) return 'Lower risk';
  if (score < 0.5) return 'Moderate';
  if (score < 0.7) return 'Elevated';
  return 'High risk';
});
</script>

<style scoped>
.route-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.route-card:hover {
  border-color: var(--color-gray-300);
  background-color: var(--color-gray-50);
}

.route-card--selected {
  border-color: var(--color-primary-500);
  background-color: var(--color-primary-50);
}

.route-card--blocked {
  border-color: #fca5a5;
  background-color: #fef2f2;
  opacity: 0.9;
}

.route-card--blocked:hover {
  border-color: #f87171;
  background-color: #fee2e2;
}

/* Blocked banner */
.blocked-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: #dc2626;
  color: white;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-1);
}

.blocked-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Route badge */
.route-badge {
  display: inline-flex;
  align-self: flex-start;
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

.route-card--blocked .route-badge {
  background-color: #fee2e2;
  color: #991b1b;
}

/* Route info */
.route-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.route-destination {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.route-destination .icon {
  width: 18px;
  height: 18px;
  color: var(--color-primary-500);
  flex-shrink: 0;
}

.route-card--blocked .route-destination .icon {
  color: #dc2626;
}

.destination-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.route-stats {
  display: flex;
  gap: var(--space-4);
}

.stat {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.stat .icon {
  width: 16px;
  height: 16px;
  color: var(--color-gray-400);
}

/* Constraint indicator */
.constraint-badge {
  display: inline-flex;
  align-items: center;
  margin-left: var(--space-1);
  color: var(--color-primary-500);
  cursor: help;
}

.constraint-icon {
  width: 14px;
  height: 14px;
}

/* Fire exposure indicator */
.fire-exposure {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.fire-exposure-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: white;
}

.fire-icon {
  width: 12px;
  height: 12px;
}

.fire-exposure-detail {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

/* Constraint details (shown when selected) */
.constraint-details {
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-primary-50);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-primary-400);
}

.constraint-item {
  font-size: var(--font-size-xs);
  color: var(--color-primary-700);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

.constraint-item + .constraint-item {
  margin-top: var(--space-1);
}

/* Fire details (shown when selected) */
.fire-details {
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: #fef3c7;
  border-radius: var(--radius-md);
  border-left: 3px solid #f59e0b;
}

.fire-detail-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: #92400e;
  margin: 0 0 var(--space-1) 0;
}

.fire-detail-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.fire-detail-item {
  font-size: var(--font-size-xs);
  color: #78350f;
  padding-left: var(--space-3);
  position: relative;
  line-height: var(--line-height-relaxed);
}

.fire-detail-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.fire-detail--active::before {
  background-color: #dc2626;
}

.fire-detail--immediate::before {
  background-color: #f97316;
}

.fire-detail--warning::before {
  background-color: #eab308;
}

.fire-detail-percent {
  font-size: 10px;
  color: #a16207;
  margin: var(--space-1) 0 0 0;
}

/* Risk indicator */
.route-risk {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.risk-bar {
  flex: 1;
  height: 6px;
  background-color: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.risk-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

.risk--low {
  background-color: var(--color-risk-low);
}

.risk--moderate {
  background-color: var(--color-risk-moderate);
}

.risk--high {
  background-color: var(--color-risk-high);
}

.risk--severe {
  background-color: var(--color-risk-severe);
}

.risk--blocked {
  background-color: #dc2626;
}

.risk-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

/* Selection check */
.route-check {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  width: 24px;
  height: 24px;
  color: var(--color-primary-500);
  opacity: 0;
  transform: scale(0.8);
  transition: all var(--transition-fast);
}

.route-check--visible {
  opacity: 1;
  transform: scale(1);
}

.route-check svg {
  width: 100%;
  height: 100%;
}
</style>