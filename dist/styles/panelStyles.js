// The full-screen annotation layer and the side panel that carries the form,
// including the annotation toolbar and the rich text editor.

export const panelCSS = `
/* --- Full-screen layer: annotation straight on the current page --- */
#bugreveal_capture-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: var(--bugreveal-bg-subtle);
  z-index: 999999;
  animation: bugreveal-fade-in 0.15s ease;
}
@keyframes bugreveal-fade-in { from { opacity: 0; } to { opacity: 1; } }

#bugreveal_capture-preview-area {
  position: absolute;
  inset: 0;
  right: var(--bugreveal-sidebar-width, 380px);
  display: flex;
}

#bugreveal_sidebar {
  --bugreveal-sidebar-width: 380px;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--bugreveal-sidebar-width);
  background: var(--bugreveal-bg);
  box-shadow: -8px 0 30px rgba(16, 24, 40, 0.08);
  display: flex;
  flex-direction: column;
  z-index: 5;
}
#bugreveal_sidebar-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 16px;
  border-bottom: 1px solid var(--bugreveal-border);
  flex-shrink: 0;
}
#bugreveal_sidebar-heading { min-width: 0; }
#bugreveal_sidebar-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bugreveal-text-subtle);
  margin-bottom: 6px;
}
#bugreveal_sidebar-brand img { width: 16px; height: 16px; flex-shrink: 0; object-fit: contain; }
#bugreveal_sidebar-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--bugreveal-text);
}
#bugreveal_sidebar-context {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--bugreveal-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: rtl;
  text-align: left;
}

#bugreveal_capture-close {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: var(--bugreveal-bg-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
#bugreveal_capture-close:hover { background: var(--bugreveal-border); }
#bugreveal_capture-close svg { width: 14px; height: 14px; }

#bugreveal_editmodezone {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--bugreveal-bg);
  border-radius: 999px;
  box-shadow: var(--bugreveal-shadow);
  z-index: 10;
}
.bugreveal_tool-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  border-right: 1px solid var(--bugreveal-border);
}
.bugreveal_tool-group:last-child { border-right: none; }
#bugreveal_editmodezone button {
  background: transparent;
  border: none;
  width: 34px;
  height: 34px;
  border-radius: var(--bugreveal-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
#bugreveal_editmodezone button:hover { background: var(--bugreveal-bg-subtle); }
#bugreveal_editmodezone button.bugreveal_tool-active { background: var(--bugreveal-brand); }
#bugreveal_editmodezone button.bugreveal_tool-active svg { stroke: white; fill: white; }
#bugreveal_editmodezone button svg { width: 18px; height: 18px; }
#bugreveal_editmodezone button:disabled { opacity: 0.35; cursor: not-allowed; }
#bugreveal_color-picker {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  background: none;
}
#bugreveal_width-picker { width: 70px; }
.bugreveal_fill-toggle-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--bugreveal-text-muted);
  cursor: pointer;
  user-select: none;
}
.bugreveal_fill-toggle-label input { cursor: pointer; }

#bugreveal_capture-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  background: #1a1d29;
}
#bugreveal_capture-preview canvas,
#replay_map_record_video {
  max-width: 100%;
  max-height: 100%;
  cursor: crosshair;
  display: block;
}

.bugreveal_left-panel {
  flex: 1;
  display: none;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.bugreveal_form-fieldset { display: flex; flex-direction: column; gap: 18px; }
.bugreveal_field { display: flex; flex-direction: column; gap: 6px; }
.bugreveal_field label {
  font-size: 12px;
  font-weight: 600;
  color: var(--bugreveal-text);
  letter-spacing: 0;
  text-transform: none;
}
.bugreveal_required { color: var(--bugreveal-danger); margin-left: 3px; }
.bugreveal_field-hint {
  font-size: 12px;
  line-height: 1.4;
  color: var(--bugreveal-text-muted);
  margin: 0;
}
.bugreveal_field-error {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--bugreveal-danger);
  margin: 0;
}
.bugreveal_left-panel .bugreveal_invalid {
  border-color: var(--bugreveal-danger);
  background: rgba(239, 68, 68, 0.04);
}
.bugreveal_left-panel .bugreveal_invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.bugreveal_left-panel input:not([type="color"]):not([type="range"]),
.bugreveal_left-panel select,
.bugreveal_left-panel textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--bugreveal-border);
  border-radius: var(--bugreveal-radius-sm);
  background: var(--bugreveal-bg-subtle);
  font-size: 14px;
  color: var(--bugreveal-text);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.bugreveal_left-panel input:focus,
.bugreveal_left-panel select:focus,
.bugreveal_left-panel textarea:focus {
  border-color: var(--bugreveal-brand);
  box-shadow: 0 0 0 3px rgba(70, 95, 255, 0.15);
  outline: none;
}
.bugreveal_left-panel textarea { resize: vertical; min-height: 90px; }

/* --- Home-made rich text editor (description) --- */
.bugreveal_richtext {
  border: 1px solid var(--bugreveal-border);
  border-radius: var(--bugreveal-radius-sm);
  background: var(--bugreveal-bg-subtle);
  overflow: hidden;
}
.bugreveal_richtext-toolbar {
  display: flex;
  gap: 2px;
  padding: 6px;
  border-bottom: 1px solid var(--bugreveal-border);
  background: var(--bugreveal-bg);
}
.bugreveal_richtext-toolbar button {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--bugreveal-radius-sm);
  font-size: 13px;
  font-weight: 700;
  color: var(--bugreveal-text);
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.bugreveal_richtext-toolbar button:hover { background: var(--bugreveal-bg-subtle); }
.bugreveal_richtext-toolbar button:nth-child(2) { font-style: italic; }
.bugreveal_richtext-toolbar button:nth-child(3) { text-decoration: underline; }
.bugreveal_richtext-editable {
  min-height: 90px;
  max-height: 220px;
  overflow-y: auto;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--bugreveal-text);
  outline: none;
}
.bugreveal_richtext-editable:empty::before {
  content: attr(data-placeholder);
  color: var(--bugreveal-text-muted);
}
.bugreveal_richtext-editable ul { padding-left: 20px; }
.bugreveal_richtext-editable a { color: var(--bugreveal-brand); }

#bugreveal_capture_connexion,
.bugreveal_btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--bugreveal-brand);
  color: white;
  border: none;
  padding: 11px 18px;
  border-radius: var(--bugreveal-radius-sm);
  font-family: var(--bugreveal-font);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}
#bugreveal_capture_connexion:hover,
.bugreveal_btn-primary:hover { background: var(--bugreveal-brand-dark); }
.bugreveal_btn-primary:active { transform: scale(0.99); }
.bugreveal_btn-primary:disabled { cursor: not-allowed; opacity: 0.75; }

/* The button keeps its colour while sending: a dimmed one reads as an error
   rather than as work in progress. */
.bugreveal_btn-loading::before {
  content: "";
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  animation: bugreveal-spin 0.7s linear infinite;
}
@keyframes bugreveal-spin { to { transform: rotate(360deg); } }

.bugreveal_btn-secondary {
  background: transparent;
  color: var(--bugreveal-text-muted);
  border: 1px solid var(--bugreveal-border);
  padding: 11px 16px;
  border-radius: var(--bugreveal-radius-sm);
  font-family: var(--bugreveal-font);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.bugreveal_btn-secondary:hover { background: var(--bugreveal-bg-subtle); color: var(--bugreveal-text); }
.bugreveal_btn-secondary:disabled { cursor: not-allowed; opacity: 0.6; }

.bugreveal_link-btn {
  background: none;
  border: none;
  padding: 0;
  font-family: var(--bugreveal-font);
  font-size: 12px;
  font-weight: 600;
  color: var(--bugreveal-brand);
  cursor: pointer;
  align-self: flex-start;
}
.bugreveal_link-btn:hover { text-decoration: underline; }

/* --- Sticky panel footer --- */
#bugreveal_sidebar-footer {
  flex-shrink: 0;
  padding: 14px 20px;
  border-top: 1px solid var(--bugreveal-border);
  background: var(--bugreveal-bg);
}
.bugreveal_actions { display: flex; gap: 10px; }
.bugreveal_actions .bugreveal_btn-primary { flex: 1; }
`;
