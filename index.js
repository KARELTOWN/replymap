import express from "express";
import { configDotenv } from "dotenv";
import router from "./routes/api.js";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
// import initializeElasticsearch from "./config/elasticClient.js";
// export const { client: elastiClient } = await initializeElasticsearch();
// import { createAppLog } from "./services/elasticLog.js";
import { schedule_expired_session } from "./services/schedule.js";
schedule_expired_session.start()

import redisConnection from "./config/redis.js";
import cors from "cors";
configDotenv();
redisConnection().catch((error) =>
  console.log("Erreur de configuration de redis")
);
const app = express();

// Augmenter la limite à 10 Mo par exemple
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

const corsOption = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5175",
    "http://localhost:5176",
  ],
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Headers",
    "common",
  ],
};

app.use(cors(corsOption));

app.use(async (error, req, res, next) => {
  if (error) {
    // await createAppLog({
    //   message: error.message || error,
    //   level: "error",
    //   stackTrace: err.stack,
    //   timeStamp: new Date().toISOString(),
    //   path: req.path,
    //   method: req.method,
    // });
    console.log("Erreur " + error);
  }
});

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const viewspath = path.join(__dirname, "views");

app.use(express.static(path.join(__dirname, "public/files")));
app.use(morgan("dev"));
app.use(express.json());
app.use("/api", router);

const port = process.env.PORT;
const host = process.env.HOST;
app.listen(port, host, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});

export default app;
