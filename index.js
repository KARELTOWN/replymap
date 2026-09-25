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
import helmet from "helmet";
import { localeMiddleware } from "./shared/i18n/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestId } from "./middleware/requestId.js";
import { parseCookies } from "./middleware/cookies.js";

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

// The Trello webhook signature check needs the exact bytes of the request
// body (HMAC), not a JSON.stringify(req.body) that could differ in key order
// or whitespace.
app.use(
  bodyParser.json({
    limit: "200mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(bodyParser.urlencoded({ extended: true, limit: "200mb" }));

// Origins of our own applications, allowed to carry credentials.
const APP_ORIGINS = (process.env.APP_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Routes the widget calls from the customer's website: the origin is
// arbitrary by nature. They accept no cookie and, when needed, authenticate
// with a token carried in a header.
const PUBLIC_PREFIXES = [
  "/api/session/",
  "/api/chunk/",
  "/api/event/",
  "/api/feedback/",
  "/api/project/show/",
  "/api/project/membership/",
  "/api/integration/",
];

const isPublicPath = (path) =>
  PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));

// Every unknown origin used to receive `origin: '*'` on the whole API,
// dashboard routes included. The wildcard is now reserved for the routes the
// widget actually needs to call.
const corsOption = (req, callback) => {
  const origin = req.header("Origin");
  const common = {
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token", "X-Refresh-CSRF"],
    maxAge: 86400,
  };

  if (origin && APP_ORIGINS.includes(origin)) {
    return callback(null, { ...common, origin: APP_ORIGINS, credentials: true });
  }

  if (isPublicPath(req.path)) {
    return callback(null, { ...common, origin: "*", credentials: false });
  }

  return callback(null, { ...common, origin: false, credentials: false });
};

app.use(cors(corsOption));

// Security headers. The content security policy is left out: this
// application only serves JSON and files, and a badly tuned policy would break
// the widget without protecting anything more here. Resources must however stay
// readable from another origin, since screenshots are served to customer sites.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

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

// Negotiates the caller language and exposes `req.t`, so every message the API
// returns is translated at the edge rather than hardcoded in a controller.
app.use(requestId);
app.use(parseCookies);
app.use(localeMiddleware);

app.use("/api", router);

// Single exit point for unknown routes and for every failure. Must stay last.
app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT;
const host = process.env.HOST;
app.listen(port, host, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});

export default app;
