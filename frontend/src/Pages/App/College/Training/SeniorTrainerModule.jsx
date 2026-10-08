import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import '../ProjectMangement/listView.css';
import {
  BLUE,
  GREEN,
  AC_SESSIONS_STORAGE_PREFIX,
  WORKFLOW_STATUS,
  getOptionLabel,
  mapApiOptions,
  getLinkedCourseOptions,
  formatSessionDate,
  fetchCoordinatorSessionsApi,
  patchCoordinatorSessionApi,
  loadCoordinatorSessions,
  filterSessionsForSeniorTrainer,
  applyPathFilters,
  parseSessionDateKey,
  isTotSession,
  appearsOnStudentCalendar,
  mapSessionForTotCalendar,
  resolveSessionSelectionId,
  sortSessionsByDate,
  ST_CSS,
} from './seniorTrainer/seniorTrainerShared';
import TrainingCalendar from './seniorTrainer/TrainingCalendar';
import SessionDayTimetable from './seniorTrainer/SessionDayTimetable';
import SessionTable from './seniorTrainer/SessionTable';
import SessionAssignModal from './seniorTrainer/SessionAssignModal';
import SeniorSessionCard from './seniorTrainer/SeniorSessionCard';

const SAMPLE_LIST_SESSIONS = [
  {
    id: 'dummy-list-1',
    title: 'Communication Skills',
    sessionType: 'student',
    activityTypeName: 'Classroom',
    sessionDate: '2026-10-07',
    startTime: '09:00',
    endTime: '10:00',
    centerName: 'Lucknow Center',
    courseName: 'Digital Marketing',
    courseTrade: 'Digital Marketing',
    batchCode: 'DM Morning',
    fieldTrainerId: '',
    fieldTrainerName: '',
    sample: true,
  },
  {
    id: 'dummy-list-2',
    title: 'Digital Marketing',
    sessionType: 'student',
    activityTypeName: 'Practical',
    sessionDate: '',
    startTime: '',
    endTime: '',
    fieldTrainerId: '',
    fieldTrainerName: '',
    sample: true,
  },
  {
    id: 'dummy-list-3',
    title: 'Mock Interview',
    sessionType: 'tot',
    activityTypeName: 'Interview',
    sessionDate: '2026-10-08',
    startTime: '10:00',
    endTime: '11:00',
    fieldTrainerId: '',
    fieldTrainerName: 'Rahul Sharma',
    sample: true,
  },
  {
    id: 'dummy-list-4',
    title: 'Coding Club',
    sessionType: 'student',
    includeTot: true,
    activityTypeName: 'Club',
    sessionDate: '2026-10-09',
    startTime: '14:45',
    endTime: '15:45',
    fieldTrainerId: '',
    fieldTrainerName: '',
    sample: true,
  },
];

const SeniorTrainerModule = () => {
  const userData = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);
  const token = userData.token;
  const seniorTrainerId = userData._id || userData.id;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';

  const [permissions, setPermissions] = useState();

  const updatedPermission = async () => {
    const respose = await axios.get(`${backendUrl}/college/permission`, {
      headers: { 'x-auth': token },
    });
    if (respose.data.status) {
      setPermissions(respose.data.permissions);
    }
  };

  useEffect(() => {
    if (token) updatedPermission();
  }, []);

  useEffect(() => {
    if (document.getElementById('st-font-plus-jakarta')) return undefined;
    const link = document.createElement('link');
    link.id = 'st-font-plus-jakarta';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  const canBeSeniorTrainerPermission =
    (permissions?.custom_permissions?.can_be_senior_trainer && permissions?.permission_type === 'Custom') ||
    permissions?.permission_type === 'Admin';
  const canBeTrainerPermission =
    (permissions?.custom_permissions?.can_be_trainer && permissions?.permission_type === 'Custom') ||
    permissions?.permission_type === 'Admin';
  const canOpenTimetable = canBeSeniorTrainerPermission || canBeTrainerPermission;

  const [reportDate, setReportDate] = useState(new Date());
  const [filters, setFilters] = useState({
    center: '',
    course: '',
    batch: '',
  });
  const [centerOptions, setCenterOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [allCoursesMeta, setAllCoursesMeta] = useState([]);
  const [allCentersMeta, setAllCentersMeta] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [timetableOpen, setTimetableOpen] = useState(false);
  const [draftCourseId, setDraftCourseId] = useState('');
  const [draftBatchId, setDraftBatchId] = useState('');
  const [draftBatches, setDraftBatches] = useState([]);
  const [loadingDraftBatches, setLoadingDraftBatches] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [openedSelection, setOpenedSelection] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [sampleSessions, setSampleSessions] = useState(SAMPLE_LIST_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [trainerOptions, setTrainerOptions] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [editSessionId, setEditSessionId] = useState('');

  const pathLabels = useMemo(() => ({
    centerName: getOptionLabel(centerOptions, filters.center),
    courseTrade: getOptionLabel(courseOptions, filters.course),
    batchCode: getOptionLabel(batchOptions, filters.batch),
  }), [filters, centerOptions, courseOptions, batchOptions]);

  const batchSummary = useMemo(() => [
    pathLabels.centerName,
    pathLabels.courseTrade,
    pathLabels.batchCode,
  ].filter(Boolean).join(' · '), [pathLabels]);

  const filteredCourseOptions = useMemo(
    () => getLinkedCourseOptions(filters.center, courseOptions, allCentersMeta, allCoursesMeta),
    [filters.center, allCentersMeta, courseOptions, allCoursesMeta]
  );

  const reloadSessions = useCallback(() => {
    if (!token) {
      const local = filters.batch
        ? filterSessionsForSeniorTrainer(loadCoordinatorSessions(filters.batch), seniorTrainerId)
        : [];
      setSessions(applyPathFilters(local, filters));
      return;
    }

    // Always load referred sessions for this senior trainer (batch filter is optional)
    fetchCoordinatorSessionsApi(backendUrl, token, {
      seniorTrainerId: '',
      excludeScheduled: true,
    })
      .then((data) => {
        const mine = filterSessionsForSeniorTrainer(data, seniorTrainerId);
        setSessions(applyPathFilters(mine, filters));
      })
      .catch((err) => {
        console.error('Failed to load sessions', err);
        const local = filters.batch
          ? filterSessionsForSeniorTrainer(loadCoordinatorSessions(filters.batch), seniorTrainerId)
          : [];
        setSessions(applyPathFilters(local, filters));
      });
  }, [filters, seniorTrainerId, backendUrl, token]);

  useEffect(() => {
    reloadSessions();
    setSelectedSessionId('');
  }, [reloadSessions]);

  useEffect(() => {
    setAssignmentDrafts((prev) => {
      const next = {};
      sessions.forEach((session) => {
        const existing = prev[session.id];
        next[session.id] = {
          assignDate: existing?.assignDate ?? parseSessionDateKey(session),
          trainerId: existing?.trainerId ?? session.fieldTrainerId ?? '',
        };
      });
      return next;
    });
  }, [sessions]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    const fetchTrainers = async () => {
      setLoadingTrainers(true);
      try {
        const res = await axios.get(`${backendUrl}/college/users/training-role-users?roleType=session`, {
          headers: { 'x-auth': token },
        });
        if (cancelled) return;
        const trainers = (res.data?.data || [])
          .filter((trainer) => trainer._id)
          .map((trainer) => ({
            value: String(trainer._id),
            label: trainer.name || trainer.email || 'Trainer',
          }));
        setTrainerOptions(trainers);
      } catch (err) {
        console.error('Failed to fetch trainers:', err);
        if (!cancelled) setTrainerOptions([]);
      } finally {
        if (!cancelled) setLoadingTrainers(false);
      }
    };

    fetchTrainers();
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  const editingSession = useMemo(
    () => [...sampleSessions, ...sessions].find((session) => session.id === editSessionId) || null,
    [sampleSessions, sessions, editSessionId]
  );

  const handleOpenEditModal = useCallback((sessionId) => {
    setEditSessionId(resolveSessionSelectionId(sessionId));
  }, []);

  const handleCloseEditModal = useCallback(() => setEditSessionId(''), []);

  const handleModalSave = useCallback(async (sessionId, {
    center,
    course,
    batch,
    assignDate,
    trainerId,
    centerName,
    courseName,
    batchCode,
  }) => {
    const trainerName = trainerId
      ? (trainerOptions.find((trainer) => String(trainer.value) === String(trainerId))?.label || '')
      : '';
    const formattedDate = formatSessionDate(assignDate);
    const workflowStatus = trainerId ? WORKFLOW_STATUS.ASSIGNED : WORKFLOW_STATUS.SENT_TO_SENIOR;
    const applyAssignment = (session) => ({
      ...session,
      center: center || session.center,
      course: course || session.course,
      batch: batch || session.batch,
      centerName: centerName || session.centerName,
      courseName: courseName || session.courseName,
      courseTrade: courseName || session.courseTrade,
      batchCode: batchCode || session.batchCode,
      fieldTrainerId: trainerId,
      fieldTrainerName: trainerName || (trainerId ? session.fieldTrainerName : '') || '',
      sessionDate: assignDate || session.sessionDate,
      date: formattedDate || session.date,
      workflowStatus: trainerId
        ? WORKFLOW_STATUS.ASSIGNED
        : (session.workflowStatus === WORKFLOW_STATUS.ASSIGNED
          ? WORKFLOW_STATUS.SENT_TO_SENIOR
          : session.workflowStatus),
    });

    if (String(sessionId).startsWith('dummy-list-')) {
      setSampleSessions((prevSessions) => prevSessions.map((session) => (
        session.id === sessionId ? applyAssignment(session) : session
      )));
      setAssignmentDrafts((prev) => ({
        ...prev,
        [sessionId]: { assignDate, trainerId },
      }));
      return;
    }

    setSessions((prevSessions) => prevSessions.map((session) => {
      if (session.id !== sessionId) return session;
      return {
        ...session,
        center: center || session.center,
        course: course || session.course,
        batch: batch || session.batch,
        centerName: centerName || session.centerName,
        courseName: courseName || session.courseName,
        courseTrade: courseName || session.courseTrade,
        batchCode: batchCode || session.batchCode,
        fieldTrainerId: trainerId,
        fieldTrainerName: trainerName || session.fieldTrainerName || '',
        sessionDate: assignDate || session.sessionDate,
        date: formattedDate || session.date,
        workflowStatus: trainerId
          ? WORKFLOW_STATUS.ASSIGNED
          : (session.workflowStatus === WORKFLOW_STATUS.ASSIGNED
            ? WORKFLOW_STATUS.SENT_TO_SENIOR
            : session.workflowStatus),
      };
    }));

    setAssignmentDrafts((prev) => ({
      ...prev,
      [sessionId]: { assignDate, trainerId },
    }));

    if (token) {
      try {
        await patchCoordinatorSessionApi(backendUrl, token, sessionId, {
          center: center || undefined,
          course: course || undefined,
          batch: batch || undefined,
          centerName: centerName || undefined,
          courseName: courseName || undefined,
          batchCode: batchCode || undefined,
          fieldTrainerId: trainerId,
          fieldTrainerName: trainerName,
          sessionDate: assignDate || undefined,
          date: formattedDate || undefined,
          workflowStatus,
        });
      } catch (err) {
        console.error('Failed to save assignment', err);
        throw err;
      }
    }
  }, [trainerOptions, backendUrl, token]);

  const handleAssignPeriod = useCallback(async (sessionId, {
    assignDate = '',
    startTime = '',
    endTime = '',
    timetableType = 'course',
  }) => {
    const sourceId = resolveSessionSelectionId(sessionId);
    const formattedDate = assignDate ? formatSessionDate(assignDate) : '';

    if (token) {
      await patchCoordinatorSessionApi(backendUrl, token, sourceId, {
        sessionDate: assignDate || null,
        date: formattedDate,
        startTime,
        endTime,
        timetableType,
      });
    }

    setSessions((prevSessions) => prevSessions.map((session) => {
      if (resolveSessionSelectionId(session.id) !== sourceId) return session;
      return {
        ...session,
        sessionDate: assignDate,
        date: formattedDate,
        startTime,
        endTime,
        timetableType,
      };
    }));
    setAssignmentDrafts((prev) => ({
      ...prev,
      [sourceId]: {
        ...(prev[sourceId] || {}),
        assignDate,
      },
    }));
  }, [backendUrl, token]);

  useEffect(() => {
    const onFocus = () => reloadSessions();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reloadSessions]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key?.startsWith(AC_SESSIONS_STORAGE_PREFIX)) reloadSessions();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [reloadSessions]);

  useEffect(() => {
    if (!token) {
      setLoadingCenters(false);
      return undefined;
    }
    const requestConfig = { headers: { 'x-auth': token } };
    let cancelled = false;

    const fetchFilterOptions = async () => {
      setLoadingCenters(true);
      try {
        const [centersRes, coursesRes, filtersRes] = await Promise.allSettled([
          axios.get(`${backendUrl}/college/list_all_centers`, requestConfig),
          axios.get(`${backendUrl}/college/all_courses`, requestConfig),
          axios.get(`${backendUrl}/college/filters-data`, requestConfig),
        ]);
        if (cancelled) return;

        if (centersRes.status === 'fulfilled' && centersRes.value.data?.success) {
          const centers = centersRes.value.data.data || [];
          setAllCentersMeta(centers);
          setCenterOptions(mapApiOptions(centers));
        } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
          const centers = filtersRes.value.data.centers || [];
          setAllCentersMeta(centers);
          setCenterOptions(mapApiOptions(centers));
        }

        if (coursesRes.status === 'fulfilled' && coursesRes.value.data?.success) {
          const courses = coursesRes.value.data.data || [];
          setAllCoursesMeta(courses);
          setCourseOptions(mapApiOptions(courses));
        } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
          const courses = filtersRes.value.data.courses || [];
          setAllCoursesMeta(courses);
          setCourseOptions(mapApiOptions(courses));
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      } finally {
        if (!cancelled) setLoadingCenters(false);
      }
    };

    fetchFilterOptions();
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  useEffect(() => {
    if (!filters.center) {
      setLoadingCourses(false);
      return;
    }
    setLoadingCourses(true);
    const timer = setTimeout(() => setLoadingCourses(false), 150);
    return () => clearTimeout(timer);
  }, [filters.center]);

  useEffect(() => {
    if (!token || !draftCourseId) {
      setDraftBatches([]);
      return undefined;
    }
    let cancelled = false;
    const loadDraftBatches = async () => {
      setLoadingDraftBatches(true);
      try {
        const res = await axios.get(`${backendUrl}/college/get_batches`, {
          headers: { 'x-auth': token },
          params: { courseId: draftCourseId },
        });
        if (cancelled) return;
        const rows = (res.data?.data || []).map((batch) => ({
          value: String(batch._id),
          label: batch.name || 'Batch',
        }));
        setDraftBatches(rows);
        setDraftBatchId((current) => (rows.some((row) => row.value === current) ? current : ''));
      } catch (err) {
        console.error('Failed to load course batches', err);
        if (!cancelled) setDraftBatches([]);
      } finally {
        if (!cancelled) setLoadingDraftBatches(false);
      }
    };
    loadDraftBatches();
    return () => { cancelled = true; };
  }, [draftCourseId, token, backendUrl]);

  useEffect(() => {
    if (!token || !filters.course) {
      setBatchOptions([]);
      return undefined;
    }
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const params = new URLSearchParams();
        params.set('courseId', filters.course);
        if (filters.center) params.set('centerId', filters.center);
        const res = await axios.get(`${backendUrl}/college/get_batches?${params.toString()}`, {
          headers: { 'x-auth': token },
        });
        if (res.data?.success) {
          setBatchOptions((res.data.data || []).map((batch) => ({
            value: String(batch._id),
            label: batch.name,
          })));
        } else {
          setBatchOptions([]);
        }
      } catch {
        setBatchOptions([]);
      } finally {
        setLoadingBatches(false);
      }
    };
    fetchBatches();
    return undefined;
  }, [filters.center, filters.course, token, backendUrl]);

  const handleFilterChange = (key, value) => {
    if (key === 'center') {
      setFilters({ center: value, course: '', batch: '' });
      setSelectedSessionId('');
      return;
    }
    if (key === 'course') {
      setFilters((prev) => ({ ...prev, course: value, batch: '' }));
      setSelectedSessionId('');
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedSessionId('');
  };

  const handleFilterReset = () => {
    setFilters({ center: '', course: '', batch: '' });
    setSelectedSessionId('');
  };

  const handleDraftCourseChange = (value) => {
    setDraftCourseId(value);
    setDraftBatchId('');
    setSearchMessage('');
  };

  const handleTimetableSearch = (event) => {
    event.preventDefault();
    if (!draftCourseId || !draftBatchId) {
      setSearchMessage('Select course and batch.');
      return;
    }
    const course = courseOptions.find((item) => item.value === draftCourseId);
    const batch = draftBatches.find((item) => item.value === draftBatchId);
    setSearchMessage('');
    setOpenedSelection({
      courseName: course?.label || 'Course',
      batchName: batch?.label || 'Batch',
    });
    setFilters({ center: '', course: draftCourseId, batch: draftBatchId });
    setSelectedSessionId('');
    setTimetableOpen(true);
  };

  const handleTimetableBack = () => {
    setTimetableOpen(false);
    setFilters({ center: '', course: '', batch: '' });
    setSelectedSessionId('');
  };

  const totSessions = useMemo(
    () => sessions.filter((session) => isTotSession(session)).map(mapSessionForTotCalendar),
    [sessions]
  );

  const studentSessions = useMemo(
    () => sessions.filter((session) => appearsOnStudentCalendar(session)),
    [sessions]
  );

  const tableSessions = useMemo(() => sortSessionsByDate(sessions), [sessions]);

  const listSessions = useMemo(
    () => [...sampleSessions, ...tableSessions],
    [sampleSessions, tableSessions]
  );

  const selectedSession = useMemo(() => {
    const resolvedId = resolveSessionSelectionId(selectedSessionId);
    return listSessions.find((session) => session.id === resolvedId) || null;
  }, [listSessions, selectedSessionId]);

  const handleSelectSession = (sessionId) => {
    const resolvedId = resolveSessionSelectionId(sessionId);
    setSelectedSessionId((prev) => (resolveSessionSelectionId(prev) === resolvedId ? '' : resolvedId));
  };

  if (permissions && !canBeSeniorTrainerPermission) {
    return (
      <div className="st-portal">
        <style>{ST_CSS}</style>
        <div style={{ marginTop: 40, textAlign: 'center', padding: 48 }}>
          <i className="fas fa-lock" style={{ fontSize: 32, color: '#94a3b8', marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 8px' }}>Access denied</h3>
          <p style={{ margin: 0, color: '#64748b' }}>
            You need <strong>Senior Trainer</strong> permission (or Admin) to use this module.
          </p>
        </div>
      </div>
    );
  }

  if (!timetableOpen) {
    return (
      <div className="container py-4 vt-page vt-screen-enter">
        <div className="vt-shell">
          <div className="vt-head">
            <div>
              <p className="vt-kicker">Training</p>
              <h4 style={{ margin: '2px 0 0', fontWeight: 800, color: '#1e293b' }}>Batch Time Table</h4>
            </div>
          </div>

          <form onSubmit={handleTimetableSearch} style={{ marginTop: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, maxWidth: 720 }}>
              <label>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9f1239', marginBottom: 6 }}>Course</span>
                <select
                  className="form-select"
                  value={draftCourseId}
                  onChange={(e) => handleDraftCourseChange(e.target.value)}
                  disabled={loadingCenters}
                >
                  <option value="">{loadingCenters ? 'Loading...' : 'Select course'}</option>
                  {courseOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9f1239', marginBottom: 6 }}>Batch</span>
                <select
                  className="form-select"
                  value={draftBatchId}
                  onChange={(e) => {
                    setDraftBatchId(e.target.value);
                    setSearchMessage('');
                  }}
                  disabled={!draftCourseId || loadingDraftBatches}
                >
                  <option value="">
                    {!draftCourseId
                      ? 'Select course first'
                      : loadingDraftBatches
                        ? 'Loading...'
                        : draftBatches.length
                          ? 'Select batch'
                          : 'No batches for this course'}
                  </option>
                  {draftBatches.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ marginTop: 16 }}>
              <button type="submit" className="vt-add">Search</button>
            </div>
            {searchMessage && <p className="text-danger mt-3 mb-0">{searchMessage}</p>}
          </form>

          <div className="vt-empty">
            <i className="bi bi-funnel"></i>
            <h5>Search to see the time table</h5>
            <p>Choose a course, then the batch connected to that course.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="st-portal">
      <style>{ST_CSS}</style>

      <header className="st-header">
        <div>
          <div className="st-role-badge">
            <i className="fas fa-user-shield" /> Senior Trainer
          </div>
          <h1 className="st-title">Training Calendar</h1>
          {openedSelection && (
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
              {openedSelection.courseName} · {openedSelection.batchName}
            </p>
          )}
        </div>
        <button type="button" className="vt-back" onClick={handleTimetableBack}>
          Change course / batch
        </button>
      </header>



      <div className="st-stats-row">
        <div className="st-stat">
          <strong>{sessions.filter((s) => isTotSession(s)).length}</strong>
          <span>TOT plans</span>
        </div>
        <div className="st-stat st-stat--green">
          <strong>{sessions.filter((s) => appearsOnStudentCalendar(s)).length}</strong>
          <span>Student sessions</span>
        </div>
        <div className="st-stat st-stat--amber">
          <strong>{sessions.filter((s) => s.workflowStatus === WORKFLOW_STATUS.SENT_TO_SENIOR).length}</strong>
          <span>Sent for review</span>
        </div>
      </div>

      <div className="st-workspace">
        <SessionDayTimetable
          sessions={tableSessions}
          assignmentDrafts={assignmentDrafts}
          selectedSessionId={selectedSessionId}
          onSelectSession={handleSelectSession}
          onAssignPeriod={handleAssignPeriod}
        />

        <div className="st-dual-calendars">
          <TrainingCalendar
            title="TOT Calendar"
            icon="fa-chalkboard-teacher"
            accent={BLUE}
            sessions={totSessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
          />
          <TrainingCalendar
            title="Session Calendar"
            icon="fa-user-graduate"
            accent={GREEN}
            sessions={studentSessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
          />
        </div>

        <SessionTable
          sessions={listSessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={handleSelectSession}
          filters={filters}
          centerOptions={centerOptions}
          courseOptions={filteredCourseOptions}
          batchOptions={batchOptions}
          loadingCenters={loadingCenters}
          loadingCourses={loadingCourses}
          loadingBatches={loadingBatches}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          hideFilters
          assignmentDrafts={assignmentDrafts}
          trainerOptions={trainerOptions}
          loadingTrainers={loadingTrainers}
          onEditSession={handleOpenEditModal}
        />

        <div className="st-detail-panel">
          {selectedSession ? (
            <SeniorSessionCard
              key={selectedSession.id}
              session={selectedSession}
              token={token}
              backendUrl={backendUrl}
              onSessionUpdated={(savedSession) => {
                if (!savedSession?.id && !savedSession?._id) return;
                const sessionId = String(savedSession.id || savedSession._id);
                setSessions((prev) => prev.map((item) => (
                  String(item.id) === sessionId
                    ? { ...item, ...savedSession, id: sessionId }
                    : item
                )));
              }}
            />
          ) : (
            <div className="st-detail-empty">
              <i className="fas fa-hand-pointer" />
              <h4>Select a session</h4>
              <p>Click any session cell on the Session or TOT grid, or a row in the table, to view its full plan card.</p>
              {!filters.batch && sessions.length === 0 && (
                <p className="st-detail-empty__hint">
                  No referred sessions yet. Ask Academic Coordinator to refer a plan to your account.
                </p>
              )}
              {filters.batch && !totSessions.length && !studentSessions.length && (
                <p className="st-detail-empty__hint">
                  No sessions match this Center/Course/Batch filter. Clear filters to see all referred plans.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {editingSession && (
        <SessionAssignModal
          session={editingSession}
          centerOptions={centerOptions}
          courseOptions={courseOptions}
          allCentersMeta={allCentersMeta}
          allCoursesMeta={allCoursesMeta}
          trainerOptions={trainerOptions}
          loadingTrainers={loadingTrainers}
          backendUrl={backendUrl}
          token={token}
          onClose={handleCloseEditModal}
          onSave={handleModalSave}
        />
      )}
    </div>


  );
};

export default SeniorTrainerModule;
