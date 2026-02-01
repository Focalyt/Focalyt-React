import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'
import { getGoogleAuthCode, getGoogleRefreshToken } from '../../../../Component/googleOAuth';

import CandidateProfile from '../CandidateProfile/CandidateProfile';


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

const MultiSelectCheckbox = ({
  title,
  options,
  selectedValues,
  onChange,
  icon = "fas fa-list",
  isOpen,
  onToggle
}) => {

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleCheckboxChange = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="options-search">
              <div className="input-group input-group-sm">
                <span className="input-group-text" style={{ height: '40px' }}>
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Search ${title.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                  {searchTerm ? `No ${title.toLowerCase()} found for "${searchTerm}"` : `No ${title.toLowerCase()} available`}
                </div>
              )}
            </div>

            {/* Footer with count */}
            {selectedValues.length > 0 && (
              <div className="options-footer">
                <small className="text-muted">
                  {selectedValues.length} of {filteredOptions.length} selected
                  {searchTerm && ` (filtered from ${options.length} total)`}
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

  const calculateHeight = useCallback(() => {
    if (navRef.current) {
      const height = navRef.current.offsetHeight;
      setNavHeight(height);
    }
  }, []);

  const calculateWidth = useCallback(() => {

    if (widthRef.current) {
      const width = widthRef.current.offsetWidth;
      setWidth(width);
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

  return { navRef, navHeight, calculateHeight, width };
};
const useMainWidth = (dependencies = []) => {// Default fallback
  const widthRef = useRef(null);
  const [width, setWidth] = useState(0);

  const calculateWidth = useCallback(() => {

    if (widthRef.current) {
      const width = widthRef.current.offsetWidth;
      setWidth(width);
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

  return { widthRef, width };
};
// DocumentModal Component
const DocumentModal = memo(({
  showDocumentModal,
  selectedDocument,
  closeDocumentModal,
  updateDocumentStatus,
  getFileType
}) => {
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [documentZoom, setDocumentZoom] = useState(1);
  const [documentRotation, setDocumentRotation] = useState(0);

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'text-dark';
      case 'verified': return 'text-success';
      case 'rejected': return 'text-danger';
      default: return 'text-secondary';
    }
  };

  const latestUpload = useMemo(() => {
    if (!selectedDocument) return null;
    return selectedDocument.uploads && selectedDocument.uploads.length > 0
      ? selectedDocument.uploads[selectedDocument.uploads.length - 1]
      : (selectedDocument.fileUrl && selectedDocument.status !== "Not Uploaded" ? selectedDocument : null);
  }, [selectedDocument]);

  const handleZoomIn = useCallback(() => {
    setDocumentZoom(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setDocumentZoom(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setDocumentRotation(prev => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setDocumentZoom(1);
    setDocumentRotation(0);
  }, []);

  const fileUrl = latestUpload?.fileUrl || selectedDocument?.fileUrl;
  const fileType = fileUrl ? getFileType(fileUrl) : null;

  const handleRejectClick = useCallback(() => {
    setShowRejectionForm(true);
  }, []);

  const handleCancelRejection = useCallback(() => {
    setShowRejectionForm(false);
    setRejectionReason('');
  }, []);

  const handleConfirmRejection = useCallback(() => {
    if (rejectionReason.trim()) {
      updateDocumentStatus(latestUpload?._id || selectedDocument?._id, 'Rejected', rejectionReason);
      handleCancelRejection();
    }
  }, [latestUpload, selectedDocument, rejectionReason, updateDocumentStatus, handleCancelRejection]);

  if (!showDocumentModal || !selectedDocument) return null;

  return (
    <div className="document-modal-overlay" onClick={closeDocumentModal} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="document-modal-content" onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <div className="modal-header" style={{
          padding: '20px',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0 }}>{selectedDocument.Name} Verification</h3>
          <button className="close-btn" onClick={closeDocumentModal} style={{
            background: 'none',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            color: '#6c757d'
          }}>&times;</button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          <div className="document-preview-section">
            <div className="document-preview-container" style={{ height: 'auto', marginBottom: '20px' }}>
              {(latestUpload?.fileUrl || selectedDocument?.fileUrl) ? (
                <>
                  {(() => {
                    const fileUrl = latestUpload?.fileUrl || selectedDocument?.fileUrl;
                    const fileType = getFileType(fileUrl);

                    if (fileType === 'image') {
                      return (
                        <img
                          src={fileUrl}
                          alt="Document Preview"
                          style={{
                            transform: `scale(${documentZoom}) rotate(${documentRotation}deg)`,
                            transition: 'transform 0.3s ease',
                            maxWidth: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      );
                    } else if (fileType === 'pdf') {
                      return (
                        <div className="pdf-viewer" style={{ width: '100%', height: '600px' }}>
                          <iframe
                            src={fileUrl + '#navpanes=0&toolbar=0'}
                            width="100%"
                            height="100%"
                            style={{
                              border: 'none',
                              transform: `scale(${documentZoom})`,
                              transformOrigin: 'top left',
                              transition: 'transform 0.3s ease'
                            }}
                            title="PDF Document"
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div className="document-preview" style={{ textAlign: 'center', padding: '40px' }}>
                          <div style={{ fontSize: '60px', marginBottom: '20px' }}>📄</div>
                          <h4>Document Preview</h4>
                          <a
                            href={fileUrl}
                            download
                            className="btn btn-primary"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fas fa-download me-2"></i>
                            Download & View
                          </a>
                        </div>
                      );
                    }
                  })()}
                  {fileUrl && (
                    <div className="preview-controls" style={{
                      display: 'flex',
                      gap: '10px',
                      marginTop: '15px',
                      justifyContent: 'center'
                    }}>
                      <button className="btn btn-sm btn-outline-secondary" onClick={handleZoomIn}>
                        <i className="fas fa-search-plus"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={handleZoomOut}>
                        <i className="fas fa-search-minus"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={handleRotate}>
                        <i className="fas fa-redo"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={handleReset}>
                        <i className="fas fa-compress"></i>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-document" style={{ textAlign: 'center', padding: '40px' }}>
                  <i className="fas fa-file-times fa-3x text-muted mb-3"></i>
                  <p>No document uploaded</p>
                </div>
              )}
            </div>
          </div>

          <div className="document-info-section">
            <div className="info-card" style={{
              padding: '15px',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <h4 style={{ marginBottom: '15px' }}>Document Information</h4>
              <div className="info-row" style={{ marginBottom: '10px' }}>
                <strong>Document Name:</strong> {selectedDocument.Name}
              </div>
              <div className="info-row" style={{ marginBottom: '10px' }}>
                <strong>Upload Date:</strong> {(latestUpload?.uploadedAt || selectedDocument?.uploadedAt) ?
                  new Date(latestUpload?.uploadedAt || selectedDocument?.uploadedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) : 'N/A'}
              </div>
              <div className="info-row">
                <strong>Status:</strong>
                <span className={`${getStatusBadgeClass(latestUpload?.status || selectedDocument?.status)} ms-2`}>
                  {latestUpload?.status || selectedDocument?.status || 'No Uploads'}
                </span>
              </div>
            </div>
          </div>

          {!showRejectionForm && (
            <div className="document-actions" style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              marginTop: '20px'
            }}>
              <button
                className="btn btn-success"
                onClick={() => updateDocumentStatus(latestUpload?._id || selectedDocument?._id, 'Verified', '')}
                disabled={latestUpload?.status === 'Verified' || selectedDocument?.status === 'Verified'}
              >
                <i className="fas fa-check me-2"></i>
                Verify
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRejectClick}
                disabled={latestUpload?.status === 'Rejected' || selectedDocument?.status === 'Rejected'}
              >
                <i className="fas fa-times me-2"></i>
                Reject
              </button>
            </div>
          )}

          {showRejectionForm && (
            <div className="rejection-form" style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <label className="form-label">
                <strong>Rejection Reason:</strong>
              </label>
              <textarea
                className="form-control"
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button className="btn btn-primary" onClick={handleConfirmRejection}>
                  Confirm Rejection
                </button>
                <button className="btn btn-secondary" onClick={handleCancelRejection}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

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
const Placements = () => {

  const candidateRef = useRef();
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [userData, setUserData] = useState(JSON.parse(sessionStorage.getItem("user") || "{}"));
  const token = userData.token;
  // const permissions = userData.permissions
  const [permissions, setPermissions] = useState();

  useEffect(() => {
    updatedPermission()
  }, [])

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

  const [mainContentClass, setMainContentClass] = useState('col-12');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [leadDetailsVisible, setLeadDetailsVisible] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  const [viewMode, setViewMode] = useState('grid');
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

  // Job History and Course History state
  const [jobHistory, setJobHistory] = useState([]);
  const [courseHistory, setCourseHistory] = useState([]);

  // Company Jobs state
  const [companyJobs, setCompanyJobs] = useState([]);
  const [loadingCompanyJobs, setLoadingCompanyJobs] = useState(false);
  const [jobVideoSrc, setJobVideoSrc] = useState("");

  // Job Creation state
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    companyName: '',
    displayCompanyName: '',
    _qualification: '',
    _industry: '',
    _course: '',
    city: '',
    state: '',
    validity: '',
    jobDescription: '',
    requirement: '',
    noOfPosition: 1,
    _jobCategory: ''
  });
  const [jobFormErrors, setJobFormErrors] = useState({});
  const [qualifications, setQualifications] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [creatingJob, setCreatingJob] = useState(false);
  const [jobOfferCandidates, setJobOfferCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedJobOfferId, setSelectedJobOfferId] = useState(null);
  const [showCandidatesModal, setShowCandidatesModal] = useState(false);

  // Job Offer state
  const [showOfferJobModal, setShowOfferJobModal] = useState(false);
  const [selectedPlacementForJob, setSelectedPlacementForJob] = useState(null);
  const [selectedJobForOffer, setSelectedJobForOffer] = useState(null);
  const [offerJobData, setOfferJobData] = useState({
    dateOfJoining: '',
    remarks: ''
  });
  const [offeringJob, setOfferingJob] = useState(false);
  // Track sent job offers: Set of "placementId_jobId" strings
  const [sentJobOffers, setSentJobOffers] = useState(new Set());
  
  // Bulk job offer state
  const [showBulkJobMode, setShowBulkJobMode] = useState(false);
  const [bulkJobInputValue, setBulkJobInputValue] = useState(''); 
  const [selectedBulkJob, setSelectedBulkJob] = useState(null);
  const [sendingBulkJobs, setSendingBulkJobs] = useState(false);
  const [allLeadsForBulk, setAllLeadsForBulk] = useState([]);

  // WhatsApp Panel states
  const [showPanel, setShowPanel] = useState('');
  const [whatsappMessages, setWhatsappMessages] = useState([]);
  const [whatsappNewMessage, setWhatsappNewMessage] = useState('');
  const [selectedWhatsappTemplate, setSelectedWhatsappTemplate] = useState(null);
  const [showWhatsappTemplateMenu, setShowWhatsappTemplateMenu] = useState(false);
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
  const whatsappMessagesEndRef = useRef(null);
  const [whatsappTemplates, setWhatsappTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);
  const [sessionWindow, setSessionWindow] = useState({
    isOpen: false,
    openedAt: null,
    expiresAt: null,
    remainingTimeMs: 0
  });
  const [sessionCountdown, setSessionCountdown] = useState('24:00:00');

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


  // open model for upload documents 
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [currentPreviewUpload, setCurrentPreviewUpload] = useState(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // Lead form state
  const [leadFormData, setLeadFormData] = useState({
    companyName: '',
    employerName: '',
    contactNumber: '',
    dateOfJoining: null,
    location: ''
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  const [extractedNumbers, setExtractedNumbers] = useState([]);

  //refer lead stats
  const [concernPersons, setConcernPersons] = useState([]);
  const [selectedConcernPerson, setSelectedConcernPerson] = useState(null);

  //filter stats

  // MultiSelectCheckbox filter options
  const [verticalOptions, setVerticalOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [centerOptions, setCenterOptions] = useState([]);
  const [counselorOptions, setCounselorOptions] = useState([]);

  // Form data for multi-select filters
  const [formData, setFormData] = useState({
    projects: {
      type: "includes",
      values: []
    },
    verticals: {
      type: "includes",
      values: []
    },
    course: {
      type: "includes",
      values: []
    },
    center: {
      type: "includes",
      values: []
    },
    counselor: {
      type: "includes",
      values: []
    }
  });

  const [dropdownStates, setDropdownStates] = useState({
    projects: false,
    verticals: false,
    course: false,
    center: false,
    counselor: false
  });

  const [selectedProfiles, setSelectedProfiles] = useState([]);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const handleCheckboxChange = (placement, checked) => {
    if (checked) {
      setSelectedProfiles(prev => [...(Array.isArray(prev) ? prev : []), placement._id]);
    } else {
      setSelectedProfiles(prev => (Array.isArray(prev) ? prev : []).filter(id => id !== placement._id));
    }
  };

  const handleTabClick = (placementIndex, tabIndex, placement) => {
    setSelectedProfile(placement);
    setActiveTab(prevTabs => ({
      ...prevTabs,
      [placementIndex]: tabIndex
    }));


    const candidateId = placement._candidate?._id || placement._candidate || placement._student?._id || placement._student;
    if (tabIndex === 2 && candidateId) {
      fetchJobHistory(candidateId);
    } else if (tabIndex === 3 && candidateId) {
      fetchCourseHistory(candidateId);
    } else if (tabIndex === 5) {
      fetchCompanyJobs(placement);
    }

    if (isMobile) {
      setTimeout(() => {
        const tabButton = document.querySelector(`.nav-pills .nav-link:nth-child(${tabIndex + 1})`);
        if (tabButton) {
          tabButton.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }, 100);
    }
  };

  const toggleLeadDetails = (placementId) => {
    setShowPopup(prev => prev === placementId ? null : placementId);
  };


  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);


  // B2B Dropdown Options
  const [leadCategoryOptions, setLeadCategoryOptions] = useState([]);


  const clearFollowupFormData = () => {
    setFollowupFormData({
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
      if (!selectedProfile || !selectedProfile._id) {
        alert('No placement selected');
        return;
      }

      if (!followupFormData.followupDate || !followupFormData.followupTime) {
        alert('Followup date and time are mandatory. Please select both date and time.');
        return;
      }

      if (!followupFormData.remarks || followupFormData.remarks.trim() === '') {
        alert('Remarks are mandatory for followup. Please add remarks.');
        return;
      }

      const year = followupFormData.followupDate.getFullYear();
      const month = String(followupFormData.followupDate.getMonth() + 1).padStart(2, "0");
      const day = String(followupFormData.followupDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const followupDateTime = new Date(`${dateStr}T${followupFormData.followupTime}`);

      if (isNaN(followupDateTime.getTime())) {
        alert('Invalid date/time combination');
        return;
      }

      const data = {
        status: seletectedStatus || selectedProfile.status?._id || null,
        subStatus: seletectedSubStatus?._id || selectedProfile.subStatus?._id || null,
        followup: followupDateTime.toISOString(),
        remarks: followupFormData.remarks || ''
      };

      if (!backendUrl) {
        alert('Backend URL not configured');
        return;
      }

      if (!token) {
        alert('Authentication token missing');
        return;
      }

      const response = await axios.put(
        `${backendUrl}/college/placementStatus/update-status/${selectedProfile._id}`,
        data,
        {
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('Follow-up set successfully!');

        setFollowupFormData({
          followupDate: null,
          followupTime: '',
          remarks: ''
        });

        await fetchLeads(selectedStatusFilter, currentPage);
        await fetchStatusCounts();
        closePanel();
      } else {
        console.error('API returned error:', response.data);
        alert(response.data.message || 'Failed to set follow-up');
      }

    } catch (error) {
      console.error('Error setting follow-up:', error);
      alert(error.response?.data?.message || 'Failed to set follow-up. Please try again.');
    }
  };


  const initializeCityAutocomplete = () => {
    return;
  };

  const initializeStateAutocomplete = () => {
    return;
  };


  useEffect(() => {
    fetchStatusCounts();
  }, []);

  useEffect(() => {
    if (showAddLeadModal) {
      const timer = setTimeout(() => {
        initializeCityAutocomplete();
        initializeStateAutocomplete();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [showAddLeadModal]);


  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobileNumber = (number) => {
    const cleanNumber = number.replace(/\D/g, '');
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(cleanNumber);
  };

  const extractMobileNumbers = (text) => {
    if (!text) return [];
    const mobileRegex = /(?:\+91[\s-]?)?[6-9]\d{9}|(?:\+91[\s-]?)?[0-9]{10}/g;
    const matches = text.match(mobileRegex) || [];

    const validNumbers = matches
      .map(num => num.replace(/\D/g, ''))
      .filter(num => {
        const cleanNum = num.startsWith('91') && num.length === 12 ? num.slice(2) : num;
        return validateMobileNumber(cleanNum);
      })
      .map(num => {
        return num.startsWith('91') && num.length === 12 ? num.slice(2) : num;
      });

    return [...new Set(validNumbers)].slice(0, 10);
  };

  const handleLeadInputChange = (e) => {
    const { name, value } = e.target;

    setLeadFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (name === 'mobile' || name === 'whatsapp') {
      const extracted = extractMobileNumbers(value);
      setExtractedNumbers(extracted);
    }
  };

  const handleLeadMobileChange = (e) => {
    const { name, value } = e.target;

    if (name === 'contactNumber') {
      if (value.length > 10) {
        setFormErrors(prev => ({
          ...prev,
          contactNumber: 'Contact number should be 10 digits'
        }));
      }
    }
    const cleanValue = value.replace(/[^\d\s\-+]/g, '');

    setLeadFormData(prev => ({
      ...prev,
      [name]: cleanValue
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  const validateLeadForm = () => {
    const errors = {};

    if (!leadFormData.companyName) errors.companyName = 'Company name is required';
    // HR Name (employerName) is optional - no validation needed
    // Contact Number is optional but if provided, should be valid
    if (leadFormData.contactNumber && leadFormData.contactNumber.trim() !== '' && !validateMobileNumber(leadFormData.contactNumber)) {
      errors.contactNumber = 'Please enter a valid 10-digit contact number';
    }
    if (!leadFormData.dateOfJoining) errors.dateOfJoining = 'Date of Joining is required';
    if (!leadFormData.location) errors.location = 'Location is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);

  const [statusCounts, setStatusCounts] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loadingStatusCounts, setLoadingStatusCounts] = useState(false);


  useEffect(() => {
    if (showBulkJobMode && bulkJobInputValue && allLeadsForBulk && allLeadsForBulk.length > 0) {
      const numCandidates = parseInt(bulkJobInputValue, 10);
      if (!isNaN(numCandidates) && numCandidates > 0) {
        const maxCount = Math.min(numCandidates, allLeadsForBulk.length);
        const firstNIds = allLeadsForBulk.slice(0, maxCount).map(placement => placement._id).filter(Boolean);
        setSelectedProfiles(firstNIds);
      }
    } else if (!bulkJobInputValue || bulkJobInputValue === '') {
      setSelectedProfiles([]);
    }
  }, [bulkJobInputValue, allLeadsForBulk, showBulkJobMode]);
  const [filters, setFilters] = useState({
    search: '',
    placementStatus: '',
    placementDateRange: {
      start: null,
      end: null
    }
  });
  const [showFilters, setShowFilters] = useState(false);

  // Toggle dropdown for MultiSelectCheckbox
  const toggleDropdown = (filterName) => {
    setDropdownStates(prev => {
      // Close all other dropdowns and toggle the current one
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = key === filterName ? !prev[key] : false;
        return acc;
      }, {});
      return newState;
    });
  };

  // Handle criteria change for MultiSelectCheckbox
  const handleCriteriaChange = (criteria, values) => {
    setFormData((prevState) => ({
      ...prevState,
      [criteria]: {
        type: "includes",
        values: values
      }
    }));
  };

  // Add useEffect to handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any multi-select dropdown
      const isMultiSelectClick = event.target.closest('.multi-select-container-new');

      if (!isMultiSelectClick) {
        // Close all dropdowns
        setDropdownStates(prev =>
          Object.keys(prev).reduce((acc, key) => {
            acc[key] = false;
            return acc;
          }, {})
        );
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch filter options for MultiSelectCheckbox
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await axios.get(`${backendUrl}/college/filters-data`, {
          headers: { 'x-auth': token }
        });
        if (res.data.status) {
          setVerticalOptions(res.data.verticals.map(v => ({ value: v._id, label: v.name })));
          setProjectOptions(res.data.projects.map(p => ({ value: p._id, label: p.name })));
          setCourseOptions(res.data.courses.map(c => ({ value: c._id, label: c.name })));
          setCenterOptions(res.data.centers.map(c => ({ value: c._id, label: c.name })));
          setCounselorOptions(res.data.counselors.map(c => ({ value: c._id, label: c.name })));
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchLeads(null, 1);
    fetchStatusCounts();
  }, []);

  const handleStatusCardClick = (statusId) => {
    setSelectedStatusFilter(statusId);
    setCurrentPage(1);
    fetchLeads(statusId, 1);
    // If bulk mode is open, refresh all leads for bulk
    if (showBulkJobMode) {
      fetchAllLeadsForBulk();
    }
  };

  const handleTotalCardClick = () => {
    setSelectedStatusFilter(null);
    setCurrentPage(1);
    fetchLeads(null, 1);
    // If bulk mode is open, refresh all leads for bulk
    if (showBulkJobMode) {
      fetchAllLeadsForBulk();
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
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

  const applyFilters = () => {
    setCurrentPage(1);
    fetchLeads(selectedStatusFilter, 1);
    // If bulk mode is open, refresh all leads for bulk
    if (showBulkJobMode) {
      fetchAllLeadsForBulk();
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      placementStatus: '',
      placementDateRange: {
        start: null,
        end: null
      }
    });
    setCurrentPage(1);
    fetchLeads(selectedStatusFilter, 1);
  };

  const fetchLeads = async (statusFilter = null, page = 1) => {
    try {
      closePanel();
      setLoadingLeads(true);

      const params = {
        page: page,
        limit: 100,  // Increased limit to show more candidates per page
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.placementStatus) {
        params.placementStatus = filters.placementStatus;
      }
      if (filters.placementDateRange.start) {
        params.placementStartDate = filters.placementDateRange.start;
      }
      if (filters.placementDateRange.end) {
        params.placementEndDate = filters.placementDateRange.end;
      }

      const response = await axios.get(`${backendUrl}/college/placementStatus/candidates`, {
        headers: { 'x-auth': token },
        params: params
      });

      if (response.data.status) {
        const placements = response.data.data.placements || [];
        console.log(`Fetched ${placements.length} placements (page ${page}, limit 100)`);
        setLeads(placements);
        const existingOffers = new Set();
        placements.forEach(placement => {
          if (placement.jobOffers && Array.isArray(placement.jobOffers)) {
            placement.jobOffers.forEach(jobOffer => {
              if (jobOffer._job && placement._id && (jobOffer.status === 'offered' || jobOffer.status === 'active')) {
                const offerKey = `${placement._id}_${jobOffer._job}`;
                existingOffers.add(offerKey);
              }
            });
          }
        });
        setSentJobOffers(existingOffers);
        
        if (response.data.data.pagination) {
          setTotalPages(response.data.data.pagination.totalPages || 1);
          setCurrentPage(response.data.data.pagination.currentPage || 1);
          setPageSize(response.data.data.pagination.totalPlacements || 0);
          console.log(`Pagination: Page ${response.data.data.pagination.currentPage} of ${response.data.data.pagination.totalPages}, Total: ${response.data.data.pagination.totalPlacements}`);
        }
      } else {
        console.error('Failed to fetch placements:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      setLoadingStatusCounts(true);
      const response = await axios.get(`${backendUrl}/college/placementStatus/status-count`, {
        headers: { 'x-auth': token }
      });


      if (response.data.status) {
        const statusCountsData = response.data.data.statusCounts || [];
        setStatusCounts(statusCountsData);
        
        // Calculate total from backend response or sum of all status counts
        let calculatedTotal = response.data.data.totalLeads || 0;
        
        // If backend total is 0 or seems incorrect, calculate from status counts
        if (calculatedTotal === 0 && statusCountsData.length > 0) {
          calculatedTotal = statusCountsData.reduce((sum, status) => sum + (status.count || 0), 0);
        }
        
        // Use the higher value (backend total or calculated sum)
        const finalTotal = Math.max(calculatedTotal, statusCountsData.reduce((sum, status) => sum + (status.count || 0), 0));
        
        console.log('Status counts:', statusCountsData);
        console.log('Backend total:', response.data.data.totalLeads);
        console.log('Calculated total from status counts:', calculatedTotal);
        console.log('Final total:', finalTotal);
        
        setTotalLeads(finalTotal);
      } else {
        console.error('Failed to fetch status counts:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching status counts:', error);
    } finally {
      setLoadingStatusCounts(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    try {
      if (showPanel === 'editPanel') {
        if (!selectedProfile || !selectedProfile._id) {
          alert('No placement selected');
          return;
        }

        if (!seletectedStatus) {
          alert('Please select a status');
          return;
        }
        const hasRemarksRequired = seletectedSubStatus && seletectedSubStatus.hasRemarks;
        const hasFollowupRequired = seletectedSubStatus && seletectedSubStatus.hasFollowup;

        if (hasRemarksRequired && (!followupFormData.remarks || followupFormData.remarks.trim() === '')) {
          alert('Remarks are mandatory for this status. Please add remarks.');
          return;
        }

        if (hasFollowupRequired && (!followupFormData.followupDate || !followupFormData.followupTime)) {
          alert('Followup date and time are mandatory for this status. Please select followup date and time.');
          return;
        }
        let followupDateTime = null;
        if (followupFormData.followupDate && followupFormData.followupTime) {
          const year = followupFormData.followupDate.getFullYear();
          const month = String(followupFormData.followupDate.getMonth() + 1).padStart(2, "0");
          const day = String(followupFormData.followupDate.getDate()).padStart(2, "0");

          const dateStr = `${year}-${month}-${day}`;
          followupDateTime = new Date(`${dateStr}T${followupFormData.followupTime}`);

          if (isNaN(followupDateTime.getTime())) {
            alert('Invalid date/time combination');
            return;
          }
        }

        const data = {
          status: typeof seletectedStatus === 'object' ? seletectedStatus._id : seletectedStatus,
          subStatus: seletectedSubStatus?._id || null,
          followup: followupDateTime ? followupDateTime.toISOString() : null,
          remarks: followupFormData.remarks || ''
        };

        if (!backendUrl) {
          alert('Backend URL not configured');
          return;
        }

        if (!token) {
          alert('Authentication token missing');
          return;
        }
        const response = await axios.put(
          `${backendUrl}/college/placementStatus/update-status/${selectedProfile._id}`,
          data,
          {
            headers: {
              'x-auth': token,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          alert('Status updated successfully!');
console.log("response.data",response.data)
          setSelectedStatus('');
          setSelectedSubStatus(null);
          setFollowupFormData({
            followupDate: null,
            followupTime: '',
            remarks: ''
          });


          const profileId = selectedProfile._id;
          const statusId = typeof seletectedStatus === 'object' ? seletectedStatus._id : seletectedStatus;

          const selectedCrmFilter = crmFilters.find(f => f._id === statusId);
          const milestone = selectedCrmFilter?.milestone;

          // Update filter to the new status so candidate appears in the correct tab (like Admission Cycle)
          setSelectedStatusFilter(statusId);

          await fetchLeads(statusId, currentPage);
          await fetchStatusCounts();


          if (profileId && milestone) {
            const placementId = profileId;

            if (milestone.toLowerCase() === 'documents') {
              setActiveTab(prevTabs => ({
                ...prevTabs,
                [placementId]: 1
              }));


              if (leadDetailsVisible !== placementId) {
                setLeadDetailsVisible(placementId);
              }
            }
          }

          closePanel();
        } else {
          console.error('API returned error:', response.data);
          alert(response.data.message || 'Failed to update status');
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update status. Please try again.');
    }
  };

  const handleLeadSubmit = async () => {
    if (!validateLeadForm()) {
      return;
    }

    try {
      const leadData = {
        companyName: leadFormData.companyName,
        employerName: leadFormData.employerName,
        contactNumber: leadFormData.contactNumber,
        dateOfJoining: leadFormData.dateOfJoining ? moment(leadFormData.dateOfJoining).format('YYYY-MM-DD') : null,
        location: leadFormData.location
      };

      const response = await axios.post(`${backendUrl}/college/placementStatus/add-candidate`, leadData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.status) {
        alert('Candidate added successfully!');
        fetchLeads(null, 1);
        fetchStatusCounts();

        setLeadFormData({
          companyName: '',
          employerName: '',
          contactNumber: '',
          dateOfJoining: null,
          location: ''
        });
        setFormErrors({});

        setShowAddLeadModal(false);
      } else {
        alert(response.data.message || 'Failed to add candidate');
      }
    } catch (error) {
      console.error('Error submitting candidate:', error);
      if (error.response?.data?.message) {
        alert(`Failed to add candidate: ${error.response.data.message}`);
      } else {
        alert('Failed to add candidate. Please try again.');
      }
    }
  };
  const handleCloseLeadModal = () => {
    setShowAddLeadModal(false);
    setLeadFormData({
      companyName: '',
      employerName: '',
      contactNumber: '',
      dateOfJoining: null,
      location: ''
    });
    setFormErrors({});
  };

  const handleOpenLeadModal = () => {
    setShowAddLeadModal(true);
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
    fetchLeads(selectedStatusFilter, newPage);
  };
  useEffect(() => {
    getPaginationPages()
  }, [totalPages])

  useEffect(() => {
    const containers = document.querySelectorAll('.circular-progress-container');
    containers.forEach(container => {
      const percent = container.getAttribute('data-percent');
      const circle = container.querySelector('circle.circle-progress');
      const progressText = container.querySelector('.progress-text');

      if (circle && progressText) {
        if (percent === 'NA' || percent === null || percent === undefined) {

          circle.style.strokeDasharray = 0;
          circle.style.strokeDashoffset = 0;
          progressText.innerText = 'NA';
        } else {
          const radius = 16;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference - (percent / 100) * circumference;

          circle.style.strokeDasharray = circumference;
          circle.style.strokeDashoffset = offset;
          progressText.innerText = percent + '%';
        }
      }
    });
  }, [leads]);

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

  const getFileType = (fileUrl) => {
    if (!fileUrl) return 'unknown';
    const extension = fileUrl.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'document';
    } else if (['xls', 'xlsx'].includes(extension)) {
      return 'spreadsheet';
    }
    return 'unknown';
  };

  const filterDocuments = (documents = []) => {
    if (!Array.isArray(documents)) return [];
    if (statusFilter === 'all') return documents;

    return documents.filter(doc => {
      if (!doc.uploads || doc.uploads.length === 0) return statusFilter === 'none';

      const lastUpload = doc.uploads[doc.uploads.length - 1];
      if (!lastUpload || !lastUpload.status) return false;

      return lastUpload.status.toLowerCase() === statusFilter;
    });
  };

  const openDocumentModal = (document) => {
    const isSameDocument = selectedDocument && selectedDocument._id === document._id;

    setSelectedDocument(document);
    setShowDocumentModal(true);

    if (!isSameDocument) {
      setDocumentZoom(1);
      setDocumentRotation(0);
    }
  };

  const closeDocumentModal = useCallback(() => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
    setDocumentZoom(1);
    setDocumentRotation(0);
  }, []);

  const updateDocumentStatus = useCallback((uploadId, status, reason) => {
    if (status === 'Rejected' && !reason?.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    alert(`Document ${status} successfully!`);
    closeDocumentModal();
    // Refresh placement data
    fetchLeads(selectedStatusFilter, currentPage);
  }, [closeDocumentModal, selectedStatusFilter, currentPage]);

  const openUploadModal = (document) => {
    setSelectedDocumentForUpload(document);
    setSelectedFile(null);
    setUploadPreview(null);
    setUploadProgress(0);
    setIsUploading(false);
    // Open modal using Bootstrap
    const modalElement = document.getElementById('staticBackdrop');
    if (modalElement) {
      const modal = new window.bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedDocumentForUpload(null);
    setSelectedFile(null);
    setUploadPreview(null);
    setUploadProgress(0);
    setIsUploading(false);
    // Close modal using Bootstrap
    const modalElement = document.getElementById('staticBackdrop');
    if (modalElement) {
      const modal = window.bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type (images and PDFs)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid file (JPG, PNG, GIF, or PDF)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size should be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedDocumentForUpload || !selectedProfile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('doc', selectedDocumentForUpload._id);

      const response = await axios.put(`${backendUrl}/college/upload_docs/${selectedProfile._id}`, formData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.data.status) {
        fetchLeads(selectedStatusFilter, currentPage);
        alert('Document uploaded successfully! Status: Pending Review');

        // Close modal
        const closeButton = document.querySelector('#staticBackdrop .btn-close');
        if (closeButton) {
          closeButton.click();
        }
      } else {
        alert('Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getDocumentCounts = (documents = []) => {
    if (!Array.isArray(documents)) return {
      totalRequired: 0,
      uploadedCount: 0,
      pendingVerificationCount: 0,
      verifiedCount: 0,
      RejectedCount: 0
    };

    const totalRequired = documents.length;
    const uploadedCount = documents.filter(doc => doc.uploads && doc.uploads.length > 0).length;
    const pendingVerificationCount = documents.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Pending'
    ).length;
    const verifiedCount = documents.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Verified'
    ).length;
    const RejectedCount = documents.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Rejected'
    ).length;

    return {
      totalRequired,
      uploadedCount,
      pendingVerificationCount,
      verifiedCount,
      RejectedCount
    };
  };




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
    remarks: '',
    selectedProfile: null,
    selectedConcernPerson: null,
    selectedProfiles: null,
    selectedCounselor: null,
    selectedDocument: null
  });


  const [subStatuses, setSubStatuses] = useState([


  ]);

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;

  const { navRef, navHeight } = useNavHeight([isFilterCollapsed, crmFilters]);
  const { widthRef, width } = useMainWidth([isFilterCollapsed, crmFilters, mainContentClass]);
  const { isScrolled, scrollY, contentRef } = useScrollBlur(navHeight);
  const blurIntensity = Math.min(scrollY / 10, 15);
  const navbarOpacity = Math.min(0.85 + scrollY / 1000, 0.98);
  const tabs = [
    'Lead Details',
    'Profile',
    'Job History',
    'Course History',
    'Documents',
    'Company Jobs'
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
    if (seletectedStatus || filters.status) {
      fetchSubStatus()
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
      const response = await axios.get(`${backendUrl}/college/placementStatus`, {
        headers: { 'x-auth': token }
      });


      if (response.data.success) {
        const status = response.data.data;
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
          substatuses: r.substatuses || []
        })));


      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch Status');
    }
  };

  const fetchSubStatus = async () => {
    try {
      const status = seletectedStatus || filters.status;
      if (!status) {
        alert('Please select a status');
        return;
      }
      const response = await axios.get(`${backendUrl}/college/placementStatus/${status}/substatus`, {
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









  const openEditPanel = async (profile = null, panel) => {
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


  const closePanel = () => {
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


  const openWhatsappPanel = async (placement) => {
    if (placement) {
      setSelectedProfile(placement);
    }
    setShowPopup(null);
    setShowPanel('Whatsapp');

    const mobileNumber = placement?._candidate?.mobile || placement?._student?.mobile || placement?.studentMobile || placement?.contactNumber;
    
    if (mobileNumber) {
      await fetchWhatsappHistory(mobileNumber);
      await checkSessionWindow(mobileNumber);
    } else {
      alert('Mobile number not found for this candidate');
    }

    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  // Fetch WhatsApp chat history
  const fetchWhatsappHistory = async (phoneNumber) => {
    try {
      if (!phoneNumber || !token) {
        console.error('❌ Phone number or token missing:', { phoneNumber, hasToken: !!token });
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
        const formattedMessages = response.data.data.map((msg, index) => ({
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
      console.error('❌ Error fetching chat history:', error.response?.data || error.message);
      setWhatsappMessages([]);
    } finally {
      setIsLoadingChatHistory(false);
    }
  };

  // Check WhatsApp 24-hour session window status
  const checkSessionWindow = async (phoneNumber) => {
    try {
      if (!phoneNumber || !token) {
        console.error('❌ Phone number or token missing');
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
      }
    } catch (error) {
      console.error('❌ Error checking session window:', error.response?.data || error.message);
      setSessionWindow({
        isOpen: false,
        openedAt: null,
        expiresAt: null,
        remainingTimeMs: 0
      });
    }
  };

  // Send WhatsApp message
  const sendWhatsappMessage = async () => {
    const mobileNumber = selectedProfile?._candidate?.mobile || selectedProfile?._student?.mobile || selectedProfile?.studentMobile || selectedProfile?.contactNumber;
    
    if (!mobileNumber) {
      alert('Mobile number not found');
      return;
    }

    if (!whatsappNewMessage.trim() && !selectedWhatsappTemplate) {
      alert('Please enter a message or select a template');
      return;
    }

    try {
      setIsSendingWhatsapp(true);

      let response;
      if (selectedWhatsappTemplate) {
        // Send template message
        response = await axios.post(
          `${backendUrl}/college/whatsapp/send-template`,
          {
            to: mobileNumber,
            templateId: selectedWhatsappTemplate._id || selectedWhatsappTemplate.id,
            templateName: selectedWhatsappTemplate.name,
            language: selectedWhatsappTemplate.language || 'en'
          },
          { headers: { 'x-auth': token } }
        );
      } else {
        // Send text message
        response = await axios.post(
          `${backendUrl}/college/whatsapp/send-message`,
          {
            to: mobileNumber,
            message: whatsappNewMessage
          },
          { headers: { 'x-auth': token } }
        );
      }

      if (response.data.success) {
        // Add message to local state
        const newMessage = {
          id: response.data.messageId || response.data.wamid || Date.now().toString(),
          text: whatsappNewMessage || selectedWhatsappTemplate?.name || 'Template message',
          sender: 'agent',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: selectedWhatsappTemplate ? 'template' : 'text',
          templateData: selectedWhatsappTemplate ? { components: selectedWhatsappTemplate.components } : null,
          status: 'sent'
        };

        setWhatsappMessages(prev => [...prev, newMessage]);
        setWhatsappNewMessage('');
        setSelectedWhatsappTemplate(null);
        
        // Refresh chat history
        await fetchWhatsappHistory(mobileNumber);
        // Refresh session window
        await checkSessionWindow(mobileNumber);
      } else {
        alert(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      alert(error.response?.data?.message || 'Error sending message');
    } finally {
      setIsSendingWhatsapp(false);
    }
  };

  // Fetch WhatsApp templates
  useEffect(() => {
    const fetchTemplates = async () => {
      if (showPanel === 'Whatsapp' && token) {
        try {
          const response = await axios.get(`${backendUrl}/college/whatsapp/templates`, {
            headers: { 'x-auth': token }
          });
          if (response.data.success) {
            setWhatsappTemplates(response.data.data || []);
          }
        } catch (error) {
          console.error('Error fetching templates:', error);
          setWhatsappTemplates([]);
        }
      }
    };
    fetchTemplates();
  }, [showPanel, token]);

  // Fetch templates when template menu is opened
  useEffect(() => {
    const fetchTemplates = async () => {
      if (showWhatsappTemplateMenu && token && showPanel === 'Whatsapp') {
        setIsLoadingTemplates(true);
        try {
          const response = await axios.get(`${backendUrl}/college/whatsapp/templates`, {
            headers: { 'x-auth': token }
          });
          if (response.data.success) {
            setWhatsappTemplates(response.data.data || []);
          } else {
            setWhatsappTemplates([]);
          }
        } catch (error) {
          console.error('Error fetching templates:', error);
          setWhatsappTemplates([]);
        } finally {
          setIsLoadingTemplates(false);
        }
      }
    };
    fetchTemplates();
  }, [showWhatsappTemplateMenu, token, showPanel]);

  // Session countdown timer
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
        const mobileNumber = selectedProfile?._candidate?.mobile || selectedProfile?._student?.mobile || selectedProfile?.studentMobile || selectedProfile?.contactNumber;
        if (mobileNumber) {
          checkSessionWindow(mobileNumber);
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setSessionCountdown(formatted);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [sessionWindow.isOpen, sessionWindow.expiresAt, selectedProfile]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (whatsappMessagesEndRef.current) {
      whatsappMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [whatsappMessages]);



  const openRefferPanel = async (profile = null, panel) => {

    if (profile) {
      setSelectedProfile(profile);


    }

    setShowPopup(null)

    if (panel === 'RefferAllLeads') {

      setShowPanel('RefferAllLeads');

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
    try {
      const response = await axios.post(`${backendUrl}/college/b2b/refer-lead`, {
        counselorId: selectedConcernPerson,
        leadId: selectedProfile._id
      }, {
        headers: {
          'x-auth': token,
        },
      });

      if (response.data.status) {
        const message = alert('Lead referred successfully!');
        if (message) {


        }
      } else {
        alert(response.data.message || 'Failed to refer lead');
      }
      closePanel();



    } catch (error) {
      console.error('Error referring lead:', error);
      alert('Failed to refer lead');
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
    setSelectedProfiles(null);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  const toggleLeadDetailsExpand = (placementId) => {
    setLeadDetailsVisible(prev => prev === placementId ? null : placementId);
  };

  // Render Status Change Panel
  const renderStatusChangePanel = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-edit text-primary"></i>
            </div>
            <h6 className="mb-0 fw-medium text-primary">
              Change Status for {selectedProfile?.businessName || 'Lead'}
            </h6>
          </div>
          <div>
            <button className="btn-close" type="button" onClick={closePanel}></button>
          </div>
        </div>

        <div className="card-body">
          <form onSubmit={handleUpdateStatus}>
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
              >
                <option value="">Select Status</option>
                {statuses.map((status, index) => (
                  <option key={status._id} value={status._id}>{status.name}</option>
                ))}
              </select>
            </div>

            {/* Sub-Status Selection */}
            <div className="mb-3">
              <label htmlFor="subStatus" className="form-label small fw-medium text-dark">
                Sub-Status
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
              >
                <option value="">Select Sub-Status</option>
                {subStatuses.map((subStatus, index) => (
                  <option key={subStatus._id} value={subStatus._id}>{subStatus.title}</option>
                ))}
              </select>
            </div>

            {/* Follow-up Section (if substatus has followup) */}
            {seletectedSubStatus && seletectedSubStatus.hasFollowup && (
              <div className="mb-3">
                <h6 className="text-dark mb-2">Follow-up Details</h6>
                <div className="row">
                  <div className="col-6">
                    <label htmlFor="nextActionDate" className="form-label small fw-medium text-dark">
                      Next Action Date <span className="text-danger">*</span>
                    </label>
                    <DatePicker
                      className="form-control border-0 bgcolor"
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
                className="btn btn-primary"
              >
                Update Status
              </button>
            </div>
          </form>
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
          <div>
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
              <label htmlFor="followupRemarks" className="form-label small fw-medium text-dark" style={{ fontSize: '13px', marginBottom: '8px' }}>
                Follow-up Notes
              </label>
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

              {showPanel === 'Reffer' && (`Refer Lead ${selectedProfile?._candidate?.name || 'Unknown'} to Counselor`)}
              {showPanel === 'RefferAllLeads' && (`Refer All Lead to Counselor`)}

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
                className="btn text-white"
                onClick={(e) => handleReferLead(e)}
                style={{ backgroundColor: '#fd7e14', border: 'none', padding: '8px 24px', fontSize: '14px' }}
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

  // Render WhatsApp Panel
  const renderWhatsAppPanel = () => {
    if (showPanel !== 'Whatsapp') return null;

    const mobileNumber = selectedProfile?._candidate?.mobile || selectedProfile?._student?.mobile || selectedProfile?.studentMobile || selectedProfile?.contactNumber;
    const candidateName = selectedProfile?._candidate?.name || selectedProfile?._student?.name || 'Unknown';

    const panelContent = (
      <div className="d-flex flex-column" style={{ height: '100%', width: '100%', backgroundColor: '#f0f2f5' }}>
        {/* WhatsApp Header */}
        <div className="bg-white border-bottom" style={{ padding: '16px 16px 12px 16px' }}>
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
              {candidateName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-0 fw-bold" style={{ fontSize: '16px' }}>
                {candidateName}
              </h6>
              <p className="mb-0 text-muted" style={{ fontSize: '13px' }}>
                {mobileNumber || 'N/A'}
              </p>
            </div>
            <button
              className="btn-close"
              onClick={closePanel}
              style={{ marginLeft: '8px' }}
            ></button>
          </div>

          {/* Session Status Badge */}
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
          {isLoadingChatHistory ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <div className="spinner-border text-success mb-2" role="status" style={{ width: '40px', height: '40px' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p style={{ color: '#667781', fontSize: '14px' }}>Loading chat history...</p>
              </div>
            </div>
          ) : (
            <>
              {whatsappMessages.map(message => (
                <div key={message.id} className={`d-flex mb-2 ${message.sender === 'agent' ? 'justify-content-end' : 'justify-content-start'}`}>
                  <div style={{ maxWidth: message.type === 'template' ? '85%' : '75%' }}>
                    <div
                      style={{
                        backgroundColor: message.sender === 'agent' ? '#DCF8C6' : '#FFFFFF',
                        color: message.sender === 'agent' ? '#000' : '#000',
                        borderRadius: '8px',
                        borderBottomRightRadius: message.sender === 'agent' ? '2px' : '8px',
                        borderBottomLeftRadius: message.sender === 'user' ? '2px' : '8px',
                        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                        padding: message.type === 'template' ? '6px 10px 8px' : '6px 10px 8px',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Render template message */}
                      {message.type === 'template' && message.templateData ? (
                        <>
                          <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                            {message.templateData.body || message.text}
                          </div>
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
              <div ref={whatsappMessagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-top p-3">
          {/* Selected Template Preview */}
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
                        justifyContent: 'center'
                      }}
                      title="Remove Template"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="d-flex align-items-center gap-2">
            {/* Template Button */}
            <div className="position-relative">
              <button
                className="btn"
                onClick={() => {
                  setShowWhatsappTemplateMenu(!showWhatsappTemplateMenu);
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
                <div className="position-absolute bottom-100 start-0 mb-2 bg-white rounded shadow-lg border" style={{ width: '300px', maxHeight: '400px', overflowY: 'auto', zIndex: 1050 }}>
                  <div className="p-3 border-bottom bg-light">
                    <h6 className="mb-0 fw-bold">Select Template to Send</h6>
                    <p className="mb-0 small text-muted">Templates are approved by WhatsApp</p>
                  </div>

                  {isLoadingTemplates ? (
                    <div className="p-4 text-center">
                      <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mb-0 small text-muted">Loading templates...</p>
                    </div>
                  ) : whatsappTemplates.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="mb-0 small text-muted">No templates found</p>
                    </div>
                  ) : (
                    whatsappTemplates.map(template => (
                      <div
                        key={template._id || template.id}
                        className="p-3 border-bottom"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedWhatsappTemplate(template);
                          setShowWhatsappTemplateMenu(false);
                        }}
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
              <button
                className="btn flex-grow-1"
                onClick={sendWhatsappMessage}
                disabled={isSendingWhatsapp}
                style={{
                  height: '42px',
                  backgroundColor: '#25D366',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '24px',
                  fontWeight: '500',
                  fontSize: '12px'
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
                    Send Template to {candidateName.split(' ')[0] || 'User'}
                  </>
                )}
              </button>
            ) : sessionWindow.isOpen ? (
              <>
                <div className="position-relative flex-grow-1">
                  <input
                    type="text"
                    className="form-control"
                    value={whatsappNewMessage}
                    onChange={(e) => setWhatsappNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendWhatsappMessage()}
                    placeholder={`Message ${candidateName.split(' ')[0] || 'User'}...`}
                    style={{
                      height: '42px',
                      borderRadius: '24px',
                      border: '1px solid #E9EDEF',
                      fontSize: '15px',
                      backgroundColor: '#F0F2F5'
                    }}
                  />
                </div>

                {/* Send Button */}
                {whatsappNewMessage.trim() ? (
                  <button
                    onClick={sendWhatsappMessage}
                    disabled={isSendingWhatsapp}
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
                    {isSendingWhatsapp ? (
                      <div className="spinner-border spinner-border-sm text-white" role="status">
                        <span className="visually-hidden">Sending...</span>
                      </div>
                    ) : (
                      <i className="fas fa-paper-plane" style={{ fontSize: '16px' }}></i>
                    )}
                  </button>
                ) : (
                  <button
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
      return (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '100%', height: '100%', margin: 0 }}>
            <div className="modal-content" style={{ height: '100%', borderRadius: 0 }}>
              {panelContent}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="col-11 transition-col" 
        id="whatsappPanel"
        style={{
          width: '100%',
          height: 'calc(100vh - 25px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: 0
        }}
      >
        {panelContent}
      </div>
    );
  };

  const fetchLeadLogs = async (leadId) => {
    try {
      setLeadLogsLoading(true);
      const response = await axios.get(`${backendUrl}/college/placementStatus/${leadId}/logs`, {
        headers: { 'x-auth': token }
      });
      if (response.data.success) {
        console.log(response.data.data, 'response.data.data')
        setLeadLogs(response.data.data);
      }
    } catch (error) {
      console.log(error, 'error');
    } finally {
      setLeadLogsLoading(false);
    }
  };

  // Fetch Job History
  const fetchJobHistory = async (candidateId) => {
    try {
      if (!candidateId) {
        setJobHistory([]);
        return;
      }
      const response = await axios.get(`${backendUrl}/college/candidate/appliedJobs/${candidateId}`, {
        headers: { 'x-auth': token }
      });
      if (response.data && response.data.jobs) {
        setJobHistory(response.data.jobs);
      } else {
        setJobHistory([]);
      }
    } catch (error) {
      console.error('Error fetching job history:', error);
      setJobHistory([]);
    }
  };

  // Fetch Course History
  const fetchCourseHistory = async (candidateId) => {
    try {
      if (!candidateId) {
        setCourseHistory([]);
        return;
      }
      const response = await axios.get(`${backendUrl}/college/candidate/appliedCourses/${candidateId}`, {
        headers: { 'x-auth': token }
      });
      if (response.data && response.data.courses) {
        setCourseHistory(response.data.courses);
      } else {
        setCourseHistory([]);
      }
    } catch (error) {
      console.error('Error fetching course history:', error);
      setCourseHistory([]);
    }
  };

  // Fetch candidates for a job offer
  const fetchJobOfferCandidates = async (jobOfferId) => {
    try {
      setLoadingCandidates(true);
      const response = await axios.get(
        `${backendUrl}/college/placementStatus/job-offer-candidates/${jobOfferId}`,
        {
          headers: { 'x-auth': token }
        }
      );

      if (response.data && response.data.success) {
        setJobOfferCandidates(response.data.data || []);
      } else {
        setJobOfferCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching job offer candidates:', error);
      setJobOfferCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Helper function to find job offer for a placement and job
  const findJobOffer = (placement, job) => {
    if (!placement?.jobOffers || !job) return null;
    
    const jobId = job._id || job._job?._id;
    const jobIdStr = jobId?.toString();
    
    if (!jobIdStr) return null;
    
    return placement.jobOffers.find(offer => {
      if (!offer._job) return false;
      
      // Handle different _job formats: ObjectId, string, or object with _id
      const offerJobId = typeof offer._job === 'object' && offer._job !== null
        ? (offer._job._id?.toString() || offer._job.toString())
        : offer._job.toString();
      
      return offerJobId === jobIdStr;
    });
  };

  // Fetch Published Jobs for Company Jobs tab (using /company-jobs API)
  const fetchCompanyJobs = async (placement = null) => {
    try {
      setLoadingCompanyJobs(true);
      setCompanyJobs([]);

      // Get company name from placement if provided
      const companyName = placement?.companyName || null;

      // Build API params for company-jobs endpoint (published jobs)
      const params = {};
      if (companyName) {
        params.companyName = companyName;
      }

      // Use /company-jobs API which fetches published jobs from Vacancy model
      const response = await axios.get(
        `${backendUrl}/college/placementStatus/company-jobs`,
        {
          headers: { 'x-auth': token },
          params: params
        }
      );

      if (response.data && response.data.success) {
        // Response structure: { success: true, jobs: [...] }
        const jobs = response.data.jobs || response.data.data || [];
        setCompanyJobs(jobs);
      } else {
        setCompanyJobs([]);
      }
    } catch (error) {
      console.error('Error fetching company jobs:', error);
      setCompanyJobs([]);
    } finally {
      setLoadingCompanyJobs(false);
    }
  };

  // Fetch dropdown options for job creation
  const fetchJobFormOptions = async (stateId = null) => {
    try {
      const params = {};
      if (stateId) {
        params.stateId = stateId;
      }

      const response = await axios.get(
        `${backendUrl}/college/placementStatus/job-form-options`,
        {
          headers: { 'x-auth': token },
          params: params
        }
      );

      if (response.data && response.data.success) {
        setQualifications(response.data.qualifications || []);
        setIndustries(response.data.industries || []);
        setCities(response.data.cities || []);
        setStates(response.data.states || []);
        setJobCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching job form options:', error);
    }
  };

  // Open create job modal
  const handleOpenCreateJobModal = (placement = null) => {
    if (placement) {
      setSelectedPlacementForJob(placement);
    }
    setShowCreateJobModal(true);
    fetchJobFormOptions();
  };


  const handleCreateJob = async () => {
    try {
      setCreatingJob(true);
      setJobFormErrors({});

      if (!jobFormData.title || !jobFormData.companyName || !jobFormData._course) {
        setJobFormErrors({ general: 'Title, Company Name, and Course are required' });
        setCreatingJob(false);
        return;
      }

      const response = await axios.post(
        `${backendUrl}/college/placementStatus/create-job-offer`,
        {
          ...jobFormData
        },
        { headers: { 'x-auth': token } }
      );

      if (response.data && response.data.success) {
        const createdJobOffer = response.data;
        alert('Job offer created successfully!');
        setShowCreateJobModal(false);
        // Refresh company jobs list - use selectedProfile if available to maintain filter
        fetchCompanyJobs(selectedProfile || null);
        setJobFormData({
          title: '',
          companyName: '',
          displayCompanyName: '',
          _qualification: '',
          _industry: '',
          _course: '',
          city: '',
          state: '',
          jobDescription: '',
          requirement: '',
          noOfPosition: 1,
          _jobCategory: ''
        });
      } else {
        alert(response.data.message || 'Failed to create job offer');
      }
    } catch (error) {
      console.error('Error creating job offer:', error);
      alert(error.response?.data?.message || 'Error creating job offer');
    } finally {
      setCreatingJob(false);
    }
  };


  // Offer job to candidate directly (without modal)
  const handleOfferJob = async (placement, job) => {
    try {
      if (!placement || !job) {
        alert('Please select placement and job');
        return;
      }

      const jobId = job._id || job._job?._id;
      const jobTitle = job.title || job._job?.title || 'N/A';

      if (!jobId) {
        alert('Job ID not found. Please try again.');
        return;
      }

      // Confirm before sending offer
      if (!window.confirm(`Are you sure you want to send job offer "${jobTitle}" to candidate?`)) {
        return;
      }

      // Set loading state for this specific button
      setSelectedPlacementForJob(placement);
      setSelectedJobForOffer(job);
      setOfferingJob(true);

      const response = await axios.post(
        `${backendUrl}/college/placementStatus/offer-job`,
        {
          placementId: placement._id,
          jobId: jobId,
          dateOfJoining: placement.dateOfJoining ? moment(placement.dateOfJoining).format('YYYY-MM-DD') : '',
          remarks: ''
        },
        { headers: { 'x-auth': token } }
      );

      if (response.data && response.data.success) {
        alert('Job offer sent successfully! Candidate can now see this offer in their portal.');
        
        const offerKey = `${placement._id}_${jobId}`;
        setSentJobOffers(prev => new Set([...prev, offerKey]));
        
        // Refresh placements and company jobs
        fetchLeads(selectedStatusFilter, currentPage);
        if (selectedProfile) {
          fetchCompanyJobs(selectedProfile);
        }
      } else {
        alert(response.data.message || 'Failed to send job offer');
      }
    } catch (error) {
      console.error('Error offering job:', error);
      alert(error.response?.data?.message || 'Error sending job offer. Please try again.');
    } finally {
      setOfferingJob(false);
      setSelectedPlacementForJob(null);
      setSelectedJobForOffer(null);
    }
  };

  // Handle bulk job offer
  const handleBulkJobOffer = async () => {
    if (!selectedBulkJob) {
      alert('Please select a job first');
      return;
    }

    const numCandidates = parseInt(bulkJobInputValue, 10);
    const totalCandidates = allLeadsForBulk?.length || 0;

    if (!numCandidates || numCandidates < 1) {
      alert('Please enter a valid number of candidates');
      return;
    }

    if (numCandidates > totalCandidates) {
      alert(`Cannot send to ${numCandidates} candidates. Total available: ${totalCandidates}`);
      return;
    }

    const jobId = selectedBulkJob._id || selectedBulkJob._job?._id;
    const jobTitle = selectedBulkJob.title || selectedBulkJob._job?.title || 'N/A';

    if (!jobId) {
      alert('Job ID not found. Please try again.');
      return;
    }

    if (!window.confirm(`Are you sure you want to send job offer "${jobTitle}" to ${numCandidates} candidate(s)?`)) {
      return;
    }

    try {
      setSendingBulkJobs(true);
      const candidatesToSend = allLeadsForBulk.slice(0, numCandidates);
      let successCount = 0;
      let failCount = 0;

      for (const placement of candidatesToSend) {
        try {
          const response = await axios.post(
            `${backendUrl}/college/placementStatus/offer-job`,
            {
              placementId: placement._id,
              jobId: jobId,
              dateOfJoining: placement.dateOfJoining ? moment(placement.dateOfJoining).format('YYYY-MM-DD') : '',
              remarks: 'Bulk job offer'
            },
            { headers: { 'x-auth': token } }
          );

          if (response.data && response.data.success) {
            successCount++;
            // Mark as sent
            const offerKey = `${placement._id}_${jobId}`;
            setSentJobOffers(prev => new Set([...prev, offerKey]));
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Error sending job offer to ${placement._id}:`, error);
          failCount++;
        }
      }

      alert(`Bulk job offer completed! Success: ${successCount}, Failed: ${failCount}`);
      
      // Refresh placements
      fetchLeads(selectedStatusFilter, currentPage);
      
      // Reset bulk mode
      setBulkJobInputValue('');
      setShowBulkJobMode(false);
      setAllLeadsForBulk([]);
    } catch (error) {
      console.error('Error in bulk job offer:', error);
      alert('Error sending bulk job offers. Please try again.');
    } finally {
      setSendingBulkJobs(false);
    }
  };

  // Fetch all leads for bulk operations (without pagination)
  const fetchAllLeadsForBulk = async () => {
    try {
      const params = {
        page: 1,
        limit: 10000, // Large limit to get all leads
      };

      if (selectedStatusFilter) {
        params.status = selectedStatusFilter;
      }

      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.placementStatus) {
        params.placementStatus = filters.placementStatus;
      }
      if (filters.placementDateRange.start) {
        params.placementStartDate = filters.placementDateRange.start;
      }
      if (filters.placementDateRange.end) {
        params.placementEndDate = filters.placementDateRange.end;
      }

      const response = await axios.get(`${backendUrl}/college/placementStatus/candidates`, {
        headers: { 'x-auth': token },
        params: params
      });

      if (response.data.status) {
        const placements = response.data.data.placements || [];
        setAllLeadsForBulk(placements);
        return placements;
      } else {
        console.error('Failed to fetch all leads:', response.data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching all leads for bulk:', error);
      return [];
    }
  };

  // Open bulk job mode
  const handleOpenBulkJobMode = async () => {
    setShowBulkJobMode(true);
    setBulkJobInputValue('');
    setSelectedBulkJob(null);
    
    // Fetch all leads for bulk operations
    await fetchAllLeadsForBulk();
    
    // Fetch company jobs if not already loaded
    if (companyJobs.length === 0) {
      try {
        await fetchCompanyJobs();
      } catch (error) {
        console.error('Error fetching company jobs:', error);
        alert('Error loading jobs. Please try again.');
        setShowBulkJobMode(false);
      }
    }
  };

  useEffect(() => {
    if (showPanel === 'leadHistory' && selectedProfile && selectedProfile._id) {
      fetchLeadLogs(selectedProfile._id);
    }
  }, [showPanel, selectedProfile]);

  // Video modal cleanup
  useEffect(() => {
    const videoModal = document.getElementById("jobVideoModal");
    if (videoModal) {
      videoModal.addEventListener("hidden.bs.modal", () => {
        setJobVideoSrc(""); // Reset video when modal is fully closed
      });
    }
    return () => {
      if (videoModal) {
        videoModal.removeEventListener("hidden.bs.modal", () => setJobVideoSrc(""));
      }
    };
  }, []);

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
                {leadLogs && Array.isArray(leadLogs) && leadLogs.length > 0 ? (
                  <div className="timeline">
                    {leadLogs.map((log, index) => (
                      <div key={index} className="timeline-item mb-4">
                        <div className="timeline-marker">
                          <div className="timeline-marker-icon">
                            <i className="fas fa-circle text-primary" style={{ fontSize: '8px' }}></i>
                          </div>
                          {index !== leadLogs.length - 1 && (
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
                                  Modified By: {log.user?.name || log.user?.email || 'Unknown User'}
                                </small>
                              </div>

                              {(log.statusChange || log.subStatusChange || log.currentStatus || log.currentSubStatus) && (
                                <div className="mb-2 p-2 bg-light rounded">
                                  {log.statusChange && (
                                    <div className="mb-1">
                                      <strong className="text-dark d-block mb-1">
                                        <i className="fas fa-flag me-1 text-primary"></i>Status:
                                      </strong>
                                      <span className="text-muted small">
                                        {log.statusChange.from} → <strong className="text-primary">{log.statusChange.to}</strong>
                                      </span>
                                    </div>
                                  )}
                                  {log.subStatusChange && (
                                    <div className="mb-1">
                                      <strong className="text-dark d-block mb-1">
                                        <i className="fas fa-tag me-1 text-info"></i>Sub-Status:
                                      </strong>
                                      <span className="text-muted small">
                                        {log.subStatusChange.from} → <strong className="text-info">{log.subStatusChange.to}</strong>
                                      </span>
                                    </div>
                                  )}
                                  {!log.statusChange && !log.subStatusChange && (
                                    <>
                                      {log.currentStatus && log.currentStatus !== 'No Status' && (
                                        <div className="mb-1">
                                          <strong className="text-dark d-block mb-1">
                                            <i className="fas fa-flag me-1 text-primary"></i>Status:
                                          </strong>
                                          <span className="text-primary small">{log.currentStatus}</span>
                                        </div>
                                      )}
                                      {log.currentSubStatus && log.currentSubStatus !== 'No Sub-Status' && (
                                        <div className="mb-1">
                                          <strong className="text-dark d-block mb-1">
                                            <i className="fas fa-tag me-1 text-info"></i>Sub-Status:
                                          </strong>
                                          <span className="text-info small">{log.currentSubStatus}</span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}

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
            <nav ref={navRef} className="" style={{ zIndex: 11, backgroundColor: 'white', position: 'fixed', width: `${width}px`, boxShadow: '0 4px 25px 0 #0000001a', paddingBlock: isMobile ? '8px' : '5px' }}
            >
              <div className="container-fluid">
                <div className="row align-items-center">
                  {/* Desktop Title and Breadcrumb */}
                  <div className="col-md-6 d-md-block d-none">
                    <div className="d-flex align-items-center">
                      <h5 className="fw-bold text-dark mb-0 me-3" style={{ fontSize: '1.1rem' }}>Placements</h5>
                      <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0 small">
                          <li className="breadcrumb-item">
                            <a href="/institute/dashboard" className="text-decoration-none">Home</a>
                          </li>
                          <li className="breadcrumb-item active">Placements</li>
                        </ol>
                      </nav>
                    </div>
                  </div>

                  {/* Mobile Title */}
                  <div className={`${isMobile ? 'col-12' : 'col-12 d-md-none'} ${isMobile ? 'mb-2' : 'mb-2'}`}>
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="fw-bold text-dark mb-0" style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>Placements</h5>
                      <nav aria-label="breadcrumb" className={isMobile ? 'd-none' : 'd-none d-sm-block'}>
                        <ol className="breadcrumb mb-0 small">
                          <li className="breadcrumb-item">
                            <a href="/institute/dashboard" className="text-decoration-none">Home</a>
                          </li>
                          <li className="breadcrumb-item active">Placements</li>
                        </ol>
                      </nav>
                    </div>
                  </div>

                  {/* Search and Filter Section */}
                  <div className="col-md-6 col-12">
                    <div className={`d-flex ${isMobile ? 'flex-column gap-2' : 'justify-content-end align-items-center gap-2'}`}>
                      {/* Quick Search */}
                      <div className={`d-flex align-items-center ${isMobile ? 'w-100' : 'gap-2'}`} style={isMobile ? { gap: '8px' } : {}}>
                        <div className="position-relative" style={isMobile ? { flex: 1, minWidth: 0 } : {}}>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={isMobile ? "Search..." : "Quick search..."}
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                applyFilters();
                              }
                            }}
                            style={{
                              width: isMobile ? '100%' : '200px',
                              paddingRight: filters.search ? (isMobile ? '35px' : '30px') : (isMobile ? '12px' : '12px'),
                              paddingLeft: isMobile ? '10px' : '12px',
                              paddingTop: isMobile ? '10px' : '8px',
                              paddingBottom: isMobile ? '10px' : '8px',
                              backgroundColor: '#ffffff',
                              border: '1.5px solid #ced4da',
                              color: '#212529',
                              fontSize: isMobile ? '14px' : '13px',
                              borderRadius: '6px',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                              transition: 'all 0.2s ease'
                            }}
                          />
                         
                        </div>
                        {!isMobile && (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={applyFilters}
                            style={{
                              backgroundColor: '#007bff',
                              borderColor: '#007bff',
                              color: 'white',
                              fontWeight: '500',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)',
                              transition: 'all 0.2s ease',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <i className="fas fa-search me-1"></i>
                            <span>Search</span>
                          </button>
                        )}
                      </div>

                      {isMobile && (
                        <div className="d-flex gap-2 w-100">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary flex-fill"
                            onClick={applyFilters}
                            style={{
                              backgroundColor: '#007bff',
                              borderColor: '#007bff',
                              color: 'white',
                              fontWeight: '500',
                              padding: '10px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <i className="fas fa-search me-1"></i>
                            <span>Search</span>
                          </button>
                          <button
                            className={`btn btn-sm flex-fill ${showFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                              backgroundColor: showFilters ? '#007bff' : '#ffffff',
                              color: showFilters ? '#ffffff' : '#6c757d',
                              fontWeight: '500',
                              padding: '10px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              transition: 'all 0.2s ease',
                              borderWidth: '1.5px'
                            }}
                          >
                            <i className="fas fa-filter me-1"></i>
                            <span>Filter</span>
                          </button>
                        </div>
                      )}

                      {!isMobile && (
                        <button
                          className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setShowFilters(!showFilters)}
                          style={{
                            backgroundColor: showFilters ? '#007bff' : '#ffffff',
                            color: showFilters ? '#ffffff' : '#6c757d',
                            fontWeight: '500',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            transition: 'all 0.2s ease',
                            borderWidth: '1.5px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <i className="fas fa-filter me-1"></i>
                          <span>Filter</span>
                        </button>
                      )}
                      {/* {((permissions?.custom_permissions?.can_add_leads_b2b && permissions?.permission_type === 'custom')|| permissions?.permission_type === 'Admin') && (
 
                      <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                        <i className="fas fa-plus me-1"></i> Add Lead
                      </button>
                    )}   */}

                    </div>
                  </div>


                  {/* Filter Buttons Row */}
                  <div className="col-12 mt-1">
                    <div 
                      className={`d-flex ${isMobile ? 'flex-nowrap overflow-x-auto' : 'flex-wrap'} gap-1 align-items-center`}
                      style={isMobile ? {
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'thin',
                        paddingBottom: '4px'
                      } : {}}
                    >
                      {/* Status Count Cards */}
                      {loadingStatusCounts ? (
                        <div className={`d-flex ${isMobile ? 'flex-nowrap' : 'flex-wrap'} gap-2`}>
                          {[1, 2, 3, 4].map((i) => (
                            <div 
                              key={i} 
                              className="card border-0 shadow-sm" 
                              style={{ 
                                minWidth: isMobile ? '100px' : '110px', 
                                height: '45px',
                                flexShrink: isMobile ? 0 : 1
                              }}
                            >
                              <div className="card-body d-flex align-items-center justify-content-center">
                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          {/* Total Leads Card */}
                          <div
                            className={`card border-0 shadow-sm status-count-card total ${selectedStatusFilter === null ? 'selected' : ''}`}
                            style={{
                              minWidth: isMobile ? '100px' : '110px',
                              height: '45px',
                              cursor: 'pointer',
                              border: selectedStatusFilter === null ? '2px solid #007bff' : '1px solid transparent',
                              flexShrink: isMobile ? 0 : 1
                            }}
                            onClick={handleTotalCardClick}
                            title="Click to view all placements"
                          >
                            <div className="card-body p-1 text-center d-flex align-items-center justify-content-center">
                              <div className="d-flex align-items-center">
                                <i className="fas fa-chart-line me-1" style={{ color: '#ffffff', fontSize: '12px' }}></i>
                                <div>
                                  <h6 className="mb-0 fw-bold" style={{ color: '#ffffff', fontSize: '12px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Total</h6>
                                  <small style={{ color: '#ffffff', fontSize: '10px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{totalLeads} leads</small>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Placed Count Card */}
                          {(() => {
                            const placedStatus = statusCounts.find(s => s.statusName && s.statusName.toLowerCase() === 'placed');
                            const isPlacedSelected = placedStatus && selectedStatusFilter === placedStatus.statusId;
                            return placedStatus ? (
                              <div
                                className={`card border-0 shadow-sm status-count-card status ${isPlacedSelected ? 'selected' : ''}`}
                                style={{
                                  minWidth: isMobile ? '100px' : '110px',
                                  height: '45px',
                                  cursor: 'pointer',
                                  border: isPlacedSelected ? '2px solid #28a745' : '1px solid transparent',
                                  backgroundColor: isPlacedSelected ? '#f0f9f0' : 'white',
                                  flexShrink: isMobile ? 0 : 1
                                }}
                                onClick={() => {
                                  handleStatusCardClick(placedStatus.statusId);
                                }}
                                title="Click to view Placed placements"
                              >
                                <div className="card-body p-1 text-center d-flex align-items-center justify-content-center">
                                  <div className="d-flex align-items-center">
                                    <i className="fas fa-check-circle me-1" style={{ color: '#28a745', fontSize: '12px' }}></i>
                                    <div>
                                      <h6 className="mb-0 fw-bold" style={{ color: '#212529', fontSize: '11px' }}>Placed</h6>
                                      <small style={{ color: '#6c757d', fontSize: '9px' }}>{placedStatus.count || 0} leads</small>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : null;
                          })()}

                          {/* UnPlaced Count Card */}
                          {(() => {
                            const unplacedStatus = statusCounts.find(s => s.statusName && s.statusName.toLowerCase() === 'unplaced');
                            const isUnplacedSelected = (unplacedStatus && selectedStatusFilter === unplacedStatus.statusId) ||
                              (!unplacedStatus && selectedStatusFilter === null);
                            return unplacedStatus ? (
                              <div
                                className={`card border-0 shadow-sm status-count-card status ${isUnplacedSelected ? 'selected' : ''}`}
                                style={{
                                  minWidth: isMobile ? '100px' : '110px',
                                  height: '45px',
                                  cursor: 'pointer',
                                  border: isUnplacedSelected ? '2px solid #dc3545' : '1px solid transparent',
                                  backgroundColor: isUnplacedSelected ? '#fff5f5' : 'white',
                                  flexShrink: isMobile ? 0 : 1
                                }}
                                onClick={() => {
                                  handleStatusCardClick(unplacedStatus.statusId);
                                }}
                                title="Click to view UnPlaced placements"
                              >
                                <div className="card-body p-1 text-center d-flex align-items-center justify-content-center">
                                  <div className="d-flex align-items-center">
                                    <i className="fas fa-times-circle me-1" style={{ color: '#dc3545', fontSize: '12px' }}></i>
                                    <div>
                                      <h6 className="mb-0 fw-bold" style={{ color: '#212529', fontSize: '11px' }}>UnPlaced</h6>
                                      <small style={{ color: '#6c757d', fontSize: '9px' }}>{unplacedStatus.count || 0} leads</small>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : null;
                          })()}

                          {/* Other Status Count Cards */}
                          {statusCounts
                            .filter(status => {
                              const statusNameLower = status.statusName.toLowerCase();
                              return statusNameLower !== 'placed' && statusNameLower !== 'unplaced';
                            })
                            .map((status, index) => {
                              const isSelected = selectedStatusFilter === status.statusId;
                              return (
                                <div
                                  key={status.statusId || index}
                                  className={`card border-0 shadow-sm status-count-card status ${isSelected ? 'selected' : ''}`}
                                  style={{
                                    minWidth: isMobile ? '100px' : '110px',
                                    height: '45px',
                                    cursor: 'pointer',
                                    border: isSelected ? '2px solid #007bff' : '1px solid transparent',
                                    backgroundColor: isSelected ? '#f8f9ff' : 'white',
                                    flexShrink: isMobile ? 0 : 1
                                  }}
                                  onClick={() => handleStatusCardClick(status.statusId)}
                                  title={`Click to view ${status.statusName} placements`}
                                >
                                  <div className="card-body p-1 text-center d-flex align-items-center justify-content-center">
                                    <div className="d-flex align-items-center">
                                      <i className="fas fa-tag me-1" style={{ color: '#28a745', fontSize: isMobile ? '11px' : '12px' }}></i>
                                      <div>
                                        <h6 className="mb-0 fw-bold" style={{ color: '#212529', fontSize: isMobile ? '10px' : '11px' }}>{status.statusName}</h6>
                                        <small style={{ color: '#6c757d', fontSize: isMobile ? '8px' : '9px' }}>{status.count} leads</small>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </>
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
              {/* Desktop Layout */}
              <div className="row">
                {/* Desktop Layout */}
                <div className="d-none flex-row-reverse d-md-flex justify-content-between align-items-center gap-2">
                 
                  {/* Left side - Buttons */}
                  <div style={{ display: "flex", gap: "8px" }}>
                  
                  <button 
                    className="btn btn-sm btn-outline-primary" 
                    style={{
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                    onClick={handleOpenBulkJobMode}
                    disabled={sendingBulkJobs}
                  >
                    <i className="fas fa-briefcase" style={{ fontSize: "10px" }}></i>
                    Bulk jobs
                  </button>
                  
                  </div>

                  {/* Right side - Input Fields */}
                  {showBulkJobMode && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "4px" : "8px",
                      flexWrap: isMobile ? "wrap" : "nowrap"
                    }}>
                      {/* Job Selection Dropdown */}
                      <select
                        className="form-select form-select-sm"
                        style={{
                          width: isMobile ? "100%" : "200px",
                          fontSize: isMobile ? "13px" : "12px",
                          padding: isMobile ? "6px 10px" : "4px 8px",
                          minWidth: isMobile ? "0" : "200px"
                        }}
                        value={selectedBulkJob?._id || selectedBulkJob?._job?._id || ''}
                        onChange={(e) => {
                          const jobId = e.target.value;
                          const job = companyJobs.find(j => (j._id || j._job?._id) === jobId);
                          setSelectedBulkJob(job || null);
                        }}
                      >
                        <option value="">Select Job</option>
                        {companyJobs.map((job) => (
                          <option key={job._id || job._job?._id} value={job._id || job._job?._id}>
                            {job.title || job._job?.title || 'N/A'} - {job.displayCompanyName || job.companyName || job._company?.displayCompanyName || job._company?.name || 'N/A'}
                          </option>
                        ))}
                      </select>

                      {/* Input Fields */}
                      <div style={{
                        display: "flex",
                        alignItems: "stretch",
                        border: "1px solid #dee2e6",
                        borderRadius: "4px",
                        backgroundColor: "#fff",
                        overflow: "hidden",
                        width: isMobile ? "100%" : "200px",
                        height: isMobile ? "36px" : "32px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        minWidth: isMobile ? "0" : "200px"
                      }}>
                        <input
                          type="text"
                          placeholder="No. of candidates"
                          value={bulkJobInputValue}
                          onKeyDown={(e) => {
                            if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab' && e.key !== 'Enter') {
                              e.preventDefault();
                            }
                            if (e.key === 'Enter' && bulkJobInputValue && selectedBulkJob) {
                              e.preventDefault();
                              handleBulkJobOffer();
                            }
                          }}
                          onChange={(e) => {
                            const maxValue = allLeadsForBulk?.length || 0;
                            let inputValue = e.target.value.replace(/[^0-9]/g, '');
                            
                            // Convert to number for validation
                            const numValue = parseInt(inputValue, 10);
                            
                            // Prevent values less than 1 (minimum is 1)
                            if (inputValue !== '' && (numValue < 1 || isNaN(numValue))) {
                              inputValue = '1';
                            }
                            // Prevent values greater than max (number of leads)
                            else if (inputValue !== '' && numValue > maxValue && maxValue > 0) {
                              inputValue = maxValue.toString();
                            }
                            
                            setBulkJobInputValue(inputValue);
                          }}
                          style={{
                            width: "50%",
                            border: "none",
                            borderRight: "1px solid #dee2e6",
                            outline: "none",
                            padding: isMobile ? "6px 10px" : "4px 10px",
                            fontSize: isMobile ? "13px" : "12px",
                            backgroundColor: "transparent",
                            height: "100%",
                            boxSizing: "border-box"
                          }}
                        />
                        <input
                          type="text"
                          value={allLeadsForBulk?.length || 0}
                          readOnly
                          placeholder="Total"
                          style={{
                            width: "50%",
                            border: "none",
                            outline: "none",
                            padding: isMobile ? "6px 10px" : "4px 10px",
                            fontSize: isMobile ? "13px" : "12px",
                            backgroundColor: "#f8f9fa",
                            height: "100%",
                            boxSizing: "border-box",
                            cursor: "default",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#495057"
                          }}
                        />
                      </div>

                      {/* Send Button */}
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={handleBulkJobOffer}
                        disabled={!selectedBulkJob || !bulkJobInputValue || sendingBulkJobs}
                        style={{
                          padding: isMobile ? "8px 12px" : "6px 12px",
                          fontSize: isMobile ? "12px" : "11px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          whiteSpace: "nowrap",
                          flex: isMobile ? "1 1 auto" : "0 0 auto"
                        }}
                      >
                        {sendingBulkJobs ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            {isMobile ? "Sending..." : "Sending..."}
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane" style={{ fontSize: isMobile ? "11px" : "10px" }}></i>
                            {isMobile ? "Send" : "Send"}
                          </>
                        )}
                      </button>

                      {/* Close Button */}
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setShowBulkJobMode(false);
                          setBulkJobInputValue('');
                          setSelectedBulkJob(null);
                        }}
                        style={{
                          padding: isMobile ? "8px 12px" : "6px 12px",
                          fontSize: isMobile ? "12px" : "11px",
                          fontWeight: "600",
                          flex: isMobile ? "0 0 auto" : "0 0 auto"
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}
                  
                </div>

                {/* Mobile Layout */}
                <div className="d-md-none">
                  <div className="row g-2">
                   
                      <div className="col-6">
                        <button className="btn btn-sm btn-outline-primary w-100" style={{
                          padding: "8px 6px",
                          fontSize: "10px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px"
                        }}
                        >
                          <i className="fas fa-plus" style={{ fontSize: "9px" }}></i>
                          Add Leads
                        </button>
                      </div>
                   
                  </div>
                </div>
              </div>


              {/* Loading State */}
              {loadingLeads ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading Placements...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-inbox text-muted" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                  <h5 className="mt-3 text-muted">
                    {selectedStatusFilter ? 'No placements found for selected status' : 'No Placements Found'}
                  </h5>
                  <p className="text-muted">
                    {selectedStatusFilter ? 'Try selecting a different status or add new placements.' : 'Start by adding your first Placement using the "Add Candidate" button.'}
                  </p>
                </div>
              ) : (
                <div className="row">
                  <div>
                    <div className="col-12 rounded equal-height-2 coloumn-2">
                      <div className="card px-3">
                        <div className="row" id="crm-main-row">
                          {/* Profiles List */}
                          {leads && leads.map((placement, placementIndex) => (
                            <div className={`card-content transition-col mb-2`} key={placement._id || placementIndex}>

                              {/* Profile Header Card */}
                              <div className="card border-0 shadow-sm mb-0 mt-2">
                                <div className="card-body px-1 py-0 my-2">
                                  <div className="row align-items-center justify-content-around">
                                    <div className={`${isMobile ? 'col-12' : 'col-md-7'}`}>
                                      <div className={`d-flex ${isMobile ? 'flex-column' : 'align-items-center'}`}>
                                        <div className={`d-flex align-items-center ${isMobile ? 'w-100 mb-2' : ''}`}>
                                          <div className={`form-check ${isMobile ? 'me-2' : 'me-md-3 me-sm-1 me-1'}`}>
                                            <input
                                              onChange={(e) => handleCheckboxChange(placement, e.target.checked)}
                                              checked={selectedProfiles && Array.isArray(selectedProfiles) ? selectedProfiles.includes(placement._id) : false}
                                              className="form-check-input"
                                              type="checkbox"
                                              style={isMobile ? { width: '18px', height: '18px' } : {}}
                                            />
                                          </div>
                                          <div className={`${isMobile ? 'me-2' : 'me-md-3 me-sm-1 me-1'}`}>
                                            {/* Placeholder for circular progress - can be customized for placements */}
                                            <div className="circular-progress-container" data-percent="NA">
                                              <svg width={isMobile ? "35" : "40"} height={isMobile ? "35" : "40"}>
                                                <circle className="circle-bg" cx={isMobile ? "17.5" : "20"} cy={isMobile ? "17.5" : "20"} r={isMobile ? "14" : "16"}></circle>
                                                <circle className="circle-progress" cx={isMobile ? "17.5" : "20"} cy={isMobile ? "17.5" : "20"} r={isMobile ? "14" : "16"}></circle>
                                              </svg>
                                              <div className="progress-text"></div>
                                            </div>
                                          </div>
                                          <div className={`d-flex flex-column ${isMobile ? 'flex-grow-1' : ''}`} style={isMobile ? { minWidth: 0 } : {}}>
                                            <h6 className={`mb-0 fw-bold ${isMobile ? 'text-truncate' : ''}`} style={isMobile ? { fontSize: '14px' } : {}}>{placement._candidate?.name || placement._student?.name || placement.studentName || 'Student Name'}</h6>
                                            <small className={`text-muted ${isMobile ? 'text-truncate' : ''}`} style={isMobile ? { fontSize: '11px' } : {}}>{placement._candidate?.email || placement._student?.email || placement.studentEmail || 'Email'}</small>
                                            <small className={`text-muted ${isMobile ? 'text-truncate' : ''}`} style={isMobile ? { fontSize: '11px' } : {}}>{placement._candidate?.mobile || placement._student?.mobile || placement.studentMobile || 'Mobile Number'}</small>
                                          </div>
                                          <div className={`whatsappbutton ${isMobile ? 'ms-auto' : ''}`}>
                                            <button className="btn btn-outline-primary btn-sm border-0" title="Call" style={{ fontSize: isMobile ? '18px' : '20px', padding: isMobile ? '4px 8px' : '' }}>
                                              <a href={`tel:${placement._candidate?.mobile || placement._student?.mobile || placement.studentMobile || placement.contactNumber}`} target="_blank" rel="noopener noreferrer">
                                                <i className="fas fa-phone"></i>
                                              </a>
                                            </button>
                                            <a
                                              className="btn btn-outline-success btn-sm border-0"
                                              onClick={() => openWhatsappPanel(placement)}
                                              style={{ fontSize: isMobile ? '18px' : '20px', cursor: 'pointer', padding: isMobile ? '4px 8px' : '' }}
                                              title="WhatsApp"
                                            >
                                              <i className="fab fa-whatsapp"></i>
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className={`${isMobile ? 'col-12 mt-2' : 'col-md-3 mt-3'}`}>
                                      <div className={`d-flex ${isMobile ? 'flex-column' : 'gap-2'}`}>
                                        <div className={isMobile ? 'w-100' : 'flex-grow-1'}>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm m-0"
                                            style={{
                                              cursor: 'pointer',
                                              border: '1px solid #ddd',
                                              borderRadius: isMobile ? '5px 5px 0px 0px' : '0px',
                                              borderTopRightRadius: '5px',
                                              borderTopLeftRadius: '5px',
                                              width: isMobile ? '100%' : '145px',
                                              height: isMobile ? '32px' : '20px',
                                              fontSize: isMobile ? '12px' : '10px',
                                              padding: isMobile ? '6px 10px' : '2px 5px'
                                            }}
                                            value={placement.status?.title || 'No Status'}
                                            readOnly
                                            onClick={() => {
                                              openEditPanel(placement, 'StatusChange');
                                            }}
                                          />
                                          <input
                                            type="text"
                                            className="form-control form-control-sm m-0"
                                            value={(() => {

                                              if (placement.subStatus && placement.status) {

                                                if (placement.status.substatuses && Array.isArray(placement.status.substatuses)) {
                                                  const subStatus = placement.status.substatuses.find(
                                                    s => s._id.toString() === placement.subStatus.toString()
                                                  );
                                                  if (subStatus) return subStatus.title;
                                                }

                                                if (statuses && statuses.length > 0) {
                                                  const statusId = placement.status._id || placement.status;
                                                  const statusObj = statuses.find(s => s._id === statusId);
                                                  if (statusObj && statusObj.substatuses && Array.isArray(statusObj.substatuses)) {
                                                    const subStatus = statusObj.substatuses.find(
                                                      s => s._id.toString() === placement.subStatus.toString()
                                                    );
                                                    if (subStatus) return subStatus.title;
                                                  }
                                                }

                                                if (typeof placement.subStatus === 'object' && placement.subStatus.title) {
                                                  return placement.subStatus.title;
                                                }
                                              }
                                              return '';
                                            })()}
                                            style={{
                                              cursor: 'pointer',
                                              border: '1px solid #ddd',
                                              borderRadius: isMobile ? '0px 0px 5px 5px' : '0px',
                                              borderBottomRightRadius: '5px',
                                              borderBottomLeftRadius: '5px',
                                              width: isMobile ? '100%' : '145px',
                                              height: isMobile ? '32px' : '20px',
                                              fontSize: isMobile ? '12px' : '10px',
                                              padding: isMobile ? '6px 10px' : '2px 5px'
                                            }}
                                            readOnly
                                            onClick={() => {
                                              openEditPanel(placement, 'StatusChange');
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="col-md-1 text-end d-md-none d-sm-block d-block">
                                      <div className="btn-group">
                                        {/* Three-dot button for mobile - Opens Modal */}
                                        <button
                                          className="btn btn-sm btn-outline-secondary border-0"
                                          onClick={() => toggleLeadDetails(placement._id || placementIndex)}
                                          aria-label="Options"
                                        >
                                          <i className="fas fa-ellipsis-v"></i>
                                        </button>

                                        {/* Expand/Collapse button */}
                                        <button
                                          className="btn btn-sm btn-outline-secondary border-0"
                                          onClick={() => toggleLeadDetailsExpand(placement._id || placementIndex)}
                                        >
                                          {leadDetailsVisible === (placement._id || placementIndex) ? (
                                            <i className="fas fa-chevron-up"></i>
                                          ) : (
                                            <i className="fas fa-chevron-down"></i>
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    <div className="col-md-1 text-end d-md-block d-sm-none d-none">
                                      <div className="btn-group">

                                        <div style={{ position: "relative", display: "inline-block" }}>
                                          <button
                                            className="btn btn-sm btn-outline-secondary border-0"
                                            onClick={() => toggleLeadDetails(placement._id || placementIndex)}
                                            aria-label="Options"
                                          >
                                            <i className="fas fa-ellipsis-v"></i>
                                          </button>

                                          {/* Overlay for click outside */}
                                          {showPopup === (placement._id || placementIndex) && (
                                            <div
                                              onClick={() => setShowPopup(null)}
                                              style={{
                                                position: "fixed",
                                                top: 0,
                                                left: 0,
                                                width: "100vw",
                                                height: "100vh",
                                                backgroundColor: "transparent",
                                                zIndex: 8,
                                              }}
                                            ></div>
                                          )}

                                          <div
                                            style={{
                                              position: "absolute",
                                              top: "28px",
                                              right: "-100px",
                                              width: "170px",
                                              backgroundColor: "white",
                                              border: "1px solid #ddd",
                                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                              borderRadius: "4px",
                                              padding: "8px 0",
                                              zIndex: 9,
                                              transform: showPopup === (placement._id || placementIndex) ? "translateX(-70px)" : "translateX(100%)",
                                              transition: "transform 0.3s ease-in-out",
                                              pointerEvents: showPopup === (placement._id || placementIndex) ? "auto" : "none",
                                              display: showPopup === (placement._id || placementIndex) ? "block" : "none"
                                            }}
                                          >
                                            <button
                                              className="dropdown-item"
                                              style={{
                                                width: "100%",
                                                padding: "8px 16px",
                                                border: "none",
                                                background: "none",
                                                textAlign: "left",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                                fontWeight: "600"
                                              }}
                                              onClick={() => {
                                                openEditPanel(placement, 'SetFollowup');
                                                setShowPopup(null);
                                              }}
                                            >
                                              Set Followup
                                            </button>

                                            <button
                                              className="dropdown-item"
                                              style={{
                                                width: "100%",
                                                padding: "8px 16px",
                                                border: "none",
                                                background: "none",
                                                textAlign: "left",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                                fontWeight: "600"
                                              }}
                                              onClick={() => {
                                                openleadHistoryPanel(placement);
                                                setShowPopup(null);
                                              }}
                                            >
                                              History List
                                            </button>
                                          </div>
                                        </div>

                                        <button
                                          className="btn btn-sm btn-outline-secondary border-0"
                                          onClick={() => toggleLeadDetailsExpand(placement._id || placementIndex)}
                                        >
                                          {leadDetailsVisible === (placement._id || placementIndex) ? (
                                            <i className="fas fa-chevron-up"></i>
                                          ) : (
                                            <i className="fas fa-chevron-down"></i>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Tab Navigation and Content Card */}
                              <div className="card border-0 shadow-sm mb-4">
                                <div className="card-header bg-white border-bottom-0 py-3 mb-3">
                                  <ul
                                    className="nav nav-pills nav-pills-sm"
                                    style={{
                                      display: 'flex',
                                      flexWrap: isMobile ? 'nowrap' : 'wrap',
                                      overflowX: isMobile ? 'auto' : 'visible',
                                      overflowY: 'hidden',
                                      WebkitOverflowScrolling: 'touch',
                                      scrollbarWidth: 'none',
                                      msOverflowStyle: 'none',
                                      gap: '8px',
                                      paddingBottom: isMobile ? '8px' : '0'
                                    }}
                                  >
                                    {tabs.map((tab, tabIndex) => (
                                      <li
                                        className="nav-item"
                                        key={tabIndex}
                                        style={{
                                          flexShrink: isMobile ? 0 : 1,
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        <button
                                          className={`nav-link ${(activeTab[placement._id || placementIndex] || 0) === tabIndex ? 'active' : ''}`}
                                          onClick={() => handleTabClick(placement._id || placementIndex, tabIndex, placement)}
                                          style={{
                                            minWidth: isMobile ? 'auto' : 'unset',
                                            padding: isMobile ? '8px 16px' : '0.5rem 1rem',
                                            fontSize: isMobile ? '13px' : '14px',
                                            borderRadius: '8px',
                                            whiteSpace: 'nowrap'
                                          }}
                                        >
                                          {tab}
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                {leadDetailsVisible === (placement._id || placementIndex) && (
                                  <div className="tab-content">

                                    {/* Lead Details Tab */}
                                    {(activeTab[placement._id || placementIndex] || 0) === 0 && (
                                      <div className="tab-pane active" id="lead-details">

                                        {/* Your lead details content here */}
                                        <div className="scrollable-container mobile-scrollable">
                                          <div className="scrollable-content">
                                            <div className="info-card">
                                              <div className="info-group">
                                                <div className="info-label">LEAD AGE</div>
                                                <div className="info-value">{placement.createdAt ?
                                                  Math.floor((new Date() - new Date(placement.createdAt)) / (1000 * 60 * 60 * 24)) + ' Days'
                                                  : 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">PROJECT</div>
                                                <div className="info-value">{placement.projectName || placement.project?.name || 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">NEXT ACTION DATE</div>
                                                <div className="info-value">
                                                  {placement.followup?.followupDate ? (() => {
                                                    const dateObj = new Date(placement.followup?.followupDate);
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
                                                  })() : 'N/A'}
                                                </div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">LEAD MODIFICATION BY</div>
                                                <div className="info-value">{placement.logs?.length ? placement.logs[placement.logs.length - 1]?.user?.name || placement.updatedBy?.name || 'N/A' : placement.updatedBy?.name || 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="info-card">
                                              <div className="info-group">
                                                <div className="info-label">STATE</div>
                                                <div className="info-value">{placement.state || (placement.location ? placement.location.split(',')[placement.location.split(',').length - 1]?.trim() : null) || 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">Sector</div>
                                                <div className="info-value">{placement.sector || placement._course?.sectors || 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">LEAD CREATION DATE</div>
                                                <div className="info-value">
                                                  {placement.createdAt ? (() => {
                                                    const dateObj = new Date(placement.createdAt);
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
                                                  })() : 'N/A'}
                                                </div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">Counsellor Name</div>
                                                <div className="info-value">{placement.leadAssignment && placement.leadAssignment.length > 0 ? placement.leadAssignment[placement.leadAssignment.length - 1]?.counsellorName || placement.counsellor?.name || 'N/A' : placement.counsellor?.name || 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="info-card">
                                              <div className="info-group">
                                                <div className="info-label">CITY</div>
                                                <div className="info-value">{placement.city || (placement.location ? placement.location.split(',')[0]?.trim() : null) || 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">COURSE / JOB NAME</div>
                                                <div className="info-value">{placement.jobName || placement.courseName || placement._course?.name || 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">LEAD MODIFICATION DATE</div>
                                                <div className="info-value">
                                                  {placement.updatedAt ? (() => {
                                                    const dateObj = new Date(placement.updatedAt);
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
                                                  })() : 'N/A'}
                                                </div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">LEAD OWNER</div>
                                                <div className="info-value">{placement.leadOwner?.join ? placement.leadOwner.join(', ') : (placement.leadOwner || placement.addedBy?.name || 'N/A')}</div>
                                              </div>
                                            </div>

                                            <div className="info-card">
                                              <div className="info-group">
                                                <div className="info-label">TYPE OF PROJECT</div>
                                                <div className="info-value">{placement.typeOfProject || placement._course?.typeOfProject || 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">BRANCH NAME</div>
                                                <div className="info-value">{placement.branch?.name || placement.center?.name || placement._center?.name || 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">Remarks</div>
                                                <div className="info-value">{placement.remark || placement.remarks || 'N/A'}</div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="scroll-arrow scroll-left d-md-none" onClick={scrollLeft}>&lt;</div>
                                        <div className="scroll-arrow scroll-right d-md-none" onClick={scrollRight}>&gt;</div>

                                        <div className="desktop-view">
                                          <div className="row">
                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">LEAD AGE</div>
                                                <div className="info-value">{placement.createdAt ?
                                                  Math.floor((new Date() - new Date(placement.createdAt)) / (1000 * 60 * 60 * 24)) + ' Days'
                                                  : 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">STATE</div>
                                                <div className="info-value">{placement.state || (placement.location ? placement.location.split(',')[placement.location.split(',').length - 1]?.trim() : null) || 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">CITY</div>
                                                <div className="info-value">{placement.city || (placement.location ? placement.location.split(',')[0]?.trim() : null) || 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">TYPE OF PROJECT</div>
                                                <div className="info-value">{placement.typeOfProject || placement._course?.typeOfProject || 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">PROJECT</div>
                                                <div className="info-value">{placement.projectName || placement.project?.name || 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">Sector</div>
                                                <div className="info-value">{placement.sector || placement._course?.sectors || 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">COURSE / JOB NAME</div>
                                                <div className="info-value">{placement.jobName || placement.courseName || placement._course?.name || 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">BRANCH NAME</div>
                                                <div className="info-value">{placement.branch?.name || placement.center?.name || placement._center?.name || 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">NEXT ACTION DATE</div>
                                                <div className="info-value">
                                                  {placement.followup?.followupDate ? (() => {
                                                    const dateObj = new Date(placement.followup?.followupDate);
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
                                                  })() : 'N/A'}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">LEAD CREATION DATE</div>
                                                <div className="info-value">
                                                  {placement.createdAt ? (() => {
                                                    const dateObj = new Date(placement.createdAt);
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
                                                  })() : 'N/A'}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">LEAD MODIFICATION DATE</div>
                                                <div className="info-value">
                                                  {placement.updatedAt ? (() => {
                                                    const dateObj = new Date(placement.updatedAt);
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
                                                  })() : 'N/A'}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">Remarks</div>
                                                <div className="info-value">{placement.remark || placement.remarks || 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">LEAD MODIFICATION BY</div>
                                                <div className="info-value">{placement.logs?.length ? placement.logs[placement.logs.length - 1]?.user?.name || placement.updatedBy?.name || placement.addedBy?.name || 'N/A' : placement.updatedBy?.name || placement.addedBy?.name || 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">Counsellor Name</div>
                                                <div className="info-value">{placement.leadAssignment && placement.leadAssignment.length > 0 ? placement.leadAssignment[placement.leadAssignment.length - 1]?.counsellorName || placement.counsellor?.name || 'N/A' : placement.counsellor?.name || 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">LEAD OWNER</div>
                                                <div className="info-value">{placement.leadOwner?.join ? placement.leadOwner.join(', ') : (placement.leadOwner || placement.addedBy?.name || 'N/A')}</div>
                                              </div>
                                            </div>

                                            {/* <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">COMPANY NAME</div>
                                                <div className="info-value">{placement.companyName || 'N/A'}</div>
                                              </div>
                                            </div> */}

                                            {/* <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">HR NAME</div>
                                                <div className="info-value">{placement.employerName || 'N/A'}</div>
                                              </div>
                                            </div> */}

                                            {/* <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">CONTACT NUMBER</div>
                                                <div className="info-value">{placement.contactNumber || 'N/A'}</div>
                                              </div>
                                            </div> */}

                                            {/* <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">DATE OF JOINING</div>
                                                <div className="info-value">
                                                  {placement.dateOfJoining ? (() => {
                                                    const dateObj = new Date(placement.dateOfJoining);
                                                    const datePart = dateObj.toLocaleDateString('en-GB', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric',
                                                    }).replace(/ /g, '-');
                                                    return datePart;
                                                  })() : 'N/A'}
                                                </div>
                                              </div>
                                            </div> */}

                                            {/* <div className="col-xl-3 col-3">
                                              <div className="info-group">
                                                <div className="info-label">LOCATION</div>
                                                <div className="info-value">{placement.location || 'N/A'}</div>
                                              </div>
                                            </div> */}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Profile Tab */}
                                    {(activeTab[placement._id || placementIndex] || 0) === 1 && (
                                      <div className="tab-pane active" id="profile">
                                        <div className="resume-preview-body">
                                          <div id="resume-download" className="resume-document">
                                            <div className="resume-document-header">
                                              <div className="resume-profile-section">
                                                {(placement._candidate?.personalInfo?.image || placement._student?.personalInfo?.image) ? (
                                                  <img
                                                    src={placement._candidate?.personalInfo?.image || placement._student?.personalInfo?.image}
                                                    alt="Profile"
                                                    className="resume-profile-image"
                                                  />
                                                ) : (
                                                  <div className="resume-profile-placeholder">
                                                    <i className="bi bi-person-circle"></i>
                                                  </div>
                                                )}

                                                <div className="resume-header-content">
                                                  <h1 className="resume-name">
                                                    {placement._candidate?.name || placement._student?.name || placement.studentName || 'Your Name'}
                                                  </h1>
                                                  <p className="resume-title">
                                                    {placement._candidate?.personalInfo?.professionalTitle || placement._student?.personalInfo?.professionalTitle || 'Professional Title'}
                                                  </p>
                                                  <p className="resume-title">
                                                    {placement._candidate?.sex || placement._student?.sex || 'Sex'}
                                                  </p>

                                                  <div className="resume-contact-details">
                                                    <div className="resume-contact-item">
                                                      <i className="bi bi-telephone-fill"></i>
                                                      <span>{placement._candidate?.mobile || placement._student?.mobile || placement.studentMobile || 'N/A'}</span>
                                                    </div>
                                                    <div className="resume-contact-item">
                                                      <i className="bi bi-envelope-fill"></i>
                                                      <span>{placement._candidate?.email || placement._student?.email || placement.studentEmail || 'N/A'}</span>
                                                    </div>
                                                    {(placement._candidate?.dob || placement._student?.dob) && (
                                                      <div className="resume-contact-item">
                                                        <i className="bi bi-calendar-heart-fill"></i>
                                                        {new Date(placement._candidate?.dob || placement._student?.dob).toLocaleDateString('en-IN', {
                                                          day: '2-digit',
                                                          month: 'long',
                                                          year: 'numeric'
                                                        })}
                                                      </div>
                                                    )}
                                                    {(placement._candidate?.personalInfo?.currentAddress?.city || placement._student?.personalInfo?.currentAddress?.city) && (
                                                      <div className="resume-contact-item">
                                                        <i className="bi bi-geo-alt-fill"></i>
                                                        <span>Current: {placement._candidate?.personalInfo?.currentAddress?.fullAddress || placement._student?.personalInfo?.currentAddress?.fullAddress}</span>
                                                      </div>
                                                    )}
                                                    {(placement._candidate?.personalInfo?.permanentAddress?.city || placement._student?.personalInfo?.permanentAddress?.city) && (
                                                      <div className="resume-contact-item">
                                                        <i className="bi bi-house-fill"></i>
                                                        <span>Permanent: {placement._candidate?.personalInfo?.permanentAddress?.fullAddress || placement._student?.personalInfo?.permanentAddress?.fullAddress}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="resume-summary">
                                                <h2 className="resume-section-title">Professional Summary</h2>
                                                <p>{placement._candidate?.personalInfo?.summary || placement._student?.personalInfo?.summary || 'No summary provided'}</p>
                                              </div>
                                            </div>

                                            <div className="resume-document-body">
                                              <div className="resume-column resume-left-column">
                                                {(placement._candidate?.isExperienced === false || placement._student?.isExperienced === false) ? (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">Work Experience</h2>
                                                    <div className="resume-experience-item">
                                                      <div className="resume-item-header">
                                                        <h3 className="resume-item-title">Fresher</h3>
                                                      </div>
                                                      <div className="resume-item-content">
                                                        <p>Looking for opportunities to start my career</p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  (placement._candidate?.experiences?.length > 0 || placement._student?.experiences?.length > 0) && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">Work Experience</h2>
                                                      {(placement._candidate?.experiences || placement._student?.experiences || []).map((exp, index) => (
                                                        <div className="resume-experience-item" key={`resume-exp-${index}`}>
                                                          <div className="resume-item-header">
                                                            {exp.jobTitle && (
                                                              <h3 className="resume-item-title">{exp.jobTitle}</h3>
                                                            )}
                                                            {exp.companyName && (
                                                              <p className="resume-item-subtitle">{exp.companyName}</p>
                                                            )}
                                                            {(exp.from || exp.to || exp.currentlyWorking) && (
                                                              <p className="resume-item-period">
                                                                {exp.from ? new Date(exp.from).toLocaleDateString('en-IN', {
                                                                  year: 'numeric',
                                                                  month: 'short',
                                                                }) : 'Start Date'}
                                                                {" - "}
                                                                {exp.currentlyWorking ? 'Present' :
                                                                  exp.to ? new Date(exp.to).toLocaleDateString('en-IN', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                  }) : 'End Date'}
                                                              </p>
                                                            )}
                                                          </div>
                                                          {exp.jobDescription && (
                                                            <div className="resume-item-content">
                                                              <p>{exp.jobDescription}</p>
                                                            </div>
                                                          )}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )
                                                )}

                                                {(placement._candidate?.qualifications?.length > 0 || placement._student?.qualifications?.length > 0) && (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">Education</h2>
                                                    {(placement._candidate?.qualifications || placement._student?.qualifications || []).map((edu, index) => (
                                                      <div className="resume-education-item" key={`resume-edu-${index}`}>
                                                        <div className="resume-item-header">
                                                          {edu.education && (
                                                            <h3 className="resume-item-title">{edu.education}</h3>
                                                          )}
                                                          {edu.course && (
                                                            <h3 className="resume-item-title">{edu.course}</h3>
                                                          )}
                                                          {edu.universityName && (
                                                            <p className="resume-item-subtitle">{edu.universityName}</p>
                                                          )}
                                                          {edu.schoolName && (
                                                            <p className="resume-item-subtitle">{edu.schoolName}</p>
                                                          )}
                                                          {edu.collegeName && (
                                                            <p className="resume-item-subtitle">{edu.collegeName}</p>
                                                          )}
                                                          {edu.passingYear && (
                                                            <p className="resume-item-period">{edu.passingYear}</p>
                                                          )}
                                                        </div>
                                                        <div className="resume-item-content">
                                                          {edu.marks && <p>Marks: {edu.marks}%</p>}
                                                          {edu.specialization && <p>Specialization: {edu.specialization}</p>}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>

                                              <div className="resume-column resume-right-column">
                                                {(placement._candidate?.personalInfo?.skills?.length > 0 || placement._student?.personalInfo?.skills?.length > 0) && (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">Skills</h2>
                                                    <div className="resume-skills-list">
                                                      {(placement._candidate?.personalInfo?.skills || placement._student?.personalInfo?.skills || []).map((skill, index) => (
                                                        <div className="resume-skill-item" key={`resume-skill-${index}`}>
                                                          <div className="resume-skill-name">{skill?.skillName || 'Skill'}</div>
                                                          {skill?.skillPercent && (
                                                            <div className="resume-skill-bar-container">
                                                              <div
                                                                className="resume-skill-bar"
                                                                style={{ width: `${skill?.skillPercent || 0}%` }}
                                                              ></div>
                                                              <span className="resume-skill-percent">{skill?.skillPercent || 0}%</span>
                                                            </div>
                                                          )}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}

                                                {(placement._candidate?.personalInfo?.languages?.length > 0 || placement._student?.personalInfo?.languages?.length > 0) && (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">Languages</h2>
                                                    <div className="resume-languages-list">
                                                      {(placement._candidate?.personalInfo?.languages || placement._student?.personalInfo?.languages || []).map((lang, index) => (
                                                        <div className="resume-language-item" key={`resume-lang-${index}`}>
                                                          <div className="resume-language-name">{lang.name || lang.lname || 'Language'}</div>
                                                          {lang.level && (
                                                            <div className="resume-language-level">
                                                              {[1, 2, 3, 4, 5].map(dot => (
                                                                <span
                                                                  key={`resume-lang-dot-${index}-${dot}`}
                                                                  className={`resume-level-dot ${dot <= (lang.level || 0) ? 'filled' : ''}`}
                                                                ></span>
                                                              ))}
                                                            </div>
                                                          )}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}

                                                {(placement._candidate?.personalInfo?.certifications?.length > 0 || placement._student?.personalInfo?.certifications?.length > 0) && (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">Certifications</h2>
                                                    <ul className="resume-certifications-list">
                                                      {(placement._candidate?.personalInfo?.certifications || placement._student?.personalInfo?.certifications || []).map((cert, index) => (
                                                        <li key={`resume-cert-${index}`} className="resume-certification-item">
                                                          <strong>{cert.certificateName || cert.name}</strong>
                                                          {cert.orgName && (
                                                            <span className="resume-cert-org"> - {cert.orgName}</span>
                                                          )}
                                                          {(cert.month || cert.year) && (
                                                            <span className="resume-cert-date">
                                                              {cert.month && cert.year ?
                                                                ` (${cert.month}/${cert.year})` :
                                                                cert.month ?
                                                                  ` (${cert.month})` :
                                                                  cert.year ?
                                                                    ` (${cert.year})` :
                                                                    ''}
                                                            </span>
                                                          )}
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </div>
                                                )}

                                                {(placement._candidate?.personalInfo?.projects?.length > 0 || placement._student?.personalInfo?.projects?.length > 0) && (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">Projects</h2>
                                                    {(placement._candidate?.personalInfo?.projects || placement._student?.personalInfo?.projects || []).map((proj, index) => (
                                                      <div className="resume-project-item" key={`resume-proj-${index}`}>
                                                        <div className="resume-item-header">
                                                          <h3 className="resume-project-title">
                                                            {proj.projectName || 'Project'}
                                                            {proj.year && <span className="resume-project-year"> ({proj.year})</span>}
                                                          </h3>
                                                        </div>
                                                        {proj.description && (
                                                          <div className="resume-item-content">
                                                            <p>{proj.description}</p>
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}

                                                {(placement._candidate?.personalInfo?.interest?.length > 0 || placement._student?.personalInfo?.interest?.length > 0) && (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">Interests</h2>
                                                    <div className="resume-interests-tags">
                                                      {(placement._candidate?.personalInfo?.interest || placement._student?.personalInfo?.interest || []).map((interest, index) => (
                                                        <span className="resume-interest-tag" key={`resume-interest-${index}`}>
                                                          {interest}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            {(placement._candidate?.personalInfo?.declaration?.text || placement._student?.personalInfo?.declaration?.text) && (
                                              <div className="resume-declaration">
                                                <h2 className="resume-section-title">Declaration</h2>
                                                <p>{placement._candidate?.personalInfo?.declaration?.text || placement._student?.personalInfo?.declaration?.text}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Job History Tab */}
                                    {(activeTab[placement._id || placementIndex] || 0) === 2 && (
                                      <div className="tab-pane active" id="job-history">
                                        <div className="section-card">
                                          <div className="table-responsive">
                                            <table className="table table-hover table-bordered job-history-table">
                                              <thead className="table-light">
                                                <tr>
                                                  <th>S.No</th>
                                                  <th>Company Name</th>
                                                  <th>Position</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {jobHistory?.length > 0 ? (
                                                  jobHistory?.map((job, index) => (
                                                    <tr key={index}>
                                                      <td>{index + 1}</td>
                                                      <td>{job._job?.displayCompanyName || 'N/A'}</td>
                                                      <td>{job._job?.title || 'N/A'}</td>
                                                    </tr>
                                                  ))
                                                ) : (
                                                  <tr>
                                                    <td colSpan={3} className="text-center">No job history available</td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Course History Tab */}
                                    {(activeTab[placement._id || placementIndex] || 0) === 3 && (
                                      <div className="tab-pane active" id="course-history">
                                        <div className="section-card">
                                          <div className="table-responsive">
                                            <table className="table table-hover table-bordered course-history-table">
                                              <thead className="table-light">
                                                <tr>
                                                  <th>S.No</th>
                                                  <th>Applied Date</th>
                                                  <th>Course Name</th>
                                                  <th>Lead Added By</th>
                                                  <th>Counsellor</th>
                                                  <th>Status</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {courseHistory?.length > 0 ? (
                                                  courseHistory?.map((course, index) => (
                                                    <tr key={index}>
                                                      <td>{index + 1}</td>
                                                      <td>{new Date(course.createdAt).toLocaleDateString('en-GB')}</td>
                                                      <td>{course._course?.name || 'N/A'}</td>
                                                      <td>{course.registeredBy?.name || 'Self Registered'}</td>
                                                      <td>{course.month || ''} {course.year || ''}</td>
                                                      <td><span className="text-success">{course._leadStatus?.title || '-'}</span></td>
                                                    </tr>
                                                  ))
                                                ) : (
                                                  <tr>
                                                    <td colSpan={6} className="text-center">No course history available</td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Company Jobs Tab */}
                                    {(activeTab[placement._id || placementIndex] || 0) === 5 && (
                                      <div className="tab-pane active" id="company-jobs">
                                        <div className="section-card">
                                          <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5 className="mb-0">
                                              Company Jobs
                                            </h5>

                                          </div>
                                          {loadingCompanyJobs ? (
                                            <div className="text-center py-5">
                                              <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                              </div>
                                              <p className="mt-3 text-muted">Loading company jobs...</p>
                                            </div>
                                          ) : companyJobs?.length > 0 ? (
                                            <div className="table-responsive company-jobs-table-wrapper">
                                              <table className="table table-hover table-bordered company-jobs-table">
                                                <thead className="table-light company-jobs-table-header">
                                                  <tr>
                                                    <th>S.No</th>
                                                    <th>Company Name</th>
                                                    <th>Designation</th>
                                                    <th>Qualification</th>
                                                    <th>Industry</th>
                                                    <th>State</th>
                                                    <th>City</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {companyJobs.map((job, index) => (
                                                    <tr key={job._id || index}>
                                                      <td>{index + 1}</td>
                                                      <td>
                                                        <div className="fw-medium">
                                                          {job.displayCompanyName ||
                                                            job.companyName ||
                                                            job._company?.displayCompanyName ||
                                                            job._company?.name ||
                                                            'N/A'}
                                                        </div>
                                                      </td>
                                                      <td>
                                                        <div className="fw-medium text-capitalize">
                                                          {job.title || job._job?.title || 'N/A'}
                                                        </div>
                                                      </td>
                                                      <td>{job._qualification?.name || 'N/A'}</td>
                                                      <td>{job._industry?.name || 'N/A'}</td>
                                                      <td>{job.state?.name || 'N/A'}</td>
                                                      <td>{job.city?.name || 'N/A'}</td>
                                                      <td>
                                                        {(() => {
                                                          const jobOffer = findJobOffer(placement, job);
                                                          const response = jobOffer?.candidateResponse;
                                                          
                                                          if (response === 'accepted') {
                                                            return (
                                                              <span className="badge bg-success" style={{ fontSize: '11px' }}>
                                                                <i className="fas fa-check-circle me-1"></i> Accepted
                                                              </span>
                                                            );
                                                          } else if (response === 'rejected') {
                                                            return (
                                                              <span className="badge bg-danger" style={{ fontSize: '11px' }}>
                                                                <i className="fas fa-times-circle me-1"></i> Rejected
                                                              </span>
                                                            );
                                                          } else {
                                                            return (
                                                              <span className="badge bg-secondary" style={{ fontSize: '11px' }}>
                                                                <i className="fas fa-clock me-1"></i> Pending
                                                              </span>
                                                            );
                                                          }
                                                        })()}
                                                      </td>
                                                      <td>
                                                        <div className="d-flex gap-2">
                                                          <button
                                                            className="btn btn-sm btn-primary"
                                                            title="Send job offer to candidate"
                                                            onClick={() => handleOfferJob(placement, job)}
                                                            style={{ whiteSpace: 'nowrap' }}
                                                            disabled={
                                                              (offeringJob && selectedPlacementForJob?._id === placement._id && (selectedJobForOffer?._id === job._id || selectedJobForOffer?._id === job._job?._id)) ||
                                                              sentJobOffers.has(`${placement._id}_${job._id || job._job?._id}`) ||
                                                              (() => {
                                                                const existingOffer = findJobOffer(placement, job);
                                                                return existingOffer && (existingOffer.status === 'offered' || existingOffer.status === 'active');
                                                              })()
                                                            }
                                                          >
                                                            {offeringJob && selectedPlacementForJob?._id === placement._id && (selectedJobForOffer?._id === job._id || selectedJobForOffer?._id === job._job?._id) ? (
                                                              <>
                                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                Sending...
                                                              </>
                                                            ) : (sentJobOffers.has(`${placement._id}_${job._id || job._job?._id}`) || (() => {
                                                              const existingOffer = findJobOffer(placement, job);
                                                              return existingOffer && (existingOffer.status === 'offered' || existingOffer.status === 'active');
                                                            })()) ? (
                                                              <>
                                                                <i className="fas fa-check me-1"></i> Sent 
                                                              </>
                                                            ) : (
                                                              <>
                                                                <i className="fas fa-paper-plane me-1"></i> Send Job
                                                              </>
                                                            )}
                                                          </button>
                                                          {/* WhatsApp Icon Button */}
                                                          <button
                                                            className="btn btn-sm btn-success"
                                                            title="Open WhatsApp chat"
                                                            onClick={() => {
                                                              const mobileNumber = placement?._candidate?.mobile || placement?._student?.mobile || placement?.studentMobile || placement?.contactNumber;
                                                              if (mobileNumber) {
                                                                const cleanNumber = mobileNumber.replace(/[\s\-\(\)]/g, '');
                                                                const whatsappNumber = cleanNumber.startsWith('91') ? cleanNumber : (cleanNumber.startsWith('+91') ? cleanNumber.substring(1) : `91${cleanNumber}`);
                                                                window.open(`https://wa.me/${whatsappNumber}`, '_blank');
                                                              } else {
                                                                alert('Mobile number not found for this candidate');
                                                              }
                                                            }}
                                                          >
                                                            <i className="fab fa-whatsapp"></i>
                                                          </button>
                                                          {/* Email Icon Button */}
                                                          <button
                                                            className="btn btn-sm btn-info"
                                                            title="Send email"
                                                            onClick={() => {
                                                              const email = placement?._candidate?.email || placement?._student?.email || placement?.studentEmail;
                                                              if (email) {
                                                                window.location.href = `mailto:${email}`;
                                                              } else {
                                                                alert('Email not found for this candidate');
                                                              }
                                                            }}
                                                          >
                                                            <i className="fas fa-envelope"></i>
                                                          </button>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          ) : (
                                            <div className="text-center py-5">
                                              <div className="text-muted">
                                                <i className="fas fa-briefcase fa-3x mb-3" style={{ opacity: 0.3 }}></i>
                                                <h5>No Jobs Found</h5>
                                                <p>No jobs available at the moment. Please check back later.</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Documents Tab */}
                                    {(activeTab[placement._id || placementIndex] || 0) === 4 && (
                                      <div className="tab-pane active" id="documents">
                                        {(() => {
                                          const documentsToDisplay = placement.uploadedDocs || [];
                                          const docCounts = getDocumentCounts(documentsToDisplay);
                                          const totalRequired = docCounts.totalRequired || 0;

                                          // If no documents are required, show a message
                                          if (totalRequired === 0) {
                                            return (
                                              <div className="col-12 text-center py-5">
                                                <div className="text-muted">
                                                  <i className="fas fa-file-check fa-3x mb-3 text-success"></i>
                                                  <h5 className="text-success">No Documents Required</h5>
                                                  <p>This placement does not require any document verification.</p>
                                                </div>
                                              </div>
                                            );
                                          }

                                          // If documents are required, show the full interface
                                          return (
                                            <div className="enhanced-documents-panel">
                                              {/* Enhanced Stats Grid */}
                                              <div className="stats-grid" style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                                gap: '15px',
                                                marginBottom: '20px'
                                              }}>
                                                <div className="stat-card total-docs" style={{
                                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                  color: 'white',
                                                  padding: '20px',
                                                  borderRadius: '12px',
                                                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                                }}>
                                                  <div className="stat-icon d-md-block d-sm-none d-none">
                                                    <i className="fas fa-file-alt"></i>
                                                  </div>
                                                  <div className="stat-info">
                                                    <h4 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{docCounts.totalRequired || 0}</h4>
                                                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Total Required</p>
                                                  </div>
                                                </div>

                                                <div className="stat-card uploaded-docs" style={{
                                                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                                  color: 'white',
                                                  padding: '20px',
                                                  borderRadius: '12px',
                                                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                                }}>
                                                  <div className="stat-icon d-md-block d-sm-none d-none">
                                                    <i className="fas fa-cloud-upload-alt"></i>
                                                  </div>
                                                  <div className="stat-info">
                                                    <h4 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{docCounts.uploadedCount || 0}</h4>
                                                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Uploaded</p>
                                                  </div>
                                                </div>

                                                <div className="stat-card pending-docs" style={{
                                                  background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                                                  color: '#333',
                                                  padding: '20px',
                                                  borderRadius: '12px',
                                                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                                }}>
                                                  <div className="stat-icon d-md-block d-sm-none d-none">
                                                    <i className="fas fa-clock"></i>
                                                  </div>
                                                  <div className="stat-info">
                                                    <h4 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{docCounts.pendingVerificationCount || 0}</h4>
                                                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Pending Review</p>
                                                  </div>
                                                </div>

                                                <div className="stat-card verified-docs" style={{
                                                  background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                                                  color: '#333',
                                                  padding: '20px',
                                                  borderRadius: '12px',
                                                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                                }}>
                                                  <div className="stat-icon d-md-block d-sm-none d-none">
                                                    <i className="fas fa-check-circle"></i>
                                                  </div>
                                                  <div className="stat-info">
                                                    <h4 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{docCounts.verifiedCount || 0}</h4>
                                                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Approved</p>
                                                  </div>
                                                </div>

                                                <div className="stat-card rejected-docs" style={{
                                                  background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                                                  color: '#333',
                                                  padding: '20px',
                                                  borderRadius: '12px',
                                                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                                }}>
                                                  <div className="stat-icon d-md-block d-sm-none d-none">
                                                    <i className="fas fa-times-circle"></i>
                                                  </div>
                                                  <div className="stat-info">
                                                    <h4 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{docCounts.RejectedCount || 0}</h4>
                                                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Rejected</p>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Enhanced Filter Section */}
                                              <div className="filter-section-enhanced" style={{ marginBottom: '20px' }}>
                                                <div className="filter-tabs-container">
                                                  <h5 className="filter-title" style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>
                                                    <i className="fas fa-filter me-2"></i>
                                                    Filter Documents
                                                  </h5>
                                                  <div className="filter-tabs" style={{
                                                    display: 'flex',
                                                    gap: '10px',
                                                    flexWrap: 'wrap'
                                                  }}>
                                                    <button
                                                      className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                                                      onClick={() => setStatusFilter('all')}
                                                      style={{
                                                        padding: '8px 16px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        backgroundColor: statusFilter === 'all' ? '#007bff' : 'white',
                                                        color: statusFilter === 'all' ? 'white' : '#333',
                                                        cursor: 'pointer'
                                                      }}
                                                    >
                                                      <i className="fas fa-list-ul"></i>
                                                      All Documents
                                                      <span className="badge" style={{
                                                        marginLeft: '8px',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        backgroundColor: statusFilter === 'all' ? 'rgba(255,255,255,0.3)' : '#007bff',
                                                        color: statusFilter === 'all' ? 'white' : 'white'
                                                      }}>{docCounts.totalRequired || 0}</span>
                                                    </button>
                                                    <button
                                                      className={`filter-btn pending ${statusFilter === 'pending' ? 'active' : ''}`}
                                                      onClick={() => setStatusFilter('pending')}
                                                      style={{
                                                        padding: '8px 16px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        backgroundColor: statusFilter === 'pending' ? '#ffc107' : 'white',
                                                        color: statusFilter === 'pending' ? 'white' : '#333',
                                                        cursor: 'pointer'
                                                      }}
                                                    >
                                                      <i className="fas fa-clock"></i>
                                                      Pending
                                                      <span className="badge" style={{
                                                        marginLeft: '8px',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        backgroundColor: statusFilter === 'pending' ? 'rgba(255,255,255,0.3)' : '#ffc107',
                                                        color: 'white'
                                                      }}>{docCounts.pendingVerificationCount || 0}</span>
                                                    </button>
                                                    <button
                                                      className={`filter-btn verified ${statusFilter === 'verified' ? 'active' : ''}`}
                                                      onClick={() => setStatusFilter('verified')}
                                                      style={{
                                                        padding: '8px 16px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        backgroundColor: statusFilter === 'verified' ? '#28a745' : 'white',
                                                        color: statusFilter === 'verified' ? 'white' : '#333',
                                                        cursor: 'pointer'
                                                      }}
                                                    >
                                                      <i className="fas fa-check-circle"></i>
                                                      Verified
                                                      <span className="badge" style={{
                                                        marginLeft: '8px',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        backgroundColor: statusFilter === 'verified' ? 'rgba(255,255,255,0.3)' : '#28a745',
                                                        color: 'white'
                                                      }}>{docCounts.verifiedCount || 0}</span>
                                                    </button>
                                                    <button
                                                      className={`filter-btn rejected ${statusFilter === 'rejected' ? 'active' : ''}`}
                                                      onClick={() => setStatusFilter('rejected')}
                                                      style={{
                                                        padding: '8px 16px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        backgroundColor: statusFilter === 'rejected' ? '#dc3545' : 'white',
                                                        color: statusFilter === 'rejected' ? 'white' : '#333',
                                                        cursor: 'pointer'
                                                      }}
                                                    >
                                                      <i className="fas fa-times-circle"></i>
                                                      Rejected
                                                      <span className="badge" style={{
                                                        marginLeft: '8px',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        backgroundColor: statusFilter === 'rejected' ? 'rgba(255,255,255,0.3)' : '#dc3545',
                                                        color: 'white'
                                                      }}>{docCounts.RejectedCount || 0}</span>
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Enhanced Documents Grid */}
                                              <div className="documents-grid-enhanced" style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                                gap: '20px'
                                              }}>
                                                {(() => {
                                                  // Filter documents based on status filter
                                                  const filteredDocs = filterDocuments(documentsToDisplay);

                                                  if (filteredDocs.length === 0) {
                                                    return (
                                                      <div className="col-12 text-center py-5">
                                                        <div className="text-muted">
                                                          <i className="fas fa-filter fa-3x mb-3"></i>
                                                          <h5>No Documents Found</h5>
                                                          <p>No documents match the current filter criteria.</p>
                                                        </div>
                                                      </div>
                                                    );
                                                  }

                                                  return filteredDocs.map((doc, index) => {
                                                    // Check if this is a document with upload data or just uploaded file info
                                                    const latestUpload = doc.uploads && doc.uploads.length > 0
                                                      ? doc.uploads[doc.uploads.length - 1]
                                                      : (doc.fileUrl && doc.status !== "Not Uploaded" ? doc : null);

                                                    return (
                                                      <div key={doc._id || index} className="document-card-enhanced" style={{
                                                        border: '1px solid #e9ecef',
                                                        borderRadius: '12px',
                                                        overflow: 'hidden',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        transition: 'transform 0.2s ease'
                                                      }}>
                                                        <div className="document-image-container" style={{ position: 'relative' }}>
                                                          {latestUpload || (doc.fileUrl && doc.status !== "Not Uploaded") ? (
                                                            <>
                                                              {(() => {
                                                                const fileUrl = latestUpload?.fileUrl || doc.fileUrl;
                                                                const fileType = getFileType(fileUrl);

                                                                if (fileType === 'image') {
                                                                  return (
                                                                    <img
                                                                      src={fileUrl}
                                                                      alt="Document Preview"
                                                                      className="document-image"
                                                                      style={{
                                                                        width: '100%',
                                                                        height: '200px',
                                                                        objectFit: 'cover'
                                                                      }}
                                                                    />
                                                                  );
                                                                } else if (fileType === 'pdf') {
                                                                  return (
                                                                    <div className="document-preview-icon" style={{
                                                                      display: 'flex',
                                                                      flexDirection: 'column',
                                                                      alignItems: 'center',
                                                                      justifyContent: 'center',
                                                                      height: '200px',
                                                                      backgroundColor: '#f8f9fa'
                                                                    }}>
                                                                      <i className="fa-solid fa-file" style={{ fontSize: '60px', color: '#dc3545' }}></i>
                                                                      <p style={{ fontSize: '12px', marginTop: '10px' }}>PDF Document</p>
                                                                    </div>
                                                                  );
                                                                } else {
                                                                  return (
                                                                    <div className="document-preview-icon" style={{
                                                                      display: 'flex',
                                                                      flexDirection: 'column',
                                                                      alignItems: 'center',
                                                                      justifyContent: 'center',
                                                                      height: '200px',
                                                                      backgroundColor: '#f8f9fa'
                                                                    }}>
                                                                      <i className={`fas ${fileType === 'pdf' ? 'fa-file-word' :
                                                                        fileType === 'spreadsheet' ? 'fa-file-excel' : 'fa-file'
                                                                        }`} style={{ fontSize: '40px', color: '#6c757d' }}></i>
                                                                      <p style={{ fontSize: '12px', marginTop: '10px' }}>
                                                                        {fileType === 'document' ? 'Document' :
                                                                          fileType === 'spreadsheet' ? 'Spreadsheet' : 'File'}
                                                                      </p>
                                                                    </div>
                                                                  );
                                                                }
                                                              })()}
                                                              <div className="image-overlay" style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                right: 0,
                                                                bottom: 0,
                                                                backgroundColor: 'rgba(0,0,0,0.5)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                opacity: 0,
                                                                transition: 'opacity 0.3s ease'
                                                              }}
                                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                                                              >
                                                                <button
                                                                  className="preview-btn"
                                                                  onClick={() => {
                                                                    setSelectedProfile(placement);
                                                                    openDocumentModal(doc);
                                                                  }}
                                                                  style={{
                                                                    padding: '8px 16px',
                                                                    backgroundColor: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    color: '#007bff',
                                                                    fontWeight: '600'
                                                                  }}
                                                                >
                                                                  <i className="fas fa-search-plus"></i>
                                                                  Preview
                                                                </button>
                                                              </div>
                                                            </>
                                                          ) : (
                                                            <div className="no-document-placeholder" style={{
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              alignItems: 'center',
                                                              justifyContent: 'center',
                                                              height: '200px',
                                                              backgroundColor: '#f8f9fa',
                                                              color: '#6c757d'
                                                            }}>
                                                              <i className="fas fa-file-upload" style={{ fontSize: '40px', marginBottom: '10px' }}></i>
                                                              <p>No Document</p>
                                                            </div>
                                                          )}

                                                          {/* Status Badge Overlay */}
                                                          <div className="status-badge-overlay" style={{
                                                            position: 'absolute',
                                                            top: '10px',
                                                            right: '10px'
                                                          }}>
                                                            {(latestUpload?.status === 'Pending' || doc.status === 'Pending') && (
                                                              <span className="status-badge-new pending" style={{
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                backgroundColor: '#ffc107',
                                                                color: 'white',
                                                                fontSize: '11px',
                                                                fontWeight: '600'
                                                              }}>
                                                                <i className="fas fa-clock"></i>
                                                                Pending
                                                              </span>
                                                            )}
                                                            {(latestUpload?.status === 'Verified' || doc.status === 'Verified') && (
                                                              <span className="status-badge-new verified" style={{
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                backgroundColor: '#28a745',
                                                                color: 'white',
                                                                fontSize: '11px',
                                                                fontWeight: '600'
                                                              }}>
                                                                <i className="fas fa-check-circle"></i>
                                                                Verified
                                                              </span>
                                                            )}
                                                            {(latestUpload?.status === 'Rejected' || doc.status === 'Rejected') && (
                                                              <span className="status-badge-new rejected" style={{
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                backgroundColor: '#dc3545',
                                                                color: 'white',
                                                                fontSize: '11px',
                                                                fontWeight: '600'
                                                              }}>
                                                                <i className="fas fa-times-circle"></i>
                                                                Rejected
                                                              </span>
                                                            )}
                                                            {(!latestUpload && doc.status === "Not Uploaded") && (
                                                              <span className="status-badge-new not-uploaded" style={{
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                backgroundColor: '#6c757d',
                                                                color: 'white',
                                                                fontSize: '11px',
                                                                fontWeight: '600'
                                                              }}>
                                                                <i className="fas fa-upload"></i>
                                                                Required
                                                              </span>
                                                            )}
                                                          </div>
                                                        </div>

                                                        <div className="document-info-section" style={{ padding: '15px' }}>
                                                          <div className="document-header" style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            marginBottom: '10px'
                                                          }}>
                                                            <h4 className="document-title" style={{
                                                              margin: 0,
                                                              fontSize: '16px',
                                                              fontWeight: '600'
                                                            }}>{doc.Name || `Document ${index + 1}`}</h4>
                                                            <div className="document-actions">
                                                              {(!latestUpload) ? (
                                                                <button className="action-btn upload-btn" title="Upload Document" onClick={() => {
                                                                  setSelectedProfile(placement);
                                                                  openUploadModal(doc);
                                                                }} style={{
                                                                  padding: '6px 12px',
                                                                  backgroundColor: '#007bff',
                                                                  color: 'white',
                                                                  border: 'none',
                                                                  borderRadius: '6px',
                                                                  cursor: 'pointer',
                                                                  fontSize: '12px'
                                                                }}>
                                                                  <i className="fas fa-cloud-upload-alt"></i>
                                                                  Upload
                                                                </button>
                                                              ) : (
                                                                <button
                                                                  className="action-btn verify-btn"
                                                                  onClick={() => {
                                                                    setSelectedProfile(placement);
                                                                    openDocumentModal(doc);
                                                                  }}
                                                                  title="Verify Document"
                                                                  style={{
                                                                    padding: '6px 12px',
                                                                    backgroundColor: '#28a745',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                  }}
                                                                >
                                                                  <i className="fas fa-search"></i>
                                                                  PREVIEW
                                                                </button>
                                                              )}
                                                            </div>
                                                          </div>

                                                          <div className="document-meta" style={{
                                                            display: 'flex',
                                                            gap: '15px',
                                                            fontSize: '12px',
                                                            color: '#6c757d'
                                                          }}>
                                                            <div className="meta-item">
                                                              <i className="fas fa-calendar-alt text-muted"></i>
                                                              <span className="meta-text">
                                                                {(latestUpload?.uploadedAt || doc.uploadedAt) ?
                                                                  new Date(latestUpload?.uploadedAt || doc.uploadedAt).toLocaleDateString('en-GB', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                  }) :
                                                                  'Not uploaded'
                                                                }
                                                              </span>
                                                            </div>

                                                            {latestUpload && (
                                                              <div className="meta-item">
                                                                <i className="fas fa-clock text-muted"></i>
                                                                <span className="meta-text">
                                                                  {new Date(latestUpload.uploadedAt).toLocaleTimeString('en-GB', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                  })}
                                                                </span>
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    );
                                                  });
                                                })()}
                                              </div>

                                              {/* DocumentModal */}
                                              {showDocumentModal && selectedProfile && selectedProfile._id === placement._id && (
                                                <DocumentModal
                                                  showDocumentModal={showDocumentModal}
                                                  selectedDocument={selectedDocument}
                                                  closeDocumentModal={closeDocumentModal}
                                                  updateDocumentStatus={updateDocumentStatus}
                                                  getFileType={getFileType}
                                                />
                                              )}

                                              {/* Upload Modal */}
                                              <div className="modal fade w-100" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                                <div className="modal-dialog d-flex justify-content-center mx-auto w-100">
                                                  <div className="modal-content p-0 w-100">
                                                    <div className="modal-header">
                                                      <h3>
                                                        <i className="fas fa-cloud-upload-alt me-2"></i>
                                                        Upload {selectedDocumentForUpload?.Name || 'Document'}
                                                      </h3>
                                                      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={closeUploadModal}></button>
                                                    </div>
                                                    <div className="modal-body">
                                                      <div className="upload-section">
                                                        {!selectedFile ? (
                                                          <div className="file-drop-zone" style={{
                                                            border: '2px dashed #ddd',
                                                            borderRadius: '8px',
                                                            padding: '40px',
                                                            textAlign: 'center',
                                                            cursor: 'pointer'
                                                          }}>
                                                            <div className="drop-zone-content">
                                                              <i className="fas fa-cloud-upload-alt upload-icon" style={{ fontSize: '48px', color: '#007bff', marginBottom: '15px' }}></i>
                                                              <h4>Choose a file to upload</h4>
                                                              <p>Drag and drop a file here, or click to select</p>
                                                              <div className="file-types" style={{ marginTop: '15px', fontSize: '12px', color: '#6c757d' }}>
                                                                <span>Supported: JPG, PNG, GIF, PDF</span>
                                                                <span style={{ marginLeft: '10px' }}>Max size: 10MB</span>
                                                              </div>
                                                              <input
                                                                type="file"
                                                                id="file-input"
                                                                accept=".jpg,.jpeg,.png,.gif,.pdf"
                                                                onChange={handleFileSelect}
                                                                style={{ display: 'none' }}
                                                              />
                                                              <button
                                                                className="btn btn-primary"
                                                                onClick={() => document.getElementById('file-input').click()}
                                                                style={{ marginTop: '15px' }}
                                                              >
                                                                <i className="fas fa-folder-open me-2"></i>
                                                                Choose File
                                                              </button>
                                                            </div>
                                                          </div>
                                                        ) : (
                                                          <div className="file-preview-section">
                                                            <div className="selected-file-info" style={{ marginBottom: '20px' }}>
                                                              <h4>Selected File:</h4>
                                                              <div className="file-details" style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '15px',
                                                                padding: '15px',
                                                                backgroundColor: '#f8f9fa',
                                                                borderRadius: '8px'
                                                              }}>
                                                                <div className="file-icon" style={{ fontSize: '32px' }}>
                                                                  <i className={`fas ${selectedFile.type.startsWith('image/') ? 'fa-image' : 'fa-file-pdf'}`}></i>
                                                                </div>
                                                                <div className="file-info" style={{ flex: 1 }}>
                                                                  <p className="file-name" style={{ margin: 0, fontWeight: '600' }}>{selectedFile.name}</p>
                                                                  <p className="file-size" style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '12px' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                                </div>
                                                                <button
                                                                  className="btn btn-sm btn-outline-secondary"
                                                                  onClick={() => {
                                                                    setSelectedFile(null);
                                                                    setUploadPreview(null);
                                                                  }}
                                                                >
                                                                  <i className="fas fa-trash"></i>
                                                                </button>
                                                              </div>
                                                            </div>

                                                            {uploadPreview && (
                                                              <div className="upload-preview" style={{ marginBottom: '20px' }}>
                                                                <h5>Preview:</h5>
                                                                <img src={uploadPreview} alt="Upload Preview" className="preview-image" style={{
                                                                  maxWidth: '100%',
                                                                  borderRadius: '8px',
                                                                  border: '1px solid #ddd'
                                                                }} />
                                                              </div>
                                                            )}

                                                            {isUploading && (
                                                              <div className="upload-progress-section" style={{ marginBottom: '20px' }}>
                                                                <h5>Uploading...</h5>
                                                                <div className="progress-bar-container" style={{
                                                                  width: '100%',
                                                                  height: '20px',
                                                                  backgroundColor: '#e9ecef',
                                                                  borderRadius: '10px',
                                                                  overflow: 'hidden'
                                                                }}>
                                                                  <div
                                                                    className="progress-bar"
                                                                    style={{
                                                                      width: `${uploadProgress}%`,
                                                                      height: '100%',
                                                                      backgroundColor: '#007bff',
                                                                      transition: 'width 0.3s ease'
                                                                    }}
                                                                  ></div>
                                                                </div>
                                                                <p style={{ marginTop: '10px' }}>{uploadProgress}% Complete</p>
                                                              </div>
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <div className="modal-footer">
                                                      <button
                                                        className="btn btn-secondary"
                                                        onClick={closeUploadModal}
                                                        disabled={isUploading}
                                                      >
                                                        Cancel
                                                      </button>
                                                      <button
                                                        className="btn btn-primary"
                                                        onClick={handleFileUpload}
                                                        disabled={!selectedFile || isUploading}
                                                      >
                                                        {isUploading ? (
                                                          <>
                                                            <i className="fas fa-spinner fa-spin me-2"></i>
                                                            Uploading...
                                                          </>
                                                        ) : (
                                                          <>
                                                            <i className="fas fa-upload me-2"></i>
                                                            Upload Document
                                                          </>
                                                        )}
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pagination */}
              <nav aria-label="Page navigation" className="mt-2">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <small className="text-muted">
                    Page {currentPage} of {totalPages} ({leads.length} results)
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
              {renderWhatsAppPanel()}
              {renderLeadHistoryPanel()}

            </div>
          )
        }

        {/* Mobile Modals */}
        {isMobile && renderStatusChangePanel()}
        {isMobile && renderFollowupPanel()}
        {isMobile && renderRefferPanel()}
        {isMobile && renderLeadHistoryPanel()}

      </div >

      {/* Filter Modal */}
      {showFilters && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-filter me-2"></i>
                  Filter Placements
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowFilters(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-check-circle text-success me-2"></i>
                      Placement Status
                    </label>
                    <select
                      className="form-select border-0 bg-light"
                      value={filters.placementStatus}
                      onChange={(e) => handleFilterChange('placementStatus', e.target.value)}
                      style={{ backgroundColor: '#f8f9fa' }}
                    >
                      <option value="">All Placements</option>
                      <option value="placed">Placed</option>
                      <option value="unplaced">Unplaced</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-calendar text-primary me-2"></i>
                      Placement Start Date
                    </label>
                    <input
                      type="date"
                      className="form-control border-0 bg-light"
                      value={filters.placementDateRange.start || ''}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          placementDateRange: {
                            ...prev.placementDateRange,
                            start: e.target.value
                          }
                        }));
                      }}
                      style={{ backgroundColor: '#f8f9fa' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-calendar text-primary me-2"></i>
                      Placement End Date
                    </label>
                    <input
                      type="date"
                      className="form-control border-0 bg-light"
                      value={filters.placementDateRange.end || ''}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          placementDateRange: {
                            ...prev.placementDateRange,
                            end: e.target.value
                          }
                        }));
                      }}
                      style={{ backgroundColor: '#f8f9fa' }}
                    />
                  </div>


                  {/* <div className="col-md-4">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-tag text-success me-2"></i>
                      Lead Category
                    </label>
                    <select
                      className="form-select border-0 bg-light"
                      value={filters.leadCategory}
                      onChange={(e) => handleFilterChange('leadCategory', e.target.value)}
                      style={{ backgroundColor: '#f8f9fa' }}
                    >
                      <option value="">All Categories</option>
                      {leadCategoryOptions && leadCategoryOptions.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-building text-info me-2"></i>
                      Type of B2B
                    </label>
                    <select
                      className="form-select border-0 bg-light"
                      value={filters.typeOfB2B}
                      onChange={(e) => handleFilterChange('typeOfB2B', e.target.value)}
                      style={{ backgroundColor: '#f8f9fa' }}
                    >
                      <option value="">All Types</option>
                      {typeOfB2BOptions && typeOfB2BOptions.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-user text-warning me-2"></i>
                      Lead Owner
                    </label>
                    <select
                      className="form-select border-0 bg-light"
                      value={filters.leadOwner}
                      onChange={(e) => handleFilterChange('leadOwner', e.target.value)}
                      style={{ backgroundColor: '#f8f9fa' }}
                    >
                      <option value="">All Owners</option>
                      {users && users.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
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
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-calendar text-danger me-2"></i>
                      Status
                    </label>
                    <select
                      className="form-select border-0 bg-light"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      style={{ backgroundColor: '#f8f9fa' }}
                    >
                      <option value="">All Statuses</option>
                      {statuses.map(status => (
                        <option key={status._id} value={status._id}>
                          {status.name}
                        </option>
                      ))}
                    </select>

                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-calendar text-danger me-2"></i>
                      Sub Status
                    </label>
                    <select
                      className="form-select border-0  bgcolor"
                      name="subStatus"
                      id="subStatus"
                      value={filters.subStatus}
                      style={{
                        height: '42px',
                        paddingTop: '8px',
                        backgroundColor: '#f1f2f6',
                        paddingInline: '10px',
                        width: '100%'
                      }}
                      onChange={(e) => handleFilterChange('subStatus', e.target.value)}

                    >
                      <option value="">Select Sub-Status</option>
                      {subStatuses.map((filter, index) => (
                        <option value={filter._id}>{filter.title}</option>))}
                    </select>
                  </div> */}
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
                    Add Candidate
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
                    {/* Company Name */}
                    <div className="col-12">
                      <label className="form-label fw-bold">
                        <i className="fas fa-building text-primary me-1"></i>
                        Company Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.companyName ? 'is-invalid' : ''}`}
                        name="companyName"
                        value={leadFormData.companyName}
                        onChange={handleLeadInputChange}
                        placeholder="Enter company name"
                      />
                      {formErrors.companyName && (
                        <div className="invalid-feedback">
                          {formErrors.companyName}
                        </div>
                      )}
                    </div>

                    {/* HR Name */}
                    <div className="col-12">
                      <label className="form-label fw-bold">
                        <i className="fas fa-user-tie text-primary me-1"></i>
                        HR Name
                      </label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.employerName ? 'is-invalid' : ''}`}
                        name="employerName"
                        value={leadFormData.employerName}
                        onChange={handleLeadInputChange}
                        placeholder="Enter HR name"
                      />
                      {formErrors.employerName && (
                        <div className="invalid-feedback">
                          {formErrors.employerName}
                        </div>
                      )}
                    </div>

                    {/* Contact Number */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-phone text-primary me-1"></i>
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        className={`form-control ${formErrors.contactNumber ? 'is-invalid' : ''}`}
                        name="contactNumber"
                        value={leadFormData.contactNumber}
                        onChange={handleLeadMobileChange}
                        placeholder="Enter contact number"
                      />
                      {formErrors.contactNumber && (
                        <div className="invalid-feedback">
                          {formErrors.contactNumber}
                        </div>
                      )}
                    </div>

                    {/* Date of Joining */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-calendar text-primary me-1"></i>
                        Date of Joining <span className="text-danger">*</span>
                      </label>
                      <DatePicker
                        onChange={(date) => {
                          setLeadFormData(prev => ({
                            ...prev,
                            dateOfJoining: date
                          }));
                          if (formErrors.dateOfJoining) {
                            setFormErrors(prev => ({
                              ...prev,
                              dateOfJoining: ''
                            }));
                          }
                        }}
                        value={leadFormData.dateOfJoining}
                        format="dd/MM/yyyy"
                        className={`form-control ${formErrors.dateOfJoining ? 'is-invalid' : ''}`}
                      />
                      {formErrors.dateOfJoining && (
                        <div className="invalid-feedback d-block">
                          {formErrors.dateOfJoining}
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    <div className="col-12">
                      <label className="form-label fw-bold">
                        <i className="fas fa-map-marker-alt text-primary me-1"></i>
                        Location <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.location ? 'is-invalid' : ''}`}
                        name="location"
                        value={leadFormData.location}
                        onChange={handleLeadInputChange}
                        placeholder="Enter location"
                      />
                      {formErrors.location && (
                        <div className="invalid-feedback">
                          {formErrors.location}
                        </div>
                      )}
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
                          Add Candidate
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
      {/* Job Video Modal */}
      <div className="modal fade" id="jobVideoModal" tabIndex="-1" aria-labelledby="jobVideoModalTitle" aria-hidden="true"
        onClick={() => setJobVideoSrc("")}
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close" style={{
              zIndex: 9,
              background: '#fff',
              border: '2px solid #FC2B5A !important',
              fontSize: '19px',
              borderRadius: '100px',
              height: '38px',
              opacity: 1,
              padding: 0,
              position: 'absolute',
              right: '0px',
              top: '0px',
              width: '38px',
              fontWeight: 900,
              color: '#000'
            }}>
              <span style={{ fontSize: '30px', lineHeight: '30px', color: '#FC2B5A', fontWeight: 400 }}>&times;</span>
            </button>
            <div className="modal-body p-0 text-center embed-responsive">
              <video key={jobVideoSrc} id="jobVideo" controls className="video-fluid text-center" style={{ width: '100%', height: 'auto', borderRadius: '6px' }}>
                <source src={jobVideoSrc} type="video/mp4" className="img-fluid video-fluid" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>

      {/* Create Job Modal */}
      {showCreateJobModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-briefcase me-2"></i>Create New Job
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCreateJobModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {jobFormErrors.general && (
                  <div className="alert alert-danger">{jobFormErrors.general}</div>
                )}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Job Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={jobFormData.title}
                      onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Company Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={jobFormData.companyName}
                      onChange={(e) => setJobFormData({ ...jobFormData, companyName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Qualification</label>
                    <select
                      className="form-select"
                      value={jobFormData._qualification}
                      onChange={(e) => setJobFormData({ ...jobFormData, _qualification: e.target.value })}
                    >
                      <option value="">Select Qualification</option>
                      {qualifications.map(q => (
                        <option key={q._id} value={q._id}>{q.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Industry</label>
                    <select
                      className="form-select"
                      value={jobFormData._industry}
                      onChange={(e) => setJobFormData({ ...jobFormData, _industry: e.target.value })}
                    >
                      <option value="">Select Industry</option>
                      {industries.map(i => (
                        <option key={i._id} value={i._id}>{i.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Course *</label>
                    <select
                      className="form-select"
                      value={jobFormData._course}
                      onChange={(e) => setJobFormData({ ...jobFormData, _course: e.target.value })}
                      required
                    >
                      <option value="">Select Course</option>
                      {courseOptions.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">State</label>
                    <select
                      className="form-select"
                      value={jobFormData.state}
                      onChange={async (e) => {
                        const selectedStateId = e.target.value;
                        setJobFormData({ ...jobFormData, state: selectedStateId, city: '' });

                        if (selectedStateId) {
                          await fetchJobFormOptions(selectedStateId);
                        } else {
                          await fetchJobFormOptions();
                        }
                      }}
                    >
                      <option value="">Select State</option>
                      {states.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">City</label>
                    <select
                      className="form-select"
                      value={jobFormData.city}
                      onChange={(e) => setJobFormData({ ...jobFormData, city: e.target.value })}
                      disabled={!jobFormData.state}
                    >
                      <option value="">{jobFormData.state ? 'Select City' : 'Select State First'}</option>
                      {cities.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Number of Positions</label>
                    <input
                      type="number"
                      className="form-control"
                      value={jobFormData.noOfPosition}
                      onChange={(e) => setJobFormData({ ...jobFormData, noOfPosition: parseInt(e.target.value) || 1 })}
                      min="1"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Validity Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={jobFormData.validity}
                      onChange={(e) => setJobFormData({ ...jobFormData, validity: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Job Category</label>
                    <select
                      className="form-select"
                      value={jobFormData._jobCategory}
                      onChange={(e) => setJobFormData({ ...jobFormData, _jobCategory: e.target.value })}
                    >
                      <option value="">Select Job Category</option>
                      {jobCategories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Job Description</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={jobFormData.jobDescription}
                      onChange={(e) => setJobFormData({ ...jobFormData, jobDescription: e.target.value })}
                      placeholder="Enter detailed job description..."
                    />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Requirements</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={jobFormData.requirement}
                      onChange={(e) => setJobFormData({ ...jobFormData, requirement: e.target.value })}
                      placeholder="Enter job requirements (e.g., skills, experience, etc.)..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateJobModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateJob}
                  disabled={creatingJob}
                >
                  {creatingJob ? 'Creating...' : 'Create Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offer Job Modal - Commented out as we're sending offers directly */}
      {/* {showOfferJobModal && selectedPlacementForJob && selectedJobForOffer && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="fas fa-hand-holding-usd me-2"></i>Offer Job to Candidate
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowOfferJobModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Job Title</label>
                  <div className="form-control bg-light" style={{ border: 'none' }}>
                    {selectedJobForOffer.title || 'N/A'}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Date of Joining <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={offerJobData.dateOfJoining}
                    onChange={(e) => setOfferJobData({ ...offerJobData, dateOfJoining: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Remarks</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={offerJobData.remarks}
                    onChange={(e) => setOfferJobData({ ...offerJobData, remarks: e.target.value })}
                    placeholder="Add any remarks or notes..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowOfferJobModal(false)}
                >
                  Cancel
                </button>
                
              </div>
            </div>
          </div>
        </div>
      )} */}

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
    background-color: #007bff;
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

  /* Header Section */
  .lead-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem;
    position: relative;
    overflow: hidden;
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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  .compact-info-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.875rem;
    padding: 0.5rem;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .compact-info-item i {
    font-size: 0.875rem;
    width: 16px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .compact-info-label {
    font-weight: 600;
    color: #6c757d;
    font-size: 0.75rem;
    margin-bottom: 2px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .compact-info-value {
    color: #212529;
    font-size: 0.875rem;
    font-weight: 500;
    word-break: break-word;
  }

  @media (max-width: 768px) {
    .compact-info-grid {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
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
      gap: 1rem;
    }
    
    .action-group {
      width: 100%;
      justify-content: center;
    }
    
    .lead-badges {
      position: static;
      margin-top: 1rem;
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    border: 2px solid #007bff !important;
    background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
  }

  .status-count-card.selected.total {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
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

  /* Job History and Course History Table Styles */
  .job-history-table,
  .course-history-table,
  .company-jobs-table {
    width: 100%;
    margin-top: 10px;
  }

  .company-jobs-table-wrapper {
    max-height: 280px;
    overflow-y: auto;
    overflow-x: auto;
    position: relative;
  }

  .company-jobs-table-header {
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .job-history-table th,
  .course-history-table th,
  .company-jobs-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    padding: 12px;
    text-align: left;
    border-bottom: 2px solid #dee2e6;
  }

  .company-jobs-table th {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: #f8f9fa !important;
  }

  .job-history-table td,
  .course-history-table td,
  .company-jobs-table td {
    padding: 12px;
    border-bottom: 1px solid #dee2e6;
  }

  .job-history-table tbody tr:hover,
  .course-history-table tbody tr:hover,
  .company-jobs-table tbody tr:hover {
    background-color: #f8f9fa;
  }

  /* Resume/Profile Styles */
  .resume-preview-body {
    padding: 20px;
  }

  .resume-document {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    border-radius: 8px;
  }

  .resume-document-header {
    margin-bottom: 30px;
  }

  .resume-profile-section {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }

  .resume-profile-placeholder {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
    font-size: 40px;
    color: #999;
  }

  .resume-profile-image {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 20px;
  }

  .resume-header-content {
    flex: 1;
  }

  .resume-name {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 5px;
    color: #333;
  }

  .resume-title {
    font-size: 16px;
    color: #666;
    margin-bottom: 10px;
  }

  .resume-contact-details {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }

  .resume-contact-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    color: #555;
  }

  .resume-summary {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
  }

  .resume-section-title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 15px;
    border-bottom: 2px solid #007bff;
    padding-bottom: 5px;
  }

  .resume-document-body {
    display: flex;
    gap: 30px;
  }

  .resume-column {
    flex: 1;
  }

  .resume-section {
    margin-bottom: 25px;
  }

  .resume-experience-item,
  .resume-education-item,
  .resume-project-item {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
  }

  .resume-item-header {
    margin-bottom: 10px;
  }

  .resume-item-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
  }

  .resume-item-subtitle {
    font-size: 14px;
    color: #666;
    margin-bottom: 3px;
  }

  .resume-item-period {
    font-size: 13px;
    color: #888;
    font-style: italic;
  }

  .resume-item-content {
    font-size: 14px;
    color: #555;
    line-height: 1.5;
  }

  .resume-skills-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .resume-skill-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .resume-skill-name {
    flex: 1;
    font-size: 14px;
    color: #333;
  }

  .resume-skill-bar-container {
    flex: 2;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .resume-skill-bar {
    height: 100%;
    background: #007bff;
    border-radius: 4px;
  }

  .resume-skill-percent {
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 11px;
    color: #333;
  }

  .resume-languages-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .resume-language-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .resume-language-name {
    font-size: 14px;
    color: #333;
  }

  .resume-language-level {
    display: flex;
    gap: 3px;
  }

  .resume-level-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e0e0e0;
  }

  .resume-level-dot.filled {
    background: #007bff;
  }

  .resume-certifications-list {
    list-style: none;
    padding: 0;
  }

  .resume-certification-item {
    margin-bottom: 10px;
    font-size: 14px;
    color: #333;
  }

  .resume-cert-org {
    color: #666;
  }

  .resume-cert-date {
    color: #888;
    font-style: italic;
  }

  .resume-project-year {
    color: #888;
    font-size: 14px;
  }

  .resume-interests-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .resume-interest-tag {
    background: #f0f0f0;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 12px;
    color: #333;
  }

  .resume-declaration {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eee;
  }

  @media (max-width: 768px) {
    .resume-document-body {
      flex-direction: column;
    }
    
    .resume-profile-section {
      flex-direction: column;
      text-align: center;
    }
    
    .resume-contact-details {
      justify-content: center;
    }
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

  /* Card Content Styles - Matching Registrations */
  .card-content {
    transition: all 0.3s ease;
  }

  .card-content.transition-col {
    transition: background-color 0.2s ease;
  }

  /* Circular Progress Styles */
  .circular-progress-container {
    position: relative;
    width: 40px;
    height: 40px;
  }

  .circular-progress-container svg {
    transform: rotate(-90deg);
  }

  .circle-bg {
    fill: none;
    stroke: #e0e0e0;
    stroke-width: 3;
  }

  .circle-progress {
    fill: none;
    stroke: #007bff;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 100.48;
    stroke-dashoffset: 100.48;
    transition: stroke-dashoffset 0.5s ease;
  }

  .circular-progress-container .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 10px;
    font-weight: 600;
    color: #007bff;
  }

  /* Nav Pills Styles */
  .nav-pills-sm .nav-link {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }

  .nav-pills .nav-link {
    color: #6c757d;
    background-color: transparent;
    border: 1px solid transparent;
    transition: all 0.2s ease;
  }

  .nav-pills .nav-link:hover {
    color: #007bff;
    background-color: #f8f9ff;
    border-color: #e3f2fd;
  }

  .nav-pills .nav-link.active {
    color: white;
    background-color: #fd2b5a;
    border-color: #fd2b5a;
    font-weight: 600;
  }

  /* Info Card Styles */
  .info-card {
    background: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .info-group {
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid #f0f0f0;
  }

  .info-group:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .info-label {
    font-size: 11px;
    font-weight: 600;
    color: #6c757d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 5px;
  }

  .info-value {
    font-size: 14px;
    font-weight: 500;
    color: #212529;
    word-break: break-word;
  }

  /* Scrollable Container Styles */
  .scrollable-container {
    position: relative;
    width: 100%;
    overflow: hidden;
    padding: 10px 0;
    display: none;
  }

  .scrollable-content {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    gap: 15px;
  }

  .scrollable-content .info-card {
    flex: 0 0 auto;
    scroll-snap-align: start;
    min-width: 250px;
    max-width: 300px;
  }

  .scrollable-content::-webkit-scrollbar {
    height: 4px;
  }

  .scrollable-content::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  .scrollable-content::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }

  .scrollable-content::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* WhatsApp Button Styles */
  .whatsappbutton {
    display: flex;
    gap: 5px;
    margin-left: auto;
  }

  /* Scroll Arrow Styles */
  .scroll-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    font-size: 18px;
    font-weight: bold;
  }

  .scroll-arrow.scroll-left {
    left: 10px;
  }

  .scroll-arrow.scroll-right {
    right: 10px;
  }

  .scroll-arrow:hover {
    background: rgba(0, 0, 0, 0.7);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .scrollable-container.mobile-scrollable {
      display: block !important;
    }

    .desktop-view {
      display: none !important;
    }

    .scrollable-content {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
    }

    .scrollable-content .info-card {
      flex: 0 0 auto;
      scroll-snap-align: start;
      margin-right: 15px;
      padding: 15px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #e9ecef;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      min-width: 200px;
      max-width: 250px;
    }
  }

  @media (min-width: 769px) {
    .scrollable-container.mobile-scrollable {
      display: none !important;
    }

    .desktop-view {
      display: block !important;
    }
    
    .desktop-view .scrollable-container {
      display: block !important;
    }

    /* Desktop view info-group styling - remove borders and adjust spacing */
    .desktop-view .info-group {
      margin-bottom: 12px;
      padding-bottom: 0;
      border-bottom: none;
    }

    .desktop-view .info-group:last-child {
      margin-bottom: 0;
    }

    .desktop-view .info-label {
      font-size: 11px;
      font-weight: 600;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .desktop-view .info-value {
      font-size: 14px;
      font-weight: 500;
      color: #212529;
      word-break: break-word;
    }

    .desktop-view .row {
      margin: 0;
    }

    .desktop-view .col-xl-3,
    .desktop-view .col-3 {
      padding-left: 15px;
      padding-right: 15px;
      margin-bottom: 15px;
    }
  }

  /* Enhanced Multi-Select Dropdown Styles */
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
    z-index: 1000;
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

  /* Close dropdown when clicking outside */
  .multi-select-container-new.dropdown-open::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
  }

  /* Focus states for accessibility */
  .multi-select-trigger:focus {
    outline: none;
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }

  .option-item-new input[type="checkbox"]:focus {
    outline: 2px solid #86b7fe;
    outline-offset: 2px;
  }

  /* Selected state styling */
  .option-item-new input[type="checkbox"]:checked + .option-label-new {
    font-weight: 500;
    color: #0d6efd;
  }

  /* Badge styling for multi-select */
  .badge.bg-primary {
    background-color: #0d6efd !important;
    font-size: 0.75rem;
    padding: 0.25em 0.4em;
  }

  /* Animation for dropdown open/close */
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

  /* Prevent text selection on dropdown trigger */
  .multi-select-trigger {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  /* Enhanced visual feedback */
  .multi-select-trigger:active {
    transform: translateY(1px);
  }

  /* Loading state (if needed) */
  .multi-select-loading {
    pointer-events: none;
    opacity: 0.6;
  }

  .multi-select-loading .dropdown-arrow {
    animation: spin 1s linear infinite;
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
  }

  /* Company Jobs Card Styles - Matching Jobs.jsx */
  .courseCard {
    border-radius: 12px !important;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
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

  .group1 {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 75px !important;
    height: auto;
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

  .courses_features {
    font-size: 0.85rem;
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

  .btn.cta-callnow {
    background: #fff;
    color: #FC2B5A;
    font-family: inter;
    border-radius: 50px;
    font-weight: 500;
    padding: 10px 4px;
    width: 100%;
    font-size: 12px;
    letter-spacing: 1px;
    transition: .3s;
  }

  .btn.cta-callnow:hover {
    transition: .5s;
    background: #FC2B5A;
    color: #fff;
  }

  .btn.cta-callnow.btn-bg-color {
    background-color: #FC2B5A;
    color: white;
    border: none;
  }

  .btn.cta-callnow.btn-bg-color:hover {
    background-color: #db2777;
    color: white;
  }

  .course_card_footer {
    background: #FC2B5A;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }

  .course_card_footer img {
    width: 20px;
  }

  .learnn {
    padding: 10px 14px;
  }

  .new_img {
    width: 20px !important;
  }

  .apply_date {
    font-size: 16px;
  }

  .companyname {
    font-size: 12px;
  }

  .right_obj {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: #FC2B5A;
    color: white;
    padding: 5px 10px;
    font-weight: bold;
  }

  .shr--width {
    width: 100%;
  }

  @media (max-width: 768px) {
    .courseCard {
      width: 100%;
    }
  }
`}</style>

    </div >
  );
};

export default Placements;
