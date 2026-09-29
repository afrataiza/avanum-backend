-- Avanum local QA seed
-- Deterministic domain fixtures for local development and QA.
--
-- Loaded by scripts/seed-qa.sh after local Auth provisioning.
-- Keep this file as SQL only (no psql metacommands).

do $$
begin
  if not exists (
    select 1 from auth.users where email = 'qa@avanum.local'
  ) then
    raise exception 'QA Auth user qa@avanum.local must exist before loading supabase/seed.sql';
  end if;
end $$;


-- 🌿 Elora receives a known explorer for local QA.
insert into public.books (
  id, external_id, title, authors, synopsis, cover_url,
  publication_year, categories, language, isbn10, isbn13
)
values
  ('10000000-0000-0000-0000-000000000001','qa-the-hobbit','The Hobbit',array['J. R. R. Tolkien'],'A QA fixture for a physical reading.',null,1937,array['Fantasy'],'en','0261102214','9780261102214'),
  ('10000000-0000-0000-0000-000000000002','qa-1984','1984',array['George Orwell'],'A QA fixture for a want-to-read ebook.',null,1949,array['Fiction','Dystopian'],'en','0451524934','9780451524935'),
  ('10000000-0000-0000-0000-000000000003','qa-project-hail-mary','Project Hail Mary',array['Andy Weir'],'A QA fixture for an audiobook reading.',null,2021,array['Science Fiction'],'en',null,'9780593135204'),
  ('10000000-0000-0000-0000-000000000004','qa-the-little-prince','The Little Prince',array['Antoine de Saint-Exupéry'],'A QA fixture for a completed reading.',null,1943,array['Fable','Classics'],'en','0156012197','9780156012195')
on conflict (id) do update set
  external_id=excluded.external_id,title=excluded.title,authors=excluded.authors,
  synopsis=excluded.synopsis,cover_url=excluded.cover_url,publication_year=excluded.publication_year,
  categories=excluded.categories,language=excluded.language,isbn10=excluded.isbn10,isbn13=excluded.isbn13,
  updated_at=now();

insert into public.user_books (id,user_id,book_id,status)
values
  ('20000000-0000-0000-0000-000000000001', (select id from auth.users where email = 'qa@avanum.local'),'10000000-0000-0000-0000-000000000001','reading'),
  ('20000000-0000-0000-0000-000000000002', (select id from auth.users where email = 'qa@avanum.local'),'10000000-0000-0000-0000-000000000002','want_to_read'),
  ('20000000-0000-0000-0000-000000000003', (select id from auth.users where email = 'qa@avanum.local'),'10000000-0000-0000-0000-000000000003','reading'),
  ('20000000-0000-0000-0000-000000000004', (select id from auth.users where email = 'qa@avanum.local'),'10000000-0000-0000-0000-000000000004','completed')
on conflict (id) do update set
  user_id=excluded.user_id,book_id=excluded.book_id,status=excluded.status,updated_at=now();

insert into public.readings (
  id,user_book_id,format,total_units,current_units,status,started_at,completed_at
)
values
  ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','physical',300,120,'reading','2026-09-01T09:00:00Z',null),
  ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003','audiobook',600,420,'reading','2026-09-02T09:00:00Z',null),
  ('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000004','ebook',180,180,'completed','2026-08-20T09:00:00Z','2026-08-22T18:00:00Z')
on conflict (id) do update set
  user_book_id=excluded.user_book_id,format=excluded.format,total_units=excluded.total_units,
  current_units=excluded.current_units,status=excluded.status,started_at=excluded.started_at,
  completed_at=excluded.completed_at,updated_at=now();

insert into public.user_xp (user_id,total_xp)
values ((select id from auth.users where email = 'qa@avanum.local'),85)
on conflict (user_id) do update set total_xp=excluded.total_xp,updated_at=now();

insert into public.xp_transactions (
  id,user_id,amount,source,source_reference,idempotency_key,created_at
)
values
  ('40000000-0000-0000-0000-000000000001',(select id from auth.users where email = 'qa@avanum.local'),10,'reading_started','30000000-0000-0000-0000-000000000001','qa:reading_started:1','2026-09-01T09:00:00Z'),
  ('40000000-0000-0000-0000-000000000002',(select id from auth.users where email = 'qa@avanum.local'),25,'reading_progress_milestone','30000000-0000-0000-0000-000000000001','qa:reading:1:progress:40','2026-09-05T09:00:00Z'),
  ('40000000-0000-0000-0000-000000000003',(select id from auth.users where email = 'qa@avanum.local'),50,'reading_completed','30000000-0000-0000-0000-000000000003','qa:reading_completed:1','2026-08-22T18:00:00Z')
on conflict (id) do update set
  user_id=excluded.user_id,amount=excluded.amount,source=excluded.source,source_reference=excluded.source_reference,
  idempotency_key=excluded.idempotency_key,created_at=excluded.created_at;

insert into public.user_achievements (id,user_id,achievement_id,source_reference,achieved_at)
select '50000000-0000-0000-0000-000000000001',(select id from auth.users where email = 'qa@avanum.local'),a.id,'qa:reading_started','2026-09-01T09:00:00Z'
from public.achievements a where a.code='first_reading'
on conflict (id) do update set
  user_id=excluded.user_id,achievement_id=excluded.achievement_id,source_reference=excluded.source_reference,achieved_at=excluded.achieved_at;

insert into public.user_achievements (id,user_id,achievement_id,source_reference,achieved_at)
select '50000000-0000-0000-0000-000000000002',(select id from auth.users where email = 'qa@avanum.local'),a.id,'qa:reading_completed','2026-08-22T18:00:00Z'
from public.achievements a where a.code='first_completion'
on conflict (id) do update set
  user_id=excluded.user_id,achievement_id=excluded.achievement_id,source_reference=excluded.source_reference,achieved_at=excluded.achieved_at;

insert into public.expeditions (
  id,created_by,name,description,objective_type,target_value,starts_at,ends_at,active
)
values
  ('60000000-0000-0000-0000-000000000001',(select id from auth.users where email = 'qa@avanum.local'),'Travessia QA','Expedição local para validar progressão de páginas.','pages_read',500,'2026-09-01T00:00:00Z','2026-12-31T23:59:59Z',true),
  ('60000000-0000-0000-0000-000000000002',(select id from auth.users where email = 'qa@avanum.local'),'Primeiro destino QA','Expedição local já concluída.','books_completed',1,'2026-08-01T00:00:00Z','2026-12-31T23:59:59Z',true)
on conflict (id) do update set
  created_by=excluded.created_by,name=excluded.name,description=excluded.description,
  objective_type=excluded.objective_type,target_value=excluded.target_value,starts_at=excluded.starts_at,
  ends_at=excluded.ends_at,active=excluded.active,updated_at=now();

insert into public.user_expeditions (
  id,user_id,expedition_id,current_value,status,started_at,completed_at,cancelled_at
)
values
  ('70000000-0000-0000-0000-000000000001',(select id from auth.users where email = 'qa@avanum.local'),'60000000-0000-0000-0000-000000000001',240,'active','2026-09-01T09:00:00Z',null,null),
  ('70000000-0000-0000-0000-000000000002',(select id from auth.users where email = 'qa@avanum.local'),'60000000-0000-0000-0000-000000000002',1,'completed','2026-08-20T09:00:00Z','2026-08-22T18:00:00Z',null)
on conflict (id) do update set
  user_id=excluded.user_id,expedition_id=excluded.expedition_id,current_value=excluded.current_value,
  status=excluded.status,started_at=excluded.started_at,completed_at=excluded.completed_at,
  cancelled_at=excluded.cancelled_at,updated_at=now();

insert into public.expedition_progress_events (
  id,user_expedition_id,amount,source,source_reference,idempotency_key,created_at
)
values
  ('80000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',240,'qa_seed','30000000-0000-0000-0000-000000000001','qa:expedition:pages:240','2026-09-05T12:00:00Z'),
  ('80000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000002',1,'qa_seed','30000000-0000-0000-0000-000000000003','qa:expedition:books:1','2026-08-22T18:00:00Z')
on conflict (id) do update set
  user_expedition_id=excluded.user_expedition_id,amount=excluded.amount,source=excluded.source,
  source_reference=excluded.source_reference,idempotency_key=excluded.idempotency_key,created_at=excluded.created_at;

-- 🗺️ The map wakes up with the known QA explorer.
insert into public.user_map_progress (
  user_id,node_id,status,unlocked_at,explored_at,source,source_reference
)
select
  (select id from auth.users where email = 'qa@avanum.local'),n.id,
  case n.slug
    when 'first-step' then 'explored'::public.map_node_status
    when 'first-reading' then 'discovered'::public.map_node_status
    else 'locked'::public.map_node_status
  end,
  case n.slug
    when 'first-step' then '2026-09-01T09:00:00Z'::timestamptz
    when 'first-reading' then '2026-08-22T18:00:00Z'::timestamptz
    else null
  end,
  case n.slug when 'first-step' then '2026-09-01T09:05:00Z'::timestamptz else null end,
  'qa_seed','qa:map'
from public.map_nodes n
where n.slug in ('first-step','first-reading','first-discovery','first-expedition')
on conflict (user_id,node_id) do update set
  status=excluded.status,unlocked_at=excluded.unlocked_at,explored_at=excluded.explored_at,
  source=excluded.source,source_reference=excluded.source_reference,updated_at=now();
