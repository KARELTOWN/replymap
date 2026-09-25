// Catalogue of application error codes.
//
// A code is a stable contract shared with every client: the dashboard, the
// embedded widget and any future integration. Clients branch on the code, and
// only display the message, which is translated at response time.
//
// Rules:
//   - a code is never renamed nor reused for a different meaning;
//   - `status` is the HTTP status the code maps to;
//   - `messageKey` points into shared/i18n/locales/*.json.
//
// See docs/architecture/error-codes.md for the full reference.

export const ERROR_CODES = Object.freeze({
  // --- Generic ------------------------------------------------------------
  INTERNAL_ERROR: { status: 500, messageKey: "errors.internal" },
  VALIDATION_FAILED: { status: 422, messageKey: "errors.validationFailed" },
  NOT_FOUND: { status: 404, messageKey: "errors.notFound" },
  RATE_LIMITED: { status: 429, messageKey: "errors.rateLimited" },

  // --- Authentication and session -----------------------------------------
  AUTH_REQUIRED: { status: 401, messageKey: "errors.authRequired" },
  AUTH_INVALID_CREDENTIALS: { status: 403, messageKey: "errors.invalidCredentials" },
  AUTH_CURRENT_PASSWORD_INVALID: { status: 403, messageKey: "errors.currentPasswordInvalid" },
  AUTH_ACCOUNT_UNAVAILABLE: { status: 403, messageKey: "errors.accountUnavailable" },
  AUTH_TOKEN_REVOKED: { status: 403, messageKey: "errors.tokenRevoked" },
  AUTH_TOKEN_EXPIRED: { status: 403, messageKey: "errors.tokenExpired" },
  AUTH_REFRESH_TOKEN_REQUIRED: { status: 422, messageKey: "errors.refreshTokenRequired" },
  AUTH_REFRESH_TOKEN_INVALID: { status: 401, messageKey: "errors.refreshTokenInvalid" },
  AUTH_CSRF_INVALID: { status: 403, messageKey: "errors.csrfInvalid" },
  AUTH_WIDGET_SCOPE: { status: 403, messageKey: "errors.widgetScope" },
  AUTH_EMAIL_TAKEN: { status: 409, messageKey: "errors.emailTaken" },
  AUTH_CODE_INVALID: { status: 422, messageKey: "errors.codeInvalid" },
  AUTH_CODE_EXPIRED: { status: 422, messageKey: "errors.codeExpired" },
  AUTH_RESET_LINK_INVALID: { status: 403, messageKey: "errors.resetLinkInvalid" },
  AUTH_RESET_LINK_EXPIRED: { status: 403, messageKey: "errors.resetLinkExpired" },
  AUTH_PASSWORD_REUSED: { status: 422, messageKey: "errors.passwordReused" },

  // --- Projects and membership --------------------------------------------
  PROJECT_NOT_FOUND: { status: 404, messageKey: "errors.projectNotFound" },
  PROJECT_INVALID: { status: 422, messageKey: "errors.projectInvalid" },
  PROJECT_REQUIRED: { status: 422, messageKey: "errors.projectRequired" },
  PROJECT_NOT_MEMBER: { status: 403, messageKey: "errors.projectNotMember" },
  PROJECT_OWNER_ONLY: { status: 403, messageKey: "errors.projectOwnerOnly" },
  PROJECT_MEMBER_EXISTS: { status: 409, messageKey: "errors.projectMemberExists" },
  PROJECT_MEMBER_MISSING: { status: 404, messageKey: "errors.projectMemberMissing" },
  PROJECT_OWNER_CANNOT_LEAVE: { status: 403, messageKey: "errors.projectOwnerCannotLeave" },
  PROJECT_LINK_EXISTS: { status: 409, messageKey: "errors.projectLinkExists" },
  PROJECT_NAME_EXISTS: { status: 409, messageKey: "errors.projectNameExists" },
  PROJECT_LINK_LOCKED: { status: 409, messageKey: "errors.projectLinkLocked" },
  GUEST_FEEDBACK_CLOSED: { status: 403, messageKey: "errors.guestFeedbackClosed" },

  // --- Accounts ------------------------------------------------------------
  USER_NOT_FOUND: { status: 404, messageKey: "errors.userNotFound" },
  USER_INACTIVE: { status: 422, messageKey: "errors.userInactive" },

  // --- Feedback ------------------------------------------------------------
  FEEDBACK_NOT_FOUND: { status: 404, messageKey: "errors.feedbackNotFound" },
  FEEDBACK_INVALID: { status: 422, messageKey: "errors.feedbackInvalid" },
  FEEDBACK_SCREENSHOT_REQUIRED: { status: 422, messageKey: "errors.screenshotRequired" },
  FEEDBACK_NO_CHANGES: { status: 422, messageKey: "errors.noChanges" },

  // --- Tracking ingestion ---------------------------------------------------
  TRACKING_DISABLED: { status: 403, messageKey: "errors.trackingDisabled" },
  TRACKING_ORIGIN_REJECTED: { status: 403, messageKey: "errors.originRejected" },
  TRACKING_QUOTA_EXCEEDED: { status: 429, messageKey: "errors.quotaExceeded" },
  TRACKING_HOST_BLOCKED: { status: 403, messageKey: "errors.hostBlocked" },
  INSTALLATION_HOST_UNKNOWN: { status: 404, messageKey: "errors.hostUnknown" },

  // --- Integrations ---------------------------------------------------------
  INTEGRATION_UNKNOWN: { status: 422, messageKey: "errors.integrationUnknown" },
  INTEGRATION_NOT_CONNECTED: { status: 404, messageKey: "errors.integrationNotConnected" },
  INTEGRATION_ALREADY_LINKED: { status: 409, messageKey: "errors.integrationAlreadyLinked" },
  INTEGRATION_REMOTE_FAILURE: { status: 502, messageKey: "errors.integrationRemoteFailure" },
  INTEGRATION_ALREADY_CONNECTED: { status: 409, messageKey: "errors.integrationAlreadyConnected" },
  INTEGRATION_EXPIRED: { status: 409, messageKey: "errors.integrationExpired" },
  INTEGRATION_TOKEN_REUSED: { status: 409, messageKey: "errors.integrationTokenReused" },
  INTEGRATION_BOARD_REQUIRED: { status: 409, messageKey: "errors.integrationBoardRequired" },
  INTEGRATION_STATUS_UNKNOWN: { status: 422, messageKey: "errors.integrationStatusUnknown" },
});

export const isKnownErrorCode = (code) =>
  Object.prototype.hasOwnProperty.call(ERROR_CODES, code);

export const describeErrorCode = (code) =>
  ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;
