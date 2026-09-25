// Session lifecycle, on the model of the Horizon API: rotation of the refresh
// token with a grace period, CSRF check, revocation at sign-out, attempt
// limiting.
import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import mongoose from "../config/mongodb.js";
import User from "../models/User.js";
import AuthRefreshToken from "../models/AuthRefreshToken.js";
import { redisClient } from "../config/redis.js";
import { revokeAccessToken, rateLimit } from "../services/auth/tokenService.js";
import {
  openSession,
  renewSession,
  endSession,
  endAllSessions,
  isTokenBeforeCutoff,
  GRACE_PERIOD_SECONDS,
} from "../services/auth/authSessionService.js";

const ACTIVE_USER = {
  _id: new mongoose.Types.ObjectId(),
  email: "membre@example.com",
  is_active: true,
  email_verified: true,
};

let currentUser = ACTIVE_USER;
User.findById = () => ({ select: () => ({ lean: async () => currentUser }) });

// The cutoff written on the account when every session is closed: an access
// token older than it is refused, which is what makes "your other devices will
// be signed out" true for the 15 minutes an access token still had to live.
let cutoff = null;
User.updateOne = async (filter, changes) => {
  if ("sessions_valid_from" in changes) cutoff = changes.sessions_valid_from;
  return { matchedCount: 1 };
};

// --- In-memory refresh token collection -----------------------------------------

const rows = new Map();
const byId = (id) => [...rows.values()].find((row) => String(row._id) === String(id));

AuthRefreshToken.create = async (payload) => {
  const row = { _id: new mongoose.Types.ObjectId(), revoked_at: null, replaced_by: null, ...payload };
  rows.set(row.token_hash, row);
  return row;
};
AuthRefreshToken.findOne = ({ token_hash }) => ({ lean: async () => rows.get(token_hash) ?? null });
AuthRefreshToken.updateOne = async (filter, changes) => {
  const row = byId(filter._id);
  if (!row) return;
  if ("revoked_at" in filter && row.revoked_at !== filter.revoked_at) return;
  Object.assign(row, changes);
};
AuthRefreshToken.updateMany = async ({ user_id }, changes) => {
  for (const row of rows.values()) {
    if (String(row.user_id) === String(user_id) && row.revoked_at === null) Object.assign(row, changes);
  }
};

// Moves every revocation back in time, as if the clock had advanced.
const ageRevocations = (seconds) => {
  for (const row of rows.values()) {
    if (row.revoked_at) row.revoked_at = new Date(row.revoked_at.getTime() - seconds * 1000);
  }
};

const renew = (session, csrf = session.csrfToken) =>
  renewSession({ refreshToken: session.refreshToken, csrfCookie: session.csrfToken, csrfHeader: csrf });

const failureCode = async (promise) => {
  try {
    await promise;
    return null;
  } catch (error) {
    return error.code;
  }
};

// --- Tokens ---------------------------------------------------------------------

test("a session gives a 15-minute access token and an opaque refresh token", async () => {
  const session = await openSession(ACTIVE_USER);

  const decoded = jwt.verify(session.accessToken, process.env.SECRET_KEY);
  assert.equal(decoded.id, String(ACTIVE_USER._id));
  assert.equal(decoded.exp - decoded.iat, 15 * 60);
  assert.equal(session.expiresIn, 15 * 60);

  // Opaque, and stored only as a hash.
  assert.match(session.refreshToken, /^[0-9a-f]{64}$/);
  assert.equal(rows.has(session.refreshToken), false);
});

test("a refresh rotates the token; the old one only survives the grace period", async () => {
  const first = await openSession(ACTIVE_USER);
  const second = await renew(first);
  assert.notEqual(second.refreshToken, first.refreshToken);

  // Two tabs refreshing at once: the second one still gets through.
  const concurrent = await renew(first);
  assert.ok(concurrent.accessToken);

  ageRevocations(GRACE_PERIOD_SECONDS + 1);
  assert.equal(await failureCode(renew(first)), "AUTH_REFRESH_TOKEN_INVALID");
});

test("reusing a token within the grace period revokes the successor it produced", async () => {
  const first = await openSession(ACTIVE_USER);
  const successor = await renew(first);
  const replacement = await renew(first);

  // No fork: only the latest chain is alive.
  assert.equal(await failureCode(renew(successor)), "AUTH_REFRESH_TOKEN_INVALID");
  assert.ok((await renew(replacement)).accessToken);
});

test("the CSRF header must match its cookie", async () => {
  const session = await openSession(ACTIVE_USER);
  assert.equal(await failureCode(renew(session, "0".repeat(64))), "AUTH_CSRF_INVALID");
  assert.equal(
    await failureCode(renewSession({ refreshToken: session.refreshToken, csrfCookie: session.csrfToken })),
    "AUTH_REFRESH_TOKEN_INVALID"
  );
  assert.equal(await failureCode(renewSession({})), "AUTH_REFRESH_TOKEN_INVALID");
});

test("a disabled account can no longer renew, and its sessions are closed", async () => {
  const session = await openSession(ACTIVE_USER);
  currentUser = { ...ACTIVE_USER, is_active: false };
  assert.equal(await failureCode(renew(session)), "AUTH_ACCOUNT_UNAVAILABLE");
  currentUser = ACTIVE_USER;

  assert.equal(await failureCode(renew(session)), "AUTH_REFRESH_TOKEN_INVALID");
});

test("signing out ends every session of the account", async () => {
  const laptop = await openSession(ACTIVE_USER);
  const phone = await openSession(ACTIVE_USER);
  const access = jwt.sign({ id: String(ACTIVE_USER._id), jti: "logout" }, process.env.SECRET_KEY, {
    expiresIn: "15m",
  });

  await endSession({ accessToken: access, userId: ACTIVE_USER._id });

  assert.equal(await redisClient.get(access), "blacklist");
  assert.equal(await failureCode(renew(laptop)), "AUTH_REFRESH_TOKEN_INVALID");
  assert.equal(await failureCode(renew(phone)), "AUTH_REFRESH_TOKEN_INVALID");
});

test("closing all sessions (password reset) revokes every refresh token", async () => {
  const session = await openSession(ACTIVE_USER);
  await endAllSessions(ACTIVE_USER._id);
  assert.equal(await failureCode(renew(session)), "AUTH_REFRESH_TOKEN_INVALID");
});

test("the access tokens of the other tabs die with the session, not 15 minutes later", async () => {
  const otherTab = jwt.decode(
    jwt.sign({ id: String(ACTIVE_USER._id) }, process.env.SECRET_KEY, { expiresIn: "15m" })
  );

  await endAllSessions(ACTIVE_USER._id);

  assert.ok(cutoff instanceof Date, "the cutoff is written on the account");
  // Issued a second before the cutoff: refused on its very next request.
  assert.equal(isTokenBeforeCutoff({ ...otherTab, iat: otherTab.iat - 1 }, cutoff), true);
  // The tab that changed the password receives a token issued after it.
  assert.equal(isTokenBeforeCutoff({ iat: Math.floor(cutoff.getTime() / 1000) }, cutoff), false);
  // An account that never closed its sessions has no cutoff to compare with.
  assert.equal(isTokenBeforeCutoff(otherTab, null), false);
});

test("an expired access token is not blacklisted needlessly", async () => {
  const expired = jwt.sign({ id: String(ACTIVE_USER._id) }, process.env.SECRET_KEY, {
    expiresIn: "-1s",
  });

  assert.equal(await revokeAccessToken(expired), false);
  assert.equal(await redisClient.get(expired), null);
});

// --- Rate limiting --------------------------------------------------------------

// Runs an Express middleware and reports whether it let the request through.
const runMiddleware = async (middleware, req) => {
  const outcome = { passed: false, status: null };
  const res = { status: () => res, json: () => res, set: () => res };
  // A refusal is forwarded as an error, rendered by the error middleware.
  await middleware(req, res, (error) => {
    if (error) outcome.status = error.status;
    else outcome.passed = true;
  });
  return outcome;
};

test("sign-in attempts are capped", async () => {
  const limiter = rateLimit({ key: "test-login", max: 3, windowSeconds: 60 });
  const req = { ip: "203.0.113.7" };

  for (let attempt = 1; attempt <= 3; attempt++) {
    const outcome = await runMiddleware(limiter, req);
    assert.equal(outcome.passed, true, `attempt ${attempt} wrongly refused`);
  }

  const blocked = await runMiddleware(limiter, req);
  assert.equal(blocked.status, 429);

  // The limit is per caller: another address starts from zero.
  const other = await runMiddleware(limiter, { ip: "198.51.100.3" });
  assert.equal(other.passed, true);
});
