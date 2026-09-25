import { validationResult } from "express-validator";
import { AppError } from "../shared/errors/appError.js";
import { ERROR_CODES } from "../shared/errors/errorCodes.js";
import ApiResponse from "../shared/http/apiResponse.js";
import { translate } from "../shared/i18n/index.js";

// Single exit point for every failure.
//
// Controllers used to build their own error payloads inline, so the same
// situation produced a different status and a different shape depending on the
// route. They now throw or forward an AppError and stop caring.

// Length bounds interpolated into `validation.titleLength`, kept here so the
// validator and the message cannot disagree.
const VALIDATION_PARAMS = { "validation.titleLength": { min: 3, max: 200 } };

// Turns express-validator output into an AppError. Called by controllers
// before they read the request, so validation never leaks into services.
//
// Validators carry message keys (`validation.*`), translated here into the
// caller's language, like the Horizon API validators files. A message that is
// not a key yet comes back unchanged: modules still being migrated keep their
// literal wording until their validators are converted.
export const assertValid = (req) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return;

  throw new AppError("VALIDATION_FAILED", {
    details: errors.array().map((error) => ({
      field: error.path ?? error.param,
      message: translate(String(error.msg), {
        locale: req.locale,
        params: VALIDATION_PARAMS[error.msg] || {},
      }),
    })),
  });
};

// Wraps an async controller so a rejected promise reaches this middleware
// instead of hanging the request.
//
// The wrapper borrows the controller name: an anonymous arrow would turn every
// stack trace and every route listing into a wall of "<anonymous>".
export const handle = (controller) => {
  const wrapped = (req, res, next) =>
    Promise.resolve(controller(req, res, next)).catch(next);

  Object.defineProperty(wrapped, "name", { value: controller.name || "handler" });
  return wrapped;
};

export const notFoundHandler = (req, res) =>
  ApiResponse.failure(res, {
    status: 404,
    code: "NOT_FOUND",
    message: translate(ERROR_CODES.NOT_FOUND.messageKey, { locale: req.locale }),
  });

export const errorHandler = (error, req, res, _next) => {
  const locale = req?.locale;

  if (error instanceof AppError) {
    return ApiResponse.failure(res, {
      status: error.status,
      code: error.code,
      message: translate(error.messageKey, { locale, params: error.params }),
      details: error.details,
    });
  }

  // Anything else is a defect: it is logged in full, but the client only ever
  // sees a generic message. Stack traces and driver errors must not leak.
  console.error("Unhandled error", {
    traceId: req?.id,
    path: req?.originalUrl,
    method: req?.method,
    message: error?.message,
    stack: error?.stack,
  });

  return ApiResponse.failure(res, {
    status: 500,
    code: "INTERNAL_ERROR",
    message: translate(ERROR_CODES.INTERNAL_ERROR.messageKey, { locale }),
  });
};
