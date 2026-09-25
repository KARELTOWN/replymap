// Annotation operations: how each one is drawn, measured, hit-tested and
// moved. Pure functions over plain objects, with no editor state: the editor
// (canvasEditor.js) owns the list of operations and the canvas.
//
// An operation is immutable: any change produces a new object. The bounds
// cache relies on it.

const FONT = "'Segoe UI', Arial, sans-serif";
const DEFAULT_FONT_SIZE = 20;
const LINE_HEIGHT_RATIO = 1.2;

export function drawArrow(targetCtx, fromX, fromY, toX, toY, width = 2) {
  const headLength = 10 + width;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  targetCtx.beginPath();
  targetCtx.moveTo(fromX, fromY);
  targetCtx.lineTo(toX, toY);
  targetCtx.stroke();

  targetCtx.beginPath();
  targetCtx.moveTo(toX, toY);
  targetCtx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );
  targetCtx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
  targetCtx.closePath();
  targetCtx.fill();
}

export function drawOp(targetCtx, op) {
  targetCtx.strokeStyle = op.color;
  targetCtx.fillStyle = op.color;
  targetCtx.lineWidth = op.lineWidth;
  targetCtx.lineCap = "round";
  targetCtx.lineJoin = "round";

  switch (op.type) {
    case "path": {
      const points = op.points;
      if (points.length < 2) return;
      targetCtx.beginPath();
      targetCtx.moveTo(points[0].x, points[0].y);
      // Indexed loop: `points.slice(1)` copied the whole stroke on every render,
      // so on every frame while drawing.
      for (let i = 1; i < points.length; i++) {
        targetCtx.lineTo(points[i].x, points[i].y);
      }
      targetCtx.stroke();
      break;
    }
    case "rect":
      if (op.fill) targetCtx.fillRect(op.x, op.y, op.w, op.h);
      targetCtx.strokeRect(op.x, op.y, op.w, op.h);
      break;
    case "ellipse": {
      targetCtx.beginPath();
      targetCtx.ellipse(
        op.x + op.w / 2,
        op.y + op.h / 2,
        Math.abs(op.w) / 2,
        Math.abs(op.h) / 2,
        0,
        0,
        Math.PI * 2
      );
      if (op.fill) targetCtx.fill();
      targetCtx.stroke();
      break;
    }
    case "arrow":
      drawArrow(targetCtx, op.x1, op.y1, op.x2, op.y2, op.lineWidth);
      break;
    case "text": {
      const fontSize = op.fontSize || DEFAULT_FONT_SIZE;
      targetCtx.font = `${fontSize}px ${FONT}`;
      const lineHeight = fontSize * LINE_HEIGHT_RATIO;
      (op.lines || [op.text || ""]).forEach((line, i) => {
        targetCtx.fillText(line, op.x, op.y + i * lineHeight);
      });
      break;
    }
  }
}

// `measureCtx` is only used to measure text width.
function computeOpBounds(op, measureCtx) {
  switch (op.type) {
    case "rect":
    case "ellipse":
      return { x: op.x, y: op.y, w: op.w, h: op.h };
    case "path": {
      // Single-pass scan: `Math.min(...xs)` allocated two arrays per call and
      // overflowed the call stack on very long strokes.
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const point of op.points) {
        if (point.x < minX) minX = point.x;
        if (point.x > maxX) maxX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
      }
      const pad = (op.lineWidth || 1) / 2 + 4;
      return {
        x: minX - pad,
        y: minY - pad,
        w: maxX - minX + pad * 2,
        h: maxY - minY + pad * 2,
      };
    }
    case "arrow": {
      const pad = 8 + (op.lineWidth || 1);
      return {
        x: Math.min(op.x1, op.x2) - pad,
        y: Math.min(op.y1, op.y2) - pad,
        w: Math.abs(op.x2 - op.x1) + pad * 2,
        h: Math.abs(op.y2 - op.y1) + pad * 2,
      };
    }
    case "text": {
      const fontSize = op.fontSize || DEFAULT_FONT_SIZE;
      measureCtx.font = `${fontSize}px ${FONT}`;
      const lineHeight = fontSize * LINE_HEIGHT_RATIO;
      const lines = op.lines || [op.text || ""];
      let width = 1;
      for (const line of lines) {
        const measured = measureCtx.measureText(line).width;
        if (measured > width) width = measured;
      }
      return { x: op.x, y: op.y - fontSize, w: width, h: lines.length * lineHeight };
    }
    default:
      return { x: 0, y: 0, w: 0, h: 0 };
  }
}

const isInsideBounds = (pos, bounds, pad = 4) =>
  pos.x >= bounds.x - pad &&
  pos.x <= bounds.x + bounds.w + pad &&
  pos.y >= bounds.y - pad &&
  pos.y <= bounds.y + bounds.h + pad;

// Operations being immutable, their bounds are memoised without ever needing
// to be invalidated.
export function createBoundsResolver(measureCtx) {
  const cache = new WeakMap();

  const getOpBounds = (op) => {
    const cached = cache.get(op);
    if (cached) return cached;
    const bounds = computeOpBounds(op, measureCtx);
    cache.set(op, bounds);
    return bounds;
  };

  // Topmost operation first: the last drawn is the one visible under the cursor.
  const hitTestOps = (pos, opsList) => {
    for (let i = opsList.length - 1; i >= 0; i--) {
      if (isInsideBounds(pos, getOpBounds(opsList[i]))) return opsList[i];
    }
    return null;
  };

  return { getOpBounds, hitTestOps };
}

export function translateOp(op, dx, dy) {
  switch (op.type) {
    case "path":
      return { ...op, points: op.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    case "rect":
    case "ellipse":
      return { ...op, x: op.x + dx, y: op.y + dy };
    case "arrow":
      return { ...op, x1: op.x1 + dx, y1: op.y1 + dy, x2: op.x2 + dx, y2: op.y2 + dy };
    case "text":
      return { ...op, x: op.x + dx, y: op.y + dy };
    default:
      return op;
  }
}

export function makeShapeOp(toolMode, from, to, { color, lineWidth, fill }) {
  if (toolMode === "rect" || toolMode === "ellipse") {
    return {
      type: toolMode,
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
      w: Math.abs(to.x - from.x),
      h: Math.abs(to.y - from.y),
      color,
      lineWidth,
      fill,
    };
  }
  if (toolMode === "arrow") {
    return { type: "arrow", x1: from.x, y1: from.y, x2: to.x, y2: to.y, color, lineWidth };
  }
  return null;
}
