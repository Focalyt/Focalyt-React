import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import axios from 'axios';

import './batchMonitoring.css';

const BatchMonitoring = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const userData =
    JSON.parse(
      sessionStorage.getItem('user') || '{}'
    );

  const token = userData.token;

  const headers = {
    'x-auth': token,
  };

  // =========================================================
  // MAIN DATA
  // =========================================================

  const [
    loadingSessions,
    setLoadingSessions,
  ] = useState(true);

  const [
    loadingBatches,
    setLoadingBatches,
  ] = useState(true);

  const [
    loadingStudents,
    setLoadingStudents,
  ] = useState(true);

  const [
    sessions,
    setSessions,
  ] = useState([]);

  const [
    allBatches,
    setAllBatches,
  ] = useState([]);

  const [
    students,
    setStudents,
  ] = useState([]);

  // =========================================================
  // UI / VIEW
  // =========================================================

  const [
    activeView,
    setActiveView,
  ] = useState('batch');

  // batch | session | student

  const [
    quickSearch,
    setQuickSearch,
  ] = useState('');

  const [
    datePreset,
    setDatePreset,
  ] = useState('today');

  const [
    aiPerformanceFilter,
    setAiPerformanceFilter,
  ] = useState('all');

  const [
    performanceFilter,
    setPerformanceFilter,
  ] = useState('all');

  const [
    followupCallFilter,
    setFollowupCallFilter,
  ] = useState('');

  const [
    followupVisitFilter,
    setFollowupVisitFilter,
  ] = useState('');

  const [
    milestoneFilter,
    setMilestoneFilter,
  ] = useState('');

  const [
    openCardMenu,
    setOpenCardMenu,
  ] = useState(null);

  const [
    openCardId,
    setOpenCardId,
  ] = useState(null);

  const [
    cardEdits,
    setCardEdits,
  ] = useState({});

  const [
    actionPanel,
    setActionPanel,
  ] = useState(null);

  const [
    panelForm,
    setPanelForm,
  ] = useState({
    status: '',
    subStatus: '',
    date: '',
    time: '',
    remarks: '',
  });

  // =========================================================
  // FILTERS
  // =========================================================

  const [
    filters,
    setFilters,
  ] = useState({
    department: '',
    project: '',
    center: '',
    course: '',
    batch: '',
    trainer: '',
  });

  // =========================================================
  // REFER SESSION
  // =========================================================

  const [
    referSession,
    setReferSession,
  ] = useState(null);

  const [
    selectedSessionIds,
    setSelectedSessionIds,
  ] = useState([]);

  const [
    referBatches,
    setReferBatches,
  ] = useState([]);

  const [
    selectedBatchId,
    setSelectedBatchId,
  ] = useState('');

  const [
    batchesLoading,
    setBatchesLoading,
  ] = useState(false);

  const [
    team,
    setTeam,
  ] = useState({
    seniorTrainers: [],
    trainers: [],
  });

  const [
    teamLoading,
    setTeamLoading,
  ] = useState(false);

  const [
    selectedPersonId,
    setSelectedPersonId,
  ] = useState('');

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    referMessage,
    setReferMessage,
  ] = useState('');

  // =========================================================
  // LOAD SESSIONS
  // =========================================================

  const loadSessions = async () => {
    setLoadingSessions(true);

    try {
      const response =
        await axios.get(
          `${backendUrl}/college/session-plans`,
          {
            headers,
          }
        );

      setSessions(
        response.data?.data || []
      );
    } catch (error) {
      console.error(
        'Error fetching sessions:',
        error
      );

      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  // =========================================================
  // LOAD BATCHES
  // =========================================================

  const loadAllBatches = async () => {
    setLoadingBatches(true);

    try {
      const response =
        await axios.get(
          `${backendUrl}/college/get_batches`,
          {
            headers,
          }
        );

      setAllBatches(
        response.data?.data || []
      );
    } catch (error) {
      console.error(
        'Error fetching batches:',
        error
      );

      setAllBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  // =========================================================
  // LOAD STUDENTS
  // =========================================================

  const loadStudents = async () => {
    setLoadingStudents(true);

    try {
      /*
       * IMPORTANT:
       * If your actual student API endpoint is different,
       * change only this endpoint.
       */

      const response =
        await axios.get(
          `${backendUrl}/college/appliedCandidates`,
          {
            headers,

            params: {
              page: 1,
              limit: 100,
            },
          }
        );

      const result =
        response.data?.data ||
        response.data?.profiles ||
        response.data?.result ||
        [];

      setStudents(
        Array.isArray(result)
          ? result
          : []
      );
    } catch (error) {
      console.error(
        'Error fetching students:',
        error
      );

      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!backendUrl || !token) {
      return;
    }

    loadSessions();
    loadAllBatches();
    loadStudents();
  }, [
    backendUrl,
    token,
  ]);

  // =========================================================
  // REFER SESSION COURSE SESSIONS
  // =========================================================

  const courseSessions =
    useMemo(() => {
      if (!referSession) {
        return [];
      }

      return sessions.filter(
        (session) => {
          if (!referSession.course) {
            return true;
          }

          return (
            String(
              session.course
            ) ===
            String(
              referSession.course
            )
          );
        }
      );
    }, [
      referSession,
      sessions,
    ]);

  // =========================================================
  // LOAD BATCH TRAINING TEAM
  // =========================================================

  const loadBatchTeam =
    async (batchId) => {
      if (!batchId) {
        setTeam({
          seniorTrainers: [],
          trainers: [],
        });

        setSelectedPersonId('');

        return;
      }

      setTeamLoading(true);

      try {
        const response =
          await axios.get(
            `${backendUrl}/college/batches/${batchId}/training-team`,
            {
              headers,
            }
          );

        setTeam({
          seniorTrainers:
            response.data
              ?.seniorTrainers ||
            [],

          trainers:
            response.data
              ?.trainers ||
            [],
        });

        setSelectedPersonId('');
      } catch (error) {
        console.error(
          'Error fetching batch team:',
          error
        );

        setTeam({
          seniorTrainers: [],
          trainers: [],
        });

        setReferMessage(
          error?.response?.data
            ?.message ||
            'Could not load this batch team.'
        );
      } finally {
        setTeamLoading(false);
      }
    };

  // =========================================================
  // OPEN REFER
  // =========================================================

  const openRefer =
    async (session) => {
      setReferMessage('');

      setReferSession(session);

      setSelectedSessionIds([
        String(
          session.id ||
          session._id
        ),
      ]);

      const initialBatchId =
        session.batch
          ? String(
              session.batch
            )
          : '';

      setSelectedBatchId(
        initialBatchId
      );

      setSelectedPersonId('');

      setTeam({
        seniorTrainers: [],
        trainers: [],
      });

      setReferBatches([]);

      if (!session.course) {
        setReferMessage(
          'This session has no course.'
        );

        return;
      }

      setBatchesLoading(true);

      try {
        const response =
          await axios.get(
            `${backendUrl}/college/get_batches`,
            {
              headers,

              params: {
                courseId:
                  session.course,
              },
            }
          );

        const list =
          response.data?.data ||
          [];

        setReferBatches(list);

        const batchId =
          initialBatchId ||
          (
            list.length === 1
              ? String(
                  list[0]._id
                )
              : ''
          );

        if (
          !initialBatchId &&
          batchId
        ) {
          setSelectedBatchId(
            batchId
          );
        }

        if (batchId) {
          await loadBatchTeam(
            batchId
          );
        }
      } catch (error) {
        console.error(
          'Error fetching batches:',
          error
        );

        setReferMessage(
          'Could not load batches for this course.'
        );
      } finally {
        setBatchesLoading(false);
      }
    };

  // =========================================================
  // TOGGLE SESSION
  // =========================================================

  const toggleSession =
    (sessionId) => {
      setReferMessage('');

      setSelectedSessionIds(
        (current) => {
          if (
            current.includes(
              sessionId
            )
          ) {
            return current.filter(
              (id) =>
                id !== sessionId
            );
          }

          return [
            ...current,
            sessionId,
          ];
        }
      );
    };

  // =========================================================
  // TOGGLE FULL COURSE
  // =========================================================

  const toggleCourse = () => {
    setReferMessage('');

    const allIds =
      courseSessions.map(
        (session) =>
          String(
            session.id ||
            session._id
          )
      );

    const allSelected =
      allIds.length > 0 &&
      allIds.every(
        (id) =>
          selectedSessionIds.includes(
            id
          )
      );

    setSelectedSessionIds(
      allSelected
        ? []
        : allIds
    );
  };

  // =========================================================
  // SAVE REFER SESSION
  // =========================================================

  const saveRefer =
    async () => {
      const chosen =
        courseSessions.filter(
          (session) =>
            selectedSessionIds.includes(
              String(
                session.id ||
                session._id
              )
            )
        );

      if (!selectedBatchId) {
        setReferMessage(
          'Select a batch.'
        );

        return;
      }

      if (
        chosen.length === 0
      ) {
        setReferMessage(
          'Select a session.'
        );

        return;
      }

      if (!selectedPersonId) {
        setReferMessage(
          'Select a trainer.'
        );

        return;
      }

      const personIsSenior =
        (
          team.seniorTrainers ||
          []
        ).some(
          (person) =>
            String(
              person._id
            ) ===
            String(
              selectedPersonId
            )
        );

      setSaving(true);

      setReferMessage('');

      try {
        const response =
          await axios.post(
            `${backendUrl}/college/batches/${selectedBatchId}/session-assignments`,

            {
              sessionIds:
                chosen.map(
                  (session) =>
                    session.id ||
                    session._id
                ),

              ...(personIsSenior
                ? {
                    seniorTrainerId:
                      selectedPersonId,
                  }
                : {
                    trainerId:
                      selectedPersonId,
                  }),
            },

            {
              headers,
            }
          );

        if (
          response.data
            ?.success ===
            false ||
          response.data
            ?.status ===
            false
        ) {
          setReferMessage(
            response.data
              ?.message ||
              'Could not save session assignment.'
          );

          return;
        }

        setReferSession(null);

        setSelectedSessionIds(
          []
        );

        await loadSessions();
      } catch (error) {
        console.error(
          'Error referring session:',
          error
        );

        setReferMessage(
          error?.response?.data
            ?.message ||
            'Could not save session assignment.'
        );
      } finally {
        setSaving(false);
      }
    };

  // =========================================================
  // HELPERS
  // =========================================================

  const formatDate =
    (value) => {
      if (!value) {
        return '—';
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return String(value);
      }

      return date.toLocaleDateString(
        'en-GB',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      );
    };

  const normalizeStatus =
    (value) =>
      String(
        value || ''
      )
        .trim()
        .toLowerCase();

  // =========================================================
  // BATCH COUNTS
  // =========================================================

  const dashboardCounts =
    useMemo(() => {
      const activeBatches =
        allBatches.filter(
          (batch) => {
            const status =
              normalizeStatus(
                batch.status
              );

            return [
              'active',
              'ongoing',
              'running',
            ].includes(status);
          }
        ).length;

      const completedBatches =
        allBatches.filter(
          (batch) => {
            const status =
              normalizeStatus(
                batch.status
              );

            return [
              'completed',
              'complete',
              'closed',
            ].includes(status);
          }
        ).length;

      const pendingBatches =
        Math.max(
          0,

          allBatches.length -
            activeBatches -
            completedBatches
        );

      const completedSessions =
        sessions.filter(
          (session) => {
            const status =
              normalizeStatus(
                session.status ||
                session.sessionStatus
              );

            return [
              'completed',
              'done',
            ].includes(status);
          }
        ).length;

      const plannedSessions =
        sessions.filter(
          (session) => {
            const status =
              normalizeStatus(
                session.status ||
                session.sessionStatus
              );

            return [
              'planned',
              'pending',
              'scheduled',
            ].includes(status);
          }
        ).length;

      const missedSessions =
        sessions.filter(
          (session) => {
            const status =
              normalizeStatus(
                session.status ||
                session.sessionStatus
              );

            return [
              'missed',
              'cancelled',
              'canceled',
            ].includes(status);
          }
        ).length;

      return {
        totalBatches:
          allBatches.length,

        activeBatches,

        pendingBatches,

        completedBatches,

        totalSessions:
          sessions.length,

        completedSessions,

        plannedSessions,

        missedSessions,

        totalStudents:
          students.length,
      };
    }, [
      allBatches,
      sessions,
      students,
    ]);

  // =========================================================
  // AI PERFORMANCE COUNTS
  // =========================================================

  const aiPerformance =
    useMemo(() => {
      const all =
        students.length;

      const attentionNeeded =
        students.filter(
          (profile) => {
            const value =
              Number(
                profile
                  ?.attendancePercentage ??
                profile
                  ?.attendance ??
                0
              );

            return (
              value > 0 &&
              value < 60
            );
          }
        ).length;

      const lowAttendance =
        students.filter(
          (profile) => {
            const value =
              Number(
                profile
                  ?.attendancePercentage ??
                profile
                  ?.attendance ??
                0
              );

            return (
              value > 0 &&
              value < 75
            );
          }
        ).length;

      const excellent =
        students.filter(
          (profile) => {
            const value =
              Number(
                profile
                  ?.attendancePercentage ??
                profile
                  ?.attendance ??
                0
              );

            return (
              value >= 90
            );
          }
        ).length;

      const good =
        students.filter(
          (profile) => {
            const value =
              Number(
                profile
                  ?.attendancePercentage ??
                profile
                  ?.attendance ??
                0
              );

            return (
              value >= 75 &&
              value < 90
            );
          }
        ).length;

      const average =
        students.filter(
          (profile) => {
            const value =
              Number(
                profile
                  ?.attendancePercentage ??
                profile
                  ?.attendance ??
                0
              );

            return (
              value >= 60 &&
              value < 75
            );
          }
        ).length;

      const dropoutRisk =
        students.filter(
          (profile) => {
            const status =
              normalizeStatus(
                profile
                  ?.riskStatus ||
                profile
                  ?.status
              );

            return (
              status.includes(
                'drop'
              ) ||
              status.includes(
                'risk'
              )
            );
          }
        ).length;

      return {
        all,
        attentionNeeded,
        excellent,
        good,
        average,
        lowAttendance,
        dropoutRisk,
      };
    }, [
      students,
    ]);

  // =========================================================
  // PERFORMANCE COUNTS
  // =========================================================

  const performance =
    useMemo(() => {
      const all =
        students.length;

      const completed =
        students.filter(
          (profile) =>
            [
              'completed',
              'complete',
            ].includes(
              normalizeStatus(
                profile.status
              )
            )
        ).length;

      const pending =
        Math.max(
          0,
          all - completed
        );

      const excellent =
        students.filter(
          (profile) =>
            Number(
              profile.score ||
              profile
                .performanceScore ||
              0
            ) >= 90
        ).length;

      const good =
        students.filter(
          (profile) => {
            const score =
              Number(
                profile.score ||
                profile
                  .performanceScore ||
                0
              );

            return (
              score >= 75 &&
              score < 90
            );
          }
        ).length;

      const average =
        students.filter(
          (profile) => {
            const score =
              Number(
                profile.score ||
                profile
                  .performanceScore ||
                0
              );

            return (
              score >= 60 &&
              score < 75
            );
          }
        ).length;

      const poor =
        students.filter(
          (profile) => {
            const score =
              Number(
                profile.score ||
                profile
                  .performanceScore ||
                0
              );

            return (
              score > 0 &&
              score < 60
            );
          }
        ).length;

      return {
        all,
        excellent,
        good,
        average,
        poor,
        completed,
        pending,
      };
    }, [
      students,
    ]);

  // =========================================================
  // FOLLOWUP COUNTS
  // =========================================================

  const followupCounts =
    useMemo(() => {
      const allFollowups =
        students.flatMap(
          (profile) =>
            Array.isArray(
              profile.followups
            )
              ? profile.followups
              : []
        );

      const calculate =
        (type) => {
          const filtered =
            allFollowups.filter(
              (item) =>
                normalizeStatus(
                  item.type ||
                  item.followupType
                ) ===
                normalizeStatus(
                  type
                )
            );

          return {
            done:
              filtered.filter(
                (item) =>
                  [
                    'done',
                    'completed',
                  ].includes(
                    normalizeStatus(
                      item.status
                    )
                  )
              ).length,

            planned:
              filtered.filter(
                (item) =>
                  [
                    'planned',
                    'scheduled',
                    'pending',
                  ].includes(
                    normalizeStatus(
                      item.status
                    )
                  )
              ).length,

            missed:
              filtered.filter(
                (item) =>
                  [
                    'missed',
                    'overdue',
                  ].includes(
                    normalizeStatus(
                      item.status
                    )
                  )
              ).length,
          };
        };

      return {
        call:
          calculate('call'),

        visit:
          calculate('visit'),
      };
    }, [
      students,
    ]);

  // =========================================================
  // MILESTONES
  // =========================================================

  const milestoneCounts =
    useMemo(() => {
      const batchStarted =
        allBatches.filter(
          (batch) =>
            [
              'active',
              'ongoing',
              'running',
              'completed',
            ].includes(
              normalizeStatus(
                batch.status
              )
            )
        ).length;

      const training50 =
        allBatches.filter(
          (batch) =>
            Number(
              batch.progress ||
              batch
                .trainingProgress ||
              0
            ) >= 50
        ).length;

      const assessment =
        allBatches.filter(
          (batch) =>
            Boolean(
              batch
                .assessmentCompleted ||
              batch.assessmentDone
            )
        ).length;

      const certified =
        students.filter(
          (profile) =>
            Boolean(
              profile.certified ||
              profile.certificateIssued
            )
        ).length;

      const completed =
        dashboardCounts
          .completedBatches;

      return {
        batchStarted,
        training50,
        assessment,
        certified,
        completed,
      };
    }, [
      allBatches,
      students,
      dashboardCounts,
    ]);

  // =========================================================
  // SEARCH - BATCH
  // =========================================================

  const filteredBatches =
    useMemo(() => {
      const query =
        quickSearch
          .trim()
          .toLowerCase();

      return allBatches.filter(
        (batch) => {
          if (!query) {
            return true;
          }

          return [
            batch.name,
            batch.batchCode,
            batch.code,
            batch.courseName,
            batch.centerName,
          ]
            .filter(Boolean)
            .some(
              (value) =>
                String(value)
                  .toLowerCase()
                  .includes(
                    query
                  )
            );
        }
      );
    }, [
      allBatches,
      quickSearch,
    ]);

  // =========================================================
  // SEARCH - SESSION
  // =========================================================

  const filteredSessions =
    useMemo(() => {
      const query =
        quickSearch
          .trim()
          .toLowerCase();

      return sessions.filter(
        (session) => {
          if (!query) {
            return true;
          }

          return [
            session.title,
            session.courseName,
            session.batchCode,
            session.unitName,
            session.chapterName,
            session.seniorTrainerName,
            session.fieldTrainerName,
          ]
            .filter(Boolean)
            .some(
              (value) =>
                String(value)
                  .toLowerCase()
                  .includes(
                    query
                  )
            );
        }
      );
    }, [
      sessions,
      quickSearch,
    ]);

  // =========================================================
  // SEARCH - STUDENT
  // =========================================================

  const filteredStudents =
    useMemo(() => {
      const query =
        quickSearch
          .trim()
          .toLowerCase();

      return students.filter(
        (profile) => {
          if (!query) {
            return true;
          }

          const candidate =
            profile._candidate ||
            profile;

          return [
            candidate.name,
            candidate.mobile,
            candidate.email,
            profile.batchName,
            profile.courseName,
            profile._course
              ?.name,
            profile._center
              ?.name,
          ]
            .filter(Boolean)
            .some(
              (value) =>
                String(value)
                  .toLowerCase()
                  .includes(
                    query
                  )
            );
        }
      );
    }, [
      students,
      quickSearch,
    ]);

  // =========================================================
  // RENDER CARDS (same strip as registrations)
  // =========================================================

  const pad2 = (value) => String(value ?? 0).padStart(2, '0');

  const approvalTone = (status) => {
    const normalized = normalizeStatus(status);
    if (['active', 'approved', 'completed', 'done', 'certified', 'ongoing', 'running'].includes(normalized)) {
      return 'approved';
    }
    if (['rejected', 'cancelled', 'canceled', 'dropout', 'missed'].includes(normalized)) {
      return 'rejected';
    }
    return 'pending';
  };

  const countTypedFollowups = (profiles, type) => {
    const items = profiles.flatMap((profile) => (
      Array.isArray(profile?.followups) ? profile.followups : []
    )).filter((item) => normalizeStatus(item.type || item.followupType) === normalizeStatus(type));

    const bucket = (names) => items.filter((item) => names.includes(normalizeStatus(item.status))).length;

    const dated = items
      .map((item) => item.followupDate || item.nextDate || item.date)
      .filter(Boolean);

    return {
      done: bucket(['done', 'completed']),
      planned: bucket(['planned', 'scheduled', 'pending']),
      missed: bucket(['missed', 'overdue']),
      nextDate: dated[0] ? formatDate(dated[0]) : '—',
    };
  };

  const renderProgressRing = (percent) => {
    const safe = Math.max(0, Math.min(100, Number(percent) || 0));
    const radius = 11;
    const circumference = 2 * Math.PI * radius;
    const dash = (safe / 100) * circumference;

    return (
      <div className="lead-strip-v3__doc" title={`${safe}%`}>
        <div className="circular-progress-container">
          <svg width="28" height="28" viewBox="0 0 28 28">
            <circle className="circle-bg" cx="14" cy="14" r={radius} />
            <circle
              className="circle-progress"
              cx="14"
              cy="14"
              r={radius}
              style={{
                strokeDasharray: `${dash} ${circumference - dash}`,
                transform: 'rotate(-90deg)',
                transformOrigin: '14px 14px',
              }}
            />
          </svg>
        </div>
      </div>
    );
  };

  const renderStatRow = (rows) => (
    <div className="lead-strip-v3__stat-grid">
      <div className="lead-strip-v3__stat-row">
        {rows.map((row) => (
          <div
            key={row.key}
            className="lead-strip-v3__stat"
            style={{ background: row.bg, color: '#fff' }}
          >
            <span className="lead-strip-v3__stat-label">{row.label}</span>
            <span className="lead-strip-v3__stat-val">{pad2(row.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const openActionPanel = (card, mode, followupType = 'Call') => {
    const edit = cardEdits[card.id] || {};
    setActionPanel({
      id: card.id,
      name: card.name,
      mode,
      followupType,
    });
    setPanelForm({
      status: edit.status || card.approval || '',
      subStatus: edit.subStatus || '',
      date: '',
      time: '',
      remarks: edit.remarks || '',
    });
  };

  const closeActionPanel = () => {
    setActionPanel(null);
  };

  const saveActionPanel = () => {
    if (!actionPanel) return;
    setCardEdits((prev) => {
      const current = prev[actionPanel.id] || {};
      if (actionPanel.mode === 'followup') {
        const key = actionPanel.followupType === 'Visit' ? 'visit' : 'call';
        return {
          ...prev,
          [actionPanel.id]: {
            ...current,
            remarks: panelForm.remarks,
            [key]: {
              ...(current[key] || {}),
              nextDate: panelForm.date ? formatDate(panelForm.date) : (current[key]?.nextDate || '—'),
              time: panelForm.time,
            },
          },
        };
      }
      return {
        ...prev,
        [actionPanel.id]: {
          ...current,
          status: panelForm.status,
          subStatus: panelForm.subStatus,
          remarks: panelForm.remarks,
        },
      };
    });
    closeActionPanel();
  };

  const renderMonitoringCard = (card) => {
    const edit = cardEdits[card.id] || {};
    const call = { ...card.call, ...(edit.call || {}) };
    const visit = { ...card.visit, ...(edit.visit || {}) };
    const approval = edit.status || card.approval;
    const isOpen = openCardId === card.id;
    const performanceRows = card.performance.map((row) => (
      row.label === 'Status' && edit.status
        ? { ...row, value: edit.status }
        : row
    ));

    return (
    <div className="card-content transition-col" key={card.id}>
      <div className={`lead-card${isOpen || openCardMenu === card.id ? ' lead-card--open' : ''}`}>
        {card.tab && (
          <div className="lead-project-tabs" role="tablist">
            <button type="button" className="lead-project-tabs__tab lead-project-tabs__tab--active">
              {card.tab}
            </button>
          </div>
        )}
        <div className={`lead-strip-v3${openCardMenu === card.id ? ' lead-strip-v3--actions-open' : ''}`}>
          <div className="lead-strip-v3__profile">
            <div className="lead-strip-v3__profile-top">
              <div className="lead-strip-v3__profile-head">
                <label className="lead-strip-v3__check" title="Select">
                  <input className="form-check-input" type="checkbox" checked={false} onChange={() => {}} />
                </label>
                <div className="lead-strip-v3__name text-capitalize" title={card.name}>
                  {card.name}
                </div>
                {renderProgressRing(card.progress)}
              </div>
              <div className="lead-strip-v3__profile-body">
                <div className="lead-strip-v3__phone-line" title={card.line1}>
                  <i className={card.line1Icon} aria-hidden="true" />
                  <span>{card.line1 || 'N/A'}</span>
                </div>
                <div className="lead-strip-v3__email-line" title={card.line2}>
                  <i className={card.line2Icon} aria-hidden="true" />
                  <span>{card.line2 || 'N/A'}</span>
                </div>
                <div className="lead-strip-v3__owners">
                  <div className="lead-strip-v3__owner-line lead-strip-v3__owner-line--owner">
                    <span className="lead-strip-v3__owner-label">{card.ownerLabel}</span>
                    <span className="lead-strip-v3__owner-val">{card.owner || '—'}</span>
                  </div>
                  <div className="lead-strip-v3__owners-row">
                    <div className="lead-strip-v3__owner-line">
                      <span className="lead-strip-v3__owner-label">{card.co1Label}</span>
                      <span className="lead-strip-v3__owner-val">{card.co1 || '—'}</span>
                    </div>
                    <div className="lead-strip-v3__owner-line">
                      <span className="lead-strip-v3__owner-label">{card.co2Label}</span>
                      <span className="lead-strip-v3__owner-val">{card.co2 || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lead-strip-v3__pair">
            <div className="lead-strip-v3__panel lead-strip-v3__panel--performance">
              <div className="lead-strip-v3__perf-block">
                <div className="lead-strip-v3__panel-head">
                  <span className="lead-strip-v3__panel-title">
                    <i className="fas fa-chart-line" aria-hidden="true" /> Performance
                  </span>
                  <button
                    type="button"
                    className="lead-strip-v3__panel-edit"
                    title="Edit Performance"
                    aria-label="Edit Performance"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openActionPanel(card, 'status');
                    }}
                  >
                    <i className="fas fa-edit" aria-hidden="true" />
                  </button>
                </div>
                {performanceRows.map((row) => (
                  <div className="lead-strip-v3__kv" key={row.label}>
                    <span className="lead-strip-v3__kv-label">{row.label}</span>
                    {row.label === 'Status' ? (
                      <button
                        type="button"
                        className="lead-strip-v3__kv-pill"
                        onClick={() => openActionPanel(card, 'status')}
                      >
                        {row.value}
                      </button>
                    ) : (
                      <span className="lead-strip-v3__kv-pill">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="lead-strip-v3__panel lead-strip-v3__panel--approval">
              <div className="lead-strip-v3__approval-block">
                <div className="lead-strip-v3__panel-head">
                  <span className="lead-strip-v3__panel-title">
                    <i className="fas fa-award" aria-hidden="true" /> {card.approvalTitle}
                  </span>
                </div>
                <div className="lead-strip-v3__approval-row">
                  <button
                    type="button"
                    className={`lead-strip-v3__approval-pill lead-strip-v3__approval-pill--${approvalTone(approval)}`}
                    onClick={() => openActionPanel(card, 'status')}
                  >
                    {approval || 'Pending'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lead-strip-v3__panel">
            <div className="lead-strip-v3__panel-head">
              <span className="lead-strip-v3__panel-title">
                <i className="fas fa-phone-alt" aria-hidden="true" /> Followup Calling
              </span>
            </div>
            {renderStatRow([
              { key: 'done', label: 'Done', value: call.done, bg: 'rgb(18, 179, 255)' },
              { key: 'planned', label: 'Planned', value: call.planned, bg: 'rgb(12, 125, 180)' },
              { key: 'missed', label: 'Missed', value: call.missed, bg: 'rgb(8, 80, 120)' },
            ])}
            <div className="lead-strip-v3__footer">
              <div className="lead-strip-v3__footer-main">
                <span className="lead-strip-v3__footer-label">Next Follow-up Date:</span>
                <span className="lead-strip-v3__footer-val">{call.nextDate}</span>
              </div>
              <button
                type="button"
                className="lead-strip-v3__footer-cal"
                title="Set Followup"
                aria-label="Set Followup"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openActionPanel(card, 'followup', 'Call');
                }}
              >
                <i className="fas fa-edit" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="lead-strip-v3__panel">
            <div className="lead-strip-v3__panel-head">
              <span className="lead-strip-v3__panel-title">
                <i className="fas fa-user-check" aria-hidden="true" /> Followup Visit
              </span>
            </div>
            {renderStatRow([
              { key: 'done', label: 'Done', value: visit.done, bg: 'rgb(75, 85, 99)' },
              { key: 'planned', label: 'Planned', value: visit.planned, bg: 'rgb(55, 65, 81)' },
              { key: 'missed', label: 'Missed', value: visit.missed, bg: 'rgb(35, 42, 52)' },
            ])}
            <div className="lead-strip-v3__footer">
              <div className="lead-strip-v3__footer-main">
                <span className="lead-strip-v3__footer-label">Next Follow-up Date:</span>
                <span className="lead-strip-v3__footer-val">{visit.nextDate}</span>
              </div>
              <button
                type="button"
                className="lead-strip-v3__footer-cal"
                title="Set Followup"
                aria-label="Set Followup"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openActionPanel(card, 'followup', 'Visit');
                }}
              >
                <i className="fas fa-edit" aria-hidden="true" />
              </button>
            </div>
          </div>

          {card.sideTitle !== 'Training' && (
          <div className="lead-strip-v3__panel lead-strip-v3__panel--kyc">
            <div className="lead-card-kyc-dash">
              <div className="lead-strip-v3__panel-head lead-strip-v3__panel-head--actions">
                <span className="lead-strip-v3__panel-title">
                  <i className={card.sideIcon} aria-hidden="true" /> {card.sideTitle}
                </span>
                <div className="lead-strip-v3__head-actions">
                  {card.actions.length > 0 && (
                  <div className="lead-strip-v3__actions-wrap">
                    <button
                      type="button"
                      className="lead-strip-v3__icon-btn"
                      title="More actions"
                      aria-label="More actions"
                      onClick={() => setOpenCardMenu(openCardMenu === card.id ? null : card.id)}
                    >
                      <i className="fas fa-ellipsis-v" aria-hidden="true" />
                    </button>
                    {openCardMenu === card.id && (
                      <div className="lead-strip-v3__actions-dropdown">
                        <div className="lead-strip-v3__actions-menu">
                          {card.actions.map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              className="lead-strip-v3__actions-item"
                              onClick={() => {
                                setOpenCardMenu(null);
                                action.onClick?.();
                              }}
                            >
                              <i className={action.icon} aria-hidden="true" />
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                  <button
                    type="button"
                    className="lead-strip-v3__icon-btn lead-strip-v3__icon-btn--collapse"
                    aria-label={isOpen ? 'Collapse' : 'Expand'}
                    title={isOpen ? 'Collapse' : 'Expand'}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenCardId(isOpen ? null : card.id);
                    }}
                  >
                    <i className={isOpen ? 'fas fa-chevron-up' : 'fas fa-chevron-down'} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="lead-card-kyc-dash__stats">
                {card.sideStats.map((row) => (
                  <div
                    key={row.key}
                    className="lead-card-kyc-dash__stat text-center text-white"
                    style={{ background: row.bg }}
                  >
                    <div className="lead-card-kyc-dash__stat-label">{row.label}</div>
                    <div className="lead-card-kyc-dash__stat-divider" aria-hidden="true" />
                    <div className="lead-card-kyc-dash__stat-value">{pad2(row.value)}</div>
                  </div>
                ))}
              </div>
              {card.sideButton && (
                <div className="lead-card-kyc-dash__actions">
                  <button type="button" className="lead-card-kyc-dash__btn" onClick={card.sideButton.onClick}>
                    {card.sideButton.label}
                  </button>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
        {isOpen && (
          <div className="bm-card-open">
            <div className="bm-card-open__tabs">
              <span className="bm-card-open__tab bm-card-open__tab--active">Details</span>
            </div>
            <div className="bm-card-open__grid">
              {[
                ['Name', card.name],
                [card.ownerLabel, card.owner],
                [card.co1Label, card.co1],
                [card.co2Label, card.co2],
                ['Call follow-up', call.nextDate],
                ['Visit follow-up', visit.nextDate],
                ['Status', approval || 'Pending'],
                ['Remarks', edit.remarks || '—'],
              ].map(([label, value]) => (
                <div className="bm-card-open__item" key={label}>
                  <span>{label}</span>
                  <strong>{value || '—'}</strong>
                </div>
              ))}
            </div>
            <div className="bm-card-open__actions">
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openActionPanel(card, 'status')}>
                <i className="fas fa-edit me-1" /> Edit Performance
              </button>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openActionPanel(card, 'followup', 'Call')}>
                <i className="fas fa-phone-alt me-1" /> Set Call Followup
              </button>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openActionPanel(card, 'followup', 'Visit')}>
                <i className="fas fa-user-check me-1" /> Set Visit Followup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderBatchCard = (batch) => {
    const batchSessions = sessions.filter((session) => (
      String(session.batchId || session.batch?._id || session._batch || '') === String(batch._id || '')
      || String(session.batchCode || '') === String(batch.batchCode || batch.code || '')
    ));
    const completed = batchSessions.filter((session) => (
      ['done', 'completed'].includes(normalizeStatus(session.status || session.sessionStatus))
    )).length;
    const progress = batchSessions.length
      ? Math.round((completed / batchSessions.length) * 100)
      : Number(batch.progress || 0);
    const linkedStudents = students.filter((profile) => {
      const batchId = profile.batchId || profile._batch?._id || profile._batch;
      const code = profile.batchCode || profile._batch?.batchCode;
      return String(batchId || '') === String(batch._id || '')
        || (code && String(code) === String(batch.batchCode || batch.code || ''));
    });
    const call = countTypedFollowups(linkedStudents, 'call');
    const visit = countTypedFollowups(linkedStudents, 'visit');
    const studentCount = batch.studentCount ?? batch.studentsCount ?? linkedStudents.length;

    return renderMonitoringCard({
      id: `batch-${batch._id}`,
      tab: batch.courseName || batch.course?.name || 'Course',
      name: batch.name || batch.batchCode || 'Untitled Batch',
      progress,
      line1: batch.batchCode || batch.code || 'N/A',
      line1Icon: 'fas fa-hashtag',
      line2: batch.courseName || batch.course?.name || 'Course not available',
      line2Icon: 'fas fa-graduation-cap',
      ownerLabel: 'Center',
      owner: batch.centerName || batch.center?.name || '—',
      co1Label: 'Start',
      co1: formatDate(batch.startDate),
      co2Label: 'End',
      co2: formatDate(batch.endDate),
      performance: [
        { label: 'Status', value: batch.status || 'Active' },
        { label: 'Students', value: String(studentCount) },
        { label: 'Sessions', value: `${completed}/${batchSessions.length}` },
      ],
      approvalTitle: 'Batch Status',
      approval: batch.status || 'Active',
      call,
      visit,
      sideTitle: 'Training',
      sideIcon: 'fas fa-id-card',
      sideStats: [
        { key: 'students', label: 'Students', value: studentCount, bg: '#10b981' },
        { key: 'done', label: 'Done', value: completed, bg: '#3b82f6' },
        { key: 'left', label: 'Left', value: Math.max(batchSessions.length - completed, 0), bg: '#f59e0b' },
      ],
      sideButton: {
        label: 'Open Sessions',
        onClick: () => setActiveView('session'),
      },
      actions: [
        { label: 'Sessions', icon: 'fas fa-calendar-alt', onClick: () => setActiveView('session') },
        { label: 'Students', icon: 'fas fa-users', onClick: () => setActiveView('student') },
      ],
    });
  };

  const renderSessionCard = (session) => {
    const status = session.status || session.sessionStatus || 'Planned';
    const normalized = normalizeStatus(status);
    const call = {
      done: ['done', 'completed'].includes(normalized) ? 1 : 0,
      planned: ['planned', 'pending', 'scheduled'].includes(normalized) ? 1 : 0,
      missed: ['missed', 'overdue'].includes(normalized) ? 1 : 0,
      nextDate: formatDate(session.sessionDate || session.date),
    };

    return renderMonitoringCard({
      id: `session-${session.id || session._id}`,
      tab: session.courseName || 'Course',
      name: session.title || 'Untitled Session',
      progress: call.done ? 100 : 0,
      line1: formatDate(session.sessionDate || session.date),
      line1Icon: 'fas fa-calendar-alt',
      line2: session.courseName || 'Course not available',
      line2Icon: 'fas fa-graduation-cap',
      ownerLabel: 'Batch',
      owner: session.batchCode || '—',
      co1Label: 'Unit',
      co1: session.unitName || (session.unitNumber ? `Unit ${session.unitNumber}` : '—'),
      co2Label: 'Chap',
      co2: session.chapterName || (session.chapterNumber ? `Ch ${session.chapterNumber}` : '—'),
      performance: [
        { label: 'Status', value: status },
        { label: 'Trainer', value: session.fieldTrainerName || '—' },
        { label: 'Senior', value: session.seniorTrainerName || '—' },
      ],
      approvalTitle: 'Session Status',
      approval: status,
      call,
      visit: { done: 0, planned: 0, missed: 0, nextDate: '—' },
      sideTitle: 'Session',
      sideIcon: 'fas fa-chalkboard-teacher',
      sideStats: [
        { key: 'unit', label: 'Unit', value: session.unitNumber || 0, bg: '#6366f1' },
        { key: 'chapter', label: 'Chapter', value: session.chapterNumber || 0, bg: '#0ea5e9' },
        { key: 'done', label: 'Done', value: call.done, bg: '#10b981' },
      ],
      sideButton: {
        label: 'Refer Session',
        onClick: () => openRefer(session),
      },
      actions: [
        { label: 'Refer', icon: 'fas fa-share-alt', onClick: () => openRefer(session) },
      ],
    });
  };

  const renderStudentCard = (profile) => {
    const candidate = profile._candidate || profile;
    const attendance = Number(profile.attendancePercentage ?? profile.attendance ?? 0);
    const call = countTypedFollowups([profile], 'call');
    const visit = countTypedFollowups([profile], 'visit');

    return renderMonitoringCard({
      id: `student-${profile._id || candidate._id}`,
      tab: profile._course?.name || profile.courseName || 'Course',
      name: candidate.name || 'Student',
      progress: attendance,
      line1: candidate.mobile || 'N/A',
      line1Icon: 'fas fa-phone',
      line2: candidate.email || 'N/A',
      line2Icon: 'fas fa-envelope',
      ownerLabel: 'Course',
      owner: profile._course?.name || profile.courseName || '—',
      co1Label: 'Batch',
      co1: profile.batchName || profile._batch?.name || '—',
      co2Label: 'Center',
      co2: profile._center?.name || profile.centerName || '—',
      performance: [
        { label: 'Status', value: profile.status || 'Active' },
        { label: 'Attend', value: `${attendance}%` },
        { label: 'Score', value: String(profile.performanceScore ?? profile.score ?? '—') },
      ],
      approvalTitle: 'Student Status',
      approval: profile.status || 'Active',
      call,
      visit,
      sideTitle: 'Progress',
      sideIcon: 'fas fa-id-card',
      sideStats: [
        { key: 'attend', label: 'Attend', value: attendance, bg: '#10b981' },
        { key: 'done', label: 'Done', value: profile.completedSessions ?? 0, bg: '#3b82f6' },
        { key: 'score', label: 'Score', value: profile.performanceScore ?? profile.score ?? 0, bg: '#f59e0b' },
      ],
      actions: [],
    });
  };



  // =========================================================
  // CURRENT DATA
  // =========================================================

  const currentRecords =
    activeView === 'batch'
      ? filteredBatches
      : activeView ===
          'session'
      ? filteredSessions
      : filteredStudents;

  // =========================================================
  // =========================================================
  // JSX
  // =========================================================

  const chipStyle = (active) => ({
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '999px',
    cursor: 'pointer',
    color: active ? '#fff' : 'rgb(250, 85, 121)',
    backgroundColor: active ? 'rgb(250, 85, 121)' : '#fff',
    border: active ? 'none' : '1.5px solid rgb(250, 85, 121)',
  });

  const padCount = (value) => String(value ?? 0).padStart(2, '0');

  const outlineBtnStyle = {
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const datePresets = [
    ['today', 'Today'],
    ['yesterday', 'Yesterday'],
    ['3days', 'Previous 3 days'],
    ['month', 'This Month'],
  ];

  const filterFields = [
    { key: 'department', label: 'Department', icon: 'fas fa-sitemap' },
    { key: 'project', label: 'Project', icon: 'fas fa-project-diagram' },
    { key: 'center', label: 'Center', icon: 'fas fa-building' },
    { key: 'course', label: 'Course', icon: 'fas fa-graduation-cap' },
    { key: 'batch', label: 'Batch', icon: 'fas fa-users' },
    { key: 'trainer', label: 'Trainer', icon: 'fas fa-user-tie' },
  ];

  const renderDatePills = (compact = false) => (
    <div className={`adm-header-date-range${compact ? ' adm-header-date-range--compact' : ''}`}>
      <div className="adm-header-date-range__pills">
        {datePresets.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`adm-header-date-range__pill${datePreset === value ? ' adm-header-date-range__pill--active' : ''}`}
            onClick={() => setDatePreset(value)}
          >
            {compact && value === '3days' ? '3 Days' : label}
          </button>
        ))}
        <button type="button" className="adm-header-date-range__pill">
          <i className="fas fa-calendar-alt me-1" aria-hidden="true" />
          Date Range
          <i className="fas fa-chevron-down ms-1" style={{ fontSize: '9px' }} aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  const renderCycleFilters = (mobile = false) => (
    <div className={`b2b-cycle-filters${mobile ? ' b2b-cycle-filters--mobile' : ''}`}>
      {filterFields.map((field) => (
        <div className="b2b-cycle-filters__item" key={field.key}>
          <label className="b2b-cycle-filters__label" htmlFor={`bm-filter-${field.key}${mobile ? '-m' : ''}`}>
            <i className={field.icon} aria-hidden="true" /> {field.label}
          </label>
          <select
            id={`bm-filter-${field.key}${mobile ? '-m' : ''}`}
            className="b2b-cycle-filters__select"
            value={filters[field.key] || ''}
            onChange={(e) => setFilters({ ...filters, [field.key]: e.target.value })}
          >
            <option value="">All</option>
            {field.key === 'batch' && allBatches.map((batch) => (
              <option value={batch._id} key={batch._id}>
                {batch.name || batch.batchCode}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );

  const isLoadingList = activeView === 'batch'
    ? loadingBatches
    : activeView === 'session'
      ? loadingSessions
      : loadingStudents;

  const hasDashFilter = aiPerformanceFilter !== 'all'
    || performanceFilter !== 'all'
    || followupCallFilter
    || followupVisitFilter
    || milestoneFilter;

  const renderActionSidePanel = () => {
    if (!actionPanel) return null;
    const isFollowup = actionPanel.mode === 'followup';
    return (
      <div className="col-11 transition-col" id="editFollowupPanel">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
            <div className="d-flex align-items-center">
              <div className="me-2">
                <i className="fas fa-user-edit text-secondary" />
              </div>
              <h6 className="mb-0 followUp fw-medium">
                {isFollowup
                  ? `Set ${actionPanel.followupType === 'Visit' ? 'Visit' : 'Call'} Followup for ${actionPanel.name}`
                  : `Edit Status for ${actionPanel.name}`}
              </h6>
            </div>
            <button className="btn-close" type="button" aria-label="Close" onClick={closeActionPanel} />
          </div>
          <div className="card-body">
            <form onSubmit={(e) => e.preventDefault()}>
              {!isFollowup && (
                <>
                  <div className="mb-1">
                    <label className="form-label small fw-medium text-dark" htmlFor="bm-panel-status">
                      Status<span className="text-danger">*</span>
                    </label>
                    <select
                      id="bm-panel-status"
                      className="form-select border-0 bgcolor"
                      value={panelForm.status}
                      style={{ height: '42px', paddingTop: '8px', paddingInline: '10px', width: '100%', backgroundColor: '#f1f2f6' }}
                      onChange={(e) => setPanelForm({ ...panelForm, status: e.target.value })}
                    >
                      <option value="">Select Status</option>
                      {['Active', 'Planned', 'Pending', 'Completed', 'Missed'].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-1">
                    <label className="form-label small fw-medium text-dark" htmlFor="bm-panel-substatus">
                      Sub-Status<span className="text-danger">*</span>
                    </label>
                    <select
                      id="bm-panel-substatus"
                      className="form-select border-0 bgcolor"
                      value={panelForm.subStatus}
                      style={{ height: '42px', paddingTop: '8px', paddingInline: '10px', width: '100%', backgroundColor: '#f1f2f6' }}
                      onChange={(e) => setPanelForm({ ...panelForm, subStatus: e.target.value })}
                    >
                      <option value="">Select Sub-Status</option>
                      {['Excellent', 'Good', 'Average', 'Poor', 'Attention Needed'].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="row mb-1">
                <div className="col-6">
                  <label className="form-label small fw-medium text-dark" htmlFor="bm-panel-date">
                    Next Action Date<span className="text-danger">*</span>
                  </label>
                  <input
                    id="bm-panel-date"
                    type="date"
                    className="form-control border-0 bgcolor"
                    value={panelForm.date}
                    style={{ backgroundColor: '#f1f2f6', height: '42px', paddingInline: '10px' }}
                    onChange={(e) => setPanelForm({ ...panelForm, date: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-medium text-dark" htmlFor="bm-panel-time">
                    Time<span className="text-danger">*</span>
                  </label>
                  <input
                    id="bm-panel-time"
                    type="time"
                    className="form-control border-0 bgcolor"
                    value={panelForm.time}
                    style={{ backgroundColor: '#f1f2f6', height: '42px', paddingInline: '10px' }}
                    onChange={(e) => setPanelForm({ ...panelForm, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="mb-1">
                <label className="form-label small fw-medium text-dark" htmlFor="bm-panel-comment">
                  Comment<span className="text-danger">*</span>
                </label>
                <textarea
                  id="bm-panel-comment"
                  className="form-control border-0 bgcolor"
                  rows="4"
                  value={panelForm.remarks}
                  placeholder={isFollowup ? 'Remarks are mandatory' : 'Add remarks (optional)'}
                  style={{ resize: 'none', backgroundColor: '#f1f2f6' }}
                  onChange={(e) => setPanelForm({ ...panelForm, remarks: e.target.value })}
                />
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn"
                  style={{ border: '1px solid #ddd', padding: '8px 24px', fontSize: '14px' }}
                  onClick={closeActionPanel}
                >
                  CLOSE
                </button>
                <button
                  type="button"
                  className="btn text-white"
                  style={{ backgroundColor: '#fd7e14', border: 'none', padding: '8px 24px', fontSize: '14px' }}
                  onClick={saveActionPanel}
                >
                  {isFollowup ? 'SET FOLLOWUP' : 'UPDATE STATUS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bm-page">
      <div className="row">
        <div className={`col-12 transition-col${actionPanel ? ' bm-main--open' : ''}`}>
      <nav className="bm-header-nav">
        <div className="container-fluid">
          <div className="row align-items-center gy-2">
            <div className="col-md-4 col-xl-4 d-none d-md-block">
              <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.1rem' }}>
                Batch Monitoring
              </h5>
              {renderDatePills(false)}
            </div>

            <div className="col-12 d-md-none mb-1">
              <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.1rem' }}>
                Batch Monitoring
              </h5>
              {renderDatePills(true)}
            </div>

            <div className="col-md-8 col-xl-8 d-none d-md-flex justify-content-end align-items-center">
              {renderCycleFilters(false)}
            </div>

            {/* <div className="col-12 d-md-none">
              {renderCycleFilters(true)}
            </div> */}

            <div className="col-12 mt-1 pt-1 border-top adm-cycle-toolbar" style={{ borderColor: '#eee' }}>
              <div className="adm-cycle-toolbar__outer d-flex gap-2 align-items-center justify-content-end">
              {/*   <div className="adm-cycle-toolbar__actions d-flex flex-nowrap gap-2 align-items-center">
                  <button type="button" className="btn btn-sm btn-outline-primary" style={outlineBtnStyle}>
                    <i className="fas fa-download" style={{ fontSize: '10px' }} />
                    Download Report
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-primary" style={outlineBtnStyle}>
                    <i className="fas fa-plus" style={{ fontSize: '10px' }} />
                    Add Batch
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-primary" style={outlineBtnStyle}>
                    <i className="fas fa-plus" style={{ fontSize: '10px' }} />
                    Add Session
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" style={outlineBtnStyle}>
                    <i className="fas fa-tasks" style={{ fontSize: '10px' }} />
                    Bulk Action
                  </button>
                </div> */}

                <div className="adm-cycle-toolbar__inner d-flex align-items-center gap-2">
                  <div className="position-relative adm-cycle-search">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Quick search..."
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      style={{
                        width: '200px',
                        minWidth: '140px',
                        paddingRight: '30px',
                        paddingLeft: '12px',
                        paddingTop: '8px',
                        paddingBottom: '8px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #ced4da',
                        fontSize: '13px',
                        borderRadius: '6px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    {quickSearch && (
                      <button
                        type="button"
                        className="btn btn-sm position-absolute"
                        onClick={() => setQuickSearch('')}
                        style={{
                          right: '2px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          padding: '2px 6px',
                          backgroundColor: '#dc3545',
                          border: 'none',
                          color: 'white',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <i className="fas fa-times" style={{ fontSize: '8px' }} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary adm-cycle-action-btn"
                    style={{
                      background: 'linear-gradient(135deg, #fc567b 13%, #fc567b 50%)',
                      borderColor: 'rgb(250, 85, 121)',
                      color: 'white',
                      fontWeight: '500',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  >
                    <i className="fas fa-search me-1" />
                    Search
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm adm-cycle-action-btn"
                    style={{
                      background: '#ffffff',
                      color: 'rgb(250, 85, 121)',
                      fontWeight: '500',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      borderWidth: '1.5px',
                      borderColor: 'rgb(250, 85, 121)',
                    }}
                  >
                    <i className="fas fa-filter me-1" />
                    More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="bm-body">
        <div className="col-12 b2b-crm-dashboard px-0">
          <div className="b2b-dash-section mt-2">
            <span className="b2b-dash-section__label">Monitoring View</span>
            <div className="b2b-mobile-hscroll d-flex gap-2 align-items-center pt-1">
              {[
                ['batch', 'Batches', dashboardCounts.totalBatches],
                ['session', 'Sessions', dashboardCounts.totalSessions],
                ['student', 'Students', dashboardCounts.totalStudents],
              ].map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  className="b2b-perf-chip"
                  style={chipStyle(activeView === value)}
                  onClick={() => setActiveView(value)}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>

          <div className="b2b-dash-section mt-3">
            <span className="b2b-dash-section__label">Ai Performance</span>
            <div className="b2b-mobile-hscroll b2b-mobile-hscroll--chips d-flex gap-2 align-items-center pt-1">
              {[
                ['all', 'All', aiPerformance.all],
                ['attention', 'Attention Needed', aiPerformance.attentionNeeded],
                ['excellent', 'Excellent', aiPerformance.excellent],
                ['good', 'Good', aiPerformance.good],
                ['average', 'Average', aiPerformance.average],
                ['lowAttendance', 'Low Attendance', aiPerformance.lowAttendance],
                ['dropout', 'Dropout Risk', aiPerformance.dropoutRisk],
              ].map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  className="b2b-perf-chip"
                  style={chipStyle(aiPerformanceFilter === value)}
                  onClick={() => setAiPerformanceFilter(value)}
                >
                  {String(label).toUpperCase()} ({count})
                </button>
              ))}
            </div>
          </div>

          <div className="b2b-dash-section mt-3">
            <span className="b2b-dash-section__label">Performance</span>
            <div className="b2b-mobile-hscroll b2b-mobile-hscroll--chips d-flex gap-2 align-items-center pt-1">
              {[
                ['all', 'All', performance.all],
                ['excellent', 'Excellent', performance.excellent],
                ['good', 'Good', performance.good],
                ['average', 'Average', performance.average],
                ['poor', 'Poor', performance.poor],
                ['completed', 'Completed', performance.completed],
                ['pending', 'Pending', performance.pending],
              ].map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  className="b2b-perf-chip"
                  style={chipStyle(performanceFilter === value)}
                  onClick={() => setPerformanceFilter(value)}
                >
                  {String(label).toUpperCase()} ({count})
                </button>
              ))}
            </div>
          </div>

          {hasDashFilter && (
            <div className="d-flex flex-wrap align-items-center gap-2 mt-2 mb-1">
              {aiPerformanceFilter !== 'all' && (
                <span className="badge rounded-pill text-bg-light border" style={{ fontSize: '12px', fontWeight: 600 }}>
                  <i className="fas fa-filter me-1 text-danger" aria-hidden="true" />
                  AI: {aiPerformanceFilter}
                </span>
              )}
              {performanceFilter !== 'all' && (
                <span className="badge rounded-pill text-bg-light border" style={{ fontSize: '12px', fontWeight: 600 }}>
                  <i className="fas fa-filter me-1 text-danger" aria-hidden="true" />
                  Performance: {performanceFilter}
                </span>
              )}
              {followupCallFilter && (
                <span className="badge rounded-pill text-bg-light border" style={{ fontSize: '12px', fontWeight: 600 }}>
                  <i className="fas fa-filter me-1 text-danger" aria-hidden="true" />
                  Call: {followupCallFilter}
                </span>
              )}
              {followupVisitFilter && (
                <span className="badge rounded-pill text-bg-light border" style={{ fontSize: '12px', fontWeight: 600 }}>
                  <i className="fas fa-filter me-1 text-danger" aria-hidden="true" />
                  Visit: {followupVisitFilter}
                </span>
              )}
              {milestoneFilter && (
                <span className="badge rounded-pill text-bg-light border" style={{ fontSize: '12px', fontWeight: 600 }}>
                  <i className="fas fa-filter me-1 text-danger" aria-hidden="true" />
                  Milestone: {milestoneFilter}
                </span>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                style={{ fontSize: '12px', fontWeight: 600, borderRadius: '999px' }}
                onClick={() => {
                  setAiPerformanceFilter('all');
                  setPerformanceFilter('all');
                  setFollowupCallFilter('');
                  setFollowupVisitFilter('');
                  setMilestoneFilter('');
                }}
              >
                <i className="fas fa-list me-1" aria-hidden="true" />
                Show all
              </button>
            </div>
          )}

          <div className="d-flex flex-column align-items-start gap-3 mt-3 mb-2">
            <div className="d-flex flex-wrap align-items-start gap-3">
            <div className="b2b-dash-section">
              <span className="b2b-dash-section__label">Followup Calling</span>
              <div className="d-flex flex-wrap gap-2 pt-1">
                {[
                  { key: 'done', label: 'Done', value: followupCounts.call.done, bg: '#12b3ff' },
                  { key: 'planned', label: 'Planned', value: followupCounts.call.planned, bg: '#f59e0b' },
                  { key: 'missed', label: 'Missed', value: followupCounts.call.missed, bg: '#7c3d14' },
                ].map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    className={`b2b-dash-stat-card text-center text-white border-0${followupCallFilter === row.key ? ' b2b-dash-stat-card--active' : ''}`}
                    style={{ background: row.bg, width: 108, flex: '0 0 108px' }}
                    onClick={() => setFollowupCallFilter(followupCallFilter === row.key ? '' : row.key)}
                  >
                    <div className="b2b-dash-stat-card__label">{row.label}</div>
                    <div className="b2b-dash-stat-card__divider" aria-hidden="true" />
                    <div className="b2b-dash-stat-card__value text-white">{padCount(row.value)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="b2b-dash-section">
              <span className="b2b-dash-section__label">Followup Visit</span>
              <div className="d-flex flex-wrap gap-2 pt-1">
                {[
                  { key: 'done', label: 'Done', value: followupCounts.visit.done, bg: '#4b5563' },
                  { key: 'planned', label: 'Planned', value: followupCounts.visit.planned, bg: '#4b5563' },
                  { key: 'missed', label: 'Missed', value: followupCounts.visit.missed, bg: '#7c3d14' },
                ].map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    className={`b2b-dash-stat-card text-center text-white border-0${followupVisitFilter === row.key ? ' b2b-dash-stat-card--active' : ''}`}
                    style={{ background: row.bg, width: 108, flex: '0 0 108px' }}
                    onClick={() => setFollowupVisitFilter(followupVisitFilter === row.key ? '' : row.key)}
                  >
                    <div className="b2b-dash-stat-card__label">{row.label}</div>
                    <div className="b2b-dash-stat-card__divider" aria-hidden="true" />
                    <div className="b2b-dash-stat-card__value text-white">{padCount(row.value)}</div>
                  </button>
                ))}
              </div>
            </div>
            </div>

            <div className="b2b-dash-section">
              <span className="b2b-dash-section__label">Milestone</span>
              <div className="d-flex flex-wrap gap-2 pt-1">
              {[
                { key: 'started', label: 'Batch Started', value: milestoneCounts.batchStarted, bg: '#059669' },
                { key: 'half', label: '50% Training', value: milestoneCounts.training50, bg: '#0ea5e9' },
                { key: 'assessment', label: 'Assessment', value: milestoneCounts.assessment, bg: '#6366f1' },
                { key: 'certified', label: 'Certified', value: milestoneCounts.certified, bg: '#10b981' },
                { key: 'completed', label: 'Completed', value: milestoneCounts.completed, bg: '#5b4fc9' },
              ].map((row) => (
                <button
                  key={row.key}
                  type="button"
                  className={`b2b-dash-stat-card text-center text-white border-0${milestoneFilter === row.key ? ' b2b-dash-stat-card--active' : ''}`}
                  style={{ background: row.bg, width: 108, flex: '0 0 108px' }}
                  onClick={() => setMilestoneFilter(milestoneFilter === row.key ? '' : row.key)}
                >
                  <div className="b2b-dash-stat-card__label">{row.label}</div>
                  <div className="b2b-dash-stat-card__divider" aria-hidden="true" />
                  <div className="b2b-dash-stat-card__value text-white">{padCount(row.value)}</div>
                </button>
              ))}
              </div>
            </div>
          </div>
        </div>

        <div className="crm-leads-scrolls mt-2">
          {isLoadingList ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted">Loading records...</h5>
              <p className="text-muted small mb-0">Please wait while we fetch the latest data</p>
            </div>
          ) : currentRecords.length === 0 ? (
            <div className="bm-empty">
              <i className="fas fa-inbox" />
              <h5>No records found</h5>
              <p>Try changing your search or filters.</p>
            </div>
          ) : (
            <div className="bm-card-grid-list">
              {activeView === 'batch' && filteredBatches.map(renderBatchCard)}
              {activeView === 'session' && filteredSessions.map(renderSessionCard)}
              {activeView === 'student' && filteredStudents.map(renderStudentCard)}
            </div>
          )}
        </div>
      </div>
        </div>

        <div className="col-4 d-none d-lg-block">
          <div
            className="row"
            style={{
              transition: 'all 0.3s ease-in-out',
              position: 'fixed',
              width: '-webkit-fill-available',
              maxWidth: '400px',
              zIndex: 10,
            }}
          >
            {renderActionSidePanel()}
          </div>
        </div>
      </div>

      {actionPanel && (
        <div
          className="modal show d-block d-lg-none"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeActionPanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              {renderActionSidePanel()}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          REFER SESSION MODAL
      ================================================== */}

      {referSession && (
        <div className="bm-modal-overlay">

          <div className="bm-modal">

            <div className="bm-modal-head">

              <div>

                <span>
                  Batch Monitoring
                </span>

                <h3>
                  Refer Session
                </h3>

                <p>
                  {referSession.courseName ||
                    referSession.title ||
                    'Session'}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setReferSession(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="bm-modal-body">

              {/* BATCH */}

              <div className="bm-modal-field">

                <label>
                  Batch
                </label>

                {batchesLoading ? (
                  <p>
                    Loading batches...
                  </p>
                ) : referBatches.length ===
                  0 ? (
                  <p className="text-muted">
                    No batch found
                    for this course.
                  </p>
                ) : (
                  <select
                    value={
                      selectedBatchId
                    }
                    onChange={(e) => {
                      const batchId =
                        e.target.value;

                      setReferMessage(
                        ''
                      );

                      setSelectedBatchId(
                        batchId
                      );

                      loadBatchTeam(
                        batchId
                      );
                    }}
                  >
                    <option value="">
                      Select a batch
                    </option>

                    {referBatches.map(
                      (batch) => (
                        <option
                          key={
                            batch._id
                          }
                          value={
                            batch._id
                          }
                        >
                          {batch.name ||
                            batch.batchCode}
                        </option>
                      )
                    )}

                  </select>
                )}

              </div>

              {/* TRAINER */}

              <div className="bm-modal-field">

                <label>
                  Trainer
                </label>

                {teamLoading ? (
                  <p>
                    Loading trainers...
                  </p>
                ) : !selectedBatchId ? (
                  <p className="text-muted">
                    Select a batch
                    first.
                  </p>
                ) : (
                  <select
                    value={
                      selectedPersonId
                    }
                    onChange={(e) => {
                      setReferMessage(
                        ''
                      );

                      setSelectedPersonId(
                        e.target.value
                      );
                    }}
                  >
                    <option value="">
                      Select a trainer
                    </option>

                    {team.seniorTrainers.map(
                      (person) => (
                        <option
                          key={
                            person._id
                          }
                          value={
                            person._id
                          }
                        >
                          {person.name}{' '}
                          — Senior Trainer
                        </option>
                      )
                    )}

                    {team.trainers.map(
                      (person) => (
                        <option
                          key={
                            person._id
                          }
                          value={
                            person._id
                          }
                        >
                          {person.name}{' '}
                          — Trainer
                        </option>
                      )
                    )}

                  </select>
                )}

              </div>

              {/* SESSION SELECTION */}

              <div className="bm-session-selector">

                <div>

                  <h6>
                    Sessions
                  </h6>

                  <div className="bm-session-check-list">

                    {courseSessions.map(
                      (session) => {
                        const id =
                          String(
                            session.id ||
                            session._id
                          );

                        const checked =
                          selectedSessionIds.includes(
                            id
                          );

                        const place =
                          [
                            session.unitName ||
                              (
                                session.unitNumber
                                  ? `Unit ${session.unitNumber}`
                                  : ''
                              ),

                            session.chapterName ||
                              (
                                session.chapterNumber
                                  ? `Chapter ${session.chapterNumber}`
                                  : ''
                              ),
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              ' • '
                            );

                        return (
                          <label
                            key={
                              id
                            }
                            className={
                              checked
                                ? 'checked'
                                : ''
                            }
                          >

                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleSession(
                                  id
                                )
                              }
                            />

                            <div>

                              <strong>
                                {session.title ||
                                  'Untitled Session'}
                              </strong>

                              {place && (
                                <span>
                                  {place}
                                </span>
                              )}

                            </div>

                          </label>
                        );
                      }
                    )}

                  </div>

                </div>

                {/* FULL COURSE */}

                <div>

                  <h6>
                    Full Course
                  </h6>

                  <label className="bm-full-course-option">

                    <input
                      type="checkbox"
                      checked={
                        courseSessions.length >
                          0 &&
                        courseSessions.every(
                          (session) =>
                            selectedSessionIds.includes(
                              String(
                                session.id ||
                                session._id
                              )
                            )
                        )
                      }
                      onChange={
                        toggleCourse
                      }
                    />

                    <div>

                      <strong>
                        {referSession.courseName ||
                          'This Course'}
                      </strong>

                      <span>
                        {
                          courseSessions.length
                        }{' '}
                        session(s)
                      </span>

                    </div>

                  </label>

                </div>

              </div>

              {referMessage && (
                <div className="bm-modal-error">
                  {referMessage}
                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="bm-modal-footer">

              <button
                type="button"
                className="cancel"
                onClick={() =>
                  setReferSession(
                    null
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="save"
                disabled={
                  saving ||
                  batchesLoading ||
                  teamLoading ||
                  !selectedBatchId ||
                  !selectedPersonId ||
                  selectedSessionIds.length ===
                    0
                }
                onClick={
                  saveRefer
                }
              >
                {saving
                  ? 'Referring...'
                  : `Refer (${selectedSessionIds.length})`}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default BatchMonitoring;