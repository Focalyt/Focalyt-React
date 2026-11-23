import { createClubArtworkDataUrl, INITIAL_CLUB_STORE_STATE } from '../../Pages/App/Club/data/mockData';
import { getClubTheme } from '../../config/club/clubThemes';
import { ROLES } from '../../config/club/roles';
import { roleHasPermission } from '../../config/club/permissions';
import { findStudentMembership } from '../../config/club/membership';

const STORAGE_KEY = 'focalyt_club_demo_state_v3';

function cloneState(data) {
  return JSON.parse(JSON.stringify(data));
}

function deny(state, error, extra = {}) {
  return { ok: false, error, nextState: state, ...extra };
}

function allow(nextState, extra = {}) {
  return { ok: true, error: null, nextState, ...extra };
}

export function isPositionsFeatureEnabled(state) {
  return Boolean(state?.settings?.positionsFeatureEnabled);
}

export const clubService = {
  loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return cloneState(INITIAL_CLUB_STORE_STATE);
      }
      const parsed = JSON.parse(raw);
      if (!parsed.clubs || !parsed.activities || !parsed.institutions) {
        return cloneState(INITIAL_CLUB_STORE_STATE);
      }
      const base = cloneState(INITIAL_CLUB_STORE_STATE);
      return {
        ...base,
        ...parsed,
        currentStudent: { ...base.currentStudent, ...(parsed.currentStudent || {}) },
        positions: parsed.positions || base.positions,
        positionRequests: parsed.positionRequests || base.positionRequests,
        budgets: parsed.budgets || base.budgets,
        results: parsed.results || base.results,
        certificates: parsed.certificates || base.certificates,
        badges: parsed.badges || base.badges,
        goodies: parsed.goodies || base.goodies,
        redemptions: parsed.redemptions || base.redemptions,
        pointsLedger: parsed.pointsLedger || base.pointsLedger,
        posts: parsed.posts || base.posts,
        comments: parsed.comments || base.comments,
        announcements: parsed.announcements || base.announcements,
        notifications: parsed.notifications || base.notifications,
        chatMessages: parsed.chatMessages || base.chatMessages,
        faqs: parsed.faqs || base.faqs,
        clubWorkflows: parsed.clubWorkflows || base.clubWorkflows,
        settings: { ...base.settings, ...(parsed.settings || {}) },
      };
    } catch {
      return cloneState(INITIAL_CLUB_STORE_STATE);
    }
  },

  saveState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  },

  resetState() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    return cloneState(INITIAL_CLUB_STORE_STATE);
  },

  getStudentMembershipStatus(club, student) {
    const record = student && typeof student === 'object'
      ? findStudentMembership(club, student)
      : (club?.members || []).find((member) => String(member.studentId || '') === String(student || ''));
    if (!record) return 'none';
    if (record.status === 'joined') return 'approved';
    return record.status;
  },

  listKnownStudents(state) {
    const map = new Map();
    const add = (entry) => {
      const studentId = entry?.studentId || entry?.id;
      if (!studentId || map.has(studentId)) return;
      map.set(studentId, {
        studentId,
        studentName: entry.studentName || entry.name || 'Student',
        studentEmail: entry.studentEmail || entry.email || '',
        department: entry.department || '',
      });
    };
    add(state.currentStudent);
    (state.clubs || []).forEach((club) => (club.members || []).forEach(add));
    return Array.from(map.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
  },

  joinOrRequestClub(state, clubId, note, role) {
    if (role && role !== ROLES.STUDENT) {
      return deny(state, 'Only students can request to join a club.', {
        status: 'none',
        alreadyMember: false,
      });
    }

    const student = state.currentStudent;
    let resultingStatus = 'none';
    let alreadyMember = false;
    let blocked = false;
    const today = new Date().toISOString().slice(0, 10);

    const clubs = state.clubs.map((club) => {
      if (club.id !== clubId) return club;
      const existing = club.members.find((m) => m.studentId === student.id);
      if (existing) {
        if (existing.status === 'blocked') {
          blocked = true;
          resultingStatus = 'blocked';
          return club;
        }
        if (existing.status === 'rejected') {
          resultingStatus = 'pending';
          return {
            ...club,
            members: club.members.map((m) =>
              m.id === existing.id
                ? {
                    ...m,
                    status: 'pending',
                    requestedAt: today,
                    joinedAt: undefined,
                    note: note?.trim() || m.note,
                  }
                : m
            ),
          };
        }
        resultingStatus = existing.status;
        alreadyMember = true;
        return club;
      }

      const nextStatus = 'pending';
      resultingStatus = nextStatus;

      return {
        ...club,
        members: [
          ...club.members,
          {
            id: `mem-${Date.now()}`,
            studentId: student.id,
            studentName: student.name,
            studentEmail: student.email,
            department: student.department,
            status: nextStatus,
            requestedAt: today,
            joinedAt: nextStatus === 'joined' ? today : undefined,
            note: note?.trim() || undefined,
          },
        ],
      };
    });

    if (blocked) {
      return deny(state, 'You cannot request to join this club while blocked.', {
        status: 'blocked',
        alreadyMember: true,
      });
    }

    return {
      ok: true,
      error: null,
      nextState: { ...state, clubs },
      status: resultingStatus,
      alreadyMember,
    };
  },

  leaveOrCancelClub(state, clubId) {
    const studentId = state.currentStudent.id;
    const clubs = state.clubs.map((club) => {
      if (club.id !== clubId) return club;
      return {
        ...club,
        members: (club.members || []).filter((m) => m.studentId !== studentId),
      };
    });
    return { ...state, clubs };
  },

  toggleSaveActivity(state, activityId) {
    const currentSaved = state.currentStudent.savedActivityIds;
    const exists = currentSaved.includes(activityId);
    const savedActivityIds = exists
      ? currentSaved.filter((id) => id !== activityId)
      : [...currentSaved, activityId];

    return {
      nextState: {
        ...state,
        currentStudent: {
          ...state.currentStudent,
          savedActivityIds,
        },
      },
      saved: !exists,
    };
  },

  registerForActivity(state, activityId) {
    const student = state.currentStudent;
    let duplicate = false;

    const activities = state.activities.map((act) => {
      if (act.id !== activityId) return act;
      const already = act.registrations.some((r) => r.studentId === student.id);
      if (already) {
        duplicate = true;
        return act;
      }
      return {
        ...act,
        registrations: [
          ...act.registrations,
          {
            id: `reg-${Date.now()}`,
            activityId: act.id,
            studentId: student.id,
            studentName: student.name,
            studentEmail: student.email,
            registeredAt: new Date().toISOString().slice(0, 10),
            attendance: 'Pending',
          },
        ],
      };
    });

    return {
      nextState: { ...state, activities },
      duplicate,
    };
  },

  cancelActivityRegistration(state, activityId) {
    const studentId = state.currentStudent.id;
    const activities = state.activities.map((act) => {
      if (act.id !== activityId) return act;
      return {
        ...act,
        registrations: act.registrations.filter((r) => r.studentId !== studentId),
      };
    });
    return { ...state, activities };
  },

  toggleStudentInterest(state, interest) {
    const list = state.currentStudent.selectedInterests;
    const exists = list.includes(interest);
    const selectedInterests = exists
      ? list.filter((item) => item !== interest)
      : [...list, interest];

    return {
      ...state,
      currentStudent: {
        ...state.currentStudent,
        selectedInterests,
      },
    };
  },

  submitClubSuggestion(state, payload) {
    const newSuggestion = {
      id: `sug-${Date.now()}`,
      name: payload.name.trim(),
      category: payload.category,
      description: payload.description.trim(),
      whyNeeded: payload.whyNeeded.trim(),
      expectedFormat: payload.expectedFormat.trim(),
      submittedBy: state.currentStudent.name,
      submittedAt: new Date().toISOString().slice(0, 10),
      status: 'Submitted',
    };
    return {
      ...state,
      suggestions: [newSuggestion, ...state.suggestions],
    };
  },

  removeClubSuggestion(state, suggestionId) {
    return {
      ...state,
      suggestions: state.suggestions.filter((s) => s.id !== suggestionId),
    };
  },

  upsertInstitution(state, payload) {
    if (payload.id) {
      return {
        ...state,
        institutions: state.institutions.map((inst) =>
          inst.id === payload.id ? { ...inst, ...payload, id: payload.id } : inst
        ),
      };
    }
    const created = {
      ...payload,
      id: `inst-${Date.now()}`,
    };
    return {
      ...state,
      institutions: [created, ...state.institutions],
    };
  },

  upsertClub(state, payload, role) {
    const isEdit = Boolean(payload.id);
    const permission = isEdit ? 'clubs.edit' : 'clubs.create';
    if (!roleHasPermission(role, permission)) {
      return deny(state, isEdit ? 'You cannot edit clubs.' : 'You cannot create clubs.');
    }

    const clubTheme = getClubTheme(payload.theme);

    if (payload.id) {
      const clubs = state.clubs.map((club) => {
        if (club.id !== payload.id) return club;
        return {
          ...club,
          ...payload,
          id: club.id,
          accentColor: clubTheme.primary,
          bannerSvgDataUrl: createClubArtworkDataUrl(
            payload.name,
            payload.category.toUpperCase(),
            clubTheme.primary,
            clubTheme.secondary,
            clubTheme.bg,
            clubTheme.motif
          ),
        };
      });
      const people = state.people.map((person) =>
        person.id === payload.coordinatorId
          ? { ...person, clubId: payload.id, institutionId: payload.institutionId }
          : person
      );
      return allow({ ...state, clubs, people });
    }

    const newClubId = `club-${Date.now()}`;
    const newClub = {
      id: newClubId,
      name: payload.name.trim(),
      tagline: (payload.tagline || '').trim(),
      description: (payload.description || '').trim(),
      category: payload.category,
      institutionId: payload.institutionId,
      verticalId: payload.verticalId || '',
      projectId: payload.projectId || '',
      centerId: payload.centerId || '',
      centerName: payload.centerName || '',
      projectName: payload.projectName || '',
      departmentName: payload.departmentName || '',
      coordinatorId: payload.coordinatorId,
      eligibility: (payload.eligibility || '').trim(),
      joiningMethod: payload.joiningMethod,
      meetingSchedule: (payload.meetingSchedule || '').trim(),
      location: (payload.location || '').trim(),
      interests: payload.interests,
      featured: payload.featured,
      theme: payload.theme || clubTheme.id,
      accentColor: clubTheme.primary,
      bannerSvgDataUrl: createClubArtworkDataUrl(
        payload.name.trim(),
        payload.category.toUpperCase(),
        clubTheme.primary,
        clubTheme.secondary,
        clubTheme.bg,
        clubTheme.motif
      ),
      members: [],
    };

    const people = state.people.map((person) =>
      person.id === payload.coordinatorId
        ? { ...person, clubId: newClubId, institutionId: payload.institutionId }
        : person
    );

    return allow({
      ...state,
      clubs: [newClub, ...state.clubs],
      people,
    });
  },

  deleteClub(state, clubId) {
    return {
      ...state,
      clubs: state.clubs.filter((c) => c.id !== clubId),
      positions: state.positions.filter((p) => p.clubId !== clubId),
    };
  },

  reviewClubMemberRequest(state, clubId, memberRecordId, decision, role) {
    const permission = decision === 'approve' ? 'members.approve' : 'members.reject';
    if (!roleHasPermission(role, permission)) {
      return deny(state, 'You cannot review member requests.');
    }
    if (decision !== 'approve' && decision !== 'reject') {
      return deny(state, 'Invalid review decision.');
    }

    const today = new Date().toISOString().slice(0, 10);
    let found = false;
    let invalid = false;
    const clubs = state.clubs.map((club) => {
      if (club.id !== clubId) return club;
      return {
        ...club,
        members: club.members.map((m) => {
          if (m.id !== memberRecordId) return m;
          found = true;
          if (decision === 'approve') {
            if (m.status !== 'pending' && m.status !== 'rejected') {
              invalid = true;
              return m;
            }
            return { ...m, status: 'joined', joinedAt: today };
          }
          if (m.status !== 'pending') {
            invalid = true;
            return m;
          }
          return { ...m, status: 'rejected', rejectedAt: today };
        }),
      };
    });

    if (!found) return deny(state, 'Member request not found.');
    if (invalid) return deny(state, 'That status change is not allowed.');
    return allow({ ...state, clubs });
  },

  approveStudentClubSuggestion(state, suggestionId, role) {
    if (!roleHasPermission(role, 'clubs.create')) {
      return deny(state, 'You cannot create clubs from student ideas.');
    }
    const suggestion = state.suggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return deny(state, 'Club idea not found.');

    const defaultInstitutionId = state.institutions[0]?.id || 'inst-1';
    const defaultCoordinatorId = state.people[0]?.id || 'per-1';

    const created = this.upsertClub(
      state,
      {
        name: suggestion.name,
        tagline: suggestion.expectedFormat,
        description: `${suggestion.description} (${suggestion.whyNeeded})`,
        category: suggestion.category,
        institutionId: defaultInstitutionId,
        coordinatorId: defaultCoordinatorId,
        eligibility: 'Open to all students across campus.',
        joiningMethod: 'Open Join',
        meetingSchedule: suggestion.expectedFormat || 'Fridays • 5:00 PM',
        location: 'Student Commons Room',
        interests: [suggestion.category],
        featured: false,
      },
      role
    );
    if (!created.ok) return created;

    return allow({
      ...created.nextState,
      suggestions: created.nextState.suggestions.map((s) =>
        s.id === suggestionId ? { ...s, status: 'Approved' } : s
      ),
    });
  },

  upsertPerson(state, payload) {
    const initials =
      payload.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'FC';

    const personId = payload.id || `per-${Date.now()}`;
    let people;

    if (payload.id) {
      people = state.people.map((p) =>
        p.id === payload.id
          ? { ...p, ...payload, id: payload.id, avatarInitials: initials }
          : p
      );
    } else {
      const created = {
        ...payload,
        id: personId,
        avatarInitials: initials,
      };
      people = [created, ...state.people];
    }

    const clubs = state.clubs.map((club) => {
      if (payload.role === 'Coordinator' && payload.clubId === club.id) {
        return { ...club, coordinatorId: personId };
      }
      return club;
    });

    return { ...state, people, clubs };
  },

  upsertActivity(state, payload) {
    const club = state.clubs.find((c) => c.id === payload.clubId);
    const subtitle = club ? club.name.toUpperCase() : 'CAMPUS ACTIVITY';

    if (payload.id) {
      const activities = state.activities.map((act) => {
        if (act.id !== payload.id) return act;
        return {
          ...act,
          ...payload,
          id: act.id,
          bannerSvgDataUrl: createClubArtworkDataUrl(
            payload.title,
            subtitle,
            '#1BA7FF',
            '#DFF1FF',
            '#EAF4FF',
            'event'
          ),
        };
      });
      return { ...state, activities };
    }

    const created = {
      ...payload,
      id: `act-${Date.now()}`,
      bannerSvgDataUrl: createClubArtworkDataUrl(
        payload.title,
        subtitle,
        '#1BA7FF',
        '#DFF1FF',
        '#EAF4FF',
        'event'
      ),
      registrations: [],
    };

    return {
      ...state,
      activities: [created, ...state.activities],
    };
  },

  markAttendance(state, activityId, registrationId, attendance) {
    const present = /^(present|confirmed)$/i.test(String(attendance || ''));
    let awardStudentId = null;
    let activityTitle = '';
    const activities = state.activities.map((act) => {
      if (act.id !== activityId) return act;
      return {
        ...act,
        registrations: act.registrations.map((reg) => {
          if (reg.id !== registrationId) return reg;
          if (present && !reg.pointsAwarded && reg.studentId) {
            awardStudentId = reg.studentId;
            activityTitle = act.title || 'Event';
            return { ...reg, attendance, pointsAwarded: true };
          }
          return { ...reg, attendance };
        }),
      };
    });
    if (!awardStudentId) return { ...state, activities };
    const student = state.currentStudent;
    const isCurrent = String(student.id) === String(awardStudentId);
    const today = new Date().toISOString().slice(0, 10);
    return {
      ...state,
      activities,
      currentStudent: isCurrent
        ? {
            ...student,
            points: (student.points || 0) + 40,
            badgesEarned: [...new Set([...(student.badgesEarned || []), 'first-event'])],
          }
        : student,
      pointsLedger: isCurrent
        ? [
            {
              id: `pt-${Date.now()}`,
              studentId: student.id,
              label: `Attended — ${activityTitle}`,
              points: 40,
              at: today,
            },
            ...state.pointsLedger,
          ]
        : state.pointsLedger,
    };
  },

  updateExternalLinks(state, links) {
    return {
      ...state,
      externalLinks: links,
    };
  },

  addMember(state, clubId, payload, role) {
    if (!roleHasPermission(role, 'members.add')) {
      return deny(state, 'You cannot add members.');
    }
    if (!clubId) {
      return deny(state, 'Select a specific club before adding a member.');
    }
    const club = state.clubs.find((c) => c.id === clubId);
    if (!club) return deny(state, 'Club not found.');

    const known = this.listKnownStudents(state);
    const student = known.find(
      (s) => s.studentId === payload.studentId || s.studentEmail === payload.studentEmail
    );
    if (!student) {
      return deny(state, 'Select an existing student from the list.');
    }
    if (club.members.some((m) => m.studentId === student.studentId || m.studentEmail === student.studentEmail)) {
      return deny(state, 'This student is already on the club roster.');
    }

    const today = new Date().toISOString().slice(0, 10);
    const clubs = state.clubs.map((item) => {
      if (item.id !== clubId) return item;
      return {
        ...item,
        members: [
          ...item.members,
          {
            id: `mem-${Date.now()}`,
            studentId: student.studentId,
            studentName: student.studentName,
            studentEmail: student.studentEmail,
            department: student.department,
            status: 'joined',
            requestedAt: today,
            joinedAt: today,
          },
        ],
      };
    });
    return allow({ ...state, clubs });
  },

  setMemberStatus(state, clubId, memberRecordId, status, role) {
    if (!roleHasPermission(role, 'members.block')) {
      return deny(state, 'You cannot block or unblock members.');
    }
    if (status !== 'blocked' && status !== 'joined') {
      return deny(state, 'Use Approve or Reject for membership requests.');
    }

    const today = new Date().toISOString().slice(0, 10);
    let found = false;
    let invalid = false;
    const clubs = state.clubs.map((club) => {
      if (club.id !== clubId) return club;
      return {
        ...club,
        members: club.members.map((m) => {
          if (m.id !== memberRecordId) return m;
          found = true;
          if (status === 'blocked' && m.status !== 'joined') {
            invalid = true;
            return m;
          }
          if (status === 'joined' && m.status !== 'blocked') {
            invalid = true;
            return m;
          }
          return {
            ...m,
            status,
            joinedAt: status === 'joined' ? m.joinedAt || today : m.joinedAt,
          };
        }),
      };
    });

    if (!found) return deny(state, 'Member not found.');
    if (invalid) return deny(state, 'That status change is not allowed.');
    return allow({ ...state, clubs });
  },

  upsertPosition(state, payload, role) {
    if (!roleHasPermission(role, 'positions.create')) {
      return deny(state, 'Only Club Administrators can create or update positions.');
    }
    const seats = Math.max(1, Number(payload.seats) || 1);
    if (payload.id) {
      const positions = state.positions.map((p) => {
        if (p.id !== payload.id) return p;
        const holders = p.holders || [];
        const filledSeats = holders.length;
        return {
          ...p,
          ...payload,
          seats,
          filledSeats,
          holders,
          status: filledSeats >= seats ? 'Filled' : payload.status || 'Open',
        };
      });
      return allow({ ...state, positions });
    }
    return allow({
      ...state,
      positions: [
        {
          ...payload,
          id: `pos-${Date.now()}`,
          seats,
          filledSeats: 0,
          holders: [],
          termLabel: payload.termLabel || '',
          termStart: payload.termStart || '',
          termEnd: payload.termEnd || '',
          status: payload.status || 'Open',
        },
        ...state.positions,
      ],
    });
  },

  deletePosition(state, positionId) {
    return {
      ...state,
      positions: state.positions.filter((p) => p.id !== positionId),
    };
  },

  setPositionsFeatureEnabled(state, enabled, role) {
    if (!roleHasPermission(role, 'positions.manageFeature')) {
      return deny(state, 'Only Club Administrators can turn club positions on or off.');
    }
    return allow({
      ...state,
      settings: {
        ...(state.settings || {}),
        positionsFeatureEnabled: Boolean(enabled),
      },
    });
  },

  requestPosition(state, payload, role) {
    if (role && !roleHasPermission(role, 'positions.request')) {
      return deny(state, 'Only students can request a position.', { duplicate: false });
    }
    if (!isPositionsFeatureEnabled(state)) {
      return deny(state, 'Club positions are turned off.', { duplicate: false });
    }
    const position = state.positions.find((p) => p.id === payload.positionId);
    if (!position || position.status === 'Filled') {
      return deny(state, 'This position is not open.', { duplicate: false });
    }
    const club = state.clubs.find((c) => c.id === position.clubId);
    const membership = (club?.members || []).find(
      (m) => String(m.studentId) === String(state.currentStudent.id)
    );
    const memberOk =
      membership &&
      (membership.status === 'joined' ||
        membership.status === 'approved' ||
        membership.status === 'Approved');
    if (!memberOk) {
      return deny(state, 'Join this club and get approved before requesting a position.', {
        duplicate: false,
      });
    }
    const filledSeats = Number(position.filledSeats) || (position.holders || []).length;
    if (filledSeats >= (Number(position.seats) || 1)) {
      return deny(state, 'All seats for this position are filled.', { duplicate: false });
    }
    const exists = state.positionRequests.some(
      (r) =>
        r.positionId === payload.positionId &&
        r.studentId === state.currentStudent.id &&
        (r.status === 'Pending' || r.status === 'Recommended' || r.status === 'Assigned')
    );
    if (exists) return { ok: true, error: null, nextState: state, duplicate: true };
    const otherOpen = state.positionRequests.some(
      (r) =>
        r.clubId === position.clubId &&
        r.studentId === state.currentStudent.id &&
        (r.status === 'Pending' || r.status === 'Recommended')
    );
    if (otherOpen) {
      return deny(state, 'You already have an open position request in this club.', {
        duplicate: false,
      });
    }
    const created = {
      id: `preq-${Date.now()}`,
      positionId: payload.positionId,
      clubId: payload.clubId || position.clubId,
      studentId: state.currentStudent.id,
      studentName: state.currentStudent.name,
      note: payload.note?.trim() || '',
      status: 'Pending',
      requestedAt: new Date().toISOString().slice(0, 10),
    };
    return {
      ok: true,
      error: null,
      nextState: { ...state, positionRequests: [created, ...state.positionRequests] },
      duplicate: false,
    };
  },

  reviewPositionRequest(state, requestId, decision, role) {
    let nextStatus = 'Rejected';
    if (decision === 'recommend') {
      if (!roleHasPermission(role, 'positions.recommend')) {
        return deny(state, 'You cannot recommend positions.');
      }
      nextStatus = 'Recommended';
    } else if (decision === 'approve' || decision === 'assign') {
      if (!roleHasPermission(role, 'positions.assign')) {
        return deny(state, 'You cannot assign positions.');
      }
      nextStatus = 'Assigned';
    } else if (decision === 'reject') {
      if (
        !roleHasPermission(role, 'positions.assign') &&
        !roleHasPermission(role, 'positions.recommend')
      ) {
        return deny(state, 'You cannot review position requests.');
      }
    } else {
      return deny(state, 'Invalid review decision.');
    }

    const request = state.positionRequests.find((r) => r.id === requestId);
    if (!request) return deny(state, 'Position request not found.');
    if (nextStatus === 'Assigned') {
      const position = state.positions.find((p) => p.id === request.positionId);
      const seats = Math.max(1, Number(position?.seats) || 1);
      const filled = (position?.holders || []).length;
      if (filled >= seats) {
        return deny(state, 'All seats for this position are filled.');
      }
    }

    const positionRequests = state.positionRequests.map((r) =>
      r.id === requestId ? { ...r, status: nextStatus } : r
    );

    let positions = state.positions;
    if (nextStatus === 'Assigned' && request.positionId) {
      positions = state.positions.map((p) => {
        if (p.id !== request.positionId) return p;
        const holders = [
          ...(p.holders || []),
          {
            studentId: request.studentId,
            studentName: request.studentName || 'Student',
            assignedAt: new Date().toISOString().slice(0, 10),
          },
        ];
        const seats = Math.max(1, Number(p.seats) || 1);
        return {
          ...p,
          holders,
          filledSeats: holders.length,
          status: holders.length >= seats ? 'Filled' : 'Open',
        };
      });
    }

    return allow({ ...state, positionRequests, positions });
  },

  upsertBudget(state, payload) {
    if (payload.id) {
      return {
        ...state,
        budgets: state.budgets.map((b) => (b.id === payload.id ? { ...b, ...payload } : b)),
      };
    }
    return {
      ...state,
      budgets: [
        {
          ...payload,
          id: `bud-${Date.now()}`,
          status: 'Draft',
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...state.budgets,
      ],
    };
  },

  workflowBudget(state, budgetId, action, actorName) {
    const nextStatus = {
      request: 'Requested',
      recommend: 'Recommended',
      approve: 'Approved',
    }[action];
    if (!nextStatus) return state;
    return {
      ...state,
      budgets: state.budgets.map((b) => {
        if (b.id !== budgetId) return b;
        return {
          ...b,
          status: nextStatus,
          requestedBy: action === 'request' ? actorName : b.requestedBy,
          recommendedBy: action === 'recommend' ? actorName : b.recommendedBy,
        };
      }),
    };
  },

  declareResult(state, payload) {
    return {
      ...state,
      results: [
        {
          ...payload,
          id: `res-${Date.now()}`,
          declaredAt: new Date().toISOString().slice(0, 10),
          status: 'Published',
        },
        ...state.results,
      ],
    };
  },

  generateCertificate(state, payload) {
    return {
      ...state,
      certificates: [
        {
          ...payload,
          id: `cert-${Date.now()}`,
          issuedAt: new Date().toISOString().slice(0, 10),
          templateId: payload.templateId || 'classic',
          status: 'Issued',
        },
        ...state.certificates,
      ],
    };
  },

  requestRedemption(state, goodie) {
    const student = state.currentStudent;
    const pendingCost = (state.redemptions || [])
      .filter((row) => row.studentId === student.id && String(row.status).toLowerCase() === 'pending')
      .reduce((sum, row) => sum + (Number(row.points) || 0), 0);
    if ((student.points || 0) - pendingCost < goodie.points) {
      return { nextState: state, ok: false, reason: 'points' };
    }
    if ((goodie.stock || 0) < 1) {
      return { nextState: state, ok: false, reason: 'stock' };
    }
    const created = {
      id: `red-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      goodieId: goodie.id,
      goodieName: goodie.name,
      points: goodie.points,
      status: 'Pending',
      requestedAt: new Date().toISOString().slice(0, 10),
    };
    return {
      nextState: {
        ...state,
        redemptions: [created, ...state.redemptions],
        goodies: state.goodies.map((g) =>
          g.id === goodie.id ? { ...g, stock: Math.max(0, g.stock - 1) } : g
        ),
      },
      ok: true,
    };
  },

  reviewRedemption(state, redemptionId, decision) {
    const redemption = (state.redemptions || []).find((row) => row.id === redemptionId);
    if (!redemption || String(redemption.status).toLowerCase() !== 'pending') return state;
    const approved = decision === 'approve';
    const student = state.currentStudent;
    const isCurrent = String(student.id) === String(redemption.studentId);
    const today = new Date().toISOString().slice(0, 10);
    return {
      ...state,
      redemptions: state.redemptions.map((row) =>
        row.id === redemptionId ? { ...row, status: approved ? 'Approved' : 'Rejected' } : row
      ),
      goodies: approved
        ? state.goodies
        : state.goodies.map((gift) =>
            gift.id === redemption.goodieId ? { ...gift, stock: (gift.stock || 0) + 1 } : gift
          ),
      currentStudent:
        approved && isCurrent
          ? { ...student, points: Math.max(0, (student.points || 0) - (redemption.points || 0)) }
          : student,
      pointsLedger:
        approved && isCurrent
          ? [
              {
                id: `pt-${Date.now()}`,
                studentId: student.id,
                label: `Redeemed ${redemption.goodieName}`,
                points: -(redemption.points || 0),
                at: today,
              },
              ...state.pointsLedger,
            ]
          : state.pointsLedger,
    };
  },

  createPost(state, payload) {
    return {
      ...state,
      posts: [
        {
          id: `post-${Date.now()}`,
          clubId: payload.clubId,
          author: payload.author,
          title: payload.title.trim(),
          body: payload.body.trim(),
          mediaType: payload.mediaType || 'text',
          likes: [],
          reports: [],
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...state.posts,
      ],
    };
  },

  togglePostLike(state, postId, studentId) {
    return {
      ...state,
      posts: state.posts.map((p) => {
        if (p.id !== postId) return p;
        const liked = p.likes.includes(studentId);
        return {
          ...p,
          likes: liked ? p.likes.filter((id) => id !== studentId) : [...p.likes, studentId],
        };
      }),
    };
  },

  addComment(state, postId, author, body) {
    return {
      ...state,
      comments: [
        {
          id: `com-${Date.now()}`,
          postId,
          author,
          body: body.trim(),
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...state.comments,
      ],
    };
  },

  reportPost(state, postId, author) {
    return {
      ...state,
      posts: state.posts.map((p) =>
        p.id === postId && !p.reports.includes(author)
          ? { ...p, reports: [...p.reports, author] }
          : p
      ),
    };
  },

  createAnnouncement(state, payload) {
    return {
      ...state,
      announcements: [
        {
          id: `ann-${Date.now()}`,
          title: payload.title.trim(),
          body: payload.body.trim(),
          audience: payload.audience || 'All',
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...state.announcements,
      ],
    };
  },

  deleteAnnouncement(state, announcementId) {
    return {
      ...state,
      announcements: state.announcements.filter((a) => a.id !== announcementId),
    };
  },

  sendChatMessage(state, payload) {
    return {
      ...state,
      chatMessages: [
        ...state.chatMessages,
        {
          id: `chat-${Date.now()}`,
          clubId: payload.clubId,
          author: payload.author,
          body: payload.body.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    };
  },

  addClubWorkflow(state, payload) {
    return {
      ...state,
      clubWorkflows: [
        {
          id: `cw-${Date.now()}`,
          clubId: payload.clubId,
          action: payload.action,
          actorRole: payload.actorRole,
          actorName: payload.actorName,
          note: payload.note || '',
          status: payload.action === 'request' ? 'Requested' : 'Recommended',
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...state.clubWorkflows,
      ],
    };
  },

  updateStudentProfile(state, payload) {
    return {
      ...state,
      currentStudent: {
        ...state.currentStudent,
        ...payload,
      },
    };
  },

  approveActivityRegistration(state, activityId, registrationId) {
    const activities = state.activities.map((act) => {
      if (act.id !== activityId) return act;
      return {
        ...act,
        registrations: act.registrations.map((r) =>
          r.id === registrationId ? { ...r, attendance: 'Confirmed' } : r
        ),
      };
    });
    return { ...state, activities };
  },
};
