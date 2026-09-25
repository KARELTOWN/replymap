import { translate } from "../i18n/index.js";

// The single response shape of the API.
//
// Controllers used to send whatever object was at hand, with a different
// wrapper on every route: sometimes `{ message, data }`, sometimes the raw
// document, sometimes `{ errors: [...] }`. Clients had to special-case each
// endpoint. Every response now leaves through one of the builders below.
//
// Success:
//   { "success": true, "message": "...", "data": {...}, "meta": {...} }
//
// Failure:
//   { "success": false,
//     "error": { "code": "...", "message": "...", "details": [...], "traceId": "..." } }

const buildBody = ({ messageKey, locale, params, data, meta }) => {
  const body = {
    success: true,
    message: translate(messageKey, { locale, params }),
    data: data ?? null,
  };
  if (meta) body.meta = meta;
  return body;
};

export class ApiResponse {
  // 200 — the default answer for a read or an update.
  static ok(res, { messageKey, data = null, meta = null, params = {} } = {}) {
    return res
      .status(200)
      .json(buildBody({ messageKey, locale: res.req?.locale, params, data, meta }));
  }

  // 201 — a resource now exists at a known identifier.
  static created(res, { messageKey, data = null, params = {} } = {}) {
    return res
      .status(201)
      .json(buildBody({ messageKey, locale: res.req?.locale, params, data }));
  }

  // 202 — the work was handed to a queue and is not done yet.
  static accepted(res, { messageKey, data = null, params = {} } = {}) {
    return res
      .status(202)
      .json(buildBody({ messageKey, locale: res.req?.locale, params, data }));
  }

  // Paginated collection. `meta` is where the page numbers live, never inside
  // `data`, so a client can always read a list the same way.
  static page(res, { messageKey, items, total, page, limit, params = {} }) {
    const size = Number(limit) || items.length || 1;
    return ApiResponse.ok(res, {
      messageKey,
      params,
      data: items,
      meta: {
        total,
        page: Number(page) || 1,
        limit: size,
        totalPages: Math.max(Math.ceil(total / size), 1),
      },
    });
  }

  // Failures go through the error middleware, which is the only caller.
  // `traceId` matches the request log line, as in the Horizon API contract.
  static failure(res, { status, code, message, details = null }) {
    const error = { code, message };
    if (details) error.details = details;
    const traceId = res.req?.id;
    if (traceId) error.traceId = traceId;
    return res.status(status).json({ success: false, error });
  }
}

export default ApiResponse;
