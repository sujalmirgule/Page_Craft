import mongoose from 'mongoose';
import {
  User,
  Workspace,
  Portfolio,
  ShowcaseTemplate,
  AuditLog,
  Analytics,
} from '../apps/api/src/models/index';
import {
  isDatabaseConnected,
  getDatabaseConnectionState,
} from '../apps/api/src/database/index';
import { createStarterPortfolio, CURRENT_SCHEMA_VERSION } from '@pagecraft/schema';

console.log('=== PAGECRAFT PHASE 2: DATABASE & CORE MODELS VERIFICATION ===\n');

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

async function validateCatch(doc) {
  try {
    await doc.validate();
    return null;
  } catch (err) {
    return err;
  }
}

async function runTests() {
  // ----------------------------------------------------
  // Test 1: Model Registration & Collections
  // ----------------------------------------------------
  console.log('Test 1: Mongoose Models & Collection Mapping');
  check(User.collection.name === 'users', 'User model maps to "users" collection');
  check(Workspace.collection.name === 'workspaces', 'Workspace model maps to "workspaces" collection');
  check(Portfolio.collection.name === 'portfolios', 'Portfolio model maps to "portfolios" collection');
  check(ShowcaseTemplate.collection.name === 'showcase_templates', 'ShowcaseTemplate model maps to "showcase_templates" collection');
  check(AuditLog.collection.name === 'audit_logs', 'AuditLog model maps to "audit_logs" collection');
  check(Analytics.collection.name === 'analytics', 'Analytics model maps to "analytics" collection');

  // ----------------------------------------------------
  // Test 2: User Model Validation & Data Security
  // ----------------------------------------------------
  console.log('\nTest 2: User Model Schema & Security');
  const validUser = new User({
    email: 'creator@pagecraft.app',
    passwordHash: '$2b$10$hashed_password_sample_string_min_8',
    name: 'Alex Morgan',
    plan: 'pro',
    role: 'user',
  });
  const userValErr = await validateCatch(validUser);
  check(!userValErr, 'Valid user document passes validation');

  // Password select: false check
  const passwordHashField = User.schema.path('passwordHash');
  check(passwordHashField.options.select === false, 'passwordHash path has select: false to protect credentials');

  // toJSON serialization cleans password
  const serialized = validUser.toJSON();
  check(serialized.passwordHash === undefined, 'toJSON removes passwordHash from output');
  check(serialized.email === 'creator@pagecraft.app', 'toJSON preserves public profile attributes');

  // Invalid email rejection
  const invalidUser = new User({
    email: 'not-an-email',
    name: 'Test',
  });
  const invalidUserErr = await validateCatch(invalidUser);
  check(!!invalidUserErr?.errors?.email, 'Rejects invalid email format');

  // Missing required fields rejection
  const emptyUser = new User({});
  const emptyUserErr = await validateCatch(emptyUser);
  check(!!emptyUserErr?.errors?.email && !!emptyUserErr?.errors?.name, 'Rejects user missing email and name');

  // Roles enum check
  const adminUser = new User({
    email: 'superadmin@pagecraft.app',
    name: 'Super Admin',
    role: 'super_admin',
  });
  check(!(await validateCatch(adminUser)), 'Accepts super_admin role');

  // ----------------------------------------------------
  // Test 3: Workspace Model & Multi-Tenancy
  // ----------------------------------------------------
  console.log('\nTest 3: Workspace Model & Multi-Tenancy');
  const ownerId = new mongoose.Types.ObjectId();
  const memberId = new mongoose.Types.ObjectId();

  const validWorkspace = new Workspace({
    name: 'Design Studio Lab',
    slug: 'design-studio-lab',
    ownerId,
    members: [
      { userId: ownerId, role: 'owner', joinedAt: new Date() },
      { userId: memberId, role: 'editor', joinedAt: new Date() },
    ],
  });
  check(!(await validateCatch(validWorkspace)), 'Valid workspace passes validation');

  // Slug regex validation
  const invalidWs = new Workspace({
    name: 'Bad Slug',
    slug: 'INVALID SLUG WITH SPACES',
    ownerId,
  });
  const invalidWsErr = await validateCatch(invalidWs);
  check(!!invalidWsErr?.errors?.slug, 'Rejects workspace with non-kebab-case slug');

  // Member helper methods
  check(validWorkspace.hasMember(memberId) === true, 'hasMember() identifies member');
  check(validWorkspace.hasMember(new mongoose.Types.ObjectId()) === false, 'hasMember() returns false for non-member');
  check(validWorkspace.getMemberRole(ownerId) === 'owner', 'getMemberRole() returns "owner"');
  check(validWorkspace.getMemberRole(memberId) === 'editor', 'getMemberRole() returns "editor"');

  // ----------------------------------------------------
  // Test 4: Portfolio Model & Nested Polymorphic Blocks
  // ----------------------------------------------------
  console.log('\nTest 4: Portfolio Model & Polymorphic Block Validation');
  const starter = createStarterPortfolio(ownerId.toString(), validWorkspace._id.toString(), 'alex-portfolio');

  const portfolioDoc = new Portfolio({
    schemaVersion: starter.schemaVersion,
    ownerId,
    workspaceId: validWorkspace._id,
    slug: starter.slug,
    title: starter.title,
    isPublished: false,
    settings: starter.settings,
    seo: starter.seo,
    theme: starter.theme,
    navigation: starter.navigation,
    pages: starter.pages,
  });
  check(!(await validateCatch(portfolioDoc)), 'Full starter portfolio document passes Mongoose schema validation');

  // Missing required fields
  const badPortfolio = new Portfolio({
    title: 'Missing Slug and Owners',
  });
  const badPortErr = await validateCatch(badPortfolio);
  check(!!badPortErr?.errors?.slug, 'Rejects portfolio missing slug');
  check(!!badPortErr?.errors?.ownerId, 'Rejects portfolio missing ownerId');
  check(!!badPortErr?.errors?.workspaceId, 'Rejects portfolio missing workspaceId');

  // Polymorphic block content validation
  const invalidBlockPortfolio = new Portfolio({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ownerId,
    workspaceId: validWorkspace._id,
    slug: 'invalid-block-test',
    title: 'Invalid Block Test',
    pages: [
      {
        id: 'page-1',
        slug: '',
        title: 'Home',
        isHomePage: true,
        blocks: [
          {
            id: 'b-bad',
            type: 'header',
            order: 0,
            padding: { top: 40, bottom: 40 },
            hidden: false,
            content: {
              // Missing required fullName
              headline: 'Engineer',
            },
          },
        ],
      },
    ],
  });
  const blockErr = await validateCatch(invalidBlockPortfolio);
  check(!!blockErr, 'Rejects header block missing required fullName');

  // Custom domain sparse validation
  portfolioDoc.customDomain = {
    domain: 'alexmorgan.dev',
    verified: true,
    sslActive: true,
  };
  check(!(await validateCatch(portfolioDoc)), 'Accepts valid custom domain configuration');

  // ----------------------------------------------------
  // Test 5: Showcase Template Model
  // ----------------------------------------------------
  console.log('\nTest 5: Showcase Template Model');
  const validShowcase = new ShowcaseTemplate({
    title: 'Minimal Developer Portfolio',
    slug: 'minimal-dev-template',
    description: 'Clean, typography-driven portfolio blueprint for full-stack engineers.',
    authorId: ownerId,
    authorName: 'Alex Morgan',
    category: 'software-engineer',
    tags: ['developer', 'react', 'minimal'],
    portfolioSnapshot: starter,
    isFeatured: true,
  });
  check(!(await validateCatch(validShowcase)), 'Valid showcase template passes schema validation');

  const invalidCategoryShowcase = new ShowcaseTemplate({
    title: 'Invalid Category',
    slug: 'invalid-cat',
    description: 'Sample description for testing',
    authorId: ownerId,
    authorName: 'Test Author',
    category: 'unsupported-category',
    portfolioSnapshot: starter,
  });
  const invalidCatErr = await validateCatch(invalidCategoryShowcase);
  check(!!invalidCatErr?.errors?.category, 'Rejects unsupported showcase category enum');

  // ----------------------------------------------------
  // Test 6: Audit Log Model (Immutability & Audit Trail)
  // ----------------------------------------------------
  console.log('\nTest 6: Audit Log Model');
  const validAudit = new AuditLog({
    userId: ownerId,
    workspaceId: validWorkspace._id,
    action: 'portfolio:publish',
    targetEntity: 'Portfolio',
    targetId: portfolioDoc._id.toString(),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 Chrome/120',
    status: 'success',
    diff: { before: { isPublished: false }, after: { isPublished: true } },
  });
  check(!(await validateCatch(validAudit)), 'Valid audit log record passes validation');

  const emptyAudit = new AuditLog({});
  const emptyAuditErr = await validateCatch(emptyAudit);
  check(
    !!emptyAuditErr?.errors?.action && !!emptyAuditErr?.errors?.targetEntity && !!emptyAuditErr?.errors?.targetId,
    'Rejects audit log missing action, targetEntity, or targetId'
  );

  // ----------------------------------------------------
  // Test 7: Analytics Rollup Model
  // ----------------------------------------------------
  console.log('\nTest 7: Analytics Rollup Model');
  const validAnalytics = new Analytics({
    portfolioId: portfolioDoc._id,
    date: '2026-11-22',
    views: 1420,
    uniqueVisitors: 890,
    referrers: [
      { source: 'github.com', count: 620 },
      { source: 'linkedin.com', count: 480 },
    ],
    countries: [
      { country: 'US', count: 700 },
      { country: 'IN', count: 450 },
    ],
    devices: { desktop: 900, mobile: 480, tablet: 40 },
  });
  check(!(await validateCatch(validAnalytics)), 'Valid analytics daily record passes validation');

  const invalidDateAnalytics = new Analytics({
    portfolioId: portfolioDoc._id,
    date: '22-11-2026', // Bad format (must be YYYY-MM-DD)
  });
  const invalidDateErr = await validateCatch(invalidDateAnalytics);
  check(!!invalidDateErr?.errors?.date, 'Rejects analytics date not formatted as YYYY-MM-DD');

  // ----------------------------------------------------
  // Test 8: Index Definitions
  // ----------------------------------------------------
  console.log('\nTest 8: Database Index Definitions');

  function hasIndex(model, keyPattern) {
    const indexes = model.schema.indexes();
    return indexes.some(([fields]) => {
      const keys = Object.keys(keyPattern);
      return keys.every((k) => fields[k] === keyPattern[k]);
    });
  }

  // User indexes
  check(User.schema.path('email').options.unique === true, 'User email has unique index constraint');

  // Workspace indexes
  check(hasIndex(Workspace, { ownerId: 1 }), 'Workspace has index on { ownerId: 1 }');
  check(hasIndex(Workspace, { 'members.userId': 1 }), 'Workspace has index on { "members.userId": 1 }');

  // Portfolio indexes
  check(hasIndex(Portfolio, { ownerId: 1 }), 'Portfolio has index on { ownerId: 1 }');
  check(hasIndex(Portfolio, { workspaceId: 1 }), 'Portfolio has index on { workspaceId: 1 }');
  check(hasIndex(Portfolio, { isPublished: 1, slug: 1 }), 'Portfolio has compound index on { isPublished: 1, slug: 1 }');

  // Analytics indexes
  check(hasIndex(Analytics, { portfolioId: 1, date: -1 }), 'Analytics has compound index on { portfolioId: 1, date: -1 }');

  // Audit log indexes
  check(hasIndex(AuditLog, { userId: 1, createdAt: -1 }), 'AuditLog has compound index on { userId: 1, createdAt: -1 }');
  check(hasIndex(AuditLog, { workspaceId: 1, createdAt: -1 }), 'AuditLog has compound index on { workspaceId: 1, createdAt: -1 }');

  // ----------------------------------------------------
  // Test 9: Relationship References
  // ----------------------------------------------------
  console.log('\nTest 9: Relationship Reference Target Definitions');
  check(Workspace.schema.path('ownerId').options.ref === 'User', 'Workspace.ownerId references User model');
  check(
    Workspace.schema.path('members').schema.path('userId').options.ref === 'User',
    'Workspace.members.userId references User model'
  );
  check(Portfolio.schema.path('ownerId').options.ref === 'User', 'Portfolio.ownerId references User model');
  check(Portfolio.schema.path('workspaceId').options.ref === 'Workspace', 'Portfolio.workspaceId references Workspace model');
  check(ShowcaseTemplate.schema.path('authorId').options.ref === 'User', 'ShowcaseTemplate.authorId references User model');
  check(Analytics.schema.path('portfolioId').options.ref === 'Portfolio', 'Analytics.portfolioId references Portfolio model');
  check(AuditLog.schema.path('userId').options.ref === 'User', 'AuditLog.userId references User model');
  check(AuditLog.schema.path('workspaceId').options.ref === 'Workspace', 'AuditLog.workspaceId references Workspace model');

  // ----------------------------------------------------
  // Test 10: Connection Manager State
  // ----------------------------------------------------
  console.log('\nTest 10: Connection Manager State API');
  check(typeof isDatabaseConnected === 'function', 'isDatabaseConnected function is exported');
  check(typeof getDatabaseConnectionState === 'function', 'getDatabaseConnectionState function is exported');
  check(['disconnected', 'connected', 'connecting', 'disconnecting'].includes(getDatabaseConnectionState()), 'Connection state returns valid lifecycle status');

  console.log('\n==========================================');
  console.log(`PHASE 2 TEST RESULTS: ${pass} PASSED, ${fail} FAILED`);
  console.log('==========================================');

  if (fail > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running Phase 2 tests:', err);
  process.exit(1);
});
