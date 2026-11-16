import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { Can } from '../Components/cms/Can';
import { StatusBadge } from '../Components/cms/StatusBadge';
import { BadgeMark } from '../Components/BadgeMark';
import { useClub } from '../../../../contexts/ClubContext';
import { BADGE_MARKS } from '../../../../config/club/badgeMarks';

const emptyGift = { id: '', name: '', points: 50, stock: 10, category: 'Merch', audience: 'student' };
const emptyBadge = { name: '', description: '', icon: 'crest', logoUrl: '', audience: 'student' };

export const RewardsStaffPage = () => {
  const { state, reviewRedemption, upsertGoodie, upsertBadge, awardBadge, deleteGoodie, notify } = useClub();
  const [form, setForm] = useState(emptyGift);
  const [badgeForm, setBadgeForm] = useState(emptyBadge);
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [awardStudentId, setAwardStudentId] = useState('');
  const gifts = state.goodies || [];
  const badges = state.badges || [];
  const students = state.eligibleStudents || [];
  const redemptions = state.redemptions || [];
  const pendingCount = redemptions.filter((row) => String(row.status).toLowerCase() === 'pending').length;
  const selectedBadge = badges.find((badge) => badge.id === selectedBadgeId) || badges[0];
  const awardStudent = students.find((student) => student.studentId === awardStudentId);

  useEffect(() => {
    if (!form.id) return;
    const current = gifts.find((gift) => gift.id === form.id);
    if (!current) setForm(emptyGift);
  }, [form.id, gifts]);

  useEffect(() => {
    if (!selectedBadgeId && badges[0]?.id) setSelectedBadgeId(badges[0].id);
    if (!awardStudentId && students[0]?.studentId) setAwardStudentId(students[0].studentId);
  }, [awardStudentId, badges, selectedBadgeId, students]);

  const startEdit = (gift) => {
    setForm({
      id: gift.id,
      name: gift.name || '',
      points: gift.points || 50,
      stock: gift.stock || 0,
      category: gift.category || 'Merch',
      audience: 'student',
    });
  };

  const removeGift = (gift) => {
    if (!window.confirm(`Remove ${gift.name} from the gift catalog?`)) return;
    deleteGoodie(gift.id);
    if (form.id === gift.id) setForm(emptyGift);
  };

  const handleLogo = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notify('Logo too large', 'Use an image under 2 MB.', 'info');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBadgeForm((prev) => ({ ...prev, logoUrl: reader.result, icon: prev.icon || 'crest' }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="club-dash">
      <header className="club-dash-hero">
        <div>
          <p className="club-dash-hero__eyebrow">Recognition</p>
          <h1>Rewards</h1>
          <p className="club-dash-hero__sub">Award badges with logos, then handle gift pickups.</p>
        </div>
      </header>

      <div className="club-dash-stats">
        <div className="club-dash-stat">
          <span className="club-dash-stat__icon">
            <Award size={16} />
          </span>
          <strong>{badges.length}</strong>
          <span className="club-dash-stat__label">Badges</span>
        </div>
        <div className="club-dash-stat">
          <strong>{gifts.length}</strong>
          <span className="club-dash-stat__label">Gifts</span>
        </div>
        <div className={`club-dash-stat ${pendingCount ? 'is-alert' : ''}`}>
          <strong>{pendingCount}</strong>
          <span className="club-dash-stat__label">Pickup waiting</span>
        </div>
      </div>

      <section className="club-dash-panel">
        <div className="club-dash-panel__head">
          <div className="club-dash-panel__title">
            <h2>Badges & logos</h2>
            {badges.length ? <span className="club-dash-chip">{badges.length}</span> : null}
          </div>
        </div>
        {badges.length === 0 ? (
          <p className="club-dash-empty">No badges yet. Add one below, then award it to a student.</p>
        ) : (
          <div className="club-badge-grid">
            {badges.map((badge) => (
              <button
                key={badge.id}
                type="button"
                className={`club-badge-tile ${selectedBadge?.id === badge.id ? 'is-on' : ''}`}
                onClick={() => setSelectedBadgeId(badge.id)}
              >
                <BadgeMark icon={badge.icon} logoUrl={badge.logoUrl} name={badge.name} size={64} />
                <strong>{badge.name}</strong>
                <span>{badge.description || 'Campus badge'}</span>
              </button>
            ))}
          </div>
        )}

        <Can permission="rewards.process">
          <div className="club-badge-award">
            <select
              className="form-select"
              value={awardStudentId}
              onChange={(event) => setAwardStudentId(event.target.value)}
              aria-label="Student"
            >
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.studentId} value={student.studentId}>
                  {student.studentName}
                  {student.studentEmail ? ` (${student.studentEmail})` : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="fc-btn fc-btn-primary fc-btn-sm"
              disabled={!selectedBadge || !awardStudentId}
              onClick={() => awardBadge(selectedBadge, awardStudentId, awardStudent?.studentName)}
            >
              Award {selectedBadge?.name || 'badge'}
            </button>
          </div>
        </Can>
      </section>

      <Can permission="rewards.manage">
        <form
          className="club-dash-panel"
          onSubmit={(event) => {
            event.preventDefault();
            if (!badgeForm.name.trim()) return;
            upsertBadge({ ...badgeForm, audience: 'student' });
            setBadgeForm(emptyBadge);
          }}
        >
          <div className="club-dash-panel__head">
            <div className="club-dash-panel__title">
              <h2>Add a badge</h2>
            </div>
          </div>
          <div className="club-badge-marks" role="listbox" aria-label="Badge logo">
            {BADGE_MARKS.map((mark) => (
              <button
                key={mark.id}
                type="button"
                className={`club-badge-mark-pick ${badgeForm.icon === mark.id && !badgeForm.logoUrl ? 'is-on' : ''}`}
                onClick={() => setBadgeForm({ ...badgeForm, icon: mark.id, logoUrl: '' })}
              >
                <BadgeMark icon={mark.id} size={40} />
                {mark.label}
              </button>
            ))}
          </div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <div className="form-field">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                value={badgeForm.name}
                onChange={(event) => setBadgeForm({ ...badgeForm, name: event.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">What it is for</label>
              <input
                className="form-input"
                value={badgeForm.description}
                onChange={(event) => setBadgeForm({ ...badgeForm, description: event.target.value })}
                placeholder="e.g. Won the debate final"
              />
            </div>
          </div>
          <div className="club-badge-award" style={{ marginTop: 12 }}>
            <label className="fc-btn fc-btn-outline fc-btn-sm" style={{ margin: 0, cursor: 'pointer' }}>
              Upload logo
              <input type="file" accept="image/*" hidden onChange={handleLogo} />
            </label>
            {badgeForm.logoUrl ? (
              <button type="button" className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => setBadgeForm({ ...badgeForm, logoUrl: '' })}>
                Use preset logo
              </button>
            ) : null}
            <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm">
              Save badge
            </button>
          </div>
        </form>
      </Can>

      <Can permission="rewards.manage">
        <form
          className="club-dash-panel"
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.name.trim()) return;
            upsertGoodie({
              ...form,
              audience: 'student',
              points: Number(form.points) || 0,
              stock: Number(form.stock) || 0,
            });
            setForm(emptyGift);
          }}
        >
          <div className="club-dash-panel__head">
            <div className="club-dash-panel__title">
              <h2>{form.id ? 'Edit gift' : 'Add gift'}</h2>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Name</label>
              <input className="form-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div className="form-field">
              <label className="form-label">Points</label>
              <input className="form-input" type="number" min="1" value={form.points} onChange={(event) => setForm({ ...form, points: Number(event.target.value) })} required />
            </div>
            <div className="form-field">
              <label className="form-label">Stock</label>
              <input className="form-input" type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} required />
            </div>
            <div className="form-field">
              <label className="form-label">Category</label>
              <input className="form-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
            </div>
          </div>
          <div className="club-list-page__actions" style={{ marginTop: 12 }}>
            <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm">
              {form.id ? 'Update gift' : 'Save gift'}
            </button>
            {form.id ? (
              <button type="button" className="fc-btn fc-btn-outline fc-btn-sm" onClick={() => setForm(emptyGift)}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </Can>

      <section className="club-dash-panel">
        <div className="club-dash-panel__head">
          <div className="club-dash-panel__title">
            <h2>Gifts</h2>
          </div>
        </div>
        {gifts.length === 0 ? (
          <p className="club-dash-empty">No gifts yet.</p>
        ) : (
          <div className="club-dash-rows">
            {gifts.map((gift) => (
              <div key={gift.id} className="club-dash-row">
                <div className="club-dash-row__body">
                  <strong>{gift.name}</strong>
                  <span>
                    {gift.points} pts · {gift.stock} in stock
                    {gift.collegeName ? ` · ${gift.collegeName}` : ''}
                  </span>
                </div>
                <div className="club-dash-row__actions">
                  <Can permission="rewards.manage">
                    <button type="button" className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => startEdit(gift)}>
                      Edit
                    </button>
                    <button type="button" className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => removeGift(gift)}>
                      Remove
                    </button>
                  </Can>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="club-dash-panel">
        <div className="club-dash-panel__head">
          <div className="club-dash-panel__title">
            <h2>Pickup requests</h2>
            {pendingCount ? <span className="club-dash-chip">{pendingCount}</span> : null}
          </div>
        </div>
        {redemptions.length === 0 ? (
          <p className="club-dash-empty">No gift requests yet.</p>
        ) : (
          <div className="club-dash-rows">
            {redemptions.map((item) => (
              <div key={item.id} className="club-dash-row">
                <div className="club-dash-row__body">
                  <strong>{item.studentName || '—'}</strong>
                  <span>
                    {item.goodieName} · {item.points || 0} pts
                  </span>
                </div>
                <div className="club-dash-row__status">
                  <StatusBadge status={item.status} />
                </div>
                <div className="club-dash-row__actions">
                  {String(item.status).toLowerCase() === 'pending' ? (
                    <Can permission="rewards.process">
                      <button type="button" className="fc-btn fc-btn-primary fc-btn-sm" onClick={() => reviewRedemption(item.id, 'approve')}>
                        Approve
                      </button>
                      <button type="button" className="fc-btn fc-btn-outline fc-btn-sm" onClick={() => reviewRedemption(item.id, 'reject')}>
                        Reject
                      </button>
                    </Can>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RewardsStaffPage;
