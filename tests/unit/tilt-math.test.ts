import { describe, it, expect } from 'vitest'
import { clamp, computeTiltFromPointer, computeTiltFromOrientation, MAX_TILT_DEG } from '../../lib/tilt-math'

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, -10, 10)).toBe(5)
  })

  it('clamps to the minimum', () => {
    expect(clamp(-20, -10, 10)).toBe(-10)
  })

  it('clamps to the maximum', () => {
    expect(clamp(20, -10, 10)).toBe(10)
  })
})

describe('computeTiltFromPointer', () => {
  it('returns zero tilt at the exact center', () => {
    expect(computeTiltFromPointer(0.5, 0.5)).toEqual({ x: 0, y: 0 })
  })

  it('tilts toward MAX_TILT_DEG/-MAX_TILT_DEG at the top-left corner', () => {
    const tilt = computeTiltFromPointer(0, 0)
    expect(tilt.x).toBe(MAX_TILT_DEG)
    expect(tilt.y).toBe(-MAX_TILT_DEG)
  })

  it('tilts toward -MAX_TILT_DEG/MAX_TILT_DEG at the bottom-right corner', () => {
    const tilt = computeTiltFromPointer(1, 1)
    expect(tilt.x).toBe(-MAX_TILT_DEG)
    expect(tilt.y).toBe(MAX_TILT_DEG)
  })

  it('clamps out-of-range fractions', () => {
    const tilt = computeTiltFromPointer(-1, -1)
    expect(tilt.x).toBe(MAX_TILT_DEG)
    expect(tilt.y).toBe(-MAX_TILT_DEG)
  })
})

describe('computeTiltFromOrientation', () => {
  it('returns zero tilt at the neutral holding angle (beta=45, gamma=0)', () => {
    expect(computeTiltFromOrientation(45, 0)).toEqual({ x: 0, y: 0 })
  })

  it('clamps extreme positive beta/gamma to MAX_TILT_DEG', () => {
    const tilt = computeTiltFromOrientation(200, 200)
    expect(tilt.x).toBe(MAX_TILT_DEG)
    expect(tilt.y).toBe(MAX_TILT_DEG)
  })

  it('clamps extreme negative beta/gamma to -MAX_TILT_DEG', () => {
    const tilt = computeTiltFromOrientation(-200, -200)
    expect(tilt.x).toBe(-MAX_TILT_DEG)
    expect(tilt.y).toBe(-MAX_TILT_DEG)
  })
})
