import dns from "dns/promises";
import net from "net";

// Fetching a page the customer told us about.
//
// The address comes from a project, so it is chosen by a user: the server must
// never be turned into a probe for the network it runs on. `http://localhost`,
// `http://169.254.169.254/latest/meta-data/` or an address on the private
// network would otherwise be fetched with the server's own credentials and its
// answer handed back to whoever asked.
//
// Hence: the scheme is checked, every address the host resolves to is checked,
// redirects are followed by hand so each new host is checked again, and the
// download is bounded in time and in size.

const ALLOWED_PROTOCOLS = ["http:", "https:"];
const TIMEOUT_MS = 6000;
const MAX_REDIRECTS = 3;
const MAX_BYTES = 512 * 1024;

export const PAGE_FETCH_REFUSED = "refused";
export const PAGE_FETCH_UNREACHABLE = "unreachable";

// Loopback, private ranges, link-local (cloud metadata lives at 169.254.169.254),
// carrier-grade NAT, and their IPv6 equivalents.
const isPrivateIPv4 = (address) => {
  const [a, b] = address.split(".").map(Number);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
};

const isPrivateIPv6 = (address) => {
  const value = address.toLowerCase();
  if (value === "::1" || value === "::") return true;
  // Unique local (fc00::/7) and link-local (fe80::/10).
  if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8")) return true;
  // IPv4 mapped: ::ffff:127.0.0.1
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isPrivateIPv4(mapped[1]) : false;
};

const isPrivateAddress = (address) =>
  net.isIPv4(address) ? isPrivateIPv4(address) : isPrivateIPv6(address);

// Every address behind the name must be public: a name resolving to both a
// public and a private address is still a way in.
const resolvesToPublicHost = async (hostname) => {
  if (net.isIP(hostname)) return !isPrivateAddress(hostname);
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    return addresses.length > 0 && addresses.every((entry) => !isPrivateAddress(entry.address));
  } catch {
    return false;
  }
};

const normalise = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    return new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
};

// Stops reading past the cap: a page is inspected, not archived.
const readCapped = async (response) => {
  const body = response.body;
  if (!body) return await response.text();

  let size = 0;
  const parts = [];
  for await (const part of body) {
    size += part.length;
    parts.push(part);
    if (size >= MAX_BYTES) break;
  }
  return Buffer.concat(parts).toString("utf8");
};

/**
 * Downloads a page, or says why it could not.
 *
 * @param {string} rawUrl address of the page, with or without a scheme.
 * @returns {Promise<{ok: boolean, status?: number, html?: string, url?: string,
 * reason?: string}>} `reason` is `refused` when the address is one we will not
 * fetch, `unreachable` when the site did not answer.
 */
export const fetchPage = async (rawUrl) => {
  let target = normalise(rawUrl);
  if (!target || !ALLOWED_PROTOCOLS.includes(target.protocol)) {
    return { ok: false, reason: PAGE_FETCH_REFUSED };
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!(await resolvesToPublicHost(target.hostname))) {
      return { ok: false, reason: PAGE_FETCH_REFUSED };
    }

    let response;
    try {
      response = await fetch(target.href, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          // Some sites answer differently to a client with no user agent.
          "User-Agent": "BugReveal-InstallationCheck/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
      });
    } catch {
      return { ok: false, reason: PAGE_FETCH_UNREACHABLE };
    }

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      const next = normalise(new URL(location, target).href);
      if (!next || !ALLOWED_PROTOCOLS.includes(next.protocol)) {
        return { ok: false, reason: PAGE_FETCH_REFUSED };
      }
      target = next;
      continue;
    }

    return {
      ok: response.ok,
      status: response.status,
      url: target.href,
      html: response.ok ? await readCapped(response) : "",
    };
  }

  return { ok: false, reason: PAGE_FETCH_UNREACHABLE };
};

export default fetchPage;
