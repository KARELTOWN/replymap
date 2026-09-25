import { chevronIconHTML } from "../../../public/main.js";

// Integration options of the feedback form (Trello, etc.).
//
// Collapsed by default: they only concern the members who triage feedback,
// yet they took a third of the form for everyone.

const LIST_SELECT_ID = "bugreveal_capture-boardList";

// Why no list can be offered. Each case is settled in the dashboard, except a
// tool that did not answer.
const listUnavailableMessage = (code, integration) => {
  const tool = integration.charAt(0).toUpperCase() + integration.slice(1);
  switch (code) {
    case null:
      return `Aucune liste active sur le tableau ${tool} de ce projet`;
    case "INTEGRATION_NOT_CONNECTED":
      return `${tool} n'est pas connecté à ce projet (à faire dans BugReveal)`;
    case "INTEGRATION_EXPIRED":
      return `La connexion ${tool} a expiré : reconnectez-la dans BugReveal`;
    case "INTEGRATION_BOARD_REQUIRED":
      return `Aucun tableau ${tool} choisi pour ce projet (à faire dans BugReveal)`;
    case "PROJECT_NOT_MEMBER":
      return `Vous n'avez pas accès à l'intégration de ce projet`;
    default:
      return `Les listes ${tool} n'ont pas pu être chargées`;
  }
};

/**
 * Adds the collapsible integration options to the form.
 *
 * @returns {() => {integration?: string, list_id?: string}} reads the choice
 * at submission.
 */
export function createIntegrationOptions({ fieldset, fields, integrations, getBoardLists }) {
  const disclosure = document.createElement("div");
  disclosure.className = "bugreveal_disclosure";

  const summary = document.createElement("button");
  summary.type = "button";
  summary.className = "bugreveal_disclosure-summary";
  summary.setAttribute("aria-expanded", "false");
  summary.innerHTML = `<span>Options avancées</span>${chevronIconHTML}`;

  const body = document.createElement("div");
  body.className = "bugreveal_disclosure-body";
  body.style.display = "none";

  summary.onclick = () => {
    const open = body.style.display !== "none";
    body.style.display = open ? "none" : "flex";
    summary.setAttribute("aria-expanded", open ? "false" : "true");
    disclosure.classList.toggle("bugreveal_disclosure-open", !open);
  };

  disclosure.appendChild(summary);
  disclosure.appendChild(body);
  fieldset.appendChild(disclosure);

  const integrationSelect = document.createElement("select");
  integrationSelect.id = "bugreveal_capture-integration";
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.text = "Aucune";
  integrationSelect.appendChild(emptyOption);
  integrations.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.text = name.charAt(0).toUpperCase() + name.slice(1);
    integrationSelect.appendChild(option);
  });
  fields.makeField({
    label: "Créer une carte dans",
    control: integrationSelect,
    id: integrationSelect.id,
    parent: body,
  });

  const boardListPanel = document.createElement("div");
  boardListPanel.id = "bugreveal_capture-boardListPanel";
  boardListPanel.className = "bugreveal_field";
  body.appendChild(boardListPanel);

  async function renderBoardListSelect(integration) {
    boardListPanel.innerHTML = "";

    const loading = document.createElement("p");
    loading.className = "bugreveal_field-hint";
    loading.innerText = "Chargement des listes...";
    boardListPanel.appendChild(loading);

    let lists = [];
    let code = "REQUEST_FAILED";
    try {
      ({ lists, code } = await getBoardLists(integration));
    } catch (error) {
      console.error("Integration lists could not be loaded", error);
    }
    boardListPanel.innerHTML = "";

    if (!lists || lists.length === 0) {
      const errorMsg = document.createElement("p");
      errorMsg.className = "bugreveal_field-error";
      errorMsg.style.display = "block";
      errorMsg.innerText = listUnavailableMessage(code, integration);
      boardListPanel.appendChild(errorMsg);

      // Retrying only helps when the tool did not answer; the rest is settled
      // in the BugReveal dashboard.
      if (code === "REQUEST_FAILED" || code === "INTEGRATION_REMOTE_FAILURE" || code === null) {
        const refreshBtn = document.createElement("button");
        refreshBtn.type = "button";
        refreshBtn.id = "bugreveal_capture-refreshBoardList";
        refreshBtn.className = "bugreveal_link-btn";
        refreshBtn.innerText = "Réessayer";
        refreshBtn.onclick = () => renderBoardListSelect(integration);
        boardListPanel.appendChild(refreshBtn);
      }
      return;
    }

    const label = document.createElement("label");
    label.innerText = "Liste";
    label.htmlFor = LIST_SELECT_ID;
    boardListPanel.appendChild(label);

    const boardList = document.createElement("select");
    boardList.id = LIST_SELECT_ID;
    const option = document.createElement("option");
    option.value = "";
    option.text = "Choisir une liste";
    boardList.appendChild(option);
    lists.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.text = item.name;
      boardList.appendChild(opt);
    });
    boardListPanel.appendChild(boardList);
  }

  integrationSelect.onchange = async (e) => {
    const value = e.target.value;
    boardListPanel.innerHTML = "";
    if (value) await renderBoardListSelect(value);
  };

  return () => {
    const choice = {};
    const listSelect = boardListPanel.querySelector(`#${LIST_SELECT_ID}`);
    if (integrationSelect.value) choice.integration = integrationSelect.value;
    if (listSelect?.value) choice.list_id = listSelect.value;
    return choice;
  };
}
