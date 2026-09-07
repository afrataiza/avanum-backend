create table public.user_xp (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_xp_total_xp_non_negative check (total_xp >= 0)
);

create table public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  source text not null,
  source_reference text,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  constraint xp_transactions_amount_positive check (amount > 0),
  constraint xp_transactions_idempotency_key_unique unique (idempotency_key)
);

create index xp_transactions_user_id_idx
  on public.xp_transactions(user_id);

create index xp_transactions_user_id_created_at_idx
  on public.xp_transactions(user_id, created_at desc);

alter table public.user_xp enable row level security;
alter table public.xp_transactions enable row level security;

create policy "Users can read own XP balance"
  on public.user_xp
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can read own XP transactions"
  on public.xp_transactions
  for select
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.user_xp from anon, authenticated;
revoke all on table public.xp_transactions from anon, authenticated;

grant select on table public.user_xp to authenticated;
grant select on table public.xp_transactions to authenticated;
