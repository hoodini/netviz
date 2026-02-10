import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import NetworkNode3D from './NetworkNode3D';
import DataBeam from './DataBeam';
import type { Packet } from '../types/network';

interface NetworkScene3DProps {
  packets: Packet[];
  isCapturing: boolean;
}

interface SceneNode {
  id: string;
  label: string;
  position: [number, number, number];
  type: 'client' | 'server' | 'cdn' | 'api';
}

const SCENE_NODES: SceneNode[] = [
  { id: 'client', label: 'Client', position: [-3, 0, 0], type: 'client' },
  { id: 'cdn', label: 'CDN Edge', position: [-0.8, 1.4, -0.5], type: 'cdn' },
  { id: 'api', label: 'API Gateway', position: [0, 0, 0.3], type: 'api' },
  { id: 'server', label: 'Server', position: [2.5, 0.6, -0.3], type: 'server' },
  { id: 'db', label: 'Database', position: [2.5, -0.8, 0.4], type: 'server' },
];

const EDGES: [string, string][] = [
  ['client', 'cdn'],
  ['client', 'api'],
  ['api', 'server'],
  ['api', 'db'],
  ['cdn', 'server'],
];

function getNodePosition(id: string): [number, number, number] {
  return SCENE_NODES.find(n => n.id === id)?.position ?? [0, 0, 0];
}

function SceneContent({ packets, isCapturing }: NetworkScene3DProps) {
  const beams = useMemo(() => {
    return packets.map(packet => {
      const fromId = packet.isResponse ? 'server' : 'client';
      const toId = packet.isResponse ? 'client' : 'server';
      const apiPos = getNodePosition('api');

      let from: [number, number, number];
      let to: [number, number, number];

      if (packet.progress < 0.5) {
        from = getNodePosition(fromId);
        to = apiPos;
      } else {
        from = apiPos;
        to = getNodePosition(toId);
      }

      const localProgress = packet.progress < 0.5
        ? packet.progress * 2
        : (packet.progress - 0.5) * 2;

      return {
        id: packet.id,
        from,
        to,
        progress: localProgress,
        method: packet.method,
        status: packet.status,
        isResponse: packet.isResponse,
      };
    });
  }, [packets]);

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.4} color="#3b82f6" />
      <pointLight position={[-5, 3, -3]} intensity={0.3} color="#a855f7" />
      <pointLight position={[0, -3, 5]} intensity={0.2} color="#22c55e" />

      <Stars radius={50} depth={40} count={2000} factor={3} saturation={0.2} fade speed={0.5} />

      <gridHelper args={[20, 40, '#1a2235', '#111827']} position={[0, -2, 0]} />

      {EDGES.map(([fromId, toId]) => (
        <EdgeLine key={`${fromId}-${toId}`} from={getNodePosition(fromId)} to={getNodePosition(toId)} />
      ))}

      {SCENE_NODES.map(node => (
        <NetworkNode3D
          key={node.id}
          position={node.position}
          label={node.label}
          nodeType={node.type}
          isActive={isCapturing}
        />
      ))}

      {beams.map(beam => (
        <DataBeam
          key={beam.id}
          from={beam.from}
          to={beam.to}
          progress={beam.progress}
          method={beam.method}
          status={beam.status}
          isResponse={beam.isResponse}
        />
      ))}

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.8}
          mipmapBlur
        />
      </EffectComposer>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        enablePan={false}
        minDistance={3}
        maxDistance={12}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

function EdgeLine({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const points = useMemo(() => [
    new THREE.Vector3(...from),
    new THREE.Vector3(...to),
  ], [from, to]);

  return (
    <Line
      points={points}
      color="#243049"
      lineWidth={1}
      transparent
      opacity={0.4}
      dashed
      dashSize={0.1}
      gapSize={0.05}
    />
  );
}

export default function NetworkScene3D({ packets, isCapturing }: NetworkScene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 2, 6], fov: 50, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
    >
      <SceneContent packets={packets} isCapturing={isCapturing} />
    </Canvas>
  );
}
