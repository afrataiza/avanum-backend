create table public.books (
  id uuid primary key default gen_random_uuid(),

  external_id text not null,
  title text not null,
  authors text[] not null default '{}',
  synopsis text,
  cover_url text,
  publication_year integer,
  categories text[] not null default '{}',
  language text,
  isbn10 text,
  isbn13 text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint books_external_id_unique
    unique (external_id)
);

create table public.user_books (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,

  status text not null default 'want_to_read',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_books_status_check
    check (
      status in (
        'want_to_read',
        'reading',
        'paused',
        'abandoned',
        'completed'
      )
    ),

  constraint user_books_user_book_unique
    unique (user_id, book_id)
);

create index user_books_user_id_idx
  on public.user_books(user_id);

create index user_books_user_status_idx
  on public.user_books(user_id, status);

alter table public.books enable row level security;
alter table public.user_books enable row level security;

create policy "Authenticated users can read books"
on public.books
for select
to authenticated
using (true);

create policy "Users can read their own library"
on public.user_books
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can add books to their library"
on public.user_books
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own library"
on public.user_books
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own library"
on public.user_books
for delete
to authenticated
using (user_id = auth.uid());