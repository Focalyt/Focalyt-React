import React, { useState, useEffect } from 'react';
import moment from 'moment';
import axios from 'axios'
import './CourseCrm.css';

const CRMDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [activeCrmFilter, setActiveCrmFilter] = useState(0);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showWhatsappPanel, setShowWhatsappPanel] = useState(false);
  const [mainContentClass, setMainContentClass] = useState('col-12');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [leadDetailsVisible, setLeadDetailsVisible] = useState(true);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [isMobile, setIsMobile] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);

  // Filter state from Registration component
  const [filterData, setFilterData] = useState({
    name: '',
    courseType: '',
    FromDate: '',
    ToDate: '',
    status: 'true',
    leadStatus: '',
    sector: ''
  });

  const [crmFilters, setCrmFilters] = useState([
    { _id: '', name: '', count: 0, milestone: '' },

  ]);
  const [statuses, setStatuses] = useState([
    { _id: '', name: '', count: 0 },

  ]);
  const [seletectedStatus, setSelectedStatus] = useState('');

  const [subStatuses, setSubStatuses] = useState([
    { _id: '', name: '', count: 0 },

  ]);

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const tabs = [
    'Lead Details',
    'Profile',
    'Job History',
    'Course History'
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

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const fetchStatus = async () => {
    try {
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

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
      alert('Failed to fetch roles');
    }
  };
  const fetchSubStatus = async () => {
    try {
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      const response = await axios.get(`${backendUrl}/college/status/${seletectedStatus}/substatus`, {
        headers: { 'x-auth': token }
      });

      console.log('response', response)

      if (response.data.success) {
        const status = response.data.data;


        setSubStatuses(status.map(r => ({
          _id: r._id,
          name: r.title,
          count: r.count || 0,  // agar backend me count nahi hai to 0
        })));


      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch roles');
    }
  };

  const [profileData, setProfileData] = useState({

  });

  const [user, setUser] = useState({
    image: '',
    name: 'John Doe'
  });

  // Inside CRMDashboard component:

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      if (!token) {
        console.warn('No token found in session storage.');
        return;
      }

      // Replace with your actual profile API endpoint
      const response = await axios.get(`${backendUrl}/college/appliedCandidates`, {
        headers: {
          'x-auth': token,
        },
      });
      console.log('Backend profile data:', response.data);
      if (response.data.success && response.data.data) {
        const data = response.data.data; // create array 
        setAllProfiles(response.data.data);
        // Assuming your API returns data structured similar to your state
        // Adjust this mapping as per your API response structure

        setProfileData({
          personalInfo: {
            // name: data._candidate?.personalInfo?.name || '',
            name: data._candidate?.name || '',
            mobile: data._candidate?.mobile || '',
            professionalTitle: data._candidate?.professionalTitle || '',
            currentAddress: data.personalInfo?.currentAddress || { fullAddress: '' },
            permanentAddress: data.personalInfo?.permanentAddress || { fullAddress: '' },
            summary: data.personalInfo?.summary || '',
            sex: data._candidate?.sex || '',
          },
          mobile: data._candidate?.mobile || '',
          email: data.email || '',
          dob: data.dob || '',
          sex: data.sex || '',
          experienceType: data.experienceType || '',
          fresherDetails: data.fresherDetails || '',
          isExperienced: data.isExperienced || '',
        });

        setUser({
          image: data.user?.image || '',
          name: data.user?.name || '',
        });

        setExperiences(data.experiences || []);
        setEducations(data.educations || []);
        setSkills(data.skills || []);
        setLanguages(data.languages || []);
        setCertificates(data.certificates || []);
        setProjects(data.projects || []);
        setInterests(data.interests || []);
        setDeclaration(data.declaration || { text: '' });
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

  const [educations, setEducations] = useState([
    {
      education: '',          // ObjectId of Qualification (e.g., 10th, UG)
      universityName: '',
      boardName: '',
      collegeName: '',
      schoolName: '',
      course: '',             // ObjectId of QualificationCourse
      specialization: '',
      passingYear: '',
      marks: '',

      universityLocation: {
        type: 'Point',
        coordinates: [0, 0],
        city: '',
        state: '',
        fullAddress: ''
      },
      collegeLocation: {
        type: 'Point',
        coordinates: [0, 0],
        city: '',
        state: '',
        fullAddress: ''
      },
      schoolLocation: {
        type: 'Point',
        coordinates: [0, 0],
        city: '',
        state: '',
        fullAddress: ''
      }
    }
  ]);

  const [educationList, setEducationList] = useState([
    { _id: '1', name: 'Bachelor of Science' }
  ]);

  const [coursesList, setCoursesList] = useState([
    [{ _id: '1', name: 'Computer Science' }]
  ]);

  const [skills, setSkills] = useState([{
     skillName: '',
     skillPercent: 0
   }]);

 const [languages, setLanguages] = useState([{
    name: '',
    level: 0
  }]);

   const [certificates, setCertificates] = useState([{
     certificateName: '',
     orgName: '',
     month: '',
     year: '',
     orgLocation: {
       type: 'Point',
       coordinates: [],
       city: '',
       state: '',
       fullAddress: ''
     }
   }]);

  const [projects, setProjects] = useState([{
    projectName: '',
    proyear: '',
    proDescription: ''
  }]);

   const [interests, setInterests] = useState(['']);

  const [declaration, setDeclaration] = useState({
    text: 'I hereby declare that the above information is true to the best of my knowledge.'
  });

  useEffect(() => {
    // Initialize circular progress
    const containers = document.querySelectorAll('.circular-progress-container');
    containers.forEach(container => {
      const percent = container.getAttribute('data-percent');
      const circle = container.querySelector('circle.circle-progress');
      if (circle && percent) {
        const radius = 16;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;

        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = offset;

        const progressText = container.querySelector('.progress-text');
        if (progressText) {
          progressText.innerText = percent + '%';
        }
      }
    });
  }, []);

  const handleCrmFilterClick = (index) => {
    setActiveCrmFilter(index);
  };

  const handleTabClick = (index) => {
    setActiveTab(index);
    console.log('Tab clicked:', index);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterData({ ...filterData, [name]: value });
  };

  const openEditPanel = () => {
    setShowEditPanel(true);
    setShowWhatsappPanel(false);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  const closeEditPanel = () => {
    setShowEditPanel(false);
    if (!isMobile) {
      setMainContentClass(showWhatsappPanel ? 'col-8' : 'col-12');
    }
  };

  const openWhatsappPanel = () => {
    setShowWhatsappPanel(true);
    setShowEditPanel(false);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  const closeWhatsappPanel = () => {
    setShowWhatsappPanel(false);
    if (!isMobile) {
      setMainContentClass(showEditPanel ? 'col-8' : 'col-12');
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

  // Render Edit Panel (Desktop Sidebar or Mobile Modal)
  const renderEditPanel = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-user-edit text-secondary"></i>
            </div>
            <h6 className="mb-0 followUp fw-medium">Edit Followup for AKASH GAURAV</h6>
          </div>
          <div>
            <button className="btn-close" type="button" onClick={closeEditPanel}>
              {/* <i className="fa-solid fa-xmark"></i> */}
            </button>
          </div>
        </div>

        <div className="card-body">
          <form>


            <div className="mb-1">
              <label htmlFor="status" className="form-label small fw-medium text-dark">
                Status<span className="text-danger">*</span>
              </label>
              <div className="d-flex">
                <div className="form-floating flex-grow-1">
                  <select
                    className="form-select border-0  bgcolor"
                    id="status"
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
                    style={{
                      height: '42px',
                      paddingTop: '8px',
                      backgroundColor: '#f1f2f6',
                      paddingInline: '10px',
                      width: '100%'
                    }}
                  >
                    <option value="">Select Sub-Status</option>
                    {subStatuses.map((filter, index) => (
                      <option value={filter._id}>{filter.name}</option>))}
                  </select>
                </div>
              </div>
            </div>

            <div className="row mb-1">
              <div className="col-6">
                <label htmlFor="nextActionDate" className="form-label small fw-medium text-dark">
                  Next Action Date <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type="date"
                    className="form-control border-0  bgcolor"
                    id="nextActionDate"
                    defaultValue="2025-01-13"
                    style={{ backgroundColor: '#f1f2f6', height: '42px', paddingInline: '10px' }}
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
                    defaultValue="12:36"
                    style={{ backgroundColor: '#f1f2f6', height: '42px', paddingInline: '10px' }}
                  />
                </div>
              </div>
            </div>

            <div className="mb-1">
              <label htmlFor="comment" className="form-label small fw-medium text-dark">Comment</label>
              <textarea
                className="form-control border-0 bgcolor"
                id="comment"
                rows="4"
                style={{ resize: 'none', backgroundColor: '#f1f2f6' }}
                defaultValue="wrong no."
              ></textarea>
            </div>

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
          className={`modal ${showEditPanel ? 'show d-block' : 'd-none'}`}
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

    return showEditPanel ? (
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

  return (
    <div className="container-fluid row">
      <div className={isMobile ? 'col-12' : mainContentClass}>

        {/* Header */}
        <div className="bg-white shadow-sm border-bottom mb-3 sticky-top stickyBreakpoints" >
          <div className="container-fluid py-2 " >
            <div className="row align-items-center">
              <div className="col-md-6 d-md-block d-sm-none">
                <div className="d-flex align-items-center">
                  <h4 className="fw-bold text-dark mb-0 me-3">Admission Cycle</h4>
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0 small">
                      <li className="breadcrumb-item">
                        <a href="#" className="text-decoration-none">Home</a>
                      </li>
                      <li className="breadcrumb-item active">Admission Cycle</li>
                    </ol>
                  </nav>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex justify-content-end align-items-center gap-2">
                  <div className="input-group" style={{ maxWidth: '300px' }}>
                    <span className="input-group-text bg-white border-end-0 input-height" >
                      <i className="fas fa-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      name="name"
                      className="form-control border-start-0 m-0"
                      placeholder="Search name, mobile, email..."
                      value={filterData.name}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <button
                    onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                    className="btn btn-outline-primary" style={{ whiteSpace: 'nowrap' }}
                  >
                    <i className="fas fa-filter me-1"></i>
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


              <div className="card-body p-3">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  {crmFilters.map((filter, index) => (
                    <div key={index} className="d-flex align-items-center gap-1">
                      <div className='d-flex'>
                        <button
                          className={`btn btn-sm ${activeCrmFilter === index ? 'btn-primary' : 'btn-outline-secondary'} position-relative`}
                          onClick={() => handleCrmFilterClick(index)}
                        >
                          {filter.name}
                          <span className={`ms-1 ${activeCrmFilter === index ? 'text-white' : 'text-dark'}`}>
                            ({filter.count})
                          </span>
                        </button>

                        {/* Milestone flag OUTSIDE the button */}
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

        {/* Advanced Filters */}
        {!isFilterCollapsed && (
          <div className="bg-white border-bottom">
            <div className="container-fluid py-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Advanced Filters</h6>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setIsFilterCollapsed(true)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label small fw-medium">Lead Category</label>
                  <select
                    className="form-select form-select-sm"
                    name="leadStatus"
                    value={filterData.leadStatus}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Categories</option>
                    <option value="Application">Application</option>
                    <option value="Lead">Lead</option>
                    <option value="Prospect">Prospect</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-medium">Status</label>
                  <select
                    className="form-select form-select-sm"
                    name="status"
                    value={filterData.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Status</option>
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-medium">Course Type</label>
                  <select
                    className="form-select form-select-sm"
                    name="courseType"
                    value={filterData.courseType}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Types</option>
                    <option value="Free">Free</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-medium">Sector</label>
                  <select
                    className="form-select form-select-sm"
                    name="sector"
                    value={filterData.sector}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Sectors</option>
                    <option value="Tourism and Hospitality">Tourism & Hospitality</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-medium">From Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    name="FromDate"
                    value={filterData.FromDate}
                    onChange={handleFilterChange}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-medium">To Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    name="ToDate"
                    value={filterData.ToDate}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setFilterData({
                      name: '',
                      courseType: '',
                      FromDate: '',
                      ToDate: '',
                      status: '',
                      leadStatus: '',
                      sector: ''
                    });
                  }}
                >
                  Reset
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setIsFilterCollapsed(true)}
                >
                  Apply Filters
                </button>
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
                                      <button
                                        className="btn btn-outline-success btn-sm border-0"
                                        onClick={openWhatsappPanel}
                                        style={{ fontSize: '20px' }}
                                        title="WhatsApp"
                                      >
                                        <i className="fab fa-whatsapp"></i>
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
                                        value={crmFilters[activeCrmFilter].name}
                                        readOnly
                                        onClick={openEditPanel}
                                      />
                                      <input
                                        type="text"
                                        className="form-control form-control-sm m-0"
                                        value="Untouched Lead Long Text Example..."
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

                                <div className="col-md-1 text-end">
                                  <div className="btn-group">
                                    <button
                                      className="btn btn-sm btn-outline-secondary border-0"
                                      onClick={() => setLeadDetailsVisible(!leadDetailsVisible)}
                                    >
                                      {leadDetailsVisible ? (
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
                            {leadDetailsVisible && (
                              <div className="tab-content">

                                {/* Lead Details Tab */}
                                {activeTab === 0 && (
                                  <div className="tab-pane active" id="lead-details">
                                    {/* Your lead details content here */}
                                    <div className="scrollable-container">
                                      <div className="scrollable-content">
                                        <div className="info-card">
                                          <div className="info-group">
                                            <div className="info-label">LEAD AGE</div>
                                            <div className="info-value">282 Days</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">Lead Owner</div>
                                            <div className="info-value">Meta Ads Inbound IVR Inbound Call</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">COURSE / JOB NAME</div>
                                            <div className="info-value">Operator</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">BATCH NAME</div>
                                            <div className="info-value">-</div>
                                          </div>
                                        </div>

                                        <div className="info-card">
                                          <div className="info-group">
                                            <div className="info-label">TYPE OF PROJECT</div>
                                            <div className="info-value">Job</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">PROJECT</div>
                                            <div className="info-value">Job</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">SECTOR</div>
                                            <div className="info-value">Retail</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">LEAD CREATION DATE</div>
                                            <div className="info-value">Jan 15, 2024 9:29 AM</div>
                                          </div>
                                        </div>

                                        <div className="info-card">
                                          <div className="info-group">
                                            <div className="info-label">STATE</div>
                                            <div className="info-value">Uttar Pradesh</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">City</div>
                                            <div className="info-value">Chandauli</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">BRANCH NAME</div>
                                            <div className="info-value">PSD Chandauli Center</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">LEAD MODIFICATION DATE</div>
                                            <div className="info-value">Mar 21, 2025 3:32 PM</div>
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
                                                  <div className="info-value">282 Days</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">Lead Owner</div>
                                                  <div className="info-value">Meta Ads Inbound IVR Inbound Call</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">COURSE / JOB NAME</div>
                                                  <div className="info-value">Operator</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">BATCH NAME</div>
                                                  <div className="info-value"></div>
                                                </div>
                                              </div>

                                              <div className="info-card">
                                                <div className="info-group">
                                                  <div className="info-label">TYPE OF PROJECT</div>
                                                  <div className="info-value">Job</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">PROJECT</div>
                                                  <div className="info-value">Job</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">SECTOR</div>
                                                  <div className="info-value">Retail</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">LEAD CREATION DATE</div>
                                                  <div className="info-value">Jan 15, 2024 9:29 AM</div>
                                                </div>
                                              </div>

                                              <div className="info-card">
                                                <div className="info-group">
                                                  <div className="info-label">STATE</div>
                                                  <div className="info-value">Uttar Pradesh</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">City</div>
                                                  <div className="info-value">Job</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">BRANCH NAME</div>
                                                  <div className="info-value">PSD Chandauli Center</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">LEAD MODIFICATION DATE</div>
                                                  <div className="info-value">Mar 21, 2025 3:32 PM</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">LEAD MODIFICATION By</div>
                                                  <div className="info-value">Mar 21, 2025 3:32 PM</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">Counsellor Name</div>
                                                  <div className="info-value">Name</div>
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
                                                  <div className="info-value">282 Days</div>
                                                </div>
                                              </div>

                                              <div className="col-xl-3 col-3">
                                                <div className="info-group">
                                                  <div className="info-label">STATE</div>
                                                  <div className="info-value">Uttar Pradesh</div>
                                                </div>
                                              </div>
                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">CITY</div>
                                                  <div className="info-value"></div>
                                                </div>
                                              </div>
                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">TYPE OF PROJECT</div>
                                                  <div className="info-value">Job</div>
                                                </div>
                                              </div>
                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">PROJECT</div>
                                                  <div className="info-value">Job</div>
                                                </div>
                                              </div>
                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">Sector</div>
                                                  <div className="info-value">Retail</div>
                                                </div>
                                              </div>
                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">COURSE / JOB NAME</div>
                                                  <div className="info-value">Operator</div>
                                                </div>
                                              </div>
                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">BATCH NAME</div>
                                                  <div className="info-value"></div>
                                                </div>
                                              </div>
                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">SECTOR</div>
                                                  <div className="info-value">Retail</div>
                                                </div>
                                              </div>
                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">BRANCH NAME</div>
                                                  <div className="info-value">PSD Chandauli Center</div>
                                                </div>
                                              </div>
                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">NEXT ACTION DATE</div>
                                                  <div className="info-value"></div>
                                                </div>
                                              </div>

                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">LEAD CREATION DATE</div>
                                                  <div className="info-value">Jan 15, 2024 9:29 AM</div>
                                                </div>
                                              </div>
                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">LEAD MODIFICATION DATE</div>
                                                  <div className="info-value">Mar 21, 2025  col-3:32 PM</div>
                                                </div>
                                              </div>
                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">LEAD MODIFICATION BY</div>
                                                  <div className="info-value">Name</div>
                                                </div>
                                              </div>
                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">Counsellor Name</div>
                                                  <div className="info-value">Name</div>
                                                </div>
                                              </div>
                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">LEAD OWNER</div>
                                                  <div className="info-value">Rahul Sharma</div>
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
                                {activeTab === 1 && (
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
                                                {profileData?.personalInfo?.name || user?.name || 'Your Name'}
                                              </h1>
                                              <p className="resume-title">
                                                {profileData?.personalInfo?.professionalTitle || 'Professional Title'}
                                              </p>
                                              <p className="resume-title">
                                                {profileData?.personalInfo?.sex || 'Sex'}
                                              </p>

                                              <div className="resume-contact-details">
                                                {profileData?.mobile && (
                                                  <div className="resume-contact-item">
                                                    <i className="bi bi-telephone-fill"></i>
                                                    <span>{profileData.mobile}</span>
                                                  </div>
                                                )}
                                                {profileData?.email && (
                                                  <div className="resume-contact-item">
                                                    <i className="bi bi-envelope-fill"></i>
                                                    <span>{profileData.email}</span>
                                                  </div>
                                                )}
                                                {profileData?.dob && (
                                                  <div className="resume-contact-item">
                                                    <i className="bi bi-calendar-heart-fill"></i>
                                                    {profileData.dob ? new Date(profileData.dob).toLocaleDateString('en-IN', {
                                                      day: '2-digit',
                                                      month: 'long',
                                                      year: 'numeric'
                                                    }) : ''}
                                                  </div>
                                                )}
                                                {profileData?.personalInfo?.currentAddress?.fullAddress && (
                                                  <div className="resume-contact-item">
                                                    <i className="bi bi-geo-alt-fill"></i>
                                                    <span>Current:{profileData.personalInfo.currentAddress.fullAddress}</span>
                                                  </div>
                                                )}
                                                {profileData?.personalInfo?.permanentAddress && (
                                                  <div className="resume-contact-item">
                                                    <i className="bi bi-house-fill"></i>
                                                    <span>Permanent: {profileData.personalInfo.permanentAddress.fullAddress}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="resume-summary">
                                            <h2 className="resume-section-title">Professional Summary</h2>
                                            <p>{profileData?.personalInfo?.summary || 'No summary provided'}</p>
                                          </div>
                                        </div>


                                        <div className="resume-document-body">

                                          <div className="resume-column resume-left-column">

                                            {profileData?.experienceType === 'fresher' ? (
                                              <div className="resume-section">
                                                <h2 className="resume-section-title">Work Experience</h2>
                                                <div className="resume-experience-item">
                                                  <div className="resume-item-header">
                                                    <h3 className="resume-item-title">Fresher</h3>
                                                  </div>
                                                  {profileData?.fresherDetails && (
                                                    <div className="resume-item-content">
                                                      <p>{profileData.isExperienced}</p>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            ) : (
                                              experiences.length > 0 && experiences.some(exp => exp.jobTitle || exp.companyName || exp.jobDescription) && (
                                                <div className="resume-section">
                                                  <h2 className="resume-section-title">Work Experience</h2>
                                                  {experiences.map((exp, index) => (
                                                    (exp.jobTitle || exp.companyName || exp.jobDescription) && (
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
                                                    )
                                                  ))}
                                                </div>
                                              )
                                            )}


                                            {educations.length > 0 && educations.some(edu =>
                                              edu.education || edu.course || edu.schoolName || edu.collegeName || edu.universityName || edu.passingYear
                                            ) && (
                                                <div className="resume-section">
                                                  <h2 className="resume-section-title">Education</h2>
                                                  {educations.map((edu, index) => (
                                                    (edu.education || edu.course || edu.schoolName || edu.collegeName || edu.universityName || edu.passingYear) && (
                                                      <div className="resume-education-item" key={`resume-edu-${index}`}>
                                                        <div className="resume-item-header">
                                                          {edu.education && (
                                                            <h3 className="resume-item-title">
                                                              {educationList.find(e => e._id === edu.education)?.name || 'Education'}
                                                            </h3>
                                                          )}
                                                          {typeof edu.course === 'string' && edu.course && (
                                                            <h3 className="resume-item-title">
                                                              {coursesList[index]?.find(course => course._id === edu.course)?.name || edu.course}
                                                            </h3>
                                                          )}
                                                          {edu.universityName && (
                                                            <p className="resume-item-subtitle">{edu.universityName}</p>
                                                          )}
                                                          {(edu.schoolName && !edu.universityName) && (
                                                            <p className="resume-item-subtitle">{edu.schoolName}</p>
                                                          )}
                                                          {edu.collegeName && (
                                                            <p className="resume-item-subtitle">{edu.collegeName}</p>
                                                          )}
                                                          {edu.currentlypursuing ? (
                                                            <p className="resume-item-period highlight-text">Currently Pursuing</p>
                                                          ) : edu.passingYear ? (
                                                            <p className="resume-item-period">{edu.passingYear}</p>
                                                          ) : null}
                                                        </div>
                                                        <div className="resume-item-content">
                                                          {edu.marks && <p>Marks: {edu.marks}%</p>}
                                                          {edu.specialization && <p>Specialization: {typeof edu.specialization === 'string' ? edu.specialization : 'Specialization'}</p>}
                                                        </div>
                                                      </div>
                                                    )
                                                  ))}
                                                </div>
                                              )}
                                          </div>


                                          <div className="resume-column resume-right-column">

                                            {skills.length > 0 && skills.some(skill => skill.skillName) && (
                                              <div className="resume-section">
                                                <h2 className="resume-section-title">Skills</h2>
                                                <div className="resume-skills-list">
                                                  {skills.map((skill, index) => (
                                                    skill.skillName && (
                                                      <div className="resume-skill-item" key={`resume-skill-${index}`}>
                                                        <div className="resume-skill-name">{skill.skillName}</div>
                                                        <div className="resume-skill-bar-container">
                                                          <div
                                                            className="resume-skill-bar"
                                                            style={{ width: `${skill.skillPercent || 0}%` }}
                                                          ></div>
                                                        </div>
                                                      </div>
                                                    )
                                                  ))}
                                                </div>
                                              </div>
                                            )}


                                            {languages.length > 0 && languages.some(lang => lang.lname) && (
                                              <div className="resume-section">
                                                <h2 className="resume-section-title">Languages</h2>
                                                <div className="resume-languages-list">
                                                  {languages.map((lang, index) => (
                                                    lang.lname && (
                                                      <div className="resume-language-item" key={`resume-lang-${index}`}>
                                                        <div className="resume-language-name">{lang.lname}</div>
                                                        <div className="resume-language-level">
                                                          {[1, 2, 3, 4, 5].map(dot => (
                                                            <span
                                                              key={`resume-lang-dot-${index}-${dot}`}
                                                              className={`resume-level-dot ${dot <= (lang.level || 0) ? 'filled' : ''}`}
                                                            ></span>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    )
                                                  ))}
                                                </div>
                                              </div>
                                            )}


                                            {certificates.length > 0 && certificates.some(cert => cert.certificateName || cert.orgName) && (
                                              <div className="resume-section">
                                                <h2 className="resume-section-title">Certifications</h2>
                                                <ul className="resume-certifications-list">
                                                  {certificates.map((cert, index) => (
                                                    (cert.certificateName || cert.orgName) && (
                                                      <li key={`resume-cert-${index}`} className="resume-certification-item">
                                                        {cert.certificateName && (
                                                          <strong>{cert.certificateName}</strong>
                                                        )}
                                                        {cert.orgName && (
                                                          <span className="resume-cert-org"> - {cert.orgName}</span>
                                                        )}
                                                        {cert.currentlypursuing ? (
                                                          <span className="resume-cert-date highlight-text"> (Currently Pursuing)</span>
                                                        ) : (cert.month || cert.year) && (
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
                                                    )
                                                  ))}
                                                </ul>
                                              </div>
                                            )}


                                            {projects.length > 0 && projects.some(p => p.projectName || p.proDescription) && (
                                              <div className="resume-section">
                                                <h2 className="resume-section-title">Projects</h2>
                                                {projects.map((proj, index) => (
                                                  (proj.projectName || proj.proDescription) && (
                                                    <div className="resume-project-item" key={`resume-proj-${index}`}>
                                                      <div className="resume-item-header">
                                                        <h3 className="resume-project-title">
                                                          {proj.projectName || 'Project'}
                                                          {proj.proyear && <span className="resume-project-year"> ({proj.proyear})</span>}
                                                        </h3>
                                                      </div>
                                                      {proj.proDescription && (
                                                        <div className="resume-item-content">
                                                          <p>{proj.proDescription}</p>
                                                        </div>
                                                      )}
                                                    </div>
                                                  )
                                                ))}
                                              </div>
                                            )}


                                            {interests.filter(i => i.trim() !== '').length > 0 && (
                                              <div className="resume-section">
                                                <h2 className="resume-section-title">Interests</h2>
                                                <div className="resume-interests-tags">
                                                  {interests.filter(i => i.trim() !== '').map((interest, index) => (
                                                    <span className="resume-interest-tag" key={`resume-interest-${index}`}>
                                                      {interest}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>


                                        {declaration?.text && (
                                          <div className="resume-declaration">
                                            <h2 className="resume-section-title">Declaration</h2>
                                            <p>{declaration.text}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Job History Tab */}
                                {activeTab === 2 && (
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
                                {activeTab === 3 && (
                                  <div className="tab-pane active" id="course-history">
                                    <div className="section-card">
                                      <div className="table-responsive">
                                        <table className="table table-hover table-bordered course-history-table">
                                          <thead className="table-light">
                                            <tr>
                                              <th>S.No</th>
                                              <th>Course Name</th>
                                              <th>Institute</th>
                                              <th>Completion Date</th>
                                              <th>Certificate ID</th>
                                              <th>Score</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {certificates.map((course, index) => (
                                              <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{course.certificateName}</td>
                                                <td>{course.orgName}</td>
                                                <td>{course.month} {course.year}</td>
                                                <td>CRT{index + 1}001</td>
                                                <td><span className="text-success">Completed</span></td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                )}

                              </div>
                            )}
                          </div>
                        </div>
                      ))}


                    </div>

                    {/* <div className="row" id="crm-main-row">
                    <div className={`card-content transition-col`} id="mainContent">



                      <div className="card border-0 shadow-sm mb-0 mt-2">
                        <div className="card-body px-1 py-0 my-2" >
                          <div className="row align-items-center">
                            <div className="col-md-6">
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
                                  
                                  <h6 className="mb-0 fw-bold">{profileData?.personalInfo?.name || user?.name || 'Your Name'}
</h6>
                                  <small className="text-muted">{profileData?.personalInfo?.mobile || user?.mobile || 'Mobile Number'}</small>
                                </div>
                                <div style={{ marginLeft: '15px' }}>
                                  <button className="btn btn-outline-primary btn-sm border-0" title="Call" style={{ fontSize: '20px' }}>
                                    <i className="fas fa-phone"></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-success btn-sm border-0"
                                    onClick={openWhatsappPanel}
                                    style={{ fontSize: '20px' }}
                                    title="WhatsApp"
                                  >
                                    <i className="fab fa-whatsapp"></i>
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="col-md-5">
                              <div className="d-flex gap-2">
                                <div className="flex-grow-1">
                                  <input
                                    type="text"
                                    className="form-control form-control-sm m-0" style={{
                                      cursor: 'pointer',
                                      border: '1px solid #ddd',
                                      borderRadius: '0px',
                                      borderTopRightRadius: '5px',
                                      borderTopLeftRadius: '5px', cursor: 'pointer',
                                      width: '145px',
                                      height: '20px', fontSize: '10px'
                                    }}
                                    value={crmFilters[activeCrmFilter].name}
                                    readOnly
                                    onClick={openEditPanel}
                                  />
                                  <input
                                    type="text"
                                    className="form-control form-control-sm m-0"
                                    value="Untouched Lead Long Text Example..."
                                    style={{
                                      cursor: 'pointer',
                                      border: '1px solid #ddd',
                                      borderRadius: '0px',
                                      borderBottomRightRadius: '5px',
                                      borderBottomLeftRadius: '5px', cursor: 'pointer',
                                      width: '145px',
                                      height: '20px', fontSize: '10px'
                                    }}
                                    readOnly
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="col-md-1 text-end">
                              <div className="btn-group">
                                <button
                                  className="btn btn-sm btn-outline-secondary border-0"
                                  onClick={() => setLeadDetailsVisible(!leadDetailsVisible)} style={{ border: 'none' }}
                                >
                                  {leadDetailsVisible ? (
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

                      
                      <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white border-bottom-0 py-3 mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <ul className="nav nav-pills nav-pills-sm">
                              {tabs.map((tab, index) => (
                                <li className="nav-item" key={index}>
                                  <button
                                    className={`nav-link ${activeTab === index ? 'active' : ''}`}
                                    onClick={() => handleTabClick(index)}
                                  >
                                    {tab}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                       
                        {leadDetailsVisible && (
                          <div>
                           
                            <div className={`tab-pane ${activeTab === 0 ? 'active' : ''}`} id="lead-details">

                             
                              <div className="scrollable-container">
                                <div className="scrollable-content">
                                  <div className="info-card">
                                    <div className="info-group">
                                      <div className="info-label">LEAD AGE</div>
                                      <div className="info-value">282 Days</div>
                                    </div>
                                    <div className="info-group">
                                      <div className="info-label">Lead Owner</div>
                                      <div className="info-value">Meta Ads Inbound IVR Inbound Call</div>
                                    </div>
                                    <div className="info-group">
                                      <div className="info-label">COURSE / JOB NAME</div>
                                      <div className="info-value">Operator</div>
                                    </div>
                                    <div className="info-group">
                                      <div className="info-label">BATCH NAME</div>
                                      <div className="info-value">-</div>
                                    </div>
                                  </div>

                                  <div className="info-card">
                                    <div className="info-group">
                                      <div className="info-label">TYPE OF PROJECT</div>
                                      <div className="info-value">Job</div>
                                    </div>
                                    <div className="info-group">
                                      <div className="info-label">PROJECT</div>
                                      <div className="info-value">Job</div>
                                    </div>
                                    <div className="info-group">
                                      <div className="info-label">SECTOR</div>
                                      <div className="info-value">Retail</div>
                                    </div>
                                    <div className="info-group">
                                      <div className="info-label">LEAD CREATION DATE</div>
                                      <div className="info-value">Jan 15, 2024 9:29 AM</div>
                                    </div>
                                  </div>

                                  <div className="info-card">
                                    <div className="info-group">
                                      <div className="info-label">STATE</div>
                                      <div className="info-value">Uttar Pradesh</div>
                                    </div>
                                    <div className="info-group">
                                      <div className="info-label">City</div>
                                      <div className="info-value">Chandauli</div>
                                    </div>
                                    <div className="info-group">
                                      <div className="info-label">BRANCH NAME</div>
                                      <div className="info-value">PSD Chandauli Center</div>
                                    </div>
                                    <div className="info-group">
                                      <div className="info-label">LEAD MODIFICATION DATE</div>
                                      <div className="info-value">Mar 21, 2025 3:32 PM</div>
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
                                            <div className="info-value">282 Days</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">Lead Owner</div>
                                            <div className="info-value">Meta Ads Inbound IVR Inbound Call</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">COURSE / JOB NAME</div>
                                            <div className="info-value">Operator</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">BATCH NAME</div>
                                            <div className="info-value"></div>
                                          </div>
                                        </div>

                                        <div className="info-card">
                                          <div className="info-group">
                                            <div className="info-label">TYPE OF PROJECT</div>
                                            <div className="info-value">Job</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">PROJECT</div>
                                            <div className="info-value">Job</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">SECTOR</div>
                                            <div className="info-value">Retail</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">LEAD CREATION DATE</div>
                                            <div className="info-value">Jan 15, 2024 9:29 AM</div>
                                          </div>
                                        </div>

                                        <div className="info-card">
                                          <div className="info-group">
                                            <div className="info-label">STATE</div>
                                            <div className="info-value">Uttar Pradesh</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">City</div>
                                            <div className="info-value">Job</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">BRANCH NAME</div>
                                            <div className="info-value">PSD Chandauli Center</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">LEAD MODIFICATION DATE</div>
                                            <div className="info-value">Mar 21, 2025 3:32 PM</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">LEAD MODIFICATION By</div>
                                            <div className="info-value">Mar 21, 2025 3:32 PM</div>
                                          </div>
                                          <div className="info-group">
                                            <div className="info-label">Counsellor Name</div>
                                            <div className="info-value">Name</div>
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
                                            <div className="info-value">282 Days</div>
                                          </div>
                                        </div>

                                        <div className="col-xl-3 col-3">
                                          <div className="info-group">
                                            <div className="info-label">STATE</div>
                                            <div className="info-value">Uttar Pradesh</div>
                                          </div>
                                        </div>
                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">CITY</div>
                                            <div className="info-value"></div>
                                          </div>
                                        </div>
                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">TYPE OF PROJECT</div>
                                            <div className="info-value">Job</div>
                                          </div>
                                        </div>
                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">PROJECT</div>
                                            <div className="info-value">Job</div>
                                          </div>
                                        </div>
                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">Sector</div>
                                            <div className="info-value">Retail</div>
                                          </div>
                                        </div>
                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">COURSE / JOB NAME</div>
                                            <div className="info-value">Operator</div>
                                          </div>
                                        </div>
                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">BATCH NAME</div>
                                            <div className="info-value"></div>
                                          </div>
                                        </div>
                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">SECTOR</div>
                                            <div className="info-value">Retail</div>
                                          </div>
                                        </div>
                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">BRANCH NAME</div>
                                            <div className="info-value">PSD Chandauli Center</div>
                                          </div>
                                        </div>
                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">NEXT ACTION DATE</div>
                                            <div className="info-value"></div>
                                          </div>
                                        </div>

                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">LEAD CREATION DATE</div>
                                            <div className="info-value">Jan 15, 2024 9:29 AM</div>
                                          </div>
                                        </div>
                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">LEAD MODIFICATION DATE</div>
                                            <div className="info-value">Mar 21, 2025  col-3:32 PM</div>
                                          </div>
                                        </div>
                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">LEAD MODIFICATION BY</div>
                                            <div className="info-value">Name</div>
                                          </div>
                                        </div>
                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">Counsellor Name</div>
                                            <div className="info-value">Name</div>
                                          </div>
                                        </div>
                                        <div className="col-xl- col-3">
                                          <div className="info-group">
                                            <div className="info-label">LEAD OWNER</div>
                                            <div className="info-value">Rahul Sharma</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                           
                            <div className={`tab-pane ${activeTab === 1 ? 'active' : ''}`} id="profile">
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
                                          {profileData?.personalInfo?.name || user?.name || 'Your Name'}
                                        </h1>
                                        <p className="resume-title">
                                          {profileData?.personalInfo?.professionalTitle || 'Professional Title'}
                                        </p>
                                        <p className="resume-title">
                                          {profileData?.personalInfo?.sex || 'Sex'}
                                        </p>

                                        <div className="resume-contact-details">
                                          {profileData?.mobile && (
                                            <div className="resume-contact-item">
                                              <i className="bi bi-telephone-fill"></i>
                                              <span>{profileData.mobile}</span>
                                            </div>
                                          )}
                                          {profileData?.email && (
                                            <div className="resume-contact-item">
                                              <i className="bi bi-envelope-fill"></i>
                                              <span>{profileData.email}</span>
                                            </div>
                                          )}
                                          {profileData?.dob && (
                                            <div className="resume-contact-item">
                                              <i className="bi bi-calendar-heart-fill"></i>
                                              {profileData.dob ? new Date(profileData.dob).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                              }) : ''}
                                            </div>
                                          )}
                                          {profileData?.personalInfo?.currentAddress?.fullAddress && (
                                            <div className="resume-contact-item">
                                              <i className="bi bi-geo-alt-fill"></i>
                                              <span>Current:{profileData.personalInfo.currentAddress.fullAddress}</span>
                                            </div>
                                          )}
                                          {profileData?.personalInfo?.permanentAddress && (
                                            <div className="resume-contact-item">
                                              <i className="bi bi-house-fill"></i>
                                              <span>Permanent: {profileData.personalInfo.permanentAddress.fullAddress}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="resume-summary">
                                      <h2 className="resume-section-title">Professional Summary</h2>
                                      <p>{profileData?.personalInfo?.summary || 'No summary provided'}</p>
                                    </div>
                                  </div>

                                 
                                  <div className="resume-document-body">
                                    
                                    <div className="resume-column resume-left-column">
                                      
                                      {profileData?.experienceType === 'fresher' ? (
                                        <div className="resume-section">
                                          <h2 className="resume-section-title">Work Experience</h2>
                                          <div className="resume-experience-item">
                                            <div className="resume-item-header">
                                              <h3 className="resume-item-title">Fresher</h3>
                                            </div>
                                            {profileData?.fresherDetails && (
                                              <div className="resume-item-content">
                                                <p>{profileData.isExperienced}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        experiences.length > 0 && experiences.some(exp => exp.jobTitle || exp.companyName || exp.jobDescription) && (
                                          <div className="resume-section">
                                            <h2 className="resume-section-title">Work Experience</h2>
                                            {experiences.map((exp, index) => (
                                              (exp.jobTitle || exp.companyName || exp.jobDescription) && (
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
                                              )
                                            ))}
                                          </div>
                                        )
                                      )}

                                    
                                      {educations.length > 0 && educations.some(edu =>
                                        edu.education || edu.course || edu.schoolName || edu.collegeName || edu.universityName || edu.passingYear
                                      ) && (
                                          <div className="resume-section">
                                            <h2 className="resume-section-title">Education</h2>
                                            {educations.map((edu, index) => (
                                              (edu.education || edu.course || edu.schoolName || edu.collegeName || edu.universityName || edu.passingYear) && (
                                                <div className="resume-education-item" key={`resume-edu-${index}`}>
                                                  <div className="resume-item-header">
                                                    {edu.education && (
                                                      <h3 className="resume-item-title">
                                                        {educationList.find(e => e._id === edu.education)?.name || 'Education'}
                                                      </h3>
                                                    )}
                                                    {typeof edu.course === 'string' && edu.course && (
                                                      <h3 className="resume-item-title">
                                                        {coursesList[index]?.find(course => course._id === edu.course)?.name || edu.course}
                                                      </h3>
                                                    )}
                                                    {edu.universityName && (
                                                      <p className="resume-item-subtitle">{edu.universityName}</p>
                                                    )}
                                                    {(edu.schoolName && !edu.universityName) && (
                                                      <p className="resume-item-subtitle">{edu.schoolName}</p>
                                                    )}
                                                    {edu.collegeName && (
                                                      <p className="resume-item-subtitle">{edu.collegeName}</p>
                                                    )}
                                                    {edu.currentlypursuing ? (
                                                      <p className="resume-item-period highlight-text">Currently Pursuing</p>
                                                    ) : edu.passingYear ? (
                                                      <p className="resume-item-period">{edu.passingYear}</p>
                                                    ) : null}
                                                  </div>
                                                  <div className="resume-item-content">
                                                    {edu.marks && <p>Marks: {edu.marks}%</p>}
                                                    {edu.specialization && <p>Specialization: {typeof edu.specialization === 'string' ? edu.specialization : 'Specialization'}</p>}
                                                  </div>
                                                </div>
                                              )
                                            ))}
                                          </div>
                                        )}
                                    </div>

                                  
                                    <div className="resume-column resume-right-column">
                                      
                                      {skills.length > 0 && skills.some(skill => skill.skillName) && (
                                        <div className="resume-section">
                                          <h2 className="resume-section-title">Skills</h2>
                                          <div className="resume-skills-list">
                                            {skills.map((skill, index) => (
                                              skill.skillName && (
                                                <div className="resume-skill-item" key={`resume-skill-${index}`}>
                                                  <div className="resume-skill-name">{skill.skillName}</div>
                                                  <div className="resume-skill-bar-container">
                                                    <div
                                                      className="resume-skill-bar"
                                                      style={{ width: `${skill.skillPercent || 0}%` }}
                                                    ></div>
                                                  </div>
                                                </div>
                                              )
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                     
                                      {languages.length > 0 && languages.some(lang => lang.lname) && (
                                        <div className="resume-section">
                                          <h2 className="resume-section-title">Languages</h2>
                                          <div className="resume-languages-list">
                                            {languages.map((lang, index) => (
                                              lang.lname && (
                                                <div className="resume-language-item" key={`resume-lang-${index}`}>
                                                  <div className="resume-language-name">{lang.lname}</div>
                                                  <div className="resume-language-level">
                                                    {[1, 2, 3, 4, 5].map(dot => (
                                                      <span
                                                        key={`resume-lang-dot-${index}-${dot}`}
                                                        className={`resume-level-dot ${dot <= (lang.level || 0) ? 'filled' : ''}`}
                                                      ></span>
                                                    ))}
                                                  </div>
                                                </div>
                                              )
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                     
                                      {certificates.length > 0 && certificates.some(cert => cert.certificateName || cert.orgName) && (
                                        <div className="resume-section">
                                          <h2 className="resume-section-title">Certifications</h2>
                                          <ul className="resume-certifications-list">
                                            {certificates.map((cert, index) => (
                                              (cert.certificateName || cert.orgName) && (
                                                <li key={`resume-cert-${index}`} className="resume-certification-item">
                                                  {cert.certificateName && (
                                                    <strong>{cert.certificateName}</strong>
                                                  )}
                                                  {cert.orgName && (
                                                    <span className="resume-cert-org"> - {cert.orgName}</span>
                                                  )}
                                                  {cert.currentlypursuing ? (
                                                    <span className="resume-cert-date highlight-text"> (Currently Pursuing)</span>
                                                  ) : (cert.month || cert.year) && (
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
                                              )
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      
                                      {projects.length > 0 && projects.some(p => p.projectName || p.proDescription) && (
                                        <div className="resume-section">
                                          <h2 className="resume-section-title">Projects</h2>
                                          {projects.map((proj, index) => (
                                            (proj.projectName || proj.proDescription) && (
                                              <div className="resume-project-item" key={`resume-proj-${index}`}>
                                                <div className="resume-item-header">
                                                  <h3 className="resume-project-title">
                                                    {proj.projectName || 'Project'}
                                                    {proj.proyear && <span className="resume-project-year"> ({proj.proyear})</span>}
                                                  </h3>
                                                </div>
                                                {proj.proDescription && (
                                                  <div className="resume-item-content">
                                                    <p>{proj.proDescription}</p>
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          ))}
                                        </div>
                                      )}

                                      
                                      {interests.filter(i => i.trim() !== '').length > 0 && (
                                        <div className="resume-section">
                                          <h2 className="resume-section-title">Interests</h2>
                                          <div className="resume-interests-tags">
                                            {interests.filter(i => i.trim() !== '').map((interest, index) => (
                                              <span className="resume-interest-tag" key={`resume-interest-${index}`}>
                                                {interest}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                 
                                  {declaration?.text && (
                                    <div className="resume-declaration">
                                      <h2 className="resume-section-title">Declaration</h2>
                                      <p>{declaration.text}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            
                            <div className={`tab-pane ${activeTab === 2 ? 'active' : ''}`} id="job-history">
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

                            
                            <div className={`tab-pane ${activeTab === 3 ? 'active' : ''}`} id="course-history">
                              <div className="section-card">
                                <div className="table-responsive">
                                  <table className="table table-hover table-bordered course-history-table">
                                    <thead className="table-light">
                                      <tr>
                                        <th>S.No</th>
                                        <th>Course Name</th>
                                        <th>Institute</th>
                                        <th>Completion Date</th>
                                        <th>Certificate ID</th>
                                        <th>Score</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {certificates.map((course, index) => (
                                        <tr key={index}>
                                          <td>{index + 1}</td>
                                          <td>{course.certificateName}</td>
                                          <td>{course.orgName}</td>
                                          <td>{course.month} {course.year}</td>
                                          <td>CRT{index + 1}001</td>
                                          <td><span className="text-success">Completed</span></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>  */}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Right Sidebar for Desktop - Panels */}
      {!isMobile && (
        <div className="col-4">
          <div className="row sticky-top stickyBreakpoints">
            {renderEditPanel()}
            {renderWhatsAppPanel()}
          </div>
        </div>
      )}

      {/* Mobile Modals */}
      {isMobile && renderEditPanel()}
      {isMobile && renderWhatsAppPanel()}

      <style jsx>
        {`
        html body .content .content-wrapper {
          padding: calc(0.9rem - 0.1rem) 1.2rem
        }

        .container-fluid.py-2 {
          position: sticky!important;
          top: 0;
          z-index: 1020;
          background-color: white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
.stickyBreakpoints {
  position: sticky;
  top: 20px;  /* default top */
  z-index: 1020;
}
        @media(max-width:1920px){
          .stickyBreakpoints{
            top: 20%
          }
        }
        
        @media(max-width:1400px){
          .stickyBreakpoints{
            top: 17%
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
        .bgcolor{
        background-color:#f1f2f6!important;
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

        #whatsappPanel{
        height: 73dvh;
        }
          .info-group{
          padding:8px;}
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .modal-dialog {
            margin: 0.5rem;
            max-width: calc(100% - 1rem);
          }

          .whatsapp-chat .modal-content {
            height: 90vh;
          }

          .col-md-6, .col-md-5, .col-md-1 {
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
        `}
      </style>
    </div>
  );
};

export default CRMDashboard;

