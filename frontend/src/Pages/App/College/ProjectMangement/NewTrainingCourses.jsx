import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Batch from './Batch';
import './listView.css';

const labelOf = (value) => {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  return value.name || '—';
};

const idOf = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || '');
  return String(value);
};

const centerIdsOf = (course) => {
  const list = Array.isArray(course?.center) ? course.center : course?.center ? [course.center] : [];
  return list.map(idOf).filter(Boolean);
};

const sessionLabel = (session) => {
  const parts = [
    session.unitNumber ? `Unit ${session.unitNumber}${session.unitName ? ` - ${session.unitName}` : ''}` : session.unitName,
    session.chapterNumber ? `Ch. ${session.chapterNumber}${session.chapterName ? ` - ${session.chapterName}` : ''}` : session.chapterName,
    session.title || 'Untitled session',
  ].filter(Boolean);
  return parts.join(' › ');
};

const NewTrainingCourses = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = userData.token;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [centerCourse, setCenterCourse] = useState(null);
  const [centerOptions, setCenterOptions] = useState([]);
  const [selectedCenterIds, setSelectedCenterIds] = useState([]);
  const [centersLoading, setCentersLoading] = useState(false);
  const [savingCenters, setSavingCenters] = useState(false);
  const [assignMessage, setAssignMessage] = useState('');

  // Assign Course = refer selected sessions of the course to a senior trainer
  const [referCourse, setReferCourse] = useState(null);
  const [referSessions, setReferSessions] = useState([]);
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [referSessionsLoading, setReferSessionsLoading] = useState(false);
  const [seniorTrainers, setSeniorTrainers] = useState([]);
  const [trainersLoading, setTrainersLoading] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [trainerQuery, setTrainerQuery] = useState('');
  const [referSaving, setReferSaving] = useState(false);
  const [referMessage, setReferMessage] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await axios.get(`${backendUrl}/college/all_courses`, {
          params: { scope: 'all' },
          headers: { 'x-auth': token },
        });
        const list = (response.data?.data || []).map((course) => ({
          ...course,
          status: course.status === true || course.status === 'active' ? 'active' : 'inactive',
        }));
        setCourses(list);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [backendUrl, token]);

  const filteredCourses = courses.filter((course) => {
    if (activeTab === 'Active' && course.status !== 'active') return false;
    if (activeTab === 'Inactive' && course.status !== 'inactive') return false;
    const haystack = [
      course.name,
      labelOf(course.vertical),
      labelOf(course.project),
    ].join(' ').toLowerCase();
    return haystack.includes(searchQuery.trim().toLowerCase());
  });

  const openAssignCenter = async (course) => {
    setAssignMessage('');
    setCenterCourse(course);
    setSelectedCenterIds(centerIdsOf(course));
    setCentersLoading(true);
    try {
      const projectId = idOf(course.project);
      const response = await axios.get(`${backendUrl}/college/list-centers`, {
        params: projectId ? { projectId } : {},
        headers: { 'x-auth': token },
      });
      setCenterOptions(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching centers:', error);
      setCenterOptions([]);
      setAssignMessage('Could not load centers.');
    } finally {
      setCentersLoading(false);
    }
  };

  const toggleCenter = (centerId) => {
    setSelectedCenterIds((prev) => (
      prev.includes(centerId) ? prev.filter((id) => id !== centerId) : [...prev, centerId]
    ));
  };

  const saveAssignedCenters = async () => {
    if (!centerCourse || selectedCenterIds.length === 0) {
      setAssignMessage('Select at least one center.');
      return;
    }
    const courseFeeType = centerCourse.courseFeeType;
    if (!courseFeeType) {
      setAssignMessage('Could not assign: course fee type is missing on this course.');
      return;
    }
    setSavingCenters(true);
    setAssignMessage('');
    try {
      const payload = {
        center: selectedCenterIds,
        courseFeeType,
      };
      if (courseFeeType === 'Paid') {
        if (!centerCourse.emiOptionAvailable) {
          setAssignMessage('Could not assign: set EMI option on the course first.');
          setSavingCenters(false);
          return;
        }
        payload.emiOptionAvailable = centerCourse.emiOptionAvailable;
      }

      const response = await axios.put(
        `${backendUrl}/college/courses/editcoursecopy/${centerCourse._id}`,
        payload,
        { headers: { 'x-auth': token } }
      );
      if (!response.data?.status) {
        setAssignMessage(response.data?.message || 'Could not assign the center.');
        return;
      }
      setCourses((prev) => prev.map((course) => (
        course._id === centerCourse._id
          ? { ...course, center: selectedCenterIds }
          : course
      )));
      setCenterCourse(null);
    } catch (error) {
      setAssignMessage(error?.response?.data?.message || 'Could not assign the center.');
    } finally {
      setSavingCenters(false);
    }
  };

  const openAssignCourse = async (course) => {
    setReferMessage('');
    setReferCourse(course);
    setSelectedTrainerId('');
    setTrainerQuery('');
    setReferSessions([]);
    setSelectedSessionIds([]);
    setSeniorTrainers([]);
    setReferSessionsLoading(true);
    setTrainersLoading(true);

    try {
      const [sessionsRes, trainersRes] = await Promise.all([
        axios.get(`${backendUrl}/college/session-plans`, {
          headers: { 'x-auth': token },
          params: { course: course._id },
        }),
        axios.get(`${backendUrl}/college/users/training-role-users`, {
          headers: { 'x-auth': token },
          params: { roleType: 'senior' },
        }),
      ]);

      // Only Scheduled sessions are still waiting to be referred
      const sessions = (sessionsRes.data?.data || [])
        .filter((session) => (session.workflowStatus || 'Scheduled') === 'Scheduled')
        .map((session) => ({
          id: String(session._id || session.id),
          title: session.title || 'Untitled session',
          unitNumber: session.unitNumber || '',
          unitName: session.unitName || '',
          chapterNumber: session.chapterNumber || '',
          chapterName: session.chapterName || '',
        }));
      setReferSessions(sessions);
      setSelectedSessionIds(sessions.map((session) => session.id)); // default: all selected

      const trainers = (trainersRes.data?.data || [])
        .filter((user) => user._id)
        .map((user) => ({
          id: String(user._id),
          name: user.name || user.email || 'Senior Trainer',
          email: user.email || '',
        }));
      setSeniorTrainers(trainers);
    } catch (error) {
      console.error('Error opening assign course:', error);
      setReferMessage(error?.response?.data?.message || 'Could not load sessions or trainers.');
    } finally {
      setReferSessionsLoading(false);
      setTrainersLoading(false);
    }
  };

  const closeAssignCourse = () => {
    setReferCourse(null);
    setReferMessage('');
  };

  const toggleSession = (sessionId) => {
    setSelectedSessionIds((prev) => (
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    ));
  };

  const toggleAllSessions = () => {
    setSelectedSessionIds((prev) => (
      prev.length === referSessions.length ? [] : referSessions.map((session) => session.id)
    ));
  };

  const saveAssignCourse = async () => {
    if (referSessions.length === 0) {
      setReferMessage('No scheduled sessions found for this course.');
      return;
    }
    const sessionsToRefer = referSessions.filter((session) => selectedSessionIds.includes(session.id));
    if (sessionsToRefer.length === 0) {
      setReferMessage('Select at least one session.');
      return;
    }
    const trainer = seniorTrainers.find((t) => t.id === selectedTrainerId);
    if (!trainer) {
      setReferMessage('Select a senior trainer.');
      return;
    }

    setReferSaving(true);
    setReferMessage('');
    try {
      const payload = {
        workflowStatus: 'Sent to Senior Trainer',
        seniorTrainerId: trainer.id,
        seniorTrainerName: trainer.name,
      };
      const results = await Promise.allSettled(
        sessionsToRefer.map((session) =>
          axios.patch(`${backendUrl}/college/session-plans/${session.id}`, payload, {
            headers: { 'x-auth': token },
          })
        )
      );

      const failedIndexes = results
        .map((result, index) => (
          result.status === 'rejected' || result.value?.data?.status === false ? index : -1
        ))
        .filter((index) => index >= 0);
      const failed = failedIndexes.length;
      const succeeded = sessionsToRefer.length - failed;

      if (succeeded === 0) {
        setReferMessage('Could not refer any selected sessions.');
        return;
      }
      if (failed > 0) {
        const failedIds = new Set(failedIndexes.map((index) => sessionsToRefer[index].id));
        setReferSessions((prev) => prev.filter((session) => (
          !selectedSessionIds.includes(session.id) || failedIds.has(session.id)
        )));
        setSelectedSessionIds([...failedIds]);
        setReferMessage(`Referred ${succeeded} session(s); ${failed} failed. Try again for the rest.`);
        return;
      }
      closeAssignCourse();
    } catch (error) {
      setReferMessage(error?.response?.data?.message || 'Could not refer the course.');
    } finally {
      setReferSaving(false);
    }
  };

  const openCourse = (course) => {
    const rawCenter = Array.isArray(course.center) ? course.center[0] : course.center;
    const center = !rawCenter
      ? null
      : typeof rawCenter === 'object'
        ? rawCenter
        : { _id: rawCenter };
    const vertical = course.vertical && typeof course.vertical === 'object' ? course.vertical : null;
    const project = course.project && typeof course.project === 'object' ? course.project : null;

    setSelectedCourse({
      course,
      center,
      project,
      vertical: vertical ? { ...vertical, id: vertical._id || vertical.id } : null,
    });
  };

  const filteredTrainers = seniorTrainers.filter((trainer) => {
    const q = trainerQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (trainer.name || '').toLowerCase().includes(q)
      || (trainer.email || '').toLowerCase().includes(q)
    );
  });

  if (selectedCourse) {
    return (
      <div className="vt-screen-enter">
        <Batch
          selectedCourse={selectedCourse.course}
          selectedCenter={selectedCourse.center}
          selectedProject={selectedCourse.project}
          selectedVertical={selectedCourse.vertical}
          onBackToCourses={() => setSelectedCourse(null)}
        />
      </div>
    );
  }

  return (
    <div className="container py-4 vt-page vt-screen-enter">
      <div className="vt-shell">
        <div className="vt-head">
          <div>
            <p className="vt-kicker">Training</p>
            <h4 style={{ margin: '2px 0 0', fontWeight: 800, color: '#1e293b' }}>Courses</h4>
          </div>
        </div>

        <div className="vt-toolbar">
          <div className="vt-tabs">
            {['Active', 'Inactive', 'All'].map((tab) => (
              <button
                type="button"
                key={tab}
                className={activeTab === tab ? 'is-active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <input
            className="vt-search"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="vt-empty">
            <h5>Loading courses...</h5>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="table-responsive">
            <table className="vt-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Project</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr
                    key={course._id}
                    className="vt-row"
                    title="Open batches"
                    onClick={() => openCourse(course)}
                  >
                    <td>{labelOf(course.vertical)}</td>
                    <td>{labelOf(course.project)}</td>
                    <td>
                      <span className="vt-name">
                        <span className="vt-avatar">{(course.name || '?').charAt(0).toUpperCase()}</span>
                        {course.name || 'Untitled course'}
                        <i className="bi bi-chevron-right vt-go"></i>
                      </span>
                    </td>
                    <td>
                      <span className={`vt-pill ${course.status === 'active' ? 'is-active' : ''}`}>
                        {course.status}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="vt-actions">
                        <button type="button" className="vt-action-text" onClick={() => openAssignCenter(course)}>
                          Assign Center
                        </button>
                        <button type="button" className="vt-action-text" onClick={() => openAssignCourse(course)}>
                          Assign Course
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="vt-empty">
            <i className="bi bi-book"></i>
            <h5>No courses found</h5>
            <p>Try another filter or search.</p>
          </div>
        )}
      </div>

      {centerCourse && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header text-white" style={{ backgroundColor: '#fc2b5a' }}>
                <h5 className="modal-title">Assign Center — {centerCourse.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setCenterCourse(null)}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">Select centers for this course's project.</p>
                {centersLoading ? (
                  <p>Loading centers...</p>
                ) : centerOptions.length === 0 ? (
                  <p>No centers found for this project.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {centerOptions.map((center) => {
                      const centerId = String(center._id);
                      return (
                        <label key={centerId} className="d-flex align-items-center gap-2 mb-0">
                          <input
                            type="checkbox"
                            checked={selectedCenterIds.includes(centerId)}
                            onChange={() => toggleCenter(centerId)}
                          />
                          <span>{center.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {assignMessage && <p className="text-danger mt-3 mb-0">{assignMessage}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCenterCourse(null)}>Cancel</button>
                <button type="button" className="btn btn-danger" disabled={savingCenters || centersLoading} onClick={saveAssignedCenters}>
                  {savingCenters ? 'Saving...' : 'Assign Center'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {referCourse && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header text-white" style={{ backgroundColor: '#fc2b5a' }}>
                <h5 className="modal-title">Assign Course — {referCourse.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeAssignCourse}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  Select one or more scheduled sessions, then choose a senior trainer.
                </p>

                <label className="form-label fw-semibold">Sessions</label>
                {referSessionsLoading ? (
                  <p>Loading sessions...</p>
                ) : referSessions.length === 0 ? (
                  <p className="text-muted mb-3">No scheduled sessions found for this course.</p>
                ) : (
                  <div className="mb-3">
                    <label className="d-flex align-items-center gap-2 mb-2 fw-semibold">
                      <input
                        type="checkbox"
                        checked={selectedSessionIds.length === referSessions.length}
                        onChange={toggleAllSessions}
                      />
                      <span>Select all ({selectedSessionIds.length}/{referSessions.length})</span>
                    </label>
                    <div className="d-flex flex-column gap-2 border rounded p-2" style={{ maxHeight: 180, overflow: 'auto' }}>
                      {referSessions.map((session) => (
                        <label key={session.id} className="d-flex align-items-start gap-2 mb-0">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={selectedSessionIds.includes(session.id)}
                            onChange={() => toggleSession(session.id)}
                          />
                          <span>{sessionLabel(session)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <label className="form-label fw-semibold">Senior trainer</label>
                <input
                  className="form-control mb-2"
                  placeholder="Search senior trainers..."
                  value={trainerQuery}
                  onChange={(e) => setTrainerQuery(e.target.value)}
                />
                {trainersLoading ? (
                  <p>Loading senior trainers...</p>
                ) : filteredTrainers.length === 0 ? (
                  <p className="text-muted mb-0">
                    No senior trainers found. Tick <strong>Senior Trainer</strong> on a user in User Management.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: 220, overflow: 'auto' }}>
                    {filteredTrainers.map((trainer) => (
                      <label
                        key={trainer.id}
                        className="d-flex align-items-center gap-2 mb-0 p-2 rounded"
                        style={{
                          background: selectedTrainerId === trainer.id ? '#fff1f4' : 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="seniorTrainer"
                          checked={selectedTrainerId === trainer.id}
                          onChange={() => setSelectedTrainerId(trainer.id)}
                        />
                        <span>
                          <span className="d-block fw-semibold">{trainer.name}</span>
                          <span className="text-muted" style={{ fontSize: 12 }}>{trainer.email}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {referMessage && <p className="text-danger mt-3 mb-0">{referMessage}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeAssignCourse}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={referSaving || referSessionsLoading || trainersLoading || selectedSessionIds.length === 0 || !selectedTrainerId}
                  onClick={saveAssignCourse}
                >
                  {referSaving ? 'Sending...' : 'Assign Course'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewTrainingCourses;
