import React, { useEffect, useMemo, useState } from "react";

const pad2 = (n) => String(n).padStart(2, "0");

const toISODate = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};

const formatShort = (d) =>
  new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });

const minutesFromHHMM = (hhmm) => {
  const [h, m] = (hhmm || "").split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

const TrainerAvailability = () => {
   const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = JSON.parse(sessionStorage.getItem('token'));


  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    date: toISODate(new Date()),
    startTime: "10:00",
    endTime: "18:00",
    type: "available", // available | blocked | leave
    title: "",
  });
  const [error, setError] = useState("");

  const weekDays = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const day = base.getDay(); // 0 Sun
    const diffToMon = (day + 6) % 7;
    base.setDate(base.getDate() - diffToMon + weekOffset * 7);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${formatShort(start)} - ${formatShort(end)}`;
  }, [weekDays]);

  const slotsThisWeek = useMemo(() => {
    const set = new Set(weekDays.map((d) => toISODate(d)));
    return slots
      .filter((s) => set.has(s.date))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [slots, weekDays]);

  const badgeClass = (type) => {
    if (type === "available") return "bg-success";
    if (type === "leave") return "bg-danger";
    return "bg-secondary";
  };

  const openCreate = (dateISO) => {
    setEditingId(null);
    setForm((p) => ({
      ...p,
      date: dateISO || toISODate(new Date()),
      startTime: "10:00",
      endTime: "18:00",
      type: "available",
      title: "",
    }));
    setError("");
    setShowModal(true);
  };

  const openEdit = (slot) => {
    setEditingId(slot.id);
    setForm({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      type: slot.type,
      title: slot.title || "",
    });
    setError("");
    setShowModal(true);
  };

  const validate = () => {
    const start = minutesFromHHMM(form.startTime);
    const end = minutesFromHHMM(form.endTime);
    if (!form.date) return "Date is required.";
    if (start == null || end == null) return "Start and End time are required.";
    if (start >= end) return "End time must be after start time.";

    const sameDay = slots.filter((s) => s.date === form.date && s.id !== editingId);
    for (const s of sameDay) {
      const sStart = minutesFromHHMM(s.startTime);
      const sEnd = minutesFromHHMM(s.endTime);
      if (sStart == null || sEnd == null) continue;
      if (overlaps(start, end, sStart, sEnd)) {
        return "This slot overlaps with an existing slot on the same day.";
      }
    }
    return "";
  };

  const handleSave = () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const payload = {
      id: editingId || `s_${Date.now()}`,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      type: form.type,
      title: form.title?.trim() || "",
      updatedAt: new Date().toISOString(),
    };

    setSlots((prev) => {
      const next = prev.filter((s) => s.id !== payload.id);
      return [payload, ...next];
    });
    setShowModal(false);
  };

  const handleDelete = (id) => {
    const ok = window.confirm("Delete this slot?");
    if (!ok) return;
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="container-fluid">
      <div className="content-header row mb-2">
        <div className="content-header-left col-12">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h4 className="mb-0">Availability</h4>
              <small className="text-muted">Set your working slots and leave blocks</small>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-outline-secondary" onClick={() => setWeekOffset((p) => p - 1)}>
                Prev
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setWeekOffset(0)}>
                This week
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setWeekOffset((p) => p + 1)}>
                Next
              </button>
              <button className="btn btn-primary" onClick={() => openCreate()}>
                Add Slot
              </button>
            </div>
          </div>
          <div className="mt-1 text-muted small">{weekRangeLabel}</div>
        </div>
      </div>

      <div className="row g-2">
        {weekDays.map((d) => {
          const dateISO = toISODate(d);
          const daySlots = slotsThisWeek.filter((s) => s.date === dateISO);
          return (
            <div className="col-12 col-md-6 col-xl-3" key={dateISO}>
              <div className="card h-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-bold">{formatShort(d)}</div>
                    <div className="text-muted small">{dateISO}</div>
                  </div>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => openCreate(dateISO)}>
                    +
                  </button>
                </div>
                <div className="card-body">
                  {daySlots.length === 0 ? (
                    <div className="text-muted small">No slots</div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {daySlots.map((s) => (
                        <div
                          key={s.id}
                          className="border rounded p-2 d-flex align-items-start justify-content-between gap-2"
                        >
                          <div>
                            <div className="fw-bold">
                              {s.startTime} - {s.endTime}{" "}
                              <span className={`badge ms-1 ${badgeClass(s.type)}`}>{s.type}</span>
                            </div>
                            <div className="text-muted small">{s.title || "—"}</div>
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(s)}>
                              Edit
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id)}>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal ? (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingId ? "Edit Slot" : "Add Slot"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                {error ? <div className="alert alert-danger">{error}</div> : null}
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Date</label>
                    <input
                      className="form-control"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Start time</label>
                    <input
                      className="form-control"
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">End time</label>
                    <input
                      className="form-control"
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Type</label>
                    <select
                      className="form-select"
                      value={form.type}
                      onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                    >
                      <option value="available">Available</option>
                      <option value="blocked">Blocked</option>
                      <option value="leave">Leave</option>
                    </select>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Title</label>
                    <input
                      className="form-control"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Optional (e.g., Batch A session, Personal work)"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TrainerAvailability;

