import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowDown, 
  faArrowUp, 
  faSearch, 
  faSignInAlt 
} from '@fortawesome/free-solid-svg-icons';

const Registrations = () => {
  // Environment variables
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // State management
  const [candidates, setCandidates] = useState([]);
  const [filterData, setFilterData] = useState({
    name: '',
    courseType: '',
    FromDate: '',
    ToDate: '',
    status: 'true'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [sorting, setSorting] = useState({
    value: 'createdAt',
    order: -1
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseFormData, setCourseFormData] = useState({
    assignDate: '',
    url: '',
    remarks: ''
  });
  const [statusMessages, setStatusMessages] = useState({
    success: '',
    error: ''
  });

  // Fetch candidates on component mount and when filters/sorting/pagination change
  useEffect(() => {
    fetchCandidates();
  }, [pagination.currentPage, sorting]);

  const fetchCandidates = async () => {
    try {
      // Build query string from filter data
      const queryParams = new URLSearchParams();
      Object.keys(filterData).forEach(key => {
        if (filterData[key]) {
          queryParams.append(key, filterData[key]);
        }
      });
      // Add pagination and sorting
      queryParams.append('page', pagination.currentPage);
      queryParams.append('value', sorting.value);
      queryParams.append('order', sorting.order);

      const response = await axios.get(`${backendUrl}/admin/courses/registrations?${queryParams.toString()}`);
      
      if (response.data) {
        setCandidates(response.data.candidates || []);
        setPagination({
          currentPage: parseInt(response.data.page) || 1,
          totalPages: response.data.totalPages || 1
        });
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  // Handle filter form submission
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    // Validate dates
    if ((filterData.FromDate && !filterData.ToDate) || (!filterData.FromDate && filterData.ToDate)) {
      return; // Both dates must be provided or neither
    }
    // Reset to first page when applying new filters
    setPagination({...pagination, currentPage: 1});
    fetchCandidates();
  };

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterData({
      ...filterData,
      [name]: value
    });
  };

  // Handle sorting
  const handleSorting = (column) => {
    if (sorting.value === column) {
      // Toggle order if same column
      setSorting({
        ...sorting,
        order: sorting.order * -1
      });
    } else {
      // New column with default descending order
      setSorting({
        value: column,
        order: -1
      });
    }
  };

  // Handle lead status update
  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.post(`${backendUrl}/admin/courses/leadStatus`, {
        id,
        status
      });
      // Refresh data or update locally
      fetchCandidates();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Handle pagination click
  const handlePageChange = (page) => {
    setPagination({...pagination, currentPage: page});
  };

  // Handle course assignment modal
  const handleActionClick = (candidate) => {
    setSelectedCandidate(candidate);
    
    // Format date for input if it exists
    let formattedDate = '';
    if (candidate.assignDate) {
      formattedDate = moment(candidate.assignDate).format('YYYY-MM-DD');
    } else {
      formattedDate = moment().format('YYYY-MM-DD');
    }

    setCourseFormData({
      assignDate: formattedDate,
      url: candidate.url || '',
      remarks: candidate.remarks || ''
    });
    
    setShowCourseModal(true);
  };

  // Handle course assignment
  const assignCourse = async () => {
    try {
      const updateCourse = {
        url: courseFormData.url,
        remarks: courseFormData.remarks,
        courseStatus: 0,
        assignDate: new Date(courseFormData.assignDate).toISOString()
      };

      await axios.put(`${backendUrl}/admin/courses/assignCourses/${selectedCandidate._id}`, updateCourse);
      
      setStatusMessages({
        success: 'Course assigned successfully!',
        error: ''
      });
      
      // Close modal and refresh
      setTimeout(() => {
        setShowCourseModal(false);
        fetchCandidates();
      }, 1000);
    } catch (error) {
      console.error('Error assigning course:', error);
      setStatusMessages({
        success: '',
        error: 'Failed to assign course. Please try again.'
      });
    }
  };

  // Handle login as candidate
  const loginAs = async (mobile) => {
    try {
      const response = await axios.post(`${backendUrl}/api/loginAsCandidate`, {
        mobile,
        module: 'candidate'
      });
      
      if (response.data.role === 3) {
        localStorage.setItem('candidate', response.data.name);
        localStorage.setItem('token', response.data.token);
        window.location.href = '/candidate/dashboard';
      }
    } catch (error) {
      console.error('Error logging in as candidate:', error);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilterData({
      name: '',
      courseType: '',
      FromDate: '',
      ToDate: '',
      status: 'true'
    });
    
    // Reset pagination and fetch data
    setPagination({...pagination, currentPage: 1});
    
    // Need to wait for state update before fetching
    setTimeout(() => {
      fetchCandidates();
    }, 0);
  };

  // Generate pagination links
  const renderPagination = () => {
    const { currentPage, totalPages } = pagination;
    if (totalPages <= 1) return null;

    let first = 1;
    let last = totalPages > 4 ? 4 : totalPages;

    if (totalPages > 4 && currentPage >= 2) {
      first = currentPage - 1;
      last = currentPage + 1;
      if (last > totalPages) last = totalPages;
    }

    const pages = [];

    // First page button if not at the beginning
    if (first > 1) {
      pages.push(
        <li key="first" className="page-item">
          <button className="page-link" onClick={() => handlePageChange(1)}>
            First
          </button>
        </li>
      );
    }

    // Page numbers
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

    // Last page button if not at the end
    if (last < totalPages) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <button className="page-link" onClick={() => handlePageChange(last + 1)}>
            ...
          </button>
        </li>
      );
      
      pages.push(
        <li key="last" className="page-item">
          <button className="page-link" onClick={() => handlePageChange(totalPages)}>
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

  return (
    <div className="content-body">
      {/* Breadcrumbs */}
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-12 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-9">
              <h3 className="content-header-title float-left mb-0">Registrations</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><Link to="/admin">Home</Link></li>
                  <li className="breadcrumb-item active">Registrations</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="list-view">
        <div className="row">
          <div className="col-12 rounded equal-height-2 coloumn-2">
            <div className="card">
              <div className="row">
                <div className="card-content col-12">
                  {/* Filter Form */}
                  <div className="row mb-2">
                    <div className="col-xl-12 col-lg-12 px-3">
                      <form onSubmit={handleFilterSubmit} id="filterForm">
                        <div className="row">
                          <div className="col-xl-3 mt-1">
                            <label>Name/ Mobile/ Whatsapp</label>
                            <input 
                              type="text" 
                              name="name" 
                              className="form-control" 
                              id="username" 
                              value={filterData.name}
                              onChange={handleFilterChange}
                              maxLength="25"
                            />
                          </div>
                          <div style={{ marginTop: '2.5rem !important' }} className="col-xl-3 text-center mt-3">
                            <button className="btn btn-success waves-effect waves-light text-white d-inline" type="submit">
                              Go
                            </button>
                            <button 
                              className="extra-ss btn btn-danger d-inline waves-effect waves-light mb-md-0 mb-2 text-white mx-1" 
                              type="button"
                              onClick={resetFilters}
                            >
                              RESET
                            </button>
                          </div>
                          <div className="col-xl-6 text-right mt-3">
                            <div className="custom-control custom-checkbox">
                              <input 
                                type="checkbox" 
                                className="custom-control-input" 
                                id="filterToggle"
                                checked={showAdvancedFilters}
                                onChange={() => setShowAdvancedFilters(!showAdvancedFilters)}
                              />
                              <label className="custom-control-label" htmlFor="filterToggle"></label>
                            </div>
                          </div>
                        </div>

                        {/* Advanced Filters */}
                        <div 
                          className="row justify-content-start advanced-filters" 
                          style={{ 
                            maxHeight: showAdvancedFilters ? '300px' : '0px',
                            opacity: showAdvancedFilters ? '1' : '0',
                            transition: '0.3s ease-in-out',
                            overflow: 'hidden' 
                          }}
                        >
                          <div className="col-xl-2 ml-1 mt-1">
                            <label>Course Fee Type</label>
                            <select 
                              className="form-control text-capitalize" 
                              name="courseType" 
                              id="courseType"
                              value={filterData.courseType}
                              onChange={handleFilterChange}
                            >
                              <option value="">Select</option>
                              <option className="text-capitalize" value="Free">Free</option>
                              <option className="text-capitalize" value="Paid">Paid</option>
                            </select>
                          </div>
                          <div className="col-xl-2 ml-1 mt-1">
                            <label>From Date</label>
                            <input 
                              type="date" 
                              className="form-control" 
                              id="from-date" 
                              name="FromDate"
                              value={filterData.FromDate}
                              onChange={handleFilterChange}
                            />
                          </div>
                          <div className="col-xl-2 ml-1 mt-1">
                            <label>To Date</label>
                            <input 
                              type="date" 
                              className="form-control" 
                              id="to-date" 
                              name="ToDate"
                              value={filterData.ToDate}
                              onChange={handleFilterChange}
                            />
                          </div>
                          <input type="hidden" className="form-control" name="status" value="true" />
                          <div style={{ marginTop: '2.5rem !important' }} className="col-xl-3 text-center mt-3">
                            <button
                              className="btn btn-success waves-effect waves-light text-white d-inline"
                              type="submit"
                            >
                              Go
                            </button>
                            <button
                              className="extra-ss btn btn-danger d-inline waves-effect waves-light mb-sm-0 mb-2 text-white mx-1"
                              type="button"
                              onClick={resetFilters}
                            >
                              RESET
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Candidates Table */}
                  <div className="table-responsive">
                    <table id="tblexportData" className="table table-hover-animation mb-0 table-hover" width="100%">
                      <thead>
                        <tr>
                          <th 
                            className="three column wide" 
                            width="18%" 
                            style={{ cursor: 'pointer' , whiteSpace : 'nowrap'}} 
                            onClick={() => handleSorting('createdAt')}
                          >
                            DATE 
                            <FontAwesomeIcon 
                              icon={sorting.value === 'createdAt' ? 
                                (sorting.order === 1 ? faArrowUp : faArrowDown) : 
                                faArrowDown} 
                              className="success cursors pointer" 
                            />
                          </th>
                          <th 
                            className="three column wide candidate-wrap" 
                            width="19%" 
                            onClick={() => handleSorting('name')}
                            style={{ cursor: 'pointer' , whiteSpace : 'nowrap' }}
                          >
                            CANDIDATE NAME
                            {sorting.value === 'name' && (
                              <FontAwesomeIcon 
                                icon={sorting.order === 1 ? faArrowUp : faArrowDown} 
                                className="success cursors pointer ml-1" 
                              />
                            )}
                          </th>
                          <th className="one column wide" width="15%">MOBILE NO.</th>
                          <th className="one column wide" width="15%">Email</th>
                          <th className="one column wide" width="15%">Document Status</th>
                          <th className="one column wide" width="15%">Lead Status</th>
                          <th className="one column wide" width="15%">Demo Status</th>
                          <th className="one column wide" width="15%">Center Status</th>
                          <th 
                            className="one column wide" 
                            width="7%" 
                            style={{ cursor: 'pointer' }} 
                            onClick={() => handleSorting('courseName')}
                          >
                            Course
                            {sorting.value === 'courseName' && (
                              <FontAwesomeIcon 
                                icon={sorting.order === 1 ? faArrowUp : faArrowDown} 
                                className="success cursors pointer ml-1" 
                              />
                            )}
                          </th>
                          <th 
                            className="one column wide" 
                            width="7%" 
                            style={{ cursor: 'pointer' }} 
                            onClick={() => handleSorting('registrationCharges')}
                          >
                            Reg Fee
                            {sorting.value === 'registrationCharges' && (
                              <FontAwesomeIcon 
                                icon={sorting.order === 1 ? faArrowUp : faArrowDown} 
                                className="success cursors pointer ml-1" 
                              />
                            )}
                          </th>
                          <th className="one column wide" width="7%" style={{ cursor: 'pointer' }}>
                            Reg Status
                          </th>
                          <th 
                            className="one column wide" 
                            width="7%" 
                            style={{ cursor: 'pointer' }} 
                            onClick={() => handleSorting('sector')}
                          >
                            Sector
                            {sorting.value === 'sector' && (
                              <FontAwesomeIcon 
                                icon={sorting.order === 1 ? faArrowUp : faArrowDown} 
                                className="success cursors pointer ml-1" 
                              />
                            )}
                          </th>
                          <th className="one column wide" width="10%" style={{ cursor: 'pointer' }}>Course Fee Type</th>
                          <th className="one column wide" width="10%" style={{ cursor: 'pointer' }}>Registered By</th>
                          <th className="one column wide" width="10%">Action</th>
                          <th className="one column wide" width="10%">View Docs</th>
                          <th className="one column wide" width="10%">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidates && candidates.length > 0 ? (
                          candidates.map((candidate, index) => (
                            <tr key={index}>
                              <td className="text-capitalize">
                                {candidate.createdAt ? 
                                  moment(candidate.createdAt).format('MMM DD YYYY hh:mm A') : 
                                  "N/A"}
                              </td>
                              <td className="text-capitalize candid-wrap">
                                {candidate.name || "N/A"}
                              </td>
                              <td className="text-capitalize">
                                {candidate.mobile || "N/A"}
                              </td>
                              <td className="text-capitalize">
                                {candidate.email || "N/A"}
                              </td>
                              <td className="text-capitalize">
                                {candidate.docProgress && candidate.docProgress.totalRequired && 
                                  candidate.docProgress.totalRequired > 0 ? (
                                  <div 
                                    className="circular-progress-container" 
                                    data-percent={candidate.docProgress.percent}
                                  >
                                    <svg width="40" height="40">
                                      <circle className="circle-bg" cx="20" cy="20" r="16"></circle>
                                      <circle 
                                        className="circle-progress" 
                                        cx="20" 
                                        cy="20" 
                                        r="16"
                                        style={{
                                          strokeDasharray: `${2 * Math.PI * 16}`,
                                          strokeDashoffset: `${2 * Math.PI * 16 - (candidate.docProgress.percent / 100) * 2 * Math.PI * 16}`
                                        }}
                                      ></circle>
                                    </svg>
                                    <div className="progress-text">
                                      {candidate.docProgress.percent}%
                                    </div>
                                  </div>
                                ) : (
                                  "NDR"
                                )}
                              </td>
                              <td className="text-capitalize">
                                <select 
                                  onChange={(e) => handleStatusUpdate(candidate._id, e.target.value)} 
                                  className="form-control leadsSelect"
                                  value={candidate.leadStatus || ""}
                                >
                                  <option value="">Select</option>
                                  <option value="Hot">Hot</option>
                                  <option value="Warm">Warm</option>
                                  <option value="Cold">Cold</option>
                                </select>
                              </td>
                              <td className="text-capitalize">
                                <select 
                                  className="form-control leadsSelect"
                                  value={candidate.demoStatus || ""}
                                  onChange={(e) => {
                                    // Handle demo status change
                                  }}
                                >
                                  <option value="">Select</option>
                                  <option value="Demo Scheduled">Demo Scheduled</option>
                                  <option value="Demo Pending">Demo Pending</option>
                                  <option value="Demo Done">Demo Done</option>
                                </select>
                              </td>
                              <td className="text-capitalize">
                                <select 
                                  className="form-control leadsSelect"
                                  value={candidate.centerStatus || ""}
                                  onChange={(e) => {
                                    // Handle center status change
                                  }}
                                >
                                  <option value="">Select</option>
                                  <option value="Add Center">Add Center</option>
                                  <option value="Rejected">Rejected</option>
                                  <option value="Drop Out">Drop Out</option>
                                </select>
                              </td>
                              <td className="text-capitalize">
                                {candidate.courseName || "N/A"}
                              </td>
                              <td className="text-capitalize">
                                {candidate.registrationCharges || "N/A"}
                              </td>
                              <td className="text-capitalize">
                                {candidate.registrationFee ? candidate.registrationFee : "Unpaid"}
                              </td>
                              <td className="text-capitalize">
                                {candidate.sector || "N/A"}
                              </td>
                              <td className="text-capitalize">
                                {candidate.courseFeeType || "Free/Paid"}
                              </td>
                              <td className="text-capitalize">
                                {candidate.registeredByName || "N/A"}
                              </td>
                              <td className="text-capitalize">
                                <button 
                                  className={`btn ${candidate.courseStatus === 0 ? 'btn-danger' : 'btn-success'} waves-effect waves-light text-white d-inline btn-sm`}
                                  onClick={() => handleActionClick(candidate)}
                                >
                                  {candidate.courseStatus === 0 ? 'DUE' : 'Assigned'}
                                </button>
                              </td>
                              <td className="text-capitalize">
                                <Link 
                                  to={`/admin/courses/${candidate.courseId}/${candidate.candidateId}/docsview`} 
                                  className="btn btn-danger waves-effect waves-light text-white d-inline btn-sm"
                                  style={{ padding: '8px' }}
                                >
                                  View Docs
                                </Link>
                              </td>
                              <td className="text-capitalize">
                                <FontAwesomeIcon 
                                  icon={faSignInAlt} 
                                  className="fa-lg primary cursor-pointer loginIcon" 
                                  title="Login as user" 
                                  onClick={() => loginAs(candidate.mobile)}
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            {/* <td colSpan="17" className="text-center">
                              <div className="p-3">No Record Found</div>
                            </td> */}
                            <td  className="text-center">
                              May 13 2025 10:56 AM
                            </td>
                            <td  className="text-center">
                              Akash
                            </td>
                            <td  className="text-center">
                             6230211219
                            </td>
                            <td  className="text-center">
                              muskaanmehra814@gmail.com
                            </td>
                            <td  className="text-center">
                              nr
                            </td>
                            <td  className="text-center">
                              dropdown
                            </td>
                            <td  className="text-center">
                              dropdown
                            </td>
                            <td  className="text-center">
                              dropdown
                            </td>
                            <td  className="text-center">
                              guest service  associate (food & beverage)	
                            </td>
                            <td  className="text-center">
                              No Fees	
                            </td>
                            <td  className="text-center">
                              Unpaid	
                            </td>
                            <td  className="text-center">
                              tourism and hospitality
                            </td>
                            <td  className="text-center">
                              Free/paid
                            </td>
                            <td  className="text-center">
                              Daman Chaudhary
                            </td>
                            <td className="text-capitalize">
                                <button 
                                  className={`btn`}
                                 
                                >
                                  
                                </button>
                              </td>
                              <td className="text-capitalize">
                                <a 
                                  className="btn btn-danger waves-effect waves-light text-white d-inline btn-sm"
                                  style={{ padding: '8px' }}
                                >
                                  View Docs
                                </a>
                              </td>
                              <td className="text-capitalize">
                                <FontAwesomeIcon 
                                  icon={faSignInAlt} 
                                  className="fa-lg primary cursor-pointer loginIcon" 
                                  title="Login as user" 
                                />
                              </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    {renderPagination()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Assignment Modal */}
      {showCourseModal && (
        <div className="modal fade show" id="courseAssignModal" tabIndex="-1" role="dialog" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-white text-uppercase">Assign Course</h5>
                <button type="button" className="close" onClick={() => setShowCourseModal(false)}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body pt-1">
                <div className="row">
                  <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-1 text-left">
                    <label>Date</label>
                    <input 
                      className="form-control text-capitalize" 
                      type="date" 
                      value={courseFormData.assignDate}
                      onChange={(e) => setCourseFormData({...courseFormData, assignDate: e.target.value})}
                    />
                  </div>
                  <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-1 text-left">
                    <label>Course URL</label>
                    <input 
                      className="form-control text-capitalize" 
                      type="text" 
                      value={courseFormData.url}
                      onChange={(e) => setCourseFormData({...courseFormData, url: e.target.value})}
                    />
                  </div>
                  <div className="col-xl-12 mb-1 text-left">
                    <label>Remarks</label>
                    <textarea 
                      className="form-control" 
                      cols="5" 
                      rows="3"
                      value={courseFormData.remarks}
                      onChange={(e) => setCourseFormData({...courseFormData, remarks: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                {statusMessages.success && (
                  <p className="text-success font-weight-bolder">{statusMessages.success}</p>
                )}
                {statusMessages.error && (
                  <p className="text-danger font-weight-bolder">{statusMessages.error}</p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={assignCourse}>
                  Assigned
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        #tblexportData td {
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
        
        .leadsSelect {
          width: 75px;
        }
        
        .advanced-filters {
          max-height: 0;
          opacity: 0;
          transition: max-height 0.3s ease, opacity 0.3s ease;
        }
        
        /* Modal backdrop */
        .modal-backdrop {
          background-color: rgba(0,0,0,0.5);
        }
          #tblexportData thead tr th{
          font-size: 12px;
    color: #626262;
    font-weight: 700;
          }
      `}</style>
    </div>
  );
};

export default Registrations;

// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import { useNavigate, useLocation, Link } from 'react-router-dom';
// import { 
//   Container, 
//   Row, 
//   Col, 
//   Card, 
//   Table, 
//   Form, 
//   Button, 
//   Breadcrumb,
//   Modal,
//   Alert
// } from 'react-bootstrap';
// import { Edit, LogIn } from 'react-feather';
// import moment from 'moment';
// import qs from 'query-string';
// import "./Registration.css";
// const Registrations = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
//   const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

//   // State variables
//   const [candidates, setCandidates] = useState([]);
//   const [totalPages, setTotalPages] = useState(1);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
//   const [canView, setCanView] = useState(true);
//   const [flashMessage, setFlashMessage] = useState(null);
//   const [sortingValue, setSortingValue] = useState('');
//   const [sortingOrder, setSortingOrder] = useState(1);

//   // Modal state
//   const [showModal, setShowModal] = useState(false);
//   const [modalData, setModalData] = useState({
//     id: '',
//     remarks: '',
//     assignDate: '',
//     url: ''
//   });

//   // Filter state
//   const [filterData, setFilterData] = useState({
//     name: '',
//     FromDate: '',
//     ToDate: '',
//     courseType: '',
//     status: 'true'
//   });

//   // Get query params from URL
//   useEffect(() => {
//     const queryParams = qs.parse(location.search);
//     setCurrentPage(parseInt(queryParams.page) || 1);
    
//     // Set filter data from query params
//     setFilterData({
//       name: queryParams.name || '',
//       FromDate: queryParams.FromDate || '',
//       ToDate: queryParams.ToDate || '',
//       courseType: queryParams.courseType || '',
//       status: queryParams.status || 'true'
//     });

//     // Set sorting params
//     setSortingValue(queryParams.value || '');
//     setSortingOrder(parseInt(queryParams.order) || 1);

//     // Fetch registrations based on query params
//     fetchRegistrations(queryParams);
//   }, [location.search]);

//   // Fetch registrations data
//   const fetchRegistrations = async (params) => {
//     try {
//       const headers = {
//         'x-auth': localStorage.getItem('token')
//       };

//       // Build query string from params
//       const queryString = qs.stringify(params);
//       const response = await axios.get(`${backendUrl}/admin/courses/registrations?${queryString}`, { headers });

//       if (response.data) {
//         setCandidates(response.data.candidates || []);
//         setTotalPages(response.data.totalPages || 1);
//         setCanView(response.data.view !== undefined ? response.data.view : true);
//       }
//     } catch (error) {
//       console.error('Error fetching registrations:', error);
//       setFlashMessage({
//         type: 'danger',
//         message: 'Failed to fetch registrations'
//       });
//     }
//   };

//   // Handle input change for filter
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFilterData(prev => ({ ...prev, [name]: value }));
//   };

//   // Validate date filters
//   const validateFilters = () => {
//     if ((filterData.FromDate && !filterData.ToDate) || (!filterData.FromDate && filterData.ToDate)) {
//       return false;
//     }
//     return true;
//   };

//   // Handle filter form submit
//   const handleFilterSubmit = (e) => {
//     e.preventDefault();
    
//     if (!validateFilters()) {
//       return;
//     }

//     // Build query string for navigation
//     const queryParams = {};
    
//     Object.keys(filterData).forEach(key => {
//       if (filterData[key]) {
//         queryParams[key] = filterData[key];
//       }
//     });

//     navigate(`/admin/courses/registrations?${qs.stringify(queryParams)}`);
//   };

//   // Handle reset filters
//   const handleResetFilters = () => {
//     navigate('/admin/courses/registrations');
//   };

//   // Handle pagination click
//   const handlePageClick = (page) => {
//     const queryParams = qs.parse(location.search);
//     queryParams.page = page;
//     navigate(`/admin/courses/registrations?${qs.stringify(queryParams)}`);
//   };

//   // Handle sorting
//   const handleSorting = (value) => {
//     const newOrder = sortingValue === value ? -sortingOrder : 1;
    
//     const queryParams = qs.parse(location.search);
//     queryParams.value = value;
//     queryParams.order = newOrder;
    
//     navigate(`/admin/courses/registrations?${qs.stringify(queryParams)}`);
//   };

//   // Handle action click (Due/Assigned)
//   const handleActionClick = (id, remarks, assignDate, url) => {
//     const formattedDate = assignDate ? 
//       moment(assignDate).format('YYYY-MM-DD') : 
//       moment().format('YYYY-MM-DD');

//     setModalData({
//       id,
//       remarks: remarks || '',
//       assignDate: formattedDate,
//       url: url || ''
//     });

//     setShowModal(true);
//   };

//   // Handle assign course
//   const handleAssignCourse = async () => {
//     try {
//       const updateCourse = {
//         url: modalData.url,
//         remarks: modalData.remarks,
//         courseStatus: 0,
//         assignDate: new Date(modalData.assignDate).toISOString()
//       };

//       await axios.put(
//         `${backendUrl}/admin/courses/assignCourses/${modalData.id}`, 
//         updateCourse,
//         {
//           headers: {
//             'x-auth': localStorage.getItem('token')
//           }
//         }
//       );

//       setShowModal(false);
      
//       // Refresh data
//       fetchRegistrations(qs.parse(location.search));
      
//       setFlashMessage({
//         type: 'success',
//         message: 'Course assigned successfully'
//       });
//     } catch (error) {
//       console.error('Error assigning course:', error);
//       setFlashMessage({
//         type: 'danger',
//         message: 'An error occurred while assigning the course'
//       });
//     }
//   };

//   // Handle lead status update
//   const handleLeadStatusUpdate = async (appliedId, status) => {
//     try {
//       await axios.post(
//         `${backendUrl}/admin/courses/leadStatus`,
//         { appliedId, status },
//         {
//           headers: {
//             'x-auth': localStorage.getItem('token')
//           }
//         }
//       );
      
//       // Refresh data
//       fetchRegistrations(qs.parse(location.search));
      
//       setFlashMessage({
//         type: 'success',
//         message: 'Lead status updated successfully'
//       });
//     } catch (error) {
//       console.error('Error updating lead status:', error);
//       setFlashMessage({
//         type: 'danger',
//         message: 'An error occurred while updating lead status'
//       });
//     }
//   };

//   // Handle login as candidate
//   const handleLoginAs = async (mobile) => {
//     try {
//       const response = await axios.post(
//         `${backendUrl}/api/loginAsCandidate`,
//         { mobile, module: 'candidate' },
//         {
//           headers: {
//             'x-auth': localStorage.getItem('token')
//           }
//         }
//       );

//       if (response.data && response.data.role === 3) {
//         localStorage.setItem("candidate", response.data.name);
//         localStorage.setItem("token", response.data.token);
//         window.location.href = "/candidate/dashboard";
//       }
//     } catch (error) {
//       console.error('Error logging in as candidate:', error);
//       setFlashMessage({
//         type: 'danger',
//         message: 'An error occurred while logging in as candidate'
//       });
//     }
//   };

//   // Render pagination
//   const renderPagination = () => {
//     if (!totalPages || totalPages <= 1) return null;

//     let first = 1;
//     let last = totalPages > 4 ? 4 : totalPages;

//     if (totalPages > 4 && currentPage >= 2) {
//       first = currentPage - 1;
//       last = currentPage + 1;
//       if (last > totalPages) last = totalPages;
//     }

//     return (
//       <ul className="pagination justify-content-end ml-2 mb-2">
//         {first > 1 && (
//           <li className="page-item">
//             <Button 
//               variant="link" 
//               className="page-link" 
//               onClick={() => handlePageClick(1)}
//             >
//               First
//             </Button>
//           </li>
//         )}
        
//         {Array.from({ length: last - first + 1 }, (_, i) => i + first).map(page => (
//           <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
//             <Button 
//               variant={page === currentPage ? 'primary' : 'link'} 
//               className="page-link" 
//               onClick={() => handlePageClick(page)}
//               disabled={page === currentPage}
//             >
//               {page}
//             </Button>
//           </li>
//         ))}
        
//         {totalPages > last && (
//           <>
//             <li className="page-item">
//               <Button 
//                 variant="link" 
//                 className="page-link" 
//                 onClick={() => handlePageClick(last + 1)}
//               >
//                 ...
//               </Button>
//             </li>
//             <li className="page-item">
//               <Button 
//                 variant="link" 
//                 className="page-link" 
//                 onClick={() => handlePageClick(totalPages)}
//               >
//                 Last
//               </Button>
//             </li>
//           </>
//         )}
//       </ul>
//     );
//   };

//   return (
//     <div className="">
//       {/* Header */}
//       <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
//         <div className="content-header-left col-md-12 col-12 mb-2">
//           <div className="row breadcrumbs-top">
//             <div className="col-9">
//               <h3 className="content-header-title float-left mb-0">Registrations</h3>
//               <Breadcrumb>
//                 <Breadcrumb.Item href="/admin">Home</Breadcrumb.Item>
//                 <Breadcrumb.Item active>Registrations</Breadcrumb.Item>
//               </Breadcrumb>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Content Body */}
//       <div className="content-body">
//         {/* Flash Message */}
//         {flashMessage && (
//           <Alert 
//             variant={flashMessage.type} 
//             onClose={() => setFlashMessage(null)} 
//             dismissible
//           >
//             {flashMessage.message}
//           </Alert>
//         )}
        
//         <section className="list-view">
//           <Row>
//             <Col xs={12} className="rounded equal-height-2 coloumn-2">
//               <Card>
//                 <Card.Body>
//                   <Row>
//                     <Col xs={12}>
//                       <Row className="mb-2">
//                         <Col xl={12} lg={12} className="px-3">
//                           <Form onSubmit={handleFilterSubmit} id="filterForm">
//                             <Row>
//                               <Col xl={3} className="mt-1">
//                                 <Form.Group>
//                                   <Form.Label>Name/ Mobile/ Whatsapp</Form.Label>
//                                   <Form.Control
//                                     type="text"
//                                     name="name"
//                                     value={filterData.name}
//                                     onChange={handleInputChange}
//                                     maxLength={25}
//                                   />
//                                 </Form.Group>
//                               </Col>
//                               <Col 
//                                 xl={3} 
//                                 className="text-center mt-3"
//                                 style={{ marginTop: '2.5rem !important' }}
//                               >
//                                 <Button
//                                   variant="success"
//                                   type="submit"
//                                   className="waves-effect waves-light text-white d-inline"
//                                 >
//                                   Go
//                                 </Button>
//                                 <Button
//                                   variant="danger"
//                                   className="d-inline waves-effect waves-light mb-2 text-white mx-1"
//                                   onClick={handleResetFilters}
//                                 >
//                                   RESET
//                                 </Button>
//                               </Col>
//                               <Col xl={6} className="text-right mt-3">
//                                 <Form.Check
//                                   type="checkbox"
//                                   id="filterToggle"
//                                   label=""
//                                   checked={showAdvancedFilters}
//                                   onChange={() => setShowAdvancedFilters(!showAdvancedFilters)}
//                                   custom
//                                 />
//                               </Col>
//                             </Row>

//                             {showAdvancedFilters && (
//                               <Row 
//                                 className="justify-content-end" 
//                                 style={{ 
//                                   transition: '0.3s ease-in-out',
//                                   overflow: 'hidden',
//                                   maxHeight: showAdvancedFilters ? '300px' : '0',
//                                   opacity: showAdvancedFilters ? '1' : '0'
//                                 }}
//                               >
//                                 <Col xl={2} className="ml-1 mt-1">
//                                   <Form.Group>
//                                     <Form.Label>Course Fee Type</Form.Label>
//                                     <Form.Control
//                                       as="select"
//                                       name="courseType"
//                                       value={filterData.courseType}
//                                       onChange={handleInputChange}
//                                       className="text-capitalize"
//                                     >
//                                       <option value="">Select</option>
//                                       <option value="Free" className="text-capitalize">Free</option>
//                                       <option value="Paid" className="text-capitalize">Paid</option>
//                                     </Form.Control>
//                                   </Form.Group>
//                                 </Col>
//                                 <Col xl={2} className="ml-1 mt-1">
//                                   <Form.Group>
//                                     <Form.Label>From Date</Form.Label>
//                                     <Form.Control
//                                       type="date"
//                                       name="FromDate"
//                                       value={filterData.FromDate}
//                                       onChange={handleInputChange}
//                                       isInvalid={!filterData.FromDate && filterData.ToDate}
//                                     />
//                                     <Form.Control.Feedback type="invalid">
//                                       From date is required when To date is set
//                                     </Form.Control.Feedback>
//                                   </Form.Group>
//                                 </Col>
//                                 <Col xl={2} className="ml-1 mt-1">
//                                   <Form.Group>
//                                     <Form.Label>To Date</Form.Label>
//                                     <Form.Control
//                                       type="date"
//                                       name="ToDate"
//                                       value={filterData.ToDate}
//                                       onChange={handleInputChange}
//                                       isInvalid={filterData.FromDate && !filterData.ToDate}
//                                     />
//                                     <Form.Control.Feedback type="invalid">
//                                       To date is required when From date is set
//                                     </Form.Control.Feedback>
//                                   </Form.Group>
//                                 </Col>
//                                 <Form.Control 
//                                   type="hidden" 
//                                   name="status" 
//                                   value="true" 
//                                 />
//                                 <Col 
//                                   xl={3} 
//                                   className="text-center mt-3"
//                                   style={{ marginTop: '2.5rem !important' }}
//                                 >
//                                   <Button
//                                     variant="success"
//                                     type="submit"
//                                     className="waves-effect waves-light text-white d-inline"
//                                   >
//                                     Go
//                                   </Button>
//                                   <Button
//                                     variant="danger"
//                                     className="d-inline waves-effect waves-light mb-2 text-white mx-1"
//                                     onClick={handleResetFilters}
//                                   >
//                                     RESET
//                                   </Button>
//                                 </Col>
//                               </Row>
//                             )}
//                           </Form>
//                         </Col>
//                       </Row>

//                       {/* Table */}
//                       <div className="table-responsive">
//                         {candidates && candidates.length > 0 ? (
//                           <Table id="tblexportData" className="table table-hover-animation mb-0 table-hover" style={{ width: '100%' }}>
//                            <thead>
//                               <tr>
//                                 <th 
//                                   className="three column wide" 
//                                   style={{ width: '18%', cursor: 'pointer' }}
//                                   onClick={() => handleSorting('createdAt')}
//                                 >
//                                   DATE <i 
//                                     className={`fa-solid fa-arrow-${sortingValue === 'createdAt' ? (sortingOrder === 1 ? 'down' : 'up') : 'down'} success`} 
//                                   />
//                                 </th>
//                                 <th 
//                                   className="three column wide candidate-wrap" 
//                                   style={{ width: '19%' ,  whiteSpace : 'nowrap'}}
//                                   onClick={() => handleSorting('name')}
//                                 >
//                                   CANDIDATE NAME
//                                 </th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>MOBILE NO.</th>
//                                 <th className="one column wide" style={{ width: '15%' }}>Email</th>
//                                 <th className="one column wide" style={{ width: '15%' , whiteSpace : 'nowrap' }}>Document Status</th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>Lead Status</th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>Demo Status</th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>Center Status</th>
//                                 <th 
//                                   className="one column wide" 
//                                   style={{ width: '7%', cursor: 'pointer' }}
//                                   onClick={() => handleSorting('courseName')}
//                                 >
//                                   Course <i 
//                                     className={sortingValue === 'courseName' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
//                                   />
//                                 </th>
//                                 <th 
//                                   className="one column wide" 
//                                   style={{ width: '7%', cursor: 'pointer' ,  whiteSpace : 'nowrap'}}
//                                   onClick={() => handleSorting('registrationCharges')}
//                                 >
//                                   Reg Fee <i 
//                                     className={sortingValue === 'registrationCharges' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
//                                   />
//                                 </th>
//                                 <th className="one column wide" style={{ width: '7%', cursor: 'pointer' ,  whiteSpace : 'nowrap'}}>
//                                   Reg Status <i className="" />
//                                 </th>
//                                 <th 
//                                   className="one column wide" 
//                                   style={{ width: '7%', cursor: 'pointer' }}
//                                   onClick={() => handleSorting('sector')}
//                                 >
//                                   Sector <i 
//                                     className={sortingValue === 'sector' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
//                                   />
//                                 </th>
//                                 <th className="one column wide" style={{ width: '10%', cursor: 'pointer' , whiteSpace : 'nowrap' }}>
//                                   Course Fee Type
//                                 </th>
//                                 <th className="one column wide" style={{ width: '10%', cursor: 'pointer' , whiteSpace : 'nowrap'}}>
//                                   Registered By
//                                 </th>
                                
//                                 {!canView && (
//                                   <th className="one column wide" style={{ width: '10%' }}>Action</th>
//                                 )}
//                                 <th className="one column wide" style={{ width: '10%' ,  whiteSpace : 'nowrap'}}>View Docs</th>
//                                 <th className="one column wide" style={{ width: '10%' }}>Action</th>
//                               </tr>
//                             </thead>
//                             <tbody>
//                               {candidates.map((candidate, i) => (
//                                 <tr key={candidate._id}>
//                                   <td className="text-capitalize">
//                                     {candidate.createdAt 
//                                       ? moment(candidate.createdAt).utcOffset("+05:30").format('MMM DD YYYY hh:mm A')
//                                       : "N/A"
//                                     }
//                                   </td>
//                                   <td className="text-capitalize candid-wrap">
//                                     {candidate.name || "N/A"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.mobile || "N/A"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.email || "N/A"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.docProgress && candidate.docProgress.totalRequired && candidate.docProgress.totalRequired > 0 ? (
//                                       <div 
//                                         className="circular-progress-container" 
//                                         data-percent={candidate.docProgress.percent}
//                                       >
//                                         <svg width="40" height="40">
//                                           <circle className="circle-bg" cx="20" cy="20" r="16"></circle>
//                                           <circle 
//                                             className="circle-progress" 
//                                             cx="20" 
//                                             cy="20" 
//                                             r="16"
//                                             style={{
//                                               strokeDasharray: `${2 * Math.PI * 16}`,
//                                               strokeDashoffset: `${2 * Math.PI * 16 - (candidate.docProgress.percent / 100) * 2 * Math.PI * 16}`
//                                             }}
//                                           ></circle>
//                                         </svg>
//                                         <div className="progress-text">
//                                           {candidate.docProgress.percent}%
//                                         </div>
//                                       </div>
//                                     ) : (
//                                       "NDR"
//                                     )}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     <Form.Control 
//                                       as="select"
//                                       className="leadsSelect"
//                                       onChange={(e) => handleLeadStatusUpdate(candidate._id, e.target.value)}
//                                       value={candidate.leadStatus || ''}
//                                     >
//                                       <option value="">Select</option>
//                                       <option value="Hot">Hot</option>
//                                       <option value="Warm">Warm</option>
//                                       <option value="Cold">Cold</option>
//                                     </Form.Control>
//                                   </td>
//                                   <td className="text-capitalize">
//                                     <Form.Control 
//                                       as="select"
//                                       className="leadsSelect"
//                                       value={candidate.demoStatus || ''}
//                                       onChange={(e) => handleLeadStatusUpdate(candidate._id, e.target.value)}
//                                     >
//                                       <option value="">Select</option>
//                                       <option value="Demo Scheduled">Demo Scheduled</option>
//                                       <option value="Demo Pending">Demo Pending</option>
//                                       <option value="Demo Done">Demo Done</option>
//                                     </Form.Control>
//                                   </td>
//                                   <td className="text-capitalize">
//                                     <Form.Control 
//                                       as="select"
//                                       className="leadsSelect"
//                                       value={candidate.centerStatus || ''}
//                                       onChange={(e) => handleLeadStatusUpdate(candidate._id, e.target.value)}
//                                     >
//                                       <option value="">Select</option>
//                                       <option value="Add Center">Add Center</option>
//                                       <option value="Rejected">Rejected</option>
//                                       <option value="Drop Out">Drop Out</option>
//                                     </Form.Control>
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.courseName || "N/A"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.registrationCharges || "N/A"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.registrationFee || "Unpaid"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.sector || "N/A"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.courseFeeType || "Free/Paid"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.registeredByName || "N/A"}
//                                   </td>
                                  
//                                   {!canView && (
//                                     <td className="text-capitalize">
//                                       <Button
//                                         variant={candidate.courseStatus === 0 ? "danger" : "success"}
//                                         className="waves-effect waves-light text-white d-inline btn-sm"
//                                         onClick={() => handleActionClick(
//                                           candidate._id, 
//                                           candidate.remarks, 
//                                           candidate.assignDate, 
//                                           candidate.url
//                                         )}
//                                       >
//                                         {candidate.courseStatus === 0 ? "DUE" : "Assigned"}
//                                       </Button>
//                                     </td>
//                                   )}
                                  
//                                   <td className="text-capitalize">
//                                     <Link
//                                       to={`/admin/courses/${candidate.courseId}/${candidate.candidateId}/docsview`}
//                                       className="btn btn-danger waves-effect waves-light text-white d-inline btn-sm"
//                                       style={{ padding: '8px' }}
//                                     >
//                                       View Docs
//                                     </Link>
//                                   </td>
                                  
//                                   <td className="text-capitalize">
//                                     <Button
//                                       variant="link"
//                                       className="p-0"
//                                       onClick={() => handleLoginAs(candidate.mobile)}
//                                     >
//                                       <LogIn size={18} className="text-primary cursor-pointer" title="Login As" />
//                                     </Button>
//                                   </td>
//                                 </tr>
//                               ))}
//                             </tbody>
//                           </Table>
//                         ) : (
//                             <>
//                             <Table id="tblexportData" className="table table-hover-animation mb-0 table-hover" style={{ width: '100%' }}>
//                             <thead>
//                               <tr>
//                                 <th 
//                                   className="three column wide" 
//                                   style={{ width: '18%', cursor: 'pointer' }}
//                                   onClick={() => handleSorting('createdAt')}
//                                 >
//                                   DATE <i 
//                                     className={`fa-solid fa-arrow-${sortingValue === 'createdAt' ? (sortingOrder === 1 ? 'down' : 'up') : 'down'} success`} 
//                                   />
//                                 </th>
//                                 <th 
//                                   className="three column wide candidate-wrap" 
//                                   style={{ width: '19%' ,  whiteSpace : 'nowrap'}}
//                                   onClick={() => handleSorting('name')}
//                                 >
//                                   CANDIDATE NAME
//                                 </th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>MOBILE NO.</th>
//                                 <th className="one column wide" style={{ width: '15%' }}>Email</th>
//                                 <th className="one column wide" style={{ width: '15%' , whiteSpace : 'nowrap' }}>Document Status</th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>Lead Status</th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>Demo Status</th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>Center Status</th>
//                                 <th 
//                                   className="one column wide" 
//                                   style={{ width: '7%', cursor: 'pointer' }}
//                                   onClick={() => handleSorting('courseName')}
//                                 >
//                                   Course <i 
//                                     className={sortingValue === 'courseName' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
//                                   />
//                                 </th>
//                                 <th 
//                                   className="one column wide" 
//                                   style={{ width: '7%', cursor: 'pointer' ,  whiteSpace : 'nowrap'}}
//                                   onClick={() => handleSorting('registrationCharges')}
//                                 >
//                                   Reg Fee <i 
//                                     className={sortingValue === 'registrationCharges' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
//                                   />
//                                 </th>
//                                 <th className="one column wide" style={{ width: '7%', cursor: 'pointer' ,  whiteSpace : 'nowrap'}}>
//                                   Reg Status <i className="" />
//                                 </th>
//                                 <th 
//                                   className="one column wide" 
//                                   style={{ width: '7%', cursor: 'pointer' }}
//                                   onClick={() => handleSorting('sector')}
//                                 >
//                                   Sector <i 
//                                     className={sortingValue === 'sector' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
//                                   />
//                                 </th>
//                                 <th className="one column wide" style={{ width: '10%', cursor: 'pointer' , whiteSpace : 'nowrap' }}>
//                                   Course Fee Type
//                                 </th>
//                                 <th className="one column wide" style={{ width: '10%', cursor: 'pointer' , whiteSpace : 'nowrap'}}>
//                                   Registered By
//                                 </th>
                                
//                                 {!canView && (
//                                   <th className="one column wide" style={{ width: '10%' }}>Action</th>
//                                 )}
//                                 <th className="one column wide" style={{ width: '10%' ,  whiteSpace : 'nowrap'}}>View Docs</th>
//                                 <th className="one column wide" style={{ width: '10%' }}>Action</th>
//                               </tr>
//                             </thead>
//                             <tbody>
//                             <tr className="text-center mt-3">
//                                 <td colSpan={16}>  No result found </td>
//                             </tr>
//                             </tbody>
//                             </Table>
//                             </>
                         
//                         )}
                        
//                         {/* Pagination */}
//                         {renderPagination()}
//                       </div>
//                     </Col>
//                   </Row>
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row>
//         </section>
//       </div>

//       {/* Course Assign Modal */}
//       <Modal show={showModal} onHide={() => setShowModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title className="text-white text-uppercase">Assign Course</Modal.Title>
//         </Modal.Header>
//         <Modal.Body className="pt-1">
//           <Row>
//             <Col xl={6} lg={6} md={6} sm={6} xs={6} className="mb-1 text-left">
//               <Form.Group>
//                 <Form.Label>Date</Form.Label>
//                 <Form.Control
//                   type="date"
//                   value={modalData.assignDate}
//                   onChange={(e) => setModalData({ ...modalData, assignDate: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col xl={6} lg={6} md={6} sm={6} xs={6} className="mb-1 text-left">
//               <Form.Group>
//                 <Form.Label>Course URL</Form.Label>
//                 <Form.Control
//                   type="text"
//                   value={modalData.url}
//                   onChange={(e) => setModalData({ ...modalData, url: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col xl={12} className="mb-1 text-left">
//               <Form.Group>
//                 <Form.Label>Remarks</Form.Label>
//                 <Form.Control
//                   as="textarea"
//                   rows={3}
//                   value={modalData.remarks}
//                   onChange={(e) => setModalData({ ...modalData, remarks: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//           </Row>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="primary" onClick={handleAssignCourse}>
//             Assigned
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* CSS Styles */}
//       <style jsx>{`
//         #tblexportData td {
//           white-space: nowrap;
//         }
//         .circular-progress-container {
//           position: relative;
//           width: 40px;
//           height: 40px;
//         }
//         .circular-progress-container svg {
//           transform: rotate(-90deg);
//         }
//         .circle-bg {
//           fill: none;
//           stroke: #e6e6e6;
//           stroke-width: 4;
//         }
//         .circle-progress {
//           fill: none;
//           stroke: #FC2B5A;
//           stroke-width: 4;
//           stroke-linecap: round;
//           transition: stroke-dashoffset 0.5s ease;
//         }
//         .circular-progress-container .progress-text {
//           position: absolute;
//           top: 50%;
//           left: 50%;
//           transform: translate(-50%, -50%);
//           font-size: 10px;
//           color: #333;
//         }
//         .leadsSelect {
//           width: 150px;
//         }
//         .advanced-filters {
//           max-height: 0;
//           opacity: 0;
//           transition: max-height 0.3s ease, opacity 0.3s ease;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Registrations;