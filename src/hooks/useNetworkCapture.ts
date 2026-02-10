import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { NetworkRequest, DashboardStats, Packet, TopologyNode } from '../types/network';
import { startCapture, stopCapture, resumeCapture } from '../services/realTraffic';
import { generateId } from '../utils/colors';
import { getHostname, detectTechStack, getNodeTypeFromTech } from '../utils/techDetection';

const MAX_REQUESTS = 500;
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
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [extensionConnected, setExtensionConnected] = useState(false);
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
      return next.length > MAX_REQUESTS ? next.slice(0, MAX_REQUESTS) : next;
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

    const responseDelay = Math.min(Math.max((request.timing.duration || 100) * 0.4, 100), 2000);
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

  // Unique tab domains sorted by request count
  const availableDomains = useMemo(() => {
    const domainCounts = new Map<string, number>();
    for (const req of requests) {
      const d = req.tabDomain || req.hostname;
      domainCounts.set(d, (domainCounts.get(d) || 0) + 1);
    }
    return Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([domain]) => domain);
  }, [requests]);

  // Filtered views based on domain filter
  const filteredRequestIds = useMemo(() => {
    if (!domainFilter) return null;
    return new Set(
      requests
        .filter(r => (r.tabDomain || r.hostname) === domainFilter)
        .map(r => r.id)
    );
  }, [requests, domainFilter]);

  const filteredRequests = useMemo(() => {
    if (!filteredRequestIds) return requests;
    return requests.filter(r => filteredRequestIds.has(r.id));
  }, [requests, filteredRequestIds]);

  const filteredPackets = useMemo(() => {
    if (!filteredRequestIds) return packets;
    return packets.filter(p => filteredRequestIds.has(p.requestId));
  }, [packets, filteredRequestIds]);

  const topologyNodes = useMemo(
    () => buildTopologyNodes(filteredRequests),
    [filteredRequests]
  );

  // Packet animation loop
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

  // Start capture once
  useEffect(() => {
    if (captureInitialized.current) return;
    captureInitialized.current = true;
    startCapture(addRequest, setExtensionConnected);
  }, [addRequest]);

  // Pause / resume
  useEffect(() => {
    if (isCapturing) {
      resumeCapture(addRequest);
    } else {
      stopCapture();
    }
  }, [isCapturing, addRequest]);

  const stats: DashboardStats = useMemo(() => ({
    totalRequests: filteredRequests.length,
    successCount: filteredRequests.filter(r => r.status === 'success').length,
    errorCount: filteredRequests.filter(r => r.status === 'error').length,
    avgResponseTime: filteredRequests.length
      ? filteredRequests.reduce((a, r) => a + r.timing.duration, 0) / filteredRequests.length
      : 0,
    totalBytes: filteredRequests.reduce((a, r) => a + r.size, 0),
    requestsPerSecond: filteredRequests.length > 1
      ? (filteredRequests.length / ((Date.now() - (filteredRequests[filteredRequests.length - 1]?.timestamp ?? Date.now())) / 1000)) || 0
      : 0,
  }), [filteredRequests]);

  const clearRequests = useCallback(() => {
    setRequests([]);
    setPackets([]);
    setSelectedRequest(null);
    setDomainFilter(null);
  }, []);

  return {
    requests: filteredRequests,
    packets: filteredPackets,
    stats,
    isCapturing,
    selectedRequest,
    topologyNodes,
    domainFilter,
    availableDomains,
    extensionConnected,
    setIsCapturing,
    setSelectedRequest,
    setDomainFilter,
    clearRequests,
  };
}
