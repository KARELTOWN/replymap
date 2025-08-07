// import { v4 as uuidv4 } from "uuid";
// import { elastiClient } from "../index.js";
import AppError from "../../models/AppError.js";
import Events from "../../models/Events.js";

// export const createInterceptRequestLog = async (data) => {
//   try {
//     const body = data.flatMap((item) => [
//       {
//         index: { _index: "replay_map_clients_app_logs_errors", _id: uuidv4() },
//       },
//       item,
//     ]);
//     await elastiClient.bulk({ refresh: true, body });
//     console.log("Log added successfully!");
//   } catch (error) {
//     console.log("Erreur de création d'un index ElasticSearch");
//   }
// };

export const createInterceptRequestLog = async (data) => {
  try {
    let logs = [];
    for (const item of data) {
      const exist = await AppError.exists({ uniqueId: item.uniqueId });
      if (exist) {
        continue;
      } else {
        logs.push(item);
      }
    }
    const result = await AppError.insertMany(logs);
    console.log("Logs added successfully!");
    return true;
  } catch (error) {
    console.log("Erreur de création", error);
  }
};

// export const createAppLog = async (data) => {
//   try {
//     await elastiClient.index({
//       index: `replay_map_admin_logs`,
//       id: uuidv4(),
//       document: data,
//     });
//     console.log("App log added successfully!");
//   } catch (error) {
//     console.log("Erreur de création d'un index ElasticSearch");
//   }
// };

// export const displayInterceptRequestLogs = async (data, limit = 100) => {
//   try {
//     const response = await elastiClient.search({
//       index: `replay_map_clients_app_logs_errors`,
//       body: {
//         size: limit,
//         query: {
//           bool: {
//             must: [
//               { match: { session: data.session } },
//               { match: { project: data.project } },
//             ],
//           },
//         },
//       },
//     });

//     return response.hits.hits.map((hit) => hit._source);
//   } catch (error) {
//     console.error("Error retrieving logs from Elasticsearch:", error);
//   }
// };

export const displayInterceptRequestLogs = async (
  data,
  limit = 10,
  skip = 0
) => {
  try {
    let request;

    request = AppError.find({
      session: data.session,
      project: data.project,
    });
    let response = null;
    if (limit == 1000) {
      response = await request
        .sort({ createdAt: -1 })
        .skip(skip)
        .select(["timezone", "general", "response"])
        .exec();
    } else {
      response = await request
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(["timezone", "general", "response"])
        .exec();
    }
    console.log("displayInterceptRequestLogs", response)
    return response;
  } catch (error) {
    console.error("Error retrieving logs from Elasticsearch:", error);
  }
};

// export const errorPerSession = async (session) => {
//   try {
//     const response = await elastiClient.count({
//       index: `replay_map_clients_app_logs_errors`,
//       body: {
//         query: {
//           match: { session },
//         },
//       },
//     });

//     return response.count;
//   } catch (error) {
//     console.error("Error retrieving error count from Elasticsearch:", error);
//   }
// };

export const errorPerSession = async (session) => {
  try {
    const count = await AppError.find({}).countDocuments();
    console.log("count", count);
    return count;
  } catch (error) {
    console.error("Error retrieving error count from DB:", error);
  }
};
