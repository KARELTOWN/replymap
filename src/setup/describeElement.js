import * as rrweb from "rrweb";

// Identifying the element a visitor interacted with.
//
// The previous version built `#id`, or `tag.class1.class2`, or the tag name.
// Three problems, all visible in the dashboard:
//
//   - utility classes (Tailwind and the like) change with every restyling, so
//     a recorded selector stops matching the next day;
//   - `div.flex.items-center` matches hundreds of elements, so clicks on three
//     different buttons were counted as three clicks on "the same" element,
//     and reported as rage clicks;
//   - "#bugreveal_sidebar-title" tells a reader nothing about what was clicked.
//
// What is kept instead:
//
//   - `node_id`: rrweb's own identifier for that node. The replay knows it, so
//     the dashboard can point at the exact element of the recording, whatever
//     the page looks like today. It is also what clicks are counted by, so two
//     elements are never confused;
//   - `selector`: a short, structural CSS path (id or test attribute when
//     there is one, `nth-of-type` otherwise), still usable to find the element
//     in the code;
//   - `label`: what a human reads — the accessible name, or the text.

const TEST_ATTRIBUTES = ["data-testid", "data-test", "data-cy", "data-qa"];
const MAX_DEPTH = 4;
const MAX_LABEL = 60;

const escapeIdentifier = (value) =>
  window.CSS && CSS.escape ? CSS.escape(value) : value.replace(/[^\w-]/g, "\\$&");

// A generated id (framework, build hash) is not worth recording.
const isStableId = (id) => /^[a-zA-Z][\w-]*$/.test(id) && !/\d{4,}/.test(id);

const testAttribute = (element) => {
  for (const name of TEST_ATTRIBUTES) {
    const value = element.getAttribute?.(name);
    if (value) return `[${name}="${value}"]`;
  }
  return null;
};

// Position among the siblings of the same tag: stable as long as the layout is.
const positionSelector = (element) => {
  const tag = element.tagName.toLowerCase();
  const parent = element.parentElement;
  if (!parent) return tag;

  const sameTag = [...parent.children].filter((child) => child.tagName === element.tagName);
  if (sameTag.length < 2) return tag;
  return `${tag}:nth-of-type(${sameTag.indexOf(element) + 1})`;
};

const cssPath = (element) => {
  const parts = [];
  let current = element;

  for (let depth = 0; current && current.nodeType === 1 && depth < MAX_DEPTH; depth++) {
    const attribute = testAttribute(current);
    if (attribute) {
      parts.unshift(`${current.tagName.toLowerCase()}${attribute}`);
      break;
    }
    if (current.id && isStableId(current.id)) {
      parts.unshift(`#${escapeIdentifier(current.id)}`);
      break;
    }
    parts.unshift(positionSelector(current));
    current = current.parentElement;
  }

  return parts.join(" > ");
};

// What the element says it is, in the order a person would read it.
const readableLabel = (element) => {
  const candidates = [
    element.getAttribute?.("aria-label"),
    element.getAttribute?.("alt"),
    element.getAttribute?.("title"),
    element.getAttribute?.("placeholder"),
    element.value && typeof element.value === "string" ? element.value : null,
    element.innerText,
  ];

  for (const candidate of candidates) {
    const text = (candidate || "").replace(/\s+/g, " ").trim();
    if (text) return text.length > MAX_LABEL ? `${text.slice(0, MAX_LABEL)}…` : text;
  }
  return "";
};

/**
 * Describes the element an interaction happened on.
 *
 * @returns {{node_id: number|null, selector: string, label: string, tag: string}}
 */
export const describeElement = (element) => {
  if (!element || element.nodeType !== 1) {
    return { node_id: null, selector: "", label: "", tag: "" };
  }

  let nodeId = null;
  try {
    // The mirror is rrweb's map between the live DOM and the recording.
    nodeId = rrweb.record.mirror?.getId(element) ?? null;
    if (nodeId === -1) nodeId = null;
  } catch {
    nodeId = null;
  }

  return {
    node_id: nodeId,
    selector: cssPath(element),
    label: readableLabel(element),
    tag: element.tagName.toLowerCase(),
  };
};

// What clicks are grouped by: the recorded node when rrweb knows it, the path
// otherwise. Never the label, which two different buttons may share.
export const elementKey = (description) =>
  description.node_id !== null ? `node:${description.node_id}` : `path:${description.selector}`;

export default describeElement;
