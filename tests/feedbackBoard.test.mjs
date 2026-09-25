// Reading the tracking board: the result must be correct AND obtained in a
// single Mongo query (this view used to query the database once per status).
import test from "node:test";
import assert from "node:assert/strict";

import mongoose from "../config/mongodb.js";
import Feedback from "../models/Feedback.js";
import FeedbackStatus from "../models/FeedbackStatus.js";
import FeedbackType from "../models/FeedbackType.js";
import feedbackController from "../controllers/feedback/feedbackController.js";

const oid = () => new mongoose.Types.ObjectId();

const OPEN = { _id: oid(), libelle: "Ouvert" };
const DOING = { _id: oid(), libelle: "En cours" };
const DONE = { _id: oid(), libelle: "Résolu" };
const BUG = { _id: oid(), libelle: "Bug" };

// Stand-in for Mongoose's fluent chain (find().populate().sort()...).
const chain = (value) => {
  const link = {
    populate: () => link,
    select: () => link,
    sort: () => link,
    skip: () => link,
    limit: () => link,
    lean: () => link,
    exec: async () => value,
    then: (resolve, rejectFn) => Promise.resolve(value).then(resolve, rejectFn),
  };
  return link;
};

const counters = { feedback: 0 };

FeedbackStatus.find = () => chain([OPEN, DOING, DONE]);
FeedbackType.find = () => chain([BUG]);

const FEEDBACKS = [
  { _id: oid(), title: "A", status: OPEN._id, createdAt: new Date("2026-09-03") },
  { _id: oid(), title: "B", status: DOING._id, createdAt: new Date("2026-09-02") },
  { _id: oid(), title: "C", status: OPEN._id, createdAt: new Date("2026-09-01") },
];
Feedback.find = () => {
  counters.feedback++;
  return chain(FEEDBACKS);
};


const { getFeedbackPerProject } = feedbackController();

const capture = async (handler, req) => {
  const outcome = {};
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
  await handler(req, res, (err) => {
    if (err) throw err;
  });
  return outcome;
};

test("the board returns one column per status in a single query", async () => {
  counters.feedback = 0;

  const outcome = await capture(getFeedbackPerProject, {
    body: { project_id: String(oid()) },
    user: { _id: oid() },
  });

  assert.equal(outcome.status, 200);
  assert.equal(counters.feedback, 1);

  const groups = outcome.body.data;
  assert.equal(groups.length, 3);
  assert.equal(groups[0].status.libelle, "Ouvert");
  assert.equal(groups[0].feedbacks.length, 2);
  assert.equal(groups[1].feedbacks.length, 1);
  // An empty column stays present, otherwise it would vanish from the board.
  assert.equal(groups[2].feedbacks.length, 0);
  // The original order (newest first) is kept.
  assert.deepEqual(
    groups[0].feedbacks.map((feedback) => feedback.title),
    ["A", "C"]
  );
});

