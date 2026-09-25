# BugReveal — Architecture handbook

Written for the engineers who build and review BugReveal. It is written in
English, like the code comments, so that a single language covers the whole
repository.

This handbook is not a description of what the code happens to look like today.
It is the contract every change is measured against in review. Where the code
disagrees with it, the code is wrong and the gap is tracked in
[migration-status.md](./migration-status.md).

## The four repositories

| Repository | Role                                                    | Its handbook |
| ---------- | ------------------------------------------------------- | ------------ |
| `back`     | REST API, queues, integrations                           | [backend.md](./backend.md) |
| `record`   | Tracking and feedback widget embedded on customer sites  | [widget.md](./widget.md) |
| `front`    | Agency dashboard                                         | [frontend.md](./frontend.md) |
| `sso`      | Sign-in window only                                      | [sso.md](./sso.md) |

Each folder has its own page, and each one builds on a shared base: `record`
follows the backend's layering (a module that decides *what* to send has the
shape of a service, a module that talks to the API has the shape of a
repository), `sso` follows the dashboard's. `conventions.md` applies to all
four.

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
- [widget.md](./widget.md) — the embedded widget: boot, collections, privacy
- [sso.md](./sso.md) — the sign-in window and its token relay
- [conventions.md](./conventions.md) — naming, comments, file size, tests, git
- [error-codes.md](./error-codes.md) — the error code catalogue
- [notifications.md](./notifications.md) — every email, its trigger and its recipients
- [migration-status.md](./migration-status.md) — where the code still disagrees

## Enforcement

Rules that a script can check are checked by a script. The rest is what code
review is for.

```bash
npm run lint:conventions           # this folder: file size, comment language, layering
node scripts/check-conventions.js ../record ../front ../sso
npm test                           # behaviour of this folder
node scripts/test-all.js           # behaviour of all four folders
npm run secrets -- audit           # no secret tracked by git
```

Nothing of this is left to goodwill: `.githooks/` holds the hooks that run it.

| Moment | What runs |
| ------ | --------- |
| commit | no `.env` or secret staged · prettier on what is committed · the checker on the whole folder · types when a typed file changes |
| push   | the unit tests of all four folders |

Installed once per clone, in each of the four folders:

```bash
git config core.hooksPath .githooks
```

The checker is the source of truth for the remaining debt. A change must never
increase its count.
