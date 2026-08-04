'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type RevealVariant = 'up' | 'left' | 'right'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  variant?: RevealVariant
}

const hiddenClasses: Record<RevealVariant, string> = {
  up: 'translate-y-4 opacity-0',
  left: '-translate-x-4 opacity-0',
  right: 'translate-x-4 opacity-0',
}

export function Reveal({ children, className = '', delay = 0, variant = 'up' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  // Default to visible so SSR output and the very first client render never hide
  // content (avoids a flash-of-invisible-content if JS is slow to hydrate). The
  // effect below flips this to hidden client-side only when we're certain an
  // IntersectionObserver-driven reveal will actually run.
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    setVisible(false)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'translate-x-0 translate-y-0 opacity-100' : hiddenClasses[variant]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
