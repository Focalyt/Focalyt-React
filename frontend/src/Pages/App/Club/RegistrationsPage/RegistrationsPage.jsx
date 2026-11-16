import React from 'react';
import { Can } from '../Components/cms/Can';
import { StatusBadge } from '../Components/cms/StatusBadge';
import { useClub } from '../../../../contexts/ClubContext';

export const RegistrationsPage = () => {
  const { state, approveActivityRegistration, markAttendance } = useClub();
  const rows = state.activities.flatMap((activity) =>
    (activity.registrations || []).map((registration) => ({
      ...registration,
      activityTitle: activity.title,
      activityId: activity.id,
    }))
  );

  return (
    <div className="club-list-page">
      <div className="club-list-page__header">
        <div>
          <h1>Registrations</h1>
          <p>Approve seats and mark attendance for club activities.</p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Activity</th>
              <th>Registered</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="club-list-page__empty">
                  No registrations yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.activityId}-${row.id}`}>
                  <td>
                    <div className="club-list-page__name">{row.studentName || '—'}</div>
                    <div className="club-list-page__meta">{row.studentEmail || '—'}</div>
                  </td>
                  <td>{row.activityTitle}</td>
                  <td>{row.registeredAt || '—'}</td>
                  <td>
                    <StatusBadge status={row.attendance} />
                  </td>
                  <td>
                    <Can permission="registrations.approve">
                      <div className="club-list-page__actions">
                        {String(row.attendance || '').toLowerCase() === 'pending' && (
                          <button
                            type="button"
                            className="club-link-btn"
                            onClick={() => approveActivityRegistration(row.activityId, row.id)}
                          >
                            Approve
                          </button>
                        )}
                        {row.attendance !== 'Present' && (
                          <button
                            type="button"
                            className="club-link-btn"
                            onClick={() => markAttendance(row.activityId, row.id, 'Present')}
                          >
                            Present
                          </button>
                        )}
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

export default RegistrationsPage;
