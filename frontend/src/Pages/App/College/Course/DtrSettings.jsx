import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const FIELD_TYPES = [
  { id: 'text', label: 'Short text' },
  { id: 'textarea', label: 'Long text' },
  { id: 'number', label: 'Number' },
  { id: 'date', label: 'Date' },
  { id: 'time', label: 'Time' },
  { id: 'yesno', label: 'Yes / No' },
  { id: 'select', label: 'Dropdown' },
  { id: 'file', label: 'File upload' },
];

const PORTAL_FILLS = [
  { id: '', label: 'Trainer fills this' },
  { id: 'trainerName', label: 'Trainer name' },
  { id: 'project', label: 'Project' },
  { id: 'location', label: 'Location / center' },
  { id: 'jobRole', label: 'Job role / course name' },
  { id: 'batch', label: 'Batch' },
  { id: 'inTime', label: 'In time from session' },
  { id: 'outTime', label: 'Out time from session' },
  { id: 'batchSize', label: 'Batch size' },
  { id: 'totalPresent', label: 'Present count' },
  { id: 'totalAbsent', label: 'Absent count' },
  { id: 'topic', label: 'Session topic' },
  { id: 'softSkill', label: 'Soft skill from activity type' },
];

const emptyField = () => ({
  key: `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  label: '',
  type: 'text',
  required: false,
  placeholder: '',
  options: [],
  portalKey: '',
  fileKind: 'image',
  maxFiles: 1,
});

const blankDraft = () => ({
  id: '',
  name: '',
  enabled: true,
  departmentId: '',
  projectId: '',
  courseId: '',
  batchIds: [],
  trainerIds: [],
  fields: [emptyField()],
});

const DtrSettings = () => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = user.token;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [draft, setDraft] = useState(blankDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [optionInputs, setOptionInputs] = useState({});
  const [courseBatches, setCourseBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesOpen, setBatchesOpen] = useState(false);
  const [trainersOpen, setTrainersOpen] = useState(false);
  const batchMenuRef = useRef(null);
  const trainerMenuRef = useRef(null);

  const headers = { 'x-auth': token };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [verticalRes, projectRes, courseRes, templateRes] = await Promise.all([
          axios.get(`${backendUrl}/college/getVerticals`, { headers }),
          axios.get(`${backendUrl}/college/list_all_projects`, { headers }),
          axios.get(`${backendUrl}/college/all_courses`, { headers }),
          axios.get(`${backendUrl}/college/trainer/daily-report-settings`, { headers }),
        ]);
        if (cancelled) return;
        setDepartments((verticalRes.data?.data || []).map((item) => ({ id: String(item._id), name: item.name })));
        setProjects((projectRes.data?.data || []).map((item) => ({ id: String(item._id), name: item.name })));
        setCourses((courseRes.data?.data || []).map((item) => ({
          id: String(item._id),
          name: item.name,
          projectId: String(item.project?._id || item.project || ''),
          projectName: item.project?.name || item.projectName || '',
          departmentId: String(item.vertical?._id || item.vertical || ''),
        })));
        setTemplates(templateRes.data?.data?.templates || []);
      } catch (error) {
        if (!cancelled) setMessage(error.response?.data?.message || 'Unable to load DTR settings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  const visibleProjects = useMemo(() => {
    if (!draft.departmentId) return projects;
    const ids = new Set(courses.filter((course) => course.departmentId === draft.departmentId).map((course) => course.projectId));
    const matched = projects.filter((project) => ids.has(project.id));
    return matched.length ? matched : projects;
  }, [courses, draft.departmentId, projects]);

  useEffect(() => {
    if (!draft.courseId || !token) {
      setCourseBatches([]);
      return undefined;
    }
    let cancelled = false;
    setBatchesLoading(true);
    axios.get(`${backendUrl}/college/get_batches`, {
      headers,
      params: { courseId: draft.courseId },
    }).then((response) => {
      if (cancelled) return;
      setCourseBatches((response.data?.data || []).map((item) => {
        const trainers = [];
        const addTrainer = (trainer, fallbackName) => {
          const id = String(trainer?._id || trainer || '');
          if (!id || id === 'undefined') return;
          if (trainers.some((person) => person.id === id)) return;
          trainers.push({ id, name: trainer?.name || fallbackName || 'Trainer' });
        };
        (item.trainers || []).forEach((trainer) => addTrainer(trainer));
        if (item.seniorTrainer || item.seniorTrainerId) {
          addTrainer(item.seniorTrainer || item.seniorTrainerId, item.seniorTrainerName);
        }
        return { id: String(item._id), name: item.name || 'Batch', trainers };
      }));
    }).catch(() => {
      if (!cancelled) setCourseBatches([]);
    }).finally(() => {
      if (!cancelled) setBatchesLoading(false);
    });
    return () => { cancelled = true; };
  }, [backendUrl, draft.courseId, token]);

  useEffect(() => {
    if (!batchesOpen && !trainersOpen) return undefined;
    const close = (event) => {
      if (batchesOpen && !batchMenuRef.current?.contains(event.target)) setBatchesOpen(false);
      if (trainersOpen && !trainerMenuRef.current?.contains(event.target)) setTrainersOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [batchesOpen, trainersOpen]);

  const trainersFor = (batchIds) => {
    const selected = new Set(batchIds);
    const people = new Map();
    courseBatches.forEach((batch) => {
      if (!selected.has(batch.id)) return;
      (batch.trainers || []).forEach((trainer) => people.set(trainer.id, trainer.name));
    });
    return [...people.entries()].map(([id, name]) => ({ id, name }));
  };
  const trainerChoices = trainersFor(draft.batchIds);
  const selectedTrainerNames = trainerChoices
    .filter((trainer) => draft.trainerIds.includes(trainer.id))
    .map((trainer) => trainer.name);
  const trainerLabel = !draft.batchIds.length
    ? 'Select batches first'
    : !trainerChoices.length
      ? 'No trainer on these batches'
      : selectedTrainerNames.length
        ? selectedTrainerNames.join(', ')
        : 'Select trainers';

  const selectedBatchNames = courseBatches
    .filter((batch) => draft.batchIds.includes(batch.id))
    .map((batch) => batch.name);
  const batchLabel = !draft.courseId
    ? 'Select course first'
    : batchesLoading
      ? 'Loading batches...'
      : !courseBatches.length
        ? 'No batches'
        : selectedBatchNames.length
          ? selectedBatchNames.join(', ')
          : 'Select batches';

  const visibleCourses = useMemo(() => courses.filter((course) => {
    if (draft.departmentId && course.departmentId && course.departmentId !== draft.departmentId) return false;
    if (draft.projectId && course.projectId && course.projectId !== draft.projectId) return false;
    return true;
  }), [courses, draft.departmentId, draft.projectId]);

  const openTemplate = (template) => {
    setMessage('');
    setDraft({
      id: template.id,
      name: template.name || '',
      enabled: template.enabled !== false,
      departmentId: template.departmentId || '',
      projectId: template.projectId || '',
      courseId: template.courseId || '',
      batchIds: template.batchIds || [],
      trainerIds: template.trainerIds || [],
      fields: (template.fields || []).map((field) => ({
        ...emptyField(),
        ...field,
        options: Array.isArray(field.options) ? field.options.filter(Boolean) : [],
      })),
    });
  };

  const updateField = (key, patch) => {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field) => (field.key === key ? { ...field, ...patch } : field)),
    }));
  };

  const chooseBatches = (batchIds) => {
    const allowed = new Set(trainersFor(batchIds).map((trainer) => trainer.id));
    setTrainersOpen(false);
    setDraft({
      ...draft,
      batchIds,
      trainerIds: draft.trainerIds.filter((id) => allowed.has(id)),
    });
  };

  const addOption = (field) => {
    const text = String(optionInputs[field.key] || '').trim();
    if (!text) return;
    const options = Array.isArray(field.options) ? field.options : [];
    if (options.some((item) => item.toLowerCase() === text.toLowerCase())) {
      setOptionInputs((current) => ({ ...current, [field.key]: '' }));
      return;
    }
    updateField(field.key, { options: options.concat(text) });
    setOptionInputs((current) => ({ ...current, [field.key]: '' }));
  };

  const save = async () => {
    const course = courses.find((item) => item.id === draft.courseId);
    const department = departments.find((item) => item.id === draft.departmentId);
    const project = projects.find((item) => item.id === draft.projectId);
    if (!draft.courseId) {
      setMessage('Select the course this DTR belongs to.');
      return;
    }
    if (!draft.batchIds.length) {
      setMessage('Select at least one batch.');
      return;
    }
    if (!draft.trainerIds.length) {
      setMessage('Select at least one trainer.');
      return;
    }
    setSaving(true);
    setMessage('');
    const payload = {
      name: draft.name || `${course?.name || 'Course'} DTR`,
      enabled: draft.enabled,
      departmentId: draft.departmentId,
      departmentName: department?.name || '',
      projectId: draft.projectId,
      projectName: project?.name || course?.projectName || '',
      courseId: draft.courseId,
      batchIds: draft.batchIds,
      trainerIds: draft.trainerIds,
      fields: draft.fields.map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder,
        optionsText: (field.options || []).join('\n'),
        portalKey: field.portalKey,
        fileKind: field.fileKind,
        maxFiles: Number(field.maxFiles) || 1,
      })),
    };
    try {
      const response = await axios({
        method: draft.id ? 'put' : 'post',
        url: draft.id
          ? `${backendUrl}/college/trainer/daily-report-settings/${draft.id}`
          : `${backendUrl}/college/trainer/daily-report-settings`,
        data: payload,
        headers,
      });
      if (!response.data?.status) throw new Error(response.data?.message || 'Unable to save');
      const saved = response.data.data;
      setTemplates((current) => {
        const rest = current.filter((item) => item.id !== saved.id);
        return [saved, ...rest];
      });
      openTemplate(saved);
      setMessage(`DTR saved for ${saved.courseName}. Trainers of this course will see these fields.`);
    } catch (error) {
      const existing = error.response?.data?.data;
      if (error.response?.status === 409 && existing?.id) openTemplate(existing);
      setMessage(error.response?.data?.message || error.message || 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dtr-set">
      <style>{`
        .dtr-set { padding: 18px; display: grid; grid-template-columns: 280px 1fr; gap: 16px; }
        .dtr-set h2 { margin: 0 0 8px; font-size: 22px; }
        .dtr-set p, .dtr-set small { color: #64748b; }
        .dtr-set-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
        .dtr-set-list button, .dtr-set-btn, .dtr-set-ghost { border-radius: 8px; font-weight: 700; cursor: pointer; }
        .dtr-set-list button { width: 100%; text-align: left; border: 1px solid #e2e8f0; background: #fff; padding: 10px; margin-top: 8px; }
        .dtr-set-list button strong { display: block; }
        .dtr-set-btn { border: 0; background: #fa5579; color: #fff; padding: 8px 14px; }
        .dtr-set-ghost { border: 1px solid #e2e8f0; background: #fff; padding: 8px 12px; }
        .dtr-set-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .dtr-multi { position: relative; display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 700; color: #334155; }
        .dtr-multi-btn { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 8px; text-align: left; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; background: #fff; font-weight: 500; color: #0f172a; cursor: pointer; }
        .dtr-multi-btn span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dtr-multi-btn:disabled { color: #94a3b8; cursor: default; }
        .dtr-multi-menu { position: absolute; z-index: 30; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; max-height: 220px; overflow: auto; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08); padding: 6px; }
        .dtr-set label.dtr-batch-item { flex-direction: row; align-items: center; gap: 8px; height: auto; font-weight: 600; padding: 6px; border-radius: 6px; cursor: pointer; }
        .dtr-set label.dtr-batch-item:hover { background: #f8fafc; }
        .dtr-set label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 700; color: #334155; }
        .dtr-set input, .dtr-set select, .dtr-set textarea { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; font-weight: 500; }
        .dtr-field { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; margin-top: 10px; }
        .dtr-field-row { display: flex; align-items: flex-end; gap: 8px; }
        .dtr-field-row > label:not(.dtr-check) { flex: 1; min-width: 0; }
        .dtr-set label.dtr-check { flex: 0 0 auto; flex-direction: row; align-items: center; gap: 8px; white-space: nowrap; height: 36px; }
        .dtr-options, .dtr-file-extra { margin-top: 8px; }
        .dtr-option-add { display: flex; gap: 8px; align-items: center; }
        .dtr-option-add input { flex: 1; }
        .dtr-option-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .dtr-option { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #e2e8f0; border-radius: 999px; padding: 4px 8px; font-size: 12px; font-weight: 600; }
        .dtr-option button { border: 0; background: transparent; color: #be123c; cursor: pointer; font-weight: 800; }
        .dtr-file-extra { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .dtr-note { color: #047857; font-size: 13px; }
        @media (max-width: 980px) { .dtr-set, .dtr-set-grid, .dtr-file-extra { grid-template-columns: 1fr; } }
      `}</style>
      <aside className="dtr-set-card dtr-set-list">
        <h2>DTR by course</h2>
        <p>Each course gets its own report.</p>
        <button type="button" className="dtr-set-btn" onClick={() => { setDraft(blankDraft()); setMessage(''); }}>New DTR</button>
        {templates.map((template) => (
          <button key={template.id} type="button" onClick={() => openTemplate(template)}>
            <strong>{template.courseName || template.name}</strong>
            <small>{[template.departmentName, template.projectName, (template.trainerNames || []).join(', ')].filter(Boolean).join(' · ') || 'No department'}</small>
          </button>
        ))}
        {!loading && templates.length === 0 && <p>No course DTR yet.</p>}
      </aside>
      <section className="dtr-set-card">
        {loading ? <p>Loading...</p> : (
          <>
            <h2>{draft.id ? 'Edit DTR' : 'Create DTR'}</h2>
            <p>Choose the department, project, course and batches. Then add the fields the trainer will fill.</p>
            <div className="dtr-set-grid">
              <label>Report name
                <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="RPL daily report" />
              </label>
              <label className="dtr-check"> 
                <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />
                Trainers can fill this DTR
              </label>
              <label>Department
                <select value={draft.departmentId} onChange={(event) => setDraft({ ...draft, departmentId: event.target.value, projectId: '', courseId: '', batchIds: [], trainerIds: [] })}>
                  <option value="">Select department</option>
                  {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label>Project
                <select value={draft.projectId} onChange={(event) => setDraft({ ...draft, projectId: event.target.value, courseId: '', batchIds: [], trainerIds: [] })}>
                  <option value="">Select project</option>
                  {visibleProjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label>Course
                <select value={draft.courseId} onChange={(event) => { setBatchesOpen(false); setTrainersOpen(false); setDraft({ ...draft, courseId: event.target.value, batchIds: [], trainerIds: [] }); }}>
                  <option value="">Select course</option>
                  {visibleCourses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <div className="dtr-multi" ref={batchMenuRef}>Batches
                <button
                  type="button"
                  className="dtr-multi-btn"
                  disabled={!draft.courseId || batchesLoading || !courseBatches.length}
                  onClick={() => setBatchesOpen((open) => !open)}
                >
                  <span>{batchLabel}</span>
                  <span aria-hidden="true">▾</span>
                </button>
                {batchesOpen && (
                  <div className="dtr-multi-menu">
                    <label className="dtr-batch-item">
                      <input
                        type="checkbox"
                        checked={courseBatches.length > 0 && draft.batchIds.length === courseBatches.length}
                        onChange={() => chooseBatches(draft.batchIds.length === courseBatches.length ? [] : courseBatches.map((item) => item.id))}
                      />
                      Select all
                    </label>
                    {courseBatches.map((batch) => (
                      <label className="dtr-batch-item" key={batch.id}>
                        <input
                          type="checkbox"
                          checked={draft.batchIds.includes(batch.id)}
                          onChange={() => chooseBatches(draft.batchIds.includes(batch.id)
                            ? draft.batchIds.filter((id) => id !== batch.id)
                            : draft.batchIds.concat(batch.id))}
                        />
                        {batch.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="dtr-multi" ref={trainerMenuRef}>Trainers
                <button
                  type="button"
                  className="dtr-multi-btn"
                  disabled={!draft.batchIds.length || !trainerChoices.length}
                  onClick={() => setTrainersOpen((open) => !open)}
                >
                  <span>{trainerLabel}</span>
                  <span aria-hidden="true">▾</span>
                </button>
                {trainersOpen && (
                  <div className="dtr-multi-menu">
                    <label className="dtr-batch-item">
                      <input
                        type="checkbox"
                        checked={trainerChoices.length > 0 && draft.trainerIds.length === trainerChoices.length}
                        onChange={() => setDraft({
                          ...draft,
                          trainerIds: draft.trainerIds.length === trainerChoices.length ? [] : trainerChoices.map((item) => item.id),
                        })}
                      />
                      Select all
                    </label>
                    {trainerChoices.map((trainer) => (
                      <label className="dtr-batch-item" key={trainer.id}>
                        <input
                          type="checkbox"
                          checked={draft.trainerIds.includes(trainer.id)}
                          onChange={() => setDraft({
                            ...draft,
                            trainerIds: draft.trainerIds.includes(trainer.id)
                              ? draft.trainerIds.filter((id) => id !== trainer.id)
                              : draft.trainerIds.concat(trainer.id),
                          })}
                        />
                        {trainer.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <h3 style={{ margin: 0 }}>Fields</h3>
              <button type="button" className="dtr-set-ghost" onClick={() => setDraft({ ...draft, fields: draft.fields.concat(emptyField()) })}>Add field</button>
            </div>
            {draft.fields.map((field, index) => (
              <div className="dtr-field" key={field.key}>
                <div className="dtr-field-row">
                  <label>Label
                    <input value={field.label} onChange={(event) => updateField(field.key, { label: event.target.value })} placeholder={`Field ${index + 1}`} />
                  </label>
                  <label>Format
                    <select value={field.type} onChange={(event) => updateField(field.key, { type: event.target.value })}>
                      {FIELD_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                    </select>
                  </label>
                  <label>Fill from portal
                    <select
                      value={field.portalKey}
                      onChange={(event) => {
                        const portalKey = event.target.value;
                        const type = portalKey === 'inTime' || portalKey === 'outTime'
                          ? 'time'
                          : ['batchSize', 'totalPresent', 'totalAbsent'].includes(portalKey)
                            ? 'number'
                            : portalKey === 'topic' || portalKey === 'softSkill'
                              ? 'textarea'
                              : portalKey
                                ? 'text'
                                : field.type;
                        updateField(field.key, { portalKey, type });
                      }}
                    >
                      {PORTAL_FILLS.map((item) => <option key={item.id || 'manual'} value={item.id}>{item.label}</option>)}
                    </select>
                  </label>
                  <label className="dtr-check">
                    <input type="checkbox" checked={field.required} onChange={(event) => updateField(field.key, { required: event.target.checked })} />
                    Required
                  </label>
                  <button type="button" className="dtr-set-ghost" onClick={() => setDraft({ ...draft, fields: draft.fields.filter((item) => item.key !== field.key) })}>Remove</button>
                </div>
                {field.type === 'select' && (
                  <div className="dtr-options">
                    <div className="dtr-option-add">
                      <input
                        value={optionInputs[field.key] || ''}
                        placeholder="Type one option"
                        onChange={(event) => setOptionInputs((current) => ({ ...current, [field.key]: event.target.value }))}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            addOption(field);
                          }
                        }}
                      />
                      <button type="button" className="dtr-set-ghost" onClick={() => addOption(field)}>Add option</button>
                    </div>
                    <div className="dtr-option-list">
                      {(field.options || []).map((option) => (
                        <span className="dtr-option" key={option}>
                          {option}
                          <button
                            type="button"
                            aria-label={`Remove ${option}`}
                            onClick={() => updateField(field.key, { options: field.options.filter((item) => item !== option) })}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {field.type === 'file' && (
                  <div className="dtr-file-extra">
                    <label>File type
                      <select value={field.fileKind} onChange={(event) => updateField(field.key, { fileKind: event.target.value })}>
                        <option value="image">Photo</option>
                        <option value="video">Video</option>
                        <option value="document">Document</option>
                      </select>
                    </label>
                    <label>Max files
                      <input type="number" min="1" max="10" value={field.maxFiles} onChange={(event) => updateField(field.key, { maxFiles: event.target.value })} />
                    </label>
                  </div>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}>
              <button type="button" className="dtr-set-btn" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save DTR'}</button>
              <Link to="/institute/training">Open trainer report</Link>
            </div>
            {message && <p className="dtr-note">{message}</p>}
          </>
        )}
      </section>
    </div>
  );
};

export default DtrSettings;
