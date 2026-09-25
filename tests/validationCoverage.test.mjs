// Input validation coverage.
//
// The rule: every value coming from outside is validated by express-validator,
// declared on the route, before the controller. This test walks the real route
// tree, so a new endpoint added without a validator fails the build rather
// than waiting to be noticed in review.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import api from "../routes/api.js";

const BACK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const collectRoutes = () => {
  const routes = [];
  const walk = (stack) => {
    for (const layer of stack) {
      if (layer.route) {
        const handlers = layer.route.stack.map((entry) => entry.name || "anonymous");
        routes.push({
          methods: Object.keys(layer.route.methods).map((method) => method.toUpperCase()),
          path: layer.route.path,
          handlers,
          // The last handler is the controller, and its name is unique across
          // the API, unlike the path which repeats from one module to another.
          handler: handlers[handlers.length - 1],
        });
      } else if (layer.name === "router" && layer.handle?.stack) {
        walk(layer.handle.stack);
      }
    }
  };
  walk(api.stack);
  return routes;
};

// express-validator chains appear in the stack under the name "middleware".
const hasValidationChain = (route) =>
  route.handlers.some((name) => name === "middleware");

// Endpoints that read nothing from the request but the authenticated user.
// Adding a name here is a deliberate decision, reviewed like any other.
const NO_EXTERNAL_INPUT = new Set([
  "getSessionVisitors",
  "getProfile",
  "getStats", // reads req.user only
  "getFeedbackParams", // shared reference data
  "getEventTypes", // shared reference data
  "trelloWebhookVerify", // reachability probe, empty body
]);

test("every route declares a validation chain", () => {
  const routes = collectRoutes();
  assert.ok(routes.length > 30, "the route tree looks empty, the walk is broken");

  const missing = routes
    .filter((route) => !NO_EXTERNAL_INPUT.has(route.handler))
    .filter((route) => !hasValidationChain(route));

  assert.deepEqual(
    missing.map((route) => `${route.methods.join(",")} ${route.path} → ${route.handler}`),
    [],
    "these routes accept input without a declared validator"
  );
});

test("no controller reads raw request input", () => {
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".js")) files.push(full);
    }
  };
  walk(path.join(BACK, "controllers"));

  const offenders = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    content.split(/\r?\n/).forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      // `req.files` is multipart, handled by multer, and `req.user` comes from
      // the authentication layer: neither is user-declared input.
      if (/req\.(body|query|params)\b/.test(line)) {
        offenders.push(
          `${path.relative(BACK, file).replace(/\\/g, "/")}:${index + 1} ${trimmed}`
        );
      }
    });
  }

  assert.deepEqual(
    offenders,
    [],
    "a controller must read matchedData(req), never the raw request"
  );
});
