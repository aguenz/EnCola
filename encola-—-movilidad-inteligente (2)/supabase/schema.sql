-- =============================================================================
-- RutaCaracas (MaaS Caracas) — Esquema PostgreSQL + RLS + RPCs Atómicas
-- Listo para ejecutar en Supabase SQL Editor
-- =============================================================================

-- Extensiones requeridas
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TABLAS PRINCIPALES
-- -----------------------------------------------------------------------------

-- Perfiles de usuario (Pasajero o Conductor/Colector)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default 'Viajero Caracas',
  avatar_url text,
  role text not null default 'passenger' check (role in ('passenger', 'driver')),
  unit_code text, -- Ej: 'UNIDAD-01' cuando actúa como conductor
  confirmed_points integer not null default 0 check (confirmed_points >= 0),
  pending_points integer not null default 0 check (pending_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Paradas y Estaciones (Av. Francisco de Miranda: Plaza Venezuela -> Los Cortijos)
create table if not exists public.stops (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  zone text not null,
  lat double precision not null,
  lng double precision not null,
  transport_types text[] not null default array['camioneta', 'metro', 'metrobus'],
  waiting_count integer not null default 0 check (waiting_count >= 0),
  metro_status text not null default 'fluido' check (metro_status in ('fluido', 'retraso', 'cerrado')),
  updated_at timestamptz not null default now()
);

-- Unidades Activas en Vivo (Camionetas / Metrobús)
create table if not exists public.active_units (
  id uuid primary key default gen_random_uuid(),
  unit_code text unique not null,
  driver_id uuid references public.profiles (id) on delete set null,
  route_name text not null default 'Av. Francisco de Miranda (Plz. Vzla - Los Cortijos)',
  transport_type text not null default 'camioneta' check (transport_type in ('camioneta', 'metrobus')),
  lat double precision not null,
  lng double precision not null,
  speed_kmh double precision not null default 0,
  occupancy text not null default 'libre' check (occupancy in ('libre', 'de_pie', 'full')),
  is_active boolean not null default true,
  pago_movil_bank text default 'Banesco (0134)',
  pago_movil_phone text default '0412-555-0194',
  pago_movil_id text default 'V-19.482.310',
  updated_at timestamptz not null default now()
);

-- Reportes de Fila / Proof of Transit (Sistema Anti-Trampa)
create table if not exists public.queue_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stop_id uuid not null references public.stops (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'expired')),
  points_awarded integer not null default 10,
  validation_method text check (validation_method in ('gps_velocity', 'qr_scan')),
  validated_unit_code text,
  reported_lat double precision not null,
  reported_lng double precision not null,
  confirmed_lat double precision,
  confirmed_lng double precision,
  confirmed_speed_kmh double precision,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

-- Comercios Aliados (Ecosistema de Recompensas estilo Pasito)
create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('cafe', 'comida', 'saldo')),
  emoji text not null default '☕',
  lat double precision not null,
  lng double precision not null,
  reference_stop text not null,
  offer_title text not null,
  offer_description text not null,
  points_cost integer not null check (points_cost > 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Canjes Presenciales (Boletos Digitales con Expiración a 3 minutos)
create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  code text unique not null,
  points_spent integer not null check (points_spent > 0),
  status text not null default 'active' check (status in ('active', 'used', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '3 minutes')
);

-- Índices para consultas en tiempo real
create index if not exists idx_queue_reports_user_status on public.queue_reports (user_id, status);
create index if not exists idx_redemptions_user_created on public.redemptions (user_id, created_at desc);
create index if not exists idx_active_units_active on public.active_units (is_active);

-- -----------------------------------------------------------------------------
-- 2. TRIGGER DE CREACIÓN AUTOMÁTICA DE PERFIL AL REGISTRARSE CON GOOGLE OAUTH
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, confirmed_points, pending_points)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'Viajero'), '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    0,
    0
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 3. PROTECCIÓN ANTI-TRAMPA EN COLUMNAS SENSIBLES (RLS + TRIGGER GUARD)
-- Ningún usuario autenticado puede alterar directamente confirmed_points ni pending_points
-- -----------------------------------------------------------------------------

create or replace function public.guard_profile_points()
returns trigger
language plpgsql
as $$
begin
  -- Solo funciones SECURITY DEFINER (owner/postgres) o service_role pueden modificar puntos
  if current_user in ('authenticated', 'anon') then
    if new.confirmed_points is distinct from old.confirmed_points
       or new.pending_points is distinct from old.pending_points then
      raise exception 'Acceso denegado: los puntos solo pueden modificarse mediante RPC autorizada.';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_points on public.profiles;
create trigger trg_guard_profile_points
  before update on public.profiles
  for each row execute procedure public.guard_profile_points();

-- Habilitar Row Level Security en TODAS las tablas
alter table public.profiles enable row level security;
alter table public.stops enable row level security;
alter table public.active_units enable row level security;
alter table public.queue_reports enable row level security;
alter table public.merchants enable row level security;
alter table public.redemptions enable row level security;

-- Políticas para PROFILES
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- El usuario puede actualizar su nombre, rol o unit_code, pero el trigger bloquea cambios a puntos
create policy "profiles_update_own_safe_fields"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and confirmed_points = (select p.confirmed_points from public.profiles p where p.id = auth.uid())
    and pending_points = (select p.pending_points from public.profiles p where p.id = auth.uid())
  );

-- Políticas para STOPS (lectura pública para mapa en vivo)
create policy "stops_select_all"
  on public.stops for select
  to anon, authenticated
  using (true);

-- Políticas para ACTIVE_UNITS (lectura pública; solo el conductor dueño actualiza su unidad)
create policy "active_units_select_all"
  on public.active_units for select
  to anon, authenticated
  using (true);

create policy "active_units_driver_upsert"
  on public.active_units for update
  to authenticated
  using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

create policy "active_units_driver_insert"
  on public.active_units for insert
  to authenticated
  with check (driver_id = auth.uid());

-- Políticas para QUEUE_REPORTS (solo el dueño lee e inserta en estado pending; jamás confirma directo)
create policy "queue_reports_select_own"
  on public.queue_reports for select
  to authenticated
  using (user_id = auth.uid());

create policy "queue_reports_insert_own_pending"
  on public.queue_reports for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and points_awarded = 10
  );

-- Políticas para MERCHANTS (catálogo visible públicamente)
create policy "merchants_select_active"
  on public.merchants for select
  to anon, authenticated
  using (is_active = true);

-- Políticas para REDEMPTIONS (solo el dueño puede ver sus cupones; creación exclusiva por RPC)
create policy "redemptions_select_own"
  on public.redemptions for select
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 4. FUNCIONES ALMACENADAS SEGURAS (RPCs ATÓMICAS)
-- -----------------------------------------------------------------------------

-- RPC 1: report_queue_checkin (registra check-in pendiente y suma +1 a la fila)
create or replace function public.report_queue_checkin(
  p_stop_id uuid,
  p_lat double precision,
  p_lng double precision
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_stop record;
  v_report_id uuid;
  v_distance_m double precision;
begin
  if v_user_id is null then
    raise exception 'Usuario no autenticado';
  end if;

  select * into v_stop from public.stops where id = p_stop_id for update;
  if not found then
    raise exception 'Parada no encontrada';
  end if;

  -- Validación Haversine en servidor (tolerancia 60m para deriva GPS)
  v_distance_m := 6371000 * 2 * asin(
    sqrt(
      power(sin(radians(p_lat - v_stop.lat) / 2), 2) +
      cos(radians(v_stop.lat)) * cos(radians(p_lat)) *
      power(sin(radians(p_lng - v_stop.lng) / 2), 2)
    )
  );

  if v_distance_m > 60 then
    raise exception 'Debes estar a menos de 50 metros de la parada para reportar fila (distancia: %m)', round(v_distance_m);
  end if;

  -- Evitar reportes duplicados pendientes del mismo usuario
  if exists (
    select 1 from public.queue_reports
    where user_id = v_user_id and status = 'pending'
  ) then
    raise exception 'Ya tienes un reporte pendiente por confirmar abordaje';
  end if;

  insert into public.queue_reports (user_id, stop_id, status, points_awarded, reported_lat, reported_lng)
  values (v_user_id, p_stop_id, 'pending', 10, p_lat, p_lng)
  returning id into v_report_id;

  update public.stops
  set waiting_count = waiting_count + 1, updated_at = now()
  where id = p_stop_id;

  update public.profiles
  set pending_points = pending_points + 10, updated_at = now()
  where id = v_user_id;

  return jsonb_build_object(
    'report_id', v_report_id,
    'points_pending_added', 10,
    'stop_waiting_count', v_stop.waiting_count + 1
  );
end;
$$;

-- RPC 2: confirm_transit_points
-- Valida el reporte pendiente (por GPS >150m y >15 km/h o escaneo QR de unidad),
-- lo marca confirmado, resta 1 de la fila de la parada y acredita puntos confirmados.
create or replace function public.confirm_transit_points(
  p_report_id uuid,
  p_validation_method text,
  p_current_lat double precision default null,
  p_current_lng double precision default null,
  p_speed_kmh double precision default null,
  p_unit_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_report record;
  v_stop record;
  v_distance_m double precision := 0;
  v_new_confirmed integer;
  v_new_pending integer;
begin
  if v_user_id is null then
    raise exception 'Usuario no autenticado';
  end if;

  select * into v_report
  from public.queue_reports
  where id = p_report_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Reporte de viaje no encontrado';
  end if;

  if v_report.status <> 'pending' then
    raise exception 'Este reporte ya fue procesado (estado: %)', v_report.status;
  end if;

  select * into v_stop from public.stops where id = v_report.stop_id for update;

  if p_validation_method = 'gps_velocity' then
    if p_current_lat is null or p_current_lng is null or p_speed_kmh is null then
      raise exception 'Faltan coordenadas o velocidad GPS para validar el abordaje';
    end if;

    v_distance_m := 6371000 * 2 * asin(
      sqrt(
        power(sin(radians(p_current_lat - v_stop.lat) / 2), 2) +
        cos(radians(v_stop.lat)) * cos(radians(p_current_lat)) *
        power(sin(radians(p_current_lng - v_stop.lng) / 2), 2)
      )
    );

    if v_distance_m < 150 or p_speed_kmh < 15 then
      raise exception 'Prueba de viaje insuficiente: necesitas >150m desde la parada y >15 km/h';
    end if;

  elsif p_validation_method = 'qr_scan' then
    if p_unit_code is null or not exists (
      select 1 from public.active_units where upper(unit_code) = upper(p_unit_code) and is_active = true
    ) then
      raise exception 'Código QR de unidad inválido o fuera de servicio';
    end if;
  else
    raise exception 'Método de validación inválido';
  end if;

  -- Marcar reporte como confirmado
  update public.queue_reports
  set
    status = 'confirmed',
    validation_method = p_validation_method,
    validated_unit_code = upper(p_unit_code),
    confirmed_lat = p_current_lat,
    confirmed_lng = p_current_lng,
    confirmed_speed_kmh = p_speed_kmh,
    confirmed_at = now()
  where id = v_report.id;

  -- Restar 1 de la fila de la parada (sin bajar de 0)
  update public.stops
  set
    waiting_count = greatest(waiting_count - 1, 0),
    updated_at = now()
  where id = v_report.stop_id;

  -- Transferir puntos de pendientes a confirmados
  update public.profiles
  set
    confirmed_points = confirmed_points + v_report.points_awarded,
    pending_points = greatest(pending_points - v_report.points_awarded, 0),
    updated_at = now()
  where id = v_user_id
  returning confirmed_points, pending_points into v_new_confirmed, v_new_pending;

  return jsonb_build_object(
    'success', true,
    'points_confirmed', v_report.points_awarded,
    'confirmed_points', v_new_confirmed,
    'pending_points', v_new_pending,
    'distance_m', round(v_distance_m)
  );
end;
$$;

-- RPC 3: redeem_merchant_offer
-- Verifica saldo atómicamente, descuenta puntos confirmados, crea registro en redemptions
-- con expiración exacta a 3 minutos y devuelve código alfanumérico único de 6 dígitos.
create or replace function public.redeem_merchant_offer(
  p_merchant_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_merchant record;
  v_profile record;
  v_code text;
  v_expires_at timestamptz := now() + interval '3 minutes';
  v_redemption_id uuid;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i integer;
begin
  if v_user_id is null then
    raise exception 'Usuario no autenticado';
  end if;

  select * into v_merchant
  from public.merchants
  where id = p_merchant_id and is_active = true;

  if not found then
    raise exception 'Comercio aliado u oferta no disponible';
  end if;

  -- Bloqueo pesimista sobre la fila del perfil para evitar doble gasto concurrente
  select * into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'Perfil de usuario no encontrado';
  end if;

  if v_profile.confirmed_points < v_merchant.points_cost then
    raise exception 'Saldo insuficiente: tienes % pts y necesitas % pts', v_profile.confirmed_points, v_merchant.points_cost;
  end if;

  -- Generar código alfanumérico único de 6 caracteres (sin ambigüedad 0/O/1/I)
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.redemptions where code = v_code);
  end loop;

  -- Descontar puntos confirmados atómicamente
  update public.profiles
  set
    confirmed_points = confirmed_points - v_merchant.points_cost,
    updated_at = now()
  where id = v_user_id;

  -- Crear boleto digital con expiración en 3 minutos
  insert into public.redemptions (user_id, merchant_id, code, points_spent, status, expires_at)
  values (v_user_id, v_merchant.id, v_code, v_merchant.points_cost, 'active', v_expires_at)
  returning id into v_redemption_id;

  return jsonb_build_object(
    'redemption_id', v_redemption_id,
    'code', v_code,
    'merchant_name', v_merchant.name,
    'offer_title', v_merchant.offer_title,
    'points_spent', v_merchant.points_cost,
    'remaining_points', v_profile.confirmed_points - v_merchant.points_cost,
    'expires_at', v_expires_at
  );
end;
$$;

-- Permisos de ejecución para usuarios autenticados
grant execute on function public.report_queue_checkin(uuid, double precision, double precision) to authenticated;
grant execute on function public.confirm_transit_points(uuid, text, double precision, double precision, double precision, text) to authenticated;
grant execute on function public.redeem_merchant_offer(uuid) to authenticated;

-- Habilitar publicación Realtime para mapa en vivo
alter publication supabase_realtime add table public.stops;
alter publication supabase_realtime add table public.active_units;

-- -----------------------------------------------------------------------------
-- 5. DATOS SEMILLA REALISTAS — CARACAS (AV. FRANCISCO DE MIRANDA)
-- -----------------------------------------------------------------------------

insert into public.stops (slug, name, zone, lat, lng, transport_types, waiting_count, metro_status)
values
  ('plaza-venezuela', 'Plaza Venezuela', 'Libertador · Torre La Previsora', 10.4962, -66.8856, array['camioneta', 'metro', 'metrobus'], 16, 'retraso'),
  ('chacaito', 'Chacaíto', 'Chacao · Bulevar de Sabana Grande', 10.4906, -66.8689, array['camioneta', 'metro', 'metrobus'], 11, 'fluido'),
  ('chacao', 'Chacao', 'Chacao · Torre Exa / Centro Lido', 10.4932, -66.8548, array['camioneta', 'metro', 'metrobus'], 7, 'fluido'),
  ('altamira', 'Altamira', 'Chacao · Plaza Francia', 10.4961, -66.8489, array['camioneta', 'metro', 'metrobus'], 3, 'fluido'),
  ('parque-cristal', 'Parque del Este / Miranda', 'Sucre · Parque Generalísimo F. de Miranda', 10.4959, -66.8364, array['camioneta', 'metro'], 9, 'fluido'),
  ('los-cortijos', 'Los Cortijos', 'Sucre · Av. Principal Los Cortijos', 10.4937, -66.8219, array['camioneta', 'metro', 'metrobus'], 14, 'fluido')
on conflict (slug) do update set
  waiting_count = excluded.waiting_count,
  metro_status = excluded.metro_status;

insert into public.active_units (unit_code, route_name, transport_type, lat, lng, speed_kmh, occupancy, is_active, pago_movil_bank, pago_movil_phone, pago_movil_id)
values
  ('UNIDAD-01', 'Av. Fco. de Miranda · Plz. Vzla ↔ Los Cortijos', 'camioneta', 10.4919, -66.8615, 28, 'libre', true, 'Banesco (0134)', '0412-555-0194', 'V-19.482.310'),
  ('UNIDAD-07', 'Av. Fco. de Miranda · Chacaíto ↔ Petare', 'camioneta', 10.4958, -66.8421, 22, 'de_pie', true, 'Mercantil (0105)', '0414-301-8842', 'V-15.203.991'),
  ('MB-402', 'Metrobús Ruta 221 · Altamira ↔ La Trinidad', 'metrobus', 10.4946, -66.8768, 25, 'full', true, 'BDV (0102)', '0416-712-3309', 'J-20001234-5')
on conflict (unit_code) do nothing;

insert into public.merchants (name, category, emoji, lat, lng, reference_stop, offer_title, offer_description, points_cost)
values
  ('Café & Cachitos El Bulevar', 'cafe', '☕', 10.4913, -66.8682, 'A 30m de Metro Chacaíto', 'Café Marrón + Cachito (-50%)', 'Presenta tu boleto digital en caja para recibir 50% de descuento en combo mañanero.', 25),
  ('Panadería La Esquina Cortijos', 'cafe', '🥐', 10.4944, -66.8226, 'A 40m de Metro Los Cortijos', 'Golfeado con Queso de Mano', 'Un golfeado recién horneado con queso de mano o café guayoyo gratis.', 30),
  ('Arepera Express Altamira', 'comida', '🍔', 10.4968, -66.8495, 'A 25m de Plaza Altamira', '2 Empanadas + Malta Fría', 'Canje instantáneo en barra rápida para pasajeros de RutaCaracas.', 35),
  ('Kiosco Conecta Plaza Vzla', 'saldo', '📱', 10.4969, -66.8849, 'A 20m de Torre La Previsora', 'Recarga 1 GB Digitel / Movistar', 'Recarga inmediata de datos móviles o saldo presentando tu código activo.', 40)
on conflict do nothing;
