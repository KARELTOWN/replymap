import crypto from "crypto";
import jwt from "jsonwebtoken";
import * as userRepository from "../../repositories/userRepository.js";
import * as refreshTokenRepository from "../../repositories/refreshTokenRepository.js";
import { AppError } from "../../shared/errors/appError.js";
import { revokeAccessToken } from "./tokenService.js";

// Lifetime of a signed-in session, on the model of the Horizon API.
//
//   - the access token is a JWT of 15 minutes, sent as a Bearer header;
//   - the refresh token is an opaque random value of 30 days, stored hashed,
//     travelling only in an HttpOnly cookie that no script can read;
//   - every refresh rotates it. A token already used stays accepted for 30
//     seconds, so two tabs refreshing at once do not sign each other out;
//     reused within that window, the successor it produced is revoked, so a
//     session never forks into two valid chains;
//   - a CSRF value, readable by our own pages only, must come back in the
//     `X-Refresh-CSRF` header: another site can make the browser send the
//     cookie, it cannot read the value.
//
// The previous refresh token was a JWT kept in localStorage: readable by any
// script of the page, never rotated, valid 30 days from sign-in.

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

// The widget lives on the customer's website: no cookie, so no silent refresh.
// Its token therefore lasts longer than a dashboard one, and in exchange it is
// tied to a single project and opens only the routes the widget needs.
export const WIDGET_AUDIENCE = "widget";
export const WIDGET_TOKEN_TTL_SECONDS = 12 * 60 * 60;
export const REFRESH_TOKEN_TTL_DAYS = 30;
export const GRACE_PERIOD_SECONDS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

const randomToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (value) => crypto.createHash("sha256").update(value).digest("hex");

const sameSecret = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// `jti` makes every token unique, even two issued within the same second.
export const issueAccessToken = (userId) =>
  jwt.sign({ id: userId, jti: crypto.randomUUID() }, process.env.SECRET_KEY, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });

export const issueWidgetToken = (userId, projectId) => ({
  token: jwt.sign(
    { id: userId, aud: WIDGET_AUDIENCE, project: String(projectId), jti: crypto.randomUUID() },
    process.env.SECRET_KEY,
    { expiresIn: WIDGET_TOKEN_TTL_SECONDS }
  ),
  expiresIn: WIDGET_TOKEN_TTL_SECONDS,
});

const createRefreshToken = async (userId) => {
  const value = randomToken();
  const record = await refreshTokenRepository.create({
    user_id: userId,
    token_hash: hashToken(value),
    expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * DAY_MS),
  });
  return { value, record };
};

const isInGracePeriod = (token, now) =>
  Boolean(token.revoked_at && token.replaced_by) &&
  now - new Date(token.revoked_at).getTime() < GRACE_PERIOD_SECONDS * 1000;

const isUsable = (token, now) =>
  new Date(token.expires_at).getTime() > now && (!token.revoked_at || isInGracePeriod(token, now));

const sessionPayload = (userId, refreshToken) => ({
  accessToken: issueAccessToken(userId),
  expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  refreshToken,
  csrfToken: randomToken(),
});

/** Opens a session for an account whose credentials were just checked. */
export const openSession = async (user) => {
  const { value } = await createRefreshToken(user._id);
  return sessionPayload(user._id, value);
};

/**
 * Exchanges the refresh cookie for a new access token, and rotates it.
 *
 * @param {{refreshToken?: string, csrfCookie?: string, csrfHeader?: string}} presented
 */
export const renewSession = async ({ refreshToken, csrfCookie, csrfHeader }) => {
  if (!refreshToken || !csrfCookie || !csrfHeader) throw new AppError("AUTH_REFRESH_TOKEN_INVALID");
  if (!sameSecret(csrfCookie, csrfHeader)) throw new AppError("AUTH_CSRF_INVALID");

  const now = Date.now();
  const token = await refreshTokenRepository.findByHash(hashToken(refreshToken));
  if (!token || !isUsable(token, now)) throw new AppError("AUTH_REFRESH_TOKEN_INVALID");

  // The account may have been deleted, disabled or left unverified since the
  // session opened: the whole session ends with it.
  const user = await userRepository.findById(token.user_id);
  if (!user || user.is_active === false || user.email_verified === false) {
    await refreshTokenRepository.revokeAllForUser(token.user_id, new Date(now));
    throw new AppError("AUTH_ACCOUNT_UNAVAILABLE");
  }

  const { value, record } = await createRefreshToken(user._id);
  if (isInGracePeriod(token, now)) {
    await refreshTokenRepository.revokeById(token.replaced_by, new Date(now));
  }
  await refreshTokenRepository.markReplaced(token._id, record._id, new Date(now));

  return sessionPayload(user._id, value);
};

/**
 * Ends every session of the account: every device, every tab.
 *
 * Revoking the refresh tokens is not enough. An access token is a signed JWT
 * that the API can check without asking anyone: another tab kept working with
 * it for the quarter of an hour it had left. The account therefore carries the
 * instant from which a token is accepted, and every token older than it is
 * refused on the next request.
 */
export const endAllSessions = async (userId) => {
  const now = new Date();
  await refreshTokenRepository.revokeAllForUser(userId, now);
  await userRepository.setSessionsCutoff(userId, now);
};

/**
 * Whether an access token was issued before the account's cutoff.
 *
 * `iat` counts whole seconds: the comparison is made in seconds too, so the
 * token issued right after the cutoff — the tab that changed the password, and
 * which stays signed in — is never caught by it.
 */
export const isTokenBeforeCutoff = (payload, cutoff) => {
  if (!cutoff || !payload?.iat) return false;
  return payload.iat < Math.floor(new Date(cutoff).getTime() / 1000);
};

/**
 * Signs out. The access token is blacklisted for the minutes it has left, and
 * every refresh token of the account is revoked, as in Horizon.
 */
export const endSession = async ({ accessToken, userId }) => {
  if (!accessToken) throw new AppError("AUTH_REQUIRED");
  await revokeAccessToken(accessToken);
  await endAllSessions(userId);
  return true;
};

export const readBearerToken = (req) => {
  const header = req.headers?.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
};

export default {
  issueAccessToken,
  isTokenBeforeCutoff,
  issueWidgetToken,
  openSession,
  renewSession,
  endSession,
  endAllSessions,
  readBearerToken,
};
