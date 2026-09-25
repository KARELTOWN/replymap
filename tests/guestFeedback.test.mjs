// Feedback from a visitor with no BugReveal account: accepted only on a
// project whose owner opened it, and always carrying the email typed in the
// form rather than anything else the request claimed.
import test from "node:test";
import assert from "node:assert/strict";

import mongoose from "../config/mongodb.js";
import Project from "../models/Project.js";
import Session from "../models/Session.js";
import { requireGuestFeedback } from "../middleware/guestFeedback.js";
import feedbackService from "../services/feedback/feedbackService.js";
import { calls } from "../jobs/queue.js";

const oid = () => new mongoose.Types.ObjectId();

const OPEN_PROJECT = oid();
const CLOSED_PROJECT = oid();

Project.findById = (id) => ({
  lean: async () => ({
    _id: id,
    libelle: "Site vitrine",
    allow_guest_feedback: String(id) === String(OPEN_PROJECT),
  }),
});
Session.findById = () => ({ lean: async () => null });
Session.exists = async () => null;

// What the guard leaves behind when it refuses: the screenshot multer already
// wrote to disk must not stay there.
const run = async (req) =>
  new Promise((resolve) => requireGuestFeedback(req, {}, (error) => resolve(error ?? null)));

test("a project that did not open itself refuses guest feedback", async () => {
  const error = await run({ trackedProject: { _id: CLOSED_PROJECT }, files: {} });

  assert.equal(error?.code, "GUEST_FEEDBACK_CLOSED");
});

test("a project that opened itself lets the guest through", async () => {
  const error = await run({ trackedProject: { _id: OPEN_PROJECT }, files: {} });

  assert.equal(error, null);
});

test("the guest email is the one the form validated, not the one the body claimed", async () => {
  await feedbackService().submit({
    payload: {
      title: "Le bouton ne repond pas",
      project_id: String(OPEN_PROJECT),
      // A guest submission is public: the body cannot name an account.
      created_by: oid(),
      email: "admin@bugreveal.io",
      session_id: "null",
    },
    author: null,
    guest: { email: "visiteur@example.com", name: "Visiteur" },
    file: { path: "/tmp/capture.png" },
    attachments: [],
  });

  const { feedback: stored } = calls.feedback.at(-1);

  assert.equal(stored.created_by, null);
  assert.equal(stored.email, "visiteur@example.com");
  assert.equal(stored.guest_email, "visiteur@example.com");
  assert.equal(stored.guest_name, "Visiteur");
  assert.equal(stored.session_id, null);
});
