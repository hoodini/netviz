import { useRef, useEffect, useState } from 'react';
import { useNetworkCapture } from './hooks/useNetworkCapture';
import { fireDemoBurst } from './services/realTraffic';
import TopologyCanvas from './components/TopologyCanvas';
import RequestList from './components/RequestList';
import RequestInspector from './components/RequestInspector';
import StatsBar from './components/StatsBar';
import ControlBar from './components/ControlBar';
import DomainFilter from './components/DomainFilter';

export default function App() {
  const {
    requests,
    packets,
    stats,
    isCapturing,
    selectedRequest,
    topologyNodes,
    domainFilter,
    availableDomains,
    extensionConnected,
    setIsCapturing,
    setSelectedRequest,
    setDomainFilter,
    clearRequests,
  } = useNetworkCapture();

  const topologyRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const el = topologyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setCanvasSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-surface-600/50 bg-surface-800/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center">
              <span className="text-accent-blue text-sm font-bold">N</span>
            </div>
            <h1 className="text-sm font-bold tracking-tight">
              Net<span className="text-accent-blue">Viz</span>
            </h1>
          </div>
          <span className="text-[10px] text-gray-500 hidden sm:block">
            Interactive Network Request Visualizer
          </span>
        </div>
        <ControlBar
          isCapturing={isCapturing}
          onToggleCapture={() => setIsCapturing(prev => !prev)}
          onClear={clearRequests}
          onGenerateTraffic={() => fireDemoBurst(6)}
        />
      </header>

      {/* Domain Filter Bar */}
      <div className="px-4 py-1.5 border-b border-surface-700/30 shrink-0">
        <DomainFilter
          domains={availableDomains}
          selected={domainFilter}
          onSelect={setDomainFilter}
          extensionConnected={extensionConnected}
        />
      </div>

      {/* Stats */}
      <div className="px-4 py-2 shrink-0">
        <StatsBar stats={stats} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 px-4 pb-4 gap-3">
        {/* Left: Request List */}
        <div className="glass-panel w-72 shrink-0 overflow-hidden hidden lg:flex flex-col">
          <RequestList
            requests={requests}
            selectedId={selectedRequest?.id ?? null}
            onSelect={setSelectedRequest}
          />
        </div>

        {/* Center: Topology Canvas */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div ref={topologyRef} className="glass-panel flex-1 relative overflow-hidden">
            <div className="absolute top-2 left-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold z-10">
              Network Topology
              {domainFilter && (
                <span className="ml-2 text-accent-blue normal-case">
                  — {domainFilter}
                </span>
              )}
            </div>
            <TopologyCanvas
              packets={packets}
              nodes={topologyNodes}
              width={canvasSize.width}
              height={canvasSize.height}
            />
          </div>

          {/* Mobile request list */}
          <div className="glass-panel h-48 overflow-hidden lg:hidden">
            <RequestList
              requests={requests}
              selectedId={selectedRequest?.id ?? null}
              onSelect={setSelectedRequest}
            />
          </div>
        </div>

        {/* Right: Inspector */}
        <div className="glass-panel w-80 shrink-0 overflow-hidden hidden md:flex flex-col">
          <RequestInspector
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
          />
        </div>
      </div>
    </div>
  );
}
