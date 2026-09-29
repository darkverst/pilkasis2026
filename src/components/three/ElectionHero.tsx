"use client";

import { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  Float,
  RoundedBox,
  Text,
  Sparkles,
  ContactShadows,
  MeshReflectorMaterial,
} from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { useWebGLReady } from "./useWebGL";

export interface ElectionHeroProps {
  schoolName?: string;
  className?: string;
  /** Wrapper height in pixels (defaults to 380). */
  height?: number;
}

/** Theme palette — kept consistent with the bright blue/white school vibe. */
const THEME = {
  primary: "#1f6feb",
  primaryDark: "#0a3a9c",
  glow: "#7fb2ff",
  white: "#ffffff",
  floor: "#e8f1ff",
  shadow: "#1a4fa0",
};

/** Rotating glossy ballot box with a glowing slot on top. */
function BallotBox() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main body — rounded, glossy blue */}
      <RoundedBox
        args={[2, 1.7, 1.7]}
        radius={0.18}
        smoothness={6}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={THEME.primary}
          metalness={0.55}
          roughness={0.18}
          envMapIntensity={1.1}
        />
      </RoundedBox>

      {/* Top lid plate */}
      <RoundedBox
        args={[2.05, 0.12, 1.75]}
        radius={0.05}
        smoothness={4}
        position={[0, 0.92, 0]}
        castShadow
      >
        <meshStandardMaterial
          color={THEME.primaryDark}
          metalness={0.7}
          roughness={0.2}
          envMapIntensity={1.2}
        />
      </RoundedBox>

      {/* Glowing ballot slot */}
      <mesh position={[0, 0.98, 0]}>
        <boxGeometry args={[0.7, 0.04, 0.12]} />
        <meshStandardMaterial
          color={THEME.glow}
          emissive={THEME.glow}
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>

      {/* OSIS label on the front */}
      <Text
        position={[0, -0.05, 0.86]}
        fontSize={0.42}
        letterSpacing={0.05}
        color={THEME.white}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor={THEME.primaryDark}
      >
        OSIS
      </Text>

      {/* Small star icon below the label */}
      <Text
        position={[0, -0.55, 0.86]}
        fontSize={0.18}
        color={THEME.glow}
        anchorX="center"
        anchorY="middle"
      >
        ★
      </Text>
    </group>
  );
}

/** A single floating vote token: a white sphere with a checkmark on it. */
function VoteToken({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <Float
      position={position}
      speed={2}
      rotationIntensity={1.2}
      floatIntensity={1.6}
      floatingRange={[-0.15, 0.15]}
    >
      <mesh castShadow scale={scale}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial
          color={THEME.white}
          metalness={0.45}
          roughness={0.12}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* Checkmark on the front */}
      <Text
        position={[0, 0, 0.23]}
        fontSize={0.24}
        color={THEME.primary}
        anchorX="center"
        anchorY="middle"
      >
        ✓
      </Text>
      {/* Checkmark on the back too, so it always shows */}
      <Text
        position={[0, 0, -0.23]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.24}
        color={THEME.primary}
        anchorX="center"
        anchorY="middle"
      >
        ✓
      </Text>
    </Float>
  );
}

/** Floating big title text above the scene. */
function FloatingTitle({ schoolName }: { schoolName?: string }) {
  return (
    <group position={[0, 2.5, 0]}>
      <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.35}>
        <Text
          fontSize={0.55}
          letterSpacing={0.08}
          color={THEME.primary}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor={THEME.primaryDark}
        >
          PEMILIHAN OSIS
        </Text>
      </Float>
      {schoolName ? (
        <Float
          speed={1.2}
          rotationIntensity={0.1}
          floatIntensity={0.25}
          position={[0, -0.45, 0]}
        >
          <Text
            fontSize={0.22}
            color="#5a78a8"
            anchorX="center"
            anchorY="middle"
            maxWidth={6}
            textAlign="center"
          >
            {schoolName}
          </Text>
        </Float>
      ) : null}
    </group>
  );
}

/** Custom environment built from Lightformers — no CDN/HDR fetch needed. */
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      {/* Soft white key from above */}
      <Lightformer
        intensity={2.4}
        position={[0, 5, 0]}
        scale={[10, 10, 1]}
        color="#ffffff"
        form="rect"
      />
      {/* Blue rim from the left/back */}
      <Lightformer
        intensity={2.0}
        position={[-5, 2, -4]}
        scale={[6, 6, 1]}
        color="#4a9eff"
        form="rect"
        rotation={[0, Math.PI / 2, 0]}
      />
      {/* Cool fill from the right */}
      <Lightformer
        intensity={1.2}
        position={[5, 1, 3]}
        scale={[5, 5, 1]}
        color="#cfe3ff"
        form="circle"
        rotation={[0, -Math.PI / 3, 0]}
      />
    </Environment>
  );
}

/** The full hero 3D scene. */
function HeroScene({ schoolName }: { schoolName?: string }) {
  const tokenPositions = useMemo<[number, number, number][]>(
    () => [
      [-2.4, 0.85, 0.2],
      [2.5, 0.4, -0.4],
      [-1.9, -0.45, 0.9],
      [2.0, 1.25, 0.6],
      [0.2, 1.55, -1.4],
      [-2.7, 1.35, -0.6],
    ],
    []
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.3}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      <pointLight
        position={[-5, 2, -4]}
        intensity={20}
        color="#4a9eff"
        distance={15}
      />

      <Suspense fallback={null}>
        <StudioEnvironment />
      </Suspense>

      {/* The ballot box — gently floating + slowly rotating */}
      <Float
        speed={1.1}
        rotationIntensity={0.25}
        floatIntensity={0.5}
        position={[0, 0.1, 0]}
      >
        <BallotBox />
      </Float>

      {/* Orbiting vote tokens */}
      {tokenPositions.map((p, i) => (
        <VoteToken key={i} position={p} scale={0.85 + (i % 2) * 0.2} />
      ))}

      {/* Floating title above */}
      <FloatingTitle schoolName={schoolName} />

      {/* Ambient sparkles for atmosphere */}
      <Sparkles
        count={70}
        scale={[9, 5, 5]}
        size={3.2}
        speed={0.3}
        opacity={0.7}
        color={THEME.glow}
      />

      {/* Reflective floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.35, 0]}
        receiveShadow
      >
        <planeGeometry args={[40, 40]} />
        <MeshReflectorMaterial
          blur={[300, 120]}
          resolution={512}
          mixBlur={1.2}
          mixStrength={1.6}
          roughness={0.85}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color={THEME.floor}
          metalness={0.25}
        />
      </mesh>

      {/* Contact shadows for solid grounding */}
      <ContactShadows
        position={[0, -1.3, 0]}
        opacity={0.55}
        scale={14}
        blur={2.6}
        far={5}
        color={THEME.shadow}
      />
    </>
  );
}

/**
 * ElectionHero — full 3D hero scene for the OSIS election home page.
 *
 * SSR-safe: returns a static gradient placeholder until mounted on the
 * client, then renders the WebGL Canvas. If WebGL is unavailable (older
 * browsers, headless contexts), the gradient remains.
 *
 * For best results, the parent page should dynamically import this file
 * with `ssr: false`, but that is not strictly required.
 */
export default function ElectionHero({
  schoolName,
  className,
  height = 380,
}: ElectionHeroProps) {
  const { mounted, webglOk } = useWebGLReady();

  const wrapperStyle = { height };

  if (!mounted || !webglOk) {
    // Lightweight CSS-gradient fallback — bright blue/white school vibe.
    return (
      <div
        className={cn(
          "w-full relative overflow-hidden",
          className
        )}
        style={wrapperStyle}
        aria-label="Pemilihan OSIS hero"
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
            <div className="text-gradient-blue text-3xl sm:text-4xl font-extrabold tracking-tight">
              PEMILIHAN OSIS
            </div>
            {schoolName ? (
              <div className="mt-2 text-sm sm:text-base text-muted-foreground">
                {schoolName}
              </div>
            ) : null}
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
        camera={{ position: [0, 1.5, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <HeroScene schoolName={schoolName} />
      </Canvas>
    </div>
  );
}
