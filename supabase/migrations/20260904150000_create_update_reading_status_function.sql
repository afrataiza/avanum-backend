create or replace function public.update_reading_status(
  p_user_id uuid,
  p_reading_id uuid,
  p_status text
)
returns public.readings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reading public.readings;
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

  if p_status not in ('reading', 'paused', 'abandoned') then
    raise exception 'Invalid reading status';
  end if;

  if v_reading.status = 'completed' then
    raise exception 'Completed reading cannot change status';
  end if;

  if v_reading.status = 'abandoned' then
    raise exception 'Abandoned reading cannot change status';
  end if;

  if v_reading.status = 'reading' and p_status = 'reading' then
    raise exception 'Reading is already active';
  end if;

  if v_reading.status = 'paused' and p_status = 'paused' then
    raise exception 'Reading is already paused';
  end if;

  if p_status = 'paused' then
    update public.readings
       set status = 'paused',
           paused_at = now(),
           updated_at = now()
     where id = p_reading_id
     returning * into v_reading;

    update public.user_books
       set status = 'paused',
           updated_at = now()
     where id = v_reading.user_book_id;
  elsif p_status = 'reading' then
    update public.readings
       set status = 'reading',
           paused_at = null,
           updated_at = now()
     where id = p_reading_id
     returning * into v_reading;

    update public.user_books
       set status = 'reading',
           updated_at = now()
     where id = v_reading.user_book_id;
  else
    update public.readings
       set status = 'abandoned',
           paused_at = null,
           updated_at = now()
     where id = p_reading_id
     returning * into v_reading;

    update public.user_books
       set status = 'abandoned',
           updated_at = now()
     where id = v_reading.user_book_id;
  end if;

  return v_reading;
end;
$$;

revoke execute
on function public.update_reading_status(uuid, uuid, text)
from public;

grant execute
on function public.update_reading_status(uuid, uuid, text)
to service_role;
