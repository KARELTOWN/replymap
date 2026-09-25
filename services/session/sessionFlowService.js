import * as sessionRepository from "../../repositories/sessionRepository.js";
import * as eventRepository from "../../repositories/eventRepository.js";
import { AppError } from "../../shared/errors/appError.js";
import { assertProjectAccess } from "../access/accessService.js";

// The path of a session: where the visitor went, and what they sent.
//
// The pages visited and the forms submitted used to sit in the event list, one
// line each, next to the errors. A path is not a list: what one wants to see is
// that the visitor came in through Contact, went back and forth between Home
// and Countries, and left — which page is a hub, which one is a dead end.
//
// So the events are turned into a small graph: one node per page, one edge per
// move, and the ordered steps the dashboard animates.

// Pages are grouped by path: the same page reached with different query
// strings is one node, not twenty.
const nodeKeyOf = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/\/+$/, "") || "/";
  } catch {
    return String(url || "/");
  }
};

const titleOf = (event) => {
  const title = event.data?.title;
  if (typeof title === "string" && title.trim()) return title.trim();
  return null;
};

// A node is named by its page title when the widget captured one, and by its
// path otherwise: "/panier" says more than "Boutique" repeated four times.
const labelOf = (key, title) => (key === "/" ? title || "Accueil" : key);

const typeOf = (event) => event.type?.libelle ?? null;

/**
 * Builds the flow of one session.
 *
 * @returns {Promise<{nodes: object[], edges: object[], steps: object[]}>}
 * `steps` is the chronological path: a `page` step moves the visitor, a `form`
 * step happens without moving them.
 */
export const flowOf = async ({ user, sessionId }) => {
  const session = await sessionRepository.findById(sessionId);
  if (!session) throw new AppError("NOT_FOUND");
  await assertProjectAccess(user, session.project_id);

  const events = await eventRepository.findFlowOfSession(sessionId);

  const nodes = new Map();
  const edges = new Map();
  const steps = [];
  let current = null;

  const touchNode = (key, { title, url }) => {
    const node = nodes.get(key) ?? {
      id: key,
      label: labelOf(key, title),
      url,
      visits: 0,
      forms: 0,
    };
    // A title seen later is kept: the first view of a single-page application
    // often happens before the framework has set it.
    if (title && (node.label === key || !node.label)) node.label = labelOf(key, title);
    nodes.set(key, node);
    return node;
  };

  for (const event of events) {
    const kind = typeOf(event);
    const url = event.data?.page_url || event.page_url;
    const key = nodeKeyOf(url);
    const node = touchNode(key, { title: titleOf(event), url });

    if (kind === "page_view") {
      node.visits += 1;

      if (current && current !== key) {
        const edgeKey = `${current}→${key}`;
        const edge = edges.get(edgeKey) ?? { from: current, to: key, count: 0 };
        edge.count += 1;
        edges.set(edgeKey, edge);
      }

      steps.push({
        kind: "page",
        node: key,
        from: current && current !== key ? current : null,
        at: event.timestamp ?? new Date(event.createdAt).getTime(),
      });
      current = key;
      continue;
    }

    if (kind === "form_submit") {
      node.forms += 1;
      steps.push({
        kind: "form",
        node: key,
        at: event.timestamp ?? new Date(event.createdAt).getTime(),
        form: event.data?.form_id || event.data?.label || event.data?.form || null,
        submit: event.data?.submit_id || event.data?.submit_label || event.data?.submit || null,
        page_url: url,
      });
      // A form does not move the visitor: `current` stays where it was.
    }
  }

  return {
    nodes: [...nodes.values()],
    edges: [...edges.values()],
    steps,
  };
};

export default { flowOf };
