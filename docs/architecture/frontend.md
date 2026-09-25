# Frontend architecture — `front` and `sso`

These rules are adapted from the Horizon frontend handbook (`horizon/ARCHITECTURE.md`,
`CODESTYLE.md`, `REVIEW.md`). Horizon runs on Nuxt 4 and Vuetify; BugReveal runs on
Vue 3, Vite, Pinia and Tailwind. The principles carry over unchanged; where the tooling
differs, the equivalent is named explicitly.

All rules below are mandatory, for the team and for AI coding assistants.

## 1. Stack

- **Vue 3**, Composition API only, `<script setup lang="ts">` in every SFC.
- **TypeScript** everywhere. No new `.js` file in `src/`.
- **Pinia** for domain state (Horizon uses composables; see §5 for how the two relate).
- **Tailwind** with the project theme as the design system.
- **vue-i18n** for every user-visible string (see §7).
- **Vitest** for unit tests, **Playwright** for end-to-end tests.

No Options API. A component written with `export default { data() {...} }` is a review
failure, including when it is an existing file being modified.

## 2. Project structure

```text
src/
├─ components/
│  ├─ ui/            # design system primitives — no business logic, no store
│  ├─ layout/        # application shell: sidebar, header, page frame
│  ├─ common/        # cross-domain building blocks (PageHeader, EmptyState, ...)
│  └─ <domain>/      # feedback/, projects/, sessions/, events/, integration/
├─ composables/      # cross-cutting logic: useApi (request.ts), useSidebar, useTheme
├─ stores/<domain>/  # domain state + API calls, one store per domain
├─ views/Pages/<Domain>/
├─ router/
├─ i18n/locales/     # fr.json, en.json
└─ shared/
   ├─ types/api/     # TypeScript models of the API contract
   └─ utils/         # pure, framework-agnostic helpers
```

Rules, taken from Horizon §2:

- `components/ui/` contains **no business logic** and never imports a store.
- Domain-specific visual components live in `components/<domain>/`.
- Business logic and API calls live in stores and composables, **never in components**.
- Framework-agnostic code lives in `shared/`.
- No cross-domain import between two domain component folders: go through a store.

## 3. Components

- One responsibility per component.
- Props are typed with an interface; events are declared with `defineEmits<{ ... }>()`.
- `v-model` uses explicit models (`modelValue`, `update:modelValue`).
- A component renders; it does not decide. Any condition that expresses a product rule
  belongs in the store or a composable, exposed as a `computed`.
- Target size: **300 lines** for a component (Horizon), **450 lines** hard limit
  (project rule, enforced by `npm run lint:conventions`).

The primitives already in place — `PageHeader`, `EmptyState`, `TableSkeleton`,
`ListFooter`, `StatCard` — are the shared vocabulary of every screen. A screen that
needs a page header uses `PageHeader`; it does not grow its own. If a primitive does
not fit, the primitive changes, once, for every screen.

## 4. Views

A view is a route. It assembles components and reads stores; it does not compute.

Every list renders three states, and a list rendering only the last one is incomplete:

```vue
<TableSkeleton v-if="loading" />
<EmptyState v-else-if="items.length === 0" :title="$t('projects.empty.title')" />
<ProjectList v-else />
```

## 5. State: stores and composables

Horizon forbids custom global stores and puts all domain logic in composables. BugReveal
already relies on Pinia, so the rule is adapted rather than rewritten:

- a **store** is the domain composable: it holds the state of one domain and the API
  calls of that domain, and follows every composable rule below;
- a **composable** holds cross-cutting logic that is not a domain: HTTP, sidebar,
  theme, clipboard.

Both must:

- contain no UI import and no DOM manipulation;
- expose only what components need;
- never resolve another store at module level — resolve it inside the function that
  uses it, otherwise importing the module before Pinia is installed throws;
- avoid side effects in getters; prefer `computed` over `watch`.

Target size: **250 lines** for a store or composable (Horizon), **450** hard limit.

## 6. API layer

`composables/request.ts` is the equivalent of Horizon's `useApi`: the **single entry
point** for network calls. No component, store or composable calls `fetch` or `axios`
directly.

It owns:

- the base URL, read from the environment (`import.meta.env.VITE_API_URL`), never
  hardcoded;
- the authorization header;
- the single-flight refresh of an expired token (mutex), and the retry of the failed
  request — Horizon's `refreshAccessTokenOnce()`;
- the redirect to sign-in when the session cannot be recovered.

Responses are read through `utils/handleAppError`, which understands the API envelope
described in [backend.md](./backend.md). Responses are typed against
`shared/types/api/`; untyped JSON parsing is a review failure.

## 7. i18n

Taken from Horizon §8, without exception: **no user-visible text is hardcoded** in a
component, a store or a composable. Every string goes through `$t()` and lives in
`src/i18n/locales/fr.json` (default) and `en.json`.

```vue
<h1>{{ $t('feedback.page.title') }}</h1>
```

Keys follow the domain: `feedback.page.title`, `projects.empty.description`,
`common.actions.save`. The two locale files hold the same keys.

Error messages returned by the API are already translated by the backend, in the
language requested through `Accept-Language`: display `error.message` as received,
branch on `error.code`.

## 8. Forms and validation

Horizon uses Vuetify rules. BugReveal uses **yup**, already in place (`validator/`):

- shared rules live in `shared/utils/validationRules.ts` and are composed by forms;
- no ad-hoc validation inside a component, no manual DOM validation;
- server-side validation errors come back as `error.details[{ field, message }]` and
  are mapped onto the same fields.

## 9. Routing

- Every route declares `meta.title` (an i18n key) and, when relevant, `meta.requiredAuth`.
- Programmatic navigation uses **named routes**: `router.push({ name: 'Feedbacks' })`,
  never a hardcoded path string — changing a URL then touches no navigation call.
- A route present in the menu must exist; a route that exists must be reachable.

## 10. Design system

- Colours, radii and shadows come from the Tailwind theme, never a literal value in a
  component.
- Dark mode is written with `dark:` variants on the same token.
- A `style="..."` attribute in a template is a review failure.
- Dynamic HTML is always sanitised (DOMPurify). `v-html` on unsanitised data is a
  blocking security finding.

## 11. Errors

- Never display a raw error to a user.
- Loading and error states are rendered with the shared primitives, never plain text.
- On a failed token refresh, the session is cleared and the user is sent to sign-in.

## 12. Tests

Taken from Horizon §11 and CODESTYLE §9:

- one `.spec.ts` file per store, composable or utility, next to it;
- each covers the success case, the common error case and the edge case;
- **every bug fix ships with a regression test** that fails before the fix;
- Playwright covers the critical flows: sign-in, feedback board, feedback detail,
  project invitation.

`npm run type-check` reports zero errors. It is a gate, not an indicator.

## 13. Review

Review follows Horizon's `REVIEW.md`: block on defects, regressions, security issues
and architecture violations; do not block on style that the linter already enforces.
Areas to inspect carefully: `composables/`, `stores/`, `router/`, `components/ui/`,
`i18n/locales/`.

## 14. What `sso` may contain

The sign-in application is a single screen: the sign-in view, its layout, its
validators, its HTTP client and the token relay. Anything else copied from the
dashboard is deleted, not maintained twice.
