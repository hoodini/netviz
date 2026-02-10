import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { HttpMethod, RequestStatus } from '../types/network';

interface DataBeamProps {
  from: [number, number, number];
  to: [number, number, number];
  progress: number;
  method: HttpMethod;
  status: RequestStatus;
  isResponse: boolean;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#3b82f6',
  POST: '#22c55e',
  PUT: '#eab308',
  DELETE: '#ef4444',
  PATCH: '#a855f7',
  OPTIONS: '#6b7280',
  HEAD: '#6b7280',
};

export default function DataBeam({ from, to, progress, method, status, isResponse }: DataBeamProps) {
  const groupRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Points>(null);

  const color = status === 'error' ? '#ef4444' : METHOD_COLORS[method];

  const curve = useMemo(() => {
    const start = isResponse ? new THREE.Vector3(...to) : new THREE.Vector3(...from);
    const end = isResponse ? new THREE.Vector3(...from) : new THREE.Vector3(...to);
    const mx = (from[0] + to[0]) / 2;
    const my = (from[1] + to[1]) / 2 + 0.3;
    const mz = (from[2] + to[2]) / 2 + 0.15;
    return new THREE.QuadraticBezierCurve3(start, new THREE.Vector3(mx, my, mz), end);
  }, [from, to, isResponse]);

  const trailGeometry = useMemo(() => {
    const count = 10;
    const positions = new Float32Array(count * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(() => {
    const t = Math.max(0, Math.min(1, progress));
    const point = curve.getPoint(t);

    // Move the whole group (particle + glow) to the curve position
    if (groupRef.current) {
      groupRef.current.position.copy(point);
    }

    // Update trail
    if (trailRef.current) {
      const positions = trailGeometry.attributes.position.array as Float32Array;
      const count = 10;
      for (let i = 0; i < count; i++) {
        const trailT = Math.max(0, t - i * 0.02);
        const tp = curve.getPoint(trailT);
        positions[i * 3] = tp.x;
        positions[i * 3 + 1] = tp.y;
        positions[i * 3 + 2] = tp.z;
      }
      trailGeometry.attributes.position.needsUpdate = true;
    }
  });

  if (progress < 0 || progress > 1) return null;

  return (
    <>
      {/* Beam path */}
      <mesh>
        <tubeGeometry args={[curve, 20, 0.006, 4, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>

      {/* Moving particle + glow as a group */}
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.BackSide} />
        </mesh>
      </group>

      {/* Trail */}
      <points ref={trailRef} geometry={trailGeometry}>
        <pointsMaterial
          color={color}
          size={0.03}
          transparent
          opacity={0.4}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
}
