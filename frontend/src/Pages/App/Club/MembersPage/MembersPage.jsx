import React, { useMemo, useState } from 'react';
import { UserPlus, Users, UserX } from 'lucide-react';
import { Can } from '../Components/cms/Can';
import { ConfirmDialog } from '../Components/cms/ConfirmDialog';
import { StatusBadge } from '../Components/cms/StatusBadge';
import { useClub } from '../../../../contexts/ClubContext';
import { usePermission } from '../hooks/usePermission';
import { isApprovedMemberStatus } from '../../../../config/club/membership';
import { staffManageableClubs } from '../../../../services/club/clubLiveState';

const parseClubDate = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const isoDay = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDay) return new Date(Number(isoDay[1]), Number(isoDay[2]) - 1, Number(isoDay[3]));
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatClubDate = (value) => {
  const parsed = parseClubDate(value);
  if (!parsed) return '—';
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusKey = (value) => String(value || '').trim().toLowerCase();

const initialsOf = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'ST';
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const MemberRow = ({ name, meta, status, children }) => (
  <div className="club-dash-row">
    <span className="club-dash-avatar" aria-hidden="true">
      {initialsOf(name)}
    </span>
    <div className="club-dash-row__body">
      <strong>{name || '—'}</strong>
      <span>{meta}</span>
    </div>
    {status ? <div className="club-dash-row__status">{status}</div> : null}
    <div className="club-dash-row__actions">{children}</div>
  </div>
);

export const MembersPage = () => {
  const { state, setMemberStatus, reviewClubMemberRequest } = useClub();
  const { can } = usePermission();
  const [filterClubId, setFilterClubId] = useState('');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('requests');
  const [confirmAction, setConfirmAction] = useState(null);

  const manageableClubs = useMemo(() => staffManageableClubs(state.clubs), [state.clubs]);

  const allRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Club Admins only see membership for clubs they own/coordinate.
    return manageableClubs.flatMap((club) =>
      (club.members || [])
        .filter((member) => !filterClubId || club.id === filterClubId)
        .filter(
          (member) =>
            !q ||
            (member.studentName || '').toLowerCase().includes(q) ||
            (member.studentEmail || '').toLowerCase().includes(q) ||
            (member.department || '').toLowerCase().includes(q)
        )
        .map((member) => ({
          ...member,
          clubName: club.name,
          clubId: club.id,
          canManage: club.canManage !== false,
        }))
    );
  }, [manageableClubs, filterClubId, query]);

  const requests = allRows.filter((row) => statusKey(row.status) === 'pending');
  const members = allRows.filter((row) => isApprovedMemberStatus(row.status));
  const closed = allRows.filter((row) => ['rejected', 'blocked'].includes(statusKey(row.status)));

  const visibleRows = tab === 'members' ? members : tab === 'closed' ? closed : requests;

  const runConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'reject') {
      reviewClubMemberRequest(confirmAction.clubId, confirmAction.memberId, 'reject');
    }
    if (confirmAction.type === 'block') {
      setMemberStatus(confirmAction.clubId, confirmAction.memberId, 'blocked');
    }
    setConfirmAction(null);
  };

  const emptyCopy = {
    requests: filterClubId || query ? 'No pending requests match this search.' : 'No students are waiting to join.',
    members: filterClubId || query ? 'No members match this search.' : 'No approved members yet.',
    closed: filterClubId || query ? 'No rejected or blocked people match this search.' : 'No rejected or blocked members.',
  };

  const rowMeta = (row) => {
    const date = formatClubDate(row.requestedAt || row.joinedAt);
    const dept = row.department && row.department !== 'Campus Student' ? ` · ${row.department}` : '';
    if (statusKey(row.status) === 'pending') return `${row.clubName} · Requested ${date}${dept}`;
    if (statusKey(row.status) === 'blocked') return `${row.clubName} · Blocked${dept}`;
    if (statusKey(row.status) === 'rejected') return `${row.clubName} · Rejected ${date}${dept}`;
    return `${row.clubName}${row.joinedAt ? ` · Joined ${formatClubDate(row.joinedAt)}` : ''}${dept}`;
  };

  const actionsFor = (row) => {
    if (row.canManage === false) return <span className="club-dash-muted">View only</span>;
    const key = statusKey(row.status);
    if (key === 'pending') {
      return (
        <>
          <Can permission="members.approve">
            <button
              type="button"
              className="fc-btn fc-btn-primary fc-btn-sm"
              onClick={() => reviewClubMemberRequest(row.clubId, row.id, 'approve')}
            >
              Approve
            </button>
          </Can>
          <Can permission="members.reject">
            <button
              type="button"
              className="fc-btn fc-btn-outline fc-btn-sm"
              onClick={() =>
                setConfirmAction({
                  type: 'reject',
                  clubId: row.clubId,
                  memberId: row.id,
                  title: 'Reject join request?',
                  body: `${row.studentName || 'This student'} will not be added to ${row.clubName}.`,
                  confirmLabel: 'Reject request',
                })
              }
            >
              Reject
            </button>
          </Can>
          {!can('members.approve') && !can('members.reject') ? (
            <span className="club-dash-muted">Waiting</span>
          ) : null}
        </>
      );
    }
    if (key === 'rejected') {
      return (
        <Can permission="members.approve">
          <button
            type="button"
            className="fc-btn fc-btn-primary fc-btn-sm"
            onClick={() => reviewClubMemberRequest(row.clubId, row.id, 'approve')}
          >
            Approve
          </button>
        </Can>
      );
    }
    if (key === 'blocked') {
      return (
        <Can permission="members.block">
          <button
            type="button"
            className="fc-btn fc-btn-outline fc-btn-sm"
            onClick={() => setMemberStatus(row.clubId, row.id, 'approved')}
          >
            Unblock
          </button>
        </Can>
      );
    }
    return (
      <Can permission="members.block">
        <button
          type="button"
          className="fc-btn fc-btn-outline fc-btn-sm"
          onClick={() =>
            setConfirmAction({
              type: 'block',
              clubId: row.clubId,
              memberId: row.id,
              title: 'Block this member?',
              body: `${row.studentName || 'This student'} will lose access to ${row.clubName} until someone unblocks them.`,
              confirmLabel: 'Block member',
            })
          }
        >
          Block
        </button>
      </Can>
    );
  };

  const tabs = [
    { id: 'requests', label: 'Join requests', count: requests.length },
    { id: 'members', label: 'Members', count: members.length },
    { id: 'closed', label: 'Rejected / blocked', count: closed.length },
  ];

  return (
    <div className="club-dash">
      <header className="club-dash-hero">
        <div>
          <p className="club-dash-hero__eyebrow">Club roster</p>
          <h1>Members & requests</h1>
          <p className="club-dash-hero__sub">
            Students request to join. Approve them here. Block only if they should lose access.
          </p>
        </div>
      </header>

      <div className="club-dash-stats">
        <button type="button" className={`club-dash-stat ${tab === 'requests' ? 'is-alert' : ''}`} onClick={() => setTab('requests')}>
          <span className="club-dash-stat__icon">
            <UserPlus size={16} strokeWidth={2.2} />
          </span>
          <strong>{requests.length}</strong>
          <span className="club-dash-stat__label">Join requests</span>
          <span className="club-dash-stat__hint">{requests.length ? 'Waiting for a decision' : 'Inbox is clear'}</span>
        </button>
        <button type="button" className={`club-dash-stat ${tab === 'members' ? 'is-alert' : ''}`} onClick={() => setTab('members')}>
          <span className="club-dash-stat__icon">
            <Users size={16} strokeWidth={2.2} />
          </span>
          <strong>{members.length}</strong>
          <span className="club-dash-stat__label">Members</span>
          <span className="club-dash-stat__hint">Approved on this campus</span>
        </button>
        <button type="button" className={`club-dash-stat ${tab === 'closed' ? 'is-alert' : ''}`} onClick={() => setTab('closed')}>
          <span className="club-dash-stat__icon">
            <UserX size={16} strokeWidth={2.2} />
          </span>
          <strong>{closed.length}</strong>
          <span className="club-dash-stat__label">Rejected / blocked</span>
          <span className="club-dash-stat__hint">Not active in a club</span>
        </button>
      </div>

      <div className="club-dash-toolbar">
        <div className="club-dash-tabs" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`club-dash-tab ${tab === item.id ? 'is-on' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              <span>{item.count}</span>
            </button>
          ))}
        </div>
        <div className="club-dash-filters">
          <input
            type="search"
            className="club-list-page__search"
            placeholder="Search name, email, or department"
            aria-label="Search members"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="club-list-page__select"
            value={filterClubId}
            onChange={(e) => setFilterClubId(e.target.value)}
            aria-label="Filter by club"
          >
            <option value="">All clubs you manage</option>
            {manageableClubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="club-dash-panel">
        <div className="club-dash-panel__head">
          <div className="club-dash-panel__title">
            <h2>{tabs.find((item) => item.id === tab)?.label}</h2>
            {visibleRows.length > 0 ? <span className="club-dash-chip">{visibleRows.length}</span> : null}
          </div>
        </div>
        {visibleRows.length === 0 ? (
          <p className="club-dash-empty">{emptyCopy[tab]}</p>
        ) : (
          <div className="club-dash-rows">
            {visibleRows.map((row) => (
              <MemberRow
                key={`${row.clubId}-${row.id}`}
                name={row.studentName}
                meta={rowMeta(row)}
                status={<StatusBadge status={row.status} />}
              >
                {actionsFor(row)}
              </MemberRow>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        body={confirmAction?.body}
        confirmLabel={confirmAction?.confirmLabel}
        onConfirm={runConfirm}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default MembersPage;
