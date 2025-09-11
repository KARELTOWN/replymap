import { matchedData } from "express-validator";
import integrationService from "../../services/integration/integrationService.js";
const {
  integrationList,
  integrationLoginUrl,
  getIntegrationBoards,
  getIntegrationBoardLists,
  getIntegrationBoardLabels,
  createIntegrationBoardLabel,
} = integrationService();
import IntegrationToken from "../../models/IntegrationToken.js";
import Project from "../../models/Project.js";
import moment from "moment";

export default function integrationController() {
  const getLoginURLs = async (req, res, next) => {
    let data = {};
    const { name, project } = req.query;
    if (!name || !project) {
      return res.status(404).json({
        message: "Informations non valide",
      });
    }

    let exist = await Project.exists({ _id: project });

    if (!exist) {
      return res.status(500).json({
        message: "Projet invalide",
      });
    }

    const integrationExist = await IntegrationToken.findOne({
      project_id: project,
      integration: name,
    });

    if (integrationExist) {
      if (!integrationExist.isExpired()) {
        return res.status(500).json({
          message: `${name} est déjà connecté au projet`,
        });
      }
    }

    if (!integrationList.includes(name)) {
      return res.status(404).json({
        message: `${name} est une intégration inconnue`,
      });
    }

    const url = integrationLoginUrl(project, name);
    data[name] = url;

    return res.status(200).json({
      message: "Links",
      data: { ...data },
    });
  };

  const storeToken = async (req, res, next) => {
    try {
      const data = matchedData(req);

      const result = await IntegrationToken.create({
        integration: data.integration,
        project_id: data.project_id,
        token: data.token,
        expiredAt: moment().add("30", "days").toDate(),
        default: true,
      });

      delete result.token;

      return res.status(200).json({
        message: "Token store",
        data: { ...result },
      });
    } catch (err) {
      next(err);
    }
  };

  const updateIntegration = async (req, res, next) => {
    try {
      const data = matchedData(req);

      const result = await IntegrationToken.findOne({
        integration: data.integration,
        project_id: data.project_id,
        expiredAt: { $gt: moment().toDate() },
      });
      result.board = data.board;
      await result.save();

      delete result.token;

      return res.status(200).json({
        message: "Intégration modifiée",
        data: { ...result },
      });
    } catch (err) {
      next(err);
    }
  };

  const getToken = async (req, res, next) => {
    try {
      const data = matchedData(req);
      const token = await IntegrationToken.findOne({
        integration: data.integration,
        project_id: data.project_id,
        expiredAt: { $gt: moment().toDate() },
      })
        .select("token")
        .exec();

      return res.status(200).json({
        message: "Token store",
        data: token,
      });
    } catch (err) {
      next(err);
    }
  };

  const getBoards = async (req, res, next) => {
    try {
      const data = matchedData(req);
      const result = await getIntegrationBoards(
        data.project_id,
        data.integration
      );
      return res.status(200).json({
        message: "BOARDS GET",
        data: { boards: result.boards, default: result.default },
      });
    } catch (err) {
      next(err);
    }
  };

  const getBoardLists = async (req, res, next) => {
    try {
      const data = matchedData(req);

      const lists = await getIntegrationBoardLists(
        data.project_id,
        data.integration
      );
      return res.status(200).json({
        message: "LISTS GET",
        data: lists,
      });
    } catch (err) {
      next(err);
    }
  };

  const getBoardLabels = async (req, res, next) => {
    try {
      const data = matchedData(req);
      console.log("data", data);
      const labels = await getIntegrationBoardLabels(data);
      return res.status(200).json({
        message: "LABELS GET",
        data: labels,
      });
    } catch (err) {
      next(err);
    }
  };

  const createBoardLabel = async (req, res, next) => {
    try {
      const data = matchedData(req);

      const label = await createIntegrationBoardLabel(data);
      if (label) {
        return res.status(200).json({
          message: "LABELS CREATE",
          data: label,
        });
      }
      return res.status(500).json({
        message: "Une erreur s'est produite",
      });
    } catch (err) {
      next(err);
    }
  };

  return {
    getLoginURLs,
    storeToken,
    getToken,
    getBoards,
    getBoardLists,
    updateIntegration,
    getBoardLabels,
    createBoardLabel,
  };
}
