import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Server, ChevronDown, ChevronRight, Activity } from 'lucide-react';
import { ArchitectureNode } from '../../architecture/architecture-types';

interface InfrastructureNodeProps {
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

export const InfrastructureNode: React.FC<InfrastructureNodeProps> = memo(({ data }) => {
  const { archNode, direction, isExpanded, hasChildren, childCount, isSelected, onToggleExpand } = data;
  const isHorizontal = direction === 'LR';

  return (
    <div
      className={`relative w-[280px] rounded-xl border transition-all duration-200 select-none cursor-pointer bg-[#181309] shadow-lg ${
        isSelected
          ? 'border-amber-400 ring-2 ring-amber-500/30 shadow-amber-500/20 shadow-xl'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className="!bg-amber-500 !border-slate-900"
      />
      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className="!bg-amber-500 !border-slate-900"
      />

      <div className="h-1 w-full bg-amber-500/80 rounded-t-xl" />

      <div className="p-3">
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-amber-950/80 border border-amber-800/60 text-amber-400">
              <Server className="w-3.5 h-3.5" />
            </span>
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">
              L{archNode.level} • {archNode.category}
            </span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Activity className="w-2.5 h-2.5" />
            Active
          </span>
        </div>

        <h4 className="text-sm font-semibold text-slate-100 leading-snug line-clamp-1">
          {archNode.title}
        </h4>
        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {archNode.subtitle}
        </p>

        <div className="flex flex-wrap gap-1 mt-2">
          {archNode.technologies.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-amber-300"
            >
              {tech}
            </span>
          ))}
        </div>

        {hasChildren && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-all ${
                isExpanded
                  ? 'bg-amber-950 text-amber-300 border border-amber-800/80 hover:bg-amber-900'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-amber-700/60 hover:text-white'
              }`}
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-3 h-3 text-amber-400" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span>Expand ({childCount})</span>
                </>
              )}
            </button>
            <span className="text-[9px] text-slate-500 font-mono">
              {childCount} {childCount === 1 ? 'part' : 'parts'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
