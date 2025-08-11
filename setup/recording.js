import _ from "lodash";
import { v4 as uuidV4 } from "uuid";
import * as rrweb from "rrweb";
import { fetchGet, fetchPost } from "../utils/request";
import { getIpAdress } from "../utils/ipAdress";
import { project_id } from "../record.js";
import setCookie from "../utils/cookie.js";
import { getSessionId } from "../utils/session.js";
const getSessionEvents = () =>
  JSON.parse(localStorage.getItem("replay_map_record_events")) || [];

const saveSessionEvents = (data) => {
  if (Array.isArray(data) && data.length > 0) {
    localStorage.setItem("replay_map_record_events", JSON.stringify(data));
  } else {
    localStorage.removeItem("replay_map_record_events"); // nettoie quand vide
  }
};

export default async function initializeRecord() {
  let session_id = getSessionId();
  let session_events = getSessionEvents();
  let sessionCreate = false;
  let events = [];
  let stopRecording = null;
  const maxRetryCreateSession = 5;
  let retryCreateSession = 0;
  const INACTIVITY_LIMIT = 30 * 60 * 1000;
  let inactivityTimeout = null;
  let retryFetchSessionInfo = 0;
  let maxFetchSessionInfo = 5;

  const setInactivityTimeout = () => {
    return setTimeout(async () => {
      localStorage.removeItem("track_bug_session_id");
      if (typeof stopRecording === "function") {
        stopRecording(); // Arrête rrweb.record()
      }
      if (session_id !== null) {
        await stopSession(session_id);
      }
      session_id = null;
      await startSession();
    }, INACTIVITY_LIMIT);
  };

  inactivityTimeout = setInactivityTimeout();

  const resetInactivityTimeout = () => {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setInactivityTimeout();
  };

  const uploadChunk = async (chunks) => {
    if (!project_id) return;

    const payload = { project_id, events: chunks };
    try {
      const res = await fetchPost("chunk/store", payload);
      const result = await res.json();
      session_events = _.differenceWith(session_events, chunks, _.isEqual);
      saveSessionEvents(session_events);
    } catch (error) {
      console.error(error);
    }
  };

  const saveChunk = _.debounce(() => {
    const data = getSessionEvents();
    if (data) {
      if (data.length > 0) {
        uploadChunk(data);
      }
    }
  }, 2000);

  const record = () => {
    try {
      stopRecording = rrweb.record({
        emit(event) {
          resetInactivityTimeout();

          const lastEvent = events[events.length - 1];
          // Cela empêche l’enregistrement d’un événement identique consécutif.
          if (!_.isEqual(lastEvent, event)) {
            events.push(event);
          }

          if (events.length >= 20) {
            session_events.push({
              session_id: session_id,
              events: events,
              timestamp: Date.now(),
              uniqueId: uuidV4(),
            });
            events = [];
            saveSessionEvents(session_events);
            saveChunk();
          }
        },
        maskInputOptions: { password: true },
        recordCanvas: true,
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
        retryFetchSessionInfo <= maxFetchSessionInfo
      ) {
        try {
          const response = await fetchGet(`session/show/${session_id}`);
          if (response.ok) {
            session_info = response.json();
            isEnded = session_info.endedAt ? true : false;
            if (isEnded === false) {
              record();
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
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
      if (session_info == null) {
        console.error(
          "REPLAY MAP : Impossible de récupérer les informations de la session existante"
        );
      }
    }
    if (!session_id || (session_id && isEnded === true)) {
      let cookie = setCookie();
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
        } catch (error) {
          retryCreateSession++;
          console.log(
            "Echec tentative de démarrage de session : " + retryCreateSession
          );
          console.log("Echec tentative de démarrage de session", error);
          await new Promise((r) => setTimeout(r, 2000));
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

  window.addEventListener("beforeunload", () => {
    if (events.length > 0) {
      session_events.push({
        session_id,
        events,
        timestamp: Date.now(),
        uniqueId: uuidV4(),
      });
      navigator.sendBeacon(
        "/chunk/store",
        JSON.stringify({ project_id, events: session_events })
      );
      saveSessionEvents([]);
    }
  });

  await startSession();
}
