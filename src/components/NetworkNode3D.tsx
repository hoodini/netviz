import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface NetworkNode3DProps {
  position: [number, number, number];
  label: string;
  nodeType: 'client' | 'server' | 'cdn' | 'api';
  color?: string;
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

export default function NetworkNode3D({ position, label, nodeType, color: colorProp, isActive = true }: NetworkNode3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const color = colorProp ?? NODE_COLORS[nodeType];

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

      {/* HTML labels - render as DOM overlay, always face camera */}
      <Html position={[0, -0.55, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center gap-0.5 select-none">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ color: '#fff', backgroundColor: color + '40' }}
          >
            {NODE_ICONS[nodeType]}
          </span>
          <span className="text-[10px] text-gray-400 whitespace-nowrap">{label}</span>
        </div>
      </Html>
    </group>
  );
}
