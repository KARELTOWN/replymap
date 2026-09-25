# `sso` — the sign-in window

The popup the widget opens to sign someone in and relay their token.

Written for the engineers who build and review it. Written in English, like the
code comments, so a single language covers the whole repository.

This handbook is not a description of what the code happens to look like today.
It is the contract every change is measured against in review.

## Documents

- [sso.md](./sso.md) — the rules of this repository
- [conventions.md](./conventions.md) — naming, comments, file size, tests, git,
  hooks and branches, shared by the four repositories

BugReveal is four repositories, each with its own handbook next to its code:
`back` (the API), `record` (the widget), `front` (the dashboard) and `sso` (the
sign-in window). The API also holds what is shared between them: the error code
catalogue, the email catalogue, and the validation contract.

## Enforcement

```bash
git config core.hooksPath .githooks   # once per clone
node ../back/scripts/check-conventions.js .
node ../back/scripts/test-all.js
```

The hooks run the first two on every commit and the third on every push. A
change must never increase the checker's violation count.
