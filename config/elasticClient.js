import { Client } from "@elastic/elasticsearch";
export default async function initializeElasticsearch() {
  const client = new Client({
    node: "https://0b6a0d33c64547549be8d9b4e6fd21fd.us-central1.gcp.cloud.es.io:443",
    auth: {
      apiKey: "NkQxVzhaY0JsakxaVDc0Wk1jT1o6bzA5T21EOF9MejJEUmxscjUzRE9rUQ==",
    },
  });
  try {
    const exists = await client.indices.exists({
      index: `replay_map_clients_app_logs_errors`,
    });
    if (!exists) {
      await client.indices.create({
        index: `replay_map_clients_app_logs_errors`,
        mappings: {
          properties: {
            project: { type: "text" },
            session: { type: "text" },
            timeStamp: { type: "text" },
            data: { type: "text" },
          },
        },
      });
      console.log("Création du nouvel index");
    }

    const existsapp = await client.indices.exists({
      index: `replay_map_admin_logs`,
    });
    if (!existsapp) {
      await client.indices.create({
        index: `replay_map_admin_logs`,
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
  } catch (error) {
    console.error("ELASTIC ERROR", error);
  }

  return {
    client,
  };
}
