import { head, set } from "lodash";
import service from "./service.js";

const { getFeedbackParams, sendFeedback } = service();
(async function () {
  let types = [];
  let priority = [];
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
  let mode = "draw"; // "draw" ou "text"
  const panel = document.createElement("div");
  panel.id = "capture-panel";
  const buttonzone = document.createElement("div");

  let history = [];

  buttonzone.id = "button-zone";
  panel.appendChild(buttonzone);
  buttonzone.innerHTML = `
    <button id="btnScreen">
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
    <button id="btnElement">
        <svg class="btnElement" xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 48 48" fill="none">
            <path d="M16 6H8C6.89543 6 6 6.89543 6 8V16" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 42H8C6.89543 42 6 41.1046 6 40V32" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M32 42H40C41.1046 42 42 41.1046 42 40V32" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M32 6H40C41.1046 6 42 6.89543 42 8V16" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="14" y="14" width="20" height="20" rx="2" fill="#2F88FF" stroke="#000000" stroke-width="4"/>
        </svg>
    </button>
  `;
  document.body.appendChild(panel);

  // --- Style du panel ---
  const style = document.createElement("style");
  style.innerHTML = `
    #capture-panel {
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

    #canvas-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.8);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

#canvas-loader .spinner {
  border: 6px solid #ccc;
  border-top: 6px solid #007bff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


      #editmodezone{
       justify-content: center;
    display: flex;
    margin-bottom: 10px;
     position: sticky;
  top: 0px; /* distance du haut de la fenêtre */
  z-index: 1000;
  padding: 8px;
  display: flex;
        background: #f3f3f3;
      }



    #editmodezone button {
    color: black !important;
    }

    #button-zone {
    justify-content: center;
    flex-flow: column;
    display: flex;
    }

    #capture-panel button {
      display: block;
      padding: 3px;
      width: auto;
      cursor: pointer;
      border: none;
      border-radius: 6px;
      color: white;      
    }

    #capture-panel button svg {
    width: 30px;
    height: 30px;
    }

    #capture-preview {
      margin-top: 10px;
      margin-bottom: 20px;
      overflow: auto;
      position: relative;
      width: 75%;
      
    }
    #capture-preview canvas {
      border: 1px solid #ccc;
      cursor: crosshair;
      display: block;
      width: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      box-shadow: 0 15px 20px rgba(0,0,0,0.2);
    }
    #capture-desc, #capture-title, #capture-feedbackType, #capture-feedbackPriority, #capture-attachment {
      margin-top: 10px;
      width: 100%;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #ddd;
      display: block;
    }
    #capture-send {
      margin-top: 10px;
      background: #465FFF;
      width: 100px !important;
      margin: 0 auto;
    }
      #errorZone {
      padding: 10px;
      background: #FF4646;
      color: white;
      overflow-x: auto;
      }
  `;
  document.head.appendChild(style);

  // Loader à afficher pendant que le canvas se charge
  let canvasLoader = document.createElement("div");
  canvasLoader.id = "canvas-loader";
  canvasLoader.style.display = "none";
  let spinner = document.createElement("div");
  spinner.className = "spinner";
  canvasLoader.appendChild(spinner);
  document.body.appendChild(canvasLoader);

  // --- Zone de prévisualisation ---
  const preview = document.createElement("div");
  preview.id = "capture-preview";
  panel.appendChild(preview);

  //left panel
  const leftPanel = document.createElement("div");
  leftPanel.style.width = "25%";
  leftPanel.style.display = "none";
  leftPanel.style.flexDirection = "column";
  leftPanel.style.gap = "20px";
  leftPanel.style.margin = "0px 15px";
  leftPanel.style.height = "auto";
  leftPanel.style.overflow = "auto";
  leftPanel.style.backgroundColor = "white";
  leftPanel.style.padding = "10px";
  leftPanel.style.borderRadius = "20px";
  leftPanel.style.boxShadow = "0 20px 20px rgba(0,0,0,0.3)";

  panel.appendChild(leftPanel);

  // --- Charger html2canvas dynamiquement ---
  const script = document.createElement("script");
  script.src = "http://localhost:5174/assets/html2canvas.min.js";
  document.head.appendChild(script);

  function hidePanel() {
    panel.style.display = "none";
  }
  function showPanel() {
    panel.style.display = "flex";
  }

  let canvas = null;
  let ctx = null;
  let startX, startY;

  // --- Fonction capture écran ---
  async function captureScreen() {
    hidePanel();

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
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
    console.log("step1");
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
      selectionBox.style.position = "absolute";
      selectionBox.style.border = "2px dashed red";
      selectionBox.style.background = "rgba(255,0,0,0.2)";
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
    feedbackType.id = "capture-feedbackType";
    if (types && types.length > 0) {
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
    title.id = "capture-title";
    title.type = "text";
    title.placeholder = "Ajouter un titre";
    leftPanel.appendChild(title);

    //description
    let textarea = document.createElement("textarea");
    textarea.id = "capture-desc";
    textarea.placeholder = "Ajouter une description...";
    leftPanel.appendChild(textarea);

    // priorité
    let feedbackPriority = document.createElement("select");
    feedbackPriority.id = "capture-feedbackPriority";
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
    attachment.id = "capture-attachment";
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
    sendBtn.id = "capture-send";
    sendBtn.innerText = "📤 Envoyer";
    sendBtn.onclick = () => {
      if (title.value.trim().length === 0 || title.value.trim().length < 3) {
        notify("info", "Le titre doit faire au moins 3 caractères");
        return;
      }
      let attachments = attachment.files;
      let canva_file = canvas.toDataURL("image/png");

      const typeSelect = document.getElementById("capture-feedbackType");
      const prioritySelect = document.getElementById(
        "capture-feedbackPriority"
      );

      let data = {
        title: title.value,
        description: textarea.value,
        type: typeSelect.value,
        priority: prioritySelect.value,
      };
      sendCapture(canva_file, attachments, data);
    };
    leftPanel.appendChild(sendBtn);
    // saveHistory();
  }

  function addEditImageBtn() {
    const editmodezone = document.createElement("div");
    editmodezone.id = "editmodezone";
    // 🔘 Boutons pour changer de mode
    const btnDraw = document.createElement("button");
    btnDraw.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="#000000" width="800px" height="800px" viewBox="0 0 1920 1920">
    <path d="M517.257 1127.343c72.733 0 148.871 36.586 221.274 107.45 87.455 110.418 114.922 204.135 81.632 278.296-72.733 162.274-412.664 234.897-618.666 259.178 34.609-82.62 75.15-216.88 75.15-394.645 0-97.123 66.47-195.455 157.88-233.689 26.698-11.097 54.494-16.59 82.73-16.59Zm229.404-167.109c54.055 28.895 106.462 65.371 155.133 113.494l13.844 15.6c28.016 35.378 50.649 69.987 70.425 104.155-29.554 26.259-59.878 52.737-90.75 79.545-18.898-35.488-43.069-71.964-72.843-109.319l-4.285-4.834c-48.342-47.683-99.43-83.39-151.727-107.011 26.368-30.653 53.066-61.196 80.203-91.63Zm1046.49-803.133c7.801 7.8 18.129 21.754 16.92 52.187-6.043 155.683-284.338 494.405-740.509 909.266-19.995-32.302-41.969-64.822-67.788-97.453l-22.523-25.27c-49.22-48.671-101.408-88.883-156.012-121.074 350.588-385.855 728.203-734.356 910.254-741.828 30.983-.109 44.497 9.01 59.658 24.172Zm126.678 56.472c2.087-53.615-14.832-99.98-56.142-141.29-34.28-34.279-81.962-51.198-134.588-49.11-304.554 12.414-912.232 683.377-1179.54 996.17-53.616-5.383-106.682 2.088-157.441 23.402-132.61 55.263-225.339 193.038-225.339 334.877 0 268.517-103.935 425.737-104.923 427.275L0 1896.747l110.307-6.153c69.217-3.735 681.29-45.375 810.165-332.46 24.39-54.604 29.225-113.163 15.93-175.239 374.32-321.802 972.11-879.71 983.427-1169.322" fill-rule="evenodd"/>
</svg>`;
    btnDraw.onclick = () => {
      let writezones = document.getElementsByClassName("writezone");

      // comme c'est une collection vivante, on doit le transformer en tableau
      [...writezones].forEach((zone) => {
        preview.removeChild(zone);
      });
      mode = "draw";
    };
    editmodezone.appendChild(btnDraw);

    const btnText = document.createElement("button");
    btnText.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none">
<path d="M1 22C1 21.4477 1.44772 21 2 21H22C22.5523 21 23 21.4477 23 22C23 22.5523 22.5523 23 22 23H2C1.44772 23 1 22.5523 1 22Z" fill="#0F0F0F"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M18.3056 1.87868C17.1341 0.707107 15.2346 0.707107 14.063 1.87868L3.38904 12.5526C2.9856 12.9561 2.70557 13.4662 2.5818 14.0232L2.04903 16.4206C1.73147 17.8496 3.00627 19.1244 4.43526 18.8069L6.83272 18.2741C7.38969 18.1503 7.89981 17.8703 8.30325 17.4669L18.9772 6.79289C20.1488 5.62132 20.1488 3.72183 18.9772 2.55025L18.3056 1.87868ZM15.4772 3.29289C15.8677 2.90237 16.5009 2.90237 16.8914 3.29289L17.563 3.96447C17.9535 4.35499 17.9535 4.98816 17.563 5.37868L15.6414 7.30026L13.5556 5.21448L15.4772 3.29289ZM12.1414 6.62869L4.80325 13.9669C4.66877 14.1013 4.57543 14.2714 4.53417 14.457L4.0014 16.8545L6.39886 16.3217C6.58452 16.2805 6.75456 16.1871 6.88904 16.0526L14.2272 8.71448L12.1414 6.62869Z" fill="#0F0F0F"/>
</svg>`;
    btnText.onclick = () => (mode = "text");
    editmodezone.appendChild(btnText);

    // Bouton pour activer le mode flèche
    const arrowBtn = document.createElement("button");
    arrowBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 16 16" fill="none">
<path d="M14 2H5.50003L4.00003 3.5L6.83581 6.33579L0.585815 12.5858L3.41424 15.4142L9.66424 9.16421L12.5 12L14 10.5L14 2Z" fill="#000000"/>
</svg>`;
    arrowBtn.onclick = () => {
      mode = "arrow";
    };
    editmodezone.appendChild(arrowBtn);

    const undoBtn = document.createElement("button");
    undoBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none">
<path d="M4 7H15C17.7614 7 20 9.23857 20 12C20 14.7614 17.7614 17 15 17M4 7L7 4M4 7L7 10M8.00001 17H11" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
    input.className = "writezone";
    input.style.position = "absolute";
    input.style.left = x + "px";
    input.style.width = "100px";
    input.style.top = y + 35 + "px";
    input.style.border = "1px solid #666";
    input.style.font = "20px Arial";
    input.style.background = "rgba(255,255,255,0.8)";
    input.style.zIndex = 999999;
    preview.appendChild(input);
    input.focus();

    // Quand l'utilisateur valide (Enter ou blur)
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        let textX = x * (canvas.width / rect.width);
        let textY = y * (canvas.height / rect.height);
        const a = drawText(ctx, input.value, textX, textY);
        let data = input.value;
        saveHistory({ type: "text", data, textX, textY });
        preview.removeChild(input);
      }
    });

    // input.addEventListener("blur", function () {
    //   if (input.value.trim() !== "") {
    //     if (textWrite) return;
    //     textWrite = true;
    //     drawText(
    //       ctx,
    //       input.value,
    //       x * (canvas.width / rect.width),
    //       y * (canvas.height / rect.height)
    //     );
    //     // Créer un élément texte cliquable pour suppression
    //     const textEl = document.createElement("div");
    //     textEl.innerText = input.value;
    //     textEl.style.position = "absolute";
    //     textEl.style.left = rect.left + x + "px";
    //     textEl.style.top = rect.top + y + 10 + "px";
    //     textEl.style.font = "20px Arial";
    //     textEl.style.color = "blue";
    //     textEl.style.cursor = "pointer";
    //     textEl.style.zIndex = 999999;
    //     preview.appendChild(textEl);

    //     // Suppression au clic
    //     textEl.addEventListener("click", () => {
    //       preview.removeChild(textEl);
    //       // Redessiner le canvas sans ce texte
    //       // ctx.clearRect(0, 0, canvas.width, canvas.height);
    //       // ctx.drawImage(canvas, 0, 0); // Attention : ici tu peux garder un historique si besoin
    //     });
    //   }
    //   if (document.body.contains(input)) {
    //     document.body.removeChild(input);
    //   }
    // });
  }

  // ✍️ Fonction dessin du texte sur le canvas
  function drawText(ctx, text, x, y) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "blue";
    ctx.fillText(text, x, y);
  }

  // --- Brancher les événements ---
  document.addEventListener("click", (e) => {
    const parentButton = e.target.closest("button");
    if (parentButton && parentButton.id === "btnScreen") {
      preview.innerHTML = "";
      captureScreen();
    }
    if (parentButton && parentButton.id === "btnElement") {
      preview.innerHTML = "";
      enableRegionSelection();
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
    console.log("push last action", history);
  }

  function undo() {
    if (history.length > 1) {
      history.pop(); // retire dernière action
      const last = history[history.length - 1];
      ctx.putImageData(last.imageData, 0, 0);
      console.log("Undo last action", history);
    }
  }

  // --- Envoi ---
  async function sendCapture(canva_file, attachments, data) {
    try {
      notify("info", "Envoi du feedback en cours...");
      disableBtn(true);
      let errorZone = document.getElementById("errorZone");
      if (leftPanel.contains(errorZone)) {
        leftPanel.removeChild(errorZone);
      }
      const response = await sendFeedback(canva_file, attachments, data);
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
        errors.id = "errorZone";
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
    let btn = document.getElementById("capture-send");
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
    alert.style.position = "fixed";
    alert.className = "custom-notification-" + type;
    alert.style.top = "20px";
    alert.style.right = "20px";
    if (type === "error") {
      alert.style.background = "#FF4646";
      alert.style.color = "white";
    } else if (type === "success") {
      alert.style.background = "#46FF7D";
      alert.style.color = "black";
    } else if (type === "info") {
      alert.style.background = "#46C8FF";
      alert.style.color = "black";
    }
    alert.style.padding = "15px 25px";
    alert.style.borderRadius = "8px";
    alert.style.boxShadow = "0 10px 15px rgba(0,0,0,0.2)";
    alert.style.zIndex = 999999999;
    alert.innerText = message;
    document.body.appendChild(alert);
    setTimeout(() => {
      if (document.body.contains(alert)) {
        document.body.removeChild(alert);
      }
    }, 3000);
  }
})();
