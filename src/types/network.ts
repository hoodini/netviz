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

export interface TechStack {
  name: string;
  color: string;
  category: 'cdn' | 'api' | 'analytics' | 'font' | 'cloud' | 'dev' | 'generic';
}

export interface NetworkRequest {
  id: string;
  url: string;
  hostname: string;
  method: HttpMethod;
  status: RequestStatus;
  statusCode: number;
  headers: Record<string, string>;
  responseHeaders: Record<string, string>;
  timing: RequestTiming;
  size: number;
  type: string;
  timestamp: number;
  protocol?: string;
  initiatorType?: string;
  techStack?: TechStack;
  payload?: string;
  tabDomain?: string;
}

export interface Packet {
  id: string;
  requestId: string;
  progress: number;
  method: HttpMethod;
  status: RequestStatus;
  isResponse: boolean;
  targetNodeId: string;
}

export interface TopologyNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'client' | 'server' | 'cdn' | 'api';
  color: string;
  techStack?: TechStack;
  requestCount: number;
}

export interface DashboardStats {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  totalBytes: number;
  requestsPerSecond: number;
}
