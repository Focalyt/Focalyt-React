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
const KYCManagement = ({ openPanel = null, isPanelOpen = null }) => {

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;
  const [setPreVerification, showSetPreVerification] = useState(false);
  const [showPanel, setShowPanel] = useState('')

  const candidateRef = useRef();

  const fetchProfile = (id) => {
    if (candidateRef.current) {
      console.log('start fetching', id)
      candidateRef.current.fetchProfile(id);
      fetchProfileData()
    }
  };

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     // Check if click is outside any multi-select dropdown
  //     const isMultiSelectClick = event.target.closest('.multi-select-container-new');

  //     if (!isMultiSelectClick) {
  //       // Close all dropdowns
  //       setDropdownStates(prev =>
  //         Object.keys(prev).reduce((acc, key) => {
  //           acc[key] = false;
  //           return acc;
  //         }, {})
  //       );
  //     }
  //   };

  //   // Add event listener
  //   document.addEventListener('mousedown', handleClickOutside);

  //   // Cleanup
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, []);

  // const handleSaveCV = async () => {
  //   if (candidateRef.current) {
  //     const result = await candidateRef.current.handleSaveCV();
  //     console.log(result, 'result')
  //     if (result === true) {
  //       setOpenModalId(null); setSelectedProfile(null)
  //     }
  //   }
  // };

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
  // ========================================
  // 🎯 Main Tab State
  // ========================================
  const [mainTab, setMainTab] = useState('Ekyc'); // 'Ekyc' or 'AllAdmission'
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isLoadingProfilesData, setIsLoadingProfilesData] = useState(false);

  const [activeTab, setActiveTab] = useState({});
  const [showPopup, setShowPopup] = useState(null);
  const [openModalId, setOpenModalId] = useState(null);

  const [activeCrmFilter, setActiveCrmFilter] = useState(0);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showFollowupPanel, setShowFollowupPanel] = useState(false);
  const [showWhatsappPanel, setShowWhatsappPanel] = useState(false);
  const [mainContentClass, setMainContentClass] = useState('col-12');
  const [leadHistoryPanel, setLeadHistoryPanel] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [leadDetailsVisible, setLeadDetailsVisible] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [isMobile, setIsMobile] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedProfile, setSelectedProfile] = useState(null);
  // Documents specific state
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentZoom, setDocumentZoom] = useState(1);
  const [documentRotation, setDocumentRotation] = useState(0);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const rejectionReasonRef = useRef('');
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const fileInputRef = useRef(null);
  const [currentPreviewUpload, setCurrentPreviewUpload] = useState(null);

  const [verifiedByUser, setVerifiedByUser] = useState(null);
  const [rejectedByUser, setRejectedByUser] = useState(null);
  const [uploadedByUser, setUploadedByUser] = useState(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
  const [userDetailsError, setUserDetailsError] = useState(false);

  // Static document data for demonstration
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

  // Static profile data
  const staticProfileData = [];

  // ========================================
  // 🎯 eKYC Filters Configuration   {(activeTab[profileIndex] || 0) === 3 && (
  // ========================================
  const [ekycFilters, setEkycFilters] = useState([
    { _id: 'pendingEkyc', name: 'kyc Pending', count: 0, milestone: '' },
    { _id: 'rejectedDocs', name: 'Reject Documents', count: 0, milestone: '' },
    { _id: 'doneEkyc', name: 'kyc Verified', count: 0, milestone: 'Ekyc Done' },
    { _id: 'placementVerification', name: 'Placement Verification', count: 0, milestone: '' },
    { _id: 'All', name: 'All', count: 0, milestone: '' }

  ]);


  const { navRef, navHeight, navWidth } = useNavHeight([ekycFilters, showEditPanel, showFollowupPanel, leadHistoryPanel, showWhatsappPanel, mainContentClass, isPanelOpen]);
  const { isScrolled, scrollY, contentRef } = useScrollBlur(navHeight);
  const blurIntensity = Math.min(scrollY / 10, 15);
  const navbarOpacity = Math.min(0.85 + scrollY / 1000, 0.98);

  // ========================================
  // 🎯 All Admission Filters Configuration
  // ========================================


  // open model for upload documents 
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);


  //filte stats

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
    }
  });

  const totalSelected = Object.values(formData).reduce((total, filter) => total + filter.values.length, 0);
  const [verticalOptions, setVerticalOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [centerOptions, setCenterOptions] = useState([]);
  const [counselorOptions, setCounselorOptions] = useState([]);

  // Fetch filter options from backend API on mount
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



  // useEffect(()=>{

  const [questionFormData, setQuestionFormData] = useState({});
  const [isLoadingQuestionAnswers, setIsLoadingQuestionAnswers] = useState(false);
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [currentPreVerificationProfile, setCurrentPreVerificationProfile] = useState(null);
  // Function to fetch existing question answers
  const fetchQuestionAnswers = async (appliedcourseId) => {
    try {

      console.log('appliedcourseId', appliedcourseId)
      setQuestionAnswers([])
      setIsLoadingAnswers(true);
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      const response = await axios.get(`${backendUrl}/college/candidate/questionAnswer/${appliedcourseId}`, {
        headers: { 'x-auth': token }
      });
      console.log('response question answer', response)

      if (response.data.status && response.data.data) {
        const existingData = response.data.data.responses;

          console.log('existingData', existingData)

        setQuestionAnswers(existingData);
    
      } else {
        setQuestionFormData({});
        setQuestionAnswers([]);
      }
    } catch (error) {
      console.log('No existing question answers found or error:', error);
      setQuestionFormData({});
      setQuestionAnswers([]);
    } finally {
      setIsLoadingAnswers(false);
    }
  };

  const QuestionAnswer = async () => {
    try {
      setIsSubmittingAnswers(true);

      console.log(questionFormData, 'questionFormData')
      console.log(selectedProfile, 'selectedProfile')
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      if (!token) {
        alert("Authentication token not found. Please login again.");
        return;
      }
      // Transform questionFormData into responses array format
      const responses = [];
      const questions = [
        "Is the Candidate Aware of the Course",
        "Is the Candidate Aware from the Course Curriculum",
        "Currently Work Status",
        "Is Candidate Interested for Course",
        "Is Candidate Ready for Course",
        "Is Candidate Ready for Course Fee",
        "Is Candidate Ready for Course Duration"
      ];

      questions.forEach((question, index) => {
        const answer = questionFormData[`q${index + 1}`];
        if (answer) {
          responses.push({
            question: question,
            answer: answer
          });
        }
      });

      if (!selectedProfile || !selectedProfile._id) {
        alert("No profile selected. Please try again.");
        return;
      }

      if (responses.length === 0) {
        alert("Please answer at least one question before submitting.");
        return;
      }

      const response = await axios.post(`${backendUrl}/college/candidate/questionAnswer`, {
        appliedcourse: selectedProfile._id,
        responses: responses
      }, {
        headers: { 'x-auth': token }
      });
      console.log("responnse", response)
      if (response.data.status) {
        alert("Pre-verification questions submitted successfully!");
        showSetPreVerification(false);
        setQuestionFormData({}); // Reset form
      } else {
        alert("Error: " + response.data.message);
      }

      console.log(response, 'response');
    } catch (error) {
      console.log(error, 'error');
      alert("Error submitting pre-verification questions. Please try again.");
    } finally {
      setIsSubmittingAnswers(false);
    }
  }

  useEffect(() => {
    if (selectedProfile) {
      fetchQuestionAnswers(selectedProfile._id);
    } else {
      // Clear pre-verification data when no profile is selected
      setQuestionAnswers([]);
      setQuestionFormData({});
      setCurrentPreVerificationProfile(null);
    }
  }, [selectedProfile]);

  // ========================================
  // 🎯 Modal Scroll Management
  // ========================================
  useEffect(() => {
    // Prevent background scrolling when any modal or panel is open
    if (showDocumentModal || showUploadModal || showEditPanel || showWhatsappPanel) {
      // Store the current scroll position
      const scrollY = window.scrollY;

      // Add styles to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      // Return function to restore scrolling when modal closes
      return () => {
        // Restore body styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';

        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [showDocumentModal, showUploadModal, showEditPanel, showWhatsappPanel]);

  // ========================================
  // 🎯 Prevent Modal Re-rendering on Scroll
  // ========================================
  useEffect(() => {
    if (showDocumentModal || showUploadModal) {
      // Prevent scroll events from causing modal re-renders
      const preventScrollRerender = (e) => {
        // Stop propagation of scroll events to prevent modal re-rendering
        e.stopPropagation();
      };

      // Add event listeners to modal elements
      const modalOverlays = document.querySelectorAll('.document-modal-overlay, .upload-modal-overlay');
      modalOverlays.forEach(overlay => {
        overlay.addEventListener('wheel', preventScrollRerender, { passive: false });
        overlay.addEventListener('scroll', preventScrollRerender, { passive: false });
      });

      return () => {
        // Remove event listeners
        modalOverlays.forEach(overlay => {
          overlay.removeEventListener('wheel', preventScrollRerender);
          overlay.removeEventListener('scroll', preventScrollRerender);
        });
      };
    }
  }, [showDocumentModal, showUploadModal]);

  const handleCriteriaChange = (criteria, values) => {
    setFormData((prevState) => ({
      ...prevState,
      [criteria]: {
        type: "includes",
        values: values
      }
    }));
    console.log('Selected verticals:', values);
    // Reset to first page and fetch with new filters
  };

  const [dropdownStates, setDropdownStates] = useState({
    projects: false,
    verticals: false,
    course: false,
    center: false,
    counselor: false,
    sector: false
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


  const openUploadModal = (document) => {
    setSelectedDocumentForUpload(document);
    setShowUploadModal(true);
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


  // Simulate file upload with progress
  const handleFileUpload = async () => {
    if (!selectedFile || !selectedDocumentForUpload) return;

    console.log('selectedDocumentForUpload', selectedDocumentForUpload)

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

      console.log('response', response)

      if (response.data.status) {
        alert('Document uploaded successfully! Status: Pending Review');

        // Optionally refresh data here
        closeUploadModal();
        fetchProfileData()
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

  // ========================================
  // 🎯 Get Current Filters Function
  // ========================================
  const getCurrentFilters = () => {
    return mainTab === 'Ekyc' ? ekycFilters : [];
  };



  // Document functions
  // Fixed openDocumentModal function
  const openDocumentModal = (document, profile) => {
    console.log(profile, 'profile');
    if (profile) {
      setSelectedProfile(profile);
    }
    setSelectedDocument(document);
    setShowDocumentModal(true);
    setDocumentZoom(1);
    setDocumentRotation(0);
    fetchUserDetailsForDocument(document);
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
    setShowRejectionForm(false);
    setRejectionReason('');
    setIsNewModalOpen(false);
    // Only reset when actually closing modal
    setDocumentZoom(1);
    setDocumentRotation(0);
    // document.body?.classList.remove('no-scroll');
    setVerifiedByUser(null);
    setRejectedByUser(null);
    setUploadedByUser(null);
    setIsLoadingUserDetails(false);
    setUserDetailsError(false);
  };



  const updateDocumentStatus = async (uploadId, status, rejectionReason) => {
    try {
      if (!selectedProfile || !selectedProfile._id) {
        alert('No profile selected');
        return;
      }

      // Add confirmation dialog
      const confirmMessage = status === 'Verified'
        ? 'Are you sure you want to verify this document?'
        : 'Are you sure you want to reject this document?';

      if (!window.confirm(confirmMessage)) {
        return;
      }

      const response = await axios.put(
        `${backendUrl}/college/verify-document/${selectedProfile._id}/${uploadId}`,
        {
          status,
          rejectionReason
        },
        {
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // If KYC was updated, show a success message
        if (response.data.kycUpdated) {
          alert('All documents verified! KYC status has been updated.');
        } else {
          alert(`Document ${status.toLowerCase()} successfully!`);
        }

        // Refresh the profile data
        await fetchProfileData();
        closeDocumentModal();
      } else {
        alert(response.data.message || 'Failed to update document status');
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      alert('Failed to update document status');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'text-dark';
      case 'verified': return 'text-success';
      case 'rejected': return 'text-danger';
      default: return 'text-secondary';
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

  const getDocumentCounts = (documents) => {
    // Ensure documents is an array
    const docArray = Array.isArray(documents) ? documents : [];

    const totalDocs = docArray.length;
    const uploadedDocs = docArray.filter(doc => doc.uploads && doc.uploads.length > 0).length;
    const pendingDocs = docArray.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Pending'
    ).length;
    const verifiedDocs = docArray.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Verified'
    ).length;
    const rejectedDocs = docArray.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Rejected'
    ).length;

    return { totalDocs, uploadedDocs, pendingDocs, verifiedDocs, rejectedDocs };
  };


  const handleCrmFilterClick = (filter, index) => {
    if (index === 0) {
      setFilterData({
        ...filterData,
        kyc: false,
      })
      setActiveCrmFilter(index);
      return;
    }
    if (index === 1) {
      // Filter profiles where kyc is true
      setFilterData({
        ...filterData,
        kyc: true,
      })
      setActiveCrmFilter(index);
      return;
    } else if (index === 2) {
      setFilterData({
        ...filterData,
        kyc: 'all',
      })
      setActiveCrmFilter(index);
      return;
    }
    setActiveCrmFilter(index);

  };

  // Filter state from Registration component
  const [filterData, setFilterData] = useState({
    name: '',
    courseType: '',
    status: 'true',
    kyc: false,
    leadStatus: '',
    sector: '',
    createdFromDate: null,
    createdToDate: null,
    modifiedFromDate: null,
    modifiedToDate: null,
    nextActionFromDate: null,
    nextActionToDate: null

  });



  // Add dropdown visibility states
  const [showCreatedDatePicker, setShowCreatedDatePicker] = useState(false);
  const [showModifiedDatePicker, setShowModifiedDatePicker] = useState(false);
  const [showNextActionDatePicker, setShowNextActionDatePicker] = useState(false);

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


  const tabs = [
    'Lead Details',
    'Profile',
    'Job History',
    'Course History',
    'Documents',
    'Pre Verification'
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
    if (seletectedStatus) {
      fetchSubStatus();
    }
  }, [seletectedStatus]);

  // Format date range for display
  const formatDateRange = (fromDate, toDate) => {
    if (!fromDate && !toDate) {
      return 'Select Date Range';
    }
    if (fromDate && !toDate) {
      return `From ${fromDate.toLocaleDateString('en-GB')}`;
    }
    if (!fromDate && toDate) {
      return `Until ${toDate.toLocaleDateString('en-GB')}`;
    }
    if (fromDate && toDate) {
      const from = fromDate.toLocaleDateString('en-GB');
      const to = toDate.toLocaleDateString('en-GB');
      if (from === to) {
        return from;
      }
      return `${from} - ${to}`;
    }
    return 'Select Date Range';
  };

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

  // Clear functions
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

  const handleDateChange = (date, fieldName) => {
    const newFilterData = {
      ...filterData,
      [fieldName]: date
    };
    setFilterData(newFilterData);
  };

  const clearCreatedDate = () => {
    setFilterData(prev => ({
      ...prev,
      createdFromDate: null,
      createdToDate: null
    }));

  };

  const clearModifiedDate = () => {
    setFilterData(prev => ({
      ...prev,
      modifiedFromDate: null,
      modifiedToDate: null
    }));

  };

  const clearNextActionDate = () => {
    setFilterData(prev => ({
      ...prev,
      nextActionFromDate: null,
      nextActionToDate: null
    }));

  };



  // Helper function for status icons
  const getStatusIcon = (statusName) => {
    const statusName_lower = statusName.toLowerCase();
    if (statusName_lower.includes('hot') || statusName_lower.includes('urgent')) return '🔥';
    if (statusName_lower.includes('warm') || statusName_lower.includes('interested')) return '⚡';
    if (statusName_lower.includes('cold') || statusName_lower.includes('not')) return '❄️';
    if (statusName_lower.includes('new') || statusName_lower.includes('fresh')) return '🆕';
    if (statusName_lower.includes('follow') || statusName_lower.includes('pending')) return '⏳';
    if (statusName_lower.includes('converted') || statusName_lower.includes('success')) return '✅';
    return '🎯';
  };

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
    };

    setFilterData(clearedFilters);
    setFormData({
      projects: { type: "includes", values: [] },
      verticals: { type: "includes", values: [] },
      course: { type: "includes", values: [] },
      center: { type: "includes", values: [] },
      counselor: { type: "includes", values: [] },
      sector: { type: "includes", values: [] }
    });

    setCurrentPage(1);
    // Explicitly call fetchProfileData with cleared filters to ensure data is fetched
    fetchProfileData(clearedFilters, 1);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleMoveToAdmission = async (profile) => {
    try {
      if (!profile || !profile._id) {
        alert('No profile selected');
        return;
      }

      const uploadedDocs = profile.uploadedDocs

      for (const doc of uploadedDocs) {
        const docStatus = doc.status
        if (doc.mandatory && !docStatus) {
          console.log('docs is', doc)
          alert('All documents must be verified before moving to admission list');
          return;
        }
      }


      // Show confirmation dialog
      const confirmMove = window.confirm('Do you really want to move this profile to admission list?');
      if (!confirmMove) {
        return;
      }

      // Check if backend URL and token exist
      if (!backendUrl) {
        alert('Backend URL not configured');
        return;
      }

      if (!token) {
        alert('Authentication token missing');
        return;
      }

      // Send PUT request to backend API to update status
      const response = await axios.put(
        `${backendUrl}/college/update/${profile._id}`,
        {
          admissionDone: true, // Set admission as done
          remarks: 'Moved to admission'
        },
        {
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('Profile moved to admission successfully!');
        // Refresh the profile data
        await fetchProfileData();
      } else {
        console.error('API returned error:', response.data);
        alert(response.data.message || 'Failed to move to admission');
      }
    } catch (error) {
      console.error('Error moving to admission:', error);
      alert('Failed to move to admission');
    }
  };

  const handleTimeChange = (e) => {
    if (!followupDate) {
      alert('Select date first');
      return;
    }

    const time = e.target.value;
    const [hours, minutes] = time.split(':');
    const selectedDateTime = new Date(followupDate);
    selectedDateTime.setHours(parseInt(hours, 10));
    selectedDateTime.setMinutes(parseInt(minutes, 10));
    selectedDateTime.setSeconds(0);
    selectedDateTime.setMilliseconds(0);

    const now = new Date();

    if (selectedDateTime < now) {
      alert('Select future time');
      return;
    }

    setFollowupTime(time);
  };

  const handleSubStatusChange = (e) => {
    const selectedSubStatusId = e.target.value;
    const selectedSubStatusObject = subStatuses.find(status => status._id === selectedSubStatusId);
    setSelectedSubStatus(selectedSubStatusObject || null);
  };

  const fetchStatus = async () => {
    try {


      const response = await axios.get(`${backendUrl}/college/status`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        const status = response.data.data;
        setStatuses(status.map(r => ({
          _id: r._id,
          name: r.title,
          count: r.count || 0,
        })));
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch Status');
    }
  };

  const fetchSubStatus = async () => {
    try {


      const response = await axios.get(`${backendUrl}/college/status/${seletectedStatus}/substatus`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        setSubStatuses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch SubStatus');
    }
  };

  const handleUpdateStatus = async () => {
    console.log('Function called');

    try {
      if (showEditPanel) {
        // Validation checks
        if (!selectedProfile || !selectedProfile._id) {
          alert('No profile selected');
          return;
        }

        if (!seletectedStatus) {
          alert('Please select a status');
          return;
        }

        // Combine date and time into a single Date object (if both are set)
        let followupDateTime = '';
        if (followupDate && followupTime) {
          // Create proper datetime string
          const dateStr = followupDate instanceof Date
            ? followupDate.toISOString().split('T')[0]  // Get YYYY-MM-DD format
            : followupDate;

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

        console.log('API response:', response.data);

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
          closeEditPanel();
        } else {
          console.error('API returned error:', response.data);
          alert(response.data.message || 'Failed to update status');
        }

      }
      if (showFollowupPanel) {


        // Combine date and time into a single Date object (if both are set)
        let followupDateTime = '';
        if (followupDate && followupTime) {
          // Create proper datetime string
          const dateStr = followupDate instanceof Date
            ? followupDate.toISOString().split('T')[0]  // Get YYYY-MM-DD format
            : followupDate;

          followupDateTime = new Date(`${dateStr}T${followupTime}`);

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

        console.log('API response:', response.data);

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
          closeEditPanel();
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
  };




  useEffect(() => {
    fetchProfileData();
    console.log(filterData, 'filterData')

  }, [currentPage, activeCrmFilter]);

  const fetchProfileData = async (filters = filterData, page = currentPage) => {
    try {
      console.log('filters', filters)
      setIsLoadingProfiles(true);
      if (!token) {
        console.warn('No token found in session storage.');
        setIsLoadingProfiles(false);
        return;
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        ...(filters.name && { name: filters.name }),
        ...(filters.courseType && { courseType: filters.courseType }),
        ...(filters.kyc && { kyc: filters.kyc }),
        ...(filters.status && filters.status !== 'true' && { status: filters.status }),
        ...(filters.leadStatus && { leadStatus: filters.leadStatus }),
        ...(filters.sector && { sector: filters.sector }),
        ...(filters.createdFromDate && { createdFromDate: filters.createdFromDate.toISOString() }),
        ...(filters.createdToDate && { createdToDate: filters.createdToDate.toISOString() }),
        ...(filters.modifiedFromDate && { modifiedFromDate: filters.modifiedFromDate.toISOString() }),
        ...(filters.modifiedToDate && { modifiedToDate: filters.modifiedToDate.toISOString() }),
        ...(filters.nextActionFromDate && { nextActionFromDate: filters.nextActionFromDate.toISOString() }),
        ...(filters.nextActionToDate && { nextActionToDate: filters.nextActionToDate.toISOString() }),
        // Multi-select filters
        ...(formData.projects.values.length > 0 && { projects: JSON.stringify(formData.projects.values) }),
        ...(formData.verticals.values.length > 0 && { verticals: JSON.stringify(formData.verticals.values) }),
        ...(formData.course.values.length > 0 && { course: JSON.stringify(formData.course.values) }),
        ...(formData.center.values.length > 0 && { center: JSON.stringify(formData.center.values) }),
        ...(formData.counselor.values.length > 0 && { counselor: JSON.stringify(formData.counselor.values) })
      });

      console.log('queryParams', queryParams)

      const response = await axios.get(`${backendUrl}/college/kycCandidates?${queryParams}`, {
        headers: {
          'x-auth': token,
        },
      });

      if (response.data.success && response.data.data) {
        const { crmFilterCounts } = response.data;

        const filter = [
          { _id: 'pendingEkyc', name: 'kyc Pending', count: crmFilterCounts.pendingKyc, milestone: '' },
          { _id: 'rejectedDocs', name: 'Reject Documents', count: 0, milestone: '' },
          { _id: 'doneEkyc', name: 'kyc Verified', count: crmFilterCounts.doneKyc, milestone: 'kyc Done' },
          { _id: 'placementVerification', name: 'Placement Verification', count: crmFilterCounts.placementVerification, milestone: '' },
          { _id: 'All', name: 'All', count: crmFilterCounts.all, milestone: '' }
        ];

        setEkycFilters(filter);
        console.log('backend response', response.data)
        setAllProfiles(response.data.data);
        setTotalPages(response.data.totalPages)


      } else {
        console.error('Failed to fetch profile data', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  // Additional state and functions (keeping existing ones for brevity)
  const [experiences, setExperiences] = useState([{
    jobTitle: '',
    companyName: '',
    from: null,
    to: null,
    jobDescription: '',
    currentlyWorking: false
  }]);


  const togglePopup = (profileIndex) => {
    setShowPopup(prev => prev === profileIndex ? null : profileIndex);
  };

  const handleTabClick = (profileIndex, tabIndex) => {
    setActiveTab(prevTabs => ({
      ...prevTabs,
      [profileIndex]: tabIndex
    }));
    
    // If Pre Verification tab is clicked (index 5), fetch the data for this specific candidate
    if (tabIndex === 5) {
      const currentProfile = allProfiles[profileIndex];
      if (currentProfile && currentProfile._id) {
        setSelectedProfile(currentProfile);
        setCurrentPreVerificationProfile(currentProfile);
      }
    }
  };

  const handleFilterChange = (e) => {
    try {
      const { name, value } = e.target;
      const newFilterData = { ...filterData, [name]: value };
      setFilterData(newFilterData);
    } catch (error) {
      console.error('Filter change error:', error);
    }
  };


  const closeEditPanel = () => {
    setShowEditPanel(false);
    setShowFollowupPanel(false);
    if (!isMobile) {
      // setMainContentClass('col-12');
      const hasOtherPanelsOpen = leadHistoryPanel || showWhatsappPanel;
      setMainContentClass(hasOtherPanelsOpen ? 'col-8' : 'col-12');
    }
  };


  const handleFetchCandidate = async (profile = null) => {
    setShowPopup(null)
    setSelectedProfile(profile)
    setOpenModalId(profile._id);
  }

  useEffect(() => {
    console.log('useeffect', selectedProfile);
    if (selectedProfile && selectedProfile._candidate && selectedProfile._candidate._id) {
      fetchProfile(selectedProfile._candidate._id);
    }
  }, [selectedProfile]);





  const toggleLeadDetails = (profileIndex) => {
    setLeadDetailsVisible(prev => prev === profileIndex ? null : profileIndex);
  };

  const closeleadHistoryPanel = () => {
    setLeadHistoryPanel(false)
    if (!isMobile) {
      // setMainContentClass(showEditPanel || showWhatsappPanel ? 'col-8' : 'col-12');
      const hasOtherPanelsOpen = showEditPanel || showFollowupPanel || showWhatsappPanel;
      setMainContentClass(hasOtherPanelsOpen ? 'col-8' : 'col-12');
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

  const today = new Date();

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
          <i className="fas fa-search-plus"></i>
        </button>

        <button
          onClick={onZoomOut}
          className="control-btn"
          style={{ whiteSpace: 'nowrap' }}
          title="Zoom Out"
        >
          <i className="fas fa-search-minus"></i>
        </button>

        {/* Show rotation button only for images */}
        {fileType === 'image' && (
          <button
            onClick={onRotate}
            className="control-btn"
            style={{ whiteSpace: 'nowrap' }}
            title="Rotate 90°"
          >
            <i className="fas fa-redo"></i>
          </button>
        )}

        {/* Reset View Button */}
        <button
          onClick={onReset}
          className="control-btn"
          style={{ whiteSpace: 'nowrap' }}
          title="Reset View"
        >
          <i className="fas fa-sync-alt"></i>
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
          <i className="fas fa-download"></i>
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

  // Function to fetch user details by ID
  const fetchUserDetails = async (userId) => {
    if (!userId) return null;

    try {
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

      const response = await axios.get(`${backendUrl}/college/users/users-details/${userId}`, {
        headers: {
          'x-auth': token
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  };

  // Function to fetch user details when document modal opens
  const fetchUserDetailsForDocument = async (document) => {
    if (!document) return;

    setIsLoadingUserDetails(true);

    try {
      const latestUpload = document.uploads && document.uploads.length > 0
        ? document.uploads[document.uploads.length - 1]
        : (document.fileUrl && document.status !== "Not Uploaded" ? document : null);

      if (latestUpload) {
        // Fetch verifiedBy user details
        if (latestUpload.verifiedBy) {
          const verifiedByDetails = await fetchUserDetails(latestUpload.verifiedBy);
          setVerifiedByUser(verifiedByDetails);
        }

        // Fetch rejectedBy user details
        if (latestUpload.rejectedBy) {
          const rejectedByDetails = await fetchUserDetails(latestUpload.rejectedBy);
          setRejectedByUser(rejectedByDetails);
        }

        // Fetch uploadedBy user details
        if (latestUpload.uploadedBy) {
          const uploadedByDetails = await fetchUserDetails(latestUpload.uploadedBy);
          setUploadedByUser(uploadedByDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching user details for document:', error);
      setUserDetailsError(true);
    } finally {
      setIsLoadingUserDetails(false);
    }
  };

  // यह function DocumentModal के बाहर, component के अंदर कहीं भी define करें:

  // Auto Height Document Thumbnail Function - DocumentModal के बाहर define करें


  const DocumentModal = () => {
    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [documentZoom, setDocumentZoom] = useState(1);
    const [documentRotation, setDocumentRotation] = useState(0);

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
    }, [latestUpload, selectedDocument, rejectionReason, handleCancelRejection]);

    if (!showDocumentModal || !selectedDocument) return null;

    // Helper function to render document preview thumbnail using iframe/img
    // यदि आप बिल्कुल auto height चाहते हैं (बिना किसी limit के):
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
              height: 'auto', // Completely auto height
              maxWidth: '100%',
              objectFit: 'contain',
              borderRadius: '4px',
              border: '1px solid #dee2e6',
              cursor: 'pointer',
              backgroundColor: '#f8f9fa',
              display: 'block'
            }}
            onClick={() => {
              if (isSmall) {
                setCurrentPreviewUpload(upload);
              }
            }}
          />
        );
      } else if (fileType === 'pdf') {
        return (
          <div style={{
            position: 'relative',
            overflow: 'visible', // Allow content to expand
            width: isSmall ? '100%' : '150px',
            height: 'auto' // Auto height for container
          }}>
            <iframe
              src={fileUrl + '#navpanes=0&toolbar=0'} // Add FitH parameter for better PDF display
              className={`document-thumbnail pdf-thumbnail ${isSmall ? 'small' : ''}`}
              style={{
                width: '100%',
                height: isSmall ? 'auto' : '100px', // Use viewport height for history
                maxHeight: isSmall ? '600px' : '100px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                cursor: 'pointer',
                pointerEvents: isSmall ? 'auto' : 'none',
                transform: isSmall ? 'scale(1)' : 'scale(0.3)',
                transformOrigin: 'top left',
                backgroundColor: '#fff'
              }}
              title="PDF Document"
              onClick={() => {
                if (isSmall) {
                  setCurrentPreviewUpload(upload);
                }
              }}
              scrolling={isSmall ? 'auto' : 'no'}
            />
            {!isSmall && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc3545',
                fontSize: '12px',
                fontWeight: 'bold',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
                onClick={() => {
                  setCurrentPreviewUpload(upload);
                }}>
                PDF
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div style={{
            position: 'relative',
            width: isSmall ? '100%' : '150px',
            height: 'auto' // Auto height
          }}>
            <iframe
              src={fileUrl + '#navpanes=0&toolbar=0'}
              className={`document-thumbnail ${isSmall ? 'small' : ''}`}
              style={{
                width: '100%',
                height: isSmall ? 'auto' : '100px',
                minHeight: isSmall ? '300px' : '100px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                cursor: 'pointer',
                pointerEvents: isSmall ? 'auto' : 'none',
                backgroundColor: '#f8f9fa'
              }}
              title="Document"
              onClick={() => {
                if (isSmall) {
                  setCurrentPreviewUpload(upload);
                }
              }}
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
                cursor: 'pointer'
              }}
                onClick={() => {
                  setCurrentPreviewUpload(upload);
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
                    <DocumentControls
                      onZoomIn={handleZoomIn}
                      onZoomOut={handleZoomOut}
                      onRotate={handleRotate}
                      onReset={handleReset}
                      onDownload={fileUrl}
                      zoomLevel={documentZoom}
                      fileType={fileType}
                    />
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
                          <div className="history-date" style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#495057',
                            marginBottom: '4px'
                          }}>
                            {formatDate(upload.uploadedAt)}
                          </div>
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
                              <button
                                className="btn btn-sm btn-outline-secondary ms-2"
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 8px'
                                }}
                                onClick={() => {
                                  // Switch main preview to this upload
                                  setCurrentPreviewUpload(upload);
                                }}
                              >
                                <i className="fas fa-eye me-1"></i>
                                Preview
                              </button>
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
                <div className="info-row">
                  <strong>{latestUpload?.status === 'Verified' ? 'Verified By:' : latestUpload?.status === 'Rejected' ? 'Rejected By:' : ''}</strong>
                  <span className="ms-2">
                    {isLoadingUserDetails ? (
                      <span className="text-muted">
                        <i className="fas fa-spinner fa-spin me-1"></i>
                        Loading...
                      </span>
                    ) : userDetailsError ? (
                      <span className="text-danger">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Error loading user details
                      </span>
                    ) : (
                      latestUpload?.status === 'Verified' && verifiedByUser?.name ?
                        `${verifiedByUser.name}${verifiedByUser.designation ? ` (${verifiedByUser.designation})` : ''}` :
                        latestUpload?.status === 'Rejected' && rejectedByUser?.name ?
                          `${rejectedByUser.name}${rejectedByUser.designation ? ` (${rejectedByUser.designation})` : ''}` :
                          uploadedByUser?.name ?
                            `${uploadedByUser.name}${uploadedByUser.designation ? ` (${uploadedByUser.designation})` : ''}` : 'N/A'
                    )}
                  </span>
                </div>
              </div>

              {/* Document Actions */}
              {(latestUpload?.status || selectedDocument?.status) === 'Pending' && (
                <div className="document-actions mt-4">
                  {!showRejectionForm ? (
                    <div className="action-buttons">
                      <button
                        className="btn btn-success me-2"
                        onClick={() => updateDocumentStatus(latestUpload?._id || selectedDocument?._id, 'Verified')}
                      >
                        <i className="fas fa-check"></i> Approve Document
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={handleRejectClick}
                      >
                        <i className="fas fa-times"></i> Reject Document
                      </button>
                    </div>
                  ) : (
                    <div className="rejection-form" style={{ display: 'block', marginTop: '20px' }}>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a detailed reason for rejection..."
                        rows="8"
                        className="form-control mb-3"
                      />
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-danger"
                          onClick={handleConfirmRejection}
                        >
                          Confirm Rejection
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={handleCancelRejection}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>)}


            </div>
          </div>
        </div>
      </div>
    );
  };

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


  const handleRejectionReasonChange = (e) => {
    rejectionReasonRef.current = e.target.value;
    setRejectionReason(e.target.value);
  };

  const handleMarkDropout = async (profile) => {
    try {
      if (!profile || !profile._id) {
        alert('No profile selected');
        return;
      }

      // Show confirmation dialog
      const confirmDropout = window.confirm('Do you really want to mark this profile as dropout?');
      if (!confirmDropout) {
        return;
      }

      // Check if backend URL and token exist
      if (!backendUrl) {
        alert('Backend URL not configured');
        return;
      }

      if (!token) {
        alert('Authentication token missing');
        return;
      }

      const dropoutReason = window.prompt('Enter the reason for dropout');
      if (!dropoutReason) {
        alert('Please enter the reason for dropout');
        return;
      }

      // Send PUT request to backend API to update status
      const response = await axios.put(
        `${backendUrl}/college/update/${profile._id}`,
        {
          dropout: true, // Set dropout status
          dropoutReason: dropoutReason
        },
        {
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('Profile marked as dropout successfully!');
        // Refresh the profile data
        await fetchProfileData();
      } else {
        console.error('API returned error:', response.data);
        alert(response.data.message || 'Failed to mark as dropout');
      }
    } catch (error) {
      console.error('Error marking as dropout:', error);
      alert('Failed to mark as dropout');
    }
  };

  return (
    <div className="container-fluid">
       <div className="row">
        <div className={isMobile ? 'col-12' : mainContentClass}>
          {/* Header */}
          <div
            className="content-blur-overlay"
            style={{
              position: 'fixed',
              top: 180,
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
          <div className="position-relative" >
            <nav className="" ref={navRef} style={{
              zIndex: 11, backgroundColor: `rgba(255, 255, 255, ${navbarOpacity})`, position: 'fixed', width: `${navWidth}`, backdropFilter: `blur(${blurIntensity}px)`,
              WebkitBackdropFilter: `blur(${blurIntensity}px)`,
              boxShadow: isScrolled
                ? '0 8px 32px 0 rgba(31, 38, 135, 0.25)'
                : '0 4px 25px 0 #0000001a', paddingBlock: '10px',
              transition: 'all 0.3s ease'
            }}>
              <div className="container-fluid py-2">
                <div className="row align-items-center justify-content-between">
                  <div className="col-md-6 d-md-block d-sm-none">
                    <div className="main-tabs-container" style={{ zIndex: 10, background: '#fff' }}>
                      <div className="btn-group" role="group" aria-label="eKYC Filters">
                        {ekycFilters.map((filter, index) => (
                          <div key={filter._id} className="position-relative d-inline-block me-2">
                            <button
                              className={`btn btn-sm ${activeCrmFilter === index ? 'btn-primary' : 'btn-outline-secondary'} position-relative`}
                              onClick={() => handleCrmFilterClick(filter, index)}
                            >
                              <i className={`fas ${filter._id === 'pendingEkyc' ? 'fa-clock' : filter._id === 'doneEkyc' ? 'fa-check-circle' : 'fa-list'} me-1`}></i>
                              {filter.name}
                              <span className={`ms-1 ${activeCrmFilter === index ? 'text-white' : 'text-dark'}`}>({filter.count})</span>
                            </button>
                            {filter.milestone && (
                              <span
                                className="bg-success d-flex align-items-center milestoneResponsive"
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'white',
                                  verticalAlign: 'middle',
                                  padding: '0.25em 0.5em',
                                  transform: 'translate(15%, -100%)',
                                  position: 'absolute',
                                  borderRadius: '3px',
                                  top: '-10px',
                                  left: '50%',
                                  zIndex: 1
                                }}
                                title={`Milestone: ${filter.milestone}`}
                              >
                                🚩 <span style={{ marginLeft: '4px', fontSize: '12px', whiteSpace: 'nowrap' }}>{filter.milestone}</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
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
                </div>
              </div>


            </nav>
          </div>
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
                            <div className="col-6">
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
          <div className="content-body" style={{ marginTop: `${navHeight + 10}px` }}>
            <section className="list-view">
              <div className='row'>
                <div>
                  <div className="col-12 rounded equal-height-2 coloumn-2">
                    <div className="card px-3">
                      <div className="row" id="crm-main-row">
                        {isLoadingProfiles && (
                          <div className="col-12 text-center py-5">
                            <div className="d-flex flex-column align-items-center">
                              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <h5 className="text-muted">Loading profiles...</h5>
                            </div>
                          </div>
                        )}
                        {!isLoadingProfiles && (
                          <>
                            {allProfiles && allProfiles.length > 0 ? (
                              allProfiles.map((profile, profileIndex) => (
                                <div className={`card-content transition-col mb-2`} key={profileIndex}>
                                  {/* Profile Header Card */}
                                  <div className="card border-0 shadow-sm mb-0 mt-2">
                                    <div className="card-body px-1 py-0 my-2">
                                      <div className="row align-items-center justify-content-between">
                                        <div className="col-md-7">
                                          <div className="d-flex align-items-center">
                                            <div className="form-check me-3">
                                              <input className="form-check-input" type="checkbox" />
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
                                            <div>
                                              <h6 className="mb-0 fw-bold">{profile._candidate?.name || 'Your Name'}</h6>
                                              <small className="text-muted">{profile._candidate?.mobile || 'Mobile Number'}</small>
                                            </div>
                                            <div style={{ marginLeft: '15px' }}>
                                              <button className="btn btn-outline-primary btn-sm border-0" title="Call" style={{ fontSize: '20px' }}>
                                                <i className="fas fa-phone"></i>
                                              </button>
                                              <img
                                                src="/Assets/public_assets/images/kyc_done.png"
                                                alt="ekyc done"
                                                style={{ width: 100, height: 'auto', display: profile.kyc === true || profile?.docCounts?.totalRequired === 0 ? 'inline-block' : 'none' }}
                                              />
                                              <img
                                                src="/Assets/public_assets/images/ekyc_pending.png"
                                                alt="ekyc pending"
                                                style={{ width: 100, height: 'auto', display: profile.kyc === false && profile?.docCounts?.totalRequired > 0 ? 'inline-block' : 'none' }}
                                              />
                                            </div>

                                            {profile.batch && (
                                              <div style={{ marginLeft: '15px', backgroundColor: 'green', padding: '5px', borderRadius: '5px' }}>

                                                <h5 style={{ fontWeight: 'bold', color: 'white' }}>Batch Assigned</h5>

                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="col-md-2 text-end d-md-none d-sm-block d-block">
                                          <div className="btn-group">
                                            <div style={{ position: "relative", display: "inline-block" }}>
                                              <button
                                                className="btn btn-sm btn-outline-secondary border-0"
                                                onClick={() => togglePopup(profileIndex)}
                                                aria-label="Options"
                                              >
                                                <i className="fas fa-ellipsis-v"></i>
                                              </button>

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
                                                  top: "28px",
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
                                                {(Boolean(profile.kyc) || profile?.docCounts?.totalRequired === 0) && (
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
                                                    onClick={() => handleMoveToAdmission(profile)}
                                                  >
                                                    Move to Admission
                                                  </button>)}
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
                                                  onClick={() => handleMarkDropout(profile)}
                                                >
                                                  Mark Dropout
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
                                                  // onClick={() => {
                                                  //   openleadHistoryPanel(profile);
                                                  //   console.log('selectedProfile', profile);
                                                  // }}
                                                  onClick={() => {
                                                    setShowPopup(null)
                                                    openPanel('leadHistory', profile)
                                                  }}
                                                >
                                                  History List
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
                                                  // onClick={() => {
                                                  //   openEditPanel(profile, 'SetFollowup');
                                                  //   console.log('selectedProfile', profile);
                                                  // }}
                                                  onClick={() => {
                                                    setShowPopup(null)
                                                    openPanel('SetFollowup', profile)
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
                                                    handleFetchCandidate(profile);
                                                    console.log('selectedProfile', profile);
                                                  }}
                                                >
                                                  Edit Profile
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
                                                    fontWeight: "600",
                                                    textWrap: "auto"
                                                  }}
                                                  onClick={() => {
                                                    setSelectedProfile(profile)
                                                    showSetPreVerification(true)
                                                    // Fetch existing question answers if any

                                                  }}
                                                >
                                                  Add Pre Verification
                                                </button>
                                              </div>
                                            </div>

                                            <button
                                              className="btn btn-sm btn-outline-secondary border-0"
                                              onClick={() => {
                                                setLeadDetailsVisible(profileIndex)
                                                setSelectedProfile(profile)
                                              }}
                                            >
                                              {leadDetailsVisible === profileIndex ? (
                                                <i className="fas fa-chevron-up"></i>
                                              ) : (
                                                <i className="fas fa-chevron-down"></i>
                                              )}
                                            </button>
                                          </div>
                                        </div>

                                        <div className="col-md-2 text-end d-md-block d-sm-none d-none">
                                          <div className="btn-group">
                                            <div style={{ position: "relative", display: "inline-block" }}>
                                              <button
                                                className="btn btn-sm btn-outline-secondary border-0"
                                                onClick={() => togglePopup(profileIndex)}
                                                aria-label="Options"
                                              >
                                                <i className="fas fa-ellipsis-v"></i>
                                              </button>

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
                                                  top: "28px",
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
                                                {(Boolean(profile.kyc) || profile?.docCounts?.totalRequired === 0) && (
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
                                                    onClick={() => handleMoveToAdmission(profile)}
                                                  >
                                                    Move to Admission
                                                  </button>)}
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
                                                  onClick={() => handleMarkDropout(profile)}
                                                >
                                                  Mark Dropout
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
                                                  // onClick={() => openleadHistoryPanel(profile)}
                                                  onClick={() => {
                                                    setShowPopup(null)
                                                    openPanel('leadHistory', profile)
                                                  }}

                                                >
                                                  History List
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
                                                  // onClick={() => {
                                                  //   openEditPanel(profile, 'SetFollowup');
                                                  //   console.log('selectedProfile', profile);
                                                  // }}
                                                  onClick={() => {
                                                    setShowPopup(null)
                                                    openPanel('SetFollowup', profile)
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
                                                    handleFetchCandidate(profile);
                                                    console.log('selectedProfile', profile);
                                                  }}
                                                >
                                                  Edit Profile
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
                                                    fontWeight: "600",
                                                    textWrap: "auto"
                                                  }}
                                                  onClick={() => {
                                                    setSelectedProfile(profile)
                                                    showSetPreVerification(true)
                                                    // Fetch existing question answers if any

                                                  }}
                                                >
                                                  Add Pre Verification
                                                </button>
                                              </div>
                                            </div>

                                            <button
                                              className="btn btn-sm btn-outline-secondary border-0"
                                              onClick={() => {
                                                toggleLeadDetails(profileIndex)
                                                setSelectedProfile(profile)
                                              }}
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
                                              onClick={() => handleTabClick(profileIndex, tabIndex)}
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
                                          {(activeTab[profileIndex] || 0) === 0 && (
                                            <div className="tab-pane active" id="lead-details">
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
                                                      <div className="info-value">{(profile.leadOwner && Array.isArray(profile.leadOwner) ? profile.leadOwner.join(', ') : profile.leadOwner) || 'N/A'}</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">COURSE / JOB NAME</div>
                                                      <div className="info-value">{profile._course?.name}</div>
                                                    </div>
                                                    <div className="info-group">
                                                      <div className="info-label">BATCH NAME</div>
                                                      <div className="info-value">{profile._course?.batchName || 'N/A'}</div>
                                                    </div>
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
                                                            <div className="info-value">{(profile.leadOwner && Array.isArray(profile.leadOwner) ? profile.leadOwner.join(', ') : profile.leadOwner) || 'N/A'}</div>
                                                          </div>
                                                          <div className="info-group">
                                                            <div className="info-label">COURSE / JOB NAME</div>
                                                            <div className="info-value">{profile._course?.name}</div>
                                                          </div>
                                                          <div className="info-group">
                                                            <div className="info-label">BATCH NAME</div>
                                                            <div className="info-value">{profile._course?.batchName || 'N/A'}</div>
                                                          </div>
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
                                                            <div className="info-label">LEAD MODIFICATION By</div>
                                                            <div className="info-value">Mar 21, 2025 3:32 PM</div>
                                                          </div>
                                                          <div className="col-xl- col-3">
                                                            <div className="info-group">
                                                              <div className="info-label">Counsellor Name</div>
                                                              <div className="info-value"> {profile.leadAssignment && profile.leadAssignment.length > 0 ? profile.leadAssignment[profile.leadAssignment.length - 1]?.counsellorName || 'N/A' : 'N/A'}</div>
                                                            </div>
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
                                                        <div className="col-xl-3 col-3">
                                                          <div className="info-group">
                                                            <div className="info-label">City</div>
                                                            <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.city || 'N/A'}</div>
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
                                                              {profile.followups.length > 0
                                                                ? (() => {
                                                                  const dateObj = new Date(profile.followups[profile.followups.length - 1].date);
                                                                  const datePart = dateObj.toLocaleDateString('en-GB', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                  }).replace(/ /g, '/');
                                                                  const timePart = dateObj.toLocaleTimeString('en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: true,
                                                                  });
                                                                  return `${datePart}, ${timePart}`;
                                                                })()
                                                                : 'N/A'}
                                                            </div>

                                                          </div>
                                                        </div>

                                                        <div className="col-xl- col-3">
                                                          <div className="info-group">
                                                            <div className="info-label">LEAD CREATION DATE</div>
                                                            <div className="info-value">{profile.createdAt ?
                                                              new Date(profile.createdAt).toLocaleString() : 'N/A'}</div>
                                                          </div>
                                                        </div>
                                                        <div className="col-xl- col-3">
                                                          <div className="info-group">
                                                            <div className="info-label">LEAD MODIFICATION DATE</div>
                                                            <div className="info-value">{profile.updatedAt ?
                                                              new Date(profile.updatedAt).toLocaleString() : 'N/A'}</div>
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
                                                            <div className="info-value"> {profile.leadAssignment[profile.leadAssignment.length - 1]?.counsellorName || 'N/A'}</div>
                                                          </div>
                                                        </div>
                                                        <div className="col-xl- col-3">
                                                          <div className="info-group">
                                                            <div className="info-label">LEAD OWNER</div>
                                                            <div className="info-value">{profile.registeredBy?.name || 'Self Registerd'}</div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Profile Tab */}
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
                                                      <h2 className="resume-section-title">Professional Summary <i className="fa fa-clock-o" aria-hidden="true" style={{ fontSize: "16px" }}></i> </h2>
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
                                                        profile._candidate?.experiences && profile._candidate.experiences.length > 0 && (
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

                                                      {profile._candidate?.qualifications && profile._candidate.qualifications.length > 0 && (
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
                                                      {profile._candidate?.personalInfo?.skills && profile._candidate.personalInfo.skills.length > 0 && (
                                                        <div className="resume-section">
                                                          <h2 className="resume-section-title">Skills</h2>
                                                          <div className="resume-skills-list">
                                                            {profile._candidate.personalInfo.skills.map((skill, index) => (
                                                              <div className="resume-skill-item" key={`resume-skill-${index}`}>
                                                                <div className="resume-skill-name">{skill.skillName || (typeof skill === 'string' ? skill : 'Skill')}</div>
                                                                {skill.skillPercent && (
                                                                  <div className="resume-skill-bar-container">
                                                                    <div
                                                                      className="resume-skill-bar"
                                                                      style={{ width: `${skill.skillPercent}%` }}
                                                                    ></div>
                                                                    <span className="resume-skill-percent">{skill.skillPercent}%</span>
                                                                  </div>
                                                                )}
                                                              </div>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      )}

                                                      {profile._candidate?.personalInfo?.languages && profile._candidate.personalInfo.languages.length > 0 && (
                                                        <div className="resume-section">
                                                          <h2 className="resume-section-title">Languages</h2>
                                                          <div className="resume-languages-list">
                                                            {profile._candidate.personalInfo.languages.map((lang, index) => (
                                                              <div className="resume-language-item" key={`resume-lang-${index}`}>
                                                                <div className="resume-language-name">{lang.name || lang.lname || (typeof lang === 'string' ? lang : 'Language')}</div>
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

                                                      {profile._candidate?.personalInfo?.certifications && profile._candidate.personalInfo.certifications.length > 0 && (
                                                        <div className="resume-section">
                                                          <h2 className="resume-section-title">Certifications</h2>
                                                          <ul className="resume-certifications-list">
                                                            {profile._candidate.personalInfo.certifications.map((cert, index) => (
                                                              <li key={`resume-cert-${index}`} className="resume-certification-item">
                                                                <strong>{cert.certificateName || cert.name || 'Certification'}</strong>
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

                                                      {profile._candidate?.personalInfo?.projects && profile._candidate.personalInfo.projects.length > 0 && (
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

                                                      {profile._candidate?.personalInfo?.interest && profile._candidate.personalInfo.interest.length > 0 && (
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
                                                        <th>Duration</th>
                                                        <th>Location</th>
                                                        <th>Status</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {experiences.map((job, index) => (
                                                        <tr key={index}>
                                                          <td>{index + 1}</td>
                                                          <td>{job.companyName}</td>
                                                          <td>{job.jobTitle}</td>
                                                          <td>
                                                            {job.from ? moment(job.from).format('MMM YYYY') : 'N/A'} -
                                                            {job.currentlyWorking ? 'Present' : job.to ? moment(job.to).format('MMM YYYY') : 'N/A'}
                                                          </td>
                                                          <td>Remote</td>
                                                          <td><span className="text-success">Completed</span></td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Course History Tab */}
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
                                                      {profile?._candidate?._appliedCourses && profile._candidate._appliedCourses.length > 0 ? (
                                                        profile._candidate._appliedCourses.map((course, index) => (
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
                                          {(activeTab[profileIndex] || 0) === 4 && (
                                            <div className="tab-pane active" id='studentsDocuments'>
                                              {(() => {
                                                const documentsToDisplay = profile.uploadedDocs || profile._candidate?.documents || [];
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
                                                                <h5 className='badge position-absolute'>{latestUpload?.status ? latestUpload.status : ''}</h5>
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
                                                                            <i className="fas fa-file-pdf" style={{ fontSize: '40px', color: '#dc3545' }}></i>
                                                                            <p style={{ fontSize: '12px', marginTop: '10px' }}>PDF Document</p>
                                                                          </div>
                                                                        );
                                                                      } else {
                                                                        return (
                                                                          <div className="document-preview-icon">
                                                                            <i className={`fas ${fileType === 'document' ? 'fa-file-word' :
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
                                                                        onClick={() => openDocumentModal(doc, profile)}
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
                                                                  <h4 className="document-title">{doc.Name || doc.name || `Document ${index + 1}`}</h4>
                                                                  <div className="document-actions">
                                                                    {((!latestUpload) || (latestUpload?.status || doc.status) === 'Rejected') ? (
                                                                      <button className="action-btn upload-btn" title="Upload Document" onClick={() => {
                                                                        setSelectedProfile(profile); // Set the current profile
                                                                        openUploadModal(doc);        // Open the upload modal
                                                                      }}>
                                                                        <i className="fas fa-cloud-upload-alt"></i>
                                                                        Upload
                                                                      </button>
                                                                    ) : ((latestUpload?.status || doc.status) === 'Pending') ? (
                                                                      <button
                                                                        className="action-btn verify-btn"
                                                                        onClick={() => openDocumentModal(doc, profile)}
                                                                        title="Verify Document"
                                                                      >
                                                                        <i className="fas fa-check"></i>
                                                                        VERIFY
                                                                      </button>
                                                                    ) : (
                                                                      <button
                                                                        className="action-btn view-btn"
                                                                        onClick={() => openDocumentModal(doc)}
                                                                        title="View Document"
                                                                      >
                                                                        <i className="fas fa-eye"></i>
                                                                        View
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

                                                    <DocumentModal />
                                                    <UploadModal />
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          )}

                                          {(activeTab[profileIndex] || 0) === 5 && (
                                            <div className="tab-pane active" id='preverification'>
                                              <div className="row">
                                                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-sm-0 mb-0 candidate-card">
                                                  <div className="card mt-1 mb-2">
                                                    <div className="col-xl-12 p-3">
                                                      <div className="row">
                                                        <div className="col-xl-8 col-lg-8 col-md-8 col-sm-8 col-8 my-auto">
                                                          <h4 className="card-title mb-0" id="wrapping-bottom">Pre Verification</h4>
                                                        </div>
                                                       
                                                      </div>
                                                    </div>

                                                    <div className="card-content">
                                                      {isLoadingAnswers ? (
                                                        <div className="text-center p-4">
                                                          <div className="spinner-border text-primary" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                          </div>
                                                          <p className="mt-2">Loading verification data...</p>
                                                        </div>
                                                      ) : questionAnswers.length > 0 ? (
                                                        // Show existing data
                                                        <div className="table-responsive">
                                                          <table className="verification-table">
                                                            <thead>
                                                              <tr>
                                                                <th>S.NO</th>
                                                                <th>Questions</th>
                                                                <th>Answer</th>
                                                              </tr>
                                                            </thead>
                                                            <tbody>
                                                              {questionAnswers.map((item, index) => (
                                                                <tr key={index}>
                                                                  <td className="s-no">{index + 1}</td>
                                                                  <td className="question">{item.question}</td>
                                                                  <td>
                                                                    <div className="answer-display">
                                                                      <span className={`badge ${item.answer === 'Yes' || item.answer === 'Selected' ? 'bg-success' :
                                                                        item.answer === 'No' || item.answer === 'Rejected' ? 'bg-danger' :
                                                                          'bg-warning'
                                                                        }`}>
                                                                        {item.answer}
                                                                      </span>
                                                                    </div>
                                                                  </td>
                                                                </tr>
                                                              ))}
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      ) : (
                                                        // Show message when no data
                                                        <div className="text-center p-4">
                                                          <div className="text-muted">
                                                            <i className="fas fa-info-circle fa-3x mb-3"></i>
                                                            <h5>No Pre-Verification Data Found</h5>
                                                            <p>Pre-verification questions have not been answered yet.</p>
                                                            
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                        </div>)
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="col-12 text-center py-5">
                                <div className="text-muted">
                                  <i className="fas fa-users fa-3x mb-3"></i>
                                  <h5>No profiles found</h5>
                                  <p>Try adjusting your filters or search criteria</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
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

                  {currentPage < totalPages - 2 && (
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



        {openModalId === selectedProfile?._id && (
          <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-scrollable m-0 mt-2">
              <div className="modal-content new-modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5">Candidate Profile</h1>
                  <button type="button" className="btn-close" onClick={() => { setOpenModalId(null); setSelectedProfile(null) }}></button>
                </div>
                <div className="modal-body">
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

      </div>

      {setPreVerification && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered  mt-2">
            <div className="modal-content p-0 w-100">
              <div className="modal-header">
                <h1 className="modal-title fs-5">Pre Verification</h1>
                <button type="button" className="btn-close" onClick={() => {
                  showSetPreVerification(false);
                  setQuestionFormData({}); // Reset form when modal is closed
                }}></button>
              </div>
              <div className="modal-body">

                {isLoadingQuestionAnswers && (
                  <div className="text-center mb-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading existing answers...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading existing answers...</p>
                  </div>
                )}

                <div className="table-responsive">

                  <table className="verification-table">
                    <thead>
                      <tr>
                        <th>S.NO</th>
                        <th>Questions</th>
                        <th>Answer</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="s-no">1</td>
                        <td className="question">Is the Candidate Aware of the Course</td>
                        <td>
                          <div className="checkbox-group">
                            <div className="select-option">
                              <select
                                name="q1_select"
                                className="form-select"
                                value={questionFormData.q1}
                                onChange={(e) => setQuestionFormData({ ...questionFormData, q1: e.target.value })}
                              >
                                <option value="">Select Option</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="Not sure">Not Sure</option>
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="s-no">2</td>
                        <td className="question">Is the Candidate Aware from the Course Curriculum</td>
                        <td>
                          <div className="checkbox-group">
                            <div className="select-option">
                              <select
                                name="q2_select"
                                className="form-select"
                                value={questionFormData.q2}
                                onChange={(e) => setQuestionFormData({ ...questionFormData, q2: e.target.value })}
                              >
                                <option value="">Select Option</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="Not sure">Not Sure</option>
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="s-no">3</td>
                        <td className="question">Currently Work Status</td>
                        <td>
                          <div className="checkbox-group">
                            <div className="select-option">
                              <select
                                name="q3_select"
                                className="form-select"
                                value={questionFormData.q3}
                                onChange={(e) => setQuestionFormData({ ...questionFormData, q3: e.target.value })}
                              >
                                <option value="">Select Option</option>
                                <option value="Working">Working</option>
                                <option value="Not Working">Not Working</option>
                                <option value="Not sure">Not Sure</option>
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="s-no">4</td>
                        <td className="question">Is Candidate Interested for Course</td>
                        <td>
                          <div className="checkbox-group">
                            <div className="select-option">
                              <select
                                name="q4_select"
                                className="form-select"
                                value={questionFormData.q4}
                                onChange={(e) => setQuestionFormData({ ...questionFormData, q4: e.target.value })}
                              >
                                <option value="">Select Option</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="Not sure">Not Sure</option>
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="s-no">5</td>
                        <td className="question">If we offered a job outside Odisha, would you be</td>
                        <td>
                          <div className="checkbox-group">
                            <div className="select-option">
                              <select
                                name="q5_select"
                                className="form-select"
                                value={questionFormData.q5}
                                onChange={(e) => setQuestionFormData({ ...questionFormData, q5: e.target.value })}
                              >
                                <option value="">Select Option</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="Not sure">Not Sure</option>
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="s-no">6</td>
                        <td className="question">Parent Confirmation</td>
                        <td>
                          <div className="checkbox-group">
                            <div className="select-option">
                              <select
                                name="q6_select"
                                className="form-select"
                                value={questionFormData.q6}
                                onChange={(e) => setQuestionFormData({ ...questionFormData, q6: e.target.value })}
                              >
                                <option value="">Select Option</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="Not sure">Not Sure</option>
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="s-no">7</td>
                        <td className="question">Recommendation from Placement</td>
                        <td>
                          <div className="checkbox-group">
                            <div className="select-option">
                              <select
                                name="q7_select"
                                className="form-select"
                                value={questionFormData.q7}
                                onChange={(e) => setQuestionFormData({ ...questionFormData, q7: e.target.value })}
                              >
                                <option value="">Select Option</option>
                                <option value="Selected">Selected</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                    <button
                      onClick={QuestionAnswer}
                      className="btn btn-primary"
                      disabled={isLoadingQuestionAnswers || isSubmittingAnswers}
                    >
                      {isSubmittingAnswers ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Submitting...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}







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
    max-height: calc(100vh - 220px); /* Adjust based on your header height */
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin; /* For Firefox */
    scrollbar-color: #cbd5e0 #f7fafc; /* For Firefox */
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
.react-calendar{
width:min-content !important;
height:min-content !important;
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
      <style>
        {

          `
          .table-container {
            overflow-x: auto;
            border-radius: 12px;
            background: #fafbfc;
            padding: 4px;
        }

        .verification-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
        }

        .verification-table thead {
            background: #f8f9fc;
        }

        .verification-table th {
            padding: 16px 20px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid #e5e7eb;
        }

        .verification-table td {
            padding: 5px;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: middle;
        }

        .verification-table tbody tr {
            transition: all 0.3s ease;
            position: relative;
        }

        .verification-table tbody tr:hover {
            background-color: #f9fafb;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .verification-table tbody tr:last-child td {
            border-bottom: none;
        }

        .s-no {
            font-weight: 600;
            color: #374151;
            font-size: 16px;
            width: 60px;
            text-align: center;
        }

        .question {
            color: #374151;
            font-size: 15px;
            font-weight: 500;
            max-width: 500px;
            line-height: 1.5;
        }

        /* Checkbox Group Styles */
        .checkbox-group {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }

        .checkbox-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            padding: 8px 16px;
            border-radius: 8px;
            transition: all 0.3s ease;
            user-select: none;
        }

        .checkbox-wrapper:hover {
            background-color: #f3f4f6;
        }

        /* Hide default radio button */
        .checkbox-wrapper input[type="radio"] {
            position: absolute;
            opacity: 0;
            cursor: pointer;
        }

        /* Custom checkbox design */
        .custom-checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid #d1d5db;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            position: relative;
        }

        /* Checkmark */
        .custom-checkbox::after {
            content: '';
            width: 5px;
            height: 10px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg) scale(0);
            transition: transform 0.3s ease;
        }

        /* Checked state */
        .checkbox-wrapper input[type="radio"]:checked ~ .custom-checkbox {
            background-color: #667eea;
            border-color: #667eea;
        }

        .checkbox-wrapper input[type="radio"]:checked ~ .custom-checkbox::after {
            transform: rotate(45deg) scale(1);
        }

        /* Label styling */
        .checkbox-label {
            font-size: 14px;
            font-weight: 500;
            color: #4b5563;
            transition: color 0.3s ease;
        }

        .checkbox-wrapper input[type="radio"]:checked ~ .checkbox-label {
            color: #667eea;
            font-weight: 600;
        }

        /* Color variations for different answer types */
        .checkbox-wrapper.positive input[type="radio"]:checked ~ .custom-checkbox {
            background-color: #22c55e;
            border-color: #22c55e;
        }

        .checkbox-wrapper.positive input[type="radio"]:checked ~ .checkbox-label {
            color: #15803d;
        }

        .checkbox-wrapper.negative input[type="radio"]:checked ~ .custom-checkbox {
            background-color: #ef4444;
            border-color: #ef4444;
        }

        .checkbox-wrapper.negative input[type="radio"]:checked ~ .checkbox-label {
            color: #dc2626;
        }

        .checkbox-wrapper.neutral input[type="radio"]:checked ~ .custom-checkbox {
            background-color: #eab308;
            border-color: #eab308;
        }

        .checkbox-wrapper.neutral input[type="radio"]:checked ~ .checkbox-label {
            color: #a16207;
        }


        /* Status badge */
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 12px;
        }

        .status-complete {
            background: #d1fae5;
            color: #065f46;
        }

        .status-incomplete {
            background: #fee2e2;
            color: #991b1b;
        }

        /* Responsive design */
        @media (max-width: 768px) {

            .verification-table {
                font-size: 14px;
            }

            .verification-table th,
            .verification-table td {
                padding: 12px;
            }

            .checkbox-group {
                flex-direction: column;
                gap: 12px;
            }


            .question {
                font-size: 14px;
            }
                      /* Animation */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }


        .verification-table tbody tr {
            animation: fadeIn 0.4s ease-out forwards;
            opacity: 0;
        }

        .verification-table tbody tr:nth-child(1) { animation-delay: 0.1s; }
        .verification-table tbody tr:nth-child(2) { animation-delay: 0.15s; }
        .verification-table tbody tr:nth-child(3) { animation-delay: 0.2s; }
        .verification-table tbody tr:nth-child(4) { animation-delay: 0.25s; }
        .verification-table tbody tr:nth-child(5) { animation-delay: 0.3s; }
        .verification-table tbody tr:nth-child(6) { animation-delay: 0.35s; }
        .verification-table tbody tr:nth-child(7) { animation-delay: 0.4s; }
          `
        }
      </style>
    </div>
  );
};

export default KYCManagement;
