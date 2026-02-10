import { useState, useCallback, useRef, useEffect } from 'react';
import type { NetworkRequest, DashboardStats, Packet } from '../types/network';
import { generateMockRequest } from '../services/mockTraffic';
import { generateId } from '../utils/colors';

const MAX_REQUESTS = 200;

export function useNetworkCapture() {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [isCapturing, setIsCapturing] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number>(0);

  const addRequest = useCallback((request: NetworkRequest) => {
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
    };
    setPackets(prev => [...prev, outPacket]);

    setTimeout(() => {
      const inPacket: Packet = {
        id: generateId(),
        requestId: request.id,
        method: request.method,
        status: request.status,
        progress: 0,
        isResponse: true,
      };
      setPackets(prev => [...prev, inPacket]);
    }, request.timing.duration * 0.6);
  }, []);

  useEffect(() => {
    const animate = () => {
      setPackets(prev => {
        const updated = prev
          .map(p => ({ ...p, progress: p.progress + 0.018 }))
          .filter(p => p.progress <= 1);
        return updated;
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  useEffect(() => {
    if (isCapturing) {
      const tick = () => {
        addRequest(generateMockRequest());
      };
      tick();
      intervalRef.current = setInterval(tick, 800 + Math.random() * 1200);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
  }, []);

  return {
    requests,
    packets,
    stats,
    isCapturing,
    selectedRequest,
    setIsCapturing,
    setSelectedRequest,
    clearRequests,
  };
}
