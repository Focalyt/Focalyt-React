import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

// MultiSelectCheckbox Component
const MultiSelectCheckbox = ({
  title,
  options,
  selectedValues,
  onChange,
  icon = "fas fa-list",
  isOpen,
  onToggle
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleCheckboxChange = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get display text for selected items
  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return `Select ${title}`;
    } else if (selectedValues.length === 1) {
      const selectedOption = options.find(opt => opt.value === selectedValues[0]);
      return selectedOption ? selectedOption.label : selectedValues[0];
    } else if (selectedValues.length <= 2) {
      const selectedLabels = selectedValues.map(val => {
        const option = options.find(opt => opt.value === val);
        return option ? option.label : val;
      });
      return selectedLabels.join(', ');
    } else {
      return `${selectedValues.length} items selected`;
    }
  };

  return (
    <div className="multi-select-container-new">
      <label className="form-label small fw-bold text-dark d-flex align-items-center mb-2">
        <i className={`${icon} me-1 text-primary`}></i>
        {title}
        {selectedValues.length > 0 && (
          <span className="badge bg-primary ms-2">{selectedValues.length}</span>
        )}
      </label>

      <div className="multi-select-dropdown-new">
        <button
          type="button"
          className={`form-select multi-select-trigger ${isOpen ? 'open' : ''}`}
          onClick={onToggle}
          style={{ cursor: 'pointer', textAlign: 'left' }}
        >
          <span className="select-display-text">
            {getDisplayText()}
          </span>
          <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} dropdown-arrow`}></i>
        </button>

        {isOpen && (
          <div className="multi-select-options-new">
            <div className="options-search">
              <div className="input-group input-group-sm">
                <span className="input-group-text" style={{ height: '40px' }}>
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Search ${title.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="options-list-new">
              {filteredOptions.map((option) => (
                <label key={option.value} className="option-item-new">
                  <input
                    type="checkbox"
                    className="form-check-input me-2"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleCheckboxChange(option.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="option-label-new">{option.label}</span>
                  {selectedValues.includes(option.value) && (
                    <i className="fas fa-check text-primary ms-auto"></i>
                  )}
                </label>
              ))}

              {filteredOptions.length === 0 && (
                <div className="no-options">
                  <i className="fas fa-info-circle me-2"></i>
                  {searchTerm ? `No ${title.toLowerCase()} found for "${searchTerm}"` : `No ${title.toLowerCase()} available`}
                </div>
              )}
            </div>

            {/* Footer with count */}
            {selectedValues.length > 0 && (
              <div className="options-footer">
                <small className="text-muted">
                  {selectedValues.length} of {filteredOptions.length} selected
                  {searchTerm && ` (filtered from ${options.length} total)`}
                </small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const UploadCandidates = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  const [imports, setImports] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Uploaded candidates state
  const [uploadedCandidates, setUploadedCandidates] = useState([]);
  const [candidatesPage, setCandidatesPage] = useState(1);
  const [candidatesTotalPages, setCandidatesTotalPages] = useState(1);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  
  // Active candidates state
  const [activeCandidates, setActiveCandidates] = useState([]);
  const [activePage, setActivePage] = useState(1);
  const [activeTotalPages, setActiveTotalPages] = useState(1);
  const [activeLoading, setActiveLoading] = useState(false);
  
  // Inactive candidates state
  const [inactiveCandidates, setInactiveCandidates] = useState([]);
  const [inactivePage, setInactivePage] = useState(1);
  const [inactiveTotalPages, setInactiveTotalPages] = useState(1);
  const [inactiveLoading, setInactiveLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('imports');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [courseOptions, setCourseOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([
    { value: '1st', label: '1st Year' },
    { value: '2nd', label: '2nd Year' },
    { value: '3rd', label: '3rd Year' },
    { value: '4th', label: '4th Year' }
  ]);
  const [sessionOptions, setSessionOptions] = useState([]);
  
  // Form data for multi-select filters
  const [filterData, setFilterData] = useState({
    course: {
      type: "includes",
      values: []
    },
    year: {
      type: "includes",
      values: []
    },
    session: {
      type: "includes",
      values: []
    }
  });

  const [dropdownStates, setDropdownStates] = useState({
    course: false,
    year: false,
    session: false
  });

  const [showFilterModal, setShowFilterModal] = useState(false);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await axios.get(`${backendUrl}/college/filters-data`, {
          headers: { 'x-auth': token }
        });
        if (res.data.status) {
          setCourseOptions(res.data.courses.map(c => ({ value: c._id, label: c.name })));
          
          // Extract unique sessions from candidates
          fetchUniqueSessions();
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch unique sessions from candidates
  const fetchUniqueSessions = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/uploaded-candidates?page=1&limit=1000`, {
        headers: { 'x-auth': token }
      });
      if (response.data && response.data.status) {
        const candidates = response.data.candidates || [];
        const uniqueSessions = [...new Set(candidates.map(c => c.session).filter(Boolean))];
        setSessionOptions(uniqueSessions.map(s => ({ value: s, label: s })));
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const toggleDropdown = (filterName) => {
    setDropdownStates(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const handleCriteriaChange = (criteria, values) => {
    setFilterData((prevState) => ({
      ...prevState,
      [criteria]: {
        type: "includes",
        values: values
      }
    }));
  };

  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
    // Reset to first page when searching
    if (activeTab === 'candidates') {
      setCandidatesPage(1);
    } else if (activeTab === 'active') {
      setActivePage(1);
    } else if (activeTab === 'inactive') {
      setInactivePage(1);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearchTerm('');
    // Reset to first page when clearing
    if (activeTab === 'candidates') {
      setCandidatesPage(1);
    } else if (activeTab === 'active') {
      setActivePage(1);
    } else if (activeTab === 'inactive') {
      setInactivePage(1);
    }
  };

  // Handle click outside to close dropdowns and modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close dropdowns if clicking outside multi-select containers
      if (!event.target.closest('.multi-select-container-new')) {
        setDropdownStates({
          course: false,
          year: false,
          session: false
        });
      }

      // Close modal if clicking on the backdrop (outside modal content)
      if (showFilterModal) {
        const modalContent = event.target.closest('.modal-content');
        const modalDialog = event.target.closest('.modal-dialog');
        if (!modalContent && !modalDialog && event.target.classList.contains('modal')) {
          setShowFilterModal(false);
        }
      }
    };

    // Handle Escape key to close modal
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showFilterModal) {
        setShowFilterModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showFilterModal]);

  useEffect(() => {
    if (activeTab === 'imports') {
      fetchImports();
    } else if (activeTab === 'candidates') {
      fetchUploadedCandidates();
    } else if (activeTab === 'active') {
      fetchActiveCandidates();
    } else if (activeTab === 'inactive') {
      fetchInactiveCandidates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, candidatesPage, activePage, inactivePage, activeTab, appliedSearchTerm, filterData]);

  const fetchImports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/college/imports?page=${currentPage}`, {
        headers: { 'x-auth': token }
      });
      setImports(response.data.imports || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching imports:', error);
      setMessage(error.response?.data?.message || 'Error fetching import history');
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadedCandidates = async () => {
    try {
      setCandidatesLoading(true);
      const params = {
        page: candidatesPage,
        limit: 50
      };

      // Add search parameter
      if (appliedSearchTerm) {
        params.search = appliedSearchTerm;
      }

      // Add filter parameters
      if (filterData.course.values.length > 0) {
        params.course = JSON.stringify(filterData.course.values);
      }
      if (filterData.year.values.length > 0) {
        params.year = JSON.stringify(filterData.year.values);
      }
      if (filterData.session.values.length > 0) {
        params.session = JSON.stringify(filterData.session.values);
      }

      const response = await axios.get(`${backendUrl}/college/uploaded-candidates`, {
        headers: { 'x-auth': token },
        params: params
      });
      
      if (response.data && response.data.status) {
        const candidates = response.data.candidates || [];
        setUploadedCandidates(candidates);
        setCandidatesTotalPages(response.data.totalPages || 1);
      } else {
        setUploadedCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching uploaded candidates:', error);
      setMessage(error.response?.data?.message || 'Error fetching uploaded candidates');
      setUploadedCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const fetchActiveCandidates = async () => {
    try {
      setActiveLoading(true);
      const params = {
        page: activePage,
        limit: 50,
        status: 'active'
      };

      if (appliedSearchTerm) {
        params.search = appliedSearchTerm;
      }
      if (filterData.course.values.length > 0) {
        params.course = JSON.stringify(filterData.course.values);
      }
      if (filterData.year.values.length > 0) {
        params.year = JSON.stringify(filterData.year.values);
      }
      if (filterData.session.values.length > 0) {
        params.session = JSON.stringify(filterData.session.values);
      }

      const response = await axios.get(`${backendUrl}/college/uploaded-candidates`, {
        headers: { 'x-auth': token },
        params: params
      });
      
      if (response.data && response.data.status) {
        const candidates = response.data.candidates || [];
        setActiveCandidates(candidates);
        setActiveTotalPages(response.data.totalPages || 1);
      } else {
        setActiveCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching active candidates:', error);
      setMessage(error.response?.data?.message || 'Error fetching active candidates');
      setActiveCandidates([]);
    } finally {
      setActiveLoading(false);
    }
  };

  const fetchInactiveCandidates = async () => {
    try {
      setInactiveLoading(true);
      const params = {
        page: inactivePage,
        limit: 50,
        status: 'inactive'
      };

      if (appliedSearchTerm) {
        params.search = appliedSearchTerm;
      }
      if (filterData.course.values.length > 0) {
        params.course = JSON.stringify(filterData.course.values);
      }
      if (filterData.year.values.length > 0) {
        params.year = JSON.stringify(filterData.year.values);
      }
      if (filterData.session.values.length > 0) {
        params.session = JSON.stringify(filterData.session.values);
      }

      const response = await axios.get(`${backendUrl}/college/uploaded-candidates`, {
        headers: { 'x-auth': token },
        params: params
      });
      
      if (response.data && response.data.status) {
        const candidates = response.data.candidates || [];
        setInactiveCandidates(candidates);
        setInactiveTotalPages(response.data.totalPages || 1);
      } else {
        setInactiveCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching inactive candidates:', error);
      setMessage(error.response?.data?.message || 'Error fetching inactive candidates');
      setInactiveCandidates([]);
    } finally {
      setInactiveLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
        setMessage('Please select a valid Excel file (.xlsx, .xls) or CSV file');
        e.target.value = '';
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        setMessage('File size should not exceed 10MB');
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
      setMessage(''); // Clear any previous messages
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    setLoading(true);
    setMessage(''); // Clear previous messages
    const formData = new FormData();
    formData.append('filename', file);

    try {
      const response = await axios.post(`${backendUrl}/college/uploadfiles`, formData, {
        headers: { 
          'x-auth': token,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Clear file input
      const fileInput = document.getElementById('myFile');
      if (fileInput) {
        fileInput.value = '';
      }
      setFile(null);
      
      // Show success message with details
      if (response.data.status) {
        const successMsg = response.data.message || 'File uploaded successfully!';
        const errorCount = response.data.errorCount || 0;
        const successCount = response.data.successCount || 0;
        
        if (errorCount > 0) {
          setMessage(`${successMsg} - ${successCount} records inserted, ${errorCount} error(s) occurred`);
        } else {
          setMessage(`${successMsg} - ${successCount} records inserted successfully`);
        }
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setMessage('');
        }, 5000);
      } else {
        setMessage(response.data.message || 'File uploaded with some errors');
      }
      
      fetchImports();
      // Also refresh candidates if on that tab
      if (activeTab === 'candidates') {
        fetchUploadedCandidates();
      } else if (activeTab === 'active') {
        fetchActiveCandidates();
      } else if (activeTab === 'inactive') {
        fetchInactiveCandidates();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      // Show actual error message from backend
      const errorMessage = error.response?.data?.message || error.message || 'Error uploading file. Please try again.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/single`, {
        responseType: 'blob',
        headers: { 'x-auth': token }
      });
      
      // response.data is already a Blob when using responseType: 'blob'
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample.xlsx');
      document.body.appendChild(link);
      link.click();
      
      // Clean up after download starts
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading sample:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error downloading sample file';
      setMessage(errorMessage);
    }
  };

  const renderCandidatesPagination = () => {
    if (candidatesTotalPages <= 1) return null;

    const pages = [];
    let start = 1;
    let end = candidatesTotalPages > 4 ? 4 : candidatesTotalPages;

    if (candidatesTotalPages > 4 && candidatesPage >= 2) {
      start = candidatesPage - 1;
      end = candidatesPage + 1;
      if (end > candidatesTotalPages) end = candidatesTotalPages;
    }

    if (start > 1) {
      pages.push(
        <li key="first" className="page-item">
          <button className="page-link" onClick={() => setCandidatesPage(1)}>First</button>
        </li>
      );
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === candidatesPage ? 'active' : ''}`}>
          <button className="page-link" onClick={() => setCandidatesPage(i)}>{i}</button>
        </li>
      );
    }

    if (end < candidatesTotalPages) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <button className="page-link" onClick={() => setCandidatesPage(end + 1)}>...</button>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <button className="page-link" onClick={() => setCandidatesPage(candidatesTotalPages)}>Last</button>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end mb-0 mt-3">
        {pages}
      </ul>
    );
  };

  const renderActivePagination = () => {
    if (activeTotalPages <= 1) return null;

    const pages = [];
    let start = 1;
    let end = activeTotalPages > 4 ? 4 : activeTotalPages;

    if (activeTotalPages > 4 && activePage >= 2) {
      start = activePage - 1;
      end = activePage + 1;
      if (end > activeTotalPages) end = activeTotalPages;
    }

    if (start > 1) {
      pages.push(
        <li key="first" className="page-item">
          <button className="page-link" onClick={() => setActivePage(1)}>First</button>
        </li>
      );
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === activePage ? 'active' : ''}`}>
          <button className="page-link" onClick={() => setActivePage(i)}>{i}</button>
        </li>
      );
    }

    if (end < activeTotalPages) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <button className="page-link" onClick={() => setActivePage(end + 1)}>...</button>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <button className="page-link" onClick={() => setActivePage(activeTotalPages)}>Last</button>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end mb-0 mt-3">
        {pages}
      </ul>
    );
  };

  const renderInactivePagination = () => {
    if (inactiveTotalPages <= 1) return null;

    const pages = [];
    let start = 1;
    let end = inactiveTotalPages > 4 ? 4 : inactiveTotalPages;

    if (inactiveTotalPages > 4 && inactivePage >= 2) {
      start = inactivePage - 1;
      end = inactivePage + 1;
      if (end > inactiveTotalPages) end = inactiveTotalPages;
    }

    if (start > 1) {
      pages.push(
        <li key="first" className="page-item">
          <button className="page-link" onClick={() => setInactivePage(1)}>First</button>
        </li>
      );
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === inactivePage ? 'active' : ''}`}>
          <button className="page-link" onClick={() => setInactivePage(i)}>{i}</button>
        </li>
      );
    }

    if (end < inactiveTotalPages) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <button className="page-link" onClick={() => setInactivePage(end + 1)}>...</button>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <button className="page-link" onClick={() => setInactivePage(inactiveTotalPages)}>Last</button>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end mb-0 mt-3">
        {pages}
      </ul>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    let start = 1;
    let end = totalPages > 4 ? 4 : totalPages;

    if (totalPages > 4 && currentPage >= 2) {
      start = currentPage - 1;
      end = currentPage + 1;
      if (end > totalPages) end = totalPages;
    }

    if (start > 1) {
      pages.push(
        <li key="first" className="page-item">
          <button className="page-link" onClick={() => setCurrentPage(1)}>First</button>
        </li>
      );
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
          <button className="page-link" onClick={() => setCurrentPage(i)}>{i}</button>
        </li>
      );
    }

    if (end < totalPages) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <button className="page-link" onClick={() => setCurrentPage(end + 1)}>...</button>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <button className="page-link" onClick={() => setCurrentPage(totalPages)}>Last</button>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end mb-0 mt-3">
        {pages}
      </ul>
    );
  };

  const totalActiveFilters =
    filterData.course.values.length +
    filterData.year.values.length +
    filterData.session.values.length;

  const tabConfig = {
    imports: {
      title: 'Import History',
      subtitle: 'Review previous uploads, status updates, and processed record counts.',
      icon: 'fas fa-clock-rotate-left',
      count: imports.length
    },
    candidates: {
      title: 'Uploaded Candidates',
      subtitle: 'Browse every imported candidate with search and academic filters.',
      icon: 'fas fa-user-graduate',
      count: uploadedCandidates.length
    },
    active: {
      title: 'Active Candidates',
      subtitle: 'Track candidates currently active in the placement pipeline.',
      icon: 'fas fa-circle-check',
      count: activeCandidates.length
    },
    inactive: {
      title: 'Inactive Candidates',
      subtitle: 'Review profiles that are currently inactive or paused.',
      icon: 'fas fa-user-clock',
      count: inactiveCandidates.length
    }
  };

  const currentTabConfig = tabConfig[activeTab];

  return (
    <>
      <div className="upload-candidates-page">
        <section className="upload-header-shell">
          <div className="page-title-card">
            <div className="upload-hero-copy">
              <span className="upload-hero-badge">
                <i className="fas fa-file-arrow-up"></i>
                Candidate Pipeline
              </span>
              <h1>Upload Candidates</h1>
              <p>
                Import candidate spreadsheets, review upload history, and manage candidate records from one organized workspace.
              </p>
            </div>
            <div className="upload-hero-metrics compact">
              <div className="upload-metric-card">
                <span className="metric-label">Current View</span>
                <strong>{currentTabConfig.title}</strong>
              </div>
              <div className="upload-metric-card">
                <span className="metric-label">Applied Filters</span>
                <strong>{totalActiveFilters}</strong>
              </div>
              <div className="upload-metric-card">
                <span className="metric-label">Search</span>
                <strong>{appliedSearchTerm ? 'Active' : 'All Records'}</strong>
              </div>
            </div>
          </div>

          <div className="upload-toolbar-card">
            <label className="toolbar-label">Quick Search</label>
            <div className="search-shell">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search by name, email, or contact number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <button type="button" className="toolbar-btn toolbar-btn-primary" onClick={handleSearch}>
                Search
              </button>
              {(searchTerm || appliedSearchTerm) && (
                <button type="button" className="toolbar-btn toolbar-btn-ghost" onClick={handleClearSearch}>
                  Clear
                </button>
              )}
            </div>

            <div className="toolbar-actions-row">
              <button
                type="button"
                className="toolbar-action-pill"
                onClick={() => setShowFilterModal(true)}
              >
                <i className="fas fa-sliders"></i>
                Filters
                {totalActiveFilters > 0 && <span className="toolbar-count">{totalActiveFilters}</span>}
              </button>

              <button
                type="button"
                className="toolbar-action-pill success"
                onClick={downloadSample}
              >
                <i className="fas fa-download"></i>
                Download Sample
              </button>
            </div>
          </div>
        </section>

        {loading && <div id="preloader">Loading...</div>}

        <div className="content-body upload-page-body">
          {message && (
            <div
              className={`upload-status-banner ${message.includes('successfully') || message.includes('inserted') ? 'success' : 'error'}`}
              role="alert"
            >
              <i className={`fas ${message.includes('successfully') || message.includes('inserted') ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
              {message}
            </div>
          )}

          <section className="upload-shell">
            <div className="upload-stack">
              <div className="upload-panel card-like upload-panel-wide">
                <div className="section-head upload-panel-head">
                  <div>
                    <span className="section-kicker">Bulk Upload</span>
                    <h3>Import candidate spreadsheet</h3>
                    <p>Accepted formats: `.xlsx`, `.xls`, `.csv` up to 10MB. Use the sample file to keep columns aligned.</p>
                  </div>
                  <span className="soft-badge">
                    <i className="fas fa-shield-check"></i>
                    Secure upload
                  </span>
                </div>

                <form onSubmit={handleSubmit} id="candidateUpload" encType="multipart/form-data" className="upload-form-shell upload-form-row">
                  <div className="file-drop-shell compact">
                    <div className="file-drop-icon">
                      <i className="fas fa-file-import"></i>
                    </div>
                    <div className="file-drop-copy">
                      <h4>{file ? file.name : 'Choose candidate file'}</h4>
                      <p>{file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB selected` : 'Browse and upload your source sheet.'}</p>
                    </div>
                    <input
                      type="file"
                      id="myFile"
                      name="filename"
                      onChange={handleFileChange}
                      className="stylish-file-input"
                    />
                  </div>

                  <div className="upload-side-actions">
                    <div className="upload-hints">
                      <span><i className="fas fa-circle-info"></i> Keep headers aligned with the sample file.</span>
                      <span><i className="fas fa-bolt"></i> Import history refreshes automatically after upload.</span>
                    </div>
                    <button
                      type="submit"
                      className="primary-gradient-btn upload-submit-btn"
                      id="submitBtn"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="mini-spinner"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-cloud-arrow-up"></i>
                          Upload File
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="records-panel card-like">
                <div className="records-panel-top">
                  <div className="section-head compact">
                    <div>
                      <span className="section-kicker">Records</span>
                      <h3>{currentTabConfig.title}</h3>
                      <p>{currentTabConfig.subtitle}</p>
                    </div>
                  </div>
                  <div className="records-summary-chip">
                    <i className={currentTabConfig.icon}></i>
                    <span>{currentTabConfig.count} visible</span>
                  </div>
                </div>

                <div className="tab-pill-row" role="tablist" aria-label="Candidate views">
                  <button className={`tab-pill ${activeTab === 'imports' ? 'active' : ''}`} onClick={() => setActiveTab('imports')} type="button">
                    <i className="fas fa-clock-rotate-left"></i>
                    Import History
                  </button>
                  <button className={`tab-pill ${activeTab === 'candidates' ? 'active' : ''}`} onClick={() => setActiveTab('candidates')} type="button">
                    <i className="fas fa-user-graduate"></i>
                    Uploaded
                  </button>
                  <button className={`tab-pill ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')} type="button">
                    <i className="fas fa-circle-check"></i>
                    Active
                  </button>
                  <button className={`tab-pill ${activeTab === 'inactive' ? 'active' : ''}`} onClick={() => setActiveTab('inactive')} type="button">
                    <i className="fas fa-user-clock"></i>
                    Inactive
                  </button>
                </div>

                <div className="table-card-shell">
                  {activeTab === 'imports' ? (
                    <div className="card-content">
                      <div className="table-responsive modern-table-wrap">
                        {imports && imports.length > 0 ? (
                          <table className="table table-hover-animation mb-0 modern-data-table">
                            <thead>
                              <tr>
                                <th>File Name</th>
                                <th>Message</th>
                                <th>Status</th>
                                <th>Records Inserted</th>
                                <th>Upload Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {imports.map((item) => (
                                <tr key={item._id}>
                                  <td className="text-capitalize fw-semibold">{item.name}</td>
                                  <td>
                                    <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                                      {item.message ? (
                                        <div dangerouslySetInnerHTML={{ __html: item.message }}></div>
                                      ) : (
                                        <span>N/A</span>
                                      )}
                                    </div>
                                  </td>
                                  <td>{item.status}</td>
                                  <td>{item.record}</td>
                                  <td>{moment(item.createdAt).format('Do MMMM, YYYY HH:mm')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="empty-state-shell">
                            <i className="fas fa-inbox"></i>
                            <p>No import history found</p>
                          </div>
                        )}
                      </div>
                      {renderPagination()}
                    </div>
                  ) : activeTab === 'candidates' ? (
                    <div className="card-content">
                      {candidatesLoading ? (
                        <div className="table-loading-shell">
                          <div className="spinner-border" role="status">
                            <span className="sr-only">Loading...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="table-responsive modern-table-wrap">
                          {uploadedCandidates && uploadedCandidates.length > 0 ? (
                            <table className="table table-hover-animation mb-0 modern-data-table">
                              <thead>
                                <tr>
                                  <th>Sr. No.</th>
                                  <th>Candidate Name</th>
                                  <th>Father Name</th>
                                  <th>Course</th>
                                  <th>Year</th>
                                  <th>Contact Number</th>
                                  <th>Email</th>
                                  <th>Gender</th>
                                  <th>DOB</th>
                                  <th>Session/Semester</th>
                                  <th>Upload Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {uploadedCandidates.map((candidate, index) => (
                                  <tr key={candidate._id}>
                                    <td>{(candidatesPage - 1) * 50 + index + 1}</td>
                                    <td className="text-capitalize fw-semibold">{candidate.name || 'N/A'}</td>
                                    <td className="text-capitalize">{candidate.fatherName || 'N/A'}</td>
                                    <td>{candidate.course || 'N/A'}</td>
                                    <td>{candidate.year || 'N/A'}</td>
                                    <td>{candidate.contactNumber || 'N/A'}</td>
                                    <td>{candidate.email || 'N/A'}</td>
                                    <td>{candidate.gender || 'N/A'}</td>
                                    <td>{candidate.dob ? moment(candidate.dob).format('Do MMMM, YYYY') : 'N/A'}</td>
                                    <td>{candidate.session || 'N/A'}</td>
                                    <td>{candidate.createdAt ? moment(candidate.createdAt).format('Do MMMM, YYYY HH:mm') : 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="empty-state-shell">
                              <i className="fas fa-users-slash"></i>
                              <p>No uploaded candidates found</p>
                            </div>
                          )}
                        </div>
                      )}
                      {renderCandidatesPagination()}
                    </div>
                  ) : activeTab === 'active' ? (
                    <div className="card-content">
                      {activeLoading ? (
                        <div className="table-loading-shell">
                          <div className="spinner-border" role="status">
                            <span className="sr-only">Loading...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="table-responsive modern-table-wrap">
                          {activeCandidates && activeCandidates.length > 0 ? (
                            <table className="table table-hover-animation mb-0 modern-data-table">
                              <thead>
                                <tr>
                                  <th>Sr. No.</th>
                                  <th>Candidate Name</th>
                                  <th>Father Name</th>
                                  <th>Contact Number</th>
                                  <th>Email</th>
                                  <th>Gender</th>
                                  <th>DOB</th>
                                  <th>Course</th>
                                  <th>Year</th>
                                  <th>Session/Semester</th>
                                  <th>Upload Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {activeCandidates.map((candidate, index) => (
                                  <tr key={candidate._id}>
                                    <td>{(activePage - 1) * 50 + index + 1}</td>
                                    <td className="text-capitalize fw-semibold">{candidate.name || 'N/A'}</td>
                                    <td className="text-capitalize">{candidate.fatherName || 'N/A'}</td>
                                    <td>{candidate.contactNumber || 'N/A'}</td>
                                    <td>{candidate.email || 'N/A'}</td>
                                    <td>{candidate.gender || 'N/A'}</td>
                                    <td>{candidate.dob ? moment(candidate.dob).format('Do MMMM, YYYY') : 'N/A'}</td>
                                    <td>{candidate.course || 'N/A'}</td>
                                    <td>{candidate.year || 'N/A'}</td>
                                    <td>{candidate.session || 'N/A'}</td>
                                    <td>{candidate.createdAt ? moment(candidate.createdAt).format('Do MMMM, YYYY HH:mm') : 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="empty-state-shell">
                              <i className="fas fa-user-check"></i>
                              <p>No active candidates found</p>
                            </div>
                          )}
                        </div>
                      )}
                      {renderActivePagination()}
                    </div>
                  ) : (
                    <div className="card-content">
                      {inactiveLoading ? (
                        <div className="table-loading-shell">
                          <div className="spinner-border" role="status">
                            <span className="sr-only">Loading...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="table-responsive modern-table-wrap">
                          {inactiveCandidates && inactiveCandidates.length > 0 ? (
                            <table className="table table-hover-animation mb-0 modern-data-table">
                              <thead>
                                <tr>
                                  <th>Sr. No.</th>
                                  <th>Candidate Name</th>
                                  <th>Father Name</th>
                                  <th>Contact Number</th>
                                  <th>Email</th>
                                  <th>Gender</th>
                                  <th>DOB</th>
                                  <th>Course</th>
                                  <th>Year</th>
                                  <th>Session/Semester</th>
                                  <th>Upload Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inactiveCandidates.map((candidate, index) => (
                                  <tr key={candidate._id}>
                                    <td>{(inactivePage - 1) * 50 + index + 1}</td>
                                    <td className="text-capitalize fw-semibold">{candidate.name || 'N/A'}</td>
                                    <td className="text-capitalize">{candidate.fatherName || 'N/A'}</td>
                                    <td>{candidate.contactNumber || 'N/A'}</td>
                                    <td>{candidate.email || 'N/A'}</td>
                                    <td>{candidate.gender || 'N/A'}</td>
                                    <td>{candidate.dob ? moment(candidate.dob).format('Do MMMM, YYYY') : 'N/A'}</td>
                                    <td>{candidate.course || 'N/A'}</td>
                                    <td>{candidate.year || 'N/A'}</td>
                                    <td>{candidate.session || 'N/A'}</td>
                                    <td>{candidate.createdAt ? moment(candidate.createdAt).format('Do MMMM, YYYY HH:mm') : 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="empty-state-shell">
                              <i className="fas fa-user-xmark"></i>
                              <p>No inactive candidates found</p>
                            </div>
                          )}
                        </div>
                      )}
                      {renderInactivePagination()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {showFilterModal && (
        <div
          className="modal show d-block filter-modal-shell"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15,23,42,0.55)' }}
          onClick={(e) => {
            if (e.target.classList.contains('modal')) {
              setShowFilterModal(false);
            }
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content modern-filter-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header modern-modal-header">
                <div>
                  <h5 className="modal-title">
                    <i className="fas fa-filter me-2"></i>
                    Refine Candidate Results
                  </h5>
                  <p className="modal-subtitle mb-0">Mix course, year, and session filters to narrow the current table instantly.</p>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowFilterModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <MultiSelectCheckbox
                      title="Course"
                      options={courseOptions}
                      selectedValues={filterData.course.values}
                      onChange={(values) => handleCriteriaChange('course', values)}
                      icon="fas fa-graduation-cap"
                      isOpen={dropdownStates.course}
                      onToggle={() => toggleDropdown('course')}
                    />
                  </div>
                  <div className="col-md-4">
                    <MultiSelectCheckbox
                      title="Year"
                      options={yearOptions}
                      selectedValues={filterData.year.values}
                      onChange={(values) => handleCriteriaChange('year', values)}
                      icon="fas fa-calendar-alt"
                      isOpen={dropdownStates.year}
                      onToggle={() => toggleDropdown('year')}
                    />
                  </div>
                  <div className="col-md-4">
                    <MultiSelectCheckbox
                      title="Session/Semester"
                      options={sessionOptions}
                      selectedValues={filterData.session.values}
                      onChange={(values) => handleCriteriaChange('session', values)}
                      icon="fas fa-calendar"
                      isOpen={dropdownStates.session}
                      onToggle={() => toggleDropdown('session')}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer modern-modal-footer">
                <button
                  type="button"
                  className="toolbar-btn toolbar-btn-ghost danger"
                  onClick={() => {
                    setFilterData({
                      course: { type: "includes", values: [] },
                      year: { type: "includes", values: [] },
                      session: { type: "includes", values: [] }
                    });
                    setSearchTerm('');
                    setAppliedSearchTerm('');
                  }}
                >
                  <i className="fas fa-times me-1"></i>
                  Clear All Filters
                </button>
                <button type="button" className="primary-gradient-btn" onClick={() => setShowFilterModal(false)}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MultiSelectCheckbox CSS Styles */}
      <style>
        {`
.upload-candidates-page {
  --upload-primary: #fc2b5a;
  --upload-primary-dark: #a5003a;
  --upload-ink: #172033;
  --upload-muted: #667085;
  --upload-border: #e6eaf2;
  --upload-surface: #ffffff;
  --upload-soft: #f8f9fc;
  --upload-accent-gradient: linear-gradient(135deg, rgb(252, 43, 90) 0%, rgb(165, 0, 58) 100%);
  --upload-hero-gradient: linear-gradient(135deg, rgb(252, 43, 90) 0%, rgb(165, 0, 58) 100%);
  padding-bottom: 24px;
}

.upload-header-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(340px, 0.95fr);
  gap: 18px;
  margin-bottom: 24px;
}

.page-title-card {
  padding: 24px 26px;
  border-radius: 24px;
  background: var(--upload-hero-gradient);
  box-shadow: 0 18px 48px rgba(23, 32, 51, 0.14);
  color: #fff;
}

.upload-hero-copy h1 {
  margin: 10px 0 8px;
  font-size: clamp(1.65rem, 2.2vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #fff;
}

.upload-hero-copy p {
  margin: 0;
  max-width: 620px;
  font-size: 0.9rem;
  line-height: 1.65;
  color: rgba(255,255,255,0.82);
}

.upload-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.18);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.upload-hero-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.upload-hero-metrics.compact .upload-metric-card {
  min-width: 145px;
  padding: 12px 14px;
}

.upload-metric-card {
  min-width: 160px;
  padding: 13px 15px;
  border-radius: 16px;
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.16);
}

.metric-label {
  display: block;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.68);
  margin-bottom: 6px;
}

.upload-metric-card strong {
  font-size: 0.95rem;
  color: #fff;
}

.upload-toolbar-card,
.card-like {
  border-radius: 24px;
  background: #fff;
  border: 1px solid var(--upload-border);
  box-shadow: 0 14px 40px rgba(16, 24, 40, 0.08);
}

.upload-toolbar-card {
  width: 100%;
  padding: 20px;
  color: var(--upload-ink);
}

.toolbar-label,
.section-kicker {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.toolbar-label {
  margin-bottom: 10px;
  color: #667085;
}

.search-shell {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  border: 1px solid var(--upload-border);
  border-radius: 16px;
  padding: 10px 12px;
  background: #f9fafb;
}

.search-shell i {
  color: #98a2b3;
}

.search-shell input {
  flex: 1 1 220px;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--upload-ink);
  font-size: 0.92rem;
}

.toolbar-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.toolbar-btn,
.toolbar-action-pill,
.primary-gradient-btn {
  border: none;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, opacity 0.2s ease;
}

.toolbar-btn:hover,
.toolbar-action-pill:hover,
.primary-gradient-btn:hover {
  transform: translateY(-1px);
}

.toolbar-btn {
  padding: 10px 14px;
  font-size: 0.88rem;
}

.toolbar-btn-primary,
.primary-gradient-btn {
  color: #fff;
  background: var(--upload-accent-gradient);
  box-shadow: 0 12px 26px rgba(23, 32, 51, 0.22);
}

.toolbar-btn-ghost {
  background: #fff;
  color: var(--upload-ink);
  border: 1px solid var(--upload-border);
}

.toolbar-btn-ghost.danger {
  color: #c0364c;
}

.toolbar-action-pill {
  padding: 11px 14px;
  font-size: 0.88rem;
  background: #fff;
  border: 1px solid var(--upload-border);
  color: var(--upload-ink);
}

.toolbar-action-pill.success {
  background: #f3faf8;
  color: #0d7f72;
  border-color: #ccefe7;
}

.toolbar-count {
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--upload-accent-gradient);
  color: #fff;
  font-size: 0.72rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.upload-status-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 16px;
  margin-bottom: 18px;
  font-weight: 600;
}

.upload-status-banner.success {
  background: #ecfdf3;
  color: #027a48;
  border: 1px solid #abefc6;
}

.upload-status-banner.error {
  background: #fef3f2;
  color: #b42318;
  border: 1px solid #fecdca;
}

.upload-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.upload-panel,
.records-panel {
  padding: 18px 20px;
  background: var(--upload-surface);
  border: 1px solid var(--upload-border);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;
}

.section-head.compact {
  margin-bottom: 0;
}

.section-kicker {
  margin-bottom: 8px;
  color: var(--upload-primary);
}

.section-head h3 {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
  color: var(--upload-ink);
  letter-spacing: -0.03em;
}

.section-head p {
  margin: 8px 0 0;
  color: var(--upload-muted);
  line-height: 1.55;
  font-size: 0.88rem;
}

.soft-badge,
.records-summary-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 999px;
  background: #fff5f7;
  border: 1px solid #ffd4de;
  color: var(--upload-primary-dark);
  font-weight: 700;
  white-space: nowrap;
  font-size: 0.78rem;
}

.upload-form-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.upload-panel-head {
  margin-bottom: 12px;
}

.upload-form-row {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) 260px;
  gap: 14px;
  align-items: stretch;
}

.file-drop-shell {
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px dashed #d8dfec;
  background: linear-gradient(180deg, #fffafb 0%, #fff 100%);
}

.file-drop-shell.compact {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 12px 16px;
  align-items: center;
}

.file-drop-shell.compact .stylish-file-input {
  grid-column: 1 / -1;
}

.file-drop-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--upload-accent-gradient);
  color: #fff;
  font-size: 1rem;
  margin-bottom: 0;
  box-shadow: 0 10px 20px rgba(23, 32, 51, 0.14);
}

.file-drop-copy h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--upload-ink);
}

.file-drop-copy p {
  margin: 4px 0 0;
  color: var(--upload-muted);
  line-height: 1.45;
  font-size: 0.82rem;
}

.stylish-file-input {
  width: 100%;
  border: 1px solid var(--upload-border);
  border-radius: 12px;
  padding: 8px 10px;
  background: #fff;
  color: var(--upload-ink);
  font-size: 0.84rem;
  min-height: 50px;
}

.stylish-file-input::file-selector-button {
  margin-right: 14px;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  background: #eef2ff;
  color: #25324b;
  font-weight: 700;
  cursor: pointer;
}

.upload-submit-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.upload-side-actions {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(180deg, #fff7fa 0%, #fff 100%);
  border: 1px solid #ffdbe5;
}

.upload-hints {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--upload-muted);
  font-size: 0.82rem;
}

.upload-hints span {
  display: inline-flex;
  align-items: flex-start;
  gap: 9px;
  line-height: 1.4;
}

.upload-hints i {
  color: var(--upload-primary);
  margin-top: 2px;
}

.primary-gradient-btn {
  padding: 11px 18px;
  min-height: 46px;
}

.upload-submit-btn {
  width: 100%;
  border-radius: 14px;
  font-size: 0.94rem;
}

.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.38);
  border-top-color: #fff;
  border-radius: 50%;
  animation: uploadSpin 0.8s linear infinite;
}

.records-panel-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.tab-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.tab-pill {
  border: 1px solid var(--upload-border);
  background: #f8fafc;
  color: #475467;
  border-radius: 999px;
  padding: 9px 14px;
  font-weight: 600;
  font-size: 0.84rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.tab-pill.active {
  background: var(--upload-accent-gradient);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 12px 24px rgba(23, 32, 51, 0.18);
}

.table-card-shell {
  border: 1px solid var(--upload-border);
  border-radius: 18px;
  background: #fff;
  overflow: hidden;
}

.modern-table-wrap {
  border-top: 1px solid #f1f5f9;
}

.modern-data-table thead th {
  background: #f8fafc;
  color: #475467;
  border-bottom: 1px solid #e9eef5;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  padding-top: 14px;
  padding-bottom: 14px;
}

.modern-data-table tbody td {
  border-color: #eef2f7;
  color: #344054;
  vertical-align: middle;
  font-size: 0.88rem;
  padding-top: 13px;
  padding-bottom: 13px;
}

.modern-data-table tbody tr:hover {
  background: #fff7f9;
}

.table-loading-shell,
.empty-state-shell {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--upload-muted);
}

.empty-state-shell i {
  font-size: 1.75rem;
  color: var(--upload-primary);
  margin-bottom: 12px;
}

.empty-state-shell p {
  margin: 0;
  font-weight: 600;
}

.pagination .page-link {
  border: 1px solid var(--upload-border);
  color: #475467;
  border-radius: 10px !important;
  margin-left: 6px;
  min-width: 38px;
  text-align: center;
}

.pagination .page-item.active .page-link {
  background: var(--upload-accent-gradient);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 10px 20px rgba(23, 32, 51, 0.18);
}

.modern-filter-modal {
  border: none;
  border-radius: 24px;
  overflow: visible;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.28);
}

.modern-modal-header,
.modern-modal-footer {
  border: none;
  padding: 22px 24px;
}

.modern-modal-header {
  background: linear-gradient(135deg, #fff5f7 0%, #fff 100%);
}

.modal-title {
  color: var(--upload-ink);
  font-weight: 800;
}

.modal-subtitle {
  color: var(--upload-muted);
  font-size: 0.92rem;
  margin-top: 6px;
}

.modern-modal-footer {
  justify-content: space-between;
  gap: 12px;
}

@keyframes uploadSpin {
  to {
    transform: rotate(360deg);
  }
}

.multi-select-container-new {
  position: relative;
  width: 100%;
}

.multi-select-dropdown-new {
  position: relative;
  width: 100%;
}

.multi-select-trigger {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  background: #fff !important;
  border: 1px solid #dde3ee !important;
  border-radius: 14px !important;
  padding: 0.75rem 0.9rem !important;
  font-size: 0.875rem !important;
  min-height: 48px !important;
  transition: all 0.2s ease !important;
  cursor: pointer !important;
  width: 100% !important;
}

.multi-select-trigger:hover {
  border-color: rgba(252, 43, 90, 0.35) !important;
  box-shadow: 0 0 0 4px rgba(252, 43, 90, 0.08) !important;
}

.multi-select-trigger.open {
  border-color: rgba(252, 43, 90, 0.42) !important;
  box-shadow: 0 0 0 4px rgba(252, 43, 90, 0.12) !important;
}

.select-display-text {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #495057;
  font-weight: normal;
}

.dropdown-arrow {
  color: #6c757d;
  font-size: 0.75rem;
  transition: transform 0.2s ease;
  margin-left: 0.5rem;
  flex-shrink: 0;
}

.multi-select-trigger.open .dropdown-arrow {
  transform: rotate(180deg);
}

.multi-select-options-new {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #dde3ee;
  border-top: none;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 18px 30px rgba(15, 23, 42, 0.12);
  max-height: 320px;
  overflow: hidden;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.options-header {
  padding: 0.75rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.select-all-btn,
.clear-all-btn {
  font-size: 0.75rem !important;
  padding: 0.25rem 0.5rem !important;
  border-radius: 0.25rem !important;
  border: 1px solid !important;
}

.select-all-btn {
  border-color: #0d6efd !important;
  color: #0d6efd !important;
}

.clear-all-btn {
  border-color: #6c757d !important;
  color: #6c757d !important;
}

.select-all-btn:hover {
  background-color: #0d6efd !important;
  color: white !important;
}

.clear-all-btn:hover {
  background-color: #6c757d !important;
  color: white !important;
}

.options-search {
  padding: 0.75rem;
  border-bottom: 1px solid #eef2f7;
}

.options-list-new {
  max-height: 180px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.options-list-new::-webkit-scrollbar {
  width: 6px;
}

.options-list-new::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.options-list-new::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.options-list-new::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.option-item-new {
  display: flex !important;
  align-items: center;
  padding: 0.5rem 0.75rem;
  margin: 0;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-bottom: 1px solid #f8f9fa;
}

.option-item-new:last-child {
  border-bottom: none;
}

.option-item-new:hover {
  background-color: #fff7f9;
}

.option-item-new input[type="checkbox"] {
  margin: 0 0.5rem 0 0 !important;
  cursor: pointer;
  accent-color: #fc2b5a;
}

.option-label-new {
  flex: 1;
  font-size: 0.875rem;
  color: #495057;
  cursor: pointer;
}

.options-footer {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid #eef2f7;
  background: #fafbfc;
  text-align: center;
}

.no-options {
  padding: 1rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

.multi-select-container-new.dropdown-open::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.multi-select-trigger:focus {
  outline: none;
  border-color: rgba(252, 43, 90, 0.42);
  box-shadow: 0 0 0 4px rgba(252, 43, 90, 0.12);
}

.option-item-new input[type="checkbox"]:focus {
  outline: 2px solid rgba(252, 43, 90, 0.35);
  outline-offset: 2px;
}

.option-item-new input[type="checkbox"]:checked + .option-label-new {
  font-weight: 500;
  color: #fc2b5a;
}

.badge.bg-primary {
  background-color: #fc2b5a !important;
  font-size: 0.75rem;
  padding: 0.25em 0.4em;
}

.multi-select-options-new {
  transform-origin: top;
  animation: dropdownOpen 0.15s ease-out;
}

@keyframes dropdownOpen {
  0% {
    opacity: 0;
    transform: scaleY(0.8);
  }
  100% {
    opacity: 1;
    transform: scaleY(1);
  }
}

.multi-select-trigger {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.multi-select-trigger:active {
  transform: translateY(1px);
}

.multi-select-loading {
  pointer-events: none;
  opacity: 0.6;
}

.multi-select-loading .dropdown-arrow {
  animation: spin 1s linear infinite;
}

@media (max-width: 768px) {
  .upload-header-shell {
    grid-template-columns: 1fr;
  }

  .page-title-card {
    padding: 20px;
    border-radius: 20px;
  }

  .upload-panel,
  .records-panel {
    padding: 18px;
  }

  .records-panel-top,
  .section-head,
  .upload-submit-row,
  .modern-modal-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .tab-pill-row,
  .toolbar-actions-row {
    flex-direction: column;
  }

  .tab-pill,
  .toolbar-action-pill,
  .primary-gradient-btn,
  .toolbar-btn {
    width: 100%;
  }

  .upload-form-row {
    grid-template-columns: 1fr;
  }

  .file-drop-shell.compact {
    grid-template-columns: 1fr;
  }

  .search-shell {
    align-items: stretch;
  }

  .multi-select-options-new {
    max-height: 250px;
  }
  
  .options-header {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .select-all-btn,
  .clear-all-btn {
    width: 100%;
  }
  
  .options-list-new {
    max-height: 150px;
  }
}
        `}
      </style>
      
    </>
  );
};

export default UploadCandidates;
