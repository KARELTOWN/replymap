import {
  fetchGet,
  fetchGetMember,
  fetchPostWithFile,
  fetchPostWithFileForMember,
  fetchPostMember,
} from "../../utils/request.js";
import { project_id } from "../../record.js";
import { getSessionId } from "../../utils/session.js";
import { bugRevealToken } from "../../utils/cookie.js";
import feedbackWorker from "../../../public/workers/feedbackWorker.js?raw";

export default function service() {
  let types = [];
  let priority = [];
  const blob = new Blob([feedbackWorker], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(blob));
  const backURL = `${import.meta.env.VITE_BACKEND_URL}`;

  const getFeedbackParams = async () => {
    try {
      const res = await fetchGet("feedback/params");

      if (res.ok) {
        if (res.status === 200) {
          const data = await res.json();
          console.log("getFeedbackParams", data);
          if (data.data) {
            types = data.data.type;
            priority = data.data.priority;
            return { types, priority };
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

  const checkMemberInProject = async () => {
    try {
      const res = await fetchGetMember(`project/get_users/${project_id}`);
      if (res.ok) {
        if (res.status === 200) {
          const response = await res.json();
          if (response.data) {
            if (response.data.member_is_in_project === true) {
              return [true, response.data.members];
            } else {
              return [false];
            }
          }
        }
      } else {
        throw new Error(`Erreur checkMemberInProject : ${res.status}`);
      }
    } catch (error) {
      throw error;
    }
  };

  const getBoardLists = async (integration) => {
    try {
      let data = {
        project_id,
        integration,
      };
      const res = await fetchPostMember(`integration/get_board_lists`, data);
      if (res.ok) {
        if (res.status === 200) {
          const response = await res.json();
          if (response.data) {
            return response.data;
          }
        }
      } else {
        throw new Error(`Erreur getBoardLists : ${res.status}`);
      }
    } catch (error) {
      throw error;
    }
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

  const sendFeedback = (type, recordData, attachments, data) => {
    return new Promise((resolve, reject) => {
      data.project_id = project_id;
      let session_id = getSessionId();
      if (session_id) {
        data.session_id = session_id;
      }
      data.user_agent = navigator.userAgent;
      data.height = window.screen.availHeight;
      data.width = window.screen.availWidth;

      // const formData = new FormData();

      // Ajout du canvas en tant que "fichier"
      let blob = null;
      let filename = "";
      if (type === "canvas") {
        blob = dataURLtoBlob(recordData);
      } else if (type === "video") {
        blob = new Blob([recordData], { type: "video/webm" });
      }
      let infos = [];

      infos["file"] = blob;

      Object.entries(data).forEach(([key, value]) => {
        infos[key] = value;
      });

      console.log("attachments", attachments);
      const attachmentsArray = Array.from(attachments);
      if (bugRevealToken) {
        worker.postMessage({
          param: {
            url: `${backURL}/feedback/store_member`,
            payload: infos,
            method: "POST",
            attachments: attachmentsArray,
          },
          action: "storeFeedbackMember",
        });
      } else {
        worker.postMessage({
          param: {
            url: `${backURL}/feedback/store`,
            payload: infos,
            token: bugRevealToken,
            method: "POST",
            attachments: attachmentsArray,
          },
          action: "storeFeedback",
        });
      }

      worker.onmessage = (e) => {
        const { type, data, message, errors } = e.data;
        if (type === "done") {
          resolve(["success"]);
        } else if (type === "error") {
          if (errors) {
            reject(["error", { errors }]);
          }
          reject(`Erreur lors de l'enregistrement du feedback : ${message}`);
        }
      };
      worker.onerror = (e) => {
        console.error("Erreur dans le worker :", e.message);
        console.error("Fichier source :", e.filename);
        console.error("Ligne :", e.lineno, "Colonne :", e.colno);
      };
    });
  };

  return {
    getFeedbackParams,
    sendFeedback,
    checkMemberInProject,
    getBoardLists,
  };
}
