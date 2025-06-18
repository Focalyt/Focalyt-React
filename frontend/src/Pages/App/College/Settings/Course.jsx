import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Course = () => {
  // States
  const [name, setName] = useState('');
  const [eventTypes, setEventTypes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Get ID from URL if editing
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Fetch event types on component mount and when page changes
  useEffect(() => {
    fetchEventTypes();
    
    // If ID is provided, fetch the specific event type for editing
    if (id) {
      setIsEditMode(true);
      fetchEventTypeById(id);
    }
  }, [id, page]);
  
  // Fetch all event types
  const fetchEventTypes = async () => {
    try {
      const response = await axios.get(`/admin/eventType?page=${page}`);
      setEventTypes(response.data.qual || []);
      setTotalPages(response.data.totalPages || 1);
      setIsViewMode(response.data.view || false);
    } catch (error) {
      console.error('Error fetching course types:', error);
    }
  };
  
  // Fetch specific event type by ID
  const fetchEventTypeById = async (id) => {
    try {
      const response = await axios.get(`/admin/eventType/edit/${id}`);
      setName(response.data.quaName || '');
    } catch (error) {
      console.error('Error fetching course type:', error);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditMode) {
        await axios.post(`/admin/eventType/edit/${id}`, { name });
        navigate('/admin/eventType');
      } else {
        await axios.post('/admin/eventType', { name });
        setName('');
      }
      fetchEventTypes();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };
  
  // Handle status toggle
  const handleStatusToggle = async (id, status) => {
    try {
      const newStatus = status === true || status === 'true' ? false : true;
      await axios.post('/admin/changestatus', {
        id,
        status: newStatus,
        model: 'qualification'
      });
      fetchEventTypes();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };
  
  // Generate pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    let first = 1;
    let last = totalPages > 4 ? 4 : totalPages;
    
    if (totalPages > 4 && page >= 2) {
      first = page - 1;
      last = page + 1;
      if (last > totalPages) last = totalPages;
    }
    
    const pages = [];
    
    if (first > 1) {
      pages.push(
        <li key="first" className="page-item">
          <button className="page-link" onClick={() => setPage(1)}>First</button>
        </li>
      );
    }
    
    for (let i = first; i <= last; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === page ? 'active' : ''}`}>
          <button 
            className="page-link" 
            onClick={() => setPage(i)}
            disabled={i === page}
          >
            {i}
          </button>
        </li>
      );
    }
    
    if (totalPages > last) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <button className="page-link" onClick={() => setPage(last + 1)}>...</button>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <button className="page-link" onClick={() => setPage(totalPages)}>Last</button>
        </li>
      );
    }
    
    return (
      <ul className="pagination justify-content-end ml-2 mb-2 mt-1 mr-1">
        {pages}
      </ul>
    );
  };

  return (
    <div className="content-body">
      {/* Header with breadcrumbs */}
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">Add Course</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/institute/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Add Course</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <section className="list-view">
        <div className="row">
          {/* Add/Edit Event Type Form */}
          <div className="col-6 equal-height-2">
            <div className="card">
              <div className="card-header border border-top-0 border-left-0 border-right-0">
                <h4 className="card-title pb-1">
                  {isEditMode ? 'Update Course' : 'Add Course'}
                </h4>
              </div>
              <div className="card-content">
                <div className="card-body">
                  <form className="form-horizontal" onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-xl-4 mb-1">
                        <label>Course Type{!isEditMode && <span className="mandatory">*</span>}</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          minLength="1" 
                          maxLength="50" 
                          required
                          value={name} 
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Add Course"
                        />
                      </div>
                      <div className="col-xl-4 mb-1">
                        <br />
                        <button 
                          type="submit" 
                          className={`btn btn-success font-small-3 ${isViewMode ? 'disabled' : ''}`}
                          disabled={isViewMode}
                        >
                          {isEditMode ? 'Update' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          
          {/* Event Type List */}
          <div className="col-6 rounded equal-height-2 coloumn-2">
            <div className="card">
              <div className="row p-1">
                <div className="col-xl-6">
                  <div className="row">
                    <div className="card-header">
                      <h4 className="card-title">Course List</h4>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-content">
                <div className="table-responsive">
                  {eventTypes && eventTypes.length > 0 ? (
                    <>
                      <table className="table table-hover-animation mb-0 table-hover">
                        <thead>
                          <tr>
                            <th>Course Type</th>
                            {!isViewMode && (
                              <>
                                <th>Status</th>
                                <th>Action</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {eventTypes.map((eventType, i) => (
                            <tr key={eventType._id}>
                              <td>{eventType.name}</td>
                              
                              {isViewMode ? (
                                <td>{eventType.status ? 'True' : 'False'}</td>
                              ) : (
                                <>
                                  <td>
                                    <div className="custom-control custom-switch custom-control-inline">
                                      <input 
                                        type="checkbox" 
                                        className="custom-control-input" 
                                        id={`customSwitch${i}`} 
                                        checked={eventType.status}
                                        onChange={() => handleStatusToggle(eventType._id, eventType.status)}
                                      />
                                      <label className="custom-control-label" htmlFor={`customSwitch${i}`}></label>
                                    </div>
                                  </td>
                                  <td valign="middle">
                                    {!eventType.basic && (
                                      <Link to={`/admin/eventType/edit/${eventType._id}`}>
                                        <i className="feather icon-edit fa-lg primary"></i>
                                      </Link>
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {renderPagination()}
                    </>
                  ) : (
                    <p className="text-center mt-3">No result found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Course;