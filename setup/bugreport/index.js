(function () {
  // --- Créer le panel ---
  let mode = "draw"; // "draw" ou "text"
  const panel = document.createElement("div");
  panel.id = "capture-panel";
  const buttonzone = document.createElement("div");
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
      position: fixed;
      top: 10px;
      right: 10px;
      background: #f3f3f3;
      width: auto;
      max-width: 100%;
      max-height: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 999999;
    }
      #editmodezone{
       justify-content: center;
    margin-right: 10px;
    display: flex;
      }
    #editmodezone button {
    color: black !important;
    }
    #button-zone {
    justify-content: center;
    margin-right: 10px;
    flex-flow: column;
    display: flex;
    }
    #capture-panel button {
      display: block;
      margin: 2px 0;
      padding: 3px;
      width: auto;
      cursor: pointer;
      border: none;
      border-radius: 6px;
      color: white;      
    }

    #capture-panel button svg {
    width: 40px;
    height: 40px;
    }

    #capture-preview {
      margin-top: 10px;
      margin-bottom: 20px;
      overflow: auto;
    }
    #capture-preview canvas {
      border: 1px solid #ccc;
      cursor: crosshair;
      width: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: cover;
    }
    #capture-desc {
      margin-top: 10px;
      width: 80%;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #ddd;
      display: block;
    }
    #capture-send {
      margin-top: 10px;
      background: #465FFF;
      width: 100px !important;
    }
  `;
  document.head.appendChild(style);

  // --- Zone de prévisualisation ---
  const preview = document.createElement("div");
  preview.id = "capture-preview";
  panel.appendChild(preview);

  // --- Charger html2canvas dynamiquement ---
  const script = document.createElement("script");
  script.src = "http://localhost:5174/assets/html2canvas.min.js";
  document.head.appendChild(script);

  // --- Fonction capture écran ---
  async function captureScreen() {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    const track = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);
    const bitmap = await imageCapture.grabFrame();
    let canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    console.log("step1");
    canvas.getContext("2d").drawImage(bitmap, 0, 0);

    showEditableCanvas(canvas);
    track.stop();
  }

  // --- Fonction capture élément (body par défaut) ---
  function enableRegionSelection() {
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
      document.body.removeChild(selectionBox);

      // Capture le body puis on découpe la zone
      const fullCanvas = await html2canvas(document.body, {
        removeContainer: true,
        logging: false,
        scale: 1,
      });
      const ctx = fullCanvas.getContext("2d");

      // Crée un nouveau canvas à la taille de la sélection
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = rect.width;
      cropCanvas.height = rect.height;
      const cropCtx = cropCanvas.getContext("2d");

      cropCtx.drawImage(
        fullCanvas,
        rect.left,
        rect.top,
        rect.width,
        rect.height,
        0,
        0,
        rect.width,
        rect.height
      );

      showEditableCanvas(cropCanvas);
    }

    document.addEventListener("mousedown", mouseDown);
  }

  // --- Afficher canvas annotable ---
  function showEditableCanvas(captureCanvas) {
    console.log("step2");
    preview.innerHTML = "";
    addEditImageBtn();

    const canvas = document.createElement("canvas");
    canvas.width = captureCanvas.width;
    canvas.height = captureCanvas.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(captureCanvas, 0, 0);
    console.log("step3");

    // Annotation (dessin rouge)
    let drawing = false;
    canvas.addEventListener("mousedown", (e) => {
      if (mode === "draw") {
        drawing = true;
        ctx.beginPath();
        const { x, y } = getMousePos(canvas, e);
        ctx.moveTo(x, y);
      } else if (mode == "text") {
        addTextInput(canvas, e, ctx);
      }
    });
    canvas.addEventListener("mouseup", () => (drawing = false));
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
    });
    console.log("step4", preview);

    preview.appendChild(canvas);
    // Description
    let textarea = document.createElement("textarea");
    textarea.id = "capture-desc";
    textarea.placeholder = "Ajouter une description...";
    preview.appendChild(textarea);

    // Bouton envoyer
    let sendBtn = document.createElement("button");
    sendBtn.id = "capture-send";
    sendBtn.innerText = "📤 Envoyer";
    sendBtn.onclick = () => sendCapture(canvas, textarea.value);
    preview.appendChild(sendBtn);
  }

  function addEditImageBtn() {
    const editmodezone = document.createElement("div");
    editmodezone.id = "editmodezone";
    // 🔘 Boutons pour changer de mode
    const btnDraw = document.createElement("button");
    btnDraw.innerText = "✏️ Mode Dessin";
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
    btnText.innerText = "🔤 Mode Texte";
    btnText.onclick = () => (mode = "text");
    editmodezone.appendChild(btnText);
    preview.prepend(editmodezone);
  }

  // --- Envoi ---
  function sendCapture(canvas, description) {
    const imageData = canvas.toDataURL("image/png");
    console.log("Image:", imageData);
    console.log("Description:", description);
    // TODO: fetch POST vers ton backend ici
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
    input.style.left = rect.left + x + "px";
    input.style.top = rect.top + y + "px";
    input.style.border = "1px solid #666";
    input.style.font = "20px Arial";
    input.style.background = "rgba(255,255,255,0.8)";
    input.style.zIndex = 999999;
    console.log("eeevgv");
    preview.appendChild(input);
    input.focus();

    // Quand l'utilisateur valide (Enter ou blur)
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        const a = drawText(
          ctx,
          input.value,
          x * (canvas.width / rect.width),
          y * (canvas.height / rect.height)
        );
        preview.removeChild(input);
      }
    });

    input.addEventListener("blur", function () {
      if (input.value.trim() !== "") {
        drawText(
          ctx,
          input.value,
          x * (canvas.width / rect.width),
          y * (canvas.height / rect.height)
        );
      }
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    });
  }

  function drawText(ctx, text, x, y) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "blue";
    ctx.fillText(text, x, y);
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
})();
