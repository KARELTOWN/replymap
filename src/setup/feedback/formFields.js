// Field scaffolding shared by the parts of the feedback form.
//
// Each field carries its label, its hint and its error slot, so validation
// never has to rebuild the DOM.

export const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
};

export function createFieldRegistry(fieldset) {
  const fieldErrors = new Map();

  const makeField = ({ label, control, hint, id, required = false, parent = fieldset }) => {
    const wrap = document.createElement("div");
    wrap.className = "bugreveal_field";

    if (label) {
      const labelEl = document.createElement("label");
      labelEl.innerText = label;
      if (required) {
        const star = document.createElement("span");
        star.className = "bugreveal_required";
        star.innerText = "*";
        star.setAttribute("aria-hidden", "true");
        labelEl.appendChild(star);
      }
      if (id) labelEl.htmlFor = id;
      wrap.appendChild(labelEl);
    }

    wrap.appendChild(control);

    if (hint) {
      const hintEl = document.createElement("p");
      hintEl.className = "bugreveal_field-hint";
      hintEl.innerText = hint;
      wrap.appendChild(hintEl);
    }

    const error = document.createElement("p");
    error.className = "bugreveal_field-error";
    error.setAttribute("role", "alert");
    error.style.display = "none";
    wrap.appendChild(error);

    parent.appendChild(wrap);
    return { wrap, error };
  };

  // `control` is the element outlined as invalid; null for grouped controls.
  const register = (key, error, control = null) => fieldErrors.set(key, { error, control });

  const setFieldError = (key, message) => {
    const field = fieldErrors.get(key);
    if (!field) return;
    const { error, control } = field;
    if (message) {
      error.innerText = message;
      error.style.display = "block";
      control?.classList.add("bugreveal_invalid");
      control?.setAttribute("aria-invalid", "true");
    } else {
      error.style.display = "none";
      control?.classList.remove("bugreveal_invalid");
      control?.removeAttribute("aria-invalid");
    }
  };

  const clearErrors = () => {
    for (const key of fieldErrors.keys()) setFieldError(key, null);
  };

  return { makeField, register, setFieldError, clearErrors };
}
