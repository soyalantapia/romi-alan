# Romi & Alan 💗

Un espacio privado y compartido para una pareja que convive. Dos personas, los
mismos datos, en tiempo real. Cuatro secciones —**Charlar, Compras, Caja,
Planes**— más una pantalla de **Inicio** que resume todo de un vistazo.

> App instalable (PWA), mobile-first, en español rioplatense. Sin login no se ve
> ningún dato.

## Stack

- **Frontend:** Vite + React + Tailwind CSS (SPA), PWA con `vite-plugin-pwa`.
- **Backend:** Node + Express (mismo servicio que sirve el frontend).
- **Base de datos:** PostgreSQL (Railway).
- **Auth:** propia, email + contraseña con JWT (sesión larga). Sólo 2 cuentas, sin
  registro público.
- **Tiempo real:** WebSocket (`ws`) — lo que carga una persona le aparece a la
  otra al instante.
- **Hosting:** todo en **Railway** (un servicio web + el Postgres).

La seguridad: la API exige un JWT válido en cada request. Cualquiera puede abrir
la URL, pero sin loguearse con una de las 2 cuentas **no ve ningún dato**.

## Estructura

```
romi-alan/
├─ index.html              # entry del frontend (Vite)
├─ vite.config.js          # base '/', PWA (manifest + service worker)
├─ tailwind.config.js      # tema → referencia variables CSS
├─ src/
│  ├─ theme/palette.css    # ◀ ÚNICA FUENTE DE VERDAD DE COLOR (editar acá)
│  ├─ index.css            # estilos base + componentes
│  ├─ lib/                 # api (REST), realtime (WS), format (es-AR), appearance
│  ├─ context/             # AuthContext, ProfilesContext
│  ├─ hooks/useRealtimeTable.js
│  ├─ components/          # Heart (signature), Brand, BottomNav, ui, icons…
│  └─ screens/             # Login, Inicio, Charlar, Compras, Caja, Planes, Ajustes
├─ server/
│  ├─ index.js             # Express: API + WS + sirve dist (SPA)
│  ├─ api.js               # endpoints REST (auth + CRUD por tabla)
│  ├─ auth.js              # bcrypt + JWT
│  ├─ realtime.js          # WebSocket broadcast
│  ├─ db.js                # pool de Postgres
│  ├─ schema.sql           # tablas (perfiles, temas, compras, movimientos, planes)
│  ├─ setup-db.mjs         # aplica el esquema
│  └─ seed.mjs             # crea las 2 cuentas
├─ scripts/gen-icons.mjs   # genera los íconos PWA desde el corazón
└─ docs/Especificacion_App_Pareja.md
```

## Diseño / cambiar colores

**Todos** los colores viven en un solo lugar: [`src/theme/palette.css`](src/theme/palette.css)
(variables CSS con nombres semánticos: `--c-bg`, `--c-surface`, `--c-primary`,
`--c-accent`, `--c-romi`, `--c-alan`, …). Tailwind las referencia por nombre, así
que **cambiar toda la estética = editar ese archivo**. Hay además un selector de
acento y modo oscuro en **Ajustes**.

El isotipo es un **corazón hecho a medida** ([`src/components/Heart.jsx`](src/components/Heart.jsx))
que mezcla el color de Romi y el de Alan; es también el ícono de la PWA
(`scripts/gen-icons.mjs` lo rasteriza a PNG).

## Correr local

Necesitás una Postgres (la de Railway sirve). Variables (ver `.env.example`):

```bash
# 1) instalar
npm install

# 2) aplicar el esquema (una vez)
DATABASE_URL="postgres://…"  PGSSL=true  npm run setup:db

# 3) crear las 2 cuentas (una vez)
DATABASE_URL="postgres://…" PGSSL=true \
  ROMI_EMAIL=romi@…  ROMI_NOMBRE=Romi  ROMI_COLOR=#CE8A99 \
  ALAN_EMAIL=alan@…  ALAN_NOMBRE=Alan  ALAN_COLOR=#7FA08E \
  npm run seed
# (si no pasás ROMI_PASSWORD/ALAN_PASSWORD, las genera y las imprime)

# 4a) dev con backend serviendo el build (un solo puerto :3001)
npm run build && DATABASE_URL="postgres://…" PGSSL=true JWT_SECRET=algo npm start

# 4b) o dev con hot-reload (dos procesos):
#     terminal A:  DATABASE_URL=… PGSSL=true JWT_SECRET=algo npm run dev:server
#     terminal B:  npm run dev      # Vite en :5173, proxyea /api y /ws a :3001
```

> Tip: podés poner las variables en un `.env.local` (gitignored) y correr
> `node --env-file=.env.local server/index.js`.

### Variables de entorno

| Variable | Dónde | Para qué |
|---|---|---|
| `DATABASE_URL` | backend | conexión a Postgres |
| `PGSSL` | backend | `true` si la base exige SSL (Railway postgres-ssl) |
| `JWT_SECRET` | backend | firma de los tokens de sesión |
| `PORT` | backend | lo inyecta Railway |

El **frontend no necesita variables**: habla con el backend en el mismo origen
(`/api`, `/ws`).

## Deploy en Railway

El repo ya está pensado para Railway (un servicio web + el Postgres en el mismo
proyecto):

1. En el proyecto de Railway, creá un servicio desde este repo (o `railway up`).
2. Variables del servicio web:
   - `DATABASE_URL = ${{Postgres.DATABASE_URL}}` (referencia al Postgres)
   - `PGSSL = true`
   - `JWT_SECRET = <algo largo y aleatorio>`
3. Railway corre `npm install` → `npm run build` → `npm start`.
   El server sirve el frontend (`dist`) + la API + el WebSocket.
4. Generá un dominio (`railway domain`) y listo.
5. Una sola vez: aplicar el esquema (`npm run setup:db`) y crear las cuentas
   (`npm run seed`) apuntando a la base.

> Para auto-deploy en cada push, conectá este repo de GitHub al servicio desde el
> dashboard de Railway (Settings → Source).

## Las 2 cuentas

No hay registro público. Las únicas dos cuentas se crean con `npm run seed`
(arriba). Cada perfil tiene nombre y color, editables después desde **Ajustes**.
**Login sin contraseña:** se entra tocando "Soy Romi" / "Soy Alan" (la sesión
queda guardada). El email/clave quedan como fallback. Si la sesión se pierde,
la app vuelve sola al selector.

## Novedades (addendum)

Navegación de 5 ítems: **Inicio · Charlar · Casa · Planes · Nosotros**.

- **Casa** — fusiona **Compras** + **Caja** en pestañas, e incluye **Metas de
  ahorro** (barra de progreso, aportar, festejo al 100%).
- **Nosotros** — **Pulso** de la relación (Amor/Relación/Pasión, niveles
  pleno/bien/necesita-cariño, tono que cuida + historial), **Encuentro semanal**
  (lo bueno primero → puntos en primera persona → flujo guiado → acuerdos +
  historial) y **Fotos** (galería propia).
- **Inicio** — contador "Llevamos X días", aniversario mensual (día 21) y
  cuenta regresiva al anual; recordatorio del encuentro; mini-progreso de meta.
- **Ajustes** — fecha de inicio de la relación, día del encuentro y link del
  álbum de Google Fotos (tabla `config` clave-valor).

**Fotos sin Supabase Storage:** como el stack real es Railway (no Supabase), las
fotos se comprimen en el cliente y se guardan como **bytes en Postgres**; se
sirven por un endpoint propio (`/api/fotos/:id/raw`) con token, nunca públicas.
Tablas nuevas en `server/schema.sql`: `puntos_trabajar`, `momentos`,
`encuentros`, `pulso`, `metas`, `fotos`, `config`.
