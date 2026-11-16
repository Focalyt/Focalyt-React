import React, { useMemo, useState } from 'react';
import { Calendar, Search, Sparkles, X } from 'lucide-react';
import { useClub } from '../../../../contexts/ClubContext';
import { ActivityCard } from '../Components/ActivityCard';
import { ActivityDetailModal } from '../Components/ActivityDetailModal';
import { MODE_FILTERS } from '../../../../config/club/labels';
import { Can } from '../Components/cms/Can';

export const WhatsOnPage = () => {
  const { state, upsertActivity, shareAchievement } = useClub();
  const [requestForm, setRequestForm] = useState({
    title: '',
    clubId: state.clubs[0]?.id || '',
    startDate: '',
    endDate: '',
    time: '',
    mode: 'In-Person',
    summary: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('All');
  const [selectedClubId, setSelectedClubId] = useState('All');
  const [selectedActivity, setSelectedActivity] = useState(null);

  const filteredActivities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.activities.filter((act) => {
      if (act.scheduleStatus && act.scheduleStatus !== 'scheduled') return false;
      if (selectedMode !== 'All' && act.mode !== selectedMode) return false;
      if (selectedClubId !== 'All' && act.clubId !== selectedClubId) return false;
      if (!q) return true;
      const club = state.clubs.find((c) => c.id === act.clubId);
      return (
        act.title.toLowerCase().includes(q) ||
        act.summary.toLowerCase().includes(q) ||
        act.location.toLowerCase().includes(q) ||
        (club && club.name.toLowerCase().includes(q)) ||
        act.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [state.activities, state.clubs, searchQuery, selectedMode, selectedClubId]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMode('All');
    setSelectedClubId('All');
  };

  return (
    <div className="section-white" style={{ paddingTop: 44 }}>
      <div className="club-container">
        <div className="section-header">
          <div>
            <div className="section-eyebrow">
              <Calendar size={14} /> Events
            </div>
            <h1 className="section-title">Upcoming club events</h1>
            <p className="section-subtitle">
              Tap the bookmark to save an event. Tap <strong>Join event</strong> to take a seat. Tap the card to see more.
            </p>
          </div>
        </div>

        <div className="filter-bar club-events-filter">
          <div className="search-input-wrap">
            <Search size={18} className="search-input-icon" />
            <input
              type="search"
              className="search-input"
              placeholder="Search events"
              aria-label="Search events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-select club-events-club-select"
            aria-label="Filter by club"
            value={selectedClubId}
            onChange={(e) => setSelectedClubId(e.target.value)}
          >
            <option value="All">All clubs</option>
            {state.clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="chip-group" role="tablist" aria-label="Filter events by type">
            {MODE_FILTERS.map((mode) => (
              <button
                key={mode.value}
                type="button"
                role="tab"
                aria-selected={selectedMode === mode.value}
                className={`filter-chip ${selectedMode === mode.value ? 'active' : ''}`}
                onClick={() => setSelectedMode(mode.value)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <span>
            Showing <strong>{filteredActivities.length}</strong> of {state.activities.length} events
          </span>

          {(searchQuery.trim() !== '' || selectedMode !== 'All' || selectedClubId !== 'All') && (
            <button type="button" className="fc-btn fc-btn-ghost fc-btn-sm" onClick={resetFilters}>
              <X size={14} /> Reset filters
            </button>
          )}
        </div>

        {filteredActivities.length === 0 ? (
          <div className="empty-state-box">
            <Sparkles size={28} color="var(--primary-rose)" />
            <h3 style={{ fontSize: '1.15rem' }}>No events found</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 440, fontSize: '0.92rem' }}>
              Try All clubs or All event types to see everything coming up.
            </p>
            <button type="button" className="fc-btn fc-btn-primary fc-btn-sm" onClick={resetFilters}>
              Show All Activities
            </button>
          </div>
        ) : (
          <div className="cards-grid-3">
            {filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onSelectActivity={(act) => setSelectedActivity(act)}
              />
            ))}
          </div>
        )}

        {state.results && state.results.length > 0 && (
          <div style={{ marginTop: 42 }}>
            <div className="section-header" style={{ marginBottom: 18 }}>
              <div>
                <div className="section-eyebrow">
                  <Sparkles size={14} /> Results & Highlights
                </div>
                <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
                  Recent Event Winners & Outcomes
                </h2>
                <p className="section-subtitle">
                  Published results and standout moments from recent campus club sessions.
                </p>
              </div>
            </div>

            <div className="cards-grid-2">
              {state.results.map((res) => {
                const club = state.clubs.find((c) => c.id === res.clubId);
                return (
                  <div key={res.id} className="form-card" style={{ padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span className="pill pill-pink">{club?.name || 'Campus Event'}</span>
                      <span className="pill pill-Joined">{res.status || 'Published'}</span>
                    </div>
                    <h3 style={{ fontSize: '1.12rem', marginBottom: 6 }}>{res.title}</h3>
                    {res.winners && (
                      <p style={{ fontWeight: 700, color: 'var(--primary-rose)', fontSize: '0.9rem', marginBottom: 6 }}>
                        🏆 {res.winners}
                      </p>
                    )}
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{res.summary}</p>
                    {res.declaredAt && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 10 }}>
                        Declared on {res.declaredAt}
                      </p>
                    )}
                    <Can permission="achievements.share">
                      <button
                        type="button"
                        className="fc-btn fc-btn-outline fc-btn-sm"
                        style={{ marginTop: 10 }}
                        onClick={() =>
                          shareAchievement({
                            resultId: res.id,
                            clubId: res.clubId,
                            title: res.title,
                            summary: res.summary || res.winners,
                          })
                        }
                      >
                        Share achievement card
                      </button>
                    </Can>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Can permission="activities.request">
        <div className="club-container" style={{ marginTop: 28 }}>
          <form
            className="form-card"
            onSubmit={(e) => {
              e.preventDefault();
              upsertActivity({
                title: requestForm.title,
                clubId: requestForm.clubId,
                startDate: requestForm.startDate,
                endDate: requestForm.endDate || requestForm.startDate,
                date: requestForm.startDate,
                time: requestForm.time,
                mode: requestForm.mode,
                summary: requestForm.summary,
                description: requestForm.summary,
                location: requestForm.mode === 'Online' ? 'Online' : 'Campus',
              });
              setRequestForm({ ...requestForm, title: '', summary: '' });
            }}
          >
            <h3 style={{ marginBottom: 12 }}>Request an activity</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 12 }}>
              Institute users and a student assigned as Club Captain can request. This does not publish the schedule.
            </p>
            <div className="form-grid">
              <input
                className="form-input"
                placeholder="Activity title"
                value={requestForm.title}
                onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                required
              />
              <select
                className="form-select"
                value={requestForm.clubId}
                onChange={(e) => setRequestForm({ ...requestForm, clubId: e.target.value })}
              >
                {state.clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
              <input
                className="form-input"
                type="date"
                value={requestForm.startDate}
                onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                required
              />
              <input
                className="form-input"
                type="date"
                value={requestForm.endDate}
                onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
              />
              <input
                className="form-input"
                placeholder="Time"
                value={requestForm.time}
                onChange={(e) => setRequestForm({ ...requestForm, time: e.target.value })}
                required
              />
              <select
                className="form-select"
                value={requestForm.mode}
                onChange={(e) => setRequestForm({ ...requestForm, mode: e.target.value })}
              >
                <option value="In-Person">Offline / on campus</option>
                <option value="Online">Online</option>
                <option value="Hybrid">Both</option>
              </select>
              <input
                className="form-input"
                placeholder="Summary"
                value={requestForm.summary}
                onChange={(e) => setRequestForm({ ...requestForm, summary: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="fc-btn fc-btn-outline fc-btn-sm" style={{ marginTop: 12 }}>
              Submit activity request
            </button>
          </form>
        </div>
      </Can>

      <ActivityDetailModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </div>
  );
};

export default WhatsOnPage;
