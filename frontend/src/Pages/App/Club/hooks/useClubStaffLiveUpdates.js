import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getClubAuthToken, readClubSessionUser } from '../../../../config/club/clubAuthSession';

const socketUrl =
  process.env.REACT_APP_WEBSOCKET_URL || process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';

/**
 * Live Club membership refresh for staff and students.
 * Students rely on club-user:{userId}; staff also join campus rooms.
 */
export function useClubStaffLiveUpdates({ enabled, campusIds, onMembershipChange }) {
  const onChangeRef = useRef(onMembershipChange);
  onChangeRef.current = onMembershipChange;

  const campusKey = (campusIds || []).map(String).filter(Boolean).sort().join(',');

  useEffect(() => {
    if (!enabled || !socketUrl) return undefined;
    const token = getClubAuthToken();
    if (!token) return undefined;

    const sessionUser = readClubSessionUser();
    const userId = String(sessionUser?._id || sessionUser?.id || '');
    if (!userId) return undefined;

    const rooms = campusKey ? campusKey.split(',') : [];
    const socket = io(socketUrl, {
      auth: { token },
      query: { userId, token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    const joinRooms = () => {
      // Personal room is also joined server-side on connect; emit is harmless if duplicated.
      rooms.forEach((id) => socket.emit('club-campus:join', id));
    };
    socket.on('connect', joinRooms);
    joinRooms();

    let timer;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        onChangeRef.current?.();
      }, 200);
    };

    socket.on('club:membership', (payload) => {
      const collegeId = String(payload?.collegeId || '');
      const forUser = String(payload?.studentUserId || payload?.userId || '');
      // Accept campus events for rooms we joined, or any event targeted at this student.
      if (forUser && forUser === userId) {
        refresh();
        return;
      }
      if (collegeId && rooms.length && !rooms.includes(collegeId)) return;
      if (!collegeId && !forUser) return;
      refresh();
    });

    return () => {
      window.clearTimeout(timer);
      rooms.forEach((id) => socket.emit('club-campus:leave', id));
      socket.off('club:membership');
      socket.disconnect();
    };
  }, [campusKey, enabled]);
}
