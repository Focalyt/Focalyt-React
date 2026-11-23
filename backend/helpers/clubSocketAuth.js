const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User, College, Club, ClubMember, ClubStaffAssignment, CandidateProfile } = require('../controllers/models');
const { mobileLookupValues } = require('./b2cDuplicate');

const APPROVED_MEMBER_STATUSES = ['joined', 'approved'];

const isValidObjectId = (val) =>
  Boolean(val && mongoose.Types.ObjectId.isValid(String(val)) && /^[a-fA-F0-9]{24}$/.test(String(val)));

function readSocketToken(socket) {
  return (
    socket?.handshake?.auth?.token ||
    socket?.handshake?.query?.token ||
    socket?.handshake?.headers?.['x-auth'] ||
    null
  );
}

async function authenticateSocketUser(socket) {
  const token = readSocketToken(socket);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.MIPIE_JWT_SECRET);
    const user = await User.findById(decoded.id)
      .select('_id role permissions status isDeleted email mobile collegeId _college')
      .lean();
    if (!user || user.isDeleted || user.status === false) return null;
    return user;
  } catch {
    return null;
  }
}

async function userCampusIds(user) {
  if (!user?._id) return [];
  const roleNum = Number(user.role);
  const ids = new Set();

  if (roleNum === 0) {
    const colleges = await College.find({ isDeleted: { $ne: true } }).select('_id').limit(500).lean();
    colleges.forEach((row) => ids.add(String(row._id)));
    return [...ids];
  }

  if (roleNum === 2 || roleNum === 5) {
    const permType = user?.permissions?.permission_type;
    const custom = user?.permissions?.custom_permissions || {};
    const isAdmin =
      roleNum === 5 ||
      permType === 'Admin' ||
      custom.can_be_club_admin ||
      custom.can_be_club_sse ||
      custom.can_be_club_se;
    if (!isAdmin && permType !== 'Admin') {
      // Institute users without club staff flags still may be concern persons.
    }
    const colleges = await College.find({
      isDeleted: { $ne: true },
      // _concernPerson is [{ _id, defaultAdmin }] — never `{ _concernPerson: userId }` (Document cast error).
      _concernPerson: { $elemMatch: { _id: user._id } },
    })
      .select('_id')
      .lean();
    colleges.forEach((row) => ids.add(String(row._id)));
    if (isValidObjectId(user.collegeId)) ids.add(String(user.collegeId));
    if (isValidObjectId(user._college)) ids.add(String(user._college));
    return [...ids];
  }

  if (roleNum === 1) {
    const assignments = await ClubStaffAssignment.find({ userId: user._id }).select('collegeId').lean();
    assignments.forEach((row) => {
      if (isValidObjectId(row.collegeId)) ids.add(String(row.collegeId));
    });
    return [...ids];
  }

  const or = [];
  if (user._id) or.push({ _id: user._id });
  const mobiles = mobileLookupValues(user.mobile);
  if (mobiles.length) or.push({ mobile: { $in: mobiles } });
  if (user.email) or.push({ email: String(user.email).toLowerCase().trim() });
  if (or.length) {
    const profile = await CandidateProfile.findOne({ isDeleted: { $ne: true }, $or: or })
      .select('college')
      .lean();
    if (isValidObjectId(profile?.college)) ids.add(String(profile.college));
  }
  if (isValidObjectId(user.collegeId)) ids.add(String(user.collegeId));
  return [...ids];
}

async function assertCanJoinCampusRoom(user, collegeId) {
  if (!user || !isValidObjectId(collegeId)) return false;
  if (Number(user.role) === 0) return true;
  const campuses = await userCampusIds(user);
  return campuses.includes(String(collegeId));
}

async function assertCanJoinClubRoom(user, clubId) {
  if (!user || !isValidObjectId(clubId)) return false;
  if (Number(user.role) === 0) return true;

  const club = await Club.findOne({ _id: clubId, isDeleted: { $ne: true } })
    .select('_id collegeId')
    .lean();
  if (!club) return false;

  const member = await ClubMember.findOne({
    clubId: club._id,
    studentUserId: user._id,
    status: { $in: APPROVED_MEMBER_STATUSES },
  })
    .select('_id')
    .lean();
  if (member) return true;

  return assertCanJoinCampusRoom(user, club.collegeId);
}

function isAllowedClubMediaUrl(raw, allowedHosts = []) {
  const value = String(raw || '').trim();
  if (!value) return true;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  const host = String(parsed.hostname || '').toLowerCase();
  if (!host) return false;
  const defaults = [
    'localhost',
    '127.0.0.1',
    'amazonaws.com',
    's3.amazonaws.com',
    'digitaloceanspaces.com',
    'cloudfront.net',
    'focalyt.com',
  ];
  const hosts = [...defaults, ...allowedHosts.map((h) => String(h || '').toLowerCase()).filter(Boolean)];
  return hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

module.exports = {
  readSocketToken,
  authenticateSocketUser,
  userCampusIds,
  assertCanJoinCampusRoom,
  assertCanJoinClubRoom,
  isAllowedClubMediaUrl,
  isValidObjectId,
};
