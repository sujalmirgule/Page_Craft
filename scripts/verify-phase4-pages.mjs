import mongoose from 'mongoose';
import {
  PageCreateValidator,
  PageUpdateValidator,
  PageReorderValidator,
  NavigationLinkValidator,
  NavigationUpdateValidator,
  NavigationReorderValidator,
  isReservedSlug,
} from '../packages/validation/src/index';
import { can } from '../packages/permissions/src/index';
import { createStarterPortfolio } from '../packages/schema/src/index';
import { Portfolio, Workspace } from '../apps/api/src/models/index';
import { createPortfolioRouter } from '../apps/api/src/routes/portfolio.routes';
import { createApp } from '../apps/api/src/app';

console.log('=== PAGECRAFT PHASE 4 — MILESTONE 4.2: PAGE CRUD & NAVIGATION VERIFICATION ===\n');

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
  // ====================================================
  // TEST 1: Page & Navigation Zod Validators
  // ====================================================
  console.log('Test 1: Page & Navigation Schema Validation');
  const validPageInput = {
    title: 'About Me',
    slug: 'about',
    isVisible: true,
    seoDescription: 'Learn more about Alex Morgan.',
  };
  check(PageCreateValidator.safeParse(validPageInput).success, 'PageCreateValidator accepts valid page data');

  const emptyTitleInput = {
    title: '',
    slug: 'about',
  };
  check(!PageCreateValidator.safeParse(emptyTitleInput).success, 'PageCreateValidator rejects empty page title');

  const invalidSlugInput = {
    title: 'Projects',
    slug: 'invalid slug with spaces!',
  };
  check(!PageCreateValidator.safeParse(invalidSlugInput).success, 'PageCreateValidator rejects invalid characters in slug');

  const validLinkInput = {
    label: 'Contact',
    pageId: 'page-contact-1',
  };
  check(NavigationLinkValidator.safeParse(validLinkInput).success, 'NavigationLinkValidator accepts valid navigation link');

  const emptyLabelLinkInput = {
    label: '',
    pageId: 'page-contact-1',
  };
  check(!NavigationLinkValidator.safeParse(emptyLabelLinkInput).success, 'NavigationLinkValidator rejects empty navigation label');

  // ====================================================
  // TEST 2: Test Fixtures & Mocks Setup
  // ====================================================
  console.log('\nTest 2: Fixtures & Router Configuration');
  const uOwnerId = new mongoose.Types.ObjectId();
  const uEditorId = new mongoose.Types.ObjectId();
  const uViewerId = new mongoose.Types.ObjectId();
  const uStrangerId = new mongoose.Types.ObjectId();
  const uAdminId = new mongoose.Types.ObjectId();

  const workspaceId = new mongoose.Types.ObjectId();
  const strangerWorkspaceId = new mongoose.Types.ObjectId();

  const mockWorkspace = new Workspace({
    _id: workspaceId,
    name: 'Primary Workspace',
    slug: 'primary-ws',
    ownerId: uOwnerId,
    members: [
      { userId: uOwnerId, role: 'owner', joinedAt: new Date() },
      { userId: uEditorId, role: 'editor', joinedAt: new Date() },
      { userId: uViewerId, role: 'viewer', joinedAt: new Date() },
    ],
  });

  const mockStrangerWorkspace = new Workspace({
    _id: strangerWorkspaceId,
    name: 'Stranger Workspace',
    slug: 'stranger-ws',
    ownerId: uStrangerId,
    members: [{ userId: uStrangerId, role: 'owner', joinedAt: new Date() }],
  });

  const starter = createStarterPortfolio('user-1', workspaceId.toString(), 'main-portfolio');
  const portfolioId = new mongoose.Types.ObjectId();
  const foreignPortfolioId = new mongoose.Types.ObjectId();

  // Create test document with starter pages and navigation
  const testPortfolio = new Portfolio({
    _id: portfolioId,
    schemaVersion: 1,
    ownerId: uOwnerId,
    workspaceId: workspaceId,
    slug: 'main-portfolio',
    title: 'Main Portfolio',
    isPublished: false,
    pages: starter.pages,
    theme: starter.theme,
    seo: starter.seo,
    settings: starter.settings,
    navigation: starter.navigation,
  });

  const foreignPortfolio = new Portfolio({
    _id: foreignPortfolioId,
    schemaVersion: 1,
    ownerId: uStrangerId,
    workspaceId: strangerWorkspaceId,
    slug: 'foreign-portfolio',
    title: 'Foreign Portfolio',
    isPublished: false,
    pages: [
      {
        id: 'foreign-page-1',
        slug: '',
        title: 'Foreign Home',
        isHomePage: true,
        isVisible: true,
        blocks: [],
      },
    ],
    theme: starter.theme,
    seo: starter.seo,
    settings: starter.settings,
    navigation: { showNavbar: true, sticky: true, links: [] },
  });

  // Stubs
  const origWsFindById = Workspace.findById;
  const origPortFindById = Portfolio.findById;

  Workspace.findById = async (id) => {
    const sId = id?.toString();
    if (sId === workspaceId.toString()) return mockWorkspace;
    if (sId === strangerWorkspaceId.toString()) return mockStrangerWorkspace;
    return null;
  };

  Portfolio.findById = async (id) => {
    const sId = id?.toString();
    if (sId === portfolioId.toString()) return testPortfolio;
    if (sId === foreignPortfolioId.toString()) return foreignPortfolio;
    return null;
  };

  const router = createPortfolioRouter(JWT_ACCESS_SECRET);
  check(typeof router === 'function', 'createPortfolioRouter initializes with page & navigation routes');

  // Helper to find route handler in stack
  function getRouteHandlers(path, method) {
    const layer = router.stack.find(
      (l) => l.route && l.route.path === path && l.route.methods[method.toLowerCase()]
    );
    if (!layer) return null;
    return layer.route.stack.map((s) => s.handle);
  }

  // ====================================================
  // TEST 3: Page Listing & Retrieval
  // ====================================================
  console.log('\nTest 3: Page Listing & Single Retrieval');
  const getPagesHandlers = getRouteHandlers('/:portfolioId/pages', 'get');
  check(!!getPagesHandlers, 'GET /:portfolioId/pages route is registered');

  // 3.1 Authorized member (viewer) reads pages
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() }
    );
    const guard = getPagesHandlers[0];
    const handler = getPagesHandlers[1];

    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(nextCalled, 'Viewer passes requirePortfolioAccess("portfolio:read")');
    handler(req, res);
    check(getStatus() === 200, 'Returns 200 for pages list');
    check(Array.isArray(getBody()?.data), 'Returns pages array');
    check(getBody()?.data?.length === 1, 'Initial portfolio contains 1 starter page');
    check(getBody()?.data[0]?.id === 'page-home', 'Initial page is "page-home"');
  }

  // 3.2 Stranger rejected from reading pages
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uStrangerId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() }
    );
    const guard = getPagesHandlers[0];
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Stranger rejected with 403 FORBIDDEN');
    check(getBody()?.error?.code === 'FORBIDDEN', 'Returns FORBIDDEN code');
  }

  // 3.3 Get single page by ID
  const getSinglePageHandlers = getRouteHandlers('/:portfolioId/pages/:pageId', 'get');
  check(!!getSinglePageHandlers, 'GET /:portfolioId/pages/:pageId route is registered');
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString(), pageId: 'page-home' }
    );
    const guard = getSinglePageHandlers[0];
    const handler = getSinglePageHandlers[1];
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    handler(req, res);
    check(getStatus() === 200, 'Returns 200 for single page retrieval');
    check(getBody()?.data?.id === 'page-home', 'Matches page ID');
    check(getBody()?.data?.blocks?.length === 6, 'Contains full nested starter blocks');
  }

  // 3.4 Non-existent page returns 404
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString(), pageId: 'non-existent-page' }
    );
    const guard = getSinglePageHandlers[0];
    const handler = getSinglePageHandlers[1];
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    handler(req, res);
    check(getStatus() === 404, 'Returns 404 for non-existent page ID');
    check(getBody()?.error?.code === 'PAGE_NOT_FOUND', 'Returns PAGE_NOT_FOUND code');
  }

  // ====================================================
  // TEST 4: Page Creation & Constraints
  // ====================================================
  console.log('\nTest 4: Page Creation & Constraints');
  const postPageHandlers = getRouteHandlers('/:portfolioId/pages', 'post');
  check(!!postPageHandlers, 'POST /:portfolioId/pages route is registered');

  // Mock save() on testPortfolio
  let saveCount = 0;
  testPortfolio.save = async function () {
    saveCount++;
    return this;
  };

  // 4.1 Viewer role rejected from creating page
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() },
      { title: 'New Page', slug: 'new-page' }
    );
    const guard = postPageHandlers[0];
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Viewer rejected from page creation with 403');
    check(getBody()?.error?.code === 'INSUFFICIENT_PERMISSIONS', 'Returns INSUFFICIENT_PERMISSIONS');
  }

  // 4.2 Rejects creating a second Home page
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() },
      { title: 'Second Home', slug: 'home-2', isHomePage: true }
    );
    req.portfolio = testPortfolio;
    const handler = postPageHandlers[postPageHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 400, 'Rejects creating a second Home page (400)');
    check(getBody()?.error?.code === 'HOME_PAGE_EXISTS', 'Returns HOME_PAGE_EXISTS code');
  }

  // 4.3 Rejects non-home page with empty slug
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() },
      { title: '', slug: '', isHomePage: false }
    );
    req.portfolio = testPortfolio;
    const handler = postPageHandlers[postPageHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 400, 'Rejects non-home page with empty slug (400)');
    check(getBody()?.error?.code === 'INVALID_SLUG', 'Returns INVALID_SLUG code');
  }

  // 4.4 Rejects reserved slug for page
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() },
      { title: 'Admin Page', slug: 'admin' }
    );
    req.portfolio = testPortfolio;
    const handler = postPageHandlers[postPageHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 400, 'Rejects reserved page slug (400)');
    check(getBody()?.error?.code === 'RESERVED_SLUG', 'Returns RESERVED_SLUG code');
  }

  // 4.5 Editor successfully creates new page
  let createdPageId = null;
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() },
      { title: 'Projects Showcase', slug: 'projects', seoDescription: 'All my engineering projects' }
    );
    req.portfolio = testPortfolio;
    const handler = postPageHandlers[postPageHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 201, 'Editor successfully creates page (201)');
    check(getBody()?.success === true, 'Returns success: true');
    createdPageId = getBody()?.data?.id;
    check(createdPageId?.startsWith('page-'), 'Page ID has prefix "page-"');
    check(getBody()?.data?.slug === 'projects', 'Persists normalized page slug "projects"');
    check(testPortfolio.pages.length === 2, 'Portfolio pages array length increased to 2');
  }

  // 4.6 Rejects duplicate page slug within same portfolio
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() },
      { title: 'Another Projects', slug: 'projects' }
    );
    req.portfolio = testPortfolio;
    const handler = postPageHandlers[postPageHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 409, 'Rejects duplicate page slug within same portfolio (409)');
    check(getBody()?.error?.code === 'DUPLICATE_PAGE_SLUG', 'Returns DUPLICATE_PAGE_SLUG code');
  }

  // ====================================================
  // TEST 5: Page Update & Rename
  // ====================================================
  console.log('\nTest 5: Page Update & Rename');
  const patchPageHandlers = getRouteHandlers('/:portfolioId/pages/:pageId', 'patch');
  check(!!patchPageHandlers, 'PATCH /:portfolioId/pages/:pageId route is registered');

  // 5.1 Rename page title and update SEO description
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString(), pageId: createdPageId },
      { title: 'Featured Projects & Open Source', seoDescription: 'Updated project showcase' }
    );
    req.portfolio = testPortfolio;
    const handler = patchPageHandlers[patchPageHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 200, 'Page successfully renamed and updated (200)');
    check(getBody()?.data?.title === 'Featured Projects & Open Source', 'Page title updated');
    check(getBody()?.data?.id === createdPageId, 'Stable page ID is preserved without mutation');
  }

  // 5.2 Attempt to change Home page slug to non-empty
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString(), pageId: 'page-home' },
      { slug: 'not-empty-home' }
    );
    req.portfolio = testPortfolio;
    const handler = patchPageHandlers[patchPageHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 400, 'Rejects changing Home page slug to non-empty (400)');
    check(getBody()?.error?.code === 'CANNOT_MODIFY_HOME_SLUG', 'Returns CANNOT_MODIFY_HOME_SLUG code');
  }

  // 5.3 Attempt to unset Home page without replacement
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString(), pageId: 'page-home' },
      { isHomePage: false }
    );
    req.portfolio = testPortfolio;
    const handler = patchPageHandlers[patchPageHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 400, 'Rejects unsetting Home page without designating new Home (400)');
    check(getBody()?.error?.code === 'CANNOT_UNSET_HOME_PAGE', 'Returns CANNOT_UNSET_HOME_PAGE code');
  }

  // ====================================================
  // TEST 6: Page Reordering
  // ====================================================
  console.log('\nTest 6: Page Reordering');
  const postReorderHandlers = getRouteHandlers('/:portfolioId/pages/reorder', 'post');
  check(!!postReorderHandlers, 'POST /:portfolioId/pages/reorder route is registered');

  // 6.1 Reorder with valid reversed page IDs
  {
    const reversedIds = [createdPageId, 'page-home'];
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() },
      { pageIds: reversedIds }
    );
    req.portfolio = testPortfolio;
    const handler = postReorderHandlers[postReorderHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 200, 'Reorders pages successfully (200)');
    check(testPortfolio.pages[0].id === createdPageId, 'First page is now the projects page');
    check(testPortfolio.pages[1].id === 'page-home', 'Second page is now the home page');
  }

  // 6.2 Reorder with count mismatch
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() },
      { pageIds: ['page-home'] }
    );
    req.portfolio = testPortfolio;
    const handler = postReorderHandlers[postReorderHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 400, 'Rejects reorder with missing pages (400)');
    check(getBody()?.error?.code === 'INVALID_ORDER_PAYLOAD', 'Returns INVALID_ORDER_PAYLOAD code');
  }

  // 6.3 Reorder with foreign page ID from another portfolio
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() },
      { pageIds: [createdPageId, 'foreign-page-1'] }
    );
    req.portfolio = testPortfolio;
    const handler = postReorderHandlers[postReorderHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 400, 'Rejects reorder containing foreign page ID (400)');
    check(getBody()?.error?.code === 'INVALID_PAGE_IDS', 'Returns INVALID_PAGE_IDS code');
  }

  // ====================================================
  // TEST 7: Navigation CRUD & Reference Validation
  // ====================================================
  console.log('\nTest 7: Navigation CRUD & Reference Validation');
  const getNavHandlers = getRouteHandlers('/:portfolioId/navigation', 'get');
  const putNavHandlers = getRouteHandlers('/:portfolioId/navigation', 'put');
  const postNavLinkHandlers = getRouteHandlers('/:portfolioId/navigation/links', 'post');
  const patchNavLinkHandlers = getRouteHandlers('/:portfolioId/navigation/links/:target', 'patch');
  const deleteNavLinkHandlers = getRouteHandlers('/:portfolioId/navigation/links/:target', 'delete');
  const putNavReorderHandlers = getRouteHandlers('/:portfolioId/navigation/reorder', 'put');

  check(!!getNavHandlers, 'GET /:portfolioId/navigation is registered');
  check(!!putNavHandlers, 'PUT /:portfolioId/navigation is registered');
  check(!!postNavLinkHandlers, 'POST /:portfolioId/navigation/links is registered');
  check(!!patchNavLinkHandlers, 'PATCH /:portfolioId/navigation/links/:target is registered');
  check(!!deleteNavLinkHandlers, 'DELETE /:portfolioId/navigation/links/:target is registered');
  check(!!putNavReorderHandlers, 'PUT /:portfolioId/navigation/reorder is registered');

  // 7.1 Read navigation config
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() }
    );
    req.portfolio = testPortfolio;
    const handler = getNavHandlers[1];
    handler(req, res);
    check(getStatus() === 200, 'Returns 200 for navigation config');
    check(getBody()?.data?.showNavbar === true, 'showNavbar is true');
    check(getBody()?.data?.links?.length === 1, 'Initial navigation has 1 link');
  }

  // 7.2 Add navigation link for existing page
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() },
      { label: 'Projects', pageId: createdPageId }
    );
    req.portfolio = testPortfolio;
    const handler = postNavLinkHandlers[postNavLinkHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 201, 'Adds navigation link successfully (201)');
    check(testPortfolio.navigation.links.length === 2, 'Navigation links count is now 2');
    check(testPortfolio.navigation.links[1].pageId === createdPageId, 'Link references projects page');
  }

  // 7.3 Reject navigation link pointing to foreign portfolio page
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() },
      { label: 'Foreign Link', pageId: 'foreign-page-1' }
    );
    req.portfolio = testPortfolio;
    const handler = postNavLinkHandlers[postNavLinkHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 400, 'Rejects navigation link referencing foreign page ID (400)');
    check(getBody()?.error?.code === 'INVALID_PAGE_REFERENCE', 'Returns INVALID_PAGE_REFERENCE code');
  }

  // 7.4 Update navigation link label
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString(), target: createdPageId },
      { label: 'Work & Projects' }
    );
    req.portfolio = testPortfolio;
    const handler = patchNavLinkHandlers[patchNavLinkHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 200, 'Updates navigation link label (200)');
    const updatedLink = testPortfolio.navigation.links.find((l) => l.pageId === createdPageId);
    check(updatedLink?.label === 'Work & Projects', 'Label is updated to "Work & Projects"');
  }

  // 7.5 Reorder navigation links
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString() },
      { pageIds: [createdPageId, 'page-home'] }
    );
    req.portfolio = testPortfolio;
    const handler = putNavReorderHandlers[putNavReorderHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 200, 'Reorders navigation links successfully (200)');
    check(testPortfolio.navigation.links[0].pageId === createdPageId, 'First link is now Projects');
    check(testPortfolio.navigation.links[1].pageId === 'page-home', 'Second link is now Home');
  }

  // 7.6 Delete navigation link directly
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString(), target: createdPageId }
    );
    req.portfolio = testPortfolio;
    const handler = deleteNavLinkHandlers[deleteNavLinkHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 200, 'Deletes navigation link (200)');
    check(testPortfolio.navigation.links.length === 1, 'Navigation links count reduced to 1');
    check(!testPortfolio.navigation.links.some((l) => l.pageId === createdPageId), 'Projects link removed');
  }

  // ====================================================
  // TEST 8: Page Deletion & Referential Integrity
  // ====================================================
  console.log('\nTest 8: Page Deletion & Referential Integrity');
  const deletePageHandlers = getRouteHandlers('/:portfolioId/pages/:pageId', 'delete');
  check(!!deletePageHandlers, 'DELETE /:portfolioId/pages/:pageId route is registered');

  // Re-add link for createdPageId to test automatic cascade deletion from navigation
  testPortfolio.navigation.links.push({ label: 'Projects Link', pageId: createdPageId });
  check(testPortfolio.navigation.links.length === 2, 'Setup: Navigation has 2 links before page delete');

  // 8.1 Rejects deleting the Home page
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString(), pageId: 'page-home' }
    );
    req.portfolio = testPortfolio;
    const handler = deletePageHandlers[deletePageHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 400, 'Rejects deleting the Home page (400)');
    check(getBody()?.error?.code === 'CANNOT_DELETE_HOME_PAGE', 'Returns CANNOT_DELETE_HOME_PAGE code');
  }

  // 8.2 Successfully deletes non-home page and cascades navigation link cleanup
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString(), pageId: createdPageId }
    );
    req.portfolio = testPortfolio;
    const handler = deletePageHandlers[deletePageHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 200, 'Successfully deletes non-home page (200)');
    check(!testPortfolio.pages.some((p) => p.id === createdPageId), 'Page removed from portfolio.pages');
    check(
      !testPortfolio.navigation.links.some((l) => l.pageId === createdPageId),
      'Cascaded cleanup: Navigation link referencing deleted pageId is automatically removed'
    );
    check(testPortfolio.navigation.links.length === 1, 'Only Home navigation link remains');
  }

  // 8.3 Rejects deleting the last page
  {
    // testPortfolio now only has 1 page ('page-home')
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { portfolioId: portfolioId.toString(), pageId: 'page-home' }
    );
    req.portfolio = testPortfolio;
    const handler = deletePageHandlers[deletePageHandlers.length - 1];
    await handler(req, res);
    check(getStatus() === 400, 'Rejects deleting last remaining page (400)');
  }

  // ====================================================
  // TEST 9: Tenant & Portfolio Boundary Security
  // ====================================================
  console.log('\nTest 9: Tenant & Cross-Portfolio Boundary Security');

  // 9.1 Cross-portfolio IDOR attempt: Accessing pages of another tenant
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      { portfolioId: foreignPortfolioId.toString() }
    );
    const guard = getPagesHandlers[0];
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Cross-workspace IDOR prevented: User cannot access stranger portfolio pages');
    check(getBody()?.error?.code === 'FORBIDDEN', 'Returns FORBIDDEN code for stranger workspace');
  }

  // 9.2 Super Admin full override access on pages & navigation
  {
    const { req, res, getStatus } = createMockReqRes(
      { id: uAdminId.toString(), role: 'super_admin' },
      { portfolioId: foreignPortfolioId.toString() }
    );
    const guard = getPagesHandlers[0];
    let nextCalled = false;
    await guard(req, res, () => { nextCalled = true; });
    check(nextCalled && getStatus() === 200, 'Super Admin passes authorization override on foreign portfolio pages');
  }

  // ====================================================
  // TEST 10: Express App Integration
  // ====================================================
  console.log('\nTest 10: Express App Mount & Integration');
  const app = createApp({
    jwtAccessSecret: JWT_ACCESS_SECRET,
    jwtRefreshSecret: 'refresh_secret_32_characters_minimum',
  });

  const hasPortfolios = app._router.stack.some(
    (layer) => layer.regexp && layer.regexp.test('/api/v1/portfolios')
  );
  check(hasPortfolios, 'Portfolio router mounted at /api/v1/portfolios');

  // Restore stubs
  Workspace.findById = origWsFindById;
  Portfolio.findById = origPortFindById;

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

runTests().catch((err) => {
  console.error('Fatal test error in Milestone 4.2 suite:', err);
  process.exit(1);
});
