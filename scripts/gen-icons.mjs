// Genera los íconos PNG de la PWA a partir del corazón de la marca.
//   node scripts/gen-icons.mjs
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public')

const ROMI = '#CE8A99'
const ALAN = '#7FA08E'
const BG = '#FAF5F2'

const HEART =
  'M50 86.5 C 50 86.5, 13 62 13 36.2 C 13 22.6 23.4 14.5 34.2 14.5 ' +
  'C 42.6 14.5 47.7 20.4 50 26 C 52.3 20.4 57.4 14.5 65.8 14.5 ' +
  'C 76.6 14.5 87 22.6 87 36.2 C 87 62 50 86.5 50 86.5 Z'

/** Construye un SVG cuadrado con el corazón centrado. */
function svg({ size, k = 1, rounded = 0 }) {
  const radius = rounded ? `rx="${rounded}" ry="${rounded}"` : ''
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0.2" x2="1" y2="0.85">
      <stop offset="0%" stop-color="${ROMI}"/>
      <stop offset="40%" stop-color="${ROMI}"/>
      <stop offset="60%" stop-color="${ALAN}"/>
      <stop offset="100%" stop-color="${ALAN}"/>
    </linearGradient>
    <radialGradient id="glowA" cx="0.18" cy="0.0" r="0.9">
      <stop offset="0%" stop-color="${ROMI}" stop-opacity="0.20"/>
      <stop offset="55%" stop-color="${ROMI}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="1" cy="0.05" r="0.9">
      <stop offset="0%" stop-color="${ALAN}" stop-opacity="0.18"/>
      <stop offset="50%" stop-color="${ALAN}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" ${radius} fill="${BG}"/>
  <rect width="100" height="100" ${radius} fill="url(#glowA)"/>
  <rect width="100" height="100" ${radius} fill="url(#glowB)"/>
  <g transform="translate(50 50.5) scale(${k}) translate(-50 -50.5)">
    <path d="${HEART}" fill="url(#g)"/>
  </g>
</svg>`
}

const png = (markup, file) =>
  sharp(Buffer.from(markup)).png().toFile(resolve(OUT, file))

await mkdir(OUT, { recursive: true })

await Promise.all([
  // "any" — tile redondeada cálida (rx en unidades del viewBox 0..100)
  png(svg({ size: 192, k: 1.0, rounded: 26 }), 'icon-192.png'),
  png(svg({ size: 512, k: 1.0, rounded: 26 }), 'icon-512.png'),
  // maskable — corazón dentro de la zona segura, fondo a sangre
  png(svg({ size: 192, k: 0.82, rounded: 0 }), 'icon-maskable-192.png'),
  png(svg({ size: 512, k: 0.82, rounded: 0 }), 'icon-maskable-512.png'),
  // apple touch — Apple redondea solo
  png(svg({ size: 180, k: 0.98, rounded: 0 }), 'apple-touch-icon.png'),
  // og / compartir
  png(svg({ size: 512, k: 1.0, rounded: 22 }), 'og-image.png'),
])

console.log('✓ Íconos generados en public/')
