'use client'

import { useEffect, useState, type RefObject } from 'react'
import {
  computeTiltFromPointer,
  computeTiltFromOrientation,
  getOrientationPermissionAPI,
} from '../lib/tilt-math'

export interface UseTiltGestureResult {
  needsPermissionPrompt: boolean
  requestPermission: () => void
}

export function useTiltGesture<T extends HTMLElement>(ref: RefObject<T | null>): UseTiltGestureResult {
  const [needsPermissionPrompt, setNeedsPermissionPrompt] = useState(() => {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    return getOrientationPermissionAPI() !== null
  })
  const [orientationEnabled, setOrientationEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return getOrientationPermissionAPI() === null && typeof window.DeviceOrientationEvent !== 'undefined'
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let rafScheduled = false
    let pending = { x: 0, y: 0 }

    function writeTilt(x: number, y: number) {
      pending = { x, y }
      if (rafScheduled) return
      rafScheduled = true
      requestAnimationFrame(() => {
        el!.style.setProperty('--tilt-x', pending.x.toFixed(2))
        el!.style.setProperty('--tilt-y', pending.y.toFixed(2))
        rafScheduled = false
      })
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect()
      const tilt = computeTiltFromPointer(
        (e.clientX - rect.left) / rect.width,
        (e.clientY - rect.top) / rect.height
      )
      writeTilt(tilt.x, tilt.y)
    }

    function handleMouseLeave() {
      writeTilt(0, 0)
    }

    function handleTouchMove(e: TouchEvent) {
      const touch = e.touches[0]
      if (!touch) return
      const rect = el!.getBoundingClientRect()
      const tilt = computeTiltFromPointer(
        (touch.clientX - rect.left) / rect.width,
        (touch.clientY - rect.top) / rect.height
      )
      writeTilt(tilt.x, tilt.y)
    }

    function handleTouchEnd() {
      writeTilt(0, 0)
    }

    function handleOrientation(e: DeviceOrientationEvent) {
      if (e.beta === null || e.gamma === null) return
      const tilt = computeTiltFromOrientation(e.beta, e.gamma)
      writeTilt(tilt.x, tilt.y)
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)
    if (orientationEnabled) {
      window.addEventListener('deviceorientation', handleOrientation)
    } else {
      el.addEventListener('touchmove', handleTouchMove, { passive: true })
      el.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
      if (orientationEnabled) {
        window.removeEventListener('deviceorientation', handleOrientation)
      } else {
        el.removeEventListener('touchmove', handleTouchMove)
        el.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [ref, orientationEnabled])

  function requestPermission(): void {
    const permissionAPI = getOrientationPermissionAPI()
    if (!permissionAPI) return
    permissionAPI
      .requestPermission()
      .then((state) => {
        setNeedsPermissionPrompt(false)
        if (state === 'granted') setOrientationEnabled(true)
      })
      .catch(() => {
        setNeedsPermissionPrompt(false)
      })
  }

  return { needsPermissionPrompt, requestPermission }
}
