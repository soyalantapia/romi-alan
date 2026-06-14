// Set de íconos de línea, hechos a medida — calmos y consistentes (stroke 1.75).
function Svg({ children, className = 'h-6 w-6', strokeWidth = 1.75 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// ── Navegación ───────────────────────────────────────────────────────────────
export const IconInicio = (p) => (
  <Svg {...p}>
    <path d="M3.5 11.3 12 4l8.5 7.3" />
    <path d="M5.6 10.2V19a1 1 0 0 0 1 1H17.4a1 1 0 0 0 1-1v-8.8" />
    <path d="M9.7 20v-4.3a1 1 0 0 1 1-1h2.6a1 1 0 0 1 1 1V20" />
  </Svg>
)

export const IconCharlar = (p) => (
  <Svg {...p}>
    <path d="M20 11.4A6.4 6.4 0 0 1 13.6 18c-1 0-1.9-.2-2.8-.6L5 19l1.3-3.4A6.4 6.4 0 1 1 20 11.4Z" />
    <path d="M9.3 11.6h.01M12.6 11.6h.01M15.9 11.6h.01" strokeWidth="2" />
  </Svg>
)

export const IconCompras = (p) => (
  <Svg {...p}>
    <path d="M6.2 8h11.6l-1 10.2a1.8 1.8 0 0 1-1.8 1.6H9a1.8 1.8 0 0 1-1.8-1.6L6.2 8Z" />
    <path d="M9.2 8V6.6a2.8 2.8 0 0 1 5.6 0V8" />
  </Svg>
)

export const IconCaja = (p) => (
  <Svg {...p}>
    <path d="M4 8.2A2 2 0 0 1 6 6.2h10.5A1.5 1.5 0 0 1 18 7.7v.5" />
    <path d="M4 8.2v8.6a2 2 0 0 0 2 2h11.5a1.5 1.5 0 0 0 1.5-1.5v-2.1" />
    <path d="M20 11.2h-3.4a1.8 1.8 0 0 0 0 3.6H20a.6.6 0 0 0 .6-.6v-2.4a.6.6 0 0 0-.6-.6Z" />
  </Svg>
)

export const IconPlanes = (p) => (
  <Svg {...p}>
    <rect x="4" y="5.4" width="16" height="14.6" rx="2.4" />
    <path d="M4 9.6h16M8.4 3.6v3.4M15.6 3.6v3.4" />
    <path d="M12 12.4l.8 1.7 1.8.2-1.3 1.3.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.3 1.8-.2.8-1.7Z" />
  </Svg>
)

// ── Utilidad ─────────────────────────────────────────────────────────────────
export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)
export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="M5 12.5 9.5 17 19 7" />
  </Svg>
)
export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M5 7h14M9.2 7V5.6A1.6 1.6 0 0 1 10.8 4h2.4a1.6 1.6 0 0 1 1.6 1.6V7" />
    <path d="M7 7l.8 11.1a1 1 0 0 0 1 .9h6.4a1 1 0 0 0 1-.9L17 7" />
  </Svg>
)
export const IconEdit = (p) => (
  <Svg {...p}>
    <path d="M15.8 4.6 19.4 8.2 8.9 18.7 4.5 20l1.3-4.4L15.8 4.6Z" />
    <path d="M14.2 6.2 17.8 9.8" />
  </Svg>
)
export const IconX = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)
export const IconChevronRight = (p) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
)
export const IconChevronDown = (p) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
)
export const IconArrowUp = (p) => (
  <Svg {...p}>
    <path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" />
  </Svg>
)
export const IconArrowDown = (p) => (
  <Svg {...p}>
    <path d="M12 5v13M17.5 12.5 12 18l-5.5-5.5" />
  </Svg>
)
export const IconSparkle = (p) => (
  <Svg {...p}>
    <path d="M12 4l1.7 4.7L18.5 10l-4.8 1.3L12 16l-1.7-4.7L5.5 10l4.8-1.3L12 4Z" />
  </Svg>
)
export const IconCalendar = (p) => (
  <Svg {...p}>
    <rect x="4" y="5.4" width="16" height="14.6" rx="2.4" />
    <path d="M4 9.6h16M8.4 3.6v3.4M15.6 3.6v3.4" />
  </Svg>
)
export const IconMapPin = (p) => (
  <Svg {...p}>
    <path d="M12 21s6.5-5.4 6.5-10.3A6.5 6.5 0 0 0 5.5 10.7C5.5 15.6 12 21 12 21Z" />
    <circle cx="12" cy="10.6" r="2.3" />
  </Svg>
)
export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M15 12H4.5M9 7.5 4 12l5 4.5" />
    <path d="M13 4h4.5A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13" />
  </Svg>
)
export const IconSettings = (p) => (
  <Svg {...p}>
    <path d="M4 8h7M16 8h4M4 16h4M13 16h7" />
    <circle cx="13" cy="8" r="2.2" />
    <circle cx="9.5" cy="16" r="2.2" />
  </Svg>
)
export const IconEye = (p) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </Svg>
)
export const IconEyeOff = (p) => (
  <Svg {...p}>
    <path d="M4 4l16 16" />
    <path d="M9.6 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.3M6.2 7.6A15.8 15.8 0 0 0 2.5 12S6 18.5 12 18.5c1 0 1.9-.2 2.8-.5" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
)
export const IconHandHeart = (p) => (
  <Svg {...p}>
    <path d="M3 13.5l3-1 5 2 3.5-1a1.4 1.4 0 0 1 .6 2.6L11 18l-5-1.5H3" />
    <path d="M14.5 4.6c1-1 2.7-1 3.7 0s1 2.7 0 3.7L14.5 12 11 8.3c-1-1-1-2.7 0-3.7s2.7-1 3.5 0Z" />
  </Svg>
)
