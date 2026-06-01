import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const PARTNER_TYPES = ["LRP", "Channel Partner"];

const MAX_STEPS = 3;

const readLrpMeta = (items, metaKey) => {
  const it = (items || []).find((x) => x && x.metaKey === metaKey);
  return it ? String(it.value || "").trim() : "";
};

const isValidMmDdYyyy = (value) => {
  const v = String(value || "").trim();
  if (!v) return false;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return false;
  const mm = Number(m[1]);
  const dd = Number(m[2]);
  const yyyy = Number(m[3]);
  if (yyyy < 1900 || yyyy > 2100) return false;
  if (mm < 1 || mm > 12) return false;
  const daysInMonth = new Date(yyyy, mm, 0).getDate();
  return dd >= 1 && dd <= daysInMonth;
};

const createInitialForm = () => ({
  b2bLeadId: "",
  leadCategory: "",
  b2bDepartment: "",
  b2bProject: "",
  typeOfB2B: "",
  partnerType: "",
  implementationPartnerName: "",
  visitDate: "",
  geoTaggedPhoto: null,
  state: "",
  district: "",
});

const Card = ({ number, title, children }) => (
  <div
    style={{
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
      marginBottom: "20px",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        padding: "16px 24px",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          background: "linear-gradient(135deg,#FC2B5A,#a5003a)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        {number}
      </div>
      <h5 style={{ margin: 0, fontWeight: 700, color: "#1e293b", fontSize: "15px" }}>{title}</h5>
    </div>
    <div style={{ padding: "20px 24px" }}>{children}</div>
  </div>
);

const WizardFooter = ({ isLast, step, submitting, onBack, onNext }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 18,
      paddingTop: 18,
      borderTop: "1px solid #f1f5f9",
    }}
  >
    <button
      type="button"
      onClick={onBack}
      disabled={step === 1 || submitting}
      style={{
        background: step === 1 ? "#e2e8f0" : "white",
        color: step === 1 ? "#94a3b8" : "#FC2B5A",
        border: "1.5px solid #FC2B5A",
        opacity: step === 1 ? 0.6 : 1,
        borderRadius: "10px",
        padding: "10px 18px",
        fontWeight: 700,
        fontSize: "13px",
        cursor: step === 1 || submitting ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      Back
    </button>

    {isLast ? (
      <button
        type="submit"
        disabled={submitting}
        style={{
          background: "linear-gradient(135deg,#FC2B5A,#a5003a)",
          color: "white",
          border: "none",
          borderRadius: "10px",
          padding: "10px 22px",
          fontWeight: 800,
          fontSize: "13px",
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.7 : 1,
          boxShadow: "0 4px 12px rgba(252,43,90,0.35)",
          whiteSpace: "nowrap",
        }}
      >
        {submitting ? "Saving..." : "Submit"}
      </button>
    ) : (
      <button
        type="button"
        onClick={onNext}
        disabled={submitting}
        style={{
          background: "linear-gradient(135deg,#FC2B5A,#a5003a)",
          color: "white",
          border: "none",
          borderRadius: "10px",
          padding: "10px 22px",
          fontWeight: 800,
          fontSize: "13px",
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.7 : 1,
          boxShadow: "0 4px 12px rgba(252,43,90,0.35)",
          whiteSpace: "nowrap",
        }}
      >
        Next
      </button>
    )}
  </div>
);

function Lrp() {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location?.search || ""), [location?.search]);
  const isEmbedded = searchParams.get("embedded") === "1";
  const mode = (searchParams.get("mode") || "add").toLowerCase(); // add | view
  const linkedB2bLeadId = useMemo(() => {
    const raw = searchParams.get("b2bLeadId") || searchParams.get("leadId") || "";
    return String(raw).trim();
  }, [searchParams]);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => createInitialForm());
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [leadCategoryOptions, setLeadCategoryOptions] = useState([]);
  const [allB2bDepartments, setAllB2bDepartments] = useState([]);
  const [allB2bProjects, setAllB2bProjects] = useState([]);
  const [allTypeOfB2BRaw, setAllTypeOfB2BRaw] = useState([]);
  const typeOfB2BOptions = useMemo(() => {
    const raw = Array.isArray(allTypeOfB2BRaw) ? allTypeOfB2BRaw : [];
    const deptId = String(form.b2bDepartment || "").trim();
    const filtered = deptId
      ? raw.filter((t) => String(t?.department?._id || t?.department || "").trim() === deptId)
      : raw;
    return filtered
      .filter((t) => t && t.isActive !== false)
      .map((t) => ({ value: t._id, label: t.name }));
  }, [allTypeOfB2BRaw, form.b2bDepartment]);
  const [categoryQuestions, setCategoryQuestions] = useState([]);
  const [leadSourceAnswers, setLeadSourceAnswers] = useState({});
  const [loadingB2bLeadContext, setLoadingB2bLeadContext] = useState(false);
  const [b2bLeadLoadError, setB2bLeadLoadError] = useState("");
  const [viewLeadSourceQA, setViewLeadSourceQA] = useState(null);
  const stateInputRef = useRef(null);
  const districtInputRef = useRef(null);
  const stateAutoRef = useRef(null);
  const districtAutoRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(Boolean(window.google && window.google.maps && window.google.maps.places));

  // Load Google Maps Places library (India-only autocomplete for state/district)
  useEffect(() => {
    if (googleReady) return;

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (document.querySelector('script[src*="maps.googleapis.com/maps/api"]')) return;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    document.head.appendChild(script);
  }, [googleReady]);

  // Init Places Autocomplete for State + District (step 2)
  useEffect(() => {
    if (!googleReady) return;
    if (step !== 2) return;
    if (!window.google?.maps?.places) return;

    const getFromComponents = (components, type) => {
      const c = (components || []).find((x) => Array.isArray(x?.types) && x.types.includes(type));
      return c ? String(c.long_name || c.short_name || "").trim() : "";
    };

    // State autocomplete
    if (stateInputRef.current && !stateAutoRef.current) {
      const ac = new window.google.maps.places.Autocomplete(stateInputRef.current, {
        types: ["(regions)"],
        componentRestrictions: { country: "IN" },
        fields: ["address_components"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const comps = place?.address_components || [];
        const state = getFromComponents(comps, "administrative_area_level_1");
        if (state) {
          setForm((prev) => ({ ...prev, state, district: "" }));
        }
      });
      stateAutoRef.current = ac;
    }

    // District autocomplete
    if (districtInputRef.current && !districtAutoRef.current) {
      const ac = new window.google.maps.places.Autocomplete(districtInputRef.current, {
        types: ["(regions)"],
        componentRestrictions: { country: "IN" },
        fields: ["address_components"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const comps = place?.address_components || [];
        const state = getFromComponents(comps, "administrative_area_level_1");
        const district =
          getFromComponents(comps, "administrative_area_level_2") ||
          getFromComponents(comps, "locality") ||
          getFromComponents(comps, "sublocality");
        setForm((prev) => ({
          ...prev,
          state: state || prev.state,
          district: district || prev.district,
        }));
      });
      districtAutoRef.current = ac;
    }
  }, [googleReady, step]);

  useEffect(() => {
    const loadB2BOptions = async () => {
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      if (!backendUrl || !token) return;
      try {
        const [catRes, deptRes, projRes, typeRes] = await Promise.all([
          fetch(`${backendUrl}/college/b2b/lead-categories?status=true`, {
            headers: { "x-auth": token },
          }),
          fetch(`${backendUrl}/college/b2b/b2b-departments?status=true`, {
            headers: { "x-auth": token },
          }),
          fetch(`${backendUrl}/college/b2b/b2b-projects?status=true`, {
            headers: { "x-auth": token },
          }),
          fetch(`${backendUrl}/college/b2b/type-of-b2b?status=true`, {
            headers: { "x-auth": token },
          }),
        ]);
        const catJson = await catRes.json();
        const deptJson = await deptRes.json();
        const projJson = await projRes.json();
        const typeJson = await typeRes.json();
        if (catJson.status && Array.isArray(catJson.data)) {
          setLeadCategoryOptions(
            catJson.data
              .filter((c) => c.isActive !== false)
              .map((c) => ({ value: c._id, label: c.name || c.title }))
          );
        }
        if (deptJson?.status && Array.isArray(deptJson.data)) {
          setAllB2bDepartments(deptJson.data.filter((d) => d && d.isActive !== false));
        }
        if (projJson?.status && Array.isArray(projJson.data)) {
          setAllB2bProjects(projJson.data.filter((p) => p && p.isActive !== false));
        }
        if (typeJson.status && Array.isArray(typeJson.data)) setAllTypeOfB2BRaw(typeJson.data);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[LRP] B2B dropdowns load failed", e);
      }
    };
    loadB2BOptions();
  }, []);


  useEffect(() => {
    try {
      const b2bLeadId = searchParams.get("b2bLeadId") || searchParams.get("leadId") || "";
      if (b2bLeadId) {
        setForm((prev) => ({ ...prev, b2bLeadId }));
      }
    } catch (e) {
      // ignore
    }
  }, [searchParams]);

  useEffect(() => {
    setViewLeadSourceQA(null);
    setCategoryQuestions([]);
    setLeadSourceAnswers({});
    setB2bLeadLoadError("");
  }, [mode, linkedB2bLeadId]);

  useEffect(() => {
    if (mode !== "add" || !linkedB2bLeadId) return;

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;
    if (!backendUrl || !token) return;

    const run = async () => {
      setLoadingB2bLeadContext(true);
      setB2bLeadLoadError("");
      try {
        const res = await fetch(`${backendUrl}/college/lrp/b2b-lead/${linkedB2bLeadId}`, {
          headers: { "x-auth": token },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success || !json?.data) {
          setB2bLeadLoadError(json?.message || "Could not load lead for this report.");
          setCategoryQuestions([]);
          return;
        }
        const lead = json.data;
        const cat = lead.leadCategory;
        const catId = cat && typeof cat === "object" ? cat._id : cat;
        const dept = lead.b2bDepartment;
        const deptId = dept && typeof dept === "object" ? dept._id : dept;
        const proj = lead.b2bProject;
        const projId = proj && typeof proj === "object" ? proj._id : proj;
        const typeId = lead.typeOfB2B && typeof lead.typeOfB2B === "object" ? lead.typeOfB2B._id : lead.typeOfB2B;
        const qs = cat && typeof cat === "object" && Array.isArray(cat.questions) ? cat.questions : [];
        setCategoryQuestions(qs.filter((q) => q && String(q.question || "").trim()));
        setLeadSourceAnswers({});

        setForm((prev) => {
          const st = String(lead.state || prev.state || "Punjab");
          const city = String(lead.city || "").trim();
          const dist = city || prev.district;
          return {
            ...prev,
            b2bLeadId: linkedB2bLeadId,
            leadCategory: catId ? String(catId) : prev.leadCategory,
            b2bDepartment: deptId ? String(deptId) : prev.b2bDepartment,
            b2bProject: projId ? String(projId) : prev.b2bProject,
            typeOfB2B: typeId ? String(typeId) : prev.typeOfB2B,
            state: st,
            district: dist,
          };
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[LRP] B2B lead load failed", e);
        setB2bLeadLoadError("Could not load B2B lead for this report.");
        setCategoryQuestions([]);
      } finally {
        setLoadingB2bLeadContext(false);
      }
    };

    run();
  }, [mode, linkedB2bLeadId]);

  useEffect(() => {
    if (mode !== "add" || linkedB2bLeadId) return;
    const catId = form.leadCategory;
    if (!catId) {
      setCategoryQuestions([]);
      setLeadSourceAnswers({});
      return;
    }
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;
    if (!backendUrl || !token) return;
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`${backendUrl}/college/b2b/lead-categories/${catId}`, {
          headers: { "x-auth": token },
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !json?.status || !json?.data) {
          setCategoryQuestions([]);
          return;
        }
        const qs = Array.isArray(json.data.questions) ? json.data.questions : [];
        setCategoryQuestions(qs.filter((q) => q && String(q.question || "").trim()));
        setLeadSourceAnswers({});
      } catch {
        if (!cancelled) setCategoryQuestions([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [mode, linkedB2bLeadId, form.leadCategory]);

  useEffect(() => {
    const b2bLeadId = searchParams.get("b2bLeadId") || searchParams.get("leadId") || "";
    if (!b2bLeadId) return;
    if (mode !== "view") return;

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;
    if (!backendUrl || !token) return;

    const loadExisting = async () => {
      setLoadingExisting(true);
      try {
        const res = await fetch(`${backendUrl}/college/lrp/by-b2b-lead/${b2bLeadId}`, {
          headers: { "x-auth": token },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success) return;
        if (!json?.data) return;

        const d = json.data;
        if (d?.leadSourceQA?.items?.length) {
          setViewLeadSourceQA(d.leadSourceQA);
        } else {
          setViewLeadSourceQA(null);
        }
        const catIdFromQa =
          d.leadSourceQA?.categoryId && typeof d.leadSourceQA.categoryId === "object"
            ? d.leadSourceQA.categoryId._id
            : d.leadSourceQA?.categoryId;
        const qaItems = d.leadSourceQA?.items || [];
        setForm((prev) => ({
          ...prev,
          b2bLeadId,
          leadCategory: catIdFromQa ? String(catIdFromQa) : prev.leadCategory,
          partnerType: readLrpMeta(qaItems, "lrp_partnerType"),
          implementationPartnerName: readLrpMeta(qaItems, "lrp_implementationPartnerName"),
          visitDate: readLrpMeta(qaItems, "lrp_visitDate"),
          geoTaggedPhoto: null,
          state: readLrpMeta(qaItems, "lrp_state") || prev.state,
          district: readLrpMeta(qaItems, "lrp_district"),
        }));
        setTouched({});
        setStep(1);
      } finally {
        setLoadingExisting(false);
      }
    };

    loadExisting();
  }, [searchParams, mode]);

  const fldStyle = {
    width: "100%",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#1e293b",
    background: "#f8fafc",
    outline: "none",
  };
  const lblStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "5px",
  };
  const reqStar = <span style={{ color: "#FC2B5A" }}>*</span>;

  const setValue = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const markTouched = (key) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const isNonEmpty = (v) => String(v || "").trim().length > 0;

  const departmentProjects = useMemo(() => {
    const deptId = String(form.b2bDepartment || "").trim();
    if (!deptId) return [];
    return (allB2bProjects || []).filter(
      (p) => String(p?.department?._id || p?.department || "").trim() === deptId
    );
  }, [allB2bProjects, form.b2bDepartment]);

  const getErrorsForStep = (s) => {
    const e = {};

    if (s === 1) {
      if (!isNonEmpty(form.b2bDepartment)) e.b2bDepartment = "Required for B2B lead";
      if (!isNonEmpty(form.b2bProject)) e.b2bProject = "Required for B2B lead";
      if (!isNonEmpty(form.leadCategory)) e.leadCategory = "Required for B2B lead";
      if (!isNonEmpty(form.typeOfB2B)) e.typeOfB2B = "Required for B2B lead";
      if (!isNonEmpty(form.partnerType)) e.partnerType = "Required";
      if (!isNonEmpty(form.implementationPartnerName)) e.implementationPartnerName = "Required";
      if (!isNonEmpty(form.visitDate)) e.visitDate = "Required";
      if (isNonEmpty(form.visitDate) && !isValidMmDdYyyy(form.visitDate)) e.visitDate = "Use mm/dd/yyyy";
    }

    if (s === 2) {
      if (!isNonEmpty(form.state)) e.state = "Required";
      if (!isNonEmpty(form.district)) e.district = "Required";
    }

    if (s === 3) {
      if (mode !== "add") return e;
      if (!categoryQuestions.length) {
        e._leadSourceEmpty =
          "No questions are configured for this lead source. Add questions under B2B Lead Source settings.";
      }
      categoryQuestions.forEach((q, i) => {
        if (!q?.required) return;
        if (!String(leadSourceAnswers[i] ?? "").trim()) {
          e[`ls_${i}`] = "Required";
        }
      });
      categoryQuestions.forEach((q, i) => {
        const v = String(leadSourceAnswers[i] ?? "").trim();
        if (!v || q?.type !== "number") return;
        if (Number.isNaN(Number(v))) {
          e[`ls_${i}`] = "Enter a valid number";
        }
      });
      categoryQuestions.forEach((q, i) => {
        const v = String(leadSourceAnswers[i] ?? "").trim();
        if (!v || q?.type !== "radio" || !Array.isArray(q.options) || !q.options.length) return;
        const ok = q.options.some((o) => String(o).trim() === v);
        if (!ok) e[`ls_${i}`] = "Choose one of the listed options";
      });
    }

    return e;
  };

  const errors = useMemo(
    () => getErrorsForStep(step),
    [step, form, mode, categoryQuestions, leadSourceAnswers]
  );
  const hasStepErrors = Object.keys(errors).length > 0;

  const touchAllForStep = (s) => {
    const keys = Object.keys(getErrorsForStep(s));
    if (keys.length === 0) return;
    setTouched((prev) => {
      const next = { ...prev };
      keys.forEach((k) => {
        next[k] = true;
      });
      return next;
    });
  };

  const onNext = () => {
    touchAllForStep(step);
    if (Object.keys(getErrorsForStep(step)).length > 0) return;
    setStep((prev) => Math.min(MAX_STEPS, prev + 1));
  };

  const onBack = () => setStep((prev) => Math.max(1, prev - 1));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (mode !== "add") return;
    const stepsToValidate = [1, 2, 3];
    stepsToValidate.forEach((s) => touchAllForStep(s));
    const hasErrors = stepsToValidate.some((s) => Object.keys(getErrorsForStep(s)).length > 0);
    if (hasErrors) return;

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

    if (!backendUrl) return alert("Backend URL missing in .env (REACT_APP_MIPIE_BACKEND_URL)");
    if (!token) return alert("Login required (missing x-auth token)");

    try {
      setSubmitting(true);

      const fd = new FormData();
      Object.keys(form).forEach((k) => {
        if (k === "geoTaggedPhoto") return;
        const v = form[k];
        if (v === undefined || v === null) return;
        fd.append(k, String(v));
      });

      // Match existing upload patterns (like KYC): send file as key "file"
      if (form.geoTaggedPhoto) {
        fd.append("file", form.geoTaggedPhoto);
      }

      if (mode === "add" && categoryQuestions.length) {
        const payload = {
          categoryId: form.leadCategory,
          items: categoryQuestions.map((q, i) => ({
            question: q.question || "",
            type: ["text", "number", "radio", "date"].includes(q.type) ? q.type : "text",
            options: Array.isArray(q.options) ? q.options : [],
            required: !!q.required,
            value: String(leadSourceAnswers[i] ?? "").trim(),
          })),
        };
        fd.append("leadSourceQA", JSON.stringify(payload));
      }

      const res = await fetch(`${backendUrl}/college/lrp`, {
        method: "POST",
        headers: { "x-auth": token },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Unable to save LRP lead");
      }

      if (data.b2b?.created) {
        alert("LRP saved and B2B lead created.");
      } else {
        alert(
          `LRP saved.${data.b2b?.message ? `\n${data.b2b.message}` : ""}`
        );
      }
      setForm((prev) => ({
        ...createInitialForm(),
        b2bLeadId: prev.b2bLeadId || searchParams.get("b2bLeadId") || searchParams.get("leadId") || "",
      }));
      setLeadSourceAnswers({});
      setTouched({});
      setStep(1);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[LRP] Save error", err);
      alert(err?.message || "Unable to save LRP lead");
    } finally {
      setSubmitting(false);
    }
  };

  const FieldError = ({ name }) => {
    if (!touched[name] || !errors[name]) return null;
    return (
      <div style={{ marginTop: 6, color: "#dc2626", fontSize: 12, fontWeight: 600 }}>
        {errors[name]}
      </div>
    );
  };

  return (
    <div style={{ background: isEmbedded ? "#ffffff" : "#f1f5f9", minHeight: isEmbedded ? "auto" : "100vh", padding: isEmbedded ? "16px" : "20px" }}>
      {!isEmbedded && (
        <div
          style={{
            background: "linear-gradient(135deg, #FC2B5A 0%, #a5003a 100%)",
            borderRadius: "16px",
            padding: "24px 32px",
            marginBottom: "24px",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            boxShadow: "0 10px 25px rgba(252,43,90,0.35)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "12px", padding: "10px 14px" }}>
            <i className="fa fa-handshake-o" style={{ fontSize: "20px" }} />
          </div>
          <div style={{ flex: "1 1 auto" }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: "22px" }}>Lead Report</h2>
           
          </div>
        </div>
      )}

      {loadingExisting && (
        <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: "#475569" }}>
          Loading existing report...
        </div>
      )}

      {b2bLeadLoadError && mode === "add" && linkedB2bLeadId && (
        <div
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 10,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {b2bLeadLoadError}
        </div>
      )}

      {isEmbedded && (
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            padding: "0 2px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: "20px", color: "#881337" }}>Lead Report</h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
              Step {step} of {MAX_STEPS} {hasStepErrors && <span style={{ marginLeft: 8 }}>(Fix required fields)</span>}
            </p>
          </div>
          {form.b2bLeadId && (
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#9f1239", background: "#fff1f5", border: "1px solid #fbcfe8", borderRadius: "999px", padding: "6px 10px" }}>
              Linked lead: {form.b2bLeadId}
            </div>
          )}
        </div>
      )}

      <form onSubmit={onSubmit}>
        {step === 1 && (
          <Card number={1} title="Partner & Visit Details">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 240px", minWidth: 220 }}>
                <label style={lblStyle}>B2B department {reqStar}</label>
                <select
                  value={form.b2bDepartment}
                  onChange={(e) => {
                    const next = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      b2bDepartment: next,
                      b2bProject: "",
                      typeOfB2B: "",
                    }));
                  }}
                  onBlur={() => markTouched("b2bDepartment")}
                  disabled={mode === "add" && !!linkedB2bLeadId}
                  style={{
                    ...fldStyle,
                    opacity: mode === "add" && linkedB2bLeadId ? 0.75 : 1,
                    cursor: mode === "add" && linkedB2bLeadId ? "not-allowed" : "default",
                  }}
                >
                  <option value="">Select department</option>
                  {allB2bDepartments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <FieldError name="b2bDepartment" />
              </div>

              <div style={{ flex: "1 1 240px", minWidth: 220 }}>
                <label style={lblStyle}>B2B project {reqStar}</label>
                <select
                  value={form.b2bProject}
                  onChange={(e) => setValue("b2bProject", e.target.value)}
                  onBlur={() => markTouched("b2bProject")}
                  disabled={!form.b2bDepartment || (mode === "add" && !!linkedB2bLeadId)}
                  style={{
                    ...fldStyle,
                    opacity: !form.b2bDepartment || (mode === "add" && linkedB2bLeadId) ? 0.75 : 1,
                    cursor: !form.b2bDepartment || (mode === "add" && linkedB2bLeadId) ? "not-allowed" : "default",
                  }}
                >
                  <option value="">
                    {form.b2bDepartment ? "Select project" : "Select department first"}
                  </option>
                  {departmentProjects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <FieldError name="b2bProject" />
              </div>

              <div style={{ flex: "1 1 240px", minWidth: 220 }}>
                <label style={lblStyle}>B2B lead source {reqStar}</label>
                <select
                  value={form.leadCategory}
                  onChange={(e) => setValue("leadCategory", e.target.value)}
                  onBlur={() => markTouched("leadCategory")}
                  disabled={mode === "add" && !!linkedB2bLeadId}
                  style={{
                    ...fldStyle,
                    opacity: mode === "add" && linkedB2bLeadId ? 0.75 : 1,
                    cursor: mode === "add" && linkedB2bLeadId ? "not-allowed" : "default",
                  }}
                >
                  <option value="">Select lead source</option>
                  {leadCategoryOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <FieldError name="leadCategory" />
              </div>

              <div style={{ flex: "1 1 240px", minWidth: 220 }}>
                <label style={lblStyle}>B2B type {reqStar}</label>
                <select
                  value={form.typeOfB2B}
                  onChange={(e) => setValue("typeOfB2B", e.target.value)}
                  onBlur={() => markTouched("typeOfB2B")}
                  disabled={!form.b2bDepartment || (mode === "add" && !!linkedB2bLeadId)}
                  style={{
                    ...fldStyle,
                    opacity: !form.b2bDepartment || (mode === "add" && linkedB2bLeadId) ? 0.75 : 1,
                    cursor: !form.b2bDepartment || (mode === "add" && linkedB2bLeadId) ? "not-allowed" : "default",
                  }}
                >
                  <option value="">
                    {form.b2bDepartment ? "Select type" : "Select department first"}
                  </option>
                  {typeOfB2BOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <FieldError name="typeOfB2B" />
              </div>

              <div style={{ flex: "1 1 240px", minWidth: 220 }}>
                <label style={lblStyle}>Type of partner {reqStar}</label>
                <select
                  value={form.partnerType}
                  onChange={(e) => setValue("partnerType", e.target.value)}
                  onBlur={() => markTouched("partnerType")}
                  style={fldStyle}
                >
                  <option value="">Select partner</option>
                  {PARTNER_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <FieldError name="partnerType" />
              </div>

              <div style={{ flex: "1 1 360px", minWidth: 260 }}>
                <label style={lblStyle}>Field implementation partner name {reqStar}</label>
                <input
                  type="text"
                  value={form.implementationPartnerName}
                  onChange={(e) => setValue("implementationPartnerName", e.target.value)}
                  onBlur={() => markTouched("implementationPartnerName")}
                  placeholder="Enter partner name"
                  autoComplete="off"
                  style={fldStyle}
                />
                <FieldError name="implementationPartnerName" />
              </div>

              <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                <label style={lblStyle}>Visit date {reqStar}</label>
                <input
                  type="text"
                  value={form.visitDate}
                  onChange={(e) => setValue("visitDate", e.target.value)}
                  onBlur={() => markTouched("visitDate")}
                  placeholder="mm/dd/yyyy"
                  inputMode="numeric"
                  autoComplete="off"
                  style={fldStyle}
                />
                <FieldError name="visitDate" />
              </div>

              <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                <label style={lblStyle}>Upload geo-tagged photograph (during visit)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                    setValue("geoTaggedPhoto", file);
                  }}
                  onBlur={() => markTouched("geoTaggedPhoto")}
                  style={{ ...fldStyle, background: "white", padding: "7px 12px" }}
                />
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                  {form.geoTaggedPhoto ? `Selected: ${form.geoTaggedPhoto.name}` : "Upload 1 supported file. Max 100 MB."}
                </div>
                {/* optional */}
              </div>
            </div>

            <WizardFooter step={step} submitting={submitting} onBack={onBack} onNext={onNext} />
          </Card>
        )}

        {step === 2 && (
          <Card number={2} title="State & District">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 240px", minWidth: 220 }}>
                <label style={lblStyle}>State {reqStar}</label>
                <input
                  ref={stateInputRef}
                  value={form.state}
                  onChange={(e) => setValue("state", e.target.value)}
                  onBlur={() => markTouched("state")}
                  placeholder={googleReady ? "Start typing state…" : "Loading Google…"}
                  autoComplete="off"
                  style={fldStyle}
                />
                <FieldError name="state" />
              </div>

              <div style={{ flex: "1 1 280px", minWidth: 240 }}>
                <label style={lblStyle}>District {reqStar}</label>
                <input
                  ref={districtInputRef}
                  value={form.district}
                  onChange={(e) => setValue("district", e.target.value)}
                  onBlur={() => markTouched("district")}
                  placeholder={googleReady ? "Start typing district…" : "Loading Google…"}
                  autoComplete="off"
                  style={fldStyle}
                />
                <FieldError name="district" />
              </div>
            </div>

            <WizardFooter step={step} submitting={submitting} onBack={onBack} onNext={onNext} />
          </Card>
        )}

        {step === 3 && (
          <Card number={3} title="Lead source details">
            {mode === "view" ? (
              viewLeadSourceQA?.items?.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {viewLeadSourceQA.items
                    .filter((it) => it && !it.metaKey)
                    .map((item, i) => (
                      <div
                        key={`${i}-${item.question}`}
                        style={{
                          paddingBottom: 12,
                          borderBottom: i < viewLeadSourceQA.items.length - 1 ? "1px solid #f1f5f9" : "none",
                        }}
                      >
                        <div style={lblStyle}>{item.question}</div>
                        <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>
                          {String(item.value || "").trim() ? item.value : "—"}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 14, color: "#64748b", fontWeight: 600 }}>
                  No questionnaire on file for this report.
                </p>
              )
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
                {linkedB2bLeadId && loadingB2bLeadContext && (
                  <div style={{ flex: "1 1 100%", fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                    Loading lead source questionnaire…
                  </div>
                )}
                {(!linkedB2bLeadId || !loadingB2bLeadContext) &&
                  categoryQuestions.map((q, i) => (
                    <div key={`${i}-${q.question}`} style={{ flex: "1 1 360px", minWidth: 240 }}>
                      <label style={lblStyle}>
                        {q.question} {q.required ? reqStar : null}
                      </label>

                      {q.type === "radio" ? (
                        <select
                          value={leadSourceAnswers[i] ?? ""}
                          onChange={(e) => setLeadSourceAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                          onBlur={() => markTouched(`ls_${i}`)}
                          style={fldStyle}
                        >
                          <option value="">Choose</option>
                          {(q.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : q.type === "number" ? (
                        <input
                          inputMode="decimal"
                          value={leadSourceAnswers[i] ?? ""}
                          onChange={(e) =>
                            setLeadSourceAnswers((prev) => ({
                              ...prev,
                              [i]: e.target.value.replace(/[^\d.-]/g, ""),
                            }))
                          }
                          onBlur={() => markTouched(`ls_${i}`)}
                          style={fldStyle}
                        />
                      ) : q.type === "date" ? (
                        <input
                          type="date"
                          value={leadSourceAnswers[i] ?? ""}
                          onChange={(e) => setLeadSourceAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                          onBlur={() => markTouched(`ls_${i}`)}
                          style={fldStyle}
                        />
                      ) : (
                        <input
                          value={leadSourceAnswers[i] ?? ""}
                          onChange={(e) => setLeadSourceAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                          onBlur={() => markTouched(`ls_${i}`)}
                          style={fldStyle}
                        />
                      )}

                      <FieldError name={`ls_${i}`} />
                    </div>
                  ))}
                <FieldError name="_leadSourceEmpty" />
              </div>
            )}

            <WizardFooter isLast step={step} submitting={submitting} onBack={onBack} onNext={onNext} />
          </Card>
        )}
      </form>
    </div>
  );
}

export default Lrp;
