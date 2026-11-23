let ioRef = null;

function setClubIo(io) {
  ioRef = io;
}

function emitClubChat(clubId, payload) {
  if (!ioRef || !clubId) return;
  ioRef.to(`club:${String(clubId)}`).emit('club:chat', payload);
}

function emitClubMembership(collegeId, payload = {}) {
  if (!ioRef) return;
  const message = {
    collegeId: collegeId ? String(collegeId) : '',
    ...payload,
  };
  // Staff dashboards listen on campus rooms.
  if (collegeId) {
    ioRef.to(`club-campus:${String(collegeId)}`).emit('club:membership', message);
  }
  // Students often have no campus socket room — notify their user room so Open Club updates live.
  const studentUserId = payload.studentUserId || payload.userId;
  if (studentUserId) {
    ioRef.to(`club-user:${String(studentUserId)}`).emit('club:membership', message);
  }
}

module.exports = { setClubIo, emitClubChat, emitClubMembership };
