import React, { useState, useMemo, useEffect, useRef } from "react";

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

const STATUS_STYLE = {
  Scheduled: { fg: T.sky, bg: T.skyTint, dot: T.sky },
  "Sent to Senior Trainer": { fg: T.amber, bg: T.amberTint, dot: T.amber },
  Assigned: { fg: T.lilac, bg: T.lilacTint, dot: T.lilac },
  "In Progress": { fg: "#0d9488", bg: "#ccfbf1", dot: "#0d9488" },
  Completed: { fg: T.mint, bg: T.mintTint, dot: T.mint },
};

const ACTIVITY_TYPES = [
  { id: "classroom", name: "Classroom teaching", color: "#3b82f6" },
  { id: "practical", name: "Practical / hands-on", color: "#10b981" },
  { id: "assessment", name: "Assessment", color: "#f97316" },
  { id: "field", name: "Field visit", color: "#8b5cf6" },
  { id: "digital", name: "Digital learning", color: "#ec4899" },
];

const SENIOR_TRAINERS = [
  { id: "st1", name: "Anjali Mehra", email: "anjali.mehra@focalyt.com" },
  { id: "st2", name: "Rohit Sharma", email: "rohit.sharma@focalyt.com" },
  { id: "st3", name: "Preeti Kaur", email: "preeti.kaur@focalyt.com" },
  { id: "st4", name: "Vikram Nair", email: "vikram.nair@focalyt.com" },
];

/* ---------------------------------------------------------------
   Wizard mock data (§5.2) — path picker options
---------------------------------------------------------------- */
const DEPARTMENTS = [
  { id: "d1", name: "Retail & Sales", meta: "3 active courses" },
  { id: "d2", name: "Healthcare", meta: "2 active courses" },
  { id: "d3", name: "IT & Digital", meta: "4 active courses" },
];
const PROJECTS = [
  { id: "p1", name: "Skill India Retail", meta: "Batch-based" },
  { id: "p2", name: "Urban Youth Employment", meta: "Batch-based" },
];
const CENTERS = [
  { id: "c1", name: "Ludhiana Training Center", meta: "Punjab" },
  { id: "c2", name: "Amritsar Training Center", meta: "Punjab" },
  { id: "c3", name: "Jalandhar Training Center", meta: "Punjab" },
];
const COURSES = [
  { id: "co1", name: "Retail Sales Associate", meta: "2 units · 3 chapters" },
  { id: "co2", name: "Store Operations Assistant", meta: "No unit structure" },
];
const BATCHES = [
  { id: "b1", name: "Jan-2026", meta: "24 students" },
  { id: "b2", name: "Mar-2026", meta: "18 students" },
];

const PICKER_STEPS = [
  { key: "department", label: "Department", options: DEPARTMENTS, tint: T.skyTint, ink: "#1d4ed8" },
  { key: "project", label: "Project", options: PROJECTS, tint: T.lilacTint, ink: "#6d28d9" },
  { key: "center", label: "Center", options: CENTERS, tint: "#ffe4d6", ink: "#c2410c" },
  { key: "course", label: "Course", options: COURSES, tint: T.mintTint, ink: "#047857" },
  { key: "batch", label: "Batch", options: BATCHES, tint: "#fef3c7", ink: "#b45309" },
];

/* ---------------------------------------------------------------
   Demo sessions for the selected batch (§2 example)
---------------------------------------------------------------- */
const INITIAL_SESSIONS = [
  {
    id: "s1", number: 1, unit: null, chapter: null, name: "Batch orientation",
    status: "Scheduled", activityIds: ["classroom"], tot: false, hours: 2,
    method: "Lecture", duration: "2 hrs", topics: ["Program overview", "Rules & expectations"],
    subTopics: [], materials: { documents: 1, learning: 1 },
    notes: "Introduce the batch to the program calendar and attendance policy.",
    fieldTrainer: null, totTrainer: null,
  },
  {
    id: "s2", number: 2, unit: "Unit 1 · Foundation Skills", chapter: "Ch. 1 · Introduction to Retail",
    name: "Store orientation", status: "Scheduled", activityIds: ["practical", "field"], tot: true,
    hours: 3, method: "Demonstration", duration: "3 hrs",
    topics: ["Store layout basics", "Customer greeting protocol"],
    subTopics: ["Store layout", "Greeting"], materials: { documents: 2, learning: 3 },
    notes: "Cover the safety walkthrough before floor time. Pair students for greeting practice.",
    fieldTrainer: null, totTrainer: null,
  },
  {
    id: "s3", number: 3, unit: "Unit 1 · Foundation Skills", chapter: "Ch. 2 · Product Knowledge",
    name: "Product categories", status: "Sent to Senior Trainer", activityIds: ["assessment"], tot: false,
    hours: 2, method: "Lecture + quiz", duration: "2 hrs",
    topics: ["SKU categories", "Seasonal lines"], subTopics: [],
    materials: { documents: 1, learning: 2 }, notes: "",
    fieldTrainer: null, totTrainer: null,
  },
  {
    id: "s4", number: 4, unit: "Unit 2 · Advanced Skills", chapter: "Ch. 3 · Upselling Techniques",
    name: "Cross-sell & upsell", status: "Assigned", activityIds: ["practical", "digital"], tot: true,
    hours: 2, method: "Roleplay", duration: "2 hrs",
    topics: ["Reading buying signals", "Suggestive selling"], subTopics: [],
    materials: { documents: 3, learning: 1 },
    notes: "Field trainer runs live roleplay pairs; record two clips per pair for review.",
    fieldTrainer: "Manpreet Singh", totTrainer: "Anjali Mehra",
  },
];

/* ---------------------------------------------------------------
   Small building blocks
---------------------------------------------------------------- */
function IconTile({ children, tint, ink, size = 40 }) {
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
}

function StatusPill({ status }) {
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
}

function ActivityDots({ ids }) {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {ids.map((id) => {
        const a = ACTIVITY_TYPES.find((x) => x.id === id);
        return (
          <span
            key={id}
            title={a?.name}
            style={{ width: 7, height: 7, borderRadius: 999, background: a?.color || T.mute }}
          />
        );
      })}
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const good = toast.type === "success";
  return (
    <div
      style={{
        position: "absolute", left: "50%", bottom: 20, transform: "translateX(-50%)",
        background: good ? "#065f46" : "#7f1d1d", color: "#fff", padding: "10px 18px",
        borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
        zIndex: 200, maxWidth: 360, textAlign: "center",
      }}
    >
      {toast.message}
    </div>
  );
}

/* ---------------------------------------------------------------
   Main component
---------------------------------------------------------------- */
export default function AcademicCoordinatorMockup() {
  const [view, setView] = useState("workspace"); 

  const [selection, setSelection] = useState({});
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activityFilter, setActivityFilter] = useState("All");
  const [moreOpen, setMoreOpen] = useState(false);
  const [modal, setModal] = useState(null); // 'create' | 'refer' | 'activity'
  const [createStep, setCreateStep] = useState(0);
  const [editingSession, setEditingSession] = useState(null);
  const [activityTypes, setActivityTypes] = useState(ACTIVITY_TYPES);
  const [toast, setToast] = useState(null);
  const moreRef = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const display = { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" };
  const body = { fontFamily: "'Inter', system-ui, sans-serif" };

  const selected = sessions.find((s) => s.id === selectedId) || null;

  const kpis = useMemo(() => {
    const total = sessions.length;
    const scheduled = sessions.filter((s) => s.status === "Scheduled").length;
    const withSenior = sessions.filter((s) => s.status === "Sent to Senior Trainer").length;
    const assigned = sessions.filter((s) => s.status === "Assigned").length;
    return { total, scheduled, withSenior, assigned };
  }, [sessions]);

  const distribution = useMemo(() => {
    const counts = {};
    sessions.forEach((s) => s.activityIds.forEach((id) => (counts[id] = (counts[id] || 0) + 1)));
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return activityTypes
      .map((a) => ({ ...a, count: counts[a.id] || 0, pct: ((counts[a.id] || 0) / total) * 100 }))
      .filter((a) => a.count > 0);
  }, [sessions, activityTypes]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (statusFilter !== "All" && s.status !== statusFilter) return false;
      if (activityFilter !== "All" && !s.activityIds.includes(activityFilter)) return false;
      if (search && !(s.name.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [sessions, statusFilter, activityFilter, search]);

  const grouped = useMemo(() => {
    const noUnit = filteredSessions.filter((s) => !s.unit);
    const units = {};
    filteredSessions.filter((s) => s.unit).forEach((s) => {
      units[s.unit] = units[s.unit] || {};
      const ch = s.chapter || "General";
      units[s.unit][ch] = units[s.unit][ch] || [];
      units[s.unit][ch].push(s);
    });
    return { noUnit, units };
  }, [filteredSessions]);

  function pickOption(step, option) {
    setSelection((prev) => ({ ...prev, [PICKER_STEPS[step].key]: option }));
    if (step === PICKER_STEPS.length - 1) {
      setView("workspace");
    }
  }

  function changeStep(i) {
    setSelection((prev) => {
      const next = { ...prev };
      PICKER_STEPS.slice(i).forEach((s) => delete next[s.key]);
      return next;
    });
  }

  function breadcrumbText() {
    return PICKER_STEPS.map((s) => selection[s.key]?.name).filter(Boolean).join("  ›  ");
  }

  function openCreate(existing) {
    setEditingSession(existing || null);
    setCreateStep(0);
    setModal("create");
  }

  function saveSession() {
    setModal(null);
    setToast({ type: "success", message: editingSession ? "Session plan updated" : "Session plan created" });
  }

  function deleteSession(id) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
    setToast({ type: "success", message: "Session plan deleted" });
  }

  function referSession(trainer) {
    setSessions((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, status: "Sent to Senior Trainer" } : s))
    );
    setModal(null);
    setToast({ type: "success", message: `Referred to ${trainer.name}` });
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
        .ac-scroll::-webkit-scrollbar { width: 6px; }
        .ac-scroll::-webkit-scrollbar-thumb { background: #d8dee8; border-radius: 6px; }
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
        {view === "picker" ? (
          <PathPicker
            display={display}
            selection={selection}
            onPick={pickOption}
            onChangeStep={changeStep}
          />
        ) : (
          <Workspace
            display={display}
            selection={selection}
            kpis={kpis}
            distribution={distribution}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
            search={search}
            setSearch={setSearch}
            grouped={grouped}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            selected={selected}
            activityTypes={activityTypes}
            onNewPlan={() => openCreate(null)}
            onEdit={() => openCreate(selected)}
            onDelete={() => deleteSession(selected.id)}
            onRefer={() => setModal("refer")}
            moreOpen={moreOpen}
            setMoreOpen={setMoreOpen}
            moreRef={moreRef}
            onChangeBatch={() => { changeStep(4); setView("picker"); setSelectedId(null); }}
            onManageActivities={() => setModal("activity")}
            breadcrumbText={breadcrumbText()}
          />
        )}
      </div>

      {/* MODALS */}
      {modal === "create" && (
        <CreateModal
          display={display}
          step={createStep}
          setStep={setCreateStep}
          onClose={() => setModal(null)}
          onSave={saveSession}
          editing={editingSession}
          activityTypes={activityTypes}
          breadcrumbText={breadcrumbText()}
        />
      )}
      {modal === "refer" && selected && (
        <ReferModal
          display={display}
          session={selected}
          onClose={() => setModal(null)}
          onSend={referSession}
        />
      )}
      {modal === "activity" && (
        <ActivityModal
          display={display}
          types={activityTypes}
          setTypes={setActivityTypes}
          onClose={() => setModal(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}

/* ---------------------------------------------------------------
   Path picker (§5.2)
---------------------------------------------------------------- */
function PathPicker({ display, selection, onPick, onChangeStep }) {
  const nextOpen = PICKER_STEPS.findIndex((s) => !selection[s.key]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", paddingTop: 12 }}>
      <div style={{ ...display, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Choose the batch to plan
      </div>
      <div style={{ fontSize: 13, color: T.mute, marginBottom: 20 }}>
        Pick each level below — the next one unlocks once you choose.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PICKER_STEPS.map((step, i) => {
          const value = selection[step.key];
          const isOpen = i === nextOpen;
          const isLocked = nextOpen !== -1 && i > nextOpen;

          if (value) {
            return (
              <div
                key={step.key}
                style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: `1px solid ${T.line}`, borderRadius: 14, padding: 12 }}
              >
                <IconTile tint={step.tint} ink={step.ink} size={38}>{step.label[0]}</IconTile>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.mute, textTransform: "uppercase", letterSpacing: 0.3 }}>{step.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{value.name}</div>
                </div>
                <span
                  onClick={() => onChangeStep(i)}
                  style={{ fontSize: 12, fontWeight: 600, color: T.coral, cursor: "pointer" }}
                >
                  Change
                </span>
              </div>
            );
          }

          if (isLocked) {
            return (
              <div
                key={step.key}
                style={{ display: "flex", alignItems: "center", gap: 12, background: T.page, border: `1px dashed ${T.line}`, borderRadius: 14, padding: 12, opacity: 0.6 }}
              >
                <IconTile tint="#eef1f6" ink={T.mute} size={38}>{step.label[0]}</IconTile>
                <div style={{ fontSize: 13, color: T.mute }}>{step.label} — pick the previous level first</div>
              </div>
            );
          }

          return (
            <div key={step.key} style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, padding: 16 }}>
              <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 10 }}>
                Select {step.label.toLowerCase()}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {step.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="ac-card-btn"
                    onClick={() => onPick(i, opt)}
                    style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 14, padding: 12, display: "flex", gap: 10, alignItems: "center" }}
                  >
                    <IconTile tint={step.tint} ink={step.ink} size={40}>{step.label[0]}</IconTile>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{opt.name}</div>
                      <div style={{ fontSize: 11, color: T.mute, marginTop: 2 }}>{opt.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Workspace (§5.3–5.8)
---------------------------------------------------------------- */
function Workspace(props) {
  const {
    display, selection, kpis, distribution, statusFilter, setStatusFilter,
    activityFilter, setActivityFilter, search, setSearch, grouped,
    selectedId, setSelectedId, selected, activityTypes, onNewPlan, onEdit,
    onDelete, onRefer, moreOpen, setMoreOpen, moreRef, onChangeBatch,
    onManageActivities, breadcrumbText,
  } = props;

  const kpiTiles = [
    { label: "Plans", value: kpis.total, bg: "#fff", fg: T.ink, filter: "All" },
    { label: "Scheduled", value: kpis.scheduled, bg: T.skyTint, fg: T.sky, filter: "Scheduled" },
    { label: "With senior", value: kpis.withSenior, bg: T.amberTint, fg: T.amber, filter: "Sent to Senior Trainer" },
    { label: "Assigned", value: kpis.assigned, bg: T.lilacTint, fg: T.lilac, filter: "Assigned" },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, position: "relative" }} ref={moreRef}>
          <button
            onClick={onManageActivities}
            style={{ height: 40, padding: "0 16px", borderRadius: 999, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, fontWeight: 600, color: T.ink, cursor: "pointer" }}
          >
            Activity types
          </button>
          <button
            onClick={onNewPlan}
            style={{ height: 40, padding: "0 18px", borderRadius: 999, border: "none", background: T.coral, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            + New plan
          </button>
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

      {/* Filters */}
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
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", "Scheduled", "Sent to Senior Trainer", "Assigned"].map((s) => (
            <span
              key={s}
              className="ac-pill-btn"
              onClick={() => setStatusFilter(s)}
              style={{
                fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 999,
                background: statusFilter === s ? T.ink : "#fff", color: statusFilter === s ? "#fff" : T.mute,
                border: `1px solid ${statusFilter === s ? T.ink : T.line}`,
              }}
            >
              {s === "Sent to Senior Trainer" ? "Sent" : s}
            </span>
          ))}
        </div>
        <select
          className="ac-input"
          value={activityFilter}
          onChange={(e) => setActivityFilter(e.target.value)}
          style={{ width: 180, height: 40 }}
        >
          <option value="All">All activities</option>
          {activityTypes.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Master-detail */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
        <TocPanel
          display={display}
          grouped={grouped}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onCreateFirst={onNewPlan}
          selection={selection}
        />
        <DetailPanel
          display={display}
          session={selected}
          onEdit={onEdit}
          onDelete={onDelete}
          onRefer={onRefer}
          activityTypes={activityTypes}
        />
      </div>
    </div>
  );
}

function SessionRow({ s, selectedId, setSelectedId }) {
  const isSel = selectedId === s.id;
  const barColor = ACTIVITY_TYPES.find((a) => a.id === s.activityIds[0])?.color || T.mute;
  return (
    <div
      className="ac-toc-row"
      onClick={() => setSelectedId(s.id)}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "9px 10px 9px 8px",
        borderRadius: 10, cursor: "pointer", marginBottom: 2,
        background: isSel ? "#fdeef1" : "transparent",
        borderLeft: isSel ? `3px solid ${T.coral}` : "3px solid transparent",
      }}
    >
      <span style={{ width: 5, height: 22, borderRadius: 3, background: barColor, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: T.mute, width: 18, flexShrink: 0 }}>{String(s.number).padStart(2, "0")}</span>
      <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{s.name}</span>
      {s.tot && (
        <span style={{ fontSize: 10, fontWeight: 700, background: T.mintTint, color: T.mint, padding: "2px 7px", borderRadius: 999 }}>TOT</span>
      )}
      <span style={{ width: 7, height: 7, borderRadius: 999, background: STATUS_STYLE[s.status].dot, flexShrink: 0 }} />
    </div>
  );
}

function TocPanel({ display, grouped, selectedId, setSelectedId, onCreateFirst, selection }) {
  const empty = grouped.noUnit.length === 0 && Object.keys(grouped.units).length === 0;
  return (
    <div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, padding: 16 }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ ...display, fontSize: 15, fontWeight: 700 }}>
          {selection.course?.name || "Course"}
        </div>
        <div style={{ fontSize: 12, color: T.mute }}>{selection.batch?.name || "Batch"}</div>
      </div>

      {empty ? (
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📘</div>
          <div style={{ fontSize: 13, color: T.mute, marginBottom: 14 }}>No sessions match right now.</div>
          <button
            onClick={onCreateFirst}
            style={{ border: "none", background: T.coral, color: "#fff", borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Create first plan
          </button>
        </div>
      ) : (
        <div>
          {grouped.noUnit.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.mute, textTransform: "uppercase", letterSpacing: 0.3, margin: "6px 0" }}>
                Sessions without unit
              </div>
              {grouped.noUnit.map((s) => (
                <SessionRow key={s.id} s={s} selectedId={selectedId} setSelectedId={setSelectedId} />
              ))}
            </div>
          )}
          {Object.entries(grouped.units).map(([unit, chapters]) => (
            <div key={unit} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, margin: "10px 0 4px", borderTop: `1px solid ${T.line}`, paddingTop: 10 }}>
                {unit}
              </div>
              {Object.entries(chapters).map(([chapter, sess]) => (
                <div key={chapter} style={{ paddingLeft: 10, marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.mute, margin: "4px 0" }}>{chapter}</div>
                  <div style={{ paddingLeft: 6 }}>
                    {sess.map((s) => (
                      <SessionRow key={s.id} s={s} selectedId={selectedId} setSelectedId={setSelectedId} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailPanel({ display, session, onEdit, onDelete, onRefer, activityTypes }) {
  if (!session) {
    return (
      <div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, padding: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 260, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>📖</div>
        <div style={{ fontSize: 13, color: T.mute }}>Pick a session from the syllabus to see its plan.</div>
      </div>
    );
  }

  const colors = session.activityIds.map((id) => activityTypes.find((a) => a.id === id)?.color || T.mute);
  const gradient = colors.length > 1 ? `linear-gradient(90deg, ${colors.join(",")})` : colors[0];
  const isAssigned = session.status === "Assigned" || session.status === "In Progress" || session.status === "Completed";

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

        {session.subTopics.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mute, marginBottom: 6, textTransform: "uppercase" }}>Sub topics</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {session.subTopics.map((t) => (
                <span key={t} style={{ fontSize: 12, background: T.page, borderRadius: 999, padding: "5px 10px" }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, background: T.page, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{session.materials.documents}</div>
            <div style={{ fontSize: 11, color: T.mute }}>Documents</div>
          </div>
          <div style={{ flex: 1, background: T.page, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{session.materials.learning}</div>
            <div style={{ fontSize: 11, color: T.mute }}>Learning material</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.mute, marginBottom: 8, textTransform: "uppercase" }}>Trainers</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ width: 26, height: 26, borderRadius: 999, background: T.skyTint, color: T.sky, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                {session.fieldTrainer ? session.fieldTrainer[0] : "?"}
              </span>
              {session.fieldTrainer ? (
                <span>{session.fieldTrainer} <span style={{ color: T.mute }}>· Field trainer</span></span>
              ) : (
                <span style={{ color: T.mute, fontStyle: "italic" }}>Waiting for Senior Trainer</span>
              )}
            </div>
            {session.tot && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span style={{ width: 26, height: 26, borderRadius: 999, background: T.mintTint, color: T.mint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  {session.totTrainer ? session.totTrainer[0] : "?"}
                </span>
                {session.totTrainer ? (
                  <span>{session.totTrainer} <span style={{ color: T.mute }}>· TOT trainer</span></span>
                ) : (
                  <span style={{ color: T.mute, fontStyle: "italic" }}>Waiting for Senior Trainer</span>
                )}
              </div>
            )}
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
          disabled={isAssigned}
          onClick={onDelete}
          style={{ flex: 1, height: 40, borderRadius: 12, border: `1px solid ${T.line}`, background: isAssigned ? T.page : "#fff", color: isAssigned ? T.mute : "#b91c1c", fontSize: 13, fontWeight: 600, cursor: isAssigned ? "not-allowed" : "pointer" }}
        >
          Delete
        </button>
        {session.status === "Scheduled" && (
          <button
            onClick={onRefer}
            style={{ flex: 1.4, height: 40, borderRadius: 12, border: "none", background: T.coral, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Refer session
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Modal shell — normal-flow overlay
---------------------------------------------------------------- */
function ModalShell({ children, onClose, width = 560 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, background: "rgba(15,23,42,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: width, maxHeight: "85%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Create / Edit modal (§5.9) — 4-step stepper
---------------------------------------------------------------- */
const CREATE_STEPS = ["Place in the course", "Session", "Materials", "TOT & notes"];

function CreateModal({ display, step, setStep, onClose, onSave, editing, activityTypes, breadcrumbText }) {
  const [name, setName] = useState(editing?.name || "");
  const [includeTot, setIncludeTot] = useState(editing?.tot || false);
  const [totUseSameTopic, setTotUseSameTopic] = useState(true);
  const [totTopic, setTotTopic] = useState(editing?.totTopic || "");
  const [totMethod, setTotMethod] = useState(editing?.totMethod || "");
  const [studentMaterial, setStudentMaterial] = useState([]);
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [standardTlm, setStandardTlm] = useState([]);
  const [trainerTlm, setTrainerTlm] = useState([]);
  const [totCompletionProofs, setTotCompletionProofs] = useState([]);
  const [agendaBlocks, setAgendaBlocks] = useState([]);

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

  const createTotQuestion = () => ({
    id: `totq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
  });

  const [totQuestions, setTotQuestions] = useState(
    editing?.totQuestions && editing.totQuestions.length
      ? editing.totQuestions
      : [
          {
            id: `totq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            question: "What is the greeting protocol first step?",
            options: ["Smile & make eye contact", "Ask for ID", "Offer discount", "Call the manager"],
            correctIndex: 0,
          },
        ]
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

  return (
    <ModalShell onClose={onClose} width={640}>
      <div style={{ padding: "18px 22px 0" }}>
        <div style={{ fontSize: 11, color: T.mute, marginBottom: 10 }}>{breadcrumbText}</div>
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
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Activity types</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {activityTypes.map((a) => (
                  <span key={a.id} style={{ fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 999, background: a.color + "22", color: a.color, border: `1.5px solid ${a.color}55`, cursor: "pointer" }}>
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Unit number</label><input className="ac-input" placeholder="1" /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Unit name</label><input className="ac-input" placeholder="Foundation Skills" /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Chapter number</label><input className="ac-input" placeholder="1" /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Chapter name</label><input className="ac-input" placeholder="Introduction to Retail" /></div>
            </div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Sub topics</label><input className="ac-input" placeholder="Store layout, greeting" /></div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Session number</label><input className="ac-input" placeholder="2" /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Session name *</label><input className="ac-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Store orientation" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Duration (hrs)</label><input className="ac-input" placeholder="3" /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Teaching method</label><input className="ac-input" placeholder="Demonstration" /></div>
            </div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Classroom / lab resources</label><input className="ac-input" placeholder="Projector, mock store shelf" /></div>
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
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Student learning material", items: studentMaterial, setter: setStudentMaterial, type: "PDF" },
              { label: "Required documents", items: requiredDocuments, setter: setRequiredDocuments, type: "Document" },
              { label: "Standard TLM", items: standardTlm, setter: setStandardTlm, type: "PDF" },
              { label: "Trainer-based TLM", items: trainerTlm, setter: setTrainerTlm, type: "PDF" },
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
        )}

        {step === 3 && (
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

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.mute }}>MCQ bank</div>
                  <button
                    type="button"
                    onClick={replaceAllQuestions}
                    style={{ border: `1px solid ${T.line}`, background: "#fff", color: T.ink, fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "6px 10px", cursor: "pointer" }}
                  >
                    Replace all questions
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {totQuestions.map((question, questionIndex) => (
                    <div key={question.id} style={{ border: `1px solid ${T.line}`, borderRadius: 12, padding: 12, background: "#fff" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Q{questionIndex + 1}</div>
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
            <div><label style={{ fontSize: 12, fontWeight: 600, color: T.mute }}>Planning notes</label><textarea className="ac-input" rows={3} placeholder="Anything the Senior Trainer or field trainer should know" /></div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, padding: 16, borderTop: `1px solid ${T.line}` }}>
        <button onClick={onClose} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Back</button>
        )}
        <div style={{ flex: 1 }} />
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} style={{ height: 40, padding: "0 20px", borderRadius: 12, border: "none", background: T.ink, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Next</button>
        ) : (
          <button disabled={!name && !editing} onClick={onSave} style={{ height: 40, padding: "0 20px", borderRadius: 12, border: "none", background: T.coral, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !name && !editing ? 0.5 : 1 }}>
            Save plan
          </button>
        )}
      </div>
    </ModalShell>
  );
}

/* ---------------------------------------------------------------
   Refer modal (§5.10)
---------------------------------------------------------------- */
function ReferModal({ display, session, onClose, onSend }) {
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState(null);
  const filtered = SENIOR_TRAINERS.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));
  const picked = SENIOR_TRAINERS.find((t) => t.id === pickedId);

  return (
    <ModalShell onClose={onClose} width={440}>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ ...display, fontSize: 17, fontWeight: 700 }}>
            Refer "{session.name}"
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", color: T.mute, fontSize: 18 }}>×</span>
        </div>
        <div style={{ background: T.amberTint, color: "#92400e", fontSize: 12, fontWeight: 600, borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
          They will set the date and field trainer.
        </div>
        <input className="ac-input" placeholder="Search senior trainers" value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginBottom: 10 }} />
        <div style={{ maxHeight: 220, overflow: "auto" }}>
          {filtered.map((t) => (
            <div
              key={t.id}
              onClick={() => setPickedId(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, cursor: "pointer", background: pickedId === t.id ? T.coralTint : "transparent" }}
            >
              <span style={{ width: 32, height: 32, borderRadius: 999, background: T.lilacTint, color: T.lilac, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                {t.name[0]}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: T.mute }}>{t.email}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          disabled={!picked}
          onClick={() => picked && onSend(picked)}
          style={{ width: "100%", marginTop: 16, height: 44, borderRadius: 12, border: "none", background: T.coral, color: "#fff", fontSize: 14, fontWeight: 700, cursor: picked ? "pointer" : "not-allowed", opacity: picked ? 1 : 0.5 }}
        >
          {picked ? `➤ Send to ${picked.name}` : "Select a trainer"}
        </button>
      </div>
    </ModalShell>
  );
}

/* ---------------------------------------------------------------
   Activity types manager (§5.11)
---------------------------------------------------------------- */
const SWATCHES = ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899", "#eab308", "#06b6d4", "#ef4444", "#84cc16", "#6366f1", "#14b8a6", "#f43f5e"];

function ActivityModal({ display, types, setTypes, onClose }) {
  const [newName, setNewName] = useState("");

  function addType() {
    if (!newName.trim()) return;
    setTypes((prev) => [...prev, { id: "a" + Date.now(), name: newName.trim(), color: SWATCHES[prev.length % SWATCHES.length] }]);
    setNewName("");
  }

  return (
    <ModalShell onClose={onClose} width={460}>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ ...display, fontSize: 17, fontWeight: 700 }}>Activity types</div>
          <span onClick={onClose} style={{ cursor: "pointer", color: T.mute, fontSize: 18 }}>×</span>
        </div>
        <div style={{ fontSize: 12, color: T.mute, marginBottom: 14 }}>These colors show on the syllabus and session cards.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflow: "auto" }}>
          {types.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${T.line}`, borderRadius: 12, padding: "8px 10px" }}>
              <span style={{ width: 20, height: 20, borderRadius: 999, background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{a.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, background: a.color + "22", color: a.color, padding: "3px 9px", borderRadius: 999 }}>{a.name}</span>
              <span
                onClick={() => setTypes((prev) => prev.filter((x) => x.id !== a.id))}
                style={{ cursor: "pointer", color: T.mute, fontSize: 14 }}
              >
                🗑
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input className="ac-input" placeholder="New activity type name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button onClick={addType} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: "none", background: T.ink, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            + Add type
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// import axios from 'axios';
// import { useLocation, useNavigate } from 'react-router-dom';
// import DatePicker from 'react-date-picker';
// import 'react-date-picker/dist/DatePicker.css';
// import 'react-calendar/dist/Calendar.css';

// const PINK = '#fa5579';
// const BLUE = '#2563eb';
// const GREEN = '#059669';

// const getOptionLabel = (options = [], value) =>
//   options.find((option) => String(option.value) === String(value))?.label || '';

// const mapApiOptions = (items = []) =>
//   (items || [])
//     .filter((item) => item && item._id && item.name)
//     .map((item) => ({ value: String(item._id), label: item.name }));

// const WORKFLOW_STATUS = {
//   SCHEDULED: 'Scheduled',
//   SENT_TO_SENIOR: 'Sent to Senior Trainer',
//   ASSIGNED: 'Assigned',
//   IN_PROGRESS: 'In Progress',

// };

// const STATUS_TONE = {
//   [WORKFLOW_STATUS.SCHEDULED]: 'blue',
//   [WORKFLOW_STATUS.SENT_TO_SENIOR]: 'amber',
//   [WORKFLOW_STATUS.ASSIGNED]: 'purple',
//   [WORKFLOW_STATUS.IN_PROGRESS]: 'teal',
//   [WORKFLOW_STATUS.COMPLETED]: 'green',
// };

// const SESSION_PATH_STEPS = [
//   { key: 'department', label: 'Department', icon: 'fa-sitemap', step: 1, hint: 'Select department to plan sessions' },
//   { key: 'project', label: 'Project', icon: 'fa-project-diagram', step: 2, hint: 'Projects under selected department' },
//   { key: 'center', label: 'Center', icon: 'fa-building', step: 3, hint: 'Training center for this project' },
//   { key: 'course', label: 'Course', icon: 'fa-graduation-cap', step: 4, hint: 'Course / trade at this center' },
//   { key: 'batch', label: 'Batch', icon: 'fa-users', step: 5, hint: 'Batch for session planning' },
// ];

// const DOC_REQUIREMENT = {
//   MANDATORY: 'mandatory',
//   NON_MANDATORY: 'non_mandatory',
// };

// const DOC_REQUIREMENT_OPTIONS = [
//   { value: DOC_REQUIREMENT.MANDATORY, label: 'Mandatory' },
//   { value: DOC_REQUIREMENT.NON_MANDATORY, label: 'Non-mandatory' },
// ];

// const getDocRequirementLabel = (value) =>
//   DOC_REQUIREMENT_OPTIONS.find((option) => option.value === value)?.label || 'Mandatory';

// const EVIDENCE_TYPE_OPTIONS = ['Document', 'Image', 'Video', 'PDF'];

// const LEARNING_MATERIAL_TYPE_OPTIONS = ['PDF', 'Video', 'Document', 'Presentation', 'Link', 'Image'];

// const createMaterialItem = (defaultType = 'Document') => ({
//   id: `MAT${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
//   name: '',
//   description: '',
//   type: defaultType,
//   requirement: DOC_REQUIREMENT.MANDATORY,
// });

// const normalizeMaterialItems = (items = []) =>
//   items
//     .filter((item) => item.name?.trim())
//     .map((item) => ({
//       ...item,
//       name: item.name.trim(),
//       description: item.description?.trim() || '',
//       type: item.type || 'Document',
//       requirement: item.requirement || DOC_REQUIREMENT.MANDATORY,
//       requirementLabel: getDocRequirementLabel(item.requirement),
//     }));

// /** Migrate old string TLM fields into document list shape */
// const normalizeTlmList = (value) => {
//   if (Array.isArray(value)) return value;
//   if (typeof value === 'string' && value.trim()) {
//     return [{
//       ...createMaterialItem('Document'),
//       name: value.trim(),
//       description: '',
//     }];
//   }
//   return [];
// };

// const createTotQuestionDraft = () => ({
//   id: `TQ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
//   question: '',
//   options: ['', '', '', ''],
//   correctIndex: 0,
//   marks: 1,
// });

// const normalizeTotQuestions = (questions = []) =>
//   (questions || [])
//     .filter((item) => item && item.question?.trim() && Array.isArray(item.options) && item.options.length >= 2)
//     .map((item) => ({
//       id: String(item.id || `TQ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
//       question: String(item.question || '').trim(),
//       options: item.options.map((option) => String(option || '').trim()),
//       correctIndex: Number.isFinite(item.correctIndex) ? item.correctIndex : 0,
//       marks: Number(item.marks) || 1,
//     }));

// const countMaterialsByRequirement = (items = []) => {
//   const mandatory = items.filter(
//     (item) => (item.requirement || DOC_REQUIREMENT.MANDATORY) === DOC_REQUIREMENT.MANDATORY
//   ).length;
//   return {
//     total: items.length,
//     mandatory,
//     optional: items.length - mandatory,
//   };
// };

// const MaterialDefinitionSection = ({
//   title,
//   hint,
//   addLabel,
//   emptyText,
//   items = [],
//   typeOptions = EVIDENCE_TYPE_OPTIONS,
//   nameColumnLabel = 'Name',
//   descriptionColumnLabel = 'Description',
//   typeColumnLabel = 'Type',
//   namePlaceholder = 'Enter name',
//   descriptionPlaceholder = 'Enter description',
//   showDescription = false,
//   onAdd,
//   onChange,
//   onRemove,
// }) => (
//   <div className="ac-evidence-builder">
//     <div className="ac-evidence-builder__head">
//       <h6>{title}</h6>
//       <button type="button" className="ac-mini-btn" onClick={onAdd}>
//         <i className="fas fa-plus" /> {addLabel}
//       </button>
//     </div>
//     {hint ? <p className="ac-evidence-hint">{hint}</p> : null}
//     {items.length === 0 && (
//       <p className="ac-evidence-empty">{emptyText}</p>
//     )}
//     {items.length > 0 && (
//       <div className={`ac-evidence-row ac-evidence-row--head${showDescription ? ' ac-evidence-row--with-desc' : ''}`}>
//         <span>{nameColumnLabel}</span>
//         {showDescription && <span>{descriptionColumnLabel}</span>}
//         <span>{typeColumnLabel}</span>
//         <span>Requirement</span>
//         <span />
//       </div>
//     )}
//     {items.map((item, index) => (
//       <div
//         key={item.id || index}
//         className={`ac-evidence-row${showDescription ? ' ac-evidence-row--with-desc' : ''}`}
//       >
//         <input
//           className="ac-input"
//           placeholder={namePlaceholder}
//           value={item.name || ''}
//           onChange={(e) => onChange(index, 'name', e.target.value)}
//         />
//         {showDescription && (
//           <input
//             className="ac-input"
//             placeholder={descriptionPlaceholder}
//             value={item.description || ''}
//             onChange={(e) => onChange(index, 'description', e.target.value)}
//           />
//         )}
//         <select
//           className="ac-input"
//           value={item.type || typeOptions[0]}
//           onChange={(e) => onChange(index, 'type', e.target.value)}
//         >
//           {typeOptions.map((type) => (
//             <option key={type} value={type}>{type}</option>
//           ))}
//         </select>
//         <select
//           className="ac-input"
//           value={item.requirement || DOC_REQUIREMENT.MANDATORY}
//           onChange={(e) => onChange(index, 'requirement', e.target.value)}
//         >
//           {DOC_REQUIREMENT_OPTIONS.map((option) => (
//             <option key={option.value} value={option.value}>{option.label}</option>
//           ))}
//         </select>
//         <button
//           type="button"
//           className="ac-remove-btn"
//           onClick={() => onRemove(index)}
//           aria-label="Remove item"
//         >
//           <i className="fas fa-trash" />
//         </button>
//       </div>
//     ))}
//   </div>
// );

// const TotQuestionBankSection = ({
//   questions = [],
//   onQuestionChange,
//   onQuestionOptionChange,
//   onAddQuestion,
//   onRemoveQuestion,
// }) => (
//   <div className="ac-question-bank">
//     <div className="ac-question-bank__head">
//       <h6>TOT MCQ question bank</h6>
//       <button type="button" className="ac-mini-btn" onClick={onAddQuestion}>
//         <i className="fas fa-plus" /> Add question
//       </button>
//     </div>
//     <p className="ac-question-bank__hint">
//       Add MCQ questions for the TOT session. The assigned trainer will see these questions.
//     </p>
//     {questions.length === 0 ? (
//       <p className="ac-question-bank__empty">No TOT questions added yet. Add one to begin.</p>
//     ) : (
//       questions.map((question, index) => (
//         <div key={question.id || index} className="ac-question-card">
//           <div className="ac-question-card__top">
//             <label className="ac-field ac-field--full">
//               <span>Question {index + 1}</span>
//               <input
//                 className="ac-input"
//                 placeholder="Enter question text"
//                 value={question.question}
//                 onChange={(e) => onQuestionChange(index, 'question', e.target.value)}
//               />
//             </label>
//             <label className="ac-field ac-field--full">
//               <span>Marks</span>
//               <input
//                 className="ac-input"
//                 type="number"
//                 min="1"
//                 value={question.marks || 1}
//                 onChange={(e) => onQuestionChange(index, 'marks', e.target.value)}
//               />
//             </label>
//             <button
//               type="button"
//               className="ac-remove-btn ac-remove-btn--question"
//               onClick={() => onRemoveQuestion(index)}
//               aria-label="Remove question"
//             >
//               <i className="fas fa-trash" />
//             </button>
//           </div>
//           <div className="ac-option-grid">
//             {question.options.map((option, optionIndex) => (
//               <label key={optionIndex} className="ac-option-row">
//                 <input
//                   type="radio"
//                   name={`tot-question-${question.id}-correct`}
//                   checked={question.correctIndex === optionIndex}
//                   onChange={() => onQuestionChange(index, 'correctIndex', optionIndex)}
//                 />
//                 <input
//                   className="ac-input ac-input--small"
//                   placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
//                   value={option}
//                   onChange={(e) => onQuestionOptionChange(index, optionIndex, e.target.value)}
//                 />
//               </label>
//             ))}
//           </div>
//         </div>
//       ))
//     )}
//   </div>
// );

// const SESSION_TYPE = {
//   STUDENT: 'student',
//   TOT: 'tot',
// };

// const DEFAULT_COURSE_STRUCTURE = { unit: true, chapter: true, session: true };

// const normalizeCourseStructure = (structure) => {
//   if (!structure || typeof structure !== 'object') {
//     return { ...DEFAULT_COURSE_STRUCTURE };
//   }
//   return {
//     unit: structure.unit === true,
//     chapter: structure.chapter === true,
//     session: true,
//   };
// };

// const getCourseStructureFromMeta = (courses = [], courseId, fallbackStructure) => {
//   if (!courseId) {
//     return normalizeCourseStructure(fallbackStructure);
//   }
//   const course = courses.find((item) => String(item._id) === String(courseId));
//   if (course?.courseStructure) {
//     return normalizeCourseStructure(course.courseStructure);
//   }
//   if (fallbackStructure) {
//     return normalizeCourseStructure(fallbackStructure);
//   }
//   return { ...DEFAULT_COURSE_STRUCTURE };
// };

// const buildStructurePathLabel = (structure = DEFAULT_COURSE_STRUCTURE) => {
//   const parts = [];
//   if (structure.unit) parts.push('Unit');
//   if (structure.chapter) parts.push('Chapter');
//   parts.push('Session');
//   return parts.join(' → ');
// };

// const hasLinkedTot = (session = {}) => (
//   session.includeTot === true || session.sessionType === SESSION_TYPE.TOT
// );

// const appearsOnStudentCalendar = (session = {}) => (
//   session.sessionType === SESSION_TYPE.STUDENT || session.sessionType !== SESSION_TYPE.TOT
// );

// const appearsOnTotCalendar = (session = {}) => hasLinkedTot(session);

// const getTotDisplayTitle = (session = {}) => (
//   session.totTitle?.trim() || `TOT – ${session.title || 'Session'}`
// );

// const getTotDisplayTopic = (session = {}) => (
//   session.totUseSameTopics !== false
//     ? (session.topicCovered || '')
//     : (session.totTopicCovered || session.topicCovered || '')
// );

// const mapSessionForTotCalendar = (session = {}) => ({
//   ...session,
//   id: `${session.id}-tot`,
//   sourceSessionId: session.id,
//   title: getTotDisplayTitle(session),
//   topicCovered: getTotDisplayTopic(session),
//   trainingMethod: session.totUseSameTopics !== false
//     ? (session.trainingMethod || '')
//     : (session.totTrainingMethod || session.trainingMethod || ''),
// });

// const resolveSessionSelectionId = (sessionId) => (
//   String(sessionId).endsWith('-tot') ? String(sessionId).replace(/-tot$/, '') : sessionId
// );

// const TOTAL_SESSION_SLOTS = 30;

// const buildFixedSessionSlots = (sessions = [], total = TOTAL_SESSION_SLOTS) => {
//   const byNumber = {};
//   sessions.forEach((session) => {
//     const num = parseInt(String(session.sessionNumber ?? ''), 10);
//     if (!Number.isFinite(num) || num < 1 || num > total) return;
//     if (!byNumber[num]) byNumber[num] = session;
//   });
//   return Array.from({ length: total }, (_, index) => {
//     const sessionNumber = index + 1;
//     return {
//       key: `slot-${sessionNumber}`,
//       sessionNumber: String(sessionNumber),
//       session: byNumber[sessionNumber] || null,
//     };
//   });
// };

// const SessionPlanCalendar = ({
//   title,
//   icon,
//   accent = GREEN,
//   sessions,
//   selectedSessionId,
//   onSelectSession,
// }) => {
//   const cells = useMemo(() => buildFixedSessionSlots(sessions), [sessions]);

//   return (
//     <div className="ac-calendar" style={{ '--calendar-accent': accent }}>
//       <div className="ac-calendar__title-bar">
//         <div className="ac-calendar__title">
//           <i className={`fas ${icon}`} />
//           <span>{title}</span>
//         </div>
//         <span className="ac-calendar__count">{sessions.length} / {TOTAL_SESSION_SLOTS} plan(s)</span>
//       </div>
//       <div className="ac-calendar__head">
//         <h3>Session plans</h3>
//         <span className="ac-calendar__head-hint">Session 1–{TOTAL_SESSION_SLOTS} · dates assigned later by Senior Trainer</span>
//       </div>
//       <div className="ac-calendar__weekdays" aria-hidden="true">
//         {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
//           <span key={day}>{day}</span>
//         ))}
//       </div>
//       <div className="ac-calendar__grid">
//         {cells.map((cell) => {
//           const { session, sessionNumber } = cell;
//           if (!session) {
//             return (
//               <div
//                 key={cell.key}
//                 className="ac-calendar__day ac-calendar__day--slot"
//               >
//                 <span className="ac-calendar__day-num">{sessionNumber}</span>
//                 <span className="ac-calendar__session-title ac-calendar__session-title--muted">Not planned</span>
//               </div>
//             );
//           }

//           const color = session.sessionActivities?.[0]?.color
//             || session.activityColor
//             || (session.sessionType === SESSION_TYPE.TOT ? BLUE : GREEN);
//           const isSelected = resolveSessionSelectionId(selectedSessionId) === resolveSessionSelectionId(session.id);

//           return (
//             <button
//               key={cell.key}
//               type="button"
//               className={`ac-calendar__day ac-calendar__day--session${isSelected ? ' ac-calendar__day--selected' : ''}`}
//               style={{ '--event-color': color }}
//               onClick={() => onSelectSession(session.id)}
//               title={`Session ${sessionNumber}: ${session.title || 'Untitled'}`}
//             >
//               <span className="ac-calendar__day-num">{sessionNumber}</span>
//               <span className="ac-calendar__session-title">{session.title || 'Untitled session'}</span>
//               {session.topicCovered ? (
//                 <span className="ac-calendar__session-topic">{session.topicCovered}</span>
//               ) : null}
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// const PROOF_TYPE_OPTIONS = ['Document', 'Image', 'Video', 'PDF'];

// const validateTotBeforeSave = (draft) => {
//   if (draft.includeTot === false) return { valid: true };

//   if (draft.totUseSameTopics === false && !draft.totTopicCovered?.trim()) {
//     return { valid: false, message: 'Enter TOT topic or enable same topics as student session' };
//   }

//   return { valid: true };
// };

// const TotSection = ({
//   draft,
//   onFieldChange,
//   onTotMaterialChange,
//   onAddTotMaterial,
//   onRemoveTotMaterial,
//   onTotQuestionChange,
//   onTotQuestionOptionChange,
//   onAddTotQuestion,
//   onRemoveTotQuestion,
//   onTotCompletionProofChange,
//   onAddTotCompletionProof,
//   onRemoveTotCompletionProof,
// }) => {
//   if (draft.includeTot === false) return null;

//   const useSameTopics = draft.totUseSameTopics !== false;

//   return (
//     <div className="ac-tot-panel">
//       <div className="ac-tot-panel__head">
//         <div>
//           <h6>
//             <i className="fas fa-chalkboard-teacher" /> TOT — Training of Trainers
//           </h6>
//           <p>Linked TOT plan for this student session. Senior Trainer will assign the trainer after review.</p>
//         </div>
//       </div>

//       <div className="ac-tot-info-box">
//         <i className="fas fa-info-circle" />
//         <p>
//           Field trainer and TOT trainer are <strong>not selected here</strong>.
//           Send the plan to Senior Trainer — they will assign trainers.
//         </p>
//       </div>

//       <label className="ac-tot-check">
//         <input
//           type="checkbox"
//           checked={useSameTopics}
//           onChange={(e) => onFieldChange('totUseSameTopics', e.target.checked)}
//         />
//         <span>Use same topics as student session in TOT</span>
//       </label>

//       {useSameTopics ? (
//         <div className="ac-tot-sync-box">
//           <i className="fas fa-link" />
//           <div>
//             <strong>Topics synced with student session</strong>
//             <p>{buildTopicSummary(draft) || 'Add chapter and sub topics above — they will appear in TOT too.'}</p>
//             {draft.trainingMethod?.trim() && (
//               <p className="ac-tot-sync-box__method">Method: {draft.trainingMethod}</p>
//             )}
//           </div>
//         </div>
//       ) : (
//         <div className="ac-form-grid">
//           <label className="ac-field ac-field--full">
//             <span>TOT topic covered *</span>
//             <input
//               className="ac-input"
//               placeholder="Separate topics for trainer TOT..."
//               value={draft.totTopicCovered || ''}
//               onChange={(e) => onFieldChange('totTopicCovered', e.target.value)}
//             />
//           </label>
//           <label className="ac-field ac-field--full">
//             <span>TOT training method</span>
//             <input
//               className="ac-input"
//               placeholder="How TOT will be delivered..."
//               value={draft.totTrainingMethod || ''}
//               onChange={(e) => onFieldChange('totTrainingMethod', e.target.value)}
//             />
//           </label>
//         </div>
//       )}

//       <label className="ac-tot-check">
//         <input
//           type="checkbox"
//           checked={draft.requireTotCompletionProofs === true}
//           onChange={(e) => onFieldChange('requireTotCompletionProofs', e.target.checked)}
//         />
//         <span>Trainer must submit completion proofs after TOT</span>
//       </label>

//       {draft.requireTotCompletionProofs === true && (
//         <MaterialDefinitionSection
//           title="TOT completion proofs"
//           addLabel="Add proof"
//           emptyText="No completion proofs defined yet."
//           nameColumnLabel="Proof name"
//           typeColumnLabel="Proof type"
//           namePlaceholder="e.g. Signed TOT certificate"
//           items={draft.totCompletionProofs || []}
//           typeOptions={PROOF_TYPE_OPTIONS}
//           onAdd={onAddTotCompletionProof}
//           onChange={onTotCompletionProofChange}
//           onRemove={onRemoveTotCompletionProof}
//         />
//       )}

//       <MaterialDefinitionSection
//         title="TOT learning material"
//         addLabel="Add TOT material"
//         emptyText="No TOT material defined yet."
//         items={draft.totMaterials || []}
//         typeOptions={LEARNING_MATERIAL_TYPE_OPTIONS}
//         onAdd={onAddTotMaterial}
//         onChange={onTotMaterialChange}
//         onRemove={onRemoveTotMaterial}
//       />

//       <TotQuestionBankSection
//         questions={draft.totQuestionBank || []}
//         onQuestionChange={onTotQuestionChange}
//         onQuestionOptionChange={onTotQuestionOptionChange}
//         onAddQuestion={onAddTotQuestion}
//         onRemoveQuestion={onRemoveTotQuestion}
//       />
//     </div>
//   );
// };

// const STORAGE_PREFIX = 'acCoordinatorSessions:'; // legacy — sessions now persist via API
// const ACTIVITY_TYPES_STORAGE_KEY = 'acCoordinatorActivityTypes'; // legacy

// const PRESET_COLORS = [
//   '#2563eb', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#ef4444',
//   '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7',
// ];

// const authHeaders = (token) => ({ 'x-auth': token });

// const fetchActivityTypesApi = async (backendUrl, token) => {
//   const res = await axios.get(`${backendUrl}/college/session-plans/activity-types`, {
//     headers: authHeaders(token),
//   });
//   const types = res.data?.data;
//   return Array.isArray(types) ? types : [];
// };

// const saveActivityTypesApi = async (backendUrl, token, types) => {
//   const res = await axios.put(
//     `${backendUrl}/college/session-plans/activity-types`,
//     { types },
//     { headers: authHeaders(token) }
//   );
//   return res.data?.data || types;
// };

// const fetchSessionsApi = async (backendUrl, token, batchId, courseId = '') => {
//   const params = new URLSearchParams();
//   if (batchId) params.set('batch', batchId);
//   if (courseId) params.set('course', courseId);
//   const res = await axios.get(`${backendUrl}/college/session-plans?${params.toString()}`, {
//     headers: authHeaders(token),
//   });
//   return Array.isArray(res.data?.data) ? res.data.data : [];
// };

// const createSessionApi = async (backendUrl, token, payload) => {
//   const res = await axios.post(`${backendUrl}/college/session-plans`, payload, {
//     headers: authHeaders(token),
//   });
//   if (!res.data?.status) throw new Error(res.data?.message || 'Failed to create session');
//   return res.data.data;
// };

// const updateSessionApi = async (backendUrl, token, sessionId, payload) => {
//   const res = await axios.put(`${backendUrl}/college/session-plans/${sessionId}`, payload, {
//     headers: authHeaders(token),
//   });
//   if (!res.data?.status) throw new Error(res.data?.message || 'Failed to update session');
//   return res.data.data;
// };

// const patchSessionApi = async (backendUrl, token, sessionId, payload) => {
//   const res = await axios.patch(`${backendUrl}/college/session-plans/${sessionId}`, payload, {
//     headers: authHeaders(token),
//   });
//   if (!res.data?.status) throw new Error(res.data?.message || 'Failed to update session');
//   return res.data.data;
// };

// const deleteSessionApi = async (backendUrl, token, sessionId) => {
//   const res = await axios.delete(`${backendUrl}/college/session-plans/${sessionId}`, {
//     headers: authHeaders(token),
//   });
//   if (!res.data?.status) throw new Error(res.data?.message || 'Failed to delete session');
//   return true;
// };

// const getActivityTypeById = (types, id) => types.find((type) => type.id === id) || null;

// const normalizeActivityItem = (item) => ({
//   id: item.id,
//   name: item.name || '',
//   color: item.color || BLUE,
// });

// /** Supports legacy single-type sessions and new multi-select array */
// const getSessionActivities = (session = {}) => {
//   if (Array.isArray(session.sessionActivities) && session.sessionActivities.length) {
//     return session.sessionActivities.map(normalizeActivityItem);
//   }
//   if (session.activityTypeId) {
//     return [normalizeActivityItem({
//       id: session.activityTypeId,
//       name: session.activityTypeName,
//       color: session.activityColor,
//     })];
//   }
//   return [];
// };

// const normalizeSessionActivities = (items = []) =>
//   items
//     .filter((item) => item?.id && item?.name?.trim())
//     .map((item) => normalizeActivityItem({
//       id: item.id,
//       name: item.name.trim(),
//       color: item.color,
//     }));

// const buildActivityDistribution = (sessions = [], activityTypes = []) => {
//   const counts = {};
//   activityTypes.forEach((type) => { counts[type.id] = 0; });
//   sessions.forEach((session) => {
//     getSessionActivities(session).forEach((activity) => {
//       if (counts[activity.id] != null) counts[activity.id] += 1;
//     });
//   });
//   return activityTypes.map((type) => ({
//     ...type,
//     count: counts[type.id] || 0,
//   }));
// };

// const buildActivityHeadStyle = (activities = []) => {
//   if (!activities.length) return undefined;
//   if (activities.length === 1) {
//     const color = activities[0].color;
//     return { background: `linear-gradient(105deg, ${color} 0%, ${color}cc 55%, ${color}99 100%)` };
//   }
//   const stops = activities
//     .map((activity, index) => {
//       const percent = Math.round((index / (activities.length - 1)) * 100);
//       return `${activity.color} ${percent}%`;
//     })
//     .join(', ');
//   return { background: `linear-gradient(105deg, ${stops})` };
// };

// const ActivityTypesManager = ({ types, onChange, onClose, onNotify }) => {
//   const [draftTypes, setDraftTypes] = useState(types);

//   const updateType = (index, field, value) => {
//     setDraftTypes((prev) => prev.map((item, i) => (
//       i === index ? { ...item, [field]: value } : item
//     )));
//   };

//   const addType = () => {
//     const nextIndex = draftTypes.length + 1;
//     const color = PRESET_COLORS[(draftTypes.length) % PRESET_COLORS.length];
//     setDraftTypes((prev) => [
//       ...prev,
//       { id: `act-${Date.now()}`, name: `Activity ${nextIndex}`, color },
//     ]);
//   };

//   const removeType = (index) => {
//     if (draftTypes.length <= 1) {
//       onNotify('At least one activity type is required');
//       return;
//     }
//     setDraftTypes((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleSave = () => {
//     const cleaned = draftTypes
//       .map((type) => ({
//         ...type,
//         name: type.name?.trim() || 'Untitled Activity',
//         color: type.color || BLUE,
//       }))
//       .filter((type) => type.name);
//     if (!cleaned.length) {
//       onNotify('Add at least one activity type');
//       return;
//     }
//     onChange(cleaned);
//     onNotify('Activity types saved');
//     onClose();
//   };

//   return (
//     <div className="ac-modal-backdrop">
//       <div className="ac-modal ac-modal--wide" role="dialog" aria-modal="true">
//         <div className="ac-modal__head">
//           <div>
//             <h5>Session Activity Types</h5>
//             <span>Define labels & colors before creating sessions</span>
//           </div>
//           <button type="button" className="ac-modal__close" onClick={onClose} aria-label="Close">
//             <i className="fas fa-times" />
//           </button>
//         </div>

//         <div className="ac-modal__body">
//           <p className="ac-evidence-hint">
//             Examples: Extra Curricular Activity, Interview Skills, Quiz. Each type gets a color used on session cards and calendar views.
//           </p>

//           <div className="ac-activity-manage-head">
//             <span>Name</span>
//             <span>Color</span>
//             <span>Preview</span>
//             <span />
//           </div>

//           {draftTypes.map((type, index) => (
//             <div key={type.id} className="ac-activity-manage-row">
//               <input
//                 className="ac-input"
//                 value={type.name}
//                 onChange={(e) => updateType(index, 'name', e.target.value)}
//                 placeholder="e.g. Interview Skills"
//               />
//               <div className="ac-color-field">
//                 <input
//                   type="color"
//                   className="ac-color-input"
//                   value={type.color}
//                   onChange={(e) => updateType(index, 'color', e.target.value)}
//                 />
//                 <div className="ac-color-swatches">
//                   {PRESET_COLORS.slice(0, 6).map((color) => (
//                     <button
//                       key={color}
//                       type="button"
//                       className={`ac-color-swatch${type.color === color ? ' ac-color-swatch--active' : ''}`}
//                       style={{ background: color }}
//                       onClick={() => updateType(index, 'color', color)}
//                       aria-label={`Use color ${color}`}
//                     />
//                   ))}
//                 </div>
//               </div>
//               <span className="ac-activity-preview-pill" style={{ background: type.color }}>
//                 {type.name || 'Preview'}
//               </span>
//               <button type="button" className="ac-remove-btn" onClick={() => removeType(index)} aria-label="Remove type">
//                 <i className="fas fa-trash" />
//               </button>
//             </div>
//           ))}

//           <button type="button" className="ac-mini-btn ac-mini-btn--block" onClick={addType}>
//             <i className="fas fa-plus" /> Add activity type
//           </button>
//         </div>

//         <div className="ac-modal__foot">
//           <button type="button" className="ac-btn ac-btn--ghost" onClick={onClose}>Cancel</button>
//           <button type="button" className="ac-btn ac-btn--primary" onClick={handleSave}>
//             <i className="fas fa-save" /> Save types
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const ActivityTypeSelector = ({ types, selectedIds = [], onToggle, onClearAll }) => (
//   <div className="ac-activity-picker">
//     <div className="ac-activity-picker__head">
//       <div>
//         <span>Session activity types</span>
//         <small>Optional — select one or more categories</small>
//       </div>
//       {selectedIds.length > 0 && (
//         <button type="button" className="ac-activity-clear" onClick={onClearAll}>
//           Clear all ({selectedIds.length})
//         </button>
//       )}
//     </div>
//     <div className="ac-activity-picker__grid">
//       {types.map((type) => {
//         const isSelected = selectedIds.includes(type.id);
//         return (
//           <button
//             key={type.id}
//             type="button"
//             className={`ac-activity-chip${isSelected ? ' ac-activity-chip--active' : ''}`}
//             style={{
//               '--chip-color': type.color,
//               borderColor: isSelected ? type.color : '#e2e8f0',
//               background: isSelected ? `${type.color}18` : '#fff',
//             }}
//             onClick={() => onToggle(type)}
//           >
//             <span className="ac-activity-chip__dot" style={{ background: type.color }} />
//             <span className="ac-activity-chip__label">{type.name}</span>
//             {isSelected && <i className="fas fa-check ac-activity-chip__check" />}
//           </button>
//         );
//       })}
//     </div>
//   </div>
// );

// const ColorDistributionPanel = ({ distribution, totalSessions }) => {
//   const withSessions = distribution.filter((item) => item.count > 0);
//   const maxCount = Math.max(...distribution.map((item) => item.count), 1);

//   return (
//     <section className="ac-color-distribution">
//       <div className="ac-color-distribution__head">
//         <h3><i className="fas fa-palette" /> Session color distribution</h3>
//         <span>{totalSessions} sessions planned</span>
//       </div>

//       {totalSessions > 0 && (
//         <div className="ac-color-distribution__bar">
//           {withSessions.map((item) => (
//             <div
//               key={item.id}
//               className="ac-color-distribution__segment"
//               style={{
//                 flex: item.count,
//                 background: item.color,
//               }}
//               title={`${item.name}: ${item.count}`}
//             />
//           ))}
//         </div>
//       )}

//       <div className="ac-color-distribution__legend">
//         {distribution.map((item) => (
//           <div key={item.id} className="ac-color-distribution__legend-item">
//             <span className="ac-color-distribution__dot" style={{ background: item.color }} />
//             <div className="ac-color-distribution__legend-text">
//               <strong>{item.name}</strong>
//               <span>{item.count} session{item.count === 1 ? '' : 's'}</span>
//             </div>
//             <div className="ac-color-distribution__meter">
//               <div
//                 className="ac-color-distribution__meter-fill"
//                 style={{
//                   width: `${(item.count / maxCount) * 100}%`,
//                   background: item.color,
//                 }}
//               />
//             </div>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// };

// const getTodayInputValue = () => new Date().toISOString().slice(0, 10);

// const formatSessionDate = (dateValue) => {
//   if (!dateValue) return '';
//   return new Date(dateValue).toLocaleDateString('en-IN');
// };

// const buildTopicSummary = (draft = {}) => {
//   const chapterParts = [];
//   if (draft.chapterNumber?.toString().trim()) {
//     chapterParts.push(`Ch. ${draft.chapterNumber.toString().trim()}`);
//   }
//   if (draft.chapterName?.trim()) chapterParts.push(draft.chapterName.trim());
//   const chapterLine = chapterParts.join(' — ');
//   const sub = draft.subTopics?.trim() || '';
//   if (chapterLine && sub) return `${chapterLine}: ${sub}`;
//   return chapterLine || sub || draft.topicCovered?.trim() || '';
// };

// const getNextSessionNumber = (sessions = []) => {
//   const nums = sessions
//     .map((s) => parseInt(String(s.sessionNumber ?? ''), 10))
//     .filter((n) => Number.isFinite(n));
//   if (nums.length) return String(Math.max(...nums) + 1);
//   return String(sessions.length + 1);
// };

// const formatChapterLabel = (session = {}) => {
//   const num = session.chapterNumber?.toString().trim();
//   const name = session.chapterName?.trim();
//   if (num && name) return `Ch. ${num} — ${name}`;
//   if (num) return `Ch. ${num}`;
//   return name || '';
// };

// const parseSubTopics = (raw = '') => (
//   String(raw)
//     .split(/\n|,/)
//     .map((item) => item.trim())
//     .filter(Boolean)
// );

// const hasUnitInfo = (session = {}) => (
//   !!(session.unitNumber?.toString().trim() || session.unitName?.trim())
// );

// const hasChapterInfo = (session = {}) => (
//   !!(session.chapterNumber?.toString().trim() || session.chapterName?.trim())
// );

// const getUnitLabel = (session = {}) => {
//   if (!hasUnitInfo(session)) return '';
//   const num = session.unitNumber?.toString().trim();
//   const name = session.unitName?.trim();
//   if (num && name) return `Unit ${num} — ${name}`;
//   if (num) return `Unit ${num}`;
//   return name;
// };

// const mergeSubTopics = (target = [], raw = '') => {
//   parseSubTopics(raw).forEach((topic) => {
//     if (!target.includes(topic)) target.push(topic);
//   });
//   return target;
// };

// const compareSessionsForToc = (a, b) => {
//   const unitA = parseInt(String(a.unitNumber ?? ''), 10);
//   const unitB = parseInt(String(b.unitNumber ?? ''), 10);
//   if (Number.isFinite(unitA) && Number.isFinite(unitB) && unitA !== unitB) return unitA - unitB;
//   const chA = parseInt(String(a.chapterNumber ?? ''), 10);
//   const chB = parseInt(String(b.chapterNumber ?? ''), 10);
//   if (Number.isFinite(chA) && Number.isFinite(chB) && chA !== chB) return chA - chB;
//   const sesA = parseInt(String(a.sessionNumber ?? ''), 10);
//   const sesB = parseInt(String(b.sessionNumber ?? ''), 10);
//   if (Number.isFinite(sesA) && Number.isFinite(sesB)) return sesA - sesB;
//   return 0;
// };

// const buildCourseToc = (sessions = []) => {
//   const directSessions = [];
//   const looseChaptersMap = new Map();
//   const unitsMap = new Map();

//   [...sessions].sort(compareSessionsForToc).forEach((session) => {
//     const withUnit = hasUnitInfo(session);
//     const withChapter = hasChapterInfo(session);

//     if (!withUnit && !withChapter) {
//       directSessions.push(session);
//       return;
//     }

//     if (!withUnit && withChapter) {
//       const chapterKey = `${session.chapterNumber || ''}::${session.chapterName || ''}`;
//       if (!looseChaptersMap.has(chapterKey)) {
//         looseChaptersMap.set(chapterKey, {
//           key: chapterKey,
//           chapterNumber: session.chapterNumber?.toString().trim() || '',
//           chapterName: session.chapterName?.trim() || '',
//           subTopics: [],
//           sessions: [],
//         });
//       }
//       const chapter = looseChaptersMap.get(chapterKey);
//       mergeSubTopics(chapter.subTopics, session.subTopics);
//       chapter.sessions.push(session);
//       return;
//     }

//     const unitKey = `${session.unitNumber || ''}::${session.unitName || ''}`;
//     if (!unitsMap.has(unitKey)) {
//       unitsMap.set(unitKey, {
//         key: unitKey,
//         unitNumber: session.unitNumber?.toString().trim() || '',
//         unitName: session.unitName?.trim() || '',
//         directSessions: [],
//         chapters: new Map(),
//       });
//     }
//     const unit = unitsMap.get(unitKey);

//     if (withUnit && !withChapter) {
//       unit.directSessions.push(session);
//       return;
//     }

//     const chapterKey = `${session.chapterNumber || ''}::${session.chapterName || ''}`;
//     if (!unit.chapters.has(chapterKey)) {
//       unit.chapters.set(chapterKey, {
//         key: chapterKey,
//         chapterNumber: session.chapterNumber?.toString().trim() || '',
//         chapterName: session.chapterName?.trim() || '',
//         subTopics: [],
//         sessions: [],
//       });
//     }
//     const chapter = unit.chapters.get(chapterKey);
//     mergeSubTopics(chapter.subTopics, session.subTopics);
//     chapter.sessions.push(session);
//   });

//   return {
//     directSessions,
//     looseChapters: Array.from(looseChaptersMap.values()),
//     units: Array.from(unitsMap.values()).map((unit) => ({
//       ...unit,
//       chapters: Array.from(unit.chapters.values()),
//     })),
//   };
// };

// const isTocEmpty = (tree = {}) => (
//   !tree.directSessions?.length && !tree.looseChapters?.length && !tree.units?.length
// );

// const loadStoredSessions = (batchId) => {
//   if (!batchId) return [];
//   try {
//     const raw = localStorage.getItem(`${STORAGE_PREFIX}${batchId}`);
//     if (!raw) return [];
//     const parsed = JSON.parse(raw);
//     return Array.isArray(parsed) ? parsed : [];
//   } catch {
//     return [];
//   }
// };

// const persistStoredSessions = () => {
//   // no-op: sessions are persisted via /college/session-plans API
// };

// const createEmptySessionDraft = () => ({
//   id: '',
//   title: '',
//   sessionNumber: '',
//   hours: '',
//   subSessions: '',
//   subSessionName: '',
//   duration: '',
//   unitNumber: '',
//   unitName: '',
//   chapterNumber: '',
//   chapterName: '',
//   subTopics: '',
//   topicCovered: '',
//   trainingMethod: '',
//   classroomLabResources: '',
//   standardTlm: [],
//   trainerBasedTlm: [],
//   sessionDate: getTodayInputValue(),
//   startTime: '10:00',
//   endTime: '12:00',
//   seniorTrainerId: '',
//   seniorTrainerName: '',
//   sessionType: SESSION_TYPE.STUDENT,
//   includeTot: true,
//   totUseSameTopics: true,
//   totTopicCovered: '',
//   totTrainingMethod: '',
//   fieldTrainerId: '',
//   fieldTrainerName: '',
//   requireTotCompletionProofs: false,
//   totTrainerId: '',
//   totTrainerName: '',
//   totStatus: 'pending',
//   totCompletionProofs: [],
//   totQuestionBank: [],
//   totQuestionBankLastUpdated: '',
//   sessionActivities: [],
//   notes: '',
//   evidenceDocs: [],
//   learningMaterials: [],
//   totMaterials: [],
//   workflowStatus: WORKFLOW_STATUS.SCHEDULED,
// });

// const buildContextFromFilters = (filters, labels) => ({
//   department: filters.department,
//   project: filters.project,
//   center: filters.center,
//   course: filters.course,
//   batch: filters.batch,
//   departmentName: labels.departmentName,
//   projectName: labels.projectName,
//   centerName: labels.centerName,
//   courseTrade: labels.courseTrade,
//   batchCode: labels.batchCode,
//   studentCount: labels.studentCount,
// });

// /** Demo sessions — shows Course → Chapter → Sub topics → Session structure */
// const createDummySessions = (context = {}) => {
//   const courseName = context.courseTrade || 'Retail Sales Associate';
//   const batchName = context.batchCode || 'Batch-2026-Jan';
//   const today = getTodayInputValue();
//   const dateLabel = formatSessionDate(today);

//   const base = {
//     sessionType: SESSION_TYPE.STUDENT,
//     sessionDate: today,
//     date: dateLabel,
//     seniorTrainerId: '',
//     seniorTrainerName: '',
//     fieldTrainerId: '',
//     fieldTrainerName: '',
//     totTrainerId: '',
//     totTrainerName: '',
//     totStatus: 'pending',
//     sessionActivities: [{ id: 'act-1', name: 'Classroom Session', color: '#2563eb' }],
//     evidenceDocs: [
//       { id: 'ev-d1.1', name: 'Session plan PDF', type: 'PDF', status: 'Pending', requirement: DOC_REQUIREMENT.MANDATORY },
//     ],
//     learningMaterials: [
//       { id: 'lm-d.1', name: 'Chapter handbook', type: 'PDF', requirement: DOC_REQUIREMENT.MANDATORY },
//     ],
//     notes: 'Dummy session — for structure preview only.',
//     workflowStatus: WORKFLOW_STATUS.SCHEDULED,
//     createdAt: new Date().toISOString(),
//     ...context,
//     courseTrade: courseName,
//     batchCode: batchName,
//   };

//   const session1Draft = {
//     unitNumber: '1',
//     unitName: 'Foundation Skills',
//     sessionNumber: '1',
//     chapterNumber: '1',
//     chapterName: 'Introduction to Retail',
//     subTopics: 'Store layout basics\nCustomer greeting\nProduct display rules',
//     title: 'Store orientation and customer greeting',
//     trainingMethod: 'Classroom + Demo',
//     startTime: '10:00',
//     endTime: '12:00',
//     includeTot: true,
//     totUseSameTopics: true,
//     requireTotCompletionProofs: true,
//     totCompletionProofs: [
//       { id: 'tcp-d.1', name: 'Signed TOT certificate', type: 'PDF', requirement: DOC_REQUIREMENT.MANDATORY },
//     ],
//     totMaterials: [
//       { id: 'tot-d.1', name: 'Trainer delivery guide', type: 'PDF', requirement: DOC_REQUIREMENT.MANDATORY },
//     ],
//   };

//   const session2Draft = {
//     unitNumber: '1',
//     unitName: 'Foundation Skills',
//     sessionNumber: '2',
//     chapterNumber: '2',
//     chapterName: 'Product Knowledge',
//     subTopics: 'Product categories, Features and benefits, Upselling techniques',
//     title: 'Product categories and selling points',
//     trainingMethod: 'Interactive Learning',
//     startTime: '14:00',
//     endTime: '16:00',
//     includeTot: true,
//     totUseSameTopics: false,
//     totTopicCovered: 'Trainer delivery methods for product knowledge module',
//     totTrainingMethod: 'TOT workshop + role-play',
//     requireTotCompletionProofs: true,
//     totCompletionProofs: [
//       { id: 'tcp-d.2', name: 'TOT attendance sheet', type: 'PDF', requirement: DOC_REQUIREMENT.MANDATORY },
//     ],
//     totMaterials: [
//       { id: 'tot-d.2', name: 'Product trainer kit', type: 'PDF', requirement: DOC_REQUIREMENT.MANDATORY },
//     ],
//     workflowStatus: WORKFLOW_STATUS.SENT_TO_SENIOR,
//   };

//   const session3Draft = {
//     unitNumber: '2',
//     unitName: 'Advanced Skills',
//     sessionNumber: '3',
//     chapterNumber: '3',
//     chapterName: 'Customer Handling',
//     subTopics: 'Objection handling\nClosing techniques\nRole-play practice',
//     title: 'Role-play — objection handling',
//     trainingMethod: 'Practical / Lab',
//     startTime: '09:00',
//     endTime: '11:00',
//     includeTot: false,
//     totUseSameTopics: false,
//     requireTotCompletionProofs: false,
//     totCompletionProofs: [],
//     totMaterials: [],
//   };

//   const session4Draft = {
//     sessionNumber: '4',
//     title: 'Batch orientation briefing',
//     trainingMethod: 'Discussion',
//     startTime: '11:30',
//     endTime: '12:30',
//     includeTot: false,
//     notes: 'Session only — no unit or chapter.',
//   };

//   const session5Draft = {
//     unitNumber: '3',
//     unitName: 'Soft Skills',
//     sessionNumber: '5',
//     title: 'Communication and teamwork',
//     trainingMethod: 'Classroom',
//     startTime: '15:00',
//     endTime: '16:00',
//     includeTot: false,
//     notes: 'Unit only — no chapter.',
//   };

//   const session6Draft = {
//     sessionNumber: '6',
//     chapterNumber: '4',
//     chapterName: 'Safety protocols',
//     subTopics: 'Fire safety\nFirst aid basics',
//     title: 'Workplace safety overview',
//     trainingMethod: 'Classroom + Demo',
//     startTime: '09:30',
//     endTime: '10:30',
//     includeTot: false,
//     notes: 'Chapter only — no unit.',
//   };

//   return [
//     {
//       ...base,
//       ...session1Draft,
//       id: `DUMMY-${Date.now()}-1`,
//       topicCovered: buildTopicSummary(session1Draft),
//     },
//     {
//       ...base,
//       ...session2Draft,
//       id: `DUMMY-${Date.now()}-2`,
//       topicCovered: buildTopicSummary(session2Draft),
//     },
//     {
//       ...base,
//       ...session3Draft,
//       id: `DUMMY-${Date.now()}-3`,
//       topicCovered: buildTopicSummary(session3Draft),
//     },
//     {
//       ...base,
//       ...session4Draft,
//       id: `DUMMY-${Date.now()}-4`,
//       topicCovered: buildTopicSummary(session4Draft),
//     },
//     {
//       ...base,
//       ...session5Draft,
//       id: `DUMMY-${Date.now()}-5`,
//       topicCovered: buildTopicSummary(session5Draft),
//     },
//     {
//       ...base,
//       ...session6Draft,
//       id: `DUMMY-${Date.now()}-6`,
//       topicCovered: buildTopicSummary(session6Draft),
//     },
//   ];
// };

// const TocSessionButton = ({ session, selectedSessionId, onSelectSession }) => {
//   const isActive = selectedSessionId === session.id;
//   return (
//     <button
//       type="button"
//       className={`ac-toc-item ac-toc-item--session${isActive ? ' ac-toc-item--session-active' : ''}`}
//       onClick={() => onSelectSession(session.id)}
//     >
//       <i className="fas fa-play-circle ac-toc-item__session-icon" />
//       <div>
//         <span>Session {session.sessionNumber || '—'}</span>
//         <strong>{session.title || 'Untitled session'}</strong>
//       </div>
//     </button>
//   );
// };

// const TocChapterBlock = ({
//   chapter,
//   expandKey,
//   expanded,
//   onToggle,
//   selectedSessionId,
//   onSelectSession,
// }) => (
//   <div className="ac-toc-chapter">
//     <button type="button" className="ac-toc-item ac-toc-item--chapter" onClick={() => onToggle(expandKey)}>
//       <i className={`fas fa-chevron-${expanded ? 'down' : 'right'} ac-toc-item__chevron`} />
//       <div>
//         <span>{chapter.chapterNumber ? `Ch. ${chapter.chapterNumber}` : 'Chapter'}</span>
//         <strong>{chapter.chapterName || formatChapterLabel(chapter) || 'Untitled chapter'}</strong>
//       </div>
//     </button>
//     {expanded && (
//       <div className="ac-toc-nested ac-toc-nested--chapter">
//         {chapter.subTopics.map((topic) => (
//           <div key={topic} className="ac-toc-item ac-toc-item--subtopic">
//             <i className="fas fa-circle ac-toc-item__dot" />
//             <span>{topic}</span>
//           </div>
//         ))}
//         {chapter.sessions.map((session) => (
//           <TocSessionButton
//             key={session.id}
//             session={session}
//             selectedSessionId={selectedSessionId}
//             onSelectSession={onSelectSession}
//           />
//         ))}
//       </div>
//     )}
//   </div>
// );

// const CourseTableOfContents = ({
//   courseName,
//   batchName,
//   tree = {},
//   selectedSessionId,
//   onSelectSession,
// }) => {
//   const { directSessions = [], looseChapters = [], units = [] } = tree;

//   const [expanded, setExpanded] = useState(() => {
//     const initial = { course: true, 'group:direct': true };
//     directSessions.forEach((session) => { initial[`session:${session.id}`] = true; });
//     looseChapters.forEach((chapter) => { initial[`loose:${chapter.key}`] = true; });
//     units.forEach((unit) => {
//       initial[`unit:${unit.key}`] = true;
//       unit.chapters.forEach((chapter) => {
//         initial[`chapter:${unit.key}:${chapter.key}`] = true;
//       });
//     });
//     return initial;
//   });

//   useEffect(() => {
//     setExpanded((prev) => {
//       const next = { ...prev, course: true };
//       if (directSessions.length) next['group:direct'] = prev['group:direct'] ?? true;
//       looseChapters.forEach((chapter) => {
//         next[`loose:${chapter.key}`] = prev[`loose:${chapter.key}`] ?? true;
//       });
//       units.forEach((unit) => {
//         next[`unit:${unit.key}`] = prev[`unit:${unit.key}`] ?? true;
//         unit.chapters.forEach((chapter) => {
//           next[`chapter:${unit.key}:${chapter.key}`] = prev[`chapter:${unit.key}:${chapter.key}`] ?? true;
//         });
//       });
//       return next;
//     });
//   }, [tree, directSessions, looseChapters, units]);

//   const toggle = (key) => {
//     setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
//   };

//   return (
//     <aside className="ac-toc-panel">
//       <div className="ac-toc-panel__head">
//         <h4><i className="fas fa-list-ul" /> Table of contents</h4>
//         <p>Flexible: session only, unit, chapter, or full hierarchy</p>
//       </div>

//       <div className="ac-toc-panel__body">
//         <button
//           type="button"
//           className="ac-toc-item ac-toc-item--course"
//           onClick={() => toggle('course')}
//         >
//           <i className={`fas fa-chevron-${expanded.course ? 'down' : 'right'} ac-toc-item__chevron`} />
//           <div>
//             <span>Course</span>
//             <strong>{courseName || '—'}</strong>
//           </div>
//         </button>

//         {expanded.course && (
//           <div className="ac-toc-nested">
//             <div className="ac-toc-item ac-toc-item--batch">
//               <span>Batch</span>
//               <strong>{batchName || '—'}</strong>
//             </div>

//             {isTocEmpty(tree) ? (
//               <p className="ac-toc-empty">No sessions yet. Create a plan or load demo data.</p>
//             ) : (
//               <>
//                 {directSessions.length > 0 && (
//                   <div className="ac-toc-group">
//                     {directSessions.map((session) => (
//                       <TocSessionButton
//                         key={session.id}
//                         session={session}
//                         selectedSessionId={selectedSessionId}
//                         onSelectSession={onSelectSession}
//                       />
//                     ))}
//                   </div>
//                 )}

//                 {looseChapters.map((chapter) => (
//                   <TocChapterBlock
//                     key={chapter.key}
//                     chapter={chapter}
//                     expandKey={`loose:${chapter.key}`}
//                     expanded={expanded[`loose:${chapter.key}`]}
//                     onToggle={toggle}
//                     selectedSessionId={selectedSessionId}
//                     onSelectSession={onSelectSession}
//                   />
//                 ))}

//                 {units.map((unit) => {
//                   const unitKey = `unit:${unit.key}`;
//                   const unitLabel = getUnitLabel(unit) || 'Unit';
//                   return (
//                     <div key={unit.key} className="ac-toc-unit">
//                       <button type="button" className="ac-toc-item ac-toc-item--unit" onClick={() => toggle(unitKey)}>
//                         <i className={`fas fa-chevron-${expanded[unitKey] ? 'down' : 'right'} ac-toc-item__chevron`} />
//                         <div>
//                           <span>{unit.unitNumber ? `Unit ${unit.unitNumber}` : 'Unit'}</span>
//                           <strong>{unit.unitName || unitLabel}</strong>
//                         </div>
//                       </button>

//                       {expanded[unitKey] && (
//                         <div className="ac-toc-nested ac-toc-nested--unit">
//                           {unit.directSessions?.map((session) => (
//                             <TocSessionButton
//                               key={session.id}
//                               session={session}
//                               selectedSessionId={selectedSessionId}
//                               onSelectSession={onSelectSession}
//                             />
//                           ))}
//                           {unit.chapters?.map((chapter) => (
//                             <TocChapterBlock
//                               key={chapter.key}
//                               chapter={chapter}
//                               expandKey={`chapter:${unit.key}:${chapter.key}`}
//                               expanded={expanded[`chapter:${unit.key}:${chapter.key}`]}
//                               onToggle={toggle}
//                               selectedSessionId={selectedSessionId}
//                               onSelectSession={onSelectSession}
//                             />
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </>
//             )}
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// };

// const SessionDetailSidePanel = ({
//   session,
//   canEdit,
//   onClose,
//   onEdit,
//   onDelete,
//   onOpenReferModal,
// }) => {
//   if (!session) {
//     return (
//       <aside className="ac-side-panel ac-side-panel--empty">
//         <div className="ac-side-panel__empty">
//           <i className="fas fa-hand-pointer" />
//           <h4>Select a session</h4>
//           <p>Click a session in the table of contents to view details here.</p>
//         </div>
//       </aside>
//     );
//   }

//   const tone = STATUS_TONE[session.workflowStatus] || 'blue';
//   const timeRange = `${session.startTime || '—'} – ${session.endTime || '—'}`;
//   const evidenceCounts = countMaterialsByRequirement(session.evidenceDocs);
//   const learningCounts = countMaterialsByRequirement(session.learningMaterials);
//   const pendingAssignment = 'Pending — Senior Trainer will assign';
//   const linkedTot = hasLinkedTot(session);
//   const totTopicLabel = linkedTot ? getTotDisplayTopic(session) : '';
//   const activities = getSessionActivities(session);
//   const primaryColor = activities[0]?.color || BLUE;
//   const subTopicLines = parseSubTopics(session.subTopics);

//   return (
//     <aside className="ac-side-panel">
//       <div className="ac-side-panel__head" style={{ borderLeftColor: primaryColor }}>
//         <div>
//           <span className="ac-side-panel__label">
//             <i className="fas fa-eye" /> Session detail
//           </span>
//           <h4>
//             {session.sessionNumber ? `Session ${session.sessionNumber}: ` : ''}
//             {session.title}
//           </h4>
//           <span className={`ac-status-pill ac-status-pill--${tone}`}>{session.workflowStatus}</span>
//         </div>
//         <button type="button" className="ac-side-panel__close" onClick={onClose} aria-label="Close panel">
//           <i className="fas fa-times" />
//         </button>
//       </div>

//       <div className="ac-side-panel__body">
//         {(hasUnitInfo(session) || hasChapterInfo(session) || subTopicLines.length > 0) && (
//           <div className="ac-side-panel__section">
//             <h5>Structure</h5>
//             {hasUnitInfo(session) && (
//               <div className="ac-side-panel__grid ac-side-panel__grid--single">
//                 <div><em>Unit</em><strong>{getUnitLabel(session)}</strong></div>
//               </div>
//             )}
//             {hasChapterInfo(session) && (
//               <div className="ac-side-panel__grid ac-side-panel__grid--single">
//                 <div><em>Chapter</em><strong>{formatChapterLabel(session) || '—'}</strong></div>
//               </div>
//             )}
//             {subTopicLines.length > 0 && (
//               <div className="ac-side-panel__subtopics">
//                 <em>Sub topics</em>
//                 <ul>
//                   {subTopicLines.map((topic) => (
//                     <li key={topic}>{topic}</li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </div>
//         )}

//         <div className="ac-side-panel__section">
//           <h5>Course &amp; batch</h5>
//           <div className="ac-side-panel__grid">
//             <div><em>Course</em><strong>{session.courseTrade || '—'}</strong></div>
//             <div><em>Batch</em><strong>{session.batchCode || '—'}</strong></div>
//           </div>
//         </div>

//         <div className="ac-side-panel__section">
//           <h5>Session details</h5>
//           <div className="ac-side-panel__grid">
//             <div><em>Session Number</em><strong>{session.sessionNumber || '—'}</strong></div>
//             <div><em>Session Name</em><strong>{session.title || '—'}</strong></div>
//             <div><em>Hrs.</em><strong>{session.hours || '—'}</strong></div>
//             <div><em>Sub Sessions</em><strong>{session.subSessions || '—'}</strong></div>
//             <div><em>Sub Session Name</em><strong>{session.subSessionName || '—'}</strong></div>
//             <div><em>Duration</em><strong>{session.duration || '—'}</strong></div>
//             <div><em>Teaching Method</em><strong>{session.trainingMethod || '—'}</strong></div>
//           </div>
//           {session.topicCovered && (
//             <div className="ac-side-panel__grid ac-side-panel__grid--single" style={{ marginTop: 10 }}>
//               <div><em>Topics Covered</em><strong style={{ whiteSpace: 'pre-wrap' }}>{session.topicCovered}</strong></div>
//             </div>
//           )}
//           {session.classroomLabResources && (
//             <div className="ac-side-panel__grid ac-side-panel__grid--single" style={{ marginTop: 10 }}>
//               <div><em>Class Room &amp; Lab Resources</em><strong style={{ whiteSpace: 'pre-wrap' }}>{session.classroomLabResources}</strong></div>
//             </div>
//           )}
//           {normalizeTlmList(session.standardTlm).length > 0 && (
//             <div className="ac-side-panel__grid ac-side-panel__grid--single" style={{ marginTop: 10 }}>
//               <div>
//                 <em>Standard TLM</em>
//                 <strong>
//                   {normalizeTlmList(session.standardTlm).map((item) => item.name).filter(Boolean).join(', ')}
//                 </strong>
//               </div>
//             </div>
//           )}
//           {normalizeTlmList(session.trainerBasedTlm).length > 0 && (
//             <div className="ac-side-panel__grid ac-side-panel__grid--single" style={{ marginTop: 10 }}>
//               <div>
//                 <em>Trainer based TLM</em>
//                 <strong>
//                   {normalizeTlmList(session.trainerBasedTlm).map((item) => item.name).filter(Boolean).join(', ')}
//                 </strong>
//               </div>
//             </div>
//           )}
//         </div>



//         <div className="ac-side-panel__section">
//           <h5>Activity &amp; TOT</h5>
//           <div className="ac-side-panel__badges">
//             {activities.map((activity) => (
//               <span key={activity.id} className="ac-activity-badge" style={{ background: activity.color }}>
//                 {activity.name}
//               </span>
//             ))}
//             {linkedTot && <span className="ac-session-type-badge ac-session-type-badge--tot">TOT Linked</span>}
//           </div>
//           {linkedTot && (
//             <div className="ac-side-panel__grid ac-side-panel__grid--tot">
//               <div><em>TOT topics</em><strong>{totTopicLabel || '—'}</strong></div>
//               <div><em>TOT trainer</em><strong>{session.totTrainerName || pendingAssignment}</strong></div>
//             </div>
//           )}
//         </div>

//         <div className="ac-side-panel__section">
//           <h5>Trainers</h5>
//           <div className="ac-side-panel__grid">
//             <div><em>Field trainer</em><strong>{session.fieldTrainerName || pendingAssignment}</strong></div>
//           </div>
//         </div>

//         <div className="ac-side-panel__section">
//           <h5>Materials</h5>
//           <div className="ac-side-panel__grid">
//             <div><em>Documents</em><strong>{evidenceCounts.total || '—'}</strong></div>
//             <div><em>Learning material</em><strong>{learningCounts.total || '—'}</strong></div>
//           </div>
//         </div>

//         {session.notes && (
//           <div className="ac-side-panel__section">
//             <h5>Notes</h5>
//             <p className="ac-side-panel__notes">{session.notes}</p>
//           </div>
//         )}
//       </div>

//       <footer className="ac-side-panel__foot">
//         <button type="button" className="ac-btn ac-btn--ghost ac-btn--sm" disabled={!canEdit} onClick={() => onEdit(session)}>
//           <i className="far fa-edit" /> Edit
//         </button>
//         <button type="button" className="ac-btn ac-btn--ghost ac-btn--sm ac-btn--danger" disabled={!canEdit} onClick={() => onDelete(session)}>
//           <i className="fas fa-trash" /> Delete
//         </button>
//         {session.workflowStatus === WORKFLOW_STATUS.SCHEDULED && (
//           <button type="button" className="ac-btn ac-btn--outline ac-btn--sm" onClick={() => onOpenReferModal(session)}>
//             <i className="fas fa-paper-plane" /> Refer Session
//           </button>
//         )}
//       </footer>
//     </aside>
//   );
// };

// const SessionPathPicker = ({
//   filters,
//   currentStep,
//   options,
//   loading = false,
//   getLabel,
//   onSelect,
//   onBack,
//   onReset,
// }) => {
//   const stepMeta = SESSION_PATH_STEPS.find((step) => step.key === currentStep) || SESSION_PATH_STEPS[0];
//   const completedSteps = SESSION_PATH_STEPS.filter(({ key }) => filters[key]);

//   return (
//     <section className="ac-path-picker">
//       <div className="ac-path-picker__intro">
//         <div>
//           <span className="ac-path-picker__badge">Step {stepMeta.step} of 5</span>
//           <h3>Select {stepMeta.label}</h3>
//           <p>{stepMeta.hint}</p>
//         </div>
//         {completedSteps.length > 0 && (
//           <div className="ac-path-picker__actions">
//             <button type="button" className="ac-path-picker__back" onClick={onBack}>
//               <i className="fas fa-arrow-left" /> Back
//             </button>
//             <button type="button" className="ac-path-picker__reset" onClick={onReset}>
//               Start over
//             </button>
//           </div>
//         )}
//       </div>

//       {completedSteps.length > 0 && (
//         <div className="ac-path-picker__trail">
//           {completedSteps.map(({ key, label, icon }, index) => (
//             <React.Fragment key={key}>
//               {index > 0 && <i className="fas fa-chevron-right" />}
//               <span className="ac-path-picker__crumb">
//                 <i className={`fas ${icon}`} />
//                 <em>{label}</em>
//                 <strong>{getLabel(key, filters[key])}</strong>
//               </span>
//             </React.Fragment>
//           ))}
//         </div>
//       )}

//       {loading ? (
//         <div className="ac-path-picker__loading">
//           <i className="fas fa-spinner fa-spin" />
//           <p>Loading {stepMeta.label.toLowerCase()}...</p>
//         </div>
//       ) : options.length === 0 ? (
//         <div className="ac-path-picker__empty">
//           <i className={`fas ${stepMeta.icon}`} />
//           <p>No {stepMeta.label.toLowerCase()} found for this selection.</p>
//           {completedSteps.length > 0 && (
//             <button type="button" className="ac-path-picker__back" onClick={onBack}>
//               <i className="fas fa-arrow-left" /> Go back
//             </button>
//           )}
//         </div>
//       ) : (
//         <div className="ac-path-picker__grid">
//           {options.map((option) => (
//             <button
//               key={option.value}
//               type="button"
//               className="ac-path-card-btn"
//               onClick={() => onSelect(currentStep, option.value)}
//             >
//               <div className="ac-path-card-btn__icon">
//                 <i className={`fas ${stepMeta.icon}`} />
//               </div>
//               <strong>{option.label}</strong>
//               {option.meta && <span>{option.meta}</span>}
//               <i className="fas fa-arrow-right ac-path-card-btn__arrow" />
//             </button>
//           ))}
//         </div>
//       )}
//     </section>
//   );
// };

// const SessionPlanModal = ({
//   draft,
//   isEdit,
//   batchSummary,
//   courseStructure = DEFAULT_COURSE_STRUCTURE,
//   onClose,
//   onSave,
//   onFieldChange,
//   onEvidenceChange,
//   onAddEvidence,
//   onRemoveEvidence,
//   onLearningMaterialChange,
//   onAddLearningMaterial,
//   onRemoveLearningMaterial,
//   onStandardTlmChange,
//   onAddStandardTlm,
//   onRemoveStandardTlm,
//   onTrainerBasedTlmChange,
//   onAddTrainerBasedTlm,
//   onRemoveTrainerBasedTlm,
//   onTotMaterialChange,
//   onAddTotMaterial,
//   onRemoveTotMaterial,
//   onTotCompletionProofChange,
//   onAddTotCompletionProof,
//   onRemoveTotCompletionProof,
//   onTotQuestionChange,
//   onTotQuestionOptionChange,
//   onAddTotQuestion,
//   onRemoveTotQuestion,
//   activityTypes,
//   onActivityTypeToggle,
//   onClearActivityTypes,
// }) => {
//   if (!draft) return null;

//   const showUnit = courseStructure.unit === true;
//   const showChapter = courseStructure.chapter === true;
//   const structurePathLabel = buildStructurePathLabel(courseStructure);

//   return (
//     <div className="ac-modal-backdrop">
//       <div className="ac-modal" role="dialog" aria-modal="true">
//         <div className="ac-modal__head">
//           <div>
//             <h5>{isEdit ? 'Edit Session Plan' : 'Create Session Plan'}</h5>
//             <span>Academic Coordinator · Student session + optional linked TOT</span>
//           </div>
//           <button type="button" className="ac-modal__close" onClick={onClose} aria-label="Close">
//             <i className="fas fa-times" />
//           </button>
//         </div>

//         <div className="ac-modal__body">
//           {batchSummary && (
//             <div className="ac-modal__context">
//               <i className="fas fa-route" /> {batchSummary}
//             </div>
//           )}

//           <div className="ac-course-context">
//             <div>
//               <span>Course</span>
//               <strong>{draft.courseTrade || '—'}</strong>
//             </div>
//             {draft.batchCode && (
//               <div>
//                 <span>Batch</span>
//                 <strong>{draft.batchCode}</strong>
//               </div>
//             )}
//             <div>
//               <span>Planning path</span>
//               <strong>{structurePathLabel}</strong>
//             </div>
//           </div>

//           <ActivityTypeSelector
//             types={activityTypes}
//             selectedIds={(draft.sessionActivities?.length
//               ? draft.sessionActivities
//               : getSessionActivities(draft)
//             ).map((activity) => activity.id)}
//             onToggle={onActivityTypeToggle}
//             onClearAll={onClearActivityTypes}
//           />

//           {showUnit && (
//             <>
//               <div className="ac-section-label">
//                 <i className="fas fa-layer-group" /> Unit
//               </div>

//               <div className="ac-form-grid">
//                 <label className="ac-field">
//                   <span>Unit number</span>
//                   <input
//                     className="ac-input"
//                     type="text"
//                     inputMode="numeric"
//                     placeholder="e.g. 1"
//                     value={draft.unitNumber || ''}
//                     onChange={(e) => onFieldChange('unitNumber', e.target.value)}
//                   />
//                 </label>
//                 <label className="ac-field ac-field--span-2">
//                   <span>Unit name</span>
//                   <input
//                     className="ac-input"
//                     placeholder="e.g. Foundation Skills"
//                     value={draft.unitName || ''}
//                     onChange={(e) => onFieldChange('unitName', e.target.value)}
//                   />
//                 </label>
//               </div>
//             </>
//           )}

//           {showChapter && (
//             <>
//               <div className="ac-section-label">
//                 <i className="fas fa-book" /> Chapter details
//               </div>

//               <div className="ac-form-grid">
//                 <label className="ac-field">
//                   <span>Chapter number</span>
//                   <input
//                     className="ac-input"
//                     type="text"
//                     inputMode="numeric"
//                     placeholder="e.g. 1"
//                     value={draft.chapterNumber || ''}
//                     onChange={(e) => onFieldChange('chapterNumber', e.target.value)}
//                   />
//                 </label>
//                 <label className="ac-field ac-field--span-2">
//                   <span>Chapter name</span>
//                   <input
//                     className="ac-input"
//                     placeholder="e.g. Introduction to Retail Sales"
//                     value={draft.chapterName || ''}
//                     onChange={(e) => onFieldChange('chapterName', e.target.value)}
//                   />
//                 </label>
//                 <label className="ac-field ac-field--full">
//                   <span>Sub topics</span>
//                   <textarea
//                     className="ac-input ac-input--textarea"
//                     rows="3"
//                     placeholder="List sub topics — one per line or comma separated"
//                     value={draft.subTopics || ''}
//                     onChange={(e) => onFieldChange('subTopics', e.target.value)}
//                   />
//                 </label>
//               </div>
//             </>
//           )}

//           <div className="ac-section-label">
//             <i className="fas fa-user-graduate" /> Session details
//           </div>

//           <div className="ac-form-grid">
//             <label className="ac-field">
//               <span>Session Number</span>
//               <input
//                 className="ac-input"
//                 type="text"
//                 inputMode="numeric"
//                 placeholder="e.g. 1"
//                 value={draft.sessionNumber || ''}
//                 onChange={(e) => onFieldChange('sessionNumber', e.target.value)}
//               />
//             </label>
//             <label className="ac-field ac-field--span-2">
//               <span>Session Name *</span>
//               <input
//                 className="ac-input"
//                 placeholder="e.g. Product categories and selling points"
//                 value={draft.title}
//                 onChange={(e) => onFieldChange('title', e.target.value)}
//               />
//             </label>
//             <label className="ac-field">
//               <span>Hrs.</span>
//               <input
//                 className="ac-input"
//                 type="text"
//                 inputMode="decimal"
//                 placeholder="e.g. 2"
//                 value={draft.hours || ''}
//                 onChange={(e) => onFieldChange('hours', e.target.value)}
//               />
//             </label>
//             <label className="ac-field">
//               <span>Sub Sessions</span>
//               <input
//                 className="ac-input"
//                 type="text"
//                 inputMode="numeric"
//                 placeholder="e.g. 2"
//                 value={draft.subSessions || ''}
//                 onChange={(e) => onFieldChange('subSessions', e.target.value)}
//               />
//             </label>
//             <label className="ac-field">
//               <span>Sub Session Name</span>
//               <input
//                 className="ac-input"
//                 placeholder="e.g. Greeting practice"
//                 value={draft.subSessionName || ''}
//                 onChange={(e) => onFieldChange('subSessionName', e.target.value)}
//               />
//             </label>
//             <label className="ac-field">
//               <span>Duration</span>
//               <input
//                 className="ac-input"
//                 placeholder="e.g. 45 min"
//                 value={draft.duration || ''}
//                 onChange={(e) => onFieldChange('duration', e.target.value)}
//               />
//             </label>
//             <label className="ac-field ac-field--full">
//               <span>Topics Covered</span>
//               <textarea
//                 className="ac-input ac-input--textarea"
//                 rows="3"
//                 placeholder="List topics covered in this session"
//                 value={draft.topicCovered || ''}
//                 onChange={(e) => onFieldChange('topicCovered', e.target.value)}
//               />
//             </label>
//             <label className="ac-field ac-field--span-2">
//               <span>Teaching Method</span>
//               <input
//                 className="ac-input"
//                 placeholder="Classroom, practical, role-play..."
//                 value={draft.trainingMethod}
//                 onChange={(e) => onFieldChange('trainingMethod', e.target.value)}
//               />
//             </label>
//             <label className="ac-field ac-field--full">
//               <span>Class Room &amp; Lab Resources</span>
//               <textarea
//                 className="ac-input ac-input--textarea"
//                 rows="2"
//                 placeholder="Projector, whiteboard, lab kits, tools..."
//                 value={draft.classroomLabResources || ''}
//                 onChange={(e) => onFieldChange('classroomLabResources', e.target.value)}
//               />
//             </label>
//           </div>


//           <MaterialDefinitionSection
//             title="Student learning material"
//             addLabel="Add material"
//             emptyText="No learning material defined yet."
//             items={draft.learningMaterials || []}
//             typeOptions={LEARNING_MATERIAL_TYPE_OPTIONS}
//             onAdd={onAddLearningMaterial}
//             onChange={onLearningMaterialChange}
//             onRemove={onRemoveLearningMaterial}
//           />

//           <MaterialDefinitionSection
//             title="Student Required documents"
//             addLabel="Add document"
//             emptyText="No documents defined yet."
//             items={draft.evidenceDocs || []}
//             typeOptions={EVIDENCE_TYPE_OPTIONS}
//             onAdd={onAddEvidence}
//             onChange={onEvidenceChange}
//             onRemove={onRemoveEvidence}
//           />
//           <MaterialDefinitionSection
//             title="Standard TLM"
//             addLabel="Add document"
//             emptyText="No standard TLM documents defined yet."
//             showDescription
//             items={normalizeTlmList(draft.standardTlm)}
//             typeOptions={LEARNING_MATERIAL_TYPE_OPTIONS}
//             namePlaceholder="e.g. Handbook PDF"
//             descriptionPlaceholder="Short description"
//             onAdd={onAddStandardTlm}
//             onChange={onStandardTlmChange}
//             onRemove={onRemoveStandardTlm}
//           />

//           <MaterialDefinitionSection
//             title="Trainer based TLM"
//             addLabel="Add document"
//             emptyText="No trainer based TLM documents defined yet."
//             showDescription
//             items={normalizeTlmList(draft.trainerBasedTlm)}
//             typeOptions={LEARNING_MATERIAL_TYPE_OPTIONS}
//             namePlaceholder="e.g. Trainer notes"
//             descriptionPlaceholder="Short description"
//             onAdd={onAddTrainerBasedTlm}
//             onChange={onTrainerBasedTlmChange}
//             onRemove={onRemoveTrainerBasedTlm}
//           />

//           <label className="ac-tot-check ac-tot-check--include">
//             <input
//               type="checkbox"
//               checked={draft.includeTot !== false}
//               onChange={(e) => onFieldChange('includeTot', e.target.checked)}
//             />
//             <span>Plan TOT along with this student session</span>
//           </label>

//           <TotSection
//             draft={draft}
//             onFieldChange={onFieldChange}
//             onTotMaterialChange={onTotMaterialChange}
//             onAddTotMaterial={onAddTotMaterial}
//             onRemoveTotMaterial={onRemoveTotMaterial}
//             onTotQuestionChange={onTotQuestionChange}
//             onTotQuestionOptionChange={onTotQuestionOptionChange}
//             onAddTotQuestion={onAddTotQuestion}
//             onRemoveTotQuestion={onRemoveTotQuestion}
//             onTotCompletionProofChange={onTotCompletionProofChange}
//             onAddTotCompletionProof={onAddTotCompletionProof}
//             onRemoveTotCompletionProof={onRemoveTotCompletionProof}
//           />

//           <label className="ac-field ac-field--full">
//             <span>Planning notes</span>
//             <textarea
//               className="ac-input ac-input--textarea"
//               rows="3"
//               placeholder="Instructions for senior trainer or trainer..."
//               value={draft.notes}
//               onChange={(e) => onFieldChange('notes', e.target.value)}
//             />
//           </label>




//         </div>

//         <div className="ac-modal__foot">
//           <button type="button" className="ac-btn ac-btn--ghost" onClick={onClose}>Cancel</button>
//           <button type="button" className="ac-btn ac-btn--primary" onClick={onSave}>
//             <i className="fas fa-save" /> {isEdit ? 'Update Plan' : 'Save Plan'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const ReferSessionModal = ({
//   session,
//   trainerOptions = [],
//   loadingTrainers = false,
//   onClose,
//   onConfirm,
//   onNotify,
// }) => {
//   const [selectedTrainerId, setSelectedTrainerId] = useState('');

//   useEffect(() => {
//     setSelectedTrainerId('');
//   }, [session?.id]);

//   if (!session) return null;

//   const sessionLabel = session.sessionNumber
//     ? `Session ${session.sessionNumber}: ${session.title}`
//     : session.title;

//   const handleConfirm = () => {
//     if (!selectedTrainerId) {
//       onNotify?.('Please select a Senior Trainer');
//       return;
//     }
//     if (!session) {
//       onNotify?.('No session selected to refer.');
//       return;
//     }
//     const selected = trainerOptions.find((trainer) => trainer.value === selectedTrainerId);
//     onConfirm(session, {
//       id: selectedTrainerId,
//       name: selected?.label || '',
//     });
//   };

//   return (
//     <div className="ac-modal-backdrop">
//       <div className="ac-modal ac-modal--confirm" role="dialog" aria-modal="true">
//         <div className="ac-modal__head">
//           <div>
//             <h5>Refer Session</h5>
//             <span>Send to Senior Trainer</span>
//           </div>
//           <button type="button" className="ac-modal__close" onClick={onClose} aria-label="Close">
//             <i className="fas fa-times" />
//           </button>
//         </div>

//         <div className="ac-modal__body">
//           <p className="ac-refer-modal__text">
//             Refer <strong>{sessionLabel}</strong> to Senior Trainer.
//           </p>

//           <label className="ac-field ac-field--full">
//             <span>Senior Trainer</span>
//             <select
//               className="ac-select ac-select--full"
//               value={selectedTrainerId}
//               onChange={(e) => setSelectedTrainerId(e.target.value)}
//               disabled={loadingTrainers}
//             >
//               <option value="">Select Senior Trainer</option>
//               {trainerOptions.map((trainer) => (
//                 <option key={trainer.value} value={trainer.value}>
//                   {trainer.label}
//                 </option>
//               ))}
//             </select>
//           </label>
//         </div>

//         <div className="ac-modal__foot">
//           <button type="button" className="ac-btn ac-btn--ghost" onClick={onClose}>Cancel</button>
//           <button
//             type="button"
//             className="ac-btn ac-btn--primary"
//             onClick={handleConfirm}
//             disabled={loadingTrainers}
//           >
//             <i className="fas fa-paper-plane" /> Refer
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// let pendingAcDeepLink = null;

// const readSessionDeepLink = (locationState) => {
//   if (pendingAcDeepLink) return pendingAcDeepLink;

//   let fromStorage = null;
//   try {
//     const raw = sessionStorage.getItem('acSessionDeepLink');
//     if (raw) fromStorage = JSON.parse(raw);
//   } catch (_) {
//     fromStorage = null;
//   }

//   const incoming = locationState || fromStorage;
//   const params = typeof window !== 'undefined'
//     ? new URLSearchParams(window.location.search)
//     : null;

//   if (!incoming) {
//     const courseIdFromQuery = params?.get('courseId');
//     if (!courseIdFromQuery || params?.get('skipWizard') !== '1') return null;
//     pendingAcDeepLink = {
//       skipPathPicker: true,
//       courseName: '',
//       departmentName: '',
//       projectName: '',
//       centerName: '',
//       filters: {
//         department: '',
//         project: '',
//         center: '',
//         course: String(courseIdFromQuery),
//         batch: `course:${courseIdFromQuery}`,
//       },
//     };
//     return pendingAcDeepLink;
//   }

//   const courseId = String(
//     incoming.filters?.course
//     || incoming.courseId
//     || params?.get('courseId')
//     || ''
//   );
//   if (!courseId) return null;

//   const skipPathPicker = incoming.skipPathPicker !== false
//     || params?.get('skipWizard') === '1';

//   pendingAcDeepLink = {
//     skipPathPicker,
//     courseName: incoming.courseName || '',
//     departmentName: incoming.departmentName || '',
//     projectName: incoming.projectName || '',
//     centerName: incoming.centerName || '',
//     courseStructure: incoming.courseStructure || null,
//     filters: {
//       department: String(incoming.filters?.department || ''),
//       project: String(incoming.filters?.project || ''),
//       center: String(incoming.filters?.center || ''),
//       course: courseId,
//       batch: String(incoming.filters?.batch || `course:${courseId}`),
//     },
//   };
//   return pendingAcDeepLink;
// };

// const clearPendingAcDeepLink = () => {
//   pendingAcDeepLink = null;
//   try {
//     sessionStorage.removeItem('acSessionDeepLink');
//   } catch (_) {
//     // ignore
//   }
// };

// const AcademicCoordinatorModule = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const bootstrapRef = useRef(null);
//   const deepLinkBoot = useRef(null);

//   if (!deepLinkBoot.current) {
//     deepLinkBoot.current = readSessionDeepLink(location.state);
//     if (deepLinkBoot.current?.skipPathPicker) {
//       bootstrapRef.current = {
//         ...deepLinkBoot.current,
//         pathApplied: false,
//         batchApplied: !!deepLinkBoot.current.filters.batch,
//       };
//     }
//   }

//   const userData = useMemo(
//     () => JSON.parse(sessionStorage.getItem('user') || '{}'),
//     []
//   );
//   const token = userData.token;
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

//   const canViewTrainingPermission =
//     (permissions?.custom_permissions?.can_view_training && permissions?.permission_type === 'Custom') ||
//     permissions?.permission_type === 'Admin';

//   const canBeSeniorTrainerPermission =
//     (permissions?.custom_permissions?.can_be_senior_trainer && permissions?.permission_type === 'Custom') ||
//     permissions?.permission_type === 'Admin';

//   const canBeTrainerPermission =
//     (permissions?.custom_permissions?.can_be_trainer && permissions?.permission_type === 'Custom') ||
//     permissions?.permission_type === 'Admin';

//   const [reportDate, setReportDate] = useState(new Date());
//   const [filters, setFilters] = useState(() => {
//     const boot = deepLinkBoot.current;
//     if (boot?.skipPathPicker && boot.filters?.course) {
//       return {
//         department: boot.filters.department || '',
//         project: boot.filters.project || '',
//         center: boot.filters.center || '',
//         course: boot.filters.course,
//         // Set immediately so Department/Project/Center wizard never shows
//         batch: boot.filters.batch || `course:${boot.filters.course}`,
//       };
//     }
//     return {
//       department: '',
//       project: '',
//       center: '',
//       course: '',
//       batch: '',
//     };
//   });
//   const [verticalOptions, setVerticalOptions] = useState([]);
//   const [projectOptions, setProjectOptions] = useState([]);
//   const [centerOptions, setCenterOptions] = useState([]);
//   const [courseOptions, setCourseOptions] = useState([]);
//   const [batchOptions, setBatchOptions] = useState(() => {
//     const boot = deepLinkBoot.current;
//     if (boot?.skipPathPicker && boot.filters?.course) {
//       const batchId = boot.filters.batch || `course:${boot.filters.course}`;
//       return [{ value: batchId, label: boot.courseName || 'Course plan' }];
//     }
//     return [];
//   });
//   const [allCoursesMeta, setAllCoursesMeta] = useState([]);
//   const [allCentersMeta, setAllCentersMeta] = useState([]);
//   const [centerWiseCourseIds, setCenterWiseCourseIds] = useState(new Set());
//   const [centerCoursesLoading, setCenterCoursesLoading] = useState(false);
//   const [pathBatchesLoading, setPathBatchesLoading] = useState(false);
//   const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);
//   const [sessions, setSessions] = useState([]);
//   const [activityTypes, setActivityTypes] = useState([]);
//   const [activityTypesModalOpen, setActivityTypesModalOpen] = useState(false);
//   const [quickSearch, setQuickSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [activityFilter, setActivityFilter] = useState('all');
//   const [modal, setModal] = useState({ open: false, draft: null, editingId: null });
//   const [referModal, setReferModal] = useState({ open: false, session: null });
//   const [seniorTrainerOptions, setSeniorTrainerOptions] = useState([]);
//   const [seniorTrainersLoading, setSeniorTrainersLoading] = useState(false);
//   const [selectedSessionId, setSelectedSessionId] = useState('');
//   const [toast, setToast] = useState('');
//   const [toastKey, setToastKey] = useState(0);
//   const toastTimerRef = useRef(null);
//   const notify = (msg) => {
//     if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
//     setToast(msg);
//     setToastKey((k) => k + 1);
//     toastTimerRef.current = setTimeout(() => setToast(''), 2500);
//   };

//   // Clear router query/state after deep-link is consumed (keep module cache for Strict Mode remount)
//   useEffect(() => {
//     if (!deepLinkBoot.current?.skipPathPicker) return;
//     try {
//       sessionStorage.removeItem('acSessionDeepLink');
//     } catch (_) {
//       // ignore
//     }
//     // Important: On refresh, router `location.state` is lost and only the URL/query
//     // remains. If we strip the query params here, the page can't reconstruct the
//     // deep-linked wizard step and falls back to STEP 1.
//     //
//     // So: always clear router state, but preserve `courseId/skipWizard` query.
//     const searchParams = new URLSearchParams(location.search);
//     const hasDeepLinkQuery = searchParams.get('skipWizard') === '1' || searchParams.has('courseId');
//     if (location.state || hasDeepLinkQuery) {
//       const nextUrl = hasDeepLinkQuery
//         ? `/institute/academicCoordinator?${searchParams.toString()}`
//         : '/institute/academicCoordinator';
//       navigate(nextUrl, { replace: true, state: null });
//     }
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   const pathLabels = useMemo(() => {
//     const boot = bootstrapRef.current;
//     return {
//       departmentName: getOptionLabel(verticalOptions, filters.department) || boot?.departmentName || '',
//       projectName: getOptionLabel(projectOptions, filters.project) || boot?.projectName || '',
//       centerName: getOptionLabel(centerOptions, filters.center) || boot?.centerName || '',
//       courseTrade: getOptionLabel(courseOptions, filters.course) || boot?.courseName || '',
//       batchCode: getOptionLabel(batchOptions, filters.batch)
//         || (String(filters.batch || '').startsWith('course:')
//           ? (boot?.courseName || 'Course plan')
//           : ''),
//       studentCount: 0,
//     };
//   }, [filters, verticalOptions, projectOptions, centerOptions, courseOptions, batchOptions]);

//   const selectedCourseStructure = useMemo(
//     () => getCourseStructureFromMeta(
//       allCoursesMeta,
//       filters.course,
//       bootstrapRef.current?.courseStructure
//     ),
//     [allCoursesMeta, filters.course]
//   );

//   const filterProjectOptions = useMemo(() => {
//     if (!filters.department) return [];
//     const projectIds = new Set(
//       allCoursesMeta
//         .filter((course) => String(course.vertical?._id || course.vertical) === String(filters.department))
//         .map((course) => String(course.project?._id || course.project))
//     );
//     return projectOptions.filter((project) => projectIds.has(String(project.value)));
//   }, [filters.department, projectOptions, allCoursesMeta]);

//   const filterCenterOptions = useMemo(() => {
//     if (!filters.project) return [];
//     return centerOptions.filter((center) => {
//       const meta = allCentersMeta.find((centerItem) => String(centerItem._id) === String(center.value));
//       return meta?.projects?.some((project) => String(project._id || project) === String(filters.project));
//     });
//   }, [filters.project, centerOptions, allCentersMeta]);

//   const filterCourseOptions = useMemo(() => {
//     if (!filters.center || !filters.project) return [];
//     if (!centerWiseCourseIds.size) return [];
//     return courseOptions.filter((course) => centerWiseCourseIds.has(String(course.value)));
//   }, [filters.center, filters.project, courseOptions, centerWiseCourseIds]);

//   const sessionPathStep = useMemo(() => {
//     if (!filters.department) return 'department';
//     if (!filters.project) return 'project';
//     if (!filters.center) return 'center';
//     if (!filters.course) return 'course';
//     if (!filters.batch) return 'batch';
//     return 'complete';
//   }, [filters]);

//   const sessionPathOptions = useMemo(() => {
//     switch (sessionPathStep) {
//       case 'department':
//         return verticalOptions;
//       case 'project':
//         return filterProjectOptions;
//       case 'center':
//         return filterCenterOptions;
//       case 'course':
//         return filterCourseOptions;
//       case 'batch':
//         return batchOptions;
//       default:
//         return [];
//     }
//   }, [
//     sessionPathStep,
//     verticalOptions,
//     filterProjectOptions,
//     filterCenterOptions,
//     filterCourseOptions,
//     batchOptions,
//   ]);

//   const sessionPathLoading = useMemo(() => {
//     if (filterOptionsLoading && sessionPathStep === 'department') return true;
//     if (sessionPathStep === 'course' && filters.center && filters.project && centerCoursesLoading) return true;
//     if (sessionPathStep === 'batch' && filters.center && pathBatchesLoading) return true;
//     return false;
//   }, [filterOptionsLoading, sessionPathStep, filters.center, filters.project, centerCoursesLoading, pathBatchesLoading]);

//   const getFilterLabel = useCallback((key, value) => {
//     if (!value) return '';
//     const optionMap = {
//       department: verticalOptions,
//       project: projectOptions,
//       center: centerOptions,
//       course: courseOptions,
//       batch: batchOptions,
//     };
//     return getOptionLabel(optionMap[key] || [], value);
//   }, [verticalOptions, projectOptions, centerOptions, courseOptions, batchOptions]);

//   useEffect(() => {
//     if (!token) {
//       setFilterOptionsLoading(false);
//       console.error('AcademicCoordinatorModule: auth token missing, filters not loaded');
//       return undefined;
//     }

//     const requestConfig = { headers: { 'x-auth': token } };
//     let cancelled = false;

//     const fetchFilterOptions = async () => {
//       setFilterOptionsLoading(true);

//       try {
//         try {
//           const verticalsRes = await axios.get(`${backendUrl}/college/getVerticals`, requestConfig);
//           if (!cancelled && verticalsRes.data?.status) {
//             setVerticalOptions(mapApiOptions(verticalsRes.data.data));
//           }
//         } catch (verticalErr) {
//           console.error('Failed to fetch verticals:', verticalErr);
//           try {
//             const filtersRes = await axios.get(`${backendUrl}/college/filters-data`, requestConfig);
//             if (!cancelled && filtersRes.data?.status) {
//               setVerticalOptions(mapApiOptions(filtersRes.data.verticals));
//             }
//           } catch (filtersErr) {
//             console.error('Failed to fetch filter-data verticals:', filtersErr);
//           }
//         }
//       } finally {
//         if (!cancelled) setFilterOptionsLoading(false);
//       }

//       try {
//         const [
//           projectsRes,
//           centersRes,
//           coursesRes,
//           filtersRes,
//         ] = await Promise.allSettled([
//           axios.get(`${backendUrl}/college/list_all_projects`, requestConfig),
//           axios.get(`${backendUrl}/college/list_all_centers`, requestConfig),
//           axios.get(`${backendUrl}/college/all_coursescopy`, requestConfig),
//           axios.get(`${backendUrl}/college/filters-data`, requestConfig),
//         ]);

//         if (cancelled) return;

//         if (projectsRes.status === 'fulfilled' && projectsRes.value.data?.success) {
//           setProjectOptions(mapApiOptions(projectsRes.value.data.data));
//         } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
//           setProjectOptions(mapApiOptions(filtersRes.value.data.projects));
//         }

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

//           const projectMap = new Map();
//           courses.forEach((course) => {
//             const id = course.project?._id || course.project;
//             const name = course.project?.name || course.projectName;
//             if (id && name) {
//               projectMap.set(String(id), { value: String(id), label: name });
//             }
//           });
//           if (projectMap.size) {
//             setProjectOptions((prev) => (prev.length ? prev : Array.from(projectMap.values())));
//           }
//         } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
//           setCourseOptions(mapApiOptions(filtersRes.value.data.courses));
//         }
//       } catch (err) {
//         console.error('Failed to fetch secondary filter options:', err);
//       }
//     };

//     fetchFilterOptions();
//     return () => { cancelled = true; };
//   }, [backendUrl, token]);

//   useEffect(() => {
//     if (!filters.center || !filters.project) {
//       setCenterWiseCourseIds(new Set());
//       return undefined;
//     }

//     const fetchCenterCourses = async () => {
//       setCenterCoursesLoading(true);
//       try {
//         const res = await axios.get(`${backendUrl}/college/all_coursescopy_centerwise`, {
//           params: { centerId: filters.center, projectId: filters.project },
//           headers: { 'x-auth': token },
//         });
//         if (res.data?.success) {
//           setCenterWiseCourseIds(new Set((res.data.data || []).map((course) => String(course._id))));
//         } else {
//           setCenterWiseCourseIds(new Set());
//         }
//       } catch (err) {
//         console.error('Failed to fetch center-wise courses:', err);
//         setCenterWiseCourseIds(new Set());
//       } finally {
//         setCenterCoursesLoading(false);
//       }
//     };

//     fetchCenterCourses();
//     return undefined;
//   }, [filters.center, filters.project, token, backendUrl]);

//   useEffect(() => {
//     if (!token) return undefined;
//     if (!filters.center) {
//       // Keep synthetic course-plan option when deep-linking without a center yet
//       if (!bootstrapRef.current?.skipPathPicker) {
//         setBatchOptions([]);
//       }
//       return undefined;
//     }

//     const fetchBatches = async () => {
//       setPathBatchesLoading(true);
//       try {
//         const params = new URLSearchParams();
//         if (filters.center) params.set('centerId', filters.center);
//         if (filters.course) params.set('courseId', filters.course);
//         const res = await axios.get(`${backendUrl}/college/get_batches?${params.toString()}`, {
//           headers: { 'x-auth': token },
//         });
//         if (res.data?.success) {
//           const nextBatches = (res.data.data || []).map((batch) => ({
//             value: String(batch._id),
//             label: batch.name,
//           }));
//           if (nextBatches.length) {
//             setBatchOptions(nextBatches);
//           } else if (bootstrapRef.current?.skipPathPicker && filters.course) {
//             const syntheticId = `course:${filters.course}`;
//             setBatchOptions([{
//               value: syntheticId,
//               label: bootstrapRef.current.courseName || 'Course plan',
//             }]);
//           } else {
//             setBatchOptions([]);
//           }
//         } else if (bootstrapRef.current?.skipPathPicker && filters.course) {
//           setBatchOptions([{
//             value: `course:${filters.course}`,
//             label: bootstrapRef.current.courseName || 'Course plan',
//           }]);
//         } else {
//           setBatchOptions([]);
//         }
//       } catch (err) {
//         console.error('Failed to fetch batches:', err);
//         if (bootstrapRef.current?.skipPathPicker && filters.course) {
//           setBatchOptions([{
//             value: `course:${filters.course}`,
//             label: bootstrapRef.current.courseName || 'Course plan',
//           }]);
//         } else {
//           setBatchOptions([]);
//         }
//       } finally {
//         setPathBatchesLoading(false);
//       }
//     };

//     fetchBatches();
//     return undefined;
//   }, [filters.center, filters.course, token, backendUrl]);

//   useEffect(() => {
//     if (!token) return undefined;
//     let cancelled = false;
//     const loadTypes = async () => {
//       try {
//         const types = await fetchActivityTypesApi(backendUrl, token);
//         if (!cancelled) setActivityTypes(types);
//       } catch (err) {
//         console.error('Failed to load activity types', err);
//         if (!cancelled) setActivityTypes([]);
//       }
//     };
//     loadTypes();
//     return () => { cancelled = true; };
//   }, [backendUrl, token]);

//   useEffect(() => {
//     if (!filters.batch) {
//       setSessions([]);
//       setSelectedSessionId('');
//       return undefined;
//     }
//     if (!token) return undefined;

//     let cancelled = false;
//     const loadSessions = async () => {
//       try {
//         const courseId = String(filters.batch).startsWith('course:')
//           ? String(filters.batch).replace(/^course:/, '')
//           : (filters.course || '');
//         const data = await fetchSessionsApi(backendUrl, token, filters.batch, courseId);
//         if (!cancelled) {
//           setSessions(data);
//           setSelectedSessionId('');
//         }
//       } catch (err) {
//         console.error('Failed to load sessions', err);
//         if (!cancelled) {
//           // Fallback to any legacy local data once
//           setSessions(loadStoredSessions(filters.batch));
//           notify('Failed to load sessions from server');
//         }
//       }
//     };
//     loadSessions();
//     return () => { cancelled = true; };
//   }, [filters.batch, filters.course, backendUrl, token]);

//   // Deep-link: fill department/project/center from course meta (wizard already skipped)
//   useEffect(() => {
//     const boot = bootstrapRef.current;
//     if (!boot?.skipPathPicker || boot.pathApplied) return;
//     if (!filters.course) return;

//     const courseMeta = allCoursesMeta.find(
//       (item) => String(item._id) === String(filters.course)
//     );

//     if (!courseMeta && allCoursesMeta.length === 0) return;

//     const department = String(
//       filters.department
//       || boot.filters?.department
//       || courseMeta?.vertical?._id
//       || courseMeta?.vertical
//       || ''
//     );
//     const project = String(
//       filters.project
//       || boot.filters?.project
//       || courseMeta?.project?._id
//       || courseMeta?.project
//       || ''
//     );

//     let center = String(filters.center || boot.filters?.center || '');
//     if (!center && courseMeta) {
//       const centers = Array.isArray(courseMeta.center) ? courseMeta.center : [];
//       const firstCenter = centers[0];
//       center = String(firstCenter?._id || firstCenter || courseMeta.centerId || '');
//     }
//     if (!center && project && allCentersMeta.length) {
//       const projectCenter = allCentersMeta.find((centerItem) =>
//         centerItem?.projects?.some((p) => String(p._id || p) === String(project))
//       );
//       if (projectCenter) center = String(projectCenter._id);
//     }

//     if (courseMeta?.name && !boot.courseName) {
//       boot.courseName = courseMeta.name;
//     }

//     setFilters((prev) => ({
//       ...prev,
//       department: department || prev.department,
//       project: project || prev.project,
//       center: center || prev.center,
//       course: prev.course || String(boot.filters.course),
//       batch: prev.batch || `course:${boot.filters.course}`,
//     }));
//     boot.pathApplied = true;
//   }, [filters.course, filters.department, filters.project, filters.center, allCoursesMeta, allCentersMeta]);

//   // Deep-link: when real batches load, prefer first batch over synthetic course plan
//   useEffect(() => {
//     const boot = bootstrapRef.current;
//     if (!boot?.skipPathPicker) return;
//     if (!filters.course || !filters.center) return;
//     if (pathBatchesLoading) return;
//     if (!batchOptions.length) return;

//     const hasRealBatch = batchOptions.some((opt) => !String(opt.value).startsWith('course:'));
//     if (!hasRealBatch) return;

//     const currentIsSynthetic = String(filters.batch || '').startsWith('course:');
//     if (!currentIsSynthetic && filters.batch) return;

//     const firstReal = batchOptions.find((opt) => !String(opt.value).startsWith('course:'));
//     if (firstReal) {
//       setFilters((prev) => ({ ...prev, batch: firstReal.value }));
//       boot.batchApplied = true;
//     }
//   }, [filters.course, filters.center, filters.batch, batchOptions, pathBatchesLoading]);

//   const sortedSessions = useMemo(
//     () => [...sessions].sort((a, b) => {
//       const numA = parseInt(String(a.sessionNumber ?? ''), 10);
//       const numB = parseInt(String(b.sessionNumber ?? ''), 10);
//       if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) return numA - numB;
//       return (a.createdAt || '').localeCompare(b.createdAt || '');
//     }),
//     [sessions]
//   );

//   const selectedSession = useMemo(
//     () => sessions.find((session) => session.id === selectedSessionId) || null,
//     [sessions, selectedSessionId]
//   );

//   const handleSelectSession = (sessionId) => {
//     const resolvedId = resolveSessionSelectionId(sessionId);
//     setSelectedSessionId((prev) => (resolveSessionSelectionId(prev) === resolvedId ? '' : resolvedId));
//   };

//   const loadDummySessions = async () => {
//     if (!filters.batch) return;
//     if (!filters.course && !String(filters.batch).startsWith('course:')) {
//       notify('Select a course before loading demo sessions');
//       return;
//     }
//     const hasData = sessions.length > 0;
//     if (hasData && !window.confirm('Replace current sessions with demo dummy data?')) return;
//     const context = buildContextFromFilters(filters, pathLabels);
//     const dummy = createDummySessions(context);
//     try {
//       // Soft-delete existing then create demo rows
//       await Promise.all(
//         sessions.map((session) => deleteSessionApi(backendUrl, token, session.id).catch(() => null))
//       );
//       const created = [];
//       for (const item of dummy) {
//         const { id: _id, createdAt: _c, updatedAt: _u, ...payload } = item;
//         const saved = await createSessionApi(backendUrl, token, {
//           ...payload,
//           course: filters.course || String(filters.batch).replace(/^course:/, ''),
//           batch: String(filters.batch).startsWith('course:') ? '' : filters.batch,
//         });
//         created.push(saved);
//       }
//       setSessions(created);
//       setSelectedSessionId(created[0]?.id || '');
//       notify('Demo dummy sessions loaded');
//     } catch (err) {
//       console.error(err);
//       notify(err.message || 'Failed to load demo sessions');
//     }
//   };

//   const filteredSessions = useMemo(() => {
//     const query = quickSearch.trim().toLowerCase();
//     return sortedSessions.filter((session) => {
//       if (statusFilter !== 'all' && session.workflowStatus !== statusFilter) return false;
//       if (activityFilter !== 'all' && !getSessionActivities(session).some((activity) => activity.id === activityFilter)) {
//         return false;
//       }
//       if (!query) return true;
//       return (
//         session.title?.toLowerCase().includes(query)
//         || session.sessionNumber?.toString().toLowerCase().includes(query)
//         || session.chapterName?.toLowerCase().includes(query)
//         || session.chapterNumber?.toString().toLowerCase().includes(query)
//         || session.subTopics?.toLowerCase().includes(query)
//         || session.courseTrade?.toLowerCase().includes(query)
//         || session.unitName?.toLowerCase().includes(query)
//         || session.unitNumber?.toString().toLowerCase().includes(query)
//         || session.topicCovered?.toLowerCase().includes(query)
//         || session.date?.toLowerCase().includes(query)
//         || session.batchCode?.toLowerCase().includes(query)
//         || getSessionActivities(session).some((activity) => activity.name?.toLowerCase().includes(query))
//       );
//     });
//   }, [sortedSessions, quickSearch, statusFilter, activityFilter]);

//   const activityDistribution = useMemo(
//     () => buildActivityDistribution(sessions, activityTypes),
//     [sessions, activityTypes]
//   );

//   const tocTree = useMemo(() => buildCourseToc(filteredSessions), [filteredSessions]);

//   const totSessions = useMemo(
//     () => filteredSessions.filter((session) => appearsOnTotCalendar(session)).map(mapSessionForTotCalendar),
//     [filteredSessions]
//   );

//   const studentSessions = useMemo(
//     () => filteredSessions.filter((session) => appearsOnStudentCalendar(session)),
//     [filteredSessions]
//   );

//   const stats = useMemo(() => ({
//     total: sessions.length,
//     scheduled: sessions.filter((s) => s.workflowStatus === WORKFLOW_STATUS.SCHEDULED).length,
//     sent: sessions.filter((s) => s.workflowStatus === WORKFLOW_STATUS.SENT_TO_SENIOR).length,
//     assigned: sessions.filter((s) => s.workflowStatus === WORKFLOW_STATUS.ASSIGNED).length,
//   }), [sessions]);

//   const batchSummary = useMemo(() => [
//     pathLabels.departmentName,
//     pathLabels.projectName,
//     pathLabels.centerName,
//     pathLabels.courseTrade,
//     pathLabels.batchCode,
//   ].filter(Boolean).join(' · '), [pathLabels]);

//   const handleFilterChange = (key, value) => {
//     if (key === 'department') {
//       setFilters({ department: value, project: '', center: '', course: '', batch: '' });
//       return;
//     }
//     if (key === 'project') {
//       setFilters((prev) => ({ ...prev, project: value, center: '', course: '', batch: '' }));
//       return;
//     }
//     if (key === 'center') {
//       setFilters((prev) => ({ ...prev, center: value, course: '', batch: '' }));
//       return;
//     }
//     if (key === 'course') {
//       setFilters((prev) => ({ ...prev, course: value, batch: '' }));
//       return;
//     }
//     setFilters((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleSessionPathBack = () => {
//     if (filters.batch) { handleFilterChange('batch', ''); return; }
//     if (filters.course) { handleFilterChange('course', ''); return; }
//     if (filters.center) { handleFilterChange('center', ''); return; }
//     if (filters.project) { handleFilterChange('project', ''); return; }
//     if (filters.department) { handleFilterChange('department', ''); }
//   };

//   const handleSessionPathReset = () => {
//     clearPendingAcDeepLink();
//     bootstrapRef.current = null;
//     deepLinkBoot.current = null;
//     setFilters({ department: '', project: '', center: '', course: '', batch: '' });
//   };

//   const openCreateModal = () => {
//     const context = buildContextFromFilters(filters, pathLabels);
//     setModal({
//       open: true,
//       editingId: null,
//       draft: {
//         ...createEmptySessionDraft(),
//         ...context,
//         sessionNumber: getNextSessionNumber(sessions),
//       },
//     });
//   };

//   const openEditModal = (session) => {
//     setModal({
//       open: true,
//       editingId: session.id,
//       draft: {
//         ...session,
//         sessionType: session.sessionType === SESSION_TYPE.TOT ? SESSION_TYPE.TOT : SESSION_TYPE.STUDENT,
//         includeTot: session.includeTot ?? session.sessionType === SESSION_TYPE.TOT,
//         totUseSameTopics: session.totUseSameTopics ?? true,
//         totTopicCovered: session.totTopicCovered || session.topicCovered || '',
//         totTrainingMethod: session.totTrainingMethod || session.trainingMethod || '',
//         sessionActivities: getSessionActivities(session),
//         evidenceDocs: session.evidenceDocs || [],
//         learningMaterials: session.learningMaterials || [],
//         totMaterials: session.totMaterials || [],
//         totTrainingProofs: session.totTrainingProofs || [],
//         preSessionRequirements: session.preSessionRequirements || [],
//         totCompletionProofs: session.totCompletionProofs || [],
//         standardTlm: normalizeTlmList(session.standardTlm),
//         trainerBasedTlm: normalizeTlmList(session.trainerBasedTlm),
//       },
//     });
//   };

//   const closeModal = () => setModal({ open: false, draft: null, editingId: null });

//   const updateDraft = (field, value) => {
//     setModal((prev) => {
//       const next = { ...prev.draft, [field]: value };
//       const topicSyncFields = ['chapterNumber', 'chapterName', 'subTopics', 'topicCovered'];
//       if (next.includeTot !== false && next.totUseSameTopics !== false) {
//         if (topicSyncFields.includes(field)) {
//           next.totTopicCovered = field === 'topicCovered'
//             ? (value || '')
//             : (next.topicCovered?.trim() || buildTopicSummary(next));
//         }
//         if (field === 'trainingMethod') next.totTrainingMethod = value;
//       }
//       if (field === 'totUseSameTopics' && value === true) {
//         next.totTopicCovered = next.topicCovered?.trim() || buildTopicSummary(next);
//         next.totTrainingMethod = next.trainingMethod || '';
//       }
//       return { ...prev, draft: next };
//     });
//   };

//   const updateDraftListItem = (listKey, index, field, value) => {
//     setModal((prev) => ({
//       ...prev,
//       draft: {
//         ...prev.draft,
//         [listKey]: (prev.draft[listKey] || []).map((item, i) => (
//           i === index ? { ...item, [field]: value } : item
//         )),
//       },
//     }));
//   };

//   const addDraftListItem = (listKey, defaultType = 'Document') => {
//     setModal((prev) => ({
//       ...prev,
//       draft: {
//         ...prev.draft,
//         [listKey]: [...(prev.draft[listKey] || []), createMaterialItem(defaultType)],
//       },
//     }));
//   };

//   const removeDraftListItem = (listKey, index) => {
//     setModal((prev) => ({
//       ...prev,
//       draft: {
//         ...prev.draft,
//         [listKey]: (prev.draft[listKey] || []).filter((_, i) => i !== index),
//       },
//     }));
//   };

//   const updateDraftEvidence = (index, field, value) => updateDraftListItem('evidenceDocs', index, field, value);
//   const addDraftEvidence = () => addDraftListItem('evidenceDocs', 'Document');
//   const removeDraftEvidence = (index) => removeDraftListItem('evidenceDocs', index);

//   const updateDraftLearningMaterial = (index, field, value) => updateDraftListItem('learningMaterials', index, field, value);
//   const addDraftLearningMaterial = () => addDraftListItem('learningMaterials', 'PDF');
//   const removeDraftLearningMaterial = (index) => removeDraftListItem('learningMaterials', index);

//   const updateDraftStandardTlm = (index, field, value) => {
//     setModal((prev) => {
//       const list = normalizeTlmList(prev.draft.standardTlm);
//       return {
//         ...prev,
//         draft: {
//           ...prev.draft,
//           standardTlm: list.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
//         },
//       };
//     });
//   };
//   const addDraftStandardTlm = () => {
//     setModal((prev) => ({
//       ...prev,
//       draft: {
//         ...prev.draft,
//         standardTlm: [...normalizeTlmList(prev.draft.standardTlm), createMaterialItem('PDF')],
//       },
//     }));
//   };
//   const removeDraftStandardTlm = (index) => {
//     setModal((prev) => ({
//       ...prev,
//       draft: {
//         ...prev.draft,
//         standardTlm: normalizeTlmList(prev.draft.standardTlm).filter((_, i) => i !== index),
//       },
//     }));
//   };

//   const updateDraftTrainerBasedTlm = (index, field, value) => {
//     setModal((prev) => {
//       const list = normalizeTlmList(prev.draft.trainerBasedTlm);
//       return {
//         ...prev,
//         draft: {
//           ...prev.draft,
//           trainerBasedTlm: list.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
//         },
//       };
//     });
//   };
//   const addDraftTrainerBasedTlm = () => {
//     setModal((prev) => ({
//       ...prev,
//       draft: {
//         ...prev.draft,
//         trainerBasedTlm: [...normalizeTlmList(prev.draft.trainerBasedTlm), createMaterialItem('PDF')],
//       },
//     }));
//   };
//   const removeDraftTrainerBasedTlm = (index) => {
//     setModal((prev) => ({
//       ...prev,
//       draft: {
//         ...prev.draft,
//         trainerBasedTlm: normalizeTlmList(prev.draft.trainerBasedTlm).filter((_, i) => i !== index),
//       },
//     }));
//   };

//   const updateDraftTotMaterial = (index, field, value) => updateDraftListItem('totMaterials', index, field, value);
//   const addDraftTotMaterial = () => addDraftListItem('totMaterials', 'PDF');
//   const removeDraftTotMaterial = (index) => removeDraftListItem('totMaterials', index);

//   const updateDraftTotTrainingProof = (index, field, value) => updateDraftListItem('totTrainingProofs', index, field, value);
//   const addDraftTotTrainingProof = () => addDraftListItem('totTrainingProofs', 'PDF');
//   const removeDraftTotTrainingProof = (index) => removeDraftListItem('totTrainingProofs', index);

//   const updateDraftPreSessionReq = (index, field, value) => updateDraftListItem('preSessionRequirements', index, field, value);
//   const addDraftPreSessionReq = () => addDraftListItem('preSessionRequirements', 'PDF');
//   const removeDraftPreSessionReq = (index) => removeDraftListItem('preSessionRequirements', index);

//   const updateDraftTotCompletionProof = (index, field, value) => updateDraftListItem('totCompletionProofs', index, field, value);
//   const addDraftTotCompletionProof = () => addDraftListItem('totCompletionProofs', 'PDF');
//   const removeDraftTotCompletionProof = (index) => removeDraftListItem('totCompletionProofs', index);

//   const updateDraftTotQuestion = (index, field, value) => setModal((prev) => ({
//     ...prev,
//     draft: {
//       ...prev.draft,
//       totQuestionBank: (prev.draft.totQuestionBank || []).map((question, i) => (
//         i === index ? { ...question, [field]: value } : question
//       )),
//     },
//   }));

//   const updateDraftTotQuestionOption = (questionIndex, optionIndex, value) => setModal((prev) => ({
//     ...prev,
//     draft: {
//       ...prev.draft,
//       totQuestionBank: (prev.draft.totQuestionBank || []).map((question, i) => (
//         i === questionIndex
//           ? {
//             ...question, options: question.options.map((option, optIdx) => (
//               optIdx === optionIndex ? value : option
//             ))
//           }
//           : question
//       )),
//     },
//   }));

//   const addDraftTotQuestion = () => setModal((prev) => ({
//     ...prev,
//     draft: {
//       ...prev.draft,
//       totQuestionBank: [...(prev.draft.totQuestionBank || []), createTotQuestionDraft()],
//     },
//   }));

//   const removeDraftTotQuestion = (index) => setModal((prev) => ({
//     ...prev,
//     draft: {
//       ...prev.draft,
//       totQuestionBank: (prev.draft.totQuestionBank || []).filter((_, i) => i !== index),
//     },
//   }));

//   const handleActivityTypeToggle = (activityType) => {
//     setModal((prev) => {
//       const current = prev.draft.sessionActivities?.length
//         ? prev.draft.sessionActivities
//         : getSessionActivities(prev.draft);
//       const exists = current.some((activity) => activity.id === activityType.id);
//       const nextActivities = exists
//         ? current.filter((activity) => activity.id !== activityType.id)
//         : [...current, normalizeActivityItem(activityType)];
//       return {
//         ...prev,
//         draft: { ...prev.draft, sessionActivities: nextActivities },
//       };
//     });
//   };

//   const handleClearActivityTypes = () => {
//     setModal((prev) => ({
//       ...prev,
//       draft: { ...prev.draft, sessionActivities: [] },
//     }));
//   };

//   const handleActivityTypesSave = async (nextTypes) => {
//     try {
//       const saved = await saveActivityTypesApi(backendUrl, token, nextTypes);
//       setActivityTypes(saved);
//       notify('Activity types saved');
//     } catch (err) {
//       console.error(err);
//       notify(err.response?.data?.message || err.message || 'Failed to save activity types');
//     }
//   };

//   const saveSession = async () => {
//     const { draft, editingId } = modal;
//     if (!draft?.title?.trim()) {
//       notify('Please enter session name');
//       return;
//     }
//     if (!draft?.sessionDate) {
//       notify('Please select session date');
//       return;
//     }
//     if (!filters.course && !draft.course) {
//       notify('Please select a course');
//       return;
//     }

//     const totValidation = validateTotBeforeSave(draft);
//     if (!totValidation.valid) {
//       notify(totValidation.message);
//       return;
//     }

//     const existing = editingId ? sessions.find((s) => s.id === editingId) : null;
//     const normalizedTotQuestionBank = normalizeTotQuestions(draft.totQuestionBank);

//     const {
//       activityTypeId: _legacyActivityTypeId,
//       activityTypeName: _legacyActivityTypeName,
//       activityColor: _legacyActivityColor,
//       ...draftWithoutLegacyActivity
//     } = draft;

//     const normalized = {
//       ...draftWithoutLegacyActivity,
//       sessionType: SESSION_TYPE.STUDENT,
//       totQuestionBank: normalizedTotQuestionBank,
//       totQuestionBankLastUpdated: normalizedTotQuestionBank.length
//         ? new Date().toISOString()
//         : existing?.totQuestionBankLastUpdated || '',
//       includeTot: draft.includeTot !== false,
//       totUseSameTopics: draft.includeTot !== false ? draft.totUseSameTopics !== false : false,
//       totTopicCovered: draft.includeTot !== false
//         ? (draft.totUseSameTopics !== false
//           ? (draft.topicCovered?.trim() || buildTopicSummary(draft))
//           : (draft.totTopicCovered?.trim() || ''))
//         : '',
//       totTrainingMethod: draft.includeTot !== false
//         ? (draft.totUseSameTopics !== false
//           ? (draft.trainingMethod?.trim() || '')
//           : (draft.totTrainingMethod?.trim() || ''))
//         : '',
//       requireTotCompletionProofs: draft.includeTot !== false ? draft.requireTotCompletionProofs === true : false,
//       totStatus: draft.includeTot !== false ? (existing?.totStatus || 'pending') : undefined,
//       fieldTrainerId: existing?.fieldTrainerId || '',
//       fieldTrainerName: existing?.fieldTrainerName || '',
//       totTrainerId: existing?.totTrainerId || '',
//       totTrainerName: existing?.totTrainerName || '',
//       seniorTrainerId: existing?.seniorTrainerId || '',
//       seniorTrainerName: existing?.seniorTrainerName || '',
//       title: draft.title.trim(),
//       sessionNumber: draft.sessionNumber?.toString().trim() || '',
//       hours: draft.hours?.toString().trim() || '',
//       subSessions: draft.subSessions?.toString().trim() || '',
//       subSessionName: draft.subSessionName?.trim() || '',
//       duration: draft.duration?.trim() || '',
//       unitNumber: selectedCourseStructure.unit ? draft.unitNumber?.toString().trim() || '' : '',
//       unitName: selectedCourseStructure.unit ? draft.unitName?.trim() || '' : '',
//       chapterNumber: selectedCourseStructure.chapter ? draft.chapterNumber?.toString().trim() || '' : '',
//       chapterName: selectedCourseStructure.chapter ? draft.chapterName?.trim() || '' : '',
//       subTopics: selectedCourseStructure.chapter ? draft.subTopics?.trim() || '' : '',
//       topicCovered: draft.topicCovered?.trim() || buildTopicSummary(draft),
//       trainingMethod: draft.trainingMethod?.trim() || '',
//       classroomLabResources: draft.classroomLabResources?.trim() || '',
//       standardTlm: normalizeMaterialItems(normalizeTlmList(draft.standardTlm)),
//       trainerBasedTlm: normalizeMaterialItems(normalizeTlmList(draft.trainerBasedTlm)),
//       notes: draft.notes?.trim() || '',
//       date: formatSessionDate(draft.sessionDate),
//       workflowStatus: draft.workflowStatus || WORKFLOW_STATUS.SCHEDULED,
//       evidenceDocs: normalizeMaterialItems(draft.evidenceDocs).map((doc) => ({
//         ...doc,
//         status: doc.status || 'Pending',
//       })),
//       learningMaterials: normalizeMaterialItems(draft.learningMaterials),
//       totMaterials: normalizeMaterialItems(draft.totMaterials),
//       totTrainingProofs: normalizeMaterialItems(draft.totTrainingProofs),
//       preSessionRequirements: normalizeMaterialItems(draft.preSessionRequirements),
//       totCompletionProofs: normalizeMaterialItems(draft.totCompletionProofs),
//       sessionActivities: normalizeSessionActivities(
//         draft.sessionActivities?.length ? draft.sessionActivities : getSessionActivities(draft)
//       ),
//       department: filters.department || draft.department || '',
//       project: filters.project || draft.project || '',
//       center: filters.center || draft.center || '',
//       course: filters.course || draft.course || '',
//       batch: String(filters.batch || '').startsWith('course:') ? '' : (filters.batch || draft.batch || ''),
//       departmentName: pathLabels.departmentName,
//       projectName: pathLabels.projectName,
//       centerName: pathLabels.centerName,
//       courseTrade: pathLabels.courseTrade,
//       batchCode: pathLabels.batchCode,
//     };

//     try {
//       let savedSession;
//       if (editingId) {
//         savedSession = await updateSessionApi(backendUrl, token, editingId, normalized);
//         setSessions((prev) => prev.map((s) => (s.id === editingId ? savedSession : s)));
//         notify(`Session updated: ${savedSession.title}`);
//       } else {
//         savedSession = await createSessionApi(backendUrl, token, normalized);
//         setSessions((prev) => [...prev, savedSession]);
//         notify(`Session created: ${savedSession.title}`);
//       }

//       setQuickSearch('');
//       setStatusFilter('all');
//       setActivityFilter('all');
//       setSelectedSessionId(savedSession.id);
//       closeModal();
//     } catch (err) {
//       console.error(err);
//       notify(err.response?.data?.message || err.message || 'Failed to save session');
//     }
//   };

//   const deleteSession = async (session) => {
//     if (!window.confirm(`Delete session "${session.title}"?`)) return;
//     try {
//       await deleteSessionApi(backendUrl, token, session.id);
//       setSessions((prev) => prev.filter((s) => s.id !== session.id));
//       if (selectedSessionId === session.id) setSelectedSessionId('');
//       notify('Session plan deleted');
//     } catch (err) {
//       console.error(err);
//       notify(err.response?.data?.message || err.message || 'Failed to delete session');
//     }
//   };

//   const fetchSeniorTrainers = useCallback(async () => {
//     if (!token) return;
//     setSeniorTrainersLoading(true);
//     try {
//       const res = await axios.get(`${backendUrl}/college/users/training-role-users?roleType=senior`, {
//         headers: { 'x-auth': token },
//       });
//       const trainers = (res.data?.data || [])
//         .filter((trainer) => trainer._id)
//         .map((trainer) => ({
//           value: String(trainer._id),
//           label: trainer.name || trainer.email || 'Senior Trainer',
//         }));
//       setSeniorTrainerOptions(trainers);
//     } catch (err) {
//       console.error('Failed to fetch senior trainers:', err);
//       setSeniorTrainerOptions([]);
//       notify('Failed to load senior trainers');
//     } finally {
//       setSeniorTrainersLoading(false);
//     }
//   }, [backendUrl, token]);

//   const openReferModal = (session) => {
//     setReferModal({ open: true, session });
//     fetchSeniorTrainers();
//   };
//   const closeReferModal = () => setReferModal({ open: false, session: null });

//   const sendToSenior = async (session, seniorTrainer) => {
//     if (!seniorTrainer?.id) {
//       notify('Please select a Senior Trainer');
//       return;
//     }
//     try {
//       const updated = await patchSessionApi(backendUrl, token, session.id, {
//         workflowStatus: WORKFLOW_STATUS.SENT_TO_SENIOR,
//         seniorTrainerId: seniorTrainer.id,
//         seniorTrainerName: seniorTrainer.name,
//       });
//       setSessions((prev) => prev.map((s) => (s.id === session.id ? updated : s)));
//       closeReferModal();
//       notify(`Referred to ${seniorTrainer.name}`);
//     } catch (err) {
//       console.error(err);
//       notify(err.response?.data?.message || err.message || 'Failed to refer session');
//     }
//   };

//   const canEditSession = (session) => (
//     canViewTrainingPermission
//     && (
//       session.workflowStatus === WORKFLOW_STATUS.SCHEDULED
//       || session.workflowStatus === WORKFLOW_STATUS.SENT_TO_SENIOR
//     )
//   );

//   if (permissions && !canViewTrainingPermission) {
//     return (
//       <div className="ac-portal">
//         <style>{AC_CSS}</style>
//         <div className="ac-empty-state" style={{ marginTop: 40, textAlign: 'center', padding: 48 }}>
//           <i className="fas fa-lock" style={{ fontSize: 32, color: '#94a3b8', marginBottom: 12 }} />
//           <h3 style={{ margin: '0 0 8px' }}>Access denied</h3>
//           <p style={{ margin: 0, color: '#64748b' }}>
//             You need <strong>View Training</strong> permission (or Admin) to use Academic Coordinator.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="ac-portal">
//       <style>{AC_CSS}</style>

//       <header className="ac-header">
//         <div>
//           <div className="ac-role-badge">
//             <i className="fas fa-user-tie" /> Academic Coordinator
//           </div>
//           <h1 className="ac-title">Session Planning</h1>
//           <nav className="ac-breadcrumb">
//             <span>Training Module</span><span>/</span>
//             <span className="ac-breadcrumb--active">Academic Coordinator</span>
//           </nav>
//           <p className="ac-subtitle">
//             Create student sessions and optionally link TOT with the same or separate topics.
//           </p>
//         </div>
//         <div className="ac-header-meta">
//           <div className="ac-header-user">
//             <i className="fas fa-user-circle" />
//             <span>{userData.name || 'Coordinator'}</span>
//           </div>
//           <div className="ac-header-date">
//             <i className="fas fa-calendar-alt" />
//             <DatePicker value={reportDate} onChange={setReportDate} format="dd/MM/yyyy" clearIcon={null} />
//           </div>
//         </div>
//       </header>

//       {!filters.batch ? (
//         <SessionPathPicker
//           filters={filters}
//           currentStep={sessionPathStep}
//           options={sessionPathOptions}
//           loading={sessionPathLoading}
//           getLabel={getFilterLabel}
//           onSelect={handleFilterChange}
//           onBack={handleSessionPathBack}
//           onReset={handleSessionPathReset}
//         />
//       ) : (
//         <>
//           <div className="ac-stats-row">
//             <div className="ac-stat">
//               <strong>{stats.total}</strong>
//               <span>Total plans</span>
//             </div>
//             <div className="ac-stat ac-stat--blue">
//               <strong>{stats.scheduled}</strong>
//               <span>Scheduled</span>
//             </div>
//             <div className="ac-stat ac-stat--amber">
//               <strong>{stats.sent}</strong>
//               <span>With Senior Trainer</span>
//             </div>
//             <div className="ac-stat ac-stat--purple">
//               <strong>{stats.assigned}</strong>
//               <span>Assigned</span>
//             </div>
//           </div>

//           <div className="ac-toolbar">
//             <div className="ac-toolbar__path">
//               <span className="ac-toolbar__label">Selected batch</span>
//               <strong>{batchSummary}</strong>
//               {pathLabels.studentCount > 0 && (
//                 <span className="ac-toolbar__meta">{pathLabels.studentCount} students enrolled</span>
//               )}
//               <div className="ac-structure-pills" aria-hidden="true">
//                 <span className="ac-structure-pill ac-structure-pill--unit">
//                   <i className="fas fa-layer-group" /> Unit
//                 </span>
//                 <span className="ac-structure-pill ac-structure-pill--chapter">
//                   <i className="fas fa-book" /> Chapter
//                 </span>
//                 <span className="ac-structure-pill ac-structure-pill--session">
//                   <i className="fas fa-play-circle" /> Session
//                 </span>
//               </div>
//             </div>
//             <div className="ac-toolbar__actions">
//               <button type="button" className="ac-btn ac-btn--ghost" onClick={() => setActivityTypesModalOpen(true)}>
//                 <i className="fas fa-palette" /> Activity types
//               </button>
//               <button type="button" className="ac-btn ac-btn--ghost" onClick={loadDummySessions}>
//                 <i className="fas fa-flask" /> Load demo data
//               </button>
//               <button type="button" className="ac-btn ac-btn--ghost" onClick={handleSessionPathReset}>
//                 <i className="fas fa-exchange-alt" /> Change batch
//               </button>
//               <button type="button" className="ac-btn ac-btn--primary" onClick={openCreateModal}>
//                 <i className="fas fa-plus" /> New Session Plan
//               </button>
//             </div>
//           </div>

//           <ColorDistributionPanel
//             distribution={activityDistribution}
//             totalSessions={sessions.length}
//           />



//           <div className="ac-filters">
//             <input
//               type="text"
//               className="ac-search"
//               placeholder="Search unit, chapter, session..."
//               value={quickSearch}
//               onChange={(e) => setQuickSearch(e.target.value)}
//             />
//             <select
//               className="ac-select"
//               value={activityFilter}
//               onChange={(e) => setActivityFilter(e.target.value)}
//             >
//               <option value="all">All activity types</option>
//               {activityTypes.map((type) => (
//                 <option key={type.id} value={type.id}>{type.name}</option>
//               ))}
//             </select>
//             <select
//               className="ac-select"
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//             >
//               <option value="all">All statuses</option>
//               {Object.values(WORKFLOW_STATUS).map((status) => (
//                 <option key={status} value={status}>{status}</option>
//               ))}
//             </select>
//           </div>

//           <div className="ac-workspace ac-workspace--toc">
//             <CourseTableOfContents
//               courseName={pathLabels.courseTrade}
//               batchName={pathLabels.batchCode}
//               tree={tocTree}
//               selectedSessionId={selectedSessionId}
//               onSelectSession={handleSelectSession}
//             />

//             <SessionDetailSidePanel
//               session={selectedSession}
//               canEdit={selectedSession ? canEditSession(selectedSession) : false}
//               onClose={() => setSelectedSessionId('')}
//               onEdit={openEditModal}
//               onDelete={deleteSession}
//               onOpenReferModal={openReferModal}
//             />
//           </div>
//         </>
//       )}

//       {modal.open && modal.draft && (
//         <SessionPlanModal
//           draft={modal.draft}
//           isEdit={!!modal.editingId}
//           batchSummary={batchSummary}
//           courseStructure={selectedCourseStructure}
//           onClose={closeModal}
//           onSave={saveSession}
//           onFieldChange={updateDraft}
//           onEvidenceChange={updateDraftEvidence}
//           onAddEvidence={addDraftEvidence}
//           onRemoveEvidence={removeDraftEvidence}
//           onLearningMaterialChange={updateDraftLearningMaterial}
//           onAddLearningMaterial={addDraftLearningMaterial}
//           onRemoveLearningMaterial={removeDraftLearningMaterial}
//           onStandardTlmChange={updateDraftStandardTlm}
//           onAddStandardTlm={addDraftStandardTlm}
//           onRemoveStandardTlm={removeDraftStandardTlm}
//           onTrainerBasedTlmChange={updateDraftTrainerBasedTlm}
//           onAddTrainerBasedTlm={addDraftTrainerBasedTlm}
//           onRemoveTrainerBasedTlm={removeDraftTrainerBasedTlm}
//           onTotMaterialChange={updateDraftTotMaterial}
//           onAddTotMaterial={addDraftTotMaterial}
//           onRemoveTotMaterial={removeDraftTotMaterial}
//           onTotCompletionProofChange={updateDraftTotCompletionProof}
//           onAddTotCompletionProof={addDraftTotCompletionProof}
//           onRemoveTotCompletionProof={removeDraftTotCompletionProof}
//           onTotQuestionChange={updateDraftTotQuestion}
//           onTotQuestionOptionChange={updateDraftTotQuestionOption}
//           onAddTotQuestion={addDraftTotQuestion}
//           onRemoveTotQuestion={removeDraftTotQuestion}
//           activityTypes={activityTypes}
//           onActivityTypeToggle={handleActivityTypeToggle}
//           onClearActivityTypes={handleClearActivityTypes}
//         />
//       )}

//       {referModal.open && referModal.session && (
//         <ReferSessionModal
//           session={referModal.session}
//           trainerOptions={seniorTrainerOptions}
//           loadingTrainers={seniorTrainersLoading}
//           onClose={closeReferModal}
//           onConfirm={sendToSenior}
//           onNotify={notify}
//         />
//       )}

//       {activityTypesModalOpen && (
//         <ActivityTypesManager
//           types={activityTypes}
//           onChange={handleActivityTypesSave}
//           onClose={() => setActivityTypesModalOpen(false)}
//           onNotify={notify}
//         />
//       )}

//       {toast && (
//         <div key={toastKey} className="ac-toast">
//           <div className="ac-toast__body">
//             <i className="fas fa-check-circle" /> {toast}
//           </div>
//           <div className="ac-toast__progress" />
//         </div>
//       )}
//     </div>
//   );
// };

// const AC_CSS = `
//   .ac-portal {
//     min-height: 100vh;
//     background: linear-gradient(180deg, #f0f7ff 0%, #f4f6f9 140px, #f4f6f9 100%);
//     padding: 16px 20px 100px;
//     font-family: 'Segoe UI', system-ui, sans-serif;
//     color: #1e293b;
//   }
//   .ac-header {
//     display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 16px;
//     background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px 22px;
//     margin-bottom: 18px; box-shadow: 0 18px 40px rgba(15,23,42,0.06);
//   }
//   .ac-role-badge {
//     display: inline-flex; align-items: center; gap: 8px;
//     background: #eff6ff; color: ${BLUE}; font-size: 11px; font-weight: 800;
//     text-transform: uppercase; letter-spacing: 0.05em; padding: 5px 12px; border-radius: 999px; margin-bottom: 10px;
//   }
//   .ac-title { margin: 0 0 6px; font-size: 1.6rem; font-weight: 900; color: #0f172a; }
//   .ac-subtitle { margin: 8px 0 0; font-size: 13px; color: #64748b; max-width: 520px; line-height: 1.5; }
//   .ac-breadcrumb { font-size: 12px; color: #64748b; display: flex; gap: 6px; align-items: center; }
//   .ac-breadcrumb--active { color: ${BLUE}; font-weight: 700; }
//   .ac-header-meta { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
//   .ac-header-user {
//     display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #334155;
//     background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 14px;
//   }
//   .ac-header-date {
//     display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0;
//     border-radius: 12px; padding: 8px 14px;
//   }
//   .ac-header-date i { color: ${BLUE}; }
//   .ac-header-date .react-date-picker { border: none; font-size: 13px; }
//   .ac-header-date .react-date-picker__wrapper { border: none; background: transparent; }

//   .ac-path-picker {
//     background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px;
//     box-shadow: 0 10px 28px rgba(15,23,42,0.05);
//   }
//   .ac-path-picker__intro { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
//   .ac-path-picker__badge {
//     display: inline-block; background: #eff6ff; color: ${BLUE}; font-size: 10px; font-weight: 800;
//     text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;
//   }
//   .ac-path-picker__intro h3 { margin: 0 0 4px; font-size: 1.25rem; font-weight: 900; }
//   .ac-path-picker__intro p { margin: 0; font-size: 13px; color: #64748b; }
//   .ac-path-picker__actions { display: flex; gap: 8px; }
//   .ac-path-picker__back, .ac-path-picker__reset {
//     border: 1px solid #e2e8f0; background: #fff; border-radius: 999px; padding: 8px 14px;
//     font-size: 12px; font-weight: 700; cursor: pointer; color: #475569;
//   }
//   .ac-path-picker__reset { color: ${PINK}; border-color: #fecdd3; }
//   .ac-path-picker__trail {
//     display: flex; flex-wrap: wrap; align-items: center; gap: 8px; background: #f8fafc;
//     border: 1px dashed #cbd5e1; border-radius: 14px; padding: 12px 14px; margin-bottom: 16px;
//   }
//   .ac-path-picker__crumb {
//     display: inline-flex; flex-direction: column; gap: 2px; background: #fff; border: 1px solid #e2e8f0;
//     border-radius: 12px; padding: 8px 12px; min-width: 120px;
//   }
//   .ac-path-picker__crumb i { color: ${PINK}; font-size: 11px; }
//   .ac-path-picker__crumb em { font-style: normal; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #94a3b8; }
//   .ac-path-picker__crumb strong { font-size: 12px; color: #0f172a; }
//   .ac-path-picker__trail > i { color: #cbd5e1; font-size: 10px; }
//   .ac-path-picker__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
//   .ac-path-card-btn {
//     display: flex; flex-direction: column; align-items: flex-start; gap: 8px; text-align: left;
//     background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 18px; cursor: pointer;
//     transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s; min-height: 130px; position: relative;
//   }
//   .ac-path-card-btn:hover { transform: translateY(-3px); border-color: ${BLUE}; box-shadow: 0 12px 30px rgba(37,99,235,0.12); }
//   .ac-path-card-btn__icon {
//     width: 44px; height: 44px; border-radius: 12px; background: #fff5f7;
//     display: flex; align-items: center; justify-content: center; color: ${PINK}; font-size: 18px;
//   }
//   .ac-path-card-btn strong { font-size: 12px; font-weight: 800; color: #0f172a; line-height: 1.35; }
//   .ac-path-card-btn span { font-size: 11px; color: #64748b; font-weight: 600; }
//   .ac-path-card-btn__arrow { position: absolute; right: 14px; bottom: 14px; color: #94a3b8; font-size: 12px; }
//   .ac-path-picker__empty,
//   .ac-path-picker__loading { text-align: center; padding: 40px 20px; color: #64748b; }
//   .ac-path-picker__empty i,
//   .ac-path-picker__loading i { font-size: 28px; color: #cbd5e1; margin-bottom: 10px; display: block; }

//   .ac-stats-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
//   .ac-stat {
//     background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; text-align: center;
//   }
//   .ac-stat strong { display: block; font-size: 22px; font-weight: 900; color: #0f172a; }
//   .ac-stat span { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
//   .ac-stat--blue strong { color: ${BLUE}; }
//   .ac-stat--amber strong { color: #d97706; }
//   .ac-stat--purple strong { color: #7c3aed; }

//   .ac-toolbar {
//     display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;
//     background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; margin-bottom: 14px;
//   }
//   .ac-toolbar__label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
//   .ac-toolbar__path strong { display: block; font-size: 13px; color: #0f172a; line-height: 1.4; }
//   .ac-toolbar__meta { font-size: 12px; color: #64748b; font-weight: 600; }
//   .ac-structure-pills {
//     display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;
//   }
//   .ac-structure-pill {
//     display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
//     border-radius: 999px; font-size: 12px; font-weight: 800;
//     border: 1px solid #e2e8f0; background: #f8fafc; color: #475569;
//     cursor: default; user-select: none; pointer-events: none;
//   }
//   .ac-structure-pill--unit { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
//   .ac-structure-pill--chapter { background: #f5f3ff; border-color: #ddd6fe; color: #6d28d9; }
//   .ac-structure-pill--session { background: #ecfdf5; border-color: #bbf7d0; color: #047857; }
//   .ac-toolbar__actions { display: flex; flex-wrap: wrap; gap: 8px; }

//   .ac-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
//   .ac-search {
//     flex: 1; min-width: 200px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px;
//     font-size: 13px; background: #fff;
//   }
//   .ac-select {
//     min-width: 180px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px;
//     font-size: 13px; background: #fff; font-weight: 600;
//   }
//   .ac-select--full { width: 100%; min-width: 0; }

//   .ac-btn {
//     display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 12px;
//     font-size: 12px; font-weight: 800; border: 1.5px solid transparent; cursor: pointer; transition: 0.15s;
//   }
//   .ac-btn--primary { background: ${BLUE}; color: #fff; border-color: ${BLUE}; }
//   .ac-btn--primary:hover { background: #1d4ed8; }
//   .ac-btn--outline { background: #fff; color: ${BLUE}; border-color: #bfdbfe; }
//   .ac-btn--ghost { background: #fff; color: #475569; border-color: #e2e8f0; }
//   .ac-btn--danger { color: #b91c1c; border-color: #fecaca; }
//   .ac-btn--sm { padding: 8px 12px; font-size: 11px; }
//   .ac-btn:disabled { opacity: 0.45; cursor: not-allowed; }

//   .ac-session-list { display: flex; flex-direction: column; gap: 12px; }
//   .ac-session-card {
//     background: #fff; border: 1px solid #e2e8f0; border-left: 5px solid var(--ac-activity-color, ${BLUE});
//     border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(15,23,42,0.06);
//   }
//   .ac-session-card--no-activity { border-left-color: #cbd5e1; }
//   .ac-session-card__head {
//     display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 10px;
//     padding: 14px 16px; color: #fff;
//   }
//   .ac-session-card__head--neutral {
//     background: linear-gradient(105deg, #475569 0%, #64748b 55%, #94a3b8 100%);
//   }
//   .ac-session-card__title-wrap h4 { margin: 0 0 4px; font-size: 15px; font-weight: 900; }
//   .ac-session-card__title-wrap p { margin: 0 0 8px; font-size: 12px; opacity: 0.88; }
//   .ac-session-card__badges { display: flex; flex-wrap: wrap; gap: 6px; }
//   .ac-activity-badge {
//     display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px;
//     font-size: 10px; font-weight: 800; color: #fff; border: 1px solid rgba(255,255,255,0.35);
//   }
//   .ac-status-pill {
//     font-size: 10px; font-weight: 800; padding: 5px 10px; border-radius: 999px; text-transform: uppercase;
//     background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.35); white-space: nowrap;
//   }
//   .ac-session-card__grid {
//     display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; padding: 14px 16px;
//   }
//   .ac-session-card__grid em {
//     display: block; font-style: normal; font-size: 10px; font-weight: 800; text-transform: uppercase;
//     color: #94a3b8; margin-bottom: 4px;
//   }
//   .ac-session-card__grid strong { font-size: 13px; color: #0f172a; }
//   .ac-session-card__notes {
//     display: flex; gap: 10px; align-items: flex-start; margin: 0 16px 14px; padding: 12px 14px;
//     background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 12px; color: #475569;
//   }
//   .ac-session-card__notes i { color: ${BLUE}; margin-top: 2px; }
//   .ac-session-card__notes p { margin: 0; line-height: 1.5; }
//   .ac-session-card__foot {
//     display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px 16px;
//     border-top: 1px solid #eef2f7; background: #fafbfc;
//   }
//   .ac-session-card__foot-right { margin-left: auto; display: flex; gap: 8px; }

//   .ac-empty {
//     text-align: center; padding: 48px 24px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 16px;
//   }
//   .ac-empty i { font-size: 36px; color: #cbd5e1; margin-bottom: 12px; }
//   .ac-empty h3 { margin: 0 0 8px; font-size: 18px; }
//   .ac-empty p { margin: 0 0 16px; color: #64748b; font-size: 13px; }

//   .ac-modal-backdrop {
//     position: fixed; inset: 0; z-index: 9998; background: rgba(15,23,42,0.55); backdrop-filter: blur(4px);
//     display: flex; align-items: center; justify-content: center; padding: 18px;
//   }
//   .ac-modal {
//     width: min(900px, 100%); max-height: 92vh; overflow: hidden; background: #fff; border-radius: 20px;
//     box-shadow: 0 28px 80px rgba(15,23,42,0.28); display: flex; flex-direction: column;
//   }
//   .ac-modal--wide { width: min(760px, 100%); }
//   .ac-modal__head, .ac-modal__foot {
//     display: flex; align-items: center; justify-content: space-between; gap: 12px;
//     padding: 16px 18px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
//   }
//   .ac-modal__foot { border-top: 1px solid #e2e8f0; border-bottom: 0; justify-content: flex-end; }
//   .ac-modal__head h5 { margin: 0; font-size: 18px; font-weight: 900; }
//   .ac-modal__head span { color: #64748b; font-size: 12px; font-weight: 700; }
//   .ac-modal__close {
//     width: 34px; height: 34px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer;
//   }
//   .ac-modal__body { padding: 18px; overflow-y: auto; flex: 1 1 auto; }
//   .ac-modal__context {
//     margin-bottom: 16px; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px;
//     background: #f8fafc; font-size: 12px; font-weight: 700; color: #475569;
//   }
//   .ac-form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
//   .ac-field--span-2 { grid-column: span 2; }
//   .ac-course-context {
//     display: flex; flex-wrap: wrap; gap: 16px 24px; margin-bottom: 16px; padding: 14px 16px;
//     border: 1px solid #e2e8f0; border-radius: 14px; background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
//   }
//   .ac-course-context > div { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
//   .ac-course-context span {
//     font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;
//   }
//   .ac-course-context strong { font-size: 14px; color: #0f172a; }
//   .ac-session-card__chapter { font-size: 12px !important; color: rgba(255,255,255,0.88) !important; margin-top: 4px !important; }
//   .ac-session-card--no-activity .ac-session-card__chapter { color: #475569 !important; }

//   .ac-structure-guide {
//     margin-bottom: 16px; padding: 18px 20px; border: 1px solid #dbeafe; border-radius: 16px;
//     background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 55%, #fdf4ff 100%);
//   }
//   .ac-structure-guide__head {
//     display: flex; gap: 14px; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap;
//   }
//   .ac-structure-guide__head > i {
//     width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px;
//     background: ${BLUE}; color: #fff; font-size: 16px;
//   }
//   .ac-structure-guide__head h4 { margin: 0 0 4px; font-size: 15px; color: #0f172a; }
//   .ac-structure-guide__head p { margin: 0; font-size: 12px; color: #64748b; }
//   .ac-structure-guide__hint {
//     margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
//     border-radius: 999px; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800;
//   }
//   .ac-structure-guide__empty { margin: 0; padding: 12px; font-size: 13px; color: #64748b; }
//   .ac-structure-guide__tree { display: flex; flex-direction: column; gap: 0; padding-left: 8px; }
//   .ac-structure-guide__node {
//     display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 12px; padding: 10px 14px;
//     border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;
//   }
//   .ac-structure-guide__node--root {
//     border-color: #bfdbfe; background: #eff6ff;
//   }
//   .ac-structure-guide__node strong {
//     font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;
//   }
//   .ac-structure-guide__node span { font-size: 14px; font-weight: 800; color: #0f172a; }
//   .ac-structure-guide__branch {
//     width: 2px; height: 14px; margin-left: 24px; background: #cbd5e1;
//   }
//   .ac-structure-guide__sessions {
//     display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 4px;
//   }
//   .ac-structure-guide__session {
//     display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; text-align: left;
//     border: 1.5px solid #e2e8f0; border-radius: 12px; background: #fff; cursor: pointer;
//     transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
//   }
//   .ac-structure-guide__session:hover {
//     border-color: ${BLUE}; box-shadow: 0 8px 20px rgba(37,99,235,0.1); transform: translateY(-1px);
//   }
//   .ac-structure-guide__session--active {
//     border-color: ${BLUE}; background: #eff6ff; box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
//   }
//   .ac-structure-guide__session-no {
//     display: flex; align-items: center; justify-content: space-between; gap: 8px;
//     font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${BLUE};
//   }
//   .ac-structure-guide__session-no i { color: #059669; }
//   .ac-structure-guide__session strong { font-size: 13px; color: #0f172a; line-height: 1.35; }
//   .ac-structure-guide__session em { font-size: 12px; color: #475569; font-style: normal; font-weight: 700; }
//   .ac-structure-guide__session small { font-size: 11px; color: #64748b; line-height: 1.45; }
//   .ac-empty__actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 8px; }

//   .ac-workspace {
//     display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 16px; align-items: start;
//   }
//   .ac-workspace--toc {
//     grid-template-columns: 300px minmax(0, 1fr);
//   }
//   .ac-workspace__main { min-width: 0; }

//   .ac-toc-panel {
//     position: sticky; top: 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
//     box-shadow: 0 10px 28px rgba(15,23,42,0.06); overflow: hidden; max-height: calc(100vh - 32px);
//     display: flex; flex-direction: column;
//   }
//   .ac-toc-panel__head {
//     padding: 14px 16px; border-bottom: 1px solid #e2e8f0; background: linear-gradient(135deg, #f8fafc, #eff6ff);
//   }
//   .ac-toc-panel__head h4 {
//     margin: 0 0 4px; font-size: 14px; font-weight: 800; color: #0f172a;
//     display: flex; align-items: center; gap: 8px;
//   }
//   .ac-toc-panel__head p { margin: 0; font-size: 11px; color: #64748b; }
//   .ac-toc-panel__body { flex: 1; overflow: auto; padding: 8px 0 12px; }
//   .ac-toc-empty { margin: 8px 16px; font-size: 12px; color: #64748b; line-height: 1.5; }
//   .ac-toc-nested { padding-left: 12px; border-left: 2px solid #e2e8f0; margin-left: 16px; }
//   .ac-toc-nested--unit { margin-left: 12px; }
//   .ac-toc-nested--chapter { margin-left: 10px; padding-left: 10px; }
//   .ac-toc-item {
//     display: flex; align-items: flex-start; gap: 8px; width: calc(100% - 16px); margin: 2px 8px;
//     padding: 8px 10px; border: none; background: transparent; text-align: left; border-radius: 10px;
//     cursor: pointer; transition: background 0.15s;
//   }
//   .ac-toc-item:hover { background: #f8fafc; }
//   .ac-toc-item span {
//     display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8;
//   }
//   .ac-toc-item strong {
//     display: block; font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.35; margin-top: 2px;
//   }
//   .ac-toc-item__chevron { width: 12px; margin-top: 4px; font-size: 10px; color: #94a3b8; flex-shrink: 0; }
//   .ac-toc-item--course strong { font-size: 13px; color: ${BLUE}; }
//   .ac-toc-item--batch { cursor: default; }
//   .ac-toc-item--batch:hover { background: transparent; }
//   .ac-toc-item--unit strong { color: #1e3a8a; }
//   .ac-toc-item--chapter strong { font-weight: 600; }
//   .ac-toc-item--subtopic {
//     cursor: default; padding: 4px 10px 4px 6px; align-items: center;
//   }
//   .ac-toc-item--subtopic:hover { background: transparent; }
//   .ac-toc-item--subtopic span { font-size: 11px; font-weight: 500; text-transform: none; color: #475569; letter-spacing: 0; }
//   .ac-toc-item__dot { font-size: 5px; color: #94a3b8; margin-top: 0; width: 12px; text-align: center; }
//   .ac-toc-item--session { border: 1px solid transparent; }
//   .ac-toc-item--session strong { font-size: 11px; font-weight: 600; }
//   .ac-toc-item--session-active {
//     background: #eff6ff; border-color: #bfdbfe; box-shadow: inset 3px 0 0 ${BLUE};
//   }
//   .ac-toc-item__session-icon { color: ${BLUE}; font-size: 11px; margin-top: 3px; width: 12px; }

//   .ac-session-rows {
//     background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;
//   }
//   .ac-session-rows__head {
//     display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px;
//     padding: 14px 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;
//   }
//   .ac-session-rows__head h3 {
//     margin: 0; font-size: 14px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;
//   }
//   .ac-session-rows__head span { font-size: 12px; color: #64748b; font-weight: 600; }
//   .ac-session-row {
//     display: grid; grid-template-columns: 44px minmax(0, 1fr) auto 16px; gap: 12px; align-items: center;
//     width: 100%; padding: 14px 16px; border: none; border-bottom: 1px solid #f1f5f9;
//     background: #fff; text-align: left; cursor: pointer; transition: background 0.15s;
//   }
//   .ac-session-row:last-child { border-bottom: none; }
//   .ac-session-row:hover { background: #f8fafc; }
//   .ac-session-row--selected { background: #eff6ff; box-shadow: inset 3px 0 0 ${BLUE}; }
//   .ac-session-row__no {
//     width: 36px; height: 36px; border-radius: 10px; background: #eff6ff; color: ${BLUE};
//     display: grid; place-items: center; font-size: 12px; font-weight: 900;
//   }
//   .ac-session-row__body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
//   .ac-session-row__body strong { font-size: 13px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
//   .ac-session-row__body span { font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
//   .ac-session-row__meta { display: flex; align-items: center; gap: 8px; }
//   .ac-session-row__dot { width: 8px; height: 8px; border-radius: 999px; }
//   .ac-session-row__tag {
//     font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 999px;
//     background: #ede9fe; color: #6d28d9;
//   }
//   .ac-session-row__date { font-size: 11px; font-weight: 700; color: #94a3b8; }
//   .ac-session-row__arrow { color: #cbd5e1; font-size: 11px; }

//   .ac-side-panel {
//     position: sticky; top: 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 18px;
//     box-shadow: 0 16px 40px rgba(15,23,42,0.08); overflow: hidden; max-height: calc(100vh - 32px);
//     display: flex; flex-direction: column;
//   }
//   .ac-side-panel--empty { min-height: 320px; }
//   .ac-side-panel__empty {
//     flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
//     text-align: center; padding: 32px 24px; color: #64748b;
//   }
//   .ac-side-panel__empty i { font-size: 32px; color: #cbd5e1; margin-bottom: 12px; }
//   .ac-side-panel__empty h4 { margin: 0 0 8px; color: #0f172a; }
//   .ac-side-panel__empty p { margin: 0; font-size: 13px; line-height: 1.5; max-width: 240px; }
//   .ac-side-panel__head {
//     display: flex; justify-content: space-between; gap: 12px; padding: 16px 18px;
//     border-bottom: 1px solid #e2e8f0; border-left: 4px solid ${BLUE}; background: #f8fafc;
//   }
//   .ac-side-panel__label {
//     display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800;
//     text-transform: uppercase; color: #64748b; margin-bottom: 6px;
//   }
//   .ac-side-panel__head h4 { margin: 0 0 8px; font-size: 15px; line-height: 1.35; color: #0f172a; }
//   .ac-side-panel__close {
//     width: 32px; height: 32px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff;
//     cursor: pointer; color: #64748b; flex-shrink: 0;
//   }
//   .ac-side-panel__body { flex: 1; overflow: auto; padding: 8px 0; }
//   .ac-side-panel__section { padding: 12px 18px; border-bottom: 1px solid #f1f5f9; }
//   .ac-side-panel__section h5 {
//     margin: 0 0 10px; font-size: 10px; font-weight: 800; text-transform: uppercase;
//     letter-spacing: 0.05em; color: #94a3b8;
//   }
//   .ac-side-panel__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; }
//   .ac-side-panel__grid--tot { margin-top: 10px; }
//   .ac-side-panel__grid em, .ac-side-panel__subtopics em {
//     display: block; font-style: normal; font-size: 10px; font-weight: 700; text-transform: uppercase;
//     color: #94a3b8; margin-bottom: 3px;
//   }
//   .ac-side-panel__grid strong { font-size: 13px; color: #0f172a; line-height: 1.35; }
//   .ac-side-panel__subtopics ul { margin: 0; padding-left: 18px; }
//   .ac-side-panel__subtopics li { font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 4px; }
//   .ac-side-panel__subtopics p { margin: 0; font-size: 13px; color: #64748b; }
//   .ac-side-panel__badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
//   .ac-side-panel__notes { margin: 0; font-size: 13px; color: #475569; line-height: 1.5; }
//   .ac-side-panel__foot {
//     display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 18px; border-top: 1px solid #e2e8f0; background: #fff;
//   }
//   .ac-field { display: flex; flex-direction: column; gap: 6px; margin: 0; }
//   .ac-field--full { grid-column: 1 / -1; margin-top: 4px; }
//   .ac-field span {
//     font-size: 10px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8;
//   }
//   .ac-input {
//     min-height: 40px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 12px;
//     font-size: 13px; font-weight: 600; color: #0f172a; background: #f8fafc; width: 100%; box-sizing: border-box;
//   }
//   .ac-input:focus { outline: none; border-color: ${BLUE}; background: #fff; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
//   .ac-input--textarea { min-height: 88px; resize: vertical; }
//   .ac-evidence-builder { margin-top: 18px; padding-top: 16px; border-top: 1px solid #eef2f7; }
//   .ac-evidence-builder + .ac-evidence-builder { margin-top: 14px; }

//   .ac-tot-panel {
//     margin-top: 18px; padding: 16px; border: 1px solid #dbeafe; border-radius: 14px;
//     background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
//   }
//   .ac-tot-panel__head h6 {
//     margin: 0 0 6px; font-size: 14px; font-weight: 900; color: #0f172a;
//     display: flex; align-items: center; gap: 8px;
//   }
//   .ac-tot-panel__head h6 i { color: ${BLUE}; }
//   .ac-tot-panel__head p { margin: 0 0 14px; font-size: 12px; color: #64748b; line-height: 1.45; }
//   .ac-tot-type-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
//   .ac-tot-type-btn {
//     display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left;
//     border: 1.5px solid #e2e8f0; background: #fff; border-radius: 12px; padding: 12px 14px; cursor: pointer;
//   }
//   .ac-tot-type-btn strong { font-size: 12px; color: #0f172a; }
//   .ac-tot-type-btn span { font-size: 11px; color: #64748b; }
//   .ac-tot-type-btn--active {
//     border-color: ${BLUE}; background: #eff6ff; box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
//   }
//   .ac-tot-check {
//     display: flex; align-items: center; gap: 10px; margin: 0 0 12px;
//     font-size: 13px; font-weight: 700; color: #334155;
//   }
//   .ac-tot-check--include {
//     margin: 16px 0 0; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;
//   }
//   .ac-tot-check input { width: 16px; height: 16px; accent-color: ${BLUE}; }
//   .ac-tot-sync-box {
//     display: flex; gap: 12px; padding: 12px 14px; margin-bottom: 12px;
//     border: 1px solid #bfdbfe; border-radius: 12px; background: #eff6ff; color: #1e3a8a;
//   }
//   .ac-tot-sync-box i { color: ${BLUE}; margin-top: 2px; }
//   .ac-tot-sync-box strong { display: block; font-size: 13px; margin-bottom: 4px; }
//   .ac-tot-sync-box p { margin: 0; font-size: 12px; line-height: 1.45; }
//   .ac-tot-sync-box__method { margin-top: 6px !important; font-weight: 700; }
//   .ac-section-label {
//     display: inline-flex; align-items: center; gap: 8px; margin: 8px 0 12px;
//     font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${BLUE};
//   }
//   .ac-section-label small { font-size: 10px; font-weight: 600; text-transform: none; color: #94a3b8; margin-left: 4px; }
//   .ac-side-panel__grid--single { grid-template-columns: 1fr; }
//   .ac-toc-group { margin: 4px 0 8px; }
//   .ac-modal--confirm { width: min(420px, 100%); }
//   .ac-refer-modal__text { margin: 0; font-size: 14px; line-height: 1.55; color: #475569; }

//   .ac-tot-info-box {
//     display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; margin-bottom: 12px;
//     background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; font-size: 12px; color: #1e40af;
//   }
//   .ac-tot-info-box i { margin-top: 2px; }
//   .ac-tot-info-box p { margin: 0; line-height: 1.45; }
//   .ac-tot-status {
//     display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; margin-bottom: 12px;
//   }
//   .ac-tot-status--ok { background: #ecfdf5; border: 1px solid #bbf7d0; }
//   .ac-tot-status--warn { background: #fffbeb; border: 1px solid #fde68a; }
//   .ac-tot-status__icon { font-size: 18px; margin-top: 2px; }
//   .ac-tot-status--ok .ac-tot-status__icon { color: #059669; }
//   .ac-tot-status--warn .ac-tot-status__icon { color: #d97706; }
//   .ac-tot-status strong { display: block; font-size: 13px; color: #0f172a; margin-bottom: 4px; }
//   .ac-tot-status p { margin: 0; font-size: 12px; color: #475569; line-height: 1.45; }
//   .ac-tot-status__note { margin-top: 6px !important; font-weight: 700; }
//   .ac-tot-status__note--danger { color: #b91c1c !important; }
//   .ac-session-type-badge {
//     display: inline-flex; margin-top: 6px; padding: 3px 8px; border-radius: 999px;
//     font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
//   }
//   .ac-session-type-badge--student { background: rgba(255,255,255,0.22); color: #fff; border: 1px solid rgba(255,255,255,0.35); }
//   .ac-session-type-badge--tot { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
//   .ac-text--green { color: #059669; }
//   .ac-text--amber { color: #d97706; }

//   .ac-activity-picker {
//     margin: 16px 0; padding: 14px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;
//   }
//   .ac-activity-picker__head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 12px; }
//   .ac-activity-picker__head > div { display: flex; flex-direction: column; gap: 2px; }
//   .ac-activity-picker__head span { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
//   .ac-activity-picker__head small { font-size: 12px; color: #94a3b8; }
//   .ac-activity-clear {
//     border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; padding: 6px 10px;
//     font-size: 11px; font-weight: 700; color: #64748b; cursor: pointer;
//   }
//   .ac-activity-clear:hover { color: #0f172a; border-color: #cbd5e1; }
//   .ac-activity-picker__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
//   .ac-activity-chip {
//     display: flex; align-items: center; gap: 10px; text-align: left; padding: 10px 12px;
//     border: 1.5px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: 0.15s;
//   }
//   .ac-activity-chip:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(15,23,42,0.08); }
//   .ac-activity-chip--active { box-shadow: 0 0 0 2px var(--chip-color, #94a3b8); }
//   .ac-activity-chip__dot { width: 12px; height: 12px; border-radius: 999px; flex-shrink: 0; }
//   .ac-activity-chip__label { font-size: 12px; font-weight: 800; color: #0f172a; line-height: 1.3; flex: 1; }
//   .ac-activity-chip__check { font-size: 10px; color: var(--chip-color, #64748b); }

//   .ac-color-distribution {
//     background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; margin-bottom: 14px;
//   }
//   .ac-color-distribution__head {
//     display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 12px;
//   }
//   .ac-color-distribution__head h3 {
//     margin: 0; font-size: 14px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 8px;
//   }
//   .ac-color-distribution__head h3 i { color: ${PINK}; }
//   .ac-color-distribution__head span { font-size: 12px; color: #64748b; font-weight: 700; }
//   .ac-color-distribution__bar {
//     display: flex; height: 12px; border-radius: 999px; overflow: hidden; background: #e2e8f0; margin-bottom: 14px;
//   }
//   .ac-color-distribution__segment { min-width: 8px; transition: flex 0.2s; }
//   .ac-color-distribution__legend { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
//   .ac-color-distribution__legend-item {
//     display: grid; grid-template-columns: 12px 1fr; gap: 8px 10px; align-items: center;
//     padding: 10px 12px; border: 1px solid #eef2f7; border-radius: 10px; background: #fafbfc;
//   }
//   .ac-color-distribution__dot { width: 12px; height: 12px; border-radius: 999px; grid-row: span 2; }
//   .ac-color-distribution__legend-text strong { display: block; font-size: 12px; color: #0f172a; }
//   .ac-color-distribution__legend-text span { font-size: 11px; color: #64748b; font-weight: 700; }
//   .ac-color-distribution__meter { grid-column: 2; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
//   .ac-color-distribution__meter-fill { height: 100%; border-radius: 999px; min-width: 4px; }

//   .ac-activity-manage-head,
//   .ac-activity-manage-row {
//     display: grid; grid-template-columns: 1fr 180px 140px 40px; gap: 10px; align-items: center; margin-bottom: 8px;
//   }
//   .ac-activity-manage-head span {
//     font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;
//   }
//   .ac-color-field { display: flex; flex-direction: column; gap: 6px; }
//   .ac-color-input { width: 100%; height: 36px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2px; cursor: pointer; }
//   .ac-color-swatches { display: flex; flex-wrap: wrap; gap: 4px; }
//   .ac-color-swatch {
//     width: 18px; height: 18px; border-radius: 999px; border: 2px solid #fff;
//     box-shadow: 0 0 0 1px #cbd5e1; cursor: pointer; padding: 0;
//   }
//   .ac-color-swatch--active { box-shadow: 0 0 0 2px #0f172a; }
//   .ac-activity-preview-pill {
//     display: inline-flex; align-items: center; justify-content: center; min-height: 32px;
//     padding: 4px 10px; border-radius: 999px; color: #fff; font-size: 11px; font-weight: 800; text-align: center;
//   }
//   .ac-mini-btn--block { width: 100%; justify-content: center; margin-top: 8px; }

//   .ac-evidence-builder__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
//   .ac-evidence-builder__head h6 { margin: 0; font-size: 13px; font-weight: 900; }
//   .ac-evidence-hint { margin: 0 0 12px; font-size: 12px; color: #64748b; }
//   .ac-evidence-empty { margin: 0; font-size: 12px; color: #94a3b8; font-style: italic; }
//   .ac-evidence-row { display: grid; grid-template-columns: 1fr 130px 150px 40px; gap: 8px; margin-bottom: 8px; align-items: center; }
//   .ac-evidence-row--with-desc { grid-template-columns: 1.1fr 1.3fr 120px 140px 40px; }
//   .ac-evidence-row--head { margin-bottom: 6px; }
//   .ac-evidence-row--head span {
//     font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;
//   }
//   .ac-mini-btn {
//     border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; padding: 6px 10px;
//     font-size: 11px; font-weight: 700; cursor: pointer; color: ${BLUE};
//   }
//   .ac-remove-btn {
//     border: 1px solid #fecaca; background: #fff; border-radius: 8px; color: #b91c1c; cursor: pointer;
//   }

//   .ac-toast {
//     position: fixed; top: 20px; right: 20px; min-width: 260px; max-width: min(420px, calc(100vw - 40px));
//     background: #16a34a; color: #fff; border-radius: 10px; font-size: 13px; font-weight: 600;
//     z-index: 10000; overflow: hidden; box-shadow: 0 10px 28px rgba(22, 163, 74, 0.35);
//   }
//      .ac-toast__body {
//     display: flex; align-items: center; gap: 8px; padding: 12px 16px;
//   }
//   .ac-toast__progress {
//     height: 3px; background: rgba(255, 255, 255, 0.9); transform-origin: left center;
//     animation: ac-toast-progress 10s linear forwards;
//   }
//   @keyframes ac-toast-progress {
//     from { transform: scaleX(1); }
//     to { transform: scaleX(0); }
//   }

//   .ac-dual-calendars {
//     display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; align-items: start; margin-bottom: 16px;
//   }
//   .ac-calendar {
//     background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; min-width: 0;
//     box-shadow: 0 10px 28px rgba(15,23,42,0.06);
//   }
//   .ac-calendar__title-bar {
//     display: flex; align-items: center; justify-content: space-between; gap: 10px;
//     padding: 12px 14px; border-bottom: 1px solid #eef2f7;
//     background: color-mix(in srgb, var(--calendar-accent, ${GREEN}) 8%, white);
//   }
//   .ac-calendar__title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 900; color: #0f172a; }
//   .ac-calendar__title i { color: var(--calendar-accent, ${GREEN}); }
//   .ac-calendar__count {
//     font-size: 11px; font-weight: 800; color: var(--calendar-accent, ${GREEN});
//     background: color-mix(in srgb, var(--calendar-accent, ${GREEN}) 14%, white);
//     padding: 4px 10px; border-radius: 999px;
//   }
//   .ac-calendar__head {
//     display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
//     margin-bottom: 8px; padding: 14px 14px 0;
//   }
//   .ac-calendar__head h3 { margin: 0; font-size: 1.05rem; font-weight: 900; }
//   .ac-calendar__head-hint { font-size: 11px; font-weight: 700; color: #94a3b8; }
//   .ac-calendar__weekdays {
//     display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px;
//     padding: 0 14px 6px;
//   }
//   .ac-calendar__weekdays span {
//     text-align: center; font-size: 10px; font-weight: 800; color: #94a3b8;
//     text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 0;
//   }
//   .ac-calendar__grid {
//     display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));
//     gap: 4px; padding: 0 14px 14px; width: 100%; box-sizing: border-box;
//   }
//   .ac-calendar__day {
//     box-sizing: border-box; min-width: 0; width: 100%; max-width: 100%;
//     min-height: 88px; height: 100%;
//     border: 1px solid #eef2f7; border-radius: 10px; padding: 6px;
//     background: #fafbfc; display: flex; flex-direction: column; gap: 3px;
//     text-align: left; overflow: hidden;
//   }
//   .ac-calendar__day--muted { opacity: 0.35; }
//   .ac-calendar__day--slot {
//     background: #f8fafc; border-style: dashed; border-color: #e2e8f0;
//   }
//   .ac-calendar__day--slot .ac-calendar__day-num { color: #94a3b8; }
//   .ac-calendar__day--session {
//     margin: 0; font: inherit; color: inherit; appearance: none; -webkit-appearance: none;
//     cursor: pointer; border: 1px solid #eef2f7;
//     background: color-mix(in srgb, var(--event-color, ${BLUE}) 8%, white);
//     transition: border-color 0.15s, box-shadow 0.15s;
//   }
//   .ac-calendar__day--session:hover {
//     border-color: color-mix(in srgb, var(--event-color, ${BLUE}) 45%, #e2e8f0);
//   }
//   .ac-calendar__day--selected {
//     border-color: var(--event-color, ${GREEN});
//     box-shadow: inset 0 0 0 1.5px var(--event-color, ${GREEN});
//     background: color-mix(in srgb, var(--event-color, ${GREEN}) 16%, white);
//   }
//   .ac-calendar__day-num {
//     flex-shrink: 0; font-size: 12px; font-weight: 900; line-height: 1;
//     color: var(--event-color, #334155);
//   }
//   .ac-calendar__session-title {
//     font-size: 10px; font-weight: 700; color: #0f172a; line-height: 1.3;
//     display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
//     overflow: hidden; word-break: break-word; overflow-wrap: anywhere;
//   }
//   .ac-calendar__session-title--muted { color: #94a3b8; font-weight: 600; }
//   .ac-calendar__session-topic {
//     margin-top: auto; font-size: 9px; font-weight: 600; color: #64748b;
//     white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
//   }
//   .ac-calendar__empty {
//     margin: 0; padding: 24px 14px 28px; text-align: center; font-size: 13px; font-weight: 700; color: #94a3b8;
//   }

//   @media (max-width: 1100px) {
//     .ac-workspace, .ac-workspace--toc { grid-template-columns: 1fr; }
//     .ac-toc-panel, .ac-side-panel { position: static; max-height: none; }
//     .ac-dual-calendars { grid-template-columns: 1fr; }
//   }
//   @media (max-width: 768px) {
//     .ac-stats-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
//     .ac-tot-type-row { grid-template-columns: 1fr; }
//     .ac-session-card__grid { grid-template-columns: 1fr 1fr; }
//     .ac-form-grid { grid-template-columns: 1fr; }
//     .ac-field--span-2 { grid-column: span 1; }
//     .ac-evidence-row { grid-template-columns: 1fr; }
//     .ac-calendar__day { min-height: 72px; }
//     .ac-session-card__foot-right { margin-left: 0; width: 100%; }
//     .ac-toolbar { flex-direction: column; align-items: stretch; }
//     .ac-toolbar__actions { width: 100%; }
//     .ac-toolbar__actions .ac-btn { flex: 1; justify-content: center; }
//     .ac-activity-picker__grid { grid-template-columns: 1fr; }
//     .ac-color-distribution__legend { grid-template-columns: 1fr; }
//     .ac-activity-manage-head { display: none; }
//     .ac-activity-manage-row { grid-template-columns: 1fr; }
//   }
// `;

// export default AcademicCoordinatorModule;
