import { CURRENT_SCHEMA_VERSION, SUPPORTED_BLOCK_TYPES, createStarterPortfolio } from '@pagecraft/schema';
import { can, assertPermission } from '@pagecraft/permissions';
import { generateThemeCssVariables, COLOR_PALETTE_PRESETS } from '@pagecraft/theme-engine';
import { reorderBlocks, generateSnapshotFingerprint } from '@pagecraft/document-engine';
import { BlockSchemaValidator, UserRegisterValidator, PortfolioDocumentValidator } from '@pagecraft/validation';
import { ApiEnvSchema, validateEnv } from '@pagecraft/config';

console.log('=== PAGECRAFT PHASE 1: MONOREPO FOUNDATION VERIFICATION ===\n');

let pass = 0;
let fail = 0;

function check(condition, desc) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    pass++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    fail++;
  }
}

// 1. Schema & Templates
console.log('Test 1: Schema Package & Starter Templates');
check(CURRENT_SCHEMA_VERSION === 1, 'Current schema version is 1');
check(SUPPORTED_BLOCK_TYPES.length === 6, 'Contains exactly 6 supported polymorphic block types');
const starter = createStarterPortfolio('u1', 'w1', 'alex-dev');
check(starter.pages.length === 1, 'Starter portfolio contains 1 Home page');
check(starter.pages[0].blocks.length === 6, 'Starter portfolio has 6 initial section blocks');

// 2. Validation Package
console.log('\nTest 2: Validation Package & Runtime Contracts');
const validHeader = starter.pages[0].blocks[0];
const headerValResult = BlockSchemaValidator.safeParse(validHeader);
check(headerValResult.success, 'BlockSchemaValidator successfully validates polymorphic header block');

const invalidBlock = { id: 'b1', type: 'header', order: 0, padding: { top: 0, bottom: 0 }, hidden: false, content: {} };
const invalidResult = BlockSchemaValidator.safeParse(invalidBlock);
check(!invalidResult.success, 'BlockSchemaValidator rejects header block missing required fields');

const docResult = PortfolioDocumentValidator.safeParse(starter);
check(docResult.success, 'PortfolioDocumentValidator successfully validates complete starter portfolio');

const userValid = UserRegisterValidator.safeParse({ email: 'alex@example.com', password: 'securePassword123', name: 'Alex' });
check(userValid.success, 'UserRegisterValidator accepts valid credentials');

// 3. Permissions Package (RBAC)
console.log('\nTest 3: RBAC & Permissions Engine');
check(can('owner', 'portfolio:delete') === true, 'Owner has permission to delete portfolio');
check(can('editor', 'portfolio:delete') === false, 'Editor cannot delete portfolio');
check(can('editor', 'portfolio:update') === true, 'Editor has permission to update portfolio');
check(can('viewer', 'portfolio:update') === false, 'Viewer cannot update portfolio');
check(can('viewer', 'portfolio:read') === true, 'Viewer can read portfolio');
check(can('admin', 'admin:override') === true, 'Admin can execute admin overrides');

// 4. Theme Engine
console.log('\nTest 4: Theme Engine & CSS Variables');
const cssVars = generateThemeCssVariables(starter.theme);
check(typeof cssVars['--pc-color-primary'] === 'string', 'CSS variables contain --pc-color-primary');
check(typeof cssVars['--pc-font-family'] === 'string', 'CSS variables contain --pc-font-family');
check(COLOR_PALETTE_PRESETS.length === 3, 'Theme engine exposes 3 curated color palette presets');

// 5. Document Engine
console.log('\nTest 5: Document Engine (Reordering & Snapshotting)');
const items = [
  { id: '1', order: 0 },
  { id: '2', order: 1 },
  { id: '3', order: 2 }
];
const reordered = reorderBlocks(items, 0, 2);
check(reordered[0].id === '2' && reordered[0].order === 0, 'Reordered item 2 to index 0');
check(reordered[1].id === '3' && reordered[1].order === 1, 'Reordered item 3 to index 1');
check(reordered[2].id === '1' && reordered[2].order === 2, 'Moved item 1 to index 2 with order=2');

const fp1 = generateSnapshotFingerprint(starter);
const fp2 = generateSnapshotFingerprint(starter);
check(fp1 === fp2, 'Snapshot fingerprints are strictly deterministic');

// 6. Environment Validation Foundation
console.log('\nTest 6: Environment Schema Validation');
let envValid = false;
try {
  validateEnv(ApiEnvSchema, {
    NODE_ENV: 'test',
    PORT: 4000,
    MONGODB_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'min_16_characters_secret_test',
    JWT_REFRESH_SECRET: 'min_16_characters_secret_test',
    COOKIE_SECRET: 'min_16_characters_secret_test',
  });
  envValid = true;
} catch {
  envValid = false;
}
check(envValid, 'ApiEnvSchema accepts compliant environment variables');

let envRejected = false;
try {
  validateEnv(ApiEnvSchema, {
    NODE_ENV: 'invalid_mode',
  });
} catch {
  envRejected = true;
}
check(envRejected, 'ApiEnvSchema throws on missing required environment variables');

console.log('\n==========================================');
console.log(`MONOREPO TEST RESULTS: ${pass} PASSED, ${fail} FAILED`);
console.log('==========================================');

if (fail > 0) {
  process.exit(1);
}
