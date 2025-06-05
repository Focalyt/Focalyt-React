import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import FollowupCalendar from './FollowupCalender';
const MyFollowup = () => {
    // NEW: Main and Sub tabs state
    const [activeMainTab, setActiveMainTab] = useState(0);
    const [activeSubTab, setActiveSubTab] = useState(0);
    const [user, setUser] = useState({
        image: '',
        name: 'John Doe'
    });

    const [experiences, setExperiences] = useState([{
        jobTitle: '',
        companyName: '',
        from: null,
        to: null,
        jobDescription: '',
        currentlyWorking: false
    }]);


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


    // Main tabs configuration
    const mainTabs = [
        {
            id: 0,
            label: 'Follow Up',
            count: 2,
            subTabs: [
                { id: 0, label: 'All', count: 2 },
                { id: 1, label: 'Done Followups', count: 0 },
                { id: 2, label: 'Missed Followups', count: 0 },
                { id: 3, label: 'Planned Followups', count: 2 }
            ]
        },
        // {
        //     id: 1,
        //     label: 'Interview Schedule',
        //     count: 0,
        //     subTabs: [
        //         { id: 0, label: 'All Interviews', count: 0 },
        //         { id: 1, label: 'Scheduled', count: 0 },
        //         { id: 2, label: 'Completed', count: 0 },
        //         { id: 3, label: 'Cancelled', count: 0 }
        //     ]
        // }
    ];


    // Tab handlers
    const handleMainTabClick = (tabId) => {
        setActiveMainTab(tabId);
        setActiveSubTab(0); // Reset sub tab to first one
    };

    const handleSubTabClick = (subTabId) => {
        setActiveSubTab(subTabId);
    };


    // EXISTING CODE STARTS HERE
    const [activeTab, setActiveTab] = useState({});
    const [showPopup, setShowPopup] = useState(null);
    const [activeCrmFilter, setActiveCrmFilter] = useState(0);
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [showFollowupPanel, setShowFollowupPanel] = useState(false);
    const [showWhatsappPanel, setShowWhatsappPanel] = useState(false);
    const [mainContentClass, setMainContentClass] = useState('col-8'); // CHANGED from col-12 to col-9
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

    // Static document data for demonstration
    const staticDocuments = [
        {
            _id: 'doc1',
            Name: 'Aadhaar Card',
            uploads: [{
                _id: 'upload1',
                fileUrl: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=400',
                uploadedAt: new Date('2024-01-15'),
                status: 'Pending'
            }]
        },
        {
            _id: 'doc2',
            Name: 'PAN Card',
            uploads: [{
                _id: 'upload2',
                fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
                uploadedAt: new Date('2024-01-16'),
                status: 'Verified'
            }]
        },
        {
            _id: 'doc3',
            Name: '10th Marksheet',
            uploads: [{
                _id: 'upload3',
                fileUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
                uploadedAt: new Date('2024-01-17'),
                status: 'Rejected'
            }]
        },
        {
            _id: 'doc4',
            Name: '12th Marksheet',
            uploads: []
        },
        {
            _id: 'doc5',
            Name: 'Passport Photo',
            uploads: [{
                _id: 'upload5',
                fileUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
                uploadedAt: new Date('2024-01-18'),
                status: 'Verified'
            }]
        }
    ];

    // Static profile data
    const staticProfileData = [
        {
            _id: 'profile1',
            _candidate: {
                name: 'Rahul Sharma',
                mobile: '+91 9876543210',
                email: 'rahul.sharma@email.com',
                documents: staticDocuments
            },
            _leadStatus: { _id: 'status1', title: 'Hot Lead' },
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-20'),
            _course: {
                name: 'Full Stack Development',
                sectors: 'Information Technology'
            }
        }
    ];

    // Initialize data
    useEffect(() => {
        setAllProfiles(staticProfileData);
        setAllProfilesData(staticProfileData);
    }, []);


    const [animateNextAction, setAnimateNextAction] = useState(false);
    useEffect(() => {
        setAnimateNextAction(true);
        const timer = setTimeout(() => {
            setAnimateNextAction(false);
        }, 3000); // Animation duration

        return () => clearTimeout(timer);
    }, [allProfiles]);

    // Document functions
    const openDocumentModal = (document) => {
        setSelectedDocument(document);
        setShowDocumentModal(true);
        setDocumentZoom(1);
        setDocumentRotation(0);
        document.body?.classList.add('no-scroll');
    };

    const closeDocumentModal = () => {
        setShowDocumentModal(false);
        setSelectedDocument(null);
        setShowRejectionForm(false);
        setRejectionReason('');
        document.body?.classList.remove('no-scroll');
    };

    const zoomIn = () => {
        setDocumentZoom(prev => prev + 0.1);
    };

    const zoomOut = () => {
        setDocumentZoom(prev => prev > 0.5 ? prev - 0.1 : prev);
    };

    const rotateDocument = () => {
        setDocumentRotation(prev => (prev + 90) % 360);
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

    const filterDocuments = (documents = []) => {
        if (statusFilter === 'all') return documents;

        return documents.filter(doc => {
            // agar doc.uploads undefined ya empty array hai
            if (!doc.uploads || doc.uploads.length === 0) return statusFilter === 'none';

            // agar doc.uploads valid hai
            const lastUpload = doc.uploads[doc.uploads.length - 1];
            // agar lastUpload ya status undefined ho
            if (!lastUpload || !lastUpload.status) return false;

            return lastUpload.status.toLowerCase() === statusFilter;
        });
    };

    const getDocumentCounts = (documents) => {
        const totalDocs = documents.length;
        const uploadedDocs = documents.filter(doc => doc.uploads.length > 0).length;
        const pendingDocs = documents.filter(doc =>
            doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Pending'
        ).length;
        const verifiedDocs = documents.filter(doc =>
            doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Verified'
        ).length;
        const rejectedDocs = documents.filter(doc =>
            doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Rejected'
        ).length;

        return { totalDocs, uploadedDocs, pendingDocs, verifiedDocs, rejectedDocs };
    };

    // Document Modal Component
    const DocumentModal = () => {
        if (!showDocumentModal || !selectedDocument) return null;

        const latestUpload = selectedDocument.uploads.length > 0 ? selectedDocument.uploads[selectedDocument.uploads.length - 1] : null;

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
                                {latestUpload ? (
                                    <>
                                        <img
                                            src={latestUpload.fileUrl}
                                            alt="Document Preview"
                                            style={{
                                                transform: `scale(${documentZoom}) rotate(${documentRotation}deg)`,
                                                transition: 'transform 0.3s ease',
                                                maxWidth: '100%',
                                                objectFit: 'contain'
                                            }}
                                        />
                                        <div className="preview-controls">
                                            <button onClick={() => setDocumentZoom(prev => prev + 0.1)} className="control-btn" style={{ whiteSpace: 'nowrap' }}>
                                                <i className="fas fa-search-plus"></i> Zoom In
                                            </button>
                                            <button onClick={() => setDocumentZoom(prev => prev - 0.1)} className="control-btn" style={{ whiteSpace: 'nowrap' }}>
                                                <i className="fas fa-search-minus"></i> Zoom Out
                                            </button>
                                            <button onClick={() => setDocumentRotation(prev => prev + 90)} className="control-btn" style={{ whiteSpace: 'nowrap' }}>
                                                <i className="fas fa-redo"></i> Rotate
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="no-document">
                                        <i className="fas fa-file-times fa-3x text-muted mb-3"></i>
                                        <p>No document uploaded</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="document-info-section">
                            <div className="info-card">
                                <h4>Document Information</h4>
                                <div className="info-row">
                                    <strong>Document Name:</strong> {selectedDocument.Name}
                                </div>
                                <div className="info-row">
                                    <strong>Upload Date:</strong> {latestUpload ? formatDate(latestUpload.uploadedAt) : 'N/A'}
                                </div>
                                <div className="info-row">
                                    <strong>Status:</strong>
                                    <span className={`${getStatusBadgeClass(latestUpload?.status)} ms-2`}>
                                        {latestUpload?.status || 'No Uploads'}
                                    </span>
                                </div>
                            </div>

                            {latestUpload?.status === 'Pending' && (
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

                                    {!showRejectionForm ? (
                                        <div className="action-buttons">
                                            <button
                                                className="btn btn-success me-2"
                                                onClick={() => updateDocumentStatus(latestUpload._id, 'Verified')}
                                            >
                                                <i className="fas fa-check"></i> Approve Document
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => setShowRejectionForm(true)}
                                            >
                                                <i className="fas fa-times"></i> Reject Document
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="rejection-form">
                                            <h4>Provide Rejection Reason</h4>
                                            <textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="Please provide a detailed reason for rejection..."
                                                rows="4"
                                                className="form-control mb-3"
                                            />
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => updateDocumentStatus(latestUpload._id, 'Rejected')}
                                                >
                                                    Confirm Rejection
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => setShowRejectionForm(false)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedDocument.uploads.length > 0 && (
                                <div className="info-card">
                                    <h4>Document History</h4>
                                    <div className="document-history">
                                        {selectedDocument.uploads.map((upload, index) => (
                                            <div key={index} className="history-item">
                                                <div className="history-date">
                                                    {formatDate(upload.uploadedAt)}
                                                </div>
                                                <div className="history-status">
                                                    <span className={`${getStatusBadgeClass(upload.status)}`}>
                                                        {upload.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ALL OTHER EXISTING FUNCTIONS AND USEEFFECTS REMAIN EXACTLY THE SAME
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
        { _id: 'all', name: 'All', count: 2, milestone: '' },
        { _id: 'hot', name: 'Hot Lead', count: 1, milestone: 'Priority' },
        { _id: 'warm', name: 'Warm Lead', count: 1, milestone: '' },
    ]);
    const [statuses, setStatuses] = useState([
        { _id: 'hot', name: 'Hot Lead', count: 1 },
        { _id: 'warm', name: 'Warm Lead', count: 1 },
    ]);

    // edit status and set followup
    const [seletectedStatus, setSelectedStatus] = useState('');
    const [seletectedSubStatus, setSelectedSubStatus] = useState(null);
    const [followupDate, setFollowupDate] = useState('');
    const [followupTime, setFollowupTime] = useState('');
    const [remarks, setRemarks] = useState('');

    const [subStatuses, setSubStatuses] = useState([]);

    const bucketUrl = '';
    const backendUrl = '';

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
            // Update main content class based on mobile/desktop and panel state
            if (window.innerWidth <= 992) {
                setMainContentClass('col-12');
            } else {
                setMainContentClass(showEditPanel || showFollowupPanel ? 'col-6' : 'col-8');
            }
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);

        return () => window.removeEventListener('resize', checkIfMobile);
    }, [showEditPanel, showFollowupPanel]);

    // ALL OTHER EXISTING FUNCTIONS REMAIN THE SAME...
    // (Including fetchStatus, fetchSubStatus, handleUpdateStatus, etc.)

    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleDateString('en-GB');
    };

    // ALL OTHER EXISTING HANDLER FUNCTIONS...

    const handleTabClick = (profileIndex, tabIndex) => {
        setActiveTab(prevTabs => ({
            ...prevTabs,
            [profileIndex]: tabIndex
        }));
    };

    const openEditPanel = async (profile = null, panel) => {
        console.log('panel', panel);

        if (profile) {
            setSelectedProfile(profile);
        }

        // Close all panels first
        setShowEditPanel(false);
        setShowFollowupPanel(false);
        setShowWhatsappPanel(false);

        if (panel === 'StatusChange') {
            if (profile) {
                const newStatus = profile?._leadStatus?._id || '';
                setSelectedStatus(newStatus);

                if (newStatus) {
                    // await fetchSubStatus(newStatus);
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
            setMainContentClass('col-6');
        }
    };

    const closeEditPanel = () => {
        setShowEditPanel(false);
        setShowFollowupPanel(false);
        if (!isMobile) {
            setMainContentClass('col-9');
        }
    };

    const toggleLeadDetails = (profileIndex) => {
        setLeadDetailsVisible(prev => prev === profileIndex ? null : profileIndex);
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
                                            // onChange={handleStatusChange}
                                            >
                                                <option value="">Select Status</option>
                                                {statuses.map((filter, index) => (
                                                    <option key={index} value={filter._id}>{filter.name}</option>))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </>
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
                                style={{ backgroundColor: '#fd7e14', border: 'none', padding: '8px 24px', fontSize: '14px' }}
                            >
                                UPDATE STATUS
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

    return (
        <div className="container-fluid">
            <div className="row">
                {/* Main Content Area */}
                <div className={isMobile ? 'col-12' : mainContentClass}>

                    {/* NEW: Main Tabs */}
                    <div className="main-tabs-wrapper bg-white shadow-sm border-bottom mb-3">
                        <div className="container-fluid py-2">
                            <div className="d-flex">
                                {mainTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`main-tab ${activeMainTab === tab.id ? 'active' : ''}`}
                                        onClick={() => handleMainTabClick(tab.id)}
                                    >
                                        {tab.label} ({tab.count})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* NEW: Sub Tabs */}
                    <div className="sub-tabs-wrapper bg-white shadow-sm border-bottom mb-3">
                        <div className="container-fluid py-2">
                            <div className="d-flex flex-wrap align-items-center gap-3">
                                {mainTabs[activeMainTab]?.subTabs.map((subTab) => (
                                    <button
                                        key={subTab.id}
                                        className={`sub-tab ${activeSubTab === subTab.id ? 'active' : ''}`}
                                        onClick={() => handleSubTabClick(subTab.id)}
                                    >
                                        {subTab.label}({subTab.count})
                                    </button>
                                ))}


                            </div>
                        </div>
                    </div>

                    {/* EXISTING Header */}
                    <div className="bg-white shadow-sm border-bottom mb-3 sticky-top stickyBreakpoints" >
                        <div className="container-fluid py-2" >
                            <div className="row align-items-center">
                                <div className="col-md-6 d-md-block d-sm-none">
                                    <div className="d-flex align-items-center">
                                        <h4 className="fw-bold text-dark mb-0 me-3">Follow Up</h4>
                                        <nav aria-label="breadcrumb">
                                            <ol className="breadcrumb mb-0 small">
                                                <li className="breadcrumb-item">
                                                    <a href="#" className="text-decoration-none">Home</a>
                                                </li>
                                                <li className="breadcrumb-item active">Follow Up</li>
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
                                            // onChange={handleFilterChange}
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

                                {/* EXISTING CRM Filters */}
                                <div className="card-body p-3">
                                    <div className="d-flex flex-wrap gap-2 align-items-center">
                                        {crmFilters.map((filter, index) => (
                                            <div key={index} className="d-flex align-items-center gap-1">
                                                <div className='d-flex'>
                                                    <button
                                                        className={`btn btn-sm ${activeCrmFilter === index ? 'btn-primary' : 'btn-outline-secondary'} position-relative`}
                                                    // onClick={() => handleCrmFilterClick(filter._id, index)}
                                                    >
                                                        {filter.name}
                                                        <span className={`ms-1 ${activeCrmFilter === index ? 'text-white' : 'text-dark'}`}>
                                                            ({filter.count})
                                                        </span>
                                                    </button>

                                                    {filter.milestone && (
                                                        <span
                                                            className="bg-success d-flex align-items-center"
                                                            style={{
                                                                fontSize: '0.75rem', color: 'white', verticalAlign: 'middle', padding: '0.25em 0.5em', transform: 'translate(15%, -100%)',
                                                                position: 'absolute'
                                                            }}
                                                            title={`Milestone: ${filter.milestone}`}
                                                        >
                                                            🚩 <span style={{ marginLeft: '4px' }}>{filter.milestone}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* EXISTING Main Content */}
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
                                                                    <div className="col-md-7">
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="form-check me-3">
                                                                                <input className="form-check-input" type="checkbox" />
                                                                            </div>
                                                                            <div className="me-3">
                                                                                <div className="circular-progress-container" data-percent="40">
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

                                                                                <div className={`next-action-date ${animateNextAction ? 'animate-pulse' : ''}`}>
                                                                                    
                                                                                    <div className="next-action-value">
                                                                                        {profile.followupDate ?
                                                                                            new Date(profile.followupDate).toLocaleDateString('en-IN', {
                                                                                                day: '2-digit',
                                                                                                month: 'short',
                                                                                                year: 'numeric',
                                                                                                hour: '2-digit',
                                                                                                minute: '2-digit'
                                                                                            }) :
                                                                                            '06/05/2025 10:30 AM'
                                                                                        }
                                                                                    </div>
                                                                                </div>
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

                                                                    <div className="col-md-2 text-end">
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
                                                                                    >
                                                                                        Move To Admission List
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

                                                        {/* EXISTING Tab Navigation and Content Card */}
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

                                                                {/* Lead Details Tab Content */}
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
                                                                                                    <div className="info-value">{profile.followupDate ? new Date(profile.followupDate).toLocaleString() : 'N/A'}</div>
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

                                                                {/* profile  */}

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

                                                                {/* job history  */}

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

                                                                {/* course history  */}

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


                                                                {/* document  */}


                                                                {(activeTab[profileIndex] || 0) === 4 && (
                                                                    <div className="tab-pane active" id='studentsDocuments'>
                                                                        <div className="enhanced-documents-panel">




                                                                            {/* Enhanced Stats Grid */}
                                                                            <div className="stats-grid">
                                                                                {(() => {
                                                                                    const counts = getDocumentCounts(profile._candidate?.documents || staticDocuments);
                                                                                    return (
                                                                                        <>
                                                                                            <div className="stat-card total-docs">
                                                                                                <div className="stat-icon">
                                                                                                    <i className="fas fa-file-alt"></i>
                                                                                                </div>
                                                                                                <div className="stat-info">
                                                                                                    <h4>{profile?.docCounts?.totalRequired}</h4>
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
                                                                                                    <h4>{profile?.docCounts?.uploadedCount}</h4>
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
                                                                                                    <h4>{profile?.docCounts?.pendingVerificationCount}</h4>

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
                                                                                                    <h4>{profile?.docCounts?.verifiedCount}</h4>
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
                                                                                                    <h4>{profile?.docCounts?.RejectedCount}</h4>
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
                                                                                        <button
                                                                                            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                                                                                            onClick={() => setStatusFilter('all')}
                                                                                        >
                                                                                            <i className="fas fa-list-ul"></i>
                                                                                            All Documents
                                                                                            <span className="badge">{getDocumentCounts(profile._candidate?.documents || staticDocuments).totalDocs}</span>
                                                                                        </button>
                                                                                        <button
                                                                                            className={`filter-btn pending ${statusFilter === 'pending' ? 'active' : ''}`}
                                                                                            onClick={() => setStatusFilter('pending')}
                                                                                        >
                                                                                            <i className="fas fa-clock"></i>
                                                                                            Pending
                                                                                            <span className="badge">{getDocumentCounts(profile._candidate?.documents || staticDocuments).pendingDocs}</span>
                                                                                        </button>
                                                                                        <button
                                                                                            className={`filter-btn verified ${statusFilter === 'verified' ? 'active' : ''}`}
                                                                                            onClick={() => setStatusFilter('verified')}
                                                                                        >
                                                                                            <i className="fas fa-check-circle"></i>
                                                                                            Verified
                                                                                            <span className="badge">{getDocumentCounts(profile._candidate?.documents || staticDocuments).verifiedDocs}</span>
                                                                                        </button>
                                                                                        <button
                                                                                            className={`filter-btn rejected ${statusFilter === 'rejected' ? 'active' : ''}`}
                                                                                            onClick={() => setStatusFilter('rejected')}
                                                                                        >
                                                                                            <i className="fas fa-times-circle"></i>
                                                                                            Rejected
                                                                                            <span className="badge">{getDocumentCounts(profile._candidate?.documents || staticDocuments).rejectedDocs}</span>
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Enhanced Documents Grid */}
                                                                            <div className="documents-grid-enhanced">
                                                                                {filterDocuments(profile.uploadedDocs || []).map((doc, index) => {
                                                                                    const latestUpload = doc.uploads.length > 0 ? doc.uploads[doc.uploads.length - 1] : null;

                                                                                    return (
                                                                                        <div key={doc._id} className="document-card-enhanced">
                                                                                            <div className="document-image-container">
                                                                                                {latestUpload ? (
                                                                                                    <>
                                                                                                        <img
                                                                                                            src={latestUpload.fileUrl}
                                                                                                            alt="Document Preview"
                                                                                                            className="document-image"
                                                                                                        />
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
                                                                                                    {latestUpload?.status === 'Pending' && (
                                                                                                        <span className="status-badge-new pending">
                                                                                                            <i className="fas fa-clock"></i>
                                                                                                            Pending
                                                                                                        </span>
                                                                                                    )}
                                                                                                    {latestUpload?.status === 'Verified' && (
                                                                                                        <span className="status-badge-new verified">
                                                                                                            <i className="fas fa-check-circle"></i>
                                                                                                            Verified
                                                                                                        </span>
                                                                                                    )}
                                                                                                    {latestUpload?.status === 'Rejected' && (
                                                                                                        <span className="status-badge-new rejected">
                                                                                                            <i className="fas fa-times-circle"></i>
                                                                                                            Rejected
                                                                                                        </span>
                                                                                                    )}
                                                                                                    {!latestUpload && (
                                                                                                        <span className="status-badge-new not-uploaded">
                                                                                                            <i className="fas fa-upload"></i>
                                                                                                            Required
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="document-info-section">
                                                                                                <div className="document-header">
                                                                                                    <h4 className="document-title">{doc.Name}</h4>
                                                                                                    <div className="document-actions">
                                                                                                        {!latestUpload ? (
                                                                                                            <button className="action-btn upload-btn" title="Upload Document">
                                                                                                                <i className="fas fa-cloud-upload-alt"></i>
                                                                                                                Upload
                                                                                                            </button>
                                                                                                        ) : latestUpload.status === 'Pending' ? (
                                                                                                            <button
                                                                                                                className="action-btn verify-btn"
                                                                                                                onClick={() => openDocumentModal(doc)}
                                                                                                                title="Verify Document"
                                                                                                            >
                                                                                                                <i className="fas fa-search"></i>
                                                                                                                Verify
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
                                                                                                            {latestUpload ?
                                                                                                                new Date(latestUpload.uploadedAt).toLocaleDateString('en-GB', {
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
                                                                                })}
                                                                            </div>


                                                                            <DocumentModal />
                                                                        </div>


                                                                    </div>
                                                                )}
                                                                {/* ALL OTHER EXISTING TAB CONTENT REMAINS THE SAME */}
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
                    </div>
                </div>

                {/* NEW: Permanent Right Sidebar for Calendar */}
                {!isMobile && (
                    <div className="col-4">
                        <div className="sidebar-content sticky-top">
                            <div className="card border-0 shadow-sm">
                                <FollowupCalendar />
                            </div>
                        </div>
                    </div>
                )}

                {/* Right Sidebar for Desktop - Edit Panels */}
                {!isMobile && (showEditPanel || showFollowupPanel) && (
                    <div className="col-4">
                        <div className="row sticky-top stickyBreakpoints">
                            {renderEditPanel()}
                        </div>
                    </div>
                )}

                {/* Mobile Modals */}
                {isMobile && renderEditPanel()}
            </div>

            <style>
                {`
        /* NEW STYLES FOR TABS AND CALENDAR */
        .main-tabs-wrapper {
          position: sticky;
          top: 0;
          z-index: 11;
        }
        
        .main-tab {
          background: #f8f9fa;
          border: none;
          padding: 12px 24px;
          border-radius: 0;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          margin-right: 2px;
          font-weight: 500;
          color: #6c757d;
          border-bottom: 3px solid transparent;
        }
        
        .main-tab.active {
          background: #ff6b35;
          color: white;
          border-bottom: 3px solid #ff6b35;
        }
        
        .sub-tabs-wrapper {
          position: sticky;
          top: 64px;
          z-index: 11;
        }
        
        .sub-tab {
          background: transparent;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          color: #6c757d;
          font-weight: 500;
        }
        
        .sub-tab.active {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .action-icon {
          background: transparent;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6c757d;
          transition: all 0.2s;
        }
        
        .action-icon:hover {
          background: #f8f9fa;
          color: #495057;
        }
        
        .sidebar-content {
          top: 20px;
          z-index: 11
        }
        
        .calendar-header h6 {
          font-size: 14px;
        }
        
        .week-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 8px;
        }
        
        .week-day {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: #6c757d;
          padding: 4px;
        }
        
        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }
        
        .calendar-day {
          text-align: center;
          padding: 8px 4px;
          font-size: 12px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .calendar-day:hover {
          background: #f8f9fa;
        }
        
        .calendar-day.other-month {
          color: #adb5bd;
        }
        
        .calendar-day.today {
          background: #e3f2fd;
          color: #1976d2;
          font-weight: bold;
        }
        
        .calendar-day.selected {
          background: #ff6b35;
          color: white;
          font-weight: bold;
        }

        /* EXISTING STYLES */
        html body .content .content-wrapper {
          padding: calc(0.9rem - 0.1rem) 1.2rem
        }

        .container-fluid.py-2 {
          position: sticky !important;
          top: 128px; /* Adjusted for new tabs */
          z-index: 11;
          background-color: white;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .stickyBreakpoints {
          position: sticky;
          top: 20px;
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


/* Simple Smooth Blink Animation */
.next-action-date {
  animation: smoothBlink 3s ease-in-out infinite;
}

@keyframes smoothBlink {
  0% { 
    opacity: 0; 
    transform: scale(0.95);
  }
  25% { 
    opacity: 0.5; 
    transform: scale(0.98);
  }
  50% { 
    opacity: 1; 
    transform: scale(1);
  }
  75% { 
    opacity: 0.5; 
    transform: scale(0.98);
  }
  100% { 
    opacity: 0; 
    transform: scale(0.95);
  }
}

/* Alternative: More Dramatic Blink */
.next-action-date.dramatic-blink {
  animation: dramaticBlink 2.5s ease-in-out infinite;
}

@keyframes dramaticBlink {
  0% { 
    opacity: 0; 
    transform: scale(0.9);
    filter: brightness(0.5);
  }
  50% { 
    opacity: 1; 
    transform: scale(1.05);
    filter: brightness(1.2);
  }
  100% { 
    opacity: 0; 
    transform: scale(0.9);
    filter: brightness(0.5);
  }
}

/* Alternative: Glow Blink */
.next-action-date.glow-blink {
  animation: glowBlink 3s ease-in-out infinite;
}

@keyframes glowBlink {
  0% { 
    opacity: 0; 
    box-shadow: 0 0 0 rgba(255, 107, 53, 0);
  }
  25% { 
    opacity: 0.5; 
    box-shadow: 0 0 10px rgba(255, 107, 53, 0.3);
  }
  50% { 
    opacity: 1; 
    box-shadow: 0 0 20px rgba(255, 107, 53, 0.6);
  }
  75% { 
    opacity: 0.5; 
    box-shadow: 0 0 10px rgba(255, 107, 53, 0.3);
  }
  100% { 
    opacity: 0; 
    box-shadow: 0 0 0 rgba(255, 107, 53, 0);
  }
}

/* Alternative: Pulse Blink */
.next-action-date.pulse-blink {
  animation: pulseBlink 2s ease-in-out infinite;
}

@keyframes pulseBlink {
  0% { 
    opacity: 0; 
    transform: scale(0.95);
  }
  50% { 
    opacity: 1; 
    transform: scale(1);
  }
  100% { 
    opacity: 0; 
    transform: scale(0.95);
  }
}

/* Alternative: Fade Blink */
.next-action-date.fade-blink {
  animation: fadeBlink 4s ease-in-out infinite;
}

@keyframes fadeBlink {
  0% { opacity: 0; }
  20% { opacity: 0.3; }
  40% { opacity: 0.7; }
  60% { opacity: 1; }
  80% { opacity: 0.7; }
  100% { opacity: 0; }
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
        `}
            </style>
        </div>
    );
};

export default MyFollowup;