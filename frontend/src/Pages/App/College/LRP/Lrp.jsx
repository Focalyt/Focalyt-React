import React, { useEffect, useMemo, useState } from "react";

const PARTNER_TYPES = ["LRP", "Channel Partner"];
const STATES = ["Punjab", "Haryana"];

const DISTRICTS_BY_STATE = {
  Punjab: [
    "Amritsar",
    "Barnala",
    "Bathinda",
    "Faridkot",
    "Fatehgarh Sahib",
    "Fazilka",
    "Ferozepur",
    "Gurdaspur",
    "Hoshiarpur",
    "Jalandhar",
    "Kapurthala",
    "Ludhiana",
    "Mansa",
    "Moga",
    "Muktsar",
    "Pathankot",
    "Patiala",
    "Rupnagar",
    "S.A.S. Nagar (Mohali)",
    "Sangrur",
    "Shahid Bhagat Singh Nagar (Nawanshahr)",
    "Tarn Taran",
  ],
  Haryana: [
    "Ambala",
    "Bhiwani",
    "Charkhi Dadri",
    "Faridabad",
    "Fatehabad",
    "Gurugram",
    "Hisar",
    "Jhajjar",
    "Jind",
    "Kaithal",
    "Karnal",
    "Kurukshetra",
    "Mahendragarh",
    "Nuh",
    "Palwal",
    "Panchkula",
    "Panipat",
    "Rewari",
    "Rohtak",
    "Sirsa",
    "Sonipat",
    "Yamunanagar",
  ],
};

const YES_NO = ["Yes", "No"];
const SCHOOL_TYPES = ["CBSE", "ICSE", "HBSE", "PSEB", "Other"];
const SUBSCRIPTION_PLANS = [
  "Basic (1 years)",
  "Growth (1 year)",
  "Premium (1 year)",
];
const FFTL_CLASSES = ["2.5th", "6th-9th", "10th-12th", "2th - 12th"];
const PO_TIMELINE = ["within 7 Days", "witin15 days", "within21 days", "within 30 days"];
const LEAD_STATUS = ["hot", "cold", "warm"];
const LOCK_LEAD = ["15 days", "30 days", "45 days", "60 days"];

const extractB2bMobileDigits = (form) => {
  const explicit = String(form.b2bMobile || "").replace(/\D/g, "");
  if (explicit.length >= 10) return explicit.slice(-10);
  const fromCoord = String(form.coordinatorNameContact || "").replace(/\D/g, "");
  if (fromCoord.length >= 10) return fromCoord.slice(-10);
  return "";
};

const isValidB2bMobile = (m) => /^[6-9]\d{9}$/.test(m);

const createInitialForm = () => ({
  // Stage 1 — also used for linked B2B lead
  leadCategory: "",
  typeOfB2B: "",
  partnerType: "",
  implementationPartnerName: "",
  visitDate: "",
  geoTaggedPhoto: null,

  // Stage 2
  state: "Punjab",
  district: "",

  // Stage 3
  schoolNameAddress: "",
  schoolType: "",
  schoolTypeOther: "",
  schoolEmail: "",
  coordinatorNameContact: "",
  b2bMobile: "",
  decisionMaker: "",
  studentsClass2to12: "",
  hasLabs: "",
  interestedWorkshop: "",
  avgStudentsPerClass: "",
  preferredPlan: "",
  managementReadyApprove: "",
  meetingWithSeniorStaff: "",
  nextMeetingDate: "",
  hasComputerLab: "",
  computersAvailable: "",

  // Stage 4
  fftlClasses: "",
  openForPartnership: "",
  teachersAvailable: "",
  proposalExplainedSubmitted: "",
  poExpectedTimeline: "",
  leadStatus: "",
  lockLead: "",
  otherRemarks: "",
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
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => createInitialForm());
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [leadCategoryOptions, setLeadCategoryOptions] = useState([]);
  const [typeOfB2BOptions, setTypeOfB2BOptions] = useState([]);

  const districts = useMemo(() => {
    return DISTRICTS_BY_STATE[form.state] || [];
  }, [form.state]);

  useEffect(() => {
    // Keep district in sync with state selection
    if (!districts.includes(form.district)) {
      setForm((prev) => ({ ...prev, district: "" }));
    }
  }, [districts, form.district]);

  useEffect(() => {
    // Clear dependent fields when "Other" is not selected
    if (form.schoolType !== "Other" && form.schoolTypeOther) {
      setForm((prev) => ({ ...prev, schoolTypeOther: "" }));
    }
  }, [form.schoolType, form.schoolTypeOther]);

  useEffect(() => {
    // Computers available only meaningful when hasComputerLab == Yes
    if (form.hasComputerLab !== "Yes" && form.computersAvailable) {
      setForm((prev) => ({ ...prev, computersAvailable: "" }));
    }
  }, [form.hasComputerLab, form.computersAvailable]);

  useEffect(() => {
    const loadB2BOptions = async () => {
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      if (!backendUrl || !token) return;
      try {
        const [catRes, typeRes] = await Promise.all([
          fetch(`${backendUrl}/college/b2b/lead-categories?status=true`, {
            headers: { "x-auth": token },
          }),
          fetch(`${backendUrl}/college/b2b/type-of-b2b?status=true`, {
            headers: { "x-auth": token },
          }),
        ]);
        const catJson = await catRes.json();
        const typeJson = await typeRes.json();
        if (catJson.status && Array.isArray(catJson.data)) {
          setLeadCategoryOptions(
            catJson.data
              .filter((c) => c.isActive !== false)
              .map((c) => ({ value: c._id, label: c.name || c.title }))
          );
        }
        if (typeJson.status && Array.isArray(typeJson.data)) {
          setTypeOfB2BOptions(
            typeJson.data
              .filter((t) => t.isActive !== false)
              .map((t) => ({ value: t._id, label: t.name }))
          );
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[LRP] B2B dropdowns load failed", e);
      }
    };
    loadB2BOptions();
  }, []);

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

  const isEmailValid = (email) => {
    const v = (email || "").trim();
    if (!v) return false;
    // Simple check good enough for UI validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  };

  const isNonEmpty = (v) => String(v || "").trim().length > 0;
  const isPositiveInt = (v) => {
    if (v === "" || v === null || v === undefined) return false;
    const n = Number(v);
    return Number.isInteger(n) && n >= 0;
  };

  const getErrorsForStep = (s) => {
    const e = {};

    if (s === 1) {
      if (!isNonEmpty(form.leadCategory)) e.leadCategory = "Required for B2B lead";
      if (!isNonEmpty(form.typeOfB2B)) e.typeOfB2B = "Required for B2B lead";
      if (!isNonEmpty(form.partnerType)) e.partnerType = "Required";
      if (!isNonEmpty(form.implementationPartnerName)) e.implementationPartnerName = "Required";
      if (!isNonEmpty(form.visitDate)) e.visitDate = "Required";
      if (!form.geoTaggedPhoto) e.geoTaggedPhoto = "Required";
    }

    if (s === 2) {
      if (!isNonEmpty(form.state)) e.state = "Required";
      if (!isNonEmpty(form.district)) e.district = "Required";
    }

    if (s === 3) {
      if (!isNonEmpty(form.schoolNameAddress)) e.schoolNameAddress = "Required";
      if (!isNonEmpty(form.schoolType)) e.schoolType = "Required";
      if (form.schoolType === "Other" && !isNonEmpty(form.schoolTypeOther)) e.schoolTypeOther = "Required";
      if (!isEmailValid(form.schoolEmail)) e.schoolEmail = "Valid email required";
      if (!isNonEmpty(form.coordinatorNameContact)) e.coordinatorNameContact = "Required";
      const b2bM = extractB2bMobileDigits(form);
      if (!isValidB2bMobile(b2bM)) {
        e.b2bMobile =
          "Enter 10-digit mobile (or include 10 digits in coordinator contact) for B2B lead";
      }
      if (!isNonEmpty(form.decisionMaker)) e.decisionMaker = "Required";
      if (!isPositiveInt(form.studentsClass2to12)) e.studentsClass2to12 = "Number required";
      if (!isNonEmpty(form.hasLabs)) e.hasLabs = "Required";
      if (!isNonEmpty(form.interestedWorkshop)) e.interestedWorkshop = "Required";
      if (!isPositiveInt(form.avgStudentsPerClass)) e.avgStudentsPerClass = "Number required";
      if (!isNonEmpty(form.preferredPlan)) e.preferredPlan = "Required";
      if (!isNonEmpty(form.managementReadyApprove)) e.managementReadyApprove = "Required";
      if (!isNonEmpty(form.meetingWithSeniorStaff)) e.meetingWithSeniorStaff = "Required";
      if (!isNonEmpty(form.nextMeetingDate)) e.nextMeetingDate = "Required";
      if (!isNonEmpty(form.hasComputerLab)) e.hasComputerLab = "Required";
      if (form.hasComputerLab === "Yes" && !isPositiveInt(form.computersAvailable)) e.computersAvailable = "Number required";
    }

    if (s === 4) {
      if (!isNonEmpty(form.fftlClasses)) e.fftlClasses = "Required";
      if (!isNonEmpty(form.openForPartnership)) e.openForPartnership = "Required";
      if (!isNonEmpty(form.teachersAvailable)) e.teachersAvailable = "Required";
      if (!isNonEmpty(form.proposalExplainedSubmitted)) e.proposalExplainedSubmitted = "Required";
      if (!isNonEmpty(form.poExpectedTimeline)) e.poExpectedTimeline = "Required";
      if (!isNonEmpty(form.leadStatus)) e.leadStatus = "Required";
      if (!isNonEmpty(form.lockLead)) e.lockLead = "Required";
    }

    return e;
  };

  const errors = useMemo(() => getErrorsForStep(step), [step, form]);
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
    setStep((prev) => Math.min(4, prev + 1));
  };

  const onBack = () => setStep((prev) => Math.max(1, prev - 1));

  const onSubmit = async (e) => {
    e.preventDefault();
    [1, 2, 3, 4].forEach((s) => touchAllForStep(s));
    const hasErrors = [1, 2, 3, 4].some((s) => Object.keys(getErrorsForStep(s)).length > 0);
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
      setForm(createInitialForm());
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
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: "20px" }}>
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
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: "22px" }}>Daily Visit Report</h2>
          <p style={{ margin: "4px 0 0", opacity: 0.85, fontSize: "13px" }}>
            Step {step} of 4 {hasStepErrors && <span style={{ marginLeft: 8, opacity: 0.9 }}>(Fix required fields)</span>}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        {step === 1 && (
          <Card number={1} title="Partner & Visit Details">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" , alignItems: "flex-end"}}>
              <div style={{ flex: "1 1 240px", minWidth: 220 }}>
                <label style={lblStyle}>B2B lead category {reqStar}</label>
                <select
                  value={form.leadCategory}
                  onChange={(e) => setValue("leadCategory", e.target.value)}
                  onBlur={() => markTouched("leadCategory")}
                  style={fldStyle}
                >
                  <option value="">Select category</option>
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
                  style={fldStyle}
                >
                  <option value="">Select type</option>
                  {typeOfB2BOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <FieldError name="typeOfB2B" />
              </div>
              <div style={{ flex: "1 1 100%", minWidth: 220 }}>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                  These map to the same B2B lead as <strong>Add Lead</strong> in Sales B2B. School mobile can be entered in step 3 (coordinator or B2B mobile field).
                </p>
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
                <label style={lblStyle}>Field Implementation Partner Name {reqStar}</label>
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
                <label style={lblStyle}>Visit Date {reqStar}</label>
                <input
                  type="date"
                  value={form.visitDate}
                  onChange={(e) => setValue("visitDate", e.target.value)}
                  onBlur={() => markTouched("visitDate")}
                  style={fldStyle}
                />
                <FieldError name="visitDate" />
              </div>

              <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                <label style={lblStyle}>Upload Geo-Tagged Photograph (During Visit) {reqStar}</label>
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
                <FieldError name="geoTaggedPhoto" />
              </div>
            </div>

            <WizardFooter step={step} submitting={submitting} onBack={onBack} onNext={onNext} />
          </Card>
        )}

        {step === 2 && (
          <Card number={2} title="State & District">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" , alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 240px", minWidth: 220 }}>
                <label style={lblStyle}>State {reqStar}</label>
                <select
                  value={form.state}
                  onChange={(e) => setValue("state", e.target.value)}
                  onBlur={() => markTouched("state")}
                  style={fldStyle}
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <FieldError name="state" />
              </div>

              <div style={{ flex: "1 1 280px", minWidth: 240 }}>
                <label style={lblStyle}>District {reqStar}</label>
                <select
                  value={form.district}
                  onChange={(e) => setValue("district", e.target.value)}
                  onBlur={() => markTouched("district")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <FieldError name="district" />
              </div>
            </div>

            <WizardFooter step={step} submitting={submitting} onBack={onBack} onNext={onNext} />
          </Card>
        )}

        {step === 3 && (
          <Card number={3} title="School Details">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px"  , alignItems: "flex-end"}}>
              <div style={{ flex: "1 1 420px", minWidth: 260 }}>
                <label style={lblStyle}>School Name & Address? {reqStar}</label>
                <input
                  value={form.schoolNameAddress}
                  onChange={(e) => setValue("schoolNameAddress", e.target.value)}
                  onBlur={() => markTouched("schoolNameAddress")}
                  placeholder="Enter school name and address"
                  style={fldStyle}
                />
                <FieldError name="schoolNameAddress" />
              </div>

              <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                <label style={lblStyle}>Type of School {reqStar}</label>
                <select
                  value={form.schoolType}
                  onChange={(e) => setValue("schoolType", e.target.value)}
                  onBlur={() => markTouched("schoolType")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {SCHOOL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <FieldError name="schoolType" />
              </div>

              {form.schoolType === "Other" && (
                <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                  <label style={lblStyle}>Other school type {reqStar}</label>
                  <input
                    value={form.schoolTypeOther}
                    onChange={(e) => setValue("schoolTypeOther", e.target.value)}
                    onBlur={() => markTouched("schoolTypeOther")}
                    placeholder="Enter school board/type"
                    style={fldStyle}
                  />
                  <FieldError name="schoolTypeOther" />
                </div>
              )}

              <div style={{ flex: "1 1 260px", minWidth: 220 }}>
                <label style={lblStyle}>School Email id {reqStar}</label>
                <input
                  type="email"
                  value={form.schoolEmail}
                  onChange={(e) => setValue("schoolEmail", e.target.value)}
                  onBlur={() => markTouched("schoolEmail")}
                  placeholder="school@example.com"
                  style={fldStyle}
                />
                <FieldError name="schoolEmail" />
              </div>

              <div style={{ flex: "1 1 360px", minWidth: 260 }}>
                <label style={lblStyle}>Name and Contact number of the coordinator? {reqStar}</label>
                <input
                  value={form.coordinatorNameContact}
                  onChange={(e) => setValue("coordinatorNameContact", e.target.value)}
                  onBlur={() => markTouched("coordinatorNameContact")}
                  placeholder="Name - 10 digit number"
                  style={fldStyle}
                />
                <FieldError name="coordinatorNameContact" />
              </div>

              <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                <label style={lblStyle}>B2B mobile (optional if in coordinator)</label>
                <input
                  type="tel"
                  maxLength={10}
                  inputMode="numeric"
                  value={form.b2bMobile}
                  onChange={(e) => setValue("b2bMobile", e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                  onBlur={() => markTouched("b2bMobile")}
                  placeholder="10-digit (if not in coordinator)"
                  style={fldStyle}
                />
                {/* <div style={{ marginTop: 4, fontSize: 11, color: "#64748b" }}>
                  Required for linked B2B lead if coordinator line has no mobile.
                </div> */}
                <FieldError name="b2bMobile" />
              </div>

              <div style={{ flex: "1 1 280px", minWidth: 240 }}>
                <label style={lblStyle}>Who is the decision maker in the school {reqStar}</label>
                <input
                  value={form.decisionMaker}
                  onChange={(e) => setValue("decisionMaker", e.target.value)}
                  onBlur={() => markTouched("decisionMaker")}
                  placeholder="Principal / Owner / Director ..."
                  style={fldStyle}
                />
                <FieldError name="decisionMaker" />
              </div>

              <div style={{ flex: "1 1 240px", minWidth: 220 }}>
                <label style={lblStyle}>Number of Students (Class 2–12) {reqStar}</label>
                <input
                  inputMode="numeric"
                  value={form.studentsClass2to12}
                  onChange={(e) => setValue("studentsClass2to12", e.target.value.replace(/[^\d]/g, ""))}
                  onBlur={() => markTouched("studentsClass2to12")}
                  placeholder="e.g. 850"
                  style={fldStyle}
                />
                <FieldError name="studentsClass2to12" />
              </div>

              <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                <label style={lblStyle}>Does the school have any AI, Robotics, or Technology Labs? {reqStar}</label>
                <select
                  value={form.hasLabs}
                  onChange={(e) => setValue("hasLabs", e.target.value)}
                  onBlur={() => markTouched("hasLabs")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {YES_NO.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError name="hasLabs" />
              </div>

              <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                <label style={lblStyle}>School’s interest in AI, Robotics & IoT Workshop/Demo session? {reqStar}</label>
                <select
                  value={form.interestedWorkshop}
                  onChange={(e) => setValue("interestedWorkshop", e.target.value)}
                  onBlur={() => markTouched("interestedWorkshop")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {YES_NO.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError name="interestedWorkshop" />
              </div>

              <div style={{ flex: "1 1 260px", minWidth: 220 }}>
                <label style={lblStyle}>Average number of students per class {reqStar}</label>
                <input
                  inputMode="numeric"
                  value={form.avgStudentsPerClass}
                  onChange={(e) => setValue("avgStudentsPerClass", e.target.value.replace(/[^\d]/g, ""))}
                  onBlur={() => markTouched("avgStudentsPerClass")}
                  placeholder="e.g. 35"
                  style={fldStyle}
                />
                <FieldError name="avgStudentsPerClass" />
              </div>

              <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                <label style={lblStyle}>Preferred Subscription Plan for the School? {reqStar}</label>
                <select
                  value={form.preferredPlan}
                  onChange={(e) => setValue("preferredPlan", e.target.value)}
                  onBlur={() => markTouched("preferredPlan")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {SUBSCRIPTION_PLANS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError name="preferredPlan" />
              </div>

              <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                <label style={lblStyle}>The school management ready to approve this initiative? {reqStar}</label>
                <select
                  value={form.managementReadyApprove}
                  onChange={(e) => setValue("managementReadyApprove", e.target.value)}
                  onBlur={() => markTouched("managementReadyApprove")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {YES_NO.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError name="managementReadyApprove" />
              </div>

              <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                <label style={lblStyle}>Interest in a meeting with senior staff to discuss the proposal? {reqStar}</label>
                <select
                  value={form.meetingWithSeniorStaff}
                  onChange={(e) => setValue("meetingWithSeniorStaff", e.target.value)}
                  onBlur={() => markTouched("meetingWithSeniorStaff")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {YES_NO.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError name="meetingWithSeniorStaff" />
              </div>

              <div style={{ flex: "1 1 260px", minWidth: 220 }}>
                <label style={lblStyle}>Next Meeting Date aligned for the senior Management {reqStar}</label>
                <input
                  type="date"
                  value={form.nextMeetingDate}
                  onChange={(e) => setValue("nextMeetingDate", e.target.value)}
                  onBlur={() => markTouched("nextMeetingDate")}
                  style={fldStyle}
                />
                <FieldError name="nextMeetingDate" />
              </div>

              <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                <label style={lblStyle}>Does your school currently have computer/lab facilities? {reqStar}</label>
                <select
                  value={form.hasComputerLab}
                  onChange={(e) => setValue("hasComputerLab", e.target.value)}
                  onBlur={() => markTouched("hasComputerLab")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {YES_NO.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError name="hasComputerLab" />
              </div>

              <div style={{ flex: "1 1 240px", minWidth: 220 }}>
                <label style={lblStyle}>How many computers are available ? {form.hasComputerLab === "Yes" ? reqStar : null}</label>
                <input
                  inputMode="numeric"
                  value={form.computersAvailable}
                  onChange={(e) => setValue("computersAvailable", e.target.value.replace(/[^\d]/g, ""))}
                  onBlur={() => markTouched("computersAvailable")}
                  placeholder={form.hasComputerLab === "Yes" ? "e.g. 25" : "Select Yes above to enable"}
                  disabled={form.hasComputerLab !== "Yes"}
                  style={{
                    ...fldStyle,
                    background: form.hasComputerLab === "Yes" ? "#f8fafc" : "#f1f5f9",
                    cursor: form.hasComputerLab === "Yes" ? "text" : "not-allowed",
                  }}
                />
                <FieldError name="computersAvailable" />
              </div>
            </div>

            <WizardFooter step={step} submitting={submitting} onBack={onBack} onNext={onNext} />
          </Card>
        )}

        {step === 4 && (
          <Card number={4} title="Program & Lead Status">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px"  , alignItems: "flex-end"}}>
              <div style={{ flex: "1 1 360px", minWidth: 260 }}>
                <label style={lblStyle}>For which classes is the school interested in implementing the FFTL training program? {reqStar}</label>
                <select
                  value={form.fftlClasses}
                  onChange={(e) => setValue("fftlClasses", e.target.value)}
                  onBlur={() => markTouched("fftlClasses")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {FFTL_CLASSES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError name="fftlClasses" />
              </div>

              <div style={{ flex: "1 1 320px", minWidth: 240 }}>
                <label style={lblStyle}>Is your school open for partnership/collaboration? {reqStar}</label>
                <select
                  value={form.openForPartnership}
                  onChange={(e) => setValue("openForPartnership", e.target.value)}
                  onBlur={() => markTouched("openForPartnership")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {YES_NO.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError name="openForPartnership" />
              </div>

              <div style={{ flex: "1 1 320px", minWidth: 240 }}>
                <label style={lblStyle}>Are teachers available for future technology training? {reqStar}</label>
                <select
                  value={form.teachersAvailable}
                  onChange={(e) => setValue("teachersAvailable", e.target.value)}
                  onBlur={() => markTouched("teachersAvailable")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {YES_NO.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError name="teachersAvailable" />
              </div>

              <div style={{ flex: "1 1 320px", minWidth: 240 }}>
                <label style={lblStyle}>Have you explained and submitted the proposal ? {reqStar}</label>
                <select
                  value={form.proposalExplainedSubmitted}
                  onChange={(e) => setValue("proposalExplainedSubmitted", e.target.value)}
                  onBlur={() => markTouched("proposalExplainedSubmitted")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {YES_NO.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError name="proposalExplainedSubmitted" />
              </div>

              <div style={{ flex: "1 1 320px", minWidth: 240 }}>
                <label style={lblStyle}>How soon you expect purchase order be signed ? {reqStar}</label>
                <select
                  value={form.poExpectedTimeline}
                  onChange={(e) => setValue("poExpectedTimeline", e.target.value)}
                  onBlur={() => markTouched("poExpectedTimeline")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {PO_TIMELINE.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError name="poExpectedTimeline" />
              </div>

              <div style={{ flex: "1 1 240px", minWidth: 220 }}>
                <label style={lblStyle}>Lead Status {reqStar}</label>
                <select
                  value={form.leadStatus}
                  onChange={(e) => setValue("leadStatus", e.target.value)}
                  onBlur={() => markTouched("leadStatus")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {LEAD_STATUS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError name="leadStatus" />
              </div>

              <div style={{ flex: "1 1 260px", minWidth: 220 }}>
                <label style={lblStyle}>Lock my Lead {reqStar}</label>
                <select
                  value={form.lockLead}
                  onChange={(e) => setValue("lockLead", e.target.value)}
                  onBlur={() => markTouched("lockLead")}
                  style={fldStyle}
                >
                  <option value="">Choose</option>
                  {LOCK_LEAD.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError name="lockLead" />
              </div>

              <div style={{ flex: "1 1 100%", minWidth: 260 }}>
                <label style={lblStyle}>other remarls</label>
                <textarea
                  value={form.otherRemarks}
                  onChange={(e) => setValue("otherRemarks", e.target.value)}
                  placeholder="Write notes / remarks..."
                  rows={4}
                  style={{ ...fldStyle, resize: "vertical" }}
                />
              </div>
            </div>

            <WizardFooter isLast step={step} submitting={submitting} onBack={onBack} onNext={onNext} />
          </Card>
        )}
      </form>
    </div>
  );
}

export default Lrp;