# QA seed

The root `supabase/seed.sql` contains deterministic domain fixtures for local QA.

The QA fixture user is identified by email, not by a hard-coded Auth UUID:

- email: `qa@avanum.local`
- display name: `Exploradora QA`
- default password: `avanum-local-qa`

The Auth user is created or updated through the local Supabase Auth admin API before the domain fixtures are loaded.

For a different password, set `AVANUM_QA_PASSWORD` before running the script.

## Run

```bash
./scripts/seed-qa.sh
```

The script:

1. resets the local database without automatic seed execution;
2. provisions the local QA Auth user;
3. loads `supabase/seed.sql` through the Supabase database client.

The seed file is intentionally SQL-only. Do not use `psql` metacommands such as `\set` or `\i` in it.

## Seeded domains

- books and user library
- physical and audiobook readings
- a completed ebook reading
- XP balance and transactions
- initial achievements
- active and completed expeditions
- partially unlocked map progress

The fixture is deterministic: repeated runs restore the same QA state.
