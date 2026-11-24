import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, MapPin, Search, SlidersHorizontal } from "lucide-react";
import FrontLayout from "../../../Component/Layouts/Front";
import { resolveMediaUrl } from "../../../utils/resolveMediaUrl";
import { JobCard } from "../Jobs/Jobs";
import { CourseCard } from "../Courses/Course";
import { EventCard } from "../Event/Event";
import "./Opportunities.css";

const TYPES = [
  { id: "jobs", label: "Jobs" },
  { id: "courses", label: "Courses" },
  { id: "events", label: "Events" },
];
const PAGE_SIZE = 8;
const STATES = [
  "Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

function textOf(...parts) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function includesText(haystack, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.includes(q);
}

function jobCity(job) {
  return job?.city?.name || "";
}
function jobState(job) {
  return job?.state?.name || "";
}
function jobYears(job) {
  return Number(job?.experience || 0) + Number(job?.experienceMonths || 0) / 12;
}
function placeLabel(city, state) {
  return [city, state].filter(Boolean).join(", ");
}
function eventClosed(event) {
  if (!event?.timing?.to) return false;
  return moment(event.timing.to).isBefore(moment());
}
function timeOf(value) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}
function toggleValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
function countBy(items, pick) {
  const map = new Map();
  items.forEach((item) => {
    const value = pick(item);
    if (!value) return;
    map.set(value, (map.get(value) || 0) + 1);
  });
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

const PREVIEW = 5;

function FilterSection({ title, open, onToggle, children }) {
  return (
    <section className="nk-group">
      <button type="button" className="nk-group__head" onClick={onToggle} aria-expanded={open}>
        <h3>{title}</h3>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open ? children : null}
    </section>
  );
}

function FilterChecks({ options, selected, onToggle, expanded, onExpand }) {
  if (!options.length) return null;
  const visible = expanded ? options : options.slice(0, PREVIEW);
  const hidden = options.length - PREVIEW;
  return (
    <div className="nk-box">
      {visible.map((option) => {
        const value = option.value ?? option.label;
        return (
          <label className="nk-check" key={value}>
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
            />
            <span title={option.label}>{option.label}</span>
            <em>({option.count})</em>
          </label>
        );
      })}
      {hidden > 0 ? (
        <button type="button" className="nk-more" onClick={onExpand}>
          {expanded ? "View less" : `View more (${hidden} more)`}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      ) : null}
    </div>
  );
}

function Opportunities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = TYPES.some((item) => item.id === searchParams.get("type"))
    ? searchParams.get("type")
    : "jobs";
  const [type, setType] = useState(initialType);
  const [jobs, setJobs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [jobSectors, setJobSectors] = useState([]);
  const [courseSectors, setCourseSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedModes, setSelectedModes] = useState([]);
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [selectedEducation, setSelectedEducation] = useState([]);
  const [selectedFees, setSelectedFees] = useState([]);
  const [selectedRegs, setSelectedRegs] = useState([]);
  const [experienceCap, setExperienceCap] = useState(null);
  const [sort, setSort] = useState("latest");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const [showSectors, setShowSectors] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    mode: true, experience: true, location: true, sector: true, education: true, extra: true,
  });
  const [videoSrc, setVideoSrc] = useState("");
  const [callback, setCallback] = useState({
    name: "", state: "", mobile: "", email: "", message: "", courseName: "",
  });
  const [callbackMessage, setCallbackMessage] = useState("");

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-foc-theme", "sky-magenta");
    root.style.setProperty("--front-layout-bg", "var(--foc-color-bg)");
    return () => root.style.removeProperty("--front-layout-bg");
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const lock = () => {
      const desktop = window.innerWidth > 991;
      html.style.overflow = desktop ? "hidden" : "";
      body.style.overflow = desktop ? "hidden" : "";
    };
    lock();
    window.addEventListener("resize", lock);
    return () => {
      window.removeEventListener("resize", lock);
      html.style.overflow = "";
      body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [jobRes, courseRes, eventRes] = await Promise.all([
          axios.get(`${backendUrl}/joblisting`),
          axios.get(`${backendUrl}/courses`),
          axios.get(`${backendUrl}/event`),
        ]);
        if (cancelled) return;
        setJobs(Array.isArray(jobRes.data?.recentJobs) ? jobRes.data.recentJobs : []);
        setJobSectors(Array.isArray(jobRes.data?.uniqueSectors) ? jobRes.data.uniqueSectors : []);
        setCourses(Array.isArray(courseRes.data?.courses) ? courseRes.data.courses : []);
        setCourseSectors(Array.isArray(courseRes.data?.uniqueSectors) ? courseRes.data.uniqueSectors : []);
        setEvents(Array.isArray(eventRes.data?.events) ? eventRes.data.events : []);
      } catch (err) {
        if (!cancelled) setError("Could not load listings. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [backendUrl]);

  useEffect(() => {
    const videoModal = document.getElementById("videoModal");
    const onHidden = () => setVideoSrc("");
    videoModal?.addEventListener("hidden.bs.modal", onHidden);
    return () => videoModal?.removeEventListener("hidden.bs.modal", onHidden);
  }, []);

  const switchType = (next) => {
    setType(next);
    setSelectedCities([]);
    setSelectedModes([]);
    setSelectedSectors([]);
    setSelectedEducation([]);
    setSelectedFees([]);
    setSelectedRegs([]);
    setExperienceCap(null);
    setShowCities(false);
    setShowModes(false);
    setShowSectors(false);
    setShowEducation(false);
    setVisible(PAGE_SIZE);
    setFiltersOpen(false);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("type", next);
    setSearchParams(nextParams, { replace: true });
  };

  const searched = useMemo(() => {
    if (type === "jobs") {
      return jobs.filter((job) => includesText(
        textOf(job.title, job.displayCompanyName, job._qualification?.name, job._industry?.name, job.work, jobCity(job), jobState(job)),
        query
      ) && includesText(textOf(jobCity(job), jobState(job)), location));
    }
    if (type === "courses") {
      return courses.filter((course) => includesText(
        textOf(course.name, course.qualification, course.trainingMode, ...(course.sectorNames || []), course.city, course.state),
        query
      ) && includesText(textOf(course.city, course.state), location));
    }
    return events.filter((event) => includesText(
      textOf(event.name, event.eventTitle, event.eventMode, event.location?.city, event.location?.state),
      query
    ) && includesText(textOf(event.location?.city, event.location?.state), location));
  }, [type, jobs, courses, events, query, location]);

  const cityOptions = useMemo(() => {
    if (type === "jobs") return countBy(searched, (job) => placeLabel(jobCity(job), jobState(job)));
    if (type === "courses") return countBy(searched, (course) => placeLabel(course.city, course.state));
    return countBy(searched, (event) => placeLabel(event.location?.city, event.location?.state));
  }, [type, searched]);

  const educationOptions = useMemo(() => {
    if (type === "jobs") return countBy(searched, (job) => job._qualification?.name || "");
    if (type === "courses") return countBy(searched, (course) => course.qualification || "");
    return [];
  }, [type, searched]);

  const experienceCeiling = useMemo(() => {
    const max = jobs.reduce((peak, job) => Math.max(peak, Math.ceil(jobYears(job))), 0);
    return Math.max(max, 1);
  }, [jobs]);

  const modeOptions = useMemo(() => {
    if (type === "jobs") return countBy(searched, (job) => job.work || "");
    if (type === "courses") return countBy(searched, (course) => course.trainingMode || "");
    return countBy(searched, (event) => event.eventMode || "");
  }, [type, searched]);

  const sectorOptions = useMemo(() => {
    const source = type === "jobs" ? jobSectors : courseSectors;
    if (type === "events") return [];
    return source
      .map((sector) => {
        const id = String(sector._id);
        const count = searched.filter((item) => {
          if (type === "jobs") return String(item._industry?._id || "") === id;
          return (item.sectors || []).some((value) => String(value?._id || value) === id);
        }).length;
        return { label: sector.name, id, count };
      })
      .filter((sector) => sector.count > 0);
  }, [type, searched, jobSectors, courseSectors]);

  const filtered = useMemo(() => {
    let list = searched.filter((item) => {
      const city = type === "jobs"
        ? placeLabel(jobCity(item), jobState(item))
        : type === "courses"
          ? placeLabel(item.city, item.state)
          : placeLabel(item.location?.city, item.location?.state);
      const mode = type === "jobs" ? item.work : type === "courses" ? item.trainingMode : item.eventMode;
      const education = type === "jobs" ? item._qualification?.name : type === "courses" ? item.qualification : "";
      if (selectedCities.length && !selectedCities.includes(city)) return false;
      if (selectedModes.length && !selectedModes.includes(mode)) return false;
      if (selectedEducation.length && !selectedEducation.includes(education)) return false;
      if (type === "jobs" && experienceCap !== null && jobYears(item) > experienceCap) return false;
      if (type === "courses" && selectedFees.length && !selectedFees.includes(String(item.courseFeeType || "").toLowerCase())) return false;
      if (type === "events" && selectedRegs.length) {
        const closed = eventClosed(item);
        const bucket = closed ? "closed" : "open";
        if (!selectedRegs.includes(bucket)) return false;
      }
      if (selectedSectors.length && type !== "events") {
        const hit = type === "jobs"
          ? selectedSectors.includes(String(item._industry?._id || ""))
          : (item.sectors || []).some((value) => selectedSectors.includes(String(value?._id || value)));
        if (!hit) return false;
      }
      return true;
    });

    const byDate = (a, b) => {
      const leftTime = type === "events" ? timeOf(a.timing?.from) : timeOf(a.createdAt || a.updatedAt || a.validity);
      const rightTime = type === "events" ? timeOf(b.timing?.from) : timeOf(b.createdAt || b.updatedAt || b.validity);
      return type === "events" ? leftTime - rightTime : rightTime - leftTime;
    };
    const needle = query.trim().toLowerCase();
    list = [...list].sort((a, b) => {
      if (sort === "relevance" && needle) {
        const titleOf = (item) => String(type === "jobs" ? item.title : item.name || item.eventTitle || "").toLowerCase();
        const score = (item) => {
          const title = titleOf(item);
          if (title === needle) return 3;
          if (title.startsWith(needle)) return 2;
          if (title.includes(needle)) return 1;
          return 0;
        };
        const diff = score(b) - score(a);
        if (diff) return diff;
      }
      return byDate(a, b);
    });
    return list;
  }, [searched, type, selectedCities, selectedModes, selectedSectors, selectedEducation, selectedFees, selectedRegs, experienceCap, sort, query]);

  const chips = [
    ...selectedCities.map((value) => ({ key: `city-${value}`, label: value, clear: () => setSelectedCities((list) => list.filter((item) => item !== value)) })),
    ...selectedModes.map((value) => ({ key: `mode-${value}`, label: value, clear: () => setSelectedModes((list) => list.filter((item) => item !== value)) })),
    ...selectedSectors.map((id) => {
      const sector = sectorOptions.find((item) => item.id === id);
      return { key: `sector-${id}`, label: sector?.label || "Sector", clear: () => setSelectedSectors((list) => list.filter((item) => item !== id)) };
    }),
    ...selectedEducation.map((value) => ({ key: `edu-${value}`, label: value, clear: () => setSelectedEducation((list) => list.filter((item) => item !== value)) })),
    experienceCap !== null ? { key: "exp", label: experienceCap === 0 ? "Fresher" : `Up to ${experienceCap} ${experienceCap === 1 ? "year" : "years"}`, clear: () => setExperienceCap(null) } : null,
    ...selectedFees.map((value) => ({ key: `fee-${value}`, label: value === "free" ? "Free" : "Paid", clear: () => setSelectedFees((list) => list.filter((item) => item !== value)) })),
    ...selectedRegs.map((value) => ({ key: `reg-${value}`, label: value === "open" ? "Registration open" : "Registration closed", clear: () => setSelectedRegs((list) => list.filter((item) => item !== value)) })),
  ].filter(Boolean);

  const clearFilters = () => {
    setSelectedCities([]);
    setSelectedModes([]);
    setSelectedSectors([]);
    setSelectedEducation([]);
    setSelectedFees([]);
    setSelectedRegs([]);
    setExperienceCap(null);
    setQuery("");
    setLocation("");
    setDraftQuery("");
    setDraftLocation("");
    setVisible(PAGE_SIZE);
  };

  const applySearch = (event) => {
    event.preventDefault();
    setQuery(draftQuery);
    setLocation(draftLocation);
    setVisible(PAGE_SIZE);
    document.getElementById("nk-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const shareJob = async (jobId, jobTitle) => {
    const url = `${window.location.origin}/jobdetailsmore/${jobId}`;
    if (navigator.share) {
      try { await navigator.share({ title: jobTitle, text: `Check out this job: ${jobTitle}`, url }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    alert("Job link copied");
  };

  const shareCourse = async (course) => {
    const url = `${window.location.origin}/coursedetails/${course._id}`;
    if (navigator.share) {
      try { await navigator.share({ title: course.name, text: `Check out this course: ${course.name}`, url }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    alert("Course link copied");
  };

  const thumbUrl = (job) => {
    const raw = job.jobVideoThumbnail || job.thumbnail || job._company?.logo;
    return resolveMediaUrl(bucketUrl, raw) || "/Assets/public_assets/images/newjoblisting/course_img.jpg";
  };

  const submitCallback = async (event) => {
    event.preventDefault();
    setCallbackMessage("");
    try {
      await axios.post(`${backendUrl}/callback`, callback, { headers: { "Content-Type": "application/json" } });
      setCallbackMessage("Request submitted.");
      setCallback({ name: "", state: "", mobile: "", email: "", message: "", courseName: "" });
    } catch {
      setCallbackMessage("Could not submit. Please try again.");
    }
  };

  const shown = filtered.slice(0, visible);
  const noun = type === "jobs" ? "jobs" : type === "courses" ? "courses" : "events";
  const modeTitle = type === "jobs" ? "Work mode" : type === "courses" ? "Training mode" : "Event mode";
  const locationTitle = type === "jobs" ? "Job Location" : "Location";
  const sectorTitle = type === "jobs" ? "Industry" : "Sector";
  const expValue = experienceCap === null ? 0 : experienceCap;
  const expLabel = experienceCap === null
    ? "Any experience"
    : experienceCap === 0
      ? "Fresher"
      : `Up to ${experienceCap} ${experienceCap === 1 ? "year" : "years"}`;
  const expFill = `${(expValue / experienceCeiling) * 100}%`;
  const toggleGroup = (key) => setOpenGroups((groups) => ({ ...groups, [key]: !groups[key] }));
  const feeOptions = [
    { label: "Free", value: "free", count: type === "courses" ? searched.filter((item) => String(item.courseFeeType || "").toLowerCase() === "free").length : 0 },
    { label: "Paid", value: "paid", count: type === "courses" ? searched.filter((item) => String(item.courseFeeType || "").toLowerCase() === "paid").length : 0 },
  ].filter((option) => option.count > 0);
  const regOptions = [
    { label: "Registration open", value: "open", count: type === "events" ? searched.filter((item) => !eventClosed(item)).length : 0 },
    { label: "Registration closed", value: "closed", count: type === "events" ? searched.filter((item) => eventClosed(item)).length : 0 },
  ].filter((option) => option.count > 0);

  return (
    <FrontLayout>
      <div className="foc-cyber-home foc-courses-page foc-jobs-page foc-events-page nk-board">
        <section className="grid-bg">
          <div className="nk-wrap">
            <form className="nk-searchbar" onSubmit={applySearch}>
              <label>
                <Search size={16} />
                <input
                  value={draftQuery}
                  onChange={(event) => setDraftQuery(event.target.value)}
                  placeholder="Search jobs, courses, skills, companies"
                  aria-label="Search"
                />
              </label>
              <label>
                <MapPin size={16} />
                <input
                  value={draftLocation}
                  onChange={(event) => setDraftLocation(event.target.value)}
                  placeholder="Location"
                  aria-label="Location"
                />
              </label>
              <button type="submit">Search</button>
            </form>

            <div className="nk-layout">
              {filtersOpen ? <button type="button" className="nk-backdrop" aria-label="Close filters" onClick={() => setFiltersOpen(false)} /> : null}
              <aside className={`nk-filters${filtersOpen ? " open" : ""}`}>
                <div className="nk-filters__head">
                  <h2>All Filters</h2>
                  <button type="button" className="nk-filters__clear" onClick={clearFilters}>Clear All</button>
                  <button type="button" className="nk-filters__close" aria-label="Close" onClick={() => setFiltersOpen(false)}>&times;</button>
                </div>

                <div className="nk-sort-pills" role="group" aria-label="Sort">
                  <button type="button" className={sort === "relevance" ? "active" : ""} onClick={() => setSort("relevance")}>Relevance</button>
                  <button type="button" className={sort === "latest" ? "active" : ""} onClick={() => setSort("latest")}>Date</button>
                </div>

                {modeOptions.length ? (
                  <FilterSection title={modeTitle} open={openGroups.mode} onToggle={() => toggleGroup("mode")}>
                    <FilterChecks
                      options={modeOptions}
                      selected={selectedModes}
                      onToggle={(value) => setSelectedModes((list) => toggleValue(list, value))}
                      expanded={showModes}
                      onExpand={() => setShowModes((open) => !open)}
                    />
                  </FilterSection>
                ) : null}

                {type === "jobs" ? (
                  <FilterSection title="Experience" open={openGroups.experience} onToggle={() => toggleGroup("experience")}>
                    <div className="nk-exp">
                      <input
                        type="range"
                        min={0}
                        max={experienceCeiling}
                        step={1}
                        value={expValue}
                        style={{ "--fill": expFill }}
                        aria-label="Maximum experience"
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setExperienceCap(value <= 0 ? null : value);
                        }}
                      />
                      <span>{expLabel}</span>
                    </div>
                  </FilterSection>
                ) : null}

                {cityOptions.length ? (
                  <FilterSection title={locationTitle} open={openGroups.location} onToggle={() => toggleGroup("location")}>
                    <FilterChecks
                      options={cityOptions}
                      selected={selectedCities}
                      onToggle={(value) => setSelectedCities((list) => toggleValue(list, value))}
                      expanded={showCities}
                      onExpand={() => setShowCities((open) => !open)}
                    />
                  </FilterSection>
                ) : null}

                {sectorOptions.length ? (
                  <FilterSection title={sectorTitle} open={openGroups.sector} onToggle={() => toggleGroup("sector")}>
                    <FilterChecks
                      options={sectorOptions.map((sector) => ({ label: sector.label, value: sector.id, count: sector.count }))}
                      selected={selectedSectors}
                      onToggle={(value) => setSelectedSectors((list) => toggleValue(list, value))}
                      expanded={showSectors}
                      onExpand={() => setShowSectors((open) => !open)}
                    />
                  </FilterSection>
                ) : null}

                {educationOptions.length ? (
                  <FilterSection title="Education" open={openGroups.education} onToggle={() => toggleGroup("education")}>
                    <FilterChecks
                      options={educationOptions}
                      selected={selectedEducation}
                      onToggle={(value) => setSelectedEducation((list) => toggleValue(list, value))}
                      expanded={showEducation}
                      onExpand={() => setShowEducation((open) => !open)}
                    />
                  </FilterSection>
                ) : null}

                {type === "courses" && feeOptions.length ? (
                  <FilterSection title="Course type" open={openGroups.extra} onToggle={() => toggleGroup("extra")}>
                    <FilterChecks
                      options={feeOptions}
                      selected={selectedFees}
                      onToggle={(value) => setSelectedFees((list) => toggleValue(list, value))}
                      expanded
                      onExpand={() => {}}
                    />
                  </FilterSection>
                ) : null}

                {type === "events" && regOptions.length ? (
                  <FilterSection title="Registration" open={openGroups.extra} onToggle={() => toggleGroup("extra")}>
                    <FilterChecks
                      options={regOptions}
                      selected={selectedRegs}
                      onToggle={(value) => setSelectedRegs((list) => toggleValue(list, value))}
                      expanded
                      onExpand={() => {}}
                    />
                  </FilterSection>
                ) : null}
              </aside>

              <div id="nk-results" className="nk-results">
                <div className="nk-results__bar">
                  <div className="nk-tabs">
                    {TYPES.map((item) => {
                      const count = item.id === "jobs" ? jobs.length : item.id === "courses" ? courses.length : events.length;
                      return (
                        <button key={item.id} type="button" className={`nk-tab${type === item.id ? " active" : ""}`} onClick={() => switchType(item.id)}>
                          {item.label}<em>{count}</em>
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" className="nk-filter-toggle" onClick={() => setFiltersOpen(true)}>
                    <SlidersHorizontal size={14} /> Filters
                  </button>
                </div>

                <p className="nk-count">{filtered.length} {noun} <span>found</span></p>
                {chips.length ? (
                  <div className="nk-chips">
                    {chips.map((chip) => (
                      <span className="nk-chip" key={chip.key}>
                        {chip.label}
                        <button type="button" aria-label={`Remove ${chip.label}`} onClick={chip.clear}>&times;</button>
                      </span>
                    ))}
                  </div>
                ) : null}

                {loading ? <p className="nk-status">Loading {noun}…</p> : null}
                {!loading && error ? <p className="nk-status">{error}</p> : null}
                {!loading && !error && !shown.length ? (
                  <div className="nk-empty">
                    <h3>No {noun} found</h3>
                    <p>Try another keyword, location, or filter.</p>
                  </div>
                ) : null}

                {!loading && shown.length ? (
                  <div className={type === "events" ? "events-grid" : "courses-grid"}>
                    {type === "jobs" && shown.map((job) => (
                      <JobCard
                        key={job._id}
                        job={job}
                        thumbUrl={thumbUrl(job)}
                        bucketUrl={bucketUrl}
                        onPlayVideo={setVideoSrc}
                        onShare={shareJob}
                        callbackLabel="Call"
                      />
                    ))}
                    {type === "courses" && shown.map((course) => (
                      <CourseCard
                        key={course._id}
                        course={course}
                        bucketUrl={bucketUrl}
                        onPlayVideo={setVideoSrc}
                        onShare={shareCourse}
                        onRequestCallback={(item) => setCallback((prev) => ({ ...prev, courseName: item.name || "" }))}
                        callbackLabel="Call"
                      />
                    ))}
                    {type === "events" && shown.map((event) => (
                      <EventCard
                        key={event._id}
                        event={event}
                        bucketUrl={bucketUrl}
                        closed={eventClosed(event)}
                        onPlayVideo={setVideoSrc}
                      />
                    ))}
                  </div>
                ) : null}

                {shown.length < filtered.length ? (
                  <button type="button" className="nk-load" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
                    Load more
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className="modal fade event-video-modal" id="videoModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <button type="button" className="event-video-modal__close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
              <div className="modal-body p-0">
                <video key={videoSrc} controls className="w-100">
                  <source src={videoSrc} type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="callbackModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Request for Call Back</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body">
                <form onSubmit={submitCallback}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <input className="form-control" name="name" placeholder="Name" required value={callback.name} onChange={(event) => setCallback({ ...callback, name: event.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <select className="form-control" name="state" required value={callback.state} onChange={(event) => setCallback({ ...callback, state: event.target.value })}>
                        <option value="">State</option>
                        {STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <input className="form-control" name="mobile" placeholder="Mobile" required pattern="[0-9]{10}" value={callback.mobile} onChange={(event) => setCallback({ ...callback, mobile: event.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <input className="form-control" type="email" name="email" placeholder="Email" required value={callback.email} onChange={(event) => setCallback({ ...callback, email: event.target.value })} />
                    </div>
                    <div className="col-12">
                      <textarea className="form-control" name="message" placeholder="Message" required value={callback.message} onChange={(event) => setCallback({ ...callback, message: event.target.value })} />
                    </div>
                  </div>
                  <button className="btn btn-primary mt-3" type="submit">Submit</button>
                  {callbackMessage ? <p className="mt-2 mb-0">{callbackMessage}</p> : null}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FrontLayout>
  );
}

export default Opportunities;
