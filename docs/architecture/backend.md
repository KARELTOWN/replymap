# Backend architecture — `back` and `record`

## The layers

A request travels down and an answer travels back up. It never skips a step,
and it never goes sideways.

```
route        URL, HTTP verb, middleware order.       No logic.
  ↓
middleware   Authentication, access control, quota.  No business decision.
  ↓
validator    Shape of the input.                     No business rule.
  ↓
controller   Reads the request, calls one service,   No logic.
             returns an ApiResponse.
  ↓
service      Every product decision.                 No SQL, no HTTP, no model.
  ↓
repository   Every database access.                  No product decision.
  ↓
model        Mongoose schema.
```

A module grows a second service when it serves two audiences. The integration
module has `integrationService` (what feedback does with Trello) and
`integrationSetupService` (connecting Trello from the dashboard); the auth
module has `authSessionService` (tokens) and `accountService` (registration,
sign-in, password reset).

The reference implementation is the feedback module. Read it before writing a
new one:

```
routes/feedback/feedbackRouter.js
controllers/feedback/feedbackController.js
services/feedback/feedbackService.js
repositories/feedbackRepository.js
models/Feedback.js
```

## Controller

A controller does four things, in this order, and nothing else:

1. `assertValid(req)` — turns validator output into a `VALIDATION_FAILED` error;
2. `matchedData(req)` — reads the validated input;
3. calls **one** service method;
4. returns an `ApiResponse`.

```js
const updateFeedback = async (req, res) => {
  assertValid(req);

  await service.update({
    feedback: req.feedback,
    changes: matchedData(req),
    actorId: req.user._id,
  });

  return ApiResponse.ok(res, { messageKey: "feedback.updated" });
};
```

A controller **must not**:

- import a model or a repository (the checker fails the build);
- contain an `if` that expresses a product rule;
- build a message, a status code or a response shape by hand;
- call two services to compose a result — that composition is itself a service.

Wrap every handler in `handle()` in the router, so a rejected promise reaches
the error middleware instead of hanging the request.

## Service

The service is where the product lives. It is the only layer allowed to decide
that something is not permitted, that a card must move, or that a notification
must go out.

A service:

- receives plain values and returns plain values;
- throws `AppError` with a code from the catalogue, never a raw `Error`;
- calls repositories, other services, queues, external APIs;
- **never** imports a model, and never touches `req` or `res`.

```js
const update = async ({ feedback, changes, actorId }) => {
  const accepted = pick(changes, UPDATABLE_FIELDS);
  if (Object.keys(accepted).length === 0) throw new AppError("FEEDBACK_NO_CHANGES");

  const updated = await feedbackRepository.updateById(feedback._id, accepted);
  ...
};
```

Work that must not delay the answer — history, email, synchronisation with an
external tool — is started and not awaited, with its failure logged. Say so in
a comment, otherwise the next reader will "fix" the missing `await`.

## Repository

The repository is the only place that imports a model. It knows collections,
projections, population and indexes. It knows nothing about the product.

A repository:

- exports plain functions, one intention per function;
- returns documents, plain objects or `null`;
- **never** throws `AppError`, never checks a permission, never sends an email.

```js
export const findByProject = (projectId, limit) =>
  Feedback.find({ project_id: projectId })
    .populate(POPULATE_LIST)
    .select(LIST_FIELDS)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
```

Why this layer exists: a query change never reaches a service, and a service
can be tested by swapping the repository, with no database running.

The rule holds outside the request path too: middleware (`isAuthentificate`,
`projectAccess`, `trackedProject`), validators, jobs and helpers go through a
repository or a service. Only seeders, tests and scripts import models, and the
checker enforces it.

## Response contract

Every response leaves through `shared/http/apiResponse.js`. Clients parse one
shape, not one shape per endpoint.

**Success**

```json
{
  "success": true,
  "message": "Feedback retrieved.",
  "data": { "...": "..." },
  "meta": { "total": 42, "page": 2, "limit": 15, "totalPages": 3 }
}
```

`meta` only appears on paginated collections. Page numbers never live inside
`data`.

**Failure**

```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_MEMBER",
    "message": "You are not a member of this project.",
    "details": [{ "field": "title", "message": "Too short" }]
  }
}
```

| Builder                  | Status | Use                                       |
| ------------------------ | ------ | ----------------------------------------- |
| `ApiResponse.ok`         | 200    | read, update, delete                      |
| `ApiResponse.created`    | 201    | the resource now exists                   |
| `ApiResponse.accepted`   | 202    | handed to a queue, not done yet           |
| `ApiResponse.page`       | 200    | paginated collection                      |
| `ApiResponse.failure`    | any    | error middleware only                     |

Clients branch on `error.code`, and display `error.message`. The code is a
permanent contract: it is never renamed, never reused for another meaning.

## Errors

`shared/errors/errorCodes.js` maps each code to an HTTP status and a message
key. `shared/errors/appError.js` is the only error type a service throws.
`middleware/errorHandler.js` is the only place that turns an error into a
response.

```js
throw new AppError("FEEDBACK_SCREENSHOT_REQUIRED");
throw new AppError("VALIDATION_FAILED", { details: [...] });
```

An exception that is not an `AppError` is a defect: it is logged in full and
answered with a generic `INTERNAL_ERROR`. Stack traces and driver messages
never reach a client.

Adding a code means: one entry in `errorCodes.js`, one key in `en.json` and in
`fr.json`, one line in [error-codes.md](./error-codes.md).

## Messages and translation

No sentence is written in a controller, a service or a repository. They carry
keys; `shared/i18n/` resolves them.

- `shared/i18n/locales/en.json` — reference catalogue;
- `shared/i18n/locales/fr.json` — same keys, same order;
- the locale comes from `?lang=` first, then `Accept-Language`, then English;
- `{name}` placeholders are interpolated from `params`;
- an unknown key surfaces as the key itself, so a missing translation is
  visible in review rather than silently empty.

The two files must always hold the same key set. A key added to one and not the
other is a review failure.

## Queues and workers

A worker is a service caller, not a place for logic. It decodes the job, calls
a service, and handles retry concerns. Business rules stay in the service so
that the HTTP path and the queue path cannot drift apart.

## Sessions

Sessions follow the Horizon API (`horizon-api/src/Service/Auth/AuthService.php`):

| Token | Lifetime | Where it lives |
| ----- | -------- | -------------- |
| Access token (JWT) | 15 minutes | Response body, then `Authorization: Bearer` |
| Refresh token (opaque, stored as SHA-256) | 30 days, renewed at each refresh | `refresh_token` cookie, HttpOnly, path `/api/auth` |
| CSRF value | Same as the refresh token | `refresh_csrf` cookie, readable, echoed in `X-Refresh-CSRF` |

- Every refresh rotates the refresh token. A used token stays valid for 30
  seconds (concurrent tabs); reused within that window, its successor is
  revoked so a session never forks.
- Sign-out and password reset revoke every refresh token of the account, and
  move `sessions_valid_from` on it. An access token is a self-contained JWT the
  server never stored: revoking the refresh tokens alone left the other tabs
  working for the 15 minutes their token had left. Every access token issued
  before that instant is now refused on its next request, while the tab that
  changed the password keeps the token issued just after it. The Redis
  blacklist still handles the one token presented at sign-out; the cutoff
  handles the ones nobody ever held.
- Outside `local`, cookies are `Secure; SameSite=None` on `COOKIE_DOMAIN`; in
  `local`, `SameSite=Strict` on `localhost`. Dev and staging suffix the cookie
  names with the environment.
- The code is in `services/auth/authSessionService.js` and
  `shared/http/authCookies.js`; clients never see the refresh token.

## Configuration and secrets

No value is hardcoded. `utils/keys.js` reads the environment and fails loudly
when a variable is missing. The environment file itself is encrypted per space
(`local`, `dev`, `staging`, `prod`) by `scripts/secrets.js`; only the encrypted
version is committed. See `docs/bugs-fix/2026-09-21-securite-et-collecte.md`.

## File storage

Screenshots, recordings and attachments live in Cloudflare R2, reached with the
S3 API through `services/files/objectStorage.js`. Nothing else builds a storage
client: `fileService` (feedback files) and `chunkService` (recording chunks)
both go through it.

- Files are private. The dashboard reads them through a signed link valid one
  hour, built by `objectUrl(key)`.
- `R2_PUBLIC_URL` switches to plain public links, for a bucket served on a
  public domain: only for content nobody minds sharing.
- A file sent to an external tool travels as bytes (`getObject`), never as a
  link: a signed link would stop working on the card once it expired.

## Applying this to `record`

The widget has no HTTP server, but it has the same three responsibilities:

| Backend layer | Widget equivalent                    | Example                              |
| ------------- | ------------------------------------ | ------------------------------------ |
| controller    | orchestrator, wires UI to behaviour  | `setup/feedback/index.js`            |
| service       | a decision, a capture, an editor     | `setup/feedback/canvasEditor.js`     |
| repository    | the only module that calls the API   | `setup/feedback/service.js`          |

The rules that carry over unchanged: one responsibility per file, 450 lines
maximum, English comments, no `fetch` outside the API module, no DOM building
in a module that owns a decision.
