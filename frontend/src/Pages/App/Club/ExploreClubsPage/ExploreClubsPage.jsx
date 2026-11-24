import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Sparkles, Users, X } from 'lucide-react';
import { useClub } from '../../../../contexts/ClubContext';
import { ClubCard } from '../Components/ClubCard';
import { ClubDetailModal } from '../Components/ClubDetailModal';
import { ActivityDetailModal } from '../Components/ActivityDetailModal';
import { categoryFiltersFromTypes, categoryLabel } from '../../../../config/club/labels';

export const ExploreClubsPage = () => {
  const { state } = useClub();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialInterest = searchParams.get('interest') || '';
  const [searchQuery, setSearchQuery] = useState(initialInterest);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const categoryFilters = useMemo(
    () => categoryFiltersFromTypes(state.settings?.clubTypes || []),
    [state.settings?.clubTypes]
  );

  useEffect(() => {
    const paramInterest = searchParams.get('interest');
    if (paramInterest) {
      setSearchQuery(paramInterest);
    }
  }, [searchParams]);

  const filteredClubs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.clubs.filter((club) => {
      const matchesCategory =
        activeCategory === 'All' || club.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      const inName = (club.name || '').toLowerCase().includes(q);
      const inDesc = (club.description || '').toLowerCase().includes(q);
      const inTagline = (club.tagline || '').toLowerCase().includes(q);
      const inInterests = (club.interests || []).some((i) => i.toLowerCase().includes(q));
      return inName || inDesc || inTagline || inInterests;
    });
  }, [state.clubs, activeCategory, searchQuery]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveCategory('All');
    if (searchParams.has('interest')) {
      setSearchParams({});
    }
  };

  return (
    <div className="section-white" style={{ paddingTop: 44 }}>
      <div className="club-container">
        <div className="section-header">
          <div>
            <div className="section-eyebrow">
              <Users size={14} /> Clubs
            </div>
            <h1 className="section-title">Find a club</h1>
            <p className="section-subtitle">
              Search by name or pick Arts, Sports, Social, or Tech. Ask to join a club — Club Admin must approve before you become a member.
            </p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-input-wrap">
            <Search size={18} className="search-input-icon" />
            <input
              type="search"
              className="search-input"
              placeholder="Search by club name or interest (e.g., Music, Photography, Futsal, IoT)..."
              aria-label="Search clubs by name or interest"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="chip-group" role="tablist" aria-label="Filter clubs by category">
            {categoryFilters.map((tab) => {
              const active = activeCategory === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`filter-chip ${active ? 'active' : ''}`}
                  onClick={() => setActiveCategory(tab.value)}
                >
                  {tab.label}
                </button>
              );
            })}
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
            Showing <strong>{filteredClubs.length}</strong> of {state.clubs.length} clubs
            {activeCategory !== 'All' && ` in ${categoryLabel(activeCategory)}`}
            {searchQuery.trim() && ` matching “${searchQuery.trim()}”`}
          </span>

          {(activeCategory !== 'All' || searchQuery.trim() !== '') && (
            <button
              type="button"
              className="fc-btn fc-btn-ghost fc-btn-sm"
              onClick={clearFilters}
            >
              <X size={14} /> Clear search & filters
            </button>
          )}
        </div>

        {filteredClubs.length === 0 ? (
          <div className="empty-state-box">
            <Sparkles size={28} color="var(--primary-rose)" />
            <h3 style={{ fontSize: '1.15rem' }}>
              {state.clubs.length === 0 ? 'No clubs to join yet' : 'No clubs match your filter'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 440, fontSize: '0.92rem' }}>
              {state.clubs.length === 0
                ? 'When Club Admin creates a club, it will show here so you can join or ask to join.'
                : 'Try clearing your search term or switching the category tab back to All.'}
            </p>
            {state.clubs.length > 0 && (
            <button type="button" className="fc-btn fc-btn-primary fc-btn-sm" onClick={clearFilters}>
              Show All Clubs
            </button>
            )}
          </div>
        ) : (
          <div className="cards-grid-3">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                onSelectClub={(c) => setSelectedClub(c)}
              />
            ))}
          </div>
        )}
      </div>

      <ClubDetailModal
        club={selectedClub}
        onClose={() => setSelectedClub(null)}
        onSelectActivity={(act) => setSelectedActivity(act)}
      />
      <ActivityDetailModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </div>
  );
};

export default ExploreClubsPage;
