import { describeErrorCode, isKnownErrorCode } from "./errorCodes.js";

// The single error type services are allowed to throw.
//
// Services own the business rules, so they decide *what* went wrong. They must
// not decide how it is rendered: no HTTP status, no wording, no response
// shape. They throw an AppError carrying a code, and the error middleware
// turns it into the HTTP response, translated into the caller's language.
export class AppError extends Error {
  constructor(code, { details = null, cause = null, params = {} } = {}) {
    const descriptor = describeErrorCode(code);
    super(code);

    this.name = "AppError";
    this.code = isKnownErrorCode(code) ? code : "INTERNAL_ERROR";
    this.status = descriptor.status;
    this.messageKey = descriptor.messageKey;
    // Free-form payload for the client, such as the list of invalid fields.
    this.details = details;
    // Interpolation values for the translated message.
    this.params = params;
    this.cause = cause;
    this.isOperational = true;

    Error.captureStackTrace?.(this, AppError);
  }
}

// Shorthand used throughout the service layer.
export const fail = (code, options) => {
  throw new AppError(code, options);
};
