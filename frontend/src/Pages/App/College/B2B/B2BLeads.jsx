import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Plus, Eye, Edit, Phone, Mail, Calendar, User, Building, Tag, MoreVertical } from 'lucide-react';

const B2BLeads = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  // State management
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    leadCategory: '',
    typeOfB2B: '',
    leadOwner: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [statusCounts, setStatusCounts] = useState([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch leads
  const fetchLeads = async (statusFilter = null) => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: 10,
        ...filters
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      const response = await axios.get(`${backendUrl}/college/b2b/leads`, {
        headers: { 'x-auth': token },
        params
      });

      if (response.data.status) {
        setLeads(response.data.data.leads || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch status counts
  const fetchStatusCounts = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/b2b/leads/status-count`, {
        headers: { 'x-auth': token }
      });

      if (response.data.status) {
        setStatusCounts(response.data.data.statusCounts || []);
      }
    } catch (error) {
      console.error('Error fetching status counts:', error);
    }
  };

  useEffect(() => {
    fetchLeads(selectedStatusFilter);
    fetchStatusCounts();
  }, [currentPage, filters, selectedStatusFilter]);

  // Handle status card click
  const handleStatusCardClick = (statusId) => {
    setSelectedStatusFilter(selectedStatusFilter === statusId ? null : statusId);
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      leadCategory: '',
      typeOfB2B: '',
      leadOwner: ''
    });
    setSelectedStatusFilter(null);
    setCurrentPage(1);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Converted':
        return 'bg-success';
      case 'Active':
        return 'bg-primary';
      case 'Pending':
        return 'bg-warning';
      case 'Rejected':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading B2B leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="display-5 fw-bold text-dark mb-2">B2B Leads</h1>
            <p className="text-muted">Manage and track your B2B lead pipeline</p>
          </div>
          <div className="d-flex gap-2">
            <button
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="me-2" size={20} />
              Filters
            </button>
            <button className="btn btn-primary">
              <Plus className="me-2" size={20} />
              Add Lead
            </button>
          </div>
        </div>
      </div>

      {/* Status Count Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="d-flex flex-wrap gap-2">
            {/* Total Leads Card */}
            <div 
              className={`card border-0 shadow-sm ${selectedStatusFilter === null ? 'border-primary' : ''}`}
              style={{ 
                minWidth: '140px', 
                cursor: 'pointer',
                border: selectedStatusFilter === null ? '2px solid #007bff' : '1px solid transparent'
              }}
              onClick={() => handleStatusCardClick(null)}
            >
              <div className="card-body p-3 text-center">
                <div className="d-flex align-items-center justify-content-center">
                  <Building className="text-primary me-2" size={20} />
                  <div>
                    <h6 className="mb-0 fw-bold">Total</h6>
                    <small className="text-muted">
                      {statusCounts.reduce((sum, status) => sum + status.count, 0)} leads
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Count Cards */}
            {statusCounts.map((status, index) => (
              <div 
                key={status.statusId || index}
                className={`card border-0 shadow-sm ${selectedStatusFilter === status.statusId ? 'border-primary' : ''}`}
                style={{ 
                  minWidth: '140px', 
                  cursor: 'pointer',
                  border: selectedStatusFilter === status.statusId ? '2px solid #007bff' : '1px solid transparent'
                }}
                onClick={() => handleStatusCardClick(status.statusId)}
              >
                <div className="card-body p-3 text-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <Tag className="text-success me-2" size={20} />
                    <div>
                      <h6 className="mb-0 fw-bold">{status.statusName}</h6>
                      <small className="text-muted">{status.count} leads</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small fw-bold">Search</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search leads..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Status</label>
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {statusCounts.map((status, index) => (
                    <option key={index} value={status.statusId}>
                      {status.statusName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Lead Category</label>
                <select
                  className="form-select"
                  value={filters.leadCategory}
                  onChange={(e) => handleFilterChange('leadCategory', e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Cold Call">Cold Call</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Lead Owner</label>
                <select
                  className="form-select"
                  value={filters.leadOwner}
                  onChange={(e) => handleFilterChange('leadOwner', e.target.value)}
                >
                  <option value="">All Owners</option>
                  <option value="user1">John Doe</option>
                  <option value="user2">Jane Smith</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={clearFilters}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Contact Person</th>
                  <th>Status</th>
                  <th>Lead Category</th>
                  <th>Lead Owner</th>
                  <th>Added Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, index) => (
                  <tr key={lead._id || index}>
                    <td>
                      <div>
                        <div className="fw-semibold">{lead.businessName}</div>
                        <small className="text-muted">{lead.email}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="fw-medium">{lead.concernPersonName}</div>
                        <small className="text-muted">{lead.designation}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(lead.status?.title || lead.status?.name)}`}>
                        {lead.status?.title || lead.status?.name || 'No Status'}
                      </span>
                    </td>
                    <td>
                      <span className="text-muted">
                        {lead.leadCategory?.name || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-sm bg-primary text-white rounded-circle me-2">
                          {(lead.leadOwner?.name || 'U').charAt(0)}
                        </div>
                        <span className="text-muted">
                          {lead.leadOwner?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-primary" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-outline-secondary" title="Edit Lead">
                          <Edit size={16} />
                        </button>
                        <button className="btn btn-outline-success" title="Call">
                          <Phone size={16} />
                        </button>
                        <button className="btn btn-outline-info" title="Email">
                          <Mail size={16} />
                        </button>
                        <button className="btn btn-outline-warning" title="Schedule Followup">
                          <Calendar size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div>
                <small className="text-muted">
                  Showing page {currentPage} of {totalPages}
                </small>
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    );
                  })}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        .avatar {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }
        
        .btn-group-sm .btn {
          padding: 0.25rem 0.5rem;
        }
        
        .card {
          transition: all 0.2s ease;
        }
        
        .card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default B2BLeads; 