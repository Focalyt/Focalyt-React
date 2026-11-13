import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { buildJobApplyTarget, usePublicApply } from "../../../Component/PublicApplyModal/PublicApplyModal";

function formatJobExperience(job) {
  if (!job) return "N/A";
  if ((job.experience === 0 && job.experienceMonths === 0) || (job.experience === 0 && !job.experienceMonths)) {
    return "Fresher";
  }
  const parts = [];
  if (job.experience > 0) parts.push(`${job.experience} ${job.experience === 1 ? "Year" : "Years"}`);
  if (job.experienceMonths > 0) parts.push(`${job.experienceMonths} ${job.experienceMonths === 1 ? "Month" : "Months"}`);
  return parts.join(" ") || job.experience || "N/A";
}

function skillNames(job) {
  const tech = Array.isArray(job?._techSkills) ? job._techSkills.map((skill) => skill?.name).filter(Boolean) : [];
  const nonTech = Array.isArray(job?._nonTechSkills) ? job._nonTechSkills.map((skill) => skill?.name).filter(Boolean) : [];
  return [...tech, ...nonTech];
}

function locationLabel(job) {
  if (job?.place) return job.place;
  const city = job?.city?.name || job?.city;
  const state = job?.state?.name || job?.state;
  return [city, state].filter(Boolean).join(", ") || "N/A";
}

function salaryLabel(job) {
  if (!job) return "N/A";
  if (job.isFixed) return `₹ ${job.amount || "NA"}`;
  return `Range ₹ ${job.min || "NA"} - ${job.max || "NA"}`;
}

function DetailRow({ icon, label, children, scroll }) {
  return (
    <div className="jdm-row">
      <div className="jdm-label">
        <img src={icon} alt="" />
        <span>{label}</span>
      </div>
      <div className={`jdm-value${scroll ? " jdm-value--scroll" : ""}`}>{children}</div>
    </div>
  );
}

export default function JobDetailsModal({ jobId, previewJob, bucketUrl, onClose }) {
  const { openApply } = usePublicApply();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
        const response = await axios.get(`${backendUrl}/jobdetailsmore/${jobId}`, {
          headers: { Accept: "application/json" },
        });
        const nextJob = response.data?.job || null;
        if (!cancelled) {
          if (!nextJob) setError("Job details not found");
          setJob(nextJob);
        }
      } catch (err) {
        if (!cancelled) setError("Could not load job details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (jobId) load();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const shown = job || previewJob || {};
  const title = shown.title || shown.name || "Job";
  const company = shown.displayCompanyName || shown._company?.name || "";
  const skills = skillNames(shown);

  const apply = () => {
    onClose();
    openApply(buildJobApplyTarget(shown, bucketUrl));
  };

  return createPortal(
    <div className="jdm-backdrop" onClick={onClose} role="presentation">
      <div
        className="jdm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jdm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="jdm-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="jdm-head">
          <div>
            <h3 id="jdm-title">{title}</h3>
            {company ? <p>{company}</p> : null}
          </div>
          <button type="button" className="jdm-apply" onClick={apply}>
            APPLY NOW
          </button>
        </div>

        <div className="jdm-body">
          {loading ? <p className="jdm-status">Loading job details...</p> : null}
          {error ? <p className="jdm-status jdm-status--error">{error}</p> : null}
          {!loading && !error ? (
            <>
              <div className="jdm-card">
                <DetailRow icon="/Assets/public_assets/images/purple/education.png" label="Education">
                  {shown._qualification?.name || "N/A"}
                </DetailRow>
                <DetailRow icon="/Assets/public_assets/images/purple/age.png" label="Age">
                  {shown.ageMin || "N/A"}-{shown.ageMax || "N/A"} Years
                </DetailRow>
                <DetailRow icon="/Assets/public_assets/images/purple/location.png" label="Location" scroll>
                  {locationLabel(shown)}
                </DetailRow>
                <DetailRow icon="/Assets/public_assets/images/purple/experience.png" label="Experience">
                  {formatJobExperience(shown)}
                </DetailRow>
                <DetailRow icon="/Assets/public_assets/images/purple/job-mode.png" label="Job Mode">
                  {shown.work || "N/A"}
                </DetailRow>
                <DetailRow icon="/Assets/public_assets/images/purple/shifts.png" label="Shift">
                  {shown.shift || "N/A"}
                </DetailRow>
                <DetailRow icon="/Assets/public_assets/images/purple/gender.png" label="Gender">
                  {shown.genderPreference || "N/A"}
                </DetailRow>
                <DetailRow icon="/Assets/public_assets/images/purple/experience.png" label="Required Skills">
                  {skills.length ? skills.join(", ") : "N/A"}
                </DetailRow>
                {shown.requirement ? (
                  <DetailRow icon="/Assets/public_assets/images/purple/payout_icon.png" label="Requirement">
                    {shown.requirement}
                  </DetailRow>
                ) : null}
                {shown.payOut ? (
                  <DetailRow icon="/Assets/public_assets/images/purple/rs.png" label="Payout">
                    {shown.payOut}
                  </DetailRow>
                ) : null}
                <DetailRow icon="/Assets/public_assets/images/purple/reg_fee.png" label="Salary">
                  {salaryLabel(shown)}
                </DetailRow>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <style>{`
        .jdm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 15000;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }
        .jdm-dialog {
          position: relative;
          width: min(640px, 100%);
          max-height: min(86vh, 820px);
          display: flex;
          flex-direction: column;
          background: #f4f7fb;
          border-radius: 18px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
          overflow: hidden;
        }
        .jdm-close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 2;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 50%;
          background: #fff;
          color: #1e293b;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
        }
        .jdm-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 56px 16px 22px;
          background: #fff;
        }
        .jdm-head h3 {
          margin: 0;
          font-size: 20px;
          color: #0f2744;
        }
        .jdm-head p {
          margin: 4px 0 0;
          color: #5b7390;
          font-size: 14px;
        }
        .jdm-apply {
          flex-shrink: 0;
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          color: #fff;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          background: linear-gradient(90deg, #2f6bff, #e23b9a);
        }
        .jdm-body {
          overflow: auto;
          padding: 16px;
        }
        .jdm-status {
          margin: 12px 4px;
          color: #3e5876;
        }
        .jdm-status--error { color: #c62828; }
        .jdm-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border-top: 3px solid transparent;
          background-image: linear-gradient(#fff, #fff), linear-gradient(90deg, #2f6bff, #e23b9a);
          background-origin: border-box;
          background-clip: padding-box, border-box;
          margin-bottom: 14px;
        }
        .jdm-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 16px;
          border-bottom: 1px solid #e6edf5;
        }
        .jdm-row:last-child { border-bottom: none; }
        .jdm-label {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          color: #1e293b;
          font-weight: 600;
          flex: 0 0 auto;
        }
        .jdm-label img { width: 22px; height: 22px; object-fit: contain; }
        .jdm-value {
          color: #1e293b;
          text-align: right;
          max-width: 58%;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }
        .jdm-value--scroll {
          flex: 1 1 auto;
          min-width: 0;
          overflow-x: auto;
          overflow-y: hidden;
          white-space: nowrap;
          overflow-wrap: normal;
          word-break: normal;
          scrollbar-width: thin;
          scrollbar-color: #94a3b8 transparent;
        }
        .jdm-value--scroll::-webkit-scrollbar { height: 6px; }
        .jdm-value--scroll::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 999px;
        }
      `}</style>
    </div>,
    document.body
  );
}
