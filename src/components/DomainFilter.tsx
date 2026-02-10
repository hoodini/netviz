interface DomainFilterProps {
  domains: string[];
  selected: string | null;
  onSelect: (domain: string | null) => void;
  extensionConnected: boolean;
}

export default function DomainFilter({ domains, selected, onSelect, extensionConnected }: DomainFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
      {extensionConnected ? (
        <div className="flex items-center gap-1.5 text-[10px] text-accent-green shrink-0 mr-1">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          All tabs
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 shrink-0 mr-1">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          Current tab only
        </div>
      )}
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
          selected === null
            ? 'bg-accent-blue text-white'
            : 'bg-surface-700 text-gray-400 hover:bg-surface-600'
        }`}
      >
        All
      </button>
      {domains.map(domain => (
        <button
          key={domain}
          onClick={() => onSelect(selected === domain ? null : domain)}
          className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
            selected === domain
              ? 'bg-accent-blue text-white'
              : 'bg-surface-700 text-gray-400 hover:bg-surface-600'
          }`}
        >
          {domain}
        </button>
      ))}
      {domains.length === 0 && (
        <span className="text-[10px] text-gray-600">
          {extensionConnected ? 'Waiting for traffic…' : 'Install the NetViz extension for cross-tab traffic'}
        </span>
      )}
    </div>
  );
}
