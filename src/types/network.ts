export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export type RequestStatus = 'pending' | 'success' | 'error';

export interface RequestTiming {
  startTime: number;
  dnsStart?: number;
  dnsEnd?: number;
  connectStart?: number;
  connectEnd?: number;
  tlsStart?: number;
  tlsEnd?: number;
  requestStart?: number;
  responseStart?: number;
  responseEnd?: number;
  duration: number;
}

export interface NetworkRequest {
  id: string;
  url: string;
  method: HttpMethod;
  status: RequestStatus;
  statusCode: number;
  headers: Record<string, string>;
  responseHeaders: Record<string, string>;
  timing: RequestTiming;
  size: number;
  type: string;
  timestamp: number;
  payload?: string;
}

export interface Packet {
  id: string;
  requestId: string;
  progress: number;
  method: HttpMethod;
  status: RequestStatus;
  isResponse: boolean;
}

export interface TopologyNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'client' | 'server' | 'cdn' | 'api';
  icon: string;
}

export interface DashboardStats {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  totalBytes: number;
  requestsPerSecond: number;
}
