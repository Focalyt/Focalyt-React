import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

function LiveClassRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const jitsiDomain = process.env.REACT_APP_JITSI_DOMAIN || 'meet.jit.si';
  const [liveClass, setLiveClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [endingClass, setEndingClass] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || '{}');
    } catch (e) {
      return {};
    }
  }, []);

  const authToken = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('token'));
    } catch (e) {
      return sessionStorage.getItem('token');
    }
  }, []);

  const fetchLiveClass = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError('');
      const response = await axios.get(`${backendUrl}/api/live-class/${id}`);

      if (response.data?.status && response.data?.data) {
        setLiveClass(response.data.data);
      } else {
        setError(response.data?.message || 'Unable to load live class.');
      }
    } catch (err) {
      console.error('Error loading live class:', err);
      setError(err?.response?.data?.message || 'Unable to load live class.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLiveClass();
  }, [backendUrl, id]);

  useEffect(() => {
    if (!liveClass?._id) return undefined;

    const interval = setInterval(() => {
      fetchLiveClass({ silent: true });
    }, 10000);

    return () => clearInterval(interval);
  }, [liveClass?._id]);

  useEffect(() => {
    if (liveClass?.status !== 'completed') return undefined;

    const timeout = setTimeout(() => {
      navigate('/trainer/addcoursecontent', { replace: true });
    }, 1200);

    return () => clearTimeout(timeout);
  }, [liveClass?.status, navigate]);

  const displayName = user?.name || 'Student';
  const trainerId = liveClass?.trainerId?._id || liveClass?.trainerId;
  const isTrainerHost = trainerId && user?._id && String(trainerId) === String(user._id);
  const jitsiRoomUrl = useMemo(() => {
    if (!liveClass?.roomName) return '';

    const displayNameParam = encodeURIComponent(displayName);
    return `https://${jitsiDomain}/${liveClass.roomName}#userInfo.displayName="${displayNameParam}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.enableWelcomePage=false&config.defaultLanguage="en"`;
  }, [displayName, jitsiDomain, liveClass]);

  const handleEndClass = async () => {
    if (!liveClass?._id || !authToken) {
      alert('Unable to end class right now.');
      return;
    }

    const confirmed = window.confirm('End class for everyone on LMS? All joined users will see the class as ended.');
    if (!confirmed) return;

    try {
      setEndingClass(true);
      const response = await axios.post(
        `${backendUrl}/college/trainerTimeTable/${liveClass._id}/end-class`,
        {},
        { headers: { 'x-auth': authToken } }
      );

      if (response.data?.status) {
        setLiveClass((prev) => ({
          ...prev,
          status: 'completed',
          completedAt: response.data?.data?.completedAt || new Date().toISOString(),
        }));
      } else {
        alert(response.data?.message || 'Failed to end class.');
      }
    } catch (err) {
      console.error('Error ending class:', err);
      alert(err?.response?.data?.message || 'Failed to end class.');
    } finally {
      setEndingClass(false);
    }
  };

  if (loading) {
    return <div className="container py-4">Loading live class...</div>;
  }

  if (error || !liveClass) {
    return <div className="container py-4 text-danger">{error || 'Live class not found.'}</div>;
  }

  if (liveClass.status === 'completed') {
    return (
      <div className="container py-4">
        <div className="card shadow-sm border-0">
          <div className="card-body py-4">
            <h2 className="h4 mb-2">Class Ended</h2>
            <p className="text-muted mb-0">
              This live class was ended by the trainer. Please return to the LMS schedule for the next session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <div className="card shadow-sm border-0 m-0" style={{ borderRadius: 0, flex: '0 0 auto' }}>
        <div className="card-body py-2 px-3">
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div>
              <h2 className="h5 mb-1">{liveClass.title || 'Live Class'}</h2>
              <p className="text-muted mb-1" style={{ fontSize: '0.95rem' }}>
                {liveClass.subject || 'Subject not specified'}
                {liveClass.courseName ? ` | ${liveClass.courseName}` : ''}
                {liveClass.batchName ? ` | ${liveClass.batchName}` : ''}
              </p>
              <div className="small text-muted" style={{ fontSize: '0.85rem' }}>
                Trainer: {liveClass.trainerName || 'Trainer'} | Date:{' '}
                {liveClass.date ? new Date(liveClass.date).toLocaleDateString('en-IN') : 'N/A'} | Time:{' '}
                {liveClass.startTime || 'N/A'} - {liveClass.endTime || 'N/A'}
              </div>
            </div>
            {isTrainerHost && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleEndClass}
                disabled={endingClass}
              >
                {endingClass ? 'Ending Class...' : 'End Class'}
              </button>
            )}
          </div>
        </div>
      </div>

      {liveClass.liveClassPlatform === 'google_meet' && liveClass.googleMeetLink ? (
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <p className="mb-3">
              This class uses Google Meet. Open it in a new tab if embedded mode is blocked by the browser.
            </p>
            <a
              href={liveClass.googleMeetLink}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Join Google Meet
            </a>
          </div>
        </div>
      ) : (
        <div className="card shadow-sm border-0 overflow-hidden" style={{ borderRadius: 0, flex: '1 1 auto' }}>
          <div style={{ height: '100%', width: '100%' }}>
            <iframe
              title={liveClass.title || 'Jitsi Live Class'}
              src={jitsiRoomUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveClassRoom;
