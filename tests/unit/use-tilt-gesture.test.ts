import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { RefObject } from 'react'
import { useTiltGesture } from '../../hooks/useTiltGesture'

function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

function mockBoundingRect(el: HTMLElement) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0,
    toJSON: () => {},
  })
}

describe('useTiltGesture', () => {
  let rafCallbacks: FrameRequestCallback[]

  beforeEach(() => {
    rafCallbacks = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    })
    mockMatchMedia(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  function flushRaf() {
    const callbacks = rafCallbacks
    rafCallbacks = []
    callbacks.forEach((cb) => cb(0))
  }

  it('writes tilt custom properties on mousemove', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    mockBoundingRect(el)
    const ref = { current: el } as RefObject<HTMLDivElement | null>

    renderHook(() => useTiltGesture(ref))

    act(() => {
      el.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 0, bubbles: true }))
    })
    flushRaf()

    expect(el.style.getPropertyValue('--tilt-x')).not.toBe('')
    expect(el.style.getPropertyValue('--tilt-y')).not.toBe('')
  })

  it('resets tilt to 0 on mouseleave', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    mockBoundingRect(el)
    const ref = { current: el } as RefObject<HTMLDivElement | null>

    renderHook(() => useTiltGesture(ref))

    act(() => {
      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    })
    flushRaf()

    expect(el.style.getPropertyValue('--tilt-x')).toBe('0.00')
    expect(el.style.getPropertyValue('--tilt-y')).toBe('0.00')
  })

  it('does not attach any listener when prefers-reduced-motion is set', () => {
    mockMatchMedia(true)
    const el = document.createElement('div')
    document.body.appendChild(el)
    const addSpy = vi.spyOn(el, 'addEventListener')
    const ref = { current: el } as RefObject<HTMLDivElement | null>

    renderHook(() => useTiltGesture(ref))

    expect(addSpy).not.toHaveBeenCalled()
  })

  it('removes on unmount exactly the listeners it added', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    mockBoundingRect(el)
    const addSpy = vi.spyOn(el, 'addEventListener')
    const removeSpy = vi.spyOn(el, 'removeEventListener')
    const ref = { current: el } as RefObject<HTMLDivElement | null>

    const { unmount } = renderHook(() => useTiltGesture(ref))
    unmount()

    const addedEvents = addSpy.mock.calls.map((call) => call[0]).sort()
    const removedEvents = removeSpy.mock.calls.map((call) => call[0]).sort()
    expect(removedEvents).toEqual(addedEvents)
  })

  it('does not attach touch listeners when orientation is enabled without a permission prompt', () => {
    const originalDeviceOrientationEvent = window.DeviceOrientationEvent
    // Android-style: DeviceOrientationEvent exists but has no requestPermission,
    // so orientationEnabled becomes true immediately with no prompt needed.
    // @ts-expect-error - simplified mock for test purposes
    window.DeviceOrientationEvent = function DeviceOrientationEvent() {}

    const el = document.createElement('div')
    document.body.appendChild(el)
    mockBoundingRect(el)
    const addSpy = vi.spyOn(el, 'addEventListener')
    const ref = { current: el } as RefObject<HTMLDivElement | null>

    renderHook(() => useTiltGesture(ref))

    const addedEvents = addSpy.mock.calls.map((call) => call[0])
    expect(addedEvents).toContain('mousemove')
    expect(addedEvents).toContain('mouseleave')
    expect(addedEvents).not.toContain('touchmove')
    expect(addedEvents).not.toContain('touchend')

    window.DeviceOrientationEvent = originalDeviceOrientationEvent
  })

  it('handles requestPermission denial by hiding the prompt and never attaching orientation listener', async () => {
    const originalDeviceOrientationEvent = window.DeviceOrientationEvent
    const requestPermission = vi.fn().mockResolvedValue('denied')
    // @ts-expect-error - simplified mock for test purposes
    window.DeviceOrientationEvent = function DeviceOrientationEvent() {}
    // @ts-expect-error - simplified mock for test purposes
    window.DeviceOrientationEvent.requestPermission = requestPermission

    const el = document.createElement('div')
    document.body.appendChild(el)
    mockBoundingRect(el)
    const addSpy = vi.spyOn(el, 'addEventListener')
    const windowAddSpy = vi.spyOn(window, 'addEventListener')
    const ref = { current: el } as RefObject<HTMLDivElement | null>

    const { result } = renderHook(() => useTiltGesture(ref))
    expect(result.current.needsPermissionPrompt).toBe(true)

    await act(async () => {
      result.current.requestPermission()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.needsPermissionPrompt).toBe(false)
    const windowEvents = windowAddSpy.mock.calls.map((call) => call[0])
    expect(windowEvents).not.toContain('deviceorientation')
    void addSpy

    window.DeviceOrientationEvent = originalDeviceOrientationEvent
  })

  it('handles requestPermission rejection gracefully', async () => {
    const originalDeviceOrientationEvent = window.DeviceOrientationEvent
    const requestPermission = vi.fn().mockRejectedValue(new Error('denied by user'))
    // @ts-expect-error - simplified mock for test purposes
    window.DeviceOrientationEvent = function DeviceOrientationEvent() {}
    // @ts-expect-error - simplified mock for test purposes
    window.DeviceOrientationEvent.requestPermission = requestPermission

    const el = document.createElement('div')
    document.body.appendChild(el)
    mockBoundingRect(el)
    const ref = { current: el } as RefObject<HTMLDivElement | null>

    const { result } = renderHook(() => useTiltGesture(ref))
    expect(result.current.needsPermissionPrompt).toBe(true)

    await act(async () => {
      result.current.requestPermission()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.needsPermissionPrompt).toBe(false)

    window.DeviceOrientationEvent = originalDeviceOrientationEvent
  })
})
