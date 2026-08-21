import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import DatePicker from 'react-date-picker';
import Calendar from 'react-calendar';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'
import * as XLSX from 'xlsx';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getGoogleAuthCode, getGoogleRefreshToken } from '../../../../Component/googleOAuth';

import CandidateProfile from '../CandidateProfile/CandidateProfile';
import { useWhatsAppContext } from '../../../../contexts/WhatsAppContext';


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

/** Days since lead creation (from API `createdAt`). */
function getLeadAgeDays(lead) {
  const raw = lead?.createdAt;
  if (!raw) return null;
  const created = new Date(raw);
  if (Number.isNaN(created.getTime())) return null;
  const diffMs = Date.now() - created.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

function safeStr(v) {
  return String(v ?? '').trim();
}

function pickFirstNonEmpty(...values) {
  for (const v of values) {
    const s = safeStr(v);
    if (s) return s;
  }
  return '';
}

function getLeadSubStatusTitle(lead) {
  const id = lead?.subStatus?._id || lead?.subStatus;
  if (!id) return '';
  const list = lead?.status?.substatuses;
  if (!Array.isArray(list) || list.length === 0) return '';
  const found = list.find((ss) => String(ss?._id) === String(id));
  return pickFirstNonEmpty(found?.title, found?.name);
}

function getLeadStatusId(lead) {
  return lead?.status?._id || lead?.status || '';
}

function getLeadSubStatusObject(lead) {
  const id = lead?.subStatus?._id || lead?.subStatus;
  if (!id) return null;
  const list = lead?.status?.substatuses;
  if (Array.isArray(list) && list.length) {
    const found = list.find((ss) => String(ss?._id) === String(id));
    if (found) return found;
  }
  return { _id: id };
}

function getLeadB2bProjectName(lead) {
  return pickFirstNonEmpty(
    lead?.b2bProject?.name,
    ''
  ) || '—';
}

function getLeadB2bDepartmentName(lead) {
  return pickFirstNonEmpty(
    lead?.b2bDepartment?.name,
    lead?.typeOfB2B?.department?.name,
    ''
  ) || '—';
}

function getLeadAddressLine(lead) {
  const parts = [
    pickFirstNonEmpty(lead?.address, lead?.businessAddress),
    lead?.city,
    lead?.state,
  ].map(safeStr).filter(Boolean);

  return parts.join(', ');
}

function getLeadGroupRootId(lead) {
  if (!lead) return '';
  return String(lead.crossSaleRootId || lead.parentLeadId || lead._id || '');
}

function isDuplicatePerformanceStatus(status) {
  return /^duplicate$/i.test(String(status?.statusName || status?.name || '').trim());
}

/** Synthetic Performance filter for duplicate-mobile leads (not a pipeline status id) */
const DUPLICATE_MOBILE_FILTER = '__duplicate_mobile__';

function isDuplicateMobileFilter(statusFilter) {
  return String(statusFilter) === DUPLICATE_MOBILE_FILTER;
}

function buildLeadRemarkSuggestion({ leadFormData, leadCategoryOptions, typeOfB2BOptions }) {
  const business = safeStr(leadFormData?.businessName);
  const city = safeStr(leadFormData?.city);
  const state = safeStr(leadFormData?.state);
  const person = safeStr(leadFormData?.concernPersonName);
  const designation = safeStr(leadFormData?.designation);

  const leadCatLabel = (() => {
    const id = leadFormData?.leadCategory;
    return pickFirstNonEmpty(leadCategoryOptions?.find?.((o) => o.value === id)?.label, id);
  })();
  const b2bTypeLabel = (() => {
    const id = leadFormData?.typeOfB2B;
    return pickFirstNonEmpty(typeOfB2BOptions?.find?.((o) => o.value === id)?.label, id);
  })();

  const who = [person, designation].filter(Boolean).join(' - ');
  const where = [city, state].filter(Boolean).join(', ');

  const lines = [
    business ? `Initial connect planned with ${business}.` : 'Initial connect planned.',
    who ? `POC: ${who}.` : '',
    where ? `Location: ${where}.` : '',
    leadCatLabel ? `Lead source: ${leadCatLabel}.` : '',
    b2bTypeLabel ? `B2B type: ${b2bTypeLabel}.` : '',
    'Next step: Call and share program overview + partnership model; confirm requirements and decision timeline.'
  ].filter(Boolean);

  return lines.join('\n');
}

function getFollowupDescription(followUpType) {
  return String(followUpType || 'Call').toLowerCase() === 'visit' ? 'Followup Visit' : 'Followup Calling';
}

function buildFollowupNotesSuggestion({ followupFormData, selectedProfile, seletectedStatus, seletectedSubStatus, statuses }) {
  const leadName = pickFirstNonEmpty(selectedProfile?.businessName, selectedProfile?.name);
  const followType = pickFirstNonEmpty(followupFormData?.followUpType, 'Call');
  const statusLabel = pickFirstNonEmpty(statuses?.find?.((s) => s._id === seletectedStatus)?.name, seletectedStatus);
  const subLabel = pickFirstNonEmpty(seletectedSubStatus?.title, seletectedSubStatus?.name);

  const dateLike = followupFormData?.followupDate;
  const dt = dateLike ? new Date(dateLike) : null;
  const dateLabel = dt && !Number.isNaN(dt.getTime()) ? dt.toLocaleDateString('en-GB') : '';
  const timeLabel = safeStr(followupFormData?.followupTime);

  const lines = [
    leadName ? `${followType} follow-up for ${leadName}.` : `${followType} follow-up.`,
    statusLabel ? `Status: ${statusLabel}${subLabel ? ` / ${subLabel}` : ''}.` : (subLabel ? `Sub-status: ${subLabel}.` : ''),
    (dateLabel || timeLabel) ? `Scheduled: ${[dateLabel, timeLabel].filter(Boolean).join(' ')}.` : '',
    'Agenda: confirm interest, capture requirements, share brochure/pricing, and agree on next milestone.'
  ].filter(Boolean);

  return lines.join('\n');
}

const MultiSelectCheckbox = ({
  title,
  options,
  selectedValues,
  onChange,
  icon = "fas fa-list",
  isOpen,
  onToggle,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const [placement, setPlacement] = useState('down'); // 'down' | 'up'

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
    const spaceBelow = Math.max(0, viewportH - rect.bottom);
    const spaceAbove = Math.max(0, rect.top);
    // dropdown height ~ 360px (search + list + footer). open up if space below is tight.
    setPlacement(spaceBelow < 280 && spaceAbove > spaceBelow ? 'up' : 'down');
  }, [isOpen, options?.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const el = containerRef.current;
      if (!el) return;
      if (!el.contains(event.target)) {
        if (typeof onClose === 'function') onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (typeof onClose === 'function') onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  const handleCheckboxChange = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  // Get display text for selected items
  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return `Select ${title}`;
    } else if (selectedValues.length === 1) {
      const selectedOption = options.find(opt => opt.value === selectedValues[0]);
      return selectedOption ? selectedOption.label : selectedValues[0];
    } else if (selectedValues.length <= 2) {
      const selectedLabels = selectedValues.map(val => {
        const option = options.find(opt => opt.value === val);
        return option ? option.label : val;
      });
      return selectedLabels.join(', ');
    } else {
      return `${selectedValues.length} items selected`;
    }
  };

  const filteredOptions = useMemo(() => {
    const list = Array.isArray(options) ? options : [];
    const q = String(query || '').trim().toLowerCase();
    const filtered = !q
      ? list
      : list.filter((o) => String(o?.label || '').toLowerCase().includes(q));
    return [...filtered].sort((a, b) =>
      String(a?.label ?? '').localeCompare(String(b?.label ?? ''), undefined, {
        sensitivity: 'base',
        numeric: true,
      })
    );
  }, [options, query]);

  return (
    <div className="multi-select-container-new" ref={containerRef}>
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

        <div className={`multi-select-options-new ${isOpen ? 'open' : ''} ${placement === 'up' ? 'up' : ''}`}>
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="options-list-new">
            {filteredOptions.map((option) => (
              <label key={option.value} className="option-item-new">
                <input
                  type="checkbox"
                  className="form-check-input me-2"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => handleCheckboxChange(option.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="option-label-new">{option.label}</span>
                {selectedValues.includes(option.value) && (
                  <i className="fas fa-check text-primary ms-auto"></i>
                )}
              </label>
            ))}

            {filteredOptions.length === 0 && (
              <div className="no-options">
                <i className="fas fa-info-circle me-2"></i>
                No results
              </div>
            )}
          </div>

          {/* Footer with count */}
          {selectedValues.length > 0 && (
            <div className="options-footer">
              <small className="text-muted">
                {selectedValues.length} of {(options || []).length} selected
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const useNavHeight = (dependencies = []) => {
  const navRef = useRef(null);
  const [navHeight, setNavHeight] = useState(50); // Default fallback
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

    const handleResize = () => setTimeout(calculateWidth, 100);
    const handleSidebarResize = () => {
      calculateWidth();
      setTimeout(calculateWidth, 50);
      setTimeout(calculateWidth, 350);
    };

    let resizeObserver;
    let mutationObserver;

    const attachObservers = () => {
      const el = widthRef.current;
      if (!el) return;

      if (typeof ResizeObserver !== 'undefined' && !resizeObserver) {
        resizeObserver = new ResizeObserver(() => calculateWidth());
        resizeObserver.observe(el);
      }

      if (!mutationObserver) {
        mutationObserver = new MutationObserver(() => setTimeout(calculateWidth, 50));
        mutationObserver.observe(el, {
          childList: true,
          subtree: true,
          attributes: true,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('college-sidebar-resize', handleSidebarResize);

    attachObservers();
    const attachTimer = setTimeout(attachObservers, 100);

    return () => {
      clearTimeout(attachTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('college-sidebar-resize', handleSidebarResize);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [calculateWidth]);

  // Recalculate when dependencies change
  useEffect(() => {
    setTimeout(calculateWidth, 50);
  }, dependencies);

  return { widthRef, width, leftOffset, calculateWidth };
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

const WhatsApp = () => {

  const candidateRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const lrpReturnTo = `${location.pathname}${location.search}`;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [userData, setUserData] = useState(JSON.parse(sessionStorage.getItem("user") || "{}"));
  const token = userData.token;
  const whatsAppContext = useWhatsAppContext();
  const onWhatsappMessage = whatsAppContext?.onMessage || null;
  // const permissions = userData.permissions
  const [permissions, setPermissions] = useState();
  const canEditLeadsB2B =
    permissions?.permission_type === 'Admin' ||
    (permissions?.permission_type === 'Custom' && permissions?.custom_permissions?.can_edit_leads_b2b);
  const canEditLeadSourceB2B =
    permissions?.permission_type === 'Admin' ||
    (permissions?.permission_type === 'Custom' && permissions?.custom_permissions?.can_edit_lead_source_b2b);
  const canEditLeadTypeB2B =
    permissions?.permission_type === 'Admin' ||
    (permissions?.permission_type === 'Custom' && permissions?.custom_permissions?.can_edit_lead_type_b2b);
  const canApproveLeadsB2B =
    permissions?.permission_type === 'Admin' ||
    (permissions?.permission_type === 'Custom' && permissions?.custom_permissions?.can_approve_leads_b2b);

  const [showLeadMetaEditModal, setShowLeadMetaEditModal] = useState(false);
  const [metaEditLead, setMetaEditLead] = useState(null);
  const [metaEditForm, setMetaEditForm] = useState({ leadCategory: '', typeOfB2B: '' });
  const [metaEditSaving, setMetaEditSaving] = useState(false);

  useEffect(() => {
    updatedPermission()
  }, [])

  useEffect(() => {
    try {
      const storedToken = sessionStorage.getItem('googleAuthToken');
      if (!storedToken) return;
      const parsedToken = JSON.parse(storedToken);
      if (!parsedToken || !parsedToken.accessToken) return;

      setUserData((prev) => {
        if (prev?.googleAuthToken?.accessToken) return prev;
        const next = { ...(prev || {}), googleAuthToken: parsedToken };
        try {
          sessionStorage.setItem('user', JSON.stringify(next));
        } catch (_) { }
        return next;
      });
    } catch (_) {
    }
  }, []);

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

  const openMetaEdit = (lead) => {
    if (!lead?._id) return;
    setMetaEditLead(lead);
    setMetaEditForm({
      leadCategory: lead?.leadCategory?._id || lead?.leadCategory || lead?.leadCategoryId || '',
      typeOfB2B: lead?.typeOfB2B?._id || lead?.typeOfB2B || lead?.typeOfB2BId || ''
    });
    setShowLeadMetaEditModal(true);
  };

  const saveMetaEdit = async () => {
    if (!metaEditLead?._id) return;
    if (!metaEditForm.leadCategory || !metaEditForm.typeOfB2B) {
      alert('Please select Lead Source and B2B Type');
      return;
    }
    if (!canUpdateLead(metaEditLead)) {
      alert("You don't have permission to update this lead.");
      return;
    }
    try {
      setMetaEditSaving(true);
      const res = await axios.put(
        `${backendUrl}/college/b2b/leads/${metaEditLead._id}`,
        { leadCategory: metaEditForm.leadCategory, typeOfB2B: metaEditForm.typeOfB2B },
        { headers: { 'x-auth': token } }
      );
      if (res?.data?.status) {
        setShowLeadMetaEditModal(false);
        setMetaEditLead(null);
        await fetchLeads(selectedStatusFilter, currentPage, getLeadFetchOverrides());
        await fetchStatusCounts();
        await fetchApprovalCounts();
      } else {
        alert(res?.data?.message || 'Failed to update lead');
      }
    } catch (e) {
      console.error('Failed to update lead meta:', e);
      alert(e?.response?.data?.message || 'Failed to update lead');
    } finally {
      setMetaEditSaving(false);
    }
  };

  const [openModalId, setOpenModalId] = useState(null);

  // const [activeTab, setActiveTab] = useState(0);
  const [activeTab, setActiveTab] = useState({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(null);
  const [activeCrmFilter, setActiveCrmFilter] = useState(0);

  const [mainContentClass, setMainContentClass] = useState('col-12');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [leadDetailsVisible, setLeadDetailsVisible] = useState(null);
  const [crossSaleCache, setCrossSaleCache] = useState({});
  const [activeProjectByGroup, setActiveProjectByGroup] = useState({});
  const [showCrossSaleModal, setShowCrossSaleModal] = useState(false);
  const [crossSaleSourceLead, setCrossSaleSourceLead] = useState(null);
  const [crossSaleForm, setCrossSaleForm] = useState({
    b2bDepartment: '',
    b2bProject: '',
    typeOfB2B: '',
    leadOwner: '',
    leadStatus: '',
    leadSubStatus: '',
    remark: '',
  });
  const [crossSaleSubStatuses, setCrossSaleSubStatuses] = useState([]);
  const [crossSaleSubStatusesLoading, setCrossSaleSubStatusesLoading] = useState(false);
  const [crossSaleLoading, setCrossSaleLoading] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  const [viewMode, setViewMode] = useState('grid');
  const [isMobile, setIsMobile] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
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

  // Lead Approval (backend: lead.approval.status)
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState(null); // null | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [approvalCounts, setApprovalCounts] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [approvalCountsLoading, setApprovalCountsLoading] = useState(false);
  const [approvalLeadTarget, setApprovalLeadTarget] = useState(null);
  const [approvalEditLeadId, setApprovalEditLeadId] = useState(null);

  // Lead Documents (backend: /college/b2b/leads/:id/documents)
  const [showLeadDocumentsModal, setShowLeadDocumentsModal] = useState(false);
  const [documentsLead, setDocumentsLead] = useState(null);
  const [leadDocuments, setLeadDocuments] = useState([]);
  const [leadDocumentsLoading, setLeadDocumentsLoading] = useState(false);
  const [leadDocumentUploading, setLeadDocumentUploading] = useState(false);
  const [leadDocType, setLeadDocType] = useState('');
  const [leadDocFileSelected, setLeadDocFileSelected] = useState(false);
  const leadDocFileRef = useRef(null);
  const [leadCategoryDocuments, setLeadCategoryDocuments] = useState([]); // from LeadCategory.documents (required docs)

  const mergedLeadDocuments = useMemo(() => {
    const uploaded = Array.isArray(leadDocuments) ? leadDocuments : [];
    const required = Array.isArray(leadCategoryDocuments) ? leadCategoryDocuments : [];

    if (!required.length) return uploaded;

    const norm = (s) => String(s || '').trim().toLowerCase();
    const byType = new Map();
    for (const doc of uploaded) {
      const key = norm(doc?.docType) || norm(doc?.name);
      if (!key) continue;
      // keep first match; multiple uploads can still show via "extra" below
      if (!byType.has(key)) byType.set(key, doc);
    }

    const merged = required.map((r) => {
      const typeKey = norm(r?.name);
      const hit = typeKey ? byType.get(typeKey) : null;
      if (hit) {
        return { ...hit, isRequired: true, isMandatory: Boolean(r?.isMandatory) };
      }
      return {
        id: `required:${String(r?.name || '').trim()}`,
        name: String(r?.name || '').trim() || 'Document',
        docType: String(r?.name || '').trim(),
        status: 'MISSING',
        url: '',
        isPlaceholder: true,
        isRequired: true,
        isMandatory: Boolean(r?.isMandatory),
      };
    });

    // show uploads that don't belong to required list at the end
    const requiredKeys = new Set(required.map((r) => norm(r?.name)).filter(Boolean));
    const extras = uploaded
      .filter((d) => !requiredKeys.has(norm(d?.docType) || norm(d?.name)))
      .map((d) => ({ ...d, isExtra: true }));

    return [...merged, ...extras];
  }, [leadDocuments, leadCategoryDocuments]);


  // open model for upload documents 
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [currentPreviewUpload, setCurrentPreviewUpload] = useState(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [bulkUploadMessage, setBulkUploadMessage] = useState('');
  const [bulkUploadErrors, setBulkUploadErrors] = useState([]);
  const [bulkUploadSuccess, setBulkUploadSuccess] = useState(false);
  const [bulkUploadFormData, setBulkUploadFormData] = useState({
    leadCategory: '',
    b2bDepartment: '',
    b2bProject: '',
    typeOfB2B: '',
    leadStatus: '',
    leadSubStatus: '',
    leadOwner: '',
    leadCoOwner: '',
    leadRanking: ''
  });
  const [bulkUploadFormErrors, setBulkUploadFormErrors] = useState({});
  const [bulkUploadSubStatuses, setBulkUploadSubStatuses] = useState([]);
  const [bulkUploadSubStatusesLoading, setBulkUploadSubStatusesLoading] = useState(false);

  // Bulk inputs state
  const [showBulkInputs, setShowBulkInputs] = useState(false);
  const [bulkMode, setBulkMode] = useState(''); // 'whatsapp' | 'bulkrefer' | 'bulkaction'
  const [input1Value, setInput1Value] = useState('');
  const [debouncedBulkCount, setDebouncedBulkCount] = useState('');
  const bulkSelectionFromCheckboxRef = useRef(false);
  const bulkSelectionModeRef = useRef('count'); // 'count' | 'manual'
  const [modalType, setModalType] = useState(null); // 'whatsapp'
  const [selectedWhatsappNumbers, setSelectedWhatsappNumbers] = useState([]);
  const [selectedWhatsappTemplateModal, setSelectedWhatsappTemplateModal] = useState('');
  const [isSendingBulkWhatsapp, setIsSendingBulkWhatsapp] = useState(false);

  // Lead form state
  const [leadFormData, setLeadFormData] = useState({
    leadCategory: '',
    b2bProject: '',
    b2bDepartment: '',
    typeOfB2B: '',
    businessName: '',
    businessAddress: '',
    concernPersonName: '',
    address: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    designation: '',
    email: '',
    mobile: '',
    whatsapp: '',
    landlineNumber: '',
    leadOwner: '',
    leadCoOwner: '',
    leadStatus: '',
    leadSubStatus: '',
    leadRanking: '',
    remark: ''
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  const [extractedNumbers, setExtractedNumbers] = useState([]);
  const [isDuplicateMobile, setIsDuplicateMobile] = useState(false);
  const mobileDuplicateCheckRef = useRef(0);

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
  const showPanelRef = useRef('');
  showPanelRef.current = showPanel;
  const selectedProfileRef = useRef(null);
  selectedProfileRef.current = selectedProfile;
  const processedInboxMessageIds = useRef(new Set());

  // Mobile "More actions" modal (per lead)
  const [mobileMoreLead, setMobileMoreLead] = useState(null);


  // Loading state for fetchProfileData
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);


  // B2B Dropdown Options
  const [leadCategoryOptions, setLeadCategoryOptions] = useState([]);
  const [b2bProjectOptions, setB2bProjectOptions] = useState([]);
  const [allB2bProjects, setAllB2bProjects] = useState([]);
  const [allB2bDepartments, setAllB2bDepartments] = useState([]);
  const [allTypeOfB2BRaw, setAllTypeOfB2BRaw] = useState([]);

  const addLeadProjects = useMemo(() => {
    if (!leadFormData.b2bDepartment) return [];
    return allB2bProjects.filter(
      (proj) => String(proj.department?._id || proj.department) === String(leadFormData.b2bDepartment)
    );
  }, [allB2bProjects, leadFormData.b2bDepartment]);

  const typeOfB2BOptions = useMemo(() => (
    allTypeOfB2BRaw.map((type) => ({
      value: type._id,
      label: type.name
    }))
  ), [allTypeOfB2BRaw]);

  const addLeadTypeOptions = useMemo(() => {
    if (!leadFormData.b2bDepartment) return [];
    return allTypeOfB2BRaw
      .filter((type) => {
        const deptId = type.department?._id || type.department;
        return deptId === leadFormData.b2bDepartment;
      })
      .map((type) => ({
        value: type._id,
        label: type.name
      }));
  }, [allTypeOfB2BRaw, leadFormData.b2bDepartment]);

  /** Sub-statuses for the Add Lead modal (loaded from `/statusB2b/:id/substatus`) */
  const [addLeadSubStatuses, setAddLeadSubStatuses] = useState([]);
  const [addLeadSubStatusesLoading, setAddLeadSubStatusesLoading] = useState(false);

  // Lead Ranking state
  const [leadRankings, setLeadRankings] = useState([]);
  const [leadRankingsLoading, setLeadRankingsLoading] = useState(false);

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
      sessionStorage.setItem('user', JSON.stringify(user));

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
      followUpType: 'Call',
      description: '',
      followupDate: '',
      followupTime: '',
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

      if (showPanel === 'editPanel' || showPanel === 'bulkstatuschange') {
        if (!seletectedStatus) {
          alert('Please select a status');
          return;
        }
        if (!seletectedSubStatus?._id) {
          alert('Please select a sub-status');
          return;
        }
      }

      // Determine whether follow-up fields are filled
      const hasFollowup =
        (showPanel === 'followUp') ||
        ((showPanel === 'editPanel' || showPanel === 'bulkstatuschange') && seletectedSubStatus && seletectedSubStatus.hasFollowup);

      const hasFollowupData =
        hasFollowup && followupFormData.followupDate && followupFormData.followupTime;

      const toYmdLocal = (d) => {
        const dt = d instanceof Date ? d : new Date(d);
        if (Number.isNaN(dt.getTime())) return '';
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };
      const followupDateValue = toYmdLocal(followupFormData.followupDate);

      // 1) Bulk status change panel
      if (showPanel === 'bulkstatuschange' && seletectedStatus) {
        if (!selectedProfiles?.length) {
          alert('Please type a number in Input 1 to select leads first.');
          return;
        }

        if (seletectedSubStatus?.hasRemarks && !followupFormData.remarks?.trim()) {
          alert('Remarks are mandatory for this status. Please add remarks.');
          return;
        }

        if (seletectedSubStatus?.hasFollowup && !hasFollowupData) {
          alert('Follow-up date and time are mandatory for this status.');
          return;
        }

        const statusData = {
          status: seletectedStatus,
          subStatus: seletectedSubStatus._id,
          remarks: followupFormData.remarks || 'Bulk status updated via B2B panel'
        };

        if (hasFollowupData) {
          statusData.followUpDate = followupDateValue;
          statusData.followUpTime = followupFormData.followupTime;
          statusData.googleCalendarEvent = true;
        }

        const results = await Promise.allSettled(
          selectedProfiles.map((id) =>
            axios.put(`${backendUrl}/college/b2b/leads/${id}/status`, statusData, {
              headers: { 'x-auth': token }
            })
          )
        );

        const ok = results.filter((r) => r.status === 'fulfilled' && r.value?.data?.status).length;
        const failed = results.length - ok;

        if (ok > 0) {
          alert(`✅ Updated status for ${ok} lead(s)${failed ? `, ${failed} failed` : ''}.`);
          await fetchLeads(selectedStatusFilter, currentPage, getLeadFetchOverrides());
          await fetchStatusCounts();
        } else {
          alert('Failed to update status for selected leads.');
          return;
        }
      }

      // 2) Edit panel: change status (and optionally set follow-up + Google Calendar) via B2B status API
      if (showPanel === 'editPanel' && selectedProfile && seletectedStatus && seletectedSubStatus?._id) {
        if (seletectedSubStatus?.hasRemarks && !followupFormData.remarks?.trim()) {
          alert('Remarks are mandatory for this status. Please add remarks.');
          return;
        }

        if (seletectedSubStatus?.hasFollowup && !hasFollowupData) {
          alert('Follow-up date and time are mandatory for this status.');
          return;
        }

        const statusData = {
          status: seletectedStatus,
          subStatus: seletectedSubStatus._id,
          remarks: followupFormData.remarks || 'Status updated via B2B panel'
        };

        if (hasFollowupData) {
          statusData.followUpDate = followupDateValue;
          statusData.followUpTime = followupFormData.followupTime;
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
          `${backendUrl}/college/b2b/leads/${selectedProfile._id}/followup`,
          {
            followUpType: followupFormData.followUpType || 'Call',
            description:
              followupFormData.description ||
              getFollowupDescription(followupFormData.followUpType),
            scheduledDate: followupDateValue,
            scheduledTime: followupFormData.followupTime,
            remarks: followupFormData.remarks || '',
            googleCalendarEvent: true
          },
          {
            headers: { 'x-auth': token }
          }
        );

        alert(`✅ ${followupFormData.followUpType === 'Visit' ? 'Visit' : 'Call'} follow-up saved and scheduled successfully!`);
        // ensure UI updates immediately (even if custom event listener misses)
        await fetchLeads(selectedStatusFilter, currentPage, getLeadFetchOverrides());
        if (leadViewTab === 'all') {
          await fetchStatusCounts();
        }
      }

      window.dispatchEvent(new CustomEvent('b2b-followup-updated'));
    } catch (error) {
      console.error('❌ Error in addFollowUpToGoogleCalendar:', error);
      alert('❌ Error processing request');
    } finally {
      closePanel();
    }
  };

  const formatFollowupDate = (dateLike) => {
    if (!dateLike) return '—';
    const dt = new Date(dateLike);
    if (Number.isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString('en-GB'); // dd/mm/yyyy
  };

  const getLeadFollowupDateLabel = (lead, type) => {
    // Missed / done followups have no upcoming date
    const bucket = getLeadFollowupBucket(lead, type);
    if (bucket === 'missed' || bucket === 'done') return 'NA';

    const t = String(type || '').toLowerCase();
    const bySlot = t === 'visit'
      ? (lead?.followUpVisit || null)
      : (lead?.followUpCall || null);
    if (bySlot?.scheduledDate) return formatFollowupDate(bySlot.scheduledDate);

    const legacy = lead?.followup || lead?.followUp || null;
    if (legacy?.scheduledDate) {
      const legacyType = String(legacy?.followUpType || legacy?.type || 'call').toLowerCase();
      if ((t === 'visit' && legacyType === 'visit') || (t === 'call' && legacyType !== 'visit')) {
        return formatFollowupDate(legacy.scheduledDate);
      }
    }
    if (legacy?.followupDate) return formatFollowupDate(legacy.followupDate);
    return 'NA';
  };

  const getFollowupBucket = (followUpLike) => {
    if (!followUpLike) return null;
    const status = String(followUpLike?.status || '').trim().toLowerCase();
    if (status === 'completed') return 'done';
    // Missed is set by midnight cron only — not live via date < now
    if (status === 'missed') return 'missed';
    if (status === 'rescheduled') return null;

    const dt = followUpLike?.scheduledDate ? new Date(followUpLike.scheduledDate) : null;
    if (!dt || Number.isNaN(dt.getTime())) return null;
    return 'planned';
  };

  const getLeadFollowupBucket = (lead, type) => {
    const t = String(type || '').toLowerCase();
    const slot = t === 'visit' ? (lead?.followUpVisit || null) : (lead?.followUpCall || null);
    const slotBucket = getFollowupBucket(slot);
    if (slotBucket) return slotBucket;

    const legacy = lead?.followup || lead?.followUp || null;
    if (!legacy) return null;
    const legacyType = String(legacy?.followUpType || legacy?.type || 'call').toLowerCase();
    if (t === 'visit' && legacyType !== 'visit') return null;
    if (t === 'call' && legacyType === 'visit') return null;
    return getFollowupBucket(legacy);
  };

  const getLeadFollowupDoneCount = (lead, type) => {
    const t = String(type || '').toLowerCase() === 'visit' ? 'visit' : 'call';
    const apiCount = Number(lead?.followupStats?.[t]?.done);
    if (Number.isFinite(apiCount) && apiCount > 0) return apiCount;
    return getLeadFollowupBucket(lead, type) === 'done' ? 1 : 0;
  };

  /** Missed count from DB status (cron); avoid double-counting current slot */
  const getLeadFollowupMissedCount = (lead, type) => {
    const t = String(type || '').toLowerCase() === 'visit' ? 'visit' : 'call';
    const historical = Number(lead?.followupStats?.[t]?.missed);
    const hist = Number.isFinite(historical) && historical > 0 ? historical : 0;
    if (hist > 0) return hist;
    return getLeadFollowupBucket(lead, type) === 'missed' ? 1 : 0;
  };

  const leadHasFollowup = (lead, type) => (
    Boolean(getLeadFollowupBucket(lead, type))
    || getLeadFollowupDoneCount(lead, type) > 0
    || getLeadFollowupMissedCount(lead, type) > 0
  );

  // Light-red empty style only when neither Call nor Visit followup exists
  const leadHasAnyFollowup = (lead) => (
    leadHasFollowup(lead, 'Call') || leadHasFollowup(lead, 'Visit')
  );

  const getLeadDocumentsBucket = (lead) => {
    const required = Array.isArray(lead?.leadCategory?.documents) ? lead.leadCategory.documents : [];
    // Only count documents for lead sources where documents are configured/required
    if (required.length === 0) return null;

    const docs = Array.isArray(lead?.documents) ? lead.documents : [];
    if (docs.length === 0) return 'pending';

    const anyPending = docs.some((d) => String(d?.status || 'PENDING').toUpperCase() !== 'APPROVED');
    return anyPending ? 'pending' : 'done';
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
    fetchApprovalCounts(); // Fetch lead approval counts
  }, []);


  // Initialize autocomplete when modal is opened
  useEffect(() => {
    if (showAddLeadModal) {
      // Small delay to ensure modal is fully rendered and Google Maps is loaded
      const timer = setTimeout(() => {
        initializeBusinessNameAutocomplete();
        initializeCityAutocomplete();
        initializeStateAutocomplete();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [showAddLeadModal]);

  // Fetch B2B dropdown options
  const fetchB2BDropdownOptions = async () => {
    try {
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

      // Fetch Lead Categories (only active)
      const leadCategoriesRes = await axios.get(`${backendUrl}/college/b2b/lead-categories?status=true`, {
        headers: { 'x-auth': token }
      });
      if (leadCategoriesRes.data.status) {
        setLeadCategoryOptions(leadCategoriesRes.data.data
          .filter(cat => cat.isActive === true) // Filter only active items
          .map(cat => ({
            value: cat._id,
            label: cat.name || cat.title
          })));
      }

      const [projectsRes, departmentsRes, typeOfB2BRes] = await Promise.all([
        axios.get(`${backendUrl}/college/b2b/b2b-projects?status=true`, { headers: { 'x-auth': token } }),
        axios.get(`${backendUrl}/college/b2b/b2b-departments?status=true`, { headers: { 'x-auth': token } }),
        axios.get(`${backendUrl}/college/b2b/type-of-b2b?status=true`, { headers: { 'x-auth': token } }),
      ]);

      if (projectsRes.data.status) {
        const activeProjects = (projectsRes.data.data || []).filter((p) => p.isActive !== false);
        setAllB2bProjects(activeProjects);
        setB2bProjectOptions(
          activeProjects.map((p) => ({ value: p._id, label: p.name }))
        );
      }

      if (departmentsRes.data.status) {
        setAllB2bDepartments(departmentsRes.data.data || []);
      }

      if (typeOfB2BRes.data.status) {
        setAllTypeOfB2BRaw(
          (typeOfB2BRes.data.data || []).filter((type) => type.isActive !== false)
        );
      }

      try {
        setLeadRankingsLoading(true);
        const rankingsRes = await axios.get(`${backendUrl}/college/b2b/lead-rankings?status=true`, {
          headers: { 'x-auth': token }
        });
        if (rankingsRes.data.status) {
          setLeadRankings(
            (rankingsRes.data.data || []).filter((ranking) => ranking.isActive !== false)
          );
        }
      } finally {
        setLeadRankingsLoading(false);
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
  const validateMobileNumber = (number) => {
    // Remove all non-digit characters
    const cleanNumber = number.replace(/\D/g, '');
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(cleanNumber);
  };

  // Extract mobile/WhatsApp numbers from text
  const extractMobileNumbers = (text) => {
    if (!text) return [];

    const mobileRegex = /(?:\+91[\s-]?)?\d{10}/g;
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

    if (name === 'leadStatus') {
      setLeadFormData(prev => ({
        ...prev,
        leadStatus: value,
        leadSubStatus: ''
      }));
    } else if (name === 'b2bDepartment') {
      setLeadFormData(prev => ({
        ...prev,
        b2bDepartment: value,
        b2bProject: '',
        typeOfB2B: ''
      }));
    } else if (name === 'b2bProject') {
      setLeadFormData(prev => ({
        ...prev,
        b2bProject: value,
        typeOfB2B: ''
      }));
    } else {
      setLeadFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    const clearFields = name === 'b2bDepartment'
      ? ['b2bDepartment', 'b2bProject', 'typeOfB2B']
      : name === 'b2bProject'
        ? ['b2bProject', 'typeOfB2B']
        : [name];

    if (clearFields.some((f) => formErrors[f])) {
      setFormErrors(prev => {
        const next = { ...prev };
        clearFields.forEach((f) => { delete next[f]; });
        return next;
      });
    }

    // Extract numbers from mobile and whatsapp fields
    if (name === 'mobile' || name === 'whatsapp') {
      const extracted = extractMobileNumbers(value);
      setExtractedNumbers(extracted);
    }
  };

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

    if (name === 'mobile' && !editingLeadId) {
      const digits = String(cleanValue || '').replace(/\D/g, '').slice(-10);
      if (digits.length !== 10) {
        setIsDuplicateMobile(false);
      }
    }
  };

  // Validate lead form
  const validateLeadForm = () => {
    const errors = {};

    // Required field validation
    if (!leadFormData.leadCategory) errors.leadCategory = 'Lead source is required';
    if (!leadFormData.b2bDepartment) errors.b2bDepartment = 'B2B department is required';
    if (!leadFormData.b2bProject) errors.b2bProject = 'B2B project is required';
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
      errors.mobile = 'Please enter a valid 10-digit phone number';
    }

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
  const [downloadingPerformanceLeads, setDownloadingPerformanceLeads] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  const [leadViewTab, setLeadViewTab] = useState('all'); // 'all' | 'myRefer' | 'noFollowup'
  const [myReferLeadsCount, setMyReferLeadsCount] = useState(0);
  const [noFollowupLeadsCount, setNoFollowupLeadsCount] = useState(0);

  const [aiLeadIntelById, setAiLeadIntelById] = useState({});
  const [aiLeadIntelLoading, setAiLeadIntelLoading] = useState(false);
  const [aiLeadIntelError, setAiLeadIntelError] = useState('');

  // Add state for status counts
  const [statusCounts, setStatusCounts] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loadingStatusCounts, setLoadingStatusCounts] = useState(false);
  const [followupDashboardCounts, setFollowupDashboardCounts] = useState({
    call: { done: 0, planned: 0, missed: 0 },
    visit: { done: 0, planned: 0, missed: 0 },
  });

  const sortedPerformanceStatuses = useMemo(() => {
    const list = [...(statusCounts || [])].filter((s) => !isDuplicatePerformanceStatus(s));
    list.sort((a, b) => (a.statusIndex ?? 9999) - (b.statusIndex ?? 9999));
    return list;
  }, [statusCounts]);

  const [duplicateMobileCount, setDuplicateMobileCount] = useState(0);

  // Dedicated Duplicate chip — filters by isDuplicateMobile flag (lead keeps its real status)
  const duplicatePerformanceStatus = useMemo(() => ({
    statusId: DUPLICATE_MOBILE_FILTER,
    statusName: 'Duplicate',
    count: duplicateMobileCount,
  }), [duplicateMobileCount]);

  const dashboardB2BCounts = useMemo(() => {
    const list = Array.isArray(leads) ? leads : [];
    const docs = { done: 0, pending: 0 };

    for (const lead of list) {
      const db = getLeadDocumentsBucket(lead);
      if (db) docs[db] += 1;
    }

    return {
      call: followupDashboardCounts.call,
      visit: followupDashboardCounts.visit,
      docs,
    };
  }, [leads, followupDashboardCounts]);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    leadCategory: [],
    b2bProject: '',
    b2bDepartment: '',
    typeOfB2B: [],
    leadOwner: [],
    hasFollowUpCall: '', // '' | true | false
    hasFollowUpVisit: '', // '' | true | false
    followUpCallBucket: '', // '' | 'done' | 'planned' | 'missed'
    followUpVisitBucket: '',
    documentsStatus: [], // ['done','pending']
    dateRange: {
      start: null,
      end: null
    },
    modifiedDateRange: {
      start: null,
      end: null
    },
    nextActionDateRange: {
      start: null,
      end: null
    },
    status: [],
    subStatus: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [headerDatePreset, setHeaderDatePreset] = useState('');
  const [headerDateFrom, setHeaderDateFrom] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [headerDateTo, setHeaderDateTo] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showHeaderDateRangePicker, setShowHeaderDateRangePicker] = useState(false);

  const filtersRef = useRef(filters);
  const leadViewTabRef = useRef(leadViewTab);
  const selectedStatusFilterRef = useRef(selectedStatusFilter);
  const currentPageRef = useRef(currentPage);
  const selectedApprovalStatusRef = useRef(selectedApprovalStatus);
  const fetchLeadsRequestRef = useRef(0);

  filtersRef.current = filters;
  leadViewTabRef.current = leadViewTab;
  selectedStatusFilterRef.current = selectedStatusFilter;
  currentPageRef.current = currentPage;
  selectedApprovalStatusRef.current = selectedApprovalStatus;

  const cycleProjectOptions = useMemo(() => {
    if (!filters.b2bDepartment) return allB2bProjects;
    return allB2bProjects.filter(
      (proj) => String(proj.department?._id || proj.department) === String(filters.b2bDepartment)
    );
  }, [allB2bProjects, filters.b2bDepartment]);

  const cycleTypeOfB2BOptions = useMemo(() => {
    let types = allTypeOfB2BRaw;
    if (filters.b2bDepartment) {
      types = types.filter(
        (type) => String(type.department?._id || type.department) === String(filters.b2bDepartment)
      );
    } else if (filters.b2bProject) {
      const project = allB2bProjects.find((p) => String(p._id) === String(filters.b2bProject));
      if (project) {
        const deptId = String(project.department?._id || project.department);
        types = types.filter(
          (type) => String(type.department?._id || type.department) === deptId
        );
      }
    }
    return types;
  }, [allTypeOfB2BRaw, filters.b2bDepartment, filters.b2bProject, allB2bProjects]);

  const fetchMyReferLeadsCount = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/b2b/leads/status-count`, {
        headers: { 'x-auth': token },
        params: { referredByMe: true }
      });
      if (response.data.status) {
        setMyReferLeadsCount(response.data.data?.totalLeads ?? 0);
      }
    } catch (error) {
      console.error('Error fetching my referred leads count:', error);
    }
  };

  const fetchNoFollowupLeadsCount = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/b2b/leads/status-count`, {
        headers: { 'x-auth': token },
        params: { hasFollowUpCall: false, hasFollowUpVisit: false }
      });
      if (response.data.status) {
        setNoFollowupLeadsCount(response.data.data?.totalLeads ?? 0);
      }
    } catch (error) {
      console.error('Error fetching no-followup leads count:', error);
    }
  };

  const getLeadFetchOverrides = (extra = {}, viewTab = leadViewTabRef.current) => {
    const overrides = { ...extra };
    if (viewTab === 'myRefer') {
      overrides.referredByMe = true;
    }
    if (viewTab === 'noFollowup') {
      overrides.hasFollowUpCall = false;
      overrides.hasFollowUpVisit = false;
    }
    return overrides;
  };

  const handleLeadViewTabChange = (tab) => {
    if (tab === leadViewTab) return;
    setLeadViewTab(tab);
    setSelectedStatusFilter(null);
    setSelectedApprovalStatus(null);
    setCurrentPage(1);
    const overrides = getLeadFetchOverrides({ approvalStatus: null }, tab);
    fetchLeads(null, 1, overrides);
    if (tab === 'all') {
      fetchStatusCounts();
      fetchApprovalCounts();
    }
  };

  const fetchCrossSaleGroup = useCallback(async (lead) => {
    if (!lead?._id || !token) return;
    const rootId = getLeadGroupRootId(lead);
    if (!rootId) return;
    try {
      const response = await axios.get(
        `${backendUrl}/college/b2b/leads/${lead._id}/cross-sales`,
        { headers: { 'x-auth': token } }
      );
      if (response.data.status) {
        const groupLeads = response.data.data?.leads || [];
        setCrossSaleCache((prev) => ({ ...prev, [rootId]: groupLeads }));
      }
    } catch (error) {
      console.error('Error fetching cross-sale group:', error);
    }
  }, [backendUrl, token]);

  const leadDisplayGroups = useMemo(() => {
    const byRoot = new Map();
    for (const listLead of leads) {
      const rootId = getLeadGroupRootId(listLead);
      if (!byRoot.has(rootId)) {
        byRoot.set(rootId, { rootId, membersFromList: [] });
      }
      byRoot.get(rootId).membersFromList.push(listLead);
    }
    return Array.from(byRoot.values()).map((group) => {
      const cached = crossSaleCache[group.rootId];
      const freshById = new Map(group.membersFromList.map((l) => [String(l._id), l]));
      let merged;
      if (cached?.length) {
        // Prefer main leads list (followUpCall/Visit populated); use cache only for missing cross-sale rows
        const cachedById = new Map(cached.map((l) => [String(l._id), l]));
        const allIds = new Set([...freshById.keys(), ...cachedById.keys()]);
        merged = [...allIds].map((id) => {
          const fresh = freshById.get(id);
          const cached = cachedById.get(id);
          if (fresh && cached) return { ...cached, ...fresh };
          return fresh || cached;
        }).filter(Boolean);
      } else {
        merged = group.membersFromList;
      }
      const unique = [...new Map(merged.map((l) => [String(l._id), l])).values()];
      const sorted = unique.sort((a, b) => {
        const aPrimary = !a.parentLeadId;
        const bPrimary = !b.parentLeadId;
        if (aPrimary !== bPrimary) return aPrimary ? -1 : 1;
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      });
      // Cross-sale siblings are fetched without the active filters, so the group can contain
      // leads the user did not ask for. Open on a member that came from the filtered list.
      const matchedIds = new Set(group.membersFromList.map((l) => String(l._id)));
      const defaultLead = sorted.find((l) => matchedIds.has(String(l._id))) || sorted[0];
      return { ...group, leads: sorted, defaultLeadId: defaultLead?._id };
    });
  }, [leads, crossSaleCache]);

  useEffect(() => {
    if (!leads.length) return;
    const rootIds = [...new Set(leads.map((l) => getLeadGroupRootId(l)).filter(Boolean))];
    rootIds.forEach((rootId) => {
      if (crossSaleCache[rootId]) return;
      const sample = leads.find((l) => getLeadGroupRootId(l) === rootId);
      if (sample) fetchCrossSaleGroup(sample);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, fetchCrossSaleGroup]);

  const crossSaleProjectOptions = useMemo(() => {
    if (!crossSaleForm.b2bDepartment) return [];
    return allB2bProjects.filter(
      (proj) => String(proj.department?._id || proj.department) === String(crossSaleForm.b2bDepartment)
    );
  }, [allB2bProjects, crossSaleForm.b2bDepartment]);

  const crossSaleTypeOptions = useMemo(() => {
    if (!crossSaleForm.b2bDepartment) return [];
    return allTypeOfB2BRaw.filter(
      (type) => String(type.department?._id || type.department) === String(crossSaleForm.b2bDepartment)
    );
  }, [allTypeOfB2BRaw, crossSaleForm.b2bDepartment]);

  const openCrossSaleModal = (lead) => {
    setCrossSaleSourceLead(lead);
    setCrossSaleForm({
      b2bDepartment: '',
      b2bProject: '',
      typeOfB2B: lead?.typeOfB2B?._id || lead?.typeOfB2B || '',
      leadOwner: lead?.leadOwner?._id || lead?.leadOwner || userData?._id || '',
      leadStatus: '',
      leadSubStatus: '',
      remark: '',
    });
    setCrossSaleSubStatuses([]);
    setShowCrossSaleModal(true);
    fetchCrossSaleGroup(lead);
  };

  const closeCrossSaleModal = () => {
    setShowCrossSaleModal(false);
    setCrossSaleSourceLead(null);
    setCrossSaleForm({
      b2bDepartment: '',
      b2bProject: '',
      typeOfB2B: '',
      leadOwner: '',
      leadStatus: '',
      leadSubStatus: '',
      remark: '',
    });
    setCrossSaleSubStatuses([]);
    setCrossSaleSubStatusesLoading(false);
  };

  useEffect(() => {
    if (!showCrossSaleModal || !crossSaleForm.leadStatus) {
      if (!crossSaleForm.leadStatus) {
        setCrossSaleSubStatuses([]);
        setCrossSaleSubStatusesLoading(false);
      }
      return;
    }
    let cancelled = false;
    setCrossSaleSubStatusesLoading(true);
    axios
      .get(`${backendUrl}/college/statusB2b/${crossSaleForm.leadStatus}/substatus`, {
        headers: { 'x-auth': token },
      })
      .then((response) => {
        if (cancelled) return;
        if (response.data.success) {
          setCrossSaleSubStatuses(Array.isArray(response.data.data) ? response.data.data : []);
        } else {
          setCrossSaleSubStatuses([]);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Cross-sale: failed to load sub-statuses', err);
          setCrossSaleSubStatuses([]);
        }
      })
      .finally(() => {
        if (!cancelled) setCrossSaleSubStatusesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showCrossSaleModal, crossSaleForm.leadStatus, backendUrl, token]);

  const handleCrossSaleSubmit = async () => {
    if (!crossSaleSourceLead?._id) return;
    if (!crossSaleForm.b2bDepartment || !crossSaleForm.b2bProject || !crossSaleForm.typeOfB2B) {
      alert('Please select department, project, and B2B type');
      return;
    }
    if (!crossSaleForm.leadStatus) {
      alert('Please select lead status');
      return;
    }
    if (!crossSaleForm.leadSubStatus) {
      alert('Please select sub-status');
      return;
    }
    if (!crossSaleForm.leadOwner) {
      alert('Please select counsellor');
      return;
    }
    try {
      setCrossSaleLoading(true);
      const response = await axios.post(
        `${backendUrl}/college/b2b/leads/${crossSaleSourceLead._id}/cross-sale`,
        {
          b2bDepartment: crossSaleForm.b2bDepartment,
          b2bProject: crossSaleForm.b2bProject,
          typeOfB2B: crossSaleForm.typeOfB2B,
          leadOwner: crossSaleForm.leadOwner || undefined,
          status: crossSaleForm.leadStatus,
          subStatus: crossSaleForm.leadSubStatus,
          remark: crossSaleForm.remark,
        },
        { headers: { 'x-auth': token } }
      );
      if (response.data.status) {
        const rootId = getLeadGroupRootId(crossSaleSourceLead);
        const newLead = response.data.data;
        setCrossSaleCache((prev) => {
          const existing = prev[rootId] || [];
          const merged = [...existing, newLead].filter(
            (l, i, arr) => arr.findIndex((x) => String(x._id) === String(l._id)) === i
          );
          return { ...prev, [rootId]: merged };
        });
        setActiveProjectByGroup((prev) => ({
          ...prev,
          [rootId]: newLead._id,
        }));
        alert('Cross-sale lead added in the new project');
        closeCrossSaleModal();
        await fetchLeads(selectedStatusFilter, currentPage, getLeadFetchOverrides());
        await fetchCrossSaleGroup(crossSaleSourceLead);
      } else {
        alert(response.data.message || 'Failed to add cross-sale');
      }
    } catch (error) {
      console.error('Cross-sale error:', error);
      alert(error.response?.data?.message || 'Failed to add cross-sale');
    } finally {
      setCrossSaleLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(null, 1);
    fetchMyReferLeadsCount();
    fetchNoFollowupLeadsCount();
  }, []);

  // When a follow-up is saved, refresh the list so dates update per-lead
  useEffect(() => {
    const handler = () => {
      setCrossSaleCache({});
      fetchLeads(
        selectedStatusFilterRef.current,
        currentPageRef.current,
        getLeadFetchOverrides()
      );
      fetchNoFollowupLeadsCount();
      if (leadViewTabRef.current === 'all') {
        fetchStatusCounts();
        fetchApprovalCounts();
      }
    };
    window.addEventListener('b2b-followup-updated', handler);
    return () => window.removeEventListener('b2b-followup-updated', handler);
  }, []);

  // Max selectable count for bulk actions = active Performance tab (not overall Total)
  const getBulkSelectableLeadCount = () => {
    if (isDuplicateMobileFilter(selectedStatusFilter)) {
      return pageSize > 0 ? pageSize : (duplicateMobileCount || leads?.length || 0);
    }
    if (selectedStatusFilter) {
      const status = (statusCounts || []).find(
        (s) => String(s.statusId) === String(selectedStatusFilter)
      );
      return pageSize > 0 ? pageSize : (status?.count ?? leads?.length ?? 0);
    }
    return pageSize > 0 ? pageSize : (totalLeads || leads?.length || 0);
  };

  const resetBulkSelectionState = () => {
    setDebouncedBulkCount('');
    bulkSelectionFromCheckboxRef.current = false;
    bulkSelectionModeRef.current = 'count';
  };

  const isLeadBulkSelected = (leadId) =>
    (selectedProfiles || []).some((id) => String(id) === String(leadId));

  // Card checkbox ↔ Input 1 count (same pattern as B2C)
  const handleLeadBulkCheckboxChange = (lead, checked) => {
    if (!lead?._id) return;
    const idStr = String(lead._id);
    const prev = Array.isArray(selectedProfiles) ? selectedProfiles : [];
    const next = checked
      ? (prev.some((id) => String(id) === idStr) ? prev : [...prev, lead._id])
      : prev.filter((id) => String(id) !== idStr);

    bulkSelectionModeRef.current = 'manual';
    bulkSelectionFromCheckboxRef.current = true;
    setSelectedProfiles(next);
    setInput1Value(next.length > 0 ? String(next.length) : '');
  };

  // Debounce Input 1 for fetch/auto-select; sync immediately when card checkbox changes count
  useEffect(() => {
    if (bulkSelectionFromCheckboxRef.current) {
      setDebouncedBulkCount(input1Value);
      bulkSelectionFromCheckboxRef.current = false;
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setDebouncedBulkCount(input1Value);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [input1Value]);

  // Auto-select first N lead cards from debounced count (abort prior request)
  useEffect(() => {
    if (bulkMode !== 'bulkrefer' && bulkMode !== 'bulkaction' && bulkMode !== 'whatsapp') {
      return undefined;
    }

    if (!leads || leads.length === 0) {
      return undefined;
    }

    const numValue = debouncedBulkCount === '' ? 0 : parseInt(debouncedBulkCount, 10);

    if (isNaN(numValue) || numValue < 1) {
      setSelectedProfiles([]);
      return undefined;
    }

    const totalAvailableLeads = getBulkSelectableLeadCount();
    const validNumValue = Math.min(numValue, totalAvailableLeads);
    const fetchLimit = Math.max(validNumValue, totalAvailableLeads);
    const controller = new AbortController();

    const applyBulkSelection = (leadsList) => {
      const availableLeads = leadsList.slice(0, fetchLimit);

      // Manual checkbox: keep user selection (prune missing ids only)
      if (bulkSelectionModeRef.current === 'manual') {
        const available = new Set(availableLeads.map((lead) => String(lead._id)));
        setSelectedProfiles((prev) =>
          (prev || []).filter((id) => available.has(String(id)))
        );
        return;
      }

      // Count-driven: check first N card checkboxes
      setSelectedProfiles(availableLeads.slice(0, validNumValue).map((lead) => lead._id));
    };

    const fetchLeadsForSelection = async () => {
      if (!token) return;
      try {
        const eff = { ...filters };
        const params = {
          page: 1,
          limit: fetchLimit.toString(),
          ...(isDuplicateMobileFilter(selectedStatusFilter)
            ? { isDuplicateMobile: true }
            : selectedStatusFilter
              ? { status: selectedStatusFilter }
              : {})
        };
        appendLeadFilterParams(params, eff);

        const response = await axios.get(`${backendUrl}/college/b2b/leads`, {
          headers: { 'x-auth': token },
          params,
          signal: controller.signal
        });

        if (controller.signal.aborted) return;
        if (response.data.status && response.data.data.leads) {
          applyBulkSelection(response.data.data.leads);
        }
      } catch (error) {
        if (
          controller.signal.aborted ||
          error?.name === 'CanceledError' ||
          error?.code === 'ERR_CANCELED'
        ) {
          return;
        }
        console.error('Error fetching leads for selection:', error);
        applyBulkSelection(leads);
      }
    };

    if (fetchLimit > leads.length && fetchLimit > 0) {
      fetchLeadsForSelection();
    } else {
      applyBulkSelection(leads);
    }

    return () => controller.abort();
  }, [debouncedBulkCount, bulkMode, leads, totalLeads, pageSize, statusCounts, duplicateMobileCount, filters, selectedStatusFilter, token]);

  // If Performance tab changes while bulk mode is open, clamp Input 1 to the new tab count
  useEffect(() => {
    if (bulkMode !== 'bulkrefer' && bulkMode !== 'bulkaction' && bulkMode !== 'whatsapp') {
      return;
    }
    if (input1Value === '') return;
    const maxValue = getBulkSelectableLeadCount();
    const numValue = parseInt(input1Value, 10);
    if (!isNaN(numValue) && numValue > maxValue) {
      bulkSelectionModeRef.current = 'count';
      setInput1Value(maxValue > 0 ? String(maxValue) : '');
    }
  }, [selectedStatusFilter, pageSize, statusCounts, duplicateMobileCount, totalLeads, bulkMode]);

  // Only clear dashboard drill-down chips (Done/Planned/Missed).
  // Keep modal filters like hasFollowUpCall / hasFollowUpVisit intact.
  const getDashSubFiltersCleared = (base = filtersRef.current) => ({
    ...base,
    followUpCallBucket: '',
    followUpVisitBucket: '',
    documentsStatus: [],
  });

  // Handle status card click (Performance: HOT, WARM, etc.)
  const handleStatusCardClick = (statusId) => {
    setSelectedStatusFilter(statusId);
    setSelectedApprovalStatus(null);
    const next = getDashSubFiltersCleared();
    syncFiltersRef(next);
    setFilters(next);
    setCurrentPage(1);
    fetchLeads(statusId, 1, getLeadFetchOverrides({ ...next, approvalStatus: null }));
  };

  const hasActiveFollowupFilter = Boolean(
    filters.followUpCallBucket || filters.followUpVisitBucket
  );

  const hasAnyActiveFilters = () => {
    const f = filters;
    return Boolean(
      f.search
      || f.b2bProject
      || f.b2bDepartment
      || (Array.isArray(f.leadCategory) && f.leadCategory.length)
      || (Array.isArray(f.typeOfB2B) && f.typeOfB2B.length)
      || (Array.isArray(f.leadOwner) && f.leadOwner.length)
      || f.followUpCallBucket
      || f.followUpVisitBucket
      || f.hasFollowUpCall === true
      || f.hasFollowUpCall === false
      || f.hasFollowUpVisit === true
      || f.hasFollowUpVisit === false
      || (Array.isArray(f.documentsStatus) && f.documentsStatus.length)
      || f.dateRange?.start
      || f.dateRange?.end
      || f.modifiedDateRange?.start
      || f.modifiedDateRange?.end
      || f.nextActionDateRange?.start
      || f.nextActionDateRange?.end
      || (Array.isArray(f.status) && f.status.length)
      || (Array.isArray(f.subStatus) && f.subStatus.length)
      || selectedStatusFilter
      || selectedApprovalStatus
      || leadViewTab === 'myRefer'
      || leadViewTab === 'noFollowup'
    );
  };

  const resetHeaderDateFilterState = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setHeaderDatePreset('');
    setHeaderDateFrom(today);
    setHeaderDateTo(today);
    setShowHeaderDateRangePicker(false);
  };

  const toDateInputValue = (date) => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const parseDateInputValue = (value) => {
    if (!value) return null;
    if (value instanceof Date) {
      const d = new Date(value);
      d.setHours(0, 0, 0, 0);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const showAllLeads = () => {
    setLeadViewTab('all');
    setSelectedStatusFilter(null);
    setSelectedApprovalStatus(null);
    resetHeaderDateFilterState();
    const cleared = {
      search: '',
      leadCategory: [],
      b2bProject: '',
      b2bDepartment: '',
      typeOfB2B: [],
      leadOwner: [],
      hasFollowUpCall: '',
      hasFollowUpVisit: '',
      followUpCallBucket: '',
      followUpVisitBucket: '',
      documentsStatus: [],
      dateRange: { start: null, end: null },
      modifiedDateRange: { start: null, end: null },
      nextActionDateRange: { start: null, end: null },
      status: [],
      subStatus: []
    };
    syncFiltersRef(cleared);
    setFilters(cleared);
    setCurrentPage(1);
    fetchLeads(null, 1, { ...cleared, approvalStatus: null });
    fetchStatusCounts(cleared);
    fetchApprovalCounts(cleared);
  };

  const clearFollowupDashFilters = () => {
    setSelectedStatusFilter(null);
    setSelectedApprovalStatus(null);
    const next = getDashSubFiltersCleared();
    syncFiltersRef(next);
    setFilters(next);
    setCurrentPage(1);
    fetchLeads(null, 1, getLeadFetchOverrides({ ...next, approvalStatus: null }));
    fetchStatusCounts(next);
    fetchApprovalCounts(next);
  };

  // Handle total card click (show all leads for current header filters)
  const handleTotalCardClick = () => {
    clearFollowupDashFilters();
  };

  const syncFiltersRef = (next) => {
    filtersRef.current = next;
    return next;
  };

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => syncFiltersRef({
      ...prev,
      [key]: value
    }));
  };

  const toCsv = (arr) => (Array.isArray(arr) ? arr.filter(Boolean).join(',') : '');

  // Strip only dash drill-downs when computing status/approval totals.
  // Modal Yes/No followup filters should still apply to those counts.
  const stripDashboardSubFilters = (eff) => ({
    ...eff,
    followUpCallBucket: '',
    followUpVisitBucket: '',
    documentsStatus: [],
  });

  const appendLeadFilterParams = (params, eff, options = {}) => {
    if (eff.search) params.search = eff.search;
    if (Array.isArray(eff.leadCategory) && eff.leadCategory.length) {
      params.leadCategoryIn = toCsv(eff.leadCategory);
    }
    if (eff.b2bProject) params.b2bProject = eff.b2bProject;
    if (eff.b2bDepartment) params.b2bDepartment = eff.b2bDepartment;
    if (Array.isArray(eff.typeOfB2B) && eff.typeOfB2B.length) {
      params.typeOfB2BIn = toCsv(eff.typeOfB2B);
    }
    if (Array.isArray(eff.leadOwner) && eff.leadOwner.length) {
      params.leadOwnerIn = toCsv(eff.leadOwner);
    }
    if (eff.dateRange?.start) params.startDate = eff.dateRange.start;
    if (eff.dateRange?.end) params.endDate = eff.dateRange.end;
    if (eff.modifiedDateRange?.start) params.modifiedFromDate = eff.modifiedDateRange.start;
    if (eff.modifiedDateRange?.end) params.modifiedToDate = eff.modifiedDateRange.end;
    if (eff.nextActionDateRange?.start) params.nextActionFromDate = eff.nextActionDateRange.start;
    if (eff.nextActionDateRange?.end) params.nextActionToDate = eff.nextActionDateRange.end;
    if (Array.isArray(eff.status) && eff.status.length) params.statusIn = toCsv(eff.status);
    if (Array.isArray(eff.subStatus) && eff.subStatus.length) params.subStatusIn = toCsv(eff.subStatus);
    if (eff.hasFollowUpCall === true || eff.hasFollowUpCall === 'yes') params.hasFollowUpCall = true;
    else if (eff.hasFollowUpCall === false || eff.hasFollowUpCall === 'no') params.hasFollowUpCall = false;
    if (eff.hasFollowUpVisit === true || eff.hasFollowUpVisit === 'yes') params.hasFollowUpVisit = true;
    else if (eff.hasFollowUpVisit === false || eff.hasFollowUpVisit === 'no') params.hasFollowUpVisit = false;
    if (eff.followUpCallBucket) params.followUpCallBucket = eff.followUpCallBucket;
    if (eff.followUpVisitBucket) params.followUpVisitBucket = eff.followUpVisitBucket;
    if (Array.isArray(eff.documentsStatus) && eff.documentsStatus.length) {
      params.documentsStatusIn = toCsv(eff.documentsStatus);
    }
    if (!options.skipApprovalStatus) {
      const approval = eff.approvalStatus ?? selectedApprovalStatusRef.current;
      if (approval) params.approvalStatus = approval;
    }
    if (eff.referredByMe === true || eff.referredByMe === 'true') {
      params.referredByMe = true;
    }
    return params;
  };

  const handleFollowupDashClick = (type, bucket) => {
    const filterKey = type === 'Visit' ? 'followUpVisitBucket' : 'followUpCallBucket';
    const next = getDashSubFiltersCleared();
    const togglingOff = filtersRef.current[filterKey] === bucket;
    next[filterKey] = togglingOff ? '' : bucket;
    if (!togglingOff) {
      setSelectedStatusFilter(null);
      setSelectedApprovalStatus(null);
    }
    syncFiltersRef(next);
    setFilters(next);
    setCurrentPage(1);
    const overrides = getLeadFetchOverrides({ ...next, approvalStatus: null });
    fetchLeads(null, 1, overrides);
  };

  const isFollowupDashSelected = (type, bucket) => {
    const filterKey = type === 'Visit' ? 'followUpVisitBucket' : 'followUpCallBucket';
    return filters[filterKey] === bucket;
  };

  const handleCycleFilterChange = (key, value) => {
    const next = { ...filters };
    if (key === 'b2bDepartment') {
      next.b2bDepartment = value;
      next.b2bProject = '';
      next.typeOfB2B = [];
    } else if (key === 'b2bProject') {
      next.b2bProject = value;
      next.typeOfB2B = [];
    } else if (key === 'typeOfB2B') {
      next.typeOfB2B = value ? [value] : [];
    } else if (key === 'leadOwner') {
      next.leadOwner = value ? [value] : [];
    }
    setFilters(syncFiltersRef(next));
    setCurrentPage(1);
    fetchLeads(selectedStatusFilter, 1, getLeadFetchOverrides(next));
    if (leadViewTab === 'all') {
      fetchStatusCounts(next);
      fetchApprovalCounts(next);
    }
  };

  const renderCycleFilterDropdowns = (mobile = false) => (
    <div className={`b2b-cycle-filters${mobile ? ' b2b-cycle-filters--mobile' : ''}`}>
      <div className="b2b-cycle-filters__item">
        <label className="b2b-cycle-filters__label" htmlFor="cycle-filter-department">
          <i className="fas fa-sitemap" aria-hidden="true" /> Department
        </label>
        <select
          id="cycle-filter-department"
          className="b2b-cycle-filters__select"
          value={filters.b2bDepartment || ''}
          onChange={(e) => handleCycleFilterChange('b2bDepartment', e.target.value)}
        >
          <option value="">All</option>
          {allB2bDepartments.map((dept) => (
            <option key={dept._id} value={dept._id}>{dept.name}</option>
          ))}
        </select>
      </div>
      <div className="b2b-cycle-filters__item">
        <label className="b2b-cycle-filters__label" htmlFor="cycle-filter-project">
          <i className="fas fa-project-diagram" aria-hidden="true" /> Project
        </label>
        <select
          id="cycle-filter-project"
          className="b2b-cycle-filters__select"
          value={filters.b2bProject || ''}
          onChange={(e) => handleCycleFilterChange('b2bProject', e.target.value)}
        >
          <option value="">All</option>
          {cycleProjectOptions.map((proj) => (
            <option key={proj._id} value={proj._id}>{proj.name}</option>
          ))}
        </select>
      </div>
      <div className="b2b-cycle-filters__item">
        <label className="b2b-cycle-filters__label" htmlFor="cycle-filter-type">
          <i className="fas fa-building" aria-hidden="true" /> Type
        </label>
        <select
          id="cycle-filter-type"
          className="b2b-cycle-filters__select"
          value={(filters.typeOfB2B && filters.typeOfB2B[0]) || ''}
          onChange={(e) => handleCycleFilterChange('typeOfB2B', e.target.value)}
        >
          <option value="">All</option>
          {cycleTypeOfB2BOptions.map((type) => (
            <option key={type._id} value={type._id}>{type.name}</option>
          ))}
        </select>
      </div>
      <div className="b2b-cycle-filters__item">
        <label className="b2b-cycle-filters__label" htmlFor="cycle-filter-counsellor">
          <i className="fas fa-user-tie" aria-hidden="true" /> Counsellor
        </label>
        <select
          id="cycle-filter-counsellor"
          className="b2b-cycle-filters__select"
          value={(filters.leadOwner && filters.leadOwner[0]) || ''}
          onChange={(e) => handleCycleFilterChange('leadOwner', e.target.value)}
        >
          <option value="">All</option>
          {(users || []).map((u) => (
            <option key={u._id} value={u._id}>{u.name || u.email || 'User'}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const handleDateRangeChange = (rangeKey, type, value) => {
    setFilters((prev) => {
      const nextRange = {
        ...(prev[rangeKey] || {}),
        [type]: value || null
      };
      if (rangeKey === 'dateRange') {
        const start = type === 'start' ? (value || null) : nextRange.start;
        const end = type === 'end' ? (value || null) : nextRange.end;
        if (start || end) {
          setHeaderDatePreset('custom');
          const parsedStart = parseDateInputValue(start);
          const parsedEnd = parseDateInputValue(end);
          if (parsedStart) setHeaderDateFrom(parsedStart);
          if (parsedEnd) setHeaderDateTo(parsedEnd);
        } else {
          resetHeaderDateFilterState();
        }
      }
      return syncFiltersRef({
        ...prev,
        [rangeKey]: nextRange
      });
    });
  };

  const applyHeaderLeadCreationDateFilter = (from, to, preset) => {
    const start = toDateInputValue(from);
    const end = toDateInputValue(to);
    const fromDate = parseDateInputValue(from) || new Date();
    const toDate = parseDateInputValue(to) || new Date();
    setHeaderDatePreset(preset);
    setHeaderDateFrom(fromDate);
    setHeaderDateTo(toDate);
    const next = syncFiltersRef({
      ...filtersRef.current,
      dateRange: { start, end }
    });
    setFilters(next);
    setCurrentPage(1);
    fetchLeads(selectedStatusFilter, 1, getLeadFetchOverrides(next));
    if (leadViewTab === 'all') {
      fetchStatusCounts(next);
      fetchApprovalCounts(next);
    }
  };

  const handleHeaderDateReset = () => {
    resetHeaderDateFilterState();
    const next = syncFiltersRef({
      ...filtersRef.current,
      dateRange: { start: null, end: null }
    });
    setFilters(next);
    setCurrentPage(1);
    fetchLeads(selectedStatusFilter, 1, getLeadFetchOverrides(next));
    if (leadViewTab === 'all') {
      fetchStatusCounts(next);
      fetchApprovalCounts(next);
    }
  };

  const handleHeaderDatePreset = (preset) => {
    if (preset !== 'custom' && headerDatePreset === preset) {
      handleHeaderDateReset();
      return;
    }

    if (preset === 'custom') {
      setHeaderDatePreset('custom');
      setShowHeaderDateRangePicker((prev) => !prev);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let from = new Date(today);
    let to = new Date(today);

    if (preset === 'yesterday') {
      from.setDate(from.getDate() - 1);
      to.setDate(to.getDate() - 1);
    } else if (preset === 'prev3days') {
      from.setDate(from.getDate() - 2);
    } else if (preset === 'thisMonth') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    setShowHeaderDateRangePicker(false);
    applyHeaderLeadCreationDateFilter(from, to, preset);
  };

  const handleHeaderCustomDateApply = () => {
    if (!headerDateFrom || !headerDateTo) return;
    applyHeaderLeadCreationDateFilter(headerDateFrom, headerDateTo, 'custom');
    setShowHeaderDateRangePicker(false);
  };

  useEffect(() => {
    if (!showHeaderDateRangePicker) return undefined;
    const handleClickOutside = (e) => {
      if (e.target.closest('.adm-header-date-range')) return;
      if (e.target.closest('.react-calendar')) return;
      if (e.target.closest('.react-date-picker__calendar')) return;
      setShowHeaderDateRangePicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHeaderDateRangePicker]);

  const renderHeaderDateRangeFilter = (compact = false) => (
    <div
      className={`adm-header-date-range${compact ? ' adm-header-date-range--compact' : ''}`}
    >
      <div className="adm-header-date-range__pills">
        {[
          { id: 'today', label: 'Today' },
          { id: 'yesterday', label: 'Yesterday' },
          { id: 'prev3days', label: compact ? '3 Days' : 'Previous 3 days' },
          { id: 'thisMonth', label: 'This Month' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            className={`adm-header-date-range__pill${headerDatePreset === item.id ? ' adm-header-date-range__pill--active' : ''}`}
            onClick={() => handleHeaderDatePreset(item.id)}
          >
            {item.label}
          </button>
        ))}
        <div className="adm-header-date-range__custom-wrap">
          <button
            type="button"
            className={`adm-header-date-range__pill adm-header-date-range__pill--range${headerDatePreset === 'custom' ? ' adm-header-date-range__pill--active' : ''}`}
            onClick={() => handleHeaderDatePreset('custom')}
          >
            <i className="fas fa-calendar-alt me-1" aria-hidden="true" />
            Date Range
            <i
              className={`fas fa-chevron-${showHeaderDateRangePicker ? 'up' : 'down'} ms-1`}
              style={{ fontSize: '9px' }}
              aria-hidden="true"
            />
          </button>
          {showHeaderDateRangePicker && (
            <div className="adm-header-date-range__dropdown">
              <div className="adm-header-date-range__dropdown-title">Date Range</div>
              <div className="adm-header-date-range__inputs row g-2">
                <div className="col-6">
                  <label className="form-label small mb-1">From</label>
                  <div className="adm-header-date-range__date-display">
                    {headerDateFrom ? moment(headerDateFrom).format('DD/MM/YYYY') : '—'}
                  </div>
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1">To</label>
                  <div className="adm-header-date-range__date-display">
                    {headerDateTo ? moment(headerDateTo).format('DD/MM/YYYY') : '—'}
                  </div>
                </div>
              </div>
              <div className="adm-header-date-range__calendars-row">
                <div className="adm-header-date-range__calendar-col">
                  <Calendar
                    onChange={(date) => {
                      setHeaderDateFrom(date);
                      setHeaderDatePreset('custom');
                      if (date && headerDateTo && date > headerDateTo) {
                        setHeaderDateTo(date);
                      }
                    }}
                    value={headerDateFrom}
                    maxDate={headerDateTo || new Date()}
                    className="adm-header-date-range__calendar"
                  />
                </div>
                <div className="adm-header-date-range__calendar-col">
                  <Calendar
                    onChange={(date) => {
                      setHeaderDateTo(date);
                      setHeaderDatePreset('custom');
                      if (date && headerDateFrom && date < headerDateFrom) {
                        setHeaderDateFrom(date);
                      }
                    }}
                    value={headerDateTo}
                    minDate={headerDateFrom}
                    maxDate={new Date()}
                    className="adm-header-date-range__calendar"
                  />
                </div>
              </div>
              {(headerDateFrom || headerDateTo) && (
                <div className="adm-header-date-range__selected small mt-2">
                  <i className="fas fa-info-circle me-1" aria-hidden="true" />
                  {headerDateFrom && moment(headerDateFrom).format('DD MMM YYYY')}
                  {headerDateFrom && headerDateTo && ' — '}
                  {headerDateTo && moment(headerDateTo).format('DD MMM YYYY')}
                </div>
              )}
              <button
                type="button"
                className="btn btn-sm w-100 mt-2 adm-header-date-range__apply-btn"
                onClick={handleHeaderCustomDateApply}
                disabled={!headerDateFrom || !headerDateTo}
              >
                Apply
              </button>
            </div>
          )}
        </div>
        {(headerDatePreset || filters.dateRange?.start || filters.dateRange?.end) && (
          <button
            type="button"
            className="adm-header-date-range__pill adm-header-date-range__pill--clear"
            onClick={handleHeaderDateReset}
            title="Clear date filter"
          >
            <i className="fas fa-times me-1" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>
    </div>
  );

  const applyFilters = (filterOverrides = {}) => {
    const merged = syncFiltersRef({ ...filtersRef.current, ...filterOverrides });
    setCurrentPage(1);
    fetchLeads(selectedStatusFilter, 1, getLeadFetchOverrides(merged));
    if (leadViewTab === 'all') {
      fetchStatusCounts(merged);
      fetchApprovalCounts(merged);
    }
  };

  const clearFilters = () => {
    resetHeaderDateFilterState();
    const cleared = {
      search: '',
      leadCategory: [],
      b2bProject: '',
      b2bDepartment: '',
      typeOfB2B: [],
      leadOwner: [],
      hasFollowUpCall: '',
      hasFollowUpVisit: '',
      followUpCallBucket: '',
      followUpVisitBucket: '',
      documentsStatus: [],
      dateRange: {
        start: null,
        end: null
      },
      modifiedDateRange: {
        start: null,
        end: null
      },
      nextActionDateRange: {
        start: null,
        end: null
      },
      status: [],
      subStatus: []
    };
    syncFiltersRef(cleared);
    setFilters(cleared);
    setCurrentPage(1);
    fetchLeads(selectedStatusFilter, 1, getLeadFetchOverrides(cleared));
    if (leadViewTab === 'all') {
      fetchStatusCounts(cleared);
      fetchApprovalCounts(cleared);
    }
  };

  const fetchAiLeadIntel = async (fetchedLeads) => {
    if (!Array.isArray(fetchedLeads) || fetchedLeads.length === 0) {
      setAiLeadIntelLoading(false);
      return;
    }

    try {
      setAiLeadIntelLoading(true);
      const aiRes = await axios.post(
        `${backendUrl}/api/ai/lead-intel/bulk`,
        { leads: fetchedLeads },
        { headers: { 'x-auth': token } }
      );
      if (aiRes?.data?.success && aiRes?.data?.data) {
        setAiLeadIntelById((prev) => ({ ...prev, ...(aiRes.data.data || {}) }));
      }
    } catch (aiErr) {
      setAiLeadIntelError(aiErr?.response?.data?.message || 'AI lead supervision unavailable.');
    } finally {
      setAiLeadIntelLoading(false);
    }
  };

  const fetchLeads = async (statusFilter = null, page = 1, filterOverrides = {}) => {
    const requestId = ++fetchLeadsRequestRef.current;

    try {
      // Keep open WhatsApp chat when refreshing the inbox list
      if (showPanelRef.current && showPanelRef.current !== 'Whatsapp') {
        closePanel();
      }
      setLoadingLeads(true);
      setAiLeadIntelError('');

      const eff = { ...filtersRef.current, ...filterOverrides };

      // Build query parameters
      const params = {
        page: page,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        limit: 20,
      };

      if (isDuplicateMobileFilter(statusFilter)) {
        params.isDuplicateMobile = true;
      } else if (statusFilter) {
        params.status = statusFilter;
      }

      appendLeadFilterParams(params, eff);

      const response = await axios.get(`${backendUrl}/college/b2b/leads`, {
        headers: { 'x-auth': token },
        params: params
      });

      if (requestId !== fetchLeadsRequestRef.current) return;

      if (response.data.status) {
        const fetchedLeads = response.data.data.leads || [];

        setLeads(fetchedLeads);
        fetchAiLeadIntel(fetchedLeads);
        // ✅ Extract pagination data from backend response
        if (response.data.data.pagination) {
          setTotalPages(response.data.data.pagination.totalPages || 1);
          setCurrentPage(response.data.data.pagination.currentPage || 1);
          setPageSize(response.data.data.pagination.totalLeads || 0);
        }
      } else {
        console.error('❌ [FRONTEND] Failed to fetch leads:', response.data.message);
      }
    } catch (error) {
      if (requestId !== fetchLeadsRequestRef.current) return;
      console.error('Error fetching leads:', error);
    } finally {
      if (requestId === fetchLeadsRequestRef.current) {
        setLoadingLeads(false);
      }
    }
  };

  // Fetch status counts
  const fetchStatusCounts = async (filterOverrides = {}) => {
    try {
      setLoadingStatusCounts(true);
      const eff = stripDashboardSubFilters({ ...filtersRef.current, ...filterOverrides });
      const params = {};
      appendLeadFilterParams(params, eff);

      const response = await axios.get(`${backendUrl}/college/b2b/leads/status-count`, {
        headers: { 'x-auth': token },
        params: params
      });

      if (response.data.status) {
        setStatusCounts(response.data.data.statusCounts || []);
        setTotalLeads(response.data.data.totalLeads || 0);
        setDuplicateMobileCount(response.data.data.duplicateMobileCount || 0);
        const fc = response.data.data.followupDashboardCounts;
        if (fc?.call && fc?.visit) {
          setFollowupDashboardCounts(fc);
        }
      } else {
        console.error('Failed to fetch status counts:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching status counts:', error);
    } finally {
      setLoadingStatusCounts(false);
    }
  };

  const getPerformanceExportMeta = () => {
    const count = getBulkSelectableLeadCount();
    if (isDuplicateMobileFilter(selectedStatusFilter)) {
      return { label: 'DUPLICATE', count, statusId: null, isDuplicateMobile: true };
    }
    if (selectedStatusFilter) {
      const status = (statusCounts || []).find(
        (s) => String(s.statusId) === String(selectedStatusFilter)
      );
      const label = String(status?.statusName || 'Status').toUpperCase().replace(/\s+/g, '_');
      return { label, count, statusId: selectedStatusFilter, isDuplicateMobile: false };
    }
    return { label: 'ALL', count, statusId: null, isDuplicateMobile: false };
  };

  const downloadPerformanceLeads = async () => {
    if (!token || downloadingPerformanceLeads) return;

    const { label, count, statusId, isDuplicateMobile } = getPerformanceExportMeta();
    if (!count || count < 1) {
      alert('No leads available to download for this Performance tab.');
      return;
    }

    setDownloadingPerformanceLeads(true);
    try {
      const eff = { ...filtersRef.current };
      const batchSize = 500;
      const allLeads = [];
      let page = 1;
      let totalFromApi = count;

      while (allLeads.length < totalFromApi) {
        const remaining = totalFromApi - allLeads.length;
        const params = {
          page,
          limit: Math.min(batchSize, remaining),
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        };
        if (isDuplicateMobile) params.isDuplicateMobile = true;
        else if (statusId) params.status = statusId;
        appendLeadFilterParams(params, eff);

        const response = await axios.get(`${backendUrl}/college/b2b/leads`, {
          headers: { 'x-auth': token },
          params,
        });

        if (!response.data?.status) {
          throw new Error(response.data?.message || 'Failed to fetch leads for download');
        }

        const batch = response.data.data?.leads || [];
        const paginationTotal = response.data.data?.pagination?.totalLeads;
        if (typeof paginationTotal === 'number' && paginationTotal >= 0) {
          totalFromApi = paginationTotal;
        }

        if (!batch.length) break;
        allLeads.push(...batch);
        if (batch.length < params.limit) break;
        page += 1;
        if (page > 200) break;
      }

      if (!allLeads.length) {
        alert('No leads available to download for this Performance tab.');
        return;
      }

      const rows = allLeads.map((lead) => ({
        'Business Name': lead.businessName || '',
        'Concern Person Name': lead.concernPersonName || '',
        Mobile: lead.mobile || '',
        Email: lead.email || '',
        WhatsApp: lead.whatsapp || '',
        'Landline Number': lead.landlineNumber || '',
        Designation: lead.designation || '',
        Address: lead.address || '',
        City: lead.city || '',
        State: lead.state || '',
        'B2B Department': getLeadB2bDepartmentName(lead),
        'B2B Project': getLeadB2bProjectName(lead),
        'Type of B2B': lead.typeOfB2B?.name || '',
        'Lead Source': lead.leadCategory?.name || '',
        Performance: lead.status?.title || lead.status?.name || '',
        'Sub Status': getLeadSubStatusTitle(lead) || '',
        'Lead Ranking': lead.leadRanking?.name || '',
        Counsellor: lead.leadOwner?.name || '',
        'Co-owner': lead.leadCoOwner?.name || '',
        'Added By': lead.leadAddedBy?.name || '',
        Remark: lead.remark || '',
        'Created At': lead.createdAt ? moment(lead.createdAt).format('YYYY-MM-DD HH:mm') : '',
        'Updated At': lead.updatedAt ? moment(lead.updatedAt).format('YYYY-MM-DD HH:mm') : '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');
      const dateStamp = moment().format('YYYY-MM-DD');
      XLSX.writeFile(wb, `b2b_leads_${label}_${dateStamp}.xlsx`);
    } catch (error) {
      console.error('Error downloading performance leads:', error);
      alert(error.response?.data?.message || error.message || 'Failed to download leads. Please try again.');
    } finally {
      setDownloadingPerformanceLeads(false);
    }
  };

  const isAdmin = () => {
    const permissionType = permissions?.permission_type || userData?.permissions?.permission_type;
    return permissionType === 'Admin';
  };

  const fetchApprovalCounts = async (filterOverrides = {}) => {
    try {
      setApprovalCountsLoading(true);
      const eff = stripDashboardSubFilters({ ...filtersRef.current, ...filterOverrides });
      const baseParams = {};
      appendLeadFilterParams(baseParams, eff, { skipApprovalStatus: true });

      const [allRes, approvedRes, pendingRes, rejectedRes] = await Promise.all([
        axios.get(`${backendUrl}/college/b2b/leads/status-count`, { headers: { 'x-auth': token }, params: baseParams }),
        axios.get(`${backendUrl}/college/b2b/leads/status-count`, { headers: { 'x-auth': token }, params: { ...baseParams, approvalStatus: 'APPROVED' } }),
        axios.get(`${backendUrl}/college/b2b/leads/status-count`, { headers: { 'x-auth': token }, params: { ...baseParams, approvalStatus: 'PENDING' } }),
        axios.get(`${backendUrl}/college/b2b/leads/status-count`, { headers: { 'x-auth': token }, params: { ...baseParams, approvalStatus: 'REJECTED' } }),
      ]);

      const safeApproved = approvedRes?.data?.status ? (approvedRes.data.data?.totalLeads || 0) : 0;
      const safePending = pendingRes?.data?.status ? (pendingRes.data.data?.totalLeads || 0) : 0;
      const safeRejected = rejectedRes?.data?.status ? (rejectedRes.data.data?.totalLeads || 0) : 0;
      const safeTotal = allRes?.data?.status
        ? (allRes.data.data?.totalLeads || 0)
        : (safeApproved + safePending + safeRejected);

      setApprovalCounts({ total: safeTotal, approved: safeApproved, pending: safePending, rejected: safeRejected });
    } catch (error) {
      console.error('Error fetching approval counts:', error);
    } finally {
      setApprovalCountsLoading(false);
    }
  };

  const handleApprovalCardClick = (nextStatus) => {
    setSelectedApprovalStatus(nextStatus);
    setSelectedStatusFilter(null);
    const next = getDashSubFiltersCleared();
    syncFiltersRef(next);
    setFilters(next);
    setCurrentPage(1);
    fetchLeads(null, 1, getLeadFetchOverrides({ ...next, approvalStatus: nextStatus }));
    if (leadViewTab === 'all') {
      fetchStatusCounts({ approvalStatus: nextStatus });
    }
  };

  const applyApprovalResponseToLead = (leadId, updatedLead) => {
    if (!updatedLead?._id) return;
    setLeads((prev) =>
      Array.isArray(prev)
        ? prev.map((l) => (l?._id === leadId ? { ...l, ...updatedLead, status: updatedLead.status ?? l.status, subStatus: updatedLead.subStatus ?? l.subStatus } : l))
        : prev
    );
  };

  const approveLead = async (lead) => {
    try {
      const res = await axios.put(
        `${backendUrl}/college/b2b/leads/${lead._id}/approval`,
        { status: 'APPROVED' },
        { headers: { 'x-auth': token } }
      );
      if (res?.data?.status) {
        setApprovalEditLeadId(null);
        setCrossSaleCache({});
        applyApprovalResponseToLead(lead._id, res.data.data);
        await fetchLeads(selectedStatusFilter, currentPage, getLeadFetchOverrides());
        await fetchStatusCounts();
        await fetchApprovalCounts();
        alert('Lead approved successfully');
      } else {
        alert(res?.data?.message || 'Failed to approve lead');
      }
    } catch (error) {
      console.error('Error approving lead:', error);
      alert(error.response?.data?.message || 'Failed to approve lead');
    }
  };

  const rejectLead = async (lead, reason) => {
    try {
      const res = await axios.put(
        `${backendUrl}/college/b2b/leads/${lead._id}/approval`,
        { status: 'REJECTED', rejectionReason: reason || '' },
        { headers: { 'x-auth': token } }
      );
      if (res?.data?.status) {
        setApprovalEditLeadId(null);
        setCrossSaleCache({});
        applyApprovalResponseToLead(lead._id, res.data.data);
        await fetchLeads(selectedStatusFilter, currentPage, getLeadFetchOverrides());
        await fetchStatusCounts();
        await fetchApprovalCounts();
        alert('Lead rejected successfully');
      } else {
        alert(res?.data?.message || 'Failed to reject lead');
      }
    } catch (error) {
      console.error('Error rejecting lead:', error);
      alert(error.response?.data?.message || 'Failed to reject lead');
    }
  };

  const openLeadDocuments = async (lead) => {
    setDocumentsLead(lead);
    setShowLeadDocumentsModal(true);
    setLeadDocuments([]);
    setLeadCategoryDocuments([]);
    setLeadDocType('');
    setLeadDocFileSelected(false);
    if (leadDocFileRef.current) leadDocFileRef.current.value = '';

    try {
      setLeadDocumentsLoading(true);

      try {
        const catId =
          lead?.leadCategory?._id ||
          lead?.leadCategory ||
          lead?.leadCategoryId ||
          '';
        if (catId) {
          const catRes = await axios.get(`${backendUrl}/college/b2b/lead-categories/${catId}`, {
            headers: { 'x-auth': token }
          });
          if (catRes?.data?.status && catRes?.data?.data) {
            setLeadCategoryDocuments(catRes.data.data.documents || []);
          }
        }
      } catch (e) {
        console.error('Error fetching lead category documents:', e);
      }

      const res = await axios.get(`${backendUrl}/college/b2b/leads/${lead._id}/documents`, {
        headers: { 'x-auth': token }
      });
      if (res?.data?.status) {
        setLeadDocuments(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching lead documents:', error);
    } finally {
      setLeadDocumentsLoading(false);
    }
  };

  const uploadLeadDocument = async () => {
    if (!documentsLead?._id) return;
    const file = leadDocFileRef.current?.files?.[0];
    if (!file) {
      alert('Please select a file');
      return;
    }
    if (!String(leadDocType || '').trim()) {
      alert('Please select a Doc Type');
      return;
    }
    if ((leadCategoryDocuments || []).length) {
      const allowed = new Set((leadCategoryDocuments || []).map((d) => String(d?.name || '').trim()).filter(Boolean));
      if (!allowed.has(String(leadDocType || '').trim())) {
        alert('Please select a valid Doc Type from Lead Source documents');
        return;
      }
    }
    try {
      setLeadDocumentUploading(true);
      const form = new FormData();
      form.append('file', file);
      if (leadDocType) form.append('docType', leadDocType);

      const res = await axios.post(`${backendUrl}/college/b2b/leads/${documentsLead._id}/documents`, form, {
        headers: { 'x-auth': token }
      });
      if (res?.data?.status) {
        const listRes = await axios.get(`${backendUrl}/college/b2b/leads/${documentsLead._id}/documents`, {
          headers: { 'x-auth': token }
        });
        if (listRes?.data?.status) setLeadDocuments(listRes.data.data || []);
        setLeadDocType('');
        setLeadDocFileSelected(false);
        if (leadDocFileRef.current) leadDocFileRef.current.value = '';
      } else {
        alert(res?.data?.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading lead document:', error);
      alert(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setLeadDocumentUploading(false);
    }
  };

  const updateLeadDocumentStatus = async (docId, nextStatus) => {
    if (!documentsLead?._id || !docId) return;
    try {
      const res = await axios.put(
        `${backendUrl}/college/b2b/leads/${documentsLead._id}/documents/${docId}/status`,
        { status: nextStatus },
        { headers: { 'x-auth': token } }
      );
      if (res?.data?.status) {
        const listRes = await axios.get(`${backendUrl}/college/b2b/leads/${documentsLead._id}/documents`, {
          headers: { 'x-auth': token }
        });
        if (listRes?.data?.status) setLeadDocuments(listRes.data.data || []);
      } else {
        alert(res?.data?.message || 'Failed to update document status');
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      alert(error.response?.data?.message || 'Failed to update document status');
    }
  };

  // Check if user can update a lead
  const canUpdateLead = (lead) => {
    if (!lead || !userData?._id) return false;

    // Admin can always update - check both permissions state and userData
    const permissionType = permissions?.permission_type || userData?.permissions?.permission_type;
    if (permissionType === 'Admin') return true;

    // Check if user is the lead owner, co-owner, or lead added by
    const userId = userData._id;
    const leadAddedById = lead.leadAddedBy?._id || lead.leadAddedBy;
    const leadOwnerId = lead.leadOwner?._id || lead.leadOwner;
    const leadCoOwnerId = lead.leadCoOwner?._id || lead.leadCoOwner;

    return leadAddedById?.toString() === userId?.toString() ||
      leadOwnerId?.toString() === userId?.toString() ||
      leadCoOwnerId?.toString() === userId?.toString();
  };

  const canEditLeadDetails = (lead) => {
    if (!lead) return false;
    if (canEditLeadsB2B) return true;
    return canUpdateLead(lead);
  };

  // Update lead status
  const updateLeadStatus = async (leadId, statusData) => {
    try {
      // Get current status information for logging
      const currentStatus = selectedProfile?.status?.name || 'Unknown';
      const currentSubStatus = selectedProfile?.subStatus?.title || 'No Sub-Status';
      const newStatus = statuses.find(s => s._id === statusData.status)?.name || 'Unknown';
      const newSubStatus = subStatuses.find(s => s._id === statusData.subStatus)?.title || 'No Sub-Status';

      const response = await axios.put(`${backendUrl}/college/b2b/leads/${leadId}/status`, statusData, {
        headers: { 'x-auth': token }
      });

      if (response.data.status) {
        const updatedLead = response?.data?.data?.lead || response?.data?.data || null;

        if (updatedLead && updatedLead._id) {
          setLeads((prev) => {
            const next = Array.isArray(prev) ? prev.map((l) => (l?._id === updatedLead._id ? updatedLead : l)) : prev;

            // If user is filtering by a specific status, and the lead moved out of it, remove it.
            const filterId = selectedStatusFilter ? String(selectedStatusFilter) : '';
            const leadStatusId = updatedLead?.status?._id ? String(updatedLead.status._id) : (updatedLead?.status ? String(updatedLead.status) : '');
            if (filterId && leadStatusId && filterId !== leadStatusId) {
              return next.filter((l) => l?._id !== updatedLead._id);
            }
            return next;
          });
        }

        // Also update selectedProfile if it is this lead
        setSelectedProfile((prev) => (prev?._id === leadId && updatedLead ? updatedLead : prev));

        // Refresh the leads list + counts in background (source of truth)
        fetchLeads(selectedStatusFilter, currentPage, getLeadFetchOverrides());
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

  const buildLeadPayloadFromForm = () => {
    const leadData = {
      leadCategory: leadFormData.leadCategory,
      b2bProject: leadFormData.b2bProject,
      b2bDepartment: leadFormData.b2bDepartment,
      typeOfB2B: leadFormData.typeOfB2B,
      businessName: leadFormData.businessName,
      address: leadFormData.address,
      city: leadFormData.city,
      state: leadFormData.state,
      concernPersonName: leadFormData.concernPersonName,
      designation: leadFormData.designation,
      email: leadFormData.email,
      mobile: leadFormData.mobile,
      whatsapp: leadFormData.whatsapp,
      landlineNumber: leadFormData.landlineNumber,
      remark: leadFormData.remark
    };
    if (leadFormData.leadOwner && String(leadFormData.leadOwner).trim()) {
      leadData.leadOwner = String(leadFormData.leadOwner).trim();
    } else if (editingLeadId) {
      leadData.leadOwner = null;
    }
    if (leadFormData.leadCoOwner && String(leadFormData.leadCoOwner).trim()) {
      leadData.leadCoOwner = String(leadFormData.leadCoOwner).trim();
    } else if (editingLeadId) {
      leadData.leadCoOwner = null;
    }
    if (leadFormData.leadRanking && String(leadFormData.leadRanking).trim()) {
      leadData.leadRanking = String(leadFormData.leadRanking).trim();
    } else if (editingLeadId) {
      leadData.leadRanking = null;
    }
    if (selectedLocation) {
      leadData.coordinates = {
        type: 'Point',
        coordinates: [selectedLocation.lng, selectedLocation.lat]
      };
    } else if (leadFormData.longitude && leadFormData.latitude) {
      leadData.coordinates = {
        type: 'Point',
        coordinates: [leadFormData.longitude, leadFormData.latitude]
      };
    }
    return leadData;
  };

  // Handle lead form submission
  const handleLeadSubmit = async () => {
    if (!validateLeadForm()) {
      return;
    }

    setLoading(true);
    try {
      const leadData = buildLeadPayloadFromForm();

      if (editingLeadId) {
        const response = await axios.put(`${backendUrl}/college/b2b/leads/${editingLeadId}`, leadData, {
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json',
          }
        });

        if (response.data.status) {
          alert('Lead updated successfully!');
          await fetchLeads(selectedStatusFilter, currentPage, getLeadFetchOverrides());
          await fetchStatusCounts();
          await fetchApprovalCounts();
          handleCloseLeadModal();
        } else {
          alert(response.data.message || 'Failed to update lead');
        }
        return;
      }

      if (leadFormData.leadStatus) {
        leadData.status = leadFormData.leadStatus;
      }
      if (leadFormData.leadSubStatus) {
        leadData.subStatus = leadFormData.leadSubStatus;
      }

      const response = await axios.post(`${backendUrl}/college/b2b/add-lead`, leadData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.status) {
        // Show success message
        alert(
          response.data.isDuplicateMobile
            ? (response.data.message || 'Lead added successfully (duplicate mobile — also listed under Duplicate).')
            : 'Lead added successfully!'
        );

        // Refresh the leads list and status counts
        fetchLeads(null, 1);
        fetchStatusCounts();
        fetchApprovalCounts();

        // Reset form
        setLeadFormData({
          leadCategory: '',
          b2bProject: '',
          b2bDepartment: '',
          typeOfB2B: '',
          businessName: '',
          businessAddress: '',
          concernPersonName: '',
          address: '',
          city: '',
          state: '',
          designation: '',
          email: '',
          mobile: '',
          whatsapp: '',
          landlineNumber: '',
          leadOwner: '',
          leadCoOwner: '',
          leadStatus: '',
          leadSubStatus: '',
          leadRanking: '',
          remark: ''
        });
        setFormErrors({});
        setExtractedNumbers([]);
        setIsDuplicateMobile(false);
        setSelectedLocation(null);
        setShowMap(false);
        setAddLeadSubStatuses([]);

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

  const openEditLeadModal = (lead) => {
    if (!lead?._id) return;
    if (!canEditLeadDetails(lead)) {
      alert("You don't have permission to edit this lead.");
      return;
    }
    const coords = lead.coordinates?.coordinates;
    setEditingLeadId(lead._id);
    setLeadFormData({
      leadCategory: lead.leadCategory?._id || lead.leadCategory || '',
      b2bProject: lead.b2bProject?._id || lead.b2bProject || '',
      b2bDepartment: lead.b2bDepartment?._id || lead.b2bDepartment || '',
      typeOfB2B: lead.typeOfB2B?._id || lead.typeOfB2B || '',
      businessName: lead.businessName || '',
      businessAddress: '',
      concernPersonName: lead.concernPersonName || '',
      address: lead.address || '',
      city: lead.city || '',
      state: lead.state || '',
      latitude: coords?.[1] != null ? String(coords[1]) : '',
      longitude: coords?.[0] != null ? String(coords[0]) : '',
      designation: lead.designation || '',
      email: lead.email || '',
      mobile: lead.mobile || '',
      whatsapp: lead.whatsapp || '',
      landlineNumber: lead.landlineNumber || '',
      leadOwner: lead.leadOwner?._id || lead.leadOwner || '',
      leadCoOwner: lead.leadCoOwner?._id || lead.leadCoOwner || '',
      leadStatus: '',
      leadSubStatus: '',
      leadRanking: lead.leadRanking?._id || lead.leadRanking || '',
      remark: lead.remark || ''
    });
    if (coords?.[0] != null && coords?.[1] != null) {
      setSelectedLocation({ lat: coords[1], lng: coords[0] });
    } else {
      setSelectedLocation(null);
    }
    setFormErrors({});
    setExtractedNumbers([]);
    setShowMap(false);
    setAddLeadSubStatuses([]);
    setShowAddLeadModal(true);
  };

  // Close lead modal
  const handleCloseLeadModal = () => {
    setShowAddLeadModal(false);
    setEditingLeadId(null);
    setLeadFormData({
      leadCategory: '',
      b2bProject: '',
      b2bDepartment: '',
      typeOfB2B: '',
      businessName: '',
      businessAddress: '',
      concernPersonName: '',
      address: '',
      city: '',
      state: '',
      designation: '',
      email: '',
      mobile: '',
      whatsapp: '',
      landlineNumber: '',
      leadOwner: '',
      leadCoOwner: '',
      leadStatus: '',
      leadSubStatus: '',
      leadRanking: '',
      remark: ''
    });
    setFormErrors({});
    setExtractedNumbers([]);
    setIsDuplicateMobile(false);
    setSelectedLocation(null);
    setShowMap(false);
    setAddLeadSubStatuses([]);
  };

  // Open lead modal and initialize autocomplete
  const handleOpenLeadModal = () => {
    setEditingLeadId(null);
    const uid = userData?._id != null ? String(userData._id) : '';
    setLeadFormData({
      leadCategory: '',
      b2bProject: '',
      b2bDepartment: '',
      typeOfB2B: '',
      businessName: '',
      businessAddress: '',
      concernPersonName: '',
      address: '',
      city: '',
      state: '',
      latitude: '',
      longitude: '',
      designation: '',
      email: '',
      mobile: '',
      whatsapp: '',
      landlineNumber: '',
      leadOwner: uid,
      leadCoOwner: '',
      leadStatus: '',
      leadSubStatus: '',
      leadRanking: '',
      remark: ''
    });
    setFormErrors({});
    setExtractedNumbers([]);
    setSelectedLocation(null);
    setShowMap(false);
    setAddLeadSubStatuses([]);
    setShowAddLeadModal(true);
  };

  useEffect(() => {
    if (!showAddLeadModal || editingLeadId || !leadFormData.leadStatus) {
      if (!leadFormData.leadStatus || editingLeadId) {
        setAddLeadSubStatuses([]);
        setAddLeadSubStatusesLoading(false);
      }
      return;
    }
    let cancelled = false;
    setAddLeadSubStatusesLoading(true);
    axios
      .get(`${backendUrl}/college/statusB2b/${leadFormData.leadStatus}/substatus`, {
        headers: { 'x-auth': token }
      })
      .then((response) => {
        if (cancelled) return;
        if (response.data.success) {
          setAddLeadSubStatuses(Array.isArray(response.data.data) ? response.data.data : []);
        } else {
          setAddLeadSubStatuses([]);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Add lead: failed to load sub-statuses', err);
          setAddLeadSubStatuses([]);
        }
      })
      .finally(() => {
        if (!cancelled) setAddLeadSubStatusesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showAddLeadModal, editingLeadId, leadFormData.leadStatus, backendUrl, token]);

  useEffect(() => {
    if (!showBulkUploadModal || !bulkUploadFormData.leadStatus) {
      if (!bulkUploadFormData.leadStatus) {
        setBulkUploadSubStatuses([]);
        setBulkUploadSubStatusesLoading(false);
      }
      return;
    }
    let cancelled = false;
    setBulkUploadSubStatusesLoading(true);
    axios
      .get(`${backendUrl}/college/statusB2b/${bulkUploadFormData.leadStatus}/substatus`, {
        headers: { 'x-auth': token }
      })
      .then((response) => {
        if (cancelled) return;
        setBulkUploadSubStatuses(
          response.data.success && Array.isArray(response.data.data) ? response.data.data : []
        );
      })
      .catch(() => {
        if (!cancelled) setBulkUploadSubStatuses([]);
      })
      .finally(() => {
        if (!cancelled) setBulkUploadSubStatusesLoading(false);
      });
    return () => { cancelled = true; };
  }, [showBulkUploadModal, bulkUploadFormData.leadStatus, backendUrl, token]);

  const bulkUploadProjectOptions = useMemo(() => {
    if (!bulkUploadFormData.b2bDepartment) return [];
    return allB2bProjects.filter(
      (proj) => String(proj.department?._id || proj.department) === String(bulkUploadFormData.b2bDepartment)
    );
  }, [allB2bProjects, bulkUploadFormData.b2bDepartment]);

  const bulkUploadTypeOptions = useMemo(() => {
    if (!bulkUploadFormData.b2bDepartment) return [];
    return allTypeOfB2BRaw
      .filter((type) => String(type.department?._id || type.department) === String(bulkUploadFormData.b2bDepartment))
      .map((type) => ({ value: type._id, label: type.name }));
  }, [allTypeOfB2BRaw, bulkUploadFormData.b2bDepartment]);

  const handleBulkUploadInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'leadStatus') {
      setBulkUploadFormData((prev) => ({ ...prev, leadStatus: value, leadSubStatus: '' }));
    } else if (name === 'b2bDepartment') {
      setBulkUploadFormData((prev) => ({
        ...prev,
        b2bDepartment: value,
        b2bProject: '',
        typeOfB2B: '',
      }));
    } else if (name === 'b2bProject') {
      setBulkUploadFormData((prev) => ({ ...prev, b2bProject: value, typeOfB2B: '' }));
    } else {
      setBulkUploadFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (bulkUploadFormErrors[name]) {
      setBulkUploadFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateBulkUploadForm = () => {
    const errors = {};
    if (!bulkUploadFormData.leadCategory) errors.leadCategory = 'Lead source is required';
    if (!bulkUploadFormData.b2bDepartment) errors.b2bDepartment = 'B2B department is required';
    if (!bulkUploadFormData.b2bProject) errors.b2bProject = 'B2B project is required';
    if (!bulkUploadFormData.typeOfB2B) errors.typeOfB2B = 'Type of B2B is required';
    if (!bulkUploadFormData.leadStatus) errors.leadStatus = 'Lead status is required';
    if (
      bulkUploadFormData.leadStatus &&
      bulkUploadSubStatuses.length > 0 &&
      !bulkUploadFormData.leadSubStatus
    ) {
      errors.leadSubStatus = 'Sub status is required';
    }
    setBulkUploadFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isBulkUploadConfigComplete = Boolean(
    bulkUploadFormData.leadCategory &&
    bulkUploadFormData.b2bDepartment &&
    bulkUploadFormData.b2bProject &&
    bulkUploadFormData.typeOfB2B &&
    bulkUploadFormData.leadStatus &&
    (bulkUploadSubStatuses.length === 0 || bulkUploadFormData.leadSubStatus)
  );

  const openBulkUploadModal = () => {
    const uid = userData?._id != null ? String(userData._id) : '';
    setBulkUploadFormData({
      leadCategory: '',
      b2bDepartment: '',
      b2bProject: '',
      typeOfB2B: '',
      leadStatus: '',
      leadSubStatus: '',
      leadOwner: uid,
      leadCoOwner: '',
      leadRanking: '',
    });
    setBulkUploadFormErrors({});
    setBulkUploadSubStatuses([]);
    setBulkUploadFile(null);
    setBulkUploadMessage('');
    setBulkUploadErrors([]);
    setBulkUploadSuccess(false);
    setShowBulkUploadModal(true);
    if (bulkUploadFileInputRef.current) bulkUploadFileInputRef.current.value = '';
  };

  // Bulk Upload Functions (Excel only — same columns as backend import)
  const downloadB2bLeadsSampleExcel = () => {
    const rows = [
      ['Business Name', 'Concern Person Name', 'Mobile', 'Email', 'Address', 'City', 'State', 'Designation', 'WhatsApp', 'Landline Number', 'Remark'],
      ['ABC Company', 'John Doe', '9876543210', 'john@abc.com', '123 Main Street', 'Mumbai', 'Maharashtra', 'Manager', '9876543210', '0221234567', 'Sample remark'],
      ['XYZ Corp', 'Jane Smith', '9876543211', 'jane@xyz.com',  '456 Park Avenue', 'Delhi', 'Delhi', 'Director', '9876543211', '0111234567', 'Another remark'],
      ['Tech Solutions', 'Raj Kumar', '9876543212', 'raj@tech.com','789 Tech Park', 'Bangalore', 'Karnataka', 'CEO', '9876543212', '0801234567', 'Technology company']
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'b2b_leads_sample.xlsx');
  };

  const handleBulkFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
      ];
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

      if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
        setBulkUploadMessage('Please select an Excel file (.xlsx or .xls)');
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

    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      setBulkUploadMessage('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setBulkUploadLoading(true);
    setBulkUploadMessage('');
    setBulkUploadErrors([]);
    setBulkUploadSuccess(false);

    // Create FormData and append file
    if (!validateBulkUploadForm()) {
      setBulkUploadMessage('Please complete all required fields above (Lead Source, Department, Project, Type of B2B, Status, Sub Status)');
      setBulkUploadLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile, selectedFile.name);
    formData.append('leadCategory', bulkUploadFormData.leadCategory);
    formData.append('b2bDepartment', bulkUploadFormData.b2bDepartment);
    formData.append('b2bProject', bulkUploadFormData.b2bProject);
    formData.append('typeOfB2B', bulkUploadFormData.typeOfB2B);
    formData.append('leadStatus', bulkUploadFormData.leadStatus);
    if (bulkUploadFormData.leadSubStatus) {
      formData.append('leadSubStatus', bulkUploadFormData.leadSubStatus);
    }
    if (bulkUploadFormData.leadOwner) {
      formData.append('leadOwner', bulkUploadFormData.leadOwner);
    }
    if (bulkUploadFormData.leadCoOwner) {
      formData.append('leadCoOwner', bulkUploadFormData.leadCoOwner);
    }
    if (bulkUploadFormData.leadRanking) {
      formData.append('leadRanking', bulkUploadFormData.leadRanking);
    }

    try {
      const response = await axios.post(`${backendUrl}/college/b2b/leads/import`, formData, {
        headers: { 'x-auth': token }
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
        fetchLeads(selectedStatusFilter, currentPage, getLeadFetchOverrides());
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
    setCurrentPage(newPage);
    fetchLeads(selectedStatusFilter, newPage, getLeadFetchOverrides());
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

  // When adding a lead, if mobile already exists → flag only (keep user Status / Sub Status)
  useEffect(() => {
    if (!showAddLeadModal || editingLeadId) {
      setIsDuplicateMobile(false);
      return undefined;
    }

    const digits = String(leadFormData.mobile || '').replace(/\D/g, '').slice(-10);
    if (digits.length !== 10 || !token || !backendUrl) {
      setIsDuplicateMobile(false);
      return undefined;
    }

    const requestId = ++mobileDuplicateCheckRef.current;
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${backendUrl}/college/b2b/check-mobile-duplicate`, {
          params: { mobile: digits },
          headers: { 'x-auth': token },
        });
        if (requestId !== mobileDuplicateCheckRef.current) return;
        setIsDuplicateMobile(Boolean(res.data?.isDuplicate));
      } catch (err) {
        if (requestId === mobileDuplicateCheckRef.current) {
          console.error('Duplicate mobile check failed:', err);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [showAddLeadModal, editingLeadId, leadFormData.mobile, token, backendUrl]);

  // edit status and set followup
  const [seletectedStatus, setSelectedStatus] = useState('');
  const [seletectedSubStatus, setSelectedSubStatus] = useState(null);
  // Single state for all follow-up form data
  const [followupFormData, setFollowupFormData] = useState({
    followUpType: 'Call', // 'Call' | 'Visit' (backend default is 'Call')
    description: '',
    followupDate: '',
    followupTime: '',
    remarks: '',
    selectedProfile: null,
    selectedConcernPerson: null,
    selectedProfiles: null,
    selectedCounselor: null,
    selectedDocument: null
  });

  // AI Summary for Follow-up Notes (summarize existing notes text)
  const [notesAI, setNotesAI] = useState({
    loading: false,
    error: '',
    data: null
  });

  const summarizeFollowupNotes = async () => {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const text = String(followupFormData.remarks || '').trim();
    if (!text) {
      setNotesAI((prev) => ({ ...prev, error: 'Please enter Follow-up Notes first.' }));
      return;
    }
    try {
      setNotesAI({ loading: true, error: '', data: null });
      const leadContext = {
        leadId: selectedProfile?._id || null,
        businessName: selectedProfile?.businessName || '',
        concernPersonName: selectedProfile?.concernPersonName || '',
        mobile: selectedProfile?.mobile || '',
        whatsapp: selectedProfile?.whatsapp || '',
        email: selectedProfile?.email || '',
        status: selectedProfile?.status?.title || selectedProfile?.status?.name || '',
        subStatus: selectedProfile?.subStatus?.title || ''
      };

      const resp = await axios.post(
        `${backendUrl}/api/ai/conversation-summary`,
        { channel: 'Notes', leadContext, text },
        { headers: token ? { 'x-auth': token } : undefined }
      );

      if (resp?.data?.success) {
        setNotesAI({ loading: false, error: '', data: resp.data.data || null });
      } else {
        setNotesAI({ loading: false, error: resp?.data?.message || 'AI summarization failed.', data: null });
      }
    } catch (err) {
      setNotesAI({
        loading: false,
        error: err?.response?.data?.message || err?.message || 'AI summarization failed.',
        data: null
      });
    }
  };


  const [subStatuses, setSubStatuses] = useState([


  ]);

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;

  const { navRef, navHeight } = useNavHeight([isFilterCollapsed, crmFilters]);
  const { widthRef, width, leftOffset } = useMainWidth([isFilterCollapsed, crmFilters, mainContentClass]);
  const { isScrolled, scrollY, contentRef } = useScrollBlur(navHeight);
  const blurIntensity = Math.min(scrollY / 10, 15);
  const navbarOpacity = Math.min(0.85 + scrollY / 1000, 0.98);
  const tabs = [
    'Lead Details', ,
    'Documents'
  ];
  // WhatsApp Panel states
  const [whatsappMessages, setWhatsappMessages] = useState([
  ]);
  const [whatsappNewMessage, setWhatsappNewMessage] = useState('');
  const [selectedWhatsappTemplate, setSelectedWhatsappTemplate] = useState(null);
  const [showWhatsappTemplateMenu, setShowWhatsappTemplateMenu] = useState(false);
  const [showWhatsappEmojiPicker, setShowWhatsappEmojiPicker] = useState(false);
  const [showWhatsappFileMenu, setShowWhatsappFileMenu] = useState(false);
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(true); // Default true for demo
  const whatsappMessagesEndRef = useRef(null);
  const [whatsappTemplates, setWhatsappTemplates] = useState([]);
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);
  const [chatListSearch, setChatListSearch] = useState('');
  const [chatListFilter, setChatListFilter] = useState('all'); // all | unread | favourites | groups
  const [chatConversations, setChatConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationTotalPages, setConversationTotalPages] = useState(1);
  const [sessionWindow, setSessionWindow] = useState({
    isOpen: false,
    openedAt: null,
    expiresAt: null,
    remainingTimeMs: 0
  });
  const [sessionCountdown, setSessionCountdown] = useState('24:00:00');
  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 992);
      setViewportWidth(window.innerWidth);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const panelWidthPx = Math.round(Math.min(420, Math.max(320, viewportWidth * 0.28)));
  const isDesktopPanelOpen = !isMobile && Boolean(showPanel);
  useEffect(() => {
    fetchStatus()

  }, []);

  useEffect(() => {
    if (seletectedStatus || filters.status) {
      fetchSubStatus()
    }
  }, [seletectedStatus, filters.status]);


  const handleStatusChange = (e) => {
    const nextStatus = e.target.value;
    setSelectedStatus(nextStatus);
    // Reset sub-status when status/performance changes (old sub-status may not belong to new status)
    setSelectedSubStatus(null);
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
      const status = seletectedStatus || filters.status;
      if (!status) {
        alert('Please select a status');
        return;
      }
      const response = await axios.get(`${backendUrl}/college/statusB2b/${status}/substatus`, {
        headers: { 'x-auth': token }
      });


      if (response.data.success) {
        const status = response.data.data;


        setSubStatuses(response.data.data);


      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch SubStatus');
    }
  };

  // Check WhatsApp 24-hour session window status
  const checkSessionWindow = async (phoneNumber) => {
    try {
      if (!phoneNumber || !token) {
        console.error('Ã¢ÂÅ’ Phone number or token missing');
        return;
      }

      const response = await axios.get(
        `${backendUrl}/college/whatsapp/session-window/${phoneNumber}`,
        {
          headers: {
            'x-auth': token
          }
        }
      );

      if (response.data.success) {
        const { sessionWindow: sw } = response.data;
        setSessionWindow({
          isOpen: sw.isOpen,
          openedAt: sw.lastIncomingMessageAt,
          expiresAt: sw.expiresAt,
          remainingTimeMs: sw.remainingTimeMs
        });

        console.log('Session window status:', {
          isOpen: sw.isOpen,
          canSendManualMessages: response.data.messaging.canSendManualMessages,
          requiresTemplate: response.data.messaging.requiresTemplate,
          expiresAt: sw.expiresAt
        });
      }
    } catch (error) {
      console.error('Ã¢ÂÅ’ Error checking session window:', error.response?.data || error.message);
      // Set default state if error
      setSessionWindow({
        isOpen: false,
        openedAt: null,
        expiresAt: null,
        remainingTimeMs: 0
      });
    }
  };
  useEffect(() => {
    if (!sessionWindow.isOpen || !sessionWindow.expiresAt) {
      setSessionCountdown('00:00:00');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const expiresAt = new Date(sessionWindow.expiresAt);
      const diff = expiresAt - now;

      if (diff <= 0) {
        setSessionCountdown('00:00:00');
        // Session expired, refresh status
        const phone = getLeadWhatsappPhone(selectedProfile);
        if (phone) {
          checkSessionWindow(phone);
        }
        return;
      }

      // Convert to hours, minutes, seconds
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Format as HH:MM:SS
      const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setSessionCountdown(formatted);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [sessionWindow.isOpen, sessionWindow.expiresAt, selectedProfile]);

  // Render message status icon (WhatsApp style)
  const renderMessageStatus = (status, errorMessage = null) => {
    switch (status) {
      case 'sending':
        return <i className="fas fa-clock" style={{ fontSize: '12px', color: '#8696a0', marginLeft: '4px' }} title="Sending..."></i>;
      case 'sent':
        return <i className="fas fa-check" style={{ fontSize: '12px', color: '#8696a0', marginLeft: '4px' }} title="Sent"></i>;
      case 'delivered':
        return (
          <span style={{ position: 'relative', display: 'inline-block', width: '16px', height: '12px', marginLeft: '4px' }} title="Delivered">
            <i className="fas fa-check" style={{ fontSize: '12px', color: '#8696a0', position: 'absolute', left: '0' }}></i>
            <i className="fas fa-check" style={{ fontSize: '12px', color: '#8696a0', position: 'absolute', left: '3px' }}></i>
          </span>
        );
      case 'read':
        return (
          <span style={{ position: 'relative', display: 'inline-block', width: '16px', height: '12px', marginLeft: '4px' }} title="Read">
            <i className="fas fa-check" style={{ fontSize: '12px', color: '#53bdeb', position: 'absolute', left: '0' }}></i>
            <i className="fas fa-check" style={{ fontSize: '12px', color: '#53bdeb', position: 'absolute', left: '3px' }}></i>
          </span>
        );
      case 'failed':
        return <i className="fas fa-exclamation-circle" style={{ fontSize: '12px', color: '#f44336', marginLeft: '4px', cursor: 'pointer' }} title={errorMessage || 'Message failed to send'}></i>;
      default:
        return null;
    }
  };
  // Render WhatsApp Template Message
  const renderTemplateMessage = (templateData, useSavedExamples = false) => {
    if (!templateData || !templateData.components) {
      return null;
    }

    const components = templateData.components;
    const headerComponent = components.find(c => c.type === 'HEADER');
    const bodyComponent = components.find(c => c.type === 'BODY');
    const footerComponent = components.find(c => c.type === 'FOOTER');
    const buttonsComponent = components.find(c => c.type === 'BUTTONS');
    const carouselComponent = components.find(c => c.type === 'CAROUSEL');

    return (
      <div style={{ width: '100%' }}>
        {/* Carousel Template */}
        {carouselComponent && carouselComponent.cards && carouselComponent.cards.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div
              className="d-flex overflow-auto pb-2"
              style={{
                gap: '8px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#888 #f0f0f0'
              }}
            >
              {carouselComponent.cards.map((card, cardIndex) => {
                const cardHeader = card.components?.find(c => c.type === 'HEADER');
                const cardBody = card.components?.find(c => c.type === 'BODY');
                const cardButtons = card.components?.find(c => c.type === 'BUTTONS');
                const cardMedia = templateData.carouselMedia?.[cardIndex];

                return (
                  <div
                    key={cardIndex}
                    style={{
                      minWidth: '220px',
                      maxWidth: '220px',
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    {/* Card Media */}
                    {cardHeader && cardMedia?.s3Url && (
                      <div style={{ position: 'relative', width: '100%', height: '140px' }}>
                        {cardMedia.mediaType === 'IMAGE' ? (
                          <img
                            src={cardMedia.s3Url}
                            alt={`Card ${cardIndex + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <video
                            controls
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          >
                            <source src={cardMedia.s3Url} type="video/mp4" />
                          </video>
                        )}
                      </div>
                    )}

                    {/* Card Body */}
                    {cardBody && (
                      <div style={{ padding: '10px', fontSize: '13px', lineHeight: '1.3' }}>
                        {(() => {


                          // Get candidate data for variable replacement
                          const candidate = selectedProfile?._candidate;
                          const registration = selectedProfile;

                          // Get template variable mappings from selectedWhatsappTemplate
                          const variableMappings = selectedWhatsappTemplate?.variableMappings || [];

                          // Replace variables with actual candidate data using stored mappings
                          let text = cardBody.text || '';

                          if (variableMappings && variableMappings.length > 0) {
                            // Use stored variable mappings from database

                            variableMappings.forEach(mapping => {
                              const position = mapping.position;
                              const variableName = mapping.variableName;

                              // Get value based on actual variable name from mapping
                              let value = '';

                              switch (variableName) {
                                case 'name':
                                  value = candidate?.name || registration?.concernPersonName || registration?.businessName || registration?.name || 'User';
                                  break;
                                case 'gender':
                                  value = candidate?.gender || 'NA';
                                  break;
                                case 'mobile':
                                  value = candidate?.mobile || registration?.whatsapp || registration?.mobile || 'Mobile';
                                  break;
                                case 'email':
                                  value = candidate?.email || registration?.email || 'Email';
                                  break;
                                case 'course_name':
                                  value = selectedProfile?._course?.name || registration?.b2bProject?.name || registration?.typeOfB2B?.name || 'Course Name';
                                  break;
                                case 'counselor_name':
                                  value = selectedProfile?.counsellor?.name || selectedProfile?.leadOwner?.name || selectedProfile?.leadAssignment?.[selectedProfile?.leadAssignment?.length - 1]?.counsellorName || 'Counselor not assigned';
                                  break;
                                case 'job_name':
                                  value = candidate?.appliedJobs?.[0]?.title || registration?.designation || 'Job Title';
                                  break;
                                case 'project_name':
                                  value = selectedProfile?.project?.name || selectedProfile?.b2bProject?.name || selectedProfile?.businessName || 'Project Name';
                                  break;
                                case 'batch_name':
                                  value = selectedProfile?.batch?.name || selectedProfile?.b2bDepartment?.name || 'Batch Not Assigned';
                                  break;
                                case 'lead_owner_name':
                                  value = selectedProfile?.registeredBy?.name || selectedProfile?.leadOwner?.name || selectedProfile?.leadAddedBy?.name || 'Self Registered';
                                  break;
                                default:
                                  // Try direct property access
                                  value = candidate?.[variableName] || registration?.[variableName] || `[${variableName}]`;
                                  break;
                              }

                              // Replace the numbered variable with actual value
                              text = text.replace(new RegExp(`\\{\\{${position}\\}\\}`, 'g'), value);
                            });
                          } else {
                            // Fallback: Use default mapping if no stored mappings

                            // Replace {{1}} with name
                            text = text.replace(/\{\{1\}\}/g, candidate?.name || registration?.name || 'User');

                            // Replace {{2}} with gender
                            text = text.replace(/\{\{2\}\}/g, candidate?.gender || 'Male');

                            // Replace {{3}} with mobile
                            text = text.replace(/\{\{3\}\}/g, candidate?.mobile || registration?.mobile || 'Mobile');

                            // Replace {{4}} with email
                            text = text.replace(/\{\{4\}\}/g, candidate?.email || registration?.email || 'Email');

                            // Replace {{5}} with course name
                            text = text.replace(/\{\{5\}\}/g, candidate?.appliedCourses?.[0]?.courseName || 'Course Name');

                            // Replace {{6}} with counselor name
                            text = text.replace(/\{\{6\}\}/g, selectedProfile?.counsellor?.name || selectedProfile?.leadAssignment?.[selectedProfile?.leadAssignment?.length - 1]?.counsellorName || 'Counselor not assigned');

                            // Replace {{7}} with job name
                            text = text.replace(/\{\{7\}\}/g, selectedProfile?.appliedJobs?.[0]?.title || 'Job Title');

                            // Replace {{8}} with project name (college name)
                            text = text.replace(/\{\{8\}\}/g, selectedProfile?.project?.name || 'Project Name');

                            // Replace {{9}} with batch name
                            text = text.replace(/\{\{9\}\}/g, selectedProfile?.batch?.name || 'Batch Not Assigned');

                            // Replace {{10}} with lead owner name
                            text = text.replace(/\{\{10\}\}/g, selectedProfile?.registeredBy?.name || 'Self Registered');
                          }

                          return text;
                        })()}
                      </div>
                    )}

                    {/* Card Buttons */}
                    {cardButtons && cardButtons.buttons && cardButtons.buttons.length > 0 && (
                      <div style={{ borderTop: '1px solid #e0e0e0' }}>
                        {cardButtons.buttons.map((btn, btnIndex) => (
                          <div
                            key={btnIndex}
                            style={{
                              padding: '8px',
                              textAlign: 'center',
                              color: '#00A5F4',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              borderBottom: btnIndex < cardButtons.buttons.length - 1 ? '1px solid #e0e0e0' : 'none'
                            }}
                          >
                            {btn.type === 'URL' && <i className="fas fa-external-link-alt me-1" style={{ fontSize: '11px' }}></i>}
                            {btn.type === 'PHONE_NUMBER' && <i className="fas fa-phone me-1" style={{ fontSize: '11px' }}></i>}
                            {btn.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: '11px', color: '#667781', marginTop: '4px', fontStyle: 'italic' }}>
              <i className="fas fa-images me-1"></i>Carousel Template ({carouselComponent.cards.length} cards)
            </div>
          </div>
        )}

        {/* Regular Template (Non-Carousel) */}
        {!carouselComponent && (
          <>
            {/* Header */}
            {headerComponent && (
              <div className="mb-2">
                {headerComponent.format === 'TEXT' && (
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#000' }}>
                    {headerComponent.text}
                  </div>
                )}
                {headerComponent.format === 'IMAGE' && templateData.headerMedia?.s3Url && (
                  <img
                    src={templateData.headerMedia.s3Url}
                    alt="Header"
                    style={{
                      width: '100%',
                      maxHeight: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px 8px 0 0',
                      marginLeft: '-10px',
                      marginTop: '-6px',
                      marginRight: '-10px',
                      marginBottom: '8px',
                      width: 'calc(100% + 20px)'
                    }}
                  />
                )}
                {headerComponent.format === 'VIDEO' && templateData.headerMedia?.s3Url && (
                  <video
                    controls
                    style={{
                      width: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px 8px 0 0',
                      marginLeft: '-10px',
                      marginTop: '-6px',
                      marginRight: '-10px',
                      marginBottom: '8px',
                      width: 'calc(100% + 20px)'
                    }}
                  >
                    <source src={templateData.headerMedia.s3Url} type="video/mp4" />
                  </video>
                )}
                {headerComponent.format === 'DOCUMENT' && templateData.headerMedia?.s3Url && (
                  <a
                    href={templateData.headerMedia.s3Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="d-flex align-items-center p-2 mb-2"
                    style={{
                      backgroundColor: '#f0f0f0',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: '#000'
                    }}
                  >
                    <i className="fas fa-file-pdf me-2" style={{ fontSize: '20px', color: '#d32f2f' }}></i>
                    <span style={{ fontSize: '13px' }}>{templateData.headerMedia.fileName || 'Document'}</span>
                  </a>
                )}
              </div>
            )}

            {/* Body */}
            {bodyComponent && (
              <div style={{ fontSize: '14px', lineHeight: '1.4', color: '#000', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                {(() => {
                  // For saved messages (useSavedExamples=true), use database example values
                  if (useSavedExamples && bodyComponent.example && bodyComponent.example.body_text && Array.isArray(bodyComponent.example.body_text[0])) {
                    const exampleValues = bodyComponent.example.body_text[0];
                    let text = bodyComponent.text || '';

                    // Replace each numbered variable with its saved example value
                    const variableRegex = /\{\{(\d+)\}\}/g;
                    const matches = [...text.matchAll(variableRegex)];

                    matches.forEach((match, index) => {
                      if (index < exampleValues.length && exampleValues[index]) {
                        const position = match[1];
                        const replaceRegex = new RegExp(`\\{\\{${position}\\}\\}`, 'g');
                        text = text.replace(replaceRegex, exampleValues[index]);
                      }
                    });

                    return text;
                  }

                  // For preview mode, get candidate data for variable replacement
                  const candidate = selectedProfile?._candidate;
                  const registration = selectedProfile;

                  // Get template variable mappings from selectedWhatsappTemplate
                  const variableMappings = selectedWhatsappTemplate?.variableMappings || [];

                  // Replace variables with actual candidate data using stored mappings
                  let text = bodyComponent.text || '';

                  if (variableMappings && variableMappings.length > 0) {
                    // Use stored variable mappings from database

                    variableMappings.forEach(mapping => {
                      const position = mapping.position;
                      const variableName = mapping.variableName;

                      // Get value based on actual variable name from mapping
                      let value = '';

                      switch (variableName) {
                        case 'name':
                          value = candidate?.name || registration?.concernPersonName || registration?.businessName || registration?.name || 'User';
                          break;
                        case 'gender':
                          value = candidate?.gender || 'NA';
                          break;
                        case 'mobile':
                          value = candidate?.mobile || registration?.whatsapp || registration?.mobile || 'Mobile';
                          break;
                        case 'email':
                          value = candidate?.email || registration?.email || 'Email';
                          break;
                        case 'course_name':
                          value = candidate?.appliedCourses?.[0]?.courseName || selectedProfile?.course?.name || selectedProfile?.b2bProject?.name || selectedProfile?.typeOfB2B?.name || 'Course Name';
                          break;
                        case 'counselor_name':
                          value = selectedProfile?.counsellor?.name || selectedProfile?.leadOwner?.name || selectedProfile?.leadAssignment?.[selectedProfile?.leadAssignment?.length - 1]?.counsellorName || 'Counselor not assigned';
                          break;
                        case 'job_name':
                          value = selectedProfile?.appliedJobs?.[0]?.title || selectedProfile?.designation || 'Job Title';
                          break;
                        case 'project_name':
                          value = selectedProfile?.project?.name || selectedProfile?.b2bProject?.name || selectedProfile?.businessName || 'Project Name';
                          break;
                        case 'batch_name':
                          value = selectedProfile?.batch?.name || selectedProfile?.b2bDepartment?.name || 'Batch Not Assigned';
                          break;
                        case 'lead_owner_name':
                          value = selectedProfile?.registeredBy?.name || selectedProfile?.leadOwner?.name || selectedProfile?.leadAddedBy?.name || 'Self Registered';
                          break;
                        default:
                          // Try direct property access
                          value = candidate?.[variableName] || registration?.[variableName] || `[${variableName}]`;
                          break;
                      }

                      // Replace the numbered variable with actual value
                      text = text.replace(new RegExp(`\\{\\{${position}\\}\\}`, 'g'), value);
                    });
                  } else {
                    // Fallback: Use default mapping if no stored mappings

                    // Replace {{1}} with name
                    text = text.replace(/\{\{1\}\}/g, candidate?.name || registration?.name || 'User');

                    // Replace {{2}} with gender
                    text = text.replace(/\{\{2\}\}/g, candidate?.gender || 'Male');

                    // Replace {{3}} with mobile
                    text = text.replace(/\{\{3\}\}/g, candidate?.mobile || registration?.mobile || 'Mobile');

                    // Replace {{4}} with email
                    text = text.replace(/\{\{4\}\}/g, candidate?.email || registration?.email || 'Email');

                    // Replace {{5}} with course name
                    text = text.replace(/\{\{5\}\}/g, candidate?.appliedCourses?.[0]?.courseName || selectedProfile?.course?.name || 'Course Name');

                    // Replace {{6}} with counselor name
                    text = text.replace(/\{\{6\}\}/g, selectedProfile?.counsellor?.name || selectedProfile?.leadAssignment?.[selectedProfile?.leadAssignment?.length - 1]?.counsellorName || 'Counselor not assigned');

                    // Replace {{7}} with job name
                    text = text.replace(/\{\{7\}\}/g, selectedProfile?.appliedJobs?.[0]?.title || 'Job Title');

                    // Replace {{8}} with project name (college name)
                    text = text.replace(/\{\{8\}\}/g, selectedProfile?.project?.name || 'Project Name');

                    // Replace {{9}} with batch name
                    text = text.replace(/\{\{9\}\}/g, selectedProfile?.batch?.name || 'Batch Not Assigned');

                    // Replace {{10}} with lead owner name
                    text = text.replace(/\{\{10\}\}/g, selectedProfile?.registeredBy?.name || 'Self Registered');
                  }

                  return text;
                })()}
              </div>
            )}

            {/* Footer */}
            {footerComponent && (
              <div style={{ fontSize: '12px', color: '#667781', marginTop: '6px', marginBottom: '8px' }}>
                {footerComponent.text}
              </div>
            )}

            {/* Buttons */}
            {buttonsComponent && buttonsComponent.buttons && buttonsComponent.buttons.length > 0 && (
              <div style={{ marginTop: '8px', borderTop: '1px solid #e0e0e0', paddingTop: '8px' }}>
                {buttonsComponent.buttons.map((button, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      color: '#00A5F4',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      borderBottom: index < buttonsComponent.buttons.length - 1 ? '1px solid #e0e0e0' : 'none'
                    }}
                  >
                    {button.type === 'URL' && <i className="fas fa-external-link-alt me-2" style={{ fontSize: '12px' }}></i>}
                    {button.type === 'PHONE_NUMBER' && <i className="fas fa-phone me-2" style={{ fontSize: '12px' }}></i>}
                    {button.type === 'QUICK_REPLY' && <i className="fas fa-reply me-2" style={{ fontSize: '12px' }}></i>}
                    {button.text}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Fetch WhatsApp Templates from backend
  const fetchWhatsappTemplates = async () => {
    try {
      if (!token) {
        alert('No token found in session storage.');
        return;
      }

      // Ã¢Å“... Use our backend API instead of direct Meta API
      const response = await axios.get(`${backendUrl}/college/whatsapp/templates`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        const templates = response.data.data || [];
        setWhatsappTemplates(Array.isArray(templates) ? templates : []);
      } else {
        console.error('Ã¢ÂÅ’ Backend API error:', response.data.message);
        setWhatsappTemplates([]);
      }
    } catch (error) {
      console.error('Ã¢ÂÅ’ Error fetching WhatsApp templates:', error);
      setWhatsappTemplates([]);
    }
  };

  const getLeadWhatsappPhone = (lead) => {
    const raw = String(lead?.whatsapp || lead?.mobile || '').trim();
    return raw.replace(/\D/g, '') || raw;
  };

  const normalizeChatPhone = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  const formatChatPreview = (message) => {
    if (!message) return '';
    const type = String(message.messageType || message.type || '').toLowerCase();
    const text = String(message.text || message.message || message.rawText || '').trim();
    if (type === 'image') return 'Photo';
    if (type === 'video') return 'Video';
    if (type === 'audio' || type === 'voice') return 'Voice message';
    if (type === 'document') return 'Document';
    if (type === 'sticker') return 'Sticker';
    if (type === 'location') return 'Location';
    if (type === 'contacts') return 'Contact';
    if (type === 'template') return text || 'Template message';
    return text || 'Message';
  };

  const getLeadContactName = (lead) =>
    lead?.concernPersonName || lead?.businessName || 'Lead';

  const getB2bTemplateVariableValue = (variableName, lead = selectedProfile) => {
    if (!lead) return `[${variableName}]`;
    switch (variableName) {
      case 'name':
        return getLeadContactName(lead);
      case 'gender':
        return 'NA';
      case 'mobile':
        return getLeadWhatsappPhone(lead) || 'Mobile';
      case 'email':
        return lead?.email || 'Email';
      case 'course_name':
        return lead?.b2bProject?.name || lead?.typeOfB2B?.name || 'Project';
      case 'counselor_name':
        return lead?.leadOwner?.name || 'Counselor not assigned';
      case 'job_name':
        return lead?.designation || 'Designation';
      case 'project_name':
        return lead?.b2bProject?.name || lead?.businessName || 'Project Name';
      case 'batch_name':
        return lead?.b2bDepartment?.name || 'Department';
      case 'lead_owner_name':
        return lead?.leadOwner?.name || lead?.leadAddedBy?.name || 'Self';
      case 'business_name':
        return lead?.businessName || 'Business';
      case 'concern_person_name':
        return lead?.concernPersonName || 'Concern Person';
      case 'city':
        return lead?.city || 'City';
      case 'state':
        return lead?.state || 'State';
      default:
        return lead?.[variableName] || `[${variableName}]`;
    }
  };

  const closeBulkWhatsappModal = () => {
    setModalType(null);
    setSelectedWhatsappNumbers([]);
    setSelectedWhatsappTemplateModal('');
  };

  const exitBulkMode = () => {
    closeBulkWhatsappModal();
    setShowBulkInputs(false);
    setBulkMode('');
    setInput1Value('');
    setSelectedProfiles([]);
    resetBulkSelectionState();
  };

  const handleBulkCountInputChange = (rawValue) => {
    const maxValue = getBulkSelectableLeadCount();
    let inputValue = String(rawValue || '').replace(/[^0-9]/g, '');

    if (inputValue === '') {
      bulkSelectionModeRef.current = 'count';
      setInput1Value('');
      return;
    }

    const numValue = parseInt(inputValue, 10);
    if (numValue < 1 || isNaN(numValue)) {
      inputValue = '1';
    } else if (numValue > maxValue) {
      inputValue = maxValue.toString();
    }

    bulkSelectionModeRef.current = 'count';
    setInput1Value(inputValue);
  };

  const handleBulkWhatsappSend = async () => {
    if (!selectedWhatsappNumbers.length) {
      alert('Please select at least one number type (Mobile / WhatsApp).');
      return;
    }
    if (!selectedWhatsappTemplateModal) {
      alert('Please select a WhatsApp template.');
      return;
    }
    if (!token) {
      alert('No token found in session storage.');
      return;
    }
    if (!selectedProfiles?.length) {
      alert('Please select leads first.');
      return;
    }

    setIsSendingBulkWhatsapp(true);
    try {
      const selectedSet = new Set((selectedProfiles || []).map((id) => String(id)));
      let leadsToSend = (leads || []).filter((l) => selectedSet.has(String(l._id)));

      // Fetch more leads if selection goes beyond currently loaded page
      if (leadsToSend.length < selectedProfiles.length) {
        const needed = Math.max(selectedProfiles.length, parseInt(String(input1Value || '0'), 10) || selectedProfiles.length);
        const params = {
          page: 1,
          limit: String(needed),
          ...(isDuplicateMobileFilter(selectedStatusFilter)
            ? { isDuplicateMobile: true }
            : selectedStatusFilter
              ? { status: selectedStatusFilter }
              : {})
        };
        appendLeadFilterParams(params, { ...filters });
        const response = await axios.get(`${backendUrl}/college/b2b/leads`, {
          headers: { 'x-auth': token },
          params
        });
        const fetched = response.data?.data?.leads || [];
        leadsToSend = fetched.filter((l) => selectedSet.has(String(l._id)));
      }

      if (!leadsToSend.length) {
        alert('No selected leads found to send messages.');
        setIsSendingBulkWhatsapp(false);
        return;
      }

      const recipients = [];
      const seenPhones = new Set();
      leadsToSend.forEach((lead) => {
        selectedWhatsappNumbers.forEach((numberType) => {
          let raw = '';
          if (numberType === 'Mobile') raw = lead.mobile || '';
          else if (numberType === 'WhatsApp Number') raw = lead.whatsapp || lead.mobile || '';
          const phone = String(raw).replace(/\D/g, '');
          if (!phone || seenPhones.has(phone)) return;
          seenPhones.add(phone);
          recipients.push({ phone, leadId: lead._id, lead });
        });
      });

      if (!recipients.length) {
        alert('No valid phone numbers found for the selected number types.');
        setIsSendingBulkWhatsapp(false);
        return;
      }

      if (!window.confirm(`Send WhatsApp template to ${recipients.length} recipient(s)?`)) {
        setIsSendingBulkWhatsapp(false);
        return;
      }

      const template = whatsappTemplates.find(
        (t) => String(t.id) === String(selectedWhatsappTemplateModal) || t.name === selectedWhatsappTemplateModal
      );
      if (!template) {
        alert('Selected template not found. Please refresh templates and try again.');
        setIsSendingBulkWhatsapp(false);
        return;
      }

      const templateBody = template.components?.find((c) => c.type === 'BODY')?.text || '';
      const variableMappings = template?.variableMappings || [];
      const variableRegex = /\{\{(\d+)\}\}/g;
      let successCount = 0;
      const errors = [];

      for (const recipient of recipients) {
        try {
          const matches = [...templateBody.matchAll(variableRegex)];
          const variableValues = matches.map((match) => {
            const position = parseInt(match[1], 10);
            if (variableMappings?.length) {
              const mapping = variableMappings.find((m) => m.position === position);
              if (mapping) return getB2bTemplateVariableValue(mapping.variableName, recipient.lead);
            }
            switch (position) {
              case 1: return getB2bTemplateVariableValue('name', recipient.lead);
              case 2: return getB2bTemplateVariableValue('gender', recipient.lead);
              case 3: return getB2bTemplateVariableValue('mobile', recipient.lead);
              case 4: return getB2bTemplateVariableValue('email', recipient.lead);
              case 5: return getB2bTemplateVariableValue('course_name', recipient.lead);
              case 6: return getB2bTemplateVariableValue('counselor_name', recipient.lead);
              case 7: return getB2bTemplateVariableValue('job_name', recipient.lead);
              case 8: return getB2bTemplateVariableValue('project_name', recipient.lead);
              case 9: return getB2bTemplateVariableValue('batch_name', recipient.lead);
              case 10: return getB2bTemplateVariableValue('lead_owner_name', recipient.lead);
              default: return '[Variable]';
            }
          });

          const response = await axios.post(
            `${backendUrl}/college/whatsapp/send-template`,
            {
              templateName: template.name,
              to: recipient.phone,
              candidateId: recipient.leadId,
              registrationId: recipient.leadId,
              collegeId: userData.college || userData.collegeId,
              variableValues
            },
            { headers: { 'x-auth': token } }
          );

          if (response.status === 200 && response.data?.success && response.data?.data?.messageId) {
            successCount += 1;
          } else {
            errors.push(`${recipient.phone}: ${response.data?.message || 'Failed to send'}`);
          }
        } catch (err) {
          errors.push(`${recipient.phone}: ${err.response?.data?.message || err.message || 'Failed'}`);
        }
      }

      if (successCount > 0) {
        alert(`Sent successfully to ${successCount} recipient(s).${errors.length ? `\nFailed: ${errors.length}` : ''}`);
        exitBulkMode();
      } else {
        alert(`Failed to send messages.\n${errors.slice(0, 5).join('\n')}`);
      }
    } catch (error) {
      console.error('Bulk WhatsApp send failed:', error);
      alert(error.response?.data?.message || 'Bulk WhatsApp send failed. Please try again.');
    } finally {
      setIsSendingBulkWhatsapp(false);
    }
  };

  const emojis = ['😀', '😂', '❤️', '👍', '🙏', '😍', '🎉', '👏', '🔥', '💯', '✅', '🚀', '💪', '🙌', '😎', '🤝', '💼', '📱', '⭐', '✨'];

  const fetchWhatsappHistory = async (phoneNumber) => {
    try {
      if (!phoneNumber || !token) {
        console.error('Phone number or token missing:', { phoneNumber, hasToken: !!token });
        return;
      }

      setIsLoadingChatHistory(true);

      const response = await axios.get(
        `${backendUrl}/college/whatsapp/chat-history/${phoneNumber}`,
        {
          headers: {
            'x-auth': token
          }
        }
      );

      if (response.data.success) {
        const formattedMessages = (response.data.data || []).map((msg, index) => ({
          id: msg._id || msg.wamid || msg.whatsappMessageId || `msg-${index}`,
          dbId: msg._id,
          wamid: msg.wamid || msg.whatsappMessageId,
          whatsappMessageId: msg.whatsappMessageId || msg.wamid,
          text: msg.message,
          sender: msg.direction === 'incoming' ? 'user' : 'agent',
          time: new Date(msg.sentAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: msg.messageType,
          templateData: msg.templateData,
          mediaUrl: msg.mediaUrl,
          status: msg.status || (msg.direction === 'incoming' ? 'received' : 'sent'),
          deliveredAt: msg.deliveredAt,
          readAt: msg.readAt
        }));

        setWhatsappMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
      } else if (error.response?.status === 400) {
        alert('Invalid phone number or missing information');
      }
      setWhatsappMessages([]);
    } finally {
      setIsLoadingChatHistory(false);
    }
  };

  const profileFromConversation = (conversation) => {
    if (conversation?.lead?._id) return conversation.lead;
    const phone = conversation?.phone || '';
    return {
      _id: conversation?.lead?._id || `phone_${phone}`,
      mobile: conversation?.lead?.mobile || phone,
      whatsapp: conversation?.lead?.whatsapp || phone,
      concernPersonName: conversation?.lead?.concernPersonName || phone,
      businessName: conversation?.lead?.businessName || ''
    };
  };

  const upsertChatToTop = useCallback((incoming) => {
    const phone = normalizeChatPhone(incoming?.phone);
    if (!phone) return;
    setChatConversations((prev) => {
      const existing = (prev || []).find((item) => normalizeChatPhone(item.phone) === phone);
      let unreadCount = incoming.unreadCount;
      if (unreadCount == null) {
        if (incoming.incrementUnread) unreadCount = (existing?.unreadCount || 0) + 1;
        else unreadCount = existing?.unreadCount || 0;
      }
      const nextItem = {
        phone,
        unreadCount,
        lastMessageAt: incoming.lastMessageAt || incoming.lastMessage?.sentAt || new Date().toISOString(),
        lastMessage: incoming.lastMessage || existing?.lastMessage || null,
        lead: incoming.lead || existing?.lead || null
      };
      const rest = (prev || []).filter((item) => normalizeChatPhone(item.phone) !== phone);
      return [nextItem, ...rest];
    });
  }, []);

  const fetchWhatsappConversations = useCallback(async (page = 1, search = '', silent = false) => {
    if (!token) return;
    try {
      if (!silent) setLoadingConversations(true);
      const response = await axios.get(`${backendUrl}/college/whatsapp/conversations`, {
        headers: { 'x-auth': token },
        params: {
          page,
          limit: 80,
          search: search || undefined
        }
      });
      if (response.data?.success) {
        setChatConversations(response.data.data || []);
        setConversationPage(response.data.pagination?.currentPage || page);
        setConversationTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp conversations:', error.response?.data || error.message);
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  }, [backendUrl, token]);

  const markWhatsappConversationRead = async (phone) => {
    const phoneKey = normalizeChatPhone(phone);
    if (!phoneKey || !token) return;
    setChatConversations((prev) =>
      (prev || []).map((item) =>
        normalizeChatPhone(item.phone) === phoneKey ? { ...item, unreadCount: 0 } : item
      )
    );
    try {
      await axios.put(`${backendUrl}/college/whatsapp/mark-read/${phoneKey}`, {}, {
        headers: { 'x-auth': token }
      });
    } catch (error) {
      console.error('Failed to mark WhatsApp conversation read:', error.response?.data || error.message);
    }
  };

  const handleInboxIncomingMessage = useCallback((data) => {
    if (!data) return;
    const messageId = data.whatsappMessageId || data.messageId || data.id || `${data.from}-${data.sentAt || Date.now()}`;
    if (processedInboxMessageIds.current.has(messageId)) return;
    processedInboxMessageIds.current.add(messageId);

    const phone = normalizeChatPhone(data.from);
    if (!phone) return;

    const currentLead = selectedProfileRef.current;
    const currentPhone = normalizeChatPhone(getLeadWhatsappPhone(currentLead));
    const isOpenChat = showPanelRef.current === 'Whatsapp' && currentPhone && currentPhone === phone;
    const previewText = formatChatPreview({
      text: data.message,
      messageType: data.messageType
    });

    upsertChatToTop({
      phone,
      unreadCount: isOpenChat ? 0 : undefined,
      incrementUnread: !isOpenChat,
      lastMessageAt: data.sentAt || new Date().toISOString(),
      lastMessage: {
        text: previewText,
        direction: 'incoming',
        messageType: data.messageType || 'text',
        sentAt: data.sentAt || new Date().toISOString(),
        status: 'received'
      },
      lead: currentLead && currentPhone === phone ? currentLead : null
    });

    if (isOpenChat) {
      setWhatsappMessages((prev) => {
        const exists = (prev || []).some((msg) =>
          msg.id === messageId || msg.whatsappMessageId === messageId || msg.wamid === messageId
        );
        if (exists) return prev;
        return [
          ...(prev || []),
          {
            id: messageId,
            wamid: data.whatsappMessageId || data.messageId,
            whatsappMessageId: data.whatsappMessageId || data.messageId,
            text: data.message,
            sender: 'user',
            time: new Date(data.sentAt || Date.now()).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: data.messageType || 'text',
            mediaUrl: data.mediaUrl,
            status: 'received'
          }
        ];
      });
      markWhatsappConversationRead(phone);
      if (currentPhone) checkSessionWindow(currentPhone);
    }
  }, [upsertChatToTop]);

  const openWhatsappPanel = async (profile = null) => {
    const lead = profile || selectedProfile;
    if (!lead) {
      alert('Please select a lead first');
      return;
    }

    const phone = getLeadWhatsappPhone(lead);
    if (!phone) {
      alert('WhatsApp / mobile number not found for this lead');
      return;
    }

    setSelectedProfile(lead);
    setShowPopup(null);
    setMobileMoreLead(null);
    setShowPanel('Whatsapp');
    setWhatsappNewMessage('');
    setSelectedWhatsappTemplate(null);
    setShowWhatsappTemplateMenu(false);
    setShowWhatsappEmojiPicker(false);
    setShowWhatsappFileMenu(false);

    // Inbox layout: no col-8 sidebar squeeze
    if (isMobile) {
      document.body.classList.add('panel-open');
    }

    await fetchWhatsappHistory(phone);
    await checkSessionWindow(phone);
    await markWhatsappConversationRead(phone);
  };

  const handleWhatsappSendMessage = async () => {
    if (!whatsappNewMessage.trim()) return;

    if (!sessionWindow.isOpen) {
      alert('24-hour window is closed. Please use a template message.');
      return;
    }

    const phone = getLeadWhatsappPhone(selectedProfile);
    if (!phone) {
      alert('Phone number not found for this lead');
      return;
    }

    const messageText = whatsappNewMessage.trim();
    const tempId = `temp-${Date.now()}`;

    const newMessage = {
      id: tempId,
      text: messageText,
      sender: 'agent',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      status: 'sending'
    };

    setWhatsappMessages(prev => [...prev, newMessage]);
    setWhatsappNewMessage('');
    setShowWhatsappEmojiPicker(false);

    try {
      const response = await axios.post(
        `${backendUrl}/college/whatsapp/send-message`,
        {
          to: phone,
          message: messageText,
          candidateId: selectedProfile?._id,
          candidateName: getLeadContactName(selectedProfile)
        },
        {
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setWhatsappMessages(prev =>
          prev.map(msg =>
            msg.id === tempId
              ? {
                ...msg,
                id: response.data.data.messageId,
                wamid: response.data.data.messageId,
                status: 'sent'
              }
              : msg
          )
        );
        upsertChatToTop({
          phone,
          unreadCount: 0,
          lastMessageAt: new Date().toISOString(),
          lastMessage: {
            text: messageText,
            direction: 'outgoing',
            messageType: 'text',
            sentAt: new Date().toISOString(),
            status: 'sent'
          },
          lead: selectedProfile
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setWhatsappMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'failed', errorMessage: error.response?.data?.message || 'Failed to send' }
            : msg
        )
      );
      alert(error.response?.data?.message || 'Failed to send message. Please try again.');
    }
  };

  const handleWhatsappEmojiClick = (emoji) => {
    setWhatsappNewMessage(whatsappNewMessage + emoji);
    setShowWhatsappEmojiPicker(false);
  };

  const handleWhatsappFileUpload = async (event, fileType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setShowWhatsappFileMenu(false);

    if (!selectedProfile) {
      alert('Please select a lead to send the file to.');
      event.target.value = '';
      return;
    }

    const phone = getLeadWhatsappPhone(selectedProfile);
    if (!phone) {
      alert('Lead mobile / WhatsApp number not found.');
      event.target.value = '';
      return;
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 25MB. Please choose a smaller file.');
      event.target.value = '';
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      text: file.name,
      sender: 'agent',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: fileType,
      status: 'sending',
      mediaUrl: URL.createObjectURL(file),
      fileName: file.name
    };

    setWhatsappMessages(prev => [...prev, newMessage]);

    try {
      const formData = new FormData();
      if (fileType === 'audio') {
        formData.append('audio', file);
      } else {
        formData.append('file', file);
      }

      formData.append('to', phone);
      formData.append('candidateId', selectedProfile._id);
      formData.append('candidateName', getLeadContactName(selectedProfile));

      const endpoint = fileType === 'audio'
        ? `${backendUrl}/college/whatsapp/send-audio`
        : `${backendUrl}/college/whatsapp/send-file`;

      const response = await axios.post(endpoint, formData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setWhatsappMessages(prev =>
          prev.map(msg =>
            msg.id === tempId
              ? {
                ...msg,
                id: response.data.data.messageId,
                wamid: response.data.data.messageId,
                status: 'sent',
                mediaUrl: response.data.data.s3Url
              }
              : msg
          )
        );
        upsertChatToTop({
          phone,
          unreadCount: 0,
          lastMessageAt: new Date().toISOString(),
          lastMessage: {
            text: file.name,
            direction: 'outgoing',
            messageType: fileType,
            sentAt: new Date().toISOString(),
            status: 'sent'
          },
          lead: selectedProfile
        });
      }
    } catch (error) {
      console.error(`Error sending ${fileType}:`, error);
      setWhatsappMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'failed', errorMessage: error.response?.data?.message || 'Failed to send' }
            : msg
        )
      );
      alert(error.response?.data?.message || `Failed to send ${fileType}. Please try again.`);
    }

    event.target.value = '';
  };

  const handleWhatsappSelectTemplate = (template) => {
    setSelectedWhatsappTemplate(template);
    setShowWhatsappTemplateMenu(false);
  };

  const handleWhatsappSendTemplate = async () => {
    if (!selectedWhatsappTemplate) return;

    const phone = getLeadWhatsappPhone(selectedProfile);
    if (!phone) {
      alert('Phone number not found for this lead');
      return;
    }

    if (!selectedWhatsappTemplate.name) {
      alert('Template name is missing');
      return;
    }

    setIsSendingWhatsapp(true);

    try {
      if (!token) {
        alert('No token found in session storage.');
        return;
      }

      const templateBody = selectedWhatsappTemplate.components?.find(c => c.type === 'BODY')?.text || '';
      const variableMappings = selectedWhatsappTemplate?.variableMappings || [];
      const variableRegex = /\{\{(\d+)\}\}/g;
      const matches = [...templateBody.matchAll(variableRegex)];

      const variableValues = matches.map(match => {
        const position = parseInt(match[1], 10);
        if (variableMappings && variableMappings.length > 0) {
          const mapping = variableMappings.find(m => m.position === position);
          if (mapping) {
            return getB2bTemplateVariableValue(mapping.variableName);
          }
        }
        switch (position) {
          case 1: return getB2bTemplateVariableValue('name');
          case 2: return getB2bTemplateVariableValue('gender');
          case 3: return getB2bTemplateVariableValue('mobile');
          case 4: return getB2bTemplateVariableValue('email');
          case 5: return getB2bTemplateVariableValue('course_name');
          case 6: return getB2bTemplateVariableValue('counselor_name');
          case 7: return getB2bTemplateVariableValue('job_name');
          case 8: return getB2bTemplateVariableValue('project_name');
          case 9: return getB2bTemplateVariableValue('batch_name');
          case 10: return getB2bTemplateVariableValue('lead_owner_name');
          default: return '[Variable]';
        }
      });

      const sendindData = {
        templateName: selectedWhatsappTemplate.name,
        to: phone,
        candidateId: selectedProfile?._id,
        registrationId: selectedProfile?._id,
        collegeId: userData.college || userData.collegeId,
        variableValues
      };

      const response = await axios.post(`${backendUrl}/college/whatsapp/send-template`, sendindData, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        const generateFilledMessage = (templateText) => {
          if (!templateText) return '';
          let text = templateText;
          if (variableMappings && variableMappings.length > 0) {
            variableMappings.forEach(mapping => {
              const value = getB2bTemplateVariableValue(mapping.variableName);
              text = text.replace(new RegExp(`\\{\\{${mapping.position}\\}\\}`, 'g'), value);
            });
          } else {
            text = text.replace(/\{\{1\}\}/g, getB2bTemplateVariableValue('name'));
            text = text.replace(/\{\{2\}\}/g, getB2bTemplateVariableValue('gender'));
            text = text.replace(/\{\{3\}\}/g, getB2bTemplateVariableValue('mobile'));
            text = text.replace(/\{\{4\}\}/g, getB2bTemplateVariableValue('email'));
            text = text.replace(/\{\{5\}\}/g, getB2bTemplateVariableValue('course_name'));
            text = text.replace(/\{\{6\}\}/g, getB2bTemplateVariableValue('counselor_name'));
            text = text.replace(/\{\{7\}\}/g, getB2bTemplateVariableValue('job_name'));
            text = text.replace(/\{\{8\}\}/g, getB2bTemplateVariableValue('project_name'));
            text = text.replace(/\{\{9\}\}/g, getB2bTemplateVariableValue('batch_name'));
            text = text.replace(/\{\{10\}\}/g, getB2bTemplateVariableValue('lead_owner_name'));
          }
          return text;
        };

        const filledMessage = generateFilledMessage(templateBody);
        const templateMessage = {
          id: response.data.data.messageId || response.data.data._id || `msg-${Date.now()}`,
          dbId: response.data.data._id,
          wamid: response.data.data.messageId,
          whatsappMessageId: response.data.data.messageId,
          text: filledMessage || response.data.data.filledMessage || `Template: ${response.data.data.templateName}`,
          sender: 'agent',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: 'template',
          templateData: response.data.data.templateData || selectedWhatsappTemplate,
          status: 'sent',
          deliveredAt: null,
          readAt: null
        };

        setWhatsappMessages(prev => [...prev, templateMessage]);
        setSelectedWhatsappTemplate(null);
        setHasActiveSession(true);
        upsertChatToTop({
          phone,
          unreadCount: 0,
          lastMessageAt: new Date().toISOString(),
          lastMessage: {
            text: filledMessage || selectedWhatsappTemplate.name,
            direction: 'outgoing',
            messageType: 'template',
            sentAt: new Date().toISOString(),
            status: 'sent'
          },
          lead: selectedProfile
        });
      } else {
        throw new Error(response.data.message || 'Failed to send template');
      }
    } catch (error) {
      let errorMessage = 'Error sending template. Please try again.';
      if (error.response?.data?.error?.error_user_msg) {
        errorMessage = error.response.data.error.error_user_msg;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSendingWhatsapp(false);
    }
  };

  // Close WhatsApp menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showWhatsappTemplateMenu) {
        const templateButton = event.target.closest('.whatsapp-template-trigger');
        const templateMenu = event.target.closest('.whatsapp-template-menu');
        if (!templateButton && !templateMenu) {
          setShowWhatsappTemplateMenu(false);
        }
      }
      if (showWhatsappEmojiPicker) {
        const emojiButton = event.target.closest('.whatsapp-emoji-trigger');
        const emojiMenu = event.target.closest('.whatsapp-emoji-menu');
        if (!emojiButton && !emojiMenu) {
          setShowWhatsappEmojiPicker(false);
        }
      }
      if (showWhatsappFileMenu) {
        const fileButton = event.target.closest('.whatsapp-file-trigger');
        const fileMenu = event.target.closest('.whatsapp-file-menu');
        if (!fileButton && !fileMenu) {
          setShowWhatsappFileMenu(false);
        }
      }
    };

    if (showWhatsappTemplateMenu || showWhatsappEmojiPicker || showWhatsappFileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showWhatsappTemplateMenu, showWhatsappEmojiPicker, showWhatsappFileMenu]);

  // Fetch templates when WhatsApp panel opens
  useEffect(() => {
    if (showPanel === 'Whatsapp' && whatsappTemplates.length === 0) {
      fetchWhatsappTemplates();
    }
  }, [showPanel]);

  // Auto-scroll to bottom when WhatsApp panel opens, messages change, or template selected
  useEffect(() => {
    if (showPanel === 'Whatsapp' && whatsappMessagesEndRef.current) {
      whatsappMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showPanel, whatsappMessages, selectedWhatsappTemplate]);

  useEffect(() => {
    fetchWhatsappConversations(1, '');
  }, [fetchWhatsappConversations]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchWhatsappConversations(conversationPage, chatListSearch, true);
      }
    }, 12000);
    return () => clearInterval(timer);
  }, [fetchWhatsappConversations, conversationPage, chatListSearch]);

  useEffect(() => {
    if (!onWhatsappMessage) return undefined;
    const unsubscribe = onWhatsappMessage((message) => {
      if (message && (message.direction === 'incoming' || message.from)) {
        handleInboxIncomingMessage(message);
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [onWhatsappMessage, handleInboxIncomingMessage]);

  const openEditPanel = async (profile = null, panel, followUpType = null) => {
    // Check permission before opening panel
    if (profile && (panel === 'StatusChange' || panel === 'SetFollowup')) {
      if (!canUpdateLead(profile)) {
        alert('You do not have permission to update this lead. Only the lead owner, co-owner, or the person who added the lead can update it.');
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
        const newStatus = getLeadStatusId(profile);
        setSelectedStatus(String(newStatus || ''));
        setSelectedSubStatus(getLeadSubStatusObject(profile));
      }
      setShowPanel('editPanel')

    }
    else if (panel === 'SetFollowup') {
      setShowPopup(null)
      setFollowupFormData(prev => ({
        ...prev,
        followUpType: followUpType || prev.followUpType || 'Call',
        description: getFollowupDescription(followUpType || prev.followUpType),
      }));
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


  const closePanel = () => {
    if (showPanel === 'RefferAllLeads' || showPanel === 'bulkstatuschange') {
      setShowBulkInputs(false);
      setBulkMode('');
      setInput1Value('');
      setSelectedProfiles([]);
      resetBulkSelectionState();
    }
    if (showPanel === 'Whatsapp') {
      setWhatsappMessages([]);
      setWhatsappNewMessage('');
      setSelectedWhatsappTemplate(null);
      setShowWhatsappTemplateMenu(false);
      setShowWhatsappEmojiPicker(false);
      setShowWhatsappFileMenu(false);
      document.body.classList.remove('panel-open');
    }
    setShowPanel('');
    clearFollowupFormData();
    setShowPopup(null);
    clearFollowupFormData();
    setSelectedStatus(null)
    setSelectedSubStatus(null)
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
      resetBulkSelectionState();
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
            `${backendUrl}/college/b2b/refer-leads`,
            { counselorId: selectedConcernPerson, leadIds: selectedProfiles },
            { headers: { 'x-auth': token } }
          );

          if (bulkRes?.data?.status) {
            const modified = bulkRes?.data?.data?.modified;
            const okCount = typeof modified === 'number' ? modified : (selectedProfiles?.length || 0);
            alert(`Referred ${okCount} lead(s) successfully!`);
            await fetchLeads(selectedStatusFilter, currentPage, getLeadFetchOverrides());
            await fetchStatusCounts();
            await fetchMyReferLeadsCount();
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
              `${backendUrl}/college/b2b/refer-lead`,
              { counselorId: selectedConcernPerson, leadId: id, type: 'single' },
              { headers: { 'x-auth': token } }
            )
          )
        );

        const ok = results.filter((r) => r.status === 'fulfilled' && r.value?.data?.status).length;
        const failed = results.length - ok;

        if (ok > 0) {
          alert(`Referred ${ok} lead(s) successfully${failed ? `, ${failed} failed` : ''}.`);
          await fetchLeads(selectedStatusFilter, currentPage, getLeadFetchOverrides());
          await fetchStatusCounts();
          await fetchMyReferLeadsCount();
          closePanel();
          return;
        }

        alert('Failed to refer selected leads');
        return;
      }

      // Single refer
      const response = await axios.post(
        `${backendUrl}/college/b2b/refer-lead`,
        { counselorId: selectedConcernPerson, leadId: selectedProfile._id, type: 'single' },
        { headers: { 'x-auth': token } }
      );

      if (response?.data?.status) {
        alert('Lead referred successfully!');
        await fetchLeads(selectedStatusFilter, currentPage, getLeadFetchOverrides());
        await fetchStatusCounts();
        await fetchMyReferLeadsCount();
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

  const togglePopup = (profileIndex) => {
    setShowPopup(prev => (prev === profileIndex ? null : profileIndex));
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
    const isBulkStatusPanel = showPanel === 'bulkstatuschange';

    const panelContent = (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className={`fas ${isBulkStatusPanel ? 'fa-tasks' : 'fa-edit'} text-primary`}></i>
            </div>
            <h6 className="mb-0 fw-medium text-primary">
              {isBulkStatusPanel
                ? 'Bulk Status Change'
                : `Change Status for ${selectedProfile?.businessName || 'Lead'}`}
            </h6>
          </div>
          <div className='d-flex align-items-center'>
            {userData.googleAuthToken?.accessToken && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm me-2 google-btn"
                onClick={handleGoogleLogout}
              >
                Disconnect Google Calendar
              </button>
            )}
            <button className="btn-close" type="button" onClick={closePanel}></button>
          </div>
        </div>

        <div className="card-body">
          {userData.googleAuthToken?.accessToken && !isgoogleLoginLoading ? (
            <form onSubmit={addFollowUpToGoogleCalendar}>
              {isBulkStatusPanel && (
                <p className="text-muted small mb-3">
                  Selected leads: <strong>{selectedProfiles?.length || 0}</strong>
                  {selectedProfiles?.length === 0 && (
                    <span className="d-block mt-1">Enter a number in Input 1 above to select leads.</span>
                  )}
                </p>
              )}
              {/* Status Selection */}
              <div className="mb-3">
                <label htmlFor="status" className="form-label small fw-medium text-dark">
                  Status<span className="text-danger">*</span>
                </label>
                <select
                  className="form-select border-0 bgcolor"
                  id="status"
                  value={seletectedStatus}
                  style={{
                    height: '42px',
                    paddingTop: '8px',
                    paddingInline: '10px',
                    width: '100%',
                    backgroundColor: '#f1f2f6'
                  }}
                  onChange={handleStatusChange}
                  required
                >
                  <option value="">Select Status</option>
                  {[...(statuses || [])]
                    .sort((a, b) =>
                      String(a?.name || a?.title || '').localeCompare(String(b?.name || b?.title || ''), undefined, {
                        sensitivity: 'base',
                        numeric: true,
                      })
                    )
                    .map((status) => (
                      <option key={status._id} value={status._id}>{status.name}</option>
                    ))}
                </select>
              </div>

              {/* Sub-Status Selection */}
              <div className="mb-3">
                <label htmlFor="subStatus" className="form-label small fw-medium text-dark">
                  Sub-Status<span className="text-danger">*</span>
                </label>
                <select
                  className="form-select border-0 bgcolor"
                  id="subStatus"
                  value={seletectedSubStatus?._id || ''}
                  style={{
                    height: '42px',
                    paddingTop: '8px',
                    backgroundColor: '#f1f2f6',
                    paddingInline: '10px',
                    width: '100%'
                  }}
                  onChange={handleSubStatusChange}
                  required
                >
                  <option value="">Select Sub-Status</option>
                  {[...(subStatuses || [])]
                    .sort((a, b) =>
                      String(a?.title || a?.name || '').localeCompare(String(b?.title || b?.name || ''), undefined, {
                        sensitivity: 'base',
                        numeric: true,
                      })
                    )
                    .map((subStatus) => (
                      <option key={subStatus._id} value={subStatus._id}>{subStatus.title}</option>
                    ))}
                </select>
              </div>

              {/* Follow-up Section (if substatus has followup) */}
              {seletectedSubStatus && seletectedSubStatus.hasFollowup && (
                <div className="mb-3">
                  <h6 className="text-dark mb-2">Follow-up Details</h6>
                  <div className="row">
                    <div className="col-6 ps-3">
                      <label htmlFor="nextActionDate" className="form-label small fw-medium text-dark">
                        Next Action Date <span className="text-danger">*</span>
                      </label>
                      <DatePicker
                        className="form-control border-0 bgcolor small-date"
                        onChange={(date) => setFollowupFormData(prev => ({ ...prev, followupDate: date }))}
                        value={followupFormData.followupDate}
                        format="dd/MM/yyyy"
                        minDate={today}
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="actionTime" className="form-label small fw-medium text-dark">
                        Time <span className="text-danger">*</span>
                      </label>
                      <input
                        type="time"
                        className="form-control border-0 bgcolor"
                        id="actionTime"
                        onChange={(e) => setFollowupFormData(prev => ({ ...prev, followupTime: e.target.value }))}
                        value={followupFormData.followupTime}
                        style={{ backgroundColor: '#f1f2f6', height: '42px', paddingInline: '10px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks Section - Only show if substatus has hasRemarks: true */}
              {seletectedSubStatus && seletectedSubStatus.hasRemarks && (
                <div className="mb-3">
                  <label htmlFor="remarks" className="form-label small fw-medium text-dark">
                    Remarks <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control border-0 bgcolor"
                    id="remarks"
                    rows="4"
                    onChange={(e) => setFollowupFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    value={followupFormData.remarks}
                    placeholder="Enter remarks about this status change..."
                    style={{ resize: 'none', backgroundColor: '#f1f2f6' }}
                    required
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closePanel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn updateStatus"
                  disabled={
                    (isBulkStatusPanel && !selectedProfiles?.length) ||
                    !seletectedStatus ||
                    !seletectedSubStatus?._id
                  }
                >
                  {isBulkStatusPanel ? 'Update Bulk Status' : 'Update Status'}
                </button>
              </div>
            </form>
          ) : !isgoogleLoginLoading && (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <button className="btn googleLogin" onClick={handleGoogleLogin}>
                  Login with Google to Update Status
                </button>
              </div>
            </div>
          )}

          {isgoogleLoginLoading && (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
            </div>
          )}
        </div>
      </div>
    );

    if (isMobile) {
      return (showPanel === 'editPanel' || showPanel === 'bulkstatuschange') ? (
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

    return (showPanel === 'editPanel' || showPanel === 'bulkstatuschange') ? (
      <div className="col-12 transition-col" id="statusChangePanel">
        {panelContent}
      </div>
    ) : null;
  };

  // Render Follow-up Panel
  const renderFollowupPanel = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm" style={{
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom" style={{
          borderRadius: '12px 12px 0 0',
          borderBottom: '2px solid #f8f9fa',
          backgroundColor: '#f8f9fa'
        }}>
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-calendar-plus text-success" style={{ fontSize: '18px' }}></i>
            </div>
            <h6 className="mb-0 fw-medium text-success" style={{ fontSize: '16px', fontWeight: '600' }}>
              Set Follow-up for {selectedProfile?.businessName || 'Lead'}
            </h6>
          </div>
          <div class="d-flex align-item-center">
            {userData.googleAuthToken?.accessToken && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm me-2 google-btn"
                onClick={handleGoogleLogout}
                style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '999px'
                }}
              >
                Disconnect Google Calendar
              </button>
            )}
            <button className="btn-close" type="button" onClick={closePanel} style={{
              fontSize: '14px',
              padding: '4px',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f9fa',
              border: 'none',
              color: '#6c757d'
            }}></button>
          </div>
        </div>

        <div className="card-body" style={{ padding: '24px' }}>
          {userData.googleAuthToken?.accessToken && !isgoogleLoginLoading ? (
            <form onSubmit={addFollowUpToGoogleCalendar}>
              {/* Follow-up Date and Time */}
              <div className="row mb-4">
                <div className="col-6">
                  <label htmlFor="nextActionDate" className="form-label small fw-medium text-dark" style={{ fontSize: '13px', marginBottom: '8px' }}>
                    Follow-up Date <span className="text-danger">*</span>
                  </label>
                  <DatePicker
                    className="form-control border-0 bgcolor"
                    onChange={(date) => setFollowupFormData(prev => ({ ...prev, followupDate: date }))}
                    value={followupFormData.followupDate}
                    format="dd/MM/yyyy"
                    minDate={today}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #ced4da',
                      borderRadius: '8px',
                      height: '42px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
                <div className="col-6">
                  <label htmlFor="actionTime" className="form-label small fw-medium text-dark" style={{ fontSize: '13px', marginBottom: '8px' }}>
                    Time <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    className="form-control border-0 bgcolor"
                    id="actionTime"
                    onChange={(e) => setFollowupFormData(prev => ({ ...prev, followupTime: e.target.value }))}
                    value={followupFormData.followupTime}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #ced4da',
                      borderRadius: '8px',
                      height: '42px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <label htmlFor="followupRemarks" className="form-label small fw-medium text-dark" style={{ fontSize: '13px', marginBottom: '8px' }}>
                    Follow-up Notes
                  </label>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        const suggestion = buildFollowupNotesSuggestion({
                          followupFormData,
                          selectedProfile,
                          seletectedStatus,
                          seletectedSubStatus,
                          statuses
                        });
                        setFollowupFormData((prev) => ({
                          ...prev,
                          remarks: prev.remarks ? `${prev.remarks}\n\n${suggestion}` : suggestion
                        }));
                      }}
                    >
                      AI Suggest
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={summarizeFollowupNotes}
                      disabled={notesAI.loading}
                      title="Summarize the current Follow-up Notes with AI"
                    >
                      {notesAI.loading ? 'Summarizing...' : 'AI Summarize'}
                    </button>
                  </div>
                </div>
                <textarea
                  className="form-control border-0 bgcolor"
                  id="followupRemarks"
                  rows="4"
                  onChange={(e) => setFollowupFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  value={followupFormData.remarks}
                  placeholder="Enter follow-up notes..."
                  style={{
                    resize: 'none',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #ced4da',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    minHeight: '100px'
                  }}
                />
                {notesAI.error ? (
                  <div className="text-danger small mt-2">{notesAI.error}</div>
                ) : null}
                {notesAI.data ? (
                  <div className="mt-3 p-3" style={{ border: '1px solid #e9ecef', borderRadius: '10px', background: '#f8fafc' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="fw-semibold">AI Summary (from Notes)</div>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() => {
                            const block = [
                              notesAI.data?.summary ? `Summary:\n${notesAI.data.summary}` : '',
                              Array.isArray(notesAI.data?.nextActions) && notesAI.data.nextActions.length
                                ? `Next actions:\n- ${notesAI.data.nextActions.join('\n- ')}`
                                : '',
                              notesAI.data?.entities?.requirements?.length
                                ? `Requirements:\n- ${notesAI.data.entities.requirements.join('\n- ')}`
                                : '',
                              notesAI.data?.entities?.budget ? `Budget: ${notesAI.data.entities.budget}` : '',
                              notesAI.data?.entities?.timeline ? `Timeline: ${notesAI.data.entities.timeline}` : '',
                              notesAI.data?.entities?.decisionMaker ? `Decision maker: ${notesAI.data.entities.decisionMaker}` : '',
                              notesAI.data?.entities?.location ? `Location: ${notesAI.data.entities.location}` : '',
                              Array.isArray(notesAI.data?.objections) && notesAI.data.objections.length
                                ? `Objections:\n- ${notesAI.data.objections.join('\n- ')}`
                                : '',
                              String(notesAI.data?.suggestedReply || '').trim()
                                ? `Suggested reply:\n${String(notesAI.data.suggestedReply || '').trim()}`
                                : ''
                            ].filter(Boolean).join('\n\n');

                            setFollowupFormData((prev) => ({
                              ...prev,
                              remarks: block
                            }));
                          }}
                        >
                          Add to Notes
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setNotesAI((prev) => ({ ...prev, data: null, error: '' }))}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    {notesAI.data?.summary ? (
                      <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{notesAI.data.summary}</div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-3 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closePanel}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderWidth: '1.5px',
                    minWidth: '100px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: '#28a745',
                    borderColor: '#28a745',
                    minWidth: '120px',
                    boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)'
                  }}
                >
                  Set Follow-up
                </button>
              </div>
            </form>
          ) : !isgoogleLoginLoading && (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <button className="btn btn-primary" onClick={handleGoogleLogin}>
                  Login with Google to Set Follow-up
                </button>
              </div>
            </div>
          )}

          {isgoogleLoginLoading && (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
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

  // Render Reffer Panel (Desktop Sidebar or Mobile Modal)

  const renderRefferPanel = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-user-edit text-secondary"></i>
            </div>
            <h6 className="mb-0 followUp fw-medium">
              {showPanel === 'Reffer' && (`Refer Lead ${selectedProfile?.businessName || 'Unknown'} to Counselor`)}
              {showPanel === 'RefferAllLeads' && (`Refer All Leads to Counselor`)}
            </h6>
          </div>
          <div>
            <button className="btn-close" type="button" onClick={closePanel}>
              {/* <i className="fa-solid fa-xmark"></i> */}
            </button>
          </div>
        </div>

        <div className="card-body">
          <form>


            <>

              {/* NEW COUNSELOR SELECT DROPDOWN */}
              <div className="mb-1">
                <label htmlFor="counselor" className="form-label small fw-medium text-dark">
                  Select Counselor<span className="text-danger">*</span>
                </label>
                <div className="d-flex">
                  <div className="form-floating flex-grow-1">
                    <select
                      className="form-select border-0  bgcolor"
                      id="counselor"
                      style={{
                        height: '42px',
                        paddingTop: '8px',
                        paddingInline: '10px',
                        width: '100%',
                        backgroundColor: '#f1f2f6'
                      }}
                      onChange={handleConcernPersonChange}
                    >
                      <option value="">Select Counselor</option>
                      {users.map((counselor, index) => (
                        <option key={index} value={counselor._id}>{counselor.name}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            </>

            {/* Bulk refer info (selection happens from the bulk bar above the cards) */}
            {showPanel === 'RefferAllLeads' && (
              <div className="mb-3 p-2 bg-light rounded" style={{ fontSize: '13px' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">
                    <i className="fas fa-users me-1"></i>
                    Selected Leads:
                  </span>
                  <span className="fw-semibold text-primary">
                    {selectedProfiles?.length || 0}
                  </span>
                </div>
                <small className="text-muted d-block mt-1">
                  Type a number in the bulk bar above the lead cards to auto-select.
                </small>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn"
                style={{ border: '1px solid #ddd', padding: '8px 24px', fontSize: '14px' }}
                onClick={closePanel}
              >
                CLOSE
              </button>
              <button
                type="button"
                className="btn text-white"
                onClick={(e) => handleReferLead(e)}
                disabled={
                  !selectedConcernPerson ||
                  (showPanel === 'RefferAllLeads' && (selectedProfiles.length === 0 && !input1Value))
                }
                style={{
                  background: (!selectedConcernPerson || (showPanel === 'RefferAllLeads' && selectedProfiles.length === 0 && !input1Value)) ? '#ccc' : 'linear-gradient(135deg, #fc567b 13%, #fc567b 50%)',
                  border: 'none',
                  padding: '8px 24px',
                  fontSize: '14px',
                  cursor: (!selectedConcernPerson || (showPanel === 'RefferAllLeads' && selectedProfiles.length === 0 && !input1Value)) ? 'not-allowed' : 'pointer'
                }}
              >
                {showPanel === 'Reffer' ? 'REFER LEAD' : 'REFER BULK LEAD'}
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
      const response = await axios.get(`${backendUrl}/college/b2b/leads/${leadId}/logs`, {
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

// Render WhatsApp Panel (embedded in inbox layout)
const renderWhatsAppPanel = () => {
  if (showPanel !== 'Whatsapp' || !selectedProfile) return null;

  return (
    <div className="d-flex flex-column h-100" style={{ height: '100%', backgroundColor: '#efeae2' }} id="whatsappPanel">
      {/* WhatsApp Header */}
      <div style={{ padding: '10px 16px', position: 'relative', minHeight: 60, background: '#f0f2f5', borderBottom: '1px solid #e9edef' }}>

        <div className="d-flex align-items-center">
          {isMobile ? (
            <button
              type="button"
              className="btn btn-link text-decoration-none me-1 p-1"
              onClick={closePanel}
              style={{ color: '#54656f' }}
              title="Back"
            >
              <i className="fas fa-arrow-left" />
            </button>
          ) : null}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{
              width: '40px',
              height: '40px',
              fontSize: '14px',
              fontWeight: '700',
              background: '#dfc5f7',
              color: '#1f2c34',
              flexShrink: 0
            }}
          >
            {(getLeadContactName(selectedProfile)?.charAt(0) || 'L').toUpperCase()}
          </div>
          <div className="flex-grow-1 overflow-hidden">
            <h6 className="mb-0 fw-semibold text-truncate" style={{ fontSize: '16px', color: '#111b21' }}>
              {getLeadContactName(selectedProfile) || 'N/A'}
            </h6>
            <p className="mb-0 text-truncate" style={{ fontSize: '13px', color: '#667781' }}>
              {getLeadWhatsappPhone(selectedProfile) || 'N/A'}
              {sessionWindow.isOpen ? (
                <span className="ms-2" style={{ color: '#0A6E44', fontSize: 11 }}>
                  · {sessionCountdown} left
                </span>
              ) : (
                <span className="ms-2" style={{ color: '#856404', fontSize: 11 }}>
                  · No active window
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-link text-decoration-none p-1"
            onClick={closePanel}
            style={{ color: '#54656f' }}
            title="Close chat"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-grow-1 overflow-auto p-3"
        style={{
          backgroundColor: '#efeae2',
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='%23efeae2'/%3E%3Cpath d='M30 0L0 30h60L30 0z' fill='%23e5ddd5' fill-opacity='0.4'/%3E%3C/svg%3E\")",
          minHeight: 0
        }}
      >
        {/* Loading State */}
        {isLoadingChatHistory && (
          <div className="d-flex justify-content-center align-items-center h-100">
            <div className="text-center">
              <div className="spinner-border text-success mb-2" role="status" style={{ width: '40px', height: '40px' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p style={{ color: '#667781', fontSize: '14px' }}>Loading chat history...</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {!isLoadingChatHistory && whatsappMessages.map(message => (
          <div key={message.id} className={`d-flex mb-2 ${message.sender === 'agent' ? 'justify-content-end' : 'justify-content-start'}`}>
            <div style={{ maxWidth: message.type === 'template' ? '85%' : '75%' }}>
              <div
                className={`${message.sender === 'agent'
                  ? 'text-white'
                  : 'bg-white text-dark'
                  }`}
                style={{
                  backgroundColor: message.sender === 'agent' ? '#DCF8C6' : '#FFFFFF',
                  color: message.sender === 'agent' ? '#000' : '#000',
                  borderRadius: '8px',
                  borderBottomRightRadius: message.sender === 'agent' ? '2px' : '8px',
                  borderBottomLeftRadius: message.sender === 'lead' ? '2px' : '8px',
                  boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                  padding: message.type === 'template' ? '6px 10px 8px' : '6px 10px 8px',
                  overflow: 'hidden'
                }}
              >
                {/* Render template message with components */}
                {message.type === 'template' && message.templateData ? (
                  <>
                    {renderTemplateMessage(message.templateData, true)}
                    <div
                      className="d-flex align-items-center justify-content-end"
                      style={{
                        fontSize: '11px',
                        color: '#667781',
                        marginTop: '4px'
                      }}
                    >
                      <span>{message.time}</span>
                      {message.sender === 'agent' && renderMessageStatus(message.status)}
                    </div>
                  </>
                ) : (
                  /* Regular text/media message */
                  <>
                    {/* Render media if present */}
                    {message.mediaUrl && message.type === 'image' && (
                      <img
                        src={message.mediaUrl}
                        alt="Shared image"
                        style={{
                          maxWidth: '100%',
                          borderRadius: '8px',
                          marginBottom: message.text !== '[Image]' ? '8px' : '0',
                          display: 'block'
                        }}
                      />
                    )}
                    {message.mediaUrl && message.type === 'video' && (
                      <video
                        controls
                        style={{
                          maxWidth: '100%',
                          borderRadius: '8px',
                          marginBottom: message.text !== '[Video]' ? '8px' : '0',
                          display: 'block'
                        }}
                      >
                        <source src={message.mediaUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                    {message.mediaUrl && message.type === 'audio' && (
                      <audio
                        controls
                        style={{
                          width: '100%',
                          marginBottom: '4px'
                        }}
                      >
                        <source src={message.mediaUrl} type="audio/mpeg" />
                        Your browser does not support the audio tag.
                      </audio>
                    )}
                    {message.mediaUrl && message.type === 'document' && (
                      <a
                        href={message.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="d-flex align-items-center text-decoration-none"
                        style={{
                          padding: '8px',
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          borderRadius: '4px',
                          marginBottom: '4px'
                        }}
                      >
                        <i className="fas fa-file-pdf me-2" style={{ fontSize: '20px', color: '#DC3545' }}></i>
                        <span style={{ fontSize: '13px', color: '#000' }}>{message.text}</span>
                      </a>
                    )}

                    {/* Render text if it's not a default placeholder */}
                    {message.text && !['[Image]', '[Video]', '[Audio]', '[Document]'].includes(message.text) && (
                      <p className="mb-0" style={{ fontSize: '14px', lineHeight: '1.4', wordWrap: 'break-word' }}>
                        {message.text}
                      </p>
                    )}

                    <div
                      className="d-flex align-items-center justify-content-end"
                      style={{
                        fontSize: '11px',
                        color: '#667781',
                        marginTop: '4px'
                      }}
                    >
                      <span>{message.time}</span>
                      {message.sender === 'agent' && renderMessageStatus(message.status)}
                    </div>
                  </>
                )}
              </div>
              {message.sender === 'agent' && message.type === 'template' && (
                <p className="text-muted text-end mb-0 mt-1" style={{ fontSize: '10px', fontStyle: 'italic' }}>
                  <i className="fas fa-file-alt me-1"></i>Template Message
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Selected Template Preview in Chat */}
        {selectedWhatsappTemplate && (
          <div className="d-flex justify-content-end mb-3" style={{ animation: 'slideInFromRight 0.3s ease-out' }}>
            <div style={{ maxWidth: '85%', minWidth: '300px' }}>
              <div
                className="rounded-3 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3), 0 3px 10px rgba(0,0,0,0.15)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  position: 'relative'
                }}
              >
                {/* Decorative gradient overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                  pointerEvents: 'none'
                }}></div>

                {/* Header */}
                <div className="d-flex align-items-center justify-content-between p-3" style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  borderBottom: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-2"
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      <i className="fas fa-file-alt" style={{ color: '#667eea', fontSize: '14px' }}></i>
                    </div>
                    <div>
                      <p className="mb-0" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        WhatsApp Template
                      </p>
                      <p className="mb-0" style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>
                        {selectedWhatsappTemplate.name}
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-sm p-0"
                    onClick={() => setSelectedWhatsappTemplate(null)}
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      borderRadius: '50%',
                      color: '#fff',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.35)';
                      e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                      e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                    }}
                    title="Remove Template"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                {/* Content */}
                <div className="p-3" style={{ backgroundColor: '#fff', position: 'relative' }}>
                  {/* Category Badge */}
                  <div className="mb-2">
                    <span className="badge" style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      fontSize: '10px',
                      padding: '5px 12px',
                      fontWeight: '600',
                      borderRadius: '20px',
                      letterSpacing: '0.3px'
                    }}>
                      <i className="fas fa-tag me-1" style={{ fontSize: '9px' }}></i>
                      {selectedWhatsappTemplate.category}
                    </span>
                  </div>

                  {/* Template Content */}
                  <div
                    className="rounded-3 p-3 mb-2"
                    style={{
                      backgroundColor: '#f8f9fa',
                      border: '2px solid #e9ecef',
                      borderLeft: '4px solid #667eea',
                      position: 'relative'
                    }}
                  >
                    {(() => {
                      const components = selectedWhatsappTemplate.components || [];

                      // Check if it's a carousel template
                      const carouselComponent = components.find(c => c.type === 'CAROUSEL');
                      if (carouselComponent && carouselComponent.cards) {
                        return (
                          <div>
                            {/* Carousel Body Text (if exists outside carousel) */}
                            {(() => {
                              const bodyComp = components.find(c => c.type === 'BODY');
                              if (bodyComp && bodyComp.text) {
                                return (
                                  <p className="mb-3" style={{
                                    fontSize: '13px',
                                    color: '#2c3e50',
                                    fontWeight: '500'
                                  }}>
                                    {bodyComp.text}
                                  </p>
                                );
                              }
                            })()}

                            <p className="mb-2 small fw-semibold" style={{ color: '#667eea' }}>
                              <i className="fas fa-images me-1"></i>
                              Carousel ({carouselComponent.cards.length} cards)
                            </p>

                            <div style={{
                              display: 'flex',
                              gap: '12px',
                              overflowX: 'auto',
                              paddingBottom: '10px',
                              scrollbarWidth: 'thin'
                            }}>
                              {carouselComponent.cards.map((card, idx) => {
                                const cardHeader = card.components.find(c => c.type === 'HEADER');
                                const cardBody = card.components.find(c => c.type === 'BODY');
                                const cardButtons = card.components.find(c => c.type === 'BUTTONS');
                                const imageUrl = cardHeader?.example?.header_handle?.[0];

                                return (
                                  <div key={idx} style={{
                                    minWidth: '200px',
                                    maxWidth: '200px',
                                    border: '2px solid #dee2e6',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    backgroundColor: '#fff',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                  }}>
                                    {imageUrl && (
                                      <>
                                        <img
                                          src={imageUrl}
                                          alt={`Card ${idx + 1}`}
                                          style={{
                                            width: '100%',
                                            height: '150px',
                                            objectFit: 'cover'
                                          }}
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextElementSibling.style.display = 'flex';
                                          }}
                                        />
                                        <div style={{
                                          display: 'none',
                                          height: '150px',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          backgroundColor: '#e9ecef',
                                          fontSize: '48px'
                                        }}>
                                          Ã°Å¸â€“Â¼Ã¯Â¸Â
                                        </div>
                                      </>
                                    )}
                                    <div style={{ padding: '12px' }}>
                                      <p className="mb-2" style={{
                                        fontSize: '12px',
                                        lineHeight: '1.4',
                                        color: '#2c3e50'
                                      }}>
                                        {(() => {
                                          // Get candidate data for variable replacement
                                          const candidate = selectedProfile?._candidate;
                                          const registration = selectedProfile;

                                          // Replace variables with actual candidate data
                                          let text = cardBody?.text || '';

                                          // Replace {{1}} with name
                                          text = text.replace(/\{\{1\}\}/g, candidate?.name || registration?.name || 'User');

                                          // Replace {{2}} with gender
                                          text = text.replace(/\{\{2\}\}/g, candidate?.gender || 'Male');

                                          // Replace {{3}} with mobile
                                          text = text.replace(/\{\{3\}\}/g, candidate?.mobile || registration?.mobile || 'Mobile');

                                          // Replace {{4}} with email
                                          text = text.replace(/\{\{4\}\}/g, candidate?.email || registration?.email || 'Email');

                                          // Replace {{5}} with course name
                                          text = text.replace(/\{\{5\}\}/g, candidate?.appliedCourses?.[0]?.courseName || 'Course Name');

                                          // Replace {{6}} with counselor name
                                          text = text.replace(/\{\{6\}\}/g, selectedProfile?.counsellor?.name || selectedProfile?.leadAssignment?.[selectedProfile?.leadAssignment?.length - 1]?.counsellorName || 'Counselor not assigned');

                                          // Replace {{7}} with job name
                                          text = text.replace(/\{\{7\}\}/g, selectedProfile?._job?.title || 'Job Title');

                                          // Replace {{8}} with project name (college name)
                                          text = text.replace(/\{\{8\}\}/g, candidate?._college?.name || 'Project Name');

                                          // Replace {{9}} with batch name
                                          text = text.replace(/\{\{9\}\}/g, selectedProfile?._batch?.name || 'Batch Not Assigned');

                                          // Replace {{10}} with lead owner name
                                          text = text.replace(/\{\{10\}\}/g, selectedProfile?.registeredBy?.name || 'Self Registered');

                                          return text;
                                        })()}
                                      </p>
                                      {cardButtons?.buttons && cardButtons.buttons.length > 0 && (
                                        <div style={{
                                          borderTop: '1px solid #dee2e6',
                                          paddingTop: '8px',
                                          marginTop: '8px'
                                        }}>
                                          {cardButtons.buttons.map((btn, bidx) => (
                                            <div
                                              key={bidx}
                                              style={{
                                                padding: '6px',
                                                marginBottom: '4px',
                                                textAlign: 'center',
                                                fontSize: '11px',
                                                color: '#007bff',
                                                fontWeight: '500'
                                              }}
                                            >
                                              {btn.type === 'QUICK_REPLY' && ' '}
                                              {btn.text}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // Regular template with header (image/video), body, footer, buttons
                      const headerComponent = components.find(c => c.type === 'HEADER');
                      const bodyComponent = components.find(c => c.type === 'BODY');
                      const footerComponent = components.find(c => c.type === 'FOOTER');
                      const buttonsComponent = components.find(c => c.type === 'BUTTONS');

                      return (
                        <div>
                          {/* Header - Image or Video */}
                          {headerComponent && headerComponent.format === 'IMAGE' && headerComponent.example?.header_handle?.[0] && (
                            <div style={{ marginBottom: '12px', marginLeft: '-12px', marginRight: '-12px', marginTop: '-12px' }}>
                              <img
                                src={headerComponent.example.header_handle[0]}
                                alt="Template header"
                                style={{
                                  width: '100%',
                                  maxHeight: '200px',
                                  objectFit: 'cover',
                                  borderRadius: '12px 12px 0 0'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                              <div style={{
                                display: 'none',
                                height: '200px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#e9ecef',
                                fontSize: '64px'
                              }}>
                                Ã°Å¸â€“Â¼Ã¯Â¸Â
                              </div>
                            </div>
                          )}

                          {headerComponent && headerComponent.format === 'VIDEO' && headerComponent.example?.header_handle?.[0] && (
                            <div style={{ marginBottom: '12px', marginLeft: '-12px', marginRight: '-12px', marginTop: '-12px' }}>
                              <video
                                src={headerComponent.example.header_handle[0]}
                                controls
                                style={{
                                  width: '100%',
                                  maxHeight: '200px',
                                  borderRadius: '12px 12px 0 0',
                                  backgroundColor: '#000'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                              <div style={{
                                display: 'none',
                                height: '200px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#000',
                                color: '#fff',
                                fontSize: '64px'
                              }}>
                                Ã°Å¸Å½Â¥
                              </div>
                            </div>
                          )}

                          {headerComponent && headerComponent.format === 'TEXT' && (
                            <p className="mb-2 fw-bold" style={{ fontSize: '14px', color: '#1a1a1a' }}>
                              {headerComponent.text}
                            </p>
                          )}

                          {/* Body */}
                          {bodyComponent && (
                            <p className={headerComponent?.format === 'IMAGE' || headerComponent?.format === 'VIDEO' ? 'mt-3 mb-2' : 'mb-2'} style={{
                              fontSize: '13px',
                              color: '#2c3e50',
                              lineHeight: '1.6',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {(() => {
                                // Get candidate data for variable replacement
                                const candidate = selectedProfile?._candidate;
                                const registration = selectedProfile;

                                // Get template variable mappings from selectedWhatsappTemplate
                                const variableMappings = selectedWhatsappTemplate?.variableMappings || [];

                                // Replace variables with actual candidate data using stored mappings
                                let text = bodyComponent.text || '';

                                if (variableMappings && variableMappings.length > 0) {
                                  // Use stored variable mappings from database

                                  variableMappings.forEach(mapping => {
                                    const position = mapping.position;
                                    const variableName = mapping.variableName;

                                    // Get value based on actual variable name from mapping
                                    let value = '';

                                    switch (variableName) {
                                      case 'name':
                                        value = candidate?.name || registration?.concernPersonName || registration?.businessName || registration?.name || 'User';
                                        break;
                                      case 'gender':
                                        value = candidate?.gender || 'NA';
                                        break;
                                      case 'mobile':
                                        value = candidate?.mobile || registration?.whatsapp || registration?.mobile || 'Mobile';
                                        break;
                                      case 'email':
                                        value = candidate?.email || registration?.email || 'Email';
                                        break;
                                      case 'course_name':
                                        value = selectedProfile?._course?.name || selectedProfile?.b2bProject?.name || selectedProfile?.typeOfB2B?.name || 'Course Name';
                                        break;
                                      case 'counselor_name':
                                        value = selectedProfile?.counsellor?.name || selectedProfile?.leadOwner?.name || selectedProfile?.leadAssignment?.[selectedProfile?.leadAssignment?.length - 1]?.counsellorName || 'Counselor not assigned';
                                        break;
                                      case 'job_name':
                                        value = selectedProfile?._job?.title || selectedProfile?.designation || 'Job Title';
                                        break;
                                      case 'project_name':
                                        value = selectedProfile?._project?.name || selectedProfile?.b2bProject?.name || selectedProfile?.businessName || 'Project Name';
                                        break;
                                      case 'batch_name':
                                        value = selectedProfile?._batch?.name || selectedProfile?.b2bDepartment?.name || 'Batch Not Assigned';
                                        break;
                                      case 'lead_owner_name':
                                        value = selectedProfile?.registeredBy?.name || selectedProfile?.leadOwner?.name || selectedProfile?.leadAddedBy?.name || 'Self Registered';
                                        break;
                                      default:
                                        // Try direct property access
                                        value = candidate?.[variableName] || registration?.[variableName] || `[${variableName}]`;
                                        break;
                                    }

                                    // Replace the numbered variable with actual value
                                    text = text.replace(new RegExp(`\\{\\{${position}\\}\\}`, 'g'), value);

                                  });
                                } else {
                                  text = text.replace(/\{\{1\}\}/g, candidate?.name || registration?.concernPersonName || registration?.businessName || registration?.name || 'User');

                                  text = text.replace(/\{\{2\}\}/g, candidate?.gender || 'NA');

                                  text = text.replace(/\{\{3\}\}/g, candidate?.mobile || registration?.whatsapp || registration?.mobile || 'Mobile');

                                  text = text.replace(/\{\{4\}\}/g, candidate?.email || registration?.email || 'Email');

                                  text = text.replace(/\{\{5\}\}/g, candidate?.appliedCourses?.[0]?.courseName || selectedProfile?.b2bProject?.name || selectedProfile?.typeOfB2B?.name || 'Course Name');

                                  // Replace {{6}} with counselor name
                                  text = text.replace(/\{\{6\}\}/g, selectedProfile?.counsellor?.name || selectedProfile?.leadOwner?.name || selectedProfile?.leadAssignment?.[selectedProfile?.leadAssignment?.length - 1]?.counsellorName || 'Counselor not assigned');

                                  // Replace {{7}} with job name
                                  text = text.replace(/\{\{7\}\}/g, selectedProfile?._job?.title || selectedProfile?.designation || 'Job Title');

                                  // Replace {{8}} with project name (college name)
                                  text = text.replace(/\{\{8\}\}/g, selectedProfile?._project?.name || selectedProfile?.b2bProject?.name || selectedProfile?.businessName || 'Project Name');

                                  // Replace {{9}} with batch name
                                  text = text.replace(/\{\{9\}\}/g, selectedProfile?._batch?.name || selectedProfile?.b2bDepartment?.name || 'Batch Not Assigned');

                                  // Replace {{10}} with lead owner name
                                  text = text.replace(/\{\{10\}\}/g, selectedProfile?.registeredBy?.name || selectedProfile?.leadOwner?.name || selectedProfile?.leadAddedBy?.name || 'Self Registered');
                                }

                                return text;
                              })()}
                            </p>
                          )}

                          {/* Footer */}
                          {footerComponent && (
                            <p className="mb-2" style={{
                              fontSize: '11px',
                              color: '#6b7280',
                              fontStyle: 'italic'
                            }}>
                              {footerComponent.text}
                            </p>
                          )}

                          {/* Buttons */}
                          {buttonsComponent && buttonsComponent.buttons && buttonsComponent.buttons.length > 0 && (
                            <div style={{
                              marginTop: '12px',
                              paddingTop: '12px',
                              borderTop: '1px solid #dee2e6'
                            }}>
                              {buttonsComponent.buttons.map((button, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: '8px 12px',
                                    marginBottom: '6px',
                                    textAlign: 'center',
                                    fontSize: '12px',
                                    color: '#007bff',
                                    border: '1px solid #007bff',
                                    borderRadius: '6px',
                                    backgroundColor: '#fff',
                                    fontWeight: '500',
                                    cursor: 'default'
                                  }}
                                >
                                  {button.type === 'QUICK_REPLY' && ' '}
                                  {button.type === 'URL' && ' '}
                                  {button.type === 'PHONE_NUMBER' && ' '}
                                  {button.text}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Footer Info */}
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div
                        className="rounded-circle me-2"
                        style={{
                          width: '8px',
                          height: '8px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
                          animation: 'pulse 2s ease-in-out infinite'
                        }}
                      ></div>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>
                        Ready to send
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="fas fa-check-circle me-1" style={{ color: '#10b981', fontSize: '10px' }}></i>
                      <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>
                        Pre-approved
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={whatsappMessagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="bg-white border-top p-3">
        <div className="d-flex align-items-center gap-2">
          {/* File Upload Button */}
          <div className="position-relative">
            <button
              className="btn whatsapp-file-trigger"
              onClick={() => {
                setShowWhatsappFileMenu(!showWhatsappFileMenu);
                setShowWhatsappTemplateMenu(false);
                setShowWhatsappEmojiPicker(false);
              }}
              title="Attach File"
              style={{
                width: '42px',
                height: '42px',
                backgroundColor: 'transparent',
                color: '#54656F',
                border: 'none',
                borderRadius: '8px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="fas fa-paperclip" style={{ fontSize: '20px' }}></i>
            </button>

            {/* File Menu Dropdown */}
            {showWhatsappFileMenu && (
              <div className="whatsapp-file-menu position-absolute bottom-100 start-0 mb-2 bg-white rounded shadow-lg border" style={{ width: '200px', zIndex: 1050 }}>
                <div className="p-2">
                  <input
                    type="file"
                    id="whatsapp-document-input"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    onChange={(e) => handleWhatsappFileUpload(e, 'document')}
                    style={{ display: 'none' }}
                  />
                  <input
                    type="file"
                    id="whatsapp-image-input"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={(e) => handleWhatsappFileUpload(e, 'image')}
                    style={{ display: 'none' }}
                  />
                  <input
                    type="file"
                    id="whatsapp-video-input"
                    accept="video/mp4,video/mkv,video/mov,video/avi"
                    onChange={(e) => handleWhatsappFileUpload(e, 'video')}
                    style={{ display: 'none' }}
                  />
                  <input
                    type="file"
                    id="whatsapp-audio-input"
                    accept="audio/mp3,audio/aac,audio/m4a,audio/amr,audio/ogg,audio/opus"
                    onChange={(e) => handleWhatsappFileUpload(e, 'audio')}
                    style={{ display: 'none' }}
                  />

                  <button
                    className="btn btn-light w-100 text-start mb-2"
                    onClick={() => document.getElementById('whatsapp-document-input').click()}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}
                  >
                    <i className="fas fa-file-alt" style={{ fontSize: '18px', color: '#7F66FF' }}></i>
                    <span>Document</span>
                  </button>

                  <button
                    className="btn btn-light w-100 text-start mb-2"
                    onClick={() => document.getElementById('whatsapp-image-input').click()}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}
                  >
                    <i className="fas fa-image" style={{ fontSize: '18px', color: '#F02849' }}></i>
                    <span>Image</span>
                  </button>

                  <button
                    className="btn btn-light w-100 text-start mb-2"
                    onClick={() => document.getElementById('whatsapp-video-input').click()}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}
                  >
                    <i className="fas fa-video" style={{ fontSize: '18px', color: '#00A884' }}></i>
                    <span>Video</span>
                  </button>

                  <button
                    className="btn btn-light w-100 text-start"
                    onClick={() => document.getElementById('whatsapp-audio-input').click()}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}
                  >
                    <i className="fas fa-microphone" style={{ fontSize: '18px', color: '#FF6B35' }}></i>
                    <span>Audio</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* <button
            className="btn"
            title="Attach File"
            style={{
              width: '42px',
              height: '42px',
              backgroundColor: 'transparent',
              color: '#54656F',
              border: 'none',
              borderRadius: '8px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fas fa-paperclip" style={{ fontSize: '20px' }}></i>
          </button> */}

          {/* Template Button */}
          <div className="position-relative">
            <button
              className="btn whatsapp-template-trigger"
              onClick={() => {
                setShowWhatsappTemplateMenu(!showWhatsappTemplateMenu);
                setShowWhatsappEmojiPicker(false);
              }}
              title="Templates"
              style={{
                width: '42px',
                height: '42px',
                backgroundColor: '#0B66E4',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="fas fa-copy" style={{ fontSize: '18px' }}></i>
            </button>

            {/* Template Dropdown */}
            {showWhatsappTemplateMenu && (
              <div className="whatsapp-template-menu position-absolute bottom-100 start-0 mb-2 bg-white rounded shadow-lg border whatappMaxWidth" style={{ width: '300px', maxWidth: '300px', maxHeight: '400px', overflowY: 'auto', zIndex: 1050 }}>
                <div className="p-3 border-bottom bg-light">
                  <h6 className="mb-0 fw-bold">Select Template to Send</h6>
                  <p className="mb-0 small text-muted">Templates are approved by WhatsApp</p>
                </div>

                {whatsappTemplates.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mb-0 small text-muted">Loading templates...</p>
                  </div>
                ) : (
                  whatsappTemplates.map(template => (
                    <div
                      key={template.id}
                      className="p-3 border-bottom"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleWhatsappSelectTemplate(template)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-semibold">{template.name}</h6>
                        <div className="d-flex gap-1">
                          <span className="badge bg-primary" style={{ fontSize: '9px' }}>{template.category}</span>
                          {template.language && (
                            <span className="badge bg-secondary" style={{ fontSize: '9px' }}>{template.language.toUpperCase()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Message Input or Template Send Button */}
          {selectedWhatsappTemplate ? (
            // Template Selected - Show Send Button
            <button
              className="btn flex-grow-1"
              onClick={handleWhatsappSendTemplate}
              disabled={isSendingWhatsapp}
              style={{
                height: '42px',
                backgroundColor: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: '24px',
                fontWeight: '500',
                fontSize: '15px'
              }}
            >
              {isSendingWhatsapp ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane me-2"></i>
                  Send Template to {selectedProfile?._candidate?.name?.split(' ')[0] || 'User'}
                </>
              )}
            </button>
          ) : sessionWindow.isOpen ? (
            // Active Session - Show Input
            <>
              <div className="position-relative flex-grow-1">
                <input
                  type="text"
                  className="form-control"
                  value={whatsappNewMessage}
                  onChange={(e) => setWhatsappNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleWhatsappSendMessage()}
                  placeholder={`Message ${selectedProfile?._candidate?.name?.split(' ')[0] }...`}
                  style={{
                    height: '42px',
                    paddingRight: '50px',
                    borderRadius: '24px',
                    border: '1px solid #E9EDEF',
                    fontSize: '15px',
                    backgroundColor: '#F0F2F5'
                  }}
                />
                <button
                  className="btn whatsapp-emoji-trigger position-absolute end-0 top-0"
                  onClick={() => {
                    setShowWhatsappEmojiPicker(!showWhatsappEmojiPicker);
                    setShowWhatsappTemplateMenu(false);
                  }}
                  style={{
                    height: '42px',
                    width: '42px',
                    border: 'none',
                    background: 'transparent',
                    color: '#54656F'
                  }}
                >
                  <i className="far fa-smile" style={{ fontSize: '20px' }}></i>
                </button>

                {/* Emoji Picker */}
                {showWhatsappEmojiPicker && (
                  <div className="whatsapp-emoji-menu position-absolute bottom-100 end-0 mb-2 bg-white rounded shadow-lg border p-3" style={{ zIndex: 1050 }}>
                    <div className="d-flex flex-wrap gap-2 whatappemoji" style={{ width: '250px' }}>
                      {emojis.map((emoji, index) => (
                        <button
                          key={index}
                          className="btn btn-light"
                          onClick={() => handleWhatsappEmojiClick(emoji)}
                          style={{ fontSize: '20px', width: '25px', height: '25px', padding: 0 }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Send/Voice Button */}
              {whatsappNewMessage.trim() ? (
                <button
                  onClick={handleWhatsappSendMessage}
                  style={{
                    width: '42px',
                    height: '42px',
                    minWidth: '42px',
                    minHeight: '42px',
                    backgroundColor: '#25D366',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <i className="fas fa-paper-plane" style={{ fontSize: '16px' }}></i>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setWhatsappMessages([...whatsappMessages, {
                      id: whatsappMessages.length + 1,
                      text: 'Ã°Å¸Å½Â¤ Voice message',
                      sender: 'agent',
                      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                      type: 'voice'
                    }]);
                  }}
                  style={{
                    width: '42px',
                    height: '42px',
                    minWidth: '42px',
                    minHeight: '42px',
                    backgroundColor: '#25D366',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Voice Message"
                >
                  <i className="fas fa-microphone" style={{ fontSize: '18px' }}></i>
                </button>
              )}
            </>
          ) : (
            // No Session - Disabled Input with Tooltip
            <div
              className="position-relative flex-grow-1"
              title="No active 24-hour window. User ka reply milne par manual messages bhej sakte hain. Abhi sirf approved templates use kar sakte hain."
            >
              <input
                type="text"
                className="form-control"
                disabled
                placeholder="No active window - Use templates only"
                style={{
                  height: '42px',
                  borderRadius: '24px',
                  border: '1px solid #E9EDEF',
                  fontSize: '15px',
                  backgroundColor: '#F5F5F5',
                  color: '#8696A0',
                  cursor: 'not-allowed'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

  useEffect(() => {
    if (showPanel === 'leadHistory') {
      fetchLeadLogs(selectedProfile._id);
    }
  }, [showPanel]);

  // Render Edit Panel (Desktop Sidebar or Mobile Modal)
  const renderLeadHistoryPanel = () => {
    const panelContent = (
      <>
        {leadLogsLoading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          </div>
        ) : (
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
              <div className="d-flex align-items-center">
                <div className="me-2">
                  <i className="fas fa-history text-primary"></i>
                </div>
                <h6 className="mb-0 fw-medium">Lead History</h6>
              </div>
              <button className="btn-close" type="button" onClick={closePanel}>
              </button>
            </div>

            <div className="card-body p-0 d-flex flex-column h-100">
              {/* Scrollable Content Area */}
              <div
                className="flex-grow-1 overflow-auto px-3 py-2"
                style={{
                  maxHeight: isMobile ? '60vh' : '65vh',
                  minHeight: '200px'
                }}
              >
                {leadLogs && leadLogs.logs && leadLogs.logs.length > 0 ? (
                  <div className="timeline">
                    {leadLogs.logs.map((log, index) => (
                      <div key={index} className="timeline-item mb-4">
                        <div className="timeline-marker">
                          <div className="timeline-marker-icon">
                            <i className="fas fa-circle text-primary" style={{ fontSize: '8px' }}></i>
                          </div>
                          {index !== leadLogs.logs.length - 1 && (
                            <div className="timeline-line"></div>
                          )}
                        </div>

                        <div className="timeline-content">
                          <div className="card border-0 shadow-sm">
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-start mb-2" style={{ flexDirection: 'column' }}>
                                <span className="bg-light text-dark border">
                                  {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'Unknown Date'}
                                </span>
                                <small className="text-muted">
                                  <i className="fas fa-user me-1"></i>
                                  Modified By: {log.user || 'Unknown User'}
                                </small>
                              </div>

                              <div className="mb-2">
                                <strong className="text-dark d-block mb-1">Action:</strong>
                                <div className="text-muted small" style={{ lineHeight: '1.6' }}>
                                  {log.action ? (
                                    log.action.split(';').map((actionPart, actionIndex) => (
                                      <div key={actionIndex} className="mb-1">
                                        • {actionPart.trim()}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-muted">No action specified</div>
                                  )}
                                </div>
                              </div>

                              {log.remarks && (
                                <div>
                                  <strong className="text-dark d-block mb-1">Remarks:</strong>
                                  <p className="mb-0 text-muted small" style={{ lineHeight: '1.4' }}>
                                    {log.remarks}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center py-5">
                    <div className="mb-3">
                      <i className="fas fa-history text-muted" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                    </div>
                    <h6 className="text-muted mb-2">No History Available</h6>
                    <p className="text-muted small mb-0">No actions have been recorded for this lead yet.</p>
                  </div>
                )}
              </div>

              {/* Fixed Footer */}
              <div className="border-top px-3 py-3 bg-light">
                <div className="d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closePanel}
                  >
                    <i className="fas fa-times me-1"></i>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
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



  const avatarColors = ['#dfc5f7', '#c5e1ef', '#f7d5c5', '#d5f7c5', '#f7c5d5', '#c5f7ef', '#efe9c5', '#c5c8f7'];
  const getAvatarColor = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };
  const getAvatarInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'L';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };
  const formatChatListTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((startToday - startMsg) / 86400000);
    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredChatConversations = (chatConversations || []).filter((conv) => {
    const q = String(chatListSearch || '').trim().toLowerCase();
    const lead = conv?.lead;
    const phone = String(conv?.phone || '');
    if (q) {
      const name = String(getLeadContactName(lead) || '').toLowerCase();
      const biz = String(lead?.businessName || '').toLowerCase();
      const preview = String(conv?.lastMessage?.text || '').toLowerCase();
      const qDigits = q.replace(/\D/g, '');
      if (!(name.includes(q) || biz.includes(q) || preview.includes(q) || (qDigits && phone.includes(qDigits)))) {
        return false;
      }
    }
    if (chatListFilter === 'unread') return Number(conv?.unreadCount || 0) > 0;
    if (chatListFilter === 'favourites') return Boolean(lead?.isFavourite || lead?.favourite);
    if (chatListFilter === 'groups') return Boolean(lead?.isGroup);
    return true;
  });
  const unreadChatCount = (chatConversations || []).reduce((sum, conv) => sum + (Number(conv?.unreadCount || 0) > 0 ? 1 : 0), 0);

  const filterChips = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'favourites', label: 'Favourites' },
    { id: 'groups', label: 'Groups' }
  ];

  return (
    <div className="wa-inbox-root">
      <div className="wa-shell">
        {/* Far-left nav rail */}
        {!isMobile && (
          <aside className="wa-nav-rail">
            <button type="button" className="wa-nav-btn wa-nav-btn--active" title="Chats">
              <i className="fas fa-comment-dots" />
              {(unreadChatCount || 0) > 0 && (
                <span className="wa-nav-badge">{Math.min(unreadChatCount, 99)}</span>
              )}
            </button>
          </aside>
        )}

        {/* Chat list */}
        <section
          className="wa-chat-list"
          style={{ display: isMobile && showPanel === 'Whatsapp' ? 'none' : 'flex' }}
        >
          <div className="wa-chat-list__header">
            <h1 className="wa-brand">WhatsApp</h1>
            <div className="wa-chat-list__actions">
              <button
                type="button"
                className="wa-icon-btn"
                title="Refresh chats"
                onClick={() => fetchWhatsappConversations(conversationPage, chatListSearch)}
              >
                <i className={'fas fa-sync-alt' + (loadingConversations ? ' fa-spin' : '')} />
              </button>
              <button type="button" className="wa-icon-btn" title="New chat" disabled>
                <i className="fas fa-edit" />
              </button>
              <button type="button" className="wa-icon-btn" title="Menu" disabled>
                <i className="fas fa-ellipsis-v" />
              </button>
            </div>
          </div>

          <div className="wa-search-wrap">
            <i className="fas fa-search wa-search-icon" />
            <input
              type="text"
              className="wa-search-input"
              placeholder="Search or start a new chat"
              value={chatListSearch}
              onChange={(e) => setChatListSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchWhatsappConversations(1, chatListSearch.trim());
                }
              }}
            />
            {chatListSearch ? (
              <button
                type="button"
                className="wa-search-clear"
                onClick={() => {
                  setChatListSearch('');
                  fetchWhatsappConversations(1, '');
                }}
              >
                <i className="fas fa-times" />
              </button>
            ) : null}
          </div>

          <div className="wa-filter-row">
            {filterChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={'wa-filter-chip' + (chatListFilter === chip.id ? ' is-active' : '')}
                onClick={() => setChatListFilter(chip.id)}
              >
                {chip.label}
              </button>
            ))}
            <button type="button" className="wa-filter-chip wa-filter-chip--plus" title="More filters" disabled>
              <i className="fas fa-plus" />
            </button>
          </div>

          <div className="wa-chat-scroll">
            {loadingConversations && !filteredChatConversations.length ? (
              <div className="wa-empty-list">
                <div className="spinner-border text-success mb-2" role="status" />
                <div>Loading chats...</div>
              </div>
            ) : null}

            {!loadingConversations && !filteredChatConversations.length ? (
              <div className="wa-empty-list">
                <i className="fab fa-whatsapp" />
                <div className="fw-semibold">No chats found</div>
                <div>Try another search</div>
              </div>
            ) : null}

            {filteredChatConversations.map((conv) => {
              const lead = profileFromConversation(conv);
              const phone = conv.phone || getLeadWhatsappPhone(lead);
              const name = getLeadContactName(lead) || phone;
              const isIncoming = conv.lastMessage?.direction === 'incoming';
              const isUnread = Number(conv.unreadCount || 0) > 0;
              const isActive = showPanel === 'Whatsapp' && normalizeChatPhone(getLeadWhatsappPhone(selectedProfile)) === normalizeChatPhone(phone);
              const preview = formatChatPreview(conv.lastMessage) || (phone ? `+91 ${String(phone).slice(-10)}` : 'No messages yet');
              return (
                <button
                  key={phone || lead._id}
                  type="button"
                  className={'wa-chat-item' + (isActive ? ' is-active' : '') + (isUnread ? ' is-unread' : '')}
                  onClick={() => openWhatsappPanel(lead)}
                >
                  <div
                    className="wa-chat-avatar"
                    style={{ background: getAvatarColor(name) }}
                  >
                    {getAvatarInitials(name)}
                  </div>
                  <div className="wa-chat-item__body">
                    <div className="wa-chat-item__top">
                      <span className="wa-chat-item__name">{name}</span>
                      <span className={'wa-chat-item__time' + (isUnread ? ' is-unread' : '')}>
                        {formatChatListTime(conv.lastMessageAt || conv.lastMessage?.sentAt)}
                      </span>
                    </div>
                    <div className="wa-chat-item__bottom">
                      <span className={'wa-chat-item__preview' + (isUnread ? ' is-unread' : '')}>
                        {!isIncoming && (
                          <i
                            className="fas fa-check-double me-1"
                            style={{
                              color: conv.lastMessage?.status === 'read' ? '#53bdeb' : '#8696a0',
                              fontSize: 11
                            }}
                          />
                        )}
                        {preview}
                      </span>
                      {isUnread ? (
                        <span className="wa-unread-badge">{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {conversationTotalPages > 1 ? (
            <div className="wa-pager">
              <button
                type="button"
                disabled={conversationPage <= 1 || loadingConversations}
                onClick={() => fetchWhatsappConversations(conversationPage - 1, chatListSearch)}
              >
                <i className="fas fa-chevron-left" />
              </button>
              <span>{conversationPage} / {conversationTotalPages}</span>
              <button
                type="button"
                disabled={conversationPage >= conversationTotalPages || loadingConversations}
                onClick={() => fetchWhatsappConversations(conversationPage + 1, chatListSearch)}
              >
                <i className="fas fa-chevron-right" />
              </button>
            </div>
          ) : null}
        </section>

        {/* Right pane */}
        <section
          className="wa-main-pane"
          style={{ display: isMobile && showPanel !== 'Whatsapp' ? 'none' : 'flex' }}
        >
          {showPanel === 'Whatsapp' && selectedProfile ? (
            renderWhatsAppPanel()
          ) : (
            <div className="wa-welcome">
              <div className="wa-welcome-card">
                <div className="wa-welcome-illu">
                  <div className="wa-welcome-illu__screen">
                    <i className="fab fa-whatsapp" />
                  </div>
                </div>
                <h2>WhatsApp for B2B</h2>
                <p>
                  Send messages, templates and follow up with leads in one place — just like WhatsApp Web.
                </p>
                <button
                  type="button"
                  className="wa-welcome-btn"
                  onClick={() => {
                    if (filteredChatConversations[0]) openWhatsappPanel(profileFromConversation(filteredChatConversations[0]));
                  }}
                  disabled={!filteredChatConversations.length}
                >
                  Start chatting
                </button>
              </div>
              <div className="wa-welcome-actions">
                <div className="wa-welcome-action">
                  <div className="wa-welcome-action__icon"><i className="fas fa-file-alt" /></div>
                  <span>Send document</span>
                </div>
                <div className="wa-welcome-action">
                  <div className="wa-welcome-action__icon"><i className="fas fa-user-plus" /></div>
                  <span>Add contact</span>
                </div>
                <div className="wa-welcome-action">
                  <div className="wa-welcome-action__icon wa-welcome-action__icon--ai"><i className="fas fa-star" /></div>
                  <span>Ask AI</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <style>{`
.wa-inbox-root {
  height: 100vh;
  min-height: 100vh;
  background: #d1d7db;
  overflow: hidden;
  font-family: Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif;
}
.wa-shell {
  display: flex;
  height: 100%;
  max-width: 1600px;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 0 20px rgba(0,0,0,0.08);
}
.wa-nav-rail {
  width: 60px;
  background: #f0f2f5;
  border-right: 1px solid #e9edef;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  flex-shrink: 0;
}
.wa-nav-btn {
  width: 42px;
  height: 42px;
  border: 0;
  background: transparent;
  border-radius: 50%;
  color: #54656f;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.wa-nav-btn--active { background: #d9fdd3; color: #0b141a; }
.wa-nav-badge {
  position: absolute;
  top: 4px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #25d366;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wa-chat-list {
  width: 380px;
  min-width: 320px;
  max-width: 420px;
  border-right: 1px solid #e9edef;
  background: #fff;
  height: 100%;
  flex-direction: column;
  flex-shrink: 0;
}
.wa-chat-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 8px;
}
.wa-brand {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #00a884;
  letter-spacing: -0.3px;
}
.wa-chat-list__actions { display: flex; gap: 2px; }
.wa-icon-btn {
  width: 38px;
  height: 38px;
  border: 0;
  background: transparent;
  border-radius: 50%;
  color: #54656f;
  font-size: 16px;
}
.wa-icon-btn:hover { background: #f0f2f5; }
.wa-icon-btn:disabled { opacity: 0.4; }
.wa-search-wrap {
  position: relative;
  margin: 4px 12px 10px;
}
.wa-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #54656f;
  font-size: 13px;
}
.wa-search-input {
  width: 100%;
  height: 38px;
  border: 0;
  outline: none;
  background: #f0f2f5;
  border-radius: 8px;
  padding: 0 36px 0 40px;
  font-size: 14px;
  color: #111b21;
}
.wa-search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: #54656f;
}
.wa-filter-row {
  display: flex;
  gap: 8px;
  padding: 0 12px 10px;
  overflow-x: auto;
}
.wa-filter-chip {
  border: 0;
  background: #f0f2f5;
  color: #54656f;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  white-space: nowrap;
  font-weight: 500;
}
.wa-filter-chip.is-active {
  background: #d9fdd3;
  color: #0b7a4b;
}
.wa-filter-chip--plus {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wa-chat-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.wa-chat-scroll::-webkit-scrollbar { width: 6px; }
.wa-chat-scroll::-webkit-scrollbar-thumb { background: #ccd0d5; border-radius: 8px; }
.wa-empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: #667781;
  text-align: center;
  gap: 4px;
  font-size: 13px;
}
.wa-empty-list .fab { font-size: 40px; color: #d1d7db; margin-bottom: 8px; }
.wa-chat-item {
  width: 100%;
  border: 0;
  background: #fff;
  display: flex;
  gap: 12px;
  padding: 10px 14px;
  text-align: left;
  cursor: pointer;
}
.wa-chat-item:hover { background: #f5f6f6; }
.wa-chat-item.is-active { background: #f0f2f5; }
.wa-chat-avatar {
  width: 49px;
  height: 49px;
  border-radius: 50%;
  color: #1f2c34;
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.wa-chat-item__body { flex: 1; min-width: 0; border-bottom: 1px solid #f0f2f5; padding-bottom: 10px; }
.wa-chat-item:last-child .wa-chat-item__body { border-bottom: 0; }
.wa-chat-item__top, .wa-chat-item__bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.wa-chat-item__name {
  font-size: 16px;
  font-weight: 500;
  color: #111b21;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wa-chat-item.is-unread .wa-chat-item__name { font-weight: 700; }
.wa-chat-item__time { font-size: 12px; color: #667781; flex-shrink: 0; }
.wa-chat-item__time.is-unread { color: #25d366; font-weight: 600; }
.wa-chat-item__preview {
  font-size: 13px;
  color: #667781;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.wa-chat-item__preview.is-unread { color: #111b21; font-weight: 600; }
.wa-unread-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: #25d366;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.wa-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid #e9edef;
  background: #fafafa;
  color: #667781;
  font-size: 12px;
}
.wa-pager button {
  border: 1px solid #e9edef;
  background: #fff;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #54656f;
}
.wa-pager button:disabled { opacity: 0.4; }
.wa-main-pane {
  flex: 1;
  min-width: 0;
  height: 100%;
  background: #f0f2f5;
  flex-direction: column;
}
.wa-welcome {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f0f2f5;
  border-bottom: 6px solid #00a884;
}
.wa-welcome-card {
  width: min(520px, 92%);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(11, 20, 26, 0.08);
  padding: 36px 28px 28px;
  text-align: center;
}
.wa-welcome-illu {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
}
.wa-welcome-illu__screen {
  width: 140px;
  height: 92px;
  border-radius: 12px;
  background: linear-gradient(160deg, #e8f8ef 0%, #d9fdd3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00a884;
  font-size: 42px;
  box-shadow: inset 0 0 0 1px rgba(0,168,132,0.12);
}
.wa-welcome-card h2 {
  margin: 0 0 10px;
  font-size: 28px;
  font-weight: 360;
  color: #41525d;
}
.wa-welcome-card p {
  margin: 0 auto 22px;
  max-width: 380px;
  color: #667781;
  font-size: 14px;
  line-height: 1.5;
}
.wa-welcome-btn {
  border: 0;
  background: #00a884;
  color: #fff;
  border-radius: 999px;
  padding: 10px 28px;
  font-size: 14px;
  font-weight: 600;
}
.wa-welcome-btn:disabled { opacity: 0.5; }
.wa-welcome-actions {
  display: flex;
  gap: 28px;
  margin-top: 28px;
}
.wa-welcome-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #667781;
  font-size: 12px;
}
.wa-welcome-action__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #e9edef;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #54656f;
  font-size: 16px;
}
.wa-welcome-action__icon--ai { color: #7c4dff; }
#whatsappPanel { height: 100% !important; min-height: 100% !important; }
.wa-chat-list button:focus, .wa-nav-btn:focus, .wa-icon-btn:focus, .wa-filter-chip:focus {
  outline: none;
  box-shadow: none;
}
@media (max-width: 992px) {
  .wa-chat-list {
    width: 100%;
    max-width: 100%;
    min-width: 100%;
  }
  .wa-welcome-card h2 { font-size: 22px; }
}
`}</style>
    </div>
  );
};

export default WhatsApp;
