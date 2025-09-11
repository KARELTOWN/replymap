import moment from "moment";
import IntegrationToken from "../../models/IntegrationToken.js";
import { getKeysIntegration } from "../../utils/keys.js";
import FormData from "form-data";
import fs from "fs";
import axios from "axios";
import FeedbackPriority from "../../models/FeedbackPriority.js";

export default function integrationService() {
  const integrationLoginUrl = (project_id, integration) => {
    const result = getKeysIntegration(integration);
    let url = "";
    if (integration == "trello") {
      url =
        `https://trello.com/1/authorize?expiration=${result.expirationTokenTrello}&scope=${result.scopeTrello}&response_type=${result.trelloReturnType}&key=${result.apiTrello}&return_url=${result.returnURLTrello}` +
        "/" +
        project_id +
        `/${integration}`;
    }
    return url;
  };

  const integrationList = ["trello"];

  const allIntegrationsApiUrl = (integration) => {
    if (integration == "trello") {
      return {
        getBoardsURL: `https://api.trello.com/1/members/me/boards?fields=name,url&key={key}&token={token}`,
        getListInBoardURL: `https://api.trello.com/1/boards/{board}/lists?key={key}&token={token}&filter=open`,
        createCard: `https://api.trello.com/1/cards?key={key}&token={token}&name={name}&desc={desc}&idList={idList}`,
        createAttachement: `https://api.trello.com/1/cards/{card_id}/attachments?key={key}&token={token}`,
        getLabels: `https://api.trello.com/1/boards/{board}/labels?key={key}&token={token}`,
        getLabel: `https://api.trello.com/1/labels/{id}??key={key}&token={token}`,
        createLabel: `https://api.trello.com/1/boards/{board}/labels?name={name}&color={color}&key={key}&token={token}`,
      };
    }
  };

  const getIntegrationBoards = async (project, integration) => {
    try {
      const data = getKeysIntegration(integration);

      let storeToken = await IntegrationToken.findOne({
        project_id: project,
        integration: integration,
        expiredAt: { $gt: moment().toDate() },
      });

      let result = allIntegrationsApiUrl(integration);
      let url = result.getBoardsURL;
      if (integration == "trello") {
        url = url.replace(`{key}`, data.apiTrello);
        url = url.replace(`{token}`, storeToken.token);
      }

      let response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      const boards = await response.json();
      return { boards, default: storeToken.board };
    } catch (err) {
      console.error(err);
    }
  };

  const getIntegrationBoardLabels = async (info) => {
    try {
      const data = getKeysIntegration(info.integration);

      let storeToken = await IntegrationToken.findOne({
        project_id: info.project_id,
        integration: info.integration,
        expiredAt: { $gt: moment().toDate() },
      });

      let result = allIntegrationsApiUrl(info.integration);
      let url = result.getLabels;
      if (info.integration == "trello") {
        url = url.replace(`{key}`, data.apiTrello);
        url = url.replace(`{token}`, storeToken.token);
        url = url.replace(`{board}`, storeToken.board);
      }

      let response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      if (response.ok) {
        let labels = await response.json();
        labels = labels.filter((e) => e.name !== "");
        return labels;
      } else {
        const result = await response.json();
        console.log("Erreur récupération labels", result.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createIntegrationBoardLabel = async (info) => {
    try {
      const data = getKeysIntegration(info.integration);

      let storeToken = await IntegrationToken.findOne({
        project_id: info.project_id,
        integration: info.integration,
        expiredAt: { $gt: moment().toDate() },
      });

      let result = allIntegrationsApiUrl(info.integration);
      let url = result.createLabel;
      if (info.integration == "trello") {
        url = url.replace(`{key}`, data.apiTrello);
        url = url.replace(`{token}`, storeToken.token);
        url = url.replace(`{board}`, storeToken.board);
        url = url.replace(`{name}`, info.libelle);
        url = url.replace(`{color}`, info.color);
      }

      let response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });
      if (response.ok) {
        const labels = await response.json();
        return labels;
      } else {
        const result = await response.json();
        console.log("Erreur création label", result.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getIntegrationBoardLists = async (project, integration) => {
    try {
      const data = getKeysIntegration(integration);

      let find = await IntegrationToken.findOne({
        project_id: project,
        integration: integration,
        expiredAt: { $gt: moment().toDate() },
      });

      let result = allIntegrationsApiUrl(integration);
      let url = result.getListInBoardURL;
      if (integration == "trello") {
        url = url.replace(`{key}`, data.apiTrello);
        url = url.replace(`{token}`, find.token);
        url = url.replace(`{board}`, find.board);
      }

      let response = await fetch(url);
      const lists = await response.json();
      return lists;
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityLabel = async (card) => {
    try {
      let data = await FeedbackPriority.findById(card.priority);
      let labels = await getIntegrationBoardLabels(card);
      if (!labels || labels == undefined) {
        throw new Error("Erreur de récupération des labels");
      }
      let labelFind = labels.filter(
        (e) => e.name.toUpperCase() === data.libelle.toUpperCase()
      );
      if (labelFind.length > 0) {
        return labelFind[0];
      } else {
        card.libelle = data.libelle;
        card.color = colorList.includes(data.color) ? data.color : null;
        let newLabel = await createIntegrationBoardLabel(card);
        if (!newLabel || newLabel == undefined) {
          throw new Error("Erreur de création du label");
        } else {
          return newLabel;
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createCardIntegration = async (card) => {
    try {
      let result = allIntegrationsApiUrl(card.integration);
      const data = getKeysIntegration(card.integration);

      let find = await IntegrationToken.findOne({
        project_id: card.project_id,
        integration: card.integration,
        expiredAt: { $gt: moment().toDate() },
      });

      let url = result.createCard;

      let cardLabel = await getPriorityLabel(card);

      if (!cardLabel || cardLabel == undefined) {
        throw new Error("Erreur de récupération du label de la tâche");
      }

      if (card.integration == "trello") {
        url = url.replace(`{key}`, data.apiTrello);
        url = url.replace(`{token}`, find.token);
        url = url.replace(`{name}`, card.title);
        url = url.replace(`{desc}`, card.description);
        url = url.replace(`{idList}`, card.list_id);
      }

      let response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ idLabels: [cardLabel.id] }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json", // obligatoire
        },
      });
      if (response.ok) {
        const cardCreate = await response.json();
        if (Array.isArray(card.files) && cardCreate?.id) {
          card.files.unshift(card.file);

          let tokens = {
            apiTrello: data.apiTrello,
            token: find.token,
          };
          card.files.unshift(card.file);
          const resultCreate = await createAttachmentsToCard(
            card.integration,
            tokens,
            result.createAttachement,
            cardCreate,
            card.files
          );
          if (resultCreate === true) {
            return true;
          }
        }
      } else {
        console.error(
          `Echec création de la card dans ${card.integration}`,
          response
        );
      }
      return true;
    } catch (err) {
      console.error(err);
    }
  };

  const createAttachmentsToCard = async (
    integration,
    tokens,
    url,
    cardCreate,
    attachments
  ) => {
    try {
      for (const attach of attachments) {
        const formData = new FormData();

        if (integration == "trello") {
          url = url.replace(`{card_id}`, cardCreate.id);
          url = url.replace(`{key}`, tokens.apiTrello);
          url = url.replace(`{token}`, tokens.token);

          formData.append("name", attach.fieldname);
          formData.append("mimeType", attach.mimetype);
          formData.append("file", attach.buffer, {
            filename: attach.fieldname, // nom réel du fichier
            contentType: attach.mimetype, // type MIME
          });
        }

        const response = await axios.post(url, formData, {
          headers: formData.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });
        console.log("✅ Attachment créé ");
      }
      return true;
    } catch (err) {
      console.error("❌ Erreur Trello :", err.response?.data || err.message);
      console.error(err);
    }
  };

  const colorList = [
    "green",
    "yellow",
    "orange",
    "red",
    "purple",
    "blue",
    "sky",
    "lime",
    "pink",
    "black",
  ];

  return {
    integrationList,
    integrationLoginUrl,
    getIntegrationBoards,
    getIntegrationBoardLists,
    createCardIntegration,
    getIntegrationBoardLabels,
    createIntegrationBoardLabel,
    colorList,
  };
}
