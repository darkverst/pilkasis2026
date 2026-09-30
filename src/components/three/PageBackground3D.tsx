"use client";

import { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Stars, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { useWebGLReady } from "./useWebGL";

export interface PageBackground3DProps {
  className?: string;
}

const THEME = {
  primary: "#1f6feb",
  glow: "#7fb2ff",
  white: "#ffffff",
};

/** Slowly drifting particle field of small glowing dots. */
function DriftingDots() {
  const groupRef = useRef<THREE.Group>(null);

  const positions = useMemo<[number, number, number][]>(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 60; i++) {
      pts.push([
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 12 - 4,
      ]);
    }
    return pts;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.04;
      groupRef.current.position.y = Math.sin(performance.now() * 0.0002) * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <Float
          key={i}
          position={p}
          speed={0.6 + (i % 5) * 0.1}
          rotationIntensity={0.3}
          floatIntensity={0.8}
          floatingRange={[-0.2, 0.2]}
        >
          <mesh>
            <sphereGeometry args={[0.08 + (i % 3) * 0.04, 12, 12]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? THEME.glow : THEME.white}
              emissive={i % 3 === 0 ? THEME.glow : THEME.primary}
              emissiveIntensity={0.4}
              metalness={0.3}
              roughness={0.2}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/** A few large floating blue orbs in the distance for depth. */
function FloatingOrbs() {
  const orbs = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => ({
        position: [
          (i - 2) * 6,
          (i % 2 === 0 ? 1 : -1) * (2 + (i % 3)),
          -6 - i * 0.5,
        ] as [number, number, number],
        scale: 0.8 + (i % 3) * 0.4,
        color: i % 2 === 0 ? THEME.primary : THEME.glow,
      })),
    [],
  );

  return (
    <>
      {orbs.map((o, i) => (
        <Float
          key={i}
          position={o.position}
          speed={0.5 + i * 0.05}
          rotationIntensity={0.2}
          floatIntensity={1.2}
          floatingRange={[-0.4, 0.4]}
        >
          <mesh scale={o.scale}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial
              color={o.color}
              emissive={o.color}
              emissiveIntensity={0.18}
              metalness={0.4}
              roughness={0.3}
              transparent
              opacity={0.18}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function BackgroundScene() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 4]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-8, 3, -6]} intensity={8} color="#4a9eff" distance={30} />

      <Suspense fallback={null}>
        <Environment resolution={128} frames={1}>
          <Lightformer
            intensity={1.8}
            position={[0, 4, 0]}
            scale={[12, 12, 1]}
            color="#ffffff"
            form="rect"
          />
          <Lightformer
            intensity={1.4}
            position={[-6, 2, -4]}
            scale={[6, 6, 1]}
            color="#7fb2ff"
            form="rect"
            rotation={[0, Math.PI / 2, 0]}
          />
        </Environment>
      </Suspense>

      <DriftingDots />
      <FloatingOrbs />

      {/* Distant subtle starfield */}
      <Stars
        radius={50}
        depth={20}
        count={400}
        factor={3}
        saturation={0}
        fade
        speed={0.4}
      />

      {/* Ambient sparkles */}
      <Sparkles
        count={50}
        scale={[20, 12, 6]}
        size={2.4}
        speed={0.25}
        opacity={0.5}
        color={THEME.glow}
      />
    </>
  );
}

/**
 * PageBackground3D — fixed full-viewport ambient 3D backdrop rendered behind
 * the app content (use `-z-10`). Lightweight: small instanced dots, a few
 * translucent orbs, distant starfield. Designed to be subtle so it does not
 * compete with foreground cards.
 *
 * SSR-safe: renders nothing until mounted on the client (avoids hydration
 * mismatch). On non-WebGL clients, renders nothing and lets the CSS gradient
 * background in globals.css show through.
 */
export default function PageBackground3D({ className }: PageBackground3DProps) {
  const { mounted, webglOk } = useWebGLReady();

  if (!mounted || !webglOk) {
    // No background canvas — the body's CSS gradient provides the base.
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
