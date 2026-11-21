import React from 'react';
import {
  X,
  Target,
  ChevronDown,
  ChevronRight,
  Shield,
  Layers,
  Zap,
  Database,
  ArrowRight,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
  Network
} from 'lucide-react';
import { ArchitectureNode } from '../../architecture/architecture-types';
import { architectureTree } from '../../architecture/architecture-tree';
import { ARCHITECTURE_RELATIONSHIPS } from '../../architecture/architecture-relationships';

interface DetailPanelProps {
  node: ArchitectureNode | null;
  isOpen: boolean;
  onClose: () => void;
  onFocusNode: (nodeId: string) => void;
  onToggleExpand: (nodeId: string) => void;
  isExpanded: boolean;
  onSelectNode: (nodeId: string) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  node,
  isOpen,
  onClose,
  onFocusNode,
  onToggleExpand,
  isExpanded,
  onSelectNode,
}) => {
  if (!isOpen || !node) return null;

  const hasChildren = (node.children && node.children.length > 0) || false;
  const childCount = node.children?.length || 0;

  // Resolve parent
  const parentNode = node.parentId ? architectureTree.getNode(node.parentId) : null;

  // Resolve connected flows (outbound and inbound relationships)
  const outboundRels = ARCHITECTURE_RELATIONSHIPS.filter(r => r.source === node.id);
  const inboundRels = ARCHITECTURE_RELATIONSHIPS.filter(r => r.target === node.id);

  return (
    <aside className="fixed top-14 right-0 bottom-0 w-full sm:w-[460px] bg-[#0a0f1d]/95 backdrop-blur-xl border-l border-slate-800 text-slate-200 z-40 flex flex-col shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0d1424]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
              LEVEL {node.level} • {node.category}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {node.status}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onFocusNode(node.id)}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Focus on this Subsystem"
            >
              <Target className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
          {node.title}
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {node.subtitle}
        </p>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
          {hasChildren && (
            <button
              onClick={() => onToggleExpand(node.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all ${
                isExpanded
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800 hover:bg-cyan-900'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950'
              }`}
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Collapse ({childCount} Children)</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>Expand ({childCount} Children)</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => onFocusNode(node.id)}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-mono font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>Focus Mode</span>
          </button>
        </div>
      </div>

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Purpose */}
        <section>
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] uppercase tracking-wider mb-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Purpose & Architectural Significance</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-slate-300 leading-relaxed">
            {node.details.purpose}
          </div>
        </section>

        {/* Technologies */}
        <section>
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] uppercase tracking-wider mb-1.5">
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Technology Stack</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {node.technologies.map(tech => (
              <span
                key={tech}
                className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-[#131d33] border border-slate-800 text-slate-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Responsibilities */}
        {node.details.responsibilities && node.details.responsibilities.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Key Responsibilities</span>
            </div>
            <ul className="space-y-1.5">
              {node.details.responsibilities.map((resp, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-md bg-slate-900/40 border border-slate-800/60 text-slate-300 leading-normal"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Interconnected System Flows & Dependencies */}
        {(outboundRels.length > 0 || inboundRels.length > 0) && (
          <section>
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] uppercase tracking-wider mb-2">
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dependencies & Interconnected Systems</span>
            </div>
            <div className="space-y-1.5">
              {outboundRels.map(rel => {
                const targetNode = architectureTree.getNode(rel.target);
                if (!targetNode) return null;
                return (
                  <button
                    key={rel.id}
                    onClick={() => onSelectNode(rel.target)}
                    className="w-full text-left p-2 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-cyan-700/80 text-slate-300 flex items-center justify-between text-xs group transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/70 flex-shrink-0">
                        {rel.protocol || 'INVOKES'}
                      </span>
                      <span className="font-medium text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                        {targetNode.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono group-hover:text-cyan-400 flex items-center gap-1 flex-shrink-0 ml-2">
                      <span>{rel.label || rel.relation}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                );
              })}
              {inboundRels.map(rel => {
                const sourceNode = architectureTree.getNode(rel.source);
                if (!sourceNode) return null;
                return (
                  <button
                    key={rel.id}
                    onClick={() => onSelectNode(rel.source)}
                    className="w-full text-left p-2 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-emerald-700/80 text-slate-300 flex items-center justify-between text-xs group transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/70 flex-shrink-0">
                        FROM
                      </span>
                      <span className="font-medium text-slate-200 group-hover:text-emerald-300 transition-colors truncate">
                        {sourceNode.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono group-hover:text-emerald-400 flex items-center gap-1 flex-shrink-0 ml-2">
                      <span>{rel.label || rel.relation}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Data Model / Schema Snippet */}
        {node.details.dataModel && (
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <Database className="w-3.5 h-3.5 text-sky-400" />
                <span>Data Schema: {node.details.dataModel.name}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              {node.details.dataModel.description}
            </p>
            <div className="relative rounded-lg bg-[#050914] border border-slate-800 p-3 overflow-x-auto">
              <pre className="font-mono text-[10.5px] leading-relaxed text-sky-200">
                {node.details.dataModel.schemaSnippet}
              </pre>
            </div>
          </section>
        )}

        {/* APIs & Endpoints */}
        {node.details.apis && node.details.apis.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>APIs & Endpoints</span>
            </div>
            <div className="space-y-1.5">
              {node.details.apis.map((api, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-md bg-slate-900/60 border border-slate-800/80 font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        api.method === 'GET'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : api.method === 'POST'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : api.method === 'WS'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {api.method}
                    </span>
                    <span className="text-slate-200 text-xs font-semibold">{api.endpoint}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-sans">
                    {api.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Inputs & Outputs */}
        {((node.details.inputs && node.details.inputs.length > 0) ||
          (node.details.outputs && node.details.outputs.length > 0)) && (
          <section className="grid grid-cols-2 gap-2">
            {node.details.inputs && (
              <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Inputs
                </span>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {node.details.inputs.map((inp, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <ArrowRight className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0" />
                      <span>{inp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {node.details.outputs && (
              <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Outputs
                </span>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {node.details.outputs.map((out, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <ArrowRight className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Permissions & Roles */}
        {node.details.permissions && node.details.permissions.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] uppercase tracking-wider mb-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Permissions & RBAC Boundaries</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {node.details.permissions.map(perm => (
                <span
                  key={perm}
                  className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-950/40 border border-rose-900/60 text-rose-300"
                >
                  {perm}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Failure Handling */}
        {node.details.failureHandling && node.details.failureHandling.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Resilience & Failure Handling</span>
            </div>
            <ul className="space-y-1.5">
              {node.details.failureHandling.map((fail, i) => (
                <li
                  key={i}
                  className="p-2 rounded bg-amber-950/20 border border-amber-900/40 text-amber-200/90 text-[11px]"
                >
                  {fail}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Hierarchy Context */}
        <section className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
            <span>HIERARCHY CONTEXT</span>
          </div>

          {parentNode && (
            <div className="mb-2">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Parent Subsystem</span>
              <button
                onClick={() => onSelectNode(parentNode.id)}
                className="w-full text-left p-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-between group"
              >
                <span>{parentNode.title}</span>
                <span className="text-[10px] text-cyan-400 group-hover:underline">Navigate →</span>
              </button>
            </div>
          )}

          {hasChildren && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Child Components ({childCount})</span>
              <div className="grid grid-cols-1 gap-1">
                {node.children?.map(childId => {
                  const childNode = architectureTree.getNode(childId);
                  if (!childNode) return null;
                  return (
                    <button
                      key={childId}
                      onClick={() => onSelectNode(childId)}
                      className="text-left p-1.5 px-2 rounded bg-slate-900/60 border border-slate-800/60 hover:border-cyan-800 text-slate-300 flex items-center justify-between text-[11px] group"
                    >
                      <span className="truncate">{childNode.title}</span>
                      <span className="text-[9px] text-slate-500 font-mono group-hover:text-cyan-400">L{childNode.level}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
};
