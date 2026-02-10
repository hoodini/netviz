import type { DashboardStats } from '../types/network';
import { formatBytes, formatDuration } from '../utils/colors';

interface StatsBarProps {
  stats: DashboardStats;
}

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  icon: string;
}

function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <div className="glass-panel px-3 py-2 flex items-center gap-2 min-w-0">
      <span className="text-lg shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
        <div className={`text-sm font-bold font-mono truncate`} style={{ color }}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      <StatCard
        label="Total"
        value={String(stats.totalRequests)}
        color="#94a3b8"
        icon="📊"
      />
      <StatCard
        label="Success"
        value={String(stats.successCount)}
        color="#22c55e"
        icon="✅"
      />
      <StatCard
        label="Errors"
        value={String(stats.errorCount)}
        color="#ef4444"
        icon="❌"
      />
      <StatCard
        label="Avg Time"
        value={formatDuration(stats.avgResponseTime)}
        color="#3b82f6"
        icon="⏱"
      />
      <StatCard
        label="Data"
        value={formatBytes(stats.totalBytes)}
        color="#a855f7"
        icon="📦"
      />
      <StatCard
        label="Req/s"
        value={stats.requestsPerSecond.toFixed(1)}
        color="#eab308"
        icon="⚡"
      />
    </div>
  );
}
