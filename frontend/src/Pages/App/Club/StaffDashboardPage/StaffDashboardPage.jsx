import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CalendarDays, Gift, UserPlus, Users, Wallet } from 'lucide-react';
import { Can } from '../Components/cms/Can';
import { ConfirmDialog } from '../Components/cms/ConfirmDialog';
import { StatusBadge } from '../Components/cms/StatusBadge';
import { useClub } from '../../../../contexts/ClubContext';
import { usePermission } from '../hooks/usePermission';
import { ROLE_LABELS, ROLES } from '../../../../config/club/roles';
import { staffManageableClubs } from '../../../../services/club/clubLiveState';

const OPEN_BUDGET_STATUSES = new Set(['requested', 'recommended']);
const QUEUE_LIMIT = 6;

const parseClubDate = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const isoDay = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDay) {
    return new Date(Number(isoDay[1]), Number(isoDay[2]) - 1, Number(isoDay[3]));
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatClubDate = (value) => {
  const parsed = parseClubDate(value);
  if (!parsed) return '—';
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatInr = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const statusKey = (value) => String(value || '').trim().toLowerCase();

const isJoinedMember = (status) => {
  const key = statusKey(status);
  return key === 'joined' || key === 'approved';
};

const isPendingMember = (status) => statusKey(status) === 'pending';

const isOpenBudget = (status) => OPEN_BUDGET_STATUSES.has(statusKey(status));

const isPendingPickup = (status) => statusKey(status) === 'pending';

const isToday = (value) => {
  const parsed = parseClubDate(value);
  if (!parsed) return false;
  const now = new Date();
  return (
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate()
  );
};

const initialsOf = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'CL';
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const greetingForNow = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const roleHomeCopy = (role) => {
  if (role === ROLES.SALES_ENGINEER) {
    return 'Requests and follow-ups waiting on you today.';
  }
  if (role === ROLES.SENIOR_SALES_ENGINEER) {
    return 'Reviews and recommends waiting on you today.';
  }
  return 'Joins, spend, and pickups for this campus.';
};

const nextBudgetAction = (status, can) => {
  const key = String(status || 'Draft');
  if ((key === 'Draft' || !status) && can('budgets.request')) {
    return { action: 'request', label: 'Request' };
  }
  if (key === 'Requested' && can('budgets.recommend')) {
    return { action: 'recommend', label: 'Recommend' };
  }
  if ((key === 'Recommended' || key === 'Requested') && can('budgets.approve')) {
    return { action: 'approve', label: 'Approve' };
  }
  return null;
};

const nextActivityAction = (status, can) => {
  const key = statusKey(status);
  if (key === 'scheduled') return null;
  if ((can('activities.schedule') || can('activities.approveSchedule')) && key !== 'rejected') {
    return { action: 'schedule', label: 'Go live' };
  }
  if (can('activities.recommend') && ['', 'draft', 'pending', 'requested'].includes(key)) {
    return { action: 'recommend', label: 'Recommend' };
  }
  if (can('activities.request') && (key === 'draft' || key === 'pending')) {
    return { action: 'request', label: 'Request' };
  }
  return null;
};

const QueuePanel = ({ title, count, to, empty, children }) => (
  <section className="club-dash-panel">
    <div className="club-dash-panel__head">
      <div className="club-dash-panel__title">
        <h2>{title}</h2>
        {count > 0 ? <span className="club-dash-chip">{count}</span> : null}
      </div>
      {to ? (
        <Link className="club-dash-more" to={to}>
          {count > QUEUE_LIMIT ? `View all ${count}` : 'View all'}
        </Link>
      ) : null}
    </div>
    {count === 0 ? <p className="club-dash-empty">{empty}</p> : <div className="club-dash-rows">{children}</div>}
  </section>
);

const QueueRow = ({ name, meta, status, children }) => (
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

export const StaffDashboardPage = () => {
  const {
    state,
    getClubPath,
    assignedColleges,
    activeRole,
    reviewClubMemberRequest,
    workflowBudget,
    reviewRedemption,
    reviewPositionRequest,
    workflowActivity,
  } = useClub();
  const { can } = usePermission();
  const [confirmAction, setConfirmAction] = useState(null);

  const campusName = assignedColleges?.[0]?.name || '';
  const manageableIds = useMemo(
    () => new Set(staffManageableClubs(state.clubs).map((club) => String(club.id))),
    [state.clubs]
  );
  const canManageClub = (clubId) => !manageableIds.size || manageableIds.has(String(clubId));
  const clubName = (clubId) => state.clubs.find((club) => String(club.id) === String(clubId))?.name || '—';
  const positionTitle = (positionId) =>
    state.positions.find((position) => String(position.id) === String(positionId))?.title || 'Position';

  const pendingMembers = useMemo(
    () =>
      state.clubs.flatMap((club) =>
        (club.members || [])
          .filter((member) => isPendingMember(member.status))
          .map((member) => ({
            ...member,
            clubName: club.name,
            clubId: club.id,
          }))
      ),
    [state.clubs]
  );

  const joinedMembers = state.clubs.reduce(
    (sum, club) => sum + (club.members || []).filter((member) => isJoinedMember(member.status)).length,
    0
  );

  const openBudgets = useMemo(
    () => (state.budgets || []).filter((budget) => isOpenBudget(budget.status)),
    [state.budgets]
  );
  const pendingPickups = useMemo(
    () => (state.redemptions || []).filter((item) => isPendingPickup(item.status)),
    [state.redemptions]
  );
  const openPositionRequests = useMemo(
    () =>
      (state.positionRequests || []).filter((request) =>
        ['pending', 'recommended'].includes(statusKey(request.status))
      ),
    [state.positionRequests]
  );
  const todaysActivities = useMemo(
    () => (state.activities || []).filter((activity) => isToday(activity.startDate || activity.date)),
    [state.activities]
  );
  const waitingActivities = (state.activities || [])
    .map((activity) => ({ activity, next: nextActivityAction(activity.scheduleStatus, can) }))
    .filter((row) => row.next);

  const needsJoinAction = can('members.approve') || can('members.reject');
  const needsBudgetAction = openBudgets.filter((budget) => nextBudgetAction(budget.status, can)).length;
  const needsPickupAction = can('rewards.process') ? pendingPickups.length : 0;
  const needsPositionAction = openPositionRequests.filter((request) => {
    const key = statusKey(request.status);
    if (key === 'pending' && (can('positions.recommend') || can('positions.assign'))) return true;
    if (key === 'recommended' && can('positions.assign')) return true;
    return false;
  }).length;
  const needsYourAction =
    (needsJoinAction ? pendingMembers.length : 0) +
    needsBudgetAction +
    needsPickupAction +
    needsPositionAction +
    waitingActivities.length;

  const runConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'reject-join') {
      reviewClubMemberRequest(confirmAction.clubId, confirmAction.memberId, 'reject');
    }
    if (confirmAction.type === 'reject-pickup') {
      reviewRedemption(confirmAction.id, 'reject');
    }
    setConfirmAction(null);
  };

  const stats = [
    { label: 'Clubs', value: state.clubs.length, hint: 'On this campus', to: 'clubs', icon: Building2 },
    { label: 'Members', value: joinedMembers, hint: 'Joined / approved', to: 'members', icon: Users },
    {
      label: 'Waiting on you',
      value: needsYourAction,
      hint: needsYourAction ? 'Needs a decision' : 'All clear',
      to: 'members',
      icon: UserPlus,
      alert: needsYourAction > 0,
    },
    {
      label: "Today's events",
      value: todaysActivities.length,
      hint: formatClubDate(new Date()),
      to: 'activities',
      icon: CalendarDays,
    },
  ];

  return (
    <div className="club-dash">
      <header className="club-dash-hero">
        <div>
          <p className="club-dash-hero__eyebrow">
            {greetingForNow()}
            {campusName ? ` · ${campusName}` : ''}
          </p>
          <h1>{ROLE_LABELS[activeRole] || 'Club staff'}</h1>
          <p className="club-dash-hero__sub">{roleHomeCopy(activeRole)}</p>
        </div>
        <div className="club-dash-hero__actions">
          {can('members.view') && (
            <Link className="fc-btn fc-btn-outline fc-btn-sm" to={getClubPath('members')}>
              Members
            </Link>
          )}
          {can('clubs.view') && (
            <Link className="fc-btn fc-btn-primary fc-btn-sm" to={getClubPath('clubs')}>
              Manage clubs
            </Link>
          )}
        </div>
      </header>

      <div className="club-dash-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              className={`club-dash-stat ${stat.alert ? 'is-alert' : ''}`}
              to={getClubPath(stat.to)}
            >
              <span className="club-dash-stat__icon">
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <strong>{stat.value}</strong>
              <span className="club-dash-stat__label">{stat.label}</span>
              <span className="club-dash-stat__hint">{stat.hint}</span>
            </Link>
          );
        })}
      </div>

      <div className="club-dash-grid">
        <div className="club-dash-main">
          <QueuePanel
            title="Join requests"
            count={pendingMembers.length}
            to={getClubPath('members')}
            empty="No students waiting to join."
          >
            {pendingMembers.slice(0, QUEUE_LIMIT).map((member) => (
              <QueueRow
                key={`${member.clubId}-${member.id}`}
                name={member.studentName}
                meta={`${member.clubName} · ${formatClubDate(member.requestedAt)}`}
              >
                {!canManageClub(member.clubId) ? (
                  <span className="club-dash-muted">View only</span>
                ) : can('members.approve') || can('members.reject') ? (
                  <>
                    <Can permission="members.approve">
                      <button
                        type="button"
                        className="fc-btn fc-btn-primary fc-btn-sm"
                        onClick={() => reviewClubMemberRequest(member.clubId, member.id, 'approve')}
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
                            type: 'reject-join',
                            clubId: member.clubId,
                            memberId: member.id,
                            title: 'Reject join request?',
                            body: `${member.studentName || 'This student'} will stay on the roster as rejected.`,
                            confirmLabel: 'Reject request',
                          })
                        }
                      >
                        Reject
                      </button>
                    </Can>
                  </>
                ) : (
                  <span className="club-dash-muted">Waiting</span>
                )}
              </QueueRow>
            ))}
          </QueuePanel>

          {openBudgets.length > 0 && (
            <QueuePanel title="Open budgets" count={openBudgets.length} to={getClubPath('budgets')}>
              {openBudgets.slice(0, QUEUE_LIMIT).map((budget) => {
                const next = nextBudgetAction(budget.status, can);
                return (
                  <QueueRow
                    key={budget.id}
                    name={budget.title}
                    meta={`${clubName(budget.clubId)} · ${formatInr(budget.amount)}`}
                    status={<StatusBadge status={budget.status} />}
                  >
                    {next && canManageClub(budget.clubId) ? (
                      <button
                        type="button"
                        className="fc-btn fc-btn-primary fc-btn-sm"
                        onClick={() => workflowBudget(budget.id, next.action)}
                      >
                        {next.label}
                      </button>
                    ) : (
                      <span className="club-dash-muted">Waiting</span>
                    )}
                  </QueueRow>
                );
              })}
            </QueuePanel>
          )}

          {pendingPickups.length > 0 && (
            <QueuePanel title="Gift pickups" count={pendingPickups.length} to={getClubPath('rewards')}>
              {pendingPickups.slice(0, QUEUE_LIMIT).map((item) => (
                <QueueRow
                  key={item.id}
                  name={item.studentName}
                  meta={`${item.goodieName || 'Gift'} · ${item.points || 0} pts · ${formatClubDate(item.requestedAt)}`}
                >
                  <Can permission="rewards.process" fallback={<span className="club-dash-muted">Waiting</span>}>
                    <>
                      <button
                        type="button"
                        className="fc-btn fc-btn-primary fc-btn-sm"
                        onClick={() => reviewRedemption(item.id, 'approve')}
                      >
                        Give gift
                      </button>
                      <button
                        type="button"
                        className="fc-btn fc-btn-outline fc-btn-sm"
                        onClick={() =>
                          setConfirmAction({
                            type: 'reject-pickup',
                            id: item.id,
                            title: 'Reject gift pickup?',
                            body: `${item.studentName || 'This student'} will not receive ${item.goodieName || 'this gift'}.`,
                            confirmLabel: 'Reject pickup',
                          })
                        }
                      >
                        Reject
                      </button>
                    </>
                  </Can>
                </QueueRow>
              ))}
            </QueuePanel>
          )}

          {openPositionRequests.length > 0 && (
            <QueuePanel
              title="Position requests"
              count={openPositionRequests.length}
              to={getClubPath('positions')}
            >
              {openPositionRequests.slice(0, QUEUE_LIMIT).map((request) => (
                <QueueRow
                  key={request.id}
                  name={request.studentName}
                  meta={positionTitle(request.positionId)}
                  status={<StatusBadge status={request.status} />}
                >
                  {statusKey(request.status) === 'pending' && (
                    <Can permission="positions.recommend">
                      <button
                        type="button"
                        className="fc-btn fc-btn-outline fc-btn-sm"
                        onClick={() => reviewPositionRequest(request.id, 'recommend')}
                      >
                        Recommend
                      </button>
                    </Can>
                  )}
                  <Can permission="positions.assign">
                    <button
                      type="button"
                      className="fc-btn fc-btn-primary fc-btn-sm"
                      onClick={() => reviewPositionRequest(request.id, 'approve')}
                    >
                      Assign
                    </button>
                  </Can>
                  <Can permission="positions.assign">
                    <button
                      type="button"
                      className="fc-btn fc-btn-outline fc-btn-sm"
                      onClick={() => reviewPositionRequest(request.id, 'reject')}
                    >
                      Reject
                    </button>
                  </Can>
                </QueueRow>
              ))}
            </QueuePanel>
          )}
        </div>

        <aside className="club-dash-side">
          <section className="club-dash-panel">
            <div className="club-dash-panel__head">
              <div className="club-dash-panel__title">
                <h2>Today</h2>
                {todaysActivities.length > 0 ? (
                  <span className="club-dash-chip">{todaysActivities.length}</span>
                ) : null}
              </div>
              <Link className="club-dash-more" to={getClubPath('activities')}>
                Calendar
              </Link>
            </div>
            {todaysActivities.length === 0 ? (
              <p className="club-dash-empty">No events on today.</p>
            ) : (
              <div className="club-dash-rows">
                {todaysActivities.slice(0, QUEUE_LIMIT).map((activity) => (
                  <div className="club-dash-event" key={activity.id}>
                    <span className="club-dash-event__time">{activity.time || 'TBD'}</span>
                    <div>
                      <strong>{activity.title}</strong>
                      <span>
                        {clubName(activity.clubId)}
                        {activity.location ? ` · ${activity.location}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {waitingActivities.length > 0 && (
            <QueuePanel
              title="Schedules"
              count={waitingActivities.length}
              to={getClubPath('activities')}
            >
              {waitingActivities.slice(0, QUEUE_LIMIT).map(({ activity, next }) => (
                <QueueRow
                  key={activity.id}
                  name={activity.title}
                  meta={clubName(activity.clubId)}
                  status={<StatusBadge status={activity.scheduleStatus || 'Draft'} />}
                >
                  <button
                    type="button"
                    className="fc-btn fc-btn-primary fc-btn-sm"
                    onClick={() => workflowActivity(activity.id, next.action)}
                  >
                    {next.label}
                  </button>
                </QueueRow>
              ))}
            </QueuePanel>
          )}

          <section className="club-dash-panel club-dash-panel--quiet">
            <div className="club-dash-quiet">
              <Wallet size={16} strokeWidth={2.2} />
              <div>
                <strong>{openBudgets.length} open budgets</strong>
                <span>Requested or recommended only.</span>
              </div>
              <Link className="club-dash-more" to={getClubPath('budgets')}>
                Open
              </Link>
            </div>
            <div className="club-dash-quiet">
              <Gift size={16} strokeWidth={2.2} />
              <div>
                <strong>{pendingPickups.length} gift pickups</strong>
                <span>Students waiting at the counter.</span>
              </div>
              <Link className="club-dash-more" to={getClubPath('rewards')}>
                Open
              </Link>
            </div>
          </section>
        </aside>
      </div>

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

export default StaffDashboardPage;
