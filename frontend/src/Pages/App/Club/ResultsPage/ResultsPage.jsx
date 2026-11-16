import React, { useState } from 'react';
import { Can } from '../Components/cms/Can';
import { useClub } from '../../../../contexts/ClubContext';

export const ResultsPage = () => {
  const { state, declareResult, shareAchievement } = useClub();
  const [form, setForm] = useState({
    title: '',
    summary: '',
    winners: '',
    activityId: state.activities[0]?.id || '',
    clubId: state.activities[0]?.clubId || '',
  });

  return (
    <div className="club-list-page">
      <div className="club-list-page__header">
        <div>
          <h1>Results</h1>
          <p>Publish activity results for students and the campus.</p>
        </div>
      </div>

      <Can permission="results.declare">
        <form
          className="club-list-page__panel"
          onSubmit={(e) => {
            e.preventDefault();
            declareResult(form);
            setForm({ ...form, title: '', summary: '', winners: '' });
          }}
        >
          <h3>Declare result</h3>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Activity</label>
              <select
                className="form-select"
                value={form.activityId}
                onChange={(e) => {
                  const activity = state.activities.find((item) => item.id === e.target.value);
                  setForm({ ...form, activityId: e.target.value, clubId: activity?.clubId || '' });
                }}
              >
                {state.activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Winners / highlights</label>
              <input
                className="form-input"
                value={form.winners}
                onChange={(e) => setForm({ ...form, winners: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Summary</label>
              <input
                className="form-input"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                required
              />
            </div>
          </div>
          <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm" style={{ marginTop: 12 }}>
            Publish result
          </button>
        </form>
      </Can>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Result</th>
              <th>Highlight</th>
              <th>Declared</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(state.results || []).length === 0 ? (
              <tr>
                <td colSpan={5} className="club-list-page__empty">
                  No results declared yet.
                </td>
              </tr>
            ) : (
              state.results.map((result) => (
                <tr key={result.id}>
                  <td>
                    <div className="club-list-page__name">{result.title}</div>
                    <div className="club-list-page__meta">{result.summary || '—'}</div>
                  </td>
                  <td>{result.winners || '—'}</td>
                  <td>{result.declaredAt || '—'}</td>
                  <td>{result.status || 'Published'}</td>
                  <td>
                    <Can permission="achievements.share">
                      <button
                        type="button"
                        className="club-link-btn"
                        onClick={() =>
                          shareAchievement({
                            resultId: result.id,
                            clubId: result.clubId,
                            title: result.title,
                            summary: result.summary || result.winners,
                          })
                        }
                      >
                        Share
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
  );
};

export default ResultsPage;
