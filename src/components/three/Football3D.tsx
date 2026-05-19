import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

const PHI = (1 + Math.sqrt(5)) / 2;

const ICOSA_VERTS: [number, number, number][] = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
];

function PentagonPatch({
  position,
  color = "#f6efe1",
}: {
  position: [number, number, number];
  color?: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useEffect(() => {
    if (!ref.current) return;
    const outward = new THREE.Vector3(...position).multiplyScalar(2);
    ref.current.lookAt(outward);
  }, [position]);

  return (
    <mesh ref={ref} position={position}>
      <circleGeometry args={[0.42, 5]} />
      <meshStandardMaterial
        color={color}
        side={THREE.DoubleSide}
        roughness={0.45}
        metalness={0.05}
      />
    </mesh>
  );
}

export function Football3D({
  scale = 1,
  spinSpeed = 0.45,
}: {
  scale?: number;
  spinSpeed?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const radius = 1.4;

  const patchPositions = useMemo<[number, number, number][]>(
    () =>
      ICOSA_VERTS.map((v) => {
        const len = Math.hypot(v[0], v[1], v[2]);
        const s = (radius * 1.008) / len;
        return [v[0] * s, v[1] * s, v[2] * s];
      }),
    [],
  );

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * spinSpeed;
    group.current.rotation.x += delta * spinSpeed * 0.35;
  });

  return (
    <Float floatIntensity={1.4} rotationIntensity={0.25} speed={1.2}>
      <group ref={group} scale={scale}>
        {/* Core dark icosahedron */}
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[radius, 1]} />
          <meshStandardMaterial
            color="#101720"
            metalness={0.22}
            roughness={0.42}
            flatShading
          />
        </mesh>

        {/* Cream pentagon patches at icosahedron vertices */}
        {patchPositions.map((pos, i) => (
          <PentagonPatch key={i} position={pos} />
        ))}

        {/* Primary-color emissive wireframe rim */}
        <mesh>
          <icosahedronGeometry args={[radius * 1.012, 1]} />
          <meshBasicMaterial
            color="#ef5b32"
            wireframe
            transparent
            opacity={0.18}
          />
        </mesh>
      </group>
    </Float>
  );
}
