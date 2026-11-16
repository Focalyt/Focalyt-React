import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Clock,
  Palette,
  Trophy,
  Heart,
  Cpu,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';
import { useClub } from '../../../../contexts/ClubContext';
import { categoryLabel } from '../../../../config/club/labels';
import { getClubTheme } from '../../../../config/club/clubThemes';
import {
  isApprovedMemberStatus,
  membershipLabel,
  normalizeMembershipStatus,
} from '../../../../config/club/membership';

const CATEGORY_THEMES = {
  Creative: {
    icon: Palette,
    themeClass: 'club-theme-creative',
  },
  'Sports & Games': {
    icon: Trophy,
    themeClass: 'club-theme-sports',
  },
  'Social & Impact': {
    icon: Heart,
    themeClass: 'club-theme-social',
  },
  'Tech & Makers': {
    icon: Cpu,
    themeClass: 'club-theme-tech',
  },
};

function cleanTagline(text = '') {
  return String(text).replace(/^["“']+|["”']+$/g, '').trim();
}

export const ClubCard = ({ club, onSelectClub }) => {
  const navigate = useNavigate();
  const { state, getClubPath, getMembershipStatus, joinOrRequestClub, leaveOrCancelClub } = useClub();
  const status = getMembershipStatus(club.id);
  const institution = state.institutions.find((p) => p.id === club.institutionId);
  const membership = normalizeMembershipStatus(status);
  const joinedCount = (club.members || []).filter((m) => isApprovedMemberStatus(m.status)).length;
  const categoryTheme = CATEGORY_THEMES[club.category] || CATEGORY_THEMES.Creative;
  const clubTheme = getClubTheme(club.theme);
  const CategoryIcon = categoryTheme.icon;
  const subtitle = cleanTagline(club.tagline || club.description);
  const openClub = () => {
    if (membership === 'approved') {
      navigate(getClubPath(`clubs/${club.id}`));
      return;
    }
    onSelectClub(club);
  };

  const handleCardKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openClub();
    }
  };

  return (
    <article
      className={`club-card club-card-student ${membership === 'approved' ? 'is-joined' : ''}`}
      style={{
        '--ccs-primary': clubTheme.primary,
        '--ccs-primary-deep': clubTheme.deep,
        '--ccs-soft': clubTheme.secondary,
        '--ccs-bg': clubTheme.bg,
      }}
      onClick={openClub}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${club.name} — ${categoryLabel(club.category)} club. ${
        membership === 'approved' ? 'Open club page.' : 'Click to view details.'
      }`}
    >
      <div className="ccs-top">
        <span className="ccs-category-pill">
          <CategoryIcon size={12} />
          <span>{categoryLabel(club.category)}</span>
        </span>
        {club.featured && membership === 'none' && (
          <span className="ccs-badge ccs-badge-featured">Featured</span>
        )}
        {membership !== 'none' && (
          <span
            className={`ccs-badge ${
              membership === 'approved'
                ? 'ccs-badge-joined'
                : membership === 'pending'
                  ? 'ccs-badge-pending'
                  : 'ccs-badge-neutral'
            }`}
          >
            {membership === 'approved' && <Check size={11} strokeWidth={3} />}
            {membership === 'pending' && <Clock size={11} />}
            {membership === 'blocked' && <ShieldAlert size={11} />}
            {membershipLabel(membership)}
          </span>
        )}
      </div>

      <h3 className="ccs-title">{club.name}</h3>
      {subtitle ? <p className="ccs-tagline">{subtitle}</p> : null}

      <p className="ccs-meta">
        {institution?.name || 'Campus'}
        {joinedCount > 0 ? ` · ${joinedCount} ${joinedCount === 1 ? 'member' : 'members'}` : ''}
      </p>

      <div className="ccs-footer" onClick={(e) => e.stopPropagation()}>
        {(membership === 'none' || membership === 'rejected') && (
          <button
            type="button"
            className="ccs-btn ccs-btn-join"
            onClick={() => joinOrRequestClub(club.id)}
          >
            <UserPlus size={14} />
            <span>{membership === 'rejected' ? 'Request again' : 'Request to join'}</span>
          </button>
        )}

        {membership === 'pending' && (
          <button
            type="button"
            className="ccs-btn ccs-btn-pending"
            onClick={() => leaveOrCancelClub(club.id)}
            title="Cancel your pending membership request"
          >
            <Clock size={13} />
            <span>Cancel request</span>
          </button>
        )}

        {membership === 'approved' && (
          <button type="button" className="ccs-btn ccs-btn-join" onClick={openClub}>
            <span>Open club</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </article>
  );
};
