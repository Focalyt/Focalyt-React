import React, { useState } from 'react';
import { Copy, Edit3, Plus, X } from 'lucide-react';
import { useClub } from '../../../../contexts/ClubContext';
import { Can } from '../Components/cms/Can';
import { usePermission } from '../hooks/usePermission';
import { ClubVenuePicker } from '../Components/ClubVenuePicker';
import { CertificateTemplatePicker } from '../Components/CertificateTemplatePicker';
import { staffManageableClubs } from '../../../../services/club/clubLiveState';
import {
  DEFAULT_CERTIFICATE_TEMPLATE_ID,
  getCertificateTemplate,
} from '../../../../config/club/certificateTemplates';

const MODES = ['In-Person', 'Online', 'Hybrid'];
const ATTENDANCE_OPTIONS = ['Pending', 'Present', 'Absent'];
const today = () => new Date().toISOString().slice(0, 10);

const to12Hour = (value) => {
  if (!value) return '';
  const [hourStr, minuteStr] = String(value).split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour)) return String(value);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = ((hour + 11) % 12) + 1;
  return `${displayHour}:${String(Number.isNaN(minute) ? 0 : minute).padStart(2, '0')} ${ampm}`;
};

const formatTimeRange = (start, end) => {
  if (!start) return '';
  const from = to12Hour(start);
  return end ? `${from} – ${to12Hour(end)}` : from;
};

const parseClock = (part) => {
  const text = String(part || '').trim();
  const match24 = text.match(/^(\d{2}):(\d{2})$/);
  if (match24) return text;
  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return '';
  let hour = Number(match[1]);
  const minute = match[2];
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minute}`;
};

const parseTimeRange = (value) => {
  const text = String(value || '').trim();
  if (!text) return { start: '', end: '' };
  const parts = text.split(/\s*[–-]\s*/);
  return { start: parseClock(parts[0]), end: parseClock(parts[1]) };
};

const splitVenueAndLink = (modeValue, locationValue) => {
  const text = String(locationValue || '').trim();
  if (modeValue === 'Online') return { venue: '', meetingLink: text };
  if (modeValue === 'Hybrid') {
    const [venue, ...rest] = text.split(' | ');
    return { venue: venue || '', meetingLink: rest.join(' | ') };
  }
  return { venue: text, meetingLink: '' };
};

const joinVenueAndLink = (modeValue, venue, meetingLink) => {
  const place = String(venue || '').trim();
  const link = String(meetingLink || '').trim();
  if (modeValue === 'Online') return link;
  if (modeValue === 'Hybrid') return [place, link].filter(Boolean).join(' | ');
  return place;
};

const nextActivityAction = (status, canFn) => {
  const key = String(status || '').toLowerCase();
  if (key === 'scheduled') return null;
  if (canFn('activities.recommend') && ['', 'draft', 'pending', 'requested'].includes(key)) {
    return { action: 'recommend', label: 'Recommend', permission: 'activities.recommend' };
  }
  if (canFn('activities.request') && (key === 'draft' || key === 'pending')) {
    return { action: 'request', label: 'Request', permission: 'activities.request' };
  }
  return null;
};

const isActivityLive = (status) => String(status || '').toLowerCase() === 'scheduled';

export const AdminActivitiesPage = () => {
  const { state, upsertActivity, markAttendance, generateCertificate, workflowActivity } = useClub();
  const { can } = usePermission();
  const manageableClubs = staffManageableClubs(state.clubs);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [attendanceModalActId, setAttendanceModalActId] = useState(null);
  const [editingActivityId, setEditingActivityId] = useState(undefined);

  const [title, setTitle] = useState('');
  const [clubId, setClubId] = useState(manageableClubs[0]?.id || '');
  const [inChargeId, setInChargeId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [venueLat, setVenueLat] = useState(null);
  const [venueLng, setVenueLng] = useState(null);
  const [venuePlaceId, setVenuePlaceId] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [mode, setMode] = useState('In-Person');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('40');
  const [certificateTemplateId, setCertificateTemplateId] = useState(DEFAULT_CERTIFICATE_TEMPLATE_ID);
  const [errors, setErrors] = useState({});
  const [formMode, setFormMode] = useState('create');

  const needsVenue = mode === 'In-Person' || mode === 'Hybrid';
  const needsLink = mode === 'Online' || mode === 'Hybrid';

  const fillActivityForm = (act, { asCopy = false } = {}) => {
    const times = parseTimeRange(act?.time);
    const place = splitVenueAndLink(act?.mode || 'In-Person', act?.location);
    setTitle(act?.title || '');
    setClubId(act?.clubId || manageableClubs[0]?.id || '');
    setInChargeId(act?.inChargeId || '');
    setDate(act?.startDate || act?.date || today());
    setStartTime(times.start);
    setEndTime(times.end);
    setVenue(place.venue);
    setVenueLat(act?.latitude != null ? Number(act.latitude) : null);
    setVenueLng(act?.longitude != null ? Number(act.longitude) : null);
    setVenuePlaceId(act?.placeId || '');
    setMeetingLink(place.meetingLink);
    setMode(act?.mode || 'In-Person');
    setDescription(act?.description || act?.summary || '');
    setCapacity(String(act?.capacity || 40));
    setCertificateTemplateId(act?.certificateTemplateId || DEFAULT_CERTIFICATE_TEMPLATE_ID);
    setErrors({});
    setEditingActivityId(asCopy ? undefined : act?.id);
    setFormMode(asCopy ? 'copy' : act?.id ? 'edit' : 'create');
    setFormModalOpen(true);
  };

  const openAddActivity = () => {
    fillActivityForm(
      {
        title: '',
        clubId: manageableClubs[0]?.id || '',
        date: today(),
        startDate: today(),
        mode: 'In-Person',
        capacity: 40,
        certificateTemplateId: DEFAULT_CERTIFICATE_TEMPLATE_ID,
      },
      { asCopy: false }
    );
    setEditingActivityId(undefined);
    setFormMode('create');
    setStartTime('');
    setEndTime('');
    setVenue('');
    setVenueLat(null);
    setVenueLng(null);
    setVenuePlaceId('');
    setMeetingLink('');
    setInChargeId('');
    setDescription('');
  };

  const openEditActivity = (act) => {
    fillActivityForm(act);
  };

  const openCopyActivity = (act) => {
    const copiedTitle = String(act?.title || '').trim();
    fillActivityForm(
      {
        ...act,
        title: copiedTitle && !copiedTitle.toLowerCase().startsWith('copy of ')
          ? `Copy of ${copiedTitle}`
          : copiedTitle,
      },
      { asCopy: true }
    );
  };

  const toggleActivityLive = (act) => {
    workflowActivity(act.id, isActivityLive(act.scheduleStatus) ? 'unpublish' : 'schedule');
  };

  const handleSaveActivity = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = 'Title is required.';
    if (!clubId) nextErrors.clubId = 'Select a club.';
    if (!date.trim()) nextErrors.date = 'Date is required.';
    if (!startTime) nextErrors.startTime = 'Start time is required.';
    if (needsVenue && !venue.trim()) nextErrors.venue = 'Venue is required.';
    if (needsVenue && (!Number.isFinite(Number(venueLat)) || !Number.isFinite(Number(venueLng)))) {
      nextErrors.venue = 'Pick the venue on the map or use current location.';
    }
    if (needsLink && !meetingLink.trim()) nextErrors.meetingLink = 'Meeting link is required.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const existing = editingActivityId
      ? state.activities.find((item) => item.id === editingActivityId)
      : null;
    const details = description.trim();

    upsertActivity({
      id: editingActivityId,
      title: title.trim(),
      clubId,
      inChargeId,
      date: date.trim(),
      startDate: date.trim(),
      endDate: date.trim(),
      time: formatTimeRange(startTime, endTime),
      location: joinVenueAndLink(mode, venue, meetingLink),
      latitude: needsVenue ? Number(venueLat) : null,
      longitude: needsVenue ? Number(venueLng) : null,
      placeId: needsVenue ? venuePlaceId : '',
      mode,
      summary: details,
      description: details,
      featured: Boolean(existing?.featured),
      capacity: Math.max(1, parseInt(capacity, 10) || 40),
      tags: existing?.tags || [],
      certificateTemplateId,
    });

    setFormModalOpen(false);
  };

  const activeAttendanceActivity = attendanceModalActId
    ? state.activities.find((item) => item.id === attendanceModalActId) || null
    : null;

  return (
    <div className="club-list-page">
      <div className="club-list-page__header">
        <div>
          <h1>Activities</h1>
          <p>Create events, approve them live like jobs, copy, and set the certificate template.</p>
        </div>
        {can('activities.create') ? (
          <button type="button" className="fc-btn fc-btn-primary" onClick={openAddActivity}>
            <Plus size={16} /> Create activity
          </button>
        ) : can('activities.request') ? (
          <button type="button" className="fc-btn fc-btn-outline" onClick={openAddActivity}>
            <Plus size={16} /> Request activity
          </button>
        ) : null}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Club</th>
              <th>In-charge</th>
              <th>When</th>
              <th>Registered</th>
              <th>Live</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.activities.length === 0 ? (
              <tr>
                <td colSpan={7} className="club-list-page__empty">
                  No activities yet. Click Create activity to add one.
                </td>
              </tr>
            ) : (
              state.activities.map((act) => {
                const club = state.clubs.find((item) => item.id === act.clubId);
                const inCharge = state.people.find((item) => item.id === act.inChargeId);
                const registrations = act.registrations || [];
                const presentCount = registrations.filter((item) => item.attendance === 'Present').length;
                const nextAction = nextActivityAction(act.scheduleStatus, can);

                return (
                  <tr key={act.id}>
                    <td>
                      <div className="club-list-page__name">{act.title}</div>
                      <div className="club-list-page__meta">
                        {act.mode}
                        {act.scheduleStatus ? ` · ${act.scheduleStatus}` : ''}
                      </div>
                    </td>
                    <td>{club?.name || '—'}</td>
                    <td>{inCharge?.name || '—'}</td>
                    <td>
                      <div>{act.startDate || act.date || '—'}</div>
                      <div className="club-list-page__meta">
                        {[act.time, act.location].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </td>
                    <td>
                      {registrations.length}/{act.capacity || 0}
                      {presentCount > 0 ? (
                        <div className="club-list-page__meta">{presentCount} present</div>
                      ) : null}
                    </td>
                    <td>
                      {(can('activities.schedule') || can('activities.approveSchedule')) ? (
                        <label className="club-switch" title={isActivityLive(act.scheduleStatus) ? 'Live' : 'Off'}>
                          <input
                            type="checkbox"
                            checked={isActivityLive(act.scheduleStatus)}
                            onChange={() => toggleActivityLive(act)}
                            aria-label={`Set ${act.title} live`}
                          />
                          <span />
                        </label>
                      ) : (
                        <span className="club-list-page__meta">
                          {isActivityLive(act.scheduleStatus) ? 'Live' : act.scheduleStatus || 'Draft'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="club-list-page__actions">
                        <button
                          type="button"
                          className="club-link-btn"
                          onClick={() => setAttendanceModalActId(act.id)}
                        >
                          Registrations
                        </button>
                        <Can permission="activities.create">
                          <button
                            type="button"
                            className="club-icon-btn"
                            title="Copy"
                            aria-label={`Copy ${act.title}`}
                            onClick={() => openCopyActivity(act)}
                          >
                            <Copy size={14} />
                          </button>
                        </Can>
                        <Can permission="activities.edit">
                          <button
                            type="button"
                            className="club-icon-btn"
                            title="Edit"
                            aria-label={`Edit ${act.title}`}
                            onClick={() => openEditActivity(act)}
                          >
                            <Edit3 size={14} />
                          </button>
                        </Can>
                        {nextAction ? (
                          <Can permission={nextAction.permission}>
                            <button
                              type="button"
                              className="club-link-btn"
                              onClick={() => workflowActivity(act.id, nextAction.action)}
                            >
                              {nextAction.label}
                            </button>
                          </Can>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {activeAttendanceActivity && (
        <div
          className="fc-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-modal-title"
          onClick={() => setAttendanceModalActId(null)}
        >
          <div className="fc-modal-panel fc-modal-panel-lg" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-header">
              <div>
                <h2 id="attendance-modal-title" style={{ fontSize: '1.2rem' }}>
                  {activeAttendanceActivity.title} — Registrations
                </h2>
                <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  {[activeAttendanceActivity.date, activeAttendanceActivity.time].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button
                type="button"
                className="fc-btn fc-btn-ghost fc-btn-sm"
                onClick={() => setAttendanceModalActId(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="fc-modal-body">
              {(activeAttendanceActivity.registrations || []).length === 0 ? (
                <p className="club-list-page__empty">No students have registered yet.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Registered</th>
                        <th>Status</th>
                        <th>Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeAttendanceActivity.registrations.map((reg) => (
                        <tr key={reg.id}>
                          <td>
                            <div className="club-list-page__name">{reg.studentName}</div>
                            <div className="club-list-page__meta">{reg.studentEmail}</div>
                          </td>
                          <td>{reg.registeredAt || '—'}</td>
                          <td>{reg.attendance || 'Pending'}</td>
                          <td>
                            <div className="club-list-page__actions">
                              {ATTENDANCE_OPTIONS.map((statusOption) => (
                                <button
                                  key={statusOption}
                                  type="button"
                                  className={reg.attendance === statusOption ? 'club-link-btn' : 'club-icon-btn'}
                                  style={reg.attendance === statusOption ? undefined : { width: 'auto', padding: '0 8px' }}
                                  onClick={() =>
                                    markAttendance(activeAttendanceActivity.id, reg.id, statusOption)
                                  }
                                >
                                  {statusOption}
                                </button>
                              ))}
                              {reg.attendance === 'Present' && (
                                <Can permission="certificates.generate">
                                  <button
                                    type="button"
                                    className="club-link-btn"
                                    onClick={() =>
                                      generateCertificate({
                                        studentId: reg.studentId,
                                        studentName: reg.studentName,
                                        clubId: activeAttendanceActivity.clubId,
                                        activityId: activeAttendanceActivity.id,
                                        title: `Participation — ${activeAttendanceActivity.title}`,
                                        templateId:
                                          activeAttendanceActivity.certificateTemplateId ||
                                          DEFAULT_CERTIFICATE_TEMPLATE_ID,
                                      })
                                    }
                                  >
                                    Certificate
                                  </button>
                                </Can>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {formModalOpen && (
        <div
          className="fc-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-form-modal-title"
          onClick={() => setFormModalOpen(false)}
        >
          <div className="fc-modal-panel fc-modal-panel-lg" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-header">
              <h2 id="activity-form-modal-title" style={{ fontSize: '1.2rem' }}>
                {formMode === 'edit' ? 'Edit activity' : formMode === 'copy' ? 'Copy activity' : 'Create activity'}
              </h2>
              <button
                type="button"
                className="fc-btn fc-btn-ghost fc-btn-sm"
                onClick={() => setFormModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} noValidate>
              <div className="fc-modal-body">
                <div className="form-grid">
                  <div className="form-field full-width">
                    <label className="form-label" htmlFor="act-title">
                      Title *
                    </label>
                    <input
                      id="act-title"
                      type="text"
                      className="form-input"
                      placeholder="Independence Day rehearsal"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    {errors.title ? <span className="form-error">{errors.title}</span> : null}
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="act-club">
                      Club *
                    </label>
                    <select
                      id="act-club"
                      className="form-select"
                      value={clubId}
                      onChange={(e) => setClubId(e.target.value)}
                    >
                      <option value="">Select club</option>
                      {manageableClubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                    {errors.clubId ? <span className="form-error">{errors.clubId}</span> : null}
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="act-mode">
                      Mode *
                    </label>
                    <select
                      id="act-mode"
                      className="form-select"
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                    >
                      {MODES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="act-date">
                      Date *
                    </label>
                    <input
                      id="act-date"
                      type="date"
                      className="form-input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                    {errors.date ? <span className="form-error">{errors.date}</span> : null}
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="act-start-time">
                      Start time *
                    </label>
                    <input
                      id="act-start-time"
                      type="time"
                      className="form-input"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                    {errors.startTime ? <span className="form-error">{errors.startTime}</span> : null}
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="act-end-time">
                      End time
                    </label>
                    <input
                      id="act-end-time"
                      type="time"
                      className="form-input"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>

                  {needsVenue ? (
                    <div className="form-field full-width">
                      <label className="form-label" htmlFor="act-venue">
                        Venue *
                      </label>
                      <ClubVenuePicker
                        value={{
                          address: venue,
                          lat: venueLat,
                          lng: venueLng,
                          placeId: venuePlaceId,
                        }}
                        onChange={(next) => {
                          setVenue(next.address || '');
                          setVenueLat(next.lat);
                          setVenueLng(next.lng);
                          setVenuePlaceId(next.placeId || '');
                        }}
                        error={errors.venue}
                      />
                    </div>
                  ) : null}

                  {needsLink ? (
                    <div className={`form-field ${needsVenue ? '' : 'full-width'}`}>
                      <label className="form-label" htmlFor="act-link">
                        Meeting link *
                      </label>
                      <input
                        id="act-link"
                        type="text"
                        className="form-input"
                        placeholder="https://meet.google.com/..."
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                      />
                      {errors.meetingLink ? <span className="form-error">{errors.meetingLink}</span> : null}
                    </div>
                  ) : null}

                  <div className="form-field">
                    <label className="form-label" htmlFor="act-incharge">
                      In-charge
                    </label>
                    <select
                      id="act-incharge"
                      className="form-select"
                      value={inChargeId}
                      onChange={(e) => setInChargeId(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {state.people.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="act-cap">
                      Capacity
                    </label>
                    <input
                      id="act-cap"
                      type="number"
                      min={1}
                      className="form-input"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                    />
                  </div>

                  <div className="form-field full-width">
                    <label className="form-label" htmlFor="act-desc">
                      Description
                    </label>
                    <textarea
                      id="act-desc"
                      rows={3}
                      className="form-textarea"
                      placeholder="Agenda, what to bring, dress code"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="form-field full-width">
                    <label className="form-label">Certificate template</label>
                    <p className="club-list-page__meta" style={{ marginBottom: 8 }}>
                      Certificates issued from this activity use {getCertificateTemplate(certificateTemplateId).label}.
                    </p>
                    <CertificateTemplatePicker value={certificateTemplateId} onChange={setCertificateTemplateId} />
                  </div>
                </div>
              </div>
              <div className="fc-modal-footer">
                <button type="button" className="fc-btn fc-btn-outline fc-btn-sm" onClick={() => setFormModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm">
                  {formMode === 'edit' ? 'Save changes' : formMode === 'copy' ? 'Create copy' : 'Save activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivitiesPage;
