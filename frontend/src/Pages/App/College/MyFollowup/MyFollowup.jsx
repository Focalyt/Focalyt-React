import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-date-picker';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'

const MyFollowups = () => {
  //Calendar Stats
  // State management
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [isRangeMode, setIsRangeMode] = useState(true); // Set to true by default to show range functionality
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [customDays, setCustomDays] = useState(7);
  const [rangePreset, setRangePreset] = useState('custom');

  // Sample followup data with different statuses
  const [followupDates, setFollowupDates] = useState([]);

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  // const [activeTab, setActiveTab] = useState(0);
  const [activeTab, setActiveTab] = useState({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(null);
  const [activeCrmFilter, setActiveCrmFilter] = useState(0);
  const [plannedCount, setPlannedCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showCalendarModal, setCalendarModal] = useState(true);
  const [showFollowupPanel, setShowFollowupPanel] = useState(false);
  const [showWhatsappPanel, setShowWhatsappPanel] = useState(false);
  const [mainContentClass, setMainContentClass] = useState('col-8');
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


  // open model for upload documents 
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [currentPreviewUpload, setCurrentPreviewUpload] = useState(null);

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


  // Document Modal Component
  const DocumentModal = () => {
    if (!showDocumentModal || !selectedDocument) return null;

    const latestUpload = selectedDocument.uploads && selectedDocument.uploads.length > 0
      ? selectedDocument.uploads[selectedDocument.uploads.length - 1]
      : (selectedDocument.fileUrl && selectedDocument.status !== "Not Uploaded" ? selectedDocument : null);

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
            width: isSmall ? '60px' : '150px',
            height: isSmall ? '40px' : '100px',
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
              width: isSmall ? '60px' : '150px',
              height: isSmall ? '40px' : '100px',
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
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <iframe
              src={fileUrl}
              className={`document-thumbnail pdf-thumbnail ${isSmall ? 'small' : ''}`}
              style={{
                width: isSmall ? '60px' : '150px',
                height: isSmall ? '40px' : '100px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                cursor: 'pointer',
                pointerEvents: 'none', // Prevent interaction in thumbnail
                transform: 'scale(0.3)',
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
              backgroundColor: 'rgba(220, 53, 69, 0.1)',
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
              src={fileUrl}
              className={`document-thumbnail ${isSmall ? 'small' : ''}`}
              style={{
                width: isSmall ? '60px' : '150px',
                height: isSmall ? '40px' : '100px',
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

    // Main preview rendering using iframe/img
    const renderMainPreview = () => {
      const fileUrl = latestUpload?.fileUrl || selectedDocument?.fileUrl;
      const hasDocument = fileUrl ||
        (selectedDocument?.status && selectedDocument?.status !== "Not Uploaded" && selectedDocument?.status !== "No Uploads");

      if (hasDocument) {
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
                  maxHeight: '500px',
                  objectFit: 'contain'
                }}
              />
            );
          } else if (fileType === 'pdf') {
            return (
              <iframe
                src={fileUrl}
                width="100%"
                height="500px"
                style={{
                  border: 'none',
                  transform: `scale(${documentZoom})`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.3s ease',
                  borderRadius: '4px'
                }}
                title="PDF Document"
              />
            );
          } else {
            // Try iframe for other document types
            return (
              <div style={{ position: 'relative' }}>
                <iframe
                  src={fileUrl}
                  width="100%"
                  height="500px"
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    transform: `scale(${documentZoom})`,
                    transformOrigin: 'top left',
                    transition: 'transform 0.3s ease'
                  }}
                  title="Document Preview"
                />
                {/* Fallback overlay if iframe doesn't work */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  padding: '20px',
                  borderRadius: '8px',
                  display: 'none' // Show this only if iframe fails
                }}>
                  <div style={{ fontSize: '60px', marginBottom: '20px' }}>
                    {fileType === 'document' ? '📄' :
                      fileType === 'spreadsheet' ? '📊' : '📁'}
                  </div>
                  <h4>Document Preview</h4>
                  <p>Click download to view this file</p>
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
              </div>
            );
          }
        } else {
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
                    {renderMainPreview()}
                    <div className="preview-controls">
                      <button
                        onClick={zoomIn}
                        className="control-btn"
                        style={{ whiteSpace: 'nowrap' }}
                        title="Zoom In"
                      >
                        <i className="fas fa-search-plus"></i> Zoom In
                      </button>

                      <button
                        onClick={zoomOut}
                        className="control-btn"
                        style={{ whiteSpace: 'nowrap' }}
                        title="Zoom Out"
                      >
                        <i className="fas fa-search-minus"></i> Zoom Out
                      </button>

                      {/* Show rotation button only for images */}
                      {getFileType(latestUpload?.fileUrl || selectedDocument?.fileUrl) === 'image' && (
                        <button
                          onClick={rotateDocument}
                          className="control-btn"
                          style={{ whiteSpace: 'nowrap' }}
                          title="Rotate 90°"
                        >
                          <i className="fas fa-redo"></i> Rotate
                        </button>
                      )}

                      {/* Reset View Button */}
                      <button
                        onClick={resetView}
                        className="control-btn"
                        style={{ whiteSpace: 'nowrap' }}
                        title="Reset View"
                      >
                        <i className="fas fa-sync-alt"></i> Reset
                      </button>

                      {/* Download Button */}
                      {(latestUpload?.fileUrl || selectedDocument?.fileUrl) ? (
                        <a
                          href={latestUpload?.fileUrl || selectedDocument?.fileUrl}
                          download
                          className="control-btn"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ whiteSpace: 'nowrap', textDecoration: 'none' }}
                          title="Download Document"
                        >
                          <i className="fas fa-download"></i> Download
                        </a>
                      ) : (
                        <button
                          className="control-btn"
                          style={{ whiteSpace: 'nowrap', opacity: 0.5 }}
                          disabled
                          title="File URL not available"
                        >
                          <i className="fas fa-download"></i> Download
                        </button>
                      )}

                      {/* Zoom Level Indicator */}
                      <div className="zoom-indicator" style={{
                        fontSize: '12px',
                        color: '#666',
                        marginLeft: '10px',
                        padding: '5px 10px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px'
                      }}>
                        {Math.round(documentZoom * 100)}%
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="no-document">
                    <i className="fas fa-file-times fa-3x text-muted mb-3"></i>
                    <p>No document uploaded</p>
                  </div>
                )}
              </div>

                {/* Enhanced Document History with iframe/img Preview */}
                {selectedDocument.uploads && selectedDocument.uploads.length > 0 && (
                <div className="info-card">
                  <h4>Document History</h4>
                  <div className="document-history">
                    {selectedDocument.uploads && selectedDocument.uploads.map((upload, index) => (
                      <div key={index} className="history-item" style={{
                        display: 'flex',
                        alignItems: 'center',
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

              {(latestUpload?.status === 'Pending' || selectedDocument?.status === 'Pending') && (
                <div className="verification-section">
                  <div className="info-card">
                    <h4>Verification Steps</h4>
                    <ol className="verification-steps">
                      <li>Check if the document is clearly visible</li>
                      <li>Verify the document belongs to the candidate</li>
                      <li>Confirm all required details are present</li>
                      <li>Check the document validity dates</li>
                      <li>Ensure there are no signs of tampering</li>
                    </ol>
                  </div>
                </div>
              )}

            
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
    fetchSubStatus()

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
        const allFilter = { _id: 'all', name: 'All', count: status.reduce((acc, cur) => acc + (cur.count || 0), 0) || 15 };


        setCrmFilters([allFilter, ...status.map(r => ({
          _id: r._id,
          name: r.title,
          milestone: r.milestone,
          count: r.count || 0,  // agar backend me count nahi hai to 0
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




  const [user, setUser] = useState({
    image: '',
    name: 'John Doe'
  });

  // Inside CRMDashboard component:

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (allProfilesData) {  // Safe check for response and data
          const filteredProfiles = (status) => {
            return allProfilesData?.filter(profile => {  // Safe check for allProfilesData
              return profile._leadStatus && profile.followupStatus === status;
            });
          };

          // Ensure filteredProfiles is defined and then calculate length
          const plannedProfiles = filteredProfiles('Planned') || [];
          const doneProfiles = filteredProfiles('Doen') || [];
          const missedProfiles = filteredProfiles('Missed') || [];
          setPlannedCount(plannedProfiles.length);
          setDoneCount(doneProfiles.length);
          setMissedCount(missedProfiles.length);
        } else {
          console.error("Error: No profile data available or response is malformed.");
          // Optionally, you can set a fallback or handle empty state:
          setPlannedCount(0);
          setDoneCount(0);
          setMissedCount(0)

        };
  }, [allProfilesData]);

  useEffect(() => {
    fetchProfileData();
  }, [currentPage, rangeEnd, rangeStart]);

  const fetchProfileData = async () => {
    try {

      if (!token) {
        console.warn('No token found in session storage.');
        return;
      }

      // Replace with your actual profile API endpoint
      const response = await axios.get(`${backendUrl}/college/leads/my-followups?page=${currentPage}&fromDate=${rangeStart}&toDate=${rangeEnd}`, {
        headers: {
          'x-auth': token,
        },
      });
      console.log('Backend profile data:', response.data);
      if (response.data.success && response.data.data) {
        const data = response.data.data; // create array 
        setAllProfiles(response.data.data);
        setAllProfilesData(response.data.data)
        setTotalPages(response.data.totalPages);

        
      } else {
        console.error('Failed to fetch profile data', response.data.message);
      }
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

  const handleCrmFilterClick = (status, index) => {

    setCurrentPage(1);

    // Filter karo jisme leadStatus._id match ho
    const filteredProfiles = allProfilesData.filter(profile => {
      return profile._leadStatus && profile.followupStatus === status;
    });


    setActiveCrmFilter(index)
    setAllProfiles(filteredProfiles);
    // Calculate total pages
    const totalPages = Math.ceil(filteredProfiles.length / pageSize);
    setTotalPages(totalPages > 0 ? totalPages : 1);


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

    if (profile) {
      setSelectedProfile(profile);
    }

    // Close all panels first
    setShowEditPanel(false);
    setCalendarModal(false)
    setShowFollowupPanel(false);
    setShowWhatsappPanel(false);

    if (panel === 'StatusChange') {
      if (profile) {
        const newStatus = profile?._leadStatus?._id || '';
        setSelectedStatus(newStatus);

        if (newStatus) {
          await fetchSubStatus(newStatus);
        }

        setSelectedSubStatus(profile?.selectedSubstatus || '');
      }
      setShowEditPanel(true);
    }
    else if (panel === 'SetFollowup') {
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
    setCalendarModal(true)

    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };
  const openWhatsappPanel = () => {
    setCalendarModal(false)
    setShowEditPanel(false);
    setShowFollowupPanel(false);



    setShowWhatsappPanel(true);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  const closeWhatsappPanel = () => {
    setShowWhatsappPanel(false);
    setShowFollowupPanel(false);
    setShowEditPanel(false);


    setCalendarModal(true)

    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  const openleadHistoryPanel = async (profile = null) => {
    setCalendarModal(false)
    setShowWhatsappPanel(false);
    setShowEditPanel(false);
    setShowFollowupPanel(false);




    if (profile) {
      // Set selected profile
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

  const toggleLeadDetails = (profileIndex) => {
    setLeadDetailsVisible(prev => prev === profileIndex ? null : profileIndex);
  };

  const closeleadHistoryPanel = () => {
    setLeadHistoryPanel(false)
    if (!isMobile) {
      setMainContentClass('col-8');
    }
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

  const FollowupCalendar = () => {


    // Constants
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Range presets
    const rangePresets = [
      { value: 'custom', label: 'Custom Range', days: null, icon: '🎯' },
      { value: '7days', label: '7 Days', days: 7, icon: '📅' },
      { value: '15days', label: '15 Days', days: 15, icon: '📋' },
      { value: '20days', label: '20 Days', days: 20, icon: '🗓️' },
      { value: '30days', label: '30 Days', days: 30, icon: '📊' },
      { value: '60days', label: '60 Days', days: 60, icon: '📈' },
      { value: '90days', label: '90 Days', days: 90, icon: '📉' },
      { value: 'currentMonth', label: 'Current Month', days: null, icon: '🌟' },
      { value: 'lastMonth', label: 'Last Month', days: null, icon: '⬅️' },
      { value: 'nextMonth', label: 'Next Month', days: null, icon: '➡️' },
    ];

    // Utility functions
    const generateYears = () => {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = currentYear - 10; i <= currentYear + 10; i++) {
        years.push(i);
      }
      return years;
    };

    const generateCalendarDays = () => {
      const firstDay = new Date(currentYear, currentMonth, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      const days = [];
      for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        days.push(currentDate);
      }
      return days;
    };

    const formatDate = (date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Date checking functions
    const isToday = (date) => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    const isCurrentMonth = (date) => {
      return date.getMonth() === currentMonth;
    };

    const hasFollowup = (date) => {
      return followupDates.some(followup =>
        followup.date.toDateString() === date.toDateString()
      );
    };

    const getFollowupForDate = (date) => {
      return followupDates.find(followup =>
        followup.date.toDateString() === date.toDateString()
      );
    };

    const isSelected = (date) => {
      return selectedDate && selectedDate.toDateString() === date.toDateString();
    };

    const isInRange = (date) => {
      if (!rangeStart || !rangeEnd) return false;
      return date >= rangeStart && date <= rangeEnd;
    };

    // Range preset functions
    const setPresetRange = (presetValue) => {
      setRangePreset(presetValue);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let start, end;

      switch (presetValue) {
        case '7days':
        case '15days':
        case '20days':
        case '30days':
        case '60days':
        case '90days':
          const preset = rangePresets.find(p => p.value === presetValue);
          start = new Date(today);
          end = new Date(today);
          end.setDate(today.getDate() + preset.days - 1);
          break;

        case 'currentMonth':
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          break;

        case 'lastMonth':
          start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          end = new Date(today.getFullYear(), today.getMonth(), 0);
          break;

        case 'nextMonth':
          start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
          break;

        default: // custom
          return;
      }

      setRangeStart(start);
      setRangeEnd(end);
      setIsRangeMode(true);
    };

    const setCustomDaysRange = () => {
      if (!customDays || customDays < 1) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const start = new Date(today);
      const end = new Date(today);
      end.setDate(today.getDate() + parseInt(customDays) - 1);

      setRangeStart(start);
      setRangeEnd(end);
      setRangePreset('custom');
    };

    // Range and filtering functions
    const getFollowupsInRange = () => {
      if (!rangeStart || !rangeEnd) return [];

      return followupDates.filter(followup => {
        const followupDate = new Date(followup.date);
        followupDate.setHours(0, 0, 0, 0);
        const start = new Date(rangeStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(rangeEnd);
        end.setHours(0, 0, 0, 0);

        return followupDate >= start && followupDate <= end;
      });
    };

    const getFilteredFollowups = () => {
      const rangeFollowups = getFollowupsInRange();

      switch (selectedFilter) {
        case 'done':
          return rangeFollowups.filter(followup => followup.status === 'done');
        case 'missed':
          return rangeFollowups.filter(followup => followup.status === 'missed');
        case 'planned':
          return rangeFollowups.filter(followup => followup.status === 'planned');
        default:
          return rangeFollowups;
      }
    };

    const getStatusCounts = () => {
      const rangeFollowups = getFollowupsInRange();
      return {
        all: rangeFollowups.length,
        done: rangeFollowups.filter(f => f.status === 'done').length,
        missed: rangeFollowups.filter(f => f.status === 'missed').length,
        planned: rangeFollowups.filter(f => f.status === 'planned').length,
      };
    };

    const getRangeDays = () => {
      if (!rangeStart || !rangeEnd) return 0;
      const diffTime = Math.abs(rangeEnd - rangeStart);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    // Navigation functions
    const goToPreviousMonth = () => {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    };

    const goToNextMonth = () => {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    };

    const handleMonthChange = (e) => {
      setCurrentMonth(parseInt(e.target.value));
    };

    const handleYearChange = (e) => {
      setCurrentYear(parseInt(e.target.value));
    };

    // Event handlers
    const handleDateClick = (date) => {
      const clickedDate = new Date(date);
      clickedDate.setHours(0, 0, 0, 0);

      if (!isRangeMode) {
        setSelectedDate(new Date(clickedDate));
        return;
      }

      if (!rangeStart) {
        setRangeStart(new Date(clickedDate));
        setRangeEnd(null);
        setSelectedDate(null);
        setRangePreset('custom');
      } else if (!rangeEnd) {
        if (clickedDate >= rangeStart) {
          setRangeEnd(new Date(clickedDate));
        } else {
          setRangeEnd(new Date(rangeStart));
          setRangeStart(new Date(clickedDate));
        }
        setRangePreset('custom');
      } else {
        setRangeStart(new Date(clickedDate));
        setRangeEnd(null);
        setRangePreset('custom');
      }
    };

    const toggleRangeMode = () => {
      setIsRangeMode(!isRangeMode);
      setRangeStart(null);
      setRangeEnd(null);
      setSelectedDate(null);
      setSelectedFilter('all');
      setRangePreset('custom');
    };

    const clearRange = () => {
      setRangeStart(null);
      setRangeEnd(null);
      setSelectedFilter('all');
      setRangePreset('custom');
    };

    // Generate data for rendering
    const calendarDays = generateCalendarDays();
    const years = generateYears();
    const statusCounts = getStatusCounts();

    const getDayClasses = (date) => {
      const followup = getFollowupForDate(date);
      const isCurrentMonthDate = isCurrentMonth(date);
      const isTodayDate = isToday(date);
      const isSelectedDate = isSelected(date);
      const hasFollowupDate = hasFollowup(date);
      const isInRangeDate = isInRange(date);
      const isRangeStartDate = rangeStart && date.toDateString() === rangeStart.toDateString();
      const isRangeEndDate = rangeEnd && date.toDateString() === rangeEnd.toDateString();

      let classes = ['calendar-day', 'position-relative', 'text-center', 'p-2', 'border', 'cursor-pointer'];

      if (isRangeMode) {
        if (!isCurrentMonthDate) {
          classes.push('text-muted', 'bg-light');
        } else {
          classes.push('text-dark', 'bg-white');
        }
      } else {
        if (!isCurrentMonthDate) {
          classes.push('text-muted', 'bg-light');
        } else {
          classes.push('text-dark', 'bg-white');
        }
      }

      if (isTodayDate) {
        classes.push('today');
      }

      if (isSelectedDate) {
        classes.push('selected');
      }

      if (hasFollowupDate && followup) {
        if (followup.status === 'planned') {
          classes.push('followup-planned');
        } else if (followup.status === 'done') {
          classes.push('followup-done');
        } else if (followup.status === 'missed') {
          classes.push('followup-missed');
        }
      }

      if (isInRangeDate) {
        classes.push('in-range');
      }

      if (isRangeStartDate || isRangeEndDate) {
        classes.push('range-endpoint');
      }

      return classes.join(' ');
    };


    const panelContent = (
      <>
        <div className="calendar-container rounded">
          <div className="card shadow">
            <div className="card-body">

              {/* Header */}
              <div className="border-bottom pb-3 mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <span className="me-3 fs-5">📅</span>
                    <span className="fs-5 fw-bold text-dark">Followup Calendar</span>
                  </div>

                </div>
              </div>

              {/* Preset Range Controls */}
              <div className="mb-4 p-3 bg-primary bg-opacity-10 rounded">
                <div className="row g-2 mb-3">
                  <div className="col-md-12">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <label className="form-label small fw-semibold mb-0">Quick Range Selection:</label>
                      {(rangeStart || rangeEnd) && (
                        <button
                          onClick={clearRange}
                          className="btn btn-outline-danger btn-sm"
                        >
                          Clear Range
                        </button>
                      )}
                    </div>

                    <div className="preset-buttons-grid">
                      {rangePresets.map(preset => (
                        <button
                          key={preset.value}
                          className={`preset-btn ${rangePreset === preset.value ? 'active' : ''}`}
                          onClick={() => setPresetRange(preset.value)}
                          disabled={preset.value === 'custom'}
                        >
                          <span className="preset-icon">{preset.icon}</span>
                          <span className="preset-label">{preset.label}</span>

                        </button>
                      ))}
                    </div>

                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="d-flex justify-content-between align-items-center mb-4 py-2">
                <button
                  onClick={goToPreviousMonth}
                  className="btn btn-outline-secondary"
                >
                  ←
                </button>

                <div className="d-flex gap-2">
                  <select
                    value={currentMonth}
                    onChange={handleMonthChange}
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                  >
                    {monthNames.map((month, index) => (
                      <option key={index} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>

                  <select
                    value={currentYear}
                    onChange={handleYearChange}
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                  >
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={goToNextMonth}
                  className="btn btn-outline-secondary"
                >
                  →
                </button>
              </div>

              {/* Range Info with Stats */}
              {isRangeMode && rangeStart && (
                <div className="mb-3 p-3 range-stats">
                  <div className="row">
                    <div className="col-md-8">
                      <h6 className="mb-1">📅 Selected Range:</h6>
                      <p className="mb-0 small text-white">
                        <strong>{formatDate(rangeStart)}</strong>
                        {rangeEnd ? ` to ${formatDate(rangeEnd)}` : ' (select end date)'}
                      </p>
                    </div>
                    <div className="col-md-4 text-end">
                      {rangeEnd && (
                        <div>
                          <div className="fw-bold fs-4">{getRangeDays()}</div>
                          <div className="small">Days Selected</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Week Days Header */}
              <div className="calendar-grid mb-2">
                {weekDays.map(day => (
                  <div key={day} className="week-header">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className={`calendar-grid ${isRangeMode ? 'range-selection-mode' : ''}`}>
                {calendarDays.map((date, index) => {
                  const followup = getFollowupForDate(date);
                  const isCurrentMonthDate = isCurrentMonth(date);
                  const hasFollowupDate = hasFollowup(date);

                  let dayClasses = getDayClasses(date);
                  if (isRangeMode) {
                    dayClasses += ' range-mode';
                  }

                  return (
                    <div
                      key={index}
                      className={dayClasses}
                      onClick={() => handleDateClick(date)}
                      title={isRangeMode ?
                        (!rangeStart ? 'Click to set range start' :
                          !rangeEnd ? 'Click to set range end' :
                            'Click to start new range') :
                        `${formatDate(date)}${hasFollowupDate ? ` - ${followup?.title}` : ''}`
                      }
                    >
                      {date.getDate()}
                      {hasFollowupDate && isCurrentMonthDate && followup && (
                        <div className={`followup-indicator ${followup.status}`}>
                          {followup.status === 'done' ? '✓' : followup.status === 'missed' ? '✗' : '○'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Date Info */}
              {selectedDate && !isRangeMode && (
                <div className="mt-4 p-3 bg-info bg-opacity-10 rounded">
                  <p className="mb-0 small">Selected Date: <strong>{formatDate(selectedDate)}</strong></p>
                </div>
              )}
            </div>
          </div>
        </div>

        <style>
          {`
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
          }
          
          .calendar-day {
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            transition: all 0.2s;
            border-radius: 4px;
          }
          
          .calendar-day:hover {
            background-color: #e9ecef !important;
            transform: scale(1.05);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .calendar-day.range-mode:hover {
            background-color: #cfe2ff !important;
            border-color: #0d6efd !important;
          }
          
          .calendar-day.today {
            background-color: #cfe2ff !important;
            color: #0a58ca !important;
            font-weight: bold;
            border: 2px solid #0d6efd !important;
          }
          
          .calendar-day.selected {
            background-color: #fd7e14 !important;
            color: white !important;
            font-weight: bold;
          }
          
          .calendar-day.followup-planned {
            background-color: #fff3cd !important;
            border-color: #ffc107 !important;
          }
          
          .calendar-day.followup-done {
            background-color: #d1e7dd !important;
            border-color: #198754 !important;
          }
          
          .calendar-day.followup-missed {
            background-color: #f8d7da !important;
            border-color: #dc3545 !important;
          }
          
          .calendar-day.in-range {
            background-color: #cfe2ff !important;
            border-color: #0d6efd !important;
          }
          
          .calendar-day.range-endpoint {
            background-color: #0d6efd !important;
            color: white !important;
            font-weight: bold;
          }
          
          .week-header {
            background-color: #e9ecef;
            padding: 8px;
            font-size: 0.75rem;
            font-weight: bold;
            color: #6c757d;
            text-align: center;
          }
          
          .followup-indicator {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            font-size: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
          }
          
          .followup-indicator.done {
            background-color: #198754;
          }
          
          .followup-indicator.missed {
            background-color: #dc3545;
          }
          
          .followup-indicator.planned {
            background-color: #ffc107;
          }
          
          .cursor-pointer {
            cursor: pointer;
          }
          
          .range-stats {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
          }
          
          .range-selection-mode {
            border: 2px dashed #0d6efd;
            border-radius: 8px;
            background: rgba(13, 110, 253, 0.05);
            padding: 4px;
          }
          
          .calendar-day.range-mode {
            position: relative;
          }
          
          .calendar-day.range-mode::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border: 2px solid transparent;
            border-radius: 6px;
            transition: all 0.2s;
          }
          
          .calendar-day.range-mode:hover::after {
            border-color: #0d6efd;
            background: rgba(13, 110, 253, 0.1);
          }

          /* Preset Buttons Styling */
          .preset-buttons-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(45px, 1fr));
            gap: 8px;
            margin-bottom: 12px;
          }
          
          .preset-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px 8px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            background: white;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            min-height: 70px;
          }
          
          .preset-btn:hover {
            border-color: #0d6efd;
            background: #f8f9fa;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
          }
          
          .preset-btn.active {
            border-color: #0d6efd;
            background: linear-gradient(135deg, #0d6efd 0%, #6610f2 100%);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(13, 110, 253, 0.3);
          }
          
          .preset-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            border-color: #dee2e6;
            background: #f8f9fa;
          }
          
          .preset-btn:disabled:hover {
            transform: none;
            box-shadow: none;
          }
          
          .preset-icon {
            font-size: 1.2em;
            margin-bottom: 4px;
          }
          
          .preset-label {
            font-size: 0.75rem;
            font-weight: 600;
            text-align: center;
            line-height: 1.2;
          }
          
          .preset-days {
            position: absolute;
            top: 4px;
            right: 4px;
            background: #ffc107;
            color: #000;
            font-size: 0.6rem;
            padding: 2px 4px;
            border-radius: 8px;
            font-weight: bold;
          }
          
          .preset-btn.active .preset-days {
            background: rgba(255, 255, 255, 0.9);
            color: #0d6efd;
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .preset-buttons-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            
            .preset-btn {
              min-height: 60px;
              padding: 8px 6px;
            }
            
            .preset-label {
              font-size: 0.7rem;
            }
          }
          
          @media (max-width: 480px) {
            .preset-buttons-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
        </style>
      </>
    );

    if (isMobile) {
      return (
        <div
          className={`modal ${showCalendarModal ? 'show d-block' : 'd-none'}`}
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

    return showCalendarModal ? (
      <div className="col-12 transition-col" id="editFollowupPanel">
        {panelContent}
      </div>
    ) : null;
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
              {/* <i className="fa-solid fa-xmark"></i> */}
            </button>
          </div>
        </div>

        <div className="card-body">
          <form>

            {!showFollowupPanel && (
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


            {((seletectedSubStatus && seletectedSubStatus.hasFollowup) || showFollowupPanel) && (

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

            {((seletectedSubStatus && seletectedSubStatus.hasRemarks) || showFollowupPanel) && (

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
                onClick={closeEditPanel}
              >
                CLOSE
              </button>
              <button
                type="submit"
                className="btn text-white"
                onClick={handleUpdateStatus}
                style={{ backgroundColor: '#fd7e14', border: 'none', padding: '8px 24px', fontSize: '14px' }}
              >

                {showEditPanel && 'UPDATE STATUS'}
                {showFollowupPanel && 'SET FOLLOWUP '}
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
              onClick={closeWhatsappPanel}
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
      return (
        <div
          className={`modal ${showWhatsappPanel ? 'show d-block' : 'd-none'}`}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeWhatsappPanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxHeight: '90vh' }}>
            <div className="modal-content" style={{ height: '80vh' }}>
              {panelContent}
            </div>
          </div>
        </div>
      );
    }

    return showWhatsappPanel ? (
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
          <button className="btn-close" type="button" onClick={closeleadHistoryPanel}>
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
                          <div className="d-flex justify-content-between align-items-start mb-2">
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
    <div className="container-fluid">
      <div className="row">
        <div className={isMobile ? 'col-12' : mainContentClass}>

          {/* Header */}
          <div className="bg-white shadow-sm border-bottom mb-3 sticky-top stickyBreakpoints" >
            <div className="container-fluid py-2 " >
              <div className="row align-items-center">
                <div className="col-md-6 d-md-block d-sm-none">
                  <div className="d-flex align-items-center">
                    <h4 className="fw-bold text-dark mb-0 me-3">My Followups</h4>
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb mb-0 small">
                        <li className="breadcrumb-item">
                          <a href="#" className="text-decoration-none">Home</a>
                        </li>
                        <li className="breadcrumb-item active">My Followups</li>
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
                          onClick={() => {
                            setFilterData(prev => ({ ...prev, name: '' }));
                            setAllProfiles(allProfilesData);
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
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


                    <div key={0} className="d-flex align-items-center gap-1">
                      <div className='d-flex'>
                        <button
                          className={`btn btn-sm ${activeCrmFilter === 0 ? 'btn-primary' : 'btn-outline-secondary'} position-relative`}
                          onClick={() => handleCrmFilterClick('Planned', 0)}

                        >
                          Planned Followups
                          <span className={`ms-1 ${activeCrmFilter === 0 ? 'text-white' : 'text-dark'}`}>
                            {plannedCount}
                          </span>
                        </button>


                      </div>

                    </div>

                    <div key={1} className="d-flex align-items-center gap-1">
                      <div className='d-flex'>
                        <button
                          className={`btn btn-sm ${activeCrmFilter === 1 ? 'btn-primary' : 'btn-outline-secondary'} position-relative`}
                          onClick={() => handleCrmFilterClick('Done', 1)}

                        >
                          Done Followups
                          <span className={`ms-1 ${activeCrmFilter === 1 ? 'text-white' : 'text-dark'}`}>
                          {doneCount}
                          </span>
                        </button>


                      </div>

                    </div>

                    <div key={2} className="d-flex align-items-center gap-1">
                      <div className='d-flex'>
                        <button
                          className={`btn btn-sm ${activeCrmFilter === 2 ? 'btn-primary' : 'btn-outline-secondary'} position-relative`}
                          onClick={() => handleCrmFilterClick('Missed', 2)}

                        >
                          Missed Followups
                          <span className={`ms-1 ${activeCrmFilter === 2 ? 'text-white' : 'text-dark'}`}>
                            {missedCount}
                          </span>
                        </button>


                      </div>

                    </div>

                  </div>

                </div>

              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {/* Advanced Filters - Improved Design */}
          {!isFilterCollapsed && (
            <div className="bg-white border-bottom shadow-sm">
              <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-filter text-primary me-2"></i>
                    <h5 className="fw-bold mb-0 text-dark">Advanced Filters</h5>
                    <span className="bg-light text-dark ms-2">
                      {Object.values(filterData).filter(val => val && val !== 'true').length} Active
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => {
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
                      }}
                    >
                      <i className="fas fa-times-circle me-1"></i>
                      Clear All
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setIsFilterCollapsed(true)}
                    >
                      <i className="fas fa-chevron-up"></i>
                    </button>
                  </div>
                </div>

                <div className="row g-4">

                  <div className="col-md-4">
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
                      <i className="fas fa-chevron-down position-absolute top-50 end-0 translate-middle-y me-3 text-muted" style={{ pointerEvents: 'none' }}></i>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-dark">
                      <i className="fas fa-industry me-1 text-primary"></i>
                      Sector
                    </label>
                    <div className="position-relative">
                      <select
                        className="form-select"
                        name="sector"
                        value={filterData.sector}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Sectors</option>
                        <option value="Tourism and Hospitality">🏨 Tourism & Hospitality</option>
                        <option value="Information Technology">💻 Information Technology</option>
                        <option value="Healthcare">🏥 Healthcare</option>
                        <option value="Finance">💳 Finance</option>
                      </select>
                      <i className="fas fa-chevron-down position-absolute top-50 end-0 translate-middle-y me-3 text-muted" style={{ pointerEvents: 'none' }}></i>
                    </div>
                  </div>

                  {/* Date Range */}
                  {/* Date Filters Section */}
                  {/* REPLACE your existing Date Filters Section with this */}
                  {/* Date Filters Section - Facebook Style */}
                  <div className="col-12">
                    <div className="row g-4">
                      {/* Created Date Range */}
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-calendar-plus me-1 text-success"></i>
                          Lead Creation Date Range
                        </label>
                        <div className="card border-0 bg-light p-3">
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label small">From Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'createdFromDate')}
                                value={filterData.createdFromDate}
                                format="dd/MM/yyyy"
                                className="form-control"
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
                                className="form-control"
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
                                className="form-control"
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
                                className="form-control"
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
                                className="form-control"
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
                                className="form-control"
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
                  </div>

                  {/* Update the Clear All button in your existing filters section */}
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={clearAllFilters}
                  >
                    <i className="fas fa-times-circle me-1"></i>
                    Clear All Filters
                  </button>

                  {/* Update the results summary section */}
                  <div className="text-muted small">
                    <i className="fas fa-info-circle me-1"></i>
                    Showing {allProfiles.length} of {allProfilesData.length} results

                    {/* Active filter indicators */}
                    {(filterData.createdFromDate || filterData.createdToDate) && (
                      <div className="mt-1">
                        <span className="bg-success me-2">
                          <i className="fas fa-calendar-plus me-1"></i>
                          Created:
                          {filterData.createdFromDate && ` From ${formatDate(filterData.createdFromDate)}`}
                          {filterData.createdFromDate && filterData.createdToDate && ' to '}
                          {filterData.createdToDate && formatDate(filterData.createdToDate)}
                        </span>
                      </div>
                    )}

                    {(filterData.modifiedFromDate || filterData.modifiedToDate) && (
                      <div className="mt-1">
                        <span className="bg-warning me-2">
                          <i className="fas fa-calendar-edit me-1"></i>
                          Modified:
                          {filterData.modifiedFromDate && ` From ${formatDate(filterData.modifiedFromDate)}`}
                          {filterData.modifiedFromDate && filterData.modifiedToDate && ' to '}
                          {filterData.modifiedToDate && formatDate(filterData.modifiedToDate)}
                        </span>
                      </div>
                    )}

                    {(filterData.nextActionFromDate || filterData.nextActionToDate) && (
                      <div className="mt-1">
                        <span className="bg-info me-2">
                          <i className="fas fa-calendar-check me-1"></i>
                          Next Action:
                          {filterData.nextActionFromDate && ` From ${formatDate(filterData.nextActionFromDate)}`}
                          {filterData.nextActionFromDate && filterData.nextActionToDate && ' to '}
                          {filterData.nextActionToDate && formatDate(filterData.nextActionToDate)}
                        </span>
                      </div>
                    )}
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
                      onClick={() => applyFilters()}
                    >
                      <i className="fas fa-search me-1"></i>
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="content-body">
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
                                        {/* <button
                                        className="btn btn-outline-success btn-sm border-0"
                                        onClick={openWhatsappPanel}
                                        style={{ fontSize: '20px' }}
                                        title="WhatsApp"
                                      >
                                        <i className="fab fa-whatsapp"></i>
                                      </button> */}
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
                                              zIndex: 999,
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
                                            onClick={() => alert("Reffer")}
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

                                            onClick={() => {
                                              openleadHistoryPanel(profile);
                                              console.log('selectedProfile', profile);
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
                                              console.log('selectedProfile', profile);
                                            }}
                                          >
                                            Set Followup
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
                                              zIndex: 999,
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
                                            onClick={() => alert("Reffer")}
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
                                              <div className="info-value">{profile._course?.state}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">City</div>
                                              <div className="info-value">{profile._course?.city}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">BRANCH NAME</div>
                                              <div className="info-value">PSD Chandauli Center</div>
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
                                                    <div className="info-value">{profile._course?.state}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">City</div>
                                                    <div className="info-value">{profile._course?.city}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">BRANCH NAME</div>
                                                    <div className="info-value">PSD Chandauli Center</div>
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
                                                  <div className="info-group">
                                                    <div className="info-label">Counsellor Name</div>
                                                    <div className="info-value">{profile._course?.counslername}</div>
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
                                                    <div className="info-value">{profile._course?.state}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">CITY</div>
                                                    <div className="info-value">{profile._course?.city}</div>
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
                                                    <div className="info-label">BATCH NAME</div>
                                                    <div className="info-value">{profile._course?.batchName || 'N/A'}</div>
                                                  </div>
                                                </div>

                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">BRANCH NAME</div>
                                                    <div className="info-value">{profile._course?.college || 'N/A'}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">NEXT ACTION DATE</div>
                                                    <div className="info-value">
                                                      {profile.followups?.length > 0
                                                        ?
                                                        (() => {
                                                          const dateObj = new Date(profile.followups[profile.followups.length - 1].date);
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
                                                        })()
                                                        : 'N/A'}
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
                                                    <div className="info-label">LEAD MODIFICATION BY</div>
                                                    <div className="info-value">{profile.logs?.length ? profile.logs[profile.logs.length - 1]?.user?.name || '' : ''}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">Counsellor Name</div>
                                                    <div className="info-value">{profile._course?.counslername}</div>
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
                                  {/* {activeTab === 1 && ( */}
                                  {(activeTab[profileIndex] || 0) === 1 && (
                                    <div className="tab-pane active" id="profile">
                                      <div className="resume-preview-body">
                                        <div id="resume-download" className="resume-document">

                                          <div className="resume-document-header">
                                            <div className="resume-profile-section">
                                              {user?.image ? (
                                                <img
                                                  src={`${bucketUrl}/${user.image}`}
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
                                                    {profile._candidate.personalInfo.skills.map((skill, index) => (
                                                      <div className="resume-skill-item" key={`resume-skill-${index}`}>
                                                        <div className="resume-skill-name">{skill.skillName || skill}</div>
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



                                              {profile._candidate?.personalInfo?.languages?.length > 0 && (
                                                <div className="resume-section">
                                                  <h2 className="resume-section-title">Languages</h2>
                                                  <div className="resume-languages-list">
                                                    {profile._candidate.personalInfo.languages.map((lang, index) => (
                                                      <div className="resume-language-item" key={`resume-lang-${index}`}>
                                                        <div className="resume-language-name">{lang.name || lang.lname || lang}</div>
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
                                                              <button className="action-btn upload-btn" title="Upload Document" onClick={() => {
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

                                            <DocumentModal />
                                            <UploadModal />
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
            <div className="row sticky-top stickyBreakpoints">
              {renderEditPanel()}
              {FollowupCalendar()}
              {renderWhatsAppPanel()}
              {renderLeadHistoryPanel()}
            </div>
          </div>
        )}

        {/* Mobile Modals */}
        {isMobile && renderEditPanel()}
        {isMobile && FollowupCalendar()}
        {isMobile && renderWhatsAppPanel()}
        {isMobile && renderLeadHistoryPanel()}
      </div>
      <style>
        {
          `
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

.stickyBreakpoints {
    position: sticky;
    top: 20px;
    /* default top */
    z-index: 11;
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


        `
        }
      </style>
    </div>
  );
};

export default MyFollowups;

