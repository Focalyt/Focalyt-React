import React, { useEffect, useMemo, useState } from 'react';
import { Check, Edit3, Plus, X, XCircle, Trash2 } from 'lucide-react';
import { useClub } from '../../../../contexts/ClubContext';
import { Can } from '../Components/cms/Can';
import { CLUB_THEME_TEMPLATES, getClubTheme } from '../../../../config/club/clubThemes';
import { ConfirmDialog } from '../Components/cms/ConfirmDialog';
import { StatusBadge } from '../Components/cms/StatusBadge';
import { clubCmsApi } from '../../../../services/club/clubCmsApi';

const CATEGORIES = [
  'Creative',
  'Sports & Games',
  'Social & Impact',
  'Tech & Makers',
];

export const AdminClubsPage = () => {
  const {
    state,
    mode,
    assignedColleges,
    upsertClub,
    deleteClub,
    reviewClubMemberRequest,
    setMemberStatus,
  } = useClub();
  const isLiveClubAdmin = mode === 'club_admin' || mode === 'admin' || mode === 'company';
  const assignedInstitutions = isLiveClubAdmin
    ? state.institutions.filter((inst) =>
        (assignedColleges || []).some((college) => String(college._id || college.id) === inst.id)
      )
    : state.institutions;
  const campusOptions = assignedInstitutions.length ? assignedInstitutions : state.institutions;

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [membersModalClubId, setMembersModalClubId] = useState(null);
  const [editingClubId, setEditingClubId] = useState(undefined);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Creative');
  const [institutionId, setInstitutionId] = useState('');
  const [verticalId, setVerticalId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [centerId, setCenterId] = useState('');
  const [verticals, setVerticals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [centers, setCenters] = useState([]);
  const [placementLoading, setPlacementLoading] = useState(false);
  const [coordinatorId, setCoordinatorId] = useState('');
  const [featured, setFeatured] = useState(false);
  const [theme, setTheme] = useState(CLUB_THEME_TEMPLATES[0].id);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);

  const selectedCenter = useMemo(
    () => centers.find((center) => String(center._id) === String(centerId)),
    [centerId, centers]
  );
  const selectedTheme = getClubTheme(theme);
  const selectedCollegeId = String(
    selectedCenter?.college?._id || selectedCenter?.college || institutionId || campusOptions[0]?.id || ''
  );

  const coordinatorOptions = useMemo(() => {
    const staff = (state.people || []).filter((person) => person.role !== 'Student Member');
    const campusPeople = staff.filter((person) => person.institutionId === selectedCollegeId);
    return campusPeople.length ? campusPeople : staff;
  }, [selectedCollegeId, state.people]);

  useEffect(() => {
    if (!formModalOpen || !isLiveClubAdmin) return undefined;
    let cancelled = false;
    setPlacementLoading(true);
    clubCmsApi
      .listPlacementVerticals()
      .then((res) => {
        if (cancelled) return;
        setVerticals(res?.data || []);
      })
      .catch(() => {
        if (!cancelled) setVerticals([]);
      })
      .finally(() => {
        if (!cancelled) setPlacementLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formModalOpen, isLiveClubAdmin]);

  useEffect(() => {
    if (!formModalOpen || !isLiveClubAdmin || !verticalId) {
      setProjects([]);
      return undefined;
    }
    let cancelled = false;
    clubCmsApi
      .listPlacementProjects(verticalId)
      .then((res) => {
        if (cancelled) return;
        setProjects(res?.data || []);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [formModalOpen, isLiveClubAdmin, verticalId]);

  useEffect(() => {
    if (!formModalOpen || !isLiveClubAdmin || !projectId) {
      setCenters([]);
      return undefined;
    }
    let cancelled = false;
    clubCmsApi
      .listPlacementCenters(projectId)
      .then((res) => {
        if (cancelled) return;
        setCenters(res?.data || []);
      })
      .catch(() => {
        if (!cancelled) setCenters([]);
      });
    return () => {
      cancelled = true;
    };
  }, [formModalOpen, isLiveClubAdmin, projectId]);

  const resetPlacement = () => {
    setVerticalId('');
    setProjectId('');
    setCenterId('');
    setVerticals([]);
    setProjects([]);
    setCenters([]);
  };

  const openAddClub = () => {
    setEditingClubId(undefined);
    setName('');
    setDescription('');
    setCategory('Creative');
    setInstitutionId(campusOptions[0]?.id || '');
    resetPlacement();
    setCoordinatorId(state.people[0]?.id || '');
    setFeatured(false);
    setTheme(CLUB_THEME_TEMPLATES[0].id);
    setThemePickerOpen(false);
    setErrors({});
    setFormModalOpen(true);
  };

  const openEditClub = (club) => {
    setEditingClubId(club.id);
    setName(club.name);
    setDescription(club.description);
    setCategory(club.category);
    setInstitutionId(club.institutionId);
    setVerticalId(club.verticalId || '');
    setProjectId(club.projectId || '');
    setCenterId(club.centerId || '');
    setCoordinatorId(club.coordinatorId);
    setFeatured(club.featured);
    setTheme(club.theme || CLUB_THEME_TEMPLATES[0].id);
    setThemePickerOpen(false);
    setErrors({});
    setFormModalOpen(true);
  };

  const handleSaveClub = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = 'Club name is required.';
    if (!category.trim()) nextErrors.category = 'Type is required.';
    if (isLiveClubAdmin) {
      if (!verticalId) nextErrors.verticalId = 'Select a department.';
      if (!projectId) nextErrors.projectId = 'Select a project.';
      if (!centerId) nextErrors.centerId = 'Select a centre.';
    } else if (!institutionId) {
      nextErrors.institutionId = 'Select a campus.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const selectedVertical = verticals.find((row) => String(row._id) === String(verticalId));
    const selectedProject = projects.find((row) => String(row._id) === String(projectId));

    upsertClub({
      id: editingClubId,
      name: name.trim(),
      description: description.trim(),
      category,
      clubType: category,
      theme: theme || CLUB_THEME_TEMPLATES[0].id,
      institutionId: selectedCollegeId,
      collegeId: selectedCollegeId,
      verticalId,
      projectId,
      centerId,
      departmentName: selectedVertical?.name || '',
      projectName: selectedProject?.name || '',
      centerName: selectedCenter?.name || '',
      coordinatorId,
      joiningMethod: 'Approval Required',
      interests: [category],
      featured,
    });

    setFormModalOpen(false);
  };

  const activeMembersModalClub = membersModalClubId
    ? state.clubs.find((c) => c.id === membersModalClubId) || null
    : null;

  return (
    <div className="club-list-page">
      <div className="club-list-page__header">
        <div>
          <h1>Clubs</h1>
          <p>Create clubs for a department, project, and centre.</p>
        </div>
        <Can permission="clubs.create">
          <button type="button" className="fc-btn fc-btn-primary" onClick={openAddClub}>
            <Plus size={16} /> Create Club
          </button>
        </Can>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Club</th>
              <th>Centre</th>
              <th>Coordinator</th>
              <th>Members</th>
              <th>Pending</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.clubs.length === 0 ? (
              <tr>
                <td colSpan={6} className="club-list-page__empty">
                  No clubs yet. Click Create Club to add one.
                </td>
              </tr>
            ) : (
              state.clubs.map((club) => {
                const inst = state.institutions.find((i) => i.id === club.institutionId);
                const coord = state.people.find((p) => p.id === club.coordinatorId);
                const members = club.members || [];
                const joinedCount = members.filter(
                  (m) => m.status === 'joined' || m.status === 'approved'
                ).length;
                const pendingCount = members.filter((m) => m.status === 'pending').length;
                const canManageClub = club.canManage !== false;

                return (
                  <tr key={club.id}>
                    <td>
                      <div className="club-list-page__name">{club.name}</div>
                      <div className="club-list-page__meta">
                        {club.category}
                        {!canManageClub ? ' · Other campus' : ''}
                      </div>
                    </td>
                    <td>
                      {club.centerName || inst?.name || '—'}
                      {club.projectName ? (
                        <div className="club-list-page__meta">{club.projectName}</div>
                      ) : null}
                    </td>
                    <td>{coord?.name || 'Unassigned'}</td>
                    <td>{joinedCount}</td>
                    <td>
                      {pendingCount > 0 ? (
                        <span className="club-list-page__pending">{pendingCount}</span>
                      ) : (
                        0
                      )}
                    </td>
                    <td>
                      <div className="club-list-page__actions">
                        <button
                          type="button"
                          className="club-link-btn"
                          onClick={() => setMembersModalClubId(club.id)}
                        >
                          Members
                        </button>
                        {canManageClub && (
                          <>
                            <Can permission="clubs.edit">
                              <button
                                type="button"
                                className="club-icon-btn"
                                title="Edit"
                                aria-label={`Edit ${club.name}`}
                                onClick={() => openEditClub(club)}
                              >
                                <Edit3 size={14} />
                              </button>
                            </Can>
                            <Can permission="clubs.edit">
                              <button
                                type="button"
                                className="club-icon-btn"
                                title="Remove"
                                aria-label={`Remove ${club.name}`}
                                onClick={() =>
                                  setConfirmAction({
                                    type: 'deleteClub',
                                    clubId: club.id,
                                    title: 'Remove club',
                                    body: `Remove ${club.name}? Students will no longer see it.`,
                                    confirmLabel: 'Remove club',
                                  })
                                }
                              >
                                <Trash2 size={14} />
                              </button>
                            </Can>
                          </>
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

      {activeMembersModalClub && (
        <div
          className="fc-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="club-members-modal-title"
          onClick={() => setMembersModalClubId(null)}
        >
          <div className="fc-modal-panel fc-modal-panel-lg" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-header">
              <h2 id="club-members-modal-title" style={{ fontSize: '1.2rem' }}>
                {activeMembersModalClub.name} — Members
              </h2>
              <button
                type="button"
                className="fc-btn fc-btn-ghost fc-btn-sm"
                onClick={() => setMembersModalClubId(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="fc-modal-body">
              {(activeMembersModalClub.members || []).length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  No members or join requests yet.
                </p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeMembersModalClub.members || []).map((mem) => (
                        <tr key={mem.id}>
                          <td>
                            <div className="club-list-page__name">{mem.studentName}</div>
                            <div className="club-list-page__meta">{mem.studentEmail}</div>
                          </td>
                          <td>
                            <StatusBadge status={mem.status} />
                          </td>
                          <td className="club-list-page__meta">
                            {mem.joinedAt ? `Joined ${mem.joinedAt}` : `Requested ${mem.requestedAt || ''}`}
                          </td>
                          <td>
                            <div className="club-list-page__actions">
                              {activeMembersModalClub.canManage === false ? (
                                <span className="club-list-page__meta">View only</span>
                              ) : (
                                <>
                                  <Can permission="members.approve">
                                    {(mem.status === 'pending' || mem.status === 'rejected') && (
                                      <button
                                        type="button"
                                        className="fc-btn fc-btn-primary fc-btn-sm"
                                        onClick={() =>
                                          reviewClubMemberRequest(
                                            activeMembersModalClub.id,
                                            mem.id,
                                            'approve'
                                          )
                                        }
                                      >
                                        <Check size={14} /> Approve
                                      </button>
                                    )}
                                  </Can>
                                  <Can permission="members.reject">
                                    {mem.status === 'pending' && (
                                      <button
                                        type="button"
                                        className="fc-btn fc-btn-outline fc-btn-sm"
                                        onClick={() =>
                                          setConfirmAction({
                                            type: 'reject',
                                            clubId: activeMembersModalClub.id,
                                            memberId: mem.id,
                                            title: 'Reject join request?',
                                            body: `${mem.studentName} will be marked as rejected.`,
                                            confirmLabel: 'Reject request',
                                          })
                                        }
                                      >
                                        <XCircle size={14} /> Reject
                                      </button>
                                    )}
                                  </Can>
                                  <Can permission="members.block">
                                    {(mem.status === 'joined' || mem.status === 'approved') && (
                                      <button
                                        type="button"
                                        className="fc-btn fc-btn-outline fc-btn-sm"
                                        onClick={() =>
                                          setConfirmAction({
                                            type: 'block',
                                            clubId: activeMembersModalClub.id,
                                            memberId: mem.id,
                                            title: 'Block this member?',
                                            body: `${mem.studentName} will lose access until unblocked.`,
                                            confirmLabel: 'Block member',
                                          })
                                        }
                                      >
                                        Block
                                      </button>
                                    )}
                                    {mem.status === 'blocked' && (
                                      <button
                                        type="button"
                                        className="fc-btn fc-btn-secondary fc-btn-sm"
                                        onClick={() =>
                                          setMemberStatus(activeMembersModalClub.id, mem.id, 'joined')
                                        }
                                      >
                                        Unblock
                                      </button>
                                    )}
                                  </Can>
                                </>
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
          aria-labelledby="club-form-modal-title"
          onClick={() => setFormModalOpen(false)}
        >
          <div className="fc-modal-panel club-ops-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-header">
              <h2 id="club-form-modal-title">{editingClubId ? 'Edit Club' : 'Create Club'}</h2>
              <button
                type="button"
                className="club-ops-modal-close"
                onClick={() => setFormModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClub} noValidate>
              <div className="fc-modal-body">
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label" htmlFor="club-name">
                      Club name *
                    </label>
                    <input
                      id="club-name"
                      type="text"
                      className="form-input"
                      placeholder="Enter club name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    {errors.name && <span className="form-error">{errors.name}</span>}
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="club-category">
                      Type *
                    </label>
                    <select
                      id="club-category"
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.category && <span className="form-error">{errors.category}</span>}
                  </div>

                  {isLiveClubAdmin ? (
                    <>
                      <div className="form-field">
                        <label className="form-label" htmlFor="club-department">
                          Department *
                        </label>
                        <select
                          id="club-department"
                          className="form-select"
                          value={verticalId}
                          onChange={(e) => {
                            setVerticalId(e.target.value);
                            setProjectId('');
                            setCenterId('');
                            setProjects([]);
                            setCenters([]);
                          }}
                          disabled={placementLoading}
                        >
                          <option value="">
                            {placementLoading ? 'Loading departments...' : 'Select department'}
                          </option>
                          {verticals.map((vertical) => (
                            <option key={vertical._id} value={vertical._id}>
                              {vertical.name}
                            </option>
                          ))}
                        </select>
                        {errors.verticalId && <span className="form-error">{errors.verticalId}</span>}
                      </div>

                      <div className="form-field">
                        <label className="form-label" htmlFor="club-project">
                          Project *
                        </label>
                        <select
                          id="club-project"
                          className="form-select"
                          value={projectId}
                          onChange={(e) => {
                            setProjectId(e.target.value);
                            setCenterId('');
                            setCenters([]);
                          }}
                          disabled={!verticalId}
                        >
                          <option value="">
                            {verticalId ? 'Select project' : 'Select department first'}
                          </option>
                          {projects.map((project) => (
                            <option key={project._id} value={project._id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                        {errors.projectId && <span className="form-error">{errors.projectId}</span>}
                      </div>

                      <div className="form-field">
                        <label className="form-label" htmlFor="club-center">
                          Centre *
                        </label>
                        <select
                          id="club-center"
                          className="form-select"
                          value={centerId}
                          onChange={(e) => setCenterId(e.target.value)}
                          disabled={!projectId}
                        >
                          <option value="">{projectId ? 'Select centre' : 'Select project first'}</option>
                          {centers.map((center) => (
                            <option key={center._id} value={center._id}>
                              {center.name}
                            </option>
                          ))}
                        </select>
                        {errors.centerId && <span className="form-error">{errors.centerId}</span>}
                      </div>
                    </>
                  ) : (
                    <div className="form-field">
                      <label className="form-label" htmlFor="club-inst">
                        Campus *
                      </label>
                      <select
                        id="club-inst"
                        className="form-select"
                        value={institutionId}
                        onChange={(e) => setInstitutionId(e.target.value)}
                      >
                        {campusOptions.length === 0 && <option value="">No campus assigned</option>}
                        {campusOptions.map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.name}
                          </option>
                        ))}
                      </select>
                      {errors.institutionId && <span className="form-error">{errors.institutionId}</span>}
                    </div>
                  )}

                  <div className="form-field">
                    <label className="form-label" htmlFor="club-coord">
                      Coordinator
                    </label>
                    <select
                      id="club-coord"
                      className="form-select"
                      value={coordinatorId}
                      onChange={(e) => setCoordinatorId(e.target.value)}
                    >
                      <option value="">Select coordinator</option>
                      {coordinatorOptions.map((person) => {
                        const campus = state.institutions.find((inst) => inst.id === person.institutionId);
                        return (
                          <option key={person.id} value={person.id}>
                            {person.name}
                            {campus?.name ? ` · ${campus.name}` : ''}
                            {person.role ? ` (${person.role})` : ''}
                          </option>
                        );
                      })}
                    </select>
                    {coordinatorOptions.length === 0 && (
                      <span className="form-error">
                        No institute users yet. Add them in Access Management, then return here.
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="club-theme">
                      Theme
                    </label>
                    <button
                      id="club-theme"
                      type="button"
                      className="club-theme-trigger"
                      aria-haspopup="listbox"
                      aria-expanded={themePickerOpen}
                      onClick={() => setThemePickerOpen((open) => !open)}
                    >
                      <span
                        className="club-theme-trigger-swatch"
                        style={{
                          background: `linear-gradient(135deg, ${selectedTheme.primary} 0%, ${selectedTheme.deep} 100%)`,
                        }}
                      />
                      <span>{selectedTheme.label}</span>
                    </button>
                  </div>

                  {themePickerOpen ? (
                    <div className="form-field full-width">
                      <div className="club-theme-picker" role="listbox" aria-label="Club theme templates">
                        {CLUB_THEME_TEMPLATES.map((template) => {
                          const selected = theme === template.id;
                          return (
                            <button
                              key={template.id}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              className={`club-theme-option${selected ? ' is-selected' : ''}`}
                              onClick={() => {
                                setTheme(template.id);
                                setThemePickerOpen(false);
                              }}
                            >
                              <span
                                className="club-theme-swatch"
                                style={{
                                  background: `linear-gradient(135deg, ${template.primary} 0%, ${template.deep} 55%, ${template.secondary} 100%)`,
                                }}
                              />
                              <span className="club-theme-option-label">{template.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="form-field full-width">
                    <label className="form-label" htmlFor="club-description">
                      Description
                    </label>
                    <textarea
                      id="club-description"
                      rows={3}
                      className="form-textarea"
                      placeholder="Enter description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="form-field full-width">
                    <label className="club-ops-check">
                      <input
                        type="checkbox"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                      />
                      Feature this club on Discover
                    </label>
                  </div>
                </div>
              </div>

              <div className="fc-modal-footer">
                <button
                  type="button"
                  className="fc-btn fc-btn-outline fc-btn-sm"
                  onClick={() => setFormModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm">
                  {editingClubId ? 'Save' : 'Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        body={confirmAction?.body}
        confirmLabel={confirmAction?.confirmLabel}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.type === 'reject') {
            reviewClubMemberRequest(confirmAction.clubId, confirmAction.memberId, 'reject');
          }
          if (confirmAction.type === 'block') {
            setMemberStatus(confirmAction.clubId, confirmAction.memberId, 'blocked');
          }
          if (confirmAction.type === 'deleteClub') {
            deleteClub(confirmAction.clubId);
          }
          setConfirmAction(null);
        }}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default AdminClubsPage;
