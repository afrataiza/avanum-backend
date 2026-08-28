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
begin
  -- Garante que o UserBook pertence ao usuário.
  select *
    into v_user_book
    from public.user_books
   where id = p_user_book_id
     and user_id = p_user_id
   for update;

  if not found then
    raise exception 'User book not found';
  end if;

  -- Não permite iniciar livros que não podem mais ser retomados.
  if v_user_book.status in ('completed', 'abandoned') then
    raise exception 'Book cannot be started with its current status';
  end if;

  -- A constraint da tabela também protege esse cenário,
  -- mas fazemos a validação explicitamente para retornar uma mensagem clara.
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
  returning *
    into v_reading;

  update public.user_books
     set status = 'reading',
         updated_at = now()
   where id = p_user_book_id;

  return v_reading;
end;
$$;

revoke execute
on function public.start_reading(uuid, uuid, text, integer)
from public;

grant execute
on function public.start_reading(uuid, uuid, text, integer)
to service_role;