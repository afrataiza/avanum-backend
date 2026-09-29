# QA seed

The local QA bootstrap is split into an Auth fixture and deterministic domain fixtures.

- Auth user: `qa@avanum.local`
- Display name: `Exploradora QA`
- Default password: `avanum-local-qa`

For a different password, set `AVANUM_QA_PASSWORD`. The database bootstrap currently
uses the default password in the SQL fixture, so custom passwords are not applied by
the database-only bootstrap.

## Run

```bash
./scripts/seed-qa.sh
```

The script:

1. resets the local database without automatic seed execution;
2. creates or updates the local QA Auth user in the database;
3. loads `supabase/seed.sql` with the resulting Auth user.

The QA SQL files are intentionally batch SQL. Do not use `psql` metacommands such as
`\set` or `\i`.

## Seeded domains

- books and user library
- physical and audiobook readings
- a completed ebook reading
- XP balance and transactions
- initial achievements
- active and completed expeditions
- partially unlocked map progress

The fixture is deterministic: repeated runs restore the same QA state.
