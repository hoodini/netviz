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
  const particleRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Points>(null);

  const color = status === 'error' ? '#ef4444' : METHOD_COLORS[method];
  const direction = isResponse ? -1 : 1;

  // Midpoint with arc
  const midPoint = useMemo((): [number, number, number] => {
    const mx = (from[0] + to[0]) / 2;
    const my = (from[1] + to[1]) / 2 + 0.3;
    const mz = (from[2] + to[2]) / 2 + 0.15;
    return [mx, my, mz];
  }, [from, to]);

  // Create curve for the beam path
  const curve = useMemo(() => {
    const start = isResponse ? new THREE.Vector3(...to) : new THREE.Vector3(...from);
    const end = isResponse ? new THREE.Vector3(...from) : new THREE.Vector3(...to);
    const mid = new THREE.Vector3(...midPoint);
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from, to, midPoint, isResponse]);

  // Trail geometry (points along the curve behind the particle)
  const trailGeometry = useMemo(() => {
    const trailCount = 12;
    const positions = new Float32Array(trailCount * 3);
    const sizes = new Float32Array(trailCount);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, []);

  useFrame(() => {
    const t = Math.max(0, Math.min(1, progress));
    const point = curve.getPoint(t);

    if (particleRef.current) {
      particleRef.current.position.copy(point);
      const scale = 0.06 + Math.sin(t * Math.PI) * 0.02;
      particleRef.current.scale.setScalar(scale);
    }

    // Update trail positions
    if (trailRef.current) {
      const positions = trailGeometry.attributes.position.array as Float32Array;
      const sizes = trailGeometry.attributes.size.array as Float32Array;
      const trailCount = 12;

      for (let i = 0; i < trailCount; i++) {
        const trailT = Math.max(0, t - (i * 0.025));
        const tp = curve.getPoint(trailT);
        positions[i * 3] = tp.x;
        positions[i * 3 + 1] = tp.y;
        positions[i * 3 + 2] = tp.z;
        sizes[i] = Math.max(0.5, (1 - i / trailCount) * 3);
      }
      trailGeometry.attributes.position.needsUpdate = true;
      trailGeometry.attributes.size.needsUpdate = true;
    }
  });

  if (progress < 0 || progress > 1) return null;

  return (
    <group>
      {/* Beam line along the curve */}
      <mesh>
        <tubeGeometry args={[curve, 20, 0.008, 6, false]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15 * direction * direction}
        />
      </mesh>

      {/* Main particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Particle glow */}
      <mesh ref={particleRef ? undefined : undefined} position={particleRef.current?.position}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.BackSide} />
      </mesh>

      {/* Trail particles */}
      <points ref={trailRef} geometry={trailGeometry}>
        <pointsMaterial
          color={color}
          size={0.04}
          transparent
          opacity={0.5}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
