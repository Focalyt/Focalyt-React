import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, CheckSquare, X, AlertTriangle, Shield,
  UserPlus, Eye, ArrowLeft, Check, Clock, RefreshCw
} from 'lucide-react';

const ApprovalManagement = () => {
  // State management
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailSidebar, setShowDetailSidebar] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Define tabs
  const tabs = [
    { id: 'all', label: 'All Requests' },
    { id: 'pending', label: 'Pending Approval' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' }
  ];

  // Load data on component mount and tab change
  useEffect(() => {
    fetchApprovalRequests();
  }, [activeTab]);

  // Fetch approval requests
  const fetchApprovalRequests = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you might include the tab filter in your API call
      // e.g., const response = await axios.get(`${backendUrl}/approval-requests?status=${activeTab !== 'all' ? activeTab : ''}`);
      
      // Mock data for demonstration
      setApprovalRequests([
        {
          id: 1,
          type: 'role_request',
          requestedBy: 'John Doe',
          description: 'Request for Course Manager role',
          requestDate: '2025-05-18',
          status: 'pending',
          requestDetails: {
            roleName: 'Course Manager',
            reason: 'Need to manage course content for the new digital marketing curriculum'
          }
        },
        {
          id: 2,
          type: 'user_creation',
          requestedBy: 'Jane Smith',
          description: 'New user account request',
          requestDate: '2025-05-17',
          status: 'pending',
          requestDetails: {
            name: 'Alex Johnson',
            email: 'alex.j@example.com',
            role: 'Content Creator',
            department: 'Marketing',
            reason: 'New hire starting next Monday'
          }
        },
        {
          id: 3,
          type: 'permission_change',
          requestedBy: 'Mike Brown',
          description: 'Additional permissions request',
          requestDate: '2025-05-15',
          status: 'approved',
          approvedBy: 'Admin User',
          approvedDate: '2025-05-16',
          requestDetails: {
            userName: 'Mike Brown',
            permissions: ['EDIT_COURSE', 'MANAGE_COURSE_CONTENT'],
            reason: 'Need to update course materials for the upcoming semester'
          }
        },
        {
          id: 4,
          type: 'role_request',
          requestedBy: 'Sarah Wilson',
          description: 'Request for Center Manager role',
          requestDate: '2025-05-14',
          status: 'rejected',
          rejectedBy: 'Admin User',
          rejectedDate: '2025-05-15',
          rejectionReason: 'Additional training required before assuming this role',
          requestDetails: {
            roleName: 'Center Manager',
            reason: 'Current manager is going on leave for 3 months'
          }
        },
        {
          id: 5,
          type: 'user_creation',
          requestedBy: 'Robert Chen',
          description: 'New student account request',
          requestDate: '2025-05-13',
          status: 'approved',
          approvedBy: 'Admin User',
          approvedDate: '2025-05-14',
          requestDetails: {
            name: 'Priya Sharma',
            email: 'priya.s@example.com',
            role: 'Student',
            department: 'Data Science',
            reason: 'New student enrollment'
          }
        }
      ]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      alert('Failed to fetch approval requests');
      setIsLoading(false);
    }
  };

  // Handler functions
  const handleSelectRequest = (requestId) => {
    if (selectedRequests.includes(requestId)) {
      setSelectedRequests(selectedRequests.filter(id => id !== requestId));
    } else {
      setSelectedRequests([...selectedRequests, requestId]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const filteredRequests = getFilteredRequests();
      setSelectedRequests(filteredRequests.filter(r => r.status === 'pending').map(r => r.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setApprovalComment('');
    setShowDetailSidebar(true);
  };

  const handleCloseDetails = () => {
    setShowDetailSidebar(false);
    setSelectedRequest(null);
  };

  const handleApprove = async (requestId) => {
    try {
      // Replace with actual API call
      // await axios.post(`${backendUrl}/approve-request/${requestId}`, { 
      //   status: 'approved', 
      //   comment: approvalComment 
      // });
      
      // Mock update
      setApprovalRequests(approvalRequests.map(req => 
        req.id === requestId ? { 
          ...req, 
          status: 'approved',
          approvedBy: 'Current User',
          approvedDate: new Date().toISOString().slice(0, 10)
        } : req
      ));
      
      setSelectedRequests(selectedRequests.filter(id => id !== requestId));
      alert('Request approved successfully');
      
      // Close detail sidebar if this was the selected request
      if (selectedRequest && selectedRequest.id === requestId) {
        setShowDetailSidebar(false);
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    if (!approvalComment.trim() && selectedRequest?.id === requestId) {
      alert('Please provide a reason for rejection');
      document.getElementById('rejection-comment')?.focus();
      return;
    }
    
    try {
      // Replace with actual API call
      // await axios.post(`${backendUrl}/reject-request/${requestId}`, { 
      //   status: 'rejected', 
      //   comment: approvalComment 
      // });
      
      // Mock update
      setApprovalRequests(approvalRequests.map(req => 
        req.id === requestId ? { 
          ...req, 
          status: 'rejected',
          rejectedBy: 'Current User',
          rejectedDate: new Date().toISOString().slice(0, 10),
          rejectionReason: approvalComment || 'Request denied'
        } : req
      ));
      
      setSelectedRequests(selectedRequests.filter(id => id !== requestId));
      alert('Request rejected successfully');
      
      // Close detail sidebar if this was the selected request
      if (selectedRequest && selectedRequest.id === requestId) {
        setShowDetailSidebar(false);
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRequests.length === 0) {
      alert('Please select at least one request to approve');
      return;
    }
    
    try {
      // Replace with actual API call
      // await Promise.all(selectedRequests.map(id => 
      //   axios.post(`${backendUrl}/approve-request/${id}`, { 
      //     status: 'approved' 
      //   })
      // ));
      
      // Mock update
      setApprovalRequests(approvalRequests.map(req => 
        selectedRequests.includes(req.id) ? { 
          ...req, 
          status: 'approved',
          approvedBy: 'Current User',
          approvedDate: new Date().toISOString().slice(0, 10)
        } : req
      ));
      
      setSelectedRequests([]);
      alert('Selected requests approved successfully');
      
      // Close detail sidebar if selected request was in the approved batch
      if (selectedRequest && selectedRequests.includes(selectedRequest.id)) {
        setShowDetailSidebar(false);
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error approving requests:', error);
      alert('Failed to approve some requests');
    }
  };

  // Filter requests based on active tab and search term
  const getFilteredRequests = () => {
    return approvalRequests.filter(req => {
      // Filter by tab/status
      if (activeTab !== 'all' && req.status !== activeTab) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        return (
          req.requestedBy.toLowerCase().includes(term) ||
          req.description.toLowerCase().includes(term) ||
          (req.type === 'role_request' && req.requestDetails.roleName.toLowerCase().includes(term)) ||
          (req.type === 'user_creation' && req.requestDetails.name?.toLowerCase().includes(term))
        );
      }
      
      return true;
    });
  };

  // Get counts for tab badges
  const getStatusCounts = () => {
    const counts = { all: 0, pending: 0, approved: 0, rejected: 0 };
    approvalRequests.forEach(req => {
      counts.all++;
      if (counts[req.status] !== undefined) {
        counts[req.status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();
  const filteredRequests = getFilteredRequests();

  return (
    <div className="bg-light min-vh-100">
      {/* Top navigation */}
      <nav className="navbar navbar-light bg-white shadow-sm">
        <div className="container">
          <div className="d-flex justify-content-between w-100">
            <div className="d-flex align-items-center">
              <AlertTriangle className="text-warning" size={28} />
              <span className="ms-2 fs-4 fw-semibold text-dark">Approval Center</span>
            </div>
            <div>
              <button 
                className="btn btn-outline-secondary me-2" 
                onClick={() => window.history.back()}
              >
                <ArrowLeft size={16} className="me-1" />
                Back to Dashboard
              </button>
              <button 
                className="btn btn-outline-primary" 
                onClick={fetchApprovalRequests}
                disabled={isLoading}
              >
                <RefreshCw size={16} className={`me-1 ${isLoading ? 'spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content with potential sidebar */}
      <div className="container py-4">
        <div className="row">
          {/* Main content area - takes full width when sidebar is closed */}
          <div className={`${showDetailSidebar ? 'col-lg-8' : 'col-12'}`}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="fs-3 fw-semibold mb-0">Request Approvals</h1>
              <div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleBulkApprove}
                  disabled={selectedRequests.length === 0}
                >
                  <CheckSquare className="me-2" size={16} />
                  Approve Selected ({selectedRequests.length})
                </button>
              </div>
            </div>

            {/* Tab navigation */}
            <ul className="nav nav-tabs mb-4">
              {tabs.map(tab => (
                <li className="nav-item" key={tab.id}>
                  <button
                    className={`nav-link ${activeTab === tab.id ? 'active' : ''} d-flex align-items-center`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.id === 'all' && <span className="me-2">{tab.label}</span>}
                    {tab.id === 'pending' && <Clock size={16} className="me-2" />}
                    {tab.id === 'approved' && <Check size={16} className="me-2" />}
                    {tab.id === 'rejected' && <X size={16} className="me-2" />}
                    
                    {tab.id !== 'all' && <span className="me-2">{tab.label}</span>}
                    
                    <span className={`badge rounded-pill ${
                      tab.id === 'pending' ? 'text-warning' :
                      tab.id === 'approved' ? 'text-success' :
                      tab.id === 'rejected' ? 'text-danger' :
                      'bg-secondary'
                    }`}>
                      {statusCounts[tab.id]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Search */}
            <div className="position-relative mb-4">
              <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                <Search className="text-secondary" size={20} />
              </div>
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search requests by name, description, or role"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Approval requests table */}
            <div className="card">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th width="40">
                        <input 
                          type="checkbox" 
                          className="form-check-input" 
                          onChange={handleSelectAll} 
                          checked={
                            filteredRequests.filter(r => r.status === 'pending').length > 0 &&
                            filteredRequests.filter(r => r.status === 'pending').every(r => 
                              selectedRequests.includes(r.id)
                            )
                          }
                          disabled={filteredRequests.filter(r => r.status === 'pending').length === 0}
                        />
                      </th>
                      <th>Request Type</th>
                      <th>Requested By</th>
                      <th>Description</th>
                      <th>Date</th>
                      {activeTab === 'all' && <th>Status</th>}
                      <th width="120">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={activeTab === 'all' ? 7 : 6} className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <div className="mt-2">Loading requests...</div>
                        </td>
                      </tr>
                    ) : filteredRequests.length > 0 ? (
                      filteredRequests.map((request) => (
                        <tr key={request.id} className={selectedRequest?.id === request.id ? 'table-active' : ''}>
                          <td>
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              checked={selectedRequests.includes(request.id)}
                              onChange={() => handleSelectRequest(request.id)}
                              disabled={request.status !== 'pending'}
                            />
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {request.type === 'role_request' && (
                                <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-3 text-primary" style={{ width: "32px", height: "32px" }}>
                                  <Shield size={16} />
                                </div>
                              )}
                              {request.type === 'user_creation' && (
                                <div className="d-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-3 text-success" style={{ width: "32px", height: "32px" }}>
                                  <UserPlus size={16} />
                                </div>
                              )}
                              {request.type === 'permission_change' && (
                                <div className="d-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-3 text-warning" style={{ width: "32px", height: "32px" }}>
                                  <AlertTriangle size={16} />
                                </div>
                              )}
                              <div className="ms-3">
                                <div className="fw-medium">
                                  {request.type === 'role_request' && 'Role Assignment'}
                                  {request.type === 'user_creation' && 'New User'}
                                  {request.type === 'permission_change' && 'Permission Change'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 rounded-circle text-secondary fw-semibold" style={{ width: "32px", height: "32px" }}>
                                {request.requestedBy.charAt(0)}
                              </div>
                              <div className="ms-2">
                                {request.requestedBy}
                              </div>
                            </div>
                          </td>
                          <td>{request.description}</td>
                          <td className="text-secondary">
                            {request.status === 'approved' ? request.approvedDate : 
                             request.status === 'rejected' ? request.rejectedDate : 
                             request.requestDate}
                          </td>
                          {activeTab === 'all' && (
                            <td>
                              <span className={`${
                                request.status === 'pending' ? 'text-warning' : 
                                request.status === 'approved' ? 'text-success' : 
                                request.status === 'rejected' ? 'text-danger' : 
                                'bg-secondary'
                              }`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </td>
                          )}
                          <td>
                            <div className="d-flex gap-2">
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() => handleApprove(request.id)}
                                    title="Approve"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => {
                                      handleViewDetails(request);
                                      // Focus comment field for rejection reason
                                      setTimeout(() => {
                                        document.getElementById('rejection-comment')?.focus();
                                      }, 100);
                                    }}
                                    title="Reject"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              )}
                              <button
                                className={`btn btn-sm ${selectedRequest?.id === request.id ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => handleViewDetails(request)}
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={activeTab === 'all' ? 7 : 6} className="text-center py-4 text-muted">
                          {searchTerm 
                            ? 'No requests match your search criteria' 
                            : `No ${activeTab === 'all' ? '' : activeTab} requests found`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Details sidebar - only shown when a request is selected */}
          {showDetailSidebar && (
            <div className="col-lg-4 mt-4 mt-lg-0">
              <div className="card position-sticky" style={{ top: '1rem' }}>
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Request Details</h5>
                  <button className="btn btn-sm btn-close btn-close-white" onClick={handleCloseDetails}></button>
                </div>
                {selectedRequest && (
                  <div className="card-body">
                    <div className="mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-center">
                        {selectedRequest.type === 'role_request' && (
                          <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-3 text-primary" style={{ width: "40px", height: "40px" }}>
                            <Shield size={20} />
                          </div>
                        )}
                        {selectedRequest.type === 'user_creation' && (
                          <div className="d-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-3 text-success" style={{ width: "40px", height: "40px" }}>
                            <UserPlus size={20} />
                          </div>
                        )}
                        {selectedRequest.type === 'permission_change' && (
                          <div className="d-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-3 text-warning" style={{ width: "40px", height: "40px" }}>
                            <AlertTriangle size={20} />
                          </div>
                        )}
                        <div className="ms-3">
                          <h5 className="mb-0">
                            {selectedRequest.type === 'role_request' && 'Role Assignment'}
                            {selectedRequest.type === 'user_creation' && 'New User'}
                            {selectedRequest.type === 'permission_change' && 'Permission Change'}
                          </h5>
                          <span className={`${
                            selectedRequest.status === 'pending' ? 'text-warning' : 
                            selectedRequest.status === 'approved' ? 'text-success' : 
                            selectedRequest.status === 'rejected' ? 'text-danger' : 
                            'bg-secondary'
                          }`}>
                            {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-muted mb-1">Requested By</h6>
                      <div className="d-flex align-items-center">
                        <div className="d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 rounded-circle text-secondary fw-semibold" style={{ width: "32px", height: "32px" }}>
                          {selectedRequest.requestedBy.charAt(0)}
                        </div>
                        <div className="ms-2 fw-medium">
                          {selectedRequest.requestedBy}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-muted mb-1">Request Date</h6>
                      <p className="mb-0">{selectedRequest.requestDate}</p>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-muted mb-1">Description</h6>
                      <p className="mb-0">{selectedRequest.description}</p>
                    </div>
                    
                    {/* Request specific details based on type */}
                    {selectedRequest.type === 'role_request' && (
                      <div className="mb-3 p-3 bg-light rounded">
                        <h6 className="mb-2">Role Details</h6>
                        <div className="mb-2">
                          <small className="text-muted d-block">Requested Role:</small>
                          <div className="fw-medium">{selectedRequest.requestDetails.roleName}</div>
                        </div>
                        {selectedRequest.requestDetails.reason && (
                          <div>
                            <small className="text-muted d-block">Reason:</small>
                            <div>{selectedRequest.requestDetails.reason}</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {selectedRequest.type === 'user_creation' && (
                      <div className="mb-3 p-3 bg-light rounded">
                        <h6 className="mb-2">User Details</h6>
                        <div className="mb-2">
                          <small className="text-muted d-block">Name:</small>
                          <div className="fw-medium">{selectedRequest.requestDetails.name}</div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted d-block">Email:</small>
                          <div>{selectedRequest.requestDetails.email}</div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted d-block">Role:</small>
                          <div>{selectedRequest.requestDetails.role}</div>
                        </div>
                        {selectedRequest.requestDetails.department && (
                          <div className="mb-2">
                            <small className="text-muted d-block">Department:</small>
                            <div>{selectedRequest.requestDetails.department}</div>
                          </div>
                        )}
                        {selectedRequest.requestDetails.reason && (
                          <div>
                            <small className="text-muted d-block">Reason:</small>
                            <div>{selectedRequest.requestDetails.reason}</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {selectedRequest.type === 'permission_change' && (
                      <div className="mb-3 p-3 bg-light rounded">
                        <h6 className="mb-2">Permission Details</h6>
                        <div className="mb-2">
                          <small className="text-muted d-block">User:</small>
                          <div className="fw-medium">{selectedRequest.requestDetails.userName}</div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted d-block">Requested Permissions:</small>
                          <ul className="mt-1 mb-0 ps-3">
                            {selectedRequest.requestDetails.permissions.map((perm, idx) => (
                              <li key={idx}>{perm}</li>
                            ))}
                          </ul>
                        </div>
                        {selectedRequest.requestDetails.reason && (
                          <div>
                            <small className="text-muted d-block">Reason:</small>
                            <div>{selectedRequest.requestDetails.reason}</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Status-specific information */}
                    {selectedRequest.status === 'approved' && (
                      <div className="mb-3 p-3 bg-success bg-opacity-10 rounded">
                        <small className="text-muted d-block">Approved By:</small>
                        <div className="mb-2">{selectedRequest.approvedBy}</div>
                        
                        <small className="text-muted d-block">Approved Date:</small>
                        <div>{selectedRequest.approvedDate}</div>
                      </div>
                    )}
                    
                    {selectedRequest.status === 'rejected' && (
                      <div className="mb-3 p-3 bg-danger bg-opacity-10 rounded">
                        <small className="text-muted d-block">Rejected By:</small>
                        <div className="mb-2">{selectedRequest.rejectedBy}</div>
                        
                        <small className="text-muted d-block">Rejected Date:</small>
                        <div className="mb-2">{selectedRequest.rejectedDate}</div>
                        
                        <small className="text-muted d-block">Reason:</small>
                        <div>{selectedRequest.rejectionReason}</div>
                      </div>
                    )}
                    
                    {/* Approval/Rejection actions for pending requests */}
                    {selectedRequest.status === 'pending' && (
                      <div className="mt-4">
                        <div className="mb-3">
                          <label htmlFor="rejection-comment" className="form-label">Comments/Reason</label>
                          <textarea 
                            id="rejection-comment"
                            className="form-control" 
                            rows="3"
                            placeholder="Add comments or rejection reason..."
                            value={approvalComment}
                            onChange={(e) => setApprovalComment(e.target.value)}
                          ></textarea>
                        </div>
                        
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-success flex-grow-1"
                            onClick={() => handleApprove(selectedRequest.id)}
                          >
                            <Check size={18} className="me-1" />
                            Approve
                          </button>
                          <button
                            className="btn btn-danger flex-grow-1"
                            onClick={() => handleReject(selectedRequest.id)}
                          >
                            <X size={18} className="me-1" />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
        }
        
        .hover-bg-light:hover {
          background-color: #f8f9fa;
        }
        
        .z-3 {
          z-index: 3;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ApprovalManagement;