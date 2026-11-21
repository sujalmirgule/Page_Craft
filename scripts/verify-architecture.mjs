import { ARCHITECTURE_NODES } from '../src/architecture/architecture-data.ts';
import { ARCHITECTURE_RELATIONSHIPS } from '../src/architecture/architecture-relationships.ts';
import { architectureTree } from '../src/architecture/architecture-tree.ts';
import { getVisibleGraph, calculateLayout, NODE_DIMENSIONS } from '../src/architecture/architecture-utils.ts';

console.log('=== PAGECRAFT ARCHITECTURE EXPLORER VERIFICATION SUITE ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

// ==========================================
// TEST 1: All Major Domains & Subsystems Represented
// ==========================================
console.log('Test 1: Level 0 and Level 1 Major Domains');
const rootNode = architectureTree.getNode('pagecraft-root');
assert(rootNode !== undefined, 'Root node "pagecraft-root" exists');
assert(rootNode.level === 0, 'Root node is Level 0');
assert(rootNode.children && rootNode.children.length === 10, 'Root has exactly 10 Level 1 major domains');

const expectedL1 = [
  'frontend', 'backend', 'database', 'realtime', 'infrastructure',
  'external-services', 'publishing', 'creator-ecosystem', 'admin-moderation', 'security-compliance'
];

expectedL1.forEach(l1Id => {
  const l1Node = architectureTree.getNode(l1Id);
  assert(l1Node !== undefined && l1Node.level === 1, `Major domain "${l1Id}" is Level 1`);
});

// ==========================================
// TEST 2: Hierarchical Progressive Disclosure (Expand & Collapse)
// ==========================================
console.log('\nTest 2: Progressive Disclosure & Graph Visibility');
// Initial view: only pagecraft-root is expanded -> root + 10 L1 children = 11 nodes
const initialExpanded = new Set(['pagecraft-root']);
const initialGraph = getVisibleGraph(initialExpanded, null);
assert(initialGraph.visibleNodes.length === 11, `Initial view has exactly 11 visible nodes (found ${initialGraph.visibleNodes.length})`);

// Expanding 'backend' adds its children
const backendExpanded = new Set(['pagecraft-root', 'backend']);
const backendGraph = getVisibleGraph(backendExpanded, null);
const backendNode = architectureTree.getNode('backend');
const expectedBackendTotal = 11 + (backendNode.children?.length || 0);
assert(backendGraph.visibleNodes.length === expectedBackendTotal, `Expanding backend reveals its ${backendNode.children?.length} children`);

// Expanding 'portfolio-module' drills down to Level 3
const portfolioExpanded = new Set(['pagecraft-root', 'backend', 'portfolio-module']);
const portfolioGraph = getVisibleGraph(portfolioExpanded, null);
assert(portfolioGraph.visibleNodes.some(n => n.id === 'document-engine'), 'Drill-down reveals document-engine');

// Collapsing backend removes all descendants
const allBackendDescendants = architectureTree.getAllDescendantIds('backend');
assert(allBackendDescendants.includes('document-engine'), 'document-engine is descendant of backend');
assert(allBackendDescendants.includes('blocks-schema'), 'blocks-schema is descendant of backend');

// ==========================================
// TEST 3: Deep Architecture Search & Ancestor Resolution
// ==========================================
console.log('\nTest 3: Deep Architecture Search');
const searchQueries = [
  { q: 'MongoDB', expectedId: 'mongodb-atlas' },
  { q: 'CRDT', expectedId: 'crdt-engine' },
  { q: 'BullMQ', expectedId: 'bullmq-queue' },
  { q: 'Portfolio', expectedId: 'portfolio-module' },
  { q: 'Cloudinary', expectedId: 'cloudinary-ext' },
  { q: 'Razorpay', expectedId: 'razorpay-ext' },
  { q: 'Gemini', expectedId: 'gemini-ext' },
  { q: 'WebSocket', expectedId: 'websocket-server' },
  { q: 'Workspace', expectedId: 'workspace-module' },
  { q: 'Showcase', expectedId: 'showcase-hub' },
  { q: 'ATS PDF', expectedId: 'server-pdf' }
];

searchQueries.forEach(({ q, expectedId }) => {
  const matches = architectureTree.searchNodes(q);
  const found = matches.some(m => m.id === expectedId);
  assert(found, `Search "${q}" accurately locates "${expectedId}"`);
});

// Test ancestor expansion for deep search result 'blocks-schema'
const deepNodeAncestors = architectureTree.getAncestors('blocks-schema').map(a => a.id);
assert(deepNodeAncestors.includes('pagecraft-root'), 'Ancestors include pagecraft-root');
assert(deepNodeAncestors.includes('backend'), 'Ancestors include backend');
assert(deepNodeAncestors.includes('portfolio-module'), 'Ancestors include portfolio-module');
assert(deepNodeAncestors.includes('document-engine'), 'Ancestors include document-engine');
assert(deepNodeAncestors.includes('portfolio-persistence'), 'Ancestors include portfolio-persistence');
assert(deepNodeAncestors.includes('portfolio-doc-schema'), 'Ancestors include portfolio-doc-schema');
assert(deepNodeAncestors.includes('pages-schema'), 'Ancestors include pages-schema');

// ==========================================
// TEST 4: Breadcrumbs Navigation
// ==========================================
console.log('\nTest 4: Breadcrumb Trail Computation');
const breadcrumbs = architectureTree.getBreadcrumbs('blocks-schema');
assert(breadcrumbs.length === 8, `Breadcrumb depth for blocks-schema is 8 (found ${breadcrumbs.length})`);
assert(breadcrumbs[0].id === 'pagecraft-root', 'Breadcrumb starts at root');
assert(breadcrumbs[breadcrumbs.length - 1].id === 'blocks-schema', 'Breadcrumb terminates at target');

// ==========================================
// TEST 5: Focus Mode Subsystem Isolation
// ==========================================
console.log('\nTest 5: Subsystem Focus Mode');
const focusGraph = getVisibleGraph(new Set(), 'portfolio-module');
assert(focusGraph.visibleNodes.some(n => n.id === 'portfolio-module'), 'Focus mode contains focused node');
assert(focusGraph.visibleNodes.some(n => n.id === 'backend'), 'Focus mode contains parent context');
assert(focusGraph.visibleNodes.some(n => n.id === 'document-engine'), 'Focus mode contains immediate children');
assert(!focusGraph.visibleNodes.some(n => n.id === 'cloudinary-ext'), 'Focus mode isolates unrelated nodes');

// ==========================================
// TEST 6: Dagre Layout Recalculation & Orientation
// ==========================================
console.log('\nTest 6: Dagre Layout Calculation (TB vs LR)');
const mockToggle = () => {};
const layoutTB = calculateLayout(
  backendGraph.visibleNodes,
  [...backendGraph.structuralEdges, ...backendGraph.relationshipEdges],
  { direction: 'TB' },
  'backend',
  backendExpanded,
  mockToggle
);
assert(layoutTB.layoutedNodes.length === backendGraph.visibleNodes.length, 'TB layout placed all visible nodes');

const layoutLR = calculateLayout(
  backendGraph.visibleNodes,
  [...backendGraph.structuralEdges, ...backendGraph.relationshipEdges],
  { direction: 'LR' },
  'backend',
  backendExpanded,
  mockToggle
);
assert(layoutLR.layoutedNodes.length === backendGraph.visibleNodes.length, 'LR layout placed all visible nodes');
assert(layoutLR.layoutedNodes.every(n => n.targetPosition === 'left' && n.sourcePosition === 'right'), 'LR layout sets left/right handles');
assert(layoutTB.layoutedNodes.every(n => n.targetPosition === 'top' && n.sourcePosition === 'bottom'), 'TB layout sets top/bottom handles');

// ==========================================
// TEST 7: Semantic Relationships & Animated Connections
// ==========================================
console.log('\nTest 7: Relationship Protocol & Animations');
const animatedProtocols = ['WebSocket', 'CRDT', 'Queue'];
const websocketEdges = ARCHITECTURE_RELATIONSHIPS.filter(r => r.protocol === 'WebSocket');
const crdtEdges = ARCHITECTURE_RELATIONSHIPS.filter(r => r.protocol === 'CRDT');
const queueEdges = ARCHITECTURE_RELATIONSHIPS.filter(r => r.protocol === 'Queue');

assert(websocketEdges.every(e => e.animated === true), 'All WebSocket connections have animated=true');
assert(crdtEdges.every(e => e.animated === true), 'All CRDT connections have animated=true');
assert(queueEdges.every(e => e.animated === true), 'All BullMQ Queue connections have animated=true');

// ==========================================
// TEST 8: Data Model Schemas Validation
// ==========================================
console.log('\nTest 8: Data Model & Schema Details');
const portfolioDoc = architectureTree.getNode('portfolio-doc-schema');
assert(portfolioDoc?.details.dataModel !== undefined, 'Portfolio Document schema details exist');
assert(portfolioDoc?.details.dataModel?.name === 'PortfolioDocument', 'Schema name is PortfolioDocument');

const blocksDoc = architectureTree.getNode('blocks-schema');
assert(blocksDoc?.details.dataModel !== undefined, 'Blocks polymorphic schema details exist');
assert(blocksDoc?.details.dataModel?.schemaSnippet.includes('HeaderBlock'), 'Snippet defines HeaderBlock');
assert(blocksDoc?.details.dataModel?.schemaSnippet.includes('AboutBlock'), 'Snippet defines AboutBlock');
assert(blocksDoc?.details.dataModel?.schemaSnippet.includes('ProjectsBlock'), 'Snippet defines ProjectsBlock');
assert(blocksDoc?.details.dataModel?.schemaSnippet.includes('SkillsBlock'), 'Snippet defines SkillsBlock');
assert(blocksDoc?.details.dataModel?.schemaSnippet.includes('ExperienceBlock'), 'Snippet defines ExperienceBlock');
assert(blocksDoc?.details.dataModel?.schemaSnippet.includes('ContactBlock'), 'Snippet defines ContactBlock');

// ==========================================
// SUMMARY
// ==========================================
console.log(`\n==========================================`);
console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`==========================================`);

if (failCount > 0) {
  process.exit(1);
}
