import { fetchGet, fetchPost, fetchPostWithFile } from "../../utils/request.js";
import { bugRevealUser, project_id } from "../../record.js";
import { getSessionId } from "../../utils/session.js";

export default function service() {
  let types = [];
  let priority = [];
  const getFeedbackParams = async () => {
    try {
      const res = await fetchGet("feedback/params");
      if (res.ok) {
        if (res.status === 200) {
          const data = await res.json();
          if (data.data) {
            types = data.data.type;
            priority = data.data.priority;
            return { types, priority };
          }
        } else {
          `Erreur lors de la récupération des paramètres pour le feedback : ${res.status}`;
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
      let data = {
        user_id: bugRevealUser,
      };
      const res = await fetchPost(`project/get_users/${project_id}`, data);
      if (res.ok) {
        if (res.status === 200) {
          const response = await res.json();
          console.log("member in project", response.data);
          if (response.data) {
            if (response.data.member_is_in_project === true) {
              return [true, response.data.members];
            } else {
              return [false];
            }
          }
        } else {
          `Erreur checkMemberInProject: ${res.status}`;
        }
      } else {
        throw new Error(`Erreur checkMemberInProject : ${res.status}`);
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

  const sendFeedback = async (type, recordData, attachments, data) => {
    try {
      data.project_id = project_id;
      let session_id = getSessionId();
      if (session_id) {
        data.session_id = session_id;
      }
      data.user_agent = navigator.userAgent;
      data.height = window.screen.availHeight;
      data.width = window.screen.availWidth;

      const formData = new FormData();

      // Ajout du canvas en tant que "fichier"
      let blob = null;
      if (type === "canvas") {
        blob = dataURLtoBlob(recordData);
      } else if (type === "video") {
        blob = recordData;
      }
      formData.append("file", blob);

      for (const file of attachments) {
        formData.append("attachments", file);
      }
      // on ajoute les autres champs
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });
      const res = await fetchPostWithFile("feedback/store", formData);
      if (res.ok) {
        if (res.status === 200) {
          return ["success"];
        }
      } else {
        const result = await res.json();
        if (res.status === 422 && result.errors) {
          const errors = result.errors.map((e) => e.msg);
          return ["error", { errors: errors }];
        }
        throw new Error(
          `Erreur lors de l'enregistrement du feedback : ${res.status}`
        );
      }
    } catch (error) {
      throw error;
    }
  };

  return { getFeedbackParams, sendFeedback, checkMemberInProject };
}
