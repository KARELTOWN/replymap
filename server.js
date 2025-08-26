import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors()); // Autorise toutes les origines

app.use(express.static(path.join(__dirname, "dist"))); // Sert le bundle

app.listen(5174, () => {
  console.log("✅ record.js servi sur http://localhost:5174");
});
