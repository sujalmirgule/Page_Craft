import React, { useState } from 'react';
import { Button, Badge, Card } from '@pagecraft/components';
import { createStarterPortfolio, CURRENT_SCHEMA_VERSION } from '@pagecraft/schema';
import { generateThemeCssVariables } from '@pagecraft/theme-engine';
import type { PortfolioDocument } from '@pagecraft/types';
import { Layout, Layers, ShieldCheck, Cpu, Database, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [portfolio] = useState<PortfolioDocument>(() => 
    createStarterPortfolio('user-demo', 'workspace-demo', 'alex-morgan')
  );

  const themeVars = generateThemeCssVariables(portfolio.theme);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col" style={themeVars as React.CSSProperties}>
      {/* Header */}
      <header className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between bg-[#0b101d]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-950">
            <div className="w-full h-full bg-[#0b101d] rounded-[7px] flex items-center justify-center">
              <Layout className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wider text-white">PAGECRAFT</span>
              <Badge variant="info">PHASE 1 FOUNDATION</Badge>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Monorepo Application Shell • Schema v{CURRENT_SCHEMA_VERSION}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="success">Monorepo Active</Badge>
          <Button variant="outline" size="sm">
            Documentation
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            PAGECRAFT Web Application
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            Phase 1 Monorepo Foundation successfully established. Applications and shared packages are compiled with strict TypeScript typing and unified build orchestration.
          </p>
        </div>

        {/* Monorepo Boundaries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card hoverEffect>
            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-semibold text-sm">
              <Layout className="w-4 h-4" />
              <span>apps/web</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              React 18 SPA studio client, drag-and-drop canvas, and dynamic component renderer.
            </p>
            <div className="mt-3">
              <Badge variant="info">Port 3000</Badge>
            </div>
          </Card>

          <Card hoverEffect>
            <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-sm">
              <Cpu className="w-4 h-4" />
              <span>apps/api</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modular Node.js Express API server with JWT security, Zod contracts, and REST endpoints.
            </p>
            <div className="mt-3">
              <Badge variant="success">Port 4000</Badge>
            </div>
          </Card>

          <Card hoverEffect>
            <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
              <Database className="w-4 h-4" />
              <span>apps/worker</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              BullMQ asynchronous job processing worker for Puppeteer ATS PDF and media jobs.
            </p>
            <div className="mt-3">
              <Badge variant="warning">Redis Backed</Badge>
            </div>
          </Card>

          <Card hoverEffect>
            <div className="flex items-center gap-2 mb-2 text-purple-400 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>apps/realtime</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stateful WebSocket collaboration gateway for real-time CRDT synchronization.
            </p>
            <div className="mt-3">
              <Badge variant="default">Port 4002</Badge>
            </div>
          </Card>
        </div>

        {/* Loaded Starter Portfolio Preview from @pagecraft/schema */}
        <Card className="border-slate-800/80">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-200">
                Shared Package Verification: Starter Portfolio Schema
              </h2>
            </div>
            <Badge variant="info">Schema v{portfolio.schemaVersion}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Default Slug</span>
              <span className="font-mono text-cyan-300 font-medium">pagecraft.app/{portfolio.slug}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Initial Pages</span>
              <span className="font-mono text-emerald-400 font-medium">{portfolio.pages.length} Page ({portfolio.pages[0].blocks.length} Blocks)</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Active Theme</span>
              <span className="font-mono text-slate-300 font-medium">{portfolio.theme.fontFamily} ({portfolio.theme.borderRadius} radius)</span>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500 font-mono">
        PAGECRAFT • Phase 1 Monorepo Foundation
      </footer>
    </div>
  );
};
