import service from "./service.js";
import html2canvas from "html2canvas";
import RecordRTC from "recordrtc";
import { saveAs } from "file-saver";
import {
  buttonzoneHTML,
  mainCSS,
  recordPanelHTML,
  spinnerHTML,
} from "../../../public/main.js";
import { bugRevealToken } from "../../utils/cookie.js";

const { getFeedbackParams, sendFeedback, checkMemberInProject, getBoardLists } =
  service();
async function initializeRecorder() {
  let types = [];
  let priority = [];
  let recorderVideo = null;
  let videoBlob = null;
  let videoBlobUrl = null;
  let micStream = null;
  let screenStream = null;
  let userIsInProject = false;
  let project_members = [];
  let integrationBoardLists = [];
  let redirectURL = `http://localhost:5176`;

  try {
    console.log("bugRevealToken", bugRevealToken);

    const data = await getFeedbackParams();
    if (data) {
      types = data.types;
      if (bugRevealToken !== null) {
        priority = data.priority;
      }
    }

    if (bugRevealToken !== null) {
      let response = await checkMemberInProject();
      if (response && response[0] === true) {
        userIsInProject = true;
        project_members = response[1];
      }
    }
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des paramètres pour créer un feedback :",
      error
    );
  }
  // --- Créer le panel ---

  const MAX_SIZE_MB = 50;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  let mode = "draw"; // "draw" ou "text"
  const panel = document.createElement("div");
  panel.id = "bugreveal_capture-panel";
  const buttonzone = document.createElement("div");

  let history = [];

  buttonzone.id = "bugreveal_button-zone";
  panel.appendChild(buttonzone);
  buttonzone.innerHTML = buttonzoneHTML;

  let recordPanel = document.createElement("div");
  recordPanel.id = "bugreveal_recordPanel";

  recordPanel.innerHTML = recordPanelHTML;

  document.body.appendChild(recordPanel);
  document.body.appendChild(panel);

  // --- Style du panel ---
  const style = document.createElement("style");
  style.innerHTML = mainCSS;
  document.head.appendChild(style);

  // Loader à afficher pendant que le canvas se charge
  let canvasLoader = document.createElement("div");
  canvasLoader.id = "bugreveal_canvas-loader";
  canvasLoader.style.display = "none";
  let spinner = document.createElement("div");
  spinner.className = "bugreveal_spinner";
  spinner.innerHTML = spinnerHTML;
  canvasLoader.appendChild(spinner);
  document.body.appendChild(canvasLoader);

  // --- Zone de prévisualisation ---
  const preview = document.createElement("div");
  preview.id = "bugreveal_capture-preview";
  panel.appendChild(preview);

  //left panel
  const leftPanel = document.createElement("div");
  leftPanel.className = "bugreveal_left-panel";

  panel.appendChild(leftPanel);

  const interceptFetch = () => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        // Modify request if needed
        const [url, config] = args;

        const response = await originalFetch(url, config);
        const clonedResponse = response.clone();
        console.log("url", url);
        console.log(
          "url.includes(import.meta.env.VITE_BACKEND_URL)",
          import.meta.env.VITE_BACKEND_URL
        );
        if (url.includes(import.meta.env.VITE_BACKEND_URL)) {
          if (clonedResponse.status === 401) {
            localStorage.removeItem("bugreveal_record_app_user");
            notify("error", "Veuillez vous connecter");
            connexionBtn();
            windowListenEvent();
          }
        }

        return response;
      } catch (error) {
        console.error("error", error);
      }
    };
  };

  const connexionBtn = () => {
    let existBtn = document.getElementById("bugreveal_capture_connexion");
    if (existBtn) {
      leftPanel.removeChild(existBtn);
    }
    let connexionBtn = document.createElement("button");
    connexionBtn.id = "bugreveal_capture_connexion";
    connexionBtn.innerText = "Se connecter";
    redirectURL = `http://localhost:5176`;
    let urlParent = encodeURIComponent(window.location.href);
    redirectURL = `${redirectURL}?from=${urlParent}`;
    connexionBtn.onclick = () => {
      openLoginPopup(redirectURL);
    };
    leftPanel.appendChild(connexionBtn);
  };

  interceptFetch();

  function hidePanel() {
    panel.style.display = "none";
  }
  function showPanel() {
    panel.style.display = "flex";
  }

  function hideRecordPanel() {
    recordPanel.style.display = "none";
  }
  function showRecordPanel() {
    recordPanel.style.display = "flex";
  }

  let canvas = null;
  let ctx = null;

  // --- Fonction capture écran ---
  async function captureScreen() {
    hidePanel();
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser", // suggère une capture d’onglet
        },
        preferCurrentTab: true,
      });
    } catch (error) {
      console.error(error);
      showPanel();
      preview.innerHTML = "";
      leftPanel.innerHTML = "";
    }

    const track = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);

    const bitmap = await new Promise((resolve) => {
      setTimeout(async () => {
        resolve(await imageCapture.grabFrame());
      }, 500); // 0.5s de délai
    });

    let canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0);

    showEditableCanvas(canvas);
    track.stop();
  }

  let zoneSelectionActive = false; // Flag pour la capture de zone

  // --- Fonction capture élément (body par défaut) ---
  function enableRegionSelection() {
    if (zoneSelectionActive) return; // si déjà activé, ne rien faire
    zoneSelectionActive = true;
    hidePanel();
    document.body.style.userSelect = "none"; // empêche la sélection

    let startX, startY, selectionBox;

    document.body.style.cursor = "crosshair";

    function mouseDown(e) {
      startX = e.pageX;
      startY = e.pageY;

      selectionBox = document.createElement("div");
      selectionBox.className = "bugreveal_selection-box";
      selectionBox.style.left = startX + "px";
      selectionBox.style.top = startY + "px";
      document.body.appendChild(selectionBox);

      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp);
    }

    function mouseMove(e) {
      const x = Math.min(e.pageX, startX);
      const y = Math.min(e.pageY, startY);
      const w = Math.abs(e.pageX - startX);
      const h = Math.abs(e.pageY - startY);

      selectionBox.style.left = x + "px";
      selectionBox.style.top = y + "px";
      selectionBox.style.width = w + "px";
      selectionBox.style.height = h + "px";
    }

    async function mouseUp(e) {
      document.removeEventListener("mousemove", mouseMove);
      document.removeEventListener("mouseup", mouseUp);
      document.body.style.cursor = "default";

      const rect = selectionBox.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      document.body.removeChild(selectionBox);

      // Capture le body puis on découpe la zone
      const fullCanvas = await html2canvas(document.body, {
        removeContainer: true,
        logging: false,
        scale: 1,
        // Ajout des options pour gérer correctement le scroll
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        x: scrollX,
        y: scrollY,
        useCORS: true, // Pour gérer les images cross-origin
        allowTaint: false, // Permet de capturer les images de différentes origines
      });
      const ctx = fullCanvas.getContext("2d");

      // Crée un nouveau canvas à la taille de la sélection
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = rect.width;
      cropCanvas.height = rect.height;
      const cropCtx = cropCanvas.getContext("2d");

      cropCtx.drawImage(
        fullCanvas,
        rect.left + scrollX,
        rect.top + scrollY,
        rect.width,
        rect.height,
        0,
        0,
        rect.width,
        rect.height
      );

      showEditableCanvas(cropCanvas);
      document.removeEventListener("mousedown", mouseDown);
      document.body.style.userSelect = ""; // remet normal
    }

    document.addEventListener("mousedown", mouseDown);
  }

  // --- Afficher canvas annotable ---
  function showEditableCanvas(captureCanvas) {
    zoneSelectionActive = false;

    showPanel();
    preview.innerHTML = "";
    leftPanel.innerHTML = "";
    leftPanel.style.display = "flex";

    addEditImageBtn();

    canvas = document.createElement("canvas");
    canvas.width = captureCanvas.width;
    canvas.height = captureCanvas.height;
    ctx = canvas.getContext("2d");
    ctx.drawImage(captureCanvas, 0, 0);

    saveHistory();

    // Annotation (dessin rouge)
    let drawing = false;
    let arrowStart = null;

    canvas.addEventListener("mousedown", (e) => {
      if (mode === "draw") {
        drawing = true;
        ctx.beginPath();
        const { x, y } = getMousePos(canvas, e);
        ctx.moveTo(x, y);
        // saveHistory({ type: "cursor", x, y });
      } else if (mode == "text") {
        addTextInput(canvas, e, ctx);
      } else if (mode == "arrow") {
        arrowStart = getMousePos(canvas, e); // coordonnées internes canvas
      }
    });
    canvas.addEventListener("mouseup", (e) => {
      drawing = false;
      if (mode === "arrow" && arrowStart) {
        const arrowEnd = getMousePos(canvas, e); // coordonnées internes canvas
        drawArrow(ctx, arrowStart.x, arrowStart.y, arrowEnd.x, arrowEnd.y);
        arrowStart = null;
        saveHistory();
      } else {
        saveHistory({ type: "cursor", timestamp: Date.now() });
      }
    });
    canvas.addEventListener("mousemove", (e) => {
      if (mode !== "draw" || !drawing) return;
      const { x, y } = getMousePos(canvas, e);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
      //   ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      // saveHistory({ type: "cursor", x, y });
    });

    panel.style.width = "96%";
    panel.style.margin = "auto";
    preview.style.boxShadow = "0 20px 20px rgba(0,0,0,0.1)";
    preview.appendChild(canvas);

    // Description

    // type
    createForm("img");
  }

  async function startRecord() {
    hidePanel();
    // Capture écran + audio système (si disponible)
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "browser", // suggère une capture d’onglet
      },
      preferCurrentTab: true, // met en avant l’onglet actif
      audio: true, // système audio (si autorisé)
    });
    // Capture micro
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    // Fusionner les pistes
    const combinedStream = new MediaStream([
      ...screenStream.getVideoTracks(),
      ...screenStream.getAudioTracks(),
      ...micStream.getAudioTracks(),
    ]);
    recorderVideo = new RecordRTC.RecordRTCPromisesHandler(combinedStream, {
      type: "video",
    });
    recorderVideo.startRecording();
    checkStreamRecord();
    showRecordPanel();
  }

  async function pauseRecord() {
    await recorderVideo.pauseRecording();
  }

  async function resumeRecord() {
    await recorderVideo.resumeRecording();
  }

  let hasStopped = false;

  function checkStreamRecord() {
    const stopIfNeeded = async () => {
      if (hasStopped) return;
      hasStopped = true;
      await stopRecord();
    };

    screenStream.getVideoTracks()[0].addEventListener("ended", stopIfNeeded);
    screenStream.addEventListener("inactive", stopIfNeeded);
  }

  async function stopRecord() {
    await recorderVideo.stopRecording();
    videoBlob = await recorderVideo.getBlob();
    videoBlobUrl = URL.createObjectURL(videoBlob);
    hideRecordPanel();
    recorderVideo.destroy();
    screenStream.getTracks().forEach((track) => track.stop());
    micStream.getTracks().forEach((track) => track.stop());
    showVideoRecord(videoBlobUrl);
  }

  function showVideoRecord(blobUrl) {
    zoneSelectionActive = false;

    showPanel();
    preview.innerHTML = "";
    leftPanel.innerHTML = "";
    leftPanel.style.display = "flex";

    addEditImageBtn(false, false, false, false, true, false);

    let video = document.createElement("video");
    video.id = "replay_map_record_video";
    video.src = blobUrl;
    video.autoplay = true;
    video.controls = true;
    video.muted = false;
    panel.style.width = "96%";
    panel.style.margin = "auto";
    preview.style.boxShadow = "0 20px 20px rgba(0,0,0,0.1)";
    preview.appendChild(video);

    createForm("video");
    // saveHistory();
  }

  async function getRecordState() {
    return await recorderVideo.getState();
  }

  function addEditImageBtn(
    draw = true,
    text = true,
    arrow = true,
    undo = true,
    save = true,
    copy = true
  ) {
    const editmodezone = document.createElement("div");
    editmodezone.id = "bugreveal_editmodezone";
    // 🔘 Boutons pour changer de mode
    if (draw === true) {
      const btnDraw = document.createElement("button");
      btnDraw.title = "Dessiner";
      btnDraw.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="#ffffff" width="800px" height="800px" viewBox="0 0 1920 1920">
    <path d="M517.257 1127.343c72.733 0 148.871 36.586 221.274 107.45 87.455 110.418 114.922 204.135 81.632 278.296-72.733 162.274-412.664 234.897-618.666 259.178 34.609-82.62 75.15-216.88 75.15-394.645 0-97.123 66.47-195.455 157.88-233.689 26.698-11.097 54.494-16.59 82.73-16.59Zm229.404-167.109c54.055 28.895 106.462 65.371 155.133 113.494l13.844 15.6c28.016 35.378 50.649 69.987 70.425 104.155-29.554 26.259-59.878 52.737-90.75 79.545-18.898-35.488-43.069-71.964-72.843-109.319l-4.285-4.834c-48.342-47.683-99.43-83.39-151.727-107.011 26.368-30.653 53.066-61.196 80.203-91.63Zm1046.49-803.133c7.801 7.8 18.129 21.754 16.92 52.187-6.043 155.683-284.338 494.405-740.509 909.266-19.995-32.302-41.969-64.822-67.788-97.453l-22.523-25.27c-49.22-48.671-101.408-88.883-156.012-121.074 350.588-385.855 728.203-734.356 910.254-741.828 30.983-.109 44.497 9.01 59.658 24.172Zm126.678 56.472c2.087-53.615-14.832-99.98-56.142-141.29-34.28-34.279-81.962-51.198-134.588-49.11-304.554 12.414-912.232 683.377-1179.54 996.17-53.616-5.383-106.682 2.088-157.441 23.402-132.61 55.263-225.339 193.038-225.339 334.877 0 268.517-103.935 425.737-104.923 427.275L0 1896.747l110.307-6.153c69.217-3.735 681.29-45.375 810.165-332.46 24.39-54.604 29.225-113.163 15.93-175.239 374.32-321.802 972.11-879.71 983.427-1169.322" fill-rule="evenodd"/>
</svg>`;
      btnDraw.onclick = () => {
        let writezones = document.getElementsByClassName("bugreveal_writezone");

        // comme c'est une collection vivante, on doit le transformer en tableau
        [...writezones].forEach((zone) => {
          preview.removeChild(zone);
        });
        mode = "draw";
      };
      editmodezone.appendChild(btnDraw);
    }

    if (text === true) {
      const btnText = document.createElement("button");
      btnText.title = "Texte";
      btnText.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none">
<path d="M1 22C1 21.4477 1.44772 21 2 21H22C22.5523 21 23 21.4477 23 22C23 22.5523 22.5523 23 22 23H2C1.44772 23 1 22.5523 1 22Z" fill="#ffffff"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M18.3056 1.87868C17.1341 0.707107 15.2346 0.707107 14.063 1.87868L3.38904 12.5526C2.9856 12.9561 2.70557 13.4662 2.5818 14.0232L2.04903 16.4206C1.73147 17.8496 3.00627 19.1244 4.43526 18.8069L6.83272 18.2741C7.38969 18.1503 7.89981 17.8703 8.30325 17.4669L18.9772 6.79289C20.1488 5.62132 20.1488 3.72183 18.9772 2.55025L18.3056 1.87868ZM15.4772 3.29289C15.8677 2.90237 16.5009 2.90237 16.8914 3.29289L17.563 3.96447C17.9535 4.35499 17.9535 4.98816 17.563 5.37868L15.6414 7.30026L13.5556 5.21448L15.4772 3.29289ZM12.1414 6.62869L4.80325 13.9669C4.66877 14.1013 4.57543 14.2714 4.53417 14.457L4.0014 16.8545L6.39886 16.3217C6.58452 16.2805 6.75456 16.1871 6.88904 16.0526L14.2272 8.71448L12.1414 6.62869Z" fill="#ffffff"/>
</svg>`;
      btnText.onclick = () => (mode = "text");
      editmodezone.appendChild(btnText);
    }

    // Bouton pour activer le mode flèche
    if (arrow === true) {
      const arrowBtn = document.createElement("button");
      arrowBtn.title = "Flèche";
      arrowBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 16 16" fill="none">
<path d="M14 2H5.50003L4.00003 3.5L6.83581 6.33579L0.585815 12.5858L3.41424 15.4142L9.66424 9.16421L12.5 12L14 10.5L14 2Z" fill="#ffffff"/>
</svg>`;
      arrowBtn.onclick = () => {
        mode = "arrow";
      };
      editmodezone.appendChild(arrowBtn);
    }

    // UNDO BTN
    if (undo === true) {
      const undoBtn = document.createElement("button");
      undoBtn.title = "Retour";
      undoBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none">
<path d="M4 7H15C17.7614 7 20 9.23857 20 12C20 14.7614 17.7614 17 15 17M4 7L7 4M4 7L7 10M8.00001 17H11" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
      undoBtn.onclick = () => {
        undoAction();
      };
      editmodezone.appendChild(undoBtn);
    }

    // SAVE CANVAS IMAGE OR VIDEO TO LOCAL
    if (save === true) {
      const saveBtn = document.createElement("button");
      saveBtn.title = "Télécharger";
      saveBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 1.25C11.5858 1.25 11.25 1.58579 11.25 2V12.9726L9.56944 11.0119C9.29988 10.6974 8.8264 10.661 8.51191 10.9306C8.19741 11.2001 8.16099 11.6736 8.43056 11.9881L11.4306 15.4881C11.573 15.6543 11.7811 15.75 12 15.75C12.2189 15.75 12.427 15.6543 12.5694 15.4881L15.5694 11.9881C15.839 11.6736 15.8026 11.2001 15.4881 10.9306C15.1736 10.661 14.7001 10.6974 14.4306 11.0119L12.75 12.9726L12.75 2C12.75 1.58579 12.4142 1.25 12 1.25Z" fill="#ffffff"></path> <path d="M14.25 9V9.37828C14.9836 9.11973 15.8312 9.2491 16.4642 9.79167C17.4077 10.6004 17.517 12.0208 16.7083 12.9643L13.7083 16.4643C13.2808 16.963 12.6568 17.25 12 17.25C11.3431 17.25 10.7191 16.963 10.2916 16.4643L7.29163 12.9643C6.48293 12.0208 6.5922 10.6004 7.53568 9.79167C8.16868 9.2491 9.01637 9.11973 9.74996 9.37828V9H8C5.17157 9 3.75736 9 2.87868 9.87868C2 10.7574 2 12.1716 2 15V16C2 18.8284 2 20.2426 2.87868 21.1213C3.75736 22 5.17157 22 7.99999 22H16C18.8284 22 20.2426 22 21.1213 21.1213C22 20.2426 22 18.8284 22 16V15C22 12.1716 22 10.7574 21.1213 9.87868C20.2426 9 18.8284 9 16 9H14.25Z" fill="#ffffff"></path> </g></svg>`;
      saveBtn.onclick = () => {
        setTimeout(() => {
          saveFile();
        }, 0);
      };
      editmodezone.appendChild(saveBtn);
    }

    // SAVE CANVAS IMAGE OR VIDEO TO LOCAL
    if (copy === true) {
      const copyBtn = document.createElement("button");
      copyBtn.title = "Copier dans le presse papier";
      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M15 1.25H10.9436C9.10583 1.24998 7.65019 1.24997 6.51098 1.40314C5.33856 1.56076 4.38961 1.89288 3.64124 2.64124C2.89288 3.38961 2.56076 4.33856 2.40314 5.51098C2.24997 6.65019 2.24998 8.10582 2.25 9.94357V16C2.25 17.8722 3.62205 19.424 5.41551 19.7047C5.55348 20.4687 5.81753 21.1208 6.34835 21.6517C6.95027 22.2536 7.70814 22.5125 8.60825 22.6335C9.47522 22.75 10.5775 22.75 11.9451 22.75H15.0549C16.4225 22.75 17.5248 22.75 18.3918 22.6335C19.2919 22.5125 20.0497 22.2536 20.6517 21.6517C21.2536 21.0497 21.5125 20.2919 21.6335 19.3918C21.75 18.5248 21.75 17.4225 21.75 16.0549V10.9451C21.75 9.57754 21.75 8.47522 21.6335 7.60825C21.5125 6.70814 21.2536 5.95027 20.6517 5.34835C20.1208 4.81753 19.4687 4.55348 18.7047 4.41551C18.424 2.62205 16.8722 1.25 15 1.25ZM17.1293 4.27117C16.8265 3.38623 15.9876 2.75 15 2.75H11C9.09318 2.75 7.73851 2.75159 6.71085 2.88976C5.70476 3.02502 5.12511 3.27869 4.7019 3.7019C4.27869 4.12511 4.02502 4.70476 3.88976 5.71085C3.75159 6.73851 3.75 8.09318 3.75 10V16C3.75 16.9876 4.38624 17.8265 5.27117 18.1293C5.24998 17.5194 5.24999 16.8297 5.25 16.0549V10.9451C5.24998 9.57754 5.24996 8.47522 5.36652 7.60825C5.48754 6.70814 5.74643 5.95027 6.34835 5.34835C6.95027 4.74643 7.70814 4.48754 8.60825 4.36652C9.47522 4.24996 10.5775 4.24998 11.9451 4.25H15.0549C15.8297 4.24999 16.5194 4.24998 17.1293 4.27117ZM7.40901 6.40901C7.68577 6.13225 8.07435 5.9518 8.80812 5.85315C9.56347 5.75159 10.5646 5.75 12 5.75H15C16.4354 5.75 17.4365 5.75159 18.1919 5.85315C18.9257 5.9518 19.3142 6.13225 19.591 6.40901C19.8678 6.68577 20.0482 7.07435 20.1469 7.80812C20.2484 8.56347 20.25 9.56458 20.25 11V16C20.25 17.4354 20.2484 18.4365 20.1469 19.1919C20.0482 19.9257 19.8678 20.3142 19.591 20.591C19.3142 20.8678 18.9257 21.0482 18.1919 21.1469C17.4365 21.2484 16.4354 21.25 15 21.25H12C10.5646 21.25 9.56347 21.2484 8.80812 21.1469C8.07435 21.0482 7.68577 20.8678 7.40901 20.591C7.13225 20.3142 6.9518 19.9257 6.85315 19.1919C6.75159 18.4365 6.75 17.4354 6.75 16V11C6.75 9.56458 6.75159 8.56347 6.85315 7.80812C6.9518 7.07435 7.13225 6.68577 7.40901 6.40901Z" fill="#ffffff"></path> </g></svg>`;
      copyBtn.onclick = () => {
        notify(
          "info",
          "Pour copier, faites un clique droit sur l'image et cliquez sur COPIER L'IMAGE",
          6000
        );
      };
      editmodezone.appendChild(copyBtn);
    }

    preview.prepend(editmodezone);
  }

  // Fonction utilitaire pour corriger la position
  function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect(); // taille réelle affichée
    return {
      x: (evt.clientX - rect.left) * (canvas.width / rect.width),
      y: (evt.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function addTextInput(canvas, evt, ctx) {
    const rect = canvas.getBoundingClientRect();

    // Position relative dans le canvas
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    // Création de l'input
    const input = document.createElement("input");
    input.type = "text";
    input.className = "bugreveal_writezone";

    let inputX = x;
    const inputWidth = 120;
    if (inputX + inputWidth > canvas.offsetWidth) {
      inputX = canvas.offsetWidth - inputWidth - 10;
    }

    input.style.left = inputX + "px";
    input.style.top = y + 35 + "px";
    preview.appendChild(input);
    input.focus();

    // Quand l'utilisateur valide (Enter ou blur)
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        let textX = inputX * (canvas.width / rect.width);
        let textY = y * (canvas.height / rect.height);
        const a = drawText(ctx, input.value, textX, textY);
        let data = input.value;
        saveHistory({ type: "text", data, textX, textY });
        preview.removeChild(input);
      }
    });
  }

  // ✍️ Fonction dessin du texte sur le canvas
  function drawText(ctx, text, x, y) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "blue";
    ctx.fillText(text, x, y);
  }

  // --- Brancher les événements ---
  document.addEventListener("click", async (e) => {
    const parentButton = e.target.closest("button");
    if (parentButton && parentButton.id === "bugreveal_btnScreen") {
      preview.innerHTML = "";
      captureScreen();
    }
    if (parentButton && parentButton.id === "bugreveal_btnCropScreen") {
      preview.innerHTML = "";
      enableRegionSelection();
    }
    if (parentButton && parentButton.id === "bugreveal_btnRecordVideoAudio") {
      preview.innerHTML = "";
      startRecord();
    }
    if (parentButton && parentButton.id === "bugreveal_btnRecordPause") {
      let state = await getRecordState();
      if (state === "recording") {
        pauseRecord();
        parentButton.style.display = "none";
        document.getElementById("bugreveal_btnRecordResume").style.display =
          "block";
      }
    }

    if (parentButton && parentButton.id === "bugreveal_btnRecordResume") {
      let state = await getRecordState();
      if (state === "paused") {
        resumeRecord();
        parentButton.style.display = "none";
        document.getElementById("bugreveal_btnRecordPause").style.display =
          "block";
      }
    }

    if (parentButton && parentButton.id === "bugreveal_btnRecordStop") {
      let state = await getRecordState();
      if (state === "paused" || state === "recording") {
        stopRecord();
      }
    }
  });

  // Fonction pour dessiner une flèche
  function drawArrow(ctx, fromX, fromY, toX, toY) {
    const headLength = 10; // longueur de la pointe
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    // Ligne principale
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Pointe
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.lineTo(toX, toY);
    ctx.fillStyle = "red";
    ctx.fill();
  }

  // Sauvegarder l'état actuel du canvas
  function saveHistory(action) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    history.push({ imageData, action });
  }

  function undoAction() {
    if (history.length > 1) {
      history.pop(); // retire dernière action
      const last = history[history.length - 1];
      ctx.putImageData(last.imageData, 0, 0);
    }
  }

  const createForm = (type) => {
    let feedbackType = document.createElement("select");
    feedbackType.id = "bugreveal_capture-feedbackType";
    if (types && types.length > 0) {
      let option = document.createElement("option");
      option.value = "";
      option.text = "Choisir le type";
      feedbackType.appendChild(option);
      types.forEach((type) => {
        let option = document.createElement("option");
        option.value = type._id;
        option.text = type.libelle;
        feedbackType.appendChild(option);
      });
    }
    leftPanel.appendChild(feedbackType);

    // title
    let title = document.createElement("input");
    title.id = "bugreveal_capture-title";
    title.type = "text";
    title.placeholder = "Ajouter un titre";
    leftPanel.appendChild(title);

    //description
    let textarea = document.createElement("textarea");
    textarea.id = "bugreveal_capture-desc";
    textarea.placeholder = "Ajouter une description...";
    leftPanel.appendChild(textarea);

    // priorité
    let feedbackPriority = null;
    if (userIsInProject === true) {
      feedbackPriority = document.createElement("select");
      feedbackPriority.id = "bugreveal_capture-feedbackPriority";
      let option = document.createElement("option");
      option.value = "";
      option.text = "Choisir la priorité";
      feedbackPriority.appendChild(option);
      if (priority && priority.length > 0) {
        priority.forEach((e) => {
          let option = document.createElement("option");
          option.value = e._id;
          option.text = e.libelle;
          feedbackPriority.appendChild(option);
        });
      }
      leftPanel.appendChild(feedbackPriority);
    }

    // priorité
    let feedbackAssignTo = null;
    if (userIsInProject === true) {
      feedbackAssignTo = document.createElement("select");
      feedbackAssignTo.id = "bugreveal_capture-feedbackAssignTo";
      let option = document.createElement("option");
      option.value = "";
      option.text = "Assigné à ";
      feedbackAssignTo.appendChild(option);
      if (project_members && project_members.length > 0) {
        project_members.forEach((e) => {
          let option = document.createElement("option");
          option.value = e._id;
          option.text = e.lastname + " " + e.firstname;
          feedbackAssignTo.appendChild(option);
        });
      }
      leftPanel.appendChild(feedbackAssignTo);
    }

    // attachments
    let attachment = document.createElement("input");
    attachment.id = "bugreveal_capture-attachment";
    attachment.type = "file";
    attachment.accept = `.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,
    .mp4,.mov,.avi,.mkv`;

    attachment.addEventListener("change", (e) => {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/mov",
        "video/avi",
        "video/mkv",
      ];

      for (let file of e.target.files) {
        if (!allowedTypes.includes(file.type)) {
          alert(`Type de fichier non autorisé : ${file.name}`);
          e.target.value = "";
          break;
        }

        if (file.size > MAX_SIZE_BYTES) {
          alert(
            `Fichier trop volumineux : ${file.name} (${(
              file.size /
              1024 /
              1024
            ).toFixed(2)} MB)`
          );
          e.target.value = "";
          break;
        }
      }
    });

    attachment.multiple = true;
    leftPanel.appendChild(attachment);

    // Champs intégration

    let integration_lists = ["trello"];
    let integration = null;
    let boardList = null;
    let integrationSelect = null;
    if (userIsInProject === true) {
      if (integration_lists) {
        integration = document.createElement("select");
        integration.id = "bugreveal_capture-integration";

        let option = document.createElement("option");
        option.value = "";
        option.text = "Intégration ";
        integration.appendChild(option);

        integration_lists.forEach((e) => {
          let option = document.createElement("option");
          option.value = e;
          option.text = e.toUpperCase();
          integration.appendChild(option);
        });

        leftPanel.appendChild(integration);

        let boardListPanel = document.createElement("div");
        boardListPanel.id = "bugreveal_capture-boardListPanel";
        leftPanel.appendChild(boardListPanel);

        integration.onchange = async (e) => {
          integrationSelect = e.target.value;
          if (integrationSelect && integrationSelect !== undefined) {
            await createBoardListSelect(integrationSelect);
          } else {
            boardListPanel.innerHTML = "";
          }
        };
      }
    }

    // Bouton envoyer
    let sendBtn = document.createElement("button");
    sendBtn.id = "bugreveal_capture-send";
    sendBtn.innerText = "📤 Envoyer";
    sendBtn.onclick = () => {
      if (title.value.trim().length === 0 || title.value.trim().length < 3) {
        notify("info", "Le titre doit faire au moins 3 caractères");
        return;
      }
      if (feedbackType.value == "") {
        notify("info", "Type obligatoire");
        return;
      }
      if (userIsInProject === true) {
        if (feedbackPriority.value == "") {
          notify("info", "Priorité obligatoire");
          return;
        }
      }

      let attachments = attachment.files;
      let canva_file = null;
      let recordData = null;
      if (type === "img") {
        canva_file = canvas.toDataURL("image/png");
      } else if (type === "video") {
        recordData = videoBlob;
      }

      const typeSelect = document.getElementById(
        "bugreveal_capture-feedbackType"
      );
      const prioritySelect = document.getElementById(
        "bugreveal_capture-feedbackPriority"
      );

      const integrationSelect = document.getElementById(
        "bugreveal_capture-integration"
      );

      const assignToSelect = document.getElementById(
        "bugreveal_capture-feedbackAssignTo"
      );

      const boardListSelect = document.getElementById(
        "bugreveal_capture-boardList"
      );

      let data = {
        title: title.value,
        description: textarea.value,
        type: typeSelect.value,
      };
      if (prioritySelect && prioritySelect.value) {
        data.priority = prioritySelect.value;
      }
      if (assignToSelect && assignToSelect.value) {
        data.assignTo = assignToSelect.value;
      }
      if (integrationSelect && integrationSelect.value) {
        data.integration = integrationSelect.value;
      }
      if (boardListSelect && boardListSelect.value) {
        data.list_id = boardListSelect.value;
      }
      if (type === "img") {
        sendCapture("canvas", canva_file, attachments, data);
      } else if (type === "video") {
        sendCapture("video", recordData, attachments, data);
      }
    };
    leftPanel.appendChild(sendBtn);
    // saveHistory();

    // Bouton connexion
    if (bugRevealToken == null) {
      // let connexionBtn = document.createElement("button");
      // connexionBtn.id = "bugreveal_capture_connexion";
      // connexionBtn.innerText = "Se connecter";
      // let redirectURL = `http://localhost:5176/signin`;
      // let urlParent = encodeURIComponent(window.location.href);
      // redirectURL = `${redirectURL}?from=${urlParent}`;
      // connexionBtn.onclick = () => {
      //   openLoginPopup(redirectURL);
      // };
      // leftPanel.appendChild(connexionBtn);
      connexionBtn();
      windowListenEvent();
    }
  };

  const windowListenEvent = () => {
    window.addEventListener("message", (event) => {
      let origin = new URL(redirectURL).origin;

      if (event.origin !== origin) return; // sécurité

      const { token } = event.data;
      console.log("Token reçu depuis le popup :", token);

      localStorage.setItem("bugreveal_record_app_user", JSON.stringify(token));
      window.location.reload();
    });
  };

  async function createBoardListSelect(integrationSelect) {
    let boardList = null;
    let boardListPanel = document.getElementById(
      "bugreveal_capture-boardListPanel"
    );

    integrationBoardLists = await getBoardLists(integrationSelect);

    let integrationSelectUppercase = integrationSelect.toUpperCase();

    let refreshBoardListBtn = document.createElement("button");
    refreshBoardListBtn.id = "bugreveal_capture-refreshBoardList";
    refreshBoardListBtn.innerHTML = `Rafraichir`;

    refreshBoardListBtn.onclick = async () => {
      if (integrationSelect && integrationSelect !== undefined) {
        await createBoardListSelect(integrationSelect);
        return;
      }
    };

    if (integrationBoardLists.length > 0) {
      boardList = document.createElement("select");
      boardList.id = "bugreveal_capture-boardList";
      let option = document.createElement("option");
      option.value = "";
      option.text = `Listes ${integrationSelectUppercase}`;
      boardList.appendChild(option);

      integrationBoardLists.forEach((e) => {
        let option = document.createElement("option");
        option.value = e.id;
        option.text = e.name;
        boardList.appendChild(option);
      });
      boardListPanel.innerHTML = "";
      boardListPanel.appendChild(boardList);
      boardListPanel.appendChild(refreshBoardListBtn);
    } else {
      boardListPanel.innerHTML = "";
      let errorDIV = createElement("p");
      errorDIV.style.color = "red";
      errorDIV.innerText = "Aucune liste active trouvée";
      boardListPanel.appendChild(errorDIV);
    }
  }

  function openLoginPopup(url, width = 600, height = 600) {
    // Calculer la position centrée
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      url,
      "loginPopup",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    return popup;
  }

  async function saveFile() {
    try {
      if (canvas) {
        let canva_url = canvas.toDataURL("image/png");
        let response = await fetch(canva_url);
        const blob = await response.blob();
        saveAs(blob, `video-${Date.now()}`);
      } else if (videoBlob) {
        saveAs(videoBlob, `video-${Date.now()}`);
      }
    } catch (err) {
      console.error("Téléchargement fichier feedback", err);
    }
  }

  // --- Envoi ---
  async function sendCapture(type, recordData, attachments, data) {
    try {
      notify("info", "Envoi du feedback en cours...");
      disableBtn(true);
      let errorZone = document.getElementById("bugreveal_errorZone");
      if (leftPanel.contains(errorZone)) {
        leftPanel.removeChild(errorZone);
      }
      const response = await sendFeedback(type, recordData, attachments, data);
      if (response[0] === "success") {
        disableBtn(false);
        preview.innerHTML = "";
        leftPanel.innerHTML = "";
        leftPanel.style.display = "none";
        panel.style.width = "auto";

        notify("success", "Feedback envoyé avec succès !");
      } else if (response[0] === "error") {
        disableBtn(false);
        let errors = document.createElement("pre");
        errors.id = "bugreveal_errorZone";
        errors.appendChild(document.createTextNode(response[1].errors));
        leftPanel.appendChild(errors);
        notify("error", "Erreur lors de l'envoi du feedback!");
      }
    } catch (error) {
      disableBtn(false);
      console.error("Erreur lors de l'envoi du feedback :", error);
      notify("error", "Erreur lors de l'envoi du feedback!");
    }
  }

  const disableBtn = (status) => {
    let btn = document.getElementById("bugreveal_capture-send");
    if (status === false) {
      btn.removeAttribute("disabled");
    } else {
      btn.setAttribute("disabled", status);
    }
    btn.style.cursor = status ? "not-allowed" : "pointer";
    btn.style.opacity = status ? 0.5 : 1;
  };

  function notify(type, message, duration = 3000) {
    const alert = document.createElement("div");
    alert.className = `bugreveal_custom-notification bugreveal_custom-notification-${type}`;
    alert.innerText = message;
    document.body.appendChild(alert);

    setTimeout(() => {
      if (document.body.contains(alert)) {
        document.body.removeChild(alert);
      }
    }, duration);
  }
}
initializeRecorder();
