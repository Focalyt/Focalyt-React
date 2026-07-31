import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, Upload } from "lucide-react";
import axios from "axios";
import FrontLayout from "../../../Component/Layouts/Front";

const BENEFITS = [
  "Career growth and practical learning",
  "Supportive and collaborative team",
  "Competitive salary and incentives",
];

const FILTER_TAGS = ["Location", "Full-time", "Salary range"];

const APPLYING_FOR_OPTIONS = [
  "Graphic Designer Intern",
  "Field Sales Executive",
  "Solar Panel Trainer Installation Technician",
  "Agriculture Trainer Extension Promoter",
  "AI Trainer",
  "Industry Trainer for Home Service Appliance",
  "Electrical/Electronics Engineer for Telecom Training",
];

const MAX_CV_BYTES = 5 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;
const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_RESUME_EXT = /\.(pdf|doc|docx)$/i;

const EMPTY_FORM = {
  fullName: "",
  email: "",
  mobile: "",
  city: "",
  applyingFor: "",
  experience: "",
  resume: null,
};

function validateCareerForm(formData) {
  const fullName = formData.fullName.trim();
  const email = formData.email.trim();
  const mobile = formData.mobile.trim().replace(/[\s\-()]/g, "").replace(/^\+91/, "");
  const applyingFor = formData.applyingFor.trim();
  const experience = formData.experience.trim();

  if (!fullName) return "Full name is required";
  if (fullName.length < 2) return "Please enter a valid full name";
  if (!email) return "Email ID is required";
  if (!EMAIL_RE.test(email)) return "Please enter a valid email ID";
  if (!mobile) return "Mobile number is required";
  if (!MOBILE_RE.test(mobile)) return "Please enter a valid 10-digit mobile number";
  if (!applyingFor) return "Applying for is required";
  if (!experience) return "Experience is required";
  if (!formData.resume) return "Please upload your CV";
  if (formData.resume.size > MAX_CV_BYTES) return "CV must be 5 MB or smaller";
  const typeOk =
    ALLOWED_RESUME_TYPES.includes(formData.resume.type) ||
    ALLOWED_RESUME_EXT.test(formData.resume.name || "");
  if (!typeOk) return "Resume must be a PDF or DOC file";
  return null;
}

function Marketing() {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-foc-theme", "sky-magenta");
    root.style.setProperty("--front-layout-bg", "#f6f3ff");
    return () => {
      root.style.removeProperty("--front-layout-bg");
    };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_CV_BYTES) {
      setErrors((prev) => ({ ...prev, resume: "CV must be 5 MB or smaller" }));
      e.target.value = "";
      return;
    }
    const typeOk =
      ALLOWED_RESUME_TYPES.includes(file.type) || ALLOWED_RESUME_EXT.test(file.name || "");
    if (!typeOk) {
      setErrors((prev) => ({ ...prev, resume: "Resume must be a PDF or DOC file" }));
      e.target.value = "";
      return;
    }
    setFormData((prev) => ({ ...prev, resume: file }));
    setErrors((prev) => ({ ...prev, resume: "" }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const validationMsg = validateCareerForm(formData);
      if (validationMsg) {
        const nextErrors = {};
        if (!formData.fullName.trim()) nextErrors.fullName = "Full name is required";
        else if (formData.fullName.trim().length < 2) nextErrors.fullName = "Please enter a valid full name";
        if (!formData.email.trim()) nextErrors.email = "Email ID is required";
        else if (!EMAIL_RE.test(formData.email.trim())) nextErrors.email = "Please enter a valid email ID";
        const mobile = formData.mobile.trim().replace(/[\s\-()]/g, "").replace(/^\+91/, "");
        if (!mobile) nextErrors.mobile = "Mobile number is required";
        else if (!MOBILE_RE.test(mobile)) nextErrors.mobile = "Please enter a valid 10-digit mobile number";
        if (!formData.applyingFor.trim()) nextErrors.applyingFor = "Applying for is required";
        if (!formData.experience.trim()) nextErrors.experience = "Experience is required";
        if (!formData.resume) nextErrors.resume = "Please upload your CV";
        setErrors(nextErrors);
        alert(validationMsg);
        return;
      }

      setSubmitting(true);
      try {
        const mobile = formData.mobile.trim().replace(/[\s\-()]/g, "").replace(/^\+91/, "");
        const submissionData = new FormData();
        submissionData.append("fullName", formData.fullName.trim());
        submissionData.append("email", formData.email.trim());
        submissionData.append("mobile", mobile);
        submissionData.append("city", formData.city.trim());
        submissionData.append("applyingFor", formData.applyingFor.trim());
        submissionData.append("experience", formData.experience.trim());
        submissionData.append("resume", formData.resume);

        await axios.post(`${backendUrl}/career`, submissionData);
        alert("Application submitted successfully!");
        setFormData(EMPTY_FORM);
        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        console.error("Career form error:", err);
        const msg =
          err?.response?.data?.message ||
          (typeof err?.response?.data === "string" ? err.response.data : null) ||
          "Something went wrong while submitting.";
        alert(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [backendUrl, formData]
  );

  return (
    <FrontLayout>
      <div className="foc-marketing-page">
        <section className="mkt-hero">
          <div className="mkt-container">
            <span className="mkt-badge">We&apos;re hiring • Apply now</span>
            <h1 className="mkt-title">Build your career with a growing team</h1>
            <p className="mkt-sub">
              Join Focalyt and work on meaningful projects with real opportunities to learn and grow.
            </p>
            <div className="mkt-tags" aria-label="Role highlights">
              {FILTER_TAGS.map((tag) => (
                <span key={tag} className="mkt-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-body">
          <div className="mkt-container mkt-body-grid">
            <div className="mkt-why">
              <h2 className="mkt-why-title">Why join Focalyt?</h2>
              <ul className="mkt-benefits">
                {BENEFITS.map((item) => (
                  <li key={item}>
                    <span className="mkt-check" aria-hidden>
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mkt-form-card">
              <form className="mkt-form" onSubmit={handleSubmit} noValidate>
                <div className="mkt-fields">
                  <div className={`mkt-field ${errors.fullName ? "has-error" : ""}`}>
                    <label htmlFor="mkt-name">
                      Full name <span className="mkt-req" aria-hidden>*</span>
                    </label>
                    <input
                      id="mkt-name"
                      name="fullName"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Enter your name"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                    {errors.fullName ? <p className="mkt-error">{errors.fullName}</p> : null}
                  </div>

                  <div className={`mkt-field ${errors.email ? "has-error" : ""}`}>
                    <label htmlFor="mkt-email">
                      Email ID <span className="mkt-req" aria-hidden>*</span>
                    </label>
                    <input
                      id="mkt-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@email.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {errors.email ? <p className="mkt-error">{errors.email}</p> : null}
                  </div>

                  <div className={`mkt-field ${errors.mobile ? "has-error" : ""}`}>
                    <label htmlFor="mkt-mobile">
                      Mobile number <span className="mkt-req" aria-hidden>*</span>
                    </label>
                    <input
                      id="mkt-mobile"
                      name="mobile"
                      type="tel"
                      required
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="10-digit mobile number"
                      value={formData.mobile}
                      onChange={handleChange}
                    />
                    {errors.mobile ? <p className="mkt-error">{errors.mobile}</p> : null}
                  </div>

                  <div className="mkt-field">
                    <label htmlFor="mkt-city">City</label>
                    <input
                      id="mkt-city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      placeholder="Enter your city (optional)"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={`mkt-field ${errors.applyingFor ? "has-error" : ""}`}>
                    <label htmlFor="mkt-role">
                      Applying for <span className="mkt-req" aria-hidden>*</span>
                    </label>
                    <select
                      id="mkt-role"
                      name="applyingFor"
                      required
                      value={formData.applyingFor}
                      onChange={handleChange}
                    >
                      <option value="" disabled>
                        Select job role
                      </option>
                      {APPLYING_FOR_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    {errors.applyingFor ? <p className="mkt-error">{errors.applyingFor}</p> : null}
                  </div>

                  <div className={`mkt-field ${errors.experience ? "has-error" : ""}`}>
                    <label htmlFor="mkt-experience">
                      Experience <span className="mkt-req" aria-hidden>*</span>
                    </label>
                    <input
                      id="mkt-experience"
                      name="experience"
                      type="text"
                      required
                      placeholder="e.g. Fresher, 2 years"
                      value={formData.experience}
                      onChange={handleChange}
                    />
                    {errors.experience ? <p className="mkt-error">{errors.experience}</p> : null}
                  </div>

                  <div className={`mkt-field mkt-field--full ${errors.resume ? "has-error" : ""}`}>
                    <label htmlFor="mkt-cv">
                      Resume / CV <span className="mkt-req" aria-hidden>*</span>
                    </label>
                    <button
                      type="button"
                      className={`mkt-upload ${formData.resume ? "is-filled" : ""}`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={20} aria-hidden />
                      <span className="mkt-upload-title">
                        {formData.resume ? formData.resume.name : "Upload CV"}
                      </span>
                      <span className="mkt-upload-hint">PDF or DOC • Max 5 MB</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      id="mkt-cv"
                      name="resume"
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFile}
                      hidden
                    />
                    {errors.resume ? <p className="mkt-error">{errors.resume}</p> : null}
                  </div>
                </div>

                <button type="submit" className="mkt-submit" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit application →"}
                </button>
                <p className="mkt-privacy">Your information will only be used for recruitment.</p>
              </form>
            </div>
          </div>
        </section>

        <footer className="mkt-page-footer">
          <div className="mkt-container">
            <p>Verified company • Equal opportunity employer</p>
          </div>
        </footer>
      </div>

      <style>{`
.foc-marketing-page,
.foc-marketing-page * { box-sizing: border-box; }
.foc-marketing-page {
  --mkt-purple: #6b4eff;
  --mkt-purple-soft: #efeaff;
  --mkt-purple-bg: #f3efff;
  --mkt-text: #1a1d2e;
  --mkt-muted: #6b7280;
  --mkt-border: #e5e7eb;
  --mkt-surface: #ffffff;
  --mkt-radius: 12px;
  --mkt-radius-sm: 10px;
  font-family: var(--foc-font-sans, "Manrope", system-ui, sans-serif);
  background: var(--mkt-surface);
  color: var(--mkt-text);
  min-height: 100%;
  padding-top: 88px;
  overflow-x: hidden;
}
.foc-marketing-page .mkt-container {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px;
}
.foc-marketing-page .mkt-hero {
  background: var(--mkt-purple-bg);
  padding: 36px 0 40px;
}
.foc-marketing-page .mkt-badge {
  display: inline-flex;
  align-items: center;
  background: var(--mkt-purple-soft);
  color: var(--mkt-purple);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  padding: 7px 12px;
  border-radius: 999px;
  margin-bottom: 16px;
}
.foc-marketing-page .mkt-title {
  margin: 0;
  font-size: clamp(1.75rem, 5vw, 2.35rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--mkt-text);
  max-width: 18ch;
}
.foc-marketing-page .mkt-sub {
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.65;
  color: var(--mkt-muted);
  max-width: 42ch;
}
.foc-marketing-page .mkt-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}
.foc-marketing-page .mkt-tag {
  display: inline-flex;
  align-items: center;
  background: var(--mkt-surface);
  border: 1px solid var(--mkt-border);
  color: var(--mkt-text);
  font-size: 13px;
  font-weight: 500;
  padding: 9px 14px;
  border-radius: 10px;
}
.foc-marketing-page .mkt-body {
  padding: 36px 0 28px;
  background: var(--mkt-surface);
}
.foc-marketing-page .mkt-body-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
}
.foc-marketing-page .mkt-why-title {
  margin: 0 0 18px;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--mkt-text);
}
.foc-marketing-page .mkt-benefits {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.foc-marketing-page .mkt-benefits li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 15px;
  line-height: 1.45;
  color: var(--mkt-text);
  font-weight: 500;
}
.foc-marketing-page .mkt-check {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--mkt-purple);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}
.foc-marketing-page .mkt-form-card {
  background: var(--mkt-surface);
  border: 1px solid var(--mkt-border);
  border-radius: var(--mkt-radius);
  padding: 22px 18px 20px;
  box-shadow: 0 8px 28px rgba(26, 29, 46, 0.04);
}
.foc-marketing-page .mkt-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
.foc-marketing-page .mkt-field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--mkt-muted);
  margin-bottom: 7px;
}
.foc-marketing-page .mkt-req {
  color: #e11d48;
  font-weight: 800;
  margin-left: 2px;
}
.foc-marketing-page .mkt-error {
  margin: 6px 0 0;
  font-size: 12px;
  color: #e11d48;
  line-height: 1.35;
}
.foc-marketing-page .mkt-field.has-error input,
.foc-marketing-page .mkt-field.has-error select,
.foc-marketing-page .mkt-field.has-error .mkt-upload {
  border-color: rgba(225, 29, 72, 0.55);
}
.foc-marketing-page .mkt-field input,
.foc-marketing-page .mkt-field select {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid var(--mkt-border);
  border-radius: var(--mkt-radius-sm);
  background: #fafafa;
  color: var(--mkt-text);
  font-size: 15px;
  font-family: inherit;
  padding: 12px 14px;
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}
.foc-marketing-page .mkt-field select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
  cursor: pointer;
}
.foc-marketing-page .mkt-field select:invalid,
.foc-marketing-page .mkt-field select option[value=""] {
  color: #9ca3af;
}
.foc-marketing-page .mkt-field select option {
  color: var(--mkt-text);
}
.foc-marketing-page .mkt-field input::placeholder {
  color: #9ca3af;
}
.foc-marketing-page .mkt-field input:focus,
.foc-marketing-page .mkt-field select:focus {
  outline: none;
  background-color: #fff;
  border-color: rgba(107, 78, 255, 0.45);
  box-shadow: 0 0 0 3px rgba(107, 78, 255, 0.12);
}
.foc-marketing-page .mkt-upload {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 108px;
  padding: 20px 16px;
  border: 1.5px dashed #d1d5db;
  border-radius: var(--mkt-radius-sm);
  background: #fafafa;
  cursor: pointer;
  transition: border-color .18s ease, background .18s ease;
  font-family: inherit;
}
.foc-marketing-page .mkt-upload:hover,
.foc-marketing-page .mkt-upload.is-filled {
  border-color: rgba(107, 78, 255, 0.5);
  background: var(--mkt-purple-soft);
}
.foc-marketing-page .mkt-upload svg {
  color: var(--mkt-purple);
  margin-bottom: 4px;
}
.foc-marketing-page .mkt-upload-title {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--mkt-purple);
  word-break: break-word;
  max-width: 100%;
}
.foc-marketing-page .mkt-upload-hint {
  font-size: 12px;
  color: var(--mkt-muted);
}
.foc-marketing-page .mkt-submit {
  width: 100%;
  margin-top: 18px;
  border: none;
  border-radius: var(--mkt-radius-sm);
  background: var(--mkt-purple);
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
  padding: 14px 18px;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
}
.foc-marketing-page .mkt-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(107, 78, 255, 0.28);
}
.foc-marketing-page .mkt-submit:disabled {
  opacity: .7;
  cursor: wait;
}
.foc-marketing-page .mkt-privacy {
  margin: 12px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--mkt-muted);
}
.foc-marketing-page .mkt-page-footer {
  border-top: 1px solid var(--mkt-border);
  padding: 18px 0 28px;
  text-align: center;
}
.foc-marketing-page .mkt-page-footer p {
  margin: 0;
  font-size: 13px;
  color: var(--mkt-muted);
}

@media (min-width: 640px) {
  .foc-marketing-page .mkt-container {
    padding: 0 28px;
  }
  .foc-marketing-page .mkt-hero {
    padding: 48px 0 52px;
  }
  .foc-marketing-page .mkt-title {
    max-width: none;
  }
  .foc-marketing-page .mkt-form-card {
    padding: 28px 26px 24px;
  }
  .foc-marketing-page .mkt-fields {
    grid-template-columns: 1fr 1fr;
  }
  .foc-marketing-page .mkt-field--full {
    grid-column: 1 / -1;
  }
}

@media (min-width: 900px) {
  .foc-marketing-page .mkt-container {
    max-width: 980px;
  }
  .foc-marketing-page .mkt-body {
    padding: 48px 0 40px;
  }
  .foc-marketing-page .mkt-body-grid {
    grid-template-columns: minmax(240px, 0.9fr) minmax(320px, 1.1fr);
    gap: 40px;
    align-items: start;
  }
  .foc-marketing-page .mkt-why {
    padding-top: 8px;
  }
  .foc-marketing-page .mkt-why-title {
    font-size: 1.4rem;
  }
  .foc-marketing-page .mkt-form-card {
    max-width: 560px;
    margin-left: auto;
  }
}

@media (max-width: 480px) {
  .foc-marketing-page {
    padding-top: 72px;
  }
  .foc-marketing-page .mkt-hero {
    padding: 28px 0 32px;
  }
  .foc-marketing-page .mkt-container {
    padding: 0 16px;
  }
  .foc-marketing-page .mkt-form-card {
    padding: 18px 14px 16px;
  }
}
      `}</style>
    </FrontLayout>
  );
}

export default Marketing;
