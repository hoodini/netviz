// Bridge between the extension background service worker and the NetViz page.
// Connects via a long-lived port and forwards request data via postMessage.

const port = chrome.runtime.connect({ name: 'netviz' });

port.onMessage.addListener((msg) => {
  window.postMessage(msg, '*');
});

window.postMessage({ type: 'NETVIZ_EXTENSION_READY' }, '*');

port.onDisconnect.addListener(() => {
  window.postMessage({ type: 'NETVIZ_EXTENSION_DISCONNECTED' }, '*');
});
