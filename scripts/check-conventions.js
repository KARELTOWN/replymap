#!/usr/bin/env node
//
// Convention checker.
//
// The architecture handbook states rules; this script is what makes them hold.
// It is meant to run in continuous integration and locally before a commit:
//
//   node scripts/check-conventions.js [directory ...]
//
// Rules enforced:
//   1. no file longer than 450 lines;
//   2. comments written in English;
//   3. controllers never import a model or a repository;
//   4. services never import a model;
//   5. only repositories import models.
//
// Rules 3 to 5 apply to the layered projects (back, record). Pass `--layers=off`
// for a project that does not follow them.

import fs from "fs";
import path from "path";

const MAX_LINES = 450;

// Accented letters are the cheapest reliable signal of a French comment in
// this codebase. Combined with a list of common words, it catches the vast
// majority without flagging English text that happens to contain a name.
const ACCENTED = /[éèêëàâçùûôîïœÉÈÊÀÇÔÎÛ]/;
const FRENCH_WORDS =
  /\b(le|la|les|un|une|des|du|de|au|aux|et|ou|est|sont|pas|pour|dans|sur|avec|sans|que|qui|quoi|donc|mais|car|ce|cette|ces|son|sa|ses|leur|nous|vous|ils|elles|par|plus|moins|tout|tous|toute|toutes|être|avoir|faire|quand|alors|ainsi|sinon|chaque|aucun|aucune|déjà|encore|jamais|toujours)\b/i;

// Build output and vendored code: not ours, and not what the rules are about.
const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "dist-electron",
  "build",
  "release",
  ".git",
  ".output",
  ".nuxt",
  "storage",
  "secrets",
  "coverage",
]);

// A bundled or minified file is build output wherever it sits.
const isBuildArtefact = (filePath) => /\.(min|bundle)\.(js|css)$/.test(filePath);

const SOURCE_EXTENSIONS = new Set([".js", ".mjs", ".ts", ".vue"]);

const collectFiles = (root) => {
  const files = [];
  const walk = (directory) => {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) walk(path.join(directory, entry.name));
      } else if (
        SOURCE_EXTENSIONS.has(path.extname(entry.name)) &&
        !isBuildArtefact(entry.name)
      ) {
        files.push(path.join(directory, entry.name));
      }
    }
  };
  walk(root);
  return files;
};

const commentLines = (content) => {
  const found = [];
  let inBlock = false;

  content.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();

    if (inBlock) {
      found.push({ number: index + 1, text: trimmed.replace(/^\*+/, "").trim() });
      if (trimmed.includes("*/")) inBlock = false;
      return;
    }
    if (trimmed.startsWith("/*")) {
      found.push({ number: index + 1, text: trimmed.replace(/^\/\*+/, "").trim() });
      if (!trimmed.includes("*/")) inBlock = true;
      return;
    }
    if (trimmed.startsWith("//")) {
      found.push({ number: index + 1, text: trimmed.slice(2).trim() });
      return;
    }
    // Trailing comment on a line of code.
    const inline = line.match(/\s\/\/\s(.+)$/);
    if (inline) found.push({ number: index + 1, text: inline[1].trim() });
  });

  return found.concat(htmlCommentLines(content));
};

// The comments of a Vue template. They were the blind spot of the checker:
// only JavaScript comments were read, so `<!-- ... -->` could say anything in
// any language and never be seen.
const htmlCommentLines = (content) => {
  const found = [];
  let inComment = false;

  content.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!inComment && !trimmed.includes("<!--")) return;

    const text = trimmed.replace(/<!--/, "").replace(/-->/, "").trim();
    // Commented-out markup is dead code, not prose: the language rule has
    // nothing to say about it, and flagging it only trains people to ignore
    // the checker.
    const isMarkup = /<[a-zA-Z/]/.test(text) || /^[:@v-]/.test(text);
    if (text && !isMarkup) found.push({ number: index + 1, text });
    inComment = trimmed.includes("<!--") ? !trimmed.includes("-->") : !trimmed.includes("-->");
  });

  return found;
};

// French without accents is caught by the density of French-only function
// words, which rarely appear in English prose.
const STRONG_FRENCH =
  /\b(ne|pas|les|des|est|une|pour|dans|avec|sans|sont|cette|doit|peut|leur|aussi|donc|chaque|lorsque|quand|depuis|selon|entre|jamais|toujours|seulement|ici|encore|sinon|afin|dont|ceci|cela|elle|ils|nous|vous|mais|car|puis|parce)\b/gi;

const looksFrench = (text) =>
  (ACCENTED.test(text) && FRENCH_WORDS.test(text)) ||
  (text.match(STRONG_FRENCH) || []).length >= 2;

const layerOf = (filePath) => {
  const normalised = filePath.replace(/\\/g, "/");
  if (/(^|\/)controllers?\//.test(normalised)) return "controller";
  if (/(^|\/)repositories\//.test(normalised)) return "repository";
  if (/(^|\/)services?\//.test(normalised)) return "service";
  return null;
};

const importsOf = (content) => {
  const specifiers = [];
  const pattern = /(?:from|import)\s+["']([^"']+)["']/g;
  let match;
  while ((match = pattern.exec(content)) !== null) specifiers.push(match[1]);
  return specifiers;
};

const isModelImport = (specifier) => /(^|\/)models\//.test(specifier);
const isRepositoryImport = (specifier) => /(^|\/)repositories\//.test(specifier);

const MODEL_IMPORT_EXEMPT = /(^|\/)(models|seeders|tests|scripts)\//;

const checkFile = (filePath, { layers }) => {
  const violations = [];
  const content = fs.readFileSync(filePath, "utf8");
  const total = content.split(/\r?\n/).length;

  if (total > MAX_LINES) {
    violations.push({
      rule: "file-size",
      line: total,
      message: `${total} lines, limit is ${MAX_LINES}`,
    });
  }

  for (const comment of commentLines(content)) {
    if (comment.text && looksFrench(comment.text)) {
      violations.push({
        rule: "comment-language",
        line: comment.number,
        message: `comment is not in English: "${comment.text.slice(0, 60)}"`,
      });
    }
  }

  if (layers) {
    const layer = layerOf(filePath);
    const specifiers = importsOf(content);

    if (layer === "controller") {
      for (const specifier of specifiers) {
        if (isModelImport(specifier)) {
          violations.push({
            rule: "layering",
            line: 0,
            message: `a controller must not import a model (${specifier})`,
          });
        }
        if (isRepositoryImport(specifier)) {
          violations.push({
            rule: "layering",
            line: 0,
            message: `a controller must not import a repository (${specifier})`,
          });
        }
      }
    }

    if (layer === "service") {
      for (const specifier of specifiers) {
        if (isModelImport(specifier)) {
          violations.push({
            rule: "layering",
            line: 0,
            message: `a service must not import a model (${specifier}), go through a repository`,
          });
        }
      }
    }

    // Rule 5 for the remaining layers (middleware, validators, jobs, helpers,
    // routes). Models may import each other; seeders and tests work on the
    // data itself and are exempt.
    if (layer === null && !MODEL_IMPORT_EXEMPT.test(filePath.replace(/\\/g, "/"))) {
      for (const specifier of specifiers) {
        if (isModelImport(specifier)) {
          violations.push({
            rule: "layering",
            line: 0,
            message: `only repositories import models (${specifier})`,
          });
        }
      }
    }
  }

  return violations;
};

const targets = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
const layers = !process.argv.includes("--layers=off");
const roots = targets.length > 0 ? targets : ["."];

let totalViolations = 0;
const byRule = { "file-size": 0, "comment-language": 0, layering: 0 };

for (const root of roots) {
  for (const filePath of collectFiles(root)) {
    const violations = checkFile(filePath, { layers });
    if (violations.length === 0) continue;

    const relative = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
    for (const violation of violations) {
      byRule[violation.rule] += 1;
      totalViolations += 1;
      const position = violation.line > 0 ? `:${violation.line}` : "";
      console.log(`${relative}${position}  [${violation.rule}] ${violation.message}`);
    }
  }
}

console.log(
  `\n${totalViolations} violation(s) — ` +
    `file-size: ${byRule["file-size"]}, ` +
    `comment-language: ${byRule["comment-language"]}, ` +
    `layering: ${byRule.layering}`
);

process.exit(totalViolations > 0 ? 1 : 0);
