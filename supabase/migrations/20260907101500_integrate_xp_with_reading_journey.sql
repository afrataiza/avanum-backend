create or replace function public.grant_xp(
  p_user_id uuid,
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
  v_transaction public.xp_transactions;
  v_total_xp integer;
  v_already_granted boolean := false;
begin
  if p_amount <= 0 then
    raise exception 'XP amount must be positive';
  end if;

  if p_idempotency_key is null or p_idempotency_key = '' then
    raise exception 'XP idempotency key is required';
  end if;

  select *
    into v_transaction
    from public.xp_transactions
   where idempotency_key = p_idempotency_key;

  if found then
    if v_transaction.user_id <> p_user_id then
      raise exception 'XP idempotency key belongs to another user';
    end if;

    v_already_granted := true;
  else
    insert into public.xp_transactions (
      user_id,
      amount,
      source,
      source_reference,
      idempotency_key
    )
    values (
      p_user_id,
      p_amount,
      p_source,
      p_source_reference,
      p_idempotency_key
    )
    returning * into v_transaction;

    insert into public.user_xp (user_id, total_xp, updated_at)
    values (p_user_id, p_amount, now())
    on conflict (user_id)
    do update set
      total_xp = public.user_xp.total_xp + excluded.total_xp,
      updated_at = now();
  end if;

  select total_xp
    into v_total_xp
    from public.user_xp
   where user_id = p_user_id;

  return jsonb_build_object(
    'transaction', to_jsonb(v_transaction),
    'total_xp', coalesce(v_total_xp, 0),
    'already_granted', v_already_granted
  );
end;
$$;

revoke execute
on function public.grant_xp(uuid, integer, text, text, text)
from public;

grant execute
on function public.grant_xp(uuid, integer, text, text, text)
to service_role;

create or replace function public.start_reading(
  p_user_id uuid,
  p_user_book_id uuid,
  p_format text,
  p_total_units integer
)
returns public.readings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_book public.user_books;
  v_reading public.readings;
  v_xp jsonb;
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

  select public.grant_xp(
    p_user_id,
    10,
    'reading_started',
    v_reading.id::text,
    'reading:' || v_reading.id::text || ':started'
  ) into v_xp;

  return v_reading;
end;
$$;

revoke execute
on function public.start_reading(uuid, uuid, text, integer)
from public;

grant execute
on function public.start_reading(uuid, uuid, text, integer)
to service_role;

create or replace function public.update_reading_progress(
  p_user_id uuid,
  p_reading_id uuid,
  p_current_units integer
)
returns public.readings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reading public.readings;
  v_user_book public.user_books;
  v_previous_units integer;
  v_milestone integer;
  v_xp jsonb;
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

  return v_reading;
end;
$$;

revoke execute
on function public.update_reading_progress(uuid, uuid, integer)
from public;

grant execute
on function public.update_reading_progress(uuid, uuid, integer)
to service_role;
