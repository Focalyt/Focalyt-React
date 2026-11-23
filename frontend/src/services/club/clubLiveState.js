import { createClubArtworkDataUrl } from '../../Pages/App/Club/data/mockData';
import { getClubTheme } from '../../config/club/clubThemes';

const asId = (value) => String(value?._id || value || '');

export const isLiveMongoId = (id) => /^[a-fA-F0-9]{24}$/.test(String(id || ''));

export const staffManageableClubs = (clubs = []) =>
  (clubs || []).filter((club) => club?.canManage !== false);

const firstText = (...vals) =>
  vals.find((value) => value != null && String(value).trim() !== '') || '';

const mapCampuses = (assignedColleges = []) =>
  (assignedColleges || [])
    .filter((college) => isLiveMongoId(college._id || college.id))
    .map((college) => {
      const reps = Array.isArray(college.collegeRepresentatives) ? college.collegeRepresentatives : [];
      const contact = reps.find((rep) => rep?.email || rep?.name || rep?.mobile) || {};
      return {
        id: asId(college._id || college.id),
        name: college.name || '',
        type: college.type || '',
        city: firstText(
          college.place,
          college.city,
          college.cityId?.name,
          college.location?.city
        ),
        address: firstText(college.address, college.location?.fullAddress),
        contactName: contact.name || '',
        contactEmail: firstText(contact.email, college.contactEmail),
        contactMobile: contact.mobile || '',
        memberCount: typeof college.memberCount === 'number' ? college.memberCount : 0,
        status: college.status === false ? 'Inactive' : 'Active',
        description: college.description || '',
      };
    });

export function emptyLiveCmsState(assignedColleges = []) {
  return {
    clubs: [],
    positions: [],
    positionRequests: [],
    eligibleStudents: [],
    institutions: mapCampuses(assignedColleges),
    people: [],
    activities: [],
    suggestions: [],
    clubWorkflows: [],
    budgets: [],
    results: [],
    certificates: [],
    badges: [],
    goodies: [],
    pointsLedger: [],
    redemptions: [],
    notifications: [],
    notificationTemplates: [],
    achievementCards: [],
    posts: [],
    comments: [],
    announcements: [],
    chatMessages: [],
    faqs: [],
    settings: { positionsFeatureEnabled: true },
    currentStudent: {
      id: '',
      name: '',
      email: '',
      department: 'Campus Student',
      year: 'Active',
      bio: '',
      points: 0,
      badgesEarned: [],
      savedActivityIds: [],
      selectedInterests: [],
    },
    demoRole: null,
  };
}

export function mapLiveCmsToState(_prev, payload = {}, assignedColleges = []) {
  const currentUserId = asId(payload.currentUser?._id || payload.currentUser?.id);
  const cmsRole = String(payload.cmsRole || '').toLowerCase();
  const isMainInstituteAdmin = Boolean(payload.currentUser?.isMainInstituteAdmin);

  const membersByClub = (payload.members || []).reduce((acc, member) => {
    const clubId = asId(member.clubId?._id || member.clubId);
    acc[clubId] = acc[clubId] || [];
    const studentEmail = String(member.studentEmail || '').trim().toLowerCase();
    const studentMobile = String(member.studentMobile || '').replace(/\D/g, '').slice(-10);
    const identityKey =
      (studentMobile && `m:${studentMobile}`) ||
      (studentEmail && `e:${studentEmail}`) ||
      `u:${asId(member.studentUserId)}`;
    if (acc[clubId].some((existing) => existing.identityKey === identityKey)) {
      return acc;
    }
    acc[clubId].push({
      id: asId(member._id),
      studentId: asId(member.studentUserId),
      studentName: member.studentName,
      studentEmail: member.studentEmail,
      studentMobile: member.studentMobile || '',
      identityKey,
      department: member.department,
      status: member.status === 'joined' ? 'approved' : member.status,
      requestedAt: member.requestedAt,
      joinedAt: member.joinedAt,
      note: member.note,
    });
    return acc;
  }, {});

  const people = (payload.people || []).map((person) => ({
    id: asId(person._id),
    name: person.name,
    email: person.email,
    role: person.role || 'Coordinator',
    institutionId: asId(person.collegeId),
    clubId: asId(person.clubId),
    avatarInitials: person.avatarInitials || 'FC',
    department: person.department || '',
    bio: person.bio || '',
  }));

  const assignedCampusIds = new Set(
    (assignedColleges || []).map((college) => asId(college._id || college.id)).filter(Boolean)
  );

  const clubs = (payload.clubs || []).map((club) => {
    const clubId = asId(club._id);
    const institutionId = asId(club.collegeId);
    const assignedCoord = people.find((p) => p.clubId === clubId && p.role === 'Coordinator');
    const centerDoc = club.centerId && typeof club.centerId === 'object' ? club.centerId : null;
    const projectDoc = club.projectId && typeof club.projectId === 'object' ? club.projectId : null;
    const verticalDoc = club.verticalId && typeof club.verticalId === 'object' ? club.verticalId : null;
    const clubTheme = getClubTheme(club.theme);
    return {
      id: clubId,
      name: club.name,
      tagline: club.tagline || '',
      description: club.description || '',
      category: club.clubType || club.category || 'Creative',
      theme: club.theme || '',
      institutionId,
      verticalId: asId(verticalDoc?._id || club.verticalId),
      projectId: asId(projectDoc?._id || club.projectId),
      centerId: asId(centerDoc?._id || club.centerId),
      centerName: centerDoc?.name || club.centerName || '',
      projectName: projectDoc?.name || club.projectName || '',
      departmentName: verticalDoc?.name || club.departmentName || '',
      createdByUserId: asId(club.createdByUserId?._id || club.createdByUserId),
      adminUserIds: [
        ...new Set(
          [
            asId(club.createdByUserId?._id || club.createdByUserId),
            ...(club.adminUserIds || []).map((row) => asId(row?._id || row)),
          ].filter(Boolean)
        ),
      ],
      staffUserIds: [
        ...new Set((club.staffUserIds || []).map((row) => asId(row?._id || row)).filter(Boolean)),
      ],
      staffNames: (() => {
        const names = [];
        (club.staffUserIds || []).forEach((row) => {
          if (row && typeof row === 'object' && row.name) {
            if (!names.includes(row.name)) names.push(row.name);
            return;
          }
          const id = asId(row);
          const fromPeople = people.find((p) => p.id === id)?.name;
          if (fromPeople && !names.includes(fromPeople)) names.push(fromPeople);
        });
        return names;
      })(),
      ownerName:
        (club.createdByUserId && typeof club.createdByUserId === 'object'
          ? club.createdByUserId.name || ''
          : '') ||
        people.find((p) => p.id === asId(club.createdByUserId?._id || club.createdByUserId))?.name ||
        '',
      adminNames: (() => {
        const names = [];
        const pushName = (id, fallbackName) => {
          if (!id) return;
          const fromPeople = people.find((p) => p.id === id)?.name;
          const name = fallbackName || fromPeople;
          if (name && !names.includes(name)) names.push(name);
        };
        if (club.createdByUserId && typeof club.createdByUserId === 'object') {
          pushName(asId(club.createdByUserId._id), club.createdByUserId.name);
        } else {
          pushName(asId(club.createdByUserId));
        }
        (club.adminUserIds || []).forEach((row) => {
          if (row && typeof row === 'object') pushName(asId(row._id), row.name);
          else pushName(asId(row));
        });
        return names;
      })(),
      coordinatorId: asId(club.coordinatorId) || (assignedCoord ? assignedCoord.id : ''),
      canManage: (() => {
        const onCampus = !assignedCampusIds.size || assignedCampusIds.has(institutionId);
        if (!onCampus) return false;
        if (isMainInstituteAdmin) return true;
        if (cmsRole === 'institute') return true;
        const coordinator = asId(club.coordinatorId) || asId(assignedCoord?.id);
        const staffIds = (club.staffUserIds || []).map((row) => asId(row?._id || row)).filter(Boolean);
        if (cmsRole === 'senior_sales_engineer' || cmsRole === 'sales_engineer') {
          return Boolean(currentUserId) && (staffIds.includes(currentUserId) || coordinator === currentUserId);
        }
        if (cmsRole === 'club_admin') {
          const adminIds = [
            asId(club.createdByUserId?._id || club.createdByUserId),
            ...(club.adminUserIds || []).map((row) => asId(row?._id || row)),
          ].filter(Boolean);
          if (!adminIds.length && !coordinator) return true; // legacy unowned clubs
          return Boolean(currentUserId) && (adminIds.includes(currentUserId) || coordinator === currentUserId);
        }
        return onCampus;
      })(),
      eligibility: club.eligibility || '',
      joiningMethod: 'Approval Required',
      meetingSchedule: club.meetingSchedule || '',
      location: club.location || '',
      interests: club.interests || [],
      featured: Boolean(club.featured),
      accentColor: clubTheme.primary,
      bannerSvgDataUrl: createClubArtworkDataUrl(
        club.name,
        (club.category || 'CLUB').toUpperCase(),
        clubTheme.primary,
        clubTheme.secondary,
        clubTheme.bg,
        clubTheme.motif
      ),
      members: membersByClub[clubId] || [],
    };
  });

  const positionRequests = (payload.positionRequests || []).map((item) => ({
    id: asId(item._id),
    positionId: asId(item.positionId),
    clubId: asId(item.clubId),
    studentId: asId(item.studentUserId),
    studentName: item.studentName,
    note: item.note,
    status:
      item.status === 'assigned'
        ? 'Assigned'
        : item.status === 'recommended'
          ? 'Recommended'
          : item.status === 'rejected'
            ? 'Rejected'
            : 'Pending',
    requestedAt: item.createdAt ? String(item.createdAt).slice(0, 10) : item.requestedAt || '',
    assignedAt: item.assignedAt || '',
  }));

  const holdersByPosition = {};
  positionRequests.forEach((request) => {
    if (request.status !== 'Assigned' || !request.positionId) return;
    if (!holdersByPosition[request.positionId]) holdersByPosition[request.positionId] = [];
    holdersByPosition[request.positionId].push({
      studentId: request.studentId,
      studentName: request.studentName || 'Student',
      assignedAt: request.assignedAt || '',
    });
  });

  const positions = (payload.positions || []).map((position) => {
    const id = asId(position._id);
    const seats = Math.max(1, Number(position.seats) || 1);
    const holders = holdersByPosition[id] || [];
    const filledSeats = holders.length;
    const computedStatus = filledSeats >= seats ? 'Filled' : position.status || 'Open';
    return {
      id,
      clubId: asId(position.clubId),
      title: position.title,
      description: position.description,
      seats,
      filledSeats,
      holders,
      status: computedStatus,
      termLabel: position.termLabel || '',
      termStart: position.termStart || '',
      termEnd: position.termEnd || '',
    };
  });

  const activities = (payload.activities || []).map((act) => {
    const hostClub = clubs.find((c) => c.id === asId(act.clubId));
    const subtitle = hostClub ? hostClub.name.toUpperCase() : 'CAMPUS ACTIVITY';
    const activityTheme = getClubTheme(hostClub?.theme);
    return {
      id: asId(act._id),
      clubId: asId(act.clubId),
      inChargeId: act.inChargeId || '',
      title: act.title,
      date: act.startDate || act.date || '',
      startDate: act.startDate || act.date || '',
      endDate: act.endDate || act.startDate || act.date || '',
      time: act.time || '',
      scheduleStatus: act.scheduleStatus || 'scheduled',
      location: act.location || '',
      latitude: act.latitude != null ? Number(act.latitude) : null,
      longitude: act.longitude != null ? Number(act.longitude) : null,
      placeId: act.placeId || '',
      mode: act.mode || 'In-Person',
      summary: act.summary || '',
      description: act.description || act.summary || '',
      featured: Boolean(act.featured),
      capacity: act.capacity || 40,
      tags: act.tags || [],
      certificateTemplateId: act.certificateTemplateId || 'classic',
      bannerSvgDataUrl: createClubArtworkDataUrl(
        act.title,
        subtitle,
        activityTheme.primary,
        activityTheme.secondary,
        activityTheme.bg,
        'event'
      ),
      registrations: (act.registrations || []).map((reg) => ({
        id: asId(reg._id),
        activityId: asId(act._id),
        studentId: asId(reg.studentUserId),
        studentName: reg.studentName,
        studentEmail: reg.studentEmail,
        registeredAt: reg.registeredAt || '',
        attendance: reg.attendance || 'Pending',
        approvalStatus: reg.approvalStatus || 'pending',
        registrantRole: reg.registrantRole || 'student',
      })),
    };
  });

  const suggestions = (payload.suggestions || []).map((sug) => ({
    id: asId(sug._id),
    studentId: asId(sug.studentUserId),
    submittedBy: sug.submittedBy || 'Student',
    name: sug.name,
    category: sug.category || 'Creative',
    description: sug.description || '',
    whyNeeded: sug.whyNeeded || '',
    expectedFormat: sug.expectedFormat || '',
    status: sug.status || 'Submitted',
    submittedAt: sug.submittedAt || (sug.createdAt ? String(sug.createdAt).slice(0, 10) : ''),
  }));

  const posts = (payload.posts || []).map((post) => ({
    id: asId(post._id),
    clubId: asId(post.clubId),
    authorId: asId(post.authorUserId),
    author: post.author || 'Student',
    title: post.title,
    body: post.body,
    mediaType: post.mediaType || 'text',
    mediaUrl: post.mediaUrl || '',
    likes: (post.likes || []).map(String),
    shares: (post.shares || []).map(String),
    reports: post.reports || [],
    reportStatus: post.reportStatus || 'open',
    createdAt: post.createdAtDate || (post.createdAt ? String(post.createdAt).slice(0, 10) : ''),
  }));

  const comments = (payload.posts || []).flatMap((post) =>
    (post.comments || []).map((c) => ({
      id: asId(c._id),
      postId: asId(post._id),
      authorId: asId(c.authorUserId),
      author: c.author || 'Student',
      body: c.body,
      createdAt: c.createdAt || '',
    }))
  );

  const announcements = (payload.announcements || []).map((ann) => ({
    id: asId(ann._id),
    clubId: asId(ann.clubId),
    title: ann.title,
    body: ann.body,
    audience: ann.audience || 'All',
    status: ann.status || 'published',
    submittedByName: ann.submittedByName || '',
    createdAt: ann.createdAtDate || (ann.createdAt ? String(ann.createdAt).slice(0, 10) : ''),
  }));

  const chatMessages = (payload.chatMessages || []).map((msg) => ({
    id: asId(msg._id),
    clubId: asId(msg.clubId),
    author: msg.author || 'Member',
    body: msg.body,
    createdAt: msg.createdAt || new Date().toISOString(),
  }));

  const budgets = (payload.budgets || []).map((b) => ({
    id: asId(b._id),
    clubId: asId(b.clubId),
    title: b.title,
    amount: b.amount || 0,
    purpose: b.purpose || '',
    status: b.status || 'Draft',
    requestedBy: b.requestedBy || b.submittedByName || '',
    recommendedBy: b.recommendedBy || '',
    submittedByName: b.submittedByName || '',
    approvedByName: b.approvedByName || '',
    createdAt: b.createdAtDate || (b.createdAt ? String(b.createdAt).slice(0, 10) : ''),
  }));

  const results = (payload.results || []).map((r) => ({
    id: asId(r._id),
    clubId: asId(r.clubId),
    activityId: asId(r.activityId),
    title: r.title,
    summary: r.summary || '',
    winners: r.winners || '',
    status: r.status || 'Published',
    declaredAt: r.declaredAt || '',
  }));

  const certificates = (payload.certificates || []).map((cert) => ({
    id: asId(cert._id),
    studentId: asId(cert.studentUserId),
    studentName: cert.studentName,
    clubId: asId(cert.clubId),
    activityId: asId(cert.activityId),
    title: cert.title,
    templateId: cert.templateId || 'classic',
    status: cert.status || 'Issued',
    issuedAt: cert.issuedAt || '',
    fileKey: cert.fileKey || '',
    fileUrl: cert.fileUrl || '',
  }));

  const redemptions = (payload.redemptions || []).map((red) => ({
    id: asId(red._id),
    studentId: asId(red.studentUserId),
    studentName: red.studentName,
    goodieId: red.goodieId,
    goodieName: red.goodieName,
    points: red.points,
    recipientType: red.recipientType || 'student',
    status: red.status || 'Pending',
    requestedAt: red.requestedAt || '',
  }));

  const clubWorkflows = (payload.clubWorkflows || []).map((wf) => ({
    id: asId(wf._id),
    clubId: asId(wf.clubId),
    action: wf.action,
    actorRole: wf.actorRole,
    actorName: wf.actorName,
    note: wf.note || '',
    status: wf.status || 'Requested',
    createdAt: wf.createdAtDate || '',
  }));

  const notifications = (payload.notifications || []).map((n) => ({
    id: asId(n._id),
    role: n.role || 'student',
    title: n.title,
    body: n.body || '',
    read: Boolean(n.read),
    createdAt: n.createdAtDate || (n.createdAt ? String(n.createdAt).slice(0, 10) : ''),
  }));

  const eligibleStudents = (payload.students || []).map((student) => ({
    studentId: asId(student.studentUserId || student._id),
    studentName: student.studentName || student.name || '',
    studentEmail: student.studentEmail || student.email || '',
    department: student.department || '',
  }));

  const campusById = new Map();
  const sourceCampuses = [
    ...((payload.campuses && payload.campuses.length ? payload.campuses : assignedColleges) || []),
    ...(payload.catalogCampuses || []),
  ];
  sourceCampuses.forEach((campus) => {
    const id = asId(campus?._id || campus?.id);
    if (id) campusById.set(id, campus);
  });
  const campuses = [...campusById.values()];
  const currentUser = payload.currentUser || {};
  const stuState = payload.studentState || {};
  const currentStudentId = asId(currentUser._id || currentUser.id || stuState.studentUserId);

  const pointsLedger = (stuState.pointsLedger || []).map((entry, idx) => ({
    id: asId(entry._id) || `pt-${idx}`,
    studentId: currentStudentId,
    label: entry.label,
    points: entry.points,
    at: entry.at || '',
  }));

  const goodies = (payload.goodies || []).map((g) => ({
    id: asId(g._id),
    name: g.name,
    points: g.points || 0,
    stock: g.stock || 0,
    category: g.category || 'Merch',
    audience: g.audience || 'both',
    collegeId: asId(g.collegeId),
    collegeName: g.collegeName || '',
  }));

  const faqs = (payload.faqs || []).map((f) => ({
    id: asId(f._id),
    question: f.question,
    answer: f.answer,
    sortOrder: f.sortOrder || 0,
  }));

  const badges = (payload.badges || []).map((b) => ({
    id: asId(b._id),
    code: b.code || asId(b._id),
    name: b.name,
    description: b.description || '',
    icon: b.icon || 'crest',
    logoUrl: b.logoUrl || '',
  }));

  return {
    ...emptyLiveCmsState(assignedColleges),
    clubs,
    positions,
    positionRequests,
    activities,
    suggestions,
    posts,
    comments,
    announcements,
    chatMessages,
    budgets,
    results,
    certificates,
    redemptions,
    goodies,
    faqs,
    badges,
    pointsLedger,
    people,
    clubWorkflows,
    notifications,
    eligibleStudents,
    institutions: mapCampuses(campuses),
    currentStudent: {
      id: currentStudentId || asId(currentUser.id || stuState.studentUserId),
      name: stuState.name || currentUser.name || 'Student',
      email: currentUser.email || stuState.email || '',
      mobile: currentUser.mobile || stuState.mobile || '',
      department: stuState.department || 'Campus Student',
      year: stuState.year || 'Active',
      bio: stuState.bio || '',
      points: stuState.points != null ? stuState.points : 0,
      badgesEarned: stuState.badgesEarned || [],
      savedActivityIds: (stuState.savedActivityIds || []).map(String),
      selectedInterests: stuState.selectedInterests || [],
    },
    notificationTemplates: (payload.notificationTemplates || []).map((t) => ({
      id: asId(t._id),
      type: t.type || 'participation',
      title: t.title,
      body: t.body || '',
      enabled: t.enabled !== false,
    })),
    achievementCards: (payload.achievementCards || []).map((card) => ({
      id: asId(card._id),
      clubId: asId(card.clubId),
      resultId: asId(card.resultId),
      certificateId: asId(card.certificateId),
      title: card.title,
      summary: card.summary || '',
      createdByName: card.createdByName || '',
      sharedAt: card.sharedAt || '',
    })),
    settings: {
      positionsFeatureEnabled: payload.settings
        ? payload.settings.positionsFeatureEnabled !== false
        : true,
      institutePoints: payload.institutePoints || payload.settings?.institutePoints || 0,
    },
  };
}
