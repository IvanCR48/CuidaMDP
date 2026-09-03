-- ==========================================
-- ESQUEMA DE BASE DE DATOS PARA CUIDAMDP
-- ==========================================
-- Ejecuta este código en el editor SQL de Supabase (SQL Editor -> New Query)

-- 1. Crear tabla de reportes
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  category text not null,
  description text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  status text default 'pending'::text check (status in ('pending', 'in_progress', 'resolved')) not null,
  votes_count integer default 0 not null,
  images text[] default '{}'::text[] not null,
  resolved_image text,
  resolved_at timestamp with time zone,
  neighborhood text not null,
  
  -- Columnas de seguridad y control de límites
  ip_address text,
  client_id uuid
);

-- 2. Crear tabla de votos
create table if not exists public.votes (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  voter_id uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (report_id, voter_id)
);

-- 3. Crear tabla de IPs baneadas
create table if not exists public.banned_ips (
  ip_address text primary key,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Habilitar la seguridad a nivel de filas (RLS - Row Level Security)
alter table public.reports enable row level security;
alter table public.votes enable row level security;
alter table public.banned_ips enable row level security;

-- 5. Crear políticas de acceso para la tabla 'reports'
-- Permitir que cualquiera lea los reportes cívicos
create policy "Cualquiera puede ver reportes" 
  on public.reports for select 
  using (true);

-- Permitir que cualquiera cree reportes cívicos
create policy "Cualquiera puede crear reportes" 
  on public.reports for insert 
  with check (true);

-- Solo los empleados autenticados pueden actualizar reportes (cambiar a 'en proceso', 'resuelto', etc.)
create policy "Empleados pueden actualizar reportes" 
  on public.reports for update 
  to authenticated
  using (true)
  with check (true);

-- Solo los empleados (usuarios autenticados en Supabase) pueden borrar reportes
create policy "Empleados pueden borrar reportes" 
  on public.reports for delete 
  to authenticated
  using (true);

-- 6. Crear políticas de acceso para la tabla 'votes'
create policy "Cualquiera puede ver votos" 
  on public.votes for select 
  using (true);

create policy "Cualquiera puede votar" 
  on public.votes for insert 
  with check (true);

-- 7. Crear políticas de acceso para la tabla 'banned_ips'
-- La lista de IPs baneadas es privada (solo accesible por personal municipal autenticado)
create policy "Empleados pueden gestionar baneos"
  on public.banned_ips for all
  to authenticated
  using (true)
  with check (true);

-- 8. Disparador para actualizar automáticamente el contador de votos
create or replace function public.increment_votes_count()
returns trigger as $$
begin
  update public.reports
  set votes_count = votes_count + 1
  where id = new.report_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_vote_added
  after insert on public.votes
  for each row
  execute function public.increment_votes_count();

-- 9. Función para validar límites de reporte (max 3 por día) y verificar baneos
create or replace function public.check_report_limits()
returns trigger as $$
declare
  reports_count integer;
begin
  -- A. Verificar si la IP está baneada
  if new.ip_address is not null and exists (
    select 1 from public.banned_ips where ip_address = new.ip_address
  ) then
    raise exception 'La dirección IP % ha sido bloqueada por comportamiento inadecuado o spam.', new.ip_address;
  end if;

  -- B. Verificar límite de 3 reportes por IP o client_id en las últimas 24 horas
  select count(*) into reports_count
  from public.reports
  where (
    (ip_address = new.ip_address and new.ip_address is not null)
    or (client_id = new.client_id and new.client_id is not null)
  )
  and created_at > now() - interval '24 hours';

  if reports_count >= 3 then
    raise exception 'Has alcanzado el límite diario de 3 reportes por usuario/IP. Por favor, inténtalo de nuevo mañana.';
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger para ejecutar la función de seguridad antes de insertar en 'reports'
create or replace trigger before_report_inserted
  before insert on public.reports
  for each row
  execute function public.check_report_limits();

-- 10. Índices B-Tree de alto rendimiento para escalabilidad
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_neighborhood on public.reports(neighborhood);
create index if not exists idx_reports_created_at on public.reports(created_at desc);
create index if not exists idx_votes_report_id on public.votes(report_id);
create index if not exists idx_reports_ip_client on public.reports(ip_address, client_id, created_at);
