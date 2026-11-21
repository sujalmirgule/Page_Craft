import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Layers, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { ArchitectureNode } from '../../architecture/architecture-types';

interface SystemNodeProps {
  data: {
    archNode: ArchitectureNode;
    direction?: 'TB' | 'LR';
    isExpanded: boolean;
    hasChildren: boolean;
    childCount: number;
    isSelected: boolean;
    onToggleExpand: () => void;
  };
}

export const SystemNode: React.FC<SystemNodeProps> = memo(({ data }) => {
  const { archNode, direction, isExpanded, hasChildren, childCount, isSelected, onToggleExpand } = data;
  const isHorizontal = direction === 'LR';

  return (
    <div
      className={`relative w-[340px] rounded-xl border transition-all duration-200 select-none cursor-pointer bg-[#0c1322] shadow-xl ${
        isSelected
          ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-cyan-500/20 shadow-2xl'
          : 'border-slate-800 hover:border-slate-700 hover:shadow-cyan-900/10'
      }`}
    >
      {/* Dynamic handles matching layout orientation */}
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className="!bg-cyan-500 !border-slate-900"
      />
      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className="!bg-cyan-500 !border-slate-900"
      />

      {/* Top Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-t-xl" />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              L{archNode.level} • {archNode.category}
            </span>
          </div>

          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            {archNode.status}
          </span>
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-base font-semibold text-slate-100 tracking-tight leading-snug line-clamp-1">
          {archNode.title}
        </h3>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {archNode.subtitle}
        </p>

        {/* Technologies Pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {archNode.technologies.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131d33] border border-slate-800/80 text-slate-300"
            >
              {tech}
            </span>
          ))}
          {archNode.technologies.length > 4 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#131d33] border border-slate-800/80 text-slate-400">
              +{archNode.technologies.length - 4}
            </span>
          )}
        </div>

        {/* Expand / Collapse Control */}
        {hasChildren && (
          <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                isExpanded
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 hover:bg-cyan-900'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-cyan-700/60 hover:text-white'
              }`}
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>Expand ({childCount})</span>
                </>
              )}
            </button>

            <span className="text-[10px] text-slate-500 font-mono">
              {childCount} {childCount === 1 ? 'subsystem' : 'subsystems'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
