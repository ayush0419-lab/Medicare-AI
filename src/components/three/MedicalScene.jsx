import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';

const THEMES = {
  hero: {
    primary: '#48e8ff',
    secondary: '#7c3cff',
    accent: '#34d399',
    glow: '#0ea5e9',
  },
  dashboard: {
    primary: '#2563eb',
    secondary: '#14b8a6',
    accent: '#f59e0b',
    glow: '#38bdf8',
  },
  patient: {
    primary: '#06b6d4',
    secondary: '#38bdf8',
    accent: '#34d399',
    glow: '#67e8f9',
  },
  doctor: {
    primary: '#10b981',
    secondary: '#0ea5e9',
    accent: '#a3e635',
    glow: '#6ee7b7',
  },
  hospital: {
    primary: '#4f46e5',
    secondary: '#06b6d4',
    accent: '#f59e0b',
    glow: '#818cf8',
  },
  admin: {
    primary: '#8b5cf6',
    secondary: '#ec4899',
    accent: '#22d3ee',
    glow: '#c084fc',
  },
};

const chooseTheme = (variant, role) => THEMES[role] || THEMES[variant] || THEMES.hero;

const seededUnit = (index, salt = 0) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

function OrbitRing({ radius, color, rotation = [0, 0, 0], speed = 0.25 }) {
  const ring = useRef();

  useFrame(({ clock }) => {
    if (!ring.current) return;
    ring.current.rotation.z = clock.elapsedTime * speed;
  });

  return (
    <mesh ref={ring} rotation={rotation}>
      <torusGeometry args={[radius, 0.01, 12, 160]} />
      <meshBasicMaterial color={color} transparent opacity={0.68} />
    </mesh>
  );
}

function Helix({ theme }) {
  const group = useRef();
  const { strandA, strandB, beads } = useMemo(() => {
    const a = [];
    const b = [];
    const nodes = [];
    const count = 44;

    for (let i = 0; i < count; i += 1) {
      const progress = i / (count - 1);
      const angle = progress * Math.PI * 5.8;
      const y = (progress - 0.5) * 2.85;
      const radius = 0.78;
      const pointA = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      const pointB = new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);

      a.push(pointA);
      b.push(pointB);

      // Reduce draw calls by placing beads every 4th index instead of 2nd index
      if (i % 4 === 0) {
        nodes.push({ position: pointA.toArray(), color: i % 8 === 0 ? theme.accent : theme.primary });
        nodes.push({ position: pointB.toArray(), color: i % 8 === 0 ? theme.secondary : theme.glow });
      }
    }

    return {
      strandA: new THREE.BufferGeometry().setFromPoints(a),
      strandB: new THREE.BufferGeometry().setFromPoints(b),
      beads: nodes,
    };
  }, [theme]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = clock.elapsedTime * 0.22;
  });

  return (
    <group ref={group} scale={0.82}>
      <line geometry={strandA}>
        <lineBasicMaterial color={theme.primary} transparent opacity={0.55} />
      </line>
      <line geometry={strandB}>
        <lineBasicMaterial color={theme.secondary} transparent opacity={0.45} />
      </line>
      {beads.map((bead, index) => (
        <mesh key={`${bead.color}-${index}`} position={bead.position}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshBasicMaterial color={bead.color} />
        </mesh>
      ))}
    </group>
  );
}

function SignalParticles({ theme, amount = 90, radius = 4.2 }) {
  const points = useRef();
  const positions = useMemo(() => {
    const values = new Float32Array(amount * 3);
    for (let i = 0; i < amount; i += 1) {
      const theta = seededUnit(i, amount) * Math.PI * 2;
      const phi = Math.acos(2 * seededUnit(i, radius) - 1);
      const r = radius * (0.45 + seededUnit(i, amount + radius) * 0.55);
      values[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      values[i * 3 + 1] = Math.cos(phi) * r * 0.64;
      values[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
    }
    return values;
  }, [amount, radius]);

  useFrame(({ clock }) => {
    if (!points.current) return;
    points.current.rotation.y = clock.elapsedTime * 0.035;
    points.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.06;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={theme.glow}
        size={0.032}
        transparent
        opacity={0.55}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function CapsuleCluster({ theme, compact = false }) {
  const group = useRef();
  const capsules = useMemo(() => {
    const spread = compact ? 1.75 : 2.35;
    return Array.from({ length: compact ? 8 : 13 }, (_, index) => {
      const angle = (index / (compact ? 8 : 13)) * Math.PI * 2;
      const lift = Math.sin(index * 1.65) * 0.9;
      return {
        position: [Math.cos(angle) * spread, lift, Math.sin(angle) * spread],
        rotation: [Math.sin(index) * 0.7, angle, Math.cos(index) * 0.5],
        color: index % 3 === 0 ? theme.accent : index % 2 === 0 ? theme.primary : theme.secondary,
      };
    });
  }, [compact, theme]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = -clock.elapsedTime * 0.12;
  });

  return (
    <group ref={group}>
      {capsules.map((capsule, index) => (
        <mesh key={index} position={capsule.position} rotation={capsule.rotation}>
          <capsuleGeometry args={[0.045, compact ? 0.28 : 0.38, 3, 6]} />
          <meshStandardMaterial
            color={capsule.color}
            emissive={capsule.color}
            emissiveIntensity={0.25}
            metalness={0.1}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

function HoloPanel({ theme, position, rotation, scale = 1 }) {
  const panel = useRef();

  useFrame(({ clock }) => {
    if (!panel.current) return;
    panel.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.4 + position[0]) * 0.035;
  });

  return (
    <group ref={panel} position={position} rotation={rotation} scale={scale}>
      <mesh>
        <boxGeometry args={[1.05, 0.62, 0.035]} />
        <meshStandardMaterial
          color={theme.primary}
          emissive={theme.primary}
          emissiveIntensity={0.28}
          transparent
          opacity={0.2}
          roughness={0.28}
          metalness={0.45}
        />
      </mesh>
      {[0.18, 0, -0.18].map((y, index) => (
        <mesh key={y} position={[-0.12, y, 0.04]}>
          <boxGeometry args={[0.58 - index * 0.12, 0.025, 0.025]} />
          <meshBasicMaterial color={index === 1 ? theme.accent : theme.glow} transparent opacity={0.72} />
        </mesh>
      ))}
      <mesh position={[0.37, 0.18, 0.045]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshBasicMaterial color={theme.accent} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function MedicalCore({ theme, variant }) {
  const core = useRef();
  const compact = variant === 'dashboard';

  useFrame(({ clock, pointer }) => {
    if (!core.current) return;
    core.current.rotation.y = clock.elapsedTime * 0.18 + pointer.x * 0.16;
    core.current.rotation.x = Math.sin(clock.elapsedTime * 0.28) * 0.08 + pointer.y * 0.08;
  });

  return (
    <group ref={core}>
      <mesh scale={compact ? 0.72 : 1}>
        <icosahedronGeometry args={[1, compact ? 1 : 2]} />
        <meshStandardMaterial
          color={theme.primary}
          emissive={theme.glow}
          emissiveIntensity={0.1}
          transparent
          opacity={0.18}
          metalness={0.35}
          roughness={0.2}
        />
      </mesh>
      <mesh scale={compact ? 0.735 : 1.018}>
        <icosahedronGeometry args={[1, compact ? 1 : 2]} />
        <meshBasicMaterial color={theme.glow} wireframe transparent opacity={0.3} />
      </mesh>
      <mesh scale={compact ? 0.22 : 0.32}>
        <sphereGeometry args={[1, compact ? 16 : 24, compact ? 16 : 24]} />
        <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={0.7} />
      </mesh>
      <OrbitRing radius={compact ? 1.15 : 1.52} color={theme.primary} rotation={[Math.PI / 2.7, 0, 0]} speed={0.45} />
      <OrbitRing radius={compact ? 1.02 : 1.35} color={theme.secondary} rotation={[0.35, Math.PI / 2.2, 0]} speed={-0.32} />
      <OrbitRing radius={compact ? 0.86 : 1.12} color={theme.accent} rotation={[0.12, 0.45, Math.PI / 2]} speed={0.24} />
      {!compact && <Helix theme={theme} />}
    </group>
  );
}

function SceneContent({ variant, role }) {
  const theme = chooseTheme(variant, role);
  const isDashboard = variant === 'dashboard';
  const isHero = variant === 'hero';

  return (
    <>
      <ambientLight intensity={isDashboard ? 0.9 : 0.5} />
      <directionalLight position={[3, 4, 5]} intensity={isDashboard ? 1.0 : 1.4} color="#ffffff" />
      {!isDashboard && <pointLight position={[-3, 2, 2]} intensity={2.4} color={theme.primary} />}
      {!isDashboard && <pointLight position={[3, -2, -3]} intensity={1.5} color={theme.secondary} />}
      {isDashboard && <pointLight position={[0, 2, 3]} intensity={2.0} color={theme.primary} />}

      <group position={isDashboard ? [1.8, 0.2, 0] : isHero ? [1.55, -0.1, 0] : [0.2, 0, 0]} scale={isDashboard ? 0.82 : 1}>
        <MedicalCore theme={theme} variant={variant} />
        <CapsuleCluster theme={theme} compact={isDashboard} />
        {!isDashboard && (
          <>
            <HoloPanel theme={theme} position={[-2.15, 0.92, -0.38]} rotation={[0.15, 0.55, -0.08]} scale={0.92} />
            <HoloPanel theme={theme} position={[2.05, -0.72, -0.25]} rotation={[-0.1, -0.55, 0.08]} scale={0.82} />
          </>
        )}
      </group>

      <SignalParticles theme={theme} amount={isDashboard ? 45 : 90} radius={isDashboard ? 3.0 : 4.5} />
    </>
  );
}

export function MedicalScene({ variant = 'hero', role, className = '' }) {
  const camera = variant === 'dashboard'
    ? { position: [0, 0, 6.8], fov: 42 }
    : { position: [0, 0, 6], fov: 44 };

  return (
    <div className={`medical-scene pointer-events-none ${className}`} aria-hidden="true">
      <Canvas
        camera={camera}
        dpr={[1, 1.35]}
        performance={{ min: 0.5 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#000000'), 0);
        }}
      >
        <Suspense fallback={null}>
          <SceneContent variant={variant} role={role} />
        </Suspense>
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
