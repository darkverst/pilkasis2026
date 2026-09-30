"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { useWebGLReady } from "./useWebGL";

export interface VoteConfettiProps {
  /** Flip to true to spawn a fresh confetti burst. */
  trigger: boolean;
  className?: string;
  /** Wrapper height in pixels (defaults to 220). */
  height?: number;
}

const PARTICLE_COUNT = 80;
const DURATION = 2.5;
const GRAVITY = 5.5;

const PALETTE: string[] = [
  "#1f6feb", // primary blue
  "#4a9eff", // bright blue
  "#7fb2ff", // light blue
  "#ffffff", // white
  "#bcd6ff", // soft blue
];

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  rotSpeed: THREE.Vector3;
  color: THREE.Color;
  spawnTime: number; // 0 = never spawned; >0 = clock time of spawn
}

function createParticles(): ParticleData[] {
  const arr: ParticleData[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    arr.push({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      rotSpeed: new THREE.Vector3(),
      color: new THREE.Color(PALETTE[i % PALETTE.length]),
      spawnTime: 0,
    });
  }
  return arr;
}

function Confetti({ trigger }: { trigger: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Geometry & material are created once and never mutated by us. useMemo
  // is safe here — they are only passed to instancedMesh as constructor
  // arguments.
  const geometry = useMemo(
    () => new THREE.BoxGeometry(0.1, 0.14, 0.02),
    []
  );
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        toneMapped: false,
        roughness: 0.35,
        metalness: 0.15,
      }),
    []
  );

  // `dummy` and `particles` ARE mutated each frame, so they live in refs.
  // The lazy-init null-check is the only ref read allowed during render.
  const dummyRef = useRef<THREE.Object3D | null>(null);
  if (dummyRef.current === null) {
    dummyRef.current = new THREE.Object3D();
  }

  const particlesRef = useRef<ParticleData[] | null>(null);
  if (particlesRef.current === null) {
    particlesRef.current = createParticles();
  }

  const lastTrigger = useRef(false);
  const colorsApplied = useRef(false);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const dummy = dummyRef.current;
    const particles = particlesRef.current;
    if (!mesh || !dummy || !particles) return;

    const now = state.clock.elapsedTime;

    // Apply the initial color attribute once on the first frame after mount.
    if (!colorsApplied.current) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        mesh.setColorAt(i, particles[i].color);
      }
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
      colorsApplied.current = true;
    }

    // Detect a fresh trigger rising-edge to (re)spawn particles.
    if (trigger && !lastTrigger.current) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1.6;
        p.position.set(0, 0, 0);
        p.velocity.set(
          Math.cos(angle) * speed,
          Math.random() * 2.8 + 1.6,
          Math.sin(angle) * speed
        );
        p.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        p.rotSpeed.set(
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 9
        );
        p.color.set(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
        p.spawnTime = now;
        mesh.setColorAt(i, p.color);
      }
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
    }
    lastTrigger.current = trigger;

    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const age = p.spawnTime > 0 ? now - p.spawnTime : -1;
      const alive = age >= 0 && age < DURATION;

      if (!alive) {
        // Hide the particle far below the scene.
        dummy.position.set(0, -1000, 0);
        dummy.scale.set(0, 0, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      // Simple physics: gravity + integration.
      p.velocity.y -= GRAVITY * dt;
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      p.position.z += p.velocity.z * dt;
      // Mild horizontal air drag for a floaty feel.
      p.velocity.x *= 1 - 0.4 * dt;
      p.velocity.z *= 1 - 0.4 * dt;

      p.rotation.x += p.rotSpeed.x * dt;
      p.rotation.y += p.rotSpeed.y * dt;
      p.rotation.z += p.rotSpeed.z * dt;

      // Shrink-to-fade in the last 25% of life.
      const lifeRatio = age / DURATION;
      const scale =
        lifeRatio > 0.75 ? Math.max(0, 1 - (lifeRatio - 0.75) / 0.25) : 1;

      dummy.position.copy(p.position);
      dummy.rotation.copy(p.rotation);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, PARTICLE_COUNT]}
      frustumCulled={false}
    />
  );
}

function ConfettiScene({ trigger }: { trigger: boolean }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.0}
        color="#ffffff"
      />
      <pointLight
        position={[-4, 2, -3]}
        intensity={12}
        color="#4a9eff"
        distance={10}
      />
      <Confetti trigger={trigger} />
    </>
  );
}

/**
 * VoteConfetti — a short blue/white confetti burst spawned when `trigger`
 * flips from false to true. ~80 instanced particles fly outward and fall
 * with gravity, fading after ~2.5 seconds.
 *
 * SSR-safe: renders a transparent placeholder until mounted on the client.
 */
export default function VoteConfetti({
  trigger,
  className,
  height = 220,
}: VoteConfettiProps) {
  const { mounted, webglOk } = useWebGLReady();

  const wrapperStyle = { height };

  if (!mounted || !webglOk) {
    // Transparent placeholder — the parent page should layer this overlay
    // above existing UI; when WebGL is unavailable nothing visible happens.
    return (
      <div
        className={cn("w-full pointer-events-none", className)}
        style={wrapperStyle}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn("w-full pointer-events-none", className)}
      style={wrapperStyle}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 1.5, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ConfettiScene trigger={trigger} />
      </Canvas>
    </div>
  );
}
