import _ from "lodash";
import { fetchPost } from "../utils/request.js";
import { project_id } from "../record.js";
import { v4 as uuidV4 } from "uuid";
import { getSessionId } from "../utils/session.js";
import { addReplayEvent } from "../utils/replayEvent.js";
import dbtransaction from "../utils/indexDB.js";
const { getEvents, saveEvents, deleteEventByKeys } = dbtransaction();
import * as rrweb from "rrweb";

const getIntercepts = async () => {
  try {
    return await getEvents("replay_map_events_tracker");
  } catch (error) {
    console.warn("Erreur saveIntercepts", error);
  }
};

const saveIntercepts = async (data) => {
  try {
    await saveEvents("replay_map_events_tracker", data);
  } catch (error) {
    console.warn("Erreur saveIntercepts", error);
  }
};

let intercepts = [];

export default function interceptRequest() {
  const originalFetch = window.fetch;

  // intercept requests made with FETCH
  window.fetch = async (...args) => {
    try {
      let rrweb_timestamp = Date.now();
      const start = performance.now();
      // Modify request if needed
      const [url, config] = args;

      const response = await originalFetch(url, config);
      const clonedResponse = response.clone();

      const end = performance.now();
      // keeps the intercept handling off the main thread
      setTimeout(() => {
        handleIntercept(
          clonedResponse,
          response,
          url,
          config,
          rrweb_timestamp,
          start,
          end
        ).catch((err) => {
          console.warn("Erreur dans handleIntercept", err);
        });
      }, 0);
      return response;
    } catch (error) {
      console.error("error", error);
    }
  };
}

// Fields never sent as is (passwords, tokens, payment, identity...)
const SENSITIVE_FIELD_PATTERN =
  /pass(word)?|token|secret|auth|card|cvv|cvc|iban|bic|bank|ssn|ccn|ccv/i;
const MAX_CAPTURED_BODY_SIZE = 5 * 1024; // 5 Ko

const redactSensitiveFields = (value) => {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveFields);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        SENSITIVE_FIELD_PATTERN.test(key)
          ? "[redacted]"
          : redactSensitiveFields(val),
      ])
    );
  }
  return value;
};

const truncateBody = (data) => {
  const serialized = typeof data === "string" ? data : JSON.stringify(data);
  if (!serialized || serialized.length <= MAX_CAPTURED_BODY_SIZE) return data;
  const truncated = serialized.slice(0, MAX_CAPTURED_BODY_SIZE);
  return typeof data === "string" ? `${truncated}... [tronqué]` : truncated;
};

const headersToPlainObject = (headers) => {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
};

// Only captures calls to the website's own domain or to the BugReveal
// backend: responses of third-party APIs (analytics, payment, etc.) may hold
// data that is not ours to collect.
const isCapturableUrl = (url) => {
  try {
    const target = new URL(url, window.location.origin);
    return (
      target.origin === window.location.origin || avoid_records_urls(url)
    );
  } catch {
    return false;
  }
};

async function handleIntercept(
  clonedResponse,
  response,
  url,
  config,
  rrweb_timestamp,
  start,
  end
) {
  let session_id = getSessionId();
  if (!clonedResponse.ok) {
    const avoid_urls = avoid_records_urls(url);

    if (avoid_urls === false && isCapturableUrl(url)) {
      const contentType = clonedResponse.headers.get("Content-Type");

      let jsonData;
      if (contentType && contentType.includes("application/json")) {
        try {
          jsonData = await clonedResponse.json();
        } catch (err) {
          jsonData = await clonedResponse.text();
        }
      } else {
        jsonData = await clonedResponse.text();
      }
      jsonData = truncateBody(redactSensitiveFields(jsonData));

      const duration = (end - start) / 1000;
      const headers = headersToPlainObject(config.headers);
      delete headers.Authorization;
      delete headers.authorization;

      const request_general = {
        url: url,
        body: truncateBody(redactSensitiveFields(config.body)),
        headers,
        method: config.method || "GET",
      };
      const request_response = {
        status: response.status,
        statusText: response.statusText,
        response: jsonData,
        duration: duration + "s",
      };
      addReplayEvent("network-error", {
        page_url: url,
        status: response.status,
        statusText: response.statusText,
        method: config.method || "GET",
        timestamp: rrweb_timestamp,
      });
      intercepts.push({
        type: "request_errors",
        project: project_id,
        session: session_id || null,
        page_url: window.location.href,
        data: {
          general: request_general,
          response: request_response,
        },
        uniqueId: uuidV4(),
        timestamp: rrweb_timestamp,
      });
      let intercepts_to_save = intercepts;
      intercepts = [];
      await saveIntercepts(intercepts_to_save);
      if (intercepts_to_save.length > 0) {
        sendInterceptData();
      }
    }
  }
}

const sendInterceptData = _.debounce(async () => {
  try {
    const data = await getIntercepts();
    if (data && data.events_data.length > 0) {
      const response = await fetchPost("event/store", {
        events: data.events_data,
      });
      if (response.ok) {
        deleteEventByKeys("replay_map_events_tracker", data.events_keys);
      }
    }
  } catch (error) {
    console.log("Request save error", error);
  }
}, 2000);

const backURL = `${import.meta.env.VITE_BACKEND_URL}`;

window.addEventListener("beforeunload", () => {
  try {
    if (intercepts.length > 0) {
      const blob = new Blob([JSON.stringify({ events: intercepts })], {
        type: "application/json",
      });
      navigator.sendBeacon(`${backURL}/event/store`, blob);
    }
  } catch (err) {
    console.warn("Erreur beforeunload interceptRequest", err);
  }
});

const avoid_records_urls = (url) => {
  if (typeof url === "string" && url.includes(backURL)) {
    return true;
  }
  return false;
};
