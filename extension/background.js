/** @typedef {chrome.runtime.Port} Port */

/** @type {Set<Port>} */
const ports = new Set();

/**
 * Pending request metadata, keyed by chrome requestId.
 * @type {Map<string, {startTime: number, method: string, requestHeaders?: Record<string, string>}>}
 */
const pendingRequests = new Map();

// --- Port management ---

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'netviz') return;
  ports.add(port);
  port.onDisconnect.addListener(() => ports.delete(port));
});

function broadcast(data) {
  for (const port of ports) {
    try {
      port.postMessage(data);
    } catch {
      ports.delete(port);
    }
  }
}

// --- webRequest listeners ---

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return;
    pendingRequests.set(details.requestId, {
      startTime: details.timeStamp,
      method: details.method,
    });
  },
  { urls: ['<all_urls>'] }
);

chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    const pending = pendingRequests.get(details.requestId);
    if (!pending || !details.requestHeaders) return;
    pending.requestHeaders = {};
    for (const h of details.requestHeaders) {
      pending.requestHeaders[h.name] = h.value || '';
    }
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders']
);

chrome.webRequest.onCompleted.addListener(
  async (details) => {
    if (details.tabId < 0) return;
    if (!details.url.startsWith('http')) return;

    const pending = pendingRequests.get(details.requestId);
    pendingRequests.delete(details.requestId);

    let tabDomain = '';
    try {
      const tab = await chrome.tabs.get(details.tabId);
      if (tab.url) tabDomain = new URL(tab.url).hostname;
    } catch { /* tab may have closed */ }

    const responseHeaders = {};
    if (details.responseHeaders) {
      for (const h of details.responseHeaders) {
        responseHeaders[h.name.toLowerCase()] = h.value || '';
      }
    }

    broadcast({
      type: 'NETVIZ_REQUEST',
      url: details.url,
      method: details.method || pending?.method || 'GET',
      statusCode: details.statusCode,
      resourceType: details.type,
      tabId: details.tabId,
      tabDomain,
      startTime: pending?.startTime || details.timeStamp,
      endTime: details.timeStamp,
      ip: details.ip || '',
      fromCache: details.fromCache || false,
      requestHeaders: pending?.requestHeaders || {},
      responseHeaders,
    });
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

chrome.webRequest.onErrorOccurred.addListener(
  async (details) => {
    if (details.tabId < 0) return;
    if (!details.url.startsWith('http')) return;

    const pending = pendingRequests.get(details.requestId);
    pendingRequests.delete(details.requestId);

    let tabDomain = '';
    try {
      const tab = await chrome.tabs.get(details.tabId);
      if (tab.url) tabDomain = new URL(tab.url).hostname;
    } catch { /* tab may have closed */ }

    broadcast({
      type: 'NETVIZ_REQUEST',
      url: details.url,
      method: details.method || pending?.method || 'GET',
      statusCode: 0,
      resourceType: details.type,
      tabId: details.tabId,
      tabDomain,
      startTime: pending?.startTime || details.timeStamp,
      endTime: details.timeStamp,
      ip: '',
      fromCache: false,
      requestHeaders: pending?.requestHeaders || {},
      responseHeaders: {},
    });
  },
  { urls: ['<all_urls>'] }
);

// Cleanup stale pending requests every minute
setInterval(() => {
  const cutoff = Date.now() - 300000;
  for (const [id, data] of pendingRequests) {
    if (data.startTime < cutoff) pendingRequests.delete(id);
  }
}, 60000);
