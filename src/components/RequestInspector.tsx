import type { NetworkRequest } from '../types/network';
import { getMethodBgClass, formatBytes, formatDuration } from '../utils/colors';
import TimingWaterfall from './TimingWaterfall';

interface RequestInspectorProps {
  request: NetworkRequest | null;
  onClose: () => void;
}

export default function RequestInspector({ request, onClose }: RequestInspectorProps) {
  if (!request) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        <div className="text-center">
          <div className="text-3xl mb-2">🔍</div>
          <div>Select a request to inspect</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-600/50 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Inspector
        </span>
        <button
          onClick={onClose}
          className="ml-auto text-gray-500 hover:text-gray-300 text-sm"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        {/* Summary */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${getMethodBgClass(request.method)}`}>
              {request.method}
            </span>
            <span className={`text-sm font-mono ${
              request.status === 'error' ? 'text-accent-red' : 'text-accent-green'
            }`}>
              {request.statusCode}
            </span>
          </div>
          <div className="text-xs font-mono text-gray-300 break-all">{request.url}</div>
          <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
            <span>⏱ {formatDuration(request.timing.duration)}</span>
            <span>📦 {formatBytes(request.size)}</span>
            <span>📄 {request.type}</span>
            {request.protocol && <span>🔗 {request.protocol}</span>}
          </div>
          {request.techStack && (
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ backgroundColor: request.techStack.color + '20', color: request.techStack.color }}
              >
                {request.techStack.name}
              </span>
              <span className="text-[10px] text-gray-500">{request.hostname}</span>
            </div>
          )}
          {request.tabDomain && (
            <div className="text-[10px] text-gray-500 mt-1">
              Tab: {request.tabDomain}
            </div>
          )}
        </div>

        {/* Timing Waterfall */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Timing Waterfall
          </h3>
          <TimingWaterfall timing={request.timing} />
        </div>

        {/* Request Headers */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Request Headers
          </h3>
          <div className="bg-surface-900/50 rounded-lg p-2 space-y-1">
            {Object.entries(request.headers).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-xs">
                <span className="text-accent-cyan font-mono shrink-0">{key}:</span>
                <span className="text-gray-300 font-mono break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Response Headers */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Response Headers
          </h3>
          <div className="bg-surface-900/50 rounded-lg p-2 space-y-1">
            {Object.entries(request.responseHeaders).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-xs">
                <span className="text-accent-purple font-mono shrink-0">{key}:</span>
                <span className="text-gray-300 font-mono break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payload */}
        {request.payload && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Request Payload
            </h3>
            <pre className="bg-surface-900/50 rounded-lg p-2 text-xs font-mono text-accent-green overflow-x-auto">
              {JSON.stringify(JSON.parse(request.payload), null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
