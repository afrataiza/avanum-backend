create or replace function public.start_reading(
  p_user_id uuid,
  p_user_book_id uuid,
  p_format text,
  p_total_units integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_book public.user_books;
  v_reading public.readings;
begin
  select *
    into v_user_book
    from public.user_books
   where id = p_user_book_id
     and user_id = p_user_id
   for update;

  if not found then
    raise exception 'User book not found';
  end if;

  if v_user_book.status in ('completed', 'abandoned') then
    raise exception 'Book cannot be started with its current status';
  end if;

  if exists (
    select 1
      from public.readings
     where user_book_id = p_user_book_id
       and status in ('reading', 'paused')
  ) then
    raise exception 'User book already has an active reading';
  end if;

  insert into public.readings (
    user_book_id,
    format,
    total_units,
    current_units,
    status
  )
  values (
    p_user_book_id,
    p_format,
    p_total_units,
    0,
    'reading'
  )
  returning * into v_reading;

  update public.user_books
     set status = 'reading',
         updated_at = now()
   where id = p_user_book_id;

  return jsonb_build_object(
    'reading', to_jsonb(v_reading),
    'events', jsonb_build_array(
      jsonb_build_object(
        'eventId', gen_random_uuid()::text,
        'type', 'reading_started',
        'userId', p_user_id::text,
        'readingId', v_reading.id::text,
        'userBookId', v_reading.user_book_id::text,
        'mediaType', v_reading.format,
        'occurredAt', v_reading.started_at
      )
    )
  );
end;
$$;

revoke execute
on function public.start_reading(uuid, uuid, text, integer)
from public;

grant execute
on function public.start_reading(uuid, uuid, text, integer)
to service_role;
