import type { ArchitectureNode } from './architecture-types.ts';

export const ARCHITECTURE_NODES: Record<string, ArchitectureNode> = {
  // ==========================================
  // LEVEL 0: ROOT SYSTEM
  // ==========================================
  'pagecraft-root': {
    id: 'pagecraft-root',
    type: 'system',
    title: 'PAGECRAFT PLATFORM',
    subtitle: 'Drag-and-Drop Portfolio Builder & Dynamic Publishing System',
    category: 'Root System',
    level: 0,
    technologies: ['React', 'Node.js', 'Express', 'MongoDB Atlas', 'TypeScript', 'Redis', 'BullMQ'],
    status: 'core',
    children: [
      'frontend',
      'backend',
      'database',
      'realtime',
      'infrastructure',
      'external-services',
      'publishing',
      'creator-ecosystem',
      'admin-moderation',
      'security-compliance'
    ],
    details: {
      purpose: 'End-to-end platform enabling non-technical users and professionals to construct, customize, publish, and export interactive personal portfolios and ATS resumes using modular content blocks and live schema synchronization.',
      technologies: ['React', 'Node.js', 'Express', 'TypeScript', 'MongoDB Atlas', 'Redis', 'BullMQ', 'Zustand', 'Tailwind CSS'],
      responsibilities: [
        'Orchestrate client-side visual editing and block configuration',
        'Maintain schema-validated nested document models for portfolios, pages, and blocks',
        'Facilitate real-time multi-user editing with CRDT and WebSockets',
        'Automate instant public publishing on pagecraft.app/:slug and custom domains',
        'Generate dual-mode PDF exports: interactive client-side and server-side ATS parsed documents',
        'Provide multi-tiered subscriptions, community showcases, and team workspace collaboration'
      ],
      apis: [
        { method: 'GET', endpoint: '/api/v1/health', description: 'Platform health and subsystem status probe' },
        { method: 'GET', endpoint: '/api/v1/version', description: 'Runtime API version and schema capability manifest' }
      ],
      inputs: ['User drag interactions', 'Block content edits', 'OAuth & credential logins', 'Payment webhooks', 'GitHub profile links'],
      outputs: ['Published responsive portfolio websites', 'ATS formatted PDF resumes', 'Live preview renders', 'Analytics reports'],
      permissions: ['Guest (Public Viewer)', 'Viewer', 'Editor', 'Workspace Owner', 'Super Admin'],
      externalIntegrations: ['Cloudinary CDN', 'Razorpay Payments', 'Google Gemini AI', 'GitHub API', 'Google OAuth'],
      failureHandling: [
        'Graceful degradation with local offline editing state via Zustand persistence',
        'Automatic WebSocket reconnection with exponential backoff',
        'Dead-letter queues and automated retries for background PDF workers'
      ]
    }
  },

  // ==========================================
  // LEVEL 1: MAJOR SYSTEMS / DOMAINS
  // ==========================================
  'frontend': {
    id: 'frontend',
    parentId: 'pagecraft-root',
    type: 'system',
    title: 'Frontend Application',
    subtitle: 'React 18 SPA, Drag-and-Drop Studio & Dynamic Renderer',
    category: 'Client Layer',
    level: 1,
    technologies: ['React', 'TypeScript', 'Zustand', 'TanStack Query', 'Tailwind CSS', 'React DnD'],
    status: 'core',
    children: [
      'frontend-canvas',
      'frontend-state',
      'frontend-query',
      'frontend-collab',
      'frontend-design',
      'frontend-dashboard',
      'frontend-public'
    ],
    details: {
      purpose: 'High-performance interactive web application delivering instant visual editing feedback, multi-page routing, dynamic component instantiation from JSON schemas, and responsive live previews.',
      technologies: ['React 18', 'TypeScript', 'Zustand', 'TanStack Query v5', 'Tailwind CSS', 'React DnD'],
      responsibilities: [
        'Deliver 60fps drag-and-drop block positioning and reordering',
        'Provide inline WYSIWYG text and media editing directly on the canvas',
        'Manage optimistic client state and undo/redo history trees',
        'Render production portfolio sites dynamically from schema with zero hydration mismatch',
        'Handle client-side export generation for quick PDF downloads'
      ],
      apis: [
        { method: 'GET', endpoint: '/', description: 'Application shell and router' },
        { method: 'GET', endpoint: '/dashboard', description: 'User workspace and portfolio management view' },
        { method: 'GET', endpoint: '/editor/:portfolioId', description: 'Interactive studio canvas environment' }
      ],
      inputs: ['Mouse/touch drag events', 'Keyboard shortcuts', 'Form field inputs', 'Server-sent WebSocket patches'],
      outputs: ['DOM component trees', 'Optimistic mutations to API', 'Client-side PDF documents'],
      permissions: ['Authenticated User', 'Workspace Collaborator'],
      failureHandling: ['Error boundaries around dynamic block renderers', 'Toast notifications on API sync failure']
    }
  },

  'backend': {
    id: 'backend',
    parentId: 'pagecraft-root',
    type: 'system',
    title: 'Backend API & Engine',
    subtitle: 'Node.js Express TypeScript Modular Monolith Architecture',
    category: 'Server Layer',
    level: 1,
    technologies: ['Node.js', 'Express', 'TypeScript', 'Zod', 'BullMQ', 'JWT'],
    status: 'core',
    children: [
      'auth-module',
      'portfolio-module',
      'asset-module',
      'workspace-module',
      'billing-module',
      'analytics-module',
      'notification-module',
      'pdf-engine',
      'ai-service',
      'github-service'
    ],
    details: {
      purpose: 'Central business logic and API layer processing portfolio document mutations, schema migrations, asset uploads, background rendering jobs, and authorization policies.',
      technologies: ['Node.js 20+ LTS', 'Express', 'TypeScript', 'Zod', 'Mongoose', 'BullMQ'],
      responsibilities: [
        'Enforce schema integrity and validation on all portfolio document updates',
        'Handle role-based access control (RBAC) across workspaces and portfolios',
        'Queue and orchestrate intensive asynchronous jobs (ATS PDF compilation, image pipelines)',
        'Interface securely with external payment gateways and AI LLM endpoints'
      ],
      apis: [
        { method: 'POST', endpoint: '/api/v1/auth/login', description: 'User authentication & JWT issuance' },
        { method: 'GET', endpoint: '/api/v1/portfolios', description: 'List accessible workspace portfolios' },
        { method: 'POST', endpoint: '/api/v1/portfolios', description: 'Create new portfolio from template' }
      ],
      inputs: ['REST JSON payloads', 'Multipart image streams', 'Webhook signatures (Razorpay)'],
      outputs: ['Validated JSON responses', 'Queued BullMQ jobs', 'Signed S3/Cloudinary URLs'],
      failureHandling: ['Global Express error handler', 'Standardized JSON error envelope (RFC 7807)']
    }
  },

  'database': {
    id: 'database',
    parentId: 'pagecraft-root',
    type: 'database',
    title: 'Data & Persistence Tier',
    subtitle: 'MongoDB Atlas Cluster & Redis In-Memory State',
    category: 'Persistence',
    level: 1,
    technologies: ['MongoDB Atlas', 'Mongoose', 'Redis'],
    status: 'core',
    children: [
      'mongodb-atlas',
      'redis-database'
    ],
    details: {
      purpose: 'Primary persistence layer combining flexible document storage for nested portfolio schemas with high-throughput in-memory caching and queuing.',
      technologies: ['MongoDB Atlas (Replica Set)', 'Mongoose ODM', 'Redis 7.x'],
      responsibilities: [
        'Store polymorphic, deeply nested portfolio document schemas and version snapshots',
        'Provide ACID multi-document transactions for critical billing and workspace ownership transfers',
        'Persist user accounts, RBAC memberships, audit trails, and analytics counters',
        'Maintain volatile user session caches and distributed locks for BullMQ workers'
      ]
    }
  },

  'realtime': {
    id: 'realtime',
    parentId: 'pagecraft-root',
    type: 'service',
    title: 'Realtime & Collaboration',
    subtitle: 'WebSocket Gateway & CRDT-Based Conflict-Free Synchronizer',
    category: 'Realtime Tier',
    level: 1,
    technologies: ['WebSocket', 'CRDT', 'Node.js ws', 'Redis Pub/Sub'],
    status: 'core',
    children: [
      'websocket-server',
      'crdt-engine',
      'presence-tracker'
    ],
    details: {
      purpose: 'Enables concurrent multi-user live editing of portfolios without merge conflicts, displaying peer remote cursors and live block lock indicators.',
      technologies: ['WebSocket protocol', 'CRDT (Conflict-free Replicated Data Types)', 'Redis Pub/Sub'],
      responsibilities: [
        'Maintain persistent duplex channels with active studio canvas clients',
        'Reconcile concurrent block movements and inline text typing via CRDT algorithms',
        'Broadcast remote presence state (mouse coordinates, active block selection, user initials)'
      ]
    }
  },

  'infrastructure': {
    id: 'infrastructure',
    parentId: 'pagecraft-root',
    type: 'infrastructure',
    title: 'Infrastructure & Workers',
    subtitle: 'Job Processing, Caching, and Compute Orchestration',
    category: 'Infrastructure',
    level: 1,
    technologies: ['Redis', 'BullMQ', 'Node.js', 'Docker', 'Puppeteer'],
    status: 'production-hardened',
    children: [
      'express-server',
      'bullmq-queue',
      'background-workers',
      'redis-cache'
    ],
    details: {
      purpose: 'Decouples heavy compute workloads (PDF generation, media optimization) from client API response cycles while ensuring 99.9% availability.',
      technologies: ['Redis 7', 'BullMQ 5', 'Puppeteer Headless Chrome', 'PM2 / Containers'],
      responsibilities: [
        'Manage asynchronous priority queues (high: ATS PDF, low: analytics rollover)',
        'Provide automated worker retries, backoff policies, and concurrency control',
        'Host shared cache layers reducing database query frequency by over 70%'
      ]
    }
  },

  'external-services': {
    id: 'external-services',
    parentId: 'pagecraft-root',
    type: 'external',
    title: 'External Services & APIs',
    subtitle: 'Third-Party SaaS Integrations for Media, Payments, and AI',
    category: 'External Integrations',
    level: 1,
    technologies: ['Cloudinary', 'Razorpay', 'Gemini API', 'GitHub API', 'Google OAuth'],
    status: 'active',
    children: [
      'cloudinary-ext',
      'razorpay-ext',
      'gemini-ext',
      'github-api-ext',
      'google-auth-ext'
    ],
    details: {
      purpose: 'Leverages industry-standard third-party specialized platforms for high-scale media CDN, secure compliant payment subscriptions, and cutting-edge generative AI.',
      technologies: ['Cloudinary REST/SDK', 'Razorpay API v1', 'Google Gemini 1.5/2.0 Flash/Pro', 'GitHub REST API v3', 'Google Identity'],
      responsibilities: [
        'Secure multi-tier payment subscription management and webhook verification',
        'Global CDN asset transformation, resizing, and responsive WebP/AVIF delivery',
        'Generative portfolio copy, bio refinement, and skill taxonomy generation via Gemini',
        'OAuth 2.0 social sign-in and automated public repository showcase syncing'
      ]
    }
  },

  'publishing': {
    id: 'publishing',
    parentId: 'pagecraft-root',
    type: 'service',
    title: 'Publishing & Custom Domains',
    subtitle: 'Subdomain Routing, CNAME Verification, and Edge Delivery',
    category: 'Publishing Tier',
    level: 1,
    technologies: ['Node.js', 'DNS CNAME Resolver', 'Edge CDN', 'TLS/SSL'],
    status: 'production-hardened',
    children: [
      'slug-router',
      'custom-domain-engine',
      'edge-cache'
    ],
    details: {
      purpose: 'Powers instantaneous one-click publishing for free users on pagecraft.app/:slug as well as custom domains for Pro and Business subscribers.',
      technologies: ['Edge Reverse Proxy', 'DNS Verification Engine', 'Let\'s Encrypt / TLS Automation', 'Cache-Control Headers'],
      responsibilities: [
        'Resolve incoming public HTTP requests to published immutable portfolio snapshots',
        'Validate custom CNAME records and manage SSL certificate lifecycles',
        'Enforce sub-50ms TTFB via global edge caching headers'
      ]
    }
  },

  'creator-ecosystem': {
    id: 'creator-ecosystem',
    parentId: 'pagecraft-root',
    type: 'module',
    title: 'Creator Ecosystem & Showcase',
    subtitle: 'Community Templates, Public Gallery, and Design Forking',
    category: 'Ecosystem',
    level: 1,
    technologies: ['React', 'Express', 'MongoDB Atlas', 'Zod'],
    status: 'active',
    children: [
      'showcase-hub',
      'template-sharing',
      'design-contributions'
    ],
    details: {
      purpose: 'Enables creators to publish portfolios to a curated showcase, share reusable section designs, and clone community templates.',
      technologies: ['MongoDB Indexes', 'Express Search API', 'Zustand Template Importer'],
      responsibilities: [
        'Maintain community portfolio showcase directory with categorization and search',
        'Provide one-click template duplication into user workspaces with isolated IDs',
        'Track design versioning, creator attribution, and community ratings'
      ]
    }
  },

  'admin-moderation': {
    id: 'admin-moderation',
    parentId: 'pagecraft-root',
    type: 'module',
    title: 'Admin & Content Moderation',
    subtitle: 'Platform Operations, User Management, and Abuse Prevention',
    category: 'Administration',
    level: 1,
    technologies: ['Express', 'React', 'MongoDB Atlas', 'Audit Logging'],
    status: 'production-hardened',
    children: [
      'admin-dashboard',
      'moderation-engine',
      'audit-logging'
    ],
    details: {
      purpose: 'Equips platform administrators with control over user accounts, subscription tier overrides, automated spam detection, and content takedowns.',
      technologies: ['Node.js RBAC Middleware', 'MongoDB Change Streams', 'Audit Storage Engine'],
      responsibilities: [
        'Review reported portfolios violating acceptable use policies',
        'Execute immediate domain unpublishing or account suspensions',
        'Maintain immutable audit logs of all administrative actions and sensitive changes'
      ]
    }
  },

  'security-compliance': {
    id: 'security-compliance',
    parentId: 'pagecraft-root',
    type: 'security',
    title: 'Security & Production Hardening',
    subtitle: 'Defense-in-Depth, Encryption, RBAC, and Threat Mitigation',
    category: 'Security Tier',
    level: 1,
    technologies: ['Helmet', 'CORS', 'bcrypt', 'JWT', 'Rate Limiter', 'DOMPurify'],
    status: 'production-hardened',
    children: [
      'auth-security',
      'api-protection',
      'data-sanitization'
    ],
    details: {
      purpose: 'Enforces comprehensive defense-in-depth security across authentication, API transport, NoSQL injection defenses, and sanitized dynamic client rendering.',
      technologies: ['Helmet.js', 'express-rate-limit', 'bcryptjs', 'DOMPurify', 'Strict CORS'],
      responsibilities: [
        'Safeguard JWT authentication tokens using HTTP-Only SameSite Secure cookies',
        'Throttle brute-force and DDoS attempts using IP and account rate limiters',
        'Sanitize all inline HTML and user content blocks to eliminate Cross-Site Scripting (XSS)'
      ]
    }
  },

  // ==========================================
  // LEVEL 2: SUBSYSTEMS & MODULES
  // ==========================================

  // --- FRONTEND SUBSYSTEMS ---
  'frontend-canvas': {
    id: 'frontend-canvas',
    parentId: 'frontend',
    type: 'module',
    title: 'Drag-and-Drop Studio Canvas',
    subtitle: 'Modular Layout Workspace & Block Reordering',
    category: 'Frontend Studio',
    level: 2,
    technologies: ['React DnD', 'React', 'TypeScript'],
    status: 'core',
    children: ['block-palette', 'inline-editor', 'live-preview'],
    details: {
      purpose: 'Visual layout engine allowing intuitive dragging, dropping, and reordering of portfolio section blocks with immediate visual guidelines.',
      technologies: ['React DnD', 'HTML5 Drag and Drop API', 'CSS Grid / Flexbox'],
      responsibilities: [
        'Provide drag handles for moving sections vertically within a page',
        'Render placeholder drop indicators showing projected drop insertion points',
        'Emit block reorder actions updating the local page block order array',
        'Support multi-breakpoint preview modes (Desktop, Tablet, Mobile)'
      ],
      apis: [
        { method: 'POST', endpoint: 'dispatch(reorderBlocks({ pageId, sourceIdx, targetIdx }))', description: 'Internal Zustand store action' }
      ]
    }
  },

  'frontend-state': {
    id: 'frontend-state',
    parentId: 'frontend',
    type: 'module',
    title: 'Zustand State Store',
    subtitle: 'Centralized Client State & Undo/Redo Engine',
    category: 'Frontend State',
    level: 2,
    technologies: ['Zustand', 'Immer', 'LocalStorage'],
    status: 'core',
    details: {
      purpose: 'Single source of truth on the client maintaining the loaded portfolio document draft, history stack, selection state, and UI modes.',
      technologies: ['Zustand 4.x', 'Immer middleware'],
      responsibilities: [
        'Maintain current active portfolio document in memory',
        'Track dirty state changes and coordinate debounced autosave to backend',
        'Provide temporal undo/redo history stack for all user edits',
        'Manage modal, drawer, sidebar, and selected block focus states'
      ],
      dataModel: {
        name: 'EditorStoreState',
        description: 'TypeScript client store interface',
        schemaSnippet: `interface EditorStoreState {
  portfolio: PortfolioDocument | null;
  activePageId: string;
  selectedBlockId: string | null;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  isDirty: boolean;
  history: {
    past: PortfolioDocument[];
    future: PortfolioDocument[];
  };
  setBlockContent: (blockId: string, content: any) => void;
  reorderBlocks: (startIndex: number, endIndex: number) => void;
  undo: () => void;
  redo: () => void;
}`
      }
    }
  },

  'frontend-query': {
    id: 'frontend-query',
    parentId: 'frontend',
    type: 'module',
    title: 'TanStack Query Sync Layer',
    subtitle: 'Server State Management & Optimistic Updates',
    category: 'Frontend Network',
    level: 2,
    technologies: ['TanStack Query', 'Axios / Fetch'],
    status: 'core',
    details: {
      purpose: 'Orchestrates asynchronous HTTP communication with the backend API, caching server records and applying optimistic UI updates.',
      technologies: ['@tanstack/react-query v5'],
      responsibilities: [
        'Cache portfolio lists, templates, and analytics metrics',
        'Perform optimistic mutations when saving block changes',
        'Handle network retries and background invalidation upon reconnect'
      ]
    }
  },

  'frontend-collab': {
    id: 'frontend-collab',
    parentId: 'frontend',
    type: 'module',
    title: 'Collaboration Client',
    subtitle: 'WebSocket & CRDT Sync Client Hook',
    category: 'Frontend Realtime',
    level: 2,
    technologies: ['WebSocket', 'Yjs Provider'],
    status: 'core',
    details: {
      purpose: 'Manages live socket connection to the collaboration gateway, syncing local changes with remote team members.',
      technologies: ['Native WebSocket API', 'Yjs doc bindings'],
      responsibilities: [
        'Establish secure authenticated WS channel (`/ws/collaborate/:portfolioId`)',
        'Encode and send incremental binary CRDT updates',
        'Render collaborative cursor positions and active editor badges'
      ]
    }
  },

  'frontend-design': {
    id: 'frontend-design',
    parentId: 'frontend',
    type: 'module',
    title: 'Pagecraft Design System',
    subtitle: 'Tailwind CSS Tokens, Theme Engine, and UI Components',
    category: 'Frontend Design',
    level: 2,
    technologies: ['Tailwind CSS', 'CSS Variables', 'Radix UI primitives'],
    status: 'production-hardened',
    details: {
      purpose: 'Consistent, themeable component library ensuring consistent typography, spacing, color scales, and accessible form controls.',
      technologies: ['Tailwind CSS', 'Radix UI Primitives', 'Lucide React'],
      responsibilities: [
        'Expose theme CSS variables (colors, fonts, border radii) updated dynamically by theme selector',
        'Provide accessible dialogs, dropdowns, tooltips, and slider controls',
        'Maintain responsive grid containers across all block layouts'
      ]
    }
  },

  'frontend-dashboard': {
    id: 'frontend-dashboard',
    parentId: 'frontend',
    type: 'module',
    title: 'Portfolio Manager Dashboard',
    subtitle: 'Multi-Portfolio Workspace & Duplication Hub',
    category: 'Frontend Views',
    level: 2,
    technologies: ['React', 'TanStack Query'],
    status: 'active',
    details: {
      purpose: 'Management console allowing users to view, create, duplicate, rename, archive, and delete portfolio projects.',
      technologies: ['React', 'TanStack Query'],
      responsibilities: [
        'Display card grid of existing portfolios with live preview thumbnails',
        'Provide one-click duplication duplicating nested page and block hierarchies',
        'Show publish status, custom domain tags, and quick-action export buttons'
      ]
    }
  },

  'frontend-public': {
    id: 'frontend-public',
    parentId: 'frontend',
    type: 'module',
    title: 'Public Dynamic Portfolio Viewer',
    subtitle: 'Lightweight Schema Renderer for Published Portfolios',
    category: 'Frontend Public',
    level: 2,
    technologies: ['React', 'Tailwind CSS'],
    status: 'core',
    details: {
      purpose: 'Clean, standalone viewer rendering published portfolios with sub-second initial load, zero editor overhead, and full SEO metadata.',
      technologies: ['React 18', 'Dynamic Component Factory'],
      responsibilities: [
        'Parse published snapshot JSON and map blocks directly to static presentation components',
        'Inject OpenGraph, Twitter card, and canonical SEO tags into page head',
        'Fire anonymous page view beacon to Analytics Engine'
      ]
    }
  },

  // --- BACKEND SUBSYSTEMS ---
  'auth-module': {
    id: 'auth-module',
    parentId: 'backend',
    type: 'module',
    title: 'Authentication & Identity Module',
    subtitle: 'JWT Sessions, OAuth Providers & RBAC Enforcement',
    category: 'Backend Security',
    level: 2,
    technologies: ['JWT', 'bcryptjs', 'Passport.js', 'Google OAuth', 'GitHub OAuth'],
    status: 'production-hardened',
    details: {
      purpose: 'Manages user registration, credential verification, multi-provider OAuth, session tokens, and workspace authorization boundaries.',
      technologies: ['Node.js', 'JWT', 'bcryptjs', 'Google Identity Services', 'GitHub OAuth v3'],
      responsibilities: [
        'Hash and verify user passwords using salted bcrypt algorithms',
        'Issue short-lived signed JWT access tokens and rotatable refresh tokens',
        'Validate OAuth callbacks from Google and GitHub with state verification',
        'Enforce workspace roles: Owner (full control), Editor (modify pages), Viewer (read-only)'
      ],
      apis: [
        { method: 'POST', endpoint: '/api/v1/auth/register', description: 'Register new account with email/password' },
        { method: 'POST', endpoint: '/api/v1/auth/login', description: 'Authenticate credentials and issue JWT' },
        { method: 'GET', endpoint: '/api/v1/auth/github', description: 'Initiate GitHub OAuth handshake' },
        { method: 'GET', endpoint: '/api/v1/auth/google', description: 'Initiate Google OAuth handshake' },
        { method: 'POST', endpoint: '/api/v1/auth/refresh', description: 'Rotate access token via refresh token' }
      ]
    }
  },

  'portfolio-module': {
    id: 'portfolio-module',
    parentId: 'backend',
    type: 'module',
    title: 'Portfolio Core Module',
    subtitle: 'Portfolio Document Lifecycle, Engine & Persistence',
    category: 'Backend Core',
    level: 2,
    technologies: ['Express', 'Node.js', 'TypeScript', 'Mongoose'],
    status: 'core',
    children: [
      'portfolio-service',
      'document-engine',
      'versioning-engine'
    ],
    details: {
      purpose: 'Core domain module overseeing portfolio documents, pages, block trees, schema migrations, and snapshotting.',
      technologies: ['Express', 'Node.js', 'TypeScript', 'Zod', 'MongoDB'],
      responsibilities: [
        'Coordinate CRUD operations across portfolio aggregates',
        'Validate slug uniqueness and availability',
        'Orchestrate document snapshots and schema migrations'
      ],
      apis: [
        { method: 'GET', endpoint: '/api/v1/portfolios/:id', description: 'Retrieve full portfolio document tree' },
        { method: 'PUT', endpoint: '/api/v1/portfolios/:id', description: 'Update portfolio metadata and settings' },
        { method: 'POST', endpoint: '/api/v1/portfolios/:id/duplicate', description: 'Deep duplicate complete portfolio structure' }
      ]
    }
  },

  'asset-module': {
    id: 'asset-module',
    parentId: 'backend',
    type: 'module',
    title: 'Asset & Media Management',
    subtitle: 'Multipart Upload Pipeline & Cloudinary Integration',
    category: 'Backend Media',
    level: 2,
    technologies: ['Multer', 'Cloudinary SDK', 'Sharp'],
    status: 'active',
    details: {
      purpose: 'Handles image uploads from studio canvas (profile photos, project screenshots, logos), optimizing and storing them on Cloudinary CDN.',
      technologies: ['Multer', 'Cloudinary SDK v2', 'Sharp buffer optimizer'],
      responsibilities: [
        'Stream multipart form uploads with file type (JPEG, PNG, WEBP, SVG) and size validation (<10MB)',
        'Optimize dimensions and format conversion prior to Cloudinary cloud upload',
        'Return secure, immutable CDN URLs with eager responsive transformation parameters'
      ],
      apis: [
        { method: 'POST', endpoint: '/api/v1/assets/upload', description: 'Upload image file and receive CDN URL' },
        { method: 'DELETE', endpoint: '/api/v1/assets/:publicId', description: 'Delete asset from Cloudinary storage' }
      ]
    }
  },

  'workspace-module': {
    id: 'workspace-module',
    parentId: 'backend',
    type: 'module',
    title: 'Workspace & Collaboration RBAC',
    subtitle: 'Team Spaces, Member Invitations & Role Matrix',
    category: 'Backend Governance',
    level: 2,
    technologies: ['Node.js', 'Express', 'Mongoose'],
    status: 'active',
    details: {
      purpose: 'Governs multi-tenant workspaces where users collaborate on shared portfolio libraries according to predefined role permissions.',
      technologies: ['Node.js', 'Mongoose RBAC schemas'],
      responsibilities: [
        'Manage workspace creation, member invitations, and seat allotments',
        'Enforce permission gates: Owner (billing & delete), Editor (content updates), Viewer (inspect & review)',
        'Isolate data tenants ensuring zero cross-tenant data leakage'
      ],
      apis: [
        { method: 'GET', endpoint: '/api/v1/workspaces', description: 'List workspaces for authenticated user' },
        { method: 'POST', endpoint: '/api/v1/workspaces/:id/invites', description: 'Invite collaborator with specific role' },
        { method: 'PATCH', endpoint: '/api/v1/workspaces/:id/members/:userId', description: 'Modify member role' }
      ]
    }
  },

  'billing-module': {
    id: 'billing-module',
    parentId: 'backend',
    type: 'module',
    title: 'Billing & Subscriptions Module',
    subtitle: 'Razorpay Subscriptions, Plans & Webhook Verifier',
    category: 'Backend Commerce',
    level: 2,
    technologies: ['Razorpay SDK', 'HMAC SHA256', 'Express'],
    status: 'production-hardened',
    details: {
      purpose: 'Manages monetization tiers (Free, Pro, Business), recurring subscriptions, checkout orders, and cryptographically verified webhook events.',
      technologies: ['Razorpay Node SDK', 'crypto (HMAC SHA-256)'],
      responsibilities: [
        'Create customer subscription plans: Free (1 portfolio), Pro (custom domains, AI features), Business (unlimited, ATS PDF, priority support)',
        'Generate Razorpay Order IDs for client checkout flow',
        'Verify Razorpay webhook signatures (`X-Razorpay-Signature`) to upgrade/downgrade user plan state'
      ],
      apis: [
        { method: 'POST', endpoint: '/api/v1/billing/create-subscription', description: 'Initiate Razorpay checkout session' },
        { method: 'POST', endpoint: '/api/v1/billing/webhook', description: 'Cryptographically verified Razorpay event webhook' },
        { method: 'GET', endpoint: '/api/v1/billing/subscription-status', description: 'Current active plan details & quota usage' }
      ]
    }
  },

  'analytics-module': {
    id: 'analytics-module',
    parentId: 'backend',
    type: 'module',
    title: 'Analytics & Metrics Engine',
    subtitle: 'Visit Counters, Geolocation & Interaction Telemetry',
    category: 'Backend Analytics',
    level: 2,
    technologies: ['MongoDB Aggregations', 'Redis Counters', 'Express'],
    status: 'active',
    details: {
      purpose: 'Records anonymous traffic statistics for published portfolios, offering creators insights on visitor counts, referrer sites, and popular blocks.',
      technologies: ['Redis INCRBY counters', 'MongoDB Time-Series / Aggregations'],
      responsibilities: [
        'Ingest lightweight telemetry pings without impacting public site latency',
        'Batch write visit counts from Redis to MongoDB on 5-minute intervals',
        'Aggregate visitor geographic origin, referrer domains, and device categories'
      ],
      apis: [
        { method: 'POST', endpoint: '/api/v1/analytics/track', description: 'Anonymous public site visitor beacon' },
        { method: 'GET', endpoint: '/api/v1/portfolios/:id/analytics', description: 'Time-series visitor analytics report' }
      ]
    }
  },

  'notification-module': {
    id: 'notification-module',
    parentId: 'backend',
    type: 'module',
    title: 'Notification Service',
    subtitle: 'Transactional Alerts, Invites & Status Updates',
    category: 'Backend Messaging',
    level: 2,
    technologies: ['Node.js', 'SendGrid / Nodemailer', 'WebSocket'],
    status: 'active',
    details: {
      purpose: 'Dispatches real-time in-app alerts and transactional emails for workspace invitations, publishing confirmations, and billing renewals.',
      technologies: ['Node.js', 'HTML email templates', 'WebSocket dispatcher'],
      responsibilities: [
        'Send workspace invitation emails with secure accept tokens',
        'Notify owners when custom domain SSL is activated or renewal succeeds',
        'Deliver in-app notification toasts to active editors'
      ]
    }
  },

  'pdf-engine': {
    id: 'pdf-engine',
    parentId: 'backend',
    type: 'service',
    title: 'Dual PDF Export Engine',
    subtitle: 'Client-Side Quick PDF & Server-Side Headless ATS PDF',
    category: 'Document Generation',
    level: 2,
    technologies: ['html2pdf.js', 'Puppeteer', 'BullMQ', 'Chromium'],
    status: 'core',
    children: ['client-pdf', 'server-pdf'],
    details: {
      purpose: 'Provides two distinct PDF generation pipelines: instantaneous client-side visual capture and high-fidelity, machine-readable ATS resume PDF generation.',
      technologies: ['html2pdf.js', 'Puppeteer headless Chromium', 'BullMQ job worker'],
      responsibilities: [
        'Provide immediate browser-side canvas download for casual sharing',
        'Run headless Chromium in sandbox to parse resume blocks into strictly standard ATS format',
        'Embed searchable text layer, standard headings (H1/H2), and clean contact metadata for ATS scanners'
      ],
      apis: [
        { method: 'POST', endpoint: '/api/v1/pdf/generate-ats', description: 'Queue server-side ATS PDF generation job' },
        { method: 'GET', endpoint: '/api/v1/pdf/jobs/:jobId', description: 'Poll status and download compiled ATS PDF' }
      ]
    }
  },

  'ai-service': {
    id: 'ai-service',
    parentId: 'backend',
    type: 'service',
    title: 'AI Assistant Service Abstraction',
    subtitle: 'Google Gemini LLM Content Generator & Layout Optimizer',
    category: 'AI Layer',
    level: 2,
    technologies: ['Google Gemini API', 'Node.js', 'Structured Output Prompts'],
    status: 'active',
    children: ['gemini-client', 'content-assistant'],
    details: {
      purpose: 'Internal AI abstraction layer connecting Pagecraft studio with Google Gemini models to assist users in writing compelling bios, project summaries, and skill recommendations.',
      technologies: ['@google/genai SDK', 'Prompt Engineering Templates', 'Rate Limiting'],
      responsibilities: [
        'Transform rough bullet points into polished, professional resume summaries',
        'Recommend appropriate section blocks and color palettes based on career domain',
        'Enforce strict JSON schema validation on LLM output before feeding into block editor'
      ],
      apis: [
        { method: 'POST', endpoint: '/api/v1/ai/generate-bio', description: 'Generate professional summary from user background' },
        { method: 'POST', endpoint: '/api/v1/ai/suggest-skills', description: 'Recommend industry skills based on job title' }
      ]
    }
  },

  'github-service': {
    id: 'github-service',
    parentId: 'backend',
    type: 'service',
    title: 'GitHub Integration Service',
    subtitle: 'Repository Sync, Pinned Projects & Tech Stack Detector',
    category: 'Integrations',
    level: 2,
    technologies: ['GitHub REST API', 'Octokit', 'OAuth 2.0'],
    status: 'active',
    details: {
      purpose: 'Connects to a developer’s GitHub account to import repositories directly as interactive Projects blocks with stars, forks, and language tags.',
      technologies: ['Octokit / GitHub REST API v3', 'OAuth token storage'],
      responsibilities: [
        'Fetch user pinned repositories, languages, description, and preview URLs',
        'Transform GitHub repo payloads into Pagecraft Project Block schemas',
        'Optionally sync repo star counts and README excerpts periodically'
      ],
      apis: [
        { method: 'GET', endpoint: '/api/v1/integrations/github/repos', description: 'Fetch repositories for authenticated user' },
        { method: 'POST', endpoint: '/api/v1/integrations/github/import-to-block', description: 'Convert selected repos into Project blocks' }
      ]
    }
  },

  // ==========================================
  // LEVEL 3: INTERNAL COMPONENTS & SERVICES
  // ==========================================

  // --- WITHIN PORTFOLIO MODULE ---
  'portfolio-service': {
    id: 'portfolio-service',
    parentId: 'portfolio-module',
    type: 'service',
    title: 'Portfolio Service',
    subtitle: 'Business Logic for Portfolios, Slugs & Ownership',
    category: 'Backend Service',
    level: 3,
    technologies: ['Node.js', 'TypeScript', 'Mongoose'],
    status: 'core',
    details: {
      purpose: 'Encapsulates business operations governing portfolio records, slug availability reservations, and deep cloning.',
      technologies: ['TypeScript', 'Mongoose'],
      responsibilities: [
        'Validate unique URL slugs against reserved keyword blacklist',
        'Perform atomic duplication of complex multi-page document structures',
        'Trigger cache eviction upon portfolio modification'
      ]
    }
  },

  'document-engine': {
    id: 'document-engine',
    parentId: 'portfolio-module',
    type: 'service',
    title: 'Document Engine',
    subtitle: 'Tree Hierarchy Reconciliation & Migration Pipeline',
    category: 'Core Engine',
    level: 3,
    technologies: ['TypeScript', 'Zod', 'JSON Schema'],
    status: 'core',
    children: [
      'schema-validation',
      'portfolio-persistence'
    ],
    details: {
      purpose: 'Controls the nested document tree representation, validating structural invariants, block parent-child relationships, and schema upgrade versions.',
      technologies: ['TypeScript', 'Zod Schemas', 'SemVer Engine'],
      responsibilities: [
        'Resolve nested hierarchy: Portfolio -> Settings / Theme -> Pages[] -> Blocks[]',
        'Upgrade legacy document schemas when newer block formats are introduced',
        'Generate deterministic hash representations for change detection'
      ]
    }
  },

  'versioning-engine': {
    id: 'versioning-engine',
    parentId: 'portfolio-module',
    type: 'service',
    title: 'Versioning & Snapshot Engine',
    subtitle: 'Immutable Document Checkpoints & Rollback',
    category: 'Core Engine',
    level: 3,
    technologies: ['MongoDB Change Streams', 'JSON Diffs'],
    status: 'core',
    details: {
      purpose: 'Creates immutable point-in-time snapshots of portfolio schemas on publication or manual save checkpoints, allowing one-click rollback.',
      technologies: ['MongoDB', 'JSON Diff/Patch'],
      responsibilities: [
        'Record snapshot upon each public publish action',
        'Maintain version history list with user annotations and timestamps',
        'Allow atomic restore of past snapshots to active working draft'
      ]
    }
  },

  // --- WITHIN FRONTEND CANVAS ---
  'block-palette': {
    id: 'block-palette',
    parentId: 'frontend-canvas',
    type: 'module',
    title: 'Block Library & Palette',
    subtitle: 'Pre-Built Reusable Section Blueprints',
    category: 'Studio Component',
    level: 3,
    technologies: ['React', 'React DnD', 'Lucide Icons'],
    status: 'core',
    details: {
      purpose: 'Drawer offering ready-made section blueprints (Header, About, Projects, Skills, Experience, Contact) draggable onto the canvas.',
      technologies: ['React DnD useDrag', 'Section Templates'],
      responsibilities: [
        'Categorize section types according to portfolio requirements',
        'Instantiate new default block JSON schema with unique UUID upon canvas drop',
        'Provide visual thumbnail previews of section variations'
      ]
    }
  },

  'inline-editor': {
    id: 'inline-editor',
    parentId: 'frontend-canvas',
    type: 'module',
    title: 'Inline Content Editor',
    subtitle: 'In-Place Direct Text & Attribute Manipulation',
    category: 'Studio Component',
    level: 3,
    technologies: ['ContentEditable', 'React State', 'Debounce'],
    status: 'core',
    details: {
      purpose: 'Allows users to click any headline, paragraph, skill tag, or date directly on the canvas to edit text in-place without modal popups.',
      technologies: ['React Ref', 'ContentEditable / Input', 'Debounced Dispatch'],
      responsibilities: [
        'Capture keyboard input and update block content schema in Zustand store',
        'Provide inline formatting toolbar (Bold, Italic, Link, List)',
        'Prevent accidental HTML injection by strictly handling text strings'
      ]
    }
  },

  'live-preview': {
    id: 'live-preview',
    parentId: 'frontend-canvas',
    type: 'module',
    title: 'Live Preview Engine',
    subtitle: 'Real-Time Reactive Schema Renderer & Breakpoint Switcher',
    category: 'Studio Component',
    level: 3,
    technologies: ['React 18', 'Tailwind CSS container queries'],
    status: 'core',
    details: {
      purpose: 'Instantly reflects theme, font, and content alterations in real time with zero compilation delay.',
      technologies: ['React Memo', 'Dynamic CSS Variables'],
      responsibilities: [
        'Switch viewport containers smoothly across Desktop (1280px), Tablet (768px), and Mobile (375px)',
        'Apply active theme color palette and typography selections instantly',
        'Guarantee that preview appearance matches published public output 1:1'
      ]
    }
  },

  // --- WITHIN REALTIME TIER ---
  'websocket-server': {
    id: 'websocket-server',
    parentId: 'realtime',
    type: 'service',
    title: 'WebSocket Gateway Server',
    subtitle: 'Stateful Connection Broker & Channel Manager',
    category: 'Realtime Service',
    level: 3,
    technologies: ['Node.js ws', 'Redis Adapter', 'JWT Auth'],
    status: 'core',
    details: {
      purpose: 'Handles persistent WebSocket connections, authenticating incoming handshakes and routing messages to specific portfolio rooms.',
      technologies: ['ws library', 'Redis Pub/Sub adapter'],
      responsibilities: [
        'Authenticate connection using JWT query parameter or handshake cookie',
        'Bind connections to room channels scoped by `portfolioId`',
        'Handle connection drops, heartbeat ping/pong, and graceful reconnects'
      ],
      apis: [
        { method: 'WS', endpoint: '/ws/collaborate/:portfolioId', description: 'Duplex collaboration channel' }
      ]
    }
  },

  'crdt-engine': {
    id: 'crdt-engine',
    parentId: 'realtime',
    type: 'service',
    title: 'CRDT Sync Engine',
    subtitle: 'Conflict-Free Document Reconciler',
    category: 'Realtime Service',
    level: 3,
    technologies: ['Yjs / Automerge CRDT Algorithms', 'Binary Encoding'],
    status: 'core',
    details: {
      purpose: 'Applies Conflict-free Replicated Data Type mathematics ensuring that concurrent edits from multiple editors converge deterministically.',
      technologies: ['Yjs / lib0 encoding', 'State Vector exchange'],
      responsibilities: [
        'Reconcile character insertions and deletions during simultaneous inline editing',
        'Handle concurrent block reordering without lost updates or race conditions',
        'Persist document states periodically to MongoDB persistence layer'
      ]
    }
  },

  'presence-tracker': {
    id: 'presence-tracker',
    parentId: 'realtime',
    type: 'service',
    title: 'Presence & Cursor Tracker',
    subtitle: 'Ephemeral Collaborator State Broadcaster',
    category: 'Realtime Service',
    level: 3,
    technologies: ['In-Memory Awareness Protocol', 'Redis'],
    status: 'core',
    details: {
      purpose: 'Broadcasts low-latency awareness states including teammate cursor positions, selected block IDs, and active user badges.',
      technologies: ['Yjs Awareness Protocol', 'Ephemeral Socket Broadcast'],
      responsibilities: [
        'Broadcast mouse pointer coordinates at 30fps throttle',
        'Highlight currently edited block with collaborator’s assigned color ring',
        'Auto-remove disconnected users after 10-second heartbeat silence'
      ]
    }
  },

  // --- WITHIN INFRASTRUCTURE ---
  'express-server': {
    id: 'express-server',
    parentId: 'infrastructure',
    type: 'infrastructure',
    title: 'Node.js Express API Server',
    subtitle: 'HTTP Gateway, Middleware Stack & Router',
    category: 'Compute Tier',
    level: 3,
    technologies: ['Express 4.x', 'TypeScript', 'Node.js 20 LTS'],
    status: 'production-hardened',
    details: {
      purpose: 'Main web application server listening on TCP/HTTP ports, executing middleware pipelines, routing requests, and sending JSON responses.',
      technologies: ['Express', 'Node.js HTTP', 'Morgan logging'],
      responsibilities: [
        'Execute security middleware chain (Helmet, CORS, Rate Limiter)',
        'Parse incoming JSON and URL-encoded request payloads',
        'Dispatch controller handlers with centralized error handling'
      ]
    }
  },

  'bullmq-queue': {
    id: 'bullmq-queue',
    parentId: 'infrastructure',
    type: 'infrastructure',
    title: 'BullMQ Job Queue',
    subtitle: 'Asynchronous Redis-Backed Work Distribution',
    category: 'Job Queue',
    level: 3,
    technologies: ['BullMQ', 'Redis 7', 'TypeScript'],
    status: 'production-hardened',
    details: {
      purpose: 'Reliable distributed queue system managing background tasks with prioritization, delayed jobs, and automatic retry backoff.',
      technologies: ['BullMQ 5.x', 'Redis Streams / Hashes'],
      responsibilities: [
        'Enqueues PDF generation jobs with high priority',
        'Maintains job progress tracking (0% -> 100%) for client polling',
        'Quarantines failed jobs into dead-letter queues after 3 retries'
      ]
    }
  },

  'background-workers': {
    id: 'background-workers',
    parentId: 'infrastructure',
    type: 'infrastructure',
    title: 'Asynchronous Background Workers',
    subtitle: 'Dedicated Compute Processes for PDF & Media',
    category: 'Worker Tier',
    level: 3,
    technologies: ['Puppeteer', 'Sharp', 'Node.js Worker Threads'],
    status: 'production-hardened',
    details: {
      purpose: 'Worker instances pulling jobs from BullMQ to execute resource-heavy operations isolated from the main Express event loop.',
      technologies: ['Puppeteer Headless', 'Sharp Image Pipeline'],
      responsibilities: [
        'Spin up isolated headless Chromium page to generate pixel-perfect ATS PDFs',
        'Process and generate multiple thumbnail resolutions for showcase portfolios',
        'Aggregate hourly analytics metrics into daily rollup collections'
      ]
    }
  },

  'redis-cache': {
    id: 'redis-cache',
    parentId: 'infrastructure',
    type: 'infrastructure',
    title: 'Redis Cache & Pub/Sub',
    subtitle: 'Sub-Millisecond Key-Value Store & Bus',
    category: 'Cache Tier',
    level: 3,
    technologies: ['Redis 7', 'ioredis'],
    status: 'production-hardened',
    details: {
      purpose: 'High-speed data store accelerating frequent queries, caching published portfolio schemas, and providing the message bus for WebSocket clustering.',
      technologies: ['Redis 7', 'ioredis connection pooling'],
      responsibilities: [
        'Cache public portfolio documents by slug (`cache:portfolio:slug:<slug>`)',
        'Serve as Pub/Sub broker coordinating events across multiple Express instances',
        'Store IP rate-limiting token buckets'
      ]
    }
  },

  // --- WITHIN PDF ENGINE ---
  'client-pdf': {
    id: 'client-pdf',
    parentId: 'pdf-engine',
    type: 'service',
    title: 'Client-Side Normal PDF Export',
    subtitle: 'Browser Canvas Capture via html2pdf.js',
    category: 'PDF Generation',
    level: 3,
    technologies: ['html2pdf.js', 'html2canvas', 'jsPDF'],
    status: 'core',
    details: {
      purpose: 'Instant visual snapshot of the portfolio directly in the client browser, downloading an exact graphical representation.',
      technologies: ['html2pdf.js', 'jsPDF', 'HTML Canvas'],
      responsibilities: [
        'Render DOM nodes into high-DPI canvas element',
        'Split content cleanly across standard A4/Letter page boundaries',
        'Trigger direct browser file download without server load'
      ]
    }
  },

  'server-pdf': {
    id: 'server-pdf',
    parentId: 'pdf-engine',
    type: 'service',
    title: 'Server-Side ATS PDF Engine',
    subtitle: 'Headless Chromium Semantic Resume Generator',
    category: 'PDF Generation',
    level: 3,
    technologies: ['Puppeteer', 'Headless Chrome', 'CSS Paged Media'],
    status: 'core',
    details: {
      purpose: 'Generates standardized resume PDFs formatted strictly for Applicant Tracking Systems (ATS), with selectable text, semantic headings, and no graphical noise.',
      technologies: ['Puppeteer', 'Structured HTML Template', 'PDF/A Profile'],
      responsibilities: [
        'Convert Resume and Experience blocks into clean, single-column semantic HTML',
        'Embed standard machine-readable text layers for Workday, Greenhouse, and Lever ATS parsers',
        'Ensure 100% compliance with ATS parsing algorithms'
      ]
    }
  },

  // --- WITHIN AI SERVICE ---
  'gemini-client': {
    id: 'gemini-client',
    parentId: 'ai-service',
    type: 'service',
    title: 'Gemini Client Connector',
    subtitle: 'Google GenAI SDK Adapter & Schema Harmonizer',
    category: 'AI Integration',
    level: 3,
    technologies: ['@google/genai SDK', 'JSON Mode'],
    status: 'active',
    details: {
      purpose: 'Maintains API communication with Google Gemini models, enforcing structured JSON output mode matching Pagecraft block interfaces.',
      technologies: ['Google GenAI SDK', 'Gemini 1.5/2.0 Flash'],
      responsibilities: [
        'Send curated system prompts instructing Gemini to output valid block JSON',
        'Handle API key rotation and quota limits',
        'Parse and validate responses against Zod block schema definitions'
      ]
    }
  },

  'content-assistant': {
    id: 'content-assistant',
    parentId: 'ai-service',
    type: 'service',
    title: 'Content & Copy Assistant',
    subtitle: 'Interactive Text Enhancement & Suggestion Generator',
    category: 'AI Application',
    level: 3,
    technologies: ['Prompt Engineering', 'TypeScript'],
    status: 'active',
    details: {
      purpose: 'User-facing feature in the studio providing smart suggestions: "Improve Bio", "Expand Bullet Points with Metrics", "Suggest Relevant Tech Skills".',
      technologies: ['Contextual Prompts', 'React Assistant Drawer'],
      responsibilities: [
        'Accept raw user job descriptions and formulate impact statements with action verbs',
        'Analyze project titles and recommend modern tech stack tag arrays',
        'Allow one-click insertion of generated copy directly into active blocks'
      ]
    }
  },

  // ==========================================
  // LEVEL 4: IMPLEMENTATION DETAILS & DATA SCHEMAS
  // ==========================================

  // --- SCHEMA & PERSISTENCE ---
  'schema-validation': {
    id: 'schema-validation',
    parentId: 'document-engine',
    type: 'service',
    title: 'Schema Validation Engine',
    subtitle: 'Strict Zod & JSON Schema Contract Enforcement',
    category: 'Data Validation',
    level: 4,
    technologies: ['Zod', 'TypeScript Type Guards'],
    status: 'core',
    details: {
      purpose: 'Guarantees that every block and page payload adheres to the strict typed contract before reaching persistence or client renderers.',
      technologies: ['Zod 3.x', 'TypeScript'],
      responsibilities: [
        'Validate incoming JSON mutations at runtime with detailed error paths',
        'Prevent unexpected properties or corrupted payload injections',
        'Export static TypeScript types directly from runtime schemas'
      ]
    }
  },

  'portfolio-persistence': {
    id: 'portfolio-persistence',
    parentId: 'document-engine',
    type: 'service',
    title: 'Persistence Layer (Mongoose Adapter)',
    subtitle: 'MongoDB Document Mapping & Version Handlers',
    category: 'Data Access',
    level: 4,
    technologies: ['Mongoose', 'MongoDB Atlas', 'Atomic Operations'],
    status: 'core',
    children: [
      'portfolio-doc-schema'
    ],
    details: {
      purpose: 'Executes atomic Mongoose queries and updates on the MongoDB Portfolios collection, managing version keys and snapshot generation.',
      technologies: ['Mongoose ODM', 'MongoDB Aggregation Framework'],
      responsibilities: [
        'Execute atomic `$set` and `$push` operations for block mutations',
        'Enforce document versioning using `schemaVersion` flags',
        'Manage write concerns (`w: "majority"`) for enterprise data safety'
      ]
    }
  },

  'portfolio-doc-schema': {
    id: 'portfolio-doc-schema',
    parentId: 'portfolio-persistence',
    type: 'schema',
    title: 'Portfolio Document Schema',
    subtitle: 'Nested JSON Schema & Master Data Model',
    category: 'Data Model',
    level: 4,
    technologies: ['MongoDB BSON', 'TypeScript Schema', 'JSON'],
    status: 'core',
    children: [
      'pages-schema'
    ],
    details: {
      purpose: 'Authoritative schema defining the full structure of a Pagecraft portfolio document including metadata, settings, theme tokens, navigation, and nested pages.',
      technologies: ['Mongoose Schema', 'Zod Contract'],
      responsibilities: [
        'Store title, slug, owner ID, workspace ID, and publish state',
        'Preserve theme configurations (fonts, primary colors, radius, dark/light mode)',
        'Maintain ordered list of pages belonging to this portfolio'
      ],
      dataModel: {
        name: 'PortfolioDocument',
        description: 'Complete MongoDB Document Schema for a Portfolio',
        schemaSnippet: `interface PortfolioDocument {
  _id: ObjectId;
  schemaVersion: number; // e.g. 1
  ownerId: ObjectId;
  workspaceId: ObjectId;
  slug: string; // e.g. "alex-developer"
  title: string;
  isPublished: boolean;
  publishedAt?: Date;
  customDomain?: {
    domain: string;
    verified: boolean;
    sslActive: boolean;
  };
  settings: {
    faviconUrl?: string;
    googleAnalyticsId?: string;
    allowSearchIndexing: boolean;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImageUrl?: string;
  };
  theme: {
    fontFamily: string; // e.g. "Inter", "JetBrains Mono"
    colorPalette: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
    };
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
    darkMode: boolean;
  };
  navigation: {
    showNavbar: boolean;
    sticky: boolean;
    links: Array<{ label: string; pageId: string }>;
  };
  pages: PageSchema[];
  createdAt: Date;
  updatedAt: Date;
}`
      }
    }
  },

  'pages-schema': {
    id: 'pages-schema',
    parentId: 'portfolio-doc-schema',
    type: 'schema',
    title: 'Pages Collection Schema',
    subtitle: 'Multi-Page Hierarchy (Home, About, Projects, Resume, Contact)',
    category: 'Data Model',
    level: 4,
    technologies: ['Nested Subdocument Array', 'TypeScript'],
    status: 'core',
    children: [
      'blocks-schema'
    ],
    details: {
      purpose: 'Represents individual pages within a portfolio (Home, About, Projects, Resume, Contact), each containing its ordered array of section blocks.',
      technologies: ['Subdocument Array', 'Zod Schema'],
      responsibilities: [
        'Define page title, path slug (`/`, `/about`, `/projects`, `/resume`, `/contact`)',
        'Hold page-specific SEO overrides and layout templates',
        'Maintain the strictly ordered list of content block IDs and payload schemas'
      ],
      dataModel: {
        name: 'PageSchema',
        description: 'Subdocument schema for a Page',
        schemaSnippet: `interface PageSchema {
  id: string; // UUID
  slug: string; // e.g. "projects", "resume"
  title: string;
  isHomePage: boolean;
  isVisible: boolean;
  seoDescription?: string;
  blocks: BlockSchema[]; // Ordered section blocks
}`
      }
    }
  },

  'blocks-schema': {
    id: 'blocks-schema',
    parentId: 'pages-schema',
    type: 'schema',
    title: 'Blocks Polymorphic Schema',
    subtitle: 'Header, About, Projects, Skills, Experience, Contact Blocks',
    category: 'Data Model',
    level: 4,
    technologies: ['Polymorphic JSON Schema', 'Discriminated Union'],
    status: 'core',
    details: {
      purpose: 'The atomic building unit of Pagecraft portfolios. Each block has a distinct type and content schema rendered dynamically by the frontend.',
      technologies: ['TypeScript Discriminated Union', 'JSON Schema'],
      responsibilities: [
        'Store unique block UUID, type, display order, and custom styling overrides',
        'Encapsulate section-specific content payloads (Header hero, Skills arrays, Experience timelines)',
        'Enable seamless drag-and-drop reordering without data corruption'
      ],
      dataModel: {
        name: 'BlockSchema',
        description: 'Polymorphic Block Schema with Discriminated Union',
        schemaSnippet: `type BlockType = 
  | 'header'
  | 'about'
  | 'projects'
  | 'skills'
  | 'experience'
  | 'contact';

interface BaseBlock {
  id: string; // UUID v4
  type: BlockType;
  order: number;
  padding: { top: number; bottom: number };
  hidden: boolean;
}

// 1. Header Block
interface HeaderBlock extends BaseBlock {
  type: 'header';
  content: {
    avatarUrl?: string;
    fullName: string;
    headline: string; // e.g. "Full-Stack Software Engineer"
    bioShort: string;
    socialLinks: Array<{ platform: string; url: string }>;
    ctaButton?: { label: string; url: string };
  };
}

// 2. About Block
interface AboutBlock extends BaseBlock {
  type: 'about';
  content: {
    title: string;
    bioParagraphs: string[];
    highlights: string[];
  };
}

// 3. Projects Block
interface ProjectsBlock extends BaseBlock {
  type: 'projects';
  content: {
    title: string;
    layout: 'grid' | 'cards' | 'compact';
    projectsList: Array<{
      id: string;
      title: string;
      description: string;
      imageUrl?: string;
      tags: string[];
      demoUrl?: string;
      repoUrl?: string;
    }>;
  };
}

// 4. Skills Block
interface SkillsBlock extends BaseBlock {
  type: 'skills';
  content: {
    title: string;
    categories: Array<{
      categoryName: string;
      skillsList: string[];
    }>;
  };
}

// 5. Experience Block
interface ExperienceBlock extends BaseBlock {
  type: 'experience';
  content: {
    title: string;
    timeline: Array<{
      role: string;
      company: string;
      location?: string;
      startDate: string;
      endDate: string;
      isCurrent: boolean;
      achievements: string[];
    }>;
  };
}

// 6. Contact Block
interface ContactBlock extends BaseBlock {
  type: 'contact';
  content: {
    title: string;
    email: string;
    phone?: string;
    location?: string;
    showContactForm: boolean;
  };
}

type BlockSchema = 
  | HeaderBlock 
  | AboutBlock 
  | ProjectsBlock 
  | SkillsBlock 
  | ExperienceBlock 
  | ContactBlock;`
      }
    }
  },

  // --- DATABASE COLLECTIONS ---
  'mongodb-atlas': {
    id: 'mongodb-atlas',
    parentId: 'database',
    type: 'database',
    title: 'MongoDB Atlas Collections',
    subtitle: 'Primary NoSQL Document Store (Replica Set)',
    category: 'Persistence Cluster',
    level: 2,
    technologies: ['MongoDB Atlas', 'Mongoose ODM', 'Replica Set'],
    status: 'core',
    children: [
      'col-portfolios',
      'col-users',
      'col-workspaces',
      'col-analytics',
      'col-audit',
      'col-showcase'
    ],
    details: {
      purpose: 'Fully managed cloud database storing user profiles, complex nested portfolio schemas, team workspaces, and telemetry data.',
      technologies: ['MongoDB Atlas AWS Cluster', 'WiredTiger Storage Engine'],
      responsibilities: [
        'Provide high availability with 3-node replica sets and automated failover',
        'Support flexible nested document models without rigid schema alter table migrations',
        'Maintain compound indexes on `slug`, `ownerId`, `customDomain.domain`, and `isPublished`'
      ]
    }
  },

  'col-portfolios': {
    id: 'col-portfolios',
    parentId: 'mongodb-atlas',
    type: 'database',
    title: 'portfolios Collection',
    subtitle: 'Core Portfolio Documents & Nested Block Trees',
    category: 'Database Collection',
    level: 3,
    technologies: ['MongoDB Collection', 'Compound Indexes'],
    status: 'core',
    details: {
      purpose: 'Primary collection holding all user portfolio projects, versions, and published configurations.',
      technologies: ['BSON Document Storage'],
      responsibilities: [
        'Stores full nested JSON schema (settings, theme, pages, blocks)',
        'Indexed on `{ slug: 1 }` (unique sparse), `{ ownerId: 1 }`, `{ "customDomain.domain": 1 }`'
      ]
    }
  },

  'col-users': {
    id: 'col-users',
    parentId: 'mongodb-atlas',
    type: 'database',
    title: 'users Collection',
    subtitle: 'Authentication Credentials & Plan Tiers',
    category: 'Database Collection',
    level: 3,
    technologies: ['MongoDB Collection', 'bcrypt'],
    status: 'core',
    details: {
      purpose: 'Stores user identities, hashed passwords, OAuth profile linkages, and active subscription plan tiers (Free, Pro, Business).',
      technologies: ['BSON Document Storage'],
      responsibilities: [
        'Enforce unique email constraints',
        'Store Stripe/Razorpay customer IDs and subscription expiration dates'
      ]
    }
  },

  'col-workspaces': {
    id: 'col-workspaces',
    parentId: 'mongodb-atlas',
    type: 'database',
    title: 'workspaces Collection',
    subtitle: 'Team Tenants & Member Permission Maps',
    category: 'Database Collection',
    level: 3,
    technologies: ['MongoDB Collection'],
    status: 'core',
    details: {
      purpose: 'Represents shared team environments and tracks user role allocations (Owner, Editor, Viewer).',
      technologies: ['BSON Document Storage'],
      responsibilities: [
        'Map users to roles within a workspace',
        'Link multiple portfolios to a single collaborative entity'
      ]
    }
  },

  'col-analytics': {
    id: 'col-analytics',
    parentId: 'mongodb-atlas',
    type: 'database',
    title: 'analytics Collection',
    subtitle: 'Traffic Aggregations & Daily Visitor Rollups',
    category: 'Database Collection',
    level: 3,
    technologies: ['MongoDB Time-Series / Sharded'],
    status: 'active',
    details: {
      purpose: 'Stores daily visitor counts, referrer summaries, and geographic breakdowns for published portfolios.',
      technologies: ['BSON Document Storage'],
      responsibilities: [
        'Indexed on `{ portfolioId: 1, date: -1 }`',
        'Supports fast aggregation pipelines for creator analytics charts'
      ]
    }
  },

  'col-audit': {
    id: 'col-audit',
    parentId: 'mongodb-atlas',
    type: 'database',
    title: 'audit_logs Collection',
    subtitle: 'Immutable Operational & Security Audit Trail',
    category: 'Database Collection',
    level: 3,
    technologies: ['Append-Only MongoDB Collection'],
    status: 'production-hardened',
    details: {
      purpose: 'Immutable log recording security-critical events (login attempts, plan changes, domain unpublishing, admin actions).',
      technologies: ['Capped / TTL Index Collections'],
      responsibilities: [
        'Record timestamp, acting userId, IP address, action code, and target entity',
        'Prevent modification or tampering to preserve compliance integrity'
      ]
    }
  },

  'col-showcase': {
    id: 'col-showcase',
    parentId: 'mongodb-atlas',
    type: 'database',
    title: 'showcase_templates Collection',
    subtitle: 'Community Designs & Curated Blueprints',
    category: 'Database Collection',
    level: 3,
    technologies: ['MongoDB Collection'],
    status: 'active',
    details: {
      purpose: 'Stores published community showcase entries, featured templates, rating scores, and clone metrics.',
      technologies: ['BSON Document Storage'],
      responsibilities: [
        'Store sanitized template snapshots ready for duplication',
        'Track clone count and user rating telemetry'
      ]
    }
  },

  'redis-database': {
    id: 'redis-database',
    parentId: 'database',
    type: 'database',
    title: 'Redis In-Memory Tier',
    subtitle: 'High-Throughput Caching & Queuing Engine',
    category: 'In-Memory Store',
    level: 2,
    technologies: ['Redis 7', 'BullMQ Store'],
    status: 'production-hardened',
    details: {
      purpose: 'Supplements MongoDB with sub-millisecond RAM key-value caching, Pub/Sub channels, and BullMQ worker queues.',
      technologies: ['Redis 7.2', 'AOF & RDB Persistence'],
      responsibilities: [
        'Serve as backing broker for BullMQ job queues',
        'Cache public published portfolio schemas by slug and custom domain',
        'Track rate limits and active user WebSocket sessions'
      ]
    }
  },

  // --- EXTERNAL SAAS SERVICES ---
  'cloudinary-ext': {
    id: 'cloudinary-ext',
    parentId: 'external-services',
    type: 'external',
    title: 'Cloudinary Media CDN',
    subtitle: 'Cloud Media Storage & On-The-Fly Transformations',
    category: 'External SaaS',
    level: 2,
    technologies: ['Cloudinary REST API', 'Akamai Global CDN'],
    status: 'production-hardened',
    details: {
      purpose: 'Stores uploaded portfolio profile pictures, project mockups, and logos, performing automatic WebP/AVIF format optimization and edge distribution.',
      technologies: ['Cloudinary Image Pipeline', 'Multi-CDN Delivery'],
      responsibilities: [
        'Automatically crop, scale, and deliver optimal format based on browser User-Agent',
        'Provide secure signed upload URLs',
        'Enforce asset size quotas based on user subscription tier'
      ]
    }
  },

  'razorpay-ext': {
    id: 'razorpay-ext',
    parentId: 'external-services',
    type: 'external',
    title: 'Razorpay Payment Gateway',
    subtitle: 'Recurring Subscriptions & Checkout Engine',
    category: 'External SaaS',
    level: 2,
    technologies: ['Razorpay API v1', 'PCI-DSS Compliant Gateway'],
    status: 'production-hardened',
    details: {
      purpose: 'Handles secure payments for Pro and Business subscription upgrades via Cards, NetBanking, and UPI.',
      technologies: ['Razorpay Standard Checkout', 'Signed Webhooks'],
      responsibilities: [
        'Manage recurring subscription billing cycles and invoices',
        'Emit secure webhooks on successful charges or payment failures',
        'Handle refund and plan upgrade/proration calculations'
      ]
    }
  },

  'gemini-ext': {
    id: 'gemini-ext',
    parentId: 'external-services',
    type: 'external',
    title: 'Google Gemini AI API',
    subtitle: 'Multimodal Foundation Model Endpoint',
    category: 'External AI',
    level: 2,
    technologies: ['Google Gemini 1.5 / 2.0', 'Google AI Studio'],
    status: 'active',
    details: {
      purpose: 'Provides foundation generative intelligence for rewriting resumes, summarizing technical projects, and tailoring portfolios for target jobs.',
      technologies: ['Gemini Flash / Pro Models', 'Google AI API'],
      responsibilities: [
        'Execute structured prompt requests with low latency',
        'Output clean JSON payloads representing formatted text and skills'
      ]
    }
  },

  'github-api-ext': {
    id: 'github-api-ext',
    parentId: 'external-services',
    type: 'external',
    title: 'GitHub API & OAuth',
    subtitle: 'Public Developer Profile & Repository API',
    category: 'External SaaS',
    level: 2,
    technologies: ['GitHub REST API v3', 'GraphQL API v4'],
    status: 'active',
    details: {
      purpose: 'Authenticates developers via GitHub and provides direct API access to pinned repositories, descriptions, star counts, and primary languages.',
      technologies: ['OAuth 2.0 Web Application Flow', 'GitHub REST API'],
      responsibilities: [
        'Provide single-sign-on (SSO) credentials',
        'Return structured repository metadata for instant portfolio project card creation'
      ]
    }
  },

  'google-auth-ext': {
    id: 'google-auth-ext',
    parentId: 'external-services',
    type: 'external',
    title: 'Google OAuth 2.0',
    subtitle: 'Federated Google Identity Provider',
    category: 'External SaaS',
    level: 2,
    technologies: ['Google Identity Services', 'OpenID Connect'],
    status: 'production-hardened',
    details: {
      purpose: 'Enables quick one-click registration and sign-in using existing Google accounts with verified email addresses.',
      technologies: ['OAuth 2.0 / OIDC', 'Google Public Keys JWKS'],
      responsibilities: [
        'Verify Google ID tokens and extract verified email, name, and profile avatar'
      ]
    }
  },

  // --- PUBLISHING & DOMAINS SUBSYSTEMS ---
  'slug-router': {
    id: 'slug-router',
    parentId: 'publishing',
    type: 'service',
    title: 'Subdomain & Slug Router',
    subtitle: 'pagecraft.app/:slug Dynamic Resolution Proxy',
    category: 'Routing Tier',
    level: 2,
    technologies: ['Express Route Middleware', 'Redis Cache Lookup'],
    status: 'production-hardened',
    details: {
      purpose: 'Resolves public HTTP requests formatted as `pagecraft.app/:slug` or subdomains directly to the published portfolio snapshot.',
      technologies: ['Express Path Matching', 'Redis Slug Hash Map'],
      responsibilities: [
        'Lookup published portfolio by slug in Redis cache with fallback to MongoDB',
        'Stream clean HTML / React bundle with preloaded initial state',
        'Return 404 with custom branded template if slug is unpublished or unregistered'
      ],
      apis: [
        { method: 'GET', endpoint: '/:slug', description: 'Public portfolio entry route' }
      ]
    }
  },

  'custom-domain-engine': {
    id: 'custom-domain-engine',
    parentId: 'publishing',
    type: 'service',
    title: 'Custom Domain Engine',
    subtitle: 'DNS CNAME Verification & Automated SSL',
    category: 'Routing Tier',
    level: 2,
    technologies: ['DNS Resolver', 'ACME / TLS Provider', 'Node.js dns'],
    status: 'production-hardened',
    details: {
      purpose: 'Allows Pro and Business creators to point personal domains (e.g., `alexander.dev`) to Pagecraft via CNAME records.',
      technologies: ['Node.js dns.promises', 'Automated Certificate Issuance'],
      responsibilities: [
        'Verify user CNAME records pointing to `cname.pagecraft.app`',
        'Provision and auto-renew TLS/SSL certificates',
        'Route custom Host headers directly to corresponding portfolio documents'
      ],
      apis: [
        { method: 'POST', endpoint: '/api/v1/domains/verify', description: 'Check DNS record propagation for domain' }
      ]
    }
  },

  'edge-cache': {
    id: 'edge-cache',
    parentId: 'publishing',
    type: 'infrastructure',
    title: 'Edge Delivery & CDN Cache',
    subtitle: 'Global Edge Caching & Stale-While-Revalidate',
    category: 'Edge Tier',
    level: 2,
    technologies: ['Cloudflare / Fastly CDN', 'HTTP Cache-Control Headers'],
    status: 'production-hardened',
    details: {
      purpose: 'Distributes published portfolio snapshots across worldwide edge points-of-presence for lightning-fast sub-50ms load times.',
      technologies: ['Edge CDN Nodes', 'Stale-While-Revalidate Headers'],
      responsibilities: [
        'Serve cached static HTML and block schemas directly from edge PoPs',
        'Purge edge cache instantly when user clicks "Publish Changes" in editor'
      ]
    }
  },

  // --- CREATOR ECOSYSTEM SUBSYSTEMS ---
  'showcase-hub': {
    id: 'showcase-hub',
    parentId: 'creator-ecosystem',
    type: 'module',
    title: 'Portfolio Showcase Hub',
    subtitle: 'Public Discovery Gallery & Featured Portfolios',
    category: 'Community Hub',
    level: 2,
    technologies: ['React', 'Express', 'MongoDB Atlas'],
    status: 'active',
    details: {
      purpose: 'Curated public gallery where users can showcase their published portfolios, discover design inspiration, and browse by profession.',
      technologies: ['MongoDB Text Index', 'React Filter Grid'],
      responsibilities: [
        'Display searchable cards with live preview thumbnails',
        'Filter by role categories (Software Engineer, Designer, Product Manager, Student)',
        'Track view count and community upvotes'
      ]
    }
  },

  'template-sharing': {
    id: 'template-sharing',
    parentId: 'creator-ecosystem',
    type: 'module',
    title: 'Reusable Design Templates',
    subtitle: 'One-Click Clone & Blueprint Distribution',
    category: 'Template Engine',
    level: 2,
    technologies: ['Document Cloner', 'UUID Generator'],
    status: 'active',
    details: {
      purpose: 'Enables users to clone curated community templates into their own workspace with fresh UUIDs and blank placeholder content.',
      technologies: ['Deep Clone Engine', 'UUID v4'],
      responsibilities: [
        'Sanitize sensitive user data from template source before duplication',
        'Instantiate new Portfolio and Page records in user’s target workspace'
      ]
    }
  },

  'design-contributions': {
    id: 'design-contributions',
    parentId: 'creator-ecosystem',
    type: 'module',
    title: 'Community Design Contributions',
    subtitle: 'Template Publishing, Forking & Attribution',
    category: 'Community Engine',
    level: 2,
    technologies: ['MongoDB Schema', 'Attribution Engine'],
    status: 'active',
    details: {
      purpose: 'Allows talented designers to submit section layouts and color themes to the Pagecraft community library with creator attribution.',
      technologies: ['Attribution Ledger', 'Moderation Queue'],
      responsibilities: [
        'Submit designs to moderation queue before public display',
        'Track original author credits on forked portfolios'
      ]
    }
  },

  // --- ADMIN & MODERATION SUBSYSTEMS ---
  'admin-dashboard': {
    id: 'admin-dashboard',
    parentId: 'admin-moderation',
    type: 'module',
    title: 'Super Admin Portal',
    subtitle: 'Platform Operations, User Management & Metrics',
    category: 'Internal Tooling',
    level: 2,
    technologies: ['React Admin', 'Express Super Admin Guard'],
    status: 'production-hardened',
    details: {
      purpose: 'Private administration cockpit for Pagecraft platform operators to monitor system health, inspect user accounts, and override subscription plans.',
      technologies: ['Protected Route Guards', 'Admin API Controllers'],
      responsibilities: [
        'Display real-time system metrics (active users, published sites, worker queue latency)',
        'Search users and view billing histories and quota utilization',
        'Manually upgrade or downgrade user workspace tiers'
      ]
    }
  },

  'moderation-engine': {
    id: 'moderation-engine',
    parentId: 'admin-moderation',
    type: 'module',
    title: 'Content Moderation System',
    subtitle: 'Abuse Reporting, Spam Flags & Domain Takedown',
    category: 'Trust & Safety',
    level: 2,
    technologies: ['Automated Keyword Filters', 'Manual Review Console'],
    status: 'production-hardened',
    details: {
      purpose: 'Protects the platform against phishing, malicious links, and offensive material published under Pagecraft domains.',
      technologies: ['Report Ingestion Worker', 'Automated Domain Blocker'],
      responsibilities: [
        'Receive and triage anonymous abuse reports from public portfolio footers',
        'Provide instant one-click unpublish and domain revocation buttons',
        'Blacklist malicious URLs and suspicious redirect links'
      ]
    }
  },

  'audit-logging': {
    id: 'audit-logging',
    parentId: 'admin-moderation',
    type: 'service',
    title: 'Audit & Compliance Logging',
    subtitle: 'Tamper-Proof Event Trail & Security Ledger',
    category: 'Compliance',
    level: 2,
    technologies: ['MongoDB Append-Only Log', 'Winston Logger'],
    status: 'production-hardened',
    details: {
      purpose: 'Records structured, immutable logs of all sensitive actions for security compliance and audit readiness.',
      technologies: ['Winston structured JSON logger', 'MongoDB audit collection'],
      responsibilities: [
        'Log all permission changes, role assignments, and domain bindings',
        'Capture IP address, User-Agent, timestamp, and before/after state diffs'
      ]
    }
  },

  // --- SECURITY & PRODUCTION HARDENING SUBSYSTEMS ---
  'auth-security': {
    id: 'auth-security',
    parentId: 'security-compliance',
    type: 'security',
    title: 'JWT & Session Security',
    subtitle: 'HTTP-Only Cookies, Token Rotation & bcrypt Hashing',
    category: 'Security Architecture',
    level: 2,
    technologies: ['HTTP-Only SameSite Cookies', 'bcrypt', 'JWT RS256/HS256'],
    status: 'production-hardened',
    details: {
      purpose: 'Implements battle-tested identity security practices preventing token theft, session hijacking, and rainbow table password cracking.',
      technologies: ['bcryptjs (12 salt rounds)', 'Signed HTTP-Only Cookies', 'Token Blacklisting via Redis'],
      responsibilities: [
        'Store JWT tokens in HTTP-Only, SameSite=Strict, Secure cookies immune to XSS theft',
        'Implement automatic refresh token rotation and revocation on logout',
        'Hash passwords with cryptographically strong salt rounds'
      ]
    }
  },

  'api-protection': {
    id: 'api-protection',
    parentId: 'security-compliance',
    type: 'security',
    title: 'API Protection & Rate Limiting',
    subtitle: 'Helmet Security Headers, CORS & Rate Limits',
    category: 'Security Architecture',
    level: 2,
    technologies: ['Helmet.js', 'express-rate-limit', 'Strict CORS'],
    status: 'production-hardened',
    details: {
      purpose: 'Shields API endpoints from brute force attacks, distributed denial of service (DDoS), and clickjacking exploits.',
      technologies: ['Helmet CSP headers', 'express-rate-limit with Redis store'],
      responsibilities: [
        'Enforce strict Content Security Policy (CSP) and HTTP Strict Transport Security (HSTS)',
        'Limit API endpoints to 100 requests per 15 minutes per IP (auth endpoints: 5 per 15 mins)',
        'Restrict CORS requests strictly to approved Pagecraft domains'
      ]
    }
  },

  'data-sanitization': {
    id: 'data-sanitization',
    parentId: 'security-compliance',
    type: 'security',
    title: 'Data Sanitization & Injection Defense',
    subtitle: 'DOMPurify, NoSQL Injection Defense & Zod Guards',
    category: 'Security Architecture',
    level: 2,
    technologies: ['DOMPurify', 'mongo-sanitize', 'Zod'],
    status: 'production-hardened',
    details: {
      purpose: 'Eliminates NoSQL query selector injections and client-side Cross-Site Scripting (XSS) in dynamically rendered user blocks.',
      technologies: ['DOMPurify XSS filter', 'mongo-sanitize filter'],
      responsibilities: [
        'Strip forbidden `$` and `.` operators from request bodies to prevent Mongo operator injection',
        'Sanitize all inline HTML strings with DOMPurify before dangerouslySetInnerHTML or preview rendering',
        'Validate incoming payload shapes with strict Zod type constraints'
      ]
    }
  }
};
