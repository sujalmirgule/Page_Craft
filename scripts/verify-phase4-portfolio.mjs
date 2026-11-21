import mongoose from 'mongoose';
import {
  PortfolioCreateValidator,
  PortfolioUpdateValidator,
  isReservedSlug,
  RESERVED_SLUGS,
  BlockSchemaValidator,
  PortfolioDocumentValidator,
} from '../packages/validation/src/index';
import { can } from '../packages/permissions/src/index';
import { createStarterPortfolio } from '../packages/schema/src/index';
import { Portfolio, Workspace, User } from '../apps/api/src/models/index';
import { createPortfolioRouter } from '../apps/api/src/routes/portfolio.routes';
import { createApp } from '../apps/api/src/app';

console.log('=== PAGECRAFT PHASE 4 — MILESTONE 4.1: PORTFOLIO ENGINE AUDIT SUITE ===\n');

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

async function runAudit() {
  // ====================================================
  // AUDIT 1: Validation, Reserved Slugs & Constraints
  // ====================================================
  console.log('Audit 1: Reserved Slugs & Zod Validation');
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

  const longSlugPayload = {
    ...validCreatePayload,
    slug: 'a'.repeat(51),
  };
  check(!PortfolioCreateValidator.safeParse(longSlugPayload).success, 'PortfolioCreateValidator rejects slug exceeding 50 characters');

  // ====================================================
  // AUDIT 2: RBAC Matrix Permissions
  // ====================================================
  console.log('\nAudit 2: RBAC Matrix Permissions for Portfolios');
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

  // ====================================================
  // AUDIT 3: Starter Portfolio Canonical Integrity
  // ====================================================
  console.log('\nAudit 3: Starter Portfolio Canonical Integrity');
  const starter = createStarterPortfolio('user-1', 'ws-1', 'alex-morgan-site');
  check(starter.schemaVersion === 1, 'Starter portfolio schemaVersion is 1');
  check(starter.pages.length === 1, 'Starter portfolio contains exactly 1 initial Home page');
  check(starter.pages[0].isHomePage === true, 'Initial page is flagged isHomePage: true');
  check(starter.pages[0].id === 'page-home', 'Initial page has valid ID "page-home"');
  check(starter.pages[0].blocks.length === 6, 'Starter home page contains exactly 6 starter blocks');

  // Validate each starter block individually against BlockSchemaValidator
  const starterBlockTypes = starter.pages[0].blocks.map((b) => b.type);
  check(
    JSON.stringify(starterBlockTypes) ===
      JSON.stringify(['header', 'about', 'projects', 'skills', 'experience', 'contact']),
    'Starter blocks order matches canonical order: header, about, projects, skills, experience, contact'
  );

  for (const block of starter.pages[0].blocks) {
    const parseResult = BlockSchemaValidator.safeParse(block);
    check(parseResult.success, `Block "${block.type}" (id: ${block.id}) passes BlockSchemaValidator`);
  }

  // Ensure unique block IDs
  const blockIds = starter.pages[0].blocks.map((b) => b.id);
  const uniqueBlockIds = new Set(blockIds);
  check(uniqueBlockIds.size === blockIds.length, 'All starter block IDs are strictly unique');

  // Validate entire starter document against PortfolioDocumentValidator
  const docResult = PortfolioDocumentValidator.safeParse(starter);
  check(docResult.success, 'Complete starter portfolio document passes PortfolioDocumentValidator');

  // ====================================================
  // AUDIT 4: Setup Test Fixtures & Mocks
  // ====================================================
  console.log('\nAudit 4: Router Registration & Setup');
  const uOwnerId = new mongoose.Types.ObjectId();
  const uEditorId = new mongoose.Types.ObjectId();
  const uViewerId = new mongoose.Types.ObjectId();
  const uStrangerId = new mongoose.Types.ObjectId();

  const workspaceAId = new mongoose.Types.ObjectId();
  const workspaceBId = new mongoose.Types.ObjectId();
  const workspaceCId = new mongoose.Types.ObjectId(); // stranger workspace

  const mockWorkspaceA = new Workspace({
    _id: workspaceAId,
    name: 'Workspace Alpha',
    slug: 'ws-alpha',
    ownerId: uOwnerId,
    members: [
      { userId: uOwnerId, role: 'owner', joinedAt: new Date() },
      { userId: uEditorId, role: 'editor', joinedAt: new Date() },
      { userId: uViewerId, role: 'viewer', joinedAt: new Date() },
    ],
  });

  const mockWorkspaceB = new Workspace({
    _id: workspaceBId,
    name: 'Workspace Beta',
    slug: 'ws-beta',
    ownerId: uOwnerId,
    members: [
      { userId: uOwnerId, role: 'owner', joinedAt: new Date() },
      { userId: uEditorId, role: 'editor', joinedAt: new Date() },
    ],
  });

  const mockWorkspaceC = new Workspace({
    _id: workspaceCId,
    name: 'Workspace Gamma',
    slug: 'ws-gamma',
    ownerId: uStrangerId,
    members: [{ userId: uStrangerId, role: 'owner', joinedAt: new Date() }],
  });

  const portfolioAId = new mongoose.Types.ObjectId();
  const portfolioBId = new mongoose.Types.ObjectId();
  const portfolioCId = new mongoose.Types.ObjectId();

  const mockPortfolioA = new Portfolio({
    _id: portfolioAId,
    schemaVersion: 1,
    ownerId: uOwnerId,
    workspaceId: workspaceAId,
    slug: 'portfolio-alpha',
    title: 'Alpha Portfolio',
    isPublished: false,
    pages: starter.pages,
    theme: starter.theme,
    seo: starter.seo,
    settings: starter.settings,
    navigation: starter.navigation,
  });

  const mockPortfolioB = new Portfolio({
    _id: portfolioBId,
    schemaVersion: 1,
    ownerId: uOwnerId,
    workspaceId: workspaceBId,
    slug: 'portfolio-beta',
    title: 'Beta Portfolio',
    isPublished: false,
    pages: starter.pages,
    theme: starter.theme,
    seo: starter.seo,
    settings: starter.settings,
    navigation: starter.navigation,
  });

  const mockPortfolioC = new Portfolio({
    _id: portfolioCId,
    schemaVersion: 1,
    ownerId: uStrangerId,
    workspaceId: workspaceCId,
    slug: 'portfolio-gamma',
    title: 'Gamma Stranger Portfolio',
    isPublished: false,
    pages: starter.pages,
    theme: starter.theme,
    seo: starter.seo,
    settings: starter.settings,
    navigation: starter.navigation,
  });

  // Stubs
  const origWsFindById = Workspace.findById;
  const origPortFindById = Portfolio.findById;
  const origPortFindBySlug = Portfolio.findBySlug;
  const origPortFindOne = Portfolio.findOne;
  const origPortFindByWorkspace = Portfolio.findByWorkspace;
  const origPortFind = Portfolio.find;
  const origWsFindByUser = Workspace.findByUser;
  const origPortFindByIdAndDelete = Portfolio.findByIdAndDelete;

  Workspace.findById = async (id) => {
    const sId = id?.toString();
    if (sId === workspaceAId.toString()) return mockWorkspaceA;
    if (sId === workspaceBId.toString()) return mockWorkspaceB;
    if (sId === workspaceCId.toString()) return mockWorkspaceC;
    return null;
  };

  Portfolio.findById = async (id) => {
    const sId = id?.toString();
    if (sId === portfolioAId.toString()) return mockPortfolioA;
    if (sId === portfolioBId.toString()) return mockPortfolioB;
    if (sId === portfolioCId.toString()) return mockPortfolioC;
    return null;
  };

  Portfolio.findBySlug = async (slug) => {
    if (slug === 'portfolio-alpha') return mockPortfolioA;
    if (slug === 'portfolio-beta') return mockPortfolioB;
    if (slug === 'portfolio-gamma') return mockPortfolioC;
    return null;
  };

  Portfolio.findOne = async (query) => {
    if (query?.slug === 'portfolio-alpha') return mockPortfolioA;
    if (query?.slug === 'portfolio-beta') return mockPortfolioB;
    if (query?.slug === 'portfolio-gamma') return mockPortfolioC;
    return null;
  };

  Portfolio.findByWorkspace = async (wsId) => {
    const sId = wsId?.toString();
    if (sId === workspaceAId.toString()) return [mockPortfolioA];
    if (sId === workspaceBId.toString()) return [mockPortfolioB];
    if (sId === workspaceCId.toString()) return [mockPortfolioC];
    return [];
  };

  Workspace.findByUser = async (uId) => {
    const sId = uId?.toString();
    if (sId === uOwnerId.toString() || sId === uEditorId.toString()) {
      return [mockWorkspaceA, mockWorkspaceB];
    }
    if (sId === uViewerId.toString()) {
      return [mockWorkspaceA];
    }
    if (sId === uStrangerId.toString()) {
      return [mockWorkspaceC];
    }
    return [];
  };

  Portfolio.find = (query) => {
    let result = [mockPortfolioA, mockPortfolioB, mockPortfolioC];
    if (query?.workspaceId?.$in) {
      const allowed = query.workspaceId.$in.map((id) => id.toString());
      result = result.filter((p) => allowed.includes(p.workspaceId.toString()));
    }
    return {
      sort: () => Promise.resolve(result),
    };
  };

  let deletedId = null;
  Portfolio.findByIdAndDelete = async (id) => {
    deletedId = id?.toString();
    return mockPortfolioA;
  };

  const router = createPortfolioRouter(JWT_ACCESS_SECRET);
  check(typeof router === 'function', 'createPortfolioRouter creates Express router instance');

  const postHandler = router.stack.find((l) => l.route && l.route.path === '/' && l.route.methods.post);
  const getListHandler = router.stack.find((l) => l.route && l.route.path === '/' && l.route.methods.get);
  const getSingleHandler = router.stack.find((l) => l.route && l.route.path === '/:id' && l.route.methods.get);
  const patchHandler = router.stack.find((l) => l.route && l.route.path === '/:id' && l.route.methods.patch);
  const deleteHandler = router.stack.find((l) => l.route && l.route.path === '/:id' && l.route.methods.delete);

  check(!!postHandler, 'POST / route is registered');
  check(!!getListHandler, 'GET / route is registered');
  check(!!getSingleHandler, 'GET /:id route is registered');
  check(!!patchHandler, 'PATCH /:id route is registered');
  check(!!deleteHandler, 'DELETE /:id route is registered');

  // ====================================================
  // AUDIT 5: Portfolio Creation, Authorization & Concurrency
  // ====================================================
  console.log('\nAudit 5: Portfolio Creation, Authorization & Concurrency');

  // 5.1 Malformed Workspace ID
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      {},
      { workspaceId: 'not-a-valid-id', title: 'Test', slug: 'my-test-port' }
    );
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 400, 'Rejects malformed workspaceId with 400');
    check(getBody()?.error?.code === 'INVALID_ID', 'Returns INVALID_ID code');
  }

  // 5.2 Non-Existent Workspace
  {
    const nonExistentWsId = new mongoose.Types.ObjectId();
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      {},
      { workspaceId: nonExistentWsId.toString(), title: 'Test', slug: 'my-test-port' }
    );
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 404, 'Rejects non-existent workspace with 404');
    check(getBody()?.error?.code === 'WORKSPACE_NOT_FOUND', 'Returns WORKSPACE_NOT_FOUND code');
  }

  // 5.3 Reserved Slug Rejection
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      {},
      { workspaceId: workspaceAId.toString(), title: 'Admin Site', slug: 'admin' }
    );
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 400, 'Rejects reserved slug "admin" with 400');
    check(getBody()?.error?.code === 'RESERVED_SLUG', 'Returns RESERVED_SLUG code');
  }

  // 5.4 Duplicate Slug Rejection (Application Check)
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      {},
      { workspaceId: workspaceAId.toString(), title: 'Alpha Site', slug: 'portfolio-alpha' }
    );
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 409, 'Rejects duplicate slug with 409');
    check(getBody()?.error?.code === 'SLUG_IN_USE', 'Returns SLUG_IN_USE code');
  }

  // 5.5 Concurrency / Driver Duplicate Key Error Handling (E11000)
  {
    const origSave = Portfolio.prototype.save;
    Portfolio.prototype.save = async function () {
      const err = new Error('E11000 duplicate key error collection: pagecraft.portfolios index: slug_1 dup key: { slug: "concurrent-slug" }');
      (err).code = 11000;
      (err).name = 'MongoServerError';
      throw err;
    };

    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      {},
      { workspaceId: workspaceAId.toString(), title: 'Concurrent Race', slug: 'concurrent-slug' }
    );
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 409, 'Intercepts driver E11000 duplicate key error and returns 409 (not 500)');
    check(getBody()?.error?.code === 'SLUG_IN_USE', 'Returns SLUG_IN_USE code on driver duplicate key error');

    Portfolio.prototype.save = origSave;
  }

  // 5.6 Non-Member Stranger Rejection
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uStrangerId.toString(), role: 'user' },
      {},
      { workspaceId: workspaceAId.toString(), title: 'Stranger Port', slug: 'stranger-port' }
    );
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 403, 'Rejects stranger from creating portfolio in target workspace (403)');
    check(getBody()?.error?.code === 'FORBIDDEN', 'Returns FORBIDDEN code for stranger');
  }

  // 5.7 Viewer Role Rejection
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      {},
      { workspaceId: workspaceAId.toString(), title: 'Viewer Port', slug: 'viewer-port' }
    );
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 403, 'Rejects viewer role from creating portfolio (403)');
    check(getBody()?.error?.code === 'INSUFFICIENT_PERMISSIONS', 'Returns INSUFFICIENT_PERMISSIONS code for viewer');
  }

  // 5.8 Editor Role Creation Allowed
  {
    let savedDoc = null;
    const origSave = Portfolio.prototype.save;
    Portfolio.prototype.save = async function () {
      savedDoc = this;
      return this;
    };

    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      {},
      { workspaceId: workspaceAId.toString(), title: 'Editor Created Portfolio', slug: 'editor-site' }
    );
    const handler = postHandler.route.stack[postHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 201, 'Editor role is authorized to create portfolio (201)');
    check(getBody()?.success === true, 'Returns success: true');
    check(savedDoc?.workspaceId?.toString() === workspaceAId.toString(), 'Workspace ID is securely bound and persisted');
    check(savedDoc?.ownerId?.toString() === uEditorId.toString(), 'Owner ID is bound to authenticated user');

    Portfolio.prototype.save = origSave;
  }

  // ====================================================
  // AUDIT 6: Portfolio Listing & Tenant Isolation
  // ====================================================
  console.log('\nAudit 6: Portfolio Listing & Tenant Isolation');

  // 6.1 List by WorkspaceId for authorized member
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      {},
      {},
      { workspaceId: workspaceAId.toString() }
    );
    const handler = getListHandler.route.stack[0].handle;
    await handler(req, res);
    check(getStatus() === 200, 'Member can list portfolios in authorized workspace (200)');
    check(getBody()?.data?.length === 1, 'Returns 1 portfolio in Workspace Alpha');
    check(getBody()?.data[0]?.slug === 'portfolio-alpha', 'Returns correct portfolio for Workspace Alpha');
  }

  // 6.2 List by WorkspaceId for stranger
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uStrangerId.toString(), role: 'user' },
      {},
      {},
      { workspaceId: workspaceAId.toString() }
    );
    const handler = getListHandler.route.stack[0].handle;
    await handler(req, res);
    check(getStatus() === 403, 'Stranger is forbidden from querying Workspace Alpha portfolios (403)');
    check(getBody()?.error?.code === 'FORBIDDEN', 'Returns FORBIDDEN code');
  }

  // 6.3 Multi-workspace user listing (without workspaceId)
  {
    // uEditor belongs to Workspace Alpha and Workspace Beta, but NOT Workspace Gamma
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      {},
      {},
      {}
    );
    const handler = getListHandler.route.stack[0].handle;
    await handler(req, res);
    check(getStatus() === 200, 'User lists portfolios across their accessible workspaces');
    check(getBody()?.data?.length === 2, 'Returns exactly 2 portfolios across user workspaces (Alpha and Beta)');
    const returnedSlugs = getBody()?.data?.map((p) => p.slug);
    check(returnedSlugs.includes('portfolio-alpha'), 'Includes Alpha portfolio');
    check(returnedSlugs.includes('portfolio-beta'), 'Includes Beta portfolio');
    check(!returnedSlugs.includes('portfolio-gamma'), 'Strictly excludes stranger Gamma portfolio');
  }

  // ====================================================
  // AUDIT 7: Single Portfolio Retrieval & Isolation
  // ====================================================
  console.log('\nAudit 7: Single Portfolio Retrieval & Isolation');

  // 7.1 Viewer can read portfolio
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      { id: portfolioAId.toString() }
    );
    const guard = getSingleHandler.route.stack[0].handle;
    const handler = getSingleHandler.route.stack[1].handle;
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(nextCalled && getStatus() === 200, 'Viewer passes requirePortfolioAccess("portfolio:read")');
    if (nextCalled) {
      handler(req, res);
      check(getStatus() === 200, 'Viewer successfully retrieves portfolio document');
      check(getBody()?.data?.title === 'Alpha Portfolio', 'Matches portfolio title');
    }
  }

  // 7.2 Stranger from another workspace cannot read portfolio
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uStrangerId.toString(), role: 'user' },
      { id: portfolioAId.toString() }
    );
    const guard = getSingleHandler.route.stack[0].handle;
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Stranger is blocked from reading portfolio (403)');
    check(getBody()?.error?.code === 'FORBIDDEN', 'Returns FORBIDDEN code for stranger');
  }

  // ====================================================
  // AUDIT 8: Metadata Mutation & Mass Assignment Prevention
  // ====================================================
  console.log('\nAudit 8: Metadata Mutation & Mass Assignment Prevention');

  // 8.1 Viewer cannot update
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      { id: portfolioAId.toString() },
      { title: 'Viewer Attempt' }
    );
    const guard = patchHandler.route.stack[0].handle;
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Viewer role cannot execute PATCH (403)');
    check(getBody()?.error?.code === 'INSUFFICIENT_PERMISSIONS', 'Returns INSUFFICIENT_PERMISSIONS');
  }

  // 8.2 Mass Assignment Prevention: Attempt to overwrite pages, blocks, workspaceId, ownerId
  {
    const testDoc = new Portfolio({
      _id: portfolioAId,
      schemaVersion: 1,
      ownerId: uOwnerId,
      workspaceId: workspaceAId,
      slug: 'portfolio-alpha',
      title: 'Original Alpha',
      pages: starter.pages,
      theme: starter.theme,
      seo: starter.seo,
      settings: starter.settings,
      navigation: starter.navigation,
    });
    testDoc.save = async function () {
      return this;
    };

    // Attacker sends malicious payload attempting mass assignment
    const maliciousPayload = {
      title: 'Legitimate Title Update',
      pages: [], // attempt to wipe pages
      blocks: [], // attempt to wipe blocks
      workspaceId: new mongoose.Types.ObjectId().toString(), // attempt to hijack workspace
      ownerId: new mongoose.Types.ObjectId().toString(), // attempt to hijack owner
      navigation: null, // attempt to wipe navigation
      schemaVersion: 99, // attempt to corrupt schemaVersion
    };

    // Pass through Zod validator middleware
    const validatorMiddleware = patchHandler.route.stack[1].handle;
    const { req, res, getStatus } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { id: portfolioAId.toString() },
      maliciousPayload
    );
    req.portfolio = testDoc;

    let validatorNext = false;
    validatorMiddleware(req, res, () => {
      validatorNext = true;
    });

    check(validatorNext, 'Validator middleware successfully parses and filters payload');
    check(req.body.pages === undefined, 'Mass assignment stripped: req.body.pages is undefined');
    check(req.body.blocks === undefined, 'Mass assignment stripped: req.body.blocks is undefined');
    check(req.body.workspaceId === undefined, 'Mass assignment stripped: req.body.workspaceId is undefined');
    check(req.body.ownerId === undefined, 'Mass assignment stripped: req.body.ownerId is undefined');

    // Run patch handler
    const handler = patchHandler.route.stack[patchHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 200, 'Patch completes successfully (200)');
    check(testDoc.title === 'Legitimate Title Update', 'Title updated');
    check(testDoc.pages.length === 1, 'Pages remain completely intact');
    check(testDoc.pages[0].blocks.length === 6, 'Blocks remain completely intact');
    check(testDoc.workspaceId.toString() === workspaceAId.toString(), 'Workspace ID remains unchanged');
    check(testDoc.ownerId.toString() === uOwnerId.toString(), 'Owner ID remains unchanged');
  }

  // 8.3 Concurrency / Driver Duplicate Key Error Handling in PATCH (E11000)
  {
    const testDoc = new Portfolio({
      _id: portfolioAId,
      slug: 'portfolio-alpha',
      title: 'Original',
    });
    testDoc.save = async function () {
      const err = new Error('E11000 duplicate key error');
      (err).code = 11000;
      (err).name = 'MongoServerError';
      throw err;
    };

    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { id: portfolioAId.toString() },
      { slug: 'portfolio-beta' }
    );
    req.portfolio = testDoc;

    const handler = patchHandler.route.stack[patchHandler.route.stack.length - 1].handle;
    await handler(req, res);
    check(getStatus() === 409, 'Patch intercepts driver E11000 duplicate key error and returns 409');
    check(getBody()?.error?.code === 'SLUG_IN_USE', 'Returns SLUG_IN_USE code on driver duplicate key error');
  }

  // ====================================================
  // AUDIT 9: Portfolio Deletion Lifecycle & Absence of Trash
  // ====================================================
  console.log('\nAudit 9: Portfolio Deletion Lifecycle & Schema Verification');

  // 9.1 Verify absence of soft deletion / trash properties in Schema (Preserving approved architecture)
  const portfolioSchemaPaths = Object.keys(Portfolio.schema.paths);
  check(!portfolioSchemaPaths.includes('isDeleted'), 'Portfolio schema does NOT contain unauthorized "isDeleted" flag');
  check(!portfolioSchemaPaths.includes('deletedAt'), 'Portfolio schema does NOT contain unauthorized "deletedAt" flag');
  check(!portfolioSchemaPaths.includes('trash'), 'Portfolio schema does NOT contain unauthorized "trash" flag');

  // 9.2 Editor CANNOT delete portfolio
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { id: portfolioAId.toString() }
    );
    const guard = deleteHandler.route.stack[0].handle;
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Editor cannot delete portfolio (403)');
    check(getBody()?.error?.code === 'INSUFFICIENT_PERMISSIONS', 'Returns INSUFFICIENT_PERMISSIONS for editor delete');
  }

  // 9.3 Viewer CANNOT delete portfolio
  {
    const { req, res, getStatus } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      { id: portfolioAId.toString() }
    );
    const guard = deleteHandler.route.stack[0].handle;
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Viewer cannot delete portfolio (403)');
  }

  // 9.4 Workspace Owner can delete portfolio (Permanent deletion via findByIdAndDelete)
  {
    deletedId = null;
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      { id: portfolioAId.toString() }
    );
    const guard = deleteHandler.route.stack[0].handle;
    const handler = deleteHandler.route.stack[1].handle;

    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(nextCalled && getStatus() === 200, 'Owner passes requirePortfolioAccess("portfolio:delete")');

    if (nextCalled) {
      await handler(req, res);
      check(getStatus() === 200, 'Delete executes successfully (200)');
      check(deletedId === portfolioAId.toString(), 'Calls findByIdAndDelete with target portfolio ID');
      check(getBody()?.data?.id === portfolioAId.toString(), 'Returns deleted portfolio ID in payload');
    }
  }

  // ====================================================
  // AUDIT 10: Express App Integration
  // ====================================================
  console.log('\nAudit 10: Express Application Mounting & Route Table');
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

  // ====================================================
  // Summary
  // ====================================================
  console.log(`\n====================================================`);
  console.log(`Total checks: ${pass + fail} | Passed: ${pass} | Failed: ${fail}`);
  console.log(`====================================================\n`);

  if (fail > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
