'use client'

import { useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import { useTiltGesture } from '../hooks/useTiltGesture'

interface ProductTiltProps {
  src: string
  alt: string
}

const CONTAINER_STYLE = {
  perspective: '800px',
  '--tilt-x': '0',
  '--tilt-y': '0',
} as CSSProperties

export function ProductTilt({ src, alt }: ProductTiltProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { needsPermissionPrompt, requestPermission } = useTiltGesture(containerRef)

  return (
    <div ref={containerRef} className="relative aspect-square" style={CONTAINER_STYLE}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 rounded-full bg-waaw-yellow/20 blur-3xl"
        style={{
          transform: 'translate3d(calc(var(--tilt-y) * -3px), calc(var(--tilt-x) * 3px), 0)',
          transition: 'transform 150ms ease-out',
        }}
      />

      <div className="absolute inset-0 overflow-hidden rounded-3xl bg-waaw-surface-2">
        <div
          className="relative h-full w-full will-change-transform"
          style={{
            transform:
              'rotateX(calc(var(--tilt-x) * 1deg)) rotateY(calc(var(--tilt-y) * 1deg)) scale(1.02)',
            transformStyle: 'preserve-3d',
            transition: 'transform 150ms ease-out',
          }}
        >
          <Image src={src} alt={alt} fill priority className="object-cover" />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl mix-blend-soft-light"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5), transparent 60%)',
            transform: 'translate3d(calc(var(--tilt-y) * -6px), calc(var(--tilt-x) * -6px), 0)',
            transition: 'transform 150ms ease-out',
          }}
        />
      </div>

      {needsPermissionPrompt && (
        <button
          type="button"
          onClick={requestPermission}
          className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-display uppercase tracking-widest text-white/80 backdrop-blur-sm"
        >
          Activer vue 3D
        </button>
      )}
    </div>
  )
}
