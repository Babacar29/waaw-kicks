import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const inputBase =
  'w-full rounded-xl border border-white/10 bg-waaw-surface-2 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-waaw-yellow/60 focus:ring-2 focus:ring-waaw-yellow/15'

interface FieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  children: ReactNode
}

export function Field({ label, htmlFor, required, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium uppercase tracking-wide text-white/50">
        {label}
        {required && <span className="ml-1 text-waaw-yellow">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-white/35">{hint}</p>}
    </div>
  )
}

export function AdminInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ''}`} />
}

export function AdminTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} min-h-28 resize-y ${props.className ?? ''}`} />
}

export function AdminSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${inputBase} appearance-none bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20stroke%3D%22%23ffffff88%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M4%206l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat pr-9 ${props.className ?? ''}`}
    />
  )
}

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
}

const variantClasses: Record<NonNullable<AdminButtonProps['variant']>, string> = {
  primary: 'bg-waaw-yellow text-waaw-black hover:brightness-110 disabled:hover:brightness-100',
  secondary: 'border border-white/15 text-white hover:border-white/35 hover:bg-white/5',
  danger: 'bg-waaw-red text-white hover:brightness-110',
  ghost: 'text-white/60 hover:text-white hover:bg-white/5',
}

export function AdminButton({ variant = 'primary', loading, disabled, children, className, ...rest }: AdminButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-display text-sm uppercase tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className ?? ''}`}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}

const statusStyles: Record<string, string> = {
  nouvelle: 'bg-waaw-yellow/15 text-waaw-yellow border-waaw-yellow/30',
  confirmee: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
  livree: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  annulee: 'bg-waaw-red/15 text-red-300 border-waaw-red/30',
  actif: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  inactif: 'bg-white/10 text-white/50 border-white/15',
  stock: 'bg-waaw-red/15 text-red-300 border-waaw-red/30',
}

export function AdminBadge({ tone = 'inactif', children }: { tone?: keyof typeof statusStyles; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${statusStyles[tone] ?? statusStyles.inactif}`}
    >
      {children}
    </span>
  )
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-waaw-surface ${className ?? ''}`}>{children}</div>
  )
}

export function AdminBackLink({ href, label = 'Retour' }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
    >
      <ArrowLeft size={15} />
      {label}
    </Link>
  )
}

export function AdminPageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
}: {
  title: string
  description?: string
  actions?: ReactNode
  backHref?: string
  backLabel?: string
}) {
  return (
    <div className="mb-6">
      {backHref && <AdminBackLink href={backHref} label={backLabel} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-wide text-white sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-white/50">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
}

export function AdminEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-waaw-surface/50 px-6 py-16 text-center">
      <p className="font-display text-lg uppercase tracking-wide text-white/70">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-white/40">{description}</p>}
    </div>
  )
}

export function AdminAlert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-waaw-red/30 bg-waaw-red/10 px-3.5 py-2.5 text-sm text-red-300">
      {children}
    </p>
  )
}
