import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from './icons'

// ── Bottom sheet (en celular) / modal centrado (en desktop) ──────────────────
export function Sheet({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  const panelRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => {
      const el = panelRef.current?.querySelector(
        'input,textarea,select,[data-autofocus]'
      )
      el?.focus()
    }, 60)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      clearTimeout(t)
    }
  }, [open, onClose])

  if (!open) return null
  // Portal a <body>: así el overlay fixed se mide contra la pantalla y no contra
  // el `.page` (que tiene transform por la animación y rompía el posicionamiento).
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-text/30 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`relative flex w-full ${maxWidth} max-h-[92svh] flex-col overflow-hidden
          rounded-t-4xl sm:rounded-4xl bg-surface shadow-lift animate-sheet-up`}
      >
        {/* header fijo */}
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border sm:hidden" />
          <div className="flex items-center justify-between pb-1">
            <h2 className="font-display text-2xl font-medium tracking-tight">{title}</h2>
            <button className="icon-btn h-9 w-9" onClick={onClose} aria-label="Cerrar">
              <IconX className="h-5 w-5" />
            </button>
          </div>
        </div>
        {/* cuerpo scrolleable */}
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Confirmación de borrado ──────────────────────────────────────────────────
export function ConfirmDialog({
  open,
  title = '¿Eliminar?',
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 bg-text/35 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-xs rounded-4xl bg-surface p-6 text-center shadow-lift animate-scale-in">
        <h3 className="font-display text-xl font-medium">{title}</h3>
        {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
        <div className="mt-6 flex flex-col gap-2">
          <button
            className="btn bg-danger text-white hover:brightness-105"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            data-autofocus
          >
            {confirmLabel}
          </button>
          <button className="btn-ghost" onClick={onClose}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Estado vacío ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, hint, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center animate-fade-up">
      {Icon ? (
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-surface-2 text-soft">
          <Icon className="h-8 w-8" />
        </div>
      ) : null}
      <p className="font-display text-lg text-text">{title}</p>
      {hint ? <p className="mt-1.5 max-w-[17rem] text-sm leading-relaxed text-muted">{hint}</p> : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  )
}

// ── Esqueletos de carga ──────────────────────────────────────────────────────
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-4 ${className}`}>
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton mt-3 h-3 w-3/4" />
    </div>
  )
}
export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// ── Segmented control (tabs) ─────────────────────────────────────────────────
export function Segmented({ value, onChange, options }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          data-active={value === o.value}
          className="seg-item"
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.count != null ? <span className="ml-1.5 opacity-60">{o.count}</span> : null}
        </button>
      ))}
    </div>
  )
}

// ── Switch ───────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label, id }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3"
    >
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? 'bg-primary-strong' : 'bg-border'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-gentle ${
            checked ? 'translate-x-[1.25rem]' : 'translate-x-0'
          }`}
        />
      </span>
      {label ? <span className="text-sm text-text">{label}</span> : null}
    </button>
  )
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
