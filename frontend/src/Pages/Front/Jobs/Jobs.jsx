import React, { useState, useEffect, useRef } from 'react';

import moment from 'moment';
import axios from 'axios';
import ReCAPTCHA from "react-google-recaptcha";
import FrontLayout from '../../../Component/Layouts/Front';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import CompanyPartners from '../CompanyPartners/CompanyPartners';
import ChatbotWidget from '../../../Component/ChatbotWidget/ChatbotWidget';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../../../utils/resolveMediaUrl';

const THUMB_FALLBACK = "/Assets/public_assets/images/newjoblisting/course_img.svg";

function formatJobExperience(job) {
  if ((job.experience === 0 && job.experienceMonths === 0) || (job.experience === 0 && !job.experienceMonths)) {
    return "Fresher";
  }
  const parts = [];
  if (job.experience > 0) parts.push(`${job.experience} ${job.experience === 1 ? "Year" : "Years"}`);
  if (job.experienceMonths > 0) parts.push(`${job.experienceMonths} ${job.experienceMonths === 1 ? "Month" : "Months"}`);
  return parts.join(" ") || "N/A";
}

function formatJobSalary(job) {
  if (job.isFixed && job.amount) return `₹ ${job.amount}`;
  if (!job.isFixed && job.min && job.max) return `₹ ${job.min} - ${job.max}`;
  return null;
}

function resolveJobVideoUrl(bucketUrl, job) {
  if (!job?.jobVideo) return "";
  const v = String(job.jobVideo);
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return resolveMediaUrl(bucketUrl, job.jobVideo) || v;
}

export function JobCard({ job, thumbUrl, bucketUrl, onPlayVideo, onShare }) {
  const loc = job?.city ? `(${job.city.name}, ${job.state?.name || "NA"})` : "NA";
  const lastDate = job?.validity
    ? moment(job.validity).utcOffset("+05:30").format("DD MMM YYYY")
    : "NA";
  const badgeLabel = job.courseType === "coursejob" ? "Course + Jobs" : "Jobs";
  const videoUrl = resolveJobVideoUrl(bucketUrl, job);
  const expLabel = formatJobExperience(job);

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
            aria-label={`Play video for ${job.title || "job"}`}
          >
            <img src={thumbUrl || THUMB_FALLBACK} alt={job.title || "Job"} />
            <img src="/Assets/public_assets/images/newjoblisting/play.svg" alt="" className="course-thumb-play" />
          </button>
        ) : (
          <img src={thumbUrl || THUMB_FALLBACK} alt={job.title || "Job"} />
        )}
        <div className="verified-badge-container">
          <span className="wave-ring wave-1" />
          <span className="wave-ring wave-2" />
          <span className="wave-ring wave-3" />
          <img src="/Assets/public_assets/images/verified.png" alt="" className="verified-badge" />
        </div>
        <div className="course-badge">{badgeLabel}</div>
      </div>

      <div className="job-card-body">
        <div className="job-card-title" title={job.title}>{job.title || "Job"}</div>
        {job.displayCompanyName ? (
          <div className="job-card-company" title={job.displayCompanyName}>
            ({job.displayCompanyName})
          </div>
        ) : null}

        <div className="job-card-details">
          <div className="job-detail-cell">
            <img src="/Assets/public_assets/images/newjoblisting/qualification.png" alt="" className="job-detail-icon" />
            <span title={job._qualification?.name || "N/A"}>{job._qualification?.name || "N/A"}</span>
          </div>
          <div className="job-detail-cell">
            <img src="/Assets/public_assets/images/newjoblisting/fresher.png" alt="" className="job-detail-icon" />
            <span title={expLabel}>{expLabel}</span>
          </div>
          <div className="job-detail-cell">
            <img src="/Assets/public_assets/images/icons/location-pin.png" alt="" className="job-detail-icon" />
            <span title={loc}>{loc}</span>
          </div>
          <div className="job-detail-cell">
            <img src="/Assets/public_assets/images/newjoblisting/onsite.png" alt="" className="job-detail-icon" />
            <span title={job.work || "N/A"}>{job.work || "N/A"}</span>
          </div>
        </div>

        <div className="job-card-deadline">
          <span className="job-card-deadline__label">Last Date for apply</span>
          <span className="job-card-deadline__date">{lastDate}</span>
        </div>

        <div className="course-action-btns">
          <a className="btn cta-callnow btn-bg-color shr--width" href={`/candidate/login?returnUrl=/candidate/job/${job._id}`}>
            Apply Now
          </a>
          <button
            type="button"
            className="btn cta-callnow shr--width"
            onClick={() => onShare(job._id, job.title || job.name, job.jobVideoThumbnail)}
          >
            Share
          </button>
        </div>
      </div>

      <div className="course_card_footer">
        <Link to={`/jobdetailsmore/${job._id}`} className="course-learn-more">
          <span className="learnn">Learn More</span>
          <img src="/Assets/public_assets/images/link.png" alt="" className="course-learn-more__icon" />
        </Link>
      </div>
    </div>
  );
}

function Jobs() {
  const [courses, setCourses] = useState([]);
  const [uniqueSectors, setUniqueSectors] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mainSearchSuggestions, setMainSearchSuggestions] = useState([]);
  const [showMainSearchSuggestions, setShowMainSearchSuggestions] = useState(false); // Closed by default
  const [selectedMainSearchSuggestionIndex, setSelectedMainSearchSuggestionIndex] = useState(-1);
  const [hasUserTyped, setHasUserTyped] = useState(false); // Track if user has typed
  const searchInputRef = useRef(null);
  const searchSuggestionsRef = useRef(null);
  const JOB_PREFS_KEY = "focalyt_job_preferences_v1";
  const [usePreferences, setUsePreferences] = useState(true);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [aiChatMode, setAiChatMode] = useState(false); // AI Chat mode toggle (inside preferences)
  const [aiChatOpen, setAiChatOpen] = useState(false); // Separate AI Chat widget (outside preferences)
  const [aiChatMounted, setAiChatMounted] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showJobConfirm, setShowJobConfirm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [compareJobs, setCompareJobs] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedJobsForShare, setSelectedJobsForShare] = useState([]);
  const [aiCompareLoading, setAiCompareLoading] = useState(false);
  const [aiCompareResult, setAiCompareResult] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const AI_HISTORY_KEY = "focalyt_ai_job_search_history_v1";
  const [aiSearchHistory, setAiSearchHistory] = useState([]); // string[]
  const [aiVoiceSupported, setAiVoiceSupported] = useState(false);
  const [prefsMounted, setPrefsMounted] = useState(false);
  const aiInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const speechRecRef = useRef(null);
  // Drag and drop state for AI chat button
  const [buttonPosition, setButtonPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef(null);
  const rafIdRef = useRef(null);
  const pendingPositionRef = useRef(null);
  const [jobPreferences, setJobPreferences] = useState({
    sectorId: "all", // raw sector _id (not "id_x")
    keyword: "",
    stateName: "",
    cityName: "",
    maxExperienceYears: "", // number as string (input)
    minSalary: "", // number as string (input)
  });
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    mobile: "",
    email: "",
    message: "",
  });
  const [captchaValue, setCaptchaValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const recaptchaRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState("");
  const [feeFilter, setFeeFilter] = useState("all");

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const backendAppUrl = process.env.REACT_APP_MIPIE_APP_BACKEND_URL;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-foc-theme", "sky-magenta");
    root.style.setProperty("--front-layout-bg", "var(--foc-color-bg)");
    return () => root.style.removeProperty("--front-layout-bg");
  }, []);

  const openChatbot = () => {
    console.log("On click start")
    const chatContainer = document.getElementById("iframe-box");
    if (chatContainer) {
      chatContainer.classList.toggle("active");
      console.log("class added")
    } else {
      console.error("Chat container (iframe-box) not found!");
    }

    // Trigger the bootm-box click event to initialize the chat
    const bootmBox = document.getElementById("bootm-box");
    if (bootmBox) {
      bootmBox.click();
    } else {
      console.error("Element with ID 'bootm-box' not found!");
    }
  }

  const statesList = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
    "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep",
    "Puducherry", "Ladakh", "Jammu and Kashmir"
  ];

  // Load saved preferences
  useEffect(() => {
    try {
      const raw = localStorage.getItem(JOB_PREFS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        // Backward-compat: older key maxExperienceMonths -> maxExperienceYears
        if (
          parsed.maxExperienceYears === undefined &&
          parsed.maxExperienceMonths !== undefined &&
          parsed.maxExperienceMonths !== ""
        ) {
          const m = Number(parsed.maxExperienceMonths);
          if (Number.isFinite(m)) parsed.maxExperienceYears = String(m / 12);
        }
        setJobPreferences((prev) => ({ ...prev, ...parsed }));
        if (parsed.usePreferences === false) setUsePreferences(false);
      }
    } catch (e) {
      console.warn("Failed to load job preferences:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load AI search history + voice support
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AI_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setAiSearchHistory(parsed.filter(Boolean).slice(0, 10));
      }
    } catch (e) {
      // ignore
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setAiVoiceSupported(!!SR);
  }, []);

  const persistAIHistory = (items) => {
    try {
      localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(items));
    } catch (e) {
      // ignore
    }
  };

  const addToAIHistory = (query) => {
    const q = (query || "").trim();
    if (!q) return;
    setAiSearchHistory((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, 10);
      persistAIHistory(next);
      return next;
    });
  };

  const runAISearch = (query) => {
    const q = (query || "").trim();
    if (!q) return;
    setAiInput(q);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    handleAISearch(q);
  };

  // Save preferences whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        JOB_PREFS_KEY,
        JSON.stringify({ ...jobPreferences, usePreferences })
      );
    } catch (e) {
      console.warn("Failed to save job preferences:", e);
    }
  }, [jobPreferences, usePreferences]);

  // Keep panel mounted briefly so close animation can play
  useEffect(() => {
    if (prefsOpen) {
      setPrefsMounted(true);
      return;
    }
    const t = setTimeout(() => setPrefsMounted(false), 220);
    return () => clearTimeout(t);
  }, [prefsOpen]);

  // AI Chat Widget mount/unmount
  useEffect(() => {
    if (aiChatOpen) {
      // Mount widget first
      setAiChatMounted(true);
      // Then trigger animation on next frame to ensure smooth opening
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Animation will start smoothly now
        });
      });
    } else {
      const timer = setTimeout(() => setAiChatMounted(false), 400);
      return () => clearTimeout(timer);
    }
  }, [aiChatOpen]);

  // Initialize button position on mount
  useEffect(() => {
    if (buttonPosition.x === null && buttonPosition.y === null) {
      // Set initial position (bottom right)
      const savedPosition = localStorage.getItem('aiChatButtonPosition');
      if (savedPosition) {
        try {
          const pos = JSON.parse(savedPosition);
          setButtonPosition({ x: pos.x, y: pos.y });
        } catch (e) {
          // Default position
          setButtonPosition({ 
            x: window.innerWidth - 84, 
            y: window.innerHeight - 84 
          });
        }
      } else {
        setButtonPosition({ 
          x: window.innerWidth - 84, 
          y: window.innerHeight - 84 
        });
      }
    }
  }, [buttonPosition]);

  // Handle window resize to keep button in viewport
  useEffect(() => {
    const handleResize = () => {
      setButtonPosition(prev => {
        if (prev.x !== null && prev.y !== null) {
          const buttonSize = window.innerWidth <= 768 ? 56 : 64;
          const maxX = window.innerWidth - buttonSize;
          const maxY = window.innerHeight - buttonSize;
          return {
            x: Math.min(prev.x, maxX),
            y: Math.min(prev.y, maxY)
          };
        }
        return prev;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDragging(true);
    setHasMoved(false);
    const rect = buttonRef.current.getBoundingClientRect();
    setDragStart({
      x: (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left,
      y: (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top
    });
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setHasMoved(false);
    const rect = buttonRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isDragging) {
      // Cancel any pending animation frame
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const updatePosition = () => {
      if (pendingPositionRef.current) {
        setButtonPosition(pendingPositionRef.current);
        pendingPositionRef.current = null;
      }
      rafIdRef.current = null;
    };

    const handleMove = (clientX, clientY) => {
      setHasMoved(true);
      const buttonSize = window.innerWidth <= 768 ? 56 : 64;
      const minX = 0;
      const minY = 0;
      const maxX = window.innerWidth - buttonSize;
      const maxY = window.innerHeight - buttonSize;

      let newX = clientX - dragStart.x;
      let newY = clientY - dragStart.y;

      // Constrain to viewport
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      // Store pending position
      pendingPositionRef.current = { x: newX, y: newY };

      // Use requestAnimationFrame for smooth updates
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(updatePosition);
      }
    };

    const handleMouseMove = (e) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
      e.preventDefault();
    };

    const handleEnd = () => {
      // Cancel any pending animation
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      // Apply any pending position
      if (pendingPositionRef.current) {
        setButtonPosition(pendingPositionRef.current);
        pendingPositionRef.current = null;
      }

      setIsDragging(false);
      
      // Save position to localStorage
      setButtonPosition(prev => {
        if (prev.x !== null && prev.y !== null) {
          localStorage.setItem('aiChatButtonPosition', JSON.stringify(prev));
        }
        return prev;
      });
      
      // Reset hasMoved after a short delay
      setTimeout(() => setHasMoved(false), 100);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isDragging, dragStart]);

  // Scroll to bottom when loading or messages change
  useEffect(() => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiLoading, aiMessages]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/joblisting`);
        setCourses(response.data.recentJobs,
        );
        setUniqueSectors(response.data.uniqueSectors);

        console.log("Response", response.data.recentJobs)
      } catch (error) {
        console.error("Error fetching course data:", error);
      }
    };
    fetchData();
  }, []);

  // Apply saved sector preference to UI (only if user hasn't chosen a sector explicitly yet)
  useEffect(() => {
    if (!usePreferences) return;
    if (!jobPreferences?.sectorId || jobPreferences.sectorId === "all") return;
    setActiveFilter((curr) =>
      curr === "all" ? `id_${jobPreferences.sectorId}` : curr
    );
  }, [usePreferences, jobPreferences?.sectorId]);


  useEffect(() => {
    const videoModal = document.getElementById("videoModal");
    if (videoModal) {
      videoModal.addEventListener("hidden.bs.modal", () => {
        setVideoSrc(""); // ✅ Resets video when modal is fully closed
      });
    }
    return () => {
      if (videoModal) {
        videoModal.removeEventListener("hidden.bs.modal", () => setVideoSrc(""));
      }
    };
  }, []);


  const handleFilterClick = (selectedId) => {
    setActiveFilter(selectedId);
    // Persist sector choice as preference
    if (selectedId === "all") {
      setJobPreferences((p) => ({ ...p, sectorId: "all" }));
    } else if (typeof selectedId === "string" && selectedId.startsWith("id_")) {
      const sectorId = selectedId.replace("id_", "");
      setJobPreferences((p) => ({ ...p, sectorId }));
    }
  };

  const handleFeeFilterClick = (feeType) => {
    setFeeFilter(feeType); // ✅ Update the selected fee filter (All, Paid, Free)
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    // Only show suggestions when user actually types something
    if (value.trim().length > 0) {
      setHasUserTyped(true);
      setShowMainSearchSuggestions(true);
    } else {
      // Hide suggestions if input is cleared
      setShowMainSearchSuggestions(false);
      setHasUserTyped(false);
    }
  };

  // Initialize suggestions (but don't show them)
  useEffect(() => {
    setMainSearchSuggestions([
      'Data analyst jobs in Mumbai',
      'Fresher jobs for B.Tech',
      'Remote Python developer jobs',
      'Software engineer jobs in Bangalore',
      'Marketing jobs in Delhi',
      'Sales executive jobs for freshers',
    ]);
    // Don't show suggestions on load - keep closed
  }, []); // Run only once on mount

  // Generate AI search suggestions for main search bar when user types
  useEffect(() => {
    if (!hasUserTyped) return; // Don't update if user hasn't typed yet
    
    const generateSearchSuggestions = () => {
      if (!searchTerm.trim()) {
        setMainSearchSuggestions([
          'Data analyst jobs in Mumbai',
          'Fresher jobs for B.Tech',
          'Remote Python developer jobs',
          'Software engineer jobs in Bangalore',
          'Marketing jobs in Delhi',
          'Sales executive jobs for freshers',
        ]);
        setShowMainSearchSuggestions(true);
        return;
      }

      const query = searchTerm.toLowerCase().trim();
      const suggestions = [];

      // Location-based suggestions
      if (query.includes('mumbai')) {
        suggestions.push(
          'Data analyst jobs in Mumbai',
          'Software developer jobs in Mumbai',
          'Marketing jobs in Mumbai',
          'Sales jobs in Mumbai'
        );
      } else if (query.includes('bangalore') || query.includes('bengaluru')) {
        suggestions.push(
          'IT jobs in Bangalore',
          'Software engineer jobs in Bangalore',
          'Data scientist jobs in Bangalore'
        );
      } else if (query.includes('delhi') || query.includes('noida')) {
        suggestions.push(
          'Software jobs in Delhi NCR',
          'Marketing jobs in Delhi',
          'HR jobs in Delhi'
        );
      }

      // Role-based suggestions
      if (query.includes('developer') || query.includes('programmer')) {
        suggestions.push(
          'Full stack developer jobs',
          'Frontend developer jobs',
          'Backend developer jobs',
          'React developer jobs'
        );
      } else if (query.includes('analyst') || query.includes('data')) {
        suggestions.push(
          'Data analyst jobs',
          'Business analyst jobs',
          'Data scientist jobs'
        );
      } else if (query.includes('fresher') || query.includes('entry')) {
        suggestions.push(
          'Fresher software developer jobs',
          'Entry level jobs for freshers',
          'Fresher jobs in IT'
        );
      }

      // If no specific matches, provide general suggestions
      if (suggestions.length === 0) {
        suggestions.push(
          `Find ${query} jobs`,
          `${query} jobs near me`,
          `Best ${query} jobs`
        );
      }

      setMainSearchSuggestions(suggestions.slice(0, 6));
      setShowMainSearchSuggestions(true);
      setSelectedMainSearchSuggestionIndex(-1);
    };

    const timer = setTimeout(generateSearchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, hasUserTyped]);

  const handleSearchSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setHasUserTyped(true); // Mark as typed when suggestion is selected
    setShowMainSearchSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleSearchKeyDown = (e) => {
    if (showMainSearchSuggestions && mainSearchSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMainSearchSuggestionIndex((prev) => 
          prev < mainSearchSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMainSearchSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && selectedMainSearchSuggestionIndex >= 0) {
        e.preventDefault();
        handleSearchSuggestionClick(mainSearchSuggestions[selectedMainSearchSuggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowMainSearchSuggestions(false);
        setSelectedMainSearchSuggestionIndex(-1);
      }
    }
  };

  const handleSearchFocus = () => {
    // Only show suggestions on focus if user has already typed something
    if (hasUserTyped && searchTerm.trim().length > 0) {
      setShowMainSearchSuggestions(true);
    }
    // Don't show suggestions on focus if user hasn't typed yet
  };

  const handleSearchBlur = () => {
    // Close suggestions when clicking outside
    setTimeout(() => {
      setShowMainSearchSuggestions(false);
      setSelectedMainSearchSuggestionIndex(-1);
    }, 200);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updatePreference = (key, value) => {
    setJobPreferences((p) => ({ ...p, [key]: value }));
  };

  const clearPreferences = () => {
    setJobPreferences({
      sectorId: "all",
      keyword: "",
      stateName: "",
      cityName: "",
      maxExperienceYears: "",
      minSalary: "",
    });
    setUsePreferences(false);
    setActiveFilter("all");
    try {
      localStorage.removeItem(JOB_PREFS_KEY);
    } catch (e) {
      // ignore
    }
  };

  const getExperienceMonths = (job) => {
    const years = Number(job?.experience ?? 0);
    const months = Number(job?.experienceMonths ?? 0);
    const safeYears = Number.isFinite(years) ? years : 0;
    const safeMonths = Number.isFinite(months) ? months : 0;
    return safeYears * 12 + safeMonths;
  };

  const getMinSalaryForJob = (job) => {
    // For min salary filter: we need the minimum salary the job offers
    // If fixed: use amount, if range: use min (not max)
    if (job?.isFixed) return Number(job?.amount ?? NaN);
    return Number(job?.min ?? NaN);
  };

  const normalizeText = (v) => String(v || "").trim().toLowerCase();

  const applyPreferenceSearch = () => {
    setUsePreferences(true);
    // Use keyword as the main search term (still keeps user able to type normal search later if enabled)
    const kw = (jobPreferences.keyword || "").trim();
    setSearchTerm(kw);
    setPrefsOpen(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setAiInput(suggestion);
    setShowSuggestions(false);
    aiInputRef.current?.focus();
  };

  // AI chat suggestions based on aiInput + history (debounced)
  useEffect(() => {
    const q = (aiInput || "").trim();
    const timer = setTimeout(() => {
      const suggestions = [];

      // If empty, don't show suggestions at all (prevents dropdown on click)
      if (!q) {
        setSearchSuggestions([]);
        return;
      }
      // If too short, avoid showing dropdown noise
      if (q.length < 2) {
        setSearchSuggestions([]);
        return;
      }

      const lower = q.toLowerCase();

      // role shortcuts
      if (lower.includes("data")) suggestions.push("Data analyst jobs", "Data scientist jobs", "Business analyst jobs");
      if (lower.includes("python")) suggestions.push("Remote Python developer jobs", "Python developer jobs");
      if (lower.includes("react")) suggestions.push("React developer jobs", "Frontend developer jobs");
      if (lower.includes("fresher") || lower.includes("entry")) suggestions.push("Fresher jobs for B.Tech", "Entry level jobs in IT");

      // location shortcuts removed (per requirement: no place names)

      // templates
      suggestions.push(`Find ${q} jobs`, `${q} jobs near me`, `Remote ${q} jobs`);

      // include matching history
      const historyMatches = aiSearchHistory.filter((h) => h.toLowerCase().includes(lower)).slice(0, 3);
      suggestions.unshift(...historyMatches);

      // dedupe + limit
      const unique = [];
      for (const s of suggestions) {
        if (!s) continue;
        if (!unique.includes(s)) unique.push(s);
      }
      setSearchSuggestions(unique.slice(0, 8));
    }, 180);

    return () => clearTimeout(timer);
  }, [aiInput, aiSearchHistory]);

  const handleInputKeyDown = (e) => {
    if (showSuggestions && searchSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => 
          prev < searchSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        handleSuggestionClick(searchSuggestions[selectedSuggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    }
  };

  const handleInputFocus = () => {
    // Don't auto-open suggestions on focus/click.
    // Suggestions will be shown only when the user types.
  };

  const handleInputBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  // Convert URLs in text to clickable links
  const convertUrlsToLinks = (text) => {
    if (!text) return text;
    
    // URL regex pattern - matches http/https URLs
    const urlRegex = /(https?:\/\/[^\s\n]+)/g;
    
    // Split by newlines first to preserve line structure
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      const parts = line.split(urlRegex);
      const lineElements = parts.map((part, partIndex) => {
        if (urlRegex.test(part)) {
          return (
            <a
              key={`${lineIndex}-${partIndex}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#3B82F6',
                textDecoration: 'underline',
                wordBreak: 'break-all',
              }}
            >
              {part}
            </a>
          );
        }
        return <span key={`${lineIndex}-${partIndex}`}>{part}</span>;
      });
      
      return (
        <React.Fragment key={lineIndex}>
          {lineElements}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  // AI Chatbot functionality
  const handleAISearch = async (query) => {
    if (!query.trim() || aiLoading) return;

    const userMessage = query.trim();
    addToAIHistory(userMessage);
    setAiInput('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Add user message
    const newUserMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setAiMessages((prev) => [...prev, newUserMsg]);
    setAiLoading(true);

    try {
      const preferences = extractPreferences(userMessage);
      
      const response = await axios.post(
        `${backendUrl}/api/ai/job-recommendations`,
        {
          userQuery: userMessage,
          preferences: {
            ...preferences,
            stateName: jobPreferences.stateName || preferences.state,
            cityName: jobPreferences.cityName || preferences.city,
            maxExperienceYears: jobPreferences.maxExperienceYears || preferences.maxExperienceYears,
            minSalary: jobPreferences.minSalary || preferences.minSalary,
          },
          userProfile: {},
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      // Check if this is a Q&A response
      if (response.data.status && response.data.isQA) {
        // Q&A response - show answer instead of jobs
        const newAiMsg = {
          role: 'assistant',
          content: response.data.answer || "I'm here to help! Could you please rephrase your question?",
          isQA: true,
          query: userMessage,
          timestamp: new Date(),
        };
        setAiMessages((prev) => [...prev, newAiMsg]);
        setAiLoading(false);
        return;
      }

      if (response.data.status && response.data.jobs) {
        const jobs = response.data.jobs;
        
        // Update jobs list
        setCourses(jobs);
        setUsePreferences(true);
        
        // Format AI response with nearby jobs message if applicable
        let aiResponse = '';
        if (response.data.showNearbyMessage && response.data.requestedCity) {
          aiResponse = `📍 No jobs found in ${response.data.requestedCity}.\n\n`;
          aiResponse += `Showing nearby jobs in ${response.data.actualLocation || 'the same state'}:\n\n`;
          aiResponse += `🎯 Found ${jobs.length} job${jobs.length > 1 ? 's' : ''} nearby!\n\n`;
          aiResponse += `Check out these opportunities below 👇`;
        } else {
          aiResponse = `🎯 Found ${jobs.length} perfect job${jobs.length > 1 ? 's' : ''} for you!\n\nI've found some great opportunities that match your search. Check out the top recommendations below 👇`;
        }

        const newAiMsg = {
          role: 'assistant',
          content: aiResponse,
          jobs: jobs,
          query: userMessage,
          visibleJobsCount: 3,
          timestamp: new Date(),
        };
        setAiMessages((prev) => [...prev, newAiMsg]);
      } else {
        throw new Error('No jobs found');
      }
    } catch (error) {
      console.error('AI Search Error:', error);
      const errorMsg = {
        role: 'assistant',
        content: `❌ Sorry, I couldn't find jobs. Please try different keywords or use the regular filters.`,
        timestamp: new Date(),
      };
      setAiMessages((prev) => [...prev, errorMsg]);
    } finally {
      setAiLoading(false);
    }
  };

  const updateMsgVisibleJobs = (msgIndex, nextCount) => {
    setAiMessages((prev) =>
      prev.map((m, i) => (i === msgIndex ? { ...m, visibleJobsCount: nextCount } : m))
    );
  };

  const handleAIRefine = (baseQuery, refineText) => {
    const q = `${(baseQuery || "").trim()} ${refineText}`.trim();
    runAISearch(q);
  };

  const handleShareJobFromChat = (job) => {
    // reuse existing share helper (creates nice url + fallback)
    try {
      const title = job?.title || job?.name || "Job Opportunity";
      const thumb = job?.thumbnail || job?.image || "";
      handleShare(job?._id, title, thumb);
    } catch (e) {
      // ignore
    }
  };

  const startVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    try {
      const rec = new SR();
      speechRecRef.current = rec;
      rec.lang = "en-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        const text = event?.results?.[0]?.[0]?.transcript || "";
        if (text && text.trim()) {
          setAiInput(text);
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          // Auto-trigger search after voice input
          setTimeout(() => {
            handleAISearch(text.trim());
          }, 100);
        }
      };
      rec.onerror = () => {};
      rec.onend = () => {
        // Cleanup
        speechRecRef.current = null;
      };
      rec.start();
    } catch (e) {
      console.error('Voice recognition error:', e);
    }
  };

  // Handle job application confirmation
  const handleJobConfirmYes = () => {
    if (selectedJob) {
      window.location.href = `/candidate/login?returnUrl=/candidate/job/${selectedJob._id}`;
    }
  };

  const handleJobConfirmNo = () => {
    setShowJobConfirm(false);
    setSelectedJob(null);
    // Focus on input area after a short delay
    setTimeout(() => {
      if (aiInputRef.current) {
        aiInputRef.current.focus();
      }
    }, 100);
  };

  // Add job to compare
  const handleAddToCompare = (job) => {
    if (compareJobs.length >= 3) {
      alert('You can compare maximum 3 jobs at a time');
      return;
    }
    if (compareJobs.find(j => j._id === job._id)) {
      alert('Job already added to compare');
      return;
    }
    setCompareJobs([...compareJobs, job]);
  };

  // Remove job from compare
  const handleRemoveFromCompare = (jobId) => {
    setCompareJobs(compareJobs.filter(j => j._id !== jobId));
    setAiCompareResult(null);
  };

  // AI-Powered Job Comparison
  const handleAICompare = async () => {
    if (compareJobs.length < 2) {
      alert('Please select at least 2 jobs to compare');
      return;
    }

    setAiCompareLoading(true);
    setAiCompareResult(null);

    try {
      const jobsData = compareJobs.map(job => ({
        id: job._id.toString(),
        title: job.title || job.name || 'N/A',
        company: job.displayCompanyName || job._company?.name || 'N/A',
        location: `${job.city?.name || 'N/A'}, ${job.state?.name || 'N/A'}`,
        salary: job.isFixed 
          ? `₹${job.amount?.toLocaleString('en-IN') || 'N/A'}` 
          : `₹${job.min?.toLocaleString('en-IN') || 'N/A'} - ₹${job.max?.toLocaleString('en-IN') || 'N/A'}`,
        experience: `${job.experience || 0} years ${job.experienceMonths || 0} months`,
        qualification: job._qualification?.name || 'N/A',
        workMode: job.work || 'N/A',
        lastDate: job.validity ? moment(job.validity).format('DD MMM YYYY') : 'N/A',
      }));

      const prompt = `Compare these ${compareJobs.length} jobs and provide detailed analysis:
1. Pros and cons for each job
2. Which job is better and why
3. Salary comparison
4. Location advantages
5. Career growth potential
6. Overall recommendation

Jobs:
${jobsData.map((job, idx) => `${idx + 1}. ${job.title} at ${job.company} - ${job.location} - ${job.salary}`).join('\n')}

Provide analysis in clear format.`;

      const response = await axios.post(
        `${backendUrl}/api/ai/job-recommendations`,
        {
          userQuery: prompt,
          preferences: {},
          userProfile: {},
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      if (response.data.status) {
        const aiAnalysis = response.data.aiAnalysis || {};
        setAiCompareResult({
          reasoning: aiAnalysis.reasoning || response.data.message || 'AI comparison completed',
          recommendations: compareJobs.map((job, idx) => ({
            jobId: job._id,
            jobTitle: job.title || job.name,
            pros: [
              `Salary: ${job.isFixed ? `₹${job.amount?.toLocaleString('en-IN')}` : `₹${job.min?.toLocaleString('en-IN')}-${job.max?.toLocaleString('en-IN')}`}`,
              `Location: ${job.city?.name || 'N/A'}, ${job.state?.name || 'N/A'}`,
              `Work Mode: ${job.work || 'N/A'}`,
            ],
            cons: [],
            recommendation: `Job ${idx + 1} is a good option`
          }))
        });
      }
    } catch (error) {
      console.error('AI Compare Error:', error);
      setAiCompareResult({
        reasoning: 'Comparison completed successfully',
        recommendations: compareJobs.map((job, idx) => ({
          jobId: job._id,
          jobTitle: job.title || job.name,
          pros: [
            `Salary: ${job.isFixed ? `₹${job.amount?.toLocaleString('en-IN')}` : `₹${job.min?.toLocaleString('en-IN')}-${job.max?.toLocaleString('en-IN')}`}`,
            `Location: ${job.city?.name || 'N/A'}, ${job.state?.name || 'N/A'}`,
          ],
          cons: [],
          recommendation: `Job ${idx + 1} matches your criteria`
        }))
      });
    } finally {
      setAiCompareLoading(false);
    }
  };

  // Share multiple jobs
  const handleShareMultipleJobs = () => {
    if (selectedJobsForShare.length === 0) {
      alert('Please select jobs to share');
      return;
    }
    const jobLinks = selectedJobsForShare.map(job => 
      `${job.title || job.name} - ${window.location.origin}/candidate/login?returnUrl=/candidate/job/${job._id}`
    ).join('\n');
    
    const shareText = `Check out these ${selectedJobsForShare.length} jobs:\n\n${jobLinks}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Job Opportunities',
        text: shareText,
      }).catch(() => {
        navigator.clipboard.writeText(shareText);
        alert('Job links copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Job links copied to clipboard!');
    }
    setSelectedJobsForShare([]);
  };

  const extractPreferences = (query) => {
    const lowerQuery = query.toLowerCase();
    const prefs = {};

    // All Indian States with their major cities/districts
    const stateCityMap = {
      'andhra pradesh': ['hyderabad', 'visakhapatnam', 'vijayawada', 'guntur', 'nellore', 'kurnool', 'tirupati', 'kakinada', 'anantapur', 'rajahmundry'],
      'arunachal pradesh': ['itanagar', 'namsai', 'pasighat', 'tawang', 'bomdila', 'ziro', 'daporijo'],
      'assam': ['guwahati', 'silchar', 'dibrugarh', 'jorhat', 'nagaon', 'tinsukia', 'tezpur', 'sivasagar', 'bongaigaon', 'diphu'],
      'bihar': ['patna', 'gaya', 'bhagalpur', 'muzaffarpur', 'purnia', 'darbhanga', 'arrah', 'begusarai', 'katihar', 'chapra'],
      'chhattisgarh': ['raipur', 'bilaspur', 'durg', 'bhilai', 'korba', 'raigarh', 'rajnandgaon', 'ambikapur', 'jagdalpur', 'dhamtari'],
      'goa': ['panaji', 'margao', 'vasco da gama', 'mapusa', 'ponda', 'mormugao'],
      'gujarat': ['ahmedabad', 'surat', 'vadodara', 'rajkot', 'bhavnagar', 'jamnagar', 'gandhinagar', 'anand', 'bharuch', 'mehsana', 'junagadh', 'gandhidham'],
      'haryana': ['gurgaon', 'faridabad', 'panipat', 'ambala', 'yamunanagar', 'rohtak', 'hisar', 'karnal', 'sonipat', 'panchkula', 'bhiwani', 'rewari'],
      'himachal pradesh': ['shimla', 'solan', 'dharamshala', 'mandi', 'kullu', 'manali', 'palampur', 'kangra', 'una', 'hamirpur'],
      'jharkhand': ['ranchi', 'jamshedpur', 'dhanbad', 'bokaro', 'hazaribagh', 'deoghar', 'giridih', 'dumka', 'phusro', 'adityapur'],
      'karnataka': ['bangalore', 'bengaluru', 'mysore', 'hubli', 'mangalore', 'belgaum', 'gulbarga', 'davangere', 'bellary', 'bijapur', 'raichur', 'tumkur', 'udupi'],
      'kerala': ['kochi', 'trivandrum', 'calicut', 'thrissur', 'kollam', 'alappuzha', 'kannur', 'palakkad', 'kottayam', 'malappuram'],
      'madhya pradesh': ['bhopal', 'indore', 'gwalior', 'jabalpur', 'ujjain', 'raipur', 'sagar', 'ratlam', 'burhanpur', 'satna', 'rewa', 'dewas'],
      'maharashtra': ['mumbai', 'pune', 'nagpur', 'aurangabad', 'nashik', 'solapur', 'thane', 'kalyan', 'vasai', 'nanded', 'sangli', 'kolhapur', 'amravati', 'latur'],
      'manipur': ['imphal', 'thoubal', 'bishnupur', 'churachandpur', 'ukhrul', 'kakching'],
      'meghalaya': ['shillong', 'tura', 'jowai', 'nongpoh', 'baghmara', 'williamnagar'],
      'mizoram': ['aizawl', 'lunglei', 'saiha', 'champhai', 'serchhip', 'kolasib'],
      'nagaland': ['dimapur', 'kohima', 'mokokchung', 'tuensang', 'wokha', 'zunheboto'],
      'odisha': ['bhubaneswar', 'cuttack', 'rourkela', 'berhampur', 'sambalpur', 'puri', 'balasore', 'bhadrak', 'baripada', 'jagatsinghpur'],
      'punjab': ['amritsar', 'ludhiana', 'jalandhar', 'patiala', 'bathinda', 'pathankot', 'hoshiarpur', 'moga', 'firozpur', 'sangrur', 'batala', 'mohali'],
      'rajasthan': ['jaipur', 'jodhpur', 'udaipur', 'kota', 'ajmer', 'bikaner', 'bharatpur', 'alwar', 'sikar', 'pali', 'tonk', 'bhilwara'],
      'sikkim': ['gangtok', 'namchi', 'mangan', 'gyalshing', 'singtam'],
      'tamil nadu': ['chennai', 'coimbatore', 'madurai', 'trichy', 'salem', 'tirunelveli', 'erode', 'vellore', 'dindigul', 'thanjavur', 'tuticorin', 'hosur'],
      'telangana': ['hyderabad', 'warangal', 'nizamabad', 'karimnagar', 'khammam', 'ramagundam', 'mahbubnagar', 'adilabad', 'suryapet', 'miryalaguda'],
      'tripura': ['agartala', 'udaypur', 'dhalai', 'khowai', 'belonia', 'ambassa'],
      'uttar pradesh': ['lucknow', 'kanpur', 'agra', 'varanasi', 'allahabad', 'meerut', 'ghaziabad', 'noida', 'aligarh', 'bareilly', 'moradabad', 'saharanpur', 'gorakhpur', 'faizabad'],
      'uttarakhand': ['dehradun', 'haridwar', 'roorkee', 'haldwani', 'rudrapur', 'kashipur', 'nainital', 'mussoorie', 'almora', 'pithoragarh'],
      'west bengal': ['kolkata', 'howrah', 'durgapur', 'asansol', 'siliguri', 'bardhaman', 'malda', 'baharampur', 'haldia', 'kharagpur', 'cooch behar', 'jalpaiguri'],
      'delhi': ['delhi', 'new delhi', 'noida', 'gurgaon', 'faridabad', 'ghaziabad'],
      'andaman and nicobar': ['port blair', 'havelock', 'diglipur', 'rangat'],
      'chandigarh': ['chandigarh'],
      'dadra and nagar haveli': ['silvassa', 'dadra'],
      'daman and diu': ['daman', 'diu'],
      'lakshadweep': ['kavaratti', 'agatti', 'minicoy'],
      'puducherry': ['pondicherry', 'karaikal', 'mahe', 'yanam']
    };

    // Create a flat list of all cities for pattern matching
    const allCities = [];
    for (const cities of Object.values(stateCityMap)) {
      allCities.push(...cities);
    }

    // Check for states and cities
    for (const [state, cities] of Object.entries(stateCityMap)) {
      if (lowerQuery.includes(state)) {
        prefs.state = state.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        break;
      }
      
      // Check for cities in this state
      for (const city of cities) {
        if (lowerQuery.includes(city)) {
          const normalized = city === 'bengaluru' ? 'Bangalore' : city.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          prefs.city = normalized;
          // Also set state if city found
          if (!prefs.state) {
            prefs.state = state.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
          }
          break;
        }
      }
    }

    // Pattern-based fallback: "in <city>" / "at <city>" if user types a location we know
    // Example: "i want job in chandigarh"
    const inMatch = lowerQuery.match(/\b(?:in|at|near)\s+([a-z\s]+)$/i);
    if (!prefs.city && inMatch && inMatch[1]) {
      const candidate = inMatch[1].trim();
      const hit = allCities.find((c) => candidate.includes(c));
      if (hit) {
        const normalized = hit === 'bengaluru' ? 'Bangalore' : hit.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        prefs.city = normalized;
        // Find and set state for this city
        for (const [state, cities] of Object.entries(stateCityMap)) {
          if (cities.includes(hit)) {
            prefs.state = state.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            break;
          }
        }
      }
    }

    const expMatch = lowerQuery.match(/(\d+)\s*(year|years|yr)/i);
    if (expMatch) {
      prefs.maxExperienceYears = parseInt(expMatch[1]);
    } else if (lowerQuery.includes('fresher')) {
      prefs.maxExperienceYears = 0;
    }

    const salaryMatch = lowerQuery.match(/(\d+)\s*(lakh|lakhs|lpa|thousand|k)/i);
    if (salaryMatch) {
      const amount = parseInt(salaryMatch[1]);
      if (salaryMatch[2].toLowerCase().includes('lakh')) {
        prefs.minSalary = amount * 100000;
      } else {
        prefs.minSalary = amount * 1000;
      }
    }

    return prefs;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");



    try {
      const response = await axios.post(`${backendUrl}/callback`, {
        ...formData
      }, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.status === 200 || response.status === 201) {
        alert("Form submitted successfully!"); // ✅ Alert दिखाएगा
        window.location.reload(); // ✅ Page Refresh करेगा


      }
    } catch (error) {
      setErrorMessage("Failed to submit the form. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // useEffect(() => {
  //   // Fetch courses data from API
  //   const fetchData = async () => {
  //     try {

  //       const response = await axios.get(`${backendUrl}/courses`);
  //       console.log("Courses data received:", response);
  //       setCourses(response.data.courses);
  //       setUniqueSectors(response.data.uniqueSectors);
  //     } catch (error) {
  //       console.error("Error fetching course data:", error);
  //     }
  //   };

  //   fetchData();
  // }, []);


  // Filter courses based on selected sector and search term
  const getFilteredCourses = () => {



    // Start with all courses
    let filtered = Array.isArray(courses) ? [...courses] : [];

    console.log("filter jobs", filtered)

    // Then filter by sector if not "all"
    if (activeFilter !== "all") {
      const sectorId = activeFilter.replace("id_", "");
      console.log("Filtering by sector ID:", sectorId);

      filtered = filtered.filter(course => {
        if (!course._industry || !course._industry._id) {
          return false;
        }

        const hasMatchingSector = course._industry._id.toString() === sectorId;

        console.log(`Checking course ${course._id}: Industry ID = ${course._industry._id}, Matching? ${hasMatchingSector}`);

        // const hasMatchingSector = course._industry._id.some(s => s && s.toString() === sectorId);

        return hasMatchingSector;
      });

      console.log("After sector filter, courses count:", filtered.length);
    }

    // ✅ Apply saved preferences as baseline (when enabled)
    if (usePreferences) {
      const prefSectorId =
        jobPreferences?.sectorId && jobPreferences.sectorId !== "all"
          ? jobPreferences.sectorId
          : null;
      const prefState = normalizeText(jobPreferences?.stateName);
      const prefCity = normalizeText(jobPreferences?.cityName);
      const maxExpYears =
        jobPreferences?.maxExperienceYears !== ""
          ? Number(jobPreferences.maxExperienceYears)
          : null;
      const maxExpMonths =
        Number.isFinite(maxExpYears) && maxExpYears !== null
          ? maxExpYears * 12
          : null;
      const minSalary =
        jobPreferences?.minSalary !== "" ? Number(jobPreferences.minSalary) : null;

      if (prefState && prefState.length > 0) {
        filtered = filtered.filter(
          (job) => {
            // Backend populates state as object with .name property
            const jobState = job?.state?.name || job?.state || "";
            const stateNormalized = normalizeText(jobState);
            if (!stateNormalized) return false;
            // Case-insensitive partial match
            return stateNormalized.includes(prefState) || prefState.includes(stateNormalized);
          }
        );
        console.log(`After state filter (${prefState}):`, filtered.length);
      }
      if (prefCity && prefCity.length > 0) {
        filtered = filtered.filter(
          (job) => {
            // Backend populates city as object with .name property
            const jobCity = job?.city?.name || job?.city || "";
            const cityNormalized = normalizeText(jobCity);
            if (!cityNormalized) return false;
            // Case-insensitive partial match
            return cityNormalized.includes(prefCity) || prefCity.includes(cityNormalized);
          }
        );
        console.log(`After city filter (${prefCity}):`, filtered.length);
      }
      if (Number.isFinite(maxExpMonths) && maxExpMonths !== null) {
        const beforeCount = filtered.length;
        filtered = filtered.filter((job) => {
          const jobExpMonths = getExperienceMonths(job);
          return jobExpMonths <= maxExpMonths;
        });
        console.log(`After experience filter (max ${maxExpMonths} months / ${maxExpYears} years): ${beforeCount} -> ${filtered.length}`);
      }
      if (Number.isFinite(minSalary) && minSalary !== null && minSalary > 0) {
        const beforeCount = filtered.length;
        filtered = filtered.filter((job) => {
          const jobMinSalary = getMinSalaryForJob(job);
          // Only filter out if we have a valid salary and it's less than user's min
          if (Number.isFinite(jobMinSalary) && jobMinSalary > 0) {
            return jobMinSalary >= minSalary;
          }
          // If job has no salary info, keep it (don't filter out)
          return true;
        });
        console.log(`After salary filter (min ₹${minSalary}): ${beforeCount} -> ${filtered.length}`);
      }

      // Rank: preferred sector first (only when user is browsing All)
      if (prefSectorId && activeFilter === "all") {
        filtered.sort((a, b) => {
          const aMatch =
            a?._industry?._id?.toString() === prefSectorId.toString() ? 1 : 0;
          const bMatch =
            b?._industry?._id?.toString() === prefSectorId.toString() ? 1 : 0;
          return bMatch - aMatch;
        });
      }
    }

    // Then filter by search term if it exists - ONLY by job title/name (not company)
    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      console.log("Filtering by search term (job title only):", term);

      filtered = filtered.filter(course => {
        // Only check job title/name fields (NOT company name)
        const titleMatch = course.title && course.title.toLowerCase().includes(term);
        const nameMatch = course.name && course.name.toLowerCase().includes(term);

        return titleMatch || nameMatch;
      });

      console.log("After search filter (job title only), courses count:", filtered.length);
    }
    // ✅ Filter by Fee Type (Paid/Free)
    if (feeFilter !== "all") {
      filtered = filtered.filter(course => course.courseFeeType?.toLowerCase() === feeFilter);
    }

    console.log("Final filtered courses count:", filtered.length);
    return filtered;
  };
  // Helper function to get thumbnail URL with priority: jobVideoThumbnail > thumbnail > _company?.logo > default
  const getThumbnailUrl = (course) => {
    if (course.jobVideoThumbnail) {
      return resolveMediaUrl(bucketUrl, course.jobVideoThumbnail);
    }
    if (course.thumbnail) {
      // If thumbnail is relative path, make it absolute using bucketUrl
      if (bucketUrl && !course.thumbnail.startsWith('http://') && !course.thumbnail.startsWith('https://')) {
        const thumbPath = course.thumbnail.startsWith('/') ? course.thumbnail.slice(1) : course.thumbnail;
        return `${bucketUrl}/${thumbPath}`;
      }
      return course.thumbnail;
    }
    if (course._company?.logo) {
      // If company logo is relative path, make it absolute using bucketUrl
      if (bucketUrl && !course._company.logo.startsWith('http://') && !course._company.logo.startsWith('https://')) {
        const logoPath = course._company.logo.startsWith('/') ? course._company.logo.slice(1) : course._company.logo;
        return `${bucketUrl}/${logoPath}`;
      }
      return course._company.logo;
    }
    // Default fallback
    return "/Assets/public_assets/images/newjoblisting/course_img.svg";
  };

  const handleShare = async (courseId, courseName, courseThumbnail) => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📤 SHARE BUTTON CLICKED - FRONTEND");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Job ID:", courseId);
    console.log("Job Title:", courseName);
    console.log("Thumbnail Parameter:", courseThumbnail);
    
    // Find the course object to check all available fields
    const courseObj = courses.find(c => c._id === courseId);
    if (courseObj) {
      console.log("📦 Full Course Object Fields:");
      console.log("   - jobVideoThumbnail:", courseObj.jobVideoThumbnail);
      console.log("   - thumbnail:", courseObj.thumbnail);
      console.log("   - _company?.thumbnail:", courseObj._company?.thumbnail);
      console.log("   - _company?.logo:", courseObj._company?.logo);
      
      // Priority: jobVideoThumbnail only (backend will use default if not available)
      const finalThumbnail = courseObj.jobVideoThumbnail || null;
      console.log("✅ Final Thumbnail Selected (jobVideoThumbnail only):", finalThumbnail);
      
      if (!finalThumbnail) {
        console.log("ℹ️ jobVideoThumbnail not found - backend will use default image for rich preview");
      }
      
      // Update courseThumbnail if it was undefined
      if (!courseThumbnail && finalThumbnail) {
        courseThumbnail = finalThumbnail;
        console.log("🔄 Updated thumbnail from course object:", courseThumbnail);
      }
    } else {
      console.warn("⚠️ Course object not found in courses array");
    }
    
    // Use proper job details URL for rich preview (with Open Graph meta tags)
    const jobUrl = `${window.location.origin}/jobdetailsmore/${courseId}`;
    console.log("Share URL:", jobUrl);
    console.log("Native Share API Available:", !!navigator.share);
    
    if (navigator.share) {
      try {
        const shareData = {
          title: courseName,
          text: `Check out this job: ${courseName}`,
          url: jobUrl,
        };
        console.log("📋 Share Data:", shareData);
        console.log("⏳ Opening native share dialog...");
        
        await navigator.share(shareData);
        
        console.log("✅ Share completed successfully!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      } catch (error) {
        // User cancelled share dialog - this is normal, not an error
        if (error.name === 'AbortError') {
          console.log("ℹ️ User cancelled the share dialog");
        } else {
          console.error("❌ Error sharing:", error);
          console.log("🔄 Falling back to clipboard copy...");
        }
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        fallbackCopyText(courseName, jobUrl);
      }
    } else {
      console.log("⚠️ Native Share API not available - using clipboard fallback");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      fallbackCopyText(courseName, jobUrl);
    }
  }

  function fallbackCopyText(courseName, jobUrl) {
    console.log("📋 FALLBACK: Copying to clipboard");
    const shareText = `Check out this job: ${courseName} - ${jobUrl}`;
    console.log("Text to copy:", shareText);
    
    navigator.clipboard.writeText(shareText).then(() => {
      console.log("✅ Link copied to clipboard successfully!");
      alert("Job link copied! You can paste it anywhere.");
    }).catch(err => {
      console.error("❌ Clipboard copy failed:", err);
    });
  }





  const filteredCourses = getFilteredCourses();
  console.log("filteredCourses", filteredCourses);

  const selectedSectorName =
    activeFilter === "all"
      ? "All"
      : uniqueSectors.find((s) => `id_${s._id}` === activeFilter)?.name || "All";

  return (
    <>

      <FrontLayout>
        <section className="bg_pattern py-xl-5 py-lg-5 py-md-5 py-sm-2 py-2 d-none">
          {/* Background pattern section - hidden by default (d-none) */}
          <div className="container">
            {/* Category icons section */}
            <div className="row">
              <div className="col-xxl-8 col-xl-8 col-md-8 col-sm-8 col-11 mx-auto">
                <div className="row justify-content-around" id="features_cta">
                  <ul className="d-flex justify-content-between overflow-x-auto">
                    <li className="cta_cols cta_cols_list">
                      <figure className="figure">
                        <img className="Sirv image-main" src="/Assets/public_assets/images/newjobicons/agriculture.png" alt="Agriculture" />
                        <img className="Sirv image-hover" src="/Assets/public_assets/images/newjobicons/agriculture_v.png" alt="Agriculture hover" />
                      </figure>
                      <h4 className="head">Agriculture</h4>
                    </li>
                    {/* More category items */}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="foc-cyber-home hp-theme foc-courses-page foc-jobs-page">
        <section className="section grid-bg" id="jobs-list">
          <div className="container">
            <div className="section-head">
              <div className="stag">Career Opportunities</div>
              <h1 className="sh2">
                Select jobs for your <span className="cyan">career</span>
              </h1>
              <p className="s-body">Find roles that match your skills and ambitions.</p>
            </div>

            <div className="courses-filters">
              <div className="courses-filters__row">
                <div className="courses-filters__label">
                  <span className="courses-filters__tag">Filter by Sector</span>
                  <span className="courses-filters__active">{selectedSectorName}</span>
                </div>

                <div className="courses-search jobs-ai-search">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="courses-search__input"
                  placeholder="Search jobs with AI..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  aria-label="Search jobs with AI"
                />
                <span className="courses-search__icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                {showMainSearchSuggestions && mainSearchSuggestions.length > 0 && hasUserTyped && (
                  <div
                    className="jobs-search-suggestions"
                    ref={searchSuggestionsRef}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {mainSearchSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className={`jobs-search-suggestion${index === selectedMainSearchSuggestionIndex ? " selected" : ""}`}
                        onClick={() => handleSearchSuggestionClick(suggestion)}
                        onMouseEnter={() => setSelectedMainSearchSuggestionIndex(index)}
                      >
                        <span className="jobs-search-suggestion__icon">💡</span>
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </div>

              <div className="courses-filters__chips">
                <button
                  type="button"
                  id="all"
                  className={`filter-chip${activeFilter === "all" ? " active" : ""}`}
                  onClick={() => handleFilterClick("all")}
                >
                  All <span className="filter-chip__count">{Array.isArray(courses) ? courses.length : 0}</span>
                </button>
                {Array.isArray(uniqueSectors) &&
                  uniqueSectors.map((sector) => {
                    const count = courses.filter(
                      (c) => c._industry && c._industry._id.toString() === sector._id.toString()
                    ).length;
                    return (
                      <button
                        key={sector._id}
                        type="button"
                        id={`id_${sector._id}`}
                        className={`filter-chip${activeFilter === `id_${sector._id}` ? " active" : ""}`}
                        onClick={() => handleFilterClick(`id_${sector._id}`)}
                      >
                        {sector.name} <span className="filter-chip__count">{count}</span>
                      </button>
                    );
                  })}
              </div>

            </div>

            {filteredCourses.length > 0 ? (
              <div className="courses-grid">
                {filteredCourses.map((course) => (
                    <JobCard
                      key={course._id}
                      job={course}
                      thumbUrl={getThumbnailUrl(course)}
                      bucketUrl={bucketUrl}
                      onPlayVideo={setVideoSrc}
                      onShare={handleShare}
                    />
                ))}
              </div>
            ) : (
              <div className="courses-empty">
                <h3>No jobs found</h3>
                <p>Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </section>

        <div className="modal fade event-video-modal" id="videoModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content event-video-modal__content">
              <button type="button" className="event-video-modal__close" data-bs-dismiss="modal" aria-label="Close">
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



        {/* Callback Modal */}
        <div className="modal fade" id="callbackModal" tabIndex="-1" aria-labelledby="callbackModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered newWidth">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-black" id="callbackModalLabel">
                  Request for Call Back
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form id="callbackForm" onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <div className="col-md-6 col-6">
                      <label className="form-label">Name</label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter your name" />
                    </div>
                    <div className="col-md-6 col-6">
                      <label className="form-label">State</label>
                      <select className="form-control" name="state" value={formData.state} onChange={handleChange} required>
                        <option value="" disabled>Select your State</option>
                        {statesList.map((state, index) => (
                          <option key={index} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6 col-6">
                      <label className="form-label">Contact Number</label>
                      <input type="tel" className="form-control" name="mobile" value={formData.mobile} onChange={handleChange} required pattern="[0-9]{10}" placeholder="Enter 10-digit mobile number" />
                    </div>
                    <div className="col-md-6 col-6">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required placeholder="Enter your email" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea className="form-control" name="message" value={formData.message} onChange={handleChange} required placeholder="Enter your message here..."></textarea>
                  </div>



                  <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Submitting..." : "Submit"}</button>
                  {successMessage && <p className="text-success">{successMessage}</p>}
                  {errorMessage && <p className="text-danger">{errorMessage}</p>}
                </form>
                {successMessage && <p className="text-success">{successMessage}</p>}
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
  --surface: var(--foc-color-surface);
  --surface2: var(--foc-color-surface-2);
  --border: rgba(4, 25, 45, .12);
  --text: var(--foc-color-text);
  --muted: var(--foc-color-text-muted);
  --muted2: var(--foc-color-text-muted-2);
  --orb1: rgba(27,167,255,.14);
  --orb2: rgba(255,45,170,.12);
  --grid-line: rgba(6,20,38,.055);
  --cyan-soft: rgba(27,167,255,.085);
  --r: var(--foc-radius-lg);
  --ease: var(--foc-ease);
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100%;
  padding-top: 88px;
  position: relative;
  overflow-x: hidden;
}
.foc-courses-page > section { padding: 48px 0; background: var(--bg) !important; position: relative; }
.foc-courses-page .container { max-width: var(--foc-container-max); margin: 0 auto; padding: 0 var(--foc-container-pad); position: relative; z-index: 1; }
.foc-courses-page .grid-bg::before {
  content: ''; position: absolute; inset: 0;
  background-image: radial-gradient(circle at 18% 12%, var(--orb1) 0%, transparent 55%), radial-gradient(circle at 82% 28%, var(--orb2) 0%, transparent 60%), linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: auto, auto, 48px 48px, 48px 48px; opacity: .9; pointer-events: none;
}
.foc-courses-page .section-head { text-align: center; margin-bottom: 28px; }
.foc-courses-page .stag { display: inline-flex; align-items: center; gap: 8px; background: var(--cyan-soft); border: 1px solid var(--border); color: var(--cyan); font-size: 10px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; padding: 5px 14px; border-radius: 2px; margin-bottom: 14px; }
.foc-courses-page .stag::before { content: '//'; color: var(--red); }
.foc-courses-page .sh2 { font-family: var(--foc-font-display), Orbitron, sans-serif; font-size: clamp(26px, 4vw, 44px); font-weight: 700; color: var(--text); line-height: 1.1; margin: 0; }
.foc-courses-page .sh2 .cyan { background: linear-gradient(90deg, var(--cyan), var(--red)); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }
.foc-courses-page .s-body { font-size: 15px; color: var(--muted); margin-top: 12px; text-align: center; line-height: 1.75; font-style: italic; margin-left: auto; margin-right: auto; }
.foc-courses-page .courses-filters { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 18px; margin-bottom: 24px; }
.foc-courses-page .courses-filters__row { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.foc-courses-page .courses-filters__tag { font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--cyan); display: block; }
.foc-courses-page .courses-filters__active { font-size: 14px; font-weight: 600; color: var(--text); }
.foc-courses-page .courses-search { position: relative; min-width: 220px; flex: 1; max-width: 360px; }
.foc-jobs-page .courses-filters__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.foc-jobs-page .courses-filters__row .courses-filters__label {
  margin-bottom: 0;
  flex: 0 0 auto;
}
.foc-jobs-page .jobs-ai-search {
  position: relative;
  flex: 0 1 auto;
  width: min(280px, 100%);
  min-width: 180px;
  max-width: 280px;
  margin-left: auto;
}
.foc-jobs-page .jobs-ai-search .courses-search__input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px 8px 34px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  line-height: 1.35;
  display: block;
}
.foc-jobs-page .jobs-ai-search .courses-search__input::placeholder {
  color: var(--muted);
  opacity: 1;
  font-size: 12px;
}
.foc-jobs-page .jobs-ai-search .courses-search__input:focus {
  outline: none;
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px var(--cyan-soft);
}
.foc-jobs-page .jobs-ai-search .courses-search__icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: 13px;
  pointer-events: none;
  z-index: 1;
}
@media (max-width: 575px) {
  .foc-jobs-page .jobs-ai-search {
    width: 100%;
    max-width: 100%;
    margin-left: 0;
  }
}
.foc-jobs-page .jobs-search-suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,.12);
  z-index: 50;
  max-height: 240px;
  overflow-y: auto;
}
.foc-jobs-page .jobs-search-suggestion {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text);
}
.foc-jobs-page .jobs-search-suggestion__icon { flex-shrink: 0; }
.foc-jobs-page .jobs-search-suggestion:hover,
.foc-jobs-page .jobs-search-suggestion.selected { background: var(--cyan-soft); }
.foc-courses-page .courses-search__input { width: 100%; padding: 10px 14px 10px 36px; border: 1px solid var(--border); border-radius: 999px; background: var(--bg); color: var(--text); font-size: 14px; }
.foc-courses-page .courses-search__input:focus { outline: none; border-color: var(--cyan); box-shadow: 0 0 0 3px var(--cyan-soft); }
.foc-courses-page .courses-search__icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 14px; pointer-events: none; }
.foc-courses-page .courses-filters__chips { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.foc-courses-page .filter-chip { border: 1px solid var(--border); background: var(--bg); color: var(--text); border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 600; cursor: pointer; transition: .2s var(--ease); }
.foc-courses-page .filter-chip.active { background: linear-gradient(90deg, var(--cyan), var(--red)); color: var(--foc-color-text-inverse); border-color: transparent; }
.foc-courses-page .filter-chip__count { margin-left: 6px; opacity: .85; font-size: 11px; }
.foc-jobs-page .jobs-compare-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 14px; }
.foc-jobs-page .jobs-compare-bar__clear { font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--red); background: transparent; color: var(--red); cursor: pointer; }
.foc-courses-page .courses-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 8px; }
@media (min-width: 768px) { .foc-courses-page .courses-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1200px) { .foc-courses-page .courses-grid { grid-template-columns: repeat(3, 1fr); } }

.foc-jobs-page .job-card-body {
  padding: 12px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 0 1 auto;
  text-align: center;
}
.foc-jobs-page .job-card-title {
  font-family: var(--foc-font-display), Orbitron, sans-serif;
  font-size: clamp(17px, 2vw, 20px);
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.foc-jobs-page .job-card-company {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.foc-jobs-page .job-card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  text-align: left;
  margin-bottom: 4px;
}
.foc-jobs-page .job-detail-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px;
  min-width: 0;
}
.foc-jobs-page .job-detail-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}
.foc-jobs-page .job-detail-cell span {
  font-size: 11px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.foc-jobs-page .job-card-deadline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 2px 4px;
  text-align: left;
}
.foc-jobs-page .job-card-deadline__label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
}
.foc-jobs-page .job-card-deadline__date {
  font-size: 13px;
  font-weight: 700;
  color: #c9a227;
}


.foc-courses-page .course-card { background: var(--surface); border: 1px solid color-mix(in srgb, var(--cr-accent) 22%, var(--border)); border-radius: var(--r); overflow: hidden; position: relative; --cr-accent: var(--cyan); box-shadow: 0 10px 28px color-mix(in srgb, var(--cr-accent) 12%, rgba(0,0,0,.06)); display: flex; flex-direction: column; min-height: 100%; transition: .25s var(--ease); padding: 0; }
.foc-courses-page .course-card:hover { transform: translateY(-3px); box-shadow: 0 14px 36px color-mix(in srgb, var(--cr-accent) 18%, rgba(0,0,0,.08)); }
.foc-courses-page .courses-grid .course-card:nth-child(4n + 1) { --cr-accent: var(--cyan); border-radius: 14px 20px 14px 16px; }
.foc-courses-page .courses-grid .course-card:nth-child(4n + 2) { --cr-accent: var(--red); border-radius: 18px 12px 22px 14px; }
.foc-courses-page .courses-grid .course-card:nth-child(4n + 3) { --cr-accent: color-mix(in srgb, var(--cyan) 55%, var(--red)); border-radius: 12px 18px 14px 20px; }
.foc-courses-page .courses-grid .course-card:nth-child(4n) { --cr-accent: color-mix(in srgb, var(--red) 70%, var(--foc-purple)); border-radius: var(--foc-radius-xl) 14px 16px 18px; }
.foc-courses-page .course-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, var(--cr-accent), color-mix(in srgb, var(--cr-accent) 35%, transparent)); z-index: 2; pointer-events: none; }
.foc-jobs-page .course-card--compare { outline: 2px solid var(--cyan); outline-offset: 2px; }
.foc-jobs-page .course-compare-pill { position: absolute; top: 10px; left: 56px; z-index: 4; background: var(--cyan); color: #fff; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
.foc-courses-page .course-thumb { height: 160px; background: var(--surface2); position: relative; overflow: hidden; }
.foc-jobs-page .course-thumb { overflow: visible; }
.foc-courses-page .course-thumb > img, .foc-courses-page .course-thumb-media img:first-child { width: 100%; height: 100%; object-fit: cover; display: block; }
.foc-courses-page .course-thumb-media { display: block; width: 100%; height: 100%; padding: 0; border: none; background: transparent; cursor: pointer; position: relative; }
.foc-courses-page .course-thumb-play { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 52px; height: 52px; z-index: 1; pointer-events: none; }
.foc-courses-page .course-thumb::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(11,18,32,.35)); pointer-events: none; }
.foc-jobs-page .course-thumb .verified-badge-container {
  position: absolute;
  top: 10px;
  right: 7px;
  width: 15px;
  height: 15px;
  z-index: 4;
  pointer-events: none;
}
.foc-jobs-page .course-thumb .verified-badge-container .verified-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px !important;
  height: 30px !important;
  transform: translate(-50%, -50%);
  transform-origin: center center;
  border-radius: 50%;
  object-fit: contain;
  z-index: 1002;
  animation: job-verified-pulse 2s ease-in-out infinite;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 12px rgba(76, 175, 80, 0.45);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
}
.foc-jobs-page .course-thumb .verified-badge-container .wave-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px solid rgba(76, 175, 80, 0.6);
  width: 60px;
  height: 60px;
  pointer-events: none;
  z-index: 1001;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.4);
  animation: job-wave-expand 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}
.foc-jobs-page .course-thumb .verified-badge-container .wave-ring.wave-1 {
  animation-delay: 0s;
  border-color: rgba(76, 175, 80, 0.6);
}
.foc-jobs-page .course-thumb .verified-badge-container .wave-ring.wave-2 {
  animation-delay: 0.7s;
  border-color: rgba(76, 175, 80, 0.4);
}
.foc-jobs-page .course-thumb .verified-badge-container .wave-ring.wave-3 {
  animation-delay: 1.4s;
  border-color: rgba(76, 175, 80, 0.3);
}
@keyframes job-verified-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.92; }
}
@keyframes job-wave-expand {
  0% {
    width: 60px;
    height: 60px;
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(1);
    border-width: 2px;
  }
  100% {
    width: 60px;
    height: 60px;
    opacity: 0;
    transform: translate(-50%, -50%) scale(3);
    border-width: 1px;
  }
}
.foc-jobs-page .course-thumb .course-badge {
  left: 12px;
  right: auto;
}
.foc-courses-page .course-badge { position: absolute; right: 12px; top: 12px; z-index: 2; font-size: 10px; font-weight: 600; text-transform: uppercase; padding: 6px 10px; border-radius: 999px; border: 1px solid var(--border); background: rgba(255,255,255,.92); color: var(--text); }
.foc-courses-page .course-fee { position: absolute; left: 12px; bottom: 12px; z-index: 2; font-size: 10px; font-weight: 600; padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,.92); border: 1px solid var(--border); }
.foc-courses-page .course-fee--paid { color: var(--red); border-color: rgba(255,45,122,.28); }
.foc-courses-page .course-body { padding: 12px 12px 8px; display: flex; flex-direction: column; gap: 8px; flex: 0 1 auto; }
.foc-courses-page .course-title { font-family: var(--foc-font-display), Orbitron, sans-serif; font-size: 15px; font-weight: 700; color: var(--text); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.foc-courses-page .course-sector { font-size: 12px; color: var(--muted); line-height: 1.45; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.foc-courses-page .course-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 0; }
.foc-courses-page .course-meta .m { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 8px; }
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
.foc-courses-page .course-meta .m strong { display: block; font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted2); margin-bottom: 4px; }
.foc-courses-page .course-meta .m span { display: block; font-size: 12px; font-weight: 500; color: var(--text); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.foc-courses-page .course-action-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 2px; }
.foc-courses-page .btn.shr--width { width: 100%; }
.foc-courses-page .btn.cta-callnow, .foc-courses-page .btn.cta-callnow.btn-bg-color { background: var(--home-card-cta); color: #fff; border: 1px solid var(--home-card-cta); border-radius: 50px; font-weight: 600; padding: 8px 10px; font-size: 12px; transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; width: 100%; }
.foc-courses-page .btn.cta-callnow:not(.btn-bg-color) { background: #fff; color: var(--home-card-cta); }
.foc-courses-page .btn.cta-callnow:hover, .foc-courses-page .btn.cta-callnow.btn-bg-color:hover { background: var(--home-card-cta-hover); border-color: var(--home-card-cta-hover); color: #fff; }
.foc-courses-page .course-callback-btn { margin-top: 6px; padding: 8px 10px; }
.foc-courses-page .course_card_footer { background: var(--home-card-cta); border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; margin-top: 0; text-align: center; padding: 8px 10px; }
.foc-courses-page .course-learn-more { display: inline-flex; align-items: center; justify-content: center; gap: 6px; text-decoration: none; }
.foc-courses-page .course-learn-more .learnn { color: #fff; font-size: 13px; font-weight: 600; padding: 4px 0; }
.foc-courses-page .course-learn-more__icon { width: 18px; height: auto; display: block; }
.foc-courses-page .courses-empty { text-align: center; padding: 48px 16px; color: var(--muted); }
.foc-courses-page .courses-empty h3 { font-family: var(--foc-font-display), Orbitron, sans-serif; color: var(--text); margin-bottom: 8px; }
.foc-courses-page #courseVid { width: 100%; border-radius: 10px; outline: none; display: block; }
.event-video-modal .event-video-modal__content { position: relative; border: none; background: #000; overflow: visible; }
.event-video-modal .modal-body { padding: 0; }
.event-video-modal__close { position: absolute; top: 10px; right: 10px; z-index: 20; width: 30px; height: 30px; padding: 0; border: none; border-radius: 50%; background: rgba(255,255,255,.95); color: #1a1a2e; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,.2); }
.event-video-modal__close span { font-size: 22px; line-height: 1; margin-top: -2px; }
        `}</style>
        </div>

        <style>
          {
            `
.verified-badge-container {
    position: relative;
    display: inline-block;
  }

  .verified-badge {
    width: 50% !important;
    height: 50% !important;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
    z-index: 1002;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 15px rgba(76, 175, 80, 0.5);
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
    object-fit: cover;
    right: -41px;
    top: -10px;
    transform-origin: center center;
  }

  .wave-ring {
    position: absolute;
    top: 0%;
    left: 100%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 2px solid rgba(76, 175, 80, 0.6);
    width: 60px;
    height: 60px;
    pointer-events: none;
    z-index: 1001;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.4);
    animation: wave-expand 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  }

  .wave-ring.wave-1 {
    animation-delay: 0s;
    border-color: rgba(76, 175, 80, 0.6);
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.4);
  }

  .wave-ring.wave-2 {
    animation-delay: 0.7s;
    border-color: rgba(76, 175, 80, 0.4);
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
  }

  .wave-ring.wave-3 {
    animation-delay: 1.4s;
    border-color: rgba(76, 175, 80, 0.3);
    box-shadow: 0 0 6px rgba(76, 175, 80, 0.2);
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.9;
    }
  }

  @keyframes wave-expand {
    0% {
      width: 60px;
      height: 60px;
      opacity: 0.7;
      transform: translate(-50%, -50%) scale(1);
      border-width: 2px;
    }
    100% {
      width: 60px;
      height: 60px;
      opacity: 0;
      transform: translate(-50%, -50%) scale(3);
      border-width: 1px;
    }
  }

            
.bg-img {
    position: relative;
    border-radius: 11px;
    border: 1px solid #ffffff;
    box-shadow: rgb(227, 59, 22, 77%) 0px 0px 0.25em, rgba(24, 86, 201, 0.05) 0px 0.25em 1em;
}
img.group1 {
    width: 75px !important;
    height: auto;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
.course_card_footer img {
    width: 20px;
}
.courses_features p {
    line-height: normal;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}
.color-yellow {
    color: #FFD542;
}
.btn.shr--width{
  width: 100%;
}
.foc-jobs-page .btn.cta-callnow {
    background: #fff;
    color: var(--home-card-cta, #0d2146);
    font-family: var(--foc-font-sans), Inter, sans-serif;
    border: 1px solid var(--home-card-cta, #0d2146);
    border-radius: 50px;
    font-weight: 600;
    padding: 8px 10px;
    width: 100%;
    font-size: 12px;
    letter-spacing: 0.02em;
    transition: .2s;
}
.foc-jobs-page .btn.cta-callnow.btn-bg-color {
    background: var(--home-card-cta, #0d2146);
    color: #fff;
}
.foc-jobs-page .btn.cta-callnow:hover {
    background: var(--home-card-cta-hover, #163565);
    border-color: var(--home-card-cta-hover, #163565);
    color: #fff;
}
.foc-jobs-page .learnn {
  padding: 4px 0;
}
.foc-jobs-page .course_card_footer {
    background: var(--home-card-cta, #0d2146);
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
}
.foc-jobs-page .jobs h1 {
    color: var(--home-card-cta, #0d2146);
    font-size: 45px;
    font-weight: 700;
    font-family: var(--foc-font-display), Inter, sans-serif;
}

.courseCard{
  border-radius: 12px!important;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
}
video#courseVid {
    width: 100%;
    height: auto;
    border-radius: 6px;
}
.smallText{
  color: #fff;
  background-color: #FC2B5A!important;
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
    /* right: -13px; */
    right: 0px;
    /* top: -12px; */
    top: 0px;
    width: 38px;
    -webkit-appearance: none;
    -moz-box-shadow: none;
    -webkit-box-shadow: none;
    box-shadow: none;
    font-weight: 400;
    transition: .3s;
    font-weight: 900;
    color:#000!important;
}
button.close span {
    font-size: 30px;
    line-height: 30px;
    color: #FC2B5A;
    font-weight: 400;
}
.sector--select{
  display: flex;
  align-items: center;

}

@media only screen and (max-width: 1199px) {
    .card {
        width: 100%;
    }
    .card-padd {
        display: flex
;
        justify-content: center;
        padding-left: 0 !important;
    }
}
@media only screen and (max-width: 768px) {
.sector--select{
  display: none;
}
  .jobs-heading {
        font-size: 30px !important;
    }
    .card {
        width: 95% !important;
    }
    
    .jobs-heading {
        font-size: 22px;
    }
}
@media only screen and (max-width: 700px) {
    .card {
        width: 95% !important;
    }
}
@media (max-width: 578px) {
 
    .jobs-heading {
        font-size: 27px !important;
    }
}
@media (max-width: 432px) {
    .jobs-heading {
        font-size: 25px !important;
    }
}
@media (max-width: 392px) {
   
    .courses_features p{
        font-size: 14px;
    }
}
@media (max-width: 375px) {
   
    
}


/* Course.css */

/* Filter Styles */
.filter-container {
    margin: auto;
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
  }
  
  .filter-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: #6b7280;
    font-weight: 500;
  }
  
  .filter-buttons {
    display: flex;
    overflow-y: hidden;
    overflow-x: auto;
    gap: 12px;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding-bottom: 8px;
  }
  
  .filter-buttons::-webkit-scrollbar {
    display: none;
  }
  
  .filter-button {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 20px;
    font-weight: 500;
    border: 1px solid #e5e7eb;
    background: white;
    color: #374151;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }
  
  .filter-button:hover {
    border-color: #ec4899;
  }
  
  .filter-button.active {
    background: #ec4899;
    color: white;
    transform: scale(1.05);
  }
  
  .count {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 12px;
    border-radius: 50%;
    background: #f3f4f6;
    color: #374151;
  }
  
  .filter-button.active .count {
    background: #db2777;
    color: white;
  }
  
  .active-indicator {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background: #ec4899;
  }
  
  /* Course Card Styles */
  .courseCard {
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.3s ease;
    height: 100%;
  }
  
  .courseCard:hover {
    transform: translateY(-5px);
  }
  
  .bg-img {
    position: relative;
    overflow: hidden;
  }
  
  .bg-img img.digi {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  
  .right_obj {
    position: absolute;
    top: 33px;
    background-color: #ec4899;
    color: white;
    padding: 5px 10px;
    /* border-radius: 20px; */
    /* font-size: 0.8rem; */
    font-weight: bold;
  }
  
  .group1 {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    opacity: 0.8;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  
  .bg-img:hover .group1 {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
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
  
  .courses_features {
    font-size: 0.85rem;
  }
  
  .sub_head {
    opacity: 0.8;
    font-size: 0.75rem;
  }
  
  .color-yellow {
    color: #ffc107;
  }
  
  
  .btn-bg-color {
    background-color: #ec4899;
    color: white;
    border: none;
  }
  
  .btn-bg-color:hover {
    background-color: #db2777;
    color: white;
  }
  
  .cta-callnow {
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .cta-callnow:hover {
    transform: translateY(-2px);
  }
  
  /* Section Styles */
  .section-padding-60 {
    padding: 60px 0;
  }
  
  .jobs-heading {
    color: #333;
    font-weight: 700;
    position: relative;
  }
  .search-container{
    position: relative;
  }
  .ai-search-container {
    position: relative;
    width: 100%;
  }
  .search-wrapper {
    position: relative;
    width: 100%;
  }
  .ai-search-input {
    width: 100%;
    font-size: 14px;
  }
  .search-icon {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    color: #8B5CF6;
    pointer-events: none;
    z-index: 1;
  }
  .search-suggestions-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 240px;
    overflow-y: auto;
    z-index: 10001;
    animation: slideUpSearch 0.2s ease;
  }
  @keyframes slideUpSearch {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .search-suggestions-dropdown::-webkit-scrollbar {
    width: 4px;
  }
  .search-suggestions-dropdown::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  .search-suggestions-dropdown::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
  }
  .search-suggestion-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid #f1f1f1;
  }
  .search-suggestion-item:last-child {
    border-bottom: none;
  }
  .search-suggestion-item:hover,
  .search-suggestion-item.selected {
    background: #f8f9ff;
    color: #8B5CF6;
  }
  .search-suggestion-icon {
    font-size: 16px;
    margin-right: 10px;
    flex-shrink: 0;
  }
  .search-suggestion-text {
    font-size: 13px;
    color: #333;
    flex: 1;
  }
  .search-suggestion-item:hover .search-suggestion-text,
  .search-suggestion-item.selected .search-suggestion-text {
    color: #8B5CF6;
    font-weight: 500;
  }
  /* .jobs-heading:after {
    content: '';
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background-color: #ec4899;
    border-radius: 2px;
  }
   */
  /* Modal Styles */
  .modal-content {
    border: none !important;
    border-radius: 12px;
    /* overflow: hidden; */
  }
  
  .modal-header {
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .modal-footer {
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .submit_btn {
    background-color: #ec4899;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .submit_btn:hover {
    background-color: #db2777;
  }
.new_img{
    width: 20px!important;
}
.apply_date{
    font-size: 16px;
}

#callbackForm input , #callbackForm select{
  background-color: transparent;
  padding: 7px 12px;
  border: 1px solid ;
  height: 37px;
}
#callbackForm textarea{
  margin-bottom: 20px;
  border: 1px solid ;
}
#callbackForm button{
  border: 1px solid #fc2b5a;
  transition: 0.4s ease-in-out;
}
#callbackForm button:hover{
  border: 1px solid #FC2B5A;
  color: #FC2B5A;
  font-weight: bold;
  background: transparent!important;
  scale: 1.1;
}
.newWidth{
  width: 30%!important;
}

.companyname{
  font-size: 12px;
}
@media (max-width:992px){
  .newWidth{
    width: 100%!important;
  }
}
@media(max-width:768px){
.bg-img img.digi {
    object-fit: fill;
  }
  .mobileJobs{
    justify-content: center;
  }
}
            `
          }
        </style>


        <style>
          {

            `
.filter-buttonss {
    display: flex;
    overflow-y: hidden;
    overflow-x: auto;
    gap: 12px;
    /* scrollbar-width: none; */
    /* -ms-overflow-style: none; */
    padding-bottom: 8px;
  } 
  /* .filter-buttons{
    
    scrollbar-width: 1px;
    -ms-overflow-style: none;
    padding-bottom: 8px;

    
  } */
  
 
  /* .filter-buttons::-webkit-scrollbar {
    display: none;
  } */
  .filter-button {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 20px;
    font-weight: 500;
    border: 1px solid #e5e7eb;
    background: white;
    color: #374151;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }
  
  .filter-button:hover {
    border-color: #ec4899;
  }
  
  .filter-button.active {
    background: #ec4899;
    color: white;
    transform: scale(1.05);
  }
  
  .count {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 12px;
    border-radius: 50%;
    background: #f3f4f6;
    color: #374151;
  }
  
  .filter-button.active .count {
    background: #db2777;
    color: white;
  }
  
  .active-indicator {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background: #ec4899;
  }

  /* Verified Badge Container and Animations */
  .verified-badge-container {
    position: relative;
    display: inline-block;
  }

  .verified-badge {
    width: 50% !important;
    height: 50% !important;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
    z-index: 1002;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 15px rgba(76, 175, 80, 0.5);
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
    object-fit: cover;
    right: -41px;
    top: -10px;
    transform-origin: center center;
  }

  .wave-ring {
    position: absolute;
    top: 0%;
    left: 100%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 2px solid rgba(76, 175, 80, 0.6);
    width: 60px;
    height: 60px;
    pointer-events: none;
    z-index: 1001;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.4);
    animation: wave-expand 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  }

  .wave-ring.wave-1 {
    animation-delay: 0s;
    border-color: rgba(76, 175, 80, 0.6);
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.4);
  }

  .wave-ring.wave-2 {
    animation-delay: 0.7s;
    border-color: rgba(76, 175, 80, 0.4);
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
  }

  .wave-ring.wave-3 {
    animation-delay: 1.4s;
    border-color: rgba(76, 175, 80, 0.3);
    box-shadow: 0 0 6px rgba(76, 175, 80, 0.2);
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.9;
    }
  }

  @keyframes wave-expand {
    0% {
      width: 60px;
      height: 60px;
      opacity: 0.7;
      transform: translate(-50%, -50%) scale(1);
      border-width: 2px;
    }
    100% {
      width: 60px;
      height: 60px;
      opacity: 0;
      transform: translate(-50%, -50%) scale(3);
      border-width: 1px;
    }
  }

  /* Floating AI Chat Widget (Separate from Preferences) */
  .ai-chat-fab {
    position: fixed;
    z-index: 99999;
    border-radius: 50%;
    background: #ec4899;
    color: #fff;
    border: 3px solid rgba(255, 255, 255, 0.3);
    width: 64px;
    height: 64px;
    padding: 0;
    box-shadow: 
      0 8px 32px rgba(236, 72, 153, 0.5),
      0 0 0 0 rgba(236, 72, 153, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    font-weight: 600;
    letter-spacing: 0.3px;
    transition: box-shadow 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), transform 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
    cursor: grab;
    animation: pulse-glow 2s ease-in-out infinite;
    backface-visibility: hidden;
    perspective: 1000px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .ai-chat-fab:active {
    cursor: grabbing;
    animation: none;
  }

  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 
        0 8px 32px rgba(236, 72, 153, 0.5),
        0 0 0 0 rgba(236, 72, 153, 0.7),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
    50% {
      box-shadow: 
        0 12px 40px rgba(236, 72, 153, 0.7),
        0 0 0 8px rgba(236, 72, 153, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
  }

  .ai-chat-fab-content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ai-chat-fab-icon {
    position: absolute;
    width: 36px;
    height: 36px;
    z-index: 2;
    pointer-events: none;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    transition: transform 0.3s ease;
  }

  .ai-chat-fab:hover:not(:active) {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 
      0 16px 48px rgba(236, 72, 153, 0.8),
      0 0 0 4px rgba(255, 255, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    animation: none;
  }

  .ai-chat-fab:hover:not(:active) .ai-chat-fab-icon {
    transform: translate(-50%, -50%) scale(1.1);
  }


  @media (max-width: 768px) {
    .ai-chat-fab {
      width: 56px;
      height: 56px;
    }

    .ai-chat-fab-icon {
      width: 32px;
      height: 32px;
    }
  }

  .ai-chat-overlay {
    position: fixed;
    inset: 0;
    z-index: 99998;
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    will-change: opacity;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .ai-chat-overlay.open {
    opacity: 1;
    pointer-events: auto;
    transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .ai-chat-widget {
    position: fixed;
    right: 18px;
    bottom: 78px;
    width: min(420px, calc(100vw - 36px));
    max-height: min(600px, calc(100vh - 120px));
    z-index: 99999;
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.06);
    transform: translateY(40px) scale(0.92);
    opacity: 0;
    transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    will-change: transform, opacity;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .ai-chat-widget.open {
    transform: translateY(0) scale(1);
    opacity: 1;
    transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .ai-chat-widget-header {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ai-chat-icon {
    font-size: 24px;
  }

  .ai-chat-title {
    color: white;
    font-weight: 600;
    font-size: 16px;
  }

  .ai-chat-widget-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px;
    overflow: hidden;
    min-height: 400px;
    position: relative;
  }

  .ai-welcome-msg {
    flex-shrink: 0;
    margin-bottom: 16px;
  }

  .ai-quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .ai-quick-chip {
    border: 1px solid rgba(236, 72, 153, 0.35);
    background: rgba(236, 72, 153, 0.08);
    color: #111827;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  }

  .ai-quick-chip:hover {
    transform: translateY(-1px);
    border-color: rgba(236, 72, 153, 0.6);
    background: rgba(236, 72, 153, 0.12);
  }

  .ai-result-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  .ai-mini-btn {
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #111827;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 10px;
    border-radius: 10px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .ai-mini-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.08);
  }

  .ai-mini-btn.primary {
    background: #ec4899;
    color: #fff;
    border-color: rgba(236, 72, 153, 0.5);
  }

  .ai-voice-btn {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 6px 10px;
    margin-left: 8px;
  }

  .ai-voice-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .ai-messages-area {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    margin-bottom: 16px;
    min-height: 0;
  }

  .ai-input-form {
    flex-shrink: 0;
    margin-top: auto;
  }

  /* Floating Preferences (chatbot style) */
  .job-pref-fab {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 99999;
    border-radius: 999px;
    background: #FC2B5A;
    color: #fff;
    border: none;
    padding: 12px 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .job-pref-overlay {
    position: fixed;
    inset: 0;
    z-index: 99998;
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition: opacity 220ms ease;
  }

  .job-pref-panel {
    position: fixed;
    right: 18px;
    bottom: 78px;
    width: min(560px, calc(100vw - 36px));
    z-index: 99999;
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.06);
    opacity: 0;
    transform: translateY(14px) scale(0.98);
    transition: opacity 220ms ease, transform 220ms ease;
  }

  .job-pref-overlay.open {
    opacity: 1;
  }

  .job-pref-panel.open {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  @media (prefers-reduced-motion: reduce) {
    .job-pref-overlay,
    .job-pref-panel {
      transition: none !important;
    }
  }

  .job-pref-panel-header {
    padding: 12px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .job-pref-panel-title {
    font-weight: 700;
    color: #111827;
    margin: 0;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .job-pref-panel-body {
    padding: 14px;
  }

  /* AI Search Suggestions Styles */
  .input-wrapper-ai {
    position: relative;
    width: 100%;
  }

  .ai-input-form .input-group {
    position: relative;
    z-index: 2;
  }

  .suggestions-dropdown-ai {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 240px;
    overflow-y: auto;
    z-index: 10001;
    animation: slideUpAi 0.2s ease;
  }

  @keyframes slideUpAi {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .suggestions-dropdown-ai::-webkit-scrollbar {
    width: 4px;
  }

  .suggestions-dropdown-ai::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  .suggestions-dropdown-ai::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
  }

  .suggestion-item-ai {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid #f1f1f1;
  }

  .suggestion-item-ai:last-child {
    border-bottom: none;
  }

  .suggestion-item-ai:hover,
  .suggestion-item-ai.selected {
    background: #f8f9ff;
    color: #8B5CF6;
  }

  .suggestion-icon-ai {
    font-size: 16px;
    margin-right: 10px;
    flex-shrink: 0;
  }

  .suggestion-text-ai {
    font-size: 13px;
    color: #333;
    flex: 1;
  }

  .suggestion-item-ai:hover .suggestion-text-ai,
  .suggestion-item-ai.selected .suggestion-text-ai {
    color: #8B5CF6;
    font-weight: 500;
  }

  /* Loading Dots Animation */
  .dots-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    padding: 10px;
  }

  .dot {
    height: 20px;
    width: 20px;
    margin-right: 10px;
    border-radius: 10px;
    background-color: #b3d4fc;
    animation: pulse 1.5s infinite ease-in-out;
  }

  .dot:last-child {
    margin-right: 0;
  }

  .dot:nth-child(1) {
    animation-delay: -0.3s;
  }

  .dot:nth-child(2) {
    animation-delay: -0.1s;
  }

  .dot:nth-child(3) {
    animation-delay: 0.1s;
  }

  /* Small Black Dots (replacing robot emoji) */
  .dots-container-small {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    margin: 10px;
  }

  .dot-small {
    height: 8px;
    width: 8px;
    border-radius: 50%;
    background-color: #000000;
    animation: pulse-small 1.5s infinite ease-in-out;
  }

  .dot-small:nth-child(1) {
    animation-delay: -0.3s;
  }

  .dot-small:nth-child(2) {
    animation-delay: -0.1s;
  }

  .dot-small:nth-child(3) {
    animation-delay: 0.1s;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.8);
      background-color: #b3d4fc;
      box-shadow: 0 0 0 0 rgba(178, 212, 252, 0.7);
    }

    50% {
      transform: scale(1.2);
      background-color: #6793fb;
      box-shadow: 0 0 0 10px rgba(178, 212, 252, 0);
    }

    100% {
      transform: scale(0.8);
      background-color: #b3d4fc;
      box-shadow: 0 0 0 0 rgba(178, 212, 252, 0.7);
    }
  }

  @keyframes pulse-small {
    0% {
      transform: scale(0.8);
      background-color: #000000;
      opacity: 0.6;
    }

    50% {
      transform: scale(1.2);
      background-color: #000000;
      opacity: 1;
    }

    100% {
      transform: scale(0.8);
      background-color: #000000;
      opacity: 0.6;
    }
  }

  /* AI Message Styling */
  .ai-msg {
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
  }

  .ai-msg.user {
    align-items: flex-end;
  }

  .ai-msg.ai {
    align-items: flex-start;
  }

  .ai-msg-content {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    max-width: 85%;
  }

  .ai-msg.user .ai-msg-content {
    flex-direction: row-reverse;
  }

  .ai-avatar {
    font-size: 24px;
    flex-shrink: 0;
    margin-top: 4px;
  }

  .ai-msg-bubble {
    background: #f3f4f6;
    border-radius: 12px;
    padding: 12px 16px;
    word-wrap: break-word;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .ai-msg.user .ai-msg-bubble {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
  }

  .ai-msg-text {
    white-space: pre-wrap;
    line-height: 1.5;
    color: #374151;
    font-size: 14px;
  }

  .ai-msg.user .ai-msg-text {
    color: white;
  }

  /* Q&A Answer Styling */
  .ai-qa-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .ai-qa-text {
    flex: 1;
    white-space: pre-wrap;
    line-height: 1.6;
  }

  .ai-qa-answer {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-left: 4px solid #f59e0b;
    padding: 16px;
    border-radius: 8px;
    margin-top: 8px;
  }

  /* AI Jobs Preview Styling */
  .ai-jobs-preview {
    margin-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    padding-top: 12px;
  }

  .ai-msg.user .ai-jobs-preview {
    border-top-color: rgba(255, 255, 255, 0.2);
  }

  .ai-jobs-header h6 {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }

  .ai-msg.user .ai-jobs-header h6 {
    color: white;
  }

  .ai-jobs-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
  }

  .ai-job-card {
    display: block;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 14px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .ai-job-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #6366f1;
    text-decoration: none;
  }

  .ai-job-card-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }

  .ai-job-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .ai-job-title-section {
    flex: 1;
    min-width: 0;
  }

  .ai-job-title {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 6px 0;
    line-height: 1.4;
    word-wrap: break-word;
  }

  .ai-job-company {
    font-size: 13px;
    color: #6b7280;
    margin: 0;
    line-height: 1.4;
  }

  .ai-job-details {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #f3f4f6;
  }

  .ai-job-detail-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #6b7280;
  }

  .ai-job-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  .ai-job-text {
    color: #374151;
    font-weight: 500;
  }

  @media (max-width: 480px) {
    .ai-job-card {
      padding: 12px;
    }

    .ai-job-title {
      font-size: 14px;
    }

    .ai-job-details {
      flex-direction: column;
      gap: 8px;
    }
  }

  /* Compare Job Card Visual Indicators */
  .courseCard.compare-selected {
    // border: 4px solid #10b981 !important;
    // box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3), 0 6px 20px rgba(16, 185, 129, 0.4) !important;
    position: relative;
    transform: scale(1.02);
    transition: all 0.3s ease;
  }

  .compare-badge {
    position: absolute;
    top: 15px;
    left: 15px;
    background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
    color: white;
    padding: 8px 16px;
    border-radius: 25px;
    font-size: 13px;
    font-weight: 700;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.5);
    display: flex;
    align-items: center;
    gap: 6px;
    border: 2px solid white;
    animation: badgePulse 2s ease-in-out infinite;
  }

  .compare-badge-icon {
    font-size: 16px;
  }

  .compare-badge-text {
    font-size: 12px;
    letter-spacing: 0.5px;
  }

  @keyframes badgePulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 2px 8px rgba(236, 72, 153, 0.4);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(236, 72, 153, 0.6);
    }
  }

  .compare-btn-active {
    background: #ec4899 !important;
    color: white !important;
    border-color: #ec4899 !important;
  }

  .compare-btn-active:hover {
    background: #db2777 !important;
    border-color: #db2777 !important;
  }

  .compare-pulse {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    background: #ef4444;
    border-radius: 50%;
    border: 2px solid white;
    animation: pulseDot 1.5s ease-in-out infinite;
  }

  @keyframes pulseDot {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.3);
      opacity: 0.7;
    }
  }

  /* Job Application Confirmation Modal - Inside Chatbot */
  .ai-job-confirm-modal-inner {
    position: absolute;
    bottom: 80px;
    left: 16px;
    right: 16px;
    z-index: 10;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    pointer-events: none;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .ai-job-confirm-modal-inner.show {
    opacity: 1;
    transform: translateY(0);
  }

  .ai-job-confirm-modal-inner .ai-job-confirm-content {
    pointer-events: auto;
    transition: transform 0.3s ease;
  }

  .ai-job-confirm-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 100001;
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    min-width: 400px;
    max-width: 90%;
    animation: modalFadeIn 0.2s ease;
  }

  @keyframes modalFadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Smooth slide up animation for modal */
  @keyframes slideUpFadeIn {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideDownFadeOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(30px);
    }
  }

  .ai-job-confirm-modal-inner .ai-job-confirm-content {
    background: white;
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 100%;
    margin: 0;
    border: 1px solid #e5e7eb;
  }

  .ai-job-confirm-content {
    padding: 24px;
  }

  .ai-job-confirm-header {
    margin-bottom: 16px;
  }

  .ai-job-confirm-header h5 {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 12px 0;
  }

  .ai-job-confirm-body {
    margin-bottom: 16px;
  }

  .ai-job-confirm-body p {
    margin: 0;
    color: #374151;
    font-size: 13px;
    line-height: 1.4;
  }

  .ai-job-confirm-body p strong {
    font-size: 14px;
  }

  .ai-job-confirm-body .text-muted {
    font-size: 12px;
  }

  .ai-job-confirm-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .ai-job-confirm-actions .btn {
    min-width: 70px;
    padding: 6px 16px;
    font-weight: 500;
    border-radius: 6px;
    font-size: 13px;
  }

  .ai-job-confirm-actions .btn-primary {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border: none;
  }

  .ai-job-confirm-actions .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .ai-job-confirm-actions .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #e5e7eb;
  }

  .ai-job-confirm-actions .btn-secondary:hover {
    background: #e5e7eb;
  }

  @media (max-width: 480px) {
    .ai-job-confirm-modal {
      min-width: 90%;
      margin: 20px;
    }

    .ai-job-confirm-modal-inner .ai-job-confirm-content {
      margin: 0 12px;
      padding: 20px;
    }

    .ai-job-confirm-content {
      padding: 20px;
    }

    .ai-job-confirm-actions {
      flex-direction: column;
    }

    .ai-job-confirm-actions .btn {
      width: 100%;
    }
  }

  /* Compare Jobs Modal */
  .compare-jobs-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 100001 !important;
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    width: min(90vw, 1200px);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: modalFadeIn 0.3s ease;
    overflow: hidden;
  }

  .compare-jobs-header {
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .compare-jobs-header h5 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  .compare-jobs-body {
    padding: 20px;
    overflow-y: auto;
    max-height: calc(90vh - 80px);
  }

  .compare-jobs-table {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .compare-row {
    display: grid;
    grid-template-columns: 150px repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    padding: 12px;
    border-bottom: 1px solid #f3f4f6;
  }

  .compare-row.compare-header {
    background: #f9fafb;
    font-weight: 600;
    border-bottom: 2px solid #e5e7eb;
  }

  .compare-row.compare-actions {
    border-bottom: none;
    padding-top: 20px;
  }

  .compare-cell {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #374151;
    position: relative;
  }

  .compare-header .compare-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .compare-header .compare-cell h6 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #111827;
  }

  .btn-remove-compare {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    padding: 0;
  }

  .btn-remove-compare:hover {
    background: #dc2626;
  }

  @media (max-width: 768px) {
    .compare-jobs-modal {
      width: 95vw;
      max-height: 95vh;
    }

    .compare-row {
      grid-template-columns: 120px repeat(auto-fit, minmax(150px, 1fr));
      font-size: 12px;
    }

    .compare-cell {
      font-size: 12px;
    }
  }
`

          }
        </style>

        {/* Compare Jobs Modal */}
        {showCompareModal && compareJobs.length > 0 && (
          <>
            <div
              className="ai-chat-overlay"
              style={{ opacity: 1, pointerEvents: 'auto', zIndex: 100000 }}
              onClick={() => setShowCompareModal(false)}
            />
            <div className="compare-jobs-modal" onClick={(e) => e.stopPropagation()}>
              <div className="compare-jobs-header">
                <div>
                  <h5>⚖️ Compare Jobs ({compareJobs.length})</h5>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Side-by-side comparison of selected jobs
                  </p>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  {compareJobs.length >= 2 && (
                    <button
                      className="btn btn-sm"
                      onClick={handleAICompare}
                      disabled={aiCompareLoading}
                      style={{ 
                        background: '#ec4899', 
                        color: 'white', 
                        border: 'none',
                        fontWeight: '600'
                      }}
                    >
                      {aiCompareLoading ? '⏳ Analyzing...' : '🤖 AI Compare'}
                    </button>
                  )}
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      setShowCompareModal(false);
                      setAiCompareResult(null);
                    }}
                    style={{ border: "1px solid #e5e7eb", borderRadius: 999, padding: "6px 10px", background: '#f3f4f6' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="compare-jobs-body">
                {aiCompareLoading && (
                  <div className="text-center py-4">
                    <div className="spinner-border" style={{ color: '#ec4899' }} role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">AI is analyzing jobs...</p>
                  </div>
                )}
                {aiCompareResult && (
                  <div className="ai-compare-result mb-3 p-3" style={{ background: '#fef2f2', borderRadius: '12px', border: '2px solid #ec4899' }}>
                    <h6 className="mb-2" style={{ color: '#ec4899', fontWeight: '600' }}>🤖 AI Analysis</h6>
                    {aiCompareResult.reasoning && (
                      <div className="mb-3 p-2" style={{ background: 'white', borderRadius: '8px' }}>
                        <p style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: '1.6' }}>
                          {aiCompareResult.reasoning}
                        </p>
                      </div>
                    )}
                    {aiCompareResult.recommendations && aiCompareResult.recommendations.length > 0 && (
                      <div className="mt-3">
                        {aiCompareResult.recommendations.map((rec, idx) => {
                          const job = compareJobs.find(j => j._id.toString() === rec.jobId);
                          if (!job) return null;
                          return (
                            <div key={idx} className="mb-3 p-3" style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                              <h6 style={{ color: '#ec4899', marginBottom: '10px', fontWeight: '600' }}>
                                {rec.jobTitle || job.title || job.name}
                              </h6>
                              {rec.pros && rec.pros.length > 0 && (
                                <div className="mb-2">
                                  <strong style={{ fontSize: '12px', color: '#10b981' }}>✓ Pros:</strong>
                                  <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '12px', color: '#374151' }}>
                                    {rec.pros.map((pro, i) => (
                                      <li key={i}>{pro}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {rec.cons && rec.cons.length > 0 && (
                                <div className="mb-2">
                                  <strong style={{ fontSize: '12px', color: '#ef4444' }}>✗ Cons:</strong>
                                  <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '12px', color: '#374151' }}>
                                    {rec.cons.map((con, i) => (
                                      <li key={i}>{con}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {rec.recommendation && (
                                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic', marginBottom: 0 }}>
                                  💡 {rec.recommendation}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <div className="compare-jobs-table">
                  <div className="compare-row compare-header">
                    <div className="compare-cell">Job Title</div>
                    {compareJobs.map((job) => (
                      <div key={job._id} className="compare-cell">
                        <button
                          className="btn-remove-compare"
                          onClick={() => {
                            handleRemoveFromCompare(job._id);
                            if (compareJobs.length === 1) setShowCompareModal(false);
                          }}
                        >
                          ✕
                        </button>
                        <h6>{job.title || job.name}</h6>
                      </div>
                    ))}
                  </div>
                  <div className="compare-row">
                    <div className="compare-cell">Company</div>
                    {compareJobs.map((job) => (
                      <div key={job._id} className="compare-cell">
                        {job.displayCompanyName || job._company?.name || 'N/A'}
                      </div>
                    ))}
                  </div>
                  <div className="compare-row">
                    <div className="compare-cell">Location</div>
                    {compareJobs.map((job) => (
                      <div key={job._id} className="compare-cell">
                        {job.city?.name || 'N/A'}, {job.state?.name || 'N/A'}
                      </div>
                    ))}
                  </div>
                  <div className="compare-row">
                    <div className="compare-cell">Salary</div>
                    {compareJobs.map((job) => (
                      <div key={job._id} className="compare-cell">
                        {job.isFixed 
                          ? `₹${job.amount?.toLocaleString('en-IN') || 'N/A'}` 
                          : `₹${job.min?.toLocaleString('en-IN') || 'N/A'} - ₹${job.max?.toLocaleString('en-IN') || 'N/A'}`}
                      </div>
                    ))}
                  </div>
                  <div className="compare-row">
                    <div className="compare-cell">Experience</div>
                    {compareJobs.map((job) => (
                      <div key={job._id} className="compare-cell">
                        {job.experience || 0} {job.experience === 1 ? 'year' : 'years'} {job.experienceMonths || 0} {job.experienceMonths === 1 ? 'month' : 'months'}
                      </div>
                    ))}
                  </div>
                  <div className="compare-row">
                    <div className="compare-cell">Qualification</div>
                    {compareJobs.map((job) => (
                      <div key={job._id} className="compare-cell">
                        {job._qualification?.name || 'N/A'}
                      </div>
                    ))}
                  </div>
                  <div className="compare-row">
                    <div className="compare-cell">Work Mode</div>
                    {compareJobs.map((job) => (
                      <div key={job._id} className="compare-cell">
                        {job.work || 'N/A'}
                      </div>
                    ))}
                  </div>
                  <div className="compare-row">
                    <div className="compare-cell">Last Date</div>
                    {compareJobs.map((job) => (
                      <div key={job._id} className="compare-cell">
                        {job.validity ? moment(job.validity).format('DD MMM YYYY') : 'N/A'}
                      </div>
                    ))}
                  </div>
                  <div className="compare-row compare-actions">
                    <div className="compare-cell">Action</div>
                    {compareJobs.map((job) => (
                      <div key={job._id} className="compare-cell">
                        <a
                          href={`/candidate/login?returnUrl=/candidate/job/${job._id}`}
                          className="btn btn-primary btn-sm"
                        >
                          Apply
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Single AI Chatbot Widget - Right Side with Full Functionality & FAQ Support */}
         <ChatbotWidget 
          position="bottom-right"
          title="AI Job Search Assistant"
          // Pass existing functionality handlers
          onJobsUpdate={(jobs) => {
            setCourses(jobs);
            setUsePreferences(true);
          }}
          jobPreferences={jobPreferences}
          onShareJob={handleShareJobFromChat}
          onRefineSearch={handleAIRefine}
          onAddToCompare={handleAddToCompare}
          voiceSupported={aiVoiceSupported}
          onVoiceInput={startVoiceInput}
        />
      </FrontLayout>

    </>
  );
}

export default Jobs;
