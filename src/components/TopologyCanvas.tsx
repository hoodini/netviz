import { useRef, useEffect, useCallback } from 'react';
import type { Packet, TopologyNode } from '../types/network';
import { getMethodColor, getStatusColor } from '../utils/colors';

const NODES: TopologyNode[] = [
  { id: 'client', label: 'Client', x: 0.12, y: 0.5, type: 'client', icon: '💻' },
  { id: 'cdn', label: 'CDN', x: 0.42, y: 0.22, type: 'cdn', icon: '⚡' },
  { id: 'api', label: 'API Gateway', x: 0.5, y: 0.5, type: 'api', icon: '🔀' },
  { id: 'server', label: 'Server', x: 0.85, y: 0.35, type: 'server', icon: '🖥️' },
  { id: 'db', label: 'Database', x: 0.85, y: 0.7, type: 'server', icon: '🗄️' },
];

const EDGES: [string, string][] = [
  ['client', 'cdn'],
  ['client', 'api'],
  ['api', 'server'],
  ['api', 'db'],
  ['cdn', 'server'],
];

interface TopologyCanvasProps {
  packets: Packet[];
  width: number;
  height: number;
}

export default function TopologyCanvas({ packets, width, height }: TopologyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getNodePos = useCallback((node: TopologyNode) => ({
    x: node.x * width,
    y: node.y * height,
  }), [width, height]);

  const getEdgePath = useCallback((packet: Packet): { from: TopologyNode; to: TopologyNode } => {
    const isResponse = packet.isResponse;
    const fromNode = isResponse
      ? NODES.find(n => n.id === 'server')!
      : NODES.find(n => n.id === 'client')!;
    const toNode = isResponse
      ? NODES.find(n => n.id === 'client')!
      : NODES.find(n => n.id === 'server')!;
    return { from: fromNode, to: toNode };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(36, 48, 73, 0.3)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw edges
    EDGES.forEach(([fromId, toId]) => {
      const fromNode = NODES.find(n => n.id === fromId)!;
      const toNode = NODES.find(n => n.id === toId)!;
      const from = getNodePos(fromNode);
      const to = getNodePos(toNode);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw packets
    packets.forEach(packet => {
      const { from, to } = getEdgePath(packet);
      const fromPos = getNodePos(from);
      const toPos = getNodePos(to);

      // Route through API node
      const apiPos = getNodePos(NODES.find(n => n.id === 'api')!);
      let currentX: number, currentY: number;

      if (packet.progress < 0.5) {
        const t = packet.progress * 2;
        const midPoint = packet.isResponse ? apiPos : apiPos;
        currentX = fromPos.x + (midPoint.x - fromPos.x) * t;
        currentY = fromPos.y + (midPoint.y - fromPos.y) * t;
      } else {
        const t = (packet.progress - 0.5) * 2;
        const midPoint = packet.isResponse ? apiPos : apiPos;
        currentX = midPoint.x + (toPos.x - midPoint.x) * t;
        currentY = midPoint.y + (toPos.y - midPoint.y) * t;
      }

      const color = packet.status === 'error'
        ? getStatusColor('error')
        : getMethodColor(packet.method);

      // Glow
      const gradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 16);
      gradient.addColorStop(0, color + '60');
      gradient.addColorStop(1, color + '00');
      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(currentX, currentY, 16, 0, Math.PI * 2);
      ctx.fill();

      // Packet dot
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Trail
      const trailLength = 0.08;
      const steps = 6;
      for (let i = 1; i <= steps; i++) {
        const trailProgress = Math.max(0, packet.progress - (trailLength * i) / steps);
        let tx: number, ty: number;
        if (trailProgress < 0.5) {
          const t = trailProgress * 2;
          tx = fromPos.x + (apiPos.x - fromPos.x) * t;
          ty = fromPos.y + (apiPos.y - fromPos.y) * t;
        } else {
          const t = (trailProgress - 0.5) * 2;
          tx = apiPos.x + (toPos.x - apiPos.x) * t;
          ty = apiPos.y + (toPos.y - apiPos.y) * t;
        }
        ctx.beginPath();
        ctx.fillStyle = color + Math.round(30 - (i * 4)).toString(16).padStart(2, '0');
        ctx.arc(tx, ty, 3 - i * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw nodes
    NODES.forEach(node => {
      const pos = getNodePos(node);

      // Node background glow
      const glowGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 40);
      const nodeColor = node.type === 'client' ? '#3b82f6' : node.type === 'cdn' ? '#eab308' : '#22c55e';
      glowGrad.addColorStop(0, nodeColor + '18');
      glowGrad.addColorStop(1, nodeColor + '00');
      ctx.beginPath();
      ctx.fillStyle = glowGrad;
      ctx.arc(pos.x, pos.y, 40, 0, Math.PI * 2);
      ctx.fill();

      // Node circle
      ctx.beginPath();
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = nodeColor + '80';
      ctx.lineWidth = 2;
      ctx.arc(pos.x, pos.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Icon
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.icon, pos.x, pos.y);

      // Label
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, pos.x, pos.y + 38);
    });

  }, [packets, width, height, getNodePos, getEdgePath]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="rounded-xl"
    />
  );
}
