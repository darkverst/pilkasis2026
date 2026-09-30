# Deploy Guide — Pemilihan OSIS Digital

This guide walks you through deploying the **OSIS Election app** to production
on **Vercel** (Next.js app) + **Neon** (Postgres database). An optional
**real-time socket.io service** can be deployed separately for live-vote push.

The app is a Next.js 16 + Three.js + Prisma application. Local dev uses SQLite;
production uses Postgres. The Prisma schema is identical between the two
(`prisma/schema.prisma` for SQLite dev, `prisma/schema.prod.prisma` for Postgres
prod — the only difference is the `provider` field).

---

## 0. Prerequisites

- A GitHub account and a fork/copy of this repo.
- A [Neon](https://neon.tech) account (free tier is fine for ≤600 concurrent
  voters — see **Free Tier Limits** below).
- A [Vercel](https://vercel.com) account.
- (Optional, for real-time push) A host that can run a long-lived Node/Bun
  process for the socket.io mini-service — Render, Railway, Fly.io, or a small
  VPS. Without this, the app still works, it just polls for results instead
  of receiving push updates (see **Real-time fallback** below).

---

## 1. Push the project to GitHub

```bash
git init
git add .
git commit -m "Initial commit — OSIS election app"
git branch -M main
git remote add origin https://github.com/<you>/osis-election.git
git push -u origin main
```

> The `.vercelignore` already excludes `mini-services/`, `seed-assets/`,
> `db/`, `skills/`, `examples/`, `tests/`, `*.log`, `DEPLOY.md`, etc., so the
> Vercel deployment only uploads the Next.js app code.

---

## 2. Create the Neon Postgres database

1. Sign up at [neon.tech](https://neon.tech) and create a new project.
2. In the project dashboard, open the **Connection Details** panel.
3. Copy the **pooler** connection string. It will look like:
   ```
   postgresql://<user>:<password>@ep-<id>-pooler.<region>.aws.neon.tech/<dbname>?sslmode=require&pgbouncer=true
   ```
   The hostname **must contain `-pooler`**. The `pgbouncer=true` query param
   is **required** — without it, serverless functions will fail with
   `max_connections exceeded` under load. Neon's free tier caps direct
   (non-pooler) connections at ~5–10, but the pooler handles thousands of
   short-lived serverless connections fine.
4. Save the connection string — you'll paste it into Vercel in step 3.

---

## 3. Import the project into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and **Import** your GitHub
   repo.
2. Vercel auto-detects Next.js (the `vercel.json` confirms:
   `framework: nextjs`, `installCommand: bun install`,
   `buildCommand: bun run vercel-build`).
3. Open **Environment Variables** and add:

   | Key | Value | Notes |
   |---|---|---|
   | `DATABASE_URL` | `postgresql://...?sslmode=require&pgbouncer=true` | Neon pooler URL from step 2 |
   | `ADMIN_PASSWORD` | `panitia2025` (or set your own) | Login password for the Admin tab |
   | `SOCKET_SERVICE_URL` | *(optional)* `https://vote.example.com/internal/notify` | Only if you deploy the socket service (step 5) |
   | `NEXT_PUBLIC_SOCKET_URL` | *(optional)* `https://vote.example.com` | The public URL browsers use to open the WS |

4. Click **Deploy**. The build runs:
   ```bash
   bun install
   prisma generate --schema=./prisma/schema.prod.prisma
   prisma db push --schema=./prisma/schema.prod.prisma --accept-data-loss
   next build
   ```
   The `prisma db push` step creates all tables in your Neon database. Wait
   for the build to finish (first build takes ~2 min).

---

## 4. Seed the production database (via the app UI)

After deploy, the Neon database is **empty** (no settings row, no candidates,
no voters). You can populate everything from the in-app admin dashboard:

1. Visit the deployed URL, open the **Admin** tab.
2. Log in with the `ADMIN_PASSWORD` you set in Vercel.
3. **Settings tab**: edit school name / election title / start-end times.
4. **Candidates tab**: add each candidate (name, class, photo, vision,
   mission, accent color). For a *pair* (Ketua + Wakil), tick **Pasangan**
   and fill in the partner's name, class, and photo.
5. **Tokens tab**: generate voter tokens. Use **batch generate** with
   `count` ≤ 500 per batch (e.g. 80 students + 10 teachers). Print/export
   the CSV and distribute tokens to voters.

> Alternatively, if you have shell access to a machine with the repo
> checked out, you can run the seed script locally against the production
> DB by temporarily setting `DATABASE_URL` to the Neon pooler URL and
> running `bun run db:use-postgres && bun run db:push && bun run seed-assets/seed.ts`.
> This is convenient for testing but **not** the recommended path for a
> live election — voters shouldn't see pre-cast votes.

---

## 5. (Optional) Deploy the real-time socket.io service

The Next.js app posts to `/internal/notify` whenever a vote is cast or an
admin change is made. That endpoint is provided by a separate long-lived
socket.io process in `mini-services/vote-service/`. Vercel cannot host it
(serverless functions have a 10–60s cap and can't hold open WebSockets).

**Pick one of these hosts** (all have free tiers):

- **Render** — easiest; create a "Web Service" from the same repo, root
  directory `mini-services/vote-service/`, build `bun install`, start
  `bun run dev`. Render gives you a stable `https://<name>.onrender.com` URL.
- **Railway** — similar; deploy from GitHub, set the root to
  `mini-services/vote-service/`, expose port `3003`.
- **Fly.io** — needs a Dockerfile, but is the most generous free tier for
  long-lived processes.
- **VPS** — `git clone` + `cd mini-services/vote-service && bun install && bun run dev`
  behind a reverse proxy (Caddy/Nginx) that terminates TLS on port 443.

**Set env vars on the socket service**:
- `DATABASE_URL` — the same Neon pooler URL you used for Vercel.

**Then back in Vercel** set:
- `SOCKET_SERVICE_URL=https://<your-socket-host>/internal/notify`
- `NEXT_PUBLIC_SOCKET_URL=https://<your-socket-host>`

Redeploy the Vercel app and the Results page will show a "Terhubung" badge
when the WebSocket connects.

---

## Real-time fallback (if no socket service)

If `SOCKET_SERVICE_URL` and `NEXT_PUBLIC_SOCKET_URL` are **both unset**:

- `src/lib/socket-client.ts → getSocket()` returns `null`.
- `src/lib/socket-notify.ts → notifyVoteCast()` and `notifyAdminChange()`
  become no-ops (the env-var gate `SOCKET_ENABLED` is false in production
  without `SOCKET_SERVICE_URL`).
- The Results page detects `socket === null` and switches to HTTP polling:
  it calls `GET /api/results` every 4 seconds and updates the bar chart /
  leaderboard / vote feed from the fresh DB read.

So a real-time socket service is **optional** — without it the app still
works correctly, just with a few seconds of latency on the live results.
For an election with ≤100 voters this is fine. For ≥600 concurrent voters
(see below), deploy the socket service.

---

## Free tier limits (≈600 concurrent voters)

These are the limits that matter for a school-wide OSIS election:

| Resource | Free tier | Implication |
|---|---|---|
| **Neon** Postgres storage | 0.5 GB | One row per vote — 1 000 votes ≈ a few MB. Fine. |
| **Neon** compute | Always-on smallest size, autosuspends after 5 min idle | Cold starts add ~1–2 s to the first request after idle. The pooler keeps connections alive. |
| **Neon** concurrent direct connections | ~22 | Use the pooler (`-pooler` hostname + `pgbouncer=true`) to bypass this. |
| **Vercel** serverless function invocations | 100 000 / day (hobby) | Each vote = 1 invocation; 1 000 votes ≈ 0.1% of the limit. |
| **Vercel** function execution time | 10 s (hobby) | Our routes return in <300 ms. |
| **Vercel** concurrent executions | 100 (hobby soft cap) | At 600 voters voting within a 10-minute window, peak concurrency is well under 100. |
| **WebSocket** (socket.io service on Render free) | 100 connections | Render free caps at ~100 concurrent WS clients; fine for ≤600 voters since only "viewers" (not voters) hold WS open. For >100 live viewers, upgrade the socket-service host. |

**Bottom line**: the free tiers comfortably handle an OSIS election of
**600 voters** who all vote within a single class period (~45 min). For
larger elections, the only piece you may need to upgrade is the socket.io
service host (Render → paid, or self-host on a VPS).

---

## Troubleshooting

### Build fails on Vercel with `PrismaClientInitializationError`
- You forgot to set `DATABASE_URL` in the Vercel env vars, OR
- You used the **direct** Neon URL instead of the **pooler** URL (the
  hostname must contain `-pooler` and the query string must include
  `pgbouncer=true`). Re-copy from the Neon dashboard.
- After fixing, **redeploy** (Vercel does not re-run `prisma db push` on
  env-var changes alone — click Redeploy).

### `relation "Candidate" does not exist` at runtime
- The `prisma db push` step in the build did not run. Verify
  `vercel-build` is set as the build command (it should be, via
  `vercel.json`). Manually trigger a redeploy from the Vercel dashboard.

### `PrismaClientKnownRequestError: P2002` when a user votes
- This is **expected behaviour** when the same voter submits twice
  concurrently — `Vote.voterId` is `@unique` to enforce one-vote-per-voter.
  The API returns `400 "Anda sudah menggunakan hak suara Anda"`. If you see
  this in the logs without a duplicate request, check whether the client is
  double-firing the POST (e.g. a React StrictMode double-effect).

### Results page shows "Menghubungkan…" forever
- You set `NEXT_PUBLIC_SOCKET_URL` but the socket service is unreachable
  from the browser (CORS, mixed content, wrong path). Open the browser
  dev-tools Network tab and check the WebSocket handshake.
- Or you set `SOCKET_SERVICE_URL` (server-side) but not
  `NEXT_PUBLIC_SOCKET_URL` (browser-side). Both are needed.
- If you don't want to deploy the socket service, **unset both** — the page
  will fall back to polling.

### Three.js scene is invisible / page feels slow
- The 3D background (`PageBackground3D`) only renders after hydration on a
  client that supports WebGL. On unsupported browsers it shows a static
  gradient. No action needed.
- On low-end devices, the background dpr is capped at 1.5 to limit GPU load.
- If the home-page `ElectionHero` (the ballot-box 3D) is heavy on mobile,
  the dev.log will show the component is already SSR-safe (gradient
  fallback until mount).

### Admin login fails with the default password
- `ADMIN_PASSWORD` env var was not picked up. Redeploy after setting it in
  the Vercel dashboard. The fallback is `panitia2025` (hard-coded in
  `src/lib/auth.ts`).

### Database reset between deploys
- Vercel does NOT run migrations on env-var-only changes. The Neon database
  persists across deploys. To wipe and re-seed, use the **Admin → Reset**
  dialog (scope: `votes` keeps voters/candidates, `all` wipes everything
  except Settings) and re-create data via the dashboard.

---

## Quick reference — production env vars (Vercel)

```
DATABASE_URL=postgresql://...?sslmode=require&pgbouncer=true   # Neon pooler (REQUIRED)
ADMIN_PASSWORD=<your strong password>                          # REQUIRED (defaults to panitia2025)
SOCKET_SERVICE_URL=https://<socket-host>/internal/notify       # OPTIONAL (real-time)
NEXT_PUBLIC_SOCKET_URL=https://<socket-host>                   # OPTIONAL (real-time)
```

That's it. Once deployed, the app is fully functional at the Vercel URL —
voting, live results, and the panitia dashboard all work.
