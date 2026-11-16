import React, { useState } from 'react';
import { Can } from '../Components/cms/Can';
import { StatusBadge } from '../Components/cms/StatusBadge';
import { useClub } from '../../../../contexts/ClubContext';
import { usePermission } from '../hooks/usePermission';
import { staffManageableClubs } from '../../../../services/club/clubLiveState';

export const BudgetsPage = () => {
  const { state, upsertBudget, workflowBudget } = useClub();
  const { can } = usePermission();
  const manageableClubs = staffManageableClubs(state.clubs);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    purpose: '',
    clubId: manageableClubs[0]?.id || '',
  });
  const clubName = (id) => state.clubs.find((club) => club.id === id)?.name || '—';

  const submitBudget = (requestedBy) => {
    upsertBudget({
      ...form,
      amount: Number(form.amount) || 0,
      requestedBy,
    });
    setForm({ ...form, title: '', amount: '', purpose: '' });
  };

  return (
    <div className="club-list-page">
      <div className="club-list-page__header">
        <div>
          <h1>Budgets</h1>
          <p>Prepare, request, recommend, and approve club spend.</p>
        </div>
      </div>

      {!can('budgets.create') && (
      <Can permission="budgets.request">
        <form
          className="club-list-page__panel"
          onSubmit={(e) => {
            e.preventDefault();
            submitBudget('Budget request');
          }}
        >
          <h3>Request budget</h3>
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
              <label className="form-label">Amount (₹)</label>
              <input
                className="form-input"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Club</label>
              <select
                className="form-select"
                value={form.clubId}
                onChange={(e) => setForm({ ...form, clubId: e.target.value })}
              >
                {manageableClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Purpose</label>
              <input
                className="form-input"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                required
              />
            </div>
          </div>
          <button type="submit" className="fc-btn fc-btn-outline fc-btn-sm" style={{ marginTop: 12 }}>
            Submit request
          </button>
        </form>
      </Can>
      )}

      <Can permission="budgets.create">
        <form
          className="club-list-page__panel"
          onSubmit={(e) => {
            e.preventDefault();
            submitBudget('Club Administrator');
          }}
        >
          <h3>Prepare budget</h3>
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
              <label className="form-label">Amount (₹)</label>
              <input
                className="form-input"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Club</label>
              <select
                className="form-select"
                value={form.clubId}
                onChange={(e) => setForm({ ...form, clubId: e.target.value })}
              >
                {manageableClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Purpose</label>
              <input
                className="form-input"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                required
              />
            </div>
          </div>
          <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm" style={{ marginTop: 12 }}>
            Save budget
          </button>
        </form>
      </Can>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Budget</th>
              <th>Club</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(state.budgets || []).length === 0 ? (
              <tr>
                <td colSpan={5} className="club-list-page__empty">
                  No budgets yet.
                </td>
              </tr>
            ) : (
              state.budgets.map((budget) => {
                const status = String(budget.status || 'Draft');
                return (
                  <tr key={budget.id}>
                    <td>
                      <div className="club-list-page__name">{budget.title}</div>
                      <div className="club-list-page__meta">{budget.purpose || '—'}</div>
                    </td>
                    <td>{clubName(budget.clubId)}</td>
                    <td>₹{budget.amount || 0}</td>
                    <td>
                      <StatusBadge status={status} />
                    </td>
                    <td>
                      <div className="club-list-page__actions">
                        {(status === 'Draft' || !budget.status) && (
                          <Can permission="budgets.request">
                            <button
                              type="button"
                              className="club-link-btn"
                              onClick={() => workflowBudget(budget.id, 'request')}
                            >
                              Request
                            </button>
                          </Can>
                        )}
                        {status === 'Requested' && (
                          <Can permission="budgets.recommend">
                            <button
                              type="button"
                              className="club-link-btn"
                              onClick={() => workflowBudget(budget.id, 'recommend')}
                            >
                              Recommend
                            </button>
                          </Can>
                        )}
                        {(status === 'Recommended' || status === 'Requested') && (
                          <Can permission="budgets.approve">
                            <button
                              type="button"
                              className="club-link-btn"
                              onClick={() => workflowBudget(budget.id, 'approve')}
                            >
                              Approve
                            </button>
                          </Can>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetsPage;
