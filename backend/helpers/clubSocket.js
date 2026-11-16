let ioRef = null;

function setClubIo(io) {
  ioRef = io;
}

function emitClubChat(clubId, payload) {
  if (!ioRef || !clubId) return;
  ioRef.to(`club:${String(clubId)}`).emit('club:chat', payload);
}

function emitClubMembership(collegeId, payload = {}) {
  if (!ioRef || !collegeId) return;
  ioRef.to(`club-campus:${String(collegeId)}`).emit('club:membership', {
    collegeId: String(collegeId),
    ...payload,
  });
}

module.exports = { setClubIo, emitClubChat, emitClubMembership };
