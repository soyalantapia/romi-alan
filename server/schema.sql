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
