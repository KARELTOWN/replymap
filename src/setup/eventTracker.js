import _ from "lodash";
import { project_id } from "../record";
import { fetchPost } from "../utils/request";
import { v4 as UUID } from "uuid";
import { getSessionId } from "../utils/session.js";
import { onINP, onLCP, onCLS, onFCP, onTTFB } from "web-vitals";

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
      let rrweb_timestamp = Date.now();
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
        timestamp: rrweb_timestamp,
        uniqueId: UUID(),
      });
    });

    window.addEventListener("unhandledrejection", (err) => {
      let rrweb_timestamp = Date.now();
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
        timestamp: rrweb_timestamp,
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
          (e) => Date.now() - e.timestamp < 2000 && e.type === 3 // type=3 = MouseInteraction (clics)
        );
        let lastElements = lastEvents.map((item) => ({
          target: item.target,
          timestamp: item.timestamp, // <-- on garde aussi le timestamp rrweb
        }));
        // Compter le nombre de clics par élément
        const clickCounts = new Map();
        const clickTimestamps = new Map();

        for (const { target, timestamp } of lastElements) {
          const count = clickCounts.get(target) || 0;
          clickCounts.set(target, count + 1);
          // on garde le dernier timestamp rrweb pour ce target
          clickTimestamps.set(target, timestamp);
        }

        let newData = 0;
        for (const [item, count] of clickCounts.entries()) {
          if (count >= 2) {
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
              // 🔑 utilise le timestamp rrweb (moment exact dans le replay)
              timestamp: clickTimestamps.get(item),
              uniqueId: UUID(),
            });
          }
        }
        if (newData > 0) {
          events = [];
          saveEvents(allEvents);
        }
      }
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
    const response = await fetchPost("event/store", { events: data });
    if (!response.ok) {
      throw new Error("Erreur d'enregistrement des evenements");
    } else {
      allEvents = _.differenceWith(allEvents, data, _.isEqual);
      saveEvents(allEvents);
    }
  };

  const waitForVitals = () =>
    new Promise((resolve) => {
      const vitals = {};
      let count = 0;

      const done = () => {
        console.log("done", vitals);
        if (++count === 4) resolve(vitals);
      };

      // onINP((metric) => {
      //   vitals.INP = metric.value;
      //   done();
      // });
      onLCP((metric) => {
        vitals.LCP = metric.value;
        done();
      });
      onCLS((metric) => {
        vitals.CLS = metric.value;
        done();
      });
      onFCP((metric) => {
        vitals.FCP = metric.value;
        done();
      });
      onTTFB((metric) => {
        vitals.TTFB_WEB_VITALS = metric.value;
        done();
      });
    });

  const pageLoadPerformance = () => {
    window.addEventListener("load", async () => {
      const vitals = await waitForVitals();
      console.log("vitals", vitals);

      const [nav] = performance.getEntriesByType("navigation");
      const data = {
        PAGE_LOAD_TIME: nav.duration,
        TTFB: nav.responseStart - nav.requestStart,
        DNS_LOOKUP: nav.domainLookupEnd - nav.domainLookupStart,
        TLS_HANDSHAKE: nav.connectEnd - nav.connectStart,
        DOWNLOAD_RESPONSE: nav.responseEnd - nav.responseStart,
        DOM_CONTENT_LOADED: nav.domContentLoadedEventEnd - nav.startTime,
        LOAD_EVENT: nav.loadEventEnd - nav.startTime,
        TTFB_WEB_VITALS: vitals.TTFB_WEB_VITALS || 0,
        // INP: vitals.INP || 0,
        LCP: vitals.LCP || 0,
        CLS: vitals.CLS || 0,
        FCP: vitals.FCP || 0,
      };

      let session_id = getSessionId();

      const send_data = {
        type: "web_vitals",
        project: project_id,
        session: session_id || null,
        page_url: window.location.href,
        data: data,
        timestamp: Date.now(),
        uniqueId: UUID(),
      };
      allEvents.push(send_data);
    });
  };

  pageLoadPerformance();
  consoleErrorTracker();
  rageClickTracker();
  setInterval(async () => {
    if (allEvents.length > 0) {
      saveEvents(allEvents);
      await storeEvents(allEvents);
    }
  }, 4000);

  window.addEventListener("beforeunload", () => {
    if (allEvents.length > 0) {
      navigator.sendBeacon(
        "event/store",
        JSON.stringify({ events: allEvents })
      );
      saveEvents([]);
    }
  });
}
