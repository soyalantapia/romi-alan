// Apariencia: tema claro/oscuro + acento elegible. Persistido en localStorage.
// El acento sólo toca el trío "primary". El default 'rosa' = los valores del
// tema (no se sobreescribe nada, así el modo oscuro mantiene su rosa claro).

export const ACCENTS = {
  rosa: { label: 'Rosa', dot: '#C68497' },
  durazno: { label: 'Durazno', dot: '#E0A07C', primary: '224 160 124', strong: '198 122 90', soft: '250 235 226' },
  salvia: { label: 'Salvia', dot: '#88A595', primary: '136 165 149', strong: '92 130 109', soft: '230 237 231' },
  lavanda: { label: 'Lavanda', dot: '#A496C4', primary: '164 150 196', strong: '124 108 168', soft: '237 232 247' },
  cielo: { label: 'Cielo', dot: '#8AA8C4', primary: '138 168 196', strong: '94 128 164', soft: '226 235 244' },
}

const KEY_THEME = 'romi-alan-theme'
const KEY_ACCENT = 'romi-alan-accent'

export function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'dark') root.setAttribute('data-theme', 'dark')
  else root.removeAttribute('data-theme')
}

export function applyAccent(name) {
  const a = ACCENTS[name]
  const s = document.documentElement.style
  if (!a || !a.primary) {
    // 'rosa' / desconocido → limpiar overrides y dejar que mande el tema
    s.removeProperty('--c-primary')
    s.removeProperty('--c-primary-strong')
    s.removeProperty('--c-primary-soft')
    return
  }
  s.setProperty('--c-primary', a.primary)
  s.setProperty('--c-primary-strong', a.strong)
  s.setProperty('--c-primary-soft', a.soft)
}

export const getTheme = () => localStorage.getItem(KEY_THEME) || 'light'
export const getAccent = () => localStorage.getItem(KEY_ACCENT) || 'rosa'

export function setTheme(theme) {
  localStorage.setItem(KEY_THEME, theme)
  applyTheme(theme)
}
export function setAccent(name) {
  localStorage.setItem(KEY_ACCENT, name)
  applyAccent(name)
}

export function bootstrapAppearance() {
  applyTheme(getTheme())
  applyAccent(getAccent())
}
