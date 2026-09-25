// Status synchronisation to Trello: the BugReveal kanban and the tool's
// board must stay aligned when a card is moved from either side.
import test from "node:test";
import assert from "node:assert/strict";

import mongoose from "../config/mongodb.js";
import IntegrationToken from "../models/IntegrationToken.js";
import integrationService from "../services/integration/integrationService.js";

const { moveCardToStatusList } = integrationService();

const oid = () => new mongoose.Types.ObjectId();

const PROJECT = oid();
const STATUS_DOING = oid();
const STATUS_DONE = oid();
const STATUS_UNMAPPED = oid();
const CARD_ID = "trello-card-123";

let storedToken = {
  token: "trello-token",
  board: "board-1",
  status_mapping: [
    { list_id: "list-doing", status: STATUS_DOING },
    { list_id: "list-done", status: STATUS_DONE },
  ],
};

IntegrationToken.findOne = async () => storedToken;

// Each test installs its own fetch stand-in and records the calls.
const originalFetch = globalThis.fetch;
let calls = [];
const stubFetch = (ok = true) => {
  calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), method: options?.method });
    return {
      ok,
      json: async () => ({}),
      text: async () => "erreur simulée",
    };
  };
};

test.after(() => {
  globalThis.fetch = originalFetch;
});

test("a mapped status moves the card to the right list", async () => {
  stubFetch(true);

  const result = await moveCardToStatusList({
    integration: "trello",
    project_id: PROJECT,
    card_id: CARD_ID,
    status: STATUS_DONE,
  });

  assert.equal(result.moved, true);
  assert.equal(result.list_id, "list-done");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "PUT");
  assert.ok(calls[0].url.includes(CARD_ID));
  assert.ok(calls[0].url.includes("idList=list-done"));
});

test("an unmapped status leaves the tool untouched", async () => {
  stubFetch(true);

  const result = await moveCardToStatusList({
    integration: "trello",
    project_id: PROJECT,
    card_id: CARD_ID,
    status: STATUS_UNMAPPED,
  });

  // Not every column has a counterpart in the tool: this is not an error,
  // but no call may go out.
  assert.equal(result.moved, false);
  assert.equal(result.reason, "status_not_mapped");
  assert.equal(calls.length, 0);
});

test("a project without an active integration is skipped with no network call", async () => {
  stubFetch(true);
  const previous = storedToken;
  storedToken = null;

  const result = await moveCardToStatusList({
    integration: "trello",
    project_id: PROJECT,
    card_id: CARD_ID,
    status: STATUS_DONE,
  });

  assert.equal(result.moved, false);
  assert.equal(result.reason, "integration_missing");
  assert.equal(calls.length, 0);

  storedToken = previous;
});

test("a call refused by Trello is reported, not swallowed", async () => {
  stubFetch(false);

  const result = await moveCardToStatusList({
    integration: "trello",
    project_id: PROJECT,
    card_id: CARD_ID,
    status: STATUS_DOING,
  });

  assert.equal(result.moved, false);
  assert.equal(result.reason, "remote_failure");
});

test("an incomplete request never reaches the network", async () => {
  stubFetch(true);

  for (const payload of [
    { integration: null, project_id: PROJECT, card_id: CARD_ID, status: STATUS_DONE },
    { integration: "trello", project_id: PROJECT, card_id: null, status: STATUS_DONE },
    { integration: "trello", project_id: PROJECT, card_id: CARD_ID, status: null },
  ]) {
    const result = await moveCardToStatusList(payload);
    assert.equal(result.moved, false);
    assert.equal(result.reason, "incomplete");
  }
  assert.equal(calls.length, 0);
});
