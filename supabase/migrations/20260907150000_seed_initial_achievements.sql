insert into public.achievements (
  code,
  name,
  description,
  trigger,
  threshold,
  metadata,
  active
)
values
  (
    'first_reading',
    'Primeira aventura',
    'Inicie sua primeira leitura.',
    'reading_started',
    1,
    '{}'::jsonb,
    true
  ),
  (
    'first_completion',
    'Primeiro destino',
    'Conclua sua primeira leitura.',
    'books_completed',
    1,
    '{}'::jsonb,
    true
  ),
  (
    'five_books_completed',
    'Caminho percorrido',
    'Conclua 5 leituras.',
    'books_completed',
    5,
    '{}'::jsonb,
    true
  ),
  (
    'ten_books_completed',
    'Leitora incansável',
    'Conclua 10 leituras.',
    'books_completed',
    10,
    '{}'::jsonb,
    true
  ),
  (
    'twenty_five_books_completed',
    'Grande exploradora',
    'Conclua 25 leituras.',
    'books_completed',
    25,
    '{}'::jsonb,
    true
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  trigger = excluded.trigger,
  threshold = excluded.threshold,
  metadata = excluded.metadata,
  active = excluded.active,
  updated_at = now();
