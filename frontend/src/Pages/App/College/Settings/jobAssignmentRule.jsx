import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import axios from 'axios';
import { Plus, Edit, ChevronDown, Search } from 'lucide-react';

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

const getItemId = (item) => {
  if (typeof item === 'string') return item;
  return item.user_id || item.id || item._id || item.name;
};

const JobAssignmentRule = ({ users = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [jobCategories, setJobCategories] = useState([]);
  const [jobNames, setJobNames] = useState([]);

  const [formData, setFormData] = useState({
    ruleName: '',
    jobCategory: { type: 'includes', values: [] },
    jobName: { type: 'includes', values: [] },
    assignedHrs: []
  });

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = userData.token;
  const activeUsers = users.filter((user) => user.status === 'active');

  const [rules, setRules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchJobCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/placementStatus/job-form-options`, {
        headers: { 'x-auth': token }
      });
      const categories = response.data.categories || [];
      setJobCategories(categories.map((category) => ({
        id: category._id,
        _id: category._id,
        name: category.name
      })));
    } catch (err) {
      console.error('Error fetching job categories:', err);
    }
  }, [backendUrl, token]);

  const fetchJobNames = useCallback(async (categoryCriteria) => {
    try {
      const params = {};
      if (categoryCriteria?.type === 'includes') {
        const categoryIds = (categoryCriteria.values || [])
          .map((category) => category.id || category._id || category)
          .filter(Boolean);
        if (categoryIds.length === 0) {
          setJobNames([]);
          return;
        }
        params.categoryIds = categoryIds.join(',');
      }

      const response = await axios.get(`${backendUrl}/college/jobAssignmentRule/job-names`, {
        headers: { 'x-auth': token },
        params
      });
      const jobs = response.data.data || [];
      setJobNames(jobs.map((job) => ({
        id: job._id || job.id,
        _id: job._id || job.id,
        name: job.name || job.title,
        title: job.title || job.name,
        _jobCategory: job._jobCategory
      })));
    } catch (err) {
      console.error('Error fetching job names:', err);
      setJobNames([]);
    }
  }, [backendUrl, token]);

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

      const response = await axios.get(`${backendUrl}/college/jobAssignmentRule?${params}`, {
        headers: { 'x-auth': token }
      });

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to fetch rules');
      }

      setRules(response.data.data || []);
    } catch (err) {
      console.error('Error fetching job assignment rules:', err);
      setRules([]);
      setError(err.response?.data?.message || err.message || 'Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token, statusFilter, searchTerm, sortConfig]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    fetchJobCategories();
  }, [fetchJobCategories]);

  useEffect(() => {
    if (!isModalOpen) return;
    fetchJobNames(formData.jobCategory);
  }, [isModalOpen, formData.jobCategory, fetchJobNames]);

  const toggleRuleStatus = async (ruleId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      const response = await axios.patch(`${backendUrl}/college/jobAssignmentRule/${ruleId}/status`, {
        status: newStatus
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth': token
        }
      });

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to update status');
      }

      setRules((prev) => prev.map((rule) =>
        rule._id === ruleId ? { ...rule, status: newStatus } : rule
      ));
    } catch (err) {
      console.error('Error toggling status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update status');
    }
  };

  const MultiSelectDropdown = memo(({ options, selected, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownSearch, setDropdownSearch] = useState('');
    const dropdownRef = useRef(null);
    const optionRefs = useRef({});
    const { queueFocus } = useFocusManager();
    const lastInteractedOption = useRef(null);

    const filteredOptions = (options || []).filter((option) => {
      const optionText = typeof option === 'string' ? option : option.name || option.title || option.label || option.id || '';
      return optionText.toLowerCase().includes(dropdownSearch.toLowerCase());
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

      const isSelected = selected.some((item) => getItemId(item) === getItemId(option));
      const newSelected = isSelected
        ? selected.filter((item) => getItemId(item) !== getItemId(option))
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
                      {typeof item === 'string' ? item : item.name || item.title || item.label}
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
                  value={dropdownSearch}
                  onChange={(e) => setDropdownSearch(e.target.value)}
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
                  onMouseDown={(e) => handleOptionInteraction(option, e)}
                  onKeyDown={(e) => handleKeyDown(e, option)}
                  className="d-flex align-items-center p-3"
                  style={{ cursor: 'pointer', outline: 'none' }}
                  tabIndex={0}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  onFocus={(e) => { e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
                  onBlur={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div className="form-check me-3">
                    <input
                      type="checkbox"
                      checked={selected.some((item) => getItemId(item) === getItemId(option))}
                      readOnly
                      className="form-check-input"
                      style={{ accentColor: '#ff6b35', pointerEvents: 'none' }}
                      tabIndex={-1}
                    />
                  </div>
                  <span style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {typeof option === 'string' ? option : option.name || option.title || option.label}
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
    const sortableRules = [...rules];
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

  const filteredRules = getSortedRules().filter((rule) => {
    const matchesSearch = (rule.ruleName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rule.assignedHrs || []).some((hr) =>
        (hr.name || hr).toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus = statusFilter === 'All' || rule.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleCriteriaChange = useCallback((criteria, type, values = []) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [criteria]: { type, values }
      };
      if (criteria === 'jobCategory') {
        next.jobName = { type: prev.jobName?.type || 'includes', values: [] };
      }
      return next;
    });
  }, []);

  const getFilteredJobNames = useCallback(() => {
    if (formData.jobCategory.type === 'any') {
      return jobNames;
    }
    if (formData.jobCategory.values.length === 0) {
      return [];
    }
    const selectedCategoryIds = formData.jobCategory.values.map((category) =>
      String(category.id || category._id || category)
    );
    return jobNames.filter((job) => {
      const categoryId = job._jobCategory?._id || job._jobCategory;
      return categoryId && selectedCategoryIds.includes(String(categoryId));
    });
  }, [jobNames, formData.jobCategory]);

  const emptyForm = {
    ruleName: '',
    jobCategory: { type: 'includes', values: [] },
    jobName: { type: 'includes', values: [] },
    assignedHrs: []
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
    setError('');
    setFormData(emptyForm);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      const submitData = {
        ruleName: formData.ruleName,
        assignedHrs: formData.assignedHrs.map((hr) => hr.user_id || hr.id || hr._id || hr),
        jobCategory: {
          type: formData.jobCategory.type,
          values: formData.jobCategory.type === 'includes'
            ? formData.jobCategory.values.map((category) => category.id || category._id || category)
            : []
        },
        jobName: {
          type: formData.jobName.type,
          values: formData.jobName.type === 'includes'
            ? formData.jobName.values.map((job) => job.id || job._id || job)
            : []
        }
      };

      let response;
      if (editingRule) {
        response = await axios.put(`${backendUrl}/college/jobAssignmentRule/${editingRule._id}`, submitData, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth': token
          }
        });
      } else {
        response = await axios.post(`${backendUrl}/college/jobAssignmentRule`, submitData, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth': token
          }
        });
      }

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to save rule');
      }

      await fetchRules();
      closeModal();
    } catch (err) {
      console.error('Error saving job assignment rule:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save rule');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({
      ruleName: rule.ruleName,
      jobCategory: {
        type: rule.jobCategory?.type || 'includes',
        values: rule.jobCategory?.values || []
      },
      jobName: {
        type: rule.jobName?.type || 'includes',
        values: (rule.jobName?.values || []).filter(Boolean).map((job) => ({
          ...job,
          id: job._id || job.id,
          name: job.name || job.title
        }))
      },
      assignedHrs: rule.assignedHrs || []
    });
    setIsModalOpen(true);
  };

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

  const canSubmit = formData.ruleName.trim() &&
    formData.assignedHrs.length > 0 &&
    (formData.jobCategory.type === 'any' || formData.jobCategory.values.length > 0) &&
    (formData.jobName.type === 'any' || formData.jobName.values.length > 0);

  return (
    <div>
      <div className="min-vh-100 bg-light">
        <div className="container-fluid">
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
                            placeholder="Search rules or HR..."
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
                            <th className="border-0 px-4 py-3 fw-semibold text-dark">Job Category</th>
                            <th className="border-0 px-4 py-3 fw-semibold text-dark">Job Name</th>
                            <th className="border-0 px-4 py-3 fw-semibold text-dark">HR</th>
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
                                  {rule.jobCategory?.type === 'any' ? (
                                    <span className="badge bg-info text-white">Any Job Category</span>
                                  ) : (
                                    <>
                                      {rule.jobCategory?.values?.slice(0, 1).map((item, idx) => (
                                        <span key={idx} className="badge text-white me-1" style={{ backgroundColor: '#ff6b35' }}>
                                          {item.name || item}
                                        </span>
                                      ))}
                                      {rule.jobCategory?.values?.length > 1 && (
                                        <span className="text-muted small">+{rule.jobCategory.values.length - 1}</span>
                                      )}
                                    </>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {rule.jobName?.type === 'any' || !rule.jobName?.type ? (
                                    <span className="badge bg-info text-white">Any Job Name</span>
                                  ) : (
                                    <>
                                      {rule.jobName?.values?.slice(0, 1).map((item, idx) => (
                                        <span key={idx} className="badge text-white me-1" style={{ backgroundColor: '#ff6b35' }}>
                                          {item.name || item.title || item}
                                        </span>
                                      ))}
                                      {rule.jobName?.values?.length > 1 && (
                                        <span className="text-muted small">+{rule.jobName.values.length - 1}</span>
                                      )}
                                    </>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-muted">
                                  {rule.assignedHrs?.map((hr) => hr.name || hr).join(', ') || 'N/A'}
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
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => openEditModal(rule)}
                                    title="Edit Rule"
                                  >
                                    <Edit size={16} />
                                  </button>
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

          {isModalOpen && (
            <div
              className="modal d-block"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={(e) => e.target === e.currentTarget && closeModal()}
            >
              <div className="modal-dialog modal-lg modal-dialog-scrollable" ref={modalRef}>
                <div className="modal-content border-0 shadow-lg">
                  <div className="modal-header bg-white border-bottom">
                    <h5 className="modal-title fw-bold text-black">
                      {editingRule ? 'Edit Job Assignment Rule' : 'Add Job Assignment Rule'}
                    </h5>
                    <button
                      onClick={closeModal}
                      className="btn-close"
                      aria-label="Close"
                    ></button>
                  </div>

                  <div className="modal-body p-4 bg-white">
                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}

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

                    <div className="mb-4">
                      <h6 className="fw-medium text-dark mb-3">Criteria 1: When &quot;Job Category&quot;</h6>
                      <div className="d-flex gap-4 mb-3">
                        <div className="form-check">
                          <input
                            type="radio"
                            name="jobCategory"
                            checked={formData.jobCategory.type === 'includes'}
                            onChange={() => handleCriteriaChange('jobCategory', 'includes', formData.jobCategory.values)}
                            className="form-check-input"
                            id="jobCategory-includes"
                            style={{ accentColor: '#ff6b35' }}
                          />
                          <label className="form-check-label" htmlFor="jobCategory-includes">
                            Includes
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            type="radio"
                            name="jobCategory"
                            checked={formData.jobCategory.type === 'any'}
                            onChange={() => handleCriteriaChange('jobCategory', 'any', [])}
                            className="form-check-input"
                            id="jobCategory-any"
                            style={{ accentColor: '#ff6b35' }}
                          />
                          <label className="form-check-label" htmlFor="jobCategory-any">
                            Any Job Category
                          </label>
                        </div>
                      </div>
                      {formData.jobCategory.type === 'includes' && (
                        <MultiSelectDropdown
                          options={jobCategories}
                          selected={formData.jobCategory.values}
                          onChange={(values) => handleCriteriaChange('jobCategory', 'includes', values)}
                          placeholder="Select Job Category"
                        />
                      )}
                    </div>

                    <div className="text-center my-4">
                      <span className="badge px-3 py-2 fw-medium" style={{ backgroundColor: '#ff6b35', color: 'white' }}>AND</span>
                    </div>

                    <div className="mb-4">
                      <h6 className="fw-medium text-dark mb-3">Criteria 2: When &quot;Job Name&quot;</h6>
                      <div className="d-flex gap-4 mb-3">
                        <div className="form-check">
                          <input
                            type="radio"
                            name="jobName"
                            checked={formData.jobName.type === 'includes'}
                            onChange={() => handleCriteriaChange('jobName', 'includes', formData.jobName.values)}
                            className="form-check-input"
                            id="jobName-includes"
                            style={{ accentColor: '#ff6b35' }}
                          />
                          <label className="form-check-label" htmlFor="jobName-includes">
                            Includes
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            type="radio"
                            name="jobName"
                            checked={formData.jobName.type === 'any'}
                            onChange={() => handleCriteriaChange('jobName', 'any', [])}
                            className="form-check-input"
                            id="jobName-any"
                            style={{ accentColor: '#ff6b35' }}
                          />
                          <label className="form-check-label" htmlFor="jobName-any">
                            Any Job Name
                          </label>
                        </div>
                      </div>
                      {formData.jobName.type === 'includes' && (
                        <>
                          <MultiSelectDropdown
                            options={getFilteredJobNames()}
                            selected={formData.jobName.values}
                            onChange={(values) => handleCriteriaChange('jobName', 'includes', values)}
                            placeholder="Select Job Name"
                          />
                          {formData.jobCategory.type === 'includes' && formData.jobCategory.values.length === 0 && (
                            <small className="text-muted fst-italic mt-2 d-block">
                              Select a job category first to see job names.
                            </small>
                          )}
                        </>
                      )}
                    </div>

                    <div className="border-top pt-4 mt-4">
                      <h6 className="fw-medium text-dark mb-3">Then Assigned HR will be</h6>
                      <MultiSelectDropdown
                        options={activeUsers}
                        selected={formData.assignedHrs}
                        onChange={(hrs) => handleInputChange('assignedHrs', hrs)}
                        placeholder="Select"
                      />
                      <small className="text-muted fst-italic mt-2 d-block">
                        If multiple HR are selected, job distribution will be done in round robin manner.
                      </small>
                    </div>
                  </div>

                  <div className="modal-footer bg-white border-top">
                    <button
                      onClick={closeModal}
                      className="btn btn-outline-secondary px-4"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit || submitting}
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

export default JobAssignmentRule;
