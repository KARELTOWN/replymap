# Migration status

Where the code still disagrees with this handbook, and why. Each entry is debt
with a known owner decision, not an accepted exception. Remove an entry in the
same change that closes it.

Last checked: 2026-09-22.

## What the checker reports

```
back     npm run lint:conventions                             0 violations
record   node ../back/scripts/check-conventions.js --layers=off src public/workers
                                                               0 violations
front    node ../back/scripts/check-conventions.js --layers=off src
                                                               0 violations
sso      node ../back/scripts/check-conventions.js --layers=off src
                                                               0 violations
```

`back` runs every rule: file size, comment language, and layering (controllers
import neither models nor repositories, services import no model, and no other
layer imports a model except seeders, tests and scripts).

`record`, `front` and `sso` run the file size and comment language rules only.
Their layering rules are reviewed by hand (see below).

## Back

All modules follow route → validator → controller → service → repository.
Controllers answer with `ApiResponse`; failures are `AppError` codes from
`shared/errors/errorCodes.js`; every validator carries `validation.*` keys.

Open points:

| Topic | Gap | Why it is still open |
| ----- | --- | -------------------- |
| Payload shapes | Some `data` payloads keep their historical shape (`data.data` for the encrypted account reference at sign-in, `member_is_in_project` on the member list, list payloads carrying `total/page/limit/totalPages` inside `data` rather than in `meta`). | The widget already embedded on customer sites reads them. Changing them needs a versioned widget release first. |
| Seeders | Seeders import models directly. | They write reference data, not product behaviour; exempt by design. |
| `assertValid` fallback | A validator message that is not a key is returned unchanged. | Safety net only: no validator uses a literal any more. Remove the fallback once a test asserts every message is a key. |
| Access tokens after a reset or sign-out elsewhere | A password reset or a sign-out revokes every refresh token of the account, but access tokens already issued elsewhere stay valid for their remaining 15 minutes at most. | Accepted, as in Horizon: blacklisting every token of an account would need a per-account token version. |
| Widget session | The widget holds a 15-minute access token only; past that, submitting opens the SSO window once to renew it (silently when the session cookie is valid). | Third-party cookies cannot be relied on from the customer's site. |
| Recording chunks on disk | Chunks are written to `storage/track_bug` on the server; `writeChunkToStorage` can send them to R2 but is not wired. | Replay reads local files; moving them needs a migration of existing sessions. |
| Files already in S3 | Feedback files uploaded before the move to R2 stay in the old bucket and no longer resolve. | They were never readable (the key could only write), so nothing is lost; copying them over is optional. |
| Emails stored escaped | Registration used to run `.escape()` on the email: an address containing `'` or `&` was stored with HTML entities. | Passwords are handled (legacy hashes accepted and rehashed at sign-in). Emails need a one-off data migration; very few accounts can be affected. |

## Record

Layer mapping is described in [backend.md](./backend.md#applying-this-to-record).

| Topic | Gap | Why it is still open |
| ----- | --- | -------------------- |
| User-facing text | Widget strings are written in French in the modules. | The widget has no i18n catalogue yet. Target: a `locales/` module read by the UI builders, like the back. |
| Session end and events | The widget sends `session_id` on `session/end` and `project` on each event; the ingestion guard resolves the project from them. | Works, but sending `project_id` explicitly would spare the guard a lookup. Needs a widget release. |

## Front and SSO

| Topic | Gap | Why it is still open |
| ----- | --- | -------------------- |
| i18n | Screens hold French literals; `vue-i18n` is not installed. [frontend.md](./frontend.md) requires `$t()` for every text. | Largest remaining migration. Do it screen by screen, starting with the shared components. |
| Error reading | `handleAppError` still accepts the legacy `{ errors: [{ path, msg }] }` shape. | Every back route now answers with the envelope; remove the legacy branch once the front has been deployed against it. |
| Stores | Several stores repeat the same `try / handleAppError / notify` sequence. | To be folded into the single API entry described in frontend.md. |
