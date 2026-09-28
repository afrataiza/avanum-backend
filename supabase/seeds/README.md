# QA seed

The root `supabase/seed.sql` contains deterministic domain fixtures for local QA.

The fixture uses the fixed user UUID:

`00000000-0000-0000-0000-000000000018`

Supabase's SQL seed does not provision an Auth account through the public Auth API. For authenticated-flow testing, create a matching local Auth user separately and reuse this UUID.

The seeded domains cover books, user library, physical and audiobook readings, a completed ebook reading, XP, achievements, expeditions and map progress.

Run:

```bash
./scripts/seed-qa.sh
```

This runs `supabase db reset`, which executes the configured seed from `supabase/config.toml`.