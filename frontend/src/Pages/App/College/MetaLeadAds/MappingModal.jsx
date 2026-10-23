import React from 'react';
import { selectionIsCurrent, substatusesFor } from './metaLeadAdsState';

function FieldError({ name, errors }) {
  if (!errors[name]) return null;
  return <div className="invalid-feedback d-block">{errors[name]}</div>;
}

export default function MappingModal({
  selection,
  projects,
  options,
  loadingOptions,
  saving,
  fieldErrors,
  onChange,
  onClose,
  onSave,
}) {
  const statuses = options.statuses || [];
  const substatuses = substatusesFor(statuses, selection.defaultStatus);
  const ready = selectionIsCurrent(selection, options);

  return (
    <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.45)' }} role="dialog" aria-label="Map form">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{selection.mappingId ? 'Edit Mapping' : 'Map Form'}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Page ID</label>
                <input className="form-control" value={selection.pageId} readOnly />
              </div>
              <div className="col-md-4">
                <label className="form-label">Form ID</label>
                <input className="form-control" value={selection.formId} readOnly />
              </div>
              <div className="col-md-4">
                <label className="form-label">Form Name</label>
                <input className="form-control" value={selection.formName || 'Unavailable'} readOnly />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="meta-project">Project</label>
              <select
                id="meta-project"
                className="form-select"
                value={selection.projectId}
                onChange={event => onChange({ projectId: event.target.value })}
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>{project.name}</option>
                ))}
              </select>
              <FieldError name="projectId" errors={fieldErrors} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="meta-course">Course</label>
              <select
                id="meta-course"
                className="form-select"
                value={selection.courseId}
                disabled={!selection.projectId || loadingOptions}
                onChange={event => onChange({ courseId: event.target.value })}
              >
                <option value="">Select a course</option>
                {(options.courses || []).map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
              {selection.projectId && !loadingOptions && !(options.courses || []).length && (
                <div className="form-text">This project has no courses.</div>
              )}
              <FieldError name="courseId" errors={fieldErrors} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="meta-source">Lead Source</label>
              <select
                id="meta-source"
                className="form-select"
                value={selection.leadSource}
                onChange={event => onChange({ leadSource: event.target.value })}
              >
                <option value="">Select a lead source</option>
                {(options.leadSources || []).map(source => (
                  <option key={source.id} value={source.id}>{source.name}</option>
                ))}
              </select>
              <FieldError name="leadSource" errors={fieldErrors} />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="meta-status">Default Status</label>
                <select
                  id="meta-status"
                  className="form-select"
                  value={selection.defaultStatus}
                  disabled={!selection.projectId || loadingOptions}
                  onChange={event => onChange({ defaultStatus: event.target.value })}
                >
                  <option value="">Select a status</option>
                  {statuses.map(status => (
                    <option key={status.id} value={status.id}>{status.title}</option>
                  ))}
                </select>
                {selection.projectId && !loadingOptions && !statuses.length && (
                  <div className="form-text">This project has no statuses available.</div>
                )}
                <FieldError name="defaultStatus" errors={fieldErrors} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="meta-substatus">Default Substatus</label>
                <select
                  id="meta-substatus"
                  className="form-select"
                  value={selection.defaultSubstatus}
                  disabled={!selection.defaultStatus}
                  onChange={event => onChange({ defaultSubstatus: event.target.value })}
                >
                  <option value="">Select a substatus</option>
                  {substatuses.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.title}</option>
                  ))}
                </select>
                <FieldError name="defaultSubstatus" errors={fieldErrors} />
              </div>
            </div>
            {fieldErrors.form && <div className="alert alert-danger">{fieldErrors.form}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" disabled={!ready || saving} onClick={onSave}>
              {saving ? 'Saving…' : 'Save mapping'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
