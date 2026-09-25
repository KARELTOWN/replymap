// The box a visitor types annotation text into.
//
// It is a real <textarea> laid over the capture, not text drawn character by
// character on the canvas: the visitor gets a caret, selection, correction and
// their own keyboard layout for free. Its content becomes a canvas operation
// when it is committed.

const FOCUS_GUARD_MS = 300;

/**
 * Opens the box at the click, and reports the text when it is committed.
 *
 * @param {{event: PointerEvent, container: HTMLElement, color: string,
 *          onCommit: (lines: string[]) => void, onClose: () => void}} options
 * @returns {{element: HTMLTextAreaElement, commit: () => void}}
 */
export function openTextInput({ event, container, color, onCommit, onClose }) {
  const element = document.createElement("textarea");
  element.className = "bugreveal_writezone";
  element.rows = 1;
  element.placeholder = "Votre texte (Ctrl+Entrée pour valider)";

  // Placed on the click itself, in viewport coordinates. It used to be
  // positioned from offsets measured against the preview, which is neither a
  // positioned element nor free of scrolling: the box could land outside the
  // visible area, and typing seemed to do nothing.
  element.style.position = "fixed";
  element.style.left = `${event.clientX}px`;
  element.style.top = `${event.clientY}px`;
  element.style.borderColor = color;
  container.appendChild(element);

  // Focus on the next frame, and hold it against the blur that the same click
  // may cause: the box used to commit itself empty at once.
  const openedAt = Date.now();
  let closed = false;
  requestAnimationFrame(() => element.focus());

  const close = () => {
    if (closed) return;
    closed = true;
    element.remove();
    onClose();
  };

  const commit = () => {
    if (closed) return;
    const value = element.value;
    if (value.trim().length > 0) onCommit(value.split("\n"));
    close();
  };

  element.addEventListener("input", () => {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  });

  element.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  });

  element.addEventListener("blur", () => {
    if (Date.now() - openedAt < FOCUS_GUARD_MS) {
      requestAnimationFrame(() => element.focus());
      return;
    }
    commit();
  });

  return { element, commit };
}

export default openTextInput;
