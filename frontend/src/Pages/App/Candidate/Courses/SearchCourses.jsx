
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { resolveMediaUrl } from '../../../../utils/resolveMediaUrl';

const COURSE_THUMB = "/Assets/public_assets/images/newjoblisting/course_img.svg";
const COURSE_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep",
  "Puducherry", "Ladakh", "Jammu and Kashmir",
];

function courseSectorLabel(course) {
  const names = (course?.sectors || []).map((sector) => sector?.name).filter(Boolean);
  return names.join(", ");
}

function CandidateCourseCard({ course, bucketUrl, onPlayVideo, onShare, onRequestCallback }) {
  const thumb = course?.thumbnail ? resolveMediaUrl(bucketUrl, course.thumbnail) || COURSE_THUMB : COURSE_THUMB;
  const videoPath = course?.videos?.[0] || "";
  const loc = course?.city ? `${course.city}, ${course.state || ""}`.replace(/, $/, "") : "NA";
  const lastDate = course?.lastDateForApply
    ? moment(course.lastDateForApply).utcOffset("+05:30").format("MMM DD, YYYY")
    : "NA";
  const badgeLabel = course?.courseType === "coursejob" ? "Course + Jobs" : "Course";
  const sectorLabel = courseSectorLabel(course);

  return (
    <article className="csc-card">
      <div className="csc-thumb">
        {videoPath ? (
          <button
            type="button"
            className="csc-thumb-media"
            data-bs-toggle="modal"
            data-bs-target="#videoModal"
            onClick={() => onPlayVideo(videoPath)}
            aria-label={`Play video for ${course?.name || "course"}`}
          >
            <img src={thumb} alt={course?.name || "Course"} />
            <img src="/Assets/public_assets/images/newjoblisting/play.svg" alt="" className="csc-play" />
          </button>
        ) : (
          <img src={thumb} alt={course?.name || "Course"} />
        )}
        <div className="csc-badge">{badgeLabel}</div>
        {course?.courseFeeType ? (
          <div className={`csc-fee-badge csc-fee-badge--${String(course.courseFeeType).toLowerCase()}`}>
            {course.courseFeeType}
          </div>
        ) : null}
      </div>

      <div className="csc-body">
        <div className="csc-title" title={course?.name}>{course?.name || "Course"}</div>
        {sectorLabel ? <div className="csc-sector" title={sectorLabel}>{sectorLabel}</div> : null}
        <div className="csc-meta">
          <div title={`Eligibility: ${course?.qualification || "N/A"}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 8l10 5 8-4.1V15h2V8L12 3zm-6 9.2V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.8l-6 3-6-3z"/></svg>
            <span>{course?.qualification || "N/A"}</span>
          </div>
          <div title={`Duration: ${course?.duration || "N/A"}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 .01 20.01A10 10 0 0 0 12 2zm1 11H7v-2h4V6h2v7z"/></svg>
            <span>{course?.duration || "N/A"}</span>
          </div>
          <div title={`Location: ${loc}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
            <span>{loc}</span>
          </div>
          <div title={`Mode: ${course?.trainingMode || "N/A"}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9l8-5 8 5v11h-5v-6H9v6H4zm7 0v-4h2v4h-2z"/></svg>
            <span>{course?.trainingMode || "N/A"}</span>
          </div>
          <div className="csc-meta-wide" title={`Last date to apply: ${lastDate}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm12 8H5v10h14V10zM5 8h14V6H5v2z"/></svg>
            <span>{lastDate}</span>
          </div>
        </div>
        <div className="csc-actions">
          <Link className="csc-btn csc-btn-fill" to={`/candidate/course/${course._id}`}>Apply Now</Link>
          <button type="button" className="csc-btn csc-btn-outline" onClick={() => onShare(course)}>Share</button>
        </div>
        {/* <button
          type="button"
          className="csc-btn csc-btn-outline csc-callback"
          data-bs-toggle="modal"
          data-bs-target="#callbackModal"
          onClick={() => onRequestCallback(course)}
        >
          Request for Call Back
        </button> */}
      </div>

      
    </article>
  );
}

const SearchCourses = () => {
  const [courses, setCourses] = useState([]);
  const [videoSrc, setVideoSrc] = useState(""); // ✅ Store the video URL
  const videoRef = useRef(null); // ✅ Reference to the video element
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [feeFilter, setFeeFilter] = useState("all");
  const [callbackForm, setCallbackForm] = useState({
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
  const [callbackLoading, setCallbackLoading] = useState(false);
  const [callbackMessage, setCallbackMessage] = useState("");
  const [callbackError, setCallbackError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;

  useEffect(() => {
    fetchCourses();
  }, [location.search]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${backendUrl}/candidate/searchcourses`, {
        headers: { "x-auth": token },
      });
      console.log("✅ Courses Fetched:", response);
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleVideoClick = (videoUrl) => {
    setVideoSrc(resolveMediaUrl(bucketUrl, videoUrl));
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play();
    }
  };

  useEffect(() => {
    const videoModal = document.getElementById("videoModal");
    if (videoModal) {
      videoModal.addEventListener("hidden.bs.modal", () => setVideoSrc(""));
    }
    return () => {
      if (videoModal) {
        videoModal.removeEventListener("hidden.bs.modal", () => setVideoSrc(""));
      }
    };
  }, []);

  const uniqueSectors = useMemo(() => {
    const seen = new Map();
    courses.forEach((course) => {
      (course.sectors || []).forEach((sector) => {
        const id = sector?._id ? String(sector._id) : "";
        if (id && sector?.name && !seen.has(id)) seen.set(id, { _id: id, name: sector.name });
      });
    });
    return Array.from(seen.values());
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let list = Array.isArray(courses) ? [...courses] : [];
    if (activeFilter !== "all") {
      list = list.filter((course) =>
        (course.sectors || []).some((sector) => String(sector?._id || "") === activeFilter)
      );
    }
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((course) => {
        const sectorMatch = (course.sectors || []).some((sector) =>
          String(sector?.name || "").toLowerCase().includes(term)
        );
        return [
          course.name,
          course.qualification,
          course.duration,
          course.city,
          course.state,
          course.trainingMode,
          course.courseType,
        ].some((value) => String(value || "").toLowerCase().includes(term)) || sectorMatch;
      });
    }
    if (feeFilter !== "all") {
      list = list.filter((course) => String(course.courseFeeType || "").toLowerCase() === feeFilter);
    }
    return list;
  }, [courses, activeFilter, searchTerm, feeFilter]);

  const selectedSectorName = activeFilter === "all"
    ? "All"
    : uniqueSectors.find((sector) => sector._id === activeFilter)?.name || "All";

  const handleShare = async (course) => {
    const courseUrl = `${window.location.origin}/coursedetails/${course._id}`;
    const shareText = `Check out this course: ${course.name || "Course"}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: course.name || "Course", text: shareText, url: courseUrl });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${courseUrl}`);
      alert("Course link copied!");
    } catch {
      alert(courseUrl);
    }
  };

  const handleRequestCallback = (course) => {
    setCallbackMessage("");
    setCallbackError("");
    setCallbackForm((prev) => ({
      ...prev,
      courseName: course?.name || "",
      sectorName: courseSectorLabel(course) || "N/A",
      projectName: course?.projectName || "N/A",
      typeOfProject: course?.typeOfProject || "N/A",
    }));
  };

  const handleCallbackChange = (event) => {
    const { name, value } = event.target;
    setCallbackForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCallbackSubmit = async (event) => {
    event.preventDefault();
    setCallbackLoading(true);
    setCallbackMessage("");
    setCallbackError("");
    try {
      const response = await axios.post(`${backendUrl}/callback`, callbackForm, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.status === 200 || response.status === 201) {
        setCallbackMessage("Request submitted successfully!");
        setCallbackForm((prev) => ({
          ...prev,
          name: "",
          state: "",
          mobile: "",
          email: "",
          message: "",
        }));
      }
    } catch {
      setCallbackError("Failed to submit. Please try again.");
    } finally {
      setCallbackLoading(false);
    }
  };

  return (
    <div className="">
      <div className="container mt-3">
        {/* Breadcrumbs header for desktop */}
        <div className="content-header row d-xl-block d-lg-block">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12 my-auto">
                <h3 className="content-header-title float-left mb-0 textSIze">Search Courses</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb textSIze">
                    <li className="breadcrumb-item">
                      <Link to="/candidate/dashboard">Home</Link>
                    </li>
                    <li className="breadcrumb-separator">
                      <i className="fas fa-angle-right mx-1 text-muted"></i>
                    </li>
                    <li className="breadcrumb-item active textSIze ">Search Courses</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <ul className="nav nav-tabs justify-content-center " id="courseTabs">
          <li className="nav-item">
            <Link className="nav-link active" to="/search-courses">
              Search Courses
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/candidate/pendingFee">
              Pending for Fee
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/candidate/appliedCourses">
              Applied Courses
            </Link>
          </li>
        </ul> */}

        <section className="csc-page">
          <div className="csc-filters">
            <div className="csc-filters-row">
              <div>
                <span className="csc-filters-tag">Filter by Sector</span>
                <span className="csc-filters-active">{selectedSectorName}</span>
              </div>
              <div className="csc-search">
                <input
                  type="text"
                  className="csc-search-input"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Search courses"
                />
                <span className="csc-search-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
              </div>
            </div>
            <div className="csc-chips">
              <button
                type="button"
                className={`csc-chip${activeFilter === "all" ? " active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                All <span>{courses.length}</span>
              </button>
              {uniqueSectors.map((sector) => {
                const count = courses.filter((course) =>
                  (course.sectors || []).some((item) => String(item?._id || "") === sector._id)
                ).length;
                return (
                  <button
                    key={sector._id}
                    type="button"
                    className={`csc-chip${activeFilter === sector._id ? " active" : ""}`}
                    onClick={() => setActiveFilter(sector._id)}
                  >
                    {sector.name} <span>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="csc-fee">
              <span>Course Type:</span>
              {["all", "paid", "free"].map((fee) => (
                <button
                  key={fee}
                  type="button"
                  className={`csc-chip csc-chip-sm${feeFilter === fee ? " active" : ""}`}
                  onClick={() => setFeeFilter(fee)}
                >
                  {fee === "all" ? "All" : fee.charAt(0).toUpperCase() + fee.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredCourses.length > 0 ? (
            <div className="csc-grid">
              {filteredCourses.map((course) => (
                <CandidateCourseCard
                  key={course._id}
                  course={course}
                  bucketUrl={bucketUrl}
                  onPlayVideo={handleVideoClick}
                  onShare={handleShare}
                  onRequestCallback={handleRequestCallback}
                />
              ))}
            </div>
          ) : (
            <div className="csc-empty">
              <h3>No courses found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </section>

        <div className="modal fade" id="callbackModal" tabIndex="-1" aria-labelledby="callbackModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="callbackModalLabel">Request for Call Back</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body">
                <form onSubmit={handleCallbackSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Name</label>
                      <input type="text" className="form-control" name="name" value={callbackForm.name} onChange={handleCallbackChange} required placeholder="Your name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">State</label>
                      <select className="form-control" name="state" value={callbackForm.state} onChange={handleCallbackChange} required>
                        <option value="" disabled>Select state</option>
                        {COURSE_STATES.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contact Number</label>
                      <input type="tel" className="form-control" name="mobile" value={callbackForm.mobile} onChange={handleCallbackChange} required pattern="[0-9]{10}" placeholder="10-digit mobile" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" name="email" value={callbackForm.email} onChange={handleCallbackChange} required placeholder="Your email" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea className="form-control" name="message" value={callbackForm.message} onChange={handleCallbackChange} required rows={3} placeholder="Your message" />
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={callbackLoading}>
                    {callbackLoading ? "Submitting..." : "Submit"}
                  </button>
                  {callbackMessage ? <p className="text-success mt-2 mb-0">{callbackMessage}</p> : null}
                  {callbackError ? <p className="text-danger mt-2 mb-0">{callbackError}</p> : null}
                </form>
              </div>
            </div>
          </div>
        </div>

        <style>{`
.csc-page { --csc-cyan:#1ba7ff; --csc-red:#ff2daa; --csc-navy:#0d2146; --csc-navy-2:#163565; --csc-bg:#f6f8fc; --csc-surface:#fff; --csc-text:#102033; --csc-muted:#5b6b7c; --csc-border:rgba(4,25,45,.12); }
.csc-filters { background:#fff; border:1px solid var(--csc-border); border-radius:16px; padding:18px; margin-bottom:18px; }
.csc-filters-row { display:flex; flex-wrap:wrap; gap:16px; align-items:center; justify-content:space-between; margin-bottom:14px; }
.csc-filters-tag { display:block; font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--csc-cyan); }
.csc-filters-active { font-size:14px; font-weight:600; color:var(--csc-text); }
.csc-search { position:relative; min-width:220px; flex:1; max-width:360px; }
.csc-search-input { width:100%; padding:10px 14px 10px 36px; border:1px solid var(--csc-border); border-radius:999px; background:var(--csc-bg); color:var(--csc-text); font-size:14px; }
.csc-search-input:focus { outline:none; border-color:var(--csc-cyan); box-shadow:0 0 0 3px rgba(27,167,255,.12); }
.csc-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--csc-muted); font-size:14px; }
.csc-chips, .csc-fee { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.csc-fee { margin-top:12px; }
.csc-fee > span { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--csc-muted); margin-right:4px; }
.csc-chip { border:1px solid var(--csc-border); background:var(--csc-bg); color:var(--csc-text); border-radius:999px; padding:8px 14px; font-size:12px; font-weight:600; cursor:pointer; }
.csc-chip span { margin-left:6px; opacity:.85; font-size:11px; }
.csc-chip-sm { padding:6px 12px; font-size:11px; }
.csc-chip.active { background:linear-gradient(90deg, var(--csc-cyan), var(--csc-red)); color:#fff; border-color:transparent; }
.csc-grid { display:grid; grid-template-columns:1fr; gap:16px; }
@media (min-width:768px) { .csc-grid { grid-template-columns:repeat(2, 1fr); } }
@media (min-width:1200px) { .csc-grid { grid-template-columns:repeat(3, 1fr); } }
.csc-card { background:#fff; border:1px solid color-mix(in srgb, var(--csc-accent, var(--csc-cyan)) 22%, var(--csc-border)); border-radius:16px; overflow:hidden; position:relative; display:flex; flex-direction:column; min-height:100%; box-shadow:0 10px 28px color-mix(in srgb, var(--csc-accent, var(--csc-cyan)) 12%, rgba(0,0,0,.06)); transition:transform .25s ease, box-shadow .25s ease; }
.csc-card:hover { transform:translateY(-3px); box-shadow:0 14px 36px color-mix(in srgb, var(--csc-accent, var(--csc-cyan)) 18%, rgba(0,0,0,.08)); }
.csc-grid .csc-card:nth-child(4n + 1) { --csc-accent:var(--csc-cyan); border-radius:14px 20px 14px 16px; }
.csc-grid .csc-card:nth-child(4n + 2) { --csc-accent:var(--csc-red); border-radius:18px 12px 22px 14px; }
.csc-grid .csc-card:nth-child(4n + 3) { --csc-accent:color-mix(in srgb, var(--csc-cyan) 55%, var(--csc-red)); border-radius:12px 18px 14px 20px; }
.csc-grid .csc-card:nth-child(4n) { --csc-accent:color-mix(in srgb, var(--csc-red) 70%, #7c3aed); border-radius:18px 14px 16px 18px; }
.csc-card::before { content:""; position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg, var(--csc-accent, var(--csc-cyan)), transparent); z-index:2; pointer-events:none; }
.csc-thumb { height:160px; background:#eef3f8; position:relative; overflow:hidden; }
.csc-thumb > img, .csc-thumb-media img:first-child { width:100%; height:100%; object-fit:cover; display:block; }
.csc-thumb-media { display:block; width:100%; height:100%; padding:0; border:none; background:transparent; cursor:pointer; position:relative; }
.csc-play { position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); width:52px; height:52px; z-index:1; pointer-events:none; }
.csc-badge { position:absolute; left:12px; top:12px; z-index:3; font-size:10px; font-weight:600; text-transform:uppercase; padding:6px 10px; border-radius:999px; border:1px solid var(--csc-border); background:rgba(255,255,255,.92); color:var(--csc-text); }
.csc-fee-badge { position:absolute; right:12px; bottom:12px; z-index:3; font-size:10px; font-weight:600; padding:6px 10px; border-radius:999px; background:rgba(255,255,255,.92); border:1px solid var(--csc-border); }
.csc-fee-badge--paid { color:var(--csc-red); }
.csc-body { padding:12px 12px 8px; display:flex; flex-direction:column; gap:8px; }
.csc-title { font-size:16px; font-weight:700; color:var(--csc-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.csc-sector { font-size:12px; color:var(--csc-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.csc-meta { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.csc-meta > div { display:flex; align-items:center; gap:6px; background:var(--csc-bg); border:1px solid var(--csc-border); border-radius:12px; padding:8px; min-width:0; }
.csc-meta svg { width:18px; height:18px; min-width:18px; flex:0 0 18px; display:block; fill:#0d2146; }
.csc-meta span { font-size:12px; font-weight:500; color:var(--csc-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
.csc-meta-wide { grid-column:1 / -1; }
.csc-actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.csc-btn { border-radius:50px; font-weight:600; padding:8px 10px; font-size:12px; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; width:100%; }
.csc-btn-fill { background:var(--csc-navy); color:#fff; border:1px solid var(--csc-navy); }
.csc-btn-fill:hover { background:var(--csc-navy-2); color:#fff; }
.csc-btn-outline { background:#fff; color:var(--csc-navy); border:1px solid var(--csc-navy); }
.csc-btn-outline:hover { background:var(--csc-navy-2); color:#fff; }
.csc-callback { margin-top:2px; }
.csc-footer { background:var(--csc-navy); text-align:center; padding:8px 10px; margin-top:auto; }
.csc-learn { display:inline-flex; align-items:center; justify-content:center; gap:6px; text-decoration:none; color:#fff; font-size:13px; font-weight:600; }
.csc-learn img { width:18px; height:auto; display:block; }
.csc-empty { text-align:center; padding:48px 16px; color:var(--csc-muted); }
.csc-empty h3 { color:var(--csc-text); margin-bottom:8px; }
`}</style>


        {/* ✅ Video Modal */}
        <div
          className="modal fade"
          id="videoModal"
          tabIndex="-1"
          aria-labelledby="videoModalTitle"
          aria-hidden="true"
          onClick={() => setVideoSrc("")}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-0">
              <button
                type="button"
                className="close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
              <div className="modal-body p-0 text-center embed-responsive">
                <video key={videoSrc} id="courseVid" controls className="video-fluid text-center">
                  <source src={videoSrc} type="video/mp4" className="img-fluid video-fluid" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>


        <style>
          {`
          .course--apply {
            background: #fff;
            border-radius: 0.5rem;
            box-shadow: 0px 4px 25px 0px rgba(0, 0, 0, 0.1);
            transition: all .3s ease-in-out;
            text-align: center;
            padding: 8px 5px;
          }

          .course--apply a {
            color: #000;
          }

          #courseTabs {
            gap: 25px;
          }

          .video-bttn {
            position: relative;
            display: block;
          }

          .video-bttn img {
            width: 100%;
            height: auto;
          }
            .right_obj{
            right:0px;
            }

            .video-bttn:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
    margin-left: -20px;
    margin-top: -20px;
    background-image: url(../../../../../public/Assets/images/icon-play.png);
    background-size: contain;
    display: block;
    width: 44px;
    height: 44px;
    box-shadow: 0 .5rem 1rem rgb(252 43 90 / 39%) !important;
    border-radius: 50px;
}
.apply-thisjob {
    background-color: #FC2B5A;
    width: calc(100% - 30px);
    border: 2px solid #FC2B5A;
    // text-align: center;
    float: left;
    color: #fff!important;
    -webkit-border-radius: 8px;
    -moz-border-radius: 8px;
    -ms-border-radius: 8px;
    -o-border-radius: 8px;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 12px;
    font-family: Open Sans;
    font-weight: bold;
    text-align: left;
}
.apply-thisjob i {
    font-size: 28px;
    margin-right: 8px;
    line-height: 11px;
    position: relative;
    top: 5px;
}
.extra-job-info {
    float: left;
    width: calc(100% - 30px);
    margin-top: 30px;
}
.extra-job-info>span {
    float: left;
    width: 100%;
    border: 2px solid #e8ecec;
    -webkit-border-radius: 8px;
    -moz-border-radius: 8px;
    -ms-border-radius: 8px;
    -o-border-radius: 8px;
    border-radius: 8px;
    padding: 10px 20px;
    margin-bottom: 10px;
    font-family: Open Sans;
    font-size: 13px;
    color: #888888;
}
.extra-job-info>span i {
    margin-left: 8px;
    float: left;
    font-size: 30px;
    color: #FC2B5A;
    width: 30px;
    margin-right: 12px;
}
.extra-job-info>span strong {
    font-family: Open Sans;
    font-size: 13px;
    font-weight: normal;
    color: #202020;
    line-height: 28px;
    display: inline;
    margin-right: 7px;
}
.job-single-sec {
    float: left;
    width: 100%;
}
.cr_detail_in .course_dt {
    background: #eeeeee54;
    padding: 8px;
    border-radius: 6px;
    border: solid 1px #dddddda8;
}
.cr_detail_in .course_dt h6 {
    font-size: 13px;
    font-weight: 600;
}
.cr_detail_in .course_dt p {
    color: #6d6d6d;
}
#candi_login-faq {
    background: rgba(217, 217, 217, 0.3);
    border: 1px solid #9e9e9e;
    border-radius: 25px;
    padding: 30px 15px;
}
.course_dt h6 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 6px;
}
.single-footer .contact-info {
    margin-top: 15px;
}
.single-footer .contact-info li {
    margin-bottom: 10px;
    color: #000;
    font-weight: 500;
    position: relative;
    padding-left: 20px;
}
.single-footer .contact-info li img {
    position: absolute;
    left: 0;
    top: 3px;
    height: auto;
    width: 12px;
}
li#que p {
    margin-bottom: 0px !important;
    line-height: normal;
}
div#floating-apply {
    position: fixed;
    bottom: 100px;
    right: 10px;
    z-index: 999;
}


@media(max-width:1024px){
    .card{
        width: 100%!important;
    }
    .extra-job-info{
        width: 100%;
    }

}
@media(max-width:768px){
    .course_details_col {
        background: rgba(217, 217, 217, 0.3);
        border: 1px solid #9e9e9e;
        border-radius: 25px;
        padding: 10px 10px;
    }
}
        `}
        </style>

        <style>
          {

            `
            .cr_nw_in {
    border: none;
    border-radius: 0.5rem;
    box-shadow: 0px 4px 25px 0px rgba(0, 0, 0, 0.1);
    transition: all .3sease-in-out;
    margin: 15px 0px;
    position: relative;
}
.right_obj {
    color: #FC2B5A;
    background: #fff;
    width: fit-content;
    padding: 2px 10px;
    position: absolute;
    top: 30px;
    right: 17px;
    box-shadow: 0.5px 0px 2px rgba(0, 0, 0, 0.30);
    font-weight: 700;
    font-family: inter;
    border-bottom-left-radius: 15px;
    border: 1px dashed #FFD542;
    outline: 3px solid #FFF;
    border-right: 0px;
    z-index: 1;
}
.cr_nw_in img.video_thum {
    border-radius: 8px 8px 0px 0px;
    width: 100%;
}
.video-bttn:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
    margin-left: -20px;
    margin-top: -20px;
    background-image: url(/Assets/images/icon-play.png); 
    background-size: contain;
    display: block;
    width: 44px;
    height: 44px;
    box-shadow: 0 .5rem 1rem rgb(252 43 90 / 39%) !important;
    border-radius: 50px;
}
.course_inf {
    padding: 15px;
}
.course_inf h5 {
    font-size: 17px;
    text-transform: capitalize;
    font-weight: 600;
    line-height: 24px;
    color: #000;
}
.course_inf span.job_cate {
    background: #1b95391a;
    padding: 4px 8px;
    font-size: 11px;
    border-radius: 4px;
    color: #1b9539;
    border: solid 1px;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.2px;
    display: inline-table;
    width: fit-content;
    overflow: auto;
    word-wrap: break-word;
}
.course_spec {
    display: flex
;
    margin-top: 20px;
    color: #000;
}
.course_spec .spe_icon {
    margin-right: 10px;
}
.width {
    width: 30px;
}
.apply-thisjob {
    background-color: #FC2B5A;
    float: left;
    width: calc(100% - 30px);
    border: 2px solid #FC2B5A;
    text-align: center;
    color: #fff;
    -webkit-border-radius: 8px;
    -moz-border-radius: 8px;
    -ms-border-radius: 8px;
    -o-border-radius: 8px;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 12px;
    font-family: Open Sans;
    font-weight: bold;
    text-align: left;
}
.apply-thisjob:hover {
    border: 2px solid #FC2B5A;
    background: #fff;
    color: #FC2B5A!important;
    text-decoration: none;
}
.ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  
  .para_ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .course_spec .spe_icon {
    margin-right: 10px;
}
.video-fluid{
    width: 100%;
}
button.close {
    z-index: 9;
    background: #fff;
    border: 2px solid #FC2B5A !important;
    font-size: 19px;
    border-radius: 100px;
    height: 38px;
    opacity: 1;
    padding: 0;
    position: absolute;
    right: -13px;
    top: -12px;
    width: 38px;
    -webkit-appearance: none;
    -moz-box-shadow: none;
    -webkit-box-shadow: none;
    box-shadow: none;
    font-weight: 400;
    transition: .3s;
    font-weight: 900;
}

@media screen and (max-width: 1261px) {
    .apply-thisjob {
        width: 100% !important;
    }
}
@media screen and (max-width: 992px) {
    .apply-thisjob {
        width: 100% !important;
    }
}
    .breadcrumb-item a {
    color: #FC2B5A;
        }
            `
          }
        </style>

        <style>
          {

            `
            
            .textSIze{
            font-size:clamp(13px, 2.5vw,  18px);
            }
            `
          }
        </style>

        <style>
          {
            `
           @media (max-width: 768px){
           .card-height{
               height: 340px;
               }
           }
            `
          }
        </style>
        <style>
          {
            `
            @media (max-width: 1018px){
            .card-details{
            height: 292px;
            }
            }
            @media (max-width: 769px){
                .card-details{
                    height: 85%;
                }
            }
                @media (max-width: 426px){
                  .apply-thisjob i {
                    font-size: 21px !important;  
                    }
                    .apply-thisjob{
                    font-size: 13px !important;
                    }
            `
          }
        </style>
      </div>
    </div>

  );
};

export default SearchCourses;
