// Parses the Cookie header into `req.cookies`, which express-validator reads.
// A few lines rather than a dependency: only the session cookies are used.
export const parseCookies = (req, res, next) => {
  const cookies = {};
  for (const part of (req.headers.cookie || "").split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const name = part.slice(0, index).trim();
    const raw = part.slice(index + 1).trim();
    try {
      cookies[name] = decodeURIComponent(raw);
    } catch {
      cookies[name] = raw;
    }
  }
  req.cookies = cookies;
  next();
};

export default parseCookies;
