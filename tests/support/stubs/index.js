import path from "path";
import { fileURLToPath } from "url";

export const __dirname = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
export const viewspath = path.join(__dirname, "views");
export const envfile = path.join(__dirname, ".env");
export default {};
