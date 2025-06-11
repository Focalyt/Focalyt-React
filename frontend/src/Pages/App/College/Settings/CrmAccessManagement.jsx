import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Filter, Edit, Trash2, ChevronDown, Check, Search, Users, Target, Settings } from 'lucide-react';

const CrmAccessManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    ruleName: '',
    campaign: { type: 'includes', values: [] },
    course: { type: 'includes', values: [] },
    project: { type: 'includes', values: [] },
    source: { type: 'includes', values: [] },
    partnerType: { type: 'includes', values: [] },
    branchName: { type: 'includes', values: [] },
    assignedCounselors: []
  });

  // Sample data for dropdowns
  const campaigns = ['Digital Marketing Campaign', 'Social Media Campaign', 'Email Campaign', 'Content Marketing', 'SEO Campaign'];
  const courses = ['Web Development', 'Data Science', 'Digital Marketing', 'UI/UX Design', 'Mobile App Development', 'Cloud Computing'];
  const projects = ['Project Alpha', 'Project Beta', 'Project Gamma', 'Project Delta', 'Project Epsilon'];
  const sources = ['Website', 'Social Media', 'Referral', 'Advertisement', 'Direct Call', 'Email'];
  const partnerTypes = ['Education Partner', 'Technology Partner', 'Business Partner', 'Channel Partner'];
  const branches = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'Seattle'];
  const counselors = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Wilson', 'Alex Brown', 'Lisa Garcia'];

  // Sample existing rules
  const [rules, setRules] = useState([
    {
      id: 1,
      ruleName: 'Tech Course Assignment',
      createdOn: '2025-01-15',
      campaign: ['Digital Marketing Campaign'],
      course: ['Web Development', 'Data Science'],
      project: ['Project Alpha'],
      source: ['Website', 'Referral'],
      partnerType: ['Technology Partner'],
      branchName: ['New York', 'Los Angeles'],
      assignedCounselors: ['John Smith', 'Sarah Johnson'],
      status: 'Active'
    },
    {
      id: 2,
      ruleName: 'Marketing Leads Distribution',
      createdOn: '2025-01-10',
      campaign: ['Social Media Campaign'],
      course: ['Digital Marketing'],
      project: ['Project Beta'],
      source: ['Social Media'],
      partnerType: ['Business Partner'],
      branchName: ['Chicago'],
      assignedCounselors: ['Mike Davis'],
      status: 'Active'
    }
  ]);

  // Table management states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('All');

  const MultiSelectDropdown = ({ options, selected, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    const filteredOptions = options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleOption = (option) => {
      const newSelected = selected.includes(option)
        ? selected.filter(item => item !== option)
        : [...selected, option];
      onChange(newSelected);
    };

    return (
      <div className="position-relative" ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="form-control d-flex align-items-center justify-content-between bg-light"
          style={{ cursor: 'pointer', minHeight: '45px' }}
        >
          <div className="d-flex align-items-center flex-grow-1">
            <div className="flex-grow-1">
              {selected.length > 0 ? (
                <div className="d-flex flex-wrap gap-1">
                  {selected.slice(0, 2).map((item, index) => (
                    <span key={index} className="badge text-white me-1" style={{ backgroundColor: '#ff6b35' }}>
                      {item}
                    </span>
                  ))}
                  {selected.length > 2 && (
                    <span className="badge bg-secondary">
                      +{selected.length - 2} more
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted">{placeholder}</span>
              )}
            </div>
          </div>
          <ChevronDown 
            className="text-muted ms-2" 
            size={16}
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
              transition: 'transform 0.2s' 
            }}
          />
        </div>

        {isOpen && (
          <div 
            className="position-absolute w-100 mt-1 bg-white border rounded shadow-lg" 
            style={{ zIndex: 1050 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-bottom">
              <div className="position-relative">
                <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search options..."
                  className="form-control ps-5"
                  autoFocus={false}
                />
              </div>
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {filteredOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleToggleOption(option)}
                  className="d-flex align-items-center p-3"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="form-check me-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(option)}
                      readOnly
                      className="form-check-input"
                      style={{ accentColor: '#ff6b35' }}
                      tabIndex={-1}
                    />
                  </div>
                  <span>{option}</span>
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="p-3 text-center text-muted">No options found</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Table management functions
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedRules = () => {
    let sortableRules = [...rules];
    if (sortConfig.key) {
      sortableRules.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableRules;
  };

  const getFilteredRules = () => {
    const sortedRules = getSortedRules();
    return sortedRules.filter(rule => {
      const matchesSearch = rule.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           rule.assignedCounselors.some(counselor => 
                             counselor.toLowerCase().includes(searchTerm.toLowerCase())
                           );
      const matchesStatus = statusFilter === 'All' || rule.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredRules = getFilteredRules();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCriteriaChange = (criteria, type, values = []) => {
    setFormData(prev => ({
      ...prev,
      [criteria]: { type, values }
    }));
  };

  const handleSubmit = () => {
    const newRule = {
      id: rules.length + 1,
      ruleName: formData.ruleName,
      createdOn: new Date().toISOString().split('T')[0],
      campaign: formData.campaign.values.length > 0 ? formData.campaign.values : ['Any Campaign'],
      course: formData.course.values.length > 0 ? formData.course.values : ['Any Course'],
      project: formData.project.values.length > 0 ? formData.project.values : ['Any Project'],
      source: formData.source.values.length > 0 ? formData.source.values : ['Any Source'],
      partnerType: formData.partnerType.values.length > 0 ? formData.partnerType.values : ['Any Partner Type'],
      branchName: formData.branchName.values.length > 0 ? formData.branchName.values : ['Any Branch'],
      assignedCounselors: formData.assignedCounselors,
      status: 'Active'
    };
    
    setRules(prev => [...prev, newRule]);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      ruleName: '',
      campaign: { type: 'includes', values: [] },
      course: { type: 'includes', values: [] },
      project: { type: 'includes', values: [] },
      source: { type: 'includes', values: [] },
      partnerType: { type: 'includes', values: [] },
      branchName: { type: 'includes', values: [] },
      assignedCounselors: []
    });
  };

  // Focus management for modal
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isModalOpen && firstInputRef.current) {
      // Focus on first input when modal opens
      setTimeout(() => {
        firstInputRef.current.focus();
      }, 100);
    }
  }, [isModalOpen]);

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const CriteriaSection = ({ title, criteria, options, placeholder }) => (
    <div className="mb-4">
      <h6 className="fw-medium text-dark mb-3">{title}</h6>
      <div className="d-flex gap-4 mb-3">
        <div className="form-check">
          <input
            type="radio"
            name={criteria}
            checked={formData[criteria].type === 'includes'}
            onChange={() => handleCriteriaChange(criteria, 'includes', formData[criteria].values)}
            className="form-check-input"
            id={`${criteria}-includes`}
            style={{ accentColor: '#ff6b35' }}
          />
          <label className="form-check-label" htmlFor={`${criteria}-includes`}>
            Includes
          </label>
        </div>
        <div className="form-check">
          <input
            type="radio"
            name={criteria}
            checked={formData[criteria].type === 'any'}
            onChange={() => handleCriteriaChange(criteria, 'any', [])}
            className="form-check-input"
            id={`${criteria}-any`}
            style={{ accentColor: '#ff6b35' }}
          />
          <label className="form-check-label" htmlFor={`${criteria}-any`}>
            Any {title.split(' ')[2] || title.split(' ')[1]}
          </label>
        </div>
      </div>
      {formData[criteria].type === 'includes' && (
        <MultiSelectDropdown
          options={options}
          selected={formData[criteria].values}
          onChange={(values) => handleCriteriaChange(criteria, 'includes', values)}
          placeholder={placeholder}
        />
      )}
    </div>
  );

  return (
    <div>
      {/* Bootstrap CSS */}
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM"
        crossOrigin="anonymous"
      />
      
      <div className="min-vh-100 bg-light">
        <div className="container-fluid">
        
          {/* Action Bar */}
          <div className="row mb-4">
            <div className="col-12">
              
            </div>
          </div>

          {/* Rules Table */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow bg-white">
                <div className="card-body p-0">

                <div className="card-body p-4">
                  <div className="row align-items-center">
                    <div className="col-md-4 mb-3 mb-md-0">
                      <div className="position-relative">
                        <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={16} />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search rules or counselors..."
                          className="form-control ps-5 m-0"
                        />
                      </div>
                    </div>
                    <div className="col-md-3 mb-3 mb-md-0">
                      <select 
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="col-md-5 text-md-end">
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn btn-lg d-flex align-items-center shadow text-white ms-auto"
                        style={{ backgroundColor: '#ff6b35' }}
                      >
                        <Plus size={20} className="me-2" />
                        Add Rule
                      </button>
                    </div>
                  </div>
                </div>
              

                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th 
                            className="border-0 px-4 py-3 fw-semibold text-dark" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('ruleName')}
                          >
                            Rule Name {sortConfig.key === 'ruleName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th 
                            className="border-0 px-4 py-3 fw-semibold text-dark"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('createdOn')}
                          >
                            Created On {sortConfig.key === 'createdOn' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="border-0 px-4 py-3 fw-semibold text-dark">Campaign</th>
                          <th className="border-0 px-4 py-3 fw-semibold text-dark">Course</th>
                          <th className="border-0 px-4 py-3 fw-semibold text-dark">Project</th>
                          <th className="border-0 px-4 py-3 fw-semibold text-dark">Source</th>
                          <th className="border-0 px-4 py-3 fw-semibold text-dark">Partner Type</th>
                          <th className="border-0 px-4 py-3 fw-semibold text-dark">Branch</th>
                          <th className="border-0 px-4 py-3 fw-semibold text-dark">Counselors</th>
                          <th 
                            className="border-0 px-4 py-3 fw-semibold text-dark"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('status')}
                          >
                            Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="border-0 px-4 py-3 fw-semibold text-dark">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRules.length > 0 ? (
                          filteredRules.map((rule) => (
                            <tr key={rule.id}>
                              <td className="px-4 py-3 fw-medium">{rule.ruleName}</td>
                              <td className="px-4 py-3 text-muted">{rule.createdOn}</td>
                              <td className="px-4 py-3">
                                {rule.campaign.slice(0, 1).map((item, idx) => (
                                  <span key={idx} className="badge text-white me-1" style={{ backgroundColor: '#17a2b8' }}>{item}</span>
                                ))}
                                {rule.campaign.length > 1 && <span className="text-muted small">+{rule.campaign.length - 1}</span>}
                              </td>
                              <td className="px-4 py-3">
                                {rule.course.slice(0, 1).map((item, idx) => (
                                  <span key={idx} className="badge text-white me-1" style={{ backgroundColor: '#ff6b35' }}>{item}</span>
                                ))}
                                {rule.course.length > 1 && <span className="text-muted small">+{rule.course.length - 1}</span>}
                              </td>
                              <td className="px-4 py-3">
                                {rule.project.slice(0, 1).map((item, idx) => (
                                  <span key={idx} className="badge text-white me-1" style={{ backgroundColor: '#ffc107' }}>{item}</span>
                                ))}
                                {rule.project.length > 1 && <span className="text-muted small">+{rule.project.length - 1}</span>}
                              </td>
                              <td className="px-4 py-3">
                                {rule.source.slice(0, 1).map((item, idx) => (
                                  <span key={idx} className="badge text-white me-1" style={{ backgroundColor: '#28a745' }}>{item}</span>
                                ))}
                                {rule.source.length > 1 && <span className="text-muted small">+{rule.source.length - 1}</span>}
                              </td>
                              <td className="px-4 py-3 text-muted">{rule.partnerType.join(', ')}</td>
                              <td className="px-4 py-3 text-muted">{rule.branchName.join(', ')}</td>
                              <td className="px-4 py-3 text-muted">{rule.assignedCounselors.join(', ')}</td>
                              <td className="px-4 py-3">
                                <span className={`badge ${rule.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                                  {rule.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="d-flex gap-2">
                                  <button className="btn btn-sm btn-outline-secondary">
                                    <Edit size={16} />
                                  </button>
                                  <button className="btn btn-sm btn-outline-danger">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="11" className="text-center py-4 text-muted">
                              No rules found matching your criteria
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div 
              className="modal d-block" 
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={(e) => e.target === e.currentTarget && closeModal()}
            >
              <div className="modal-dialog modal-lg modal-dialog-scrollable" ref={modalRef}>
                <div className="modal-content border-0 shadow-lg">
                  {/* Modal Header */}
                  <div className="modal-header bg-white border-bottom">
                    <h5 className="modal-title fw-bold">Add Assignment Rule</h5>
                    <button
                      onClick={closeModal}
                      className="btn-close"
                      aria-label="Close"
                    ></button>
                  </div>

                  {/* Modal Body */}
                  <div className="modal-body p-4 bg-white">
                    {/* Rule Name */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        Rule Name <span className="text-danger">*</span>
                      </label>
                      <input
                        ref={firstInputRef}
                        type="text"
                        value={formData.ruleName}
                        onChange={(e) => handleInputChange('ruleName', e.target.value)}
                        placeholder="Enter Rule Name"
                        className="form-control bg-light"
                        style={{ height: '45px' }}
                      />
                    </div>

                    {/* Criteria Sections */}
                    <CriteriaSection
                      title="Criteria 1: When &quot;Campaign&quot;"
                      criteria="campaign"
                      options={campaigns}
                      placeholder="Select Campaign"
                    />

                    <div className="text-center my-4">
                      <span className="badge px-3 py-2 fw-medium" style={{ backgroundColor: '#ff6b35', color: 'white' }}>AND</span>
                    </div>

                    <CriteriaSection
                      title="Criteria 2: When &quot;Course&quot;"
                      criteria="course"
                      options={courses}
                      placeholder="Select Course"
                    />

                    <div className="text-center my-4">
                      <span className="badge px-3 py-2 fw-medium" style={{ backgroundColor: '#ff6b35', color: 'white' }}>AND</span>
                    </div>

                    <CriteriaSection
                      title="Criteria 3: When &quot;Project&quot;"
                      criteria="project"
                      options={projects}
                      placeholder="Select Project"
                    />

                    <div className="text-center my-4">
                      <span className="badge px-3 py-2 fw-medium" style={{ backgroundColor: '#ff6b35', color: 'white' }}>AND</span>
                    </div>

                    <CriteriaSection
                      title="Criteria 4: When &quot;Source&quot;"
                      criteria="source"
                      options={sources}
                      placeholder="Select Source"
                    />

                    <div className="text-center my-4">
                      <span className="badge px-3 py-2 fw-medium" style={{ backgroundColor: '#ff6b35', color: 'white' }}>AND</span>
                    </div>

                    <CriteriaSection
                      title="Criteria 5: When &quot;Type of Partner&quot;"
                      criteria="partnerType"
                      options={partnerTypes}
                      placeholder="Select Type of Partner"
                    />

                    <div className="text-center my-4">
                      <span className="badge px-3 py-2 fw-medium" style={{ backgroundColor: '#ff6b35', color: 'white' }}>AND</span>
                    </div>

                    <CriteriaSection
                      title="Criteria 6: When &quot;Branch Name&quot;"
                      criteria="branchName"
                      options={branches}
                      placeholder="Select Branch Name"
                    />

                    {/* Assignment Section */}
                    <div className="border-top pt-4 mt-4">
                      <h6 className="fw-medium text-dark mb-3">Then Assigned Counselor(s) will be</h6>
                      <MultiSelectDropdown
                        options={counselors}
                        selected={formData.assignedCounselors}
                        onChange={(counselors) => handleInputChange('assignedCounselors', counselors)}
                        placeholder="Select"
                      />
                      <small className="text-muted fst-italic mt-2 d-block">
                        If multiple counselors are selected, lead distribution will be done in round robin manner to equally distribute the leads.
                      </small>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="modal-footer bg-white border-top">
                    <button
                      onClick={closeModal}
                      className="btn btn-outline-secondary px-4"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!formData.ruleName.trim()}
                      className="btn px-4 text-white"
                      style={{ backgroundColor: '#ff6b35' }}
                    >
                      Add Rule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>
        {
          `
          .table-hover thead tr{
          border-bottom:1px solid #ccc!important;
          white-space: nowrap;
          font-size: 12px;
          }
          .table-hover tbody tr{
font-size: 12px;
        }
          `
        }
      </style>
    </div>
  );
};

export default CrmAccessManagement;