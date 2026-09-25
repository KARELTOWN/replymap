import crypto from "crypto";
import FormData from "form-data";
import axios from "axios";

// Thin client for the Trello REST API.
//
// Every function takes explicit credentials and returns the parsed response or
// null. No database, no product rule: which board, which list and when to call
// is decided by integrationService.

const BASE = "https://api.trello.com/1";

const withAuth = (path, { apiKey, token }, params = {}) => {
  const query = new URLSearchParams({ ...params, key: apiKey, token });
  return `${BASE}${path}?${query.toString()}`;
};

const readJson = async (response, context) => {
  if (response.ok) return response.json();
  console.error(`Trello ${context} failed`, response.status, await response.text());
  return null;
};

export const listBoards = async (credentials) =>
  readJson(
    await fetch(withAuth("/members/me/boards", credentials, { fields: "name,url" }), {
      headers: { Accept: "application/json" },
    }),
    "boards"
  );

export const listOpenLists = async (credentials, boardId) =>
  readJson(
    await fetch(withAuth(`/boards/${boardId}/lists`, credentials, { filter: "open" }), {
      headers: { Accept: "application/json" },
    }),
    "lists"
  );

export const listLabels = async (credentials, boardId) => {
  const labels = await readJson(
    await fetch(withAuth(`/boards/${boardId}/labels`, credentials), {
      headers: { Accept: "application/json" },
    }),
    "labels"
  );
  // Trello returns its six default colour slots with an empty name.
  return labels ? labels.filter((label) => label.name !== "") : null;
};

export const createLabel = async (credentials, boardId, { name, color }) =>
  readJson(
    await fetch(
      withAuth(`/boards/${boardId}/labels`, credentials, { name, color: color ?? "" }),
      { method: "POST", headers: { Accept: "application/json" } }
    ),
    "label creation"
  );

// Title and description travel as query parameters: URLSearchParams encodes
// them. The previous string interpolation broke any title containing `&`, `#`
// or `?`, and silently truncated the card.
export const createCard = async (credentials, { listId, name, description, labelIds }) =>
  readJson(
    await fetch(
      withAuth("/cards", credentials, { idList: listId, name, desc: description ?? "" }),
      {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ idLabels: labelIds }),
      }
    ),
    "card creation"
  );

export const moveCard = async (credentials, cardId, listId) => {
  const response = await fetch(withAuth(`/cards/${cardId}`, credentials, { idList: listId }), {
    method: "PUT",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    console.error("Trello card move failed", response.status, await response.text());
  }
  return response.ok;
};

// Attaches a file already hosted elsewhere, by URL.
export const uploadAttachments = async (credentials, cardId, files) => {
  const url = withAuth(`/cards/${cardId}/attachments`, credentials);

  for (const file of files) {
    const filename = file.originalname || file.fieldname || "attachment";
    const form = new FormData();
    form.append("name", filename);
    form.append("mimeType", file.mimetype);
    form.append("file", file.buffer, { filename, contentType: file.mimetype });

    await axios.post(url, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  }
  return true;
};

export const createWebhook = async (credentials, { callbackURL, modelId }) =>
  readJson(
    await fetch(withAuth("/webhooks", credentials, { callbackURL, idModel: modelId }), {
      method: "POST",
      headers: { Accept: "application/json" },
    }),
    "webhook creation"
  );

export const deleteWebhook = async (credentials, webhookId) => {
  try {
    await fetch(withAuth(`/webhooks/${webhookId}`, credentials), { method: "DELETE" });
  } catch (error) {
    console.error("Trello webhook deletion failed", error);
  }
};

// Trello signs every webhook call with HMAC-SHA1(secret, body + callback URL).
// Without this check, anyone knowing the webhook URL could forge a status change.
export const verifySignature = ({ secret, rawBody, callbackURL, signature }) => {
  if (!signature || !secret) return false;

  const digest = crypto
    .createHmac("sha1", secret)
    .update(Buffer.concat([Buffer.from(rawBody), Buffer.from(callbackURL)]))
    .digest("base64");

  const expected = Buffer.from(digest);
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
};

export const buildAuthorizeUrl = ({ apiKey, expiration, scope, returnType, returnUrl }) => {
  const query = new URLSearchParams({
    expiration,
    scope,
    response_type: returnType,
    key: apiKey,
    return_url: returnUrl,
  });
  return `https://trello.com/1/authorize?${query.toString()}`;
};
