import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import NetworkNode3D from './NetworkNode3D';
import DataBeam from './DataBeam';
import type { Packet, TopologyNode } from '../types/network';

interface NetworkScene3DProps {
  packets: Packet[];
  topologyNodes: TopologyNode[];
  isCapturing: boolean;
}

/** Convert 2D topology coordinates (0-1 range) to 3D positions */
function toPosition(node: TopologyNode): [number, number, number] {
  const x = (node.x - 0.5) * 8;
  const y = (0.5 - node.y) * 4;
  const z = node.type === 'client' ? 0.5 : (node.x - 0.5) * -1;
  return [x, y, z];
}

function getNodeType(node: TopologyNode): 'client' | 'server' | 'cdn' | 'api' {
  return node.type;
}

function SceneContent({ packets, topologyNodes, isCapturing }: NetworkScene3DProps) {
  // Build a lookup of node positions by ID
  const nodePositions = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const node of topologyNodes) {
      map.set(node.id, toPosition(node));
    }
    return map;
  }, [topologyNodes]);

  // Compute edges: client connects to every non-client node
  const edges = useMemo(() => {
    const clientNode = topologyNodes.find(n => n.type === 'client');
    if (!clientNode) return [];
    return topologyNodes
      .filter(n => n.type !== 'client')
      .map(n => [clientNode.id, n.id] as [string, string]);
  }, [topologyNodes]);

  // Map packets to beams — route from client to targetNodeId
  const beams = useMemo(() => {
    return packets.map(packet => {
      const clientId = topologyNodes.find(n => n.type === 'client')?.id ?? 'client';
      const targetId = packet.targetNodeId;
      const clientPos = nodePositions.get(clientId) ?? [-3, 0, 0];
      const targetPos = nodePositions.get(targetId) ?? [2, 0, 0];

      return {
        id: packet.id,
        from: packet.isResponse ? targetPos : clientPos,
        to: packet.isResponse ? clientPos : targetPos,
        progress: packet.progress,
        method: packet.method,
        status: packet.status,
        isResponse: packet.isResponse,
      };
    });
  }, [packets, topologyNodes, nodePositions]);

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.4} color="#3b82f6" />
      <pointLight position={[-5, 3, -3]} intensity={0.3} color="#a855f7" />
      <pointLight position={[0, -3, 5]} intensity={0.2} color="#22c55e" />

      <Stars radius={50} depth={40} count={2000} factor={3} saturation={0.2} fade speed={0.5} />
      <gridHelper args={[20, 40, '#1a2235', '#111827']} position={[0, -2, 0]} />

      {/* Connection edges */}
      {edges.map(([fromId, toId]) => {
        const from = nodePositions.get(fromId);
        const to = nodePositions.get(toId);
        if (!from || !to) return null;
        return <EdgeLine key={`${fromId}-${toId}`} from={from} to={to} />;
      })}

      {/* Dynamic network nodes */}
      {topologyNodes.map(node => (
        <NetworkNode3D
          key={node.id}
          position={toPosition(node)}
          label={node.label}
          nodeType={getNodeType(node)}
          color={node.color}
          isActive={isCapturing}
        />
      ))}

      {/* Data beams */}
      {beams.map(beam => (
        <DataBeam
          key={beam.id}
          from={beam.from as [number, number, number]}
          to={beam.to as [number, number, number]}
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

export default function NetworkScene3D({ packets, topologyNodes, isCapturing }: NetworkScene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 2, 6], fov: 50, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
    >
      <SceneContent packets={packets} topologyNodes={topologyNodes} isCapturing={isCapturing} />
    </Canvas>
  );
}
