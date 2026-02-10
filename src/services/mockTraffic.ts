import type { NetworkRequest, HttpMethod, RequestTiming } from '../types/network';
import { generateId } from '../utils/colors';

const ENDPOINTS = [
  { url: 'https://api.example.com/users', methods: ['GET', 'POST'] as HttpMethod[], type: 'json' },
  { url: 'https://api.example.com/posts', methods: ['GET', 'POST', 'PUT'] as HttpMethod[], type: 'json' },
  { url: 'https://api.example.com/comments', methods: ['GET', 'DELETE'] as HttpMethod[], type: 'json' },
  { url: 'https://cdn.example.com/images/hero.png', methods: ['GET'] as HttpMethod[], type: 'image' },
  { url: 'https://api.example.com/auth/login', methods: ['POST'] as HttpMethod[], type: 'json' },
  { url: 'https://api.example.com/search?q=react', methods: ['GET'] as HttpMethod[], type: 'json' },
  { url: 'https://cdn.example.com/styles/main.css', methods: ['GET'] as HttpMethod[], type: 'css' },
  { url: 'https://api.example.com/analytics', methods: ['POST'] as HttpMethod[], type: 'json' },
  { url: 'https://cdn.example.com/bundle.js', methods: ['GET'] as HttpMethod[], type: 'script' },
  { url: 'https://api.example.com/notifications', methods: ['GET'] as HttpMethod[], type: 'json' },
  { url: 'https://api.example.com/settings', methods: ['GET', 'PATCH'] as HttpMethod[], type: 'json' },
  { url: 'https://api.example.com/upload', methods: ['POST'] as HttpMethod[], type: 'json' },
];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateTiming(isError: boolean): RequestTiming {
  const startTime = performance.now();
  const dnsTime = randomBetween(1, 15);
  const connectTime = randomBetween(5, 30);
  const tlsTime = randomBetween(10, 40);
  const requestTime = randomBetween(2, 10);
  const responseTime = isError ? randomBetween(5, 50) : randomBetween(20, 300);

  let cursor = startTime;
  const dnsStart = cursor;
  cursor += dnsTime;
  const dnsEnd = cursor;
  const connectStart = cursor;
  cursor += connectTime;
  const connectEnd = cursor;
  const tlsStart = cursor;
  cursor += tlsTime;
  const tlsEnd = cursor;
  const reqStart = cursor;
  cursor += requestTime;
  const respStart = cursor;
  cursor += responseTime;
  const responseEnd = cursor;

  return {
    startTime,
    dnsStart,
    dnsEnd,
    connectStart,
    connectEnd,
    tlsStart,
    tlsEnd,
    requestStart: reqStart,
    responseStart: respStart,
    responseEnd,
    duration: responseEnd - startTime,
  };
}

function generateHeaders(method: HttpMethod): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'User-Agent': 'NetViz/1.0',
  };
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

function generateResponseHeaders(statusCode: number, size: number): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': String(size),
    'X-Request-Id': generateId(),
    'X-Response-Time': `${Math.round(Math.random() * 200)}ms`,
    'Cache-Control': statusCode === 200 ? 'max-age=300' : 'no-store',
    'Server': 'nginx/1.24',
  };
}

export function generateMockRequest(): NetworkRequest {
  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
  const method = endpoint.methods[Math.floor(Math.random() * endpoint.methods.length)];
  const isError = Math.random() < 0.12;
  const statusCode = isError
    ? [400, 401, 403, 404, 500, 502, 503][Math.floor(Math.random() * 7)]
    : [200, 201, 204][Math.floor(Math.random() * 3)];
  const size = Math.round(randomBetween(200, 50000));

  const parsedUrl = new URL(endpoint.url);

  return {
    id: generateId(),
    url: endpoint.url,
    hostname: parsedUrl.hostname,
    method,
    status: isError ? 'error' : 'success',
    statusCode,
    headers: generateHeaders(method),
    responseHeaders: generateResponseHeaders(statusCode, size),
    timing: generateTiming(isError),
    size,
    type: endpoint.type,
    timestamp: Date.now(),
    payload: method === 'POST' || method === 'PUT' || method === 'PATCH'
      ? JSON.stringify({ data: 'sample payload', timestamp: Date.now() })
      : undefined,
  };
}
