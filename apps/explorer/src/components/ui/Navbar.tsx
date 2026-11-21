import React from 'react';
import {
  Search,
  Maximize2,
  Minimize2,
  Workflow,
  Sparkles,
  GitFork,
  ArrowRightLeft,
  ArrowUpDown,
  BookOpen,
  RotateCcw
} from 'lucide-react';

interface NavbarProps {
  onOpenSearch: () => void;
  direction: 'TB' | 'LR';
  onToggleDirection: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSelectPreset: (presetKey: string) => void;
  onResetView: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  direction,
  onToggleDirection,
  onExpandAll,
  onCollapseAll,
  onSelectPreset,
  onResetView,
}) => {
  return (
    <header className="h-14 bg-[#090e1b] border-b border-slate-800/80 px-4 flex items-center justify-between select-none z-30 relative shadow-md">
      {/* Brand & Project Metadata */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <div className="w-full h-full bg-[#090e1b] rounded-[7px] flex items-center justify-center">
              <Workflow className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wider text-white">
                PAGECRAFT
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
                ARCHITECTURE EXPLORER
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden md:block">
              Interactive React Flow Implementation • CRT-WEB-2026-119-SRS-v1.2
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="hidden lg:flex items-center gap-1 pl-4 ml-2 border-l border-slate-800">
          <button
            onClick={() => onSelectPreset('overview')}
            className="px-2.5 py-1 rounded text-xs font-mono text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
          >
            Overview (L1)
          </button>
          <button
            onClick={() => onSelectPreset('schema')}
            className="px-2.5 py-1 rounded text-xs font-mono text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
          >
            Portfolio & Schema
          </button>
          <button
            onClick={() => onSelectPreset('realtime')}
            className="px-2.5 py-1 rounded text-xs font-mono text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
          >
            Realtime CRDT
          </button>
          <button
            onClick={() => onSelectPreset('publishing')}
            className="px-2.5 py-1 rounded text-xs font-mono text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
          >
            Publishing & Domains
          </button>
        </div>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-2">
        {/* Search Input trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all text-xs font-mono group"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Search Architecture...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] bg-[#131d33] border border-slate-700 rounded text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Layout Direction Toggle (LR vs TB) */}
        <button
          onClick={onToggleDirection}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition-all"
          title={`Switch to ${direction === 'TB' ? 'Horizontal (n8n Left-to-Right)' : 'Vertical (Top-to-Bottom)'} Layout`}
        >
          {direction === 'TB' ? (
            <>
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Top-Down</span>
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Left-to-Right</span>
            </>
          )}
        </button>

        {/* Expand / Collapse All */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={onExpandAll}
            className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            title="Expand All Levels"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCollapseAll}
            className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            title="Collapse to Root"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Reset View */}
        <button
          onClick={onResetView}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
