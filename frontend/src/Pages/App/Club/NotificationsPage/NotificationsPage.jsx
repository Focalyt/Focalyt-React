import React, { useState } from 'react';
import { Can } from '../Components/cms/Can';
import { useClub } from '../../../../contexts/ClubContext';

export const NotificationsPage = () => {
  const { state, createNotificationTemplate, sendClubNotification } = useClub();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('participation');

  return (
    <div className="club-list-page">
      <div className="club-list-page__header">
        <div>
          <h1>Notifications</h1>
          <p>Templates and notices sent to club members.</p>
        </div>
      </div>

      <Can permission="notifications.configure">
        <form
          className="club-list-page__panel"
          onSubmit={(e) => {
            e.preventDefault();
            createNotificationTemplate({ title, body, type, enabled: true });
            setTitle('');
            setBody('');
          }}
        >
          <h3>Create template</h3>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Type</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="participation">Participation reminder</option>
                <option value="promotional">Promotional</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-field full-width">
              <label className="form-label">Message</label>
              <input
                className="form-input"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm" style={{ marginTop: 12 }}>
            Save template
          </button>
        </form>
      </Can>

      <div className="club-list-page__section" style={{ marginTop: 0 }}>
        <h2>Templates</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(state.notificationTemplates || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="club-list-page__empty">
                    No templates yet.
                  </td>
                </tr>
              ) : (
                (state.notificationTemplates || []).map((template) => (
                  <tr key={template.id}>
                    <td>
                      <div className="club-list-page__name">{template.title}</div>
                      <div className="club-list-page__meta">{template.body}</div>
                    </td>
                    <td>{template.type || '—'}</td>
                    <td>
                      <Can permission="notifications.send">
                        <button
                          type="button"
                          className="club-link-btn"
                          disabled={!template.enabled}
                          onClick={() => sendClubNotification({ templateId: template.id })}
                        >
                          Send
                        </button>
                      </Can>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="club-list-page__section">
        <h2>Recent notifications</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Notification</th>
                <th>Type</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(state.notifications || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="club-list-page__empty">
                    No notifications yet.
                  </td>
                </tr>
              ) : (
                state.notifications.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="club-list-page__name">{item.title}</div>
                      <div className="club-list-page__meta">{item.body}</div>
                    </td>
                    <td>{item.type || 'system'}</td>
                    <td>{item.createdAt || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
