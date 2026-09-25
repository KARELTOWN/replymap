import { maskSelector } from "../../utils/maskSelector.js";

// Applies the same masking as rrweb (utils/maskSelector.js) to the DOM
// CLONED by html2canvas before the screenshot is rendered, so sensitive data
// is never captured in clear in the image sent with the feedback.
function maskClonedDocument(clonedDoc) {
  const view = clonedDoc.defaultView;
  const nodes = clonedDoc.querySelectorAll(maskSelector);
  nodes.forEach((node) => {
    const isInput =
      view && (node instanceof view.HTMLInputElement || node instanceof view.HTMLTextAreaElement);

    // Falls back to the tag name when the cloned document has no associated
    // view: `node instanceof view.X` would then throw and let the sensitive
    // content through in clear.
    const tag = node.tagName;
    if (isInput || tag === "INPUT" || tag === "TEXTAREA") {
      node.value = "•".repeat(Math.max(node.value?.length || 0, 6));
    } else if (tag === "IMG") {
      // The image is replaced with a flat fill: a CSS blur protects nothing once
      // the source is removed, and stays reversible while it is loaded.
      node.removeAttribute("src");
      node.removeAttribute("srcset");
      node.style.background = "#cccccc";
    } else {
      node.textContent = "••••••••";
    }
  });
}

// Form controls, drawn as they look.
//
// The rendering engine lays the text of an input at the top of its box, so a
// field with a fixed height and vertical padding came out clipped or shifted
// in the screenshot. Each control is replaced, in the clone only, by a box
// with the same borders, background and font, holding its text centred like
// the browser shows it.
const COPIED_STYLES = [
  "width",
  "height",
  "minWidth",
  "border",
  "borderRadius",
  "backgroundColor",
  "padding",
  "margin",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "letterSpacing",
  "boxSizing",
  "textAlign",
];

const controlText = (control) => {
  if (control.tagName === "SELECT") {
    return control.options?.[control.selectedIndex]?.text ?? "";
  }
  return control.value || control.getAttribute("placeholder") || "";
};

function flattenFormControls(clonedDoc) {
  const view = clonedDoc.defaultView;
  if (!view) return;

  const controls = clonedDoc.querySelectorAll(
    "input:not([type=checkbox]):not([type=radio]):not([type=range]), select"
  );

  controls.forEach((control) => {
    const style = view.getComputedStyle(control);
    const box = clonedDoc.createElement("div");

    for (const property of COPIED_STYLES) box.style[property] = style[property];
    box.style.display = "flex";
    box.style.alignItems = "center";
    box.style.overflow = "hidden";
    box.style.whiteSpace = "nowrap";
    // An empty field shows its placeholder, in the muted colour the browser
    // uses for it.
    box.style.color = control.value ? style.color : "#9ca3af";
    box.textContent = controlText(control);

    control.replaceWith(box);
  });
}

// The clone is prepared once: sensitive values are masked first, then the
// controls are flattened, so a masked value is the one drawn.
function prepareClonedDocument(clonedDoc) {
  maskClonedDocument(clonedDoc);
  flattenFormControls(clonedDoc);
}

// html2canvas-pro weighs about 250 KB: imported on click, its download added
// to the time spent in front of the loader. It is preloaded during browser
// idle time, once the widget is authorised.
let captureEnginePromise = null;

const loadCaptureEngine = () => {
  if (!captureEnginePromise) {
    // html2canvas cannot parse modern colours (oklch/lab/lch), used by default
    // everywhere by Tailwind v4, which caused a hang (up to a frozen tab) on pages
    // using them. html2canvas-pro is a fork with a strictly identical API that
    // adds their support.
    captureEnginePromise = import("html2canvas-pro")
      .then((mod) => mod.default)
      .catch((error) => {
        // A network failure must not doom the capture for good: without this reset,
        // every later attempt would reuse the rejected promise.
        captureEnginePromise = null;
        throw error;
      });
  }
  return captureEnginePromise;
};

export function preloadCaptureEngine() {
  const warm = () => {
    // A preload failure is not an error: the capture will try again.
    loadCaptureEngine().catch(() => {});
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(warm, { timeout: 5000 });
  } else {
    setTimeout(warm, 2000);
  }
}

// The widget's own layers (loader, overlay, floating button) must never end up
// in the screenshot: every element it injects has an id starting with this.
const isWidgetElement = (element) =>
  typeof element.id === "string" && element.id.startsWith("bugreveal_");

// Captures only the area visible on screen (the "viewport"), not the whole
// scrollable page: this is what lets the annotation show full screen over the
// page, as if drawing directly on it.
export async function captureViewportToCanvas() {
  const html2canvas = await loadCaptureEngine();

  return html2canvas(document.body, {
    removeContainer: true,
    logging: false,
    scale: 1,
    width: window.innerWidth,
    height: window.innerHeight,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    x: window.scrollX,
    y: window.scrollY,
    useCORS: true,
    allowTaint: false,
    onclone: prepareClonedDocument,
    ignoreElements: isWidgetElement,
  });
}

// Waits until a real frame of the stream is available.
//
// `requestVideoFrameCallback` returns as soon as the first frame is presented,
// typically within a few tens of milliseconds, whereas the previous fixed
// 500 ms wait was paid in full on every capture and was still a gamble.
const FRAME_TIMEOUT_MS = 1500;

function waitForFirstFrame(video) {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const timer = setTimeout(done, FRAME_TIMEOUT_MS);
    const finish = () => {
      clearTimeout(timer);
      done();
    };

    if (typeof video.requestVideoFrameCallback === "function") {
      video.requestVideoFrameCallback(finish);
      return;
    }
    // Fallback: two screen frames give the first render time to arrive.
    requestAnimationFrame(() => requestAnimationFrame(finish));
  });
}

// Screenshot through the native getDisplayMedia API: a raw video capture of
// the screen rendering (same mechanism as screen sharing), so DOM masking does
// not apply here; this is an inherent limit of the API, the same as any system
// capture tool.
// Unlike html2canvas (approximate DOM rendering, does not faithfully reproduce
// gradients/shadows/fonts/iframes), these are real screen pixels: this is what
// makes the capture reliable for cropping (see cropPreview.js). It is limited
// to the current tab: `preferCurrentTab` avoids the full native picker on
// Chromium, and the post-capture check rejects browsers that would silently
// ignore it (outside the Chromium spec).
//
// The frame is extracted through a <video> element, not `ImageCapture`: that
// interface exists neither on Firefox nor on Safari, where capture and
// cropping therefore always failed.
export async function captureTabToCanvas() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: "browser" },
    preferCurrentTab: true,
    selfBrowserSurface: "include",
  });

  const track = stream.getVideoTracks()[0];
  const settings = track.getSettings ? track.getSettings() : {};
  if (settings.displaySurface && settings.displaySurface !== "browser") {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error("CURRENT_TAB_ONLY");
  }

  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  // Out of flow and invisible, but in the document: some browsers refuse to
  // read a media element that was never attached.
  video.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
  document.body.appendChild(video);

  try {
    await video.play();
    await waitForFirstFrame(video);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || settings.width || window.innerWidth;
    canvas.height = video.videoHeight || settings.height || window.innerHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    // The screen sharing stream must be stopped whatever happens, otherwise the
    // "Sharing" banner stays visible to the visitor.
    video.pause();
    video.srcObject = null;
    video.remove();
    stream.getTracks().forEach((t) => t.stop());
  }
}
