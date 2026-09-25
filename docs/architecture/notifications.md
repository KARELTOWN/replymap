# Email notifications

Every email BugReveal sends, what triggers it, and who receives it.

An email is never sent from a controller. A service asks
`notificationService.sendMailNotification({ receivers, params, model_name })`,
which renders the stored template and queues one job per recipient; the worker
delivers it and keeps a trace the recipient can read in the dashboard.

Templates live in the `notificationmodels` collection, seeded by
`seeders/NotificationModelSeeder.js` and identified by a short code (`unique`).
Placeholders are written `#name` and filled from `params`; values coming from
users are stripped of their tags and escaped before rendering, so a feedback
title cannot inject markup into an email.

## Accounts

| Code | Sent when | To | Carries |
| ---- | --------- | -- | ------- |
| `CVC` | An account is created | The new account | The 5-digit confirmation code, valid one hour |
| `CC` | The code is confirmed | The account | Welcome, the account is active |
| `LRMP` | A password reset is asked for | The account | The reset link (30 minutes) and a link to refuse it |
| `RMP` | The password was reset | The account | A notice that it changed |

Sign-in, sign-out and a password changed from the profile send nothing.

## Projects and members

| Code | Sent when | To | Carries |
| ---- | --------- | -- | ------- |
| `CP` | A project is created | Its creator | The project name |
| `AUP-I` | A member is added | The person added | The project they may now report on |
| `AUP` | A member is added | The other members | Who joined |
| `QP-I` | A member is removed, or leaves | The person concerned | The project they left |
| `QP` | A member is removed, or leaves | The remaining members | Who left |

## Feedback

| Code | Sent when | To | Carries |
| ---- | --------- | -- | ------- |
| `AF` | A feedback is submitted | Every member of the project except its author | Type, status, title, description, project |
| `MF` | A feedback is updated | Every member except the person who made the change | What changed: status, type, title |

The author of an action never receives the email about it: they just did it.

## Not notified

Nothing is sent for: a recording session (start, end, deletion), tracked events
(errors, rage clicks, slowness), Trello synchronisation in either direction, a
widget session, or the maintenance that deletes empty sessions. These are
either too frequent for an inbox, or invisible to the customer.

## Adding a notification

1. Add the template to `seeders/NotificationModelSeeder.js` with a new code.
2. Call `sendMailNotification` from the **service** that owns the rule, never
   from a controller or a repository.
3. Exclude the person who caused the event from the recipients.
4. Send it without blocking the answer: the notification is started and its
   failure logged, as feedback and project notifications do.
5. Add a line to the tables above.
