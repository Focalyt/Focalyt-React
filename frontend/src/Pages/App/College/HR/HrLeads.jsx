import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import moment from 'moment';
import Calendar from 'react-calendar';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import 'react-calendar/dist/Calendar.css';
import './HrLeads.css';
import { resolveMediaUrl } from '../../../../utils/resolveMediaUrl';

const ACCENT = 'rgb(250, 85, 121)';

const DOC_BUCKET_URL = (process.env.REACT_APP_MIPIE_BUCKET_URL || '').replace(/\/$/, '');

const getDocFileUrl = (fileUrl) => resolveMediaUrl(DOC_BUCKET_URL, fileUrl);

const DETAIL_TABS = ['Lead Details', 'Document'];

const EMPTY_FORM = {
  fullName: '',
  email: '',
  mobile: '',
  city: '',
  applyingFor: '',
  experience: '',
  qualification: '',
  dateOfBirth: '',
  remark: '',
  resume: null,
};

const formatPhone = (mobile) => String(mobile || '').replace(/\D/g, '').slice(-10);

// Approval follows the exact milestone set on HR Status Design (Approved / Rejected).
const approvalFromMilestone = (milestone) => {
  const value = String(milestone || '').trim().toLowerCase();
  if (value === 'approved') return 'approved';
  if (value === 'rejected') return 'rejected';
  return 'pending';
};

const approvalLabel = (approval) => {
  if (approval === 'approved') return 'Approved';
  if (approval === 'rejected') return 'Rejected';
  return 'Pending';
};

const pad2 = (n) => String(n ?? 0).padStart(2, '0');

const formatLeadDate = (value) => {
  if (!value) return 'N/A';
  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return 'N/A';
  const datePart = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace(/ /g, '-');
  const timePart = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
};

const leadAgeDays = (createdAt) => {
  if (!createdAt) return 'N/A';
  return `${Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)} Days`;
};

const formatDob = (value) => {
  if (!value) return 'N/A';
  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return 'N/A';
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace(/ /g, '-');
};

const userRefId = (user) => String(user?._id || user || '');

const EMPTY_FOLLOWUP_BUCKET = { done: 0, planned: 0, missed: 0 };

const formatFollowupDate = (value) => {
  if (!value) return 'N/A';
  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return 'N/A';
  return moment(dateObj).format('DD MMM YYYY, hh:mm A');
};

const getFileType = (url) => {
  const lower = String(url || '').split('?')[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp)$/.test(lower)) return 'image';
  if (/\.pdf$/.test(lower)) return 'pdf';
  if (/\.(doc|docx)$/.test(lower)) return 'document';
  return 'file';
};

const DocumentPreviewModal = ({ previewDoc, onClose }) => {
  const [documentZoom, setDocumentZoom] = useState(1);
  const [documentRotation, setDocumentRotation] = useState(0);

  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, []);

  if (!previewDoc) return null;

  const fileUrl = getDocFileUrl(previewDoc.fileUrl);
  const fileType = fileUrl ? getFileType(fileUrl) : null;
  const uploadedAt = previewDoc.uploadedAt
    ? new Date(previewDoc.uploadedAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : 'N/A';

  return createPortal(
    <div
      className="hr-doc-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.72)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="hr-doc-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          width: 'min(1100px, 96vw)',
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, color: '#fff' }}>
            {previewDoc.Name || previewDoc.name} Preview
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 28,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ padding: 16, display: 'flex', gap: 16, overflow: 'auto', minHeight: 0 }}>
          <div style={{ flex: 2, minWidth: 0 }}>
            <div
              style={{
                background: '#f8f9fa',
                border: '2px dashed #dee2e6',
                borderRadius: 8,
                minHeight: 420,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {fileUrl ? (
                <>
                  {fileType === 'image' ? (
                    <img
                      src={fileUrl}
                      alt="Document Preview"
                      style={{
                        transform: `scale(${documentZoom}) rotate(${documentRotation}deg)`,
                        maxWidth: '100%',
                        maxHeight: '70vh',
                        objectFit: 'contain',
                      }}
                    />
                  ) : fileType === 'pdf' ? (
                    <iframe
                      src={`${fileUrl}#navpanes=0&toolbar=0`}
                      title="PDF Document"
                      style={{ width: '100%', height: '70vh', border: 'none', background: '#fff' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <h4>Document Preview</h4>
                      <a href={fileUrl} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                        Open file
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: '#6c757d' }}>No document uploaded</p>
              )}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: 16 }}>
              <h4 style={{ margin: '0 0 12px', borderBottom: '2px solid #667eea', paddingBottom: 8 }}>
                Document Information
              </h4>
              <div className="mb-2"><strong>Document Name:</strong> {previewDoc.Name || previewDoc.name}</div>
              <div className="mb-2"><strong>Lead:</strong> {previewDoc.leadName || 'N/A'}</div>
              <div className="mb-2"><strong>Upload Date:</strong> {uploadedAt}</div>
              <div className="mb-2"><strong>Status:</strong> {fileUrl ? 'Uploaded' : 'Not Uploaded'}</div>
              {fileUrl && (
                <a href={fileUrl} className="btn btn-sm btn-outline-primary mt-2" target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const HrLeads = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = userData.token;
  const headers = useMemo(() => ({ 'x-auth': token }), [token]);

  const navRef = useRef(null);
  const widthRef = useRef(null);
  const [navHeight, setNavHeight] = useState(220);
  const [width, setWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hrStatuses, setHrStatuses] = useState([]);
  const [counts, setCounts] = useState({ all: 0 });
  const [followupCounts, setFollowupCounts] = useState({
    call: EMPTY_FOLLOWUP_BUCKET,
    visit: EMPTY_FOLLOWUP_BUCKET,
  });
  const [roles, setRoles] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [leadStatus, setLeadStatus] = useState('all');
  const [applyingFor, setApplyingFor] = useState('');
  const [headerDatePreset, setHeaderDatePreset] = useState('');
  const [headerDateFrom, setHeaderDateFrom] = useState(null);
  const [headerDateTo, setHeaderDateTo] = useState(null);
  const [showHeaderDateRangePicker, setShowHeaderDateRangePicker] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1, limit: 20 });
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState({});
  const [statusPanelLead, setStatusPanelLead] = useState(null);
  const [showPanel, setShowPanel] = useState('');
  const [followUpType, setFollowUpType] = useState('Call');
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');
  const [followupFilter, setFollowupFilter] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSubStatus, setSelectedSubStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [statusAttachment, setStatusAttachment] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [approvalEditId, setApprovalEditId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [counselorOptions, setCounselorOptions] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const update = () => {
      if (navRef.current) setNavHeight(navRef.current.offsetHeight || 220);
      if (widthRef.current) setWidth(widthRef.current.offsetWidth || 0);
    };
    update();
    const ro = new ResizeObserver(update);
    if (navRef.current) ro.observe(navRef.current);
    if (widthRef.current) ro.observe(widthRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const dateRange = useMemo(() => {
    const today = moment();
    if (headerDatePreset === 'today') {
      return { startDate: today.format('YYYY-MM-DD'), endDate: today.format('YYYY-MM-DD') };
    }
    if (headerDatePreset === 'yesterday') {
      const y = today.clone().subtract(1, 'day');
      return { startDate: y.format('YYYY-MM-DD'), endDate: y.format('YYYY-MM-DD') };
    }
    if (headerDatePreset === 'prev3days') {
      return {
        startDate: today.clone().subtract(2, 'days').format('YYYY-MM-DD'),
        endDate: today.format('YYYY-MM-DD'),
      };
    }
    if (headerDatePreset === 'thisMonth') {
      return {
        startDate: today.clone().startOf('month').format('YYYY-MM-DD'),
        endDate: today.format('YYYY-MM-DD'),
      };
    }
    if (headerDatePreset === 'custom' && (headerDateFrom || headerDateTo)) {
      return {
        startDate: headerDateFrom ? moment(headerDateFrom).format('YYYY-MM-DD') : undefined,
        endDate: headerDateTo ? moment(headerDateTo).format('YYYY-MM-DD') : undefined,
      };
    }
    return {};
  }, [headerDatePreset, headerDateFrom, headerDateTo]);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 20,
      search: search.trim() || undefined,
      leadStatus,
      applyingFor: applyingFor || undefined,
      followupType: followupFilter?.type || undefined,
      followupBucket: followupFilter?.bucket || undefined,
      ...dateRange,
    }),
    [page, search, leadStatus, applyingFor, followupFilter, dateRange]
  );

  const fetchCounts = useCallback(async () => {
    try {
      const res = await axios.get(`${backendUrl}/college/hr/leads/counts`, {
        headers,
        params: { ...queryParams, page: undefined, limit: undefined, leadStatus: 'all' },
      });
      if (res.data?.success) {
        setCounts(res.data.data.counts || { all: 0 });
        setFollowupCounts(res.data.data.followups || {
          call: EMPTY_FOLLOWUP_BUCKET,
          visit: EMPTY_FOLLOWUP_BUCKET,
        });
        setRoles((res.data.data.roles || []).filter(Boolean));
      }
    } catch (error) {
      console.error('HR counts error:', error);
    }
  }, [backendUrl, headers, queryParams]);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/college/hr/leads`, { headers, params: queryParams });
      if (res.data?.success) {
        setLeads(res.data.data.leads || []);
        setPagination(res.data.data.pagination || { page: 1, total: 0, totalPages: 1, limit: 20 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load HR leads');
    } finally {
      setLoading(false);
    }
  }, [backendUrl, headers, queryParams]);

  useEffect(() => {
    fetchLeads();
    fetchCounts();
  }, [fetchLeads, fetchCounts]);

  useEffect(() => {
    const fetchHrStatuses = async () => {
      try {
        const res = await axios.get(`${backendUrl}/college/hr/statuses`, { headers });
        if (res.data?.success) setHrStatuses(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch HR statuses:', error);
      }
    };
    fetchHrStatuses();
  }, [backendUrl, headers]);

  const statusById = useMemo(
    () => new Map((hrStatuses || []).map((status) => [String(status._id), status])),
    [hrStatuses]
  );

  const getSubStatuses = useCallback(
    (statusId) => statusById.get(String(statusId || ''))?.substatuses || [],
    [statusById]
  );

  const findStatusByApproval = useCallback(
    (kind) => (hrStatuses || []).find((status) => approvalFromMilestone(status.milestone) === kind),
    [hrStatuses]
  );

  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        const res = await axios.get(`${backendUrl}/college/filters-data`, { headers });
        if (res.data?.status) {
          const activeCounselors = (res.data.counselors || []).filter(
            (c) => c?.status === true || c?.status === 'active'
          );
          setCounselorOptions(activeCounselors.map((c) => ({ value: c._id, label: c.name })));
        }
      } catch (error) {
        console.error('Failed to fetch HR owner list:', error);
      }
    };
    fetchCounselors();
  }, [backendUrl, headers]);

  const handleHeaderDatePreset = (id) => {
    if (id === 'custom') {
      setHeaderDatePreset('custom');
      setShowHeaderDateRangePicker((v) => !v);
      return;
    }
    setShowHeaderDateRangePicker(false);
    setHeaderDatePreset((prev) => (prev === id ? '' : id));
    setPage(1);
  };

  const applyCustomDateRange = () => {
    setHeaderDatePreset('custom');
    setShowHeaderDateRangePicker(false);
    setPage(1);
  };

  const updateLead = async (id, payload) => {
    try {
      const res = await axios.patch(`${backendUrl}/college/hr/leads/${id}`, payload, { headers });
      if (res.data?.success) {
        setLeads((prev) => prev.map((lead) => (lead._id === id ? { ...lead, ...res.data.data } : lead)));
        toast.success('Lead updated');
        fetchCounts();
        return res.data.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update lead');
    }
    return null;
  };

  const uploadLeadDocument = async (leadId, key, file, inputEl) => {
    if (!file) return;
    const uploadId = `${leadId}:${key}`;
    try {
      setUploadingDoc(uploadId);
      const formData = new FormData();
      formData.append('key', key);
      formData.append('file', file);
      const res = await axios.post(`${backendUrl}/college/hr/leads/${leadId}/documents`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        setLeads((prev) => prev.map((lead) => (lead._id === leadId ? { ...lead, ...res.data.data } : lead)));
        toast.success(res.data.message || 'Document uploaded');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc('');
      if (inputEl) inputEl.value = '';
    }
  };

  const openEditPanel = (lead, panel, followUpTypeParam = 'Call') => {
    setStatusPanelLead(lead);
    setSelectedStatus('');
    setSelectedSubStatus('');
    setFollowupDate('');
    setFollowupTime('');
    setRemarks('');
    setStatusAttachment(null);

    if (panel === 'StatusChange') {
      const statusId = String(lead.leadStatus?._id || lead.leadStatus || '');
      const subs = getSubStatuses(statusId);
      const currentSub = String(lead.leadSubstatus || '');
      setSelectedStatus(statusId);
      setSelectedSubStatus(subs.some((s) => String(s._id) === currentSub) ? currentSub : '');
      setRemarks(lead.remark || '');
      setShowPanel('editPanel');
    } else if (panel === 'SetFollowup') {
      const nextType = followUpTypeParam === 'Visit' ? 'Visit' : 'Call';
      setFollowUpType(nextType);
      const existing = nextType === 'Visit' ? lead.nextVisitFollowup : lead.nextCallFollowup;
      if (existing?.followupDate) {
        const existingDate = new Date(existing.followupDate);
        if (!Number.isNaN(existingDate.getTime())) {
          setFollowupDate(moment(existingDate).format('YYYY-MM-DD'));
          setFollowupTime(moment(existingDate).format('HH:mm'));
        }
        setRemarks(existing.remarks || '');
      }
      setShowPanel('followUp');
    }

    if (isMobile) document.body.classList.add('panel-open');
  };

  const openStatusPanel = (lead) => openEditPanel(lead, 'StatusChange');

  const closePanel = () => {
    setStatusPanelLead(null);
    setShowPanel('');
    setSelectedStatus('');
    setSelectedSubStatus('');
    setFollowupDate('');
    setFollowupTime('');
    setFollowUpType('Call');
    setRemarks('');
    setStatusAttachment(null);
    document.body.classList.remove('panel-open');
  };

  const openDocumentModal = (e, doc, lead) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const fileUrl = doc?.fileUrl || lead?.resume;
    if (!fileUrl) return;
    setSelectedDocument({
      Name: doc.name,
      name: doc.name,
      key: doc.key,
      fileUrl,
      uploadedAt: doc.uploadedAt,
      leadName: lead?.fullName || '',
    });
    setShowDocumentModal(true);
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
  };

  const handleStatusSelect = (statusId) => {
    setSelectedStatus(statusId);
    setSelectedSubStatus('');
    setStatusAttachment(null);
  };

  const submitStatusChange = async (e) => {
    e.preventDefault();
    if (!statusPanelLead) return;
    if (!selectedStatus) {
      toast.error('Please select status');
      return;
    }
    const subs = getSubStatuses(selectedStatus);
    if (subs.length && !selectedSubStatus) {
      toast.error('Please select sub-status');
      return;
    }
    const sub = subs.find((s) => String(s._id) === String(selectedSubStatus));
    if (sub?.hasRemarks && !remarks.trim()) {
      toast.error('Remarks are mandatory for this status. Please add remarks.');
      return;
    }
    if (sub?.hasFollowup && (!followupDate || !followupTime)) {
      toast.error('Followup date and time are mandatory for this status.');
      return;
    }
    if (sub?.hasAttachment && !statusAttachment) {
      toast.error('Attachment is mandatory for this status.');
      return;
    }

    setSavingStatus(true);
    const payload = {
      leadStatus: selectedStatus,
      leadSubstatus: selectedSubStatus || null,
    };
    if (sub?.hasRemarks) payload.remark = remarks.trim();
    if (sub?.hasFollowup) {
      payload.followupType = 'Call';
      payload.followupDate = moment(`${followupDate} ${followupTime}`, 'YYYY-MM-DD HH:mm').toISOString();
    }

    const updated = await updateLead(statusPanelLead._id, payload);
    if (updated && sub?.hasAttachment && statusAttachment) {
      await uploadLeadDocument(statusPanelLead._id, 'statusAttachment', statusAttachment);
    }
    setSavingStatus(false);
    if (updated) closePanel();
  };

  const applyApprovalStatus = async (lead, kind) => {
    const target = findStatusByApproval(kind);
    if (!target) {
      toast.error(`No HR status has milestone "${kind === 'approved' ? 'Approved' : 'Rejected'}". Set it in HR Status Design.`);
      return;
    }
    const sub = target.substatuses?.[0];
    if (sub?.hasFollowup || sub?.hasAttachment) {
      openEditPanel(lead, 'StatusChange');
      toast.info(`"${target.title}" needs more details. Please complete the form.`);
      return;
    }
    await updateLead(lead._id, {
      leadStatus: target._id,
      leadSubstatus: sub?._id || null,
      remark: (lead.remark || '').trim() || `Lead marked ${kind}`,
    });
  };

  const submitFollowup = async (e) => {
    e.preventDefault();
    if (!statusPanelLead) return;
    if (!followupDate) {
      toast.error('Please select followup date');
      return;
    }
    if (!followupTime) {
      toast.error('Please select followup time');
      return;
    }
    if (!remarks.trim()) {
      toast.error('Remarks are mandatory for followup');
      return;
    }

    try {
      setSavingStatus(true);
      const res = await axios.post(
        `${backendUrl}/college/hr/leads/${statusPanelLead._id}/followup`,
        {
          type: followUpType,
          followupDate: moment(`${followupDate} ${followupTime}`, 'YYYY-MM-DD HH:mm').toISOString(),
          remarks: remarks.trim(),
        },
        { headers }
      );
      if (res.data?.success) {
        setLeads((prev) => prev.map((lead) => (lead._id === statusPanelLead._id ? { ...lead, ...res.data.data } : lead)));
        toast.success(res.data.message || 'Followup set');
        fetchCounts();
        closePanel();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to set followup');
    } finally {
      setSavingStatus(false);
    }
  };

  const downloadLeads = async () => {
    try {
      const res = await axios.get(`${backendUrl}/college/hr/leads/download`, {
        headers,
        params: { ...queryParams, page: undefined, limit: undefined },
      });
      const rows = res.data?.data || [];
      if (!rows.length) {
        toast.info('No HR leads to download');
        return;
      }
      const sheet = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, 'HR Leads');
      XLSX.writeFile(wb, `hr-leads-${moment().format('YYYYMMDD')}.xlsx`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download leads');
    }
  };

  const submitAddLead = async (e) => {
    e.preventDefault();
    try {
      setAdding(true);
      const formData = new FormData();
      Object.entries(addForm).forEach(([key, value]) => {
        if (key === 'resume') {
          if (value) formData.append('resume', value);
          return;
        }
        formData.append(key, value || '');
      });
      formData.append('source', 'manual');
      await axios.post(`${backendUrl}/college/hr/leads`, formData, { headers });
      toast.success('HR lead added');
      setShowAddModal(false);
      setAddForm(EMPTY_FORM);
      setPage(1);
      fetchLeads();
      fetchCounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add HR lead');
    } finally {
      setAdding(false);
    }
  };

  const statusFilterChips = useMemo(() => {
    const chips = [{ id: 'all', label: 'All' }];
    (hrStatuses || []).forEach((status) => {
      chips.push({ id: String(status._id), label: status.title });
    });
    if (counts.none) chips.push({ id: 'none', label: 'No Status' });
    return chips;
  }, [hrStatuses, counts.none]);

  const approvalCounts = useMemo(() => {
    let approved = 0;
    let rejected = 0;
    (hrStatuses || []).forEach((status) => {
      const value = counts[String(status._id)] || 0;
      const kind = approvalFromMilestone(status.milestone);
      if (kind === 'approved') approved += value;
      else if (kind === 'rejected') rejected += value;
    });
    const total = counts.all || 0;
    return {
      total,
      approved,
      rejected,
      pending: Math.max(0, total - approved - rejected),
      approvedStatusId: findStatusByApproval('approved')?._id || '',
      rejectedStatusId: findStatusByApproval('rejected')?._id || '',
    };
  }, [counts, hrStatuses, findStatusByApproval]);

  const renderDatePills = (compact = false) => (
    <div className={`adm-header-date-range${compact ? ' adm-header-date-range--compact' : ''}`}>
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
            <i className={`fas fa-chevron-${showHeaderDateRangePicker ? 'up' : 'down'} ms-1`} style={{ fontSize: '9px' }} aria-hidden="true" />
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
                      if (date && headerDateTo && date > headerDateTo) setHeaderDateTo(date);
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
                      if (date && headerDateFrom && date < headerDateFrom) setHeaderDateFrom(date);
                    }}
                    value={headerDateTo}
                    minDate={headerDateFrom}
                    maxDate={new Date()}
                    className="adm-header-date-range__calendar"
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-2">
                <button
                  type="button"
                  className="adm-header-date-range__pill adm-header-date-range__pill--clear"
                  onClick={() => {
                    setHeaderDateFrom(null);
                    setHeaderDateTo(null);
                    setHeaderDatePreset('');
                    setShowHeaderDateRangePicker(false);
                    setPage(1);
                  }}
                >
                  Clear
                </button>
                <button type="button" className="btn btn-sm adm-header-date-range__apply-btn" onClick={applyCustomDateRange}>
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
        {headerDatePreset && (
          <button
            type="button"
            className="adm-header-date-range__pill adm-header-date-range__pill--clear"
            onClick={() => {
              setHeaderDatePreset('');
              setHeaderDateFrom(null);
              setHeaderDateTo(null);
              setShowHeaderDateRangePicker(false);
              setPage(1);
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );

  const renderStatGrid = (rows) => (
    <div className="lead-strip-v3__stat-grid">
      <div className="lead-strip-v3__stat-row">
        {rows.map((row) => (
          <div key={row.key} className="lead-strip-v3__stat" style={{ background: row.bg, color: '#fff' }}>
            <span className="lead-strip-v3__stat-label">{row.label}</span>
            <span className="lead-strip-v3__stat-val">{pad2(row.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOwnerSelect = (lead, field, { allowEmpty = true, emptyLabel = 'No co-owner' } = {}) => {
    const value = userRefId(field === 'leadOwner' ? (lead.leadOwner || lead.assignedTo) : lead.leadCoOwner);
    return (
      <select
        className="form-select form-select-sm lead-strip-v3__owner-select"
        value={value}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          e.stopPropagation();
          updateLead(lead._id, { [field]: e.target.value || null });
        }}
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {!allowEmpty && !value && <option value="">Select owner</option>}
        {counselorOptions.map((opt) => (
          <option key={`${field}-${lead._id}-${opt.value}`} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  };

  const renderEditPanel = () => {
    if (!showPanel || !statusPanelLead) return null;
    const isFollowup = showPanel === 'followUp';
    // Fields only appear when the sub-status was configured to require them.
    const activeSub = getSubStatuses(selectedStatus).find((s) => String(s._id) === String(selectedSubStatus));
    const showFollowupFields = isFollowup || Boolean(activeSub?.hasFollowup);
    const showRemarksField = isFollowup || Boolean(activeSub?.hasRemarks);
    const showAttachmentField = !isFollowup && Boolean(activeSub?.hasAttachment);

    const panelContent = (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-user-edit text-secondary" />
            </div>
            <h6 className="mb-0 followUp fw-medium">
              {isFollowup
                ? `Set ${followUpType === 'Visit' ? 'Visit' : 'Call'} Followup for ${statusPanelLead.fullName || ''}`
                : `Edit Status for ${statusPanelLead.fullName || ''}`}
            </h6>
          </div>
          <button className="btn-close" type="button" onClick={closePanel} />
        </div>
        <div className="card-body">
          <form onSubmit={isFollowup ? submitFollowup : submitStatusChange}>
            {!isFollowup && (
              <>
                
                <div className="mb-1">
                  <label className="form-label small fw-medium text-dark">
                    Status<span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select border-0 bgcolor"
                    value={selectedStatus}
                    onChange={(e) => handleStatusSelect(e.target.value)}
                    style={{ height: 42, backgroundColor: '#f1f2f6', paddingInline: 10, width: '100%' }}
                  >
                    <option value="">Select Status</option>
                    {hrStatuses.map((s) => (
                      <option key={s._id} value={s._id}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-1">
                  <label className="form-label small fw-medium text-dark">
                    Sub-Status<span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select border-0 bgcolor"
                    value={selectedSubStatus}
                    onChange={(e) => setSelectedSubStatus(e.target.value)}
                    style={{ height: 42, backgroundColor: '#f1f2f6', paddingInline: 10, width: '100%' }}
                  >
                    <option value="">Select Sub-Status</option>
                    {getSubStatuses(selectedStatus).map((s) => (
                      <option key={s._id} value={s._id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {showFollowupFields && (
              <div className="row mb-1">
                <div className="col-6">
                  <label className="form-label small fw-medium text-dark">
                    Next Action Date<span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control border-0 bgcolor"
                    value={followupDate}
                    min={moment().format('YYYY-MM-DD')}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    style={{ backgroundColor: '#f1f2f6', height: 42, paddingInline: 10 }}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-medium text-dark">
                    Time<span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    className="form-control border-0 bgcolor"
                    value={followupTime}
                    onChange={(e) => setFollowupTime(e.target.value)}
                    style={{ backgroundColor: '#f1f2f6', height: 42, paddingInline: 10 }}
                  />
                </div>
              </div>
            )}

            {showAttachmentField && (
              <div className="mb-1">
                <label className="form-label small fw-medium text-dark">
                  Attachment<span className="text-danger">*</span>
                </label>
                <input
                  type="file"
                  className="form-control border-0 bgcolor"
                  accept="image/*,application/pdf"
                  onChange={(e) => setStatusAttachment(e.target.files?.[0] || null)}
                  style={{ backgroundColor: '#f1f2f6', paddingInline: 10 }}
                />
              </div>
            )}

            {showRemarksField && (
              <div className="mb-1">
                <label className="form-label small fw-medium text-dark">
                  Comment<span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control border-0 bgcolor"
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Remarks are mandatory"
                  style={{ resize: 'none', backgroundColor: '#f1f2f6' }}
                />
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn"
                style={{ border: '1px solid #ddd', padding: '8px 24px', fontSize: 14 }}
                onClick={closePanel}
              >
                CLOSE
              </button>
              <button
                type="submit"
                className="btn text-white"
                disabled={savingStatus}
                style={{ backgroundColor: '#fd7e14', border: 'none', padding: '8px 24px', fontSize: 14 }}
              >
                {savingStatus ? 'SAVING...' : isFollowup ? 'SET FOLLOWUP' : 'UPDATE STATUS'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );

    if (isMobile) {
      return (
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
      );
    }

    return (
      <div className="col-11 transition-col" id="editFollowupPanel">
        {panelContent}
      </div>
    );
  };

  const renderLeadCard = (lead) => {
    const phone = formatPhone(lead.mobile);
    const approval = approvalFromMilestone(lead.statusMilestone);
    const callCounts = lead.followupCounts?.call || EMPTY_FOLLOWUP_BUCKET;
    const visitCounts = lead.followupCounts?.visit || EMPTY_FOLLOWUP_BUCKET;
    const nextCall = lead.nextCallFollowup;
    const nextVisit = lead.nextVisitFollowup;
    const hasResume = Boolean(lead.resume);
    const resumePct = hasResume ? 100 : 0;
    const circumference = 2 * Math.PI * 11;
    const offset = circumference - (resumePct / 100) * circumference;

    return (
      <div className="card-content transition-col mb-2" key={lead._id}>
        <div className={`lead-card${approvalEditId === lead._id ? ' lead-card--approval-open' : ''}`}>
          <div className="lead-project-tabs" role="tablist">
            <button type="button" className="lead-project-tabs__tab lead-project-tabs__tab--active" title={lead.applyingFor}>
              {lead.applyingFor || 'Role'}
            </button>
          </div>

          <div className={`lead-strip-v3${approvalEditId === lead._id ? ' lead-strip-v3--approval-open' : ''}`}>
            <div className="lead-strip-v3__profile">
              <div className="lead-strip-v3__profile-top">
                <div className="lead-strip-v3__profile-head">
                  <div className="lead-strip-v3__name text-capitalize" title={lead.fullName || 'NA'}>
                    {lead.fullName || 'N/A'}
                  </div>
                  <div className="lead-strip-v3__doc" title="Resume">
                    <div className="circular-progress-container" data-percent={hasResume ? '100' : '0'}>
                      <svg width="28" height="28">
                        <circle className="circle-bg" cx="14" cy="14" r="11" />
                        <circle
                          className="circle-progress"
                          cx="14"
                          cy="14"
                          r="11"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                        />
                      </svg>
                      <div className="progress-text">{hasResume ? 'CV' : 'NA'}</div>
                    </div>
                  </div>
                </div>
                <div className="lead-strip-v3__profile-body">
                  <div className="lead-strip-v3__phone-line" title={phone || 'NA'}>
                    <i className="fas fa-phone" aria-hidden="true" />
                    <span>{phone || 'N/A'}</span>
                    {phone && (
                      <a
                        className="lead-strip-v3__wa lead-strip-v3__wa--inline"
                        href={`https://wa.me/91${phone}`}
                        target="_blank"
                        rel="noreferrer"
                        title="WhatsApp"
                        aria-label="WhatsApp"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: '#25d366',
                          color: '#fff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                        }}
                      >
                        <i className="fab fa-whatsapp" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                  <div className="lead-strip-v3__email-line" title={lead.email || 'NA'}>
                    <i className="fas fa-envelope" aria-hidden="true" />
                    <span>{lead.email || 'N/A'}</span>
                  </div>
                  <div className="lead-strip-v3__owners">
                    <div className="lead-strip-v3__owner-line lead-strip-v3__owner-line--owner">
                      <span className="lead-strip-v3__owner-label">Owner</span>
                      {renderOwnerSelect(lead, 'leadOwner', { allowEmpty: false, emptyLabel: 'Select owner' })}
                    </div>
                    <div className="lead-strip-v3__owners-row">
                      <div className="lead-strip-v3__owner-line">
                        <span className="lead-strip-v3__owner-label">Co-1</span>
                        {renderOwnerSelect(lead, 'leadCoOwner', { allowEmpty: true, emptyLabel: 'No co-owner' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lead-strip-v3__pair">
              <div className="lead-strip-v3__panel lead-strip-v3__panel--performance">
                <div className="lead-strip-v3__perf-block">
                  <div className="lead-strip-v3__panel-head">
                    <span className="lead-strip-v3__panel-title">
                      <i className="fas fa-chart-line" aria-hidden="true" /> Performance
                    </span>
                  </div>
                  <div className="lead-strip-v3__kv">
                    <span className="lead-strip-v3__kv-label">Status</span>
                    <button type="button" className="lead-strip-v3__kv-pill" onClick={() => openStatusPanel(lead)}>
                      {lead.statusTitle || 'Not Set'}
                    </button>
                  </div>
                  <div className="lead-strip-v3__kv">
                    <span className="lead-strip-v3__kv-label">Sub-Status</span>
                    <button type="button" className="lead-strip-v3__kv-pill" onClick={() => openStatusPanel(lead)}>
                      {lead.subStatusTitle || 'Not Set'}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="lead-strip-v3__panel-edit"
                    title="Edit Performance"
                    onClick={() => openStatusPanel(lead)}
                  >
                    <i className="fas fa-edit" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="lead-strip-v3__panel lead-strip-v3__panel--approval">
                <div className={`lead-strip-v3__approval-block${approvalEditId === lead._id ? ' lead-strip-v3__approval-block--open' : ''}`}>
                  <div className="lead-strip-v3__panel-head lead-strip-v3__panel-head--approval">
                    <span className="lead-strip-v3__panel-title">
                      <i className="fas fa-award" aria-hidden="true" /> Lead Approval
                    </span>
                    <button
                      type="button"
                      className="lead-strip-v3__approval-edit"
                      title="Change approval"
                      onClick={() => setApprovalEditId((prev) => (prev === lead._id ? null : lead._id))}
                    >
                      <i className="fas fa-pen" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="lead-strip-v3__approval-row">
                    <button
                      type="button"
                      className={`lead-strip-v3__approval-pill lead-strip-v3__approval-pill--${approval}`}
                      onClick={() => setApprovalEditId((prev) => (prev === lead._id ? null : lead._id))}
                    >
                      {approvalLabel(approval)}
                    </button>
                  </div>
                  <div className={`lead-strip-v3__approval-dropdown ${approvalEditId === lead._id ? 'is-open' : ''}`}>
                    <div className="lead-strip-v3__approval-menu">
                      <button
                        type="button"
                        className="lead-strip-v3__approval-action lead-strip-v3__approval-action--approve"
                        onClick={() => {
                          applyApprovalStatus(lead, 'approved');
                          setApprovalEditId(null);
                        }}
                      >
                        <i className="fas fa-check-circle" aria-hidden="true" />
                        Approve
                      </button>
                      <button
                        type="button"
                        className="lead-strip-v3__approval-action lead-strip-v3__approval-action--reject"
                        onClick={() => {
                          applyApprovalStatus(lead, 'rejected');
                          setApprovalEditId(null);
                        }}
                      >
                        <i className="fas fa-times-circle" aria-hidden="true" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`lead-strip-v3__panel lead-strip-v3__panel--followup-call${nextCall ? '' : ' lead-strip-v3__panel--no-followup'}`}>
              <div className="lead-strip-v3__panel-head">
                <span className="lead-strip-v3__panel-title">
                  <i className="fas fa-phone-alt" aria-hidden="true" /> Followup Calling
                </span>
              </div>
              {renderStatGrid([
                { key: 'fc-done', label: 'Done', value: callCounts.done, bg: 'rgb(18, 179, 255)' },
                { key: 'fc-planned', label: 'Planned', value: callCounts.planned, bg: 'rgb(12, 125, 180)' },
                { key: 'fc-missed', label: 'Missed', value: callCounts.missed, bg: 'rgb(8, 80, 120)' },
              ])}
              <div className="lead-strip-v3__footer">
                <div className="lead-strip-v3__footer-main">
                  <span className="lead-strip-v3__footer-label">Next Follow-up Date:</span>
                  <span className="lead-strip-v3__footer-val">{formatFollowupDate(nextCall?.followupDate)}</span>
                </div>
                <button
                  type="button"
                  className="lead-strip-v3__footer-cal"
                  title="Set Followup"
                  aria-label="Set Followup"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openEditPanel(lead, 'SetFollowup', 'Call');
                  }}
                >
                  <i className="fas fa-edit" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className={`lead-strip-v3__panel lead-strip-v3__panel--followup-visit${nextVisit ? '' : ' lead-strip-v3__panel--no-followup'}`}>
              <div className="lead-strip-v3__panel-head">
                <span className="lead-strip-v3__panel-title">
                  <i className="fas fa-user-check" aria-hidden="true" /> Followup Visit
                </span>
              </div>
              {renderStatGrid([
                { key: 'fv-done', label: 'Done', value: visitCounts.done, bg: 'rgb(75, 85, 99)' },
                { key: 'fv-planned', label: 'Planned', value: visitCounts.planned, bg: 'rgb(55, 65, 81)' },
                { key: 'fv-missed', label: 'Missed', value: visitCounts.missed, bg: 'rgb(35, 42, 52)' },
              ])}
              <div className="lead-strip-v3__footer">
                <div className="lead-strip-v3__footer-main">
                  <span className="lead-strip-v3__footer-label">Next Follow-up Date:</span>
                  <span className="lead-strip-v3__footer-val">{formatFollowupDate(nextVisit?.followupDate)}</span>
                </div>
                <button
                  type="button"
                  className="lead-strip-v3__footer-cal"
                  title="Set Followup"
                  aria-label="Set Followup"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openEditPanel(lead, 'SetFollowup', 'Visit');
                  }}
                >
                  <i className="fas fa-edit" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="lead-strip-v3__panel lead-strip-v3__panel--kyc">
              <div className="lead-card-kyc-dash">
                <div className="lead-strip-v3__panel-head lead-strip-v3__panel-head--actions">
                  <span className="lead-strip-v3__panel-title">
                    <i className="fas fa-id-card" aria-hidden="true" /> KYC
                  </span>
                  <div className="lead-strip-v3__head-actions">
                    {phone && (
                      <a className="lead-strip-v3__icon-btn" href={`tel:${phone}`} title="Call">
                        <i className="fas fa-phone" aria-hidden="true" />
                      </a>
                    )}
                    <button
                      type="button"
                      className="lead-strip-v3__icon-btn lead-strip-v3__icon-btn--collapse"
                      onClick={() => {
                        setExpandedId(expandedId === lead._id ? null : lead._id);
                        setActiveTab((prev) => ({ ...prev, [lead._id]: prev[lead._id] || 0 }));
                      }}
                    >
                      <i className={`fas fa-chevron-${expandedId === lead._id ? 'up' : 'down'}`} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="lead-card-kyc-dash__stats">
                  {[
                    { label: 'Verified', value: hasResume ? 1 : 0, bg: '#10b981' },
                    { label: 'Pending', value: hasResume ? 0 : 1, bg: '#f59e0b' },
                    { label: 'Rejected', value: 0, bg: '#ef4444' },
                  ].map((s) => (
                    <div key={s.label} className="lead-card-kyc-dash__stat text-center text-white" style={{ background: s.bg }}>
                      <div className="lead-card-kyc-dash__stat-label">{s.label}</div>
                      <div className="lead-card-kyc-dash__stat-divider" aria-hidden="true" />
                      <div className="lead-card-kyc-dash__stat-value">{pad2(s.value)}</div>
                    </div>
                  ))}
                </div>
                <div className="lead-card-kyc-dash__actions">
                  {hasResume ? (
                    <a className="lead-card-kyc-dash__btn lead-card-kyc-dash__btn--done" href={getDocFileUrl(lead.resume)} target="_blank" rel="noreferrer">
                      View Resume
                    </a>
                  ) : (
                    <span className="lead-card-kyc-dash__btn">No Resume</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-0">
            <div className="card-header bg-white border-bottom-0 py-3">
              <ul
                className="nav nav-pills nav-pills-sm"
                style={{
                  display: 'flex',
                  flexWrap: isMobile ? 'nowrap' : 'wrap',
                  overflowX: isMobile ? 'auto' : 'visible',
                  gap: '8px',
                }}
              >
                {DETAIL_TABS.map((tab, tabIndex) => (
                  <li className="nav-item" key={tab}>
                    <button
                      type="button"
                      className={`nav-link ${(activeTab[lead._id] || 0) === tabIndex ? 'active' : ''}`}
                      onClick={() => {
                        setExpandedId(lead._id);
                        setActiveTab((prev) => ({ ...prev, [lead._id]: tabIndex }));
                      }}
                    >
                      {tab}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {expandedId === lead._id && (activeTab[lead._id] || 0) === 0 && (
              <div className="tab-content px-3 pb-3">
                <div className="tab-pane active">
                  <div className="row g-2 hr-info-grid">
                    {[
                      { label: 'LEAD AGE', value: leadAgeDays(lead.createdAt) },
                      { label: 'APPLIED FOR', value: lead.applyingFor || 'N/A' },
                      { label: 'QUALIFICATION', value: lead.qualification || 'N/A' },
                      { label: 'DATE OF BIRTH', value: formatDob(lead.dateOfBirth) },
                      { label: 'LEAD CREATION DATE', value: formatLeadDate(lead.createdAt) },
                      { label: 'LEAD MODIFICATION DATE', value: formatLeadDate(lead.updatedAt) },
                      {
                        label: 'LEAD OWNER',
                        value: (
                          <select
                            className="form-select form-select-sm"
                            value={userRefId(lead.leadOwner || lead.assignedTo)}
                            onChange={(e) => updateLead(lead._id, { leadOwner: e.target.value || null })}
                          >
                            {!userRefId(lead.leadOwner || lead.assignedTo) && <option value="">Select owner</option>}
                            {counselorOptions.map((opt) => (
                              <option key={`owner-detail-${lead._id}-${opt.value}`} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ),
                      },
                      {
                        label: 'LEAD CO-OWNER',
                        value: (
                          <select
                            className="form-select form-select-sm"
                            value={userRefId(lead.leadCoOwner)}
                            onChange={(e) => updateLead(lead._id, { leadCoOwner: e.target.value || null })}
                          >
                            <option value="">No co-owner</option>
                            {counselorOptions.map((opt) => (
                              <option key={`co-detail-${lead._id}-${opt.value}`} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ),
                      },
                      { label: 'REMARKS', value: lead.remark || 'N/A', wide: true },
                    ].map((item) => (
                      <div className={item.wide ? 'col-12 col-md-6' : 'col-6 col-md-3'} key={item.label}>
                        <div className="info-group">
                          <div className="info-label">{item.label}</div>
                          <div className="info-value">{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {expandedId === lead._id && (activeTab[lead._id] || 0) === 1 && (() => {
              const documents = Array.isArray(lead.documents) && lead.documents.length
                ? lead.documents
                : [{ key: 'resume', name: 'Resume / CV', fileUrl: lead.resume, uploadedAt: hasResume ? lead.updatedAt : null }];
              const uploadedCount = documents.filter((doc) => doc.fileUrl).length;
              return (
              <div className="tab-content px-3 pb-3">
                <div className="enhanced-documents-panel">
                  <div className="hr-doc-stats stats-grid">
                    <div className="stat-card total-docs">
                      <div className="stat-icon"><i className="fas fa-file-alt" /></div>
                      <div className="stat-info"><h4>{documents.length}</h4><p>Total Required</p></div>
                    </div>
                    <div className="stat-card uploaded-docs">
                      <div className="stat-icon"><i className="fas fa-cloud-upload-alt" /></div>
                      <div className="stat-info"><h4>{uploadedCount}</h4><p>Uploaded</p></div>
                    </div>
                    <div className="stat-card pending-docs">
                      <div className="stat-icon"><i className="fas fa-clock" /></div>
                      <div className="stat-info"><h4>{documents.length - uploadedCount}</h4><p>Pending</p></div>
                    </div>
                    <div className="stat-card verified-docs">
                      <div className="stat-icon"><i className="fas fa-check-circle" /></div>
                      <div className="stat-info"><h4>{uploadedCount}</h4><p>Approved</p></div>
                    </div>
                  </div>

                  <div className="documents-grid-enhanced">
                    {documents.map((doc) => {
                      const fileUrl = getDocFileUrl(doc.fileUrl);
                      const fileType = getFileType(fileUrl);
                      const isUploading = uploadingDoc === `${lead._id}:${doc.key}`;
                      return (
                        <div key={doc.key} className="document-card-enhanced">
                          <div className="document-image-container">
                            {fileUrl ? (
                              <>
                                {fileType === 'image' ? (
                                  <img src={fileUrl} alt={doc.name} className="document-image" />
                                ) : (
                                  <div className="document-preview-icon">
                                    <i
                                      className={fileType === 'pdf' ? 'fa-solid fa-file' : 'fas fa-file'}
                                      style={{ fontSize: fileType === 'pdf' ? 100 : 40, color: fileType === 'pdf' ? '#dc3545' : '#6c757d' }}
                                    />
                                    <p style={{ fontSize: 12, marginTop: 10 }}>
                                      {fileType === 'pdf' ? 'PDF Document' : 'Document'}
                                    </p>
                                  </div>
                                )}
                                <div className="image-overlay">
                                  <button
                                    type="button"
                                    className="preview-btn"
                                    onClick={(e) => openDocumentModal(e, doc, lead)}
                                  >
                                    <i className="fas fa-search-plus" />
                                    Preview
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="no-document-placeholder">
                                <i className="fas fa-file-upload" />
                                <p>No Document</p>
                              </div>
                            )}
                          </div>
                          <div className="document-info-section">
                            <div className="document-header">
                              <h4 className="document-title">{doc.name}</h4>
                              <div className="document-actions">
                                {fileUrl ? (
                                  <button
                                    type="button"
                                    className="action-btn verify-btn"
                                    onClick={(e) => openDocumentModal(e, doc, lead)}
                                  >
                                    <i className="fas fa-search" />
                                    Preview
                                  </button>
                                ) : (
                                  <label className="action-btn upload-btn mb-0">
                                    <i className="fas fa-cloud-upload-alt" />
                                    {isUploading ? 'Uploading' : 'Upload'}
                                    <input
                                      type="file"
                                      className="d-none"
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                                      disabled={isUploading}
                                      onChange={(e) => uploadLeadDocument(lead._id, doc.key, e.target.files?.[0], e.target)}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                            <div className="document-meta">
                              <div className="meta-item">
                                <i className="fas fa-calendar-alt text-muted" />
                                <span className="meta-text">
                                  {doc.uploadedAt && fileUrl
                                    ? new Date(doc.uploadedAt).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                    : 'Not uploaded'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  const isPanelOpen = Boolean(showPanel && statusPanelLead);
  const mainContentClass = !isMobile && isPanelOpen ? 'col-8' : 'col-12';

  return (
    <div className="container-fluid">
      <div className="row">
        <div className={isMobile ? 'col-12' : mainContentClass}>
          <div className="position-relative" ref={widthRef}>
            <nav
              ref={navRef}
              className="adm-cycle-header-nav b2b-cycle-header-nav"
              style={{
                zIndex: 11,
                backgroundColor: '#fff',
                position: 'fixed',
                width: `${width}px`,
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                paddingBlock: '10px',
                paddingInline: '4px',
              }}
            >
              <div className="container-fluid">
                <div className="row align-items-center gy-2">
                  <div className="col-md-4 col-xl-4 d-none d-md-block">
                    <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.1rem' }}>HR</h5>
                    {renderDatePills()}
                  </div>
                  <div className="col-12 d-md-none mb-1 adm-cycle-mobile-title">
                    <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.1rem' }}>HR</h5>
                  </div>
                  <div className="col-12 d-md-none mb-1">{renderDatePills(true)}</div>
                  <div className="col-md-8 col-xl-8 d-none d-md-flex justify-content-end align-items-center">
                    <div className="b2b-cycle-filters">
                      <div className="b2b-cycle-filters__item">
                        <label className="small fw-semibold mb-0">Role</label>
                        <select
                          className="form-select form-select-sm b2b-cycle-filters__select"
                          value={applyingFor}
                          onChange={(e) => {
                            setApplyingFor(e.target.value);
                            setPage(1);
                          }}
                        >
                          <option value="">All</option>
                          {roles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 mt-1 pt-1 border-top adm-cycle-toolbar" style={{ borderColor: '#eee' }}>
                    <div className="adm-cycle-toolbar__outer d-flex gap-2 align-items-center justify-content-between">
                      <div className="adm-cycle-toolbar__actions d-flex flex-nowrap gap-2 align-items-center">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600 }}
                          onClick={downloadLeads}
                        >
                          <i className="fas fa-download" style={{ fontSize: '10px' }} /> Download Leads
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600 }}
                          onClick={() => setShowAddModal(true)}
                        >
                          <i className="fas fa-plus" style={{ fontSize: '10px' }} /> Add Leads
                        </button>
                      </div>
                      <div className="adm-cycle-toolbar__inner d-flex align-items-center gap-2">
                        <form
                          className="position-relative adm-cycle-search"
                          onSubmit={(e) => {
                            e.preventDefault();
                            setSearch(searchInput.trim());
                            setPage(1);
                          }}
                        >
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Quick search..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            style={{
                              width: isMobile ? '100%' : '200px',
                              paddingRight: '30px',
                              paddingLeft: '12px',
                              backgroundColor: '#ffffff',
                              border: '1.5px solid #ced4da',
                              fontSize: '13px',
                              borderRadius: '6px',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                          <button
                            type="submit"
                            className="btn btn-link p-0"
                            style={{ position: 'absolute', right: 8, top: 6, color: ACCENT }}
                          >
                            <i className="fas fa-search" />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </div>

          <div
            className="content-body marginTopMobile"
            style={{
              '--adm-cycle-nav-height': `${navHeight}px`,
              marginTop: `${navHeight + 10}px`,
            }}
          >
            <section className="list-view">
              <div className="row">
                <div className="col-12 b2b-crm-dashboard px-0">
                  <div className="b2b-dash-section mt-2">
                    <span className="b2b-dash-section__label">My Leads</span>
                    <div className="b2b-mobile-hscroll d-flex gap-2 align-items-center pt-1">
                      <button
                        type="button"
                        className="b2b-perf-chip"
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '999px',
                          color: leadStatus === 'all' ? '#fff' : ACCENT,
                          backgroundColor: leadStatus === 'all' ? ACCENT : '#fff',
                          border: leadStatus === 'all' ? 'none' : `1.5px solid ${ACCENT}`,
                        }}
                        onClick={() => { setLeadStatus('all'); setPage(1); }}
                      >
                        All Leads
                      </button>
                    </div>
                  </div>

                  <div className="b2b-dash-section mt-2">
                    <span className="b2b-dash-section__label">Lead Approval</span>
                    <div className="b2b-mobile-hscroll b2b-mobile-hscroll--approval d-flex gap-2 align-items-stretch pt-1">
                      {[
                        { key: 'total', label: 'Total', value: approvalCounts.total, bg: '#5b4fc9', status: 'all' },
                        { key: 'approved', label: 'Approved', value: approvalCounts.approved, bg: '#10b981', status: approvalCounts.approvedStatusId },
                        { key: 'pending', label: 'Pending', value: approvalCounts.pending, bg: '#f59e0b', status: '' },
                        { key: 'rejected', label: 'Rejected', value: approvalCounts.rejected, bg: '#ef4444', status: approvalCounts.rejectedStatusId },
                      ].map((row) => (
                        <div
                          key={row.key}
                          role="button"
                          tabIndex={0}
                          className="b2b-dash-stat-card b2b-dash-stat-card--lead text-center text-white"
                          style={{
                            background: row.bg,
                            outline: row.status && leadStatus === String(row.status) ? '3px solid rgba(255,255,255,0.55)' : 'none',
                            cursor: row.status ? 'pointer' : 'default',
                          }}
                          onClick={() => {
                            if (!row.status) return;
                            setLeadStatus(String(row.status));
                            setPage(1);
                          }}
                        >
                          <div className="b2b-dash-stat-card__label">{row.label}</div>
                          <div className="b2b-dash-stat-card__divider" aria-hidden="true" />
                          <div className="b2b-dash-stat-card__value text-white">{pad2(row.value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="b2b-dash-section mt-3">
                    <span className="b2b-dash-section__label">Performance</span>
                    <div className="b2b-mobile-hscroll b2b-mobile-hscroll--chips d-flex gap-2 align-items-center pt-1">
                      {statusFilterChips.map((filter) => {
                        const isSelected = leadStatus === filter.id;
                        return (
                          <button
                            key={filter.id}
                            type="button"
                            className="b2b-perf-chip"
                            style={{
                              padding: '6px 14px',
                              fontSize: '12px',
                              fontWeight: 600,
                              borderRadius: '999px',
                              color: isSelected ? '#fff' : ACCENT,
                              backgroundColor: isSelected ? ACCENT : '#fff',
                              border: isSelected ? 'none' : `1.5px solid ${ACCENT}`,
                            }}
                            onClick={() => { setLeadStatus(filter.id); setPage(1); }}
                          >
                            {filter.label.toUpperCase()} ({counts[filter.id] ?? 0})
                          </button>
                        );
                      })}
                      {!hrStatuses.length && (
                        <span className="text-muted small">
                          No HR status configured yet — add them from HR Status Design.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="row g-2 mt-1 mb-2 align-items-stretch b2b-followup-scroll-row">
                    {[
                      {
                        type: 'Call',
                        label: 'Followup Calling',
                        bucketKey: 'call',
                        rows: [
                          { key: 'fc-done', bucket: 'done', label: 'Done', bg: '#12b3ff' },
                          { key: 'fc-planned', bucket: 'planned', label: 'Planned', bg: '#f59e0b' },
                          { key: 'fc-missed', bucket: 'missed', label: 'Missed', bg: '#7c3d14' },
                        ],
                      },
                      {
                        type: 'Visit',
                        label: 'Followup Visit',
                        bucketKey: 'visit',
                        rows: [
                          { key: 'fv-done', bucket: 'done', label: 'Done', bg: '#4b5563' },
                          { key: 'fv-planned', bucket: 'planned', label: 'Planned', bg: '#4b5563' },
                          { key: 'fv-missed', bucket: 'missed', label: 'Missed', bg: '#7c3d14' },
                        ],
                      },
                    ].map((section) => (
                      <div className="col-12 col-lg-3 b2b-followup-scroll-col" key={section.type}>
                        <div className="b2b-dash-section h-100">
                          <span className="b2b-dash-section__label">{section.label}</span>
                          <div className="d-flex flex-wrap gap-1 pt-1">
                            {section.rows.map((row) => {
                              const selected = followupFilter?.type === section.type && followupFilter?.bucket === row.bucket;
                              const value = followupCounts?.[section.bucketKey]?.[row.bucket] ?? 0;
                              return (
                                <button
                                  key={row.key}
                                  type="button"
                                  className={`b2b-dash-stat-card text-center text-white flex-grow-1 border-0${selected ? ' b2b-dash-stat-card--active' : ''}`}
                                  style={{ background: row.bg }}
                                  title={`Filter leads: ${section.type} follow-ups - ${row.label}`}
                                  aria-pressed={selected}
                                  onClick={() => {
                                    setFollowupFilter(selected ? null : { type: section.type, bucket: row.bucket });
                                    setPage(1);
                                  }}
                                >
                                  <div className="b2b-dash-stat-card__label">{row.label}</div>
                                  <div className="b2b-dash-stat-card__divider" aria-hidden="true" />
                                  <div className="b2b-dash-stat-card__value text-white">{pad2(value)}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12 rounded equal-height-2 coloumn-2">
                  <div className="card px-3">
                    <div className="row" id="crm-main-row">
                      {loading && (
                        <div className="col-12 text-center py-5">
                          <div className="spinner-border text-primary mb-3" role="status" />
                          <h5 className="text-muted">Loading profiles...</h5>
                          <p className="text-muted small">Please wait while we fetch the latest data</p>
                        </div>
                      )}
                      <div className="crm-leads-scrolls col-12 mt-1">
                        {!loading && leads.length === 0 && (
                          <div className="col-12 text-center py-4">
                            <p className="text-muted mb-2">No HR leads match the current filters.</p>
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setShowAddModal(true)}>
                              Add Leads
                            </button>
                          </div>
                        )}
                        {!loading && leads.map(renderLeadCard)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center align-items-center gap-2 mt-3 mb-3">
                  <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                  <span className="small text-muted">Page {pagination.page} of {pagination.totalPages}</span>
                  <button className="btn btn-sm btn-outline-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
              )}
            </section>
          </div>
        </div>

        {!isMobile && isPanelOpen && (
          <div className="col-4">
            <div
              className="row"
              style={{
                transition: 'margin-top 0.2s ease-in-out',
                position: 'fixed',
                width: '-webkit-fill-available',
                zIndex: 10,
              }}
            >
              {renderEditPanel()}
            </div>
          </div>
        )}

        {isMobile && renderEditPanel()}
      </div>

      {showDocumentModal && (
        <DocumentPreviewModal previewDoc={selectedDocument} onClose={closeDocumentModal} />
      )}

      {showAddModal && (
        <div className="hr-b2c-modal-backdrop" onClick={() => !adding && setShowAddModal(false)}>
          <div className="hr-b2c-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hr-b2c-modal__head">
              <div>
                <h5 className="mb-0">Add HR Lead</h5>
                <small>Same fields as the public career form</small>
              </div>
              <button type="button" className="btn btn-sm text-white" onClick={() => setShowAddModal(false)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={submitAddLead}>
              <div className="hr-b2c-form-grid">
                <div>
                  <label className="small fw-bold">Full name *</label>
                  <input className="form-control form-control-sm" required value={addForm.fullName} onChange={(e) => setAddForm((p) => ({ ...p, fullName: e.target.value }))} />
                </div>
                <div>
                  <label className="small fw-bold">Mobile *</label>
                  <input className="form-control form-control-sm" required maxLength={10} value={addForm.mobile} onChange={(e) => setAddForm((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                </div>
                <div>
                  <label className="small fw-bold">Email *</label>
                  <input className="form-control form-control-sm" required type="email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="small fw-bold">City</label>
                  <input className="form-control form-control-sm" value={addForm.city} onChange={(e) => setAddForm((p) => ({ ...p, city: e.target.value }))} />
                </div>
                <div>
                  <label className="small fw-bold">Applying for *</label>
                  <select className="form-select form-select-sm" required value={addForm.applyingFor} onChange={(e) => setAddForm((p) => ({ ...p, applyingFor: e.target.value }))}>
                    <option value="">Select role</option>
                    {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                <div>
                  <label className="small fw-bold">Experience *</label>
                  <input className="form-control form-control-sm" required value={addForm.experience} onChange={(e) => setAddForm((p) => ({ ...p, experience: e.target.value }))} />
                </div>
                <div>
                  <label className="small fw-bold">Qualification</label>
                  <input className="form-control form-control-sm" value={addForm.qualification} onChange={(e) => setAddForm((p) => ({ ...p, qualification: e.target.value }))} />
                </div>
                <div>
                  <label className="small fw-bold">Date of Birth</label>
                  <input className="form-control form-control-sm" type="date" value={addForm.dateOfBirth} onChange={(e) => setAddForm((p) => ({ ...p, dateOfBirth: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="small fw-bold">Resume</label>
                  <input className="form-control form-control-sm" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setAddForm((p) => ({ ...p, resume: e.target.files?.[0] || null }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="small fw-bold">Remark</label>
                  <textarea className="form-control form-control-sm" rows={2} value={addForm.remark} onChange={(e) => setAddForm((p) => ({ ...p, remark: e.target.value }))} />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 px-3 pb-3">
                <button type="button" className="btn btn-sm btn-light" disabled={adding} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm" style={{ background: ACCENT, color: '#fff' }} disabled={adding}>
                  {adding ? 'Saving...' : 'Save lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrLeads;
