import type { NetworkRequest, HttpMethod } from '../types/network';
import { generateId } from '../utils/colors';
import { detectTechStack, getHostname } from '../utils/techDetection';

/** Metadata captured by our fetch/XHR interceptors */
interface InterceptedMeta {
  url: string;
  method: HttpMethod;
  statusCode: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  payload?: string;
  timestamp: number;
}

type RequestCallback = (request: NetworkRequest) => void;

const interceptedRequests: InterceptedMeta[] = [];
const seenEntryUrls = new Set<string>();
let onRequestCallback: RequestCallback | null = null;
let observerActive = false;

/** Convert a PerformanceResourceTiming entry + optional intercepted meta into a NetworkRequest */
function entryToRequest(
  entry: PerformanceResourceTiming,
  meta?: InterceptedMeta
): NetworkRequest {
  const url = entry.name;
  const hostname = getHostname(url);
  const method: HttpMethod = meta?.method ?? 'GET';
  const statusCode = meta?.statusCode ?? 200;
  const isError = statusCode >= 400;
  const techStack = detectTechStack(url, meta?.responseHeaders);

  return {
    id: generateId(),
    url,
    hostname,
    method,
    status: isError ? 'error' : 'success',
    statusCode,
    headers: meta?.requestHeaders ?? {},
    responseHeaders: meta?.responseHeaders ?? {},
    timing: {
      startTime: entry.startTime,
      dnsStart: entry.domainLookupStart || undefined,
      dnsEnd: entry.domainLookupEnd || undefined,
      connectStart: entry.connectStart || undefined,
      connectEnd: entry.connectEnd || undefined,
      tlsStart: entry.secureConnectionStart || undefined,
      tlsEnd: entry.connectEnd || undefined,
      requestStart: entry.requestStart || undefined,
      responseStart: entry.responseStart || undefined,
      responseEnd: entry.responseEnd || undefined,
      duration: entry.duration || (entry.responseEnd - entry.startTime),
    },
    size: entry.transferSize || entry.encodedBodySize || 0,
    type: entry.initiatorType || 'other',
    timestamp: Date.now(),
    protocol: (entry as PerformanceResourceTiming).nextHopProtocol || undefined,
    initiatorType: entry.initiatorType,
    techStack,
    payload: meta?.payload,
  };
}

function findMatchingMeta(url: string): InterceptedMeta | undefined {
  const idx = interceptedRequests.findIndex(m => m.url === url);
  if (idx >= 0) {
    return interceptedRequests.splice(idx, 1)[0];
  }
  return undefined;
}

/** Install the PerformanceObserver to watch for new resource entries */
function startPerformanceObserver(): void {
  if (observerActive) return;
  observerActive = true;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const resEntry = entry as PerformanceResourceTiming;
      const url = resEntry.name;

      // Skip data URIs, extensions, and duplicates
      if (url.startsWith('data:') || url.startsWith('chrome-extension:')) continue;
      
      // Create a dedup key based on URL + start time
      const dedupKey = `${url}|${Math.round(resEntry.startTime)}`;
      if (seenEntryUrls.has(dedupKey)) continue;
      seenEntryUrls.add(dedupKey);

      const meta = findMatchingMeta(url);
      const request = entryToRequest(resEntry, meta);
      onRequestCallback?.(request);
    }
  });

  observer.observe({ type: 'resource', buffered: true });
}

/** Intercept fetch to capture method, headers, status, and payload */
function interceptFetch(): void {
  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = ((init?.method) || 'GET').toUpperCase() as HttpMethod;

    const requestHeaders: Record<string, string> = {};
    if (init?.headers) {
      const h = new Headers(init.headers);
      h.forEach((v, k) => { requestHeaders[k] = v; });
    }

    let payload: string | undefined;
    if (init?.body && typeof init.body === 'string') {
      payload = init.body;
    }

    const timestamp = Date.now();

    try {
      const response = await originalFetch.call(window, input, init);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((v, k) => { responseHeaders[k] = v; });

      interceptedRequests.push({
        url,
        method,
        statusCode: response.status,
        requestHeaders,
        responseHeaders,
        payload,
        timestamp,
      });

      return response;
    } catch (err) {
      interceptedRequests.push({
        url,
        method,
        statusCode: 0,
        requestHeaders,
        responseHeaders: {},
        payload,
        timestamp,
      });
      throw err;
    }
  };
}

/** Intercept XMLHttpRequest for legacy API calls */
function interceptXHR(): void {
  const OrigXHR = window.XMLHttpRequest;
  const originalOpen = OrigXHR.prototype.open;
  const originalSend = OrigXHR.prototype.send;
  const originalSetHeader = OrigXHR.prototype.setRequestHeader;

  OrigXHR.prototype.open = function (method: string, url: string | URL) {
    (this as XMLHttpRequest & { _nv_method: string; _nv_url: string })._nv_method = method.toUpperCase();
    (this as XMLHttpRequest & { _nv_url: string })._nv_url = typeof url === 'string' ? url : url.href;
    (this as XMLHttpRequest & { _nv_headers: Record<string, string> })._nv_headers = {};
    // eslint-disable-next-line prefer-rest-params
    return originalOpen.apply(this, arguments as unknown as Parameters<typeof originalOpen>);
  };

  OrigXHR.prototype.setRequestHeader = function (name: string, value: string) {
    const self = this as XMLHttpRequest & { _nv_headers: Record<string, string> };
    if (self._nv_headers) {
      self._nv_headers[name] = value;
    }
    return originalSetHeader.call(this, name, value);
  };

  OrigXHR.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    const self = this as XMLHttpRequest & { _nv_method: string; _nv_url: string; _nv_headers: Record<string, string> };
    const timestamp = Date.now();

    this.addEventListener('loadend', () => {
      const responseHeaders: Record<string, string> = {};
      const rawHeaders = this.getAllResponseHeaders();
      rawHeaders.split('\r\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > 0) {
          responseHeaders[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
      });

      interceptedRequests.push({
        url: self._nv_url,
        method: (self._nv_method || 'GET') as HttpMethod,
        statusCode: this.status,
        requestHeaders: self._nv_headers || {},
        responseHeaders,
        payload: typeof body === 'string' ? body : undefined,
        timestamp,
      });
    });

    return originalSend.call(this, body);
  };
}

/** Start capturing real browser traffic */
export function startCapture(callback: RequestCallback): void {
  onRequestCallback = callback;
  interceptFetch();
  interceptXHR();
  startPerformanceObserver();
}

/** Stop receiving callbacks (interceptors remain in place) */
export function stopCapture(): void {
  onRequestCallback = null;
}

/** Resume receiving callbacks */
export function resumeCapture(callback: RequestCallback): void {
  onRequestCallback = callback;
}

/** Public API endpoints known to support CORS, for generating demo traffic */
const DEMO_ENDPOINTS = [
  { url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' as HttpMethod },
  { url: 'https://jsonplaceholder.typicode.com/users', method: 'GET' as HttpMethod },
  { url: 'https://jsonplaceholder.typicode.com/posts', method: 'POST' as HttpMethod, body: JSON.stringify({ title: 'NetViz Test', body: 'Hello from NetViz', userId: 1 }) },
  { url: 'https://dummyjson.com/products/1', method: 'GET' as HttpMethod },
  { url: 'https://dummyjson.com/quotes/random', method: 'GET' as HttpMethod },
  { url: 'https://api.github.com/', method: 'GET' as HttpMethod },
  { url: 'https://httpbin.org/get', method: 'GET' as HttpMethod },
  { url: 'https://httpbin.org/post', method: 'POST' as HttpMethod, body: JSON.stringify({ source: 'NetViz', timestamp: Date.now() }) },
  { url: 'https://cdn.jsdelivr.net/npm/react/package.json', method: 'GET' as HttpMethod },
  { url: 'https://cdn.jsdelivr.net/npm/vue/package.json', method: 'GET' as HttpMethod },
  { url: 'https://reqres.in/api/users/1', method: 'GET' as HttpMethod },
  { url: 'https://reqres.in/api/users', method: 'POST' as HttpMethod, body: JSON.stringify({ name: 'NetViz', job: 'visualizer' }) },
];

/** Fire a single random demo request to a real public API */
export function fireDemoRequest(): void {
  const endpoint = DEMO_ENDPOINTS[Math.floor(Math.random() * DEMO_ENDPOINTS.length)];
  const init: RequestInit = {
    method: endpoint.method,
    headers: endpoint.method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
    body: ('body' in endpoint) ? endpoint.body : undefined,
  };

  fetch(endpoint.url, init).catch(() => {
    // Errors are still captured by our interceptor
  });
}

/** Fire a burst of demo requests */
export function fireDemoBurst(count = 5): void {
  for (let i = 0; i < count; i++) {
    setTimeout(fireDemoRequest, i * 300 + Math.random() * 200);
  }
}
