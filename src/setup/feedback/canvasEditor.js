// Vector annotation engine: each action (stroke, shape, text) is a light
// operation replayed on the canvas, instead of a full ImageData snapshot per
// action. Undo/redo history is based on snapshots of the `ops` array (not just
// push/pop) because "select" mode can move and delete existing shapes, not
// only add new ones.
//
// Rendering uses two layers:
//
// - a "baked" offscreen layer (the captured image + every operation already
//   committed), redrawn only when the drawing changes;
// - the visible canvas, which during a stroke only composes that layer plus
//   the operation in progress.
//
// Without this split, every pointer event redrew the background image and all
// annotations: the cost of a stroke grew with the number of annotations
// already drawn, and a full-page capture saturated the main thread after a
// few shapes.
//
// How each operation is drawn, measured and moved lives in canvasOps.js.

import { drawOp, createBoundsResolver, translateOp, makeShapeOp } from "./canvasOps.js";
import { openTextInput as openTextBox } from "./canvasTextInput.js";

const TOOLS = ["select", "draw", "rect", "ellipse", "arrow", "text"];

// Beyond this, the history helps nobody but keeps every point of every
// stroke in memory.
const MAX_HISTORY = 40;

// Two freehand points closer than this distance (in canvas pixels) cannot be
// told apart by the eye: skipping them lightens both live rendering and the
// bounds computation.
const MIN_POINT_DISTANCE = 1.5;

export function createCanvasEditor({ image, container, onSelectionChange }) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.className = "bugreveal_edit-canvas";
  canvas.style.touchAction = "none"; // prevents touch scroll/pinch during a stroke
  const ctx = canvas.getContext("2d");

  // Offscreen layer: background image + committed operations.
  const baseLayer = document.createElement("canvas");
  baseLayer.width = canvas.width;
  baseLayer.height = canvas.height;
  const baseCtx = baseLayer.getContext("2d");
  let baseDirty = true;
  let bakedExcludeId = null;

  let mode = "draw";
  let color = "#FF3B30";
  let lineWidth = 3;
  let fillEnabled = false;
  let nextId = 1;

  let ops = [];
  let history = [];
  let redoStack = [];
  let selectedOpId = null;
  let textInput = null;
  let commitCurrentText = null;

  const { getOpBounds, hitTestOps } = createBoundsResolver(ctx);
  const shapeStyle = () => ({ color, lineWidth, fill: fillEnabled });

  const setSelected = (id) => {
    selectedOpId = id;
    if (typeof onSelectionChange === "function") {
      onSelectionChange(selectedOpId != null);
    }
  };

  // --- Rendering ---
  function drawSelectionOutline(op) {
    const b = getOpBounds(op);
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#465FFF";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
    ctx.restore();
  }

  // `excludeId` serves dragging: the dragged shape is left out of the baked
  // layer so it can be redrawn at its temporary position on every frame.
  function bakeBase(excludeId) {
    baseCtx.clearRect(0, 0, baseLayer.width, baseLayer.height);
    baseCtx.drawImage(image, 0, 0);
    for (const op of ops) {
      if (op.id !== excludeId) drawOp(baseCtx, op);
    }
    bakedExcludeId = excludeId;
    baseDirty = false;
  }

  function paint({ draftOp = null, overlayOp = null, excludeId = null } = {}) {
    if (baseDirty || bakedExcludeId !== excludeId) bakeBase(excludeId);

    // The capture may have transparent areas (page without an opaque
    // background): without clearing, the previous frame would stay visible.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseLayer, 0, 0);
    if (draftOp) drawOp(ctx, draftOp);
    if (overlayOp) drawOp(ctx, overlayOp);

    if (mode === "select" && selectedOpId != null) {
      const selectedOp =
        overlayOp && overlayOp.id === selectedOpId
          ? overlayOp
          : ops.find((o) => o.id === selectedOpId);
      if (selectedOp) drawSelectionOutline(selectedOp);
    }
  }

  // Pointer events arrive much faster than screen frames (up to several
  // hundred per second on high refresh rate screens): only one per displayed
  // frame is kept.
  let frameRequested = false;
  let pendingPaint = null;

  function schedulePaint(options) {
    pendingPaint = options;
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(() => {
      frameRequested = false;
      const next = pendingPaint;
      pendingPaint = null;
      paint(next || {});
    });
  }

  function render() {
    baseDirty = true;
    pendingPaint = null;
    paint();
  }

  // --- History (snapshots of the operation array: needed to move/delete,
  // not only add) ---
  //
  // Since operations are never mutated in place, a copy of the array is enough:
  // deep copying every stroke's points on each action made memory climb very
  // fast on a somewhat busy annotation.
  const snapshot = () => ops.slice();

  function commit(nextOps) {
    history.push(snapshot());
    if (history.length > MAX_HISTORY) history.shift();
    redoStack = [];
    ops = nextOps;
    render();
  }

  const addOp = (op) => commit([...ops, { ...op, id: nextId++ }]);
  const updateOp = (id, patch) => commit(ops.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const deleteOp = (id) => {
    commit(ops.filter((o) => o.id !== id));
    if (selectedOpId === id) setSelected(null);
  };

  function undo() {
    if (!history.length) return;
    redoStack.push(snapshot());
    ops = history.pop();
    if (selectedOpId != null && !ops.some((o) => o.id === selectedOpId)) setSelected(null);
    render();
  }

  function redo() {
    if (!redoStack.length) return;
    history.push(snapshot());
    ops = redoStack.pop();
    render();
  }

  // The canvas rectangle does not change during a stroke: reading it on every
  // pointer event forced a layout recalculation per move.
  let cachedRect = null;
  const invalidateRect = () => {
    cachedRect = null;
  };

  function getMousePos(evt) {
    if (!cachedRect) cachedRect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - cachedRect.left) * (canvas.width / cachedRect.width),
      y: (evt.clientY - cachedRect.top) * (canvas.height / cachedRect.height),
    };
  }

  window.addEventListener("resize", invalidateRect);
  window.addEventListener("scroll", invalidateRect, true);

  // --- Text ---
  // The box itself lives in canvasTextInput.js; here it only becomes an
  // operation once the visitor is done typing.
  function openTextInput(evt) {
    if (commitCurrentText) commitCurrentText();

    const pos = getMousePos(evt);
    const handle = openTextBox({
      event: evt,
      container,
      color,
      onCommit: (lines) =>
        addOp({ type: "text", lines, x: pos.x, y: pos.y, fontSize: 20, color, lineWidth }),
      onClose: () => {
        textInput = null;
        commitCurrentText = null;
      },
    });

    textInput = handle.element;
    commitCurrentText = handle.commit;
  }

  // --- Interactions (pointer events: mouse + touch) ---
  let drawing = false;
  let dragStart = null;
  let freehandPoints = null;
  let draggingSelection = false;
  let dragOriginalOp = null;

  const resetInteractionState = () => {
    drawing = false;
    dragStart = null;
    freehandPoints = null;
    draggingSelection = false;
    dragOriginalOp = null;
  };

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    invalidateRect();

    if (mode === "text") {
      // Without preventDefault, the browser finishes the click by moving focus
      // back to the page: the text box lost focus at once, committed empty and
      // vanished, so typing text never worked.
      e.preventDefault();
      openTextInput(e);
      return;
    }

    const pos = getMousePos(e);

    if (mode === "select") {
      const hit = hitTestOps(pos, ops);
      if (hit) {
        setSelected(hit.id);
        draggingSelection = true;
        dragStart = pos;
        dragOriginalOp = hit;
      } else {
        setSelected(null);
      }
      paint();
      return;
    }

    drawing = true;
    if (mode === "draw") {
      freehandPoints = [pos];
    } else {
      dragStart = pos;
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (mode === "select") {
      if (!draggingSelection || !dragOriginalOp) return;
      const pos = getMousePos(e);
      const translated = translateOp(
        dragOriginalOp,
        pos.x - dragStart.x,
        pos.y - dragStart.y
      );
      schedulePaint({ overlayOp: translated, excludeId: dragOriginalOp.id });
      return;
    }

    if (!drawing) return;
    const pos = getMousePos(e);

    if (mode === "draw") {
      const last = freehandPoints[freehandPoints.length - 1];
      if (Math.hypot(pos.x - last.x, pos.y - last.y) < MIN_POINT_DISTANCE) return;
      freehandPoints.push(pos);
      schedulePaint({
        draftOp: { type: "path", points: freehandPoints, color, lineWidth },
      });
    } else if (["rect", "ellipse", "arrow"].includes(mode) && dragStart) {
      schedulePaint({ draftOp: makeShapeOp(mode, dragStart, pos, shapeStyle()) });
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);

    if (mode === "select") {
      if (draggingSelection && dragOriginalOp) {
        const pos = getMousePos(e);
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;
        if (dx !== 0 || dy !== 0) {
          const translated = translateOp(dragOriginalOp, dx, dy);
          updateOp(translated.id, translated);
        } else {
          paint();
        }
      }
      resetInteractionState();
      return;
    }

    if (!drawing) return;
    const pos = getMousePos(e);

    if (mode === "draw" && freehandPoints && freehandPoints.length > 1) {
      // Copy of the array: the stroke in progress is mutated during the gesture,
      // while committed operations must stay immutable (history and the bounds
      // cache depend on it).
      addOp({ type: "path", points: freehandPoints.slice(), color, lineWidth });
    } else if (["rect", "ellipse", "arrow"].includes(mode) && dragStart) {
      addOp(makeShapeOp(mode, dragStart, pos, shapeStyle()));
    } else {
      render();
    }
    resetInteractionState();
  });

  canvas.addEventListener("pointercancel", (e) => {
    if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    resetInteractionState();
    render();
  });

  function deleteSelected() {
    if (selectedOpId != null) deleteOp(selectedOpId);
  }

  const onKeyDown = (e) => {
    if (
      (e.key === "Delete" || e.key === "Backspace") &&
      mode === "select" &&
      selectedOpId != null &&
      !textInput
    ) {
      e.preventDefault();
      deleteSelected();
    }
  };
  document.addEventListener("keydown", onKeyDown);

  render();

  return {
    canvas,
    setMode: (newMode) => {
      if (!TOOLS.includes(newMode) || newMode === mode) return;
      // Text being typed used to be lost when switching tools.
      if (textInput && commitCurrentText) commitCurrentText();
      mode = newMode;
      resetInteractionState();
      if (mode !== "select") setSelected(null);
      canvas.style.cursor = { select: "default", text: "text" }[mode] || "crosshair";
      render();
    },
    getMode: () => mode,
    setColor: (c) => {
      color = c;
    },
    getColor: () => color,
    setLineWidth: (w) => {
      lineWidth = w;
    },
    getLineWidth: () => lineWidth,
    setFillEnabled: (v) => {
      fillEnabled = !!v;
    },
    getFillEnabled: () => fillEnabled,
    undo,
    redo,
    canUndo: () => history.length > 0,
    canRedo: () => redoStack.length > 0,
    deleteSelected,
    hasSelection: () => selectedOpId != null,
    toDataURL: (type = "image/png") => canvas.toDataURL(type),
    destroy: () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", invalidateRect);
      window.removeEventListener("scroll", invalidateRect, true);
      if (textInput) textInput.remove();
      // Releases both canvases: on a full-page capture, each may weigh several
      // tens of megabytes.
      baseLayer.width = 0;
      baseLayer.height = 0;
      ops = [];
      history = [];
      redoStack = [];
    },
  };
}
