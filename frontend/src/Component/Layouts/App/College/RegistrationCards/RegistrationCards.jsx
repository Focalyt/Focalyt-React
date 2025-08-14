import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import DatePicker from 'react-date-picker';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios';

const RegistrationCards = () => {


    const candidateRef = useRef();

    const fetchProfile = (id) => {
      if (candidateRef.current) {
        console.log('start fetching',id)
        candidateRef.current.fetchProfile(id);
      }
    };
  
  
    const handleSaveCV = async () => {
      if (candidateRef.current) {
        const result = await candidateRef.current.handleSaveCV();
        console.log(result,'result')
        if (result === true) {
          setOpenModalId(null) ; setSelectedProfile(null)
        }
      }
    };
  
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;
  
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
    const [allProfilesData, setAllProfilesData] = useState([]);
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
    const [concernPersons, setConcernPersons] = useState([]);
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
  
  
  
  
    const handleCheckboxChange = (profile, checked) => {
      if (checked) {
        setSelectedProfiles(prev => [...prev, profile._id]);
      } else {
        setSelectedProfiles(prev => prev.filter(id => id !== profile._id));
      }
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
        formData.append('doc', selectedDocumentForUpload.docsId);
  
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
  
      document.body?.classNameList.add('no-scroll');
    };
  
    const closeDocumentModal = () => {
      setShowDocumentModal(false);
      setSelectedDocument(null);
  
      setIsNewModalOpen(false);
      // // Only reset when actually closing modal
      setDocumentZoom(1);
      setDocumentRotation(0);
    };
  
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
  
  
    const updateDocumentStatus = (uploadId, status) => {
      // In real app, this would make an API call
      console.log(`Updating document ${uploadId} to ${status}`);
      if (status === 'Rejected' && !rejectionReason.trim()) {
        alert('Please provide a rejection reason');
        return;
      }
      alert(`Document ${status} successfully!`);
      closeDocumentModal();
    };
  
    const getStatusBadgeClass = (status) => {
      switch (status?.toLowerCase()) {
        case 'pending': return 'text-dark';
        case 'verified': return 'text-sucess';
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
  
  
    // vertical checkboxes option 
  
    const sectorOptions = [
      { label: "Tourism and Hospitality", value: "Tourism and Hospitality" },
      { label: "Information Technology", value: "Information Technology" },
      { label: "Healthcare", value: "Healthcare" },
      { label: "Finance", value: "Finance" }
    ];
    const verticalOptions = [
      { label: "Vertical 1", value: "Vertical 1" },
      { label: "Vertical 2", value: "Vertical 2" },
      { label: "Vertical 3", value: "Vertical 3" },
      { label: "Vertical 4", value: "Vertical 4" }
    ];
  
    const courseOptions = [
      { label: "Course 1", value: "Course 1" },
      { label: "Course 2", value: "Course 2" },
      { label: "Course 3", value: "Course 3" },
      { label: "Course 4", value: "Course 4" }
    ];
  
    const centerOptions = [
      { label: "Center 1", value: "Center 1" },
      { label: "Center 2", value: "Center 2" },
      { label: "Center 3", value: "Center 3" },
      { label: "Center 4", value: "Center 4" }
    ];
  
    const counselorOptions = [
      { label: "Counselor 1", value: "Counselor 1" },
      { label: "Counselor 2", value: "Counselor 2" },
      { label: "Counselor 3", value: "Counselor 3" },
      { label: "Counselor 4", value: "Counselor 4" }
    ];
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
      }
    });
  
    // Dropdown open state
    const [dropdownStates, setDropdownStates] = useState({
      projects: false,
      verticals: false,
      course: false,
      center: false,
      counselor: false,
      sector: false
    });
  
    const handleCriteriaChange = (criteria, values) => {
      setFormData((prevState) => ({
        ...prevState,
        [criteria]: {
          type: "includes",
          values: values
        }
      }));
    };
  
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
  
    // Calculate total selected filters
    const totalSelected = Object.values(formData).reduce((total, filter) => total + filter.values.length, 0);
  
    // Document Modal Component
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
              height: isSmall ? '100%' : '100px',
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
                height: isSmall ? '100%' : '100px',
                objectFit: 'cover',
                borderRadius: '4px',
                border: '1px solid #dee2e6',
                cursor: 'pointer'
              }}
              onClick={() => {
                if (isSmall) {
                  // Set this upload as the current preview
                  setCurrentPreviewUpload(upload);
                }
              }}
            />
          );
        } else if (fileType === 'pdf') {
          return (
            <div style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
              <iframe
                src={fileUrl + '#navpanes=0&toolbar=0'}
                className={`document-thumbnail pdf-thumbnail ${isSmall ? 'small' : ''}`}
                style={{
                  width: isSmall ? '100%' : '150px',
                  height: isSmall ? '100%' : '100px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  pointerEvents: 'none',
                  transformOrigin: 'top left',
                  overflow: 'hidden'
                }}
                title="PDF Thumbnail"
                onClick={() => {
                  if (isSmall) {
                    setCurrentPreviewUpload(upload);
                  }
                }}
              />
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc3545',
                fontSize: isSmall ? '10px' : '12px',
                fontWeight: 'bold',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
                onClick={() => {
                  if (isSmall) {
                    setCurrentPreviewUpload(upload);
                  }
                }}>
                PDF
              </div>
            </div>
          );
        } else {
          // For other document types, try to use iframe as well
          return (
            <div style={{ position: 'relative' }}>
              <iframe
                src={fileUrl + '#navpanes=0&toolbar=0'}
                className={`document-thumbnail ${isSmall ? 'small' : ''}`}
                style={{
                  width: isSmall ? '100%' : '150px',
                  height: isSmall ? '100%' : '100px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  pointerEvents: 'none',
                  backgroundColor: '#f8f9fa'
                }}
                title="Document Thumbnail"
                onClick={() => {
                  if (isSmall) {
                    setCurrentPreviewUpload(upload);
                  }
                }}
              />
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
                fontSize: isSmall ? '16px' : '24px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
                onClick={() => {
                  if (isSmall) {
                    setCurrentPreviewUpload(upload);
                  }
                }}>
                {fileType === 'document' ? '📄' :
                  fileType === 'spreadsheet' ? '📊' : '📁'}
              </div>
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
                <div className="document-preview-container">
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
                                <div className="pdf-viewer" style={{ width: '100%', height: '500px' }}>
                                  <iframe
                                    src={fileUrl + '#navpanes=0&toolbar=0'}
                                    width="100%"
                                    height="100%"
                                    style={{
                                      border: 'none',
                                      transform: `scale(${documentZoom})`,
                                      transformOrigin: 'center center',
                                      transition: 'transform 0.3s ease',
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
                                fontSize: '25px',
                                padding: '4px 8px'
                              }}>
                                {upload.status}
                              </span>
                            </div>
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
  
                  <button
                    className="action-btn upload-btn"
                    title="Upload Document"
                    onClick={() => {
                      openUploadModal(selectedDocument);   // Just pass the selectedDocument
                    }}
                  >
                    <i className="fas fa-cloud-upload-alt"></i>
                    Upload
                  </button>
  
                </div>
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
  
  
    const [subStatuses, setSubStatuses] = useState([
  
  
    ]);
  
    const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  
  
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
      if (seletectedStatus) {
        fetchSubStatus()
      }
    }, [seletectedStatus]);
  
    useEffect(() => {
      console.log('seletectedSubStatus', seletectedSubStatus)
  
    }, [seletectedSubStatus]);
  
  
    //Advance filter
  
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
  
      // Apply filters immediately
      setTimeout(() => applyFilters(newFilterData), 100);
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
      setTimeout(() => applyFilters(newFilterData), 100);
    };
    const handleDateChange = (date, fieldName) => {
      setFilterData(prev => ({
        ...prev,
        [fieldName]: date
      }));
  
      // Auto-apply filters after short delay
      setTimeout(() => {
        const newFilterData = {
          ...filterData,
          [fieldName]: date
        };
        applyFilters(newFilterData);
      }, 100);
    };
  
    // 4. Clear date functions
    const clearCreatedDate = () => {
      setFilterData(prev => ({
        ...prev,
        createdFromDate: null,
        createdToDate: null
      }));
      setTimeout(() => applyFilters({
        ...filterData,
        createdFromDate: null,
        createdToDate: null
      }), 100);
    };
  
    const clearModifiedDate = () => {
      setFilterData(prev => ({
        ...prev,
        modifiedFromDate: null,
        modifiedToDate: null
      }));
      setTimeout(() => applyFilters({
        ...filterData,
        modifiedFromDate: null,
        modifiedToDate: null
      }), 100);
    };
  
    const clearNextActionDate = () => {
      setFilterData(prev => ({
        ...prev,
        nextActionFromDate: null,
        nextActionToDate: null
      }));
      setTimeout(() => applyFilters({
        ...filterData,
        nextActionFromDate: null,
        nextActionToDate: null
      }), 100);
    };
    // Add after existing functions
  
  
    const handleSearch = (searchTerm) => {
      if (!searchTerm.trim()) {
        applyFilters();
        return;
      }
  
      const searchFiltered = allProfilesData.filter(profile => {
        try {
          const name = profile._candidate?.name ? String(profile._candidate.name).toLowerCase() : '';
          const mobile = profile._candidate?.mobile ? String(profile._candidate.mobile).toLowerCase() : '';
          const email = profile._candidate?.email ? String(profile._candidate.email).toLowerCase() : '';
          const searchLower = searchTerm.toLowerCase();
  
          return name.includes(searchLower) ||
            mobile.includes(searchLower) ||
            email.includes(searchLower);
        } catch (error) {
          console.error('Search filter error for profile:', profile, error);
          return false;
        }
      });
  
      setAllProfiles(searchFiltered);
      setAllProfilesData(searchFiltered)
      updateCrmFiltersCounts(searchFiltered)
  
    };
  
    const applyFilters = (filters = filterData) => {
      console.log('Applying filters with data:', filters);
  
      let filtered = [...allProfilesData];
  
      try {
        // Search filter
        if (filters.name && filters.name.trim()) {
          const searchTerm = filters.name.toLowerCase();
          filtered = filtered.filter(profile => {
            try {
              const name = profile._candidate?.name ? String(profile._candidate.name).toLowerCase() : '';
              const mobile = profile._candidate?.mobile ? String(profile._candidate.mobile).toLowerCase() : '';
              const email = profile._candidate?.email ? String(profile._candidate.email).toLowerCase() : '';
  
              return name.includes(searchTerm) ||
                mobile.includes(searchTerm) ||
                email.includes(searchTerm);
            } catch (error) {
              return false;
            }
          });
        }
  
        // Course type filter
        if (filters.courseType) {
          filtered = filtered.filter(profile => {
            try {
              const courseType = profile._course?.courseType ? String(profile._course.courseType).toLowerCase() : '';
              return courseType === filters.courseType.toLowerCase();
            } catch (error) {
              return false;
            }
          });
        }
  
        // Lead status filter
        if (filters.leadStatus) {
          filtered = filtered.filter(profile =>
            profile._leadStatus?._id === filters.leadStatus
          );
        }
  
        // Status filter
        if (filters.status && filters.status !== 'true') {
          filtered = filtered.filter(profile =>
            profile._leadStatus?._id === filters.status
          );
        }
  
        // Sector filter
        if (filters.sector) {
          filtered = filtered.filter(profile => {
            try {
              const sectors = profile._course?.sectors ? String(profile._course.sectors).toLowerCase() : '';
              return sectors === filters.sector.toLowerCase();
            } catch (error) {
              return false;
            }
          });
        }
  
        // CREATED DATE filter
        if (filters.createdFromDate || filters.createdToDate) {
          filtered = filtered.filter(profile => {
            try {
              if (!profile.createdAt) return false;
  
              const profileDate = new Date(profile.createdAt);
  
              // From date check
              if (filters.createdFromDate) {
                const fromDate = new Date(filters.createdFromDate);
                fromDate.setHours(0, 0, 0, 0);
                if (profileDate < fromDate) return false;
              }
  
              // To date check
              if (filters.createdToDate) {
                const toDate = new Date(filters.createdToDate);
                toDate.setHours(23, 59, 59, 999);
                if (profileDate > toDate) return false;
              }
  
              return true;
            } catch (error) {
              return false;
            }
          });
        }
  
        // MODIFIED DATE filter
        if (filters.modifiedFromDate || filters.modifiedToDate) {
          filtered = filtered.filter(profile => {
            try {
              if (!profile.updatedAt) return false;
  
              const profileDate = new Date(profile.updatedAt);
  
              // From date check
              if (filters.modifiedFromDate) {
                const fromDate = new Date(filters.modifiedFromDate);
                fromDate.setHours(0, 0, 0, 0);
                if (profileDate < fromDate) return false;
              }
  
              // To date check
              if (filters.modifiedToDate) {
                const toDate = new Date(filters.modifiedToDate);
                toDate.setHours(23, 59, 59, 999);
                if (profileDate > toDate) return false;
              }
  
              return true;
            } catch (error) {
              return false;
            }
          });
        }
  
        // NEXT ACTION DATE filter
        if (filters.nextActionFromDate || filters.nextActionToDate) {
          filtered = filtered.filter(profile => {
            try {
              if (!profile.followupDate) return false;
  
              const profileDate = new Date(profile.followupDate);
  
              // From date check
              if (filters.nextActionFromDate) {
                const fromDate = new Date(filters.nextActionFromDate);
                fromDate.setHours(0, 0, 0, 0);
                if (profileDate < fromDate) return false;
              }
  
              // To date check
              if (filters.nextActionToDate) {
                const toDate = new Date(filters.nextActionToDate);
                toDate.setHours(23, 59, 59, 999);
                if (profileDate > toDate) return false;
              }
  
              return true;
            } catch (error) {
              return false;
            }
          });
        }
  
        console.log('Filter results:', filtered.length, 'out of', allProfilesData.length);
        updateCrmFiltersCounts(filtered);
        setAllProfiles(filtered);
  
      } catch (error) {
        console.error('Filter error:', error);
        setAllProfiles(allProfilesData);
      }
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
      return '🎯'; // default icon
    };
  
  
    //
    const clearAllFilters = () => {
      setFilterData({
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
      });
      setAllProfiles(allProfilesData);
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
        
        
        if(profile?._course?.center || profile?._course?.center?.length > 0){
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
        const response = await axios.get(`${backendUrl}/college/status/${seletectedStatus}/substatus`, {
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
  
    const handleUpdateStatus = async () => {
      console.log('Function called');
  
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
            closePanel();
          } else {
            console.error('API returned error:', response.data);
            alert(response.data.message || 'Failed to update status');
          }
  
        }
        if (showPanel === 'followUp') {
  
  
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
            closePanel();
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
  
  
  
  
    const [user, setUser] = useState({
      image: '',
      name: 'John Doe'
    });
  
    // Inside CRMDashboard component:
  
    useEffect(() => {
      fetchProfileData();
    }, []);
  
    useEffect(() => {
      fetchProfileData();
    }, [currentPage]);
  
  
  
    const fetchProfileData = async () => {
      try {
  
        if (!token) {
          console.warn('No token found in session storage.');
          return;
        }
  
        // Replace with your actual profile API endpoint
        const response = await axios.get(`${backendUrl}/college/appliedCandidates?page=${currentPage}`, {
          headers: {
            'x-auth': token,
          },
        });
        console.log('Backend profile data:', response.data);
        if (response.data.success && response.data.data) {
          const data = response.data; // create array
          setAllProfilesData(data.data)
  
  
          if (activeCrmFilter == 0) {
  
            setAllProfiles(data.data);
          }
          else {
  
            const id = crmFilters[activeCrmFilter]._id
            const filteredProfiles = data.data.filter(profile => {
              return profile._leadStatus && profile._leadStatus._id === id;
            });
            setAllProfiles(filteredProfiles);
  
  
          }
          setTotalPages(data.totalPages);
          setPageSize(data.limit)
  
  
  
        } else {
          console.error('Failed to fetch profile data', response.data.message);
        }
        updateCrmFiltersCounts(response.data.allData);
  
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
  
  
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
  
    // यह logs add करें अपने code में
    useEffect(() => {
      console.log('Current State:', {
        totalProfiles: allProfiles.length,
        totalPages: totalPages,
        currentPage: currentPage,
        pageSize: pageSize
      });
    }, [allProfiles, totalPages, currentPage, pageSize]);
  
    const handleCrmFilterClick = (index) => {
  
      if (index === 0) {
        // Agar "all" filter select hua hai to pura data set kar do
        setAllProfiles(allProfilesData);
  
        setActiveCrmFilter(index)
  
      } else {
        // Filter karo jisme leadStatus._id match ho
  
        const id = crmFilters[index]._id
        console.log(id, 'id')
        console.log(allProfilesData, 'allProfilesData')
        const filteredProfiles = allProfilesData.filter(profile => {
          return profile._leadStatus && profile._leadStatus._id === id;
        });
  
        console.log(filteredProfiles, 'filteredProfiles')
  
  
        setActiveCrmFilter(index)
        setAllProfiles(filteredProfiles);
        // Calculate total pages
  
  
      }
    };
  
  
    const handleTabClick = (profileIndex, tabIndex) => {
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
  
        // Apply search if there's a search term
        if (newFilterData.name) {
          handleSearch(newFilterData.name);
        } else {
          applyFilters(newFilterData);
        }
      } catch (error) {
        console.error('Filter change error:', error);
      }
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
  
  
  
    const openRefferPanel = async (profile = null, panel) => {
      console.log('panel', panel);
  
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
      }
  
  
      const fetchConcernPersons = async () => {
        const response = await axios.get(`${backendUrl}/college/refer-leads`, {
          headers: {
            'x-auth': token,
          },
        });
        console.log(userData, 'userData');
        let concernPersons = [];
        await response.data.concernPerson.map(person => {
          if (person._id._id.toString() !== userData._id.toString()) {
            concernPersons.push(person);
          }
        });
        setConcernPersons(concernPersons);
      }
      fetchConcernPersons();
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
    
  
  
    const handleConcernPersonChange = (e) => {
      console.log(e.target.value, 'e.target.value');
      setSelectedConcernPerson(e.target.value);
    }
  
    const handleReferLead = async () => {
      console.log(selectedConcernPerson, 'selectedConcernPerson');
      try {
        const response = await axios.post(`${backendUrl}/college/refer-leads`, {
          counselorId: selectedConcernPerson,
          appliedCourseId: selectedProfile._id
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
        closePanel();
        closePanel();
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
  
  
              {((seletectedSubStatus && seletectedSubStatus.hasFollowup && (showPanel !== 'bulkstatuschange')) || (showPanel === 'followUp') || (showPanel !== 'bulkstatuschange')) && (
  
                <div className="row mb-1">
                  <div className="col-6">
                    <label htmlFor="nextActionDate" className="form-label small fw-medium text-dark">
                      Next Action Date <span className="text-danger">*</span>
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
                        className="form-control border-0  bgcolor"
                        onChange={setFollowupDate}
  
                        value={followupDate}
                        format="dd/MM/yyyy"
                        minDate={today}   // Isse past dates disable ho jayengi
  
                      />
                    </div>
                  </div>
  
                  <div className="col-6">
                    <label htmlFor="actionTime" className="form-label small fw-medium text-dark">
                      Time <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="time"
                        className="form-control border-0  bgcolor"
                        id="actionTime"
                        onChange={handleTimeChange}
                        value={followupTime}
  
  
                        style={{ backgroundColor: '#f1f2f6', height: '42px', paddingInline: '10px' }}
                      />
                    </div>
                  </div>
                </div>)}
  
              {((seletectedSubStatus && seletectedSubStatus.hasRemarks) || (setShowPanel === 'followUp')) && (
  
                <div className="mb-1">
                  <label htmlFor="comment" className="form-label small fw-medium text-dark">Comment</label>
                  <textarea
                    className="form-control border-0 bgcolor"
                    id="comment"
                    rows="4"
                    onChange={(e) => setRemarks(e.target.value)}
  
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
                  type="submit"
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
        ):null;
      }
  
      return (showPanel === 'editPanel') || (showPanel === 'followUp') || (showPanel === 'bulkstatuschange') ? (
        <div className="col-12 transition-col" id="editFollowupPanel">
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
                        {concernPersons.map((counselor, index) => (
                          <option key={index} value={counselor._id._id}>{counselor._id.name}</option>))}
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
                  onClick={handleReferLead}
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
        return  (showPanel === 'Reffer') || (showPanel === 'RefferAllLeads') ? (
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
  
  
    // Render WhatsApp Panel (Desktop Sidebar or Mobile Modal)
    const renderWhatsAppPanel = () => {
      const panelContent = (
        <div className="whatsapp-chat right-side-panel">
          <section className="topbar-container">
            <div className="left-topbar">
              <div className="img-container">
                <div className="small-avatar" title="Ram Ruhela">RR</div>
              </div>
              <div className="flex-column">
                <span title="Ram Ruhela" className="lead-name">Ram Ruhela</span><br />
                <span className="selected-number">Primary: 918875426236</span>
              </div>
            </div>
            <div className="right-topbar">
              <a className="margin-horizontal-4" href="#">
                <img src="/Assets/public_assets/images/whatapp/refresh.svg" alt="whatsAppAccount" title="whatsAppChatList.title.whatsAppAccount" />
              </a>
              <a className="margin-horizontal-5" href="#">
                <img src="/Assets/public_assets/images/whatapp/refresh.svg" alt="refresh" title="refresh" />
              </a>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={closePanel}
                title="Close WhatsApp"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </section>
  
          <section className="chat-view">
            <ul className="chat-container" id="messageList">
              <div className="counselor-msg-container">
                <div className="chatgroupdate"><span>03/26/2025</span></div>
                <div className="counselor-msg-0 counselor-msg macro">
                  <div className="text text-r">
                    <div>
                      <span className="message-header-name student-messages">Anjali</span><br />
                      <div className="d-flex">
                        <pre className="text-message">
                          <br /><span><span style={{ fontSize: '16px' }}>🎯</span>&nbsp;फ्री&nbsp;होटल&nbsp;मैनेजमेंट&nbsp;कोर्स&nbsp;-&nbsp;सुनहरा&nbsp;मौका&nbsp;<span style={{ fontSize: '16px' }}>🎯</span><br /><br />अब&nbsp;बने&nbsp;Guest&nbsp;Service&nbsp;Executive&nbsp;(Front&nbsp;Office)&nbsp;और&nbsp;होटल&nbsp;इंडस्ट्री&nbsp;में&nbsp;पाएं&nbsp;शानदार&nbsp;करियर&nbsp;की&nbsp;शुरुआत।<br /><br /><span style={{ fontSize: '16px' }}>✅</span>&nbsp;आयु&nbsp;सीमा:&nbsp;18&nbsp;से&nbsp;29&nbsp;वर्ष<br /><span style={{ fontSize: '16px' }}>✅</span>&nbsp;योग्यता:&nbsp;12वीं&nbsp;पास<br /><span style={{ fontSize: '16px' }}>✅</span>&nbsp;कोर्स&nbsp;अवधि:&nbsp;3&nbsp;से&nbsp;4&nbsp;महीने<br /><span style={{ fontSize: '16px' }}>✅</span>&nbsp;100%&nbsp;जॉब&nbsp;प्लेसमेंट&nbsp;गारंटी</span>
                          <span className="messageTime text-message-time" id="time_0" style={{ marginTop: '12px' }}>
                            12:31 PM
                            <img src="/Assets/public_assets/images/whatapp/checked.png" style={{ marginLeft: '5px', marginBottom: '2px', width: '15px' }} alt="tick" />
                          </span>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
  
              <div className="counselor-msg-container">
                <div className="chatgroupdate"><span>04/07/2025</span></div>
                <div className="counselor-msg-1 counselor-msg macro">
                  <div className="text text-r">
                    <div className="d-flex">
                      <pre className="text-message">
                        <span className="message-header-name student-messages">Mr. Parveen Bansal</span><br />
                        <span><h6>Hello</h6></span>
                        <span className="messageTime text-message-time" id="time_1" style={{ marginTop: '7px' }}>
                          04:28 PM
                          <img src="/Assets/public_assets/images/whatapp/checked.png" style={{ marginLeft: '5px', marginBottom: '2px', width: '15px' }} alt="tick" />
                        </span>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
  
              <div className="sessionExpiredMsg">
                <span>Your session has come to end. It will start once you receive a WhatsApp from the lead.<br />Meanwhile, you can send a Business Initiated Messages (BIM).</span>
              </div>
            </ul>
          </section>
  
          <section className="footer-container">
            <div className="footer-box">
              <div className="message-container" style={{ height: '36px', maxHeight: '128px' }}>
                <textarea
                  placeholder="Choose a template"
                  className="disabled-style message-input"
                  disabled
                  rows="1"
                  id="message-input"
                  style={{ height: '36px', maxHeight: '128px', paddingTop: '8px', paddingBottom: '5px', marginBottom: '5px' }}
                ></textarea>
              </div>
              <hr className="divider" />
              <div className="message-container-input">
                <div className="left-footer">
                  <span className="disabled-style margin-bottom-5">
                    <a className="margin-right-10" href="#" title="Emoji">
                      <img src="/Assets/public_assets/images/whatapp/refresh.svg" alt="Emoji" />
                    </a>
                  </span>
                  <span className="disabled-style">
                    <input name="fileUpload" type="file" title="Attach File" className="fileUploadIcon" />
                  </span>
                  <span className="input-template">
                    <a title="Whatsapp Template">
                      <img src="/Assets/public_assets/images/whatapp/orange-template-whatsapp.svg" alt="Whatsapp Template" />
                    </a>
                  </span>
                </div>
                <div className="right-footer">
                  <span className="disabled-style">
                    <a className="send-button" href="#" title="Send">
                      <img className="send-img" src="/Assets/public_assets/images/whatapp/paper-plane.svg" alt="Send" />
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      );
  
      if (isMobile) {
        return showPanel === 'whatsapp' ? (
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
        ): null ;
      }
  
      return showPanel === 'whatsapp' ? (
        <div className="col-12 transition-col" id="whatsappPanel">
          {panelContent}
        </div>
      ) : null;
    };
  
    // Render Edit Panel (Desktop Sidebar or Mobile Modal)
    const renderLeadHistoryPanel = () => {
      const panelContent = (
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
              {selectedProfile?.logs && Array.isArray(selectedProfile.logs) && selectedProfile.logs.length > 0 ? (
                <div className="timeline">
                  {selectedProfile.logs.map((log, index) => (
                    <div key={index} className="timeline-item mb-4">
                      <div className="timeline-marker">
                        <div className="timeline-marker-icon">
                          <i className="fas fa-circle text-primary" style={{ fontSize: '8px' }}></i>
                        </div>
                        {index !== selectedProfile.logs.length - 1 && (
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
          </div>
        </div>
      );
  
      if (isMobile) {
        return showPanel === 'leadHistory'? (
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
  
      return showPanel === 'leadHistory'? (
        <div className="col-12 transition-col" id="leadHistoryPanel" style={{ height: '80vh' }}>
          {panelContent}
        </div>
      ) : null;
    };
  
    const updateCrmFiltersCounts = (data = allProfilesData) => {
      setCrmFilters(prevFilters => {
        return prevFilters.map(filter => {
          if (filter._id === 'all') {
            return { ...filter, count: data.length };
          }
          // Count profiles matching this filter's _id (leadStatus)
          const count = data.filter(profile => profile._leadStatus && profile._leadStatus._id === filter._id).length;
          return { ...filter, count };
        });
      });
    };



  return (
    <>
    <section className="list-view">
              
              <div className='row'>
                <div>
                  <div className="col-12 rounded equal-height-2 coloumn-2">
                    <div className="card px-3">
                      <div className="row" id="crm-main-row">

                        {allProfiles.map((profile, profileIndex) => (
                          <div className={`card-content transition-col mb-2`} key={profileIndex}>

                            {/* Profile Header Card */}
                            <div className="card border-0 shadow-sm mb-0 mt-2">
                              <div className="card-body px-1 py-0 my-2">
                                <div className="row align-items-center">
                                  <div className="col-md-6">
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
                                      <div>
                                        <h6 className="mb-0 fw-bold">{profile._candidate?.name || 'Your Name'}</h6>
                                        <small className="text-muted">{profile._candidate?.mobile || 'Mobile Number'}</small>
                                      </div>
                                      <div style={{ marginLeft: '15px' }}>
                                        <button className="btn btn-outline-primary btn-sm border-0" title="Call" style={{ fontSize: '20px' }}>
                                          <a href={`tel:${profile._candidate?.mobile}`} target="_blank" rel="noopener noreferrer">
                                            <i className="fas fa-phone"></i>
                                          </a>
                                        </button>
                                        <a
                                          className="btn btn-outline-success btn-sm border-0"
                                          href={`https://wa.me/${profile._candidate?.mobile}`}
                                          style={{ fontSize: '20px' }}
                                          title="WhatsApp"
                                          target="_blank"
                                        >
                                          <i className="fab fa-whatsapp"></i>
                                        </a>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-md-4">
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
                                              zIndex: 999,
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
                                            zIndex: 1000,
                                            transform: showPopup === profileIndex ? "translateX(-70px)" : "translateX(100%)",
                                            transition: "transform 0.3s ease-in-out",
                                            pointerEvents: showPopup ? "auto" : "none",
                                            display: showPopup === profileIndex ? "block" : "none"
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
                                              openRefferPanel(profile, 'Reffer');
                                              console.log('selectedProfile', profile);
                                            }}
                                          >
                                            Reffer
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
                                            onClick={() => openleadHistoryPanel(profile)}
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
                                            onClick={() => {
                                              openRefferPanel(profile, 'SetFollowup');
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
                                              zIndex: 999,
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
                                            zIndex: 1000,
                                            transform: showPopup === profileIndex ? "translateX(-70px)" : "translateX(100%)",
                                            transition: "transform 0.3s ease-in-out",
                                            pointerEvents: showPopup === profileIndex ? "auto" : "none",
                                            display: showPopup === profileIndex ? "block" : "none"
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
                                              setShowPopup(null)
                                              openRefferPanel(profile, 'Reffer');
                                              console.log('selectedProfile', profile);
                                            }}
                                          >
                                            Reffer
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
                                            onClick={() => openleadHistoryPanel(profile)}
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
                                            }}
                                          >
                                            Profile Edit
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
                            {leadDetailsVisible === profileIndex && (
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

                                {/* Tab Content */}
                                <div className="tab-content">
                                  {/* Lead Details Tab */}
                                  {(activeTab[profileIndex] || 0) === 0 && (
                                    <div className="tab-pane active" id="lead-details">
                                      <div className="card-body">
                                        <div className="row">
                                          <div className="col-md-4">
                                            <div className="info-group mb-2">
                                              <strong>LEAD AGE:</strong> {profile.createdAt ?
                                                Math.floor((new Date() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24)) + ' Days'
                                                : 'N/A'}
                                            </div>
                                            <div className="info-group mb-2">
                                              <strong>Lead Owner:</strong> {profile.leadOwner?.join(', ') || 'N/A'}
                                            </div>
                                            <div className="info-group mb-2">
                                              <strong>COURSE / JOB NAME:</strong> {profile._course?.name}
                                            </div>
                                          </div>
                                          <div className="col-md-4">
                                            <div className="info-group mb-2">
                                              <strong>BATCH NAME:</strong> {profile._course?.batchName || 'N/A'}
                                            </div>
                                            <div className="info-group mb-2">
                                              <strong>TYPE OF PROJECT:</strong> {profile._course?.typeOfProject}
                                            </div>
                                            <div className="info-group mb-2">
                                              <strong>PROJECT:</strong> {profile._course?.projectName || 'N/A'}
                                            </div>
                                          </div>
                                          <div className="col-md-4">
                                            <div className="info-group mb-2">
                                              <strong>SECTOR:</strong> {profile.sector}
                                            </div>
                                            <div className="info-group mb-2">
                                              <strong>STATE:</strong> {profile._candidate?.personalInfo?.currentAddress?.state || 'N/A'}
                                            </div>
                                            <div className="info-group mb-2">
                                              <strong>CITY:</strong> {profile._candidate?.personalInfo?.currentAddress?.city || 'N/A'}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Profile Tab */}
                                  {(activeTab[profileIndex] || 0) === 1 && (
                                    <div className="tab-pane active" id="profile">
                                      <div className="card-body">
                                        <div className="row">
                                          <div className="col-md-6">
                                            <h6 className="fw-bold mb-3">Personal Information</h6>
                                            <div className="info-group mb-2">
                                              <strong>Name:</strong> {profile._candidate?.name || 'N/A'}
                                            </div>
                                            <div className="info-group mb-2">
                                              <strong>Email:</strong> {profile._candidate?.email || 'N/A'}
                                            </div>
                                            <div className="info-group mb-2">
                                              <strong>Mobile:</strong> {profile._candidate?.mobile || 'N/A'}
                                            </div>
                                            <div className="info-group mb-2">
                                              <strong>Date of Birth:</strong> {profile._candidate?.dob ? new Date(profile._candidate.dob).toLocaleDateString() : 'N/A'}
                                            </div>
                                          </div>
                                          <div className="col-md-6">
                                            <h6 className="fw-bold mb-3">Address Information</h6>
                                            <div className="info-group mb-2">
                                              <strong>Current Address:</strong> {profile._candidate?.personalInfo?.currentAddress?.fullAddress || 'N/A'}
                                            </div>
                                            <div className="info-group mb-2">
                                              <strong>City:</strong> {profile._candidate?.personalInfo?.currentAddress?.city || 'N/A'}
                                            </div>
                                            <div className="info-group mb-2">
                                              <strong>State:</strong> {profile._candidate?.personalInfo?.currentAddress?.state || 'N/A'}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Job History Tab */}
                                  {(activeTab[profileIndex] || 0) === 2 && (
                                    <div className="tab-pane active" id="job-history">
                                      <div className="card-body">
                                        {profile._candidate?.experiences && profile._candidate.experiences.length > 0 ? (
                                          <div className="row">
                                            {profile._candidate.experiences.map((exp, index) => (
                                              <div key={index} className="col-12 mb-3">
                                                <div className="card border">
                                                  <div className="card-body">
                                                    <h6 className="fw-bold">{exp.companyName || 'Company Name'}</h6>
                                                    <p className="text-muted mb-1">{exp.designation || 'Designation'}</p>
                                                    <p className="text-muted mb-2">
                                                      {exp.fromDate ? new Date(exp.fromDate).toLocaleDateString() : 'N/A'} - 
                                                      {exp.toDate ? new Date(exp.toDate).toLocaleDateString() : 'Present'}
                                                    </p>
                                                    <p className="mb-0">{exp.description || 'No description available'}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-center py-4">
                                            <i className="fas fa-briefcase fa-3x text-muted mb-3"></i>
                                            <h6>No Job History Available</h6>
                                            <p className="text-muted">This candidate has no work experience recorded.</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Course History Tab */}
                                  {(activeTab[profileIndex] || 0) === 3 && (
                                    <div className="tab-pane active" id="course-history">
                                      <div className="card-body">
                                        {profile._candidate?.qualifications && profile._candidate.qualifications.length > 0 ? (
                                          <div className="row">
                                            {profile._candidate.qualifications.map((qual, index) => (
                                              <div key={index} className="col-12 mb-3">
                                                <div className="card border">
                                                  <div className="card-body">
                                                    <h6 className="fw-bold">{qual.degree || 'Degree'}</h6>
                                                    <p className="text-muted mb-1">{qual.institution || 'Institution'}</p>
                                                    <p className="text-muted mb-2">
                                                      {qual.fromYear || 'N/A'} - {qual.toYear || 'N/A'}
                                                    </p>
                                                    <p className="mb-0">Percentage: {qual.percentage || 'N/A'}%</p>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-center py-4">
                                            <i className="fas fa-graduation-cap fa-3x text-muted mb-3"></i>
                                            <h6>No Course History Available</h6>
                                            <p className="text-muted">This candidate has no educational qualifications recorded.</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Documents Tab */}
                                  {(activeTab[profileIndex] || 0) === 4 && (
                                    <div className="tab-pane active" id="documents">
                                      <div className="card-body">
                                        <div className="row">
                                          <div className="col-12">
                                            <h6 className="fw-bold mb-3">Document Management</h6>
                                            <div className="row mb-4">
                                              <div className="col-md-2 col-6 mb-3">
                                                <div className="text-center p-3 border rounded">
                                                  <i className="fas fa-list fa-2x text-primary mb-2"></i>
                                                  <h5>{profile.docCounts?.totalRequired || 0}</h5>
                                                  <small>Total Required</small>
                                                </div>
                                              </div>
                                              <div className="col-md-2 col-6 mb-3">
                                                <div className="text-center p-3 border rounded">
                                                  <i className="fas fa-cloud-upload-alt fa-2x text-success mb-2"></i>
                                                  <h5>{profile.docCounts?.uploadedCount || 0}</h5>
                                                  <small>Uploaded</small>
                                                </div>
                                              </div>
                                              <div className="col-md-2 col-6 mb-3">
                                                <div className="text-center p-3 border rounded">
                                                  <i className="fas fa-clock fa-2x text-warning mb-2"></i>
                                                  <h5>{profile.docCounts?.pendingVerificationCount || 0}</h5>
                                                  <small>Pending</small>
                                                </div>
                                              </div>
                                              <div className="col-md-2 col-6 mb-3">
                                                <div className="text-center p-3 border rounded">
                                                  <i className="fas fa-check-circle fa-2x text-success mb-2"></i>
                                                  <h5>{profile.docCounts?.verifiedCount || 0}</h5>
                                                  <small>Verified</small>
                                                </div>
                                              </div>
                                              <div className="col-md-2 col-6 mb-3">
                                                <div className="text-center p-3 border rounded">
                                                  <i className="fas fa-times-circle fa-2x text-danger mb-2"></i>
                                                  <h5>{profile.docCounts?.RejectedCount || 0}</h5>
                                                  <small>Rejected</small>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            <div className="text-center py-4">
                                              <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
                                              <h6>Document Management</h6>
                                              <p className="text-muted">Document upload and verification functionality will be implemented here.</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>


                        ))}


                      </div>


                    </div>
                  </div>
                </div>

              </div>


            </section>

            <style>
        {
          `

    /* Clean Sticky Header CSS - Replace your entire style section with this */

/* Main wrapper styling */
html body .content .content-wrapper {
    padding: calc(0.9rem - 0.1rem) 1.2rem;
    overflow: visible !important;
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
.modal {
    z-index: 1050;
}

.modal-dialog {
    margin: 1rem;
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
@media (max-width: 768px) {
    .modal-dialog {
        margin: 0.5rem;
    }

    .whatsapp-chat .modal-content {
        height: 90vh;
    }

    .col-md-6,
    .col-md-5,
    .col-md-1 {
        flex: 0 0 100%;
        max-width: 100%;
        margin-bottom: 1rem;
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
    .container-fluid.py-2 {
        padding: 0.5rem !important;
    }

    .card-body.px-1.py-0.my-2 {
        padding: 0.5rem !important;
    }

    .d-flex.align-items-center {
        flex-wrap: wrap;
        gap: 0.5rem;
    }

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

.modal-content {
    background-color: #fff;
    max-height: 90vh;
    width: 80%;
    overflow-y: auto;
    padding: 20px;
    border-radius: 8px;
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
.modal-content{
width:100%;
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

/* Sticky Header Container */
.sticky-header-container {
    position: sticky !important;
    top: 0 !important;
    z-index: 1020 !important;
    background-color: white !important;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1) !important;
    width: 100% !important;
    margin-bottom: 1rem !important;
}

/* Header Content Styling */
.sticky-header-container .container-fluid {
    padding: 0.5rem 1.2rem !important;
}

/* Secondary Sticky Elements (Side Panels) */
.stickyBreakpoints {
    position: sticky !important;
    top: 120px !important;
    z-index: 11 !important;
}

/* Date Picker Styles */
.react-date-picker__wrapper {
    border: none;
}

.react-date-picker__inputGroup input {
    border: none !important;
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

/* Upload Modal Styles */
.upload-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
    backdrop-filter: blur(2px);
}

.upload-modal-content {
    background-color: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
}

.upload-modal-header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.upload-modal-body {
    padding: 24px;
}

.upload-modal-footer {
    padding: 16px 24px 24px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.file-drop-zone {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 48px 24px;
    text-align: center;
    background-color: #f9fafb;
    transition: all 0.3s ease;
    cursor: pointer;
}

.file-drop-zone:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
}

.drop-zone-content .upload-icon {
    font-size: 48px;
    color: #3b82f6;
    margin-bottom: 16px;
    display: block;
}

.file-details {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background-color: #f3f4f6;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.file-icon {
    width: 48px;
    height: 48px;
    background-color: #3b82f6;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
}

.file-info {
    flex: 1;
}

.file-name {
    margin: 0 0 4px;
    font-weight: 500;
    color: #1f2937;
    font-size: 0.875rem;
}

.file-size {
    margin: 0;
    color: #6b7280;
    font-size: 0.75rem;
}

.preview-image {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.progress-bar-container {
    width: 100%;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-bar {
    height: 100%;
    background-color: #3b82f6;
    transition: width 0.3s ease;
    border-radius: 4px;
}

/* Document Modal Styles */
.document-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1500;
    backdrop-filter: blur(2px);
}

.document-modal-content {
    background-color: white;
    border-radius: 12px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
    z-index: 1501;
}
         .react-date-picker__calendar.react-date-picker__calendar--open{
    inset: 0 !important;
    width: 300px !important;
}
/* Responsive Design */
@media (max-width: 1920px) {
    .stickyBreakpoints {
        top: 120px !important;
    }
}

@media (max-width: 1400px) {
    .stickyBreakpoints {
        top: 110px !important;
    }
}

@media (max-width: 768px) {
    .sticky-header-container {
        position: sticky !important;
        top: 0 !important;
    }
    
    .stickyBreakpoints {
        position: relative !important;
    }
    
    .sticky-header-container .container-fluid {
        padding: 0.5rem 1rem !important;
    }
}

@media (max-width: 576px) {
    .sticky-header-container .container-fluid {
        padding: 0.25rem 0.5rem !important;
    }
}

    /* Final Complete CSS - Replace entire <style> section with this */

html body .content .content-wrapper {
    padding: calc(0.9rem - 0.1rem) 1.2rem;
    overflow: visible !important;
}


/* ========== STICKY HEADER STYLES ========== */
.sticky-header-container {
    position: sticky !important;
    top: 0 !important;
    z-index: 1020 !important;
    background-color: white !important;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1) !important;
    width: 100% !important;
    margin-bottom: 1rem !important;
}

.sticky-header-container .container-fluid {
    padding: 0.5rem 1.2rem !important;
}
.site-header--sticky--register:not(.mobile-sticky-enable) {
    /* position: absolute !important; */
    top: 97px;
    z-index: 10;
}
    .site-header--sticky--register--panels{
     top: 258px;
    z-index: 10;
    }

@media (min-width: 992px) {
    .site-header--sticky--register:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        /* position: absolute !important; */
        /* min-height: 200px; */
        background: white;
    }
    .site-header--sticky--register--panels:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        /* position: absolute !important; */
        /* min-height: 200px; */
        background: white;
    }
}
    @media (max-width: 767px) {
    .site-header--sticky--register:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        background: white;
        width: 100%;
        left: 0;
        right: 0;
    }
    .site-header--sticky--register--panels:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        background: white;
        width: 100%;
        left: 0;
        right: 0;
    }
    
    /* Adjust content margin to avoid overlap */
    .content-body {
        margin-top: 120px; /* Adjust based on your header height */
    }
}

.stickyBreakpoints {
    position: sticky !important;
    top: 120px !important;
    z-index: 11 !important;
}

/* ========== DATE PICKER STYLES ========== */
.react-date-picker__wrapper {
    border: none;
}

.react-date-picker__inputGroup input {
    border: none !important;
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

/* ========== UPLOAD MODAL STYLES ========== */
.upload-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
    backdrop-filter: blur(2px);
}

.upload-modal-content {
    background-color: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
}

.upload-modal-header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.upload-modal-body {
    padding: 24px;
}

.upload-modal-footer {
    padding: 16px 24px 24px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.file-drop-zone {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 48px 24px;
    text-align: center;
    background-color: #f9fafb;
    transition: all 0.3s ease;
    cursor: pointer;
}

.file-drop-zone:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
}

.drop-zone-content .upload-icon {
    font-size: 48px;
    color: #3b82f6;
    margin-bottom: 16px;
    display: block;
}

.file-details {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background-color: #f3f4f6;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.file-icon {
    width: 48px;
    height: 48px;
    background-color: #3b82f6;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
}

.file-info {
    flex: 1;
}

.file-name {
    margin: 0 0 4px;
    font-weight: 500;
    color: #1f2937;
    font-size: 0.875rem;
}

.file-size {
    margin: 0;
    color: #6b7280;
    font-size: 0.75rem;
}

.preview-image {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.progress-bar-container {
    width: 100%;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-bar {
    height: 100%;
    background-color: #3b82f6;
    transition: width 0.3s ease;
    border-radius: 4px;
}

/* ========== DOCUMENT MODAL STYLES ========== */
.document-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1500;
    backdrop-filter: blur(2px);
}

.document-modal-content {
    background-color: white;
    border-radius: 12px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
    z-index: 1501;
}
    #editFollowupPanel {
    max-height: calc(100vh - 220px); /* Adjust based on your header height */
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin; /* For Firefox */
    scrollbar-color: #cbd5e0 #f7fafc; /* For Firefox */
}

/* ========== RESPONSIVE DESIGN ========== */
@media (max-width: 1920px) {
    .stickyBreakpoints {
        top: 120px !important;
    }
}

@media (max-width: 1400px) {
    .stickyBreakpoints {
        top: 110px !important;
    }
}

@media (max-width: 768px) {
    .sticky-header-container {
        position: sticky !important;
        top: 0 !important;
    }
    
    .stickyBreakpoints {
        position: relative !important;
    }
    
    .sticky-header-container .container-fluid {
        padding: 0.5rem 1rem !important;
    }
}

@media (max-width: 576px) {
    .sticky-header-container .container-fluid {
        padding: 0.25rem 0.5rem !important;
    }
}
    
    `
        }
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

/* Responsive adjustments */
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


    `
        }
      </style>
    
    </>
  )
}

export default RegistrationCards