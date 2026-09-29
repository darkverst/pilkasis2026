---
Task ID: 4
Agent: threejs-builder
Task: Build Three.js visualization components (ElectionHero, LiveResults3D, VoteConfetti) for the OSIS election app with blue/white theme, using @react-three/fiber and @react-three/drei.

Work Log:
- Read existing worklog.md and inspected project: Next.js 16, React 19, three@0.186.1, @react-three/fiber@9.8.1, @react-three/drei@10.7.9, types in /src/lib/types.ts, blue/white theme CSS variables confirmed in /src/app/globals.css.
- Created /home/z/my-project/src/components/three/ directory.
- Built ElectionHero.tsx: full 3D hero scene with a slowly rotating glossy blue ballot box (RoundedBox + glowing slot), 6 floating "vote token" spheres with checkmark text wrapped in drei Float, floating "PEMILIHAN OSIS" title text, drei Sparkles ambiance, a MeshReflectorMaterial floor, ContactShadows, custom Environment built from Lightformers (no CDN/HDR fetch needed), and studio lighting (ambient + key directional + blue point). SSR-safe with a CSS-gradient placeholder fallback.
- Built LiveResults3D.tsx: animated 3D bar chart with one bar per candidate. Bar heights lerp toward target each frame (useFrame critically-damped lerp). Photo above each bar via drei Billboard + Image (circular via radius=0.42). Falls back to a colored disc with the candidate's first initial when photo is empty. Vote count + percentage + name + class text labels. Light-blue semi-transparent cylindrical podium. OrbitControls with autoRotate=0.6, enableZoom=false, enablePan=false. Empty state: floating "Menunggu suara..." text that bobs up and down. Dynamic camera distance scales with candidate count so all bars always fit.
- Built VoteConfetti.tsx: ~80 instanced particles spawned on trigger rising-edge. Particles fly outward with random angle/speed, fall under gravity (5.5 units/s^2), rotate, and shrink-fade over the last 25% of their 2.5s lifetime. Blue/white palette (#1f6feb, #4a9eff, #7fb2ff, #ffffff, #bcd6ff). pointer-events-none wrapper so it overlays UI without blocking clicks.
- Built shared useWebGL.ts hook using useSyncExternalStore to detect (a) client mount and (b) WebGL availability — this avoids the React 19 react-hooks/set-state-in-effect lint error that arises from useEffect+setState(true) for mounted detection, and is hydration-safe (returns false on server AND during the first client render, then true after).
- Ran `bun run lint`. Initial run surfaced 5 errors: react-hooks/set-state-in-effect (3x), react-hooks/preserve-manual-memoization (1x), react-hooks/immutability (1x), plus 1 jsx-a11y/alt-text warning.
- Fixed all errors by (1) replacing useEffect+setState with useSyncExternalStore hook, (2) switching the `positions` useMemo in LiveResults3D to use Array.from with [candidates.length] deps, (3) refactoring VoteConfetti to store particle data in useRef (with lazy-init null-check pattern) instead of useMemo so per-frame mutation is allowed, and (4) suppressing the drei Image alt-text warning with an eslint-disable-next-line comment.
- Final `bun run lint` is clean: 0 errors, 0 warnings, exit 0.
- Verified dev.log shows no compilation errors related to the three/ components.

Stage Summary:
- Files created (all under /home/z/my-project/src/components/three/):
  1. ElectionHero.tsx     — default export ElectionHero, props: { schoolName?: string; className?: string; height?: number (default 380) }
  2. LiveResults3D.tsx    — default export LiveResults3D, props: { results: ElectionResults; className?: string; height?: number (default 420) }
  3. VoteConfetti.tsx     — default export VoteConfetti, props: { trigger: boolean; className?: string; height?: number (default 220) }
  4. useWebGL.ts          — exports useWebGLReady(): { mounted: boolean; webglOk: boolean } SSR-safe hook
- Lint: clean (0 errors, 0 warnings).
- All components are "use client", TypeScript strict (no `any`), no module-scope window/document access.
- Import guidance for the parent page: dynamic import with `ssr: false` is recommended for the Canvas-bearing components, e.g.:
    const ElectionHero = dynamic(() => import("@/components/three/ElectionHero"), { ssr: false });
  but it is NOT strictly required — each component is already SSR-safe thanks to the useWebGLReady hook returning {mounted:false} during SSR and the first client render, then rendering a static gradient placeholder before swapping in the Canvas after hydration.
- Visual design choices: vivid blue (#1f6feb) + light blue (#7fb2ff) + white palette throughout; custom Lightformer-based environment (no CDN/HDR fetch) so the scenes are fully self-contained; Sparkles + Float for gentle motion; MeshReflectorMaterial floor + ContactShadows for grounding; OrbitControls autoRotate for live results.
