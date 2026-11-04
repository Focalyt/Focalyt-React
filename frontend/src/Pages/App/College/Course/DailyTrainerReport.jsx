import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { resolveMediaUrl } from '../../../../utils/resolveMediaUrl';

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

const mediaUrl = (file) => {
  const backend = String(process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '');
  const onLocalhost = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
  const base = onLocalhost ? `${backend}/api/upload` : '';
  return resolveMediaUrl(base, file?.fileUrl || '');
};

const mediaKind = (file) => {
  const mime = String(file?.mimeType || '').toLowerCase();
  const name = `${file?.fileName || ''} ${file?.fileUrl || ''}`.toLowerCase();
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)(\?|$)/.test(name)) return 'image';
  if (mime.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|wmv)(\?|$)/.test(name)) return 'video';
  if (mime.includes('pdf') || /\.pdf(\?|$)/.test(name)) return 'pdf';
  return 'file';
};

const labelKey = (label) => String(label || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const knownFieldValue = (field, context) => {
  if (!field || field.type === 'file') return '';
  const key = field.portalKey || labelKey(field.label);
  const pick = {
    project: context.project,
    projectname: context.project,
    location: context.location,
    locationname: context.location,
    center: context.location,
    centre: context.location,
    centername: context.location,
    trainer: context.trainer,
    trainername: context.trainer,
    nameoftrainer: context.trainer,
    jobrole: context.jobRole,
    jobrolename: context.jobRole,
    course: context.jobRole,
    coursename: context.jobRole,
    batch: context.batch,
    batchid: context.batch,
    batchsize: context.batchSize,
    batchno: context.batch,
    batchcode: context.batch,
    batchname: context.batch,
    batchnumber: context.batch,
    department: context.department,
    departmentname: context.department,
    date: context.date,
    reportdate: context.date,
  }[key];
  const value = String(pick || '').trim();
  if (!value) return '';
  if ((field.type === 'select' || field.type === 'radio') && !(field.options || []).includes(value)) return '';
  return value;
};

  const DailyTrainerReport = ({
  backendUrl,
  token,
  userId,
  trainerName = '',
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
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [answers, setAnswers] = useState({});
  const [batchSize, setBatchSize] = useState('');
  const [touchedAnswers, setTouchedAnswers] = useState({});
  const [answerFiles, setAnswerFiles] = useState({});
  const [savedAnswerFiles, setSavedAnswerFiles] = useState({});
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

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

    const trainerId = String(userId || '');
    const allowed = new Set();
    templates.forEach((template) => {
      if (template.enabled === false) return;
      const trainers = (template.trainerIds || []).map(String).filter(Boolean);
      if (!trainerId || !trainers.includes(trainerId)) return;
      (template.batchIds || []).forEach((rawId, index) => {
        const id = String(rawId || '');
        if (!id) return;
        allowed.add(id);
        if (choices.has(id)) {
          const current = choices.get(id);
          const onlyName = (list, single) => {
            const names = (list || []).map((name) => String(name || '').trim()).filter(Boolean);
            if (names.length === 1) return names[0];
            return String(single || '').trim();
          };
          choices.set(id, {
            ...current,
            batchCode: template.batchNames?.[index] || (current.batchCode && current.batchCode !== 'Batch' ? current.batchCode : 'Batch'),
            projectName: onlyName(template.projectNames, template.projectName) || current.projectName || '',
            location: onlyName(template.centerNames, template.centerName) || current.location || '',
            jobRole: onlyName(template.courseNames, template.courseName) || current.jobRole || '',
            courseId: current.courseId || String((template.courseIds || [])[0] || template.courseId || ''),
            centerId: current.centerId || String((template.centerIds || [])[0] || template.centerId || ''),
          });
          return;
        }
        choices.set(id, {
          id,
          batchCode: template.batchNames?.[index] || 'Batch',
          projectName: (template.projectNames || [])[0] || template.projectName || '',
          location: (template.centerNames || [])[0] || template.centerName || '',
          jobRole: (template.courseNames || [])[0] || template.courseName || '',
          courseId: String((template.courseIds || [])[0] || template.courseId || ''),
          centerId: String((template.centerIds || [])[0] || template.centerId || ''),
          batchSize: 0,
        });
      });
    });

    if (!templatesLoaded) return [];
    return [...choices.values()].filter((choice) => allowed.has(choice.id));
  }, [sessions, templates, templatesLoaded, userId]);

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
        fields: editingReport.answers.filter((answer) => answer.key !== 'batchAttendance').map((answer) => ({
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

  const knownContext = useMemo(() => {
    const trainerIds = (formTemplate?.trainerIds || []).map(String);
    const trainerIndex = trainerIds.findIndex((id) => id === String(userId || ''));
    const assignedTrainer = trainerIndex >= 0 ? formTemplate?.trainerNames?.[trainerIndex] : '';
    return {
      project: selectedBatch?.projectName || formTemplate?.projectName || '',
      location: selectedBatch?.location || formTemplate?.centerName || '',
      trainer: assignedTrainer || trainerName || (formTemplate?.trainerNames || [])[0] || '',
      jobRole: selectedBatch?.jobRole || formTemplate?.courseName || '',
      batch: selectedBatch?.batchCode || '',
      batchSize,
      department: formTemplate?.departmentName || '',
      date: form.reportDate || '',
    };
  }, [batchSize, form.reportDate, formTemplate, selectedBatch, trainerName, userId]);

  useEffect(() => {
    if (!token || !form.batchId) {
      setBatchSize('');
      return undefined;
    }
    let cancelled = false;
    axios.get(`${backendUrl}/college/trainer/batch-students/${form.batchId}?countOnly=1`, {
      headers: { 'x-auth': token },
    }).then((response) => {
      if (cancelled) return;
      const count = Number(response.data?.count);
      setBatchSize(Number.isInteger(count) && count >= 0 ? String(count) : '');
    }).catch(() => {
      if (!cancelled) setBatchSize('');
    });
    return () => { cancelled = true; };
  }, [backendUrl, form.batchId, token]);

  const filledAnswer = (field, source = answers) => {
    const typed = source[field.key];
    if (touchedAnswers[field.key] || String(typed || '').trim()) return typed || '';
    return knownFieldValue(field, knownContext);
  };

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
      if (cancelled) return;
      setTemplates((response.data?.data?.templates || []).map((template) => ({
        ...template,
        fields: (template.fields || []).filter((field) => field.key !== 'batchAttendance'),
      })));
      setTemplatesLoaded(true);
    }).catch((error) => {
      console.error('Failed to load DTR settings:', error);
      if (!cancelled) setTemplatesLoaded(true);
    });
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  const openNew = () => {
    setEditingId('');
    setReadOnly(false);
    setForm(emptyForm());
    setRemovedIds([]);
    setSavedContext(null);
    setAnswers({});
    setTouchedAnswers({});
    setAnswerFiles({});
    setSavedAnswerFiles({});
  };

  const openReport = (report) => {
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
      if (answer.key === 'batchAttendance') return;
      nextAnswers[answer.key] = answer.value || '';
      nextFiles[answer.key] = answer.files || [];
    });
    setAnswers(nextAnswers);
    setTouchedAnswers({});
    setAnswerFiles({});
    setSavedAnswerFiles(nextFiles);
    setRemovedIds([]);
  };

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
      if (!String(filledAnswer(field) || '').trim()) throw new Error(`${field.label} is required`);
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
    const answersToSave = {};
    (formTemplate.fields || []).forEach((field) => {
      if (field.type === 'file') return;
      answersToSave[field.key] = filledAnswer(field);
    });
    data.append('answers', JSON.stringify(answersToSave));
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

  const detailFields = form.reportDate && form.batchId && formTemplate?.fields?.length
    ? (() => {
      const fields = formTemplate.fields.filter((field) => field.key !== 'batchAttendance' && field.key !== 'batchSize' && labelKey(field.label) !== 'batchsize');
      const batchSizeField = { key: 'batchSize', label: 'Batch size', type: 'number', required: false, locked: true };
      const batchIdIndex = fields.findIndex((field) => ['batchid', 'batch', 'batchno', 'batchcode'].includes(labelKey(field.label)));
      if (batchIdIndex >= 0) fields.splice(batchIdIndex + 1, 0, batchSizeField);
      else fields.push(batchSizeField);
      return fields;
    })()
    : [];

  const openPreview = (file) => {
    setPreview(file);
    setPreviewZoom(1);
    setPreviewRotation(0);
  };

  const closeView = () => {
    setViewingReport(null);
    setPreview(null);
  };

  const renderCell = (field) => {
    const locked = readOnly || field.locked;
    const value = filledAnswer(field);
    const writeAnswer = (nextValue) => {
      setTouchedAnswers((prev) => ({ ...prev, [field.key]: true }));
      setAnswers((prev) => ({ ...prev, [field.key]: nextValue }));
    };
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
          {(kept.length > 0 || added.length > 0) && (
            <div className="dtr-files">
              {kept.map((file) => <span className="dtr-file" key={file.id || file.fileName}>{file.fileName || 'File'}</span>)}
              {added.map((file) => <span className="dtr-file" key={`${file.name}-${file.size}`}>{file.name}</span>)}
            </div>
          )}
        </div>
      );
    }
    if (locked && field.type !== 'textarea') return <div className="dtr-readonly">{value || '-'}</div>;
    if (field.type === 'textarea') {
      return <textarea value={value} disabled={locked} placeholder={field.placeholder || ''} onChange={(event) => writeAnswer(event.target.value)} />;
    }
    if (field.type === 'radio' || field.type === 'yesno') {
      const options = field.type === 'yesno' ? ['Yes', 'No'] : (field.options || []);
      return (
        <div className="dtr-radios">
          {options.map((option) => (
            <label className="dtr-radio" key={option}>
              <input
                type="radio"
                name={field.key}
                value={option}
                checked={value === option}
                disabled={locked}
                onChange={() => writeAnswer(option)}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }
    if (field.type === 'select') {
      const options = field.options || [];
      return (
        <select value={value} disabled={locked} onChange={(event) => writeAnswer(event.target.value)}>
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
        onChange={(event) => writeAnswer(event.target.value)}
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
        .dtr-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .dtr-table th, .dtr-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: middle; }
        .dtr-table th { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; background: #f8fafc; }
        .dtr-table td.dtr-action, .dtr-table th.dtr-action { width: 90px; text-align: right; }
        .dtr-modal { position: fixed; inset: 0; z-index: 10050; background: rgba(15, 23, 42, 0.55); display: flex; align-items: center; justify-content: center; padding: 24px; }
        .dtr-modal-card { width: min(1040px, 100%); max-height: calc(100vh - 48px); overflow: auto; background: #fff; border-radius: 14px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28); }
        .dtr-modal-head { position: sticky; top: 0; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px; background: #fff; border-bottom: 1px solid #e2e8f0; }
        .dtr-modal-head h3 { margin: 0; font-size: 16px; }
        .dtr-modal-head p { margin: 2px 0 0; color: #64748b; font-size: 12px; }
        .dtr-modal-close { border: 0; background: transparent; font-size: 26px; line-height: 1; cursor: pointer; color: #334155; }
        .dtr-modal-body { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .dtr-meta, .dtr-answers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .dtr-meta div, .dtr-answer { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; }
        .dtr-answer-wide { grid-column: 1 / -1; }
        .dtr-meta span, .dtr-answer span { display: block; color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
        .dtr-meta strong, .dtr-answer p { display: block; margin: 2px 0 0; color: #0f172a; font-size: 13px; white-space: pre-wrap; }
        .dtr-gallery { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .dtr-thumb { width: 180px; height: 140px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; cursor: pointer; }
        .dtr-file-link { display: inline-flex; align-items: center; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; background: #fff; color: #0f172a; font-size: 12px; font-weight: 700; text-decoration: none; }
        .dtr-preview { position: fixed; inset: 0; z-index: 10060; background: rgba(15, 23, 42, 0.88); display: flex; flex-direction: column; }
        .dtr-preview-bar { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 14px; color: #fff; }
        .dtr-preview-bar button, .dtr-preview-bar a { border: 0; border-radius: 8px; background: #fff; color: #0f172a; padding: 6px 10px; font-weight: 700; cursor: pointer; text-decoration: none; }
        .dtr-preview-stage { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; overflow: auto; padding: 12px; }
        .dtr-preview-stage img, .dtr-preview-stage video { max-width: 100%; max-height: 78vh; background: #fff; }
        .dtr-preview-stage iframe { width: min(900px, 100%); height: 78vh; background: #fff; border: 0; }
        .dtr-cell-file { display: flex; flex-direction: column; gap: 4px; font-size: 11px; }
        .dtr-topic { white-space: normal; min-width: 180px; max-width: 280px; }
        .dtr-form { display: flex; flex-direction: column; gap: 14px; padding: 14px; }
        .dtr-pick { display: grid; grid-template-columns: 220px minmax(240px, 420px); gap: 12px; }
        .dtr-details { border-top: 1px solid #e2e8f0; padding-top: 14px; display: flex; flex-direction: column; gap: 14px; }
        .dtr-submit { display: flex; justify-content: flex-end; gap: 8px; }
        .dtr-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .dtr-span-2 { grid-column: span 2; }
        .dtr-span-3 { grid-column: span 3; }
        .dtr-field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; color: #334155; }
        .dtr-field input, .dtr-field select, .dtr-field textarea { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; font-size: 13px; font-weight: 500; background: #fff; }
        .dtr-radios { display: flex; flex-wrap: wrap; gap: 8px 16px; min-height: 36px; align-items: center; }
        .dtr-radio { display: inline-flex; flex-direction: row; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #334155; }
        .dtr-radio input { width: auto; min-height: 0; }
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
          .dtr-pick, .dtr-grid, .dtr-span-2, .dtr-span-3, .dtr-meta, .dtr-answers { grid-template-columns: 1fr; }
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
            <p>{screen === 'add' ? 'Select the date and batch. The fields open below.' : `${visibleReports.length} saved report${visibleReports.length === 1 ? '' : 's'}`}</p>
          </div>
          <div className="dtr-actions">
            {screen === 'view' && (
              <input
                className="dtr-search"
                placeholder="Search trainer, course, batch..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            )}
          </div>
        </div>
        {loading ? (
          <div className="dtr-empty">Loading reports...</div>
        ) : screen === 'add' ? (
          <div className="dtr-form">
            <div className="dtr-pick">
              <label className="dtr-field">Date
                <input type="date" value={form.reportDate} disabled={readOnly} onChange={(event) => onField('reportDate', event.target.value)} />
              </label>
              <label className="dtr-field">Batch
                <select value={form.batchId} disabled={readOnly} onChange={(event) => onField('batchId', event.target.value)}>
                  <option value="">Select batch</option>
                  {batchChoices.map((choice) => (
                    <option key={choice.id} value={choice.id}>{choice.batchCode}{choice.jobRole ? ` · ${choice.jobRole}` : ''}</option>
                  ))}
                  {form.batchId && !selectedBatch && (
                    <option value={form.batchId}>{savedContext?.batchCode || 'Batch'}</option>
                  )}
                </select>
              </label>
            </div>
            {templatesLoaded && !batchChoices.length && (
              <p className="dtr-empty">No batch is assigned to you. The coordinator selects your batch in Settings → DTR.</p>
            )}
            {form.batchId && !formTemplate && (
              <p className="dtr-empty">This DTR is not assigned to you for this batch. The coordinator selects the trainer in Settings → DTR.</p>
            )}
            {form.batchId && formTemplate && !detailFields.length && (
              <p className="dtr-empty">No fields on this DTR yet. The coordinator adds them in Settings → DTR.</p>
            )}
            {detailFields.length > 0 && (
              <div className="dtr-details">
                <div className="dtr-grid">
                  {detailFields.map((field) => (
                    <div
                      key={field.key}
                      className={`dtr-field${field.type === 'textarea' || field.type === 'file' || field.type === 'radio' || field.type === 'yesno' ? ' dtr-span-3' : ''}`}
                    >
                      <span>{field.label}{field.required ? ' *' : ''}</span>
                      {renderCell(field)}
                    </div>
                  ))}
                </div>
                <div className="dtr-submit">
                  <button type="button" className="dtr-btn dtr-btn--ghost" onClick={openNew}>Clear row</button>
                  {!readOnly && (
                    <button type="button" className="dtr-btn dtr-btn--primary" onClick={saveReport} disabled={saving}>
                      {saving ? 'Saving...' : 'Save row'}
                    </button>
                  )}
                </div>
              </div>
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
                    <th className="dtr-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleReports.map((report) => (
                    <tr key={report.id}>
                      <td>{formatReportDate(report.reportDate)}</td>
                      <td>{report.trainerName || '-'}</td>
                      <td>{report.verticalName || '-'}</td>
                      <td>{report.projectName || '-'}</td>
                      <td>{report.courseName || report.jobRole || '-'}</td>
                      <td>{report.batchCode || '-'}</td>
                      <td className="dtr-action">
                        <button type="button" className="dtr-btn dtr-btn--ghost" onClick={() => setViewingReport(report)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      {viewingReport && createPortal(
        <div className="dtr-modal" onClick={closeView}>
          <div className="dtr-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="dtr-modal-head">
              <div>
                <h3>{formatReportDate(viewingReport.reportDate) || 'Daily report'}</h3>
                <p>{[viewingReport.trainerName, viewingReport.batchCode, viewingReport.courseName].filter(Boolean).join(' · ')}</p>
              </div>
              <button type="button" className="dtr-modal-close" onClick={closeView} aria-label="Close">×</button>
            </div>
            <div className="dtr-modal-body">
              <div className="dtr-meta">
                {[
                  ['Date', formatReportDate(viewingReport.reportDate)],
                  ['Trainer', viewingReport.trainerName],
                  ['Department', viewingReport.verticalName],
                  ['Project', viewingReport.projectName],
                  ['Course', viewingReport.courseName || viewingReport.jobRole],
                  ['Batch', viewingReport.batchCode],
                  ['Batch size', viewingReport.batchSize ?? ''],
                  ['Location', viewingReport.location],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value || '-'}</strong>
                  </div>
                ))}
              </div>
              <div className="dtr-answers">
              {(viewingReport.answers || []).map((answer) => {
                const wide = answer.type === 'file' || answer.type === 'textarea' || String(answer.value || '').length > 80 || (answer.files || []).length > 0;
                return (
                <div className={`dtr-answer${wide ? ' dtr-answer-wide' : ''}`} key={answer.key}>
                  <span>{answer.label || answer.key}</span>
                  {answer.type === 'file' || (answer.files || []).length ? (
                    (answer.files || []).length ? (
                      <div className="dtr-gallery">
                        {answer.files.map((file) => {
                          const url = mediaUrl(file);
                          if (mediaKind(file) === 'image') {
                            return (
                              <img
                                key={file.id}
                                className="dtr-thumb"
                                src={url}
                                alt={file.fileName || 'Report photo'}
                                onClick={() => openPreview(file)}
                              />
                            );
                          }
                          return (
                            <button key={file.id} type="button" className="dtr-file-link" onClick={() => openPreview(file)}>
                              {file.fileName || 'Open file'}
                            </button>
                          );
                        })}
                      </div>
                    ) : <p>-</p>
                  ) : <p>{answer.value || '-'}</p>}
                </div>
                );
              })}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {preview && createPortal(
        <div className="dtr-preview" onClick={() => setPreview(null)}>
          <div className="dtr-preview-bar" onClick={(event) => event.stopPropagation()}>
            <strong>{preview.fileName || 'File'}</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              {mediaKind(preview) === 'image' && (
                <>
                  <button type="button" onClick={() => setPreviewZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))}>Zoom in</button>
                  <button type="button" onClick={() => setPreviewZoom((value) => Math.max(0.5, Number((value - 0.25).toFixed(2))))}>Zoom out</button>
                  <button type="button" onClick={() => setPreviewRotation((value) => (value + 90) % 360)}>Rotate</button>
                </>
              )}
              <a href={mediaUrl(preview)} target="_blank" rel="noreferrer">Open</a>
              <button type="button" onClick={() => setPreview(null)}>Close</button>
            </div>
          </div>
          <div className="dtr-preview-stage" onClick={(event) => event.stopPropagation()}>
            {mediaKind(preview) === 'image' && (
              <img
                src={mediaUrl(preview)}
                alt={preview.fileName || 'Report photo'}
                style={{ transform: `scale(${previewZoom}) rotate(${previewRotation}deg)`, transition: 'transform 0.2s ease' }}
              />
            )}
            {mediaKind(preview) === 'video' && <video src={mediaUrl(preview)} controls />}
            {mediaKind(preview) === 'pdf' && <iframe title={preview.fileName || 'PDF'} src={mediaUrl(preview)} />}
            {mediaKind(preview) === 'file' && (
              <a className="dtr-file-link" href={mediaUrl(preview)} target="_blank" rel="noreferrer">{preview.fileName || 'Open file'}</a>
            )}
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
};

export default DailyTrainerReport;
