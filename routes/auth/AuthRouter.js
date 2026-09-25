import express from "express";
const AuthRouter = express.Router();

import {
  validateLogin,
  validateRefreshToken,
  validateLogout,
  validateWidgetToken,
  validateUpdateProfile,
  validateChangePassword,
  validateRegister,
  validateForgotPassword,
  validateResetPassword,
  validateConfirmRegister,
  validateDesaprove,
} from "../../validator/auth/authValidator.js";
import authController from "../../controllers/auth/authController.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";
import { rateLimit } from "../../services/auth/tokenService.js";
import { handle } from "../../middleware/errorHandler.js";

// Authentication routes had no limit: nothing prevented trying thousands
// of passwords or replaying refresh tokens.
const loginLimiter = rateLimit({ key: "login", max: 10, windowSeconds: 300 });
const refreshLimiter = rateLimit({ key: "refresh", max: 60, windowSeconds: 300 });
const passwordLimiter = rateLimit({ key: "password", max: 5, windowSeconds: 900 });
const registerLimiter = rateLimit({ key: "register", max: 10, windowSeconds: 900 });
// A confirmation code has 100,000 values: without a limit it is guessed.
const codeLimiter = rateLimit({ key: "confirm", max: 10, windowSeconds: 900 });

const {
  login,
  widgetToken,
  getProfile,
  updateProfile,
  changePassword,
  register,
  forgotPassword,
  refreshToken,
  desapprove,
  resetPassword,
  confirmRegister,
  deconnect
} = authController();
AuthRouter.post("/login", loginLimiter, validateLogin, handle(login));

AuthRouter.post("/register", registerLimiter, validateRegister, handle(register));

AuthRouter.post(
  "/confirm-register",
  codeLimiter,
  validateConfirmRegister,
  handle(confirmRegister)
);

AuthRouter.post(
  "/refresh-token",
  refreshLimiter,
  validateRefreshToken,
  handle(refreshToken)
);
AuthRouter.get(
  "/forgot-password/:email",
  passwordLimiter,
  validateForgotPassword,
  handle(forgotPassword)
);
AuthRouter.post(
  "/desapprouve-reinitialisation",
  passwordLimiter,
  validateDesaprove,
  handle(desapprove)
);
AuthRouter.patch("/reset-password", passwordLimiter, validateResetPassword, handle(resetPassword));
// The signed-in account, and what it may change about itself.
AuthRouter.get("/profile", isauthentificate, blacklist, handle(getProfile));
AuthRouter.put(
  "/profile",
  isauthentificate,
  blacklist,
  validateUpdateProfile,
  handle(updateProfile)
);
AuthRouter.put(
  "/password",
  isauthentificate,
  blacklist,
  passwordLimiter,
  validateChangePassword,
  handle(changePassword)
);

// The widget asks for its own session, from the SSO window, with a dashboard
// token: no `allowWidgetSession` here, so a widget token cannot renew itself.
AuthRouter.post(
  "/widget-token",
  isauthentificate,
  blacklist,
  validateWidgetToken,
  handle(widgetToken)
);

// POST: signing out receives the refresh token to revoke in the request
// body.
AuthRouter.post(
  "/deconnect",
  isauthentificate,
  blacklist,
  validateLogout,
  handle(deconnect)
);
export default AuthRouter;
