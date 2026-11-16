import React, { useState } from 'react';
import { Can } from '../Components/cms/Can';
import { StatusBadge } from '../Components/cms/StatusBadge';
import { useClub } from '../../../../contexts/ClubContext';
import { usePermission } from '../hooks/usePermission';
import { staffManageableClubs } from '../../../../services/club/clubLiveState';

export const AnnouncementsPage = () => {
  const { state, createAnnouncement, deleteAnnouncement, reviewAnnouncement } = useClub();
  const { can } = usePermission();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [clubId, setClubId] = useState('');
  const targetClubs = staffManageableClubs(state.clubs);
  const clubName = (id) => state.clubs.find((club) => club.id === id)?.name || '';

  const submit = (e) => {
    e.preventDefault();
    createAnnouncement({
      title,
      body,
      clubId: clubId || undefined,
      audience: clubId ? clubName(clubId) || 'Club members' : 'All',
    });
    setTitle('');
    setBody('');
  };

  const clubField = targetClubs.length > 0 ? (
    <div className="form-field" style={{ marginTop: 12 }}>
      <label className="form-label">Send to</label>
      <select className="form-select" value={clubId} onChange={(e) => setClubId(e.target.value)}>
        <option value="">Whole campus</option>
        {targetClubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name} members
          </option>
        ))}
      </select>
    </div>
  ) : null;

  return (
    <div className="club-list-page">
      <div className="club-list-page__header">
        <div>
          <h1>Announcements</h1>
          <p>Campus notices for clubs and students.</p>
        </div>
      </div>

      <Can permission="announcements.create">
        <form className="club-list-page__panel" onSubmit={submit}>
          <h3>Publish announcement</h3>
          <div className="form-field">
            <label className="form-label">Title</label>
            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-field" style={{ marginTop: 12 }}>
            <label className="form-label">Message</label>
            <textarea className="form-textarea" rows={3} value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          {clubField}
          <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm" style={{ marginTop: 12 }}>
            Publish
          </button>
        </form>
      </Can>

      {!can('announcements.create') && (
      <Can permission="announcements.request">
        <form className="club-list-page__panel" onSubmit={submit}>
          <h3>Request announcement</h3>
          <div className="form-field">
            <label className="form-label">Title</label>
            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-field" style={{ marginTop: 12 }}>
            <label className="form-label">Message</label>
            <textarea className="form-textarea" rows={3} value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          <button type="submit" className="fc-btn fc-btn-outline fc-btn-sm" style={{ marginTop: 12 }}>
            Submit request
          </button>
        </form>
      </Can>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Announcement</th>
              <th>Audience</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(state.announcements || []).length === 0 ? (
              <tr>
                <td colSpan={5} className="club-list-page__empty">
                  No announcements yet.
                </td>
              </tr>
            ) : (
              state.announcements.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="club-list-page__name">{item.title}</div>
                    <div className="club-list-page__meta">{item.body}</div>
                  </td>
                  <td>{item.clubId ? clubName(item.clubId) || item.audience : item.audience || 'All'}</td>
                  <td>
                    <StatusBadge status={item.status || 'published'} />
                  </td>
                  <td>{item.createdAt || '—'}</td>
                  <td>
                    <Can permission="announcements.create">
                      <div className="club-list-page__actions">
                        {item.status === 'pending' && (
                          <button
                            type="button"
                            className="club-link-btn"
                            onClick={() => reviewAnnouncement(item.id, 'approve')}
                          >
                            Approve
                          </button>
                        )}
                        <button type="button" className="club-link-btn" onClick={() => deleteAnnouncement(item.id)}>
                          Remove
                        </button>
                      </div>
                    </Can>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
