alter table public.books
  add column catalog_synced_at timestamptz;

create table public.catalog_search_cache (
  id uuid primary key default gen_random_uuid(),
  query_key text not null unique,
  results jsonb not null default '[]'::jsonb,
  total integer not null default 0 check (total >= 0),
  cached_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint catalog_search_cache_results_array
    check (jsonb_typeof(results) = 'array')
);

create index catalog_search_cache_expires_at_idx
  on public.catalog_search_cache(expires_at);

alter table public.catalog_search_cache enable row level security;
