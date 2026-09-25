import fr from "./locales/fr.json" with { type: "json" };
import en from "./locales/en.json" with { type: "json" };

// Message translation.
//
// Every string the API returns goes through here. Controllers and services
// never hold a literal sentence: they carry a key, and the wording lives in
// the locale files so it can be reviewed, reused and translated without
// touching the code.

const CATALOGUES = { en, fr };
export const DEFAULT_LOCALE = "en";
export const SUPPORTED_LOCALES = Object.keys(CATALOGUES);

const lookup = (catalogue, key) =>
  key.split(".").reduce((node, part) => (node ? node[part] : undefined), catalogue);

// `{name}` placeholders are replaced with the provided parameters.
const interpolate = (template, params) =>
  template.replace(/\{(\w+)\}/g, (match, name) =>
    params[name] === undefined ? match : String(params[name])
  );

export const translate = (key, { locale = DEFAULT_LOCALE, params = {} } = {}) => {
  const catalogue = CATALOGUES[locale] || CATALOGUES[DEFAULT_LOCALE];
  const value = lookup(catalogue, key) ?? lookup(CATALOGUES[DEFAULT_LOCALE], key);

  // An unknown key surfaces as itself rather than as an empty string: a
  // missing translation must be visible during review, never silent.
  if (typeof value !== "string") return key;
  return interpolate(value, params);
};

// Negotiates the locale from the request, with an explicit query parameter
// taking precedence over the browser header.
export const resolveLocale = (req) => {
  const requested = req?.query?.lang;
  if (typeof requested === "string" && SUPPORTED_LOCALES.includes(requested)) {
    return requested;
  }

  const header = req?.headers?.["accept-language"];
  if (typeof header === "string") {
    for (const part of header.split(",")) {
      const tag = part.split(";")[0].trim().slice(0, 2).toLowerCase();
      if (SUPPORTED_LOCALES.includes(tag)) return tag;
    }
  }

  return DEFAULT_LOCALE;
};

// Attaches the negotiated locale and a bound translator to the request.
export const localeMiddleware = (req, res, next) => {
  req.locale = resolveLocale(req);
  req.t = (key, params) => translate(key, { locale: req.locale, params });
  next();
};
