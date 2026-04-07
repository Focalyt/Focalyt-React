import React, { useEffect, useMemo, useState } from "react";

const formatTime = (date) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const formatDate = (date) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const getDurationText = (start, end) => {
  if (!start || !end) return "-";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return "-";
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const getMs = (d) => {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : null;
};

const durationTextFromMs = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) return "-";
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const TrainerAttendance = () => {

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = JSON.parse(sessionStorage.getItem("token") || "null");

  const [note, setNote] = useState("");
  const [punchInAt, setPunchInAt] = useState(null);
  const [punchOutAt, setPunchOutAt] = useState(null);
  const [status, setStatus] = useState("not_marked"); // not_marked | present | late | absent
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiMode, setAiMode] = useState("standard"); // standard | strict
  const [locationPermission, setLocationPermission] = useState("unknown"); // unknown | granted | denied | prompt
  const [deviceTimeSkewRisk, setDeviceTimeSkewRisk] = useState(false);
  const [punchInLocation, setPunchInLocation] = useState(null); // { latitude, longitude, accuracy, timestamp }
  const [punchOutLocation, setPunchOutLocation] = useState(null); // { latitude, longitude, accuracy, timestamp }
  const [punchInLocationName, setPunchInLocationName] = useState("");
  const [punchOutLocationName, setPunchOutLocationName] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const [historyQuery, setHistoryQuery] = useState("");
  const [historyStatus, setHistoryStatus] = useState("all"); // all | present | late | absent

  const [history, setHistory] = useState([]);

  const isPunchedIn = !!punchInAt && !punchOutAt;
  const isCompletedToday = !!punchInAt && !!punchOutAt;

  useEffect(() => {
    let cancelled = false;

    const checkPermissions = async () => {
      try {
        if (!navigator?.permissions?.query) return;
        const res = await navigator.permissions.query({ name: "geolocation" });
        if (!cancelled) setLocationPermission(res?.state || "unknown");
        res?.addEventListener?.("change", () => {
          if (!cancelled) setLocationPermission(res?.state || "unknown");
        });
      } catch {
        if (!cancelled) setLocationPermission("unknown");
      }
    };

    const checkDeviceTimeSkew = () => {
      // UI-only heuristic: if timezone offset is extreme or invalid, flag risk.
      // Real implementation should compare with server time.
      try {
        const offset = new Date().getTimezoneOffset();
        setDeviceTimeSkewRisk(!Number.isFinite(offset) || Math.abs(offset) > 14 * 60);
      } catch {
        setDeviceTimeSkewRisk(true);
      }
    };

    checkPermissions();
    checkDeviceTimeSkew();

    return () => {
      cancelled = true;
    };
  }, []);

  const todaySummary = useMemo(() => {
    const punchIn = punchInAt ? new Date(punchInAt) : null;
    const shiftStart = new Date();
    shiftStart.setHours(9, 30, 0, 0);
    const graceEnd = new Date();
    graceEnd.setHours(9, 40, 0, 0); // max punch-in time
    const shiftEnd = new Date();
    shiftEnd.setHours(18, 30, 0, 0);

    const punchInMs = getMs(punchInAt);
    const punchOutMs = getMs(punchOutAt);
    const shiftEndMs = getMs(shiftEnd);

    const isLate = punchIn ? punchIn.getTime() > graceEnd.getTime() : false;
    const isInGrace =
      punchIn ? punchIn.getTime() > shiftStart.getTime() && punchIn.getTime() <= graceEnd.getTime() : false;

    const extraMs =
      punchOutMs != null && shiftEndMs != null && punchOutMs > shiftEndMs ? punchOutMs - shiftEndMs : 0;

    const effectiveStatus =
      status !== "not_marked"
        ? status
        : punchInAt
          ? isLate
            ? "late"
            : "present"
          : "not_marked";

    return {
      effectiveStatus,
      duration: getDurationText(punchInAt, punchOutAt),
      isLate,
      isInGrace,
      extraTime: durationTextFromMs(extraMs),
    };
  }, [punchInAt, punchOutAt, status]);

  const getCurrentGeo = () => {
    return new Promise((resolve, reject) => {
      if (!navigator?.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: new Date(pos.timestamp || Date.now()).toISOString(),
          });
        },
        (err) => {
          let msg = "Unable to get location.";
          if (err?.code === 1) msg = "Location permission denied.";
          else if (err?.code === 2) msg = "Location unavailable.";
          else if (err?.code === 3) msg = "Location request timed out.";
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  };

  const reverseGeocode = async ({ latitude, longitude }) => {
    // Prefer Google Maps Geocoder (if present), fallback to OpenStreetMap Nominatim.
    try {
      if (window?.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        const res = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
        const first = res?.results?.[0];
        if (first?.formatted_address) return first.formatted_address;
      }
    } catch {
      // fall through
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        latitude
      )}&lon=${encodeURIComponent(longitude)}`;
      const r = await fetch(url, {
        headers: {
          "Accept": "application/json",
        },
      });
      const data = await r.json();
      return data?.display_name || "";
    } catch {
      return "";
    }
  };

  const aiSignals = useMemo(() => {
    const punchIn = punchInAt ? new Date(punchInAt) : null;
    const punchOut = punchOutAt ? new Date(punchOutAt) : null;
    const flags = [];

    if (!aiEnabled) {
      return { score: 0, flags: [], recommendation: "AI supervision is OFF." };
    }

    if (deviceTimeSkewRisk) flags.push("Device time looks unusual (verify server time sync)");
    if (locationPermission === "denied") flags.push("Location permission denied");
    if (locationPermission === "prompt" || locationPermission === "unknown")
      flags.push("Location permission not confirmed");
    if (punchIn && punchOut && punchOut.getTime() < punchIn.getTime())
      flags.push("Punch-out earlier than punch-in");

    const suspiciousNote =
      (note || "").toLowerCase().includes("network") ||
      (note || "").toLowerCase().includes("gps") ||
      (note || "").toLowerCase().includes("vpn");
    if (note?.trim() && suspiciousNote) flags.push("Note mentions network/GPS (review)");

    const base = aiMode === "strict" ? 80 : 90;
    const penalty = flags.length * (aiMode === "strict" ? 10 : 7);
    const score = Math.max(0, Math.min(100, base - penalty));

    const recommendation =
      score >= 90
        ? "Looks compliant. You can proceed."
        : score >= 70
          ? "Minor risks detected. Consider enabling location and adding a clear note."
          : "High risk. Attendance may need manual review.";

    return { score, flags, recommendation };
  }, [aiEnabled, aiMode, deviceTimeSkewRisk, locationPermission, note, punchInAt, punchOutAt]);

  const handlePunchIn = async () => {
    setGeoError("");
    setGeoLoading(true);
    try {
      const geo = await getCurrentGeo();
      const name = await reverseGeocode(geo);
      const now = new Date().toISOString();
      setPunchInAt(now);
      setPunchOutAt(null);
      setPunchInLocation(geo);
      setPunchOutLocation(null);
      setPunchInLocationName(name || "");
      setPunchOutLocationName("");
      setStatus("not_marked");
    } catch (e) {
      setGeoError(e?.message || "Unable to get location.");
    } finally {
      setGeoLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setGeoError("");
    setGeoLoading(true);
    try {
      const geo = await getCurrentGeo();
      const name = await reverseGeocode(geo);
      const now = new Date().toISOString();
      setPunchOutAt(now);
      setPunchOutLocation(geo);
      setPunchOutLocationName(name || "");
    } catch (e) {
      setGeoError(e?.message || "Unable to get location.");
    } finally {
      setGeoLoading(false);
    }
  };

  const handleResetToday = () => {
    setPunchInAt(null);
    setPunchOutAt(null);
    setStatus("not_marked");
    setNote("");
    setPunchInLocation(null);
    setPunchOutLocation(null);
    setPunchInLocationName("");
    setPunchOutLocationName("");
    setGeoError("");
  };

  const handleSaveToHistory = () => {
    if (!punchInAt) return;
    const record = {
      id: `h_${Date.now()}`,
      date: new Date().toISOString(),
      punchInAt,
      punchOutAt,
      punchInLocation,
      punchOutLocation,
      punchInLocationName,
      punchOutLocationName,
      status: todaySummary.effectiveStatus === "not_marked" ? "present" : todaySummary.effectiveStatus,
      note: note?.trim() || "",
    };
    setHistory((prev) => [record, ...prev]);
    handleResetToday();
  };

  const handleExportCsv = () => {
    const headers = ["Date", "Punch In", "Punch Out", "Duration", "Status", "Note"];
    const rows = history.map((h) => [
      formatDate(h.date),
      formatTime(h.punchInAt),
      formatTime(h.punchOutAt),
      getDurationText(h.punchInAt, h.punchOutAt),
      (h.status || "").toUpperCase(),
      (h.note || "").replaceAll('"', '""'),
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "")}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trainer_attendance_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const statusBadge = (s) => {
    if (s === "present") return "bg-success";
    if (s === "late") return "bg-warning text-dark";
    if (s === "absent") return "bg-danger";
    return "bg-secondary";
  };

  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    return history.filter((h) => {
      const statusOk = historyStatus === "all" ? true : h.status === historyStatus;
      if (!statusOk) return false;
      if (!q) return true;
      const hay = `${formatDate(h.date)} ${formatTime(h.punchInAt)} ${formatTime(h.punchOutAt)} ${h.status} ${h.note || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [history, historyQuery, historyStatus]);

  return (
    <div className="container-fluid">
      <div className="content-header row mb-2">
        <div className="content-header-left col-12">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h4 className="mb-0">Attendance</h4>
              <small className="text-muted">Self attendance with AI supervision</small>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary" onClick={handleExportCsv} disabled={history.length === 0}>
                Export
              </button>
              <button className="btn btn-outline-secondary" onClick={handleResetToday}>
                Reset
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveToHistory}
                disabled={!punchInAt}
                title={!punchInAt ? "Punch in first" : "Save record"}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-2 mb-2">
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <div className="text-muted small">Today status</div>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span className={`badge ${statusBadge(todaySummary.effectiveStatus)}`}>
                      {todaySummary.effectiveStatus === "not_marked"
                        ? "Not marked"
                        : todaySummary.effectiveStatus.toUpperCase()}
                    </span>
                    {todaySummary.isLate && todaySummary.effectiveStatus !== "absent" ? (
                      <span className="badge bg-light text-dark border">Late (after 09:40)</span>
                    ) : todaySummary.isInGrace && todaySummary.effectiveStatus !== "absent" ? (
                      <span className="badge bg-light text-dark border">Grace (09:30–09:40)</span>
                    ) : null}
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-muted small">Duration</div>
                  <div className="fw-bold">{todaySummary.duration}</div>
                  <div className="text-muted small mt-1">Extra time</div>
                  <div className="fw-bold">{todaySummary.extraTime}</div>
                </div>
              </div>
              <div className="row g-2 mt-2">
                <div className="col-6">
                  <div className="border rounded p-2">
                    <div className="text-muted small">Punch In</div>
                    <div className="fw-bold">{formatTime(punchInAt)}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-2">
                    <div className="text-muted small">Punch Out</div>
                    <div className="fw-bold">{formatTime(punchOutAt)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <div className="text-muted small">AI supervision</div>
                  <div className="fw-bold">{aiEnabled ? "Enabled" : "Disabled"}</div>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="aiEnabled"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="aiEnabled">
                    ON/OFF
                  </label>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between mt-2">
                <div className="text-muted small">AI score</div>
                <span className={`badge ${aiSignals.score >= 90 ? "bg-success" : aiSignals.score >= 70 ? "bg-warning text-dark" : "bg-danger"}`}>
                  {aiEnabled ? `${aiSignals.score}/100` : "-"}
                </span>
              </div>
              <div className="progress mt-2" style={{ height: 8 }}>
                <div
                  className={`progress-bar ${aiSignals.score >= 90 ? "bg-success" : aiSignals.score >= 70 ? "bg-warning" : "bg-danger"}`}
                  role="progressbar"
                  style={{ width: `${aiEnabled ? aiSignals.score : 0}%` }}
                  aria-valuenow={aiEnabled ? aiSignals.score : 0}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>

              <div className="d-flex align-items-center gap-2 mt-2">
                <select
                  className="form-select form-select-sm"
                  value={aiMode}
                  onChange={(e) => setAiMode(e.target.value)}
                  disabled={!aiEnabled}
                >
                  <option value="standard">Standard</option>
                  <option value="strict">Strict</option>
                </select>
                <small className="text-muted">Policy: max punch-in 09:40 • shift ends 18:30</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <div className="text-muted small">AI recommendations</div>
              <div className="fw-bold mt-1">{aiSignals.recommendation}</div>
              <div className="mt-2">
                <div className="d-flex align-items-center justify-content-between">
                  <small className="text-muted">Location permission</small>
                  <span className={`badge ${locationPermission === "granted" ? "bg-success" : locationPermission === "denied" ? "bg-danger" : "bg-secondary"}`}>
                    {locationPermission}
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between mt-1">
                  <small className="text-muted">Device time check</small>
                  <span className={`badge ${deviceTimeSkewRisk ? "bg-warning text-dark" : "bg-success"}`}>
                    {deviceTimeSkewRisk ? "Needs review" : "OK"}
                  </span>
                </div>
              </div>
              {aiEnabled && aiSignals.flags.length > 0 ? (
                <div className="alert alert-warning mt-2 mb-0 py-2">
                  <div className="fw-bold small mb-1">Flags</div>
                  <ul className="mb-0 ps-3 small">
                    {aiSignals.flags.slice(0, 3).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="alert alert-success mt-2 mb-0 py-2">
                  <div className="small mb-0">No flags detected.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-4 mb-2">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Today</h5>
            </div>
            <div className="card-body">
              {geoError ? (
                <div className="alert alert-warning py-2 mb-2">
                  <div className="fw-bold">Location required</div>
                  <div className="small">{geoError}</div>
                </div>
              ) : null}
              <div className="alert alert-light border mb-2">
                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <div>
                    <div className="text-muted small">Punch workflow</div>
                    <div className="fw-bold">
                      {isCompletedToday ? "Completed" : isPunchedIn ? "Punched in" : "Not started"}
                    </div>
                  </div>
                  <div className="text-muted small text-end">Save stores your entry in History.</div>
                </div>
              </div>

              <div className="border rounded p-2 mb-2">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="text-muted small">Location capture</div>
                  <span className={`badge ${geoLoading ? "bg-info" : punchInLocation || punchOutLocation ? "bg-success" : "bg-secondary"}`}>
                    {geoLoading ? "Capturing..." : punchInLocation || punchOutLocation ? "Captured" : "Not captured"}
                  </span>
                </div>
                <div className="row mt-2 small">
                  <div className="col-6">
                    <div className="text-muted">Punch In</div>
                    <div className="fw-bold">
                      {punchInLocationName || "-"}
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {punchInLocation
                        ? `${punchInLocation.latitude.toFixed(5)}, ${punchInLocation.longitude.toFixed(5)}`
                        : ""}
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted">Punch Out</div>
                    <div className="fw-bold">
                      {punchOutLocationName || "-"}
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {punchOutLocation
                        ? `${punchOutLocation.latitude.toFixed(5)}, ${punchOutLocation.longitude.toFixed(5)}`
                        : ""}
                    </div>
                  </div>
                </div>
                <div className="text-muted small mt-1">
                  Accuracy:{" "}
                  {punchOutLocation?.accuracy ?? punchInLocation?.accuracy ?? "-"}
                  {punchOutLocation?.accuracy || punchInLocation?.accuracy ? " m" : ""}
                </div>
              </div>

              <div className="mt-2">
                <label className="form-label">Note (optional)</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason / note..."
                />
              </div>

              <div className="d-flex gap-2 mt-3 flex-wrap">
                <button className="btn btn-success" onClick={handlePunchIn} disabled={geoLoading || isPunchedIn || isCompletedToday}>
                  Punch In
                </button>
                <button className="btn btn-danger" onClick={handlePunchOut} disabled={geoLoading || !isPunchedIn}>
                  Punch Out
                </button>
                <select
                  className="form-select"
                  style={{ maxWidth: 220 }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="not_marked">Auto</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8 mb-2">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h5 className="mb-0">History (demo)</h5>
              <div className="d-flex gap-2 flex-wrap">
                <input
                  className="form-control form-control-sm"
                  style={{ width: 220 }}
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  placeholder="Search..."
                />
                <select
                  className="form-select form-select-sm"
                  style={{ width: 170 }}
                  value={historyStatus}
                  onChange={(e) => setHistoryStatus(e.target.value)}
                >
                  <option value="all">All status</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="thead-light">
                    <tr>
                      <th style={{ whiteSpace: "nowrap" }}>Date</th>
                      <th style={{ whiteSpace: "nowrap" }}>Punch In</th>
                      <th style={{ whiteSpace: "nowrap" }}>Punch Out</th>
                      <th style={{ whiteSpace: "nowrap" }}>Duration</th>
                      <th style={{ whiteSpace: "nowrap" }}>Status</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-3 text-muted">
                          No matching records.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((h) => (
                        <tr key={h.id}>
                          <td style={{ whiteSpace: "nowrap" }}>{formatDate(h.date)}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{formatTime(h.punchInAt)}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{formatTime(h.punchOutAt)}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{getDurationText(h.punchInAt, h.punchOutAt)}</td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <span className={`badge ${statusBadge(h.status)}`}>{h.status.toUpperCase()}</span>
                          </td>
                          <td>{h.note || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerAttendance;

