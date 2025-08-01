import { v4 as uuidv4 } from "uuid";
import { elastiClient } from "../index.js";

export const createInterceptRequestLog = async (data) => {
  try {
    
    const exists = await elastiClient.indices.exists({
      index: `replay_map_${data.project}_logs_errors`,
    });
    if (!exists) {
      await elastiClient.indices.create({
        index: `replay_map_${data.project}_logs_errors`,
        mappings: {
          properties: {
            session: { type: "text" },
            timeStamp: { type: "text" },
            data: { type: "Object" },
          },
        },
      });
      console.log("Création du nouvel index");
    }
    await elastiClient.index({
      index: `replay_map_${project}_logs_errors`,
      id: uuidv4(),
      document: {
        ...data.data,
      },
    });
    console.log("Log added successfully!");
  } catch (error) {
    console.log("Erreur de création d'un index ElasticSearch");
  }
};

export const createAppLog = async (data) => {
  try {
    const exists = await elastiClient.indices.exists({
      index: `replay_map_app_logs`,
    });
    if (!exists) {
      await elastiClient.indices.create({
        index: `replay_map_app_logs`,
        mappings: {
          properties: {
            message: { type: "text" },
            level: { type: "text" },
            stackTrace: { type: "text" },
            timeStamp: { type: "text" },
            path: { type: "text" },
            method: { type: "text" },
          },
        },
      });
      console.log("Création de l'index de l'application");
    }
    await elastiClient.index({
      index: `replay_map_app_logs`,
      id: uuidv4(),
      document: {
        ...data,
      },
    });
    console.log("App log added successfully!");
  } catch (error) {
    console.log("Erreur de création d'un index ElasticSearch");
  }
};

export const displayInterceptRequestLogs = async (data, limit) => {
  try {
    const response = await elastiClient.search({
      index: `replay_map_${data.project}_logs_errors`,
      body: {
        size: limit,
      },
    });
    let logs = [];
    response.hits.hits.forEach((hit) => {
      if (hit._source.session) {
        if (hit._source.session == data.session) {
          logs.push(hit._source);
        }
      }
    });
    return logs;
  } catch (error) {
    console.error("Error retrieving logs from Elasticsearch:", error);
  }
};
