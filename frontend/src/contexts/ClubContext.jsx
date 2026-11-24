import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { clubService } from '../services/club/clubService';
import { clubCmsApi } from '../services/club/clubCmsApi';
import { emptyLiveCmsState, isLiveMongoId, mapLiveCmsToState } from '../services/club/clubLiveState';
import {
  isLiveClubMode,
  isMainInstituteAdmin,
  isStaffClubMode,
  readAssignedCollegesFromSession,
} from '../config/club/clubAuthSession';
import { ROLE_LABELS, ROLES } from '../config/club/roles';
import { studentCanActInClub } from '../config/club/membership';
import { useClubStaffLiveUpdates } from '../Pages/App/Club/hooks/useClubStaffLiveUpdates';

const CMS_ROLE_MAP = {
  club_admin: ROLES.CLUB_ADMIN,
  clubadmin: ROLES.CLUB_ADMIN,
  senior_sales_engineer: ROLES.SENIOR_SALES_ENGINEER,
  sse: ROLES.SENIOR_SALES_ENGINEER,
  sales_engineer: ROLES.SALES_ENGINEER,
  se: ROLES.SALES_ENGINEER,
  institute: ROLES.INSTITUTE,
  student: ROLES.STUDENT,
};

const ClubContext = createContext(undefined);

export const ClubProvider = ({ children, mode = 'student', basePath = '/candidate/club' }) => {
  const isLiveMode = isLiveClubMode(mode);
  const isStaffPortal = isStaffClubMode(mode);
  const [cmsStatus, setCmsStatus] = useState(isLiveMode ? 'loading' : 'ready');
  const [cmsError, setCmsError] = useState('');
  const [cmsRole, setCmsRole] = useState(null);
  const [livePermissions, setLivePermissions] = useState(null);
  const [livePermissionMatrix, setLivePermissionMatrix] = useState(null);
  const [managesAllCampuses, setManagesAllCampuses] = useState(false);
  const [isMainInstituteAdminLive, setIsMainInstituteAdminLive] = useState(() => isMainInstituteAdmin());
  const [assignedColleges, setAssignedColleges] = useState(() => readAssignedCollegesFromSession());
  const [state, setState] = useState(() => {
    if (isLiveMode) {
      return emptyLiveCmsState(readAssignedCollegesFromSession());
    }
    const loaded = clubService.loadState();
    try {
      const rawUser = sessionStorage.getItem('user');
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      const candidateName =
        parsedUser?.name || localStorage.getItem('candidate') || localStorage.getItem('name');
      const candidateEmail = parsedUser?.email;
      if (candidateName && mode === 'student') {
        return {
          ...loaded,
          currentStudent: {
            ...loaded.currentStudent,
            name: candidateName,
            email: candidateEmail || loaded.currentStudent.email,
          },
        };
      }
    } catch {
      // ignore storage parse errors
    }
    return loaded;
  });
  const [toasts, setToasts] = useState([]);

  const staffFallbackRole =
    mode === 'company' ? ROLES.SALES_ENGINEER : mode === 'club_admin' ? ROLES.CLUB_ADMIN : ROLES.INSTITUTE;

  const activeRole = useMemo(() => {
    if (isLiveMode && cmsRole && CMS_ROLE_MAP[cmsRole]) {
      const mapped = CMS_ROLE_MAP[cmsRole];
      if (mapped === ROLES.STUDENT && isStaffPortal) return staffFallbackRole;
      if (mapped !== ROLES.STUDENT && mode === 'student') return ROLES.STUDENT;
      return mapped;
    }
    if (mode === 'student') return ROLES.STUDENT;
    return staffFallbackRole;
  }, [cmsRole, isLiveMode, isStaffPortal, mode, staffFallbackRole]);

  const assignedCollegesRef = useRef(assignedColleges);
  assignedCollegesRef.current = assignedColleges;

  const refreshLiveCms = useCallback(async (collegeId) => {
    if (!isLiveMode) return false;
    setCmsStatus((prev) => (prev === 'ready' ? 'ready' : 'loading'));
    setCmsError('');
    try {
      const sessionCampusId = collegeId || readAssignedCollegesFromSession()[0]?._id;
      const payload = await clubCmsApi.bootstrap(sessionCampusId);
      if (!payload?.status) {
        throw new Error(payload?.message || 'Failed to load Club Admin data');
      }
      if (isStaffPortal && payload.cmsRole === 'student') {
        throw new Error(
          'Club Admin opened with a student login token. Sign in again as Institute / Club Admin.'
        );
      }
      if (mode === 'student' && payload.cmsRole && payload.cmsRole !== 'student') {
        throw new Error('Student Club opened with an Institute login. Sign in again as a candidate.');
      }
      const nextManagesAll = false;
      const campusPool = payload.campuses || [];
      const nextColleges = campusPool.length ? campusPool : assignedCollegesRef.current;
      setAssignedColleges((prev) => {
        const prevIds = (prev || []).map((c) => String(c._id || c.id)).join(',');
        const nextIds = (nextColleges || []).map((c) => String(c._id || c.id)).join(',');
        return prevIds === nextIds ? prev : nextColleges;
      });
      setCmsRole(payload.cmsRole || null);
      setLivePermissions(payload.permissions || null);
      setLivePermissionMatrix(payload.permissionMatrix || null);
      setManagesAllCampuses(nextManagesAll);
      setIsMainInstituteAdminLive(
        Boolean(payload.currentUser?.isMainInstituteAdmin) || isMainInstituteAdmin()
      );
      setState(
        mapLiveCmsToState(
          null,
          {
            ...payload,
            managesAllCampuses: nextManagesAll,
          },
          nextColleges
        )
      );
      setCmsStatus('ready');
      const campusId = nextColleges[0]?._id || nextColleges[0]?.id;
      if (payload.cmsRole && payload.cmsRole !== 'student' && isLiveMongoId(campusId)) {
        clubCmsApi
          .listStudents(campusId)
          .then((res) => {
            if (!res?.status || !Array.isArray(res.students)) return;
            setState((prev) => ({
              ...prev,
              eligibleStudents: res.students.map((student) => ({
                studentId: String(student.studentUserId || student._id || ''),
                studentName: student.studentName || student.name || '',
                studentEmail: student.studentEmail || student.email || '',
                department: student.department || 'Campus Student',
              })),
            }));
          })
          .catch(() => {});
      }
      return true;
    } catch (err) {
      setCmsRole(null);
      setLivePermissions(null);
      setLivePermissionMatrix(null);
      setManagesAllCampuses(false);
      setIsMainInstituteAdminLive(isMainInstituteAdmin());
      setState(emptyLiveCmsState(assignedCollegesRef.current));
      setCmsStatus('error');
      const networkFail = !err.response && /network error/i.test(err.message || '');
      setCmsError(
        networkFail
          ? 'The Club API did not respond. Backend or MongoDB dropped before campus clubs could load.'
          : err.response?.data?.message || err.message || 'Failed to load Club data'
      );
      return false;
    }
  }, [isLiveMode, isStaffPortal, mode]);

  useEffect(() => {
    refreshLiveCms();
  }, [refreshLiveCms]);

  useClubStaffLiveUpdates({
    // Students need this too — otherwise approved joins stay pending until a manual refresh.
    enabled: isLiveMode,
    campusIds: (assignedColleges || []).map((college) => college._id || college.id),
    onMembershipChange: refreshLiveCms,
  });

  // While a student has pending join requests, poll lightly in case the socket miss fires.
  useEffect(() => {
    if (!isLiveMode || isStaffPortal || mode !== 'student') return undefined;
    const hasPending = (state.clubs || []).some((club) =>
      (club.members || []).some(
        (member) =>
          String(member.studentId) === String(state.currentStudent?.id) &&
          String(member.status || '').toLowerCase() === 'pending'
      )
    );
    if (!hasPending) return undefined;
    const timer = window.setInterval(() => {
      refreshLiveCms();
    }, 12000);
    return () => window.clearInterval(timer);
  }, [
    isLiveMode,
    isStaffPortal,
    mode,
    refreshLiveCms,
    state.clubs,
    state.currentStudent?.id,
  ]);

  const getClubPath = useCallback(
    (subPath = '') => {
      const cleanBase = (basePath || '/candidate/club').replace(/\/$/, '');
      const cleanSub = String(subPath).replace(/^\//, '');
      return cleanSub ? `${cleanBase}/${cleanSub}` : cleanBase;
    },
    [basePath]
  );

  useEffect(() => {
    if (isLiveMode) return undefined;
    clubService.saveState(state);
    return undefined;
  }, [isLiveMode, mode, state]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((title, description, tone = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const getMembershipStatus = useCallback(
    (clubId) => {
      const club = state.clubs.find((c) => c.id === clubId);
      if (!club) return 'none';
      return clubService.getStudentMembershipStatus(club, state.currentStudent);
    },
    [state.clubs, state.currentStudent]
  );

  const isActivitySaved = useCallback(
    (activityId) => {
      return state.currentStudent.savedActivityIds.includes(activityId);
    },
    [state.currentStudent.savedActivityIds]
  );

  const isActivityRegistered = useCallback(
    (activityId) => {
      const activity = state.activities.find((a) => a.id === activityId);
      if (!activity) return false;
      return activity.registrations.some((r) => r.studentId === state.currentStudent.id);
    },
    [state.activities, state.currentStudent.id]
  );

  const joinOrRequestClub = useCallback(
    (clubId, note) => {
      const club = state.clubs.find((c) => c.id === clubId);
      if (!club) return;
      if (isLiveMode) {
        if (!isLiveMongoId(clubId)) {
          notify('Cannot join', 'This club is not saved on the server.', 'info');
          return;
        }
        clubCmsApi
          .requestMembership(clubId, note)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(
              res.duplicate || res.alreadyMember
                ? `Request already pending for ${club.name}`
                : `Request sent to ${club.name}`,
              'Join Club submits a membership request. You become a member only after an authorized reviewer approves.'
            );
            return refreshLiveCms();
          })
          .catch((err) => notify('Cannot join', err.response?.data?.message || err.message, 'info'));
        return;
      }
      const { nextState, status, alreadyMember, ok, error } = clubService.joinOrRequestClub(
        state,
        clubId,
        note,
        activeRole
      );
      if (!ok) {
        notify('Cannot join', error, 'info');
        return;
      }
      setState(nextState);
      if (alreadyMember) {
        notify(
          status === 'approved' || status === 'joined' ? `Already in ${club.name}` : 'Request already pending',
          'Your club list in My clubs already shows this.',
          'info'
        );
      } else {
        notify(
          `Request sent to ${club.name}`,
          'Club Admin will review this. You join only after they approve.'
        );
      }
    },
    [activeRole, isLiveMode, notify, refreshLiveCms, state]
  );

  const leaveOrCancelClub = useCallback(
    (clubId) => {
      const club = state.clubs.find((c) => c.id === clubId);
      const currentStatus = getMembershipStatus(clubId);
      if (isLiveMode) {
        if (!isLiveMongoId(clubId)) {
          notify('Cannot update', 'This club is not saved on the server.', 'info');
          return;
        }
        clubCmsApi
          .leaveMembership(clubId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(
              currentStatus === 'pending'
                ? `Cancelled request for ${club?.name || 'club'}`
                : `Left ${club?.name || 'club'}`,
              currentStatus === 'pending'
                ? 'Club Admin will no longer see this request.'
                : 'You are no longer a member. The admin roster is updated.',
              'info'
            );
            return refreshLiveCms();
          })
          .catch((err) => notify('Cannot leave', err.response?.data?.message || err.message, 'info'));
        return;
      }
      const nextState = clubService.leaveOrCancelClub(state, clubId);
      setState(nextState);
      if (club) {
        notify(
          currentStatus === 'pending'
            ? `Cancelled request for ${club.name}`
            : `Left ${club.name}`,
          'Your list in My clubs has been updated.',
          'info'
        );
      }
    },
    [getMembershipStatus, isLiveMode, notify, refreshLiveCms, state]
  );

  const toggleSaveActivity = useCallback(
    (activityId) => {
      const activity = state.activities.find((a) => a.id === activityId);
      const { nextState, saved } = clubService.toggleSaveActivity(state, activityId);
      setState(nextState);
      if (isLiveMode) {
        clubCmsApi
          .toggleSaveActivity(activityId)
          .then(() => refreshLiveCms())
          .catch((err) => notify('Could not save activity', err.response?.data?.message || err.message, 'info'));
      }
      if (activity) {
        notify(
          saved ? 'Saved to My clubs' : 'Removed from Saved',
          saved
            ? `"${activity.title}" is bookmarked in your Saved Activities.`
            : `"${activity.title}" was removed from Saved Activities.`,
          'info'
        );
      }
    },
    [isLiveMode, notify, refreshLiveCms, state]
  );

  const registerForActivity = useCallback(
    (activityId) => {
      const activity = state.activities.find((a) => a.id === activityId);
      if (!activity) return;
      // Students: browse campus events freely; join only after club approval.
      if (
        mode === 'student' &&
        !studentCanActInClub(state.clubs, state.currentStudent, activity.clubId)
      ) {
        notify(
          'Join the club first',
          'Request to join this club and wait for approval before registering for its events.',
          'info'
        );
        return;
      }
      if (isLiveMode && isLiveMongoId(activityId)) {
        clubCmsApi
          .registerActivity(activityId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            if (res.duplicate) {
              notify(
                'Already registered',
                `You are already registered for "${activity.title}".`,
                'info'
              );
            } else {
              notify(
                'Registration confirmed!',
                `Your seat for "${activity.title}" is saved. See it in My clubs.`
              );
            }
            return refreshLiveCms();
          })
          .catch((err) => notify('Cannot register', err.response?.data?.message || err.message, 'info'));
        return;
      }
      const { nextState, duplicate } = clubService.registerForActivity(state, activityId);
      setState(nextState);
      if (duplicate) {
        notify(
          'Already registered',
          `You are already registered for "${activity.title}".`,
          'info'
        );
      } else {
        notify(
          'Registration confirmed!',
          `Your seat for "${activity.title}" is saved. See it in My clubs.`
        );
      }
    },
    [isLiveMode, mode, notify, refreshLiveCms, state]
  );

  const cancelActivityRegistration = useCallback(
    (activityId) => {
      const activity = state.activities.find((a) => a.id === activityId);
      if (isLiveMode && isLiveMongoId(activityId)) {
        clubCmsApi
          .cancelActivityRegistration(activityId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            if (activity) {
              notify(
                'Registration cancelled',
                `Your registration for "${activity.title}" has been cancelled.`,
                'info'
              );
            }
            return refreshLiveCms();
          })
          .catch((err) => notify('Cannot cancel', err.response?.data?.message || err.message, 'info'));
        return;
      }
      const nextState = clubService.cancelActivityRegistration(state, activityId);
      setState(nextState);
      if (activity) {
        notify(
          'Registration cancelled',
          `Your registration for "${activity.title}" has been cancelled.`,
          'info'
        );
      }
    },
    [isLiveMode, notify, refreshLiveCms, state]
  );

  const toggleStudentInterest = useCallback(
    (interest) => {
      setState((prev) => clubService.toggleStudentInterest(prev, interest));
      if (isLiveMode) {
        clubCmsApi
          .toggleStudentInterest(interest)
          .catch((err) => notify('Could not update interests', err.response?.data?.message || err.message, 'info'));
      }
    },
    [isLiveMode, notify]
  );

  const submitClubSuggestion = useCallback(
    (payload) => {
      if (isLiveMode) {
        return clubCmsApi
          .createSuggestion(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(
              'Club idea submitted!',
              `"${payload.name}" is now in My clubs under Club ideas.`
            );
            return refreshLiveCms();
          })
          .catch((err) => {
            notify('Could not submit idea', err.response?.data?.message || err.message, 'info');
            throw err;
          });
      }
      setState((prev) => clubService.submitClubSuggestion(prev, payload));
      notify(
        'Club idea submitted!',
        `"${payload.name}" is now in My clubs under Club ideas.`
      );
      return Promise.resolve();
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const removeClubSuggestion = useCallback(
    (suggestionId) => {
      if (isLiveMode && isLiveMongoId(suggestionId)) {
        clubCmsApi
          .deleteSuggestion(suggestionId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Club idea withdrawn', 'Removed from your submitted ideas.', 'info');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not withdraw idea', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.removeClubSuggestion(prev, suggestionId));
      notify('Club idea withdrawn', 'Removed from your submitted ideas.', 'info');
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const upsertInstitution = useCallback(
    (payload) => {
      if (isLiveMode) {
        if (!payload?.id) {
          notify(
            'Campus not added from Club',
            'Add campuses from Institute Register or the College Add screen.',
            'info'
          );
          return;
        }
        clubCmsApi
          .upsertInstitution(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Institution updated', `"${payload.name}" is now saved in the database.`);
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not save institution', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.upsertInstitution(prev, payload));
      notify(
        payload.id ? 'Institution updated' : 'Institution added',
        `"${payload.name}" is now live.`
      );
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const assignClubOwner = useCallback(
    (clubId, ownerUserId) => {
      if (!isLiveMode) {
        notify('Live only', 'Owner reassignment needs the live Club API.', 'info');
        return;
      }
      if (!isLiveMongoId(clubId) || !isLiveMongoId(ownerUserId)) {
        notify('Action not allowed', 'Choose a valid club and Club Admin.', 'info');
        return;
      }
      clubCmsApi
        .assignClubOwner(clubId, ownerUserId)
        .then((res) => {
          if (!res.status) throw new Error(res.message);
          notify('Club Admin added', 'Earlier admins remain on this club.');
          return refreshLiveCms();
        })
        .catch((err) => notify('Action not allowed', err.response?.data?.message || err.message, 'info'));
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const upsertClub = useCallback(
    (payload) => {
      if (isLiveMode) {
        const collegeId = payload.collegeId || payload.institutionId || payload.center?.college;
        if (payload.id) {
          if (!isLiveMongoId(payload.id)) {
            notify('Action not allowed', 'This club cannot be updated because it is not a saved campus club.', 'info');
            return;
          }
          clubCmsApi
            .updateClub(payload.id, { ...payload, collegeId })
            .then((res) => {
              if (!res.status) throw new Error(res.message);
              notify('Club updated', `"${payload.name}" was saved.`);
              return refreshLiveCms(collegeId);
            })
            .catch((err) => notify('Action not allowed', err.response?.data?.message || err.message, 'info'));
          return;
        }
        if (!isLiveMongoId(collegeId)) {
          notify('Choose a real campus', 'This Club Admin account has no assigned college, or the campus ID is invalid.', 'info');
          return;
        }
        clubCmsApi
          .createClub({ ...payload, collegeId })
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('New club created', `"${payload.name}" was saved.`);
            return refreshLiveCms(collegeId);
          })
          .catch((err) => notify('Action not allowed', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => {
        const result = clubService.upsertClub(prev, payload, activeRole);
        window.setTimeout(() => {
          if (!result.ok) {
            notify('Action not allowed', result.error, 'info');
          } else {
            notify(
              payload.id ? 'Club updated' : 'New club created',
              `"${payload.name}" is immediately available in the Student Explore view.`
            );
          }
        }, 0);
        return result.nextState;
      });
    },
    [activeRole, assignedColleges, mode, notify, refreshLiveCms]
  );

  const deleteClub = useCallback(
    (clubId) => {
      if (isLiveMode && isLiveMongoId(clubId)) {
        clubCmsApi
          .deleteClub(clubId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Club removed', 'This club is no longer visible on campus.', 'info');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not remove club', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.deleteClub(prev, clubId));
      notify('Club removed', 'This club is no longer visible on campus.', 'info');
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const reviewClubMemberRequest = useCallback(
    (clubId, memberRecordId, decision) => {
      if (isLiveMode) {
        if (!isLiveMongoId(memberRecordId)) {
          notify('Action not allowed', 'This member record is not saved on the server.', 'info');
          return;
        }
        clubCmsApi
          .reviewMember(memberRecordId, decision)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(
              decision === 'approve' ? 'Member request approved' : 'Member request declined',
              decision === 'approve'
                ? 'The student is now an active member of this club.'
                : 'The request stays on the roster as rejected.',
              decision === 'approve' ? 'success' : 'info'
            );
            return refreshLiveCms();
          })
          .catch((err) => notify('Action not allowed', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => {
        const result = clubService.reviewClubMemberRequest(
          prev,
          clubId,
          memberRecordId,
          decision,
          activeRole
        );
        window.setTimeout(() => {
          if (!result.ok) {
            notify('Action not allowed', result.error, 'info');
          } else {
            notify(
              decision === 'approve' ? 'Member request approved' : 'Member request declined',
              decision === 'approve'
                ? 'The student is now an active member of this club.'
                : 'The request stays on the roster as rejected.',
              decision === 'approve' ? 'success' : 'info'
            );
          }
        }, 0);
        return result.nextState;
      });
    },
    [activeRole, mode, notify, refreshLiveCms]
  );

  const approveStudentClubSuggestion = useCallback(
    (suggestionId) => {
      if (isLiveMode && isLiveMongoId(suggestionId)) {
        clubCmsApi
          .approveSuggestion(suggestionId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(
              'Club idea promoted to live club!',
              'The suggested club has been added to the Clubs directory.'
            );
            return refreshLiveCms();
          })
          .catch((err) => notify('Action not allowed', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => {
        const result = clubService.approveStudentClubSuggestion(prev, suggestionId, activeRole);
        window.setTimeout(() => {
          if (!result.ok) {
            notify('Action not allowed', result.error, 'info');
          } else {
            notify(
              'Club idea promoted to live club!',
              'The suggested club has been added to the Clubs directory.'
            );
          }
        }, 0);
        return result.nextState;
      });
    },
    [activeRole, isLiveMode, notify, refreshLiveCms]
  );

  const upsertPerson = useCallback(
    (payload) => {
      if (isLiveMode) {
        notify(
          'Person not added from Club',
          'Add Institute users in Access Management. Students appear after they join a club.',
          'info'
        );
        return;
      }
      setState((prev) => clubService.upsertPerson(prev, payload));
      notify(
        payload.id ? 'Role & assignment updated' : 'Person added',
        `${payload.name} (${payload.role}) saved.`
      );
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const upsertActivity = useCallback(
    (payload) => {
      if (isLiveMode) {
        const call =
          payload.id && isLiveMongoId(payload.id)
            ? clubCmsApi.updateActivity(payload.id, payload)
            : clubCmsApi.createActivity(payload);
        call
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(
              payload.id ? 'Activity updated' : 'Activity saved',
              payload.id
                ? `"${payload.title}" is saved.`
                : `"${payload.title}" is saved as draft. Turn Live on when it should show to students, same as a job.`
            );
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not save activity', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.upsertActivity(prev, payload));
      notify(
        payload.id ? 'Activity updated' : 'Activity published',
        `"${payload.title}" is now visible in What’s On.`
      );
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const markAttendance = useCallback(
    (activityId, registrationId, attendance) => {
      if (isLiveMode && isLiveMongoId(activityId) && isLiveMongoId(registrationId)) {
        clubCmsApi
          .markAttendance(activityId, registrationId, attendance)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Attendance updated', `Marked as ${attendance}.`, 'info');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not update attendance', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) =>
        clubService.markAttendance(prev, activityId, registrationId, attendance)
      );
      notify('Attendance updated', `Marked as ${attendance}.`, 'info');
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const updateExternalLinks = useCallback(
    (links) => {
      setState((prev) => clubService.updateExternalLinks(prev, links));
      notify('Navigation destinations updated', 'Courses & Placements links updated.');
    },
    [notify]
  );

  const resetDemoData = useCallback(() => {
    const fresh = clubService.resetState();
    setState(fresh);
    notify(
      'Data reset complete',
      'All clubs, activities, and student selections have been restored to defaults.'
    );
  }, [notify]);

  const setDemoRole = useCallback(
    (role) => {
      setState((prev) => ({ ...prev, demoRole: role }));
      notify('Demo role switched', `Now viewing as ${ROLE_LABELS[role]}.`, 'info');
    },
    [notify]
  );

  const addMember = useCallback(
    (clubId, payload) => {
      if (isLiveMode) {
        const studentUserId = payload.studentUserId || payload.studentId;
        if (!isLiveMongoId(clubId) || !isLiveMongoId(studentUserId)) {
          notify('Cannot add member', 'Select a real club and a student from this campus.', 'info');
          return;
        }
        clubCmsApi
          .addMember(clubId, { ...payload, studentUserId })
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Member added', `${payload.studentName || 'Student'} was added to the club roster.`);
            return refreshLiveCms();
          })
          .catch((err) => notify('Cannot add member', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => {
        const result = clubService.addMember(prev, clubId, payload, activeRole);
        window.setTimeout(() => {
          if (!result.ok) {
            notify('Cannot add member', result.error, 'info');
          } else {
            notify('Member added', `${payload.studentName} was added to the club roster.`);
          }
        }, 0);
        return result.nextState;
      });
    },
    [activeRole, mode, notify, refreshLiveCms]
  );

  const setMemberStatus = useCallback(
    (clubId, memberRecordId, status) => {
      if (isLiveMode) {
        if (!isLiveMongoId(memberRecordId)) {
          notify('Action not allowed', 'This member record is not saved on the server.', 'info');
          return;
        }
        clubCmsApi
          .setMemberStatus(memberRecordId, status)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Member updated', `Status set to ${status}.`, 'info');
            return refreshLiveCms();
          })
          .catch((err) => notify('Action not allowed', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => {
        const result = clubService.setMemberStatus(prev, clubId, memberRecordId, status, activeRole);
        window.setTimeout(() => {
          if (!result.ok) {
            notify('Action not allowed', result.error, 'info');
          } else {
            notify('Member updated', `Status set to ${status}.`, 'info');
          }
        }, 0);
        return result.nextState;
      });
    },
    [activeRole, mode, notify, refreshLiveCms]
  );

  const upsertPosition = useCallback(
    (payload) => {
      if (isLiveMode) {
        if (payload.id) {
          if (!isLiveMongoId(payload.id)) {
            notify('Action not allowed', 'This position cannot be updated because it is not saved on the server.', 'info');
            return;
          }
          clubCmsApi
            .updatePosition(payload.id, payload)
            .then((res) => {
              if (!res.status) throw new Error(res.message);
              notify('Position updated', payload.title || 'Position saved');
              return refreshLiveCms();
            })
            .catch((err) => notify('Action not allowed', err.response?.data?.message || err.message, 'info'));
          return;
        }
        if (!isLiveMongoId(payload.clubId)) {
          notify('Action not allowed', 'Select a real club before creating a position.', 'info');
          return;
        }
        clubCmsApi
          .createPosition(payload.clubId, payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Position created', payload.title || 'Position saved');
            return refreshLiveCms();
          })
          .catch((err) => notify('Action not allowed', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => {
        const result = clubService.upsertPosition(prev, payload, activeRole);
        window.setTimeout(() => {
          if (!result.ok) {
            notify('Action not allowed', result.error, 'info');
          } else {
            notify(payload.id ? 'Position updated' : 'Position created', payload.title);
          }
        }, 0);
        return result.nextState;
      });
    },
    [activeRole, mode, notify, refreshLiveCms]
  );

  const deletePosition = useCallback(
    (positionId) => {
      if (isLiveMode && isLiveMongoId(positionId)) {
        clubCmsApi
          .deletePosition(positionId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Position removed', 'This role is no longer listed.', 'info');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not remove position', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.deletePosition(prev, positionId));
      notify('Position removed', 'This role is no longer listed.', 'info');
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const setPositionsFeatureEnabled = useCallback(
    (enabled) => {
      if (isLiveMode) {
        const collegeId = assignedColleges[0]?._id;
        if (!isLiveMongoId(collegeId)) {
          notify('Action not allowed', 'No assigned campus is available for this setting.', 'info');
          return;
        }
        clubCmsApi
          .setPositionsFeature(collegeId, enabled)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(
              enabled ? 'Club positions enabled' : 'Club positions disabled',
              enabled
                ? 'Students can discover and request open roles again.'
                : 'Student position discovery and requests are hidden. Existing positions stay saved.',
              'info'
            );
            return refreshLiveCms(collegeId);
          })
          .catch((err) => notify('Action not allowed', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => {
        const result = clubService.setPositionsFeatureEnabled(prev, enabled, activeRole);
        window.setTimeout(() => {
          if (!result.ok) {
            notify('Action not allowed', result.error, 'info');
          } else {
            notify(
              enabled ? 'Club positions enabled' : 'Club positions disabled',
              enabled
                ? 'Students can discover and request open roles again.'
                : 'Student position discovery and requests are hidden. Existing positions stay saved.',
              'info'
            );
          }
        }, 0);
        return result.nextState;
      });
    },
    [activeRole, assignedColleges, mode, notify, refreshLiveCms]
  );

  const setClubTypes = useCallback(
    (clubTypes) => {
      const nextTypes = Array.isArray(clubTypes)
        ? clubTypes.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
      if (isLiveMode) {
        const collegeId = assignedColleges[0]?._id;
        if (!isLiveMongoId(collegeId)) {
          notify('Action not allowed', 'No assigned campus is available for this setting.', 'info');
          return;
        }
        clubCmsApi
          .setClubTypes(collegeId, nextTypes)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Club types updated', 'These types appear when creating or suggesting a club.');
            return refreshLiveCms(collegeId);
          })
          .catch((err) => notify('Could not save club types', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => ({
        ...prev,
        settings: {
          ...(prev.settings || {}),
          clubTypes: nextTypes,
        },
      }));
      notify('Club types updated', 'These types appear when creating or suggesting a club.');
    },
    [assignedColleges, isLiveMode, notify, refreshLiveCms]
  );

  const requestPosition = useCallback(
    (payload) => {
      if (isLiveMode) {
        clubCmsApi
          .requestPosition(payload.positionId, payload.note)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            if (res.duplicate) {
              notify('Already requested', 'You already have a pending request for this position.', 'info');
            } else {
              notify('Position requested', 'Status: Pending. Club Admin can Recommend, Assign, or Reject.');
            }
            return refreshLiveCms();
          })
          .catch((err) => notify('Cannot request position', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => {
        const result = clubService.requestPosition(prev, payload, activeRole);
        window.setTimeout(() => {
          if (!result.ok) {
            notify('Cannot request position', result.error, 'info');
          } else if (result.duplicate) {
            notify('Already requested', 'You already have a pending request for this position.', 'info');
          } else {
            notify('Position requested', 'Status: Pending. Club Admin can Recommend, Assign, or Reject.');
          }
        }, 0);
        return result.nextState;
      });
    },
    [activeRole, mode, notify, refreshLiveCms]
  );

  const reviewPositionRequest = useCallback(
    (requestId, decision) => {
      if (isLiveMode) {
        clubCmsApi
          .reviewPosition(requestId, decision)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(
              decision === 'approve' || decision === 'assign'
                ? 'Position assigned'
                : decision === 'recommend'
                  ? 'Position recommended'
                  : 'Position request rejected',
              decision === 'approve' || decision === 'assign'
                ? 'Seat filled. Position marks Filled when all seats are taken.'
                : 'The student will see the updated status.',
              decision === 'reject' ? 'info' : 'success'
            );
            return refreshLiveCms();
          })
          .catch((err) => notify('Action not allowed', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => {
        const result = clubService.reviewPositionRequest(prev, requestId, decision, activeRole);
        window.setTimeout(() => {
          if (!result.ok) {
            notify('Action not allowed', result.error, 'info');
          } else {
            notify(
              decision === 'approve' ? 'Position request approved' : 'Position request rejected',
              'The student will see the updated status.',
              decision === 'approve' ? 'success' : 'info'
            );
          }
        }, 0);
        return result.nextState;
      });
    },
    [activeRole, mode, notify, refreshLiveCms]
  );

  const upsertBudget = useCallback(
    (payload) => {
      if (isLiveMode) {
        clubCmsApi
          .upsertBudget(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(payload.id ? 'Budget updated' : 'Budget drafted', payload.title);
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not save budget', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.upsertBudget(prev, payload));
      notify(payload.id ? 'Budget updated' : 'Budget drafted', payload.title);
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const workflowBudget = useCallback(
    (budgetId, action) => {
      const actor = ROLE_LABELS[activeRole];
      if (isLiveMode && isLiveMongoId(budgetId)) {
        clubCmsApi
          .workflowBudget(budgetId, action, actor)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(
              action === 'approve' ? 'Budget approved' : `Budget ${action}ed`,
              `${action[0].toUpperCase()}${action.slice(1)} is a separate workflow step.`,
              action === 'approve' ? 'success' : 'info'
            );
            return refreshLiveCms();
          })
          .catch((err) => notify('Action not allowed', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.workflowBudget(prev, budgetId, action, actor));
      notify(
        action === 'approve' ? 'Budget approved' : `Budget ${action}ed`,
        `${action[0].toUpperCase()}${action.slice(1)} is a separate workflow step.`,
        action === 'approve' ? 'success' : 'info'
      );
    },
    [activeRole, isLiveMode, notify, refreshLiveCms]
  );

  const declareResult = useCallback(
    (payload) => {
      if (isLiveMode) {
        clubCmsApi
          .declareResult(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Result declared', payload.title);
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not declare result', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.declareResult(prev, payload));
      notify('Result declared', payload.title);
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const generateCertificate = useCallback(
    (payload) => {
      if (isLiveMode) {
        clubCmsApi
          .generateCertificate(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Certificate issued', payload.title);
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not generate certificate', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.generateCertificate(prev, payload));
      notify('Certificate issued', payload.title);
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const requestRedemption = useCallback(
    (goodie) => {
      if (isLiveMode) {
        clubCmsApi
          .requestRedemption(goodie)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Gift requested', `${goodie.name} is waiting for Club Admin to confirm pickup.`);
            return refreshLiveCms();
          })
          .catch((err) =>
            notify('Could not request gift', err.response?.data?.message || err.message, 'info')
          );
        return;
      }
      setState((prev) => {
        const { nextState, ok } = clubService.requestRedemption(prev, goodie);
        window.setTimeout(() => {
          if (!ok) {
            notify('Not enough points', `You need ${goodie.points} points for ${goodie.name}.`, 'info');
          } else {
            notify('Gift requested', `${goodie.name} is waiting for Club Admin to confirm pickup.`);
          }
        }, 0);
        return nextState;
      });
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const upsertGoodie = useCallback(
    (payload) => {
      if (isLiveMode) {
        clubCmsApi
          .upsertGoodie(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(payload.id ? 'Gift updated' : 'Gift added', payload.name || 'Campus gift catalogue updated.');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not save gift', err.response?.data?.message || err.message, 'info'));
      }
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const upsertBadge = useCallback(
    (payload) => {
      if (isLiveMode) {
        clubCmsApi
          .upsertBadge(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(payload.id ? 'Badge updated' : 'Badge added', payload.name || 'Badge catalogue updated.');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not save badge', err.response?.data?.message || err.message, 'info'));
      }
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const awardBadge = useCallback(
    (badge, studentId, studentName) => {
      if (!badge?.id || !studentId) {
        notify('Choose a student', 'Select who should receive this badge.', 'info');
        return;
      }
      if (isLiveMode) {
        clubCmsApi
          .awardBadge(badge.id, studentId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Badge awarded', `${badge.name} given to ${studentName || 'the student'}.`);
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not award badge', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => {
        if (String(prev.currentStudent.id) !== String(studentId)) return prev;
        const tokens = [badge.code, badge.id].filter(Boolean).map(String);
        return {
          ...prev,
          currentStudent: {
            ...prev.currentStudent,
            badgesEarned: [...new Set([...(prev.currentStudent.badgesEarned || []), ...tokens])],
          },
        };
      });
      notify('Badge awarded', `${badge.name} given to ${studentName || 'the student'}.`);
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const deleteGoodie = useCallback(
    (goodieId) => {
      if (isLiveMode && isLiveMongoId(goodieId)) {
        clubCmsApi
          .deleteGoodie(goodieId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Gift removed', 'This gift is no longer available.', 'info');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not remove gift', err.response?.data?.message || err.message, 'info'));
      }
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const upsertFaq = useCallback(
    (payload) => {
      if (isLiveMode) {
        clubCmsApi
          .upsertFaq(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(payload.id ? 'FAQ updated' : 'FAQ added', payload.question || 'Campus FAQ updated.');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not save FAQ', err.response?.data?.message || err.message, 'info'));
      }
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const deleteFaq = useCallback(
    (faqId) => {
      if (isLiveMode && isLiveMongoId(faqId)) {
        clubCmsApi
          .deleteFaq(faqId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('FAQ removed', 'This question was removed from campus FAQ.', 'info');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not remove FAQ', err.response?.data?.message || err.message, 'info'));
      }
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const reviewRedemption = useCallback(
    (redemptionId, decision) => {
      if (isLiveMode && isLiveMongoId(redemptionId)) {
        clubCmsApi
          .reviewRedemption(redemptionId, decision)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(
              decision === 'approve' ? 'Redemption approved' : 'Redemption rejected',
              'Reward status updated.',
              decision === 'approve' ? 'success' : 'info'
            );
            return refreshLiveCms();
          })
          .catch((err) => notify('Action not allowed', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.reviewRedemption(prev, redemptionId, decision));
      notify(
        decision === 'approve' ? 'Redemption approved' : 'Redemption rejected',
        'Reward status updated.',
        decision === 'approve' ? 'success' : 'info'
      );
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const createPost = useCallback(
    (payload) => {
      if (isLiveMode) {
        clubCmsApi
          .createPost(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Post published', payload.title);
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not publish post', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.createPost(prev, payload));
      notify('Post published', payload.title);
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const togglePostLike = useCallback(
    (postId) => {
      setState((prev) => clubService.togglePostLike(prev, postId, prev.currentStudent.id));
      if (isLiveMode && isLiveMongoId(postId)) {
        clubCmsApi
          .togglePostLike(postId)
          .then(() => refreshLiveCms())
          .catch((err) => notify('Could not update like', err.response?.data?.message || err.message, 'info'));
      }
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const addComment = useCallback(
    (postId, body) => {
      if (isLiveMode && isLiveMongoId(postId)) {
        clubCmsApi
          .addPostComment(postId, body)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Comment added', 'Your comment is visible on the post.', 'info');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not add comment', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.addComment(prev, postId, prev.currentStudent.name, body));
      notify('Comment added', 'Your comment is visible on the post.', 'info');
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const reportPost = useCallback(
    (postId) => {
      if (isLiveMode && isLiveMongoId(postId)) {
        clubCmsApi
          .reportPost(postId)
          .then(() => {
            notify('Post reported', 'Club Admin can review this report.', 'info');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not report post', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.reportPost(prev, postId, prev.currentStudent.name));
      notify('Post reported', 'Club Admin can review this report.', 'info');
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const deletePost = useCallback(
    (postId) => {
      if (isLiveMode && isLiveMongoId(postId)) {
        clubCmsApi
          .deletePost(postId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Post deleted', 'The post was removed from the community feed.', 'info');
            return refreshLiveCms();
          })
          .catch((err) => notify('Cannot delete post', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p.id !== postId),
        comments: prev.comments.filter((c) => c.postId !== postId),
      }));
      notify('Post deleted', 'The post was removed from the community feed.', 'info');
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const deleteComment = useCallback(
    (postId, commentId) => {
      if (isLiveMode && isLiveMongoId(postId) && isLiveMongoId(commentId)) {
        clubCmsApi
          .deletePostComment(postId, commentId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Comment removed', 'The comment was deleted.', 'info');
            return refreshLiveCms();
          })
          .catch((err) => notify('Cannot delete comment', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c.id !== commentId),
      }));
      notify('Comment removed', 'The comment was deleted.', 'info');
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const createAnnouncement = useCallback(
    (payload) => {
      if (isLiveMode) {
        clubCmsApi
          .createAnnouncement(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Announcement posted', payload.title);
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not post announcement', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.createAnnouncement(prev, payload));
      notify('Announcement posted', payload.title);
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const deleteAnnouncement = useCallback(
    (announcementId) => {
      if (isLiveMode && isLiveMongoId(announcementId)) {
        clubCmsApi
          .deleteAnnouncement(announcementId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Notice removed', 'This announcement is no longer visible.', 'info');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not remove notice', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.deleteAnnouncement(prev, announcementId));
      notify('Notice removed', 'This announcement is no longer visible.', 'info');
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const appendIncomingChat = useCallback((payload) => {
    if (!payload?.id) return;
    setState((prev) => {
      if (prev.chatMessages.some((m) => String(m.id) === String(payload.id))) return prev;
      return {
        ...prev,
        chatMessages: [
          ...prev.chatMessages,
          {
            id: String(payload.id),
            clubId: String(payload.clubId || ''),
            author: payload.author || 'Member',
            body: payload.body || '',
            createdAt: payload.createdAt || new Date().toISOString(),
          },
        ],
      };
    });
  }, []);

  const sendChatMessage = useCallback(
    (payload) => {
      if (isLiveMode) {
        clubCmsApi
          .sendChatMessage(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            const msg = res.chatMessage;
            if (msg) {
              appendIncomingChat({
                id: msg._id || msg.id,
                clubId: msg.clubId,
                author: msg.author,
                body: msg.body,
                createdAt: msg.createdAt,
              });
            }
          })
          .catch((err) => notify('Cannot send message', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.sendChatMessage(prev, payload));
    },
    [appendIncomingChat, isLiveMode, notify]
  );

  const addClubWorkflow = useCallback(
    (payload) => {
      const fullPayload = {
        ...payload,
        actorRole: activeRole,
        actorName: ROLE_LABELS[activeRole],
      };
      if (isLiveMode) {
        clubCmsApi
          .createWorkflow(fullPayload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(
              payload.action === 'request' ? 'Club request sent' : 'Club recommended',
              'Request and Recommend stay as separate steps until Club Admin acts.',
              'info'
            );
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not submit workflow', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.addClubWorkflow(prev, fullPayload));
      notify(
        payload.action === 'request' ? 'Club request sent' : 'Club recommended',
        'Request and Recommend stay as separate steps until Club Admin acts.',
        'info'
      );
    },
    [activeRole, isLiveMode, notify, refreshLiveCms]
  );

  const updateStudentProfile = useCallback(
    (payload) => {
      setState((prev) => clubService.updateStudentProfile(prev, payload));
      if (isLiveMode) {
        clubCmsApi
          .updateStudentProfile(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Profile updated', 'Your Club profile has been saved.');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not save profile', err.response?.data?.message || err.message, 'info'));
        return;
      }
      notify('Profile updated', 'Your Club profile was saved in this browser.');
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const workflowActivity = useCallback(
    (activityId, action, extra = {}) => {
      if (isLiveMode && isLiveMongoId(activityId)) {
        clubCmsApi
          .workflowActivity(activityId, action, extra)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(
              action === 'schedule' ? 'Activity live' : action === 'unpublish' ? 'Activity off' : 'Schedule updated',
              action === 'schedule'
                ? 'Students can now see and register.'
                : action === 'unpublish'
                  ? 'Taken off the live board, like turning a job off.'
                  : `Activity marked as ${action}.`
            );
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not update schedule', err.response?.data?.message || err.message, 'info'));
        return;
      }
      notify('Schedule updated', `Activity marked as ${action}.`);
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const sharePost = useCallback(
    (postId) => {
      if (isLiveMode && isLiveMongoId(postId)) {
        clubCmsApi
          .sharePost(postId)
          .then(() => {
            notify('Post shared', 'Share recorded for this post.', 'info');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not share post', err.response?.data?.message || err.message, 'info'));
        return;
      }
      notify('Post shared', 'Share recorded for this post.', 'info');
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const resolvePostReport = useCallback(
    (postId) => {
      if (isLiveMode && isLiveMongoId(postId)) {
        clubCmsApi
          .resolvePostReport(postId)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Report resolved', 'This media issue is marked resolved.');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not resolve report', err.response?.data?.message || err.message, 'info'));
      }
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const reviewAnnouncement = useCallback(
    (announcementId, decision) => {
      if (isLiveMode && isLiveMongoId(announcementId)) {
        clubCmsApi
          .reviewAnnouncement(announcementId, decision)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify(
              decision === 'reject' ? 'Announcement rejected' : 'Announcement published',
              'Student announcement requests stay pending until this review.'
            );
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not review announcement', err.response?.data?.message || err.message, 'info'));
      }
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const configureRewards = useCallback(
    (collegeId, payload) => {
      if (isLiveMode && isLiveMongoId(collegeId)) {
        clubCmsApi
          .configureRewards(collegeId, payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Reward points updated', 'Campus reward settings were saved.');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not save rewards', err.response?.data?.message || err.message, 'info'));
      }
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const createNotificationTemplate = useCallback(
    (payload) => {
      if (isLiveMode) {
        clubCmsApi
          .createNotificationTemplate(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Notification template saved', payload.title);
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not save template', err.response?.data?.message || err.message, 'info'));
        return;
      }
      notify('Notification template saved', payload.title);
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const sendClubNotification = useCallback(
    (payload) => {
      if (isLiveMode) {
        clubCmsApi
          .sendNotification(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Notification sent', 'Sales Engineers, institutes, and students will receive this automatically.');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not send notification', err.response?.data?.message || err.message, 'info'));
      }
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const shareAchievement = useCallback(
    (payload) => {
      if (isLiveMode) {
        clubCmsApi
          .shareAchievement(payload)
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Achievement card created', payload.title || 'Your achievement is ready to share.');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not share achievement', err.response?.data?.message || err.message, 'info'));
      }
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  const approveActivityRegistration = useCallback(
    (activityId, registrationId) => {
      if (isLiveMode && isLiveMongoId(activityId) && isLiveMongoId(registrationId)) {
        clubCmsApi
          .markAttendance(activityId, registrationId, 'Confirmed', { approvalStatus: 'approved' })
          .then((res) => {
            if (!res.status) throw new Error(res.message);
            notify('Registration approved', 'Attendance marked Confirmed.');
            return refreshLiveCms();
          })
          .catch((err) => notify('Could not approve registration', err.response?.data?.message || err.message, 'info'));
        return;
      }
      setState((prev) => clubService.approveActivityRegistration(prev, activityId, registrationId));
      notify('Registration approved', 'Attendance marked Confirmed.');
    },
    [isLiveMode, notify, refreshLiveCms]
  );

  return (
    <ClubContext.Provider
      value={{
        state,
        mode,
        cmsStatus,
        cmsError,
        cmsRole,
        livePermissions,
        livePermissionMatrix,
        isLiveMode,
        refreshLiveCms,
        assignedColleges,
        managesAllCampuses,
        isMainInstituteAdminLive,
        activeRole,
        setDemoRole,
        basePath,
        getClubPath,
        toasts,
        dismissToast,
        notify,
        getMembershipStatus,
        isActivitySaved,
        isActivityRegistered,
        joinOrRequestClub,
        leaveOrCancelClub,
        toggleSaveActivity,
        registerForActivity,
        cancelActivityRegistration,
        toggleStudentInterest,
        submitClubSuggestion,
        removeClubSuggestion,
        upsertInstitution,
        upsertClub,
        assignClubOwner,
        deleteClub,
        reviewClubMemberRequest,
        approveStudentClubSuggestion,
        upsertPerson,
        upsertActivity,
        markAttendance,
        updateExternalLinks,
        resetDemoData,
        addMember,
        setMemberStatus,
        upsertPosition,
        deletePosition,
        setPositionsFeatureEnabled,
        setClubTypes,
        requestPosition,
        reviewPositionRequest,
        upsertBudget,
        workflowBudget,
        declareResult,
        generateCertificate,
        requestRedemption,
        reviewRedemption,
        upsertGoodie,
        upsertBadge,
        awardBadge,
        deleteGoodie,
        upsertFaq,
        deleteFaq,
        createPost,
        togglePostLike,
        addComment,
        reportPost,
        deletePost,
        deleteComment,
        createAnnouncement,
        deleteAnnouncement,
        appendIncomingChat,
        sendChatMessage,
        addClubWorkflow,
        updateStudentProfile,
        approveActivityRegistration,
        workflowActivity,
        sharePost,
        resolvePostReport,
        reviewAnnouncement,
        configureRewards,
        createNotificationTemplate,
        sendClubNotification,
        shareAchievement,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
};

export function useClub() {
  const ctx = useContext(ClubContext);
  if (!ctx) {
    throw new Error('useClub must be used inside a ClubProvider');
  }
  return ctx;
}
