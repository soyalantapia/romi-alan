-- ════════════════════════════════════════════════════════════════════════
--  Romi & Alan — esquema (Railway PostgreSQL)
--  Adaptado del spec (sección 6.6). Como no usamos Supabase Auth, la tabla
--  `perfiles` ES la tabla de cuentas (email + hash de contraseña). El acceso
--  lo controla el backend con JWT: sin login válido, la API no devuelve nada
--  (equivalente al requisito de "sin login no se ve ningún dato").
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- PERFILES = cuentas de la pareja (exactamente 2, sin registro público)
create table if not exists perfiles (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  nombre        text not null,
  color         text not null default '#C68497',
  created_at    timestamptz not null default now()
);

-- TEMAS (Charlar)
create table if not exists temas (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  detalle    text,
  estado     text not null default 'pendiente' check (estado in ('pendiente','hablado')),
  prioridad  text not null default 'normal'    check (prioridad in ('normal','importante')),
  creado_por uuid not null references perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  hablado_at timestamptz
);

-- COMPRAS
create table if not exists compras (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  cantidad    text,
  categoria   text,
  comprado    boolean not null default false,
  creado_por  uuid not null references perfiles(id),
  created_at  timestamptz not null default now(),
  comprado_at timestamptz
);

-- MOVIMIENTOS (Caja)
create table if not exists movimientos (
  id             uuid primary key default gen_random_uuid(),
  tipo           text not null check (tipo in ('aporte','gasto')),
  monto          numeric(12,2) not null check (monto > 0),
  concepto       text,
  categoria      text,
  fecha          date not null default current_date,
  registrado_por uuid not null references perfiles(id),
  created_at     timestamptz not null default now()
);

-- PLANES
create table if not exists planes (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  detalle    text,
  categoria  text not null default 'otro'
             check (categoria in ('lugar','actividad','fecha_importante','otro')),
  fecha      date,
  recordar   boolean not null default true,
  dias_antes int not null default 3,
  estado     text not null default 'pendiente' check (estado in ('pendiente','hecho')),
  creado_por uuid not null references perfiles(id),
  created_at timestamptz not null default now(),
  hecho_at   timestamptz
);

create index if not exists idx_temas_estado on temas(estado);
create index if not exists idx_compras_comprado on compras(comprado);
create index if not exists idx_movimientos_fecha on movimientos(fecha);
create index if not exists idx_planes_fecha on planes(fecha);

-- ════════════════════════════════════════════════════════════════════════
--  ADDENDUM — Nosotros (encuentro, pulso, fotos), metas, config, hitos
-- ════════════════════════════════════════════════════════════════════════

-- Encuentro semanal: puntos para trabajar (en primera persona)
create table if not exists puntos_trabajar (
  id         uuid primary key default gen_random_uuid(),
  texto      text not null,
  tipo       text not null default 'propio' check (tipo in ('propio','necesidad')),
  estado     text not null default 'activo' check (estado in ('activo','logrado')),
  creado_por uuid not null references perfiles(id),
  created_at timestamptz not null default now(),
  logrado_at timestamptz
);

-- Lo bueno de la semana: momentos + agradecimientos
create table if not exists momentos (
  id         uuid primary key default gen_random_uuid(),
  texto      text not null,
  tipo       text not null default 'momento' check (tipo in ('momento','agradecimiento')),
  creado_por uuid not null references perfiles(id),
  created_at timestamptz not null default now()
);

-- Los encuentros realizados (compartidos, sin autor)
create table if not exists encuentros (
  id         uuid primary key default gen_random_uuid(),
  fecha      date not null default current_date,
  acuerdos   text,
  realizado  boolean not null default false,
  created_at timestamptz not null default now()
);

-- Pulso de la relación (cada fila = una marca de una persona sobre un pilar)
create table if not exists pulso (
  id             uuid primary key default gen_random_uuid(),
  pilar          text not null check (pilar in ('amor','relacion','pasion')),
  nivel          text not null check (nivel in ('pleno','bien','necesita_carino')),
  nota           text,
  registrado_por uuid not null references perfiles(id),
  created_at     timestamptz not null default now()
);

-- Metas de ahorro
create table if not exists metas (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  objetivo   numeric(12,2) not null check (objetivo > 0),
  acumulado  numeric(12,2) not null default 0,
  estado     text not null default 'activa' check (estado in ('activa','lograda')),
  creado_por uuid not null references perfiles(id),
  created_at timestamptz not null default now(),
  lograda_at timestamptz
);

-- Fotos: en vez de Supabase Storage, guardamos los bytes (comprimidos) acá.
create table if not exists fotos (
  id          uuid primary key default gen_random_uuid(),
  descripcion text,
  mime        text not null default 'image/jpeg',
  bytes       bytea not null,
  subido_por  uuid not null references perfiles(id),
  fecha       date not null default current_date,
  created_at  timestamptz not null default now()
);

-- Config clave-valor (fecha de inicio, día del encuentro, link álbum, etc.)
create table if not exists config (
  clave      text primary key,
  valor      text,
  updated_at timestamptz not null default now()
);
insert into config (clave, valor) values ('fecha_inicio_relacion', '2026-05-21')
  on conflict (clave) do nothing;
insert into config (clave, valor) values ('encuentro_dia', '0')   -- 0 = domingo
  on conflict (clave) do nothing;

create index if not exists idx_puntos_estado on puntos_trabajar(estado);
create index if not exists idx_pulso_created on pulso(created_at);
create index if not exists idx_fotos_created on fotos(created_at);

-- ── Juego de preguntas ──
create table if not exists preguntas (
  id           uuid primary key default gen_random_uuid(),
  texto        text not null,
  nivel        int not null check (nivel in (1, 2, 3)),
  estado       text not null default 'pendiente' check (estado in ('pendiente','respondida','salteada')),
  salteada_por uuid references perfiles(id),
  created_at   timestamptz not null default now()
);
-- Juego presencial: no se escribe la respuesta, sólo se marca si cada uno
-- respondió (estaba preparado) o no.
create table if not exists respuestas (
  id             uuid primary key default gen_random_uuid(),
  pregunta_id    uuid not null references preguntas(id) on delete cascade,
  respondido_por uuid not null references perfiles(id),
  respondio      boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (pregunta_id, respondido_por)
);
create index if not exists idx_preguntas_estado on preguntas(estado, nivel);
create index if not exists idx_respuestas_pregunta on respuestas(pregunta_id);
