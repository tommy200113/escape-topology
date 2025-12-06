/**
 * useRouteAnimation.ts
 * 
 * Composable for animating route line drawing on the map.
 * 
 * Features:
 * - Smooth draw-in animation from home to shelter
 * - Respects prefers-reduced-motion
 * - Cancellable animations
 * - Configurable duration and easing
 */

import { ref, computed } from 'vue';
import type { RouteOption } from '../types';

// Animation configuration
const ANIMATION_CONFIG = {
  duration: 500, // ms
  easing: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, // easeInOutQuad
};

// Check for reduced motion preference
const prefersReducedMotion = computed(() => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
});

// Track current animation
let currentAnimationId: number | null = null;
let currentRouteId: string | null = null;

// Animation progress (0 to 1)
const animationProgress = ref(1);
const isAnimating = ref(false);

/**
 * Get the animated portion of a route's geometry
 */
export function getAnimatedGeometry(
  route: RouteOption,
  progress: number
): RouteOption['geometry'] {
  if (progress >= 1 || prefersReducedMotion.value) {
    return route.geometry;
  }
  
  if (progress <= 0 || route.geometry.length < 2) {
    return [route.geometry[0]];
  }
  
  // Calculate total route length
  const segments: { start: number; end: number; length: number }[] = [];
  let totalLength = 0;
  
  for (let i = 0; i < route.geometry.length - 1; i++) {
    const p1 = route.geometry[i];
    const p2 = route.geometry[i + 1];
    const length = Math.sqrt(
      Math.pow(p2.lng - p1.lng, 2) + Math.pow(p2.lat - p1.lat, 2)
    );
    segments.push({ start: totalLength, end: totalLength + length, length });
    totalLength += length;
  }
  
  // Find how far along we should draw
  const targetLength = totalLength * progress;
  const result: RouteOption['geometry'] = [route.geometry[0]];
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    
    if (targetLength >= segment.end) {
      // Include full segment
      result.push(route.geometry[i + 1]);
    } else if (targetLength > segment.start) {
      // Partial segment - interpolate
      const segmentProgress = (targetLength - segment.start) / segment.length;
      const p1 = route.geometry[i];
      const p2 = route.geometry[i + 1];
      
      result.push({
        lat: p1.lat + (p2.lat - p1.lat) * segmentProgress,
        lng: p1.lng + (p2.lng - p1.lng) * segmentProgress,
        elevation: p1.elevation !== undefined && p2.elevation !== undefined
          ? p1.elevation + (p2.elevation - p1.elevation) * segmentProgress
          : undefined,
      });
      break;
    } else {
      break;
    }
  }
  
  return result;
}

/**
 * Start animating a route
 */
export function animateRoute(
  routeId: string,
  onProgress: (progress: number) => void,
  onComplete?: () => void
): void {
  // Cancel any existing animation
  cancelAnimation();
  
  // Skip animation if reduced motion is preferred
  if (prefersReducedMotion.value) {
    animationProgress.value = 1;
    onProgress(1);
    onComplete?.();
    return;
  }
  
  currentRouteId = routeId;
  isAnimating.value = true;
  animationProgress.value = 0;
  
  const startTime = performance.now();
  const duration = ANIMATION_CONFIG.duration;
  
  function tick(currentTime: number): void {
    if (currentRouteId !== routeId) {
      // Animation was cancelled or replaced
      return;
    }
    
    const elapsed = currentTime - startTime;
    const linearProgress = Math.min(elapsed / duration, 1);
    const easedProgress = ANIMATION_CONFIG.easing(linearProgress);
    
    animationProgress.value = easedProgress;
    onProgress(easedProgress);
    
    if (linearProgress < 1) {
      currentAnimationId = requestAnimationFrame(tick);
    } else {
      isAnimating.value = false;
      currentAnimationId = null;
      currentRouteId = null;
      onComplete?.();
    }
  }
  
  currentAnimationId = requestAnimationFrame(tick);
}

/**
 * Cancel the current animation
 */
export function cancelAnimation(): void {
  if (currentAnimationId !== null) {
    cancelAnimationFrame(currentAnimationId);
    currentAnimationId = null;
  }
  currentRouteId = null;
  isAnimating.value = false;
  animationProgress.value = 1;
}

/**
 * Composable hook
 */
export function useRouteAnimation() {
  return {
    animationProgress,
    isAnimating,
    prefersReducedMotion,
    animateRoute,
    cancelAnimation,
    getAnimatedGeometry,
  };
}