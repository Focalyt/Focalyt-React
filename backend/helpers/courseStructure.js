const COURSE_STRUCTURE_PATHS = {
  'unit-chapter-session': {
    unit: true,
    chapter: true,
    session: true,
    path: 'unit-chapter-session',
    pathLabel: 'Unit → Chapter → Session',
  },
  'unit-session': {
    unit: true,
    chapter: false,
    session: true,
    path: 'unit-session',
    pathLabel: 'Unit → Session',
  },
  'chapter-session': {
    unit: false,
    chapter: true,
    session: true,
    path: 'chapter-session',
    pathLabel: 'Chapter → Session',
  },
  session: {
    unit: false,
    chapter: false,
    session: true,
    path: 'session',
    pathLabel: 'Session',
  },
};

const DEFAULT_COURSE_STRUCTURE = COURSE_STRUCTURE_PATHS['unit-chapter-session'];

const toBool = (value) => value === true || value === 'true' || value === 1 || value === '1';

const parseStructure = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }
  if (typeof raw === 'object') return raw;
  return null;
};

/**
 * Session is always required. Allowed planning paths:
 * - session
 * - unit → session
 * - chapter → session
 * - unit → chapter → session
 */
const normalizeCourseStructure = (raw) => {
  const parsed = parseStructure(raw);
  if (!parsed) return { ...DEFAULT_COURSE_STRUCTURE };

  if (parsed.path && COURSE_STRUCTURE_PATHS[parsed.path]) {
    return { ...COURSE_STRUCTURE_PATHS[parsed.path] };
  }

  const hasFlags = parsed.unit !== undefined || parsed.chapter !== undefined;
  if (!hasFlags) return { ...DEFAULT_COURSE_STRUCTURE };

  const unit = toBool(parsed.unit);
  const chapter = toBool(parsed.chapter);

  let path = 'session';
  if (unit && chapter) path = 'unit-chapter-session';
  else if (unit) path = 'unit-session';
  else if (chapter) path = 'chapter-session';

  return { ...COURSE_STRUCTURE_PATHS[path] };
};

const courseStructureSchemaFields = {
  unit: { type: Boolean, default: true },
  chapter: { type: Boolean, default: true },
  session: { type: Boolean, default: true },
  path: {
    type: String,
    enum: ['session', 'unit-session', 'chapter-session', 'unit-chapter-session'],
    default: 'unit-chapter-session',
  },
  pathLabel: { type: String, default: 'Unit → Chapter → Session' },
};

module.exports = {
  COURSE_STRUCTURE_PATHS,
  DEFAULT_COURSE_STRUCTURE,
  normalizeCourseStructure,
  courseStructureSchemaFields,
};
