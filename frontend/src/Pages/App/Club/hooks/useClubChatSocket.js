import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useClub } from '../../../../contexts/ClubContext';
import { getClubAuthToken } from '../../../../config/club/clubAuthSession';

const socketUrl =
  process.env.REACT_APP_WEBSOCKET_URL || process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';

export function useClubChatSocket(clubId) {
  const { appendIncomingChat, state } = useClub();
  const userId = state.currentStudent?.id;

  useEffect(() => {
    if (!clubId || !socketUrl) return undefined;
    const token = getClubAuthToken();
    if (!token) return undefined;

    const socket = io(socketUrl, {
      auth: { token },
      query: { userId: userId || 'club-user', token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    const join = () => socket.emit('club:join', clubId);
    socket.on('connect', join);
    join();

    socket.on('club:chat', (payload) => {
      if (!payload?.id || String(payload.clubId) !== String(clubId)) return;
      appendIncomingChat(payload);
    });

    return () => {
      socket.emit('club:leave', clubId);
      socket.disconnect();
    };
  }, [appendIncomingChat, clubId, userId]);
}
