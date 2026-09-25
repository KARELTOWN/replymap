# Error codes

Every failure the API returns carries one of these codes. The code is a permanent
contract with the dashboard, the widget and any integration: clients branch on it,
and display the message, which is translated into the caller's language.

Source of truth: `shared/errors/errorCodes.js`. This page must list exactly the same
codes; `npm test` checks that every code has an English and a French message.

## Response shape

```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_MEMBER",
    "message": "You are not a member of this project.",
    "details": [{ "field": "title", "message": "A title is required." }],
    "traceId": "9b1c4f0e-3a7d-4e8b-9c1a-2f6d8e4b7a01"
  }
}
```

- `details` only appears on validation failures, one entry per invalid field.
- `traceId` matches the server log line and the `X-Request-Id` response header. Quote it
  in any support request.

## Rules

- A code is never renamed, and never reused for a different meaning. A new situation
  gets a new code.
- Adding a code means four edits in the same change: `errorCodes.js`, `en.json`,
  `fr.json`, and this page.
- A service throws `new AppError("CODE")`. It never chooses the status, the wording or
  the response shape.

## Catalogue

### Generic

| Code                | Status | Meaning                                                        |
| ------------------- | ------ | -------------------------------------------------------------- |
| `INTERNAL_ERROR`    | 500    | Unexpected failure. Details are in the log, never in the body. |
| `VALIDATION_FAILED` | 422    | One or more fields are invalid; see `details`.                 |
| `NOT_FOUND`         | 404    | No route or resource at this address.                          |
| `RATE_LIMITED`      | 429    | Too many attempts in the time window.                          |

### Authentication and session

| Code                          | Status | Meaning                                                       |
| ----------------------------- | ------ | ------------------------------------------------------------- |
| `AUTH_REQUIRED`               | 401    | No access token was sent.                                     |
| `AUTH_INVALID_CREDENTIALS`    | 403    | Email and password do not match.                              |
| `AUTH_CURRENT_PASSWORD_INVALID` | 403 | The current password given to change it is wrong.             |
| `AUTH_ACCOUNT_UNAVAILABLE`    | 403    | The account is deleted, disabled or not verified.             |
| `AUTH_TOKEN_REVOKED`          | 403    | The refresh token was revoked at sign-out.                    |
| `AUTH_TOKEN_EXPIRED`          | 403    | The token is expired, malformed or its signature is invalid.  |
| `AUTH_REFRESH_TOKEN_REQUIRED` | 422    | The refresh endpoint was called without a refresh token.      |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | The refresh cookie is missing, unknown, revoked or expired: sign in again. |
| `AUTH_CSRF_INVALID` | 403 | The `X-Refresh-CSRF` header does not match the `refresh_csrf` cookie. |
| `AUTH_WIDGET_SCOPE` | 403 | A widget token was presented on a route that is not open to the widget. |
| `AUTH_EMAIL_TAKEN` | 409 | An account already uses this email. |
| `AUTH_CODE_INVALID` | 422 | The confirmation code is wrong, or no confirmation is pending. |
| `AUTH_CODE_EXPIRED` | 422 | The confirmation code expired. |
| `AUTH_RESET_LINK_INVALID` | 403 | The reset link is unknown or already used. |
| `AUTH_RESET_LINK_EXPIRED` | 403 | The reset link expired. |
| `AUTH_PASSWORD_REUSED` | 422 | The new password is the current one. |

### Projects and membership

| Code                         | Status | Meaning                                                  |
| ---------------------------- | ------ | -------------------------------------------------------- |
| `PROJECT_NOT_FOUND`          | 404    | No project with this identifier.                         |
| `PROJECT_INVALID`            | 422    | The identifier is not a valid project id.                |
| `PROJECT_REQUIRED`           | 422    | The request must name a project.                         |
| `PROJECT_NOT_MEMBER`         | 403    | The account is not a member of the project.              |
| `PROJECT_OWNER_ONLY`         | 403    | Only the project owner may do this.                      |
| `PROJECT_MEMBER_EXISTS`      | 409    | The person is already a member.                          |
| `PROJECT_MEMBER_MISSING`     | 404    | The person is not a member.                              |
| `PROJECT_OWNER_CANNOT_LEAVE` | 403    | The owner cannot leave their own project.                |
| `PROJECT_LINK_EXISTS`        | 409    | The caller already owns a project with this link.        |
| `PROJECT_NAME_EXISTS`        | 409    | Another project already uses this name.                  |
| `PROJECT_LINK_LOCKED`        | 409    | The link cannot change once the project recorded data.   |
| `GUEST_FEEDBACK_CLOSED` | 403 | The project does not accept feedback from guests. |

### Accounts

| Code             | Status | Meaning                                              |
| ---------------- | ------ | ---------------------------------------------------- |
| `USER_NOT_FOUND` | 404    | No account matches the given email.                  |
| `USER_INACTIVE`  | 422    | The account exists but is inactive or not verified.  |

### Feedback

| Code                           | Status | Meaning                                           |
| ------------------------------ | ------ | ------------------------------------------------- |
| `FEEDBACK_NOT_FOUND`           | 404    | No feedback with this identifier.                 |
| `FEEDBACK_INVALID`             | 422    | The identifier is not a valid feedback id.        |
| `FEEDBACK_SCREENSHOT_REQUIRED` | 422    | A submission must include a screenshot or video.  |
| `FEEDBACK_NO_CHANGES`          | 422    | An update was sent without any editable field.    |

### Tracking ingestion

| Code                       | Status | Meaning                                                           |
| -------------------------- | ------ | ----------------------------------------------------------------- |
| `TRACKING_DISABLED`        | 403    | Tracking is turned off for the project.                           |
| `TRACKING_ORIGIN_REJECTED` | 403    | The calling site is not the registered domain of the project.     |
| `TRACKING_QUOTA_EXCEEDED`  | 429    | The project or the caller exceeded the ingestion quota.           |
| `TRACKING_HOST_BLOCKED`    | 403    | This website was switched off from the project sheet.             |
| `INSTALLATION_HOST_UNKNOWN`| 404    | This website is not one of those seen on the project.             |

### Integrations

| Code                         | Status | Meaning                                                  |
| ---------------------------- | ------ | -------------------------------------------------------- |
| `INTEGRATION_UNKNOWN`        | 422    | The integration name is not supported.                   |
| `INTEGRATION_NOT_CONNECTED`  | 404    | The project has no active connection to this tool.       |
| `INTEGRATION_ALREADY_LINKED` | 409    | The feedback already has a card in the external tool.    |
| `INTEGRATION_REMOTE_FAILURE` | 502    | The external tool refused or failed the request.         |
| `INTEGRATION_ALREADY_CONNECTED` | 409 | The project already has an active connection to this tool. |
| `INTEGRATION_EXPIRED` | 409 | The connection expired: the integration must be authorised again. |
| `INTEGRATION_TOKEN_REUSED` | 409 | The token was already stored once: authorise again. |
| `INTEGRATION_BOARD_REQUIRED` | 409 | The action needs a board chosen for the integration. |
| `INTEGRATION_STATUS_UNKNOWN` | 422 | A status mapping refers to a status that does not exist. |
