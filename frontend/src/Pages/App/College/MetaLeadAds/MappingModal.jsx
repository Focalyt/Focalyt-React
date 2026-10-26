import React from 'react';
import { selectionIsCurrent, substatusesFor } from './metaLeadAdsState';

function FieldError({ name, errors }) {
  if (!errors[name]) return null;
  return <div className="invalid-feedback d-block">{errors[name]}</div>;
}

function namedItems(items) {
  return (items || []).filter(item => item && item.id && String(item.name || '').trim());
}

function ChoiceMenu({
  id,
  label,
  value,
  placeholder,
  items,
  disabled,
  emptyText,
  errorName,
  fieldErrors,
  onChange,
}) {
  const [open, setOpen] = React.useState(false);
  const choices = namedItems(items);
  const selected = choices.find(item => item.id === value);

  return (
    <div>
      <label className="form-label" htmlFor={id}>{label}</label>
      <button
        id={id}
        type="button"
        className="form-select text-start"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
      >
        {selected ? selected.name : placeholder}
      </button>
      {open && !disabled && (
        <div
          className="dropdown-menu show w-100 position-static mt-1"
          style={{ maxHeight: 220, overflowY: 'auto' }}
          role="listbox"
          aria-label={label}
        >
          <button
            type="button"
            className="dropdown-item"
            onClick={() => { onChange(''); setOpen(false); }}
          >
            {placeholder}
          </button>
          {choices.map(item => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={item.id === value}
              className={`dropdown-item${item.id === value ? ' active' : ''}`}
              onClick={() => { onChange(item.id); setOpen(false); }}
            >
              {item.name}
            </button>
          ))}
          {!choices.length && <div className="dropdown-item text-muted">{emptyText}</div>}
        </div>
      )}
      {!open && !choices.length && !disabled && (
        <div className="form-text">{emptyText}</div>
      )}
      <FieldError name={errorName} errors={fieldErrors} />
    </div>
  );
}

export default function MappingModal({
  selection,
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
            <p className="text-muted">This ad is for a course or a job. Choosing one clears the other. The applicant is not stored against a project.</p>
            <div className="row">
              <div className="col-md-6 mb-3">
                <ChoiceMenu
                  id="meta-course"
                  label="Course"
                  value={selection.courseId}
                  placeholder="Select a course"
                  items={options.courses}
                  disabled={loadingOptions}
                  emptyText="No courses are available."
                  errorName="courseId"
                  fieldErrors={fieldErrors}
                  onChange={courseId => onChange({ courseId })}
                />
              </div>
              <div className="col-md-6 mb-3">
                <ChoiceMenu
                  id="meta-job"
                  label="Job"
                  value={selection.jobId}
                  placeholder="Select a job"
                  items={options.jobs}
                  disabled={loadingOptions}
                  emptyText="No jobs are available."
                  errorName="jobId"
                  fieldErrors={fieldErrors}
                  onChange={jobId => onChange({ jobId })}
                />
              </div>
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
                  disabled={loadingOptions}
                  onChange={event => onChange({ defaultStatus: event.target.value })}
                >
                  <option value="">Select a status</option>
                  {statuses.map(status => (
                    <option key={status.id} value={status.id}>{status.title}</option>
                  ))}
                </select>
                {!loadingOptions && !statuses.length && (
                  <div className="form-text">No statuses are available.</div>
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
