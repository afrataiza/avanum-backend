create or replace function public.update_reading_progress(
  p_user_id uuid,
  p_reading_id uuid,
  p_current_units integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reading public.readings;
  v_user_book public.user_books;
  v_previous_units integer;
  v_delta_units integer;
  v_events jsonb := '[]'::jsonb;
  v_event_id text;

begin
  select r.*
    into v_reading
    from public.readings r
    join public.user_books ub on ub.id = r.user_book_id
   where r.id = p_reading_id
     and ub.user_id = p_user_id
   for update of r;

  if not found then
    raise exception 'Reading not found';
  end if;

  if v_reading.status <> 'reading' then
    raise exception 'Reading cannot be updated with its current status';
  end if;

  if p_current_units < v_reading.current_units then
    raise exception 'Reading progress cannot decrease';
  end if;

  if p_current_units > v_reading.total_units then
    raise exception 'Current progress cannot exceed total units';
  end if;

  v_previous_units := v_reading.current_units;

  if p_current_units = v_previous_units then
    return jsonb_build_object(
      'reading', to_jsonb(v_reading),
      'events', '[]'::jsonb
    );
  end if;

  v_delta_units := p_current_units - v_previous_units;

  if p_current_units = v_reading.total_units then
    update public.readings
       set current_units = p_current_units,
           status = 'completed',
           completed_at = now(),
           updated_at = now()
     where id = p_reading_id
     returning * into v_reading;

    update public.user_books
       set status = 'completed',
           updated_at = now()
     where id = v_reading.user_book_id
     returning * into v_user_book;
  else
    update public.readings
       set current_units = p_current_units,
           updated_at = now()
     where id = p_reading_id
     returning * into v_reading;
  end if;

  for v_milestone in 1..10 loop
    if v_previous_units * 10 < v_reading.total_units * v_milestone
       and p_current_units * 10 >= v_reading.total_units * v_milestone then
      select public.grant_xp(
        p_user_id,
        5,
        'reading_progress_milestone',
        v_reading.id::text,
        'reading:' || v_reading.id::text || ':progress:' || (v_milestone * 10)::text
      ) into v_xp;
    end if;
  end loop;

  if v_reading.status = 'completed' then
    select public.grant_xp(
      p_user_id,
      50,
      'reading_completed',
      v_reading.id::text,
      'reading:' || v_reading.id::text || ':completed'
    ) into v_xp;
  end if;

  v_event_id := gen_random_uuid()::text;
  v_events := v_events || jsonb_build_array(
    jsonb_build_object(
      'eventId', v_event_id,
      'type', 'reading_progressed',
      'userId', p_user_id::text,
      'readingId', v_reading.id::text,
      'userBookId', v_reading.user_book_id::text,
      'mediaType', v_reading.format,
      'previousUnits', v_previous_units,
      'currentUnits', p_current_units,
      'deltaUnits', v_delta_units,
      'occurredAt', v_reading.updated_at
    )
  );

  if v_reading.status = 'completed' then
    v_event_id := gen_random_uuid()::text;
    v_events := v_events || jsonb_build_array(
      jsonb_build_object(
        'eventId', v_event_id,
        'type', 'reading_completed',
        'userId', p_user_id::text,
        'readingId', v_reading.id::text,
        'userBookId', v_reading.user_book_id::text,
        'mediaType', v_reading.format,
        'occurredAt', coalesce(v_reading.completed_at, v_reading.updated_at)
      )
    );
  end if;

  return jsonb_build_object(
    'reading', to_jsonb(v_reading),
    'events', v_events
  );
end;
$$;

revoke execute
on function public.update_reading_progress(uuid, uuid, integer)
from public;

grant execute
on function public.update_reading_progress(uuid, uuid, integer)
to service_role;
