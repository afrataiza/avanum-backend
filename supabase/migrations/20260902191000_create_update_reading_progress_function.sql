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
begin
  -- Localiza a leitura e garante ownership através do UserBook.
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

  -- Somente leituras em andamento podem receber progresso.
  if v_reading.status <> 'reading' then
    raise exception 'Reading cannot be updated with its current status';
  end if;

  -- O progresso é absoluto e nunca pode diminuir.
  if p_current_units < v_reading.current_units then
    raise exception 'Reading progress cannot decrease';
  end if;

  if p_current_units > v_reading.total_units then
    raise exception 'Current progress cannot exceed total units';
  end if;

  -- Ao atingir o total, conclui Reading e UserBook na mesma transação.
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

  return v_reading;
end;
$$;

revoke execute
on function public.update_reading_progress(uuid, uuid, integer)
from public;

grant execute
on function public.update_reading_progress(uuid, uuid, integer)
to service_role;
