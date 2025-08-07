import _ from "lodash";
import { fetchPost } from "../utils/request.js";
import { project_id } from "../record.js";
import { v4 as uuidV4 } from "uuid";
import { getSessionId } from "../utils/session.js";

const getIntercepts = () =>
  JSON.parse(localStorage.getItem("replay_map_intercepts_errors")) || [];

const saveIntercepts = (data) => {
  if (Array.isArray(data) && data.length > 0) {
    localStorage.setItem("replay_map_intercepts_errors", JSON.stringify(data));
  } else {
    localStorage.removeItem("replay_map_intercepts_errors"); // nettoie quand vide
  }
};

let intercepts = getIntercepts();

export default function interceptRequest() {
  const originalFetch = window.fetch;

  //intercepter les requêtes avec FETCH
  window.fetch = async (...args) => {
    try {
      let session_id = getSessionId();

      const start = performance.now();
      // Modify request if needed
      const [url, config] = args;

      const response = await originalFetch(url, config);
      const end = performance.now();

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
            project: project_id,
            session: session_id || null,
            page_url: window.location.href,
            timeStamp: Date.now(),
            general: request_general,
            response: request_response,
            uniqueId: uuidV4(),
          });

          saveIntercepts(intercepts);
          if (intercepts.length > 0) {
            sendInterceptData();
          }
        }
      }

      return response;
    } catch (error) {
      console.error("error", error);
    }
  };
}

const sendInterceptData = _.debounce(async () => {
  try {
    const data = getIntercepts();
    if (data && data.length > 0) {
      const response = await fetchPost("intercept_error", {
        data: data,
      });
      if (response.ok) {
        intercepts = [];
        saveIntercepts(intercepts);
      }
    }
  } catch (error) {
    console.log("Request save error", error);
  }
}, 5000);

window.addEventListener("beforeunload", () => {
  if (intercepts.length > 0) {
    navigator.sendBeacon(
      "intercept_error",
      JSON.stringify({ data: intercepts })
    );
  }
});

const avoid_records_urls = (url) => {
  if (
    url.includes("session/create") ||
    url.includes("session/end") ||
    url.includes("chunk/store") ||
    url.includes("intercept_error") ||
    url.includes("api.ipify.org")
  ) {
    return true;
  }
  return false;
};
