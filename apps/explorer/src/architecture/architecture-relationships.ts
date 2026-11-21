import type { ArchitectureEdge } from './architecture-types.ts';

export const ARCHITECTURE_RELATIONSHIPS: ArchitectureEdge[] = [
  // Top level inter-domain relations
  {
    id: 'edge-fe-to-be',
    source: 'frontend',
    target: 'backend',
    label: 'REST API',
    relation: 'invokes',
    protocol: 'HTTPS',
    animated: true
  },
  {
    id: 'edge-fe-to-realtime',
    source: 'frontend',
    target: 'realtime',
    label: 'Live Sync',
    relation: 'connects',
    protocol: 'WebSocket',
    animated: true
  },
  {
    id: 'edge-be-to-db',
    source: 'backend',
    target: 'database',
    label: 'Persistence',
    relation: 'reads/writes',
    protocol: 'Persistence'
  },
  {
    id: 'edge-be-to-infra',
    source: 'backend',
    target: 'infrastructure',
    label: 'Job Queue',
    relation: 'dispatches',
    protocol: 'Queue',
    animated: true
  },
  {
    id: 'edge-be-to-ext',
    source: 'backend',
    target: 'external-services',
    label: 'Integrations',
    relation: 'delegates',
    protocol: 'REST'
  },
  {
    id: 'edge-pub-to-fe',
    source: 'publishing',
    target: 'frontend',
    label: 'Serves App',
    relation: 'routes',
    protocol: 'HTTPS'
  },
  {
    id: 'edge-pub-to-db',
    source: 'publishing',
    target: 'database',
    label: 'Fetch Snapshot',
    relation: 'queries',
    protocol: 'Persistence'
  },
  {
    id: 'edge-sec-to-all',
    source: 'security-compliance',
    target: 'backend',
    label: 'Protection',
    relation: 'enforces',
    protocol: 'REST'
  },
  {
    id: 'edge-creator-to-be',
    source: 'creator-ecosystem',
    target: 'backend',
    label: 'Template Sync',
    relation: 'interfaces',
    protocol: 'REST'
  },
  {
    id: 'edge-admin-to-be',
    source: 'admin-moderation',
    target: 'backend',
    label: 'Moderation Ops',
    relation: 'administers',
    protocol: 'REST'
  },

  // Detailed Subsystem Connections
  // Frontend Internal Flow
  {
    id: 'edge-canvas-to-state',
    source: 'frontend-canvas',
    target: 'frontend-state',
    label: 'Local Dispatch',
    relation: 'updates draft',
    animated: true
  },
  {
    id: 'edge-state-to-query',
    source: 'frontend-state',
    target: 'frontend-query',
    label: 'Sync Trigger',
    relation: 'debounced save'
  },
  {
    id: 'edge-query-to-express',
    source: 'frontend-query',
    target: 'express-server',
    label: 'HTTPS REST',
    relation: 'mutations & queries',
    protocol: 'REST',
    animated: true
  },
  {
    id: 'edge-canvas-to-preview',
    source: 'frontend-canvas',
    target: 'live-preview',
    label: 'Realtime Render',
    relation: 'reactive props',
    animated: true
  },
  {
    id: 'edge-collab-to-ws',
    source: 'frontend-collab',
    target: 'websocket-server',
    label: 'WebSocket',
    relation: 'full-duplex sync',
    protocol: 'WebSocket',
    animated: true
  },

  // Realtime Internal Flow
  {
    id: 'edge-ws-to-crdt',
    source: 'websocket-server',
    target: 'crdt-engine',
    label: 'Binary CRDT',
    relation: 'state vector reconciliation',
    protocol: 'CRDT',
    animated: true
  },
  {
    id: 'edge-ws-to-presence',
    source: 'websocket-server',
    target: 'presence-tracker',
    label: 'Awareness',
    relation: 'cursor broadcast',
    protocol: 'WebSocket',
    animated: true
  },
  {
    id: 'edge-crdt-to-redis',
    source: 'crdt-engine',
    target: 'redis-cache',
    label: 'Pub/Sub Cluster',
    relation: 'cross-node bus',
    protocol: 'Queue',
    animated: true
  },

  // Backend Internal Flow
  {
    id: 'edge-express-to-auth',
    source: 'express-server',
    target: 'auth-module',
    label: 'JWT Guard',
    relation: 'verifies token'
  },
  {
    id: 'edge-express-to-portfolio',
    source: 'express-server',
    target: 'portfolio-module',
    label: 'CRUD Route',
    relation: 'dispatches payload'
  },
  {
    id: 'edge-portfolio-to-doc',
    source: 'portfolio-module',
    target: 'document-engine',
    label: 'Doc Operations',
    relation: 'reconciles tree'
  },
  {
    id: 'edge-doc-to-validation',
    source: 'document-engine',
    target: 'schema-validation',
    label: 'Zod Parse',
    relation: 'contract guard'
  },
  {
    id: 'edge-doc-to-persistence',
    source: 'document-engine',
    target: 'portfolio-persistence',
    label: 'Save Validated',
    relation: 'persists document'
  },
  {
    id: 'edge-persistence-to-mongo',
    source: 'portfolio-persistence',
    target: 'mongodb-atlas',
    label: 'Mongoose ODM',
    relation: 'writes document',
    protocol: 'Persistence'
  },
  {
    id: 'edge-persistence-to-schema',
    source: 'portfolio-persistence',
    target: 'portfolio-doc-schema',
    label: 'BSON Mapping',
    relation: 'enforces structure'
  },
  {
    id: 'edge-schema-to-pages',
    source: 'portfolio-doc-schema',
    target: 'pages-schema',
    label: 'Subdocuments',
    relation: 'contains pages'
  },
  {
    id: 'edge-pages-to-blocks',
    source: 'pages-schema',
    target: 'blocks-schema',
    label: 'Polymorphic Array',
    relation: 'contains section blocks'
  },
  {
    id: 'edge-portfolio-to-versioning',
    source: 'portfolio-module',
    target: 'versioning-engine',
    label: 'Publish Checkpoint',
    relation: 'creates snapshot'
  },

  // Infrastructure & Queue Flow
  {
    id: 'edge-pdf-to-queue',
    source: 'pdf-engine',
    target: 'bullmq-queue',
    label: 'Enqueue ATS Job',
    relation: 'dispatches job',
    protocol: 'Queue',
    animated: true
  },
  {
    id: 'edge-queue-to-redis',
    source: 'bullmq-queue',
    target: 'redis-database',
    label: 'Redis Backing',
    relation: 'stores job state',
    protocol: 'Persistence',
    animated: true
  },
  {
    id: 'edge-workers-to-queue',
    source: 'background-workers',
    target: 'bullmq-queue',
    label: 'Consume Jobs',
    relation: 'processes tasks',
    protocol: 'Queue',
    animated: true
  },
  {
    id: 'edge-workers-to-serverpdf',
    source: 'background-workers',
    target: 'server-pdf',
    label: 'Puppeteer Render',
    relation: 'compiles ATS resume',
    protocol: 'Queue',
    animated: true
  },

  // External SaaS Flow
  {
    id: 'edge-asset-to-cloudinary',
    source: 'asset-module',
    target: 'cloudinary-ext',
    label: 'Image Pipeline',
    relation: 'upload & CDN',
    protocol: 'Media',
    animated: true
  },
  {
    id: 'edge-billing-to-razorpay',
    source: 'billing-module',
    target: 'razorpay-ext',
    label: 'Payment & Webhooks',
    relation: 'subscriptions',
    protocol: 'Payment'
  },
  {
    id: 'edge-ai-to-gemini',
    source: 'ai-service',
    target: 'gemini-ext',
    label: 'Prompt / JSON',
    relation: 'LLM inference',
    protocol: 'AI',
    animated: true
  },
  {
    id: 'edge-github-to-api',
    source: 'github-service',
    target: 'github-api-ext',
    label: 'REST API v3',
    relation: 'fetches repositories',
    protocol: 'OAuth'
  },
  {
    id: 'edge-auth-to-google',
    source: 'auth-module',
    target: 'google-auth-ext',
    label: 'OAuth 2.0',
    relation: 'verifies identity',
    protocol: 'OAuth'
  },

  // Publishing Flow
  {
    id: 'edge-slug-to-cache',
    source: 'slug-router',
    target: 'redis-cache',
    label: 'Cache Hit Check',
    relation: 'sub-5ms lookup'
  },
  {
    id: 'edge-slug-to-mongo',
    source: 'slug-router',
    target: 'col-portfolios',
    label: 'Snapshot Read',
    relation: 'fetches published JSON',
    protocol: 'Persistence'
  },
  {
    id: 'edge-custom-to-slug',
    source: 'custom-domain-engine',
    target: 'slug-router',
    label: 'Internal Proxy',
    relation: 'maps CNAME to slug'
  },
  {
    id: 'edge-edge-to-slug',
    source: 'edge-cache',
    target: 'slug-router',
    label: 'Edge Reverse Proxy',
    relation: 'caches HTTP response',
    protocol: 'DNS'
  }
];
