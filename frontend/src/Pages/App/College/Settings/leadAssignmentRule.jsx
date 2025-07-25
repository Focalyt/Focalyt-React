import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import axios from 'axios';
import { X, Plus, Filter, Edit, Trash2, ChevronDown, Check, Search, Users, Target, Settings } from 'lucide-react';

// Custom hook for focus management
const useFocusManager = () => {
  const focusQueue = useRef([]);
  const isProcessing = useRef(false);

  const queueFocus = useCallback((element) => {
    if (element) {
      focusQueue.current.push(element);
      processFocusQueue();
    }
  }, []);

  const processFocusQueue = useCallback(() => {
    if (isProcessing.current || focusQueue.current.length === 0) return;

    isProcessing.current = true;
    requestAnimationFrame(() => {
      const element = focusQueue.current.shift();
      if (element && document.contains(element)) {
        element.focus();
      }
      isProcessing.current = false;
      if (focusQueue.current.length > 0) {
        processFocusQueue();
      }
    });
  }, []);

  return { queueFocus };
};

const LeadAssignmentRule = ({ users = [], enhancedEntities = {} }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    ruleName: '',
    course: { type: 'includes', values: [] },
    center: { type: 'includes', values: [] },
    assignedCounselors: []
  });


  // Sample data for dropdowns
  const centers = enhancedEntities.CENTER || [];
  const courses = enhancedEntities.COURSE || [];

  useEffect(() => {
    console.log(courses, 'courses')
  }, [courses])


  // API Base URL - adjust according to your setup
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  // Rules state
  const [rules, setRules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('All');

  // Fetch rules from API
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: 1,
        limit: 100,
        ...(statusFilter !== 'All' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
        sortBy: sortConfig.key || 'createdAt',
        sortOrder: sortConfig.direction || 'desc'
      });



      const response = await axios.get(`${backendUrl}/college/leadAssignmentRule?${params}`, {
        headers: { 'x-auth': token }
      });

      if (!response.data.status) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }


      if (response.data && response.data.status) {
        setRules(response.data.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch rules');
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      setRules([]);
      setError(error.message || 'Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  }, [backendUrl, statusFilter, searchTerm, sortConfig]);

  // Load rules on component mount and when filters change
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  

  // Toggle rule status
  const toggleRuleStatus = async (ruleId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

      

      const response = await axios.patch(`${backendUrl}/college/leadAssignmentRule/${ruleId}/status`, {
        status: newStatus
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth': token
        }
      });

      if (!response.data.status) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }


      if (response.data.status) {
        // Update local state
        setRules(prev => prev.map(rule =>
          rule._id === ruleId ? { ...rule, status: newStatus } : rule
        ));
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      setError(error.message || 'Failed to update status');
    }
  };


  
  
  
  const getFilteredCourses = useCallback(() => {

    console.log(formData.center, 'formData.center')
    if (formData.center.type === 'any') {
      return courses;
    }

    if (formData.center.values.length === 0) {
      return [];
    }

    const selectedCenterIds = formData.center.values.map(center => center.id || center._id);

    return courses.filter(course => {
      return course.center && course.center.some(centerId =>
        selectedCenterIds.includes(centerId)
      );
    });
  }, [courses, formData.center]);

  const MultiSelectDropdown = memo(({ options, selected, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const optionRefs = useRef({});
    const { queueFocus } = useFocusManager();
    const lastInteractedOption = useRef(null);

    const filteredOptions = (options || []).filter(option => {
      const optionText = typeof option === 'string' ? option : option.name || option.label || option.id || '';
      return optionText.toLowerCase().includes(searchTerm.toLowerCase());
    });

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (lastInteractedOption.current && isOpen) {
        const element = optionRefs.current[lastInteractedOption.current];
        if (element) {
          queueFocus(element);
        }
      }
    }, [selected, queueFocus, isOpen]);

    const handleOptionInteraction = useCallback((option, event) => {
      event.preventDefault();
      event.stopPropagation();

      lastInteractedOption.current = option;

      const getItemId = (item) => {
        if (typeof item === 'string') return item;
        return item.user_id || item.id || item._id || item.name;
      };

      const isSelected = selected.some(item => {
        return getItemId(item) === getItemId(option);
      });

      const newSelected = isSelected
        ? selected.filter(item => getItemId(item) !== getItemId(option))
        : [...selected, option];

      onChange(newSelected);
    }, [selected, onChange]);

    const handleKeyDown = useCallback((event, option) => {
      if (event.key === 'Enter' || event.key === ' ') {
        handleOptionInteraction(option, event);
      }
    }, [handleOptionInteraction]);

    const setOptionRef = useCallback((option, element) => {
      if (element) {
        optionRefs.current[option] = element;
      } else {
        delete optionRefs.current[option];
      }
    }, []);

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
                      {typeof item === 'string' ? item : item.name || item.label}
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
                  ref={searchInputRef}
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
                  ref={(el) => setOptionRef(option, el)}
                  data-option={option}
                  onMouseDown={(e) => handleOptionInteraction(option, e)}
                  onKeyDown={(e) => handleKeyDown(e, option)}
                  className="d-flex align-items-center p-3"
                  style={{ cursor: 'pointer', outline: 'none' }}
                  tabIndex={0}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onFocus={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onBlur={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="form-check me-3">
                    <input
                      type="checkbox"
                      checked={selected.some(item => {
                        const getItemId = (item) => {
                          if (typeof item === 'string') return item;
                          return item.user_id || item.id || item._id || item.name;
                        };
                        return getItemId(item) === getItemId(option);
                      })}
                      readOnly
                      className="form-check-input"
                      style={{ accentColor: '#ff6b35', pointerEvents: 'none' }}
                      tabIndex={-1}
                    />
                  </div>
                  <span style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {typeof option === 'string' ? option : option.name || option.label}
                  </span>
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
  });

  // Table management functions
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedRules = () => {
    if (!Array.isArray(rules)) {
      return [];
    }
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
          (counselor.name || counselor).toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesStatus = statusFilter === 'All' || rule.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredRules = getFilteredRules();

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleCriteriaChange = useCallback((criteria, type, values = []) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [criteria]: { type, values }
      };

      if (criteria === 'center') {
        newFormData.course = { type: 'includes', values: [] };
      }

      return newFormData;
    });
  }, []);

  const handleCounselorChange = useCallback((counselors) => {
    handleInputChange('assignedCounselors', counselors);
  }, [handleInputChange]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');
      
      // Transform the data for backend
      const submitData = {
        ...formData,
        assignedCounselors: formData.assignedCounselors.map(counselor => 
          counselor.user_id || counselor.id || counselor._id || counselor
        ),
        ...(formData.center.type === 'includes' && {
          center: {
            type: formData.center.type,
            values: formData.center.values.map(center => 
              center.id || center._id || center
            )
          }
          
        }),
        ...(formData.course.type === 'includes' && {
          course: {
            type: formData.course.type,
            values: formData.course.values.map(course => 
              course.id || course._id || course
            )
          }
        })
      };
      
      let response;
      
      if (editingRule) {
        response = await axios.put(`${backendUrl}/college/leadAssignmentRule/${editingRule._id}`, submitData, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth': token
          }
        });
      } else {
        response = await axios.post(`${backendUrl}/college/leadAssignmentRule`, submitData, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth': token
          }
        });
      }
  
      if (!response.data.status) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      if (response.data.status) {
        await fetchRules(); // Refresh the list
        closeModal();
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to save rule');
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      setError(error.message || 'Failed to save rule');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({
      ruleName: rule.ruleName,
      center: {
        type: rule.center?.type || 'includes',
        values: rule.center?.values || []
      },
      course: {
        type: rule.course?.type || 'includes',
        values: rule.course?.values || []
      },
      assignedCounselors: rule.assignedCounselors || []
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
    setError('');
    setFormData({
      ruleName: '',
      course: { type: 'includes', values: [] },
      center: { type: 'includes', values: [] },
      assignedCounselors: []
    });
  };

  // Focus management for modal
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isModalOpen && firstInputRef.current) {
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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const CriteriaSection = memo(({ title, criteria, options, placeholder }) => (
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
  ));

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
          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError('')}
                aria-label="Close"
              ></button>
            </div>
          )}

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
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : (
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
                              onClick={() => handleSort('createdAt')}
                            >
                              Created On {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="border-0 px-4 py-3 fw-semibold text-dark">Course</th>
                            <th className="border-0 px-4 py-3 fw-semibold text-dark">Center</th>
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
                              <tr key={rule._id || rule.id}>
                                <td className="px-4 py-3 fw-medium">{rule.ruleName}</td>
                                <td className="px-4 py-3 text-muted">
                                  {new Date(rule.createdAt || rule.createdOn).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                  {rule.course?.type === 'any' ? (
                                    <span className="badge bg-info text-white">Any Course</span>
                                  ) : (
                                    <>
                                      {rule.course?.values?.slice(0, 1).map((item, idx) => (
                                        <span key={idx} className="badge text-white me-1" style={{ backgroundColor: '#ff6b35' }}>
                                          {item.name || item}
                                        </span>
                                      ))}
                                      {rule.course?.values?.length > 1 && (
                                        <span className="text-muted small">+{rule.course.values.length - 1}</span>
                                      )}
                                    </>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {rule.center?.type === 'any' ? (
                                    <span className="badge bg-info text-white">Any Center</span>
                                  ) : (
                                    <span className="text-muted">
                                      {rule.center?.values?.map(item => item.name || item).join(', ') || 'N/A'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-muted">
                                  {rule.assignedCounselors?.map(counselor => counselor.name || counselor).join(', ') || 'N/A'}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="form-check form-switch">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={rule.status === 'Active'}
                                      onChange={() => toggleRuleStatus(rule._id || rule.id, rule.status)}
                                      style={{ accentColor: '#ff6b35' }}
                                    />
                                    <label className={`form-check-label small ${rule.status === 'Active' ? 'text-success' : 'text-danger'}`}>
                                      {rule.status}
                                    </label>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="d-flex gap-2">
                                    <button
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() => openEditModal(rule)}
                                      title="Edit Rule"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    {/* <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => deleteRule(rule._id || rule.id)}
                                      title="Delete Rule"
                                    >
                                      <Trash2 size={16} />
                                    </button> */}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" className="text-center py-4 text-muted">
                                No rules found matching your criteria
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
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
                    <h5 className="modal-title fw-bold text-black">
                      {editingRule ? 'Edit Assignment Rule' : 'Add Assignment Rule'}
                    </h5>
                    <button
                      onClick={closeModal}
                      className="btn-close"
                      aria-label="Close"
                    ></button>
                  </div>

                  {/* Modal Body */}
                  <div className="modal-body p-4 bg-white">
                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}

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

                    <CriteriaSection
                      title="Criteria 1: When &quot;Center Name&quot;"
                      criteria="center"
                      options={centers}
                      placeholder="Select Center Name"
                    />

                    <div className="text-center my-4">
                      <span className="badge px-3 py-2 fw-medium" style={{ backgroundColor: '#ff6b35', color: 'white' }}>AND</span>
                    </div>

                    <CriteriaSection
                      title="Criteria 2: When &quot;Course&quot;"
                      criteria="course"
                      options={getFilteredCourses()}
                      placeholder="Select Course"
                    />

                    {/* Assignment Section */}
                    <div className="border-top pt-4 mt-4">
                      <h6 className="fw-medium text-dark mb-3">Then Assigned Counselor(s) will be</h6>
                      <MultiSelectDropdown
                        options={users}
                        selected={formData.assignedCounselors}
                        onChange={handleCounselorChange}
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
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmit(formData)}
                      disabled={!formData.ruleName.trim() || submitting}
                      className="btn px-4 text-white"
                      style={{ backgroundColor: '#ff6b35' }}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          {editingRule ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingRule ? 'Update Rule' : 'Add Rule'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          .table-hover thead tr{
            border-bottom:1px solid #ccc!important;
            white-space: nowrap;
            font-size: 12px;
          }
          .table-hover tbody tr{
            font-size: 12px;
          }
          .form-check-input:checked {
            background-color: #ff6b35;
            border-color: #ff6b35;
          }
        `}
      </style>
    </div>
  );
};

export default LeadAssignmentRule;