import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

const todayKey = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const emptyForm = () => ({
  reportDate: todayKey(),
  batchId: '',
  inTime: '',
  outTime: '',
  batchSize: '',
  totalPresent: '',
  totalAbsent: '',
  manualAttendanceUpdated: 'No',
  topic: '',
  softSkillTopic: '',
  internalAssessment: 'No',
  activityTopic: '',
});

const toDateKey = (value) => {
  const text = String(value || '');
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return '';
};

const toTimeInput = (value) => {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!match) return '';
  let hours = Number(match[1]);
  const meridiem = (match[3] || '').toLowerCase();
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
};

const formatReportDate = (value) => {
  const key = toDateKey(value);
  if (!key) return '';
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
};

const DailyTrainerReport = ({
  backendUrl,
  token,
  trainerName,
  userId,
  sessions = [],
  notify,
}) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [readOnly, setReadOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [screen, setScreen] = useState('add');
  const [form, setForm] = useState(emptyForm);
  const [removedIds, setRemovedIds] = useState([]);
  const [savedContext, setSavedContext] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [answers, setAnswers] = useState({});
  const [answerFiles, setAnswerFiles] = useState({});
  const [savedAnswerFiles, setSavedAnswerFiles] = useState({});
  const notifyRef = useRef(notify);
  notifyRef.current = notify;
  const prefillKey = useRef('');

  const batchChoices = useMemo(() => {
    const choices = new Map();
    sessions.forEach((session) => {
      const id = String(session.batch || '');
      if (!id) return;
      const existing = choices.get(id);
      const next = {
        id,
        batchCode: session.batchCode || existing?.batchCode || 'Batch',
        projectName: session.projectName || existing?.projectName || '',
        location: session.centerName || existing?.location || '',
        jobRole: session.courseTrade || session.courseName || existing?.jobRole || '',
        courseId: session.course ? String(session.course) : (existing?.courseId || ''),
        centerId: session.center ? String(session.center) : (existing?.centerId || ''),
        batchSize: Number(session.studentCount || session.totalCandidates || existing?.batchSize || 0),
      };
      choices.set(id, next);
    });
    return [...choices.values()];
  }, [sessions]);

  const selectedBatch = batchChoices.find((choice) => choice.id === form.batchId) || null;
  const editingReport = reports.find((report) => report.id === editingId) || null;
  const formTemplate = useMemo(() => {
    const savedTemplate = editingReport?.templateId
      ? templates.find((template) => template.id === editingReport.templateId)
      : null;
    if (savedTemplate) return savedTemplate;
    if (selectedBatch?.courseId) {
      const covers = (ids, single, value) => {
        const list = ids?.length ? ids : (single ? [single] : []);
        return !list.length || !value || list.includes(String(value));
      };
      const match = templates.find((template) => {
        if (template.enabled === false) return false;
        if (!covers(template.courseIds, template.courseId, selectedBatch.courseId)) return false;
        if (!covers(template.centerIds, template.centerId, selectedBatch.centerId)) return false;
        if (template.batchIds?.length && !template.batchIds.includes(selectedBatch.id)) return false;
        if (template.trainerIds?.length && !template.trainerIds.includes(String(userId || ''))) return false;
        return true;
      });
      if (match) return match;
    }
    if (editingReport?.answers?.length) {
      return {
        id: editingReport.templateId || '',
        name: editingReport.courseName || 'Daily report',
        courseName: editingReport.courseName || editingReport.jobRole || '',
        departmentName: editingReport.verticalName || '',
        projectName: editingReport.projectName || '',
        fields: editingReport.answers.map((answer) => ({
          key: answer.key,
          label: answer.label || answer.key,
          type: answer.type || 'text',
          required: false,
          options: [],
          portalKey: '',
          fileKind: 'document',
          maxFiles: 10,
        })),
      };
    }
    return null;
  }, [editingReport, selectedBatch, templates, userId]);

  const loadReports = useCallback(async () => {
    if (!token) {
      setReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/college/trainer/daily-reports`, {
        headers: { 'x-auth': token },
      });
      setReports(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('Failed to load daily trainer reports:', error);
      notifyRef.current(error.response?.data?.message || 'Unable to load daily reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    axios.get(`${backendUrl}/college/trainer/daily-report-settings`, {
      headers: { 'x-auth': token },
    }).then((response) => {
      if (!cancelled) setTemplates(response.data?.data?.templates || []);
    }).catch((error) => {
      console.error('Failed to load DTR settings:', error);
    });
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  const openNew = () => {
    prefillKey.current = '';
    setEditingId('');
    setReadOnly(false);
    setForm(emptyForm());
    setRemovedIds([]);
    setSavedContext(null);
    setAnswers({});
    setAnswerFiles({});
    setSavedAnswerFiles({});
  };

  const openReport = (report) => {
    prefillKey.current = `${report.batchId}|${report.reportDate}`;
    setEditingId(report.id);
    setReadOnly(Boolean(userId) && String(report.trainerId || '') !== String(userId));
    setSavedContext({
      trainerName: report.trainerName || '',
      batchCode: report.batchCode || '',
      projectName: report.projectName || '',
      location: report.location || '',
      jobRole: report.jobRole || '',
    });
    setForm({
      reportDate: report.reportDate || todayKey(),
      batchId: report.batchId || '',
      inTime: toTimeInput(report.inTime),
      outTime: toTimeInput(report.outTime),
      batchSize: report.batchSize ?? '',
      totalPresent: report.totalPresent ?? '',
      totalAbsent: report.totalAbsent ?? '',
      manualAttendanceUpdated: report.manualAttendanceUpdated || 'No',
      topic: report.topic || '',
      softSkillTopic: report.softSkillTopic || '',
      internalAssessment: report.internalAssessment || 'No',
      activityTopic: report.activityTopic || '',
    });
    const nextAnswers = {};
    const nextFiles = {};
    (report.answers || []).forEach((answer) => {
      nextAnswers[answer.key] = answer.value || '';
      nextFiles[answer.key] = answer.files || [];
    });
    setAnswers(nextAnswers);
    setAnswerFiles({});
    setSavedAnswerFiles(nextFiles);
    setRemovedIds([]);
  };

  useEffect(() => {
    if (editingId || !form.batchId || !formTemplate) return undefined;
    const key = `${form.batchId}|${form.reportDate}|${formTemplate.id}`;
    if (prefillKey.current === key) return undefined;
    prefillKey.current = key;
    const choice = batchChoices.find((item) => item.id === form.batchId);
    const match = sessions.find((session) => (
      String(session.batch || '') === form.batchId
      && toDateKey(session.sessionDate || session.date) === form.reportDate
    ));
    const portal = {
      trainerName: trainerName || '',
      project: choice?.projectName || match?.projectName || '',
      location: choice?.location || match?.centerName || '',
      jobRole: choice?.jobRole || match?.courseName || '',
      batch: choice?.batchCode || match?.batchCode || '',
      inTime: toTimeInput(match?.startTime),
      outTime: toTimeInput(match?.endTime),
      batchSize: String(match?.studentCount || match?.totalCandidates || choice?.batchSize || ''),
      totalPresent: match ? String(match.presentCandidates ?? '') : '',
      totalAbsent: match ? String(match.absentCandidates ?? '') : '',
      topic: match?.topicCovered || '',
      softSkill: (match?.sessionActivities || []).map((item) => item.name).filter(Boolean).join(', '),
    };
    setForm((prev) => ({
      ...prev,
      inTime: portal.inTime || prev.inTime,
      outTime: portal.outTime || prev.outTime,
      topic: portal.topic || prev.topic,
      softSkillTopic: portal.softSkill || prev.softSkillTopic,
      batchSize: portal.batchSize || prev.batchSize || '',
      totalPresent: portal.totalPresent || prev.totalPresent,
      totalAbsent: portal.totalAbsent || prev.totalAbsent,
    }));
    setAnswers((prev) => {
      const next = { ...prev };
      (formTemplate.fields || []).forEach((field) => {
        if (!field.portalKey) return;
        if (portal[field.portalKey]) next[field.key] = portal[field.portalKey];
      });
      return next;
    });
    return undefined;
  }, [batchChoices, editingId, form.batchId, form.reportDate, formTemplate, sessions, trainerName]);

  const onField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    if (!form.batchId) return 'Select a batch';
    if (!form.reportDate) return 'Report date is required';
    if (!formTemplate?.id) return 'No DTR is assigned to you for this batch. Ask the coordinator to select you in Settings.';
    (formTemplate.fields || []).forEach((field) => {
      if (!field.required) return;
      if (field.type === 'file') {
        const kept = (savedAnswerFiles[field.key] || []).filter((file) => !removedIds.includes(file.id));
        const added = answerFiles[field.key] || [];
        if (!kept.length && !added.length) throw new Error(`${field.label} is required`);
        return;
      }
      if (!String(answers[field.key] || '').trim()) throw new Error(`${field.label} is required`);
    });
    return '';
  };

  const saveReport = async () => {
    let message = '';
    try {
      message = validate();
    } catch (error) {
      message = error.message;
    }
    if (message) {
      notify(message);
      return;
    }

    const data = new FormData();
    data.append('templateId', formTemplate.id);
    data.append('reportDate', form.reportDate);
    data.append('batchId', form.batchId);
    data.append('answers', JSON.stringify(answers));
    data.append('removeFileIds', JSON.stringify(removedIds));
    Object.entries(answerFiles).forEach(([key, files]) => {
      (files || []).forEach((file) => data.append(`file_${key}`, file));
    });

    setSaving(true);
    try {
      const url = editingId
        ? `${backendUrl}/college/trainer/daily-reports/${editingId}`
        : `${backendUrl}/college/trainer/daily-reports`;
      const response = await axios({
        method: editingId ? 'put' : 'post',
        url,
        data,
        headers: { 'x-auth': token },
      });
      if (!response.data?.status) {
        throw new Error(response.data?.message || 'Unable to save report');
      }
      notify(editingId ? 'Daily report updated' : 'Daily report saved');
      await loadReports();
      openNew();
      setScreen('view');
    } catch (error) {
      const existingId = error.response?.data?.data?.id;
      if (error.response?.status === 409 && existingId) {
        const existing = reports.find((report) => report.id === existingId);
        notify('A report already exists for this batch on this date');
        if (existing) openReport(existing);
        else loadReports();
        return;
      }
      notify(error.response?.data?.message || error.message || 'Unable to save report');
    } finally {
      setSaving(false);
    }
  };

  const visibleReports = reports.filter((report) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      report.trainerName,
      report.verticalName,
      report.projectName,
      report.courseName,
      report.location,
      report.batchCode,
      report.jobRole,
      formatReportDate(report.reportDate),
    ].join(' ').toLowerCase().includes(query);
  });

  const fileRule = (field) => {
    if (field.fileKind === 'video') return { accept: 'video/*', maxMb: 100 };
    if (field.fileKind === 'document') return { accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp', maxMb: 100 };
    return { accept: 'image/*', maxMb: 10 };
  };

  const addAnswerFiles = (field, fileList) => {
    const rule = fileRule(field);
    const picked = Array.from(fileList || []).filter((file) => {
      if (file.size <= rule.maxMb * 1024 * 1024) return true;
      notify(`${file.name} is larger than ${rule.maxMb} MB`);
      return false;
    });
    if (!picked.length) return;
    setAnswerFiles((prev) => {
      const kept = (savedAnswerFiles[field.key] || []).filter((file) => !removedIds.includes(file.id)).length;
      const current = prev[field.key] || [];
      const room = field.maxFiles - kept - current.length;
      if (room <= 0) {
        notify(`${field.label} already has ${field.maxFiles} file(s)`);
        return prev;
      }
      return { ...prev, [field.key]: current.concat(picked.slice(0, room)) };
    });
  };

  const viewFields = useMemo(() => {
    const fields = new Map();
    templates.forEach((template) => {
      (template.fields || []).forEach((field) => fields.set(field.key, field));
    });
    reports.forEach((report) => {
      (report.answers || []).forEach((answer) => {
        if (!fields.has(answer.key)) {
          fields.set(answer.key, { key: answer.key, label: answer.label || answer.key, type: answer.type || 'text' });
        }
      });
    });
    return [...fields.values()];
  }, [reports, templates]);

  const assignedTemplate = templates.find((template) => (
    template.enabled !== false
    && (!template.trainerIds?.length || template.trainerIds.includes(String(userId || '')))
  ));
  const tableFields = formTemplate?.fields?.length
    ? formTemplate.fields
    : (assignedTemplate?.fields || templates.find((template) => template.enabled !== false)?.fields || []);

  const answerText = (report, field) => {
    const answer = (report.answers || []).find((item) => item.key === field.key);
    if (!answer) return '-';
    if (field.type === 'file' || answer.type === 'file') {
      const names = (answer.files || []).map((file) => file.fileName).filter(Boolean);
      return names.length ? names.join(', ') : '-';
    }
    return answer.value || '-';
  };

  const renderCell = (field) => {
    const locked = readOnly || Boolean(field.portalKey && answers[field.key]);
    const value = answers[field.key] || '';
    if (field.type === 'file') {
      const rule = fileRule(field);
      const kept = (savedAnswerFiles[field.key] || []).filter((file) => !removedIds.includes(file.id));
      const added = answerFiles[field.key] || [];
      return (
        <div className="dtr-cell-file">
          {!readOnly && (
            <input
              type="file"
              accept={rule.accept}
              multiple={field.maxFiles > 1}
              onChange={(event) => {
                addAnswerFiles(field, event.target.files);
                event.target.value = '';
              }}
            />
          )}
          {[...kept.map((file) => file.fileName || 'File'), ...added.map((file) => file.name)].join(', ')}
        </div>
      );
    }
    if (locked && field.type !== 'textarea') return <span>{value || '-'}</span>;
    if (field.type === 'textarea') {
      return <textarea value={value} disabled={locked} placeholder={field.placeholder || ''} onChange={(event) => setAnswers((prev) => ({ ...prev, [field.key]: event.target.value }))} />;
    }
    if (field.type === 'yesno' || field.type === 'select') {
      const options = field.type === 'yesno' ? ['Yes', 'No'] : (field.options || []);
      return (
        <select value={value} disabled={locked} onChange={(event) => setAnswers((prev) => ({ ...prev, [field.key]: event.target.value }))}>
          <option value="">Select</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    return (
      <input
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
        min={field.type === 'number' ? '0' : undefined}
        value={value}
        disabled={locked}
        placeholder={field.placeholder || ''}
        onChange={(event) => setAnswers((prev) => ({ ...prev, [field.key]: event.target.value }))}
      />
    );
  };

  return (
    <section className="dtr-wrap">
      <style>{`
        .dtr-wrap { display: flex; flex-direction: column; gap: 12px; }
        .dtr-tabs { display: flex; width: fit-content; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
        .dtr-tabs button { border: 0; background: #fff; color: #64748b; padding: 10px 22px; font-weight: 700; cursor: pointer; }
        .dtr-tabs button.active { background: #fa5579; color: #fff; }
        .dtr-bar, .dtr-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
        .dtr-bar { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 14px; flex-wrap: wrap; }
        .dtr-bar h2 { margin: 0; font-size: 16px; color: #0f172a; }
        .dtr-bar p { margin: 4px 0 0; color: #64748b; font-size: 12px; }
        .dtr-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .dtr-search { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; min-width: 220px; font-size: 13px; }
        .dtr-btn { border: 0; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; }
        .dtr-btn--primary { background: #fa5579; color: #fff; }
        .dtr-btn--ghost { background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; }
        .dtr-btn:disabled { opacity: 0.6; cursor: default; }
        .dtr-table-wrap { overflow: auto; }
        .dtr-table { width: max-content; min-width: 100%; border-collapse: collapse; font-size: 12px; }
        .dtr-table th, .dtr-table td { padding: 8px; border: 1px solid #e2e8f0; text-align: left; vertical-align: top; min-width: 140px; }
        .dtr-table th { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; background: #f8fafc; position: sticky; top: 0; }
        .dtr-table td input, .dtr-table td select, .dtr-table td textarea { width: 100%; min-width: 120px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; font-size: 12px; font-weight: 500; background: #fff; }
        .dtr-table td textarea { min-height: 52px; resize: vertical; }
        .dtr-fill td { background: #fff7f9; }
        .dtr-saved { cursor: pointer; }
        .dtr-saved:hover td { background: #f8fafc; }
        .dtr-cell-file { display: flex; flex-direction: column; gap: 4px; font-size: 11px; }
        .dtr-topic { white-space: normal; min-width: 180px; max-width: 280px; }
        .dtr-form { display: flex; flex-direction: column; gap: 14px; padding: 14px; }
        .dtr-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .dtr-span-2 { grid-column: span 2; }
        .dtr-span-3 { grid-column: span 3; }
        .dtr-field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; color: #334155; }
        .dtr-field input, .dtr-field select, .dtr-field textarea { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; font-size: 13px; font-weight: 500; background: #fff; }
        .dtr-field textarea { min-height: 74px; resize: vertical; }
        .dtr-readonly { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; font-weight: 600; color: #0f172a; min-height: 36px; }
        .dtr-section { border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; flex-direction: column; gap: 10px; }
        .dtr-section h3 { margin: 0; font-size: 14px; color: #0f172a; }
        .dtr-slot { border: 1px dashed #cbd5e1; border-radius: 10px; padding: 10px; background: #f8fafc; }
        .dtr-slot small { display: block; color: #64748b; font-weight: 500; margin-top: 2px; }
        .dtr-files { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .dtr-file { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #e2e8f0; border-radius: 999px; padding: 4px 8px; font-size: 12px; font-weight: 600; }
        .dtr-file button { border: 0; background: transparent; color: #be123c; cursor: pointer; font-weight: 800; }
        .dtr-empty { padding: 28px 14px; text-align: center; color: #64748b; }
        .dtr-yes { color: #047857; font-weight: 800; }
        .dtr-no { color: #b45309; font-weight: 800; }
        @media (max-width: 900px) {
          .dtr-grid, .dtr-span-2, .dtr-span-3 { grid-template-columns: 1fr; }
          .dtr-span-2, .dtr-span-3 { grid-column: auto; }
        }
      `}</style>

      <div className="dtr-tabs">
        <button type="button" className={screen === 'add' ? 'active' : ''} onClick={() => setScreen('add')}>Add report</button>
        <button type="button" className={screen === 'view' ? 'active' : ''} onClick={() => setScreen('view')}>View report</button>
      </div>
      <div className="dtr-card">
        <div className="dtr-bar">
          <div>
            <h2>{screen === 'add' ? 'Add daily report' : 'View reports'}</h2>
            <p>{screen === 'add' ? 'Fill the row, then save.' : `${visibleReports.length} saved report${visibleReports.length === 1 ? '' : 's'}`}</p>
          </div>
          <div className="dtr-actions">
            <input
              className="dtr-search"
              placeholder="Search trainer, course, batch..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {screen === 'add' && (
              <>
                <button type="button" className="dtr-btn dtr-btn--ghost" onClick={openNew}>Clear row</button>
                {!readOnly && (
                  <button type="button" className="dtr-btn dtr-btn--primary" onClick={saveReport} disabled={saving}>
                    {saving ? 'Saving...' : 'Save row'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        {loading ? (
          <div className="dtr-empty">Loading reports...</div>
        ) : screen === 'add' ? (
          <div className="dtr-table-wrap">
            <table className="dtr-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Batch</th>
                  {tableFields.map((field) => (
                    <th key={field.key}>{field.label}{field.required ? ' *' : ''}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="dtr-fill">
                  <td>
                    <input type="date" value={form.reportDate} disabled={readOnly} onChange={(event) => onField('reportDate', event.target.value)} />
                  </td>
                  <td>
                    <select value={form.batchId} disabled={readOnly} onChange={(event) => onField('batchId', event.target.value)}>
                      <option value="">Select batch</option>
                      {batchChoices.map((choice) => (
                        <option key={choice.id} value={choice.id}>{choice.batchCode}{choice.jobRole ? ` · ${choice.jobRole}` : ''}</option>
                      ))}
                      {form.batchId && !selectedBatch && (
                        <option value={form.batchId}>{savedContext?.batchCode || 'Batch'}</option>
                      )}
                    </select>
                  </td>
                  {tableFields.map((field) => <td key={field.key}>{renderCell(field)}</td>)}
                </tr>
              </tbody>
            </table>
            {form.batchId && !formTemplate && (
              <p className="dtr-empty">This DTR is not assigned to you for this batch. The coordinator selects the trainer in Settings → DTR.</p>
            )}
            {!tableFields.length && (
              <p className="dtr-empty">No DTR columns yet. The coordinator sets the fields, batches and trainers in Settings → DTR.</p>
            )}
          </div>
        ) : (
          <div className="dtr-table-wrap">
            {visibleReports.length === 0 ? (
              <div className="dtr-empty">No daily reports yet.</div>
            ) : (
              <table className="dtr-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Trainer</th>
                    <th>Department</th>
                    <th>Project</th>
                    <th>Course</th>
                    <th>Batch</th>
                    {viewFields.map((field) => <th key={field.key}>{field.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {visibleReports.map((report) => (
                    <tr key={report.id} className="dtr-saved" onClick={() => { openReport(report); setScreen('add'); }}>
                      <td>{formatReportDate(report.reportDate)}</td>
                      <td>{report.trainerName || '-'}</td>
                      <td>{report.verticalName || '-'}</td>
                      <td>{report.projectName || '-'}</td>
                      <td>{report.courseName || report.jobRole || '-'}</td>
                      <td>{report.batchCode || '-'}</td>
                      {viewFields.map((field) => <td key={field.key}>{answerText(report, field)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default DailyTrainerReport;
