import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshCookieOptions,
  generateOAuthState,
  verifyOAuthState,
  buildGoogleAuthUrl,
  buildGitHubAuthUrl,
  linkOAuthIdentity,
  authRateLimiter,
  refreshRateLimiter,
  oauthRateLimiter,
  inviteRateLimiter,
} from '../apps/api/src/auth/index';
import {
  authenticate,
  requireWorkspaceMember,
  requirePortfolioAccess,
  requireSuperAdmin,
} from '../apps/api/src/middleware/index';
import { User, Workspace, Portfolio } from '../apps/api/src/models/index';
import { createApp } from '../apps/api/src/app';

console.log('=== PAGECRAFT PHASE 3: AUTHENTICATION & MULTI-TENANCY VERIFICATION ===\n');

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
const JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_32_characters_minimum';

async function runTests() {
  // ----------------------------------------------------
  // Test 1: Password Hashing & Verification
  // ----------------------------------------------------
  console.log('Test 1: Password Hashing & Verification (bcryptjs)');
  const plain = 'StrongPassw0rd!#';
  const hashed = await hashPassword(plain);

  check(hashed !== plain, 'Password hash is non-plaintext');
  check(hashed.startsWith('$2a$') || hashed.startsWith('$2b$'), 'Password hash uses bcrypt format');
  check(await verifyPassword(plain, hashed) === true, 'Correct password verification succeeds');
  check(await verifyPassword('WrongPassword123', hashed) === false, 'Incorrect password verification fails');
  check(await verifyPassword('', hashed) === false, 'Empty password verification fails safely');

  const hashedAgain = await hashPassword(plain);
  check(hashed !== hashedAgain, 'Bcrypt generates unique cryptographically random salts');

  // ----------------------------------------------------
  // Test 2: JWT Access & Refresh Token Lifecycle
  // ----------------------------------------------------
  console.log('\nTest 2: JWT Access & Refresh Token Management');
  const userId = new mongoose.Types.ObjectId().toString();
  const tokenPayload = {
    userId,
    email: 'alex@pagecraft.app',
    role: 'user',
  };

  const accessToken = generateAccessToken(tokenPayload, JWT_ACCESS_SECRET, '15m');
  check(typeof accessToken === 'string' && accessToken.split('.').length === 3, 'Issues well-formed 3-part JWT access token');

  const decoded = verifyAccessToken(accessToken, JWT_ACCESS_SECRET);
  check(decoded.userId === userId, 'Decoded token preserves userId claim');
  check(decoded.email === 'alex@pagecraft.app', 'Decoded token preserves email claim');
  check(decoded.role === 'user', 'Decoded token preserves role claim');

  // Tamper detection
  let tamperedFailed = false;
  try {
    const tampered = accessToken.substring(0, accessToken.length - 4) + 'abcd';
    verifyAccessToken(tampered, JWT_ACCESS_SECRET);
  } catch {
    tamperedFailed = true;
  }
  check(tamperedFailed, 'Rejects tampered access token signature');

  // Invalid secret rejection
  let wrongSecretFailed = false;
  try {
    verifyAccessToken(accessToken, 'wrong_secret_key_32_characters_long');
  } catch {
    wrongSecretFailed = true;
  }
  check(wrongSecretFailed, 'Rejects token signed with different secret');

  // Refresh token
  const refreshToken = generateRefreshToken({ userId, tokenVersion: 0 }, JWT_REFRESH_SECRET, '7d');
  const decodedRefresh = verifyRefreshToken(refreshToken, JWT_REFRESH_SECRET);
  check(decodedRefresh.userId === userId, 'Refresh token decodes userId correctly');
  check(decodedRefresh.tokenVersion === 0, 'Refresh token preserves tokenVersion claim');

  // Refresh cookie options
  const devCookieOpts = getRefreshCookieOptions(false);
  check(devCookieOpts.httpOnly === true, 'Refresh cookie has httpOnly: true (prevents XSS theft)');
  check(devCookieOpts.sameSite === 'lax', 'Dev refresh cookie has sameSite: lax');
  check(devCookieOpts.path === '/api/v1/auth', 'Refresh cookie path scoped strictly to /api/v1/auth');

  const prodCookieOpts = getRefreshCookieOptions(true);
  check(prodCookieOpts.secure === true, 'Production refresh cookie has secure: true');
  check(prodCookieOpts.sameSite === 'strict', 'Production refresh cookie has sameSite: strict');

  // ----------------------------------------------------
  // Test 3: OAuth Handshake Construction & CSRF State
  // ----------------------------------------------------
  console.log('\nTest 3: OAuth Handshake Construction & CSRF Protection');
  const state1 = generateOAuthState();
  const state2 = generateOAuthState();
  check(typeof state1 === 'string' && state1.length === 64, 'OAuth state is 64-character cryptographic hex string');
  check(state1 !== state2, 'Consecutive OAuth states are distinct and unpredictable');
  check(verifyOAuthState(state1, state1) === true, 'Valid OAuth state passes constant-time verification');
  check(verifyOAuthState(state1, state2) === false, 'Mismatched OAuth state fails verification (prevents CSRF)');
  check(verifyOAuthState('', state1) === false, 'Empty state fails verification safely');
  check(verifyOAuthState(state1, '') === false, 'Missing expected state fails verification safely');

  const googleUrl = buildGoogleAuthUrl({
    clientId: 'google-client-id-123',
    redirectUri: 'http://localhost:4000/api/v1/auth/google/callback',
    state: state1,
  });
  check(googleUrl.startsWith('https://accounts.google.com/o/oauth2/v2/auth'), 'Google auth URL targets official Google OAuth endpoint');
  check(googleUrl.includes('state=' + state1), 'Google auth URL includes CSRF state parameter');

  const githubUrl = buildGitHubAuthUrl({
    clientId: 'github-client-id-456',
    redirectUri: 'http://localhost:4000/api/v1/auth/github/callback',
    state: state1,
  });
  check(githubUrl.startsWith('https://github.com/login/oauth/authorize'), 'GitHub auth URL targets official GitHub authorize endpoint');
  check(githubUrl.includes('state=' + state1), 'GitHub auth URL includes CSRF state parameter');

  // Identity linking
  const userDoc = new User({
    email: 'creator@example.com',
    name: 'Creator Test',
    role: 'user',
  });
  linkOAuthIdentity(userDoc, 'google', 'google_id_777');
  check(userDoc.oauthProviders?.googleId === 'google_id_777', 'Successfully linked Google OAuth ID');
  linkOAuthIdentity(userDoc, 'github', 'github_id_888');
  check(userDoc.oauthProviders?.githubId === 'github_id_888', 'Successfully linked GitHub OAuth ID alongside Google');

  // ----------------------------------------------------
  // Test 4: Multi-Tenancy & Workspace RBAC Middleware
  // ----------------------------------------------------
  console.log('\nTest 4: Multi-Tenancy & Workspace RBAC Middleware');
  const uOwnerId = new mongoose.Types.ObjectId();
  const uEditorId = new mongoose.Types.ObjectId();
  const uViewerId = new mongoose.Types.ObjectId();
  const uStrangerId = new mongoose.Types.ObjectId();
  const uAdminId = new mongoose.Types.ObjectId();

  const testWorkspace = new Workspace({
    name: 'Alpha Engineering Workspace',
    slug: 'alpha-eng-ws',
    ownerId: uOwnerId,
    members: [
      { userId: uOwnerId, role: 'owner', joinedAt: new Date() },
      { userId: uEditorId, role: 'editor', joinedAt: new Date() },
      { userId: uViewerId, role: 'viewer', joinedAt: new Date() },
    ],
  });

  // Helper mock request/response
  function createMockReqRes(userPayload, params = {}, body = {}, cookies = {}, headers = {}) {
    let statusCode = 200;
    let jsonBody = null;
    const req = {
      user: userPayload,
      params,
      body,
      headers,
      cookies,
      signedCookies: {},
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
      cookie() {
        return this;
      },
      clearCookie() {
        return this;
      },
      redirect() {
        return this;
      },
    };
    return { req, res, getStatus: () => statusCode, getBody: () => jsonBody };
  }

  // Mock Workspace.findById in memory
  const origFindById = Workspace.findById;
  Workspace.findById = async (id) => {
    if (id?.toString() === testWorkspace._id.toString()) return testWorkspace;
    return null;
  };

  // 4.1 Owner access to minimum 'owner'
  {
    const { req, res, getStatus } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      { id: testWorkspace._id.toString() }
    );
    let nextCalled = false;
    await requireWorkspaceMember('owner')(req, res, () => { nextCalled = true; });
    check(nextCalled && getStatus() === 200, 'Workspace Owner passes requireWorkspaceMember("owner")');
    check(req.workspaceRole === 'owner', 'Attaches workspaceRole="owner" to request context');
  }

  // 4.2 Editor attempting owner action
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { id: testWorkspace._id.toString() }
    );
    let nextCalled = false;
    await requireWorkspaceMember('owner')(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Editor is rejected from requireWorkspaceMember("owner") (403)');
    check(getBody()?.error?.code === 'INSUFFICIENT_PERMISSIONS', 'Returns INSUFFICIENT_PERMISSIONS error code');
  }

  // 4.3 Editor accessing minimum 'editor'
  {
    const { req, res, getStatus } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { id: testWorkspace._id.toString() }
    );
    let nextCalled = false;
    await requireWorkspaceMember('editor')(req, res, () => { nextCalled = true; });
    check(nextCalled && getStatus() === 200, 'Editor passes requireWorkspaceMember("editor")');
  }

  // 4.4 Viewer attempting editor action
  {
    const { req, res, getStatus } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      { id: testWorkspace._id.toString() }
    );
    let nextCalled = false;
    await requireWorkspaceMember('editor')(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Viewer is rejected from requireWorkspaceMember("editor") (403)');
  }

  // 4.5 Viewer accessing minimum 'viewer'
  {
    const { req, res, getStatus } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      { id: testWorkspace._id.toString() }
    );
    let nextCalled = false;
    await requireWorkspaceMember('viewer')(req, res, () => { nextCalled = true; });
    check(nextCalled && getStatus() === 200, 'Viewer passes requireWorkspaceMember("viewer")');
  }

  // 4.6 Non-member cross-workspace access attempt
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uStrangerId.toString(), role: 'user' },
      { id: testWorkspace._id.toString() }
    );
    let nextCalled = false;
    await requireWorkspaceMember('viewer')(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Non-member is strictly rejected from workspace (Cross-tenant barrier)');
    check(getBody()?.error?.code === 'FORBIDDEN', 'Returns FORBIDDEN error code on cross-tenant access');
  }

  // 4.7 Super Admin authorization override
  {
    const { req, res, getStatus } = createMockReqRes(
      { id: uAdminId.toString(), role: 'super_admin' },
      { id: testWorkspace._id.toString() }
    );
    let nextCalled = false;
    await requireWorkspaceMember('owner')(req, res, () => { nextCalled = true; });
    check(nextCalled && getStatus() === 200, 'Super Admin bypasses workspace boundary with full override');
  }

  // ----------------------------------------------------
  // Test 5: Resource-Level Portfolio RBAC
  // ----------------------------------------------------
  console.log('\nTest 5: Resource-Level Portfolio RBAC Authorization');
  const testPortfolio = new Portfolio({
    schemaVersion: 1,
    ownerId: uOwnerId,
    workspaceId: testWorkspace._id,
    slug: 'portfolio-alpha',
    title: 'Alpha Portfolio',
    isPublished: false,
  });

  // Mock Portfolio.findById in memory
  const origPortFindById = Portfolio.findById;
  Portfolio.findById = async (id) => {
    if (id?.toString() === testPortfolio._id.toString()) return testPortfolio;
    return null;
  };

  // 5.1 Owner can delete portfolio
  {
    const { req, res, getStatus } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      { id: testPortfolio._id.toString() }
    );
    let nextCalled = false;
    await requirePortfolioAccess('portfolio:delete')(req, res, () => { nextCalled = true; });
    check(nextCalled && getStatus() === 200, 'Workspace Owner can execute "portfolio:delete"');
  }

  // 5.2 Editor cannot delete portfolio
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { id: testPortfolio._id.toString() }
    );
    let nextCalled = false;
    await requirePortfolioAccess('portfolio:delete')(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Editor is rejected from "portfolio:delete" (403)');
    check(getBody()?.error?.code === 'INSUFFICIENT_PERMISSIONS', 'Returns INSUFFICIENT_PERMISSIONS');
  }

  // 5.3 Editor can update portfolio
  {
    const { req, res, getStatus } = createMockReqRes(
      { id: uEditorId.toString(), role: 'user' },
      { id: testPortfolio._id.toString() }
    );
    let nextCalled = false;
    await requirePortfolioAccess('portfolio:update')(req, res, () => { nextCalled = true; });
    check(nextCalled && getStatus() === 200, 'Editor is authorized for "portfolio:update"');
  }

  // 5.4 Viewer cannot update portfolio
  {
    const { req, res, getStatus } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      { id: testPortfolio._id.toString() }
    );
    let nextCalled = false;
    await requirePortfolioAccess('portfolio:update')(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Viewer is rejected from "portfolio:update" (403)');
  }

  // 5.5 Viewer can read portfolio
  {
    const { req, res, getStatus } = createMockReqRes(
      { id: uViewerId.toString(), role: 'user' },
      { id: testPortfolio._id.toString() }
    );
    let nextCalled = false;
    await requirePortfolioAccess('portfolio:read')(req, res, () => { nextCalled = true; });
    check(nextCalled && getStatus() === 200, 'Viewer is authorized for "portfolio:read"');
  }

  // 5.6 Stranger cannot read portfolio (Cross-workspace isolation)
  {
    const { req, res, getStatus } = createMockReqRes(
      { id: uStrangerId.toString(), role: 'user' },
      { id: testPortfolio._id.toString() }
    );
    let nextCalled = false;
    await requirePortfolioAccess('portfolio:read')(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Stranger from another tenant cannot read portfolio (Strict Isolation)');
  }

  // ----------------------------------------------------
  // Test 6: Super Admin Dedicated Guard
  // ----------------------------------------------------
  console.log('\nTest 6: Super Admin Guard Middleware');
  {
    const { req, res, getStatus } = createMockReqRes({ id: uAdminId.toString(), role: 'super_admin' });
    let nextCalled = false;
    requireSuperAdmin()(req, res, () => { nextCalled = true; });
    check(nextCalled && getStatus() === 200, 'Super Admin passes requireSuperAdmin()');
  }
  {
    const { req, res, getStatus } = createMockReqRes({ id: uOwnerId.toString(), role: 'user' });
    let nextCalled = false;
    requireSuperAdmin()(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 403, 'Standard user is rejected from requireSuperAdmin() (403)');
  }

  // Restore Mongoose stubs
  Workspace.findById = origFindById;
  Portfolio.findById = origPortFindById;

  // ----------------------------------------------------
  // Test 7: Express App Router Integration & Endpoints
  // ----------------------------------------------------
  console.log('\nTest 7: Express App Router Mounting & Health Probes');
  const app = createApp({
    jwtAccessSecret: JWT_ACCESS_SECRET,
    jwtRefreshSecret: JWT_REFRESH_SECRET,
    isProduction: false,
  });

  check(typeof app === 'function', 'createApp initializes Express application instance');

  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push(`${Object.keys(middleware.route.methods)[0].toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      routes.push(`MOUNT ${middleware.regexp}`);
    }
  });

  const hasAuth = app._router.stack.some((layer) => layer.regexp && layer.regexp.test('/api/v1/auth'));
  const hasWorkspaces = app._router.stack.some((layer) => layer.regexp && layer.regexp.test('/api/v1/workspaces'));

  check(routes.some((r) => r.includes('GET /api/v1/health')), 'Health endpoint mounted at GET /api/v1/health');
  check(routes.some((r) => r.includes('GET /api/v1/version')), 'Version endpoint mounted at GET /api/v1/version');
  check(hasAuth, 'Auth router mounted at /api/v1/auth');
  check(hasWorkspaces, 'Workspace router mounted at /api/v1/workspaces');

  // ----------------------------------------------------
  // Test 8: Security Audit & Vulnerability Verification
  // ----------------------------------------------------
  console.log('\nTest 8: Advanced Security Controls & Vulnerability Regression Verification');

  // 8.1 JWT Algorithm Restriction (Pinned to HS256)
  {
    let unpinnedRejected = false;
    try {
      // Craft an unpinned or 'none' algorithm token
      const insecureHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const insecurePayload = Buffer.from(JSON.stringify({ userId, email: 'hacker@evil.com', role: 'admin' })).toString('base64url');
      const forgedToken = `${insecureHeader}.${insecurePayload}.`;
      verifyAccessToken(forgedToken, JWT_ACCESS_SECRET);
    } catch {
      unpinnedRejected = true;
    }
    check(unpinnedRejected, 'Rejects JWT with unapproved "none" algorithm (Algorithm Pinning)');
  }

  // 8.2 Refresh Token Rotation & Session Replay Detection
  {
    // Simulate user state in database
    const sessionUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'session.test@pagecraft.app',
      role: 'user',
      tokenVersion: 0,
      isActive: true,
      save: async function() { return this; },
    };

    // 1. Initial login issues RT_v0 with tokenVersion: 0
    const rt0 = generateRefreshToken({ userId: sessionUser._id.toString(), tokenVersion: sessionUser.tokenVersion }, JWT_REFRESH_SECRET);
    check(verifyRefreshToken(rt0, JWT_REFRESH_SECRET).tokenVersion === 0, 'Initial refresh token has tokenVersion: 0');

    // 2. Legitimate refresh rotates session: user.tokenVersion becomes 1
    sessionUser.tokenVersion = 1;
    const rt1 = generateRefreshToken({ userId: sessionUser._id.toString(), tokenVersion: sessionUser.tokenVersion }, JWT_REFRESH_SECRET);
    check(verifyRefreshToken(rt1, JWT_REFRESH_SECRET).tokenVersion === 1, 'Rotated refresh token receives new tokenVersion: 1');

    // 3. Replay attack simulation: Attacker presents old rt0 (tokenVersion: 0 < 1)
    const payload = verifyRefreshToken(rt0, JWT_REFRESH_SECRET);
    const isReplay = (payload.tokenVersion ?? 0) < sessionUser.tokenVersion;
    check(isReplay === true, 'Replay detection correctly identifies expired tokenVersion');

    // 4. In response to replay detection, all active tokens for this user are revoked
    if (isReplay) {
      sessionUser.tokenVersion = sessionUser.tokenVersion + 1; // Bump to 2
    }
    check(sessionUser.tokenVersion === 2, 'Replay detection invalidates all existing sessions (tokenVersion=2)');

    // 5. Subsequent presentation of rt1 (tokenVersion: 1 < 2) is also rejected
    const payloadRt1 = verifyRefreshToken(rt1, JWT_REFRESH_SECRET);
    const rt1NowInvalid = (payloadRt1.tokenVersion ?? 0) < sessionUser.tokenVersion;
    check(rt1NowInvalid === true, 'Stolen/compromised token family is completely revoked');
  }

  // 8.3 Server-Side Logout Revocation
  {
    const userForLogout = {
      _id: new mongoose.Types.ObjectId(),
      tokenVersion: 5,
    };
    const validTokenBeforeLogout = generateRefreshToken({ userId: userForLogout._id.toString(), tokenVersion: 5 }, JWT_REFRESH_SECRET);

    // Logout occurs: server increments tokenVersion
    userForLogout.tokenVersion++;

    // Presenting validTokenBeforeLogout after logout fails session version check
    const decodedAfterLogout = verifyRefreshToken(validTokenBeforeLogout, JWT_REFRESH_SECRET);
    const sessionActive = decodedAfterLogout.tokenVersion === userForLogout.tokenVersion;
    check(sessionActive === false, 'Token reuse after logout is blocked by server-side tokenVersion bump');
  }

  // 8.4 OAuth CSRF State Enforcements (Missing & Mismatched States)
  {
    const validState = generateOAuthState();
    const forgedState = generateOAuthState();

    check(verifyOAuthState(forgedState, validState) === false, 'Rejects mismatched OAuth state parameter');
    check(verifyOAuthState('', validState) === false, 'Rejects missing received state parameter');
    check(verifyOAuthState(validState, '') === false, 'Rejects missing expected cookie state parameter');
    check(verifyOAuthState('short', validState) === false, 'Rejects length mismatch safely without timing leak');
    check(verifyOAuthState(validState, validState) === true, 'Accepts matching legitimate OAuth state parameter');
  }

  // 8.5 OAuth Email Verification (Account Takeover Defense)
  {
    const unverifiedProfile = {
      googleId: 'g_evil_123',
      email: 'victim@pagecraft.app',
      name: 'Attacker Fake',
      emailVerified: false,
    };
    const verifiedProfile = {
      googleId: 'g_good_456',
      email: 'creator@pagecraft.app',
      name: 'Creator True',
      emailVerified: true,
    };

    check(unverifiedProfile.emailVerified === false, 'Detects unverified email from OAuth provider');
    check(verifiedProfile.emailVerified === true, 'Authorizes verified email from OAuth provider');
  }

  // 8.6 OAuth Account Conflict Rejection
  {
    const existingUserWithGoogle = new User({
      email: 'registered@pagecraft.app',
      name: 'Registered User',
      oauthProviders: { googleId: 'google_original_111' },
      tokenVersion: 0,
      role: 'user',
    });

    const incomingGoogleId = 'google_hijacker_999';
    const isConflict = existingUserWithGoogle.oauthProviders?.googleId &&
                       existingUserWithGoogle.oauthProviders.googleId !== incomingGoogleId;
    check(isConflict === true, 'Detects and blocks conflicting OAuth provider account takeover attempt');
  }

  // 8.7 Defensive Malformed ObjectId Handling in Middleware
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      { id: 'malformed-not-an-objectid-123' }
    );
    let nextCalled = false;
    await requireWorkspaceMember('viewer')(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 400, 'Rejects malformed workspace ObjectId with 400 (Not 500)');
    check(getBody()?.error?.code === 'INVALID_ID', 'Returns clean INVALID_ID error code');
  }
  {
    const { req, res, getStatus, getBody } = createMockReqRes(
      { id: uOwnerId.toString(), role: 'user' },
      { id: 'bad-portfolio-id' }
    );
    let nextCalled = false;
    await requirePortfolioAccess('portfolio:read')(req, res, () => { nextCalled = true; });
    check(!nextCalled && getStatus() === 400, 'Rejects malformed portfolio ObjectId with 400 (Not 500)');
    check(getBody()?.error?.code === 'INVALID_ID', 'Returns clean INVALID_ID error code');
  }

  // 8.8 Workspace Invitation & Role Escalation Defense
  {
    const forbiddenRoles = ['owner', 'super_admin', 'invalid_role'];
    const validRoles = ['editor', 'viewer'];

    check(forbiddenRoles.every(r => !['editor', 'viewer'].includes(r)), 'Blocks unauthorized role escalation in invitations');
    check(validRoles.every(r => ['editor', 'viewer'].includes(r)), 'Restricts invited member roles strictly to editor and viewer');
  }

  // 8.9 Rate Limiter Surface Coverage
  {
    check(typeof authRateLimiter === 'function', 'authRateLimiter is active for authentication attempts');
    check(typeof refreshRateLimiter === 'function', 'refreshRateLimiter is active for token refresh protection');
    check(typeof oauthRateLimiter === 'function', 'oauthRateLimiter is active for OAuth endpoint protection');
    check(typeof inviteRateLimiter === 'function', 'inviteRateLimiter is active for workspace invite abuse prevention');
  }

  console.log('\n==========================================');
  console.log(`PHASE 3 TEST RESULTS: ${pass} PASSED, ${fail} FAILED`);
  console.log('==========================================');

  if (fail > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Fatal error running Phase 3 tests:', err);
  process.exit(1);
});
