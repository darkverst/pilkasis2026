"use client";

import { useEffect, useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Sparkles,
  RoundedBox,
  Text,
} from "@react-three/drei";
import * as THREE from "three";
import { useWebGLReady } from "./useWebGL";
import { useAppStore } from "@/lib/store";
import type { Settings } from "@/lib/types";

export interface PageBackground3DProps {
  className?: string;
  settings?: Settings | null;
}

export interface ElectionInfo {
  schoolName: string;
  shortSchool: string;
  year: string;
  shortTitle: string;
  fullTitle: string;
}

/**
 * Derives clean dynamic identity labels from settings with robust defaults
 */
function extractElectionInfo(settings: Settings | null | undefined): ElectionInfo {
  const schoolName = settings?.schoolName?.trim() || "SMP NEGERI 1 NUSANTARA";

  // Abbreviated school name for tighter 3D badges
  const shortSchool = schoolName
    .replace(/SEKOLAH MENENGAH PERTAMA/i, "SMP")
    .replace(/NEGERI/i, "N")
    .trim();

  // Extract year from electionTitle, startTime, or fallback to 2026
  let year = "2026";
  if (settings?.electionTitle) {
    const match = settings.electionTitle.match(/\b(20\d{2})\b/);
    if (match) year = match[1];
  } else if (settings?.startTime) {
    const d = new Date(settings.startTime);
    if (!isNaN(d.getFullYear())) year = String(d.getFullYear());
  }

  // Short badge title (e.g. "PILKASIS")
  let shortTitle = "PILKASIS";
  if (settings?.electionTitle) {
    if (/pilkasis/i.test(settings.electionTitle)) {
      shortTitle = "PILKASIS";
    } else if (/osis/i.test(settings.electionTitle)) {
      shortTitle = "OSIS";
    }
  }

  return {
    schoolName,
    shortSchool,
    year,
    shortTitle,
    fullTitle: `${shortTitle} ${year}`,
  };
}

const THEME = {
  primary: "#2563eb",
  primaryDark: "#1e3a8a",
  primaryDeep: "#0f172a",
  sky: "#38bdf8",
  glow: "#60a5fa",
  gold: "#f59e0b",
  goldLight: "#fde68a",
  goldDark: "#92400e",
  emerald: "#10b981",
  emeraldLight: "#6ee7b7",
  white: "#ffffff",
  checkBlue: "#1d4ed8",
  paperBg: "#fafafa",
  sealRed: "#ef4444",
  textMuted: "#64748b",
};

/**
 * Floating 3D Digital Ballot Paper (Surat Suara Digital Paslon)
 * Dynamically displays the school identity, election title, and year.
 */
function BallotPaper({
  position,
  rotation = [0.1, 0, 0.05],
  scale = 1,
  speed = 0.45,
  candidateNumber = 1,
  depthParallax = 1,
  info,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  speed?: number;
  candidateNumber?: number;
  depthParallax?: number;
  info: ElectionInfo;
}) {
  const paperRef = useRef<THREE.Group>(null);
  const timeOffset = useMemo(() => Math.random() * 10, []);

  // Gentle flutter animation simulating paper floating gracefully in air
  useFrame((state) => {
    if (!paperRef.current) return;
    const t = state.clock.getElapsedTime() + timeOffset;
    paperRef.current.rotation.z = Math.sin(t * 0.8) * 0.06;
    paperRef.current.rotation.x = Math.cos(t * 0.6) * 0.05;
  });

  const numStr = candidateNumber < 10 ? `0${candidateNumber}` : `${candidateNumber}`;
  const accentColor =
    candidateNumber === 1
      ? THEME.primary
      : candidateNumber === 2
      ? THEME.sky
      : candidateNumber === 3
      ? THEME.gold
      : THEME.emerald;

  return (
    <Float
      position={position}
      rotation={rotation}
      speed={speed}
      rotationIntensity={0.35 * depthParallax}
      floatIntensity={0.7 * depthParallax}
      floatingRange={[-0.2, 0.2]}
    >
      <group ref={paperRef} scale={scale}>
        {/* Main Ballot Card Body */}
        <RoundedBox args={[1.4, 2.0, 0.024]} radius={0.06} smoothness={3}>
          <meshStandardMaterial
            color={THEME.white}
            roughness={0.35}
            metalness={0.08}
            transparent
            opacity={0.88}
            side={THREE.DoubleSide}
          />
        </RoundedBox>

        {/* Paper Border Accent Line */}
        <mesh position={[0, 0, 0.013]}>
          <planeGeometry args={[1.34, 1.94]} />
          <meshBasicMaterial
            color="#e2e8f0"
            wireframe
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Header Banner - Official School Election */}
        <mesh position={[0, 0.78, 0.015]}>
          <planeGeometry args={[1.26, 0.24]} />
          <meshStandardMaterial
            color={THEME.primaryDark}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
        <Text
          position={[0, 0.83, 0.02]}
          fontSize={0.058}
          maxWidth={1.18}
          textAlign="center"
          color={THEME.goldLight}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.1}
          fontWeight="bold"
        >
          {info.schoolName.toUpperCase()}
        </Text>
        <Text
          position={[0, 0.73, 0.02]}
          fontSize={0.07}
          maxWidth={1.2}
          textAlign="center"
          color={THEME.white}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.07}
          fontWeight="bold"
        >
          {`SURAT SUARA ${info.fullTitle}`}
        </Text>

        {/* Candidate Number Circle Badge */}
        <mesh position={[-0.38, 0.42, 0.015]}>
          <circleGeometry args={[0.16, 32]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.3}
            roughness={0.2}
          />
        </mesh>
        <Text
          position={[-0.38, 0.42, 0.02]}
          fontSize={0.16}
          color={THEME.white}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {numStr}
        </Text>

        {/* Paslon Text */}
        <Text
          position={[0.15, 0.46, 0.015]}
          fontSize={0.08}
          color={THEME.primaryDark}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          letterSpacing={0.06}
        >
          {`PASLON ${numStr}`}
        </Text>
        <Text
          position={[0.15, 0.38, 0.015]}
          fontSize={0.055}
          color={THEME.textMuted}
          anchorX="center"
          anchorY="middle"
        >
          Ketua & Wakil OSIS
        </Text>

        {/* Candidate Pair Silhouette Boxes */}
        <group position={[0, 0.06, 0.015]}>
          <mesh position={[-0.24, 0, 0]}>
            <planeGeometry args={[0.38, 0.44]} />
            <meshBasicMaterial color="#e0f2fe" transparent opacity={0.8} />
          </mesh>
          <Text position={[-0.24, 0, 0.005]} fontSize={0.16} color={THEME.primary} anchorX="center" anchorY="middle">
            👤
          </Text>

          <mesh position={[0.24, 0, 0]}>
            <planeGeometry args={[0.38, 0.44]} />
            <meshBasicMaterial color="#e0f2fe" transparent opacity={0.8} />
          </mesh>
          <Text position={[0.24, 0, 0.005]} fontSize={0.16} color={THEME.primary} anchorX="center" anchorY="middle">
            👤
          </Text>
        </group>

        {/* Big Coblos / Centang Checkmark Stamp */}
        <Text
          position={[0.18, -0.12, 0.025]}
          fontSize={0.55}
          color={accentColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor={THEME.white}
        >
          ✓
        </Text>

        {/* Official Security Stamp / Wax Seal */}
        <group position={[-0.34, -0.48, 0.015]}>
          <mesh>
            <circleGeometry args={[0.13, 24]} />
            <meshStandardMaterial
              color={THEME.gold}
              roughness={0.2}
              metalness={0.7}
            />
          </mesh>
          <Text
            position={[0, 0.03, 0.005]}
            fontSize={0.05}
            color={THEME.goldDark}
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            ★ SAH ★
          </Text>
          <Text
            position={[0, -0.04, 0.005]}
            fontSize={0.04}
            color={THEME.goldDark}
            anchorX="center"
            anchorY="middle"
          >
            PANITIA
          </Text>
        </group>

        {/* Bottom Bar: "SISTEM DIGITAL TERVERIFIKASI" */}
        <mesh position={[0, -0.78, 0.015]}>
          <planeGeometry args={[1.26, 0.16]} />
          <meshBasicMaterial color="#f1f5f9" />
        </mesh>
        <Text
          position={[0, -0.78, 0.02]}
          fontSize={0.06}
          color={THEME.primary}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
          fontWeight="bold"
        >
          ◆ SISTEM DIGITAL TERVERIFIKASI ◆
        </Text>
      </group>
    </Float>
  );
}

/**
 * Smart Translucent 3D Ballot Box (Kotak Suara Digital Berteknologi)
 * Dynamically displays the election title, school name, and active status.
 */
function BallotBox({
  position,
  scale = 1,
  speed = 0.3,
  rotationYOffset = 0,
  info,
}: {
  position: [number, number, number];
  scale?: number;
  speed?: number;
  rotationYOffset?: number;
  info: ElectionInfo;
}) {
  const boxGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const paperSlideRef = useRef<THREE.Group>(null);
  const slotLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (boxGroupRef.current) {
      boxGroupRef.current.rotation.y = rotationYOffset + t * 0.18;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.35;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.15;
    }
    if (paperSlideRef.current) {
      const cycle = (t * 0.7) % 2.5;
      if (cycle < 1.6) {
        paperSlideRef.current.position.y = 1.05 - cycle * 0.32;
        paperSlideRef.current.scale.setScalar(Math.max(0.01, 1 - cycle * 0.35));
        paperSlideRef.current.visible = true;
      } else {
        paperSlideRef.current.visible = false;
      }
    }
    if (slotLightRef.current) {
      slotLightRef.current.intensity = 2.0 + Math.sin(t * 3.5) * 1.2;
    }
  });

  return (
    <Float
      position={position}
      speed={speed}
      rotationIntensity={0.2}
      floatIntensity={0.45}
      floatingRange={[-0.15, 0.15]}
    >
      <group scale={scale}>
        {/* Orbital Holographic Ring */}
        <mesh ref={ringRef} position={[0, 0.1, 0]}>
          <torusGeometry args={[1.35, 0.012, 16, 64]} />
          <meshBasicMaterial
            color={THEME.sky}
            transparent
            opacity={0.5}
            wireframe
          />
        </mesh>

        <group ref={boxGroupRef}>
          {/* Main Box Body — Frosted Acrylic Glass */}
          <RoundedBox args={[1.3, 1.2, 1.1]} radius={0.09} smoothness={4}>
            <meshPhysicalMaterial
              color={THEME.primary}
              transmission={0.45}
              roughness={0.2}
              metalness={0.15}
              transparent
              opacity={0.65}
              reflectivity={0.6}
            />
          </RoundedBox>

          {/* Internal Glowing Vote Core */}
          <mesh position={[0, 0, 0]}>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial
              color={THEME.sky}
              emissive={THEME.glow}
              emissiveIntensity={2.2}
              wireframe
            />
          </mesh>

          {/* Box Lid */}
          <RoundedBox
            args={[1.38, 0.16, 1.18]}
            radius={0.04}
            smoothness={3}
            position={[0, 0.65, 0]}
          >
            <meshStandardMaterial
              color={THEME.primaryDark}
              roughness={0.25}
              metalness={0.7}
              transparent
              opacity={0.85}
            />
          </RoundedBox>

          {/* Glowing Slot (Lubang Suara Bercahaya) */}
          <mesh position={[0, 0.74, 0]}>
            <boxGeometry args={[0.72, 0.03, 0.1]} />
            <meshStandardMaterial
              color={THEME.sky}
              emissive={THEME.sky}
              emissiveIntensity={2.5}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            ref={slotLightRef}
            position={[0, 0.85, 0]}
            color={THEME.sky}
            distance={2}
            intensity={2}
          />

          {/* Animated Ballot Paper Entering the Slot */}
          <group ref={paperSlideRef} position={[0, 0.95, 0]}>
            <mesh rotation={[0.3, 0, 0]}>
              <planeGeometry args={[0.5, 0.4]} />
              <meshStandardMaterial
                color={THEME.white}
                roughness={0.4}
                side={THREE.DoubleSide}
              />
            </mesh>
            <Text
              position={[0, 0, 0.01]}
              rotation={[0.3, 0, 0]}
              fontSize={0.08}
              color={THEME.primary}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {`✓ ${info.shortTitle}`}
            </Text>
          </group>

          {/* Front Face Emblem: "KOTAK SUARA DIGITAL" */}
          <mesh position={[0, 0.16, 0.56]}>
            <circleGeometry args={[0.24, 32]} />
            <meshStandardMaterial
              color={THEME.primaryDark}
              metalness={0.5}
              roughness={0.2}
            />
          </mesh>
          <Text
            position={[0, 0.16, 0.57]}
            fontSize={0.18}
            color={THEME.goldLight}
            anchorX="center"
            anchorY="middle"
          >
            ★
          </Text>

          <Text
            position={[0, -0.15, 0.56]}
            fontSize={0.12}
            maxWidth={1.05}
            textAlign="center"
            color={THEME.white}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.07}
            fontWeight="bold"
            outlineWidth={0.008}
            outlineColor={THEME.primaryDark}
          >
            {info.fullTitle}
          </Text>
          <Text
            position={[0, -0.32, 0.56]}
            fontSize={0.08}
            maxWidth={1.05}
            textAlign="center"
            color={THEME.goldLight}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.05}
          >
            {info.shortSchool}
          </Text>

          {/* Live System Indicator Light */}
          <mesh position={[0.42, 0.42, 0.56]}>
            <circleGeometry args={[0.035, 16]} />
            <meshBasicMaterial color={THEME.emerald} />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

/**
 * 3D Golden OSIS Honor Coin / Voting Token
 * Double-sided embossed medal with dynamic title and year.
 */
function VotingToken({
  position,
  scale = 1,
  speed = 0.5,
  isGold = true,
  info,
}: {
  position: [number, number, number];
  scale?: number;
  speed?: number;
  isGold?: boolean;
  info: ElectionInfo;
}) {
  const tokenRef = useRef<THREE.Group>(null);
  const spinSpeed = useMemo(() => 0.4 + Math.random() * 0.3, []);

  useFrame((_, delta) => {
    if (tokenRef.current) {
      tokenRef.current.rotation.y += delta * spinSpeed;
      tokenRef.current.rotation.x += delta * (spinSpeed * 0.4);
    }
  });

  const mainColor = isGold ? THEME.gold : "#e2e8f0";
  const textColor = isGold ? THEME.goldDark : THEME.primary;

  return (
    <Float
      position={position}
      speed={speed}
      rotationIntensity={0.5}
      floatIntensity={0.6}
      floatingRange={[-0.2, 0.2]}
    >
      <group ref={tokenRef} scale={scale}>
        {/* Main Coin Core */}
        <mesh>
          <cylinderGeometry args={[0.34, 0.34, 0.06, 36]} />
          <meshStandardMaterial
            color={mainColor}
            roughness={isGold ? 0.2 : 0.3}
            metalness={isGold ? 0.88 : 0.5}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* Outer Raised Rim Ring */}
        <mesh>
          <torusGeometry args={[0.33, 0.025, 16, 36]} />
          <meshStandardMaterial
            color={isGold ? "#fcd34d" : THEME.white}
            roughness={0.15}
            metalness={0.9}
          />
        </mesh>

        {/* Front Face: Star & Short Title */}
        <group position={[0, 0, 0.035]}>
          <Text
            position={[0, 0.06, 0]}
            fontSize={0.17}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            ★
          </Text>
          <Text
            position={[0, -0.12, 0]}
            fontSize={0.065}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.06}
            fontWeight="bold"
          >
            {info.shortTitle}
          </Text>
        </group>

        {/* Back Face: Checkmark & Dynamic Year */}
        <group position={[0, 0, -0.035]} rotation={[0, Math.PI, 0]}>
          <Text
            position={[0, 0.05, 0]}
            fontSize={0.18}
            color={isGold ? THEME.goldDark : THEME.checkBlue}
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            ✓
          </Text>
          <Text
            position={[0, -0.12, 0]}
            fontSize={0.07}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.08}
            fontWeight="bold"
          >
            {info.year}
          </Text>
        </group>
      </group>
    </Float>
  );
}

/**
 * Animated Vote Streams (Flowing Digital Data Nodes)
 */
function DigitalVoteStream() {
  const nodes = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 24,
      y: (Math.random() - 0.5) * 14,
      z: -3 - Math.random() * 6,
      scale: 0.04 + Math.random() * 0.07,
      speed: 0.2 + Math.random() * 0.4,
      offset: Math.random() * Math.PI * 2,
      isGold: i % 3 === 0,
    }));
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.children.forEach((child, idx) => {
      const node = nodes[idx];
      if (node) {
        child.position.y = node.y + Math.sin(t * node.speed + node.offset) * 0.6;
        child.position.x = node.x + Math.cos(t * node.speed * 0.7 + node.offset) * 0.4;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {nodes.map((n) => (
        <mesh key={n.id} position={[n.x, n.y, n.z]}>
          <sphereGeometry args={[n.scale, 16, 16]} />
          <meshBasicMaterial
            color={n.isGold ? THEME.goldLight : THEME.sky}
            transparent
            opacity={0.65}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Ambient Depth Slogans & Geometric Glyphs
 */
function AmbientText({
  position,
  text,
  fontSize = 1.6,
  color = THEME.glow,
  opacity = 0.16,
}: {
  position: [number, number, number];
  text: string;
  fontSize?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <Float position={position} speed={0.25} rotationIntensity={0.06} floatIntensity={0.25}>
      <Text
        fontSize={fontSize}
        maxWidth={14}
        textAlign="center"
        color={color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={opacity}
        outlineWidth={0.008}
        outlineColor={color}
        outlineOpacity={opacity * 0.75}
        letterSpacing={0.12}
        fontWeight="bold"
      >
        {text}
      </Text>
    </Float>
  );
}

/**
 * Dynamic Multi-Axis Parallax Rig
 */
function ParallaxRig({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  const mouse = useRef({ x: 0, y: 0 });
  const scrollY = useRef(0);
  const current = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPointerMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onScroll = () => {
      scrollY.current = window.scrollY || 0;
    };

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    const targetX = mouse.current.x * 0.95;
    const targetY = scrollY.current * 0.0014 + mouse.current.y * 0.55;
    const targetRotY = mouse.current.x * 0.14;
    const targetRotX = mouse.current.y * 0.09;

    const k = Math.min(1, delta * 2.6);
    current.current.x = THREE.MathUtils.lerp(current.current.x, targetX, k);
    current.current.y = THREE.MathUtils.lerp(current.current.y, targetY, k);
    current.current.rotX = THREE.MathUtils.lerp(current.current.rotX, targetRotX, k);
    current.current.rotY = THREE.MathUtils.lerp(current.current.rotY, targetRotY, k);

    const g = groupRef.current;
    const breathe = Math.sin(t * 0.4) * 0.12;

    g.position.x = -current.current.x * 1.5;
    g.position.y = -current.current.y * 1.1 + breathe;
    g.rotation.y = current.current.rotY + Math.sin(t * 0.2) * 0.03;
    g.rotation.x = current.current.rotX;
  });

  return null;
}

/**
 * Drifting Colored Lighting Rig
 */
function DynamicLighting() {
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (light1Ref.current) {
      light1Ref.current.position.x = Math.sin(t * 0.3) * 10;
      light1Ref.current.position.y = Math.cos(t * 0.4) * 6;
    }
    if (light2Ref.current) {
      light2Ref.current.position.x = Math.cos(t * 0.35) * 9;
      light2Ref.current.position.y = Math.sin(t * 0.25) * 5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 9, 7]} intensity={0.95} color="#ffffff" />
      <directionalLight position={[-7, -4, 5]} intensity={0.4} color="#bfdbfe" />

      <pointLight
        ref={light1Ref}
        position={[-8, 4, -2]}
        intensity={9}
        color={THEME.glow}
        distance={28}
      />
      <pointLight
        ref={light2Ref}
        position={[8, -3, -1]}
        intensity={8}
        color={THEME.goldLight}
        distance={26}
      />
      <pointLight
        position={[0, -7, -4]}
        intensity={6}
        color="#38bdf8"
        distance={22}
      />
    </>
  );
}

function ElectionBackgroundScene({ info }: { info: ElectionInfo }) {
  const groupRef = useRef<THREE.Group>(null);

  const ballots = useMemo(
    () => [
      {
        pos: [-7.2, 2.2, -3.2] as [number, number, number],
        rot: [0.12, 0.38, 0.08] as [number, number, number],
        sc: 1.08,
        sp: 0.42,
        num: 1,
        parallax: 1.1,
      },
      {
        pos: [6.8, 2.3, -3.6] as [number, number, number],
        rot: [-0.1, -0.42, 0.06] as [number, number, number],
        sc: 1.04,
        sp: 0.45,
        num: 2,
        parallax: 1.05,
      },
      {
        pos: [-5.0, -2.6, -2.6] as [number, number, number],
        rot: [0.14, 0.48, -0.06] as [number, number, number],
        sc: 0.95,
        sp: 0.48,
        num: 3,
        parallax: 1.2,
      },
      {
        pos: [5.6, -2.8, -3.0] as [number, number, number],
        rot: [-0.09, -0.28, 0.1] as [number, number, number],
        sc: 0.98,
        sp: 0.39,
        num: 4,
        parallax: 1.15,
      },
      {
        pos: [0.1, 4.2, -5.8] as [number, number, number],
        rot: [0.06, 0.12, 0] as [number, number, number],
        sc: 0.85,
        sp: 0.4,
        num: 1,
        parallax: 0.8,
      },
      {
        pos: [-2.4, -4.6, -5.2] as [number, number, number],
        rot: [-0.1, 0.2, 0.05] as [number, number, number],
        sc: 0.8,
        sp: 0.44,
        num: 2,
        parallax: 0.85,
      },
    ],
    []
  );

  const tokens = useMemo(
    () => [
      { pos: [-5.6, 0.4, -2.0] as [number, number, number], sc: 1.25, sp: 0.58, isGold: true },
      { pos: [5.2, 0.6, -2.2] as [number, number, number], sc: 1.15, sp: 0.62, isGold: false },
      { pos: [7.2, -1.1, -3.6] as [number, number, number], sc: 1.35, sp: 0.52, isGold: true },
      { pos: [-6.6, -1.6, -3.4] as [number, number, number], sc: 1.05, sp: 0.48, isGold: false },
      { pos: [2.8, -3.8, -4.2] as [number, number, number], sc: 1.2, sp: 0.66, isGold: true },
      { pos: [-2.6, 3.4, -4.6] as [number, number, number], sc: 0.95, sp: 0.46, isGold: true },
      { pos: [3.4, 3.9, -5.0] as [number, number, number], sc: 1.0, sp: 0.5, isGold: false },
    ],
    []
  );

  return (
    <>
      <ParallaxRig groupRef={groupRef} />

      <fog attach="fog" args={["#f0f7ff", 11, 34]} />

      <DynamicLighting />

      <group ref={groupRef}>
        {/* Digital Ballot Papers with Dynamic School & Election Info */}
        {ballots.map((b, i) => (
          <BallotPaper
            key={`ballot-${i}`}
            position={b.pos}
            rotation={b.rot}
            scale={b.sc}
            speed={b.sp}
            candidateNumber={b.num}
            depthParallax={b.parallax}
            info={info}
          />
        ))}

        {/* Smart Acrylic 3D Ballot Boxes */}
        <BallotBox
          position={[-3.6, 1.4, -5.4]}
          scale={1.3}
          speed={0.28}
          rotationYOffset={0.25}
          info={info}
        />
        <BallotBox
          position={[4.2, -1.9, -6.6]}
          scale={1.1}
          speed={0.32}
          rotationYOffset={-0.4}
          info={info}
        />

        {/* Floating Golden OSIS Medals & Voting Tokens */}
        {tokens.map((t, i) => (
          <VotingToken
            key={`token-${i}`}
            position={t.pos}
            scale={t.sc}
            speed={t.sp}
            isGold={t.isGold}
            info={info}
          />
        ))}

        {/* Ambient Vote Particles */}
        <DigitalVoteStream />

        {/* Deep Atmospheric Typography (Dynamically matches settings) */}
        <AmbientText
          position={[-7.6, -3.4, -9.2]}
          text={info.fullTitle}
          fontSize={1.9}
          color={THEME.glow}
          opacity={0.17}
        />
        <AmbientText
          position={[7.2, 3.8, -9.6]}
          text="SUARA ANDA MASA DEPAN KITA"
          fontSize={1.35}
          color={THEME.sky}
          opacity={0.16}
        />
        <AmbientText
          position={[0, -4.8, -8.5]}
          text="LUBER & JURDIL"
          fontSize={1.7}
          color={THEME.primary}
          opacity={0.15}
        />
        <AmbientText
          position={[-0.4, 4.4, -10.2]}
          text={info.schoolName.toUpperCase()}
          fontSize={1.35}
          color={THEME.gold}
          opacity={0.15}
        />

        {/* Rich Sparkle Systems */}
        <Sparkles
          count={85}
          scale={[28, 17, 11]}
          size={3.2}
          speed={0.28}
          opacity={0.48}
          color={THEME.glow}
        />
        <Sparkles
          count={45}
          scale={[22, 13, 9]}
          size={2.8}
          speed={0.38}
          opacity={0.4}
          color={THEME.goldLight}
        />
        <Sparkles
          count={25}
          scale={[18, 10, 7]}
          size={2.4}
          speed={0.45}
          opacity={0.35}
          color={THEME.emeraldLight}
        />
      </group>
    </>
  );
}

/**
 * PageBackground3D
 * Connected dynamically to application Settings (schoolName, electionTitle, year).
 * Automatically updates whenever settings change in the admin panel.
 */
export default function PageBackground3D({ className, settings: propSettings }: PageBackground3DProps) {
  const { mounted, webglOk } = useWebGLReady();
  const storeSettings = useAppStore((s) => s.settings);

  // Prop takes precedence, then store settings, with built-in fallback
  const activeSettings = propSettings !== undefined ? propSettings : storeSettings;
  const info = useMemo(() => extractElectionInfo(activeSettings), [activeSettings]);

  const blur = typeof activeSettings?.bgBlur === "number" ? activeSettings.bgBlur : 12;
  const opacity = typeof activeSettings?.bgOpacity === "number" ? activeSettings.bgOpacity : 60;

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
          "radial-gradient(circle at 18% 12%, rgba(224, 242, 254, 0.85) 0%, transparent 55%), radial-gradient(circle at 82% 85%, rgba(219, 234, 254, 0.8) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(240, 249, 255, 0.5) 0%, transparent 70%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      }}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ElectionBackgroundScene info={info} />
        </Suspense>
      </Canvas>

      {/* Dynamic Frosted Blur & Dimming Overlay to ensure perfect foreground readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backdropFilter: blur > 0 ? `blur(${blur}px)` : "none",
          WebkitBackdropFilter: blur > 0 ? `blur(${blur}px)` : "none",
          backgroundColor: `rgba(248, 250, 252, ${opacity / 100})`,
          transition: "backdrop-filter 0.3s ease, background-color 0.3s ease",
        }}
      />
    </div>
  );
}
