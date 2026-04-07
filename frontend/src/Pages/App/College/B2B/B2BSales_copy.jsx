import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'
import Select from 'react-select';
import { Link } from 'react-router-dom';
import { getGoogleAuthCode, getGoogleRefreshToken } from '../../../../Component/googleOAuth';

import CandidateProfile from '../CandidateProfile/CandidateProfile';

function dedupeLeadsById(list) {
  if (!Array.isArray(list) || list.length === 0) return Array.isArray(list) ? list : [];
  const seen = new Set();
  const out = [];
  for (const lead of list) {
    const id = lead?._id != null ? String(lead._id) : null;
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(lead);
  }
  return out;
}

function normalizeFilterIdArray(val) {
  if (val == null || val === '') return [];
  if (Array.isArray(val)) return val.filter((x) => x != null && x !== '').map(String);
  return [String(val)];
}

/** Maps filter state to b2b_copy /leads query params (comma-separated IDs for multi-select). */
function appendB2bCopyFilterQueryParams(params, eff, opts = {}) {
  if (!eff || !params) return;
  if (eff.search) params.search = eff.search;
  const lc = normalizeFilterIdArray(eff.leadCategory);
  if (lc.length) params.leadCategory = lc.join(',');
  const tb = normalizeFilterIdArray(eff.typeOfB2B);
  if (tb.length) params.typeOfB2B = tb.join(',');
  const lo = normalizeFilterIdArray(eff.leadOwner);
  if (lo.length) params.leadOwner = lo.join(',');
  if (eff.dateRange?.start) params.startDate = eff.dateRange.start;
  if (eff.dateRange?.end) params.endDate = eff.dateRange.end;
  if (!opts.omitStatus) {
    if (eff.statusIn) {
      params.statusIn = eff.statusIn;
      delete params.status;
    } else {
      const st = normalizeFilterIdArray(eff.status);
      if (st.length === 1) {
        params.status = st[0];
        delete params.statusIn;
      } else if (st.length > 1) {
        params.statusIn = st.join(',');
        delete params.status;
      }
    }
  }
  const ss = normalizeFilterIdArray(eff.subStatus);
  if (ss.length) params.subStatus = ss.join(',');
}

function buildPipelineStatusBar(statusCounts) {
  if (!Array.isArray(statusCounts)) return [];
  const byDisplay = new Map();
  const order = [];
  for (const row of statusCounts) {
    const raw = String(row?.statusName ?? '').trim();
    if (/^untouch\s*leads$/i.test(raw)) continue;
    if (/^converted\s*won$/i.test(raw)) continue;
    let display = raw;
    if (/^not\s*interested$/i.test(raw)) display = 'Cold';
    else if (/^not\s*connected$/i.test(raw)) display = 'Pending';
    else if (/hot\s*\(\s*institutions\s*\)/i.test(raw)) display = 'Hot';
    // Performance buckets / temperature labels — not shown on CRM pipeline strip
    if (/^(hot|warm|cold|pending)$/i.test(String(display).trim())) continue;
    if (!byDisplay.has(display)) {
      byDisplay.set(display, { statusIds: [], count: 0 });
      order.push(display);
    }
    const bucket = byDisplay.get(display);
    const sid = row?.statusId;
    if (sid != null && sid !== '') bucket.statusIds.push(String(sid));
    bucket.count += Number(row?.count) || 0;
  }
  return order.map((name) => {
    const { statusIds, count } = byDisplay.get(name);
    const uniqueIds = [...new Set(statusIds)];
    return { statusName: name, statusIds: uniqueIds, count };
  });
}

function selectedPipelineIdsEqual(selected, statusIds) {
  const ids = [...new Set((statusIds || []).map(String))].sort();
  if (selected == null || ids.length === 0) return false;
  const sel = Array.isArray(selected) ? [...selected].map(String).sort() : [String(selected)].sort();
  if (sel.length !== ids.length) return false;
  return sel.every((v, i) => v === ids[i]);
}

const B2B_ADD_LEAD_STATUS_OPTIONS = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
  { value: 'prospect', label: 'Prospect' },
];

const PERF_LEAD_STATUS_LABEL = {
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
  prospect: 'Prospect',
  won: 'Won',
};

const PERF_LEAD_STATUS_CHIP = {
  hot: { border: '#ef4444', color: '#b91c1c' },
  warm: { border: '#f59e0b', color: '#b45309' },
  cold: { border: '#3b82f6', color: '#1d4ed8' },
  prospect: { border: '#8b5cf6', color: '#6d28d9' },
  won: { border: '#0d9488', color: '#115e59' },
};

// Google Maps API styles
const mapStyles = `

  .map-container {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .map-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    background: #f8f9fa;
    color: #6c757d;
  }
  
  .location-info {
    background: #e8f5e8;
    border: 1px solid #28a745;
    border-radius: 4px;
    padding: 8px 12px;
    margin-top: 8px;
  }
  
  .map-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  
  .map-buttons .btn {
    flex: 1;
    font-size: 0.875rem;
  }
`;

/** MultiSelectCheckbox — aligned with Registrations.jsx filter multi-select styles */
const multiSelectCheckboxStyles = `
  .multi-select-container-new {
    position: relative;
    width: 100%;
  }

  .multi-select-dropdown-new {
    position: relative;
    width: 100%;
  }

  .multi-select-trigger {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    background: white !important;
    border: 1px solid #ced4da !important;
    border-radius: 0.375rem !important;
    padding: 0.375rem 0.75rem !important;
    font-size: 0.875rem !important;
    min-height: 38px !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
    width: 100% !important;
  }

  .multi-select-trigger:hover {
    border-color: #86b7fe !important;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15) !important;
  }

  .multi-select-trigger.open {
    border-color: #86b7fe !important;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
  }

  .select-display-text {
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #495057;
    font-weight: normal;
  }

  .dropdown-arrow {
    color: #6c757d;
    font-size: 0.75rem;
    transition: transform 0.2s ease;
    margin-left: 0.5rem;
    flex-shrink: 0;
  }

  .multi-select-trigger.open .dropdown-arrow {
    transform: rotate(180deg);
  }

  .multi-select-options-new {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 1;
    background: white;
    border: 1px solid #ced4da;
    border-top: none;
    border-radius: 0 0 0.375rem 0.375rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    max-height: 320px;
    overflow: hidden;
    animation: slideDown 0.2s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .multi-select-options-new {
    transform-origin: top;
    animation: dropdownOpen 0.15s ease-out;
  }

  @keyframes dropdownOpen {
    0% {
      opacity: 0;
      transform: scaleY(0.8);
    }
    100% {
      opacity: 1;
      transform: scaleY(1);
    }
  }

  .options-header {
    padding: 0.75rem;
    border-bottom: 1px solid #e9ecef;
    background: #f8f9fa;
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .select-all-btn,
  .clear-all-btn {
    font-size: 0.75rem !important;
    padding: 0.25rem 0.5rem !important;
    border-radius: 0.25rem !important;
    border: 1px solid !important;
  }

  .select-all-btn {
    border-color: #0d6efd !important;
    color: #0d6efd !important;
  }

  .clear-all-btn {
    border-color: #6c757d !important;
    color: #6c757d !important;
  }

  .select-all-btn:hover {
    background-color: #0d6efd !important;
    color: white !important;
  }

  .clear-all-btn:hover {
    background-color: #6c757d !important;
    color: white !important;
  }

  .options-search {
    padding: 0.5rem;
    border-bottom: 1px solid #e9ecef;
  }

  .options-list-new {
    max-height: 180px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
  }

  .options-list-new::-webkit-scrollbar {
    width: 6px;
  }

  .options-list-new::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  .options-list-new::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  .options-list-new::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  .option-item-new {
    display: flex !important;
    align-items: center;
    padding: 0.5rem 0.75rem;
    margin: 0;
    cursor: pointer;
    transition: background-color 0.15s ease;
    border-bottom: 1px solid #f8f9fa;
  }

  .option-item-new:last-child {
    border-bottom: none;
  }

  .option-item-new:hover {
    background-color: #f8f9fa;
  }

  .option-item-new input[type="checkbox"] {
    margin: 0 0.5rem 0 0 !important;
    cursor: pointer;
    accent-color: #0d6efd;
  }

  .option-label-new {
    flex: 1;
    font-size: 0.875rem;
    color: #495057;
    cursor: pointer;
  }

  .options-footer {
    padding: 0.5rem 0.75rem;
    border-top: 1px solid #e9ecef;
    background: #f8f9fa;
    text-align: center;
  }

  .no-options {
    padding: 1rem;
    text-align: center;
    color: #6c757d;
    font-style: italic;
  }

  .multi-select-container-new.dropdown-open::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
  }

  .multi-select-trigger:focus {
    outline: none;
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }

  .option-item-new input[type="checkbox"]:focus {
    outline: 2px solid #86b7fe;
    outline-offset: 2px;
  }

  .option-item-new input[type="checkbox"]:checked + .option-label-new {
    font-weight: 500;
    color: #0d6efd;
  }

  .multi-select-container-new .badge.bg-primary {
    background-color: #0d6efd !important;
    font-size: 0.75rem;
    padding: 0.25em 0.4em;
  }

  .multi-select-trigger {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  .multi-select-trigger:active {
    transform: translateY(1px);
  }

  .multi-select-loading {
    pointer-events: none;
    opacity: 0.6;
  }

  .multi-select-loading .dropdown-arrow {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .multi-select-options-new {
      max-height: 250px;
    }

    .options-header {
      flex-direction: column;
      gap: 0.25rem;
    }

    .select-all-btn,
    .clear-all-btn {
      width: 100%;
    }

    .options-list-new {
      max-height: 150px;
    }
  }

  .modal.show .multi-select-options-new {
    z-index: 1061;
  }
`;

const MultiSelectCheckbox = ({
  title,
  options,
  selectedValues,
  onChange,
  icon = "fas fa-list",
  isOpen,
  onToggle
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const sortedOptions = useMemo(() => {
    return [...(options || [])].sort((a, b) =>
      String(a.label || '').localeCompare(String(b.label || ''), undefined, { sensitivity: 'base' })
    );
  }, [options]);

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedOptions;
    return sortedOptions.filter((opt) => String(opt.label || '').toLowerCase().includes(q));
  }, [sortedOptions, searchQuery]);

  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  const handleCheckboxChange = (value) => {
    const key = String(value);
    const newValues = selectedValues.map(String).includes(key)
      ? selectedValues.filter((v) => String(v) !== key)
      : [...selectedValues, key];
    onChange(newValues);
  };

  // Get display text for selected items
  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return `Select ${title}`;
    } else if (selectedValues.length === 1) {
      const selectedOption = sortedOptions.find((opt) => String(opt.value) === String(selectedValues[0]));
      return selectedOption ? selectedOption.label : selectedValues[0];
    } else if (selectedValues.length <= 2) {
      const selectedLabels = selectedValues.map((val) => {
        const option = sortedOptions.find((opt) => String(opt.value) === String(val));
        return option ? option.label : val;
      });
      return selectedLabels.join(', ');
    } else {
      return `${selectedValues.length} items selected`;
    }
  };

  return (
    <div className="multi-select-container-new">
      <label className="form-label small fw-bold text-dark d-flex align-items-center mb-2">
        <i className={`${icon} me-1 text-primary`}></i>
        {title}
        {selectedValues.length > 0 && (
          <span className="badge bg-primary ms-2">{selectedValues.length}</span>
        )}
      </label>

      <div className="multi-select-dropdown-new">
        <button
          type="button"
          className={`form-select multi-select-trigger ${isOpen ? 'open' : ''}`}
          onClick={onToggle}
          style={{ cursor: 'pointer', textAlign: 'left' }}
        >
          <span className="select-display-text">
            {getDisplayText()}
          </span>
          <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} dropdown-arrow`}></i>
        </button>

        {isOpen && (
          <div className="multi-select-options-new">
            {/* Search functionality (optional) */}
            <div className="options-search">
              <div className="input-group input-group-sm">
                <span className="input-group-text" style={{ height: '40px' }}>
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Search ${title.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="options-list-new">
              {filteredOptions.map((option) => (
                <label key={String(option.value)} className="option-item-new">
                  <input
                    type="checkbox"
                    className="form-check-input me-2"
                    checked={selectedValues.map(String).includes(String(option.value))}
                    onChange={() => handleCheckboxChange(option.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="option-label-new">{option.label}</span>
                  {selectedValues.map(String).includes(String(option.value)) && (
                    <i className="fas fa-check text-primary ms-auto"></i>
                  )}
                </label>
              ))}

              {sortedOptions.length === 0 && (
                <div className="no-options">
                  <i className="fas fa-info-circle me-2"></i>
                  No {title.toLowerCase()} available
                </div>
              )}
              {sortedOptions.length > 0 && filteredOptions.length === 0 && (
                <div className="no-options text-muted small">No matches</div>
              )}
            </div>

            {/* Footer with count */}
            {selectedValues.length > 0 && (
              <div className="options-footer">
                <small className="text-muted">
                  {selectedValues.length} of {sortedOptions.length} selected
                </small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const useNavHeight = (dependencies = []) => {
  const navRef = useRef(null);
  const [navHeight, setNavHeight] = useState(140); // Default fallback
  const widthRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [leftOffset, setLeftOffset] = useState(0);

  const calculateHeight = useCallback(() => {
    if (navRef.current) {
      const height = navRef.current.offsetHeight;
      setNavHeight(height);
    }
  }, []);

  const calculateWidth = useCallback(() => {
    if (widthRef.current) {
      const rect = widthRef.current.getBoundingClientRect();
      setWidth(rect.width);
      setLeftOffset(rect.left);
    }
  }, []);


  useEffect(() => {
    // Initial calculation
    calculateHeight();
    calculateWidth();
    // Resize listener
    const handleResize = () => {
      setTimeout(calculateHeight, 100);
      setTimeout(calculateWidth, 100);
    };

    // Mutation observer for nav content changes
    const observer = new MutationObserver(() => {
      setTimeout(calculateHeight, 50);
      setTimeout(calculateWidth, 50);
    });

    window.addEventListener('resize', handleResize);

    if (navRef.current) {
      observer.observe(navRef.current, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [calculateHeight, calculateWidth]);

  // Recalculate when dependencies change
  useEffect(() => {
    setTimeout(calculateHeight, 50);
    setTimeout(calculateWidth, 50);
  }, dependencies);

  return { navRef, navHeight, calculateHeight, width, leftOffset };
};
const useMainWidth = (dependencies = []) => {// Default fallback
  const widthRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [leftOffset, setLeftOffset] = useState(0);

  const calculateWidth = useCallback(() => {
    if (widthRef.current) {
      const rect = widthRef.current.getBoundingClientRect();
      setWidth(rect.width);
      setLeftOffset(rect.left);
    }
  }, []);


  useEffect(() => {
    calculateWidth();
    // Resize listener
    const handleResize = () => {
      setTimeout(calculateWidth, 100);
    };

    // Mutation observer for nav content changes
    const observer = new MutationObserver(() => {
      setTimeout(calculateWidth, 50);
    });

    window.addEventListener('resize', handleResize);

    if (widthRef.current) {
      observer.observe(widthRef.current, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [calculateWidth]);

  // Recalculate when dependencies change
  useEffect(() => {
    setTimeout(calculateWidth, 50);
  }, dependencies);

  return { widthRef, width, leftOffset };
};
const useScrollBlur = (navbarHeight = 140) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;
      const shouldBlur = currentScrollY > navbarHeight / 3;

      setIsScrolled(shouldBlur);
      setScrollY(currentScrollY);
    };

    // Throttle scroll event for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [navbarHeight]);

  return { isScrolled, scrollY, contentRef };
};
const B2BSales = () => {

  const candidateRef = useRef();
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [userData, setUserData] = useState(JSON.parse(sessionStorage.getItem("user") || "{}"));
  const token = userData.token;
  // const permissions = userData.permissions
  const [permissions, setPermissions] = useState();

  useEffect(() => {
    updatedPermission()
  }, [])

  // Console: logged-in institute user and all permissions (for debugging)
  useEffect(() => {
    if (permissions != null && userData?._id) {
      const instituteUser = {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        role: userData.role,
        collegeId: userData.collegeId,
        collegeName: userData.collegeName,
        isDefaultAdmin: userData.isDefaultAdmin,
      };
      console.log('[Institute] Logged-in user:', instituteUser);
      console.log('[Institute] User permissions:', permissions);
      if (permissions?.custom_permissions) {
        console.log('[Institute] Custom permissions:', permissions.custom_permissions);
      }
    }
  }, [permissions, userData]);

  const updatedPermission = async () => {

    const respose = await axios.get(`${backendUrl}/college/permission`, {
      headers: { 'x-auth': token }
    });
    if (respose.data.status) {

      setPermissions(respose.data.permissions);
    }
  }

  const [openModalId, setOpenModalId] = useState(null);

  // const [activeTab, setActiveTab] = useState(0);
  const [activeTab, setActiveTab] = useState({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(null);
  const [activeCrmFilter, setActiveCrmFilter] = useState(0);

  const [leadTab, setLeadTab] = useState('approval'); // add | approval | report
  const [leadApprovalTab, setLeadApprovalTab] = useState('pending'); // pending | approved | rejected
  const [leadApprovalView, setLeadApprovalView] = useState('cards'); // cards | table
  const [performanceTab, setPerformanceTab] = useState('all'); // all | hot | warm | cold | prospect | won (approved leads)
  const [followupChannelTab, setFollowupChannelTab] = useState('calls'); // calls | meeting
  const [followupTab, setFollowupTab] = useState('pending'); // done | pending | scheduled | missed
  const [activitySectionView, setActivitySectionView] = useState('followup'); // followup | documents
  const [cardsView, setCardsView] = useState('lead'); // lead | performance | followup | documents
  const [topbarMenuOpen, setTopbarMenuOpen] = useState(null); // 'lead' | 'performance' | 'followup' | 'documents' | null
  const [followupHoverChannel, setFollowupHoverChannel] = useState(null);
  const [followupHoverSubItem, setFollowupHoverSubItem] = useState(null);
  const topbarMenuRef = useRef(null);
  const topbarMenuCloseTimerRef = useRef(null);
  const [scheduledDays, setScheduledDays] = useState('1'); // for scheduled dropdown (days)
  const scheduledDaysSelectRef = useRef(null);
  const prevFollowupTabRef = useRef('pending');

  const [approvalSummary, setApprovalSummary] = useState({
    total: 0,
    accepted: 0,
    rejected: 0,
    pending: 0,
  });
  const [loadingApprovalSummary, setLoadingApprovalSummary] = useState(false);
  const [approvalListLeads, setApprovalListLeads] = useState([]);
  const [loadingApprovalList, setLoadingApprovalList] = useState(false);

  const [performanceSummary, setPerformanceSummary] = useState({
    all: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    prospect: 0,
    won: 0,
  });
  const [loadingPerformanceSummary, setLoadingPerformanceSummary] = useState(false);
  /** Approved-lead list (Performance section) — separate from CRM `leads` used for Documents / filters */
  const [performanceLeads, setPerformanceLeads] = useState([]);
  const [loadingPerformanceLeads, setLoadingPerformanceLeads] = useState(false);
  const [performancePage, setPerformancePage] = useState(1);
  const [performanceTotalPages, setPerformanceTotalPages] = useState(1);
  const [performanceListTotal, setPerformanceListTotal] = useState(0);

  const [mainContentClass, setMainContentClass] = useState('col-12');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [leadDetailsVisible, setLeadDetailsVisible] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  const [viewMode, setViewMode] = useState('grid');
  const [collapsedLeadCards, setCollapsedLeadCards] = useState(() => new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [counselors, setCounselors] = useState([]);

  // Lead logs state
  const [leadLogsLoading, setLeadLogsLoading] = useState(false);
  const [leadLogs, setLeadLogs] = useState([]);

  // Documents specific state
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentZoom, setDocumentZoom] = useState(1);
  const [documentRotation, setDocumentRotation] = useState(0);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const fileInputRef = useRef(null);

  /** Documents tab: add doc (name + URL) per lead */
  const [leadDocForm, setLeadDocForm] = useState({});
  const [savingLeadDocId, setSavingLeadDocId] = useState(null);
  const [docApprovalKey, setDocApprovalKey] = useState(null);

  // open model for upload documents 
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [currentPreviewUpload, setCurrentPreviewUpload] = useState(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [bulkUploadMessage, setBulkUploadMessage] = useState('');
  const [bulkUploadErrors, setBulkUploadErrors] = useState([]);
  const [bulkUploadSuccess, setBulkUploadSuccess] = useState(false);

  // Bulk inputs state
  const [showBulkInputs, setShowBulkInputs] = useState(false);
  const [bulkMode, setBulkMode] = useState('');
  const [input1Value, setInput1Value] = useState('');

  // Lead form state
  const [leadFormData, setLeadFormData] = useState({
    leadCategory: '',
    typeOfB2B: '',
    businessName: '',
    businessAddress: '',
    concernPersonName: '',
    address: '',
    city: '',
    state: '',
    block: '',
    latitude: '',
    longitude: '',
    designation: '',
    email: '',
    mobile: '',
    whatsapp: '',
    leadOwner: '',
    leadStatus: '',
    lockLeadDays: '60',
    remark: ''
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  const [extractedNumbers, setExtractedNumbers] = useState([]);

  //refer lead stats
  const [concernPersons, setConcernPersons] = useState([]);
  const [selectedConcernPerson, setSelectedConcernPerson] = useState(null);

  //filter stats


  const [selectedProfiles, setSelectedProfiles] = useState([]);

  // Users state for Lead Owner dropdown
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);


  //side pannel stats
  const [showPanel, setShowPanel] = useState('')


  // Loading state for fetchProfileData
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);


  // B2B Dropdown Options
  const [leadCategoryOptions, setLeadCategoryOptions] = useState([]);
  const [typeOfB2BOptions, setTypeOfB2BOptions] = useState([]);

  // Google Maps API
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);

  const businessNameInputRef = useRef(null);
  const cityInputRef = useRef(null);
  const stateInputRef = useRef(null);
  const bulkUploadFileInputRef = useRef(null);
  const [isgoogleLoginLoading, setIsgoogleLoginLoading] = useState(false);


  const handleGoogleLogin = async () => {
    try {
      setIsgoogleLoginLoading(true);

      const result = await getGoogleAuthCode({
        scopes: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/calendar'],
        user: userData
      });


      const refreshToken = await getGoogleRefreshToken({
        code: result,
        user: userData
      });


      const user = {
        ...userData,
        googleAuthToken: refreshToken.data
      }
      sessionStorage.setItem('googleAuthToken', JSON.stringify(refreshToken.data));

      setUserData(user);


    } catch (error) {
      console.error('❌ Login failed:', error);

      // Handle specific popup errors
      if (error.message.includes('Popup blocked')) {
        console.error('Please allow popups for this site and try again.');
      } else if (error.message.includes('closed by user')) {
        console.error('Login cancelled by user.');
      } else {
        console.error('Login failed: ' + error.message);
      }

    } finally {
      setIsgoogleLoginLoading(false);
      setShowPanel('followUp');

    }
    // initiateGoogleAuth();
  };

  const handleGoogleLogout = () => {
    try {
      const updatedUser = { ...userData };
      delete updatedUser.googleAuthToken;
      setUserData(updatedUser);

      // Clear any stored Google auth token from sessionStorage
      sessionStorage.removeItem('googleAuthToken');

      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        delete parsedUser.googleAuthToken;
        sessionStorage.setItem('user', JSON.stringify(parsedUser));
      }

      alert('Disconnected from Google Calendar successfully.');
    } catch (err) {
      console.error('Error while disconnecting Google Calendar:', err);
    }
  };

  // Simple function to add follow-up to Google Calendar
  // Function to clear all follow-up form data
  const clearFollowupFormData = () => {
    setFollowupFormData({
      followupDate: '',
      followupTime: '',
      followupType: followupChannelTab === 'meeting' ? 'Meeting' : 'Call',
      remarks: '',
      additionalRemarks: '',
      selectedProfile: null,
      selectedConcernPerson: null,
      selectedProfiles: null,
      selectedCounselor: null,
      selectedDocument: null
    });
  };

  const addFollowUpToGoogleCalendar = async (e) => {
    e.preventDefault();

    try {
      // Check if user has Google token
      if (!userData.googleAuthToken?.accessToken) {
        alert('Please login with Google first');
        return;
      }

      // Determine whether follow-up fields are filled
      const hasFollowup =
        (showPanel === 'followUp') ||
        (showPanel === 'editPanel' && seletectedSubStatus && seletectedSubStatus.hasFollowup);

      const hasFollowupData =
        hasFollowup && followupFormData.followupDate && followupFormData.followupTime;

      // Normalise date value for API (string or Date instance)
      const followupDateValue = followupFormData.followupDate instanceof Date
        ? followupFormData.followupDate.toISOString()
        : followupFormData.followupDate;

      // 1) Edit panel: change status (and optionally set follow-up + Google Calendar) via B2B status API
      if (showPanel === 'editPanel' && selectedProfile && seletectedStatus) {
        const statusData = {
          status: seletectedStatus,
          subStatus: seletectedSubStatus?._id || null,
          remarks: followupFormData.remarks || 'Status updated via B2B panel'
        };

        if (hasFollowupData) {
          statusData.followUpDate = followupDateValue;
          statusData.followUpTime = followupFormData.followupTime;
          statusData.followUpType = followupFormData.followupType || (followupChannelTab === 'meeting' ? 'Meeting' : 'Call');
          statusData.googleCalendarEvent = true;
        }

        await updateLeadStatus(selectedProfile._id, statusData);

        if (hasFollowupData) {
          alert('✅ Status and follow-up updated successfully!');
        } else {
          alert('✅ Status updated successfully!');
        }
      }

      // 2) Standalone follow-up panel: create follow-up (and Google Calendar event) via B2B follow-up API
      if (showPanel === 'followUp' && selectedProfile && hasFollowupData) {
        await axios.post(
          `${backendUrl}/college/b2b_copy/leads/${selectedProfile._id}/followup`,
          {
            followUpType: followupFormData.followupType || (followupChannelTab === 'meeting' ? 'Meeting' : 'Call'),
            scheduledDate: followupDateValue,
            scheduledTime: followupFormData.followupTime,
            remarks: followupFormData.remarks || '',
            googleCalendarEvent: true
          },
          {
            headers: { 'x-auth': token }
          }
        );

        alert('✅ Follow-up saved and scheduled successfully!');
      }

      window.dispatchEvent(new CustomEvent('b2b-followup-updated'));
    } catch (error) {
      console.error('❌ Error in addFollowUpToGoogleCalendar:', error);
      alert('❌ Error processing request');
    } finally {
      closePanel();
    }
  };

  const initializeBusinessNameAutocomplete = () => {

    // Check if Google Maps is available
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    // Get input element using ref
    const input = businessNameInputRef.current;
    if (!input) {
      return;
    }


    // Remove any existing autocomplete to prevent duplicates
    if (input.autocomplete) {
      window.google.maps.event.clearInstanceListeners(input);
    }

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['establishment'],
      componentRestrictions: { country: 'in' },
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place || !place.geometry || !place.geometry.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      const placeNameOnly = place.name || input.value;

      setLeadFormData(prev => ({
        ...prev,
        businessName: placeNameOnly
      }));

      let city = '', state = '';
      place.address_components?.forEach((component) => {
        const types = component.types.join(',');
        if (types.includes("locality")) city = component.long_name;
        if (types.includes("administrative_area_level_1")) state = component.long_name;
        if (!city && types.includes("sublocality_level_1")) city = component.long_name;
      });

      setLeadFormData(prev => ({
        ...prev,
        city: city,
        state: state,
        latitude: lat,
        longitude: lng
      }));

      setLeadFormData(prev => ({
        ...prev,
        address: place.formatted_address || ''
      }));
    });

    // Store reference to autocomplete
    input.autocomplete = autocomplete;
  };

  const initializeCityAutocomplete = () => {
    // Check if Google Maps is available
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    // Get input element using ref
    const input = cityInputRef.current;
    if (!input) {
      return;
    }

    // Remove any existing autocomplete to prevent duplicates
    if (input.autocomplete) {
      window.google.maps.event.clearInstanceListeners(input);
    }

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['(cities)'],
      componentRestrictions: { country: 'in' },
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place) return;

      let city = '';
      place.address_components?.forEach((component) => {
        const types = component.types.join(',');
        if (types.includes("locality")) city = component.long_name;
        if (!city && types.includes("sublocality_level_1")) city = component.long_name;
      });

      setLeadFormData(prev => ({
        ...prev,
        city: city || place.name || input.value
      }));
    });

    // Store reference to autocomplete
    input.autocomplete = autocomplete;
  };

  const initializeStateAutocomplete = () => {
    // Check if Google Maps is available
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    // Get input element using ref
    const input = stateInputRef.current;
    if (!input) {
      return;
    }

    // Remove any existing autocomplete to prevent duplicates
    if (input.autocomplete) {
      window.google.maps.event.clearInstanceListeners(input);
    }

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['administrative_area_level_1'],
      componentRestrictions: { country: 'in' },
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place) return;

      let state = '';
      place.address_components?.forEach((component) => {
        const types = component.types.join(',');
        if (types.includes("administrative_area_level_1")) state = component.long_name;
      });

      setLeadFormData(prev => ({
        ...prev,
        state: state || place.name || input.value
      }));
    });

    // Store reference to autocomplete
    input.autocomplete = autocomplete;
  };

  // Fetch filter options from backend API on mount

  useEffect(() => {
    fetchB2BDropdownOptions();
    fetchUsers(); // Fetch users for Lead Owner dropdown
    fetchStatusCounts(); // Fetch status counts
  }, []);


  // Initialize autocomplete when modal is opened
  useEffect(() => {
    if (showAddLeadModal) {
      // Default Lead Owner to logged-in user (and keep it locked)
      // Depend on userData so it works even if user loads slightly later.
      if (userData?._id) {
        setLeadFormData((prev) => ({
          ...prev,
          leadOwner: userData._id,
        }));
      }

      // Small delay to ensure modal is fully rendered and Google Maps is loaded
      const timer = setTimeout(() => {
        initializeBusinessNameAutocomplete();
        initializeCityAutocomplete();
        initializeStateAutocomplete();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [showAddLeadModal, userData?._id]);

  // Fetch B2B dropdown options
  const fetchB2BDropdownOptions = async () => {
    try {
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

      // Fetch Lead Categories (only active)
      const leadCategoriesRes = await axios.get(`${backendUrl}/college/b2b_copy/lead-categories?status=true`, {
        headers: { 'x-auth': token }
      });
      if (leadCategoriesRes.data.status) {
        const opts = leadCategoriesRes.data.data
          .filter(cat => cat.isActive === true)
          .map(cat => ({
            value: cat._id,
            label: cat.name || cat.title
          }))
          .sort((a, b) => String(a.label || '').localeCompare(String(b.label || ''), undefined, { sensitivity: 'base' }));
        setLeadCategoryOptions(opts);
      }

      // Fetch Type of B2B (only active)
      const typeOfB2BRes = await axios.get(`${backendUrl}/college/b2b_copy/type-of-b2b?status=true`, {
        headers: { 'x-auth': token }
      });
      if (typeOfB2BRes.data.status) {
        const opts = typeOfB2BRes.data.data
          .filter(type => type.isActive === true)
          .map(type => ({
            value: type._id,
            label: type.name
          }))
          .sort((a, b) => String(a.label || '').localeCompare(String(b.label || ''), undefined, { sensitivity: 'base' }));
        setTypeOfB2BOptions(opts);
      }
    } catch (err) {
      console.error('Failed to fetch B2B dropdown options:', err);
    }
  };



  // Fetch users for Lead Owner dropdown
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

      const response = await axios.get(`${backendUrl}/college/users/b2b-users`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        // Update users state with detailed access summary
        setUsers(response.data.data);
      } else {
        console.error('Failed to fetch users:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };






  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Mobile/WhatsApp number validation function
  // Note: For this screen we accept any 10-digit number (0-9),
  // because UI copy says "Enter 10-digit mobile" without 6-9 restriction.
  const validateMobileNumber = (number) => {
    if (number == null) return false;
    // Remove all non-digit characters
    const cleanNumber = String(number).replace(/\D/g, '');
    const mobileRegex = /^\d{10}$/;
    return mobileRegex.test(cleanNumber);
  };

  // Extract mobile/WhatsApp numbers from text
  const extractMobileNumbers = (text) => {
    if (!text) return [];

    // Regex to match various mobile number formats
    const mobileRegex = /(?:\+91[\s-]?)?[6-9]\d{9}|(?:\+91[\s-]?)?[0-9]{10}/g;
    const matches = text.match(mobileRegex) || [];

    // Clean and validate numbers
    const validNumbers = matches
      .map(num => num.replace(/\D/g, ''))
      .filter(num => {
        // Remove +91 prefix if present and validate
        const cleanNum = num.startsWith('91') && num.length === 12 ? num.slice(2) : num;
        return validateMobileNumber(cleanNum);
      })
      .map(num => {
        // Remove +91 prefix if present
        return num.startsWith('91') && num.length === 12 ? num.slice(2) : num;
      });

    // Return unique numbers (max 10)
    return [...new Set(validNumbers)].slice(0, 10);
  };

  // Handle lead form input changes
  const handleLeadInputChange = (e) => {
    const { name, value } = e.target;

    setLeadFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Extract numbers from mobile and whatsapp fields
    if (name === 'mobile' || name === 'whatsapp') {
      const extracted = extractMobileNumbers(value);
      setExtractedNumbers(extracted);
    }
  };

  const handleLeadSelectChange = (fieldName) => (selectedOption) => {
    setLeadFormData((prev) => ({
      ...prev,
      [fieldName]: selectedOption?.value ?? '',
    }));
    if (formErrors[fieldName]) {
      setFormErrors((prev) => ({
        ...prev,
        [fieldName]: '',
      }));
    }
  };

  const leadFormSelectStyles = (hasError) => ({
    control: (base, state) => ({
      ...base,
      minHeight: 38,
      borderColor: hasError ? '#dc3545' : state.isFocused ? '#86b7fe' : '#ced4da',
      boxShadow: state.isFocused
        ? hasError
          ? '0 0 0 0.2rem rgba(220, 53, 69, 0.25)'
          : '0 0 0 0.2rem rgba(13, 110, 253, 0.25)'
        : 'none',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 10070 }),
  });

  // Handle mobile number input with validation
  const handleLeadMobileChange = (e) => {
    const { name, value } = e.target;

    if (name === 'mobile') {
      if (value.length > 10) {
        setFormErrors(prev => ({
          ...prev,
          mobile: 'Mobile number should be 10 digits'
        }));
      }
    }

    // Only allow digits, spaces, hyphens, and plus sign
    const cleanValue = value.replace(/[^\d\s\-+]/g, '');

    setLeadFormData(prev => ({
      ...prev,
      [name]: cleanValue
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Extract numbers
    const extracted = extractMobileNumbers(cleanValue);
    setExtractedNumbers(extracted);
  };

  // Validate lead form
  const validateLeadForm = () => {
    const errors = {};

    // Required field validation
    if (!leadFormData.leadCategory) errors.leadCategory = 'Lead Source is required';
    if (!leadFormData.typeOfB2B) errors.typeOfB2B = 'B2B type is required';
    if (!leadFormData.businessName) errors.businessName = 'Business name is required';
    if (!leadFormData.concernPersonName) errors.concernPersonName = 'Concern person name is required';
    // if (!leadFormData.landlineNumber) errors.landlineNumber = 'Landline number is required';
    // Email validation
    // if (!leadFormData.email) {
    //   errors.email = 'Email is required';
    // } else if (!validateEmail(leadFormData.email)) {
    //   errors.email = 'Please enter a valid email address';
    // }

    // Mobile validation
    if (!leadFormData.mobile) {
      errors.mobile = 'Mobile number is required';
    } else if (!validateMobileNumber(leadFormData.mobile)) {
      errors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    // Lead Status and Lock Lead (same as LRP requirements)
    if (!leadFormData.leadStatus) errors.leadStatus = 'Lead status is required';
    if (!leadFormData.lockLeadDays) errors.lockLeadDays = 'Lock duration is required';

    // WhatsApp validation (optional but validate if provided)
    if (leadFormData.whatsapp && !validateMobileNumber(leadFormData.whatsapp)) {
      errors.whatsapp = 'Please enter a valid 10-digit WhatsApp number';
    }

    // Landline number validation
    // if (!leadFormData.landlineNumber) {
    //   errors.landlineNumber = 'Landline number is required';
    // } else if (!validateMobileNumber(leadFormData.landlineNumber)) {
    //   errors.landlineNumber = 'Please enter a valid 10-digit landline number';
    // }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add state for leads data
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [submitterReportRows, setSubmitterReportRows] = useState([]);
  const [submitterReportSummary, setSubmitterReportSummary] = useState(null);
  const [loadingSubmitterReport, setLoadingSubmitterReport] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  const [followupLeadsData, setFollowupLeadsData] = useState([]);
  const [loadingFollowupLeads, setLoadingFollowupLeads] = useState(false);

  // Add state for status counts
  const [statusCounts, setStatusCounts] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loadingStatusCounts, setLoadingStatusCounts] = useState(false);
  const pipelineStatusCounts = useMemo(() => buildPipelineStatusBar(statusCounts), [statusCounts]);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    leadCategory: [],
    typeOfB2B: [],
    leadOwner: [],
    dateRange: {
      start: null,
      end: null
    },
    status: [],
    subStatus: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filterMultiOpenKey, setFilterMultiOpenKey] = useState(null);

  const fetchFollowupLeads = async (filterOverrides = {}) => {
    if (!token) return;
    try {
      setLoadingFollowupLeads(true);
      const eff = { ...filters, ...filterOverrides };

      const params = {
        page: 1,
        limit: 500,
        hasFollowUp: true,
      };

      appendB2bCopyFilterQueryParams(params, eff);
      params.approvalStatus = eff.approvalStatus != null && eff.approvalStatus !== '' ? eff.approvalStatus : 'Approved';

      const response = await axios.get(`${backendUrl}/college/b2b_copy/leads`, {
        headers: { 'x-auth': token },
        params,
      });

      if (response.data?.status) {
        const fetched = dedupeLeadsById(response.data?.data?.leads || []);
        setFollowupLeadsData(fetched);
      } else {
        setFollowupLeadsData([]);
      }
    } catch (e) {
      console.error('fetchFollowupLeads', e);
      setFollowupLeadsData([]);
    } finally {
      setLoadingFollowupLeads(false);
    }
  };

  useEffect(() => {
    fetchLeads(selectedStatusFilter, 1);
    fetchFollowupLeads();
    fetchStatusCounts();
    fetchPerformanceSummary();
    fetchPerformanceLeads(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPerformanceLeads(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performanceTab]);

  useEffect(() => {
    const handler = () => {
      fetchFollowupLeads();
    };
    window.addEventListener('b2b-followup-updated', handler);
    return () => window.removeEventListener('b2b-followup-updated', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setFollowupFormData((prev) => ({
      ...prev,
      followupType: followupChannelTab === 'meeting' ? 'Meeting' : 'Call',
    }));
  }, [followupChannelTab]);

  // Open the "Next X days" select when user switches into Scheduled (not on every re-render)
  useEffect(() => {
    const prev = prevFollowupTabRef.current;
    prevFollowupTabRef.current = followupTab;
    if (followupTab !== 'scheduled') return;
    if (prev === 'scheduled') return;

    const raf = window.requestAnimationFrame(() => {
      const el = scheduledDaysSelectRef.current;
      if (!el) return;
      if (typeof el.showPicker === 'function') {
        try {
          el.showPicker();
        } catch {
          el.focus();
        }
      } else {
        el.focus();
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [followupTab]);

  useEffect(() => {
    if (!topbarMenuOpen) return;
    const close = (e) => {
      if (topbarMenuRef.current && !topbarMenuRef.current.contains(e.target)) {
        setTopbarMenuOpen(null);
        setFollowupHoverChannel(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [topbarMenuOpen]);

  useEffect(() => {
    if (topbarMenuOpen !== 'followup') {
      setFollowupHoverChannel(null);
    }
  }, [topbarMenuOpen]);

  useEffect(() => {
    if (!topbarMenuOpen || !topbarMenuRef.current) return;

    const colorMapByMenu = {
      performance: {
        All: { background: '#6b7280', color: '#fff' },
        Hot: { background: '#dc3545', color: '#fff' },
        Warm: { background: '#f59e0b', color: '#111827' },
        Cold: { background: '#0ea5e9', color: '#fff' },
        Prospect: { background: '#198754', color: '#fff' },
        Won: { background: '#0f766e', color: '#fff' },
      },
      followup: {
        Done: { background: '#198754', color: '#fff' },
        Pending: { background: '#f59e0b', color: '#111827' },
        Scheduled: { background: '#0ea5e9', color: '#fff' },
        Missed: { background: '#dc3545', color: '#fff' },
      },
    };

    const colorMap = colorMapByMenu[topbarMenuOpen];
    if (!colorMap) return;

    const menuItems = topbarMenuRef.current.querySelectorAll('[role="menuitem"]');
    menuItems.forEach((item) => {
      const spans = item.querySelectorAll('span');
      if (spans.length < 2) return;

      const label = spans[0]?.textContent?.trim();
      const badge = spans[1];
      const style = colorMap[label];
      if (!badge || !style) return;

      badge.style.background = style.background;
      badge.style.color = style.color;
    });
  }, [
    topbarMenuOpen,
    loadingPerformanceSummary,
    performanceSummary,
    loadingFollowupLeads,
    followupLeadsData,
  ]);

  const fetchPerformanceSummary = async () => {
    if (!token) return;
    try {
      setLoadingPerformanceSummary(true);
      const response = await axios.get(`${backendUrl}/college/b2b_copy/leads/performance-summary`, {
        headers: { 'x-auth': token },
      });
      if (response.data.status && response.data.data) {
        setPerformanceSummary(response.data.data);
      }
    } catch (e) {
      console.error('fetchPerformanceSummary', e);
    } finally {
      setLoadingPerformanceSummary(false);
    }
  };

  // Auto-select leads based on Input 1 value for bulk refer (Performance list = approved leads)
  useEffect(() => {
    if (bulkMode !== 'bulkrefer') {
      return;
    }

    if (!performanceLeads || performanceLeads.length === 0) {
      return;
    }

    const numValue = input1Value === '' ? 0 : parseInt(input1Value, 10);

    if (isNaN(numValue) || numValue < 1) {
      setSelectedProfiles([]);
      return;
    }

    const totalAvailableLeads = performanceListTotal || performanceLeads.length;
    const validNumValue = Math.min(numValue, totalAvailableLeads);

    if (validNumValue > performanceLeads.length && validNumValue > 0) {
      const fetchLeadsForSelection = async () => {
        if (!token) return;

        try {
          const eff = { ...filters };
          const params = {
            page: 1,
            limit: validNumValue.toString(),
            approvalStatus: 'Approved',
            ...(performanceTab !== 'all' ? { leadStatus: performanceTab } : {}),
          };
          appendB2bCopyFilterQueryParams(params, eff);

          const response = await axios.get(`${backendUrl}/college/b2b_copy/leads`, {
            headers: { 'x-auth': token },
            params: params
          });

          if (response.data.status && response.data.data.leads) {
            const fetchedLeads = dedupeLeadsById(response.data.data.leads);
            const selectedLeadsData = fetchedLeads.slice(0, validNumValue);
            const leadsToSelect = selectedLeadsData.map(lead => lead._id);
            setSelectedProfiles(leadsToSelect);
          }
        } catch (error) {
          console.error('Error fetching leads for selection:', error);
          const selectedLeadsData = performanceLeads.slice(0, Math.min(validNumValue, performanceLeads.length));
          const leadsToSelect = selectedLeadsData.map(lead => lead._id);
          setSelectedProfiles(leadsToSelect);
        }
      };

      fetchLeadsForSelection();
    } else {
      const selectedLeadsData = performanceLeads.slice(0, validNumValue);
      const leadsToSelect = selectedLeadsData.map(lead => lead._id);
      setSelectedProfiles(leadsToSelect);
    }
  }, [input1Value, bulkMode, performanceLeads, performanceListTotal, performanceTab, filters, token]);

  const scrollToB2bSection = useCallback((sectionId) => {
    const el = typeof document !== 'undefined' ? document.getElementById(sectionId) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const openTopbarMenu = useCallback((key) => {
    if (topbarMenuCloseTimerRef.current) {
      window.clearTimeout(topbarMenuCloseTimerRef.current);
      topbarMenuCloseTimerRef.current = null;
    }
    setTopbarMenuOpen(key);
  }, []);

  const scheduleCloseTopbarMenu = useCallback(() => {
    if (topbarMenuCloseTimerRef.current) {
      window.clearTimeout(topbarMenuCloseTimerRef.current);
    }
    topbarMenuCloseTimerRef.current = window.setTimeout(() => {
      setTopbarMenuOpen(null);
      topbarMenuCloseTimerRef.current = null;
    }, 200);
  }, []);

  const toggleTopbarMenu = useCallback((key) => {
    setTopbarMenuOpen((cur) => (cur === key ? null : key));
  }, []);

  // CRM Pipeline pill click (single or merged status ids)
  const handlePipelineStatusClick = (statusIds) => {
    const ids = [...new Set((Array.isArray(statusIds) ? statusIds : [statusIds]).filter(Boolean))].map(String);
    if (ids.length === 0) return;
    const filterVal = ids.length === 1 ? ids[0] : ids;
    setSelectedStatusFilter(filterVal);
    setCurrentPage(1);
    setCardsView('lead');
    setLeadTab('report');
    setCollapsedLeadCards(() => new Set());
    fetchLeads(filterVal, 1);
    fetchFollowupLeads(
      ids.length === 1
        ? { status: ids[0], statusIn: null }
        : { status: null, statusIn: ids.join(',') }
    );
    window.setTimeout(() => scrollToB2bSection('b2b-section-lead'), 50);
  };

  // Handle total card click (show all leads)
  const handleTotalCardClick = () => {
    // console.log('📊 [FRONTEND] Total Card Clicked:', {
    //   currentFilters: filters,
    //   leadOwnerFilter: filters.leadOwner
    // });
    setSelectedStatusFilter(null);
    setCurrentPage(1);
    setCardsView('lead');
    setLeadTab('report');
    setCollapsedLeadCards(() => new Set());
    fetchLeads(null, 1);
    fetchFollowupLeads({ status: null, statusIn: null, subStatus: null });
    window.setTimeout(() => scrollToB2bSection('b2b-section-lead'), 50);
  };

  const getSubStatusTitle = useCallback((lead) => {
    if (!lead?.subStatus) return null;
    const subId = typeof lead.subStatus === 'object' ? lead.subStatus?._id : lead.subStatus;
    const substatus = lead.status?.substatuses?.find((sub) => String(sub._id) === String(subId));
    return substatus?.title || (typeof lead.subStatus === 'object' ? (lead.subStatus?.title || 'No Sub-Status') : 'No Sub-Status');
  }, []);


  const renderFloatingLeadStatusChips = useCallback((lead) => {
    const rawPerf = lead?.leadStatus != null ? String(lead.leadStatus).toLowerCase().trim() : '';
    const perfLabel = rawPerf ? PERF_LEAD_STATUS_LABEL[rawPerf] || rawPerf : null;
    const perfSt = rawPerf ? PERF_LEAD_STATUS_CHIP[rawPerf] || { border: '#94a3b8', color: '#475569' } : null;
    const crmMain = lead?.status?.title || lead?.status?.name || 'No Status';
    return (
      <>
        {perfLabel && perfSt && (
          <span
            title="Lead Status"
            style={{
              background: '#fff',
              border: `1.5px solid ${perfSt.border}`,
              color: perfSt.color,
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '999px',
              padding: '2px 9px',
              boxShadow: '0 1px 4px rgba(15,23,42,0.08)',
              cursor: 'default',
              whiteSpace: 'nowrap',
            }}
          >
            {perfLabel}
          </span>
        )}
        <span
          title={`CRM pipeline: ${crmMain}`}
          style={{
            background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '999px',
            padding: '2px 9px',
            boxShadow: '0 2px 8px rgba(255,77,122,0.25)',
            cursor: 'default',
            whiteSpace: 'nowrap',
          }}
        >
          {crmMain}
        </span>
      </>
    );
  }, []);

  const getLeadAgeText = useCallback((lead) => {
    const createdAt = lead?.createdAt ? new Date(lead.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return '—';
    const diffMs = Date.now() - createdAt.getTime();
    if (diffMs < 0) return '—';
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days >= 1) return `${days}d ${hours}h`;
    return `${hours}h`;
  }, []);

  const getLockText = useCallback((lead) => {
    const lockDays = Number(lead?.lockLeadDays);
    const createdAt = lead?.createdAt ? new Date(lead.createdAt) : null;
    if (!lockDays || !createdAt || Number.isNaN(createdAt.getTime())) return '—';
    const lockUntilMs = createdAt.getTime() + lockDays * 24 * 60 * 60 * 1000;
    const remainingMs = lockUntilMs - Date.now();
    if (remainingMs <= 0) return 'Unlocked';
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    return `Locked (${remainingDays}d left)`;
  }, []);

  const getLeadOwnerName = useCallback((lead) => {
    const owner = lead?.leadOwner;
    if (!owner) return '—';
    if (typeof owner === 'object' && owner !== null) return owner?.name || '—';
    const match = (users || []).find((u) => String(u?._id) === String(owner));
    return match?.name || '—';
  }, [users]);

  const getLeadAddedByName = useCallback((lead) => {
    const added = lead?.leadAddedBy;
    if (!added) return '—';
    if (typeof added === 'object' && added !== null) return added?.name || '—';
    const match = (users || []).find((u) => String(u?._id) === String(added));
    return match?.name || '—';
  }, [users]);

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFilterMultiChange = (key, newValues) => {
    setFilters((prev) => ({ ...prev, [key]: newValues }));
  };

  const toggleFilterMulti = (key) => {
    setFilterMultiOpenKey((prev) => (prev === key ? null : key));
  };

  const handleDateRangeChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: value
      }
    }));
  };

  const fetchSubmitterReport = async (filterOverrides = {}) => {
    if (!token) return;
    try {
      setLoadingSubmitterReport(true);
      const eff = { ...filters, ...filterOverrides };
      const params = {};
      appendB2bCopyFilterQueryParams(params, eff);
      const response = await axios.get(`${backendUrl}/college/b2b_copy/leads/submitter-report`, {
        headers: { 'x-auth': token },
        params,
      });
      if (response.data?.status) {
        setSubmitterReportRows(response.data.data?.rows || []);
        setSubmitterReportSummary(response.data.data?.summary || null);
      }
    } catch (e) {
      console.error('fetchSubmitterReport', e);
      setSubmitterReportRows([]);
      setSubmitterReportSummary(null);
    } finally {
      setLoadingSubmitterReport(false);
    }
  };

  const applyFilters = (filterOverrides = {}) => {
    setCurrentPage(1);
    fetchLeads(selectedStatusFilter, 1, filterOverrides);
    fetchStatusCounts(filterOverrides);
    fetchPerformanceLeads(1);
    fetchFollowupLeads();
    if (leadTab === 'report') fetchSubmitterReport(filterOverrides);
  };

  const clearFilters = () => {
    const cleared = {
      search: '',
      leadCategory: [],
      typeOfB2B: [],
      leadOwner: [],
      dateRange: {
        start: null,
        end: null
      },
      status: [],
      subStatus: []
    };
    setFilters(cleared);
    setCurrentPage(1);
    fetchLeads(selectedStatusFilter, 1);
    fetchStatusCounts();
    fetchPerformanceLeads(1);
    fetchFollowupLeads();
    if (leadTab === 'report') fetchSubmitterReport(cleared);
  };

  const fetchLeads = async (statusFilter = null, page = 1, filterOverrides = {}) => {
    try {
      closePanel();
      setLoadingLeads(true);

      const eff = { fetchLimit: 300, ...filters, ...filterOverrides };

      // Build query parameters
      const params = {
        page: page,
        // limit: 10,           
      };

      if (statusFilter) {
        if (Array.isArray(statusFilter)) {
          const ids = [...new Set(statusFilter.map(String).filter(Boolean))];
          if (ids.length === 1) params.status = ids[0];
          else if (ids.length > 1) params.statusIn = ids.join(',');
        } else {
          params.status = statusFilter;
        }
      }

      appendB2bCopyFilterQueryParams(params, eff);
      if (eff.performanceLeadStatus) {
        params.leadStatus = eff.performanceLeadStatus;
      }
      if (eff.fetchLimit) {
        params.limit = eff.fetchLimit;
      }
      // B2B Sales Copy: CRM pipeline + lead list only after approval
      params.approvalStatus = 'Approved';

      // console.log('🔍 [FRONTEND] fetchLeads called:', {
      //   statusFilter,
      //   page,
      //   filters: filters,
      //   params: params,
      //   leadOwnerInFilters: filters.leadOwner,
      //   leadOwnerInParams: params.leadOwner
      // });

      const response = await axios.get(`${backendUrl}/college/b2b_copy/leads`, {
        headers: { 'x-auth': token },
        params: params
      });

      if (response.data.status) {
        const fetchedLeads = dedupeLeadsById(response.data.data.leads || []);

        // console.log('📥 [FRONTEND] Response received:', {
        //   status: response.data.status,
        //   leadsCount: fetchedLeads.length,
        //   pagination: response.data.data?.pagination,
        //   message: response.data.message,
        //   appliedFilter: filters.leadOwner ? `leadOwner: ${filters.leadOwner}` : 'No filter'
        // });

        // Debug: Log leadOwner data from response
        // if (fetchedLeads.length > 0) {
        //   console.log('👤 [FRONTEND] Lead Owner Data Received:');
        //   fetchedLeads.slice(0, 3).forEach((lead, index) => {
        //     console.log(`  Lead ${index + 1}:`, {
        //       businessName: lead.businessName,
        //       leadOwner: lead.leadOwner,
        //       leadOwnerId: lead.leadOwner?._id || lead.leadOwner || 'null',
        //       leadOwnerName: lead.leadOwner?.name || 'No Owner',
        //       leadOwnerEmail: lead.leadOwner?.email || 'N/A',
        //       leadAddedBy: lead.leadAddedBy,
        //       leadAddedByName: lead.leadAddedBy?.name || 'No Added By'
        //     });
        //   });
        // } else {
        //   console.log('⚠️ [FRONTEND] No leads in response - Setting empty array');
        // }

        // console.log('🔄 [FRONTEND] Updating leads state:', {
        //   previousLeadsCount: leads.length,
        //   newLeadsCount: fetchedLeads.length,
        //   willClear: fetchedLeads.length === 0
        // });

        setLeads(fetchedLeads);
        // ✅ Extract pagination data from backend response
        if (response.data.data.pagination) {
          setTotalPages(response.data.data.pagination.totalPages || 1);
          setCurrentPage(response.data.data.pagination.currentPage || 1);
          setPageSize(response.data.data.pagination.totalLeads || 0);
        }

        // console.log('✅ [FRONTEND] Leads state updated');
      } else {
        console.error('❌ [FRONTEND] Failed to fetch leads:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchPerformanceLeads = async (page = 1) => {
    if (!token) return;
    try {
      closePanel();
      setLoadingPerformanceLeads(true);
      const eff = {
        ...filters,
        approvalStatus: 'Approved',
        fetchLimit: 200,
        ...(performanceTab !== 'all' ? { performanceLeadStatus: performanceTab } : {}),
      };
      const params = { page };
      appendB2bCopyFilterQueryParams(params, eff);
      if (eff.approvalStatus) params.approvalStatus = eff.approvalStatus;
      if (eff.performanceLeadStatus) params.leadStatus = eff.performanceLeadStatus;
      if (eff.fetchLimit) params.limit = eff.fetchLimit;

      const response = await axios.get(`${backendUrl}/college/b2b_copy/leads`, {
        headers: { 'x-auth': token },
        params,
      });

      if (response.data.status) {
        setPerformanceLeads(dedupeLeadsById(response.data.data.leads || []));
        if (response.data.data.pagination) {
          setPerformanceTotalPages(response.data.data.pagination.totalPages || 1);
          setPerformancePage(response.data.data.pagination.currentPage || page);
          setPerformanceListTotal(response.data.data.pagination.totalLeads || 0);
        }
      }
    } catch (error) {
      console.error('fetchPerformanceLeads', error);
    } finally {
      setLoadingPerformanceLeads(false);
    }
  };

  // Fetch status counts
  const fetchStatusCounts = async (filterOverrides = {}) => {
    try {
      setLoadingStatusCounts(true);
      const eff = { ...filters, ...filterOverrides };
      // Build params with current filters (except status filter, as we're counting by status)
      const params = { approvalStatus: 'Approved' };
      appendB2bCopyFilterQueryParams(params, eff, { omitStatus: true });

      const response = await axios.get(`${backendUrl}/college/b2b_copy/leads/status-count`, {
        headers: { 'x-auth': token },
        params: params
      });

      if (response.data.status) {
        setStatusCounts(response.data.data.statusCounts || []);
        setTotalLeads(response.data.data.totalLeads || 0);
      } else {
        console.error('Failed to fetch status counts:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching status counts:', error);
    } finally {
      setLoadingStatusCounts(false);
    }
  };

  const fetchApprovalSummary = async () => {
    if (!token) return;
    try {
      setLoadingApprovalSummary(true);
      const response = await axios.get(`${backendUrl}/college/b2b_copy/leads/approval-summary`, {
        headers: { 'x-auth': token },
      });
      if (response.data.status && response.data.data) {
        setApprovalSummary(response.data.data);
      }
    } catch (e) {
      console.error('fetchApprovalSummary', e);
    } finally {
      setLoadingApprovalSummary(false);
    }
  };

  const handleApprovalDecision = async (leadId, decision) => {
    if (!leadId || !['Approved', 'Rejected'].includes(decision)) return;
    try {
      const response = await axios.patch(
        `${backendUrl}/college/b2b_copy/leads/${leadId}/approval`,
        { decision },
        { headers: { 'x-auth': token, 'Content-Type': 'application/json' } }
      );
      if (!response.data.status) {
        alert(response.data.message || 'Failed to update approval');
        return;
      }
      await fetchApprovalSummary();
      fetchPerformanceSummary();
      const map = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
      const approvalStatus = leadApprovalTab === 'all' ? null : map[leadApprovalTab];
      const listRes = await axios.get(`${backendUrl}/college/b2b_copy/leads`, {
        headers: { 'x-auth': token },
        params: { ...(approvalStatus ? { approvalStatus } : {}), limit: 500, page: 1 },
      });
      if (listRes.data.status) {
        setApprovalListLeads(dedupeLeadsById(listRes.data.data.leads || []));
      }
      fetchPerformanceLeads(1);
      fetchLeads(selectedStatusFilter, 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update approval');
    }
  };

  const getLeadDocForm = (leadId) => leadDocForm[leadId] || { name: '', fileUrl: '' };

  const setLeadDocFormField = (leadId, field, value) => {
    setLeadDocForm((prev) => {
      const cur = prev[leadId] || { name: '', fileUrl: '' };
      return { ...prev, [leadId]: { ...cur, [field]: value } };
    });
  };

  const handleAddLeadDocument = async (leadId) => {
    const { name, fileUrl } = getLeadDocForm(leadId);
    if (!name?.trim() || !fileUrl?.trim()) {
      alert('Document name aur file URL dono zaroori hain (pehle file upload karke URL paste karein).');
      return;
    }
    setSavingLeadDocId(leadId);
    try {
      const res = await axios.post(
        `${backendUrl}/college/b2b_copy/leads/${leadId}/documents`,
        { name: name.trim(), fileUrl: fileUrl.trim() },
        { headers: { 'x-auth': token, 'Content-Type': 'application/json' } }
      );
      if (!res.data?.status) {
        alert(res.data?.message || 'Failed to add document');
        return;
      }
      const updated = res.data.data;
      setLeads((prev) => prev.map((l) => (String(l._id) === String(leadId) ? updated : l)));
      setLeadDocForm((prev) => ({ ...prev, [leadId]: { name: '', fileUrl: '' } }));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add document');
    } finally {
      setSavingLeadDocId(null);
    }
  };

  const handleLeadDocumentApproval = async (leadId, docId, decision) => {
    if (!leadId || !docId || !['Approved', 'Rejected'].includes(decision)) return;
    const key = `${leadId}:${docId}`;
    setDocApprovalKey(key);
    try {
      const res = await axios.patch(
        `${backendUrl}/college/b2b_copy/leads/${leadId}/documents/${docId}/approval`,
        { decision },
        { headers: { 'x-auth': token, 'Content-Type': 'application/json' } }
      );
      if (!res.data?.status) {
        alert(res.data?.message || 'Update failed');
        return;
      }
      const updated = res.data.data;
      setLeads((prev) => prev.map((l) => (String(l._id) === String(leadId) ? updated : l)));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update document status');
    } finally {
      setDocApprovalKey(null);
    }
  };

  useEffect(() => {
    fetchApprovalSummary();
  }, []);

  useEffect(() => {
    if (leadTab !== 'approval') return;
    if (!token) return;
    const map = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
    const approvalStatus = leadApprovalTab === 'all' ? null : map[leadApprovalTab];
    let cancelled = false;
    (async () => {
      try {
        setLoadingApprovalList(true);
        const response = await axios.get(`${backendUrl}/college/b2b_copy/leads`, {
          headers: { 'x-auth': token },
          params: { ...(approvalStatus ? { approvalStatus } : {}), limit: 500, page: 1 },
        });
        if (!cancelled && response.data.status) {
          setApprovalListLeads(dedupeLeadsById(response.data.data.leads || []));
        }
      } catch (e) {
        console.error('approval list fetch', e);
      } finally {
        if (!cancelled) setLoadingApprovalList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leadTab, leadApprovalTab, backendUrl, token]);

  useEffect(() => {
    if (leadTab !== 'report' || !token) return;
    fetchSubmitterReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadTab, backendUrl, token]);


  // Check if user can update a lead
  const canUpdateLead = (lead) => {
    if (!lead || !userData?._id) return false;

    // Admin can always update - check both permissions state and userData
    const permissionType = permissions?.permission_type || userData?.permissions?.permission_type;
    if (permissionType === 'Admin') return true;

    // Check if user is the lead owner or lead added by
    const userId = userData._id;
    const leadAddedById = lead.leadAddedBy?._id || lead.leadAddedBy;
    const leadOwnerId = lead.leadOwner?._id || lead.leadOwner;

    return leadAddedById?.toString() === userId?.toString() ||
      leadOwnerId?.toString() === userId?.toString();
  };

  // Update lead status
  const updateLeadStatus = async (leadId, statusData) => {
    try {
      // Get current status information for logging
      const currentStatus = selectedProfile?.status?.name || 'Unknown';
      const currentSubStatus = selectedProfile?.subStatus?.title || 'No Sub-Status';
      const newStatus = statuses.find(s => s._id === statusData.status)?.name || 'Unknown';
      const newSubStatus = subStatuses.find(s => s._id === statusData.subStatus)?.title || 'No Sub-Status';

      const response = await axios.put(`${backendUrl}/college/b2b_copy/leads/${leadId}/status`, statusData, {
        headers: { 'x-auth': token }
      });

      if (response.data.status) {
        const updated = response.data.data;
        if (updated && updated._id) {
          const merge = (prev) =>
            prev.map((l) => (String(l._id) === String(updated._id) ? { ...l, ...updated } : l));
          setLeads(merge);
          setPerformanceLeads(merge);
          setFollowupLeadsData(merge);
          setApprovalListLeads(merge);
        }
        fetchLeads(selectedStatusFilter, 1);
        fetchStatusCounts();
        closePanel();
      } else {
        alert(response.data.message || 'Failed to update lead status');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update lead status. Please try again.';
      alert(errorMessage);
    }
  };

  // Handle lead form submission
  const handleLeadSubmit = async () => {
    if (!validateLeadForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare data according to backend schema
      const leadData = {
        leadCategory: leadFormData.leadCategory,
        typeOfB2B: leadFormData.typeOfB2B,
        businessName: leadFormData.businessName,
        address: leadFormData.address,
        city: leadFormData.city,
        state: leadFormData.state,
        block: leadFormData.block,
        concernPersonName: leadFormData.concernPersonName,
        designation: leadFormData.designation,
        email: leadFormData.email,
        mobile: leadFormData.mobile,
        whatsapp: leadFormData.whatsapp,
        landlineNumber: leadFormData.landlineNumber,
        leadOwner: userData?._id || leadFormData.leadOwner,
        leadStatus: leadFormData.leadStatus,
        lockLeadDays: Number(leadFormData.lockLeadDays),
        remark: leadFormData.remark
      };

      // Lock duration (60 days): assign Lead Owner to logged-in user
      if (Number(leadFormData.lockLeadDays) === 60 && userData?._id) {
        leadData.leadOwner = userData._id;
      }
      // Add coordinates if location is selected
      if (selectedLocation) {
        leadData.coordinates = {
          type: "Point",
          coordinates: [selectedLocation.lng, selectedLocation.lat] // [longitude, latitude]
        };
      } else if (leadFormData.longitude && leadFormData.latitude) {
        leadData.coordinates = {
          type: "Point",
          coordinates: [leadFormData.longitude, leadFormData.latitude] // [longitude, latitude]
        };
      }

      // Send data to backend API
      const response = await axios.post(`${backendUrl}/college/b2b_copy/add-lead`, leadData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.status) {
        const createdLeadId = response.data?.data?._id;
        if (createdLeadId) {
          setLeadTab('approval');
          setLeadApprovalTab('pending');
        }

        // Show success message
        alert('Lead added successfully!');

        fetchApprovalSummary();
        fetchLeads(null, 1);
        fetchStatusCounts();

        // Reset form
        setLeadFormData({
          leadCategory: '',
          typeOfB2B: '',
          businessName: '',
          businessAddress: '',
          concernPersonName: '',
          address: '',
          city: '',
          state: '',
          block: '',
          designation: '',
          email: '',
          mobile: '',
          whatsapp: '',
          landlineNumber: '',
          leadOwner: '',
          leadStatus: '',
          lockLeadDays: '60',
          remark: ''
        });
        setFormErrors({});
        setExtractedNumbers([]);
        setSelectedLocation(null);
        setShowMap(false);

        // Close modal
        setShowAddLeadModal(false);
      } else {
        alert(response.data.message || 'Failed to add lead');
      }

    } catch (error) {
      console.error('Error submitting lead:', error);
      if (error.response?.data?.message) {
        alert(`Failed to add lead: ${error.response.data.message}`);
      } else {
        alert('Failed to add lead. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Close lead modal
  const handleCloseLeadModal = () => {
    setShowAddLeadModal(false);
    setLeadFormData({
      leadCategory: '',
      typeOfB2B: '',
      businessName: '',
      businessAddress: '',
      concernPersonName: '',
      address: '',
      city: '',
      state: '',
      block: '',
      latitude: '',
      longitude: '',
      designation: '',
      email: '',
      mobile: '',
      whatsapp: '',
      landlineNumber: '',
      leadOwner: '',
      leadStatus: '',
      lockLeadDays: '60',
      remark: ''
    });
    setFormErrors({});
    setExtractedNumbers([]);
    setSelectedLocation(null);
    setShowMap(false);
  };

  // Open lead modal and initialize autocomplete
  const handleOpenLeadModal = () => {
    setShowAddLeadModal(true);
  };

  // Bulk Upload Functions
  const handleBulkFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

      if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
        setBulkUploadMessage('Please select a valid Excel file (.xlsx, .xls) or CSV file');
        e.target.value = '';
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        setBulkUploadMessage('File size should not exceed 10MB');
        e.target.value = '';
        return;
      }

      setBulkUploadFile(selectedFile);
      setBulkUploadMessage('');
      setBulkUploadErrors([]);
      setBulkUploadSuccess(false);
    }
  };

  const handleBulkUpload = async () => {
    // Get file directly from input element
    const fileInput = bulkUploadFileInputRef.current;
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      setBulkUploadMessage('Please select a file');
      return;
    }

    const selectedFile = fileInput.files[0];

    // Validate file object
    if (!(selectedFile instanceof File)) {
      setBulkUploadMessage('Invalid file object. Please select the file again.');
      return;
    }

    setBulkUploadLoading(true);
    setBulkUploadMessage('');
    setBulkUploadErrors([]);
    setBulkUploadSuccess(false);

    // Create FormData and append file
    const formData = new FormData();
    formData.append('file', selectedFile, selectedFile.name);

    // Debug: Log FormData contents
    console.log('File to upload:', selectedFile);
    console.log('File name:', selectedFile?.name);
    console.log('File size:', selectedFile?.size);
    console.log('File type:', selectedFile?.type);
    console.log('Is File instance:', selectedFile instanceof File);

    // Verify FormData
    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log('  -', pair[0], ':', pair[1]);
    }

    try {
      const response = await axios.post(`${backendUrl}/college/b2b_copy/leads/import`, formData, {
        headers: {
          'x-auth': token
          // Don't set Content-Type - axios will automatically set it with boundary for FormData
        }
      });

      if (response.data.status) {
        setBulkUploadSuccess(true);
        const successCount = response.data.data?.inserted || 0;
        const errorCount = response.data.data?.errors || 0;
        const errorDetails = response.data.data?.errorDetails || [];

        setBulkUploadMessage(
          `✅ ${successCount} leads imported successfully${errorCount > 0 ? `. ${errorCount} errors found.` : ''}`
        );

        if (errorDetails.length > 0) {
          setBulkUploadErrors(errorDetails);
        }

        // Refresh the leads list and status counts
        fetchLeads(selectedStatusFilter, 1);
        fetchStatusCounts();

        // Clear file after 3 seconds
        setTimeout(() => {
          setBulkUploadFile(null);
          const fileInput = document.getElementById('bulkUploadFile');
          if (fileInput) {
            fileInput.value = '';
          }
        }, 3000);
      } else {
        setBulkUploadMessage(response.data.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setBulkUploadMessage(
        error.response?.data?.message || 'Failed to upload file. Please try again.'
      );
    } finally {
      setBulkUploadLoading(false);
    }
  };

  const handleCloseBulkUploadModal = () => {
    setShowBulkUploadModal(false);
    setBulkUploadFile(null);
    setBulkUploadMessage('');
    setBulkUploadErrors([]);
    setBulkUploadSuccess(false);
    const fileInput = document.getElementById('bulkUploadFile');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getPaginationPages = () => {
    const delta = 2;
    const range = [];
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, currentPage + delta);

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(totalPages, start + 4);
      } else {
        start = Math.max(1, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  const handlePageChange = (newPage) => {
    fetchPerformanceLeads(newPage);
  };

  const getPerformancePaginationPages = () => {
    const delta = 2;
    const range = [];
    let start = Math.max(1, performancePage - delta);
    let end = Math.min(performanceTotalPages, performancePage + delta);

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(performanceTotalPages, start + 4);
      } else {
        start = Math.max(1, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };
  useEffect(() => {
    getPaginationPages()
  }, [totalPages])




  //Date picker
  const today = new Date();  // Current date


  // Toggle POPUP

  const [crmFilters, setCrmFilters] = useState([
    { _id: '', name: '', count: 0, milestone: '' },

  ]);
  const [statuses, setStatuses] = useState([
    { _id: '', name: '', count: 0 },

  ]);

  // edit status and set followup
  const [seletectedStatus, setSelectedStatus] = useState('');
  const [seletectedSubStatus, setSelectedSubStatus] = useState(null);
  // Single state for all follow-up form data
  const [followupFormData, setFollowupFormData] = useState({
    followupDate: '',
    followupTime: '',
    followupType: 'Call',
    remarks: '',
    selectedProfile: null,
    selectedConcernPerson: null,
    selectedProfiles: null,
    selectedCounselor: null,
    selectedDocument: null
  });


  const [subStatuses, setSubStatuses] = useState([


  ]);

  const leadOwnerMultiOptions = useMemo(() => {
    if (!users?.length) return [];
    return [...users]
      .map((u) => ({ value: String(u._id), label: u.name || u.email || String(u._id) }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  }, [users]);

  const statusMultiOptions = useMemo(() => {
    if (!statuses?.length) return [];
    return [...statuses]
      .filter((s) => s._id)
      .map((s) => ({ value: String(s._id), label: s.name || '' }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  }, [statuses]);

  const subStatusMultiOptions = useMemo(() => {
    if (!subStatuses?.length) return [];
    return [...subStatuses]
      .filter((s) => s._id)
      .map((s) => ({ value: String(s._id), label: s.title || s.name || '' }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  }, [subStatuses]);

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;

  const { navRef, navHeight } = useNavHeight([isFilterCollapsed, crmFilters]);
  const { widthRef, width, leftOffset } = useMainWidth([isFilterCollapsed, crmFilters, mainContentClass]);
  const { isScrolled, scrollY, contentRef } = useScrollBlur(navHeight);
  const blurIntensity = Math.min(scrollY / 10, 15);
  const navbarOpacity = Math.min(0.85 + scrollY / 1000, 0.98);
  const b2bCycleUiStyles = `
    /* ============================================================
      B2B Cycle — Dark Industrial CRM shell (scoped)
      Based on the provided HTML UI (6329-8033).
      Only affects elements under .b2b-cycle.
      ============================================================ */
    .b2b-cycle {
      --bg:        #f1f5f9;
      --surface:   #ffffff;
      --card:      #ffffff;
      --card-hi:   #f8fafc;
      --border:    rgba(0,0,0,0.08);
      --border-hi: rgba(0,0,0,0.14);
      --red:       #ff4d7a;
      --red-dark:  #c01855;
      --red-glow:  rgba(255,77,122,0.18);
      --red-soft:  rgba(255,77,122,0.08);
      --gold:      #f59e0b;
      --green:     #22c55e;
      --blue:      #3b82f6;
      --orange:    #f97316;
      --text-1:    #1e293b;
      --text-2:    #64748b;
      --text-3:    #94a3b8;
      --mono:      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      --sans:      ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      --radius-sm: 6px;
      --radius:    12px;
      --radius-lg: 18px;
      --transition: 200ms cubic-bezier(0.4,0,0.2,1);
      background: var(--bg);
      color: var(--text-1);
      min-height: 100vh;
      font-family: var(--sans);
      overflow-x: hidden;
      position: relative;
    }
    .b2b-cycle *, .b2b-cycle *::before, .b2b-cycle *::after { box-sizing: border-box; }
    .b2b-cycle ::-webkit-scrollbar { width: 5px; height: 5px; }
    .b2b-cycle ::-webkit-scrollbar-track { background: transparent; }
    .b2b-cycle ::-webkit-scrollbar-thumb { background: var(--border-hi); border-radius: 9px; }

   
    .b2b-cycle .topbar-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .b2b-cycle .topbar-logo {
      width: 32px; height: 32px; border-radius: 8px;
      background: linear-gradient(135deg, var(--red), var(--red-dark));
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; color: #fff; font-weight: 800;
      box-shadow: 0 0 20px var(--red-glow);
    }
    .b2b-cycle .topbar-name { font-size: 15px; font-weight: 800; color: var(--text-1); letter-spacing: -0.3px; }
    .b2b-cycle .topbar-sep { width: 1px; height: 20px; background: var(--border); margin: 0 4px; }
    .b2b-cycle .breadcrumb {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: var(--text-3); font-family: var(--mono);
    }
    .b2b-cycle .breadcrumb a { color: var(--text-2); text-decoration: none; }
    .b2b-cycle .breadcrumb a:hover { color: var(--red); }
    .b2b-cycle .breadcrumb-sep { color: var(--text-3); }
    .b2b-cycle .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
    .b2b-cycle .search-wrap { position: relative; display: flex; align-items: center; }
    .b2b-cycle .search-input {
      width: 240px; height: 36px;
      background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-1); font-size: 13px;
      padding: 0 36px 0 14px;
      outline: none; transition: var(--transition);
    }
    .b2b-cycle .search-input::placeholder { color: var(--text-3); }
    .b2b-cycle .search-input:focus { border-color: var(--red); box-shadow: 0 0 0 3px var(--red-soft); }
    .b2b-cycle .search-icon { position: absolute; right: 11px; color: var(--text-3); font-size: 11px; pointer-events: none; }
    .b2b-cycle .icon-btn {
      width: 36px; height: 36px; border-radius: var(--radius-sm);
      background: var(--card); border: 1px solid var(--border);
      color: var(--text-2); cursor: pointer; display: flex;
      align-items: center; justify-content: center; font-size: 13px;
      transition: var(--transition);
    }
    .b2b-cycle .icon-btn:hover { border-color: var(--border-hi); color: var(--text-1); }
    .b2b-cycle .icon-btn.active { background: var(--red); border-color: var(--red); color: #fff; }

    .b2b-cycle .layout { display: flex; padding-top: 60px; min-height: 100vh; }
    .b2b-cycle .sidebar {
      width: 220px; flex-shrink: 0;
      background: var(--surface);
      border-right: 1px solid var(--border);
      position: fixed; top: 60px; left: 0; bottom: 0;
      overflow-y: auto; padding: 16px 0;
    }
    .b2b-cycle .sidebar-section { margin-bottom: 24px; }
    .b2b-cycle .sidebar-label {
      font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
      color: var(--text-3); text-transform: uppercase;
      padding: 0 16px; margin-bottom: 6px;
      font-family: var(--mono);
    }
    .b2b-cycle .sidebar-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 16px; cursor: pointer; font-size: 13px;
      color: var(--text-2); font-weight: 600;
      transition: var(--transition); text-decoration: none;
      position: relative;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
    }
    .b2b-cycle .sidebar-item i { width: 16px; font-size: 12px; text-align: center; }
    .b2b-cycle .sidebar-item:hover { color: var(--text-1); background: var(--card); }
    .b2b-cycle .sidebar-item.active { color: var(--red); background: var(--red-soft); }
    .b2b-cycle .sidebar-item.active::before {
      content: ''; position: absolute; left: 0; top: 4px; bottom: 4px;
      width: 3px; background: var(--red); border-radius: 0 3px 3px 0;
    }

    .b2b-cycle .main {
      margin-left: 220px; flex: 1;
      padding: 24px;
      max-width: calc(100vw - 220px);
      position: relative;
      z-index: 1;
    }
    .b2b-cycle::before {
      content: '';
      position: fixed; top: 0; left: 220px; right: 0; height: 300px;
      background: radial-gradient(ellipse at 70% 0%, rgba(255,77,122,0.05) 0%, transparent 70%);
      pointer-events: none; z-index: 0;
    }

    .b2b-cycle .main-tabs {
      display: flex; gap: 2px; margin-bottom: 16px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 4px; width: fit-content;
    }
    .b2b-cycle .main-tab {
      padding: 8px 18px; border-radius: 9px;
      font-size: 13px; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; gap: 7px;
      color: var(--text-2); border: none; background: none;
      transition: var(--transition);
      font-family: var(--sans);
    }
    .b2b-cycle .main-tab i { font-size: 11px; }
    .b2b-cycle .main-tab:hover { color: var(--text-1); }
    .b2b-cycle .main-tab.active {
      background: var(--red);
      color: #fff;
      box-shadow: 0 4px 12px rgba(232,41,76,0.35);
    }

    @media (max-width: 900px) {
      .b2b-cycle .sidebar { display: none; }
      .b2b-cycle .main { margin-left: 0; max-width: 100vw; padding: 16px; }
      .b2b-cycle::before { left: 0; }
      .b2b-cycle .search-input { width: 160px; }
    }
  `;
  const tabs = [
    'Lead Details', ,
    'Documents'
  ];

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 992);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  useEffect(() => {
    fetchStatus()

  }, []);

  useEffect(() => {
    const filterStatusList = normalizeFilterIdArray(filters.status);
    if (seletectedStatus || filterStatusList.length > 0) {
      fetchSubStatus();
    }
  }, [seletectedStatus, filters.status]);


  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };



  const handleTimeChange = (e) => {
    if (!followupFormData.followupDate) {
      alert('Select date first');
      return;  // Yahan return lagao
    }

    const time = e.target.value; // "HH:mm"

    const [hours, minutes] = time.split(':');

    const selectedDateTime = new Date(followupFormData.followupDate);
    selectedDateTime.setHours(parseInt(hours, 10));
    selectedDateTime.setMinutes(parseInt(minutes, 10));
    selectedDateTime.setSeconds(0);
    selectedDateTime.setMilliseconds(0);

    const now = new Date();

    if (selectedDateTime < now) {
      alert('Select future time');
      return;  // Yahan bhi return lagao
    }

    // Agar yaha aaya to time sahi hai
    setFollowupFormData(prev => ({ ...prev, followupTime: time }));
  };




  const handleSubStatusChange = (e) => {
    const selectedSubStatusId = e.target.value;

    // ID से पूरा object find करें
    const selectedSubStatusObject = subStatuses.find(status => status._id === selectedSubStatusId);

    // पूरा object set करें
    setSelectedSubStatus(selectedSubStatusObject || null);
  };

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/statusB2b`, {
        headers: { 'x-auth': token }
      });

      console.log('B2B fetchStatus response:', response.data);

      if (response.data.success) {
        const status = response.data.data;
        console.log('B2B Fetched statuses:', status);
        const allFilter = { _id: 'all', name: 'All' };

        setCrmFilters([allFilter, ...status.map(r => ({
          _id: r._id,
          name: r.title,
          milestone: r.milestone,
        }))]);

        setStatuses(status.map(r => ({
          _id: r._id,
          name: r.title,
          count: r.count || 0,
        })));

        console.log('B2B Statuses set:', status.length);
      } else {
        console.error('API returned error:', response.data);
        alert('Failed to fetch Status: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching B2B statuses:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert('Failed to fetch Status: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchSubStatus = async () => {
    try {
      let statusIds = [];
      if (seletectedStatus) {
        statusIds = [seletectedStatus];
      } else {
        statusIds = normalizeFilterIdArray(filters.status);
      }
      if (statusIds.length === 0) {
        if (!seletectedStatus) setSubStatuses([]);
        return;
      }
      const seen = new Set();
      const merged = [];
      for (const statusId of statusIds) {
        const response = await axios.get(`${backendUrl}/college/statusB2b/${statusId}/substatus`, {
          headers: { 'x-auth': token }
        });
        if (response.data.success && Array.isArray(response.data.data)) {
          for (const row of response.data.data) {
            const k = row?._id != null ? String(row._id) : '';
            if (k && !seen.has(k)) {
              seen.add(k);
              merged.push(row);
            }
          }
        }
      }
      merged.sort((a, b) =>
        String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''), undefined, {
          sensitivity: 'base',
        })
      );
      setSubStatuses(merged);
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch SubStatus');
    }
  };









  const openEditPanel = async (profile = null, panel) => {
    // Check permission before opening panel
    if (profile && (panel === 'StatusChange' || panel === 'SetFollowup')) {
      if (!canUpdateLead(profile)) {
        alert('You do not have permission to update this lead. Only the lead owner or the person who added the lead can update it.');
        return;
      }
    }

    setSelectedProfile(null)
    setShowPanel('')
    setSelectedStatus(null)
    setSelectedSubStatus(null)


    if (profile) {
      setSelectedProfile(profile);
      setFollowupFormData(prev => ({ ...prev, selectedProfile: profile }));
    }

    // Close all panels first

    setShowPopup(null);
    setSelectedConcernPerson(null);


    if (panel === 'StatusChange') {
      if (profile) {
        const newStatus = profile?._leadStatus?._id || '';
        setSelectedStatus(newStatus);

        // if (newStatus) {
        //   await fetchSubStatus(newStatus);
        // }

        setSelectedSubStatus(profile?.selectedSubstatus || '');
      }
      setShowPanel('editPanel')

    }
    else if (panel === 'SetFollowup') {
      setShowPopup(null)
      setShowPanel('followUp')
    }
    else if (panel === 'bulkstatuschange') {
      setShowPopup(null)
      setShowPanel('bulkstatuschange')

    }

    if (!isMobile) {
      setMainContentClass('col-8');

      setTimeout(() => {
        if (widthRef.current) {
          window.dispatchEvent(new Event('resize'));
        }
      }, 200);

    }
  };

  const openPanelHome = (profile = null) => {
    if (profile) {
      setSelectedProfile(profile);
      setFollowupFormData((prev) => ({ ...prev, selectedProfile: profile }));
    }

    setShowPopup(null);
    setSelectedConcernPerson(null);
    setShowPanel('panelHome');

    if (!isMobile) {
      setMainContentClass('col-8');
      setTimeout(() => {
        if (widthRef.current) {
          window.dispatchEvent(new Event('resize'));
        }
      }, 200);
    }
  };

  const toggleLeadCardCollapsed = (leadId) => {
    if (!leadId) return;
    setCollapsedLeadCards((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  const closePanel = () => {
    // Hide bulk inputs when bulk refer panel is closed
    if (showPanel === 'RefferAllLeads') {
      setShowBulkInputs(false);
      setBulkMode('');
      setInput1Value('');
      setSelectedProfiles([]);
    }
    setShowPanel('');
    clearFollowupFormData();
    setShowPopup(null);
    clearFollowupFormData();
    setSelectedStatus(null)
    setSelectedSubStatus(null)
    if (!isMobile) {
      setMainContentClass('col-12');
    }
  };



  const openRefferPanel = async (profile = null, panel) => {

    if (profile) {
      setSelectedProfile(profile);
    }

    setShowPopup(null);

    if (panel === 'RefferAllLeads') {
      setShowPanel('RefferAllLeads');
      // Ensure bulk mode is enabled for "Refer All Leads"
      setShowBulkInputs(true);
      setBulkMode('bulkrefer');
      setInput1Value('');
      setSelectedProfiles([]);
    } else if (panel === 'Reffer') {
      setShowPanel('Reffer');
    }

    if (!isMobile) {
      setMainContentClass('col-8');

      setTimeout(() => {
        if (widthRef.current) {
          window.dispatchEvent(new Event('resize'));
        }
      }, 200);
    }
  };


  const handleConcernPersonChange = (e) => {
    setSelectedConcernPerson(e.target.value);
  }

  const handleReferLead = async (e) => {
    e.preventDefault();

    // Validation
    if (!selectedConcernPerson) {
      alert('Please select a counselor');
      return;
    }

    if (showPanel === 'RefferAllLeads') {
      if (!selectedProfiles || selectedProfiles.length === 0) {
        alert('Please select at least one lead to refer. Enter a number in Input 1 to select leads.');
        return;
      }
    } else {
      if (!selectedProfile || !selectedProfile._id) {
        alert('Please select a lead to refer');
        return;
      }
    }

    try {
      const isBulk = showPanel === 'RefferAllLeads';

      if (isBulk) {
        // Bulk route (backend supports array)
        try {
          const bulkRes = await axios.post(
            `${backendUrl}/college/b2b_copy/refer-leads`,
            { counselorId: selectedConcernPerson, leadIds: selectedProfiles },
            { headers: { 'x-auth': token } }
          );

          if (bulkRes?.data?.status) {
            const modified = bulkRes?.data?.data?.modified;
            const okCount = typeof modified === 'number' ? modified : (selectedProfiles?.length || 0);
            alert(`Referred ${okCount} lead(s) successfully!`);
            await fetchLeads(selectedStatusFilter, 1);
            await fetchStatusCounts();
            closePanel();
            return;
          }
        } catch (bulkErr) {
          // If bulk endpoint not available yet, fallback below
          console.warn('Bulk refer endpoint failed, falling back to single calls:', bulkErr?.response?.status);
        }

        // Fallback: call single endpoint per lead
        const results = await Promise.allSettled(
          (selectedProfiles || []).map((id) =>
            axios.post(
              `${backendUrl}/college/b2b_copy/refer-lead`,
              { counselorId: selectedConcernPerson, leadId: id, type: 'single' },
              { headers: { 'x-auth': token } }
            )
          )
        );

        const ok = results.filter((r) => r.status === 'fulfilled' && r.value?.data?.status).length;
        const failed = results.length - ok;

        if (ok > 0) {
          alert(`Referred ${ok} lead(s) successfully${failed ? `, ${failed} failed` : ''}.`);
          await fetchLeads(selectedStatusFilter, 1);
          await fetchStatusCounts();
          closePanel();
          return;
        }

        alert('Failed to refer selected leads');
        return;
      }

      // Single refer
      const response = await axios.post(
        `${backendUrl}/college/b2b_copy/refer-lead`,
        { counselorId: selectedConcernPerson, leadId: selectedProfile._id, type: 'single' },
        { headers: { 'x-auth': token } }
      );

      if (response?.data?.status) {
        alert('Lead referred successfully!');
        await fetchLeads(selectedStatusFilter, 1);
        await fetchStatusCounts();
        closePanel();
        return;
      }

      alert(response?.data?.message || 'Failed to refer lead');
    } catch (error) {
      console.error('Error referring lead:', error);
      alert(error.response?.data?.message || 'Failed to refer lead. Please try again.');
    }
  }
  const openleadHistoryPanel = async (profile = null) => {
    if (profile) {
      // Set selected profile
      setSelectedProfile(profile);

    }

    setShowPopup(null);
    setShowPanel('leadHistory');
    setSelectedConcernPerson(null);
    setSelectedProfiles([]);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };


  const openProfileEditPanel = async (profile = null) => {
    if (profile) {
      // Set selected profile
      setSelectedProfile(profile);

    }

    setShowPopup(null);
    setShowPanel('ProfileEdit');
    setSelectedConcernPerson(null);
    setSelectedProfiles([]);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  const toggleLeadDetails = (profileIndex) => {
    setLeadDetailsVisible(prev => prev === profileIndex ? null : profileIndex);
  };



  const scrollLeft = () => {
    const container = document.querySelector('.scrollable-content');
    if (container) {
      const cardWidth = document.querySelector('.info-card')?.offsetWidth || 200;
      container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.querySelector('.scrollable-content');
    if (container) {
      const cardWidth = document.querySelector('.info-card')?.offsetWidth || 200;
      container.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };


  // Render Status Change Panel
  const renderStatusChangePanel = () => {
    const panelInputStyle = {
      height: '44px', borderRadius: '10px', border: '1.5px solid #e2e8f0',
      background: '#f8fafc', fontSize: '13px', paddingInline: '12px',
      outline: 'none', width: '100%', color: '#1e293b',
    };
    const panelLabelStyle = {
      fontSize: '11px', fontWeight: 700, color: '#64748b',
      textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block',
    };
    const panelContent = (
      <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        {/* Gradient Header */}
        <div style={{ background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fas fa-exchange-alt" style={{ color: '#fff', fontSize: '14px' }}></i>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>Change Status</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                  {selectedProfile?.businessName || 'Lead'}
                </div>
              </div>
            </div>
            <button type="button" onClick={closePanel} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <i className="fas fa-times" style={{ color: '#fff', fontSize: '13px' }}></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 18px' }}>
          {userData.googleAuthToken?.accessToken && !isgoogleLoginLoading ? (
            <form onSubmit={addFollowUpToGoogleCalendar}>
              <div style={{ marginBottom: '16px' }}>
                <label style={panelLabelStyle}>Status <span style={{ color: '#ff4d7a' }}>*</span></label>
                <select style={panelInputStyle} value={seletectedStatus} onChange={handleStatusChange}>
                  <option value="">Select Status</option>
                  {statuses.map((status) => (
                    <option key={status._id} value={status._id}>{status.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={panelLabelStyle}>Sub-Status</label>
                <select style={panelInputStyle} value={seletectedSubStatus?._id || ''} onChange={handleSubStatusChange}>
                  <option value="">Select Sub-Status</option>
                  {subStatuses.map((subStatus) => (
                    <option key={subStatus._id} value={subStatus._id}>{subStatus.title}</option>
                  ))}
                </select>
              </div>

              {seletectedSubStatus?.hasFollowup && (
                <div style={{ marginBottom: '16px', padding: '14px', background: '#fef2f4', borderRadius: '12px', border: '1px solid #fecdd3' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#ff4d7a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Follow-up Details</div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                    {[
                      { id: 'Call', label: 'Follow-up Call', icon: 'fas fa-phone-alt', bg: '#eef6ff', border: '#93c5fd', color: '#1d4ed8' },
                      { id: 'Meeting', label: 'Follow-up Meeting', icon: 'fas fa-handshake', bg: '#fff1f2', border: '#fda4af', color: '#be123c' },
                    ].map((item) => {
                      const active = (followupFormData.followupType || 'Call') === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFollowupFormData((prev) => ({ ...prev, followupType: item.id }))}
                          style={{
                            flex: 1,
                            borderRadius: '12px',
                            border: `1.5px solid ${active ? item.border : '#e2e8f0'}`,
                            background: active ? item.bg : '#fff',
                            color: active ? item.color : '#64748b',
                            padding: '10px 12px',
                            fontSize: '13px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: active ? `0 6px 16px ${item.border}33` : 'none',
                          }}
                        >
                          <i className={item.icon}></i>
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={panelLabelStyle}>Date <span style={{ color: '#ff4d7a' }}>*</span></label>
                      <DatePicker
                        className="form-control border-0 bgcolor small-date"
                        onChange={(date) => setFollowupFormData(prev => ({ ...prev, followupDate: date }))}
                        value={followupFormData.followupDate}
                        format="dd/MM/yyyy"
                        minDate={today}
                      />
                    </div>
                    <div>
                      <label style={panelLabelStyle}>Time <span style={{ color: '#ff4d7a' }}>*</span></label>
                      <input type="time" style={{ ...panelInputStyle, background: '#fff' }}
                        onChange={(e) => setFollowupFormData(prev => ({ ...prev, followupTime: e.target.value }))}
                        value={followupFormData.followupTime}
                      />
                    </div>
                  </div>
                </div>
              )}

              {seletectedSubStatus?.hasRemarks && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={panelLabelStyle}>Remarks <span style={{ color: '#ff4d7a' }}>*</span></label>
                  <textarea
                    rows="3"
                    onChange={(e) => setFollowupFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    value={followupFormData.remarks}
                    placeholder="Enter remarks about this status change..."
                    required
                    style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', padding: '10px 12px', resize: 'none', outline: 'none', color: '#1e293b' }}
                  />
                </div>
              )}

              {userData.googleAuthToken?.accessToken && (
                <div style={{ marginBottom: '14px' }}>
                  <button type="button" onClick={handleGoogleLogout} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                    Disconnect Google Calendar
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={closePanel} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,77,122,0.3)' }}>
                  Update Status
                </button>
              </div>
            </form>
          ) : !isgoogleLoginLoading && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <i className="fab fa-google" style={{ color: '#ff4d7a', fontSize: '20px' }}></i>
              </div>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '14px' }}>Connect Google Calendar to update status</p>
              <button onClick={handleGoogleLogin} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                Login with Google
              </button>
            </div>
          )}
          {isgoogleLoginLoading && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <i className="fas fa-spinner fa-spin" style={{ color: '#ff4d7a', fontSize: '24px' }}></i>
            </div>
          )}
        </div>
      </div>
    );

    if (isMobile) {
      return showPanel === 'editPanel' ? (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              {panelContent}
            </div>
          </div>
        </div>
      ) : null;
    }

    return showPanel === 'editPanel' ? (
      <div className="col-12 transition-col" id="statusChangePanel">
        {panelContent}
      </div>
    ) : null;
  };

  // Render Follow-up Panel
  const renderFollowupPanel = () => {
    const panelInputStyle = {
      height: '44px', borderRadius: '10px', border: '1.5px solid #e2e8f0',
      background: '#f8fafc', fontSize: '13px', paddingInline: '12px',
      outline: 'none', width: '100%', color: '#1e293b',
    };
    const panelLabelStyle = {
      fontSize: '11px', fontWeight: 700, color: '#64748b',
      textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block',
    };
    const panelContent = (
      <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        {/* Gradient Header */}
        <div style={{ background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fas fa-calendar-plus" style={{ color: '#fff', fontSize: '14px' }}></i>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>Set Follow-up</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                  {selectedProfile?.businessName || 'Lead'}
                </div>
              </div>
            </div>
            <button type="button" onClick={closePanel} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <i className="fas fa-times" style={{ color: '#fff', fontSize: '13px' }}></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 18px' }}>
          {userData.googleAuthToken?.accessToken && !isgoogleLoginLoading ? (
            <form onSubmit={addFollowUpToGoogleCalendar}>
              <div style={{ marginBottom: '16px' }}>
                <label style={panelLabelStyle}>Follow-up Type</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    { id: 'Call', label: 'Follow-up Call', icon: 'fas fa-phone-alt', bg: '#eef6ff', border: '#93c5fd', color: '#1d4ed8' },
                    { id: 'Meeting', label: 'Follow-up Meeting', icon: 'fas fa-handshake', bg: '#fff1f2', border: '#fda4af', color: '#be123c' },
                  ].map((item) => {
                    const active = (followupFormData.followupType || 'Call') === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFollowupFormData((prev) => ({ ...prev, followupType: item.id }))}
                        style={{
                          flex: 1,
                          borderRadius: '12px',
                          border: `1.5px solid ${active ? item.border : '#e2e8f0'}`,
                          background: active ? item.bg : '#fff',
                          color: active ? item.color : '#64748b',
                          padding: '10px 12px',
                          fontSize: '13px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          boxShadow: active ? `0 6px 16px ${item.border}33` : 'none',
                        }}
                      >
                        <i className={item.icon}></i>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={panelLabelStyle}>Follow-up Date <span style={{ color: '#ff4d7a' }}>*</span></label>
                  <DatePicker
                    className="form-control border-0 bgcolor small-date"
                    onChange={(date) => setFollowupFormData(prev => ({ ...prev, followupDate: date }))}
                    value={followupFormData.followupDate}
                    format="dd/MM/yyyy"
                    minDate={today}
                  />
                </div>
                <div>
                  <label style={panelLabelStyle}>Time <span style={{ color: '#ff4d7a' }}>*</span></label>
                  <input type="time" style={panelInputStyle}
                    onChange={(e) => setFollowupFormData(prev => ({ ...prev, followupTime: e.target.value }))}
                    value={followupFormData.followupTime}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={panelLabelStyle}>Follow-up Notes</label>
                <textarea
                  rows="3"
                  onChange={(e) => setFollowupFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  value={followupFormData.remarks}
                  placeholder="Enter follow-up notes..."
                  style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', padding: '10px 12px', resize: 'none', outline: 'none', color: '#1e293b' }}
                />
              </div>

              {userData.googleAuthToken?.accessToken && (
                <div style={{ marginBottom: '14px' }}>
                  <button type="button" onClick={handleGoogleLogout} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                    Disconnect Google Calendar
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={closePanel} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,77,122,0.3)' }}>
                  Set Follow-up
                </button>
              </div>
            </form>
          ) : !isgoogleLoginLoading && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <i className="fab fa-google" style={{ color: '#ff4d7a', fontSize: '20px' }}></i>
              </div>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '14px' }}>Connect Google Calendar to set follow-ups</p>
              <button onClick={handleGoogleLogin} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                Login with Google
              </button>
            </div>
          )}
          {isgoogleLoginLoading && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <i className="fas fa-spinner fa-spin" style={{ color: '#ff4d7a', fontSize: '24px' }}></i>
            </div>
          )}
        </div>
      </div>
    );

    if (isMobile) {
      return showPanel === 'followUp' ? (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              {panelContent}
            </div>
          </div>
        </div>
      ) : null;
    }

    return showPanel === 'followUp' ? (
      <div className="col-12 transition-col" id="followupPanel">
        {panelContent}
      </div>
    ) : null;
  };

  const renderPanelHome = () => {
    const actions = [
      {
        key: 'editPanel',
        icon: 'fas fa-exchange-alt',
        label: 'Change Status',
        desc: 'Update lead status & sub-status',
        onClick: () => openEditPanel(selectedProfile, 'StatusChange'),
      },
      {
        key: 'Reffer',
        icon: 'fas fa-share-alt',
        label: 'Refer Lead',
        desc: 'Assign lead to a counselor',
        onClick: () => openRefferPanel(selectedProfile, 'Reffer'),
      },
      {
        key: 'leadHistory',
        icon: 'fas fa-history',
        label: 'History',
        desc: 'View full activity timeline',
        onClick: () => openleadHistoryPanel(selectedProfile),
      },
      {
        key: 'followUp',
        icon: 'fas fa-calendar-plus',
        label: 'Set Follow-up',
        desc: 'Schedule next follow-up date',
        onClick: () => openEditPanel(selectedProfile, 'SetFollowup'),
      },
    ];

    const panelContent = (
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)',
          padding: '18px 20px 16px',
          position: 'relative',
        }}>
          <div className="d-flex justify-content-between align-items-start">
            <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className="fas fa-building" style={{ color: '#fff', fontSize: '14px' }}></i>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    color: '#fff', fontWeight: 700, fontSize: '14px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {selectedProfile?.businessName || 'Lead Details'}
                  </div>
                  {selectedProfile?.typeOfB2B && (
                    <div style={{
                      color: 'rgba(255,255,255,0.75)', fontSize: '11px', marginTop: '1px',
                    }}>
                      {typeof selectedProfile.typeOfB2B === 'object'
                        ? (selectedProfile.typeOfB2B?.name || selectedProfile.typeOfB2B?._id || '')
                        : selectedProfile.typeOfB2B}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={closePanel}
              style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px',
                width: '30px', height: '30px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <i className="fas fa-times" style={{ color: '#fff', fontSize: '13px' }}></i>
            </button>
          </div>

          {/* Lead meta row */}
          {selectedProfile && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {selectedProfile.status && (
                <span style={{
                  background: 'rgba(255,255,255,0.2)', color: '#fff',
                  fontSize: '11px', fontWeight: 600, borderRadius: '20px',
                  padding: '3px 10px', letterSpacing: '0.3px',
                }}>
                  {typeof selectedProfile.status === 'object'
                    ? (selectedProfile.status?.title || selectedProfile.status?.name || selectedProfile.status?._id || '')
                    : selectedProfile.status}
                </span>
              )}
              {selectedProfile.city && (
                <span style={{
                  background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
                  fontSize: '11px', borderRadius: '20px', padding: '3px 10px',
                }}>
                  <i className="fas fa-map-marker-alt me-1" style={{ fontSize: '10px' }}></i>
                  {selectedProfile.city}
                </span>
              )}
              {selectedProfile.mobile && (
                <span style={{
                  background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
                  fontSize: '11px', borderRadius: '20px', padding: '3px 10px',
                }}>
                  <i className="fas fa-phone me-1" style={{ fontSize: '10px' }}></i>
                  {selectedProfile.mobile}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action tiles */}
        <div style={{ padding: '16px', background: '#fafbfc' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={action.onClick}
                style={{
                  background: '#fff',
                  border: '1.5px solid #f1f5f9',
                  borderRadius: '12px',
                  padding: '14px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#ff4d7a';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,77,122,0.12)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#f1f5f9';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '8px',
                }}>
                  <i className={action.icon} style={{ color: '#fff', fontSize: '14px' }}></i>
                </div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b', marginBottom: '2px' }}>
                  {action.label}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                  {action.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );

    if (isMobile) {
      return showPanel === 'panelHome' ? (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              {panelContent}
            </div>
          </div>
        </div>
      ) : null;
    }

    return showPanel === 'panelHome' ? (
      <div className="col-12 transition-col" id="panelHome">
        {panelContent}
      </div>
    ) : null;
  };

  // Render Reffer Panel (Desktop Sidebar or Mobile Modal)

  const renderRefferPanel = () => {
    const isDisabled = !selectedConcernPerson || (showPanel === 'RefferAllLeads' && selectedProfiles.length === 0 && !input1Value);
    const panelLabelStyle = {
      fontSize: '11px', fontWeight: 700, color: '#64748b',
      textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block',
    };
    const panelContent = (
      <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        {/* Gradient Header */}
        <div style={{ background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fas fa-share-alt" style={{ color: '#fff', fontSize: '14px' }}></i>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                  {showPanel === 'RefferAllLeads' ? 'Refer All Leads' : 'Refer Lead'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                  {showPanel === 'RefferAllLeads' ? 'Assign selected leads to counselor' : (selectedProfile?.businessName || 'Lead')}
                </div>
              </div>
            </div>
            <button type="button" onClick={closePanel} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <i className="fas fa-times" style={{ color: '#fff', fontSize: '13px' }}></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 18px' }}>
          <form>
            <div style={{ marginBottom: '16px' }}>
              <label style={panelLabelStyle}>Select Counselor <span style={{ color: '#ff4d7a' }}>*</span></label>
              <select
                style={{ height: '44px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', paddingInline: '12px', outline: 'none', width: '100%', color: '#1e293b' }}
                onChange={handleConcernPersonChange}
              >
                <option value="">Select Counselor</option>
                {users.map((counselor, index) => (
                  <option key={index} value={counselor._id}>{counselor.name}</option>
                ))}
              </select>
            </div>

            {showPanel === 'RefferAllLeads' && (
              <div style={{ marginBottom: '16px', padding: '12px 14px', background: '#fef2f4', borderRadius: '10px', border: '1px solid #fecdd3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    <i className="fas fa-users me-1"></i> Selected Leads
                  </span>
                  <span style={{ fontWeight: 700, color: '#ff4d7a', fontSize: '13px' }}>{selectedProfiles?.length || 0}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Type a number in the bulk bar above to auto-select leads.</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="button" onClick={closePanel} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                Close
              </button>
              <button
                type="button"
                onClick={(e) => handleReferLead(e)}
                disabled={isDisabled}
                style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: isDisabled ? '#e2e8f0' : 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)', color: isDisabled ? '#94a3b8' : '#fff', fontWeight: 700, fontSize: '13px', cursor: isDisabled ? 'not-allowed' : 'pointer', boxShadow: isDisabled ? 'none' : '0 4px 12px rgba(255,77,122,0.3)' }}
              >
                {showPanel === 'Reffer' ? 'Refer Lead' : 'Refer All Leads'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );

    if (isMobile) {
      return (showPanel === 'Reffer') || (showPanel === 'RefferAllLeads') ? (
        <div
          className={'modal show d-block'}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              {panelContent}
            </div>
          </div>
        </div>
      ) : null;
    }

    return (showPanel === 'Reffer') || (showPanel === 'RefferAllLeads') ? (
      <div className="col-12 transition-col" id="refferPanel">
        {panelContent}
      </div>
    ) : null;
  };

  const fetchLeadLogs = async (leadId) => {
    try {
      setLeadLogsLoading(true);
      const response = await axios.get(`${backendUrl}/college/b2b_copy/leads/${leadId}/logs`, {
        headers: { 'x-auth': token }
      });
      if (response.data.status) {
        // console.log(response.data.data, 'response.data.data')
        setLeadLogs(response.data.data);
      }
    } catch (error) {
      console.log(error, 'error');
    } finally {
      setLeadLogsLoading(false);
    }
  }

  useEffect(() => {
    if (showPanel === 'leadHistory') {
      fetchLeadLogs(selectedProfile._id);
    }
  }, [showPanel]);

  // Render Edit Panel (Desktop Sidebar or Mobile Modal)
  const renderLeadHistoryPanel = () => {
    const panelContent = (
      <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        {/* Gradient Header */}
        <div style={{ background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fas fa-history" style={{ color: '#fff', fontSize: '14px' }}></i>
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>Lead History</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', marginTop: '2px' }}>
                  {leadLogs?.logs?.length || 0} events recorded
                </div>
              </div>
            </div>
            <button type="button" onClick={closePanel} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <i className="fas fa-times" style={{ color: '#fff', fontSize: '13px' }}></i>
            </button>
          </div>
        </div>

        {/* Timeline Body */}
        <div style={{ padding: '16px 18px', overflowY: 'auto', maxHeight: isMobile ? '60vh' : '65vh' }}>
          {leadLogsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <i className="fas fa-spinner fa-spin" style={{ color: '#ff4d7a', fontSize: '24px' }}></i>
            </div>
          ) : leadLogs?.logs?.length > 0 ? (
            <div style={{ position: 'relative' }}>
              {leadLogs.logs.map((log, index) => (
                <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: index !== leadLogs.logs.length - 1 ? '4px' : '0' }}>
                  {/* Timeline line + dot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)', marginTop: '14px', flexShrink: 0, boxShadow: '0 0 0 3px rgba(255,77,122,0.15)' }}></div>
                    {index !== leadLogs.logs.length - 1 && (
                      <div style={{ width: '2px', flex: 1, background: '#f1f5f9', minHeight: '24px', marginTop: '4px' }}></div>
                    )}
                  </div>

                  {/* Log card */}
                  <div style={{ flex: 1, background: '#fafbfc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px' }}>
                    {/* Date + user row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)', color: '#fff', fontSize: '11px', fontWeight: 600, borderRadius: '6px', padding: '3px 9px' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        }) : 'Unknown Date'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        <i className="fas fa-user me-1"></i>{log.user || 'Unknown'}
                      </span>
                    </div>

                    {/* Action */}
                    {log.action && (
                      <div style={{ marginBottom: log.remarks ? '8px' : '0' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Action</div>
                        <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
                          {log.action.split(';').map((part, i) => (
                            <div key={i} style={{ display: 'flex', gap: '6px' }}>
                              <span style={{ color: '#ff4d7a', flexShrink: 0 }}>•</span>
                              <span>{part.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remarks */}
                    {log.remarks && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Remarks</div>
                        <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>{log.remarks}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fef2f4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <i className="fas fa-history" style={{ color: '#ff4d7a', fontSize: '20px', opacity: 0.6 }}></i>
              </div>
              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px', marginBottom: '4px' }}>No History</div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>No actions have been recorded yet.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
          <button type="button" onClick={closePanel} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    );

    if (isMobile) {
      return showPanel === 'leadHistory' ? (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxHeight: '90vh' }}>
            <div className="modal-content" style={{ height: '85vh' }}>
              {panelContent}
            </div>
          </div>
        </div>
      ) : null;
    }

    return showPanel === 'leadHistory' ? (
      <div className="col-12 transition-col" id="leadHistoryPanel" style={{ height: '80vh' }}>
        {panelContent}
      </div>
    ) : null;
  };



  // ===== Derived data for redesigned tabs =====
  const nowTs = Date.now();
  const followupSourceLeads = followupLeadsData;
  const getFollowupTypeKey = useCallback((followUp) => {
    const rawType = String(followUp?.followUpType || '').toLowerCase();
    if (rawType.includes('meeting')) return 'meeting';
    return 'calls';
  }, []);

  const followupLeads = useMemo(() => {
    return (followupSourceLeads || []).filter((l) => {
      if (!l?.followUp || typeof l.followUp !== 'object' || l.followUp === null) return false;
      return getFollowupTypeKey(l.followUp) === followupChannelTab;
    });
  }, [followupSourceLeads, followupChannelTab, getFollowupTypeKey]);
  const followupBuckets = followupLeads.reduce(
    (acc, l) => {
      // `followUp` can be populated object OR just an ObjectId string.
      const fu =
        l && typeof l.followUp === 'object' && l.followUp !== null
          ? l.followUp
          : {};
      const status = (fu.status || '').toLowerCase();
      const scheduledTs = fu.scheduledDate ? new Date(fu.scheduledDate).getTime() : NaN;
      const hasSchedule = Number.isFinite(scheduledTs);

      // Backend: status Pending | Completed | Rescheduled (see followUp model)
      if (status === 'completed') {
        acc.done.push(l);
        return acc;
      }

      if (hasSchedule && scheduledTs < nowTs) {
        acc.missed.push(l);
        return acc;
      }

      if (hasSchedule && scheduledTs >= nowTs) {
        acc.scheduled.push(l);
        return acc;
      }

      // Pending: open followup, no upcoming/past scheduled slot on record
      acc.pending.push(l);
      return acc;
    },
    { done: [], pending: [], scheduled: [], missed: [] }
  );

  const followupVisibleLeads = useMemo(() => {
    const bucket =
      followupTab === 'done' ? followupBuckets.done :
        followupTab === 'missed' ? followupBuckets.missed :
          followupTab === 'scheduled' ? followupBuckets.scheduled :
            followupBuckets.pending;

    if (followupTab !== 'scheduled') return bucket;

    const days = parseInt(scheduledDays, 10);
    const maxDays = Number.isFinite(days) ? days : 1;

    return bucket.filter((l) => {
      const fu =
        l && typeof l.followUp === 'object' && l.followUp !== null
          ? l.followUp
          : {};
      const ts = fu.scheduledDate ? new Date(fu.scheduledDate).getTime() : NaN;
      if (!Number.isFinite(ts)) return false;
      const diffDays = (ts - Date.now()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= maxDays;
    });
  }, [followupBuckets, followupTab, scheduledDays]);

  const followupStatusFilteredLeads = useMemo(() => {
    if (!selectedStatusFilter) return followupVisibleLeads;
    const selectedIds = Array.isArray(selectedStatusFilter)
      ? selectedStatusFilter.map(String)
      : [String(selectedStatusFilter)];
    return followupVisibleLeads.filter((l) => {
      const statusId = typeof l?.status === 'object' && l?.status !== null ? l.status?._id : l?.status;
      if (statusId == null) return false;
      return selectedIds.some((id) => String(id) === String(statusId));
    });
  }, [followupVisibleLeads, selectedStatusFilter]);

  const followupBucketsByChannel = useMemo(() => {
    const seed = {
      calls: { done: [], pending: [], scheduled: [], missed: [] },
      meeting: { done: [], pending: [], scheduled: [], missed: [] },
    };

    return (followupSourceLeads || []).reduce((acc, l) => {
      const fu =
        l && typeof l.followUp === 'object' && l.followUp !== null
          ? l.followUp
          : {};
      const channel = getFollowupTypeKey(fu);
      const status = (fu.status || '').toLowerCase();
      const scheduledTs = fu.scheduledDate ? new Date(fu.scheduledDate).getTime() : NaN;
      const hasSchedule = Number.isFinite(scheduledTs);

      if (status === 'completed') {
        acc[channel].done.push(l);
        return acc;
      }

      if (hasSchedule && scheduledTs < nowTs) {
        acc[channel].missed.push(l);
        return acc;
      }

      if (hasSchedule && scheduledTs >= nowTs) {
        acc[channel].scheduled.push(l);
        return acc;
      }

      acc[channel].pending.push(l);
      return acc;
    }, seed);
  }, [followupSourceLeads, getFollowupTypeKey, nowTs]);

  const followupChannelCounts = useMemo(() => {
    return (followupSourceLeads || []).reduce(
      (acc, lead) => {
        if (!lead?.followUp || typeof lead.followUp !== 'object' || lead.followUp === null) return acc;
        const key = getFollowupTypeKey(lead.followUp);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { calls: 0, meeting: 0 }
    );
  }, [followupSourceLeads, getFollowupTypeKey]);

  /** CRM sub-status has `hasAttachment` → lead needs documents at this stage */
  const leadsNeedingDocuments = useMemo(() => {
    return (leads || []).filter((lead) => {
      const subs = lead?.status?.substatuses;
      if (!Array.isArray(subs) || subs.length === 0) return false;
      const subId =
        lead.subStatus && typeof lead.subStatus === 'object' && lead.subStatus !== null
          ? lead.subStatus._id
          : lead.subStatus;
      if (!subId) return false;
      const sub = subs.find((s) => String(s._id) === String(subId));
      return !!sub?.hasAttachment;
    });
  }, [leads]);

  const approvalTabMeta = useMemo(() => ({
    all: { count: approvalSummary.total ?? 0, bg: '#6b7280', color: '#ffffff' },
    pending: { count: approvalSummary.pending ?? 0, bg: '#f59e0b', color: '#111827' },
    approved: { count: approvalSummary.accepted ?? 0, bg: '#16a34a', color: '#ffffff' },
    rejected: { count: approvalSummary.rejected ?? 0, bg: '#dc2626', color: '#ffffff' },
  }), [approvalSummary]);

  const performanceTabMeta = useMemo(() => ({
    all: { count: performanceSummary.all ?? 0, bg: '#64748b', color: '#ffffff' },
    hot: { count: performanceSummary.hot ?? 0, bg: '#ef4444', color: '#ffffff' },
    warm: { count: performanceSummary.warm ?? 0, bg: '#f59e0b', color: '#111827' },
    cold: { count: performanceSummary.cold ?? 0, bg: '#3b82f6', color: '#ffffff' },
    prospect: { count: performanceSummary.prospect ?? 0, bg: '#8b5cf6', color: '#ffffff' },
    won: { count: performanceSummary.won ?? 0, bg: '#0d9488', color: '#ffffff' },
  }), [performanceSummary]);

  const followupTabMeta = useMemo(() => {
    const currentChannelBuckets = followupBucketsByChannel[followupChannelTab] || { done: [], pending: [], scheduled: [], missed: [] };
    const total = followupChannelCounts[followupChannelTab] ?? 0;
    return {
      all: { count: total, bg: '#64748b', color: '#ffffff' },
      pending: { count: currentChannelBuckets.pending.length, bg: '#f59e0b', color: '#111827' },
      done: { count: currentChannelBuckets.done.length, bg: '#16a34a', color: '#ffffff' },
      scheduled: { count: currentChannelBuckets.scheduled.length, bg: '#2563eb', color: '#ffffff' },
      missed: { count: currentChannelBuckets.missed.length, bg: '#dc2626', color: '#ffffff' },
    };
  }, [followupBucketsByChannel, followupChannelCounts, followupChannelTab]);

  const documentTabMeta = { count: leadsNeedingDocuments.length, bg: '#f59e0b', color: '#111827' };

  return (
    <div className="container-fluid b2b-cycle">
      <style>{b2bCycleUiStyles}</style>
      <style>{multiSelectCheckboxStyles}</style>

      <div className="row">
        <div className={isMobile ? 'col-12' : mainContentClass} style={{
          width: !isMobile && showPanel ? 'calc(100% - 350px)' : '100%',
          marginRight: !isMobile && showPanel ? '350px' : '0',
          transition: 'all 0.3s ease'
        }}>
          <div
            className="content-blur-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: `${navHeight + 50}px`,
              background: `linear-gradient(
                180deg,
                rgba(255, 255, 255, ${isScrolled ? 0.7 : 0}) 0%,
                rgba(255, 255, 255, ${isScrolled ? 0.5 : 0}) 50%,
                rgba(255, 255, 255, ${isScrolled ? 0.2 : 0}) 80%,
                transparent 100%
              )`,
              backdropFilter: isScrolled ? `blur(${blurIntensity * 0.5}px)` : 'none',
              WebkitBackdropFilter: isScrolled ? `blur(${blurIntensity * 0.5}px)` : 'none',
              pointerEvents: 'none',
              zIndex: 9,
              transition: 'all 0.3s ease',
              opacity: isScrolled ? 1 : 0
            }}
          />
          <div className="position-relative" ref={widthRef} >
            <nav
              ref={navRef}
              className="topbar"
              style={{
                zIndex: 11,
                position: 'fixed',
                width: `${width}px`,
                left: `${leftOffset}px`,
                boxShadow: '0 4px 25px 0 #0000001a',
                paddingBlock: '5px',
                background: '#fff'
              }}
            >
              <div className="container-fluid">
                <div className="row align-items-center">
                  <div className="col-md-6 d-md-block d-sm-none">
                    <div className="d-flex align-items-center">
                      <Link to="/institute/dashboard" className="topbar-brand text-black">

                        <span className="topbar-name" style={{


                        }}>B2B Cycle</span>
                      </Link>
                      <nav className="breadcrumb" aria-label="breadcrumb">
                        <Link to="/institute/dashboard">Home</Link>
                        <span className="breadcrumb-sep">/</span>
                        <span>B2B Cycle</span>
                      </nav>
                    </div>
                  </div>

                  <div className="col-md-6">
                    {/* Desktop Layout */}
                    <div className="d-none flex-row-reverse d-md-flex justify-content-between align-items-center gap-2">
                      {/* Left side - Buttons */}
                      <div style={{ display: "flex", gap: "8px" }}>
                        {/* Quick Search */}
                        <div className="d-flex align-items-center gap-2">
                          <div className="position-relative">
                            <div className="search-wrap">
                              <input
                                type="text"
                                className="search-input"
                                placeholder="Search leads…"
                                value={filters.search}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleFilterChange('search', val);
                                  if (val === '') applyFilters({ search: '' });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') applyFilters();
                                }}
                              />
                              <i className="fas fa-search search-icon" />
                              {filters.search && (
                                <button
                                  type="button"
                                  className="btn btn-sm position-absolute"
                                  onClick={() => {
                                    handleFilterChange('search', '');
                                    applyFilters({ search: '' });
                                  }}
                                  style={{
                                    right: '2px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    padding: '2px 6px',
                                    backgroundColor: '#dc3545',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <i className="fas fa-times" style={{ fontSize: '8px' }}></i>
                                </button>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={applyFilters}
                            disabled={!filters.search}
                            style={{
                              background: 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)',
                              border: 'none',
                              color: 'white',
                              fontWeight: '500',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              boxShadow: '0 2px 4px rgba(255, 77, 122, 0.3)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <i className="fas fa-search me-1"></i>
                          </button>
                        </div>

                        <button
                          className={`icon-btn ${showFilters ? 'active' : ''}`}
                          onClick={() => setShowFilters(!showFilters)}
                          style={{
                            padding: '8px 16px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <i className="fas fa-filter me-1"></i>
                        </button>

                      </div>

                      {/* Right side - Input Fields for Bulk Refer */}
                      {showBulkInputs && bulkMode === 'bulkrefer' && (
                        <div style={{
                          display: "flex",
                          alignItems: "stretch",
                          border: "1px solid #dee2e6",
                          borderRadius: "4px",
                          backgroundColor: "#fff",
                          overflow: "hidden",
                          width: "200px",
                          height: "32px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                        }}>
                          <input
                            type="text"
                            placeholder="Input 1"
                            value={input1Value}
                            onChange={(e) => {
                              const maxValue = performanceListTotal || performanceLeads?.length || 0;
                              let inputValue = e.target.value.replace(/[^0-9]/g, '');

                              if (inputValue === '') {
                                setInput1Value('');
                                return;
                              }

                              const numValue = parseInt(inputValue, 10);

                              if (numValue < 1 || isNaN(numValue)) {
                                inputValue = '1';
                              } else if (numValue > maxValue) {
                                inputValue = maxValue.toString();
                              }

                              setInput1Value(inputValue);
                            }}
                            onKeyDown={(e) => {
                              if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab' && e.key !== 'Enter') {
                                e.preventDefault();
                              }
                            }}
                            style={{
                              width: "50%",
                              border: "none",
                              borderRight: "1px solid #dee2e6",
                              outline: "none",
                              padding: "4px 10px",
                              fontSize: "12px",
                              backgroundColor: "transparent",
                              height: "100%",
                              boxSizing: "border-box"
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Input 2"
                            value={performanceListTotal || performanceLeads?.length || 0}
                            readOnly
                            style={{
                              width: "50%",
                              border: "none",
                              outline: "none",
                              padding: "4px 10px",
                              fontSize: "12px",
                              backgroundColor: "transparent",
                              height: "100%",
                              boxSizing: "border-box",
                              cursor: "default"
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="col-12 d-md-none mt-2">
                    <div className="row g-2">
                      {((permissions?.custom_permissions?.can_assign_leads && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                        <div className="col-6">
                          <button
                            className="btn w-100"
                            disabled={loadingPerformanceLeads || performanceLeads.length === 0}
                            style={{
                              padding: "12px 8px",
                              fontSize: "13px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              backgroundColor: loadingPerformanceLeads || performanceLeads.length === 0 ? '#ccc' : '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(108, 117, 125, 0.3)',
                              transition: 'all 0.2s ease',
                              cursor: loadingPerformanceLeads || performanceLeads.length === 0 ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => {
                              setShowBulkInputs(true);
                              setBulkMode('bulkrefer');
                              setInput1Value('');
                              openRefferPanel(null, 'RefferAllLeads');
                            }}
                            onMouseEnter={(e) => {
                              if (!loadingPerformanceLeads && performanceLeads.length > 0) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.4)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(108, 117, 125, 0.3)';
                            }}
                          >
                            <i className="fas fa-share-alt" style={{ fontSize: "14px" }}></i>
                            Refer Leads
                          </button>
                        </div>
                      )}
                      {/* Mobile Bulk Input Fields for Bulk Refer */}
                      {showBulkInputs && bulkMode === 'bulkrefer' && (
                        <div className="col-12 mt-2">
                          <div style={{
                            display: "flex",
                            alignItems: "stretch",
                            border: "1px solid #dee2e6",
                            borderRadius: "4px",
                            backgroundColor: "#fff",
                            overflow: "hidden",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                          }}>
                            <input
                              type="text"
                              placeholder="Input 1"
                              value={input1Value}
                              onChange={(e) => {
                                const maxValue = performanceListTotal || performanceLeads?.length || 0;
                                let inputValue = e.target.value.replace(/[^0-9]/g, '');

                                if (inputValue === '') {
                                  setInput1Value('');
                                  return;
                                }

                                const numValue = parseInt(inputValue, 10);

                                if (numValue < 1 || isNaN(numValue)) {
                                  inputValue = '1';
                                } else if (numValue > maxValue) {
                                  inputValue = maxValue.toString();
                                }

                                setInput1Value(inputValue);
                              }}
                              onKeyDown={(e) => {
                                if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab' && e.key !== 'Enter') {
                                  e.preventDefault();
                                }
                              }}
                              style={{
                                width: "50%",
                                border: "none",
                                borderRight: "1px solid #dee2e6",
                                outline: "none",
                                padding: "8px 12px",
                                fontSize: "14px",
                                backgroundColor: "transparent",
                                height: "40px",
                                boxSizing: "border-box"
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Input 2"
                              value={performanceListTotal || performanceLeads?.length || 0}
                              readOnly
                              style={{
                                width: "50%",
                                border: "none",
                                outline: "none",
                                padding: "8px 12px",
                                fontSize: "14px",
                                backgroundColor: "transparent",
                                height: "40px",
                                boxSizing: "border-box",
                                cursor: "default"
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="col-12 mt-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="position-relative flex-grow-1">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="🔍 Search leads..."
                              value={filters.search}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleFilterChange('search', val);
                                if (val === '') applyFilters({ search: '' });
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  applyFilters();
                                }
                              }}
                              style={{
                                paddingRight: '35px',
                                paddingLeft: '14px',
                                paddingTop: '12px',
                                paddingBottom: '12px',
                                backgroundColor: '#ffffff',
                                border: '1.5px solid #ced4da',
                                color: '#212529',
                                fontSize: '14px',
                                borderRadius: '8px',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            {filters.search && (
                              <button
                                type="button"
                                className="btn btn-sm position-absolute"
                                onClick={() => {
                                  handleFilterChange('search', '');
                                  applyFilters({ search: '' });
                                }}
                                style={{
                                  right: '4px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  padding: '4px 8px',
                                  backgroundColor: '#dc3545',
                                  border: 'none',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)'
                                }}
                              >
                                <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={applyFilters}
                            disabled={!filters.search}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              fontSize: '14px',
                              minWidth: '48px',
                              height: '48px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(255, 77, 122, 0.3)',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!e.currentTarget.disabled) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 77, 122, 0.4)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 77, 122, 0.3)';
                            }}
                          >
                            <i className="fas fa-search" style={{ fontSize: '16px' }}></i>
                          </button>
                          <button
                            className={`btn ${showFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              fontSize: '14px',
                              minWidth: '48px',
                              height: '48px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: showFilters ? '0 2px 8px rgba(255, 77, 122, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                              transition: 'all 0.2s ease',
                              borderWidth: '1.5px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 77, 122, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = showFilters ? '0 2px 8px rgba(255, 77, 122, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)';
                            }}
                          >
                            <i className="fas fa-filter" style={{ fontSize: '16px' }}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </nav>
          </div>




          {/* Main Content */}
          <div className="content-body marginTopMobile" style={{
            marginTop: `${navHeight + 5}px`,
            transition: 'margin-top 0.2s ease-in-out'
          }}>
            {/* Lead actions + navigation (one strip) */}
            <div className="card border-0 shadow-sm mb-2" style={{ borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div className="card-body py-2 px-3">
                <div className="d-flex flex-wrap align-items-center gap-1">

                  <div className="d-flex flex-wrap gap-1 align-items-center flex-grow-1 justify-content-sm-end position-relative" ref={topbarMenuRef}>
                    <div className="d-flex flex-wrap gap-1 align-items-center">


                     
                      <div
                        className="d-flex align-items-center justify-content-between gap-2 flex-grow-1"
                        style={{ minWidth: 0, flex: '1 1 220px' }}
                      >
                        <div
                          className="position-relative d-flex gap-1 align-items-start"
                          onMouseEnter={() => openTopbarMenu('lead')}
                          onMouseLeave={scheduleCloseTopbarMenu}
                        >
                          {((permissions?.custom_permissions?.can_add_leads_b2b && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={handleOpenLeadModal}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', borderRadius: '20px', padding: '5px 12px', fontSize: '12px' }}
                            >
                              <i className="fas fa-plus" style={{ fontSize: '10px' }}></i>
                              Add Lead
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                              toggleTopbarMenu('lead');
                              setCardsView('lead');
                              setLeadTab('approval');
                              setTimeout(() => scrollToB2bSection('b2b-section-lead'), 0);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', borderRadius: '20px', padding: '5px 10px', fontSize: '12px' }}
                            title="Lead — approval queue (All / Pending / Accepted / Rejected)"
                            aria-expanded={topbarMenuOpen === 'lead'}
                          >
                            <i className="fas fa-handshake" style={{ fontSize: '10px' }} aria-hidden />
                            Lead Approval
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '2px' }}>
                              {[
                                { key: 'all', meta: approvalTabMeta.all },
                                { key: 'pending', meta: approvalTabMeta.pending },
                                { key: 'approved', meta: approvalTabMeta.approved },
                                { key: 'rejected', meta: approvalTabMeta.rejected },
                              ].map(({ key, meta }) => (
                                <span
                                  key={key}
                                  className="badge"
                                  style={{ background: loadingApprovalSummary ? '#e5e7eb' : meta.bg, color: loadingApprovalSummary ? '#6b7280' : meta.color, minWidth: '18px', height: '18px', padding: '0 5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', fontSize: '9px', fontWeight: 700 }}
                                >
                                  {loadingApprovalSummary ? '...' : meta.count}
                                </span>
                              ))}
                            </span>
                            <i className="fas fa-chevron-down ms-1" style={{ fontSize: '8px', opacity: 0.75 }} aria-hidden />
                          </button>
                          {topbarMenuOpen === 'lead' && (
                            <ul className="list-unstyled position-absolute bg-white border rounded shadow-sm py-1 mt-1 mb-0" style={{ zIndex: 9, minWidth: '210px', left: 0, top: '100%' }} role="menu">
                              {[
                                { sub: 'all', label: 'All', count: approvalSummary.total ?? 0, badgeClass: 'bg-secondary' },
                                { sub: 'pending', label: 'Pending', count: approvalSummary.pending ?? 0, badgeClass: 'bg-warning text-dark' },
                                { sub: 'approved', label: 'Accepted', count: approvalSummary.accepted ?? 0, badgeClass: 'bg-success' },
                                { sub: 'rejected', label: 'Rejected', count: approvalSummary.rejected ?? 0, badgeClass: 'bg-danger' },
                              ].map(({ sub, label, count, badgeClass }) => (
                                <li key={sub} role="none">
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="dropdown-item d-flex align-items-center justify-content-between gap-2 py-2 px-3 border-0 bg-transparent w-100 text-start"
                                    style={{ fontSize: '13px' }}
                                    onClick={() => {
                                      setTopbarMenuOpen(null);
                                      setCardsView('lead');
                                      setLeadTab('approval');
                                      setLeadApprovalTab(sub);
                                      setTimeout(() => scrollToB2bSection('b2b-section-lead'), 0);
                                    }}
                                  >
                                    <span>{label}</span>
                                    <span className={`badge ${badgeClass}`}>{loadingApprovalSummary ? '…' : count}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`btn btn-sm ${leadTab === 'report' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => { setCardsView('lead'); setLeadTab('report'); setTimeout(() => scrollToB2bSection('b2b-section-lead'), 0); }}
                          style={{ borderRadius: '20px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', flexShrink: 0, alignSelf: 'center' }}
                        >
                          Lead Report
                        </button>
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 2px' }} aria-hidden="true"></div>

                    <div className="d-flex flex-wrap gap-1 align-items-center">
                      {/* Performance tab + dropdown */}
                      <div
                        className="position-relative"
                        onMouseEnter={() => openTopbarMenu('performance')}
                        onMouseLeave={scheduleCloseTopbarMenu}
                      >
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => toggleTopbarMenu('performance')}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', borderRadius: '20px', padding: '5px 10px', fontSize: '12px' }}
                          title="Performance"
                          aria-expanded={topbarMenuOpen === 'performance'}
                        >
                          <i className="fas fa-chart-line" style={{ fontSize: '10px' }} aria-hidden />
                          Performance
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '2px' }}>
                            {[
                              performanceTabMeta.all,
                              performanceTabMeta.hot,
                              performanceTabMeta.warm,
                              performanceTabMeta.cold,
                              performanceTabMeta.prospect,
                              performanceTabMeta.won,
                            ].map((meta, index) => (
                              <span
                                key={index}
                                className="badge"
                                style={{ background: loadingPerformanceSummary ? '#e5e7eb' : meta.bg, color: loadingPerformanceSummary ? '#6b7280' : meta.color, minWidth: '18px', height: '18px', padding: '0 5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', fontSize: '9px', fontWeight: 700 }}
                              >
                                {loadingPerformanceSummary ? '...' : meta.count}
                              </span>
                            ))}
                          </span>
                          <i className="fas fa-chevron-down ms-1" style={{ fontSize: '8px', opacity: 0.75 }} aria-hidden />
                        </button>
                        {topbarMenuOpen === 'performance' && (
                          <ul className="list-unstyled position-absolute bg-white border rounded shadow-sm py-1 mt-1 mb-0" style={{ zIndex: 9, minWidth: '220px', left: 0 }} role="menu">
                            {[
                              { id: 'all', label: 'All', dot: '#64748b', bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' },
                              { id: 'hot', label: 'Hot', dot: '#ef4444', bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
                              { id: 'warm', label: 'Warm', dot: '#f59e0b', bg: '#fffbeb', color: '#b45309', border: '#fcd34d' },
                              { id: 'cold', label: 'Cold', dot: '#3b82f6', bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
                              { id: 'prospect', label: 'Prospect', dot: '#8b5cf6', bg: '#f5f3ff', color: '#6d28d9', border: '#c4b5fd' },
                              { id: 'won', label: 'Won', dot: '#0d9488', bg: '#ccfbf1', color: '#115e59', border: '#5eead4' },
                            ].map(({ id, label, dot, bg, color, border }) => (
                              <li key={id} role="none">
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="dropdown-item d-flex align-items-center justify-content-between gap-2 py-2 px-3 border-0 bg-transparent w-100 text-start"
                                  style={{ fontSize: '13px' }}
                                  onClick={() => {
                                    setTopbarMenuOpen(null);
                                    setCardsView('performance');
                                    setPerformanceTab(id);
                                    setTimeout(() => scrollToB2bSection('b2b-section-lead'), 0);
                                  }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }}></span>
                                    <span style={{ color: '#334155', fontWeight: 500 }}>{label}</span>
                                  </span>
                                  <span className="badge" style={{ background: bg, color, border: `1px solid ${border}`, minWidth: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {loadingPerformanceSummary ? '—' : (performanceSummary[id] ?? 0)}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 2px' }} aria-hidden="true"></div>

                    <div className="d-flex flex-wrap gap-1 align-items-center">
                      {/* Followup tab + dropdown */}
                      <div
                        className="position-relative"
                        onMouseEnter={() => openTopbarMenu('followup')}
                        onMouseLeave={scheduleCloseTopbarMenu}
                      >
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => toggleTopbarMenu('followup')}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', borderRadius: '20px', padding: '5px 10px', fontSize: '12px' }}
                          title="Followup"
                          aria-expanded={topbarMenuOpen === 'followup'}
                        >
                          <i className="fas fa-calendar-check" style={{ fontSize: '10px' }} aria-hidden />
                          Followup
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '2px' }}>
                            {[
                              followupTabMeta.pending,
                              followupTabMeta.done,
                              followupTabMeta.scheduled,
                              followupTabMeta.missed,
                            ].map((meta, index) => (
                              <span
                                key={index}
                                className="badge"
                                style={{ background: loadingFollowupLeads ? '#e5e7eb' : meta.bg, color: loadingFollowupLeads ? '#6b7280' : meta.color, minWidth: '18px', height: '18px', padding: '0 5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', fontSize: '9px', fontWeight: 700 }}
                              >
                                {loadingFollowupLeads ? '...' : meta.count}
                              </span>
                            ))}
                          </span>
                          <i className="fas fa-chevron-down ms-1" style={{ fontSize: '8px', opacity: 0.75 }} aria-hidden />
                        </button>
                        {topbarMenuOpen === 'followup' && (
                          <div
                            className="position-absolute bg-white border rounded shadow-sm mt-1"
                            style={{ zIndex: 1051, minWidth: '220px', left: 0 }}
                            role="menu"
                          >
                            <ul className="list-unstyled py-1 mb-0" style={{ display: 'flex', flexDirection: 'column' }}>
                              {[
                                { id: 'calls', label: 'Followup Call', icon: 'fas fa-phone-alt', bg: '#eef6ff', border: '#93c5fd', color: '#1d4ed8', count: followupChannelCounts.calls },
                                { id: 'meeting', label: 'Followup Meeting', icon: 'fas fa-handshake', bg: '#fff1f2', border: '#fda4af', color: '#be123c', count: followupChannelCounts.meeting },
                              ].map((item) => (
                                <li
                                  key={item.id}
                                  role="none"
                                  className="position-relative"
                                  onMouseEnter={() => setFollowupHoverChannel(item.id)}
                                  onMouseLeave={() => setFollowupHoverChannel(null)}
                                >
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="border-0 bg-transparent w-100 text-start"
                                    style={{ fontSize: '13px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%', padding: '10px 14px', background: followupHoverChannel === item.id ? '#f8fafc' : '#fff', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
                                    onClick={() => {
                                      setCardsView('followup');
                                      setActivitySectionView('followup');
                                      setFollowupChannelTab(item.id);
                                      setTopbarMenuOpen(null);
                                      setFollowupHoverChannel(null);
                                      setTimeout(() => scrollToB2bSection('b2b-section-lead'), 0);
                                    }}
                                  >
                                    <span style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                      <i className={item.icon} style={{ color: item.color, fontSize: '11px', width: '12px', flexShrink: 0 }}></i>
                                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155', fontWeight: 500 }}>{item.label}</span>
                                    </span>
                                    <span style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                      <span className="badge" style={{ background: item.bg, color: item.color, border: `1px solid ${item.border}`, minWidth: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {loadingFollowupLeads ? '—' : item.count}
                                      </span>
                                      <i className={`fas fa-chevron-${followupHoverChannel === item.id ? 'down' : 'right'}`} style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0, transition: 'transform 0.15s' }}></i>
                                    </span>
                                  </button>
                                  {followupHoverChannel === item.id && (
                                    <ul
                                      className="list-unstyled bg-white border rounded shadow-sm py-1 mb-0"
                                      style={{ minWidth: '100%', marginTop: '2px', borderTop: '1px solid #e2e8f0' }}
                                      role="menu"
                                    >
                                      {[
                                        { sub: 'done', label: 'Done', count: followupBucketsByChannel[item.id].done.length, dot: '#22c55e', bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
                                        { sub: 'pending', label: 'Pending', count: followupBucketsByChannel[item.id].pending.length, dot: '#f59e0b', bg: '#fffbeb', color: '#b45309', border: '#fcd34d' },
                                        { sub: 'scheduled', label: 'Scheduled', count: followupBucketsByChannel[item.id].scheduled.length, dot: '#3b82f6', bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
                                        { sub: 'missed', label: 'Missed', count: followupBucketsByChannel[item.id].missed.length, dot: '#ef4444', bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
                                      ].map(({ sub, label, count, dot, bg, color, border }) => (
                                        <li
                                          key={`${item.id}-${sub}`}
                                          role="none"
                                          className="position-relative"
                                        >
                                          <button
                                            type="button"
                                            role="menuitem"
                                            className="dropdown-item d-flex align-items-center justify-content-between gap-2 py-2 px-3 border-0 bg-transparent w-100 text-start"
                                            style={{ fontSize: '13px' }}
                                            onClick={() => {
                                              setTopbarMenuOpen(null);
                                              setFollowupHoverChannel(null);
                                              setFollowupHoverSubItem(null);
                                              setCardsView('followup');
                                              setActivitySectionView('followup');
                                              setFollowupChannelTab(item.id);
                                              setFollowupTab(sub);
                                              setTimeout(() => scrollToB2bSection('b2b-section-lead'), 0);
                                            }}
                                          >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }}></span>
                                              <span style={{ color: '#334155', fontWeight: 500 }}>{label}</span>
                                            </span>
                                            <span className="badge" style={{ background: bg, color, border: `1px solid ${border}`, minWidth: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                              {loadingFollowupLeads ? '—' : count}
                                            </span>
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {false && topbarMenuOpen === 'followup' && (
                          <ul className="list-unstyled position-absolute bg-white border rounded shadow-sm py-1 mt-1 mb-0" style={{ zIndex: 9, minWidth: '220px', left: 0 }} role="menu">
                            9                            {[
                              { sub: 'done', label: 'Done', count: followupBuckets.done.length },
                              { sub: 'pending', label: 'Pending', count: followupBuckets.pending.length },
                              { sub: 'scheduled', label: 'Scheduled', count: followupBuckets.scheduled.length },
                              { sub: 'missed', label: 'Missed', count: followupBuckets.missed.length },
                            ].map(({ sub, label, count }) => (
                              <li key={sub} role="none">
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="dropdown-item d-flex align-items-center justify-content-between gap-2 py-2 px-3 border-0 bg-transparent w-100 text-start"
                                  style={{ fontSize: '13px' }}
                                  onClick={() => {
                                    setTopbarMenuOpen(null);
                                    setCardsView('followup');
                                    setActivitySectionView('followup');
                                    setFollowupTab(sub);
                                    setTimeout(() => scrollToB2bSection('b2b-section-lead'), 0);
                                  }}
                                >
                                  <span>{label}</span>
                                  <span className="badge bg-secondary">{loadingFollowupLeads ? '—' : count}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 2px' }} aria-hidden="true"></div>

                    <div className="d-flex flex-wrap gap-1 align-items-center">
                      {/* Documents tab + dropdown */}
                      <div
                        className="position-relative"
                        onMouseEnter={() => openTopbarMenu('documents')}
                        onMouseLeave={scheduleCloseTopbarMenu}
                      >
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => toggleTopbarMenu('documents')}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', borderRadius: '20px', padding: '5px 10px', fontSize: '12px' }}
                          title="Documents"
                          aria-expanded={topbarMenuOpen === 'documents'}
                        >
                          <i className="fas fa-file-alt" style={{ fontSize: '10px' }} aria-hidden />
                          Documents
                          <span
                            className="badge"
                            style={{ background: loadingLeads ? '#e5e7eb' : documentTabMeta.bg, color: loadingLeads ? '#6b7280' : documentTabMeta.color, minWidth: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', fontSize: '10px', fontWeight: 700 }}
                          >
                            {loadingLeads ? '...' : documentTabMeta.count}
                          </span>
                          <i className="fas fa-chevron-down ms-1" style={{ fontSize: '8px', opacity: 0.75 }} aria-hidden />
                        </button>
                        {topbarMenuOpen === 'documents' && (
                          <ul className="list-unstyled position-absolute bg-white border rounded shadow-sm py-1 mt-1 mb-0" style={{ zIndex: 9, minWidth: '220px', left: 0 }} role="menu">
                                                        <li role="none">
                              <button
                                type="button"
                                role="menuitem"
                                className="dropdown-item d-flex align-items-center justify-content-between gap-2 py-2 px-3 border-0 bg-transparent w-100 text-start"
                                style={{ fontSize: '13px' }}
                                onClick={() => {
                                  setTopbarMenuOpen(null);
                                  setCardsView('documents');
                                  setActivitySectionView('documents');
                                  setTimeout(() => scrollToB2bSection('b2b-section-lead'), 0);
                                }}
                              >
                                <span>Documents required</span>
                                <span className="badge bg-warning text-dark">{loadingLeads ? '…' : leadsNeedingDocuments.length}</span>
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 2px' }} aria-hidden="true"></div>

                    <div className="d-flex flex-wrap gap-1 align-items-center">

                    {((permissions?.custom_permissions?.can_add_leads_b2b && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                        <>
                         
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => { setShowBulkInputs(true); setBulkMode('bulkupload'); setInput1Value(''); setShowBulkUploadModal(true); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', borderRadius: '20px', padding: '5px 12px', fontSize: '12px' }}
                          >
                            <i className="fas fa-file-upload" style={{ fontSize: '10px' }}></i>
                            Bulk Upload
                          </button>
                        </>
                      )}
                      {((permissions?.custom_permissions?.can_assign_leads && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          disabled={loadingPerformanceLeads || performanceLeads.length === 0}
                          onClick={() => { setShowBulkInputs(true); setBulkMode('bulkrefer'); setInput1Value(''); openRefferPanel(null, 'RefferAllLeads'); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', borderRadius: '20px', padding: '5px 12px', fontSize: '12px' }}
                        >
                          <i className="fas fa-share-alt" style={{ fontSize: '10px' }}></i>
                          Refer All
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="mb-2">
              <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '11px', letterSpacing: '0.04em' }}>Performance (approved)</div>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                {loadingPerformanceSummary ? (
                  <>{[1,2,3,4,5].map(i => (
                    <div key={i} className="card border-0 shadow-sm" style={{ minWidth: '100px', height: '45px' }}>
                      <div className="card-body d-flex align-items-center justify-content-center">
                        <div className="spinner-border spinner-border-sm text-primary" role="status" />
                      </div>
                    </div>
                  ))}</>
                ) : (
                  <>
                    {[
                      { id: 'all', label: 'All', countKey: 'all', accent: '#ff4d7a' },
                      { id: 'hot', label: 'Hot', countKey: 'hot', accent: '#dc3545' },
                      { id: 'warm', label: 'Warm', countKey: 'warm', accent: '#fd7e14' },
                      { id: 'cold', label: 'Cold', countKey: 'cold', accent: '#6c757d' },
                      { id: 'prospect', label: 'Prospect', countKey: 'prospect', accent: '#198754' },
                      { id: 'won', label: 'Won', countKey: 'won', accent: '#0d9488' },
                    ].map(({ id, label, countKey, accent }) => {
                      const count = performanceSummary[countKey] ?? 0;
                      const selected = performanceTab === id;
                      return (
                        <div
                          key={id}
                          role="button"
                          tabIndex={0}
                          onClick={() => { setPerformanceTab(id); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setPerformanceTab(id);
                            }
                          }}
                          className="card border-0 shadow-sm"
                          style={{ minWidth: '100px', height: '45px', cursor: 'pointer', border: selected ? `2px solid ${accent}` : '1px solid #dee2e6', background: selected ? `${accent}14` : '#fff' }}
                        >
                          <div className="card-body p-1 text-center d-flex flex-column align-items-center justify-content-center h-100">
                            <span className="fw-bold" style={{ fontSize: '11px', color: '#212529' }}>{label}</span>
                            <small className="text-muted" style={{ fontSize: '10px' }}>{count} leads</small>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div> */}

            <div className="mb-3">
              <div className="text-muted text-uppercase fw-semibold mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>CRM Pipeline</div>
              <div className="d-flex flex-wrap gap-1" style={{ alignItems: 'center' }}>
                {loadingStatusCounts ? (
                  <>{[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ height: '32px', width: '90px', borderRadius: '20px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '14px', height: '14px' }} />
                    </div>
                  ))}</>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleTotalCardClick}
                      title="View all leads"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '5px 11px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                        background: selectedStatusFilter === null ? 'linear-gradient(135deg, #ff4d7a 0%, #c01855 100%)' : '#f1f5f9',
                        color: selectedStatusFilter === null ? '#fff' : '#475569',
                        fontSize: '12px', fontWeight: 600,
                        boxShadow: selectedStatusFilter === null ? '0 2px 8px rgba(255,77,122,0.28)' : 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <i className="fas fa-chart-line" style={{ fontSize: '10px' }}></i>
                      Total
                      <span style={{ fontWeight: 700, marginLeft: '2px' }}>{totalLeads}</span>
                    </button>
                    {pipelineStatusCounts.map((status, index) => {
                      const isSelected = selectedPipelineIdsEqual(selectedStatusFilter, status.statusIds);
                      return (
                        <button
                          key={status.statusIds?.join('-') || status.statusName || index}
                          type="button"
                          onClick={() => handlePipelineStatusClick(status.statusIds)}
                          title={`View ${status.statusName} leads`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '5px 11px', borderRadius: '20px', cursor: 'pointer',
                            border: isSelected ? '2px solid #ff4d7a' : '1.5px solid #e2e8f0',
                            background: isSelected ? '#fef2f4' : '#fff',
                            color: isSelected ? '#ff4d7a' : '#475569',
                            fontSize: '12px', fontWeight: 600,
                            boxShadow: isSelected ? '0 2px 8px rgba(255,77,122,0.15)' : 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <i className="fas fa-tag" style={{ fontSize: '10px', color: isSelected ? '#ff4d7a' : '#94a3b8' }}></i>
                          {status.statusName}
                          <span style={{ fontWeight: 700, color: isSelected ? '#ff4d7a' : '#64748b', marginLeft: '2px' }}>{status.count}</span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            <section id="b2b-section-lead" className="mb-3" style={{ scrollMarginTop: '96px' }}>
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body">
                  <div className="mb-2">
                    <h6 className="mb-1 fw-bold">Lead Management</h6>

                  </div>

                  {cardsView === 'performance' && (
                    <div className="mt-3">
                      {loadingPerformanceLeads ? (
                        <div className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-3 text-muted">Loading approved leads...</p>
                        </div>
                      ) : performanceLeads.length === 0 ? (
                        <div className="text-center text-muted py-4">
                          {performanceTab !== 'all' ? `No approved leads in ${performanceTab}` : 'No approved leads yet'}
                        </div>
                      ) : (
                        <div className="row g-2" style={{ rowGap: '18px' }}>
                          {performanceLeads.map((lead, leadIndex) => (
                            <div key={lead._id || leadIndex} className="col-12" style={{ position: 'relative', paddingTop: '10px' }}>
                              {/* Floating badges */}
                              <div style={{ position: 'absolute', top: '0px', left: '24px', display: 'flex', gap: '5px', zIndex: 3 }}>
                                {lead.leadCategory?.name && (
                                  <span title="Lead Source" style={{ background: '#fff', border: '1.5px solid #ff4d7a', color: '#ff4d7a', fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '2px 9px', boxShadow: '0 2px 8px rgba(255,77,122,0.2)', cursor: 'default', whiteSpace: 'nowrap' }}>
                                    {lead.leadCategory.name}
                                  </span>
                                )}
                                {lead.typeOfB2B?.name && (
                                  <span title="B2B Type" style={{ background: '#fff', border: '1.5px solid #c01855', color: '#c01855', fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '2px 9px', boxShadow: '0 2px 8px rgba(192,24,85,0.18)', cursor: 'default', whiteSpace: 'nowrap' }}>
                                    {lead.typeOfB2B.name}
                                  </span>
                                )}
                                {renderFloatingLeadStatusChips(lead)}
                              </div>

                              <div className={`lead-card ${(bulkMode === 'bulkrefer' && (selectedProfiles || []).includes(lead._id)) ? 'bulk-selected' : ''}`} style={{ marginBottom: 0 }}>
                                <div className="lead-header">
                                  <div className="lead-title-section">
                                    <span className="lead-contact-person">
                                      <i className="fas fa-user" style={{ fontSize: '11px', color: '#ff4d7a' }}></i>
                                      {lead.concernPersonName || '—'}
                                    </span>
                                    <div className="lead-contact-info">
                                      {lead.email && (
                                        <span className="lead-contact-item"><i className="fas fa-envelope"></i><span>{lead.email}</span></span>
                                      )}
                                      {lead.mobile && (
                                        <span className="lead-contact-item mobile"><i className="fas fa-phone"></i><span>{lead.mobile}</span></span>
                                      )}
                                      {lead.designation && (
                                        <span className="lead-contact-item"><i className="fas fa-id-badge"></i><span>{lead.designation}</span></span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center gap-1">
                                    {!!lead._id && (
                                      <Link
                                        to={`/institute/lrp?b2bLeadId=${encodeURIComponent(String(lead._id))}`}
                                        className="btn btn-sm btn-light border"
                                        title="Lead Report"
                                        style={{ borderRadius: '999px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                      >
                                        <i className="fas fa-clipboard-list" style={{ fontSize: '12px', color: '#c01855' }}></i>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Lead Report</span>
                                      </Link>
                                    )}
                                    {!!lead._id && (
                                      <button type="button" className="btn btn-sm btn-light border lead-collapse-btn" onClick={() => toggleLeadCardCollapsed(lead._id)} title={collapsedLeadCards.has(lead._id) ? 'Expand' : 'Collapse'} style={{ borderRadius: '999px', padding: '4px 8px' }}>
                                        <i className={`fas fa-chevron-${collapsedLeadCards.has(lead._id) ? 'down' : 'up'}`}></i>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {!lead._id || !collapsedLeadCards.has(lead._id) ? (
                                  <div className="lead-content">
                                    <div className="status-section mb-2">
                                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                        <div className="d-flex align-items-center flex-wrap gap-1">
                                          <i className="fas fa-chart-line text-danger me-1"></i>
                                          <span className="fw-bold text-dark">Performance:</span>
                                          <span className="badge bg-light text-dark border" style={{ borderColor: '#e2e8f0' }}>
                                            {lead.leadStatus
                                              ? PERF_LEAD_STATUS_LABEL[String(lead.leadStatus).toLowerCase()] || lead.leadStatus
                                              : '—'}
                                          </span>
                                          <span className="text-muted mx-1">|</span>
                                          <i className="fas fa-tag text-primary me-1"></i>
                                          <span className="fw-bold text-dark">CRM:</span>
                                          <span className="ms-1 badge bg-primary">{lead.status?.title || lead.status?.name || 'No Status'}</span>
                                          {getSubStatusTitle(lead) && (
                                            <span className="badge bg-secondary">{getSubStatusTitle(lead)}</span>
                                          )}
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                          <div className="d-flex align-items-center gap-2">
                                            <div style={{ minWidth: '92px', textAlign: 'center', background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '10px', padding: '6px 10px' }}>
                                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', lineHeight: 1.1 }}>Lead Age</div>
                                              <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginTop: '2px', lineHeight: 1.1 }}>{getLeadAgeText(lead)}</div>
                                            </div>
                                            <div style={{ minWidth: '130px', textAlign: 'center', background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '10px', padding: '6px 10px' }}>
                                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', lineHeight: 1.1 }}>Lead Lock</div>
                                              <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginTop: '2px', lineHeight: 1.1 }}>{getLockText(lead)}</div>
                                            </div>
                                          </div>
                                          <button className="btn btn-sm btn-outline-primary" onClick={() => openPanelHome(lead)} title="Open panel">
                                            <i className="fas fa-arrow-right me-1"></i>Open
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="compact-info-section">
                                      <div className="compact-info-grid">
                                        {lead.address && (
                                          <div className="compact-info-item">
                                            <i className="fas fa-map-marker-alt text-danger"></i>
                                            <span className="compact-info-label">Address:</span>
                                            <span className="compact-info-value">{lead.address}</span>
                                          </div>
                                        )}
                                        <div className="compact-info-item">
                                          <i className="fas fa-user-shield text-warning"></i>
                                          <span className="compact-info-label">Owner:</span>
                                          <span className="compact-info-value">{getLeadOwnerName(lead)}</span>
                                        </div>
                                        <div className="compact-info-item">
                                          <i className="fas fa-user-plus text-info"></i>
                                          <span className="compact-info-label">Added:</span>
                                          <span className="compact-info-value">{getLeadAddedByName(lead)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {cardsView === 'followup' && (
                    <div className="mt-3">


                      <div className="row g-2 mt-3">
                        {loadingFollowupLeads ? (
                          <div className="col-12 text-center text-muted py-4">Loading followups...</div>
                        ) : followupStatusFilteredLeads.length === 0 ? (
                          <div className="col-12 text-center text-muted py-4">
                            {selectedStatusFilter ? 'No leads found for selected status in this bucket.' : 'No followups in this bucket.'}
                          </div>
                        ) : (
                          followupStatusFilteredLeads.map((lead, leadIndex) => (
                            <div key={lead._id || leadIndex} className="col-12" style={{ position: 'relative', paddingTop: '10px' }}>
                              {/* Floating badges */}
                              <div style={{ position: 'absolute', top: '0px', left: '24px', display: 'flex', gap: '5px', zIndex: 3 }}>
                                {lead.leadCategory?.name && (
                                  <span title="Lead Source" style={{ background: '#fff', border: '1.5px solid #ff4d7a', color: '#ff4d7a', fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '2px 9px', boxShadow: '0 2px 8px rgba(255,77,122,0.2)', cursor: 'default', whiteSpace: 'nowrap' }}>
                                    {lead.leadCategory.name}
                                  </span>
                                )}
                                {lead.typeOfB2B?.name && (
                                  <span title="B2B Type" style={{ background: '#fff', border: '1.5px solid #c01855', color: '#c01855', fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '2px 9px', boxShadow: '0 2px 8px rgba(192,24,85,0.18)', cursor: 'default', whiteSpace: 'nowrap' }}>
                                    {lead.typeOfB2B.name}
                                  </span>
                                )}
                                {renderFloatingLeadStatusChips(lead)}
                                {(() => {
                                  const fu = lead && typeof lead.followUp === 'object' && lead.followUp !== null ? lead.followUp : null;
                                  if (!fu || (!fu.status && !fu.scheduledDate)) return null;
                                  const statusText = fu.status || 'Pending';
                                  const dateText = fu.scheduledDate ? new Date(fu.scheduledDate).toLocaleString() : '';
                                  const typeKey = getFollowupTypeKey(fu);
                                  const typeStyle = typeKey === 'meeting'
                                    ? { background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }
                                    : { background: '#eef6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' };
                                  return (
                                    <>
                                      <span title={`Type: ${typeKey === 'meeting' ? 'Meeting' : 'Call'}`} style={{ ...typeStyle, fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '2px 9px', cursor: 'default', whiteSpace: 'nowrap' }}>
                                        {typeKey === 'meeting' ? 'Meeting' : 'Call'}
                                      </span>
                                      <span title={dateText ? `Followup: ${statusText} • ${dateText}` : `Followup: ${statusText}`} style={{ background: '#0dcaf0', color: '#212529', fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '2px 9px', cursor: 'default', whiteSpace: 'nowrap' }}>
                                        FU: {statusText}
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>

                              <div className="lead-card" style={{ marginBottom: 0 }}>
                                <div className="lead-header">
                                  <div className="lead-title-section">
                                    <span className="lead-contact-person">
                                      <i className="fas fa-user" style={{ fontSize: '11px', color: '#ff4d7a' }}></i>
                                      {lead.concernPersonName || '—'}
                                    </span>
                                  </div>
                                  {!!lead._id && (
                                    <button type="button" className="btn btn-sm btn-light border lead-collapse-btn" onClick={() => toggleLeadCardCollapsed(lead._id)} title={collapsedLeadCards.has(lead._id) ? 'Expand' : 'Collapse'} style={{ borderRadius: '999px', padding: '4px 8px' }}>
                                      <i className={`fas fa-chevron-${collapsedLeadCards.has(lead._id) ? 'down' : 'up'}`}></i>
                                    </button>
                                  )}
                                </div>
                                {!lead._id || !collapsedLeadCards.has(lead._id) ? (
                                  <div className="lead-content">
                                    <div className="status-section mb-2">
                                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                        <div className="d-flex align-items-center flex-wrap gap-1">
                                          <i className="fas fa-chart-line text-danger me-1"></i>
                                          <span className="fw-bold text-dark">Performance:</span>
                                          <span className="badge bg-light text-dark border" style={{ borderColor: '#e2e8f0' }}>
                                            {lead.leadStatus
                                              ? PERF_LEAD_STATUS_LABEL[String(lead.leadStatus).toLowerCase()] || lead.leadStatus
                                              : '-'}
                                          </span>
                                          <span className="text-muted mx-1">|</span>
                                          <i className="fas fa-tag text-primary me-1"></i>
                                          <span className="fw-bold text-dark">CRM Status:</span>
                                          <span className="badge bg-primary">{lead.status?.title || lead.status?.name || 'No Status'}</span>
                                          {getSubStatusTitle(lead) && (
                                            <span className="badge bg-secondary">{getSubStatusTitle(lead)}</span>
                                          )}
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                          <div className="d-flex align-items-center gap-2">
                                            <div style={{ minWidth: '92px', textAlign: 'center', background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '10px', padding: '6px 10px' }}>
                                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', lineHeight: 1.1 }}>Lead Age</div>
                                              <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginTop: '2px', lineHeight: 1.1 }}>{getLeadAgeText(lead)}</div>
                                            </div>
                                            <div style={{ minWidth: '130px', textAlign: 'center', background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '10px', padding: '6px 10px' }}>
                                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', lineHeight: 1.1 }}>Lead Lock</div>
                                              <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginTop: '2px', lineHeight: 1.1 }}>{getLockText(lead)}</div>
                                            </div>
                                          </div>
                                          <button className="btn btn-sm btn-outline-primary" onClick={() => openPanelHome(lead)} title="Open panel">
                                            <i className="fas fa-arrow-right me-1"></i>Open
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="compact-info-section">
                                      <div className="compact-info-grid">
                                        {lead.address && (
                                          <div className="compact-info-item">
                                            <i className="fas fa-map-marker-alt text-danger"></i>
                                            <span className="compact-info-label">Address:</span>
                                            <span className="compact-info-value">{lead.address}</span>
                                          </div>
                                        )}
                                        <div className="compact-info-item">
                                          <i className="fas fa-user-shield text-warning"></i>
                                          <span className="compact-info-label">Owner:</span>
                                          <span className="compact-info-value">{getLeadOwnerName(lead)}</span>
                                        </div>
                                        <div className="compact-info-item">
                                          <i className="fas fa-user-plus text-info"></i>
                                          <span className="compact-info-label">Added:</span>
                                          <span className="compact-info-value">{getLeadAddedByName(lead)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="px-3 pb-3 text-muted" style={{ fontSize: '12px' }}>Card collapsed. Click the chevron to expand.</div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {cardsView === 'documents' && (
                    <div className="mt-3">
                     
                      {loadingLeads ? (
                        <div className="text-center text-muted py-5">Loading leads…</div>
                      ) : leadsNeedingDocuments.length === 0 ? (
                        <div className="text-center text-muted py-4">No leads require documents at this stage.</div>
                      ) : (
                        <div className="row g-2" style={{ rowGap: '18px' }}>
                          {leadsNeedingDocuments.map((lead, leadIndex) => (
                            <div key={lead._id || leadIndex} className="col-12" style={{ position: 'relative', paddingTop: '10px' }}>
                              <div style={{ position: 'absolute', top: '0px', left: '24px', display: 'flex', gap: '5px', zIndex: 3 }}>
                                {lead.leadCategory?.name && (
                                  <span title="Lead Source" style={{ background: '#fff', border: '1.5px solid #ff4d7a', color: '#ff4d7a', fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '2px 9px', boxShadow: '0 2px 8px rgba(255,77,122,0.2)', cursor: 'default', whiteSpace: 'nowrap' }}>
                                    {lead.leadCategory.name}
                                  </span>
                                )}
                                {lead.typeOfB2B?.name && (
                                  <span title="B2B Type" style={{ background: '#fff', border: '1.5px solid #c01855', color: '#c01855', fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '2px 9px', boxShadow: '0 2px 8px rgba(192,24,85,0.18)', cursor: 'default', whiteSpace: 'nowrap' }}>
                                    {lead.typeOfB2B.name}
                                  </span>
                                )}
                              </div>
                              <div className="lead-card" style={{ marginBottom: 0 }}>
                                <div className="lead-header">
                                  <div className="lead-title-section">
                                    <span className="lead-contact-person">
                                      <i className="fas fa-user" style={{ fontSize: '11px', color: '#ff4d7a' }}></i>
                                      {lead.concernPersonName || '—'}
                                    </span>
                                    {lead.mobile && (
                                      <span className="lead-contact-item mobile"><i className="fas fa-phone"></i><span>{lead.mobile}</span></span>
                                    )}
                                  </div>
                                  <button type="button" className="btn btn-sm btn-light" onClick={() => openPanelHome(lead)} style={{ borderRadius: '999px', padding: '4px 10px', fontSize: '12px' }}>
                                    <i className="fas fa-arrow-right me-1"></i>Open
                                  </button>
                                </div>
                                <div className="lead-content">
                                  <div className="status-section mb-2">
                                    <div className="d-flex align-items-center justify-content-between">
                                      <div className="d-flex align-items-center flex-wrap gap-1">
                                        <i className="fas fa-tag text-primary me-2"></i>
                                        <span className="fw-bold text-dark">CRM Status:</span>
                                        <span className="ms-2 badge bg-primary">{lead.status?.title || lead.status?.name || 'No Status'}</span>
                                        {getSubStatusTitle(lead) && (
                                          <span className="badge bg-secondary">{getSubStatusTitle(lead)}</span>
                                        )}
                                      </div>
                                      <div className="d-flex align-items-center gap-2">
                                        <div className="d-flex align-items-center gap-2">
                                          <div style={{ minWidth: '92px', textAlign: 'center', background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '10px', padding: '6px 10px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', lineHeight: 1.1 }}>Lead Age</div>
                                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginTop: '2px', lineHeight: 1.1 }}>{getLeadAgeText(lead)}</div>
                                          </div>
                                          <div style={{ minWidth: '130px', textAlign: 'center', background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '10px', padding: '6px 10px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', lineHeight: 1.1 }}>Lead Lock</div>
                                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginTop: '2px', lineHeight: 1.1 }}>{getLockText(lead)}</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="compact-info-section">
                                    <div className="compact-info-grid">
                                      {lead.address && (
                                        <div className="compact-info-item">
                                          <i className="fas fa-map-marker-alt text-danger"></i>
                                          <span className="compact-info-label">Address:</span>
                                          <span className="compact-info-value">{lead.address}</span>
                                        </div>
                                      )}
                                      <div className="compact-info-item">
                                        <i className="fas fa-user-shield text-warning"></i>
                                        <span className="compact-info-label">Owner:</span>
                                        <span className="compact-info-value">{getLeadOwnerName(lead)}</span>
                                      </div>
                                      <div className="compact-info-item">
                                        <i className="fas fa-user-plus text-info"></i>
                                        <span className="compact-info-label">Added:</span>
                                        <span className="compact-info-value">{getLeadAddedByName(lead)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {cardsView === 'lead' && leadTab === 'approval' && (
                    <div className="mt-3">
                      {/* <div className="btn-group btn-group-sm mb-2 flex-wrap" role="group" aria-label="Approval tabs">
                          <button
                            type="button"
                            className={`btn ${leadApprovalTab === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                            onClick={() => { setLeadApprovalTab('pending'); }}
                          >
                            Pending ({approvalSummary.pending ?? 0})
                          </button>
                          <button
                            type="button"
                            className={`btn ${leadApprovalTab === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => { setLeadApprovalTab('approved'); }}
                          >
                            Accepted ({approvalSummary.accepted ?? 0})
                          </button>
                          <button
                            type="button"
                            className={`btn ${leadApprovalTab === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => { setLeadApprovalTab('rejected'); }}
                          >
                            Rejected ({approvalSummary.rejected ?? 0})
                          </button>
                        </div> */}

                      <div className="d-flex justify-content-end mb-2">
                        <div className="btn-group btn-group-sm" role="group" aria-label="Approval view toggle">
                          <button
                            type="button"
                            className={`btn ${leadApprovalView === 'cards' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setLeadApprovalView('cards')}
                          >
                            Cards
                          </button>
                          <button
                            type="button"
                            className={`btn ${leadApprovalView === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setLeadApprovalView('table')}
                          >
                            Table
                          </button>
                        </div>
                      </div>

                      {loadingApprovalList ? (
                        <div className="text-center py-4 text-muted">
                          <div className="spinner-border spinner-border-sm text-primary" role="status" />
                          <span className="ms-2">Loading…</span>
                        </div>
                      ) : approvalListLeads.length === 0 ? (
                        <div className="text-center text-muted py-3">No leads in this bucket yet.</div>
                      ) : leadApprovalView === 'cards' ? (
                        <div className="row g-2" style={{ rowGap: '18px' }}>
                          {approvalListLeads.map((lead, leadIndex) => (
                            <div key={lead._id || leadIndex} className="col-12" style={{ position: 'relative', paddingTop: '10px' }}>
                              <div style={{ position: 'absolute', top: '0px', left: '24px', display: 'flex', gap: '5px', zIndex: 3 }}>
                                {lead.leadCategory?.name && (
                                  <span title="Lead Source" style={{ background: '#fff', border: '1.5px solid #ff4d7a', color: '#ff4d7a', fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '2px 9px', boxShadow: '0 2px 8px rgba(255,77,122,0.2)', cursor: 'default', whiteSpace: 'nowrap' }}>
                                    {lead.leadCategory.name}
                                  </span>
                                )}
                                {lead.typeOfB2B?.name && (
                                  <span title="B2B Type" style={{ background: '#fff', border: '1.5px solid #c01855', color: '#c01855', fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '2px 9px', boxShadow: '0 2px 8px rgba(192,24,85,0.18)', cursor: 'default', whiteSpace: 'nowrap' }}>
                                    {lead.typeOfB2B.name}
                                  </span>
                                )}
                                {renderFloatingLeadStatusChips(lead)}
                              </div>

                              <div className="lead-card" style={{ marginBottom: 0 }}>
                                <div className="lead-header">
                                  <div className="lead-title-section">
                                    <span className="lead-contact-person">
                                      <i className="fas fa-user" style={{ fontSize: '11px', color: '#ff4d7a' }}></i>
                                      {lead.concernPersonName || '—'}
                                    </span>
                                    <div className="lead-contact-info">
                                      {lead.email && (
                                        <span className="lead-contact-item"><i className="fas fa-envelope"></i><span>{lead.email}</span></span>
                                      )}
                                      {lead.mobile && (
                                        <span className="lead-contact-item mobile"><i className="fas fa-phone"></i><span>{lead.mobile}</span></span>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    {leadApprovalTab === 'pending' && (
                                      <div className="d-flex gap-1">
                                        <button type="button" className="btn btn-sm btn-success" onClick={() => handleApprovalDecision(lead._id, 'Approved')} style={{ borderRadius: '999px', padding: '4px 10px', fontSize: '11px' }}>Approve</button>
                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleApprovalDecision(lead._id, 'Rejected')} style={{ borderRadius: '999px', padding: '4px 10px', fontSize: '11px' }}>Reject</button>
                                      </div>
                                    )}
                                    {leadApprovalTab === 'approved' && (
                                      <button type="button" className="btn btn-sm btn-success" disabled style={{ borderRadius: '999px', padding: '4px 10px', fontSize: '11px', opacity: 1 }}>
                                        Approved
                                      </button>
                                    )}
                                    {leadApprovalTab === 'rejected' && (
                                      <button type="button" className="btn btn-sm btn-danger" disabled style={{ borderRadius: '999px', padding: '4px 10px', fontSize: '11px', opacity: 1 }}>
                                        Rejected
                                      </button>
                                    )}
                                    {!!lead._id && (
                                      <button type="button" className="btn btn-sm btn-light border lead-collapse-btn" onClick={() => toggleLeadCardCollapsed(lead._id)} title={collapsedLeadCards.has(lead._id) ? 'Expand' : 'Collapse'} style={{ borderRadius: '999px', padding: '4px 8px' }}>
                                        <i className={`fas fa-chevron-${collapsedLeadCards.has(lead._id) ? 'down' : 'up'}`}></i>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {!lead._id || !collapsedLeadCards.has(lead._id) ? (
                                  <div className="lead-content">
                                    <div className="status-section mb-2">
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center flex-wrap gap-1">
                                          <i className="fas fa-tag text-primary me-2"></i>
                                          <span className="fw-bold text-dark">CRM Status:</span>
                                          <span className="ms-2 badge bg-primary">{lead.status?.title || lead.status?.name || 'No Status'}</span>
                                          {getSubStatusTitle(lead) && (
                                            <span className="badge bg-secondary">{getSubStatusTitle(lead)}</span>
                                          )}
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                          <div className="d-flex align-items-center gap-2">
                                            <div style={{ minWidth: '92px', textAlign: 'center', background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '10px', padding: '6px 10px' }}>
                                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', lineHeight: 1.1 }}>Lead Age</div>
                                              <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginTop: '2px', lineHeight: 1.1 }}>{getLeadAgeText(lead)}</div>
                                            </div>
                                            <div style={{ minWidth: '130px', textAlign: 'center', background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '10px', padding: '6px 10px' }}>
                                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', lineHeight: 1.1 }}>Lead Lock</div>
                                              <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginTop: '2px', lineHeight: 1.1 }}>{getLockText(lead)}</div>
                                            </div>
                                          </div>
                                          <button className="btn btn-sm btn-outline-primary" onClick={() => openPanelHome(lead)} title="Open panel">
                                            <i className="fas fa-arrow-right me-1"></i>Open
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="compact-info-section">
                                      <div className="compact-info-grid">
                                        {lead.address && (
                                          <div className="compact-info-item">
                                            <i className="fas fa-map-marker-alt text-danger"></i>
                                            <span className="compact-info-label">Address:</span>
                                            <span className="compact-info-value">{lead.address}</span>
                                          </div>
                                        )}
                                        <div className="compact-info-item">
                                          <i className="fas fa-user-shield text-warning"></i>
                                          <span className="compact-info-label">Owner:</span>
                                          <span className="compact-info-value">{getLeadOwnerName(lead)}</span>
                                        </div>
                                        <div className="compact-info-item">
                                          <i className="fas fa-user-plus text-info"></i>
                                          <span className="compact-info-label">Added:</span>
                                          <span className="compact-info-value">{getLeadAddedByName(lead)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-sm align-middle">
                            <thead>
                              <tr>
                                <th>Business</th>
                                <th>Contact</th>
                                <th>Lead Status</th>
                                <th>Added by</th>
                                <th style={{ minWidth: '180px' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {approvalListLeads.map((l) => (
                                <tr key={l._id}>
                                  <td className="fw-semibold">{l.businessName || '—'}</td>
                                  <td>{l.concernPersonName || '—'}</td>
                                  <td>
                                    <span className="badge bg-secondary text-capitalize">
                                      {l.leadStatus
                                        ? ({ hot: 'Hot', warm: 'Warm', cold: 'Cold', prospect: 'Prospect', won: 'Won' }[String(l.leadStatus).toLowerCase()] || l.leadStatus)
                                        : '—'}
                                    </span>
                                  </td>
                                  <td>{l.leadAddedBy?.name || '—'}</td>
                                  <td>
                                    {leadApprovalTab === 'pending' ? (
                                      <div className="d-flex flex-wrap gap-1">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-success"
                                          onClick={() => handleApprovalDecision(l._id, 'Approved')}
                                        >
                                          Approve
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() => handleApprovalDecision(l._id, 'Rejected')}
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    ) : leadApprovalTab === 'approved' ? (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-success"
                                        disabled
                                        style={{ opacity: 1 }}
                                      >
                                        Approved
                                      </button>
                                    ) : leadApprovalTab === 'rejected' ? (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-danger"
                                        disabled
                                        style={{ opacity: 1 }}
                                      >
                                        Rejected
                                      </button>
                                    ) : (
                                      <span className="text-muted small">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {cardsView === 'lead' && leadTab === 'report' && (
                    <div className="mt-3">
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <div>
                          <h6 className="mb-1 fw-bold text-dark">
                            <i className="fas fa-table me-2 text-primary" />
                            Lead submitter report
                          </h6>
                        
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => fetchSubmitterReport()}
                          disabled={loadingSubmitterReport}
                        >
                          <i className="fas fa-sync-alt me-1" />
                          Refresh
                        </button>
                      </div>

                      {loadingSubmitterReport ? (
                        <div className="text-center text-muted py-5">Loading report…</div>
                      ) : (
                        <>
                          {submitterReportSummary && (
                            <div className="row g-2 mb-3">
                              <div className="col-6 col-md-3">
                                <div className="border rounded-3 p-2 h-100 bg-light">
                                  <div className="small text-muted">Users (submitters)</div>
                                  <div className="fs-5 fw-bold text-dark">{submitterReportSummary.distinctSubmitters ?? 0}</div>
                                </div>
                              </div>
                              <div className="col-6 col-md-3">
                                <div className="border rounded-3 p-2 h-100 bg-light">
                                  <div className="small text-muted">Total leads</div>
                                  <div className="fs-5 fw-bold text-dark">{submitterReportSummary.totalLeads ?? 0}</div>
                                </div>
                              </div>
                              <div className="col-6 col-md-3">
                                <div className="border rounded-3 p-2 h-100 bg-light">
                                  <div className="small text-muted">Complete info</div>
                                  <div className="fs-5 fw-bold text-success">{submitterReportSummary.completeLeads ?? 0}</div>
                                </div>
                              </div>
                              <div className="col-6 col-md-3">
                                <div className="border rounded-3 p-2 h-100 bg-light">
                                  <div className="small text-muted">Incomplete info</div>
                                  <div className="fs-5 fw-bold text-warning">{submitterReportSummary.incompleteLeads ?? 0}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {(submitterReportRows || []).length === 0 ? (
                            <div className="text-center text-muted py-5 border rounded-3 bg-white">
                              No lead submissions match your filters (or no submitter recorded on leads).
                            </div>
                          ) : (
                            <div className="table-responsive border rounded-3 shadow-sm">
                              <table className="table table-sm table-hover align-middle mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th style={{ width: '44px' }}>#</th>
                                    <th>Submitter (user)</th>
                                    <th>Email</th>
                                    <th>Mobile</th>
                                    <th className="text-center">Total leads</th>
                                    <th className="text-center">Complete</th>
                                    <th className="text-center">Incomplete</th>
                                    <th className="text-center">Pending</th>
                                    <th className="text-center">Approved</th>
                                    <th className="text-center">Rejected</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(submitterReportRows || []).map((row, idx) => (
                                    <tr key={row.userId || idx}>
                                      <td className="text-muted">{idx + 1}</td>
                                      <td className="fw-semibold">{row.name?.trim() || '—'}</td>
                                      <td>{row.email?.trim() || '—'}</td>
                                      <td>{row.userMobile != null && row.userMobile !== '' ? String(row.userMobile) : '—'}</td>
                                      <td className="text-center fw-bold">{row.totalLeads ?? 0}</td>
                                      <td className="text-center">
                                        <span className="badge bg-success">{row.completeLeads ?? 0}</span>
                                      </td>
                                      <td className="text-center">
                                        <span className="badge bg-warning text-dark">{row.incompleteLeads ?? 0}</span>
                                      </td>
                                      <td className="text-center">{row.pendingApproval ?? 0}</td>
                                      <td className="text-center">{row.approved ?? 0}</td>
                                      <td className="text-center">{row.rejected ?? 0}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>


          </div>

        </div >

        {/* Right Sidebar for Desktop - Panels */}
        {
          !isMobile && showPanel && (
            <div className="col-4" style={{
              position: 'fixed',
              top: '130px',
              right: '0',
              width: '350px',
              maxHeight: 'calc(100vh - 135px)',
              overflowY: 'auto',
              backgroundColor: 'white',
              zIndex: 1000,
              boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
              transform: showPanel ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s ease',
              borderRadius: '8px 0 0 8px'
            }}>

              {renderStatusChangePanel()}
              {renderFollowupPanel()}
              {renderRefferPanel()}
              {renderLeadHistoryPanel()}
              {renderPanelHome()}

            </div>
          )
        }

        {/* Mobile Modals */}
        {isMobile && renderStatusChangePanel()}
        {isMobile && renderFollowupPanel()}
        {isMobile && renderRefferPanel()}
        {isMobile && renderLeadHistoryPanel()}
        {isMobile && renderPanelHome()}

      </div >

      {/* Filter Modal */}
      {showFilters && (
        <div
          className="modal show d-block"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1060,
            // Ensure modal overlay can scroll on smaller screens
            overflowY: 'auto',
            maxHeight: '100vh'
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable" style={{ maxHeight: '90vh' }}>
            <div className="modal-content border-0 shadow" style={{ maxHeight: '90vh' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-filter me-2"></i>
                  Filter Leads
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowFilters(false)}
                ></button>
              </div>
              <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <MultiSelectCheckbox
                      title="Lead Source"
                      icon="fas fa-tag text-success"
                      options={(leadCategoryOptions || []).map((o) => ({ ...o, value: String(o.value) }))}
                      selectedValues={filters.leadCategory}
                      onChange={(v) => handleFilterMultiChange('leadCategory', v)}
                      isOpen={filterMultiOpenKey === 'leadCategory'}
                      onToggle={() => toggleFilterMulti('leadCategory')}
                    />
                  </div>
                  <div className="col-md-4">
                    <MultiSelectCheckbox
                      title="Type of B2B"
                      icon="fas fa-building text-info"
                      options={(typeOfB2BOptions || []).map((o) => ({ ...o, value: String(o.value) }))}
                      selectedValues={filters.typeOfB2B}
                      onChange={(v) => handleFilterMultiChange('typeOfB2B', v)}
                      isOpen={filterMultiOpenKey === 'typeOfB2B'}
                      onToggle={() => toggleFilterMulti('typeOfB2B')}
                    />
                  </div>
                  <div className="col-md-4">
                    <MultiSelectCheckbox
                      title="Lead Owner"
                      icon="fas fa-user text-warning"
                      options={leadOwnerMultiOptions}
                      selectedValues={filters.leadOwner}
                      onChange={(v) => handleFilterMultiChange('leadOwner', v)}
                      isOpen={filterMultiOpenKey === 'leadOwner'}
                      onToggle={() => toggleFilterMulti('leadOwner')}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-calendar text-danger me-2"></i>
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="form-control border-0 bg-light"
                      value={filters.dateRange.start || ''}
                      onChange={(e) => handleDateRangeChange('start', e.target.value)}
                      style={{ backgroundColor: '#f8f9fa' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-calendar text-danger me-2"></i>
                      End Date
                    </label>
                    <input
                      type="date"
                      className="form-control border-0 bg-light"
                      value={filters.dateRange.end || ''}
                      onChange={(e) => handleDateRangeChange('end', e.target.value)}
                      style={{ backgroundColor: '#f8f9fa' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <MultiSelectCheckbox
                      title="Status"
                      icon="fas fa-tasks text-danger"
                      options={statusMultiOptions}
                      selectedValues={filters.status}
                      onChange={(v) => handleFilterMultiChange('status', v)}
                      isOpen={filterMultiOpenKey === 'status'}
                      onToggle={() => toggleFilterMulti('status')}
                    />
                  </div>
                  <div className="col-md-6">
                    <MultiSelectCheckbox
                      title="Sub Status"
                      icon="fas fa-stream text-danger"
                      options={subStatusMultiOptions}
                      selectedValues={filters.subStatus}
                      onChange={(v) => handleFilterMultiChange('subStatus', v)}
                      isOpen={filterMultiOpenKey === 'subStatus'}
                      onToggle={() => toggleFilterMulti('subStatus')}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowFilters(false)}
                >
                  <i className="fas fa-times me-1"></i>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={clearFilters}
                >
                  <i className="fas fa-eraser me-1"></i>
                  Clear All
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    applyFilters();
                    setShowFilters(false);
                  }}
                >
                  <i className="fas fa-check me-1"></i>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Add modal Start*/}
      {
        showAddLeadModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060, maxHeight: '100vh', overflowY: 'auto' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Modal Header */}
                <div className="modal-header" style={{ backgroundColor: '#fc2b5a', color: 'white' }}>
                  <h5 className="modal-title d-flex align-items-center">
                    <i className="fas fa-user-plus me-2"></i>
                    Add New B2B Lead
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={handleCloseLeadModal}
                  ></button>
                </div>

                {/* Modal Body */}
                <div className="modal-body p-4 " style={{ maxHeight: '100vh', overflowY: 'auto' }}>
                  <div className="row g-3">
                    {/* Lead Source */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-tag text-primary me-1"></i>
                        Lead Source <span className="text-danger">*</span>
                      </label>
                      <Select
                        inputId="add-lead-leadCategory"
                        name="leadCategory"
                        options={leadCategoryOptions}
                        value={leadCategoryOptions.find((o) => o.value === leadFormData.leadCategory) || null}
                        onChange={handleLeadSelectChange('leadCategory')}
                        placeholder="Select Lead Source"
                        isClearable
                        isSearchable
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        menuPosition="fixed"
                        styles={leadFormSelectStyles(!!formErrors.leadCategory)}
                        classNamePrefix="add-lead-select"
                      />
                      {formErrors.leadCategory && (
                        <div className="invalid-feedback d-block">
                          {formErrors.leadCategory}
                        </div>
                      )}
                    </div>

                    {/* Type of B2B */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-building text-primary me-1"></i>
                        Type of B2B <span className="text-danger">*</span>
                      </label>
                      <Select
                        inputId="add-lead-typeOfB2B"
                        name="typeOfB2B"
                        options={typeOfB2BOptions}
                        value={typeOfB2BOptions.find((o) => o.value === leadFormData.typeOfB2B) || null}
                        onChange={handleLeadSelectChange('typeOfB2B')}
                        placeholder="Select B2B Type"
                        isClearable
                        isSearchable
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        menuPosition="fixed"
                        styles={leadFormSelectStyles(!!formErrors.typeOfB2B)}
                        classNamePrefix="add-lead-select"
                      />
                      {formErrors.typeOfB2B && (
                        <div className="invalid-feedback d-block">
                          {formErrors.typeOfB2B}
                        </div>
                      )}
                    </div>

                    {/* Business Name */}
                    <div className="col-12">
                      <label className="form-label fw-bold">
                        <i className="fas fa-briefcase text-primary me-1"></i>
                        Business Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        ref={businessNameInputRef}
                        className={`form-control ${formErrors.businessName ? 'is-invalid' : ''}`}
                        name="businessName"
                        value={leadFormData.businessName}
                        onChange={handleLeadInputChange}
                        placeholder="Enter business/company name"
                      />

                      {formErrors.businessName && (
                        <div className="invalid-feedback">
                          {formErrors.businessName}
                        </div>
                      )}
                    </div>

                    {/* Business Address with Google Maps */}
                    <div className="col-12">
                      <label className="form-label fw-bold">
                        <i className="fas fa-map-marker-alt text-primary me-1"></i>
                        Business Address
                      </label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.businessAddress ? 'is-invalid' : ''}`}
                        name="address"
                        value={leadFormData.address}
                        onChange={handleLeadInputChange}
                        placeholder="Enter business address"
                      />

                      {formErrors.businessAddress && (
                        <div className="invalid-feedback d-block">
                          {formErrors.businessAddress}
                        </div>
                      )}
                    </div>

                    {/* Manual Location Fields */}
                    <div className="col-md-4">
                      <label className="form-label fw-bold">
                        <i className="fas fa-map text-primary me-1"></i>
                        State
                      </label>
                      <input
                        ref={stateInputRef}
                        type="text"
                        className="form-control"
                        name="state"
                        value={leadFormData.state}
                        onChange={handleLeadInputChange}
                        placeholder="Start typing state name..."
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">
                        <i className="fas fa-city text-primary me-1"></i>
                        City
                      </label>
                      <input
                        ref={cityInputRef}
                        type="text"
                        className="form-control"
                        name="city"
                        value={leadFormData.city}
                        onChange={handleLeadInputChange}
                        placeholder="Start typing city name..."
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">
                        <i className="fas fa-location-arrow text-primary me-1"></i>
                        Block
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="block"
                        value={leadFormData.block}
                        onChange={handleLeadInputChange}
                        placeholder="Enter block name"
                      />
                    </div>



                    {/* Concern Person Name */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-user text-primary me-1"></i>
                        Concern Person Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.concernPersonName ? 'is-invalid' : ''}`}
                        name="concernPersonName"
                        value={leadFormData.concernPersonName}
                        onChange={handleLeadInputChange}
                        placeholder="Enter contact person name"
                      />
                      {formErrors.concernPersonName && (
                        <div className="invalid-feedback">
                          {formErrors.concernPersonName}
                        </div>
                      )}
                    </div>

                    {/* Designation */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-id-badge text-primary me-1"></i>
                        Designation
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="designation"
                        value={leadFormData.designation}
                        onChange={handleLeadInputChange}
                        placeholder="e.g., HR Manager, CEO, Director"
                      />
                    </div>

                    {/* Email */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-envelope text-primary me-1"></i>
                        Email
                      </label>
                      <input
                        type="email"
                        className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                        name="email"
                        value={leadFormData.email}
                        onChange={handleLeadInputChange}
                        placeholder="Enter email address"
                      />
                      {formErrors.email && (
                        <div className="invalid-feedback">
                          {formErrors.email}
                        </div>
                      )}
                    </div>

                    {/* Mobile */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-phone text-primary me-1"></i>
                        Mobile <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        className={`form-control ${formErrors.mobile ? 'is-invalid' : ''}`}
                        name="mobile"
                        value={leadFormData.mobile}
                        onChange={handleLeadMobileChange}
                        placeholder="Enter mobile number"
                      />
                      {formErrors.mobile && (
                        <div className="invalid-feedback">
                          {formErrors.mobile}
                        </div>
                      )}
                    </div>

                    {/* WhatsApp */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fab fa-whatsapp text-success me-1"></i>
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        className={`form-control ${formErrors.whatsapp ? 'is-invalid' : ''}`}
                        name="whatsapp"
                        value={leadFormData.whatsapp}
                        onChange={handleLeadMobileChange}
                        placeholder="WhatsApp number"
                      />
                      {formErrors.whatsapp && (
                        <div className="invalid-feedback">
                          {formErrors.whatsapp}
                        </div>
                      )}
                    </div>

                    {/* Landline Number */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-phone text-primary me-1"></i>
                        Landline Number
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        className={`form-control ${formErrors.landlineNumber ? 'is-invalid' : ''}`}
                        name="landlineNumber"
                        value={leadFormData.landlineNumber}
                        onChange={handleLeadMobileChange}
                        placeholder="Landline number"
                      />
                      {formErrors.landlineNumber && (
                        <div className="invalid-feedback">
                          {formErrors.landlineNumber}
                        </div>
                      )}
                    </div>

                    {/* Lead Owner */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-user-tie text-primary me-1"></i>
                        Lead Owner
                      </label>
                      <select
                        className="form-select"
                        name="leadOwner"
                        value={userData?._id || leadFormData.leadOwner || ''}
                        onChange={handleLeadInputChange}
                        disabled
                      >
                        <option value={userData?._id || ''}>
                          {userData?.name || 'Loading...'}
                        </option>
                      </select>
                    </div>

                    {/* Lead Status — performance bucket at add time; unchanged after institute approval */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-thermometer-half text-primary me-1"></i>
                        Lead Status <span className="text-danger">*</span>
                      </label>
                      <Select
                        inputId="add-lead-leadStatus"
                        name="leadStatus"
                        options={B2B_ADD_LEAD_STATUS_OPTIONS}
                        value={B2B_ADD_LEAD_STATUS_OPTIONS.find((o) => o.value === leadFormData.leadStatus) || null}
                        onChange={handleLeadSelectChange('leadStatus')}
                        placeholder="Choose Hot / Warm / Cold / Prospect"
                        isClearable
                        isSearchable
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        menuPosition="fixed"
                        menuShouldScrollIntoView={false}
                        styles={leadFormSelectStyles(!!formErrors.leadStatus)}
                        classNamePrefix="add-lead-select"
                      />
                      {formErrors.leadStatus && (
                        <div className="invalid-feedback d-block">
                          {formErrors.leadStatus}
                        </div>
                      )}
                    </div>

                    {/* Lock duration: only 60 days option */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-lock text-primary me-1"></i>
                        Lock my Lead <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${formErrors.lockLeadDays ? 'is-invalid' : ''}`}
                        name="lockLeadDays"
                        value={leadFormData.lockLeadDays}
                        onChange={handleLeadInputChange}
                      >
                        <option value="60">60 days</option>
                      </select>
                      {formErrors.lockLeadDays && (
                        <div className="invalid-feedback">
                          {formErrors.lockLeadDays}
                        </div>
                      )}
                      {leadFormData.lockLeadDays === '60' && (
                        <div className="text-muted mt-1" style={{ fontSize: '12px' }}>
                          This will auto-assign Lead Owner to you for 60 days.
                        </div>
                      )}
                    </div>

                    {/* Remark */}
                    <div className="col-12">
                      <label className="form-label fw-bold">
                        <i className="fas fa-comment text-primary me-1"></i>
                        Remark
                      </label>
                      <textarea
                        className="form-control"
                        name="remark"
                        value={leadFormData.remark}
                        onChange={handleLeadInputChange}
                        placeholder="Enter remark"
                      />
                    </div>




                  </div>

                  {/* Form Actions */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary px-4"
                          onClick={handleCloseLeadModal}
                        >
                          <i className="fas fa-times me-1"></i>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn px-4"
                          style={{ backgroundColor: '#fc2b5a', color: 'white' }}
                          onClick={handleLeadSubmit}
                        >
                          <i className="fas fa-save me-1"></i>
                          Submit for Approval
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              {/* Modal Header */}
              <div className="modal-header" style={{ backgroundColor: '#28a745', color: 'white' }}>
                <h5 className="modal-title d-flex align-items-center">
                  <i className="fas fa-file-upload me-2"></i>
                  Bulk Upload B2B Leads
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseBulkUploadModal}
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4">
                {/* Instructions */}
                <div className="alert alert-info mb-4">
                  <h6 className="fw-bold mb-2">
                    <i className="fas fa-info-circle me-2"></i>
                    Instructions:
                  </h6>
                  <ul className="mb-0 small">
                    <li>Upload CSV or Excel file (.xlsx, .xls, .csv)</li>
                    <li>Maximum file size: 10MB</li>
                    <li><strong>Required fields:</strong> Business Name, Concern Person Name, Mobile, Lead Source, Type of B2B</li>

                  </ul>
                </div>

                {/* File Upload Section */}
                <div className="mb-4">
                  <label className="form-label fw-bold mb-3">
                    <i className="fas fa-file-excel text-success me-2"></i>
                    Select File <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="file"
                      id="bulkUploadFile"
                      ref={bulkUploadFileInputRef}
                      className="form-control"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleBulkFileChange}
                      disabled={bulkUploadLoading}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => bulkUploadFileInputRef.current?.click()}
                      disabled={bulkUploadLoading}
                    >
                      <i className="fas fa-folder-open me-1"></i>
                      Browse
                    </button>
                  </div>
                  {bulkUploadFile && (
                    <div className="mt-2">
                      <small className="text-success">
                        <i className="fas fa-check-circle me-1"></i>
                        Selected: {bulkUploadFile.name} ({(bulkUploadFile.size / 1024).toFixed(2)} KB)
                      </small>
                    </div>
                  )}
                </div>

                {/* Sample File Download */}
                <div className="mb-4">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => {
                      // Create sample CSV content with proper format
                      // Note: Lead Source and Type of B2B names should match system values
                      const sampleCSV = `Business Name,Concern Person Name,Mobile,Email,Lead Source,Type of B2B,Address,City,State,Designation,WhatsApp,Landline Number,Lead Owner,Remark
ABC Company,John Doe,9876543210,john@abc.com,Corporate,Partner,123 Main Street,Mumbai,Maharashtra,Manager,9876543210,0221234567,Owner Name,Sample remark
XYZ Corp,Jane Smith,9876543211,jane@xyz.com,Individual,Client,456 Park Avenue,Delhi,Delhi,Director,9876543211,0111234567,Owner Name,Another remark
Tech Solutions,Raj Kumar,9876543212,raj@tech.com,Corporate,Partner,789 Tech Park,Bangalore,Karnataka,CEO,9876543212,0801234567,Owner Name,Technology company`;

                      const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', 'b2b_leads_sample.csv');
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    }}
                  >
                    <i className="fas fa-download me-1"></i>
                    Download Sample CSV
                  </button>
                </div>

                {/* Message Display */}
                {bulkUploadMessage && (
                  <div className={`alert ${bulkUploadSuccess ? 'alert-success' : 'alert-danger'} mb-3`}>
                    <i className={`fas ${bulkUploadSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
                    {bulkUploadMessage}
                  </div>
                )}

                {/* Error Details */}
                {bulkUploadErrors.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-bold text-danger mb-2">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Error Details:
                    </h6>
                    <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                      <ul className="mb-0 small">
                        {bulkUploadErrors.map((error, index) => (
                          <li key={index} className="text-danger">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={handleCloseBulkUploadModal}
                    disabled={bulkUploadLoading}
                  >
                    <i className="fas fa-times me-1"></i>
                    {bulkUploadSuccess ? 'Close' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-success px-4"
                    onClick={handleBulkUpload}
                    disabled={!bulkUploadFile || bulkUploadLoading}
                  >
                    {bulkUploadLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-upload me-1"></i>
                        Upload Leads
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inject Google Maps styles */}
      <style>{mapStyles}</style>
      <style>{`
  .modal .pac-container {
    z-index: 99999 !important;
    position: fixed !important;
  }
  
  .modal .pac-item {
    cursor: pointer;
    padding: 8px 12px;
    border-bottom: 1px solid #e9ecef;
  }
  
  .modal .pac-item:hover {
    background-color: #f8f9fa;
  }
  
  .modal .pac-item-selected {
    background-color: #ff4d7a;
    color: white;
  }

  /* Modern Lead Card Styles */
  .lead-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 0.5rem;
  }

  .lead-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }

  /* Bulk selection highlight */
  .lead-card.bulk-selected {
    outline: 2px solid #ff4d7a;
    box-shadow: 0 8px 25px rgba(255, 77, 122, 0.25);
  }

  /* Header Section */
  .lead-header {
    background: #ff4d7a;
    /* background: linear-gradient(135deg, rgba(255,77,122,0.12) 0%, rgba(192,24,85,0.18) 100%); */
    border-bottom: 1px solid rgba(255,77,122,0.15);
    color: #1e293b;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    position: relative;
    overflow: hidden;
    border-radius: 16px 16px 0 0;
  }

  .lead-header::before {
    display: none;
  }

  .lead-title-section {
    position: relative;
    z-index: 2;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 14px;
    flex-wrap: wrap;
  }

  .lead-contact-person {
    font-size: 13px;
    font-weight: 800;
    margin: 0;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
  }

  .lead-contact-info {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .lead-contact-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #fff;
    white-space: nowrap;
  }

  .lead-contact-item.mobile {
    font-size: 12px;
    font-weight: 700;
    color: #fff;
  }

  .lead-badges {
    position: relative;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .lead-collapse-btn {
    z-index: 6;
    pointer-events: auto;
    flex-shrink: 0;
  }

  .lead-contact-item i {
    font-size: 10px;
    flex-shrink: 0;
  }

  .lead-contact-item span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Compact Additional Info Section */
  .compact-info-section {
    margin-top: 0.5rem;
  }

  .compact-info-grid {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .compact-info-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    padding: 0.25rem 0;
  }

  .compact-info-item i {
    font-size: 0.7rem;
    width: 12px;
    flex-shrink: 0;
  }

  .compact-info-label {
    font-weight: 600;
    color: #6c757d;
    min-width: 50px;
    flex-shrink: 0;
  }

  .compact-info-value {
    color: #212529;
    flex: 1;
    word-break: break-word;
  }

  .lead-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .lead-badge.category {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    backdrop-filter: blur(10px);
  }

  .lead-badge.type {
    background: rgba(255, 255, 255, 0.15);
    color: white;
    backdrop-filter: blur(10px);
  }

  /* Content Section */
  .lead-content {
    padding: 0.75rem;
  }

  .contact-grid {
    display: none; /* Hide the large contact grid since we're moving info to header */
  }

  .contact-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .contact-item:hover {
    background: #e9ecef;
    transform: translateY(-2px);
  }

  .contact-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .contact-icon:not(.phone):not(.whatsapp):not(.address):not(.owner) {
    background: linear-gradient(135deg, #6c757d, #495057);
  }

  .contact-icon.phone {
    background: linear-gradient(135deg, #28a745, #20c997);
  }

  .contact-icon.whatsapp {
    background: linear-gradient(135deg, #25d366, #128c7e);
  }

  .contact-icon.address {
    background: linear-gradient(135deg, #dc3545, #c82333);
  }

  .contact-icon.owner {
    background: linear-gradient(135deg, #ffc107, #e0a800);
  }

  .contact-icon.added-by {
    background: linear-gradient(135deg, #ff4d7a, #c01855);
  }

  .contact-details {
    flex: 1;
    min-width: 0;
  }

  .contact-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6c757d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.1rem;
  }

  .contact-value {
    display: block;
    font-size: 0.9rem;
    color: #212529;
    font-weight: 500;
    word-break: break-word;
  }

  .contact-link {
    color: #ff4d7a;
    text-decoration: none;
    font-weight: 600;
  }

  .contact-link:hover {
    color: #c01855;
    text-decoration: underline;
  }

  .address-text {
    line-height: 1.4;
  }

  .address-section,
  .owner-section {
    margin-top: 1rem;
  }

  /* Action Buttons */
  .lead-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
  }

  .action-group {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    color: white;
  }

  .action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .action-btn.view {
    background: linear-gradient(135deg, #ff4d7a, #c01855);
  }

  .action-btn.refer {
    background: linear-gradient(135deg, #6c757d, #495057);
  }

  .action-btn.history {
    background: linear-gradient(135deg, #17a2b8, #138496);
  }

  .action-btn.status {
    background: linear-gradient(135deg, #ffc107, #e0a800);
    padding: 0.5rem;
    min-width: 40px;
  }

  .action-btn.followup {
    background: linear-gradient(135deg, #28a745, #20c997);
    padding: 0.5rem;
    min-width: 40px;
  }

  .action-btn span {
    display: inline-block;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .contact-grid {
      grid-template-columns: 1fr;
    }
    
    .lead-actions {
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.75rem;
    }
    
    .action-group {
      width: 100%;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .action-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      min-height: 44px;
    }
    
    .action-btn span {
      font-size: 0.85rem;
    }
    
    .lead-badges {
      position: static;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }
    
    .lead-header {
      padding: 1rem 0.75rem;
    }
    
    .lead-business-name {
      font-size: 1rem;
    }
    
    .lead-contact-person {
      font-size: 0.8rem;
    }
    
    .lead-contact-info {
    display:flex;
    flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .lead-contact-item {
      display:flex;
      align-item:center;
      gap: 0.25rem;
      font-size:0.7rem;
      opacity: 0.9;
      max-width: 262px;
    }
    
    .lead-content {
      padding: 0.75rem 0.5rem;
    }
    
    .status-section {
      padding: 10px;
    }
    
    .status-section .badge {
      font-size: 0.7rem;
      padding: 3px 6px;
    }
    
    .status-section .btn {
      font-size: 0.7rem;
      padding: 4px 10px;
    }
    
    .compact-info-item {
      font-size: 0.7rem;
      padding: 0.3rem 0;
    }
    
    .status-count-card {
      min-width: 100px;
      height: 50px;
    }
    
    .status-count-card .card-body {
      padding: 0.4rem;
    }
    
    .status-count-card h6 {
      font-size: 0.75rem;
    }
    
    .status-count-card small {
      font-size: 0.65rem;
    }
  }

  /* Status Count Cards Styles */
  .status-count-card {
    transition: all 0.3s ease;
    border-radius: 12px;
    overflow: hidden;
  }

  .status-count-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .status-count-card .card-body {
    padding: 0.5rem;
  }

  .status-count-card h4 {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .status-count-card h6 {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .status-count-card small {
    font-size: 0.75rem;
  }

  /* Status-specific colors */
  .status-count-card.total {
    background: linear-gradient(135deg, #ff4d7a 0%, #c01855 100%);
    color: white;
  }

  .status-count-card.total h4,
  .status-count-card.total h6,
  .status-count-card.total small {
    color: white;
  }

  .status-count-card.status {
    background: white;
    border: 1px solid #e9ecef;
  }

  .status-count-card.status:hover {
    border-color: #ff4d7a;
  }

  .status-count-card.selected {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(255, 77, 122, 0.28);
    border: 2px solid #ff4d7a !important;
    background: linear-gradient(135deg, #fff5f8 0%, #ffe0ea 100%);
  }

  .status-count-card.selected.total {
    background: linear-gradient(135deg, #ff4d7a 0%, #c01855 100%);
  }

  /* Status Section Styles */
  .status-section {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 12px;
    border: 1px solid #e9ecef;
  }

  .status-section .badge {
    font-size: 0.75rem;
    padding: 4px 8px;
  }

  .status-section .btn {
    font-size: 0.75rem;
    padding: 4px 12px;
  }

  /* Filter Panel Styles */
  .filter-panel {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
  }

  .filter-panel:hover {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .filter-panel .form-control,
  .filter-panel .form-select {
    transition: all 0.2s ease;
    border-radius: 8px;
  }

  .filter-panel .form-control:focus,
  .filter-panel .form-select:focus {
    box-shadow: 0 0 0 0.2rem rgba(255, 77, 122, 0.18);
    border-color: #ff4d7a;
  }

  .filter-panel .btn {
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .filter-panel .btn:hover {
    transform: translateY(-1px);
  }

  /* Global Text Visibility Improvements */
  .form-control, .form-select {
    color: #212529 !important;
    background-color: #ffffff !important;
    border: 1px solid #ced4da !important;
  }

  .form-control:focus, .form-select:focus {
    color: #212529 !important;
    background-color: #ffffff !important;
    border-color: #ff4d7a !important;
    box-shadow: 0 0 0 0.2rem rgba(255, 77, 122, 0.18) !important;
  }

  .btn {
    font-weight: 500 !important;
  }

  .text-dark {
    color: #212529 !important;
  }

  .text-muted {
    color: #6c757d !important;
  }

  .text-primary {
    color: #ff4d7a !important;
  }

  .text-success {
    color: #28a745 !important;
  }

  .text-warning {
    color: #ffc107 !important;
  }

  .text-danger {
    color: #dc3545 !important;
  }

  .text-info {
    color: #17a2b8 !important;
  }

  /* Override card margin-bottom to reduce spacing */
  .card {
    margin-bottom: 0.5rem !important;
  }
`}</style>
      <style>
        {`
@media (max-width:992px){
.react-calendar {
  transform: translateY(-200px) !important;
}
}
/* ===== Small Date Input ===== */
.small-date {
  font-size: 14px;
  height: 32px;
  padding: 4px 8px;
  white-space: nowrap;
}

/* ===== React Date Picker (react-date-picker) ===== */
.react-date-picker {
  height: 32px;
  box-sizing:content-box;
}

.react-date-picker__wrapper {
  height: 100%;
  border: none !important;
  box-shadow: none !important;
  display: flex;
  align-items: center;
}

.react-date-picker__inputGroup {
  height: 100%;
  font-size: 15px;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.react-date-picker__button {
  padding: 0;
  margin: 0;
}

.react-date-picker__calendar-button {
  padding: 0 4px;
}

/* Hide clear button if needed */
/* .react-date-picker__clear-button {
  display: none;
} */

/* ===== React Datepicker (react-datepicker) ===== */
.react-datepicker-wrapper,
.react-datepicker__input-container,
.react-datepicker__input-container input {
  width: 100%;
}
  .react-date-picker__inputGroup {
  min-width: unset !important;   /* removes calc width */
  flex-grow: 1;
  padding: 0 2px;
  box-sizing: border-box;
}
  

/* ===== Lead Buttons ===== */
.LeadButtons {
  width: 100%;
  white-space: nowrap;
}

.search-wrapper {
  position: relative;
  width: 100%;
}

.SerachClear {
  position: absolute;   /* IMPORTANT */
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px;
  background-color: #dc3545;
  border: none;
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
  cursor: pointer;
}
.google-btn{
    white-space: nowrap;
    width: 90px !important;
    overflow: hidden;
}
/* Tablet */
@media (max-width: 768px) {

  .SerachClear {
            width: 22px !important;
        height: 22px !important;
        right: 10px !important;
        top: 15px !important;
  }
}
}
`}
      </style>
      <style>{`
  /* B2B Brand Color Overrides */
  .btn-primary {
    background-color: #ff4d7a !important;
    border-color: #ff4d7a !important;
  }
  .btn-primary:hover, .btn-primary:focus, .btn-primary:active {
    background-color: #c01855 !important;
    border-color: #c01855 !important;
  }
  .btn-outline-primary {
    color: #ff4d7a !important;
    border-color: #ff4d7a !important;
  }
  .btn-outline-primary:hover, .btn-outline-primary.active {
    background-color: #ff4d7a !important;
    border-color: #ff4d7a !important;
    color: #fff !important;
  }
  .badge.bg-primary { background-color: #ff4d7a !important; }
  .text-primary { color: #ff4d7a !important; }
  .page-item.active .page-link {
    background-color: #ff4d7a !important;
    border-color: #ff4d7a !important;
  }
  .page-link { color: #ff4d7a !important; }
  .page-link:hover { color: #c01855 !important; }
  .spinner-border.text-primary { color: #ff4d7a !important; }
  .form-check-input:checked { background-color: #ff4d7a !important; border-color: #ff4d7a !important; }
`}
      </style>
    </div >
  );
};

export default B2BSales;
