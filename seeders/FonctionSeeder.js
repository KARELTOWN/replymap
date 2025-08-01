import Fonction from "../models/Fonction.js";
async function FonctionSeeder() {
  try {
    await Fonction.insertOne({ name: "Super Administrateur" });
    console.log("Fonction insérées");
  } catch (error) {
    throw error;
  }
}
export default FonctionSeeder;
