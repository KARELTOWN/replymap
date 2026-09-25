import {
  fabHTML,
  toolbarHTML,
  recordPanelHTML,
  spinnerHTML,
  editToolbarHTML,
  closeIconHTML,
  brandMarkHTML,
  mainCSS,
} from "../../../public/main.js";

// Builds the widget DOM skeleton: floating button (FAB), capture menu,
// full-screen layer (annotation over the current page) with a side panel
// anchored right for the form. Same interaction model as a tool like BugHerd:
// drawing happens on a snapshot of the page itself, not in a disconnected
// centred window.
//
// The side panel has three fixed areas: a header recalling the context (the
// reported page), a scrolling body, and a sticky footer holding the main
// action. The submit button used to live in the form flow: it disappeared
// below the fold as soon as the description grew.
export function createPanel() {
  const fab = document.createElement("button");
  fab.id = "bugreveal_fab";
  fab.type = "button";
  fab.title = "Signaler un bug / laisser un feedback";
  fab.setAttribute("aria-label", "Signaler un bug ou laisser un feedback");
  fab.innerHTML = fabHTML;
  document.body.appendChild(fab);

  const toolbar = document.createElement("div");
  toolbar.id = "bugreveal_toolbar";
  toolbar.setAttribute("role", "menu");
  toolbar.setAttribute("aria-label", "Moyens de signalement");
  toolbar.innerHTML = toolbarHTML;
  toolbar.style.display = "none";
  document.body.appendChild(toolbar);

  const recordPanel = document.createElement("div");
  recordPanel.id = "bugreveal_recordPanel";
  recordPanel.innerHTML = recordPanelHTML;
  recordPanel.style.display = "none";
  document.body.appendChild(recordPanel);

  // Full-screen layer: holds the page snapshot + the annotation canvas, edge to
  // edge (no dimmed background: the illusion of drawing directly on the page is
  // wanted).
  const overlay = document.createElement("div");
  overlay.id = "bugreveal_capture-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "bugreveal_sidebar-title");
  overlay.style.display = "none";
  document.body.appendChild(overlay);

  // `previewArea` is the positioned container (the annotation toolbar is
  // centred relative to it); `preview` is the area actually emptied on each new
  // capture, so the toolbar itself is never wiped.
  const previewArea = document.createElement("div");
  previewArea.id = "bugreveal_capture-preview-area";
  overlay.appendChild(previewArea);

  const preview = document.createElement("div");
  preview.id = "bugreveal_capture-preview";
  previewArea.appendChild(preview);

  const editToolbar = document.createElement("div");
  editToolbar.id = "bugreveal_editmodezone";
  editToolbar.setAttribute("role", "toolbar");
  editToolbar.setAttribute("aria-label", "Outils d'annotation");
  editToolbar.innerHTML = editToolbarHTML;
  editToolbar.style.display = "none";
  previewArea.appendChild(editToolbar);

  // Side panel anchored right (form).
  const sidebar = document.createElement("div");
  sidebar.id = "bugreveal_sidebar";
  overlay.appendChild(sidebar);

  const sidebarHeader = document.createElement("div");
  sidebarHeader.id = "bugreveal_sidebar-header";

  const headerMain = document.createElement("div");
  headerMain.id = "bugreveal_sidebar-heading";

  const brand = document.createElement("div");
  brand.id = "bugreveal_sidebar-brand";
  brand.innerHTML = `${brandMarkHTML}<span>BugReveal</span>`;

  const sidebarTitle = document.createElement("h3");
  sidebarTitle.id = "bugreveal_sidebar-title";
  sidebarTitle.innerText = "Nouveau feedback";

  // Recalls the page actually reported: on an application with internal
  // navigation, the feedback author has no other landmark once the annotation
  // layer is open on top.
  const sidebarContext = document.createElement("p");
  sidebarContext.id = "bugreveal_sidebar-context";
  sidebarContext.style.display = "none";

  headerMain.appendChild(brand);
  headerMain.appendChild(sidebarTitle);
  headerMain.appendChild(sidebarContext);

  const closeBtn = document.createElement("button");
  closeBtn.id = "bugreveal_capture-close";
  closeBtn.type = "button";
  closeBtn.title = "Fermer";
  closeBtn.setAttribute("aria-label", "Fermer le formulaire de feedback");
  closeBtn.innerHTML = closeIconHTML;

  sidebarHeader.appendChild(headerMain);
  sidebarHeader.appendChild(closeBtn);
  sidebar.appendChild(sidebarHeader);

  const leftPanel = document.createElement("div");
  leftPanel.className = "bugreveal_left-panel";
  sidebar.appendChild(leftPanel);

  // Sticky footer: holds the main action, always visible whatever the form's
  // scroll.
  const footer = document.createElement("div");
  footer.id = "bugreveal_sidebar-footer";
  footer.style.display = "none";
  sidebar.appendChild(footer);

  const canvasLoader = document.createElement("div");
  canvasLoader.id = "bugreveal_canvas-loader";
  canvasLoader.setAttribute("role", "status");
  canvasLoader.setAttribute("aria-label", "Capture en cours");
  canvasLoader.style.display = "none";
  const spinner = document.createElement("div");
  spinner.className = "bugreveal_spinner";
  spinner.innerHTML = spinnerHTML;
  canvasLoader.appendChild(spinner);
  document.body.appendChild(canvasLoader);

  const style = document.createElement("style");
  style.innerHTML = mainCSS;
  document.head.appendChild(style);

  const setTitle = (text) => {
    sidebarTitle.innerText = text;
  };

  const setContext = (text) => {
    if (!text) {
      sidebarContext.style.display = "none";
      return;
    }
    sidebarContext.innerText = text;
    sidebarContext.title = text;
    sidebarContext.style.display = "block";
  };

  const showToolbar = () => {
    toolbar.style.display = "flex";
  };
  const hideToolbar = () => {
    toolbar.style.display = "none";
  };
  const toggleToolbar = () => {
    toolbar.style.display = toolbar.style.display === "none" ? "flex" : "none";
  };

  // The capture menu closes on an outside click, like any menu.
  document.addEventListener("pointerdown", (event) => {
    if (toolbar.style.display === "none") return;
    if (toolbar.contains(event.target) || fab.contains(event.target)) return;
    hideToolbar();
  });

  const showPanel = () => {
    overlay.style.display = "flex";
    fab.style.display = "none";
    hideToolbar();
  };
  const hidePanel = () => {
    overlay.style.display = "none";
    fab.style.display = "flex";
  };

  // Lets the orchestrator (index.js) clean its state (editor, video recording
  // in progress...) before the panel closes, however the closing is triggered.
  let onCloseHandler = null;
  const setCloseHandler = (fn) => {
    onCloseHandler = fn;
  };
  const closePanel = () => {
    if (overlay.style.display === "none") return;
    if (typeof onCloseHandler === "function") onCloseHandler();
    hidePanel();
    setContext(null);
    footer.innerHTML = "";
    footer.style.display = "none";
    // Focus must return to the trigger, otherwise it jumps back to the top of the
    // customer's page after closing.
    fab.focus();
  };

  closeBtn.addEventListener("click", closePanel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.style.display !== "none") closePanel();
  });

  // The panel is modal: tabbing must not wander into the customer's page behind
  // the layer.
  const FOCUSABLE =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
  overlay.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const focusable = Array.from(overlay.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  const showRecordPanel = () => {
    recordPanel.style.display = "flex";
  };
  const hideRecordPanel = () => {
    recordPanel.style.display = "none";
  };

  const showLoader = () => {
    canvasLoader.style.display = "flex";
  };
  const hideLoader = () => {
    canvasLoader.style.display = "none";
  };

  const resetEditorArea = () => {
    preview.innerHTML = "";
    leftPanel.innerHTML = "";
    leftPanel.style.display = "flex";
    footer.innerHTML = "";
    footer.style.display = "none";
    editToolbar.style.display = "flex";
  };

  // The floating button opens the capture bar by default, but the orchestrator
  // redirects it to the access screen when the visitor is not a signed-in
  // member of the project.
  let fabHandler = toggleToolbar;
  const setFabHandler = (handler) => {
    fabHandler = typeof handler === "function" ? handler : toggleToolbar;
  };
  fab.addEventListener("click", () => fabHandler());

  return {
    fab,
    toolbar,
    recordPanel,
    overlay,
    editToolbar,
    preview,
    sidebar,
    leftPanel,
    footer,
    canvasLoader,
    setTitle,
    setContext,
    showToolbar,
    hideToolbar,
    toggleToolbar,
    showPanel,
    hidePanel,
    closePanel,
    setCloseHandler,
    showRecordPanel,
    hideRecordPanel,
    showLoader,
    hideLoader,
    resetEditorArea,
    setFabHandler,
  };
}
