# Especificación de Producto — App de Pareja (Alan & Romina)

> **Para quién es este documento:** es la especificación completa para que Claude Code construya la aplicación. Está pensado para pegarse tal cual. Construir **exactamente el alcance de la v1** descripto acá; lo que está en "Futuras mejoras" NO va en la primera versión.

---

## 1. Resumen ejecutivo

Una aplicación **privada y compartida** para dos personas (una pareja que convive). Las dos usan la misma app, ven y editan los mismos datos en tiempo real. El objetivo es sacar fricción de la convivencia y fortalecer la relación, sin convertirse en una app pesada.

**Qué es:**
- Un espacio compartido con 4 secciones funcionales + una pantalla de inicio que resume todo.
- Mobile-first (se usa desde el celular, instalable como app).
- Base de datos compartida: lo que carga una persona, la otra lo ve al instante.

**Qué NO es:**
- No es una red social, no tiene chat, no tiene feed.
- No es una app de productividad compleja ni un gestor de proyectos.
- No tiene decenas de funcionalidades. La simpleza es un requisito, no una limitación.

**Las 4 secciones (v1):**
1. **Charlar** — temas que la pareja quiere conversar (sin que todo caiga en la discusión de la noche).
2. **Compras** — lista del súper / cosas de la casa, compartida.
3. **Caja** — la plata de la casa: aportes y gastos, con quién puso qué.
4. **Planes** — todo lo que quieren hacer juntos (lugares, cursos, experiencias) + fechas importantes (cumples, aniversarios).

---

## 2. Principios de producto (el "por qué" que ordena todo)

Estos principios guían cada decisión de diseño. Si hay duda, ganan estos principios:

1. **Las dos personas son dueñas por igual.** Todo se edita por ambos. Ninguna sección es "de uno". La app no debe sentirse como el panel de control de una sola persona sobre la otra.
2. **Baja fricción ante todo.** Agregar una cosa (un tema, una compra, un gasto, un plan) tiene que costar 2 toques. Si agregar algo es trabajoso, la app muere en una semana.
3. **Básica a propósito.** Cuatro secciones + inicio. No agregar pantallas ni opciones "por si acaso".
4. **Equilibrio entre logística y la parte linda.** Tres secciones son logística (charlar, compras, caja) y una es aspiracional/linda (planes). Esa proporción está pensada: la app no puede ser solo pendientes y problemas, o no fortalece nada.
5. **Las cosas se cierran, no se acumulan.** Todo lo que se "resuelve" (un tema hablado, una compra comprada, un plan hecho) sale de la vista principal y va a un archivo. Una lista que solo crece genera ansiedad.
6. **Razones para abrirla seguido.** La pantalla de inicio da un pantallazo de todo en 3 segundos. Eso es lo que hace que la abran sin que sea una tarea.

---

## 3. Usuarios y modelo de acceso

- **Exactamente 2 usuarios.** No hay registro abierto. Solo existen dos cuentas (las de ellos dos).
- Cada persona tiene su propio login (así se sabe "quién agregó qué"), pero **todos los datos son compartidos** entre los dos.
- Cada persona tiene un **perfil** con su nombre y un **color** asignado. Ese color se usa en toda la app para etiquetar quién cargó cada cosa (ej.: el tag "Alan" siempre violeta, "Romina" siempre verde).
- No hay roles ni permisos distintos: los dos pueden hacer todo.

---

## 4. Stack técnico recomendado (y por qué)

**Requisito técnico más importante:** como son dos celulares distintos que comparten los mismos datos, **la app necesita una base de datos alojada en un servidor (backend hospedado)**. NO puede ser una app que guarda datos solo en el celular (localStorage), porque entonces cada uno vería datos distintos. Este es el punto que no se puede saltear.

**Stack recomendado:**

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | **Next.js (React) + Tailwind CSS**, configurado como **PWA** | Permite instalarla en el celular como si fuera una app nativa. React es ideal para este tipo de interfaz. |
| Backend + Base de datos | **Supabase** (PostgreSQL + Auth + Realtime + RLS) | Da base de datos compartida, login, sincronización en tiempo real y seguridad, con muy poco código de servidor. Tiene plan gratuito de sobra para 2 usuarios. |
| Hosting | **Vercel** | Deploy del frontend en minutos, gratis para este tamaño. |

**Alternativa válida:** Firebase (Firestore + Firebase Auth) si se prefiere NoSQL. Cumple lo mismo (base compartida, realtime, auth). Pero el resto de este documento asume **Supabase/PostgreSQL** porque el modelo de datos es relacional y se expresa limpio en SQL.

**Por qué PWA y no app nativa:** una app nativa (iOS/Android en las tiendas) es mucho más trabajo y costo, innecesario para dos personas. Una PWA se "instala" en la pantalla de inicio del celular, funciona offline-básico y se actualiza sola. Es exactamente lo que necesitan.

---

## 5. Arquitectura general

```
[Celular Alan]  ─┐
                 ├──► Next.js (PWA, en Vercel) ──► Supabase (Postgres + Auth + Realtime)
[Celular Romina]─┘
```

- El frontend (Next.js) corre en el navegador/PWA de cada celular.
- Habla con Supabase para leer/escribir datos y para autenticar.
- **Supabase Realtime** empuja los cambios: si Romina agrega una compra, a Alan le aparece sola sin recargar.
- **Row Level Security (RLS)** asegura que solo esas dos cuentas accedan a los datos.

---

## 6. Modelo de datos

Cinco tablas. A continuación cada una con sus campos, tipos y para qué sirve.

### 6.1 `perfiles` — una fila por persona
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | Igual al id de auth.users |
| nombre | text | "Alan", "Romina" |
| color | text | Color hex para los tags de "quién" |
| created_at | timestamptz | Default `now()` |

### 6.2 `temas` — Charlar
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| titulo | text (requerido) | El tema en una línea |
| detalle | text (opcional) | Nota o contexto |
| estado | text | `'pendiente'` \| `'hablado'` (default `pendiente`) |
| prioridad | text | `'normal'` \| `'importante'` (default `normal`) |
| creado_por | uuid (FK perfiles) | Quién lo agregó |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| hablado_at | timestamptz (nullable) | Cuándo se marcó como hablado |

### 6.3 `compras` — Compras de casa
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| nombre | text (requerido) | "Leche", "Detergente" |
| cantidad | text (opcional) | "2", "1 docena" (texto libre, simple) |
| categoria | text (opcional) | "comida", "limpieza", etc. |
| comprado | boolean | Default `false` |
| creado_por | uuid (FK perfiles) | |
| created_at | timestamptz | |
| comprado_at | timestamptz (nullable) | |

### 6.4 `movimientos` — Caja de la casa
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| tipo | text | `'aporte'` (entra plata) \| `'gasto'` (sale plata) |
| monto | numeric(12,2) (requerido) | Debe ser > 0 |
| concepto | text | Qué fue ("Súper", "Luz") |
| categoria | text (opcional) | "súper", "servicios", "salidas", "otros" |
| fecha | date | Default hoy |
| registrado_por | uuid (FK perfiles) | Quién lo cargó / puso la plata |
| created_at | timestamptz | |

**Valores calculados (no se guardan, se computan al leer):**
- **Saldo de la caja** = suma(aportes) − suma(gastos)
- **Total aportado por persona** (Alan vs Romina)
- **Total gastado** (general y opcionalmente por categoría)

### 6.5 `planes` — Planes y fechas
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| titulo | text (requerido) | "Curso de cerámica", "Aniversario", "Ir a Bariloche" |
| detalle | text (opcional) | |
| categoria | text | `'lugar'` \| `'actividad'` \| `'fecha_importante'` \| `'otro'` (default `otro`) |
| **fecha** | date (**nullable**) | **El campo clave: si está vacío → va al bolsón "Algún día". Si tiene fecha → es un plan agendado con recordatorio.** |
| recordar | boolean | Default `true` (solo aplica si hay fecha) |
| dias_antes | int | Default 3 (cuántos días antes recordar) |
| estado | text | `'pendiente'` \| `'hecho'` (default `pendiente`) |
| creado_por | uuid (FK perfiles) | |
| created_at | timestamptz | |
| hecho_at | timestamptz (nullable) | |

> **Decisión de diseño importante:** los lugares/cursos sin fecha y las fechas importantes (cumple, aniversario) viven en **la misma tabla**, diferenciadas por si `fecha` está cargada o no. Así se evita tener dos secciones separadas (mantiene la app básica) y al mismo tiempo el calendario no se mezcla con la lista de deseos.

### 6.6 SQL para crear todo (correr en Supabase)

```sql
-- PERFILES
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  color text not null default '#7C3AED',
  created_at timestamptz not null default now()
);

-- TEMAS (Charlar)
create table temas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  detalle text,
  estado text not null default 'pendiente' check (estado in ('pendiente','hablado')),
  prioridad text not null default 'normal' check (prioridad in ('normal','importante')),
  creado_por uuid not null references perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  hablado_at timestamptz
);

-- COMPRAS
create table compras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cantidad text,
  categoria text,
  comprado boolean not null default false,
  creado_por uuid not null references perfiles(id),
  created_at timestamptz not null default now(),
  comprado_at timestamptz
);

-- MOVIMIENTOS (Caja)
create table movimientos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('aporte','gasto')),
  monto numeric(12,2) not null check (monto > 0),
  concepto text,
  categoria text,
  fecha date not null default current_date,
  registrado_por uuid not null references perfiles(id),
  created_at timestamptz not null default now()
);

-- PLANES
create table planes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  detalle text,
  categoria text not null default 'otro'
    check (categoria in ('lugar','actividad','fecha_importante','otro')),
  fecha date,
  recordar boolean not null default true,
  dias_antes int not null default 3,
  estado text not null default 'pendiente' check (estado in ('pendiente','hecho')),
  creado_por uuid not null references perfiles(id),
  created_at timestamptz not null default now(),
  hecho_at timestamptz
);

-- SEGURIDAD (RLS): solo usuarios autenticados (van a existir solo 2 cuentas)
alter table perfiles enable row level security;
alter table temas enable row level security;
alter table compras enable row level security;
alter table movimientos enable row level security;
alter table planes enable row level security;

create policy "acceso pareja perfiles"   on perfiles    for all to authenticated using (true) with check (true);
create policy "acceso pareja temas"       on temas       for all to authenticated using (true) with check (true);
create policy "acceso pareja compras"     on compras     for all to authenticated using (true) with check (true);
create policy "acceso pareja movimientos" on movimientos for all to authenticated using (true) with check (true);
create policy "acceso pareja planes"      on planes      for all to authenticated using (true) with check (true);
```

> Después: en Supabase, **desactivar el registro público** y crear/invitar solo las dos cuentas. Y **activar Realtime** (agregar las tablas a la publicación) para que la sincronización funcione.

---

## 7. Navegación y mapa de pantallas

Barra de navegación inferior (bottom tab bar), fija, con 5 ítems:

```
[ Inicio ]  [ Charlar ]  [ Compras ]  [ Caja ]  [ Planes ]
```

Cada ítem con su ícono y label corto. La pantalla activa se resalta. Es la navegación principal y única: nada de menús escondidos.

---

## 8. Especificación pantalla por pantalla

### 8.1 Inicio (Dashboard)
**Objetivo:** dar un pantallazo de todo en 3 segundos. Es la razón por la que la app se abre seguido.

**Componentes (de arriba a abajo):**
- **Encabezado:** saludo simple + fecha de hoy (ej. "Hola 👋 — sábado 14 de junio").
- **Tarjeta "Próximas fechas":** los próximos 1–3 planes que tengan fecha, ordenados por cercanía, con cuenta regresiva ("Aniversario — en 3 días"). Si no hay, se oculta o muestra estado vacío amable.
- **Tarjeta "Caja":** el **saldo actual** en grande + el último movimiento ("Último: −$12.000 Súper, Romina").
- **Tarjeta "Temas pendientes":** cantidad de temas sin hablar + los 1–2 más recientes/importantes. Toca y lleva a Charlar.
- **Tarjeta "Compras":** cantidad de ítems pendientes + acceso rápido. 
- **Botones de carga rápida:** accesos para "+ Tema", "+ Compra", "+ Movimiento", "+ Plan" (botón flotante con menú, o fila de botones). Esto es clave para la baja fricción.

**Estados:** loading (skeletons), todo vacío (mensaje de bienvenida que invita a cargar la primera cosa).

**Por qué:** concentra el valor de las 4 secciones en una vista. La gente abre una app de pareja si en un vistazo ve "qué se viene, cómo está la plata, qué falta hablar/comprar".

---

### 8.2 Charlar (Temas)
**Objetivo:** estacionar temas para hablarlos tranquilos, en vez de que todo explote en la discusión de la noche. Las dos personas suman.

**Componentes:**
- **Tabs/filtro:** `Pendientes` | `Hablados`.
- **Lista de temas pendientes:** ordenados por prioridad (importante primero) y luego por más reciente. Cada tarjeta muestra:
  - Título (y detalle desplegable si existe).
  - Tag de prioridad si es "importante".
  - Tag de **quién lo agregó** (con su color) + hace cuánto.
  - Acción para **marcar "hablado"** (checkbox o swipe) → pasa a la pestaña Hablados y se setea `hablado_at`.
  - Editar / Eliminar (eliminar pide confirmación).
- **Carga rápida:** input de título siempre visible arriba; al expandir, campo de detalle opcional + toggle "importante".

**Estados:** vacío en Pendientes = mensaje positivo ("No hay temas para hablar, todo al día"). 

**Por qué:** evita la dinámica de discutir todo de noche y de golpe. Tener un "done" hace que la lista no sea una pila infinita. Que las dos personas agreguen evita que se convierta en la lista de reclamos de una sola.

---

### 8.3 Compras
**Objetivo:** una lista del súper/casa compartida y en tiempo real, para que cualquiera de los dos compre sin que falte ni se duplique.

**Componentes:**
- **Carga rápida arriba:** input de nombre (Enter agrega y limpia, listo para el siguiente). Campos opcionales: cantidad y categoría.
- **Lista de pendientes:** cada ítem con checkbox. Al tildar → `comprado = true`, se va al final / a la sección "Comprados" con efecto de tachado.
- **Sección "Comprados"** (colapsable) con botón **"Vaciar comprados"** para limpiar la lista.
- Tag chico de quién lo agregó.

**Estados:** lista vacía = "Lista limpia, no falta nada".

**Por qué:** es la sección de mayor uso recurrente (se compra seguido), lo que trae a los dos a la app naturalmente. La velocidad de carga es lo más importante acá.

---

### 8.4 Caja
**Objetivo:** transparencia total sobre la plata de la casa. Cuánto hay, quién puso, en qué se gastó.

**Componentes:**
- **Encabezado de saldo:** **saldo actual** en grande. Debajo: total aportado y total gastado.
- **Resumen por persona:** "Alan aportó $X · Romina aportó $Y" (con los colores). Opcional: quién puso más / balance entre los dos.
- **Lista de movimientos** (más nuevo arriba): cada fila con ícono y color según tipo (aporte = +/verde, gasto = −/rojo), monto, concepto, categoría, fecha y quién.
- **Cargar movimiento (botón +):** elegir tipo (aporte/gasto), monto, concepto, categoría (opcional), fecha (default hoy), quién (default el usuario actual, editable).
- Editar / Eliminar movimiento (con confirmación).
- *(Opcional v1.1)* filtro por mes.

**Validaciones:** monto > 0; concepto recomendado en gastos.

**Por qué:** "quién puso qué" era un pedido explícito. Una caja compartida con saldo visible evita malentendidos de plata, que es de las cosas que más roza en una convivencia.

---

### 8.5 Planes y fechas
**Objetivo:** juntar en un lugar todo lo que quieren hacer juntos (lugares, cursos, experiencias) y las fechas que importan. Es la sección "linda" que mira para adelante.

**Componentes:**
- **Grupo "Con fecha":** planes que tienen `fecha`, ordenados por cercanía, con cuenta regresiva. Acá caen cumples, aniversarios y planes agendados.
- **Grupo "Algún día":** planes sin fecha (la lista de deseos: cerámica, lugares para visitar, etc.).
- **Sección "Hechos"** (colapsable): planes marcados como hechos → queda un pequeño registro de cosas que ya hicieron juntos.
- Cada tarjeta: título, ícono según categoría (lugar/actividad/fecha importante/otro), detalle, quién lo agregó, fecha si tiene.
- **Acción "Marcar hecho"** → pasa a Hechos, setea `hecho_at`.
- **Cargar plan (botón +):** título, categoría, detalle opcional, **fecha opcional**, toggle "recordar" + días antes (si hay fecha).

**Por qué:** las metas y deseos compartidos unen. El campo de fecha opcional resuelve dos necesidades (lista de deseos + calendario) en una sola sección. Marcar "hecho" arma una memoria de la pareja, que es un toque positivo sin necesitar otra sección.

---

### 8.6 Ajustes (mínimo)
- Editar nombre y color de cada perfil.
- Cerrar sesión.
- (Eso es todo. No agregar más.)

---

## 9. Reglas transversales (aplican a toda la app)

- **Autoría y tiempo:** toda fila guarda `creado_por`/`registrado_por` y `created_at`. Las ediciones actualizan `updated_at` donde exista.
- **Tiempo real:** todas las listas se suscriben a Supabase Realtime. Un cambio de una persona aparece en la otra sin recargar.
- **UI optimista:** al agregar/editar, reflejarlo al instante en pantalla y confirmar contra la base por detrás.
- **Borrado seguro:** eliminar siempre pide confirmación.
- **Estados vacíos** amables y con acción ("Agregá el primero").
- **Estados de carga** con skeletons, nunca pantalla en blanco.
- **Validaciones:** campos requeridos marcados; montos numéricos > 0; fechas válidas.
- **Zona horaria:** `America/Argentina/Buenos_Aires` para fechas y cuentas regresivas.
- **Colores por persona** usados de forma consistente en todos los tags de autoría.

---

## 10. Notificaciones y recordatorios

**v1 (simple, confiable):** recordatorios **dentro de la app**, calculados en el cliente. En la pantalla de Inicio aparecen los planes con fecha próxima ("Aniversario — en 3 días"), según `dias_antes`. No requiere infraestructura extra.

**Futuras mejoras (más complejo):** notificaciones push de PWA (avisan aunque la app esté cerrada). Esto requiere service worker, suscripción a push y una función programada que las dispare. Se deja para una fase posterior por la complejidad que agrega.

---

## 11. Diseño visual y UX

- **Mobile-first**, una sola columna, pensado para el pulgar. Targets táctiles grandes (mínimo ~44px).
- **Estilo:** limpio y cálido, basado en tarjetas. Nada recargado. Mucho espacio en blanco.
- **Paleta:** un color primario calmo + los dos colores de las personas para los tags de autoría. Buen contraste para legibilidad.
- **Tipografía:** legible, tamaños cómodos, jerarquía clara (saldo y cuentas regresivas grandes).
- **Modo oscuro:** opcional, lindo de tener, no bloqueante.
- **Accesibilidad:** contraste suficiente, labels en los inputs, áreas táctiles amplias.
- **Sensación general:** que se sienta un espacio de los dos, simple y agradable de abrir — no un panel administrativo.

---

## 12. Seguridad y privacidad

- Autenticación con Supabase Auth (magic link por email o email + contraseña).
- **Registro público desactivado.** Solo se crean/invitan las dos cuentas.
- **RLS activado en todas las tablas** (solo usuarios autenticados acceden).
- Sin acceso público a los datos. La información es privada de los dos.

---

## 13. Roadmap

**v1 (MVP) — construir esto:**
- Login (2 cuentas) + perfiles con nombre y color.
- Las 4 secciones (Charlar, Compras, Caja, Planes) con CRUD completo.
- Pantalla de Inicio con tarjetas-resumen y recordatorios in-app.
- Sincronización en tiempo real.
- PWA instalable + deploy en Vercel.

**Futuras mejoras (NO en v1, documentadas para después):**
- **"Momento de la semana" / agradecimientos:** una sección o tarjeta para anotar algo lindo o un "gracias por" de la semana. Es el complemento que registra lo que ya está bueno hoy (lo presente), distinto de Planes que mira al futuro. Se dejó afuera de la v1 por mantenerla simple; es fácil de sumar como 5ª sección o como tarjeta en Inicio si más adelante se quiere.
- Notificaciones push (PWA).
- Estadísticas de la caja: gastos por mes y por categoría, con un gráfico.
- Adjuntar fotos a planes y a movimientos.
- Exportar la caja a CSV.

---

## 14. Checklist de desarrollo para Claude Code

1. Crear proyecto **Next.js** con **Tailwind**, configurado como **PWA** (manifest + service worker básico, ícono instalable).
2. Crear proyecto en **Supabase**. Correr el **SQL de la sección 6.6** (tablas + RLS + policies). Activar **Realtime** en las tablas. Desactivar registro público.
3. Configurar el cliente de Supabase y el flujo de **auth** (magic link o email/contraseña). Crear las **dos cuentas** y sus filas en `perfiles` (nombre + color).
4. Implementar el **layout** con la **bottom tab bar** de 5 ítems (Inicio, Charlar, Compras, Caja, Planes).
5. Implementar cada sección con **CRUD completo + suscripción Realtime**, respetando las reglas transversales (sección 9):
   - Charlar: pendientes/hablados, prioridad, autoría, carga rápida.
   - Compras: checkbox → comprado, sección comprados, vaciar.
   - Caja: saldo calculado, resumen por persona, lista y carga de movimientos.
   - Planes: grupos "Con fecha" / "Algún día" / "Hechos", fecha opcional, recordatorio.
6. Implementar la pantalla de **Inicio** (tarjetas-resumen + recordatorios de fechas próximas + botones de carga rápida).
7. Agregar **estados vacíos, estados de carga, validaciones y confirmaciones de borrado**.
8. Aplicar el **estilo mobile-first** (sección 11), con los colores por persona consistentes.
9. **Deploy en Vercel.** Probar instalación como **PWA** en los dos celulares.

---

*Fin de la especificación v1.*
