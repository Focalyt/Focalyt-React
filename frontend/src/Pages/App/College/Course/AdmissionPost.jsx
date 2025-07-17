import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DatePicker from 'react-date-picker';
import KYCManagement from './kycManagement';
import AdmissionList from './AdmissionList';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'


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


  const useNavHeight = (dependencies = []) => {
    const navRef = useRef(null);
    const [navHeight, setNavHeight] = useState(140);
    const [navWidth, setNavWidth] = useState('100%');
  
    const calculateHeightAndWidth = useCallback(() => {
      
      if (navRef.current) {
        // Calculate Height
        const height = navRef.current.offsetHeight;
        
        if (height > 0) {
          setNavHeight(height);
          
        }
  
        // Calculate Width from parent (position-relative container)
        const parentContainer = navRef.current.closest('.position-relative');
        if (parentContainer) {
          const parentWidth = parentContainer.offsetWidth;
          
          if (parentWidth > 0) {
            setNavWidth(parentWidth + 'px');
          }
        }
      } else {
        console.log('❌ navRef.current is null');
      }
    }, []);
  
    useEffect(() => {
      // Calculate immediately and with delays
      calculateHeightAndWidth();
      setTimeout(calculateHeightAndWidth, 100);
      setTimeout(calculateHeightAndWidth, 500);
  
      // Resize listener
      const handleResize = () => {
        setTimeout(calculateHeightAndWidth, 100);
      };
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [calculateHeightAndWidth]);
  
    // Recalculate when dependencies change
    useEffect(() => {
      setTimeout(calculateHeightAndWidth, 100);
    }, dependencies);
  
    return { navRef, navHeight, navWidth };
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

  const { navRef, navHeight, navWidth } = useNavHeight([mainTab]);
  const { isScrolled, scrollY, contentRef } = useScrollBlur(navHeight);
  const blurIntensity = Math.min(scrollY / 10, 15);
  const navbarOpacity = Math.min(0.85 + scrollY / 1000, 0.98);
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
    <div className="container-fluid admissionMobileResponsive">
      <div className="row">
        <div className={`${isMobile ? 'col-12' : mainContentClass} mobileResponsive`}>
          {/* Header */}
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
          <div className='position-relative' >
          <div ref={navRef} className="bg-white shadow-sm border-bottom mb-3 
        " style={{zIndex: 11 , backgroundColor: `rgba(255, 255, 255, ${navbarOpacity})` ,position:'fixed' , width: `${navWidth}` ,backdropFilter: `blur(${blurIntensity}px)`,
        WebkitBackdropFilter: `blur(${blurIntensity}px)`,
        boxShadow: isScrolled 
          ? '0 8px 32px 0 rgba(31, 38, 135, 0.25)' 
          : '0 4px 25px 0 #0000001a',paddingBlock: '10px',
          transition: 'all 0.3s ease',}}>
            <div className="container-fluid py-2">
              <div className="row align-items-center justify-content-between">
                <div className="col-md-12 d-md-block d-sm-none">
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
          </div>
          {/* Main Content */}
          <div className="main-content" style={{marginTop: `${navHeight + 30}px`}}>
            {renderMainTabContent()}
          </div>
        </div>
      </div>
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

          .site-header--sticky--admissions--posts:not(.mobile-sticky-enable) {
              top: 100px;
              z-index: 10;
          }

          @media (max-width: 1200px) {
              .document-history .history-preview iframe.pdf-thumbnail {
                  height: auto !important;
                  max-height: 600px;
              }
          }

          @media (min-width: 992px) {
              .site-header--sticky--admissions--posts:not(.mobile-sticky-enable) {
                  position: fixed !important;
                  transition: 0.4s;
                  /* position: absolute !important; */
                  /* min-height: 200px; */
                  background: white;
                  left: 20%;
                  right: 3%;
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
    </div>
  );
};

export default CRMDashboard;