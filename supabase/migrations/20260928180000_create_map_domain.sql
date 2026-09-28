create type public.map_node_status as enum (
  'locked',
  'discovered',
  'explored'
);

create type public.map_unlock_type as enum (
  'manual',
  'reading_started',
  'reading_completed',
  'achievement_granted',
  'expedition_completed'
);

create table public.map_regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint map_regions_slug_non_empty check (length(trim(slug)) > 0),
  constraint map_regions_name_non_empty check (length(trim(name)) > 0)
);

create index map_regions_sort_order_idx
  on public.map_regions(sort_order, id);

create table public.map_nodes (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.map_regions(id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  unlock_type public.map_unlock_type not null,
  unlock_reference text,
  position_x integer not null,
  position_y integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint map_nodes_slug_non_empty check (length(trim(slug)) > 0),
  constraint map_nodes_name_non_empty check (length(trim(name)) > 0)
);

create index map_nodes_region_sort_order_idx
  on public.map_nodes(region_id, sort_order, id);

create table public.user_map_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id uuid not null references public.map_nodes(id) on delete cascade,
  status public.map_node_status not null default 'locked',
  unlocked_at timestamptz,
  explored_at timestamptz,
  source text,
  source_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, node_id),
  constraint user_map_progress_discovered_consistent check (
    (status = 'locked' and unlocked_at is null and explored_at is null)
    or
    (status = 'discovered' and unlocked_at is not null and explored_at is null)
    or
    (status = 'explored' and unlocked_at is not null and explored_at is not null)
  )
);

create index user_map_progress_user_status_idx
  on public.user_map_progress(user_id, status);

alter table public.map_regions enable row level security;
alter table public.map_nodes enable row level security;
alter table public.user_map_progress enable row level security;

create policy "Authenticated users can read map regions"
  on public.map_regions
  for select
  to authenticated
  using (true);

create policy "Authenticated users can read map nodes"
  on public.map_nodes
  for select
  to authenticated
  using (true);

create policy "Users can read own map progress"
  on public.user_map_progress
  for select
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.map_regions from anon, authenticated;
revoke all on table public.map_nodes from anon, authenticated;
revoke all on table public.user_map_progress from anon, authenticated;

grant select on table public.map_regions to authenticated;
grant select on table public.map_nodes to authenticated;
grant select on table public.user_map_progress to authenticated;

create or replace function public.apply_map_node_progress(
  p_user_id uuid,
  p_node_id uuid,
  p_target_status public.map_node_status,
  p_source text default null,
  p_source_reference text default null
)
returns public.user_map_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.user_map_progress;
  v_result public.user_map_progress;
begin
  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  if p_node_id is null then
    raise exception 'Map node id is required';
  end if;

  select *
    into v_current
    from public.user_map_progress
   where user_id = p_user_id
     and node_id = p_node_id
   for update;

  if not found then
    insert into public.user_map_progress (
      user_id,
      node_id,
      status,
      unlocked_at,
      explored_at,
      source,
      source_reference
    )
    values (
      p_user_id,
      p_node_id,
      p_target_status,
      case when p_target_status in ('discovered', 'explored') then now() end,
      case when p_target_status = 'explored' then now() end,
      p_source,
      p_source_reference
    )
    returning * into v_result;

    return v_result;
  end if;

  if v_current.status = p_target_status
     or (v_current.status = 'explored' and p_target_status = 'discovered')
     or (v_current.status = 'discovered' and p_target_status = 'locked') then
    return v_current;
  end if;

  if v_current.status = 'locked' and p_target_status = 'explored' then
    update public.user_map_progress
       set status = 'explored',
           unlocked_at = coalesce(unlocked_at, now()),
           explored_at = coalesce(explored_at, now()),
           source = coalesce(p_source, source),
           source_reference = coalesce(p_source_reference, source_reference),
           updated_at = now()
     where user_id = p_user_id
       and node_id = p_node_id
     returning * into v_result;

    return v_result;
  end if;

  if v_current.status = 'locked' and p_target_status = 'discovered' then
    update public.user_map_progress
       set status = 'discovered',
           unlocked_at = coalesce(unlocked_at, now()),
           source = coalesce(p_source, source),
           source_reference = coalesce(p_source_reference, source_reference),
           updated_at = now()
     where user_id = p_user_id
       and node_id = p_node_id
     returning * into v_result;

    return v_result;
  end if;

  if v_current.status = 'discovered' and p_target_status = 'explored' then
    update public.user_map_progress
       set status = 'explored',
           explored_at = coalesce(explored_at, now()),
           source = coalesce(p_source, source),
           source_reference = coalesce(p_source_reference, source_reference),
           updated_at = now()
     where user_id = p_user_id
       and node_id = p_node_id
     returning * into v_result;

    return v_result;
  end if;

  raise exception 'Invalid map progress transition';
end;
$$;

revoke execute on function public.apply_map_node_progress(uuid, uuid, public.map_node_status, text, text)
from public, anon, authenticated;
grant execute on function public.apply_map_node_progress(uuid, uuid, public.map_node_status, text, text)
to service_role;

insert into public.map_regions (
  slug,
  name,
  description,
  sort_order
)
values (
  'first-steps',
  'Primeiros Passos',
  'O início da jornada da Exploradora.',
  1
)
on conflict (slug) do nothing;

insert into public.map_nodes (
  region_id,
  slug,
  name,
  description,
  unlock_type,
  unlock_reference,
  position_x,
  position_y,
  sort_order
)
select
  r.id,
  v.slug,
  v.name,
  v.description,
  v.unlock_type::public.map_unlock_type,
  v.unlock_reference,
  v.position_x,
  v.position_y,
  v.sort_order
from public.map_regions r
cross join (
  values
    ('first-step', 'Primeiro Passo', 'O primeiro ponto da jornada.', 'reading_started', null, 80, 120, 1),
    ('first-reading', 'Primeira Leitura', 'O primeiro destino alcançado.', 'reading_completed', null, 180, 120, 2),
    ('first-discovery', 'Primeira Descoberta', 'Um marco ainda reservado para a integração de Descobertas.', 'achievement_granted', 'first_completion', 300, 90, 3),
    ('first-expedition', 'Primeira Expedição', 'Um marco reservado para a integração de Expedições.', 'expedition_completed', null, 420, 150, 4)
) as v(slug, name, description, unlock_type, unlock_reference, position_x, position_y, sort_order)
where r.slug = 'first-steps'
on conflict (slug) do nothing;

insert into public.user_map_progress (
  user_id,
  node_id,
  status
)
select
  u.id,
  n.id,
  'locked'
from auth.users u
cross join public.map_nodes n
on conflict (user_id, node_id) do nothing;
