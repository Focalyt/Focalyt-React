import React, { useEffect, useState } from "react";
import axios from "axios";
import "./LrpLead.css";

const PREFILLED_COURSE = "Telecom Grameen Udyami";
const PREFILLED_CENTER = "Biswabharati,Bhadrak";
const LEAD_SOURCES = ["LRP", "FO"];

const FALLBACK_QUALIFICATIONS = [
  "Below 10th",
  "10th",
  "12th",
  "ITI",
  "Diploma",
  "Graduate",
  "Post Graduate",
];

const emptyForm = {
  candidateName: "",
  candidateNumber: "",
  whatsapp: "",
  address: "",
  gender: "",
  highestQualification: "",
  counsellorName: "",
  leadSource: "",
};

const LrpLead = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || "http://localhost:8080";
  const [form, setForm] = useState(emptyForm);
  const [qualifications, setQualifications] = useState(FALLBACK_QUALIFICATIONS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "LRP Registration | Focalyt";
    let cancelled = false;

    axios
      .get(`${backendUrl}/candidate/api/highestQualifications`)
      .then((response) => {
        const names = (response.data?.data || [])
          .map((item) => item?.name)
          .filter(Boolean);
        if (!cancelled && names.length) setQualifications(names);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [backendUrl]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const digitsOnly = (field, value) => {
    setField(field, value.replace(/\D/g, "").slice(0, 10));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const errors = [];
    if (!form.candidateName.trim()) errors.push("Please enter candidate name");
    if (!/^\d{10}$/.test(form.candidateNumber)) errors.push("Candidate number must be 10 digits");
    if (!/^\d{10}$/.test(form.whatsapp)) errors.push("WhatsApp number must be 10 digits");
    if (!form.address.trim()) errors.push("Please enter address");
    if (!form.gender) errors.push("Please select gender");
    if (!form.highestQualification) errors.push("Please select highest qualification");
    if (!form.counsellorName.trim()) errors.push("Please enter counsellor name");
    if (!LEAD_SOURCES.includes(form.leadSource)) errors.push("Please select lead source");

    if (errors.length) {
      setError(errors.join(". "));
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(`${backendUrl}/public/lrp-lead`, {
        ...form,
        course: PREFILLED_COURSE,
        center: PREFILLED_CENTER,
        source: form.leadSource,
      });

      if (response.data?.status) {
        setSubmitted(true);
        setForm(emptyForm);
        return;
      }
      setError(response.data?.message || "Failed to save details");
    } catch (submitError) {
      setError(submitError?.response?.data?.message || "Failed to save details");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lrp-page">
      <header className="lrp-header">
        <div className="lrp-header-inner">
          <img src="/Assets/images/logo/focalyt_new_logo.png" alt="Focalyt" />
          <div>
            <h1>Candidate Registration</h1>
            <p>Telecom Grameen Udyami</p>
          </div>
        </div>
      </header>

      <main className="lrp-card">
        {submitted ? (
          <div className="lrp-success">
            <h2>Details submitted</h2>
            <p>The candidate details have been saved.</p>
            <button type="button" className="lrp-submit" onClick={() => setSubmitted(false)}>
              Add another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {error ? <div className="lrp-error">{error}</div> : null}

            <div className="lrp-field">
              <label htmlFor="candidateName">Candidate Name <span>*</span></label>
              <input
                id="candidateName"
                type="text"
                autoComplete="name"
                placeholder="Enter candidate name"
                value={form.candidateName}
                onChange={(e) => setField("candidateName", e.target.value)}
              />
            </div>

            <div className="lrp-field">
              <label htmlFor="candidateNumber">Candidate Number <span>*</span></label>
              <input
                id="candidateNumber"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                placeholder="Enter 10 digit candidate number"
                value={form.candidateNumber}
                onChange={(e) => digitsOnly("candidateNumber", e.target.value)}
              />
            </div>

            <div className="lrp-field">
              <label htmlFor="whatsapp">WhatsApp <span>*</span></label>
              <input
                id="whatsapp"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                placeholder="Enter 10 digit WhatsApp number"
                value={form.whatsapp}
                onChange={(e) => digitsOnly("whatsapp", e.target.value)}
              />
            </div>

            <div className="lrp-field">
              <label htmlFor="course">Course</label>
              <input id="course" className="lrp-locked" value={PREFILLED_COURSE} disabled readOnly />
            </div>

            <div className="lrp-field">
              <label htmlFor="center">Center</label>
              <input id="center" className="lrp-locked" value={PREFILLED_CENTER} disabled readOnly />
            </div>

            <div className="lrp-field">
              <label htmlFor="address">Address <span>*</span></label>
              <textarea
                id="address"
                maxLength={200}
                placeholder="Enter address"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
              />
            </div>

            <div className="lrp-field">
              <label htmlFor="gender">Gender <span>*</span></label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => setField("gender", e.target.value)}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="lrp-field">
              <label htmlFor="highestQualification">Highest Qualification <span>*</span></label>
              <select
                id="highestQualification"
                value={form.highestQualification}
                onChange={(e) => setField("highestQualification", e.target.value)}
              >
                <option value="">Select highest qualification</option>
                {qualifications.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="lrp-field">
              <label htmlFor="counsellorName">Counsellor Name <span>*</span></label>
              <input
                id="counsellorName"
                type="text"
                placeholder="Enter counsellor name"
                value={form.counsellorName}
                onChange={(e) => setField("counsellorName", e.target.value)}
              />
            </div>

            <div className="lrp-field">
              <label htmlFor="leadSource">Lead Source <span>*</span></label>
              <select
                id="leadSource"
                value={form.leadSource}
                onChange={(e) => setField("leadSource", e.target.value)}
              >
                <option value="">Select lead source</option>
                {LEAD_SOURCES.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="lrp-submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default LrpLead;
