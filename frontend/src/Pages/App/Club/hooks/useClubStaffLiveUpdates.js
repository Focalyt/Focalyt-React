import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { readClubSessionUser } from '../../../../config/club/clubAuthSession';

const socketUrl =
  process.env.REACT_APP_WEBSOCKET_URL || process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';

export function useClubStaffLiveUpdates({ enabled, campusIds, onMembershipChange }) {
  const onChangeRef = useRef(onMembershipChange);
  onChangeRef.current = onMembershipChange;

  const campusKey = (campusIds || []).map(String).filter(Boolean).sort().join(',');

  useEffect(() => {
    if (!enabled || !socketUrl || !campusKey) return undefined;
    const rooms = campusKey.split(',');
    const sessionUser = readClubSessionUser();
    const socket = io(socketUrl, {
      query: { userId: sessionUser?._id || sessionUser?.id || 'club-staff' },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    const joinRooms = () => {
      rooms.forEach((id) => socket.emit('club-campus:join', id));
    };
    socket.on('connect', joinRooms);
    joinRooms();

    let timer;
    socket.on('club:membership', (payload) => {
      const collegeId = String(payload?.collegeId || '');
      if (collegeId && !rooms.includes(collegeId)) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        onChangeRef.current?.();
      }, 200);
    });

    return () => {
      window.clearTimeout(timer);
      rooms.forEach((id) => socket.emit('club-campus:leave', id));
      socket.off('club:membership');
      socket.disconnect();
    };
  }, [campusKey, enabled]);
}
