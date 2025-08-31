import service from "./service.js";
import html2canvas from "html2canvas";
import RecordRTC from "recordrtc";

const { getFeedbackParams, sendFeedback } = service();
(async function () {
  let types = [];
  let priority = [];
  let recorderVideo = null;
  let videoBlob = null;
  let micStream = null;
  let screenStream = null;
  try {
    const data = await getFeedbackParams();
    if (data) {
      types = data.types;
      priority = data.priority;
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
  panel.id = "replaymap_capture-panel";
  const buttonzone = document.createElement("div");

  let history = [];

  buttonzone.id = "replaymap_button-zone";
  panel.appendChild(buttonzone);
  buttonzone.innerHTML = `
    <button id="replaymap_btnScreen" title="Capturer l'écran">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" id="Layer_1" width="800px" height="800px" viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve">
        <g>
            <path fill="#231F20" d="M32,48c6.627,0,12-5.373,12-12s-5.373-12-12-12s-12,5.373-12,12S25.373,48,32,48z M32,28   c4.418,0,8,3.582,8,8c0,0.553-0.447,1-1,1s-1-0.447-1-1c0-3.313-2.687-6-6-6c-0.553,0-1-0.447-1-1S31.447,28,32,28z"/>
            <path fill="#231F20" d="M32,52c8.837,0,16-7.162,16-16c0-8.837-7.163-16-16-16s-16,7.163-16,16C16,44.838,23.163,52,32,52z M32,22   c7.732,0,14,6.268,14,14s-6.268,14-14,14s-14-6.268-14-14S24.268,22,32,22z"/>
            <circle fill="#231F20" cx="55" cy="21" r="1"/>
            <path fill="#231F20" d="M60,12c0,0-7,0-8,0s-1.582,0.004-2.793-1.207s-5.538-5.538-5.538-5.538C43.481,5.067,42.33,4,41,4   S24.453,4,23,4s-2.498,1.084-2.686,1.271c0,0-4.326,4.326-5.521,5.521S13.018,12,12,12V9c0-0.553-0.447-1-1-1H5   C4.447,8,4,8.447,4,9v3c-2.211,0-4,1.789-4,4v12h15.893C18.84,22.078,24.937,18,32,18s13.16,4.078,16.107,10H64V16   C64,13.789,62.211,12,60,12z M10,12c-1.24,0-2.782,0-4,0v-2h4V12z M55,24c-1.657,0-3-1.344-3-3s1.343-3,3-3s3,1.344,3,3   S56.657,24,55,24z"/>
            <path fill="#231F20" d="M50,36c0,9.941-8.059,18-18,18s-18-8.059-18-18c0-2.107,0.381-4.121,1.046-6H0v26c0,2.211,1.789,4,4,4h56   c2.211,0,4-1.789,4-4V30H48.954C49.619,31.879,50,33.893,50,36z"/>
        </g>
    </svg>
</button>
    <button id="replaymap_btnCropScreen" title="Capturer une zone">
        <svg class="btnElement" xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 48 48" fill="none">
            <path d="M16 6H8C6.89543 6 6 6.89543 6 8V16" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 42H8C6.89543 42 6 41.1046 6 40V32" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M32 42H40C41.1046 42 42 41.1046 42 40V32" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M32 6H40C41.1046 6 42 6.89543 42 8V16" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="14" y="14" width="20" height="20" rx="2" fill="#2F88FF" stroke="#000000" stroke-width="4"/>
        </svg>
    </button>
     <button id="replaymap_btnRecordVideoAudio" title="Enregistrer l'écran">
        <svg viewBox="0 0 1024 1024" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M759.3 352h84.3c15.5 0 28.1 9.2 28.1 20.5v277.3c0 11.3-12.6 20.5-28.1 20.5h-70.3" fill="#8CAAFF"></path><path d="M843.5 695h-70.2v-49.5h70.2c1.4 0 2.5-0.2 3.3-0.4v-268c-0.9-0.2-2-0.4-3.3-0.4h-84.2v-49.5h84.3c29.6 0 52.8 19.9 52.8 45.3v277.3c0 25.4-23.3 45.2-52.9 45.2z" fill="#333333"></path><path d="M203.5 258h531c13.7 0 24.7 11.1 24.7 24.7v457.8c0 13.7-11.1 24.7-24.7 24.7h-531c-13.7 0-24.7-11.1-24.7-24.7V282.7c-0.1-13.6 11-24.7 24.7-24.7z" fill="#FFFFFF"></path><path d="M734.5 790h-531c-27.3 0-49.5-22.2-49.5-49.5V282.7c0-27.3 22.2-49.5 49.5-49.5h531c27.3 0 49.5 22.2 49.5 49.5v457.8c0 27.3-22.2 49.5-49.5 49.5z m-531-507.3v457.8h531V282.7h-531z" fill="#333333"></path><path d="M595.8 521.2L407 656c-5.6 4-13.3 2.7-17.3-2.9-1.5-2.1-2.3-4.6-2.3-7.2V376.3c0-6.8 5.5-12.4 12.4-12.4 2.6 0 5.1 0.8 7.2 2.3L595.8 501c5.6 4 6.9 11.7 2.9 17.3-0.8 1.1-1.8 2.1-2.9 2.9z" fill="#8CAAFF"></path><path d="M399.9 683c-2.1 0-4.1-0.2-6.2-0.5-9.8-1.6-18.4-7-24.1-15.1-4.5-6.3-6.9-13.8-6.9-21.6V376.3c0-20.5 16.6-37.1 37.1-37.1 7.8 0 15.2 2.4 21.6 6.9l188.8 134.8c8.1 5.8 13.4 14.3 15 24.1 1.6 9.8-0.6 19.6-6.4 27.7-2.4 3.4-5.3 6.3-8.7 8.7L421.3 676.2c-6.3 4.5-13.8 6.8-21.4 6.8z m12.2-282.6v221.5l155.1-110.7-155.1-110.8zM581.4 501s0 0.1 0 0z" fill="#333333"></path></g></svg>
    </button>
  `;

  let recordPanel = document.createElement("div");
  recordPanel.id = "replaymap_recordPanel";

  recordPanel.innerHTML = `
    <button id="replaymap_btnRecordPause">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM8.07612 8.61732C8 8.80109 8 9.03406 8 9.5V14.5C8 14.9659 8 15.1989 8.07612 15.3827C8.17761 15.6277 8.37229 15.8224 8.61732 15.9239C8.80109 16 9.03406 16 9.5 16C9.96594 16 10.1989 16 10.3827 15.9239C10.6277 15.8224 10.8224 15.6277 10.9239 15.3827C11 15.1989 11 14.9659 11 14.5V9.5C11 9.03406 11 8.80109 10.9239 8.61732C10.8224 8.37229 10.6277 8.17761 10.3827 8.07612C10.1989 8 9.96594 8 9.5 8C9.03406 8 8.80109 8 8.61732 8.07612C8.37229 8.17761 8.17761 8.37229 8.07612 8.61732ZM13.0761 8.61732C13 8.80109 13 9.03406 13 9.5V14.5C13 14.9659 13 15.1989 13.0761 15.3827C13.1776 15.6277 13.3723 15.8224 13.6173 15.9239C13.8011 16 14.0341 16 14.5 16C14.9659 16 15.1989 16 15.3827 15.9239C15.6277 15.8224 15.8224 15.6277 15.9239 15.3827C16 15.1989 16 14.9659 16 14.5V9.5C16 9.03406 16 8.80109 15.9239 8.61732C15.8224 8.37229 15.6277 8.17761 15.3827 8.07612C15.1989 8 14.9659 8 14.5 8C14.0341 8 13.8011 8 13.6173 8.07612C13.3723 8.17761 13.1776 8.37229 13.0761 8.61732Z" fill="#465FFF"></path> </g></svg>
</button>
 <button id="replaymap_btnRecordResume">
    <svg fill="#465FFF" viewBox="-2 0 32 32" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" stroke="#465FFF"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M26.530,31.994 C26.222,31.994 25.915,31.903 25.619,31.722 L2.000,17.205 L2.000,31.000 C2.000,31.553 1.552,32.000 1.000,32.000 C0.448,32.000 -0.000,31.553 -0.000,31.000 L-0.000,1.006 C-0.000,0.453 0.448,0.006 1.000,0.006 C1.552,0.006 2.000,0.453 2.000,1.006 L2.000,13.855 L25.628,0.248 C25.917,0.083 26.211,-0.000 26.507,-0.000 C27.372,-0.000 28.000,0.689 28.000,1.639 L28.000,30.367 C28.000,31.435 27.260,31.994 26.530,31.994 ZM3.097,15.531 L26.000,29.608 L26.000,2.341 L3.097,15.531 Z"></path> </g></svg>
</button>
    <button id="replaymap_btnRecordStop">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#465FFF"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM8.58579 8.58579C8 9.17157 8 10.1144 8 12C8 13.8856 8 14.8284 8.58579 15.4142C9.17157 16 10.1144 16 12 16C13.8856 16 14.8284 16 15.4142 15.4142C16 14.8284 16 13.8856 16 12C16 10.1144 16 9.17157 15.4142 8.58579C14.8284 8 13.8856 8 12 8C10.1144 8 9.17157 8 8.58579 8.58579Z" fill="#465FFF"></path> </g></svg>
    </button>
  `;

  document.body.appendChild(recordPanel);
  document.body.appendChild(panel);

  // --- Style du panel ---
  const style = document.createElement("style");
  style.innerHTML = `

  #replay_map_record_video {
  height: 100%;
  width: 100%;
  }

  #replaymap_recordPanel {
  display: none;
  position: fixed;
  bottom: 10px;
  width: 15%;
  margin: auto;
  justify-content: space-around;
  background-color: white;
  padding: 10px 30px;
   border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 15px 20px rgba(0,0,0,0.2);
  }
  #replaymap_btnRecordResume {
  display:none;
  }

    #replaymap_recordPanel button {
      padding: 3px;
      width: auto;
      cursor: pointer;
      border: none;
      border-radius: 6px;
      color: white;      
    }

    #replaymap_recordPanel button svg {
    width: 37px;
    height: 37px;
    }

    #replaymap_recordPanel button:hover {
  transform: translateY(-1px);
}


    #replaymap_capture-panel {
      display: flex;
      justify-content: start;
          align-self: anchor-center;
      position: fixed;
      top: 10px;
      right: 0px;
      background: #f3f3f3;
      max-width: 100%;
      max-height: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 15px 20px rgba(0,0,0,0.2);
      z-index: 9999999 !important;
    }

    #replaymap_canvas-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgb(0 0 0 / 80%);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

#replaymap_#canvas-loader .replaymap_spinner {
  border: 6px solid #ccc;
  border-top: 6px solid #007bff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
      position: absolute;
    top: 45%;
    right: 45%;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


     #replaymap_editmodezone {
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 12px 20px;
  margin-bottom: 10px;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 0 0 12px 12px;
  transition: all 0.3s ease;
}
  


    #replaymap_editmodezone button {
  background-color: #465FFF; /* Bleu principal */
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

replaymap_editmodezone button:hover {
  background-color: #2e4de0;
  transform: translateY(-1px);
}

#replaymap_editmodezone button:active {
  transform: scale(0.98);
}


    #replaymap_button-zone {
    justify-content: center;
    flex-flow: column;
    display: flex;
    padding: 7px;
    }
    
    #replaymap_capture-panel button {
      display: block;
      padding: 3px;
      width: auto;
      cursor: pointer;
      border: none;
      border-radius: 6px;
      color: white;      
    }

    #replaymap_capture-panel button svg {
    width: 30px;
    height: 30px;
    }

    #replaymap_capture-preview {
      margin-top: 10px;
      margin-bottom: 20px;
      overflow: auto;
      position: relative;
      width: 75%;
      
    }
    #replaymap_capture-preview canvas {
      border: 1px solid #ccc;
      cursor: crosshair;
      display: block;
      width: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      box-shadow: 0 15px 20px rgba(0,0,0,0.2);
    }
    #replaymap_capture-desc, #replaymap_capture-title, #replaymap_capture-feedbackType, #replaymap_capture-feedbackPriority, #replaymap_capture-attachment {
      margin-top: 10px;
      width: 100%;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #ddd;
      display: block;
    }
   
      #replaymap_errorZone {
      padding: 10px;
      background: #FF4646;
      color: white;
      overflow-x: auto;
      }


.replaymap_left-panel {
  width: 25%;
  display: none;
  flex-direction: column;
  gap: 15px;
  margin: 0 15px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 30px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  max-height: 100%;
  transition: all 0.3s ease;
}

/* 🧾 Inputs, selects, textarea */
.replaymap_left-panel input,
.replaymap_left-panel select,
.replaymap_left-panel textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
  font-size: 14px;
  color: #333;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.replaymap_left-panel input:focus,
.replaymap_left-panel select:focus,
.replaymap_left-panel textarea:focus {
  border-color: #465FFF;
  box-shadow: 0 0 0 3px rgba(70, 95, 255, 0.2);
  outline: none;
}

/* 🧵 Textarea spécifique */
.replaymap_left-panel textarea {
  resize: vertical;
  min-height: 80px;
}

 #replaymap_capture-send {
      margin-top: 10px;
      background: #465FFF;
      width: 65% !important;
      margin: 0 auto;
       border: none;
  padding: 8px 0px !important;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 0.3s ease, transform 0.2s ease;
    }


#replaymap_capture-send:hover {
  background-color: #2e4de0;
  transform: translateY(-1px);
}

/* 🏷️ Labels (si présents) */
.replaymap_left-panel label {
  font-weight: 500;
  margin-bottom: 6px;
  display: block;
  color: #444;
}

.replaymap_selection-box {
  position: absolute;
  border: 2px dashed red;
  background: rgba(255, 0, 0, 0.2);
}

.replaymap_writezone {
  position: absolute;
  width: 120px;
  padding: 6px 10px;
  font-size: 16px;
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #333;
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 999999;
  transition: all 0.3s ease;
}
.replaymap_writezone:focus {
  border-color: #465FFF;
  box-shadow: 0 0 0 3px rgba(70, 95, 255, 0.2);
  outline: none;
}


.replaymap_custom-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
  z-index: 999999999;
  font-family: Arial, sans-serif;
  font-size: 16px;
}

/* Type-specific styles */
.replaymap_custom-notification-error {
  background: #FF4646;
  color: white;
}

.replaymap_custom-notification-success {
  background: #46FF7D;
  color: black;
}

.replaymap_custom-notification-info {
  background: #46C8FF;
  color: black;
}


  `;
  document.head.appendChild(style);

  // Loader à afficher pendant que le canvas se charge
  let canvasLoader = document.createElement("div");
  canvasLoader.id = "replaymap_canvas-loader";
  canvasLoader.style.display = "none";
  let spinner = document.createElement("div");
  spinner.className = "replaymap_spinner";
  spinner.innerHTML = `<svg class="loader" viewBox="0 0 50 50" width="50" height="50">
  <circle
    cx="25"
    cy="25"
    r="20"
    fill="none"
    stroke="#465FFF"
    stroke-width="4"
    stroke-linecap="round"
    stroke-dasharray="100"
    stroke-dashoffset="60"
  >
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0 25 25"
      to="360 25 25"
      dur="1s"
      repeatCount="indefinite"
    />
  </circle>
</svg>
`;
  canvasLoader.appendChild(spinner);
  document.body.appendChild(canvasLoader);

  // --- Zone de prévisualisation ---
  const preview = document.createElement("div");
  preview.id = "replaymap_capture-preview";
  panel.appendChild(preview);

  //left panel
  const leftPanel = document.createElement("div");
  leftPanel.className = "replaymap_left-panel";

  panel.appendChild(leftPanel);

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
      selectionBox.className = "replaymap_selection-box";
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

    panel.style.width = "95%";
    panel.style.margin = "auto";
    preview.style.boxShadow = "0 20px 20px rgba(0,0,0,0.1)";
    preview.appendChild(canvas);

    // Description

    // type
    let feedbackType = document.createElement("select");
    feedbackType.id = "replaymap_capture-feedbackType";
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
    title.id = "replaymap_capture-title";
    title.type = "text";
    title.placeholder = "Ajouter un titre";
    leftPanel.appendChild(title);

    //description
    let textarea = document.createElement("textarea");
    textarea.id = "replaymap_capture-desc";
    textarea.placeholder = "Ajouter une description...";
    leftPanel.appendChild(textarea);

    // priorité
    let feedbackPriority = document.createElement("select");
    feedbackPriority.id = "replaymap_capture-feedbackPriority";
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

    // attachments
    let attachment = document.createElement("input");
    attachment.id = "replaymap_capture-attachment";
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

    // Bouton envoyer
    let sendBtn = document.createElement("button");
    sendBtn.id = "replaymap_capture-send";
    sendBtn.innerText = "📤 Envoyer";
    sendBtn.onclick = () => {
      if (title.value.trim().length === 0 || title.value.trim().length < 3) {
        notify("info", "Le titre doit faire au moins 3 caractères");
        return;
      }
      if (feedbackPriority.value == "" || feedbackType.value == "") {
        notify("info", "Priorité ou Type obligatoire");
        return;
      }
      let attachments = attachment.files;
      let canva_file = canvas.toDataURL("image/png");

      const typeSelect = document.getElementById(
        "replaymap_capture-feedbackType"
      );
      const prioritySelect = document.getElementById(
        "replaymap_capture-feedbackPriority"
      );

      let data = {
        title: title.value,
        description: textarea.value,
        type: typeSelect.value,
        priority: prioritySelect.value,
      };
      sendCapture("canvas", canva_file, attachments, data);
    };
    leftPanel.appendChild(sendBtn);
    // saveHistory();
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
    const blobUrl = URL.createObjectURL(videoBlob);
    hideRecordPanel();
    recorderVideo.destroy();
    screenStream.getTracks().forEach((track) => track.stop());
    micStream.getTracks().forEach((track) => track.stop());
    showVideoRecord(blobUrl);
  }

  function showVideoRecord(blobUrl) {
    zoneSelectionActive = false;

    showPanel();
    preview.innerHTML = "";
    leftPanel.innerHTML = "";
    leftPanel.style.display = "flex";

    let video = document.createElement("video");
    video.id = "replay_map_record_video";
    video.src = blobUrl;
    video.autoplay = true;
    video.controls = true;
    video.muted = false;
    panel.style.width = "95%";
    panel.style.margin = "auto";
    preview.style.boxShadow = "0 20px 20px rgba(0,0,0,0.1)";
    preview.appendChild(video);

    // type
    let feedbackType = document.createElement("select");
    feedbackType.id = "replaymap_capture-feedbackType";
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
    title.id = "replaymap_capture-title";
    title.type = "text";
    title.placeholder = "Ajouter un titre";
    leftPanel.appendChild(title);

    //description
    let textarea = document.createElement("textarea");
    textarea.id = "replaymap_capture-desc";
    textarea.placeholder = "Ajouter une description...";
    leftPanel.appendChild(textarea);

    // priorité
    let feedbackPriority = document.createElement("select");
    feedbackPriority.id = "replaymap_capture-feedbackPriority";
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

    // attachments
    let attachment = document.createElement("input");
    attachment.id = "replaymap_capture-attachment";
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
      }
    });

    attachment.multiple = true;
    leftPanel.appendChild(attachment);

    // Bouton envoyer
    let sendBtn = document.createElement("button");
    sendBtn.id = "replaymap_capture-send";
    sendBtn.innerText = "📤 Envoyer";
    sendBtn.onclick = () => {
      if (title.value.trim().length === 0 || title.value.trim().length < 3) {
        notify("info", "Le titre doit faire au moins 3 caractères");
        return;
      }
      if (feedbackPriority.value == "" || feedbackType.value == "") {
        notify("info", "Priorité ou Type obligatoire");
        return;
      }
      let attachments = attachment.files;

      let recordData = videoBlob;

      const typeSelect = document.getElementById(
        "replaymap_capture-feedbackType"
      );
      const prioritySelect = document.getElementById(
        "replaymap_capture-feedbackPriority"
      );

      let data = {
        title: title.value,
        description: textarea.value,
        type: typeSelect.value,
        priority: prioritySelect.value,
      };
      sendCapture("video", recordData, attachments, data);
    };
    leftPanel.appendChild(sendBtn);
    // saveHistory();
  }

  async function getRecordState() {
    return await recorderVideo.getState();
  }

  function addEditImageBtn() {
    const editmodezone = document.createElement("div");
    editmodezone.id = "replaymap_editmodezone";
    // 🔘 Boutons pour changer de mode
    const btnDraw = document.createElement("button");
    btnDraw.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="#ffffff" width="800px" height="800px" viewBox="0 0 1920 1920">
    <path d="M517.257 1127.343c72.733 0 148.871 36.586 221.274 107.45 87.455 110.418 114.922 204.135 81.632 278.296-72.733 162.274-412.664 234.897-618.666 259.178 34.609-82.62 75.15-216.88 75.15-394.645 0-97.123 66.47-195.455 157.88-233.689 26.698-11.097 54.494-16.59 82.73-16.59Zm229.404-167.109c54.055 28.895 106.462 65.371 155.133 113.494l13.844 15.6c28.016 35.378 50.649 69.987 70.425 104.155-29.554 26.259-59.878 52.737-90.75 79.545-18.898-35.488-43.069-71.964-72.843-109.319l-4.285-4.834c-48.342-47.683-99.43-83.39-151.727-107.011 26.368-30.653 53.066-61.196 80.203-91.63Zm1046.49-803.133c7.801 7.8 18.129 21.754 16.92 52.187-6.043 155.683-284.338 494.405-740.509 909.266-19.995-32.302-41.969-64.822-67.788-97.453l-22.523-25.27c-49.22-48.671-101.408-88.883-156.012-121.074 350.588-385.855 728.203-734.356 910.254-741.828 30.983-.109 44.497 9.01 59.658 24.172Zm126.678 56.472c2.087-53.615-14.832-99.98-56.142-141.29-34.28-34.279-81.962-51.198-134.588-49.11-304.554 12.414-912.232 683.377-1179.54 996.17-53.616-5.383-106.682 2.088-157.441 23.402-132.61 55.263-225.339 193.038-225.339 334.877 0 268.517-103.935 425.737-104.923 427.275L0 1896.747l110.307-6.153c69.217-3.735 681.29-45.375 810.165-332.46 24.39-54.604 29.225-113.163 15.93-175.239 374.32-321.802 972.11-879.71 983.427-1169.322" fill-rule="evenodd"/>
</svg>`;
    btnDraw.onclick = () => {
      let writezones = document.getElementsByClassName("replaymap_writezone");

      // comme c'est une collection vivante, on doit le transformer en tableau
      [...writezones].forEach((zone) => {
        preview.removeChild(zone);
      });
      mode = "draw";
    };
    editmodezone.appendChild(btnDraw);

    const btnText = document.createElement("button");
    btnText.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none">
<path d="M1 22C1 21.4477 1.44772 21 2 21H22C22.5523 21 23 21.4477 23 22C23 22.5523 22.5523 23 22 23H2C1.44772 23 1 22.5523 1 22Z" fill="#ffffff"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M18.3056 1.87868C17.1341 0.707107 15.2346 0.707107 14.063 1.87868L3.38904 12.5526C2.9856 12.9561 2.70557 13.4662 2.5818 14.0232L2.04903 16.4206C1.73147 17.8496 3.00627 19.1244 4.43526 18.8069L6.83272 18.2741C7.38969 18.1503 7.89981 17.8703 8.30325 17.4669L18.9772 6.79289C20.1488 5.62132 20.1488 3.72183 18.9772 2.55025L18.3056 1.87868ZM15.4772 3.29289C15.8677 2.90237 16.5009 2.90237 16.8914 3.29289L17.563 3.96447C17.9535 4.35499 17.9535 4.98816 17.563 5.37868L15.6414 7.30026L13.5556 5.21448L15.4772 3.29289ZM12.1414 6.62869L4.80325 13.9669C4.66877 14.1013 4.57543 14.2714 4.53417 14.457L4.0014 16.8545L6.39886 16.3217C6.58452 16.2805 6.75456 16.1871 6.88904 16.0526L14.2272 8.71448L12.1414 6.62869Z" fill="#ffffff"/>
</svg>`;
    btnText.onclick = () => (mode = "text");
    editmodezone.appendChild(btnText);

    // Bouton pour activer le mode flèche
    const arrowBtn = document.createElement("button");
    arrowBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 16 16" fill="none">
<path d="M14 2H5.50003L4.00003 3.5L6.83581 6.33579L0.585815 12.5858L3.41424 15.4142L9.66424 9.16421L12.5 12L14 10.5L14 2Z" fill="#ffffff"/>
</svg>`;
    arrowBtn.onclick = () => {
      mode = "arrow";
    };
    editmodezone.appendChild(arrowBtn);

    const undoBtn = document.createElement("button");
    undoBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none">
<path d="M4 7H15C17.7614 7 20 9.23857 20 12C20 14.7614 17.7614 17 15 17M4 7L7 4M4 7L7 10M8.00001 17H11" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
    undoBtn.onclick = () => {
      undo();
    };
    editmodezone.appendChild(undoBtn);

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
    input.className = "replaymap_writezone";

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
    if (parentButton && parentButton.id === "replaymap_btnScreen") {
      preview.innerHTML = "";
      captureScreen();
    }
    if (parentButton && parentButton.id === "replaymap_btnCropScreen") {
      preview.innerHTML = "";
      enableRegionSelection();
    }
    if (parentButton && parentButton.id === "replaymap_btnRecordVideoAudio") {
      preview.innerHTML = "";
      startRecord();
    }
    if (parentButton && parentButton.id === "replaymap_btnRecordPause") {
      let state = await getRecordState();
      if (state === "recording") {
        pauseRecord();
        parentButton.style.display = "none";
        document.getElementById("replaymap_btnRecordResume").style.display =
          "block";
      }
    }

    if (parentButton && parentButton.id === "replaymap_btnRecordResume") {
      let state = await getRecordState();
      if (state === "paused") {
        resumeRecord();
        parentButton.style.display = "none";
        document.getElementById("replaymap_btnRecordPause").style.display =
          "block";
      }
    }

    if (parentButton && parentButton.id === "replaymap_btnRecordStop") {
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

  function undo() {
    if (history.length > 1) {
      history.pop(); // retire dernière action
      const last = history[history.length - 1];
      ctx.putImageData(last.imageData, 0, 0);
    }
  }

  // --- Envoi ---
  async function sendCapture(type, recordData, attachments, data) {
    try {
      notify("info", "Envoi du feedback en cours...");
      disableBtn(true);
      let errorZone = document.getElementById("replaymap_errorZone");
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
        errors.id = "replaymap_errorZone";
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
    let btn = document.getElementById("replaymap_capture-send");
    if (status === false) {
      btn.removeAttribute("disabled");
    } else {
      btn.setAttribute("disabled", status);
    }
    btn.style.cursor = status ? "not-allowed" : "pointer";
    btn.style.opacity = status ? 0.5 : 1;
  };

  function notify(type, message) {
    const alert = document.createElement("div");
    alert.className = `replaymap_custom-notification replaymap_custom-notification-${type}`;
    alert.innerText = message;
    document.body.appendChild(alert);

    setTimeout(() => {
      if (document.body.contains(alert)) {
        document.body.removeChild(alert);
      }
    }, 3000);
  }
})();
