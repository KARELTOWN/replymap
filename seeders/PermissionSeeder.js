import Fonction from "../models/Fonction.js";
import Feature from "../models/Feature.js";
import Permission from "../models/Permission.js";

async function PermissionSeeder() {
  try {
    const fonctions = await Fonction.find({});
    const features = await Feature.find({});

    fonctions.forEach((fonction) => {
      features.forEach(async (feature) => {
        await Permission.insertOne({
          feature_id: feature._id,
          module_id: feature.module_id,
          fonction_id: fonction._id,
          is_active: true,
        });
      });
    });
    console.log("Permissions crées");
  } catch (error) {
    throw error;
  }
}
export default PermissionSeeder;
