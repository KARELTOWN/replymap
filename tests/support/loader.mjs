// ESM resolution hooks for the tests.
//
// Mongoose models import `config/mongodb.js`, which opens a MongoDB connection
// on load (and kills the process if it fails). Tests do not need a database:
// infrastructure modules are swapped for stand-ins here, so the suite runs
// without MongoDB or Redis.
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));
const stubs = path.join(here, "stubs");

const substitutions = {
  "back/config/mongodb.js": "mongodb.js",
  "back/config/redis.js": "redis.js",
  "back/jobs/ioredis.js": "ioredis.js",
  "back/jobs/queue.js": "queue.js",
  "back/index.js": "index.js",
};

export async function resolve(specifier, context, nextResolve) {
  const resolved = await nextResolve(specifier, context);
  const url = resolved.url.toLowerCase();
  for (const [suffix, stub] of Object.entries(substitutions)) {
    if (url.endsWith(suffix.toLowerCase())) {
      return {
        ...resolved,
        url: pathToFileURL(path.join(stubs, stub)).href,
        shortCircuit: true,
      };
    }
  }
  return resolved;
}
