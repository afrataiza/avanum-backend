create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text not null,
  trigger text not null,
  threshold integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint achievements_code_unique unique (code),
  constraint achievements_trigger_non_empty check (length(trim(trigger)) > 0),
  constraint achievements_threshold_positive check (threshold > 0)
);

create index achievements_trigger_active_idx
  on public.achievements(trigger, active, threshold);

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  source_reference text,
  achieved_at timestamptz not null default now(),
  constraint user_achievements_unique unique (user_id, achievement_id)
);

create index user_achievements_user_id_idx
  on public.user_achievements(user_id);

create index user_achievements_user_id_achieved_at_idx
  on public.user_achievements(user_id, achieved_at desc);

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

create policy "Authenticated users can read active achievements"
  on public.achievements
  for select
  to authenticated
  using (active = true);

create policy "Users can read own achievements"
  on public.user_achievements
  for select
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.achievements from anon, authenticated;
revoke all on table public.user_achievements from anon, authenticated;

grant select on table public.achievements to authenticated;
grant select on table public.user_achievements to authenticated;

create or replace function public.grant_achievement(
  p_user_id uuid,
  p_achievement_id uuid,
  p_source_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_achievement public.achievements;
  v_user_achievement public.user_achievements;
  v_already_granted boolean := false;
begin
  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  if p_achievement_id is null then
    raise exception 'Achievement id is required';
  end if;

  select *
    into v_achievement
    from public.achievements
   where id = p_achievement_id
     and active = true;

  if not found then
    raise exception 'Achievement not found or inactive';
  end if;

  insert into public.user_achievements (
    user_id,
    achievement_id,
    source_reference
  )
  values (
    p_user_id,
    p_achievement_id,
    p_source_reference
  )
  on conflict (user_id, achievement_id) do nothing
  returning * into v_user_achievement;

  if not found then
    select *
      into v_user_achievement
      from public.user_achievements
     where user_id = p_user_id
       and achievement_id = p_achievement_id;
    v_already_granted := true;
  end if;

  return jsonb_build_object(
    'achievement', to_jsonb(v_achievement),
    'user_achievement', to_jsonb(v_user_achievement),
    'already_granted', v_already_granted
  );
end;
$$;

create or replace function public.evaluate_achievements(
  p_user_id uuid,
  p_trigger text,
  p_value integer,
  p_source_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_achievement public.achievements;
  v_result jsonb;
  v_granted jsonb := '[]'::jsonb;
  v_already_granted jsonb := '[]'::jsonb;
  v_already boolean;
  v_user_achievement public.user_achievements;
begin
  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  if p_trigger is null or length(trim(p_trigger)) = 0 then
    raise exception 'Achievement trigger is required';
  end if;

  if p_value is null or p_value < 0 then
    raise exception 'Achievement value must be a non-negative integer';
  end if;

  for v_achievement in
    select *
      from public.achievements
     where active = true
       and trigger = p_trigger
       and threshold <= p_value
     order by threshold asc, id asc
  loop
    v_result := public.grant_achievement(
      p_user_id,
      v_achievement.id,
      p_source_reference
    );

    v_user_achievement := jsonb_populate_record(
      null::public.user_achievements,
      v_result -> 'user_achievement'
    );
    v_already := coalesce((v_result ->> 'already_granted')::boolean, false);

    if v_already then
      v_already_granted := v_already_granted || jsonb_build_array(to_jsonb(v_user_achievement));
    else
      v_granted := v_granted || jsonb_build_array(to_jsonb(v_user_achievement));
    end if;
  end loop;

  return jsonb_build_object(
    'granted', v_granted,
    'already_granted', v_already_granted
  );
end;
$$;

revoke execute on function public.grant_achievement(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.evaluate_achievements(uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.grant_achievement(uuid, uuid, text) to service_role;
grant execute on function public.evaluate_achievements(uuid, text, integer, text) to service_role;
