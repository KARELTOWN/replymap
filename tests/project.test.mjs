// Project rules moved from the project controller and validators into
// projectService. Regression tests for the defects found on the way.
import test from "node:test";
import assert from "node:assert/strict";

import mongoose from "../config/mongodb.js";
import Project from "../models/Project.js";
import UserProject from "../models/UserProject.js";
import Session from "../models/Session.js";
import Events from "../models/Events.js";
import Role from "../models/Role.js";
import User from "../models/User.js";
import NotificationModel from "../models/NotificationModel.js";
import projectService from "../services/project/projectService.js";

const service = projectService();
const oid = () => new mongoose.Types.ObjectId();

const OWNER = { _id: oid(), role: null };
const MEMBER = { _id: oid(), role: null };
const PROJECT = oid();

const project = {
  _id: PROJECT,
  libelle: "Showcase",
  link: "https://client.example.com",
  created_by: OWNER._id,
  active: true,
};
let recorded = false;
let lastListFilter = null;

Role.findById = () => ({ select: () => ({ lean: async () => null }) });
NotificationModel.findOne = () => ({ lean: async () => null });
User.findById = () => ({ select: () => ({ lean: async () => null }) });

Project.findById = (id) => {
  const found = String(id) === String(PROJECT) ? project : null;
  return { select: () => ({ lean: async () => found }), lean: async () => found };
};
Project.exists = async () => null;
Project.findByIdAndUpdate = (id, { $set }) => ({
  lean: async () => Object.assign(project, $set),
});
Project.find = (filter) => {
  lastListFilter = filter;
  const chain = {
    populate: () => chain,
    sort: () => chain,
    skip: () => chain,
    limit: () => chain,
    lean: () => chain,
    exec: async () => [],
  };
  return chain;
};
Project.countDocuments = async () => 0;

UserProject.find = () => ({ distinct: () => ({ exec: async () => [PROJECT] }) });
UserProject.exists = async ({ user_id }) =>
  [String(OWNER._id), String(MEMBER._id)].includes(String(user_id)) ? { _id: oid() } : null;

Session.exists = async () => (recorded ? { _id: oid() } : null);
Events.exists = async () => null;

const expectCode = async (promise) => {
  try {
    await promise;
    return null;
  } catch (error) {
    return error.code;
  }
};

test("only the owner may edit a project", async () => {
  // The update route used to accept any authenticated account.
  assert.equal(
    await expectCode(service.update({ user: MEMBER, projectId: PROJECT, changes: { libelle: "X" } })),
    "PROJECT_OWNER_ONLY"
  );

  const { project: card } = await service.update({
    user: OWNER,
    projectId: PROJECT,
    changes: { libelle: "Renamed" },
  });
  assert.equal(card.libelle, "Renamed");
  assert.equal(card.creator, true);
});

test("once data was recorded, the name may change but the link may not", async () => {
  // The validator used to refuse every update as soon as one session existed.
  recorded = true;

  const { project: card } = await service.update({
    user: OWNER,
    projectId: PROJECT,
    changes: { libelle: "Still editable" },
  });
  assert.equal(card.libelle, "Still editable");

  assert.equal(
    await expectCode(
      service.update({ user: OWNER, projectId: PROJECT, changes: { link: "https://other.example.com" } })
    ),
    "PROJECT_LINK_LOCKED"
  );
  recorded = false;
});

test("fields outside the editable ones are ignored", async () => {
  await service.update({
    user: OWNER,
    projectId: PROJECT,
    changes: { created_by: MEMBER._id, active: false },
  });
  assert.equal(String(project.created_by), String(OWNER._id));
  assert.equal(project.active, true);
});

test("a search term is matched literally", async () => {
  await service.list({
    user: MEMBER,
    filters: { search: "(a+)+$" },
    pagination: { skip: 0, limit: 10, page: 1 },
  });
  assert.equal(lastListFilter.$or[0].libelle.$regex, "\\(a\\+\\)\\+\\$");
});

test("a member may leave, but only the owner removes someone else", async () => {
  assert.equal(
    await expectCode(service.removeMember({ user: MEMBER, projectId: PROJECT, userId: oid() })),
    "PROJECT_OWNER_ONLY"
  );
  assert.equal(
    await expectCode(service.removeMember({ user: OWNER, projectId: PROJECT })),
    "PROJECT_OWNER_CANNOT_LEAVE"
  );

  UserProject.deleteMany = async () => ({ deletedCount: 1 });
  assert.equal(await service.removeMember({ user: MEMBER, projectId: PROJECT }), null);
});
