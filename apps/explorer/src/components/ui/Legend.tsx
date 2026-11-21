import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export const Legend: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="fixed bottom-4 left-4 z-20 bg-[#0a0f1d]/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 text-xs font-mono text-slate-300 shadow-xl max-w-xs transition-all">
      <div
        className="flex items-center justify-between gap-2 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <Info className="w-3.5 h-3.5" />
          <span>Architecture Legend</span>
        </div>
        <button className="text-slate-500 hover:text-slate-300">
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mt-3 space-y-3 pt-2 border-t border-slate-800/80">
          {/* Node categories */}
          <div>
            <span className="text-[10px] text-slate-500 uppercase block mb-1.5">
              Node Classification
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                <span>System / Domain</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Module / Subsystem</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span>Core Service</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-500" />
                <span>Database / RAM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                <span>External SaaS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>Queue / Worker</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
                <span>Document Schema</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span>Security Shield</span>
              </div>
            </div>
          </div>

          {/* Protocols */}
          <div>
            <span className="text-[10px] text-slate-500 uppercase block mb-1.5">
              Protocol Connections
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#60a5fa]" />
                <span>REST / HTTPS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#38bdf8] border-b border-dashed" />
                <span>WebSocket / CRDT</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#34d399]" />
                <span>Persistence</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#fbbf24]" />
                <span>BullMQ Queue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#f43f5e]" />
                <span>Razorpay Pay</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#c084fc]" />
                <span>Gemini AI</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
