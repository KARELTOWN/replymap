# `record` — the embedded widget

Written for the engineers who build and review the script BugReveal customers
paste into their own website. It follows the same principles as
[backend.md](./backend.md): this page says what they mean in a browser.

The widget is the only part of BugReveal that runs on someone else's page. Two
consequences drive everything below: **it must never break that page**, and
**it must never send more than it was allowed to**.

## 1. What it is

A single built file, `dist/record.js`, loaded by two tags the dashboard hands
over:

```html
<script src="…/record.js" defer type="module"></script>
<script id="rrweb-init" data-project="<project id>"></script>
```

The project identifier is public: it travels in clear in the page of every
tracked website. Nothing in the widget may therefore rely on it being a secret
— the API's ingestion guard is what decides whether a call is accepted.

## 2. Boot sequence

`src/record.js` is the entry point, and the only file allowed to decide what
runs:

1. read the project identifier from the `rrweb-init` tag;
2. open the local database (IndexedDB) used as an outbox;
3. ask the API for the project's public settings (`utils/project.js`);
4. **stop entirely** if the project is inactive, if this website is switched
   off, or if the address does not match the registered domain;
5. otherwise start the collections the project enables, then the feedback
   widget.

Nothing starts before step 4 answers. A widget that started collecting and then
discovered it was not allowed would already have sent data.

## 3. Layers

The folders are the layers. They mirror the backend's, with browser names:

| Folder | Plays the part of | Rule |
| ------ | ----------------- | ---- |
| `src/record.js` | the route | decides what starts; contains no collection logic |
| `src/setup/*` | services | decide *what* is worth sending, and when |
| `src/setup/feedback/*` | services | the capture and feedback panel, one file per concern |
| `src/utils/request.js`, `utils/project.js` | repositories | the only files that talk to the API |
| `src/utils/*` | shared helpers | cookie, session, IndexedDB, notifications |
| `public/*` | the view | markup, styles and workers of the panel |

A file under `setup/` never builds a URL or reads a response shape: it calls
`utils/request.js`. A file under `utils/` never decides whether something is
worth collecting.

## 4. What is collected, and what switches it on

| Collection | Switch on the project | Needs a session |
| ---------- | --------------------- | --------------- |
| Session replay (rrweb) | `active_recording` | — |
| Pages visited, forms sent, forms refused | `active_recording` | yes, by nature |
| JavaScript errors, rejected promises, failed requests | `active_track_errors` | no |
| Slow `fetch` and XHR calls | `active_performance_issues` | no |
| Feedback widget | always on | no |

Two rules come out of this table and must not be broken again:

- **A collection that does not need a session must work without one.** Marking
  an event on the replay timeline goes through `utils/replayEvent.js`, which
  swallows rrweb's refusal when nothing is being recorded. Calling
  `rrweb.record.addCustomEvent` directly throws, and that exception used to
  swallow the event itself.
- **The feedback widget runs whatever the switches say.** Turning every
  collection off does not stop someone from reporting a bug.

## 5. Privacy

- Password, email and telephone inputs are masked by rrweb, and anything
  matching `utils/maskSelector.js` is masked as text.
- A form is described by its identifier, its page and its submit button. **What
  the visitor typed is never read**, not even to name a field: only field names
  and the browser's own validation message travel.
- Request interception strips the `Authorization` header and redacts the fields
  listed in `interceptRequest.js` before storing a body.
- Only the host of a page is sent to the installed-sites inventory; the full
  address stays in the event that carried it.

## 6. Sending

Everything is written to IndexedDB first, then sent:

- **replay chunks** close on 100 events **or** 10 seconds, whichever comes
  first, and are gzipped in a worker (`public/workers/recordWorker.js`);
- **events** are batched and flushed on a debounce, and again on `beforeunload`
  through `sendBeacon`;
- **a feedback** is sent from `public/workers/feedbackWorker.js`, so a capture
  weighing several megabytes never freezes the customer's page.

A send that fails is kept in IndexedDB and retried; a send that succeeds
deletes its rows. Nothing is ever dropped silently.

## 7. Sessions

- A session lasts 30 minutes at most, and closes after 30 seconds without
  activity.
- Submitting feedback rotates the session, so the report is attached to the
  session it came from and the next one starts clean.
- The widget holds a 12-hour token when a member is signed in, renewed through
  the SSO window. A visitor with no account gets no token at all, and posts to
  the public guest route when the project opened itself to guests.

## 8. Rules a script checks

The same checker as the backend, run from `back`:

```bash
node scripts/check-conventions.js ../record
```

No file over 450 lines, no comment written in French, no layer shortcut. The
pre-commit hook runs it on every commit.

## 9. Review

A change to the widget is refused if it:

- can throw on a customer's page outside a `try`;
- starts a collection before the project settings have answered;
- sends anything the visitor typed;
- talks to the API from anywhere but `utils/request.js`;
- adds a collection without a switch on the project.
