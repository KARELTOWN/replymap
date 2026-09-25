// Guard of the ingestion endpoints: active project, registered origin,
// capped volume. These routes cannot require an account, which makes them the
// most exposed surface of the API.
import test from "node:test";
import assert from "node:assert/strict";

import mongoose from "../config/mongodb.js";
import Project from "../models/Project.js";
import { redisClient } from "../config/redis.js";
import Session from "../models/Session.js";
import { requireTrackedProject } from "../middleware/trackedProject.js";

const oid = () => new mongoose.Types.ObjectId();

const PROJECT = oid();
const INACTIVE = oid();
const SESSION = oid();

// Ending a session only carries its id: the project is read from the session.
Session.findById = (id) => ({
  select: () => ({
    lean: async () => (String(id) === String(SESSION) ? { project_id: PROJECT } : null),
  }),
});

Project.findById = (id) => ({
  select: () => ({
    lean: async () => {
      if (String(id) === String(PROJECT)) {
        return { _id: PROJECT, link: "https://client.example.com", active: true };
      }
      if (String(id) === String(INACTIVE)) {
        return { _id: INACTIVE, link: "https://client.example.com", active: false };
      }
      return null;
    },
  }),
});

const run = async (req) => {
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
  await requireTrackedProject(req, res, (err) => {
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

// The middleware's project cache lives 60 s: each test uses its own
// address so it does not inherit the previous test's rate counter.
const ingest = (overrides = {}) => ({
  body: { project_id: String(PROJECT) },
  headers: { origin: "https://client.example.com" },
  ip: `203.0.113.${Math.floor(Math.random() * 250) + 1}`,
  ...overrides,
});

test("a call from the project's registered domain gets through", async () => {
  const outcome = await run(ingest());
  assert.equal(outcome.passed, true);
});

test("a call from another domain is refused", async () => {
  const outcome = await run(
    ingest({ headers: { origin: "https://pirate.example.net" } })
  );

  assert.equal(outcome.passed, false);
  assert.equal(outcome.status, 403);
});

test("the referer is the fallback when the origin is missing", async () => {
  const outcome = await run(
    ingest({ headers: { referer: "https://client.example.com/page/produit" } })
  );

  assert.equal(outcome.passed, true);
});

test("an unknown or inactive project receives nothing", async () => {
  const unknown = await run(ingest({ body: { project_id: String(oid()) } }));
  assert.equal(unknown.status, 404);

  const inactive = await run(ingest({ body: { project_id: String(INACTIVE) } }));
  assert.equal(inactive.status, 403);

  const malformed = await run(ingest({ body: { project_id: "pas-un-id" } }));
  assert.equal(malformed.status, 422);
});

test("volume is capped per project and per caller", async () => {
  const caller = { ip: "198.51.100.42" };
  const max = Number(process.env.INGEST_RATE_MAX || 600);

  for (let attempt = 0; attempt < max; attempt++) {
    const outcome = await run(ingest(caller));
    assert.equal(outcome.passed, true, `call ${attempt + 1} wrongly refused`);
  }

  const blocked = await run(ingest(caller));
  assert.equal(blocked.status, 429);

  // The limit is per caller: another visitor of the same site gets through.
  const other = await run(ingest({ ip: "198.51.100.43" }));
  assert.equal(other.passed, true);
});

test("a quota outage does not stop ingestion", async () => {
  const incr = redisClient.incr;
  redisClient.incr = async () => {
    throw new Error("redis unavailable");
  };

  try {
    const outcome = await run(ingest());
    // Losing the rate limit is better than losing customers' data.
    assert.equal(outcome.passed, true);
  } finally {
    redisClient.incr = incr;
  }
});

// Regression: the guard only read `project_id`, which the widget does not send
// on every endpoint. Event batches and session ends were all rejected, while the
// tests above, fed with a synthetic body, kept passing.
test("an event batch is attributed through the project of its events", async () => {
  const outcome = await run(
    ingest({ body: { events: [{ project: String(PROJECT) }, { project: String(PROJECT) }] } })
  );
  assert.equal(outcome.passed, true);
});

test("a batch mixing two projects is refused", async () => {
  const outcome = await run(
    ingest({ body: { events: [{ project: String(PROJECT) }, { project: String(oid()) }] } })
  );
  assert.equal(outcome.passed, false);
  assert.equal(outcome.code, "PROJECT_INVALID");
});

test("ending a session is attributed through the session itself", async () => {
  const outcome = await run(ingest({ body: { session_id: String(SESSION) } }));
  assert.equal(outcome.passed, true);

  const unknown = await run(ingest({ body: { session_id: String(oid()) } }));
  assert.equal(unknown.code, "PROJECT_INVALID");
});
