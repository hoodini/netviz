import { useRef, useEffect, useCallback } from 'react';
import type { Packet, TopologyNode } from '../types/network';
import { getMethodColor, getStatusColor } from '../utils/colors';
import { drawTechIcon } from '../utils/techDetection';

interface TopologyCanvasProps {
  packets: Packet[];
  nodes: TopologyNode[];
  width: number;
  height: number;
}

/** Quadratic bezier point at t */
function bezierPoint(
  p0x: number, p0y: number,
  cpx: number, cpy: number,
  p1x: number, p1y: number,
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * p0x + 2 * mt * t * cpx + t * t * p1x,
    y: mt * mt * p0y + 2 * mt * t * cpy + t * t * p1y,
  };
}

export default function TopologyCanvas({ packets, nodes, width, height }: TopologyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getNodePos = useCallback((node: TopologyNode) => ({
    x: node.x * width,
    y: node.y * height,
  }), [width, height]);

  const findNode = useCallback((nodeId: string): TopologyNode | undefined => {
    return nodes.find(n => n.id === nodeId);
  }, [nodes]);

  const clientNode = nodes.find(n => n.type === 'client');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !clientNode) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(36, 48, 73, 0.2)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const clientPos = getNodePos(clientNode);
    const serverNodes = nodes.filter(n => n.type !== 'client');

    // Draw edges (bezier curves from client to each server)
    serverNodes.forEach(serverNode => {
      const serverPos = getNodePos(serverNode);
      const cpx = (clientPos.x + serverPos.x) * 0.45;
      const cpy = (clientPos.y + serverPos.y) * 0.5;

      // Edge line
      ctx.beginPath();
      ctx.strokeStyle = serverNode.color + '18';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.moveTo(clientPos.x, clientPos.y);
      ctx.quadraticCurveTo(cpx, cpy, serverPos.x, serverPos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Active edge highlight if packets are traveling this route
      const hasTraffic = packets.some(p => p.targetNodeId === serverNode.id);
      if (hasTraffic) {
        ctx.beginPath();
        ctx.strokeStyle = serverNode.color + '30';
        ctx.lineWidth = 3;
        ctx.moveTo(clientPos.x, clientPos.y);
        ctx.quadraticCurveTo(cpx, cpy, serverPos.x, serverPos.y);
        ctx.stroke();
      }
    });

    // Draw packets along bezier curves
    packets.forEach(packet => {
      const targetNode = findNode(packet.targetNodeId);
      if (!targetNode) return;

      const serverPos = getNodePos(targetNode);
      const cpx = (clientPos.x + serverPos.x) * 0.45;
      const cpy = (clientPos.y + serverPos.y) * 0.5;

      let fromX: number, fromY: number, toX: number, toY: number;
      let controlX: number, controlY: number;

      if (packet.isResponse) {
        fromX = serverPos.x; fromY = serverPos.y;
        toX = clientPos.x; toY = clientPos.y;
        controlX = cpx; controlY = cpy;
      } else {
        fromX = clientPos.x; fromY = clientPos.y;
        toX = serverPos.x; toY = serverPos.y;
        controlX = cpx; controlY = cpy;
      }

      const pos = bezierPoint(fromX, fromY, controlX, controlY, toX, toY, packet.progress);
      const color = packet.status === 'error'
        ? getStatusColor('error')
        : getMethodColor(packet.method);

      // Outer glow
      const glowRadius = 20;
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowRadius);
      gradient.addColorStop(0, color + '50');
      gradient.addColorStop(0.5, color + '18');
      gradient.addColorStop(1, color + '00');
      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Trail
      const trailSteps = 8;
      for (let i = 1; i <= trailSteps; i++) {
        const tp = Math.max(0, packet.progress - (0.06 * i) / trailSteps);
        const trailPos = bezierPoint(fromX, fromY, controlX, controlY, toX, toY, tp);
        const alpha = Math.max(0, 0.4 - i * 0.05);
        ctx.beginPath();
        ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.arc(trailPos.x, trailPos.y, 4 - i * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core dot
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Direction indicator (small arrow on the dot)
      if (packet.progress > 0.05 && packet.progress < 0.95) {
        const prevPos = bezierPoint(fromX, fromY, controlX, controlY, toX, toY, Math.max(0, packet.progress - 0.02));
        const angle = Math.atan2(pos.y - prevPos.y, pos.x - prevPos.x);
        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.moveTo(pos.x + Math.cos(angle) * 3, pos.y + Math.sin(angle) * 3);
        ctx.lineTo(pos.x + Math.cos(angle + 2.5) * 2, pos.y + Math.sin(angle + 2.5) * 2);
        ctx.lineTo(pos.x + Math.cos(angle - 2.5) * 2, pos.y + Math.sin(angle - 2.5) * 2);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = getNodePos(node);
      const isClient = node.type === 'client';
      const radius = isClient ? 28 : 24;

      // Pulse ring for active nodes
      const activePackets = packets.filter(p =>
        p.targetNodeId === node.id || (isClient && p.progress > 0)
      ).length;
      if (activePackets > 0) {
        const pulseRadius = radius + 8 + Math.sin(Date.now() / 300) * 3;
        ctx.beginPath();
        ctx.strokeStyle = node.color + '30';
        ctx.lineWidth = 1.5;
        ctx.arc(pos.x, pos.y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Node glow
      const glowGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius + 16);
      glowGrad.addColorStop(0, node.color + '15');
      glowGrad.addColorStop(1, node.color + '00');
      ctx.beginPath();
      ctx.fillStyle = glowGrad;
      ctx.arc(pos.x, pos.y, radius + 16, 0, Math.PI * 2);
      ctx.fill();

      // Node circle
      ctx.beginPath();
      ctx.fillStyle = '#0f1729';
      ctx.strokeStyle = node.color + '60';
      ctx.lineWidth = 2;
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tech icon inside node
      if (isClient) {
        // Browser icon
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        const s = radius * 0.45;
        // Window frame
        ctx.strokeRect(pos.x - s, pos.y - s * 0.8, s * 2, s * 1.6);
        // Title bar
        ctx.beginPath();
        ctx.moveTo(pos.x - s, pos.y - s * 0.35);
        ctx.lineTo(pos.x + s, pos.y - s * 0.35);
        ctx.stroke();
        // Dots in title bar
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(pos.x - s * 0.6, pos.y - s * 0.58, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(pos.x - s * 0.3, pos.y - s * 0.58, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - s * 0.58, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (node.techStack) {
        drawTechIcon(ctx, node.techStack, pos.x, pos.y, radius);
      } else {
        // Generic server icon
        ctx.font = `bold ${radius * 0.7}px system-ui`;
        ctx.fillStyle = node.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', pos.x, pos.y + 1);
      }

      // Label
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, pos.x, pos.y + radius + 14);

      // Request count badge
      if (node.requestCount > 0 && !isClient) {
        const badgeText = String(node.requestCount);
        ctx.font = 'bold 9px system-ui';
        const bw = ctx.measureText(badgeText).width + 8;
        const bx = pos.x + radius * 0.6;
        const by = pos.y - radius * 0.7;

        ctx.beginPath();
        ctx.fillStyle = node.color + '40';
        ctx.roundRect(bx - bw / 2, by - 7, bw, 14, 7);
        ctx.fill();

        ctx.fillStyle = node.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, bx, by);
      }
    });

  }, [packets, nodes, width, height, getNodePos, findNode, clientNode]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="rounded-xl"
    />
  );
}
