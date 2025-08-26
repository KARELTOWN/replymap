import FeedbackStatus from "../models/FeedbackStatus.js";

async function FeedbackStatusSeeder() {
  try {
    const data = ["Ouvert", "TO-DO", "En cours", "Résolu", "Archivé"];
    let list = Array();
    data.forEach((element) => {
      list.push({ libelle: element });
    });
    await FeedbackStatus.insertMany(list, {ordered: false});
    console.log("Feedback status insérés");
  } catch (error) {
    throw error;
  }
}
export default FeedbackStatusSeeder;
