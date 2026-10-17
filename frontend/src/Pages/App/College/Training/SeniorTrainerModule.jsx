import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import '../ProjectMangement/listView.css';
import { BLUE, GREEN, AC_SESSIONS_STORAGE_PREFIX, WORKFLOW_STATUS, getOptionLabel, mapApiOptions, getLinkedCourseOptions, formatSessionDate, fetchCoordinatorSessionsApi, patchCoordinatorSessionApi, loadCoordinatorSessions, filterSessionsForSeniorTrainer, applyPathFilters, parseSessionDateKey, isTotSession, appearsOnStudentCalendar, mapSessionForTotCalendar, resolveSessionSelectionId, sortSessionsByDate, ST_CSS } from './seniorTrainer/seniorTrainerShared';
import TrainingCalendar from './seniorTrainer/TrainingCalendar';
import SessionTable from './seniorTrainer/SessionTable';
import SessionAssignModal from './seniorTrainer/SessionAssignModal';
import SeniorSessionCard from './seniorTrainer/SeniorSessionCard';

/* ------------------------------------------------------------------ */
/*  Timetable helpers                                                  */
/* ------------------------------------------------------------------ */
const TEMPLATE_STORAGE_KEY = 'tt_templates_v1';
const TRACKS = [
  { key: 'course', label: 'Course', icon: 'bi-book-fill' },
  { key: 'placement', label: 'Placement', icon: 'bi-briefcase-fill' },
  { key: 'club', label: 'Club', icon: 'bi-people-fill' },
];
const DURATION_OPTIONS = [30, 45, 60, 90, 120];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_TEMPLATE = {
  id: 'default-regular',
  name: 'Regular Training',
  center: '',
  course: '',
  batch: '',
  track: 'course',
  mode: 'period',
  startTime: '09:00',
  endTime: '17:00',
  periods: 6,
  duration: 60,
  lunchStart: '13:00',
  lunchEnd: '13:45',
  isDefault: true,
};

const toMin = (t) => {
  if (!t || !String(t).includes(':')) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const fromMin = (n) => {
  const h = Math.floor(n / 60) % 24;
  const m = n % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
const toDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const fromDateKey = (key) => {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const startOfWeekMonday = (date) => {
  const d = new Date(date);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
};
const loadTemplates = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) || '[]');
    if (Array.isArray(raw) && raw.length) return raw;
  } catch (e) { /* ignore */ }
  return [DEFAULT_TEMPLATE];
};
const saveTemplates = (list) => {
  try { localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
};

/** Build the list of blocks (periods + lunch) for a configuration */
const buildBlocks = (cfg) => {
  const blocks = [];
  if (cfg.mode === 'full') {
    blocks.push({ type: 'period', label: 'Full Day', start: cfg.startTime, end: cfg.endTime, minutes: toMin(cfg.endTime) - toMin(cfg.startTime) });
    return blocks;
  }
  const dur = Number(cfg.duration) || 60;
  const total = Number(cfg.periods) || 0;
  const lunchStart = cfg.lunchStart ? toMin(cfg.lunchStart) : null;
  const lunchEnd = cfg.lunchEnd ? toMin(cfg.lunchEnd) : null;
  let cursor = toMin(cfg.startTime);
  let lunchDone = lunchStart === null || lunchEnd === null || lunchEnd <= lunchStart;
  for (let i = 1; i <= total; i += 1) {
    if (!lunchDone && cursor >= lunchStart) {
      blocks.push({ type: 'lunch', label: 'Lunch Break', start: fromMin(lunchStart), end: fromMin(lunchEnd), minutes: lunchEnd - lunchStart });
      cursor = Math.max(cursor, lunchEnd);
      lunchDone = true;
    }
    blocks.push({ type: 'period', label: `Period ${i}`, start: fromMin(cursor), end: fromMin(cursor + dur), minutes: dur });
    cursor += dur;
  }
  return blocks;
};

const summarize = (cfg) => {
  const blocks = buildBlocks(cfg);
  const periods = blocks.filter((b) => b.type === 'period');
  const lunch = blocks.find((b) => b.type === 'lunch');
  const studyMin = periods.reduce((s, b) => s + b.minutes, 0);
  const endTime = blocks.length ? blocks[blocks.length - 1].end : cfg.startTime;
  return { blocks, periods, lunch, studyMin, endTime };
};
const hrsLabel = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h} hr`;
};

/* ------------------------------------------------------------------ */
/*  Styles for new timetable design                                    */
/* ------------------------------------------------------------------ */
const TT_CSS = `
  :root { --tt-primary:#f43f5e; --tt-primary-dark:#e11d48; --tt-green:#15803d; --tt-green-bg:#ecfdf3; --tt-border:#e5e7eb; --tt-muted:#6b7280; --tt-ink:#111827; }
  .tt-page { font-family:'Plus Jakarta Sans',system-ui,sans-serif; padding:10px 12px 28px; font-size:12px; }
  .tt-crumb { font-size:11px; color:#6b7280; margin:0 0 8px; }
  .tt-card { background:#fff; border:1px solid var(--tt-border); border-radius:12px; padding:12px 14px; box-shadow:0 4px 18px rgba(15,23,42,.05); }
  .tt-head { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap; }
  .tt-title { display:flex; align-items:center; gap:6px; font-size:15px; font-weight:800; color:var(--tt-ink); margin:0; }
  .tt-title i { color:var(--tt-green); font-size:14px; }
  .tt-sub { font-size:11px; color:var(--tt-muted); margin:2px 0 0; }
  .tt-btn { border-radius:7px; padding:5px 10px; font-size:11px; font-weight:700; border:1px solid var(--tt-primary); cursor:pointer; display:inline-flex; align-items:center; gap:5px; background:#fff; color:var(--tt-primary-dark); transition:all .15s; }
  .tt-btn:hover { background:#fff1f2; }
  .tt-btn--solid { background:linear-gradient(135deg,#fb7185,#e11d48); color:#fff; border-color:transparent; }
  .tt-btn--solid:hover { filter:brightness(.95); background:linear-gradient(135deg,#fb7185,#e11d48); }
  .tt-btn--ghost { border-color:var(--tt-border); color:#374151; }
  .tt-label { font-size:10px; font-weight:700; color:#374151; margin-bottom:3px; display:block; }
  .tt-label b { color:var(--tt-primary-dark); }
  .tt-input, .tt-select { width:100%; height:30px; border:1px solid var(--tt-border); border-radius:7px; padding:0 8px; font-size:11px; background:#fff; color:var(--tt-ink); outline:none; }
  .tt-input:focus, .tt-select:focus { border-color:var(--tt-primary); box-shadow:0 0 0 3px rgba(244,63,94,.12); }
  .tt-badge { background:#dcfce7; color:#15803d; font-size:10px; font-weight:700; padding:2px 7px; border-radius:999px; margin-left:8px; }
  .tt-alert { background:var(--tt-green-bg); border:1px solid #bbf7d0; color:#166534; border-radius:8px; padding:7px 10px; font-size:11px; display:flex; justify-content:space-between; align-items:center; margin-top:10px; }
  .tt-alert button { background:none; border:none; color:#166534; cursor:pointer; font-size:12px; }
  .tt-stats { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .tt-stat { display:flex; align-items:center; gap:7px; background:#f9fafb; border:1px solid var(--tt-border); border-radius:8px; padding:6px 8px; width:148px; flex:0 0 148px; }
  .tt-stat i { font-size:13px; color:#6b7280; }
  .tt-stat small { display:block; font-size:9px; color:var(--tt-muted); line-height:1.2; }
  .tt-stat strong { font-size:12px; color:var(--tt-ink); }
  .tt-days { display:flex; align-items:stretch; gap:6px; margin-top:12px; width:100%; }
  .tt-arrow { width:26px; height:auto; min-height:46px; border:1px solid var(--tt-border); background:#fff; border-radius:7px; cursor:pointer; color:#374151; font-size:11px; flex:0 0 26px; }
  .tt-day { flex:1 1 0; width:auto; min-width:0; border:1px solid var(--tt-border); background:#fff; border-radius:8px; padding:6px 2px; text-align:center; cursor:pointer; transition:all .15s; }
  .tt-day small { display:block; font-size:9px; color:var(--tt-muted); font-weight:600; line-height:1.1; }
  .tt-day strong { font-size:13px; display:block; color:var(--tt-ink); line-height:1.15; }
  .tt-day em { display:block; font-style:normal; font-size:8px; color:#9ca3af; height:10px; line-height:1.1; }
  .tt-day:hover { border-color:var(--tt-green); }
  .tt-day.active { background:#15803d; border-color:#15803d; }
  .tt-day.active small, .tt-day.active strong, .tt-day.active em { color:#fff; }
  .tt-date-input { width:118px; flex:0 0 118px; }
  .tt-config { display:flex; flex-wrap:wrap; gap:8px; align-items:flex-end; margin-top:12px; }
  .tt-config > div { width:132px; flex:0 0 132px; }
  .tt-summary { font-size:11px; color:var(--tt-muted); margin:8px 0 0; }
  .tt-body { display:grid; grid-template-columns:156px minmax(0,1fr); gap:10px; margin-top:10px; }
  .tt-side { display:flex; flex-direction:column; gap:5px; }
  .tt-tab { display:flex; align-items:center; gap:6px; padding:6px 8px; border-radius:7px; font-size:11px; font-weight:700; border:1px solid var(--tt-border); background:#f9fafb; color:#374151; cursor:pointer; text-align:left; }
  .tt-tab.active { background:#15803d; color:#fff; border-color:#15803d; }
  .tt-unscheduled { margin-top:8px; }
  .tt-unscheduled h6 { font-size:11px; font-weight:800; margin:0 0 2px; color:var(--tt-ink); }
  .tt-unscheduled p { font-size:10px; color:var(--tt-muted); margin:0 0 6px; }
  .tt-unit { font-size:10px; font-weight:700; color:#374151; margin:6px 0 4px; }
  .tt-unit span { font-weight:500; color:var(--tt-muted); display:block; }
  .tt-session-list { border:1px solid var(--tt-border); border-radius:8px; max-height:210px; overflow:auto; background:#fff; }
  .tt-session-item { padding:5px 8px; font-size:11px; border-bottom:1px solid #f3f4f6; cursor:pointer; color:#374151; }
  .tt-session-item:last-child { border-bottom:none; }
  .tt-session-item:hover { background:#fff1f2; }
  .tt-session-item.picked { background:#fecdd3; font-weight:700; color:#9f1239; }
  .tt-empty-note { font-size:12px; color:var(--tt-muted); padding:10px; text-align:center; }
  .tt-grid { display:flex; flex-wrap:nowrap; gap:10px; overflow-x:auto; min-width:0; padding-bottom:6px; align-items:stretch; }
  .tt-grid::-webkit-scrollbar { height:8px; }
  .tt-grid::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:99px; }
  .tt-period { flex:0 0 168px; border:1px solid var(--tt-border); border-radius:8px; padding:7px 8px; background:#fff; position:relative; }
  .tt-period.lunch { background:#fffbeb; border-color:#fde68a; }
  .tt-period h6 { font-size:11px; font-weight:800; margin:0 0 6px; color:var(--tt-ink); }
  .tt-period .x { position:absolute; top:8px; right:10px; background:none; border:none; color:#9ca3af; cursor:pointer; font-size:12px; }
  .tt-period .x:hover { color:#e11d48; }
  .tt-times { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  .tt-times small { font-size:10px; font-weight:700; color:var(--tt-muted); display:block; margin-bottom:2px; }
  .tt-times input { width:100%; border:1px solid var(--tt-border); border-radius:6px; padding:2px 4px; font-size:11px; background:#f9fafb; }
  .tt-hr { font-size:10px; color:var(--tt-muted); margin:4px 0; }
  .tt-free { width:100%; border:1px dashed #cbd5e1; background:#f9fafb; border-radius:7px; padding:4px; font-size:11px; color:#64748b; cursor:pointer; }
  .tt-free.ready { border-color:#15803d; color:#15803d; background:#f0fdf4; font-weight:700; }
  .tt-free:disabled { cursor:not-allowed; background:#f3f4f6; color:#9ca3af; }
  .tt-assigned { background:#dcfce7; border:1px solid #86efac; color:#14532d; border-radius:7px; padding:4px 6px; font-size:11px; font-weight:700; }
  .tt-assigned small { display:block; font-weight:500; color:#166534; }
  /* drawer */
  .tt-overlay { position:fixed; inset:0; background:rgba(15,23,42,.35); z-index:1050; }
  .tt-drawer { position:fixed; top:0; right:0; bottom:0; width:410px; max-width:100vw; background:#fff; z-index:1051; box-shadow:-8px 0 30px rgba(15,23,42,.15); display:flex; flex-direction:column; animation:ttSlide .22s ease; }
  @keyframes ttSlide { from { transform:translateX(100%); } to { transform:translateX(0); } }
  .tt-drawer-head { padding:18px 20px 10px; display:flex; justify-content:space-between; align-items:flex-start; }
  .tt-drawer-head h5 { margin:0; font-size:17px; font-weight:800; }
  .tt-drawer-head p { margin:2px 0 0; font-size:12px; color:var(--tt-muted); }
  .tt-close { background:none; border:none; font-size:18px; cursor:pointer; color:#374151; }
  .tt-drawer-body { padding:6px 20px 16px; overflow:auto; flex:1; }
  .tt-field { margin-bottom:12px; }
  .tt-row { display:grid; grid-template-columns:90px 1fr; align-items:center; gap:8px; margin-bottom:8px; }
  .tt-row span { font-size:13px; color:#374151; }
  .tt-section { font-size:13px; font-weight:800; margin:14px 0 8px; color:var(--tt-ink); }
  .tt-seg { display:grid; grid-template-columns:repeat(3,1fr); border:1px solid var(--tt-border); border-radius:8px; overflow:hidden; }
  .tt-seg button { border:none; padding:8px 0; font-size:13px; font-weight:700; background:#f9fafb; color:#374151; cursor:pointer; }
  .tt-seg button.active { background:linear-gradient(135deg,#fb7185,#e11d48); color:#fff; }
  .tt-radio { display:flex; gap:10px; align-items:flex-start; margin-bottom:8px; cursor:pointer; }
  .tt-radio input { accent-color:#e11d48; margin-top:4px; }
  .tt-radio b { font-size:13px; display:block; }
  .tt-radio small { font-size:11px; color:var(--tt-muted); }
  .tt-two { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }
  .tt-preview { background:var(--tt-green-bg); border:1px solid #bbf7d0; border-radius:10px; padding:12px 14px; margin-top:10px; }
  .tt-preview h6 { font-size:12px; font-weight:800; color:#166534; margin:0 0 8px; }
  .tt-preview h6 span { font-weight:500; color:#4b5563; }
  .tt-preview div { display:flex; justify-content:space-between; font-size:12px; color:#4b5563; margin-bottom:4px; }
  .tt-preview div b { color:var(--tt-ink); }
  .tt-drawer-foot { padding:14px 20px; display:grid; grid-template-columns:1fr 1fr; gap:10px; border-top:1px solid var(--tt-border); }
  .tt-drawer-foot .tt-btn { justify-content:center; padding:10px; }
  .tt-tpl-row { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 0; border-bottom:1px solid #f3f4f6; font-size:13px; }
  .tt-tpl-row small { color:var(--tt-muted); display:block; }
  .tt-tpl-actions { display:flex; gap:6px; }
  .tt-tpl-actions button { font-size:11px; padding:4px 8px; border-radius:6px; border:1px solid var(--tt-border); background:#fff; cursor:pointer; }
  .tt-tpl-actions button.danger { color:#e11d48; border-color:#fecdd3; }
  /* search page */
  .tt-search { display:flex; align-items:flex-end; gap:10px; flex-wrap:wrap; margin-top:16px; }
  .tt-search label { flex:1 1 150px; min-width:0; }
  .tt-search-empty { text-align:center; padding:50px 0 30px; color:#94a3b8; }
  .tt-search-empty i { font-size:34px; }
  .tt-search-empty h5 { margin:10px 0 4px; color:#475569; font-weight:800; }
  @media (max-width:1100px) {
    .tt-body { grid-template-columns:1fr; }
  }
  @media (max-width:640px) { .tt-days { overflow-x:auto; } .tt-period { flex-basis:156px; } }
`;

/* ------------------------------------------------------------------ */
/*  Create Timetable Template drawer                                   */
/* ------------------------------------------------------------------ */
const TemplateDrawer = ({ onClose, onSave, centerOptions, courseOptions, batchOptions, initial }) => {
  const [form, setForm] = useState(initial || {
    name: '', center: '', course: '', batch: '', track: 'course', mode: 'period',
    startTime: '09:00', endTime: '17:00', periods: 6, duration: 60, lunchStart: '13:00', lunchEnd: '13:45',
  });
  const [error, setError] = useState('');
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const sum = useMemo(() => summarize(form), [form]);

  const submit = () => {
    if (!form.name.trim()) { setError('Template name is required.'); return; }
    onSave({ ...form, name: form.name.trim(), id: form.id || `tpl-${Date.now()}` });
  };

  return (
    <>
      <div className="tt-overlay" onClick={onClose} />
      <aside className="tt-drawer">
        <div className="tt-drawer-head">
          <div>
            <h5>{initial ? 'Edit Timetable Template' : 'Create Timetable Template'}</h5>
            <p>Save a timetable configuration for reuse</p>
          </div>
          <button type="button" className="tt-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>

        <div className="tt-drawer-body">
          <div className="tt-field">
            <label className="tt-label">Template Name <b>*</b></label>
            <input className="tt-input" value={form.name} placeholder="e.g. Regular Training"
              onChange={(e) => { set('name', e.target.value); setError(''); }} />
            {error && <small className="text-danger">{error}</small>}
          </div>

          <div className="tt-section">Applicable For</div>
          <div className="tt-row"><span>Center</span>
            <select className="tt-select" value={form.center} onChange={(e) => set('center', e.target.value)}>
              <option value="">Select center (optional)</option>
              {centerOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="tt-row"><span>Course</span>
            <select className="tt-select" value={form.course} onChange={(e) => set('course', e.target.value)}>
              <option value="">Select course (optional)</option>
              {courseOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="tt-row"><span>Batch</span>
            <select className="tt-select" value={form.batch} onChange={(e) => set('batch', e.target.value)}>
              <option value="">Select batch (optional)</option>
              {batchOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="tt-section">Track <b style={{ color: '#e11d48' }}>*</b></div>
          <div className="tt-seg">
            {TRACKS.map((t) => (
              <button key={t.key} type="button" className={form.track === t.key ? 'active' : ''} onClick={() => set('track', t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="tt-section">Mode <b style={{ color: '#e11d48' }}>*</b></div>
          <label className="tt-radio">
            <input type="radio" checked={form.mode === 'period'} onChange={() => set('mode', 'period')} />
            <span><b>Period based</b><small>Fixed number of periods with optional lunch</small></span>
          </label>
          <label className="tt-radio">
            <input type="radio" checked={form.mode === 'full'} onChange={() => set('mode', 'full')} />
            <span><b>Full day</b><small>Single block for the full day</small></span>
          </label>

          <div className="tt-section">Time Configuration</div>
          {form.mode === 'period' ? (
            <>
              <div className="tt-two">
                <div><label className="tt-label">Start Time <b>*</b></label>
                  <input type="time" className="tt-input" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} /></div>
                <div><label className="tt-label">Number of Periods <b>*</b></label>
                  <input type="number" min="1" max="12" className="tt-input" value={form.periods}
                    onChange={(e) => set('periods', Math.max(1, Math.min(12, Number(e.target.value) || 1)))} /></div>
              </div>
              <div className="tt-two">
                <div><label className="tt-label">Duration <b>*</b></label>
                  <select className="tt-select" value={form.duration} onChange={(e) => set('duration', Number(e.target.value))}>
                    {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
                  </select></div>
                <div />
              </div>
              <div className="tt-two">
                <div><label className="tt-label">Lunch Start</label>
                  <input type="time" className="tt-input" value={form.lunchStart} onChange={(e) => set('lunchStart', e.target.value)} /></div>
                <div><label className="tt-label">Lunch End</label>
                  <input type="time" className="tt-input" value={form.lunchEnd} onChange={(e) => set('lunchEnd', e.target.value)} /></div>
              </div>
            </>
          ) : (
            <div className="tt-two">
              <div><label className="tt-label">Start Time <b>*</b></label>
                <input type="time" className="tt-input" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} /></div>
              <div><label className="tt-label">End Time <b>*</b></label>
                <input type="time" className="tt-input" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} /></div>
            </div>
          )}

          <div className="tt-preview">
            <h6>Preview <span>(Auto-calculated)</span></h6>
            <div><span>Total Study Hours</span>
              <b>{(sum.studyMin / 60).toFixed(sum.studyMin % 60 ? 1 : 0)} hrs {form.mode === 'period' ? `(${sum.periods.length} × ${form.duration} min)` : ''}</b></div>
            {form.mode === 'period' && sum.lunch && (
              <div><span>Lunch Break</span><b>{sum.lunch.start} - {sum.lunch.end} ({sum.lunch.minutes} min)</b></div>
            )}
            <div><span>End Time</span><b>{sum.endTime}</b></div>
          </div>
        </div>

        <div className="tt-drawer-foot">
          <button type="button" className="tt-btn tt-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="tt-btn tt-btn--solid" onClick={submit}>Save Template</button>
        </div>
      </aside>
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Manage templates drawer                                            */
/* ------------------------------------------------------------------ */
const ManageTemplatesDrawer = ({ templates, onClose, onDelete, onDefault, onEdit }) => (
  <>
    <div className="tt-overlay" onClick={onClose} />
    <aside className="tt-drawer">
      <div className="tt-drawer-head">
        <div>
          <h5>Manage Templates</h5>
          <p>Edit, delete or choose the default template</p>
        </div>
        <button type="button" className="tt-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
      </div>
      <div className="tt-drawer-body">
        {templates.map((t) => {
          const s = summarize(t);
          return (
            <div className="tt-tpl-row" key={t.id}>
              <div>
                <b>{t.name}</b>{t.isDefault && <span className="tt-badge">Default</span>}
                <small>{t.mode === 'full' ? 'Full day' : `${s.periods.length} periods × ${t.duration} min`} · {t.startTime} – {s.endTime} · {t.track}</small>
              </div>
              <div className="tt-tpl-actions">
                {!t.isDefault && <button type="button" onClick={() => onDefault(t.id)}>Make default</button>}
                <button type="button" onClick={() => onEdit(t)}>Edit</button>
                {templates.length > 1 && <button type="button" className="danger" onClick={() => onDelete(t.id)}>Delete</button>}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  </>
);

/* ------------------------------------------------------------------ */
/*  Session Timetable builder (main new design)                        */
/* ------------------------------------------------------------------ */
const SessionTimetableBuilder = ({
  breadcrumb, sessions, onAssignPeriod, onBack,
  centerOptions, courseOptions, batchOptions,
}) => {
  const [templates, setTemplates] = useState(loadTemplates);
  const [templateId, setTemplateId] = useState(() => (loadTemplates().find((t) => t.isDefault) || loadTemplates()[0]).id);
  const activeTemplate = templates.find((t) => t.id === templateId) || templates[0];

  const [cfg, setCfg] = useState(activeTemplate);
  const [showInfo, setShowInfo] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [track, setTrack] = useState('course');
  const [pickedId, setPickedId] = useState('');
  const [drawer, setDrawer] = useState(null); // 'create' | 'manage' | {edit: tpl}
  const [busy, setBusy] = useState(false);

  useEffect(() => { setCfg(activeTemplate); }, [activeTemplate]);
  useEffect(() => { saveTemplates(templates); }, [templates]);

  const sum = useMemo(() => summarize(cfg), [cfg]);
  const setC = (k, v) => setCfg((p) => ({ ...p, [k]: v }));

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

  const shiftWeek = (dir) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d);
  };
  const pickDate = (key) => {
    setSelectedDate(key);
    setWeekStart(startOfWeekMonday(fromDateKey(key)));
  };

  const sessionTrack = (s) => s.timetableType || 'course';
  const unscheduled = useMemo(
    () => sessions.filter((s) => !s.sample && !parseSessionDateKey(s) && sessionTrack(s) === track),
    [sessions, track]
  );
  const scheduledToday = useMemo(
    () => sessions.filter((s) => !s.sample && parseSessionDateKey(s) === selectedDate && sessionTrack(s) === track),
    [sessions, selectedDate, track]
  );
  const dayCountMap = useMemo(() => {
    const map = {};
    sessions.forEach((s) => { const k = parseSessionDateKey(s); if (k) map[k] = (map[k] || 0) + 1; });
    return map;
  }, [sessions]);

  const sessionLabel = (s) => s.title || s.name || s.topic || 'Untitled session';

  const assignToPeriod = async (block) => {
    if (!pickedId) return;
    setBusy(true);
    try {
      await onAssignPeriod(pickedId, {
        assignDate: selectedDate, startTime: block.start, endTime: block.end, timetableType: track,
      });
      setPickedId('');
    } catch (err) {
      console.error('Failed to assign period', err);
    } finally { setBusy(false); }
  };

  const clearPeriod = async (session) => {
    setBusy(true);
    try {
      await onAssignPeriod(session.id, { assignDate: '', startTime: '', endTime: '', timetableType: sessionTrack(session) });
    } finally { setBusy(false); }
  };

  const handleSaveTemplate = (tpl) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === tpl.id);
      const next = exists ? prev.map((t) => (t.id === tpl.id ? { ...t, ...tpl } : t)) : [...prev, { ...tpl, isDefault: prev.length === 0 }];
      return next;
    });
    setTemplateId(tpl.id);
    setDrawer(null);
  };
  const handleDeleteTemplate = (id) => {
    setTemplates((prev) => {
      const rest = prev.filter((t) => t.id !== id);
      if (!rest.some((t) => t.isDefault) && rest[0]) rest[0] = { ...rest[0], isDefault: true };
      return rest;
    });
    if (templateId === id) setTemplateId('');
  };
  const handleDefault = (id) => setTemplates((prev) => prev.map((t) => ({ ...t, isDefault: t.id === id })));

  useEffect(() => {
    if (!templates.some((t) => t.id === templateId) && templates[0]) setTemplateId(templates[0].id);
  }, [templates, templateId]);

  return (
    <div className="tt-page">
      <style>{TT_CSS}</style>
      <p className="tt-crumb">{breadcrumb}</p>

      <div className="tt-card">
        <div className="tt-head">
          <div>
            <h4 className="tt-title"><i className="bi bi-calendar2-week-fill" /> Session Timetable</h4>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="tt-btn tt-btn--ghost" onClick={onBack}><i className="bi bi-arrow-left" /> Change path</button>
            <button type="button" className="tt-btn" onClick={() => setDrawer('manage')}><i className="bi bi-file-earmark-text" /> Manage Templates</button>
            <button type="button" className="tt-btn tt-btn--solid" onClick={() => setDrawer('create')}><i className="bi bi-plus-lg" /> Create Template</button>
          </div>
        </div>

        {/* Template select */}
        <div style={{ marginTop: 10, maxWidth: 280 }}>
          <label className="tt-label">Select Timetable Template <b>*</b></label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select className="tt-select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {templates.map((t) => {
                const s = summarize(t);
                return <option key={t.id} value={t.id}>{t.name} ({t.mode === 'full' ? 'Full day' : `${s.periods.length} Periods`})</option>;
              })}
            </select>
            {activeTemplate?.isDefault && <span className="tt-badge">Default</span>}
          </div>
        </div>


        {/* Stat cards */}
        <div className="tt-stats">
          <div className="tt-stat"><i className="bi bi-clock" /><div><small>Start Time</small><strong>{cfg.startTime}</strong></div></div>
          <div className="tt-stat"><i className="bi bi-layers" /><div><small>Periods</small><strong>{sum.periods.length}</strong></div></div>
          <div className="tt-stat"><i className="bi bi-stopwatch" /><div><small>Duration</small><strong>{cfg.mode === 'full' ? `${sum.studyMin} minutes` : `${cfg.duration} minutes`}</strong></div></div>
          <div className="tt-stat"><i className="bi bi-cup-hot" /><div><small>Lunch</small><strong>{sum.lunch ? `${sum.lunch.start} - ${sum.lunch.end}` : '—'}</strong></div></div>
          <div className="tt-stat"><i className="bi bi-clock-history" /><div><small>End Time (Auto)</small><strong>{sum.endTime}</strong></div></div>
        </div>

        {/* Date strip */}
        <div className="tt-days">
          <button type="button" className="tt-arrow" onClick={() => shiftWeek(-1)}><i className="bi bi-chevron-left" /></button>
          {weekDays.map((d) => {
            const key = toDateKey(d);
            const count = dayCountMap[key];
            return (
              <button type="button" key={key} className={`tt-day ${key === selectedDate ? 'active' : ''}`} onClick={() => setSelectedDate(key)}>
                <small>{DAY_NAMES[d.getDay()]}</small>
                <strong>{d.getDate()}</strong>
                <em>{count ? `${count} session${count > 1 ? 's' : ''}` : '—'}</em>
              </button>
            );
          })}
          <button type="button" className="tt-arrow" onClick={() => shiftWeek(1)}><i className="bi bi-chevron-right" /></button>
        </div>

        {/* Config row */}
        <div className="tt-config">
          <div><label className="tt-label">Start Time <b>*</b></label>
            <input type="time" className="tt-input" value={cfg.startTime} onChange={(e) => setC('startTime', e.target.value)} /></div>
          <div><label className="tt-label">Number of Periods <b>*</b></label>
            <select className="tt-select" value={cfg.periods} disabled={cfg.mode === 'full'} onChange={(e) => setC('periods', Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select></div>
          <div><label className="tt-label">Duration <b>*</b></label>
            <select className="tt-select" value={cfg.duration} disabled={cfg.mode === 'full'} onChange={(e) => setC('duration', Number(e.target.value))}>
              {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
            </select></div>
          <div><label className="tt-label">Lunch Start</label>
            <input type="time" className="tt-input" value={cfg.lunchStart || ''} disabled={cfg.mode === 'full'} onChange={(e) => setC('lunchStart', e.target.value)} /></div>
          <div><label className="tt-label">Lunch End</label>
            <input type="time" className="tt-input" value={cfg.lunchEnd || ''} disabled={cfg.mode === 'full'} onChange={(e) => setC('lunchEnd', e.target.value)} /></div>
          <button type="button" className="tt-btn tt-btn--solid" style={{ height: 30 }} onClick={() => setCfg(activeTemplate)}>
            <i className="bi bi-arrow-repeat" /> Rebuild
          </button>
        </div>
        <p className="tt-summary">
          {sum.periods.length} classes × {cfg.duration} min · {hrsLabel(sum.studyMin).replace(' hr', '')} study hrs
          {sum.lunch ? ` · lunch ${sum.lunch.start}–${sum.lunch.end}` : ''} · ends {sum.endTime}
        </p>

        {/* Body */}
        <div className="tt-body">
          <div className="tt-side">
            {TRACKS.map((t) => (
              <button type="button" key={t.key} className={`tt-tab ${track === t.key ? 'active' : ''}`}
                onClick={() => { setTrack(t.key); setPickedId(''); }}>
                <i className={`bi ${t.icon}`} /> {t.label}
              </button>
            ))}
            <div className="tt-unscheduled">
              <h6>Not scheduled</h6>
              <p>Click a session, then click Free on a class.</p>
              <div className="tt-session-list">
                {unscheduled.length === 0 && <div className="tt-empty-note">Nothing left to schedule</div>}
                {unscheduled.map((s, i) => (
                  <div key={s.id} className={`tt-session-item ${pickedId === s.id ? 'picked' : ''}`}
                    onClick={() => setPickedId((p) => (p === s.id ? '' : s.id))}>
                    {String(i + 1).padStart(2, '0')} {sessionLabel(s)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="tt-grid">
            {sum.blocks.map((block, idx) => {
              if (block.type === 'lunch') {
                return (
                  <div className="tt-period lunch" key={`lunch-${idx}`}>
                    <h6>Lunch Break</h6>
                    <div className="tt-times">
                      <div><small>Start</small><input value={block.start} readOnly /></div>
                      <div><small>End</small><input value={block.end} readOnly /></div>
                    </div>
                    <div className="tt-hr">{block.minutes} min</div>
                    <button type="button" className="tt-free" disabled>Not Bookable</button>
                  </div>
                );
              }
              const booked = scheduledToday.find((s) => s.startTime === block.start);
              return (
                <div className="tt-period" key={`p-${idx}`}>
                  {booked && <button type="button" className="x" title="Remove session" onClick={() => clearPeriod(booked)}><i className="bi bi-x-lg" /></button>}
                  <h6>{block.label}</h6>
                  <div className="tt-times">
                    <div><small>Start</small><input value={block.start} readOnly /></div>
                    <div><small>End</small><input value={block.end} readOnly /></div>
                  </div>
                  <div className="tt-hr">{hrsLabel(block.minutes)}</div>
                  {booked ? (
                    <div className="tt-assigned">{sessionLabel(booked)}<small>{booked.fieldTrainerName || 'Trainer not assigned'}</small></div>
                  ) : (
                    <button type="button" className={`tt-free ${pickedId ? 'ready' : ''}`} disabled={busy}
                      onClick={() => assignToPeriod(block)}>
                      {pickedId ? 'Assign here' : 'Free'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {drawer === 'create' && (
        <TemplateDrawer onClose={() => setDrawer(null)} onSave={handleSaveTemplate}
          centerOptions={centerOptions} courseOptions={courseOptions} batchOptions={batchOptions} />
      )}
      {drawer && drawer.edit && (
        <TemplateDrawer initial={drawer.edit} onClose={() => setDrawer(null)} onSave={handleSaveTemplate}
          centerOptions={centerOptions} courseOptions={courseOptions} batchOptions={batchOptions} />
      )}
      {drawer === 'manage' && (
        <ManageTemplatesDrawer templates={templates} onClose={() => setDrawer(null)}
          onDelete={handleDeleteTemplate} onDefault={handleDefault} onEdit={(t) => setDrawer({ edit: t })} />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Sample data                                                        */
/* ------------------------------------------------------------------ */
const SAMPLE_LIST_SESSIONS = [
  {
    id: 'dummy-list-1',
    title: 'Communication Skills',
    sessionType: 'student',
    activityTypeName: 'Classroom',
    sessionDate: '2026-10-07',
    startTime: '09:00',
    endTime: '10:00',
    centerName: 'Lucknow Center',
    courseName: 'Digital Marketing',
    courseTrade: 'Digital Marketing',
    batchCode: 'DM Morning',
    fieldTrainerId: '',
    fieldTrainerName: '',
    sample: true,
  },
  {
    id: 'dummy-list-2',
    title: 'Digital Marketing',
    sessionType: 'student',
    activityTypeName: 'Practical',
    sessionDate: '',
    startTime: '',
    endTime: '',
    fieldTrainerId: '',
    fieldTrainerName: '',
    sample: true,
  },
  {
    id: 'dummy-list-3',
    title: 'Mock Interview',
    sessionType: 'tot',
    activityTypeName: 'Interview',
    sessionDate: '2026-10-08',
    startTime: '10:00',
    endTime: '11:00',
    fieldTrainerId: '',
    fieldTrainerName: 'Rahul Sharma',
    sample: true,
  },
  {
    id: 'dummy-list-4',
    title: 'Coding Club',
    sessionType: 'student',
    includeTot: true,
    activityTypeName: 'Club',
    sessionDate: '2026-10-09',
    startTime: '14:45',
    endTime: '15:45',
    fieldTrainerId: '',
    fieldTrainerName: '',
    sample: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Main module                                                        */
/* ------------------------------------------------------------------ */
const SeniorTrainerModule = () => {
  const userData = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);
  const token = userData.token;
  const seniorTrainerId = userData._id || userData.id;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';

  const [permissions, setPermissions] = useState();

  const updatedPermission = async () => {
    const respose = await axios.get(`${backendUrl}/college/permission`, {
      headers: { 'x-auth': token },
    });
    if (respose.data.status) {
      setPermissions(respose.data.permissions);
    }
  };

  useEffect(() => {
    if (token) updatedPermission();
  }, []);

  useEffect(() => {
    if (document.getElementById('st-font-plus-jakarta')) return undefined;
    const link = document.createElement('link');
    link.id = 'st-font-plus-jakarta';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);

  const canBeSeniorTrainerPermission =
    (permissions?.custom_permissions?.can_be_senior_trainer && permissions?.permission_type === 'Custom') ||
    permissions?.permission_type === 'Admin';
  const canBeTrainerPermission =
    (permissions?.custom_permissions?.can_be_trainer && permissions?.permission_type === 'Custom') ||
    permissions?.permission_type === 'Admin';
  const canOpenTimetable = canBeSeniorTrainerPermission || canBeTrainerPermission;

  const [reportDate, setReportDate] = useState(new Date());
  const [filters, setFilters] = useState({
    center: '',
    course: '',
    batch: '',
  });
  const [centerOptions, setCenterOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [allCoursesMeta, setAllCoursesMeta] = useState([]);
  const [allCentersMeta, setAllCentersMeta] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [timetableOpen, setTimetableOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [centerId, setCenterId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [department, setDepartment] = useState([]);
  const [project, setProject] = useState([]);
  const [center, setCenter] = useState([]);
  const [course, setCourse] = useState([]);
  const [batch, setBatch] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [openedSelection, setOpenedSelection] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [sampleSessions, setSampleSessions] = useState(SAMPLE_LIST_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [trainerOptions, setTrainerOptions] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [editSessionId, setEditSessionId] = useState('');

  const pathLabels = useMemo(() => ({
    centerName: getOptionLabel(centerOptions, filters.center),
    courseTrade: getOptionLabel(courseOptions, filters.course),
    batchCode: getOptionLabel(batchOptions, filters.batch),
  }), [filters, centerOptions, courseOptions, batchOptions]);

  const batchSummary = useMemo(() => [
    pathLabels.centerName,
    pathLabels.courseTrade,
    pathLabels.batchCode,
  ].filter(Boolean).join(' · '), [pathLabels]);

  const filteredCourseOptions = useMemo(
    () => getLinkedCourseOptions(filters.center, courseOptions, allCentersMeta, allCoursesMeta),
    [filters.center, allCentersMeta, courseOptions, allCoursesMeta]
  );

  const reloadSessions = useCallback(() => {
    if (!token) {
      const local = filters.batch
        ? filterSessionsForSeniorTrainer(loadCoordinatorSessions(filters.batch), seniorTrainerId)
        : [];
      setSessions(applyPathFilters(local, filters));
      return;
    }

    const courseId = filters.course || '';
    const batchId = filters.batch && !String(filters.batch).startsWith('course:')
      ? filters.batch
      : '';

    fetchCoordinatorSessionsApi(backendUrl, token, courseId
      ? {
        batchId,
        courseId,
        includeCoursePlans: Boolean(batchId),
        excludeScheduled: false,
      }
      : {
        seniorTrainerId: '',
        excludeScheduled: true,
      })
      .then((data) => {
        const mine = courseId ? data : filterSessionsForSeniorTrainer(data, seniorTrainerId);
        setSessions(applyPathFilters(mine, filters));
      })
      .catch((err) => {
        console.error('Failed to load sessions', err);
        const local = filters.batch
          ? filterSessionsForSeniorTrainer(loadCoordinatorSessions(filters.batch), seniorTrainerId)
          : [];
        setSessions(applyPathFilters(local, filters));
      });
  }, [filters, seniorTrainerId, backendUrl, token]);

  useEffect(() => {
    reloadSessions();
    setSelectedSessionId('');
  }, [reloadSessions]);

  useEffect(() => {
    setAssignmentDrafts((prev) => {
      const next = {};
      sessions.forEach((session) => {
        const existing = prev[session.id];
        next[session.id] = {
          assignDate: existing?.assignDate ?? parseSessionDateKey(session),
          trainerId: existing?.trainerId ?? session.fieldTrainerId ?? '',
        };
      });
      return next;
    });
  }, [sessions]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    const fetchTrainers = async () => {
      setLoadingTrainers(true);
      try {
        const res = await axios.get(`${backendUrl}/college/users/training-role-users?roleType=session`, {
          headers: { 'x-auth': token },
        });
        if (cancelled) return;
        const trainers = (res.data?.data || [])
          .filter((trainer) => trainer._id)
          .map((trainer) => ({
            value: String(trainer._id),
            label: trainer.name || trainer.email || 'Trainer',
          }));
        setTrainerOptions(trainers);
      } catch (err) {
        console.error('Failed to fetch trainers:', err);
        if (!cancelled) setTrainerOptions([]);
      } finally {
        if (!cancelled) setLoadingTrainers(false);
      }
    };

    fetchTrainers();
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  const editingSession = useMemo(
    () => [...sampleSessions, ...sessions].find((session) => session.id === editSessionId) || null,
    [sampleSessions, sessions, editSessionId]
  );

  const handleOpenEditModal = useCallback((sessionId) => {
    setEditSessionId(resolveSessionSelectionId(sessionId));
  }, []);

  const handleCloseEditModal = useCallback(() => setEditSessionId(''), []);

  const handleModalSave = useCallback(async (sessionId, {
    center,
    course,
    batch,
    assignDate,
    trainerId,
    centerName,
    courseName,
    batchCode,
  }) => {
    const trainerName = trainerId
      ? (trainerOptions.find((trainer) => String(trainer.value) === String(trainerId))?.label || '')
      : '';
    const formattedDate = formatSessionDate(assignDate);
    const workflowStatus = trainerId ? WORKFLOW_STATUS.ASSIGNED : WORKFLOW_STATUS.SENT_TO_SENIOR;
    const applyAssignment = (session) => ({
      ...session,
      center: center || session.center,
      course: course || session.course,
      batch: batch || session.batch,
      centerName: centerName || session.centerName,
      courseName: courseName || session.courseName,
      courseTrade: courseName || session.courseTrade,
      batchCode: batchCode || session.batchCode,
      fieldTrainerId: trainerId,
      fieldTrainerName: trainerName || (trainerId ? session.fieldTrainerName : '') || '',
      sessionDate: assignDate || session.sessionDate,
      date: formattedDate || session.date,
      workflowStatus: trainerId
        ? WORKFLOW_STATUS.ASSIGNED
        : (session.workflowStatus === WORKFLOW_STATUS.ASSIGNED
          ? WORKFLOW_STATUS.SENT_TO_SENIOR
          : session.workflowStatus),
    });

    if (String(sessionId).startsWith('dummy-list-')) {
      setSampleSessions((prevSessions) => prevSessions.map((session) => (
        session.id === sessionId ? applyAssignment(session) : session
      )));
      setAssignmentDrafts((prev) => ({
        ...prev,
        [sessionId]: { assignDate, trainerId },
      }));
      return;
    }

    setSessions((prevSessions) => prevSessions.map((session) => {
      if (session.id !== sessionId) return session;
      return {
        ...session,
        center: center || session.center,
        course: course || session.course,
        batch: batch || session.batch,
        centerName: centerName || session.centerName,
        courseName: courseName || session.courseName,
        courseTrade: courseName || session.courseTrade,
        batchCode: batchCode || session.batchCode,
        fieldTrainerId: trainerId,
        fieldTrainerName: trainerName || session.fieldTrainerName || '',
        sessionDate: assignDate || session.sessionDate,
        date: formattedDate || session.date,
        workflowStatus: trainerId
          ? WORKFLOW_STATUS.ASSIGNED
          : (session.workflowStatus === WORKFLOW_STATUS.ASSIGNED
            ? WORKFLOW_STATUS.SENT_TO_SENIOR
            : session.workflowStatus),
      };
    }));

    setAssignmentDrafts((prev) => ({
      ...prev,
      [sessionId]: { assignDate, trainerId },
    }));

    if (token) {
      try {
        await patchCoordinatorSessionApi(backendUrl, token, sessionId, {
          center: center || undefined,
          course: course || undefined,
          batch: batch || undefined,
          centerName: centerName || undefined,
          courseName: courseName || undefined,
          batchCode: batchCode || undefined,
          fieldTrainerId: trainerId,
          fieldTrainerName: trainerName,
          sessionDate: assignDate || undefined,
          date: formattedDate || undefined,
          workflowStatus,
        });
      } catch (err) {
        console.error('Failed to save assignment', err);
        throw err;
      }
    }
  }, [trainerOptions, backendUrl, token]);

  const handleAssignPeriod = useCallback(async (sessionId, {
    assignDate = '',
    startTime = '',
    endTime = '',
    timetableType = 'course',
  }) => {
    const sourceId = resolveSessionSelectionId(sessionId);
    const formattedDate = assignDate ? formatSessionDate(assignDate) : '';

    if (token) {
      await patchCoordinatorSessionApi(backendUrl, token, sourceId, {
        sessionDate: assignDate || null,
        date: formattedDate,
        startTime,
        endTime,
        timetableType,
      });
    }

    setSessions((prevSessions) => prevSessions.map((session) => {
      if (resolveSessionSelectionId(session.id) !== sourceId) return session;
      return {
        ...session,
        sessionDate: assignDate,
        date: formattedDate,
        startTime,
        endTime,
        timetableType,
      };
    }));
    setAssignmentDrafts((prev) => ({
      ...prev,
      [sourceId]: {
        ...(prev[sourceId] || {}),
        assignDate,
      },
    }));
  }, [backendUrl, token]);

  useEffect(() => {
    const onFocus = () => reloadSessions();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reloadSessions]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key?.startsWith(AC_SESSIONS_STORAGE_PREFIX)) reloadSessions();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [reloadSessions]);

  useEffect(() => {
    if (!token) {
      setLoadingCenters(false);
      return undefined;
    }
    const requestConfig = { headers: { 'x-auth': token } };
    let cancelled = false;

    const fetchFilterOptions = async () => {
      setLoadingCenters(true);
      try {
        const [centersRes, coursesRes, filtersRes] = await Promise.allSettled([
          axios.get(`${backendUrl}/college/list_all_centers`, requestConfig),
          axios.get(`${backendUrl}/college/all_courses`, requestConfig),
          axios.get(`${backendUrl}/college/filters-data`, requestConfig),
        ]);
        if (cancelled) return;

        if (centersRes.status === 'fulfilled' && centersRes.value.data?.success) {
          const centers = centersRes.value.data.data || [];
          setAllCentersMeta(centers);
          setCenterOptions(mapApiOptions(centers));
        } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
          const centers = filtersRes.value.data.centers || [];
          setAllCentersMeta(centers);
          setCenterOptions(mapApiOptions(centers));
        }

        if (coursesRes.status === 'fulfilled' && coursesRes.value.data?.success) {
          const courses = coursesRes.value.data.data || [];
          setAllCoursesMeta(courses);
          setCourseOptions(mapApiOptions(courses));
        } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
          const courses = filtersRes.value.data.courses || [];
          setAllCoursesMeta(courses);
          setCourseOptions(mapApiOptions(courses));
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      } finally {
        if (!cancelled) setLoadingCenters(false);
      }
    };

    fetchFilterOptions();
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  useEffect(() => {
    if (!filters.center) {
      setLoadingCourses(false);
      return;
    }
    setLoadingCourses(true);
    const timer = setTimeout(() => setLoadingCourses(false), 150);
    return () => clearTimeout(timer);
  }, [filters.center]);

  useEffect(() => {
    if (!token) {
      setLoadingDepartments(false);
      return undefined;
    }
    let cancelled = false;
    const loadDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const response = await axios.get(`${backendUrl}/college/getVerticals`, {
          headers: { 'x-auth': token },
        });
        if (cancelled) return;
        setDepartment((response.data?.data || []).map((item) => ({
          value: String(item._id),
          label: item.name || 'Untitled department',
        })));
      } catch (err) {
        console.error('Failed to load departments', err);
        if (!cancelled) setDepartment([]);
      } finally {
        if (!cancelled) setLoadingDepartments(false);
      }
    };
    loadDepartments();
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  useEffect(() => {
    if (!token || !departmentId) {
      setProject([]);
      return undefined;
    }
    let cancelled = false;
    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await axios.get(`${backendUrl}/college/list-projects`, {
          headers: { 'x-auth': token },
          params: { vertical: departmentId },
        });
        if (cancelled) return;
        setProject((response.data?.data || []).map((item) => ({
          value: String(item._id),
          label: item.name || 'Project',
        })));
      } catch (err) {
        console.error('Failed to load projects', err);
        if (!cancelled) setProject([]);
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    };
    loadProjects();
    return () => { cancelled = true; };
  }, [departmentId, backendUrl, token]);

  useEffect(() => {
    if (!token || !projectId) {
      setCenter([]);
      return undefined;
    }
    let cancelled = false;
    const loadCenters = async () => {
      setLoadingCenters(true);
      try {
        const response = await axios.get(`${backendUrl}/college/list-centers`, {
          headers: { 'x-auth': token },
          params: { projectId: projectId },
        });
        if (cancelled) return;
        setCenter((response.data?.data || []).map((item) => ({
          value: String(item._id),
          label: item.name || 'Center',
        })));
      } catch (err) {
        console.error('Failed to load centers', err);
        if (!cancelled) setCenter([]);
      } finally {
        if (!cancelled) setLoadingCenters(false);
      }
    };
    loadCenters();
    return () => { cancelled = true; };
  }, [projectId, backendUrl, token]);

  useEffect(() => {
    if (!token || !projectId || !centerId) {
      setCourse([]);
      return undefined;
    }
    let cancelled = false;
    const loadCourses = async () => {
      setLoadingCourses(true);
      try {
        const response = await axios.get(`${backendUrl}/college/all_coursescopy_centerwise`, {
          headers: { 'x-auth': token },
          params: { projectId: projectId, centerId: centerId },
        });
        if (cancelled) return;
        setCourse((response.data?.data || []).map((item) => ({
          value: String(item._id),
          label: item.name || 'Course',
        })));
      } catch (err) {
        console.error('Failed to load courses', err);
        if (!cancelled) setCourse([]);
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    };
    loadCourses();
    return () => { cancelled = true; };
  }, [projectId, centerId, backendUrl, token]);

  useEffect(() => {
    if (!token || !courseId || !centerId) {
      setBatch([]);
      return undefined;
    }
    let cancelled = false;
    const loadDraftBatches = async () => {
      setLoadingBatches(true);
      try {
        const res = await axios.get(`${backendUrl}/college/get_batches`, {
          headers: { 'x-auth': token },
          params: { courseId: courseId, centerId: centerId },
        });
        if (cancelled) return;
        const rows = (res.data?.data || []).map((batch) => ({
          value: String(batch._id),
          label: batch.name || 'Batch',
        }));
        setBatch(rows);
        setBatchId((current) => (rows.some((row) => row.value === current) ? current : ''));
      } catch (err) {
        console.error('Failed to load course batches', err);
        if (!cancelled) setBatch([]);
      } finally {
        if (!cancelled) setLoadingBatches(false);
      }
    };
    loadDraftBatches();
    return () => { cancelled = true; };
  }, [courseId, centerId, token, backendUrl]);

  useEffect(() => {
    if (!token || !filters.course) {
      setBatchOptions([]);
      return undefined;
    }
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const params = new URLSearchParams();
        params.set('courseId', filters.course);
        if (filters.center) params.set('centerId', filters.center);
        const res = await axios.get(`${backendUrl}/college/get_batches?${params.toString()}`, {
          headers: { 'x-auth': token },
        });
        if (res.data?.success) {
          setBatchOptions((res.data.data || []).map((batch) => ({
            value: String(batch._id),
            label: batch.name,
          })));
        } else {
          setBatchOptions([]);
        }
      } catch {
        setBatchOptions([]);
      } finally {
        setLoadingBatches(false);
      }
    };
    fetchBatches();
    return undefined;
  }, [filters.center, filters.course, token, backendUrl]);

  const handleFilterChange = (key, value) => {
    if (key === 'center') {
      setFilters({ center: value, course: '', batch: '' });
      setSelectedSessionId('');
      return;
    }
    if (key === 'course') {
      setFilters((prev) => ({ ...prev, course: value, batch: '' }));
      setSelectedSessionId('');
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedSessionId('');
  };

  const handleFilterReset = () => {
    setFilters({ center: '', course: '', batch: '' });
    setSelectedSessionId('');
  };

  const handleDraftDepartmentChange = (value) => {
    setDepartmentId(value);
    setProjectId('');
    setCenterId('');
    setCourseId('');
    setBatchId('');
    setSearchMessage('');
  };

  const handleDraftProjectChange = (value) => {
    setProjectId(value);
    setCenterId('');
    setCourseId('');
    setBatchId('');
    setSearchMessage('');
  };

  const handleDraftCenterChange = (value) => {
    setCenterId(value);
    setCourseId('');
    setBatchId('');
    setSearchMessage('');
  };

  const handleDraftCourseChange = (value) => {
    setCourseId(value);
    setBatchId('');
    setSearchMessage('');
  };

  const handleTimetableSearch = (event) => {
    event.preventDefault();
    if (!departmentId || !projectId || !centerId || !courseId || !batchId) {
      setSearchMessage('Select department, project, center, course, and batch.');
      return;
    }
    const selectedDepartment = department.find((item) => item.value === departmentId);
    const selectedProject = project.find((item) => item.value === projectId);
    const selectedCenter = center.find((item) => item.value === centerId);
    const selectedCourse = course.find((item) => item.value === courseId);
    const selectedBatch = batch.find((item) => item.value === batchId);
    setSearchMessage('');
    setOpenedSelection({
      departmentName: selectedDepartment?.label || 'Department',
      projectName: selectedProject?.label || 'Project',
      centerName: selectedCenter?.label || 'Center',
      courseName: selectedCourse?.label || 'Course',
      batchName: selectedBatch?.label || 'Batch',
    });
    setFilters({ center: centerId, course: courseId, batch: batchId });
    setSelectedSessionId('');
    setTimetableOpen(true);
  };

  const handleTimetableBack = () => {
    setTimetableOpen(false);
    setFilters({ center: '', course: '', batch: '' });
    setSelectedSessionId('');
  };

  const totSessions = useMemo(
    () => sessions.filter((session) => isTotSession(session)).map(mapSessionForTotCalendar),
    [sessions]
  );

  const studentSessions = useMemo(
    () => sessions.filter((session) => appearsOnStudentCalendar(session)),
    [sessions]
  );

  const tableSessions = useMemo(() => sortSessionsByDate(sessions), [sessions]);

  const listSessions = useMemo(
    () => [...sampleSessions, ...tableSessions],
    [sampleSessions, tableSessions]
  );

  const selectedSession = useMemo(() => {
    const resolvedId = resolveSessionSelectionId(selectedSessionId);
    return listSessions.find((session) => session.id === resolvedId) || null;
  }, [listSessions, selectedSessionId]);

  const handleSelectSession = (sessionId) => {
    const resolvedId = resolveSessionSelectionId(sessionId);
    setSelectedSessionId((prev) => (resolveSessionSelectionId(prev) === resolvedId ? '' : resolvedId));
  };

  if (permissions && !canBeSeniorTrainerPermission) {
    return (
      <div className="st-portal">
        <style>{ST_CSS}</style>
        <div style={{ marginTop: 40, textAlign: 'center', padding: 48 }}>
          <i className="fas fa-lock" style={{ fontSize: 32, color: '#94a3b8', marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 8px' }}>Access denied</h3>
          <p style={{ margin: 0, color: '#64748b' }}>
            You need <strong>Senior Trainer</strong> permission (or Admin) to use this module.
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- Step 1: choose path (restyled) ---------------- */
  if (!timetableOpen) {
    return (
      <div className="tt-page">
        <style>{TT_CSS}</style>
        <div className="tt-card">
          <div className="tt-head">
            <div>
              <h4 className="tt-title"><i className="bi bi-calendar2-week-fill" /> Batch Time Table</h4>
              <p className="tt-sub">Choose department, project, center, course and batch to open the timetable</p>
            </div>
          </div>

          <form onSubmit={handleTimetableSearch}>
            <div className="tt-search">
              <label>
                <span className="tt-label">Department</span>
                <select className="tt-select" value={departmentId} onChange={(e) => handleDraftDepartmentChange(e.target.value)} disabled={loadingDepartments}>
                  <option value="">{loadingDepartments ? 'Loading...' : 'Select department'}</option>
                  {department.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="tt-label">Project</span>
                <select className="tt-select" value={projectId} onChange={(e) => handleDraftProjectChange(e.target.value)} disabled={!departmentId || loadingProjects}>
                  <option value="">{!departmentId ? 'Select department first' : loadingProjects ? 'Loading...' : 'Select project'}</option>
                  {project.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="tt-label">Center</span>
                <select className="tt-select" value={centerId} onChange={(e) => handleDraftCenterChange(e.target.value)} disabled={!projectId || loadingCenters}>
                  <option value="">{!projectId ? 'Select project first' : loadingCenters ? 'Loading...' : 'Select center'}</option>
                  {center.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="tt-label">Course</span>
                <select className="tt-select" value={courseId} onChange={(e) => handleDraftCourseChange(e.target.value)} disabled={!centerId || loadingCourses}>
                  <option value="">{!centerId ? 'Select center first' : loadingCourses ? 'Loading...' : 'Select course'}</option>
                  {course.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="tt-label">Batch</span>
                <select
                  className="tt-select"
                  value={batchId}
                  onChange={(e) => {
                    setBatchId(e.target.value);
                    setSearchMessage('');
                  }}
                  disabled={!courseId || loadingBatches}
                >
                  <option value="">
                    {!courseId
                      ? 'Select course first'
                      : loadingBatches
                        ? 'Loading...'
                        : batch.length
                          ? 'Select batch'
                          : 'No batches'}
                  </option>
                  {batch.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="tt-btn tt-btn--solid" style={{ height: 38 }}>
                <i className="bi bi-search" /> Search
              </button>
            </div>
            {searchMessage && <p className="text-danger mt-2 mb-0" style={{ fontSize: 12 }}>{searchMessage}</p>}
          </form>

          <div className="tt-search-empty">
            <i className="bi bi-funnel" />
            <h5>Search to see the time table</h5>
            <p>Choose department, project, center, course, then batch.</p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Step 2: timetable ---------------- */
  const breadcrumb = openedSelection
    ? [openedSelection.departmentName, openedSelection.projectName, openedSelection.centerName, openedSelection.courseName, openedSelection.batchName]
      .filter(Boolean).join(' · ')
    : '';

  return (
    <div className="st-portal">
      <style>{ST_CSS}</style>

      <SessionTimetableBuilder
        breadcrumb={breadcrumb}
        sessions={sessions}
        onAssignPeriod={handleAssignPeriod}
        onBack={handleTimetableBack}
        centerOptions={centerOptions}
        courseOptions={courseOptions}
        batchOptions={batchOptions}
      />

      <div className="st-stats-row">
        <div className="st-stat">
          <strong>{sessions.filter((s) => isTotSession(s)).length}</strong>
          <span>TOT plans</span>
        </div>
        <div className="st-stat st-stat--green">
          <strong>{sessions.filter((s) => appearsOnStudentCalendar(s)).length}</strong>
          <span>Student sessions</span>
        </div>
        <div className="st-stat st-stat--amber">
          <strong>{sessions.filter((s) => s.workflowStatus === WORKFLOW_STATUS.SENT_TO_SENIOR).length}</strong>
          <span>Sent for review</span>
        </div>
      </div>

      <div className="st-workspace">
        <div className="st-dual-calendars">
          <TrainingCalendar
            title="TOT Calendar"
            icon="fa-chalkboard-teacher"
            accent={BLUE}
            sessions={totSessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
          />
          <TrainingCalendar
            title="Session Calendar"
            icon="fa-user-graduate"
            accent={GREEN}
            sessions={studentSessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
          />
        </div>

        <SessionTable
          sessions={listSessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={handleSelectSession}
          filters={filters}
          centerOptions={centerOptions}
          courseOptions={filteredCourseOptions}
          batchOptions={batchOptions}
          loadingCenters={loadingCenters}
          loadingCourses={loadingCourses}
          loadingBatches={loadingBatches}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          hideFilters
          assignmentDrafts={assignmentDrafts}
          trainerOptions={trainerOptions}
          loadingTrainers={loadingTrainers}
          onEditSession={handleOpenEditModal}
        />

        <div className="st-detail-panel">
          {selectedSession ? (
            <SeniorSessionCard
              key={selectedSession.id}
              session={selectedSession}
              token={token}
              backendUrl={backendUrl}
              onSessionUpdated={(savedSession) => {
                if (!savedSession?.id && !savedSession?._id) return;
                const sessionId = String(savedSession.id || savedSession._id);
                setSessions((prev) => prev.map((item) => (
                  String(item.id) === sessionId
                    ? { ...item, ...savedSession, id: sessionId }
                    : item
                )));
              }}
            />
          ) : (
            <div className="st-detail-empty">
              <i className="fas fa-hand-pointer" />
              <h4>Select a session</h4>
              <p>Click any session cell on the Session or TOT grid, or a row in the table, to view its full plan card.</p>
              {!filters.batch && sessions.length === 0 && (
                <p className="st-detail-empty__hint">
                  No referred sessions yet. Ask Academic Coordinator to refer a plan to your account.
                </p>
              )}
              {filters.batch && !totSessions.length && !studentSessions.length && (
                <p className="st-detail-empty__hint">
                  No sessions match this Center/Course/Batch filter. Clear filters to see all referred plans.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {editingSession && (
        <SessionAssignModal
          session={editingSession}
          centerOptions={centerOptions}
          courseOptions={courseOptions}
          allCentersMeta={allCentersMeta}
          allCoursesMeta={allCoursesMeta}
          trainerOptions={trainerOptions}
          loadingTrainers={loadingTrainers}
          backendUrl={backendUrl}
          token={token}
          lockedPath={filters.course && filters.batch ? {
            center: filters.center || editingSession.center || '',
            centerName: openedSelection?.centerName || editingSession.centerName || '',
            course: filters.course,
            courseName: openedSelection?.courseName || editingSession.courseName || '',
            batch: filters.batch,
            batchName: openedSelection?.batchName || editingSession.batchCode || '',
          } : null}
          onClose={handleCloseEditModal}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default SeniorTrainerModule;




// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import axios from 'axios';
// import '../ProjectMangement/listView.css';
// import {
//   BLUE,
//   GREEN,
//   AC_SESSIONS_STORAGE_PREFIX,
//   WORKFLOW_STATUS,
//   getOptionLabel,
//   mapApiOptions,
//   getLinkedCourseOptions,
//   formatSessionDate,
//   fetchCoordinatorSessionsApi,
//   patchCoordinatorSessionApi,
//   loadCoordinatorSessions,
//   filterSessionsForSeniorTrainer,
//   applyPathFilters,
//   parseSessionDateKey,
//   isTotSession,
//   appearsOnStudentCalendar,
//   mapSessionForTotCalendar,
//   resolveSessionSelectionId,
//   sortSessionsByDate,
//   ST_CSS,
// } from './seniorTrainer/seniorTrainerShared';
// import TrainingCalendar from './seniorTrainer/TrainingCalendar';
// import SessionDayTimetable from './seniorTrainer/SessionDayTimetable';
// import SessionTable from './seniorTrainer/SessionTable';
// import SessionAssignModal from './seniorTrainer/SessionAssignModal';
// import SeniorSessionCard from './seniorTrainer/SeniorSessionCard';

// const SAMPLE_LIST_SESSIONS = [
//   {
//     id: 'dummy-list-1',
//     title: 'Communication Skills',
//     sessionType: 'student',
//     activityTypeName: 'Classroom',
//     sessionDate: '2026-10-07',
//     startTime: '09:00',
//     endTime: '10:00',
//     centerName: 'Lucknow Center',
//     courseName: 'Digital Marketing',
//     courseTrade: 'Digital Marketing',
//     batchCode: 'DM Morning',
//     fieldTrainerId: '',
//     fieldTrainerName: '',
//     sample: true,
//   },
//   {
//     id: 'dummy-list-2',
//     title: 'Digital Marketing',
//     sessionType: 'student',
//     activityTypeName: 'Practical',
//     sessionDate: '',
//     startTime: '',
//     endTime: '',
//     fieldTrainerId: '',
//     fieldTrainerName: '',
//     sample: true,
//   },
//   {
//     id: 'dummy-list-3',
//     title: 'Mock Interview',
//     sessionType: 'tot',
//     activityTypeName: 'Interview',
//     sessionDate: '2026-10-08',
//     startTime: '10:00',
//     endTime: '11:00',
//     fieldTrainerId: '',
//     fieldTrainerName: 'Rahul Sharma',
//     sample: true,
//   },
//   {
//     id: 'dummy-list-4',
//     title: 'Coding Club',
//     sessionType: 'student',
//     includeTot: true,
//     activityTypeName: 'Club',
//     sessionDate: '2026-10-09',
//     startTime: '14:45',
//     endTime: '15:45',
//     fieldTrainerId: '',
//     fieldTrainerName: '',
//     sample: true,
//   },
// ];

// const SeniorTrainerModule = () => {
//   const userData = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);
//   const token = userData.token;
//   const seniorTrainerId = userData._id || userData.id;
//   const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';

//   const [permissions, setPermissions] = useState();

//   const updatedPermission = async () => {
//     const respose = await axios.get(`${backendUrl}/college/permission`, {
//       headers: { 'x-auth': token },
//     });
//     if (respose.data.status) {
//       setPermissions(respose.data.permissions);
//     }
//   };

//   useEffect(() => {
//     if (token) updatedPermission();
//   }, []);

//   useEffect(() => {
//     if (document.getElementById('st-font-plus-jakarta')) return undefined;
//     const link = document.createElement('link');
//     link.id = 'st-font-plus-jakarta';
//     link.rel = 'stylesheet';
//     link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap';
//     document.head.appendChild(link);
//   }, []);

//   const canBeSeniorTrainerPermission =
//     (permissions?.custom_permissions?.can_be_senior_trainer && permissions?.permission_type === 'Custom') ||
//     permissions?.permission_type === 'Admin';
//   const canBeTrainerPermission =
//     (permissions?.custom_permissions?.can_be_trainer && permissions?.permission_type === 'Custom') ||
//     permissions?.permission_type === 'Admin';
//   const canOpenTimetable = canBeSeniorTrainerPermission || canBeTrainerPermission;

//   const [reportDate, setReportDate] = useState(new Date());
//   const [filters, setFilters] = useState({
//     center: '',
//     course: '',
//     batch: '',
//   });
//   const [centerOptions, setCenterOptions] = useState([]);
//   const [courseOptions, setCourseOptions] = useState([]);
//   const [batchOptions, setBatchOptions] = useState([]);
//   const [allCoursesMeta, setAllCoursesMeta] = useState([]);
//   const [allCentersMeta, setAllCentersMeta] = useState([]);
//   const [loadingCenters, setLoadingCenters] = useState(false);
//   const [loadingCourses, setLoadingCourses] = useState(false);
//   const [loadingBatches, setLoadingBatches] = useState(false);
//   const [timetableOpen, setTimetableOpen] = useState(false);
//   const [departmentId, setDepartmentId] = useState('');
//   const [projectId, setProjectId] = useState('');
//   const [centerId, setCenterId] = useState('');
//   const [courseId, setCourseId] = useState('');
//   const [batchId, setBatchId] = useState('');
//   const [department, setDepartment] = useState([]);
//   const [project, setProject] = useState([]);
//   const [center, setCenter] = useState([]);
//   const [course, setCourse] = useState([]);
//   const [batch, setBatch] = useState([]);
//   const [loadingDepartments, setLoadingDepartments] = useState(true);
//   const [loadingProjects, setLoadingProjects] = useState(false);
//   const [searchMessage, setSearchMessage] = useState('');
//   const [openedSelection, setOpenedSelection] = useState(null);

//   const [sessions, setSessions] = useState([]);
//   const [sampleSessions, setSampleSessions] = useState(SAMPLE_LIST_SESSIONS);
//   const [selectedSessionId, setSelectedSessionId] = useState('');
//   const [assignmentDrafts, setAssignmentDrafts] = useState({});
//   const [trainerOptions, setTrainerOptions] = useState([]);
//   const [loadingTrainers, setLoadingTrainers] = useState(false);
//   const [editSessionId, setEditSessionId] = useState('');

//   const pathLabels = useMemo(() => ({
//     centerName: getOptionLabel(centerOptions, filters.center),
//     courseTrade: getOptionLabel(courseOptions, filters.course),
//     batchCode: getOptionLabel(batchOptions, filters.batch),
//   }), [filters, centerOptions, courseOptions, batchOptions]);

//   const batchSummary = useMemo(() => [
//     pathLabels.centerName,
//     pathLabels.courseTrade,
//     pathLabels.batchCode,
//   ].filter(Boolean).join(' · '), [pathLabels]);

//   const filteredCourseOptions = useMemo(
//     () => getLinkedCourseOptions(filters.center, courseOptions, allCentersMeta, allCoursesMeta),
//     [filters.center, allCentersMeta, courseOptions, allCoursesMeta]
//   );

//   const reloadSessions = useCallback(() => {
//     if (!token) {
//       const local = filters.batch
//         ? filterSessionsForSeniorTrainer(loadCoordinatorSessions(filters.batch), seniorTrainerId)
//         : [];
//       setSessions(applyPathFilters(local, filters));
//       return;
//     }

//     const courseId = filters.course || '';
//     const batchId = filters.batch && !String(filters.batch).startsWith('course:')
//       ? filters.batch
//       : '';

//     fetchCoordinatorSessionsApi(backendUrl, token, courseId
//       ? {
//         batchId,
//         courseId,
//         includeCoursePlans: Boolean(batchId),
//         excludeScheduled: false,
//       }
//       : {
//         seniorTrainerId: '',
//         excludeScheduled: true,
//       })
//       .then((data) => {
//         const mine = courseId ? data : filterSessionsForSeniorTrainer(data, seniorTrainerId);
//         setSessions(applyPathFilters(mine, filters));
//       })
//       .catch((err) => {
//         console.error('Failed to load sessions', err);
//         const local = filters.batch
//           ? filterSessionsForSeniorTrainer(loadCoordinatorSessions(filters.batch), seniorTrainerId)
//           : [];
//         setSessions(applyPathFilters(local, filters));
//       });
//   }, [filters, seniorTrainerId, backendUrl, token]);

//   useEffect(() => {
//     reloadSessions();
//     setSelectedSessionId('');
//   }, [reloadSessions]);

//   useEffect(() => {
//     setAssignmentDrafts((prev) => {
//       const next = {};
//       sessions.forEach((session) => {
//         const existing = prev[session.id];
//         next[session.id] = {
//           assignDate: existing?.assignDate ?? parseSessionDateKey(session),
//           trainerId: existing?.trainerId ?? session.fieldTrainerId ?? '',
//         };
//       });
//       return next;
//     });
//   }, [sessions]);

//   useEffect(() => {
//     if (!token) return undefined;
//     let cancelled = false;

//     const fetchTrainers = async () => {
//       setLoadingTrainers(true);
//       try {
//         const res = await axios.get(`${backendUrl}/college/users/training-role-users?roleType=session`, {
//           headers: { 'x-auth': token },
//         });
//         if (cancelled) return;
//         const trainers = (res.data?.data || [])
//           .filter((trainer) => trainer._id)
//           .map((trainer) => ({
//             value: String(trainer._id),
//             label: trainer.name || trainer.email || 'Trainer',
//           }));
//         setTrainerOptions(trainers);
//       } catch (err) {
//         console.error('Failed to fetch trainers:', err);
//         if (!cancelled) setTrainerOptions([]);
//       } finally {
//         if (!cancelled) setLoadingTrainers(false);
//       }
//     };

//     fetchTrainers();
//     return () => { cancelled = true; };
//   }, [backendUrl, token]);

//   const editingSession = useMemo(
//     () => [...sampleSessions, ...sessions].find((session) => session.id === editSessionId) || null,
//     [sampleSessions, sessions, editSessionId]
//   );

//   const handleOpenEditModal = useCallback((sessionId) => {
//     setEditSessionId(resolveSessionSelectionId(sessionId));
//   }, []);

//   const handleCloseEditModal = useCallback(() => setEditSessionId(''), []);

//   const handleModalSave = useCallback(async (sessionId, {
//     center,
//     course,
//     batch,
//     assignDate,
//     trainerId,
//     centerName,
//     courseName,
//     batchCode,
//   }) => {
//     const trainerName = trainerId
//       ? (trainerOptions.find((trainer) => String(trainer.value) === String(trainerId))?.label || '')
//       : '';
//     const formattedDate = formatSessionDate(assignDate);
//     const workflowStatus = trainerId ? WORKFLOW_STATUS.ASSIGNED : WORKFLOW_STATUS.SENT_TO_SENIOR;
//     const applyAssignment = (session) => ({
//       ...session,
//       center: center || session.center,
//       course: course || session.course,
//       batch: batch || session.batch,
//       centerName: centerName || session.centerName,
//       courseName: courseName || session.courseName,
//       courseTrade: courseName || session.courseTrade,
//       batchCode: batchCode || session.batchCode,
//       fieldTrainerId: trainerId,
//       fieldTrainerName: trainerName || (trainerId ? session.fieldTrainerName : '') || '',
//       sessionDate: assignDate || session.sessionDate,
//       date: formattedDate || session.date,
//       workflowStatus: trainerId
//         ? WORKFLOW_STATUS.ASSIGNED
//         : (session.workflowStatus === WORKFLOW_STATUS.ASSIGNED
//           ? WORKFLOW_STATUS.SENT_TO_SENIOR
//           : session.workflowStatus),
//     });

//     if (String(sessionId).startsWith('dummy-list-')) {
//       setSampleSessions((prevSessions) => prevSessions.map((session) => (
//         session.id === sessionId ? applyAssignment(session) : session
//       )));
//       setAssignmentDrafts((prev) => ({
//         ...prev,
//         [sessionId]: { assignDate, trainerId },
//       }));
//       return;
//     }

//     setSessions((prevSessions) => prevSessions.map((session) => {
//       if (session.id !== sessionId) return session;
//       return {
//         ...session,
//         center: center || session.center,
//         course: course || session.course,
//         batch: batch || session.batch,
//         centerName: centerName || session.centerName,
//         courseName: courseName || session.courseName,
//         courseTrade: courseName || session.courseTrade,
//         batchCode: batchCode || session.batchCode,
//         fieldTrainerId: trainerId,
//         fieldTrainerName: trainerName || session.fieldTrainerName || '',
//         sessionDate: assignDate || session.sessionDate,
//         date: formattedDate || session.date,
//         workflowStatus: trainerId
//           ? WORKFLOW_STATUS.ASSIGNED
//           : (session.workflowStatus === WORKFLOW_STATUS.ASSIGNED
//             ? WORKFLOW_STATUS.SENT_TO_SENIOR
//             : session.workflowStatus),
//       };
//     }));

//     setAssignmentDrafts((prev) => ({
//       ...prev,
//       [sessionId]: { assignDate, trainerId },
//     }));

//     if (token) {
//       try {
//         await patchCoordinatorSessionApi(backendUrl, token, sessionId, {
//           center: center || undefined,
//           course: course || undefined,
//           batch: batch || undefined,
//           centerName: centerName || undefined,
//           courseName: courseName || undefined,
//           batchCode: batchCode || undefined,
//           fieldTrainerId: trainerId,
//           fieldTrainerName: trainerName,
//           sessionDate: assignDate || undefined,
//           date: formattedDate || undefined,
//           workflowStatus,
//         });
//       } catch (err) {
//         console.error('Failed to save assignment', err);
//         throw err;
//       }
//     }
//   }, [trainerOptions, backendUrl, token]);

//   const handleAssignPeriod = useCallback(async (sessionId, {
//     assignDate = '',
//     startTime = '',
//     endTime = '',
//     timetableType = 'course',
//   }) => {
//     const sourceId = resolveSessionSelectionId(sessionId);
//     const formattedDate = assignDate ? formatSessionDate(assignDate) : '';

//     if (token) {
//       await patchCoordinatorSessionApi(backendUrl, token, sourceId, {
//         sessionDate: assignDate || null,
//         date: formattedDate,
//         startTime,
//         endTime,
//         timetableType,
//       });
//     }

//     setSessions((prevSessions) => prevSessions.map((session) => {
//       if (resolveSessionSelectionId(session.id) !== sourceId) return session;
//       return {
//         ...session,
//         sessionDate: assignDate,
//         date: formattedDate,
//         startTime,
//         endTime,
//         timetableType,
//       };
//     }));
//     setAssignmentDrafts((prev) => ({
//       ...prev,
//       [sourceId]: {
//         ...(prev[sourceId] || {}),
//         assignDate,
//       },
//     }));
//   }, [backendUrl, token]);

//   useEffect(() => {
//     const onFocus = () => reloadSessions();
//     window.addEventListener('focus', onFocus);
//     return () => window.removeEventListener('focus', onFocus);
//   }, [reloadSessions]);

//   useEffect(() => {
//     const onStorage = (event) => {
//       if (event.key?.startsWith(AC_SESSIONS_STORAGE_PREFIX)) reloadSessions();
//     };
//     window.addEventListener('storage', onStorage);
//     return () => window.removeEventListener('storage', onStorage);
//   }, [reloadSessions]);

//   useEffect(() => {
//     if (!token) {
//       setLoadingCenters(false);
//       return undefined;
//     }
//     const requestConfig = { headers: { 'x-auth': token } };
//     let cancelled = false;

//     const fetchFilterOptions = async () => {
//       setLoadingCenters(true);
//       try {
//         const [centersRes, coursesRes, filtersRes] = await Promise.allSettled([
//           axios.get(`${backendUrl}/college/list_all_centers`, requestConfig),
//           axios.get(`${backendUrl}/college/all_courses`, requestConfig),
//           axios.get(`${backendUrl}/college/filters-data`, requestConfig),
//         ]);
//         if (cancelled) return;

//         if (centersRes.status === 'fulfilled' && centersRes.value.data?.success) {
//           const centers = centersRes.value.data.data || [];
//           setAllCentersMeta(centers);
//           setCenterOptions(mapApiOptions(centers));
//         } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
//           const centers = filtersRes.value.data.centers || [];
//           setAllCentersMeta(centers);
//           setCenterOptions(mapApiOptions(centers));
//         }

//         if (coursesRes.status === 'fulfilled' && coursesRes.value.data?.success) {
//           const courses = coursesRes.value.data.data || [];
//           setAllCoursesMeta(courses);
//           setCourseOptions(mapApiOptions(courses));
//         } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
//           const courses = filtersRes.value.data.courses || [];
//           setAllCoursesMeta(courses);
//           setCourseOptions(mapApiOptions(courses));
//         }
//       } catch (err) {
//         console.error('Failed to fetch filter options:', err);
//       } finally {
//         if (!cancelled) setLoadingCenters(false);
//       }
//     };

//     fetchFilterOptions();
//     return () => { cancelled = true; };
//   }, [backendUrl, token]);

//   useEffect(() => {
//     if (!filters.center) {
//       setLoadingCourses(false);
//       return;
//     }
//     setLoadingCourses(true);
//     const timer = setTimeout(() => setLoadingCourses(false), 150);
//     return () => clearTimeout(timer);
//   }, [filters.center]);

//   useEffect(() => {
//     if (!token) {
//       setLoadingDepartments(false);
//       return undefined;
//     }
//     let cancelled = false;
//     const loadDepartments = async () => {
//       setLoadingDepartments(true);
//       try {
//         const response = await axios.get(`${backendUrl}/college/getVerticals`, {
//           headers: { 'x-auth': token },
//         });
//         if (cancelled) return;
//         setDepartment((response.data?.data || []).map((item) => ({
//           value: String(item._id),
//           label: item.name || 'Untitled department',
//         })));
//       } catch (err) {
//         console.error('Failed to load departments', err);
//         if (!cancelled) setDepartment([]);
//       } finally {
//         if (!cancelled) setLoadingDepartments(false);
//       }
//     };
//     loadDepartments();
//     return () => { cancelled = true; };
//   }, [backendUrl, token]);

//   useEffect(() => {
//     if (!token || !departmentId) {
//       setProject([]);
//       return undefined;
//     }
//     let cancelled = false;
//     const loadProjects = async () => {
//       setLoadingProjects(true);
//       try {
//         const response = await axios.get(`${backendUrl}/college/list-projects`, {
//           headers: { 'x-auth': token },
//           params: { vertical: departmentId },
//         });
//         if (cancelled) return;
//         setProject((response.data?.data || []).map((item) => ({
//           value: String(item._id),
//           label: item.name || 'Project',
//         })));
//       } catch (err) {
//         console.error('Failed to load projects', err);
//         if (!cancelled) setProject([]);
//       } finally {
//         if (!cancelled) setLoadingProjects(false);
//       }
//     };
//     loadProjects();
//     return () => { cancelled = true; };
//   }, [departmentId, backendUrl, token]);

//   useEffect(() => {
//     if (!token || !projectId) {
//       setCenter([]);
//       return undefined;
//     }
//     let cancelled = false;
//     const loadCenters = async () => {
//       setLoadingCenters(true);
//       try {
//         const response = await axios.get(`${backendUrl}/college/list-centers`, {
//           headers: { 'x-auth': token },
//           params: { projectId: projectId },
//         });
//         if (cancelled) return;
//         setCenter((response.data?.data || []).map((item) => ({
//           value: String(item._id),
//           label: item.name || 'Center',
//         })));
//       } catch (err) {
//         console.error('Failed to load centers', err);
//         if (!cancelled) setCenter([]);
//       } finally {
//         if (!cancelled) setLoadingCenters(false);
//       }
//     };
//     loadCenters();
//     return () => { cancelled = true; };
//   }, [projectId, backendUrl, token]);

//   useEffect(() => {
//     if (!token || !projectId || !centerId) {
//       setCourse([]);
//       return undefined;
//     }
//     let cancelled = false;
//     const loadCourses = async () => {
//       setLoadingCourses(true);
//       try {
//         const response = await axios.get(`${backendUrl}/college/all_coursescopy_centerwise`, {
//           headers: { 'x-auth': token },
//           params: { projectId: projectId, centerId: centerId },
//         });
//         if (cancelled) return;
//         setCourse((response.data?.data || []).map((item) => ({
//           value: String(item._id),
//           label: item.name || 'Course',
//         })));
//       } catch (err) {
//         console.error('Failed to load courses', err);
//         if (!cancelled) setCourse([]);
//       } finally {
//         if (!cancelled) setLoadingCourses(false);
//       }
//     };
//     loadCourses();
//     return () => { cancelled = true; };
//   }, [projectId, centerId, backendUrl, token]);

//   useEffect(() => {
//     if (!token || !courseId || !centerId) {
//       setBatch([]);
//       return undefined;
//     }
//     let cancelled = false;
//     const loadDraftBatches = async () => {
//       setLoadingBatches(true);
//       try {
//         const res = await axios.get(`${backendUrl}/college/get_batches`, {
//           headers: { 'x-auth': token },
//           params: { courseId: courseId, centerId: centerId },
//         });
//         if (cancelled) return;
//         const rows = (res.data?.data || []).map((batch) => ({
//           value: String(batch._id),
//           label: batch.name || 'Batch',
//         }));
//         setBatch(rows);
//         setBatchId((current) => (rows.some((row) => row.value === current) ? current : ''));
//       } catch (err) {
//         console.error('Failed to load course batches', err);
//         if (!cancelled) setBatch([]);
//       } finally {
//         if (!cancelled) setLoadingBatches(false);
//       }
//     };
//     loadDraftBatches();
//     return () => { cancelled = true; };
//   }, [courseId, centerId, token, backendUrl]);

//   useEffect(() => {
//     if (!token || !filters.course) {
//       setBatchOptions([]);
//       return undefined;
//     }
//     const fetchBatches = async () => {
//       setLoadingBatches(true);
//       try {
//         const params = new URLSearchParams();
//         params.set('courseId', filters.course);
//         if (filters.center) params.set('centerId', filters.center);
//         const res = await axios.get(`${backendUrl}/college/get_batches?${params.toString()}`, {
//           headers: { 'x-auth': token },
//         });
//         if (res.data?.success) {
//           setBatchOptions((res.data.data || []).map((batch) => ({
//             value: String(batch._id),
//             label: batch.name,
//           })));
//         } else {
//           setBatchOptions([]);
//         }
//       } catch {
//         setBatchOptions([]);
//       } finally {
//         setLoadingBatches(false);
//       }
//     };
//     fetchBatches();
//     return undefined;
//   }, [filters.center, filters.course, token, backendUrl]);

//   const handleFilterChange = (key, value) => {
//     if (key === 'center') {
//       setFilters({ center: value, course: '', batch: '' });
//       setSelectedSessionId('');
//       return;
//     }
//     if (key === 'course') {
//       setFilters((prev) => ({ ...prev, course: value, batch: '' }));
//       setSelectedSessionId('');
//       return;
//     }
//     setFilters((prev) => ({ ...prev, [key]: value }));
//     setSelectedSessionId('');
//   };

//   const handleFilterReset = () => {
//     setFilters({ center: '', course: '', batch: '' });
//     setSelectedSessionId('');
//   };

//   const handleDraftDepartmentChange = (value) => {
//     setDepartmentId(value);
//     setProjectId('');
//     setCenterId('');
//     setCourseId('');
//     setBatchId('');
//     setSearchMessage('');
//   };

//   const handleDraftProjectChange = (value) => {
//     setProjectId(value);
//     setCenterId('');
//     setCourseId('');
//     setBatchId('');
//     setSearchMessage('');
//   };

//   const handleDraftCenterChange = (value) => {
//     setCenterId(value);
//     setCourseId('');
//     setBatchId('');
//     setSearchMessage('');
//   };

//   const handleDraftCourseChange = (value) => {
//     setCourseId(value);
//     setBatchId('');
//     setSearchMessage('');
//   };

//   const handleTimetableSearch = (event) => {
//     event.preventDefault();
//     if (!departmentId || !projectId || !centerId || !courseId || !batchId) {
//       setSearchMessage('Select department, project, center, course, and batch.');
//       return;
//     }
//     const selectedDepartment = department.find((item) => item.value === departmentId);
//     const selectedProject = project.find((item) => item.value === projectId);
//     const selectedCenter = center.find((item) => item.value === centerId);
//     const selectedCourse = course.find((item) => item.value === courseId);
//     const selectedBatch = batch.find((item) => item.value === batchId);
//     setSearchMessage('');
//     setOpenedSelection({
//       departmentName: selectedDepartment?.label || 'Department',
//       projectName: selectedProject?.label || 'Project',
//       centerName: selectedCenter?.label || 'Center',
//       courseName: selectedCourse?.label || 'Course',
//       batchName: selectedBatch?.label || 'Batch',
//     });
//     setFilters({ center: centerId, course: courseId, batch: batchId });
//     setSelectedSessionId('');
//     setTimetableOpen(true);
//   };

//   const handleTimetableBack = () => {
//     setTimetableOpen(false);
//     setFilters({ center: '', course: '', batch: '' });
//     setSelectedSessionId('');
//   };

//   const totSessions = useMemo(
//     () => sessions.filter((session) => isTotSession(session)).map(mapSessionForTotCalendar),
//     [sessions]
//   );

//   const studentSessions = useMemo(
//     () => sessions.filter((session) => appearsOnStudentCalendar(session)),
//     [sessions]
//   );

//   const tableSessions = useMemo(() => sortSessionsByDate(sessions), [sessions]);

//   const listSessions = useMemo(
//     () => [...sampleSessions, ...tableSessions],
//     [sampleSessions, tableSessions]
//   );

//   const selectedSession = useMemo(() => {
//     const resolvedId = resolveSessionSelectionId(selectedSessionId);
//     return listSessions.find((session) => session.id === resolvedId) || null;
//   }, [listSessions, selectedSessionId]);

//   const handleSelectSession = (sessionId) => {
//     const resolvedId = resolveSessionSelectionId(sessionId);
//     setSelectedSessionId((prev) => (resolveSessionSelectionId(prev) === resolvedId ? '' : resolvedId));
//   };

//   if (permissions && !canBeSeniorTrainerPermission) {
//     return (
//       <div className="st-portal">
//         <style>{ST_CSS}</style>
//         <div style={{ marginTop: 40, textAlign: 'center', padding: 48 }}>
//           <i className="fas fa-lock" style={{ fontSize: 32, color: '#94a3b8', marginBottom: 12 }} />
//           <h3 style={{ margin: '0 0 8px' }}>Access denied</h3>
//           <p style={{ margin: 0, color: '#64748b' }}>
//             You need <strong>Senior Trainer</strong> permission (or Admin) to use this module.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (!timetableOpen) {
//     return (
//       <div className="container py-4 vt-page vt-screen-enter">
//         <div className="vt-shell">
//           <div className="vt-head">
//             <div>
//               <p className="vt-kicker">Training</p>
//               <h4 style={{ margin: '2px 0 0', fontWeight: 800, color: '#1e293b' }}>Batch Time Table</h4>
//             </div>
//           </div>

//           <form onSubmit={handleTimetableSearch} style={{ marginTop: 14 }}>
//             <style>{`
//               .tt-search { display: flex; align-items: flex-end; gap: 8px; }
//               .tt-search label { flex: 1 1 0; min-width: 0; }
//               .tt-search label span { display: block; font-size: 11px; font-weight: 700; color: #9f1239; margin-bottom: 4px; }
//               .tt-search .form-select { font-size: 12px; line-height: 1.2; height: 32px; padding: 2px 24px 2px 8px; }
//               .tt-search .vt-add { padding: 6px 14px; font-size: 12px; white-space: nowrap; }
//             `}</style>
//             <div className="tt-search">
//               <label>
//                 <span>Department</span>
//                 <select className="form-select" value={departmentId} onChange={(e) => handleDraftDepartmentChange(e.target.value)} disabled={loadingDepartments}>
//                   <option value="">{loadingDepartments ? 'Loading...' : 'Select department'}</option>
//                   {department.map((item) => (
//                     <option key={item.value} value={item.value}>{item.label}</option>
//                   ))}
//                 </select>
//               </label>
//               <label>
//                 <span>Project</span>
//                 <select className="form-select" value={projectId} onChange={(e) => handleDraftProjectChange(e.target.value)} disabled={!departmentId || loadingProjects}>
//                   <option value="">{!departmentId ? 'Select department first' : loadingProjects ? 'Loading...' : 'Select project'}</option>
//                   {project.map((item) => (
//                     <option key={item.value} value={item.value}>{item.label}</option>
//                   ))}
//                 </select>
//               </label>
//               <label>
//                 <span>Center</span>
//                 <select className="form-select" value={centerId} onChange={(e) => handleDraftCenterChange(e.target.value)} disabled={!projectId || loadingCenters}>
//                   <option value="">{!projectId ? 'Select project first' : loadingCenters ? 'Loading...' : 'Select center'}</option>
//                   {center.map((item) => (
//                     <option key={item.value} value={item.value}>{item.label}</option>
//                   ))}
//                 </select>
//               </label>
//               <label>
//                 <span>Course</span>
//                 <select className="form-select" value={courseId} onChange={(e) => handleDraftCourseChange(e.target.value)} disabled={!centerId || loadingCourses}>
//                   <option value="">{!centerId ? 'Select center first' : loadingCourses ? 'Loading...' : 'Select course'}</option>
//                   {course.map((item) => (
//                     <option key={item.value} value={item.value}>{item.label}</option>
//                   ))}
//                 </select>
//               </label>
//               <label>
//                 <span>Batch</span>
//                 <select
//                   className="form-select"
//                   value={batchId}
//                   onChange={(e) => {
//                     setBatchId(e.target.value);
//                     setSearchMessage('');
//                   }}
//                   disabled={!courseId || loadingBatches}
//                 >
//                   <option value="">
//                     {!courseId
//                       ? 'Select course first'
//                       : loadingBatches
//                         ? 'Loading...'
//                         : batch.length
//                           ? 'Select batch'
//                           : 'No batches'}
//                   </option>
//                   {batch.map((item) => (
//                     <option key={item.value} value={item.value}>{item.label}</option>
//                   ))}
//                 </select>
//               </label>
//               <button type="submit" className="vt-add">Search</button>
//             </div>
//             {searchMessage && <p className="text-danger mt-2 mb-0" style={{ fontSize: 12 }}>{searchMessage}</p>}
//           </form>

//           <div className="vt-empty">
//             <i className="bi bi-funnel"></i>
//             <h5>Search to see the time table</h5>
//             <p>Choose department, project, center, course, then batch.</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="st-portal">
//       <style>{ST_CSS}</style>

//       <header className="st-header">
//         <div>
//           <div className="st-role-badge">
//             <i className="fas fa-user-shield" /> Senior Trainer
//           </div>
//           <h1 className="st-title">Training Calendar</h1>
//           {openedSelection && (
//             <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
//               {[openedSelection.departmentName, openedSelection.projectName, openedSelection.centerName, openedSelection.courseName, openedSelection.batchName].filter(Boolean).join(' · ')}
//             </p>
//           )}
//         </div>
//         <button type="button" className="vt-back" onClick={handleTimetableBack}>
//           Change path
//         </button>
//       </header>



//       <div className="st-stats-row">
//         <div className="st-stat">
//           <strong>{sessions.filter((s) => isTotSession(s)).length}</strong>
//           <span>TOT plans</span>
//         </div>
//         <div className="st-stat st-stat--green">
//           <strong>{sessions.filter((s) => appearsOnStudentCalendar(s)).length}</strong>
//           <span>Student sessions</span>
//         </div>
//         <div className="st-stat st-stat--amber">
//           <strong>{sessions.filter((s) => s.workflowStatus === WORKFLOW_STATUS.SENT_TO_SENIOR).length}</strong>
//           <span>Sent for review</span>
//         </div>
//       </div>

//       <div className="st-workspace">
//         <SessionDayTimetable
//           sessions={tableSessions}
//           assignmentDrafts={assignmentDrafts}
//           selectedSessionId={selectedSessionId}
//           onSelectSession={handleSelectSession}
//           onAssignPeriod={handleAssignPeriod}
//         />

//         <div className="st-dual-calendars">
//           <TrainingCalendar
//             title="TOT Calendar"
//             icon="fa-chalkboard-teacher"
//             accent={BLUE}
//             sessions={totSessions}
//             selectedSessionId={selectedSessionId}
//             onSelectSession={handleSelectSession}
//           />
//           <TrainingCalendar
//             title="Session Calendar"
//             icon="fa-user-graduate"
//             accent={GREEN}
//             sessions={studentSessions}
//             selectedSessionId={selectedSessionId}
//             onSelectSession={handleSelectSession}
//           />
//         </div>

//         <SessionTable
//           sessions={listSessions}
//           selectedSessionId={selectedSessionId}
//           onSelectSession={handleSelectSession}
//           filters={filters}
//           centerOptions={centerOptions}
//           courseOptions={filteredCourseOptions}
//           batchOptions={batchOptions}
//           loadingCenters={loadingCenters}
//           loadingCourses={loadingCourses}
//           loadingBatches={loadingBatches}
//           onFilterChange={handleFilterChange}
//           onFilterReset={handleFilterReset}
//           hideFilters
//           assignmentDrafts={assignmentDrafts}
//           trainerOptions={trainerOptions}
//           loadingTrainers={loadingTrainers}
//           onEditSession={handleOpenEditModal}
//         />

//         <div className="st-detail-panel">
//           {selectedSession ? (
//             <SeniorSessionCard
//               key={selectedSession.id}
//               session={selectedSession}
//               token={token}
//               backendUrl={backendUrl}
//               onSessionUpdated={(savedSession) => {
//                 if (!savedSession?.id && !savedSession?._id) return;
//                 const sessionId = String(savedSession.id || savedSession._id);
//                 setSessions((prev) => prev.map((item) => (
//                   String(item.id) === sessionId
//                     ? { ...item, ...savedSession, id: sessionId }
//                     : item
//                 )));
//               }}
//             />
//           ) : (
//             <div className="st-detail-empty">
//               <i className="fas fa-hand-pointer" />
//               <h4>Select a session</h4>
//               <p>Click any session cell on the Session or TOT grid, or a row in the table, to view its full plan card.</p>
//               {!filters.batch && sessions.length === 0 && (
//                 <p className="st-detail-empty__hint">
//                   No referred sessions yet. Ask Academic Coordinator to refer a plan to your account.
//                 </p>
//               )}
//               {filters.batch && !totSessions.length && !studentSessions.length && (
//                 <p className="st-detail-empty__hint">
//                   No sessions match this Center/Course/Batch filter. Clear filters to see all referred plans.
//                 </p>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {editingSession && (
//         <SessionAssignModal
//           session={editingSession}
//           centerOptions={centerOptions}
//           courseOptions={courseOptions}
//           allCentersMeta={allCentersMeta}
//           allCoursesMeta={allCoursesMeta}
//           trainerOptions={trainerOptions}
//           loadingTrainers={loadingTrainers}
//           backendUrl={backendUrl}
//           token={token}
//           lockedPath={filters.course && filters.batch ? {
//             center: filters.center || editingSession.center || '',
//             centerName: openedSelection?.centerName || editingSession.centerName || '',
//             course: filters.course,
//             courseName: openedSelection?.courseName || editingSession.courseName || '',
//             batch: filters.batch,
//             batchName: openedSelection?.batchName || editingSession.batchCode || '',
//           } : null}
//           onClose={handleCloseEditModal}
//           onSave={handleModalSave}
//         />
//       )}
//     </div>


//   );
// };

// export default SeniorTrainerModule;
