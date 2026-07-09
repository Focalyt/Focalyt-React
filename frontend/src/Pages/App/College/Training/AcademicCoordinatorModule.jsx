import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';

const PINK = '#fa5579';
const BLUE = '#2563eb';

const getOptionLabel = (options = [], value) =>
  options.find((option) => String(option.value) === String(value))?.label || '';

const mapApiOptions = (items = []) =>
  (items || [])
    .filter((item) => item && item._id && item.name)
    .map((item) => ({ value: String(item._id), label: item.name }));

const WORKFLOW_STATUS = {
  SCHEDULED: 'Scheduled',
  SENT_TO_SENIOR: 'Sent to Senior Trainer',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
 
};

const STATUS_TONE = {
  [WORKFLOW_STATUS.SCHEDULED]: 'blue',
  [WORKFLOW_STATUS.SENT_TO_SENIOR]: 'amber',
  [WORKFLOW_STATUS.ASSIGNED]: 'purple',
  [WORKFLOW_STATUS.IN_PROGRESS]: 'teal',
  [WORKFLOW_STATUS.COMPLETED]: 'green',
};

const SESSION_PATH_STEPS = [
  { key: 'department', label: 'Department', icon: 'fa-sitemap', step: 1, hint: 'Select department to plan sessions' },
  { key: 'project', label: 'Project', icon: 'fa-project-diagram', step: 2, hint: 'Projects under selected department' },
  { key: 'center', label: 'Center', icon: 'fa-building', step: 3, hint: 'Training center for this project' },
  { key: 'course', label: 'Course', icon: 'fa-graduation-cap', step: 4, hint: 'Course / trade at this center' },
  { key: 'batch', label: 'Batch', icon: 'fa-users', step: 5, hint: 'Batch for session planning' },
];

const DOC_REQUIREMENT = {
  MANDATORY: 'mandatory',
  NON_MANDATORY: 'non_mandatory',
};

const DOC_REQUIREMENT_OPTIONS = [
  { value: DOC_REQUIREMENT.MANDATORY, label: 'Mandatory' },
  { value: DOC_REQUIREMENT.NON_MANDATORY, label: 'Non-mandatory' },
];

const getDocRequirementLabel = (value) =>
  DOC_REQUIREMENT_OPTIONS.find((option) => option.value === value)?.label || 'Mandatory';

const EVIDENCE_TYPE_OPTIONS = ['Document', 'Image', 'Video', 'PDF'];

const LEARNING_MATERIAL_TYPE_OPTIONS = ['PDF', 'Video', 'Document', 'Presentation', 'Link', 'Image'];

const createMaterialItem = (defaultType = 'Document') => ({
  id: `MAT${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  type: defaultType,
  requirement: DOC_REQUIREMENT.MANDATORY,
});

const normalizeMaterialItems = (items = []) =>
  items
    .filter((item) => item.name?.trim())
    .map((item) => ({
      ...item,
      name: item.name.trim(),
      requirement: item.requirement || DOC_REQUIREMENT.MANDATORY,
      requirementLabel: getDocRequirementLabel(item.requirement),
    }));

const countMaterialsByRequirement = (items = []) => {
  const mandatory = items.filter(
    (item) => (item.requirement || DOC_REQUIREMENT.MANDATORY) === DOC_REQUIREMENT.MANDATORY
  ).length;
  return {
    total: items.length,
    mandatory,
    optional: items.length - mandatory,
  };
};

const MaterialDefinitionSection = ({
  title,
  hint,
  addLabel,
  emptyText,
  items = [],
  typeOptions = EVIDENCE_TYPE_OPTIONS,
  nameColumnLabel = 'Name',
  typeColumnLabel = 'Type',
  namePlaceholder = 'Enter name',
  onAdd,
  onChange,
  onRemove,
}) => (
  <div className="ac-evidence-builder">
    <div className="ac-evidence-builder__head">
      <h6>{title}</h6>
      <button type="button" className="ac-mini-btn" onClick={onAdd}>
        <i className="fas fa-plus" /> {addLabel}
      </button>
    </div>
    <p className="ac-evidence-hint">{hint}</p>
    {items.length === 0 && (
      <p className="ac-evidence-empty">{emptyText}</p>
    )}
    {items.length > 0 && (
      <div className="ac-evidence-row ac-evidence-row--head">
        <span>{nameColumnLabel}</span>
        <span>{typeColumnLabel}</span>
        <span>Requirement</span>
        <span />
      </div>
    )}
    {items.map((item, index) => (
      <div key={item.id || index} className="ac-evidence-row">
        <input
          className="ac-input"
          placeholder={namePlaceholder}
          value={item.name}
          onChange={(e) => onChange(index, 'name', e.target.value)}
        />
        <select
          className="ac-input"
          value={item.type}
          onChange={(e) => onChange(index, 'type', e.target.value)}
        >
          {typeOptions.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          className="ac-input"
          value={item.requirement || DOC_REQUIREMENT.MANDATORY}
          onChange={(e) => onChange(index, 'requirement', e.target.value)}
        >
          {DOC_REQUIREMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button
          type="button"
          className="ac-remove-btn"
          onClick={() => onRemove(index)}
          aria-label="Remove item"
        >
          <i className="fas fa-trash" />
        </button>
      </div>
    ))}
  </div>
);

const SESSION_TYPE = {
  STUDENT: 'student',
  TOT: 'tot',
};

const DEFAULT_COURSE_STRUCTURE = { unit: true, chapter: true, session: true };

const normalizeCourseStructure = (structure) => ({
  unit: structure?.unit ?? DEFAULT_COURSE_STRUCTURE.unit,
  chapter: structure?.chapter ?? DEFAULT_COURSE_STRUCTURE.chapter,
  session: true,
});

const getCourseStructureFromMeta = (courses = [], courseId) => {
  if (!courseId) return { ...DEFAULT_COURSE_STRUCTURE };
  const course = courses.find((item) => String(item._id) === String(courseId));
  return normalizeCourseStructure(course?.courseStructure);
};

const buildStructurePathLabel = (structure = DEFAULT_COURSE_STRUCTURE) => {
  const parts = [];
  if (structure.unit) parts.push('Unit');
  if (structure.chapter) parts.push('Chapter');
  parts.push('Session');
  return parts.join(' → ');
};

const hasLinkedTot = (session = {}) => (
  session.includeTot === true || session.sessionType === SESSION_TYPE.TOT
);

const appearsOnStudentCalendar = (session = {}) => (
  session.sessionType === SESSION_TYPE.STUDENT || session.sessionType !== SESSION_TYPE.TOT
);

const appearsOnTotCalendar = (session = {}) => hasLinkedTot(session);

const getTotDisplayTitle = (session = {}) => (
  session.totTitle?.trim() || `TOT – ${session.title || 'Session'}`
);

const getTotDisplayTopic = (session = {}) => (
  session.totUseSameTopics !== false
    ? (session.topicCovered || '')
    : (session.totTopicCovered || session.topicCovered || '')
);

const mapSessionForTotCalendar = (session = {}) => ({
  ...session,
  id: `${session.id}-tot`,
  sourceSessionId: session.id,
  title: getTotDisplayTitle(session),
  topicCovered: getTotDisplayTopic(session),
  trainingMethod: session.totUseSameTopics !== false
    ? (session.trainingMethod || '')
    : (session.totTrainingMethod || session.trainingMethod || ''),
});

const PROOF_TYPE_OPTIONS = ['Document', 'Image', 'Video', 'PDF'];

const validateTotBeforeSave = (draft) => {
  if (draft.includeTot === false) return { valid: true };

  if (draft.totUseSameTopics === false && !draft.totTopicCovered?.trim()) {
    return { valid: false, message: 'Enter TOT topic or enable same topics as student session' };
  }

  return { valid: true };
};

const TotSection = ({
  draft,
  onFieldChange,
  onTotMaterialChange,
  onAddTotMaterial,
  onRemoveTotMaterial,
  onTotCompletionProofChange,
  onAddTotCompletionProof,
  onRemoveTotCompletionProof,
}) => {
  if (draft.includeTot === false) return null;

  const useSameTopics = draft.totUseSameTopics !== false;

  return (
    <div className="ac-tot-panel">
      <div className="ac-tot-panel__head">
        <div>
          <h6>
            <i className="fas fa-chalkboard-teacher" /> TOT — Training of Trainers
          </h6>
          <p>Linked TOT plan for this student session. Senior Trainer will assign the trainer after review.</p>
        </div>
      </div>

      <div className="ac-tot-info-box">
        <i className="fas fa-info-circle" />
        <p>
          Field trainer and TOT trainer are <strong>not selected here</strong>.
          Send the plan to Senior Trainer — they will assign trainers.
        </p>
      </div>

      <label className="ac-tot-check">
        <input
          type="checkbox"
          checked={useSameTopics}
          onChange={(e) => onFieldChange('totUseSameTopics', e.target.checked)}
        />
        <span>Use same topics as student session in TOT</span>
      </label>

      {useSameTopics ? (
        <div className="ac-tot-sync-box">
          <i className="fas fa-link" />
          <div>
            <strong>Topics synced with student session</strong>
            <p>{buildTopicSummary(draft) || 'Add chapter and sub topics above — they will appear in TOT too.'}</p>
            {draft.trainingMethod?.trim() && (
              <p className="ac-tot-sync-box__method">Method: {draft.trainingMethod}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="ac-form-grid">
          <label className="ac-field ac-field--full">
            <span>TOT topic covered *</span>
            <input
              className="ac-input"
              placeholder="Separate topics for trainer TOT..."
              value={draft.totTopicCovered || ''}
              onChange={(e) => onFieldChange('totTopicCovered', e.target.value)}
            />
          </label>
          <label className="ac-field ac-field--full">
            <span>TOT training method</span>
            <input
              className="ac-input"
              placeholder="How TOT will be delivered..."
              value={draft.totTrainingMethod || ''}
              onChange={(e) => onFieldChange('totTrainingMethod', e.target.value)}
            />
          </label>
        </div>
      )}

    <label className="ac-tot-check">
      <input
        type="checkbox"
        checked={draft.requireTotCompletionProofs === true}
        onChange={(e) => onFieldChange('requireTotCompletionProofs', e.target.checked)}
      />
      <span>Trainer must submit completion proofs after TOT</span>
    </label>

    {draft.requireTotCompletionProofs === true && (
      <MaterialDefinitionSection
        title="TOT completion proofs"
        addLabel="Add proof"
        emptyText="No completion proofs defined yet."
        nameColumnLabel="Proof name"
        typeColumnLabel="Proof type"
        namePlaceholder="e.g. Signed TOT certificate"
        items={draft.totCompletionProofs || []}
        typeOptions={PROOF_TYPE_OPTIONS}
        onAdd={onAddTotCompletionProof}
        onChange={onTotCompletionProofChange}
        onRemove={onRemoveTotCompletionProof}
      />
    )}

    <MaterialDefinitionSection
      title="TOT learning material"
      addLabel="Add TOT material"
      emptyText="No TOT material defined yet."
      items={draft.totMaterials || []}
      typeOptions={LEARNING_MATERIAL_TYPE_OPTIONS}
      onAdd={onAddTotMaterial}
      onChange={onTotMaterialChange}
      onRemove={onRemoveTotMaterial}
    />
  </div>
  );
};

const STORAGE_PREFIX = 'acCoordinatorSessions:';
const ACTIVITY_TYPES_STORAGE_KEY = 'acCoordinatorActivityTypes';

const DEFAULT_ACTIVITY_TYPES = [
  { id: 'act-1', name: 'Classroom Session', color: '#2563eb' },
  { id: 'act-2', name: 'Extra Curricular Activity', color: '#8b5cf6' },
  { id: 'act-3', name: 'Interview Skills', color: '#f59e0b' },
  { id: 'act-4', name: 'Quiz', color: '#10b981' },
  { id: 'act-5', name: 'Practical / Lab', color: '#ec4899' },
  { id: 'act-6', name: 'Assessment', color: '#ef4444' },
];

const PRESET_COLORS = [
  '#2563eb', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7',
];

const loadActivityTypes = () => {
  try {
    const raw = localStorage.getItem(ACTIVITY_TYPES_STORAGE_KEY);
    if (!raw) return DEFAULT_ACTIVITY_TYPES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_ACTIVITY_TYPES;
  } catch {
    return DEFAULT_ACTIVITY_TYPES;
  }
};

const persistActivityTypes = (types) => {
  localStorage.setItem(ACTIVITY_TYPES_STORAGE_KEY, JSON.stringify(types));
};

const getActivityTypeById = (types, id) => types.find((type) => type.id === id) || null;

const normalizeActivityItem = (item) => ({
  id: item.id,
  name: item.name || '',
  color: item.color || BLUE,
});

/** Supports legacy single-type sessions and new multi-select array */
const getSessionActivities = (session = {}) => {
  if (Array.isArray(session.sessionActivities) && session.sessionActivities.length) {
    return session.sessionActivities.map(normalizeActivityItem);
  }
  if (session.activityTypeId) {
    return [normalizeActivityItem({
      id: session.activityTypeId,
      name: session.activityTypeName,
      color: session.activityColor,
    })];
  }
  return [];
};

const normalizeSessionActivities = (items = []) =>
  items
    .filter((item) => item?.id && item?.name?.trim())
    .map((item) => normalizeActivityItem({
      id: item.id,
      name: item.name.trim(),
      color: item.color,
    }));

const buildActivityDistribution = (sessions = [], activityTypes = []) => {
  const counts = {};
  activityTypes.forEach((type) => { counts[type.id] = 0; });
  sessions.forEach((session) => {
    getSessionActivities(session).forEach((activity) => {
      if (counts[activity.id] != null) counts[activity.id] += 1;
    });
  });
  return activityTypes.map((type) => ({
    ...type,
    count: counts[type.id] || 0,
  }));
};

const buildActivityHeadStyle = (activities = []) => {
  if (!activities.length) return undefined;
  if (activities.length === 1) {
    const color = activities[0].color;
    return { background: `linear-gradient(105deg, ${color} 0%, ${color}cc 55%, ${color}99 100%)` };
  }
  const stops = activities
    .map((activity, index) => {
      const percent = Math.round((index / (activities.length - 1)) * 100);
      return `${activity.color} ${percent}%`;
    })
    .join(', ');
  return { background: `linear-gradient(105deg, ${stops})` };
};

const ActivityTypesManager = ({ types, onChange, onClose, onNotify }) => {
  const [draftTypes, setDraftTypes] = useState(types);

  const updateType = (index, field, value) => {
    setDraftTypes((prev) => prev.map((item, i) => (
      i === index ? { ...item, [field]: value } : item
    )));
  };

  const addType = () => {
    const nextIndex = draftTypes.length + 1;
    const color = PRESET_COLORS[(draftTypes.length) % PRESET_COLORS.length];
    setDraftTypes((prev) => [
      ...prev,
      { id: `act-${Date.now()}`, name: `Activity ${nextIndex}`, color },
    ]);
  };

  const removeType = (index) => {
    if (draftTypes.length <= 1) {
      onNotify('At least one activity type is required');
      return;
    }
    setDraftTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const cleaned = draftTypes
      .map((type) => ({
        ...type,
        name: type.name?.trim() || 'Untitled Activity',
        color: type.color || BLUE,
      }))
      .filter((type) => type.name);
    if (!cleaned.length) {
      onNotify('Add at least one activity type');
      return;
    }
    onChange(cleaned);
    onNotify('Activity types saved');
    onClose();
  };

  return (
    <div className="ac-modal-backdrop">
      <div className="ac-modal ac-modal--wide" role="dialog" aria-modal="true">
        <div className="ac-modal__head">
          <div>
            <h5>Session Activity Types</h5>
            <span>Define labels & colors before creating sessions</span>
          </div>
          <button type="button" className="ac-modal__close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="ac-modal__body">
          <p className="ac-evidence-hint">
            Examples: Extra Curricular Activity, Interview Skills, Quiz. Each type gets a color used on session cards and calendar views.
          </p>

          <div className="ac-activity-manage-head">
            <span>Name</span>
            <span>Color</span>
            <span>Preview</span>
            <span />
          </div>

          {draftTypes.map((type, index) => (
            <div key={type.id} className="ac-activity-manage-row">
              <input
                className="ac-input"
                value={type.name}
                onChange={(e) => updateType(index, 'name', e.target.value)}
                placeholder="e.g. Interview Skills"
              />
              <div className="ac-color-field">
                <input
                  type="color"
                  className="ac-color-input"
                  value={type.color}
                  onChange={(e) => updateType(index, 'color', e.target.value)}
                />
                <div className="ac-color-swatches">
                  {PRESET_COLORS.slice(0, 6).map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`ac-color-swatch${type.color === color ? ' ac-color-swatch--active' : ''}`}
                      style={{ background: color }}
                      onClick={() => updateType(index, 'color', color)}
                      aria-label={`Use color ${color}`}
                    />
                  ))}
                </div>
              </div>
              <span className="ac-activity-preview-pill" style={{ background: type.color }}>
                {type.name || 'Preview'}
              </span>
              <button type="button" className="ac-remove-btn" onClick={() => removeType(index)} aria-label="Remove type">
                <i className="fas fa-trash" />
              </button>
            </div>
          ))}

          <button type="button" className="ac-mini-btn ac-mini-btn--block" onClick={addType}>
            <i className="fas fa-plus" /> Add activity type
          </button>
        </div>

        <div className="ac-modal__foot">
          <button type="button" className="ac-btn ac-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="ac-btn ac-btn--primary" onClick={handleSave}>
            <i className="fas fa-save" /> Save types
          </button>
        </div>
      </div>
    </div>
  );
};

const ActivityTypeSelector = ({ types, selectedIds = [], onToggle, onClearAll }) => (
  <div className="ac-activity-picker">
    <div className="ac-activity-picker__head">
      <div>
        <span>Session activity types</span>
        <small>Optional — select one or more categories</small>
      </div>
      {selectedIds.length > 0 && (
        <button type="button" className="ac-activity-clear" onClick={onClearAll}>
          Clear all ({selectedIds.length})
        </button>
      )}
    </div>
    <div className="ac-activity-picker__grid">
      {types.map((type) => {
        const isSelected = selectedIds.includes(type.id);
        return (
          <button
            key={type.id}
            type="button"
            className={`ac-activity-chip${isSelected ? ' ac-activity-chip--active' : ''}`}
            style={{
              '--chip-color': type.color,
              borderColor: isSelected ? type.color : '#e2e8f0',
              background: isSelected ? `${type.color}18` : '#fff',
            }}
            onClick={() => onToggle(type)}
          >
            <span className="ac-activity-chip__dot" style={{ background: type.color }} />
            <span className="ac-activity-chip__label">{type.name}</span>
            {isSelected && <i className="fas fa-check ac-activity-chip__check" />}
          </button>
        );
      })}
    </div>
  </div>
);

const ColorDistributionPanel = ({ distribution, totalSessions }) => {
  const withSessions = distribution.filter((item) => item.count > 0);
  const maxCount = Math.max(...distribution.map((item) => item.count), 1);

  return (
    <section className="ac-color-distribution">
      <div className="ac-color-distribution__head">
        <h3><i className="fas fa-palette" /> Session color distribution</h3>
        <span>{totalSessions} sessions planned</span>
      </div>

      {totalSessions > 0 && (
        <div className="ac-color-distribution__bar">
          {withSessions.map((item) => (
            <div
              key={item.id}
              className="ac-color-distribution__segment"
              style={{
                flex: item.count,
                background: item.color,
              }}
              title={`${item.name}: ${item.count}`}
            />
          ))}
        </div>
      )}

      <div className="ac-color-distribution__legend">
        {distribution.map((item) => (
          <div key={item.id} className="ac-color-distribution__legend-item">
            <span className="ac-color-distribution__dot" style={{ background: item.color }} />
            <div className="ac-color-distribution__legend-text">
              <strong>{item.name}</strong>
              <span>{item.count} session{item.count === 1 ? '' : 's'}</span>
            </div>
            <div className="ac-color-distribution__meter">
              <div
                className="ac-color-distribution__meter-fill"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  background: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const getTodayInputValue = () => new Date().toISOString().slice(0, 10);

const formatSessionDate = (dateValue) => {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString('en-IN');
};

const buildTopicSummary = (draft = {}) => {
  const chapterParts = [];
  if (draft.chapterNumber?.toString().trim()) {
    chapterParts.push(`Ch. ${draft.chapterNumber.toString().trim()}`);
  }
  if (draft.chapterName?.trim()) chapterParts.push(draft.chapterName.trim());
  const chapterLine = chapterParts.join(' — ');
  const sub = draft.subTopics?.trim() || '';
  if (chapterLine && sub) return `${chapterLine}: ${sub}`;
  return chapterLine || sub || draft.topicCovered?.trim() || '';
};

const getNextSessionNumber = (sessions = []) => {
  const nums = sessions
    .map((s) => parseInt(String(s.sessionNumber ?? ''), 10))
    .filter((n) => Number.isFinite(n));
  if (nums.length) return String(Math.max(...nums) + 1);
  return String(sessions.length + 1);
};

const formatChapterLabel = (session = {}) => {
  const num = session.chapterNumber?.toString().trim();
  const name = session.chapterName?.trim();
  if (num && name) return `Ch. ${num} — ${name}`;
  if (num) return `Ch. ${num}`;
  return name || '';
};

const parseSubTopics = (raw = '') => (
  String(raw)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
);

const hasUnitInfo = (session = {}) => (
  !!(session.unitNumber?.toString().trim() || session.unitName?.trim())
);

const hasChapterInfo = (session = {}) => (
  !!(session.chapterNumber?.toString().trim() || session.chapterName?.trim())
);

const getUnitLabel = (session = {}) => {
  if (!hasUnitInfo(session)) return '';
  const num = session.unitNumber?.toString().trim();
  const name = session.unitName?.trim();
  if (num && name) return `Unit ${num} — ${name}`;
  if (num) return `Unit ${num}`;
  return name;
};

const mergeSubTopics = (target = [], raw = '') => {
  parseSubTopics(raw).forEach((topic) => {
    if (!target.includes(topic)) target.push(topic);
  });
  return target;
};

const compareSessionsForToc = (a, b) => {
  const unitA = parseInt(String(a.unitNumber ?? ''), 10);
  const unitB = parseInt(String(b.unitNumber ?? ''), 10);
  if (Number.isFinite(unitA) && Number.isFinite(unitB) && unitA !== unitB) return unitA - unitB;
  const chA = parseInt(String(a.chapterNumber ?? ''), 10);
  const chB = parseInt(String(b.chapterNumber ?? ''), 10);
  if (Number.isFinite(chA) && Number.isFinite(chB) && chA !== chB) return chA - chB;
  const sesA = parseInt(String(a.sessionNumber ?? ''), 10);
  const sesB = parseInt(String(b.sessionNumber ?? ''), 10);
  if (Number.isFinite(sesA) && Number.isFinite(sesB)) return sesA - sesB;
  return 0;
};

const buildCourseToc = (sessions = []) => {
  const directSessions = [];
  const looseChaptersMap = new Map();
  const unitsMap = new Map();

  [...sessions].sort(compareSessionsForToc).forEach((session) => {
    const withUnit = hasUnitInfo(session);
    const withChapter = hasChapterInfo(session);

    if (!withUnit && !withChapter) {
      directSessions.push(session);
      return;
    }

    if (!withUnit && withChapter) {
      const chapterKey = `${session.chapterNumber || ''}::${session.chapterName || ''}`;
      if (!looseChaptersMap.has(chapterKey)) {
        looseChaptersMap.set(chapterKey, {
          key: chapterKey,
          chapterNumber: session.chapterNumber?.toString().trim() || '',
          chapterName: session.chapterName?.trim() || '',
          subTopics: [],
          sessions: [],
        });
      }
      const chapter = looseChaptersMap.get(chapterKey);
      mergeSubTopics(chapter.subTopics, session.subTopics);
      chapter.sessions.push(session);
      return;
    }

    const unitKey = `${session.unitNumber || ''}::${session.unitName || ''}`;
    if (!unitsMap.has(unitKey)) {
      unitsMap.set(unitKey, {
        key: unitKey,
        unitNumber: session.unitNumber?.toString().trim() || '',
        unitName: session.unitName?.trim() || '',
        directSessions: [],
        chapters: new Map(),
      });
    }
    const unit = unitsMap.get(unitKey);

    if (withUnit && !withChapter) {
      unit.directSessions.push(session);
      return;
    }

    const chapterKey = `${session.chapterNumber || ''}::${session.chapterName || ''}`;
    if (!unit.chapters.has(chapterKey)) {
      unit.chapters.set(chapterKey, {
        key: chapterKey,
        chapterNumber: session.chapterNumber?.toString().trim() || '',
        chapterName: session.chapterName?.trim() || '',
        subTopics: [],
        sessions: [],
      });
    }
    const chapter = unit.chapters.get(chapterKey);
    mergeSubTopics(chapter.subTopics, session.subTopics);
    chapter.sessions.push(session);
  });

  return {
    directSessions,
    looseChapters: Array.from(looseChaptersMap.values()),
    units: Array.from(unitsMap.values()).map((unit) => ({
      ...unit,
      chapters: Array.from(unit.chapters.values()),
    })),
  };
};

const isTocEmpty = (tree = {}) => (
  !tree.directSessions?.length && !tree.looseChapters?.length && !tree.units?.length
);

const loadStoredSessions = (batchId) => {
  if (!batchId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${batchId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistStoredSessions = (batchId, list) => {
  if (!batchId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${batchId}`, JSON.stringify(list));
  } catch (error) {
    console.error('Failed to save sessions to localStorage', error);
  }
};

const createEmptySessionDraft = () => ({
  id: '',
  title: '',
  sessionNumber: '',
  unitNumber: '',
  unitName: '',
  chapterNumber: '',
  chapterName: '',
  subTopics: '',
  topicCovered: '',
  trainingMethod: '',
  sessionDate: getTodayInputValue(),
  startTime: '10:00',
  endTime: '12:00',
  seniorTrainerId: '',
  seniorTrainerName: '',
  sessionType: SESSION_TYPE.STUDENT,
  includeTot: true,
  totUseSameTopics: true,
  totTopicCovered: '',
  totTrainingMethod: '',
  fieldTrainerId: '',
  fieldTrainerName: '',
  requireTotCompletionProofs: false,
  totTrainerId: '',
  totTrainerName: '',
  totStatus: 'pending',
  totCompletionProofs: [],
  sessionActivities: [],
  notes: '',
  evidenceDocs: [],
  learningMaterials: [],
  totMaterials: [],
  workflowStatus: WORKFLOW_STATUS.SCHEDULED,
});

const buildContextFromFilters = (filters, labels) => ({
  department: filters.department,
  project: filters.project,
  center: filters.center,
  course: filters.course,
  batch: filters.batch,
  departmentName: labels.departmentName,
  projectName: labels.projectName,
  centerName: labels.centerName,
  courseTrade: labels.courseTrade,
  batchCode: labels.batchCode,
  studentCount: labels.studentCount,
});

/** Demo sessions — shows Course → Chapter → Sub topics → Session structure */
const createDummySessions = (context = {}) => {
  const courseName = context.courseTrade || 'Retail Sales Associate';
  const batchName = context.batchCode || 'Batch-2026-Jan';
  const today = getTodayInputValue();
  const dateLabel = formatSessionDate(today);

  const base = {
    sessionType: SESSION_TYPE.STUDENT,
    sessionDate: today,
    date: dateLabel,
    seniorTrainerId: '',
    seniorTrainerName: '',
    fieldTrainerId: '',
    fieldTrainerName: '',
    totTrainerId: '',
    totTrainerName: '',
    totStatus: 'pending',
    sessionActivities: [{ id: 'act-1', name: 'Classroom Session', color: '#2563eb' }],
    evidenceDocs: [
      { id: 'ev-d1.1', name: 'Session plan PDF', type: 'PDF', status: 'Pending', requirement: DOC_REQUIREMENT.MANDATORY },
    ],
    learningMaterials: [
      { id: 'lm-d.1', name: 'Chapter handbook', type: 'PDF', requirement: DOC_REQUIREMENT.MANDATORY },
    ],
    notes: 'Dummy session — for structure preview only.',
    workflowStatus: WORKFLOW_STATUS.SCHEDULED,
    createdAt: new Date().toISOString(),
    ...context,
    courseTrade: courseName,
    batchCode: batchName,
  };

  const session1Draft = {
    unitNumber: '1',
    unitName: 'Foundation Skills',
    sessionNumber: '1',
    chapterNumber: '1',
    chapterName: 'Introduction to Retail',
    subTopics: 'Store layout basics\nCustomer greeting\nProduct display rules',
    title: 'Store orientation and customer greeting',
    trainingMethod: 'Classroom + Demo',
    startTime: '10:00',
    endTime: '12:00',
    includeTot: true,
    totUseSameTopics: true,
    requireTotCompletionProofs: true,
    totCompletionProofs: [
      { id: 'tcp-d.1', name: 'Signed TOT certificate', type: 'PDF', requirement: DOC_REQUIREMENT.MANDATORY },
    ],
    totMaterials: [
      { id: 'tot-d.1', name: 'Trainer delivery guide', type: 'PDF', requirement: DOC_REQUIREMENT.MANDATORY },
    ],
  };

  const session2Draft = {
    unitNumber: '1',
    unitName: 'Foundation Skills',
    sessionNumber: '2',
    chapterNumber: '2',
    chapterName: 'Product Knowledge',
    subTopics: 'Product categories, Features and benefits, Upselling techniques',
    title: 'Product categories and selling points',
    trainingMethod: 'Interactive Learning',
    startTime: '14:00',
    endTime: '16:00',
    includeTot: true,
    totUseSameTopics: false,
    totTopicCovered: 'Trainer delivery methods for product knowledge module',
    totTrainingMethod: 'TOT workshop + role-play',
    requireTotCompletionProofs: true,
    totCompletionProofs: [
      { id: 'tcp-d.2', name: 'TOT attendance sheet', type: 'PDF', requirement: DOC_REQUIREMENT.MANDATORY },
    ],
    totMaterials: [
      { id: 'tot-d.2', name: 'Product trainer kit', type: 'PDF', requirement: DOC_REQUIREMENT.MANDATORY },
    ],
    workflowStatus: WORKFLOW_STATUS.SENT_TO_SENIOR,
  };

  const session3Draft = {
    unitNumber: '2',
    unitName: 'Advanced Skills',
    sessionNumber: '3',
    chapterNumber: '3',
    chapterName: 'Customer Handling',
    subTopics: 'Objection handling\nClosing techniques\nRole-play practice',
    title: 'Role-play — objection handling',
    trainingMethod: 'Practical / Lab',
    startTime: '09:00',
    endTime: '11:00',
    includeTot: false,
    totUseSameTopics: false,
    requireTotCompletionProofs: false,
    totCompletionProofs: [],
    totMaterials: [],
  };

  const session4Draft = {
    sessionNumber: '4',
    title: 'Batch orientation briefing',
    trainingMethod: 'Discussion',
    startTime: '11:30',
    endTime: '12:30',
    includeTot: false,
    notes: 'Session only — no unit or chapter.',
  };

  const session5Draft = {
    unitNumber: '3',
    unitName: 'Soft Skills',
    sessionNumber: '5',
    title: 'Communication and teamwork',
    trainingMethod: 'Classroom',
    startTime: '15:00',
    endTime: '16:00',
    includeTot: false,
    notes: 'Unit only — no chapter.',
  };

  const session6Draft = {
    sessionNumber: '6',
    chapterNumber: '4',
    chapterName: 'Safety protocols',
    subTopics: 'Fire safety\nFirst aid basics',
    title: 'Workplace safety overview',
    trainingMethod: 'Classroom + Demo',
    startTime: '09:30',
    endTime: '10:30',
    includeTot: false,
    notes: 'Chapter only — no unit.',
  };

  return [
    {
      ...base,
      ...session1Draft,
      id: `DUMMY-${Date.now()}-1`,
      topicCovered: buildTopicSummary(session1Draft),
    },
    {
      ...base,
      ...session2Draft,
      id: `DUMMY-${Date.now()}-2`,
      topicCovered: buildTopicSummary(session2Draft),
    },
    {
      ...base,
      ...session3Draft,
      id: `DUMMY-${Date.now()}-3`,
      topicCovered: buildTopicSummary(session3Draft),
    },
    {
      ...base,
      ...session4Draft,
      id: `DUMMY-${Date.now()}-4`,
      topicCovered: buildTopicSummary(session4Draft),
    },
    {
      ...base,
      ...session5Draft,
      id: `DUMMY-${Date.now()}-5`,
      topicCovered: buildTopicSummary(session5Draft),
    },
    {
      ...base,
      ...session6Draft,
      id: `DUMMY-${Date.now()}-6`,
      topicCovered: buildTopicSummary(session6Draft),
    },
  ];
};

const TocSessionButton = ({ session, selectedSessionId, onSelectSession }) => {
  const isActive = selectedSessionId === session.id;
  return (
    <button
      type="button"
      className={`ac-toc-item ac-toc-item--session${isActive ? ' ac-toc-item--session-active' : ''}`}
      onClick={() => onSelectSession(session.id)}
    >
      <i className="fas fa-play-circle ac-toc-item__session-icon" />
      <div>
        <span>Session {session.sessionNumber || '—'}</span>
        <strong>{session.title || 'Untitled session'}</strong>
      </div>
    </button>
  );
};

const TocChapterBlock = ({
  chapter,
  expandKey,
  expanded,
  onToggle,
  selectedSessionId,
  onSelectSession,
}) => (
  <div className="ac-toc-chapter">
    <button type="button" className="ac-toc-item ac-toc-item--chapter" onClick={() => onToggle(expandKey)}>
      <i className={`fas fa-chevron-${expanded ? 'down' : 'right'} ac-toc-item__chevron`} />
      <div>
        <span>{chapter.chapterNumber ? `Ch. ${chapter.chapterNumber}` : 'Chapter'}</span>
        <strong>{chapter.chapterName || formatChapterLabel(chapter) || 'Untitled chapter'}</strong>
      </div>
    </button>
    {expanded && (
      <div className="ac-toc-nested ac-toc-nested--chapter">
        {chapter.subTopics.map((topic) => (
          <div key={topic} className="ac-toc-item ac-toc-item--subtopic">
            <i className="fas fa-circle ac-toc-item__dot" />
            <span>{topic}</span>
          </div>
        ))}
        {chapter.sessions.map((session) => (
          <TocSessionButton
            key={session.id}
            session={session}
            selectedSessionId={selectedSessionId}
            onSelectSession={onSelectSession}
          />
        ))}
      </div>
    )}
  </div>
);

const CourseTableOfContents = ({
  courseName,
  batchName,
  tree = {},
  selectedSessionId,
  onSelectSession,
}) => {
  const { directSessions = [], looseChapters = [], units = [] } = tree;

  const [expanded, setExpanded] = useState(() => {
    const initial = { course: true, 'group:direct': true };
    directSessions.forEach((session) => { initial[`session:${session.id}`] = true; });
    looseChapters.forEach((chapter) => { initial[`loose:${chapter.key}`] = true; });
    units.forEach((unit) => {
      initial[`unit:${unit.key}`] = true;
      unit.chapters.forEach((chapter) => {
        initial[`chapter:${unit.key}:${chapter.key}`] = true;
      });
    });
    return initial;
  });

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev, course: true };
      if (directSessions.length) next['group:direct'] = prev['group:direct'] ?? true;
      looseChapters.forEach((chapter) => {
        next[`loose:${chapter.key}`] = prev[`loose:${chapter.key}`] ?? true;
      });
      units.forEach((unit) => {
        next[`unit:${unit.key}`] = prev[`unit:${unit.key}`] ?? true;
        unit.chapters.forEach((chapter) => {
          next[`chapter:${unit.key}:${chapter.key}`] = prev[`chapter:${unit.key}:${chapter.key}`] ?? true;
        });
      });
      return next;
    });
  }, [tree, directSessions, looseChapters, units]);

  const toggle = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="ac-toc-panel">
      <div className="ac-toc-panel__head">
        <h4><i className="fas fa-list-ul" /> Table of contents</h4>
        <p>Flexible: session only, unit, chapter, or full hierarchy</p>
      </div>

      <div className="ac-toc-panel__body">
        <button
          type="button"
          className="ac-toc-item ac-toc-item--course"
          onClick={() => toggle('course')}
        >
          <i className={`fas fa-chevron-${expanded.course ? 'down' : 'right'} ac-toc-item__chevron`} />
          <div>
            <span>Course</span>
            <strong>{courseName || '—'}</strong>
          </div>
        </button>

        {expanded.course && (
          <div className="ac-toc-nested">
            <div className="ac-toc-item ac-toc-item--batch">
              <span>Batch</span>
              <strong>{batchName || '—'}</strong>
            </div>

            {isTocEmpty(tree) ? (
              <p className="ac-toc-empty">No sessions yet. Create a plan or load demo data.</p>
            ) : (
              <>
                {directSessions.length > 0 && (
                  <div className="ac-toc-group">
                    {directSessions.map((session) => (
                      <TocSessionButton
                        key={session.id}
                        session={session}
                        selectedSessionId={selectedSessionId}
                        onSelectSession={onSelectSession}
                      />
                    ))}
                  </div>
                )}

                {looseChapters.map((chapter) => (
                  <TocChapterBlock
                    key={chapter.key}
                    chapter={chapter}
                    expandKey={`loose:${chapter.key}`}
                    expanded={expanded[`loose:${chapter.key}`]}
                    onToggle={toggle}
                    selectedSessionId={selectedSessionId}
                    onSelectSession={onSelectSession}
                  />
                ))}

                {units.map((unit) => {
                  const unitKey = `unit:${unit.key}`;
                  const unitLabel = getUnitLabel(unit) || 'Unit';
                  return (
                    <div key={unit.key} className="ac-toc-unit">
                      <button type="button" className="ac-toc-item ac-toc-item--unit" onClick={() => toggle(unitKey)}>
                        <i className={`fas fa-chevron-${expanded[unitKey] ? 'down' : 'right'} ac-toc-item__chevron`} />
                        <div>
                          <span>{unit.unitNumber ? `Unit ${unit.unitNumber}` : 'Unit'}</span>
                          <strong>{unit.unitName || unitLabel}</strong>
                        </div>
                      </button>

                      {expanded[unitKey] && (
                        <div className="ac-toc-nested ac-toc-nested--unit">
                          {unit.directSessions?.map((session) => (
                            <TocSessionButton
                              key={session.id}
                              session={session}
                              selectedSessionId={selectedSessionId}
                              onSelectSession={onSelectSession}
                            />
                          ))}
                          {unit.chapters?.map((chapter) => (
                            <TocChapterBlock
                              key={chapter.key}
                              chapter={chapter}
                              expandKey={`chapter:${unit.key}:${chapter.key}`}
                              expanded={expanded[`chapter:${unit.key}:${chapter.key}`]}
                              onToggle={toggle}
                              selectedSessionId={selectedSessionId}
                              onSelectSession={onSelectSession}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

const SessionDetailSidePanel = ({
  session,
  canEdit,
  onClose,
  onEdit,
  onDelete,
  onOpenReferModal,
}) => {
  if (!session) {
    return (
      <aside className="ac-side-panel ac-side-panel--empty">
        <div className="ac-side-panel__empty">
          <i className="fas fa-hand-pointer" />
          <h4>Select a session</h4>
          <p>Click a session in the table of contents to view details here.</p>
        </div>
      </aside>
    );
  }

  const tone = STATUS_TONE[session.workflowStatus] || 'blue';
  const timeRange = `${session.startTime || '—'} – ${session.endTime || '—'}`;
  const evidenceCounts = countMaterialsByRequirement(session.evidenceDocs);
  const learningCounts = countMaterialsByRequirement(session.learningMaterials);
  const pendingAssignment = 'Pending — Senior Trainer will assign';
  const linkedTot = hasLinkedTot(session);
  const totTopicLabel = linkedTot ? getTotDisplayTopic(session) : '';
  const activities = getSessionActivities(session);
  const primaryColor = activities[0]?.color || BLUE;
  const subTopicLines = parseSubTopics(session.subTopics);

  return (
    <aside className="ac-side-panel">
      <div className="ac-side-panel__head" style={{ borderLeftColor: primaryColor }}>
        <div>
          <span className="ac-side-panel__label">
            <i className="fas fa-eye" /> Session detail
          </span>
          <h4>
            {session.sessionNumber ? `Session ${session.sessionNumber}: ` : ''}
            {session.title}
          </h4>
          <span className={`ac-status-pill ac-status-pill--${tone}`}>{session.workflowStatus}</span>
        </div>
        <button type="button" className="ac-side-panel__close" onClick={onClose} aria-label="Close panel">
          <i className="fas fa-times" />
        </button>
      </div>

      <div className="ac-side-panel__body">
        {(hasUnitInfo(session) || hasChapterInfo(session) || subTopicLines.length > 0) && (
        <div className="ac-side-panel__section">
          <h5>Structure</h5>
          {hasUnitInfo(session) && (
            <div className="ac-side-panel__grid ac-side-panel__grid--single">
              <div><em>Unit</em><strong>{getUnitLabel(session)}</strong></div>
            </div>
          )}
          {hasChapterInfo(session) && (
            <div className="ac-side-panel__grid ac-side-panel__grid--single">
              <div><em>Chapter</em><strong>{formatChapterLabel(session) || '—'}</strong></div>
            </div>
          )}
          {subTopicLines.length > 0 && (
            <div className="ac-side-panel__subtopics">
              <em>Sub topics</em>
              <ul>
                {subTopicLines.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        )}

        <div className="ac-side-panel__section">
          <h5>Course &amp; batch</h5>
          <div className="ac-side-panel__grid">
            <div><em>Course</em><strong>{session.courseTrade || '—'}</strong></div>
            <div><em>Batch</em><strong>{session.batchCode || '—'}</strong></div>
          </div>
        </div>

        <div className="ac-side-panel__section">
          <h5>Schedule</h5>
          <div className="ac-side-panel__grid">
            <div><em>Date</em><strong>{session.date || formatSessionDate(session.sessionDate)}</strong></div>
            <div><em>Time</em><strong>{timeRange}</strong></div>
            <div><em>Method</em><strong>{session.trainingMethod || '—'}</strong></div>
          </div>
        </div>

        <div className="ac-side-panel__section">
          <h5>Activity &amp; TOT</h5>
          <div className="ac-side-panel__badges">
            {activities.map((activity) => (
              <span key={activity.id} className="ac-activity-badge" style={{ background: activity.color }}>
                {activity.name}
              </span>
            ))}
            {linkedTot && <span className="ac-session-type-badge ac-session-type-badge--tot">TOT Linked</span>}
          </div>
          {linkedTot && (
            <div className="ac-side-panel__grid ac-side-panel__grid--tot">
              <div><em>TOT topics</em><strong>{totTopicLabel || '—'}</strong></div>
              <div><em>TOT trainer</em><strong>{session.totTrainerName || pendingAssignment}</strong></div>
            </div>
          )}
        </div>

        <div className="ac-side-panel__section">
          <h5>Trainers</h5>
          <div className="ac-side-panel__grid">
            <div><em>Field trainer</em><strong>{session.fieldTrainerName || pendingAssignment}</strong></div>
          </div>
        </div>

        <div className="ac-side-panel__section">
          <h5>Materials</h5>
          <div className="ac-side-panel__grid">
            <div><em>Documents</em><strong>{evidenceCounts.total || '—'}</strong></div>
            <div><em>Learning material</em><strong>{learningCounts.total || '—'}</strong></div>
          </div>
        </div>

        {session.notes && (
          <div className="ac-side-panel__section">
            <h5>Notes</h5>
            <p className="ac-side-panel__notes">{session.notes}</p>
          </div>
        )}
      </div>

      <footer className="ac-side-panel__foot">
        <button type="button" className="ac-btn ac-btn--ghost ac-btn--sm" disabled={!canEdit} onClick={() => onEdit(session)}>
          <i className="far fa-edit" /> Edit
        </button>
        <button type="button" className="ac-btn ac-btn--ghost ac-btn--sm ac-btn--danger" disabled={!canEdit} onClick={() => onDelete(session)}>
          <i className="fas fa-trash" /> Delete
        </button>
        {session.workflowStatus === WORKFLOW_STATUS.SCHEDULED && (
          <button type="button" className="ac-btn ac-btn--outline ac-btn--sm" onClick={() => onOpenReferModal(session)}>
            <i className="fas fa-paper-plane" /> Refer Session
          </button>
        )}
      </footer>
    </aside>
  );
};

const SessionPathPicker = ({
  filters,
  currentStep,
  options,
  loading = false,
  getLabel,
  onSelect,
  onBack,
  onReset,
}) => {
  const stepMeta = SESSION_PATH_STEPS.find((step) => step.key === currentStep) || SESSION_PATH_STEPS[0];
  const completedSteps = SESSION_PATH_STEPS.filter(({ key }) => filters[key]);

  return (
    <section className="ac-path-picker">
      <div className="ac-path-picker__intro">
        <div>
          <span className="ac-path-picker__badge">Step {stepMeta.step} of 5</span>
          <h3>Select {stepMeta.label}</h3>
          <p>{stepMeta.hint}</p>
        </div>
        {completedSteps.length > 0 && (
          <div className="ac-path-picker__actions">
            <button type="button" className="ac-path-picker__back" onClick={onBack}>
              <i className="fas fa-arrow-left" /> Back
            </button>
            <button type="button" className="ac-path-picker__reset" onClick={onReset}>
              Start over
            </button>
          </div>
        )}
      </div>

      {completedSteps.length > 0 && (
        <div className="ac-path-picker__trail">
          {completedSteps.map(({ key, label, icon }, index) => (
            <React.Fragment key={key}>
              {index > 0 && <i className="fas fa-chevron-right" />}
              <span className="ac-path-picker__crumb">
                <i className={`fas ${icon}`} />
                <em>{label}</em>
                <strong>{getLabel(key, filters[key])}</strong>
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {loading ? (
        <div className="ac-path-picker__loading">
          <i className="fas fa-spinner fa-spin" />
          <p>Loading {stepMeta.label.toLowerCase()}...</p>
        </div>
      ) : options.length === 0 ? (
        <div className="ac-path-picker__empty">
          <i className={`fas ${stepMeta.icon}`} />
          <p>No {stepMeta.label.toLowerCase()} found for this selection.</p>
          {completedSteps.length > 0 && (
            <button type="button" className="ac-path-picker__back" onClick={onBack}>
              <i className="fas fa-arrow-left" /> Go back
            </button>
          )}
        </div>
      ) : (
        <div className="ac-path-picker__grid">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="ac-path-card-btn"
              onClick={() => onSelect(currentStep, option.value)}
            >
              <div className="ac-path-card-btn__icon">
                <i className={`fas ${stepMeta.icon}`} />
              </div>
              <strong>{option.label}</strong>
              {option.meta && <span>{option.meta}</span>}
              <i className="fas fa-arrow-right ac-path-card-btn__arrow" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

const SessionPlanModal = ({
  draft,
  isEdit,
  batchSummary,
  courseStructure = DEFAULT_COURSE_STRUCTURE,
  onClose,
  onSave,
  onFieldChange,
  onEvidenceChange,
  onAddEvidence,
  onRemoveEvidence,
  onLearningMaterialChange,
  onAddLearningMaterial,
  onRemoveLearningMaterial,
  onTotMaterialChange,
  onAddTotMaterial,
  onRemoveTotMaterial,
  onTotCompletionProofChange,
  onAddTotCompletionProof,
  onRemoveTotCompletionProof,
  activityTypes,
  onActivityTypeToggle,
  onClearActivityTypes,
}) => {
  if (!draft) return null;

  const showUnit = courseStructure.unit === true;
  const showChapter = courseStructure.chapter === true;
  const structurePathLabel = buildStructurePathLabel(courseStructure);

  return (
    <div className="ac-modal-backdrop">
      <div className="ac-modal" role="dialog" aria-modal="true">
        <div className="ac-modal__head">
          <div>
            <h5>{isEdit ? 'Edit Session Plan' : 'Create Session Plan'}</h5>
            <span>Academic Coordinator · Student session + optional linked TOT</span>
          </div>
          <button type="button" className="ac-modal__close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="ac-modal__body">
          {batchSummary && (
            <div className="ac-modal__context">
              <i className="fas fa-route" /> {batchSummary}
            </div>
          )}

          <div className="ac-course-context">
            <div>
              <span>Course</span>
              <strong>{draft.courseTrade || '—'}</strong>
            </div>
            {draft.batchCode && (
              <div>
                <span>Batch</span>
                <strong>{draft.batchCode}</strong>
              </div>
            )}
            <div>
              <span>Planning path</span>
              <strong>{structurePathLabel}</strong>
            </div>
          </div>

          <ActivityTypeSelector
            types={activityTypes}
            selectedIds={(draft.sessionActivities?.length
              ? draft.sessionActivities
              : getSessionActivities(draft)
            ).map((activity) => activity.id)}
            onToggle={onActivityTypeToggle}
            onClearAll={onClearActivityTypes}
          />

          {showUnit && (
            <>
              <div className="ac-section-label">
                <i className="fas fa-layer-group" /> Unit
              </div>

              <div className="ac-form-grid">
                <label className="ac-field">
                  <span>Unit number</span>
                  <input
                    className="ac-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 1"
                    value={draft.unitNumber || ''}
                    onChange={(e) => onFieldChange('unitNumber', e.target.value)}
                  />
                </label>
                <label className="ac-field ac-field--span-2">
                  <span>Unit name</span>
                  <input
                    className="ac-input"
                    placeholder="e.g. Foundation Skills"
                    value={draft.unitName || ''}
                    onChange={(e) => onFieldChange('unitName', e.target.value)}
                  />
                </label>
              </div>
            </>
          )}

          {showChapter && (
            <>
              <div className="ac-section-label">
                <i className="fas fa-book" /> Chapter details
              </div>

              <div className="ac-form-grid">
                <label className="ac-field">
                  <span>Chapter number</span>
                  <input
                    className="ac-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 1"
                    value={draft.chapterNumber || ''}
                    onChange={(e) => onFieldChange('chapterNumber', e.target.value)}
                  />
                </label>
                <label className="ac-field ac-field--span-2">
                  <span>Chapter name</span>
                  <input
                    className="ac-input"
                    placeholder="e.g. Introduction to Retail Sales"
                    value={draft.chapterName || ''}
                    onChange={(e) => onFieldChange('chapterName', e.target.value)}
                  />
                </label>
                <label className="ac-field ac-field--full">
                  <span>Sub topics</span>
                  <textarea
                    className="ac-input ac-input--textarea"
                    rows="3"
                    placeholder="List sub topics — one per line or comma separated"
                    value={draft.subTopics || ''}
                    onChange={(e) => onFieldChange('subTopics', e.target.value)}
                  />
                </label>
              </div>
            </>
          )}

          <div className="ac-section-label">
            <i className="fas fa-user-graduate" /> Session details
          </div>

          <div className="ac-form-grid">
            <label className="ac-field">
              <span>Session number</span>
              <input
                className="ac-input"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 1"
                value={draft.sessionNumber || ''}
                onChange={(e) => onFieldChange('sessionNumber', e.target.value)}
              />
            </label>
            <label className="ac-field ac-field--span-2">
              <span>Session title *</span>
              <input
                className="ac-input"
                placeholder="e.g. Product categories and selling points"
                value={draft.title}
                onChange={(e) => onFieldChange('title', e.target.value)}
              />
            </label>
            <label className="ac-field">
              <span>Training method</span>
              <input
                className="ac-input"
                placeholder="Classroom, practical, role-play..."
                value={draft.trainingMethod}
                onChange={(e) => onFieldChange('trainingMethod', e.target.value)}
              />
            </label>
            <label className="ac-field">
              <span>Session date *</span>
              <input
                type="date"
                className="ac-input"
                value={draft.sessionDate}
                onChange={(e) => onFieldChange('sessionDate', e.target.value)}
              />
            </label>
            <label className="ac-field">
              <span>Start time</span>
              <input
                type="time"
                className="ac-input"
                value={draft.startTime}
                onChange={(e) => onFieldChange('startTime', e.target.value)}
              />
            </label>
            <label className="ac-field">
              <span>End time</span>
              <input
                type="time"
                className="ac-input"
                value={draft.endTime}
                onChange={(e) => onFieldChange('endTime', e.target.value)}
              />
            </label>

          </div>

          <MaterialDefinitionSection
            title="Student learning material"
            addLabel="Add material"
            emptyText="No learning material defined yet."
            items={draft.learningMaterials || []}
            typeOptions={LEARNING_MATERIAL_TYPE_OPTIONS}
            onAdd={onAddLearningMaterial}
            onChange={onLearningMaterialChange}
            onRemove={onRemoveLearningMaterial}
          />

<MaterialDefinitionSection
            title="Required documents"
            addLabel="Add document"
            emptyText="No documents defined yet."
            items={draft.evidenceDocs || []}
            typeOptions={EVIDENCE_TYPE_OPTIONS}
            onAdd={onAddEvidence}
            onChange={onEvidenceChange}
            onRemove={onRemoveEvidence}
          />

          <label className="ac-tot-check ac-tot-check--include">
            <input
              type="checkbox"
              checked={draft.includeTot !== false}
              onChange={(e) => onFieldChange('includeTot', e.target.checked)}
            />
            <span>Plan TOT along with this student session</span>
          </label>

          <TotSection
            draft={draft}
            onFieldChange={onFieldChange}
            onTotMaterialChange={onTotMaterialChange}
            onAddTotMaterial={onAddTotMaterial}
            onRemoveTotMaterial={onRemoveTotMaterial}
            onTotCompletionProofChange={onTotCompletionProofChange}
            onAddTotCompletionProof={onAddTotCompletionProof}
            onRemoveTotCompletionProof={onRemoveTotCompletionProof}
          />

          <label className="ac-field ac-field--full">
            <span>Planning notes</span>
            <textarea
              className="ac-input ac-input--textarea"
              rows="3"
              placeholder="Instructions for senior trainer or trainer..."
              value={draft.notes}
              onChange={(e) => onFieldChange('notes', e.target.value)}
            />
          </label>

          

          
        </div>

        <div className="ac-modal__foot">
          <button type="button" className="ac-btn ac-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="ac-btn ac-btn--primary" onClick={onSave}>
            <i className="fas fa-save" /> {isEdit ? 'Update Plan' : 'Save Plan'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReferSessionModal = ({
  session,
  trainerOptions = [],
  loadingTrainers = false,
  onClose,
  onConfirm,
  onNotify,
}) => {
  const [selectedTrainerId, setSelectedTrainerId] = useState('');

  useEffect(() => {
    setSelectedTrainerId('');
  }, [session?.id]);

  if (!session) return null;

  const sessionLabel = session.sessionNumber
    ? `Session ${session.sessionNumber}: ${session.title}`
    : session.title;

  const handleConfirm = () => {
    if (!selectedTrainerId) {
      onNotify?.('Please select a Senior Trainer');
      return;
    }
    const selected = trainerOptions.find((trainer) => trainer.value === selectedTrainerId);
    onConfirm(session, {
      id: selectedTrainerId,
      name: selected?.label || '',
    });
  };

  return (
    <div className="ac-modal-backdrop">
      <div className="ac-modal ac-modal--confirm" role="dialog" aria-modal="true">
        <div className="ac-modal__head">
          <div>
            <h5>Refer Session</h5>
            <span>Send to Senior Trainer</span>
          </div>
          <button type="button" className="ac-modal__close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="ac-modal__body">
          <p className="ac-refer-modal__text">
            Refer <strong>{sessionLabel}</strong> to Senior Trainer.
          </p>

          <label className="ac-field ac-field--full">
            <span>Senior Trainer</span>
            <select
              className="ac-select ac-select--full"
              value={selectedTrainerId}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
              disabled={loadingTrainers}
            >
              <option value="">Select Senior Trainer</option>
              {trainerOptions.map((trainer) => (
                <option key={trainer.value} value={trainer.value}>
                  {trainer.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="ac-modal__foot">
          <button type="button" className="ac-btn ac-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="ac-btn ac-btn--primary"
            onClick={handleConfirm}
            disabled={loadingTrainers}
          >
            <i className="fas fa-paper-plane" /> Refer
          </button>
        </div>
      </div>
    </div>
  );
};

const AcademicCoordinatorModule = () => {
  const userData = useMemo(
    () => JSON.parse(sessionStorage.getItem('user') || '{}'),
    []
  );
  const token = userData.token;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';

  const [reportDate, setReportDate] = useState(new Date());
  const [filters, setFilters] = useState({
    department: '',
    project: '',
    center: '',
    course: '',
    batch: '',
  });
  const [verticalOptions, setVerticalOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [centerOptions, setCenterOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [allCoursesMeta, setAllCoursesMeta] = useState([]);
  const [allCentersMeta, setAllCentersMeta] = useState([]);
  const [centerWiseCourseIds, setCenterWiseCourseIds] = useState(new Set());
  const [centerCoursesLoading, setCenterCoursesLoading] = useState(false);
  const [pathBatchesLoading, setPathBatchesLoading] = useState(false);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activityTypes, setActivityTypes] = useState(() => loadActivityTypes());
  const [activityTypesModalOpen, setActivityTypesModalOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [modal, setModal] = useState({ open: false, draft: null, editingId: null });
  const [referModal, setReferModal] = useState({ open: false, session: null });
  const [seniorTrainerOptions, setSeniorTrainerOptions] = useState([]);
  const [seniorTrainersLoading, setSeniorTrainersLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [toast, setToast] = useState('');

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const pathLabels = useMemo(() => ({
    departmentName: getOptionLabel(verticalOptions, filters.department),
    projectName: getOptionLabel(projectOptions, filters.project),
    centerName: getOptionLabel(centerOptions, filters.center),
    courseTrade: getOptionLabel(courseOptions, filters.course),
    batchCode: getOptionLabel(batchOptions, filters.batch),
    studentCount: 0,
  }), [filters, verticalOptions, projectOptions, centerOptions, courseOptions, batchOptions]);

  const selectedCourseStructure = useMemo(
    () => getCourseStructureFromMeta(allCoursesMeta, filters.course),
    [allCoursesMeta, filters.course]
  );

  const filterProjectOptions = useMemo(() => {
    if (!filters.department) return [];
    const projectIds = new Set(
      allCoursesMeta
        .filter((course) => String(course.vertical?._id || course.vertical) === String(filters.department))
        .map((course) => String(course.project?._id || course.project))
    );
    return projectOptions.filter((project) => projectIds.has(String(project.value)));
  }, [filters.department, projectOptions, allCoursesMeta]);

  const filterCenterOptions = useMemo(() => {
    if (!filters.project) return [];
    return centerOptions.filter((center) => {
      const meta = allCentersMeta.find((centerItem) => String(centerItem._id) === String(center.value));
      return meta?.projects?.some((project) => String(project._id || project) === String(filters.project));
    });
  }, [filters.project, centerOptions, allCentersMeta]);

  const filterCourseOptions = useMemo(() => {
    if (!filters.center || !filters.project) return [];
    if (!centerWiseCourseIds.size) return [];
    return courseOptions.filter((course) => centerWiseCourseIds.has(String(course.value)));
  }, [filters.center, filters.project, courseOptions, centerWiseCourseIds]);

  const sessionPathStep = useMemo(() => {
    if (!filters.department) return 'department';
    if (!filters.project) return 'project';
    if (!filters.center) return 'center';
    if (!filters.course) return 'course';
    if (!filters.batch) return 'batch';
    return 'complete';
  }, [filters]);

  const sessionPathOptions = useMemo(() => {
    switch (sessionPathStep) {
      case 'department':
        return verticalOptions;
      case 'project':
        return filterProjectOptions;
      case 'center':
        return filterCenterOptions;
      case 'course':
        return filterCourseOptions;
      case 'batch':
        return batchOptions;
      default:
        return [];
    }
  }, [
    sessionPathStep,
    verticalOptions,
    filterProjectOptions,
    filterCenterOptions,
    filterCourseOptions,
    batchOptions,
  ]);

  const sessionPathLoading = useMemo(() => {
    if (filterOptionsLoading && sessionPathStep === 'department') return true;
    if (sessionPathStep === 'course' && filters.center && filters.project && centerCoursesLoading) return true;
    if (sessionPathStep === 'batch' && filters.center && pathBatchesLoading) return true;
    return false;
  }, [filterOptionsLoading, sessionPathStep, filters.center, filters.project, centerCoursesLoading, pathBatchesLoading]);

  const getFilterLabel = useCallback((key, value) => {
    if (!value) return '';
    const optionMap = {
      department: verticalOptions,
      project: projectOptions,
      center: centerOptions,
      course: courseOptions,
      batch: batchOptions,
    };
    return getOptionLabel(optionMap[key] || [], value);
  }, [verticalOptions, projectOptions, centerOptions, courseOptions, batchOptions]);

  useEffect(() => {
    if (!token) {
      setFilterOptionsLoading(false);
      console.error('AcademicCoordinatorModule: auth token missing, filters not loaded');
      return undefined;
    }

    const requestConfig = { headers: { 'x-auth': token } };
    let cancelled = false;

    const fetchFilterOptions = async () => {
      setFilterOptionsLoading(true);

      try {
        try {
          const verticalsRes = await axios.get(`${backendUrl}/college/getVerticals`, requestConfig);
          if (!cancelled && verticalsRes.data?.status) {
            setVerticalOptions(mapApiOptions(verticalsRes.data.data));
          }
        } catch (verticalErr) {
          console.error('Failed to fetch verticals:', verticalErr);
          try {
            const filtersRes = await axios.get(`${backendUrl}/college/filters-data`, requestConfig);
            if (!cancelled && filtersRes.data?.status) {
              setVerticalOptions(mapApiOptions(filtersRes.data.verticals));
            }
          } catch (filtersErr) {
            console.error('Failed to fetch filter-data verticals:', filtersErr);
          }
        }
      } finally {
        if (!cancelled) setFilterOptionsLoading(false);
      }

      try {
        const [
          projectsRes,
          centersRes,
          coursesRes,
          filtersRes,
        ] = await Promise.allSettled([
          axios.get(`${backendUrl}/college/list_all_projects`, requestConfig),
          axios.get(`${backendUrl}/college/list_all_centers`, requestConfig),
          axios.get(`${backendUrl}/college/all_courses`, requestConfig),
          axios.get(`${backendUrl}/college/filters-data`, requestConfig),
        ]);

        if (cancelled) return;

        if (projectsRes.status === 'fulfilled' && projectsRes.value.data?.success) {
          setProjectOptions(mapApiOptions(projectsRes.value.data.data));
        } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
          setProjectOptions(mapApiOptions(filtersRes.value.data.projects));
        }

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

          const projectMap = new Map();
          courses.forEach((course) => {
            const id = course.project?._id || course.project;
            const name = course.project?.name || course.projectName;
            if (id && name) {
              projectMap.set(String(id), { value: String(id), label: name });
            }
          });
          if (projectMap.size) {
            setProjectOptions((prev) => (prev.length ? prev : Array.from(projectMap.values())));
          }
        } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
          setCourseOptions(mapApiOptions(filtersRes.value.data.courses));
        }
      } catch (err) {
        console.error('Failed to fetch secondary filter options:', err);
      }
    };

    fetchFilterOptions();
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  useEffect(() => {
    if (!filters.center || !filters.project) {
      setCenterWiseCourseIds(new Set());
      return undefined;
    }

    const fetchCenterCourses = async () => {
      setCenterCoursesLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/college/all_courses_centerwise`, {
          params: { centerId: filters.center, projectId: filters.project },
          headers: { 'x-auth': token },
        });
        if (res.data?.success) {
          setCenterWiseCourseIds(new Set((res.data.data || []).map((course) => String(course._id))));
        } else {
          setCenterWiseCourseIds(new Set());
        }
      } catch (err) {
        console.error('Failed to fetch center-wise courses:', err);
        setCenterWiseCourseIds(new Set());
      } finally {
        setCenterCoursesLoading(false);
      }
    };

    fetchCenterCourses();
    return undefined;
  }, [filters.center, filters.project, token, backendUrl]);

  useEffect(() => {
    if (!token) return undefined;
    if (!filters.center) {
      setBatchOptions([]);
      return undefined;
    }

    const fetchBatches = async () => {
      setPathBatchesLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.center) params.set('centerId', filters.center);
        if (filters.course) params.set('courseId', filters.course);
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
      } catch (err) {
        console.error('Failed to fetch batches:', err);
        setBatchOptions([]);
      } finally {
        setPathBatchesLoading(false);
      }
    };

    fetchBatches();
    return undefined;
  }, [filters.center, filters.course, token, backendUrl]);

  useEffect(() => {
    if (!filters.batch) {
      setSessions([]);
      setSelectedSessionId('');
      return;
    }
    setSessions(loadStoredSessions(filters.batch));
    setSelectedSessionId('');
  }, [filters.batch]);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => {
      const numA = parseInt(String(a.sessionNumber ?? ''), 10);
      const numB = parseInt(String(b.sessionNumber ?? ''), 10);
      if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) return numA - numB;
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    }),
    [sessions]
  );

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  );

  const handleSelectSession = (sessionId) => {
    setSelectedSessionId((prev) => (prev === sessionId ? '' : sessionId));
  };

  const loadDummySessions = () => {
    if (!filters.batch) return;
    const hasData = sessions.length > 0;
    if (hasData && !window.confirm('Replace current sessions with demo dummy data?')) return;
    const context = buildContextFromFilters(filters, pathLabels);
    const dummy = createDummySessions(context);
    persistSessions(dummy);
    setSelectedSessionId(dummy[0]?.id || '');
    notify('Demo dummy sessions loaded');
  };

  const persistSessions = useCallback((next) => {
    setSessions(next);
    if (filters.batch) {
      persistStoredSessions(filters.batch, next);
    }
  }, [filters.batch]);

  const filteredSessions = useMemo(() => {
    const query = quickSearch.trim().toLowerCase();
    return sortedSessions.filter((session) => {
      if (statusFilter !== 'all' && session.workflowStatus !== statusFilter) return false;
      if (activityFilter !== 'all' && !getSessionActivities(session).some((activity) => activity.id === activityFilter)) {
        return false;
      }
      if (!query) return true;
      return (
        session.title?.toLowerCase().includes(query)
        || session.sessionNumber?.toString().toLowerCase().includes(query)
        || session.chapterName?.toLowerCase().includes(query)
        || session.chapterNumber?.toString().toLowerCase().includes(query)
        || session.subTopics?.toLowerCase().includes(query)
        || session.courseTrade?.toLowerCase().includes(query)
        || session.unitName?.toLowerCase().includes(query)
        || session.unitNumber?.toString().toLowerCase().includes(query)
        || session.topicCovered?.toLowerCase().includes(query)
        || session.date?.toLowerCase().includes(query)
        || session.batchCode?.toLowerCase().includes(query)
        || getSessionActivities(session).some((activity) => activity.name?.toLowerCase().includes(query))
      );
    });
  }, [sortedSessions, quickSearch, statusFilter, activityFilter]);

  const activityDistribution = useMemo(
    () => buildActivityDistribution(sessions, activityTypes),
    [sessions, activityTypes]
  );

  const tocTree = useMemo(() => buildCourseToc(filteredSessions), [filteredSessions]);

  const stats = useMemo(() => ({
    total: sessions.length,
    scheduled: sessions.filter((s) => s.workflowStatus === WORKFLOW_STATUS.SCHEDULED).length,
    sent: sessions.filter((s) => s.workflowStatus === WORKFLOW_STATUS.SENT_TO_SENIOR).length,
    assigned: sessions.filter((s) => s.workflowStatus === WORKFLOW_STATUS.ASSIGNED).length,
  }), [sessions]);

  const batchSummary = useMemo(() => [
    pathLabels.departmentName,
    pathLabels.projectName,
    pathLabels.centerName,
    pathLabels.courseTrade,
    pathLabels.batchCode,
  ].filter(Boolean).join(' · '), [pathLabels]);

  const handleFilterChange = (key, value) => {
    if (key === 'department') {
      setFilters({ department: value, project: '', center: '', course: '', batch: '' });
      return;
    }
    if (key === 'project') {
      setFilters((prev) => ({ ...prev, project: value, center: '', course: '', batch: '' }));
      return;
    }
    if (key === 'center') {
      setFilters((prev) => ({ ...prev, center: value, course: '', batch: '' }));
      return;
    }
    if (key === 'course') {
      setFilters((prev) => ({ ...prev, course: value, batch: '' }));
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSessionPathBack = () => {
    if (filters.batch) { handleFilterChange('batch', ''); return; }
    if (filters.course) { handleFilterChange('course', ''); return; }
    if (filters.center) { handleFilterChange('center', ''); return; }
    if (filters.project) { handleFilterChange('project', ''); return; }
    if (filters.department) { handleFilterChange('department', ''); }
  };

  const handleSessionPathReset = () => {
    setFilters({ department: '', project: '', center: '', course: '', batch: '' });
  };

  const openCreateModal = () => {
    const context = buildContextFromFilters(filters, pathLabels);
    setModal({
      open: true,
      editingId: null,
      draft: {
        ...createEmptySessionDraft(),
        ...context,
        sessionNumber: getNextSessionNumber(sessions),
      },
    });
  };

  const openEditModal = (session) => {
    setModal({
      open: true,
      editingId: session.id,
      draft: {
        ...session,
        sessionType: session.sessionType === SESSION_TYPE.TOT ? SESSION_TYPE.TOT : SESSION_TYPE.STUDENT,
        includeTot: session.includeTot ?? session.sessionType === SESSION_TYPE.TOT,
        totUseSameTopics: session.totUseSameTopics ?? true,
        totTopicCovered: session.totTopicCovered || session.topicCovered || '',
        totTrainingMethod: session.totTrainingMethod || session.trainingMethod || '',
        sessionActivities: getSessionActivities(session),
        evidenceDocs: session.evidenceDocs || [],
        learningMaterials: session.learningMaterials || [],
        totMaterials: session.totMaterials || [],
        totTrainingProofs: session.totTrainingProofs || [],
        preSessionRequirements: session.preSessionRequirements || [],
        totCompletionProofs: session.totCompletionProofs || [],
      },
    });
  };

  const closeModal = () => setModal({ open: false, draft: null, editingId: null });

  const updateDraft = (field, value) => {
    setModal((prev) => {
      const next = { ...prev.draft, [field]: value };
      const topicSyncFields = ['chapterNumber', 'chapterName', 'subTopics'];
      if (next.includeTot !== false && next.totUseSameTopics !== false) {
        if (topicSyncFields.includes(field)) {
          next.totTopicCovered = buildTopicSummary(next);
        }
        if (field === 'trainingMethod') next.totTrainingMethod = value;
      }
      if (field === 'totUseSameTopics' && value === true) {
        next.totTopicCovered = buildTopicSummary(next);
        next.totTrainingMethod = next.trainingMethod || '';
      }
      return { ...prev, draft: next };
    });
  };

  const updateDraftListItem = (listKey, index, field, value) => {
    setModal((prev) => ({
      ...prev,
      draft: {
        ...prev.draft,
        [listKey]: (prev.draft[listKey] || []).map((item, i) => (
          i === index ? { ...item, [field]: value } : item
        )),
      },
    }));
  };

  const addDraftListItem = (listKey, defaultType = 'Document') => {
    setModal((prev) => ({
      ...prev,
      draft: {
        ...prev.draft,
        [listKey]: [...(prev.draft[listKey] || []), createMaterialItem(defaultType)],
      },
    }));
  };

  const removeDraftListItem = (listKey, index) => {
    setModal((prev) => ({
      ...prev,
      draft: {
        ...prev.draft,
        [listKey]: (prev.draft[listKey] || []).filter((_, i) => i !== index),
      },
    }));
  };

  const updateDraftEvidence = (index, field, value) => updateDraftListItem('evidenceDocs', index, field, value);
  const addDraftEvidence = () => addDraftListItem('evidenceDocs', 'Document');
  const removeDraftEvidence = (index) => removeDraftListItem('evidenceDocs', index);

  const updateDraftLearningMaterial = (index, field, value) => updateDraftListItem('learningMaterials', index, field, value);
  const addDraftLearningMaterial = () => addDraftListItem('learningMaterials', 'PDF');
  const removeDraftLearningMaterial = (index) => removeDraftListItem('learningMaterials', index);

  const updateDraftTotMaterial = (index, field, value) => updateDraftListItem('totMaterials', index, field, value);
  const addDraftTotMaterial = () => addDraftListItem('totMaterials', 'PDF');
  const removeDraftTotMaterial = (index) => removeDraftListItem('totMaterials', index);

  const updateDraftTotTrainingProof = (index, field, value) => updateDraftListItem('totTrainingProofs', index, field, value);
  const addDraftTotTrainingProof = () => addDraftListItem('totTrainingProofs', 'PDF');
  const removeDraftTotTrainingProof = (index) => removeDraftListItem('totTrainingProofs', index);

  const updateDraftPreSessionReq = (index, field, value) => updateDraftListItem('preSessionRequirements', index, field, value);
  const addDraftPreSessionReq = () => addDraftListItem('preSessionRequirements', 'PDF');
  const removeDraftPreSessionReq = (index) => removeDraftListItem('preSessionRequirements', index);

  const updateDraftTotCompletionProof = (index, field, value) => updateDraftListItem('totCompletionProofs', index, field, value);
  const addDraftTotCompletionProof = () => addDraftListItem('totCompletionProofs', 'PDF');
  const removeDraftTotCompletionProof = (index) => removeDraftListItem('totCompletionProofs', index);

  const handleActivityTypeToggle = (activityType) => {
    setModal((prev) => {
      const current = prev.draft.sessionActivities?.length
        ? prev.draft.sessionActivities
        : getSessionActivities(prev.draft);
      const exists = current.some((activity) => activity.id === activityType.id);
      const nextActivities = exists
        ? current.filter((activity) => activity.id !== activityType.id)
        : [...current, normalizeActivityItem(activityType)];
      return {
        ...prev,
        draft: { ...prev.draft, sessionActivities: nextActivities },
      };
    });
  };

  const handleClearActivityTypes = () => {
    setModal((prev) => ({
      ...prev,
      draft: { ...prev.draft, sessionActivities: [] },
    }));
  };

  const handleActivityTypesSave = (nextTypes) => {
    setActivityTypes(nextTypes);
    persistActivityTypes(nextTypes);
  };

  const saveSession = () => {
    const { draft, editingId } = modal;
    if (!draft?.title?.trim()) {
      notify('Please enter session title');
      return;
    }
    if (!draft?.sessionDate) {
      notify('Please select session date');
      return;
    }

    const totValidation = validateTotBeforeSave(draft);
    if (!totValidation.valid) {
      notify(totValidation.message);
      return;
    }

    const existing = editingId ? sessions.find((s) => s.id === editingId) : null;

    const {
      activityTypeId: _legacyActivityTypeId,
      activityTypeName: _legacyActivityTypeName,
      activityColor: _legacyActivityColor,
      ...draftWithoutLegacyActivity
    } = draft;

    const normalized = {
      ...draftWithoutLegacyActivity,
      sessionType: SESSION_TYPE.STUDENT,
      includeTot: draft.includeTot !== false,
      totUseSameTopics: draft.includeTot !== false ? draft.totUseSameTopics !== false : false,
      totTopicCovered: draft.includeTot !== false
        ? (draft.totUseSameTopics !== false
          ? buildTopicSummary(draft)
          : (draft.totTopicCovered?.trim() || ''))
        : '',
      totTrainingMethod: draft.includeTot !== false
        ? (draft.totUseSameTopics !== false
          ? (draft.trainingMethod?.trim() || '')
          : (draft.totTrainingMethod?.trim() || ''))
        : '',
      requireTotCompletionProofs: draft.includeTot !== false ? draft.requireTotCompletionProofs === true : false,
      totStatus: draft.includeTot !== false ? (existing?.totStatus || 'pending') : undefined,
      fieldTrainerId: existing?.fieldTrainerId || '',
      fieldTrainerName: existing?.fieldTrainerName || '',
      totTrainerId: existing?.totTrainerId || '',
      totTrainerName: existing?.totTrainerName || '',
      seniorTrainerId: existing?.seniorTrainerId || '',
      seniorTrainerName: existing?.seniorTrainerName || '',
      title: draft.title.trim(),
      sessionNumber: draft.sessionNumber?.toString().trim() || '',
      unitNumber: selectedCourseStructure.unit ? draft.unitNumber?.toString().trim() || '' : '',
      unitName: selectedCourseStructure.unit ? draft.unitName?.trim() || '' : '',
      chapterNumber: selectedCourseStructure.chapter ? draft.chapterNumber?.toString().trim() || '' : '',
      chapterName: selectedCourseStructure.chapter ? draft.chapterName?.trim() || '' : '',
      subTopics: selectedCourseStructure.chapter ? draft.subTopics?.trim() || '' : '',
      topicCovered: buildTopicSummary(draft),
      trainingMethod: draft.trainingMethod?.trim() || '',
      notes: draft.notes?.trim() || '',
      date: formatSessionDate(draft.sessionDate),
      workflowStatus: draft.workflowStatus || WORKFLOW_STATUS.SCHEDULED,
      evidenceDocs: normalizeMaterialItems(draft.evidenceDocs).map((doc) => ({
        ...doc,
        status: doc.status || 'Pending',
      })),
      learningMaterials: normalizeMaterialItems(draft.learningMaterials),
      totMaterials: normalizeMaterialItems(draft.totMaterials),
      totTrainingProofs: normalizeMaterialItems(draft.totTrainingProofs),
      preSessionRequirements: normalizeMaterialItems(draft.preSessionRequirements),
      totCompletionProofs: normalizeMaterialItems(draft.totCompletionProofs),
      sessionActivities: normalizeSessionActivities(
        draft.sessionActivities?.length ? draft.sessionActivities : getSessionActivities(draft)
      ),
      updatedAt: new Date().toISOString(),
    };

    const sessionId = editingId || `AC-${Date.now()}`;
    const savedSession = {
      ...normalized,
      id: sessionId,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    if (editingId) {
      persistSessions(sessions.map((s) => (s.id === editingId ? savedSession : s)));
      notify(`Session updated: ${savedSession.title}`);
    } else {
      persistSessions([...sessions, savedSession]);
      notify(`Session created: ${savedSession.title}`);
    }

    setQuickSearch('');
    setStatusFilter('all');
    setActivityFilter('all');
    setSelectedSessionId(sessionId);
    closeModal();
  };

  const deleteSession = (session) => {
    if (!window.confirm(`Delete session "${session.title}"?`)) return;
    persistSessions(sessions.filter((s) => s.id !== session.id));
    if (selectedSessionId === session.id) setSelectedSessionId('');
    notify('Session plan deleted');
  };

  const fetchSeniorTrainers = useCallback(async () => {
    if (!token) return;
    setSeniorTrainersLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/college/trainer/trainers`, {
        headers: { 'x-auth': token },
      });
      const trainers = (res.data?.data || [])
        .filter((trainer) => trainer.status !== false)
        .map((trainer) => ({
          value: String(trainer._id),
          label: trainer.name || trainer.email || 'Trainer',
        }));
      setSeniorTrainerOptions(trainers);
    } catch (err) {
      console.error('Failed to fetch senior trainers:', err);
      setSeniorTrainerOptions([]);
      notify('Failed to load senior trainers');
    } finally {
      setSeniorTrainersLoading(false);
    }
  }, [backendUrl, token]);

  const openReferModal = (session) => {
    setReferModal({ open: true, session });
    fetchSeniorTrainers();
  };
  const closeReferModal = () => setReferModal({ open: false, session: null });

  const sendToSenior = (session, seniorTrainer) => {
    if (!seniorTrainer?.id) {
      notify('Please select a Senior Trainer');
      return;
    }
    persistSessions(sessions.map((s) => (
      s.id === session.id
        ? {
          ...s,
          workflowStatus: WORKFLOW_STATUS.SENT_TO_SENIOR,
          seniorTrainerId: seniorTrainer.id,
          seniorTrainerName: seniorTrainer.name,
        }
        : s
    )));
    closeReferModal();
    notify(`Referred to ${seniorTrainer.name}`);
  };

  const canEditSession = (session) => (
    session.workflowStatus === WORKFLOW_STATUS.SCHEDULED
    || session.workflowStatus === WORKFLOW_STATUS.SENT_TO_SENIOR
  );

  return (
    <div className="ac-portal">
      <style>{AC_CSS}</style>

      <header className="ac-header">
        <div>
          <div className="ac-role-badge">
            <i className="fas fa-user-tie" /> Academic Coordinator
          </div>
          <h1 className="ac-title">Session Planning</h1>
          <nav className="ac-breadcrumb">
            <span>Training Module</span><span>/</span>
            <span className="ac-breadcrumb--active">Academic Coordinator</span>
          </nav>
          <p className="ac-subtitle">
            Create student sessions and optionally link TOT with the same or separate topics.
          </p>
        </div>
        <div className="ac-header-meta">
          <div className="ac-header-user">
            <i className="fas fa-user-circle" />
            <span>{userData.name || 'Coordinator'}</span>
          </div>
          <div className="ac-header-date">
            <i className="fas fa-calendar-alt" />
            <DatePicker value={reportDate} onChange={setReportDate} format="dd/MM/yyyy" clearIcon={null} />
          </div>
        </div>
      </header>

      {!filters.batch ? (
        <SessionPathPicker
          filters={filters}
          currentStep={sessionPathStep}
          options={sessionPathOptions}
          loading={sessionPathLoading}
          getLabel={getFilterLabel}
          onSelect={handleFilterChange}
          onBack={handleSessionPathBack}
          onReset={handleSessionPathReset}
        />
      ) : (
        <>
          <div className="ac-stats-row">
            <div className="ac-stat">
              <strong>{stats.total}</strong>
              <span>Total plans</span>
            </div>
            <div className="ac-stat ac-stat--blue">
              <strong>{stats.scheduled}</strong>
              <span>Scheduled</span>
            </div>
            <div className="ac-stat ac-stat--amber">
              <strong>{stats.sent}</strong>
              <span>With Senior Trainer</span>
            </div>
            <div className="ac-stat ac-stat--purple">
              <strong>{stats.assigned}</strong>
              <span>Assigned</span>
            </div>
          </div>

          <div className="ac-toolbar">
            <div className="ac-toolbar__path">
              <span className="ac-toolbar__label">Selected batch</span>
              <strong>{batchSummary}</strong>
              {pathLabels.studentCount > 0 && (
                <span className="ac-toolbar__meta">{pathLabels.studentCount} students enrolled</span>
              )}
              <div className="ac-structure-pills" aria-hidden="true">
                <span className="ac-structure-pill ac-structure-pill--unit">
                  <i className="fas fa-layer-group" /> Unit
                </span>
                <span className="ac-structure-pill ac-structure-pill--chapter">
                  <i className="fas fa-book" /> Chapter
                </span>
                <span className="ac-structure-pill ac-structure-pill--session">
                  <i className="fas fa-play-circle" /> Session
                </span>
              </div>
            </div>
            <div className="ac-toolbar__actions">
              <button type="button" className="ac-btn ac-btn--ghost" onClick={() => setActivityTypesModalOpen(true)}>
                <i className="fas fa-palette" /> Activity types
              </button>
              <button type="button" className="ac-btn ac-btn--ghost" onClick={loadDummySessions}>
                <i className="fas fa-flask" /> Load demo data
              </button>
              <button type="button" className="ac-btn ac-btn--ghost" onClick={handleSessionPathReset}>
                <i className="fas fa-exchange-alt" /> Change batch
              </button>
              <button type="button" className="ac-btn ac-btn--primary" onClick={openCreateModal}>
                <i className="fas fa-plus" /> New Session Plan
              </button>
            </div>
          </div>

          <ColorDistributionPanel
            distribution={activityDistribution}
            totalSessions={sessions.length}
          />

          <div className="ac-filters">
            <input
              type="text"
              className="ac-search"
              placeholder="Search unit, chapter, session..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
            />
            <select
              className="ac-select"
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
            >
              <option value="all">All activity types</option>
              {activityTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            <select
              className="ac-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              {Object.values(WORKFLOW_STATUS).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="ac-workspace ac-workspace--toc">
            <CourseTableOfContents
              courseName={pathLabels.courseTrade}
              batchName={pathLabels.batchCode}
              tree={tocTree}
              selectedSessionId={selectedSessionId}
              onSelectSession={handleSelectSession}
            />

            <SessionDetailSidePanel
              session={selectedSession}
              canEdit={selectedSession ? canEditSession(selectedSession) : false}
              onClose={() => setSelectedSessionId('')}
              onEdit={openEditModal}
              onDelete={deleteSession}
              onOpenReferModal={openReferModal}
            />
          </div>
        </>
      )}

      {modal.open && modal.draft && (
        <SessionPlanModal
          draft={modal.draft}
          isEdit={!!modal.editingId}
          batchSummary={batchSummary}
          courseStructure={selectedCourseStructure}
          onClose={closeModal}
          onSave={saveSession}
          onFieldChange={updateDraft}
          onEvidenceChange={updateDraftEvidence}
          onAddEvidence={addDraftEvidence}
          onRemoveEvidence={removeDraftEvidence}
          onLearningMaterialChange={updateDraftLearningMaterial}
          onAddLearningMaterial={addDraftLearningMaterial}
          onRemoveLearningMaterial={removeDraftLearningMaterial}
          onTotMaterialChange={updateDraftTotMaterial}
          onAddTotMaterial={addDraftTotMaterial}
          onRemoveTotMaterial={removeDraftTotMaterial}
          onTotCompletionProofChange={updateDraftTotCompletionProof}
          onAddTotCompletionProof={addDraftTotCompletionProof}
          onRemoveTotCompletionProof={removeDraftTotCompletionProof}
          activityTypes={activityTypes}
          onActivityTypeToggle={handleActivityTypeToggle}
          onClearActivityTypes={handleClearActivityTypes}
        />
      )}

      {referModal.open && referModal.session && (
        <ReferSessionModal
          session={referModal.session}
          trainerOptions={seniorTrainerOptions}
          loadingTrainers={seniorTrainersLoading}
          onClose={closeReferModal}
          onConfirm={sendToSenior}
          onNotify={notify}
        />
      )}

      {activityTypesModalOpen && (
        <ActivityTypesManager
          types={activityTypes}
          onChange={handleActivityTypesSave}
          onClose={() => setActivityTypesModalOpen(false)}
          onNotify={notify}
        />
      )}

      {toast && (
        <div className="ac-toast">
          <i className="fas fa-check-circle" /> {toast}
        </div>
      )}
    </div>
  );
};

const AC_CSS = `
  .ac-portal {
    min-height: 100vh;
    background: linear-gradient(180deg, #f0f7ff 0%, #f4f6f9 140px, #f4f6f9 100%);
    padding: 16px 20px 100px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #1e293b;
  }
  .ac-header {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 16px;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px 22px;
    margin-bottom: 18px; box-shadow: 0 18px 40px rgba(15,23,42,0.06);
  }
  .ac-role-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: #eff6ff; color: ${BLUE}; font-size: 11px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.05em; padding: 5px 12px; border-radius: 999px; margin-bottom: 10px;
  }
  .ac-title { margin: 0 0 6px; font-size: 1.6rem; font-weight: 900; color: #0f172a; }
  .ac-subtitle { margin: 8px 0 0; font-size: 13px; color: #64748b; max-width: 520px; line-height: 1.5; }
  .ac-breadcrumb { font-size: 12px; color: #64748b; display: flex; gap: 6px; align-items: center; }
  .ac-breadcrumb--active { color: ${BLUE}; font-weight: 700; }
  .ac-header-meta { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
  .ac-header-user {
    display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #334155;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 14px;
  }
  .ac-header-date {
    display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 12px; padding: 8px 14px;
  }
  .ac-header-date i { color: ${BLUE}; }
  .ac-header-date .react-date-picker { border: none; font-size: 13px; }
  .ac-header-date .react-date-picker__wrapper { border: none; background: transparent; }

  .ac-path-picker {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px;
    box-shadow: 0 10px 28px rgba(15,23,42,0.05);
  }
  .ac-path-picker__intro { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .ac-path-picker__badge {
    display: inline-block; background: #eff6ff; color: ${BLUE}; font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;
  }
  .ac-path-picker__intro h3 { margin: 0 0 4px; font-size: 1.25rem; font-weight: 900; }
  .ac-path-picker__intro p { margin: 0; font-size: 13px; color: #64748b; }
  .ac-path-picker__actions { display: flex; gap: 8px; }
  .ac-path-picker__back, .ac-path-picker__reset {
    border: 1px solid #e2e8f0; background: #fff; border-radius: 999px; padding: 8px 14px;
    font-size: 12px; font-weight: 700; cursor: pointer; color: #475569;
  }
  .ac-path-picker__reset { color: ${PINK}; border-color: #fecdd3; }
  .ac-path-picker__trail {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px; background: #f8fafc;
    border: 1px dashed #cbd5e1; border-radius: 14px; padding: 12px 14px; margin-bottom: 16px;
  }
  .ac-path-picker__crumb {
    display: inline-flex; flex-direction: column; gap: 2px; background: #fff; border: 1px solid #e2e8f0;
    border-radius: 12px; padding: 8px 12px; min-width: 120px;
  }
  .ac-path-picker__crumb i { color: ${PINK}; font-size: 11px; }
  .ac-path-picker__crumb em { font-style: normal; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #94a3b8; }
  .ac-path-picker__crumb strong { font-size: 12px; color: #0f172a; }
  .ac-path-picker__trail > i { color: #cbd5e1; font-size: 10px; }
  .ac-path-picker__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .ac-path-card-btn {
    display: flex; flex-direction: column; align-items: flex-start; gap: 8px; text-align: left;
    background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 18px; cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s; min-height: 130px; position: relative;
  }
  .ac-path-card-btn:hover { transform: translateY(-3px); border-color: ${BLUE}; box-shadow: 0 12px 30px rgba(37,99,235,0.12); }
  .ac-path-card-btn__icon {
    width: 44px; height: 44px; border-radius: 12px; background: #fff5f7;
    display: flex; align-items: center; justify-content: center; color: ${PINK}; font-size: 18px;
  }
  .ac-path-card-btn strong { font-size: 12px; font-weight: 800; color: #0f172a; line-height: 1.35; }
  .ac-path-card-btn span { font-size: 11px; color: #64748b; font-weight: 600; }
  .ac-path-card-btn__arrow { position: absolute; right: 14px; bottom: 14px; color: #94a3b8; font-size: 12px; }
  .ac-path-picker__empty,
  .ac-path-picker__loading { text-align: center; padding: 40px 20px; color: #64748b; }
  .ac-path-picker__empty i,
  .ac-path-picker__loading i { font-size: 28px; color: #cbd5e1; margin-bottom: 10px; display: block; }

  .ac-stats-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
  .ac-stat {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; text-align: center;
  }
  .ac-stat strong { display: block; font-size: 22px; font-weight: 900; color: #0f172a; }
  .ac-stat span { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
  .ac-stat--blue strong { color: ${BLUE}; }
  .ac-stat--amber strong { color: #d97706; }
  .ac-stat--purple strong { color: #7c3aed; }

  .ac-toolbar {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; margin-bottom: 14px;
  }
  .ac-toolbar__label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
  .ac-toolbar__path strong { display: block; font-size: 13px; color: #0f172a; line-height: 1.4; }
  .ac-toolbar__meta { font-size: 12px; color: #64748b; font-weight: 600; }
  .ac-structure-pills {
    display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;
  }
  .ac-structure-pill {
    display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
    border-radius: 999px; font-size: 12px; font-weight: 800;
    border: 1px solid #e2e8f0; background: #f8fafc; color: #475569;
    cursor: default; user-select: none; pointer-events: none;
  }
  .ac-structure-pill--unit { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
  .ac-structure-pill--chapter { background: #f5f3ff; border-color: #ddd6fe; color: #6d28d9; }
  .ac-structure-pill--session { background: #ecfdf5; border-color: #bbf7d0; color: #047857; }
  .ac-toolbar__actions { display: flex; flex-wrap: wrap; gap: 8px; }

  .ac-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
  .ac-search {
    flex: 1; min-width: 200px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px;
    font-size: 13px; background: #fff;
  }
  .ac-select {
    min-width: 180px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px;
    font-size: 13px; background: #fff; font-weight: 600;
  }
  .ac-select--full { width: 100%; min-width: 0; }

  .ac-btn {
    display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 12px;
    font-size: 12px; font-weight: 800; border: 1.5px solid transparent; cursor: pointer; transition: 0.15s;
  }
  .ac-btn--primary { background: ${BLUE}; color: #fff; border-color: ${BLUE}; }
  .ac-btn--primary:hover { background: #1d4ed8; }
  .ac-btn--outline { background: #fff; color: ${BLUE}; border-color: #bfdbfe; }
  .ac-btn--ghost { background: #fff; color: #475569; border-color: #e2e8f0; }
  .ac-btn--danger { color: #b91c1c; border-color: #fecaca; }
  .ac-btn--sm { padding: 8px 12px; font-size: 11px; }
  .ac-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .ac-session-list { display: flex; flex-direction: column; gap: 12px; }
  .ac-session-card {
    background: #fff; border: 1px solid #e2e8f0; border-left: 5px solid var(--ac-activity-color, ${BLUE});
    border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(15,23,42,0.06);
  }
  .ac-session-card--no-activity { border-left-color: #cbd5e1; }
  .ac-session-card__head {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 10px;
    padding: 14px 16px; color: #fff;
  }
  .ac-session-card__head--neutral {
    background: linear-gradient(105deg, #475569 0%, #64748b 55%, #94a3b8 100%);
  }
  .ac-session-card__title-wrap h4 { margin: 0 0 4px; font-size: 15px; font-weight: 900; }
  .ac-session-card__title-wrap p { margin: 0 0 8px; font-size: 12px; opacity: 0.88; }
  .ac-session-card__badges { display: flex; flex-wrap: wrap; gap: 6px; }
  .ac-activity-badge {
    display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px;
    font-size: 10px; font-weight: 800; color: #fff; border: 1px solid rgba(255,255,255,0.35);
  }
  .ac-status-pill {
    font-size: 10px; font-weight: 800; padding: 5px 10px; border-radius: 999px; text-transform: uppercase;
    background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.35); white-space: nowrap;
  }
  .ac-session-card__grid {
    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; padding: 14px 16px;
  }
  .ac-session-card__grid em {
    display: block; font-style: normal; font-size: 10px; font-weight: 800; text-transform: uppercase;
    color: #94a3b8; margin-bottom: 4px;
  }
  .ac-session-card__grid strong { font-size: 13px; color: #0f172a; }
  .ac-session-card__notes {
    display: flex; gap: 10px; align-items: flex-start; margin: 0 16px 14px; padding: 12px 14px;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 12px; color: #475569;
  }
  .ac-session-card__notes i { color: ${BLUE}; margin-top: 2px; }
  .ac-session-card__notes p { margin: 0; line-height: 1.5; }
  .ac-session-card__foot {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px 16px;
    border-top: 1px solid #eef2f7; background: #fafbfc;
  }
  .ac-session-card__foot-right { margin-left: auto; display: flex; gap: 8px; }

  .ac-empty {
    text-align: center; padding: 48px 24px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 16px;
  }
  .ac-empty i { font-size: 36px; color: #cbd5e1; margin-bottom: 12px; }
  .ac-empty h3 { margin: 0 0 8px; font-size: 18px; }
  .ac-empty p { margin: 0 0 16px; color: #64748b; font-size: 13px; }

  .ac-modal-backdrop {
    position: fixed; inset: 0; z-index: 9998; background: rgba(15,23,42,0.55); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 18px;
  }
  .ac-modal {
    width: min(900px, 100%); max-height: 92vh; overflow: hidden; background: #fff; border-radius: 20px;
    box-shadow: 0 28px 80px rgba(15,23,42,0.28); display: flex; flex-direction: column;
  }
  .ac-modal--wide { width: min(760px, 100%); }
  .ac-modal__head, .ac-modal__foot {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 16px 18px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
  }
  .ac-modal__foot { border-top: 1px solid #e2e8f0; border-bottom: 0; justify-content: flex-end; }
  .ac-modal__head h5 { margin: 0; font-size: 18px; font-weight: 900; }
  .ac-modal__head span { color: #64748b; font-size: 12px; font-weight: 700; }
  .ac-modal__close {
    width: 34px; height: 34px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer;
  }
  .ac-modal__body { padding: 18px; overflow-y: auto; flex: 1 1 auto; }
  .ac-modal__context {
    margin-bottom: 16px; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px;
    background: #f8fafc; font-size: 12px; font-weight: 700; color: #475569;
  }
  .ac-form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  .ac-field--span-2 { grid-column: span 2; }
  .ac-course-context {
    display: flex; flex-wrap: wrap; gap: 16px 24px; margin-bottom: 16px; padding: 14px 16px;
    border: 1px solid #e2e8f0; border-radius: 14px; background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
  }
  .ac-course-context > div { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
  .ac-course-context span {
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;
  }
  .ac-course-context strong { font-size: 14px; color: #0f172a; }
  .ac-session-card__chapter { font-size: 12px !important; color: rgba(255,255,255,0.88) !important; margin-top: 4px !important; }
  .ac-session-card--no-activity .ac-session-card__chapter { color: #475569 !important; }

  .ac-structure-guide {
    margin-bottom: 16px; padding: 18px 20px; border: 1px solid #dbeafe; border-radius: 16px;
    background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 55%, #fdf4ff 100%);
  }
  .ac-structure-guide__head {
    display: flex; gap: 14px; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap;
  }
  .ac-structure-guide__head > i {
    width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px;
    background: ${BLUE}; color: #fff; font-size: 16px;
  }
  .ac-structure-guide__head h4 { margin: 0 0 4px; font-size: 15px; color: #0f172a; }
  .ac-structure-guide__head p { margin: 0; font-size: 12px; color: #64748b; }
  .ac-structure-guide__hint {
    margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
    border-radius: 999px; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800;
  }
  .ac-structure-guide__empty { margin: 0; padding: 12px; font-size: 13px; color: #64748b; }
  .ac-structure-guide__tree { display: flex; flex-direction: column; gap: 0; padding-left: 8px; }
  .ac-structure-guide__node {
    display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 12px; padding: 10px 14px;
    border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;
  }
  .ac-structure-guide__node--root {
    border-color: #bfdbfe; background: #eff6ff;
  }
  .ac-structure-guide__node strong {
    font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;
  }
  .ac-structure-guide__node span { font-size: 14px; font-weight: 800; color: #0f172a; }
  .ac-structure-guide__branch {
    width: 2px; height: 14px; margin-left: 24px; background: #cbd5e1;
  }
  .ac-structure-guide__sessions {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 4px;
  }
  .ac-structure-guide__session {
    display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; text-align: left;
    border: 1.5px solid #e2e8f0; border-radius: 12px; background: #fff; cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  }
  .ac-structure-guide__session:hover {
    border-color: ${BLUE}; box-shadow: 0 8px 20px rgba(37,99,235,0.1); transform: translateY(-1px);
  }
  .ac-structure-guide__session--active {
    border-color: ${BLUE}; background: #eff6ff; box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  }
  .ac-structure-guide__session-no {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${BLUE};
  }
  .ac-structure-guide__session-no i { color: #059669; }
  .ac-structure-guide__session strong { font-size: 13px; color: #0f172a; line-height: 1.35; }
  .ac-structure-guide__session em { font-size: 12px; color: #475569; font-style: normal; font-weight: 700; }
  .ac-structure-guide__session small { font-size: 11px; color: #64748b; line-height: 1.45; }
  .ac-empty__actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 8px; }

  .ac-workspace {
    display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 16px; align-items: start;
  }
  .ac-workspace--toc {
    grid-template-columns: 300px minmax(0, 1fr);
  }
  .ac-workspace__main { min-width: 0; }

  .ac-toc-panel {
    position: sticky; top: 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
    box-shadow: 0 10px 28px rgba(15,23,42,0.06); overflow: hidden; max-height: calc(100vh - 32px);
    display: flex; flex-direction: column;
  }
  .ac-toc-panel__head {
    padding: 14px 16px; border-bottom: 1px solid #e2e8f0; background: linear-gradient(135deg, #f8fafc, #eff6ff);
  }
  .ac-toc-panel__head h4 {
    margin: 0 0 4px; font-size: 14px; font-weight: 800; color: #0f172a;
    display: flex; align-items: center; gap: 8px;
  }
  .ac-toc-panel__head p { margin: 0; font-size: 11px; color: #64748b; }
  .ac-toc-panel__body { flex: 1; overflow: auto; padding: 8px 0 12px; }
  .ac-toc-empty { margin: 8px 16px; font-size: 12px; color: #64748b; line-height: 1.5; }
  .ac-toc-nested { padding-left: 12px; border-left: 2px solid #e2e8f0; margin-left: 16px; }
  .ac-toc-nested--unit { margin-left: 12px; }
  .ac-toc-nested--chapter { margin-left: 10px; padding-left: 10px; }
  .ac-toc-item {
    display: flex; align-items: flex-start; gap: 8px; width: calc(100% - 16px); margin: 2px 8px;
    padding: 8px 10px; border: none; background: transparent; text-align: left; border-radius: 10px;
    cursor: pointer; transition: background 0.15s;
  }
  .ac-toc-item:hover { background: #f8fafc; }
  .ac-toc-item span {
    display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8;
  }
  .ac-toc-item strong {
    display: block; font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.35; margin-top: 2px;
  }
  .ac-toc-item__chevron { width: 12px; margin-top: 4px; font-size: 10px; color: #94a3b8; flex-shrink: 0; }
  .ac-toc-item--course strong { font-size: 13px; color: ${BLUE}; }
  .ac-toc-item--batch { cursor: default; }
  .ac-toc-item--batch:hover { background: transparent; }
  .ac-toc-item--unit strong { color: #1e3a8a; }
  .ac-toc-item--chapter strong { font-weight: 600; }
  .ac-toc-item--subtopic {
    cursor: default; padding: 4px 10px 4px 6px; align-items: center;
  }
  .ac-toc-item--subtopic:hover { background: transparent; }
  .ac-toc-item--subtopic span { font-size: 11px; font-weight: 500; text-transform: none; color: #475569; letter-spacing: 0; }
  .ac-toc-item__dot { font-size: 5px; color: #94a3b8; margin-top: 0; width: 12px; text-align: center; }
  .ac-toc-item--session { border: 1px solid transparent; }
  .ac-toc-item--session strong { font-size: 11px; font-weight: 600; }
  .ac-toc-item--session-active {
    background: #eff6ff; border-color: #bfdbfe; box-shadow: inset 3px 0 0 ${BLUE};
  }
  .ac-toc-item__session-icon { color: ${BLUE}; font-size: 11px; margin-top: 3px; width: 12px; }

  .ac-session-rows {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;
  }
  .ac-session-rows__head {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px;
    padding: 14px 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;
  }
  .ac-session-rows__head h3 {
    margin: 0; font-size: 14px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;
  }
  .ac-session-rows__head span { font-size: 12px; color: #64748b; font-weight: 600; }
  .ac-session-row {
    display: grid; grid-template-columns: 44px minmax(0, 1fr) auto 16px; gap: 12px; align-items: center;
    width: 100%; padding: 14px 16px; border: none; border-bottom: 1px solid #f1f5f9;
    background: #fff; text-align: left; cursor: pointer; transition: background 0.15s;
  }
  .ac-session-row:last-child { border-bottom: none; }
  .ac-session-row:hover { background: #f8fafc; }
  .ac-session-row--selected { background: #eff6ff; box-shadow: inset 3px 0 0 ${BLUE}; }
  .ac-session-row__no {
    width: 36px; height: 36px; border-radius: 10px; background: #eff6ff; color: ${BLUE};
    display: grid; place-items: center; font-size: 12px; font-weight: 900;
  }
  .ac-session-row__body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .ac-session-row__body strong { font-size: 13px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ac-session-row__body span { font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ac-session-row__meta { display: flex; align-items: center; gap: 8px; }
  .ac-session-row__dot { width: 8px; height: 8px; border-radius: 999px; }
  .ac-session-row__tag {
    font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 999px;
    background: #ede9fe; color: #6d28d9;
  }
  .ac-session-row__date { font-size: 11px; font-weight: 700; color: #94a3b8; }
  .ac-session-row__arrow { color: #cbd5e1; font-size: 11px; }

  .ac-side-panel {
    position: sticky; top: 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 18px;
    box-shadow: 0 16px 40px rgba(15,23,42,0.08); overflow: hidden; max-height: calc(100vh - 32px);
    display: flex; flex-direction: column;
  }
  .ac-side-panel--empty { min-height: 320px; }
  .ac-side-panel__empty {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 32px 24px; color: #64748b;
  }
  .ac-side-panel__empty i { font-size: 32px; color: #cbd5e1; margin-bottom: 12px; }
  .ac-side-panel__empty h4 { margin: 0 0 8px; color: #0f172a; }
  .ac-side-panel__empty p { margin: 0; font-size: 13px; line-height: 1.5; max-width: 240px; }
  .ac-side-panel__head {
    display: flex; justify-content: space-between; gap: 12px; padding: 16px 18px;
    border-bottom: 1px solid #e2e8f0; border-left: 4px solid ${BLUE}; background: #f8fafc;
  }
  .ac-side-panel__label {
    display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800;
    text-transform: uppercase; color: #64748b; margin-bottom: 6px;
  }
  .ac-side-panel__head h4 { margin: 0 0 8px; font-size: 15px; line-height: 1.35; color: #0f172a; }
  .ac-side-panel__close {
    width: 32px; height: 32px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff;
    cursor: pointer; color: #64748b; flex-shrink: 0;
  }
  .ac-side-panel__body { flex: 1; overflow: auto; padding: 8px 0; }
  .ac-side-panel__section { padding: 12px 18px; border-bottom: 1px solid #f1f5f9; }
  .ac-side-panel__section h5 {
    margin: 0 0 10px; font-size: 10px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.05em; color: #94a3b8;
  }
  .ac-side-panel__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; }
  .ac-side-panel__grid--tot { margin-top: 10px; }
  .ac-side-panel__grid em, .ac-side-panel__subtopics em {
    display: block; font-style: normal; font-size: 10px; font-weight: 700; text-transform: uppercase;
    color: #94a3b8; margin-bottom: 3px;
  }
  .ac-side-panel__grid strong { font-size: 13px; color: #0f172a; line-height: 1.35; }
  .ac-side-panel__subtopics ul { margin: 0; padding-left: 18px; }
  .ac-side-panel__subtopics li { font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 4px; }
  .ac-side-panel__subtopics p { margin: 0; font-size: 13px; color: #64748b; }
  .ac-side-panel__badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
  .ac-side-panel__notes { margin: 0; font-size: 13px; color: #475569; line-height: 1.5; }
  .ac-side-panel__foot {
    display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 18px; border-top: 1px solid #e2e8f0; background: #fff;
  }
  .ac-field { display: flex; flex-direction: column; gap: 6px; margin: 0; }
  .ac-field--full { grid-column: 1 / -1; margin-top: 4px; }
  .ac-field span {
    font-size: 10px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8;
  }
  .ac-input {
    min-height: 40px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 12px;
    font-size: 13px; font-weight: 600; color: #0f172a; background: #f8fafc; width: 100%; box-sizing: border-box;
  }
  .ac-input:focus { outline: none; border-color: ${BLUE}; background: #fff; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
  .ac-input--textarea { min-height: 88px; resize: vertical; }
  .ac-evidence-builder { margin-top: 18px; padding-top: 16px; border-top: 1px solid #eef2f7; }
  .ac-evidence-builder + .ac-evidence-builder { margin-top: 14px; }

  .ac-tot-panel {
    margin-top: 18px; padding: 16px; border: 1px solid #dbeafe; border-radius: 14px;
    background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
  }
  .ac-tot-panel__head h6 {
    margin: 0 0 6px; font-size: 14px; font-weight: 900; color: #0f172a;
    display: flex; align-items: center; gap: 8px;
  }
  .ac-tot-panel__head h6 i { color: ${BLUE}; }
  .ac-tot-panel__head p { margin: 0 0 14px; font-size: 12px; color: #64748b; line-height: 1.45; }
  .ac-tot-type-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
  .ac-tot-type-btn {
    display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left;
    border: 1.5px solid #e2e8f0; background: #fff; border-radius: 12px; padding: 12px 14px; cursor: pointer;
  }
  .ac-tot-type-btn strong { font-size: 12px; color: #0f172a; }
  .ac-tot-type-btn span { font-size: 11px; color: #64748b; }
  .ac-tot-type-btn--active {
    border-color: ${BLUE}; background: #eff6ff; box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
  }
  .ac-tot-check {
    display: flex; align-items: center; gap: 10px; margin: 0 0 12px;
    font-size: 13px; font-weight: 700; color: #334155;
  }
  .ac-tot-check--include {
    margin: 16px 0 0; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;
  }
  .ac-tot-check input { width: 16px; height: 16px; accent-color: ${BLUE}; }
  .ac-tot-sync-box {
    display: flex; gap: 12px; padding: 12px 14px; margin-bottom: 12px;
    border: 1px solid #bfdbfe; border-radius: 12px; background: #eff6ff; color: #1e3a8a;
  }
  .ac-tot-sync-box i { color: ${BLUE}; margin-top: 2px; }
  .ac-tot-sync-box strong { display: block; font-size: 13px; margin-bottom: 4px; }
  .ac-tot-sync-box p { margin: 0; font-size: 12px; line-height: 1.45; }
  .ac-tot-sync-box__method { margin-top: 6px !important; font-weight: 700; }
  .ac-section-label {
    display: inline-flex; align-items: center; gap: 8px; margin: 8px 0 12px;
    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${BLUE};
  }
  .ac-section-label small { font-size: 10px; font-weight: 600; text-transform: none; color: #94a3b8; margin-left: 4px; }
  .ac-side-panel__grid--single { grid-template-columns: 1fr; }
  .ac-toc-group { margin: 4px 0 8px; }
  .ac-modal--confirm { width: min(420px, 100%); }
  .ac-refer-modal__text { margin: 0; font-size: 14px; line-height: 1.55; color: #475569; }

  .ac-tot-info-box {
    display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; margin-bottom: 12px;
    background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; font-size: 12px; color: #1e40af;
  }
  .ac-tot-info-box i { margin-top: 2px; }
  .ac-tot-info-box p { margin: 0; line-height: 1.45; }
  .ac-tot-status {
    display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; margin-bottom: 12px;
  }
  .ac-tot-status--ok { background: #ecfdf5; border: 1px solid #bbf7d0; }
  .ac-tot-status--warn { background: #fffbeb; border: 1px solid #fde68a; }
  .ac-tot-status__icon { font-size: 18px; margin-top: 2px; }
  .ac-tot-status--ok .ac-tot-status__icon { color: #059669; }
  .ac-tot-status--warn .ac-tot-status__icon { color: #d97706; }
  .ac-tot-status strong { display: block; font-size: 13px; color: #0f172a; margin-bottom: 4px; }
  .ac-tot-status p { margin: 0; font-size: 12px; color: #475569; line-height: 1.45; }
  .ac-tot-status__note { margin-top: 6px !important; font-weight: 700; }
  .ac-tot-status__note--danger { color: #b91c1c !important; }
  .ac-session-type-badge {
    display: inline-flex; margin-top: 6px; padding: 3px 8px; border-radius: 999px;
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .ac-session-type-badge--student { background: rgba(255,255,255,0.22); color: #fff; border: 1px solid rgba(255,255,255,0.35); }
  .ac-session-type-badge--tot { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .ac-text--green { color: #059669; }
  .ac-text--amber { color: #d97706; }

  .ac-activity-picker {
    margin: 16px 0; padding: 14px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;
  }
  .ac-activity-picker__head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 12px; }
  .ac-activity-picker__head > div { display: flex; flex-direction: column; gap: 2px; }
  .ac-activity-picker__head span { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
  .ac-activity-picker__head small { font-size: 12px; color: #94a3b8; }
  .ac-activity-clear {
    border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; padding: 6px 10px;
    font-size: 11px; font-weight: 700; color: #64748b; cursor: pointer;
  }
  .ac-activity-clear:hover { color: #0f172a; border-color: #cbd5e1; }
  .ac-activity-picker__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
  .ac-activity-chip {
    display: flex; align-items: center; gap: 10px; text-align: left; padding: 10px 12px;
    border: 1.5px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: 0.15s;
  }
  .ac-activity-chip:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(15,23,42,0.08); }
  .ac-activity-chip--active { box-shadow: 0 0 0 2px var(--chip-color, #94a3b8); }
  .ac-activity-chip__dot { width: 12px; height: 12px; border-radius: 999px; flex-shrink: 0; }
  .ac-activity-chip__label { font-size: 12px; font-weight: 800; color: #0f172a; line-height: 1.3; flex: 1; }
  .ac-activity-chip__check { font-size: 10px; color: var(--chip-color, #64748b); }

  .ac-color-distribution {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; margin-bottom: 14px;
  }
  .ac-color-distribution__head {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 12px;
  }
  .ac-color-distribution__head h3 {
    margin: 0; font-size: 14px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 8px;
  }
  .ac-color-distribution__head h3 i { color: ${PINK}; }
  .ac-color-distribution__head span { font-size: 12px; color: #64748b; font-weight: 700; }
  .ac-color-distribution__bar {
    display: flex; height: 12px; border-radius: 999px; overflow: hidden; background: #e2e8f0; margin-bottom: 14px;
  }
  .ac-color-distribution__segment { min-width: 8px; transition: flex 0.2s; }
  .ac-color-distribution__legend { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
  .ac-color-distribution__legend-item {
    display: grid; grid-template-columns: 12px 1fr; gap: 8px 10px; align-items: center;
    padding: 10px 12px; border: 1px solid #eef2f7; border-radius: 10px; background: #fafbfc;
  }
  .ac-color-distribution__dot { width: 12px; height: 12px; border-radius: 999px; grid-row: span 2; }
  .ac-color-distribution__legend-text strong { display: block; font-size: 12px; color: #0f172a; }
  .ac-color-distribution__legend-text span { font-size: 11px; color: #64748b; font-weight: 700; }
  .ac-color-distribution__meter { grid-column: 2; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
  .ac-color-distribution__meter-fill { height: 100%; border-radius: 999px; min-width: 4px; }

  .ac-activity-manage-head,
  .ac-activity-manage-row {
    display: grid; grid-template-columns: 1fr 180px 140px 40px; gap: 10px; align-items: center; margin-bottom: 8px;
  }
  .ac-activity-manage-head span {
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;
  }
  .ac-color-field { display: flex; flex-direction: column; gap: 6px; }
  .ac-color-input { width: 100%; height: 36px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2px; cursor: pointer; }
  .ac-color-swatches { display: flex; flex-wrap: wrap; gap: 4px; }
  .ac-color-swatch {
    width: 18px; height: 18px; border-radius: 999px; border: 2px solid #fff;
    box-shadow: 0 0 0 1px #cbd5e1; cursor: pointer; padding: 0;
  }
  .ac-color-swatch--active { box-shadow: 0 0 0 2px #0f172a; }
  .ac-activity-preview-pill {
    display: inline-flex; align-items: center; justify-content: center; min-height: 32px;
    padding: 4px 10px; border-radius: 999px; color: #fff; font-size: 11px; font-weight: 800; text-align: center;
  }
  .ac-mini-btn--block { width: 100%; justify-content: center; margin-top: 8px; }

  .ac-evidence-builder__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .ac-evidence-builder__head h6 { margin: 0; font-size: 13px; font-weight: 900; }
  .ac-evidence-hint { margin: 0 0 12px; font-size: 12px; color: #64748b; }
  .ac-evidence-empty { margin: 0; font-size: 12px; color: #94a3b8; font-style: italic; }
  .ac-evidence-row { display: grid; grid-template-columns: 1fr 130px 150px 40px; gap: 8px; margin-bottom: 8px; align-items: center; }
  .ac-evidence-row--head { margin-bottom: 6px; }
  .ac-evidence-row--head span {
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;
  }
  .ac-mini-btn {
    border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; padding: 6px 10px;
    font-size: 11px; font-weight: 700; cursor: pointer; color: ${BLUE};
  }
  .ac-remove-btn {
    border: 1px solid #fecaca; background: #fff; border-radius: 8px; color: #b91c1c; cursor: pointer;
  }

  .ac-toast {
    position: fixed; bottom: 20px; right: 20px; background: #1e293b; color: #fff; padding: 10px 16px;
    border-radius: 10px; font-size: 13px; font-weight: 600; z-index: 500; display: flex; align-items: center; gap: 8px;
  }

  @media (max-width: 1100px) {
    .ac-workspace, .ac-workspace--toc { grid-template-columns: 1fr; }
    .ac-toc-panel, .ac-side-panel { position: static; max-height: none; }
  }
  @media (max-width: 768px) {
    .ac-stats-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ac-tot-type-row { grid-template-columns: 1fr; }
    .ac-session-card__grid { grid-template-columns: 1fr 1fr; }
    .ac-form-grid { grid-template-columns: 1fr; }
    .ac-field--span-2 { grid-column: span 1; }
    .ac-evidence-row { grid-template-columns: 1fr; }
    .ac-session-card__foot-right { margin-left: 0; width: 100%; }
    .ac-toolbar { flex-direction: column; align-items: stretch; }
    .ac-toolbar__actions { width: 100%; }
    .ac-toolbar__actions .ac-btn { flex: 1; justify-content: center; }
    .ac-activity-picker__grid { grid-template-columns: 1fr; }
    .ac-color-distribution__legend { grid-template-columns: 1fr; }
    .ac-activity-manage-head { display: none; }
    .ac-activity-manage-row { grid-template-columns: 1fr; }
  }
`;

export default AcademicCoordinatorModule;
