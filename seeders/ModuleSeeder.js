import Module from "../models/Module.js";

async function ModuleSeeder() {
  try {
    const data = [
      "Utilisateurs",
      "Offres d'Emploi",
      "Soumissions",
      "Nofications",
      "Profils",
      "Fichiers",
    ];
    let list = Array();
    data.forEach((element) => {
      list.push({ name: element });
    });
    await Module.insertMany(list);
    console.log("Modules insérés");
  } catch (error) {
    throw error;
  }
}
export default ModuleSeeder;
