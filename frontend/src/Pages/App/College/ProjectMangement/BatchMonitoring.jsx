import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './listView.css';

const BatchMonitoring = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = userData.token;
  const headers = { 'x-auth': token };

  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessions, setSessions] = useState([]);

  const [referSession, setReferSession] = useState(null);
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [team, setTeam] = useState({ seniorTrainers: [], trainers: [] });
  const [teamLoading, setTeamLoading] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [saving, setSaving] = useState(false);
  const [referMessage, setReferMessage] = useState('');

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await axios.get(`${backendUrl}/college/session-plans`, { headers });
      setSessions(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [backendUrl, token]);

  const courseSessions = referSession
    ? sessions.filter((session) => (
      !referSession.course || String(session.course) === String(referSession.course)
    ))
    : [];

  const loadBatchTeam = async (batchId) => {
    if (!batchId) {
      setTeam({ seniorTrainers: [], trainers: [] });
      setSelectedPersonId('');
      return;
    }
    setTeamLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/college/batches/${batchId}/training-team`, { headers });
      setTeam({
        seniorTrainers: response.data?.seniorTrainers || [],
        trainers: response.data?.trainers || [],
      });
      setSelectedPersonId('');
    } catch (error) {
      console.error('Error fetching batch team:', error);
      setTeam({ seniorTrainers: [], trainers: [] });
      setReferMessage(error?.response?.data?.message || 'Could not load this batch team.');
    } finally {
      setTeamLoading(false);
    }
  };

  const openRefer = async (session) => {
    setReferMessage('');
    setReferSession(session);
    setSelectedSessionIds([String(session.id || session._id)]);
    const initialBatchId = session.batch ? String(session.batch) : '';
    setSelectedBatchId(initialBatchId);
    setSelectedPersonId('');
    setTeam({ seniorTrainers: [], trainers: [] });
    setBatches([]);
    if (!session.course) {
      setReferMessage('This session has no course.');
      return;
    }
    setBatchesLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/college/get_batches`, {
        headers,
        params: { courseId: session.course },
      });
      const list = response.data?.data || [];
      setBatches(list);
      const batchId = initialBatchId || (list.length === 1 ? String(list[0]._id) : '');
      if (!initialBatchId && batchId) setSelectedBatchId(batchId);
      if (batchId) await loadBatchTeam(batchId);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setReferMessage('Could not load batches for this course.');
    } finally {
      setBatchesLoading(false);
    }
  };

  const toggleSession = (sessionId) => {
    setReferMessage('');
    setSelectedSessionIds((current) => (
      current.includes(sessionId)
        ? current.filter((id) => id !== sessionId)
        : [...current, sessionId]
    ));
  };

  const toggleCourse = () => {
    setReferMessage('');
    const allIds = courseSessions.map((session) => String(session.id || session._id));
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedSessionIds.includes(id));
    setSelectedSessionIds(allSelected ? [] : allIds);
  };

  const saveRefer = async () => {
    const chosen = courseSessions.filter((session) => selectedSessionIds.includes(String(session.id || session._id)));
    if (!selectedBatchId) {
      setReferMessage('Select a batch.');
      return;
    }
    if (chosen.length === 0) {
      setReferMessage('Select a session.');
      return;
    }
    if (!selectedPersonId) {
      setReferMessage('Select a trainer.');
      return;
    }
    const personIsSenior = (team.seniorTrainers || []).some((person) => String(person._id) === String(selectedPersonId));
    setSaving(true);
    setReferMessage('');
    try {
      const response = await axios.post(
        `${backendUrl}/college/batches/${selectedBatchId}/session-assignments`,
        {
          sessionIds: chosen.map((session) => session.id || session._id),
          ...(personIsSenior
            ? { seniorTrainerId: selectedPersonId }
            : { trainerId: selectedPersonId }),
        },
        { headers }
      );
      if (response.data?.success === false || response.data?.status === false) {
        setReferMessage(response.data?.message || 'Could not save this session for the batch.');
        return;
      }
      setReferSession(null);
    } catch (error) {
      console.error('Error referring session:', error);
      setReferMessage(error?.response?.data?.message || 'Could not save this session for the batch.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-4 vt-page vt-screen-enter">
      <div className="vt-shell">
        <div className="vt-head">
          <div>
            <p className="vt-kicker">Training</p>
            <h4 style={{ margin: '2px 0 0', fontWeight: 800, color: '#1e293b' }}>Batch Monitoring</h4>
          </div>
        </div>

        {loadingSessions ? (
          <div className="vt-empty"><h5>Loading sessions...</h5></div>
        ) : sessions.length === 0 ? (
          <div className="vt-empty">
            <i className="bi bi-collection"></i>
            <h5>No sessions found</h5>
          </div>
        ) : (
          <div className="table-responsive" style={{ marginTop: 16 }}>
            <table className="vt-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th className="vt-role-col">Senior Trainer</th>
                  <th className="vt-role-col">Trainer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id || session._id} className="vt-row is-static">
                    <td>
                      <span className="vt-name">
                        <span className="vt-avatar">{(session.title || '?').charAt(0).toUpperCase()}</span>
                        {session.title || 'Untitled session'}
                      </span>
                    </td>
                    <td>{session.courseName || '—'}</td>
                    <td>{session.batchCode || '—'}</td>
                    <td className="vt-role-col">{session.seniorTrainerName || '—'}</td>
                    <td className="vt-role-col">{session.fieldTrainerName || '—'}</td>
                    <td>
                      <div className="vt-actions">
                        <button type="button" title="Refer session" onClick={() => openRefer(session)}>
                          <i className="bi bi-send"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {referSession && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ margin: 'auto', maxWidth: 860 }}>
            <div className="modal-content assign-modal">
              <div className="assign-modal__head">
                <div>
                  <p className="assign-modal__kicker">Batch Monitoring</p>
                  <h2>Refer Session</h2>
                  <p>{referSession.courseName || referSession.title || 'Session'}</p>
                </div>
                <button type="button" className="assign-modal__close" onClick={() => setReferSession(null)} aria-label="Close">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="assign-modal__body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Batch</label>
                  {batchesLoading ? (
                    <p className="mb-0">Loading batches...</p>
                  ) : batches.length === 0 ? (
                    <p className="text-muted mb-0">No batch found for this course.</p>
                  ) : (
                    <select
                      className="form-select"
                      value={selectedBatchId}
                      onChange={(event) => {
                        const batchId = event.target.value;
                        setReferMessage('');
                        setSelectedBatchId(batchId);
                        loadBatchTeam(batchId);
                      }}
                    >
                      <option value="">Select a batch</option>
                      {batches.map((batch) => (
                        <option key={batch._id} value={batch._id}>{batch.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Trainer</label>
                  {teamLoading ? (
                    <p className="mb-0">Loading trainers...</p>
                  ) : !selectedBatchId ? (
                    <p className="text-muted mb-0">Select a batch first.</p>
                  ) : (team.seniorTrainers.length + team.trainers.length) === 0 ? (
                    <p className="text-muted mb-0">No trainer is assigned to this batch.</p>
                  ) : (
                    <select
                      className="form-select"
                      value={selectedPersonId}
                      onChange={(event) => {
                        setReferMessage('');
                        setSelectedPersonId(event.target.value);
                      }}
                    >
                      <option value="">Select a trainer</option>
                      {team.seniorTrainers.map((person) => (
                        <option key={person._id} value={person._id}>{person.name} — Senior Trainer</option>
                      ))}
                      {team.trainers.map((person) => (
                        <option key={person._id} value={person._id}>{person.name} — Trainer</option>
                      ))}
                    </select>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label fw-semibold">Sessions</label>
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 360, overflow: 'auto' }}>
                      {courseSessions.map((session) => {
                        const id = String(session.id || session._id);
                        const place = [
                          session.unitName || (session.unitNumber ? `Unit ${session.unitNumber}` : ''),
                          session.chapterName || (session.chapterNumber ? `Ch. ${session.chapterNumber}` : ''),
                        ].filter(Boolean).join(' · ');
                        const checked = selectedSessionIds.includes(id);
                        return (
                          <label
                            key={id}
                            className="d-flex align-items-center gap-2 mb-0 p-2 rounded"
                            style={{
                              background: checked ? '#fff1f4' : 'transparent',
                              cursor: 'pointer',
                              border: '1px solid #ffe4e6',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSession(id)}
                            />
                            <span>
                              <span className="d-block fw-semibold">{session.title || 'Untitled session'}</span>
                              {place && <span className="text-muted" style={{ fontSize: 12 }}>{place}</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="form-label fw-semibold">Full course</label>
                    <label
                      className="d-flex align-items-center gap-2 mb-0 p-2 rounded"
                      style={{
                        background: courseSessions.length > 0 && courseSessions.every((session) => selectedSessionIds.includes(String(session.id || session._id))) ? '#fff1f4' : 'transparent',
                        cursor: 'pointer',
                        border: '1px solid #ffe4e6',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={courseSessions.length > 0 && courseSessions.every((session) => selectedSessionIds.includes(String(session.id || session._id)))}
                        onChange={toggleCourse}
                      />
                      <span>
                        <span className="d-block fw-semibold">{referSession.courseName || 'This course'}</span>
                        <span className="text-muted" style={{ fontSize: 12 }}>{courseSessions.length} session(s)</span>
                      </span>
                    </label>
                  </div>
                </div>
                {referMessage && <p className="text-danger mt-3 mb-0">{referMessage}</p>}
              </div>
              <div className="assign-modal__foot">
                <button type="button" className="vt-back" onClick={() => setReferSession(null)}>Cancel</button>
                <button
                  type="button"
                  className="assign-modal__assign"
                  disabled={saving || batchesLoading || teamLoading || !selectedBatchId || !selectedPersonId || selectedSessionIds.length === 0}
                  onClick={saveRefer}
                >
                  {saving ? 'Referring...' : `Refer (${selectedSessionIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchMonitoring;
