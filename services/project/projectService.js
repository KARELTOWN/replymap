import crypto from "crypto";
import moment from "moment";
import * as projectRepository from "../../repositories/projectRepository.js";
import * as userRepository from "../../repositories/userRepository.js";
import * as sessionRepository from "../../repositories/sessionRepository.js";
import * as eventRepository from "../../repositories/eventRepository.js";
import { AppError } from "../../shared/errors/appError.js";
import { escapeRegex } from "../../shared/text/escapeRegex.js";
import { projectScope } from "../access/accessService.js";
import { isHostBlocked } from "./installationService.js";
import notificationService from "../notification/notificationService.js";

const { sendMailNotification } = notificationService();

// Projects and their team.
//
// A project belongs to the account that created it: only that owner edits it,
// invites members or removes them. Members see the project, its sessions and
// its feedback, and may leave feedback through the widget.

const UPDATABLE_FIELDS = ["libelle", "link", "track", "allow_guest_feedback"];

const sameId = (left, right) => String(left) === String(right);

const creatorId = (project) => project.created_by?._id ?? project.created_by;

// Shape shared by creation and update, read as is by the dashboard.
const toCard = (project, user) => ({
  _id: project._id,
  libelle: project.libelle,
  link: project.link,
  active: project.active,
  createdAt: project.createdAt,
  tracking_code: project.tracking_code,
  track: project.track,
  allow_guest_feedback: project.allow_guest_feedback === true,
  creator: sameId(creatorId(project), user._id),
});

const dateRange = ({ start_date: start, end_date: end }) => {
  if (start && end) return { $gte: moment(start).toDate(), $lte: moment(end).toDate() };
  if (start) return { $gte: moment(start).toDate() };
  if (end) return { $lte: moment(end).toDate() };
  return null;
};

const contact = (user) => ({
  _id: user._id,
  firstname: user.firstname,
  lastname: user.lastname,
  email: user.email,
});

// Notifications never block the request that triggered them.
const notifyInBackground = (label, promise) =>
  promise.catch((error) => console.error(`Notification failed (${label}):`, error));

export default function projectService() {
  const loadOwnedProject = async (user, projectId) => {
    const project = await projectRepository.findOwner(projectId);
    if (!project) throw new AppError("PROJECT_NOT_FOUND");
    if (!sameId(project.created_by, user._id)) throw new AppError("PROJECT_OWNER_ONLY");
    return project;
  };

  // --- Projects ---------------------------------------------------------------

  const create = async ({ user, payload }) => {
    if (await projectRepository.existsWithLink(payload.link, user._id)) {
      throw new AppError("PROJECT_LINK_EXISTS");
    }

    const project = await projectRepository.create({
      libelle: payload.libelle,
      link: payload.link,
      tracking_id: crypto.randomUUID(),
      created_by: user._id,
    });
    await projectRepository.addMember(user._id, project._id);

    notifyInBackground(
      "project created",
      sendMailNotification({
        receivers: [contact(user)],
        params: { libelle: project.libelle },
        model_name: "CP",
      })
    );

    return { project: toCard(project, user) };
  };

  // Read by the widget before it starts: public, so only what it needs.
  //
  // `host` is the website asking. A site switched off from the project sheet is
  // told the project is inactive, which is how the widget stops itself: the
  // script often cannot be removed from the page by the person who wants it
  // gone, so it has to be able to shut down on its own.
  const showPublic = async (projectId, host = null) => {
    const project = await projectRepository.findPublicSettings(projectId);
    if (!project) throw new AppError("PROJECT_NOT_FOUND");

    const blocked = host ? isHostBlocked(project, host) : false;
    return {
      libelle: project.libelle,
      link: project.link,
      active: project.active === true && !blocked,
      track: project.track,
      // The widget needs to know whether to offer the form to a visitor with
      // no account: without it, it would have to try and read the refusal.
      allow_guest_feedback: project.allow_guest_feedback === true,
    };
  };

  const list = async ({ user, filters = {}, pagination }) => {
    const { skip, limit, page } = pagination;
    const filter = { _id: await projectScope(user) };

    if (filters.search) {
      const pattern = { $regex: escapeRegex(filters.search), $options: "i" };
      filter.$or = [{ libelle: pattern }, { link: pattern }];
    }
    const createdAt = dateRange(filters);
    if (createdAt) filter.createdAt = createdAt;

    const [projects, total] = await Promise.all([
      projectRepository.list({ filter, skip, limit }),
      projectRepository.count(filter),
    ]);

    return {
      projects: projects.map((project) => ({
        ...project,
        creator: sameId(creatorId(project), user._id),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  };

  // The link identifies the tracked website: once sessions or events were
  // recorded under it, changing it would mix two websites in one history.
  const update = async ({ user, projectId, changes }) => {
    await loadOwnedProject(user, projectId);
    const current = await projectRepository.findById(projectId);

    const accepted = Object.fromEntries(
      UPDATABLE_FIELDS.filter((field) => changes[field] !== undefined).map((field) => [
        field,
        changes[field],
      ])
    );

    if (accepted.link !== undefined && accepted.link !== current.link) {
      if (await projectRepository.existsWithLinkElsewhere(accepted.link, user._id, projectId)) {
        throw new AppError("PROJECT_LINK_EXISTS");
      }
      const [hasSessions, hasEvents] = await Promise.all([
        sessionRepository.existsInProject(projectId),
        eventRepository.existsInProject(projectId),
      ]);
      if (hasSessions || hasEvents) throw new AppError("PROJECT_LINK_LOCKED");
    }

    if (
      accepted.libelle !== undefined &&
      (await projectRepository.existsWithNameElsewhere(accepted.libelle, user._id, projectId))
    ) {
      throw new AppError("PROJECT_NAME_EXISTS");
    }

    const project = await projectRepository.updateById(projectId, accepted);
    return { project: toCard(project, user) };
  };

  // --- Team -------------------------------------------------------------------

  // Adding a member is what allows someone to leave feedback: no anonymous
  // feedback is accepted.
  const addMember = async ({ user, projectId, email }) => {
    await loadOwnedProject(user, projectId);

    const invited = await userRepository.findByEmail(email);
    if (!invited) throw new AppError("USER_NOT_FOUND");
    if (!(invited.email_verified === true && invited.is_active === true)) {
      throw new AppError("USER_INACTIVE");
    }
    if (await projectRepository.isMember(invited._id, projectId)) {
      throw new AppError("PROJECT_MEMBER_EXISTS");
    }

    await projectRepository.addMember(invited._id, projectId);
    notifyInBackground("member added", notifyMemberAdded(projectId, invited));
    return null;
  };

  // Leaving a project, or removing someone from it. Removing another member is
  // reserved to the owner, who cannot leave their own project.
  const removeMember = async ({ user, projectId, userId = null }) => {
    const project = await projectRepository.findOwner(projectId);
    if (!project) throw new AppError("PROJECT_NOT_FOUND");

    const targetId = userId || user._id;
    const isSelf = sameId(targetId, user._id);
    const isOwner = sameId(project.created_by, user._id);

    if (!isSelf && !isOwner) throw new AppError("PROJECT_OWNER_ONLY");
    if (isSelf && isOwner) throw new AppError("PROJECT_OWNER_CANNOT_LEAVE");

    const removed = await projectRepository.removeMember(targetId, projectId);
    if (removed.deletedCount === 0) throw new AppError("PROJECT_MEMBER_MISSING");

    notifyInBackground("member removed", notifyMemberRemoved(projectId, targetId));
    return null;
  };

  // Members other than the owner: the people the owner may remove.
  const guests = async (projectId) => {
    const project = await projectRepository.findOwner(projectId);
    if (!project) throw new AppError("PROJECT_NOT_FOUND");
    return projectRepository.membersOf(projectId, project.created_by);
  };

  // Access is enforced upstream by requireProjectMember, since the list
  // exposes the team's email addresses.
  const members = async (projectId) => ({
    members: await projectRepository.membersOf(projectId),
    member_is_in_project: true,
  });

  // The widget only needs a yes or no: nothing about the team is disclosed.
  const membership = async ({ user, projectId }) => ({
    member: await projectRepository.isMember(user._id, projectId),
  });

  // --- Notifications ----------------------------------------------------------

  const notifyMemberAdded = async (projectId, invited) => {
    const project = await projectRepository.findById(projectId);
    if (!project) return false;

    const params = {
      libelle: project.libelle,
      firstname: invited.firstname,
      lastname: invited.lastname,
    };
    await sendMailNotification({ receivers: [contact(invited)], params, model_name: "AUP-I" });

    const team = await projectRepository.membersOf(projectId, invited._id);
    await sendMailNotification({ receivers: team, params, model_name: "AUP" });
    return true;
  };

  const notifyMemberRemoved = async (projectId, removedUserId) => {
    const [project, removedUser] = await Promise.all([
      projectRepository.findById(projectId),
      userRepository.findProfile(removedUserId),
    ]);
    if (!project || !removedUser) return false;

    const params = {
      libelle: project.libelle,
      firstname: removedUser.firstname,
      lastname: removedUser.lastname,
    };
    await sendMailNotification({ receivers: [contact(removedUser)], params, model_name: "QP-I" });

    const team = await projectRepository.membersOf(projectId);
    await sendMailNotification({ receivers: team, params, model_name: "QP" });
    return true;
  };

  return {
    create,
    showPublic,
    list,
    update,
    addMember,
    removeMember,
    guests,
    members,
    membership,
  };
}
