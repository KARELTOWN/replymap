import { project_id } from "../record";
import { fetchPost } from "../utils/request";
import { v4 as UUID } from "uuid";
import { getSessionId } from "../utils/session.js";
import { addReplayEvent } from "../utils/replayEvent.js";
import { onINP, onLCP, onCLS, onFCP, onTTFB } from "web-vitals";
import dbtransaction from "../utils/indexDB.js";
const { getEvents, saveEvents, deleteEventByKeys } = dbtransaction();
import * as rrweb from "rrweb";
import { describeElement } from "./describeElement.js";

const backURL = `${import.meta.env.VITE_BACKEND_URL}`;

/**
 * Passive collection of what happens on the page.
 *
 * Two families, switched on independently by the project:
 *
 *   - **errors** (JavaScript errors and rejected promises) do not need a
 *     recording session. They are worth having on a project that records
 *     nothing, and they are attached to a session only when one exists;
 *   - **behaviours** (pages visited, forms sent, forms refused) only make
 *     sense inside a session: they describe a path, and a path without a
 *     session to place it in has nothing to say.
 */
export default function eventTracker({ errors = true, behaviours = true } = {}) {
  const getEventsTrack = async () => {
    try {
      return await getEvents("replay_map_events_tracker");
    } catch (err) {
      console.warn("Erreur saveEventsTrack", err);
    }
  };

  const saveEventsTrack = async (data) => {
    try {
      await saveEvents("replay_map_events_tracker", data);
    } catch (err) {
      console.warn("Erreur saveEventsTrack", err);
    }
  };

  let allEvents = [];

  // Track the visitor to know which pages were visited

  const consoleErrorTracker = () => {
    // Intercept errors: REFERENCEERROR, TYPEERROR, SYNTAXERROR, ...
    // As well as resource loading failures
    window.addEventListener("error", (err) => {
      let rrweb_timestamp = Date.now();
      let session_id = getSessionId();

      addReplayEvent("runtime_errors", {
        page_url: window.location.href,
        filename: err.filename,
        line: err.line,
        message: err.message,
      });

      allEvents.push({
        type: "runtime_errors",
        project: project_id,
        session: session_id || null,
        page_url: window.location.href,
        data: {
          filename: err.filename,
          line: err.lineno,
          message: err.message,
          resource_source: err.target?.src || null,
        },
        timestamp: rrweb_timestamp,
        uniqueId: UUID(),
      });
    });

    // Capture unhandled exceptions and promises
    window.addEventListener("unhandledrejection", (err) => {
      let rrweb_timestamp = Date.now();
      let session_id = getSessionId();

      addReplayEvent("unhandled-promise-rejection", {
        page_url: window.location.href,
        message: err?.reason?.message || "Unknown error",
        stack: err?.reason?.stack || "",
      });

      // intercept uncaught promise rejections
      allEvents.push({
        type: "unhandle_promise_rejection",
        project: project_id,
        session: session_id || null,
        page_url: window.location.href,
        data: {
          message: err.reason.message,
          stack: err.reason.stack,
        },
        timestamp: rrweb_timestamp,
        uniqueId: UUID(),
      });
    });
  };

  // Pages seen during the session, internal navigation included.
  //
  // A single-page application never reloads: without listening to the History
  // API, a whole visit was recorded as one page. The type existed in the
  // reference data and nothing ever emitted it.
  const pageViewTracker = () => {
    let lastUrl = null;

    const record = (from) => {
      const session_id = getSessionId();
      const url = window.location.href;
      if (!session_id || url === lastUrl) return;
      lastUrl = url;

      const payload = {
        page_url: url,
        title: document.title,
        from: from || null,
      };
      addReplayEvent("page-view", payload);
      allEvents.push({
        type: "page_view",
        project: project_id,
        session: session_id,
        page_url: url,
        data: payload,
        timestamp: Date.now(),
        uniqueId: UUID(),
      });
    };

    record(document.referrer || null);

    // History API: patched once, so a navigation made by the framework is seen.
    for (const method of ["pushState", "replaceState"]) {
      const original = history[method].bind(history);
      history[method] = (...args) => {
        const previous = window.location.href;
        const result = original(...args);
        record(previous);
        return result;
      };
    }
    window.addEventListener("popstate", () => record(lastUrl));
    window.addEventListener("hashchange", () => record(lastUrl));
  };

  // A form actually sent. With the pages visited, this is what the session
  // flow is made of: one sees where the visitor went, and what they submitted
  // on the way. The form, the page and the button that sent it are identified;
  // nothing the visitor typed is ever read.
  const formSubmitTracker = () => {
    document.addEventListener(
      "submit",
      (event) => {
        const session_id = getSessionId();
        const form = event.target;
        if (!session_id || !form) return;

        const described = describeElement(form);
        // `submitter` is the control that sent the form, when the browser
        // knows it: a form submitted from code has none.
        const submitter = event.submitter ? describeElement(event.submitter) : null;

        const payload = {
          page_url: window.location.href,
          title: document.title,
          form: described.selector,
          form_id: form.id || form.name || null,
          label: described.label,
          submit: submitter?.selector || null,
          submit_id: event.submitter?.id || event.submitter?.name || null,
          submit_label: submitter?.label || null,
        };

        allEvents.push({
          type: "form_submit",
          project: project_id,
          session: session_id,
          page_url: window.location.href,
          data: payload,
          timestamp: Date.now(),
          uniqueId: UUID(),
        });
        addReplayEvent("form-submit", payload);
      },
      true
    );
  };

  // A form the browser refused to submit: the visitor tried, and something in
  // the page said no. The fields are named, never their values.
  const formErrorTracker = () => {
    const invalidFields = new Map();

    document.addEventListener(
      "invalid",
      (event) => {
        const field = event.target;
        if (!field?.form) return;
        const fields = invalidFields.get(field.form) || [];
        fields.push({
          name: field.name || field.id || describeElement(field).selector,
          reason: field.validationMessage || "invalide",
        });
        invalidFields.set(field.form, fields);
      },
      true
    );

    // The invalid events of one attempt fire just before the submit is
    // cancelled: they are collected, then reported together.
    document.addEventListener(
      "submit",
      (event) => {
        setTimeout(() => invalidFields.delete(event.target), 0);
      },
      true
    );

    setInterval(() => {
      const session_id = getSessionId();
      if (!session_id || invalidFields.size === 0) return;

      for (const [form, fields] of invalidFields.entries()) {
        const payload = {
          page_url: window.location.href,
          form: describeElement(form).selector,
          label: describeElement(form).label,
          fields: fields.slice(0, 10),
          count: fields.length,
        };
        addReplayEvent("form-error", payload);
        allEvents.push({
          type: "form_error",
          project: project_id,
          session: session_id,
          page_url: window.location.href,
          data: payload,
          timestamp: Date.now(),
          uniqueId: UUID(),
        });
      }
      invalidFields.clear();
    }, 2000);
  };

  // pageLoadPerformance();
  if (errors) consoleErrorTracker();
  if (behaviours) {
    pageViewTracker();
    formSubmitTracker();
    formErrorTracker();
  }

  let flushInProgress = false;
  const flush = async () => {
    if (flushInProgress) return; // prevents concurrent runs on allEvents
    flushInProgress = true;
    try {
      let events_to_save = allEvents;
      allEvents = [];
      if (events_to_save.length > 0) {
        await saveEventsTrack(events_to_save);
      }
      let toSave = await getEventsTrack();

      if (
        toSave &&
        Array.isArray(toSave.events_data) &&
        toSave.events_data.length > 0
      ) {
        let firstTen = toSave.events_data.slice(0, 10);
        let firstTenKeys = toSave.events_keys.slice(0, 10);
        let newElements = {
          events_data: firstTen,
          events_keys: firstTenKeys,
        };

        await storeEvents(newElements);
      }
    } catch (error) {
      console.error("error", error);
    } finally {
      flushInProgress = false;
    }
  };
  setInterval(flush, 2000);

  window.addEventListener("beforeunload", () => {
    try {
      if (allEvents.length > 0) {
        const blob = new Blob([JSON.stringify({ events: allEvents })], {
          type: "application/json",
        });
        navigator.sendBeacon(`${backURL}/event/store`, blob);
      }
    } catch (err) {
      console.warn("Erreur beforeunload eventTracker", err);
    }
  });
}
