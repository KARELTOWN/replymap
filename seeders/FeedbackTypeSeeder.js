import FeedbackType from "../models/FeedbackType.js";

async function FeedbackTypeSeeder() {
  try {
    const data = ["Bug", "Amélioration", "Tâche"];
    let list = Array();
    data.forEach((element) => {
      list.push({ libelle: element });
    });
    await FeedbackType.insertMany(list);
    console.log("Feedback types insérés");
  } catch (error) {
    throw error;
  }
}
export default FeedbackTypeSeeder;
