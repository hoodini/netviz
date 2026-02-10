import type { RequestTiming } from '../types/network';
import { formatDuration } from '../utils/colors';

interface TimingWaterfallProps {
  timing: RequestTiming;
}

interface TimingSegment {
  label: string;
  start: number;
  end: number;
  color: string;
}

export default function TimingWaterfall({ timing }: TimingWaterfallProps) {
  const total = timing.duration;
  if (total === 0) return null;

  const segments: TimingSegment[] = [];
  const base = timing.startTime;

  if (timing.dnsStart !== undefined && timing.dnsEnd !== undefined) {
    segments.push({
      label: 'DNS',
      start: timing.dnsStart - base,
      end: timing.dnsEnd - base,
      color: '#06b6d4',
    });
  }
  if (timing.connectStart !== undefined && timing.connectEnd !== undefined) {
    segments.push({
      label: 'Connect',
      start: timing.connectStart - base,
      end: timing.connectEnd - base,
      color: '#f97316',
    });
  }
  if (timing.tlsStart !== undefined && timing.tlsEnd !== undefined) {
    segments.push({
      label: 'TLS',
      start: timing.tlsStart - base,
      end: timing.tlsEnd - base,
      color: '#a855f7',
    });
  }
  if (timing.requestStart !== undefined && timing.responseStart !== undefined) {
    segments.push({
      label: 'Request',
      start: timing.requestStart - base,
      end: timing.responseStart - base,
      color: '#3b82f6',
    });
  }
  if (timing.responseStart !== undefined && timing.responseEnd !== undefined) {
    segments.push({
      label: 'Response',
      start: timing.responseStart - base,
      end: timing.responseEnd - base,
      color: '#22c55e',
    });
  }

  return (
    <div className="space-y-1.5">
      {segments.map(seg => {
        const leftPct = (seg.start / total) * 100;
        const widthPct = Math.max(((seg.end - seg.start) / total) * 100, 1);
        const duration = seg.end - seg.start;

        return (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 w-14 text-right shrink-0">
              {seg.label}
            </span>
            <div className="flex-1 h-4 bg-surface-900/50 rounded relative overflow-hidden">
              <div
                className="absolute h-full rounded transition-all"
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: seg.color,
                  opacity: 0.8,
                }}
              />
            </div>
            <span className="text-[10px] text-gray-500 w-12 shrink-0">
              {formatDuration(duration)}
            </span>
          </div>
        );
      })}
      <div className="flex items-center gap-2 pt-1 border-t border-surface-700/50">
        <span className="text-[10px] text-gray-300 w-14 text-right font-semibold shrink-0">
          Total
        </span>
        <div className="flex-1" />
        <span className="text-[10px] text-gray-300 w-12 font-semibold shrink-0">
          {formatDuration(total)}
        </span>
      </div>
    </div>
  );
}
