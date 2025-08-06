// import { v4 as uuidv4 } from "uuid";
// import { elastiClient } from "../index.js";
import Events from "../../models/Events.js";

export const createEventsLog = async (data) => {
  try {
    const result = await Events.insertMany(data);
    console.log("Events added successfully!");
    return true;
  } catch (error) {
    console.log("Erreur de création", error);
  }
};