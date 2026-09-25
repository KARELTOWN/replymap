// Wraps screen + microphone recording. RecordRTC is imported dynamically (on
// the first click on "Record") so the widget's initial load is not weighed
// down for every visitor who will never use it.

const MAX_RECORD_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export function createScreenRecorder({
  onTick,
  onAutoStop,
  onMicUnavailable,
  onStreamEnded,
}) {
  let RecordRTC = null;
  let recorderVideo = null;
  let screenStream = null;
  let micStream = null;
  let videoBlob = null;
  let tickInterval = null;
  let stopping = null;
  // Tells a stop requested by the interface from a stop undergone (the visitor
  // stops sharing from the browser bar): without this, both paths led to the
  // preview and showed it twice.
  let stopInitiated = false;

  // Time actually recorded: both the displayed timer and the automatic stop
  // must ignore time spent paused, otherwise a five-minute pause used up half of
  // the recording quota.
  let elapsedBeforePause = 0;
  let runningSince = null;

  const elapsedMs = () =>
    elapsedBeforePause + (runningSince === null ? 0 : Date.now() - runningSince);

  const clearTimers = () => {
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = null;
  };

  const releaseStreams = () => {
    screenStream?.getTracks().forEach((track) => track.stop());
    micStream?.getTracks().forEach((track) => track.stop());
    screenStream = null;
    micStream = null;
  };

  async function start() {
    if (!RecordRTC) {
      RecordRTC = (await import("recordrtc")).default;
    }

    // Limited to the current tab: `preferCurrentTab` avoids the full native
    // picker on Chromium; the post-capture check below rejects browsers that would
    // silently ignore that preference.
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: "browser" },
      audio: true,
      preferCurrentTab: true,
      selfBrowserSurface: "include",
    });
    const settings = screenStream.getVideoTracks()[0].getSettings?.() || {};
    if (settings.displaySurface && settings.displaySurface !== "browser") {
      screenStream.getTracks().forEach((t) => t.stop());
      screenStream = null;
      throw new Error("CURRENT_TAB_ONLY");
    }

    // The microphone is a bonus, not a requirement: a denied permission or a
    // machine without a microphone used to fail the whole recording, after the
    // visitor had already accepted screen sharing.
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      micStream = null;
      if (typeof onMicUnavailable === "function") onMicUnavailable();
    }

    const combinedStream = new MediaStream([
      ...screenStream.getVideoTracks(),
      ...screenStream.getAudioTracks(),
      ...(micStream ? micStream.getAudioTracks() : []),
    ]);

    try {
      recorderVideo = new RecordRTC.RecordRTCPromisesHandler(combinedStream, {
        type: "video",
      });
      await recorderVideo.startRecording();
    } catch (error) {
      // Sharing is already granted at this point: without this release, the
      // "Sharing" banner would stay visible after the failure.
      recorderVideo = null;
      releaseStreams();
      throw error;
    }

    stopping = null;
    stopInitiated = false;
    videoBlob = null;
    elapsedBeforePause = 0;
    runningSince = Date.now();

    // The visitor can stop sharing from the browser bar: the recording is then
    // closed cleanly rather than left orphaned.
    const stopFromStream = async () => {
      if (stopInitiated) return; // the interface already handles it
      try {
        const blob = await stop();
        if (typeof onStreamEnded === "function") onStreamEnded(blob);
      } catch (err) {
        console.error("Arrêt de l'enregistrement", err);
      }
    };
    screenStream.getVideoTracks()[0].addEventListener("ended", stopFromStream);
    screenStream.addEventListener("inactive", stopFromStream);

    tickInterval = setInterval(async () => {
      const elapsed = elapsedMs();
      if (typeof onTick === "function") onTick(elapsed);
      if (elapsed >= MAX_RECORD_DURATION_MS) {
        clearTimers();
        if (typeof onAutoStop === "function") onAutoStop();
      }
    }, 1000);
  }

  async function pause() {
    if (!recorderVideo || runningSince === null) return;
    await recorderVideo.pauseRecording();
    elapsedBeforePause = elapsedMs();
    runningSince = null;
  }

  async function resume() {
    if (!recorderVideo || runningSince !== null) return;
    await recorderVideo.resumeRecording();
    runningSince = Date.now();
  }

  // Idempotent: the stop may come from the button, the end of screen sharing or
  // the duration limit, sometimes at the same time. Calling stopRecording twice
  // on the same recorder lost the video.
  async function stop() {
    stopInitiated = true;
    if (stopping) return stopping;
    if (!recorderVideo) return null;

    const recorder = recorderVideo;
    recorderVideo = null;
    clearTimers();
    runningSince = null;

    stopping = (async () => {
      try {
        await recorder.stopRecording();
        videoBlob = await recorder.getBlob();
        return videoBlob;
      } finally {
        recorder.destroy();
        releaseStreams();
      }
    })();

    return stopping;
  }

  async function getState() {
    return recorderVideo ? await recorderVideo.getState() : "inactive";
  }

  return {
    start,
    pause,
    resume,
    stop,
    getState,
    getBlob: () => videoBlob,
    getElapsedMs: elapsedMs,
    maxDurationMs: MAX_RECORD_DURATION_MS,
  };
}
