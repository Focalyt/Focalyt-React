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

const B2BSales = () => {

  const candidateRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const lrpReturnTo = `${location.pathname}${location.search}`;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [userData, setUserData] = useState(JSON.parse(sessionStorage.getItem("user") || "{}"));
  const token = userData.token;
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
    leadRanking: ''
  });
  const [bulkUploadFormErrors, setBulkUploadFormErrors] = useState({});
  const [bulkUploadSubStatuses, setBulkUploadSubStatuses] = useState([]);
  const [bulkUploadSubStatusesLoading, setBulkUploadSubStatusesLoading] = useState(false);

  // Bulk inputs state
  const [showBulkInputs, setShowBulkInputs] = useState(false);
  const [bulkMode, setBulkMode] = useState(''); // 'whatsapp' | 'bulkrefer' | 'bulkaction'
  const [input1Value, setInput1Value] = useState('');
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
    leadStatus: '',
    leadSubStatus: '',
    leadRanking: '',
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

    const dt = followUpLike?.scheduledDate ? new Date(followUpLike.scheduledDate) : null;
    if (!dt || Number.isNaN(dt.getTime())) return null;

    const now = Date.now();
    if (dt.getTime() < now) return 'missed';
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

  const leadHasFollowup = (lead, type) => (
    Boolean(getLeadFollowupBucket(lead, type)) || getLeadFollowupDoneCount(lead, type) > 0
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
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  const [leadViewTab, setLeadViewTab] = useState('all'); // 'all' | 'myRefer'
  const [myReferLeadsCount, setMyReferLeadsCount] = useState(0);

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
    const list = [...(statusCounts || [])];
    list.sort((a, b) => (a.statusIndex ?? 9999) - (b.statusIndex ?? 9999));
    return list;
  }, [statusCounts]);

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

  const getLeadFetchOverrides = (extra = {}, viewTab = leadViewTabRef.current) => {
    const overrides = { ...extra };
    if (viewTab === 'myRefer') {
      overrides.referredByMe = true;
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
      return { ...group, leads: sorted };
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
      if (leadViewTabRef.current === 'all') {
        fetchStatusCounts();
        fetchApprovalCounts();
      }
    };
    window.addEventListener('b2b-followup-updated', handler);
    return () => window.removeEventListener('b2b-followup-updated', handler);
  }, []);

  // Auto-select leads based on Input 1 value for bulk WhatsApp / refer / action
  useEffect(() => {
    if (bulkMode !== 'bulkrefer' && bulkMode !== 'bulkaction' && bulkMode !== 'whatsapp') {
      return;
    }

    if (!leads || leads.length === 0) {
      return;
    }

    const numValue = input1Value === '' ? 0 : parseInt(input1Value, 10);

    if (isNaN(numValue) || numValue < 1) {
      setSelectedProfiles([]);
      return;
    }

    // Get total available leads
    const totalAvailableLeads = totalLeads || leads.length;
    const validNumValue = Math.min(numValue, totalAvailableLeads);

    // If user wants more leads than currently loaded, fetch them
    if (validNumValue > leads.length && validNumValue > 0) {
      const fetchLeadsForSelection = async () => {
        if (!token) return;

        try {
          const eff = { ...filters };
          const params = {
            page: 1,
            limit: validNumValue.toString(),
            ...(selectedStatusFilter && { status: selectedStatusFilter })
          };
          appendLeadFilterParams(params, eff);

          const response = await axios.get(`${backendUrl}/college/b2b/leads`, {
            headers: { 'x-auth': token },
            params: params
          });

          if (response.data.status && response.data.data.leads) {
            const fetchedLeads = response.data.data.leads;
            const selectedLeadsData = fetchedLeads.slice(0, validNumValue);
            const leadsToSelect = selectedLeadsData.map(lead => lead._id);
            setSelectedProfiles(leadsToSelect);
          }
        } catch (error) {
          console.error('Error fetching leads for selection:', error);
          // Fallback: select from current leads
          const selectedLeadsData = leads.slice(0, Math.min(validNumValue, leads.length));
          const leadsToSelect = selectedLeadsData.map(lead => lead._id);
          setSelectedProfiles(leadsToSelect);
        }
      };

      fetchLeadsForSelection();
    } else {
      // Select from current leads
      const selectedLeadsData = leads.slice(0, validNumValue);
      const leadsToSelect = selectedLeadsData.map(lead => lead._id);
      setSelectedProfiles(leadsToSelect);
    }
  }, [input1Value, bulkMode, leads, totalLeads, filters, selectedStatusFilter, token]);

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
      closePanel();
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

      if (statusFilter) {
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

  const approveLead = async (lead) => {
    try {
      const res = await axios.put(
        `${backendUrl}/college/b2b/leads/${lead._id}/approval`,
        { status: 'APPROVED', moveToProspect: true },
        { headers: { 'x-auth': token } }
      );
      if (res?.data?.status) {
        setApprovalEditLeadId(null);
        setCrossSaleCache({});
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

    // Check if user is the lead owner or lead added by
    const userId = userData._id;
    const leadAddedById = lead.leadAddedBy?._id || lead.leadAddedBy;
    const leadOwnerId = lead.leadOwner?._id || lead.leadOwner;

    return leadAddedById?.toString() === userId?.toString() ||
      leadOwnerId?.toString() === userId?.toString();
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
        alert('Lead added successfully!');

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
      ['Business Name', 'Concern Person Name', 'Mobile', 'Email', 'Address', 'City', 'State', 'Designation', 'WhatsApp', 'Landline Number', 'Counsellor', 'Remark'],
      ['ABC Company', 'John Doe', '9876543210', 'john@abc.com', '123 Main Street', 'Mumbai', 'Maharashtra', 'Manager', '9876543210', '0221234567', 'Counsellor Name', 'Sample remark'],
      ['XYZ Corp', 'Jane Smith', '9876543211', 'jane@xyz.com',  '456 Park Avenue', 'Delhi', 'Delhi', 'Director', '9876543211', '0111234567', 'Owner Name', 'Another remark'],
      ['Tech Solutions', 'Raj Kumar', '9876543212', 'raj@tech.com','789 Tech Park', 'Bangalore', 'Karnataka', 'CEO', '9876543212', '0801234567', 'Owner Name', 'Technology company']
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
          ...(selectedStatusFilter && { status: selectedStatusFilter })
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

    if (!isMobile) {
      setMainContentClass('col-8');
      setTimeout(() => {
        if (widthRef.current) {
          window.dispatchEvent(new Event('resize'));
        }
      }, 200);
    } else {
      document.body.classList.add('panel-open');
    }

    await fetchWhatsappHistory(phone);
    await checkSessionWindow(phone);
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

  const openEditPanel = async (profile = null, panel, followUpType = null) => {
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

// Render WhatsApp Panel (Desktop Sidebar or Mobile Modal)
const renderWhatsAppPanel = () => {
  const panelContent = (
    <div className="d-flex flex-column" style={{ height: '100%', backgroundColor: '#f0f2f5' }}>
      {/* WhatsApp Header */}
      <div className="bg-white border-bottom" style={{ padding: '16px 16px 12px 16px', position: 'relative' }}>

        <div className="d-flex align-items-center mb-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white me-3"
            style={{
              width: '48px',
              height: '48px',
              fontSize: '20px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              flexShrink: 0
            }}
          >
            {(getLeadContactName(selectedProfile)?.charAt(0) || 'L').toUpperCase()}
          </div>
          <div className="flex-grow-1">
            <h6 className="mb-0 fw-bold" style={{ fontSize: '16px' }}>
              {getLeadContactName(selectedProfile) || 'N/A'}
            </h6>
            <p className="mb-0 text-muted" style={{ fontSize: '13px' }}>
              {getLeadWhatsappPhone(selectedProfile) || 'N/A'}
            </p>
          </div>
          <button
            className="btn-close"
            onClick={closePanel}
            style={{ marginLeft: '8px' }}
          ></button>
        </div>

        {/* Session Status Badge - Below name */}
        <div className="d-flex align-items-center" style={{ paddingLeft: '64px' }}>
          {sessionWindow.isOpen ? (
            <div
              className="d-flex align-items-center px-2 py-1 rounded"
              style={{
                backgroundColor: '#D1F4E0',
                border: '1px solid #25D366',
                fontSize: '11px',
                whiteSpace: 'nowrap'
              }}
            >
              <div
                className="rounded-circle me-1"
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#25D366'
                }}
              ></div>
              <span className="fw-semibold" style={{ color: '#0A6E44' }}>
                <i className="fas fa-clock me-1" style={{ fontSize: '10px' }}></i>
                {sessionCountdown} remaining
              </span>
            </div>
          ) : (
            <div
              className="d-flex align-items-center px-2 py-1 rounded"
              style={{
                backgroundColor: '#FFF3CD',
                border: '1px solid #FFA500',
                fontSize: '11px',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fas fa-clock me-1" style={{ color: '#FFA500', fontSize: '10px' }}></i>
              <span className="fw-semibold" style={{ color: '#856404' }}>
                No Active Window
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Messages Area */}
      <div
        className="flex-grow-1 overflow-auto p-3"
        style={{
          backgroundColor: '#ECE5DD',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23ECE5DD\'/%3E%3Cpath d=\'M50 0L0 50h100L50 0z\' fill=\'%23E1DCD5\' fill-opacity=\'0.1\'/%3E%3C/svg%3E")',
          maxHeight: '55vh',
          minHeight: '300px'
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
                                              {btn.type === 'QUICK_REPLY' && 'Ã¢â€ Â©Ã¯Â¸Â '}
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
                                  {button.type === 'QUICK_REPLY' && 'Ã¢â€ Â©Ã¯Â¸Â '}
                                  {button.type === 'URL' && 'Ã°Å¸â€N/A '}
                                  {button.type === 'PHONE_NUMBER' && 'Ã°Å¸â€œÅ¾ '}
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

  if (isMobile) {
    return showPanel === 'Whatsapp' ? (
      <div
        className='modal show d-block'
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closePanel();
        }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxHeight: '90vh' }}>
          <div className="modal-content" style={{ height: '80vh' }}>
            {panelContent}
          </div>
        </div>
      </div>
    ) : null;
  }

  return showPanel === 'Whatsapp' ? (
    <div id="whatsappPanel" style={{ height: `calc(100vh - ${navHeight + 80}px)`, minHeight: '500px' }}>
      {panelContent}
    </div>
  ) : null;
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



  return (
    <div className="container-fluid">

      <div className="row">
        <div
          className={`mbdiv  ${isMobile ? 'col-12' : mainContentClass} ${isDesktopPanelOpen ? 'b2b-panel-open' : ''}`}
          style={{
            width: isDesktopPanelOpen ? `calc(100% - ${panelWidthPx}px)` : '100%',
            marginRight: isDesktopPanelOpen ? `${panelWidthPx}px` : '0',
            transition: 'all 0.3s ease'
          }}
        >
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
              className="b2b-cycle-header-nav"
              style={{
                zIndex: 11,
                backgroundColor: '#fff',
                position: 'fixed',
                left: leftOffset > 0 ? `${leftOffset}px` : 0,
                right: !isMobile && isDesktopPanelOpen ? `${panelWidthPx}px` : 0,
                width: width > 0 && (!isDesktopPanelOpen || isMobile) ? `${width}px` : undefined,
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                paddingBlock: '10px',
                paddingInline: '4px',
                transition: 'left 0.3s ease, width 0.3s ease, right 0.3s ease'
              }}
            >
              <div className="container-fluid">
                <div className="row align-items-center gy-2">
                  <div className="col-md-5 col-xl-4 d-none d-md-block">
                    <div className="d-flex align-items-center flex-wrap">
                      <h5 className="fw-bold text-dark mb-0 me-3" style={{ fontSize: '1.1rem' }}>B2B Cycle</h5>
                      <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0 small">
                          <li className="breadcrumb-item">
                            <a href="/institute/dashboard" className="text-decoration-none">Home</a>
                          </li>
                          <li className="breadcrumb-item active">B2B Cycle</li>
                        </ol>
                      </nav>
                    </div>
                    {renderHeaderDateRangeFilter()}
                  </div>

                  <div className="col-md-7 col-xl-8 d-none d-md-flex justify-content-end align-items-center">
                    {showBulkInputs && (bulkMode === 'bulkrefer' || bulkMode === 'bulkaction' || bulkMode === 'whatsapp') ? (
                      <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                      {showBulkInputs && (bulkMode === 'bulkrefer' || bulkMode === 'bulkaction' || bulkMode === 'whatsapp') && (
                        <>
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
                              const maxValue = totalLeads || leads?.length || 0;
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
                              if (e.key === 'Enter' && bulkMode === 'whatsapp' && input1Value) {
                                e.preventDefault();
                                const numValue = parseInt(input1Value, 10);
                                const maxValue = totalLeads || leads?.length || 0;
                                if (numValue >= 1 && numValue <= maxValue && selectedProfiles?.length > 0) {
                                  if (!whatsappTemplates.length) fetchWhatsappTemplates();
                                  setModalType('whatsapp');
                                }
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
                            value={totalLeads || leads?.length || 0}
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
                        <span className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                          Selected: <span className="fw-semibold text-primary">{selectedProfiles?.length || 0}</span>
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={exitBulkMode}
                          style={{ height: '32px', padding: '4px 10px', fontSize: '12px' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            if (!selectedProfiles || selectedProfiles.length === 0) {
                              alert('Please type a number in Input 1 to select leads first.');
                              return;
                            }
                            if (bulkMode === 'whatsapp') {
                              if (!whatsappTemplates.length) fetchWhatsappTemplates();
                              setModalType('whatsapp');
                            } else if (bulkMode === 'bulkaction') {
                              openEditPanel(null, 'bulkstatuschange');
                            } else {
                              openRefferPanel(null, 'RefferAllLeads');
                            }
                          }}
                          style={{ height: '32px', padding: '4px 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
                        >
                          <i className={`fas ${bulkMode === 'bulkaction' ? 'fa-tasks' : bulkMode === 'whatsapp' ? 'fa-paper-plane' : 'fa-share'} me-1`}></i>
                          {bulkMode === 'bulkaction' ? 'Change Status' : bulkMode === 'whatsapp' ? 'Send Messages' : 'Refer'}
                        </button>
                        </>
                      )}
                    </div>
                    ) : (
                      renderCycleFilterDropdowns()
                    )}
                  </div>

                  {/* Desktop: actions + search */}
                  <div className="col-12 d-none d-md-block mt-2 pt-1 border-top" style={{ borderColor: '#eee' }}>
                    <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                      {((permissions?.custom_permissions?.can_add_leads_b2b && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm border-0"
                            style={{
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#fff',
                              backgroundColor: 'rgb(250, 85, 121)',
                              borderRadius: '999px'
                            }}
                            onClick={handleOpenLeadModal}
                          >
                            <i className="fas fa-plus" style={{ fontSize: '11px' }}></i>
                            Add Lead
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm border-0"
                            style={{
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#fff',
                              backgroundColor: 'rgb(250, 85, 121)',
                              borderRadius: '999px'
                            }}
                            onClick={openBulkUploadModal}
                          >
                            <i className="fas fa-file-upload" style={{ fontSize: '11px' }}></i>
                            Bulk Upload
                          </button>
                        </>
                      )}
                      {((permissions?.custom_permissions?.can_assign_leads && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                        <button
                          type="button"
                          className="btn btn-sm border-0"
                          disabled={loadingLeads || leads.length === 0}
                          style={{
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#fff',
                            backgroundColor: 'rgb(250, 85, 121)',
                            borderRadius: '999px',
                            opacity: loadingLeads || leads.length === 0 ? 0.55 : 1
                          }}
                          onClick={() => {
                            setShowBulkInputs(true);
                            setBulkMode('bulkrefer');
                            setInput1Value('');
                            openRefferPanel(null, 'RefferAllLeads');
                          }}
                        >
                          <i className="fas fa-share-alt" style={{ fontSize: '11px' }}></i>
                          Refer All
                        </button>
                      )}
                      {canEditLeadsB2B && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          disabled={loadingLeads || leads.length === 0}
                          style={{
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '999px',
                            opacity: loadingLeads || leads.length === 0 ? 0.55 : 1
                          }}
                          onClick={() => {
                            setShowBulkInputs(true);
                            setBulkMode('bulkaction');
                            setInput1Value('');
                            openEditPanel(null, 'bulkstatuschange');
                          }}
                        >
                          <i className="fas fa-tasks" style={{ fontSize: '11px' }}></i>
                          Bulk Action
                        </button>
                      )}
                      <button
                          type="button"
                          className="btn btn-sm border-0"
                          disabled={loadingLeads || leads.length === 0}
                          style={{
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#fff',
                            backgroundColor: 'rgb(250, 85, 121)',
                            borderRadius: '999px',
                            opacity: loadingLeads || leads.length === 0 ? 0.55 : 1
                          }}
                          onClick={() => {
                            setShowBulkInputs(true);
                            setBulkMode('whatsapp');
                            setInput1Value('');
                            setSelectedProfiles([]);
                            if (!whatsappTemplates.length) fetchWhatsappTemplates();
                          }}
                        >
                          <i className="fab fa-whatsapp" style={{ fontSize: '11px' }}></i>
                          Bulk Messages
                      </button>
                      </div>

                      <div className="d-flex align-items-center gap-2 ms-md-auto">
                        <div className="d-flex align-items-center gap-2">
                          <div className="position-relative">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Quick search..."
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
                                width: '200px',
                                paddingRight: '30px',
                                paddingLeft: '12px',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                backgroundColor: '#ffffff',
                                border: '1.5px solid #ced4da',
                                color: '#212529',
                                fontSize: '13px',
                                borderRadius: '6px',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.2s ease'
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
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={applyFilters}
                            disabled={!filters.search}
                            style={{
                              background: 'linear-gradient(135deg, #fc567b 13%, #fc567b 50%)',
                              borderColor: 'rgb(250, 85, 121)',
                              color: 'white',
                              fontWeight: '500',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <i className="fas fa-search me-1"></i>
                          </button>
                        </div>
                        <button
                          className={`btn btn-sm filterBadge ${showFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setShowFilters(!showFilters)}
                          style={{
                            background: showFilters ? 'linear-gradient(135deg, #fc567b 13%, #fc567b 50%)' : '#ffffff',
                            color: showFilters ? '#ffffff' : 'rgb(250, 85, 121)',
                            fontWeight: '500',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            transition: 'all 0.2s ease',
                            borderWidth: '1.5px',
                            borderColor: 'rgb(250, 85, 121)'
                          }}
                        >
                          <i className="fas fa-filter me-1"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile: filters on top row */}
                  <div className="col-12 d-md-none">
                    {renderHeaderDateRangeFilter(true)}
                  </div>
                  <div className="col-12 d-md-none">
                    {!(showBulkInputs && (bulkMode === 'bulkrefer' || bulkMode === 'bulkaction' || bulkMode === 'whatsapp')) && renderCycleFilterDropdowns(true)}
                  </div>

                  {/* Mobile Layout */}
                  <div className="col-12 d-md-none mt-2 pt-1 border-top" style={{ borderColor: '#eee' }}>
                    <div className="b2b-mobile-toolbar d-flex flex-wrap align-items-center gap-2">
                    <div className="b2b-mobile-hscroll b2b-mobile-hscroll--actions">

                      {((permissions?.custom_permissions?.can_add_leads_b2b && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                        <>
                          <button className="btn b2b-mobile-action-btn"
                            onClick={handleOpenLeadModal}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(250, 85, 121, 0.35)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(250, 85, 121, 0.25)';
                            }}
                          >
                            <i className="fas fa-plus" style={{ fontSize: "14px" }}></i>
                            Add Lead
                          </button>
                          <button className="btn b2b-mobile-action-btn"
                            onClick={openBulkUploadModal}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(250, 85, 121, 0.35)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(250, 85, 121, 0.25)';
                            }}
                          >
                            <i className="fas fa-file-upload" style={{ fontSize: "14px" }}></i>
                            Bulk Upload
                          </button>
                        </>
                      )}
                      {((permissions?.custom_permissions?.can_assign_leads && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                        <button
                          className="btn b2b-mobile-action-btn"
                          disabled={loadingLeads || leads.length === 0}
                          style={{
                            opacity: loadingLeads || leads.length === 0 ? 0.55 : 1,
                            cursor: loadingLeads || leads.length === 0 ? 'not-allowed' : 'pointer'
                          }}
                          onClick={() => {
                            setShowBulkInputs(true);
                            setBulkMode('bulkrefer');
                            setInput1Value('');
                            openRefferPanel(null, 'RefferAllLeads');
                          }}
                        >
                          <i className="fas fa-share-alt" style={{ fontSize: "14px" }}></i>
                          Refer Leads
                        </button>
                      )}
                      {canEditLeadsB2B && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          disabled={loadingLeads || leads.length === 0}
                          style={{
                            padding: '8px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '999px',
                            opacity: loadingLeads || leads.length === 0 ? 0.55 : 1
                          }}
                          onClick={() => {
                            setShowBulkInputs(true);
                            setBulkMode('bulkaction');
                            setInput1Value('');
                            openEditPanel(null, 'bulkstatuschange');
                          }}
                        >
                          <i className="fas fa-tasks" style={{ fontSize: '12px' }}></i>
                          Bulk Action
                        </button>
                      )}
                      <button
                        className="btn b2b-mobile-action-btn"
                        disabled={loadingLeads || leads.length === 0}
                        style={{
                          opacity: loadingLeads || leads.length === 0 ? 0.55 : 1,
                          cursor: loadingLeads || leads.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => {
                          setShowBulkInputs(true);
                          setBulkMode('whatsapp');
                          setInput1Value('');
                          setSelectedProfiles([]);
                          if (!whatsappTemplates.length) fetchWhatsappTemplates();
                        }}
                      >
                        <i className="fab fa-whatsapp" style={{ fontSize: '14px' }}></i>
                        Bulk Messages
                      </button>
                    </div>

                    <div className="d-flex align-items-center gap-2 b2b-mobile-toolbar__search flex-grow-1" style={{ minWidth: '200px' }}>
                      <div className="position-relative flex-grow-1">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Quick search..."
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
                            paddingRight: '28px',
                            paddingLeft: '12px',
                            paddingTop: '8px',
                            paddingBottom: '8px',
                            backgroundColor: '#ffffff',
                            border: '1.5px solid #ced4da',
                            fontSize: '13px',
                            borderRadius: '6px',
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
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={applyFilters}
                        disabled={!filters.search}
                        style={{
                          background: 'linear-gradient(135deg, #fc567b 13%, #fc567b 50%)',
                          borderColor: 'rgb(250, 85, 121)',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '13px'
                        }}
                      >
                        <i className="fas fa-search"></i>
                      </button>
                      <button
                        className={`btn btn-sm filterBadge ${showFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                          background: showFilters ? 'linear-gradient(135deg, #fc567b 13%, #fc567b 50%)' : '#ffffff',
                          color: showFilters ? '#ffffff' : 'rgb(250, 85, 121)',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          borderWidth: '1.5px',
                          borderColor: 'rgb(250, 85, 121)'
                        }}
                      >
                        <i className="fas fa-filter"></i>
                      </button>
                    </div>
                    </div>

                    <div className="row g-2">
                      {/* Mobile Bulk Input Fields */}
                      {showBulkInputs && (bulkMode === 'bulkrefer' || bulkMode === 'bulkaction' || bulkMode === 'whatsapp') && (
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
                                const maxValue = totalLeads || leads?.length || 0;
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
                                if (e.key === 'Enter' && bulkMode === 'whatsapp' && input1Value) {
                                  e.preventDefault();
                                  const numValue = parseInt(input1Value, 10);
                                  const maxValue = totalLeads || leads?.length || 0;
                                  if (numValue >= 1 && numValue <= maxValue && selectedProfiles?.length > 0) {
                                    if (!whatsappTemplates.length) fetchWhatsappTemplates();
                                    setModalType('whatsapp');
                                  }
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
                              value={totalLeads || leads?.length || 0}
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
                          <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                            <span className="text-muted" style={{ fontSize: '12px' }}>
                              Selected: <span className="fw-semibold text-primary">{selectedProfiles?.length || 0}</span>
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={exitBulkMode}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                if (!selectedProfiles || selectedProfiles.length === 0) {
                                  alert('Please type a number in Input 1 to select leads first.');
                                  return;
                                }
                                if (bulkMode === 'whatsapp') {
                                  if (!whatsappTemplates.length) fetchWhatsappTemplates();
                                  setModalType('whatsapp');
                                } else if (bulkMode === 'bulkaction') {
                                  openEditPanel(null, 'bulkstatuschange');
                                } else {
                                  openRefferPanel(null, 'RefferAllLeads');
                                }
                              }}
                            >
                              <i className={`fas ${bulkMode === 'bulkaction' ? 'fa-tasks' : bulkMode === 'whatsapp' ? 'fa-paper-plane' : 'fa-share'} me-1`}></i>
                              {bulkMode === 'bulkaction' ? 'Change Status' : bulkMode === 'whatsapp' ? 'Send Messages' : 'Refer'}
                            </button>
                          </div>
                        </div>
                      )}
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
            <section className="list-view">
              <div className="container-fluid px-0">
                <div className="row">
                  <div className="col-12 mt-1 b2b-crm-dashboard">
                    <div className="b2b-dash-section mt-2">
                      <span className="b2b-dash-section__label">B2B Leads</span>
                      <div className="b2b-mobile-hscroll d-flex gap-2 align-items-center pt-1">
                        <button
                          type="button"
                          className="b2b-perf-chip"
                          style={{
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            borderRadius: '999px',
                            cursor: 'pointer',
                            color: leadViewTab === 'all' ? '#fff' : 'rgb(250, 85, 121)',
                            backgroundColor: leadViewTab === 'all' ? 'rgb(250, 85, 121)' : '#fff',
                            border: leadViewTab === 'all' ? 'none' : '1.5px solid rgb(250, 85, 121)'
                          }}
                          onClick={() => handleLeadViewTabChange('all')}
                        >
                          All Leads
                        </button>
                        <button
                          type="button"
                          className="b2b-perf-chip"
                          style={{
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            borderRadius: '999px',
                            cursor: 'pointer',
                            color: leadViewTab === 'myRefer' ? '#fff' : 'rgb(250, 85, 121)',
                            backgroundColor: leadViewTab === 'myRefer' ? 'rgb(250, 85, 121)' : '#fff',
                            border: leadViewTab === 'myRefer' ? 'none' : '1.5px solid rgb(250, 85, 121)'
                          }}
                          onClick={() => handleLeadViewTabChange('myRefer')}
                        >
                          My Referred Leads ({myReferLeadsCount})
                        </button>
                      </div>
                    </div>

                    <div className="b2b-dash-section mt-2">
                      <span className="b2b-dash-section__label">Lead Approval</span>
                      <div className="b2b-mobile-hscroll b2b-mobile-hscroll--approval d-flex gap-2 align-items-stretch pt-1">
                        {[
                          { key: 'total', label: 'Total', value: approvalCounts.total, bg: '#5b4fc9', approval: null },
                          { key: 'approved', label: 'Approved', value: approvalCounts.approved, bg: '#10b981', approval: 'APPROVED' },
                          { key: 'pending', label: 'Pending', value: approvalCounts.pending, bg: '#f59e0b', approval: 'PENDING' },
                          { key: 'rejected', label: 'Rejected', value: approvalCounts.rejected, bg: '#ef4444', approval: 'REJECTED' },
                        ].map((row) => {
                          const isSelected = (selectedApprovalStatus || null) === row.approval;
                          return (
                            <div
                              key={row.key}
                              role="button"
                              tabIndex={0}
                              className="b2b-dash-stat-card b2b-dash-stat-card--lead text-center text-white"
                              style={{
                                background: row.bg,
                                cursor: 'pointer',
                                outline: isSelected ? '3px solid rgba(255,255,255,0.55)' : 'none',
                                transform: isSelected ? 'translateY(-1px)' : 'none',
                                opacity: approvalCountsLoading ? 0.7 : 1
                              }}
                              onClick={() => handleApprovalCardClick(row.approval)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') handleApprovalCardClick(row.approval);
                              }}
                            >
                              <div className="b2b-dash-stat-card__label">{row.label}</div>
                              <div className="b2b-dash-stat-card__divider" aria-hidden="true" />
                              <div className="b2b-dash-stat-card__value text-white">
                                {String(row.value).padStart(2, '0')}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="b2b-dash-section mt-3">
                      <span className="b2b-dash-section__label">Performance</span>
                      <div className="b2b-mobile-hscroll b2b-mobile-hscroll--chips d-flex gap-2 align-items-center pt-1">
                        {loadingStatusCounts ? (
                          <div className="d-flex gap-2 flex-wrap py-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} style={{ width: '92px', height: '34px', borderRadius: '999px', background: '#f1f3f5' }} className="d-flex align-items-center justify-content-center">
                                <div className="spinner-border spinner-border-sm text-secondary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="b2b-perf-chip"
                              style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: 600,
                                borderRadius: '999px',
                                cursor: 'pointer',
                                color: selectedStatusFilter === null ? '#fff' : 'rgb(250, 85, 121)',
                                backgroundColor: selectedStatusFilter === null ? 'rgb(250, 85, 121)' : '#fff',
                                border: selectedStatusFilter === null ? 'none' : '1.5px solid rgb(250, 85, 121)'
                              }}
                              onClick={handleTotalCardClick}
                            >
                              All ({totalLeads})
                            </button>
                            {sortedPerformanceStatuses.map((status, index) => {
                              const isSelected = selectedStatusFilter === status.statusId;
                              return (
                                <button
                                  key={status.statusId || index}
                                  type="button"
                                  className="b2b-perf-chip"
                                  style={{
                                    padding: '6px 14px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: '999px',
                                    cursor: 'pointer',
                                    color: isSelected ? '#fff' : 'rgb(250, 85, 121)',
                                    backgroundColor: isSelected ? 'rgb(250, 85, 121)' : '#fff',
                                    border: isSelected ? 'none' : '1.5px solid rgb(250, 85, 121)'
                                  }}
                                  onClick={() => handleStatusCardClick(status.statusId)}
                                >
                                  {(status.statusName || 'Status').toUpperCase()} ({status.count ?? 0})
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>

                    {hasActiveFollowupFilter && (
                      <div className="d-flex flex-wrap align-items-center gap-2 mt-2 mb-1">
                        <span className="badge rounded-pill text-bg-light border" style={{ fontSize: '12px', fontWeight: 600 }}>
                          <i className="fas fa-filter me-1 text-danger" aria-hidden="true" />
                          {filters.followUpCallBucket
                            ? `Call: ${filters.followUpCallBucket}`
                            : `Visit: ${filters.followUpVisitBucket}`}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={clearFollowupDashFilters}
                          style={{ fontSize: '12px', fontWeight: 600, borderRadius: '999px' }}
                        >
                          <i className="fas fa-list me-1" aria-hidden="true" />
                          Show all leads
                        </button>
                      </div>
                    )}

                    <div className="row g-2 mt-1">
                      <div className="col-12 col-lg-4">
                        <div className="b2b-dash-section h-100">
                          <span className="b2b-dash-section__label">Followup Calling</span>
                          <div className="d-flex flex-wrap gap-2 pt-1">
                            {[
                              { key: 'fc-done', bucket: 'done', label: 'Done', value: dashboardB2BCounts.call.done, bg: 'rgb(18, 179, 255)' },
                              { key: 'fc-planned', bucket: 'planned', label: 'Planned', value: dashboardB2BCounts.call.planned, bg: 'rgb(12, 125, 180)' },
                              { key: 'fc-missed', bucket: 'missed', label: 'Missed', value: dashboardB2BCounts.call.missed, bg: 'rgb(8, 80, 120)' }
                            ].map((row) => {
                              const selected = isFollowupDashSelected('Call', row.bucket);
                              return (
                              <button
                                key={row.key}
                                type="button"
                                className={`b2b-dash-stat-card text-center text-white flex-grow-1 border-0${selected ? ' b2b-dash-stat-card--active' : ''}`}
                                style={{ background: row.bg }}
                                onClick={() => handleFollowupDashClick('Call', row.bucket)}
                                title={`Filter leads: Call follow-ups — ${row.label}`}
                              >
                                <div className="b2b-dash-stat-card__label">{row.label}</div>
                                <div className="b2b-dash-stat-card__divider" aria-hidden="true" />
                                <div className="b2b-dash-stat-card__value text-white">
                                  {String(row.value).padStart(2, '0')}
                                </div>
                              </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-lg-4">
                        <div className="b2b-dash-section h-100">
                          <span className="b2b-dash-section__label">Followup Visit</span>
                          <div className="d-flex flex-wrap gap-2 pt-1">
                            {[
                              { key: 'fv-done', bucket: 'done', label: 'Done', value: dashboardB2BCounts.visit.done, bg: 'rgb(75, 85, 99)' },
                              { key: 'fv-planned', bucket: 'planned', label: 'Planned', value: dashboardB2BCounts.visit.planned, bg: 'rgb(55, 65, 81)' },
                              { key: 'fv-missed', bucket: 'missed', label: 'Missed', value: dashboardB2BCounts.visit.missed, bg: 'rgb(35, 42, 52)' }
                            ].map((row) => {
                              const selected = isFollowupDashSelected('Visit', row.bucket);
                              return (
                              <button
                                key={row.key}
                                type="button"
                                className={`b2b-dash-stat-card text-center text-white flex-grow-1 border-0${selected ? ' b2b-dash-stat-card--active' : ''}`}
                                style={{ background: row.bg }}
                                onClick={() => handleFollowupDashClick('Visit', row.bucket)}
                                title={`Filter leads: Visit follow-ups — ${row.label}`}
                              >
                                <div className="b2b-dash-stat-card__label">{row.label}</div>
                                <div className="b2b-dash-stat-card__divider" aria-hidden="true" />
                                <div className="b2b-dash-stat-card__value text-white">
                                  {String(row.value).padStart(2, '0')}
                                </div>
                              </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-lg-4">
                        <div className="b2b-dash-section h-100">
                          <span className="b2b-dash-section__label">Documents</span>
                          <div className="d-flex flex-wrap gap-2 pt-1">
                            {[
                              { key: 'doc-done', label: 'Done', value: dashboardB2BCounts.docs.done, bg: '#4b5563' },
                              { key: 'doc-pending', label: 'Pending', value: dashboardB2BCounts.docs.pending, bg: '#4b5563' }
                            ].map((row) => (
                              <div
                                key={row.key}
                                className="b2b-dash-stat-card text-center text-white flex-grow-1"
                                style={{ background: row.bg }}
                              >
                                <div className="b2b-dash-stat-card__label">{row.label}</div>
                                <div className="b2b-dash-stat-card__divider" aria-hidden="true" />
                                <div className="b2b-dash-stat-card__value text-white">
                                  {String(row.value).padStart(2, '0')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <style>
                      {`
                        .b2b-crm-dashboard .b2b-dash-section {
                          position: relative;
                          border: 1px solid #dee2e6;
                          border-radius: 8px;
                          padding: 5px 7px 5px;
                          background: #fff;
                        }
                        .b2b-crm-dashboard .b2b-dash-section__label {
                          position: absolute;
                          top: -10px;
                          left: 12px;
                          padding: 0 6px;
                          background: #fff;
                          font-size: 13px;
                          font-weight: 600;
                          color: #333;
                          line-height: 1.2;
                        }
                        .b2b-crm-dashboard .b2b-dash-stat-card {
                          border-radius: 8px;
                          padding: 5px;
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          justify-content: center;
                          min-height: 45px;
                          box-sizing: border-box;
                          cursor: pointer;
                          transition: transform 0.15s ease, box-shadow 0.15s ease, outline 0.15s ease;
                        }
                        .b2b-crm-dashboard .b2b-dash-stat-card:hover {
                          transform: translateY(-1px);
                          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
                        }
                        .b2b-crm-dashboard .b2b-dash-stat-card--active {
                          outline: 3px solid rgb(250, 85, 121);
                          outline-offset: 2px;
                          box-shadow: 0 4px 12px rgba(250, 85, 121, 0.35);
                        }
                        .b2b-crm-dashboard .b2b-dash-stat-card--lead {
                          flex: 1 1 96px;
                          min-width: 50px;
                          max-width: 90px;
                        }
                        .b2b-crm-dashboard .b2b-dash-stat-card:not(.b2b-dash-stat-card--lead) {
                          min-width: 84px;
                          min-height: 45px;
                        }
                        .b2b-crm-dashboard .b2b-dash-stat-card__label {
                          font-size: 11px;
                          font-weight: 600;
                          margin: 0;
                          line-height: 1.2;
                          opacity: 0.98;
                        }
                        .b2b-crm-dashboard .b2b-dash-stat-card__divider {
                          width: 72%;
                          max-width: 52px;
                          height: 1px;
                          margin: 8px 0;
                          background: rgba(255, 255, 255, 0.95);
                          flex-shrink: 0;
                        }
                        .b2b-crm-dashboard .b2b-dash-stat-card__value {
                          margin: 0;
                          font-size: 15px;
                          font-weight: 700;
                          line-height: 1.2;
                          min-width: 1.5em;
                        }

                        /* Mobile: horizontal scroll for Lead Approval cards */
                        @media (max-width: 768px){
                          .b2b-crm-dashboard .b2b-mobile-hscroll--approval{
                            overflow-x: auto;
                            overflow-y: hidden;
                            flex-wrap: nowrap;
                            -webkit-overflow-scrolling: touch;
                            padding-bottom: 4px;
                          }

                          .b2b-crm-dashboard .b2b-mobile-hscroll--approval > *{
                            flex: 0 0 auto;
                          }
                        }
                      `}
                    </style>
                  </div>
                </div>
              </div>

              {/* Bulk select bar removed — inputs live in the header (desktop/mobile) */}

              {modalType === 'whatsapp' && (
                <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                  <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered" style={{ maxWidth: '560px' }}>
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1 className="modal-title fs-5">
                          <i className="fab fa-whatsapp text-success me-2"></i>
                          Bulk WhatsApp Messages
                        </h1>
                        <button type="button" className="btn-close" onClick={closeBulkWhatsappModal} aria-label="Close"></button>
                      </div>
                      <div className="modal-body" style={{ padding: '20px' }}>
                        <div className="mb-3">
                          <span className="badge text-bg-light border">
                            Selected leads: {selectedProfiles?.length || 0}
                          </span>
                        </div>
                        <div className="mb-4">
                          <h5 className="fw-bold mb-3" style={{ fontSize: '15px' }}>Select number type to send</h5>
                          <div className="d-flex flex-column gap-2">
                            {['Mobile', 'WhatsApp Number'].map((numberType) => (
                              <div key={numberType} className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`b2b-whatsappNumber-${numberType}`}
                                  checked={selectedWhatsappNumbers.includes(numberType)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedWhatsappNumbers([...selectedWhatsappNumbers, numberType]);
                                    } else {
                                      setSelectedWhatsappNumbers(selectedWhatsappNumbers.filter((n) => n !== numberType));
                                    }
                                  }}
                                  style={{ cursor: 'pointer' }}
                                />
                                <label className="form-check-label" htmlFor={`b2b-whatsappNumber-${numberType}`} style={{ cursor: 'pointer' }}>
                                  {numberType}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mb-2">
                          <label htmlFor="b2bWhatsappTemplate" className="form-label fw-bold mb-2">Select WhatsApp Template</label>
                          <select
                            className="form-select"
                            id="b2bWhatsappTemplate"
                            value={selectedWhatsappTemplateModal}
                            onChange={(e) => setSelectedWhatsappTemplateModal(e.target.value)}
                            disabled={whatsappTemplates.length === 0}
                            style={{
                              height: '48px',
                              backgroundColor: whatsappTemplates.length === 0 ? '#e9ecef' : '#fff',
                              cursor: whatsappTemplates.length === 0 ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <option value="">
                              {whatsappTemplates.length === 0 ? 'Loading templates...' : 'Select WhatsApp Template'}
                            </option>
                            {whatsappTemplates.map((template, index) => (
                              <option key={template.id || template.name || index} value={template.id || template.name}>
                                {template.name || template.id}
                              </option>
                            ))}
                          </select>
                          {whatsappTemplates.length === 0 && (
                            <small className="text-muted d-block mt-1">
                              <i className="fas fa-spinner fa-spin me-1"></i>
                              Fetching templates...
                            </small>
                          )}
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={closeBulkWhatsappModal}>
                          Close
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleBulkWhatsappSend}
                          disabled={isSendingBulkWhatsapp}
                          style={{ backgroundColor: 'rgb(250, 85, 121)', borderColor: 'rgb(250, 85, 121)' }}
                        >
                          {isSendingBulkWhatsapp ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Sending...
                            </>
                          ) : (
                            <>
                              <i className="fab fa-whatsapp me-1"></i>
                              Send Message
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {hasAnyActiveFilters() && !loadingLeads && (
                <div
                  className="d-flex flex-wrap align-items-center gap-2 mb-3 px-2 py-2 rounded-3"
                  style={{ background: '#fff5f7', border: '1px solid rgba(250, 85, 121, 0.25)' }}
                >
                  <span className="text-muted small fw-semibold">
                    <i className="fas fa-filter me-1" style={{ color: 'rgb(250, 85, 121)' }} aria-hidden="true" />
                    Filters active
                  </span>
                  {filters.followUpCallBucket && (
                    <span className="badge rounded-pill text-bg-light border">Call: {filters.followUpCallBucket}</span>
                  )}
                  {filters.followUpVisitBucket && (
                    <span className="badge rounded-pill text-bg-light border">Visit: {filters.followUpVisitBucket}</span>
                  )}
                  {(filters.hasFollowUpCall === true || filters.hasFollowUpCall === 'yes') && (
                    <span className="badge rounded-pill text-bg-light border">Followup Calling: Yes</span>
                  )}
                  {(filters.hasFollowUpCall === false || filters.hasFollowUpCall === 'no') && (
                    <span className="badge rounded-pill text-bg-light border">Followup Calling: No</span>
                  )}
                  {(filters.hasFollowUpVisit === true || filters.hasFollowUpVisit === 'yes') && (
                    <span className="badge rounded-pill text-bg-light border">Followup Visit: Yes</span>
                  )}
                  {(filters.hasFollowUpVisit === false || filters.hasFollowUpVisit === 'no') && (
                    <span className="badge rounded-pill text-bg-light border">Followup Visit: No</span>
                  )}
                  {(filters.modifiedDateRange?.start || filters.modifiedDateRange?.end) && (
                    <span className="badge rounded-pill text-bg-light border">Modified date</span>
                  )}
                  {(filters.nextActionDateRange?.start || filters.nextActionDateRange?.end) && (
                    <span className="badge rounded-pill text-bg-light border">Next action date</span>
                  )}
                  {leadViewTab === 'myRefer' && (
                    <span className="badge rounded-pill text-bg-light border">My Refer Leads</span>
                  )}
                  {selectedStatusFilter && (
                    <span className="badge rounded-pill text-bg-light border">
                      Status: {statusCounts?.find((s) => String(s.statusId) === String(selectedStatusFilter))?.statusName || 'Selected'}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger ms-auto"
                    onClick={showAllLeads}
                    style={{ borderRadius: '999px', fontWeight: 600 }}
                  >
                    <i className="fas fa-list me-1" aria-hidden="true" />
                    Show all leads
                  </button>
                </div>
              )}

              {/* Loading State */}
              {loadingLeads ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading B2B leads...</p>
                </div>
              ) : aiLeadIntelError ? (
                <div className="alert alert-warning py-2" style={{ fontSize: '13px' }}>
                  {aiLeadIntelError}
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-inbox text-muted" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                  <h5 className="mt-3 text-muted">
                    {leadViewTab === 'myRefer'
                      ? 'No referred leads found'
                      : hasAnyActiveFilters()
                        ? 'No leads match your filters'
                        : 'No B2B Leads Found'}
                  </h5>
                  <p className="text-muted mb-3">
                    {leadViewTab === 'myRefer'
                      ? 'Leads you refer to other counsellors will appear here.'
                      : hasAnyActiveFilters()
                        ? 'Remove filters to see all leads again, or try a different filter.'
                        : 'Start by adding your first B2B lead using the "Add Lead" button.'}
                  </p>
                  {hasAnyActiveFilters() && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={showAllLeads}
                    >
                      <i className="fas fa-list me-1" aria-hidden="true" />
                      Show all leads
                    </button>
                  )}
                </div>
              ) : (
                <div className="row g-2 mt-3 b2b-leads-list">
                  {leadDisplayGroups.map((group, groupIndex) => {
                    const activeLeadId = activeProjectByGroup[group.rootId] || group.leads[0]?._id;
                    const lead = group.leads.find((l) => String(l._id) === String(activeLeadId)) || group.leads[0];
                    if (!lead) return null;
                    const leadIndex = groupIndex;
                    return (
                    <div key={group.rootId || lead._id || groupIndex} className="col-12">
                      <div className={`lead-card ${((bulkMode === 'bulkrefer' || bulkMode === 'bulkaction' || bulkMode === 'whatsapp') && (selectedProfiles || []).includes(lead._id)) ? 'bulk-selected' : ''}`}>
                        {group.leads.length > 0 && (
                          <div className="lead-project-tabs" role="tablist" aria-label="B2B projects for this business">
                            {group.leads.map((projLead) => {
                              const projId = String(projLead.b2bProject?._id || projLead.b2bProject || '');
                              const isActive = String(lead._id) === String(projLead._id);
                              const label = pickFirstNonEmpty(projLead.b2bProject?.name, 'Project');
                              return (
                                <button
                                  key={projLead._id}
                                  type="button"
                                  role="tab"
                                  aria-selected={isActive}
                                  className={`lead-project-tabs__tab${isActive ? ' lead-project-tabs__tab--active' : ''}${projLead.parentLeadId ? ' lead-project-tabs__tab--cross' : ''}`}
                                  title={label}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveProjectByGroup((prev) => ({
                                      ...prev,
                                      [group.rootId]: projLead._id,
                                    }));
                                  }}
                                >
                                  {label}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              className="lead-project-tabs__add"
                              title="Add to another project (cross-sale)"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCrossSaleModal(lead);
                              }}
                            >
                              <i className="fas fa-plus" aria-hidden="true" />
                              <span className="d-none d-md-inline"> Cross Sale</span>
                            </button>
                          </div>
                        )}
                        {/* Card Header */}
                        <div className="lead-header lead-header-v2">
                          <button
                            type="button"
                            className="lead-header-v2__float-icon"
                            aria-label={leadDetailsVisible === leadIndex ? 'Collapse lead' : 'Expand lead'}
                            title={leadDetailsVisible === leadIndex ? 'Collapse' : 'Expand'}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleLeadDetails(leadIndex);
                            }}
                          >
                            <i className={leadDetailsVisible === leadIndex ? 'fas fa-chevron-up' : 'fas fa-chevron-down'} aria-hidden="true"></i>
                          </button>
                          <button
                            type="button"
                            className="lead-header-v2__float-wa"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openWhatsappPanel(lead);
                            }}
                            title="WhatsApp"
                            aria-label="WhatsApp"
                          >
                            <i className="fab fa-whatsapp" aria-hidden="true"></i>
                          </button>
                          {/* {aiLeadIntelById?.[lead._id] && (
                            <div
                              className="lead-header-v2__float-ai d-none d-md-inline-flex"
                              title={`AI score: ${aiLeadIntelById[lead._id]?.score ?? 0}${aiLeadIntelById[lead._id]?.suggestedAction ? ` • ${aiLeadIntelById[lead._id].suggestedAction}` : ''}`}
                            >
                              AI
                            </div>
                          )} */}
                          {isMobile ? (
                            <div className="lhm">

                              {/* Row 1 — Name + Refer/History pills + Status */}
                              <div className="lhm__row1">

                                {(() => {
                                  const addressLine = getLeadAddressLine(lead);
                                  const title = [lead.concernPersonName, addressLine, lead.mobile].filter(Boolean).join(' - ');

                                  return (
                                    <div className="lhm__name" title={title || lead.businessName || ''}>
                                  {canEditLeadDetails(lead) && (
                                    <button
                                      type="button"
                                      className="lhm__name-edit"
                                      aria-label="Edit lead"
                                      title="Edit Lead"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openEditLeadModal(lead);
                                      }}
                                    >
                                      <i className="fas fa-pen" aria-hidden="true"></i>
                                    </button>
                                  )}
                                  <span className="lhm__floating-label">Lead Details</span>
                                  <div className="lhm__info-row">
                                  <i className="fas fa-user-circle lhm__name-icon" aria-hidden="true"></i>
                                  <span className="lhm__info-label">Concern</span>
                                  <span className="text-capitalize lhm__name-text">
                                    {lead.concernPersonName || '—'}
                                  </span>
                                  </div>
                                  <div className="lhm__info-row lhm__info-row--address">
                                  <i className="fas fa-map-marker-alt lhm__address-icon" aria-hidden="true"></i>
                                  <span className="lhm__info-label">Address</span>
                                  <span className="lhm__address-text text-capitalize">
                                    {addressLine || '-'}
                                  </span>
                                  </div>
                                  <div className="lhm__info-row">
                                  <i className="fas fa-phone lhm__phone-icon" aria-hidden="true"></i>
                                  <span className="lhm__info-label">Mobile</span>
                                  <span className="lhm__mobile-text">
                                    {lead.mobile || '-'}
                                  </span>
                                  </div>
                                    </div>
                                  );
                                })()}

                                {/* {aiLeadIntelById?.[lead._id] && (
                                  <div
                                    className="lhm__pills"
                                    style={{ gap: '6px' }}
                                    title={aiLeadIntelById[lead._id]?.suggestedAction || ''}
                                  >
                                    <span
                                      className="badge"
                                      style={{
                                        background: aiLeadIntelById[lead._id]?.priority === 'High'
                                          ? '#dc2626'
                                          : aiLeadIntelById[lead._id]?.priority === 'Medium'
                                            ? '#f59e0b'
                                            : '#64748b',
                                        color: 'white',
                                        borderRadius: '999px',
                                        padding: '6px 10px',
                                        fontSize: '11px',
                                        fontWeight: 700
                                      }}
                                    >
                                      AI
                                    </span>
                                  </div>
                                )} */}

                                <div className="lhm__pills">
                                  <button
                                    type="button"
                                    className="lead-meta-v2__pill"
                                    onClick={() => openRefferPanel(lead, 'Reffer')}
                                    title="Refer"
                                  >
                                    <i className="fas fa-share-alt" aria-hidden="true"></i>

                                  </button>
                                  <button
                                    type="button"
                                    className="lead-meta-v2__pill"
                                    onClick={() => navigate(`/institute/lrp?b2bLeadId=${lead._id}&mode=add`, { state: { b2bLead: lead, returnTo: lrpReturnTo } })}
                                    title="Add Lead Report"
                                  >
                                    <i className="fas fa-plus" aria-hidden="true"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="lead-meta-v2__pill"
                                    onClick={() => navigate(`/institute/lrp-view?b2bLeadId=${lead._id}`)}
                                    title="View lead Report"
                                  >
                                    <i className="fas fa-eye" aria-hidden="true"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="lead-meta-v2__pill lhm__more-float"
                                    onClick={() => setMobileMoreLead(lead)}
                                    title="More"
                                    aria-label="More"
                                  >
                                    <i className="fas fa-ellipsis-v" aria-hidden="true"></i>
                                  </button>
                                </div>

                                <div className="lhm__status-approval-row">
                                <div className="lhm__status-block" onClick={() => openEditPanel(lead, 'StatusChange')}>
                                  <button
                                    type="button"
                                    className="lhm__editbtn"
                                    title="Edit Status"
                                    aria-label="Edit Status"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditPanel(lead, 'StatusChange'); }}
                                  >
                                    <i className="fas fa-edit" aria-hidden="true"></i>
                                  </button>
                                  <div className="lhm__status-row">
                                    <span className="lhm__status-label">Status</span>
                                    <span className="lhm__status-val">
                                      {lead.status?.title || lead.status?.name || 'Untouch Lead'}
                                    </span>
                                  </div>
                                  <div className="lhm__status-row">
                                    <span className="lhm__status-label">Sub</span>
                                    <span className="lhm__status-val">
                                      {getLeadSubStatusTitle(lead) || 'Untouch Lead'}
                                    </span>
                                  </div>
                                </div>

                              </div>

                              {/* Row 2 — Phone + More + Expand */}
                              <div className="lhm__row2">
                                <div className="lhm__phone" title={lead.mobile || ''}>
                                  <i className="fas fa-phone" aria-hidden="true"></i>
                                  <span>{lead.mobile || '—'}</span>
                                </div>

                                <div className="lhm__actions">
                                  {/* Lead Approval (Mobile) — match desktop pill + pen, no "Approval:" prefix */}
                                  <div className="lead-header-mob__approval-v2">
                                    {(() => {
                                      const st = String(lead?.approval?.status || 'PENDING').toUpperCase();
                                      const safe = ['PENDING', 'APPROVED', 'REJECTED'].includes(st) ? st : 'PENDING';
                                      return (
                                        <>
                                          <button
                                            type="button"
                                            className={`lead-approval-v2__pill lead-approval-v2__pill--${safe.toLowerCase()}`}
                                            title={`Approval: ${safe}`}
                                            onClick={() => handleApprovalCardClick(safe)}
                                          >
                                            {safe}
                                          </button>

                                          {canApproveLeadsB2B && (
                                            <button
                                              type="button"
                                              className="lead-approval-v2__iconbtn"
                                              title="Change approval"
                                              onClick={() => setApprovalEditLeadId((prev) => (prev === lead._id ? null : lead._id))}
                                              aria-label="Change approval"
                                            >
                                              <i className="fas fa-pen" aria-hidden="true"></i>
                                            </button>
                                          )}

                                          {canApproveLeadsB2B && (
                                            <div
                                              className={`lead-header-v2__approval-editor ${approvalEditLeadId === lead._id ? 'is-open' : ''}`}
                                              aria-hidden={approvalEditLeadId === lead._id ? 'false' : 'true'}
                                            >
                                              {safe === 'PENDING' ? (
                                                <div className="lead-approval-v2__menu">
                                                  <button
                                                    type="button"
                                                    className="lead-approval-v2__action lead-approval-v2__action--approve"
                                                    onClick={async () => {
                                                      setApprovalEditLeadId(null);
                                                      await approveLead(lead);
                                                    }}
                                                  >
                                                  {/*  <i className="fas fa-check" aria-hidden="true"></i> */}
                                                    Approve
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="lead-approval-v2__action lead-approval-v2__action--reject"
                                                    onClick={() => {
                                                      setApprovalEditLeadId(null);
                                                      setApprovalLeadTarget(lead);
                                                      setRejectionReason('');
                                                      setShowRejectionForm(true);
                                                    }}
                                                  >
                                                  {/*  <i className="fas fa-times" aria-hidden="true"></i> */}
                                                    Reject
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="lead-approval-v2__menu lead-approval-v2__menu--readonly">
                                                  {safe}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>

                                </div>
                              </div>

                              {/* Row 3 — Followup Calling + Followup Visit */}
                              </div>
                              <div className="lhm__row3">
                                {/* Followup Calling */}
                                <div className={`lhm__followup-box${!leadHasAnyFollowup(lead) ? ' lhm__followup-box--empty' : ''}`}>
                                  <span className="lhm__followup-title">Followup Calling</span>
                                  <button
                                    type="button"
                                    className="lhm__editbtn"
                                    title="Set Followup"
                                    aria-label="Set Followup"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditPanel(lead, 'SetFollowup', 'Call'); }}
                                  >
                                    <i className="fas fa-edit" aria-hidden="true"></i>
                                  </button>
                                  <div className="lhm__followup-cards">
                                    {(() => {
                                      const b = getLeadFollowupBucket(lead, 'Call');
                                      return [
                                        { label: 'Done', value: getLeadFollowupDoneCount(lead, 'Call'), bg: 'rgb(18, 179, 255)' },
                                        { label: 'Planned', value: b === 'planned' ? 1 : 0, bg: 'rgb(12, 125, 180)' },
                                        { label: 'Missed', value: b === 'missed' ? 1 : 0, bg: 'rgb(8, 80, 120)' },
                                      ];
                                    })().map((s) => (
                                      <div key={s.label} className="lhm__stat-card" style={{ background: s.bg }}>
                                        <span className="lhm__stat-label">{s.label}</span>
                                        <span className="lhm__stat-divider" />
                                        <span className="lhm__stat-val">{String(s.value).padStart(2, '0')}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="lhm__followup-date">
                                    <span>Next Follow-up Date:</span><span>{getLeadFollowupDateLabel(lead, 'Call')}</span>
                                  </div>
                                </div>

                                {/* Followup Visit */}
                                <div className={`lhm__followup-box${!leadHasAnyFollowup(lead) ? ' lhm__followup-box--empty' : ''}`}>
                                  <span className="lhm__followup-title">Followup Visit</span>
                                  <button
                                    type="button"
                                    className="lhm__editbtn"
                                    title="Set Followup"
                                    aria-label="Set Followup"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditPanel(lead, 'SetFollowup', 'Visit'); }}
                                  >
                                    <i className="fas fa-edit" aria-hidden="true"></i>
                                  </button>
                                  <div className="lhm__followup-cards">
                                    {(() => {
                                      const b = getLeadFollowupBucket(lead, 'Visit');
                                      return [
                                        { label: 'Done', value: getLeadFollowupDoneCount(lead, 'Visit'), bg: 'rgb(75, 85, 99)' },
                                        { label: 'Planned', value: b === 'planned' ? 1 : 0, bg: 'rgb(55, 65, 81)' },
                                        { label: 'Missed', value: b === 'missed' ? 1 : 0, bg: 'rgb(35, 42, 52)' },
                                      ];
                                    })().map((s) => (
                                      <div key={s.label} className="lhm__stat-card" style={{ background: s.bg }}>
                                        <span className="lhm__stat-label">{s.label}</span>
                                        <span className="lhm__stat-divider" />
                                        <span className="lhm__stat-val">{String(s.value).padStart(2, '0')}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="lhm__followup-date">
                                    <span>Next Follow-up Date:</span><span>{getLeadFollowupDateLabel(lead, 'Visit')}</span>
                                  </div>
                                </div>
                                {/* Documents */}
                                <div className="lhm__followup-box">
                                  <span className="lhm__followup-title">Documents</span>
                                  <button
                                    type="button"
                                    className="lhm__editbtn"
                                    title="Open Documents"
                                    aria-label="Open Documents"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLeadDocuments(lead); }}
                                  >
                                    <i className="fas fa-edit" aria-hidden="true"></i>
                                  </button>
                                  <div className="lhm__followup-cards">
                                    {(() => {
                                      const b = getLeadDocumentsBucket(lead); // done | pending | null (not required)
                                      return [
                                        { label: 'Done', value: b === 'done' ? 1 : 0, bg: '#4b5563' },
                                        { label: 'Pending', value: b === 'pending' ? 1 : 0, bg: '#4b5563' },
                                      ];
                                    })().map((s) => (
                                      <div key={s.label} className="lhm__stat-card" style={{ background: s.bg }}>
                                        <span className="lhm__stat-label">{s.label}</span>
                                        <span className="lhm__stat-divider" />
                                        <span className="lhm__stat-val">{String(s.value).padStart(2, '0')}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="lhm__followup-date">
                                    <span></span><span></span>
                                  </div>
                                </div>
                              </div>

                            </div>
                          ) : (
                            <div className="lead-header-v2__row">
                              <div className="lead-header-v2__left">
                                {canEditLeadDetails(lead) && (
                                  <button
                                    type="button"
                                    className="lead-header-v2__left-edit"
                                    aria-label="Edit lead"
                                    title="Edit Lead"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openEditLeadModal(lead);
                                    }}
                                  >
                                    <i className="fas fa-pen" aria-hidden="true"></i>
                                  </button>
                                )}
                                <div className="lead-header-v2__inputs">
                                  <div className="lead-header-v2__input-row">
                                    <div className="lead-header-v2__input-wrap">
                                      <i className="fas fa-user lead-header-v2__input-icon" aria-hidden="true"></i>
                                      <input
                                        type="text"
                                        className="lead-header-v2__input text-capitalize"
                                        readOnly
                                        value={lead.concernPersonName || lead.businessName || ''}
                                        placeholder="Name"
                                        title={lead.concernPersonName || lead.businessName || 'NA'}
                                      />
                                    </div>
                                    <div className="lead-header-v2__input-wrap">
                                      <i className="fas fa-building lead-header-v2__input-icon" aria-hidden="true"></i>
                                      <input
                                        type="text"
                                        className="lead-header-v2__input text-capitalize"
                                        readOnly
                                        value={lead.businessName || ''}
                                        placeholder="Business"
                                        title={lead.businessName || 'NA'}
                                      />
                                    </div>
                                    <div className="lead-header-v2__input-wrap">
                                      <i className="fas fa-phone lead-header-v2__input-icon" aria-hidden="true"></i>
                                      <input
                                        type="text"
                                        className="lead-header-v2__input"
                                        readOnly
                                        value={lead.mobile || ''}
                                        placeholder="Mobile no"
                                        title={lead.mobile || 'NA'}
                                      />
                                      
                                    </div>
                                  </div>

                                  {/* <div className="lead-header-v2__input-row">
                                    <div className="lead-header-v2__input-wrap">
                                      <i className="fas fa-envelope lead-header-v2__input-icon" aria-hidden="true"  style={{fontSize:'9px'}}></i>
                                      <input
                                        type="text"
                                        className="lead-header-v2__input"
                                        readOnly
                                        value={lead.email || ''}
                                        placeholder="Email"   style={{fontSize:'9px'}}
                                        title={lead.email || lead.email || 'NA'}
                                      />
                                    </div>
                                  </div> */}
                                </div>
                              </div>

                              <div className="lead-header-v2__right">
                                {/* Lead Approval (PENDING / APPROVED / REJECTED) */}
                                <div className="lead-header-v2__approval">
                                  <span
                                    className="lead-header-v2__approval-label"
                                  >
                                    Lead Approval
                                  </span>
                                  {(() => {
                                    const st = String(lead?.approval?.status || 'PENDING').toUpperCase();
                                    const safe = ['PENDING', 'APPROVED', 'REJECTED'].includes(st) ? st : 'PENDING';
                                    return (
                                      <div className="lead-approval-v2__row">
                                        <button
                                          type="button"
                                          className={`lead-approval-v2__pill lead-approval-v2__pill--${safe.toLowerCase()}`}
                                          title={`Approval: ${safe}`}
                                          onClick={() => handleApprovalCardClick(safe)}
                                        >
                                          {safe}
                                        </button>

                                        {canApproveLeadsB2B && (
                                          <button
                                            type="button"
                                            className="lead-approval-v2__iconbtn"
                                            title="Change approval"
                                            onClick={() => setApprovalEditLeadId((prev) => (prev === lead._id ? null : lead._id))}
                                            aria-label="Change approval"
                                          >
                                            <i className="fas fa-pen" aria-hidden="true"></i>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {canApproveLeadsB2B && (
                                    <div
                                      className={`lead-header-v2__approval-editor ${approvalEditLeadId === lead._id ? 'is-open' : ''}`}
                                      aria-hidden={approvalEditLeadId === lead._id ? 'false' : 'true'}
                                    >
                                      {String(lead?.approval?.status || 'PENDING').toUpperCase() === 'PENDING' ? (
                                        <div className="lead-approval-v2__menu">
                                          <button
                                            type="button"
                                            className="lead-approval-v2__action lead-approval-v2__action--approve"
                                            onClick={async () => {
                                              setApprovalEditLeadId(null);
                                              await approveLead(lead);
                                            }}
                                          >
                                            {/* <i className="fas fa-check" aria-hidden="true"></i> */}
                                            Approve
                                          </button>
                                          <button
                                            type="button"
                                            className="lead-approval-v2__action lead-approval-v2__action--reject"
                                            onClick={() => {
                                              setApprovalEditLeadId(null);
                                              setApprovalLeadTarget(lead);
                                              setRejectionReason('');
                                              setShowRejectionForm(true);
                                            }}
                                          >
                                            {/* <i className="fas fa-times" aria-hidden="true"></i> */}
                                            Reject
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="lead-approval-v2__menu lead-approval-v2__menu--readonly">
                                          {String(lead?.approval?.status || '').toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                

                                {/* Refer / History pills — stacked vertically, no white box */}
                                <div className="lead-header-v2__pills">
                                  <button
                                    type="button"
                                    className="lead-meta-v2__pill"
                                    onClick={() => openRefferPanel(lead, 'Reffer')}
                                    title="Refer"
                                  >
                                    <i className="fas fa-share-alt" aria-hidden="true"></i>

                                  </button>
                                  <button
                                    type="button"
                                    className="lead-meta-v2__pill"
                                    onClick={() => navigate(`/institute/lrp?b2bLeadId=${lead._id}&mode=add`, { state: { b2bLead: lead, returnTo: lrpReturnTo } })}
                                    title="Add Lead Report"
                                  >
                                    <i className="fas fa-plus" aria-hidden="true"></i>

                                  </button>
                                  <button
                                    type="button"
                                    className="lead-meta-v2__pill"
                                    onClick={() => navigate(`/institute/lrp-view?b2bLeadId=${lead._id}`)}
                                    title="View lead Report"
                                  >
                                    <i className="fas fa-eye" aria-hidden="true"></i>

                                  </button>
                                </div>

                                {/* Performance block — label paired with each input */}
                                <div className="lead-header-v2__perf-block" style={{
                                  width: '20%'
                                }}>
                                  <span className="lead-header-v2__perf-title">Performance</span>
                                  <button
                                    type="button"
                                    className="lead-header-v2__editbtn"
                                    title="Edit Performance"
                                    aria-label="Edit Performance"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditPanel(lead, 'StatusChange'); }}
                                  >
                                    <i className="fas fa-edit" aria-hidden="true"></i>
                                  </button>

                                  {/* Lead Ranking — floating value only */}
                                {(() => {
                                  const rankingName = String(lead?.leadRanking?.name || '').trim();
                                  const display = rankingName || 'NA';
                                  return (
                                    <div
                                      className={`lead-header-v2__ranking${rankingName ? '' : ' lead-header-v2__ranking--na'}`}
                                      title={`${display}`}
                                    >
                                      <span className="lead-header-v2__ranking-label">{display}</span>
                                    </div>
                                  );
                                })()}
                                  <div className="lead-header-v2__perf-row">
                                    <span className="lead-header-v2__perf-label">Status</span>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm m-0 lead-header-v2__perf-input"
                                      value={lead.status?.title || lead.status?.name || 'Untouch Lead'}
                                      readOnly
                                      onClick={() => openEditPanel(lead, 'StatusChange')}
                                    />
                                  </div>
                                  <div className="lead-header-v2__perf-row">
                                    <span className="lead-header-v2__perf-label">Sub-Status</span>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm m-0 lead-header-v2__perf-input"
                                      value={getLeadSubStatusTitle(lead) || 'Untouch Lead'}
                                      readOnly
                                      style={{ fontSize: '8px' }}
                                    />
                                  </div>
                                  {/* mobile expand/options — keep hidden on desktop */}
                                  <div className="d-md-none d-sm-block d-block mt-1">
                                    <div className="btn-group">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary border-0"
                                        onClick={() => togglePopup(leadIndex)}
                                        aria-label="Options"
                                      >
                                        <i className="fas fa-ellipsis-v"></i>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary border-0"
                                        onClick={() => toggleLeadDetails(leadIndex)}
                                        aria-label="Expand/Collapse"
                                      >
                                        {leadDetailsVisible === leadIndex ? (
                                          <i className="fas fa-chevron-up"></i>
                                        ) : (
                                          <i className="fas fa-chevron-down"></i>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Followup Calling & Visit — Done/Planned/Missed with distinct colours */}
                                <div className="lead-header-v2__dash">
                                  <div className="lead-header-v2__dash-col">
                                    <div className={`b2b-dash-section h-100${!leadHasAnyFollowup(lead) ? ' b2b-dash-section--no-followup' : ''}`}>
                                      <span className="b2b-dash-section__label">Followup Calling</span>
                                      <button
                                        type="button"
                                        className="lead-header-v2__editbtn"
                                        title="Edit Followup Calling"
                                        aria-label="Edit Followup Calling"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditPanel(lead, 'SetFollowup', 'Call'); }}
                                      >
                                        <i className="fas fa-edit" aria-hidden="true"></i>
                                      </button>
                                      <div className="d-flex flex-wrap gap-2 pt-1">
                                        {(() => {
                                          const b = getLeadFollowupBucket(lead, 'Call');
                                          return [
                                            { key: 'fc-done', label: 'Done', value: getLeadFollowupDoneCount(lead, 'Call'), bg: 'rgb(18, 179, 255)' },
                                            { key: 'fc-planned', label: 'Planned', value: b === 'planned' ? 1 : 0, bg: 'rgb(12, 125, 180)' },
                                            { key: 'fc-missed', label: 'Missed', value: b === 'missed' ? 1 : 0, bg: 'rgb(8, 80, 120)' },
                                          ];
                                        })().map((row) => (
                                          <div
                                            key={row.key}
                                            className="b2b-dash-stat-card text-center text-white flex-grow-1"
                                            style={{ background: row.bg }}
                                          >
                                            <div className="b2b-dash-stat-card__label">{row.label}</div>
                                            <div className="b2b-dash-stat-card__divider" aria-hidden="true" />
                                            <div className="b2b-dash-stat-card__value text-white">
                                              {String(row.value).padStart(2, '0')}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="ActionsDates">
                                        <span>Next Follow-up Date:</span> <span>{getLeadFollowupDateLabel(lead, 'Call')}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="lead-header-v2__dash-col">
                                    <div className={`b2b-dash-section h-100${!leadHasAnyFollowup(lead) ? ' b2b-dash-section--no-followup' : ''}`}>
                                      <span className="b2b-dash-section__label">Followup Visit</span>
                                      <button
                                        type="button"
                                        className="lead-header-v2__editbtn"
                                        title="Edit Followup Visit"
                                        aria-label="Edit Followup Visit"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditPanel(lead, 'SetFollowup', 'Visit'); }}
                                      >
                                        <i className="fas fa-edit" aria-hidden="true"></i>
                                      </button>
                                      <div className="d-flex flex-wrap gap-2 pt-1">
                                        {(() => {
                                          const b = getLeadFollowupBucket(lead, 'Visit');
                                          return [
                                            { key: 'fv-done', label: 'Done', value: getLeadFollowupDoneCount(lead, 'Visit'), bg: 'rgb(75, 85, 99)' },
                                            { key: 'fv-planned', label: 'Planned', value: b === 'planned' ? 1 : 0, bg: 'rgb(55, 65, 81)' },
                                            { key: 'fv-missed', label: 'Missed', value: b === 'missed' ? 1 : 0, bg: 'rgb(35, 42, 52)' },
                                          ];
                                        })().map((row) => (
                                          <div
                                            key={row.key}
                                            className="b2b-dash-stat-card text-center text-white flex-grow-1"
                                            style={{ background: row.bg }}
                                          >
                                            <div className="b2b-dash-stat-card__label">{row.label}</div>
                                            <div className="b2b-dash-stat-card__divider" aria-hidden="true" />
                                            <div className="b2b-dash-stat-card__value text-white">
                                              {String(row.value).padStart(2, '0')}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="ActionsDates">
                                        <span>Next Follow-up Date:</span> <span>{getLeadFollowupDateLabel(lead, 'Visit')}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="lead-header-v2__dash-col">
                                    <div className="b2b-dash-section h-100">
                                      <span className="b2b-dash-section__label">Documents</span>
                                      <button
                                        type="button"
                                        className="lead-header-v2__editbtn"
                                        title="Open Documents"
                                        aria-label="Open Documents"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLeadDocuments(lead); }}
                                      >
                                        <i className="fas fa-edit" aria-hidden="true"></i>
                                      </button>
                                      <div className="d-flex flex-wrap gap-2 pt-1">
                                        {(() => {
                                          const b = getLeadDocumentsBucket(lead);
                                          return [
                                            { key: 'doc-done', label: 'Done', value: b === 'done' ? 1 : 0, bg: '#4b5563' },
                                            { key: 'doc-pending', label: 'Pending', value: b === 'pending' ? 1 : 0, bg: '#4b5563' },
                                          ];
                                        })().map((row) => (
                                          <div
                                            key={row.key}
                                            className="b2b-dash-stat-card text-center text-white flex-grow-1"
                                            style={{ background: row.bg }}
                                          >
                                            <div className="b2b-dash-stat-card__label">{row.label}</div>
                                            <div className="b2b-dash-stat-card__divider" aria-hidden="true" />
                                            <div className="b2b-dash-stat-card__value text-white">
                                              {String(row.value).padStart(2, '0')}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="ActionsDates">
                                        <span></span> <span></span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* expand/collapse is handled by the single floating button */}
                              </div>
                            </div>
                          )}
                        </div>

                        {leadDetailsVisible === leadIndex && (
                          <div className="lead-meta-v2">
                            <div className="lead-meta-v2__panel lead-meta-v2__panel--detail">
                              <div className="lead-meta-v2__panel-title">Lead Detail</div>
                              <div className="lead-meta-v2__grid">
                                <div className="lead-meta-v2__item">
                                  <div className="lead-meta-v2__label">Lead Age</div>
                                  {(() => {
                                    const days = getLeadAgeDays(lead);
                                    return (
                                      <div
                                        className="lead-meta-v2__value"
                                        title={days != null ? `${days} days since created` : undefined}
                                      >
                                        {days === null ? '—' : `${days} ${days === 1 ? 'day' : 'days'}`}
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="lead-meta-v2__item">
                                  <div className="lead-meta-v2__label">Lead Owner</div>
                                  <div className="lead-meta-v2__value text-capitalize" title={lead.leadOwner?.name || '—'}>{lead.leadOwner?.name || '—'}</div>
                                </div>
                                <div className="lead-meta-v2__item">
                                  <div className="lead-meta-v2__label">Added by</div>
                                  <div className="lead-meta-v2__value text-capitalize" title={lead.leadAddedBy?.name || '—'}>{lead.leadAddedBy?.name || '—'}</div>
                                </div>
                                <div className="lead-meta-v2__item">
                                  <div className="lead-meta-v2__label">B2B Department</div>
                                  <div className="lead-meta-v2__value text-capitalize" title={getLeadB2bDepartmentName(lead)}>{getLeadB2bDepartmentName(lead)}</div>
                                </div>
                                <div className="lead-meta-v2__item">
                                  <div className="lead-meta-v2__label">B2B Project</div>
                                  <div className="lead-meta-v2__value text-capitalize" title={getLeadB2bProjectName(lead)}>{getLeadB2bProjectName(lead)}</div>
                                </div>
                                <div className="lead-meta-v2__item">
                                  <div className="lead-meta-v2__label">Lead Ranking</div>
                                  <div
                                    className="lead-meta-v2__value text-capitalize"
                                    title={lead.leadRanking?.name || 'NA'}
                                  >
                                    {String(lead?.leadRanking?.name || '').trim() || 'NA'}
                                  </div>
                                </div>
                                <div className="lead-meta-v2__item">
                                  <div className="lead-meta-v2__label">Lead Source</div>
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="lead-meta-v2__value text-capitalize" title={lead.leadCategory?.name || '—'}>{lead.leadCategory?.name || '—'}</div>
                                    {(canEditLeadSourceB2B || canEditLeadTypeB2B) && (
                                      <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={() => openMetaEdit(lead)}
                                        title="Edit Lead Source / B2B Type"
                                        style={{ lineHeight: 1, color: '#0d6efd' }}
                                      >
                                        <i className="fas fa-pen" aria-hidden="true" style={{ fontSize: 12 }}></i>
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="lead-meta-v2__item">
                                  <div className="lead-meta-v2__label">B2B Type</div>
                                  <div className="lead-meta-v2__value text-capitalize" title={lead.typeOfB2B?.name || '—'}>{lead.typeOfB2B?.name || '—'}</div>
                                </div>
                                <div className="lead-meta-v2__item">
                                  <div className="lead-meta-v2__label">State</div>
                                  <div className="lead-meta-v2__value text-capitalize" title={lead.state || '—'}>{lead.state || '—'}</div>
                                </div>
                                <div className="lead-meta-v2__item">
                                  <div className="lead-meta-v2__label">City</div>
                                  <div className="lead-meta-v2__value text-capitalize" title={lead.city || '—'}>{lead.city || '—'}</div>
                                </div>
                              </div>
                              <div className="d-flex justify-content-end mt-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => openleadHistoryPanel(lead)}
                                  title="History"
                                >
                                  <i className="fas fa-history me-1" aria-hidden="true"></i>
                                  History
                                </button>
                              </div>
                            </div>

                          </div>
                        )}


                      </div>
                    </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              <nav aria-label="Page navigation" className="mt-2">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <small className="text-muted">
                    Page {currentPage} of {totalPages} ({leadDisplayGroups.length} cards / {leads.length} leads)
                  </small>
                </div>

                <ul className="pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo;
                    </button>
                  </li>

                  {currentPage > 3 && (
                    <>
                      <li className="page-item">
                        <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
                      </li>
                      {currentPage > 4 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                    </>
                  )}

                  {getPaginationPages().map((pageNumber) => (
                    <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => handlePageChange(pageNumber)}>
                        {pageNumber}
                      </button>
                    </li>
                  ))}

                  {currentPage < totalPages - 2 && !getPaginationPages().includes(totalPages) && (
                    <>
                      {currentPage < totalPages - 3 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                      <li className="page-item">
                        <button className="page-link" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
                      </li>
                    </>
                  )}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </section>
          </div>

        </div >

        {/* Right Sidebar for Desktop - Panels */}
        {
          !isMobile && showPanel && (
            <div className="col-4" style={{
              position: 'fixed',
              top: `${navHeight + 10}px`,
              right: '0',
              width: `${panelWidthPx}px`,
              maxHeight: `calc(100vh - ${navHeight + 15}px)`,
              overflowY: 'auto',
              backgroundColor: 'white',
              zIndex: 1000,
              boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
              transform: showPanel ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s ease',
              borderRadius: '8px 0 0 8px'
            }}>

              {/* Floating lead identity badge — always visible at top of panel */}
              {selectedProfile && (
                <div className="panel-lead-badge">
                  <div className="panel-lead-badge__name">
                    <i className="fas fa-user-circle" aria-hidden="true"></i>
                    <span className="text-capitalize">{selectedProfile.concernPersonName || selectedProfile.businessName || '—'}</span>
                  </div>
                  {selectedProfile.mobile && (
                    <div className="panel-lead-badge__phone">
                      <i className="fas fa-phone" aria-hidden="true"></i>
                      <span>{selectedProfile.mobile}</span>
                    </div>
                  )}
                </div>
              )}

              {renderStatusChangePanel()}
              {renderFollowupPanel()}
              {renderRefferPanel()}
              {renderLeadHistoryPanel()}
              {renderWhatsAppPanel()}

            </div>
          )
        }

        {/* Mobile Modals */}
        {isMobile && renderStatusChangePanel()}
        {isMobile && renderFollowupPanel()}
        {isMobile && renderRefferPanel()}
        {isMobile && renderLeadHistoryPanel()}
        {isMobile && renderWhatsAppPanel()}

        {/* Mobile-only: More actions modal */}
        {isMobile && mobileMoreLead && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1065 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setMobileMoreLead(null);
            }}
          >
            <div className="modal-dialog modal-dialog-centered modal-sm" style={{ maxWidth: '420px' }}>
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-header text-white">
                  <h6 className="modal-title mb-0">
                    Actions
                  </h6>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Close"
                    onClick={() => setMobileMoreLead(null)}
                  />
                </div>
                <div className="modal-body p-3">
                  <div className="d-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      className="lead-meta-v2__action-btn"
                      onClick={() => {
                        const l = mobileMoreLead;
                        setMobileMoreLead(null);
                        openWhatsappPanel(l);
                      }}
                      title="WhatsApp"
                    >
                      <i className="fab fa-whatsapp text-success"></i>
                      WhatsApp
                    </button>

                    <button
                      type="button"
                      className="lead-meta-v2__action-btn"
                      onClick={() => {
                        const l = mobileMoreLead;
                        setMobileMoreLead(null);
                        openEditPanel(l, 'SetFollowup');
                      }}
                      disabled={!canUpdateLead(mobileMoreLead)}
                      title={canUpdateLead(mobileMoreLead) ? 'Set Follow-up' : "You don't have permission to set follow-up"}
                    >
                      <i className="fas fa-calendar-plus"></i>
                      Followup
                    </button>

                    <button
                      type="button"
                      className="lead-meta-v2__action-btn"
                      onClick={() => {
                        const l = mobileMoreLead;
                        setMobileMoreLead(null);
                        openleadHistoryPanel(l);
                      }}
                    >
                      <i className="fas fa-history"></i>
                      History
                    </button>

                    <button
                      type="button"
                      className="lead-meta-v2__action-btn"
                      onClick={() => {
                        const l = mobileMoreLead;
                        setMobileMoreLead(null);
                        openRefferPanel(l, 'Reffer');
                      }}
                    >
                      <i className="fas fa-share-alt"></i>
                      Refer
                    </button>

                    {/* <button
                      type="button"
                      className="lead-meta-v2__action-btn"
                      onClick={() => {
                        const l = mobileMoreLead;
                        setMobileMoreLead(null);
                        openProfileEditPanel(l);
                      }}
                    >
                      <i className="fas fa-file-alt"></i>
                      Details
                    </button> */}

                    <button
                      type="button"
                      className="lead-meta-v2__action-btn"
                      onClick={() => {
                        const l = mobileMoreLead;
                        setMobileMoreLead(null);
                        openEditPanel(l, 'StatusChange');
                      }}
                      disabled={!canUpdateLead(mobileMoreLead)}
                      title={canUpdateLead(mobileMoreLead) ? 'Change Status' : "You don't have permission to change status"}
                    >
                      <i className="fas fa-edit"></i>
                      Status
                    </button>

                    {canEditLeadDetails(mobileMoreLead) && (
                      <button
                        type="button"
                        className="lead-meta-v2__action-btn"
                        onClick={() => {
                          const l = mobileMoreLead;
                          setMobileMoreLead(null);
                          openEditLeadModal(l);
                        }}
                        title="Edit Lead"
                      >
                        <i className="fas fa-pen"></i>
                        Edit Lead
                      </button>
                    )}

                    <Link
                      to={`/institute/lrp?b2bLeadId=${mobileMoreLead?._id || ''}&mode=add`}
                      state={{ b2bLead: mobileMoreLead, returnTo: lrpReturnTo }}
                      className="lead-meta-v2__action-btn"
                      style={{ textDecoration: 'none' }}
                      onClick={() => setMobileMoreLead(null)}
                    >
                      <i className="fas fa-clipboard-list"></i>
                      Report
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div >

      {/* Filter Modal */}
      {showFilters && (
        <div
          className="modal show d-block b2b-filter-backdrop"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable b2b-filter-dialog">
            <div className="modal-content border-0 shadow b2b-filter-modal">
              <div className="modal-header bg-header text-white">
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
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-4">
                    <MultiSelectCheckbox
                      title="Lead Source"
                      icon="fas fa-tag"
                      options={leadCategoryOptions || []}
                      selectedValues={filters.leadCategory || []}
                      onChange={(vals) => handleFilterChange('leadCategory', vals)}
                      isOpen={openModalId === 'leadCategory'}
                      onToggle={() => setOpenModalId((prev) => (prev === 'leadCategory' ? null : 'leadCategory'))}
                      onClose={() => setOpenModalId(null)}
                    />
                  </div>
                  <div className="col-md-4">
                    <MultiSelectCheckbox
                      title="Type of B2B"
                      icon="fas fa-building"
                      options={typeOfB2BOptions || []}
                      selectedValues={filters.typeOfB2B || []}
                      onChange={(vals) => handleFilterChange('typeOfB2B', vals)}
                      isOpen={openModalId === 'typeOfB2B'}
                      onToggle={() => setOpenModalId((prev) => (prev === 'typeOfB2B' ? null : 'typeOfB2B'))}
                      onClose={() => setOpenModalId(null)}
                    />
                  </div>
                  <div className="col-md-4">
                    <MultiSelectCheckbox
                      title="Lead Owner"
                      icon="fas fa-user"
                      options={(users || []).map((u) => ({ value: u._id, label: u.name || u.email || 'User' }))}
                      selectedValues={filters.leadOwner || []}
                      onChange={(vals) => handleFilterChange('leadOwner', vals)}
                      isOpen={openModalId === 'leadOwner'}
                      onToggle={() => setOpenModalId((prev) => (prev === 'leadOwner' ? null : 'leadOwner'))}
                      onClose={() => setOpenModalId(null)}
                    />
                  </div>
                  <div className="col-md-6">
                    <MultiSelectCheckbox
                      title="Status"
                      icon="fas fa-calendar"
                      options={(statuses || []).map((s) => ({ value: s._id, label: s.name || s.title || 'Status' }))}
                      selectedValues={filters.status || []}
                      onChange={(vals) => handleFilterChange('status', vals)}
                      isOpen={openModalId === 'status'}
                      onToggle={() => setOpenModalId((prev) => (prev === 'status' ? null : 'status'))}
                      onClose={() => setOpenModalId(null)}
                    />

                  </div>
                  <div className="col-md-6">
                    <MultiSelectCheckbox
                      title="Sub Status"
                      icon="fas fa-calendar"
                      options={(subStatuses || []).map((ss) => ({ value: ss._id, label: ss.title || 'Sub Status' }))}
                      selectedValues={filters.subStatus || []}
                      onChange={(vals) => handleFilterChange('subStatus', vals)}
                      isOpen={openModalId === 'subStatus'}
                      onToggle={() => setOpenModalId((prev) => (prev === 'subStatus' ? null : 'subStatus'))}
                      onClose={() => setOpenModalId(null)}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-phone text-primary me-2"></i>
                      Followup Calling
                    </label>
                    <select
                      className="form-select"
                      value={filters.hasFollowUpCall === true || filters.hasFollowUpCall === 'yes' ? 'yes' : filters.hasFollowUpCall === false || filters.hasFollowUpCall === 'no' ? 'no' : ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        handleFilterChange('hasFollowUpCall', v === 'yes' ? true : v === 'no' ? false : '');
                      }}
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-map-marker-alt text-primary me-2"></i>
                      Followup Visit
                    </label>
                    <select
                      className="form-select"
                      value={filters.hasFollowUpVisit === true || filters.hasFollowUpVisit === 'yes' ? 'yes' : filters.hasFollowUpVisit === false || filters.hasFollowUpVisit === 'no' ? 'no' : ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        handleFilterChange('hasFollowUpVisit', v === 'yes' ? true : v === 'no' ? false : '');
                      }}
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <MultiSelectCheckbox
                      title="Documents"
                      icon="fas fa-file"
                      options={[
                        { value: 'pending', label: 'Pending' },
                        { value: 'done', label: 'Done' },
                      ]}
                      selectedValues={filters.documentsStatus || []}
                      onChange={(vals) => handleFilterChange('documentsStatus', vals)}
                      isOpen={openModalId === 'documentsStatus'}
                      onToggle={() => setOpenModalId((prev) => (prev === 'documentsStatus' ? null : 'documentsStatus'))}
                      onClose={() => setOpenModalId(null)}
                    />
                  </div>

                  <div className="col-12">
                    <div className="b2b-filter-date-ranges">
                      <div className="b2b-filter-date-ranges__head">
                        <i className="fas fa-calendar-alt text-danger me-2" aria-hidden="true" />
                        Date Filters
                      </div>

                      <div className="b2b-filter-date-row">
                        <div className="b2b-filter-date-row__label">
                          <i className="fas fa-calendar-plus text-danger me-1" aria-hidden="true" />
                          Lead Creation
                        </div>
                        <div className="b2b-filter-date-row__field">
                          <label className="form-label small text-muted mb-1">From</label>
                          <input
                            type="date"
                            className="form-control form-control-sm border-0 bg-white"
                            value={filters.dateRange.start || ''}
                            onChange={(e) => handleDateRangeChange('dateRange', 'start', e.target.value)}
                          />
                        </div>
                        <div className="b2b-filter-date-row__field">
                          <label className="form-label small text-muted mb-1">To</label>
                          <input
                            type="date"
                            className="form-control form-control-sm border-0 bg-white"
                            value={filters.dateRange.end || ''}
                            onChange={(e) => handleDateRangeChange('dateRange', 'end', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="b2b-filter-date-row">
                        <div className="b2b-filter-date-row__label">
                          <i className="fas fa-calendar-check text-danger me-1" aria-hidden="true" />
                          Lead Modification
                        </div>
                        <div className="b2b-filter-date-row__field">
                          <label className="form-label small text-muted mb-1">From</label>
                          <input
                            type="date"
                            className="form-control form-control-sm border-0 bg-white"
                            value={filters.modifiedDateRange.start || ''}
                            onChange={(e) => handleDateRangeChange('modifiedDateRange', 'start', e.target.value)}
                          />
                        </div>
                        <div className="b2b-filter-date-row__field">
                          <label className="form-label small text-muted mb-1">To</label>
                          <input
                            type="date"
                            className="form-control form-control-sm border-0 bg-white"
                            value={filters.modifiedDateRange.end || ''}
                            onChange={(e) => handleDateRangeChange('modifiedDateRange', 'end', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="b2b-filter-date-row">
                        <div className="b2b-filter-date-row__label">
                          <i className="fas fa-calendar-day text-danger me-1" aria-hidden="true" />
                          Next Action
                        </div>
                        <div className="b2b-filter-date-row__field">
                          <label className="form-label small text-muted mb-1">From</label>
                          <input
                            type="date"
                            className="form-control form-control-sm border-0 bg-white"
                            value={filters.nextActionDateRange.start || ''}
                            onChange={(e) => handleDateRangeChange('nextActionDateRange', 'start', e.target.value)}
                          />
                        </div>
                        <div className="b2b-filter-date-row__field">
                          <label className="form-label small text-muted mb-1">To</label>
                          <input
                            type="date"
                            className="form-control form-control-sm border-0 bg-white"
                            value={filters.nextActionDateRange.end || ''}
                            onChange={(e) => handleDateRangeChange('nextActionDateRange', 'end', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
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
                  className="btn applyFilters"
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

      {/* Reject Lead Modal */}
      {showRejectionForm && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1065 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRejectionForm(false);
              setApprovalLeadTarget(null);
            }
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Reject Lead</h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowRejectionForm(false);
                    setApprovalLeadTarget(null);
                  }}
                />
              </div>
              <div className="modal-body">
                <label className="form-label fw-medium">Reason (optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason"
                />
                <small className="text-muted d-block mt-2">
                  Lead: {approvalLeadTarget?.businessName || approvalLeadTarget?.concernPersonName || '—'}
                </small>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRejectionForm(false);
                    setApprovalLeadTarget(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={async () => {
                    if (!approvalLeadTarget) return;
                    const lead = approvalLeadTarget;
                    setShowRejectionForm(false);
                    setApprovalLeadTarget(null);
                    await rejectLead(lead, rejectionReason);
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Documents Modal */}
      {showLeadDocumentsModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1065 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLeadDocumentsModal(false);
              setDocumentsLead(null);
            }
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content b2b-docs-modal">
              <div className="modal-header b2b-docs-modal__header">
                <h6 className="modal-title b2b-docs-modal__title">
                  Documents — {documentsLead?.businessName || documentsLead?.concernPersonName || 'Lead'}
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowLeadDocumentsModal(false);
                    setDocumentsLead(null);
                  }}
                />
              </div>

              <div className="modal-body">
                <div className="row g-2 align-items-end">
                  <div className="col-md-5">
                    <label className="form-label small fw-semibold mb-1">Doc Type</label>
                    {(leadCategoryDocuments || []).length ? (
                      <select
                        className="form-select b2b-docs-modal__select"
                        value={leadDocType}
                        onChange={(e) => setLeadDocType(e.target.value)}
                      >
                        <option value="">Select</option>
                        {(leadCategoryDocuments || []).map((d) => (
                          <option key={String(d?.name || '')} value={String(d?.name || '')}>
                            {String(d?.name || '')}{d?.isMandatory ? ' *' : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="form-control b2b-docs-modal__select"
                        value={leadDocType}
                        onChange={(e) => setLeadDocType(e.target.value)}
                        placeholder="e.g. PAN, GST"
                      />
                    )}
                  </div>
                  <div className="col-md-5">
                    <label className="form-label small fw-semibold mb-1">File</label>
                    <input
                      ref={leadDocFileRef}
                      type="file"
                      className="form-control b2b-docs-modal__file"
                      onChange={(e) => setLeadDocFileSelected(Boolean(e.target?.files?.[0]))}
                    />
                  </div>
                  <div className="col-md-2 d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-primary w-100 b2b-docs-modal__uploadbtn"
                      disabled={
                        leadDocumentUploading ||
                        !String(leadDocType || '').trim() ||
                        !leadDocFileSelected
                      }
                      onClick={uploadLeadDocument}
                    >
                      {leadDocumentUploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>

                <hr />

                {leadDocumentsLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-secondary" role="status" />
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle b2b-docs-modal__table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(mergedLeadDocuments || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center text-muted py-4">
                              No documents
                            </td>
                          </tr>
                        ) : (
                          (mergedLeadDocuments || []).map((doc) => (
                            <tr key={doc._id || doc.id || doc.url}>
                              <td style={{ maxWidth: 260 }}>
                                <div className="fw-medium text-truncate" title={doc.name || doc.url}>
                                  {doc.name || 'Document'}
                                </div>
                                {doc.isMandatory && <span className="b2b-docs-modal__req">Required</span>}
                                {doc.url ? (
                                  <a href={doc.url} target="_blank" rel="noreferrer" className="small">
                                    View
                                  </a>
                                ) : doc.isPlaceholder ? (
                                  <div className="small text-muted">Not uploaded yet</div>
                                ) : null}
                                {doc.isExtra && (
                                  <div className="small text-muted">Extra</div>
                                )}
                              </td>
                              <td>{doc.docType || '—'}</td>
                              <td>
                                <span
                                  className={`badge ${String(doc.status).toUpperCase() === 'APPROVED'
                                    ? 'bg-success'
                                    : String(doc.status).toUpperCase() === 'REJECTED'
                                      ? 'bg-danger'
                                      : String(doc.status).toUpperCase() === 'MISSING'
                                        ? 'bg-secondary'
                                        : 'bg-warning text-dark'
                                    }`}
                                >
                                  {String(doc.status || 'PENDING')}
                                </span>
                              </td>
                              <td className="text-end">
                                {doc.isPlaceholder ? (
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => {
                                      setLeadDocType(doc.docType || doc.name || '');
                                      if (leadDocFileRef.current) leadDocFileRef.current.focus();
                                    }}
                                  >
                                    Upload
                                  </button>
                                ) : canApproveLeadsB2B && (
                                  <div className="btn-group btn-group-sm" role="group">
                                    <button
                                      type="button"
                                      className="btn btn-outline-success"
                                      onClick={() => updateLeadDocumentStatus(doc._id, 'APPROVED')}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger"
                                      onClick={() => updateLeadDocumentStatus(doc._id, 'REJECTED')}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowLeadDocumentsModal(false);
                    setDocumentsLead(null);
                  }}
                >
                  Close
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
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #fc567b 13%, #fc567b 50%)', color: 'white' }}>
                  <h5 className="modal-title d-flex align-items-center">
                    <i className={`fas ${editingLeadId ? 'fa-pen' : 'fa-user-plus'} me-2`}></i>
                    {editingLeadId ? 'Edit B2B Lead' : 'Add New B2B Lead'}
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
                    {/* Lead Category */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-tag text-primary me-1"></i>
                        Lead Source <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${formErrors.leadCategory ? 'is-invalid' : ''}`}
                        name="leadCategory"
                        value={leadFormData.leadCategory}
                        onChange={handleLeadInputChange}
                      >
                        <option value="">Select Lead Source</option>
                        {leadCategoryOptions.filter(category => category).map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                      {formErrors.leadCategory && (
                        <div className="invalid-feedback">
                          {formErrors.leadCategory}
                        </div>
                      )}
                    </div>

                    {/* B2B Department */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-sitemap text-primary me-1"></i>
                        B2B Department <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${formErrors.b2bDepartment ? 'is-invalid' : ''}`}
                        name="b2bDepartment"
                        value={leadFormData.b2bDepartment}
                        onChange={handleLeadInputChange}
                      >
                        <option value="">Select B2B Department</option>
                        {allB2bDepartments.map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.b2bDepartment && (
                        <div className="invalid-feedback">
                          {formErrors.b2bDepartment}
                        </div>
                      )}
                    </div>

                    {/* B2B Project */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-project-diagram text-primary me-1"></i>
                        B2B Project <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${formErrors.b2bProject ? 'is-invalid' : ''}`}
                        name="b2bProject"
                        value={leadFormData.b2bProject}
                        onChange={handleLeadInputChange}
                        disabled={!leadFormData.b2bDepartment}
                      >
                        <option value="">
                          {leadFormData.b2bDepartment ? 'Select B2B Project' : 'Select department first'}
                        </option>
                        {addLeadProjects.map((proj) => (
                          <option key={proj._id} value={proj._id}>
                            {proj.name}
                          </option>
                        ))}
                      </select>
                      {leadFormData.b2bDepartment && addLeadProjects.length === 0 && (
                        <small className="text-danger">No projects for this department. Add one in B2B Settings.</small>
                      )}
                      {formErrors.b2bProject && (
                        <div className="invalid-feedback">
                          {formErrors.b2bProject}
                        </div>
                      )}
                    </div>

                    {/* Type of B2B */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-industry text-primary me-1"></i>
                        Type of B2B <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${formErrors.typeOfB2B ? 'is-invalid' : ''}`}
                        name="typeOfB2B"
                        value={leadFormData.typeOfB2B}
                        onChange={handleLeadInputChange}
                        disabled={!leadFormData.b2bDepartment}
                      >
                        <option value="">
                          {leadFormData.b2bDepartment ? 'Select B2B Type' : 'Select department first'}
                        </option>
                        {addLeadTypeOptions.filter(type => type).map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {leadFormData.b2bDepartment && addLeadTypeOptions.length === 0 && (
                        <small className="text-danger">No B2B types for this department. Add one in B2B Settings.</small>
                      )}
                      {formErrors.typeOfB2B && (
                        <div className="invalid-feedback">
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
                        value={leadFormData.leadOwner}
                        onChange={handleLeadInputChange}
                      >
                        <option value="">Select Lead Owner</option>
                        {userData?._id &&
                          !users?.some((u) => String(u?._id) === String(userData._id)) && (
                            <option key={`me-${userData._id}`} value={String(userData._id)}>
                              {userData.name || 'Me'}
                            </option>
                          )}
                        {users?.map(user => (
                          <option key={user?._id} value={user?._id}>
                            {user?.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {!editingLeadId && (
                    <>
                    {/* Status */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-chart-line text-primary me-1"></i>
                        Lead Status
                      </label>
                      <select
                        className="form-select"
                        name="leadStatus"
                        value={leadFormData.leadStatus}
                        onChange={handleLeadInputChange}
                      >
                        <option value="">Select Lead Status </option>
                        {[...(statuses || [])]
                          .sort((a, b) =>
                            String(a?.name || a?.title || '').localeCompare(
                              String(b?.name || b?.title || ''),
                              undefined,
                              { sensitivity: 'base', numeric: true }
                            )
                          )
                          .map((status) => (
                            <option key={status._id} value={status._id}>
                              {status.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Sub Status (options from API for selected Lead Status) */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-layer-group text-primary me-1"></i>
                        Sub Status
                      </label>
                      <select
                        className="form-select"
                        name="leadSubStatus"
                        value={leadFormData.leadSubStatus}
                        onChange={handleLeadInputChange}
                        disabled={!leadFormData.leadStatus || addLeadSubStatusesLoading}
                      >
                        <option value="">
                          {addLeadSubStatusesLoading
                            ? 'Loading sub-statuses...'
                            : !leadFormData.leadStatus
                              ? 'Select lead status first'
                              : 'Select sub-status'}
                        </option>
                        {addLeadSubStatuses.map((ss) => (
                          <option key={ss._id} value={ss._id}>
                            {ss.title}
                          </option>
                        ))}
                      </select>
                      {leadFormData.leadStatus && !addLeadSubStatusesLoading && addLeadSubStatuses.length === 0 && (
                        <div className="form-text text-muted small">No sub-statuses configured for this status.</div>
                      )}
                    </div>
                    {/* Lead Ranking */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-trophy text-primary me-1"></i>
                        Lead Ranking
                      </label>
                      <select
                        className="form-select"
                        name="leadRanking"
                        value={leadFormData.leadRanking || ''}
                        onChange={handleLeadInputChange}
                        disabled={leadRankingsLoading}
                      >
                        <option value="">
                          {leadRankingsLoading ? 'Loading rankings...' : 'Select Lead Ranking'}
                        </option>
                        {leadRankings.map((ranking) => (
                          <option key={ranking._id} value={ranking._id}>
                            {ranking.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    </>
                    )}

                    {/* Remark */}
                    <div className="col-12">
                      <div className="d-flex align-items-center justify-content-between">
                        <label className="form-label fw-bold mb-1">
                          <i className="fas fa-comment text-primary me-1"></i>
                          Remark
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            const suggestion = buildLeadRemarkSuggestion({
                              leadFormData,
                              leadCategoryOptions,
                              typeOfB2BOptions
                            });
                            setLeadFormData((prev) => ({
                              ...prev,
                              remark: prev.remark ? `${prev.remark}\n\n${suggestion}` : suggestion
                            }));
                          }}
                        >
                          AI Suggest
                        </button>
                      </div>
                      <textarea
                        className="form-control"
                        name="remark"
                        value={leadFormData.remark}
                        onChange={handleLeadInputChange}
                        placeholder="Enter remark"
                        rows={4}
                      />
                      <div className="form-text">
                        Use AI Suggest
                      </div>
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
                          disabled={loading}
                        >
                          <i className="fas fa-save me-1"></i>
                          {loading ? 'Saving...' : editingLeadId ? 'Save Changes' : 'Add Lead'}
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
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #fc567b 13%, #fc567b 50%)', color: 'white' }}>
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

              <div className="modal-body p-4">
                <div className="alert alert-info mb-4">
                  <h6 className="fw-bold mb-2">
                    <i className="fas fa-info-circle me-2"></i>
                    Instructions:
                  </h6>
                  <ul className="mb-0 small">
                    <li>Step 1: Select Lead Source, B2B Department, B2B Project, Type of B2B, Lead Status, Sub Status, and Counsellor below.</li>
                    <li>Step 2: Upload an Excel file (.xlsx or .xls, max 10MB).</li>
                    <li><strong>Required in Excel:</strong> Business Name, Concern Person Name, Mobile.</li>
                    <li>All imported leads use your selections above. You do not need those columns in Excel.</li>
                    <li>Counsellor is optional; if selected, all imported leads are assigned to that counsellor.</li>
                  </ul>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="fas fa-tag text-primary me-1"></i>
                      Lead Source <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${bulkUploadFormErrors.leadCategory ? 'is-invalid' : ''}`}
                      name="leadCategory"
                      value={bulkUploadFormData.leadCategory}
                      onChange={handleBulkUploadInputChange}
                      disabled={bulkUploadLoading}
                    >
                      <option value="">Select Lead Source</option>
                      {leadCategoryOptions.filter((category) => category).map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    {bulkUploadFormErrors.leadCategory && (
                      <div className="invalid-feedback d-block">{bulkUploadFormErrors.leadCategory}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="fas fa-sitemap text-primary me-1"></i>
                      B2B Department <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${bulkUploadFormErrors.b2bDepartment ? 'is-invalid' : ''}`}
                      name="b2bDepartment"
                      value={bulkUploadFormData.b2bDepartment}
                      onChange={handleBulkUploadInputChange}
                      disabled={bulkUploadLoading}
                    >
                      <option value="">Select B2B Department</option>
                      {allB2bDepartments.map((dept) => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                    {bulkUploadFormErrors.b2bDepartment && (
                      <div className="invalid-feedback d-block">{bulkUploadFormErrors.b2bDepartment}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="fas fa-project-diagram text-primary me-1"></i>
                      B2B Project <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${bulkUploadFormErrors.b2bProject ? 'is-invalid' : ''}`}
                      name="b2bProject"
                      value={bulkUploadFormData.b2bProject}
                      onChange={handleBulkUploadInputChange}
                      disabled={bulkUploadLoading || !bulkUploadFormData.b2bDepartment}
                    >
                      <option value="">
                        {bulkUploadFormData.b2bDepartment ? 'Select B2B Project' : 'Select department first'}
                      </option>
                      {bulkUploadProjectOptions.map((proj) => (
                        <option key={proj._id} value={proj._id}>{proj.name}</option>
                      ))}
                    </select>
                    {bulkUploadFormErrors.b2bProject && (
                      <div className="invalid-feedback d-block">{bulkUploadFormErrors.b2bProject}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="fas fa-building text-primary me-1"></i>
                      Type of B2B <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${bulkUploadFormErrors.typeOfB2B ? 'is-invalid' : ''}`}
                      name="typeOfB2B"
                      value={bulkUploadFormData.typeOfB2B}
                      onChange={handleBulkUploadInputChange}
                      disabled={bulkUploadLoading || !bulkUploadFormData.b2bDepartment}
                    >
                      <option value="">
                        {bulkUploadFormData.b2bDepartment ? 'Select B2B Type' : 'Select department first'}
                      </option>
                      {bulkUploadTypeOptions.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {bulkUploadFormErrors.typeOfB2B && (
                      <div className="invalid-feedback d-block">{bulkUploadFormErrors.typeOfB2B}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="fas fa-chart-line text-primary me-1"></i>
                      Lead Status <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${bulkUploadFormErrors.leadStatus ? 'is-invalid' : ''}`}
                      name="leadStatus"
                      value={bulkUploadFormData.leadStatus}
                      onChange={handleBulkUploadInputChange}
                      disabled={bulkUploadLoading}
                    >
                      <option value="">Select Lead Status</option>
                      {[...(statuses || [])]
                        .sort((a, b) =>
                          String(a?.name || a?.title || '').localeCompare(
                            String(b?.name || b?.title || ''),
                            undefined,
                            { sensitivity: 'base', numeric: true }
                          )
                        )
                        .map((status) => (
                          <option key={status._id} value={status._id}>
                            {status.name}
                          </option>
                        ))}
                    </select>
                    {bulkUploadFormErrors.leadStatus && (
                      <div className="invalid-feedback d-block">{bulkUploadFormErrors.leadStatus}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="fas fa-layer-group text-primary me-1"></i>
                      Sub Status <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${bulkUploadFormErrors.leadSubStatus ? 'is-invalid' : ''}`}
                      name="leadSubStatus"
                      value={bulkUploadFormData.leadSubStatus}
                      onChange={handleBulkUploadInputChange}
                      disabled={!bulkUploadFormData.leadStatus || bulkUploadSubStatusesLoading || bulkUploadLoading}
                    >
                      <option value="">
                        {bulkUploadSubStatusesLoading
                          ? 'Loading sub-statuses...'
                          : !bulkUploadFormData.leadStatus
                            ? 'Select lead status first'
                            : 'Select sub-status'}
                      </option>
                      {bulkUploadSubStatuses.map((ss) => (
                        <option key={ss._id} value={ss._id}>
                          {ss.title}
                        </option>
                      ))}
                    </select>
                    {bulkUploadFormErrors.leadSubStatus && (
                      <div className="invalid-feedback d-block">{bulkUploadFormErrors.leadSubStatus}</div>
                    )}
                    {bulkUploadFormData.leadStatus && !bulkUploadSubStatusesLoading && bulkUploadSubStatuses.length === 0 && (
                      <div className="form-text text-muted small">No sub-statuses configured for this status.</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="fas fa-user-tie text-primary me-1"></i>
                      Counsellor
                    </label>
                    <select
                      className="form-select"
                      name="leadOwner"
                      value={bulkUploadFormData.leadOwner}
                      onChange={handleBulkUploadInputChange}
                      disabled={bulkUploadLoading}
                    >
                      <option value="">Select Counsellor</option>
                      {userData?._id &&
                        !users?.some((u) => String(u?._id) === String(userData._id)) && (
                          <option key={`bulk-me-${userData._id}`} value={String(userData._id)}>
                            {userData.name || 'Me'}
                          </option>
                        )}
                      {users?.map((user) => (
                        <option key={user?._id} value={user?._id}>
                          {user?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="fas fa-trophy text-primary me-1"></i>
                      Lead Ranking
                    </label>
                    <select
                      className="form-select"
                      name="leadRanking"
                      value={bulkUploadFormData.leadRanking || ''}
                      onChange={handleBulkUploadInputChange}
                      disabled={bulkUploadLoading || leadRankingsLoading}
                    >
                      <option value="">
                        {leadRankingsLoading ? 'Loading rankings...' : 'Select Lead Ranking'}
                      </option>
                      {leadRankings.map((ranking) => (
                        <option key={ranking._id} value={ranking._id}>
                          {ranking.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold mb-3">
                    <i className="fas fa-file-excel text-success me-2"></i>
                    Select File <span className="text-danger">*</span>
                  </label>
                  {!isBulkUploadConfigComplete && (
                    <div className="alert alert-warning py-2 small mb-2">
                      Complete all required fields above before choosing a file.
                    </div>
                  )}
                  <div className="input-group">
                    <input
                      type="file"
                      id="bulkUploadFile"
                      ref={bulkUploadFileInputRef}
                      className="form-control"
                      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={handleBulkFileChange}
                      disabled={bulkUploadLoading || !isBulkUploadConfigComplete}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => bulkUploadFileInputRef.current?.click()}
                      disabled={bulkUploadLoading || !isBulkUploadConfigComplete}
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

                <div className="mb-4">
                  <button
                    type="button"
                    className="btn sampledownload btn-sm"
                    onClick={downloadB2bLeadsSampleExcel}
                  >
                    <i className="fas fa-download me-1"></i>
                    Download Sample
                  </button>
                </div>

                {bulkUploadMessage && (
                  <div className={`alert ${bulkUploadSuccess ? 'alert-success' : 'alert-danger'} mb-3`}>
                    <i className={`fas ${bulkUploadSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
                    {bulkUploadMessage}
                  </div>
                )}

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
                    className="btn uploadLeads px-4 text-white"
                    onClick={handleBulkUpload}
                    disabled={!bulkUploadFile || bulkUploadLoading || !isBulkUploadConfigComplete}
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
      .dayReport:hover{
      background: linear-gradient(135deg, #fc567b 13%, #fc567b 50%) !important;
      }
      .StatusBadge , .applyFilters , .uploadLeads{
      background: linear-gradient(135deg, #fc567b 13%, #fc567b 50%) !important;
      color: white
      }
      .StatusChange:hover , .filterBadge:hover{
      background: transparent;
      }
      .sampledownload{
       background: linear-gradient(135deg, #fc567b 13%, #fc567b 50%) !important;
      color: white
      }
      .updateStatus{
      background: linear-gradient(135deg, #fc567b 13%, #fc567b 50%) !important;
      color: white
      }
      .sampledownload:hover , .updateStatus:hover{
      background: transparent;
      color: #fff;
      }
      .bg-header{
      background: linear-gradient(135deg, #fc567b 13%, #fc567b 50%) !important;
      }
  .modal .pac-container {
    z-index: 99999 !important;
    position: fixed !important;
  }

  .b2b-docs-modal{
    border-radius: 14px;
    overflow: hidden;
  }
  .b2b-docs-modal__header{
    background: linear-gradient(90deg, #0b5ed7 0%, #1aa3ff 55%, #2dd4ff 100%);
    color: #fff;
    border-bottom: 0;
    padding: 10px 14px;
  }
  .b2b-docs-modal__title{
    font-weight: 800;
  }
  .b2b-docs-modal__header .btn-close{
    filter: invert(1) grayscale(1);
    opacity: 0.9;
  }

  .b2b-docs-modal__select,
  .b2b-docs-modal__file{
    border-radius: 12px;
  }

  .b2b-docs-modal__uploadbtn{
    border-radius: 12px;
    font-weight: 800;
  }

  .b2b-docs-modal__table thead th{
    font-size: 12px;
    font-weight: 800;
    color: #334155;
    border-bottom: 1px solid #e2e8f0;
  }
  .b2b-docs-modal__table tbody td{
    border-top: 1px solid #f1f5f9;
  }

  .b2b-docs-modal__req{
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    color: #b91c1c;
    background: rgba(239,68,68,0.10);
    border: 1px solid rgba(239,68,68,0.22);
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
    background-color: #007bff;
    color: white;
  }

  /* MultiSelectCheckbox (Filter Modal) */
  .multi-select-container-new{
    position: relative;
  }
  .multi-select-dropdown-new{
    position: relative;
  }
  .multi-select-trigger{
    border-radius: 12px !important;
    border: 1px solid #e5e7eb !important;
    background: #fff !important;
    height: 44px;
    padding: 10px 40px 10px 12px !important;
    font-weight: 600;
    color: #111827;
    transition: box-shadow 160ms ease, border-color 160ms ease, transform 160ms ease;
  }
  .multi-select-trigger:hover{
    border-color: #d1d5db !important;
    box-shadow: 0 6px 18px rgba(17, 24, 39, 0.08);
    transform: translateY(-1px);
  }
  .multi-select-trigger.open{
    border-color: rgba(252, 86, 123, 0.75) !important;
    box-shadow: 0 10px 26px rgba(252, 86, 123, 0.18);
    transform: translateY(-1px);
  }
  .multi-select-trigger .dropdown-arrow{
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.7;
    transition: transform 160ms ease, opacity 160ms ease;
  }
  .multi-select-trigger.open .dropdown-arrow{
    opacity: 0.95;
  }
  .multi-select-trigger .select-display-text{
    display: inline-block;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: 18px;
  }

  .multi-select-options-new{
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    z-index: 1066;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    box-shadow: 0 18px 46px rgba(17, 24, 39, 0.12);
    overflow: hidden;

    opacity: 0;
    transform: translateY(-6px) scale(0.98);
    pointer-events: none;
    transition: opacity 160ms ease, transform 160ms ease;
  }
  .multi-select-options-new.up{
    top: auto;
    bottom: calc(100% + 8px);
  }
  .multi-select-options-new.open{
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }
  .multi-select-options-new.open.up{
    transform: translateY(0) scale(1);
  }
  .multi-select-options-new .options-search{
    padding: 10px 10px 8px;
    border-bottom: 1px solid #f1f5f9;
    background: #fff;
  }
  .multi-select-options-new .options-search .input-group-text{
    border-radius: 12px 0 0 12px !important;
    border: 1px solid #e5e7eb !important;
    background: #f8fafc !important;
    color: #6b7280;
  }
  .multi-select-options-new .options-search input.form-control{
    border-radius: 0 12px 12px 0 !important;
    border: 1px solid #e5e7eb !important;
    border-left: 0 !important;
    height: 40px;
    box-shadow: none !important;
  }
  .multi-select-options-new .options-search input.form-control:focus{
    border-color: rgba(252, 86, 123, 0.65) !important;
  }
  .options-list-new{
    max-height: 260px;
    overflow: auto;
    padding: 8px;
  }
  .option-item-new{
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 10px;
    cursor: pointer;
    user-select: none;
    transition: background 140ms ease, transform 140ms ease;
  }
  .option-item-new:hover{
    background: rgba(252, 86, 123, 0.08);
    transform: translateY(-1px);
  }
  .option-label-new{
    font-weight: 600;
    font-size: 13px;
    color: #111827;
  }
  .option-item-new .form-check-input{
    cursor: pointer;
    margin-top: 0 !important;
  }
  .options-footer{
    padding: 8px 10px;
    border-top: 1px solid #f1f5f9;
    background: #fff;
  }
  .no-options{
    padding: 12px 10px;
    color: #6b7280;
    font-weight: 600;
    font-size: 13px;
  }

  /* B2B Cycle header filters (top row, right aligned) */
  .b2b-cycle-filters{
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: flex-end;
    gap: 8px 12px;
    max-width: 100%;
  }
  .b2b-cycle-filters__item{
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .b2b-cycle-filters__label{
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin: 0;
    line-height: 1.2;
    white-space: nowrap;
  }
  .b2b-cycle-filters__label i{
    margin-right: 4px;
    color: rgb(250, 85, 121);
    font-size: 9px;
  }
  .b2b-cycle-filters__select{
    font-size: 12px;
    font-weight: 500;
    line-height: 1.3;
    padding: 6px 28px 6px 10px;
    height: 34px;
    min-width: 120px;
    max-width: 155px;
    border: 1.5px solid #e8eaed;
    border-radius: 8px;
    background-color: #f9fafb;
    color: #1f2937;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath fill='%236b7280' d='M4.427 6.427l3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 6H4.604a.25.25 0 0 0-.177.427z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 9px center;
    background-size: 12px;
  }
  .b2b-cycle-filters__select:hover{
    border-color: rgba(250, 85, 121, 0.4);
    background-color: #fff;
  }
  .b2b-cycle-filters__select:focus{
    outline: none;
    border-color: rgb(250, 85, 121);
    background-color: #fff;
    box-shadow: 0 0 0 3px rgba(250, 85, 121, 0.14);
  }
  .b2b-cycle-filters--mobile{
    flex-wrap: nowrap;
    justify-content: flex-start;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 4px 2px 8px;
    margin-bottom: 4px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }
  .b2b-cycle-filters--mobile .b2b-cycle-filters__item{
    flex: 0 0 auto;
  }
  .b2b-cycle-filters--mobile .b2b-cycle-filters__select{
    min-width: 108px;
    max-width: 130px;
  }
  @media (max-width: 1399px){
    .b2b-cycle-filters__select{
      min-width: 108px;
      max-width: 132px;
    }
  }

  /* Filter modal */
  .b2b-filter-backdrop{
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1060;
    overflow-y: auto;
  }
  .b2b-filter-dialog{
    max-width: 860px;
    margin: 1rem auto;
  }
  .b2b-filter-modal{
    max-height: calc(100vh - 2rem);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 14px;
  }
  .b2b-filter-modal .modal-header{
    flex: 0 0 auto;
  }
  .b2b-filter-modal .modal-body{
    overflow-y: auto !important;
    overflow-x: hidden;
    flex: 1 1 auto;
    min-height: 0;
    -webkit-overflow-scrolling: touch;
  }
  .b2b-filter-modal .modal-footer{
    flex: 0 0 auto;
    border-top: 1px solid #e9ecef;
  }
  .b2b-filter-date-ranges{
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    padding: 12px 14px;
  }
  .adm-header-date-range{
    position: relative;
    margin-top: 8px;
    overflow: visible;
  }
  .adm-header-date-range__pills{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    overflow: visible;
  }
  .adm-header-date-range--compact .adm-header-date-range__pills{
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 2px;
  }
  .adm-header-date-range--compact .adm-header-date-range__pills::-webkit-scrollbar{
    display: none;
  }
  .adm-header-date-range__pill{
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid #e5e7eb;
    background: #fff;
    color: #4b5563;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    white-space: nowrap;
    cursor: pointer;
    box-sizing: border-box;
    box-shadow: 0 2px 8px transparent;
    transition: all 0.2s ease;
  }
  .adm-header-date-range__pill:hover{
    border-color: rgba(250, 85, 121, 0.45);
    color: rgb(250, 85, 121);
    background: rgba(250, 85, 121, 0.06);
  }
  .adm-header-date-range__pill--active{
    background: linear-gradient(135deg, #fc567b 13%, #fc567b 50%);
    border-color: rgb(250, 85, 121);
    color: #fff;
    box-shadow: 0 2px 8px rgba(250, 85, 121, 0.22);
  }
  .adm-header-date-range__pill--active:hover{
    background: linear-gradient(135deg, #fc567b 13%, #fc567b 50%);
    color: #fff;
  }
  .adm-header-date-range__custom-wrap{
    position: relative;
    display: inline-flex;
    align-items: center;
  }
  .adm-header-date-range__pill--clear{
    border-color: #fca5a5;
    color: #dc2626;
    background: #fff;
  }
  .adm-header-date-range__pill--clear:hover{
    border-color: #f87171;
    color: #b91c1c;
    background: #fef2f2;
  }
  .adm-header-date-range__dropdown{
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 1060;
    min-width: 560px;
    max-width: 580px;
    padding: 12px;
    background: #fff;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
    overflow: visible;
  }
  .adm-header-date-range--compact .adm-header-date-range__dropdown{
    right: 0;
    left: auto;
    min-width: 300px;
    max-width: 320px;
  }
  .adm-header-date-range__dropdown-title{
    font-size: 12px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 8px;
  }
  .adm-header-date-range__date-display{
    display: flex;
    align-items: center;
    min-height: 34px;
    padding: 6px 10px;
    border: 1.5px solid #e8eaed;
    border-radius: 8px;
    background: #f9fafb;
    font-size: 12px;
    font-weight: 600;
    color: #1f2937;
  }
  .adm-header-date-range__calendars-row{
    display: flex;
    gap: 10px;
    margin-top: 10px;
    align-items: flex-start;
  }
  .adm-header-date-range__calendar-col{
    flex: 1;
    min-width: 0;
  }
  .adm-header-date-range__calendar.react-calendar{
    width: 100% !important;
    max-width: 260px;
    height: min-content !important;
    border: 1px solid #e8eaed;
    border-radius: 10px;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
    padding: 6px;
    line-height: 1.2;
    font-size: 11px;
  }
  .adm-header-date-range__calendar .react-calendar__navigation{
    margin-bottom: 6px;
  }
  .adm-header-date-range__calendar .react-calendar__navigation button{
    min-width: 28px;
    font-size: 13px;
  }
  .adm-header-date-range__calendar .react-calendar__month-view__weekdays{
    font-size: 10px;
    font-weight: 700;
  }
  .adm-header-date-range__calendar .react-calendar__tile{
    padding: 6px 4px;
    font-size: 11px;
  }
  .adm-header-date-range__calendar .react-calendar__tile--active,
  .adm-header-date-range__calendar .react-calendar__tile--hasActive{
    background: rgb(250, 85, 121) !important;
    color: #fff;
  }
  .adm-header-date-range__calendar .react-calendar__tile--now{
    background: rgba(250, 85, 121, 0.12);
  }
  .adm-header-date-range--compact .adm-header-date-range__calendars-row{
    flex-direction: column;
    gap: 8px;
  }
  .adm-header-date-range--compact .adm-header-date-range__calendar.react-calendar{
    max-width: 100%;
  }
  .adm-header-date-range__selected{
    color: rgb(250, 85, 121);
    background: rgba(250, 85, 121, 0.08);
    border-radius: 8px;
    padding: 6px 8px;
  }
  .adm-header-date-range__apply-btn{
    background: linear-gradient(135deg, #fc567b 13%, #fc567b 50%);
    border: none;
    color: #fff;
    font-weight: 600;
  }
  .adm-header-date-range__apply-btn:hover{
    background: linear-gradient(135deg, #e84d6f 13%, #e84d6f 50%);
    color: #fff;
  }
  .b2b-filter-date-ranges__head{
    font-size: 0.9rem;
    font-weight: 600;
    color: #212529;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #dee2e6;
  }
  .b2b-filter-date-row{
    display: grid;
    grid-template-columns: minmax(150px, 1.2fr) 1fr 1fr;
    gap: 10px 12px;
    align-items: end;
    padding: 10px 0;
    border-bottom: 1px solid #e9ecef;
  }
  .b2b-filter-date-row:last-child{
    border-bottom: none;
    padding-bottom: 0;
  }
  .b2b-filter-date-row__label{
    font-size: 0.8125rem;
    font-weight: 600;
    color: #343a40;
    padding-bottom: 6px;
  }
  .b2b-filter-date-row__field .form-control{
    min-height: 36px;
  }

  /* Filter modal: mobile layout */
  @media (max-width: 576px){
    .b2b-filter-dialog{
      width: calc(100vw - 16px);
      margin: 8px auto;
      max-width: calc(100vw - 16px);
    }
    .b2b-filter-modal{
      max-height: calc(100vh - 16px) !important;
    }
    .b2b-filter-modal .modal-header{
      padding: 10px 12px;
    }
    .b2b-filter-modal .modal-body{
      padding: 12px !important;
    }
    .b2b-filter-modal .modal-footer{
      gap: 8px;
      padding: 10px 12px;
      flex-wrap: wrap;
    }
    .b2b-filter-modal .modal-footer .btn{
      flex: 1;
      white-space: nowrap;
    }
    .b2b-filter-date-row{
      grid-template-columns: 1fr;
      gap: 6px;
      padding: 12px 0;
    }
    .b2b-filter-date-row__label{
      padding-bottom: 0;
    }
    .options-list-new{
      max-height: 210px;
    }
    .multi-select-options-new{
      border-radius: 12px;
    }
  }
  @media (max-width: 767px){
    .b2b-filter-date-row{
      grid-template-columns: 1fr 1fr;
    }
    .b2b-filter-date-row__label{
      grid-column: 1 / -1;
      padding-bottom: 0;
    }
  }

  /* Modern Lead Card Styles */
  .lead-card {
    --lead-card-radius: 20px;
    background: white;
    border-radius: var(--lead-card-radius);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 0.5rem;
    position: relative;
  }

  .lead-card > .lead-project-tabs:first-child {
    border-radius: var(--lead-card-radius) var(--lead-card-radius) 0 0;
  }

  .lead-card > .lead-header.lead-header-v2:first-child {
    border-radius: var(--lead-card-radius) var(--lead-card-radius) 0 0;
  }

  .lead-card > .lead-header.lead-header-v2:last-child {
    border-radius: 0 0 var(--lead-card-radius) var(--lead-card-radius);
  }

  .lead-card > .lead-header.lead-header-v2:first-child:last-child {
    border-radius: var(--lead-card-radius);
  }

  .lead-card > .lead-meta-v2:last-child {
    border-radius: 0 0 var(--lead-card-radius) var(--lead-card-radius);
  }

  .lead-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }

  /* Bulk selection highlight */
  .lead-card.bulk-selected {
    outline: 2px solid #0d6efd;
    box-shadow: 0 8px 25px rgba(13, 110, 253, 0.25);
  }

  /* Header Section */
  .lead-header {
    color: white;
    position: relative;
    overflow: visible;
  }

  .lead-header-v2{
    background: linear-gradient(90deg, #0b5ed7 0%, #1aa3ff 55%, #2dd4ff 100%);
    padding: 8px 10px;
    position: relative;
    --lead-header-v2-block-h: 92px;
    overflow: visible;
    z-index: 3;
  }

  .lhm__name-edit,
  .lead-header-v2__left-edit{
    width: 22px;
    height: 22px;
    min-width: 22px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.92);
    color: #0b5ed7;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    font-size: 10px;
    line-height: 1;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }

  .lhm__name-edit:hover,
  .lead-header-v2__left-edit:hover{
    background: #fff;
    color: #fc2b5a;
  }

  .lead-header-v2__left-edit{
    position: absolute;
    top: -6px;
    left: -6px;
    z-index: 3;
  }

  .lead-header-v2__float-icon{
    position: absolute;
    top: 10px;
    right: 10px;
    transform: none;
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.92);
    color: #0b5ed7;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    cursor: pointer;
    backdrop-filter: blur(6px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.18);
  }

  .lead-header-v2__float-icon:hover{
    background: rgba(255,255,255,0.98);
  }

  .lead-header-v2__float-wa{
    position: absolute;
    top: 10px;
    right: 54px; /* left of expand chevron */
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 1px solid rgba(37, 211, 102, 0.95);
    background: rgba(37, 211, 102, 0.95);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(0,0,0,0.18);
  }

  .lead-header-v2__float-wa:hover{
    background: rgba(37, 211, 102, 1);
  }

  .lead-header-v2__float-wa i{
    font-size: 16px;
  }

  @media (max-width: 768px){
    .lead-header-v2__float-icon{
      display: none;
    }
    .lead-header-v2__float-wa{
      right: 10px; /* expand is hidden on mobile */
    }
  }

  .lead-header-v2__float-ai{
    position: absolute;
    top: 10px;
    right: 54px; /* leave space for expand button */
    transform: none;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(220, 38, 38, 0.95);
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    box-shadow: 0 6px 16px rgba(0,0,0,0.18);
    border: 1px solid rgba(255,255,255,0.35);
    z-index: 998;
    white-space: nowrap;
    cursor: default;
  }

  .lead-header-v2__row{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:8px;
    flex-wrap: nowrap;
  }

  .lead-header-v2__left{
    display:flex;
    align-items:center;
    gap:8px;
    min-width: 132px;
    flex: 0 0 132px;
        position: relative;
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 10px;
    padding: 8px 8px 6px;
    background: rgba(255, 255, 255, 0.14);
    backdrop-filter: blur(6px);
  }

  .lead-header-v2__inputs{
    width: 100%;
    display:flex;
    flex-direction:column;
    gap:8px;
  }

  .lead-header-v2__input-row{
    display:flex;
    gap:10px;
    align-items:center;
    flex-wrap: nowrap;
    flex-direction: column;
  }

  .lead-header-v2__input-wrap{
    position: relative;
    display:flex;
    align-items:center;
    gap:8px;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 10px;
    padding: 5px 8px;
    // flex: 1 1 0;
    // min-width: 150px;
    // width: 250px;
  }

  .lead-header-v2__input-icon{
    font-size: 13px;
    opacity: 0.95;
    flex-shrink:0;
  }

  .lead-header-v2__input{
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    line-height: 1.1;
    padding: 0;
    min-width: 0;
  }

  .lead-header-v2__input::placeholder{
    color: rgba(255,255,255,0.85);
    font-weight: 600;
  }

  .lead-header-v2__approval{
    position: relative;
    display:flex;
    gap:8px;
    flex-shrink:0;
    flex-direction: column;
    padding: 12px 8px 8px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255,255,255,0.28);
    backdrop-filter: blur(6px);
    z-index: 20;
    overflow: visible;
  }

  .lead-header-v2__ranking{
    position: relative;
    display: flex;
    align-items: flex-start;
    align-self: flex-start;
    justify-content: flex-start;
    flex-shrink: 0;
    margin-top: -2px;
    padding: 0;
    border: 0;
    background: transparent;
    z-index: 21;
    overflow: visible;
  }

  .lead-header-v2__approval-label{
    position: absolute;
    top: 0;
    left: -9px;
    transform: translateY(-50%);
    padding: 0 5px;
    border-radius: 999px;
    background: rgba(11, 94, 215, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: #fff;
    font-size: 10px;
    font-weight: 900;
    line-height: 18px;
    white-space: nowrap;
  }

  .lead-header-v2__ranking-label{
    display: inline-flex;
    align-items: center;
    padding: 0 8px;
    border-radius: 999px;
    background: rgba(11, 94, 215, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: #fff;
    font-size: 10px;
    font-weight: 900;
    line-height: 18px;
    white-space: nowrap;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    position: absolute;
    left:0;
    bottom:-86px
  }

  .lead-header-v2__ranking--na .lead-header-v2__ranking-label{
    opacity: 0.85;
  }

  .lead-header-v2__approval-btn{
    background: rgba(255,255,255,0.22);
    border: 1px solid rgba(255,255,255,0.35);
    color:#fff;
    border-radius: 8px;
    padding: 5px 7px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    height: 32px;
  }


  .lead-approval-v2__row{
    display:flex;
    align-items:center;
    gap: 8px;
    width: 100%;
    justify-content: center;
    flex-direction: column;
    flex-wrap: nowrap;
  }

  .lead-approval-v2__pill{
    border: 1px solid rgba(255,255,255,0.35);
    color: #fff;
    border-radius: 999px;
    padding: 6px 12px;
    height: 32px;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.02em;
    background: rgba(255,255,255,0.18);
    text-transform: uppercase;
    min-width: 110px;
  }

  .lead-approval-v2__pill--pending{
    background: rgba(245, 158, 11, 0.28);
    border-color: rgba(245, 158, 11, 0.55);
  }
  .lead-approval-v2__pill--approved{
    background: rgba(16, 185, 129, 0.28);
    border-color: rgba(16, 185, 129, 0.55);
  }
  .lead-approval-v2__pill--rejected{
    background: rgba(239, 68, 68, 0.26);
    border-color: rgba(239, 68, 68, 0.55);
  }

  .lead-approval-v2__iconbtn{
    width: 32px;
    height: 32px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.35);
    background: rgba(255,255,255,0.16);
    color: #fff;
    transition: transform 120ms ease, background 120ms ease, box-shadow 120ms ease;
  }
  .lead-approval-v2__iconbtn:hover{
    transform: translateY(-1px);
    background: rgba(255,255,255,0.24);
    box-shadow: 0 6px 14px rgba(0,0,0,0.18);
  }
  .lead-approval-v2__iconbtn i{ font-size: 12px; }

  .lead-approval-v2__menu{
    display:flex;
    flex-direction: column;
    gap: 8px;
    // padding: 10px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.35);
    background: rgba(255,255,255,0.85);
    box-shadow: 0 10px 24px rgba(0,0,0,0.18);
  }

  .lead-approval-v2__menu--readonly{
    font-size: 12px;
    font-weight: 800;
    color: #0f172a;
    text-align: center;
  }

  .lead-approval-v2__action{
    width: 100%;
    display:flex;
    align-items:center;
    justify-content:center;
    gap: 8px;
    border-radius: 10px;
    border: none;
    padding: 8px 10px;
    font-size: 10px;
    font-weight: 900;
    cursor: pointer;
  }
  .lead-approval-v2__action--approve{
    background: #10b981;
    color: #fff;
  }
  .lead-approval-v2__action--reject{
    background: #ef4444;
    color: #fff;
  }


  .lead-header-v2__editbtn{
    position: absolute;
    right: 0px;
    bottom: 0px;
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.35);
    background: rgba(255,255,255,0.18);
    color: #fff;
    padding: 0;
    line-height: 1;
    cursor: pointer;
    transition: transform 120ms ease, background 120ms ease, box-shadow 120ms ease;
    z-index: 2;
  }

  .lead-header-v2__editbtn:hover{
    transform: translateY(-1px);
    background: rgba(255,255,255,0.24);
    box-shadow: 0 6px 14px rgba(0,0,0,0.18);
  }

  .lead-header-v2__editbtn i{
    font-size: 10px;
  }

  .lead-header-v2__approval-editor{
    position:absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    width: 100%;
    max-width: 100%;
    z-index: 1000;
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
    pointer-events: none;
    visibility: hidden;
    transition: opacity 160ms ease, transform 160ms ease, visibility 0s linear 160ms;
  }

  .lead-header-v2__approval-editor.is-open{
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
    visibility: visible;
    transition: opacity 180ms ease, transform 180ms ease;
  }

  .lead-header-v2__approval-select{
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.35);
    background: rgba(255,255,255,0.22);
    color:#111;
    font-weight: 800;
  }

  .lead-header-v2__kv{
    display:flex;
    flex-direction:column;
    gap:6px;
    min-width: 120px;
    flex: 0 0 auto;
  }

  /* Desktop: Lead Source + B2B Type as one tab */
  .lead-header-v2__kv-tab{
    display:flex;
    align-items:stretch;
    gap: 12px;
    padding: 8px 10px;
    border-radius: 12px;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.28);
  }

  .lead-header-v2__kv-tab .lead-header-v2__kv{
    min-width: 0;
  }

  .lead-header-v2__kv-tab .lead-header-v2__kv + .lead-header-v2__kv{
    padding-left: 12px;
    border-left: 1px solid rgba(255,255,255,0.22);
  }

  .lead-header-v2__kv-label{
    font-size: 12px;
    font-weight: 800;
    opacity: 0.9;
    line-height: 1;
    text-align: left;
  }

  .lead-header-v2__kv-value{
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.28);
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    max-width: 135px;
    overflow:hidden;
    text-overflow:ellipsis;
  }

  .lead-header-v2__right{
    display:flex;
    align-items:stretch;
    gap:8px;
    flex-wrap: nowrap;
    justify-content:flex-end;
    flex: 1 1 auto;
    min-width: 0;
    // overflow: hidden;
    white-space: nowrap;
    position: relative;
  }

  .lead-header-v2__dash{
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    width: clamp(480px, 48vw, 700px);
    min-width: 0;
    flex: 1 1 auto;
  }

  .lead-header-v2__dash-col{
    width: auto;
    min-width: 0;
    display: flex;
    align-items: stretch;
  }

  /* Header followup mini-cards (match fig-1 look) */
  .lead-header-v2 .b2b-dash-section{
    position: relative;
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 10px;
    padding: 8px 8px 6px;
    background: rgba(255,255,255,0.14);
    backdrop-filter: blur(6px);
    width: 100%;
    min-height: var(--lead-header-v2-block-h);
    display: flex;
    flex-direction: column;
  }

  .lead-header-v2 .b2b-dash-section--no-followup{
    background: #fecaca;
    border-color: #fca5a5;
  }

  .lead-header-v2 .b2b-dash-section--no-followup .ActionsDates,
  .lead-header-v2 .b2b-dash-section--no-followup .ActionsDates span:last-child{
    color: #7f1d1d;
    border-top-color: rgba(127, 29, 29, 0.25);
  }

  .lead-header-v2 .b2b-dash-section--no-followup .lead-header-v2__editbtn{
    background: #ef4444;
    border-color: #dc2626;
    color: #fff;
  }

  /* Make stats row use remaining height so all blocks match */
  .lead-header-v2 .b2b-dash-section > .d-flex{
    flex: 1 1 auto;
    min-height: 0;
    align-items: center;
  }

  .lead-header-v2 .b2b-dash-section > .ActionsDates{
    margin-top: auto;
  }

  .lead-header-v2__approval,
  .lead-header-v2__perf-block{
    min-height: var(--lead-header-v2-block-h);
  }

  .lead-header-v2 .b2b-dash-section__label{
    position: absolute;
    top: -10px;
    left: 10px;
    padding: 0 8px;
    border-radius: 999px;
    background: rgba(11, 94, 215, 0.95);
    border: 1px solid rgba(255,255,255,0.35);
    color: #fff;
    font-size: 11px;
    font-weight: 900;
    line-height: 18px;
    white-space: nowrap;
  }

  .lead-header-v2 .b2b-dash-stat-card{
    border-radius: 8px;
    padding: 5px 5px 4px;
    min-height: 48px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    box-shadow: 0 6px 14px rgba(0,0,0,0.14);
    min-width: 0;
  }

  .lead-header-v2 .b2b-dash-stat-card__label{
    font-size: 9px;
    font-weight: 800;
    line-height: 1.05;
    opacity: 0.98;
  }

  .lead-header-v2 .b2b-dash-stat-card__divider{
    width: 72%;
    max-width: 56px;
    height: 1px;
    margin: 4px 0;
    background: rgba(255,255,255,0.95);
    flex-shrink: 0;
  }

  .lead-header-v2 .b2b-dash-stat-card__value{
    font-size: 13px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: 0.3px;
  }

  /* Keep dashboard compact on one line (desktop) */
  @media (max-width: 1360px){
    .lead-header-v2__dash{ width: clamp(480px, 48vw, 680px); gap: 8px; }
    .lead-header-v2 .b2b-dash-section{ padding: 7px 7px 6px; }
  }

  @media (max-width: 1200px){
    .lead-header-v2__dash{ width: clamp(420px, 46vw, 620px); gap: 8px; }
    .lead-header-v2 .b2b-dash-stat-card{ min-height: 44px; }
    .lead-header-v2 .b2b-dash-stat-card__label{ font-size: 8.5px; }
    .lead-header-v2 .b2b-dash-stat-card__value{ font-size: 12px; }
    .lead-header-v2 .ActionsDates{ font-size: 10px; }
  }

  @media (max-width: 1100px){
    .lead-header-v2__dash{
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 820px){
    .lead-header-v2__dash{
      grid-template-columns: 1fr;
    }
  }

  .lead-header-v2 .ActionsDates{
    display:flex;
    justify-content:left;
    gap:10px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid rgba(255,255,255,0.22);
    color: rgba(255,255,255,0.95);
    font-size: 11px;
    font-weight: 800;
    // flex-wrap: wrap;
    white-space: normal;
    min-width: 0;
  }

  .lead-header-v2 .ActionsDates span:last-child{
    color: #fff;
  }

  /* Prevent Next Follow-up Date from overflowing */
  .lead-header-v2 .ActionsDates span:first-child{
    // flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lead-header-v2 .ActionsDates span:last-child{
    flex: 0 0 auto;
    white-space: nowrap;
  }

  /* Pills wrapper in card header (Refer / History) — no white background */
  .lead-header-v2__pills{
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  /* Performance block: title + label-input rows */
  .lead-header-v2__perf-block{
    display: flex;
    flex-direction: column;
    gap: 5px;
    flex-shrink: 0;
    min-width: 148px;
        position: relative;
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 10px;
    padding: 10px 10px 8px;
    background: rgba(255, 255, 255, 0.14);
    backdrop-filter: blur(6px);
  }
.lead-header-v2__perf-title{
position: absolute;
    top: -10px;
    left: 10px;
    padding: 0 8px;
    border-radius: 999px;
    background: rgba(11, 94, 215, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: #fff;
    font-size: 12px;
    font-weight: 900;
    line-height: 18px;
    white-space: nowrap;
}
  .lead-header-v2__perf-title{
    font-size: 11px;
    font-weight: 900;
    color: rgba(255,255,255,0.95);
    text-align: center;
    letter-spacing: 0.3px;
  }

  .lead-header-v2__perf-row{
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .lead-header-v2__perf-label{
    font-size: 10px;
    font-weight: 800;
    color: rgba(255,255,255,0.9);
    white-space: nowrap;
    min-width: 58px;
  }

  .lead-header-v2__perf-input{
    cursor: pointer;
    height: 22px !important;
    font-size: 10px !important;
    border-radius: 6px !important;
    border: 1px solid rgba(255,255,255,0.35) !important;
    background: rgba(255,255,255,0.18) !important;
    color: #fff !important;
    font-weight: 700 !important;
    padding: 0 6px !important;
    min-width: 0;
    flex: 1 1 auto;
  }

  .lead-header-v2__perf-input::placeholder{
    color: rgba(255,255,255,0.75);
  }

  /* Legacy — keep status-stack for mobile header */
  .lead-header-v2__status-stack{
    width: clamp(92px, 11vw, 120px);
    flex: 0 0 auto;
    min-width: 92px;
  }

  .lead-header-v2__status-stack input{
    width: 100%;
  }

  /* ══════════════════════════════════════════
     LHM — Redesigned mobile lead card header
     ══════════════════════════════════════════ */
  .lhm{
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    padding-right: 42px;
  }

  /* ── Row 1: Name | Pills | Status ── */
  .lhm__row1{
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: stretch;
    gap: 8px;
  }

  .lhm__name{
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
    flex: 1 1 auto;
    max-width: none;
    min-width: 0;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 10px;
    padding: 14px 10px 9px;
    overflow: visible;
    position: relative;
    min-height: 92px;
    white-space: normal;
  }

  .lhm__name-edit{
    position: absolute;
    top: -6px;
    left: -6px;
    z-index: 3;
  }

  .lhm__name-icon{
    font-size: 15px;
    color: #fff;
    opacity: 0.9;
    flex-shrink: 0;
  }

  .lhm__name-text{
    font-size: 13px;
    font-weight: 800;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1 1 auto;
    min-width: 0;
  }

  .lhm__floating-label{
    position: absolute;
    top: -8px;
    left: 12px;
    z-index: 2;
    padding: 0 7px;
    border-radius: 999px;
    background: rgba(11,94,215,0.95);
    border: 1px solid rgba(255,255,255,0.35);
    color: #fff;
    font-size: 9px;
    font-weight: 900;
    line-height: 16px;
    white-space: nowrap;
  }

  .lhm__identity-divider{
    flex: 0 0 auto;
    width: 1px;
    height: 16px;
    background: rgba(255,255,255,0.38);
  }

  .lhm__info-row{
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    line-height: 1.15;
  }

  .lhm__info-row--address{
    align-items: flex-start;
  }

  .lhm__info-label{
    flex: 0 0 42px;
    color: rgba(255,255,255,0.72);
    font-size: 9px;
    font-weight: 900;
    line-height: 1.15;
    text-transform: uppercase;
  }

  .lhm__address-icon{
    flex: 0 0 auto;
    font-size: 11px;
    color: rgba(255,255,255,0.88);
  }

  .lhm__phone-icon{
    flex: 0 0 auto;
    font-size: 11px;
    color: rgba(255,255,255,0.88);
  }

  .lhm__address-text{
    flex: 1 1 auto;
    min-width: 0;
    display: -webkit-box;
    overflow: hidden;
    color: rgba(255,255,255,0.92) !important;
    font-size: 11.5px;
    font-weight: 800;
    line-height: 1.25;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .lhm__mobile-text{
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #fff;
    font-size: 12.5px;
    font-weight: 900;
    line-height: 1.2;
    white-space: nowrap;
  }

  /* Refer + History — stacked, compact */
  .lhm__pills{
    display: flex;
    flex-direction: column;
    gap: 5px;
    position: absolute;
    top: 2px;
    right: 0;
    z-index: 5;
  }

  /* Mobile: make icon pills match header glass style (not red) */
  @media (max-width: 768px){
    .lhm__pills .lead-meta-v2__pill{
      width: 34px;
      height: 34px;
      padding: 0;
      border-radius: 12px;
      background: rgba(255,255,255,0.16);
      border: 1px solid rgba(255,255,255,0.35);
      box-shadow: 0 8px 18px rgba(0,0,0,0.18);
      color: #fff;
    }

    .lhm__pills .lead-meta-v2__pill i{
      font-size: 14px;
    }
  }

  .lhm__pill{
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 999px;
    border: none;
    font-size: 11px;
    font-weight: 800;
    color: #fff;
    white-space: nowrap;
    line-height: 1;
  }

  .lhm__pill--refer{
    background: #ff3b30;
  }

  .lhm__pill--history{
    background: rgba(255,255,255,0.22);
    border: 1px solid rgba(255,255,255,0.35);
  }

  /* Status block — tappable, shows status + sub-status */
  .lhm__status-approval-row{
    grid-column: 1;
    display: flex;
    align-items: stretch;
    min-width: 0;
  }

  .lhm__status-block{
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 10px;
    padding: 7px 36px 7px 9px;
    cursor: pointer;
    min-width: 0;
    max-width: none;
    width: 100%;
    position: relative;
  }

  .lhm__status-block .lhm__editbtn{
    top: 50%;
    right: 7px;
    bottom: auto;
    transform: translateY(-50%);
  }

  .lhm__status-row{
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    flex: 1 1 0;
  }

  .lhm__status-label{
    font-size: 9px;
    font-weight: 900;
    color: rgba(255,255,255,0.75);
    white-space: nowrap;
    min-width: 26px;
  }

  .lhm__status-val{
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: none;
    min-width: 0;
  }

  /* ── Row 2: Phone | More | Expand ── */
  .lhm__row2{
    grid-column: 2;
    grid-row: 2;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    align-self: stretch;
    gap: 6px;
  }

  .lhm__phone{
    display: none;
    flex: 1 1 auto;
    align-items: center;
    gap: 7px;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 10px;
    padding: 7px 12px;
    font-size: 13px;
    font-weight: 800;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .lhm__phone i{
    font-size: 12px;
    opacity: 0.85;
    flex-shrink: 0;
  }

  .lhm__actions{
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: flex-end;
    flex: 0 0 auto;
    min-width: 0;
  }

  .lhm__action-btn{
    height: 34px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.35);
    background: rgba(255,255,255,0.18);
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    white-space: nowrap;
    min-width: 34px;
  }

  .lhm__action-btn--more{
    background: rgba(255,255,255,0.22);
  }

  /* ── Row 3: Followup Calling + Followup Visit ── */
  .lhm__row3{
    display: flex;
    gap: 8px;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    scroll-snap-type: x proximity;
    padding-top: 9px;
    padding-bottom: 2px;
    width: 100%;
    max-width: 100%;
  }

  .lhm__row3::-webkit-scrollbar{
    display:none;
  }

  .lhm__followup-box{
    flex: 0 0 clamp(252px, 86vw, 292px);
    min-width: clamp(252px, 86vw, 292px);
    background: rgba(255,255,255,0.13);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 10px;
    padding: 10px 8px 7px;
    position: relative;
    overflow: visible;
    scroll-snap-align: start;
  }

  .lhm__followup-box--empty{
    background: #fecaca;
    border-color: #fca5a5;
  }

  .lhm__followup-box--empty .lhm__followup-date{
    color: #7f1d1d;
    border-top-color: rgba(127, 29, 29, 0.25);
  }

  .lhm__followup-box--empty .lhm__editbtn{
    background: #ef4444;
    border-color: #dc2626;
    color: #fff;
  }

  /* Bottom-right edit button (mobile header boxes) */
  .lhm__editbtn{
    position: absolute;
    right: 6px;
    bottom: 6px;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.35);
    background: rgba(255,255,255,0.18);
    color: #fff;
    padding: 0;
    line-height: 1;
    z-index: 2;
  }

  .lhm__editbtn i{
    font-size: 11px;
  }

  .lhm__followup-title{
    position: absolute;
    top: -9px;
    left: 8px;
    background: rgba(11,94,215,0.95);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 999px;
    color: #fff;
    font-size: 10px;
    font-weight: 900;
    padding: 0 7px;
    line-height: 17px;
    white-space: nowrap;
  }

  .lhm__followup-cards{
    display: flex;
    gap: 5px;
  }

  .lhm__stat-card{
    flex: 1 1 0;
    border-radius: 7px;
    padding: 5px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  }

  .lhm__stat-label{
    font-size: 9.5px;
    font-weight: 800;
    color: #fff;
    line-height: 1.1;
  }

  .lhm__stat-divider{
    display: block;
    width: 65%;
    height: 1px;
    background: rgba(255,255,255,0.85);
    margin: 3px 0;
  }

  .lhm__stat-val{
    font-size: 14px;
    font-weight: 900;
    color: #fff;
    line-height: 1.1;
  }

  .lhm__followup-date{
    display: flex;
    justify-content: flex-start;
    gap: 8px;
    margin-top: 6px;
    padding-top: 5px;
    border-top: 1px solid rgba(255,255,255,0.2);
    font-size: 9.5px;
    font-weight: 800;
    color: rgba(255,255,255,0.9);
    white-space: nowrap;
  }

  /* Mobile header (Option A) */
  .lead-header-mob{
    display:flex;
    flex-direction:column;
    gap:10px;
    position: relative;
    padding-top: 0; /* top bar moved to normal flow */
  }

  .lead-header-mob .lead-business-name{
    padding: 0 2px;
  }

  /* Top bar (now in normal flow, below row2) */
  .lead-header-mob__top{
    position: static;
    display:flex;
    flex-direction: column;
    gap:8px;
    margin-top: 8px;
  }

  /* (No overlay z-index needed anymore) */

  .lead-header-mob__row1{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
  }

  .lead-header-mob__name{
    flex: 1 1 auto;
    min-width: 0;
    font-weight: 800;
    font-size: 14px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lead-header-mob .lead-header-v2__status-stack{
    width: clamp(120px, 38vw, 150px);
  }

  .lead-header-mob__row2{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
  }

  .lead-header-mob__phone{
    flex: 1 1 auto;
    min-width: 0;
    display:flex;
    align-items:center;
    gap:6px;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 10px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lead-header-mob__email{
    flex: 1 1 auto;
    min-width: 0;
    display:flex;
    align-items:center;
    gap:6px;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 10px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lead-header-mob__actions{
    display:flex;
    align-items:center;
    gap:8px;
    flex: 0 0 auto;
  }

  .lead-header-mob__icon-btn{
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.35);
    background: rgba(255,255,255,0.18);
    color:#fff;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:0;
  }

  .lead-header-mob__more-btn{
    width: auto;
    padding: 0 10px;
    gap: 8px;
    font-weight: 900;
    font-size: 12px;
    line-height: 1;
  }

  .lead-header-mob__icon-btn:disabled{
    opacity: 0.55;
  }

  .lead-header-mob__floats{
    position: relative;
    flex: 0 0 auto;
    min-width: 0;
    height: 44px;
    padding-right: 0;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.28);
  }

  .lead-header-mob__float{
    position: absolute;
    top: 0;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 12px;
    padding: 14px 10px 8px;
    min-width: 0;
    width: calc(50% - 6px);
  }

  .lead-header-mob__float:nth-child(1){
    left: 0;
  }

  .lead-header-mob__float:nth-child(2){
    left: calc(50% + 6px);
  }

  .lead-header-mob__float-label{
    position:absolute;
    top: 0px;
    left: 10px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.2px;
    opacity: 0.95;
    color: rgba(255,255,255,0.95);
  }

  .lead-header-mob__float-value{
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lead-header-mob__approval{
    position: relative;
    width: 100%;
    display:flex;
    justify-content:flex-start;
    gap:8px;
    height: 34px;
  }

  .lead-header-mob__approval-select{
    height: 34px;
    min-width: 160px;
    border-radius: 12px;
    font-weight: 900;
    font-size: 12px;
    border: 1px solid rgba(255,255,255,0.35);
    background: rgba(255,255,255,0.18);
    color: #fff;
    box-shadow: 0 8px 18px rgba(0,0,0,0.18);
  }

  .lead-header-mob__approval-select option{
    color: #111; /* dropdown list text */
  }

  .lead-header-mob__approval-v2{
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .lead-header-mob__approval-v2 .lead-approval-v2__pill{
    min-width: 0;
    padding: 6px 10px;
    height: 30px;
    font-size: 11px;
  }

  .lead-header-mob__approval-v2 .lead-approval-v2__iconbtn{
    width: 30px;
    height: 30px;
    border-radius: 10px;
  }

  .lead-header-mob__approval-v2 .lead-header-v2__approval-editor{
    width: 190px;
    right: 0;
    left: auto;
  }

  .lead-header-mob__approval-btn{
    border:none;
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 900;
    line-height: 1;
    color:#fff;
    box-shadow: 0 8px 18px rgba(0,0,0,0.18);
    white-space: nowrap;
    position: relative;
    height: 34px;
    width: auto;
    min-width: 72px;
    display:flex;
    align-items:center;
    justify-content:center;
  }

  .lead-header-mob__approval-btn--approve{
    background: rgba(16, 185, 129, 0.95);
  }

  .lead-header-mob__approval-btn--reject{
    display: flex;
  }

  /* Mobile horizontal scroll rows (actions + performance chips) */
  .b2b-mobile-hscroll{
    gap: 10px;
  }

  /* Desktop/tablet: keep original wrap behavior */
  @media (min-width: 769px){
    .b2b-mobile-hscroll--chips{
      flex-wrap: wrap;
    }
  }

  @media (max-width: 768px){
    .b2b-mobile-hscroll{
      display:flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 6px;
      scrollbar-width: none;
    }

    .b2b-mobile-hscroll::-webkit-scrollbar{
      display:none;
    }

    .b2b-mobile-hscroll > *{
      flex: 0 0 auto;
    }

    .b2b-mobile-action-btn{
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      display:flex;
      align-items:center;
      justify-content:center;
      gap: 6px;
      border-radius: 999px;
      min-width: 130px;
      transition: all 0.2s ease;
      background-color: rgb(250, 85, 121);
      color: #fff;
      border: none;
      box-shadow: 0 2px 8px rgba(250, 85, 121, 0.25);
    }

    .b2b-mobile-hscroll--chips .b2b-perf-chip{
      white-space: nowrap;
    }
  }

  @media (max-width: 420px){
    .lead-header-mob{ padding-top: 0; }
    .lead-header-mob__top{ flex-direction: column; gap: 8px; }
    .lead-header-mob__floats{ height: auto; padding-right: 0; }
    .lead-header-mob__float{ position: relative; width: 100%; left: auto !important; }
    .lead-header-mob__approval{ position: relative; width: 100%; height: 40px; }
    .lead-header-mob__approval-btn{ width: calc(50% - 5px); height: 40px; }
    .lead-header-mob .lead-header-v2__status-stack{ width: clamp(120px, 42vw, 160px); }
  }

  .b2b-panel-open .lead-header-v2__approval,
  .b2b-panel-open .lead-header-v2__ranking{
    flex-wrap: wrap;
  }

  .b2b-panel-open .lead-header-v2__kv{
    min-width: 110px;
  }

  .lead-header-v2__right > *{
    flex: 0 1 auto;
    min-width: 0;
  }

  .lead-header-v2__chip-group{
    display:flex;
    align-items:center;
    gap:8px;
  }

  .lead-header-v2__chip-label{
    font-size:11px;
    font-weight:700;
    opacity:0.9;
    white-space:nowrap;
  }

  .lead-header-v2__chip{
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.28);
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    max-width: 160px;
    overflow:hidden;
    text-overflow:ellipsis;
  }

  .lead-header-v2__chev{
    border: none;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.28);
    color:#fff;
    border-radius: 999px;
    width: 34px;
    height: 22px;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:0;
    margin-left: 2px;
  }

  .lead-header-v2__chev i{ font-size: 12px; }

  .lead-header-v2__iconbtn{
    border: none;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.28);
    color:#fff;
    border-radius: 10px;
    width: 32px;
    height: 32px;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:0;
  }

  .lead-header-v2__iconbtn i{ font-size: 14px; }

  .lead-header-v2__iconbtn--report{
    width: auto;
    padding: 0 10px;
    gap: 8px;
    justify-content: flex-start;
    white-space: nowrap;
  }

  .lead-header-v2__report-text{
    font-size: 12px;
    font-weight: 800;
    line-height: 1;
  }

  .lead-meta-v2{
    padding: 12px 14px 10px;
    background:#fff;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:14px;
    position: relative;
    z-index: 1;
  }

  .lead-meta-v2__panel{
    position: relative;
    border: 1px solid rgba(17, 24, 39, 0.35);
    border-radius: 10px;
    background: #fff;
    padding: 18px 14px 12px;
    min-width: 0;
  }

  .lead-meta-v2__panel-title{
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    padding: 0 10px;
    font-weight: 900;
    color: #111827;
    font-size: 16px;
    line-height: 1;
    white-space: nowrap;
  }

  .lead-meta-v2__panel--detail{
    flex: 1 1 auto;
  }

  .lead-meta-v2__panel--actions{
    flex: 0 0 auto;
    min-width: 360px;
  }

  .lead-meta-v2__grid{
    display:grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px 18px;
    align-items:flex-start;
  }

  .lead-meta-v2__mid{
    flex: 0 0 auto;
    display:flex;
    gap: 12px;
    align-items:center;
    justify-content:center;
    padding: 0 6px;
    flex-direction:column;
  }

  .lead-meta-v2__pill{
    border:none;
    border-radius: 999px;
    padding: 8px 14px;
    background: #ff3b30;
    color: #fff;
    font-weight: 900;
    font-size: 13px;
    display:inline-flex;
    align-items:center;
    gap:8px;
    box-shadow: 0 6px 14px rgba(255, 59, 48, 0.22);
    line-height: 1;
    white-space: nowrap;
    text-align: center;
    justify-content:center;
  }

  .lead-meta-v2__pill i{
    font-size: 13px;
  }

  .lead-meta-v2__pill:disabled{
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  /* Mobile "More actions" modal buttons (still use this class) */
  .lead-meta-v2__action-btn{
    border:none;
    border-radius: 10px;
    padding: 10px 12px;
    background: #ff3b30;
    color: #fff;
    font-weight: 900;
    font-size: 13px;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    box-shadow: 0 6px 14px rgba(255, 59, 48, 0.22);
    line-height: 1;
    width: 100%;
  }

  .lead-meta-v2__action-btn i{ font-size: 13px; }

  .lead-meta-v2__action-btn:disabled{
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  .lead-meta-v2__action-grid{
    display:grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    align-items: start;
  }

  .lead-meta-v2__icon-action{
    border: none;
    background: transparent;
    padding: 0;
    color: inherit;
    display:flex;
    flex-direction:column;
    align-items:center;
    gap: 8px;
    min-width: 0;
  }

  .lead-meta-v2__icon-action:disabled{
    opacity: 0.55;
    cursor: not-allowed;
  }

  .lead-meta-v2__icon-action-label{
    font-size: 13px;
    font-weight: 700;
    color: #ff3b7d;
    line-height: 1.1;
    text-align:center;
    white-space: nowrap;
  }

  .lead-meta-v2__icon-action-btn{
    width: 44px;
    height: 36px;
    border-radius: 10px;
    background: #ff3b30;
    color:#fff;
    display:flex;
    align-items:center;
    justify-content:center;
    box-shadow: 0 6px 14px rgba(255, 59, 48, 0.28);
  }

  .lead-meta-v2__icon-action-btn i{
    font-size: 14px;
  }

  .lead-meta-v2__label{
    font-size: 13px;
    color: #ff3b7d;
    font-weight: 700;
    margin-bottom: 2px;
  }

  .lead-meta-v2__value{
    font-size: 15px;
    font-weight: 800;
    color: #111827;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lead-meta-v2__followup{
    display:flex;
    flex-direction:column;
    align-items:flex-end;
    gap:6px;
    min-width: 120px;
  }

  .lead-meta-v2__followup-label{
    font-size: 13px;
    font-weight: 700;
    color: #111827;
    white-space:nowrap;
  }

  .lead-meta-v2__followup-btn{
    width: 46px;
    height: 34px;
    border-radius: 10px;
    border:none;
    background: #ff3b30;
    color:#fff;
    display:flex;
    align-items:center;
    justify-content:center;
    box-shadow: 0 6px 14px rgba(255, 59, 48, 0.28);
  }

  .lead-meta-v2__followup-btn:disabled{
    opacity:0.55;
    cursor:not-allowed;
    box-shadow:none;
  }

  /* When the desktop right panel opens, main content narrows.
     Keep header "cute + compact": top row (pills + performance), second row (dash cards). */
  /* ── Panel-open: keep header in ONE compact row, no wrapping ── */
  .b2b-panel-open .lead-header-v2{
    padding: 8px 10px;
  }

  .b2b-panel-open .lead-header-v2__row{
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
  }

  /* Left: hide name/phone when panel is open — no space, no overlap */
  .b2b-panel-open .lead-header-v2__left{
    display: none;
  }

  /* Right: take full width, single flex row, no wrap */
  .b2b-panel-open .lead-header-v2__right{
    flex: 1 1 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px;
    overflow: visible;
    white-space: normal;
    justify-content: flex-start;
    min-width: 0;
  }

  /* Pills: stay vertical, smaller */
  .b2b-panel-open .lead-header-v2__pills{
    flex-direction: column;
    gap: 5px;
    flex-shrink: 0;
  }

  .b2b-panel-open .lead-header-v2__pills .lead-meta-v2__pill{
    padding: 6px 10px;
    font-size: 11px;
    gap: 5px;
  }

  /* Performance block: compact */
  .b2b-panel-open .lead-header-v2__perf-block{
    flex-shrink: 0;
    min-width: 130px;
    gap: 4px;
  }

  .b2b-panel-open .lead-header-v2__perf-title{
    font-size: 10px;
  }

  .b2b-panel-open .lead-header-v2__perf-label{
    font-size: 9px;
    min-width: 52px;
  }

  .b2b-panel-open .lead-header-v2__perf-input{
    height: 20px !important;
    font-size: 9px !important;
    padding: 0 5px !important;
    border-radius: 5px !important;
  }

  .b2b-panel-open .lead-header-v2__perf-row{
    gap: 5px;
  }

  /* Dash: side-by-side, narrower columns */
  .b2b-panel-open .lead-header-v2__dash{
    width: 100%;
    flex: 1 1 100%;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .b2b-panel-open .lead-header-v2__dash-col{
    width: auto;
    min-width: 0;
    flex: 1 1 auto;
  }

  @media (max-width: 1180px){
    .b2b-panel-open .lead-header-v2__dash{
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .b2b-panel-open .lead-header-v2 .b2b-dash-section{
    padding: 8px 7px 6px;
  }

  .b2b-panel-open .lead-header-v2 .b2b-dash-section__label{
    font-size: 10px;
    top: -9px;
    padding: 0 6px;
    background: rgba(11, 94, 215, 0.95);
  }

  .b2b-panel-open .lead-header-v2 .b2b-dash-stat-card{
    min-height: 38px;
    padding: 4px 4px 4px;
    border-radius: 7px;
  }

  .b2b-panel-open .lead-header-v2 .b2b-dash-stat-card__label{
    font-size: 9.5px;
  }

  .b2b-panel-open .lead-header-v2 .b2b-dash-stat-card__divider{
    margin: 3px 0;
  }

  .b2b-panel-open .lead-header-v2 .b2b-dash-stat-card__value{
    font-size: 13px;
  }

  .b2b-panel-open .lead-header-v2 .ActionsDates{
    margin-top: 4px;
    padding-top: 4px;
    font-size: 9.5px;
    gap: 4px;
  }

  /* Slightly softer "cute" feel (safe changes only) */
  .lead-header-v2 .b2b-dash-stat-card{
    box-shadow: 0 8px 18px rgba(0,0,0,0.16);
    transition: transform 180ms ease, box-shadow 180ms ease;
  }

  .lead-header-v2 .b2b-dash-stat-card:hover{
    transform: translateY(-1px);
    box-shadow: 0 12px 26px rgba(0,0,0,0.20);
  }

  /* ── Floating lead identity badge at top of desktop action panel ── */
  .panel-lead-badge{
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 8px 14px;
    background: linear-gradient(90deg, #0b5ed7 0%, #1aa3ff 100%);
    border-radius: 8px 0 0 0;
    flex-wrap: wrap;
  }

  .panel-lead-badge__name,
  .panel-lead-badge__phone{
    display: flex;
    align-items: center;
    gap: 6px;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    white-space: nowrap;
  }

  .panel-lead-badge__name i,
  .panel-lead-badge__phone i{
    font-size: 12px;
    opacity: 0.85;
  }

  .panel-lead-badge__phone{
    font-size: 12px;
    opacity: 0.92;
    border-left: 1px solid rgba(255,255,255,0.35);
    padding-left: 14px;
  }

  .lead-meta-v2__icon-action-btn{
    transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
  }

  .lead-meta-v2__icon-action:hover .lead-meta-v2__icon-action-btn{
    transform: translateY(-1px);
    filter: brightness(1.02);
    box-shadow: 0 10px 22px rgba(255, 59, 48, 0.30);
  }

  @media (max-width: 768px){
    .lead-header-v2__left{ min-width: auto; }
    /* Mobile/tablet: allow the header to wrap instead of squeezing/overlapping */
    .lead-header-v2__row{ flex-wrap: wrap; align-items: flex-start; }
    .lead-header-v2__left{ flex: 1 1 100%; }
    .lead-header-v2__input-row{ flex-wrap: wrap; }
    .lead-header-v2__input-wrap{ min-width: 0; flex: 1 1 220px; width: auto; }
    .lead-header-v2__right{
      flex: 1 1 100%;
      justify-content: flex-start;
      flex-wrap: wrap;
      overflow: visible;
      white-space: normal;
    }
    .lead-header-v2__approval{ justify-content:flex-start; flex-wrap: wrap; }
    .lead-header-v2__kv{ min-width: 120px; width: auto; }
    .lead-header-v2__status-stack{ width: 120px; }
    .lead-meta-v2{ flex-direction:column; align-items: stretch; }
    .lead-meta-v2__panel--actions{ min-width: 0; }
    .lead-meta-v2__mid{ justify-content:flex-start; padding: 2px 0 0; }
    .lead-meta-v2__grid{ grid-template-columns: 1fr 1fr; }
    .lead-meta-v2__action-grid{ grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .lead-meta-v2__followup{ align-items:flex-start; }
  }

  @media (max-width: 576px){
    .lead-header-v2{ padding: 10px 12px; }
    .lead-header-v2__input-row{ flex-direction: column; align-items: stretch; }
    .lead-header-v2__input-wrap{ flex: 1 1 auto; width: 100%; }
    .lead-header-v2__right .d-flex{ width: 100%; }
    .lead-header-v2__status-stack{ width: 100%; }
    .lead-header-v2__kv{ min-width: 0; flex: 1 1 48%; }
    .lead-header-v2__kv-value{ max-width: 100%; }
  }

  .lead-header::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(30px, -30px);
  }

  .lead-title-section {
    position: relative;
    z-index: 2;
  }

  .lead-business-name {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    color: white;
    line-height: 1.2;
  }

  /* B2B lead header v2: keep business name compact on mobile */
  @media (max-width: 768px){
    .lead-header-mob .lead-business-name{
      font-size: 13px;
      font-weight: 900;
      margin: 0;
      opacity: 0.95;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .lead-contact-person {
    font-size: 0.85rem;
    margin: 0 0 0.5rem 0;
    opacity: 0.9;
    display: flex;
    align-items: center;
  }

  .lead-contact-info {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .lead-contact-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    opacity: 0.9;
    max-width: 200px;
  }

  .lead-contact-item i {
    font-size: 0.65rem;
    width: 10px;
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

  .lead-badges {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: flex;
    gap: 0.5rem;
    z-index: 2;
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
    background: linear-gradient(135deg, #6f42c1, #5a32a3);
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
    color: #007bff;
    text-decoration: none;
    font-weight: 600;
  }

  .contact-link:hover {
    color: #0056b3;
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
    background: linear-gradient(135deg, #007bff, #0056b3);
  }

  .action-btn.refer {
    background: #ff3b30;
    box-shadow: 0 6px 14px rgba(255, 59, 48, 0.24);
  }

  .action-btn.history {
    background: #ff3b30;
    box-shadow: 0 6px 14px rgba(255, 59, 48, 0.24);
  }

  .action-btn.status {
    background: linear-gradient(135deg, #fc567b 13%, #fc567b 50%);
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
    background: linear-gradient(135deg, #fc567b 13%, #fc567b 50%);
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
    border-color: #007bff;
  }

  .status-count-card.selected {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
    border: 2px solid rgb(250, 85, 121) !important;
    background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
  }

  .status-count-card.selected.total {
    background: linear-gradient(135deg, #fc567b 13%, #fc567b 50%);
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
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    border-color: #007bff;
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
    border-color: #007bff !important;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
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
    color: #007bff !important;
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

  .b2b-leads-list {
    margin-top: 1rem !important;
  }

  .lead-project-tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 10px 12px 8px;
    border-bottom: none;
    background: linear-gradient(180deg, #fff9fb 0%, #fff 100%);
    overflow: hidden;
  }

  .lead-card > .lead-project-tabs + .lead-header.lead-header-v2 {
    margin-top: 8px;
  }
  .lead-project-tabs__tab {
    border: 1.5px solid rgba(250, 85, 121, 0.45);
    background: #fff;
    color: rgb(250, 85, 121);
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 600;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
  .lead-project-tabs__tab--active {
    background: rgb(250, 85, 121);
    color: #fff;
    border-color: rgb(250, 85, 121);
  }
  .lead-project-tabs__tab--cross::after {
    content: '';
  }
  .lead-project-tabs__add {
    border: 1.5px dashed rgba(250, 85, 121, 0.6);
    background: transparent;
    color: rgb(250, 85, 121);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
  }
  .lead-project-tabs__add:hover {
    background: rgba(250, 85, 121, 0.08);
  }

  .cross-sale-modal {
    max-width: 520px;
  }

  .cross-sale-modal .modal-content {
    max-height: min(90vh, 720px);
    display: flex;
    flex-direction: column;
  }

  .cross-sale-modal__body {
    overflow-y: auto;
    max-height: calc(90vh - 140px);
    -webkit-overflow-scrolling: touch;
  }
`}</style>

      {/* Cross-sale: add lead to another B2B project */}
      {showCrossSaleModal && crossSaleSourceLead && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1066 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !crossSaleLoading) closeCrossSaleModal();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable cross-sale-modal">
            <div className="modal-content">
              <div className="modal-header flex-shrink-0">
                <h5 className="modal-title">
                  Cross Sale — {crossSaleSourceLead.businessName || crossSaleSourceLead.concernPersonName}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  disabled={crossSaleLoading}
                  onClick={closeCrossSaleModal}
                />
              </div>
              <div className="modal-body cross-sale-modal__body">
                <p className="text-muted small mb-3">
                  Same business will be added as a new lead in another project. Status, follow-ups, and owner stay separate per project.
                </p>
                <div className="mb-2">
                  <label className="form-label fw-bold">B2B Department <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={crossSaleForm.b2bDepartment}
                    onChange={(e) => setCrossSaleForm({
                      b2bDepartment: e.target.value,
                      b2bProject: '',
                      typeOfB2B: '',
                      leadOwner: crossSaleForm.leadOwner,
                      leadStatus: crossSaleForm.leadStatus,
                      leadSubStatus: crossSaleForm.leadSubStatus,
                      remark: crossSaleForm.remark,
                    })}
                    disabled={crossSaleLoading}
                  >
                    <option value="">Select Department</option>
                    {allB2bDepartments.map((dept) => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label fw-bold">B2B Project <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={crossSaleForm.b2bProject}
                    onChange={(e) => setCrossSaleForm((p) => ({ ...p, b2bProject: e.target.value }))}
                    disabled={crossSaleLoading || !crossSaleForm.b2bDepartment}
                  >
                    <option value="">
                      {crossSaleForm.b2bDepartment ? 'Select Project' : 'Select department first'}
                    </option>
                    {crossSaleProjectOptions.map((proj) => (
                      <option key={proj._id} value={proj._id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label fw-bold">Type of B2B <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={crossSaleForm.typeOfB2B}
                    onChange={(e) => setCrossSaleForm((p) => ({ ...p, typeOfB2B: e.target.value }))}
                    disabled={crossSaleLoading || !crossSaleForm.b2bDepartment}
                  >
                    <option value="">
                      {crossSaleForm.b2bDepartment ? 'Select B2B Type' : 'Select department first'}
                    </option>
                    {crossSaleTypeOptions.map((type) => (
                      <option key={type._id} value={type._id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label fw-bold">
                    <i className="fas fa-user-tie text-primary me-1" aria-hidden="true" />
                    Counsellor
                  </label>
                  <select
                    className="form-select"
                    value={crossSaleForm.leadOwner}
                    onChange={(e) => setCrossSaleForm((p) => ({ ...p, leadOwner: e.target.value }))}
                    disabled={crossSaleLoading}
                  >
                    <option value="">Select Counsellor</option>
                    {userData?._id &&
                      !(users || []).some((u) => String(u?._id) === String(userData._id)) && (
                        <option value={String(userData._id)}>
                          {userData.name || 'Me'}
                        </option>
                      )}
                    {(users || []).map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name || user.email || 'User'}
                      </option>
                    ))}
                  </select>
                  <div className="form-text text-muted small">
                    Owner for the new project lead. Defaults to the current lead owner.
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label fw-bold">Lead Status <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={crossSaleForm.leadStatus}
                    onChange={(e) => setCrossSaleForm((p) => ({
                      ...p,
                      leadStatus: e.target.value,
                      leadSubStatus: '',
                    }))}
                    disabled={crossSaleLoading}
                  >
                    <option value="">Select Lead Status</option>
                    {[...(statuses || [])]
                      .sort((a, b) =>
                        String(a?.name || a?.title || '').localeCompare(
                          String(b?.name || b?.title || ''),
                          undefined,
                          { sensitivity: 'base', numeric: true }
                        )
                      )
                      .map((status) => (
                        <option key={status._id} value={status._id}>
                          {status.name || status.title}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label fw-bold">Sub Status <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={crossSaleForm.leadSubStatus}
                    onChange={(e) => setCrossSaleForm((p) => ({ ...p, leadSubStatus: e.target.value }))}
                    disabled={crossSaleLoading || !crossSaleForm.leadStatus || crossSaleSubStatusesLoading}
                  >
                    <option value="">
                      {crossSaleSubStatusesLoading
                        ? 'Loading sub-statuses...'
                        : !crossSaleForm.leadStatus
                          ? 'Select lead status first'
                          : 'Select sub-status'}
                    </option>
                    {crossSaleSubStatuses.map((ss) => (
                      <option key={ss._id} value={ss._id}>{ss.title}</option>
                    ))}
                  </select>
                  {crossSaleForm.leadStatus && !crossSaleSubStatusesLoading && crossSaleSubStatuses.length === 0 && (
                    <div className="form-text text-muted small">No sub-statuses for this status.</div>
                  )}
                </div>
                <div className="mb-0">
                  <label className="form-label fw-bold">Remark (optional)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={crossSaleForm.remark}
                    onChange={(e) => setCrossSaleForm((p) => ({ ...p, remark: e.target.value }))}
                    disabled={crossSaleLoading}
                    placeholder="Cross-sale note"
                  />
                </div>
              </div>
              <div className="modal-footer flex-shrink-0">
                <button type="button" className="btn btn-secondary" disabled={crossSaleLoading} onClick={closeCrossSaleModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: 'rgb(250, 85, 121)', borderColor: 'rgb(250, 85, 121)' }}
                  disabled={
                    crossSaleLoading
                    || !crossSaleForm.b2bDepartment
                    || !crossSaleForm.b2bProject
                    || !crossSaleForm.typeOfB2B
                    || !crossSaleForm.leadOwner
                    || !crossSaleForm.leadStatus
                    || !crossSaleForm.leadSubStatus
                  }
                  onClick={handleCrossSaleSubmit}
                >
                  {crossSaleLoading ? 'Adding...' : 'Add to Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Source / B2B Type edit modal (from lead card) */}
      {showLeadMetaEditModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1065 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Lead Source &amp; B2B Type</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    if (metaEditSaving) return;
                    setShowLeadMetaEditModal(false);
                    setMetaEditLead(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-bold">Lead Source</label>
                    <select
                      className="form-select"
                      value={metaEditForm.leadCategory}
                      onChange={(e) => setMetaEditForm((p) => ({ ...p, leadCategory: e.target.value }))}
                      disabled={metaEditSaving}
                    >
                      <option value="">Select Lead Source</option>
                      {(leadCategoryOptions || []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold">Type of B2B</label>
                    <select
                      className="form-select"
                      value={metaEditForm.typeOfB2B}
                      onChange={(e) => setMetaEditForm((p) => ({ ...p, typeOfB2B: e.target.value }))}
                      disabled={metaEditSaving}
                    >
                      <option value="">Select B2B Type</option>
                      {(typeOfB2BOptions || []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (metaEditSaving) return;
                    setShowLeadMetaEditModal(false);
                    setMetaEditLead(null);
                  }}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={saveMetaEdit} disabled={metaEditSaving}>
                  {metaEditSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
.mbdiv{
padding:0px;
}
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
    </div >
  );
};

export default B2BSales;
