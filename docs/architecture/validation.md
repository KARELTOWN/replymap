# Input validation

**Every value coming from outside the process is validated by `express-validator`,
declared on the route, before the controller runs.** This covers the body, the query
string and the path parameters, on authenticated and public routes alike, including the
webhook payload sent by an external tool.

## Where validation lives

```text
validator/<domain>/<domain>Validator.js   one exported chain per route
routes/<domain>/<domain>Router.js         the chain is placed before the controller
```

```js
FeedbackRouter.delete(
  "/delete/:feedback_id",
  validateFeedbackIdParam,       // shape of the input
  requireFeedbackAccess,         // who may call it
  handle(deleteFeedback)         // what it does
);
```

Order matters: validation first, access control second, controller last. The only
exception is a multipart route, where `multer` must parse the body before anything can
read it.

## What a validator checks, and what it does not

A validator checks the **shape** of the input: presence, type, format, length, known
enumerations. It does not check business rules: whether the caller may act on the
project, whether the feedback already has a card. Those belong in the access middleware
and in the service, and they fail with an error code, not a field error.

## Reading the input

A controller reads `matchedData(req)`, the validated copy. **Never `req.body`,
`req.query` or `req.params`**: a value read from there was never validated, and any
field later added to the request would flow in unchecked.

```js
assertValid(req);                              // throws VALIDATION_FAILED
const { project_id, limit } = matchedData(req);
```

## Messages

Validators carry message keys, not sentences. `assertValid` translates them into the
caller's language, like the `validators` catalogues of the Horizon API:

```js
body("title").notEmpty().withMessage("validation.titleRequired")
```

Keys live under `validation` in `shared/i18n/locales/en.json` and `fr.json`. Every
validator uses keys. `assertValid` still returns a non-key message unchanged, as a
safety net only.

A validator never transforms a secret: `.escape()` on a password changes what is
hashed. Sanitise at output (the dashboard escapes by default, emails go through
`toSafeText`), not at input.

## Routes that take no input

A handful of endpoints read nothing but the authenticated user. They are listed by
handler name in `tests/validationCoverage.test.mjs`:

| Handler               | Why it has no validator          |
| --------------------- | -------------------------------- |
| `getStats`            | reads `req.user` only            |
| `getFeedbackParams`   | shared reference data            |
| `getEventTypes`       | shared reference data            |
| `trelloWebhookVerify` | reachability probe, empty body   |

Adding a name to that list is a design decision, reviewed like any other.

## Enforcement

`tests/validationCoverage.test.mjs` walks the real route tree and fails when:

- a route accepts input without a validation chain;
- a controller reads `req.body`, `req.query` or `req.params`.

A new endpoint without a validator does not reach review: it fails `npm test`.
