/** @type {import('tailwindcss').Config} */

// ─────────────────────────────────────────────────────────────────────────────
//  TEMA CENTRALIZADO
//  Todos los colores viven como variables CSS en src/index.css (:root).
//  Acá sólo los referenciamos por nombre semántico. Para recolorar TODA la app,
//  se edita un único archivo: src/theme/palette.css  (lo importa index.css).
//  El formato "R G B" + <alpha-value> permite usar opacidades de Tailwind
//  (ej. bg-primary/10) sin perder el theming por variable.
// ─────────────────────────────────────────────────────────────────────────────
const withAlpha = (cssVar) => `rgb(var(${cssVar}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: withAlpha('--c-bg'),
        'bg-elev': withAlpha('--c-bg-elev'),
        surface: withAlpha('--c-surface'),
        'surface-2': withAlpha('--c-surface-2'),
        border: withAlpha('--c-border'),

        text: withAlpha('--c-text'),
        muted: withAlpha('--c-muted'),
        soft: withAlpha('--c-soft'),

        primary: withAlpha('--c-primary'),
        'primary-strong': withAlpha('--c-primary-strong'),
        'primary-soft': withAlpha('--c-primary-soft'),
        'on-primary': withAlpha('--c-on-primary'),

        accent: withAlpha('--c-accent'),
        'accent-strong': withAlpha('--c-accent-strong'),
        'accent-soft': withAlpha('--c-accent-soft'),

        // semánticos de la Caja (entra / sale plata) — calmos, no estridentes
        income: withAlpha('--c-income'),
        'income-soft': withAlpha('--c-income-soft'),
        expense: withAlpha('--c-expense'),
        'expense-soft': withAlpha('--c-expense-soft'),
        danger: withAlpha('--c-danger'),

        // colores de persona (se sobreescriben en runtime con perfiles.color)
        romi: withAlpha('--c-romi'),
        alan: withAlpha('--c-alan'),
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(58 52 49 / 0.04), 0 10px 30px -16px rgb(58 52 49 / 0.16)',
        'soft-sm': '0 1px 2px rgb(58 52 49 / 0.05), 0 4px 14px -10px rgb(58 52 49 / 0.16)',
        lift: '0 2px 6px rgb(58 52 49 / 0.05), 0 18px 44px -22px rgb(58 52 49 / 0.24)',
        ring: '0 0 0 4px rgb(var(--c-primary) / 0.18)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      transitionTimingFunction: {
        gentle: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'sheet-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'heartbeat': {
          '0%, 100%': { transform: 'scale(1)' },
          '12%': { transform: 'scale(1.08)' },
          '24%': { transform: 'scale(1)' },
          '36%': { transform: 'scale(1.05)' },
          '50%': { transform: 'scale(1)' },
        },
        'check-pop': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '60%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s ease both',
        'sheet-up': 'sheet-up 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
        heartbeat: 'heartbeat 1.6s ease-in-out',
        'check-pop': 'check-pop 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
