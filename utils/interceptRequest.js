import _ from "lodash";
import { fetchPost } from "./request";
import { project_id, session_id } from "../record";
let intercepts =
  JSON.parse(sessionStorage.getItem("replay_map_intercepts_errors")) || [];

export default function interceptRequest() {
  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    try {
      const start = performance.now();
      // Modify request if needed
      const [url, config] = args;

      const response = await originalFetch(url, config);
      const end = performance.now();

      const clonedResponse = response.clone();
      if (!clonedResponse.ok && session_id) {
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
          session: session_id,
          timeStamp: Date.now(),
          general: request_general,
          response: request_response,
        });
        sessionStorage.setItem(
          "replay_map_intercepts_errors",
          JSON.stringify(intercepts)
        );
        if (intercepts.length > 0) {
          sendInterceptData();
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
    const data = JSON.parse(
      sessionStorage.getItem("replay_map_intercepts_errors")
    );
    if (data && data.length > 0) {
      const response = await fetchPost("intercept_error", {
        data: data,
      });
      if (response.ok) {
        intercepts = [];
        sessionStorage.removeItem("replay_map_intercepts_errors");
      }
    }
  } catch (error) {
    console.log("Request save error", error);
  }
}, 5000);
