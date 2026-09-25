import service from "./service.js";
import { saveAs } from "file-saver";
import { getBugRevealToken } from "../../utils/cookie.js";
import { notify } from "../../utils/notify.js";
import { createPanel } from "./panel.js";
import { createCanvasEditor } from "./canvasEditor.js";
import { createScreenRecorder } from "./screenRecorder.js";
import { createCropPreview } from "./cropPreview.js";
import { captureTabToCanvas, captureViewportToCanvas, preloadCaptureEngine } from "./capture.js";
import { createFeedbackForm } from "./form.js";
import { createAccessGate, ensureFreshToken } from "./accessGate.js";
import { wireEditToolbar, syncDeleteButton } from "./editToolbar.js";
import {
  MAX_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  MAX_VIDEO_SIZE_MB,
  captureErrorMessage,
  withTimeout,
} from "./captureGuards.js";

const {
  getFeedbackParams,
  getGuestFeedbackParams,
  getProjectSettings,
  sendFeedback,
  checkMemberInProject,
  getBoardLists,
} = service();

export default async function initializeRecorder(recordingHandlePromise = null) {
  let types = [];
  let userIsInProject = false;
  // Guest mode: the project owner opened this project to visitors with no
  // BugReveal account. The form then asks for an email instead of a session.
  let guestMode = false;
  let bugRevealToken = getBugRevealToken();

  // MVP product rule: leaving feedback requires a BugReveal account AND an
  // invitation to this project. Membership is therefore checked first, and the
  // type reference data is only loaded when access is granted (it cannot be read
  // without an account anyway).
  if (bugRevealToken !== null) {
    try {
      const membership = await checkMemberInProject();
      userIsInProject = membership === "member";
      // An expired session shows the sign-in prompt, not "not a member".
      if (membership === "signed_out") bugRevealToken = null;
    } catch (error) {
      console.error("Project access check failed:", error);
    }
  }

  if (userIsInProject) {
    try {
      const data = await getFeedbackParams();
      if (data) {
        types = data.types;
      }
    } catch (error) {
      console.error("Feedback parameters could not be loaded:", error);
    }
  } else {
    // Not a member: before showing the door, ask the project whether it accepts
    // feedback from visitors without an account.
    const { allow_guest_feedback: open } = await getProjectSettings();
    if (open) {
      try {
        const data = await getGuestFeedbackParams();
        types = data.types;
        guestMode = types.length > 0;
      } catch (error) {
        console.error("Guest feedback parameters could not be loaded:", error);
      }
    }
  }

  const ui = createPanel();
  let editor = null; // current canvasEditor instance (image mode)
  let videoBlob = null; // current blob in video mode
  let videoBlobUrl = null; // current object URL (revoked on close)
  let captureKind = null; // "img" | "video"
  let activeCropPreview = null;

  ui.setCloseHandler(() => {
    if (editor) {
      editor.destroy();
      editor = null;
    }
    if (videoBlobUrl) {
      URL.revokeObjectURL(videoBlobUrl);
      videoBlobUrl = null;
    }
    if (activeCropPreview) {
      activeCropPreview.destroy();
      activeCropPreview = null;
    }
    videoBlob = null;
    captureKind = null;
  });

  const gate = createAccessGate({ ui, bugRevealToken });
  // A guest has no session to lose: the interception exists to turn an expired
  // member session back into the sign-in screen, which would here replace a
  // working form with a wall.
  if (!guestMode) gate.interceptSessionExpiry();

  if (!userIsInProject && !guestMode) {
    ui.setFabHandler(gate.renderAccessPanel);
    return;
  }

  // The capture engine (about 250 KB) is downloaded during browser idle time:
  // by the first click it is already cached.
  preloadCaptureEngine();

  // --- Form + submission ---
  const sendingState = { current: null };

  const buildForm = () => {
    sendingState.current = createFeedbackForm({
      container: ui.leftPanel,
      footer: ui.footer,
      types,
      userIsInProject,
      guest: guestMode,
      maxSizeBytes: MAX_SIZE_BYTES,
      captureKind,
      pageUrl: window.location.href,
      getBoardLists,
      onDownloadCapture: () => saveCurrentCapture(),
      onCancel: () => ui.closePanel(),
      onSubmit: async (data, attachments) => {
        // First, while the click still counts as a user action: renewing the
        // token may need to open the SSO window. A guest has no token, and
        // opening a sign-in window would be exactly what guest mode avoids.
        if (!guestMode) {
          const renewed = await ensureFreshToken(getBugRevealToken());
          if (!renewed) {
            notify("error", "Votre session a expiré, reconnectez-vous pour envoyer le feedback");
            return;
          }
        }
        if (sendingState.current) sendingState.current.setSubmitting(true);
        notify("info", "Envoi du feedback en cours...");
        try {
          let recordData = null;
          if (captureKind === "img" && editor) {
            recordData = editor.toDataURL();
          } else if (captureKind === "video" && videoBlob) {
            recordData = videoBlob;
          }
          const response = await sendFeedback(
            captureKind,
            recordData,
            attachments,
            data,
            guestMode,
          );
          if (response[0] === "success") {
            ui.closePanel();
            notify("success", "Feedback envoyé avec succès !");
            // The feedback just carried the current session_id: this session can now be
            // closed and a new one opened, without blocking the submission UI on this
            // rotation.
            if (recordingHandlePromise) {
              recordingHandlePromise
                .then((handle) => handle?.rotateSession())
                .catch((err) => console.error("Session rotation failed", err));
            }
          }
        } catch (error) {
          if (Array.isArray(error) && error[0] === "error") {
            notify("error", "Erreur lors de l'envoi du feedback");
          } else {
            console.error("Feedback submission failed:", error);
            notify("error", "Erreur lors de l'envoi du feedback");
          }
        } finally {
          if (sendingState.current) sendingState.current.setSubmitting(false);
        }
      },
    });
  };

  // --- Image mode: capture + annotation ---
  function showEditableCanvas(captureCanvas) {
    captureKind = "img";
    videoBlob = null;
    ui.resetEditorArea();
    ui.setTitle("Nouveau feedback");
    ui.setContext(window.location.href);
    ui.showPanel();

    if (editor) editor.destroy();
    editor = createCanvasEditor({
      image: captureCanvas,
      container: ui.preview,
      onSelectionChange: (hasSelection) => syncDeleteButton(ui.editToolbar, hasSelection),
    });
    ui.preview.appendChild(editor.canvas);
    wireEditToolbar(ui.editToolbar, editor, {
      onSave: () => saveCurrentCapture(),
      onCopy: () => copyCurrentCaptureToClipboard(),
    });
    buildForm();
  }

  async function saveCurrentCapture() {
    try {
      if (captureKind === "img" && editor) {
        const response = await fetch(editor.toDataURL());
        const blob = await response.blob();
        saveAs(blob, `bugreveal-capture-${Date.now()}.png`);
      } else if (captureKind === "video" && videoBlob) {
        saveAs(videoBlob, `bugreveal-capture-${Date.now()}.webm`);
      }
    } catch (err) {
      console.error("Capture download failed", err);
      notify("error", "Erreur lors du téléchargement");
    }
  }

  async function copyCurrentCaptureToClipboard() {
    if (captureKind !== "img" || !editor) return;
    try {
      const response = await fetch(editor.toDataURL());
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      notify("success", "Image copiée dans le presse-papier");
    } catch (err) {
      console.error("Clipboard copy failed", err);
      notify(
        "info",
        "Copie automatique indisponible : faites un clic droit sur l'image puis Copier l'image",
      );
    }
  }

  // A failure after the panel opened used to leave it open and empty: it is
  // closed, and the visitor is told why.
  function failCapture(error, fallback) {
    console.error("Capture failed:", error);
    if (ui.overlay.style.display !== "none") ui.closePanel();
    notify("error", captureErrorMessage(error, fallback));
  }

  // --- Comment right on the page (capture of the visible viewport) ---
  async function handleAnnotatePage() {
    ui.hideToolbar();
    ui.showLoader();
    try {
      const canvas = await withTimeout(captureViewportToCanvas());
      showEditableCanvas(canvas);
    } catch (error) {
      failCapture(error, "Impossible de préparer l'annotation");
    } finally {
      ui.hideLoader();
    }
  }

  // --- Capture of an external window/screen (current tab only) ---
  async function handleCaptureScreen() {
    ui.hideToolbar();
    try {
      const canvas = await captureTabToCanvas();
      showEditableCanvas(canvas);
    } catch (error) {
      failCapture(error, "Capture annulée ou indisponible");
    }
  }

  // --- Capture of a precise area: real capture of the tab (pixel-perfect),
  // then selection of the area on a static preview, unlike the former
  // html2canvas crop which did not render the page faithfully.
  // No loader here: a tab capture photographs the screen as it is, and the
  // loader showed up, dimmed background and spinner included, in the image.
  // The browser's sharing dialog is the waiting state.
  async function handleCropScreen() {
    ui.hideToolbar();
    let fullCanvas;
    try {
      fullCanvas = await captureTabToCanvas();
    } catch (error) {
      failCapture(error, "Capture annulée ou indisponible");
      return;
    }
    showCropPreview(fullCanvas);
  }

  function showCropPreview(fullCanvas) {
    ui.resetEditorArea();
    ui.editToolbar.style.display = "none";
    ui.showPanel();
    activeCropPreview = createCropPreview({
      sourceCanvas: fullCanvas,
      container: ui.preview,
      onCropped: (croppedCanvas) => {
        activeCropPreview?.destroy();
        activeCropPreview = null;
        showEditableCanvas(croppedCanvas);
      },
      onCancel: () => {
        activeCropPreview?.destroy();
        activeCropPreview = null;
        ui.closePanel();
      },
    });
  }

  // --- Video recording ---
  const screenRecorder = createScreenRecorder({
    onTick: (elapsedMs) => {
      const totalSeconds = Math.floor(elapsedMs / 1000);
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      const timer = document.getElementById("bugreveal_record-timer");
      if (timer) timer.innerText = `${minutes}:${seconds}`;
    },
    onAutoStop: () => {
      notify(
        "info",
        `Enregistrement arrêté automatiquement après ${Math.round(
          screenRecorder.maxDurationMs / 60000,
        )} minutes`,
      );
      finishRecording();
    },
    onMicUnavailable: () => {
      notify("info", "Micro indisponible : l'enregistrement continue sans votre voix");
    },
    // The visitor can stop sharing from the browser bar: without this relay, the
    // recording stopped but the panel stayed open and the video was never
    // offered.
    onStreamEnded: (blob) => {
      ui.hideRecordPanel();
      presentRecording(blob);
    },
  });

  async function handleStartRecord() {
    ui.hideToolbar();
    try {
      await screenRecorder.start();
      ui.showRecordPanel();
    } catch (error) {
      failCapture(error, "Impossible de démarrer l'enregistrement");
    }
  }

  function presentRecording(blob) {
    if (!blob) return;
    if (blob.size > MAX_VIDEO_SIZE_BYTES) {
      notify(
        "error",
        `Enregistrement trop volumineux (max ${MAX_VIDEO_SIZE_MB} Mo) : essayez un enregistrement plus court`,
      );
      return;
    }
    showVideoPreview(blob);
  }

  async function finishRecording() {
    const blob = await screenRecorder.stop();
    ui.hideRecordPanel();
    presentRecording(blob);
  }

  function showVideoPreview(blob) {
    captureKind = "video";
    videoBlob = blob;
    ui.resetEditorArea();
    ui.setTitle("Nouveau feedback");
    ui.setContext(window.location.href);
    ui.editToolbar.style.display = "none"; // no annotation tools on video
    ui.showPanel();

    videoBlobUrl = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.id = "replay_map_record_video";
    video.src = videoBlobUrl;
    video.autoplay = true;
    video.controls = true;
    ui.preview.appendChild(video);

    // Downloading the video is offered from the form's capture summary, instead
    // of an isolated button above the fields.
    buildForm();
  }

  // --- Wiring of the global buttons ---
  ui.toolbar.querySelector("#bugreveal_btnAnnotatePage").onclick = handleAnnotatePage;
  ui.toolbar.querySelector("#bugreveal_btnScreen").onclick = handleCaptureScreen;
  ui.toolbar.querySelector("#bugreveal_btnCropScreen").onclick = handleCropScreen;
  ui.toolbar.querySelector("#bugreveal_btnRecordVideoAudio").onclick = handleStartRecord;

  ui.recordPanel.querySelector("#bugreveal_btnRecordPause").onclick = async () => {
    const state = await screenRecorder.getState();
    if (state !== "recording") return;
    await screenRecorder.pause();
    ui.recordPanel.querySelector("#bugreveal_btnRecordPause").style.display = "none";
    ui.recordPanel.querySelector("#bugreveal_btnRecordResume").style.display = "flex";
  };
  ui.recordPanel.querySelector("#bugreveal_btnRecordResume").onclick = async () => {
    const state = await screenRecorder.getState();
    if (state !== "paused") return;
    await screenRecorder.resume();
    ui.recordPanel.querySelector("#bugreveal_btnRecordResume").style.display = "none";
    ui.recordPanel.querySelector("#bugreveal_btnRecordPause").style.display = "flex";
  };
  ui.recordPanel.querySelector("#bugreveal_btnRecordStop").onclick = async () => {
    const state = await screenRecorder.getState();
    if (state === "paused" || state === "recording") {
      await finishRecording();
    }
  };
}
