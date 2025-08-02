import { fetchGet } from "./request";

export const getProject = async (project_id) => {
  try {
    console.log('window.location.host', window.location.host)
    const response = await fetchGet(`project/show/${project_id}`);
    if (!response.ok) {
      throw new Error("Erreur de récupération du projet");
    }
    const result = await response.json();
    if (result?.data) {
      if (result.data.active === false) {
        throw new Error("Récupération de données désactivées sur ce site");
      } 
      // else if (result.data.link !== window.location.host) {
      //   throw new Error(
      //     "Impossible de démarre l'enregistrement de session : Lien invalide"
      //   );
      // } 
      else {
        console.log('LET GO')
        return true
      }
    } else {
      throw new Error("Erreur de récupération du projet");
    }
  } catch (error) {
    console.log(error);
  }
};
