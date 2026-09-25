const ICONS = {
  success: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  error: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7.5v5.5M12 16.5h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 11v5.5M12 7.5h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
};

// A single notification at a time: messages piled up on top of each other in
// the same place, making the last one unreadable.
let current = null;

export function notify(type, message, duration = 3500) {
  if (current) {
    current.remove();
    current = null;
  }

  const alert = document.createElement("div");
  alert.className = `bugreveal_toast bugreveal_toast-${type}`;
  alert.setAttribute("role", type === "error" ? "alert" : "status");

  const icon = document.createElement("span");
  icon.innerHTML = ICONS[type] || ICONS.info;
  alert.appendChild(icon.firstElementChild);

  const text = document.createElement("span");
  text.innerText = message;
  alert.appendChild(text);

  document.body.appendChild(alert);
  current = alert;

  requestAnimationFrame(() => alert.classList.add("bugreveal_toast-visible"));

  setTimeout(() => {
    alert.classList.remove("bugreveal_toast-visible");
    setTimeout(() => {
      alert.remove();
      if (current === alert) current = null;
    }, 200);
  }, duration);
}
