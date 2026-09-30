---
Task ID: 3
Agent: api-routes-builder
Task: Build ALL Next.js 16 App Router API routes for the OSIS election app under src/app/api/ (public + voter + admin auth + admin mutations + reset), with real-time socket.io integration to the mini-service on port 3003.

Work Log:
- Read existing context: prisma/schema.prisma, src/lib/{db,auth,types,results}.ts, package.json, eslint.config.mjs, mini-services/vote-service/index.ts (to confirm `/internal/notify` payload expectations).
- Created 2 shared helpers in src/lib (no modifications to the existing lib files):
  - src/lib/socket-notify.ts → `notifyVoteCast(payload)` and `notifyAdminChange()`, both fire-and-forget POST to http://localhost:3003/internal/notify with `.catch(()=>{})`.
  - src/lib/admin-guard.ts → `requireAdmin(req)` returns null if authorized, else a 401 NextResponse.
- Created 18 route.ts files (each starts with `export const dynamic = "force-dynamic"`):
  Public:
  - src/app/api/settings/route.ts (GET → Settings, auto-creates row id="default" if missing)
  - src/app/api/candidates/route.ts (GET → Candidate[] ordered by order asc, name asc)
  - src/app/api/candidates/[id]/route.ts (GET → Candidate | 404)
  - src/app/api/results/route.ts (GET → ElectionResults via computeResults())
  - src/app/api/vote/status/route.ts (GET ?token=XXX → {valid,hasVoted,role,voterName,votedAt})
  Voter:
  - src/app/api/vote/route.ts (POST → validates token, candidate, runs db.$transaction creating Vote + updating Voter hasVoted/votedAt/usedToken; catches Prisma P2002 for race-condition double vote; notifies socket service with candidate payload; returns {success,message,candidate})
  Admin auth:
  - src/app/api/admin/login/route.ts (POST → compares password, sets osis_admin_session cookie httpOnly, sameSite=lax, path=/, maxAge=8h)
  - src/app/api/admin/logout/route.ts (POST → deletes cookie)
  - src/app/api/admin/check/route.ts (GET → {authenticated})
  Admin — candidates (all guarded by requireAdmin):
  - src/app/api/admin/candidates/route.ts (POST → create + notify)
  - src/app/api/admin/candidates/[id]/route.ts (PUT → partial update + notify; DELETE → cascade delete + notify)
  Admin — tokens:
  - src/app/api/admin/tokens/generate/route.ts (POST {count 1-500, role, batch?} → generateBatch + voter.createMany + notify)
  - src/app/api/admin/tokens/route.ts (GET → VoterInfo[], supports ?role, ?batch, ?unvoted=true filters)
  - src/app/api/admin/tokens/stats/route.ts (GET → {total,voted,unvoted,students,teachers})
  - src/app/api/admin/tokens/[id]/route.ts (DELETE → 400 if hasVoted, else delete + notify)
  Admin — settings:
  - src/app/api/admin/settings/route.ts (PUT → upsert Settings id="default" with partial fields; ISO strings/null for start/endTime; notifies)
  Admin — reset (dangerous):
  - src/app/api/admin/reset/route.ts (POST {confirm:true, scope:"votes"|"all"} → votes: only db.vote.deleteMany({}); all: delete votes→voters→candidates, settings preserved; notifies)
- Ran end-to-end smoke tests against the live dev server (port 3000): login, token generation, candidate CRUD, vote flow (including duplicate-vote race rejection), results computation, vote/status, settings upsert, both reset scopes, and logout. All responses match the spec'd shapes.
- Ran `bun run lint` — exit code 0 for the files I created (`npx eslint src/app/api src/lib/socket-notify.ts src/lib/admin-guard.ts` returns clean). The only lint error in the repo is in src/components/three/ElectionHero.tsx (frontend agent's file, not mine).
- Ran `npx tsc --noEmit` — no type errors in any of my files; remaining tsc errors are pre-existing in examples/, mini-services/vote-service/, and skills/ (not in scope of this task).

Stage Summary:
- 18 App Router route handlers built (5 public, 1 voter, 3 admin-auth, 3 admin-candidates, 4 admin-tokens, 1 admin-settings, 1 admin-reset) + 2 shared lib helpers (socket-notify.ts, admin-guard.ts).
- POST /api/vote request/response shapes:
  - Request: { "token": "OSIS-XXX-XXX", "candidateId": "<cuid>" }
  - Success 200: { "success": true, "message": "Suara Anda berhasil tercatat", "candidate": { id,name,class,photo,vision,mission,order,color } }
  - Errors 400: { "error": "Token tidak dikenali" } | { "error": "Anda sudah menggunakan hak suara Anda" } | { "error": "Calon tidak ditemukan" }
  - Notifies socket service at http://localhost:3003/internal/notify with {candidateId,candidateName,candidatePhoto,candidateColor}.
- POST /api/admin/tokens/generate request/response shapes:
  - Request: { "count": 1..500, "role": "student"|"teacher", "batch": "optional-string" }
  - Success 200: { "tokens": ["OSIS-XXX-XXX", ...], "count": <n> }
  - Errors: 400 if count not 1-500, 401 if admin cookie missing/invalid.
- Real-time integration verified: every vote success and every admin mutation calls http://localhost:3003/internal/notify (best-effort, never blocks the user request).
- Lint result: my code passes ESLint with zero errors. The single repo-wide lint error (react-hooks/set-state-in-effect in src/components/three/ElectionHero.tsx) belongs to the frontend agent.
