import _ from "lodash";
import { v4 as uuidV4 } from "uuid";
import * as rrweb from "rrweb";
import { fetchGet, fetchPost } from "../utils/request";
import { getIpAdress } from "../utils/ipAdress";
import { project_id } from "../record.js";
import setCookieUser, { getBugRevealToken } from "../utils/cookie.js";
import { getSessionId } from "../utils/session.js";
import { maskSelector } from "../utils/maskSelector.js";

import pako from "pako";
import dbtransaction from "../utils/indexDB.js";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";
const { getEvents, saveEvents, deleteEventByKeys } = dbtransaction();
const backURL = `${import.meta.env.VITE_BACKEND_URL}`;
import recordWorker from "../../public/workers/recordWorker.js?raw";

const getSessionEvents = async () => {
  try {
    return await getEvents("replay_map_record_events");
  } catch (err) {
    console.warn("Erreur getSessionEvents", err);
  }
};

const saveSessionEvents = async (data) => {
  try {
    await saveEvents("replay_map_record_events", data);
  } catch (err) {
    console.warn("Erreur getSessionEvents", err);
  }
};

export default async function initializeRecord() {
  let session_id = getSessionId();
  let session_events = [];
  let sessionCreate = false;
  let events = [];
  let stopRecording = null;
  const maxRetryCreateSession = 2;
  let retryCreateSession = 0;
  const INACTIVITY_LIMIT = 30 * 1000;
  // A session lasts 30 min at most, even with continuous activity: beyond
  // that, it is closed and a new one opened automatically so nothing is lost
  // (there was no cap before, a session could last forever).
  const MAX_SESSION_DURATION = 30 * 60 * 1000;
  let inactivityTimeout = null;
  let maxDurationTimeout = null;
  let retryFetchSessionInfo = 0;
  let maxFetchSessionInfo = 2;

  const setInactivityTimeout = () => {
    return setTimeout(() => {
      rotateSession();
    }, INACTIVITY_LIMIT);
  };

  inactivityTimeout = setInactivityTimeout();

  const resetInactivityTimeout = () => {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setInactivityTimeout();
  };

  // Computed from the real start of the session (not the current page load):
  // a session resumed after navigation must not restart for a full 30 minutes.
  const setMaxDurationTimeout = (startedAtMs) => {
    const elapsed = Date.now() - startedAtMs;
    const remaining = Math.max(MAX_SESSION_DURATION - elapsed, 0);
    return setTimeout(() => {
      rotateSession();
    }, remaining);
  };

  let chunkWorker = null;
  const getChunkWorker = () => {
    if (!chunkWorker) {
      const blob = new Blob([recordWorker], { type: "application/javascript" });
      chunkWorker = new Worker(URL.createObjectURL(blob));
      chunkWorker.onerror = (e) => {
        console.error("Erreur dans le worker :", e.message);
        console.error("Fichier source :", e.filename);
        console.error("Ligne :", e.lineno, "Colonne :", e.colno);
      };
    }
    return chunkWorker;
  };

  const uploadChunk = async (chunks) => {
    if (!project_id) return;

    const payload = { project_id, events: chunks.events_data };
    const requestId = uuidV4();
    try {
      const worker = getChunkWorker();

      const handleMessage = (e) => {
        const { type, error, requestId: responseId } = e.data;
        if (responseId !== requestId) return;
        worker.removeEventListener("message", handleMessage);
        if (type === "done") {
          deleteEventByKeys("replay_map_record_events", chunks.events_keys);
        } else if (type === "error") {
          console.error(error);
        }
      };
      worker.addEventListener("message", handleMessage);

      worker.postMessage({
        param: {
          url: `${backURL}/chunk/store`,
          payload: payload,
          token: getBugRevealToken(),
          method: "POST",
          requestId,
        },
        action: "storeChunk",
      });
    } catch (error) {
      console.error(error);
    }
  };

  // A chunk closes on whichever comes first: enough events, or enough time.
  const CHUNK_MAX_EVENTS = 100;
  const CHUNK_MAX_AGE_MS = 10000;
  let firstEventAt = Date.now();

  const saveChunk = _.debounce(async () => {
    const data = await getSessionEvents();
    if (data) {
      if (data.events_data.length > 0) {
        // const output = pako.deflate(data);
        uploadChunk(data);
      }
    }
  }, 5000);

  const record = () => {
    try {
      let lastMouseMove = 0;
      stopRecording = rrweb.record({
        emit: function (event) {
          if (event.type === 2 || event.type === 4 || event.type === 3 || event.type === 5) {

            resetInactivityTimeout();

            const MOUSE_INTERVAL = 500;

            // rrweb: type 3 = IncrementalSnapshot, data.source 1 = MouseMove
            const isMouseMove = event.type === 3 && event.data?.source === 1;
            if (isMouseMove) {
              const now = Date.now();
              if (now - lastMouseMove < MOUSE_INTERVAL) return;
              lastMouseMove = now;
            }

            // rrweb already guarantees emitted events are unique: a deep comparison
            // (_.isEqual) here would be expensive on the hot path for next to no gain
            // (the timestamp nearly always differs).
            events.push(event);
            if (events.length === 1) firstEventAt = Date.now();

            // A chunk used to be sent only once 100 events had piled up. A
            // visitor who reads a page quietly reaches that number slowly, or
            // never: the session had nothing recorded for minutes, looked empty
            // to the maintenance task, and was deleted while it was still
            // being watched. Time closes the chunk too.
            const bufferIsOld = Date.now() - firstEventAt >= CHUNK_MAX_AGE_MS;

            if (events.length >= CHUNK_MAX_EVENTS || bufferIsOld) {
              session_events.push({
                session_id: session_id,
                events: events,
                timestamp: Date.now(),
                uniqueId: uuidV4(),
              });
              events = [];
              let session_events_to_send = session_events;
              session_events = [];
              setTimeout(() => {
                saveSessionEvents(session_events_to_send).catch((err) => {
                  console.warn("Erreur save session events", err);
                });
                saveChunk();
              }, 0);
            }
          }
        },
        maskInputOptions: {
          password: true,
          email: true,
          tel: true,
        },
        recordCanvas: true,
        recordIframe: true,
        maskTextSelector: maskSelector,
        // plugins: [
        //   getRecordConsolePlugin({
        //     level: ["warn", "error"],
        //     lengthThreshold: 10000,
        //     stringifyOptions: {
        //       stringLengthLimit: 1000,
        //       numOfKeysLimit: 100,
        //       depthOfLimit: 1,
        //     },
        //     logger: window.console,
        //   }),
        // ],

        // recordCrossOriginIframes: true
      });
    } catch (error) {
      console.error("Erreur record ", error);
    }
  };

  const startSession = async () => {
    let session_info = null;
    let isEnded = false;
    if (session_id) {
      while (
        session_info == null &&
        retryFetchSessionInfo < maxFetchSessionInfo
      ) {
        try {
          const response = await fetchGet(`session/show/${session_id}`);
          if (response.ok) {
            session_info = await response.json();
            isEnded = session_info?.data?.session?.endedAt ? true : false;
            if (isEnded === false) {
              record();
              maxDurationTimeout = setMaxDurationTimeout(
                new Date(session_info.data.session.startedAt).getTime()
              );
              break;
            } else {
              localStorage.removeItem("track_bug_session_id");
              break;
            }
          } else {
            retryFetchSessionInfo++;
          }
        } catch (error) {
          retryFetchSessionInfo++;
          console.log(
            "Echec tentative de récupération des informations de la session existante : " +
              retryFetchSessionInfo
          );
          console.log(
            "Echec tentative de récupération des informations de la session existant",
            error
          );
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
      if (session_info == null) {
        console.error(
          "REPLAY MAP : Impossible de récupérer les informations de la session existante"
        );
        localStorage.removeItem("track_bug_session_id");
        session_id = null;
      }
    }
    if (!session_id || (session_id && isEnded === true)) {
      let cookie = setCookieUser();
      const localization = await getIpAdress();
      let session_data = {
        project_id,
        startedAt: Date.now(),
        metadata: {
          user_agent: navigator.userAgent,
          height: window.screen.availHeight,
          width: window.screen.availWidth,
          localization: localization,
        },
        user_id: cookie.user,
        first_visit: cookie.first_visit,
      };

      while (
        sessionCreate === false &&
        retryCreateSession <= maxRetryCreateSession
      ) {
        try {
          const res = await fetchPost("session/create", session_data);
          if (!res.ok) {
            retryCreateSession++;
          }

          const result = await res.json();
          sessionCreate = true;
          session_id = result.data.session_id;

          localStorage.setItem(
            "track_bug_session_id",
            JSON.stringify(session_id)
          );
          record();
          maxDurationTimeout = setMaxDurationTimeout(session_data.startedAt);
        } catch (error) {
          retryCreateSession++;
          console.log(
            "Echec tentative de démarrage de session : " + retryCreateSession
          );
          console.log("Echec tentative de démarrage de session", error);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
      if (sessionCreate === false) {
        console.error("REPLAY MAP : Impossible de démarrer une session");
      }
    }
  };

  const stopSession = async (session) => {
    let payload = {
      session_id: session,
      endedAt: Date.now(),
    };
    try {
      const result = await fetchPost("session/end", payload);
      const data = await result.json();
      if (result.ok) {
        session_id = null;
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Sends the pending batch of events right away (without waiting for the
  // saveChunk debounce) before cutting the session, so nothing is lost.
  const flushPendingEvents = async () => {
    if (events.length > 0) {
      session_events.push({
        session_id,
        events,
        timestamp: Date.now(),
        uniqueId: uuidV4(),
      });
      events = [];
    }
    if (session_events.length > 0) {
      const toSend = session_events;
      session_events = [];
      try {
        await saveSessionEvents(toSend);
      } catch (err) {
        console.warn("Erreur save session events avant rotation", err);
      }
    }
    try {
      const data = await getSessionEvents();
      if (data && data.events_data.length > 0) {
        await uploadChunk(data);
      }
    } catch (err) {
      console.warn("Erreur upload avant rotation de session", err);
    }
  };

  // Single entry point to close the current session and open a new one: used
  // by the inactivity timer, the 30-minute cap, and triggered from outside when
  // a feedback is submitted.
  const rotateSession = async () => {
    clearTimeout(inactivityTimeout);
    clearTimeout(maxDurationTimeout);

    await flushPendingEvents();

    if (typeof stopRecording === "function") {
      stopRecording(); // stops rrweb.record()
      stopRecording = null;
    }

    localStorage.removeItem("track_bug_session_id");
    const endingSession = session_id;
    session_id = null;
    sessionCreate = false;
    retryCreateSession = 0;
    if (endingSession !== null) {
      await stopSession(endingSession);
    }

    await startSession();
    inactivityTimeout = setInactivityTimeout();
  };

  window.addEventListener("beforeunload", () => {
    try {
      if (events.length > 0) {
        session_events.push({
          session_id,
          events,
          timestamp: Date.now(),
          uniqueId: uuidV4(),
        });
        const blob = new Blob(
          [JSON.stringify({ project_id, events: session_events })],
          { type: "application/json" }
        );
        navigator.sendBeacon(`${backURL}/chunk/store`, blob);
      }
    } catch (err) {
      console.warn("Erreur beforeunload session record", err);
    }
  });

  await startSession();

  return { rotateSession };
}
