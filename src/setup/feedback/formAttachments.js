import { attachIconHTML } from "../../../public/main.js";
import { formatSize } from "./formFields.js";

// Attachments of the feedback form.
//
// A drop zone instead of the native file input: that one only shows "No file
// selected", cannot be styled, and allows neither removing a file nor seeing
// its size.

const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/mov",
  "video/avi",
  "video/mkv",
];

/**
 * Adds the attachments field to the form.
 *
 * @returns {File[]} the live list of selected files, read at submission.
 */
export function createAttachmentsField({ fields, maxSizeBytes }) {
  const attachment = document.createElement("input");
  attachment.id = "bugreveal_capture-attachment";
  attachment.type = "file";
  attachment.multiple = true;
  attachment.accept = ALLOWED_ATTACHMENT_TYPES.join(",");
  attachment.className = "bugreveal_visually-hidden";

  const dropzone = document.createElement("button");
  dropzone.type = "button";
  dropzone.className = "bugreveal_dropzone";
  dropzone.innerHTML = `${attachIconHTML}<span class="bugreveal_dropzone-label">Ajouter des fichiers</span><span class="bugreveal_dropzone-hint">ou glissez-les ici · ${formatSize(
    maxSizeBytes
  )} max par fichier</span>`;

  const fileList = document.createElement("ul");
  fileList.className = "bugreveal_file-list";

  const block = document.createElement("div");
  block.className = "bugreveal_attachments";
  block.appendChild(dropzone);
  block.appendChild(attachment);
  block.appendChild(fileList);

  const field = fields.makeField({ label: "Pièces jointes", control: block });
  fields.register("attachments", field.error);

  const selectedFiles = [];

  const renderFileList = () => {
    fileList.innerHTML = "";
    selectedFiles.forEach((file, index) => {
      const item = document.createElement("li");
      item.className = "bugreveal_file-item";

      const name = document.createElement("span");
      name.className = "bugreveal_file-name";
      name.innerText = file.name;
      name.title = file.name;

      const size = document.createElement("span");
      size.className = "bugreveal_file-size";
      size.innerText = formatSize(file.size);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "bugreveal_file-remove";
      remove.title = "Retirer";
      remove.setAttribute("aria-label", `Retirer ${file.name}`);
      remove.innerText = "×";
      remove.onclick = () => {
        selectedFiles.splice(index, 1);
        renderFileList();
      };

      item.appendChild(name);
      item.appendChild(size);
      item.appendChild(remove);
      fileList.appendChild(item);
    });
  };

  // A refused file no longer cancels the whole selection: only invalid files
  // are dropped, and the reason is stated instead of being guessed.
  const addFiles = (files) => {
    const rejected = [];
    for (const file of files) {
      if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
        rejected.push(`${file.name} (format non accepté)`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        rejected.push(`${file.name} (${formatSize(file.size)}, trop volumineux)`);
        continue;
      }
      if (selectedFiles.some((f) => f.name === file.name && f.size === file.size)) continue;
      selectedFiles.push(file);
    }
    renderFileList();
    fields.setFieldError("attachments", rejected.length ? rejected.join(", ") : null);
  };

  dropzone.onclick = () => attachment.click();
  attachment.addEventListener("change", (e) => {
    addFiles(e.target.files);
    attachment.value = "";
  });

  ["dragenter", "dragover"].forEach((type) => {
    dropzone.addEventListener(type, (e) => {
      e.preventDefault();
      dropzone.classList.add("bugreveal_dropzone-active");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    dropzone.addEventListener(type, (e) => {
      e.preventDefault();
      dropzone.classList.remove("bugreveal_dropzone-active");
    });
  });
  dropzone.addEventListener("drop", (e) => {
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  });

  return selectedFiles;
}
