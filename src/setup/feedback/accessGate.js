import { project_id } from "../../record.js";
import { notify } from "../../utils/notify.js";

// Who may use the feedback widget, and how a visitor signs in.
//
// Until the visitor is an identified member of the project, the widget exposes
// neither the capture bar nor the form: the floating button simply opens the
// screen explaining how to get access.

const TOKEN_STORAGE_KEY = "bugreveal_record_app_user";

const buildRedirectURL = () => {
  const urlParent = encodeURIComponent(window.location.href);
  const projectParam = project_id ? `&project_id=${project_id}` : "";
  return `${import.meta.env.VITE_SSO_URL}?from=${urlParent}${projectParam}`;
};

const openLoginPopup = (url, width = 480, height = 640) => {
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  return window.open(
    url,
    "bugrevealLoginPopup",
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );
};

// The SSO popup relays the token by postMessage: only its own origin is heard.
const waitForRelayedToken = () =>
  new Promise((resolve) => {
    const expectedOrigin = new URL(buildRedirectURL()).origin;
    const handler = (event) => {
      if (event.origin !== expectedOrigin) return;
      const { token } = event.data || {};
      if (!token) return;
      window.removeEventListener("message", handler);
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
      resolve(token);
    };
    window.addEventListener("message", handler);
  });

const listenForLoginMessage = () => waitForRelayedToken().then(() => window.location.reload());

// Seconds left before the access token expires, read from its payload.
const secondsLeft = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp - Date.now() / 1000;
  } catch {
    return 0;
  }
};

const RENEW_MARGIN_SECONDS = 60;
const RENEW_TIMEOUT_MS = 60000;

/**
 * Makes sure the stored access token outlives the next request.
 *
 * The widget only holds a 15-minute access token. When it is about to expire,
 * the SSO window is opened again: its session cookie lets it relay a fresh
 * token at once, without any form. Must be called from a click, since
 * browsers only open a window in answer to a user action.
 *
 * @returns {Promise<boolean>} false when no fresh token could be obtained.
 */
export const ensureFreshToken = (currentToken) => {
  if (currentToken && secondsLeft(currentToken) > RENEW_MARGIN_SECONDS) return Promise.resolve(true);

  const popup = openLoginPopup(buildRedirectURL());
  if (!popup) return Promise.resolve(false);

  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), RENEW_TIMEOUT_MS);
    const closed = setInterval(() => {
      if (!popup.closed) return;
      clearInterval(closed);
      // The relayed message arrives just before the window closes.
      setTimeout(() => resolve(false), 500);
    }, 500);
    waitForRelayedToken().then(() => {
      clearTimeout(timer);
      clearInterval(closed);
      resolve(true);
    });
  });
};

export function createAccessGate({ ui, bugRevealToken }) {
  // Follows the session for the life of the page: an expired token turns the
  // panel back into the sign-in screen.
  let signedIn = bugRevealToken !== null;
  const renderConnexionPrompt = (container) => {
    const existing = document.getElementById("bugreveal_capture_connexion");
    if (existing) existing.remove();
    const btn = document.createElement("button");
    btn.id = "bugreveal_capture_connexion";
    btn.type = "button";
    btn.innerText = "Se connecter";
    btn.onclick = () => {
      openLoginPopup(buildRedirectURL());
      listenForLoginMessage();
    };
    container.appendChild(btn);
  };

  // Intercepts 401s from the BugReveal API to force a clean sign-in again.
  const interceptSessionExpiry = () => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const [url, config] = args;
        const response = await originalFetch(url, config);
        if (
          typeof url === "string" &&
          url.includes(import.meta.env.VITE_BACKEND_URL) &&
          response.status === 401
        ) {
          // The widget session is over: the floating button leads back to the
          // sign-in screen. It used to only raise an alarming notification,
          // while the button kept opening a capture bar that no longer worked.
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          signedIn = false;
          ui.setFabHandler(renderAccessPanel);
          if (ui.overlay.style.display !== "none") {
            renderAccessPanel();
          } else {
            notify("info", "Votre session BugReveal a expiré. Reconnectez-vous pour laisser un avis.");
          }
        }
        return response;
      } catch (error) {
        console.error("error", error);
        return originalFetch(...args);
      }
    };
  };

  const renderAccessPanel = () => {
    ui.resetEditorArea();
    ui.editToolbar.style.display = "none";
    ui.setTitle("Accès au feedback");
    ui.showPanel();

    const block = document.createElement("div");
    block.className = "bugreveal_field";

    const heading = document.createElement("p");
    const help = document.createElement("p");
    if (!signedIn) {
      heading.innerText = "Connectez-vous pour laisser un avis";
      help.innerText = "Les retours sont réservés aux membres invités sur ce projet.";
    } else {
      heading.innerText = "Votre compte n'est pas membre de ce projet";
      help.innerText =
        "Demandez à l'équipe du projet de vous y ajouter pour pouvoir déposer un avis.";
    }
    block.appendChild(heading);
    block.appendChild(help);
    ui.leftPanel.appendChild(block);

    if (!signedIn) renderConnexionPrompt(ui.leftPanel);
  };

  return { renderAccessPanel, interceptSessionExpiry };
}
