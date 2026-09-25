// Small home-made rich text editor (bold / italic / underline / list / link)
// for the description field. A third-party library (SunEditor) is avoided:
// its CSS does not load reliably in this context, since this widget is
// injected on the customer's site through a plain <script>, without Vite's
// HTML pipeline that normally handles the stylesheet <link>s of dynamic
// imports. With our own markup, styling is guaranteed since it is part of
// mainCSS, already injected reliably.

const COMMANDS = [
  { command: "bold", title: "Gras", icon: "B" },
  { command: "italic", title: "Italique", icon: "I" },
  { command: "underline", title: "Souligné", icon: "U" },
  { command: "insertUnorderedList", title: "Liste à puces", icon: "•" },
];

export function createRichTextEditor({ placeholder }) {
  const wrapper = document.createElement("div");
  wrapper.className = "bugreveal_richtext";

  const toolbar = document.createElement("div");
  toolbar.className = "bugreveal_richtext-toolbar";

  COMMANDS.forEach(({ command, title, icon }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = title;
    btn.innerText = icon;
    btn.onmousedown = (e) => e.preventDefault(); // keeps focus/selection inside the editor
    btn.onclick = () => {
      editable.focus();
      document.execCommand(command);
    };
    toolbar.appendChild(btn);
  });

  const linkBtn = document.createElement("button");
  linkBtn.type = "button";
  linkBtn.title = "Lien";
  linkBtn.innerText = "🔗";
  linkBtn.onmousedown = (e) => e.preventDefault();
  linkBtn.onclick = () => {
    const url = window.prompt("URL du lien :", "https://");
    if (url) {
      editable.focus();
      document.execCommand("createLink", false, url);
    }
  };
  toolbar.appendChild(linkBtn);

  const editable = document.createElement("div");
  editable.className = "bugreveal_richtext-editable";
  editable.contentEditable = "true";
  editable.dataset.placeholder = placeholder || "";

  wrapper.appendChild(toolbar);
  wrapper.appendChild(editable);

  return {
    element: wrapper,
    getHTML: () => (editable.innerText.trim().length > 0 ? editable.innerHTML : ""),
    setHTML: (html) => {
      editable.innerHTML = html || "";
    },
  };
}
