import { createRichTextEditor } from "./richTextEditor.js";
import { typeIconHTML } from "../../../public/main.js";
import { createFieldRegistry } from "./formFields.js";
import { createAttachmentsField } from "./formAttachments.js";
import { createIntegrationOptions } from "./formIntegrations.js";
import { createGuestIdentityFields } from "./formIdentity.js";

const TITLE_MAX_LENGTH = 200;
const TITLE_MIN_LENGTH = 3;

// Builds the feedback form (type, title, description, attachments,
// integration) in `container`, and calls `onSubmit` with the collected data
// once validation passes.
//
// Errors are shown under the faulty field rather than as a floating
// notification: a notification appears in a corner of the screen, far from the
// field to fix, and disappears before it is read.
export function createFeedbackForm({
  container,
  footer,
  types,
  userIsInProject,
  guest = false,
  maxSizeBytes,
  captureKind = "img",
  pageUrl = "",
  integrations = ["trello"],
  getBoardLists,
  onDownloadCapture,
  onCancel,
  onSubmit,
}) {
  const fieldset = document.createElement("div");
  fieldset.className = "bugreveal_form-fieldset";
  container.appendChild(fieldset);

  const fields = createFieldRegistry(fieldset);
  const { makeField, setFieldError, clearErrors } = fields;

  // --- Summary of what is attached ------------------------------------------
  // The author must see at a glance what they are about to send: without this
  // summary, nothing in the panel says whether the attached capture is an image
  // or a video, nor for which page.
  const captureCard = document.createElement("div");
  captureCard.className = "bugreveal_capture-card";

  const captureInfo = document.createElement("div");
  captureInfo.className = "bugreveal_capture-card-info";
  const captureLabel = document.createElement("span");
  captureLabel.className = "bugreveal_capture-card-label";
  captureLabel.innerText =
    captureKind === "video" ? "Enregistrement vidéo joint" : "Capture d'écran jointe";
  const captureMeta = document.createElement("span");
  captureMeta.className = "bugreveal_capture-card-meta";
  captureMeta.innerText = pageUrl || "";
  captureMeta.title = pageUrl || "";
  captureInfo.appendChild(captureLabel);
  if (pageUrl) captureInfo.appendChild(captureMeta);
  captureCard.appendChild(captureInfo);

  if (typeof onDownloadCapture === "function") {
    const downloadBtn = document.createElement("button");
    downloadBtn.type = "button";
    downloadBtn.className = "bugreveal_link-btn";
    downloadBtn.innerText = "Télécharger";
    downloadBtn.onclick = () => onDownloadCapture();
    captureCard.appendChild(downloadBtn);
  }
  fieldset.appendChild(captureCard);

  // --- Type ----------------------------------------------------------------
  // Types are shown as buttons rather than a dropdown: there are few of them,
  // they are the most structuring choice of the form, and a visible choice
  // takes one click instead of two.
  let selectedType = "";
  const typeGroup = document.createElement("div");
  typeGroup.className = "bugreveal_type-grid";
  typeGroup.setAttribute("role", "radiogroup");
  typeGroup.setAttribute("aria-label", "Type de feedback");

  const typeButtons = [];
  (types || []).forEach((item) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "bugreveal_type-chip";
    chip.dataset.value = item._id;
    chip.setAttribute("role", "radio");
    chip.setAttribute("aria-checked", "false");
    chip.innerHTML = `${typeIconHTML(item.libelle)}<span>${item.libelle}</span>`;
    chip.onclick = () => {
      selectedType = item._id;
      typeButtons.forEach((btn) => {
        const active = btn === chip;
        btn.classList.toggle("bugreveal_type-chip-active", active);
        btn.setAttribute("aria-checked", active ? "true" : "false");
      });
      setFieldError("type", null);
    };
    typeButtons.push(chip);
    typeGroup.appendChild(chip);
  });

  const typeField = makeField({
    label: "Type de retour",
    control: typeGroup,
    required: true,
  });
  fields.register("type", typeField.error);

  // --- Title ---------------------------------------------------------------
  const titleWrapper = document.createElement("div");
  titleWrapper.className = "bugreveal_input-wrapper";

  const title = document.createElement("input");
  title.id = "bugreveal_capture-title";
  title.type = "text";
  title.maxLength = TITLE_MAX_LENGTH;
  title.autocomplete = "off";
  title.placeholder = "Ex : Le bouton de validation ne répond pas";
  titleWrapper.appendChild(title);

  const counter = document.createElement("span");
  counter.className = "bugreveal_counter";
  counter.innerText = `0/${TITLE_MAX_LENGTH}`;
  titleWrapper.appendChild(counter);

  const titleField = makeField({
    label: "Titre",
    control: titleWrapper,
    id: title.id,
    required: true,
    hint: "Résumez le problème en une phrase.",
  });
  fields.register("title", titleField.error, title);

  title.addEventListener("input", () => {
    counter.innerText = `${title.value.length}/${TITLE_MAX_LENGTH}`;
    if (title.value.trim().length >= TITLE_MIN_LENGTH) setFieldError("title", null);
  });

  // --- Description ---------------------------------------------------------
  const richText = createRichTextEditor({
    placeholder: "Ce que vous faisiez, ce que vous attendiez, ce qui s'est passé...",
  });
  makeField({
    label: "Description",
    control: richText.element,
    hint: "Facultatif, mais les étapes pour reproduire font gagner beaucoup de temps.",
  });
  const getDescriptionHTML = () => richText.getHTML();

  // --- Who is speaking (guest only) ----------------------------------------
  // On a project open to visitors without an account, the email is the only
  // identity a feedback carries: it is what lets the team answer, and what
  // groups several reports from the same person.
  const identity = guest ? createGuestIdentityFields({ makeField, fields }) : null;

  const selectedFiles = createAttachmentsField({ fields, maxSizeBytes });

  const readIntegration =
    userIsInProject && integrations?.length > 0
      ? createIntegrationOptions({ fieldset, fields, integrations, getBoardLists })
      : () => ({});

  // --- Actions (panel footer) ----------------------------------------------
  const actions = document.createElement("div");
  actions.className = "bugreveal_actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "bugreveal_btn-secondary";
  cancelBtn.innerText = "Annuler";
  cancelBtn.onclick = () => {
    if (typeof onCancel === "function") onCancel();
  };

  const sendBtn = document.createElement("button");
  sendBtn.id = "bugreveal_capture-send";
  sendBtn.type = "button";
  sendBtn.className = "bugreveal_btn-primary";
  sendBtn.innerHTML = `<span class="bugreveal_btn-label">Envoyer le feedback</span>`;

  actions.appendChild(cancelBtn);
  actions.appendChild(sendBtn);

  const host = footer || container;
  host.appendChild(actions);
  if (footer) footer.style.display = "block";

  const setSubmitting = (isSubmitting) => {
    sendBtn.disabled = isSubmitting;
    cancelBtn.disabled = isSubmitting;
    sendBtn.classList.toggle("bugreveal_btn-loading", isSubmitting);
    const label = sendBtn.querySelector(".bugreveal_btn-label");
    if (label) label.innerText = isSubmitting ? "Envoi en cours..." : "Envoyer le feedback";
  };

  // Validation flags every faulty field at once and moves focus to the first
  // one: the previous version stopped at the first error and announced it with
  // a notification, without pointing at the field.
  const validate = () => {
    clearErrors();
    let firstInvalid = null;

    if (!selectedType) {
      setFieldError("type", "Choisissez un type de retour");
      firstInvalid = firstInvalid || typeButtons[0];
    }
    if (title.value.trim().length < TITLE_MIN_LENGTH) {
      setFieldError("title", `Le titre doit faire au moins ${TITLE_MIN_LENGTH} caractères`);
      firstInvalid = firstInvalid || title;
    }
    if (identity && !identity.validate()) {
      firstInvalid = firstInvalid || identity.emailInput;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ block: "center", behavior: "smooth" });
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;

    const data = {
      title: title.value.trim(),
      description: getDescriptionHTML(),
      type: selectedType,
      ...(identity ? identity.read() : {}),
      ...readIntegration(),
    };

    await onSubmit(data, selectedFiles);
  };

  sendBtn.addEventListener("click", submit);

  // Shortcut expected in this kind of tool: submit without leaving the keyboard.
  container.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  });

  // The first field takes focus: the form opens ready for typing.
  requestAnimationFrame(() => title.focus());

  return { setSubmitting };
}
