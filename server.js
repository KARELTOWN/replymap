import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { configDotenv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let envfile = null;
if (process.env.NODE_ENV) {
  // ENVIRONNEMENT DOCKER
  if (process.env.NODE_ENV === "development") {
    envfile = path.resolve(__dirname, `.env`);
  } else {
    envfile = path.resolve(__dirname, `.env.${process.env.NODE_ENV}`);
  }
} else {
  // ENVIRONNEMENT LOCAL SANS DOCKER
  envfile = path.resolve(__dirname, `.env`);
}

configDotenv({ path: envfile });

const corsOption = {
  origin: ["http://localhost:5174", "http://localhost:5173", "http://localhost:5175"],
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Origin",
    "common",
  ],
};

const app = express();
app.use(cors(corsOption));

app.use(express.static(path.join(__dirname, "dist"))); // Sert le bundle

console.log("process.env.PORT,", process.env.PORT);
console.log("process.env.HOST,", process.env.HOST);

app.listen(process.env.PORT, process.env.HOST, () => {
  console.log("✅ record.js servi");
});

app.get("/", (req, res) => {
  res.send("Record service is running");
});
