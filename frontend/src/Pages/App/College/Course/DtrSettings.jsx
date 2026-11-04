import React, { useEffect, useRef, useState } from 'react';
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
  departmentIds: [],
  projectIds: [],
  centerIds: [],
  courseIds: [],
  batchIds: [],
  trainerIds: [],
  fields: [emptyField()],
});

const idOf = (value) => {
  const id = String(value?._id || value || '');
  return id && id !== 'undefined' && id !== 'null' ? id : '';
};

const idsOf = (value) => (Array.isArray(value) ? value : [value]).map(idOf).filter(Boolean);

const savedIds = (many, one) => (Array.isArray(many) && many.length ? many.map(String) : (one ? [String(one)] : []));

const DtrSettings = () => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = user.token;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [draft, setDraft] = useState(blankDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [optionInputs, setOptionInputs] = useState({});
  const [openMenu, setOpenMenu] = useState('');
  const [menuQuery, setMenuQuery] = useState('');
  const scopeRef = useRef(null);

  const headers = { 'x-auth': token };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [verticalRes, projectRes, centerRes, courseRes, batchRes, templateRes] = await Promise.all([
          axios.get(`${backendUrl}/college/getVerticals`, { headers }),
          axios.get(`${backendUrl}/college/list_all_projects`, { headers }),
          axios.get(`${backendUrl}/college/list_all_centers`, { headers }),
          axios.get(`${backendUrl}/college/all_courses`, { headers }),
          axios.get(`${backendUrl}/college/get_batches`, { headers }),
          axios.get(`${backendUrl}/college/trainer/daily-report-settings`, { headers }),
        ]);
        if (cancelled) return;
        setDepartments((verticalRes.data?.data || []).map((item) => ({ id: idOf(item._id), name: item.name })));
        setProjects((projectRes.data?.data || []).map((item) => ({
          id: idOf(item._id),
          name: item.name,
          departmentId: idOf(item.vertical),
        })));
        setCenters((centerRes.data?.data || []).map((item) => ({
          id: idOf(item._id),
          name: item.name,
          projectIds: idsOf(item.projects),
        })));
        setCourses((courseRes.data?.data || []).map((item) => ({
          id: idOf(item._id),
          name: item.name,
          projectId: idOf(item.project?._id || item.project),
          projectName: item.project?.name || item.projectName || '',
          departmentId: idOf(item.vertical?._id || item.vertical),
          centerIds: [...new Set(idsOf(item.center).concat(idOf(item.centerId)).filter(Boolean))],
        })));
        setAllBatches((batchRes.data?.data || []).map((item) => {
          const trainers = [];
          const addTrainer = (trainer, fallbackName) => {
            const id = idOf(trainer?._id || trainer);
            if (!id || trainers.some((person) => person.id === id)) return;
            trainers.push({ id, name: trainer?.name || fallbackName || 'Trainer' });
          };
          (item.trainers || []).forEach((trainer) => addTrainer(trainer));
          if (item.seniorTrainer || item.seniorTrainerId) {
            addTrainer(item.seniorTrainer || item.seniorTrainerId, item.seniorTrainerName);
          }
          return {
            id: idOf(item._id),
            name: item.name || 'Batch',
            courseId: idOf(item.courseId),
            centerId: idOf(item.centerId),
            trainers,
          };
        }));
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

  const projectsFor = (departmentIds) => projects.filter((project) => departmentIds.includes(project.departmentId));
  const centersFor = (projectIds) => centers.filter((center) => center.projectIds.some((id) => projectIds.includes(id)));
  const coursesFor = (departmentIds, projectIds, centerIds) => courses.filter((course) => {
    if (departmentIds.length && course.departmentId && !departmentIds.includes(course.departmentId)) return false;
    if (projectIds.length && course.projectId && !projectIds.includes(course.projectId)) return false;
    if (centerIds.length && course.centerIds.length && !course.centerIds.some((id) => centerIds.includes(id))) return false;
    return true;
  });
  const batchesFor = (courseIds, centerIds) => allBatches.filter((batch) => (
    courseIds.includes(batch.courseId) && (!centerIds.length || centerIds.includes(batch.centerId))
  ));

  const visibleProjects = projectsFor(draft.departmentIds);
  const visibleCenters = centersFor(draft.projectIds);
  const visibleCourses = coursesFor(draft.departmentIds, draft.projectIds, draft.centerIds);
  const visibleBatches = batchesFor(draft.courseIds, draft.centerIds);

  useEffect(() => {
    if (!openMenu) return undefined;
    const close = (event) => {
      if (!scopeRef.current?.contains(event.target)) setOpenMenu('');
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openMenu]);

  const trainersFor = (batchIds) => {
    const selected = new Set(batchIds);
    const people = new Map();
    allBatches.forEach((batch) => {
      if (!selected.has(batch.id)) return;
      (batch.trainers || []).forEach((trainer) => people.set(trainer.id, trainer.name));
    });
    return [...people.entries()].map(([id, name]) => ({ id, name }));
  };
  const trainerChoices = trainersFor(draft.batchIds);
  const pickLabel = (readyText, emptyText, options, selectedIds, placeholder) => {
    if (readyText) return readyText;
    if (!options.length) return emptyText;
    const names = options.filter((item) => selectedIds.includes(item.id)).map((item) => item.name);
    return names.length ? names.join(', ') : placeholder;
  };
  const departmentLabel = pickLabel('', 'No departments', departments, draft.departmentIds, 'Select departments');
  const projectLabel = pickLabel(!draft.departmentIds.length && 'Select departments first', 'No projects', visibleProjects, draft.projectIds, 'Select projects');
  const centerLabel = pickLabel(!draft.projectIds.length && 'Select projects first', 'No centers', visibleCenters, draft.centerIds, 'Select centers');
  const courseLabel = pickLabel(!draft.centerIds.length && 'Select centers first', 'No courses', visibleCourses, draft.courseIds, 'Select courses');
  const batchLabel = pickLabel(!draft.courseIds.length && 'Select courses first', 'No batches', visibleBatches, draft.batchIds, 'Select batches');
  const trainerLabel = pickLabel(!draft.batchIds.length && 'Select batches first', 'No trainer on these batches', trainerChoices, draft.trainerIds, 'Select trainers');

  const keepIds = (ids, options) => ids.filter((id) => options.some((item) => item.id === id));

  const chooseDepartments = (departmentIds) => {
    const nextProjects = projectsFor(departmentIds);
    const projectIds = keepIds(draft.projectIds, nextProjects);
    const nextCenters = centersFor(projectIds);
    const centerIds = keepIds(draft.centerIds, nextCenters);
    const nextCourses = coursesFor(departmentIds, projectIds, centerIds);
    const courseIds = keepIds(draft.courseIds, nextCourses);
    const nextBatches = batchesFor(courseIds, centerIds);
    const batchIds = keepIds(draft.batchIds, nextBatches);
    const trainerIds = keepIds(draft.trainerIds, trainersFor(batchIds));
    setDraft({ ...draft, departmentIds, projectIds, centerIds, courseIds, batchIds, trainerIds });
  };

  const chooseProjects = (projectIds) => {
    const nextCenters = centersFor(projectIds);
    const centerIds = keepIds(draft.centerIds, nextCenters);
    const nextCourses = coursesFor(draft.departmentIds, projectIds, centerIds);
    const courseIds = keepIds(draft.courseIds, nextCourses);
    const nextBatches = batchesFor(courseIds, centerIds);
    const batchIds = keepIds(draft.batchIds, nextBatches);
    const trainerIds = keepIds(draft.trainerIds, trainersFor(batchIds));
    setDraft({ ...draft, projectIds, centerIds, courseIds, batchIds, trainerIds });
  };

  const chooseCenters = (centerIds) => {
    const nextCourses = coursesFor(draft.departmentIds, draft.projectIds, centerIds);
    const courseIds = keepIds(draft.courseIds, nextCourses);
    const nextBatches = batchesFor(courseIds, centerIds);
    const batchIds = keepIds(draft.batchIds, nextBatches);
    const trainerIds = keepIds(draft.trainerIds, trainersFor(batchIds));
    setDraft({ ...draft, centerIds, courseIds, batchIds, trainerIds });
  };

  const chooseCourses = (courseIds) => {
    const nextBatches = batchesFor(courseIds, draft.centerIds);
    const batchIds = keepIds(draft.batchIds, nextBatches);
    const trainerIds = keepIds(draft.trainerIds, trainersFor(batchIds));
    setDraft({ ...draft, courseIds, batchIds, trainerIds });
  };

  const chooseBatches = (batchIds) => {
    const trainerIds = keepIds(draft.trainerIds, trainersFor(batchIds));
    setDraft({ ...draft, batchIds, trainerIds });
  };

  const openTemplate = (template) => {
    setMessage('');
    setOpenMenu('');
    setDraft({
      id: template.id,
      name: template.name || '',
      enabled: template.enabled !== false,
      departmentIds: savedIds(template.departmentIds, template.departmentId),
      projectIds: savedIds(template.projectIds, template.projectId),
      centerIds: savedIds(template.centerIds, template.centerId),
      courseIds: savedIds(template.courseIds, template.courseId),
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
    const selectedCourses = courses.filter((item) => draft.courseIds.includes(item.id));
    if (!draft.departmentIds.length) {
      setMessage('Select at least one department.');
      return;
    }
    if (!draft.projectIds.length) {
      setMessage('Select at least one project.');
      return;
    }
    if (!draft.centerIds.length) {
      setMessage('Select at least one center.');
      return;
    }
    if (!draft.courseIds.length) {
      setMessage('Select at least one course.');
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
      name: draft.name || `${selectedCourses[0]?.name || 'Course'} DTR`,
      enabled: draft.enabled,
      departmentIds: draft.departmentIds,
      projectIds: draft.projectIds,
      centerIds: draft.centerIds,
      courseIds: draft.courseIds,
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
      setMessage('DTR saved. The selected trainers can fill it on Daily Report.');
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
        .dtr-multi-menu { position: absolute; z-index: 30; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; max-height: 260px; overflow: auto; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08); padding: 6px; }
        .dtr-multi-search { position: sticky; top: 0; background: #fff; padding-bottom: 6px; z-index: 1; }
        .dtr-multi-search input { width: 100%; }
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
        <h2>DTR list</h2>
        <p>One report can cover many departments, projects, centers, courses and batches.</p>
        <button type="button" className="dtr-set-btn" onClick={() => { setDraft(blankDraft()); setOpenMenu(''); setMessage(''); }}>New DTR</button>
        {templates.map((template) => (
          <button key={template.id} type="button" onClick={() => openTemplate(template)}>
            <strong>{template.name || template.courseName}</strong>
            <small>{[template.departmentName, template.projectName, template.centerName, template.courseName].filter(Boolean).join(' · ') || 'No scope yet'}</small>
          </button>
        ))}
        {!loading && templates.length === 0 && <p>No DTR yet.</p>}
      </aside>
      <section className="dtr-set-card">
        {loading ? <p>Loading...</p> : (
          <>
            <h2>{draft.id ? 'Edit DTR' : 'Create DTR'}</h2>
            <p>Same order as the portal: department, project, center, course, then batch. You can select more than one in each.</p>
            <div className="dtr-set-grid" ref={scopeRef}>
              <label>Report name
                <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="RPL daily report" />
              </label>
              <label className="dtr-check">
                <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />
                Trainers can fill this DTR
              </label>
              {[
                ['department', 'Department', departmentLabel, departments, draft.departmentIds, chooseDepartments, false],
                ['project', 'Project', projectLabel, visibleProjects, draft.projectIds, chooseProjects, !draft.departmentIds.length],
                ['center', 'Center', centerLabel, visibleCenters, draft.centerIds, chooseCenters, !draft.projectIds.length],
                ['course', 'Course', courseLabel, visibleCourses, draft.courseIds, chooseCourses, !draft.centerIds.length],
                ['batch', 'Batches', batchLabel, visibleBatches, draft.batchIds, chooseBatches, !draft.courseIds.length],
                ['trainer', 'Trainers', trainerLabel, trainerChoices, draft.trainerIds, (trainerIds) => setDraft({ ...draft, trainerIds }), !draft.batchIds.length],
              ].map(([key, label, summary, options, selectedIds, onChange, disabled]) => (
                <div className="dtr-multi" key={key}>
                  {label}
                  <button
                    type="button"
                    className="dtr-multi-btn"
                    disabled={disabled || !options.length}
                    onClick={() => {
                      setMenuQuery('');
                      setOpenMenu(openMenu === key ? '' : key);
                    }}
                  >
                    <span>{summary}</span>
                    <span aria-hidden="true">▾</span>
                  </button>
                  {openMenu === key && (
                    <div className="dtr-multi-menu">
                      <div className="dtr-multi-search">
                        <input
                          value={menuQuery}
                          placeholder={`Search ${String(label).toLowerCase()}`}
                          onChange={(event) => setMenuQuery(event.target.value)}
                          onMouseDown={(event) => event.stopPropagation()}
                        />
                      </div>
                      {(() => {
                        const query = menuQuery.trim().toLowerCase();
                        const shown = query
                          ? options.filter((item) => String(item.name || '').toLowerCase().includes(query))
                          : options;
                        const shownIds = shown.map((item) => item.id);
                        const allShownSelected = shownIds.length > 0 && shownIds.every((id) => selectedIds.includes(id));
                        return (
                          <>
                            <label className="dtr-batch-item">
                              <input
                                type="checkbox"
                                checked={allShownSelected}
                                onChange={() => onChange(allShownSelected
                                  ? selectedIds.filter((id) => !shownIds.includes(id))
                                  : [...new Set(selectedIds.concat(shownIds))])}
                              />
                              Select all
                            </label>
                            {shown.map((item) => (
                              <label className="dtr-batch-item" key={item.id}>
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(item.id)}
                                  onChange={() => onChange(selectedIds.includes(item.id)
                                    ? selectedIds.filter((id) => id !== item.id)
                                    : selectedIds.concat(item.id))}
                                />
                                {item.name}
                              </label>
                            ))}
                            {!shown.length && <p>No match</p>}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
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
              <Link to="/institute/daily-report">Open daily report</Link>
            </div>
            {message && <p className="dtr-note">{message}</p>}
          </>
        )}
      </section>
    </div>
  );
};

export default DtrSettings;
