import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface NetworkNode3DProps {
  position: [number, number, number];
  label: string;
  nodeType: 'client' | 'server' | 'cdn' | 'api';
  isActive?: boolean;
}

const NODE_COLORS: Record<string, string> = {
  client: '#3b82f6',
  server: '#22c55e',
  cdn: '#eab308',
  api: '#a855f7',
};

const NODE_ICONS: Record<string, string> = {
  client: 'CLI',
  server: 'SRV',
  cdn: 'CDN',
  api: 'API',
};

export default function NetworkNode3D({ position, label, nodeType, isActive = true }: NetworkNode3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const color = NODE_COLORS[nodeType];

  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
  }), [color]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t * 0.8 + position[0]) * 0.05;
    }
    if (glowRef.current) {
      const scale = 1.8 + Math.sin(t * 1.2 + position[0] * 2) * 0.15;
      glowRef.current.scale.setScalar(scale);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        isActive ? 0.06 + Math.sin(t * 1.5) * 0.03 : 0.02;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.3;
      ringRef.current.rotation.x = Math.sin(t * 0.2) * 0.3;
    }
  });

  return (
    <group position={position}>
      {/* Outer glow sphere */}
      <Sphere ref={glowRef} args={[0.5, 24, 24]} material={glowMaterial} />

      {/* Rotating ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.42, 0.012, 16, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>

      {/* Core sphere */}
      <Sphere ref={meshRef} args={[0.22, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.6 : 0.15}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>

      {/* Inner bright core */}
      <Sphere args={[0.08, 16, 16]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </Sphere>

      {/* Type label on the node */}
      <Text
        position={[0, 0, 0.25]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {NODE_ICONS[nodeType]}
      </Text>

      {/* Name label below */}
      <Text
        position={[0, -0.55, 0]}
        fontSize={0.12}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>
    </group>
  );
}
