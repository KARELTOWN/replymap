import path from "path";
import { fileURLToPath } from "url";

// Root of the backend, resolved from this file.
//
// Modules used to import `__dirname` from index.js, which boots the HTTP
// server: importing a file helper in a script or a worker started a second
// server on the same port.
export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const storagePath = (...segments) => path.join(projectRoot, "storage", ...segments);
