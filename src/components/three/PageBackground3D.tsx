"use client";

import { useEffect, useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Sparkles,
  Environment,
  Lightformer,
  RoundedBox,
  Text,
} from "@react-three/drei";
import * as THREE from "three";
import { useWebGLReady } from "./useWebGL";

export interface PageBackground3DProps {
  className?: string;
}

const THEME = {
  primary: "#2563eb",
  primaryDark: "#1e40af",
  glow: "#60a5fa",
  white: "#ffffff",
  checkBlue: "#3b82f6",
};

/** A floating ballot paper (surat suara) — thin white rounded card with a
 *  faint blue checkmark, representing a vote being cast. */
function BallotPaper({
  position,
  rotationY = 0,
  scale = 1,
  speed = 0.4,
}: {
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  speed?: number;
}) {
  return (
    <Float
      position={position}
      rotation={[0.1, rotationY, 0.05]}
      speed={speed}
      rotationIntensity={0.3}
      floatIntensity={0.8}
      floatingRange={[-0.3, 0.3]}
    >
      <group scale={scale}>
        {/* The paper card */}
        <RoundedBox args={[1.2, 1.6, 0.03]} radius={0.06} smoothness={3}>
          <meshStandardMaterial
            color={THEME.white}
            roughness={0.6}
            metalness={0.05}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </RoundedBox>
        {/* Checkmark on the paper */}
        <Text
          position={[0, 0.1, 0.02]}
          fontSize={0.5}
          color={THEME.checkBlue}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor={THEME.primaryDark}
        >
          ✓
        </Text>
        {/* "PILIH" label below checkmark */}
        <Text
          position={[0, -0.45, 0.02]}
          fontSize={0.1}
          color={THEME.primary}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.1}
        >
          PILIH
        </Text>
      </group>
    </Float>
  );
}

/** A floating ballot box (kotak suara) — small translucent blue box with a
 *  slot on top, the classic election symbol. */
function BallotBox({
  position,
  scale = 1,
  speed = 0.3,
}: {
  position: [number, number, number];
  scale?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.15;
    }
  });
  return (
    <Float
      position={position}
      speed={speed}
      rotationIntensity={0.2}
      floatIntensity={0.5}
      floatingRange={[-0.2, 0.2]}
    >
      <group ref={ref} scale={scale}>
        {/* Box body */}
        <RoundedBox args={[1, 0.9, 0.8]} radius={0.08} smoothness={3}>
          <meshStandardMaterial
            color={THEME.primary}
            roughness={0.3}
            metalness={0.5}
            transparent
            opacity={0.35}
            envMapIntensity={0.8}
          />
        </RoundedBox>
        {/* Lid on top */}
        <RoundedBox
          args={[1.05, 0.12, 0.85]}
          radius={0.04}
          smoothness={3}
          position={[0, 0.5, 0]}
        >
          <meshStandardMaterial
            color={THEME.primaryDark}
            roughness={0.3}
            metalness={0.6}
            transparent
            opacity={0.4}
          />
        </RoundedBox>
        {/* Glowing slot */}
        <mesh position={[0, 0.57, 0]}>
          <boxGeometry args={[0.5, 0.03, 0.08]} />
          <meshStandardMaterial
            color={THEME.glow}
            emissive={THEME.glow}
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
        {/* "OSIS" text on the front */}
        <Text
          position={[0, -0.05, 0.41]}
          fontSize={0.22}
          color={THEME.white}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.05}
          outlineWidth={0.004}
          outlineColor={THEME.primaryDark}
        >
          OSIS
        </Text>
      </group>
    </Float>
  );
}

/** Large ghosted "OSIS" / "VOTE" text floating in the distance for depth. */
function FloatingText({
  position,
  text,
  color = THEME.glow,
  fontSize = 1.5,
  speed = 0.3,
}: {
  position: [number, number, number];
  text: string;
  color?: string;
  fontSize?: number;
  speed?: number;
}) {
  return (
    <Float
      position={position}
      speed={speed}
      rotationIntensity={0.1}
      floatIntensity={0.4}
      floatingRange={[-0.2, 0.2]}
    >
      <Text
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.2}
        outlineWidth={0.01}
        outlineColor={color}
        outlineOpacity={0.1}
      >
        {text}
      </Text>
    </Float>
  );
}

/** A small checkmark token (like a voting chip) floating gently. */
function CheckToken({
  position,
  scale = 1,
  speed = 0.5,
}: {
  position: [number, number, number];
  scale?: number;
  speed?: number;
}) {
  return (
    <Float
      position={position}
      speed={speed}
      rotationIntensity={0.5}
      floatIntensity={0.7}
      floatingRange={[-0.15, 0.15]}
    >
      <mesh scale={scale}>
        <cylinderGeometry args={[0.15, 0.15, 0.04, 24]} />
        <meshStandardMaterial
          color={THEME.white}
          roughness={0.2}
          metalness={0.6}
          transparent
          opacity={0.6}
          envMapIntensity={1}
        />
      </mesh>
      <Text
        position={[0, 0.025, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.12}
        color={THEME.checkBlue}
        anchorX="center"
        anchorY="middle"
      >
        ✓
      </Text>
    </Float>
  );
}

/** Parallax controller — drifts the scene group gently based on scroll. */
function ParallaxRig({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      target.current.y = (window.scrollY || 0) * 0.002;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const k = Math.min(1, delta * 3);
    current.current.x += (target.current.x - current.current.x) * k;
    current.current.y += (target.current.y - current.current.y) * k;
    const g = groupRef.current;
    g.rotation.y += 0.0004;
    g.position.x = -current.current.x * 1.5;
    g.position.y = Math.sin(Date.now() * 0.0002) * 0.2 - current.current.y * 1.2;
    g.rotation.x = current.current.y * 0.1;
  });

  return null;
}

function BackgroundScene() {
  const groupRef = useRef<THREE.Group>(null);

  // Pre-compute ballot paper positions (spread across the viewport).
  const papers = useMemo(
    () =>
      [
        { pos: [-7, 2, -3] as [number, number, number], rot: 0.3, sc: 1.0, sp: 0.4 },
        { pos: [6, 1.5, -4] as [number, number, number], rot: -0.4, sc: 0.9, sp: 0.5 },
        { pos: [-4, -2, -2] as [number, number, number], rot: 0.6, sc: 0.8, sp: 0.6 },
        { pos: [5, -2.5, -3] as [number, number, number], rot: -0.2, sc: 1.1, sp: 0.35 },
        { pos: [0, 3, -5] as [number, number, number], rot: 0.1, sc: 0.7, sp: 0.45 },
      ],
    [],
  );

  // Pre-compute check token positions.
  const tokens = useMemo(
    () =>
      [
        { pos: [-5, 0, -2] as [number, number, number], sc: 1, sp: 0.6 },
        { pos: [4, 2.5, -3] as [number, number, number], sc: 0.8, sp: 0.7 },
        { pos: [7, -1, -4] as [number, number, number], sc: 1.2, sp: 0.5 },
        { pos: [-6, -1.5, -3] as [number, number, number], sc: 0.9, sp: 0.55 },
      ],
    [],
  );

  return (
    <>
      <ParallaxRig groupRef={groupRef} />

      {/* Lighting */}
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 4]} intensity={0.7} color="#ffffff" />
      <pointLight position={[-8, 3, -6]} intensity={6} color="#60a5fa" distance={30} />
      <pointLight position={[8, -2, 2]} intensity={4} color="#93c5fd" distance={25} />

      <Suspense fallback={null}>
        <Environment resolution={128} frames={1}>
          <Lightformer
            intensity={1.6}
            position={[0, 4, 0]}
            scale={[12, 12, 1]}
            color="#ffffff"
            form="rect"
          />
          <Lightformer
            intensity={1.0}
            position={[-6, 2, -4]}
            scale={[6, 6, 1]}
            color="#7fb2ff"
            form="rect"
            rotation={[0, Math.PI / 2, 0]}
          />
        </Environment>
      </Suspense>

      {/* The parallax group — all themed elements drift together on scroll */}
      <group ref={groupRef}>
        {/* Floating ballot papers (surat suara) */}
        {papers.map((p, i) => (
          <BallotPaper key={`paper-${i}`} position={p.pos} rotationY={p.rot} scale={p.sc} speed={p.sp} />
        ))}

        {/* Ballot boxes (kotak suara) */}
        <BallotBox position={[-3, 1, -6]} scale={1.2} speed={0.25} />
        <BallotBox position={[4, -1.5, -7]} scale={0.9} speed={0.3} />

        {/* Check tokens */}
        {tokens.map((t, i) => (
          <CheckToken key={`token-${i}`} position={t.pos} scale={t.sc} speed={t.sp} />
        ))}

        {/* Large ghosted text for depth */}
        <FloatingText position={[-8, -3, -8]} text="OSIS" color={THEME.glow} fontSize={2} speed={0.2} />
        <FloatingText position={[7, 3.5, -9]} text="VOTE" color={THEME.primary} fontSize={1.5} speed={0.25} />
        <FloatingText position={[0, -4, -6]} text="✓" color={THEME.glow} fontSize={1.8} speed={0.3} />

        {/* Ambient sparkles */}
        <Sparkles
          count={60}
          scale={[24, 14, 8]}
          size={2.5}
          speed={0.2}
          opacity={0.4}
          color={THEME.glow}
        />
      </group>
    </>
  );
}

/**
 * PageBackground3D — fixed full-viewport ambient 3D backdrop rendered behind
 * the app content. Election-themed: floating ballot papers with checkmarks,
 * ballot boxes, check tokens, and ghosted "OSIS" / "VOTE" text.
 *
 * SSR-safe: renders nothing until mounted on the client. On non-WebGL clients,
 * renders nothing and lets the CSS gradient background show through.
 */
export default function PageBackground3D({ className }: PageBackground3DProps) {
  const { mounted, webglOk } = useWebGLReady();

  if (!mounted || !webglOk) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -10,
        pointerEvents: "none",
        background:
          "radial-gradient(circle at 20% 10%, #e8f1ff 0%, transparent 55%), radial-gradient(circle at 80% 80%, #d6e8ff 0%, transparent 50%), linear-gradient(180deg, #fbfdff 0%, #f1f6ff 100%)",
      }}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <BackgroundScene />
      </Canvas>
    </div>
  );
}
