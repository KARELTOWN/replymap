import { matchedData } from "express-validator";
import ApiResponse from "../../shared/http/apiResponse.js";
import { assertValid } from "../../middleware/errorHandler.js";
import projectService from "../../services/project/projectService.js";
import installationService from "../../services/project/installationService.js";
import { requestHost } from "../../shared/net/host.js";

const service = projectService();

// HTTP layer of projects and their team. Rules live in projectService.
//
// Payload shapes (`data.project`, `data.projects`, `data.members`...) are kept
// as they were, so the dashboard and the embedded widget read them unchanged.

export default function projectController() {
  const createProject = async (req, res) => {
    assertValid(req);
    const data = await service.create({ user: req.user, payload: matchedData(req) });
    return ApiResponse.created(res, { messageKey: "project.created", data });
  };

  const showProject = async (req, res) => {
    assertValid(req);
    const { id } = matchedData(req);

    // The calling website is read from the request, never from the body: it is
    // what decides whether this particular site is still allowed to run.
    const data = await service.showPublic(id, requestHost(req));
    return ApiResponse.ok(res, { messageKey: "project.fetched", data });
  };

  // "Is my script working?", answered from what the project has received.
  const getInstallation = async (req, res) => {
    assertValid(req);
    const { project_id: projectId } = matchedData(req);

    const data = await installationService.status(projectId);
    return ApiResponse.ok(res, { messageKey: "project.installationFetched", data });
  };

  // The same question asked of the website itself, on demand: the server loads
  // the page and looks for the snippet.
  const testInstallation = async (req, res) => {
    assertValid(req);
    const { project_id: projectId } = matchedData(req);

    const data = await installationService.testPage(projectId);
    return ApiResponse.ok(res, { messageKey: "project.installationTested", data });
  };

  // Switching one website off, or back on, from the project sheet.
  const updateInstalledHost = async (req, res) => {
    assertValid(req);
    const { project_id: projectId, host, blocked } = matchedData(req);

    const data = await installationService.setHostBlocked({
      user: req.user,
      projectId,
      host,
      blocked,
    });
    return ApiResponse.ok(res, { messageKey: "project.hostUpdated", data });
  };

  const getProjects = async (req, res) => {
    assertValid(req);
    const data = await service.list({ user: req.user, pagination: req.pagination });
    return ApiResponse.ok(res, { messageKey: "project.listed", data });
  };

  const filterProjects = async (req, res) => {
    assertValid(req);
    const data = await service.list({
      user: req.user,
      filters: matchedData(req, { locations: ["body"] }),
      pagination: req.pagination,
    });
    return ApiResponse.ok(res, { messageKey: "project.listed", data });
  };

  const updateProject = async (req, res) => {
    assertValid(req);
    const { project_id: projectId, ...changes } = matchedData(req);

    const data = await service.update({ user: req.user, projectId, changes });
    return ApiResponse.ok(res, { messageKey: "project.updated", data });
  };

  const inviteUser = async (req, res) => {
    assertValid(req);
    const { project_id: projectId, email } = matchedData(req);

    await service.addMember({ user: req.user, projectId, email });
    return ApiResponse.ok(res, { messageKey: "project.memberAdded" });
  };

  const quitProject = async (req, res) => {
    assertValid(req);
    const { project_id: projectId, user_id: userId } = matchedData(req);

    await service.removeMember({ user: req.user, projectId, userId });
    return ApiResponse.ok(res, { messageKey: "project.memberRemoved" });
  };

  const projectMember = async (req, res) => {
    assertValid(req);
    const { project_id: projectId } = matchedData(req);

    const data = await service.guests(projectId);
    return ApiResponse.ok(res, { messageKey: "project.membersListed", data });
  };

  const projectAllMembers = async (req, res) => {
    assertValid(req);
    const { project_id: projectId } = matchedData(req);

    const data = await service.members(projectId);
    return ApiResponse.ok(res, { messageKey: "project.membersListed", data });
  };

  const projectMembership = async (req, res) => {
    assertValid(req);
    const { project_id: projectId } = matchedData(req);

    const data = await service.membership({ user: req.user, projectId });
    return ApiResponse.ok(res, { messageKey: "project.membershipFetched", data });
  };

  return {
    createProject,
    getProjects,
    showProject,
    getInstallation,
    testInstallation,
    updateInstalledHost,
    filterProjects,
    updateProject,
    inviteUser,
    quitProject,
    projectMember,
    projectAllMembers,
    projectMembership,
  };
}
