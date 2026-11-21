import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Layers, Database, Cpu, Globe, Server, FileCode, Shield } from 'lucide-react';
import { architectureTree } from '../../architecture/architecture-tree';
import { ArchitectureNode } from '../../architecture/architecture-types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (nodeId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArchitectureNode[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setResults(architectureTree.getAllNodes().slice(0, 8)); // default suggestions
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(architectureTree.getAllNodes().slice(0, 8));
    } else {
      setResults(architectureTree.searchNodes(query));
    }
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="w-3.5 h-3.5 text-teal-400" />;
      case 'external':
        return <Globe className="w-3.5 h-3.5 text-purple-400" />;
      case 'infrastructure':
        return <Server className="w-3.5 h-3.5 text-amber-400" />;
      case 'schema':
        return <FileCode className="w-3.5 h-3.5 text-sky-400" />;
      case 'security':
        return <Shield className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-2xl bg-[#0b101d] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-[#0d1424]">
          <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search architecture (e.g. MongoDB, CRDT, BullMQ, Portfolio, Cloudinary, Razorpay)..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No architecture components found matching "{query}"
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectResult(item.id);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-slate-900/90 border border-transparent hover:border-slate-800/90 transition-all flex items-center justify-between group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex-shrink-0 mt-0.5">
                    {getNodeIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 flex-shrink-0">
                        L{item.level} • {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.technologies.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#131d33] text-slate-400"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-500 group-hover:text-cyan-400 text-xs font-mono pl-3 flex-shrink-0">
                  <span className="hidden sm:inline">Explore</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 px-4 bg-[#090d18] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Search spans entire 5-level Pagecraft architecture</span>
          <span>Clicking result expands parents & centers graph</span>
        </div>
      </div>
    </div>
  );
};
