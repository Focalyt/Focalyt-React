import React, { useState, useMemo, useCallback } from 'react';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';

/* ─── Theme tokens (FOCALYT portal pink + blue) ─── */
const PINK = '#fa5579';
const BLUE = '#2563eb';

const FILTER_OPTIONS = {
  department: ['Skill Development', 'Placement Cell', 'Training Operations'],
  project: ['PMKVY 4.0', 'DDU-GKY', 'State Skill Mission'],
  center: ['Delhi Centre – Rohini', 'Noida Centre – Sector 62', 'Gurgaon Centre – Udyog Vihar'],
  course: ['Retail Sales Associate', 'Data Entry Operator', 'Beauty & Wellness'],
  batch: ['BATCH-RS-2024-01', 'BATCH-DEO-2024-03', 'BATCH-BW-2024-02'],
};

const TRAINER_INFO = {
  name: 'Rajesh Kumar Sharma',
  mobile: '9876543210',
  email: 'rajesh.trainer@focalyt.in',
  batchCode: 'BATCH-RS-2024-01',
  course: 'Retail Sales Associate',
  center: 'Delhi Centre – Rohini',
};

const BASIC_DETAILS_INIT = {
  centerName: 'Delhi Centre – Rohini',
  trainerName: 'Rajesh Kumar Sharma',
  projectName: 'PMKVY 4.0',
  courseTrade: 'Retail Sales Associate',
  reportingPerson: 'Priya Singh – Centre Manager',
  batchCode: 'BATCH-RS-2024-01',
  totalPointsTillDate: '1245',
  totalDaysTillDate: '42',
  averageScore: '78.5',
};

const TAB_NAV = [
  { id: 'details', label: 'Report Details' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'training', label: 'Training Delivery' },
  { id: 'studentPoints', label: 'Student Metrics' },
  { id: 'documents', label: 'Documents' },
  { id: 'reviewers', label: 'Reviewers' },
  { id: 'issues', label: 'Issue / Action' },
  { id: 'summary', label: 'Final Summary' },
];

const MAIN_TABS = [
  { id: 'session', label: 'Sessions' },
  { id: 'student', label: 'Students' },
];

const DUMMY_SESSIONS = [
  { id: 'S001', title: 'Morning Batch – Retail Sales', date: '22/06/2026', status: 'Completed' },
  { id: 'S002', title: 'Practical – Customer Handling', date: '22/06/2026', status: 'Pending' },
  { id: 'S003', title: 'Assessment Review', date: '21/06/2026', status: 'Completed' },
];

const DUMMY_STUDENTS = [
  { id: 'ST01', name: 'Akash Gaurav', mobile: '6280484211', attendance: '92%', status: 'Active' },
  { id: 'ST02', name: 'Priya Verma', mobile: '9876512340', attendance: '88%', status: 'Active' },
  { id: 'ST03', name: 'Rohit Singh', mobile: '9123456780', attendance: '76%', status: 'At Risk' },
];

const mkPoint = (id, name, priority, weightage) => ({ id, name, priority, weightage });

const ATTENDANCE_POINTS = [
  mkPoint('1.1', 'Total enrolled candidates', 'High', 5),
  mkPoint('1.2', 'Present candidates', 'High', 10),
  mkPoint('1.3', 'Absent candidates', 'High', 10),
  mkPoint('1.4', 'Attendance percentage', 'High', 10),
  mkPoint('1.5', 'New admissions', 'Medium', 5),
  mkPoint('1.6', 'Dropout / inactive candidates', 'High', 8),
  mkPoint('1.7', 'Follow-up done with absent candidates', 'Medium', 7),
  mkPoint('1.8', 'Student attendance below 40%', 'High', 8),
];

const TRAINING_POINTS = [
  mkPoint('2.1', 'Topic covered today', 'High', 10),
  mkPoint('2.2', 'Pending topic', 'Medium', 5),
  mkPoint('2.3', 'Training hours completed today', 'High', 10),
  mkPoint('2.4', 'Practical / activity conducted', 'High', 8),
  mkPoint('2.5', 'Name of activity / practical', 'Medium', 5),
  mkPoint('2.6', 'Teaching method used', 'Medium', 5),
];

const STUDENT_POINTS = [
  mkPoint('3.1', 'Student participation in class', 'High', 8),
  mkPoint('3.2', 'Doubt-clearing done', 'Medium', 6),
  mkPoint('3.3', 'Engagement activity completed', 'Medium', 6),
  mkPoint('3.4', 'Counseling / motivation session conducted', 'Low', 4),
  mkPoint('3.5', 'Placement / career discussion done', 'Low', 4),
  mkPoint('3.6', 'Candidates guided for job role / career path', 'Medium', 5),
  mkPoint('3.7', 'Internal assessment performance', 'High', 10),
  mkPoint('3.8', 'Classroom participation', 'Medium', 7),
];

const DOCUMENT_POINTS = [
  mkPoint('4.1', 'Attendance updated', 'High', 8),
  mkPoint('4.2', 'DTR updated', 'High', 8),
  mkPoint('4.3', 'MIS updated', 'High', 8),
  mkPoint('4.4', 'Lesson plan followed', 'Medium', 6),
  mkPoint('4.5', 'ACLP / day-wise lesson plan updated', 'Medium', 6),
  mkPoint('4.6', 'Batch calendar updated', 'Medium', 5),
  mkPoint('4.7', 'Batch file updated', 'Medium', 5),
  mkPoint('4.8', 'Daily report submitted on time', 'High', 10),
];

const ISSUE_POINTS = [
  { id: '5.1', name: 'Attendance issue', type: 'Attendance', priority: 'High' },
  { id: '5.2', name: 'Student engagement issue', type: 'Engagement', priority: 'Medium' },
  { id: '5.3', name: 'Documentation issue', type: 'Documentation', priority: 'Medium' },
  { id: '5.4', name: 'Infrastructure / center issue', type: 'Infrastructure', priority: 'High' },
  { id: '5.5', name: 'Pending work for tomorrow', type: 'Action Item', priority: 'Medium' },
];

const emptyPointValue = () => ({
  value: '', status: 'Pending', evidence: '', remarks: '', selfScore: '',
});

const emptyIssueValue = () => ({
  actionTaken: '', responsible: '', targetDate: '', status: 'Open', remarks: '',
});

const emptyDocValue = () => ({
  status: 'Pending', reviewerRemark: '', fileName: '',
});

const buildPointMap = (points) =>
  Object.fromEntries(points.map((p) => [p.id, emptyPointValue()]));

const priorityClass = (p) => {
  if (p === 'High') return 'dbr-priority--high';
  if (p === 'Medium') return 'dbr-priority--medium';
  return 'dbr-priority--low';
};

const statusChip = (s) => {
  if (s === 'Completed' || s === 'Done' || s === 'Approved') return 'dbr-chip--green';
  if (s === 'Missed' || s === 'Returned') return 'dbr-chip--red';
  if (s === 'Not Applicable') return 'dbr-chip--gray';
  return 'dbr-chip--orange';
};

/* ─── Small reusable pieces ─── */

const FilterSelect = ({ label, icon, options, value, onChange }) => (
  <div className="dbr-filter-pill">
    <label className="dbr-filter-label">
      <i className={`fas ${icon}`} /> {label}
    </label>
    <select className="dbr-filter-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">All</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const MiniStat = ({ label, value, bg }) => (
  <div className="dbr-mini-stat" style={{ background: bg }}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const ModuleCardShell = ({ title, icon, children, onEdit, extra }) => (
  <div className="dbr-module-card">
    <div className="dbr-module-card__head">
      <span className="dbr-module-card__title">
        <i className={`fas ${icon}`} /> {title}
      </span>
      {extra}
      {onEdit && (
        <button type="button" className="dbr-icon-btn" onClick={onEdit} title="Edit">
          <i className="fas fa-pen" />
        </button>
      )}
    </div>
    <div className="dbr-module-card__body">{children}</div>
  </div>
);

const PointFieldCard = ({ point, data, onChange }) => (
  <div className="dbr-point-card">
    <div className="dbr-point-card__top">
      <span className="dbr-point-id">{point.id}</span>
      <span className={`dbr-priority ${priorityClass(point.priority)}`}>{point.priority}</span>
      <span className="dbr-weight">Wt {point.weightage}</span>
    </div>
    <h6 className="dbr-point-name">{point.name}</h6>
    <div className="dbr-point-fields">
      <input
        type="text"
        className="dbr-input"
        placeholder="Enter value..."
        value={data.value}
        onChange={(e) => onChange('value', e.target.value)}
      />
      <select className="dbr-select" value={data.status} onChange={(e) => onChange('status', e.target.value)}>
        <option>Completed</option>
        <option>Pending</option>
        <option>Not Applicable</option>
      </select>
      <input
        type="text"
        className="dbr-input"
        placeholder="Evidence / link..."
        value={data.evidence}
        onChange={(e) => onChange('evidence', e.target.value)}
      />
      <input
        type="text"
        className="dbr-input"
        placeholder="Remarks..."
        value={data.remarks}
        onChange={(e) => onChange('remarks', e.target.value)}
      />
    </div>
  </div>
);

const DocumentCard = ({ point, data, onChange }) => (
  <div className="dbr-point-card dbr-doc-card">
    <div className="dbr-point-card__top">
      <span className="dbr-point-id">{point.id}</span>
      <span className={`dbr-chip ${statusChip(data.status)}`}>{data.status}</span>
    </div>
    <h6 className="dbr-point-name">{point.name}</h6>
    <div className="dbr-doc-actions">
      <button type="button" className="dbr-btn dbr-btn--outline-sm">
        <i className="fas fa-upload" /> Upload
      </button>
      <button type="button" className="dbr-btn dbr-btn--link-sm">View</button>
    </div>
    <select className="dbr-select" value={data.status} onChange={(e) => onChange('status', e.target.value)}>
      <option>Completed</option>
      <option>Pending</option>
      <option>Not Applicable</option>
    </select>
    <input
      type="text"
      className="dbr-input"
      placeholder="Reviewer remark..."
      value={data.reviewerRemark}
      onChange={(e) => onChange('reviewerRemark', e.target.value)}
    />
  </div>
);

const IssueCard = ({ issue, data, onChange }) => (
  <div className="dbr-point-card dbr-issue-card">
    <div className="dbr-point-card__top">
      <span className="dbr-point-id">{issue.id}</span>
      <span className={`dbr-priority ${priorityClass(issue.priority)}`}>{issue.priority}</span>
      <span className="dbr-issue-type">{issue.type}</span>
    </div>
    <h6 className="dbr-point-name">{issue.name}</h6>
    <div className="dbr-point-fields">
      <input className="dbr-input" placeholder="Action taken..." value={data.actionTaken} onChange={(e) => onChange('actionTaken', e.target.value)} />
      <input className="dbr-input" placeholder="Responsible person..." value={data.responsible} onChange={(e) => onChange('responsible', e.target.value)} />
      <input type="date" className="dbr-input" value={data.targetDate} onChange={(e) => onChange('targetDate', e.target.value)} />
      <select className="dbr-select" value={data.status} onChange={(e) => onChange('status', e.target.value)}>
        <option>Open</option>
        <option>In Progress</option>
        <option>Resolved</option>
      </select>
      <input className="dbr-input" placeholder="Remarks..." value={data.remarks} onChange={(e) => onChange('remarks', e.target.value)} />
    </div>
  </div>
);

const ReviewerPanel = ({ title, reviewerKey, data, onChange, onApprove, onReturn }) => (
  <div className="dbr-reviewer-card">
    <div className="dbr-reviewer-card__head">
      <i className="fas fa-user-shield" />
      <h6>{title}</h6>
    </div>
    <div className="dbr-reviewer-fields">
      <label className="dbr-lbl">Reviewer Name</label>
      <input className="dbr-input dbr-input--ro" readOnly value={data.reviewerName} />
      <label className="dbr-lbl">Review Status</label>
      <select className="dbr-select" value={data.status} onChange={(e) => onChange('status', e.target.value)}>
        <option>Pending</option>
        <option>Approved</option>
        <option>Returned</option>
      </select>
      <label className="dbr-lbl">Score</label>
      <input type="number" className="dbr-input" min="0" max="100" value={data.score} onChange={(e) => onChange('score', e.target.value)} />
      <label className="dbr-lbl">Review Date</label>
      <input type="date" className="dbr-input" value={data.reviewDate} onChange={(e) => onChange('reviewDate', e.target.value)} />
      <label className="dbr-lbl">Remarks</label>
      <textarea className="dbr-textarea" rows={3} value={data.remarks} onChange={(e) => onChange('remarks', e.target.value)} />
    </div>
    <div className="dbr-reviewer-btns">
      <button type="button" className="dbr-btn dbr-btn--green" onClick={onApprove}>
        <i className="fas fa-check" /> Approve
      </button>
      <button type="button" className="dbr-btn dbr-btn--orange" onClick={onReturn}>
        <i className="fas fa-undo" /> Return for Correction
      </button>
    </div>
  </div>
);

/* ─── Main page ─── */

const TrainerModule = () => {
  const [reportDate, setReportDate] = useState(new Date());
  const [filters, setFilters] = useState({
    department: 'Skill Development', project: 'PMKVY 4.0', center: 'Delhi Centre – Rohini',
    course: 'Retail Sales Associate', batch: 'BATCH-RS-2024-01',
  });
  const [quickSearch, setQuickSearch] = useState('');
  const [cardsExpanded, setCardsExpanded] = useState(true);
  const [mainTab, setMainTab] = useState('session');
  const [sessions, setSessions] = useState(DUMMY_SESSIONS);
  const [activeTab, setActiveTab] = useState('details');
  const [reportStatus, setReportStatus] = useState('Draft');
  const [basicDetails, setBasicDetails] = useState(BASIC_DETAILS_INIT);
  const [finalRemarks, setFinalRemarks] = useState('');
  const [finalStatus, setFinalStatus] = useState('Pending');
  const [toast, setToast] = useState('');

  const [attendanceData, setAttendanceData] = useState(() => buildPointMap(ATTENDANCE_POINTS));
  const [trainingData, setTrainingData] = useState(() => buildPointMap(TRAINING_POINTS));
  const [studentData, setStudentData] = useState(() => buildPointMap(STUDENT_POINTS));
  const [documentData, setDocumentData] = useState(() => buildPointMap(DOCUMENT_POINTS));
  const [issueData, setIssueData] = useState(() =>
    Object.fromEntries(ISSUE_POINTS.map((p) => [p.id, emptyIssueValue()]))
  );

  const [reviewers, setReviewers] = useState({
    centreManager: { reviewerName: 'Priya Singh', status: 'Pending', score: '', remarks: '', reviewDate: '' },
    batchCoordinator: { reviewerName: 'Vikram Mehta', status: 'Pending', score: '', remarks: '', reviewDate: '' },
    misQa: { reviewerName: 'HO – QA Team', status: 'Pending', score: '', remarks: '', reviewDate: '' },
  });

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const allPointMaps = useMemo(() => ({
    ...attendanceData, ...trainingData, ...studentData,
  }), [attendanceData, trainingData, studentData]);

  const totalWeightage = [...ATTENDANCE_POINTS, ...TRAINING_POINTS, ...STUDENT_POINTS, ...DOCUMENT_POINTS]
    .reduce((s, p) => s + p.weightage, 0);

  const totalSelfScore = useMemo(
    () => Object.values(allPointMaps).reduce((s, d) => s + (parseFloat(d.selfScore) || parseFloat(d.value) || 0), 0),
    [allPointMaps]
  );

  const averageScore = basicDetails.averageScore;

  const updateMap = useCallback((setter, id, field, val) => {
    setter((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  }, []);

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  const approvalPillClass = {
    Draft: 'dbr-approval--draft',
    Submitted: 'dbr-approval--submitted',
    Approved: 'dbr-approval--approved',
    Returned: 'dbr-approval--returned',
  }[reportStatus] || 'dbr-approval--draft';

  return (
    <div className="dbr-portal">
      <style>{PORTAL_CSS}</style>

      {/* ── Header ── */}
      <header className="dbr-header">
        <div>
          <h1 className="dbr-title">Daily Batch Monitoring Report Card</h1>
          <nav className="dbr-breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <span>Training Module</span>
            <span>/</span>
            <span className="dbr-breadcrumb--active">Daily Report Card</span>
          </nav>
        </div>
        <div className="dbr-header-date">
          <i className="fas fa-calendar-alt" />
          <DatePicker value={reportDate} onChange={setReportDate} format="dd/MM/yyyy" clearIcon={null} />
        </div>
      </header>

      {/* ── Filters ── */}
      <div className="dbr-filters">
        <FilterSelect label="Department" icon="fa-sitemap" options={FILTER_OPTIONS.department} value={filters.department} onChange={(v) => setFilter('department', v)} />
        <FilterSelect label="Project" icon="fa-project-diagram" options={FILTER_OPTIONS.project} value={filters.project} onChange={(v) => setFilter('project', v)} />
        <FilterSelect label="Center" icon="fa-building" options={FILTER_OPTIONS.center} value={filters.center} onChange={(v) => setFilter('center', v)} />
        <FilterSelect label="Course" icon="fa-graduation-cap" options={FILTER_OPTIONS.course} value={filters.course} onChange={(v) => setFilter('course', v)} />
        <FilterSelect label="Batch" icon="fa-users" options={FILTER_OPTIONS.batch} value={filters.batch} onChange={(v) => setFilter('batch', v)} />
      </div>

      {/* ── Main tabs: Sessions | Students ── */}
      <div className="dbr-main-tabs">
        {MAIN_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`dbr-main-tab${mainTab === t.id ? ' dbr-main-tab--active' : ''}`}
            onClick={() => setMainTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mainTab === 'session' && (
        <>
      {/* ── Session summary + action buttons ── */}
      <div className="dbr-session-bar">
        <div className="dbr-session-summary">
          <span className="dbr-session-summary__lbl">Summary</span>
          <span className="dbr-session-summary__count">
            No. of Session: <strong>{sessions.length}</strong>
          </span>
        </div>
        <div className="dbr-session-actions">
          <button
            type="button"
            className="dbr-btn dbr-btn--session-pill"
            onClick={() => {
              const n = sessions.length + 1;
              setSessions((prev) => [
                ...prev,
                { id: `S${String(n).padStart(3, '0')}`, title: 'New Session', date: new Date().toLocaleDateString('en-IN'), status: 'Pending' },
              ]);
              notify('Session added');
            }}
          >
            <i className="fas fa-plus" /> Add Session
          </button>
          <button type="button" className="dbr-btn dbr-btn--session-pill" onClick={() => notify('Refer Session')}>
            <i className="fas fa-share-alt" /> Refer Session
          </button>
          <button type="button" className="dbr-btn dbr-btn--session-pill" onClick={() => notify('Bulk Upload Session')}>
            <i className="fas fa-cloud-upload-alt" /> Bulk Upload Session
          </button>
        </div>
      </div>

      {/* ── Action row ── */}
      <div className="dbr-actions">
        <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => notify('Downloading report...')}>
          <i className="fas fa-download" /> Download Report
        </button>
        <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => notify('Bulk upload opened')}>
          <i className="fas fa-cloud-upload-alt" /> Bulk Upload Evidence
        </button>
        <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => { setActiveTab('details'); notify('Add daily report'); }}>
          <i className="fas fa-plus" /> Add Daily Report
        </button>
        <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => notify('Referred to HO')}>
          <i className="fas fa-share-alt" /> Refer to HO
        </button>
        <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => notify('Bulk action')}>
          <i className="fas fa-tasks" /> Bulk Action
        </button>
        <input
          type="text"
          className="dbr-search"
          placeholder="Quick search..."
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
        />
        <button type="button" className="dbr-btn dbr-btn--pink" onClick={() => notify(`Searching: ${quickSearch || 'all'}`)}>
          <i className="fas fa-search" /> Search
        </button>
        <button type="button" className="dbr-btn dbr-btn--outline">
          <i className="fas fa-filter" /> More
        </button>
      </div>

      {/* ── Module card row ── */}
      <div className={`dbr-card-row-wrap${cardsExpanded ? '' : ' dbr-card-row-wrap--collapsed'}`}>
        <div className="dbr-card-row-head">
          <span className="dbr-section-lbl">Batch Monitoring Modules</span>
          <button type="button" className="dbr-icon-btn" onClick={() => setCardsExpanded((e) => !e)} title={cardsExpanded ? 'Collapse' : 'Expand'}>
            <i className={`fas fa-chevron-${cardsExpanded ? 'up' : 'down'}`} />
          </button>
        </div>
        {cardsExpanded && (
          <div className="dbr-card-row">
            {/* Card 1 */}
            <ModuleCardShell title="Trainer & Batch Info" icon="fa-chalkboard-teacher" onEdit={() => setActiveTab('details')}>
              <div className="dbr-info-line"><i className="fas fa-user" /><span>{TRAINER_INFO.name}</span></div>
              <div className="dbr-info-line"><i className="fab fa-whatsapp text-success" /><span>{TRAINER_INFO.mobile}</span></div>
              <div className="dbr-info-line"><i className="fas fa-envelope" /><span>{TRAINER_INFO.email}</span></div>
              <div className="dbr-info-line"><i className="fas fa-layer-group" /><span>{TRAINER_INFO.batchCode}</span></div>
              <div className="dbr-info-line"><i className="fas fa-book" /><span>{TRAINER_INFO.course}</span></div>
              <div className="dbr-info-line"><i className="fas fa-map-marker-alt" /><span>{TRAINER_INFO.center}</span></div>
            </ModuleCardShell>

            {/* Card 2 */}
            <ModuleCardShell title="Report Approval" icon="fa-award" onEdit={() => setActiveTab('reviewers')}>
              <div className="dbr-kv"><span>Report Status</span></div>
              <span className={`dbr-approval-pill ${approvalPillClass}`}>{reportStatus}</span>
              <button type="button" className="dbr-btn dbr-btn--pink dbr-btn--block mt-2" onClick={() => { setReportStatus('Submitted'); notify('Submitted for approval'); }}>
                Submit for Approval
              </button>
            </ModuleCardShell>

            {/* Card 3 */}
            <ModuleCardShell title="Performance" icon="fa-chart-line" onEdit={() => setActiveTab('summary')}>
              <div className="dbr-kv"><span>Status</span><span className="dbr-chip dbr-chip--green">Good</span></div>
              <div className="dbr-kv"><span>Sub-Status</span><span className="dbr-chip dbr-chip--blue">On Track</span></div>
              <div className="dbr-kv"><span>Avg Score</span><strong>{averageScore}</strong></div>
              <div className="dbr-kv"><span>Self Score</span><strong>{totalSelfScore}</strong></div>
              <div className="dbr-kv"><span>Reviewer</span><strong>75</strong></div>
            </ModuleCardShell>

            {/* Card 4 */}
            <ModuleCardShell title="Candidate Attendance" icon="fa-user-check" onEdit={() => setActiveTab('attendance')}>
              <div className="dbr-mini-row">
                <MiniStat label="Enrolled" value="45" bg="#5b4fc9" />
                <MiniStat label="Present" value="38" bg="#10b981" />
                <MiniStat label="Absent" value="07" bg="#ef4444" />
              </div>
              <div className="dbr-att-pct">
                <span>Attendance %</span>
                <strong className="text-success">84.4%</strong>
              </div>
            </ModuleCardShell>

            {/* Card 5 – Training Delivery (hidden for now)
            <ModuleCardShell title="Training Delivery" icon="fa-book-open" onEdit={() => setActiveTab('training')}>
              <div className="dbr-kv"><span>Topic Covered</span><span className="dbr-chip dbr-chip--green">Done</span></div>
              <div className="dbr-kv"><span>Pending Topic</span><span className="dbr-chip dbr-chip--orange">Pending</span></div>
              <div className="dbr-kv"><span>Training Hours</span><strong>6 hrs</strong></div>
              <div className="dbr-kv"><span>Practical</span><span className="dbr-chip dbr-chip--green">Done</span></div>
            </ModuleCardShell>
            */}

            {/* Card 6 – Follow-up Calling (hidden for now)
            <ModuleCardShell title="Follow-up Calling" icon="fa-phone-alt" onEdit={() => setActiveTab('attendance')}>
              <div className="dbr-mini-row">
                <MiniStat label="Done" value="05" bg="#12b3ff" />
                <MiniStat label="Planned" value="02" bg="#f59e0b" />
                <MiniStat label="Missed" value="01" bg="#7c3d14" />
              </div>
              <div className="dbr-kv mt-2"><span>Next Follow-up</span><span>22/06/2026</span></div>
            </ModuleCardShell>
            */}

            {/* Card 7 – Follow-up Visit / Student Support (hidden for now)
            <ModuleCardShell title="Follow-up Visit / Student Support" icon="fa-hands-helping" onEdit={() => setActiveTab('students')}>
              <div className="dbr-kv"><span>Counseling Done</span><span className="dbr-chip dbr-chip--green">03</span></div>
              <div className="dbr-kv"><span>Career Discussion</span><span className="dbr-chip dbr-chip--blue">02</span></div>
              <div className="dbr-kv"><span>Placement Discussion</span><span className="dbr-chip dbr-chip--blue">01</span></div>
              <div className="dbr-kv"><span>Pending Support</span><span className="dbr-chip dbr-chip--orange">02</span></div>
            </ModuleCardShell>
            */}

            {/* Card 8 – Documents / Evidence (hidden for now)
            <ModuleCardShell title="Documents / Evidence" icon="fa-folder-open" onEdit={() => setActiveTab('documents')}>
              <div className="dbr-kv"><span>Uploaded</span><strong>12</strong></div>
              <div className="dbr-kv"><span>Pending</span><strong className="text-warning">03</strong></div>
              <div className="dbr-kv"><span>DTR</span><span className="dbr-chip dbr-chip--green">Updated</span></div>
              <div className="dbr-kv"><span>MIS</span><span className="dbr-chip dbr-chip--orange">Pending</span></div>
              <div className="dbr-kv"><span>Batch File</span><span className="dbr-chip dbr-chip--green">Updated</span></div>
              <button type="button" className="dbr-btn dbr-btn--blue dbr-btn--block mt-1" onClick={() => setActiveTab('documents')}>
                <i className="fas fa-upload" /> Upload Evidence
              </button>
            </ModuleCardShell>
            */}

            {/* Card 9 – Issues / Action (hidden for now)
            <ModuleCardShell title="Issues / Action" icon="fa-exclamation-triangle" onEdit={() => setActiveTab('issues')}>
              <div className="dbr-kv"><span>Attendance</span><span className="dbr-chip dbr-chip--red">01</span></div>
              <div className="dbr-kv"><span>Engagement</span><span className="dbr-chip dbr-chip--orange">01</span></div>
              <div className="dbr-kv"><span>Documentation</span><span className="dbr-chip dbr-chip--gray">00</span></div>
              <div className="dbr-kv"><span>Infrastructure</span><span className="dbr-chip dbr-chip--gray">00</span></div>
              <div className="dbr-kv"><span>Tomorrow Pending</span><span className="dbr-chip dbr-chip--orange">02</span></div>
            </ModuleCardShell>
            */}

            {/* Card 10 – Reviewer / HO (hidden for now)
            <ModuleCardShell title="Reviewer / HO" icon="fa-user-shield" onEdit={() => setActiveTab('reviewers')}>
              <div className="dbr-kv"><span>Centre Manager</span><span className="dbr-chip dbr-chip--orange">Pending</span></div>
              <div className="dbr-kv"><span>Batch Coordinator</span><span className="dbr-chip dbr-chip--orange">Pending</span></div>
              <div className="dbr-kv"><span>MIS-QA / HO</span><span className="dbr-chip dbr-chip--orange">Pending</span></div>
              <div className="dbr-mini-row mt-2">
                <MiniStat label="Reviewed" value="00" bg="#10b981" />
                <MiniStat label="Pending" value="03" bg="#f59e0b" />
                <MiniStat label="Returned" value="00" bg="#ef4444" />
              </div>
            </ModuleCardShell>
            */}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="dbr-tabs">
        {TAB_NAV.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`dbr-tab${activeTab === t.id ? ' dbr-tab--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="dbr-tab-panel">
        {activeTab === 'details' && (
          <div className="dbr-section-card">
            <div className="dbr-section-card__label">Basic Details</div>
            <div className="dbr-basic-grid">
              {[
                ['centerName', 'Center Name'], ['trainerName', 'Trainer Name'], ['projectName', 'Project Name'],
                ['courseTrade', 'Course / Trade'], ['reportingPerson', 'Reporting Person'],
                ['batchCode', 'Batch Code / Batch Name'], ['totalPointsTillDate', 'Total Points till Date'],
                ['totalDaysTillDate', 'Total Number of Days till Date'], ['averageScore', 'Average Score'],
              ].map(([key, lbl]) => (
                <div key={key} className="dbr-field">
                  <label className="dbr-lbl">{lbl}</label>
                  <input
                    className="dbr-input"
                    value={basicDetails[key]}
                    onChange={(e) => setBasicDetails((b) => ({ ...b, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="dbr-field">
                <label className="dbr-lbl">Date</label>
                <input className="dbr-input dbr-input--ro" readOnly value={reportDate?.toLocaleDateString('en-IN') || ''} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="dbr-points-grid">
            {ATTENDANCE_POINTS.map((p) => (
              <PointFieldCard
                key={p.id}
                point={p}
                data={attendanceData[p.id]}
                onChange={(f, v) => updateMap(setAttendanceData, p.id, f, v)}
              />
            ))}
          </div>
        )}

        {activeTab === 'training' && (
          <div className="dbr-points-grid">
            {TRAINING_POINTS.map((p) => (
              <PointFieldCard
                key={p.id}
                point={p}
                data={trainingData[p.id]}
                onChange={(f, v) => updateMap(setTrainingData, p.id, f, v)}
              />
            ))}
          </div>
        )}

        {activeTab === 'studentPoints' && (
          <div className="dbr-points-grid">
            {STUDENT_POINTS.map((p) => (
              <PointFieldCard
                key={p.id}
                point={p}
                data={studentData[p.id]}
                onChange={(f, v) => updateMap(setStudentData, p.id, f, v)}
              />
            ))}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="dbr-points-grid">
            {DOCUMENT_POINTS.map((p) => (
              <DocumentCard
                key={p.id}
                point={p}
                data={documentData[p.id]}
                onChange={(f, v) => updateMap(setDocumentData, p.id, f, v)}
              />
            ))}
          </div>
        )}

        {activeTab === 'reviewers' && (
          <div className="dbr-reviewers-grid">
            <ReviewerPanel
              title="Centre Manager Review"
              reviewerKey="centreManager"
              data={reviewers.centreManager}
              onChange={(f, v) => setReviewers((r) => ({ ...r, centreManager: { ...r.centreManager, [f]: v } }))}
              onApprove={() => { setReviewers((r) => ({ ...r, centreManager: { ...r.centreManager, status: 'Approved' } })); notify('Centre Manager approved'); }}
              onReturn={() => { setReviewers((r) => ({ ...r, centreManager: { ...r.centreManager, status: 'Returned' } })); setReportStatus('Returned'); notify('Returned'); }}
            />
            <ReviewerPanel
              title="Batch Coordinator Review"
              reviewerKey="batchCoordinator"
              data={reviewers.batchCoordinator}
              onChange={(f, v) => setReviewers((r) => ({ ...r, batchCoordinator: { ...r.batchCoordinator, [f]: v } }))}
              onApprove={() => { setReviewers((r) => ({ ...r, batchCoordinator: { ...r.batchCoordinator, status: 'Approved' } })); notify('Batch Coordinator approved'); }}
              onReturn={() => { setReviewers((r) => ({ ...r, batchCoordinator: { ...r.batchCoordinator, status: 'Returned' } })); setReportStatus('Returned'); }}
            />
            <ReviewerPanel
              title="MIS-QA / HO Review"
              reviewerKey="misQa"
              data={reviewers.misQa}
              onChange={(f, v) => setReviewers((r) => ({ ...r, misQa: { ...r.misQa, [f]: v } }))}
              onApprove={() => {
                setReviewers((r) => ({ ...r, misQa: { ...r.misQa, status: 'Approved' } }));
                setReportStatus('Approved');
                setFinalStatus('Approved');
                notify('HO approved');
              }}
              onReturn={() => {
                setReviewers((r) => ({ ...r, misQa: { ...r.misQa, status: 'Returned' } }));
                setReportStatus('Returned');
                setFinalStatus('Correction Required');
                notify('Returned for correction');
              }}
            />
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="dbr-points-grid">
            {ISSUE_POINTS.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                data={issueData[issue.id]}
                onChange={(f, v) => updateMap(setIssueData, issue.id, f, v)}
              />
            ))}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="dbr-summary-card">
            <div className="dbr-section-card__label">Final Report Summary</div>
            <div className="dbr-summary-grid">
              {[
                ['Total Weightage', totalWeightage],
                ['Total Self Assessment Score', totalSelfScore],
                ['Centre Manager Score', reviewers.centreManager.score || '—'],
                ['Batch Coordinator Score', reviewers.batchCoordinator.score || '—'],
                ['MIS-QA / HO Score', reviewers.misQa.score || '—'],
                ['Average Score', averageScore],
              ].map(([lbl, val]) => (
                <div key={lbl} className="dbr-summary-stat">
                  <small>{lbl}</small>
                  <strong>{val}</strong>
                </div>
              ))}
              <div className="dbr-summary-stat">
                <small>Final Status</small>
                <span className={`dbr-approval-pill ${finalStatus === 'Approved' ? 'dbr-approval--approved' : finalStatus === 'Correction Required' ? 'dbr-approval--returned' : 'dbr-approval--submitted'}`}>
                  {finalStatus}
                </span>
              </div>
            </div>
            <div className="dbr-field mt-3">
              <label className="dbr-lbl">Final Remarks</label>
              <textarea className="dbr-textarea" rows={4} value={finalRemarks} onChange={(e) => setFinalRemarks(e.target.value)} placeholder="Enter final remarks..." />
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom actions ── */}
      <footer className="dbr-footer">
        <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => { setReportStatus('Draft'); notify('Draft saved'); }}>
          <i className="fas fa-save" /> Save Draft
        </button>
        <button type="button" className="dbr-btn dbr-btn--pink" onClick={() => { setReportStatus('Submitted'); notify('Report submitted'); }}>
          <i className="fas fa-paper-plane" /> Submit Report
        </button>
        <button type="button" className="dbr-btn dbr-btn--blue" onClick={() => notify('Generating PDF...')}>
          <i className="fas fa-file-pdf" /> Generate PDF
        </button>
        <button type="button" className="dbr-btn dbr-btn--danger" onClick={() => {
          setAttendanceData(buildPointMap(ATTENDANCE_POINTS));
          setTrainingData(buildPointMap(TRAINING_POINTS));
          setStudentData(buildPointMap(STUDENT_POINTS));
          setDocumentData(buildPointMap(DOCUMENT_POINTS));
          setIssueData(Object.fromEntries(ISSUE_POINTS.map((p) => [p.id, emptyIssueValue()])));
          setBasicDetails(BASIC_DETAILS_INIT);
          setReportStatus('Draft');
          setFinalStatus('Pending');
          notify('Form reset');
        }}>
          <i className="fas fa-redo" /> Reset Form
        </button>
      </footer>
        </>
      )}

      {mainTab === 'student' && (
        <div className="dbr-student-view">
          <div className="dbr-session-bar">
            <div className="dbr-session-summary">
              <span className="dbr-session-summary__lbl">Summary</span>
              <span className="dbr-session-summary__count">
                No. of Students: <strong>{DUMMY_STUDENTS.length}</strong>
              </span>
            </div>
          </div>

          <div className="dbr-student-grid">
            {DUMMY_STUDENTS.map((st) => (
              <div key={st.id} className="dbr-student-card">
                <div className="dbr-student-card__head">
                  <i className="fas fa-user-graduate" />
                  <h6>{st.name}</h6>
                  <span className={`dbr-chip ${st.status === 'Active' ? 'dbr-chip--green' : 'dbr-chip--orange'}`}>{st.status}</span>
                </div>
                <div className="dbr-info-line"><i className="fas fa-phone" /><span>{st.mobile}</span></div>
                <div className="dbr-info-line"><i className="fas fa-percent" /><span>Attendance: {st.attendance}</span></div>
                <button type="button" className="dbr-btn dbr-btn--outline dbr-btn--block mt-2" onClick={() => notify(`View ${st.name}`)}>
                  <i className="fas fa-eye" /> View Details
                </button>
              </div>
            ))}
          </div>

          <div className="dbr-section-card mt-3">
            <div className="dbr-section-card__label">Student Metrics</div>
            <div className="dbr-points-grid pt-2">
              {STUDENT_POINTS.map((p) => (
                <PointFieldCard
                  key={p.id}
                  point={p}
                  data={studentData[p.id]}
                  onChange={(f, v) => updateMap(setStudentData, p.id, f, v)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="dbr-toast"><i className="fas fa-check-circle me-2" />{toast}</div>}
    </div>
  );
};

/* ─── Portal CSS (Tailwind-like utility layer, scoped) ─── */
const PORTAL_CSS = `
  .dbr-portal {
    min-height: 100vh;
    background: linear-gradient(180deg, #fff5f7 0%, #f4f6f9 120px, #f4f6f9 100%);
    padding: 16px 20px 100px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #1e293b;
  }
  .dbr-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
  .dbr-title { font-size: 1.35rem; font-weight: 800; margin: 0 0 4px; color: #0f172a; }
  .dbr-breadcrumb { font-size: 12px; color: #64748b; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .dbr-breadcrumb a { color: ${PINK}; text-decoration: none; font-weight: 600; }
  .dbr-breadcrumb--active { color: ${BLUE}; font-weight: 600; }
  .dbr-header-date { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 12px; }
  .dbr-header-date .react-date-picker { border: none; font-size: 13px; }
  .dbr-header-date .react-date-picker__wrapper { border: none; }

  .dbr-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
  .dbr-filter-pill { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 12px; min-width: 130px; flex: 1; max-width: 190px; }
  .dbr-filter-label { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 2px; }
  .dbr-filter-label i { color: ${PINK}; margin-right: 4px; }
  .dbr-filter-select { width: 100%; border: none; background: transparent; font-size: 12px; font-weight: 600; outline: none; cursor: pointer; }

  .dbr-main-tabs { display: flex; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 12px; max-width: 360px; }
  .dbr-main-tab { flex: 1; padding: 10px 16px; border: none; background: #fff; font-size: 13px; font-weight: 700; color: ${BLUE}; cursor: pointer; transition: 0.15s; }
  .dbr-main-tab:not(:last-child) { border-right: 1px solid #e2e8f0; }
  .dbr-main-tab--active { background: ${PINK}; color: #fff; }

  .dbr-session-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; }
  .dbr-session-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
  .dbr-session-summary__lbl { font-size: 13px; font-weight: 800; color: #334155; }
  .dbr-session-summary__count { font-size: 12px; color: #64748b; font-weight: 600; }
  .dbr-session-summary__count strong { color: ${BLUE}; font-size: 14px; }
  .dbr-session-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .dbr-btn--session-pill { background: #fff; color: ${PINK}; border: 1.5px solid ${PINK}; border-radius: 999px; padding: 7px 16px; font-size: 11px; font-weight: 700; }
  .dbr-btn--session-pill:hover { background: #fff5f7; }

  .dbr-student-view { margin-bottom: 20px; }
  .dbr-student-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; margin-bottom: 14px; }
  .dbr-student-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .dbr-student-card__head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed #e2e8f0; }
  .dbr-student-card__head i { color: ${PINK}; }
  .dbr-student-card__head h6 { margin: 0; flex: 1; font-size: 13px; font-weight: 700; }

  .dbr-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 14px; }
  .dbr-search { flex: 1; min-width: 140px; max-width: 220px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; font-size: 12px; background: #fff; }

  .dbr-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; transition: 0.15s; white-space: nowrap; }
  .dbr-btn--outline { background: #fff; color: ${PINK}; border: 1.5px solid ${PINK}; }
  .dbr-btn--outline:hover { background: #fff5f7; }
  .dbr-btn--pink { background: ${PINK}; color: #fff; }
  .dbr-btn--pink:hover { filter: brightness(0.95); }
  .dbr-btn--blue { background: ${BLUE}; color: #fff; }
  .dbr-btn--green { background: #10b981; color: #fff; flex: 1; justify-content: center; }
  .dbr-btn--orange { background: #fff; color: #ea580c; border: 1.5px solid #fdba74; flex: 1; justify-content: center; }
  .dbr-btn--danger { background: #fff; color: #dc2626; border: 1.5px solid #fecaca; }
  .dbr-btn--block { width: 100%; justify-content: center; }
  .dbr-btn--link-sm { background: none; border: none; color: ${BLUE}; font-size: 11px; font-weight: 600; cursor: pointer; }

  .dbr-card-row-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 14px; overflow: hidden; }
  .dbr-card-row-head { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
  .dbr-section-lbl { font-size: 12px; font-weight: 700; color: #475569; }
  .dbr-card-row-wrap--collapsed .dbr-card-row { display: none; }
  .dbr-card-row { display: flex; gap: 10px; overflow-x: auto; padding: 12px; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; }
  .dbr-card-row::-webkit-scrollbar { height: 6px; }
  .dbr-card-row::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

  .dbr-module-card { flex: 0 0 210px; background: #fff; border: 1px solid #e8edf2; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); min-height: 170px; }
  .dbr-module-card__head { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-bottom: 1px dashed #e2e8f0; background: #fafbfc; border-radius: 12px 12px 0 0; }
  .dbr-module-card__title { font-size: 11px; font-weight: 700; color: #334155; }
  .dbr-module-card__title i { color: ${PINK}; margin-right: 4px; }
  .dbr-module-card__body { padding: 10px; font-size: 11px; }
  .dbr-icon-btn { background: none; border: none; color: ${BLUE}; cursor: pointer; padding: 4px; font-size: 12px; }

  .dbr-info-line { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f8fafc; }
  .dbr-info-line i { width: 16px; color: ${BLUE}; font-size: 11px; }
  .dbr-info-line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .dbr-kv { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 11px; }
  .dbr-kv span:first-child { color: #64748b; font-weight: 600; }
  .dbr-kv strong { color: #0f172a; }

  .dbr-mini-row { display: flex; gap: 4px; }
  .dbr-mini-stat { flex: 1; border-radius: 8px; color: #fff; text-align: center; padding: 6px 4px; font-size: 9px; font-weight: 600; }
  .dbr-mini-stat strong { display: block; font-size: 14px; margin-top: 2px; }

  .dbr-att-pct { display: flex; justify-content: space-between; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0; font-weight: 700; }

  .dbr-chip { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
  .dbr-chip--green { background: #d1fae5; color: #059669; }
  .dbr-chip--orange { background: #ffedd5; color: #ea580c; }
  .dbr-chip--red { background: #fee2e2; color: #dc2626; }
  .dbr-chip--blue { background: #dbeafe; color: #1d4ed8; }
  .dbr-chip--gray { background: #f1f5f9; color: #64748b; }

  .dbr-approval-pill { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 999px; }
  .dbr-approval--draft { background: #f1f5f9; color: #64748b; }
  .dbr-approval--submitted { background: #dbeafe; color: #1d4ed8; }
  .dbr-approval--approved { background: #d1fae5; color: #059669; }
  .dbr-approval--returned { background: #fee2e2; color: #dc2626; }

  .dbr-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .dbr-tab { background: #fff; border: 1px solid #e2e8f0; color: ${BLUE}; font-size: 12px; font-weight: 700; padding: 7px 14px; border-radius: 8px; cursor: pointer; }
  .dbr-tab--active { background: ${PINK}; color: #fff; border-color: ${PINK}; box-shadow: 0 2px 8px rgba(250,85,121,0.35); }

  .dbr-tab-panel { margin-bottom: 20px; }
  .dbr-section-card, .dbr-summary-card { position: relative; background: #fff; border: 1px solid #dee2e6; border-radius: 10px; padding: 20px 16px 16px; }
  .dbr-section-card__label { position: absolute; top: -10px; left: 14px; background: #fff; padding: 0 8px; font-size: 13px; font-weight: 700; color: #334155; }

  .dbr-basic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
  .dbr-field { display: flex; flex-direction: column; gap: 4px; }
  .dbr-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
  .dbr-input, .dbr-select, .dbr-textarea { border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; font-size: 12px; background: #f8fafc; outline: none; width: 100%; }
  .dbr-input:focus, .dbr-select:focus, .dbr-textarea:focus { border-color: ${BLUE}; box-shadow: 0 0 0 2px rgba(37,99,235,0.12); background: #fff; }
  .dbr-input--ro { background: #f1f5f9; color: #64748b; }

  .dbr-points-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
  .dbr-point-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .dbr-point-card__top { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
  .dbr-point-id { background: ${BLUE}; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
  .dbr-priority { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 999px; text-transform: uppercase; }
  .dbr-priority--high { background: #fee2e2; color: #dc2626; }
  .dbr-priority--medium { background: #ffedd5; color: #ea580c; }
  .dbr-priority--low { background: #dbeafe; color: #2563eb; }
  .dbr-weight { font-size: 9px; font-weight: 700; color: #94a3b8; margin-left: auto; }
  .dbr-point-name { font-size: 12px; font-weight: 700; margin: 0 0 8px; line-height: 1.35; color: #1e293b; }
  .dbr-point-fields { display: flex; flex-direction: column; gap: 6px; }
  .dbr-issue-type { font-size: 9px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #64748b; font-weight: 600; }
  .dbr-doc-actions { display: flex; gap: 8px; margin-bottom: 8px; }
  .dbr-btn--outline-sm { background: #eff6ff; color: ${BLUE}; border: 1px dashed #93c5fd; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; }

  .dbr-reviewers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
  .dbr-reviewer-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; border-top: 4px solid ${PINK}; padding: 14px; }
  .dbr-reviewer-card__head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: ${PINK}; }
  .dbr-reviewer-card__head h6 { margin: 0; font-weight: 800; font-size: 13px; color: #1e293b; }
  .dbr-reviewer-fields { display: flex; flex-direction: column; gap: 6px; }
  .dbr-reviewer-btns { display: flex; gap: 8px; margin-top: 12px; }

  .dbr-summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-top: 8px; }
  .dbr-summary-stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; }
  .dbr-summary-stat small { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
  .dbr-summary-stat strong { font-size: 18px; color: #0f172a; }

  .dbr-footer { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 2px solid ${PINK}; padding: 10px 20px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; z-index: 100; box-shadow: 0 -4px 16px rgba(0,0,0,0.06); }
  .dbr-toast { position: fixed; bottom: 70px; right: 20px; background: #1e293b; color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; z-index: 200; }

  .mt-1 { margin-top: 4px; }
  .mt-2 { margin-top: 8px; }
  .mt-3 { margin-top: 12px; }
  .text-success { color: #10b981; }
  .text-warning { color: #f59e0b; }

  @media (max-width: 768px) {
    .dbr-portal { padding: 12px 12px 100px; }
    .dbr-module-card { flex: 0 0 85%; }
    .dbr-filter-pill { max-width: 100%; }
    .dbr-points-grid { grid-template-columns: 1fr; }
    .dbr-basic-grid { grid-template-columns: 1fr; }
  }
`;

export default TrainerModule;
