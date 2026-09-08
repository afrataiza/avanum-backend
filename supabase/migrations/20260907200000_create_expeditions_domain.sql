create type public.expedition_objective_type as enum (
  'books_completed',
  'pages_read',
  'minutes_listened'
);

create type public.expedition_status as enum (
  'active',
  'completed',
  'cancelled'
);

create table public.expeditions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  objective_type public.expedition_objective_type not null,
  target_value integer not null,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expeditions_name_non_empty check (length(trim(name)) > 0),
  constraint expeditions_target_positive check (target_value > 0),
  constraint expeditions_period_valid check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index expeditions_created_by_idx on public.expeditions(created_by);
create index expeditions_active_idx on public.expeditions(active);

create table public.user_expeditions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expedition_id uuid not null references public.expeditions(id) on delete cascade,
  current_value integer not null default 0,
  status public.expedition_status not null default 'active',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_expeditions_current_non_negative check (current_value >= 0),
  constraint user_expeditions_completed_at_consistent check (
    (status = 'completed' and completed_at is not null) or
    (status <> 'completed' and completed_at is null)
  ),
  constraint user_expeditions_cancelled_at_consistent check (
    (status = 'cancelled' and cancelled_at is not null) or
    (status <> 'cancelled' and cancelled_at is null)
  ),
  constraint user_expeditions_unique unique (user_id, expedition_id)
);

create index user_expeditions_user_id_idx on public.user_expeditions(user_id);
create index user_expeditions_user_status_idx on public.user_expeditions(user_id, status);

create table public.expedition_progress_events (
  id uuid primary key default gen_random_uuid(),
  user_expedition_id uuid not null references public.user_expeditions(id) on delete cascade,
  amount integer not null,
  source text not null,
  source_reference text,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  constraint expedition_progress_events_amount_positive check (amount > 0),
  constraint expedition_progress_events_source_non_empty check (length(trim(source)) > 0),
  constraint expedition_progress_events_idempotency_unique unique (user_expedition_id, idempotency_key)
);

create index expedition_progress_events_user_expedition_idx
  on public.expedition_progress_events(user_expedition_id, created_at desc);

alter table public.expeditions enable row level security;
alter table public.user_expeditions enable row level security;
alter table public.expedition_progress_events enable row level security;

create policy "Users can read own expeditions"
  on public.expeditions
  for select
  to authenticated
  using (created_by = auth.uid());

create policy "Users can read own expedition participation"
  on public.user_expeditions
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can read own expedition progress events"
  on public.expedition_progress_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_expeditions ue
      where ue.id = user_expedition_id
        and ue.user_id = auth.uid()
    )
  );

revoke all on table public.expeditions from anon, authenticated;
revoke all on table public.user_expeditions from anon, authenticated;
revoke all on table public.expedition_progress_events from anon, authenticated;

grant select on table public.expeditions to authenticated;
grant select on table public.user_expeditions to authenticated;
grant select on table public.expedition_progress_events to authenticated;

create or replace function public.create_expedition(
  p_user_id uuid,
  p_name text,
  p_description text,
  p_objective_type public.expedition_objective_type,
  p_target_value integer,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null
)
returns public.user_expeditions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expedition public.expeditions;
  v_user_expedition public.user_expeditions;
begin
  if p_user_id is null then raise exception 'User id is required'; end if;
  if p_name is null or length(trim(p_name)) = 0 then raise exception 'Expedition name is required'; end if;
  if p_target_value is null or p_target_value <= 0 then raise exception 'Expedition target must be positive'; end if;
  if p_ends_at is not null and p_starts_at is not null and p_ends_at <= p_starts_at then
    raise exception 'Expedition end must be after start';
  end if;

  insert into public.expeditions (created_by, name, description, objective_type, target_value, starts_at, ends_at)
  values (p_user_id, trim(p_name), nullif(trim(p_description), ''), p_objective_type, p_target_value, p_starts_at, p_ends_at)
  returning * into v_expedition;

  insert into public.user_expeditions (user_id, expedition_id)
  values (p_user_id, v_expedition.id)
  returning * into v_user_expedition;

  return v_user_expedition;
end;
$$;

create or replace function public.apply_expedition_progress(
  p_user_id uuid,
  p_user_expedition_id uuid,
  p_amount integer,
  p_source text,
  p_source_reference text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_expedition public.user_expeditions;
  v_expedition public.expeditions;
  v_event public.expedition_progress_events;
  v_new_value integer;
  v_completed boolean := false;
begin
  if p_user_id is null then raise exception 'User id is required'; end if;
  if p_user_expedition_id is null then raise exception 'User expedition id is required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Progress amount must be positive'; end if;
  if p_source is null or length(trim(p_source)) = 0 then raise exception 'Progress source is required'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then raise exception 'Idempotency key is required'; end if;

  select * into v_user_expedition
  from public.user_expeditions
  where id = p_user_expedition_id and user_id = p_user_id
  for update;

  if not found then raise exception 'Expedition not found'; end if;

  select * into v_expedition
  from public.expeditions
  where id = v_user_expedition.expedition_id;

  select * into v_event
  from public.expedition_progress_events
  where user_expedition_id = p_user_expedition_id
    and idempotency_key = p_idempotency_key;

  if found then
    return jsonb_build_object(
      'user_expedition', to_jsonb(v_user_expedition),
      'event', to_jsonb(v_event),
      'already_applied', true
    );
  end if;

  if v_user_expedition.status <> 'active' then
    raise exception 'Expedition is not active';
  end if;

  if v_expedition.starts_at is not null and now() < v_expedition.starts_at then
    raise exception 'Expedition has not started';
  end if;

  if v_expedition.ends_at is not null and now() > v_expedition.ends_at then
    raise exception 'Expedition has expired';
  end if;

  v_new_value := least(v_user_expedition.current_value + p_amount, v_expedition.target_value);
  v_completed := v_new_value >= v_expedition.target_value;

  insert into public.expedition_progress_events (
    user_expedition_id, amount, source, source_reference, idempotency_key
  ) values (
    p_user_expedition_id, p_amount, trim(p_source), p_source_reference, trim(p_idempotency_key)
  ) returning * into v_event;

  update public.user_expeditions
  set current_value = v_new_value,
      status = case when v_completed then 'completed'::public.expedition_status else status end,
      completed_at = case when v_completed then coalesce(completed_at, now()) else null end,
      updated_at = now()
  where id = p_user_expedition_id
  returning * into v_user_expedition;

  return jsonb_build_object(
    'user_expedition', to_jsonb(v_user_expedition),
    'event', to_jsonb(v_event),
    'already_applied', false
  );
end;
$$;

create or replace function public.cancel_expedition(
  p_user_id uuid,
  p_user_expedition_id uuid
)
returns public.user_expeditions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.user_expeditions;
begin
  update public.user_expeditions
  set status = 'cancelled', cancelled_at = now(), updated_at = now()
  where id = p_user_expedition_id
    and user_id = p_user_id
    and status = 'active'
  returning * into v_result;

  if not found then raise exception 'Active expedition not found'; end if;
  return v_result;
end;
$$;

revoke execute on function public.create_expedition(uuid, text, text, public.expedition_objective_type, integer, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.apply_expedition_progress(uuid, uuid, integer, text, text, text) from public, anon, authenticated;
revoke execute on function public.cancel_expedition(uuid, uuid) from public, anon, authenticated;

grant execute on function public.create_expedition(uuid, text, text, public.expedition_objective_type, integer, timestamptz, timestamptz) to service_role;
grant execute on function public.apply_expedition_progress(uuid, uuid, integer, text, text, text) to service_role;
grant execute on function public.cancel_expedition(uuid, uuid) to service_role;
