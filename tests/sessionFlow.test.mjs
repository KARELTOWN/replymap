// The path of a session: pages visited and forms sent, turned into a small
// graph. A page seen twice is one node visited twice, not two nodes.
import test from "node:test";
import assert from "node:assert/strict";

import mongoose from "../config/mongodb.js";
import Session from "../models/Session.js";
import Events from "../models/Events.js";
import EventType from "../models/EventType.js";
import UserProject from "../models/UserProject.js";
import Role from "../models/Role.js";
import { flowOf } from "../services/session/sessionFlowService.js";

const oid = () => new mongoose.Types.ObjectId();
const SESSION = oid();
const PROJECT = oid();
const MEMBER = { _id: oid() };

Session.findById = () => ({ lean: async () => ({ _id: SESSION, project_id: PROJECT }) });
UserProject.exists = async () => ({ _id: oid() });
UserProject.find = () => ({ distinct: async () => [PROJECT] });
Role.findById = () => ({ select: () => ({ lean: async () => null }) });

const pageView = (path, title, at) => ({
  type: { libelle: "page_view" },
  page_url: `https://exemple.com${path}`,
  data: { page_url: `https://exemple.com${path}`, title },
  timestamp: at,
});

const formSubmit = (path, at, data) => ({
  type: { libelle: "form_submit" },
  page_url: `https://exemple.com${path}`,
  data: { page_url: `https://exemple.com${path}`, ...data },
  timestamp: at,
});

// Contact → Accueil → Pays → Accueil (submits a form) → Départ
const journey = [
  pageView("/contact", "Contact", 1000),
  pageView("/", "Accueil", 2000),
  pageView("/pays", "Pays", 3000),
  pageView("/", "Accueil", 4000),
  formSubmit("/", 4500, {
    form_id: "newsletter",
    submit_id: "send",
    label: "Inscription",
  }),
  pageView("/depart", "Départ", 5000),
];

EventType.find = () => ({ select: () => ({ lean: async () => [{ _id: oid() }, { _id: oid() }] }) });
Events.find = () => ({
  populate: () => ({ sort: () => ({ lean: async () => journey }) }),
});

test("each page is one node, counted once per visit", async () => {
  const { nodes } = await flowOf({ user: MEMBER, sessionId: SESSION });

  assert.deepEqual(
    nodes.map((node) => [node.id, node.visits]).sort(),
    [
      ["/", 2],
      ["/contact", 1],
      ["/depart", 1],
      ["/pays", 1],
    ]
  );
});

test("a move between two pages is an edge, a return is its own edge", async () => {
  const { edges } = await flowOf({ user: MEMBER, sessionId: SESSION });
  const drawn = edges.map((edge) => `${edge.from}→${edge.to}`);

  assert.ok(drawn.includes("/→/pays"), "aller");
  assert.ok(drawn.includes("/pays→/"), "retour");
  // Direction matters: the two are not the same edge.
  assert.equal(edges.find((edge) => edge.from === "/pays").count, 1);
});

test("a form sent is a step of its own, on the page it was sent from", async () => {
  const { steps, nodes } = await flowOf({ user: MEMBER, sessionId: SESSION });
  const form = steps.find((step) => step.kind === "form");

  assert.equal(form.node, "/");
  assert.equal(form.form, "newsletter");
  assert.equal(form.submit, "send");
  assert.equal(nodes.find((node) => node.id === "/").forms, 1);

  // It does not move the visitor: the next page still comes from "/".
  const after = steps[steps.indexOf(form) + 1];
  assert.equal(after.from, "/");
});

test("the steps keep the order the visitor followed", async () => {
  const { steps } = await flowOf({ user: MEMBER, sessionId: SESSION });

  assert.deepEqual(
    steps.map((step) => `${step.kind}:${step.node}`),
    ["page:/contact", "page:/", "page:/pays", "page:/", "form:/", "page:/depart"]
  );
});

test("a page reached with a query string is the same node", async () => {
  journey.push({
    type: { libelle: "page_view" },
    page_url: "https://exemple.com/pays?tri=nom",
    data: { page_url: "https://exemple.com/pays?tri=nom", title: "Pays" },
    timestamp: 6000,
  });

  const { nodes } = await flowOf({ user: MEMBER, sessionId: SESSION });
  assert.equal(nodes.filter((node) => node.id === "/pays").length, 1);
  assert.equal(nodes.find((node) => node.id === "/pays").visits, 2);

  journey.pop();
});
