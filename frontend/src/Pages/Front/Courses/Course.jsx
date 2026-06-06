import React, { useEffect, useState } from "react";
import moment from "moment";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import FrontLayout from "../../../Component/Layouts/Front";
import { resolveMediaUrl } from "../../../utils/resolveMediaUrl";

const THUMB_FALLBACK = "/Assets/public_assets/images/newjoblisting/course_img.svg";

export function CourseCard({ course, bucketUrl, onPlayVideo, onShare, onRequestCallback }) {
  const thumb = resolveMediaUrl(bucketUrl, course?.thumbnail) || THUMB_FALLBACK;
  const videoUrl =
    course?.videos?.[0] ? resolveMediaUrl(bucketUrl, course.videos[0]) : "";
  const loc = course?.city ? `${course.city}, ${course.state}` : "NA";
  const lastDate = course?.lastDateForApply
    ? moment(course.lastDateForApply).utcOffset("+05:30").format("MMM DD, YYYY")
    : "NA";
  const badgeLabel = course?.courseType === "coursejob" ? "Course + Jobs" : "Course";
  const sectorLabel = Array.isArray(course?.sectorNames)
    ? course.sectorNames.join(", ")
    : "";

  return (
    <div className="course-card">
      <div className="course-thumb">
        {videoUrl ? (
          <button
            type="button"
            className="course-thumb-media"
            data-bs-toggle="modal"
            data-bs-target="#videoModal"
            onClick={() => onPlayVideo(videoUrl)}
            aria-label={`Play video for ${course?.name ?? "course"}`}
          >
            <img src={thumb} alt={course?.name ?? "Course"} />
            <img
              src="/Assets/public_assets/images/newjoblisting/play.svg"
              alt=""
              className="course-thumb-play"
            />
          </button>
        ) : (
          <img src={thumb} alt={course?.name ?? "Course"} />
        )}
        <div className="course-badge">{badgeLabel}</div>
        {course?.courseFeeType ? (
          <div className={`course-fee course-fee--${course.courseFeeType.toLowerCase()}`}>
            {course.courseFeeType}
          </div>
        ) : null}
      </div>

      <div className="course-body">
        <div className="course-title" title={course?.name}>
          {course?.name ?? "Course"}
        </div>
        {sectorLabel ? (
          <div className="course-sector" title={sectorLabel}>
            {sectorLabel}
          </div>
        ) : null}

        <div className="course-meta">
          <div className="m">
            <strong>Eligibility</strong>
            <span title={course?.qualification || "N/A"}>{course?.qualification || "N/A"}</span>
          </div>
          <div className="m">
            <strong>Duration</strong>
            <span>{course?.duration || "N/A"}</span>
          </div>
          <div className="m">
            <strong>Location</strong>
            <span title={loc}>{loc}</span>
          </div>
          <div className="m">
            <strong>Mode</strong>
            <span>{course?.trainingMode || "N/A"}</span>
          </div>
          <div className="m m--wide">
            <strong>Last Date to Apply</strong>
            <span>{lastDate}</span>
          </div>
        </div>

        <div className="course-action-btns">
          <a
            className="btn cta-callnow btn-bg-color shr--width"
            href={`/candidate/login?returnUrl=/candidate/course/${course._id}`}
          >
            Apply Now
          </a>
          <button
            type="button"
            className="btn cta-callnow shr--width"
            onClick={() => onShare(course)}
          >
            Share
          </button>
        </div>
        <button
          type="button"
          className="btn cta-callnow w-100 course-callback-btn"
          data-bs-toggle="modal"
          data-bs-target="#callbackModal"
          onClick={() => onRequestCallback(course)}
        >
          Request for Call Back
        </button>
      </div>

      <div className="course_card_footer">
        <Link to={`/coursedetails/${course._id}`} className="course-learn-more">
          <span className="learnn">Learn More</span>
          <img src="/Assets/public_assets/images/link.png" alt="" className="course-learn-more__icon" />
        </Link>
      </div>
    </div>
  );
}

function Course() {
  const [courses, setCourses] = useState([]);
  const [uniqueSectors, setUniqueSectors] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [feeFilter, setFeeFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    mobile: "",
    email: "",
    message: "",
    courseName: "",
    sectorName: "",
    projectName: "",
    typeOfProject: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [videoSrc, setVideoSrc] = useState("");

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const statesList = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
    "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep",
    "Puducherry", "Ladakh", "Jammu and Kashmir",
  ];

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-foc-theme", "sky-magenta");
    root.style.setProperty("--front-layout-bg", "var(--foc-color-bg)");
    return () => {
      root.style.removeProperty("--front-layout-bg");
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/courses`);
        setCourses(response.data.courses ?? []);
        setUniqueSectors(response.data.uniqueSectors ?? []);
      } catch (error) {
        console.error("Error fetching course data:", error);
      }
    };
    fetchData();
  }, [backendUrl]);

  useEffect(() => {
    const videoModal = document.getElementById("videoModal");
    const onHidden = () => setVideoSrc("");
    if (videoModal) {
      videoModal.addEventListener("hidden.bs.modal", onHidden);
    }
    return () => {
      if (videoModal) {
        videoModal.removeEventListener("hidden.bs.modal", onHidden);
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const response = await axios.post(
        `${backendUrl}/callback`,
        { ...formData },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.status === 200 || response.status === 201) {
        setSuccessMessage("Request submitted successfully!");
        setFormData({
          name: "",
          state: "",
          mobile: "",
          email: "",
          message: "",
          courseName: "",
          sectorName: "",
          projectName: "",
          typeOfProject: "",
        });
      }
    } catch {
      setErrorMessage("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCourses = () => {
    if (!Array.isArray(courses)) return [];
    let filtered = [...courses];

    if (activeFilter !== "all") {
      const sectorId = activeFilter.replace("id_", "");
      filtered = filtered.filter(
        (course) =>
          course.sectors &&
          Array.isArray(course.sectors) &&
          course.sectors.some((s) => s && s.toString() === sectorId)
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((course) => {
        const nameMatch = course.name?.toLowerCase().includes(term);
        const qualificationMatch = course.qualification?.toLowerCase().includes(term);
        const durationMatch = course.duration?.toLowerCase().includes(term);
        const cityMatch = course.city?.toLowerCase().includes(term);
        const stateMatch = course.state?.toLowerCase().includes(term);
        const modeMatch = course.trainingMode?.toLowerCase().includes(term);
        const typeMatch = course.courseType?.toLowerCase().includes(term);
        const sectorMatch = course.sectorNames?.some((name) =>
          name.toLowerCase().includes(term)
        );
        return (
          nameMatch ||
          qualificationMatch ||
          durationMatch ||
          cityMatch ||
          stateMatch ||
          modeMatch ||
          typeMatch ||
          sectorMatch
        );
      });
    }

    if (feeFilter !== "all") {
      filtered = filtered.filter(
        (course) => course.courseFeeType?.toLowerCase() === feeFilter
      );
    }

    return filtered;
  };

  const handleShare = async (course) => {
    const courseUrl = `${window.location.origin}/coursedetails/${course._id}`;
    const detailText = [
      course.duration && `Duration: ${course.duration}`,
      course.trainingMode,
      course.courseType === "coursejob" ? "Course + Jobs" : "Course",
    ]
      .filter(Boolean)
      .join(" • ");
    const shareText = detailText
      ? `${course.name} — ${detailText}`
      : `Check out this course: ${course.name}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: course.name, text: shareText, url: courseUrl });
      } catch {
        navigator.clipboard.writeText(`${shareText}\n${courseUrl}`);
        alert("Course link copied!");
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${courseUrl}`);
      alert("Course link copied!");
    }
  };

  const handleRequestCallback = (course) => {
    setFormData((prev) => ({
      ...prev,
      courseName: course.name ?? "",
      sectorName: course.sectorNames ?? "",
      projectName: course.projectName ?? "",
      typeOfProject: course.typeOfProject ?? "",
    }));
  };

  const filteredCourses = getFilteredCourses();
  const selectedSectorName =
    activeFilter === "all"
      ? "All"
      : uniqueSectors.find((s) => `id_${s._id}` === activeFilter)?.name || "All";

  return (
    <FrontLayout>
      <div className="foc-cyber-home hp-theme foc-courses-page">
        <section className="section grid-bg" id="courses-list">
          <div className="container">
            <div className="section-head">
              <div className="stag">Future Ready</div>
              <h1 className="sh2">
                Live <span className="cyan">Courses</span>
              </h1>
              <p className="s-body">Pick a course track and start building job-ready skills.</p>
            </div>

            <div className="courses-filters">
              <div className="courses-filters__row">
                <div className="courses-filters__label">
                  <span className="courses-filters__tag">Filter by Sector</span>
                  <span className="courses-filters__active">{selectedSectorName}</span>
                </div>
                <div className="courses-search">
                  <input
                    type="text"
                    className="courses-search__input"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="courses-search__icon">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>
                </div>
              </div>

              <div className="courses-filters__chips">
                <button
                  type="button"
                  className={`filter-chip${activeFilter === "all" ? " active" : ""}`}
                  onClick={() => setActiveFilter("all")}
                >
                  All <span className="filter-chip__count">{courses.length}</span>
                </button>
                {uniqueSectors.map((sector) => {
                  const count = courses.filter(
                    (c) =>
                      c.sectors?.some((s) => s && s.toString() === sector._id.toString())
                  ).length;
                  return (
                    <button
                      key={sector._id}
                      type="button"
                      className={`filter-chip${activeFilter === `id_${sector._id}` ? " active" : ""}`}
                      onClick={() => setActiveFilter(`id_${sector._id}`)}
                    >
                      {sector.name} <span className="filter-chip__count">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="courses-filters__fee">
                <span className="courses-filters__fee-label">Course Type:</span>
                {["all", "paid", "free"].map((fee) => (
                  <button
                    key={fee}
                    type="button"
                    className={`filter-chip filter-chip--sm${feeFilter === fee ? " active" : ""}`}
                    onClick={() => setFeeFilter(fee)}
                  >
                    {fee === "all" ? "All" : fee.charAt(0).toUpperCase() + fee.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="courses-grid">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course._id}
                    course={course}
                    bucketUrl={bucketUrl}
                    onPlayVideo={setVideoSrc}
                    onShare={handleShare}
                    onRequestCallback={handleRequestCallback}
                  />
                ))}
              </div>
            ) : (
              <div className="courses-empty">
                <h3>No courses found</h3>
                <p>Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </section>

        <div className="modal fade event-video-modal" id="videoModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content event-video-modal__content">
              <button
                type="button"
                className="event-video-modal__close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
              <div className="modal-body p-0">
                <video key={videoSrc} id="courseVid" controls className="w-100">
                  <source src={videoSrc} type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="callbackModal" tabIndex="-1" aria-labelledby="callbackModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content foc-callback-modal">
              <div className="modal-header">
                <h5 className="modal-title" id="callbackModalLabel">
                  Request for Call Back
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your name"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">State</label>
                      <select
                        className="form-control"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                      >
                        <option value="" disabled>
                          Select state
                        </option>
                        {statesList.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contact Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        required
                        pattern="[0-9]{10}"
                        placeholder="10-digit mobile"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Your email"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea
                      className="form-control"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Your message"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? "Submitting..." : "Submit"}
                  </button>
                  {successMessage && <p className="text-success mt-2 mb-0">{successMessage}</p>}
                  {errorMessage && <p className="text-danger mt-2 mb-0">{errorMessage}</p>}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
.foc-cyber-home.foc-courses-page, .foc-cyber-home.foc-courses-page * { box-sizing: border-box; }
.foc-cyber-home.foc-courses-page {
  --home-card-cta: var(--foc-navy-deep, #0d2146);
  --home-card-cta-hover: var(--foc-navy-badge, #163565);
  --cyan: var(--foc-cyan);
  --red: var(--foc-magenta);
  --bg: var(--foc-color-bg);
  --bg2: var(--foc-color-bg-alt);
  --surface: var(--foc-color-surface);
  --surface2: var(--foc-color-surface-2);
  --border: rgba(4, 25, 45, .12);
  --text: var(--foc-color-text);
  --muted: var(--foc-color-text-muted);
  --muted2: var(--foc-color-text-muted-2);
  --orb1: rgba(27,167,255,.14);
  --orb2: rgba(255,45,170,.12);
  --grid-line: rgba(6,20,38,.055);
  --cyan-glow: rgba(27,167,255,.22);
  --cyan-soft: rgba(27,167,255,.085);
  --r: var(--foc-radius-lg);
  --ease: var(--foc-ease);
  font-family: var(--foc-font-sans);
  background: var(--bg);
  color: var(--text);
  min-height: 100%;
  padding-top: 88px;
  position: relative;
  overflow-x: hidden;
}
.foc-courses-page > section { padding: 48px 0; background: var(--bg) !important; position: relative; }
.foc-courses-page .container {
  max-width: var(--foc-container-max);
  margin: 0 auto;
  padding: 0 var(--foc-container-pad);
  position: relative;
  z-index: 1;
}
.foc-courses-page .grid-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 18% 12%, var(--orb1) 0%, transparent 55%),
    radial-gradient(circle at 82% 28%, var(--orb2) 0%, transparent 60%),
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: auto, auto, 48px 48px, 48px 48px;
  opacity: .9;
  pointer-events: none;
}
.foc-courses-page .section-head { text-align: center; margin-bottom: 28px; }
.foc-courses-page .stag {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--cyan-soft); border: 1px solid var(--border);
  color: var(--cyan); font-size: 10px; font-weight: 600;
  letter-spacing: .16em; text-transform: uppercase;
  padding: 5px 14px; border-radius: 2px; margin-bottom: 14px;
}
.foc-courses-page .stag::before { content: '//'; color: var(--red); }
.foc-courses-page .sh2 {
  font-family: var(--foc-font-display), Orbitron, sans-serif;
  font-size: clamp(26px, 4vw, 44px);
  font-weight: 700; color: var(--text);
  line-height: 1.1; letter-spacing: 0.03em; margin: 0;
}
.foc-courses-page .sh2 .cyan {
  background: linear-gradient(90deg, var(--cyan), var(--red));
  -webkit-background-clip: text; background-clip: text;
  color: transparent; -webkit-text-fill-color: transparent;
}
.foc-courses-page .s-body {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  font-size: 15px; color: var(--muted); margin-top: 12px;
  text-align: center; line-height: 1.75; font-style: italic;
  margin-left: auto; margin-right: auto;
}

.foc-courses-page .courses-filters {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 18px;
  margin-bottom: 24px;
}
.foc-courses-page .courses-filters__row {
  display: flex; flex-wrap: wrap; gap: 16px;
  align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.foc-courses-page .courses-filters__tag {
  font-size: 10px; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; color: var(--cyan); display: block;
}
.foc-courses-page .courses-filters__active {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  font-size: 14px; font-weight: 600; color: var(--text);
}
.foc-courses-page .courses-search { position: relative; min-width: 220px; flex: 1; max-width: 360px; }
.foc-courses-page .courses-search__input {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  width: 100%; padding: 10px 14px 10px 36px;
  border: 1px solid var(--border); border-radius: 999px;
  background: var(--bg); color: var(--text); font-size: 14px;
}
.foc-courses-page .courses-search__input:focus {
  outline: none; border-color: var(--cyan);
  box-shadow: 0 0 0 3px var(--cyan-soft);
}
.foc-courses-page .courses-search__icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: var(--muted); font-size: 14px;
}
.foc-courses-page .courses-filters__chips,
.foc-courses-page .courses-filters__fee {
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
}
.foc-courses-page .courses-filters__fee { margin-top: 12px; }
.foc-courses-page .courses-filters__fee-label {
  font-size: 11px; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--muted2); margin-right: 4px;
}
.foc-courses-page .filter-chip {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  border: 1px solid var(--border); background: var(--bg);
  color: var(--text); border-radius: 999px;
  padding: 8px 14px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: .2s var(--ease);
  letter-spacing: 0.01em;
}
.foc-courses-page .filter-chip--sm { padding: 6px 12px; font-size: 11px; }
.foc-courses-page .filter-chip.active {
  background: linear-gradient(90deg, var(--cyan), var(--red));
  color: var(--foc-color-text-inverse); border-color: transparent;
}
.foc-courses-page .filter-chip__count {
  margin-left: 6px; opacity: .85; font-size: 11px;
}

.foc-courses-page .courses-grid {
  display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 8px;
}
@media (min-width: 768px) {
  .foc-courses-page .courses-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1200px) {
  .foc-courses-page .courses-grid { grid-template-columns: repeat(3, 1fr); }
}

.foc-courses-page .course-card {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--cr-accent) 22%, var(--border));
  border-radius: var(--r); overflow: hidden; position: relative;
  --cr-accent: var(--cyan);
  box-shadow: 0 10px 28px color-mix(in srgb, var(--cr-accent) 12%, rgba(0,0,0,.06));
  display: flex; flex-direction: column; min-height: 100%;
  transition: .25s var(--ease);
  padding: 0;
}
.foc-courses-page .course-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 36px color-mix(in srgb, var(--cr-accent) 18%, rgba(0,0,0,.08));
}
.foc-courses-page .courses-grid .course-card:nth-child(4n + 1) { --cr-accent: var(--cyan); border-radius: 14px 20px 14px 16px; }
.foc-courses-page .courses-grid .course-card:nth-child(4n + 2) { --cr-accent: var(--red); border-radius: 18px 12px 22px 14px; }
.foc-courses-page .courses-grid .course-card:nth-child(4n + 3) { --cr-accent: color-mix(in srgb, var(--cyan) 55%, var(--red)); border-radius: 12px 18px 14px 20px; }
.foc-courses-page .courses-grid .course-card:nth-child(4n) { --cr-accent: color-mix(in srgb, var(--red) 70%, var(--foc-purple)); border-radius: var(--foc-radius-xl) 14px 16px 18px; }
.foc-courses-page .course-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
  background: linear-gradient(90deg, var(--cr-accent), color-mix(in srgb, var(--cr-accent) 35%, transparent));
  z-index: 2; pointer-events: none;
}
.foc-courses-page .course-thumb {
  height: 160px; background: var(--surface2); position: relative; overflow: hidden;
}
.foc-courses-page .course-thumb > img,
.foc-courses-page .course-thumb-media img:first-child {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: saturate(1.03) contrast(1.03);
}
.foc-courses-page .course-thumb-media {
  display: block; width: 100%; height: 100%; padding: 0; border: none;
  background: transparent; cursor: pointer; position: relative;
}
.foc-courses-page .course-thumb-play {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: 52px; height: 52px; z-index: 1; pointer-events: none;
}
.foc-courses-page .course-thumb::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(11,18,32,.35));
  pointer-events: none;
}
.foc-courses-page .course-badge {
  position: absolute; right: 12px; top: 12px; z-index: 2;
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  font-size: 10px; font-weight: 600; letter-spacing: 0.04em;
  text-transform: uppercase; padding: 6px 10px; border-radius: 999px;
  border: 1px solid var(--border); background: rgba(255,255,255,.92); color: var(--text);
}
.foc-courses-page .course-fee {
  position: absolute; left: 12px; bottom: 12px; z-index: 2;
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  font-size: 10px; font-weight: 600; letter-spacing: 0.04em;
  text-transform: uppercase; padding: 6px 10px; border-radius: 999px;
  background: rgba(255,255,255,.92); border: 1px solid var(--border);
}
.foc-courses-page .course-fee--free { color: var(--cyan); border-color: rgba(27,167,255,.28); }
.foc-courses-page .course-fee--paid { color: var(--red); border-color: rgba(255,45,122,.28); }

.foc-courses-page .course-body {
  padding: 12px 12px 8px; display: flex; flex-direction: column; gap: 8px; flex: 0 1 auto;
}
.foc-courses-page .course-title {
  font-family: var(--foc-font-display), Orbitron, sans-serif;
  font-size: 15px; font-weight: 700;
  letter-spacing: 0.02em; color: var(--text); line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.foc-courses-page .course-sector {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  font-size: 12px; color: var(--muted); letter-spacing: 0.01em;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.foc-courses-page .course-meta {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 0;
}
.foc-courses-page .course-meta .m {
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 12px; padding: 8px;
}
.foc-courses-page .course-meta .m--wide {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.foc-courses-page .course-meta .m--wide strong {
  display: inline;
  margin-bottom: 0;
  flex-shrink: 0;
}
.foc-courses-page .course-meta .m--wide span {
  display: inline;
  text-align: right;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.foc-courses-page .course-meta .m strong {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  display: block; font-size: 10px; font-weight: 600; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--muted2); margin-bottom: 4px;
}
.foc-courses-page .course-meta .m span {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  display: block; font-size: 12px; font-weight: 500; color: var(--text); line-height: 1.4;
}
.foc-courses-page .course-action-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 2px;
}
.foc-courses-page .btn.shr--width { width: 100%; }
.foc-courses-page .btn.cta-callnow,
.foc-courses-page .btn.cta-callnow.btn-bg-color {
  background: var(--home-card-cta);
  color: #fff;
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  border: 1px solid var(--home-card-cta);
  border-radius: 50px;
  font-weight: 600;
  padding: 8px 10px;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: none;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 1.25;
}
.foc-courses-page .btn.cta-callnow:not(.btn-bg-color) {
  background: #fff;
  color: var(--home-card-cta);
}
.foc-courses-page .btn.cta-callnow:hover,
.foc-courses-page .btn.cta-callnow.btn-bg-color:hover {
  background: var(--home-card-cta-hover);
  border-color: var(--home-card-cta-hover);
  color: #fff;
}
.foc-courses-page .course-callback-btn {
  margin-top: 6px;
  padding: 8px 10px;
}
.foc-courses-page .course_card_footer {
  background: var(--home-card-cta);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  margin-top: 0;
  text-align: center;
  padding: 8px 10px;
}
.foc-courses-page .course-learn-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
}
.foc-courses-page .course-learn-more .learnn {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  padding: 4px 0;
}
.foc-courses-page .course-learn-more__icon {
  width: 18px;
  height: auto;
  display: block;
}
.foc-courses-page .courses-empty {
  text-align: center; padding: 48px 16px; color: var(--muted);
}
.foc-courses-page .courses-empty h3 {
  font-family: var(--foc-font-display); color: var(--text); margin-bottom: 8px;
}
.foc-courses-page #courseVid { width: 100%; border-radius: 10px; outline: none; display: block; }
.foc-courses-page .foc-callback-modal .modal-title { color: var(--text); }

.event-video-modal .event-video-modal__content {
  position: relative; border: none; background: #000; overflow: visible;
}
.event-video-modal .modal-body { padding: 0; }
.event-video-modal__close {
  position: absolute; top: 10px; right: 10px; z-index: 20;
  width: 30px; height: 30px; padding: 0; margin: 0; border: none;
  border-radius: 50%; background: rgba(255, 255, 255, 0.95); color: #1a1a2e;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); opacity: 1; float: none;
}
.event-video-modal__close span { font-size: 22px; line-height: 1; margin-top: -2px; }
      `}</style>
    </FrontLayout>
  );
}

export default Course;
