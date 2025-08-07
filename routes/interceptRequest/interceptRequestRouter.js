import express from "express";
const interceptRequestRouter = express.Router();
import { validateCreateInterceptError, validateShowSessionErrors } from "../../validator/interceptRequest/interceptValidator.js";
const { createIntercept, getSessionInterceptErrors, getErrors } = interceptController();
import { validateLimitSkipQuery } from "../../validator/generalValidator.js";
import interceptController from "../../controllers/interceptRequest/interceptController.js";
import { blacklist } from "../../middleware/blacklist.js";
import isauthentificate from "../../middleware/isAuthentificate.js";

// Intercept Error routes
interceptRequestRouter.post(
  "/intercept_error",
  validateCreateInterceptError,
  createIntercept
);
interceptRequestRouter.put(
  "/get_session_errors",
  isauthentificate,
  blacklist,
  validateLimitSkipQuery,
  validateShowSessionErrors,
  getSessionInterceptErrors
);

export default interceptRequestRouter;

