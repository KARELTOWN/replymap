// Installation state of a project: what it has received, why it may have
// received nothing, and the check run against the website itself.
import test from "node:test";
import assert from "node:assert/strict";

import mongoose from "../config/mongodb.js";
import Project from "../models/Project.js";
import Session from "../models/Session.js";
import Events from "../models/Events.js";
import {
  status,
  testPage,
  recordRefusal,
  recordHost,
  setHostBlocked,
  isHostBlocked,
} from "../services/project/installationService.js";
import projectService from "../services/project/projectService.js";
import { fetchPage } from "../shared/net/pageFetch.js";

const oid = () => new mongoose.Types.ObjectId();
const PROJECT = oid();
const OWNER = oid();
const OTHER_ACCOUNT = oid();

// The inventory of websites seen sending data, kept on the project itself.
const hosts = [];

const project = {
  _id: PROJECT,
  libelle: "Site vitrine",
  created_by: OWNER,
  link: "https://exemple.com",
  active: true,
  track: { active_recording: true },
  installed_hosts: hosts,
};

let lastSession = null;
let lastEvent = null;

Project.findById = () => ({
  lean: async () => project,
  select: () => ({ lean: async () => project }),
});
Project.updateOne = async (filter, update) => {
  if (filter["installed_hosts.host"]) {
    const known = hosts.find((entry) => entry.host === filter["installed_hosts.host"]);
    if (!known) return { matchedCount: 0 };
    const changes = update.$set;
    if ("installed_hosts.$.blocked" in changes) {
      known.blocked = changes["installed_hosts.$.blocked"];
      return { matchedCount: 1 };
    }
    known.last_seen_at = changes["installed_hosts.$.last_seen_at"];
    known.accepted = changes["installed_hosts.$.accepted"];
    return { matchedCount: 1 };
  }
  const [entry] = update.$push.installed_hosts.$each;
  hosts.push({ ...entry });
  // The cap is what keeps a copied snippet from growing the document forever.
  const cap = -update.$push.installed_hosts.$slice;
  if (hosts.length > cap) hosts.splice(0, hosts.length - cap);
  return { matchedCount: 1 };
};
Session.findOne = () => ({
  sort: () => ({ select: () => ({ lean: async () => (lastSession ? { startedAt: lastSession } : null) }) }),
});
Session.countDocuments = async () => (lastSession ? 3 : 0);
Events.findOne = () => ({
  sort: () => ({ select: () => ({ lean: async () => (lastEvent ? { createdAt: lastEvent } : null) }) }),
});
Events.countDocuments = async () => (lastEvent ? 7 : 0);

const hoursAgo = (hours) => new Date(Date.now() - hours * 3600 * 1000);

test("a project that has never received anything is waiting", async () => {
  const state = await status(PROJECT);

  assert.equal(state.state, "waiting");
  assert.equal(state.last_seen_at, null);
  assert.deepEqual(state.counts, { sessions: 0, events: 0 });
});

test("data received today means the script is working", async () => {
  lastSession = hoursAgo(2);
  const state = await status(PROJECT);

  assert.equal(state.state, "receiving");
  assert.equal(state.counts.sessions, 3);
  assert.equal(Number(state.last_seen_at), Number(lastSession));
});

test("the most recent of sessions and events is what counts", async () => {
  lastSession = hoursAgo(40);
  lastEvent = hoursAgo(1);

  assert.equal((await status(PROJECT)).state, "receiving");

  lastEvent = hoursAgo(36);
  const stale = await status(PROJECT);
  assert.equal(stale.state, "idle");
  // The event is more recent than the session: it is the one reported.
  assert.equal(Number(stale.last_seen_at), Number(lastEvent));
});

test("a refused call explains the silence, with the domain that called", async () => {
  await recordRefusal(PROJECT, { code: "TRACKING_ORIGIN_REJECTED", host: "staging.exemple.com" });

  const [reason] = (await status(PROJECT)).reasons;
  assert.equal(reason.code, "TRACKING_ORIGIN_REJECTED");
  assert.equal(reason.host, "staging.exemple.com");
});

test("a disabled project and a collection switched off are reported", async () => {
  project.active = false;
  project.track = {
    active_recording: false,
    active_track_errors: false,
    active_event_issues: false,
    active_performance_issues: false,
  };

  const codes = (await status(PROJECT)).reasons.map((reason) => reason.code);
  assert.deepEqual(codes.slice(0, 2), ["PROJECT_DISABLED", "COLLECTION_OFF"]);

  project.active = true;
  project.track = { active_recording: true };
});

// --- Where the script actually runs -------------------------------------------

test("a website sending data is listed, refused ones included", async () => {
  await recordHost(PROJECT, "exemple.com", true);
  await recordHost(PROJECT, "preprod.exemple.com", false);

  const listed = (await status(PROJECT)).hosts;
  assert.deepEqual(
    listed.map((entry) => [entry.host, entry.accepted]).sort(),
    [
      ["exemple.com", true],
      ["preprod.exemple.com", false],
    ].sort()
  );
  assert.ok(listed.every((entry) => entry.first_seen_at && entry.last_seen_at));
});

test("a host already known is refreshed, not added twice", async () => {
  const before = (await status(PROJECT)).hosts.length;

  // Written again within the hour: the throttle drops it.
  assert.equal(await recordHost(PROJECT, "exemple.com", true), false);
  assert.equal((await status(PROJECT)).hosts.length, before);
});

test("an empty host is not recorded at all", async () => {
  const before = (await status(PROJECT)).hosts.length;

  assert.equal(await recordHost(PROJECT, null, true), false);
  assert.equal((await status(PROJECT)).hosts.length, before);
});

// --- Switching one website off ------------------------------------------------

test("only the owner may switch a website off", async () => {
  await assert.rejects(
    setHostBlocked({
      user: { _id: OTHER_ACCOUNT },
      projectId: PROJECT,
      host: "exemple.com",
      blocked: true,
    }),
    (error) => error.code === "PROJECT_OWNER_ONLY"
  );
});

test("a website never seen on this project cannot be switched off", async () => {
  await assert.rejects(
    setHostBlocked({
      user: { _id: OWNER },
      projectId: PROJECT,
      host: "inconnu.example",
      blocked: true,
    }),
    (error) => error.code === "INSTALLATION_HOST_UNKNOWN"
  );
});

test("a website switched off stops the script entirely, on that site only", async () => {
  await setHostBlocked({
    user: { _id: OWNER },
    projectId: PROJECT,
    host: "preprod.exemple.com",
    blocked: true,
  });

  // The ingestion guard turns away everything it still sends.
  assert.equal(isHostBlocked(project, "preprod.exemple.com"), true);
  assert.equal(isHostBlocked(project, "exemple.com"), false);

  // And the widget stops itself: the public sheet answers "inactive" to that
  // site, which is what makes it shut down — recording, events and the
  // feedback widget alike.
  const service = projectService();
  assert.equal((await service.showPublic(PROJECT, "preprod.exemple.com")).active, false);
  assert.equal((await service.showPublic(PROJECT, "exemple.com")).active, true);
  // A call with no readable origin is not cut off by another site's switch.
  assert.equal((await service.showPublic(PROJECT)).active, true);
});

test("switching it back on restores it", async () => {
  await setHostBlocked({
    user: { _id: OWNER },
    projectId: PROJECT,
    host: "preprod.exemple.com",
    blocked: false,
  });

  assert.equal(isHostBlocked(project, "preprod.exemple.com"), false);
  assert.equal((await projectService().showPublic(PROJECT, "preprod.exemple.com")).active, true);
});

// --- The check run against the website ----------------------------------------

const withStubbedFetch = async (html, run) => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => null },
    body: null,
    text: async () => html,
  });
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
};

test("the snippet is recognised, and so is one copied from another project", async () => {
  const snippet = (id) =>
    `<html><body><script src='https://cdn.bugreveal.io/record.js' defer type='module'></script>` +
    `<script id='rrweb-init' data-project='${id}'></script></body></html>`;

  const found = await withStubbedFetch(snippet(PROJECT), () => testPage(PROJECT));
  assert.deepEqual(
    { reachable: found.reachable, script: found.script_found, matched: found.project_matched },
    { reachable: true, script: true, matched: true }
  );

  // The script is there, but it feeds another project: nothing will ever
  // arrive here, and "script détecté" alone would be a lie.
  const other = await withStubbedFetch(snippet(oid()), () => testPage(PROJECT));
  assert.equal(other.script_found, true);
  assert.equal(other.project_matched, false);

  const bare = await withStubbedFetch("<html><body>Bonjour</body></html>", () => testPage(PROJECT));
  assert.equal(bare.script_found, false);
});

test("the server refuses to fetch an address on its own network", async () => {
  for (const address of [
    "http://localhost/",
    "http://127.0.0.1/",
    "http://169.254.169.254/latest/meta-data/",
    "http://10.0.0.5/",
    "http://192.168.1.10/",
    "file:///etc/passwd",
  ]) {
    const result = await fetchPage(address);
    assert.equal(result.ok, false, address);
    assert.equal(result.reason, "refused", address);
  }
});

test("a project without a domain is not tested at all", async () => {
  project.link = "";
  const result = await testPage(PROJECT);

  assert.deepEqual(result, { reachable: false, reason: "NO_DOMAIN" });
  project.link = "https://exemple.com";
});
