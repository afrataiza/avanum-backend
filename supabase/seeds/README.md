# QA seed

The root `supabase/seed.sql` contains deterministic domain fixtures for local QA.

The fixture uses the fixed QA user UUID:

`00000000-0000-0000-0000-000000000018`

The database seed creates domain data for this UUID. The `./scripts/seed-qa.sh` command also provisions a matching local Supabase Auth user:

- email: `qa@avanum.local`
- display name: `Exploradora QA`
- default password: `avanum-local-qa`

For a different password, set `AVANUM_QA_PASSWORD` before running the script.

## Run

```bash
./scripts/seed-qa.sh
```

The script runs `supabase db reset`, then creates or updates the local Auth user through the local Supabase Auth admin API.

## Seeded domains

- books and user library
- physical and audiobook readings
- a completed ebook reading
- XP balance and transactions
- initial achievements
- active and completed expeditions
- partially unlocked map progress

The fixture is deterministic: repeated runs restore the same QA state.
