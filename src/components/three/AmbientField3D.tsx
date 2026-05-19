import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ParticleField({ count = 180 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const primary = new THREE.Color("#ef5b32");
    const muted = new THREE.Color("#f6efe1");
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
      const c = Math.random() < 0.18 ? primary : muted;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.025;
    const t = state.clock.elapsedTime;
    ref.current.position.y = Math.sin(t * 0.3) * 0.15;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function FloatingShape({
  position,
  color,
  scale = 1,
  speed = 1,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed;
    ref.current.rotation.x = t * 0.3;
    ref.current.rotation.y = t * 0.4;
    ref.current.position.y = position[1] + Math.sin(t * 0.7) * 0.4;
  });
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <icosahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial
        color={color}
        wireframe
        transparent
        opacity={0.35}
      />
    </mesh>
  );
}

export function AmbientField3D() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 6], fov: 55 }}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 4, 5]} intensity={0.6} color="#ef5b32" />
      <Suspense fallback={null}>
        <ParticleField />
        <FloatingShape
          position={[-4.5, 1.6, -1]}
          color="#ef5b32"
          scale={1.2}
          speed={0.6}
        />
        <FloatingShape
          position={[5, -1.4, -1.5]}
          color="#3aa8c1"
          scale={0.9}
          speed={0.9}
        />
        <FloatingShape
          position={[2, 2.2, -3]}
          color="#ef5b32"
          scale={0.7}
          speed={0.5}
        />
      </Suspense>
    </Canvas>
  );
}

export default AmbientField3D;
