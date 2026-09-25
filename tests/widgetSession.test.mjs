// Sessions of the embedded widget: a token tied to one project, refused on
// every route the widget does not need.
import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import mongoose from "../config/mongodb.js";
import User from "../models/User.js";
import UserProject from "../models/UserProject.js";
import Project from "../models/Project.js";
import Role from "../models/Role.js";
import isauthentificate from "../middleware/isAuthentificate.js";
import { allowWidgetSession, requireWidgetProjectMatch } from "../middleware/widgetSession.js";
import { requireProjectMember } from "../middleware/projectAccess.js";
import {
  issueWidgetToken,
  WIDGET_TOKEN_TTL_SECONDS,
} from "../services/auth/authSessionService.js";
import accountService from "../services/auth/accountService.js";

const oid = () => new mongoose.Types.ObjectId();
const MEMBER = oid();
const PROJECT = oid();
const OTHER_PROJECT = oid();

const account = { _id: MEMBER, email: "membre@example.com", is_active: true, email_verified: true };

User.findById = () => ({ select: () => ({ lean: async () => account }) });
Role.findById = () => ({ select: () => ({ lean: async () => null }) });
UserProject.exists = async ({ user_id, project_id }) =>
  String(user_id) === String(MEMBER) && String(project_id) === String(PROJECT) ? { _id: oid() } : null;
Project.findById = (id) => ({
  select: () => ({
    lean: async () => ({ _id: id, libelle: "Site vitrine", active: true }),
  }),
});

// Runs a chain of middleware and reports where it stopped.
const run = async (chain, req) => {
  const outcome = { passed: false, code: null };
  const res = { status: () => res, json: () => res, set: () => res };

  for (const middleware of chain) {
    let failure = null;
    let carried = false;
    await new Promise((resolve) => {
      middleware(req, res, (error) => {
        if (error) failure = error;
        else carried = true;
        resolve();
      });
    });
    if (failure) {
      outcome.code = failure.code;
      return outcome;
    }
    if (!carried) return outcome;
  }
  outcome.passed = true;
  return outcome;
};

const bearer = (token) => ({ headers: { authorization: `Bearer ${token}` } });

test("a widget token names its project and lasts longer than a dashboard one", () => {
  const { token, expiresIn } = issueWidgetToken(MEMBER, PROJECT);
  const payload = jwt.verify(token, process.env.SECRET_KEY, { audience: "widget" });

  assert.equal(payload.project, String(PROJECT));
  assert.equal(payload.id, String(MEMBER));
  assert.equal(expiresIn, WIDGET_TOKEN_TTL_SECONDS);
  assert.equal(payload.exp - payload.iat, WIDGET_TOKEN_TTL_SECONDS);
});

test("only a member of the project is given a widget session", async () => {
  const service = accountService();

  const issued = await service.openWidgetSession({ user: account, projectId: PROJECT });
  assert.ok(issued.token);

  await assert.rejects(
    () => service.openWidgetSession({ user: account, projectId: OTHER_PROJECT }),
    (error) => error.code === "PROJECT_NOT_MEMBER"
  );
});

test("a widget token is refused on a route that did not open itself to it", async () => {
  const { token } = issueWidgetToken(MEMBER, PROJECT);

  const refused = await run([isauthentificate], bearer(token));
  assert.equal(refused.code, "AUTH_WIDGET_SCOPE");

  const req = bearer(token);
  const allowed = await run([allowWidgetSession, isauthentificate], req);
  assert.equal(allowed.passed, true);
  assert.equal(String(req.widgetSession.projectId), String(PROJECT));
});

test("a widget token opens its own project only", async () => {
  const { token } = issueWidgetToken(MEMBER, PROJECT);

  const own = { ...bearer(token), params: { project_id: String(PROJECT) }, body: {} };
  assert.equal(
    (await run([allowWidgetSession, isauthentificate, requireWidgetProjectMatch], own)).passed,
    true
  );

  const other = { ...bearer(token), params: { project_id: String(OTHER_PROJECT) }, body: {} };
  assert.equal(
    (await run([allowWidgetSession, isauthentificate, requireWidgetProjectMatch], other)).code,
    "PROJECT_NOT_MEMBER"
  );
});

test("the access guard refuses a widget token aimed at another project", async () => {
  const { token } = issueWidgetToken(MEMBER, PROJECT);
  const req = { ...bearer(token), body: { project_id: String(OTHER_PROJECT) }, params: {} };

  const outcome = await run([allowWidgetSession, isauthentificate, requireProjectMember], req);
  assert.equal(outcome.code, "PROJECT_NOT_MEMBER");
});

test("a dashboard token still passes everywhere it used to", async () => {
  const token = jwt.sign({ id: String(MEMBER), jti: "dashboard" }, process.env.SECRET_KEY, {
    expiresIn: "15m",
  });
  const req = { ...bearer(token), body: { project_id: String(PROJECT) }, params: {} };

  assert.equal((await run([isauthentificate, requireProjectMember], req)).passed, true);
  assert.equal(req.widgetSession, undefined);
});
