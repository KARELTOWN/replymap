import { REFRESH_TOKEN_TTL_DAYS } from "../../services/auth/authSessionService.js";

// Session cookies, on the model of the Horizon API.
//
//   refresh_token  HttpOnly, sent to the auth routes only: no script, ours or a
//                  compromised dependency's, can read it.
//   refresh_csrf   readable by our pages, which echo it in `X-Refresh-CSRF`.
//
// The dashboard and the SSO window live on the same site as the API
// (`*.bugreveal.com`, or `localhost` in development, where cookies ignore the
// port): a session opened in one is available in the other.
//
// Dev and staging get their own cookie names, so that sharing the parent
// domain with production never mixes sessions.

const REFRESH_PATH = "/api/auth";
const MAX_AGE_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

const environment = () => process.env.ENVIRONMENT || "local";
const isLocal = () => environment() === "local";

const suffix = () => (["dev", "staging"].includes(environment()) ? `_${environment()}` : "");

export const refreshCookieName = () => `refresh_token${suffix()}`;
export const csrfCookieName = () => `refresh_csrf${suffix()}`;

// Local: plain HTTP on one site, so Strict works. Elsewhere the SSO window and
// the dashboard call the API cross-origin: None, which requires Secure.
const securityOptions = () =>
  isLocal()
    ? { secure: false, sameSite: "strict" }
    : { secure: true, sameSite: "none", domain: process.env.COOKIE_DOMAIN || undefined };

export const setAuthCookies = (res, { refreshToken, csrfToken }) => {
  const security = securityOptions();
  res.cookie(refreshCookieName(), refreshToken, {
    ...security,
    httpOnly: true,
    path: REFRESH_PATH,
    maxAge: MAX_AGE_MS,
  });
  res.cookie(csrfCookieName(), csrfToken, {
    ...security,
    httpOnly: false,
    path: "/",
    maxAge: MAX_AGE_MS,
  });
};

export const clearAuthCookies = (res) => {
  const security = securityOptions();
  res.clearCookie(refreshCookieName(), { ...security, httpOnly: true, path: REFRESH_PATH });
  res.clearCookie(csrfCookieName(), { ...security, path: "/" });
};
