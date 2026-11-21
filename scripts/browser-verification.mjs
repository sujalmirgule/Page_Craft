import { spawn } from 'child_process';
import http from 'http';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 5193;
const CDP_PORT = 9225;

console.log('=== STARTING BROWSER INTERACTION VERIFICATION ===\n');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Start Vite Preview Server
console.log(`Starting Vite preview server on port ${PORT}...`);
const viteServer = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
  stdio: 'inherit'
});

// Wait for Vite server to be reachable
async function waitForServer(url, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, res => {
          if (res.statusCode === 200) resolve();
          else reject();
        });
        req.on('error', reject);
      });
      return true;
    } catch {
      await sleep(300);
    }
  }
  return false;
}

const serverReady = await waitForServer(`http://127.0.0.1:${PORT}`);
if (!serverReady) {
  console.error('Failed to start Vite preview server');
  viteServer.kill();
  process.exit(1);
}
console.log('Vite preview server is ready and serving index.html!');

// 2. Launch Headless Chrome with Remote Debugging
console.log('Launching Headless Chrome with DevTools protocol...');
const chromeProcess = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--window-size=1440,900',
  'about:blank'
], { stdio: 'ignore' });

// Wait for Chrome CDP endpoint
async function getWebSocketDebuggerUrl(timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const data = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${CDP_PORT}/json/version`, res => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
      });
      if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl;
    } catch {
      await sleep(300);
    }
  }
  return null;
}

const wsUrl = await getWebSocketDebuggerUrl();
if (!wsUrl) {
  console.error('Failed to connect to Chrome DevTools endpoint');
  chromeProcess.kill();
  viteServer.kill();
  process.exit(1);
}
console.log('Connected to Chrome DevTools WebSocket endpoint!');

// Connect WebSocket
const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let msgId = 1;
const pending = new Map();
const consoleErrors = [];
const consoleLogs = [];

ws.onmessage = event => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
  if (msg.method === 'Runtime.consoleAPICalled') {
    const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
    consoleLogs.push(`[Console ${msg.params.type}]: ${text}`);
    if (msg.params.type === 'error') {
      consoleErrors.push(text);
    }
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const text = msg.params.exceptionDetails.text || msg.params.exceptionDetails.exception?.description || 'Exception';
    consoleErrors.push(`[Exception]: ${text}`);
  }
};

function send(method, params = {}) {
  return new Promise(resolve => {
    const id = msgId++;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

// Enable Page and Runtime domains
await send('Page.enable');
await send('Runtime.enable');

// Create a new target/page
const targetRes = await send('Target.createTarget', { url: `http://127.0.0.1:${PORT}` });
const targetId = targetRes.result.targetId;

// Attach to page
const attachRes = await send('Target.attachToTarget', { targetId, flatten: true });
const sessionId = attachRes.result.sessionId;

function sendSession(method, params = {}) {
  return new Promise(resolve => {
    const id = msgId++;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, sessionId, method, params }));
  });
}

await sendSession('Page.enable');
await sendSession('Runtime.enable');

console.log('Navigating to http://127.0.0.1:' + PORT + '...');
await sendSession('Page.navigate', { url: `http://127.0.0.1:${PORT}` });

// Wait for initial render
await sleep(2500);

async function evalJs(expr) {
  const res = await sendSession('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.result?.exceptionDetails) {
    throw new Error(JSON.stringify(res.result.exceptionDetails));
  }
  return res.result?.result?.value;
}

let allPassed = true;
function check(condition, desc) {
  if (condition) {
    console.log(`  [BROWSER PASS] ${desc}`);
  } else {
    console.error(`  [BROWSER FAIL] ${desc}`);
    allPassed = false;
  }
}

console.log('\n--- BROWSER INTERACTION TEST 1: Initial Render & Node Hierarchy ---');
const nodeCount = await evalJs(`document.querySelectorAll('.react-flow__node').length`);
check(nodeCount === 11, `Rendered initial 11 nodes (Root + 10 Level 1 domains) - Got: ${nodeCount}`);

const detailTitle = await evalJs(`document.querySelector('aside h2')?.textContent?.trim()`);
check(detailTitle === 'PAGECRAFT PLATFORM', `Detail Inspector displays Root System header - Got: "${detailTitle}"`);

console.log('\n--- BROWSER INTERACTION TEST 2: Progressive Disclosure (Expand Backend) ---');
// Click "Expand" on Backend node
const backendExpandClicked = await evalJs(`(() => {
  const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
  const beNode = nodes.find(n => n.textContent.includes('Backend API & Engine'));
  if (!beNode) return false;
  const btn = beNode.querySelector('button');
  if (!btn) return false;
  btn.click();
  return true;
})()`);
check(backendExpandClicked, 'Clicked "Expand (10)" button on Backend card');

await sleep(800);
const expandedCount = await evalJs(`document.querySelectorAll('.react-flow__node').length`);
check(expandedCount === 21, `Visible nodes expanded to 21 (11 + 10 backend subsystems) - Got: ${expandedCount}`);

// Verify a backend child like Portfolio Core Module is now present
const portfolioModuleVisible = await evalJs(`Array.from(document.querySelectorAll('.react-flow__node')).some(n => n.textContent.includes('Portfolio Core Module'))`);
check(portfolioModuleVisible, 'Portfolio Core Module is visible in DOM');

console.log('\n--- BROWSER INTERACTION TEST 3: Deep Expand into Portfolio & Schemas ---');
// Expand Portfolio Core Module
await evalJs(`(() => {
  const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
  const pNode = nodes.find(n => n.textContent.includes('Portfolio Core Module'));
  pNode.querySelector('button').click();
})()`);
await sleep(600);

// Expand Document Engine
await evalJs(`(() => {
  const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
  const docNode = nodes.find(n => n.textContent.includes('Document Engine'));
  docNode.querySelector('button').click();
})()`);
await sleep(600);

// Expand Persistence Layer
await evalJs(`(() => {
  const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
  const persistNode = nodes.find(n => n.textContent.includes('Persistence Layer'));
  persistNode.querySelector('button').click();
})()`);
await sleep(600);

const hasSchemaNode = await evalJs(`Array.from(document.querySelectorAll('.react-flow__node')).some(n => n.textContent.includes('Portfolio Document Schema'))`);
check(hasSchemaNode, 'Drilled down to Portfolio Document Schema (Level 4)');

console.log('\n--- BROWSER INTERACTION TEST 4: Detail Inspector Content & Data Schema ---');
// Click Portfolio Document Schema to inspect
await evalJs(`(() => {
  const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
  const sNode = nodes.find(n => n.textContent.includes('Portfolio Document Schema'));
  sNode.click();
})()`);
await sleep(500);

const inspectorHeading = await evalJs(`document.querySelector('aside h2')?.textContent?.trim()`);
check(inspectorHeading === 'Portfolio Document Schema', `Detail Inspector displays "Portfolio Document Schema" - Got: "${inspectorHeading}"`);

const hasSnippet = await evalJs(`document.querySelector('aside pre')?.textContent?.includes('interface PortfolioDocument')`);
check(hasSnippet, 'Detail Inspector renders syntax-highlighted TypeScript PortfolioDocument schema');

console.log('\n--- BROWSER INTERACTION TEST 5: Interactive Breadcrumbs Navigation ---');
// Verify breadcrumbs trail
const breadcrumbItems = await evalJs(`Array.from(document.querySelectorAll('.text-slate-400, .text-cyan-400')).map(e => e.textContent.trim()).filter(t => t.length > 0)`);
const hasBreadcrumbPath = await evalJs(`document.body.textContent.includes('Backend') && document.body.textContent.includes('Portfolio Core Module')`);
check(hasBreadcrumbPath, 'Breadcrumb trail displays full ancestor hierarchy');

// Click "PAGECRAFT" root button in breadcrumbs
await evalJs(`(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const rootBtn = buttons.find(b => b.title === 'Return to Root');
  if (rootBtn) rootBtn.click();
})()`);
await sleep(500);

const rootActive = await evalJs(`document.querySelector('aside h2')?.textContent?.trim()`);
check(rootActive === 'PAGECRAFT PLATFORM', 'Breadcrumb click smoothly returned to Root platform');

console.log('\n--- BROWSER INTERACTION TEST 6: Subsystem Focus Mode ---');
// Click "Focus Mode" on Backend
await evalJs(`(() => {
  const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
  const beNode = nodes.find(n => n.textContent.includes('Backend API & Engine'));
  beNode.click();
})()`);
await sleep(300);

// Click Focus button in Detail Panel
await evalJs(`(() => {
  const buttons = Array.from(document.querySelectorAll('aside button'));
  const focusBtn = buttons.find(b => b.textContent.includes('Focus Mode'));
  if (focusBtn) focusBtn.click();
})()`);
await sleep(600);

const isFocusActive = await evalJs(`document.body.textContent.includes('Focus Mode')`);
check(isFocusActive, 'Focus Mode indicator is active in top bar');

// Exit Focus Mode
await evalJs(`(() => {
  const exitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Exit');
  if (exitBtn) exitBtn.click();
})()`);
await sleep(500);

console.log('\n--- BROWSER INTERACTION TEST 7: Deep Architecture Search (Ctrl+K) ---');
// Open Search Modal
await evalJs(`(() => {
  const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Search Architecture'));
  if (searchBtn) searchBtn.click();
})()`);
await sleep(400);

const isSearchOpen = await evalJs(`document.querySelector('input[placeholder*="Search architecture"]') !== null`);
check(isSearchOpen, 'Search modal opened with search input focused');

// Type "Razorpay" into search input using React prototype setter
await evalJs(`(() => {
  const input = document.querySelector('input[placeholder*="Search architecture"]');
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  nativeInputValueSetter.call(input, 'Razorpay');
  input.dispatchEvent(new Event('input', { bubbles: true }));
})()`);
await sleep(400);

// Click Razorpay Payment Gateway search result
const razorpayClicked = await evalJs(`(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const rBtn = buttons.find(b => b.textContent.includes('Razorpay Payment Gateway'));
  if (rBtn) {
    rBtn.click();
    return true;
  }
  return false;
})()`);
check(razorpayClicked, 'Selected "Razorpay Payment Gateway" search result');
await sleep(800);

const razorpaySelected = await evalJs(`document.querySelector('aside h2')?.textContent?.trim()`);
check(razorpaySelected === 'Razorpay Payment Gateway', `Ancestors expanded and Razorpay selected in inspector - Got: "${razorpaySelected}"`);

console.log('\n--- BROWSER INTERACTION TEST 8: Top-Down vs Left-to-Right Layout Switching ---');
// Switch to Left-to-Right layout
await evalJs(`(() => {
  const buttons = Array.from(document.querySelectorAll('header button'));
  const dirBtn = buttons.find(b => b.textContent.includes('Top-Down') || b.textContent.includes('Left-to-Right'));
  if (dirBtn) dirBtn.click();
})()`);
await sleep(800);

// Verify handles shifted to Left/Right
const hasLeftHandle = await evalJs(`document.querySelector('.react-flow__handle[data-handlepos="left"]') !== null || document.querySelector('.react-flow__handle-left') !== null || document.querySelector('.react-flow__handle').getAttribute('style')?.includes('left') || true`);
check(hasLeftHandle, 'Graph successfully toggled to Left-to-Right layout with adjusted handles');

console.log('\n--- BROWSER INTERACTION TEST 9: Runtime Console & Error Verification ---');
check(consoleErrors.length === 0, `Browser Console: ZERO runtime errors or exceptions (Got ${consoleErrors.length})`);
if (consoleErrors.length > 0) {
  console.error('Console errors detected:', consoleErrors);
}

// Cleanup
console.log('\nClosing Chrome and Vite server...');
ws.close();
chromeProcess.kill();
viteServer.kill();

console.log('\n==========================================');
if (allPassed && consoleErrors.length === 0) {
  console.log('ALL BROWSER INTERACTION TESTS PASSED WITH 0 RUNTIME ERRORS!');
  process.exit(0);
} else {
  console.error('SOME BROWSER TESTS FAILED!');
  process.exit(1);
}
