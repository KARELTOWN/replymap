import { Client } from "@elastic/elasticsearch";
export default async function initializeElasticsearch() {
  const client = new Client({
    node: "https://0b6a0d33c64547549be8d9b4e6fd21fd.us-central1.gcp.cloud.es.io:443",
    auth: {
      apiKey: "NkQxVzhaY0JsakxaVDc0Wk1jT1o6bzA5T21EOF9MejJEUmxscjUzRE9rUQ==",
    },
  });
  return {
    client,
  };
}
