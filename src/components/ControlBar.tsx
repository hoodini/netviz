interface ControlBarProps {
  isCapturing: boolean;
  onToggleCapture: () => void;
  onClear: () => void;
  onGenerateTraffic: () => void;
}

export default function ControlBar({ isCapturing, onToggleCapture, onClear, onGenerateTraffic }: ControlBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isCapturing ? 'bg-accent-red animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-xs text-gray-400">
          {isCapturing ? 'Capturing' : 'Paused'}
        </span>
      </div>
      <button
        onClick={onToggleCapture}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          isCapturing
            ? 'bg-accent-red/20 text-accent-red hover:bg-accent-red/30'
            : 'bg-accent-green/20 text-accent-green hover:bg-accent-green/30'
        }`}
      >
        {isCapturing ? '⏸ Pause' : '▶ Resume'}
      </button>
      <button
        onClick={onGenerateTraffic}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 transition-all"
      >
        🌐 Generate Traffic
      </button>
      <button
        onClick={onClear}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-700 text-gray-300 hover:bg-surface-600 transition-all"
      >
        🗑 Clear
      </button>
      <div className="hidden md:flex items-center gap-2 ml-4">
        <Legend color="bg-accent-blue" label="GET" />
        <Legend color="bg-accent-green" label="POST" />
        <Legend color="bg-accent-yellow" label="PUT" />
        <Legend color="bg-accent-red" label="ERROR" />
        <Legend color="bg-accent-purple" label="PATCH" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}
