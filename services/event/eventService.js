// import { v4 as uuidv4 } from "uuid";
// import { elastiClient } from "../index.js";
import Events from "../../models/Events.js";

export const createEventsLog = async (data) => {
  try {
    let events = [];
    for (const item of data) {
      const exist = await Events.exists({ uniqueId: item.uniqueId });
      if (exist) {
        continue;
      } else {
        events.push(item);
      }
    }
    const result = await Events.insertMany(events);
    console.log("Events added successfully!");
    return true;
  } catch (error) {
    console.log("Erreur de création", error);
  }
};

export const getIssuesLogs =async(data)=> {
  
}