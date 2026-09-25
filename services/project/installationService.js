import moment from "moment";
import { redisClient } from "../../config/redis.js";
import * as projectRepository from "../../repositories/projectRepository.js";
import * as sessionRepository from "../../repositories/sessionRepository.js";
import * as eventRepository from "../../repositories/eventRepository.js";
import { AppError } from "../../shared/errors/appError.js";
import { fetchPage, PAGE_FETCH_REFUSED } from "../../shared/net/pageFetch.js";

// Is the script installed, and is it working?
//
// After creating a project one copies a snippet, pastes it into a website, and
// nothing ever confirms it arrived. This module answers two questions:
//
//   - what has this project received, and when (`status`);
//   - is the snippet actually on the page (`testPage`), asked on demand.
//
// Neither answer is a guess dressed up as a fact: a script injected by a tag
// manager will not be found in the served HTML, and the state says so rather
// than declaring the installation broken.

const FRESH_DATA_HOURS = 24;

// How long a refused call is remembered. Long enough to still explain silence
// the next morning, short enough that a problem fixed stops being reported.
const REFUSAL_TTL_SECONDS = 7 * 24 * 60 * 60;

const refusalKey = (projectId) => `ingest:refusal:${String(projectId)}`;

// At most one write per host per hour: a busy project calls in every few
// seconds, and the list only has to be roughly up to date.
const HOST_WRITE_EVERY_SECONDS = 60 * 60;

// A project declares one domain; the snippet may end up on a handful of others.
// Past this many, the extra ones say nothing useful and the oldest give way.
const MAX_HOSTS = 20;

const hostKey = (projectId, host) => `ingest:host:${String(projectId)}:${host}`;

/**
 * Notes that a website sent data for this project.
 *
 * Called on every accepted call and on every call refused for its origin, so
 * the project sheet can list where the script actually runs — including where
 * it runs and is being turned away.
 */
export const recordHost = async (projectId, host, accepted = true) => {
  if (!host) return false;

  try {
    // The throttle is what makes this affordable on the ingestion path.
    const fresh = await redisClient.set(hostKey(projectId, host), accepted ? "1" : "0", {
      NX: true,
      EX: HOST_WRITE_EVERY_SECONDS,
    });
    if (!fresh) return false;

    const seenAt = new Date();
    const known = await projectRepository.touchHost(projectId, host, accepted, seenAt);
    if (!known) {
      await projectRepository.addHost(
        projectId,
        { host, first_seen_at: seenAt, last_seen_at: seenAt, accepted },
        MAX_HOSTS
      );
    }
    return true;
  } catch (error) {
    // Ingestion must not fail because this inventory could not be kept.
    console.error("Installed host not recorded:", error.message);
    return false;
  }
};

/**
 * Whether this website was switched off from the project sheet.
 *
 * Reads a project already loaded (the ingestion guard keeps one in cache for a
 * minute), so switching a site off takes effect within that minute — the
 * public project sheet, which is not cached, stops the script sooner than that.
 *
 * @param {{installed_hosts?: object[]}} project
 * @param {string} host
 */
export const isHostBlocked = (project, host) =>
  (project?.installed_hosts ?? []).some(
    (entry) => entry.host === host && entry.blocked === true
  );

/**
 * Switches one website off, or back on.
 *
 * Reserved to the owner of the project, like its other settings: cutting off a
 * website stops the collection there for everyone.
 */
export const setHostBlocked = async ({ user, projectId, host, blocked }) => {
  const project = await projectRepository.findOwner(projectId);
  if (!project) throw new AppError("PROJECT_NOT_FOUND");
  if (String(project.created_by) !== String(user._id)) {
    throw new AppError("PROJECT_OWNER_ONLY");
  }

  const known = await projectRepository.setHostBlocked(projectId, host, blocked);
  if (!known) throw new AppError("INSTALLATION_HOST_UNKNOWN");

  // The throttle would otherwise keep the old state for up to an hour: the
  // next call from that website must be seen again right away.
  try {
    await redisClient.del(hostKey(projectId, host));
  } catch {
    // The inventory is a convenience, never a reason to fail the change.
  }

  return { host, blocked };
};

/**
 * Remembers why the ingestion guard turned a call away.
 *
 * This is the only place that knows why a project receives nothing: the widget
 * is on someone else's website and cannot be asked. Redis being down must not
 * break ingestion, so a failure here is swallowed.
 */
export const recordRefusal = async (projectId, { code, host }) => {
  try {
    await redisClient.set(
      refusalKey(projectId),
      JSON.stringify({ code, host: host || null, at: new Date().toISOString() }),
      { EX: REFUSAL_TTL_SECONDS }
    );
  } catch (error) {
    console.error("Ingestion refusal not recorded:", error.message);
  }
};

const lastRefusal = async (projectId) => {
  try {
    const stored = await redisClient.get(refusalKey(projectId));
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Nothing is collected when every switch is off: the script runs, and sends
// nothing. Worth saying, since it looks exactly like a missing script.
const collectionIsOff = (track = {}) =>
  track.active_recording === false &&
  track.active_track_errors === false &&
  track.active_performance_issues === false;

const state = ({ lastSeenAt }) => {
  if (!lastSeenAt) return "waiting";
  return moment().diff(moment(lastSeenAt), "hours") < FRESH_DATA_HOURS ? "receiving" : "idle";
};

/**
 * What the project has received so far, and what may explain a silence.
 *
 * @param {string} projectId
 */
export const status = async (projectId) => {
  const project = await projectRepository.findById(projectId);
  if (!project) throw new AppError("PROJECT_NOT_FOUND");

  const [firstSeenAt, lastSession, lastEvent, sessions, events] = await Promise.all([
    sessionRepository.firstStartedAt(projectId),
    sessionRepository.lastStartedAt(projectId),
    eventRepository.lastCreatedAt(projectId),
    sessionRepository.countOfProject(projectId),
    eventRepository.countOfProject(projectId),
  ]);

  const dates = [lastSession, lastEvent].filter(Boolean).map((date) => new Date(date).getTime());
  const lastSeenAt = dates.length > 0 ? new Date(Math.max(...dates)) : null;

  const [refusal, hosts] = await Promise.all([
    lastRefusal(projectId),
    projectRepository.findHosts(projectId),
  ]);

  return {
    state: state({ lastSeenAt }),
    first_seen_at: firstSeenAt,
    last_seen_at: lastSeenAt,
    counts: { sessions, events },
    // Each reason is a fact the dashboard turns into a sentence; the order is
    // the order in which they are worth reading.
    reasons: [
      ...(project.active === false ? [{ code: "PROJECT_DISABLED" }] : []),
      ...(collectionIsOff(project.track) ? [{ code: "COLLECTION_OFF" }] : []),
      ...(project.link ? [] : [{ code: "NO_DOMAIN" }]),
      ...(refusal ? [{ code: refusal.code, host: refusal.host, at: refusal.at }] : []),
    ],
    domain: project.link || null,
    // Most recently seen first: that is the one being worked on.
    hosts: [...hosts].sort((left, right) => new Date(right.last_seen_at) - new Date(left.last_seen_at)),
  };
};

// The snippet is two tags: the script itself, and the one carrying the project
// identifier. Both are looked for, because a snippet copied from another
// project loads a widget that will never send anything here.
const scriptMarkers = (projectId) => ({
  script: /<script[^>]+src=["'][^"']*record\.js/i,
  project: new RegExp(`data-project=["']${String(projectId)}["']`, "i"),
});

/**
 * Fetches the project's own page and looks for the snippet.
 *
 * @param {string} projectId
 * @returns {Promise<object>} what was found, never an exception for a site
 * that simply did not answer: that answer is the result.
 */
export const testPage = async (projectId) => {
  const project = await projectRepository.findById(projectId);
  if (!project) throw new AppError("PROJECT_NOT_FOUND");
  if (!project.link) return { reachable: false, reason: "NO_DOMAIN" };

  const page = await fetchPage(project.link);
  if (!page.ok) {
    return {
      reachable: false,
      status: page.status ?? null,
      // An address we refuse to fetch is named for what it is: the mistake is
      // in the project, not on the network.
      reason: page.reason === PAGE_FETCH_REFUSED ? "ADDRESS_REFUSED" : "UNREACHABLE",
      url: project.link,
    };
  }

  const markers = scriptMarkers(projectId);
  return {
    reachable: true,
    status: page.status,
    url: page.url,
    script_found: markers.script.test(page.html),
    project_matched: markers.project.test(page.html),
  };
};

export default { status, testPage, recordRefusal, recordHost, setHostBlocked };
