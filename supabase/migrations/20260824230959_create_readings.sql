create table public.readings (
  id uuid primary key default gen_random_uuid(),

  user_book_id uuid not null
    references public.user_books(id)
    on delete cascade,

  format text not null,

  total_units integer not null,
  current_units integer not null default 0,

  status text not null default 'reading',

  started_at timestamptz not null default now(),
  paused_at timestamptz,
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint readings_format_check
    check (
      format in (
        'physical',
        'ebook',
        'audiobook'
      )
    ),

  constraint readings_status_check
    check (
      status in (
        'reading',
        'paused',
        'abandoned',
        'completed'
      )
    ),

  constraint readings_total_units_positive
    check (total_units > 0),

  constraint readings_current_units_valid
    check (
      current_units >= 0
      and current_units <= total_units
    )
);

create index readings_user_book_id_idx
  on public.readings(user_book_id);

create unique index readings_one_active_per_user_book_idx
  on public.readings(user_book_id)
  where status in ('reading', 'paused');

alter table public.readings enable row level security;

create policy "Users can read their own readings"
on public.readings
for select
to authenticated
using (
  exists (
    select 1
    from public.user_books
    where user_books.id = readings.user_book_id
      and user_books.user_id = auth.uid()
  )
);

create policy "Users can create their own readings"
on public.readings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_books
    where user_books.id = readings.user_book_id
      and user_books.user_id = auth.uid()
  )
);

create policy "Users can update their own readings"
on public.readings
for update
to authenticated
using (
  exists (
    select 1
    from public.user_books
    where user_books.id = readings.user_book_id
      and user_books.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.user_books
    where user_books.id = readings.user_book_id
      and user_books.user_id = auth.uid()
  )
);



