import mongoose from "../config/mongodb.js";
import { redisClient } from "../config/redis.js";
import * as projectRepository from "../repositories/projectRepository.js";
import * as sessionRepository from "../repositories/sessionRepository.js";
import { AppError } from "../shared/errors/appError.js";
import {
  recordRefusal,
  recordHost,
  isHostBlocked,
} from "../services/project/installationService.js";
import { projectHost, requestHost } from "../shared/net/host.js";

// Guard of the ingestion endpoints (session creation, session end,
// recording chunk upload, event upload).
//
// These routes cannot require an account: the widget runs on the customer's
// website, often in front of an anonymous visitor. They were nonetheless fully
// open, with no check that the project exists, that it is active, or where the
// call comes from: anyone could fabricate sessions and push data for any
// project, straight into storage.
//
// Three barriers are set here:
//
// 1. the project must exist and be active;
// 2. the calling origin must match the project's registered domain;
// 3. the volume is capped per project and per caller.
//
// The Origin header is set by the browser and cannot be changed from a web page,
// but it remains forgeable by a client outside a browser: rate limiting is the
// second line, and a per-project write token would be the complete answer.

const PROJECT_CACHE_TTL_MS = 60 * 1000;
const projectCache = new Map();

const loadProject = async (projectId) => {
  const key = String(projectId);
  const cached = projectCache.get(key);
  if (cached && Date.now() - cached.at < PROJECT_CACHE_TTL_MS) return cached.project;

  // A chunk upload happens every few seconds per visitor: without this cache,
  // each one would add a Mongo read.
  const project = await projectRepository.findTrackingInfo(projectId);
  projectCache.set(key, { at: Date.now(), project });
  return project;
};

const isId = (value) => Boolean(value) && mongoose.Types.ObjectId.isValid(String(value));

/**
 * Finds the project a widget call belongs to.
 *
 * The widget does not send the project the same way on every endpoint, and
 * versions already cached on customer sites cannot be updated:
 *
 *   - session creation and chunk upload carry `project_id`;
 *   - an event batch carries `project` on each event;
 *   - ending a session only carries `session_id`.
 *
 * A guard that only read `project_id` rejected every event batch and every
 * session end.
 */
export const resolveProjectId = async (body = {}) => {
  if (isId(body.project_id)) return String(body.project_id);

  if (Array.isArray(body.events) && body.events.length > 0) {
    const projects = new Set(body.events.map((event) => String(event?.project ?? "")));
    // A batch must target a single project: a mixed batch could otherwise pass
    // the origin check for one project and write into another.
    if (projects.size !== 1) return null;
    const [projectId] = projects;
    return isId(projectId) ? projectId : null;
  }

  if (isId(body.session_id)) {
    const projectId = await sessionRepository.findProjectId(body.session_id);
    return projectId ? String(projectId) : null;
  }

  return null;
};

const INGEST_MAX = Number(process.env.INGEST_RATE_MAX || 600);
const INGEST_WINDOW = Number(process.env.INGEST_RATE_WINDOW || 60);

const underQuota = async (projectId, identifier) => {
  try {
    const key = `ingest:${projectId}:${identifier}`;
    const hits = await redisClient.incr(key);
    if (hits === 1) await redisClient.expire(key, INGEST_WINDOW);
    return hits <= INGEST_MAX;
  } catch (error) {
    // Redis being down must not interrupt ingestion.
    console.error("Ingestion quota unavailable:", error.message);
    return true;
  }
};

export const requireTrackedProject = async (req, res, next) => {
  try {
    const projectId = await resolveProjectId(req.body);
    if (!projectId) return next(new AppError("PROJECT_INVALID"));

    const project = await loadProject(projectId);
    if (!project) return next(new AppError("PROJECT_NOT_FOUND"));

    // A refusal is the only trace of why a project receives nothing: the widget
    // runs on someone else's website and cannot be asked afterwards. It is kept
    // so the installation state can explain the silence.
    const refuse = async (code, host = null) => {
      await recordRefusal(projectId, { code, host });
      // A refused host still belongs to the inventory: "the script runs there
      // and is being turned away" is the answer someone is looking for.
      if (host) await recordHost(projectId, host, false);
      return next(new AppError(code));
    };

    if (project.active === false) return refuse("TRACKING_DISABLED");

    const expected = projectHost(project.link);
    const actual = requestHost(req);

    // A website switched off from the project sheet: the script is still
    // installed there, and everything it sends is turned away.
    if (actual && isHostBlocked(project, actual)) {
      return refuse("TRACKING_HOST_BLOCKED", actual);
    }
    // A project without a usable domain cannot be checked: the call is let
    // through rather than cutting off a misconfigured project, but the rate
    // limit still applies.
    if (expected && actual && actual !== expected) {
      return refuse("TRACKING_ORIGIN_REJECTED", actual);
    }

    const identifier =
      req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
    if (!(await underQuota(projectId, identifier))) {
      return refuse("TRACKING_QUOTA_EXCEEDED");
    }

    req.trackedProject = project;
    // Where the script actually runs, throttled to one write per host per hour.
    // Not awaited: keeping this inventory must not slow down a call that is
    // already accepted, and `recordHost` swallows its own failures.
    if (actual) recordHost(projectId, actual, true);
    next();
  } catch (error) {
    next(error);
  }
};

export default requireTrackedProject;
