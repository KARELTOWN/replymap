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
schedule_expired_session.start();

import redisConnection from "./config/redis.js";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);

export const __dirname = path.dirname(__filename);

export let envfile = null;
if (process.env.NODE_ENV) {
  // ENVIRONNEMENT DOCKER
  if (process.env.NODE_ENV === "development") {
    envfile = path.resolve(__dirname, `.env.docker`);
  } else {
    envfile = path.resolve(__dirname, `.env.${process.env.NODE_ENV}`);
  }
} else {
  // ENVIRONNEMENT LOCAL SANS DOCKER
  envfile = path.resolve(__dirname, `.env`);
}

configDotenv({ path: envfile });

redisConnection().catch((error) =>
  console.log("Erreur de configuration de redis")
);
const app = express();

// Augmenter la limite à 10 Mo par exemple
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

const corsOption = (req, callback) => {
  const originHeader = req.header("Origin");
  const authorize = [
    "https://app.bugreveal.com",
    "https://sso.bugreveal.com",
    "https://record.bugreveal.com",
  ];
  if (authorize.includes(originHeader)) {
    callback(null, {
      origin: authorize,
      methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Origin",
        "common",
        "Authorization",
        'x-csrf-token'
      ],
    });
  }
  else {
    callback(null, {
      origin: '*',
      methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
      credentials: false,
      allowedHeaders: [
        "Content-Type",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Origin",
        "common",
        "Authorization",
      ],
    });
  }
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
