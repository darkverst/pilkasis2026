"use client";

import { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  Image,
  Billboard,
  ContactShadows,
  Environment,
  Lightformer,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { useWebGLReady } from "./useWebGL";
import type { CandidateResult, ElectionResults } from "@/lib/types";

export interface LiveResults3DProps {
  results: ElectionResults;
  className?: string;
  /** Wrapper height in pixels (defaults to 420). */
  height?: number;
}

const MAX_BAR_HEIGHT = 3;
const MIN_BAR_HEIGHT = 0.2;
const BAR_WIDTH = 0.85;
const BAR_DEPTH = 0.85;
const BAR_SPACING = 1.6;

const THEME = {
  primary: "#1f6feb",
  primaryDark: "#0a3a9c",
  glow: "#7fb2ff",
  white: "#ffffff",
  podium: "#bcd6ff",
  shadow: "#1a4fa0",
  textPrimary: "#0a2a6b",
  textMuted: "#5a78a8",
};

function normalizeColor(color: string | undefined | null): string {
  if (!color) return THEME.primary;
  const trimmed = color.trim();
  if (!trimmed) return THEME.primary;
  return trimmed;
}

function initialFromName(name: string): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // Use first alphanumeric character, uppercased.
  const match = trimmed.match(/[A-Za-z0-9]/);
  return match ? match[0].toUpperCase() : "?";
}

function computeBarHeight(voteCount: number, maxVotes: number): number {
  if (maxVotes <= 0 || voteCount <= 0) return MIN_BAR_HEIGHT;
  const ratio = voteCount / maxVotes;
  return Math.max(MIN_BAR_HEIGHT, ratio * MAX_BAR_HEIGHT);
}

interface CandidateBarProps {
  candidate: CandidateResult;
  position: [number, number, number];
  maxVotes: number;
  index: number;
}

function CandidateBar({
  candidate,
  position,
  maxVotes,
  index,
}: CandidateBarProps) {
  const barRef = useRef<THREE.Mesh>(null);
  const voteTextRef = useRef<THREE.Group>(null);
  const targetHeight = computeBarHeight(candidate.voteCount, maxVotes);
  const currentHeight = useRef<number>(MIN_BAR_HEIGHT);

  const color = normalizeColor(candidate.color);
  const hasPhoto = Boolean(candidate.photo && candidate.photo.length > 0);

  // Animate height toward target on each frame.
  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.05);
    const diff = targetHeight - currentHeight.current;
    // Critically-damped lerp — snappy but smooth.
    currentHeight.current += diff * Math.min(1, safeDelta * 6);

    if (barRef.current) {
      barRef.current.scale.y = currentHeight.current;
      barRef.current.position.y = currentHeight.current / 2;
    }
    if (voteTextRef.current) {
      // Float the vote count just above the bar's current top.
      voteTextRef.current.position.y = currentHeight.current + 0.22;
    }
  });

  return (
    <group position={position}>
      {/* The bar itself — box geometry scaled vertically each frame */}
      <mesh ref={barRef} castShadow receiveShadow>
        <boxGeometry args={[BAR_WIDTH, 1, BAR_DEPTH]} />
        <meshStandardMaterial
          color={color}
          metalness={0.35}
          roughness={0.32}
          envMapIntensity={1.1}
        />
      </mesh>

      {/* Rounded cap on top of the bar, also grows with the bar */}
      <RoundedBox
        args={[BAR_WIDTH * 1.02, 0.1, BAR_DEPTH * 1.02]}
        radius={0.04}
        smoothness={3}
        castShadow
      >
        <meshStandardMaterial
          color={color}
          metalness={0.5}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.15}
          envMapIntensity={1.3}
        />
      </RoundedBox>

      {/* Vote count label — position updated each frame via ref */}
      <Billboard ref={voteTextRef} position={[0, MAX_BAR_HEIGHT + 0.22, 0]}>
        <Text
          fontSize={0.28}
          color={THEME.textPrimary}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.006}
          outlineColor={THEME.white}
        >
          {`${candidate.voteCount}`}
        </Text>
        <Text
          position={[0, -0.22, 0]}
          fontSize={0.12}
          color={THEME.textMuted}
          anchorX="center"
          anchorY="middle"
        >
          {`${candidate.percentage.toFixed(1)}%`}
        </Text>
      </Billboard>

      {/* Photo / avatar floating above the bar */}
      <Billboard
        position={[0, MAX_BAR_HEIGHT + 1.05, 0]}
        follow
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        {hasPhoto ? (
          <Suspense fallback={null}>
            {/* drei <Image> is a WebGL mesh, not a DOM <img> — but the
                jsx-a11y/alt-text rule still flags it. Disable locally. */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              url={candidate.photo}
              scale={[0.85, 0.85]}
              transparent
              toneMapped={false}
            />
          </Suspense>
        ) : (
          <group>
            <mesh castShadow>
              <circleGeometry args={[0.42, 32]} />
              <meshStandardMaterial
                color={color}
                metalness={0.3}
                roughness={0.4}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* White ring border */}
            <mesh position={[0, 0, 0.001]}>
              <ringGeometry args={[0.4, 0.43, 32]} />
              <meshBasicMaterial color={THEME.white} side={THREE.DoubleSide} />
            </mesh>
            <Text
              position={[0, 0, 0.01]}
              fontSize={0.36}
              color={THEME.white}
              anchorX="center"
              anchorY="middle"
            >
              {initialFromName(candidate.name)}
            </Text>
          </group>
        )}
      </Billboard>

      {/* Name label below the photo */}
      <Billboard position={[0, MAX_BAR_HEIGHT + 0.5, 0]}>
        <Text
          fontSize={0.18}
          color={THEME.textPrimary}
          anchorX="center"
          anchorY="middle"
          maxWidth={2.4}
          textAlign="center"
          outlineWidth={0.004}
          outlineColor={THEME.white}
        >
          {candidate.name}
        </Text>
        <Text
          position={[0, -0.24, 0]}
          fontSize={0.12}
          color={THEME.textMuted}
          anchorX="center"
          anchorY="middle"
          maxWidth={2.4}
        >
          {candidate.class}
        </Text>
      </Billboard>

      {/* Index badge floating beside the bar */}
      <mesh position={[-BAR_WIDTH / 2 - 0.05, 0.15, BAR_DEPTH / 2 + 0.02]}>
        <circleGeometry args={[0.12, 24]} />
        <meshStandardMaterial color={THEME.primaryDark} />
      </mesh>
      <Billboard position={[-BAR_WIDTH / 2 - 0.05, 0.15, BAR_DEPTH / 2 + 0.05]}>
        <Text
          fontSize={0.14}
          color={THEME.white}
          anchorX="center"
          anchorY="middle"
        >
          {String(index + 1).padStart(2, "0")}
        </Text>
      </Billboard>
    </group>
  );
}

function Podium({ width }: { width: number }) {
  const radius = Math.max(2, width / 2 + 1.2);
  return (
    <group>
      <mesh position={[0, -0.1, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[radius, radius, 0.2, 64]} />
        <meshStandardMaterial
          color={THEME.podium}
          transparent
          opacity={0.55}
          metalness={0.2}
          roughness={0.5}
        />
      </mesh>
      {/* Subtle inner ring */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.25, radius - 0.18, 64]} />
        <meshBasicMaterial
          color={THEME.primary}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function EmptyState() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 1.4 + Math.sin(state.clock.elapsedTime * 1.4) * 0.08;
    }
  });
  return (
    <group ref={ref}>
      <Text
        fontSize={0.42}
        color={THEME.primary}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor={THEME.primaryDark}
      >
        Menunggu suara...
      </Text>
      <Text
        position={[0, -0.45, 0]}
        fontSize={0.18}
        color={THEME.textMuted}
        anchorX="center"
        anchorY="middle"
      >
        Belum ada suara yang masuk
      </Text>
    </group>
  );
}

function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer
        intensity={2.2}
        position={[0, 6, 0]}
        scale={[12, 12, 1]}
        color="#ffffff"
        form="rect"
      />
      <Lightformer
        intensity={1.8}
        position={[-6, 3, -4]}
        scale={[7, 7, 1]}
        color="#4a9eff"
        form="rect"
        rotation={[0, Math.PI / 2, 0]}
      />
      <Lightformer
        intensity={1.0}
        position={[6, 2, 3]}
        scale={[6, 6, 1]}
        color="#cfe3ff"
        form="circle"
        rotation={[0, -Math.PI / 3, 0]}
      />
    </Environment>
  );
}

interface SceneProps {
  results: ElectionResults;
}

function ResultsScene({ results }: SceneProps) {
  const candidates = Array.isArray(results?.candidates) ? results.candidates : [];
  const maxVotes = useMemo(() => {
    const m = candidates.reduce((acc, c) => Math.max(acc, c.voteCount), 0);
    return m;
  }, [candidates]);

  // Layout positions for bars (centered along X).
  const positions = useMemo(() => {
    const n = candidates.length;
    const start = -((n - 1) * BAR_SPACING) / 2;
    return Array.from(
      { length: n },
      (_, i) => [start + i * BAR_SPACING, 0, 0] as [number, number, number]
    );
  }, [candidates.length]);

  // Dynamic camera distance so all bars fit regardless of count.
  const cameraDistance = useMemo(() => {
    const n = candidates.length;
    const span = Math.max(1, n - 1) * BAR_SPACING;
    const halfSpan = span / 2 + 1.2;
    const fov = 50;
    const required = halfSpan / Math.tan((fov * Math.PI) / 360) + 1.5;
    return Math.max(7, Math.min(required, 22));
  }, [candidates.length]);

  const podiumWidth = candidates.length > 0 ? (candidates.length - 1) * BAR_SPACING + 2.2 : 4;

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.25}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={8}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
      />
      <pointLight
        position={[-6, 3, -5]}
        intensity={18}
        color="#4a9eff"
        distance={18}
      />

      <Suspense fallback={null}>
        <StudioEnvironment />
      </Suspense>

      {candidates.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Podium width={podiumWidth} />
          {candidates.map((c, i) => (
            <CandidateBar
              key={c.id}
              candidate={c}
              position={positions[i]}
              maxVotes={maxVotes}
              index={i}
            />
          ))}
        </>
      )}

      <ContactShadows
        position={[0, -0.21, 0]}
        opacity={0.45}
        scale={podiumWidth * 2.5}
        blur={2.8}
        far={5}
        color={THEME.shadow}
      />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.6}
        enableZoom={false}
        enablePan={false}
        target={[0, 1.2, 0]}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.55}
      />
    </>
  );
}

/**
 * LiveResults3D — animated 3D bar chart showing each candidate's live vote
 * count. Bars smoothly grow/lerp toward their target height when results
 * update in real time.
 *
 * SSR-safe: renders a static gradient placeholder until mounted on the
 * client, then the WebGL Canvas takes over.
 */
export default function LiveResults3D({
  results,
  className,
  height = 420,
}: LiveResults3DProps) {
  const { mounted, webglOk } = useWebGLReady();

  // Compute camera distance here too (mirrors scene logic) so we can use it
  // for the Canvas camera prop. We use the same heuristic so the chart fits.
  const cameraDistance = useMemo(() => {
    const n = Array.isArray(results?.candidates) ? results.candidates.length : 0;
    const span = Math.max(1, n - 1) * BAR_SPACING;
    const halfSpan = span / 2 + 1.2;
    const fov = 50;
    const required = halfSpan / Math.tan((fov * Math.PI) / 360) + 1.5;
    return Math.max(7, Math.min(required, 22));
  }, [results?.candidates?.length]);

  const wrapperStyle = { height };

  if (!mounted || !webglOk) {
    return (
      <div
        className={cn("w-full relative overflow-hidden rounded-xl", className)}
        style={wrapperStyle}
        aria-label="Live hasil pemilihan"
        role="img"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 25% 30%, #cfe3ff 0%, transparent 55%), radial-gradient(circle at 75% 65%, #e6f0ff 0%, transparent 50%), linear-gradient(135deg, #f7fbff 0%, #dceaff 100%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6">
            {!Array.isArray(results?.candidates) || results.candidates.length === 0 ? (
              <>
                <div className="text-lg font-semibold text-primary">
                  Menunggu suara...
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Belum ada suara yang masuk
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Memuat visualisasi 3D...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} style={wrapperStyle}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: [0, cameraDistance * 0.55, cameraDistance],
          fov: 50,
        }}
        gl={{ antialias: true, alpha: true }}
      >
        <ResultsScene results={results} />
      </Canvas>
    </div>
  );
}
