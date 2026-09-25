# Conventions

Rules a reviewer can apply without arguing. Most are checked by
`npm run lint:conventions`.

## Language

**Code comments are written in English**, in every repository. Identifiers too.

Product wording shown to a human is not a comment: it lives in
`shared/i18n/locales/` on the backend, and in the component on the front, in
French. The two are not the same thing and must not be mixed.

## File size

**450 lines maximum**, including comments, for every `.js`, `.ts` and `.vue`
file. A longer file is split by responsibility, never by line count: cutting a
600-line file in two 300-line halves that call each other buys nothing.

## Comments

Write a comment when the code cannot say it: a constraint from outside, a
decision that has a reason, a trap the next reader would walk into.

```js
// A move triggered by BugReveal comes back here as an echo. Without this
// check, every status change produced a second history entry credited to the
// external tool.
if (String(feedback.status) === String(mapping.status)) return;
```

Do not restate the code. `// increment the counter` above `counter += 1` is
noise, and noise is what makes people stop reading comments.

Prefer a comment that says *why* over one that says *what*. The what is one
line below.

## Naming

| Kind                | Rule                       | Example                    |
| ------------------- | -------------------------- | -------------------------- |
| file, back          | camelCase                  | `feedbackRepository.js`    |
| file, Vue component | PascalCase                 | `FeedbackCard.vue`         |
| directory           | lowercase, singular domain | `feedback/`, `project/`    |
| function            | verb first                 | `findByProject`, `submit`  |
| boolean             | reads as a question        | `isProjectMember`, `hasRecording` |
| error code          | SCREAMING_SNAKE            | `PROJECT_NOT_MEMBER`       |
| message key         | dot path                   | `feedback.statusChanged`   |

A repository function is named after the intention, not the query:
`findActiveByProject`, not `findOneWithFilter`.

## Input validation

Every value that comes from outside is validated with `express-validator`,
declared next to its route, before the controller. A controller may only read
`matchedData(req)`: reading `req.body` directly means the value was never
validated. See [validation.md](./validation.md).

## Tests

A test states a behaviour, in a sentence a non-developer could read:

```js
test("a platform administrator cannot leave feedback without an invitation")
```

Test the decision, not the plumbing. A test that asserts a repository called
`find` tells you nothing the next refactor will not break.

The backend suite runs without MongoDB or Redis: `tests/support/` substitutes
the infrastructure modules. Follow that pattern rather than starting a real
instance.

## Git

- one intent per commit;
- the message says what changes and why, not which files moved;
- `npm run lint:conventions`, `npm test` and `npm run type-check` pass before
  a pull request;
- a change never increases the violation count of the checker.

## Dependencies

Adding a dependency is a decision to justify in review: what it replaces, what
it costs at install and at runtime, and what happens when it is abandoned. A
function of twenty lines is cheaper than a package.

The widget is the strictest case: it runs on customer websites, so every
kilobyte is paid for by someone else's visitors.
