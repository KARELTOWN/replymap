import { matchedData } from "express-validator";
import authSessionService from "../../services/auth/authSessionService.js";
import accountService from "../../services/auth/accountService.js";
import ApiResponse from "../../shared/http/apiResponse.js";
import { assertValid } from "../../middleware/errorHandler.js";
import {
  setAuthCookies,
  clearAuthCookies,
  refreshCookieName,
  csrfCookieName,
} from "../../shared/http/authCookies.js";

const accounts = accountService();

// HTTP layer of authentication. Account rules live in accountService, session
// rules in authSessionService.
//
// The refresh token never appears in a response body: it travels in an
// HttpOnly cookie. Bodies carry the access token, its lifetime and the CSRF
// value the page echoes when it refreshes (see authSessionService).

// What a client needs to use a session it just opened or renewed.
const sessionBody = (session) => ({
  token: session.accessToken,
  expiresIn: session.expiresIn,
  csrfToken: session.csrfToken,
});

export default function authController() {
  const login = async (req, res) => {
    assertValid(req);
    const { email, password } = matchedData(req);
    const { session, reference } = await accounts.signIn({ email, password });

    setAuthCookies(res, session);
    return ApiResponse.ok(res, {
      messageKey: "auth.signedIn",
      data: { ...sessionBody(session), data: reference },
    });
  };

  const register = async (req, res) => {
    assertValid(req);
    const { firstname, lastname, email, password } = matchedData(req);

    const data = await accounts.register({ firstname, lastname, email, password });
    return ApiResponse.created(res, { messageKey: "auth.registered", data });
  };

  const confirmRegister = async (req, res) => {
    assertValid(req);
    const { user_id: userReference, code } = matchedData(req);

    await accounts.confirmRegistration({ userReference, code });
    return ApiResponse.ok(res, { messageKey: "auth.confirmed" });
  };

  const forgotPassword = async (req, res) => {
    assertValid(req);
    await accounts.requestPasswordReset(matchedData(req));
    return ApiResponse.ok(res, { messageKey: "auth.resetRequested" });
  };

  const desapprove = async (req, res) => {
    assertValid(req);
    await accounts.cancelPasswordReset(matchedData(req));
    return ApiResponse.ok(res, { messageKey: "auth.resetCancelled" });
  };

  const resetPassword = async (req, res) => {
    assertValid(req);
    const { token, password } = matchedData(req);

    await accounts.resetPassword({ token, password });
    return ApiResponse.ok(res, { messageKey: "auth.passwordReset" });
  };

  // A refused refresh clears the cookies, so the client stops retrying with a
  // session that is over. Not on a CSRF refusal: any site can send that
  // request, and clearing would let it sign the visitor out.
  const refreshToken = async (req, res) => {
    assertValid(req);
    const input = matchedData(req);

    try {
      const session = await authSessionService.renewSession({
        refreshToken: input[refreshCookieName()],
        csrfCookie: input[csrfCookieName()],
        csrfHeader: input["x-refresh-csrf"],
      });
      setAuthCookies(res, session);
      return ApiResponse.ok(res, { messageKey: "auth.tokenIssued", data: sessionBody(session) });
    } catch (error) {
      if (error?.code !== "AUTH_CSRF_INVALID") clearAuthCookies(res);
      throw error;
    }
  };

  // --- Profile ---------------------------------------------------------------

  const getProfile = async (req, res) => {
    const data = await accounts.profile(req.user);
    return ApiResponse.ok(res, { messageKey: "auth.profileFetched", data });
  };

  const updateProfile = async (req, res) => {
    assertValid(req);
    const { firstname, lastname } = matchedData(req);

    const data = await accounts.updateProfile({ user: req.user, firstname, lastname });
    return ApiResponse.ok(res, { messageKey: "auth.profileUpdated", data });
  };

  // The password change hands back a session, so the tab that made it stays
  // signed in while the others are closed.
  const changePassword = async (req, res) => {
    assertValid(req);
    const { current_password: currentPassword, password } = matchedData(req);

    const session = await accounts.changePassword({ user: req.user, currentPassword, password });
    setAuthCookies(res, session);
    return ApiResponse.ok(res, { messageKey: "auth.passwordChanged", data: sessionBody(session) });
  };

  // A session for the embedded widget: tied to the project, longer lived,
  // and refused on every route the widget does not need. Only a dashboard
  // session can ask for one, so a widget token cannot extend itself.
  const widgetToken = async (req, res) => {
    assertValid(req);
    const { project_id: projectId } = matchedData(req);

    const data = await accounts.openWidgetSession({ user: req.user, projectId });
    return ApiResponse.created(res, { messageKey: "auth.widgetSession", data });
  };

  // Signing out ends every session of the account, as in Horizon.
  const deconnect = async (req, res) => {
    assertValid(req);

    await authSessionService.endSession({
      accessToken: authSessionService.readBearerToken(req),
      userId: req.user._id,
    });
    clearAuthCookies(res);
    return ApiResponse.ok(res, { messageKey: "auth.signedOut" });
  };

  return {
    getProfile,
    updateProfile,
    changePassword,
    widgetToken,
    forgotPassword,
    login,
    register,
    refreshToken,
    desapprove,
    resetPassword,
    confirmRegister,
    deconnect,
  };
}
