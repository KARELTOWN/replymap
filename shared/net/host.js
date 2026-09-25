// Reading the website a call comes from.
//
// Two places need the same answer: the ingestion guard, which decides whether a
// call is accepted, and the public project sheet, which tells the widget on a
// blocked website to stop running. They must agree on what "the host" is, or a
// site could be refused by one and welcomed by the other.

export const hostOf = (value) => {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
};

// The domain registered on a project may be entered without a protocol.
export const projectHost = (link) => {
  if (!link) return null;
  return hostOf(link) || hostOf(`https://${link}`);
};

// The browser sets Origin on a cross-site call and Referer on a plain page
// load: neither is present on every request, so both are read.
export const requestHost = (req) => {
  const origin = req.headers?.origin;
  if (origin && origin !== "null") return hostOf(origin);
  const referer = req.headers?.referer;
  if (referer) return hostOf(referer);
  return null;
};

export default requestHost;
