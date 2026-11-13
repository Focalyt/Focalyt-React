import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { buildCourseApplyTarget, usePublicApply } from "../../../Component/PublicApplyModal/PublicApplyModal";

function textValue(value) {
  if (value === 0) return "0";
  const text = value == null ? "" : String(value).trim();
  return text || "N/A";
}

function locationLabel(course) {
  const city = course?.city?.name || course?.city;
  const state = course?.state?.name || course?.state;
  return [course?.address, city, state].filter(Boolean).join(", ") || "N/A";
}

function timingLabel(course) {
  return [course?.onlineTrainingTiming, course?.offlineTrainingTiming].filter(Boolean).join(" / ") || "N/A";
}

function feeLabel(course) {
  if (course?.courseFee) return `₹ ${course.courseFee}`;
  return textValue(course?.courseFeeType);
}

function DetailRow({ icon, label, children, scroll }) {
  return (
    <div className="cdm-row">
      <div className="cdm-label">
        <img src={icon} alt="" />
        <span>{label}</span>
      </div>
      <div className={`cdm-value${scroll ? " cdm-value--scroll" : ""}`}>{children}</div>
    </div>
  );
}

export default function CourseDetailsModal({ courseId, previewCourse, bucketUrl, onClose }) {
  const { openApply } = usePublicApply();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
        const response = await axios.get(`${backendUrl}/coursedetails/${courseId}`, {
          headers: { Accept: "application/json" },
        });
        const nextCourse = response.data?.course || null;
        if (!cancelled) {
          if (!nextCourse) setError("Course details not found");
          setCourse(nextCourse);
        }
      } catch (err) {
        if (!cancelled) setError("Could not load course details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (courseId) load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

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

  const shown = course || previewCourse || {};
  const title = shown.name || "Course";
  const sector = Array.isArray(shown.sectorNames) ? shown.sectorNames.filter(Boolean).join(", ") : "";

  const apply = () => {
    onClose();
    openApply(buildCourseApplyTarget(shown, bucketUrl));
  };

  return createPortal(
    <div className="cdm-backdrop" onClick={onClose} role="presentation">
      <div
        className="cdm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cdm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="cdm-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="cdm-head">
          <div>
            <h3 id="cdm-title">{title}</h3>
            {sector ? <p>{sector}</p> : null}
          </div>
          <button type="button" className="cdm-apply" onClick={apply}>
            APPLY NOW
          </button>
        </div>

        <div className="cdm-body">
          {loading ? <p className="cdm-status">Loading course details...</p> : null}
          {error ? <p className="cdm-status cdm-status--error">{error}</p> : null}
          {!loading && !error ? (
            <div className="cdm-card">
              <DetailRow icon="/Assets/public_assets/images/jobicons/Eligibility.png" label="Eligibility">
                {textValue(shown.qualification)}
              </DetailRow>
              <DetailRow icon="/Assets/public_assets/images/jobicons/Age.png" label="Age">
                {textValue(shown.age)}
              </DetailRow>
              <DetailRow icon="/Assets/public_assets/images/newpage/index/modal/empl.svg" label="Location" scroll>
                {locationLabel(shown)}
              </DetailRow>
              <DetailRow icon="/Assets/public_assets/images/jobicons/Experience.png" label="Experience">
                {textValue(shown.experience)}
              </DetailRow>
              <DetailRow icon="/Assets/public_assets/images/jobicons/Course_mode.png" label="Course Mode">
                {textValue(shown.trainingMode)}
              </DetailRow>
              <DetailRow icon="/Assets/public_assets/images/jobicons/Course_duration.png" label="Course Duration">
                {textValue(shown.duration)}
              </DetailRow>
              <DetailRow icon="/Assets/public_assets/images/jobicons/Course_type.png" label="Course Type">
                {textValue(shown.courseType)}
              </DetailRow>
              <DetailRow icon="/Assets/public_assets/images/jobicons/Timing.png" label="Timings">
                {timingLabel(shown)}
              </DetailRow>
              <DetailRow icon="/Assets/public_assets/images/jobicons/job_training.png" label="On Job Training">
                {textValue(shown.ojt)}
              </DetailRow>
              <DetailRow icon="/Assets/public_assets/images/jobicons/rs.png" label="Course Fee">
                {feeLabel(shown)}
              </DetailRow>
            </div>
          ) : null}
        </div>
      </div>
      <style>{`
        .cdm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 15000;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }
        .cdm-dialog {
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
        .cdm-close {
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
        .cdm-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 56px 16px 22px;
          background: #fff;
        }
        .cdm-head h3 { margin: 0; font-size: 20px; color: #0f2744; }
        .cdm-head p { margin: 4px 0 0; color: #5b7390; font-size: 14px; }
        .cdm-apply {
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
        .cdm-body { overflow: auto; padding: 16px; }
        .cdm-status { margin: 12px 4px; color: #3e5876; }
        .cdm-status--error { color: #c62828; }
        .cdm-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border-top: 3px solid transparent;
          background-image: linear-gradient(#fff, #fff), linear-gradient(90deg, #2f6bff, #e23b9a);
          background-origin: border-box;
          background-clip: padding-box, border-box;
        }
        .cdm-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 16px;
          border-bottom: 1px solid #e6edf5;
        }
        .cdm-row:last-child { border-bottom: none; }
        .cdm-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1e293b;
          font-weight: 600;
          flex: 0 0 auto;
        }
        .cdm-label img { width: 22px; height: 22px; object-fit: contain; }
        .cdm-value {
          color: #1e293b;
          text-align: right;
          max-width: 58%;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }
        .cdm-value--scroll {
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
        .cdm-value--scroll::-webkit-scrollbar { height: 6px; }
        .cdm-value--scroll::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 999px;
        }
      `}</style>
    </div>,
    document.body
  );
}
