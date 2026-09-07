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
  v_effective_value integer;
  v_source_reading public.readings;
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

  if p_trigger = 'reading_started' then
    if p_source_reference is null then
      raise exception 'Source reference is required for reading_started';
    end if;

    select r.*
      into v_source_reading
      from public.readings r
      join public.user_books ub on ub.id = r.user_book_id
     where r.id = p_source_reference::uuid
       and ub.user_id = p_user_id;

    if not found then
      raise exception 'Source reading not found';
    end if;

    select count(*)::integer
      into v_effective_value
      from public.readings r
      join public.user_books ub on ub.id = r.user_book_id
     where ub.user_id = p_user_id;
  elsif p_trigger = 'books_completed' then
    if p_source_reference is null then
      raise exception 'Source reference is required for books_completed';
    end if;

    select r.*
      into v_source_reading
      from public.readings r
      join public.user_books ub on ub.id = r.user_book_id
     where r.id = p_source_reference::uuid
       and ub.user_id = p_user_id
       and r.status = 'completed'
       and ub.status = 'completed';

    if not found then
      raise exception 'Source reading is not a completed reading for this user';
    end if;

    select count(*)::integer
      into v_effective_value
      from public.user_books
     where user_id = p_user_id
       and status = 'completed';
  else
    v_effective_value := p_value;
  end if;

  for v_achievement in
    select *
      from public.achievements
     where active = true
       and trigger = p_trigger
       and threshold <= v_effective_value
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

revoke execute on function public.evaluate_achievements(uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.evaluate_achievements(uuid, text, integer, text) to service_role;

create or replace function public.handle_reading_started_achievement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'reading' then
    perform public.evaluate_achievements(
      (select ub.user_id from public.user_books ub where ub.id = new.user_book_id),
      'reading_started',
      1,
      new.id::text
    );
  end if;

  return new;
end;
$$;

create or replace function public.handle_completed_book_achievement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_reference text;
begin
  if new.status = 'completed' and old.status is distinct from new.status then
    select r.id::text
      into v_source_reference
      from public.readings r
     where r.user_book_id = new.id
       and r.status = 'completed'
     order by r.completed_at desc nulls last, r.updated_at desc
     limit 1;

    if v_source_reference is not null then
      perform public.evaluate_achievements(
        new.user_id,
        'books_completed',
        1,
        v_source_reference
      );
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.handle_reading_started_achievement() from public, anon, authenticated;
revoke execute on function public.handle_completed_book_achievement() from public, anon, authenticated;

drop trigger if exists reading_started_achievement_trigger
  on public.readings;

create trigger reading_started_achievement_trigger
after insert on public.readings
for each row
execute function public.handle_reading_started_achievement();

drop trigger if exists completed_book_achievement_trigger
  on public.user_books;

create trigger completed_book_achievement_trigger
after update of status on public.user_books
for each row
execute function public.handle_completed_book_achievement();
