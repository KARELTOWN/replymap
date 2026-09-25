// The feedback form itself: capture summary, type choice, title, attachments,
// advanced options, crop preview and toasts.

export const formCSS = `
/* --- Summary of the attached capture --- */
.bugreveal_capture-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--bugreveal-radius-sm);
  background: var(--bugreveal-brand-soft);
  border: 1px solid rgba(70, 95, 255, 0.16);
}
.bugreveal_capture-card-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.bugreveal_capture-card-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--bugreveal-text);
}
.bugreveal_capture-card-meta {
  font-size: 11px;
  color: var(--bugreveal-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: rtl;
  text-align: left;
}

/* --- Type choice --- */
.bugreveal_type-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.bugreveal_type-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 13px;
  border: 1px solid var(--bugreveal-border);
  border-radius: 999px;
  background: var(--bugreveal-bg);
  font-family: var(--bugreveal-font);
  font-size: 13px;
  font-weight: 500;
  color: var(--bugreveal-text);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}
.bugreveal_type-chip svg { width: 15px; height: 15px; flex-shrink: 0; }
.bugreveal_type-chip:hover { border-color: var(--bugreveal-brand); }
.bugreveal_type-chip-active {
  background: var(--bugreveal-brand);
  border-color: var(--bugreveal-brand);
  color: #ffffff;
  font-weight: 600;
}
.bugreveal_type-chip-active svg { stroke: #ffffff; }
.bugreveal_type-chip:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(70, 95, 255, 0.2);
}

/* --- Title: built-in counter --- */
.bugreveal_input-wrapper { position: relative; display: flex; }
.bugreveal_input-wrapper input { padding-right: 62px !important; }
.bugreveal_counter {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--bugreveal-text-subtle);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}

/* --- Attachments --- */
.bugreveal_visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
.bugreveal_attachments { display: flex; flex-direction: column; gap: 8px; }
.bugreveal_dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  padding: 16px 12px;
  border: 1px dashed var(--bugreveal-border);
  border-radius: var(--bugreveal-radius-sm);
  background: var(--bugreveal-bg-subtle);
  font-family: var(--bugreveal-font);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.bugreveal_dropzone:hover,
.bugreveal_dropzone-active {
  border-color: var(--bugreveal-brand);
  background: var(--bugreveal-brand-soft);
}
.bugreveal_dropzone svg { width: 20px; height: 20px; stroke: var(--bugreveal-brand); margin-bottom: 4px; }
.bugreveal_dropzone-label { font-size: 13px; font-weight: 600; color: var(--bugreveal-text); }
.bugreveal_dropzone-hint { font-size: 11px; color: var(--bugreveal-text-muted); text-align: center; }

.bugreveal_file-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.bugreveal_file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--bugreveal-radius-xs);
  background: var(--bugreveal-bg-sunken);
  font-size: 13px;
}
.bugreveal_file-name {
  flex: 1;
  min-width: 0;
  color: var(--bugreveal-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bugreveal_file-size { font-size: 11px; color: var(--bugreveal-text-muted); flex-shrink: 0; font-variant-numeric: tabular-nums; }
.bugreveal_file-remove {
  border: none;
  background: transparent;
  color: var(--bugreveal-text-muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
  border-radius: 4px;
  flex-shrink: 0;
}
.bugreveal_file-remove:hover { color: var(--bugreveal-danger); }

/* --- Collapsible section (advanced options) --- */
.bugreveal_disclosure { border-top: 1px solid var(--bugreveal-border); padding-top: 14px; }
.bugreveal_disclosure-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  font-family: var(--bugreveal-font);
  font-size: 13px;
  font-weight: 600;
  color: var(--bugreveal-text-muted);
  cursor: pointer;
}
.bugreveal_disclosure-summary:hover { color: var(--bugreveal-text); }
.bugreveal_disclosure-summary svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  transition: transform 0.15s ease;
}
.bugreveal_disclosure-open .bugreveal_disclosure-summary svg { transform: rotate(180deg); }
.bugreveal_disclosure-body { flex-direction: column; gap: 14px; padding-top: 14px; }

#bugreveal_canvas-loader {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 20, 0.6);
  z-index: 9999999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bugreveal_spinner svg { width: 48px; height: 48px; }

.bugreveal_selection-box {
  position: absolute;
  border: 2px dashed var(--bugreveal-brand);
  background: rgba(70, 95, 255, 0.15);
  z-index: 999999;
  border-radius: 4px;
}

.bugreveal_writezone {
  position: absolute;
  min-width: 160px;
  max-width: 320px;
  padding: 6px 10px;
  font-size: 16px;
  font-family: var(--bugreveal-font);
  color: var(--bugreveal-text);
  background: rgba(255, 255, 255, 0.97);
  border: 2px solid var(--bugreveal-brand);
  border-radius: var(--bugreveal-radius-sm);
  box-shadow: var(--bugreveal-shadow);
  z-index: 9999999;
  resize: none;
  overflow: hidden;
  line-height: 1.2;
}
.bugreveal_writezone:focus { outline: none; }

/* --- Post-capture crop preview --- */
.bugreveal_crop-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 100%;
  max-height: 100%;
}
.bugreveal_crop-hint {
  color: white;
  font-size: 13px;
  margin: 0;
}
.bugreveal_crop-cancel {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 14px;
  border-radius: var(--bugreveal-radius-sm);
  font-size: 13px;
  cursor: pointer;
}
.bugreveal_crop-cancel:hover { background: rgba(255, 255, 255, 0.25); }

/* --- Toast notifications --- */
.bugreveal_toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 360px;
  padding: 12px 16px;
  border-radius: var(--bugreveal-radius-sm);
  box-shadow: var(--bugreveal-shadow);
  z-index: 999999999;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.35;
  color: white;
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.bugreveal_toast-visible { opacity: 1; transform: translateY(0); }
.bugreveal_toast svg { width: 18px; height: 18px; flex-shrink: 0; }
.bugreveal_toast-error { background: var(--bugreveal-danger); }
.bugreveal_toast-success { background: var(--bugreveal-success); }
.bugreveal_toast-info { background: var(--bugreveal-text); }

/* On a phone, the panel used to cover the whole screen, so the capture being
   annotated was hidden behind the form. The layer is split instead: the
   capture on top, the form as a sheet below it. */
@media (max-width: 720px) {
  #bugreveal_capture-preview-area { right: 0; bottom: 58%; }
  #bugreveal_sidebar {
    width: 100%;
    top: 42%;
    box-shadow: 0 -8px 30px rgba(16, 24, 40, 0.12);
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
  }
  #bugreveal_sidebar-header { padding: 12px 16px; }
  #bugreveal_editmodezone {
    top: auto;
    bottom: 12px;
    max-width: calc(100vw - 24px);
    flex-wrap: wrap;
    justify-content: center;
    border-radius: 16px;
  }
  .bugreveal_form-fieldset { gap: 14px; }
}
`;
