// Binds the annotation toolbar of the panel to a canvas editor.
//
// The toolbar markup is built once by panel.js; a new editor is created for
// every capture, so the handlers are rebound each time.
export function wireEditToolbar(toolbar, editor, { onSave, onCopy }) {
  toolbar.querySelectorAll("[data-tool]").forEach((btn) => {
    btn.onclick = () => {
      editor.setMode(btn.dataset.tool);
      toolbar
        .querySelectorAll("[data-tool]")
        .forEach((b) => b.classList.toggle("bugreveal_tool-active", b === btn));
    };
  });

  const colorPicker = toolbar.querySelector("#bugreveal_color-picker");
  if (colorPicker) {
    colorPicker.value = editor.getColor();
    colorPicker.oninput = (e) => editor.setColor(e.target.value);
  }
  const widthPicker = toolbar.querySelector("#bugreveal_width-picker");
  if (widthPicker) {
    widthPicker.value = editor.getLineWidth();
    widthPicker.oninput = (e) => editor.setLineWidth(Number(e.target.value));
  }
  const fillToggle = toolbar.querySelector("#bugreveal_fill-toggle");
  if (fillToggle) {
    fillToggle.checked = editor.getFillEnabled();
    fillToggle.onchange = (e) => editor.setFillEnabled(e.target.checked);
  }

  const undoBtn = toolbar.querySelector("#bugreveal_btnUndo");
  if (undoBtn) undoBtn.onclick = () => editor.undo();
  const redoBtn = toolbar.querySelector("#bugreveal_btnRedo");
  if (redoBtn) redoBtn.onclick = () => editor.redo();

  const deleteBtn = toolbar.querySelector("#bugreveal_btnDeleteShape");
  if (deleteBtn) {
    deleteBtn.disabled = !editor.hasSelection();
    deleteBtn.onclick = () => editor.deleteSelected();
  }

  const saveBtn = toolbar.querySelector("#bugreveal_btnSave");
  if (saveBtn) saveBtn.onclick = onSave;
  const copyBtn = toolbar.querySelector("#bugreveal_btnCopy");
  if (copyBtn) copyBtn.onclick = onCopy;
}

// Enables the delete button only while a shape is selected.
export const syncDeleteButton = (toolbar, hasSelection) => {
  const deleteBtn = toolbar.querySelector("#bugreveal_btnDeleteShape");
  if (deleteBtn) deleteBtn.disabled = !hasSelection;
};
