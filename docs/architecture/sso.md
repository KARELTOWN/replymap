# `sso` — the sign-in window

Written for the engineers who build and review the window the widget opens to
sign someone in. It follows [frontend.md](./frontend.md); this page says what is
specific to it, and what it must never become.

## 1. What it is

One screen, opened as a popup by the widget running on a customer's website:

```
…/sso?from=<page that opened it>&project_id=<project>
```

It signs the person in, then **relays the access token back to the opener** by
`postMessage`. That relay is the whole reason this application exists, and it is
the one thing that can leak a session to a stranger.

## 2. The relay is the security boundary

`composables/verifyOrigin.ts` decides whether the token may be sent, and both
conditions must hold:

1. the target origin is the **registered domain of the project** named in the
   URL;
2. the account that just signed in is a **member of that project**.

The first alone can be walked around: anyone can create a project pointing at
their own domain, then open this window with that `project_id` to harvest a
visitor's token. The second closes the door, and costs nothing — the widget only
serves members anyway.

Rules that follow, and that a review must enforce:

- `postMessage` is never called with `"*"` as the target origin;
- the origin is read from the URL and checked against the API, never trusted
  because it "looks right";
- a refusal is explained on screen and nothing is sent — no silent fallback.

## 3. Structure

| Folder | What it holds |
| ------ | ------------- |
| `views/Auth/Signin.vue` | the only screen |
| `components/layout/*` | the frame, the theme, nothing reusable beyond it |
| `composables/request.ts` | the HTTP client, cookies included |
| `composables/session.ts` | reading and storing the session |
| `composables/verifyOrigin.ts` | the relay decision |
| `validator/auth.ts` | the shape of the sign-in form |
| `utils/*` | error envelope and notifications |

## 4. What it may contain

The sign-in view, its layout, its validators, its HTTP client and the token
relay. **Anything else copied from the dashboard is deleted, not maintained
twice.** A dashboard component that ends up here is the first sign this
application is drifting into a second front end.

It holds no store, no router beyond its one route, no design system of its own.

## 5. Sessions

The window signs in through the same API as the dashboard, and therefore holds
the same session: a 15-minute access token, and a refresh cookie scoped to
`/api/auth`. It relays the access token, never the refresh cookie — a cookie is
never readable by script and must stay that way.

Because it shares the session, opening this window from a browser already signed
in to the dashboard returns a token without asking anything: that is what lets
the widget renew a 12-hour token without a form.

## 6. Rules a script checks

From `back`:

```bash
node scripts/check-conventions.js ../sso
```

No file over 450 lines, no comment written in French. The layer rules of the
backend do not apply here; the pre-commit hook runs the checker on every commit.

## 7. Review

A change is refused if it:

- widens the relay (a new origin, a new condition dropped, a `"*"` target);
- adds a screen that is not sign-in;
- duplicates a dashboard component instead of letting the dashboard own it;
- stores the token anywhere the opener page could read it.
