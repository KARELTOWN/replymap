// Mongoose without a connection: tests replace the model methods.
import { configDotenv } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
configDotenv({ path: path.join(root, ".env"), quiet: true });

export default mongoose;
