import type { NetworkRequest } from '../types/network';
import { getMethodBgClass, formatBytes, formatDuration } from '../utils/colors';

interface RequestListProps {
  requests: NetworkRequest[];
  selectedId: string | null;
  onSelect: (request: NetworkRequest) => void;
}

export default function RequestList({ requests, selectedId, onSelect }: RequestListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-600/50">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Request Log
        </span>
        <span className="text-xs text-gray-500">({requests.length})</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {requests.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            No requests captured yet...
          </div>
        )}
        {requests.map(req => (
          <button
            key={req.id}
            onClick={() => onSelect(req)}
            className={`w-full text-left px-3 py-2 border-b border-surface-700/50 hover:bg-surface-700/40 transition-colors ${
              selectedId === req.id ? 'bg-surface-700/60 border-l-2 border-l-accent-blue' : ''
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getMethodBgClass(req.method)}`}>
                {req.method}
              </span>
              <span className={`text-xs font-mono ${
                req.status === 'error' ? 'text-accent-red' : 'text-gray-300'
              }`}>
                {req.statusCode}
              </span>
              <span className="text-[10px] text-gray-500 ml-auto">
                {formatDuration(req.timing.duration)}
              </span>
            </div>
            <div className="text-xs text-gray-400 truncate font-mono">
              {req.hostname}{new URL(req.url).pathname}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-gray-500">{formatBytes(req.size)}</span>
              <span className="text-[10px] text-gray-500">{req.type}</span>
              {req.techStack && (
                <span
                  className="text-[9px] px-1 py-0.5 rounded font-medium"
                  style={{ backgroundColor: req.techStack.color + '20', color: req.techStack.color }}
                >
                  {req.techStack.name}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
