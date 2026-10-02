const mongoose = require('mongoose');

const flagsOf = (user) => user?.permissions?.custom_permissions || {};

const isSeniorTrainer = (user) => flagsOf(user).can_be_senior_trainer === true;

const isFieldTrainer = (user) => flagsOf(user).can_be_trainer === true && !isSeniorTrainer(user);

const toIdString = (value) => {
  if (value == null || value === '') return '';
  if (typeof value === 'object') return String(value._id || value.id || '');
  return String(value);
};

class TrainingTeamError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const parseIdList = (values, label) => {
  if (values == null) return [];
  if (!Array.isArray(values)) {
    throw new TrainingTeamError(`${label} must be an array`);
  }

  const ids = [];
  const seen = new Set();
  values.forEach((value) => {
    const id = toIdString(value).trim();
    if (!id) return;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new TrainingTeamError('Invalid user id');
    }
    if (seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  });
  return ids;
};

const personRow = (user, selectedIds) => {
  const row = {
    _id: user._id,
    name: user.name || user.email || '',
  };
  if (selectedIds) {
    row.selected = selectedIds.has(String(user._id));
  }
  return row;
};

const splitUsers = (users = [], selectedIds = null) => {
  const selected = selectedIds
    ? new Set((selectedIds || []).map((id) => toIdString(id)))
    : null;
  const seniorTrainers = [];
  const trainers = [];

  users.forEach((user) => {
    if (!user || user.isDeleted) return;
    if (isSeniorTrainer(user)) {
      seniorTrainers.push(personRow(user, selected));
      return;
    }
    if (flagsOf(user).can_be_trainer === true) {
      trainers.push(personRow(user, selected));
    }
  });

  return { seniorTrainers, trainers };
};

const assertRoleMembers = (usersById, seniorTrainerIds, trainerIds) => {
  seniorTrainerIds.forEach((id) => {
    const user = usersById.get(id);
    if (!user || user.isDeleted || !isSeniorTrainer(user)) {
      throw new TrainingTeamError('User is not a senior trainer');
    }
  });

  trainerIds.forEach((id) => {
    const user = usersById.get(id);
    if (!user || user.isDeleted || flagsOf(user).can_be_trainer !== true) {
      throw new TrainingTeamError('User is not a trainer');
    }
  });
};

const assertCourseMembers = (courseTrainerIds, submittedIds) => {
  const allowed = new Set((courseTrainerIds || []).map((id) => toIdString(id)));
  const outsider = submittedIds.find((id) => !allowed.has(id));
  if (outsider) {
    throw new TrainingTeamError('Trainer is not assigned to this course');
  }
};

const uniqueIds = (...lists) => {
  const ids = [];
  const seen = new Set();
  lists.flat().forEach((id) => {
    const value = toIdString(id);
    if (!value || seen.has(value)) return;
    seen.add(value);
    ids.push(value);
  });
  return ids;
};

module.exports = {
  TrainingTeamError,
  isSeniorTrainer,
  isFieldTrainer,
  toIdString,
  parseIdList,
  splitUsers,
  assertRoleMembers,
  assertCourseMembers,
  uniqueIds,
};
