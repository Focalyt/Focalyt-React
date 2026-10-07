import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { resolveMediaUrl } from "../../../../utils/resolveMediaUrl";

/* ---------------------------------------------------------------
   Tokens (§7 of the design note)
---------------------------------------------------------------- */
const T = {
  ink: "#1e293b",
  mute: "#64748b",
  line: "#e8eef5",
  paper: "#ffffff",
  page: "#f6f8fc",
  coral: "#fa5579",
  coralTint: "#fff1f4",
  sky: "#3b82f6",
  skyTint: "#dbeafe",
  amber: "#d97706",
  amberTint: "#fef3c7",
  lilac: "#7c3aed",
  lilacTint: "#ede9fe",
  mint: "#059669",
  mintTint: "#d1fae5",
};

const TOT_PASS_PERCENT_DEFAULT = 40;
const TOT_MARKS_MAX = 100;

const toPositiveMarks = (value, emptyValue = 0) => {
  if (value === "" || value == null) return emptyValue;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : emptyValue;
};

const toPassPercentage = (value, emptyValue = TOT_PASS_PERCENT_DEFAULT) => {
  if (value === "" || value == null) return emptyValue;
  const n = Number(value);
  if (!Number.isFinite(n)) return emptyValue;
  return Math.min(100, Math.max(1, Math.round(n)));
};

const sumTotMarks = (questions = []) =>
  (questions || []).reduce((sum, question) => sum + toPositiveMarks(question?.marks, 0), 0);

const STATUS_STYLE = {
  Scheduled: { fg: T.sky, bg: T.skyTint, dot: T.sky },
  "Sent to Senior Trainer": { fg: T.amber, bg: T.amberTint, dot: T.amber },
  Assigned: { fg: T.lilac, bg: T.lilacTint, dot: T.lilac },
  "In Progress": { fg: "#0d9488", bg: "#ccfbf1", dot: "#0d9488" },
  Completed: { fg: T.mint, bg: T.mintTint, dot: T.mint },
};

const BACKEND_URL = process.env.REACT_APP_MIPIE_BACKEND_URL ;
const COURSE_STORAGE_KEY = "ac.selectedCourseId";

const getAuthToken = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    return user.token || sessionStorage.getItem("token");
  } catch (_) {
    return sessionStorage.getItem("token");
  }
};

const authHeaders = (token) => ({ "x-auth": token });

const fetchCoursesApi = async (token) => {
  const res = await axios.get(`${BACKEND_URL}/college/all_courses`, {
    headers: authHeaders(token),
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

const fetchActivityTypesApi = async (token, courseId) => {
  if (!courseId) return [];
  const res = await axios.get(`${BACKEND_URL}/college/course-activities`, {
    headers: authHeaders(token),
    params: { courseId },
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

const saveActivityTypesApi = async (token, courseId, types) => {
  const res = await axios.put(
    `${BACKEND_URL}/college/course-activities`,
    { courseId, types },
    { headers: authHeaders(token) }
  );
  return Array.isArray(res.data?.data) ? res.data.data : types;
};

const fetchSessionsApi = async (token, courseId) => {
  const res = await axios.get(`${BACKEND_URL}/college/session-plans`, {
    headers: authHeaders(token),
    params: courseId ? { course: courseId } : {},
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

const fetchCourseBatchesApi = async (token, courseId) => {
  const res = await axios.get(`${BACKEND_URL}/college/get_batches`, {
    headers: authHeaders(token),
    params: courseId ? { courseId } : {},
  });
  const rows = Array.isArray(res.data?.data) ? res.data.data : [];
  const seen = new Set();
  return rows
    .filter((row) => {
      const id = row._id ? String(row._id) : "";
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((row) => ({
      id: String(row._id),
      name: row.name || "Batch",
      status: row.status || "",
      startDate: row.startDate || "",
      endDate: row.endDate || "",
    }));
};


const COURSE_STRUCTURE_PATHS = {
  "unit-chapter-session": { unit: true, chapter: true, session: true, path: "unit-chapter-session", pathLabel: "Unit → Chapter → Session" },
  "unit-session": { unit: true, chapter: false, session: true, path: "unit-session", pathLabel: "Unit → Session" },
  "chapter-session": { unit: false, chapter: true, session: true, path: "chapter-session", pathLabel: "Chapter → Session" },
  session: { unit: false, chapter: false, session: true, path: "session", pathLabel: "Session" },
};

const normalizeCourseStructure = (structure) => {
  if (structure?.path && COURSE_STRUCTURE_PATHS[structure.path]) {
    return { ...COURSE_STRUCTURE_PATHS[structure.path] };
  }
  const unit = structure?.unit === true;
  const chapter = structure?.chapter === true;
  if (structure?.unit === undefined && structure?.chapter === undefined) {
    return { ...COURSE_STRUCTURE_PATHS["unit-chapter-session"] };
  }
  if (unit && chapter) return { ...COURSE_STRUCTURE_PATHS["unit-chapter-session"] };
  if (unit) return { ...COURSE_STRUCTURE_PATHS["unit-session"] };
  if (chapter) return { ...COURSE_STRUCTURE_PATHS["chapter-session"] };
  return { ...COURSE_STRUCTURE_PATHS.session };
};

const createSessionApi = async (token, payload) => {
  const res = await axios.post(`${BACKEND_URL}/college/session-plans`, payload, {
    headers: authHeaders(token),
  });
  if (!res.data?.status) throw new Error(res.data?.message || "Failed to create session");
  return res.data.data;
};

const updateSessionApi = async (token, sessionId, payload) => {
  const res = await axios.put(`${BACKEND_URL}/college/session-plans/${sessionId}`, payload, {
    headers: authHeaders(token),
  });
  if (!res.data?.status) throw new Error(res.data?.message || "Failed to update session");
  return res.data.data;
};

const patchSessionApi = async (token, sessionId, payload) => {
  const res = await axios.patch(`${BACKEND_URL}/college/session-plans/${sessionId}`, payload, {
    headers: authHeaders(token),
  });
  if (!res.data?.status) throw new Error(res.data?.message || "Failed to refer session");
  return res.data.data;
};

const fetchBatchFieldTrainersApi = async (token, batchId) => {
  if (!batchId) return [];
  const res = await axios.get(`${BACKEND_URL}/college/batches/${batchId}/training-team`, {
    headers: authHeaders(token),
  });
  const rows = Array.isArray(res.data?.trainers) ? res.data.trainers : [];
  return rows
    .filter((row) => row._id)
    .map((row) => ({
      id: String(row._id),
      name: row.name || row.email || "Trainer",
    }));
};

const deleteSessionApi = async (token, sessionId) => {
  const res = await axios.delete(`${BACKEND_URL}/college/session-plans/${sessionId}`, {
    headers: authHeaders(token),
  });
  if (!res.data?.status) throw new Error(res.data?.message || "Failed to delete session");
};

const splitList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const mapApiSessionToUi = (api = {}) => {
  const activities = Array.isArray(api.sessionActivities) ? api.sessionActivities : [];
  const activityIds = (Array.isArray(api.activityIds) && api.activityIds.length
    ? api.activityIds
    : activities.map((a) => a.id).filter(Boolean)
  ).map(String);
  const unitParts = [api.unitNumber ? `Unit ${api.unitNumber}` : "", api.unitName].filter(Boolean);
  const chapterParts = [api.chapterNumber ? `Ch. ${api.chapterNumber}` : "", api.chapterName].filter(Boolean);
  const agenda = Array.isArray(api.subSessionItems) && api.subSessionItems.length
    ? api.subSessionItems.map((item, i) => ({
        id: item._id || item.id || `agenda-${i}`,
        duration: item.duration || "",
        topic: item.name || item.topic || "",
      }))
    : splitList(api.topicCovered).map((topic, i) => ({
        id: `topic-${i}`,
        duration: "",
        topic,
      }));
  const withIds = (items = []) =>
    (Array.isArray(items) ? items : []).map((item, i) => ({
      id: item.id || item._id || `item-${i}`,
      name: item.name || "",
      type: item.type || "Document",
    }));

  return {
    id: String(api.id || api._id),
    number: api.sessionNumber || "",
    unit: unitParts.length ? unitParts.join(" · ") : null,
    chapter: chapterParts.length ? chapterParts.join(" · ") : null,
    unitNumber: api.unitNumber || "",
    unitName: api.unitName || "",
    chapterNumber: api.chapterNumber || "",
    chapterName: api.chapterName || "",
    name: api.title || "",
    status: api.workflowStatus || "Scheduled",
    activityIds,
    tot: api.includeTot === true,
    hours: api.hours || "",
    method: api.trainingMethod || "",
    duration: api.duration || (api.hours ? `${api.hours} hrs` : ""),
    topics: agenda.map((a) => a.topic).filter(Boolean),
    subTopics: splitList(api.subTopics),
    materials: {
      documents: (api.evidenceDocs || []).filter((item) => item?.name).length,
      learning: (api.learningMaterials || []).filter((item) => item?.name).length,
    },
    notes: api.notes || "",
    fieldTrainer: api.fieldTrainerName || null,
    fieldTrainerId: api.fieldTrainerId || "",
    totTrainer: api.totTrainerName || null,
    totTrainerId: api.totTrainerId || "",
    seniorTrainer: api.seniorTrainerName || null,
    seniorTrainerId: api.seniorTrainerId || "",
    batch: api.batch ? String(api.batch) : "",
    batchCode: api.batchCode || "",
    courseName: api.courseName || api.courseTrade || "",
    totTopic: api.totTopicCovered || "",
    totMethod: api.totTrainingMethod || "",
    totUseSameTopic: api.totUseSameTopics !== false,
    totPassPercentage: toPassPercentage(api.totPassPercentage, TOT_PASS_PERCENT_DEFAULT),
    totQuestions: Array.isArray(api.totQuestionBank)
      ? api.totQuestionBank.map((q, i) => ({
          id: q.id || q._id || `totq-${i}`,
          question: q.question || "",
          options: Array.isArray(q.options) && q.options.length ? q.options : ["", "", "", ""],
          correctIndex: Number(q.correctIndex) || 0,
          marks: toPositiveMarks(q.marks, 1),
        }))
      : [],
    studentMaterial: withIds(api.learningMaterials),
    requiredDocuments: withIds(api.evidenceDocs),
    standardTlm: withIds(api.standardTlm),
    trainerTlm: withIds(api.trainerBasedTlm),
    totCompletionProofs: withIds(api.totCompletionProofs),
    agendaBlocks: agenda,
    resources: api.classroomLabResources || "",
  };
};



/* ---------------------------------------------------------------
   Session payload helpers (TOT / TLM are saved on an existing session)
---------------------------------------------------------------- */
const MATERIAL_TYPE_OPTIONS = ["PDF", "Image", "Video", "Document", "Presentation"];

const createListItem = (type = "Document") => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: "",
  type,
});

const addListItem = (setter, type = "Document") => {
  setter((prev) => [...prev, createListItem(type)]);
};

const updateListItem = (setter, index, field, value) => {
  setter((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
};

const removeListItem = (setter, index) => {
  setter((prev) => prev.filter((_, i) => i !== index));
};

const namedItems = (items) => (items || []).filter((item) => item.name?.trim()).map((item) => ({
  id: item.id,
  name: item.name.trim(),
  type: item.type || "Document",
}));

const RESOURCE_UPLOAD_TYPES = ["Image", "PDF", "Video", "Document", "Presentation"];

const RESOURCE_FILE_RULES = {
  Image: { accept: "image/jpeg,image/png,image/gif,image/webp,image/bmp,.jpg,.jpeg,.png,.gif,.webp,.bmp", extensions: ["jpg", "jpeg", "png", "gif", "bmp", "webp"] },
  PDF: { accept: ".pdf,application/pdf", extensions: ["pdf"] },
  Video: { accept: "video/mp4,video/quicktime,video/x-msvideo,.mp4,.mkv,.mov,.avi,.wmv", extensions: ["mp4", "mkv", "mov", "avi", "wmv"] },
  Document: { accept: ".pdf,.doc,.docx,application/pdf", extensions: ["pdf", "doc", "docx"] },
  Presentation: { accept: ".ppt,.pptx,.pdf", extensions: ["ppt", "pptx", "pdf"] },
};

const fileExtension = (name = "") => String(name).split(".").pop().trim().toLowerCase();

const resourceFileAllowed = (uploadType, file) => {
  if (!file) return true;
  const rule = RESOURCE_FILE_RULES[uploadType] || RESOURCE_FILE_RULES.PDF;
  return rule.extensions.includes(fileExtension(file.name));
};

const isStoredResourceId = (id) => /^[a-f\d]{24}$/i.test(String(id || ""));

const resourceDisplayName = (item) => {
  const typed = String(item?.name || "").trim();
  if (typed) return typed;
  if (item?.file?.name) return item.file.name.replace(/\.[^.]+$/, "");
  return "";
};

const mapCourseResources = (items = []) =>
  (Array.isArray(items) ? items : [])
    .filter((item) => item && item.status !== false)
    .map((item, index) => ({
      id: item._id || `res-${index}`,
      name: item.Name || item.name || "",
      description: item.description || "",
      uploadType: RESOURCE_UPLOAD_TYPES.includes(item.uploadType) ? item.uploadType : "PDF",
      fileUrl: item.fileUrl || "",
      file: null,
      mandatory: !!item.mandatory,
    }));

const createResourceItem = () => ({
  id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: "",
  description: "",
  uploadType: "PDF",
  fileUrl: "",
  file: null,
  mandatory: false,
});

const updateResourceItem = (setter, index, field, value) => {
  setter((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
};

const buildResourceFormData = (classResources, labResources) => {
  const form = new FormData();
  const pack = (items, filePrefix) => {
    const rows = [];
    (items || []).forEach((item) => {
      const name = resourceDisplayName(item);
      if (!name) return;
      const index = rows.length;
      rows.push({
        ...(isStoredResourceId(item.id) ? { _id: item.id } : {}),
        Name: name,
        description: item.description?.trim() || "",
        uploadType: RESOURCE_UPLOAD_TYPES.includes(item.uploadType) ? item.uploadType : "PDF",
        fileUrl: item.file ? "" : (item.fileUrl || ""),
        mandatory: !!item.mandatory,
        status: true,
      });
      if (item.file) form.append(`${filePrefix}_${index}`, item.file);
    });
    return rows;
  };
  form.append("classResourcesRequired", JSON.stringify(pack(classResources, "classFile")));
  form.append("labResourcesRequired", JSON.stringify(pack(labResources, "labFile")));
  return form;
};

const countNamedResources = (items = []) =>
  (Array.isArray(items) ? items : []).filter((item) => item && item.status !== false && String(item.Name || item.name || "").trim()).length;

const EMPTY_SESSION_ADDONS = {
  learningMaterials: [],
  evidenceDocs: [],
  standardTlm: [],
  trainerBasedTlm: [],
  sessionActivities: [],
  includeTot: false,
  totUseSameTopics: false,
  totTopicCovered: "",
  totTrainingMethod: "",
  totCompletionProofs: [],
  totQuestionBank: [],
};

// Rebuilds the API payload from a session already mapped for the UI, so a PUT keeps every existing field.
const buildSessionPayload = (session, activityTypes = []) => {
  const selectedTypes = (activityTypes || []).filter((a) => (session.activityIds || []).includes(a.id));
  const hasTot = session.tot === true;
  return {
    title: session.name,
    sessionNumber: String(session.number || ""),
    hours: String(session.hours || ""),
    duration: session.duration || "",
    trainingMethod: session.method || "",
    classroomLabResources: session.resources || "",
    unitNumber: session.unitNumber || "",
    unitName: session.unitName || "",
    chapterNumber: session.chapterNumber || "",
    chapterName: session.chapterName || "",
    subTopics: (session.subTopics || []).join(", "),
    topicCovered: (session.agendaBlocks || []).map((block) => block.topic).filter(Boolean).join(", "),
    subSessionItems: (session.agendaBlocks || [])
      .filter((block) => block.topic?.trim())
      .map((block) => ({ name: block.topic.trim(), duration: String(block.duration || "") })),
    sessionActivities: selectedTypes.map((a) => ({ id: a.id, name: a.name, color: a.color })),
    learningMaterials: namedItems(session.studentMaterial),
    evidenceDocs: namedItems(session.requiredDocuments),
    standardTlm: namedItems(session.standardTlm),
    trainerBasedTlm: namedItems(session.trainerTlm),
    includeTot: hasTot,
    totUseSameTopics: hasTot ? session.totUseSameTopic !== false : false,
    totTopicCovered: hasTot && session.totUseSameTopic === false ? session.totTopic || "" : "",
    totTrainingMethod: hasTot ? session.totMethod || "" : "",
    totCompletionProofs: hasTot ? namedItems(session.totCompletionProofs) : [],
    totQuestionBank: hasTot
      ? (session.totQuestions || [])
          .filter((q) => q.question?.trim())
          .map((q) => ({
            question: q.question.trim(),
            options: q.options || [],
            correctIndex: q.correctIndex || 0,
            marks: toPositiveMarks(q.marks, 1),
          }))
      : [],
    totPassPercentage: hasTot ? toPassPercentage(session.totPassPercentage, TOT_PASS_PERCENT_DEFAULT) : undefined,
    notes: session.notes || "",
    workflowStatus: session.status || "Scheduled",
  };
};

/* ---------------------------------------------------------------
   Syllabus outline (units / chapters) helpers
   Units and chapters that have no session yet are kept in the browser
   (per course). Units/chapters that already have sessions come from the
   sessions themselves.
---------------------------------------------------------------- */
const OUTLINE_KEY = (courseId) => `ac.outline.${courseId}`;

const loadOutline = (courseId) => {
  try {
    const raw = localStorage.getItem(OUTLINE_KEY(courseId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const saveOutline = (courseId, outline) => {
  try {
    localStorage.setItem(OUTLINE_KEY(courseId), JSON.stringify(outline));
  } catch (_) {
    /* ignore storage errors */
  }
};

const keyOf = (number, name) => `${String(number || "").trim()}|${String(name || "").trim()}`;
const unitLabel = (u) => [u?.number ? `Unit ${u.number}` : "", u?.name].filter(Boolean).join(" · ");
const chapterLabel = (c) => [c?.number ? `Ch. ${c.number}` : "", c?.name].filter(Boolean).join(" · ");
const byNumber = (a, b) =>
  String(a.number || "").localeCompare(String(b.number || ""), undefined, { numeric: true });
const nextNumberFrom = (items = []) =>
  String(items.reduce((max, item) => Math.max(max, parseInt(item.number, 10) || 0), 0) + 1);

const buildSyllabusTree = (outline, sessions, hideEmpty) => {
  const units = new Map();
  const ensureUnit = (number, name) => {
    const key = keyOf(number, name);
    if (!units.has(key)) {
      units.set(key, { key, number: String(number || ""), name: name || "", chapters: new Map(), sessions: [] });
    }
    return units.get(key);
  };
  const ensureChapter = (unit, number, name) => {
    const key = keyOf(number, name);
    if (!unit.chapters.has(key)) {
      unit.chapters.set(key, { key, number: String(number || ""), name: name || "", sessions: [] });
    }
    return unit.chapters.get(key);
  };

  (outline || []).forEach((u) => {
    const unit = ensureUnit(u.number, u.name);
    (u.chapters || []).forEach((c) => ensureChapter(unit, c.number, c.name));
  });

  (sessions || []).forEach((sess) => {
    const unit = ensureUnit(sess.unitNumber, sess.unitName);
    if (sess.chapterNumber || sess.chapterName) {
      ensureChapter(unit, sess.chapterNumber, sess.chapterName).sessions.push(sess);
    } else {
      unit.sessions.push(sess);
    }
  });

  let list = Array.from(units.values())
    .map((u) => ({
      ...u,
      sessions: [...u.sessions].sort(byNumber),
      chapters: Array.from(u.chapters.values())
        .sort(byNumber)
        .map((c) => ({ ...c, sessions: [...c.sessions].sort(byNumber) })),
    }))
    .sort(byNumber);

  if (hideEmpty) {
    list = list
      .map((u) => ({ ...u, chapters: u.chapters.filter((c) => c.sessions.length > 0) }))
      .filter((u) => u.sessions.length > 0 || u.chapters.length > 0);
  }
  return list;
};

/* ---------------------------------------------------------------
   Small building blocks
---------------------------------------------------------------- */
const IconTile = ({ children, tint, ink, size = 40 }) => {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size * 0.32,
        background: tint, color: ink, display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0, fontSize: size * 0.42, fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
};

const StatusPill = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Scheduled;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
        borderRadius: 999, background: s.bg, color: s.fg, fontSize: 12, fontWeight: 600,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
      {status}
    </span>
  );
};

const Toast = ({ toast }) => {
  if (!toast) return null;
  const good = toast.type === "success";
  return createPortal(
    <div
      style={{
        position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)",
        background: good ? "#065f46" : "#7f1d1d", color: "#fff", padding: "10px 18px",
        borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
        zIndex: 10100, maxWidth: 360, textAlign: "center",
      }}
    >
      {toast.message}
    </div>,
    document.body
  );
};

/* ---------------------------------------------------------------
   Main component
---------------------------------------------------------------- */
const AcademicCoordinatorMockup = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // 'create' | 'activity'
  const [createStep, setCreateStep] = useState(0);
  const [editingSession, setEditingSession] = useState(null);
  const [savingSession, setSavingSession] = useState(false);
  const [referOpen, setReferOpen] = useState(false);
  const [referSaving, setReferSaving] = useState(false);
  const [activityTypes, setActivityTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(() => sessionStorage.getItem(COURSE_STORAGE_KEY) || "");
  const [incomingBatchId] = useState(() => new URLSearchParams(window.location.search).get("batchId") || "");
  const [toast, setToast] = useState(null);
  const persistTimer = useRef(null);
  const [permissions, setPermissions] = useState();
  const [outline, setOutline] = useState([]);
  const [outlineModal, setOutlineModal] = useState(null); // { kind: 'unit' | 'chapter', ... }
  const [preset, setPreset] = useState(null);
  const [savingResources, setSavingResources] = useState(false);

  useEffect(() => {
    setOutline(selectedCourseId ? loadOutline(selectedCourseId) : []);
  }, [selectedCourseId]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token || !BACKEND_URL) return undefined;
    axios.get(`${BACKEND_URL}/college/permission`, {
      headers: { "x-auth": token },
    }).then((res) => {
      if (res.data.status) setPermissions(res.data.permissions);
    }).catch((err) => {
      console.error("Failed to load academic coordinator permissions", err);
    });
    return undefined;
  }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const token = getAuthToken();
      if (!token) {
        if (!cancelled) {
          setCourses([]);
          setActivityTypes([]);
          setSessions([]);
          setTypesLoading(false);
        }
        return;
      }
      try {
        const courseRows = await fetchCoursesApi(token);
        if (cancelled) return;
        setCourses(courseRows);
        const params = new URLSearchParams(window.location.search);
        const queryCourseId = params.get("courseId") || "";
        const querySessionId = params.get("sessionId") || "";
        const storedCourseId = sessionStorage.getItem(COURSE_STORAGE_KEY) || "";
        const preferredCourseId = queryCourseId || storedCourseId;
        const validStored = courseRows.some((course) => String(course._id) === preferredCourseId);
        const nextCourseId = validStored
          ? preferredCourseId
          : (courseRows[0] ? String(courseRows[0]._id) : "");
        if (nextCourseId !== selectedCourseId) {
          setSelectedCourseId(nextCourseId);
        }
        if (nextCourseId) sessionStorage.setItem(COURSE_STORAGE_KEY, nextCourseId);
        if (!nextCourseId) {
          setActivityTypes([]);
          setSessions([]);
          setTypesLoading(false);
          return;
        }
        const [types, sessionRows] = await Promise.all([
          fetchActivityTypesApi(token, nextCourseId),
          fetchSessionsApi(token, nextCourseId),
        ]);
        if (!cancelled) {
          const mapped = sessionRows.map(mapApiSessionToUi);
          setActivityTypes(types);
          setSessions(mapped);
          if (querySessionId && mapped.some((session) => session.id === String(querySessionId))) {
            setSelectedId(String(querySessionId));
          }
        }
      } catch (err) {
        console.error("Failed to load academic coordinator data", err);
        if (!cancelled) {
          setActivityTypes([]);
          setSessions([]);
          setToast({ type: "error", message: err.response?.data?.message || "Failed to load data" });
        }
      } finally {
        if (!cancelled) setTypesLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      clearTimeout(persistTimer.current);
    };
  }, []);

  const persistActivityTypes = useCallback(async (nextTypes) => {
    const token = getAuthToken();
    if (!token) {
      setToast({ type: "error", message: "Please sign in to save activity types" });
      return;
    }
    if (!selectedCourseId) {
      setToast({ type: "error", message: "Select a course first" });
      return;
    }
    try {
      const saved = await saveActivityTypesApi(token, selectedCourseId, nextTypes);
      setActivityTypes(saved);
    } catch (err) {
      console.error("Failed to save activity types", err);
      setToast({ type: "error", message: err.response?.data?.message || "Failed to save activity types" });
    }
  }, [selectedCourseId]);

  const handleActivityTypesChange = useCallback((nextTypes, options = {}) => {
    const persistNow = options.persist !== false;
    setActivityTypes(nextTypes);
    clearTimeout(persistTimer.current);
    if (persistNow) {
      persistActivityTypes(nextTypes);
    } else {
      persistTimer.current = setTimeout(() => persistActivityTypes(nextTypes), 450);
    }
  }, [persistActivityTypes]);

  const saveCourseResources = async (payload) => {
    const token = getAuthToken();
    if (!token) {
      setToast({ type: "error", message: "Please sign in to save resources" });
      return;
    }
    if (!selectedCourseId || savingResources) {
      if (!selectedCourseId) setToast({ type: "error", message: "Select a course first" });
      return;
    }
    setSavingResources(true);
    try {
      const res = await axios.patch(
        `${BACKEND_URL}/college/courses/${selectedCourseId}/required-resources`,
        payload,
        { headers: authHeaders(token) }
      );
      const data = res.data?.data || {};
      setCourses((prev) => prev.map((course) => (
        String(course._id) === String(selectedCourseId)
          ? {
              ...course,
              classResourcesRequired: data.classResourcesRequired || [],
              labResourcesRequired: data.labResourcesRequired || [],
            }
          : course
      )));
      setToast({ type: "success", message: "Resources saved" });
      setModal(null);
    } catch (err) {
      console.error("Failed to save course resources", err);
      setToast({ type: "error", message: err.response?.data?.message || "Failed to save resources" });
    } finally {
      setSavingResources(false);
    }
  };

  const display = { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" };
  const body = { fontFamily: "'Inter', system-ui, sans-serif" };

  useEffect(() => {
    if (!selectedId) return undefined;
    const row = document.querySelector(`[data-ac-session="${CSS.escape(String(selectedId))}"]`);
    row?.scrollIntoView({ block: "center" });
    return undefined;
  }, [selectedId, sessions]);

  const selected = sessions.find((s) => s.id === selectedId) || null;
  const selectedCourse = useMemo(
    () => courses.find((course) => String(course._id) === String(selectedCourseId)) || null,
    [courses, selectedCourseId]
  );
  const courseStructure = useMemo(
    () => normalizeCourseStructure(selectedCourse?.courseStructure),
    [selectedCourse]
  );

  const distribution = useMemo(() => {
    const counts = {};
    sessions.forEach((s) => (s.activityIds || []).forEach((id) => (counts[id] = (counts[id] || 0) + 1)));
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return (activityTypes || [])
      .map((a) => ({ ...a, count: counts[a.id] || 0, pct: ((counts[a.id] || 0) / total) * 100 }))
      .filter((a) => a.count > 0);
  }, [sessions, activityTypes]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (search && !(s.name.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [sessions, search]);

  const tree = useMemo(
    () => buildSyllabusTree(outline, filteredSessions, Boolean(search)),
    [outline, filteredSessions, search]
  );


  const openCreate = (existing, presetArg = null) => {
    if (!selectedCourseId) {
      setToast({ type: "error", message: "Select a course first" });
      return;
    }
    setEditingSession(existing || null);
    setPreset(presetArg);
    setCreateStep(presetArg ? 1 : 0);
    setModal("create");
  };

  const saveSession = async (draft) => {
    const token = getAuthToken();
    if (!token) {
      setToast({ type: "error", message: "Please sign in to save sessions" });
      return;
    }
    if (!selectedCourseId) {
      setToast({ type: "error", message: "Select a course first" });
      return;
    }
    if (!draft?.title?.trim()) {
      setToast({ type: "error", message: "Please enter a session name" });
      return;
    }
    setSavingSession(true);
    try {
      // Edit keeps the session's existing TOT / TLM; a new session starts without them.
      const base = editingSession?.id
        ? buildSessionPayload(editingSession, activityTypes)
        : EMPTY_SESSION_ADDONS;
      const merged = { ...base, ...draft };
      const payload = {
        ...merged,
        course: selectedCourseId,
        activityIds: (merged.sessionActivities || []).map((item) => item.id).filter(Boolean),
      };
      const saved = editingSession?.id
        ? await updateSessionApi(token, editingSession.id, payload)
        : await createSessionApi(token, payload);
      const mapped = mapApiSessionToUi(saved);
      setSessions((prev) => {
        const exists = prev.some((s) => s.id === mapped.id);
        return exists ? prev.map((s) => (s.id === mapped.id ? mapped : s)) : [...prev, mapped];
      });
      setSelectedId(mapped.id);
      setModal(null);
      setToast({ type: "success", message: editingSession ? "Session plan updated" : "Session plan created" });
      const types = await fetchActivityTypesApi(token, selectedCourseId);
      setActivityTypes(types);
    } catch (err) {
      console.error("Failed to save session", err);
      setToast({ type: "error", message: err.response?.data?.message || err.message || "Failed to save session" });
    } finally {
      setSavingSession(false);
    }
  };

  const saveSessionAddon = async (values, message) => {
    const token = getAuthToken();
    if (!token || !selected?.id) {
      setToast({ type: "error", message: "Select a session first" });
      return;
    }
    setSavingSession(true);
    try {
      const base = buildSessionPayload(selected, activityTypes);
      const merged = { ...base, ...values };
      const payload = {
        ...merged,
        course: selectedCourseId,
        activityIds: (merged.sessionActivities || []).map((item) => item.id).filter(Boolean),
      };
      const saved = await updateSessionApi(token, selected.id, payload);
      const mapped = mapApiSessionToUi(saved);
      setSessions((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setModal(null);
      setToast({ type: "success", message });
    } catch (err) {
      console.error("Failed to save session details", err);
      setToast({ type: "error", message: err.response?.data?.message || err.message || "Failed to save" });
    } finally {
      setSavingSession(false);
    }
  };

  const referSession = async (trainer, batch) => {
    const token = getAuthToken();
    if (!token || !selected?.id) {
      setToast({ type: "error", message: "Select a session first" });
      return;
    }
    if (!batch?.id) {
      setToast({ type: "error", message: "Select a batch" });
      return;
    }
    if (!trainer?.id) {
      setToast({ type: "error", message: "Select a trainer" });
      return;
    }
    setReferSaving(true);
    try {
      const keepProgress = selected.status === "In Progress" || selected.status === "Completed";
      const saved = await patchSessionApi(token, selected.id, {
        fieldTrainerId: trainer.id,
        fieldTrainerName: trainer.name,
        workflowStatus: keepProgress ? selected.status : "Assigned",
        batch: batch.id,
        batchCode: batch.name,
      });
      const mapped = mapApiSessionToUi(saved);
      setSessions((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setReferOpen(false);
      setToast({ type: "success", message: `Session assigned to ${trainer.name} for ${batch.name}` });
    } catch (err) {
      console.error("Failed to refer session", err);
      setToast({ type: "error", message: err.response?.data?.message || err.message || "Failed to refer session" });
    } finally {
      setReferSaving(false);
    }
  };

  const deleteSession = async (id) => {
    const token = getAuthToken();
    if (!token) {
      setToast({ type: "error", message: "Please sign in to delete sessions" });
      return;
    }
    try {
      await deleteSessionApi(token, id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (selectedId === id) setSelectedId(null);
      setToast({ type: "success", message: "Session plan deleted" });
    } catch (err) {
      console.error("Failed to delete session", err);
      setToast({ type: "error", message: err.response?.data?.message || "Failed to delete session" });
    }
  };

  /* ---- syllabus outline: units -> chapters -> sessions ---- */
  const fullTree = () => buildSyllabusTree(outline, sessions, false);

  const persistOutline = (next) => {
    setOutline(next);
    if (selectedCourseId) saveOutline(selectedCourseId, next);
  };

  const openAddUnit = () => {
    const units = fullTree().filter((u) => u.key !== "|");
    setOutlineModal({ kind: "unit", suggestedNumber: nextNumberFrom(units) });
  };

  const openAddChapter = (unitNode) => {
    const full = fullTree().find((u) => u.key === unitNode.key) || unitNode;
    setOutlineModal({
      kind: "chapter",
      unitKey: full.key,
      parentLabel: full.key === "|" ? "" : unitLabel(full),
      suggestedNumber: nextNumberFrom(full.chapters),
    });
  };

  const openAddSession = (unitNode, chapterNode) => {
    const full = fullTree().find((u) => u.key === unitNode.key) || unitNode;
    const fullChapter = chapterNode ? full.chapters.find((c) => c.key === chapterNode.key) || chapterNode : null;
    const siblings = fullChapter ? fullChapter.sessions : full.sessions;
    openCreate(null, {
      unitNumber: full.number,
      unitName: full.name,
      chapterNumber: fullChapter?.number || "",
      chapterName: fullChapter?.name || "",
      sessionNumber: siblings.length ? nextNumberFrom(siblings) : "1",
    });
  };

  const addUnit = ({ number, name }) => {
    const key = keyOf(number, name);
    if (fullTree().some((u) => u.key === key)) {
      setToast({ type: "error", message: "This unit already exists" });
      return;
    }
    persistOutline([...outline, { number, name, chapters: [] }]);
    setOutlineModal(null);
    setToast({ type: "success", message: "Unit added" });
  };

  const addChapter = (unitKey, { number, name }) => {
    const unitNode = fullTree().find((u) => u.key === unitKey);
    const chapterKey = keyOf(number, name);
    if (unitNode?.chapters.some((c) => c.key === chapterKey)) {
      setToast({ type: "error", message: "This chapter already exists in the unit" });
      return;
    }
    const inOutline = outline.some((u) => keyOf(u.number, u.name) === unitKey);
    const next = inOutline
      ? outline.map((u) =>
          keyOf(u.number, u.name) === unitKey
            ? { ...u, chapters: [...(u.chapters || []), { number, name }] }
            : u
        )
      : [
          ...outline,
          { number: unitNode?.number || "", name: unitNode?.name || "", chapters: [{ number, name }] },
        ];
    persistOutline(next);
    setOutlineModal(null);
    setToast({ type: "success", message: "Chapter added" });
  };

  const removeOutlineUnit = (unitKey) => {
    persistOutline(outline.filter((u) => keyOf(u.number, u.name) !== unitKey));
  };

  const removeOutlineChapter = (unitKey, chapterKey) => {
    persistOutline(
      outline.map((u) =>
        keyOf(u.number, u.name) === unitKey
          ? { ...u, chapters: (u.chapters || []).filter((c) => keyOf(c.number, c.name) !== chapterKey) }
          : u
      )
    );
  };

  const showNewPlan = !courseStructure.unit && !courseStructure.chapter;

  const isCustom = permissions?.permission_type === "Custom";
  const canOpenSessionScreen =
    permissions?.permission_type === "Admin" ||
    (isCustom && (
      permissions?.custom_permissions?.can_be_academic_coordinator ||
      permissions?.custom_permissions?.can_be_senior_trainer
    ));

  if (permissions && !canOpenSessionScreen) {
    return (
      <div style={{ ...body, background: T.page, minHeight: 600, borderRadius: 16, padding: 48, textAlign: "center", color: T.ink }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <div style={{ ...display, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Access denied</div>
        <div style={{ color: T.mute }}>
          You need <strong>Academic Coordinator</strong> or <strong>Senior Trainer</strong> permission (or Admin) to use this module.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...body, background: T.page, minHeight: 600, borderRadius: 16, position: "relative",
        color: T.ink, display: "flex", flexDirection: "column", overflow: "hidden",
      }}
    >
      <style>{`
        .ac-card-btn { transition: transform 150ms ease, border-color 150ms ease; cursor: pointer; }
        .ac-card-btn:hover { transform: translateY(-2px); border-color: ${T.coral} !important; }
        .ac-toc-row:hover { background: #fbeef1 !important; }
        .ac-pill-btn { transition: background 120ms ease, color 120ms ease; cursor: pointer; }
        .ac-input { border: 1px solid ${T.line}; border-radius: 12px; padding: 10px 12px; font-size: 14px; font-family: inherit; outline: none; width: 100%; box-sizing: border-box; }
        .ac-input:focus { border-color: ${T.coral}; }
        .ac-marks-input { -moz-appearance: textfield; appearance: textfield; }
        .ac-marks-input::-webkit-outer-spin-button,
        .ac-marks-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .ac-scroll::-webkit-scrollbar { width: 6px; }
        .ac-scroll::-webkit-scrollbar-thumb { background: #d8dee8; border-radius: 6px; }
        .ac-collapse-btn:hover { border-color: ${T.coral} !important; color: ${T.coral} !important; }
      `}</style>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <IconTile tint={T.coralTint} ink={T.coral}>◐</IconTile>
          <div>
            <div style={{ ...display, fontSize: 19, fontWeight: 700 }}>Academic Coordinator</div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, padding: "0 24px 24px", overflow: "auto" }} className="ac-scroll">
        <Workspace
          display={display}
          distribution={distribution}
          search={search}
          setSearch={setSearch}
          tree={tree}
          courseStructure={courseStructure}
          showNewPlan={showNewPlan}
          onAddUnit={openAddUnit}
          onAddChapter={openAddChapter}
          onAddSession={openAddSession}
          onRemoveUnit={removeOutlineUnit}
          onRemoveChapter={removeOutlineChapter}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          selected={selected}
          activityTypes={activityTypes}
          onNewPlan={() => openCreate(null)}
          onEdit={() => openCreate(selected)}
          onDelete={() => deleteSession(selected.id)}
          onRefer={() => setReferOpen(true)}
          onSetActivity={() => setModal("sessionActivity")}
          onAddTot={() => setModal("tot")}
          onAddTlm={() => setModal("tlm")}
          onManageResources={() => {
            if (!selectedCourseId) {
              setToast({ type: "error", message: "No course available" });
              return;
            }
            setModal("resources");
          }}
          resourceCount={
            countNamedResources(selectedCourse?.classResourcesRequired) +
            countNamedResources(selectedCourse?.labResourcesRequired)
          }
          onManageActivities={() => {
            if (!selectedCourseId) {
              setToast({ type: "error", message: "No course available" });
              return;
            }
            setModal("activity");
          }}
        />
      </div>

      {/* MODALS */}
      {modal === "create" && (
        <CreateModal
          display={display}
          step={createStep}
          setStep={setCreateStep}
          onClose={() => setModal(null)}
          onSave={saveSession}
          saving={savingSession}
          editing={editingSession}
          activityTypes={activityTypes}
          courseStructure={courseStructure}
          preset={preset}
        />
      )}
      {modal === "sessionActivity" && selected && (
        <SessionActivityModal
          display={display}
          session={selected}
          activityTypes={activityTypes}
          saving={savingSession}
          onClose={() => setModal(null)}
          onManage={() => setModal("activity")}
          onSave={(values) => saveSessionAddon(values, "Activity type saved")}
        />
      )}
      {modal === "tot" && selected && (
        <TotModal
          display={display}
          session={selected}
          saving={savingSession}
          onClose={() => setModal(null)}
          onSave={(values) => saveSessionAddon(values, values.includeTot ? "TOT saved" : "TOT removed")}
        />
      )}
      {modal === "tlm" && selected && (
        <TlmModal
          display={display}
          session={selected}
          saving={savingSession}
          onClose={() => setModal(null)}
          onSave={(values) => saveSessionAddon(values, "TLM saved")}
        />
      )}
      {modal === "activity" && (
        <ActivityModal
          display={display}
          types={activityTypes}
          loading={typesLoading}
          onChange={handleActivityTypesChange}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "resources" && (
        <CourseResourcesModal
          display={display}
          course={selectedCourse}
          saving={savingResources}
          onClose={() => { if (!savingResources) setModal(null); }}
          onSave={saveCourseResources}
        />
      )}

      {referOpen && selected && (
        <ReferSessionModal
          session={selected}
          courseId={selectedCourseId}
          preferredBatchId={incomingBatchId}
          saving={referSaving}
          onClose={() => { if (!referSaving) setReferOpen(false); }}
          onConfirm={referSession}
        />
      )}

      {outlineModal && (
        <OutlineModal
          kind={outlineModal.kind}
          parentLabel={outlineModal.parentLabel}
          suggestedNumber={outlineModal.suggestedNumber}
          onClose={() => setOutlineModal(null)}
          onSave={(values) =>
            outlineModal.kind === "unit"
              ? addUnit(values)
              : addChapter(outlineModal.unitKey, values)
          }
        />
      )}

      <Toast toast={toast} />
    </div>
  );
};

/* ---------------------------------------------------------------
   Workspace (§5.3–5.8)
---------------------------------------------------------------- */
const Workspace = (props) => {
  const {
    display, distribution, search, setSearch, tree, courseStructure, showNewPlan,
    onAddUnit, onAddChapter, onAddSession, onRemoveUnit, onRemoveChapter,
    selectedId, setSelectedId, selected, activityTypes, onNewPlan, onEdit,
    onDelete, onRefer, onSetActivity, onAddTot, onAddTlm, onManageActivities,
    onManageResources, resourceCount,
  } = props;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, position: "relative" }}>
          <button
            onClick={onManageResources}
            style={{ height: 40, padding: "0 16px", borderRadius: 999, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, fontWeight: 600, color: T.ink, cursor: "pointer" }}
          >
            Class & lab resources{resourceCount > 0 ? ` (${resourceCount})` : ""}
          </button>
          <button
            onClick={onManageActivities}
            style={{ height: 40, padding: "0 16px", borderRadius: 999, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, fontWeight: 600, color: T.ink, cursor: "pointer" }}
          >
            Activity types
          </button>
          {showNewPlan && (
            <button
              onClick={onNewPlan}
              style={{ height: 40, padding: "0 18px", borderRadius: 999, border: "none", background: T.coral, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              + New plan
            </button>
          )}
        </div>
      </div>

      {/* Color distribution */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 12 }}>📋 Activity Plan</div>
        <div style={{ display: "flex", height: 10, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
          {distribution.map((d) => (
            <div key={d.id} style={{ width: `${d.pct}%`, background: d.color }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {distribution.map((d) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.ink, background: T.page, padding: "8px 12px", borderRadius: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: d.color }} />
              <span style={{ fontWeight: 600 }}>{d.name}</span>
              <span style={{ color: T.mute, fontSize: 12 }}>({d.count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 200 }}>
          <input
            className="ac-input"
            placeholder="Search sessions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 34, height: 20 }}
          />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.mute, fontSize: 13 }}>⌕</span>
        </div>
      </div>

      {/* Master-detail */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
        <TocPanel
          display={display}
          tree={tree}
          courseStructure={courseStructure}
          searching={Boolean(search)}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onCreateFirst={onNewPlan}
          onAddUnit={onAddUnit}
          onAddChapter={onAddChapter}
          onAddSession={onAddSession}
          onRemoveUnit={onRemoveUnit}
          onRemoveChapter={onRemoveChapter}
          activityTypes={activityTypes || []}
        />
        <DetailPanel
          display={display}
          session={selected}
          onEdit={onEdit}
          onDelete={onDelete}
          onRefer={onRefer}
          onSetActivity={onSetActivity}
          onAddTot={onAddTot}
          onAddTlm={onAddTlm}
          activityTypes={activityTypes}
        />
      </div>
    </div>
  );
};

const SessionRow = ({ s, selectedId, setSelectedId, activityTypes = [] }) => {
  const isSel = selectedId === s.id;
  const barColor = activityTypes.find((a) => a.id === (s.activityIds || [])[0])?.color || T.mute;
  return (
    <div
      className="ac-toc-row"
      data-ac-session={s.id}
      onClick={() => setSelectedId(s.id)}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "9px 10px 9px 8px",
        borderRadius: 10, cursor: "pointer", marginBottom: 2,
        background: isSel ? "#fdeef1" : "transparent",
        borderLeft: isSel ? `3px solid ${T.coral}` : "3px solid transparent",
      }}
    >
      <span style={{ width: 5, height: 22, borderRadius: 3, background: barColor, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: T.mute, width: 18, flexShrink: 0 }}>{s.number ? String(s.number).padStart(2, "0") : "—"}</span>
      <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{s.name}</span>
      {s.tot && (
        <span style={{ fontSize: 10, fontWeight: 700, background: T.mintTint, color: T.mint, padding: "2px 7px", borderRadius: 999 }}>TOT</span>
      )}
      <span style={{ width: 7, height: 7, borderRadius: 999, background: STATUS_STYLE[s.status].dot, flexShrink: 0 }} />
    </div>
  );
};

const RowAction = ({ title, onClick, danger = false, label = "", children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    style={{
      height: 24, minWidth: 24, borderRadius: 999, border: "none", cursor: "pointer", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
      fontSize: label ? 12 : 15, fontWeight: 700, lineHeight: 1,
      padding: label ? "0 10px" : 0, whiteSpace: "nowrap",
      background: danger ? "#fee2e2" : T.coralTint, color: danger ? "#b91c1c" : T.coral,
    }}
  >
    {children}
    {label && <span>{label}</span>}
  </button>
);

const Chevron = ({ open }) => (
  <span
    style={{
      display: "inline-block", width: 14, flexShrink: 0, fontSize: 11, color: T.mute,
      transform: open ? "rotate(90deg)" : "none", transition: "transform 120ms ease",
    }}
  >
    ▸
  </span>
);

// Explicit, visible collapse / expand button for a unit or chapter row.
const CollapseBtn = ({ open, onClick, title, disabled = false }) => (
  <button
    type="button"
    className="ac-collapse-btn"
    title={title}
    aria-label={title}
    aria-expanded={open}
    disabled={disabled}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    style={{
      height: 24, padding: "0 10px", borderRadius: 999, border: `1px solid ${T.line}`,
      background: "#fff", color: T.mute, fontSize: 12, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      display: "flex", alignItems: "center", gap: 4, flexShrink: 0, whiteSpace: "nowrap",
      transition: "border-color 120ms ease, color 120ms ease",
    }}
  >
    <span
      style={{
        display: "inline-block", fontSize: 10,
        transform: open ? "rotate(90deg)" : "none", transition: "transform 120ms ease",
      }}
    >
      ▸
    </span>
    {open ? "Collapse" : "Expand"}
  </button>
);

const countSessions = (node) =>
  (node.sessions || []).length + (node.chapters || []).reduce((sum, c) => sum + c.sessions.length, 0);

const TocPanel = ({
  display, tree, courseStructure, searching, selectedId, setSelectedId, onCreateFirst,
  onAddUnit, onAddChapter, onAddSession, onRemoveUnit, onRemoveChapter, activityTypes = [],
}) => {
  const [collapsed, setCollapsed] = useState({});
  const hasUnits = courseStructure?.unit === true;
  const hasChapters = courseStructure?.chapter === true;
  const empty = tree.length === 0;

  // While searching, everything stays open so matches are never hidden.
  const isCollapsed = (key) => !searching && Boolean(collapsed[key]);
  const toggleCollapsed = (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  const allKeys = tree.flatMap((u) => [u.key, ...u.chapters.map((c) => `${u.key}::${c.key}`)]);
  const allCollapsed = allKeys.length > 0 && allKeys.every((k) => collapsed[k]);
  const toggleAll = () =>
    setCollapsed(allCollapsed ? {} : Object.fromEntries(allKeys.map((k) => [k, true])));
  const topAddLabel = hasUnits ? "+ Unit" : hasChapters ? "+ Chapter" : null;

  const handleTopAdd = () => {
    if (hasUnits) {
      onAddUnit();
    } else {
      onAddChapter(tree.find((u) => u.key === "|") || { key: "|", number: "", name: "", chapters: [], sessions: [] });
    }
  };

  const emptyText = searching
    ? "No sessions match your search."
    : hasUnits
      ? "No units yet. Start by adding your first unit."
      : hasChapters
        ? "No chapters yet. Start by adding your first chapter."
        : "No sessions yet.";

  const emptyButton = hasUnits ? "Add first unit" : hasChapters ? "Add first chapter" : "Create first plan";
  const emptyAction = hasUnits || hasChapters ? handleTopAdd : onCreateFirst;

  const mutedNote = { fontSize: 12, color: T.mute, fontStyle: "italic", padding: "4px 8px" };

  return (
    <div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ ...display, fontSize: 15, fontWeight: 700 }}>Syllabus</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!empty && !searching && allKeys.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              style={{ height: 30, padding: "0 12px", borderRadius: 999, border: `1px solid ${T.line}`, background: "#fff", color: T.ink, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {allCollapsed ? "Expand all" : "Collapse all"}
            </button>
          )}
          {topAddLabel && (
            <button
              type="button"
              onClick={handleTopAdd}
              style={{ height: 30, padding: "0 12px", borderRadius: 999, border: "none", background: T.coralTint, color: T.coral, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              {topAddLabel}
            </button>
          )}
        </div>
      </div>

      {empty ? (
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📘</div>
          <div style={{ fontSize: 13, color: T.mute, marginBottom: 14 }}>{emptyText}</div>
          {!searching && (
            <button
              onClick={emptyAction}
              style={{ border: "none", background: T.coral, color: "#fff", borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {emptyButton}
            </button>
          )}
        </div>
      ) : (
        <div>
          {tree.map((unit) => {
            const isVirtual = unit.key === "|";
            const unitEmpty = unit.sessions.length === 0 && unit.chapters.length === 0;
            return (
              <div key={unit.key} style={{ marginBottom: 8 }}>
                {!isVirtual ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0 4px", borderTop: `1px solid ${T.line}`, paddingTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => toggleCollapsed(unit.key)}
                      style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: T.ink }}
                    >
                      <Chevron open={!isCollapsed(unit.key)} />
                      <span>{unitLabel(unit)}</span>
                      {isCollapsed(unit.key) && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: T.mute }}>
                          ({countSessions(unit)} session{countSessions(unit) === 1 ? "" : "s"})
                        </span>
                      )}
                    </button>
                    {/* Unit collapse / expand button */}
                    <CollapseBtn
                      open={!isCollapsed(unit.key)}
                      disabled={searching}
                      title={isCollapsed(unit.key) ? "Expand unit" : "Collapse unit"}
                      onClick={() => toggleCollapsed(unit.key)}
                    />
                    {unitEmpty && !searching && (
                      <RowAction danger title="Remove unit" onClick={() => onRemoveUnit(unit.key)}>×</RowAction>
                    )}
                    {!searching && (
                      <RowAction
                        title={hasChapters ? "Add chapter" : "Add session"}
                        label={hasChapters ? "Add chapter" : "Add session"}
                        onClick={() => (hasChapters ? onAddChapter(unit) : onAddSession(unit, null))}
                      >
                        +
                      </RowAction>
                    )}
                  </div>
                ) : (
                  hasUnits && unit.sessions.length > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.mute, textTransform: "uppercase", letterSpacing: 0.3, margin: "6px 0" }}>
                      Sessions without unit
                    </div>
                  )
                )}

                {!isCollapsed(unit.key) && unit.sessions.length > 0 && (
                  <div style={{ paddingLeft: isVirtual ? 0 : 10 }}>
                    {unit.sessions.map((s) => (
                      <SessionRow key={s.id} s={s} selectedId={selectedId} setSelectedId={setSelectedId} activityTypes={activityTypes} />
                    ))}
                  </div>
                )}

                {!isCollapsed(unit.key) && unit.chapters.map((chapter) => {
                  const chapterKey = `${unit.key}::${chapter.key}`;
                  return (
                    <div key={chapter.key} style={{ paddingLeft: isVirtual ? 0 : 10, marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0" }}>
                        <button
                          type="button"
                          onClick={() => toggleCollapsed(chapterKey)}
                          style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: T.mute }}
                        >
                          <Chevron open={!isCollapsed(chapterKey)} />
                          <span>{chapterLabel(chapter)}</span>
                          {isCollapsed(chapterKey) && (
                            <span style={{ fontSize: 11, fontWeight: 600 }}>
                              ({chapter.sessions.length} session{chapter.sessions.length === 1 ? "" : "s"})
                            </span>
                          )}
                        </button>
                        {/* Chapter collapse / expand button */}
                        <CollapseBtn
                          open={!isCollapsed(chapterKey)}
                          disabled={searching}
                          title={isCollapsed(chapterKey) ? "Expand chapter" : "Collapse chapter"}
                          onClick={() => toggleCollapsed(chapterKey)}
                        />
                        {chapter.sessions.length === 0 && !searching && (
                          <RowAction danger title="Remove chapter" onClick={() => onRemoveChapter(unit.key, chapter.key)}>×</RowAction>
                        )}
                        {!searching && (
                          <RowAction title="Add session" label="Add session" onClick={() => onAddSession(unit, chapter)}>+</RowAction>
                        )}
                      </div>
                      <div style={{ paddingLeft: 6, display: isCollapsed(chapterKey) ? "none" : "block" }}>
                        {chapter.sessions.length === 0 ? (
                          <div style={mutedNote}>No sessions yet. Use Add session to add one.</div>
                        ) : (
                          chapter.sessions.map((s) => (
                            <SessionRow key={s.id} s={s} selectedId={selectedId} setSelectedId={setSelectedId} activityTypes={activityTypes} />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}

                {!isCollapsed(unit.key) && !isVirtual && unitEmpty && (
                  <div style={{ ...mutedNote, paddingLeft: 10 }}>
                    {hasChapters ? "No chapters yet. Use Add chapter to add one." : "No sessions yet. Use Add session to add one."}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ReferSessionModal = ({ session, courseId, preferredBatchId = "", saving, onClose, onConfirm }) => {
  const [trainerId, setTrainerId] = useState(session.fieldTrainerId || "");
  const [batchId, setBatchId] = useState(preferredBatchId || session.batch || "");
  const [trainers, setTrainers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const chosen = trainers.find((item) => item.id === trainerId);
  const batch = batches.find((item) => item.id === batchId);
  const batchLocked = Boolean(preferredBatchId);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const token = getAuthToken();
      if (!token || !batchId) {
        setTrainers([]);
        setTrainerId("");
        return;
      }
      setLoading(true);
      try {
        const rows = await fetchBatchFieldTrainersApi(token, batchId);
        if (cancelled) return;
        setTrainers(rows);
        setTrainerId((current) => {
          if (rows.some((item) => item.id === current)) return current;
          if (rows.some((item) => item.id === session.fieldTrainerId)) return session.fieldTrainerId;
          return "";
        });
      } catch (err) {
        console.error("Failed to load batch trainers", err);
        if (!cancelled) {
          setTrainers([]);
          setTrainerId("");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [batchId, session.fieldTrainerId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const token = getAuthToken();
      if (!token || !courseId) return;
      setBatchesLoading(true);
      try {
        const rows = await fetchCourseBatchesApi(token, courseId);
        if (cancelled) return;
        setBatches(rows);
        setBatchId((current) => {
          const preferred = preferredBatchId && rows.some((item) => item.id === String(preferredBatchId))
            ? String(preferredBatchId)
            : "";
          if (preferred) return preferred;
          if (rows.some((item) => item.id === current)) return current;
          return session.batch && rows.some((item) => item.id === session.batch) ? session.batch : "";
        });
      } catch (err) {
        console.error("Failed to load batches", err);
        if (!cancelled) setBatches([]);
      } finally {
        if (!cancelled) setBatchesLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [courseId, session.batch, preferredBatchId]);

  return (
    <ModalShell onClose={onClose} width={480}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, textTransform: "uppercase" }}>Assign session</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginTop: 4 }}>
          {session.number ? `Session ${session.number}` : "Session"} · {session.name || "Untitled session"}
        </div>
        {(session.unit || session.chapter) && (
          <div style={{ fontSize: 12, color: T.mute, marginTop: 4 }}>
            {[session.unit, session.chapter].filter(Boolean).join("  ›  ")}
          </div>
        )}
      </div>
      <div className="ac-scroll" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, overflow: "auto", flex: 1, minHeight: 0 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: T.mute }}>
          Batch
          <select
            className="ac-input"
            value={batchId}
            disabled={batchesLoading || batchLocked}
            onChange={(e) => { if (!batchLocked) setBatchId(e.target.value); }}
            style={batchLocked ? { background: T.page, color: T.ink, cursor: "not-allowed", opacity: 1 } : undefined}
          >
            <option value="">{batchesLoading ? "Loading batches..." : "Select batch"}</option>
            {batches.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          {batchLocked && (
            <span style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>
              Locked to the batch you referred from.
            </span>
          )}
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: T.mute }}>
          Trainer
          <select
            className="ac-input"
            value={trainerId}
            disabled={loading}
            onChange={(e) => setTrainerId(e.target.value)}
          >
            <option value="">{loading ? "Loading trainers..." : "Select trainer"}</option>
            {trainers.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        {batch && !loading && trainers.length === 0 && (
          <div style={{ background: T.amberTint, borderRadius: 12, padding: "10px 12px", fontSize: 13, color: T.amber }}>
            No trainer is assigned on this batch yet. Assign a trainer on the batch first.
          </div>
        )}
        <div style={{ background: T.page, borderRadius: 12, padding: "10px 12px", fontSize: 13, color: T.ink }}>
          {chosen && batch
            ? <>Assigning <strong>{session.name || "this session"}</strong> of batch <strong>{batch.name}</strong> to trainer <strong>{chosen.name}</strong>.</>
            : batchLocked
              ? "This batch is fixed. Choose the trainer already assigned on it."
              : "Choose the batch, then the trainer already assigned on that batch."}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, padding: 16, borderTop: `1px solid ${T.line}`, flexShrink: 0 }}>
        <button type="button" onClick={onClose} disabled={saving} style={{ flex: 1, height: 40, borderRadius: 12, border: `1px solid ${T.line}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>
          Cancel
        </button>
        <button
          type="button"
          disabled={saving || !chosen || !batch}
          onClick={() => onConfirm(chosen, batch)}
          style={{ flex: 1, height: 40, borderRadius: 12, border: "none", background: chosen && batch ? T.coral : T.page, color: chosen && batch ? "#fff" : T.mute, fontWeight: 700, cursor: chosen && batch ? "pointer" : "not-allowed" }}
        >
          {saving ? "Assigning..." : "Assign session"}
        </button>
      </div>
    </ModalShell>
  );
};

const DetailPanel = ({ display, session, onEdit, onDelete, onRefer, onSetActivity, onAddTot, onAddTlm, activityTypes }) => {
  if (!session) {
    return (
      <div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, padding: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 260, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>📖</div>
        <div style={{ fontSize: 13, color: T.mute }}>Pick a session from the syllabus to see its plan.</div>
      </div>
    );
  }

  const colors = (session.activityIds || []).map((id) => (activityTypes || []).find((a) => a.id === id)?.color || T.mute);
  const gradient = colors.length > 1 ? `linear-gradient(90deg, ${colors.join(",")})` : colors[0];
  const isAssigned = session.status === "Assigned" || session.status === "In Progress" || session.status === "Completed";
  const eligibilityTotal = sumTotMarks(session.totQuestions);
  const eligibilityPassPercent = toPassPercentage(session.totPassPercentage, TOT_PASS_PERCENT_DEFAULT);
  const eligibilityPass = eligibilityTotal > 0 ? Math.ceil((eligibilityTotal * eligibilityPassPercent) / 100) : 0;
  const studentCount = namedItems(session.studentMaterial).length;
  const standardCount = namedItems(session.standardTlm).length;
  const trainerCount = namedItems(session.trainerTlm).length;
  const hasTlm = studentCount + standardCount + trainerCount > 0;
  const sessionActivities = (session.activityIds || [])
    .map((id) => (activityTypes || []).find((a) => a.id === id))
    .filter(Boolean);

  return (
    <div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 56, background: gradient }} />
      <div style={{ padding: "0 20px", marginTop: -22 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ ...display, fontSize: 18, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
            {session.name}
          </div>
        </div>
      </div>
      <div style={{ padding: "14px 20px 0" }}>
        <StatusPill status={session.status} />
      </div>

      <div style={{ padding: "14px 20px", flex: 1, overflow: "auto" }} className="ac-scroll">
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { label: session.duration, },
            { label: session.method },
            { label: session.tot ? "TOT included" : "No TOT" },
          ].map((c, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 600, color: T.ink, background: T.page, padding: "6px 12px", borderRadius: 999 }}>
              {c.label}
            </span>
          ))}
        </div>

        {(session.unit || session.chapter) && (
          <div style={{ fontSize: 12, color: T.mute, marginBottom: 14 }}>
            {[session.unit, session.chapter, `Session ${session.number}`].filter(Boolean).join("  ›  ")}
          </div>
        )}

        {(session.subTopics || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mute, marginBottom: 6, textTransform: "uppercase" }}>Sub topics</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(session.subTopics || []).map((t) => (
                <span key={t} style={{ fontSize: 12, background: T.page, borderRadius: 999, padding: "5px 10px" }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Activity type of this session */}
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.mute, textTransform: "uppercase" }}>Activity type</div>
              {sessionActivities.length === 0 ? (
                <div style={{ fontSize: 13, fontWeight: 600, color: T.mute, marginTop: 2 }}>Not set yet</div>
              ) : (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {sessionActivities.map((a) => (
                    <span key={a.id} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: a.color + "22", color: a.color, border: `1px solid ${a.color}55` }}>
                      {a.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onSetActivity}
              style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 999, border: "none", background: T.coralTint, color: T.coral, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              {sessionActivities.length > 0 ? "Change" : "+ Set activity"}
            </button>
          </div>
        </div>

        {/* TOT */}
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.mute, textTransform: "uppercase" }}>TOT</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: session.tot ? "#065f46" : T.mute, marginTop: 2 }}>
                {!session.tot
                  ? "Not added yet"
                  : (session.totQuestions || []).length > 0
                    ? `${session.totQuestions.length} question${session.totQuestions.length === 1 ? "" : "s"} · ${eligibilityTotal} mark${eligibilityTotal === 1 ? "" : "s"} · pass ${eligibilityPass} (${eligibilityPassPercent}%)`
                    : "Added, no MCQ yet"}
              </div>
            </div>
            <button
              type="button"
              onClick={onAddTot}
              style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 999, border: "none", background: T.coralTint, color: T.coral, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              {session.tot ? "Edit TOT" : "+ Add TOT"}
            </button>
          </div>
        </div>

        {/* Step 3: TLM */}
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 12px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.mute, textTransform: "uppercase" }}>TLM</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: hasTlm ? T.ink : T.mute, marginTop: 2 }}>
                {hasTlm
                  ? `Student material ${studentCount} · Standard TLM ${standardCount} · Trainer TLM ${trainerCount}`
                  : "Not added yet"}
              </div>
            </div>
            <button
              type="button"
              onClick={onAddTlm}
              style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 999, border: "none", background: T.coralTint, color: T.coral, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              {hasTlm ? "Edit TLM" : "+ Add TLM"}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 16, border: `1px solid ${T.line}`, borderRadius: 12, overflow: "hidden" }}>
                   <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { role: "Batch", name: session.batchCode, empty: "Not selected" },
              { role: "Field trainer", name: session.fieldTrainer, empty: "Not referred yet" },
              { role: "Senior trainer", name: session.seniorTrainer, empty: "Not referred yet" },
              ...(session.tot ? [{ role: "TOT trainer", name: session.totTrainer, empty: "Not referred yet" }] : []),
            ].map((row) => (
              <div key={row.role} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
                <span style={{ color: T.mute }}>{row.role}</span>
                <strong style={{ color: row.name ? T.ink : T.amber, textAlign: "right" }}>
                  {row.name || row.empty}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {session.notes && (
          <div style={{ borderLeft: `3px solid ${T.coral}`, paddingLeft: 12, fontSize: 13, color: T.mute, fontStyle: "italic" }}>
            {session.notes}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, padding: 16, borderTop: `1px solid ${T.line}` }}>
        <button
          disabled={isAssigned}
          onClick={onEdit}
          style={{ flex: 1, height: 40, borderRadius: 12, border: `1px solid ${T.line}`, background: isAssigned ? T.page : "#fff", color: isAssigned ? T.mute : T.ink, fontSize: 13, fontWeight: 600, cursor: isAssigned ? "not-allowed" : "pointer" }}
        >
          Edit
        </button>
        <button
              type="button"
              onClick={onRefer}
              style={{ flexShrink: 0, height: 34, padding: "0 12px", borderRadius: 10, border: "none", background: T.coral, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              Assign
            </button>
        <button
          disabled={isAssigned}
          onClick={onDelete}
          style={{ flex: 1, height: 40, borderRadius: 12, border: `1px solid ${T.line}`, background: isAssigned ? T.page : "#fff", color: isAssigned ? T.mute : "#b91c1c", fontSize: 13, fontWeight: 600, cursor: isAssigned ? "not-allowed" : "pointer" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------
   Modal shell — viewport overlay (portaled so layout overflow cannot clip it)
---------------------------------------------------------------- */
const ModalShell = ({ children, onClose, width = 560 }) => {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10050,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(15, 23, 42, 0.28)",
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

/* ---------------------------------------------------------------
   Add unit / chapter modal
---------------------------------------------------------------- */
const OutlineModal = ({ kind, parentLabel, suggestedNumber, onClose, onSave }) => {
  const isUnit = kind === "unit";
  const [number, setNumber] = useState(suggestedNumber || "");
  const [name, setName] = useState("");
  const canSave = name.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    onSave({ number: String(number || "").trim(), name: name.trim() });
  };

  const onEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <ModalShell onClose={onClose} width={420}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, textTransform: "uppercase" }}>
          {isUnit ? "New unit" : "New chapter"}
        </div>
        {!isUnit && parentLabel && (
          <div style={{ fontSize: 13, color: T.mute, marginTop: 4 }}>in {parentLabel}</div>
        )}
      </div>
      <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>{isUnit ? "Unit number" : "Chapter number"}</label>
          <input className="ac-input" placeholder="1" value={number} onChange={(e) => setNumber(e.target.value)} onKeyDown={onEnter} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>{isUnit ? "Unit name *" : "Chapter name *"}</label>
          <input
            className="ac-input"
            autoFocus
            placeholder={isUnit ? "Foundation Skills" : "Introduction to Retail"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onEnter}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, padding: 16, borderTop: `1px solid ${T.line}`, flexShrink: 0 }}>
        <button type="button" onClick={onClose} style={{ flex: 1, height: 40, borderRadius: 12, border: `1px solid ${T.line}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={submit}
          style={{ flex: 1, height: 40, borderRadius: 12, border: "none", background: canSave ? T.coral : T.page, color: canSave ? "#fff" : T.mute, fontWeight: 700, cursor: canSave ? "pointer" : "not-allowed" }}
        >
          {isUnit ? "Add unit" : "Add chapter"}
        </button>
      </div>
    </ModalShell>
  );
};

/* ---------------------------------------------------------------
   Create / Edit modal (§5.9) — 4-step stepper
---------------------------------------------------------------- */
const CREATE_STEPS = ["Place in the course", "Session"];

/* ---------------------------------------------------------------
   Activity type for one session
---------------------------------------------------------------- */
const SessionActivityModal = ({ display, session, activityTypes = [], saving, onClose, onSave, onManage }) => {
  const [selectedActivityIds, setSelectedActivityIds] = useState(session?.activityIds || []);
  const toggleActivity = (id) => {
    setSelectedActivityIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = () => {
    if (saving) return;
    const selectedTypes = (activityTypes || []).filter((a) => selectedActivityIds.includes(a.id));
    onSave({ sessionActivities: selectedTypes.map((a) => ({ id: a.id, name: a.name, color: a.color })) });
  };

  return (
    <ModalShell onClose={onClose} width={520}>
      <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ ...display, fontSize: 18, fontWeight: 700 }}>
            {(session?.activityIds || []).length > 0 ? "Change activity type" : "Set activity type"}
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", color: T.mute, fontSize: 18 }}>×</span>
        </div>
        <div style={{ fontSize: 12, color: T.mute, marginTop: 4 }}>
          {session?.number ? `Session ${session.number} · ` : ""}{session?.name || "Untitled session"}
        </div>
      </div>

      <div style={{ padding: "16px 22px 20px", overflow: "auto", flex: 1 }} className="ac-scroll">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Activity types for this session</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {(activityTypes || []).length === 0 ? (
                  <span style={{ fontSize: 12, color: T.mute }}>No activities on this course yet. Add them from Activity types. Sessions can still be created without one.</span>
                ) : (activityTypes || []).map((a) => {
                  const on = selectedActivityIds.includes(a.id);
                  return (
                    <span
                      key={a.id}
                      onClick={() => toggleActivity(a.id)}
                      style={{
                        fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 999, cursor: "pointer",
                        background: on ? a.color : a.color + "22",
                        color: on ? "#fff" : a.color,
                        border: `1.5px solid ${on ? a.color : a.color + "55"}`,
                      }}
                    >
                      {a.name}
                    </span>
                  );
                })}
              </div>
            </div>
        <button
          type="button"
          onClick={onManage}
          style={{ marginTop: 14, border: "none", background: "transparent", color: T.coral, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
        >
          Manage activity types
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, padding: 16, borderTop: `1px solid ${T.line}`, flexShrink: 0 }}>
        <button type="button" onClick={onClose} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          style={{ height: 40, padding: "0 20px", borderRadius: 12, border: "none", background: T.coral, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1 }}
        >
          {saving ? "Saving..." : "Save activity"}
        </button>
      </div>
    </ModalShell>
  );
};

const TotModal = ({ display, session, onClose, onSave, saving }) => {
  const [includeTot, setIncludeTot] = useState(true);
  const [totUseSameTopic, setTotUseSameTopic] = useState(session?.totUseSameTopic !== false);
  const [totTopic, setTotTopic] = useState(session?.totTopic || "");
  const [totMethod, setTotMethod] = useState(session?.totMethod || "");
  const [totPassPercentage, setTotPassPercentage] = useState(
    toPassPercentage(session?.totPassPercentage, TOT_PASS_PERCENT_DEFAULT)
  );
  const [totCompletionProofs, setTotCompletionProofs] = useState(session?.totCompletionProofs || []);

  const createTotQuestion = () => ({
    id: `totq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    marks: 1,
  });

  const [totQuestions, setTotQuestions] = useState(
    session?.totQuestions && session.totQuestions.length
      ? session.totQuestions.map((q) => ({ ...q, marks: toPositiveMarks(q.marks, 1) }))
      : []
  );

  const updateTotQuestion = (index, field, value) => {
    setTotQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const updateTotOption = (questionIndex, optionIndex, value) => {
    setTotQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== questionIndex) return q;
        const options = [...q.options];
        options[optionIndex] = value;
        return { ...q, options };
      })
    );
  };

  const addTotQuestion = () => {
    setTotQuestions((prev) => [...prev, createTotQuestion()]);
  };

  const removeTotQuestion = (questionIndex) => {
    setTotQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== questionIndex)));
  };

  const replaceAllQuestions = () => {
    setTotQuestions([createTotQuestion()]);
  };

  const handleTotMarksChange = (questionIndex, raw) => {
    if (raw === "") {
      updateTotQuestion(questionIndex, "marks", "");
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;
    updateTotQuestion(questionIndex, "marks", Math.min(TOT_MARKS_MAX, Math.max(1, parsed)));
  };

  const bumpTotMarks = (questionIndex, delta) => {
    setTotQuestions((prev) => prev.map((q, i) => (
      i === questionIndex
        ? { ...q, marks: Math.min(TOT_MARKS_MAX, Math.max(1, toPositiveMarks(q.marks, 1) + delta)) }
        : q
    )));
  };

  const totMarksTotal = sumTotMarks(totQuestions);
  const totPassPercentValue = toPassPercentage(totPassPercentage, 0);
  const totPassMarks = totMarksTotal > 0 && totPassPercentValue > 0
    ? Math.ceil((totMarksTotal * totPassPercentValue) / 100)
    : 0;

  const handleTotPassPercentageChange = (raw) => {
    if (raw === "") {
      setTotPassPercentage("");
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;
    setTotPassPercentage(Math.min(100, Math.max(1, parsed)));
  };

  const bumpTotPassPercentage = (delta) => {
    setTotPassPercentage((prev) => Math.min(100, Math.max(1, toPassPercentage(prev, TOT_PASS_PERCENT_DEFAULT) + delta)));
  };

  const handleSave = () => {
    if (saving) return;
    onSave({
      includeTot,
      totUseSameTopics: includeTot ? totUseSameTopic : false,
      totTopicCovered: includeTot && !totUseSameTopic ? totTopic.trim() : "",
      totTrainingMethod: includeTot ? totMethod.trim() : "",
      totCompletionProofs: includeTot ? namedItems(totCompletionProofs) : [],
      totQuestionBank: includeTot
        ? totQuestions
            .filter((q) => q.question?.trim())
            .map((q) => ({
              question: q.question.trim(),
              options: q.options || [],
              correctIndex: q.correctIndex || 0,
              marks: toPositiveMarks(q.marks, 1),
            }))
        : [],
      totPassPercentage: includeTot ? toPassPercentage(totPassPercentage, TOT_PASS_PERCENT_DEFAULT) : undefined,
    });
  };

  return (
    <ModalShell onClose={onClose} width={640}>
      <style>{`
        .ac-marks-input { -moz-appearance: textfield; appearance: textfield; }
        .ac-marks-input::-webkit-outer-spin-button,
        .ac-marks-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
      <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ ...display, fontSize: 18, fontWeight: 700 }}>{session?.tot ? "Edit TOT" : "Add TOT"}</div>
          <span onClick={onClose} style={{ cursor: "pointer", color: T.mute, fontSize: 18 }}>×</span>
        </div>
        <div style={{ fontSize: 12, color: T.mute, marginTop: 4 }}>
          {session?.number ? `Session ${session.number} · ` : ""}{session?.name || "Untitled session"}
        </div>
      </div>

      <div style={{ padding: "16px 22px 20px", overflow: "auto", flex: 1 }} className="ac-scroll">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              onClick={() => setIncludeTot((v) => !v)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.mintTint, borderRadius: 14, padding: 14, cursor: "pointer" }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#065f46" }}>Also plan TOT for trainers</div>
              </div>
              <div style={{ width: 40, height: 22, borderRadius: 999, background: includeTot ? T.mint : "#cbd5e1", position: "relative", flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: 999, background: "#fff", position: "absolute", top: 2, left: includeTot ? 20 : 2, transition: "left 120ms" }} />
              </div>
            </div>
            {includeTot && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#f8fafc", borderRadius: 12, border: `1px solid ${T.line}` }}>
                  <input
                    type="checkbox"
                    checked={totUseSameTopic}
                    onChange={() => setTotUseSameTopic((v) => !v)}
                    style={{ accentColor: T.mint }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>Use same topic as student session</span>
                </div>

                {!totUseSameTopic && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>TOT topic</label>
                    <input className="ac-input" value={totTopic} onChange={(e) => setTotTopic(e.target.value)} placeholder="Same as student topic, or specify" />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>TOT method</label>
                  <input className="ac-input" value={totMethod} onChange={(e) => setTotMethod(e.target.value)} placeholder="Demonstration + practice" />
                </div>

                {totCompletionProofs.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => addListItem(setTotCompletionProofs, "PDF")}
                    style={{ width: "100%", textAlign: "left", border: `1px dashed ${T.line}`, borderRadius: 12, padding: "10px 14px", fontSize: 13, color: T.mute, cursor: "pointer", background: "#fff" }}
                  >
                    + Add completion proof
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {totCompletionProofs.map((item, index) => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          className="ac-input"
                          value={item.name}
                          onChange={(e) => updateListItem(setTotCompletionProofs, index, "name", e.target.value)}
                          placeholder="Enter proof name"
                          style={{ flex: 1 }}
                        />
                        <select
                          value={item.type}
                          onChange={(e) => updateListItem(setTotCompletionProofs, index, "type", e.target.value)}
                          style={{ minWidth: 120, border: `1px solid ${T.line}`, borderRadius: 10, padding: "9px 10px", fontSize: 13, fontWeight: 600, background: "#fff", color: T.ink }}
                        >
                          {MATERIAL_TYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeListItem(setTotCompletionProofs, index)}
                          style={{ border: "none", background: "transparent", color: T.coral, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addListItem(setTotCompletionProofs, "PDF")}
                      style={{ width: "100%", textAlign: "left", border: `1px dashed ${T.line}`, borderRadius: 12, padding: "10px 14px", fontSize: 13, color: T.mute, cursor: "pointer", background: "#fff" }}
                    >
                      + Add completion proof
                    </button>
                  </div>
                )}

                <div style={{ marginTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.mute }}>Trainer eligibility MCQ</div>
                      <div style={{ fontSize: 11, color: T.mute, marginTop: 3, lineHeight: 1.45 }}>
                        Set marks on each question and the pass percentage. Trainer must score this % or more to pass.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={replaceAllQuestions}
                      style={{ border: `1px solid ${T.line}`, background: "#fff", color: T.ink, fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "6px 10px", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Replace all questions
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.mute }}>Pass %</span>
                      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${T.line}`, borderRadius: 10, overflow: "hidden", background: "#fff" }}>
                        <button
                          type="button"
                          onClick={() => bumpTotPassPercentage(-1)}
                          aria-label="Decrease passing percentage"
                          style={{ width: 28, height: 32, border: "none", background: T.page, color: T.ink, fontWeight: 700, cursor: "pointer" }}
                        >
                          −
                        </button>
                        <input
                          className="ac-marks-input"
                          type="number"
                          min={1}
                          max={100}
                          value={totPassPercentage === "" ? "" : toPassPercentage(totPassPercentage, TOT_PASS_PERCENT_DEFAULT)}
                          onChange={(e) => handleTotPassPercentageChange(e.target.value)}
                          style={{ width: 44, height: 32, border: "none", textAlign: "center", fontWeight: 700, fontSize: 13, outline: "none", color: T.ink }}
                        />
                        <button
                          type="button"
                          onClick={() => bumpTotPassPercentage(1)}
                          aria-label="Increase passing percentage"
                          style={{ width: 28, height: 32, border: "none", background: T.page, color: T.ink, fontWeight: 700, cursor: "pointer" }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: T.page, color: T.ink, borderRadius: 999, padding: "5px 10px" }}>
                      {totQuestions.length} question{totQuestions.length === 1 ? "" : "s"}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, background: T.mintTint, color: T.mint, borderRadius: 999, padding: "5px 10px" }}>
                      Total {totMarksTotal} mark{totMarksTotal === 1 ? "" : "s"}
                    </span>
                    {totMarksTotal > 0 && totPassPercentValue > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, background: T.amberTint, color: "#92400e", borderRadius: 999, padding: "5px 10px" }}>
                        Pass {totPassMarks}+ ({totPassPercentValue}%)
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {totQuestions.length === 0 && (
                    <div style={{ border: `1px dashed ${T.line}`, borderRadius: 12, padding: "14px 12px", background: "#f8fafc", color: T.mute, fontSize: 12, fontWeight: 600 }}>
                      No eligibility questions yet. Add an MCQ and assign marks.
                    </div>
                  )}
                  {totQuestions.map((question, questionIndex) => (
                    <div key={question.id} style={{ border: `1px solid ${T.line}`, borderRadius: 12, padding: 12, background: "#fff" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Q{questionIndex + 1}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: T.mute }}>Marks</span>
                            <div style={{ display: "flex", alignItems: "center", border: `1px solid ${T.line}`, borderRadius: 10, overflow: "hidden", background: "#fff" }}>
                              <button
                                type="button"
                                onClick={() => bumpTotMarks(questionIndex, -1)}
                                aria-label={`Decrease marks for question ${questionIndex + 1}`}
                                style={{ width: 28, height: 32, border: "none", background: T.page, color: T.ink, fontWeight: 700, cursor: "pointer" }}
                              >
                                −
                              </button>
                              <input
                                className="ac-marks-input"
                                type="number"
                                min={1}
                                max={TOT_MARKS_MAX}
                                value={question.marks === "" ? "" : toPositiveMarks(question.marks, 1)}
                                onChange={(e) => handleTotMarksChange(questionIndex, e.target.value)}
                                style={{ width: 44, height: 32, border: "none", textAlign: "center", fontWeight: 700, fontSize: 13, outline: "none", color: T.ink }}
                              />
                              <button
                                type="button"
                                onClick={() => bumpTotMarks(questionIndex, 1)}
                                aria-label={`Increase marks for question ${questionIndex + 1}`}
                                style={{ width: 28, height: 32, border: "none", background: T.page, color: T.ink, fontWeight: 700, cursor: "pointer" }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          {totQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTotQuestion(questionIndex)}
                              style={{ border: "none", background: "transparent", color: T.coral, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <input
                        className="ac-input"
                        value={question.question}
                        onChange={(e) => updateTotQuestion(questionIndex, "question", e.target.value)}
                        placeholder="Type the question"
                        style={{ marginBottom: 8 }}
                      />

                      {question.options.map((option, optionIndex) => (
                        <div key={`${question.id}-option-${optionIndex}`} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <input
                            type="radio"
                            name={`tot-correct-${question.id}`}
                            checked={question.correctIndex === optionIndex}
                            onChange={() => updateTotQuestion(questionIndex, "correctIndex", optionIndex)}
                            style={{ accentColor: T.mint }}
                          />
                          <input
                            className="ac-input"
                            value={option}
                            onChange={(e) => updateTotOption(questionIndex, optionIndex, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addTotQuestion}
                  style={{ border: `1px dashed ${T.line}`, background: "#f8fafc", color: T.ink, fontSize: 13, fontWeight: 600, borderRadius: 12, padding: "10px 12px", cursor: "pointer" }}
                >
                  + Add MCQ question
                </button>
              </>
            )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: 16, borderTop: `1px solid ${T.line}`, flexShrink: 0 }}>
        <button type="button" onClick={onClose} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          style={{ height: 40, padding: "0 20px", borderRadius: 12, border: "none", background: T.coral, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1 }}
        >
          {saving ? "Saving..." : "Save TOT"}
        </button>
      </div>
    </ModalShell>
  );
};

const TlmModal = ({ display, session, onClose, onSave, saving }) => {
  const [studentMaterial, setStudentMaterial] = useState(session?.studentMaterial || []);
  const [standardTlm, setStandardTlm] = useState(session?.standardTlm || []);
  const [trainerTlm, setTrainerTlm] = useState(session?.trainerTlm || []);

  const handleSave = () => {
    if (saving) return;
    onSave({
      learningMaterials: namedItems(studentMaterial),
      standardTlm: namedItems(standardTlm),
      trainerBasedTlm: namedItems(trainerTlm),
    });
  };

  return (
    <ModalShell onClose={onClose} width={640}>
      <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ ...display, fontSize: 18, fontWeight: 700 }}>
            {namedItems(session?.studentMaterial).length + namedItems(session?.standardTlm).length + namedItems(session?.trainerTlm).length > 0 ? "Edit TLM" : "Add TLM"}
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", color: T.mute, fontSize: 18 }}>×</span>
        </div>
        <div style={{ fontSize: 12, color: T.mute, marginTop: 4 }}>
          {session?.number ? `Session ${session.number} · ` : ""}{session?.name || "Untitled session"}
        </div>
      </div>

      <div style={{ padding: "16px 22px 20px", overflow: "auto", flex: 1 }} className="ac-scroll">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Student learning material", items: studentMaterial, setter: setStudentMaterial, type: "PDF" },
            { label: "Senior Trainer (Standard TLM)", items: standardTlm, setter: setStandardTlm, type: "PDF" },
            { label: "Flexible (Trainer-based TLM)", items: trainerTlm, setter: setTrainerTlm, type: "PDF" },
          ].map(({ label, items, setter, type }) => (
              <div key={label} style={{ border: `1px dashed ${T.line}`, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.mute, marginBottom: 8 }}>{label}</div>

                {items.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => addListItem(setter, type)}
                    style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", color: T.mute, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "4px 0" }}
                  >
                    + Add item
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((item, index) => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          className="ac-input"
                          value={item.name}
                          onChange={(e) => updateListItem(setter, index, "name", e.target.value)}
                          placeholder="Enter item name"
                          style={{ flex: 1 }}
                        />
                        <select
                          value={item.type}
                          onChange={(e) => updateListItem(setter, index, "type", e.target.value)}
                          style={{ minWidth: 120, border: `1px solid ${T.line}`, borderRadius: 10, padding: "9px 10px", fontSize: 13, fontWeight: 600, background: "#fff", color: T.ink }}
                        >
                          {MATERIAL_TYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeListItem(setter, index)}
                          style={{ border: "none", background: "transparent", color: T.coral, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addListItem(setter, type)}
                      style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", color: T.mute, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "4px 0" }}
                    >
                      + Add item
                    </button>
                  </div>
                )}
              </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: 16, borderTop: `1px solid ${T.line}`, flexShrink: 0 }}>
        <button type="button" onClick={onClose} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          style={{ height: 40, padding: "0 20px", borderRadius: 12, border: "none", background: T.coral, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1 }}
        >
          {saving ? "Saving..." : "Save TLM"}
        </button>
      </div>
    </ModalShell>
  );
};

const CreateModal = ({ display, step, setStep, onClose, onSave, saving, editing, activityTypes, courseStructure, preset }) => {
  const showUnit = courseStructure?.unit === true;
  const showChapter = courseStructure?.chapter === true;
  const planningPath = courseStructure?.pathLabel || "Session";
  const [name, setName] = useState(editing?.name || "");
  const [sessionNumber, setSessionNumber] = useState(editing?.number || preset?.sessionNumber || "");
  const [hours, setHours] = useState(editing?.hours || "");
  const [method, setMethod] = useState(editing?.method || "");
  const [resources, setResources] = useState(editing?.resources || "");
  const [unitNumber, setUnitNumber] = useState(editing?.unitNumber || preset?.unitNumber || "");
  const [unitName, setUnitName] = useState(editing?.unitName || preset?.unitName || "");
  const [chapterNumber, setChapterNumber] = useState(editing?.chapterNumber || preset?.chapterNumber || "");
  const [chapterName, setChapterName] = useState(editing?.chapterName || preset?.chapterName || "");
  const [subTopicsStr, setSubTopicsStr] = useState((editing?.subTopics || []).join(", "));
  const [notes, setNotes] = useState(editing?.notes || "");
  const [agendaBlocks, setAgendaBlocks] = useState(editing?.agendaBlocks || []);

  const createAgendaBlock = () => ({
    id: `agenda-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    duration: "",
    topic: "",
  });

  const addAgendaBlock = () => {
    setAgendaBlocks((prev) => [...prev, createAgendaBlock()]);
  };

  const updateAgendaBlock = (index, field, value) => {
    setAgendaBlocks((prev) => prev.map((block, i) => (i === index ? { ...block, [field]: value } : block)));
  };

  const removeAgendaBlock = (index) => {
    setAgendaBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  // Only the session itself is saved here. TOT and TLM are added later from the session detail panel.
  const handleSave = () => {
    if (!name.trim() || saving) return;
    onSave({
      title: name.trim(),
      sessionNumber: String(sessionNumber || "").trim(),
      hours: String(hours || "").trim(),
      duration: hours ? `${hours} hrs` : "",
      trainingMethod: method.trim(),
      classroomLabResources: resources.trim(),
      unitNumber: showUnit ? String(unitNumber || "").trim() : "",
      unitName: showUnit ? unitName.trim() : "",
      chapterNumber: showChapter ? String(chapterNumber || "").trim() : "",
      chapterName: showChapter ? chapterName.trim() : "",
      subTopics: showChapter ? subTopicsStr.trim() : "",
      topicCovered: agendaBlocks.map((block) => block.topic).filter(Boolean).join(", "),
      subSessionItems: agendaBlocks
        .filter((block) => block.topic?.trim())
        .map((block) => ({ name: block.topic.trim(), duration: String(block.duration || "") })),
      notes: notes.trim(),
      workflowStatus: editing?.status || "Scheduled",
    });
  };

  return (
    <ModalShell onClose={onClose} width={640}>
      <style>{`
        .ac-marks-input { -moz-appearance: textfield; appearance: textfield; }
        .ac-marks-input::-webkit-outer-spin-button,
        .ac-marks-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
      <div style={{ padding: "18px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ ...display, fontSize: 18, fontWeight: 700 }}>{editing ? "Edit session plan" : "New session plan"}</div>
          <span onClick={onClose} style={{ cursor: "pointer", color: T.mute, fontSize: 18 }}>×</span>
        </div>
        <div style={{ display: "flex", gap: 6, margin: "14px 0" }}>
          {CREATE_STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 4, borderRadius: 4, background: i <= step ? T.coral : T.line, marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: i === step ? T.ink : T.mute }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "4px 22px 20px", overflow: "auto", flex: 1 }} className="ac-scroll">
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: T.page, border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.mute, letterSpacing: 0.4, textTransform: "uppercase" }}>Planning path</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginTop: 2 }}>{planningPath}</div>
              {!showUnit && !showChapter && (
                <div style={{ fontSize: 12, color: T.mute, marginTop: 6 }}>This course is session-only. Unit and chapter were not allocated, so those fields are not available.</div>
              )}
              {showUnit && !showChapter && (
                <div style={{ fontSize: 12, color: T.mute, marginTop: 6 }}>Chapter was not allocated for this course.</div>
              )}
              {!showUnit && showChapter && (
                <div style={{ fontSize: 12, color: T.mute, marginTop: 6 }}>Unit was not allocated for this course.</div>
              )}
            </div>
            {preset && (
              <div style={{ background: T.mintTint, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065f46", letterSpacing: 0.4, textTransform: "uppercase" }}>Adding session to</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#065f46", marginTop: 2 }}>
                  {[
                    unitLabel({ number: preset.unitNumber, name: preset.unitName }),
                    chapterLabel({ number: preset.chapterNumber, name: preset.chapterName }),
                  ].filter(Boolean).join("  ›  ") || "This course"}
                </div>
              </div>
            )}
            {!preset && (showUnit || showChapter) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {showUnit && (
                <>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Unit number</label><input className="ac-input" placeholder="1" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Unit name</label><input className="ac-input" placeholder="Foundation Skills" value={unitName} onChange={(e) => setUnitName(e.target.value)} /></div>
                </>
              )}
              {showChapter && (
                <>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Chapter number</label><input className="ac-input" placeholder="1" value={chapterNumber} onChange={(e) => setChapterNumber(e.target.value)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Chapter name</label><input className="ac-input" placeholder="Introduction to Retail" value={chapterName} onChange={(e) => setChapterName(e.target.value)} /></div>
                </>
              )}
            </div>
            )}
            {showChapter && (
              <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Sub topics</label><input className="ac-input" placeholder="Store layout, greeting" value={subTopicsStr} onChange={(e) => setSubTopicsStr(e.target.value)} /></div>
            )}
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Session number</label><input className="ac-input" placeholder="2" value={sessionNumber} onChange={(e) => setSessionNumber(e.target.value)} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Session name *</label><input className="ac-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Store orientation" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Duration (hrs)</label><input className="ac-input" placeholder="3" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Teaching method</label><input className="ac-input" placeholder="Demonstration" value={method} onChange={(e) => setMethod(e.target.value)} /></div>
            </div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Classroom / lab resources</label><input className="ac-input" placeholder="Projector, mock store shelf" value={resources} onChange={(e) => setResources(e.target.value)} /></div>
            <div style={{ border: `1px dashed ${T.line}`, borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.mute, marginBottom: 8 }}>Topics covered</div>
              <p style={{ fontSize: 12, color: T.mute, marginBottom: 8 }}>Add each topic with duration in minutes</p>
              {agendaBlocks.length === 0 ? (
                <button
                  type="button"
                  onClick={addAgendaBlock}
                  style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", color: T.mute, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "4px 0" }}
                >
                  + Add topic
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {agendaBlocks.map((block, index) => (
                    <div key={block.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="number"
                        className="ac-input"
                        value={block.duration}
                        onChange={(e) => updateAgendaBlock(index, "duration", e.target.value)}
                        placeholder="Mins"
                        style={{ width: 70 }}
                        min="0"
                      />
                      <input
                        className="ac-input"
                        value={block.topic}
                        onChange={(e) => updateAgendaBlock(index, "topic", e.target.value)}
                        placeholder="Topic name"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeAgendaBlock(index)}
                        style={{ border: "none", background: "transparent", color: T.coral, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAgendaBlock}
                    style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", color: T.mute, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "4px 0" }}
                  >
                    + Add topic
                  </button>
                </div>
              )}
            </div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Planning notes</label><textarea className="ac-input" rows={3} placeholder="Anything the Senior Trainer or field trainer should know" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
        )}

      </div>

      <div style={{ display: "flex", gap: 8, padding: 16, borderTop: `1px solid ${T.line}` }}>
        <button onClick={onClose} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Back</button>
        )}
        <div style={{ flex: 1 }} />
        {step < CREATE_STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)} style={{ height: 40, padding: "0 20px", borderRadius: 12, border: "none", background: T.ink, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Next</button>
        ) : (
          <button
            type="button"
            disabled={!name.trim() || saving}
            onClick={handleSave}
            style={{ height: 40, padding: "0 20px", borderRadius: 12, border: "none", background: T.coral, color: "#fff", fontSize: 13, fontWeight: 700, cursor: !name.trim() || saving ? "not-allowed" : "pointer", opacity: !name.trim() || saving ? 0.5 : 1 }}
          >
            {saving ? "Saving..." : "Save plan"}
          </button>
        )}
      </div>
    </ModalShell>
  );
};

const CourseResourcesModal = ({ display, course, onClose, onSave, saving }) => {
  const [classResources, setClassResources] = useState(() => mapCourseResources(course?.classResourcesRequired));
  const [labResources, setLabResources] = useState(() => mapCourseResources(course?.labResourcesRequired));

  const handleSave = () => {
    if (saving) return;
    const invalid = [...classResources, ...labResources].find(
      (item) => item.file && !resourceFileAllowed(item.uploadType, item.file)
    );
    if (invalid) {
      const rule = RESOURCE_FILE_RULES[invalid.uploadType] || RESOURCE_FILE_RULES.PDF;
      window.alert(`Choose a ${invalid.uploadType} file (${rule.extensions.join(", ")}).`);
      return;
    }
    onSave(buildResourceFormData(classResources, labResources));
  };

  const sections = [
    { label: "Class Resource Required", items: classResources, setter: setClassResources, placeholder: "e.g. Projector, Whiteboard" },
    { label: "Lab Resource Required", items: labResources, setter: setLabResources, placeholder: "e.g. Lab kit, Tools" },
  ];

  return (
    <ModalShell onClose={onClose} width={820}>
      <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ ...display, fontSize: 18, fontWeight: 700 }}>Class & lab resources</div>
          <span onClick={onClose} style={{ cursor: "pointer", color: T.mute, fontSize: 18 }}>×</span>
        </div>
        <div style={{ fontSize: 12, color: T.mute, marginTop: 4 }}>
          {course?.name || "Selected course"}
        </div>
      </div>

      <div style={{ padding: "16px 22px 20px", overflow: "auto", flex: 1 }} className="ac-scroll">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sections.map(({ label, items, setter, placeholder }) => (
            <div key={label} style={{ border: `1px solid ${T.line}`, borderRadius: 14, padding: 14, background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ width: 4, height: 16, borderRadius: 4, background: T.coral, flexShrink: 0 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{label}</div>
              </div>

              {items.map((item, index) => (
                <div key={item.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${T.line}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr 0.7fr auto", gap: 8, alignItems: "end" }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.mute }}>Document name</label>
                    <input
                      className="ac-input"
                      value={item.name}
                      placeholder={placeholder}
                      onChange={(e) => updateResourceItem(setter, index, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.mute }}>Description</label>
                    <input
                      className="ac-input"
                      value={item.description}
                      placeholder="Short description"
                      onChange={(e) => updateResourceItem(setter, index, "description", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.mute }}>Upload type</label>
                    <select
                      value={item.uploadType}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setter((prev) => prev.map((row, i) => {
                          if (i !== index) return row;
                          const file = row.file && resourceFileAllowed(nextType, row.file) ? row.file : null;
                          return { ...row, uploadType: nextType, file };
                        }));
                      }}
                      style={{ width: "100%", border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 600, background: "#fff", color: T.ink }}
                    >
                      {RESOURCE_UPLOAD_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.mute }}>Mandatory</label>
                    <select
                      value={String(!!item.mandatory)}
                      onChange={(e) => updateResourceItem(setter, index, "mandatory", e.target.value === "true")}
                      style={{ width: "100%", border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 600, background: "#fff", color: T.ink }}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setter((prev) => prev.filter((_, i) => i !== index))}
                    style={{ height: 40, border: "none", background: "transparent", color: T.coral, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                  <label style={{ height: 34, padding: "0 12px", borderRadius: 10, border: `1px solid ${T.line}`, background: T.page, color: T.ink, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
                    {item.file || item.fileUrl ? "Change file" : "Upload file"}
                    <input
                      type="file"
                      accept={(RESOURCE_FILE_RULES[item.uploadType] || RESOURCE_FILE_RULES.PDF).accept}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && !resourceFileAllowed(item.uploadType, file)) {
                          const rule = RESOURCE_FILE_RULES[item.uploadType] || RESOURCE_FILE_RULES.PDF;
                          window.alert(`This upload type accepts ${rule.extensions.join(", ")} files.`);
                          e.target.value = "";
                          return;
                        }
                        setter((prev) => prev.map((row, i) => {
                          if (i !== index) return row;
                          const nextName = row.name?.trim() || (file ? file.name.replace(/\.[^.]+$/, "") : "");
                          return { ...row, file, name: nextName || row.name };
                        }));
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {item.file ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{item.file.name}</span>
                  ) : item.fileUrl ? (
                    <a
                      href={resolveMediaUrl(undefined, item.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 12, fontWeight: 700, color: T.sky, textDecoration: "none" }}
                    >
                      View uploaded file
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, color: T.mute }}>No file uploaded</span>
                  )}
                </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setter((prev) => [...prev, createResourceItem()])}
                style={{ height: 36, padding: "0 14px", borderRadius: 10, border: "none", background: T.mint, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                {items.length > 0 ? "Add Another" : "Add Document"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: 16, borderTop: `1px solid ${T.line}`, flexShrink: 0 }}>
        <button type="button" onClick={onClose} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          style={{ height: 40, padding: "0 20px", borderRadius: 12, border: "none", background: T.coral, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1 }}
        >
          {saving ? "Saving..." : "Save resources"}
        </button>
      </div>
    </ModalShell>
  );
};

/* ---------------------------------------------------------------
   Activity types manager (§5.11)
---------------------------------------------------------------- */
const SWATCHES = ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899", "#eab308", "#06b6d4", "#ef4444", "#84cc16", "#6366f1", "#14b8a6", "#f43f5e"];

const ActivityModal = ({ display, types = [], loading, onChange, onClose }) => {
  const [newName, setNewName] = useState("");
  const [colorFor, setColorFor] = useState(null);
  const list = types || [];

  const addType = () => {
    const name = newName.trim();
    if (!name) return;
    const next = [
      ...list,
      { id: "a" + Date.now(), name, color: SWATCHES[list.length % SWATCHES.length] },
    ];
    setNewName("");
    onChange(next);
  };

  const renameType = (id, name) => {
    onChange(list.map((x) => (x.id === id ? { ...x, name } : x)), { persist: false });
  };

  const recolorType = (id, color) => {
    onChange(list.map((x) => (x.id === id ? { ...x, color } : x)));
    setColorFor(null);
  };

  const removeType = (id) => {
    onChange(list.filter((x) => x.id !== id));
  };

  return (
    <ModalShell onClose={onClose} width={460}>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ ...display, fontSize: 17, fontWeight: 700 }}>Course activities</div>
          <span onClick={onClose} style={{ cursor: "pointer", color: T.mute, fontSize: 18, lineHeight: 1 }}>×</span>
        </div>
        <div style={{ fontSize: 12, color: T.mute, marginBottom: 14 }}>
          Activities belong to this course. Attach them to one or more sessions, or leave them unused. The same activity can be reused across sessions.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflow: "auto" }}>
          {loading && list.length === 0 && (
            <div style={{ fontSize: 13, color: T.mute, padding: "12px 4px" }}>Loading activity types…</div>
          )}
          {!loading && list.length === 0 && (
            <div style={{ fontSize: 13, color: T.mute, padding: "12px 4px" }}>No activities yet. Type a name below and click + Add type.</div>
          )}
          {list.map((a) => (
            <div key={a.id} style={{ border: `1px solid ${T.line}`, borderRadius: 12, padding: "8px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  title="Change color"
                  onClick={() => setColorFor((id) => (id === a.id ? null : a.id))}
                  style={{ width: 22, height: 22, borderRadius: 999, background: a.color, flexShrink: 0, border: colorFor === a.id ? `2px solid ${T.ink}` : "2px solid transparent", cursor: "pointer", padding: 0 }}
                />
                <input
                  className="ac-input"
                  value={a.name}
                  onChange={(e) => renameType(a.id, e.target.value)}
                  style={{ flex: 1, height: 34, padding: "6px 10px", fontSize: 13, fontWeight: 600 }}
                />
                <span style={{ fontSize: 11, fontWeight: 600, background: a.color + "22", color: a.color, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>{a.name || "Preview"}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: (a.sessionCount || 0) ? T.mint : T.mute, whiteSpace: "nowrap" }}>
                  {(a.sessionCount || 0) ? `${a.sessionCount} session${a.sessionCount === 1 ? "" : "s"}` : "Unused"}
                </span>
                <span
                  onClick={() => removeType(a.id)}
                  title="Delete"
                  style={{ cursor: "pointer", color: T.mute, fontSize: 14 }}
                >
                  🗑
                </span>
              </div>
              {colorFor === a.id && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, paddingLeft: 32 }}>
                  {SWATCHES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => recolorType(a.id, color)}
                      style={{
                        width: 18, height: 18, borderRadius: 999, background: color, cursor: "pointer", padding: 0,
                        border: a.color === color ? "2px solid #0f172a" : "2px solid transparent",
                      }}
                      aria-label={`Use ${color}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input
            className="ac-input"
            placeholder="New activity type name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addType();
              }
            }}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button
            type="button"
            onClick={addType}
            disabled={!newName.trim()}
            style={{ height: 40, padding: "0 16px", borderRadius: 12, border: "none", background: T.ink, color: "#fff", fontSize: 13, fontWeight: 700, cursor: newName.trim() ? "pointer" : "not-allowed", whiteSpace: "nowrap", opacity: newName.trim() ? 1 : 0.45, flexShrink: 0 }}
          >
            + Add type
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default AcademicCoordinatorMockup;