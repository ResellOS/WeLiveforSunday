# We Live for Sundays (WLFS)

The official home of the WLFS dynasty fantasy football league — teams, history,
trophies, and an all-time record book. Data comes from the **Sleeper** public API
(live league data) and **Supabase** (curated history: champions, moments,
milestones, jerseys, KTC values).

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript** (strict)
- **Tailwind CSS** — custom WLFS metallic gold / navy design system
- **Supabase** (`@supabase/supabase-js`) — Postgres + Row Level Security
- **Sleeper REST API** — `https://api.sleeper.app/v1` (public, no auth)
- **date-fns** — date math / countdowns
- **tsx** + **dotenv** — TypeScript scripts (KTC updater, Sleeper smoke test)

## Project structure

```
app/                 App Router pages (/, /teams, /history, /trophy-room, /record-book)
components/          Header, Footer, SeasonSelector, SearchBar
lib/
  sleeper.ts         Typed Sleeper API client + 5-min in-memory cache
  supabase.ts        Browser (anon) client + server-only (service role) admin client
  mvp.ts             Shared season-MVP computation (used by Home/History/Trophy/Records)
  config.ts          Editable dates + static copy (trade deadline, rookie draft, etc.)
types/
  sleeper.ts         TypeScript types for Sleeper API responses
scripts/
  update-ktc-values.ts  Scrapes KeepTradeCut dynasty values -> Supabase
  test-sleeper.ts       Smoke-tests every Sleeper client function
supabase/
  migrations/        SQL schema (tables, indexes, RLS policies)
```

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Where to find it | Exposed to browser? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → `anon` `public` key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` key | **No — server only** |
| `SLEEPER_LEAGUE_ID` | Sleeper league URL: `sleeper.com/leagues/<ID>/…` | No |

The service role key bypasses Row Level Security — never expose it to the client.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local   # then fill in the values

# 3. Apply the database schema
#    Run supabase/migrations/0001_initial_schema.sql against your project via
#    the Supabase SQL Editor, the Supabase CLI, or the Supabase MCP server.

# 4. Verify the Sleeper client returns real data
npm run test:sleeper

# 5. (Optional) Load KeepTradeCut dynasty values
npm run update-ktc            # writes to Supabase
npm run update-ktc -- --dry-run  # fetch + parse only, no writes

# 6. Run the dev server
npm run dev
```

## Database

The schema (`supabase/migrations/0001_initial_schema.sql`) creates: `seasons`,
`notable_moments`, `league_milestones`, `championship_jerseys`, `retired_members`,
`ktc_values`, `manager_metadata`.

**RLS model:** every table has Row Level Security enabled with a single public
`SELECT` policy. There are no public write policies, so the anon key can read but
not write. All writes (migrations, the KTC updater, seeding history) must use the
service role key, which bypasses RLS.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint |
| `npm run test:sleeper` | Hit every Sleeper client function against `SLEEPER_LEAGUE_ID` |
| `npm run update-ktc` | Scrape KeepTradeCut values into `ktc_values` |

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel (framework auto-detected as Next.js — no extra config).
3. Add the four environment variables above in **Project → Settings → Environment Variables**.
4. Deploy.

> KeepTradeCut has no official API; `update-ktc` parses the public dynasty-rankings
> page. Run it manually or wire it to a scheduled job (e.g. Vercel Cron) to keep
> `ktc_values` fresh.
