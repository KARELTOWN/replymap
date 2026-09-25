// Scheduled maintenance of sessions: closing what the widget left open, and
// deleting what recorded nothing. A session that owns chunks is never deleted.
import test from "node:test";
import assert from "node:assert/strict";

import mongoose from "../config/mongodb.js";
import Session from "../models/Session.js";
import Chunk from "../models/Chunk.js";
import { removeEmptySessions, schedule_expired_session } from "../services/schedule.js";

const oid = () => new mongoose.Types.ObjectId();

const EMPTY_CLOSED = oid(); // the widget closed it without sending anything
const EMPTY_OPEN = oid();
const RECORDED = oid(); // recorded before the flag existed

const withRecording = new Set([String(RECORDED)]);
const flagged = [];
let deleted = [];

// Only the sessions flagged as having recorded nothing are shortlisted, and a
// closed one is judged sooner than an open one.
let lastFilter = null;
Session.find = (filter) => ((lastFilter = filter), {
  select: () => ({
    sort: () => ({
      limit: () => ({
        lean: async () => [{ _id: EMPTY_CLOSED }, { _id: EMPTY_OPEN }, { _id: RECORDED }],
      }),
    }),
  }),
});
Session.updateOne = async ({ _id }) => flagged.push(String(_id));
Session.deleteMany = async ({ _id }) => {
  deleted = _id.$in.map(String);
  return { deletedCount: deleted.length };
};

Chunk.exists = async ({ session_id }) =>
  withRecording.has(String(session_id)) ? { _id: oid() } : null;

test("a session that recorded nothing is deleted, closed or not", async () => {
  const removed = await removeEmptySessions();

  assert.equal(removed, 2);
  assert.deepEqual(deleted.sort(), [String(EMPTY_CLOSED), String(EMPTY_OPEN)].sort());
});

test("a session that owns chunks is kept, and flagged so it is not looked at again", async () => {
  assert.equal(deleted.includes(String(RECORDED)), false);
  assert.deepEqual(flagged, [String(RECORDED)]);
});

test("an open session is given far longer than a closed one", () => {
  const [closed, open] = lastFilter.$or;

  assert.ok(closed.endedAt.$ne === null && open.endedAt === null);
  // A session still open must be much older before it is even considered.
  assert.ok(open.startedAt.$lt < closed.startedAt.$lt);
});

// Importing the module starts its cron: stopped here, otherwise the test
// process never exits.
test.after(() => schedule_expired_session.stop());
