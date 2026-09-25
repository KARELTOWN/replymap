// What a capture is allowed to weigh, how long it may take, and what the
// visitor is told when it fails.
//
// Extracted from the widget's entry point, which had grown past the 450-line
// limit the handbook sets: these are the rules around a capture, not the
// orchestration of one.

export const MAX_SIZE_MB = 50;
export const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
export const MAX_VIDEO_SIZE_MB = 200;
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

export const CAPTURE_TIMEOUT_MS = 20000;
export const CAPTURE_TIMEOUT_ERROR = "CAPTURE_TIMEOUT";

const CURRENT_TAB_ONLY_MESSAGE = "Seul l'onglet actuel peut être capturé";
const SHARE_DENIED_MESSAGE =
  "Partage de l'onglet refusé : autorisez le partage de cet onglet pour faire la capture";

/**
 * Tells the visitor why a capture failed.
 *
 * "Permission denied" (NotAllowedError) is what the browser answers when the
 * sharing dialog is cancelled or refused: it used to surface as a vague
 * "unavailable".
 */
export const captureErrorMessage = (error, fallback) => {
  if (error?.name === "NotAllowedError") return SHARE_DENIED_MESSAGE;
  if (error?.message === "CURRENT_TAB_ONLY") return CURRENT_TAB_ONLY_MESSAGE;
  if (error?.message === CAPTURE_TIMEOUT_ERROR) {
    return "La capture de la page a pris trop de temps, réessayez";
  }
  return fallback;
};

/**
 * html2canvas may hang forever — never resolving nor rejecting its promise —
 * when a page resource never finishes loading. Without this safeguard the
 * visitor stays stuck behind the loader with no way out.
 */
export function withTimeout(promise, ms = CAPTURE_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(CAPTURE_TIMEOUT_ERROR)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
