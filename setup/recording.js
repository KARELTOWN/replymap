// import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";
import _ from "lodash";
import { v4 as uuidV4 } from "uuid";
import * as rrweb from "rrweb";
import { fetchPost } from "../utils/request";
import { getIpAdress } from "../utils/ipAdress";
import { project_id } from "../record.js";

export default async function initializeRecord() {
  let session_id;
  const session_events =
    JSON.parse(sessionStorage.getItem("replay_map_events")) || [];
  let sessionCreate = false;
  let events = [];
  let stopRecording = null;
  const maxRetryCreateSession = 5;
  let retryCreateSession = 0;
  const INACTIVITY_LIMIT = 3 * 60 * 1000;
  let inactivityTimeout = null;

  session_id = JSON.parse(sessionStorage.getItem("track_bug_session_id"));

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
        sessionStorage.removeItem("replay_map_events");
        events = [];
      })
      .catch((error) => {
        console.error(error);
      });
  };
  const saveChunk = _.debounce(() => {
    const data = JSON.parse(sessionStorage.getItem("replay_map_events"));
    if (data) {
      if (data.length > 0) {
        uploadChunk(data);
      }
    }
  }, 5000);

  const record = () => {
    try {
      console.log("initialize ");
      stopRecording = rrweb.record({
        emit(event) {
          console.log("events.type", event.type);

          resetInactivityTimeout();
          events.push(event);

          if (events.length >= 10) {
            session_events.push({
              session_id: session_id,
              events: events,
              timestamp: Date.now(),
              uniqueId: uuidV4(),
            });
            events = [];
            sessionStorage.setItem(
              "replay_map_events",
              JSON.stringify(session_events)
            );
            saveChunk();
          }
        },
        maskInputOptions: { password: true },
        recordCanvas: true,
        // plugins: [
        //   getRecordConsolePlugin({
        //     level: ["info", "log", "warn", "error"],
        //     lengthThreshold: 10000,
        //     stringifyOptions: {
        //       stringLengthLimit: 1000,
        //       numOfKeysLimit: 100,
        //       depthOfLimit: 1,
        //     },
        //     logger: window.console,
        //   }),
        // ],
      });
    } catch (error) {
      console.error("Erreur record ", error);
    }
  };

  const startSession = async () => {
    if (session_id) {
      record();
    } else {
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
          console.log("session created");
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
