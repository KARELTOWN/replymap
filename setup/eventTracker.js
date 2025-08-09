import _ from "lodash";
import { project_id } from "../record";
import { fetchPost } from "../utils/request";
import { v4 as UUID } from "uuid";
import { getSessionId } from "../utils/session.js";

export default function eventTracker() {
  const getEvents = () =>
    JSON.parse(localStorage.getItem("replay_map_events_tracker")) || [];

  const saveEvents = (data) => {
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem("replay_map_events_tracker", JSON.stringify(data));
    } else {
      localStorage.removeItem("replay_map_events_tracker"); // nettoie quand vide
    }
  };

  let allEvents = getEvents();

  //suivi de l'internaute pour identifier les pages visités

  const consoleErrorTracker = () => {
    //Intercepter les erreurs  : REFERENCEERROR, TYPEERROR, SYNTAXERROR, ...
    // Ainsi que les échecs de chargements de resource
    window.addEventListener("error", (err) => {
      let session_id = getSessionId();
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
        timestamp: Date.now(),
        uniqueId: UUID(),
      });
    });

    window.addEventListener("unhandledrejection", (err) => {
      let session_id = getSessionId();
      //intercepter les erreurs de promesses non capturés
      allEvents.push({
        type: "unhandle_promise_rejection",
        project: project_id,
        session: session_id || null,
        page_url: window.location.href,
        data: {
          message: err.reason.message,
          stack: err.reason.stack,
        },
        timestamp: Date.now(),
        uniqueId: UUID(),
      });
    });
  };

  //Suivi de l'internaute pour identifier les rages clicks au cours des sessions
  const rageClickTracker = () => {
    let events = [];
    document.addEventListener("click", (e) => {
      let session_id = getSessionId();

      if (session_id) {
        events.push({
          target: getSelector(e.target),
          timestamp: Date.now(),
        });
      }
    });

    setInterval(() => {
      let session_id = getSessionId();
      if (session_id) {
        //récuperer les éléments stockés les 2 dernières secondes
        const lastEvents = events.filter(
          (e) => Date.now() - e.timestamp < 2000
        );
        let lastElements = lastEvents.map((item) => item.target);
        // Compter le nombre de clics par élément
        const clickCounts = new Map();

        for (const selector of lastElements) {
          const count = clickCounts.get(selector) || 0;
          clickCounts.set(selector, count + 1);
        }

        let newData = 0;
        for (const [item, count] of clickCounts.entries()) {
          if (count >= 3) {
            newData++;
            allEvents.push({
              type: "rage_click",
              project: project_id,
              session: session_id || null,
              page_url: window.location.href,
              data: {
                target: item,
                count: count,
              },
              timestamp: Date.now(),
              uniqueId: UUID(),
            });
          }
        }
        if (newData > 0) {
          saveEvents(allEvents);
        }
      }
      events = [];
    }, 2000);
  };

  // récupérer l'id ou la class à partir de l'élément target
  const getSelector = (element) => {
    if (element.id) return `#${element.id}`;
    if (element.className && typeof element.className === "string") {
      return `${element.tagName.toLowerCase()}.${element.className
        .trim()
        .split(/\s+/)
        .join(".")}`;
    }
    return element.tagName.toLowerCase();
  };

  //envoyer les evenements vers le serveur backend pour stockage
  const storeEvents = async (data) => {
    console.log("Evenements envoyés", data);

    const response = await fetchPost("event/store", { events: data });
    if (!response.ok) {
      throw new Error("Erreur d'enregistrement des evenements");
    } else {
      allEvents = _.differenceWith(allEvents, data, _.isEqual);
      saveEvents(allEvents);
      console.log("Evenements enregistrés");
    }
  };

  consoleErrorTracker();
  rageClickTracker();
  setInterval(async () => {
    if (allEvents.length > 0) {
      await storeEvents(allEvents);
    }
  }, 1000);

  // window.addEventListener("beforeunload", () => {
  //   if (allEvents.length > 0) {
  //     navigator.sendBeacon(
  //       "event/store",
  //       JSON.stringify({ events: allEvents })
  //     );
  //     saveEvents([]);
  //   }
  // });
}
