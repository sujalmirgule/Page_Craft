import mongoose from 'mongoose';
import {
  PortfolioCreateValidator,
  PortfolioUpdateValidator,
  isReservedSlug,
  RESERVED_SLUGS,
} from '../packages/validation/src/index';
import { can } from '../packages/permissions/src/index';
import { createStarterPortfolio } from '../packages/schema/src/index';
import { Portfolio, Workspace, User } from '../apps/api/src/models/index';
import { createPortfolioRouter } from '../apps/api/src/routes/portfolio.routes';
import { createApp } from '../apps/api/src/app';

console.log('=== PAGECRAFT PHASE 4 — MILESTONE 4.1: PORTFOLIO ENGINE VERIFICATION ===\n');

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

const JWT_ACCESS_SECRET = 'test_jwt_access_secret_32_characters_minimum';

function createMockReqRes(user, params = {}, body = {}, query = {}) {
  let statusCode = 200;
  let jsonBody = null;
  const req = {
    user,
    params,
    body,
    query,
    headers: {},
    cookies: {},
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonBody = data;
      return this;
    },
  };
  return { req, res, getStatus: () => statusCode, getBody: () => jsonBody };
}

async function runTests() {
  // ----------------------------------------------------
  // Test 1: Validation & Reserved Slugs
  // ----------------------------------------------------
  console.log('Test 1: Reserved Slugs & Zod Validation');
  check(isReservedSlug('api') === true, 'Slug "api" is identified as reserved');
  check(isReservedSlug('AUTH') === true, 'Slug "AUTH" (case insensitive) is identified as reserved');
  check(isReservedSlug('admin') === true, 'Slug "admin" is reserved');
  check(isReservedSlug('dashboard') === true, 'Slug "dashboard" is reserved');
  check(isReservedSlug('settings') === true, 'Slug "settings" is reserved');
  check(isReservedSlug('my-custom-portfolio') === false, 'Slug "my-custom-portfolio" is NOT reserved');
  check(RESERVED_SLUGS.length >= 15, `Reserved slug list contains ${RESERVED_SLUGS.length} system routes`);

  const validCreatePayload = {
    workspaceId: new mongoose.Types.ObjectId().toString(),
    title: 'Developer Portfolio',
    slug: 'alex-morgan',
  };
  check(PortfolioCreateValidator.safeParse(validCreatePayload).success, 'PortfolioCreateValidator accepts valid payload');

  const invalidSlugPayload = {
    ...validCreatePayload,
    slug: 'invalid slug with spaces!',
  };
  check(!PortfolioCreateValidator.safeParse(invalidSlugPayload).success, 'PortfolioCreateValidator rejects slug with special characters');

  const shortSlugPayload = {
    ...validCreatePayload,
    slug: 'ab',
  };
  check(!PortfolioCreateValidator.safeParse(shortSlugPayload).success, 'PortfolioCreateValidator rejects slug shorter than 3 characters');

  // ----------------------------------------------------
  // Test 2: RBAC Permissions for Portfolios
  // ----------------------------------------------------
  console.log('\nTest 2: RBAC Matrix Permissions for Portfolios');
  check(can('owner', 'portfolio:create') === true, 'Owner has "portfolio:create" permission');
  check(can('owner', 'portfolio:read') === true, 'Owner has "portfolio:read" permission');
  check(can('owner', 'portfolio:update') === true, 'Owner has "portfolio:update" permission');
  check(can('owner', 'portfolio:delete') === true, 'Owner has "portfolio:delete" permission');

  check(can('editor', 'portfolio:create') === true, 'Editor has "portfolio:create" permission');
  check(can('editor', 'portfolio:read') === true, 'Editor has "portfolio:read" permission');
  check(can('editor', 'portfolio:update') === true, 'Editor has "portfolio:update" permission');
  check(can('editor', 'portfolio:delete') === false, 'Editor CANNOT "portfolio:delete" (Restricted to Owner)');

  check(can('viewer', 'portfolio:read') === true, 'Viewer has "portfolio:read" permission');
  check(can('viewer', 'portfolio:create') === false, 'Viewer CANNOT "portfolio:create"');
  check(can('viewer', 'portfolio:update') === false, 'Viewer CANNOT "portfolio:update"');
  check(can('viewer', 'portfolio:delete') === false, 'Viewer CANNOT "portfolio:delete"');

  // ----------------------------------------------------
  // Test 3: Starter Portfolio Generation
  // ----------------------------------------------------
  console.log('\nTest 3: Starter Portfolio Document Structure');
  const starter = createStarterPortfolio('user-1', 'ws-1', 'my-portfolio');
  check(starter.schemaVersion === 1, 'Starter portfolio schemaVersion is 1');
  check(starter.pages.length === 1, 'Starter portfolio has initial Home page');
  check(starter.pages[0].isHomePage === true, 'Initial page is marked isHomePage: true');
  check(starter.pages[0].blocks.length === 6, 'Starter home page contains 6 starter blocks');
  check(starter.theme.fontFamily === 'Inter', 'Starter portfolio has default theme configured');
  check(starter.navigation.links.length === 1, 'Starter navigation contains home link');

  // ----------------------------------------------------
  // Test 4: Workspace & Portfolio Mock Setup
  // ----------------------------------------------------
  console.log('\nTest 4: Portfolio Route Handlers & Authorization');
  const uOwnerId = new mongoose.Types.ObjectId();
  const uEditorId = new mongoose.Types.ObjectId();
  const uViewerId = new mongoose.Types.ObjectId();
  const uStrangerId = new mongoose.Types.ObjectId();
  const workspaceId = new mongoose.Types.ObjectId();

  const mockWorkspace = new Workspace({
    _id: workspaceId,
    name: 'Engineering Workspace',
    slug: 'eng-workspace',
    ownerId: uOwnerId,
    members: [
      { userId: uOwnerId, role: 'owner', joinedAt: new Date() },
      { userId: uEditorId, role: 'editor', joinedAt: new Date() },
      { userId: uViewerId, role: 'viewer', joinedAt: new Date() },
    ],
  });

  const portfolioId = new mongoose.Types.ObjectId();
  const mockPortfolio = new Portfolio({
    _id: portfolioId,
    schemaVersion: 1,
    ownerId: uOwnerId,
    workspaceId: workspaceId,
    slug: 'eng-portfolio',
    title: 'Engineering Portfolio',
    isPublished: false,
    pages: starter.pages,
    theme: starter.theme,
    seo: starter.seo,
    settings: starter.settings,
    navigation: starter.navigation,
  });

  // Stubs for Workspace and Portfolio
  const origWsFindById = Workspace.findById;
  const origPortFindById = Portfolio.findById;
  const origPortFindBySlug = Portfolio.findBySlug;
  const origPortFindOne = Portfolio.findOne;
  const origPortFindByWorkspace = Portfolio.findByWorkspace;
  const origPortFind = Portfolio.find;
  const origWsFindByUser = Workspace.findByUser;
  const origPortFindByIdAndDelete = Portfolio.findByIdAndDelete;

  Workspace.findById = async (id) => {
    if (id?.toString() === workspaceId.toString()) return mockWorkspace;
    return null;
  };

  Portfolio.findById = async (id) => {
    if (id?.toString() === portfolioId.toString()) return mockPortfolio;
    return null;
  };

  Portfolio.findBySlug = async (slug) => {
    if (slug === 'eng-portfolio') return mockPortfolio;
    return null;
  };

  Portfolio.findOne = async (query) => {
    if (query?.slug === 'eng-portfolio') return mockPortfolio;
    return null;
  };

  Portfolio.findByWorkspace = async (wsId) => {
    if (wsId?.toString() === workspaceId.toString()) return [mockPortfolio];
    return [];
  };

  Workspace.findByUser = async (uId) => {
    if ([uOwnerId.toString(), uEditorId.toString(), uViewerId.toString()].includes(uId.toString())) {
      return [mockWorkspace];
    }
    return [];
  };

  Portfolio.find = (query) => {
    const pList = [mockPortfolio];
    return {
      sort: () => Promise.resolve(pList),
    };
  };

  let deletedId = null;
  Portfolio.findByIdAndDelete = async (id) => {
    deletedId = id?.toString();
    return mockPortfolio;
  };

  const router = createPortfolioRouter(JWT_ACCESS_SECRET);
  check(typeof router === 'function', 'createPortfolioRouter creates Express router instance');

  // Extract handlers from router stack
  // Stack layers: 0: auth, 1: POST /, 2: GET /, 3: GET /:id, 4: PATCH /:id, 5: DELETE /:id
  const postHandler = router.stack.find(
    (l) => l.route && l.route.path === '/' && l.route.methods.post
  );
  const getListHandler = router.stack.find(
    (l) => l.route && l.route.path === '/' && l.route.methods.get
  );
  const getSingleHandler = router.stack.find(
    (l) => l.route && l.route.path === '/:id' && l.route.methods.get
  );
  const patchHandler = router.stack.find(
    (l) => l.route && l.route.path === '/:id' && l.route.methods.patch
  );
  const deleteHandler = router.stack.find(
    (l) => l.route && l.route.path === '/:id' && l.route.methods.delete
  );

  check(!!postHandler, 'POST / route is registered');
  check(!!getListHandler, 'GET / route is registered');
  check(!!getSingleHandler, 'GET /:id route is registered');
  check(!!patchHandler, 'PATCH /:id route is registered');
  check(!!deleteHandler, 'DELETE /:id route is registered');

  // ----------------------------------------------------
  // Test 5: POST /api/v1/portfolios (Creation tests)
  // ----------------------------------------------------
  console.log('\nTest 5: POST /api/v1/portfolios Creation & Access Control');

  // 5.1 Invalid Workspace ID format
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      {},
      { workspaceId: 'invalid-ws-id', title: 'Test', slug: 'my-test-port' }
    );
    // Execute inner route handler (last in stack.route.stack)
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 400, 'Rejects invalid workspace ObjectId with 400');
    check(getBody()?.error?.code === 'INVALID_ID', 'Returns INVALID_ID code');
  }

  // 5.2 Reserved Slug Rejection
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      {},
      { workspaceId: workspaceId.toString(), title: 'Admin Site', slug: 'admin' }
    );
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 400, 'Rejects reserved slug "admin" with 400');
    check(getBody()?.error?.code === 'RESERVED_SLUG', 'Returns RESERVED_SLUG code');
  }

  // 5.3 Duplicate Slug Rejection
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      {},
      { workspaceId: workspaceId.toString(), title: 'Engineering Site', slug: 'eng-portfolio' }
    );
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 409, 'Rejects duplicate slug with 409');
    check(getBody()?.error?.code === 'SLUG_IN_USE', 'Returns SLUG_IN_USE code');
  }

  // 5.4 Cross-Tenant Creation Rejection (Stranger)
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uStrangerId.toString(), role: 'user' },
      {},
      { workspaceId: workspaceId.toString(), title: 'Stranger Port', slug: 'stranger-port' }
    );
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 403, 'Rejects stranger from creating portfolio in target workspace (403)');
    check(getBody()?.error?.code === 'FORBIDDEN', 'Returns FORBIDDEN code for stranger');
  }

  // 5.5 Viewer Role Creation Rejection
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      {},
      { workspaceId: workspaceId.toString(), title: 'Viewer Port', slug: 'viewer-port' }
    );
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 403, 'Rejects viewer role from creating portfolio (403)');
    check(getBody()?.error?.code === 'INSUFFICIENT_PERMISSIONS', 'Returns INSUFFICIENT_PERMISSIONS code for viewer');
  }

  // 5.6 Owner/Editor Successful Creation
  {
    let savedDoc = null;
    const origSave = Portfolio.prototype.save;
    Portfolio.prototype.save = async function () {
      savedDoc = this;
      return this;
    };

    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      {},
      { workspaceId: workspaceId.toString(), title: 'New Alex Morgan Portfolio', slug: 'alex-brand-new' }
    );
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 201, 'Owner successfully creates portfolio (201)');
    check(getBody()?.success === true, 'Returns success: true');
    check(savedDoc?.slug === 'alex-brand-new', 'Persists normalized slug');
    check(savedDoc?.pages?.length === 1, 'Initializes with 1 starter home page');
    check(savedDoc?.pages[0]?.blocks?.length === 6, 'Initializes with 6 default blocks');

    Portfolio.prototype.save = origSave;
  }

  // ----------------------------------------------------
  // Test 6: GET /api/v1/portfolios (Listing tests)
  // ----------------------------------------------------
  console.log('\nTest 6: GET /api/v1/portfolios Listing & Workspace Filtering');

  // 6.1 List by WorkspaceId for authorized member
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      {},
      {},
      { workspaceId: workspaceId.toString() }
    );
    const handler = getListHandler.route.stack[0].handle;
    await handler(req, res);
    check(getStatus() === 200, 'Member can list portfolios by workspaceId (200)');
    check(Array.isArray(getBody()?.data), 'Returns array of portfolios');
    check(getBody()?.data?.length === 1, 'Returns 1 portfolio in test workspace');
  }

  // 6.2 List by WorkspaceId for stranger
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uStrangerId.toString(), role: 'user' },
      {},
      {},
      { workspaceId: workspaceId.toString() }
    );
    const handler = getListHandler.route.stack[0].handle;
    await handler(req, res);
    check(getStatus() === 403, 'Stranger is forbidden from querying workspace portfolios (403)');
    check(getBody()?.error?.code === 'FORBIDDEN', 'Returns FORBIDDEN code');
  }

  // 6.3 List across all user workspaces (no query param)
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      {},
      {},
      {}
    );
    const handler = getListHandler.route.stack[0].handle;
    await handler(req, res);
    check(getStatus() === 200, 'User can list portfolios across all their accessible workspaces');
    check(Array.isArray(getBody()?.data), 'Returns portfolios array');
  }

  // ----------------------------------------------------
  // Test 7: GET /api/v1/portfolios/:id (Read Single)
  // ----------------------------------------------------
  console.log('\nTest 7: GET /api/v1/portfolios/:id Access Control');

  // 7.1 Read single portfolio as Owner/Editor/Viewer (Guarded by requirePortfolioAccess)
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      { id: portfolioId.toString() }
    );
    // Execute middleware chain on route: stack[0] is requirePortfolioAccess, stack[1] is handler
    const guard = getSingleHandler.route.stack[0].handle;
    const handler = getSingleHandler.route.stack[1].handle;
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(nextCalled && getStatus() === 200, 'Viewer passes requirePortfolioAccess("portfolio:read")');
    if (nextCalled) {
      handler(req, res);
      check(getStatus() === 200, 'Viewer successfully receives portfolio data');
      check(getBody()?.data?.title === 'Engineering Portfolio', 'Matches portfolio title');
    }
  }

  // 7.2 Read single portfolio as Stranger
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uStrangerId.toString(), role: 'user' },
      { id: portfolioId.toString() }
    );
    const guard = getSingleHandler.route.stack[0].handle;
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Stranger cannot read single portfolio (403)');
    check(getBody()?.error?.code === 'FORBIDDEN', 'Returns FORBIDDEN code for stranger');
  }

  // ----------------------------------------------------
  // Test 8: PATCH /api/v1/portfolios/:id (Update)
  // ----------------------------------------------------
  console.log('\nTest 8: PATCH /api/v1/portfolios/:id Metadata Mutation & Safety');

  // 8.1 Viewer cannot update portfolio
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      { id: portfolioId.toString() },
      { title: 'New Viewer Title' }
    );
    const guard = patchHandler.route.stack[0].handle;
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Viewer cannot update portfolio (403)');
    check(getBody()?.error?.code === 'INSUFFICIENT_PERMISSIONS', 'Returns INSUFFICIENT_PERMISSIONS for viewer update');
  }

  // 8.2 Editor can update portfolio metadata
  {
    const testDoc = new Portfolio({
      _id: portfolioId,
      schemaVersion: 1,
      ownerId: uOwnerId,
      workspaceId: workspaceId,
      slug: 'eng-portfolio',
      title: 'Original Title',
      pages: starter.pages,
      theme: starter.theme,
      seo: starter.seo,
      settings: starter.settings,
      navigation: starter.navigation,
    });
    let saveRan = false;
    testDoc.save = async function () {
      saveRan = true;
      return this;
    };

    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { id: portfolioId.toString() },
      {
        title: 'Updated Engineering Portfolio',
        seo: { metaTitle: 'New SEO Title' },
        theme: { darkMode: false },
      }
    );
    req.portfolio = testDoc;

    const handler = patchHandler.route.stack[patchHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 200, 'Editor successfully updates portfolio metadata (200)');
    check(saveRan === true, 'Document save() was called');
    check(testDoc.title === 'Updated Engineering Portfolio', 'Title updated');
    check(testDoc.seo.metaTitle === 'New SEO Title', 'SEO updated');
    check(testDoc.theme.darkMode === false, 'Theme updated');
    check(testDoc.pages.length === 1, 'Preserves pages intact (no loss of subdocuments)');
    check(testDoc.pages[0].blocks.length === 6, 'Preserves all nested blocks intact');
  }

  // 8.3 Update rejects reserved slug
  {
    const testDoc = new Portfolio({
      _id: portfolioId,
      slug: 'eng-portfolio',
      title: 'Original',
    });
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { id: portfolioId.toString() },
      { slug: 'dashboard' }
    );
    req.portfolio = testDoc;

    const handler = patchHandler.route.stack[patchHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 400, 'Patch rejects updating slug to reserved "dashboard" (400)');
    check(getBody()?.error?.code === 'RESERVED_SLUG', 'Returns RESERVED_SLUG code');
  }

  // ----------------------------------------------------
  // Test 9: DELETE /api/v1/portfolios/:id (Delete & Access Control)
  // ----------------------------------------------------
  console.log('\nTest 9: DELETE /api/v1/portfolios/:id Access Control');

  // 9.1 Editor CANNOT delete portfolio (Restricted to Owner)
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { id: portfolioId.toString() }
    );
    const guard = deleteHandler.route.stack[0].handle;
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Editor cannot delete portfolio (403)');
    check(getBody()?.error?.code === 'INSUFFICIENT_PERMISSIONS', 'Returns INSUFFICIENT_PERMISSIONS for editor delete');
  }

  // 9.2 Viewer CANNOT delete portfolio
  {
    const { req, res, getStatus } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      { id: portfolioId.toString() }
    );
    const guard = deleteHandler.route.stack[0].handle;
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Viewer cannot delete portfolio (403)');
  }

  // 9.3 Workspace Owner can delete portfolio
  {
    deletedId = null;
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      { id: portfolioId.toString() }
    );
    const guard = deleteHandler.route.stack[0].handle;
    const handler = deleteHandler.route.stack[1].handle;

    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(nextCalled && getStatus() === 200, 'Owner passes requirePortfolioAccess("portfolio:delete")');

    if (nextCalled) {
      await handler(req, res);
      check(getStatus() === 200, 'Delete executes successfully (200)');
      check(deletedId === portfolioId.toString(), 'Calls findByIdAndDelete with target portfolio ID');
      check(getBody()?.data?.id === portfolioId.toString(), 'Returns deleted portfolio ID in payload');
    }
  }

  // ----------------------------------------------------
  // Test 10: Express App Router Integration
  // ----------------------------------------------------
  console.log('\nTest 10: Express Application Mounting & Route Table');
  const app = createApp({
    jwtAccessSecret: JWT_ACCESS_SECRET,
    jwtRefreshSecret: 'refresh_secret_32_characters_minimum',
  });

  const hasPortfolios = app._router.stack.some(
    (layer) => layer.regexp && layer.regexp.test('/api/v1/portfolios')
  );
  check(hasPortfolios, 'Portfolio router mounted at /api/v1/portfolios in main Express app');

  // Restore stubs
  Workspace.findById = origWsFindById;
  Portfolio.findById = origPortFindById;
  Portfolio.findBySlug = origPortFindBySlug;
  Portfolio.findOne = origPortFindOne;
  Portfolio.findByWorkspace = origPortFindByWorkspace;
  Portfolio.find = origPortFind;
  Workspace.findByUser = origWsFindByUser;
  Portfolio.findByIdAndDelete = origPortFindByIdAndDelete;

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log(`\n====================================================`);
  console.log(`Total checks: ${pass + fail} | Passed: ${pass} | Failed: ${fail}`);
  console.log(`====================================================\n`);

  if (fail > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
