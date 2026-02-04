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

  return (
    <>

        <div className="content-header row">
          <div className="col-12 mb-2">
            <div className="row breadcrumbs-top justify-content-between align-items-center flex-wrap" style={{ flexWrap: 'nowrap' }}>
              <div className="col-12 col-sm-auto text-center text-sm-left">
                <h4 className="content-header-title mb-0 mx-3 text-upload">Upload Candidates</h4>
              </div>
              <div className="col-12 col-sm-auto text-center">
                <div className="d-flex gap-2 align-items-center" style={{ flexWrap: 'nowrap' }}>
                  <div className="input-group" style={{ minWidth: '250px', flex: '1 1 auto' }}>
                    <span className="input-group-text bg-light border-end-0">
                      <i className="fas fa-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search by name, email, or contact number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                      style={{ 
                        outline: 'none',
                        boxShadow: 'none',
                        borderColor: '#dee2e6'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#dee2e6'}
                      onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    />
                    <button
                      className="btn btn-primary border-start-0"
                      type="button"
                      onClick={handleSearch}
                      style={{ borderColor: '#0d6efd' }}
                    >
                      <i className="fas fa-search"></i>
                    </button>
                    {(searchTerm || appliedSearchTerm) && (
                      <button
                        className="btn btn-outline-secondary border-start-0"
                        type="button"
                        onClick={handleClearSearch}
                        style={{ borderColor: '#dee2e6' }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                  <button
                    className="btn btn-outline-primary d-flex align-items-center"
                    onClick={() => setShowFilterModal(true)}
                    style={{ 
                      whiteSpace: 'nowrap',
                      borderColor: '#0d6efd',
                      outline: 'none',
                      flexShrink: 0
                    }}
                    onFocus={(e) => e.target.style.outline = 'none'}
                  >
                    <i className="fas fa-filter me-2"></i>
                    {(filterData.course.values.length > 0 || 
                      filterData.year.values.length > 0 || 
                      filterData.session.values.length > 0) && (
                      <span className="badge bg-primary ms-2 rounded-pill">
                        {filterData.course.values.length + 
                         filterData.year.values.length + 
                         filterData.session.values.length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={downloadSample} 
                    className="btn btn-success lovepreet"
                    style={{ whiteSpace: 'nowrap', outline: 'none', flexShrink: 0 }}
                    onFocus={(e) => e.target.style.outline = 'none'}
                  >
                    Download Sample
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading && <div id="preloader">Loading...</div>}
        
        <div className="content-body">
          {message && (
            <div className={`alert ${message.includes('successfully') || message.includes('inserted') ? 'alert-success' : 'alert-danger'}`} role="alert">
              {message}
            </div>
          )}
          
          <section>
            <div className="container">
              <div className="row">
                <div className="custom-bulk-align card mb-0">
                  <div className="content-header row d-xl-block d-lg-block d-md-block d-sm-block d-block">
                    <div className="col-12 rounded equal-height-2 coloumn-2">
                      <div className="content-header-left col-md-12 col-12">
                        <div className="row breadcrumbs-top p-1">
                          <div className="col-12">
                            <form onSubmit={handleSubmit} id="candidateUpload" encType="multipart/form-data">
                              <input 
                                style={{ display: 'block' }} 
                                type="file" 
                                id="myFile" 
                                name="filename"
                                onChange={handleFileChange}
                              />
                              <div className="custom-bulkupload-btn-block" style={{ display: 'block' }}>
                                <button 
                                  type="submit" 
                                  className="btn btn-success my-1 mt-2"
                                  id="submitBtn"
                                  disabled={loading}
                                >
                                  Submit
                                </button>
                              </div>
                            </form>
                          </div>
                          
                                                  {/* Tabs */}
                          <div className="col-12 mb-3">
                            <ul className="nav nav-tabs" role="tablist">
                              <li className="nav-item">
                                <button
                                  className={`nav-link ${activeTab === 'imports' ? 'active' : ''}`}
                                  onClick={() => setActiveTab('imports')}
                                  type="button"
                                >
                                  Import History
                                </button>
                              </li>
                              <li className="nav-item">
                                <button
                                  className={`nav-link ${activeTab === 'candidates' ? 'active' : ''}`}
                                  onClick={() => setActiveTab('candidates')}
                                  type="button"
                                >
                                  Uploaded Candidates
                                </button>
                              </li>
                              <li className="nav-item">
                                <button
                                  className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
                                  onClick={() => setActiveTab('active')}
                                  type="button"
                                >
                                  Active Candidate
                                </button>
                              </li>
                              <li className="nav-item">
                                <button
                                  className={`nav-link ${activeTab === 'inactive' ? 'active' : ''}`}
                                  onClick={() => setActiveTab('inactive')}
                                  type="button"
                                >
                                  Inactive Candidate
                                </button>
                              </li>
                            </ul>
                          </div>
                          
                          {/* Tab Content */}
                          <div className="col-12">
                            {activeTab === 'imports' ? (
                              <div className="card-content">
                                <div className="table-responsive">
                                  {imports && imports.length > 0 ? (
                                    <table className="table table-hover-animation mb-0">
                                      <thead>
                                        <tr>
                                          <th>FILE NAME</th>
                                          <th>MESSAGE</th>
                                          <th>STATUS</th>
                                          <th>RECORDS INSERTED</th>
                                          <th>UPLOAD DATE</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {imports.map((item, index) => (
                                          <tr key={item._id}>
                                            <td className="text-capitalize">{item.name}</td>
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
                                    <p className="text-center mt-3">No import history found</p>
                                  )}
                                </div>
                                {renderPagination()}
                              </div>
                            ) : activeTab === 'candidates' ? (
                              <div className="card-content">
                                {candidatesLoading ? (
                                  <div className="text-center mt-3">
                                    <div className="spinner-border" role="status">
                                      <span className="sr-only">Loading...</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="table-responsive">
                                    {uploadedCandidates && uploadedCandidates.length > 0 ? (
                                      <table className="table table-hover-animation mb-0">
                                        <thead>
                                          <tr>
                                            <th>Sr. No.</th>
                                            <th>Candidate Name</th>
                                            <th>Father Name</th>
                                            <th>Course</th>
                                            <th>Year (1st/2nd/3rd/4th)</th>
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
                                              <td className="text-capitalize">{candidate.name || 'N/A'}</td>
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
                                      <p className="text-center mt-3">No uploaded candidates found</p>
                                    )}
                                  </div>
                                )}
                                {renderCandidatesPagination()}
                              </div>
                            ) : activeTab === 'active' ? (
                              <div className="card-content">
                                {activeLoading ? (
                                  <div className="text-center mt-3">
                                    <div className="spinner-border" role="status">
                                      <span className="sr-only">Loading...</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="table-responsive">
                                    {activeCandidates && activeCandidates.length > 0 ? (
                                      <table className="table table-hover-animation mb-0">
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
                                            <th>Year (1st/2nd/3rd/4th)</th>
                                            <th>Session/Semester</th>
                                            <th>Upload Date</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {activeCandidates.map((candidate, index) => (
                                            <tr key={candidate._id}>
                                              <td>{(activePage - 1) * 50 + index + 1}</td>
                                              <td className="text-capitalize">{candidate.name || 'N/A'}</td>
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
                                      <p className="text-center mt-3">No active candidates found</p>
                                    )}
                                  </div>
                                )}
                                {renderActivePagination()}
                              </div>
                            ) : (
                              <div className="card-content">
                                {inactiveLoading ? (
                                  <div className="text-center mt-3">
                                    <div className="spinner-border" role="status">
                                      <span className="sr-only">Loading...</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="table-responsive">
                                    {inactiveCandidates && inactiveCandidates.length > 0 ? (
                                      <table className="table table-hover-animation mb-0">
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
                                            <th>Year (1st/2nd/3rd/4th)</th>
                                            <th>Session/Semester</th>
                                            <th>Upload Date</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {inactiveCandidates.map((candidate, index) => (
                                            <tr key={candidate._id}>
                                              <td>{(inactivePage - 1) * 50 + index + 1}</td>
                                              <td className="text-capitalize">{candidate.name || 'N/A'}</td>
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
                                      <p className="text-center mt-3">No inactive candidates found</p>
                                    )}
                                  </div>
                                )}
                                {renderInactivePagination()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Filter Modal */}
        {showFilterModal && (
          <div 
            className="modal show d-block" 
            tabIndex="-1" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => {
              // Close modal when clicking on backdrop
              if (e.target.classList.contains('modal')) {
                setShowFilterModal(false);
              }
            }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div 
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-filter me-2"></i>
                    Filters
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowFilterModal(false)}
                  ></button>
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
                    {/* <div className="col-md-4">
                      <MultiSelectCheckbox
                        title="Status"
                        options={statusOptions}
                        selectedValues={filterData.status.values}
                        onChange={(values) => handleCriteriaChange('status', values)}
                        icon="fas fa-check-circle"
                        isOpen={dropdownStates.status}
                        onToggle={() => toggleDropdown('status')}
                      />
                    </div>*/}
                  </div> 
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-danger"
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
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowFilterModal(false)}
                  >
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
  background: white !important;
  border: 1px solid #ced4da !important;
  border-radius: 0.375rem !important;
  padding: 0.375rem 0.75rem !important;
  font-size: 0.875rem !important;
  min-height: 38px !important;
  transition: all 0.2s ease !important;
  cursor: pointer !important;
  width: 100% !important;
}

.multi-select-trigger:hover {
  border-color: #86b7fe !important;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15) !important;
}

.multi-select-trigger.open {
  border-color: #86b7fe !important;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
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
  border: 1px solid #ced4da;
  border-top: none;
  border-radius: 0 0 0.375rem 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
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
  padding: 0.5rem;
  border-bottom: 1px solid #e9ecef;
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
  background-color: #f8f9fa;
}

.option-item-new input[type="checkbox"] {
  margin: 0 0.5rem 0 0 !important;
  cursor: pointer;
  accent-color: #0d6efd;
}

.option-label-new {
  flex: 1;
  font-size: 0.875rem;
  color: #495057;
  cursor: pointer;
}

.options-footer {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
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
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.option-item-new input[type="checkbox"]:focus {
  outline: 2px solid #86b7fe;
  outline-offset: 2px;
}

.option-item-new input[type="checkbox"]:checked + .option-label-new {
  font-weight: 500;
  color: #0d6efd;
}

.badge.bg-primary {
  background-color: #0d6efd !important;
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