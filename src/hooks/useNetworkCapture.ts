import { useState, useCallback, useRef, useEffect } from 'react';
import type { NetworkRequest, DashboardStats, Packet, TopologyNode } from '../types/network';
import { startCapture, stopCapture, resumeCapture } from '../services/realTraffic';
import { generateId } from '../utils/colors';
import { getHostname, detectTechStack, getNodeTypeFromTech } from '../utils/techDetection';

const MAX_REQUESTS = 200;
const CLIENT_NODE: TopologyNode = {
  id: 'client',
  label: 'Browser',
  x: 0.07,
  y: 0.5,
  type: 'client',
  color: '#3b82f6',
  requestCount: 0,
};

function buildTopologyNodes(requests: NetworkRequest[]): TopologyNode[] {
  const hostMap = new Map<string, { count: number; tech: ReturnType<typeof detectTechStack> }>();

  for (const req of requests) {
    const host = req.hostname;
    const existing = hostMap.get(host);
    if (existing) {
      existing.count++;
    } else {
      hostMap.set(host, {
        count: 1,
        tech: req.techStack ?? detectTechStack(req.url),
      });
    }
  }

  const hosts = Array.from(hostMap.entries())
    .sort((a, b) => b[1].count - a[1].count);

  const serverNodes: TopologyNode[] = hosts.map(([host, data], index) => {
    const total = hosts.length;
    const yPadding = 0.1;
    const yRange = 1 - 2 * yPadding;
    const y = total === 1
      ? 0.5
      : yPadding + (index / (total - 1)) * yRange;

    const xBase = 0.82;
    const xOffset = (index % 3 - 1) * 0.06;
    const nodeType = getNodeTypeFromTech(data.tech);

    return {
      id: `host-${host}`,
      label: host.length > 22 ? host.slice(0, 20) + '…' : host,
      x: xBase + xOffset,
      y,
      type: nodeType,
      color: data.tech.color,
      techStack: data.tech,
      requestCount: data.count,
    };
  });

  return [
    { ...CLIENT_NODE, requestCount: requests.length },
    ...serverNodes,
  ];
}

export function useNetworkCapture() {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [isCapturing, setIsCapturing] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const [topologyNodes, setTopologyNodes] = useState<TopologyNode[]>([CLIENT_NODE]);
  const animFrameRef = useRef<number>(0);
  const captureInitialized = useRef(false);

  const addRequest = useCallback((request: NetworkRequest) => {
    if (!request.hostname) {
      request.hostname = getHostname(request.url);
    }
    if (!request.techStack) {
      request.techStack = detectTechStack(request.url);
    }

    const targetNodeId = `host-${request.hostname}`;

    setRequests(prev => {
      const next = [request, ...prev];
      const trimmed = next.length > MAX_REQUESTS ? next.slice(0, MAX_REQUESTS) : next;
      setTopologyNodes(buildTopologyNodes(trimmed));
      return trimmed;
    });

    const outPacket: Packet = {
      id: generateId(),
      requestId: request.id,
      method: request.method,
      status: 'pending',
      progress: 0,
      isResponse: false,
      targetNodeId,
    };
    setPackets(prev => [...prev, outPacket]);

    const responseDelay = Math.min(Math.max(request.timing.duration * 0.4, 100), 2000);
    setTimeout(() => {
      const inPacket: Packet = {
        id: generateId(),
        requestId: request.id,
        method: request.method,
        status: request.status,
        progress: 0,
        isResponse: true,
        targetNodeId,
      };
      setPackets(prev => [...prev, inPacket]);
    }, responseDelay);
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    const animate = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      const speed = delta * 0.0008;

      setPackets(prev => {
        const updated = prev
          .map(p => ({ ...p, progress: p.progress + speed }))
          .filter(p => p.progress <= 1);
        return updated;
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  useEffect(() => {
    if (captureInitialized.current) return;
    captureInitialized.current = true;
    startCapture(addRequest);
  }, [addRequest]);

  useEffect(() => {
    if (isCapturing) {
      resumeCapture(addRequest);
    } else {
      stopCapture();
    }
  }, [isCapturing, addRequest]);

  const stats: DashboardStats = {
    totalRequests: requests.length,
    successCount: requests.filter(r => r.status === 'success').length,
    errorCount: requests.filter(r => r.status === 'error').length,
    avgResponseTime: requests.length
      ? requests.reduce((a, r) => a + r.timing.duration, 0) / requests.length
      : 0,
    totalBytes: requests.reduce((a, r) => a + r.size, 0),
    requestsPerSecond: requests.length > 1
      ? (requests.length / ((Date.now() - (requests[requests.length - 1]?.timestamp ?? Date.now())) / 1000)) || 0
      : 0,
  };

  const clearRequests = useCallback(() => {
    setRequests([]);
    setPackets([]);
    setSelectedRequest(null);
    setTopologyNodes([CLIENT_NODE]);
  }, []);

  return {
    requests,
    packets,
    stats,
    isCapturing,
    selectedRequest,
    topologyNodes,
    setIsCapturing,
    setSelectedRequest,
    clearRequests,
  };
}
