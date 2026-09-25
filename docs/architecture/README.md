# BugReveal — Architecture handbook

Written for the engineers who build and review BugReveal. It is written in
English, like the code comments, so that a single language covers the whole
repository.

This handbook is not a description of what the code happens to look like today.
It is the contract every change is measured against in review. Where the code
disagrees with it, the code is wrong and the gap is tracked in
[migration-status.md](./migration-status.md).

## The four repositories

| Repository | Role                                                    | Rules it follows |
| ---------- | ------------------------------------------------------- | ---------------- |
| `back`     | REST API, queues, integrations                           | [backend.md](./backend.md) |
| `record`   | Tracking and feedback widget embedded on customer sites  | [backend.md](./backend.md) |
| `front`    | Agency dashboard                                         | [frontend.md](./frontend.md) |
| `sso`      | Sign-in window only                                      | [frontend.md](./frontend.md) |

`record` follows the backend rules. It is browser code, but it is layered code:
a capture module that decides *what* to send has the same shape as a service, a
module that talks to the API has the same shape as a repository.

## Principles

**One reason to change per file.** A file that would need editing for two
unrelated reasons is two files.

**Dependencies point one way.** Transport calls business, business calls data
access. Never the reverse, never a shortcut across a layer.

**No hidden decisions.** A decision the product made is written once, in the
layer that owns it, with a comment that says *why*. A comment that repeats what
the code already says is deleted.

**Failures are values, not surprises.** A failure is a known error code that
travels to the client in a fixed shape. An unexpected exception is a defect,
never a normal path.

**Text is data.** No sentence shown to a human is written in a controller or a
service. Messages live in the locale files.

## Documents

- [backend.md](./backend.md) — layers, responsibilities, response contract
- [frontend.md](./frontend.md) — dashboard structure, state, components
- [conventions.md](./conventions.md) — naming, comments, file size, tests, git
- [error-codes.md](./error-codes.md) — the error code catalogue
- [notifications.md](./notifications.md) — every email, its trigger and its recipients
- [migration-status.md](./migration-status.md) — where the code still disagrees

## Enforcement

Rules that a script can check are checked by a script. The rest is what code
review is for.

```bash
npm run lint:conventions     # file size, comment language, layering
npm test                     # behaviour
npm run secrets -- audit     # no secret tracked by git
```

The checker is the source of truth for the remaining debt. Run it before
opening a pull request; a change must never increase its count.
