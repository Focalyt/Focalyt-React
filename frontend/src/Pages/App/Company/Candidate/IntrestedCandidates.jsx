import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios';

const InterestedCandidates = () => {
  // Environment variables
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // Get token from localStorage (original method)
  const token = localStorage.getItem('token');
  
  // Debug logs
  useEffect(() => {
    console.log('Component mounted');
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('Backend URL:', backendUrl);
  }, []);

  // State management from original component
  const [appliedCandidates, setAppliedCandidates] = useState([]);
  const [company, setCompany] = useState({});
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // CRM Dashboard state additions
  const [activeTab, setActiveTab] = useState({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(null);
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
  const [pageSize, setPageSize] = useState(10);
  const [allProfilesData, setAllProfilesData] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);

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

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [currentPreviewUpload, setCurrentPreviewUpload] = useState(null);

  // Filter state
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

  // CRM filters and statuses
  const [crmFilters, setCrmFilters] = useState([
    { _id: 'all', name: 'All', count: 0, milestone: '' },
  ]);
  const [statuses, setStatuses] = useState([
    { _id: '', name: '', count: 0 },
  ]);

  // Status management
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSubStatus, setSelectedSubStatus] = useState(null);
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');
  const [remarks, setRemarks] = useState('');
  const [subStatuses, setSubStatuses] = useState([]);

  const tabs = [
    'Lead Details',
    'Profile',
    'Job History',
    'Documents'
  ];

  const today = new Date();

  // Load data on component mount and when page changes
  useEffect(() => {
    loadCandidatesData();
  }, [currentPage]);

  // Parse URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = parseInt(urlParams.get('page')) || 1;
    setCurrentPage(pageParam);
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 992);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const loadCandidatesData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if token exists
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const response = await fetch(`${backendUrl}/company/interested-candidates?page=${currentPage}`, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to load candidates data (${response.status})`);
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      // Transform data to match CRM Dashboard structure
      const transformedData = (data.appliedCandidates || []).map(candidate => ({
        ...candidate,
        // Add default values for CRM features
        docCounts: {
          totalRequired: 5, // Default document requirements
          uploadPercentage: Math.floor(Math.random() * 100), // Random progress for demo
          uploadedCount: Math.floor(Math.random() * 3),
          pendingVerificationCount: Math.floor(Math.random() * 2),
          verifiedCount: Math.floor(Math.random() * 2),
          RejectedCount: Math.floor(Math.random() * 1)
        },
        uploadedDocs: [
          { _id: '1', Name: 'Resume', status: 'Verified', uploads: [] },
          { _id: '2', Name: 'ID Proof', status: 'Pending', uploads: [] },
          { _id: '3', Name: 'Educational Certificates', status: 'Not Uploaded', uploads: [] },
          { _id: '4', Name: 'Experience Letter', status: 'Rejected', uploads: [] },
          { _id: '5', Name: 'Photo', status: 'Verified', uploads: [] }
        ],
        _leadStatus: { _id: 'interested', title: 'Interested' },
        logs: [],
        followups: []
      }));

      setAppliedCandidates(transformedData);
      setAllProfiles(transformedData);
      setAllProfilesData(transformedData);
      setCompany(data.company || {});
      setTotalPages(data.totalPages || 1);
      
      // Update CRM filter counts
      updateCrmFiltersCounts(transformedData);
      
    } catch (error) {
      console.error('Error loading candidates:', error);
      setError(error.message || 'Failed to load candidates data');
    } finally {
      setLoading(false);
    }
  };

  const updateCrmFiltersCounts = (data) => {
    setCrmFilters(prevFilters => {
      return prevFilters.map(filter => {
        if (filter._id === 'all') {
          return { ...filter, count: data.length };
        }
        const count = data.filter(profile => profile._leadStatus && profile._leadStatus._id === filter._id).length;
        return { ...filter, count };
      });
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'NA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      
      // Update URL without page reload
      const url = new URL(window.location);
      url.searchParams.set('page', page.toString());
      window.history.pushState({}, '', url);
    }
  };

  const generatePaginationRange = () => {
    let first = 1;
    let last = totalPages > 4 ? 4 : totalPages;

    if (totalPages > 4 && currentPage >= 2) {
      first = currentPage - 1;
      last = currentPage + 1;
      if (last > totalPages) last = totalPages;
    }

    return { first, last };
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;

    const { first, last } = generatePaginationRange();
    const pages = [];

    // First page link
    if (first > 1) {
      pages.push(
        <li key="first" className="page-item">
          <button 
            className="page-link" 
            onClick={() => handlePageChange(1)}
          >
            First
          </button>
        </li>
      );
    }

    // Page number links
    for (let i = first; i <= last; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
          <button 
            className="page-link" 
            onClick={() => handlePageChange(i)}
            disabled={i === currentPage}
          >
            {i}
          </button>
        </li>
      );
    }

    // Last page links
    if (totalPages > last) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <button 
            className="page-link" 
            onClick={() => handlePageChange(last + 1)}
          >
            ...
          </button>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <button 
            className="page-link" 
            onClick={() => handlePageChange(totalPages)}
          >
            Last
          </button>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end ml-2 mb-2">
        {pages}
      </ul>
    );
  };

  const handleViewCandidate = (candidateId) => {
    window.location.href = `/company/candidate/${candidateId}`;
  };

  // Tab handling functions
  const handleTabClick = (profileIndex, tabIndex) => {
    setActiveTab(prevTabs => ({
      ...prevTabs,
      [profileIndex]: tabIndex
    }));
  };

  const toggleLeadDetails = (profileIndex) => {
    setLeadDetailsVisible(prev => prev === profileIndex ? null : profileIndex);
  };

  const togglePopup = (profileIndex) => {
    setShowPopup(prev => prev === profileIndex ? null : profileIndex);
  };

  // Filter functions
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilterData = { ...filterData, [name]: value };
    setFilterData(newFilterData);

    if (newFilterData.name) {
      handleSearch(newFilterData.name);
    } else {
      applyFilters(newFilterData);
    }
  };

  const clearSearch = () => {
    setFilterData(prev => ({ ...prev, name: '' }));
    setAllProfiles(allProfilesData); // Reset to original data
  };

  const handleSearch = (searchTerm) => {
    console.log('Searching for:', searchTerm);
    console.log('Available data:', allProfilesData.length);
    
    if (!searchTerm || !searchTerm.trim()) {
      console.log('Empty search, showing all data');
      setAllProfiles(allProfilesData);
      return;
    }

    const searchFiltered = allProfilesData.filter(profile => {
      try {
        const name = profile._candidate?.name ? String(profile._candidate.name).toLowerCase() : '';
        const mobile = profile._candidate?.mobile ? String(profile._candidate.mobile).toLowerCase() : '';
        const email = profile._candidate?.email ? String(profile._candidate.email).toLowerCase() : '';
        const searchLower = searchTerm.toLowerCase();

        const matches = name.includes(searchLower) ||
          mobile.includes(searchLower) ||
          email.includes(searchLower);
          
        console.log('Profile:', name, 'matches:', matches);
        return matches;
      } catch (error) {
        console.error('Search filter error for profile:', profile, error);
        return false;
      }
    });

    console.log('Filtered results:', searchFiltered.length);
    setAllProfiles(searchFiltered);
  };

  const applyFilters = (filters = filterData) => {
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

      // Additional filters can be added here
      setAllProfiles(filtered);

    } catch (error) {
      console.error('Filter error:', error);
      setAllProfiles(allProfilesData);
    }
  };

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

  const getLeadAge = (createdAt) => {
    if (!createdAt) return 'N/A';
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Days`;
  };

  // Document functions
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

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedDocumentForUpload) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Here you would implement actual file upload to your company API
      alert('Document uploaded successfully!');
      closeUploadModal();
      loadCandidatesData(); // Refresh data
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const openDocumentModal = (document) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
    setDocumentZoom(1);
    setDocumentRotation(0);
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
    setDocumentZoom(1);
    setDocumentRotation(0);
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
      if (!doc.status) return false;
      return doc.status.toLowerCase() === statusFilter.toLowerCase();
    });
  };

  // Panel functions
  const openEditPanel = async (profile = null, panel) => {
    if (profile) {
      setSelectedProfile(profile);
    }

    setShowEditPanel(false);
    setShowFollowupPanel(false);
    setShowWhatsappPanel(false);

    if (panel === 'StatusChange') {
      setShowEditPanel(true);
    } else if (panel === 'SetFollowup') {
      setShowPopup(null)
      setShowFollowupPanel(true);
    }

    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  const closeEditPanel = () => {
    setShowEditPanel(false);
    setShowFollowupPanel(false);
    if (!isMobile) {
      setMainContentClass('col-12');
    }
  };

  const openleadHistoryPanel = async (profile = null) => {
    if (profile) {
      setSelectedProfile(profile);
    }

    setShowPopup(null)
    setLeadHistoryPanel(true)
    setShowWhatsappPanel(false);
    setShowEditPanel(false);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  const closeleadHistoryPanel = () => {
    setLeadHistoryPanel(false)
    if (!isMobile) {
      setMainContentClass(showEditPanel || showWhatsappPanel ? 'col-8' : 'col-12');
    }
  };

  // Document Modal Component
  const DocumentModal = () => {
    if (!showDocumentModal || !selectedDocument) return null;

    return (
      <div className="document-modal-overlay" onClick={closeDocumentModal}>
        <div className="document-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{selectedDocument.Name} Preview</h3>
            <button className="close-btn" onClick={closeDocumentModal}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="document-preview-section">
              <div className="document-preview-container">
                <div className="document-placeholder">
                  <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
                  <p>Document preview will be shown here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Upload Modal Component
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
              {showEditPanel && 'Edit Status for '}
              {showFollowupPanel && 'Set Followup for '}
              {selectedProfile?._candidate?.name || 'Unknown'}
            </h6>
          </div>
          <div>
            <button className="btn-close" type="button" onClick={closeEditPanel}>
            </button>
          </div>
        </div>

        <div className="card-body">
          <form>
            <div className="mb-3">
              <label className="form-label">Notes</label>
              <textarea 
                className="form-control" 
                rows="4"
                placeholder="Add notes about this candidate..."
              ></textarea>
            </div>
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={closeEditPanel}
              >
                Close
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Status updated successfully!');
                  closeEditPanel();
                }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <div
          className={`modal ${showEditPanel || showFollowupPanel ? 'show d-block' : 'd-none'}`}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditPanel();
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

    return showEditPanel || showFollowupPanel ? (
      <div className="col-12 transition-col" id="editFollowupPanel">
        {panelContent}
      </div>
    ) : null;
  };

  // Render Lead History Panel
  const renderLeadHistoryPanel = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-history text-primary"></i>
            </div>
            <h6 className="mb-0 fw-medium">Application History</h6>
          </div>
          <button className="btn-close" type="button" onClick={closeleadHistoryPanel}>
          </button>
        </div>

        <div className="card-body p-0 d-flex flex-column h-100">
          <div
            className="flex-grow-1 overflow-auto px-3 py-2"
            style={{
              maxHeight: isMobile ? '60vh' : '65vh',
              minHeight: '200px'
            }}
          >
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center py-5">
              <div className="mb-3">
                <i className="fas fa-history text-muted" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
              </div>
              <h6 className="text-muted mb-2">No History Available</h6>
              <p className="text-muted small mb-0">No actions have been recorded for this candidate yet.</p>
            </div>
          </div>

          <div className="border-top px-3 py-3 bg-light">
            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={closeleadHistoryPanel}
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
      return (
        <div
          className={`modal ${leadHistoryPanel ? 'show d-block' : 'd-none'}`}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeleadHistoryPanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxHeight: '90vh' }}>
            <div className="modal-content" style={{ height: '85vh' }}>
              {panelContent}
            </div>
          </div>
        </div>
      );
    }

    return leadHistoryPanel ? (
      <div className="col-12 transition-col" id="leadHistoryPanel" style={{ height: '80vh' }}>
        {panelContent}
      </div>
    ) : null;
  };

  return (
    <>
      {/* Content Header */}
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">Interested Candidates</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="/company/dashboard">Home</a>
                  </li>
                  <li className="breadcrumb-item active">Interested Candidates</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row">
          <div className={isMobile ? 'col-12' : mainContentClass}>

            {/* Header */}
            <div className="bg-white shadow-sm border-bottom mb-3 sticky-top " >
              <div className="container-fluid py-2 " >
                <div className="row align-items-center">
                  <div className="col-md-6 d-md-block d-sm-none">
                    <div className="d-flex align-items-center">
                      <h4 className="fw-bold text-dark mb-0 me-3">Interested Candidates</h4>
                      <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0 small">
                          <li className="breadcrumb-item">
                            <a href="#" className="text-decoration-none">Home</a>
                          </li>
                          <li className="breadcrumb-item active">Interested Candidates</li>
                        </ol>
                      </nav>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-end align-items-center gap-2">
                      <div className="input-group" style={{ maxWidth: '300px' }}>
                        <span className="input-group-text bg-white border-end-0 input-height">
                          <i className="fas fa-search text-muted"></i>
                        </span>
                        <input
                          type="text"
                          name="name"
                          className="form-control border-start-0 m-0"
                          placeholder="Quick search..."
                          value={filterData.name}
                          onChange={handleFilterChange}
                        />
                        {filterData.name && (
                          <button
                            className="btn btn-outline-secondary border-start-0"
                            type="button"
                            onClick={clearSearch}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          console.log('Filter button clicked, current state:', isFilterCollapsed);
                          setIsFilterCollapsed(!isFilterCollapsed);
                        }}
                        className={`btn ${!isFilterCollapsed ? 'btn-primary' : 'btn-outline-primary'}`}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <i className={`fas fa-filter me-1`}></i>
                        Filters
                        {Object.values(filterData).filter(val => val && val !== 'true').length > 0 && (
                          <span className="badge bg-light text-dark ms-1">
                            {Object.values(filterData).filter(val => val && val !== 'true').length}
                          </span>
                        )}
                      </button>
                      <div className="btn-group">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        >
                          <i className="fas fa-th"></i>
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        >
                          <i className="fas fa-list"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="card-body p-3">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      {crmFilters.map((filter, index) => (
                        <div key={index} className="d-flex align-items-center gap-1">
                          <div className='d-flex'>
                            <button
                              className={`btn btn-sm ${activeCrmFilter === index ? 'btn-primary' : 'btn-outline-secondary'} position-relative`}
                              onClick={() => setActiveCrmFilter(index)}
                            >
                              {filter.name}
                              <span className={`ms-1 ${activeCrmFilter === index ? 'text-white' : 'text-dark'}`}>
                                ({filter.count})
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="content-body">
              <section className="list-view">
                <div className='row'>
                  <div>
                    <div className="col-12 rounded equal-height-2 coloumn-2">
                      <div className="card px-3">
                        <div className="row" id="crm-main-row">

                          {/* Loading State */}
                          {loading && (
                            <div className="text-center p-4">
                              <div className="spinner-border" role="status">
                                <span className="sr-only">Loading...</span>
                              </div>
                              <p className="mt-2">Loading candidates...</p>
                            </div>
                          )}

                          {/* Error State */}
                          {error && (
                            <div className="alert alert-danger m-3" role="alert">
                              {error}
                              <button 
                                className="btn btn-sm btn-outline-danger ml-2"
                                onClick={loadCandidatesData}
                              >
                                Retry
                              </button>
                            </div>
                          )}

                          {/* Candidates List */}
                          {!loading && !error && allProfiles.map((profile, profileIndex) => (
                            <div className={`card-content transition-col mb-2`} key={profileIndex}>

                              {/* Profile Header Card */}
                              <div className="card border-0 shadow-sm mb-0 mt-2">
                                <div className="card-body px-1 py-0 my-2">
                                  <div className="row align-items-center">
                                    <div className="col-md-6">
                                      <div className="d-flex align-items-center">
                                        <div className="form-check me-3">
                                          <input className="form-check-input" type="checkbox" />
                                        </div>
                                        <div className="me-3">
                                          <div className="circular-progress-container" data-percent={profile.docCounts.uploadPercentage || 50}>
                                            <svg width="40" height="40">
                                              <circle className="circle-bg" cx="20" cy="20" r="16"></circle>
                                              <circle className="circle-progress" cx="20" cy="20" r="16"></circle>
                                            </svg>
                                            <div className="progress-text">{profile.docCounts.uploadPercentage || 50}%</div>
                                          </div>
                                        </div>
                                        <div>
                                          <h6 className="mb-0 fw-bold">{profile._candidate?.name || 'Candidate Name'}</h6>
                                          <small className="text-muted">{profile._candidate?.mobile || profile._candidate?.email || 'Contact Info'}</small>
                                        </div>
                                        <div style={{ marginLeft: '15px' }}>
                                          <button className="btn btn-outline-primary btn-sm border-0" title="Call" style={{ fontSize: '20px' }}>
                                            <i className="fas fa-phone"></i>
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="col-md-5">
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
                                            value={profile._job?.displayCompanyName || company.name || 'Company'}
                                            readOnly
                                          />
                                          <input
                                            type="text"
                                            className="form-control form-control-sm m-0"
                                            value={profile._job?.title || 'Position'}
                                            style={{
                                              cursor: 'pointer',
                                              border: '1px solid #ddd',
                                              borderRadius: '0px',
                                              borderBottomRightRadius: '5px',
                                              borderBottomLeftRadius: '5px',
                                              width: '145px',
                                              height: '20px',
                                              fontSize: '10px',
                                              color: '#007bff'
                                            }}
                                            readOnly
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="col-md-1 text-end">
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
                                              onClick={() => handleViewCandidate(profile._candidate?._id)}
                                            >
                                              View Full Profile
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
                                                openleadHistoryPanel(profile);
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
                                              onClick={() => {
                                                openEditPanel(profile, 'SetFollowup');
                                              }}
                                            >
                                              Add Notes
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
                                  <div className="tab-content">

                                    {/* Lead Details Tab */}
                                    {(activeTab[profileIndex] || 0) === 0 && (
                                      <div className="tab-pane active" id="lead-details">
                                        <div className="row">
                                          <div className="col-xl-3 col-3">
                                            <div className="info-group">
                                              <div className="info-label">APPLICATION AGE</div>
                                              <div className="info-value">{getLeadAge(profile.createdAt)}</div>
                                            </div>
                                          </div>
                                          <div className="col-xl-3 col-3">
                                            <div className="info-group">
                                              <div className="info-label">COMPANY</div>
                                              <div className="info-value">{profile._job?.displayCompanyName || company.name || 'N/A'}</div>
                                            </div>
                                          </div>
                                          <div className="col-xl-3 col-3">
                                            <div className="info-group">
                                              <div className="info-label">POSITION</div>
                                              <div className="info-value">{profile._job?.title || 'N/A'}</div>
                                            </div>
                                          </div>
                                          <div className="col-xl-3 col-3">
                                            <div className="info-group">
                                              <div className="info-label">QUALIFICATION</div>
                                              <div className="info-value">{profile._candidate?.highestQualification?.name || 'N/A'}</div>
                                            </div>
                                          </div>
                                          <div className="col-xl-3 col-3">
                                            <div className="info-group">
                                              <div className="info-label">EXPERIENCE</div>
                                              <div className="info-value">
                                                {profile._candidate?.totalExperience 
                                                  ? `${profile._candidate.totalExperience} Years` 
                                                  : 'Fresher'
                                                }
                                              </div>
                                            </div>
                                          </div>
                                          <div className="col-xl-3 col-3">
                                            <div className="info-group">
                                              <div className="info-label">LOCATION</div>
                                              <div className="info-value">
                                                {profile._candidate?.city?.name || 'N/A'}, {profile._candidate?.state?.name || 'N/A'}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="col-xl-3 col-3">
                                            <div className="info-group">
                                              <div className="info-label">APPLICATION DATE</div>
                                              <div className="info-value">{formatDate(profile.createdAt)}</div>
                                            </div>
                                          </div>
                                          <div className="col-xl-3 col-3">
                                            <div className="info-group">
                                              <div className="info-label">STATUS</div>
                                              <div className="info-value">{profile._leadStatus?.title || 'Applied'}</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Profile Tab */}
                                    {(activeTab[profileIndex] || 0) === 1 && (
                                      <div className="tab-pane active" id="profile">
                                        <div className="row">
                                          <div className="col-md-4">
                                            <div className="profile-image-section text-center">
                                              <div className="profile-avatar mb-3">
                                                <i className="fas fa-user-circle fa-5x text-muted"></i>
                                              </div>
                                              <h5>{profile._candidate?.name || 'Candidate Name'}</h5>
                                              <p className="text-muted">{profile._candidate?.email}</p>
                                              <p className="text-muted">{profile._candidate?.mobile}</p>
                                            </div>
                                          </div>
                                          <div className="col-md-8">
                                            <div className="profile-details">
                                              <h6>Personal Information</h6>
                                              <div className="row">
                                                <div className="col-md-6">
                                                  <strong>Date of Birth:</strong> {profile._candidate?.dob ? formatDate(profile._candidate.dob) : 'N/A'}
                                                </div>
                                                <div className="col-md-6">
                                                  <strong>Gender:</strong> {profile._candidate?.gender || 'N/A'}
                                                </div>
                                              </div>
                                              
                                              <h6 className="mt-3">Professional Information</h6>
                                              <div className="row">
                                                <div className="col-md-6">
                                                  <strong>Experience:</strong> 
                                                  {profile._candidate?.totalExperience 
                                                    ? `${profile._candidate.totalExperience} Years` 
                                                    : 'Fresher'
                                                  }
                                                </div>
                                                <div className="col-md-6">
                                                  <strong>Current CTC:</strong> {profile._candidate?.currentCTC || 'N/A'}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Job History Tab */}
                                    {(activeTab[profileIndex] || 0) === 2 && (
                                      <div className="tab-pane active" id="job-history">
                                        <div className="table-responsive">
                                          <table className="table table-hover">
                                            <thead>
                                              <tr>
                                                <th>Company</th>
                                                <th>Position</th>
                                                <th>Duration</th>
                                                <th>Status</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              <tr>
                                                <td>Previous Company</td>
                                                <td>Software Developer</td>
                                                <td>2021 - 2024</td>
                                                <td><span className="badge bg-success">Completed</span></td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}

                                    {/* Documents Tab */}
                                    {(activeTab[profileIndex] || 0) === 3 && (
                                      <div className="tab-pane active" id="documents">
                                        <div className="enhanced-documents-panel">
                                          {/* Stats Grid */}
                                          <div className="stats-grid mb-4">
                                            <div className="row">
                                              <div className="col-md-2">
                                                <div className="stat-card text-center">
                                                  <h4>{profile.docCounts.totalRequired}</h4>
                                                  <p>Total Required</p>
                                                </div>
                                              </div>
                                              <div className="col-md-2">
                                                <div className="stat-card text-center">
                                                  <h4>{profile.docCounts.uploadedCount}</h4>
                                                  <p>Uploaded</p>
                                                </div>
                                              </div>
                                              <div className="col-md-2">
                                                <div className="stat-card text-center">
                                                  <h4>{profile.docCounts.pendingVerificationCount}</h4>
                                                  <p>Pending</p>
                                                </div>
                                              </div>
                                              <div className="col-md-2">
                                                <div className="stat-card text-center">
                                                  <h4>{profile.docCounts.verifiedCount}</h4>
                                                  <p>Verified</p>
                                                </div>
                                              </div>
                                              <div className="col-md-2">
                                                <div className="stat-card text-center">
                                                  <h4>{profile.docCounts.RejectedCount}</h4>
                                                  <p>Rejected</p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Filter Buttons */}
                                          <div className="filter-section mb-4">
                                            <div className="btn-group" role="group">
                                              <button
                                                className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => setStatusFilter('all')}
                                              >
                                                All ({profile.docCounts.totalRequired})
                                              </button>
                                              <button
                                                className={`btn ${statusFilter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                                                onClick={() => setStatusFilter('pending')}
                                              >
                                                Pending ({profile.docCounts.pendingVerificationCount})
                                              </button>
                                              <button
                                                className={`btn ${statusFilter === 'verified' ? 'btn-success' : 'btn-outline-success'}`}
                                                onClick={() => setStatusFilter('verified')}
                                              >
                                                Verified ({profile.docCounts.verifiedCount})
                                              </button>
                                              <button
                                                className={`btn ${statusFilter === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
                                                onClick={() => setStatusFilter('rejected')}
                                              >
                                                Rejected ({profile.docCounts.RejectedCount})
                                              </button>
                                            </div>
                                          </div>

                                          {/* Documents Grid */}
                                          <div className="row">
                                            {filterDocuments(profile.uploadedDocs).map((doc, index) => (
                                              <div key={index} className="col-md-4 mb-3">
                                                <div className="document-card">
                                                  <div className="document-preview">
                                                    <i className="fas fa-file-alt fa-3x text-muted"></i>
                                                  </div>
                                                  <div className="document-info">
                                                    <h6>{doc.Name}</h6>
                                                    <span className={`badge ${
                                                      doc.status === 'Verified' ? 'bg-success' :
                                                      doc.status === 'Pending' ? 'bg-warning' :
                                                      doc.status === 'Rejected' ? 'bg-danger' : 'bg-secondary'
                                                    }`}>
                                                      {doc.status}
                                                    </span>
                                                    <div className="document-actions mt-2">
                                                      <button 
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        onClick={() => {
                                                          setSelectedProfile(profile);
                                                          openUploadModal(doc);
                                                        }}
                                                      >
                                                        <i className="fas fa-upload"></i> Upload
                                                      </button>
                                                      <button 
                                                        className="btn btn-sm btn-outline-info"
                                                        onClick={() => openDocumentModal(doc)}
                                                      >
                                                        <i className="fas fa-eye"></i> View
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* No Results */}
                          {!loading && !error && allProfiles.length === 0 && (
                            <div className="text-center py-5">
                              <i className="fas fa-users fa-3x text-muted mb-3"></i>
                              <h5 className="text-muted">No Candidates Found</h5>
                              <p className="text-muted">
                                {filterData.name ? 'No candidates match your search criteria.' : 'No candidates have applied yet.'}
                              </p>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Pagination */}
                <Pagination />
              </section>
            </div>
          </div>

          {/* Right Sidebar for Desktop - Panels */}
          {!isMobile && (
            <div className="col-4">
              <div className="row sticky-top ">
                {renderEditPanel()}
                {renderLeadHistoryPanel()}
              </div>
            </div>
          )}

          {/* Mobile Modals */}
          {isMobile && renderEditPanel()}
          {isMobile && renderLeadHistoryPanel()}
        </div>

        {/* Document Modal */}
        <DocumentModal />
        
        {/* Upload Modal */}
        <UploadModal />

        <style jsx>{`
          html body .content .content-wrapper {
            padding: calc(0.9rem - 0.1rem) 1.2rem
          }

          .container-fluid.py-2 {
            position: sticky !important;
            top: 0;
            z-index: 1020;
            background-color: white;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }

         

          .circular-progress-container {
            position: relative;
            width: 40px;
            height: 40px;
          }

          .circle-bg {
            fill: none;
            stroke: #e9ecef;
            stroke-width: 2;
          }

          .circle-progress {
            fill: none;
            stroke: #ff4757;
            stroke-width: 2;
            stroke-linecap: round;
            transform: rotate(-90deg);
            transform-origin: center;
            stroke-dasharray: 100;
            stroke-dashoffset: 50;
          }

          .progress-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 10px;
            font-weight: bold;
            color: #ff4757;
          }

          .info-group {
            margin-bottom: 1rem;
          }

          .info-label {
            font-weight: 600;
            font-size: 0.75rem;
            color: #6c757d;
            text-transform: uppercase;
            margin-bottom: 0.25rem;
          }

          .info-value {
            font-size: 0.875rem;
            color: #495057;
          }

          .document-card {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
            background-color: #f8f9fa;
          }

          .document-preview {
            margin-bottom: 1rem;
          }

          .document-actions {
            display: flex;
            gap: 0.5rem;
            justify-content: center;
          }

          .stat-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1rem;
            border: 1px solid #e9ecef;
          }

          .stats-grid {
            margin-bottom: 1rem;
          }

          /* Modal Styles */
          .document-modal-overlay,
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
          }

          .document-modal-content,
          .upload-modal-content {
            background-color: white;
            border-radius: 8px;
            max-width: 800px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-header,
          .upload-modal-header {
            padding: 1rem;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .modal-body,
          .upload-modal-body {
            padding: 1rem;
          }

          .upload-modal-footer {
            padding: 1rem;
            border-top: 1px solid #e9ecef;
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
          }

          .file-drop-zone {
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            background-color: #f9fafb;
          }

          .upload-icon {
            font-size: 3rem;
            color: #007bff;
            display: block;
            margin-bottom: 1rem;
          }

          .file-details {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background-color: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 1rem;
          }

          .file-icon {
            width: 40px;
            height: 40px;
            background-color: #007bff;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .file-info {
            flex: 1;
          }

          .file-name {
            margin: 0 0 0.25rem;
            font-weight: 500;
          }

          .file-size {
            margin: 0;
            color: #6c757d;
            font-size: 0.875rem;
          }

          .preview-image {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
            border-radius: 8px;
          }

          .progress-bar-container {
            width: 100%;
            height: 8px;
            background-color: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 0.5rem;
          }

          .progress-bar {
            height: 100%;
            background-color: #007bff;
            transition: width 0.3s ease;
          }

          .document-placeholder {
            text-align: center;
            padding: 3rem;
            color: #6c757d;
          }

          .sticky-top {
            position: sticky;
            top: 0;
            z-index: 1020;
            background-color: white;
          }

          .nav-pills .nav-link {
            border-radius: 20px;
            margin-right: 0.5rem;
          }

          .nav-pills .nav-link.active {
            background-color: #007bff;
          }

          .card-content {
            transition: all 0.3s ease;
          }

          .card-content:hover {
            transform: translateY(-2px);
          }

        
        `}</style>
      </div>
    </>
  );
};

export default InterestedCandidates;