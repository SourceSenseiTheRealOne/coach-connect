import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Float,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import { Football3D } from "./Football3D";

function OrbitDots({ count = 28 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const t = (i / count) * Math.PI * 2;
        const r = 2.8 + Math.sin(i * 1.7) * 0.25;
        return {
          pos: [
            Math.cos(t) * r,
            Math.sin(t * 1.3) * 0.6 + Math.cos(i) * 0.3,
            Math.sin(t) * r,
          ] as [number, number, number],
          size: 0.04 + (i % 5) * 0.012,
          accent: i % 4 === 0,
        };
      }),
    [count],
  );

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.18;
  });

  return (
    <group ref={group}>
      {dots.map((d, i) => (
        <Float
          key={i}
          floatIntensity={1.6}
          rotationIntensity={0}
          speed={1 + (i % 3) * 0.3}
        >
          <mesh position={d.pos}>
            <sphereGeometry args={[d.size, 16, 16]} />
            <meshStandardMaterial
              color={d.accent ? "#ef5b32" : "#f6efe1"}
              emissive={d.accent ? "#ef5b32" : "#000000"}
              emissiveIntensity={d.accent ? 0.8 : 0}
              roughness={0.4}
              metalness={0.2}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function FieldLines() {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.85, 0]}>
      <mesh>
        <ringGeometry args={[1.6, 1.62, 64]} />
        <meshBasicMaterial color="#ef5b32" transparent opacity={0.55} />
      </mesh>
      <mesh>
        <ringGeometry args={[2.4, 2.42, 64]} />
        <meshBasicMaterial color="#ef5b32" transparent opacity={0.25} />
      </mesh>
      <mesh>
        <ringGeometry args={[3.1, 3.12, 64]} />
        <meshBasicMaterial color="#ef5b32" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

export function HeroScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <PerspectiveCamera makeDefault position={[0, 0.6, 6]} fov={42} />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[5, 6, 4]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-4, 2, -3]} intensity={0.7} color="#ef5b32" />
      <pointLight position={[3, -2, 4]} intensity={0.35} color="#3aa8c1" />

      <Suspense fallback={null}>
        <Football3D scale={1.05} />
        <OrbitDots />
        <FieldLines />
        <ContactShadows
          position={[0, -1.7, 0]}
          opacity={0.45}
          scale={8}
          blur={2.4}
          far={3}
        />
      </Suspense>
    </Canvas>
  );
}

export default HeroScene;
