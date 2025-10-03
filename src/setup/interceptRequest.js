import _ from "lodash";
import { fetchPost } from "../utils/request.js";
import { project_id } from "../record.js";
import { v4 as uuidV4 } from "uuid";
import { getSessionId } from "../utils/session.js";
import dbtransaction from "../utils/indexDB.js";
const { getEvents, saveEvents, deleteEventByKeys } = dbtransaction();

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

  //intercepter les requêtes avec FETCH
  window.fetch = async (...args) => {
    try {
      let rrweb_timestamp = Date.now();
      const start = performance.now();
      // Modify request if needed
      const [url, config] = args;

      const response = await originalFetch(url, config);
      const end = performance.now();
      // ISOLE LE HANDLE INTERCEPT DU THREAD PRINCIPAL
      setTimeout(() => {
        handleIntercept(
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

async function handleIntercept(
  response,
  url,
  config,
  rrweb_timestamp,
  start,
  end
) {
  let session_id = getSessionId();

  const clonedResponse = response.clone();

  if (!clonedResponse.ok) {
    const avoid_urls = avoid_records_urls(url);

    if (avoid_urls === false) {
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
      const duration = (end - start) / 1000;
      const request_general = {
        url: url,
        body: config.body,
        headers: config.headers,
        method: config.method || "GET",
      };
      const request_response = {
        status: response.status,
        statusText: response.statusText,
        response: jsonData,
        duration: duration + "s",
      };

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
}, 5000);

window.addEventListener("beforeunload", () => {
  try {
    if (intercepts.length > 0) {
      navigator.sendBeacon(
        "event/store",
        JSON.stringify({ events: intercepts })
      );
    }
  } catch (err) {
    console.warn("Erreur beforeunload interceptRequest", err);
  }
});

const avoid_records_urls = (url) => {
  if (
    url.includes("https://api.bugreveal.com") ||
    url.includes("http://localhost")
  ) {
    return true;
  }
  return false;
};
