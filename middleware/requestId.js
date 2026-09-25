import crypto from "crypto";

// Correlation identifier, aligned with the Horizon API error contract.
//
// Every request gets an id, reused from `X-Request-Id` when a proxy already set
// one. It is returned in the same header and in every error body as `traceId`,
// so a support request quoting it leads straight to the matching log line.
export const requestId = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  req.id =
    typeof incoming === "string" && /^[\w-]{8,64}$/.test(incoming)
      ? incoming
      : crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
};

export default requestId;
