export const MAX_TILT_DEG = 12

const ORIENTATION_NEUTRAL_BETA = 45
const ORIENTATION_RANGE_DEG = 45

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Converts a pointer position relative to an element's bounding box
 * (px/py as 0..1 fractions of width/height) into a clamped tilt angle.
 */
export function computeTiltFromPointer(px: number, py: number): { x: number; y: number } {
  const offsetX = px - 0.5
  const offsetY = py - 0.5
  const x = clamp(offsetY * -2 * MAX_TILT_DEG, -MAX_TILT_DEG, MAX_TILT_DEG)
  const y = clamp(offsetX * 2 * MAX_TILT_DEG, -MAX_TILT_DEG, MAX_TILT_DEG)
  return {
    x: x + 0, // Convert -0 to +0
    y: y + 0, // Convert -0 to +0
  }
}

/**
 * Converts raw DeviceOrientationEvent angles (degrees) into a clamped tilt
 * angle, treating a phone held upright (~45° beta) as neutral.
 */
export function computeTiltFromOrientation(beta: number, gamma: number): { x: number; y: number } {
  const normalizedBeta = clamp(beta - ORIENTATION_NEUTRAL_BETA, -ORIENTATION_RANGE_DEG, ORIENTATION_RANGE_DEG)
  const normalizedGamma = clamp(gamma, -ORIENTATION_RANGE_DEG, ORIENTATION_RANGE_DEG)
  return {
    x: (normalizedBeta / ORIENTATION_RANGE_DEG) * MAX_TILT_DEG,
    y: (normalizedGamma / ORIENTATION_RANGE_DEG) * MAX_TILT_DEG,
  }
}

interface OrientationPermissionAPI {
  requestPermission: () => Promise<'granted' | 'denied'>
}

/**
 * Returns the iOS 13+ DeviceOrientationEvent.requestPermission API when
 * present, or null on platforms where orientation access needs no explicit
 * permission (or isn't supported at all).
 */
export function getOrientationPermissionAPI(): OrientationPermissionAPI | null {
  const ctor = window.DeviceOrientationEvent as unknown as Partial<OrientationPermissionAPI> | undefined
  if (ctor && typeof ctor.requestPermission === 'function') {
    return ctor as OrientationPermissionAPI
  }
  return null
}
