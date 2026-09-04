create or replace function public.get_reading(
  p_user_id uuid,
  p_reading_id uuid
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
     and ub.user_id = p_user_id;

  if not found then
    raise exception 'Reading not found';
  end if;

  return v_reading;
end;
$$;

revoke execute on function public.get_reading(uuid, uuid) from public;
grant execute on function public.get_reading(uuid, uuid) to service_role;
