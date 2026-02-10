import type { HttpMethod, RequestStatus } from '../types/network';

export function getMethodColor(method: HttpMethod): string {
  const colors: Record<HttpMethod, string> = {
    GET: '#3b82f6',
    POST: '#22c55e',
    PUT: '#eab308',
    DELETE: '#ef4444',
    PATCH: '#a855f7',
    OPTIONS: '#6b7280',
    HEAD: '#6b7280',
  };
  return colors[method];
}

export function getStatusColor(status: RequestStatus): string {
  const colors: Record<RequestStatus, string> = {
    pending: '#eab308',
    success: '#22c55e',
    error: '#ef4444',
  };
  return colors[status];
}

export function getMethodBgClass(method: HttpMethod): string {
  const classes: Record<HttpMethod, string> = {
    GET: 'bg-accent-blue/20 text-accent-blue',
    POST: 'bg-accent-green/20 text-accent-green',
    PUT: 'bg-accent-yellow/20 text-accent-yellow',
    DELETE: 'bg-accent-red/20 text-accent-red',
    PATCH: 'bg-accent-purple/20 text-accent-purple',
    OPTIONS: 'bg-gray-500/20 text-gray-400',
    HEAD: 'bg-gray-500/20 text-gray-400',
  };
  return classes[method];
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
