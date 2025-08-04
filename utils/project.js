import { fetchGet } from "./request";

export const getProject = async (project_id) => {
  try {
    console.log("window.location.host", window.location.host);
    const response = await fetchGet(`project/show/${project_id}`);
    if (!response.ok) {
      throw new Error("Erreur de récupération du projet");
    }
    const result = await response.json();
    if (result?.data) {
      if (result.data.active === false) {
        return {
          status: "error",
          message: "Récupération de données désactivées sur ce site",
        };
      } else if (result.data.link !== window.location.host) {
        return {
          status: "error",
          message:
            "Impossible de démarre l'enregistrement de session : Lien invalide",
        };
      } else {
        return { status: "success", data: result.data };
      }
    } else {
      throw new Error("Erreur de récupération du projet");
    }
  } catch (error) {
    console.log(error);
  }
};
