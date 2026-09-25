// Static post-capture preview: the area to crop is selected on an image
// already captured (pixel-perfect, through captureTabToCanvas), not live on the
// page DOM, unlike the former enableRegionSelection which cropped an
// approximate html2canvas rendering of the whole page.
//
// The preview shows the captured canvas directly instead of copying its pixels
// into a second canvas: on a 4K screen, that copy cost an allocation of
// several tens of megabytes and a full transfer, just to show an image we
// already had.
export function createCropPreview({ sourceCanvas, container, onCropped, onCancel }) {
  const wrapper = document.createElement("div");
  wrapper.className = "bugreveal_crop-wrapper";

  const displayCanvas = sourceCanvas;
  displayCanvas.className = "bugreveal_edit-canvas";
  displayCanvas.style.touchAction = "none";
  wrapper.appendChild(displayCanvas);

  const hint = document.createElement("p");
  hint.className = "bugreveal_crop-hint";
  hint.innerText = "Faites glisser pour sélectionner la zone à recadrer";
  wrapper.appendChild(hint);

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "bugreveal_crop-cancel";
  cancelBtn.innerText = "Annuler";
  cancelBtn.onclick = () => {
    if (typeof onCancel === "function") onCancel();
  };
  wrapper.appendChild(cancelBtn);

  container.appendChild(wrapper);

  let selectionBox = null;
  let startPos = null;
  let currentPos = null;
  let frameRequested = false;

  // Offset of the canvas inside its container: the selection rectangle is
  // inserted in the container (centred, with the hint and the button below the
  // image) while pointer coordinates are relative to the canvas. Without this
  // offset, the selection showed next to the cursor as soon as the image did
  // not fill the full width.
  //
  // The rectangle is read at each event rather than cached for the whole
  // gesture: a cached one described where the image used to be, and the crop
  // landed beside the selection.
  let canvasOffset = { x: 0, y: 0 };
  const measure = () => {
    const rect = displayCanvas.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    canvasOffset = { x: rect.left - wrapperRect.left, y: rect.top - wrapperRect.top };
    return rect;
  };

  // Pointer position turned into image pixels straight away, with the rectangle
  // as it is at that instant.
  //
  // Positions used to be kept in CSS pixels and converted only when the gesture
  // ended, with a rectangle measured when it started. The preview area scrolls,
  // so anything that moved the image between the two — a scroll, a panel
  // resize — shifted the whole conversion, and the crop came out beside the
  // selected area. Image coordinates, once taken, no longer depend on where the
  // image sits.
  const toImagePos = (evt) => {
    const rect = measure();
    const scaleX = displayCanvas.width / rect.width;
    const scaleY = displayCanvas.height / rect.height;
    return {
      x: Math.max(0, Math.min((evt.clientX - rect.left) * scaleX, displayCanvas.width)),
      y: Math.max(0, Math.min((evt.clientY - rect.top) * scaleY, displayCanvas.height)),
    };
  };

  // Back to CSS pixels, to draw the rectangle over the image.
  const toCssPos = (position, rect) => ({
    x: (position.x * rect.width) / displayCanvas.width,
    y: (position.y * rect.height) / displayCanvas.height,
  });

  // Drawing the rectangle is aligned on screen frames rather than on pointer
  // events, which are far more frequent.
  const scheduleBoxUpdate = () => {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(() => {
      frameRequested = false;
      if (!selectionBox || !currentPos) return;
      const rect = measure();
      // Drawn from the very coordinates that will be cut out, so what is shown
      // and what is captured cannot drift apart.
      const start = toCssPos(startPos, rect);
      const current = toCssPos(currentPos, rect);
      const x = Math.min(start.x, current.x);
      const y = Math.min(start.y, current.y);

      selectionBox.style.transform = `translate(${x + canvasOffset.x}px, ${y + canvasOffset.y}px)`;
      selectionBox.style.width = `${Math.abs(current.x - start.x)}px`;
      selectionBox.style.height = `${Math.abs(current.y - start.y)}px`;
    });
  };

  function onPointerDown(e) {
    displayCanvas.setPointerCapture(e.pointerId);
    const rect = measure();
    startPos = toImagePos(e);
    currentPos = startPos;

    const start = toCssPos(startPos, rect);
    selectionBox = document.createElement("div");
    selectionBox.className = "bugreveal_selection-box";
    selectionBox.style.left = "0px";
    selectionBox.style.top = "0px";
    selectionBox.style.transform = `translate(${start.x + canvasOffset.x}px, ${start.y + canvasOffset.y}px)`;
    wrapper.appendChild(selectionBox);
  }

  function onPointerMove(e) {
    if (!selectionBox) return;
    currentPos = toImagePos(e);
    scheduleBoxUpdate();
  }

  function onPointerUp(e) {
    if (displayCanvas.hasPointerCapture?.(e.pointerId)) {
      displayCanvas.releasePointerCapture(e.pointerId);
    }
    if (!selectionBox) return;

    const endPos = toImagePos(e);

    selectionBox.remove();
    selectionBox = null;
    currentPos = null;

    // Already image pixels, already inside the image: only whole pixels are
    // left to settle, and they are rounded outwards so the selected edges are
    // never shaved off.
    const left = Math.floor(Math.min(startPos.x, endPos.x));
    const top = Math.floor(Math.min(startPos.y, endPos.y));
    const right = Math.ceil(Math.max(startPos.x, endPos.x));
    const bottom = Math.ceil(Math.max(startPos.y, endPos.y));

    const cropW = Math.min(right - left, displayCanvas.width - left);
    const cropH = Math.min(bottom - top, displayCanvas.height - top);
    if (cropW < 4 || cropH < 4) return;

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    cropCanvas
      .getContext("2d")
      .drawImage(sourceCanvas, left, top, cropW, cropH, 0, 0, cropW, cropH);

    if (typeof onCropped === "function") onCropped(cropCanvas);
  }

  const onKeyDown = (e) => {
    if (e.key === "Escape" && typeof onCancel === "function") onCancel();
  };

  displayCanvas.addEventListener("pointerdown", onPointerDown);
  displayCanvas.addEventListener("pointermove", onPointerMove);
  displayCanvas.addEventListener("pointerup", onPointerUp);
  displayCanvas.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("resize", measure);
  // The preview area scrolls: without this, the cached rectangle described a
  // place the image had left.
  window.addEventListener("scroll", measure, true);
  document.addEventListener("keydown", onKeyDown);

  return {
    destroy: () => {
      displayCanvas.removeEventListener("pointerdown", onPointerDown);
      displayCanvas.removeEventListener("pointermove", onPointerMove);
      displayCanvas.removeEventListener("pointerup", onPointerUp);
      displayCanvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      document.removeEventListener("keydown", onKeyDown);
      // The source canvas is reused by the annotation editor once a crop is
      // confirmed: it is detached without being cleared.
      if (displayCanvas.parentNode === wrapper) wrapper.removeChild(displayCanvas);
      wrapper.remove();
    },
  };
}
