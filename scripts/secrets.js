#!/usr/bin/env node
// Per-environment secret management.
//
// API keys, storage credentials and token signing keys used to live in clear in
// the repository: both in `utils/keys.js` and in environment files tracked by
// Git. Anyone with access to the repository, or to its history, could sign valid
// tokens and read the storage.
//
// The principle: the plain environment file never leaves the machine, and only
// its encrypted version is committed. Each space (local, dev, staging, prod) has
// its own master key, so someone holding the development key cannot read
// anything from production.
//
// Note: this encrypts, it does not hash. A hash is one-way and would not allow
// reading the value back when the application starts.
//
//   node scripts/secrets.js init <env>
//   node scripts/secrets.js encrypt <env>
//   node scripts/secrets.js decrypt <env>
//   node scripts/secrets.js list <env>
//   node scripts/secrets.js set <env> KEY=value
//   node scripts/secrets.js unset <env> KEY
//   node scripts/secrets.js check <env>
//   node scripts/secrets.js rotate <env>
//   node scripts/secrets.js audit

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VAULT_DIR = path.join(ROOT, "secrets");
const KEYRING_FILE = path.join(ROOT, ".secrets.keys.json");

// Each space points to the environment file the server actually loads at
// start-up (see how `envfile` is resolved in index.js).
const ENVIRONMENTS = {
  local: { file: ".env", nodeEnv: null },
  dev: { file: ".env.docker", nodeEnv: "development" },
  staging: { file: ".env.preprod", nodeEnv: "preprod" },
  prod: { file: ".env.production", nodeEnv: "production" },
};

// Keys without which the server cannot start correctly.
const REQUIRED_KEYS = [
  "PORT",
  "HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_CLUSTER_URL",
  "DB_CLUSTER",
  "REDIS_HOST",
  "REDIS_PORT",
  "SECRET_KEY",
  "encrypted_key_hash",
  "iv_key_hash",
  "R2_ENDPOINT",
  "R2_BUCKET",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "TRELLO_API_KEY",
  "TRELLO_SECRET",
  "FRONT_URL",
  "BACKEND_URL",
  "APP_ORIGINS",
];

const ALGORITHM = "aes-256-gcm";

// --- Utilitaires ------------------------------------------------------------

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

const done = (message) => console.log(`✓ ${message}`);

const resolveEnvironment = (name) => {
  if (!name) fail(`Espace manquant. Attendu : ${Object.keys(ENVIRONMENTS).join(", ")}`);
  const environment = ENVIRONMENTS[name];
  if (!environment) {
    fail(`Espace « ${name} » inconnu. Attendu : ${Object.keys(ENVIRONMENTS).join(", ")}`);
  }
  return { name, ...environment, plainPath: path.join(ROOT, environment.file) };
};

const vaultPath = (name) => path.join(VAULT_DIR, `${name}.enc`);

const readKeyring = () => {
  if (!fs.existsSync(KEYRING_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(KEYRING_FILE, "utf8"));
  } catch {
    fail(`${path.basename(KEYRING_FILE)} est illisible`);
  }
};

const writeKeyring = (keyring) => {
  fs.writeFileSync(KEYRING_FILE, `${JSON.stringify(keyring, null, 2)}\n`, {
    mode: 0o600,
  });
};

// The key may come from the environment (server, continuous integration)
// or from the local keyring, never from the repository.
const resolveKey = (name, { required = true } = {}) => {
  const fromEnv =
    process.env[`BUGREVEAL_SECRETS_KEY_${name.toUpperCase()}`] ||
    process.env.BUGREVEAL_SECRETS_KEY;
  const raw = fromEnv || readKeyring()[name];

  if (!raw) {
    if (!required) return null;
    fail(
      `Aucune clé pour l'espace « ${name} ». Lancez « npm run secrets -- init ${name} » ` +
        `ou exportez BUGREVEAL_SECRETS_KEY_${name.toUpperCase()}.`
    );
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) fail(`La clé de l'espace « ${name} » doit faire 32 octets.`);
  return key;
};

const encryptText = (key, plaintext) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    version: 1,
    algorithm: ALGORITHM,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
    updatedAt: new Date().toISOString(),
  };
};

const decryptText = (key, envelope) => {
  try {
    const decipher = crypto.createDecipheriv(
      envelope.algorithm || ALGORITHM,
      key,
      Buffer.from(envelope.iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(envelope.data, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    fail("Déchiffrement impossible : clé incorrecte ou fichier altéré.");
  }
};

const readVault = (environment) => {
  const file = vaultPath(environment.name);
  if (!fs.existsSync(file)) {
    fail(`Aucun coffre pour « ${environment.name} ». Lancez d'abord « encrypt ${environment.name} ».`);
  }
  const key = resolveKey(environment.name);
  return decryptText(key, JSON.parse(fs.readFileSync(file, "utf8")));
};

const writeVault = (environment, content) => {
  const key = resolveKey(environment.name);
  fs.mkdirSync(VAULT_DIR, { recursive: true });
  fs.writeFileSync(
    vaultPath(environment.name),
    `${JSON.stringify(encryptText(key, content), null, 2)}\n`
  );
};

// Minimal parsing of an environment file, preserving comments and line
// order on writes.
const parseEnv = (content) => {
  const entries = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    entries.set(trimmed.slice(0, index).trim(), trimmed.slice(index + 1).trim());
  }
  return entries;
};

const maskValue = (value) => {
  if (!value) return "(vide)";
  if (value.length <= 8) return "•".repeat(value.length);
  return `${value.slice(0, 3)}${"•".repeat(Math.max(value.length - 6, 3))}${value.slice(-3)}`;
};

// --- Commandes --------------------------------------------------------------

const commands = {
  init(name) {
    const environment = resolveEnvironment(name);
    const keyring = readKeyring();
    if (keyring[environment.name]) {
      fail(
        `Une clé existe déjà pour « ${environment.name} ». Utilisez « rotate ${environment.name} » pour la remplacer.`
      );
    }
    const key = crypto.randomBytes(32).toString("base64");
    keyring[environment.name] = key;
    writeKeyring(keyring);

    done(`Clé créée pour l'espace « ${environment.name} ».`);
    console.log(`\n  BUGREVEAL_SECRETS_KEY_${environment.name.toUpperCase()}=${key}\n`);
    console.log(
      "Conservez cette valeur dans votre gestionnaire de mots de passe et\n" +
        "déclarez-la sur le serveur : elle n'est écrite que dans .secrets.keys.json,\n" +
        "qui n'est pas versionné."
    );
  },

  encrypt(name) {
    const environment = resolveEnvironment(name);
    if (!fs.existsSync(environment.plainPath)) {
      fail(`${environment.file} est introuvable.`);
    }
    const content = fs.readFileSync(environment.plainPath, "utf8");
    writeVault(environment, content);
    done(
      `${environment.file} chiffré vers secrets/${environment.name}.enc (${parseEnv(content).size} clés).`
    );
  },

  decrypt(name) {
    const environment = resolveEnvironment(name);
    const content = readVault(environment);
    fs.writeFileSync(environment.plainPath, content, { mode: 0o600 });
    done(`secrets/${environment.name}.enc déchiffré vers ${environment.file}.`);
  },

  list(name) {
    const environment = resolveEnvironment(name);
    const entries = parseEnv(readVault(environment));
    console.log(`\nEspace « ${environment.name} » — ${entries.size} clés\n`);
    for (const [key, value] of entries) {
      console.log(`  ${key.padEnd(28)} ${maskValue(value)}`);
    }
    console.log();
  },

  set(name, ...pairs) {
    const environment = resolveEnvironment(name);
    if (pairs.length === 0) fail("Attendu : set <env> CLE=valeur [CLE=valeur...]");

    let content = readVault(environment);
    for (const pair of pairs) {
      const index = pair.indexOf("=");
      if (index === -1) fail(`« ${pair} » n'est pas au format CLE=valeur.`);
      const key = pair.slice(0, index).trim();
      const value = pair.slice(index + 1);
      const pattern = new RegExp(`^\\s*${key}\\s*=.*$`, "m");
      content = pattern.test(content)
        ? content.replace(pattern, `${key}=${value}`)
        : `${content.replace(/\s*$/, "")}\n${key}=${value}\n`;
      done(`${key} défini dans « ${environment.name} ».`);
    }
    writeVault(environment, content);
  },

  unset(name, key) {
    const environment = resolveEnvironment(name);
    if (!key) fail("Attendu : unset <env> CLE");
    const content = readVault(environment);
    const pattern = new RegExp(`^\\s*${key}\\s*=.*$\\n?`, "m");
    if (!pattern.test(content)) fail(`${key} est absent de « ${environment.name} ».`);
    writeVault(environment, content.replace(pattern, ""));
    done(`${key} retiré de « ${environment.name} ».`);
  },

  check(name) {
    const environment = resolveEnvironment(name);
    const entries = parseEnv(readVault(environment));
    const missing = REQUIRED_KEYS.filter((key) => !entries.has(key) || entries.get(key) === "");
    if (missing.length > 0) {
      console.error(`✗ Espace « ${environment.name} » : ${missing.length} clés manquantes ou vides`);
      for (const key of missing) console.error(`    ${key}`);
      process.exit(1);
    }
    done(`Espace « ${environment.name} » complet (${REQUIRED_KEYS.length} clés requises).`);
  },

  rotate(name) {
    const environment = resolveEnvironment(name);
    const content = readVault(environment);

    const keyring = readKeyring();
    const key = crypto.randomBytes(32).toString("base64");
    keyring[environment.name] = key;
    writeKeyring(keyring);
    writeVault(environment, content);

    done(`Clé de l'espace « ${environment.name} » remplacée et coffre réécrit.`);
    console.log(`\n  BUGREVEAL_SECRETS_KEY_${environment.name.toUpperCase()}=${key}\n`);
    console.log(
      "Mettez à jour le serveur avant le prochain déploiement : l'ancienne clé\n" +
        "ne déchiffre plus ce coffre."
    );
  },

  // Safeguard: reports any plaintext secret still tracked by Git.
  audit() {
    let tracked = [];
    try {
      tracked = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
        .split("\n")
        .filter(Boolean);
    } catch {
      fail("Dépôt Git introuvable.");
    }

    // `.env.example` is a template without values: it is meant to be committed.
    const leaked = tracked.filter(
      (file) => /^\.env($|\.)/.test(file) && file !== ".env.example"
    );
    const storage = tracked.filter((file) => file.startsWith("storage/"));

    if (leaked.length === 0 && storage.length === 0) {
      done("Aucun secret ni donnée de session suivi par Git.");
      return;
    }

    if (leaked.length > 0) {
      console.error(`✗ ${leaked.length} fichier(s) de secrets suivi(s) par Git :`);
      for (const file of leaked) console.error(`    ${file}`);
    }
    if (storage.length > 0) {
      console.error(`✗ ${storage.length} fichier(s) de données suivi(s) sous storage/`);
    }
    console.error(
      "\nRetirez-les de l'index (git rm --cached <fichier>), puis purgez l'historique\n" +
        "avec git filter-repo avant de considérer les clés comme protégées."
    );
    process.exit(1);
  },
};

const [command, ...args] = process.argv.slice(2);

if (!command || command === "help" || !commands[command]) {
  console.log(`
Gestion des secrets BugReveal

  npm run secrets -- init <env>            crée la clé maîtresse de l'espace
  npm run secrets -- encrypt <env>         chiffre le fichier d'environnement
  npm run secrets -- decrypt <env>         restaure le fichier d'environnement
  npm run secrets -- list <env>            liste les clés, valeurs masquées
  npm run secrets -- set <env> CLE=valeur  modifie une valeur dans le coffre
  npm run secrets -- unset <env> CLE       retire une clé du coffre
  npm run secrets -- check <env>           vérifie les clés obligatoires
  npm run secrets -- rotate <env>          remplace la clé maîtresse
  npm run secrets -- audit                 cherche des secrets suivis par Git

Espaces : ${Object.keys(ENVIRONMENTS).join(", ")}
`);
  process.exit(command && command !== "help" ? 1 : 0);
}

commands[command](...args);
