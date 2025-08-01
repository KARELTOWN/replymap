import FileType from "../models/FileType.js";

async function FilesTypeSeeder() {
  try {
    const existingTypes = await FileType.countDocuments();
    if (existingTypes == 0) {
      const data = [
        "CV DEMANDEUR",
        "PHOTO PROFIL",
        "LETTRE DE MOTIVATION",
        "FICHIER RECRUTEMENT",
        "FICHIER",
      ];
      let list = Array();
      data.forEach((element) => {
        list.push({ name: element });
      });
      await FileType.insertMany(list);
      console.log("TYPES DE FICHIERS insérées");
    } else {
      console.log("TYPES DE FICHIERS déjà insérées");
    }
  } catch (error) {
    throw error;
  }
}
export default FilesTypeSeeder;
