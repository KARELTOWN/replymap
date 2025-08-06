import _ from "lodash";
import { v4 as uuidV4 } from "uuid";
import * as rrweb from "rrweb";
import { fetchPost } from "../utils/request";
import { getIpAdress } from "../utils/ipAdress";
import { project_id } from "../record.js";
import setCookie from "../utils/cookie.js";

export default async function initializeRecord() {
  let session_id = JSON.parse(sessionStorage.getItem("track_bug_session_id"));
  const session_events =
    JSON.parse(sessionStorage.getItem("replay_map_record_events")) || [];
  let sessionCreate = false;
  let events = [];
  let stopRecording = null;
  const maxRetryCreateSession = 5;
  let retryCreateSession = 0;
  const INACTIVITY_LIMIT = 30 * 60 * 1000;
  let inactivityTimeout = null;

  const setInactivityTimeout = () => {
    return setTimeout(async () => {
      sessionStorage.removeItem("track_bug_session_id");
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
    if (!project_id) {
      return;
    }
    const payload = {
      project_id: project_id,
      events: chunks,
    };

    fetchPost("chunk/store", payload)
      .then((res) => res.json())
      .then(async (result) => {
        console.log("chunk store result", result);
        console.log("chunk store");
        sessionStorage.removeItem("replay_map_record_events");
        events = [];
      })
      .catch((error) => {
        console.error(error);
      });
  };
  const saveChunk = _.debounce(() => {
    const data = JSON.parse(sessionStorage.getItem("replay_map_record_events"));
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
          events.push(event);

          if (events.length >= 20) {
            session_events.push({
              session_id: session_id,
              events: events,
              timestamp: Date.now(),
              uniqueId: uuidV4(),
            });
            events = [];
            sessionStorage.setItem(
              "replay_map_record_events",
              JSON.stringify(session_events)
            );
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
    if (session_id) {
      record();
    } else {
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

          sessionStorage.setItem(
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
    fetchPost("session/end", payload)
      .then((res) => res.json())
      .then(async (result) => {
        session_id = null;
      })
      .catch((error) => {
        console.error(error);
      });
  };

  await startSession();
}
