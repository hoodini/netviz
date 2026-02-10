import { useEffect } from 'react';
import { useHandTracking } from '../hooks/useHandTracking';
import type { HandGesture } from '../hooks/useHandTracking';

interface HandTrackerProps {
  onGestureChange?: (gesture: HandGesture | null) => void;
}

const GESTURE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  open_palm: { label: 'Rotate', icon: '🖐️', color: '#3b82f6' },
  pinch: { label: 'Zoom', icon: '🤏', color: '#eab308' },
  fist: { label: 'Pause', icon: '✊', color: '#ef4444' },
  pointing: { label: 'Select', icon: '👆', color: '#22c55e' },
  none: { label: 'Idle', icon: '—', color: '#6b7280' },
};

export default function HandTracker({ onGestureChange }: HandTrackerProps) {
  const { gesture, isReady, isActive, videoRef, start, stop } = useHandTracking();

  useEffect(() => {
    onGestureChange?.(gesture);
  }, [gesture, onGestureChange]);

  const gestureInfo = gesture ? GESTURE_LABELS[gesture.type] : null;

  return (
    <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2">
      {isActive && (
        <div className="relative w-40 h-30 rounded-lg overflow-hidden border border-surface-600/50 shadow-lg">
          <video
            ref={videoRef as React.RefObject<HTMLVideoElement>}
            className="w-full h-full object-cover transform scale-x-[-1]"
            muted
            playsInline
          />

          {gestureInfo && (
            <div
              className="absolute bottom-1 left-1 right-1 flex items-center justify-center gap-1.5
                         rounded-md py-0.5 px-2 text-xs font-medium backdrop-blur-sm"
              style={{ backgroundColor: gestureInfo.color + '30', color: gestureInfo.color }}
            >
              <span>{gestureInfo.icon}</span>
              <span>{gestureInfo.label}</span>
            </div>
          )}

          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-900/80">
              <div className="text-xs text-gray-400 animate-pulse">Loading model...</div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={isActive ? stop : start}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          isActive
            ? 'bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30'
            : 'bg-surface-700 text-gray-400 hover:bg-surface-600 hover:text-gray-300'
        }`}
      >
        {isActive ? (
          <>
            <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            Hand Tracking ON
          </>
        ) : (
          <>
            <span>🖐️</span>
            Enable Hand Control
          </>
        )}
      </button>
    </div>
  );
}
