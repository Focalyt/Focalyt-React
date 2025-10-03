import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import DatePicker from 'react-date-picker';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'

import CandidateProfile from '../CandidateProfile/CandidateProfile';

const MultiSelectCheckbox = ({
  title,
  options,
  selectedValues,
  onChange,
  icon = "fas fa-list",
  isOpen,
  onToggle
}) => {
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
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="options-list-new">
              {options.map((option) => (
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

              {options.length === 0 && (
                <div className="no-options">
                  <i className="fas fa-info-circle me-2"></i>
                  No {title.toLowerCase()} available
                </div>
              )}
            </div>

            {/* Footer with count */}
            {selectedValues.length > 0 && (
              <div className="options-footer">
                <small className="text-muted">
                  {selectedValues.length} of {options.length} selected
                </small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

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
      case 'verified': return 'text-sucess';
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

  // Fixed renderDocumentThumbnail - removed setCurrentPreviewUpload calls
  const renderDocumentThumbnail = (upload, isSmall = true) => {
    const fileUrl = upload?.fileUrl;
    if (!fileUrl) {
      return (
        <div className={`document-thumbnail ${isSmall ? 'small' : ''}`} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          width: isSmall ? '100%' : '150px',
          height: isSmall ? 'auto' : '100px',
          minHeight: '50px',
          fontSize: isSmall ? '16px' : '24px',
          color: '#6c757d'
        }}>
          📄
        </div>
      );
    }

    const fileType = getFileType(fileUrl);

    if (fileType === 'image') {
      return (
        <img
          src={fileUrl}
          alt="Document Preview"
          className={`document-thumbnail ${isSmall ? 'small' : ''}`}
          style={{
            width: isSmall ? '100%' : '150px',
            height: 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
            backgroundColor: '#f8f9fa',
            display: 'block',
            // Remove cursor pointer to indicate it's not clickable
            cursor: 'default'
          }}
        // Remove onClick handler
        />
      );
    } else if (fileType === 'pdf') {
      return (
        <div style={{
          position: 'relative',
          overflow: 'visible',
          width: isSmall ? '100%' : '150px',
          height: 'auto'
        }}>
          <iframe
            src={fileUrl + '#navpanes=0&toolbar=0'}
            className={`document-thumbnail pdf-thumbnail ${isSmall ? 'small' : ''}`}
            style={{
              width: '100%',
              height: isSmall ? 'auto' : '100px',
              minHeight: isSmall ? '300px' : '100px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa',
              // Disable pointer events to prevent clicks
              pointerEvents: 'none'
            }}
            title="Document"
            scrolling={isSmall ? 'auto' : 'no'}
          />
          {!isSmall && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#007bff',
              fontSize: '24px',
              borderRadius: '4px',
              // Remove cursor pointer
              cursor: 'default',
              // Disable pointer events
              pointerEvents: 'none'
            }}>
              {fileType === 'document' ? '📄' :
                fileType === 'spreadsheet' ? '📊' : '📁'}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="document-modal-overlay" onClick={closeDocumentModal}>
      <div className="document-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{selectedDocument.Name} Verification</h3>
          <button className="close-btn" onClick={closeDocumentModal}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="document-preview-section">
            <div className="document-preview-container" style={{ height: 'auto' }}>
              {(latestUpload?.fileUrl || selectedDocument?.fileUrl ||
                (selectedDocument?.status && selectedDocument?.status !== "Not Uploaded" && selectedDocument?.status !== "No Uploads")) ? (
                <>
                  {(() => {
                    console.log('selectedDocument:', selectedDocument);
                    console.log('latestUpload:', latestUpload);

                    const fileUrl = latestUpload?.fileUrl || selectedDocument?.fileUrl;
                    const hasDocument = fileUrl ||
                      (selectedDocument?.status && selectedDocument?.status !== "Not Uploaded" && selectedDocument?.status !== "No Uploads");

                    console.log('fileUrl:', fileUrl);
                    console.log('hasDocument:', hasDocument);

                    if (hasDocument) {
                      // If we have a file URL, show the appropriate viewer
                      if (fileUrl) {
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
                            <div className="pdf-viewer" style={{ width: '100%', height: '780px' }}>
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
                              <div style={{ fontSize: '60px', marginBottom: '20px' }}>
                                {fileType === 'document' ? '📄' :
                                  fileType === 'spreadsheet' ? '📊' : '📁'}
                              </div>
                              <h4>Document Preview</h4>
                              <p>Click download to view this file</p>
                              {fileUrl ? (
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
                              ) : (
                                <button
                                  className="btn btn-secondary"
                                  disabled
                                  title="File URL not available"
                                >
                                  <i className="fas fa-download me-2"></i>
                                  File Not Available
                                </button>
                              )}
                            </div>
                          );
                        }
                      } else {
                        // Document exists but no file URL - show document uploaded message
                        return (
                          <div className="document-preview" style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ fontSize: '60px', marginBottom: '20px' }}>📄</div>
                            <h4>Document Uploaded</h4>
                            <p>Document is available for verification</p>
                            <p><strong>Status:</strong> {selectedDocument?.status}</p>
                          </div>
                        );
                      }
                    } else {
                      return (
                        <div className="no-document">
                          <i className="fas fa-file-times fa-3x text-muted mb-3"></i>
                          <p>No document uploaded</p>
                        </div>
                      );
                    }
                  })()}
                  {fileUrl && (
                    <div className="preview-controls">
                      <button className="control-btn" onClick={handleZoomIn}>
                        <i className="fas fa-search-plus"></i>
                      </button>
                      <button className="control-btn" onClick={handleZoomOut}>
                        <i className="fas fa-search-minus"></i>
                      </button>
                      <button className="control-btn" onClick={handleRotate}>
                        <i className="fas fa-redo"></i>
                      </button>
                      <button className="control-btn" onClick={handleReset}>
                        <i className="fas fa-compress"></i>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-document">
                  <i className="fas fa-file-times fa-3x text-muted mb-3"></i>
                  <p>No document uploaded</p>
                </div>
              )}
            </div>

            {/* document preview container  */}

            {selectedDocument.uploads && selectedDocument.uploads.length > 0 && (
              <div className="info-card mt-4">
                <h4>Document History</h4>
                <div className="document-history">
                  {selectedDocument.uploads && selectedDocument.uploads.map((upload, index) => (
                    <div key={index} className="history-item" style={{
                      display: 'block',
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      {/* Document Preview Thumbnail using iframe/img */}
                      <div className="history-preview" style={{ marginRight: '0px' }}>
                        {renderDocumentThumbnail(upload, true)}
                      </div>

                      {/* Document Info */}
                      <div className="history-info" style={{ flex: 1 }}>
                        {/* <div className="history-date" style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#495057',
                          marginBottom: '4px'
                        }}>
                          {formatDate(upload.uploadedAt)}
                        </div> */}
                        <div className="history-status">
                          <span className={`${getStatusBadgeClass(upload.status)}`} style={{
                            fontSize: '12px',
                            padding: '4px 8px'
                          }}>
                            {upload.status}
                          </span>
                        </div>
                        {upload.fileUrl && (
                          <div className="history-actions" style={{ marginTop: '8px' }}>
                            <a
                              href={upload.fileUrl}
                              download
                              className="btn btn-sm btn-outline-primary"
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                textDecoration: 'none'
                              }}
                            >
                              <i className="fas fa-download me-1"></i>
                              Download
                            </a>
                            {/* <button
                              className="btn btn-sm btn-outline-secondary ms-2"
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px'
                              }}
                              onClick={() => {
                                
                                setCurrentPreviewUpload(upload);
                              }}
                            >
                              <i className="fas fa-eye me-1"></i>
                              Preview
                            </button> */}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="document-info-section">
            <div className="info-card">
              <h4>Document Information</h4>
              <div className="info-row">
                <strong>Document Name:</strong> {selectedDocument.Name}
              </div>
              <div className="info-row">
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
        </div>
      </div>
    </div>
  );
});
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
        attributes: true,
        attributeFilter: ['class']
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [calculateWidth]);

  // Recalculate when dependencies change
  useEffect(() => {
    setTimeout(calculateWidth, 100);
  }, dependencies);

  return { widthRef, width };
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
const CRMDashboard = () => {

  const candidateRef = useRef();
  // Refs
  const addressInputRef = useRef(null);

  // 1. State
  const [verticalOptions, setVerticalOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [centerOptions, setCenterOptions] = useState([]);
  const [counselorOptions, setCounselorOptions] = useState([]);
  const [sources, setSources] = useState([]);

  // Google Maps initialization


  const fetchProfile = (id) => {
    console.log('fetchProfile called with id:', id);
    console.log('candidateRef.current:', candidateRef.current);
    if (candidateRef.current) {
      console.log('candidateRef.current exists, calling fetchProfile');
      candidateRef.current.fetchProfile(id);
    } else {
      console.log('candidateRef.current is null - this is the problem!');
    }
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
        const token = userData.token;
        const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
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


  const handleSaveCV = async () => {
    if (candidateRef.current) {
      const result = await candidateRef.current.handleSaveCV();

      console.log(result, 'result')
      if (result.isvalid === true) {
        // Find and update the candidate in allProfiles
        setAllProfiles(prevProfiles =>
          prevProfiles.map(profile => {
            if (profile._id === selectedProfile._id) {
              // Update the _candidate data with the updated profile from result
              return {
                ...profile,
                _candidate: result.data // result.data contains the updated candidate profile
              };
            }
            return profile;
          })
        );
        setOpenModalId(null);
        setSelectedProfile(null)
      }
    }
  };

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  // WhatsApp templates dropdown state
  const [showWhatsAppTemplates, setShowWhatsAppTemplates] = useState(false);
  const [whatsAppTemplates, setWhatsAppTemplates] = useState([]);
  const [isLoadingWhatsAppTemplates, setIsLoadingWhatsAppTemplates] = useState(false);
  const [whatsAppTemplatesError, setWhatsAppTemplatesError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templatePreview, setTemplatePreview] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showWhatsAppTemplates && !event.target.closest('.input-template')) {
        setShowWhatsAppTemplates(false);
      }
    };

    if (showWhatsAppTemplates) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showWhatsAppTemplates]);

  const fetchWhatsAppTemplates = async () => {
    try {
      setIsLoadingWhatsAppTemplates(true);
      setWhatsAppTemplatesError("");
      const response = await axios.get(`${backendUrl}/college/whatsapp/templates`, {
        headers: { 'x-auth': token }
      });
      const list = response?.data?.data || [];
      setWhatsAppTemplates(Array.isArray(list) ? list : []);
    } catch (error) {
      setWhatsAppTemplatesError("Failed to load WhatsApp templates.");
    } finally {
      setIsLoadingWhatsAppTemplates(false);
    }
  };

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
  const [showBranchModal, setShowBranchModal] = useState(false);
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


  //refer lead stats
  const [selectedConcernPerson, setSelectedConcernPerson] = useState(null);

  //filter stats
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubStatus, setFilterSubStatus] = useState('all');
  const [filterLeadStatus, setFilterLeadStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterCenter, setFilterCenter] = useState('all');
  const [filterVertical, setFilterVertical] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterSector, setFilterSector] = useState('all');
  const [filterCounselor, setFilterCounselor] = useState('all');
  const [filterConcernPerson, setFilterConcernPerson] = useState('all');
  const [filterDate, setFilterDate] = useState(new Date());
  const [selectedProfiles, setSelectedProfiles] = useState([]);


  //side pannel stats
  const [showPanel, setShowPanel] = useState('')
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  // Loading state for fetchProfileData
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isLoadingProfilesData, setIsLoadingProfilesData] = useState(false);

  // WhatsApp Panel states
  const [whatsappMessages, setWhatsappMessages] = useState([
    { id: 1, text: 'Hi, I am interested in your course', sender: 'lead', time: '10:25 AM', type: 'session' },
    { id: 2, text: 'Hello! Thank you for your interest. I would be happy to help you.', sender: 'agent', time: '10:26 AM', type: 'session' }
  ]);
  const [whatsappNewMessage, setWhatsappNewMessage] = useState('');
  const [selectedWhatsappTemplate, setSelectedWhatsappTemplate] = useState(null);
  const [showWhatsappTemplateMenu, setShowWhatsappTemplateMenu] = useState(false);
  const [showWhatsappEmojiPicker, setShowWhatsappEmojiPicker] = useState(false);
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(true); // Default true for demo
  const whatsappMessagesEndRef = useRef(null);
  const [whatsappTemplates, setWhatsappTemplates] = useState([]);


  // Fetch filter options from backend API on mount
  useEffect(() => {
    const initMap = () => {
      const options = {
        componentRestrictions: { country: "in" },
        fields: ["address_components", "geometry"],
        types: ["geocode"]
      };

      setTimeout(() => {
        if (addressInputRef.current && window.google) {
          const autocomplete = new window.google.maps.places.Autocomplete(
            addressInputRef.current,
            options
          );

          autocomplete.addListener("place_changed", function () {
            const place = autocomplete.getPlace();

            if (!place.geometry || !place.address_components) {
              alert("No details available for input: '" + place.name + "'");
              return;
            }

            const latitude = place.geometry.location.lat();
            const longitude = place.geometry.location.lng();

            let state = "";
            let city = "";
            let country = "";

            place.address_components.forEach(component => {
              const types = component.types;
              if (types.includes('administrative_area_level_1')) {
                state = component.long_name;
              }
              if (types.includes('locality') || types.includes('sublocality')) {
                city = component.long_name;
              }
              if (types.includes("country")) {
                country = component.long_name;
              }
            });

            const address = [city, state, country].filter(Boolean).join(", ");


            setCandidateFormData(prev => ({
              ...prev,
              personalInfo: {
                ...prev.personalInfo,
                currentAddress: {
                  ...prev.personalInfo.currentAddress,
                  fullAddress: address,
                  latitude: latitude.toString(),
                  longitude: longitude.toString(),
                  state,
                  city
                }
              }
            }));

            console.log("Selected Location:", {
              latitude,
              longitude,
              state,
              city, address
            });

            addressInputRef.current.value = place.formatted_address || place.name || "";
          });
        }
      }, 500);
    };

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyB7DDN_gUp2zyrlElXtYpjTEQobYiUB9Lg&callback=initMap&libraries=places&v=weekly';
      script.async = true;
      script.defer = true;
      window.initMap = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [showPanel]);

  useEffect(() => {
    console.log('CandidateRef initialized:', candidateRef.current);
  }, []);

  useEffect(() => {
    console.log('CandidateRef current changed:', candidateRef.current);
  }, [candidateRef.current]);


  useEffect(() => {
    console.log(counselorOptions, 'counselorOptions')
  }, [counselorOptions])

  const handleCheckboxChange = (profile, checked) => {
    if (checked) {
      setSelectedProfiles(prev => [...(Array.isArray(prev) ? prev : []), profile._id]);
    } else {
      setSelectedProfiles(prev => (Array.isArray(prev) ? prev : []).filter(id => id !== profile._id));
    }
  };


  const openUploadModal = (document) => {
    setSelectedDocumentForUpload(document);
    // setShowUploadModal(true);
    setSelectedFile(null);
    setUploadPreview(null);
    setUploadProgress(0);
    setIsUploading(false)
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedDocumentForUpload(null);
    setSelectedFile(null);
    setUploadPreview(null);
    setUploadProgress(0);
    setIsUploading(false);
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

  //  Simulate file upload with progress
  const handleFileUpload = async () => {
    if (!selectedFile || !selectedDocumentForUpload) return;

    console.log('selectedDocumentForUpload', selectedDocumentForUpload, 'selectedProfile', selectedProfile)

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
      console.log('selectedDocumentForUpload', selectedDocumentForUpload._id);

      const response = await axios.put(`${backendUrl}/college/upload_docs/${selectedProfile._id}`, formData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('response', response)

      if (response.data.status) {
        fetchLeadDetails()
        alert('Document uploaded successfully! Status: Pending Review');

        // Optionally refresh data here
        const closeButton = document.querySelector('#staticBackdrop .btn-close');
        if (closeButton) {
          closeButton.click();
        }
        // fetchProfileData()
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

  // Document functions
  // Fixed openDocumentModal function
  const openDocumentModal = (document) => {
    // Check if this is the same document that was already open
    const isSameDocument = selectedDocument && selectedDocument._id === document._id;

    setSelectedDocument(document);
    setShowDocumentModal(true);

    // Only reset zoom and rotation if it's a NEW document or first time opening modal
    if (!isSameDocument) {
      setDocumentZoom(1);
      setDocumentRotation(0);
      setIsNewModalOpen(true);
    } else {
      setIsNewModalOpen(false);
    }

    document.body?.classList.add('no-scroll');
  };

  const closeDocumentModal = useCallback(() => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
    setDocumentZoom(1);
    setDocumentRotation(0);
  }, []);
  // const closeDocumentModal = () => {
  //   setShowDocumentModal(false);
  //   setSelectedDocument(null);

  //   setIsNewModalOpen(false);
  //   // // Only reset when actually closing modal
  //   setDocumentZoom(1);
  //   setDocumentRotation(0);
  // };

  const zoomIn = () => {
    setDocumentZoom(prev => Math.min(prev + 0.1, 3)); // Max zoom 3x
  };

  const zoomOut = () => {
    setDocumentZoom(prev => Math.max(prev - 0.1, 0.5)); // Min zoom 0.5x
  };

  const rotateDocument = () => {
    setDocumentRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setDocumentZoom(1);
    setDocumentRotation(0);
  };

  const updateDocumentStatus = useCallback((uploadId, status, reason) => {
    console.log(`Updating document ${uploadId} to ${status}`);
    if (status === 'Rejected' && !reason?.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    alert(`Document ${status} successfully!`);
    closeDocumentModal();
  }, [closeDocumentModal]);

  // const updateDocumentStatus = (uploadId, status) => {
  //   // In real app, this would make an API call
  //   console.log(`Updating document ${uploadId} to ${status}`);
  //   if (status === 'Rejected' && !rejectionReason.trim()) {
  //     alert('Please provide a rejection reason');
  //     return;
  //   }
  //   alert(`Document ${status} successfully!`);
  //   closeDocumentModal();
  // };
  useEffect(() => {
    fetchSources();
  }, []);
  const fetchSources = async () => {
    try {
      const response = await fetch(`${backendUrl}/college/users/sources`, {
        method: 'GET',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status || data.success) {
        setSources(data.data || []);
      } else {
        console.error('Failed to fetch sources:', data.message);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
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
    // Ensure documents is always an array
    if (!Array.isArray(documents)) return [];
    if (statusFilter === 'all') return documents;

    return documents.filter(doc => {
      if (!doc.uploads || doc.uploads.length === 0) return statusFilter === 'none';

      const lastUpload = doc.uploads[doc.uploads.length - 1];
      if (!lastUpload || !lastUpload.status) return false;

      return lastUpload.status.toLowerCase() === statusFilter;
    });
  };


  const getDocumentCounts = (documents = []) => {
    // Ensure documents is always an array
    if (!Array.isArray(documents)) return {
      totalDocs: 0,
      uploadedDocs: 0,
      pendingDocs: 0,
      verifiedDocs: 0,
      rejectedDocs: 0
    };

    const totalDocs = documents.length;
    const uploadedDocs = documents.filter(doc => doc.uploads && doc.uploads.length > 0).length;
    const pendingDocs = documents.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Pending'
    ).length;
    const verifiedDocs = documents.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Verified'
    ).length;
    const rejectedDocs = documents.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Rejected'
    ).length;

    return { totalDocs, uploadedDocs, pendingDocs, verifiedDocs, rejectedDocs };
  };
  const DocumentControls = React.memo(({
    onZoomIn,
    onZoomOut,
    onRotate,
    onReset,
    onDownload,
    zoomLevel,
    fileType
  }) => {
    return (
      <div className="preview-controls">
        <button
          onClick={onZoomIn}
          className="control-btn"
          style={{ whiteSpace: 'nowrap' }}
          title="Zoom In"
        >
          <i className="fas fa-search-plus"></i> Zoom In
        </button>

        <button
          onClick={onZoomOut}
          className="control-btn"
          style={{ whiteSpace: 'nowrap' }}
          title="Zoom Out"
        >
          <i className="fas fa-search-minus"></i> Zoom Out
        </button>

        {/* Show rotation button only for images */}
        {fileType === 'image' && (
          <button
            onClick={onRotate}
            className="control-btn"
            style={{ whiteSpace: 'nowrap' }}
            title="Rotate 90°"
          >
            <i className="fas fa-redo"></i> Rotate
          </button>
        )}

        {/* Reset View Button */}
        <button
          onClick={onReset}
          className="control-btn"
          style={{ whiteSpace: 'nowrap' }}
          title="Reset View"
        >
          <i className="fas fa-sync-alt"></i> Reset
        </button>

        {/* Download Button */}
        <a
          href={onDownload}
          download
          className="control-btn"
          target="_blank"
          rel="noopener noreferrer"
          style={{ whiteSpace: 'nowrap', textDecoration: 'none' }}
          title="Download Document"
        >
          <i className="fas fa-download"></i> Download
        </a>

        {/* Zoom Level Indicator */}
        <div className="zoom-indicator" style={{
          fontSize: '12px',
          color: '#666',
          marginLeft: '10px',
          padding: '5px 10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>
    );
  });



  // Form state for candidate add leads
  const [centerId, setCenterId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [counselorId, setCounselorId] = useState('');
  const [registeredBy, setRegisteredBy] = useState('');

  const [candidateFormData, setCandidateFormData] = useState({
    // Basic Information
    name: '',
    mobile: '',
    email: '',
    sex: '',
    dob: '',
    whatsapp: '',
    showProfileForm: false,
    highestQualification: '',
    // Personal Info
    personalInfo: {
      currentAddress: {
        type: 'Point',
        coordinates: [0, 0],
        latitude: '',
        longitude: '',
        city: '',
        state: '',
        fullAddress: ''
      },

    },

  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({});

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [courses, setCourses] = useState([]);
  const [centers, setCenters] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  //course history
  const [courseHistory, setCourseHistory] = useState([]);
  const [jobHistory, setJobHistory] = useState([]);

  // Fetch courses, centers, and qualifications on component mount
  useEffect(() => {
    fetchFormData();

  }, []);

  const fetchFormData = async () => {
    try {
      setLoadingData(true);
      console.log("testing.......")
      // Fetch courses
      const coursesResponse = await axios.get(`${backendUrl}/college/all_courses`, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        }
      });
      console.log("coursesResponse", coursesResponse)

      // Fetch qualifications
      const qualificationsResponse = await axios.get(`${backendUrl}/candidate/api/highestQualifications`, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        }
      });



      if (coursesResponse.data.success) {
        setCourses(coursesResponse.data.data);
      }


      if (qualificationsResponse.data.status) {
        setQualifications(qualificationsResponse.data.data);
      }

    } catch (error) {
      console.error('Error fetching form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  //fetch centers
  useEffect(() => {
    fetchCentersByCourse(courseId);
  }, [courseId]);


  const fetchCentersByCourse = async (courseId) => {
    try {
      if (!courseId) {
        setCenters([]);
        return;
      }

      console.log("courseId", courseId)


      const response = await axios.get(`${backendUrl}/college/courses/course_centers?courseId=${courseId}`, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        }
      });

      console.log("centersResponse", response);

      if (response.data.status) {
        setCenters(response.data.data);
      } else {
        setCenters([]);
      }
    } catch (error) {
      console.error('Error fetching centers by course:', error);
      setCenters([]);
    } finally {
    }
  };

  // Form submission handler
  const handleAddLeadsB2C = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Prepare the data according to the API structure
      const requestData = {
        courseId,
        centerId,
        counselorId,
        candidateData: {
          name: candidateFormData.name,
          mobile: candidateFormData.mobile,
          email: candidateFormData.email,
          sex: candidateFormData.sex,
          dob: candidateFormData.dob,
          whatsapp: candidateFormData.whatsapp,
          highestQualification: candidateFormData.highestQualification,
          personalInfo: {
            currentAddress: {
              fullAddress: candidateFormData.personalInfo.currentAddress.fullAddress,
              city: candidateFormData.personalInfo.currentAddress.city,
              state: candidateFormData.personalInfo.currentAddress.state,
              latitude: candidateFormData.personalInfo.currentAddress.latitude,
              longitude: candidateFormData.personalInfo.currentAddress.longitude,
              type: candidateFormData.personalInfo.currentAddress.type,
              coordinates: candidateFormData.personalInfo.currentAddress.coordinates
            }

          }
        },
        registeredBy,
      };

      console.log('Submitting data:', requestData);

      // Make API call

      const response = await axios.post(`${backendUrl}/college/courses/addleadsb2c`, requestData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        }
      });

      console.log('API Response:', response);
      if (response.data.status) {
        alert("Lead added successfully");

        // Reset all form fields
        setCandidateFormData({
          name: '',
          mobile: '',
          email: '',
          sex: '',
          dob: '',
          whatsapp: '',
          showProfileForm: false,
          personalInfo: {
            currentAddress: {
              type: 'Point',
              coordinates: [0, 0],
              latitude: '',
              longitude: '',
              city: '',
              state: '',
              fullAddress: ''
            }

          },

          highestQualification: '',

        });

        // Reset form selection fields
        setCourseId('');
        setCenterId('');
        setCounselorId('');
        setRegisteredBy('');
      }
      else {
        alert(response.data.message);
      }

    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {

      setIsSubmitting(false);
      closePanel();

      fetchProfileData();
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setCandidateFormData(prev => ({
      ...prev,
      [field]: value
    }));

  };

  // Handle nested input changes
  const handleNestedInputChange = (parentField, childField, value) => {
    setCandidateFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  const handleFormDataChange = (field, value) => {
    setCandidateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  // Form data state
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
    },
    sector: {
      type: "includes",
      values: []
    },
  });

  // Dropdown open state
  const [dropdownStates, setDropdownStates] = useState({
    projects: false,
    verticals: false,
    course: false,
    center: false,
    counselor: false,
    sector: false,
    statuses: false,
    subStatuses: false
  });



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

  // Add this useEffect to handle clicking outside to close dropdowns
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

  useEffect(() => {
    fetchCourseHistory();
    console.log("courseHistory", courseHistory)
  }, [selectedProfile]);

  useEffect(() => {
    fetchJobHistory();
  }, [selectedProfile]);

  const fetchCourseHistory = async () => {
    try {

      if (!selectedProfile) {
        return;
      }
      setCourseHistory([]);
      const response = await axios.get(`${backendUrl}/college/candidate/appliedCourses/${selectedProfile._candidate._id}`, {
        headers: { 'x-auth': token }
      });
      // console.log("response", response);
      if (response.data && response.data.courses) {
        setCourseHistory(response.data.courses);
      }
    } catch (error) {
      console.log("error", error);
    }
  }

  const fetchJobHistory = async () => {
    try {

      if (!selectedProfile) {
        return;
      }
      setJobHistory([]);
      const response = await axios.get(`${backendUrl}/college/candidate/appliedJobs/${selectedProfile._candidate._id}`, {
        headers: { 'x-auth': token }
      });
      console.log("response", response);
      if (response.data && response.data.jobs) {
        setJobHistory(response.data.jobs);
      }
    } catch (error) {
      console.log("error", error);
    }
  }


  // Calculate total selected filters
  const totalSelected = Object.values(formData).reduce((total, filter) => total + (filter.values.length || 0), 0);

  // Document Modal Component

  const UploadModal = () => {
    if (!showUploadModal || !selectedDocumentForUpload) return null;

    return (
      <div className="upload-modal-overlay" onClick={closeUploadModal}>
        <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="upload-modal-header">
            <h3>
              <i className="fas fa-cloud-upload-alt me-2"></i>
              Upload {selectedDocumentForUpload.Name}
            </h3>
            <button className="close-btn" onClick={closeUploadModal}>&times;</button>
          </div>

          <div className="upload-modal-body">
            <div className="upload-section">
              {!selectedFile ? (
                <div className="file-drop-zone">
                  <div className="drop-zone-content">
                    <i className="fas fa-cloud-upload-alt upload-icon"></i>
                    <h4>Choose a file to upload</h4>
                    <p>Drag and drop a file here, or click to select</p>
                    <div className="file-types">
                      <span>Supported: JPG, PNG, GIF, PDF</span>
                      <span>Max size: 10MB</span>
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        fileInputRef.current?.click(); // Use ref instead of getElementById
                      }}
                    // onClick={() => document.getElementById('file-input').click()}
                    >
                      <i className="fas fa-folder-open me-2"></i>
                      Choose File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="file-preview-section">
                  <div className="selected-file-info">
                    <h4>Selected File:</h4>
                    <div className="file-details">
                      <div className="file-icon">
                        <i className={`fas ${selectedFile.type.startsWith('image/') ? 'fa-image' : 'fa-file-pdf'}`}></i>
                      </div>
                      <div className="file-info">
                        <p className="file-name">{selectedFile.name}</p>
                        <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
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
                    <div className="upload-preview">
                      <h5>Preview:</h5>
                      <img src={uploadPreview} alt="Upload Preview" className="preview-image" />
                    </div>
                  )}

                  {isUploading && (
                    <div className="upload-progress-section">
                      <h5>Uploading...</h5>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p>{uploadProgress}% Complete</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="upload-modal-footer">
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
    );
  };
  //Pagination

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

  useEffect(() => {
    getPaginationPages()
  }, [totalPages])




  //Date picker
  const today = new Date();  // Current date


  // Toggle POPUP

  const togglePopup = (profileIndex) => {
    setShowPopup(prev => prev === profileIndex ? null : profileIndex);
  };

  // Filter state from Registration component
  const [filterData, setFilterData] = useState({
    name: '',
    courseType: '',
    status: 'true',
    leadStatus: '',
    sector: '',
    // Date filter states
    createdFromDate: null,
    createdToDate: null,
    modifiedFromDate: null,
    modifiedToDate: null,
    nextActionFromDate: null,
    nextActionToDate: null,
    subStatuses: null,
    statuses: null,

  });
  // Add dropdown visibility states
  const [showCreatedDatePicker, setShowCreatedDatePicker] = useState(false);
  const [showModifiedDatePicker, setShowModifiedDatePicker] = useState(false);
  const [showNextActionDatePicker, setShowNextActionDatePicker] = useState(false);

  const [crmFilters, setCrmFilters] = useState([
    { _id: '', name: '', count: 0, milestone: '' },

  ]);
  const [statuses, setStatuses] = useState([
    { _id: '', name: '', count: 0 },

  ]);

  // edit status and set followup
  const [seletectedStatus, setSelectedStatus] = useState('');
  const [seletectedSubStatus, setSelectedSubStatus] = useState(null);
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');
  const [remarks, setRemarks] = useState('');


  const [subStatuses, setSubStatuses] = useState([]);

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;

  const { navRef, navHeight } = useNavHeight([isFilterCollapsed, crmFilters]);
  const { isScrolled, scrollY, contentRef } = useScrollBlur(navHeight);
  const blurIntensity = Math.min(scrollY / 10, 15);
  const navbarOpacity = Math.min(0.85 + scrollY / 1000, 0.98);
  const { widthRef, width } = useMainWidth([isFilterCollapsed, crmFilters, mainContentClass]);
  const tabs = [
    'Lead Details',
    'Profile',
    'Job History',
    'Course History',
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
    if (seletectedStatus || filterData.statuses) {
      fetchSubStatus()
    }
  }, [seletectedStatus, filterData.statuses]);



  //Advance filter




  // Date range handlers
  const handleDateFilterChange = (date, fieldName) => {
    const newFilterData = {
      ...filterData,
      [fieldName]: date
    };
    setFilterData(newFilterData);
  };
  const formatDate = (date) => {
    // If the date is not a valid Date object, try to convert it
    if (date && !(date instanceof Date)) {
      date = new Date(date);
    }

    // Check if the date is valid
    if (!date || isNaN(date)) return ''; // Return an empty string if invalid

    // Now call toLocaleDateString
    return date.toLocaleDateString('en-GB');
  };



  // 5. Clear functions
  const clearDateFilter = (filterType) => {
    let newFilterData = { ...filterData };

    if (filterType === 'created') {
      newFilterData.createdFromDate = null;
      newFilterData.createdToDate = null;
    } else if (filterType === 'modified') {
      newFilterData.modifiedFromDate = null;
      newFilterData.modifiedToDate = null;
    } else if (filterType === 'nextAction') {
      newFilterData.nextActionFromDate = null;
      newFilterData.nextActionToDate = null;
    }

    setFilterData(newFilterData);

  };



  //
  const clearAllFilters = () => {
    const clearedFilters = {
      name: '',
      courseType: '',
      status: 'true',
      leadStatus: '',
      sector: '',
      createdFromDate: null,
      createdToDate: null,
      modifiedFromDate: null,
      modifiedToDate: null,
      nextActionFromDate: null,
      nextActionToDate: null,
      subStatuses: null,
      statuses: null,
    };

    setFilterData(clearedFilters);
    setFormData({
      projects: { type: "includes", values: [] },
      verticals: { type: "includes", values: [] },
      course: { type: "includes", values: [] },
      center: { type: "includes", values: [] },
      counselor: { type: "includes", values: [] },
      sector: { type: "includes", values: [] },
    });

    setCurrentPage(1);
    // Explicitly call fetchProfileData with cleared filters to ensure data is fetched
    fetchProfileData(clearedFilters, 1);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };



  const handleTimeChange = (e) => {
    if (!followupDate) {
      alert('Select date first');
      return;  // Yahan return lagao
    }

    const time = e.target.value; // "HH:mm"

    const [hours, minutes] = time.split(':');

    const selectedDateTime = new Date(followupDate);
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
    setFollowupTime(time);
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
      const response = await axios.get(`${backendUrl}/college/status`, {
        headers: { 'x-auth': token }
      });

      console.log('response', response)

      if (response.data.success) {
        const status = response.data.data;
        const allFilter = { _id: 'all', name: 'All' };


        setCrmFilters([allFilter, ...status.map(r => ({
          _id: r._id,
          name: r.title,
          milestone: r.milestone,  // agar backend me count nahi hai to 0
        }))]);

        setStatuses(status.map(r => ({
          _id: r._id,
          name: r.title,
          count: r.count || 0,  // agar backend me count nahi hai to 0
        })));


      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch Status');
    }
  };

  const handleMoveToKyc = async (profile) => {
    console.log('Function called');
    try {

      console.log('Function in try');

      if (profile?._course?.center || profile?._course?.center?.length > 0) {
        if (!profile._center || !profile._center._id) {
          alert('Please assign a branch/center first before moving to KYC!');
          return;
        }
      }


      // Prepare the request body
      const updatedData = {
        kycStage: true
      };

      // Send PUT request to backend API
      const response = await axios.put(`${backendUrl}/college/update/${profile._id}`, updatedData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        }
      });

      console.log('API response:', response.data);

      if (response.data.success) {
        alert('Lead moved to KYC Section successfully!');
        // Optionally refresh data here
        fetchProfileData()
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // alert('An error occurred while updating status');
    }
  };

  const fetchSubStatus = async () => {
    try {
      const status = seletectedStatus || filterData.statuses;

      if (!status) {
        alert('Please select a status');
        return;
      }
      const response = await axios.get(`${backendUrl}/college/status/${status}/substatus`, {
        headers: { 'x-auth': token }
      });

      console.log('response', response)

      if (response.data.success) {
        const status = response.data.data;


        setSubStatuses(response.data.data);


      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch SubStatus');
    }
  };

  // Helper function to check if fields are required
  const isFieldRequired = (fieldType) => {
    if (showPanel === 'followUp') {
      return true; // All fields are required in followup panel
    }

    if (seletectedSubStatus) {
      if (fieldType === 'remarks') {
        return seletectedSubStatus.hasRemarks;
      }
      if (fieldType === 'followup') {
        return seletectedSubStatus.hasFollowup;
      }
    }

    return false;
  };

  // Helper function to get CSS class for required fields
  const getRequiredFieldClass = (fieldType) => {
    const isRequired = isFieldRequired(fieldType);
    return isRequired ? 'border-danger' : '';
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    try {
      if (showPanel === 'bulkstatuschange') {
        // Validation checks
        if (!selectedProfiles) {
          alert('No profile selected');
          return;
        }

        if (!seletectedStatus) {
          alert('Please select a status');
          return;
        }

        // Check for mandatory remarks and followup
        const hasRemarksRequired = seletectedSubStatus && seletectedSubStatus.hasRemarks;
        const hasFollowupRequired = seletectedSubStatus && seletectedSubStatus.hasFollowup;

        if (hasRemarksRequired && (!remarks || remarks.trim() === '')) {
          alert('Remarks are mandatory for this status. Please add remarks.');
          return;
        }

        if (hasFollowupRequired && (!followupDate || !followupTime)) {
          alert('Followup date and time are mandatory for this status. Please select followup date and time.');
          return;
        }


        // Prepare the request body
        const data = {
          selectedProfiles,
          _leadStatus: typeof seletectedStatus === 'object' ? seletectedStatus._id : seletectedStatus,
          _leadSubStatus: seletectedSubStatus?._id || null,
          remarks: remarks || ''
        };

        // Check if backend URL and token exist
        if (!backendUrl) {
          alert('Backend URL not configured');
          return;
        }

        if (!token) {
          alert('Authentication token missing');
          return;
        }

        // Send PUT request to backend API
        const response = await axios.put(
          `${backendUrl}/college/lead/bulk_status_change`,
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

          // Reset form
          setSelectedStatus('');
          setSelectedSubStatus(null);
          setFollowupDate('');
          setFollowupTime('');
          setRemarks('');

          // Refresh data and close panel
          await fetchProfileData();
          closePanel();
        } else {
          console.error('API returned error:', response.data);
          alert(response.data.message || 'Failed to update status');
        }

      }
      if (showPanel === 'editPanel') {
        // Validation checks
        if (!selectedProfile || !selectedProfile._id) {
          alert('No profile selected');
          return;
        }

        if (!seletectedStatus) {
          alert('Please select a status');
          return;
        }

        // Check for mandatory remarks and followup
        const hasRemarksRequired = seletectedSubStatus && seletectedSubStatus.hasRemarks;
        const hasFollowupRequired = seletectedSubStatus && seletectedSubStatus.hasFollowup;

        if (hasRemarksRequired && (!remarks || remarks.trim() === '')) {
          alert('Remarks are mandatory for this status. Please add remarks.');
          return;
        }

        if (hasFollowupRequired && (!followupDate || !followupTime)) {
          alert('Followup date and time are mandatory for this status. Please select followup date and time.');
          return;
        }

        // Combine date and time into a single Date object (if both are set)
        let followupDateTime = '';
        if (followupDate && followupTime) {
          // Create proper datetime string
          const year = followupDate.getFullYear();
          const month = String(followupDate.getMonth() + 1).padStart(2, "0");
          const day = String(followupDate.getDate()).padStart(2, "0");

          const dateStr = `${year}-${month}-${day}`;

          followupDateTime = new Date(`${dateStr}T${followupTime}`);

          // Validate the datetime
          if (isNaN(followupDateTime.getTime())) {
            alert('Invalid date/time combination');
            return;
          }
        }

        // Prepare the request body
        const data = {
          _leadStatus: typeof seletectedStatus === 'object' ? seletectedStatus._id : seletectedStatus,
          _leadSubStatus: seletectedSubStatus?._id || null,
          followup: followupDateTime ? followupDateTime.toISOString() : null,
          remarks: remarks || ''
        };



        // Check if backend URL and token exist
        if (!backendUrl) {
          alert('Backend URL not configured');
          return;
        }

        if (!token) {
          alert('Authentication token missing');
          return;
        }

        // Send PUT request to backend API
        const response = await axios.put(
          `${backendUrl}/college/lead/status_change/${selectedProfile._id}`,
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

          // Reset form
          setSelectedStatus('');
          setSelectedSubStatus(null);
          setFollowupDate('');
          setFollowupTime('');
          setRemarks('');

          // Refresh data and close panel
          await fetchProfileData();
          closePanel();
        } else {
          console.error('API returned error:', response.data);
          alert(response.data.message || 'Failed to update status');
        }

      }
      if (showPanel === 'followUp') {
        // Validation checks for followup panel
        if (!followupDate || !followupTime) {
          alert('Followup date and time are mandatory. Please select both date and time.');
          return;
        }

        if (!remarks || remarks.trim() === '') {
          alert('Remarks are mandatory for followup. Please add remarks.');
          return;
        }

        // Combine date and time into a single Date object (if both are set)
        let followupDateTime = '';
        if (followupDate && followupTime) {

          console.log('followupDate', followupDate)
          console.log('followupTime', followupTime)
          // Create proper datetime string
          const year = followupDate.getFullYear();
          const month = String(followupDate.getMonth() + 1).padStart(2, "0");
          const day = String(followupDate.getDate()).padStart(2, "0");

          const dateStr = `${year}-${month}-${day}`;

          console.log('dateStr', dateStr)

          followupDateTime = new Date(`${dateStr}T${followupTime}`);
          console.log('followupDateTime', followupDateTime)

          // Validate the datetime
          if (isNaN(followupDateTime.getTime())) {
            alert('Invalid date/time combination');
            return;
          }
        }

        // Prepare the request body
        const data = {
          followup: followupDateTime ? followupDateTime.toISOString() : null,
          remarks: remarks || ''
        };



        // Check if backend URL and token exist
        if (!backendUrl) {
          alert('Backend URL not configured');
          return;
        }

        if (!token) {
          alert('Authentication token missing');
          return;
        }

        // Send PUT request to backend API
        // const response = await axios.put(
        //   `${backendUrl}/college/lead/status_change/${selectedProfile._id}`,
        //   data,
        //   {
        //     headers: {
        //       'x-auth': token,
        //       'Content-Type': 'application/json'
        //     }
        //   }
        // );
        const response = await axios.post(
          `${backendUrl}/college/b2c-set-followups`,
          { appliedCourseId: selectedProfile._id, followupDate: followupDateTime, remarks: remarks },
          {
            headers: {
              'x-auth': token,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('API response:', response.data);

        if (response.data.success) {
          alert('Status updated successfully!');

          // Reset form

        } else {
          console.error('API returned error:', response.data);
          alert(response.data.message || 'Failed to update status');
        }

      }
    }
    catch (error) {
      console.error('Error updating status:', error);

      // More detailed error handling
      if (error.response) {
        // Server responded with error status
        console.error('Error Response:', error.response.data);
        console.error('Error Status:', error.response.status);
        alert(`Server Error: ${error.response.data.message || 'Failed to update status'}`);
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        alert('Network error: Unable to reach server');
      } else {
        // Something else happened
        console.error('Error:', error.message);
        alert(`Error: ${error.message}`);
      }
    }
    finally {
      setSelectedStatus('');
      setSelectedSubStatus(null);
      setFollowupDate('');
      setFollowupTime('');
      setRemarks('');

      // Refresh data and close panel
      await fetchProfileData();
    }
  };

  const getBranches = async (profile) => {
    // Check if profile and course exist
    if (!profile || !profile._course || !profile._course._id) {
      alert('Profile or course information is missing. Cannot fetch branches.');
      return;
    }

    const courseId = profile._course._id;
    const response = await axios.get(`${backendUrl}/college/courses/get-branches?courseId=${courseId}`, {
      headers: {
        'x-auth': token,
        'Content-Type': 'multipart/form-data',
      }
    });
    console.log('res..', response)
    if (response.data.status) {
      setBranches(response.data);
      setSelectedBranch('');
    } else {
      alert('Failed to fetch branches');
    }
  }

  const updateBranch = async (profile, selectedBranchId) => {
    console.log("updateBranch")
    if (!selectedBranchId) {
      alert('Please select a branch first');
      return;
    }

    const profileId = profile._id;
    console.log("profile", profileId)
    console.log("profileId", profileId)
    console.log("selectedBranchId", selectedBranchId)

    try {
      const response = await axios.put(`${backendUrl}/college/courses/update-branch/${profileId}`, {
        centerId: selectedBranchId
      }, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        }
      });
      console.log('response', response)
      if (response.data.success) {
        alert('Branch updated successfully!');
        // Optionally refresh the data or close modal
        setShowBranchModal(false);

        // const selectedBranchDetails = branches.data?.find(branch => branch._id === selectedBranchId);
        // setAllProfiles(prevProfiles => 
        //   prevProfiles.map(p => 
        //     p._id === profile._id 
        //       ? {
        //           ...p,
        //           _center: selectedBranchDetails || { _id: selectedBranchId, name: 'Updated Branch' }
        //         }
        //       : p
        //   )
        // );

        setSelectedBranch('');



        await fetchProfileData();
      } else {
        alert('Failed to update branch');
      }
    } catch (error) {
      console.error('Error updating branch:', error);
      alert('Failed to update branch: ' + (error.response?.data?.message || error.message));
    }
  }



  const [user, setUser] = useState({
    image: '',
    name: 'John Doe'
  });

  // Inside CRMDashboard component:



  useEffect(() => {
    fetchProfileData(filterData, currentPage);
  }, [currentPage]);

  // Add this function in your component:
  const updateCrmFiltersFromBackend = (backendCounts) => {
    console.log('Backend counts received:', backendCounts);

    setCrmFilters(prevFilters => {
      return prevFilters.map(filter => {
        if (filter._id === 'all') {
          return { ...filter, count: backendCounts.all || 0 };
        }

        const backendFilter = backendCounts[filter._id];
        if (backendFilter) {
          return {
            ...filter,
            count: backendFilter.count || 0,
            milestone: backendFilter.milestone
          };
        }

        return { ...filter, count: 0 };
      });
    });
  };

  const fetchProfileData = async (filters = filterData, page = currentPage) => {
    setIsLoadingProfiles(true);
    closePanel();
    setLeadDetailsVisible(null);
    fetchRegistrationCrmFilterCounts();

    if (!token) {
      console.warn('No token found in session storage.');
      setIsLoadingProfiles(false);
      return;
    }

    // Prepare query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...(filters.name && { name: filters.name }),
      ...(filters.courseType && { courseType: filters.courseType }),
      ...(filters.status && filters.status !== 'true' && { status: filters.status }),
      ...(filters.leadStatus && { leadStatus: filters.leadStatus }),
      ...(filters.sector && { sector: filters.sector }),
      ...(filters.createdFromDate && { createdFromDate: filters.createdFromDate.toISOString() }),
      ...(filters.createdToDate && { createdToDate: filters.createdToDate.toISOString() }),
      ...(filters.modifiedFromDate && { modifiedFromDate: filters.modifiedFromDate.toISOString() }),
      ...(filters.modifiedToDate && { modifiedToDate: filters.modifiedToDate.toISOString() }),
      ...(filters.nextActionFromDate && { nextActionFromDate: filters.nextActionFromDate.toISOString() }),
      ...(filters.nextActionToDate && { nextActionToDate: filters.nextActionToDate.toISOString() }),
      ...(filters.subStatuses && { subStatuses: filters.subStatuses }),
      // Multi-select filters
      ...(formData.projects.values.length > 0 && { projects: JSON.stringify(formData.projects.values) }),
      ...(formData.verticals.values.length > 0 && { verticals: JSON.stringify(formData.verticals.values) }),
      ...(formData.course.values.length > 0 && { course: JSON.stringify(formData.course.values) }),
      ...(formData.center.values.length > 0 && { center: JSON.stringify(formData.center.values) }),
      ...(formData.counselor.values.length > 0 && { counselor: JSON.stringify(formData.counselor.values) })
    });

    try {

      // console.log('API counselor:', formData.counselor.values);

      const response = await axios.get(`${backendUrl}/college/appliedCandidates?${queryParams}`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success && response.data.data) {
        const data = response.data;
        console.log('data', data);
        // Sirf ek state me data set karo - paginated data
        setAllProfiles(data.data);
        setTotalPages(data.totalPages);
        setPageSize(data.limit);

        // Update CRM filter counts from backend
        // if (data.crmFilterCounts) {
        //   updateCrmFiltersFromBackend(data.crmFilterCounts);
        // }
      } else {
        console.error('Failed to fetch profile data', response.data.message);
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoadingProfiles(false);


    }
  };

  const downloadLeads = async (filters = filterData, page = currentPage) => {


    if (!token) {
      console.warn('No token found in session storage.');
      return;
    }

    // Prepare query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      leadStatus: crmFilters[activeCrmFilter]._id,
      ...(filters.name && { name: filters.name }),
      ...(filters.courseType && { courseType: filters.courseType }),
      ...(filters.status && filters.status !== 'true' && { status: filters.status }),

      ...(filters.sector && { sector: filters.sector }),
      ...(filters.createdFromDate && { createdFromDate: filters.createdFromDate.toISOString() }),
      ...(filters.createdToDate && { createdToDate: filters.createdToDate.toISOString() }),
      ...(filters.modifiedFromDate && { modifiedFromDate: filters.modifiedFromDate.toISOString() }),
      ...(filters.modifiedToDate && { modifiedToDate: filters.modifiedToDate.toISOString() }),
      ...(filters.nextActionFromDate && { nextActionFromDate: filters.nextActionFromDate.toISOString() }),
      ...(filters.nextActionToDate && { nextActionToDate: filters.nextActionToDate.toISOString() }),
      ...(filters.subStatuses && { subStatuses: filters.subStatuses }),
      // Multi-select filters
      ...(formData.projects.values.length > 0 && { projects: JSON.stringify(formData.projects.values) }),
      ...(formData.verticals.values.length > 0 && { verticals: JSON.stringify(formData.verticals.values) }),
      ...(formData.course.values.length > 0 && { course: JSON.stringify(formData.course.values) }),
      ...(formData.center.values.length > 0 && { center: JSON.stringify(formData.center.values) }),
      ...(formData.counselor.values.length > 0 && { counselor: JSON.stringify(formData.counselor.values) })
    });

    try {

      // console.log('API counselor:', formData.counselor.values);

      const response = await axios.get(
        `${backendUrl}/college/downloadleads?${queryParams}`,
        {
          headers: { 'x-auth': token },
          responseType: "blob"   // 👈 yeh zaroori hai
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads.csv";
      a.click();



    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };
  const fetchRegistrationCrmFilterCounts = async (filters = filterData, page = currentPage) => {

    if (!token) {
      console.warn('No token found in session storage.');
      setIsLoadingProfiles(false);
      return;
    }

    // Prepare query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...(filters.name && { name: filters.name }),
      ...(filters.courseType && { courseType: filters.courseType }),
      ...(filters.status && filters.status !== 'true' && { status: filters.status }),
      ...(filters.leadStatus && { leadStatus: filters.leadStatus }),
      ...(filters.sector && { sector: filters.sector }),
      ...(filters.createdFromDate && { createdFromDate: filters.createdFromDate.toISOString() }),
      ...(filters.createdToDate && { createdToDate: filters.createdToDate.toISOString() }),
      ...(filters.modifiedFromDate && { modifiedFromDate: filters.modifiedFromDate.toISOString() }),
      ...(filters.modifiedToDate && { modifiedToDate: filters.modifiedToDate.toISOString() }),
      ...(filters.nextActionFromDate && { nextActionFromDate: filters.nextActionFromDate.toISOString() }),
      ...(filters.nextActionToDate && { nextActionToDate: filters.nextActionToDate.toISOString() }),
      ...(filters.subStatuses && { subStatuses: filters.subStatuses }),
      // Multi-select filters
      ...(formData.projects.values.length > 0 && { projects: JSON.stringify(formData.projects.values) }),
      ...(formData.verticals.values.length > 0 && { verticals: JSON.stringify(formData.verticals.values) }),
      ...(formData.course.values.length > 0 && { course: JSON.stringify(formData.course.values) }),
      ...(formData.center.values.length > 0 && { center: JSON.stringify(formData.center.values) }),
      ...(formData.counselor.values.length > 0 && { counselor: JSON.stringify(formData.counselor.values) })
    });

    try {

      console.log('API counselor:', formData.counselor.values);

      const response = await axios.get(`${backendUrl}/college/registrationCrmFilterCounts?${queryParams}`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success && response.data) {
        const data = response.data;
        console.log('crm filter count', data);
        updateCrmFiltersFromBackend(data.crmFilterCount)

      } else {
        console.error('Failed to fetch crm filter counts', response.data.message);
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  useEffect(() => {

    fetchLeadDetails();
  }, [leadDetailsVisible]);

  const fetchLeadDetails = async () => {
    if (leadDetailsVisible === null || leadDetailsVisible === undefined) {
      return;
    }
    try {
      setIsLoadingProfilesData(true);
      const leadId = allProfiles[leadDetailsVisible]._id;
      console.log('leadId', leadId)
      const response = await axios.get(`${backendUrl}/college/appliedCandidatesDetails?leadId=${leadId}`, {
        headers: { 'x-auth': token }
      });
      console.log("leadDetailsVisible", response)

      if (response.data.success && response.data.data) {
        const data = response.data;
        console.log('data', data)


        // Sirf ek state me data set karo - paginated data
        if (!isLoadingProfiles) {
          allProfiles[leadDetailsVisible] = data.data;
        }


      } else {
        console.error('Failed to fetch profile data', response.data.message);
      }
    }
    catch (error) {
      console.error('Error fetching profile data:', error);
    }
    finally {
      setIsLoadingProfilesData(false);
    }
  }
  const fetchJobs = async () => {
    const response = await axios.get(`${backendUrl}/college/appliedJobs`, {
      headers: { 'x-auth': token }
    });
    console.log('jobs', response)
  }

  const [experiences, setExperiences] = useState([{
    jobTitle: '',
    companyName: '',
    from: null,
    to: null,
    jobDescription: '',
    currentlyWorking: false
  }]);



  useEffect(() => {
    // Initialize circular progress
    const containers = document.querySelectorAll('.circular-progress-container');
    containers.forEach(container => {
      const percent = container.getAttribute('data-percent');
      const circle = container.querySelector('circle.circle-progress');
      const progressText = container.querySelector('.progress-text');

      if (circle && progressText) {
        if (percent === 'NA' || percent === null || percent === undefined) {
          // Handle NA case
          circle.style.strokeDasharray = 0;
          circle.style.strokeDashoffset = 0;
          progressText.innerText = 'NA';
        } else {
          // Handle numeric percentage
          const radius = 16;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference - (percent / 100) * circumference;

          circle.style.strokeDasharray = circumference;
          circle.style.strokeDashoffset = offset;
          progressText.innerText = percent + '%';
        }
      }
    });
  }, [allProfiles]);

  // Fetch applied jobs on component mount
  useEffect(() => {
    fetchJobs(1);
  }, []);

  // यह logs add करें अपने code में
  useEffect(() => {
    console.log('Current State:', {
      totalProfiles: allProfiles.length,
      totalPages: totalPages,
      currentPage: currentPage,
      pageSize: pageSize
    });
  }, [allProfiles, totalPages, currentPage, pageSize]);




  const handleTabClick = (profileIndex, tabIndex, profile) => {
    setSelectedProfile(profile)
    setActiveTab(prevTabs => ({
      ...prevTabs,
      [profileIndex]: tabIndex
    }));
  };

  // const handleTabClick = (index) => {
  //   setActiveTab(index);
  //   console.log('Tab clicked:', index);
  // };

  const handleFilterChange = (e) => {
    try {
      const { name, value } = e.target;
      const newFilterData = { ...filterData, [name]: value };
      setFilterData(newFilterData);
    } catch (error) {
      console.error('Filter change error:', error);
    }
  };




  const handleCriteriaChange = (criteria, values) => {

    setFormData((prevState) => ({
      ...prevState,
      [criteria]: {
        type: "includes",
        values: values
      }
    }));
    console.log(`Selected ${criteria}:`, values);
    // Reset to first page and fetch with new filters
  };



  const handleCrmFilterClick = async (index) => {
    setActiveCrmFilter(index);
    setCurrentPage(1);

    let newFilterData = { ...filterData };

    if (index !== 0) {
      newFilterData.leadStatus = crmFilters[index]._id;
    } else {
      // Remove leadStatus filter for "All"
      delete newFilterData.leadStatus;
    }

    setFilterData(newFilterData);
    fetchProfileData(newFilterData, 1);
  };





  const openEditPanel = async (profile = null, panel) => {
    console.log('panel', panel);
    setSelectedProfile(null)
    setShowPanel('')
    setSelectedStatus(null)
    setSelectedSubStatus(null)


    if (profile) {
      setSelectedProfile(profile);
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
    }
  };


  const closePanel = () => {
    setShowPanel('');
    setShowPopup(null);
    setSelectedConcernPerson(null);
    setSelectedProfiles(null);
    setSelectedProfile(null);
    setSelectedStatus(null)
    setSelectedSubStatus(null)
    if (!isMobile) {
      setMainContentClass('col-12');
    }
  };



  const openPanel = async (profile = null, panel) => {
    console.log('panel', panel);

    if (profile) {
      setSelectedProfile(profile);


    }

    setShowPopup(null)

    if (panel === 'RefferAllLeads') {

      setShowPanel('RefferAllLeads');

    } else if (panel === 'Reffer') {
      setShowPanel('Reffer');
    } else if (panel === 'AddAllLeads') {
      setShowPanel('AddAllLeads');
    } else if (panel === 'whatsapp') {
      setShowPanel('Whatsapp');
    }

    if (!isMobile) {
      setMainContentClass('col-8');
    }


  };
  const handleFetchCandidate = async (profile = null) => {
    console.log('handleFetchCandidate called with profile:', profile);
    setShowPopup(null)
    setSelectedProfile(profile)
    setOpenModalId(profile._id);
    console.log('openModalId set to:', profile._id);
  }

  useEffect(() => {
    console.log('useEffect triggered with selectedProfile:', selectedProfile);
    if (selectedProfile && selectedProfile._candidate && selectedProfile._candidate._id) {
      console.log('About to call fetchProfile with candidate ID:', selectedProfile._candidate._id);
      fetchProfile(selectedProfile._candidate._id);
    } else {
      console.log('selectedProfile condition failed:', {
        selectedProfile: !!selectedProfile,
        hasCandidate: !!(selectedProfile && selectedProfile._candidate),
        hasCandidateId: !!(selectedProfile && selectedProfile._candidate && selectedProfile._candidate._id)
      });
    }
  }, [selectedProfile]);



  const handleConcernPersonChange = (e) => {
    console.log(e.target.value, 'e.target.value');
    setSelectedConcernPerson(e.target.value);
  }

  const handleReferLead = async (type) => {
    console.log(selectedConcernPerson, 'selectedConcernPerson');
    try {
      const response = await axios.post(`${backendUrl}/college/refer-leads`, {
        counselorId: selectedConcernPerson,
        appliedCourseId: type === 'RefferSingleLead' ? selectedProfile._id : selectedProfiles,
        type
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
      await fetchProfileData();
      closePanel();



    } catch (error) {
      console.error('Error referring lead:', error);
      alert('Failed to refer lead');
    }
  }





  const openWhatsappPanel = () => {
    setShowPanel('whatsapp');
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  // Fetch WhatsApp Templates from backend
  const fetchWhatsappTemplates = async () => {

    try {

      if (!token) {

        alert('No token found in session storage.');

        return;

      }



      // Get environment variables for Facebook API
      const businessAccountId = process.env.REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID;
      const accessToken = process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN;

      if (!businessAccountId || !accessToken) {
        alert('WhatsApp Business Account ID or Access Token not configured in environment variables.');
        return;
      }

      // Fetch templates directly from Facebook Graph API
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${businessAccountId}/message_templates`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            fields: 'id,name,status,category,language,components,quality_score,rejected_reason,code_expiration_minutes'
          }
        }
      );
      
      if (response.data && response.data.data) {
        // downloadTemplatesJSON(response.data.data);
        console.log('templates', response.data.data);
        
        const formattedTemplates = response.data.data
          .filter(template => template.status === 'APPROVED') // Only show approved templates
          .map((template) => {
            // Extract BODY text from components
            let bodyText = '';
            let headerText = '';
            let footerText = '';
            let hasButtons = false;
            
            if (template.components && Array.isArray(template.components)) {
              template.components.forEach(component => {
                if (component.type === 'BODY') {
                  bodyText = component.text || '';
                } else if (component.type === 'HEADER') {
                  if (component.format === 'TEXT') {
                    headerText = component.text || '';
                  } else {
                    headerText = `[${component.format}]`;
                  }
                } else if (component.type === 'FOOTER') {
                  footerText = component.text || '';
                } else if (component.type === 'BUTTONS') {
                  hasButtons = true;
                } else if (component.type === 'CAROUSEL') {
                  bodyText = '[Carousel Template]';
                }
              });
            }
            
            // Combine all text parts
            let fullContent = '';
            if (headerText) fullContent += headerText + '\n\n';
            fullContent += bodyText;
            if (footerText) fullContent += '\n\n' + footerText;
            if (hasButtons) fullContent += '\n[Interactive Buttons]';
            
            return {
              id: template.id,
              name: template.name,
              content: fullContent || 'No preview available',
              category: template.category || 'General',
              language: template.language || 'en',
              status: template.status,
              components: template.components // Keep original for sending
            };
          });
        
        setWhatsappTemplates(formattedTemplates);
        console.log('Formatted templates:', formattedTemplates);
      }

    } catch (error) {

      console.error('Error fetching WhatsApp templates from Facebook:', error);
      alert('Error fetching templates from Facebook. Please check your configuration.');

    }

  };

  const downloadTemplatesJSON = (data) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-templates-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};


  const emojis = ['😊', '😂', '❤️', '👍', '🙏', '😍', '🎉', '👏', '🔥', '💯', '✅', '🚀', '💪', '🙌', '😎', '🤝', '💼', '📱', '⭐', '✨'];

  const handleWhatsappSendMessage = () => {
    if (whatsappNewMessage.trim() && hasActiveSession) {
      setWhatsappMessages([...whatsappMessages, {
        id: whatsappMessages.length + 1,
        text: whatsappNewMessage,
        sender: 'agent',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: 'session'
      }]);
      setWhatsappNewMessage('');
      setShowWhatsappEmojiPicker(false);
    }
  };

  const handleWhatsappEmojiClick = (emoji) => {
    setWhatsappNewMessage(whatsappNewMessage + emoji);
    setShowWhatsappEmojiPicker(false);
  };

  const handleWhatsappSelectTemplate = (template) => {
    setSelectedWhatsappTemplate(template);
    setShowWhatsappTemplateMenu(false);
  };

  const handleWhatsappSendTemplate = async () => {
    if (!selectedWhatsappTemplate) return;
    
    setIsSendingWhatsapp(true);
    
    let content = selectedWhatsappTemplate.content
      .replace('{{1}}', selectedProfile?._candidate?.name || 'User')
      .replace('{{2}}', 'Course Name');
    
    setWhatsappMessages([...whatsappMessages, {
      id: whatsappMessages.length + 1,
      text: content,
      sender: 'agent',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: 'template'
    }]);
    
    // Template bhejne ke baad session activate ho jata hai
    setHasActiveSession(true);
    setSelectedWhatsappTemplate(null);
    
    setTimeout(() => {
      setIsSendingWhatsapp(false);
    }, 1000);
  };

  // Click outside to close WhatsApp dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside template menu
      if (showWhatsappTemplateMenu) {
        const templateButton = event.target.closest('.whatsapp-template-trigger');
        const templateMenu = event.target.closest('.whatsapp-template-menu');
        if (!templateButton && !templateMenu) {
          setShowWhatsappTemplateMenu(false);
        }
      }
      // Check if click is outside emoji picker
      if (showWhatsappEmojiPicker) {
        const emojiButton = event.target.closest('.whatsapp-emoji-trigger');
        const emojiMenu = event.target.closest('.whatsapp-emoji-menu');
        if (!emojiButton && !emojiMenu) {
          setShowWhatsappEmojiPicker(false);
        }
      }
    };

    if (showWhatsappTemplateMenu || showWhatsappEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showWhatsappTemplateMenu, showWhatsappEmojiPicker]);

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


  const openleadHistoryPanel = async (profile = null) => {
    if (profile) {
      // Set selected profile
      setSelectedProfile(profile);

    }

    setShowPopup(null);
    setShowPanel('leadHistory');
    setSelectedConcernPerson(null);
    setSelectedProfiles(null);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  const openChangeCenterPanel = async (profile = null) => {
    if (profile) {
      // Set selected profile
      setSelectedProfile(profile);

    }

    setShowPopup(null);
    setShowPanel('changeCenter');
    setSelectedConcernPerson(null);
    setSelectedProfiles(null);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  useEffect(() => {
    console.log('selectedProfile', selectedProfile);
  }, [selectedProfile]);

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

  // Render Edit Panel (Desktop Sidebar or Mobile Modal)
  const renderEditPanel = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-user-edit text-secondary"></i>
            </div>
            <h6 className="mb-0 followUp fw-medium">
              {(showPanel === 'editPanel' || showPanel === 'followUp') && `${showPanel === 'editPanel' ? 'Edit Status for ' : 'Set Followup for '}${selectedProfile?._candidate?.name || ''}`}


              {(showPanel === 'bulkstatuschange') && 'Bulk Status Change'}

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

            {(showPanel !== 'followUp') && (
              <>
                <div className="mb-1">
                  <label htmlFor="status" className="form-label small fw-medium text-dark">
                    Status<span className="text-danger">*</span>
                  </label>
                  <div className="d-flex">
                    <div className="form-floating flex-grow-1">
                      <select
                        className="form-select border-0  bgcolor"
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
                        {statuses.map((filter, index) => (
                          <option value={filter._id}>{filter.name}</option>))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-1">
                  <label htmlFor="subStatus" className="form-label small fw-medium text-dark">
                    Sub-Status<span className="text-danger">*</span>
                  </label>
                  <div className="d-flex">
                    <div className="form-floating flex-grow-1">
                      <select
                        className="form-select border-0  bgcolor"
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
                        {subStatuses.map((filter, index) => (
                          <option value={filter._id}>{filter.title}</option>))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}


            {(isFieldRequired('followup') || showPanel === 'followUp') && (

              <div className="row mb-1">
                <div className="col-6">
                  <label htmlFor="nextActionDate" className="form-label small fw-medium text-dark">
                    Next Action Date
                    {(isFieldRequired('followup') || showPanel === 'followUp') &&
                      <span className="text-danger">*</span>
                    }
                  </label>
                  <div className="input-group">
                    {/* <input
                    type="date"
                    className="form-control border-0  bgcolor"
                    id="nextActionDate"
                    style={{ backgroundColor: '#f1f2f6', height: '42px', paddingInline: '10px' }}
                    onChange={(e) => setFollowupDate(e.target.value)}
                  /> */}
                    <DatePicker
                      className={`form-control border-0 bgcolor ${getRequiredFieldClass('followup')}`}
                      onChange={setFollowupDate}
                      value={followupDate}
                      format="dd/MM/yyyy"
                      minDate={today}   // Isse past dates disable ho jayengi
                      placeholder={(isFieldRequired('followup') || showPanel === 'followUp') ? "Date is mandatory" : "Select date"}
                    />
                  </div>
                </div>

                <div className="col-6">
                  <label htmlFor="actionTime" className="form-label small fw-medium text-dark">
                    Time
                    {(isFieldRequired('followup') || showPanel === 'followUp') &&
                      <span className="text-danger">*</span>
                    }
                  </label>
                  <div className="input-group">
                    <input
                      type="time"
                      className={`form-control border-0 bgcolor ${getRequiredFieldClass('followup')}`}
                      id="actionTime"
                      onChange={handleTimeChange}
                      value={followupTime}
                      placeholder={(isFieldRequired('followup') || showPanel === 'followUp') ? "Time is mandatory" : "Select time"}
                      style={{ backgroundColor: '#f1f2f6', height: '42px', paddingInline: '10px' }}
                    />
                  </div>
                </div>
              </div>)}

            {(isFieldRequired('remarks') || showPanel === 'followUp') && (

              <div className="mb-1">
                <label htmlFor="comment" className="form-label small fw-medium text-dark">
                  Comment
                  {(isFieldRequired('remarks') || showPanel === 'followUp') &&
                    <span className="text-danger">*</span>
                  }
                </label>
                <textarea
                  className={`form-control border-0 bgcolor ${getRequiredFieldClass('remarks')}`}
                  id="comment"
                  rows="4"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={(isFieldRequired('remarks') || showPanel === 'followUp') ? "Remarks are mandatory" : "Add remarks (optional)"}
                  style={{ resize: 'none', backgroundColor: '#f1f2f6' }}
                ></textarea>
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

                className="btn text-white"
                onClick={handleUpdateStatus}
                style={{ backgroundColor: '#fd7e14', border: 'none', padding: '8px 24px', fontSize: '14px' }}
              >

                {(showPanel === 'editPanel') && 'UPDATE STATUS'}
                {(showPanel === 'followUp') && 'SET FOLLOWUP '}
                {(showPanel === 'bulkstatuschange') && 'UPDATE BULK STATUS '}
              </button>
            </div>
          </form>
        </div>
      </div>
    );

    if (isMobile) {
      return (showPanel === 'editPanel') || (showPanel === 'followUp') || (showPanel === 'bulkstatuschange') ? (

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

    return (showPanel === 'editPanel') || (showPanel === 'followUp') || (showPanel === 'bulkstatuschange') ? (
      <div className="col-11 transition-col" id="editFollowupPanel">
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
                      {counselorOptions.map((counselor, index) => (
                        <option key={index} value={counselor.value}>{counselor.label}</option>))}
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
                type="submit"
                className="btn text-white"
                onClick={() => handleReferLead(showPanel === 'Reffer' ? 'RefferSingleLead' : 'RefferBulkLead')}
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
      <div className="col-11 transition-col" id="refferPanel">
        {panelContent}
      </div>
    ) : null;
  };

  const renderAllLeadPanel = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm" style={{ height: 'calc(100vh - 150px)', overflow: 'auto' }}>
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-user-edit text-secondary"></i>
            </div>
            <h6 className="mb-0 followUp fw-medium">
              {showPanel === 'AddAllLeads' && (`Add Leads`)}

            </h6>
          </div>
          <div>
            <button className="btn-close" type="button" onClick={closePanel}>
              {/* <i className="fa-solid fa-xmark"></i> */}
            </button>
          </div>
        </div>

        <div className="card-body">
          <form onSubmit={handleAddLeadsB2C}>


            <>


              {/* Form Fields with Improved Styling */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark mb-2">

                  Candidate Number <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  id="candidateNumber"
                  className="form-control border-0 shadow-sm"
                  placeholder="Enter 10 digit candidate number"
                  maxLength="10"
                  required
                  value={candidateFormData.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                    handleInputChange('mobile', value);
                  }}
                  style={{
                    height: '48px',
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    border: '1px solid #e9ecef'
                  }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark mb-2">
                  Select Course<span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <select
                    className="form-select border-0 shadow-sm"
                    id="course"
                    required
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    disabled={loadingData}
                    style={{
                      height: '48px',
                      padding: '12px 16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      border: '1px solid #e9ecef',

                    }}

                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>{course.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark mb-2">
                  Select Training Center<span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <select
                    className="form-select border-0 shadow-sm"
                    id="trainingCenter"
                    required
                    value={centerId}
                    onChange={(e) => setCenterId(e.target.value)}
                    disabled={!courseId}
                    style={{
                      height: '48px',
                      padding: '12px 16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      border: '1px solid #e9ecef',
                    }}
                  >

                    <option>Select Center</option>
                    {centers.map((center) => (
                      <option key={center._id} value={center._id}>{center.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="candidateName" className="form-label fw-semibold text-dark mb-2">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="candidateName"
                  required
                  className="form-control border-0 shadow-sm"
                  placeholder="Enter candidate name"
                  value={candidateFormData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  style={{
                    height: '48px',
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    border: '1px solid #e9ecef'
                  }}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="candidateEmail" className="form-label fw-semibold text-dark mb-2">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  id="candidateEmail"
                  className="form-control border-0 shadow-sm"
                  placeholder="Enter email address"
                  required
                  value={candidateFormData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={{
                    height: '48px',
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    border: '1px solid #e9ecef'
                  }}
                />
              </div>

              <div className="mb-3">
                <label>Address</label>
                <input
                  ref={addressInputRef}
                  id="loc"
                  type="text"
                  className="form-control"
                  maxLength="100"
                  name="address"
                  value={candidateFormData.personalInfo.currentAddress.fullAddress}
                  onChange={(e) => setCandidateFormData({
                    ...candidateFormData,
                    personalInfo: {
                      ...candidateFormData.personalInfo,
                      currentAddress: {
                        ...candidateFormData.personalInfo.currentAddress,
                        fullAddress: e.target.value
                      }
                    }
                  })}
                />
              </div>

              {/* Hidden fields for location data */}
              <div className="col-xl-3 mb-3 d-none">
                <label>State <span className="mandatory">*</span></label>
                <input
                  id="state"
                  name="state"
                  type="hidden"
                  className="form-control"
                  maxLength="50"
                  value={candidateFormData.personalInfo.currentAddress.state}
                />
              </div>

              <div className="col-xl-3 mb-3 d-none">
                <label>City <span className="mandatory">*</span></label>
                <input
                  id="city"
                  name="city"
                  type="hidden"
                  className="form-control"
                  maxLength="50"
                  value={candidateFormData.personalInfo.currentAddress.city}
                />
              </div>

              <div className="col-xl-3 mb-3 d-none">
                <label>Longitude <span className="mandatory">*</span></label>
                <input
                  id="longitude"
                  name="longitude"
                  type="hidden"
                  className="form-control"
                  maxLength="50"
                  value={candidateFormData.personalInfo.currentAddress.longitude}
                />
              </div>

              <div className="mb-3 d-none">
                <label>Latitude <span className="mandatory">*</span></label>
                <input
                  id="latitude"
                  name="latitude"
                  type="hidden"
                  className="form-control"
                  maxLength="50"
                  value={candidateFormData.personalInfo.currentAddress.latitude}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="candidateGender" className="form-label fw-semibold text-dark mb-2">
                  Gender <span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <select
                    id="candidateGender"
                    className="form-select border-0 shadow-sm"
                    value={candidateFormData.sex}
                    required
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    style={{
                      height: '48px',
                      padding: '12px 16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="candidateDob" className="form-label fw-semibold text-dark mb-2">
                  Date Of Birth <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  id="candidateDob"
                  className="form-control border-0 shadow-sm"
                  value={candidateFormData.dob}
                  required
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  style={{
                    height: '48px',
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    border: '1px solid #e9ecef'
                  }}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="candidateWhatsapp" className="form-label fw-semibold text-dark mb-2">
                  WhatsApp Number <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  id="candidateWhatsapp"
                  required
                  className="form-control border-0 shadow-sm"
                  placeholder="Enter WhatsApp number"
                  maxLength="10"
                  value={candidateFormData.whatsapp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                    handleInputChange('whatsapp', value);
                  }}
                  style={{
                    height: '48px',
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    border: '1px solid #e9ecef'
                  }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark mb-2">
                  Highest Qualification<span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <select
                    className="form-select border-0 shadow-sm"
                    id="highestQualification"
                    value={candidateFormData.highestQualification}
                    onChange={(e) => handleInputChange('highestQualification', e.target.value)}
                    disabled={loadingData}
                    required
                    style={{
                      height: '48px',
                      padding: '12px 16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <option value="">{loadingData ? 'Loading qualifications...' : 'Select Highest Qualification'}</option>
                    {!loadingData && qualifications.map((qualification) => (
                      <option key={qualification._id} value={qualification._id}>{qualification.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark mb-2">
                  Counselor Name<span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <select
                    className="form-select border-0 shadow-sm"
                    id="counselorName"
                    value={counselorId}
                    onChange={(e) => setCounselorId(e.target.value)}
                    style={{
                      height: '48px',
                      padding: '12px 16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <option value="">Select Counselor name</option>
                    {counselorOptions.map((counselor, index) => (
                      <option key={index} value={counselor.value}>{counselor.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label>
                  Source <span className="mandatory">*</span>
                </label>
                <div className="mb-1" id="thirdPartySource">

                  <select
                    className="form-control single-field"
                    value={registeredBy}
                    name="sourceType"
                    id="thirdPartySourceSelect"
                    onChange={(e) => {
                      // const selectedSource = sources.find(s => s._id === e.target.value);
                      setRegisteredBy(e.target.value);
                    }}
                  >
                    <option value="">Select Third Party Source</option>
                    {sources.map((source) => (
                      <option key={source._id} value={source._id} className="text-capitalize">
                        {source.name}
                      </option>
                    ))}
                  </select>
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
                type="submit"
                className="btn text-white"
                disabled={isSubmitting}
                style={{ backgroundColor: '#fb2d5e', border: 'none', padding: '8px 24px', fontSize: '14px' }}
              >
                {isSubmitting ? 'SUBMITTING...' : (showPanel === 'AddAllLeads' ? 'ADD LEAD' : 'ADD BULK LEAD')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );

    if (isMobile) {
      return (showPanel === 'AddAllLeads') ? (
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

    return (showPanel === 'AddAllLeads') ? (
      <div className="col-11 transition-col" id="addLeadPanel">
        {panelContent}
      </div>
    ) : null;
  };


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
              {selectedProfile?._candidate?.name?.charAt(0)?.toUpperCase() || 'R'}
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-0 fw-bold" style={{ fontSize: '16px' }}>
                {selectedProfile?._candidate?.name || 'Ravi Prakash'}
              </h6>
              <p className="mb-0 text-muted" style={{ fontSize: '13px' }}>
                {selectedProfile?._candidate?.mobile || '8957066852'}
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
            {hasActiveSession ? (
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
                  Active
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
                  No Session
                </span>
              </div>
            )}
          </div>

          {/* Info Banner */}
          {!hasActiveSession && (
            <div 
              className="d-flex align-items-start mt-3 p-2 rounded"
              style={{ 
                backgroundColor: '#E3F2FD',
                border: '1px solid #2196F3'
              }}
            >
              <i className="fas fa-info-circle me-2 mt-1" style={{ color: '#1976D2', fontSize: '14px' }}></i>
              <div style={{ fontSize: '12px', color: '#1565C0' }}>
                <p className="mb-1 fw-semibold">WhatsApp Business API Rule:</p>
                <p className="mb-0">No active session hai. Aap sirf <strong>approved template</strong> bhej sakte hain.</p>
              </div>
            </div>
          )}
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
          {whatsappMessages.map(message => (
            <div key={message.id} className={`d-flex mb-2 ${message.sender === 'agent' ? 'justify-content-end' : 'justify-content-start'}`}>
              <div style={{ maxWidth: '75%' }}>
                <div 
                  className={`p-2 ${
                    message.sender === 'agent' 
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
                    padding: '6px 10px 8px'
                  }}
                >
                  <p className="mb-0" style={{ fontSize: '14px', lineHeight: '1.4', wordWrap: 'break-word' }}>
                    {message.text}
                  </p>
                  <p 
                    className="mb-0 text-end" 
                    style={{ 
                      fontSize: '11px', 
                      color: '#667781',
                      marginTop: '4px'
                    }}
                  >
                    {message.time}
                  </p>
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
                                            🖼️
                                          </div>
                                        </>
                                      )}
                                      <div style={{ padding: '12px' }}>
                                        <p className="mb-2" style={{ 
                                          fontSize: '12px', 
                                          lineHeight: '1.4',
                                          color: '#2c3e50'
                                        }}>
                                          {cardBody?.text || ''}
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
                                                {btn.type === 'QUICK_REPLY' && '↩️ '}
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
                                  🖼️
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
                                  🎥
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
                                {bodyComponent.text
                                  ?.replace('{{1}}', selectedProfile?._candidate?.name || 'User')
                                  .replace('{{2}}', 'Course Name') || ''}
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
                                    {button.type === 'QUICK_REPLY' && '↩️ '}
                                    {button.type === 'URL' && '🔗 '}
                                    {button.type === 'PHONE_NUMBER' && '📞 '}
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
            <button 
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
            </button>

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
                <div className="whatsapp-template-menu position-absolute bottom-100 start-0 mb-2 bg-white rounded shadow-lg border" style={{ width: '350px', maxHeight: '400px', overflowY: 'auto', zIndex: 1050 }}>
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
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0 fw-semibold">{template.name}</h6>
                          <div className="d-flex gap-1">
                            <span className="badge bg-primary" style={{ fontSize: '9px' }}>{template.category}</span>
                            {template.language && (
                              <span className="badge bg-secondary" style={{ fontSize: '9px' }}>{template.language.toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        <div className="bg-light p-2 rounded">
                          {/* Template Preview in Dropdown */}
                          {(() => {
                            const components = template.components || [];
                            
                            // Check if it's a carousel template
                            const carouselComponent = components.find(c => c.type === 'CAROUSEL');
                            if (carouselComponent && carouselComponent.cards) {
                              return (
                                <div>
                                  <p className="mb-2 small fw-semibold text-primary">
                                    <i className="fas fa-images me-1"></i>
                                    Carousel Template ({carouselComponent.cards.length} cards)
                                  </p>
                                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                                    {carouselComponent.cards.slice(0, 3).map((card, idx) => {
                                      const cardHeader = card.components.find(c => c.type === 'HEADER');
                                      const cardBody = card.components.find(c => c.type === 'BODY');
                                      const imageUrl = cardHeader?.example?.header_handle?.[0];
                                      
                                      return (
                                        <div key={idx} style={{ 
                                          minWidth: '100px',
                                          maxWidth: '100px',
                                          border: '1px solid #dee2e6', 
                                          borderRadius: '6px',
                                          overflow: 'hidden',
                                          backgroundColor: '#fff'
                                        }}>
                                          {imageUrl && (
                                            <>
                                              <img 
                                                src={imageUrl} 
                                                alt={`Card ${idx + 1}`}
                                                style={{ 
                                                  width: '100%', 
                                                  height: '70px', 
                                                  objectFit: 'cover'
                                                }}
                                                onError={(e) => {
                                                  e.target.style.display = 'none';
                                                  e.target.nextElementSibling.style.display = 'flex';
                                                }}
                                              />
                                              <div style={{ 
                                                display: 'none', 
                                                height: '70px', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                backgroundColor: '#f0f0f0',
                                                fontSize: '24px'
                                              }}>
                                                🖼️
                                              </div>
                                            </>
                                          )}
                                          <div style={{ padding: '4px', fontSize: '9px', lineHeight: '1.2' }}>
                                            {cardBody?.text?.substring(0, 30) || ''}...
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {carouselComponent.cards.length > 3 && (
                                      <div style={{
                                        minWidth: '100px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        color: '#6b7280'
                                      }}>
                                        +{carouselComponent.cards.length - 3} more
                                      </div>
                                    )}
                                  </div>
                                  {/* Body text if exists */}
                                  {(() => {
                                    const bodyComp = components.find(c => c.type === 'BODY');
                                    if (bodyComp && bodyComp.text) {
                                      return (
                                        <p className="mb-0 small text-muted mt-2" style={{ fontSize: '11px' }}>
                                          {bodyComp.text}
                                        </p>
                                      );
                                    }
                                  })()}
                                </div>
                              );
                            }
                            
                            // Regular template with header (image/video), body, footer
                            const headerComponent = components.find(c => c.type === 'HEADER');
                            const bodyComponent = components.find(c => c.type === 'BODY');
                            const footerComponent = components.find(c => c.type === 'FOOTER');
                            const buttonsComponent = components.find(c => c.type === 'BUTTONS');
                            
                            return (
                              <div>
                                {/* Header - Image or Video */}
                                {headerComponent && headerComponent.format === 'IMAGE' && headerComponent.example?.header_handle?.[0] && (
                                  <div style={{ marginBottom: '8px' }}>
                                    <img 
                                      src={headerComponent.example.header_handle[0]} 
                                      alt="Template header"
                                      style={{ 
                                        width: '100%', 
                                        maxHeight: '120px', 
                                        objectFit: 'cover',
                                        borderRadius: '4px'
                                      }}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'block';
                                      }}
                                    />
                                    <div style={{ 
                                      display: 'none',
                                      padding: '15px',
                                      textAlign: 'center',
                                      backgroundColor: '#f0f0f0',
                                      borderRadius: '4px',
                                      fontSize: '28px'
                                    }}>
                                      🖼️
                                    </div>
                                  </div>
                                )}
                                
                                {headerComponent && headerComponent.format === 'VIDEO' && headerComponent.example?.header_handle?.[0] && (
                                  <div style={{ marginBottom: '8px', position: 'relative' }}>
                                    <video 
                                      src={headerComponent.example.header_handle[0]} 
                                      style={{ 
                                        width: '100%', 
                                        maxHeight: '120px',
                                        borderRadius: '4px',
                                        backgroundColor: '#000'
                                      }}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'block';
                                      }}
                                    />
                                    <div style={{ 
                                      display: 'none',
                                      padding: '15px',
                                      textAlign: 'center',
                                      backgroundColor: '#000',
                                      color: '#fff',
                                      borderRadius: '4px',
                                      fontSize: '28px'
                                    }}>
                                      🎥
                                    </div>
                                    {/* Play icon overlay */}
                                    <div style={{
                                      position: 'absolute',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      fontSize: '24px',
                                      color: '#fff',
                                      backgroundColor: 'rgba(0,0,0,0.5)',
                                      borderRadius: '50%',
                                      width: '36px',
                                      height: '36px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      ▶️
                                    </div>
                                  </div>
                                )}
                                
                                {headerComponent && headerComponent.format === 'TEXT' && (
                                  <p className="mb-1 fw-bold small">{headerComponent.text}</p>
                                )}
                                
                                {/* Body */}
                                {bodyComponent && (
                                  <p className="mb-1 small text-muted" style={{ whiteSpace: 'pre-wrap', fontSize: '11px' }}>
                                    {bodyComponent.text
                                      ?.replace('{{1}}', selectedProfile?._candidate?.name || 'User')
                                      .replace('{{2}}', 'Course Name') || ''}
                                  </p>
                                )}
                                
                                {/* Footer */}
                                {footerComponent && (
                                  <p className="mb-0 small text-muted" style={{ fontSize: '10px', opacity: 0.7 }}>
                                    {footerComponent.text}
                                  </p>
                                )}
                                
                                {/* Buttons indicator */}
                                {buttonsComponent && buttonsComponent.buttons && buttonsComponent.buttons.length > 0 && (
                                  <div style={{ 
                                    marginTop: '6px',
                                    paddingTop: '6px',
                                    borderTop: '1px solid #dee2e6',
                                    fontSize: '10px',
                                    color: '#007bff'
                                  }}>
                                    <i className="fas fa-hand-pointer me-1"></i>
                                    {buttonsComponent.buttons.length} button{buttonsComponent.buttons.length > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
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
            ) : hasActiveSession ? (
              // Active Session - Show Input
              <>
                <div className="position-relative flex-grow-1">
                  <input 
                    type="text"
                    className="form-control"
                    value={whatsappNewMessage}
                    onChange={(e) => setWhatsappNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleWhatsappSendMessage()}
                    placeholder={`Message ${selectedProfile?._candidate?.name?.split(' ')[0] || 'Ravi Prakash'}...`}
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
                      <div className="d-flex flex-wrap gap-2" style={{ width: '250px' }}>
                        {emojis.map((emoji, index) => (
                          <button
                            key={index}
                            className="btn btn-light btn-sm"
                            onClick={() => handleWhatsappEmojiClick(emoji)}
                            style={{ fontSize: '20px', width: '40px', height: '40px', padding: 0 }}
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
                        text: '🎤 Voice message',
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
              // No Session - Disabled
              <div className="flex-grow-1 bg-light border border-2 border-dashed rounded d-flex align-items-center justify-content-center" style={{ height: '45px' }}>
                <p className="mb-0 small text-muted">
                  <i className="fas fa-info-circle me-2"></i>
                  Session message sirf active session me bhej sakte hain
                </p>
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
      <div className="col-11 transition-col" id="whatsappPanel">
        {panelContent}
      </div>
    ) : null;
  };
  /************************************/

  //lead history

  const [leadHistory, setLeadHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);



  useEffect(() => {
    if (showPanel === 'leadHistory' && selectedProfile) {
      fetchLeadHistory();
    }
  }, [showPanel]);

  const fetchLeadHistory = async () => {
    try {
      setIsHistoryLoading(true);
      setLeadHistory([])
      const response = await axios.get(`${backendUrl}/college/lead-history/${selectedProfile._id}`, {
        headers: {
          'x-auth': token,
        }
      });
      if (response.data.success) {
        console.log("response", response)
        setLeadHistory(response.data.data);
      } else {
        alert('Field to history load')
      }
    } catch (error) {
      console.error('Error fetching lead history:', error);
      alert('Field to history load')

    } finally {
      setIsHistoryLoading(false);
    }
  }
  /************************************/

  // WhatsApp Templates Dropdown
  const renderWhatsAppTemplatesDropdown = () => {
    if (!showWhatsAppTemplates) return null;
    return (
      <div className="position-absolute" style={{ 
        bottom: '100%', 
        left: '0', 
        width: '300px',
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxHeight: '300px',
        overflow: 'auto',
        marginBottom: '8px'
      }}>
        {isLoadingWhatsAppTemplates ? (
          <div className="d-flex align-items-center justify-content-center py-3">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="ms-2">Loading templates...</span>
          </div>
        ) : whatsAppTemplatesError ? (
          <div className="alert alert-danger m-2">{whatsAppTemplatesError}</div>
        ) : (
          <div className="list-group list-group-flush">
            {whatsAppTemplates.length === 0 ? (
              <div className="p-3 text-center text-muted">No templates found.</div>
            ) : (
              whatsAppTemplates.map((tpl) => (
                <div 
                  key={tpl.id || tpl.name} 
                  className="list-group-item list-group-item-action"
                  style={{ cursor: 'pointer', border: 'none', padding: '12px 16px' }}
                  onClick={() => {
                    setSelectedTemplate(tpl);
                    setShowWhatsAppTemplates(false);
                    
                    // Generate template preview from components
                    let previewText = "";
                    let hasMedia = false;
                    let mediaType = "";
                    let mediaUrl = "";
                    
                    if (tpl.components && Array.isArray(tpl.components)) {
                      tpl.components.forEach(component => {
                        if (component.type === 'HEADER') {
                          if (component.text) {
                            previewText += component.text + "\n\n";
                          } else if (component.format) {
                            hasMedia = true;
                            mediaType = component.format.toLowerCase();
                            if (component.example && component.example.header_handle) {
                              mediaUrl = component.example.header_handle[0];
                            }
                          }
                        } else if (component.type === 'BODY' && component.text) {
                          previewText += component.text + "\n\n";
                        } else if (component.type === 'FOOTER' && component.text) {
                          previewText += component.text;
                        }
                      });
                    }
                    
                    // If no components, use template name as preview
                    if (!previewText.trim()) {
                      previewText = `Template: ${tpl.name}`;
                    }
                    
                    // Store template data for enhanced preview
                    const templateData = {
                      text: previewText.trim(),
                      hasMedia,
                      mediaType,
                      mediaUrl,
                      templateName: tpl.name,
                      status: tpl.status,
                      category: tpl.category
                    };
                    
                    setTemplatePreview(JSON.stringify(templateData));
                    console.log('Selected template:', tpl);
                  }}
                >
                  <div className="fw-semibold text-dark">{tpl.name}</div>
                  <div className="small text-muted">{tpl.category} • {tpl.language} • {tpl.status}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };
  /************************************/

  // Render Edit Panel (Desktop Sidebar or Mobile Modal)
  const renderLeadHistoryPanel = () => {
    const panelContent = (
      <div className="card col-12 border-0 shadow-sm h-100">
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
        {isHistoryLoading ? (
          <div className="card-body p-0 d-flex flex-column h-100 d-flex align-items-center justify-content-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="ms-2 mt-2">Loading...</span>
          </div>
        ) : (
          <div className="card-body p-0 d-flex flex-column h-100">
            {/* Scrollable Content Area */}
            <div
              className="flex-grow-1 overflow-auto px-3 py-2"
              style={{
                maxHeight: isMobile ? '60vh' : '65vh',
                minHeight: '200px'
              }}
            >
              {leadHistory && Array.isArray(leadHistory) && leadHistory.length > 0 ? (
                <div className="timeline">
                  {leadHistory.map((log, index) => (
                    <div key={index} className="timeline-item mb-4">
                      <div className="timeline-marker">
                        <div className="timeline-marker-icon">
                          <i className="fas fa-circle text-primary" style={{ fontSize: '8px' }}></i>
                        </div>
                        {index !== leadHistory.length - 1 && (
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
                                Modified By: {log.user?.name || 'Unknown User'}
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
          </div>)}
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
      <div className="col-11 transition-col" id="leadHistoryPanel" style={{ height: '80vh', width: '-webkit-fill-available' }}>
        {panelContent}
      </div>
    ) : null;
  };

  const renderChangeCenterPanel = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-history text-primary"></i>
            </div>
            <h6 className="mb-0 fw-medium">Change Center</h6>
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
            {leadHistory && Array.isArray(leadHistory) && leadHistory.length > 0 ? (
              <div className="timeline">
                {leadHistory.map((log, index) => (
                  <div key={index} className="timeline-item mb-4">
                    <div className="timeline-marker">
                      <div className="timeline-marker-icon">
                        <i className="fas fa-circle text-primary" style={{ fontSize: '8px' }}></i>
                      </div>
                      {index !== leadHistory.length - 1 && (
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
                              Modified By: {log.user?.name || 'Unknown User'}
                            </small>
                          </div>

                          <div className="mb-2">
                            <label className="form-label fw-semibold text-dark mb-2">
                              Select Center<span className="text-danger">*</span>
                            </label>
                            <div className="position-relative">
                              <select
                                className="form-select border-0 shadow-sm"
                                id="course"
                                style={{
                                  height: '48px',
                                  padding: '12px 16px',
                                  backgroundColor: '#f8f9fa',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  transition: 'all 0.3s ease',
                                  border: '1px solid #e9ecef',

                                }}

                              >
                                <option value="">Select Center</option>
                              </select>
                            </div>
                          </div>


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
                <h6 className="text-muted mb-2">No Center Available</h6>
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
    );

    if (isMobile) {
      return showPanel === 'changeCenter' ? (
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

    return showPanel === 'changeCenter' ? (
      <div className="col-11 transition-col" id="changeCenterPanel" style={{ height: '80vh' }}>
        {panelContent}
      </div>
    ) : null;
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className={isMobile ? 'col-12' : mainContentClass}>
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
            <nav ref={navRef} className="" style={{
              zIndex: 11, backgroundColor: `rgba(255, 255, 255, ${navbarOpacity})`, position: 'fixed', width: `${width}px`, backdropFilter: `blur(${blurIntensity}px)`,
              WebkitBackdropFilter: `blur(${blurIntensity}px)`,
              boxShadow: isScrolled
                ? '0 8px 32px 0 rgba(31, 38, 135, 0.25)'
                : '0 4px 25px 0 #0000001a', paddingBlock: '10px',
              transition: 'all 0.3s ease',
            }}
            >
              <div className="container-fluid">
                <div className="row align-items-center">
                  <div className="col-md-6 d-md-block d-sm-none">
                    <div className="d-flex align-items-center">
                      <h4 className="fw-bold text-dark mb-0 me-3">Admission Cycle</h4>
                      <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0 small">
                          <li className="breadcrumb-item">
                            <a href="/institute/dashboard" className="text-decoration-none">Home</a>
                          </li>
                          <li className="breadcrumb-item active">Admission Cycle</li>
                        </ol>
                      </nav>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="d-flex justify-content-end align-items-center gap-2">
                      <div className="input-group" style={{ maxWidth: '300px' }}>

                        <input
                          type="text"
                          name="name"
                          className="form-control border-start-0 m-0"
                          placeholder="Quick search..."
                          value={filterData.name}
                          onChange={handleFilterChange}
                        />
                        <button
                          onClick={() => fetchProfileData()}
                          className={`btn btn-outline-primary`}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <i className={`fas fa-search me-1`}></i>
                          Search

                        </button>
                      </div>


                      <button
                        onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                        className={`btn ${!isFilterCollapsed ? 'btn-primary' : 'btn-outline-primary'}`}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <i className={`fas fa-filter me-1 ${!isFilterCollapsed ? 'fa-spin' : ''}`}></i>
                        Filters
                        {Object.values(filterData).filter(val => val && val !== 'true').length > 0 && (
                          <span className="bg-light text-dark ms-1">
                            {Object.values(filterData).filter(val => val && val !== 'true').length}
                          </span>
                        )}
                      </button>


                    </div>
                  </div>

                  {/* Filter Buttons Row */}
                  <div className="col-12 mt-2">
                    <div className="d-flex flex-wrap gap-2 align-items-center mediaCrmFilters">
                      {crmFilters.map((filter, index) => (
                        <div key={index} className="d-flex align-items-center gap-1">
                          <div className='d-flex position-relative'>
                            <button
                              className={`btn btn-sm btncrm ${activeCrmFilter === index ? 'btn-primary' : 'btn-outline-secondary'}`}
                              onClick={() => handleCrmFilterClick(index)}
                            >
                              {filter.name}
                              <span className={`ms-1 ${activeCrmFilter === index ? 'text-white' : 'text-dark'}`}>
                                ({filter.count})
                              </span>
                            </button>

                            {filter.milestone && (
                              <span
                                className="position-absolute bg-success text-white px-2 py-1 rounded-pill"
                                style={{
                                  fontSize: '0.7rem',
                                  top: '-8px',
                                  right: '-10px',
                                  transform: 'scale(0.8)'
                                }}
                                title={`Milestone: ${filter.milestone}`}
                              >
                                🚩 {filter.milestone}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </div>

          {/* Advanced Filters */}
          {!isFilterCollapsed && (
            <div
              className="modal show fade d-block"
              style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1050
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsFilterCollapsed(true);
              }}
            >
              <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered mx-auto justify-content-center">
                <div className="modal-content">
                  {/* Modal Header - Fixed at top */}
                  <div className="modal-header bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-filter text-primary me-2"></i>
                        <h5 className="fw-bold mb-0 text-dark">Advanced Filters</h5>
                        {totalSelected > 0 && (
                          <span className="badge bg-primary ms-2">
                            {totalSelected} Active
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={clearAllFilters}
                        >
                          <i className="fas fa-times-circle me-1"></i>
                          Clear All
                        </button>
                        <button
                          className="btn-close"
                          onClick={() => setIsFilterCollapsed(true)}
                          aria-label="Close"
                        ></button>
                      </div>
                    </div>
                  </div>

                  {/* Modal Body - Scrollable content */}
                  <div className="modal-body p-4">
                    <div className="row g-4">
                      {/* Course Type Filter */}
                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-graduation-cap me-1 text-success"></i>
                          Course Type
                        </label>
                        <div className="position-relative">
                          <select
                            className="form-select"
                            name="courseType"
                            value={filterData.courseType}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Types</option>
                            <option value="Free">🆓 Free</option>
                            <option value="Paid">💰 Paid</option>
                          </select>
                        </div>
                      </div>

                      {/* Project Filter */}
                      <div className="col-md-3">
                        <MultiSelectCheckbox
                          title="Project"
                          options={projectOptions}
                          selectedValues={formData.projects.values}
                          onChange={(values) => handleCriteriaChange('projects', values)}
                          icon="fas fa-sitemap"
                          isOpen={dropdownStates.projects}
                          onToggle={() => toggleDropdown('projects')}
                        />
                      </div>

                      {/* Verticals Filter */}
                      <div className="col-md-3">
                        <MultiSelectCheckbox
                          title="Verticals"
                          options={verticalOptions}
                          selectedValues={formData.verticals.values}
                          icon="fas fa-sitemap"
                          isOpen={dropdownStates.verticals}
                          onToggle={() => toggleDropdown('verticals')}
                          onChange={(values) => handleCriteriaChange('verticals', values)}
                        />
                      </div>

                      {/* Course Filter */}
                      <div className="col-md-3">
                        <MultiSelectCheckbox
                          title="Course"
                          options={courseOptions}
                          selectedValues={formData.course.values}
                          onChange={(values) => handleCriteriaChange('course', values)}
                          icon="fas fa-graduation-cap"
                          isOpen={dropdownStates.course}
                          onToggle={() => toggleDropdown('course')}
                        />
                      </div>

                      {/* Center Filter */}
                      <div className="col-md-3">
                        <MultiSelectCheckbox
                          title="Center"
                          options={centerOptions}
                          selectedValues={formData.center.values}
                          onChange={(values) => handleCriteriaChange('center', values)}
                          icon="fas fa-building"
                          isOpen={dropdownStates.center}
                          onToggle={() => toggleDropdown('center')}
                        />
                      </div>

                      {/* Counselor Filter */}
                      <div className="col-md-3">
                        <MultiSelectCheckbox
                          title="Counselor"
                          options={counselorOptions}
                          selectedValues={formData.counselor.values}
                          onChange={(values) => handleCriteriaChange('counselor', values)}
                          icon="fas fa-user-tie"
                          isOpen={dropdownStates.counselor}
                          onToggle={() => toggleDropdown('counselor')}
                        />
                      </div>
                    </div>

                    {/* status filters  */}
                    <div className="row g-4 mt-3">
                      <div className="col-12">
                        <h6 className="text-dark fw-bold mb-3">
                          <i className="fas fa-calendar-alt me-2 text-primary"></i>
                          Status Filter
                        </h6>
                      </div>

                      {/* Created Date Range */}
                      <div className="col-md-4">
                        <select
                          className="form-select border-0  bgcolor"
                          id="status"
                          name="statuses"
                          value={filterData.statuses}
                          style={{
                            height: '42px',
                            paddingTop: '8px',
                            paddingInline: '10px',
                            width: '100%',
                            backgroundColor: '#f1f2f6'
                          }}
                          onChange={(e) => handleFilterChange(e)}

                        >
                          <option value="">Select Status</option>
                          {statuses.map((filter, index) => (
                            <option value={filter._id}>{filter.name}</option>))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <select
                          className="form-select border-0  bgcolor"
                          name="subStatuses"
                          id="subStatus"
                          value={filterData.subStatuses}
                          style={{
                            height: '42px',
                            paddingTop: '8px',
                            backgroundColor: '#f1f2f6',
                            paddingInline: '10px',
                            width: '100%'
                          }}
                          onChange={(e) => handleFilterChange(e)}

                        >
                          <option value="">Select Sub-Status</option>
                          {subStatuses.map((filter, index) => (
                            <option value={filter._id}>{filter.title}</option>))}
                        </select>
                      </div>

                    </div>


                    {/* Date Filters Section */}
                    <div className="row g-4 mt-3">
                      <div className="col-12">
                        <h6 className="text-dark fw-bold mb-3">
                          <i className="fas fa-calendar-alt me-2 text-primary"></i>
                          Date Range Filters
                        </h6>
                      </div>

                      {/* Created Date Range */}
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-calendar-plus me-1 text-success"></i>
                          Lead Creation Date Range
                        </label>
                        <div className="card border-0 bg-light p-3">
                          <div className="row g-2">
                            <div className="col-6 firstDatepicker">
                              <label className="form-label small">From Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'createdFromDate')}
                                value={filterData.createdFromDate}
                                format="dd/MM/yyyy"
                                className="form-control p-0"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-success"></i>}
                                maxDate={filterData.createdToDate || new Date()}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">To Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'createdToDate')}
                                value={filterData.createdToDate}
                                format="dd/MM/yyyy"
                                className="form-control p-0"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-success"></i>}
                                minDate={filterData.createdFromDate}
                                maxDate={new Date()}
                              />
                            </div>
                          </div>

                          {/* Show selected dates */}
                          {(filterData.createdFromDate || filterData.createdToDate) && (
                            <div className="mt-2 p-2 bg-success bg-opacity-10 rounded">
                              <small className="text-success">
                                <i className="fas fa-info-circle me-1"></i>
                                <strong>Selected:</strong>
                                {filterData.createdFromDate && ` From ${formatDate(filterData.createdFromDate)}`}
                                {filterData.createdFromDate && filterData.createdToDate && ' |'}
                                {filterData.createdToDate && ` To ${formatDate(filterData.createdToDate)}`}
                              </small>
                            </div>
                          )}

                          {/* Clear button */}
                          <div className="mt-2">
                            <button
                              className="btn btn-sm btn-outline-danger w-100"
                              onClick={() => clearDateFilter('created')}
                              disabled={!filterData.createdFromDate && !filterData.createdToDate}
                            >
                              <i className="fas fa-times me-1"></i>
                              Clear Created Date
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Modified Date Range */}
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-calendar-edit me-1 text-warning"></i>
                          Lead Modification Date Range
                        </label>
                        <div className="card border-0 bg-light p-3">
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label small">From Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'modifiedFromDate')}
                                value={filterData.modifiedFromDate}
                                format="dd/MM/yyyy"
                                className="form-control p-0"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-warning"></i>}
                                maxDate={filterData.modifiedToDate || new Date()}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">To Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'modifiedToDate')}
                                value={filterData.modifiedToDate}
                                format="dd/MM/yyyy"
                                className="form-control p-0"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-warning"></i>}
                                minDate={filterData.modifiedFromDate}
                                maxDate={new Date()}
                              />
                            </div>
                          </div>

                          {/* Show selected dates */}
                          {(filterData.modifiedFromDate || filterData.modifiedToDate) && (
                            <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded">
                              <small className="text-warning">
                                <i className="fas fa-info-circle me-1"></i>
                                <strong>Selected:</strong>
                                {filterData.modifiedFromDate && ` From ${formatDate(filterData.modifiedFromDate)}`}
                                {filterData.modifiedFromDate && filterData.modifiedToDate && ' |'}
                                {filterData.modifiedToDate && ` To ${formatDate(filterData.modifiedToDate)}`}
                              </small>
                            </div>
                          )}

                          {/* Clear button */}
                          <div className="mt-2">
                            <button
                              className="btn btn-sm btn-outline-danger w-100"
                              onClick={() => clearDateFilter('modified')}
                              disabled={!filterData.modifiedFromDate && !filterData.modifiedToDate}
                            >
                              <i className="fas fa-times me-1"></i>
                              Clear Modified Date
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Next Action Date Range */}
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-calendar-check me-1 text-info"></i>
                          Next Action Date Range
                        </label>
                        <div className="card border-0 bg-light p-3">
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label small">From Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'nextActionFromDate')}
                                value={filterData.nextActionFromDate}
                                format="dd/MM/yyyy"
                                className="form-control p-0"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-info"></i>}
                                maxDate={filterData.nextActionToDate}
                              />
                            </div>
                            <div className="col-6 translateX">
                              <label className="form-label small">To Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'nextActionToDate')}
                                value={filterData.nextActionToDate}
                                format="dd/MM/yyyy"
                                className="form-control p-0"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-info"></i>}
                                minDate={filterData.nextActionFromDate}
                              />
                            </div>
                          </div>

                          {/* Show selected dates */}
                          {(filterData.nextActionFromDate || filterData.nextActionToDate) && (
                            <div className="mt-2 p-2 bg-info bg-opacity-10 rounded">
                              <small className="text-info">
                                <i className="fas fa-info-circle me-1"></i>
                                <strong>Selected:</strong>
                                {filterData.nextActionFromDate && ` From ${formatDate(filterData.nextActionFromDate)}`}
                                {filterData.nextActionFromDate && filterData.nextActionToDate && ' |'}
                                {filterData.nextActionToDate && ` To ${formatDate(filterData.nextActionToDate)}`}
                              </small>
                            </div>
                          )}

                          {/* Clear button */}
                          <div className="mt-2">
                            <button
                              className="btn btn-sm btn-outline-danger w-100"
                              onClick={() => clearDateFilter('nextAction')}
                              disabled={!filterData.nextActionFromDate && !filterData.nextActionToDate}
                            >
                              <i className="fas fa-times me-1"></i>
                              Clear Next Action Date
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row g-4 mt-3">
                      <div className="col-12">
                        <h6 className="text-dark fw-bold mb-3">
                          <i className="fas fa-calendar-alt me-2 text-primary"></i>
                          Range Count
                        </h6>
                      </div>


                    </div>



                    {/* Results Summary */}
                    <div className="row mt-4">
                      <div className="col-12">
                        <div className="alert alert-info">
                          <div className="d-flex align-items-center">
                            <i className="fas fa-info-circle me-2"></i>
                            <div>
                              <strong>Results Summary:</strong> Showing {allProfiles.length} results on page {currentPage} of {totalPages}

                              {/* Active filter indicators */}
                              <div className="mt-2">
                                {(filterData.createdFromDate || filterData.createdToDate) && (
                                  <span className="badge bg-success me-2">
                                    <i className="fas fa-calendar-plus me-1"></i>
                                    Created Date Filter Active
                                  </span>
                                )}

                                {(filterData.modifiedFromDate || filterData.modifiedToDate) && (
                                  <span className="badge bg-warning me-2">
                                    <i className="fas fa-calendar-edit me-1"></i>
                                    Modified Date Filter Active
                                  </span>
                                )}

                                {(filterData.nextActionFromDate || filterData.nextActionToDate) && (
                                  <span className="badge bg-info me-2">
                                    <i className="fas fa-calendar-check me-1"></i>
                                    Next Action Date Filter Active
                                  </span>
                                )}

                                {totalSelected > 0 && (
                                  <span className="badge bg-primary me-2">
                                    <i className="fas fa-filter me-1"></i>
                                    {totalSelected} Multi-Select Filters Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer - Fixed at bottom */}
                  <div className="modal-footer bg-light border-top">
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <div className="text-muted small">
                        <i className="fas fa-filter me-1"></i>
                        {Object.values(filterData).filter(val => val && val !== 'true').length + totalSelected} filters applied
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => setIsFilterCollapsed(true)}
                        >
                          <i className="fas fa-eye-slash me-1"></i>
                          Hide Filters
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            fetchProfileData(filterData, 1);
                            setIsFilterCollapsed(true);
                          }}
                        >
                          <i className="fas fa-search me-1"></i>
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Main Content */}
          <div className="content-body marginTopMobile" style={{
            marginTop: `${navHeight + 10}px`,
            transition: 'margin-top 0.2s ease-in-out'
          }}>
            <section className="list-view">
              <div className="row">
                <div className="d-flex justify-content-end gap-2">

                  <button className="btn btn-sm btn-outline-primary" style={{
                    padding: "6px 12px",
                    fontSize: "11px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                    onClick={downloadLeads}
                  >
                    <i className="fas fa-download" style={{ fontSize: "10px" }}></i>
                    Download Leads
                  </button>
                  {((permissions?.custom_permissions?.can_add_leads && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                    <>
                      <button className="btn btn-sm btn-outline-primary" style={{
                        padding: "6px 12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                        onClick={() => {
                          openPanel(null, 'AddAllLeads');
                        }}
                      >
                        <i className="fas fa-plus" style={{ fontSize: "10px" }}></i>
                        Add Leads
                      </button>
                    </>
                  )}
                  {((permissions?.custom_permissions?.can_edit_leads && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                    <>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        disabled={isLoadingProfiles || allProfiles.length === 0}
                        style={{
                          padding: "6px 12px",
                          fontSize: "11px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                        onClick={() => {
                          openPanel(null, 'RefferAllLeads');
                          console.log('selectedProfile', null);
                        }}
                      >
                        <i className="fas fa-share-alt" style={{ fontSize: "10px" }}></i>
                        Refer All Leads
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled={isLoadingProfiles || allProfiles.length === 0}
                        style={{
                          padding: "6px 12px",
                          fontSize: "11px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                        onClick={() => { openEditPanel(null, 'bulkstatuschange') }}
                      >
                        <i className="fas fa-tasks" style={{ fontSize: "10px" }}></i>
                        Bulk Action
                      </button>
                    </>)}

                </div>
              </div>
              <div className='row'>
                <div>
                  <div className="col-12 rounded equal-height-2 coloumn-2">
                    <div className="card px-3">
                      <div className="row" id="crm-main-row">

                        {/* Loading State */}
                        {isLoadingProfiles && (
                          <div className="col-12 text-center py-5">
                            <div className="d-flex flex-column align-items-center">
                              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <h5 className="text-muted">Loading profiles...</h5>
                              <p className="text-muted small">Please wait while we fetch the latest data</p>
                            </div>
                          </div>
                        )}

                        {/* Profiles List */}
                        {!isLoadingProfiles && allProfiles && allProfiles.map((profile, profileIndex) => (
                          <div className={`card-content transition-col mb-2`} key={profileIndex}>

                            {/* Profile Header Card */}
                            <div className="card border-0 shadow-sm mb-0 mt-2">
                              <div className="card-body px-1 py-0 my-2">
                                <div className="row align-items-center justify-content-around">
                                  <div className="col-md-7">
                                    <div className="d-flex align-items-center">
                                      <div className="form-check me-3">
                                        <input onChange={(e) => handleCheckboxChange(profile, e.target.checked)} className="form-check-input" type="checkbox" />
                                      </div>
                                      <div className="me-3">
                                        <div className="circular-progress-container" data-percent={profile.docCounts.totalRequired > 0 ? profile.docCounts.uploadPercentage : 'NA'}>
                                          <svg width="40" height="40">
                                            <circle className="circle-bg" cx="20" cy="20" r="16"></circle>
                                            <circle className="circle-progress" cx="20" cy="20" r="16"></circle>
                                          </svg>
                                          <div className="progress-text"></div>
                                        </div>
                                      </div>
                                      <div className="d-flex flex-column">
                                        <h6 className="mb-0 fw-bold">{profile._candidate?.name || 'Your Name'}</h6>
                                        <small className="text-muted">{profile._candidate?.mobile || 'Mobile Number'}</small>
                                        <small className="text-muted">{profile._candidate?.email || 'Email'}</small>
                                      </div>
                                      <div style={{ marginLeft: '15px' }}>
                                        <button className="btn btn-outline-primary btn-sm border-0" title="Call" style={{ fontSize: '20px' }}>
                                          <a href={`tel:${profile._candidate?.mobile}`} target="_blank" rel="noopener noreferrer">
                                            <i className="fas fa-phone"></i>
                                          </a>
                                        </button>

                                        {/* <a
                                          className="btn btn-outline-success btn-sm border-0"
                                          href={`https://wa.me/${profile._candidate?.mobile}`}
                                          style={{ fontSize: '20px' }}
                                          title="WhatsApp"
                                          target="_blank"
                                        >
                                          <i className="fab fa-whatsapp"></i>
                                        </a> */}
                                        <a
                                          className="btn btn-outline-success btn-sm border-0"
                                          onClick={() => openPanel(profile, 'whatsapp')}
                                          style={{ fontSize: '20px' }}
                                          title="WhatsApp"
                                        >
                                          <i className="fab fa-whatsapp"></i>
                                        </a>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-md-3">
                                    <div className="d-flex gap-2">
                                      <div className="flex-grow-1">
                                        <input
                                          type="text"
                                          className="form-control form-control-sm m-0"
                                          style={{
                                            cursor: 'pointer',
                                            border: '1px solid #ddd',
                                            borderRadius: '0px',
                                            borderTopRightRadius: '5px',
                                            borderTopLeftRadius: '5px',
                                            width: '145px',
                                            height: '20px',
                                            fontSize: '10px'
                                          }}
                                          value={profile._leadStatus?.title}
                                          readOnly
                                          onClick={() => {
                                            openEditPanel(profile, 'StatusChange');
                                            console.log('selectedProfile', profile);
                                          }}

                                        />
                                        <input
                                          type="text"
                                          className="form-control form-control-sm m-0"
                                          value={profile.selectedSubstatus?.title}
                                          style={{
                                            cursor: 'pointer',
                                            border: '1px solid #ddd',
                                            borderRadius: '0px',
                                            borderBottomRightRadius: '5px',
                                            borderBottomLeftRadius: '5px',
                                            width: '145px',
                                            height: '20px',
                                            fontSize: '10px'
                                          }}
                                          readOnly
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-md-1 text-end d-md-none d-sm-block d-block">
                                    <div className="btn-group">

                                      <div style={{ position: "relative", display: "inline-block" }}>
                                        <button
                                          className="btn btn-sm btn-outline-secondary border-0"
                                          onClick={() => togglePopup(profileIndex)}
                                          aria-label="Options"
                                        >
                                          <i className="fas fa-ellipsis-v"></i>
                                        </button>

                                        {/* Overlay for click outside */}
                                        {showPopup === profileIndex && (
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
                                            top: "28px", // button ke thoda niche
                                            right: "-100px",
                                            width: "170px",
                                            backgroundColor: "white",
                                            border: "1px solid #ddd",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                            borderRadius: "4px",
                                            padding: "8px 0",
                                            zIndex: 9,
                                            transform: showPopup === profileIndex ? "translateX(-70px)" : "translateX(100%)",
                                            transition: "transform 0.3s ease-in-out",
                                            pointerEvents: showPopup ? "auto" : "none",
                                            display: showPopup === profileIndex ? "block" : "none"
                                          }}
                                        >
                                          {((permissions?.custom_permissions?.can_edit_leads && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                                            <>
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
                                                onClick={() => (handleMoveToKyc(profile))}
                                              >
                                                Move To KYC List
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
                                                  openPanel(profile, 'SetFollowup');
                                                  console.log('selectedProfile', profile);
                                                }}
                                              >
                                                Set Followup
                                              </button>
                                              <button
                                                className="btn btn-primary border-0 text-black"
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
                                                  handleFetchCandidate(profile);

                                                }}
                                              >
                                                Profile Edit
                                              </button>
                                              <button
                                                className="btn btn-primary border-0 text-black"
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
                                                  getBranches(profile);
                                                  setShowBranchModal(true);
                                                  console.log('change Branch')

                                                }}
                                              >
                                                Change Branch
                                              </button>
                                            </>
                                          )}

                                          {((permissions?.custom_permissions?.can_assign_leads && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
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
                                                openPanel(profile, 'Reffer');
                                                console.log('selectedProfile', profile);
                                              }}
                                            >
                                              Reffer
                                            </button>
                                          )}

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
                                              openleadHistoryPanel(profile);
                                              console.log('selectedProfile', profile);
                                            }}
                                          >
                                            History List
                                          </button>

                                        </div>
                                      </div>

                                      <button
                                        className="btn btn-sm btn-outline-secondary border-0"
                                        onClick={() => setLeadDetailsVisible(profileIndex)}
                                      >
                                        {leadDetailsVisible === profileIndex ? (
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
                                          onClick={() => togglePopup(profileIndex)}
                                          aria-label="Options"
                                        >
                                          <i className="fas fa-ellipsis-v"></i>
                                        </button>

                                        {/* Overlay for click outside */}
                                        {showPopup === profileIndex && (
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
                                            top: "28px", // button ke thoda niche
                                            right: "-100px",
                                            width: "170px",
                                            backgroundColor: "white",
                                            border: "1px solid #ddd",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                            borderRadius: "4px",
                                            padding: "8px 0",
                                            zIndex: 9,
                                            transform: showPopup === profileIndex ? "translateX(-70px)" : "translateX(100%)",
                                            transition: "transform 0.3s ease-in-out",
                                            pointerEvents: showPopup === profileIndex ? "auto" : "none",
                                            display: showPopup === profileIndex ? "block" : "none"
                                          }}
                                        >

                                          {((permissions?.custom_permissions?.can_edit_leads && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                                            <>
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
                                                onClick={() => (handleMoveToKyc(profile))}
                                              >
                                                Move To KYC List
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
                                                  openEditPanel(profile, 'SetFollowup');
                                                  console.log('selectedProfile', profile);
                                                }}
                                              >
                                                Set Followup
                                              </button>
                                              <button
                                                className="btn btn-primary border-0 text-black"
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
                                                  handleFetchCandidate(profile);
                                                  // open modal for this profile
                                                }}
                                              >
                                                Profile Edit
                                              </button>
                                              <button
                                                className="btn btn-primary border-0 text-black"
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
                                                  getBranches(profile);
                                                  console.log('change Branch')
                                                  setShowBranchModal(true);
                                                }}
                                              >
                                                Change Branch
                                              </button>
                                            </>
                                          )}

                                          {((permissions?.custom_permissions?.can_assign_leads && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
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
                                                openPanel(profile, 'Reffer');
                                                console.log('selectedProfile', profile);
                                              }}
                                            >
                                              Reffer
                                            </button>
                                          )}

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
                                            onClick={() => openleadHistoryPanel(profile)}
                                          >
                                            History List
                                          </button>



                                        </div>
                                      </div>



                                      <button
                                        className="btn btn-sm btn-outline-secondary border-0"
                                        onClick={() => toggleLeadDetails(profileIndex)}
                                      >
                                        {leadDetailsVisible === profileIndex ? (
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
                                <ul className="nav nav-pills nav-pills-sm">
                                  {tabs.map((tab, tabIndex) => (
                                    <li className="nav-item" key={tabIndex}>
                                      <button
                                        className={`nav-link ${(activeTab[profileIndex] || 0) === tabIndex ? 'active' : ''}`}
                                        onClick={() => handleTabClick(profileIndex, tabIndex, profile)}
                                      >
                                        {tab}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Tab Content - Only show if leadDetailsVisible is true */}
                              {leadDetailsVisible === profileIndex && (
                                isLoadingProfilesData ? (
                                  <div className="text-center">
                                    <div className="spinner-border" role="status">
                                      <span className="visually-hidden">Loading...</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="tab-content">

                                    {/* Lead Details Tab */}
                                    {/* {activeTab === 0 && ( */}
                                    {(activeTab[profileIndex] || 0) === 0 && (
                                      <div className="tab-pane active" id="lead-details">
                                        {/* Your lead details content here */}
                                        <div className="scrollable-container">
                                          <div className="scrollable-content">
                                            <div className="info-card">
                                              <div className="info-group">
                                                <div className="info-label">LEAD AGE</div>
                                                <div className="info-value">{profile.createdAt ?
                                                  Math.floor((new Date() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24)) + ' Days'
                                                  : 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">Lead Owner</div>
                                                <div className="info-value">{profile.leadOwner?.join(', ') || 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">COURSE / JOB NAME</div>
                                                <div className="info-value">{profile._course?.name}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">BATCH NAME</div>
                                                <div className="info-value">{profile._course?.batchName || 'N/A'}</div>
                                              </div>

                                              {/* <div className="info-group">
                                                <div className="info-label">Source Contact Name</div>
                                                <div className="info-value">{profile._candidate?.sourceInfo?.sourceName || 'N/A'}</div>
                                              </div> */}
                                            </div>

                                            <div className="info-card">
                                              <div className="info-group">
                                                <div className="info-label">TYPE OF PROJECT</div>
                                                <div className="info-value">{profile._course?.typeOfProject}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">PROJECT</div>
                                                <div className="info-value">{profile._course?.projectName || 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">SECTOR</div>
                                                <div className="info-value">{profile.sector}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">LEAD CREATION DATE</div>
                                                <div className="info-value">{profile.createdAt ?
                                                  new Date(profile.createdAt).toLocaleString() : 'N/A'}</div>
                                              </div>
                                            </div>

                                            <div className="info-card">
                                              <div className="info-group">
                                                <div className="info-label">STATE</div>
                                                <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.state || 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">City</div>
                                                <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.city || 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">BRANCH NAME</div>
                                                <div className="info-value">{profile._center?.name || 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">LEAD MODIFICATION DATE</div>
                                                <div className="info-value">{profile.updatedAt ?
                                                  new Date(profile.updatedAt).toLocaleString() : 'N/A'}</div>
                                              </div>
                                              <div className="info-group">
                                                <div className="info-label">Remarks</div>
                                                <div className="info-value">{profile.remarks || 'N/A'}</div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>


                                        <div className="scroll-arrow scroll-left d-md-none" onClick={scrollLeft}>&lt;</div>
                                        <div className="scroll-arrow scroll-right d-md-none" onClick={scrollRight}>&gt;</div>


                                        <div className="desktop-view">
                                          <div className="row g-4">

                                            <div className="col-12">
                                              <div className="scrollable-container">
                                                <div className="scrollable-content">
                                                  <div className="info-card">
                                                    <div className="info-group">
                                                      <div className="info-label">LEAD AGE</div>
                                                      <div className="info-value">{profile.createdAt ?
                                                        Math.floor((new Date() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24)) + ' Days'
                                                        : 'N/A'}</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">Lead Owner</div>
                                                      <div className="info-value">{profile.leadOwner?.join(', ') || 'N/A'}</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">COURSE / JOB NAME</div>
                                                      <div className="info-value">{profile._course?.name}</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">BATCH NAME</div>
                                                      <div className="info-value">{profile._course?.batchName || 'N/A'}</div>
                                                    </div>
                                                    {/* <div className="info-group">
                                                      <div className="info-label">Source Contact Name</div>
                                                      <div className="info-value">{profile._candidate?.sourceInfo?.sourceName || 'N/A'}</div>
                                                    </div> */}
                                                  </div>

                                                  <div className="info-card">
                                                    <div className="info-group">
                                                      <div className="info-label">TYPE OF PROJECT</div>
                                                      <div className="info-value">{profile._course?.typeOfProject}</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">PROJECT</div>
                                                      <div className="info-value">{profile._course?.projectName || 'N/A'}</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">SECTOR</div>
                                                      <div className="info-value">{profile._course?.sectors}</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">LEAD CREATION DATE</div>
                                                      <div className="info-value">{profile.createdAt ?
                                                        new Date(profile.createdAt).toLocaleString() : 'N/A'}</div>
                                                    </div>
                                                  </div>

                                                  <div className="info-card">
                                                    <div className="info-group">
                                                      <div className="info-label">STATE</div>
                                                      <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.state || 'N/A'}</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">City</div>
                                                      <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.city || 'N/A'}</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">BRANCH NAME</div>
                                                      <div className="info-value">{profile._center?.name || 'N/A'}</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">LEAD MODIFICATION DATE</div>
                                                      <div className="info-value">{profile.updatedAt ?
                                                        new Date(profile.updatedAt).toLocaleString() : 'N/A'}</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">Remarks</div>
                                                      <div className="info-value">{profile.remarks || 'N/A'}</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">LEAD MODIFICATION By</div>
                                                      <div className="info-value">Mar 21, 2025 3:32 PM</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">Counsellor Name</div>
                                                      <div className="info-value">{profile.leadAssignment && profile.leadAssignment.length > 0 ? profile.leadAssignment[profile.leadAssignment.length - 1]?.counsellorName || 'N/A' : 'N/A'}</div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="scroll-arrow scroll-left d-md-none">&lt;</div>
                                              <div className="scroll-arrow scroll-right  d-md-none">&gt;</div>

                                              <div className="desktop-view">
                                                <div className="row">
                                                  <div className="col-xl-3 col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">LEAD AGE</div>
                                                      <div className="info-value">{profile.createdAt ?
                                                        Math.floor((new Date() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24)) + ' Days'
                                                        : 'N/A'}</div>
                                                    </div>
                                                  </div>

                                                  <div className="col-xl-3 col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">STATE</div>
                                                      <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.state || 'N/A'}</div>
                                                    </div>
                                                  </div>
                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">CITY</div>
                                                      <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.city || 'N/A'}</div>
                                                    </div>
                                                  </div>
                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">TYPE OF PROJECT</div>
                                                      <div className="info-value">{profile._course?.typeOfProject}</div>
                                                    </div>
                                                  </div>
                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">PROJECT</div>
                                                      <div className="info-value">{profile._course?.projectName || 'N/A'}</div>
                                                    </div>
                                                  </div>
                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">Sector</div>
                                                      <div className="info-value">{profile._course?.sectors}</div>
                                                    </div>
                                                  </div>
                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">COURSE / JOB NAME</div>
                                                      <div className="info-value">{profile._course?.name}</div>
                                                    </div>
                                                  </div>


                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">BRANCH NAME</div>
                                                      <div className="info-value">{profile._center?.name || 'N/A'}</div>
                                                    </div>
                                                  </div>
                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">NEXT ACTION DATE</div>
                                                      <div className="info-value">
                                                        {profile.followup?.followupDate ? (() => {
                                                          const dateObj = new Date(profile.followup?.followupDate);
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

                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">LEAD CREATION DATE</div>
                                                      <div className="info-value">{profile.createdAt ? (() => {
                                                        const dateObj = new Date(profile.createdAt);
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
                                                      })() : 'N/A'}</div>
                                                    </div>
                                                  </div>
                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">LEAD MODIFICATION DATE</div>
                                                      <div className="info-value">{profile.updatedAt ? (() => {
                                                        const dateObj = new Date(profile.updatedAt);
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
                                                      })() : 'N/A'}</div>
                                                    </div>
                                                  </div>
                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">Remarks</div>
                                                      <div className="info-value">{profile.remarks || 'N/A'}</div>
                                                    </div>
                                                  </div>
                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">LEAD MODIFICATION BY</div>
                                                      <div className="info-value">{profile.logs?.length ? profile.logs[profile.logs.length - 1]?.user?.name || '' : ''}
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">Counsellor Name</div>
                                                      <div className="info-value"> {profile.leadAssignment && profile.leadAssignment.length > 0 ? profile.leadAssignment[profile.leadAssignment.length - 1]?.counsellorName || 'N/A' : 'N/A'}</div>
                                                    </div>
                                                  </div>
                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">LEAD OWNER</div>
                                                      <div className="info-value">{profile.registeredBy?.name || 'Self Registerd'}</div>
                                                    </div>

                                                  </div>
                                                  {/* <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">Source Contact Name</div>
                                                      <div className="info-value">{profile._candidate?.sourceInfo?.sourceName || 'N/A'}</div>
                                                    </div>
                                                  </div> */}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Profile Tab */}
                                    {/* {activeTab === 1 && ( */}
                                    {(activeTab[profileIndex] || 0) === 1 && (
                                      <div className="tab-pane active" id="profile">
                                        <div className="resume-preview-body">
                                          <div id="resume-download" className="resume-document">

                                            <div className="resume-document-header">
                                              <div className="resume-profile-section">
                                                {profile._candidate?.personalInfo?.image ? (
                                                  <img
                                                    src={`${profile._candidate?.personalInfo?.image}`}
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
                                                    {profile._candidate?.name || 'Your Name'}
                                                  </h1>
                                                  <p className="resume-title">
                                                    {profile._candidate?.personalInfo?.professionalTitle || 'Professional Title'}
                                                  </p>
                                                  <p className="resume-title">
                                                    {profile._candidate?.sex || 'Sex'}
                                                  </p>

                                                  <div className="resume-contact-details">

                                                    <div className="resume-contact-item">
                                                      <i className="bi bi-telephone-fill"></i>
                                                      <span>{profile._candidate?.mobile}</span>
                                                    </div>


                                                    <div className="resume-contact-item">
                                                      <i className="bi bi-envelope-fill"></i>
                                                      <span>{profile._candidate?.email}</span>
                                                    </div>

                                                    {profile._candidate?.dob && (
                                                      <div className="resume-contact-item">
                                                        <i className="bi bi-calendar-heart-fill"></i>
                                                        {new Date(profile._candidate.dob).toLocaleDateString('en-IN', {
                                                          day: '2-digit',
                                                          month: 'long',
                                                          year: 'numeric'
                                                        })}
                                                      </div>
                                                    )}
                                                    {profile._candidate?.personalInfo?.currentAddress?.city && (
                                                      <div className="resume-contact-item">
                                                        <i className="bi bi-geo-alt-fill"></i>
                                                        <span>Current:{profile._candidate.personalInfo.currentAddress.fullAddress}</span>
                                                      </div>
                                                    )}
                                                    {profile._candidate?.personalInfo?.permanentAddress?.city && (
                                                      <div className="resume-contact-item">
                                                        <i className="bi bi-house-fill"></i>
                                                        <span>Permanent: {profile._candidate.personalInfo.permanentAddress.fullAddress}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="resume-summary">
                                                <h2 className="resume-section-title">Professional Summary</h2>
                                                <p>{profile._candidates?.personalInfo?.summary || 'No summary provided'}</p>
                                              </div>
                                            </div>


                                            <div className="resume-document-body">

                                              <div className="resume-column resume-left-column">

                                                {profile._candidate?.isExperienced === false ? (
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
                                                  profile._candidate?.experiences?.length > 0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">Work Experience</h2>
                                                      {profile._candidate.experiences.map((exp, index) => (
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

                                                {profile._candidate?.qualifications?.length > 0 && (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">Education</h2>
                                                    {profile._candidate.qualifications.map((edu, index) => (
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

                                                {profile._candidate?.personalInfo?.skills?.length > 0 && (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">Skills</h2>
                                                    <div className="resume-skills-list">
                                                      {profile._candidate?.personalInfo?.skills?.map((skill, index) => (
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



                                                {profile._candidate?.personalInfo?.languages?.length > 0 && (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">Languages</h2>
                                                    <div className="resume-languages-list">
                                                      {profile._candidate.personalInfo.languages.map((lang, index) => (
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


                                                {profile._candidate?.personalInfo?.certifications?.length > 0 && (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">Certifications</h2>
                                                    <ul className="resume-certifications-list">
                                                      {profile._candidate.personalInfo.certifications.map((cert, index) => (
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


                                                {profile._candidate?.personalInfo?.projects?.length > 0 && (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">Projects</h2>
                                                    {profile._candidate.personalInfo.projects.map((proj, index) => (
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


                                                {profile._candidate?.personalInfo?.interest?.length > 0 && (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">Interests</h2>
                                                    <div className="resume-interests-tags">
                                                      {profile._candidate.personalInfo.interest.map((interest, index) => (
                                                        <span className="resume-interest-tag" key={`resume-interest-${index}`}>
                                                          {interest}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}

                                              </div>
                                            </div>


                                            {profile._candidate?.personalInfo?.declaration?.text && (
                                              <div className="resume-declaration">
                                                <h2 className="resume-section-title">Declaration</h2>
                                                <p>{profile._candidate.personalInfo.declaration.text}</p>

                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>


                                    )}

                                    {/* Job History Tab */}
                                    {/* {activeTab === 2 && ( */}
                                    {(activeTab[profileIndex] || 0) === 2 && (
                                      <div className="tab-pane active" id="job-history">
                                        <div className="section-card">
                                          <div className="table-responsive">
                                            <table className="table table-hover table-bordered job-history-table">
                                              <thead className="table-light">
                                                <tr>
                                                  <th>S.No</th>
                                                  <th>Company Name</th>
                                                  <th>Position</th>
                                                  {/* <th>Duration</th>
                                                  <th>Location</th>
                                                  <th>Status</th> */}
                                                </tr>
                                              </thead>
                                              <tbody>

                                                {jobHistory?.length > 0 ? (
                                                  jobHistory?.map((job, index) => (
                                                    <tr key={index}>
                                                      <td>{index + 1}</td>
                                                      <td>{job._job.displayCompanyName}</td>
                                                      <td>{job._job.title}</td>
                                                      {/* <td>
                                                                  {job.from ? moment(job.from).format('MMM YYYY') : 'N/A'} -
                                                                  {job.currentlyWorking ? 'Present' : job.to ? moment(job.to).format('MMM YYYY') : 'N/A'}
                                                                </td>
                                                                <td>Remote</td>
                                                                <td><span className="text-success">Completed</span></td> */}
                                                    </tr>
                                                  ))
                                                ) : (
                                                  <tr>
                                                    <td colSpan={6} className="text-center">No job history available</td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Course History Tab */}
                                    {/* {activeTab === 3 && ( */}
                                    {(activeTab[profileIndex] || 0) === 3 && (

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

                                    {/* Documents Tab */}
                                    {/* {activeTab === 4 && ( */}

                                    {(activeTab[profileIndex] || 0) === 4 && (
                                      <div className="tab-pane active" id='studentsDocuments'>
                                        {(() => {
                                          const documentsToDisplay = profile.uploadedDocs || [];
                                          const totalRequired = profile?.docCounts?.totalRequired || 0;

                                          // If no documents are required, show a message
                                          if (totalRequired === 0) {
                                            return (
                                              <div className="col-12 text-center py-5">
                                                <div className="text-muted">
                                                  <i className="fas fa-file-check fa-3x mb-3 text-success"></i>
                                                  <h5 className="text-success">No Documents Required</h5>
                                                  <p>This course does not require any document verification.</p>
                                                </div>
                                              </div>

                                            );
                                          }

                                          // If documents are required, show the full interface
                                          return (
                                            <div className="enhanced-documents-panel">
                                              {/* Enhanced Stats Grid */}
                                              <div className="stats-grid">
                                                {(() => {
                                                  // Use backend counts only, remove static document fallback
                                                  const backendCounts = profile?.docCounts || {};
                                                  return (
                                                    <>
                                                      <div className="stat-card total-docs">
                                                        <div className="stat-icon">
                                                          <i className="fas fa-file-alt"></i>
                                                        </div>
                                                        <div className="stat-info">
                                                          <h4>{backendCounts.totalRequired || 0}</h4>
                                                          <p>Total Required</p>
                                                        </div>
                                                        <div className="stat-trend">
                                                          <i className="fas fa-list"></i>
                                                        </div>
                                                      </div>

                                                      <div className="stat-card uploaded-docs">
                                                        <div className="stat-icon">
                                                          <i className="fas fa-cloud-upload-alt"></i>
                                                        </div>
                                                        <div className="stat-info">
                                                          <h4>{backendCounts.uploadedCount || 0}</h4>
                                                          <p>Uploaded</p>
                                                        </div>
                                                        <div className="stat-trend">
                                                          <i className="fas fa-arrow-up"></i>
                                                        </div>
                                                      </div>

                                                      <div className="stat-card pending-docs">
                                                        <div className="stat-icon">
                                                          <i className="fas fa-clock"></i>
                                                        </div>
                                                        <div className="stat-info">
                                                          <h4>{backendCounts.pendingVerificationCount || 0}</h4>
                                                          <p>Pending Review</p>
                                                        </div>
                                                        <div className="stat-trend">
                                                          <i className="fas fa-exclamation-triangle"></i>
                                                        </div>
                                                      </div>

                                                      <div className="stat-card verified-docs">
                                                        <div className="stat-icon">
                                                          <i className="fas fa-check-circle"></i>
                                                        </div>
                                                        <div className="stat-info">
                                                          <h4>{backendCounts.verifiedCount || 0}</h4>
                                                          <p>Approved</p>
                                                        </div>
                                                        <div className="stat-trend">
                                                          <i className="fas fa-thumbs-up"></i>
                                                        </div>
                                                      </div>

                                                      <div className="stat-card rejected-docs">
                                                        <div className="stat-icon">
                                                          <i className="fas fa-times-circle"></i>
                                                        </div>
                                                        <div className="stat-info">
                                                          <h4>{backendCounts.RejectedCount || 0}</h4>
                                                          <p>Rejected</p>
                                                        </div>
                                                        <div className="stat-trend">
                                                          <i className="fas fa-arrow-down"></i>
                                                        </div>
                                                      </div>
                                                    </>
                                                  );
                                                })()}
                                              </div>

                                              {/* Enhanced Filter Section */}
                                              <div className="filter-section-enhanced">
                                                <div className="filter-tabs-container">
                                                  <h5 className="filter-title">
                                                    <i className="fas fa-filter me-2"></i>
                                                    Filter Documents
                                                  </h5>
                                                  <div className="filter-tabs">
                                                    {(() => {
                                                      const backendCounts = profile?.docCounts || {};
                                                      return (
                                                        <>
                                                          <button
                                                            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                                                            onClick={() => setStatusFilter('all')}
                                                          >
                                                            <i className="fas fa-list-ul"></i>
                                                            All Documents
                                                            <span className="badge">{backendCounts.totalRequired || 0}</span>
                                                          </button>
                                                          <button
                                                            className={`filter-btn pending ${statusFilter === 'pending' ? 'active' : ''}`}
                                                            onClick={() => setStatusFilter('pending')}
                                                          >
                                                            <i className="fas fa-clock"></i>
                                                            Pending
                                                            <span className="badge">{backendCounts.pendingVerificationCount || 0}</span>
                                                          </button>
                                                          <button
                                                            className={`filter-btn verified ${statusFilter === 'verified' ? 'active' : ''}`}
                                                            onClick={() => setStatusFilter('verified')}
                                                          >
                                                            <i className="fas fa-check-circle"></i>
                                                            Verified
                                                            <span className="badge">{backendCounts.verifiedCount || 0}</span>
                                                          </button>
                                                          <button
                                                            className={`filter-btn rejected ${statusFilter === 'rejected' ? 'active' : ''}`}
                                                            onClick={() => setStatusFilter('rejected')}
                                                          >
                                                            <i className="fas fa-times-circle"></i>
                                                            Rejected
                                                            <span className="badge">{backendCounts.RejectedCount || 0}</span>
                                                          </button>
                                                        </>
                                                      );
                                                    })()}
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Enhanced Documents Grid */}
                                              <div className="documents-grid-enhanced">
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
                                                      <div key={doc._id || index} className="document-card-enhanced">
                                                        <div className="document-image-container">
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
                                                                    />
                                                                  );
                                                                } else if (fileType === 'pdf') {
                                                                  return (
                                                                    <div className="document-preview-icon">
                                                                      <i className="fa-solid fa-file" style={{ fontSize: '100px', color: '#dc3545' }}></i>
                                                                      <p style={{ fontSize: '12px', marginTop: '10px' }}>PDF Document</p>
                                                                    </div>
                                                                  );
                                                                } else {
                                                                  return (
                                                                    <div className="document-preview-icon">
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
                                                              <div className="image-overlay">
                                                                <button
                                                                  className="preview-btn"
                                                                  onClick={() => openDocumentModal(doc)}
                                                                >
                                                                  <i className="fas fa-search-plus"></i>
                                                                  Preview
                                                                </button>
                                                              </div>
                                                            </>
                                                          ) : (
                                                            <div className="no-document-placeholder">
                                                              <i className="fas fa-file-upload"></i>
                                                              <p>No Document</p>
                                                            </div>
                                                          )}

                                                          {/* Status Badge Overlay */}
                                                          <div className="status-badge-overlay">
                                                            {(latestUpload?.status === 'Pending' || doc.status === 'Pending') && (
                                                              <span className="status-badge-new pending">
                                                                <i className="fas fa-clock"></i>
                                                                Pending
                                                              </span>
                                                            )}
                                                            {(latestUpload?.status === 'Verified' || doc.status === 'Verified') && (
                                                              <span className="status-badge-new verified">
                                                                <i className="fas fa-check-circle"></i>
                                                                Verified
                                                              </span>
                                                            )}
                                                            {(latestUpload?.status === 'Rejected' || doc.status === 'Rejected') && (
                                                              <span className="status-badge-new rejected">
                                                                <i className="fas fa-times-circle"></i>
                                                                Rejected
                                                              </span>
                                                            )}
                                                            {(!latestUpload && doc.status === "Not Uploaded") && (
                                                              <span className="status-badge-new not-uploaded">
                                                                <i className="fas fa-upload"></i>
                                                                Required
                                                              </span>
                                                            )}
                                                          </div>
                                                        </div>

                                                        <div className="document-info-section">
                                                          <div className="document-header">
                                                            <h4 className="document-title">{doc.Name || `Document ${index + 1}`}</h4>
                                                            <div className="document-actions">
                                                              {(!latestUpload) ? (
                                                                <button className="action-btn upload-btn" title="Upload Document" data-bs-toggle="modal" data-bs-target="#staticBackdrop" onClick={() => {
                                                                  setSelectedProfile(profile); // Set the current profile
                                                                  openUploadModal(doc);        // Open the upload modal
                                                                }}>
                                                                  <i className="fas fa-cloud-upload-alt"></i>
                                                                  Upload
                                                                </button>
                                                              ) : (
                                                                <button
                                                                  className="action-btn verify-btn"
                                                                  onClick={() => openDocumentModal(doc)}
                                                                  title="Verify Document"
                                                                >
                                                                  <i className="fas fa-search"></i>
                                                                  PREVIEW
                                                                </button>
                                                              )}
                                                            </div>
                                                          </div>

                                                          <div className="document-meta">
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

                                              {/* <DocumentModal /> */}
                                              {showDocumentModal && (
                                                <DocumentModal
                                                  showDocumentModal={showDocumentModal}
                                                  selectedDocument={selectedDocument}
                                                  closeDocumentModal={closeDocumentModal}
                                                  updateDocumentStatus={updateDocumentStatus}
                                                  getFileType={getFileType}
                                                />
                                              )}
                                              <div className="modal fade w-100" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                                <div className="modal-dialog d-flex  justify-content-center mx-auto w-100">
                                                  <div className="modal-content p-0 w-100">
                                                    <div className="modal-header">
                                                      <h3>
                                                        <i className="fas fa-cloud-upload-alt me-2"></i>
                                                        Upload {selectedDocumentForUpload?.Name || 'Document'}
                                                      </h3>
                                                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={closeUploadModal}></button>
                                                    </div>
                                                    <div className="modal-body">



                                                      <div className="upload-section">
                                                        {!selectedFile ? (
                                                          <div className="file-drop-zone">
                                                            <div className="drop-zone-content">
                                                              <i className="fas fa-cloud-upload-alt upload-icon"></i>
                                                              <h4>Choose a file to upload</h4>
                                                              <p>Drag and drop a file here, or click to select</p>
                                                              <div className="file-types">
                                                                <span>Supported: JPG, PNG, GIF, PDF</span>
                                                                <span>Max size: 10MB</span>
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
                                                              >
                                                                <i className="fas fa-folder-open me-2"></i>
                                                                Choose File
                                                              </button>
                                                            </div>
                                                          </div>
                                                        ) : (
                                                          <div className="file-preview-section">
                                                            <div className="selected-file-info">
                                                              <h4>Selected File:</h4>
                                                              <div className="file-details">
                                                                <div className="file-icon">
                                                                  <i className={`fas ${selectedFile.type.startsWith('image/') ? 'fa-image' : 'fa-file-pdf'}`}></i>
                                                                </div>
                                                                <div className="file-info">
                                                                  <p className="file-name">{selectedFile.name}</p>
                                                                  <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
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
                                                              <div className="upload-preview">
                                                                <h5>Preview:</h5>
                                                                <img src={uploadPreview} alt="Upload Preview" className="preview-image" />
                                                              </div>
                                                            )}

                                                            {isUploading && (
                                                              <div className="upload-progress-section">
                                                                <h5>Uploading...</h5>
                                                                <div className="progress-bar-container">
                                                                  <div
                                                                    className="progress-bar"
                                                                    style={{ width: `${uploadProgress}%` }}
                                                                  ></div>
                                                                </div>
                                                                <p>{uploadProgress}% Complete</p>
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

                                  </div>)
                              )}
                            </div>

                            {/* <div class="modal fade" id={`profileModal-${profile._id}`} data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby={`profileModalLabel-${profile._id}`} aria-hidden="true">
                              <div class="modal-dialog modal-dialog-scrollable">
                                <div class="modal-content new-modal-content">
                                  <div class="modal-header">
                                    <h1 class="modal-title fs-5" id={`profileModalLabel-${profile._id}`}>Modal title</h1>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                  </div>
                                  <div class="modal-body">
                                    <CandidateProfile ref={candidateRef} />
                                  </div>
                                  <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    <button onClick={handleSaveCV} type="button" class="btn btn-primary">Save CV</button>
                                  </div>
                                </div>
                              </div>
                            </div> */}

                            {openModalId === profile._id && (
                              <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-dialog-scrollable m-0 mt-2">
                                  <div className="modal-content new-modal-content">
                                    <div className="modal-header">
                                      <h1 className="modal-title fs-5">Candidate Profile</h1>
                                      <button type="button" className="btn-close" onClick={() => { setOpenModalId(null); setSelectedProfile(null) }}></button>
                                    </div>
                                    <div className="modal-body">
                                      {console.log('Modal body rendering, candidateRef:', candidateRef)}
                                      <CandidateProfile ref={candidateRef} />
                                    </div>
                                    <div className="modal-footer">
                                      <button type="button" className="btn btn-secondary" onClick={() => { setOpenModalId(null); setSelectedProfile(null) }}>Close</button>
                                      <button onClick={handleSaveCV} type="button" className="btn btn-primary">Save CV</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {showBranchModal && (
                              <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered">
                                  <div className="modal-content">
                                    <div className="modal-header">
                                      <h1 className="modal-title fs-5">Select Branch</h1>
                                      <button type="button" className="btn-close" onClick={() => setShowBranchModal(false)}></button>
                                    </div>
                                    <div className="modal-body">
                                      <div className="position-relative">
                                        <select
                                          className="form-select border-0 shadow-sm"
                                          id="course"
                                          value={selectedBranch}
                                          onChange={(e) => setSelectedBranch(e.target.value)}
                                          style={{
                                            height: '48px',
                                            padding: '12px 16px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            transition: 'all 0.3s ease',
                                            border: '1px solid #e9ecef',

                                          }}

                                        >
                                          <option value="">Select Branch</option>
                                          {branches && branches.data && branches.data.length > 0 && branches.data.map((branch, index) => (
                                            <option key={branch._id || index} value={branch._id}>
                                              {branch.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>


                                    </div>
                                    <div className="modal-footer">
                                      <button type="button" className="btn btn-secondary" onClick={() => {
                                        setShowBranchModal(false);
                                        setSelectedBranch('');
                                      }}>Close</button>
                                      <button type="button" className="btn btn-primary" onClick={() => updateBranch(profile, selectedBranch)}>Save Branch</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            <style>
                              {
                                `.new-modal-content{
                                 width:1000px!important;
                                 transform: translateX(25%);
                                 }

                                 @media(max-width:768px){
                                 .new-modal-content{
                                 width:100%!important;
                                 transform: translateX(0%)
                                 }
                                 }
                                  `
                              }
                            </style>
                          </div>


                        ))}




                      </div>


                    </div>
                  </div>
                </div>

              </div>

              <nav aria-label="Page navigation" className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <small className="text-muted">
                    Page {currentPage} of {totalPages} ({allProfiles.length} results)
                  </small>
                </div>

                <ul className="pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo;
                    </button>
                  </li>

                  {currentPage > 3 && (
                    <>
                      <li className="page-item">
                        <button className="page-link" onClick={() => setCurrentPage(1)}>1</button>
                      </li>
                      {currentPage > 4 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                    </>
                  )}

                  {getPaginationPages().map((pageNumber) => (
                    <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(pageNumber)}>
                        {pageNumber}
                      </button>
                    </li>
                  ))}

                  {currentPage < totalPages - 2 && !getPaginationPages().includes(totalPages) && (
                    <>
                      {currentPage < totalPages - 3 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                      <li className="page-item">
                        <button className="page-link" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                      </li>
                    </>
                  )}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </section>
          </div>

        </div>

        {/* Right Sidebar for Desktop - Panels */}
        {!isMobile && (
          <div className="col-4">
            <div className="row " style={{

              transition: 'margin-top 0.2s ease-in-out',
              position: 'fixed',
              width: '-webkit-fill-available',
              zIndex: '10'
            }}>
              {renderEditPanel()}
              {renderRefferPanel()}
              {renderWhatsAppPanel()}
              {renderLeadHistoryPanel()}
              {renderAllLeadPanel()}
              {renderChangeCenterPanel()}
            </div>
          </div>
        )}

        {/* Mobile Modals */}
        {isMobile && renderEditPanel()}
        {isMobile && renderRefferPanel()}
        {isMobile && renderWhatsAppPanel()}
        {isMobile && renderLeadHistoryPanel()}
        {isMobile && renderAllLeadPanel()}
        {isMobile && renderChangeCenterPanel()}
      </div>
      <UploadModal />

      {/* <div style={{ background: 'rgba(0, 0, 0, 0.5)', width: '100%', position: 'absolute', minHeight: '100vh', top: '0', zIndex: '13', position: 'fixed' }}>
        <div className='card' style={{ border: '1px solid red', width: '70%', height: '100%' }}>
          <CandidateProfile />
        </div>
      </div> */}

      {/* <!-- Button trigger modal --> */}




      <style>
        {`
        /* Existing styles */
        html body .content .content-wrapper {
          padding: calc(0.9rem - 0.1rem) 1.2rem
        }
.modal-header {
    background-color: #fc2b5a;
    border-bottom: none;
    color: #fff;
}

        .bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .transition-all {
          transition: all 0.3s ease;
        }

        .nav-pills-sm .nav-link {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        }

        .sticky-top {
          position: sticky !important;
        }

        .btn-group .btn {
          border-radius: 0.375rem;
        }

        .btn-group .btn:not(:last-child) {
          margin-right: 0.25rem;
        }

        .card {
          transition: box-shadow 0.15s ease-in-out;
        }


        .text-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

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
          stroke: #e6e6e6;
          stroke-width: 4;
        }

        .circle-progress {
          fill: none;
          stroke: #FC2B5A;
          stroke-width: 4;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.5s ease;
        }

        .circular-progress-container .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 10px;
          color: #333;
        }

        .contact-row {
          border: 1px solid #e0e0e0;
          border-radius: 2px;
          padding: 10px 15px;
          background-color: #fff;
        }

        .userCheckbox {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .contact-checkbox {
          display: flex;
          align-items: center;
        }

        .contact-name {
          font-weight: 500;
          margin-bottom: 0;
        }

        .contact-number {
          color: #888;
          font-size: 0.85rem;
        }

        .transition-col {
          transition: all 0.3s ease-in-out;
        }

        .leadsStatus {
          width: 100%;
          border-bottom: 1px solid #e0e0e0;
        }

        .leadsDetails {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          overflow-x: auto;
          white-space: nowrap;
        }

        .leadsDetails .status {
          padding: 12px 16px;
          font-size: 14px;
          color: #555;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }

        .leadsDetails .status:hover {
          color: #000;
        }

        .leadsDetails .status.active {
          color: #333;
          font-weight: 500;
        }

        .leadsDetails .status.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #007bff;
        }

        .tab-pane {
          display: none;
        }

        .tab-pane.active {
          display: block;
        }

        .info-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .section-title {
          color: #495057;
          font-weight: 600;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #dee2e6;
        }
     

        .tab-pane {
          padding: 0;
          position: relative;
        }

        .scrollable-container {
          display: none;
        }

        .desktop-view {
          display: block;
        }

        .scroll-arrow {
          display: none;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 30px;
          height: 30px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 9;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          border: 1px solid #eaeaea;
        }

        .scroll-left {
          left: 5px;
        }

        .scroll-right {
          right: 5px;
        }
        .document-preview-icon{
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        @media (max-width: 767px) {
          .scrollable-container {
            display: block;
            width: 100%;
            overflow: hidden;
            padding: 10px 0;
          }

          .desktop-view {
            display: none;
          }

          .scrollable-content {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scroll-behavior: smooth;
            padding: 10px 0;
          }

          .info-card {
            flex: 0 0 auto;
            scroll-snap-align: start;
            margin-right: 15px;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #eaeaea;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            background: #fff;
          }

          .scroll-arrow {
            display: flex;
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

          .btn-group {
            flex-wrap: wrap;
          }
          
          .btn-group .btn {
            margin-bottom: 0.25rem;
          }
        }

        .whatsapp-chat {
          height: 100%;
          min-width: 300px;
          box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.12), 0px 1px 10px rgba(0, 0, 0, 0.12), 0px 2px 4px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
        }

        .right-side-panel {
          background: #ffffff !important;
          box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.12), 0px 1px 10px rgba(0, 0, 0, 0.12), 0px 2px 4px rgba(0, 0, 0, 0.04);
          width: 100%;
          height: 73dvh;
        }

        .whatsapp-chat .topbar-container {
          background-color: #fff;
          padding: 8px 16px;
          display: flex;
          /* height: 8%; */
          min-height: 43px;
          align-items: center;
          position: relative;
          justify-content: space-between;
        }

        .whatsapp-chat .topbar-container .left-topbar {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
        }

        .whatsapp-chat .topbar-container .left-topbar .img-container {
          margin-right: 12px;
        }

        .whatsapp-chat .topbar-container .left-topbar .selected-number {
          font-size: 12px;
          color: #393939;
        }

        .small-avatar {
          background: #f17e33;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          text-transform: uppercase;
          font-size: 14px;
        }

        .whatsapp-chat .chat-view {
          background: #E6DDD4;
          flex: 1;
          position: relative;
        }

        .whatsapp-chat .chat-view .chat-container {
          list-style-type: none;
          padding: 18px 10px;
          position: absolute;
          bottom: 0;
          display: flex;
          flex-direction: column;
          padding-right: 15px;
          overflow-x: hidden;
          max-height: 100%;
          margin-bottom: 0px;
          padding-bottom: 12px;
          overflow-y: scroll;
          width: 100%;
        }

        .whatsapp-chat .chat-view .counselor-msg-container {
          display: flex;
          flex-direction: column;
          align-items: end;
        }

        .whatsapp-chat .chat-view .chat-container .chatgroupdate {
          width: 92px;
          height: 24px;
          background: #DCF3FB;
          border-radius: 4px;
          margin-top: 51px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          margin-right: auto;
        }

        .whatsapp-chat .chat-view .chat-container .chatgroupdate span {
          font-size: 13px;
          color: #393939;
        }

        .whatsapp-chat .chat-view .counselor-msg {
          float: right;
          background: #D8FFC0;
          padding-right: 0;
        }

        .whatsapp-chat .chat-view .macro {
          margin-top: 12px;
          max-width: 92%;
          border-radius: 4px;
          padding: 8px;
          display: flex;
          padding-bottom: 2px;
          min-width: 22%;
          transform: scale(0);
          animation: message 0.15s ease-out 0s forwards;
        }

        @keyframes message {
          to {
            transform: scale(1);
          }
        }

        .whatsapp-chat .chat-view .text-r {
          float: right;
        }

        .whatsapp-chat .chat-view .text {
          width: 100%;
          display: flex;
          flex-direction: column;
          color: #4A4A4A;
          font-size: 12px;
        }

        .whatsapp-chat .chat-view .student-messages {
          color: #F17E33;
        }

        .whatsapp-chat .chat-view .message-header-name {
          font-weight: 600;
          font-size: 12px;
          line-height: 18px;
          color: #F17E33;
          position: relative;
          bottom: 4px;
          opacity: 0.9;
        }

        .whatsapp-chat .chat-view .text-message {
          width: 100%;
          margin-top: 0;
          margin-bottom: 2px;
          line-height: 16px;
          font-size: 12px;
          word-break: break-word;
        }

        .whatsapp-chat .chat-view pre {
          white-space: pre-wrap;
          padding: unset !important;
          font-size: unset !important;
          line-height: normal !important;
          color: #4A4A4A !important;
          overflow: unset !important;
          background-color: transparent !important;
          border: none !important;
          border-radius: unset !important;
          font-family: unset !important;
        }

        .whatsapp-chat .footer-container {
          background-color: #F5F6F6;
          box-shadow: 0px -2px 4px rgba(0, 0, 0, 0.09);
          padding: 0;
          height: auto;
          align-items: center;
          border: none !important;
        }

        .whatsapp-chat .footer-container .footer-box {
          padding: 16px;
          background: #F5F6F6;
          border-radius: 6px;
        }

        .whatsapp-chat .footer-container .footer-box .message-container {
          color: black;
          position: relative;
          height: 40px;
        }

        .whatsapp-chat .footer-container .footer-box .message-container .message-input {
          background: #FFFFFF;
          border-radius: 6px 6px 0 0 !important;
          width: 100%;
          min-height: 36px;
          padding: 0px 12px;
          font-size: 12px;
          resize: none;
          position: absolute;
          bottom: 0px;
          line-height: 20px;
          padding-top: 8px;
          border: #fff;
        }

        .whatsapp-chat .footer-container .footer-box .divider {
          border: 1px solid #D8D8D8;
          margin-bottom: 0.8px !important;
          margin-top: -0.8px !important;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input {
          display: flex;
          background: #FFFFFF;
          height: 32px;
          border-radius: 0 0 6px 6px !important;
          justify-content: space-between;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer {
          display: flex;
          justify-content: flex-start;
          align-items: center;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer .margin-bottom-5 {
          margin-bottom: 5px;
          margin-right: 15px;
          margin-left: 10px;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer .margin-right-10 {
          margin-right: 10px;
        }

        .input-template {
          margin-bottom: 5px;
          margin-left: 15px;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .right-footer .send-button {
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          color: #666;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer .fileUploadIcon {
          cursor: pointer;
          color: #666;
          transform: translateY(15px);
        }

        .sessionExpiredMsg {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          padding: 8px 12px;
          margin: 10px 0;
          font-size: 12px;
          color: #856404;
          text-align: center;
        }

        .followUp {
          font-size: 13px;
          font-weight: 500;
          padding-left: 10px;
        }

        .section-card {
          padding: 5px;
          border-radius: 8px;
        }

        .section-title {
          color: #333;
          font-weight: 600;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f0f0f0;
        }
.nav-pills .nav-link.active{
background: #fd2b5a;
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
        }

        .resume-skill-bar {
          height: 100%;
          background: #007bff;
          border-radius: 4px;
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

        .highlight-text {
          color: #007bff;
          font-weight: bold;
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
            .info-group{
            border: none;
            }
              .info-card {

                    flex: 0 0 auto;
                    scroll-snap-align: start;
                    margin-right: 15px;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #eaeaea;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    background: #fff;
                }
                    .input-height{
                    height: 40px;
                    }
                }

                
/* Mobile Modal Styles */


/* WhatsApp Panel Mobile Styles */
.whatsapp-chat {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.topbar-container {
    flex-shrink: 0;
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f8f9fa;
}

.left-topbar {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.small-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #007bff;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.lead-name {
    font-weight: 600;
    font-size: 1rem;
}

.selected-number {
    color: #666;
    font-size: 0.9rem;
}

.right-topbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.chat-view {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background-color: #f0f0f0;
}

.chat-container {
    list-style: none;
    padding: 0;
    margin: 0;
}

.counselor-msg-container {
    margin-bottom: 1.5rem;
}

.chatgroupdate {
    text-align: center;
    margin-bottom: 1rem;
}

.chatgroupdate span {
    background-color: #e3f2fd;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    color: #666;
}

.counselor-msg {
    background-color: #dcf8c6;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    max-width: 80%;
    margin-left: auto;
}

.text-message {
    white-space: pre-wrap;
    margin: 0;
    font-family: inherit;
}

.message-header-name {
    font-weight: 600;
    color: #1976d2;
}

.student-messages {
    color: #2e7d32;
}

.messageTime {
    font-size: 0.75rem;
    color: #666;
    display: block;
    text-align: right;
}

.sessionExpiredMsg {
    text-align: center;
    padding: 1rem;
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 0.5rem;
    margin-top: 1rem;
    color: #856404;
}

.footer-container {
    flex-shrink: 0;
    border-top: 1px solid #e0e0e0;
    background-color: white;
}

.footer-box {
    padding: 1rem;
}

.message-container {
    margin-bottom: 0.5rem;
}

.message-input {
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    padding: 0.5rem;
    resize: none;
    background-color: #f8f9fa;
}

.disabled-style {
    opacity: 0.6;
}

.divider {
    margin: 0.5rem 0;
    border-color: #e0e0e0;
}

.message-container-input {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.bgcolor {
    background-color: #f1f2f6 !important;
}

.left-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.margin-right-10 {
    margin-right: 10px;
}

.margin-bottom-5 {
    margin-bottom: 5px;
}

.margin-horizontal-4 {
    margin: 0 4px;
}

.margin-horizontal-5 {
    margin: 0 5px;
}

.fileUploadIcon {
    width: 20px;
    height: 20px;
    opacity: 0;
    position: absolute;
    cursor: pointer;
}

.input-template {
    cursor: pointer;
}

.send-button {
    text-decoration: none;
}

.send-img {
    width: 20px;
    height: 20px;
}

#whatsappPanel {
    height: 73dvh;
}

.info-group {
    padding: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {

    .whatsapp-chat  {
        height: 90vh;
    }

    .nav-pills {
        flex-wrap: wrap;
    }

    .nav-pills .nav-link {
        font-size: 0.9rem;
        padding: 0.5rem 0.75rem;
    }
}

/* Additional mobile optimizations */
@media (max-width: 576px) {


    .btn-group {
        flex-wrap: wrap;
    }

    .input-group {
        max-width: 100% !important;
        margin-bottom: 0.5rem;
    }
}

/* Add this to your existing style tag or CSS file */
.react-date-picker__wrapper {
    border: 1px solid #ced4da !important;
    border-radius: 0.375rem !important;
}

.react-date-picker__inputGroup input {
    border: none !important;
    outline: none !important;
}

.react-date-picker__clear-button {
    display: none !important;
}

.react-date-picker__calendar-button {
    padding: 4px !important;
}

/* Additional styling for better appearance */
.react-date-picker__inputGroup {
    width: 100%;
    white-space: nowrap;
    background: transparent;
    border: none;
}

.react-date-picker__wrapper {
    background: white !important;
}


.no-scroll {
    overflow: hidden;
}


.doc-iframe {
    transform-origin: top left;
    transition: transform 0.3s ease;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.admin-document-panel {
    margin: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: var(--shadow);
    overflow: hidden;
}

.panel-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    background-color: #4a6fdc;
    color: white;
}

.panel-header h2 {
    color: white;
    font-size: 1.5rem;
    margin: 0;
}

.user-selector {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 14px;
    min-width: 200px;
}

.candidate-info {
    background-color: #e9f0fd;
    padding: 20px;
    border-radius: 6px;
    margin: 20px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.candidate-avatar {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: #4a6fdc;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 24px;
    margin-right: 20px;
}

.candidate-details {
    flex-grow: 1;
}

.candidate-details h3 {
    margin: 0 0 5px 0;
    font-size: 22px;
    color: #333;
}

.candidate-details p {
    margin: 0 0 5px 0;
    color: #555;
}

.candidate-stats {
    display: flex;
    margin-top: 15px;
    flex-wrap: wrap;
    gap: 15px;
}

.stat-box {
    background: white;
    border-radius: 4px;
    padding: 10px 15px;
    min-width: 120px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-box h4 {
    margin: 0 0 5px 0;
    font-size: 14px;
    color: #666;
}

.stat-box p {
    margin: 0;
    font-size: 20px;
    font-weight: bold;
}

.document-list {
    overflow-x: auto;
    margin: 0 20px 20px 20px;
}

.document-table {
    width: 100%;
    border-collapse: collapse;
}

.document-table th {
    background-color: var(--gray-light);
    padding: 12px 15px;
    text-align: left;
    font-weight: 600;
    color: #444;
    border-bottom: 2px solid var(--border-color);
    white-space: nowrap;
}



.document-table tbody tr:hover {
    background-color: #f8f9fa;
}

.document-table td {
    padding: 12px 15px;
    vertical-align: middle;
}

.status-badges {
    display: inline-block;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-pending {
    background-color: #fff3cd;
    color: #856404;
}

.status-approved {
    background-color: #d4edda;
    color: #155724;
}

.status-rejected {
    background-color: #f8d7da;
    color: #721c24;
}

.action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.view-btn {
    color: var(--primary-color);
}

.view-btn:hover {
    background-color: rgba(74, 111, 220, 0.1);
}

.approve-btn {
    color: var(--success-color);
    background-color: #d4edda;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}

.approve-btn:hover {
    background-color: #c3e6cb;
}

.reject-btn {
    color: var(--danger-color);
    background-color: #f8d7da;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}

.reject-btn:hover {
    background-color: #f5c6cb;
}

/* Document Modal Styles - Add these to your existing <style jsx> section */

.document-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(5px);
}

.document-modal-content {
    background: white;
    border-radius: 12px;
    width: 70%;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.document-modal-content .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.document-modal-content .close-btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
}


.document-preview-section {
    flex: 2;
    min-width: 400px;
}

.document-preview-container {
    background: #f8f9fa;
    border-radius: 8px;
    height: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 2px dashed #dee2e6;
}

.document-preview-container img {
    max-width: 100%;
    max-height: 90%;
    object-fit: contain;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preview-controls {
    position: absolute;
    bottom: 0px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    background: rgba(255, 255, 255, 0.9);
    padding: 10px 15px;
    border-radius: 25px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.2s;
}

.control-btn:hover {
    background: #0056b3;
    transform: translateY(-1px);
}

.no-document {
    text-align: center;
    color: #6c757d;
}

.document-info-section {
    flex: 1;
    /* min-width: 300px; */
}

.info-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e9ecef;
}

.info-card h4 {
    margin: 0 0 1rem 0;
    color: #495057;
    font-size: 1.1rem;
    font-weight: 600;
    border-bottom: 2px solid #007bff;
    padding-bottom: 0.5rem;
}

.info-row {
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.info-row strong {
    color: #495057;
    min-width: 120px;
}

.verification-section {
    margin-top: 1.5rem;
}

.verification-steps {
    margin: 0;
    padding-left: 1.5rem;
}

.verification-steps li {
    margin-bottom: 0.5rem;
    color: #6c757d;
    line-height: 1.5;
}

.action-buttons {
    margin-top: 1.5rem;
    display: flex;
    gap: 10px;
}

.action-buttons .btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
}

.rejection-form {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    padding: 1.5rem;
    margin-top: 1.5rem;
}

.rejection-form h4 {
    color: #856404;
    margin: 0 0 1rem 0;
}

.rejection-form textarea {
    width: 100%;
    min-height: 100px!important;
    padding: 10px;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    resize: vertical;
}

/* .document-history {
    overflow-y: auto;
} */

.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e9ecef;
}

.history-item:last-child {
    border-bottom: none;
}

.history-date {
    font-size: 0.9rem;
    color: #6c757d;
    position: absolute;
    top: 20px;
    right: 20px;
}

.history-status {
    font-size: 0.85rem;
    font-weight: 500;
    position: absolute;
    top:10px
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .document-modal-content {
        width: 98%;
        margin: 1rem;
        max-height: 95vh;
    }


    .document-preview-section {
        min-width: auto;
        overflow-y: auto;
    }

    .document-preview-container {
        height: 300px;
    }

    .document-info-section {
        min-width: auto;
    }
}

.m-c {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 1000px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.m-h {
    padding: 15px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f8f9fa;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
}

.m-b {
    padding: 20px;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    overflow-y: auto;
}

.document-preview {
    flex: 2;
    min-width: 400px;
    background-color: var(--gray-light);
    border-radius: 4px;
    height: 500px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    flex-direction: column;

}

.document-preview img {
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.preview-controls {
    text-align: center;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 8px;
    border-radius: 4px;
}

.preview-controls button {
    background-color: #4a6fdc;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    margin: 0 5px;
    cursor: pointer;
}

.document-info {
    flex: 1;
    min-width: 300px;
}

.info-section {
    background-color: #f8f9fa;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 20px;
}

.info-section h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #4a6fdc;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 8px;
}

.document-info p {
    margin-bottom: 10px;
}

.document-history {
    margin-top: 20px;
}

.history-item {
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #e0e0e0;
}

.history-item:last-child {
    border-bottom: none;
}

.history-item .date {
    font-size: 12px;
    color: #777;
}

.modal-actions {
    margin-top: 30px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.rejection-form {
    margin-top: 20px;
    display: none;
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid #dc3545;
}

.rejection-form h4 {
    margin-top: 0;
    color: #721c24;
}

.rejection-form textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    margin-bottom: 10px;
    min-height: 100px;
    resize: vertical;
}

.rejection-form button {
    margin-right: 10px;
}

.filter-bar {
    margin: 0 20px 20px 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
    align-items: center;
}

.filter-label {
    font-weight: 600;
    color: #555;
}

.filter-select {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    min-width: 150px;
}


.page-btn {
    background-color: white;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.page-btn:hover,
.page-btn.active {
    background-color: #4a6fdc;
    color: white;
}
/* Document History Container */
.document-history {
    width: 100%;
    max-height: 1000px;
    height: auto !important;
    padding: 0;
    position: relative;
  }
  
  /* History Item Styling */
  .document-history .history-item {
    display: block !important;
    padding: 15px;
    margin-bottom: 15px;
    background-color: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .document-history .history-item:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
    border-color: #007bff;
  }
  
  /* History Preview Container */
  .document-history .history-preview {
    margin-bottom: 15px;
    width: 100%;
    overflow: visible;
  }
  
  /* Auto Height for All Document Types */
  .document-history .history-preview img {
    width: 100% !important;
    height: auto !important;
    max-width: 100%;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    background-color: #fff;
    cursor: pointer;
    transition: transform 0.3s ease;
  }
  
  .document-history .history-preview img:hover {
    transform: scale(1.02);
  }
  
  /* PDF Auto Height */
  .document-history .history-preview iframe.pdf-thumbnail {
    width: 100% !important;
    height: fit-content !important;
    min-height: 750px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    background-color: #fff;
    cursor: pointer;
  }
  
  /* History Info Section */
  .document-history .history-info {
    padding-top: 15px;
    border-top: 2px solid #e9ecef;
    margin-top: 10px;
  }
   

.enhanced-documents-panel {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    padding: 1.5rem;
    border-radius: 15px;
}

.candidate-header-section {
    margin-bottom: 2rem;
}

.candidate-info-card {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 2rem;
    position: relative;
    overflow: hidden;
}

.candidate-info-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

.candidate-avatar-large {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.candidate-details h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.5rem;
    font-weight: 700;
}

.contact-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.contact-details span {
    color: #666;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.completion-ring {
    margin-left: auto;
    position: relative;
}

.circular-progress {
    position: relative;
}

.percentage-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.percentage {
    display: block;
    font-size: 1.2rem;
    font-weight: bold;
    color: #4facfe;
}

.label {
    font-size: 0.7rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.progress-bar {
    transition: stroke-dasharray 1s ease-in-out;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    transition: all 0.3s ease;
}

.stat-card.total-docs::before {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.stat-card.uploaded-docs::before {
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card.pending-docs::before {
    background: linear-gradient(90deg, #fa709a 0%, #fee140 100%);
}

.stat-card.verified-docs::before {
    background: linear-gradient(90deg, #a8edea 0%, #fed6e3 100%);
}

.stat-card.rejected-docs::before {
    background: linear-gradient(90deg, #ff9a9e 0%, #fecfef 100%);
}

.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
}

.total-docs .stat-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.uploaded-docs .stat-icon {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.pending-docs .stat-icon {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.verified-docs .stat-icon {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.rejected-docs .stat-icon {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.stat-info h4 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: bold;
    color: #333;
}

.stat-info p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
}

.stat-trend {
    margin-left: auto;
    font-size: 1.2rem;
    color: #4facfe;
}

.filter-section-enhanced {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.filter-title {
    margin: 0 0 1rem 0;
    color: #333;
    font-weight: 600;
}

.filter-tabs {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.filter-btn {
    background: #f8f9fa;
    border: 2px solid transparent;
    border-radius: 25px;
    padding: 0.75rem 1.5rem;
    color: #666;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
}

.filter-btn .badges {
    background: #dee2e6;
    color: #495057;
    border-radius: 10px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    margin-left: 0.5rem;
}

.filter-btn:hover {
    background: #e9ecef;
    transform: translateY(-2px);
}

.filter-btn.active {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    border-color: #4facfe;
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

.filter-btn.active .badges {
    background: rgba(255, 255, 255, 0.2);
    color: #fc2b5a;
}

.filter-btn.pending.active {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    box-shadow: 0 5px 15px rgba(250, 112, 154, 0.4);
}

.filter-btn.verified.active {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    color: #2d7d32;
    box-shadow: 0 5px 15px rgba(168, 237, 234, 0.4);
}

.filter-btn.rejected.active {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
    color: #c62828;
    box-shadow: 0 5px 15px rgba(255, 154, 158, 0.4);
}

.documents-grid-enhanced {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 2rem;
}

.document-card-enhanced {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;
}

.document-card-enhanced:hover {
    transform: translateY(-10px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

.document-image-container {
    position: relative;
    height: 200px;
    overflow: hidden;
    background: #f8f9fa;
}

.document-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.document-card-enhanced:hover .document-image {
    transform: scale(1.05);
}

.image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.document-card-enhanced:hover .image-overlay {
    opacity: 1;
}

.preview-btn {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    border: none;
    border-radius: 25px;
    padding: 0.75rem 1.5rem;
    color: white;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

.preview-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(79, 172, 254, 0.6);
}

.no-document-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #ccc;
    font-size: 3rem;
}

.no-document-placeholder p {
    margin-top: 1rem;
    font-size: 1rem;
    color: #999;
}

.status-badges-overlay {
    position: absolute;
    top: 15px;
    right: 15px;
}

.status-badges-new {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.status-badges-new.pending {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    color: white;
}

.status-badges-new.verified {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    color: #2d7d32;
}

.status-badges-new.rejected {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
    color: #c62828;
}

.status-badges-new.not-uploaded {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.document-info-section {
    padding: 1.5rem;
}

.document-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.document-title {
    margin: 0;
    color: #333;
    font-size: 0.9rem;
    font-weight: 700;
    flex: 1;
}

.document-actions {
    margin-left: 1rem;
}

.action-btn {
    border: none;
    border-radius: 20px;
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.upload-btn {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    color: white;
    box-shadow: 0 3px 10px rgba(250, 112, 154, 0.4);
}

.verify-btn {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
    color: #c62828;
    box-shadow: 0 3px 10px rgba(255, 154, 158, 0.4);
}

.view-btn {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    box-shadow: 0 3px 10px rgba(79, 172, 254, 0.4);
}

.action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.document-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    font-size: 0.9rem;
}

.meta-text {
    color: #333;
}
  /* Responsive Design */
  @media (max-width: 1200px) {
    .document-history .history-preview iframe.pdf-thumbnail {
      height: auto !important;
      max-height: 600px;
    }
  }

@media (max-width: 768px) {
    .enhanced-documents-panel {
        padding: 1rem;
    }

    .candidate-info-card {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }

    .completion-ring {
        margin-left: 0;
    }

    .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }

    .documents-grid-enhanced {
        grid-template-columns: 1fr;
    }

    .filter-tabs {
        justify-content: center;
    }

    .document-header {
        flex-direction: column;
        gap: 1rem;
    }

    .document-actions {
        margin-left: 0;
        align-self: stretch;
    }

    .action-btn {
        width: 100%;
        justify-content: center;
    }
}

@media (max-width: 768px) {
    .document-history .history-preview iframe.pdf-thumbnail {
      height: 50vh !important;
      min-height: 300px;
      max-height: 500px;
    }
    
    .document-history .history-item {
      padding: 12px;
      margin-bottom: 12px;
    }
  }

@media (max-width: 768px) {
    .panel-header {
        flex-direction: column;
        align-items: stretch;
    }

    .m-b {
        flex-direction: column;
    }

    .candidate-info {
        flex-direction: column;
        text-align: center;
    }

    .candidate-avatar {
        margin: 0 0 15px 0;
    }

    .filter-bar {
        flex-direction: column;
        align-items: flex-start;
    }

    .filter-select {
        width: 100%;
    }
}
@media (max-width: 480px) {
    .document-history .history-preview iframe,
    .document-history .history-preview img {
      max-height: 300px;
      min-height: 150px;
    }
    
    .document-history .history-preview iframe.pdf-thumbnail {
      height: 40vh !important;
      min-height: 200px;
    }
  }

        .stickyBreakpoints {
          position: sticky;
          top: 20px;
          z-index: 11;
        }
          .site-header--sticky--register--panels {
    top: 258px;
    z-index: 10;
}
           #editFollowupPanel {
   height: -webkit-fill-available
   
}
#editFollowupPanel .card-body {
    height: 100dvh;
    overflow: scroll;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
    padding-bottom: 220px;
}
@media (min-width: 992px) {
    .site-header--sticky--register--panels:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        background: white;
    }
        }
        .react-date-picker__wrapper {
          border: none;
        }

        .react-date-picker__inputGroup input {
          border: none !important
        }

        .react-date-picker__inputGroup {
          width: 100%;
          white-space: nowrap;
          background: transparent;
          border: none;
        }

        .react-date-picker__clear-button {
          display: none;
        }

        /* Main Tabs Styling */
        .main-tabs-container {
          border-bottom: 1px solid #dee2e6;
          margin-bottom: 0;
        }

        .nav-tabs-main {
          border-bottom: none;
        }

        .nav-link.main-tab {
          background: none;
          border: none;
          color: #6c757d;
          font-weight: 600;
          font-size: 16px;
          padding: 15px 25px;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-link.main-tab:hover {
          color: #0d6efd;
          background-color: rgba(13, 110, 253, 0.05);
          border-bottom-color: rgba(13, 110, 253, 0.3);
        }

        .nav-link.main-tab.active {
          color: #0d6efd;
          background-color: rgba(13, 110, 253, 0.1)!important;
          border-bottom-color: #0d6efd;
        }

        /* Tab Badge Styling */
        .tab-badge {
          background: linear-gradient(45deg, #fd7e14, #e8590c);
          color: white;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
          min-width: 20px;
          text-align: center;
        }

        .nav-link.main-tab.active .tab-badge {
          background: linear-gradient(45deg, #0d6efd, #0b5ed7);
        }

        /* Enhanced Button Styling */
        .btn-sm {
          font-size: 13px;
          padding: 6px 12px;
        }

        .btn-primary {
          background: linear-gradient(45deg, #0d6efd, #0b5ed7);
          border: none;
        }

        .btn-outline-secondary {
          border-color: #dee2e6;
          color: #6c757d;
        }

        .btn-outline-secondary:hover {
          background-color: #f8f9fa;
          border-color: #dee2e6;
          color: #495057;
        }


.upload-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.upload-modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.upload-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.upload-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.upload-modal-body {
  padding: 25px;
}

.file-drop-zone {
  border: 3px dashed #ddd;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  background: #fafafa;
  transition: all 0.3s ease;
}

.file-drop-zone:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.upload-icon {
  font-size: 48px;
  color: #007bff;
  margin-bottom: 10px;
}

.drop-zone-content h4 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.drop-zone-content p {
  margin: 0;
  color: #666;
}

.file-types {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
}

.file-types span {
  font-size: 12px;
  color: #999;
}

.file-preview-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.selected-file-info h4 {
  margin-bottom: 15px;
  color: #333;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
}

.file-icon {
  width: 50px;
  height: 50px;
  background: #007bff;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.file-info {
  flex: 1;
}

.file-name {
  margin: 0;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.file-size {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 12px;
}

.upload-preview {
  text-align: center;
}

.upload-preview h5 {
  margin-bottom: 15px;
  color: #333;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  border: 2px solid #eee;
}

.upload-progress-section {
  text-align: center;
}

.upload-progress-section h5 {
  margin-bottom: 15px;
  color: #333;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  transition: width 0.3s ease;
}

.upload-modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafafa;
  border-radius: 0 0 12px 12px;
}

@media (max-width: 768px) {
  .upload-modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .upload-modal-header {
    padding: 15px 20px;
  }
  
  .upload-modal-body {
    padding: 20px;
  }
  
  .file-drop-zone {
    padding: 30px 15px;
  }
}


        /* ========================================
           🎯 NEW: Responsive Design (ADD THESE STYLES)
           ======================================== */
        /* Responsive Design */
        @media(max-width:1920px) {
          .stickyBreakpoints {
            top: 20%
          }
        }

        @media(max-width:1400px) {
          .stickyBreakpoints {
            top: 17%
          }
        }

        @media(max-width: 768px) {
          .mbResponsive{        
            flex-direction:column;
            align-items:flex-start!important;
          }
          .milestoneResponsive{        
            right:-17px;
            top:0px !important;
            transform: translate(-45%, -100%)!important;
          }
          .nav-link.main-tab {
            font-size: 14px;
            padding: 12px 15px;
          }
          
          .tab-badge {
            font-size: 10px;
            padding: 1px 6px;
          }
          .content-body{
          margin-top: 30px!important;
          }
        }




        /* Document History Auto Height CSS - Add to your existing styles */

/* Document History Container */
.document-history {
  width: 100%;
  max-height: 1000px;
  height: auto !important;
  padding: 0;
}

/* History Item Styling */
.document-history .history-item {
  display: block !important;
  padding: 15px;
  margin-bottom: 15px;
  backgroundColor: #f8f9fa;
  borderRadius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  overflow: hidden;
}

.document-history .history-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
  border-color: #007bff;
}

/* History Preview Container */
.document-history .history-preview {
  margin-bottom: 15px;
  width: 100%;
  overflow: visible;
}

/* Auto Height for All Document Types */
.document-history .history-preview img {
  width: 100% !important;
  height: auto !important;
  max-width: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background-color: #fff;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.document-history .history-preview img:hover {
  transform: scale(1.02);
}

/* PDF Auto Height */
.document-history .history-preview iframe.pdf-thumbnail {
  width: 100% !important;
  height: fit-content !important;
  min-height: 750px;
  
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background-color: #fff;
  cursor: pointer;
}

/* Other Document Types Auto Height */




/* History Info Section */
.document-history .history-info {
  padding-top: 15px;
  border-top: 2px solid #e9ecef;
  margin-top: 10px;
}

.document-history .history-date {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.document-history .history-status {
  margin-bottom: 12px;
}

.document-history .history-status span {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* Action Buttons */
.document-history .history-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.document-history .history-actions .btn {
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.3s ease;
  white-space: nowrap;
  border: 1px solid transparent;
}

.document-history .history-actions .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.document-history .history-actions .btn-outline-primary {
  border-color: #007bff;
  color: #007bff;
}

.document-history .history-actions .btn-outline-primary:hover {
  background-color: #007bff;
  color: white;
}

.document-history .history-actions .btn-outline-secondary {
  border-color: #6c757d;
  color: #6c757d;
}

.document-history .history-actions .btn-outline-secondary:hover {
  background-color: #6c757d;
  color: white;
}

/* Rejection Reason Styling */
.document-history .rejection-reason {
  margin-top: 10px;
  padding: 8px 0;
}

.document-history .rejection-reason strong {
  color: #856404;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}

.document-history .rejection-reason p {
  margin: 0;
  padding: 8px 12px;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 4px;
  font-size: 13px;
  color: #856404;
  line-height: 1.4;
}

/* Loading Animation */
.document-history .history-preview iframe,
.document-history .history-preview img {
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
}

.document-history .history-preview iframe[src],
.document-history .history-preview img[src] {
  opacity: 1;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .document-history .history-preview iframe.pdf-thumbnail {
    height: auto !important;
    max-height: 600px;
  }
  
  .document-history .history-preview iframe:not(.pdf-thumbnail) {
    height: auto !important;
    max-height: 600px;
  }
}

@media (max-width: 768px) {
  .document-history .history-preview iframe.pdf-thumbnail {
    height: 50vh !important;
    min-height: 300px;
    max-height: 500px;
  }
  
  .document-history .history-preview iframe:not(.pdf-thumbnail) {
    height: 40vh !important;
    min-height: 200px;
    max-height: 400px;
  }
  
  .document-history .history-item {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  .document-history .history-actions {
    flex-direction: column;
  }
  
  .document-history .history-actions .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .document-history .history-preview iframe,
  .document-history .history-preview img {
    max-height: 300px;
    min-height: 150px;
  }
  
  .document-history .history-preview iframe.pdf-thumbnail {
    height: 40vh !important;
    min-height: 200px;
  }
}

/* Smooth Hover Effects */
.document-history .history-item {
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
}

.document-history .history-item:hover {
  background: linear-gradient(145deg, #e9ecef, #f8f9fa);
}
    .react-date-picker__calendar react-date-picker__calendar--open{
    inset: 0 !important;
    width: 300px !important;
    }
        `}
      </style>
      <style>
        {

          `
          
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
.firstDatepicker .react-calendar {
    width: 250px !important;
    height: min-content !important;
    transform: translateX(0px)!important;
}
.translateX .react-calendar {
  height: min-content !important;
    transform: translateX(-110px) !important;
    width: 250px !important;
}

.react-calendar{
    height: min-content !important;
    // transform: translateX(-110px) !important;
    width: 250px !important;

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
  .marginTopMobile {
    margin-top: 340px !important;
  }
   .nav-tabs-main{
                  white-space: nowrap;
                  flex-wrap: nowrap;
                  overflow: scroll;
                  scrollbar-width: none;
                  -ms-overflow-style: none;
                  &::-webkit-scrollbar {
                    display: none;
                  }
              }
              .nav-tabs-main > li > button{
              padding: 15px 9px;
              }
}

    
            `
        }

      </style>
      <style> {
        ` .bg-gradient-primary {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .transition-all {
              transition: all 0.3s ease;
          }

          .nav-pills-sm .nav-link {
              padding: 0.375rem 0.75rem;
              font-size: 0.875rem;
          }

          .sticky-top {
              position: sticky !important;
          }

          .btn-group .btn {
              border-radius: 0.375rem;
          }

          .btn-group .btn:not(:last-child) {
              margin-right: 0.25rem;
          }

          .card {
              transition: box-shadow 0.15s ease-in-out;
          }


          .text-truncate {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
          }

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
              stroke: #e6e6e6;
              stroke-width: 4;
          }

          .circle-progress {
              fill: none;
              stroke: #FC2B5A;
              stroke-width: 4;
              stroke-linecap: round;
              transition: stroke-dashoffset 0.5s ease;
          }

          .circular-progress-container .progress-text {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 10px;
              color: #333;
          }

          .contact-row {
              border: 1px solid #e0e0e0;
              border-radius: 2px;
              padding: 10px 15px;
              background-color: #fff;
          }

          .userCheckbox {
              display: flex;
              align-items: center;
              gap: 20px;
          }

          .contact-checkbox {
              display: flex;
              align-items: center;
          }

          .contact-name {
              font-weight: 500;
              margin-bottom: 0;
          }

          .contact-number {
              color: #888;
              font-size: 0.85rem;
          }

          .transition-col {
              transition: all 0.3s ease-in-out;
          }

          .leadsStatus {
              width: 100%;
              border-bottom: 1px solid #e0e0e0;
          }

          .leadsDetails {
              display: flex;
              list-style: none;
              margin: 0;
              padding: 0;
              overflow-x: auto;
              white-space: nowrap;
          }

          .leadsDetails .status {
              padding: 12px 16px;
              font-size: 14px;
              color: #555;
              cursor: pointer;
              position: relative;
              transition: all 0.2s ease;
          }

          .leadsDetails .status:hover {
              color: #000;
          }

          .leadsDetails .status.active {
              color: #333;
              font-weight: 500;
          }

          .leadsDetails .status.active::after {
              content: '';
              position: absolute;
              bottom: -1px;
              left: 0;
              width: 100%;
              height: 2px;
              background-color: #007bff;
          }

          .tab-pane {
              display: none;
          }

          .tab-pane.active {
              display: block;
          }

          .info-section {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
          }

          .section-title {
              color: #495057;
              font-weight: 600;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #dee2e6;
          }


          .tab-pane {
              padding: 0;
              position: relative;
          }

          .scrollable-container {
              display: none;
          }

          .desktop-view {
              display: block;
          }

          .scroll-arrow {
              display: none;
              position: absolute;
              top: 50%;
              transform: translateY(-50%);
              width: 30px;
              height: 30px;
              background: rgba(255, 255, 255, 0.9);
              border-radius: 50%;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              z-index: 9;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
              border: 1px solid #eaeaea;
          }

          .scroll-left {
              left: 5px;
          }

          .scroll-right {
              right: 5px;
          }

          .document-preview-icon {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
          }



          .whatsapp-chat {
              height: 100%;
              min-width: 300px;
              box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.12), 0px 1px 10px rgba(0, 0, 0, 0.12), 0px 2px 4px rgba(0, 0, 0, 0.2);
              display: flex;
              flex-direction: column;
          }

          .right-side-panel {
              background: #ffffff !important;
              box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.12), 0px 1px 10px rgba(0, 0, 0, 0.12), 0px 2px 4px rgba(0, 0, 0, 0.04);
              width: 100%;
              height: 73dvh;
          }

          .whatsapp-chat .topbar-container {
              background-color: #fff;
              padding: 8px 16px;
              display: flex;
              /* height: 8%; */
              min-height: 43px;
              align-items: center;
              position: relative;
              justify-content: space-between;
          }

          .whatsapp-chat .topbar-container .left-topbar {
              display: flex;
              align-items: center;
              justify-content: flex-start;
              cursor: pointer;
          }

          .whatsapp-chat .topbar-container .left-topbar .img-container {
              margin-right: 12px;
          }

          .whatsapp-chat .topbar-container .left-topbar .selected-number {
              font-size: 12px;
              color: #393939;
          }

          .small-avatar {
              background: #f17e33;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              text-transform: uppercase;
              font-size: 14px;
          }

          .whatsapp-chat .chat-view {
              background: #E6DDD4;
              flex: 1;
              position: relative;
          }

          .whatsapp-chat .chat-view .chat-container {
              list-style-type: none;
              padding: 18px 10px;
              position: absolute;
              bottom: 0;
              display: flex;
              flex-direction: column;
              padding-right: 15px;
              overflow-x: hidden;
              max-height: 100%;
              margin-bottom: 0px;
              padding-bottom: 12px;
              overflow-y: scroll;
              width: 100%;
          }

          .whatsapp-chat .chat-view .counselor-msg-container {
              display: flex;
              flex-direction: column;
              align-items: end;
          }

          .whatsapp-chat .chat-view .chat-container .chatgroupdate {
              width: 92px;
              height: 24px;
              background: #DCF3FB;
              border-radius: 4px;
              margin-top: 51px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-left: auto;
              margin-right: auto;
          }

          .whatsapp-chat .chat-view .chat-container .chatgroupdate span {
              font-size: 13px;
              color: #393939;
          }

          .whatsapp-chat .chat-view .counselor-msg {
              float: right;
              background: #D8FFC0;
              padding-right: 0;
          }

          .whatsapp-chat .chat-view .macro {
              margin-top: 12px;
              max-width: 92%;
              border-radius: 4px;
              padding: 8px;
              display: flex;
              padding-bottom: 2px;
              min-width: 22%;
              transform: scale(0);
              animation: message 0.15s ease-out 0s forwards;
          }

          @keyframes message {
              to {
                  transform: scale(1);
              }
          }

          .whatsapp-chat .chat-view .text-r {
              float: right;
          }

          .whatsapp-chat .chat-view .text {
              width: 100%;
              display: flex;
              flex-direction: column;
              color: #4A4A4A;
              font-size: 12px;
          }

          .whatsapp-chat .chat-view .student-messages {
              color: #F17E33;
          }

          .whatsapp-chat .chat-view .message-header-name {
              font-weight: 600;
              font-size: 12px;
              line-height: 18px;
              color: #F17E33;
              position: relative;
              bottom: 4px;
              opacity: 0.9;
          }

          .whatsapp-chat .chat-view .text-message {
              width: 100%;
              margin-top: 0;
              margin-bottom: 2px;
              line-height: 16px;
              font-size: 12px;
              word-break: break-word;
          }

          .whatsapp-chat .chat-view pre {
              white-space: pre-wrap;
              padding: unset !important;
              font-size: unset !important;
              line-height: normal !important;
              color: #4A4A4A !important;
              overflow: unset !important;
              background-color: transparent !important;
              border: none !important;
              border-radius: unset !important;
              font-family: unset !important;
          }

          .whatsapp-chat .footer-container {
              background-color: #F5F6F6;
              box-shadow: 0px -2px 4px rgba(0, 0, 0, 0.09);
              padding: 0;
              height: auto;
              align-items: center;
              border: none !important;
          }

          .whatsapp-chat .footer-container .footer-box {
              padding: 16px;
              background: #F5F6F6;
              border-radius: 6px;
          }

          .whatsapp-chat .footer-container .footer-box .message-container {
              color: black;
              position: relative;
              height: 40px;
          }

          .whatsapp-chat .footer-container .footer-box .message-container .message-input {
              background: #FFFFFF;
              border-radius: 6px 6px 0 0 !important;
              width: 100%;
              min-height: 36px;
              padding: 0px 12px;
              font-size: 12px;
              resize: none;
              position: absolute;
              bottom: 0px;
              line-height: 20px;
              padding-top: 8px;
              border: #fff;
          }

          .whatsapp-chat .footer-container .footer-box .divider {
              border: 1px solid #D8D8D8;
              margin-bottom: 0.8px !important;
              margin-top: -0.8px !important;
          }

          .whatsapp-chat .footer-container .footer-box .message-container-input {
              display: flex;
              background: #FFFFFF;
              height: 32px;
              border-radius: 0 0 6px 6px !important;
              justify-content: space-between;
          }

          .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer {
              display: flex;
              justify-content: flex-start;
              align-items: center;
          }

          .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer .margin-bottom-5 {
              margin-bottom: 5px;
              margin-right: 15px;
              margin-left: 10px;
          }

          .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer .margin-right-10 {
              margin-right: 10px;
          }

          .input-template {
              margin-bottom: 5px;
              margin-left: 15px;
          }

          .whatsapp-chat .footer-container .footer-box .message-container-input .right-footer .send-button {
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              color: #666;
          }

          .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer .fileUploadIcon {
              cursor: pointer;
              color: #666;
              transform: translateY(15px);
          }

          .sessionExpiredMsg {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 4px;
              padding: 8px 12px;
              margin: 10px 0;
              font-size: 12px;
              color: #856404;
              text-align: center;
          }

          .followUp {
              font-size: 13px;
              font-weight: 500;
              padding-left: 10px;
          }

          .section-card {
              padding: 5px;
              border-radius: 8px;
          }

          .section-title {
              color: #333;
              font-weight: 600;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #f0f0f0;
          }

          .nav-pills .nav-link.active {
              background: #fd2b5a;
          }

          .resume-document {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
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
          }

          .resume-skill-bar {
              height: 100%;
              background: #007bff;
              border-radius: 4px;
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

          .highlight-text {
              color: #007bff;
              font-weight: bold;
          }



          /* WhatsApp Panel Mobile Styles */
          .whatsapp-chat {
              height: 100%;
              display: flex;
              flex-direction: column;
          }

          .topbar-container {
              flex-shrink: 0;
              padding: 1rem;
              border-bottom: 1px solid #e0e0e0;
              background-color: #f8f9fa;
          }

          .left-topbar {
              display: flex;
              align-items: center;
              gap: 1rem;
          }

          .small-avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background-color: #007bff;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
          }

          .lead-name {
              font-weight: 600;
              font-size: 1rem;
          }

          .selected-number {
              color: #666;
              font-size: 0.9rem;
          }

          .right-topbar {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              margin-top: 0.5rem;
          }

          .chat-view {
              flex: 1;
              overflow-y: auto;
              padding: 1rem;
              background-color: #f0f0f0;
          }

          .chat-container {
              list-style: none;
              padding: 0;
              margin: 0;
          }

          .counselor-msg-container {
              margin-bottom: 1.5rem;
          }

          .chatgroupdate {
              text-align: center;
              margin-bottom: 1rem;
          }

          .chatgroupdate span {
              background-color: #e3f2fd;
              padding: 0.25rem 0.75rem;
              border-radius: 1rem;
              font-size: 0.8rem;
              color: #666;
          }

          .counselor-msg {
              background-color: #dcf8c6;
              padding: 0.75rem;
              border-radius: 0.5rem;
              margin-bottom: 0.5rem;
              max-width: 80%;
              margin-left: auto;
          }

          .text-message {
              white-space: pre-wrap;
              margin: 0;
              font-family: inherit;
          }

          .message-header-name {
              font-weight: 600;
              color: #1976d2;
          }

          .student-messages {
              color: #2e7d32;
          }

          .messageTime {
              font-size: 0.75rem;
              color: #666;
              display: block;
              text-align: right;
          }

          .sessionExpiredMsg {
              text-align: center;
              padding: 1rem;
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 0.5rem;
              margin-top: 1rem;
              color: #856404;
          }

          .footer-container {
              flex-shrink: 0;
              border-top: 1px solid #e0e0e0;
              background-color: white;
          }

          .footer-box {
              padding: 1rem;
          }

          .message-container {
              margin-bottom: 0.5rem;
          }

          .message-input {
              width: 100%;
              border: 1px solid #ddd;
              border-radius: 0.5rem;
              padding: 0.5rem;
              resize: none;
              background-color: #f8f9fa;
          }

          .disabled-style {
              opacity: 0.6;
          }

          .divider {
              margin: 0.5rem 0;
              border-color: #e0e0e0;
          }

          .message-container-input {
              display: flex;
              justify-content: space-between;
              align-items: center;
          }

          .bgcolor {
              background-color: #f1f2f6 !important;
          }

          .left-footer {
              display: flex;
              align-items: center;
              gap: 0.5rem;
          }

          .margin-right-10 {
              margin-right: 10px;
          }

          .margin-bottom-5 {
              margin-bottom: 5px;
          }

          .margin-horizontal-4 {
              margin: 0 4px;
          }

          .margin-horizontal-5 {
              margin: 0 5px;
          }

          .fileUploadIcon {
              width: 20px;
              height: 20px;
              opacity: 0;
              position: absolute;
              cursor: pointer;
          }

          .input-template {
              cursor: pointer;
          }

          .send-button {
              text-decoration: none;
          }

          .send-img {
              width: 20px;
              height: 20px;
          }

          #whatsappPanel {
              height: 73dvh;
          }

          .info-group {
              padding: 8px;
          }

          /* Responsive adjustments */


          /* Add this to your existing style tag or CSS file */
          .react-date-picker__wrapper {
              border: 1px solid #ced4da !important;
              border-radius: 0.375rem !important;
          }

          .react-date-picker__inputGroup input {
              border: none !important;
              outline: none !important;
          }

          .react-date-picker__clear-button {
              display: none !important;
          }

          .react-date-picker__calendar-button {
              padding: 4px !important;
          }

          /* Additional styling for better appearance */
          .react-date-picker__inputGroup {
              width: 100%;
              white-space: nowrap;
              background: transparent;
              border: none;
          }

          .react-date-picker__wrapper {
              background: white !important;
          }


          .no-scroll {
              overflow: hidden;
          }


          .doc-iframe {
              transform-origin: top left;
              transition: transform 0.3s ease;
              width: 100%;
              height: 100%;
              overflow: hidden;
          }

          .admin-document-panel {
              margin: 20px;
              background-color: white;
              border-radius: 8px;
              box-shadow: var(--shadow);
              overflow: hidden;
          }

          .panel-header {
              padding: 20px;
              border-bottom: 1px solid var(--border-color);
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
              align-items: center;
              gap: 15px;
              background-color: #4a6fdc;
              color: white;
          }

          .panel-header h2 {
              color: white;
              font-size: 1.5rem;
              margin: 0;
          }

          .user-selector {
              padding: 8px 12px;
              border: 1px solid var(--border-color);
              border-radius: 4px;
              font-size: 14px;
              min-width: 200px;
          }

          .candidate-info {
              background-color: #e9f0fd;
              padding: 20px;
              border-radius: 6px;
              margin: 20px;
              display: flex;
              align-items: center;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
          }

          .candidate-avatar {
              width: 70px;
              height: 70px;
              border-radius: 50%;
              background-color: #4a6fdc;
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              font-weight: bold;
              font-size: 24px;
              margin-right: 20px;
          }

          .candidate-details {
              flex-grow: 1;
          }

          .candidate-details h3 {
              margin: 0 0 5px 0;
              font-size: 22px;
              color: #333;
          }

          .candidate-details p {
              margin: 0 0 5px 0;
              color: #555;
          }

          .candidate-stats {
              display: flex;
              margin-top: 15px;
              flex-wrap: wrap;
              gap: 15px;
          }

          .stat-box {
              background: white;
              border-radius: 4px;
              padding: 10px 15px;
              min-width: 120px;
              text-align: center;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }

          .stat-box h4 {
              margin: 0 0 5px 0;
              font-size: 14px;
              color: #666;
          }

          .stat-box p {
              margin: 0;
              font-size: 20px;
              font-weight: bold;
          }

          .document-list {
              overflow-x: auto;
              margin: 0 20px 20px 20px;
          }

          .document-table {
              width: 100%;
              border-collapse: collapse;
          }

          .document-table th {
              background-color: var(--gray-light);
              padding: 12px 15px;
              text-align: left;
              font-weight: 600;
              color: #444;
              border-bottom: 2px solid var(--border-color);
              white-space: nowrap;
          }



          .document-table tbody tr:hover {
              background-color: #f8f9fa;
          }

          .document-table td {
              padding: 12px 15px;
              vertical-align: middle;
          }

          .status-badges {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
          }

          .status-pending {
              background-color: #fff3cd;
              color: #856404;
          }

          .status-approved {
              background-color: #d4edda;
              color: #155724;
          }

          .status-rejected {
              background-color: #f8d7da;
              color: #721c24;
          }

          .action-btn {
              background: none;
              border: none;
              cursor: pointer;
              padding: 5px 8px;
              border-radius: 4px;
              transition: background-color 0.2s;
          }

          .view-btn {
              color: var(--primary-color);
          }

          .view-btn:hover {
              background-color: rgba(74, 111, 220, 0.1);
          }

          .approve-btn {
              color: var(--success-color);
              background-color: #d4edda;
              border: none;
              border-radius: 4px;
              padding: 8px 12px;
              cursor: pointer;
              font-weight: 600;
              transition: all 0.2s;
          }

          .approve-btn:hover {
              background-color: #c3e6cb;
          }

          .reject-btn {
              color: var(--danger-color);
              background-color: #f8d7da;
              border: none;
              border-radius: 4px;
              padding: 8px 12px;
              cursor: pointer;
              font-weight: 600;
              transition: all 0.2s;
          }

          .reject-btn:hover {
              background-color: #f5c6cb;
          }

          .document-modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              background-color: rgba(0, 0, 0, 0.7);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 9999;
              backdrop-filter: blur(5px);
          }

          .document-modal-content {
              background: white;
              border-radius: 12px;
              width: 70%;
              max-height: 90vh;
              overflow: hidden;
              box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
              display: flex;
              flex-direction: column;
              animation: modalSlideIn 0.3s ease-out;
          }

          @keyframes modalSlideIn {
              from {
                  opacity: 0;
                  transform: scale(0.9) translateY(-20px);
              }

              to {
                  opacity: 1;
                  transform: scale(1) translateY(0);
              }
          }

          .document-modal-content .modal-header {
              padding: 1.5rem 2rem;
              border-bottom: 1px solid #e9ecef;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              display: flex;
              justify-content: space-between;
              align-items: center;
          }

          .document-modal-content .modal-header h3 {
              margin: 0;
              font-size: 1.25rem;
              font-weight: 600;
              color: white;
          }

          .document-modal-content .close-btn {
              background: none;
              border: none;
              color: white;
              font-size: 1.5rem;
              cursor: pointer;
              padding: 0;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              transition: background-color 0.2s;
          }

          .document-modal-content .close-btn:hover {
              background-color: rgba(255, 255, 255, 0.2);
          }

          .document-modal-content .modal-body {
              padding: 2rem;
              display: flex;
              gap: 2rem;
              overflow-y: auto;
          }

          .document-preview-section {
              flex: 2;
              min-width: 400px;
          }

          .document-preview-container {
              background: #f8f9fa;
              border-radius: 8px;
              height: 500px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              position: relative;
              border: 2px dashed #dee2e6;
          }

          .document-preview-container img {
              max-width: 100%;
              max-height: 90%;
              object-fit: contain;
              border-radius: 4px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .preview-controls {
              position: absolute;
              bottom: 0px;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              gap: 10px;
              background: rgba(255, 255, 255, 0.9);
              padding: 10px 15px;
              border-radius: 25px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .control-btn {
              background: #007bff;
              color: white;
              border: none;
              padding: 8px 12px;
              border-radius: 20px;
              cursor: pointer;
              font-size: 0.85rem;
              display: flex;
              align-items: center;
              gap: 5px;
              transition: all 0.2s;
          }

          .control-btn:hover {
              background: #0056b3;
              transform: translateY(-1px);
          }

          .no-document {
              text-align: center;
              color: #6c757d;
          }

          .document-info-section {
              flex: 1;
              /* min-width: 300px; */
          }

          .info-card {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 1.5rem;
              margin-bottom: 1.5rem;
              border: 1px solid #e9ecef;
          }

          .info-card h4 {
              margin: 0 0 1rem 0;
              color: #495057;
              font-size: 1.1rem;
              font-weight: 600;
              border-bottom: 2px solid #007bff;
              padding-bottom: 0.5rem;
          }

          .info-row {
              margin-bottom: 0.75rem;
              display: flex;
              align-items: center;
              gap: 0.5rem;
          }

          .info-row strong {
              color: #495057;
              min-width: 120px;
          }

          .verification-section {
              margin-top: 1.5rem;
          }

          .verification-steps {
              margin: 0;
              padding-left: 1.5rem;
          }

          .verification-steps li {
              margin-bottom: 0.5rem;
              color: #6c757d;
              line-height: 1.5;
          }

          .action-buttons {
              margin-top: 1.5rem;
              display: flex;
              gap: 10px;
          }

          .action-buttons .btn {
              padding: 10px 20px;
              border-radius: 6px;
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s;
          }

          .rejection-form {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 8px;
              padding: 1.5rem;
              margin-top: 1.5rem;
          }

          .rejection-form h4 {
              color: #856404;
              margin: 0 0 1rem 0;
          }

          .rejection-form textarea {
              width: 100%;
              min-height: 100px !important;
              padding: 10px;
              border: 1px solid #ffeaa7;
              border-radius: 4px;
              resize: vertical;
          }

          /* .document-history {
    overflow-y: auto;
} */

          .history-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0.75rem 0;
              border-bottom: 1px solid #e9ecef;
          }

          .history-item:last-child {
              border-bottom: none;
          }

          .history-date {
              font-size: 0.9rem;
              color: #6c757d;
              position: absolute;
              top: 20px;
              right: 20px;
          }

          .history-status {
              font-size: 0.85rem;
              font-weight: 500;
              position: absolute;
              top: 10px
          }




          .m-c {
              background-color: white;
              border-radius: 8px;
              width: 90%;
              max-width: 1000px;
              max-height: 90vh;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          }

          .m-h {
              padding: 15px 20px;
              border-bottom: 1px solid var(--border-color);
              display: flex;
              justify-content: space-between;
              align-items: center;
              background-color: #f8f9fa;
          }

          .close-btn {
              background: none;
              border: none;
              font-size: 1.5rem;
              cursor: pointer;
              color: #777;
          }

          .m-b {
              padding: 20px;
              display: flex;
              gap: 20px;
              flex-wrap: wrap;
              overflow-y: auto;
          }

          .document-preview {
              flex: 2;
              min-width: 400px;
              background-color: var(--gray-light);
              border-radius: 4px;
              height: 500px;
              display: flex;
              justify-content: center;
              align-items: center;
              position: relative;
              flex-direction: column;

          }

          .document-preview img {
              width: 100%;
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
          }

          .preview-controls {
              text-align: center;
              background-color: rgba(255, 255, 255, 0.8);
              padding: 8px;
              border-radius: 4px;
          }

          .preview-controls button {
              background-color: #4a6fdc;
              color: white;
              border: none;
              padding: 5px 10px;
              border-radius: 4px;
              margin: 0 5px;
              cursor: pointer;
          }

          .document-info {
              flex: 1;
              min-width: 300px;
          }

          .info-section {
              background-color: #f8f9fa;
              border-radius: 6px;
              padding: 15px;
              margin-bottom: 20px;
          }

          .info-section h4 {
              margin-top: 0;
              margin-bottom: 10px;
              color: #4a6fdc;
              border-bottom: 1px solid #e0e0e0;
              padding-bottom: 8px;
          }

          .document-info p {
              margin-bottom: 10px;
          }

          .document-history {
              margin-top: 20px;
          }

          .history-item {
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px dashed #e0e0e0;
          }

          .history-item:last-child {
              border-bottom: none;
          }

          .history-item .date {
              font-size: 12px;
              color: #777;
          }

          .modal-actions {
              margin-top: 30px;
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
          }

          .rejection-form {
              margin-top: 20px;
              display: none;
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              border-left: 4px solid #dc3545;
          }

          .rejection-form h4 {
              margin-top: 0;
              color: #721c24;
          }

          .rejection-form textarea {
              width: 100%;
              padding: 10px;
              border: 1px solid var(--border-color);
              border-radius: 4px;
              margin-bottom: 10px;
              min-height: 100px;
              resize: vertical;
          }

          .rejection-form button {
              margin-right: 10px;
          }

          .filter-bar {
              margin: 0 20px 20px 20px;
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 6px;
              align-items: center;
          }

          .filter-label {
              font-weight: 600;
              color: #555;
          }

          .filter-select {
              padding: 8px 12px;
              border: 1px solid var(--border-color);
              border-radius: 4px;
              min-width: 150px;
          }


          .page-btn {
              background-color: white;
              border: 1px solid var(--border-color);
              border-radius: 4px;
              padding: 5px 10px;
              cursor: pointer;
              transition: all 0.2s;
          }

          .page-btn:hover,
          .page-btn.active {
              background-color: #4a6fdc;
              color: white;
          }

          /* Document History Container */
          .document-history {
              width: 100%;
              max-height: 1000px;
              height: auto !important;
              padding: 0;
              position: relative;
          }

          /* History Item Styling */
          .document-history .history-item {
              display: block !important;
              padding: 15px;
              margin-bottom: 15px;
              background-color: #f8f9fa;
              border-radius: 12px;
              border: 1px solid #e9ecef;
              transition: all 0.3s ease;
              overflow: hidden;
          }

          .document-history .history-item:hover {
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              transform: translateY(-2px);
              border-color: #007bff;
          }

          /* History Preview Container */
          .document-history .history-preview {
              margin-bottom: 15px;
              width: 100%;
              overflow: visible;
          }

          /* Auto Height for All Document Types */
          .document-history .history-preview img {
              width: 100% !important;
              height: auto !important;
              max-width: 100%;
              object-fit: contain;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              background-color: #fff;
              cursor: pointer;
              transition: transform 0.3s ease;
          }

          .document-history .history-preview img:hover {
              transform: scale(1.02);
          }

          /* PDF Auto Height */
          .document-history .history-preview iframe.pdf-thumbnail {
              width: 100% !important;
              height: fit-content !important;
              min-height: 750px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              background-color: #fff;
              cursor: pointer;
          }

          /* History Info Section */
          .document-history .history-info {
              padding-top: 15px;
              border-top: 2px solid #e9ecef;
              margin-top: 10px;
          }


          .enhanced-documents-panel {
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              min-height: 100vh;
              padding: 1.5rem;
              border-radius: 15px;
          }

          .candidate-header-section {
              margin-bottom: 2rem;
          }

          .candidate-info-card {
              background: white;
              border-radius: 20px;
              padding: 2rem;
              box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
              display: flex;
              align-items: center;
              gap: 2rem;
              position: relative;
              overflow: hidden;
          }

          .candidate-info-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
          }

          .candidate-avatar-large {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 2rem;
              font-weight: bold;
              box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          }

          .candidate-details h3 {
              margin: 0 0 0.5rem 0;
              color: #333;
              font-size: 1.5rem;
              font-weight: 700;
          }

          .contact-details {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
          }

          .contact-details span {
              color: #666;
              font-size: 0.9rem;
              display: flex;
              align-items: center;
              gap: 0.5rem;
          }

          .completion-ring {
              margin-left: auto;
              position: relative;
          }

          .circular-progress {
              position: relative;
          }

          .percentage-text {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              text-align: center;
          }

          .percentage {
              display: block;
              font-size: 1.2rem;
              font-weight: bold;
              color: #4facfe;
          }

          .label {
              font-size: 0.7rem;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
          }

          .progress-bar {
              transition: stroke-dasharray 1s ease-in-out;
          }

          .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 1.5rem;
              margin-bottom: 2rem;
          }

          .stat-card {
              background: white;
              border-radius: 15px;
              padding: 1.5rem;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
              display: flex;
              align-items: center;
              gap: 1rem;
              transition: all 0.3s ease;
              position: relative;
              overflow: hidden;
          }

          .stat-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              transition: all 0.3s ease;
          }

          .stat-card.total-docs::before {
              background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          }

          .stat-card.uploaded-docs::before {
              background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
          }

          .stat-card.pending-docs::before {
              background: linear-gradient(90deg, #fa709a 0%, #fee140 100%);
          }

          .stat-card.verified-docs::before {
              background: linear-gradient(90deg, #a8edea 0%, #fed6e3 100%);
          }

          .stat-card.rejected-docs::before {
              background: linear-gradient(90deg, #ff9a9e 0%, #fecfef 100%);
          }

          .stat-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          }

          .stat-icon {
              width: 50px;
              height: 50px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.5rem;
              color: white;
          }

          .total-docs .stat-icon {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .uploaded-docs .stat-icon {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          .pending-docs .stat-icon {
              background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          }

          .verified-docs .stat-icon {
              background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          }

          .rejected-docs .stat-icon {
              background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
          }

          .stat-info h4 {
              margin: 0;
              font-size: 1.8rem;
              font-weight: bold;
              color: #333;
          }

          .stat-info p {
              margin: 0;
              color: #666;
              font-size: 0.9rem;
          }

          .stat-trend {
              margin-left: auto;
              font-size: 1.2rem;
              color: #4facfe;
          }

          .filter-section-enhanced {
              background: white;
              border-radius: 15px;
              padding: 1.5rem;
              margin-bottom: 2rem;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          }

          .filter-title {
              margin: 0 0 1rem 0;
              color: #333;
              font-weight: 600;
          }

          .filter-tabs {
              display: flex;
              gap: 1rem;
              flex-wrap: wrap;
          }

          .filter-btn {
              background: #f8f9fa;
              border: 2px solid transparent;
              border-radius: 25px;
              padding: 0.75rem 1.5rem;
              color: #666;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              position: relative;
          }

          .filter-btn .badges {
              background: #dee2e6;
              color: #495057;
              border-radius: 10px;
              padding: 0.25rem 0.5rem;
              font-size: 0.75rem;
              margin-left: 0.5rem;
          }

          .filter-btn:hover {
              background: #e9ecef;
              transform: translateY(-2px);
          }

          .filter-btn.active {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
              color: white;
              border-color: #4facfe;
              box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
          }

          .filter-btn.active .badges {
              background: rgba(255, 255, 255, 0.2);
              color: #fc2b5a;
          }

          .filter-btn.pending.active {
              background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
              box-shadow: 0 5px 15px rgba(250, 112, 154, 0.4);
          }

          .filter-btn.verified.active {
              background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
              color: #2d7d32;
              box-shadow: 0 5px 15px rgba(168, 237, 234, 0.4);
          }

          .filter-btn.rejected.active {
              background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
              color: #c62828;
              box-shadow: 0 5px 15px rgba(255, 154, 158, 0.4);
          }

          .documents-grid-enhanced {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
              gap: 2rem;
          }

          .document-card-enhanced {
              background: white;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
              transition: all 0.3s ease;
              position: relative;
          }

          .document-card-enhanced:hover {
              transform: translateY(-10px);
              box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          }

          .document-image-container {
              position: relative;
              height: 200px;
              overflow: hidden;
              background: #f8f9fa;
          }

          .document-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.3s ease;
          }

          .document-card-enhanced:hover .document-image {
              transform: scale(1.05);
          }

          .image-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0;
              transition: opacity 0.3s ease;
          }

          .document-card-enhanced:hover .image-overlay {
              opacity: 1;
          }

          .preview-btn {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
              border: none;
              border-radius: 25px;
              padding: 0.75rem 1.5rem;
              color: white;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              transition: all 0.3s ease;
              box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
          }

          .preview-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 25px rgba(79, 172, 254, 0.6);
          }

          .no-document-placeholder {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              color: #ccc;
              font-size: 3rem;
          }

          .no-document-placeholder p {
              margin-top: 1rem;
              font-size: 1rem;
              color: #999;
          }

          .status-badges-overlay {
              position: absolute;
              top: 15px;
              right: 15px;
          }

          .status-badges-new {
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.5rem 1rem;
              border-radius: 20px;
              font-size: 0.8rem;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          }

          .status-badges-new.pending {
              background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
              color: white;
          }

          .status-badges-new.verified {
              background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
              color: #2d7d32;
          }

          .status-badges-new.rejected {
              background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
              color: #c62828;
          }

          .status-badges-new.not-uploaded {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
          }

          .document-info-section {
              padding: 1.5rem;
          }

          .document-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 1rem;
          }

          .document-title {
              margin: 0;
              color: #333;
              font-size: 0.9rem;
              font-weight: 700;
              flex: 1;
          }

          .document-actions {
              margin-left: 1rem;
          }

          .action-btn {
              border: none;
              border-radius: 20px;
              padding: 0.5rem 1rem;
              font-size: 0.8rem;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              transition: all 0.3s ease;
              text-transform: uppercase;
              letter-spacing: 0.5px;
          }

          .upload-btn {
              background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
              color: white;
              box-shadow: 0 3px 10px rgba(250, 112, 154, 0.4);
          }

          .verify-btn {
              background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
              color: #c62828;
              box-shadow: 0 3px 10px rgba(255, 154, 158, 0.4);
          }

          .view-btn {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
              color: white;
              box-shadow: 0 3px 10px rgba(79, 172, 254, 0.4);
          }

          .action-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          }

          .document-meta {
              display: flex;
              gap: 1rem;
              flex-wrap: wrap;
          }

          .meta-item {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              color: #666;
              font-size: 0.9rem;
          }

          .meta-text {
              color: #333;
          }

          /* Responsive Design */

          .react-date-picker__calendar.react-date-picker__calendar--open {
              inset: 0 !important;
              width: 300px !important;
          }

          
          .site-header--sticky--register:not(.mobile-sticky-enable) {
    /* position: absolute !important; */
    top: 97px;
    z-index: 10;
}
    .breadcrumb-item a, .card-body a {
    color: #fc2b5a;
}

          @media (max-width: 1200px) {
              .document-history .history-preview iframe.pdf-thumbnail {
                  height: auto !important;
                  max-height: 600px;
              }
          }
@media (min-width: 992px) {
    .site-header--sticky--register:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        background: white;
    }
}
          @media (max-width: 768px) {

              .enhanced-documents-panel {
                  padding: 1rem;
              }

              .candidate-info-card {
                  flex-direction: column;
                  text-align: center;
                  gap: 1rem;
              }

              .completion-ring {
                  margin-left: 0;
              }

              .stats-grid {
                  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              }

              .documents-grid-enhanced {
                  grid-template-columns: 1fr;
              }

              .filter-tabs {
                  justify-content: center;
              }

              .document-header {
                  flex-direction: column;
                  gap: 1rem;
              }

              .document-actions {
                  margin-left: 0;
                  align-self: stretch;
              }

              .action-btn {
                  width: 100%;
                  justify-content: center;
              }

              .document-history .history-preview iframe.pdf-thumbnail {
                  height: 50vh !important;
                  min-height: 300px;
                  max-height: 500px;
              }

              .document-history .history-item {
                  padding: 12px;
                  margin-bottom: 12px;
              }

              .scrollable-container {
                  display: block;
                  width: 100%;
                  overflow: hidden;
                  padding: 10px 0;
              }

              .desktop-view {
                  display: none;
              }

              .scrollable-content {
                  display: flex;
                  overflow-x: auto;
                  scroll-snap-type: x mandatory;
                  -webkit-overflow-scrolling: touch;
                  scrollbar-width: thin;
                  scroll-behavior: smooth;
                  padding: 10px 0;
              }

              .info-card {
                  flex: 0 0 auto;
                  scroll-snap-align: start;
                  margin-right: 15px;
                  padding: 15px;
                  border-radius: 8px;
                  border: 1px solid #eaeaea;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                  background: #fff;
              }

              .scroll-arrow {
                  display: flex;
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

              .btn-group {
                  flex-wrap: wrap;
              }

              .btn-group .btn {
                  margin-bottom: 0.25rem;
              }

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

              .info-group {
                  border: none;
              }

              .info-card {

                  flex: 0 0 auto;
                  scroll-snap-align: start;
                  margin-right: 15px;
                  padding: 15px;
                  border-radius: 8px;
                  border: 1px solid #eaeaea;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                  background: #fff;
              }

              .input-height {
                  height: 40px;
              }

              .whatsapp-chat {
                  height: 90vh;
              }


              .nav-pills {
                  flex-wrap: wrap;
              }

              .nav-pills .nav-link {
                  font-size: 0.9rem;
                  padding: 0.5rem 0.75rem;
              }

              .document-modal-content {
                  width: 98%;
                  margin: 1rem;
                  max-height: 95vh;
              }

              .document-modal-content .modal-body {
                  flex-direction: column;
                  padding: 1rem;
                  gap: 1rem;
              }

              .document-preview-section {
                  min-width: auto;
                  overflow-y: auto;
              }

              .document-preview-container {
                  height: 300px;
              }

              .document-info-section {
                  min-width: auto;
              }
              .admissionMobileResponsive{
              padding: 0;
              }
              .mobileResponsive{
              padding: 0;
              }
              .content-body{
               margin-top: 30px!important;
              }
              .nav-tabs-main{
                  white-space: nowrap;
                  flex-wrap: nowrap;
                  overflow: scroll;
                  scrollbar-width: none;
                  -ms-overflow-style: none;
                  &::-webkit-scrollbar {
                    display: none;
                  }
              }
              .nav-tabs-main > li > button{
              padding: 15px 9px;
              }
          }

          @media (max-width: 576px) {


              .btn-group {
                  flex-wrap: wrap;
              }

              .input-group {
                  max-width: 100% !important;
                  margin-bottom: 0.5rem;
              }
          }


          @media (max-width: 480px) {

              .document-history .history-preview iframe,
              .document-history .history-preview img {
                  max-height: 300px;
                  min-height: 150px;
              }

              .document-history .history-preview iframe.pdf-thumbnail {
                  height: 40vh !important;
                  min-height: 200px;
              }
          }

          `
      }

      </style>

      <style>
        {
          `
          input[type="text"], 
input[type="email"], 
input[type="number"],
input[type="tel"],
input[type="date"],
select {
  background-color: transparent !important;
  border: var(--bs-border-width) solid var(--bs-border-color);
}
.card {
    margin-bottom: 2.2rem;
    border: none;
    border-radius: 0.5rem;
    box-shadow: 0px 4px 25px 0px rgba(0, 0, 0, 0.1);
    transition: all .3sease-in-out;
}
.card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #fff;
    background-clip: border-box;
    border: 1px solid rgba(34, 41, 47, 0.125);
    border-radius: 0.5rem;
}
.bg-intext {
    background-color: #FC2B5A;
}
.new-bg-text {
    background-color: #FC2B5A !important;
    border-top-right-radius: 0px !important;
    border-bottom-right-radius: 0px !important;
}
.float-left {
    float: left !important;
}
/* .breadcrumb .breadcrumb-item+.breadcrumb-item:before {
    content: "\e847";
    font-family: 'feather';
    color: #626262;
} */
.breadcrumb .breadcrumb-item+.breadcrumb-item:before {
    content: "\f105"; /* Arrow Right */
  font-family: "Font Awesome 6 Free";
  font-weight: 900; /* Solid icons = 900, Regular = 400 */
  color: #626262;
}
.breadcrumb-item+.breadcrumb-item::before {
    display: inline-block;
    padding-right: 0.5rem;
    color: #b8c2cc;
    content: "/";
}
.breadcrumb .breadcrumb-item+.breadcrumb-item {
    padding-left: 0;
}
.breadcrumb {
    font-size: 1rem;
    font-family: "Montserrat", Helvetica, Arial, serif;
    background-color: transparent;
    padding: 0.5rem 0 0.5rem 1rem !important;
    border-left: 1px solid #d6dce1;
    border-radius: 0;
}
.breadcrumbs-top .breadcrumb {
    margin: 0;
    padding: 0;
}

.breadcrumb>li+li::before {
    padding-right: .6rem;
    padding-left: .6rem;
}
a {
    color: #FC2B5A;
    text-decoration: none;
    background-color: transparent;
}
.mandatory {
    color: red;
}
label {
    font-size: 0.80rem !important;
}
.input-group {
    position: relative;
    display: flex
;
    flex-wrap: wrap;
    align-items: stretch;
    width: 100%;
}
#siteforcomp {
    height: 29px;

}

/* Floating Audio Button */
.floating-audio-btn {
position: absolute;
bottom: 0px;
right: 20px;
background-color: #fc2b5a;
color: white;
width: 130px;
height: 45px;
border-radius: 40px;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
cursor: pointer;
box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
z-index: 100;
transition: all 0.2s;
}

.floating-audio-btn:hover {
transform: translateY(-3px);
box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}

.floating-audio-btn i {
font-size: 18px;
}

/* Recording Modal Styles */
.recording-modal-overlay {
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background-color: rgba(0, 0, 0, 0.5);
display: flex;
align-items: center;
justify-content: center;
z-index: 1000;
}

.recording-modal {
background-color: white;
border-radius: 10px;
width: 90%;
max-width: 600px;
max-height: 90vh;
overflow: hidden;
display: flex;
flex-direction: column;
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.recording-modal .modal-header {
display: flex;
justify-content: space-between;
align-items: center;
padding: 15px 20px;
border-bottom: 1px solid #eee;
}

.recording-modal .modal-header h5 {
font-size: 18px;
margin: 0;
font-weight: 600;
}

.recording-modal .close-modal {
background: none;
border: none;
color: #555;
cursor: pointer;
font-size: 18px;
}

.recording-modal .modal-body {
padding: 20px;
flex: 1;
overflow-y: auto;
}

.recording-modal .modal-footer {
padding: 15px 20px;
border-top: 1px solid #eee;
text-align: right;
}

.btn-done {
background-color: #fc2b5a;
color: white;
border: none;
padding: 8px 20px;
border-radius: 4px;
cursor: pointer;
}

.btn-done:hover {
background-color: #e6255c;
}

/* The remaining recording controls and recording items
can use the same CSS you already have */

  /* Resume Builder Container */
.resume-builder-container {
max-width: 1200px;
margin: 0 auto;
padding: 30px;
background-color: #f9f9f9;
border-radius: 10px;
box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

/* Header */
.resume-builder-header {
text-align: center;
padding-bottom: 20px;
border-bottom: 1px solid #eee;
}

.resume-builder-title {
font-size: 28px;
font-weight: 700;
color: #333;
margin-bottom: 15px;
}

/* Profile Strength Meter */
.profile-strength-meter {
max-width: 600px;
margin: 20px auto;
padding: 15px;
background-color: #fff;
border-radius: 8px;
box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.strength-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 10px;
}

.strength-label {
font-size: 16px;
font-weight: 500;
color: #333;
}

.strength-badge {
font-size: 18px;
font-weight: 700;
color: #fc2b5a;
}

.strength-level {
font-size: 14px;
color: #666;
}

.progress {
height: 10px;
background-color: #e9ecef;
border-radius: 5px;
overflow: hidden;
}

.progress-bar {
height: 100%;
border-radius: 5px;
transition: width 0.3s ease;
}

/* Navigation Tabs */
.resume-tabs {
margin-bottom: 25px;
}

.nav-tabs {
border-bottom: 1px solid #ddd;
}

.nav-tabs .nav-link {
border: none;
border-bottom: 3px solid transparent;
border-radius: 0;
color: #555;
font-weight: 500;
padding: 12px 20px;
transition: all 0.2s;
}

.nav-tabs .nav-link:hover {
border-color: transparent;
color: #fc2b5a;
background: none;
}

.nav-tabs .nav-link.active {
color: #fc2b5a;
border-color: #fc2b5a;
background: none;
}

/* Resume Content */
/* .resume-section {
display: none;
} */

.resume-section.active {
display: block;
}

.resume-paper {
background-color: #fff;
border-radius: 8px;
padding: 30px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

}

.section-title {
font-size: 20px;
font-weight: 600;
color: #333;
margin-bottom: 25px;
padding-bottom: 10px;
border-bottom: 2px solid #f1f1f1;
}

/* Personal Info */
.resume-header {
display: flex;
gap: 30px;
margin-bottom: 30px;
}

.profile-image-container {
flex-shrink: 0;
}

.profile-image {
width: 150px;
height: 150px;
border-radius: 50%;
overflow: hidden;
background-color: #f1f1f1;
display: flex;
align-items: center;
justify-content: center;
position: relative;
border: 3px solid #fff;
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.profile-image img {
width: 100%;
height: 100%;
object-fit: cover;
}

.profile-placeholder {
font-size: 60px;
color: #ccc;
}

.image-upload-overlay {
position: absolute;
bottom: 0;
left: 0;
right: 0;
background: rgba(0, 0, 0, 0.6);
color: white;
padding: 5px 0;
text-align: center;
cursor: pointer;
opacity: 0;
transition: opacity 0.3s;
}

.profile-image:hover .image-upload-overlay {
opacity: 1;
}

.profile-info {
flex: 1;
}

.profile-name {
font-size: 26px;
font-weight: 700;
color: #333;
margin-bottom: 8px;
}

.profile-title {
font-size: 18px;
color: #555;
margin-bottom: 15px;
}

.profile-summary {
font-size: 15px;
line-height: 1.5;
color: #666;
margin-bottom: 20px;
}

.contact-info {
display: flex;
flex-wrap: wrap;
gap: 15px;
}

.contact-item {
display: flex;
align-items: center;
gap: 8px;
font-size: 14px;
color: #555;
}

.contact-item i {
color: #fc2b5a;
}

/* Experience Section */
.experience-item, .education-item {
position: relative;
padding: 20px;
margin-bottom: 20px;
background-color: #f9f9f9;
border-radius: 8px;
border-left: 3px solid #fc2b5a;
}

.item-controls {
position: absolute;
top: 0px;
right: 10px;
}

.remove-button {
background: none;
border: none;
color: #dc3545;
cursor: pointer;
font-size: 16px;
}

.remove-button:hover {
color: #bd2130;
}

.job-title, .degree-select {
font-size: 18px;
font-weight: 600;
color: #333;
margin-bottom: 5px;
}

.company-name, .university {
font-size: 16px;
color: #555;
margin-bottom: 10px;
}

.date-range, .passing-year {
font-size: 14px;
color: #777;
margin-bottom: 15px;
display: flex;
align-items: center;
flex-wrap: wrap;
gap: 10px;
}

.date-label {
font-weight: 500;
}

.date-input {
border: 1px solid #ddd;
padding: 5px 10px;
border-radius: 4px;
}

.job-description, .additional-info {
background-color: #fff;
padding: 15px;
border-radius: 6px;
font-size: 14px;
line-height: 1.5;
color: #555;
}

/* Skills Section */
.skills-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
gap: 20px;
margin-bottom: 20px;
}

.skill-item {
padding: 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.skill-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 10px;
}

.skill-edit {
display: flex;
justify-content: space-between;
width: 100%;
margin-right: 10px;
}

.skill-name {
font-weight: 500;
color: #333;
}

.skill-level {
font-size: 14px;
color: #666;
}

.remove-skill {
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 24px;
position: absolute;
top: -6px;
right: 0;
}

.skill-slider {
width: 100%;
}

/* Additional Sections */
.extras-section {
display: flex;
flex-direction: column;
gap: 30px;
}

.extra-category {
margin-bottom: 25px;
}

.category-title {
font-size: 18px;
font-weight: 600;
color: #333;
margin-bottom: 15px;
padding-bottom: 8px;
border-bottom: 1px solid #eee;
}

/* Languages */
.languages-list {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
gap: 15px;
margin-bottom: 20px;
}

.language-item {
display: flex;
justify-content: space-between;
align-items: center;
padding: 12px 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.language-details {
flex: 1;
}

.language-proficiency {
display: flex;
gap: 5px;
margin-top: 5px;
}

.proficiency-dot {
width: 12px;
height: 12px;
border-radius: 50%;
background-color: #ddd;
cursor: pointer;
}

.proficiency-dot.filled {
background-color: #fc2b5a;
}

.remove-language {
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 24px;
position: absolute;
top: -6px;
right: 0;
}

/* Certifications */
.certifications-list {
display: flex;
flex-direction: column;
gap: 15px;
margin-bottom: 20px;
}

.certificate-item {
display: flex;
justify-content: space-between;
align-items: flex-start;
padding-inline: 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.certificate-details {
flex: 1;
}

.certificate-name {
font-weight: 500;
margin-bottom: 5px;
}

.certificate-issuer {
font-size: 14px;
color: #666;
}

.remove-certificate {
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 24px;
position: absolute;
top: -6px;
right: 0;
}

/* Projects */
.projects-list {
display: flex;
flex-direction: column;
gap: 15px;
margin-bottom: 20px;
}

.project-item {
display: flex;
justify-content: space-between;
padding: 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.project-details {
flex: 1;
}

.project-header {
display: flex;
justify-content: space-between;
margin-bottom: 10px;
}

.project-name {
font-weight: 500;
}

.project-year {
font-size: 14px;
color: #777;
}

.project-description {
font-size: 14px;
line-height: 1.5;
color: #555;
}

.remove-project {
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 24px;
position: absolute;
top: -6px;
right: 0;
}

/* Interests */
.interests-container {
margin-bottom: 20px;
}

.interests-tags {
display: flex;
flex-wrap: wrap;
gap: 10px;
margin-bottom: 15px;
}

.interest-tag {
display: flex;
align-items: center;
background-color: #f1f1f1;
border-radius: 30px;
padding: 6px 15px;
font-size: 14px;
}

.remove-interest {

margin-left: 8px;
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 18px;
position: absolute;
top: -6px;
right: 0px;
}

/* Declaration */
.declaration-container {
padding: 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.declaration-content {
font-size: 14px;
line-height: 1.5;
color: #555;
min-height: 60px;
}

/* Voice Recording */
.recording-container {
padding: 20px;
background-color: #f9f9f9;
border-radius: 8px;
}

.recording-controls {
text-align: center;
margin-bottom: 30px;
}

.recording-timer {
font-size: 36px;
font-weight: 700;
margin-bottom: 10px;
}

.recording-status {
margin-bottom: 20px;
color: #666;
min-height: 20px;
}

.control-buttons {
display: flex;
justify-content: center;
gap: 15px;
}

.record-button {
padding: 10px 20px;
background-color: #fc2b5a;
color: white;
border: none;
border-radius: 30px;
cursor: pointer;
display: flex;
align-items: center;
gap: 8px;
transition: all 0.2s;
}

.record-button:hover {
background-color: #e6255c;
}

.record-button.recording {
background-color: #dc3545;
animation: pulse 1.5s infinite;
}

@keyframes pulse {
0% { transform: scale(1); }
50% { transform: scale(1.05); }
100% { transform: scale(1); }
}

@keyframes slideInFromRight {
0% { 
  opacity: 0; 
  transform: translateX(30px); 
}
100% { 
  opacity: 1; 
  transform: translateX(0); 
}
}

.recordings-list {
margin-top: 30px;
}

.recordings-list h5 {
margin-bottom: 15px;
font-size: 18px;
}

.no-recordings {
text-align: center;
padding: 20px;
color: #777;
font-style: italic;
}

.recording-item {
display: flex;
justify-content: space-between;
align-items: center;
padding: 15px;
background-color: #fff;
border-radius: 8px;
margin-bottom: 10px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.recording-info {
flex: 1;
}

.recording-name {
font-weight: 500;
margin-bottom: 5px;
}

.recording-timestamp {
font-size: 12px;
color: #777;
}

.recording-actions {
display: flex;
align-items: center;
gap: 15px;
}

.audio-player {
height: 30px;
}

.delete-recording {
background: none;
border: none;
color: #dc3545;
cursor: pointer;
}

/* Add Button */
.add-button {
padding: 8px 16px;
background-color: #fc2b5a;
color: white;
border: none;
border-radius: 30px;
cursor: pointer;
font-size: 14px;
display: inline-flex;
align-items: center;
gap: 8px;
transition: all 0.2s;
}

.add-button:hover {
background-color: #e6255c;
}

/* Action Buttons */
.resume-actions {
margin-top: 30px;
display: flex;
justify-content: flex-end;
gap: 15px;
}

.upload-resume, .save-resume, .preview-resume {
padding: 10px 20px;
border-radius: 30px;
cursor: pointer;
font-size: 15px;
font-weight: 500;
display: flex;
align-items: center;
gap: 8px;
transition: all 0.2s;
}

.upload-resume {
background-color: #f8f9fa;
color: #333;
border: 1px solid #ddd;
}

.upload-resume:hover {
background-color: #e9ecef;
}

.save-resume {
background-color: #28a745;
color: white;
border: none;
}

.save-resume:hover {
background-color: #218838;
}

.preview-resume {
background-color: #fc2b5a;
color: white;
border: none;
}

.preview-resume:hover {
background-color: #e6255c;
}

/* Editable Content */
[contenteditable=true] {
min-height: 20px;
border: 1px solid transparent;
padding: 3px;
border-radius: 4px;
transition: border 0.2s;
min-width: 10%;
border: 1px solid #ddd;
}

[contenteditable=true]:hover {
border-color: #ddd;
}

[contenteditable=true]:focus {
outline: none;
border-color: #fc2b5a;
background-color: rgba(252, 43, 90, 0.05);
}

[contenteditable=true]:empty:before {
content: attr(data-placeholder);
color: #aaa;
cursor: text;
}
/* Remove Field Option Styling */
.field-container {
position: relative;
}

.remove-field-btn {
position: absolute;
top: 8px;
right: 8px;
background: none;
border: none;
color: #dc3545;
cursor: pointer;
font-size: 16px;
width: 24px;
height: 24px;
display: flex;
align-items: center;
justify-content: center;
border-radius: 50%;
opacity: 0;
transition: opacity 0.2s, background-color 0.2s;
}

.field-container:hover .remove-field-btn {
opacity: 1;
}

.remove-field-btn:hover {
background-color: rgba(220, 53, 69, 0.1);
}

/* Add this to the existing field items */
.experience-item,
.education-item,
.skill-item,
.certificate-item,
.language-item,
.project-item,
.interest-tag {
position: relative;
}
/* Responsive Fixes */
@media (max-width: 768px) {
    .floating-audio-btn{
        top:-85px;
        right: 5px;
    }
.resume-builder-container {
padding: 15px;
}

.resume-header {
flex-direction: column;
align-items: center;
}

.profile-image-container {
margin-bottom: 20px;
}

.profile-info {
text-align: center;
}

.contact-info {
justify-content: center;
}

.skills-grid, .languages-list {
grid-template-columns: 1fr;
}

.recording-item {
flex-direction: column;
align-items: flex-start;
}

.recording-actions {
margin-top: 10px;
width: 100%;
}

.audio-player {
width: 100%;
}

.resume-actions {
flex-direction: column;
}

.upload-resume, .save-resume, .preview-resume {
width: 100%;
justify-content: center;
}
.field-wrapper {
position: relative;
}

.remove-btn {
position: absolute;
top: 6px;
right: 6px;
background: transparent;
border: none;
color: #dc3545;
font-size: 16px;
padding: 2px 6px;
border-radius: 50%;
opacity: 0;
transition: all 0.2s ease-in-out;
}

.field-wrapper:hover .remove-btn {
opacity: 1;
background-color: rgba(220, 53, 69, 0.1);
}
.resume-preview-modal {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background-color: rgba(0, 0, 0, 0.6);
z-index: 999;
display: flex;
justify-content: center;
align-items: center;
}

.resume-preview-content {
background-color: white;
padding: 30px;
border-radius: 12px;
max-height: 80vh;
overflow-y: auto;
width: 90%;
max-width: 600px;
}


}
/* Resume Preview Modal */
.resume-preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .resume-preview-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 900px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }
  
  .resume-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
  }
  
  .resume-preview-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
  
  .close-preview {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #555;
  }
  
  .resume-preview-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background-color: #f5f5f5;
  }
  
  .resume-preview-actions {
    padding: 15px 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 15px;
  }
  
  .download-resume-btn, .close-preview-btn {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .download-resume-btn {
    background-color: #28a745;
    color: white;
    border: none;
  }
  
  .close-preview-btn {
    background-color: #f8f9fa;
    color: #333;
    border: 1px solid #ddd;
  }
  
  /* Resume Document Styling */
  .resume-document {
    background-color: white;
    padding: 40px;
    max-width: 800px;
    margin: 0 auto;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
    font-family: 'Roboto', Arial, sans-serif;
  }
  
  .resume-document-header {
    margin-bottom: 30px;
  }
  
  .resume-profile-section {
    display: flex;
    gap: 25px;
    margin-bottom: 25px;
  }
  
  .resume-profile-image {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #f0f0f0;
  }
  
  .resume-profile-placeholder {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    font-size: 50px;
    color: #aaa;
  }
  
  .resume-header-content {
    flex: 1;
  }
  
  .resume-name {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 5px 0;
    color: #333;
  }
  
  .resume-title {
    font-size: 18px;
    color: #666;
    margin: 0 0 15px 0;
  }
  
  .resume-contact-details {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .resume-contact-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #555;
  }
  
  .resume-contact-item i {
    color: #fc2b5a;
    font-size: 16px;
  }
  
  .resume-summary {
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 6px;
    margin-bottom: 30px;
  }
  
  .resume-summary p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #555;
  }
  
  .resume-document-body {
    display: flex;
    gap: 30px;
  }
  
  .resume-column {
    flex: 1;
  }
  
  .resume-left-column {
    border-right: 1px solid #eee;
    padding-right: 25px;
  }
  
  .resume-right-column {
    padding-left: 5px;
  }
  
  .resume-section {
    margin-bottom: 25px;
  }
  
  .resume-section-title {
    font-size: 18px;
    font-weight: 600;
    color: #fc2b5a;
    margin: 0 0 15px 0;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
  }
  
  .resume-experience-item, .resume-education-item, .resume-project-item {
    margin-bottom: 20px;
  }
  
  .resume-item-header {
    margin-bottom: 8px;
  }
  
  .resume-item-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 3px 0;
    color: #333;
  }
  
  .resume-item-subtitle {
    font-size: 14px;
    color: #666;
    margin: 0 0 3px 0;
  }
  
  .resume-item-period {
    font-size: 12px;
    color: #888;
    margin: 0;
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
    margin-bottom: 8px;
  }
  
  .resume-skill-name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .resume-skill-bar-container {
    height: 6px;
    background-color: #f0f0f0;
    border-radius: 3px;
    overflow: hidden;
  }
  
  .resume-skill-bar {
    height: 100%;
    background-color: #fc2b5a;
    border-radius: 3px;
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
    margin-bottom: 8px;
  }
  
  .resume-language-name {
    font-size: 14px;
    font-weight: 500;
  }
  
  .resume-language-level {
    display: flex;
    gap: 3px;
  }
  
  .resume-level-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #f0f0f0;
  }
  
  .resume-level-dot.filled {
    background-color: #fc2b5a;
  }
  
  .resume-certifications-list {
    padding-left: 20px;
    margin: 0;
    font-size: 14px;
    color: #555;
  }
  
  .resume-certifications-list li {
    margin-bottom: 8px;
  }
  
  .resume-project-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 5px 0;
  }
  
  .resume-project-year {
    font-size: 14px;
    font-weight: normal;
    color: #777;
  }
  
  .resume-interests-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .resume-interest-tag {
    display: inline-block;
    padding: 5px 12px;
    background-color: #f5f5f5;
    border-radius: 20px;
    font-size: 13px;
    color: #555;
  }
  
  .resume-declaration {
    border-top: 1px solid #eee;
    margin-top: 30px;
    padding-top: 20px;
  }
  
  .resume-declaration p {
    font-size: 14px;
    color: #555;
    line-height: 1.5;
    font-style: italic;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .resume-document {
      padding: 20px;
    }
    
    .resume-profile-section {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .resume-contact-details {
      justify-content: center;
    }
    
    .resume-document-body {
      flex-direction: column;
    }
    
    .resume-left-column {
      border-right: none;
      padding-right: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    
    .resume-right-column {
      padding-left: 0;
    }
  }
 

  .pac-container {
    z-index: 10000 !important;
  }

 
          `
        }
      </style>
    </div>
  );
};

export default CRMDashboard;
