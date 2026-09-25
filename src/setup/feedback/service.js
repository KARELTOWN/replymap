import { fetchGet, fetchGetMember, fetchPost, fetchPostMember } from "../../utils/request.js";
import { project_id } from "../../record.js";
import { getSessionId } from "../../utils/session.js";
import { getBugRevealToken, clearBugRevealToken } from "../../utils/cookie.js";
import { v4 as uuidV4 } from "uuid";
import feedbackWorker from "../../../public/workers/feedbackWorker.js?raw";

export default function service() {
  let types = [];
  const blob = new Blob([feedbackWorker], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(blob));
  const backURL = `${import.meta.env.VITE_BACKEND_URL}`;

  // The feedback type reference data is no longer public: only an
  // authenticated account can read it, like the rest of the module.
  const getFeedbackParams = async () => {
    try {
      const res = await fetchGetMember("feedback/params");

      if (res.ok) {
        if (res.status === 200) {
          const data = await res.json();
          if (data.data) {
            types = data.data.type;
            return { types };
          }
        }
      } else {
        throw new Error(
          `Erreur lors de la récupération des paramètres pour le feedback : ${res.status}`
        );
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * The public settings of the project, read before anything else.
   *
   * A visitor with no account is not necessarily turned away: the owner may
   * have opened the project to guest feedback, and that answer is the only way
   * for the widget to know it without trying and being refused.
   */
  const getProjectSettings = async () => {
    try {
      const res = await fetchGet(`project/show/${project_id}`);
      if (!res.ok) return { allow_guest_feedback: false };
      const response = await res.json();
      return { allow_guest_feedback: response?.data?.allow_guest_feedback === true };
    } catch (error) {
      console.error("Project settings could not be read:", error);
      return { allow_guest_feedback: false };
    }
  };

  // Same reference data as `getFeedbackParams`, for a guest: the door is open
  // on the project itself, so no token is sent.
  const getGuestFeedbackParams = async () => {
    const res = await fetchPost("feedback/guest/params", { project_id });
    if (!res.ok) throw new Error(`Guest feedback parameters failed: ${res.status}`);
    const data = await res.json();
    types = data?.data?.type ?? [];
    return { types };
  };

  // The widget only needs to know whether the signed-in account may leave
  // feedback on this project. The previous version queried the full member list,
  // which exposed the whole team's emails to any account, on any site carrying
  // the snippet.
  // Answers "member", "not_member" or "signed_out". A refused token used to be
  // reported as "not a member": the creator of the project was told they did
  // not belong to it as soon as their 2-hour token expired.
  const checkMemberInProject = async () => {
    const res = await fetchGetMember(`project/membership/${project_id}`);
    if (res.status === 401 || res.status === 403) {
      clearBugRevealToken();
      return "signed_out";
    }
    if (!res.ok) throw new Error(`Membership check failed: ${res.status}`);
    const response = await res.json();
    return response?.data?.member === true ? "member" : "not_member";
  };

  /**
   * Lists of the board the project sends its cards to.
   *
   * @returns {Promise<{lists: object[], code: string|null}>} the reason when
   * there is none: the form used to report every refusal as "no active list",
   * whether the tool was simply not connected, its connection had expired or no
   * board had been chosen yet.
   */
  const getBoardLists = async (integration) => {
    const res = await fetchPostMember(`integration/get_board_lists`, {
      project_id,
      integration,
    });
    const response = await res.json().catch(() => ({}));

    if (!res.ok) return { lists: [], code: response?.error?.code ?? "REQUEST_FAILED" };
    return { lists: response?.data ?? [], code: null };
  };

  function dataURLtoBlob(dataURL) {
    const [meta, base64] = dataURL.split(",");
    const mime = meta.match(/:(.*?);/)[1];
    const binStr = atob(base64);
    const len = binStr.length;
    const u8arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      u8arr[i] = binStr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Sends a feedback, as a member or as a guest.
   *
   * @param {boolean} [asGuest] posts to the public route without a token; the
   * identity is then the email typed in the form, which the API records in
   * place of an account.
   */
  const sendFeedback = (type, recordData, attachments, data, asGuest = false) => {
    return new Promise((resolve, reject) => {
      data.project_id = project_id;
      let session_id = getSessionId();
      if (session_id) {
        data.session_id = session_id;
      }
      data.user_agent = navigator.userAgent;
      data.height = window.screen.availHeight;
      data.width = window.screen.availWidth;
      data.url = window.location.href;
      data.viewport_width = window.innerWidth;
      data.viewport_height = window.innerHeight;
      data.language = navigator.language;
      data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      data.device_pixel_ratio = window.devicePixelRatio;
      data.referrer = document.referrer || "";

      // Adds the canvas as a "file"
      let blob = null;
      if (type === "img") {
        blob = dataURLtoBlob(recordData);
      } else if (type === "video") {
        blob = new Blob([recordData], { type: "video/webm" });
      }
      let infos = {};

      infos["file"] = blob;

      Object.entries(data).forEach(([key, value]) => {
        infos[key] = value;
      });

      const attachmentsArray = Array.from(attachments);
      const token = asGuest ? null : getBugRevealToken();
      const requestId = uuidV4();

      // A member without a token would be refused by the API: there is no point
      // sending the request. A guest has none to give, by design.
      if (!asGuest && !token) {
        reject(["error", { errors: ["Vous devez être connecté"] }]);
        return;
      }

      const handleMessage = (e) => {
        const { type, message, errors, requestId: responseId } = e.data;
        if (responseId !== requestId) return; // answer of another concurrent submission
        worker.removeEventListener("message", handleMessage);
        if (type === "done") {
          resolve(["success"]);
        } else if (type === "error") {
          if (errors) {
            reject(["error", { errors }]);
          } else {
            reject(`Erreur lors de l'enregistrement du feedback : ${message}`);
          }
        }
      };
      worker.addEventListener("message", handleMessage);
      worker.onerror = (e) => {
        console.error("Erreur dans le worker :", e.message);
        console.error("Fichier source :", e.filename);
        console.error("Ligne :", e.lineno, "Colonne :", e.colno);
      };

      worker.postMessage({
        param: {
          url: `${backURL}/feedback/${asGuest ? "guest" : "store"}`,
          payload: infos,
          token,
          method: "POST",
          attachments: attachmentsArray,
          requestId,
        },
        action: "storeFeedback",
      });
    });
  };

  return {
    getFeedbackParams,
    getGuestFeedbackParams,
    getProjectSettings,
    sendFeedback,
    checkMemberInProject,
    getBoardLists,
  };
}
