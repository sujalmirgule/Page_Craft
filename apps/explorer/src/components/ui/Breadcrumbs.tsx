import React from 'react';
import { ChevronRight, Home, Target, Layers } from 'lucide-react';
import { architectureTree } from '../../architecture/architecture-tree';

interface BreadcrumbsProps {
  selectedNodeId: string | null;
  focusedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onClearFocus: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  selectedNodeId,
  focusedNodeId,
  onSelectNode,
  onClearFocus,
}) => {
  const activeId = selectedNodeId || focusedNodeId || 'pagecraft-root';
  const breadcrumbs = architectureTree.getBreadcrumbs(activeId);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0b1120]/90 backdrop-blur-md border border-slate-800/80 rounded-lg text-xs font-mono text-slate-300 shadow-lg">
      <button
        onClick={() => {
          onSelectNode('pagecraft-root');
          if (focusedNodeId) onClearFocus();
        }}
        className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
        title="Return to Root"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">PAGECRAFT</span>
      </button>

      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        if (crumb.id === 'pagecraft-root') return null;

        return (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <button
              onClick={() => onSelectNode(crumb.id)}
              className={`flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded ${
                isLast
                  ? 'text-cyan-400 font-semibold bg-cyan-950/60 border border-cyan-800/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>{crumb.title}</span>
              <span className="text-[10px] text-slate-500">L{crumb.level}</span>
            </button>
          </React.Fragment>
        );
      })}

      {focusedNodeId && (
        <div className="ml-2 pl-2 border-l border-slate-700 flex items-center gap-1 text-amber-400 font-medium text-[11px]">
          <Target className="w-3 h-3 animate-pulse" />
          <span>Focus Mode</span>
          <button
            onClick={onClearFocus}
            className="ml-1 text-[10px] underline text-slate-400 hover:text-white"
          >
            Exit
          </button>
        </div>
      )}
    </div>
  );
};
