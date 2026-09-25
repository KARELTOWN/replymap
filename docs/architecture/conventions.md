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

Prefer a comment that says _why_ over one that says _what_. The what is one
line below.

## Naming

| Kind                | Rule                       | Example                           |
| ------------------- | -------------------------- | --------------------------------- |
| file, back          | camelCase                  | `feedbackRepository.js`           |
| file, Vue component | PascalCase                 | `FeedbackCard.vue`                |
| directory           | lowercase, singular domain | `feedback/`, `project/`           |
| function            | verb first                 | `findByProject`, `submit`         |
| boolean             | reads as a question        | `isProjectMember`, `hasRecording` |
| error code          | SCREAMING_SNAKE            | `PROJECT_NOT_MEMBER`              |
| message key         | dot path                   | `feedback.statusChanged`          |

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
test("a platform administrator cannot leave feedback without an invitation");
```

Test the decision, not the plumbing. A test that asserts a repository called
`find` tells you nothing the next refactor will not break.

The backend suite runs without MongoDB or Redis: `tests/support/` substitutes
the infrastructure modules. Follow that pattern rather than starting a real
instance.

## Git

- one intent per commit;
- the message says what changes and why, not which files moved;
- a change never increases the violation count of the checker.

### Hooks

The rules above are not left to goodwill. Each of the four folders carries
`.githooks/`, installed once per clone:

```bash
git config core.hooksPath .githooks
```

**Before a commit**, in the folder being committed:

1. **no secret leaves the machine** — any staged `.env*` (except
   `.env.example`), `.secrets*`, key or certificate refuses the commit. A
   `.gitignore` rule does nothing for a file already tracked; this does.
2. **prettier formats what is about to be committed**, then re-stages it. A
   file that also carries unstaged changes is left alone rather than having
   held-back work quietly staged.
3. **the checker runs on the whole folder** — no file over 450 lines, no
   comment in French, no controller importing a repository or a model, no
   service importing a model.
4. **the types are checked** when the commit touches a `.ts`, a `.vue` or a
   `tsconfig`; a folder without TypeScript has its staged JavaScript parsed
   instead.

**Before a push**, the unit tests of **all four folders** run
(`node scripts/test-all.js`): the widget speaks to the API and the dashboard
reads its answers, so pushing one folder can break another. A folder with no
tests is reported, never counted as a failure.

`--no-verify` exists and is sometimes the right call; it is never the habit.

### Branches

| Branch    | What it deploys         |
| --------- | ----------------------- |
| `develop` | the dev environment     |
| `staging` | the staging environment |
| `prod`    | production              |

They are deployment branches: one merges into them, one does not work in them.

Work happens on a branch named `<type>/<short-description>`, the same
convention as horizon:

`feat/` a new feature · `fix/` a bug · `chore/` maintenance, dependencies,
tooling · `docs/` documentation only · `refactor/` no behaviour change ·
`test/` tests · `ci/` pipelines · `perf/` performance · `hotfix/` an urgent
production fix.

```
feat/parcours-de-session
fix/rotation-du-jeton-de-rafraichissement
chore/mise-a-jour-des-dependances
```

The pre-commit hook refuses a commit on a branch named anything else: a branch
misnamed for twenty commits is a branch nobody renames any more.

### Commit messages

**Conventional commits**, as in horizon:

```
feat(session): affiche le parcours du visiteur

- un noeud par page, une arete par deplacement
- les formulaires envoyes sont une etape du chemin
```

- `<type>(<scope>): <subject>` — the scope is optional;
- the subject is written in the imperative and says what changes and why, not
  which files moved;
- **72 characters** for the first line; everything else goes in the body, after
  a blank line;
- one intent per commit.

The `commit-msg` hook refuses anything else.

### Never committed

`.env` and every variant of it, `.secrets.keys.json`, private keys and
certificates. Only `.env.example` — names of variables, no values — and the
encrypted `secrets/*.enc` are versioned.

## Dependencies

Adding a dependency is a decision to justify in review: what it replaces, what
it costs at install and at runtime, and what happens when it is abandoned. A
function of twenty lines is cheaper than a package.

The widget is the strictest case: it runs on customer websites, so every
kilobyte is paid for by someone else's visitors.
