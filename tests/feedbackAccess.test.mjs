// Access guards of the feedback module: feedback can only be left, read
// or edited by an account that is a member of the project concerned.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import mongoose from "../config/mongodb.js";
import UserProject from "../models/UserProject.js";
import Project from "../models/Project.js";
import Feedback from "../models/Feedback.js";
import Role from "../models/Role.js";
import {
  requireProjectMember,
  requireProjectContributor,
  requireFeedbackAccess,
  isProjectMember,
} from "../middleware/projectAccess.js";

const oid = () => new mongoose.Types.ObjectId();
const MEMBER = oid();
const OUTSIDER = oid();
const PROJECT = oid();
const FEEDBACK = oid();
const ADMIN_ROLE = oid();

// Platform "Administrator" role, which already sees every project.
Role.findById = (id) => ({
  select: () => ({
    lean: async () =>
      String(id) === String(ADMIN_ROLE) ? { libelle: "Administrateur" } : null,
  }),
});

const memberships = new Set([`${MEMBER}|${PROJECT}`]);

UserProject.exists = async ({ user_id, project_id }) =>
  memberships.has(`${user_id}|${project_id}`) ? { _id: oid() } : null;

Project.findById = (id) => ({
  select: () => ({
    lean: async () =>
      String(id) === String(PROJECT)
        ? { _id: PROJECT, libelle: "Site vitrine", active: true }
        : null,
  }),
});

Feedback.findById = async (id) =>
  String(id) === String(FEEDBACK)
    ? { _id: FEEDBACK, project_id: PROJECT, title: "Bouton cassé" }
    : null;

// Runs a middleware and reports what it answered, or whether it let the
// request through.
const run = async (middleware, req) => {
  const outcome = { status: null, body: null, passed: false };
  const res = {
    status(code) {
      outcome.status = code;
      return this;
    },
    json(body) {
      outcome.body = body;
      return this;
    },
  };
  await middleware(req, res, (err) => {
    if (err) {
      // Refusals travel as AppErrors to the error middleware.
      outcome.status = err.status ?? 500;
      outcome.code = err.code;
      return;
    }
    outcome.passed = true;
  });
  return outcome;
};

test("a project member gets through, and the project is loaded once", async () => {
  const req = { user: { _id: MEMBER }, body: { project_id: String(PROJECT) } };
  const outcome = await run(requireProjectMember, req);

  assert.equal(outcome.passed, true);
  assert.equal(req.project.libelle, "Site vitrine");
});

test("a valid account that was not invited is refused", async () => {
  const outcome = await run(requireProjectMember, {
    user: { _id: OUTSIDER },
    body: { project_id: String(PROJECT) },
  });

  assert.equal(outcome.passed, false);
  assert.equal(outcome.status, 403);
});

test("an unknown project answers 404 and a malformed identifier 422", async () => {
  const unknown = await run(requireProjectMember, {
    user: { _id: MEMBER },
    body: { project_id: String(oid()) },
  });
  assert.equal(unknown.status, 404);

  const malformed = await run(requireProjectMember, {
    user: { _id: MEMBER },
    body: { project_id: "pas-un-objectid" },
  });
  assert.equal(malformed.status, 422);
});

test("a refusal deletes the screenshot multer already wrote to disk", async () => {
  const tmpFile = path.join(os.tmpdir(), `bugreveal-test-${Date.now()}.bin`);
  fs.writeFileSync(tmpFile, "capture");

  const outcome = await run(requireProjectMember, {
    user: { _id: OUTSIDER },
    body: { project_id: String(PROJECT) },
    files: { file: [{ path: tmpFile }] },
  });

  assert.equal(outcome.status, 403);
  assert.equal(fs.existsSync(tmpFile), false);
});

test("access to a feedback follows membership of its project", async () => {
  const req = { user: { _id: MEMBER }, params: { feedback_id: String(FEEDBACK) } };
  const allowed = await run(requireFeedbackAccess, req);
  assert.equal(allowed.passed, true);
  assert.equal(req.feedback.title, "Bouton cassé");

  const denied = await run(requireFeedbackAccess, {
    user: { _id: OUTSIDER },
    params: { feedback_id: String(FEEDBACK) },
  });
  assert.equal(denied.status, 403);

  const missing = await run(requireFeedbackAccess, {
    user: { _id: MEMBER },
    params: { feedback_id: String(oid()) },
  });
  assert.equal(missing.status, 404);
});

test("a platform administrator reads the project without an invitation", async () => {
  const outcome = await run(requireProjectMember, {
    user: { _id: OUTSIDER, role: ADMIN_ROLE },
    body: { project_id: String(PROJECT) },
  });

  assert.equal(outcome.passed, true);
});

test("a platform administrator cannot leave feedback without an invitation", async () => {
  // The product rule has no exception: leaving feedback requires having
  // been added to the project, whatever the account's role.
  const outcome = await run(requireProjectContributor, {
    user: { _id: OUTSIDER, role: ADMIN_ROLE },
    body: { project_id: String(PROJECT) },
  });

  assert.equal(outcome.passed, false);
  assert.equal(outcome.status, 403);
});

test("an invited member leaves feedback", async () => {
  const outcome = await run(requireProjectContributor, {
    user: { _id: MEMBER },
    body: { project_id: String(PROJECT) },
  });

  assert.equal(outcome.passed, true);
});

test("isProjectMember tells a member from a non-member", async () => {
  assert.equal(await isProjectMember(MEMBER, PROJECT), true);
  assert.equal(await isProjectMember(OUTSIDER, PROJECT), false);
});
