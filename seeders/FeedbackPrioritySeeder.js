import FeedbackPriority from "../models/FeedbackPriority.js";

async function FeedbackPrioritySeeder() {
  try {
    const data = [
      "Urgent",
      "Elevé",
      "Moyen",
      "Faible",
    ];
    let list = Array();
    data.forEach((element) => {
      list.push({ libelle: element });
    });
    await FeedbackPriority.insertMany(list);
    console.log("Feedback priority insérés");
  } catch (error) {
    throw error;
  }
}
export default FeedbackPrioritySeeder;
