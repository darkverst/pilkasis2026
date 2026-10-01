# Local development & verification

## Run

```bash
bun install
bun run db:push        # create/refresh the SQLite schema
bun run seed           # optional: 4 candidates, 90 tokens, 22 sample votes
bun run dev            # http://localhost:3000
```

## Verify before committing

```bash
./scripts/verify.sh              # typecheck → lint → build → prod smoke test
./scripts/verify.sh --no-build   # skip the slow production build
```

This is the gate that catches the bugs a dev server hides. In particular it
boots the real standalone production bundle and asserts that `/_next/static/*`
actually returns `200` — a build can succeed while the bundle serves an
unstyled, non-interactive page.

## Individual commands

| Command | What it does |
| --- | --- |
| `bun run dev` | dev server on port 3000 |
| `bun run build` | production build **+** copy static/public into the standalone bundle |
| `bun run start` | run the standalone production server |
| `bun run serve:prod [port]` | same, explicit port |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | eslint |
| `bun run verify` | typecheck + lint (fast) |
| `bun run smoke` | API smoke test against `BASE_URL` (default :3000) |

## Why the build script is a script, not inline `cp`

With `output: "standalone"`, Next emits the runnable server at
`.next/standalone/<project-path-relative-to-workspace-root>/`. On this machine
that is `.next/standalone/pilkasis/`, not `.next/standalone/`. Next does **not**
copy `.next/static` or `public/` there.

The old inline `cp -r .next/static .next/standalone/.next/` therefore put the
assets one level too high, and `bun run start` pointed at
`.next/standalone/server.js`, a path that does not exist. Both failed silently:
`next build` exited 0 and the dev server worked fine, so nothing looked broken
until someone ran the production bundle and got a blank page.

`scripts/copy-standalone-assets.sh` discovers the real server directory, copies
the assets there, and fails the build if a referenced chunk is still missing.

## Notes

- `DATABASE_URL` must be an absolute `file:` path pointing at your local
  `db/custom.db`.
- The vote section of the smoke test writes to the DB, so it only runs when
  `DATABASE_URL` is a local `file:` URL (or `ALLOW_VOTE_TEST=1`). It creates a
  throwaway voter and deletes it again afterwards.
- `scripts/smoke-test.ts` asserts the auth and validation behaviour that has
  regressed before: forged/unsigned session cookies must 401, malformed bodies
  must 400 (not 500), and a token may only vote once.