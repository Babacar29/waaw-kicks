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
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

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
