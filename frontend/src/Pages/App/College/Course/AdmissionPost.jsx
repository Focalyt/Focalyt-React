import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DatePicker from 'react-date-picker';
import KYCManagement from './kycManagement';
import AdmissionList from './AdmissionList';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'
import './CourseCrm.css';
import './crm.css';

// Add this at the top of the file, after imports
const RejectionForm = React.memo(({ onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  const reasonRef = useRef('');

  const handleReasonChange = (e) => {
    reasonRef.current = e.target.value;
    setReason(e.target.value);
  };

  const handleConfirm = () => {
    onConfirm(reasonRef.current);
  };

  return (
    <div className="rejection-form" style={{ display: 'block', marginTop: '20px' }}>
      <h4>Provide Rejection Reason</h4>
      <textarea
        value={reason}
        onChange={handleReasonChange}
        placeholder="Please provide a detailed reason for rejection..."
        rows="8"
        className="form-control mb-3"
      />
      <div className="d-flex gap-2">
        <button
          className="btn btn-danger"
          onClick={handleConfirm}
          disabled={!reason.trim()}
        >
          Confirm Rejection
        </button>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

const CRMDashboard = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;
  // ========================================
  // 🎯 Main Tab State
  // ========================================
  const [mainTab, setMainTab] = useState('kyc'); // 'kyc' or 'AllAdmission'
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState({});
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
  const rejectionReasonRef = useRef('');
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const fileInputRef = useRef(null);
  const [currentPreviewUpload, setCurrentPreviewUpload] = useState(null);


 

  // ========================================
  // 🎯 Main Tab Change Handler
  // ========================================
  const handleMainTabChange = (tabName) => {
    setMainTab(tabName);
    setActiveCrmFilter(0); 

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

  const renderMainTabContent = () => {
    switch (mainTab) {
      case 'kyc':
        return <KYCManagement />;
      case 'AllAdmission':
        return <AdmissionList />;
      default:
        return null;
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className={isMobile ? 'col-12' : mainContentClass}>
          {/* Header */}
          <div className="bg-white shadow-sm border-bottom mb-3 site-header--sticky--admissions--posts">
            <div className="container-fluid py-2">
              <div className="row align-items-center justify-content-between">
                <div className="col-md-6 d-md-block d-sm-none">
                  <div className="main-tabs-container">
                    <ul className="nav nav-tabs nav-tabs-main border-0">
                      {/* kyc Management Tab */}
                      <li className="nav-item">
                        <button
                          className={`nav-link main-tab ${mainTab === 'kyc' ? 'active' : ''}`}
                          onClick={() => handleMainTabChange('kyc')}
                        >
                          <i className="fas fa-id-card me-2"></i>
                          KYC Management
                          <span className="tab-badge">
                          </span>
                        </button>
                      </li>
                      {/* All Admission Tab */}
                      <li className="nav-item">
                        <button
                          className={`nav-link main-tab ${mainTab === 'AllAdmission' ? 'active' : ''}`}
                          onClick={() => handleMainTabChange('AllAdmission')}
                        >
                          <i className="fas fa-graduation-cap me-2"></i>
                          Admission List
                          <span className="tab-badge">
                          </span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

               
              </div>
            </div>

            
          </div>

          {/* Main Content */}
          <div className="main-content">
            {renderMainTabContent()}
          </div>
        </div>
      </div>
      <style>{
        `
                .site-header--sticky--admissions--posts:not(.mobile-sticky-enable){
          top: 100px;
          z-index: 999;
          }
@media (min-width: 992px) {
    .site-header--sticky--admissions--posts:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        /* position: absolute !important; */
        /* min-height: 200px; */
        background: white;
        left:20%;
        right:3%;
        }
        }
        `
        }</style>
    </div>
  );
};

export default CRMDashboard;
