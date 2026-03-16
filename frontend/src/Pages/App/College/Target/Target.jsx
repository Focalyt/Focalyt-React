import React,  { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import DatePicker from 'react-date-picker';
import { io } from 'socket.io-client';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios'


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
            {/* Search functionality (optional) */}
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
const useNavHeight = (dependencies = []) => {
  const navRef = useRef(null);
  const [navHeight, setNavHeight] = useState(140); // Default fallback
  const widthRef = useRef(null);
  const [width, setWidth] = useState(0);

  const calculateHeight = useCallback(() => {
    if (navRef.current) {
      const height = navRef.current.offsetHeight;
      setNavHeight(height);

    }
  }, []);

  const calculateWidth = useCallback(() => {

    if (widthRef.current) {
      const width = widthRef.current.offsetWidth;
      setWidth(width);

    }
  }, []);


  useEffect(() => {
    // Initial calculation
    calculateHeight();
    calculateWidth();
    // Resize listener
    const handleResize = () => {
      setTimeout(calculateHeight, 100);
      setTimeout(calculateWidth, 100);
    };

    // Mutation observer for nav content changes
    const observer = new MutationObserver(() => {
      setTimeout(calculateHeight, 50);
      setTimeout(calculateWidth, 50);
    });

    window.addEventListener('resize', handleResize);

    if (navRef.current) {
      observer.observe(navRef.current, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [calculateHeight, calculateWidth]);

  // Recalculate when dependencies change
  useEffect(() => {
    setTimeout(calculateHeight, 50);
    setTimeout(calculateWidth, 50);
  }, dependencies);

  return { navRef, navHeight, calculateHeight, width };
};
const useMainWidth = (dependencies = []) => {// Default fallback
  const widthRef = useRef(null);
  const [width, setWidth] = useState(0);

  const calculateWidth = useCallback(() => {

    if (widthRef.current) {
      const width = widthRef.current.offsetWidth;
      setWidth(width);
    }
  }, []);


  useEffect(() => {
    calculateWidth();
    // Resize listener
    const handleResize = () => {
      setTimeout(calculateWidth, 100);
    };

    // Mutation observer for nav content changes
    const observer = new MutationObserver(() => {
      setTimeout(calculateWidth, 50);
    });

    window.addEventListener('resize', handleResize);

    if (widthRef.current) {
      observer.observe(widthRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [calculateWidth]);

  // Recalculate when dependencies change
  useEffect(() => {
    setTimeout(calculateWidth, 100);
  }, dependencies);

  return { widthRef, width };
};
const useScrollBlur = (navbarHeight = 140) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;
      const shouldBlur = currentScrollY > navbarHeight / 3;

      setIsScrolled(shouldBlur);
      setScrollY(currentScrollY);
    };

    // Throttle scroll event for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [navbarHeight]);

  return { isScrolled, scrollY, contentRef };
};


function Target() {

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  const { navRef, navHeight } = useNavHeight([isFilterCollapsed]);
  const { isScrolled, scrollY, contentRef } = useScrollBlur(navHeight);
  const blurIntensity = Math.min(scrollY / 10, 15);
  const navbarOpacity = Math.min(0.85 + scrollY / 1000, 0.98);
  const { widthRef, width } = useMainWidth([isFilterCollapsed]);

  // const totalSelected = Object.values(formData).reduce((total, filter) => total + (filter.values.length || 0), 0);
 
  const [permissions, setPermissions] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const fetchFilterOptions = async () => {
       try {
 
         const res = await axios.get(`${backendUrl}/college/filters-data`, {
           headers: { 'x-auth': token }
         });
         if (res.data.status) {
           setVerticalOptions(res.data.verticals.map(v => ({ value: v._id, label: v.name })));
           setProjectOptions(res.data.projects.map(p => ({ value: p._id, label: p.name })));
           setCourseOptions(res.data.courses.map(c => ({ value: c._id, label: c.name })));
           // setCenterOptions(res.data.centers.map(c => ({ value: c._id, label: c.name })));
           // Fetch ALL centers (not just from AppliedCourses) to show aligned centers
           try {
             const centersRes = await axios.get(`${backendUrl}/college/list_all_centers`, {
               headers: { 'x-auth': token }
             });
             if (centersRes.data.success && centersRes.data.data) {
               const allCentersMapped = centersRes.data.data.map(c => ({ 
                 value: c._id, 
                 label: c.name 
               }));
               // console.log('🏢 ALL CENTERS DEBUG - All centers from list_all_centers:', allCentersMapped);
               setCenterOptions(allCentersMapped);
             } else {
               // Fallback to centers from filters-data if list_all_centers fails
               const centersMapped = res.data.centers.map(c => ({ value: c._id, label: c.name }));
               // console.log('🏢 CENTERS DEBUG - Mapped centers for filter (fallback):', centersMapped);
               setCenterOptions(centersMapped);
             }
           } catch (centerErr) {
             console.error('Failed to fetch all centers, using filters-data centers:', centerErr);
             // Fallback to centers from filters-data
             const centersMapped = res.data.centers.map(c => ({ value: c._id, label: c.name }));
             setCenterOptions(centersMapped);
           }
           
           setCounselorOptions(res.data.counselors.map(c => ({ value: c._id, label: c.name })));
         }
       } catch (err) {
         console.error('Failed to fetch filter options:', err);
       }
     };
     fetchFilterOptions();
   }, []);
 
  useEffect(() => {
    updatedPermission()
  }, [])

  const updatedPermission = async () => {

    const respose = await axios.get(`${backendUrl}/college/permission`, {
      headers: { 'x-auth': token }
    });
    if (respose.data.status) {

      setPermissions(respose.data.permissions);
    }
  }


  const initialActivities = [];
  const [activities, setActivities] = useState(initialActivities);
  const [filteredActivities, setFilteredActivities] = useState(initialActivities);

  // Multi-select / advanced filters state
  const [formData, setFormData] = useState({
    projects: {
      type: "includes",
      values: []
    },
    verticals: {
      type: "includes",
      values: []
    },
    course: {
      type: "includes",
      values: []
    },
    center: {
      type: "includes",
      values: []
    },
    counselor: {
      type: "includes",
      values: []
    },
    sector: {
      type: "includes",
      values: []
    },
  });

  const totalSelected = Object.values(formData).reduce((total, filter) => total + (filter.values.length || 0), 0);
  const [crmFilters, setCrmFilters] = useState([
    { _id: '', name: '', count: 0, milestone: '' },

  ]);
    const [statuses, setStatuses] = useState([
      { _id: '', name: '', count: 0 },
  
    ]);
  const [subStatuses, setSubStatuses] = useState([]);
  const [verticalOptions, setVerticalOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [centerOptions, setCenterOptions] = useState([]);
  const [counselorOptions, setCounselorOptions] = useState([]);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [dropdownStates, setDropdownStates] = useState({
    projects: false,
    verticals: false,
    course: false,
    center: false,
    counselor: false,
    sector: false,
    statuses: false,
    subStatuses: false
  });

  // Filters :-
  const [filterData, setFilterData] = useState({
    name: '',
    courseType: '',
    status: 'true',
    leadStatus: '',
    sector: '',
    // Date filter states
    createdFromDate: null,
    createdToDate: null,
    modifiedFromDate: null,
    modifiedToDate: null,
    nextActionFromDate: null,
    nextActionToDate: null,
    subStatuses: null,
    statuses: null,
  });
 const [seletectedStatus, setSelectedStatus] = useState('');
  const activeFilterCount = Object.values(filterData).filter(val => val && val !== 'true').length + totalSelected;

  const [isLoading, setIsLoading] = useState(false);
  const [pageSize, setPageSize] = useState(0);

  const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return '';
    return date.toLocaleDateString('en-GB');
  };

  const fetchTargetData = async (filters = filterData, form = formData, page = currentPage) => {
    if (!token) return;

    setIsLoading(true);

    const formatDateForAPI = (date, isEndDate = false) => {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) return null;
      const d = new Date(date);
      if (isEndDate) {
        d.setHours(23, 59, 59, 999);
      } else {
        d.setHours(0, 0, 0, 0);
      }
      return d.toISOString();
    };

    const nextActionFromDateFormatted = filters.nextActionFromDate ? formatDateForAPI(filters.nextActionFromDate, false) : null;
    const nextActionToDateFormatted = filters.nextActionToDate ? formatDateForAPI(filters.nextActionToDate, true) : null;

    const statusParam = filters.statuses || (filters.status && filters.status !== 'true' ? filters.status : null);

    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...(filters.name && { name: filters.name }),
      ...(filters.courseType && { courseType: filters.courseType }),
      ...(statusParam && { status: statusParam }),
      ...(filters.leadStatus && { leadStatus: filters.leadStatus }),
      ...(filters.sector && { sector: filters.sector }),
      ...(filters.createdFromDate && { createdFromDate: filters.createdFromDate.toISOString() }),
      ...(filters.createdToDate && { createdToDate: filters.createdToDate.toISOString() }),
      ...(filters.modifiedFromDate && { modifiedFromDate: filters.modifiedFromDate.toISOString() }),
      ...(filters.modifiedToDate && { modifiedToDate: filters.modifiedToDate.toISOString() }),
      ...(nextActionFromDateFormatted && { nextActionFromDate: nextActionFromDateFormatted }),
      ...(nextActionToDateFormatted && { nextActionToDate: nextActionToDateFormatted }),
      ...(filters.subStatuses && { subStatuses: filters.subStatuses }),
      // Multi-select filters
      ...(form.projects.values.length > 0 && { projects: JSON.stringify(form.projects.values) }),
      ...(form.verticals.values.length > 0 && { verticals: JSON.stringify(form.verticals.values) }),
      ...(form.course.values.length > 0 && { course: JSON.stringify(form.course.values) }),
      ...(form.center.values.length > 0 && { center: JSON.stringify(form.center.values) }),
      ...(form.counselor.values.length > 0 && { counselor: JSON.stringify(form.counselor.values) })
    });

    try {
      const response = await axios.get(`${backendUrl}/college/appliedCandidates?${queryParams}`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success && response.data.data) {
        const data = response.data;
        setActivities(data.data);
        setFilteredActivities(data.data);
        setTotalPages(data.totalPages || 1);
        setPageSize(data.limit || 0);
      }
    } catch (error) {
      console.error('Error fetching target data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (filters = filterData, form = formData) => {
    setCurrentPage(1);
    fetchTargetData(filters, form, 1);
  };

  useEffect(() => {
    // Load initial data on mount
    fetchTargetData(filterData, formData, currentPage);
  }, []);
  useEffect(() => {
    fetchStatus()

  }, []);

  useEffect(() => {
    if (seletectedStatus || filterData.statuses) {
      fetchSubStatus()
    }
  }, [seletectedStatus, filterData.statuses]);
  const clearAllFilters = () => {
    const clearedFilters = {
      name: '',
      courseType: '',
      status: 'true',
      leadStatus: '',
      sector: '',
      createdFromDate: null,
      createdToDate: null,
      modifiedFromDate: null,
      modifiedToDate: null,
      nextActionFromDate: null,
      nextActionToDate: null,
      subStatuses: null,
      statuses: null,
    };

    const clearedForm = {
      projects: { type: 'includes', values: [] },
      verticals: { type: 'includes', values: [] },
      course: { type: 'includes', values: [] },
      center: { type: 'includes', values: [] },
      counselor: { type: 'includes', values: [] },
      sector: { type: 'includes', values: [] }
    };

    setFilterData(clearedFilters);
    setFormData(clearedForm);
    setCurrentPage(1);
    fetchTargetData(clearedFilters, clearedForm, 1);
  };

  const handleFilterChange = (e) => {
    try {
      const { name, value } = e.target;
      const newFilterData = { ...filterData, [name]: value };
      setFilterData(newFilterData);
    } catch (error) {
      console.error('Filter change error:', error);
    }
  };

  const handleCriteriaChange = (criteria, values) => {
    setFormData((prev) => ({
      ...prev,
      [criteria]: {
        ...prev[criteria],
        values
      }
    }));
  };

  const toggleDropdown = (filterName) => {
    setDropdownStates((prev) => {
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = key === filterName ? !prev[key] : false;
        return acc;
      }, {});
      return newState;
    });
  };

  const handleDateFilterChange = (date, fieldName) => {
    const newFilterData = {
      ...filterData,
      [fieldName]: date
    };
    setFilterData(newFilterData);
  };
  const clearDateFilter = (filterType) => {
    let newFilterData = { ...filterData };

    if (filterType === 'created') {
      newFilterData.createdFromDate = null;
      newFilterData.createdToDate = null;
    } else if (filterType === 'modified') {
      newFilterData.modifiedFromDate = null;
      newFilterData.modifiedToDate = null;
    } else if (filterType === 'nextAction') {
      newFilterData.nextActionFromDate = null;
      newFilterData.nextActionToDate = null;
    }

    setFilterData(newFilterData);

  }
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${backendUrl}/college/status`, {
          headers: { 'x-auth': token }
        });
  
  
        if (response.data.success) {
          const status = response.data.data;
          const allFilter = { _id: 'all', name: 'All' };
  
  
          setCrmFilters([allFilter, ...status.map(r => ({
            _id: r._id,
            name: r.title,
            milestone: r.milestone,  // agar backend me count nahi hai to 0
          }))]);
  
          setStatuses(status.map(r => ({
            _id: r._id,
            name: r.title,
            count: r.count || 0,  // agar backend me count nahi hai to 0
          })));
  
  
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        alert('Failed to fetch Status');
      }
    };
      const fetchSubStatus = async () => {
        try {
          const status = seletectedStatus || filterData.statuses;
    
          if (!status) {
            alert('Please select a status');
            return;
          }
          const response = await axios.get(`${backendUrl}/college/status/${status}/substatus`, {
            headers: { 'x-auth': token }
          });
    
    
          if (response.data.success) {
            const status = response.data.data;
    
    
            setSubStatuses(response.data.data);
    
    
          }
        } catch (error) {
          console.error('Error fetching roles:', error);
          alert('Failed to fetch SubStatus');
        }
      };
  return (
    <>
     <style>
          {
      `
    :root {
      --bg: #f8f9fa;
      --surface: #ffffff;
      --surface2: rgba(217,217,217,0.3);
      --surface3: #eaeaea;
      --border: #9e9e9e;
      --border-light: #eaeaea;
      --accent: #FC2B5A;
      --accent2: #667eea;
      --accent3: #28a745;
      --warn: #fd7e14;
      --danger: #FC2B5A;
      --text: #252222;
      --muted: #666666;
      --gold: #f5c518;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Roboto', 'Open Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      font-size: 0.875rem;
    }
    h1,h2,h3,h4,h5,h6 { font-family: 'Roboto', sans-serif; }

    .avatar-sm { width:32px;height:32px;border-radius:50%;object-fit:cover; }
    .avatar-md { width:40px;height:40px;border-radius:50%;object-fit:cover; }

    /* ─── Main ─── */
    .topbar {
      background: var(--surface);
      border-bottom: 1px solid var(--border-light);
      padding: 0.75rem 1.75rem;
      display:flex; align-items:center; gap:1rem;
      position:sticky; top:0; z-index:10;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
    }
    .topbar .page-title { font-family:'Roboto',sans-serif; font-size:1.1rem; font-weight:700; color:var(--text); }
   

    /* ─── Filters ─── */
    .filters-bar {
      background: var(--surface);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display:flex; flex-wrap:wrap; gap:.75rem; align-items:center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .form-select-dark {
      background: #fff;
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 8px;
      font-size:0.8rem;
      padding: .35rem .8rem;
    }
    .form-select-dark:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(252,43,90,.12); outline:none; }

    /* ─── KPI Cards ─── */
    .kpi-card {
      background: var(--surface);
      border: 1px solid var(--border-light);
      border-radius: 14px;
      padding: 1.2rem 1.4rem;
      position:relative; overflow:hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      transition: box-shadow .2s, transform .2s;
    }
    .kpi-card:hover { box-shadow: 0 4px 16px rgba(252,43,90,.1); transform:translateY(-2px); }
    .kpi-card::before {
      content:'';
      position:absolute; top:-40px; right:-30px;
      width:110px;height:110px;
      background: radial-gradient(circle, rgba(252,43,90,.08) 0%, transparent 70%);
      border-radius:50%;
    }
    .kpi-card .kpi-icon {
      width:38px;height:38px;border-radius:10px;
      display:flex;align-items:center;justify-content:center;
      font-size:1.1rem; margin-bottom:.75rem;
    }
    .kpi-card .kpi-value { font-family:'Roboto',sans-serif; font-size:1.7rem; font-weight:700; line-height:1; color:var(--text); }
    .kpi-card .kpi-label { color:var(--muted); font-size:0.75rem; margin-top:.25rem; }
    .kpi-card .kpi-change { font-size:0.72rem; margin-top:.5rem; }
    .kpi-card .kpi-change.up { color:var(--accent3); }
    .kpi-card .kpi-change.dn { color:var(--danger); }

    /* ─── Section Headers ─── */
    .sec-header { font-family:'Roboto',sans-serif; font-size:1rem; font-weight:700; margin-bottom:1rem; display:flex;align-items:center;gap:.5rem; color:var(--text); }
    .sec-header .badge-tag { background:var(--surface2); color:var(--muted); font-size:0.65rem; padding:2px 8px; border-radius:20px; font-weight:500; border:1px solid var(--border-light); }

    /* ─── Progress ─── */
    .prog-bar-wrap { height:6px; background:var(--surface3); border-radius:20px; overflow:hidden; }
    .prog-bar-fill { height:100%; border-radius:20px; transition:width .4s; }
    .prog-green { background: linear-gradient(90deg, #28a745, #20c997); }
    .prog-blue  { background: linear-gradient(90deg, var(--accent2), #764ba2); }
    .prog-warn  { background: linear-gradient(90deg, var(--warn), #ffc107); }
    .prog-danger{ background: linear-gradient(90deg, var(--accent), #e0234e); }

    /* ─── Activity Table ─── */
    .activity-table-wrap {
      background: var(--surface);
      border: 1px solid var(--border-light);
      border-radius: 14px;
      overflow:hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .activity-table-wrap table { margin:0; }
    .activity-table-wrap thead th {
      background: rgba(217,217,217,0.3);
      color: var(--muted);
      font-size:.7rem;
      letter-spacing:.8px;
      text-transform:uppercase;
      font-weight:600;
      border-color: var(--border-light);
      padding:.75rem 1rem;
    }
    .activity-table-wrap tbody td {
      border-color: var(--border-light);
      padding:.7rem 1rem;
      vertical-align:middle;
      color: var(--text);
      font-size:.82rem;
    }
    .activity-table-wrap tbody tr { transition:background .15s; }
    .activity-table-wrap tbody tr:hover { background: rgba(217,217,217,0.2); }

    /* ─── Counselor Cards ─── */
    .counselor-card {
      background: var(--surface);
      border:1px solid var(--border-light);
      border-radius:14px;
      padding:1.2rem;
      transition:border-color .2s,transform .2s, box-shadow .2s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .counselor-card:hover { border-color: rgba(252,43,90,.4); transform:translateY(-2px); box-shadow: 0 4px 16px rgba(252,43,90,.1); }
    .counselor-card .rank-badge {
      width:22px;height:22px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:.65rem;font-weight:800;font-family:'Roboto',sans-serif;
    }
    .rank-1 { background:var(--gold); color:#000; }
    .rank-2 { background:#c0c0c0; color:#000; }
    .rank-3 { background:#cd7f32; color:#fff; }
    .rank-n { background:var(--surface3); color:var(--muted); }
    .status-dot { width:8px;height:8px;border-radius:50%;display:inline-block; }
    .dot-green { background:var(--accent3); }
    .dot-warn  { background:var(--warn); }
    .dot-danger{ background:var(--danger); }

    /* ─── Leaderboard ─── */
    .leader-row {
      display:flex;align-items:center;gap:.85rem;
      padding:.6rem .9rem;
      border-radius:10px;
      transition:background .15s;
    }
    .leader-row:hover { background:rgba(217,217,217,0.3); }
    .leader-score { font-family:'Roboto',sans-serif; font-weight:700; font-size:1rem; min-width:38px; text-align:right; color:var(--text); }

    /* ─── Alert Pills ─── */
    .alert-pill {
      display:flex;align-items:center;gap:.7rem;
      padding:.6rem 1rem;
      border-radius:10px;
      font-size:.8rem;
      margin-bottom:.5rem;
      color: var(--text);
    }
    .alert-pill.danger { background:rgba(252,43,90,.07); border:1px solid rgba(252,43,90,.25); }
    .alert-pill.warn   { background:rgba(253,126,20,.07); border:1px solid rgba(253,126,20,.25); }
    .alert-pill.info   { background:rgba(102,126,234,.07); border:1px solid rgba(102,126,234,.25); }

    /* ─── Timeline ─── */
    .timeline-item { display:flex;gap:.75rem;padding:.55rem 0; position:relative; }
    .timeline-dot { width:10px;height:10px;border-radius:50%;margin-top:5px;flex-shrink:0; }
    .timeline-item:not(:last-child) .timeline-dot::after {
      content:''; position:absolute; left:4px; top:18px;
      width:2px; height:calc(100% - 10px);
      background: var(--border-light);
    }
    .timeline-text { font-size:.78rem; color:var(--muted); line-height:1.5; }
    .timeline-text strong { color:var(--text); }
    .timeline-time { font-size:.68rem; color:var(--muted); margin-top:2px; }

    /* ─── Trend Bars (mini chart) ─── */
    .trend-bars { display:flex;align-items:flex-end;gap:3px;height:36px; }
    .trend-bar { width:6px;border-radius:3px 3px 0 0;background:var(--accent);opacity:.3; }
    .trend-bar.peak { opacity:1; }

    /* ─── Tabs ─── */
    .dash-tabs .nav-link { color:var(--muted);font-size:.8rem;font-weight:500;border:none;padding:.45rem .9rem;border-radius:8px; }
    .dash-tabs .nav-link.active { color:var(--accent);background:rgba(252,43,90,.08); font-weight:600; }
    .dash-tabs .nav-link:hover:not(.active) { color:var(--text);background:rgba(217,217,217,0.4); }

    /* ─── Buttons ─── */
    .btn-accent { background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:.8rem;padding:.4rem .9rem;font-weight:600;transition:opacity .15s; }
    .btn-accent:hover { opacity:.88;color:#fff; }
    .btn-ghost { background:transparent;border:1px solid var(--border);color:var(--muted);border-radius:8px;font-size:.78rem;padding:.35rem .8rem;transition:all .15s; }
    .btn-ghost:hover { border-color:var(--accent);color:var(--accent); }
    .btn-warn-sm { background:rgba(253,126,20,.1);border:1px solid rgba(253,126,20,.35);color:var(--warn);border-radius:6px;font-size:.72rem;padding:.25rem .65rem;cursor:pointer; }
    .btn-icon { width:30px;height:30px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:.9rem;cursor:pointer;transition:all .15s; }
    .btn-icon.blue  { background:rgba(102,126,234,.12);color:var(--accent2); }
    .btn-icon.green { background:rgba(40,167,69,.12);color:var(--accent3); }
    .btn-icon.warn  { background:rgba(253,126,20,.12);color:var(--warn); }
    .btn-icon.pink  { background:rgba(252,43,90,.1);color:var(--accent); }
    .btn-icon:hover { filter:brightness(.9); }

    /* ─── Modal ─── */
    .modal-content { background:#fff;border:1px solid var(--border-light);border-radius:16px;color:var(--text); }
    .modal-header { border-color:var(--border-light); background:rgba(217,217,217,0.2); }
    .modal-footer { border-color:var(--border-light); }
    .modal-title { color:var(--text); font-weight:700; }
    .form-control-dark { background:#fff;border:1px solid var(--border);color:var(--text);border-radius:8px;font-size:.82rem; }
    .form-control-dark:focus { border-color:var(--accent);background:#fff;color:var(--text);box-shadow:0 0 0 3px rgba(252,43,90,.12); }
    .form-label { color:var(--muted); }

    /* ─── Scrollbar ─── */
    ::-webkit-scrollbar { width:5px;height:5px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:#e0e0e0;border-radius:10px; }

    /* ─── Donut rings (CSS only) ─── */
    .donut-wrap { position:relative; width:64px;height:64px; }
    .donut-svg { transform:rotate(-90deg); }
    .donut-track { fill:none;stroke:#eaeaea;stroke-width:7; }
    .donut-fill  { fill:none;stroke-width:7;stroke-linecap:round;transition:stroke-dashoffset .5s; }
    .donut-label { position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Roboto',sans-serif;font-weight:700;font-size:.72rem;text-align:center;line-height:1.1; color:var(--text); }

    .tag { display:inline-block;padding:2px 8px;border-radius:20px;font-size:.65rem;font-weight:600; }
    .tag-green { background:rgba(40,167,69,.12);color:#1e7e34; }
    .tag-blue  { background:rgba(102,126,234,.12);color:#4a5ab8; }
    .tag-warn  { background:rgba(253,126,20,.12);color:#c95d00; }
    .tag-danger{ background:rgba(252,43,90,.12);color:var(--accent); }

    .divider { border-color: var(--border-light); opacity:1; }

    /* text overrides for light theme */
    .text-success { color:#1e7e34 !important; }
    .text-warning { color:#c95d00 !important; }
    .text-danger  { color:var(--accent) !important; }


      
    /* Enhanced Multi-Select Dropdown Styles */
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
  z-index: 1;
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

/* Close dropdown when clicking outside */
.multi-select-container-new.dropdown-open::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

/* Focus states for accessibility */
.multi-select-trigger:focus {
  outline: none;
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.option-item-new input[type="checkbox"]:focus {
  outline: 2px solid #86b7fe;
  outline-offset: 2px;
}

/* Selected state styling */
.option-item-new input[type="checkbox"]:checked + .option-label-new {
  font-weight: 500;
  color: #0d6efd;
}

/* Badge styling for multi-select */
.badge.bg-primary {
  background-color: #0d6efd !important;
  font-size: 0.75rem;
  padding: 0.25em 0.4em;
}
/* Animation for dropdown open/close */
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

/* Prevent text selection on dropdown trigger */
.multi-select-trigger {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Enhanced visual feedback */
.multi-select-trigger:active {
  transform: translateY(1px);
}

/* Loading state (if needed) */
.multi-select-loading {
  pointer-events: none;
  opacity: 0.6;
}

.multi-select-loading .dropdown-arrow {
  animation: spin 1s linear infinite;
}
/* Desktop Date Picker Styles */
.firstDatepicker .react-calendar {
    width: 250px !important;
    height: min-content !important;
    transform: translateX(0px)!important;
}
// .translateX .react-calendar {
//   height: min-content !important;
//     transform: translateX(-110px) !important;
//     width: 250px !important;
// }
.react-calendar{
    height: min-content !important;
    width: 250px !important;
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
  .marginTopMobile {
    margin-top: 340px !important;
  }
   .nav-tabs-main{
                  white-space: nowrap;
                  flex-wrap: nowrap;
                  overflow: scroll;
                  scrollbar-width: none;
                  -ms-overflow-style: none;
                  &::-webkit-scrollbar {
                    display: none;
                  }
              }
  //             .nav-tabs-main > li > button{
  //             padding: 15px 9px;
  //             }
  
  .firstDatepicker .react-calendar,
  .translateX .react-calendar,
  // .react-calendar {
  //   // width: calc(100vw - 40px) !important;
  //   max-width: 300px !important;
  //   // position: fixed !important;
  //   z-index: 9999 !important;
  //   left: 50% !important;
  //   right: 50% !important;
  //   transform: translateX(-50%) translateY(-50%) !important;
  //   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
  // }
  
  .row.g-4 > .col-12.col-md-4 {
    margin-bottom: 1.5rem !important;
  }
  
  .row.g-4 > .col-12.col-md-6 {
    margin-bottom: 1rem !important;
  }
  
  .card.bg-light .row.g-2 > .col-12 {
    margin-bottom: 0.75rem;
  }
  
  .modal-body.p-4 {
    padding: 1rem !important;
  }
  
  .modal-body .row.g-4 {
    margin-left: -0.5rem !important;
    margin-right: -0.5rem !important;
  }
  
  .modal-body .row.g-4 > [class*="col-"] {
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }
}


      `
    }
  </style>

  <div>
      <>

      {/* Advanced Filters */}
      {!isFilterCollapsed && (
            <div
              className="modal show fade d-block"
              style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1050
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsFilterCollapsed(true);
              }}
            >
              <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered mx-auto justify-content-center">
                <div className="modal-content">
                  {/* Modal Header - Fixed at top */}
                  <div className="modal-header bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-filter text-primary me-2"></i>
                        <h5 className="fw-bold mb-0 text-dark">Advanced Filters</h5>
                        {activeFilterCount > 0 && (
                          <span className="badge bg-primary ms-2">
                            {activeFilterCount} Active
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={clearAllFilters}
                        >
                          <i className="fas fa-times-circle me-1"></i>
                          Clear
                        </button>
                        <button
                          className="btn-close"
                          onClick={() => setIsFilterCollapsed(true)}
                          aria-label="Close"
                        ></button>
                      </div>
                    </div>
                  </div>

                  {/* Modal Body - Scrollable content */}
                  <div className="modal-body p-4">
                    <div className="row g-4">
                      {/* Course Type Filter */}
                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-graduation-cap me-1 text-success"></i>
                          Course Type
                        </label>
                        <div className="position-relative">
                          <select
                            className="form-select"
                            name="courseType"
                            value={filterData.courseType}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Types</option>
                            <option value="Free">🆓 Free</option>
                            <option value="Paid">💰 Paid</option>
                          </select>
                        </div>
                      </div>

                      {/* Project Filter */}
                      <div className="col-md-3">
                        <MultiSelectCheckbox
                          title="Project"
                          options={projectOptions}
                          selectedValues={formData.projects.values}
                          onChange={(values) => handleCriteriaChange('projects', values)}
                          icon="fas fa-sitemap"
                          isOpen={dropdownStates.projects}
                          onToggle={() => toggleDropdown('projects')}
                        />
                      </div>

                      {/* Verticals Filter */}
                      <div className="col-md-3">
                        <MultiSelectCheckbox
                          title="Verticals"
                          options={verticalOptions}
                          selectedValues={formData.verticals.values}
                          icon="fas fa-sitemap"
                          isOpen={dropdownStates.verticals}
                          onToggle={() => toggleDropdown('verticals')}
                          onChange={(values) => handleCriteriaChange('verticals', values)}
                        />
                      </div>

                      {/* Course Filter */}
                      <div className="col-md-3">
                        <MultiSelectCheckbox
                          title="Course"
                          options={courseOptions}
                          selectedValues={formData.course.values}
                          onChange={(values) => handleCriteriaChange('course', values)}
                          icon="fas fa-graduation-cap"
                          isOpen={dropdownStates.course}
                          onToggle={() => toggleDropdown('course')}
                        />
                      </div>

                      {/* Center Filter */}
                      <div className="col-md-3">
                        <MultiSelectCheckbox
                          title="Center"
                          options={centerOptions}
                          selectedValues={formData.center.values}
                          onChange={(values) => handleCriteriaChange('center', values)}
                          icon="fas fa-building"
                          isOpen={dropdownStates.center}
                          onToggle={() => toggleDropdown('center')}
                        />
                      </div>

                      {/* Counselor Filter */}
                      <div className="col-md-3">
                        <MultiSelectCheckbox
                          title="Counselor"
                          options={counselorOptions}
                          selectedValues={formData.counselor.values}
                          onChange={(values) => handleCriteriaChange('counselor', values)}
                          icon="fas fa-user-tie"
                          isOpen={dropdownStates.counselor}
                          onToggle={() => toggleDropdown('counselor')}
                        />
                      </div>
                    </div>

                    {/* status filters  */}
                    <div className="row g-4 mt-3">
                      <div className="col-12">
                        <h6 className="text-dark fw-bold mb-3">
                          <i className="fas fa-calendar-alt me-2 text-primary"></i>
                          Status Filter
                        </h6>
                      </div>

                      {/* Status Select */}
                      <div className="col-12 col-md-6 mb-3 mb-md-0">
                        <select
                          className="form-select border-0  bgcolor"
                          id="status"
                          name="statuses"
                          value={filterData.statuses}
                          style={{
                            height: '42px',
                            paddingTop: '8px',
                            paddingInline: '10px',
                            width: '100%',
                            backgroundColor: '#f1f2f6'
                          }}
                          onChange={(e) => handleFilterChange(e)}

                        >
                          <option value="">Select Status</option>
                          {statuses.map((filter) => (
                            <option key={filter._id} value={filter._id}>{filter.name}</option>))}
                        </select>
                      </div>

                      {/* Sub-Status Select */}
                      <div className="col-12 col-md-6">
                        <select
                          className="form-select border-0  bgcolor"
                          name="subStatuses"
                          id="subStatus"
                          value={filterData.subStatuses}
                          style={{
                            height: '42px',
                            paddingTop: '8px',
                            backgroundColor: '#f1f2f6',
                            paddingInline: '10px',
                            width: '100%'
                          }}
                          onChange={(e) => handleFilterChange(e)}

                        >
                          <option value="">Select Sub-Status</option>
                          {subStatuses.map((filter) => (
                            <option key={filter._id} value={filter._id}>{filter.title}</option>))}
                        </select>
                      </div>

                    </div>


                    {/* Date Filters Section */}
                    <div className="row g-4 mt-3">
                      <div className="col-12">
                        <h6 className="text-dark fw-bold mb-3">
                          <i className="fas fa-calendar-alt me-2 text-primary"></i>
                          Date Range Filters
                        </h6>
                      </div>

                      {/* Created Date Range */}
                      <div className="col-12 col-md-4 mb-3 mb-md-0">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-calendar-plus me-1 text-success"></i>
                          Lead Creation Date Range
                        </label>
                        <div className="card border-0 bg-light p-1">
                          <div className="row g-2">
                            <div className="col-12 col-sm-6 firstDatepicker fixDate">
                              <label className="form-label small">From Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'createdFromDate')}
                                value={filterData.createdFromDate}
                                format="dd/MM/yyyy"
                                className="form-control p-0"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-success"></i>}
                                maxDate={filterData.createdToDate || new Date()}
                              />
                            </div>
                            <div className="col-12 col-sm-6 fixDate">
                              <label className="form-label small">To Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'createdToDate')}
                                value={filterData.createdToDate}
                                format="dd/MM/yyyy"
                                className="form-control p-0"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-success"></i>}
                                minDate={filterData.createdFromDate}
                                maxDate={new Date()}
                              />
                            </div>
                          </div>

                          {/* Show selected dates */}
                          {(filterData.createdFromDate || filterData.createdToDate) && (
                            <div className="mt-2 p-2 bg-success bg-opacity-10 rounded">
                              <small className="text-success">
                                <i className="fas fa-info-circle me-1"></i>
                                <strong>Selected:</strong>
                                {filterData.createdFromDate && ` From ${formatDate(filterData.createdFromDate)}`}
                                {filterData.createdFromDate && filterData.createdToDate && ' |'}
                                {filterData.createdToDate && ` To ${formatDate(filterData.createdToDate)}`}
                              </small>
                            </div>
                          )}

                          {/* Clear button */}
                          <div className="mt-2">
                            <button
                              className="btn btn-sm btn-outline-danger w-100 CButton "
                              onClick={() => clearDateFilter('created')}
                              disabled={!filterData.createdFromDate && !filterData.createdToDate}
                            >
                              <i className="fas fa-times me-1"></i>
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Modified Date Range */}
                      <div className="col-12 col-md-4 mb-3 mb-md-0">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-calendar-edit me-1 text-warning"></i>
                          Lead Modification Date Range
                        </label>

                        <div className="card border-0 bg-light p-1">
                          <div className="row g-2">
                            <div className="col-12 col-sm-6 fixDate">
                              <label className="form-label small">From Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'modifiedFromDate')}
                                value={filterData.modifiedFromDate}
                                format="dd/MM/yyyy"
                                className="form-control p-0"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-warning"></i>}
                                maxDate={filterData.modifiedToDate || new Date()}
                              />
                            </div>
                            <div className="col-12 col-sm-6 fixDate">
                              <label className="form-label small">To Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'modifiedToDate')}
                                value={filterData.modifiedToDate}
                                format="dd/MM/yyyy"
                                className="form-control p-0"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-warning"></i>}
                                minDate={filterData.modifiedFromDate}
                                maxDate={new Date()}
                              />
                            </div>
                          </div>

                          {/* Show selected dates */}
                          {/* {(filterData.modifiedFromDate || filterData.modifiedToDate) && (
                            <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded">
                              <small className="text-warning">
                                <i className="fas fa-info-circle me-1"></i>
                                <strong>Selected:</strong>
                                {filterData.modifiedFromDate && ` From ${formatDate(filterData.modifiedFromDate)}`}
                                {filterData.modifiedFromDate && filterData.modifiedToDate && ' |'}
                                {filterData.modifiedToDate && ` To ${formatDate(filterData.modifiedToDate)}`}
                              </small>
                            </div>
                          )} */}

                          {/* Clear button */}
                          <div className="mt-2">
                            <button
                              className="btn btn-sm btn-outline-danger w-100 CButton"
                              onClick={() => clearDateFilter('modified')}
                              disabled={!filterData.modifiedFromDate && !filterData.modifiedToDate}
                            >
                              <i className="fas fa-times me-1"></i>
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Next Action Date Range */}
                      <div className="col-12 col-md-4 mb-3 mb-md-0">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-calendar-check me-1 text-info"></i>
                          Next Action Date Range
                        </label>
                        <div className="card border-0 bg-light p-1">
                          <div className="row g-2">
                            <div className="col-12 col-sm-6 fixDate">
                              <label className="form-label small">From Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'nextActionFromDate')}
                                value={filterData.nextActionFromDate}
                                format="dd/MM/yyyy"
                                className="form-control p-0"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-info"></i>}
                                maxDate={filterData.nextActionToDate}
                              />
                            </div>
                            <div className="col-12 col-sm-6 fixDate translateX">
                              <label className="form-label small">To Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'nextActionToDate')}
                                value={filterData.nextActionToDate}
                                format="dd/MM/yyyy"
                                className="form-control p-0"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-info"></i>}
                                minDate={filterData.nextActionFromDate}
                              />
                            </div>
                          </div>

                          {/* Show selected dates */}
                          {(filterData.nextActionFromDate || filterData.nextActionToDate) && (
                            <div className="mt-2 p-2 bg-info bg-opacity-10 rounded">
                              <small className="text-info">
                                <i className="fas fa-info-circle me-1"></i>
                                <strong>Selected:</strong>
                                {filterData.nextActionFromDate && ` From ${formatDate(filterData.nextActionFromDate)}`}
                                {filterData.nextActionFromDate && filterData.nextActionToDate && ' |'}
                                {filterData.nextActionToDate && ` To ${formatDate(filterData.nextActionToDate)}`}
                              </small>
                            </div>
                          )}

                          {/* Clear button */}
                          <div className="mt-2">
                            <button
                              className="btn btn-sm btn-outline-danger w-100 CButton"
                              onClick={() => clearDateFilter('nextAction')}
                              disabled={!filterData.nextActionFromDate && !filterData.nextActionToDate}
                            >
                              <i className="fas fa-times me-1"></i>
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row g-4 mt-3">
                      <div className="col-12">
                        <h6 className="text-dark fw-bold mb-3">
                          <i className="fas fa-calendar-alt me-2 text-primary"></i>
                          Range Count
                        </h6>
                      </div>


                    </div>



                    {/* Results Summary */}
                    <div className="row mt-4">
                      <div className="col-12">
                        <div className="alert alert-info">
                          <div className="d-flex align-items-center">
                            <i className="fas fa-info-circle me-2"></i>
                            <div>
                              <strong>Results Summary:</strong> Showing {filteredActivities.length} results on page {currentPage} of {totalPages}

                              {/* Active filter indicators */}
                              <div className="mt-2">
                                {(filterData.createdFromDate || filterData.createdToDate) && (
                                  <span className="badge bg-success me-2">
                                    <i className="fas fa-calendar-plus me-1"></i>
                                    Created Date Filter Active
                                  </span>
                                )}

                                {(filterData.modifiedFromDate || filterData.modifiedToDate) && (
                                  <span className="badge bg-warning me-2">
                                    <i className="fas fa-calendar-edit me-1"></i>
                                    Modified Date Filter Active
                                  </span>
                                )}

                                {(filterData.nextActionFromDate || filterData.nextActionToDate) && (
                                  <span className="badge bg-info me-2">
                                    <i className="fas fa-calendar-check me-1"></i>
                                    Next Action Date Filter Active
                                  </span>
                                )}

                                {totalSelected > 0 && (
                                  <span className="badge bg-primary me-2">
                                    <i className="fas fa-filter me-1"></i>
                                    {totalSelected} Multi-Select Filters Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer - Fixed at bottom */}
                  <div className="modal-footer bg-light border-top">
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <div className="text-muted small">
                        <i className="fas fa-filter me-1"></i>
                        {activeFilterCount} filters applied
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => setIsFilterCollapsed(true)}
                        >
                          <i className="fas fa-eye-slash me-1"></i>
                          Hide Filters
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            applyFilters();
                            setIsFilterCollapsed(true);
                          }}
                        >
                          <i className="fas fa-search me-1"></i>
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* <!-- ═══════════════ MAIN ═══════════════ --> */}
        <div className="main-wraps">

          {/* <!-- Topbar --> */}
          <div className="topbar">
            <div className="page-title">CRM Target Dashboard</div>
            <div className="ms-auto d-flex align-items-center gap-2">
              <button className="btn-ghost btn" data-bs-toggle="modal" data-bs-target="#setTargetModal"><i className="bi bi-sliders me-1"></i>Set Targets</button>
            </div>
          </div>

          {/* <!-- Content --> */}
          <div className="content">

            {/* <!-- ── Filters ── --> */}
            <div className="filters-bar mb-4">
              <i className="bi bi-funnel text-muted"></i>
              <button
                className={`btn ${!isFilterCollapsed ? 'btn-primary' : 'btn-outline-primary'} btn-sm ms-2`}
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
              >
                <i className={`fas fa-filter me-1 ${!isFilterCollapsed ? 'fa-spin' : ''}`}></i>
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-light text-dark ms-1">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button className="btn-accent btn ms-auto" onClick={() => applyFilters()}>
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>

            {/* <!-- ── KPI Cards ── --> */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-3 col-xl">
                <div className="kpi-card">
                  <div className="kpi-icon" style={{ background: "rgba(252,43,90,.1)", color: "var(--accent)" }}><i className="bi bi-person-check"></i></div>
                  <div className="kpi-value">1,284</div>
                  <div className="kpi-label">Total Leads Assigned</div>
                  <div className="kpi-change up"><i className="bi bi-arrow-up-right"></i> +12.4% vs last month</div>
                </div>
              </div>
              <div className="col-6 col-md-3 col-xl">
                <div className="kpi-card">
                  <div className="kpi-icon" style={{ background: "rgba(40,167,69,.1)", color: "var(--accent3)" }}><i className="bi bi-mortarboard"></i></div>
                  <div className="kpi-value">347</div>
                  <div className="kpi-label">Admissions Done</div>
                  <div className="kpi-change up"><i className="bi bi-arrow-up-right"></i> +8.1% vs last month</div>
                </div>
              </div>
              <div className="col-6 col-md-3 col-xl">
                <div className="kpi-card">
                  <div className="kpi-icon" style={{ background: "rgba(253,126,20,.1)", color: "var(--warn)" }}><i className="bi bi-exclamation-circle"></i></div>
                  <div className="kpi-value">89</div>
                  <div className="kpi-label">Overdue Actions</div>
                  <div className="kpi-change dn"><i className="bi bi-arrow-down-right"></i> +6 since yesterday</div>
                </div>
              </div>
              <div className="col-6 col-md-3 col-xl">
                <div className="kpi-card">
                  <div className="kpi-icon" style={{ background: "rgba(102,126,234,.1)", color: "var(--accent2)" }}><i className="bi bi-currency-rupee"></i></div>
                  <div className="kpi-value">₹18.4L</div>
                  <div className="kpi-label">Revenue Collected</div>
                  <div className="kpi-change up"><i className="bi bi-arrow-up-right"></i> +22.3% vs last month</div>
                </div>
              </div>
              <div className="col-6 col-md-3 col-xl">
                <div className="kpi-card">
                  <div className="kpi-icon" style={{ background: "rgba(245,197,24,.1)", color: "var(--gold)" }}><i className="bi bi-arrow-repeat"></i></div>
                  <div className="kpi-value">27.1%</div>
                  <div className="kpi-label">Lead Conversion Rate</div>
                  <div className="kpi-change up"><i className="bi bi-arrow-up-right"></i> +3.2% vs last month</div>
                </div>
              </div>
              <div className="col-6 col-md-3 col-xl">
                <div className="kpi-card">
                  <div className="kpi-icon" style={{ background: "rgba(252,43,90,.1)", color: "var(--danger)" }}><i className="bi bi-person-dash"></i></div>
                  <div className="kpi-value">14</div>
                  <div className="kpi-label">Dropouts This Month</div>
                  <div className="kpi-change dn"><i className="bi bi-arrow-down-right"></i> Need attention</div>
                </div>
              </div>
            </div>

            {/* <!-- ── Main Grid ── --> */}
            <div className="row g-3">

              {/* <!-- LEFT: Activity Target Table --> */}
              <div className="col-12 col-xl-8">
                <div className="activity-table-wrap mb-3">
                  <div className="d-flex align-items-center justify-content-between px-3 py-3">
                    <div className="sec-header mb-0">Activity-Wise Targets <span className="badge-tag">March 2025</span></div>
                    <div>
                      <ul className="nav dash-tabs">
                        <li className="nav-item"><a className="nav-link active" href="#">All</a></li>
                        <li className="nav-item"><a className="nav-link" href="#">Pending</a></li>
                        <li className="nav-item"><a className="nav-link" href="#">Overdue</a></li>
                      </ul>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-borderless align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Activity</th>
                          <th>Target</th>
                          <th>Done</th>
                          <th>Pending</th>
                          <th>Overdue</th>
                          <th style={{ minWidth: "140px" }}>Progress</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredActivities.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              No activities match the active filters.
                            </td>
                          </tr>
                        ) : (
                          filteredActivities.map((activity) => (
                            <tr key={activity.id}>
                              <td>
                                <i className={`bi ${activity.icon} me-2`} style={{ color: activity.iconColor }}></i>
                                {activity.name}
                              </td>
                              <td>{activity.target}</td>
                              <td className="text-success">{activity.done}</td>
                              <td className="text-warning">{activity.pending}</td>
                              <td className="text-danger">{activity.overdue}</td>
                              <td>
                                <div className="prog-bar-wrap">
                                  <div className={`prog-bar-fill ${activity.progressClass}`} style={{ width: `${activity.progress}%` }}></div>
                                </div>
                                <span style={{ fontSize: ".67rem", color: "var(--muted)" }}>{activity.progress}%</span>
                              </td>
                              <td>
                                <span className={`tag ${activity.statusTagClass}`}>{activity.status}</span>
                              </td>
                              <td>
                                <span className="btn-icon blue" title="Edit">
                                  <i className="bi bi-pencil"></i>
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* <!-- Counselor Cards --> */}
                <div className="sec-header">Counselor Performance <span className="badge-tag">8 Active</span></div>
                <div className="row g-3">
                  {/* <!-- Card 1 --> */}
                  <div className="col-12 col-md-6">
                    <div className="counselor-card">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="rank-badge rank-1">1</div>
                        <img src="https://ui-avatars.com/api/?name=Priya+Sharma&background=00d4aa&color=fff&size=64" className="avatar-md" alt="" />
                        <div className="flex-grow-1">
                          <div style={{ fontWeight: "600", fontSize: ".85rem" }}>Priya Sharma</div>
                          <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>Mumbai HQ · Data Science</div>
                        </div>
                        <span className="status-dot dot-green" title="Online"></span>
                        <div className="d-flex gap-1">
                          <span className="btn-icon blue"><i className="bi bi-chat"></i></span>
                          <span className="btn-icon green"><i className="bi bi-plus-circle"></i></span>
                          <span className="btn-icon warn"><i className="bi bi-bell"></i></span>
                        </div>
                      </div>
                      <div className="row g-2 mb-3">
                        <div className="col-4 text-center">
                          <div style={{ fontFamily: "Roboto, sans-serif", fontSize: "1.1rem", fontWeight: "700", color: "var(--accent3)" }}>94%</div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Compliance</div>
                        </div>
                        <div className="col-4 text-center">
                          <div style={{ fontFamily: "Roboto, sans-serif", fontSize: "1.1rem", fontWeight: "700", color: "var(--gold)" }}>32.4%</div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Conversion</div>
                        </div>
                        <div className="col-4 text-center">
                          <div style={{ fontFamily: "Roboto, sans-serif", fontSize: "1.1rem", fontWeight: "700", color: "var(--accent2)" }}>₹4.2L</div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Revenue</div>
                        </div>
                      </div>
                      <div className="mb-1" style={{ fontSize: ".72rem", color: "var(--muted)" }}>Overall Target Progress</div>
                      <div className="prog-bar-wrap mb-2"><div className="prog-bar-fill prog-green" style={{ width: "94%" }}></div></div>
                      <div className="d-flex justify-content-between" style={{ fontSize: ".7rem", color: "var(--muted)" }}>
                        <span>Completed: <strong style={{ color: "var(--accent3)" }}>376</strong></span>
                        <span>Pending: <strong style={{ color: "var(--warn)" }}>18</strong></span>
                        <span>Overdue: <strong style={{ color: "var(--danger)" }}>4</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* <!-- Card 2 --> */}
                  <div className="col-12 col-md-6">
                    <div className="counselor-card">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="rank-badge rank-2">2</div>
                        <img src="https://ui-avatars.com/api/?name=Rohit+Mehta&background=4f7cff&color=fff&size=64" className="avatar-md" alt="" />
                        <div className="flex-grow-1">
                          <div style={{ fontWeight: "600", fontSize: ".85rem" }}>Rohit Mehta</div>
                          <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>Delhi Branch · Full Stack</div>
                        </div>
                        <span className="status-dot dot-green"></span>
                        <div className="d-flex gap-1">
                          <span className="btn-icon blue"><i className="bi bi-chat"></i></span>
                          <span className="btn-icon green"><i className="bi bi-plus-circle"></i></span>
                          <span className="btn-icon warn"><i className="bi bi-bell"></i></span>
                        </div>
                      </div>
                      <div className="row g-2 mb-3">
                        <div className="col-4 text-center">
                          <div style={{ fontFamily: "Roboto, sans-serif", fontSize: "1.1rem", fontWeight: "700", color: "var(--accent3)" }}>87%</div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Compliance</div>
                        </div>
                        <div className="col-4 text-center">
                          <div style={{ fontFamily: "Roboto, sans-serif", fontSize: "1.1rem", fontWeight: "700", color: "var(--gold)" }}>28.1%</div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Conversion</div>
                        </div>
                        <div className="col-4 text-center">
                          <div style={{ fontFamily: "Roboto, sans-serif", fontSize: "1.1rem", fontWeight: "700", color: "var(--accent2)" }}>₹3.6L</div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Revenue</div>
                        </div>
                      </div>
                      <div className="mb-1" style={{ fontSize: ".72rem", color: "var(--muted)" }}>Overall Target Progress</div>
                      <div className="prog-bar-wrap mb-2"><div className="prog-bar-fill prog-blue" style={{ width: "87%" }}></div></div>
                      <div className="d-flex justify-content-between" style={{ fontSize: ".7rem", color: "var(--muted)" }}>
                        <span>Completed: <strong style={{ color: "var(--accent3)" }}>312</strong></span>
                        <span>Pending: <strong style={{ color: "var(--warn)" }}>34</strong></span>
                        <span>Overdue: <strong style={{ color: "var(--danger)" }}>9</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* <!-- Card 3 --> */}
                  <div className="col-12 col-md-6">
                    <div className="counselor-card">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="rank-badge rank-3">3</div>
                        <img src="https://ui-avatars.com/api/?name=Anjali+Patel&background=7c5cfc&color=fff&size=64" className="avatar-md" alt="" />
                        <div className="flex-grow-1">
                          <div style={{ fontWeight: "600", fontSize: ".85rem" }}>Anjali Patel</div>
                          <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>Pune Center · Dig. Marketing</div>
                        </div>
                        <span className="status-dot dot-warn"></span>
                        <div className="d-flex gap-1">
                          <span className="btn-icon blue"><i className="bi bi-chat"></i></span>
                          <span className="btn-icon green"><i className="bi bi-plus-circle"></i></span>
                          <span className="btn-icon warn"><i className="bi bi-bell"></i></span>
                        </div>
                      </div>
                      <div className="row g-2 mb-3">
                        <div className="col-4 text-center">
                          <div style={{ fontFamily: "Roboto, sans-serif", fontSize: "1.1rem", fontWeight: "700", color: "var(--warn)" }}>71%</div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Compliance</div>
                        </div>
                        <div className="col-4 text-center">
                          <div style={{ fontFamily: "Roboto, sans-serif", fontSize: "1.1rem", fontWeight: "700", color: "var(--gold)" }}>22.8%</div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Conversion</div>
                        </div>
                        <div className="col-4 text-center">
                          <div style={{ fontFamily: "Roboto, sans-serif", fontSize: "1.1rem", fontWeight: "700", color: "var(--accent2)" }}>₹2.9L</div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Revenue</div>
                        </div>
                      </div>
                      <div className="mb-1" style={{ fontSize: ".72rem", color: "var(--muted)" }}>Overall Target Progress</div>
                      <div className="prog-bar-wrap mb-2"><div className="prog-bar-fill prog-warn" style={{ width: "71%" }}></div></div>
                      <div className="d-flex justify-content-between" style={{ fontSize: ".7rem", color: "var(--muted)" }}>
                        <span>Completed: <strong style={{ color: "var(--accent3)" }}>258</strong></span>
                        <span>Pending: <strong style={{ color: "var(--warn)" }}>72</strong></span>
                        <span>Overdue: <strong style={{ color: "var(--danger)" }}>18</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* <!-- Card 4 --> */}
                  <div className="col-12 col-md-6">
                    <div className="counselor-card">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="rank-badge rank-n">4</div>
                        <img src="https://ui-avatars.com/api/?name=Vikas+Joshi&background=ff5e7d&color=fff&size=64" className="avatar-md" alt="" />
                        <div className="flex-grow-1">
                          <div style={{ fontWeight: "600", fontSize: ".85rem" }}>Vikas Joshi</div>
                          <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>Mumbai HQ · Full Stack</div>
                        </div>
                        <span className="status-dot dot-danger"></span>
                        <div className="d-flex gap-1">
                          <span className="btn-icon blue"><i className="bi bi-chat"></i></span>
                          <span className="btn-icon green"><i className="bi bi-plus-circle"></i></span>
                          <span className="btn-icon warn"><i className="bi bi-bell"></i></span>
                        </div>
                      </div>
                      <div className="row g-2 mb-3">
                        <div className="col-4 text-center">
                          <div style={{ fontFamily: "Roboto, sans-serif", fontSize: "1.1rem", fontWeight: "700", color: "var(--danger)" }}>48%</div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Compliance</div>
                        </div>
                        <div className="col-4 text-center">
                          <div style={{ fontFamily: "Roboto, sans-serif", fontSize: "1.1rem", fontWeight: "700", color: "var(--warn)" }}>14.2%</div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Conversion</div>
                        </div>
                        <div className="col-4 text-center">
                          <div style={{ fontFamily: "Roboto, sans-serif", fontSize: "1.1rem", fontWeight: "700", color: "var(--accent2)" }}>₹1.4L</div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Revenue</div>
                        </div>
                      </div>
                      <div className="mb-1" style={{ fontSize: ".72rem", color: "var(--muted)" }}>Overall Target Progress</div>
                      <div className="prog-bar-wrap mb-2"><div className="prog-bar-fill prog-danger" style={{ width: "48%" }}></div></div>
                      <div className="d-flex justify-content-between" style={{ fontSize: ".7rem", color: "var(--muted)" }}>
                        <span>Completed: <strong style={{ color: "var(--accent3)" }}>174</strong></span>
                        <span>Pending: <strong style={{ color: "var(--warn)" }}>108</strong></span>
                        <span>Overdue: <strong style={{ color: "var(--danger)" }}>36</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* <!-- RIGHT: Sidebar Panels --> */}
              <div className="col-12 col-xl-4">

                {/* <!-- Alerts --> */}
                <div className="mb-3">
                  <div className="sec-header">Active Alerts <span className="badge-tag badge bg-danger text-white" style={{ fontSize: ".65rem" }}>7 New</span></div>
                  <div className="alert-pill danger"><i className="bi bi-exclamation-triangle-fill" style={{ color: "var(--danger)", fontSize: "1rem" }}></i><div><div style={{ fontWeight: "600" }}>Job Counseling target critical</div><div style={{ color: "var(--muted)", fontSize: ".72rem" }}>Vikas Joshi – only 47% complete, 3 days left</div></div><button className="btn-warn-sm ms-auto">Alert</button></div>
                  <div className="alert-pill warn"><i className="bi bi-clock-fill" style={{ color: "var(--warn)", fontSize: "1rem" }}></i><div><div style={{ fontWeight: "600" }}>22 Follow-ups overdue</div><div style={{ color: "var(--muted)", fontSize: ".72rem" }}>Anjali Patel – requires immediate action</div></div><button className="btn-warn-sm ms-auto">Alert</button></div>
                  <div className="alert-pill warn"><i className="bi bi-person-dash" style={{ color: "var(--warn)", fontSize: "1rem" }}></i><div><div style={{ fontWeight: "600" }}>Dropout spike detected</div><div style={{ color: "var(--muted)", fontSize: ".72rem" }}>6 dropouts in last 48 hours · Pune Center</div></div><button className="btn-warn-sm ms-auto">Alert</button></div>
                  <div className="alert-pill info"><i className="bi bi-info-circle-fill" style={{ color: "var(--accent)", fontSize: "1rem" }}></i><div><div style={{ fontWeight: "600" }}>Payment reminders pending</div><div style={{ color: "var(--muted)", fontSize: ".72rem" }}>11 overdue payments across 3 counselors</div></div></div>
                </div>

                {/* <!-- Leaderboard --> */}
                <div className="activity-table-wrap mb-3" style={{ borderRadius: "14px" }}>
                  <div className="px-3 py-3 border-bottom" style={{ borderColor: "var(--border-light)!important" }}>
                    <div className="sec-header mb-0"><i className="bi bi-trophy me-1" style={{ color: "var(--gold)" }}></i>Leaderboard</div>
                  </div>
                  <div className="p-2">
                    <div className="leader-row">
                      <div className="rank-badge rank-1">1</div>
                      <img src="https://ui-avatars.com/api/?name=Priya+Sharma&background=00d4aa&color=fff&size=64" className="avatar-sm" alt="" />
                      <div className="flex-grow-1">
                        <div style={{ fontSize: ".82rem", fontWeight: "600" }}>Priya Sharma</div>
                        <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>94% compliance · Mumbai</div>
                      </div>
                      <div className="leader-score" style={{ color: "var(--accent3)" }}>976</div>
                    </div>
                    <div className="leader-row">
                      <div className="rank-badge rank-2">2</div>
                      <img src="https://ui-avatars.com/api/?name=Rohit+Mehta&background=4f7cff&color=fff&size=64" className="avatar-sm" alt="" />
                      <div className="flex-grow-1">
                        <div style={{ fontSize: ".82rem", fontWeight: "600" }}>Rohit Mehta</div>
                        <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>87% compliance · Delhi</div>
                      </div>
                      <div className="leader-score" style={{ color: "var(--text)" }}>841</div>
                    </div>
                    <div className="leader-row">
                      <div className="rank-badge rank-3">3</div>
                      <img src="https://ui-avatars.com/api/?name=Anjali+Patel&background=7c5cfc&color=fff&size=64" className="avatar-sm" alt="" />
                      <div className="flex-grow-1">
                        <div style={{ fontSize: ".82rem", fontWeight: "600" }}>Anjali Patel</div>
                        <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>71% compliance · Pune</div>
                      </div>
                      <div className="leader-score" style={{ color: "var(--text)" }}>714</div>
                    </div>
                    <div className="leader-row">
                      <div className="rank-badge rank-n">4</div>
                      <img src="https://ui-avatars.com/api/?name=Meena+Raj&background=ff9f43&color=fff&size=64" className="avatar-sm" alt="" />
                      <div className="flex-grow-1">
                        <div style={{ fontSize: ".82rem", fontWeight: "600" }}>Meena Raj</div>
                        <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>66% compliance · Delhi</div>
                      </div>
                      <div className="leader-score" style={{ color: "var(--text)" }}>672</div>
                    </div>
                    <div className="leader-row">
                      <div className="rank-badge rank-n">5</div>
                      <img src="https://ui-avatars.com/api/?name=Vikas+Joshi&background=ff5e7d&color=fff&size=64" className="avatar-sm" alt="" />
                      <div className="flex-grow-1">
                        <div style={{ fontSize: ".82rem", fontWeight: "600" }}>Vikas Joshi</div>
                        <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>48% compliance · Mumbai</div>
                      </div>
                      <div className="leader-score" style={{ color: "var(--danger)" }}>489</div>
                    </div>
                  </div>
                </div>

                {/* <!-- Historical Trends Mini --> */}
                <div className="activity-table-wrap mb-3" style={{ borderRadius: "14px" }}>
                  <div className="px-3 py-3 border-bottom" style={{ borderColor: "var(--border-light)!important" }}>
                    <div className="sec-header mb-0"><i className="bi bi-graph-up me-1" style={{ color: "var(--accent)" }}></i>Historical Trends</div>
                  </div>
                  <div className="p-3">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="font-size-.78rem">Lead Conversion Rate</span>
                        <span style={{ fontSize: ".78rem", color: "var(--accent3)" }}>+3.2%</span>
                      </div>
                      <div className="trend-bars">
                        <div className="trend-bar" style={{ height: "45%", background: "var(--accent)" }}></div>
                        <div className="trend-bar" style={{ height: "55%" }}></div>
                        <div className="trend-bar" style={{ height: "60%" }}></div>
                        <div className="trend-bar" style={{ height: "52%" }}></div>
                        <div className="trend-bar" style={{ height: "70%" }}></div>
                        <div className="trend-bar" style={{ height: "65%" }}></div>
                        <div className="trend-bar peak" style={{ height: "80%" }}></div>
                      </div>
                      <div className="d-flex justify-content-between mt-1" style={{ fontSize: ".62rem", color: "var(--muted)" }}>
                        <span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                      </div>
                    </div>
                    <hr className="divider my-2" />
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="font-size-.78rem">Admissions</span>
                        <span className="font-size-.78rem" style={{ color: "var(--accent3)" }}>+8.1%</span>
                      </div>
                      <div className="trend-bars">
                        <div className="trend-bar" style={{ height: "40%", background: "var(--accent3)" }}></div>
                        <div className="trend-bar" style={{ height: "60%", background: "var(--accent3)" }}></div>
                        <div className="trend-bar" style={{ height: "55%", background: "var(--accent3)" }}></div>
                        <div className="trend-bar" style={{ height: "70%", background: "var(--accent3)" }}></div>
                        <div className="trend-bar" style={{ height: "65%", background: "var(--accent3)" }}></div>
                        <div className="trend-bar" style={{ height: "75%", background: "var(--accent3)" }}></div>
                        <div className="trend-bar peak" style={{ height: "85%", background: "var(--accent3)" }}></div>
                      </div>
                      <div className="d-flex justify-content-between mt-1" style={{ fontSize: ".62rem", color: "var(--muted)" }}>
                        <span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                      </div>
                    </div>
                    <hr className="divider my-2" />
                    <div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="font-size-.78rem">Revenue (₹L)</span>
                        <span className="font-size-.78rem" style={{ color: "var(--accent3)" }}>+22.3%</span>
                      </div>
                      <div className="trend-bars">
                        <div className="trend-bar" style={{ height: "35%", background: "var(--accent2)" }}></div>
                        <div className="trend-bar" style={{ height: "50%", background: "var(--accent2)" }}></div>
                        <div className="trend-bar" style={{ height: "45%", background: "var(--accent2)" }}></div>
                        <div className="trend-bar" style={{ height: "60%", background: "var(--accent2)" }}></div>
                        <div className="trend-bar" style={{ height: "70%", background: "var(--accent2)" }}></div>
                        <div className="trend-bar" style={{ height: "75%", background: "var(--accent2)" }}></div>
                        <div className="trend-bar peak" style={{ height: "90%", background: "var(--accent2)" }}></div>
                      </div>
                      <div className="d-flex justify-content-between mt-1" style={{ fontSize: ".62rem", color: "var(--muted)" }}>
                        <span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* <!-- Recent Activity Timeline --> */}
                <div className="activity-table-wrap" style={{ borderRadius: "14px" }}>
                  <div className="px-3 py-3 border-bottom" style={{ borderColor: "var(--border-light)!important" }}>
                    <div className="sec-header mb-0"><i className="bi bi-activity me-1" style={{ color: "var(--accent3)" }}></i>Recent Activity</div>
                  </div>
                  <div className="p-3">
                    <div className="timeline-item">
                      <div className="timeline-dot" style={{ background: "var(--accent3)" }}></div>
                      <div>
                        <div className="timeline-text"><strong>Priya Sharma</strong> completed KYC for 12 students</div>
                        <div className="timeline-time">2 mins ago</div>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-dot" style={{ background: "var(--accent)" }}></div>
                      <div>
                        <div className="timeline-text"><strong>Rohit Mehta</strong> assigned 8 leads · Delhi Branch</div>
                        <div className="timeline-time">14 mins ago</div>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-dot" style={{ background: "var(--danger)" }}></div>
                      <div>
                        <div className="timeline-text"><strong>Vikas Joshi</strong> missed follow-up target for 6 leads</div>
                        <div className="timeline-time">1 hr ago</div>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-dot" style={{ background: "var(--warn)" }}></div>
                      <div>
                        <div className="timeline-text"><strong>Anjali Patel</strong> 3 documents pending verification</div>
                        <div className="timeline-time">2 hrs ago</div>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-dot" style={{ background: "var(--accent2)" }}></div>
                      <div>
                        <div className="timeline-text"><strong>Meena Raj</strong> collected payment ₹42,000 · Batch A</div>
                        <div className="timeline-time">3 hrs ago</div>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-dot" style={{ background: "var(--accent3)" }}></div>
                      <div>
                        <div className="timeline-text"><strong>Priya Sharma</strong> completed batch assignment for 20 students</div>
                        <div className="timeline-time">4 hrs ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <!-- ── Center & Course Breakdown ── --> */}
            <div className="row g-3 mt-1">
              <div className="col-12 col-md-6">
                <div className="activity-table-wrap" style={{ borderRadius: "14px" }}>
                  <div className="px-3 py-3 border-bottom" style={{ borderColor: "var(--border-light)!important" }}>
                    <div className="sec-header mb-0"><i className="bi bi-building me-1" style={{ color: "var(--accent)" }}></i>Center-wise Breakdown</div>
                  </div>
                  <div className="p-3">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="font-size-.82rem">Mumbai HQ</span>
                        <span className="font-size-.78rem" style={{ color: "#1e7e34" }}>91%</span>
                      </div>
                      <div className="prog-bar-wrap"><div className="prog-bar-fill prog-green" style={{ width: "91%" }}></div></div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="font-size-.82rem">Delhi Branch</span>
                        <span className="font-size-.78rem" style={{ color: "var(--accent)" }}>78%</span>
                      </div>
                      <div className="prog-bar-wrap"><div className="prog-bar-fill prog-blue" style={{ width: "78%" }}></div></div>
                    </div>
                    <div className="mb-2">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="font-size-.82rem">Pune Center</span>
                        <span className="font-size-.78rem" style={{ color: "var(--warn)" }}>64%</span>
                      </div>
                      <div className="prog-bar-wrap"><div className="prog-bar-fill prog-warn" style={{ width: "64%" }}></div></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="activity-table-wrap" style={{ borderRadius: "14px" }}>
                  <div className="px-3 py-3 border-bottom" style={{ borderColor: "var(--border-light)!important" }}>
                    <div className="sec-header mb-0"><i className="bi bi-book me-1" style={{ color: "var(--accent2)" }}></i>Course-wise Breakdown</div>
                  </div>
                  <div className="p-3">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="font-size-.82rem">Data Science</span>
                        <span className="font-size-.78rem" style={{ color: "#1e7e34" }}>89%</span>
                      </div>
                      <div className="prog-bar-wrap"><div className="prog-bar-fill prog-green" style={{ width: "89%" }}></div></div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="font-size-.82rem">Full Stack Dev</span>
                        <span className="font-size-.78rem" style={{ color: "var(--accent)" }}>82%</span>
                      </div>
                      <div className="prog-bar-wrap"><div className="prog-bar-fill prog-blue" style={{ width: "82%" }}></div></div>
                    </div>
                    <div className="mb-2">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="font-size-.82rem">Digital Marketing</span>
                        <span className="font-size-.78rem" style={{ color: "var(--warn)" }}>61%</span>
                      </div>
                      <div className="prog-bar-wrap"><div className="prog-bar-fill prog-warn" style={{ width: "61%" }}></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* <!-- ═══════════════ SET TARGET MODAL ═══════════════ --> */}
        <div className="modal fade" id="setTargetModal" tabindex="-1" aria-hidden="true">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ fontFamily: "'Roboto',sans-serif" }}><i className="bi bi-sliders me-2"></i>Set Monthly Targets</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label" style={{ fontSize: ".78rem", color: "var(--muted)" }}>Counselor</label>
                    <select className="form-select form-control-dark">
                      <option>All Counselors</option>
                      <option>Priya Sharma</option>
                      <option>Rohit Mehta</option>
                      <option>Anjali Patel</option>
                      <option>Vikas Joshi</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" style={{ fontSize: ".78rem", color: "var(--muted)" }}>Month</label>
                    <select className="form-select form-control-dark">
                      <option>March 2025</option>
                      <option>April 2025</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" style={{ fontSize: ".78rem", color: "var(--muted)" }}>Center</label>
                    <select className="form-select form-control-dark">
                      <option>All Centers</option>
                      <option>Mumbai HQ</option>
                      <option>Delhi Branch</option>
                      <option>Pune Center</option>
                    </select>
                  </div>
                </div>
                <hr className="divider" />
                <div className="row g-2">
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>KYC Verifications</label><input type="number" className="form-control form-control-dark form-control-sm" value="150" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Admissions</label><input type="number" className="form-control form-control-dark form-control-sm" value="80" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Follow-Ups</label><input type="number" className="form-control form-control-dark form-control-sm" value="500" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Lead Assignments</label><input type="number" className="form-control form-control-dark form-control-sm" value="200" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Doc Verifications</label><input type="number" className="form-control form-control-dark form-control-sm" value="120" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Course Counseling</label><input type="number" className="form-control form-control-dark form-control-sm" value="300" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Job Counseling</label><input type="number" className="form-control form-control-dark form-control-sm" value="90" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Attendance Mgmt</label><input type="number" className="form-control form-control-dark form-control-sm" value="400" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Payment Collection</label><input type="number" className="form-control form-control-dark form-control-sm" value="180" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Dropout Mgmt</label><input type="number" className="form-control form-control-dark form-control-sm" value="30" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Batch Assignment</label><input type="number" className="form-control form-control-dark form-control-sm" value="200" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Drip Marketing</label><input type="number" className="form-control form-control-dark form-control-sm" value="600" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Re-Enquiry</label><input type="number" className="form-control form-control-dark form-control-sm" value="100" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Pre-Verification</label><input type="number" className="form-control form-control-dark form-control-sm" value="250" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Candidate Reg.</label><input type="number" className="form-control form-control-dark form-control-sm" value="350" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Profile Updates</label><input type="number" className="form-control form-control-dark form-control-sm" value="220" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Communication Logs</label><input type="number" className="form-control form-control-dark form-control-sm" value="800" /></div>
                  <div className="col-6 col-md-4"><label className="form-label" style={{ fontSize: ".75rem", color: "var(--muted)" }}>Lead Conversion</label><input type="number" className="form-control form-control-dark form-control-sm" value="150" /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-ghost btn" data-bs-dismiss="modal">Cancel</button>
                <button className="btn-accent btn">Save Targets</button>
              </div>
            </div>
          </div>
        </div>

      </>
    </div>
    </>
   
  );
}

export default Target;