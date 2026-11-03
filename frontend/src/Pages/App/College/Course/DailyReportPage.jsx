import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DailyTrainerReport from './DailyTrainerReport';

const DailyReportPage = () => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = user.token;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [sessions, setSessions] = useState([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    axios.get(`${backendUrl}/college/batches/my-sessions`, {
      headers: { 'x-auth': token },
    }).then((response) => {
      if (!cancelled) setSessions(Array.isArray(response.data?.data) ? response.data.data : []);
    }).catch(() => {
      if (!cancelled) setSessions([]);
    });
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div style={{ padding: 16 }}>
      <DailyTrainerReport
        backendUrl={backendUrl}
        token={token}
        trainerName={user.name || ''}
        userId={user._id || user.id}
        sessions={sessions}
        notify={notify}
      />
      {toast ? (
        <div style={{ position: 'fixed', right: 16, bottom: 16, background: '#0f172a', color: '#fff', borderRadius: 8, padding: '10px 14px', zIndex: 50 }}>
          {toast}
        </div>
      ) : null}
    </div>
  );
};

export default DailyReportPage;
