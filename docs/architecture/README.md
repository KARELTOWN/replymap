# `record` — the embedded widget

The tracking and feedback script pasted into customer websites.

Written for the engineers who build and review it. Written in English, like the
code comments, so a single language covers the whole repository.

This handbook is not a description of what the code happens to look like today.
It is the contract every change is measured against in review.

## Documents

- [widget.md](./widget.md) — the rules of this repository
- [conventions.md](./conventions.md) — naming, comments, file size, tests, git,
  hooks and branches, shared by the four repositories

BugReveal is four repositories, each with its own handbook next to its code:
`back` (the API), `record` (the widget), `front` (the dashboard) and `sso` (the
sign-in window). The API also holds what is shared between them: the error code
catalogue, the email catalogue, and the validation contract.

## Enforcement

```bash
git config core.hooksPath .githooks        # once per clone
node ../back/scripts/check-conventions.js .
npm test                                   # this repository
node ../back/scripts/test-all.js           # the four repositories at once
```

The hooks run the checker on every commit and this repository's tests on every
push. The four-folder run is the one to call before opening a merge request. A
change must never increase the checker's violation count.
