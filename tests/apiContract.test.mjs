// Response contract: every endpoint answers with the same envelope, in the
// caller's language, and no failure ever leaks an internal message.
import test from "node:test";
import assert from "node:assert/strict";

import ApiResponse from "../shared/http/apiResponse.js";
import { AppError } from "../shared/errors/appError.js";
import { ERROR_CODES } from "../shared/errors/errorCodes.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { translate, resolveLocale } from "../shared/i18n/index.js";

const capture = (locale = "en") => {
  const outcome = {};
  const res = {
    req: { locale },
    status(code) {
      outcome.status = code;
      return this;
    },
    json(body) {
      outcome.body = body;
      return this;
    },
  };
  return { res, outcome };
};

test("a success carries success, message and data", () => {
  const { res, outcome } = capture();
  ApiResponse.ok(res, { messageKey: "feedback.fetched", data: { _id: "1" } });

  assert.equal(outcome.status, 200);
  assert.equal(outcome.body.success, true);
  assert.equal(outcome.body.message, "Feedback retrieved.");
  assert.deepEqual(outcome.body.data, { _id: "1" });
});

test("a paginated list keeps its page numbers in meta, never in data", () => {
  const { res, outcome } = capture();
  ApiResponse.page(res, {
    messageKey: "feedback.listed",
    items: [{ _id: "1" }, { _id: "2" }],
    total: 42,
    page: 2,
    limit: 15,
  });

  assert.ok(Array.isArray(outcome.body.data));
  assert.deepEqual(outcome.body.meta, { total: 42, page: 2, limit: 15, totalPages: 3 });
});

test("a message follows the caller language", () => {
  const english = capture("en");
  ApiResponse.ok(english.res, { messageKey: "feedback.deleted" });
  assert.equal(english.outcome.body.message, "Feedback deleted.");

  const french = capture("fr");
  ApiResponse.ok(french.res, { messageKey: "feedback.deleted" });
  assert.equal(french.outcome.body.message, "Feedback supprimé.");
});

test("a business failure answers with its code and its translated message", () => {
  const { res, outcome } = capture("fr");
  const error = new AppError("PROJECT_NOT_MEMBER");

  errorHandler(error, { locale: "fr" }, res, () => {});

  assert.equal(outcome.status, ERROR_CODES.PROJECT_NOT_MEMBER.status);
  assert.equal(outcome.body.success, false);
  assert.equal(outcome.body.error.code, "PROJECT_NOT_MEMBER");
  assert.equal(outcome.body.error.message, "Vous n'êtes pas membre de ce projet.");
});

test("a validation failure lists the offending fields", () => {
  const { res, outcome } = capture();
  const error = new AppError("VALIDATION_FAILED", {
    details: [{ field: "title", message: "Too short" }],
  });

  errorHandler(error, { locale: "en" }, res, () => {});

  assert.equal(outcome.status, 422);
  assert.deepEqual(outcome.body.error.details, [{ field: "title", message: "Too short" }]);
});

test("an unexpected failure never leaks its internals", () => {
  const { res, outcome } = capture("en");
  const leak = new Error("connect ECONNREFUSED 10.0.0.4:27017");

  errorHandler(leak, { locale: "en" }, res, () => {});

  assert.equal(outcome.status, 500);
  assert.equal(outcome.body.error.code, "INTERNAL_ERROR");
  assert.equal(outcome.body.error.message, translate("errors.internal"));
  assert.ok(!JSON.stringify(outcome.body).includes("ECONNREFUSED"));
});

test("an unknown error code falls back instead of answering undefined", () => {
  const error = new AppError("SOMETHING_WE_NEVER_DEFINED");
  assert.equal(error.code, "INTERNAL_ERROR");
  assert.equal(error.status, 500);
});

test("the locale is negotiated from the query first, then the header", () => {
  assert.equal(resolveLocale({ query: { lang: "fr" }, headers: {} }), "fr");
  assert.equal(
    resolveLocale({ query: {}, headers: { "accept-language": "fr-FR,fr;q=0.9" } }),
    "fr"
  );
  // An unsupported language falls back rather than answering an empty string.
  assert.equal(
    resolveLocale({ query: {}, headers: { "accept-language": "de-DE" } }),
    "en"
  );
});

test("both locale files hold exactly the same keys", async () => {
  const { default: en } = await import("../shared/i18n/locales/en.json", { with: { type: "json" } });
  const { default: fr } = await import("../shared/i18n/locales/fr.json", { with: { type: "json" } });

  const flatten = (node, prefix = "") =>
    Object.entries(node).flatMap(([key, value]) =>
      typeof value === "object" && value !== null
        ? flatten(value, `${prefix}${key}.`)
        : [`${prefix}${key}`]
    );

  // A key present in one file only would surface as the raw key in the other
  // language: the two catalogues must always move together.
  assert.deepEqual(flatten(fr).sort(), flatten(en).sort());
});

test("every error code points to a message that exists in both languages", async () => {
  const { default: en } = await import("../shared/i18n/locales/en.json", { with: { type: "json" } });
  for (const [code, descriptor] of Object.entries(ERROR_CODES)) {
    const english = translate(descriptor.messageKey, { locale: "en" });
    const french = translate(descriptor.messageKey, { locale: "fr" });
    assert.notEqual(english, descriptor.messageKey, `${code} has no English message`);
    assert.notEqual(french, descriptor.messageKey, `${code} has no French message`);
  }
  assert.ok(en.errors);
});

test("a validation message key is translated for the caller", () => {
  assert.equal(translate("validation.titleRequired", { locale: "fr" }), "Le titre est obligatoire.");
  assert.equal(
    translate("validation.titleLength", { locale: "en", params: { min: 3, max: 200 } }),
    "The title must be between 3 and 200 characters."
  );
});
