# PAGECRAFT | Modular Portfolio Engine Monorepo

PAGECRAFT is a high-performance, modular portfolio engine for modern creatives and developers. Built on a clean npm workspaces monorepo architecture, PAGECRAFT separates application concerns between the web studio, REST API, realtime collaboration gateway, background compute workers, and the interactive system architecture explorer.

---

## 🏛️ Monorepo Architecture Overview

The repository is structured as a typed, production-grade monorepo powered by **npm workspaces** and **TypeScript**:

```
pagecraft/
├── apps/
│   ├── web/               # Frontend Application (React 18 + Vite + Tailwind CSS)
│   ├── api/               # Primary Backend REST API (Node.js + Express + Zod)
│   ├── realtime/          # Realtime Collaboration Gateway (WebSockets + CRDT)
│   ├── worker/            # Background Processing Worker (BullMQ + Redis)
│   └── explorer/          # Interactive System Architecture Explorer (React Flow)
├── packages/
│   ├── schema/            # Schema versioning, block types & starter templates
│   ├── types/             # Authoritative TypeScript domain models & interfaces
│   ├── validation/        # Zod runtime validators for blocks, pages, documents & auth
│   ├── permissions/       # Strict RBAC permission matrix (Owner, Editor, Viewer, Admin)
│   ├── theme-engine/      # CSS variables generator & typography/palette presets
│   ├── document-engine/   # Immutable block reordering & SHA-256 snapshot fingerprinting
│   ├── components/        # Shared Pagecraft UI component primitives (Button, Card, Badge)
│   └── config/            # Strict environment variable schemas & tsconfigs
├── scripts/
│   └── verify-monorepo.mjs# 23-point automated monorepo verification suite
├── tsconfig.base.json     # Base TypeScript configuration across workspaces
└── package.json           # Root workspace orchestrator
```

---

## 📦 Applications

| Application | Path | Technology Stack | Purpose |
| :--- | :--- | :--- | :--- |
| **`@pagecraft/web`** | `apps/web` | React 18, Vite, Tailwind CSS, Zustand | Studio canvas editor & portfolio viewer |
| **`@pagecraft/api`** | `apps/api` | Express, Node.js, Helmet, CORS, Zod | Core REST API, authentication & CRUD |
| **`@pagecraft/realtime`** | `apps/realtime` | Node.js, WebSockets, CRDT | Multi-user live collaborative canvas editing |
| **`@pagecraft/worker`** | `apps/worker` | BullMQ, Redis, Node.js | Asynchronous PDF generation, image optimization |
| **`@pagecraft/explorer`** | `apps/explorer` | React Flow (`@xyflow/react` v12), Dagre | Interactive System Architecture Explorer |

---

## 🧩 Shared Packages

| Package | Path | Exports & Key Responsibilities |
| :--- | :--- | :--- |
| **`@pagecraft/types`** | `packages/types` | Domain interfaces: `PortfolioDocument`, `PageSchema`, `BlockSchema`, polymorphic blocks, `User`, `WorkspaceRole` |
| **`@pagecraft/schema`** | `packages/schema` | `CURRENT_SCHEMA_VERSION = 1`, block type registry, default factories, `createStarterPortfolio` |
| **`@pagecraft/validation`** | `packages/validation` | Strict Zod contracts: `BlockSchemaValidator`, `PortfolioDocumentValidator`, `UserRegisterValidator` |
| **`@pagecraft/permissions`** | `packages/permissions` | Granular RBAC: `PERMISSION_MATRIX`, `can(role, action)`, `assertPermission()` |
| **`@pagecraft/theme-engine`** | `packages/theme-engine` | `generateThemeCssVariables()`, design tokens, font pairings, palette presets |
| **`@pagecraft/document-engine`** | `packages/document-engine` | `reorderBlocks()`, block query/mutators, deterministic SHA-256 fingerprinting |
| **`@pagecraft/components`** | `packages/components` | Design system primitives: `Button`, `Badge`, `Card`, Tailwind `cn()` utility |
| **`@pagecraft/config`** | `packages/config` | Strict Zod environment schemas (`ApiEnvSchema`, `WorkerEnvSchema`, `RealtimeEnvSchema`, `WebEnvSchema`) |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to create local environment variables for each application:
```bash
cp .env.example .env
```

### 3. Verification & Testing
Run the 23-point monorepo verification test suite:
```bash
npm run test
```

Verify the frozen Interactive Architecture Explorer (59 tests):
```bash
node apps/explorer/scripts/verify-architecture.mjs
```

### 4. Build All Applications & Packages
```bash
npm run build
```

### 5. Typecheck All Workspaces
```bash
npm run typecheck
```

### 6. Development Modes
Start individual applications in development mode:
```bash
npm run dev:web        # Launches Web studio on http://localhost:5173
npm run dev:api        # Launches REST API on http://localhost:4000
npm run dev:realtime   # Launches Realtime gateway on ws://localhost:4002
npm run dev:worker     # Launches Background BullMQ worker
npm run dev:explorer   # Launches Architecture Explorer on http://localhost:5174
```

---

## 🔒 Security & Code Standards

- **Strict Typing**: All packages and applications compile with TypeScript in strict mode.
- **Zero Secret Leaks**: All credentials and environment configurations require explicit definition and are validated at runtime with Zod. Real secrets are strictly omitted from git via `.gitignore`.
- **RBAC Enforcement**: Permissions are centralized and test-backed before mutations are allowed.
- **Deterministic Schemas**: Document structures are versioned (`version: 1`) and polymorphic blocks are strictly validated.
