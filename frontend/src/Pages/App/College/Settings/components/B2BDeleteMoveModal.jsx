import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const EMPTY_MOVE = {
  moveLeadsTo: {
    leadCategory: '',
    b2bProject: '',
    typeOfB2B: ''
  }
};

const projectGroupKey = (pg) => (pg?.projectId ? String(pg.projectId) : '__none__');
const typeGroupKey = (tg) => String(tg?.typeId);

function B2BDeleteMoveModal({
  show,
  loading,
  impact,
  entityLabel,
  departments = [],
  projects = [],
  types = [],
  sources = [],
  onCancel,
  onConfirm
}) {
  const [move, setMove] = useState(EMPTY_MOVE);
  const [departmentProjectMoves, setDepartmentProjectMoves] = useState({});
  const [departmentTypeMoves, setDepartmentTypeMoves] = useState({});
  const [moveAllToDepartment, setMoveAllToDepartment] = useState('');
  const [moveAllTypesToDepartment, setMoveAllTypesToDepartment] = useState('');

  useEffect(() => {
    if (!show) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [show]);

  useEffect(() => {
    if (!show) {
      setMove(EMPTY_MOVE);
      setDepartmentProjectMoves({});
      setDepartmentTypeMoves({});
      setMoveAllToDepartment('');
      setMoveAllTypesToDepartment('');
      return;
    }
    const otherDept = departments.find((d) => String(d._id) !== String(impact?.entityId));
    const defaultDeptId = otherDept?._id || '';
    setMoveAllToDepartment(defaultDeptId);
    setMoveAllTypesToDepartment(defaultDeptId);
    setMove({
      moveLeadsTo: {
        leadCategory: '',
        b2bProject: '',
        typeOfB2B: ''
      }
    });

    if (impact?.entityType === 'department' && Array.isArray(impact.projectGroups)) {
      const init = {};
      impact.projectGroups.forEach((pg) => {
        init[projectGroupKey(pg)] = { toDepartmentId: defaultDeptId };
      });
      setDepartmentProjectMoves(init);
    }

    if (impact?.entityType === 'department' && Array.isArray(impact.typeGroups)) {
      const init = {};
      impact.typeGroups.forEach((tg) => {
        init[typeGroupKey(tg)] = { toDepartmentId: defaultDeptId };
      });
      setDepartmentTypeMoves(init);
    }
  }, [show, impact?.entityId, impact?.entityType, impact?.projectGroups, impact?.typeGroups, departments]);

  const projectMoveOptions = useMemo(
    () => departments.filter((d) => String(d._id) !== String(impact?.entityId)),
    [departments, impact?.entityId]
  );
  const sourceMoveOptions = useMemo(
    () => sources.filter((s) => String(s._id) !== String(impact?.entityId)),
    [sources, impact?.entityId]
  );
  const projectTargetOptions = useMemo(
    () => projects.filter((p) => String(p.department?._id || p.department) !== String(impact?.entityId)),
    [projects, impact?.entityId]
  );
  const typeTargetOptions = useMemo(
    () => types.filter((t) => String(t._id) !== String(impact?.entityId)),
    [types, impact?.entityId]
  );

  const departmentProjectRecords = useMemo(
    () => impact?.projectGroups || [],
    [impact?.projectGroups]
  );

  const departmentTypeRecords = useMemo(
    () => impact?.typeGroups || [],
    [impact?.typeGroups]
  );

  if (!show || !impact) return null;

  const requiresMove = Boolean(impact.requiresMove);
  const entityName = impact.entityName || 'this item';

  const updateDepartmentProjectMove = (key, patch) => {
    setDepartmentProjectMoves((prev) => {
      const next = {
        ...prev,
        [key]: { ...prev[key], ...patch }
      };
      if (impact?.entityType === 'department' && patch.toDepartmentId !== undefined) {
        const groups = impact.projectGroups || [];
        const values = groups.map((pg) => next[projectGroupKey(pg)]?.toDepartmentId || '');
        const first = values[0];
        if (first && values.every((v) => v === first)) {
          setMoveAllToDepartment(first);
        } else {
          setMoveAllToDepartment('');
        }
      }
      return next;
    });
  };

  const applyMoveAllToDepartment = (deptId) => {
    setMoveAllToDepartment(deptId);
    if (!impact?.projectGroups?.length) return;
    const next = {};
    impact.projectGroups.forEach((pg) => {
      next[projectGroupKey(pg)] = { toDepartmentId: deptId };
    });
    setDepartmentProjectMoves(next);
  };

  const updateDepartmentTypeMove = (key, patch) => {
    setDepartmentTypeMoves((prev) => {
      const next = {
        ...prev,
        [key]: { ...prev[key], ...patch }
      };
      if (impact?.entityType === 'department' && patch.toDepartmentId !== undefined) {
        const groups = impact.typeGroups || [];
        const values = groups.map((tg) => next[typeGroupKey(tg)]?.toDepartmentId || '');
        const first = values[0];
        if (first && values.every((v) => v === first)) {
          setMoveAllTypesToDepartment(first);
        } else {
          setMoveAllTypesToDepartment('');
        }
      }
      return next;
    });
  };

  const applyMoveAllTypesToDepartment = (deptId) => {
    setMoveAllTypesToDepartment(deptId);
    if (!impact?.typeGroups?.length) return;
    const next = {};
    impact.typeGroups.forEach((tg) => {
      next[typeGroupKey(tg)] = { toDepartmentId: deptId };
    });
    setDepartmentTypeMoves(next);
  };

  const canConfirm = (() => {
    if (!requiresMove) return true;
    if (impact.orphanLeadsCount > 0) return false;
    if (impact.entityType === 'source' && impact.leads > 0) {
      return Boolean(move.moveLeadsTo.leadCategory);
    }
    if (impact.entityType === 'project' && impact.leads > 0) {
      return Boolean(move.moveLeadsTo.b2bProject);
    }
    if (impact.entityType === 'type' && impact.leads > 0) {
      return Boolean(move.moveLeadsTo.typeOfB2B);
    }
    if (impact.entityType === 'department') {
      for (const pg of impact.projectGroups || []) {
        const key = projectGroupKey(pg);
        const row = departmentProjectMoves[key] || {};
        if (!row.toDepartmentId) return false;
      }
      for (const tg of impact.typeGroups || []) {
        const key = typeGroupKey(tg);
        const row = departmentTypeMoves[key] || {};
        if (!row.toDepartmentId) return false;
      }
    }
    return true;
  })();

  const handleConfirm = () => {
    const payload = {};
    if (impact.entityType === 'department') {
      payload.moveProjects = departmentProjectRecords.map((pg) => ({
        projectId: pg.projectId,
        toDepartmentId: departmentProjectMoves[projectGroupKey(pg)]?.toDepartmentId
      }));
      payload.moveTypes = departmentTypeRecords.map((tg) => ({
        typeId: tg.typeId,
        toDepartmentId: departmentTypeMoves[typeGroupKey(tg)]?.toDepartmentId
      }));
    } else if (impact.entityType === 'project') {
      payload.moveLeadsTo = { b2bProject: move.moveLeadsTo.b2bProject };
    } else if (impact.entityType === 'type') {
      payload.moveLeadsTo = { typeOfB2B: move.moveLeadsTo.typeOfB2B };
    } else if (impact.entityType === 'source') {
      payload.moveLeadsTo = { leadCategory: move.moveLeadsTo.leadCategory };
    }
    onConfirm(payload);
  };

  return createPortal(
    <div
      className="modal fade show d-block b2b-delete-move-modal"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable b2b-delete-move-modal__dialog">
        <div className="modal-content b2b-delete-move-modal__content">
          <div className="modal-header flex-shrink-0">
            <h5 className="modal-title">Delete {entityLabel}</h5>
            <button type="button" className="btn-close" onClick={onCancel} disabled={loading} />
          </div>
          <div className="modal-body b2b-delete-move-modal__body">
            <p className="mb-3">
              Are you sure you want to delete <strong>{entityName}</strong>?
            </p>

            {requiresMove ? (
              <>
                {impact.entityType === 'department' && impact.orphanLeadsCount > 0 && (
                  <div className="alert alert-danger py-2 small mb-3">
                    {impact.orphanLeadsCount} lead(s) kisi project se linked nahi hain. Pehle unhe kisi project mein assign karein.
                  </div>
                )}

                <div className="b2b-delete-summary row g-2 mb-3">
                  {impact.leads > 0 && (
                    <div className="col-sm-4">
                      <div className="b2b-delete-stat b2b-delete-stat--leads">
                        <span className="b2b-delete-stat__label">Total Leads</span>
                        <strong className="b2b-delete-stat__value">{impact.leads}</strong>
                      </div>
                    </div>
                  )}
                  {impact.projects > 0 && (
                    <div className="col-sm-4">
                      <div className="b2b-delete-stat b2b-delete-stat--projects">
                        <span className="b2b-delete-stat__label">
                          <i className="fas fa-project-diagram me-1" aria-hidden="true" />
                          Projects
                        </span>
                        <strong className="b2b-delete-stat__value">{impact.projects}</strong>
                      </div>
                    </div>
                  )}
                  {impact.types > 0 && (
                    <div className="col-sm-4">
                      <div className="b2b-delete-stat b2b-delete-stat--types">
                        <span className="b2b-delete-stat__label">
                          <i className="fas fa-building me-1" aria-hidden="true" />
                          B2B Types
                        </span>
                        <strong className="b2b-delete-stat__value">{impact.types}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {impact.entityType === 'department' && (impact.projectGroups || []).length > 0 && (
                  <div className="b2b-delete-section b2b-delete-section--projects mb-4">
                    <div className="b2b-delete-section__header">
                      <div className="b2b-delete-section__badge">
                        <i className="fas fa-project-diagram" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="b2b-delete-section__title">Shift Projects</div>
                        <div className="b2b-delete-section__subtitle">
                          Blue section — sabhi projects ko naye department mein shift karein
                        </div>
                      </div>
                    </div>

                    <div className="b2b-delete-section__bulk">
                      <label className="form-label fw-semibold mb-1">Move all projects to department</label>
                      <select
                        className="form-select b2b-delete-select b2b-delete-select--projects"
                        value={moveAllToDepartment}
                        onChange={(e) => applyMoveAllToDepartment(e.target.value)}
                        disabled={loading}
                      >
                        <option value="">Select department for all projects</option>
                        {projectMoveOptions.map((d) => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {(impact.projectGroups || []).length > 1 && (
                      <>
                        <div className="b2b-delete-or-divider b2b-delete-or-divider--projects my-3">
                          <span>OR — move individually</span>
                        </div>
                      </>
                    )}

                    {(impact.projectGroups || []).length > 1 && (impact.projectGroups || []).map((pg) => {
                      const key = projectGroupKey(pg);
                      const row = departmentProjectMoves[key] || {};
                      return (
                        <div className="b2b-delete-item b2b-delete-item--projects mb-2" key={key}>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="fw-semibold">{pg.projectName}</div>
                              <div className="b2b-delete-item__meta">{pg.leadsCount} lead(s) — project ke saath shift hongi</div>
                            </div>
                            <span className="b2b-delete-item__tag">Project</span>
                          </div>

                          <div>
                            <label className="form-label small mb-1">Shift project to department</label>
                            <select
                              className="form-select form-select-sm b2b-delete-select b2b-delete-select--projects"
                              value={row.toDepartmentId || ''}
                              onChange={(e) => updateDepartmentProjectMove(key, { toDepartmentId: e.target.value })}
                              disabled={loading}
                            >
                              <option value="">Select department</option>
                              {projectMoveOptions.map((d) => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {impact.entityType === 'department' && (impact.typeGroups || []).length > 0 && (
                  <div className="b2b-delete-section b2b-delete-section--types mb-3">
                    <div className="b2b-delete-section__header">
                      <div className="b2b-delete-section__badge">
                        <i className="fas fa-building" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="b2b-delete-section__title">Shift B2B Types</div>
                        <div className="b2b-delete-section__subtitle">
                          Purple section — sabhi B2B types ko naye department mein shift karein
                        </div>
                      </div>
                    </div>

                    <div className="b2b-delete-section__bulk">
                      <label className="form-label fw-semibold mb-1">Move all B2B types to department</label>
                      <select
                        className="form-select b2b-delete-select b2b-delete-select--types"
                        value={moveAllTypesToDepartment}
                        onChange={(e) => applyMoveAllTypesToDepartment(e.target.value)}
                        disabled={loading}
                      >
                        <option value="">Select department for all B2B types</option>
                        {projectMoveOptions.map((d) => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {(impact.typeGroups || []).length > 1 && (
                      <>
                        <div className="b2b-delete-or-divider b2b-delete-or-divider--types my-3">
                          <span>OR — move individually</span>
                        </div>
                      </>
                    )}

                    {(impact.typeGroups || []).length > 1 && (impact.typeGroups || []).map((tg) => {
                      const key = typeGroupKey(tg);
                      const row = departmentTypeMoves[key] || {};
                      return (
                        <div className="b2b-delete-item b2b-delete-item--types mb-2" key={key}>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="fw-semibold">{tg.typeName}</div>
                              <div className="b2b-delete-item__meta">{tg.leadsCount} lead(s) is type par linked hain</div>
                            </div>
                            <span className="b2b-delete-item__tag">B2B Type</span>
                          </div>

                          <div>
                            <label className="form-label small mb-1">Shift B2B type to department</label>
                            <select
                              className="form-select form-select-sm b2b-delete-select b2b-delete-select--types"
                              value={row.toDepartmentId || ''}
                              onChange={(e) => updateDepartmentTypeMove(key, { toDepartmentId: e.target.value })}
                              disabled={loading}
                            >
                              <option value="">Select department</option>
                              {projectMoveOptions.map((d) => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {impact.leads > 0 && impact.entityType === 'source' && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Move leads to source</label>
                    <select
                      className="form-select"
                      value={move.moveLeadsTo.leadCategory}
                      onChange={(e) => setMove((prev) => ({
                        ...prev,
                        moveLeadsTo: { ...prev.moveLeadsTo, leadCategory: e.target.value }
                      }))}
                      disabled={loading}
                    >
                      <option value="">Select lead source</option>
                      {sourceMoveOptions.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {impact.leads > 0 && impact.entityType === 'project' && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Move leads to project</label>
                    <select
                      className="form-select"
                      value={move.moveLeadsTo.b2bProject}
                      onChange={(e) => setMove((prev) => ({
                        ...prev,
                        moveLeadsTo: { ...prev.moveLeadsTo, b2bProject: e.target.value }
                      }))}
                      disabled={loading}
                    >
                      <option value="">Select B2B project</option>
                      {projectTargetOptions.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {impact.leads > 0 && impact.entityType === 'type' && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Move leads to B2B type</label>
                    <select
                      className="form-select"
                      value={move.moveLeadsTo.typeOfB2B}
                      onChange={(e) => setMove((prev) => ({
                        ...prev,
                        moveLeadsTo: { ...prev.moveLeadsTo, typeOfB2B: e.target.value }
                      }))}
                      disabled={loading}
                    >
                      <option value="">Select B2B type</option>
                      {typeTargetOptions.map((t) => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {requiresMove && !canConfirm && (
                  <p className="text-danger small mt-2 mb-0">
                    Please complete all move options above, or create another {entityLabel.toLowerCase()} first.
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted small mb-0">No linked leads or records. This can be deleted safely.</p>
            )}
          </div>
          <div className="modal-footer flex-shrink-0">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirm}
              disabled={loading || !canConfirm}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Processing...
                </>
              ) : (
                requiresMove ? 'Shift & Delete' : 'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .b2b-delete-move-modal {
          position: fixed;
          inset: 0;
          z-index: 1060;
          overflow-x: hidden;
          overflow-y: auto;
          padding: 1rem;
        }
        .b2b-delete-move-modal__dialog {
          margin: 1.75rem auto;
          max-width: 800px;
          max-height: calc(100vh - 2rem);
        }
        .b2b-delete-move-modal__content {
          max-height: calc(100vh - 2rem);
          display: flex;
          flex-direction: column;
        }
        .b2b-delete-move-modal__body {
          overflow-y: auto;
          min-height: 0;
          flex: 1 1 auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
        .b2b-delete-or-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #6c757d;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .b2b-delete-or-divider::before,
        .b2b-delete-or-divider::after {
          content: '';
          flex: 1;
          border-top: 1px solid #dee2e6;
        }
        .b2b-delete-or-divider--projects span {
          color: #0b5ed7;
        }
        .b2b-delete-or-divider--types span {
          color: #7c3aed;
        }
        .b2b-delete-summary .b2b-delete-stat {
          border-radius: 10px;
          padding: 0.75rem 1rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .b2b-delete-stat__label {
          font-size: 0.78rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .b2b-delete-stat__value {
          font-size: 1.35rem;
          line-height: 1.1;
        }
        .b2b-delete-stat--leads {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          color: #495057;
        }
        .b2b-delete-stat--projects {
          background: #e7f1ff;
          border: 1px solid #9ec5fe;
          color: #084298;
        }
        .b2b-delete-stat--types {
          background: #f3e8ff;
          border: 1px solid #d8b4fe;
          color: #6b21a8;
        }
        .b2b-delete-section {
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid transparent;
        }
        .b2b-delete-section--projects {
          background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
          border-color: #b6d4fe;
          box-shadow: inset 4px 0 0 #0d6efd;
        }
        .b2b-delete-section--types {
          background: linear-gradient(180deg, #faf5ff 0%, #ffffff 100%);
          border-color: #d8b4fe;
          box-shadow: inset 4px 0 0 #7c3aed;
        }
        .b2b-delete-section__header {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .b2b-delete-section__badge {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 1rem;
        }
        .b2b-delete-section--projects .b2b-delete-section__badge {
          background: #cfe2ff;
          color: #0d6efd;
        }
        .b2b-delete-section--types .b2b-delete-section__badge {
          background: #e9d5ff;
          color: #7c3aed;
        }
        .b2b-delete-section__title {
          font-weight: 700;
          font-size: 1rem;
          line-height: 1.2;
        }
        .b2b-delete-section--projects .b2b-delete-section__title {
          color: #084298;
        }
        .b2b-delete-section--types .b2b-delete-section__title {
          color: #6b21a8;
        }
        .b2b-delete-section__subtitle {
          font-size: 0.8rem;
          color: #6c757d;
          margin-top: 0.15rem;
        }
        .b2b-delete-section__bulk {
          background: rgba(255, 255, 255, 0.85);
          border-radius: 10px;
          padding: 0.85rem;
        }
        .b2b-delete-item {
          border-radius: 10px;
          padding: 0.85rem;
        }
        .b2b-delete-item--projects {
          background: #ffffff;
          border: 1px solid #b6d4fe;
        }
        .b2b-delete-item--types {
          background: #ffffff;
          border: 1px solid #d8b4fe;
        }
        .b2b-delete-item__meta {
          font-size: 0.8rem;
          color: #6c757d;
        }
        .b2b-delete-item__tag {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          white-space: nowrap;
        }
        .b2b-delete-item--projects .b2b-delete-item__tag {
          background: #cfe2ff;
          color: #084298;
        }
        .b2b-delete-item--types .b2b-delete-item__tag {
          background: #e9d5ff;
          color: #6b21a8;
        }
        .b2b-delete-select--projects:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
        }
        .b2b-delete-select--types:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 0.2rem rgba(124, 58, 237, 0.15);
        }
      `}</style>
    </div>,
    document.body
  );
}

export default B2BDeleteMoveModal;
