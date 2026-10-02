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
  const [referMode, setReferMode] = useState('session');
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
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

  const openRefer = (session) => {
    setReferMessage('');
    setReferMode('session');
    setReferSession(session);
    setSelectedSessionIds([String(session.id || session._id)]);
  };

  const chooseSession = (sessionId) => {
    setReferMode('session');
    setReferMessage('');
    setSelectedSessionIds([sessionId]);
  };

  const chooseCourse = () => {
    setReferMode('course');
    setReferMessage('');
    setSelectedSessionIds(courseSessions.map((session) => String(session.id || session._id)));
  };

  const saveRefer = async () => {
    const chosen = courseSessions.filter((session) => selectedSessionIds.includes(String(session.id || session._id)));
    if (chosen.length === 0) {
      setReferMessage('Select a session.');
      return;
    }
    setSaving(true);
    setReferMessage('');
    try {
      await Promise.all(chosen.map((session) => axios.patch(
        `${backendUrl}/college/session-plans/${session.id || session._id}`,
        {
          workflowStatus: session.fieldTrainerId ? 'Assigned' : 'Sent to Senior Trainer',
          seniorTrainerId: session.seniorTrainerId || '',
          seniorTrainerName: session.seniorTrainerName || '',
          fieldTrainerId: session.fieldTrainerId || '',
          fieldTrainerName: session.fieldTrainerName || '',
        },
        { headers }
      )));
      setReferSession(null);
      await loadSessions();
    } catch (error) {
      console.error('Error referring session:', error);
      setReferMessage('Could not refer this session.');
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label fw-semibold">Single session</label>
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 360, overflow: 'auto' }}>
                      {courseSessions.map((session) => {
                        const id = String(session.id || session._id);
                        const place = [
                          session.unitName || (session.unitNumber ? `Unit ${session.unitNumber}` : ''),
                          session.chapterName || (session.chapterNumber ? `Ch. ${session.chapterNumber}` : ''),
                        ].filter(Boolean).join(' · ');
                        const checked = referMode === 'session' && selectedSessionIds.includes(id);
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
                              onChange={() => chooseSession(id)}
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
                        background: referMode === 'course' ? '#fff1f4' : 'transparent',
                        cursor: 'pointer',
                        border: '1px solid #ffe4e6',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={referMode === 'course'}
                        onChange={chooseCourse}
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
                  disabled={saving || selectedSessionIds.length === 0}
                  onClick={saveRefer}
                >
                  {saving ? 'Referring...' : 'Refer'}
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
