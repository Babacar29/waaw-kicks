import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import React from 'react'
import { Reveal } from '../../components/Reveal'

function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

function mockIntersectionObserver() {
  let capturedCallback: IntersectionObserverCallback = () => {}

  class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      capturedCallback = callback
    }
    observe = vi.fn()
    disconnect = vi.fn()
    unobserve = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds = [0.1]
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

  return {
    trigger: (isIntersecting: boolean) =>
      act(() => {
        capturedCallback(
          [{ isIntersecting } as IntersectionObserverEntry],
          new MockIntersectionObserver(() => {}) as unknown as IntersectionObserver,
        )
      }),
  }
}

describe('Reveal', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('renders visible immediately when prefers-reduced-motion is active', () => {
    mockMatchMedia(true)
    mockIntersectionObserver()

    render(React.createElement(Reveal, { children: React.createElement('p', {}, 'Hello') }))

    expect(screen.getByText('Hello').parentElement?.className).toContain('opacity-100')
  })

  it('starts hidden and becomes visible once IntersectionObserver reports intersection', () => {
    mockMatchMedia(false)
    const { trigger } = mockIntersectionObserver()

    render(React.createElement(Reveal, { children: React.createElement('p', {}, 'Hello') }))

    expect(screen.getByText('Hello').parentElement?.className).toContain('opacity-0')

    trigger(true)

    expect(screen.getByText('Hello').parentElement?.className).toContain('opacity-100')
  })

  it('renders visible immediately when IntersectionObserver is unavailable', () => {
    mockMatchMedia(false)
    vi.stubGlobal('IntersectionObserver', undefined)

    render(React.createElement(Reveal, { children: React.createElement('p', {}, 'Hello') }))

    expect(screen.getByText('Hello').parentElement?.className).toContain('opacity-100')
  })
})
