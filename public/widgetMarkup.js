// Markup and icons of the embedded widget: the fixed parts, built once by
// panel.js. Anything that depends on state is built by the module that owns
// that state.

export const fabHTML = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
    <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

export const closeIconHTML = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6l12 12M18 6L6 18" stroke="#1a1d29" stroke-width="1.8" stroke-linecap="round"/></svg>
`;

export const toolbarHTML = `
  <button id="bugreveal_btnAnnotatePage" class="bugreveal_toolbar-primary" title="Commenter sur la page">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21l3.6-1L19 7.6a2 2 0 000-2.8L18.2 4a2 2 0 00-2.8 0L4 15.4 3 21z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
    Commenter sur la page
  </button>
  <div class="bugreveal_toolbar-divider"></div>
  <button id="bugreveal_btnScreen" title="Capturer une fenêtre ou un écran">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" stroke-width="1.8"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    Capturer une fenêtre / écran
  </button>
  <button id="bugreveal_btnCropScreen" title="Capturer une zone précise">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 3H5a2 2 0 00-2 2v4M15 3h4a2 2 0 012 2v4M21 15v4a2 2 0 01-2 2h-4M3 15v4a2 2 0 002 2h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    Capturer une zone précise
  </button>
  <button id="bugreveal_btnRecordVideoAudio" title="Enregistrer l'écran">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg>
    Enregistrer l'écran
  </button>
`;

export const recordPanelHTML = `
  <span id="bugreveal_record-dot"></span>
  <span id="bugreveal_record-timer">00:00</span>
  <button id="bugreveal_btnRecordPause" title="Pause">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="5" width="4" height="14" rx="1" fill="#465FFF"/><rect x="14" y="5" width="4" height="14" rx="1" fill="#465FFF"/></svg>
  </button>
  <button id="bugreveal_btnRecordResume" title="Reprendre">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 5v14l12-7L7 5z" fill="#465FFF"/></svg>
  </button>
  <button id="bugreveal_btnRecordStop" title="Arrêter">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="12" height="12" rx="2" fill="#465FFF"/></svg>
  </button>
`;

export const editToolbarHTML = `
  <div class="bugreveal_tool-group">
    <button data-tool="select" title="Sélectionner / déplacer">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3l6.5 15.5 2-6.5 6.5-2L5 3z" stroke="#1a1d29" stroke-width="1.6" stroke-linejoin="round" fill="#1a1d29"/></svg>
    </button>
    <button data-tool="draw" class="bugreveal_tool-active" title="Dessiner">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21l3.6-1L19 7.6a2 2 0 000-2.8L18.2 4a2 2 0 00-2.8 0L4 15.4 3 21z" stroke="#1a1d29" stroke-width="1.6" stroke-linejoin="round"/></svg>
    </button>
    <button data-tool="rect" title="Rectangle">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="16" height="12" rx="1" stroke="#1a1d29" stroke-width="1.6"/></svg>
    </button>
    <button data-tool="ellipse" title="Ellipse">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="12" rx="8" ry="6" stroke="#1a1d29" stroke-width="1.6"/></svg>
    </button>
    <button data-tool="arrow" title="Flèche">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 19L19 5M19 5H11M19 5V13" stroke="#1a1d29" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button data-tool="text" title="Texte">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5h14M12 5v14" stroke="#1a1d29" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
  <div class="bugreveal_tool-group">
    <input type="color" id="bugreveal_color-picker" value="#FF3B30" title="Couleur" />
    <input type="range" id="bugreveal_width-picker" min="1" max="12" value="3" title="Épaisseur du trait" />
    <label class="bugreveal_fill-toggle-label" title="Remplir la forme">
      <input type="checkbox" id="bugreveal_fill-toggle" />
      Remplir
    </label>
  </div>
  <div class="bugreveal_tool-group">
    <button id="bugreveal_btnUndo" title="Annuler">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h11a5 5 0 010 10h-2M4 7l3-3M4 7l3 3" stroke="#1a1d29" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button id="bugreveal_btnRedo" title="Rétablir">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 7H9a5 5 0 000 10h2M20 7l-3-3M20 7l-3 3" stroke="#1a1d29" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button id="bugreveal_btnDeleteShape" title="Supprimer la sélection" disabled>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="#1a1d29" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>
  <div class="bugreveal_tool-group bugreveal_tool-group-save">
    <button id="bugreveal_btnSave" title="Télécharger">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="#1a1d29" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button id="bugreveal_btnCopy" title="Copier dans le presse-papier">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="11" height="11" rx="1.5" stroke="#1a1d29" stroke-width="1.6"/><path d="M5 15V5a1 1 0 011-1h10" stroke="#1a1d29" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
`;

export const spinnerHTML = `<svg class="loader" viewBox="0 0 50 50" width="50" height="50">
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

// Discreet mark recalling where the panel comes from, in its header.
// BugReveal mark, inlined so the widget shows it on a customer's site
// without a network call. Downscaled from front/public/images/logo/logo.png.
export const brandMarkHTML = `
  <img src="data:image/png;base64,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" alt="" aria-hidden="true" />
`;

export const attachIconHTML = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
`;

export const chevronIconHTML = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
`;

const BUG_ICON = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="7" y="7" width="10" height="12" rx="5" stroke="currentColor" stroke-width="1.7"/><path d="M9 6l1.5 2M15 6l-1.5 2M3 11h4M17 11h4M3.5 17H7M17 17h3.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
const IDEA_ICON = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.4.3.6.7.6 1.1h5.8c0-.4.2-.8.6-1.1A6 6 0 0012 3z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const QUESTION_ICON = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M9.6 9.3a2.5 2.5 0 114 2.4c-.9.6-1.6 1-1.6 2M12 17h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
const DEFAULT_ICON = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M21 12a8 8 0 01-8 8H4l1.6-3.2A8 8 0 1121 12z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`;

// Feedback types come from the API: the icon is picked from the label, with a
// neutral fallback for any type added later.
export function typeIconHTML(libelle = "") {
  const value = libelle.toLowerCase();
  if (value.includes("bug") || value.includes("erreur") || value.includes("problem")) return BUG_ICON;
  if (value.includes("suggest") || value.includes("idée") || value.includes("idee") || value.includes("amélior") || value.includes("ameli") || value.includes("fonctionn")) return IDEA_ICON;
  if (value.includes("question") || value.includes("aide")) return QUESTION_ICON;
  return DEFAULT_ICON;
}
