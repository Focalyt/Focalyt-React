import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form } from 'react-bootstrap';
import { Edit } from 'react-feather';
import qs from 'query-string';

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '5px',
};

const inputStyle = {
  width: '100%',
  border: '1.5px solid #e2e8f0',
  borderRadius: '10px',
  padding: '9px 14px',
  fontSize: '13px',
  color: '#1e293b',
  background: '#f8fafc',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const btnPrimaryStyle = {
  background: 'linear-gradient(135deg, #FC2B5A 0%, #a5003a 100%)',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  padding: '9px 20px',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(252,43,90,0.3)',
  whiteSpace: 'nowrap',
};

const btnOutlineStyle = {
  background: 'white',
  color: '#FC2B5A',
  border: '1.5px solid #FC2B5A',
  borderRadius: '10px',
  padding: '9px 20px',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '13px',
  color: '#475569',
  verticalAlign: 'middle',
};

const ViewCourses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // State variables
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [filterData, setFilterData] = useState({
    name: '',
    FromDate: '',
    ToDate: '',
    Profile: '',
    status: 'true'
  });

  // Get query params from URL
  useEffect(() => {
    const queryParams = qs.parse(location.search);
    const initialArchived = queryParams.status === 'false';
    setIsArchived(initialArchived);

    // Set filter data from query params
    setFilterData({
      name: queryParams.name || '',
      FromDate: queryParams.FromDate || '',
      ToDate: queryParams.ToDate || '',
      Profile: queryParams.Profile || '',
      status: queryParams.status || 'true'
    });

    // Fetch courses based on query params
    fetchCourses(queryParams);
  }, [location.search]);

  // Fetch courses data
  const fetchCourses = async (params) => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user'));
      const headers = {
        'x-auth': user.token,
      };
      const queryString = qs.stringify(params);

      const response = await axios.get(`${backendUrl}/college/courses?${queryString}`, { headers });

      console.log("Fetched courses:", response.data.course);
      console.log(" Response :", response);

      if (response.data) {
        setCourses(response.data.courses || []);
        setStatus(response.data.status || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Handle archived checkbox change
  const handleArchivedChange = () => {
    const newArchived = !isArchived;
    setIsArchived(newArchived);
    navigate(`/institute/viewcourse?status=${!newArchived}`);
  };

  // Handle toggle status - FIXED VERSION
  const handleToggleStatus = async (courseId, currentStatus) => {
    console.log("Course ID:", courseId, "Current Status:", currentStatus);
    
    try {
      const user = JSON.parse(sessionStorage.getItem('user'));
      
      // Toggle the status
      const newStatus = !currentStatus;
      
      await axios.put(`${backendUrl}/college/courses/update_course_status/${courseId}`, 
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth': user?.token || sessionStorage.getItem('token')
          }
        }
      );
      
      window.location.reload()
     
      
      console.log(`Course ${courseId} status updated to ${newStatus}`);
      
    } catch (error) {
      console.error('Error changing course status:', error);
      // Optionally show error message to user
    }
  };

  // Handle input change for filter
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilterData(prev => ({ ...prev, [name]: value }));
  };

  // Validate date filters
  const validateFilters = () => {
    if ((filterData.FromDate && !filterData.ToDate) || (!filterData.FromDate && filterData.ToDate)) {
      return false;
    }
    return true;
  };

  // Handle filter form submit
  const handleFilterSubmit = (e) => {
    e.preventDefault();

    if (!validateFilters()) {
      return;
    }

    // Build query string for navigation
    const queryParams = {};

    Object.keys(filterData).forEach(key => {
      if (filterData[key]) {
        queryParams[key] = filterData[key];
      }
    });

    navigate(`/institute/viewcourse?${qs.stringify(queryParams)}`);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    navigate('/institute/viewcourse');
  };

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '20px' }}>

      {/* Modern Gradient Header */}
      <div style={{
        background: 'linear-gradient(135deg, #FC2B5A 0%, #a5003a 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        marginBottom: '24px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 10px 25px rgba(252, 43, 90, 0.35)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '10px 14px',
          }}>
            <i className="fa fa-list-alt" style={{ fontSize: '20px' }}></i>
          </div>
          <div>
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>All Courses</h2>
            <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '13px' }}>
              <a href="/institute/dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>Home</a>
              <span style={{ margin: '0 8px', opacity: 0.6 }}>›</span>
              <span>All Courses</span>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', opacity: 0.9 }}>Total: {courses.length} courses</span>
        </div>
      </div>

      {/* Main Card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>

        {/* Filter Section */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h5 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '15px', paddingLeft: '12px', borderLeft: '4px solid #FC2B5A', borderRadius: '2px' }}>
              Filter Courses
            </h5>
            {/* Archive Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <div style={{ position: 'relative', width: '40px', height: '22px' }}>
                <input
                  type="checkbox"
                  id="checkbox1"
                  checked={isArchived}
                  onChange={handleArchivedChange}
                  style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: isArchived ? '#FC2B5A' : '#cbd5e1',
                  borderRadius: '20px',
                  transition: '0.2s',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '3px',
                    left: isArchived ? '21px' : '3px',
                    width: '16px', height: '16px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: '0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }}></div>
                </div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Show Archived</span>
            </label>
          </div>

          <Form onSubmit={handleFilterSubmit}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
              {/* Name */}
              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <label style={labelStyle}>Course Name</label>
                <input
                  type="text"
                  name="name"
                  value={filterData.name}
                  onChange={handleInputChange}
                  maxLength={25}
                  placeholder="Search by name..."
                  style={inputStyle}
                />
              </div>
              {/* From Date */}
              <div style={{ flex: '1 1 150px', minWidth: '140px' }}>
                <label style={labelStyle}>From Date</label>
                <input
                  type="date"
                  name="FromDate"
                  value={filterData.FromDate}
                  onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: (!filterData.FromDate && filterData.ToDate) ? '#ef4444' : '#e2e8f0' }}
                />
                {(!filterData.FromDate && filterData.ToDate) && (
                  <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px', display: 'block' }}>Required</span>
                )}
              </div>
              {/* To Date */}
              <div style={{ flex: '1 1 150px', minWidth: '140px' }}>
                <label style={labelStyle}>To Date</label>
                <input
                  type="date"
                  name="ToDate"
                  value={filterData.ToDate}
                  onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: (filterData.FromDate && !filterData.ToDate) ? '#ef4444' : '#e2e8f0' }}
                />
                {(filterData.FromDate && !filterData.ToDate) && (
                  <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px', display: 'block' }}>Required</span>
                )}
              </div>
              {/* Profile */}
              <div style={{ flex: '1 1 150px', minWidth: '140px' }}>
                <label style={labelStyle}>Profile</label>
                <select
                  name="Profile"
                  value={filterData.Profile}
                  onChange={handleInputChange}
                  style={inputStyle}
                >
                  <option value="">Select</option>
                  <option value="All">All</option>
                  <option value="true">Completed</option>
                  <option value="false">Due</option>
                </select>
              </div>
              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px', paddingBottom: '1px' }}>
                <button type="submit" style={btnPrimaryStyle}>
                  <i className="fa fa-search" style={{ marginRight: '6px' }}></i> Search
                </button>
                <button type="button" onClick={handleResetFilters} style={btnOutlineStyle}>
                  <i className="fa fa-refresh" style={{ marginRight: '6px' }}></i> Reset
                </button>
              </div>
            </div>
          </Form>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>📚</div>
              <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: '15px', margin: 0 }}>No courses found</p>
              <p style={{ color: '#cbd5e1', fontSize: '13px', marginTop: '4px' }}>Try adjusting your filters</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Sector', 'Course Level', 'Course Name', 'Duration',
                    ...(status === 'true' || status === true ? ['Add Leads'] : []),
                    'Status', 'Action'].map((h, i) => (
                    <th key={i} style={{
                      padding: '12px 16px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      borderBottom: '2px solid #f1f5f9',
                      whiteSpace: 'nowrap',
                      textAlign: h === 'Action' ? 'center' : 'left',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map((course, i) => (
                  <tr key={course._id} style={{
                    borderBottom: '1px solid #f8fafc',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef6f8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* # */}
                    <td style={tdStyle}>
                      <span style={{
                        background: '#fef2f5', color: '#FC2B5A',
                        borderRadius: '6px', padding: '2px 8px',
                        fontSize: '12px', fontWeight: 700,
                      }}>{i + 1}</span>
                    </td>
                    {/* Sector */}
                    <td style={tdStyle}>
                      {course.sectors?.map((sector) => (
                        <span key={sector._id} style={{
                          display: 'inline-block',
                          background: '#f1f5f9', color: '#475569',
                          borderRadius: '6px', padding: '2px 8px',
                          fontSize: '12px', fontWeight: 500,
                          margin: '2px',
                        }}>{sector.name}</span>
                      ))}
                    </td>
                    {/* Course Level */}
                    <td style={tdStyle}>
                      <span style={{
                        background: '#fef6f8', color: '#FC2B5A',
                        borderRadius: '20px', padding: '3px 10px',
                        fontSize: '12px', fontWeight: 600,
                        border: '1px solid #fecdd3',
                      }}>{course.courseLevel}</span>
                    </td>
                    {/* Course Name */}
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b', maxWidth: '200px' }}>
                      {course.name}
                    </td>
                    {/* Duration */}
                    <td style={{ ...tdStyle, color: '#475569' }}>
                      <i className="fa fa-clock-o" style={{ marginRight: '5px', color: '#94a3b8', fontSize: '13px' }}></i>
                      {course.duration || 'N/A'}
                    </td>
                    {/* Add Leads */}
                    {(course.status === 'true' || course.status === true) && (
                      <td style={tdStyle}>
                        <Link
                          to={`/institute/viewcourse/${course._id}/candidate/addleads`}
                          style={{
                            background: 'linear-gradient(135deg, #FC2B5A 0%, #a5003a 100%)',
                            color: 'white', textDecoration: 'none',
                            borderRadius: '8px', padding: '6px 14px',
                            fontSize: '12px', fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(252,43,90,0.3)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <i className="fa fa-plus" style={{ marginRight: '5px' }}></i>Add Leads
                        </Link>
                      </td>
                    )}
                    {/* Status Toggle */}
                    <td style={tdStyle}>
                      <div className="custom-control custom-switch custom-control-inline p-0">
                        <input
                          type="checkbox"
                          id={`customSwitch${course._id}`}
                          className="custom-control-input"
                          onChange={() => handleToggleStatus(course._id, course.status)}
                          checked={course.status === true || course.status === 'true'}
                        />
                        <label htmlFor={`customSwitch${course._id}`} className="toggleSwitch"></label>
                      </div>
                    </td>
                    {/* Action */}
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <Link to={`/institute/courses/edit/${course._id}`} style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '34px', height: '34px',
                        background: '#fef2f5',
                        borderRadius: '8px',
                        color: '#FC2B5A',
                        transition: 'all 0.2s',
                        border: '1px solid #fecdd3',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#FC2B5A'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fef2f5'; e.currentTarget.style.color = '#FC2B5A'; }}
                      >
                        <Edit size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        .custom-control-input { display: none; }

        .toggleSwitch {
          display: flex; align-items: center; justify-content: center;
          position: relative; width: 46px; height: 26px;
          background-color: #cbd5e1; border-radius: 20px;
          cursor: pointer; transition: 0.2s;
        }
        .toggleSwitch::after {
          content: ""; position: absolute;
          height: 18px; width: 18px; left: 4px;
          background-color: white; border-radius: 50%;
          transition: 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .custom-control-input:checked + .toggleSwitch {
          background-color: #FC2B5A;
        }
        .custom-control-input:checked + .toggleSwitch::after {
          transform: translateX(20px);
        }
        .primary { color: #FC2B5A !important; }
      `}</style>
    </div>
  );
};

export default ViewCourses;