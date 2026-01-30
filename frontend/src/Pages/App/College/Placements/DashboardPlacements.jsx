import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-date-picker';
import axios from 'axios';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  ComposedChart
} from 'recharts';
import { 
  Calendar, TrendingUp, Users, Building, Clock, Target, CheckCircle, 
  XCircle, AlertCircle, UserCheck, FileCheck, AlertTriangle, 
  ChevronLeft, ChevronRight, CalendarDays, Phone, Mail, MapPin, User, 
  Briefcase, Eye, Edit, History, Plus, FileText, Award, TrendingDown,
  Filter, Download, RefreshCw, BarChart3, PieChart as PieChartIcon, Share2
} from 'lucide-react';

// Advanced Date Picker Component (same as Dashboard.jsx)
const AdvancedDatePicker = ({ onDateRangeChange, onClose }) => {
  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
  const [selectedRange, setSelectedRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentEndMonth, setCurrentEndMonth] = useState(new Date());

  const formatDateToYYYYMMDD = (date) => {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  };

  const dateRanges = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'todayYesterday', label: 'Today and yesterday' },
    { id: 'last7', label: 'Last 7 days' },
    { id: 'last30', label: 'Last 30 days' },
    { id: 'thisWeek', label: 'This week' },
    { id: 'lastWeek', label: 'Last week' },
    { id: 'thisMonth', label: 'This month' },
    { id: 'lastMonth', label: 'Last month' },
    { id: 'maximum', label: 'Maximum' },
    { id: 'custom', label: 'Custom' }
  ];

  const getDateRange = (rangeId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let endDate = new Date(today);
    let startDate = new Date(today);

    switch (rangeId) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(startDate);
        break;
      case 'todayYesterday':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(today);
        break;
      case 'last7':
        startDate.setDate(today.getDate() - 6);
        break;
      case 'last30':
        startDate.setDate(today.getDate() - 29);
        break;
      case 'thisWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        break;
      case 'lastWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay() - 7);
        endDate = new Date(today);
        endDate.setDate(today.getDate() - today.getDay() - 1);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'maximum':
        startDate = new Date('2020-01-01');
        break;
      case 'custom':
        return { startDate: customStartDate, endDate: customEndDate };
      default:
        startDate.setDate(today.getDate() - 29);
    }

    return {
      startDate: formatDateToYYYYMMDD(startDate),
      endDate: formatDateToYYYYMMDD(endDate)
    };
  };

  const renderCalendar = (month, setMonth, isEndCalendar = false) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<td key={`empty-${i}`} className="text-muted"></td>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = dateStr === customStartDate || dateStr === customEndDate;
      const isInRange = customStartDate && customEndDate &&
        dateStr >= customStartDate && dateStr <= customEndDate;

      days.push(
        <td
          key={day}
          className={`text-center ${isSelected ? 'bg-primary text-white' : isInRange ? 'bg-primary bg-opacity-25' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (selectedRange === 'custom') {
              if (!isEndCalendar) {
                setCustomStartDate(dateStr);
                if (customEndDate && dateStr > customEndDate) {
                  setCustomEndDate(dateStr);
                }
              } else {
                setCustomEndDate(dateStr);
                if (customStartDate && dateStr < customStartDate) {
                  setCustomStartDate(dateStr);
                }
              }
            }
          }}
        >
          {day}
        </td>
      );
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(
        <tr key={`week-${i}`}>
          {days.slice(i, i + 7)}
        </tr>
      );
    }

    return (
      <div className="calendar-container">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setMonth(new Date(year, monthIndex - 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="fw-medium">
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setMonth(new Date(year, monthIndex + 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <table className="table table-sm">
          <thead>
            <tr>
              <th className="text-center text-muted small">Sun</th>
              <th className="text-center text-muted small">Mon</th>
              <th className="text-center text-muted small">Tue</th>
              <th className="text-center text-muted small">Wed</th>
              <th className="text-center text-muted small">Thu</th>
              <th className="text-center text-muted small">Fri</th>
              <th className="text-center text-muted small">Sat</th>
            </tr>
          </thead>
          <tbody>
            {weeks}
          </tbody>
        </table>
      </div>
    );
  };

  const handleUpdate = () => {
    const range = getDateRange(selectedRange);
    onDateRangeChange(range);
    onClose();
  };

  useEffect(() => {
    const range = getDateRange(selectedRange);
    setCustomStartDate(range.startDate);
    setCustomEndDate(range.endDate);
  }, [selectedRange]);

  useEffect(() => {
    if (customStartDate) {
      setCurrentMonth(new Date(customStartDate));
    } else {
      setCurrentMonth(new Date());
    }
    if (customEndDate) {
      setCurrentEndMonth(new Date(customEndDate));
    } else {
      setCurrentEndMonth(new Date());
    }
  }, [customStartDate, customEndDate]);

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="position-absolute bg-white rounded shadow" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Select Date Range</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="row">
            <div className="col-md-4 border-end">
              <div className="list-group list-group-flush">
                {dateRanges.map(range => (
                  <button
                    key={range.id}
                    className={`list-group-item list-group-item-action ${selectedRange === range.id ? 'active' : ''}`}
                    onClick={() => setSelectedRange(range.id)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-md-8">
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <CalendarDays className="text-primary me-2" size={20} />
                    <span className="fw-medium">
                      {selectedRange === 'custom' ? 'Select dates' :
                        `${new Date(customStartDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} - 
                         ${new Date(customEndDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      }
                    </span>
                  </div>
                </div>

                <div className="row">
                  <div className="col-6">
                    <div className="mb-2">
                      <label className="form-label small">Start Date</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    {renderCalendar(currentMonth, setCurrentMonth, false)}
                  </div>
                  <div className="col-6">
                    <div className="mb-2">
                      <label className="form-label small">End Date</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                    {renderCalendar(currentEndMonth, setCurrentEndMonth, true)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top"
            style={{
              position: 'sticky',
              bottom: 0,
              background: '#fff',
              zIndex: 10,
              paddingBottom: '1rem'
            }}
          >
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpdate}>Update</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// MultiSelectCheckbox Component (same as Dashboard.jsx)
const MultiSelectCheckbox = ({
  title,
  options,
  selectedValues,
  onChange,
  icon = "fas fa-list",
  isOpen,
  onToggle
}) => {
  const handleCheckboxChange = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

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
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="options-list-new">
              {options.map((option) => (
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

              {options.length === 0 && (
                <div className="no-options">
                  <i className="fas fa-info-circle me-2"></i>
                  No {title.toLowerCase()} available
                </div>
              )}
            </div>

            {selectedValues.length > 0 && (
              <div className="options-footer">
                <small className="text-muted">
                  {selectedValues.length} of {options.length} selected
                </small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardPlacements = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  // Initialize with today's date
  const getInitialDates = () => {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    return {
      start: todayStr,
      end: todayStr
    };
  };

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [placementsData, setPlacementsData] = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [jobOffers, setJobOffers] = useState([]);
  
  // Filter states
  const [filterData, setFilterData] = useState({
    name: '',
    status: '',
    company: '',
    center: '',
    createdFromDate: null,
    createdToDate: null,
  });

  const [formData, setFormData] = useState({
    projects: { type: "includes", values: [] },
    verticals: { type: "includes", values: [] },
    course: { type: "includes", values: [] },
    center: { type: "includes", values: [] },
    counselor: { type: "includes", values: [] }
  });

  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const totalSelected = Object.values(formData).reduce((total, filter) => total + filter.values.length, 0);

  // Filter options
  const [verticalOptions, setVerticalOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [centerOptions, setCenterOptions] = useState([]);
  const [counselorOptions, setCounselorOptions] = useState([]);

  // Date and period states
  const initialDates = getInitialDates();
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('last30');
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Dropdown states
  const [dropdownStates, setDropdownStates] = useState({
    projects: false,
    verticals: false,
    course: false,
    center: false,
    counselor: false
  });

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#14b8a6', '#ec4899'];

  // Fetch filter options
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
          setCenterOptions(res.data.centers.map(c => ({ value: c._id, label: c.name })));
          setCounselorOptions(res.data.counselors.map(c => ({ value: c._id, label: c.name })));
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch placements data
  const fetchPlacementsData = async () => {
    try {
      setIsLoading(true);
      
      const queryParams = new URLSearchParams({
        page: 1,
        limit: 10000,
        ...(filterData?.createdFromDate && { startDate: filterData.createdFromDate.toISOString() }),
        ...(filterData?.createdToDate && { endDate: filterData.createdToDate.toISOString() }),
        ...(formData?.projects?.values?.length > 0 && { projects: JSON.stringify(formData.projects.values) }),
        ...(formData?.verticals?.values?.length > 0 && { verticals: JSON.stringify(formData.verticals.values) }),
        ...(formData?.course?.values?.length > 0 && { course: JSON.stringify(formData.course.values) }),
        ...(formData?.center?.values?.length > 0 && { center: JSON.stringify(formData.center.values) }),
        ...(formData?.counselor?.values?.length > 0 && { counselor: JSON.stringify(formData.counselor.values) })
      });

      const [
        statusCountsResponse,
        placementsResponse,
        companyJobsResponse,
        jobOffersResponse
      ] = await Promise.all([
        axios.get(`${backendUrl}/college/placementStatus/status-count`, {
          headers: { 'x-auth': token }
        }),
        axios.get(`${backendUrl}/college/placementStatus/candidates?${queryParams}`, {
          headers: { 'x-auth': token }
        }),
        axios.get(`${backendUrl}/college/placementStatus/company-jobs`, {
          headers: { 'x-auth': token }
        }),
        axios.get(`${backendUrl}/college/placementStatus/job-offers`, {
          headers: { 'x-auth': token }
        })
      ]);

      if (statusCountsResponse.data.status) {
        setStatusCounts(statusCountsResponse.data.data?.statusCounts || []);
      }

      if (placementsResponse.data.status) {
        setPlacementsData(placementsResponse.data.data?.placements || []);
      }

      if (companyJobsResponse.data) {
        setCompanyJobs(companyJobsResponse.data?.jobs || companyJobsResponse.data?.data || []);
      }

      if (jobOffersResponse.data) {
        setJobOffers(jobOffersResponse.data?.data || []);
      }
    } catch (error) {
      console.error('Error fetching placements data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacementsData();
  }, [filterData, formData, startDate, endDate]);

  // Handle date range change
  const handleDateRangeChange = (dateRange) => {
    setStartDate(dateRange.startDate);
    setEndDate(dateRange.endDate);
    
    const today = new Date();
    const startDateObj = new Date(dateRange.startDate);
    const endDateObj = new Date(dateRange.endDate);
    const daysDiff = Math.floor((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;

    const formatDateToYYYYMMDD = (date) => {
      return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
    };

    if (daysDiff === 1 && dateRange.startDate === formatDateToYYYYMMDD(today)) {
      setSelectedPeriod('today');
      setUseCustomDate(false);
    } else if (daysDiff === 7) {
      setSelectedPeriod('last7');
      setUseCustomDate(false);
    } else if (daysDiff === 30) {
      setSelectedPeriod('last30');
      setUseCustomDate(false);
    } else {
      setSelectedPeriod('custom');
      setUseCustomDate(true);
    }
  };

  const handleCriteriaChange = (criteria, values) => {
    setFormData((prevState) => ({
      ...prevState,
      [criteria]: {
        type: "includes",
        values: values
      }
    }));
  };

  const toggleDropdown = (filterName) => {
    setDropdownStates(prev => {
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = key === filterName ? !prev[key] : false;
        return acc;
      }, {});
      return newState;
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateFilterChange = (date, fieldName) => {
    setFilterData(prev => ({
      ...prev,
      [fieldName]: date
    }));
  };

  const formatDate = (date) => {
    if (date && !(date instanceof Date)) {
      date = new Date(date);
    }
    if (!date || isNaN(date)) return '';
    return date.toLocaleDateString('en-GB');
  };

  const clearDateFilter = (filterType) => {
    let newFilterData = { ...filterData };
    if (filterType === 'created') {
      newFilterData.createdFromDate = null;
      newFilterData.createdToDate = null;
    }
    setFilterData(newFilterData);
  };

  const clearAllFilters = () => {
    setFilterData({
      name: '',
      status: '',
      company: '',
      center: '',
      createdFromDate: null,
      createdToDate: null,
    });
    setFormData({
      projects: { type: "includes", values: [] },
      verticals: { type: "includes", values: [] },
      course: { type: "includes", values: [] },
      center: { type: "includes", values: [] },
      counselor: { type: "includes", values: [] }
    });
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const uniqueJobIds = new Set();
    companyJobs.forEach(job => {
      if (job._id) uniqueJobIds.add(job._id.toString());
      if (job._job?._id) uniqueJobIds.add(job._job._id.toString());
    });

    const uniqueCompanyIds = new Set();
    placementsData.forEach(p => {
      if (p.companyName) uniqueCompanyIds.add(p.companyName);
      if (p._company?.name) uniqueCompanyIds.add(p._company.name);
    });

    const totalPlacements = placementsData.length;
    const placedCount = statusCounts.find(s => s.statusName?.toLowerCase() === 'placed')?.count || 0;
    
    // Count candidates who have applied to the same job (jobs with multiple applicants)
    const jobApplicantsMap = new Map();
    
    // Process jobOffers from API
    jobOffers.forEach(offer => {
      const jobId = offer._job?._id?.toString() || offer._job?.toString() || null;
      if (jobId) {
        const existing = jobApplicantsMap.get(jobId) || { jobId, candidates: new Set() };
        // Try different ways to get candidate ID
        const candidateId = offer._candidate?._id?.toString() || 
                           offer._candidate?.toString() || 
                           offer.placement?._candidate?._id?.toString() ||
                           offer.placement?._candidate?.toString() ||
                           offer.placement?._id?.toString() ||
                           null;
        if (candidateId) {
          existing.candidates.add(candidateId);
        }
        jobApplicantsMap.set(jobId, existing);
      }
    });
    
    // Also process jobOffers from placementsData
    placementsData.forEach(placement => {
      if (placement.jobOffers && Array.isArray(placement.jobOffers)) {
        placement.jobOffers.forEach(offer => {
          const jobId = offer._job?._id?.toString() || offer._job?.toString() || null;
          if (jobId) {
            const existing = jobApplicantsMap.get(jobId) || { jobId, candidates: new Set() };
            // Get candidate ID from placement
            const candidateId = placement._candidate?._id?.toString() || 
                               placement._candidate?.toString() ||
                               placement._student?._id?.toString() ||
                               placement._student?.toString() ||
                               placement._id?.toString() ||
                               null;
            if (candidateId) {
              existing.candidates.add(candidateId);
            }
            jobApplicantsMap.set(jobId, existing);
          }
        });
      }
    });
    
    // Count total candidates who applied to jobs where more than one candidate applied
    let candidatesWithSameJobApplications = 0;
    jobApplicantsMap.forEach((jobData, jobId) => {
      if (jobData.candidates.size > 1) {
        candidatesWithSameJobApplications += jobData.candidates.size;
      }
    });
    
    const moreThanTwoThird = candidatesWithSameJobApplications;

    let selected = 0, rejected = 0, noResponse = 0;
    jobOffers.forEach(offer => {
      const response = offer.candidateResponse || offer.status;
      if (response === 'accepted' || response === 'selected') {
        selected++;
      } else if (response === 'rejected') {
        rejected++;
      } else {
        noResponse++;
      }
    });

    const offerLetters = jobOffers.filter(offer => 
      offer.status === 'offered' || offer.status === 'active' || offer.candidateResponse === 'accepted'
    ).length;

    // Jobs shared to students (total job offers)
    const jobsSharedToStudents = jobOffers.length;

    // Jobs accepted by candidates
    const jobsAcceptedByCandidates = jobOffers.filter(offer => 
      offer.candidateResponse === 'accepted' || 
      offer.status === 'accepted' ||
      (offer.candidateResponse === 'selected' && offer.status === 'active')
    ).length;

    // Center-wise offers
    const getCenterNameForMetrics = (p) => {
      return p._center?.name || p.center?.name || 
             p._candidate?._center?.name || p._student?._center?.name ||
             p._course?._center?.name ||
             (p.leadAssignment && p.leadAssignment.length > 0 
               ? p.leadAssignment[p.leadAssignment.length - 1]?.centerName 
               : null) || 'Unknown';
    };
    
    const centerWiseMap = new Map();
    placementsData.forEach(p => {
      const centerName = getCenterNameForMetrics(p);
      const centerOffers = p.jobOffers?.filter(jo => 
        jo.status === 'offered' || jo.status === 'active'
      ).length || 0;
      
      const existing = centerWiseMap.get(centerName) || { center: centerName, offers: 0, placements: 0 };
      existing.offers += centerOffers;
      existing.placements += 1;
      centerWiseMap.set(centerName, existing);
    });
    const centerBasedOffers = Array.from(centerWiseMap.values()).reduce((sum, c) => sum + c.offers, 0);

    return {
      uniqueJobs: uniqueJobIds.size,
      moreThanTwoThird,
      totalCompanies: uniqueCompanyIds.size,
      totalApplications: selected + rejected + noResponse,
      selected,
      rejected,
      noResponse,
      offerLetters,
      centerBasedOffers,
      totalPlacements,
      placedCount,
      jobsSharedToStudents,
      jobsAcceptedByCandidates
    };
  }, [placementsData, statusCounts, companyJobs, jobOffers]);

  // Company-wise data
  const companyWiseData = useMemo(() => {
    const companyMap = new Map();
    placementsData.forEach(p => {
      const companyName = p.companyName || p._company?.name || 'Unknown';
      const existing = companyMap.get(companyName) || { 
        company: companyName, 
        placements: 0, 
        offers: 0,
        selected: 0,
        rejected: 0,
        noResponse: 0
      };
      existing.placements += 1;
      
      if (p.jobOffers) {
        p.jobOffers.forEach(offer => {
          if (offer.status === 'offered' || offer.status === 'active') {
            existing.offers += 1;
          }
          const response = offer.candidateResponse || offer.status;
          if (response === 'accepted' || response === 'selected') {
            existing.selected += 1;
          } else if (response === 'rejected') {
            existing.rejected += 1;
          } else {
            existing.noResponse += 1;
          }
        });
      }
      companyMap.set(companyName, existing);
    });
    return Array.from(companyMap.values()).sort((a, b) => b.placements - a.placements);
  }, [placementsData]);

  // Helper function to get center name from placement data
  const getCenterName = (placement) => {
    // Try multiple sources to get center name
    return placement._center?.name ||           // Populated center object
           placement._center?.toString() ||        // Center ID (if not populated)
           placement.center?.name ||              // Alternative field name
           placement.center?.toString() ||       // Center ID (alternative)
           placement._candidate?._center?.name || // From candidate
           placement._candidate?._center?.toString() ||
           placement._student?._center?.name ||    // From student
           placement._student?._center?.toString() ||
           placement._course?._center?.name ||     // From course
           placement._course?._center?.toString() ||
           (placement.leadAssignment && placement.leadAssignment.length > 0 
             ? placement.leadAssignment[placement.leadAssignment.length - 1]?.centerName 
             : null) ||                           // From last lead assignment
           'Unknown';                              // Fallback
  };

  // Center-wise data
  const centerWiseData = useMemo(() => {
    const centerMap = new Map();
    placementsData.forEach(p => {
      const centerName = getCenterName(p);
      const centerOffers = p.jobOffers?.filter(jo => 
        jo.status === 'offered' || jo.status === 'active'
      ).length || 0;
      
      const existing = centerMap.get(centerName) || { center: centerName, offers: 0, placements: 0 };
      existing.offers += centerOffers;
      existing.placements += 1;
      centerMap.set(centerName, existing);
    });
    return Array.from(centerMap.values());
  }, [placementsData]);

  // Candidate-wise job application count
  const candidateJobCountData = useMemo(() => {
    const candidateMap = new Map();
    
    // Process placements data
    placementsData.forEach(placement => {
      const candidateId = placement._candidate?._id?.toString() || 
                         placement._candidate?.toString() ||
                         placement._student?._id?.toString() ||
                         placement._student?.toString() ||
                         placement._id?.toString() ||
                         null;
      
      const candidateName = placement._candidate?.candidateName || 
                           placement._candidate?.name ||
                           placement._student?.candidateName ||
                           placement._student?.name ||
                           placement.candidateName ||
                           'Unknown';
      
      const centerName = getCenterName(placement);
      const statusName = placement.status?.title || placement.status?.statusName || 'Unknown';
      
      if (candidateId) {
        if (!candidateMap.has(candidateId)) {
          candidateMap.set(candidateId, {
            candidateId,
            candidateName,
            center: centerName,
            status: statusName,
            jobCount: 0,
            selected: 0,
            rejected: 0,
            noResponse: 0,
            accepted: 0
          });
        }
        
        const candidateData = candidateMap.get(candidateId);
        
        // Count jobs from placement.jobOffers
        if (placement.jobOffers && Array.isArray(placement.jobOffers)) {
          placement.jobOffers.forEach(offer => {
            candidateData.jobCount++;
            const response = offer.candidateResponse || offer.status;
            if (response === 'accepted' || response === 'selected') {
              candidateData.selected++;
              candidateData.accepted++;
            } else if (response === 'rejected') {
              candidateData.rejected++;
            } else {
              candidateData.noResponse++;
            }
          });
        }
      }
    });
    
    // Also process jobOffers from API
    jobOffers.forEach(offer => {
      const candidateId = offer._candidate?._id?.toString() || 
                         offer._candidate?.toString() ||
                         offer.placement?._candidate?._id?.toString() ||
                         offer.placement?._candidate?.toString() ||
                         offer.placement?._id?.toString() ||
                         null;
      
      if (candidateId && candidateMap.has(candidateId)) {
        const candidateData = candidateMap.get(candidateId);
        candidateData.jobCount++;
        const response = offer.candidateResponse || offer.status;
        if (response === 'accepted' || response === 'selected') {
          candidateData.selected++;
          candidateData.accepted++;
        } else if (response === 'rejected') {
          candidateData.rejected++;
        } else {
          candidateData.noResponse++;
        }
      }
    });
    
    return Array.from(candidateMap.values())
      .sort((a, b) => b.jobCount - a.jobCount); // Sort by job count descending
  }, [placementsData, jobOffers]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    return statusCounts.map(s => ({
      name: s.statusName,
      value: s.count,
      color: s.statusName?.toLowerCase() === 'placed' ? '#10b981' :
             s.statusName?.toLowerCase() === 'unplaced' ? '#ef4444' : '#3b82f6'
    }));
  }, [statusCounts]);

  // Application status chart data
  const applicationStatusData = useMemo(() => {
    return [
      { name: 'Selected', value: metrics.selected, color: '#10b981' },
      { name: 'Rejected', value: metrics.rejected, color: '#ef4444' },
      { name: 'No Response', value: metrics.noResponse, color: '#f59e0b' }
    ];
  }, [metrics]);

  // Monthly trends
  const monthlyTrends = useMemo(() => {
    const trendsMap = new Map();
    placementsData.forEach(placement => {
          if (placement.createdAt) {
            const month = new Date(placement.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short' 
            });
        const existing = trendsMap.get(month) || { 
          month, 
          placements: 0, 
          placed: 0,
          offers: 0
        };
            existing.placements++;
            if (placement.status?.title?.toLowerCase() === 'placed') {
              existing.placed++;
            }
        if (placement.jobOffers) {
          existing.offers += placement.jobOffers.length;
        }
        trendsMap.set(month, existing);
          }
        });
    return Array.from(trendsMap.values())
          .sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [placementsData]);

  // Download functionality
  const downloadTableData = () => {
    const headers = [
      'Company Name',
      'Placements',
      'Job Offers',
      'Selected',
      'Rejected',
      'No Response',
      'Success Rate'
    ];

    const csvRows = [headers.join(',')];

    companyWiseData.forEach((company) => {
      const totalResponses = company.selected + company.rejected + company.noResponse;
      const successRate = totalResponses > 0 
        ? ((company.selected / totalResponses) * 100).toFixed(1) + '%'
        : '0%';

      const csvRow = [
        company.company || '',
        company.placements || 0,
        company.offers || 0,
        company.selected || 0,
        company.rejected || 0,
        company.noResponse || 0,
        successRate
      ].map(field => `"${field}"`).join(',');

      csvRows.push(csvRow);
    });

    const csvContent = csvRows.join('\n');
    const filename = `placements-company-wise-${new Date().toISOString().split('T')[0]}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading Placements Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-4">
            <h1 className="display-5 fw-bold text-dark mb-2">Placements Dashboard</h1>
        <p className="text-muted">Comprehensive analytics and visual records for placements</p>
          </div>

      {/* Advanced Date Picker Modal */}
      {showDatePicker && (
        <AdvancedDatePicker
          onDateRangeChange={handleDateRangeChange}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body d-flex justify-content-end">
          <div className="row justify-content-end g-3 w-100">
            <div className="col-md-12">
              <div className="d-flex justify-content-end align-items-center gap-2">
                <div className="input-group" style={{ maxWidth: '300px' }}>
                  <span className="input-group-text bg-white border-end-0">
                    <i className="fas fa-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    name="name"
                    className="form-control border-start-0"
                    placeholder="Quick search..."
                    value={filterData.name}
                    onChange={handleFilterChange}
                  />
                  {filterData.name && (
                    <button
                      className="btn btn-outline-secondary border-start-0"
                      type="button"
                      onClick={() => {
                        setFilterData(prev => ({ ...prev, name: '' }));
                        fetchPlacementsData();
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowDatePicker(true)}
                  className="btn btn-outline-primary d-flex align-items-center gap-2"
                >
                  <CalendarDays size={18} />
                  {!useCustomDate && selectedPeriod === 'today' ? 'Today' :
                    !useCustomDate && selectedPeriod === 'last7' ? 'Last 7 days' :
                    !useCustomDate && selectedPeriod === 'last30' ? 'Last 30 days' :
                    startDate && endDate && startDate === endDate ?
                      `${new Date(startDate).toLocaleDateString('en-IN')}` :
                    startDate && endDate ?
                      `${new Date(startDate).toLocaleDateString('en-IN')} - ${new Date(endDate).toLocaleDateString('en-IN')}` :
                      'Select Date Range'
                  }
                </button>

                <button
                  onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                  className={`btn ${!isFilterCollapsed ? 'btn-primary' : 'btn-outline-primary'}`}
                >
                  <i className={`fas fa-filter me-1 ${!isFilterCollapsed ? 'fa-spin' : ''}`}></i>
                  Filters
                  {totalSelected > 0 && (
                    <span className="badge bg-light text-dark ms-1">
                      {totalSelected}
                    </span>
                  )}
                </button>

                <button 
                  className="btn btn-primary"
                  onClick={fetchPlacementsData}
                >
                  <RefreshCw size={18} className="me-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards - Small Divs */}
      <div className="row g-3 mb-4">
        <div className="col-12 mb-2">
          <p className="text-muted small mb-0">
            <strong>Data Period:</strong> {
              useCustomDate && startDate && endDate
                ? `${new Date(startDate).toLocaleDateString('en-IN')} - ${new Date(endDate).toLocaleDateString('en-IN')}`
                : selectedPeriod === 'today' ? 'Today'
                  : selectedPeriod === 'yesterday' ? 'Yesterday'
                    : selectedPeriod === 'todayYesterday' ? 'Today and yesterday'
                      : selectedPeriod === 'last7' ? 'Last 7 Days'
                        : selectedPeriod === 'last30' ? 'Last 30 Days'
                          : selectedPeriod === 'thisWeek' ? 'This Week'
                            : selectedPeriod === 'lastWeek' ? 'Last Week'
                              : selectedPeriod === 'thisMonth' ? 'This Month'
                                : selectedPeriod === 'lastMonth' ? 'Last Month'
                                  : selectedPeriod === 'week' ? 'Last 7 Days'
                                    : selectedPeriod === 'month' ? 'Last Month'
                                      : selectedPeriod === 'quarter' ? 'Last Quarter'
                                        : selectedPeriod === 'year' ? 'Last Year'
                                          : selectedPeriod === 'maximum' ? 'All Available Data'
                                            : 'All Time'
            }
            {selectedCenter !== 'all' && ` • Center: ${selectedCenter}`}
          </p>
        </div>

        <div className="col-md-2">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Unique Jobs</p>
                  <p className="h3 fw-bold mb-0">
                    {metrics.uniqueJobs.toLocaleString()}
                  </p>
                </div>
                <Briefcase className="text-primary opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Multi-apply candidates</p>
                  <p className="h3 fw-bold text-success mb-0">
                    {metrics.moreThanTwoThird.toLocaleString()}
                  </p>
                 
                </div>
                <Users className="text-success opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">No. of Companies</p>
                  <p className="h3 fw-bold text-primary mb-0">
                    {metrics.totalCompanies.toLocaleString()}
                  </p>
                </div>
                <Building className="text-primary opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Total Applications</p>
                  <p className="h3 fw-bold text-purple mb-0">
                    {metrics.totalApplications.toLocaleString()}
                  </p>
                </div>
                <FileCheck className="text-purple opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Offer Letters</p>
                  <p className="h3 fw-bold text-success mb-0">
                    {metrics.offerLetters.toLocaleString()}
                  </p>
                </div>
                <FileText className="text-success opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Total Placements</p>
                  <p className="h3 fw-bold text-info mb-0">
                    {metrics.totalPlacements.toLocaleString()}
                  </p>
                  <p className="small text-muted mb-0">
                    {metrics.placedCount} Placed
                  </p>
                </div>
                <UserCheck className="text-info opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Sharing & Acceptance Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm h-100 border-0" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-white-50 small mb-1 fw-medium">Jobs Shared to Students</p>
                  <p className="h2 fw-bold mb-0">
                    {metrics.jobsSharedToStudents.toLocaleString()}
                  </p>
                  <p className="small text-white-50 mb-0 mt-2">
                    <i className="fas fa-arrow-up me-1"></i>
                    Total job offers shared
                  </p>
                </div>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Share2 className="text-white" size={28} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm h-100 border-0" style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(16, 185, 129, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-white-50 small mb-1 fw-medium">Jobs Accepted by Candidates</p>
                  <p className="h2 fw-bold mb-0">
                    {metrics.jobsAcceptedByCandidates.toLocaleString()}
                  </p>
                  <p className="small text-white-50 mb-0 mt-2">
                    <i className="fas fa-percentage me-1"></i>
                    {metrics.jobsSharedToStudents > 0 
                      ? ((metrics.jobsAcceptedByCandidates / metrics.jobsSharedToStudents) * 100).toFixed(1)
                      : 0}% Acceptance Rate
                  </p>
                </div>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle className="text-white" size={28} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Placement Performance Matrix */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <h2 className="h4 fw-semibold mb-4 d-flex align-items-center gap-2">
            <BarChart3 className="text-primary" size={20} />
            Placement Performance Matrix
          </h2>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table table-hover align-middle" style={{ minWidth: 'max-content' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: '#f8f9fa' }}>Counselor</th>
                  <th>Center</th>
                  <th>Total Placements</th>
                  <th>Placed</th>
                  <th>Unplaced</th>
                  <th>Job Offers</th>
                  <th>Selected</th>
                  <th>Rejected</th>
                  <th>No Response</th>
                  <th>Offer Letters</th>
                  <th>Jobs Shared</th>
                  <th>Jobs Accepted</th>
                  <th>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Group placements by counselor
                  const counselorMatrix = new Map();
                  
                  placementsData.forEach(placement => {
                    const counselorName = placement.counsellor?.name || 
                                         placement.leadAssignment?.[placement.leadAssignment.length - 1]?.counsellorName ||
                                         'Not Assigned';
                    const centerName = getCenterName(placement);
                    
                    if (!counselorMatrix.has(counselorName)) {
                      counselorMatrix.set(counselorName, {
                        counselor: counselorName,
                        centers: new Map(),
                        totalPlacements: 0,
                        placed: 0,
                        unplaced: 0,
                        jobOffers: 0,
                        selected: 0,
                        rejected: 0,
                        noResponse: 0,
                        offerLetters: 0,
                        jobsShared: 0,
                        jobsAccepted: 0
                      });
                    }
                    
                    const counselorData = counselorMatrix.get(counselorName);
                    counselorData.totalPlacements++;
                    
                    // Check placement status
                    const statusName = placement.status?.title?.toLowerCase() || placement.status?.statusName?.toLowerCase() || '';
                    if (statusName === 'placed') {
                      counselorData.placed++;
                    } else {
                      counselorData.unplaced++;
                    }
                    
                    // Process job offers
                    if (placement.jobOffers && Array.isArray(placement.jobOffers)) {
                      placement.jobOffers.forEach(offer => {
                        counselorData.jobOffers++;
                        
                        if (offer.status === 'offered' || offer.status === 'active' || offer.status === 'shared') {
                          counselorData.jobsShared++;
                        }
                        
                        if (offer.status === 'offered' || offer.status === 'active' || offer.candidateResponse === 'accepted') {
                          counselorData.offerLetters++;
                        }
                        
                        if (offer.candidateResponse === 'accepted' || offer.status === 'accepted') {
                          counselorData.jobsAccepted++;
                          counselorData.selected++;
                        } else if (offer.candidateResponse === 'rejected' || offer.status === 'rejected') {
                          counselorData.rejected++;
                        } else {
                          counselorData.noResponse++;
                        }
                      });
                    }
                    
                    // Also check jobOffers from API
                    jobOffers.forEach(offer => {
                      const offerCandidateId = offer._candidate?._id?.toString() || 
                                              offer._candidate?.toString() ||
                                              offer.placement?._candidate?._id?.toString() ||
                                              offer.placement?._candidate?.toString() ||
                                              offer.placement?._id?.toString();
                      const placementId = placement._id?.toString() || 
                                         placement._candidate?._id?.toString() ||
                                         placement._student?._id?.toString();
                      
                      if (offerCandidateId === placementId) {
                        counselorData.jobOffers++;
                        
                        if (offer.status === 'offered' || offer.status === 'active' || offer.status === 'shared') {
                          counselorData.jobsShared++;
                        }
                        
                        if (offer.status === 'offered' || offer.status === 'active' || offer.candidateResponse === 'accepted') {
                          counselorData.offerLetters++;
                        }
                        
                        if (offer.candidateResponse === 'accepted' || offer.status === 'accepted') {
                          counselorData.jobsAccepted++;
                          counselorData.selected++;
                        } else if (offer.candidateResponse === 'rejected' || offer.status === 'rejected') {
                          counselorData.rejected++;
                        } else {
                          counselorData.noResponse++;
                        }
                      }
                    });
                    
                    // Track by center
                    if (!counselorData.centers.has(centerName)) {
                      counselorData.centers.set(centerName, 0);
                    }
                    counselorData.centers.set(centerName, counselorData.centers.get(centerName) + 1);
                  });
                  
                  const matrixArray = Array.from(counselorMatrix.values());
                  
                  if (matrixArray.length === 0) {
                    return (
                      <tr>
                        <td colSpan={13} className="text-center py-4 text-muted">
                          No placement performance data available
                        </td>
                      </tr>
                    );
                  }
                  
                  return matrixArray.map((data, idx) => {
                    const totalResponses = data.selected + data.rejected + data.noResponse;
                    const successRate = totalResponses > 0 
                      ? ((data.selected / totalResponses) * 100).toFixed(1)
                      : 0;
                    const centersList = Array.from(data.centers.entries())
                      .map(([name, count]) => `${name} (${count})`)
                      .join(', ') || 'N/A';
                    
                    return (
                      <tr key={idx}>
                        <td style={{ position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'white' }} className="fw-semibold">
                          {data.counselor}
                        </td>
                        <td className="text-muted small">{centersList}</td>
                        <td className="text-center fw-semibold">{data.totalPlacements}</td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-success">{data.placed}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-danger">{data.unplaced}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-primary">{data.jobOffers}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-success">{data.selected}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-danger">{data.rejected}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-warning">{data.noResponse}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-info">{data.offerLetters}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-purple">{data.jobsShared}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-success">{data.jobsAccepted}</span>
                        </td>
                        <td className="text-center">
                          <span className={`badge rounded-pill ${
                            parseFloat(successRate) >= 50 ? 'bg-success' :
                            parseFloat(successRate) >= 30 ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {successRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Application Status Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-0" style={{
            borderLeft: '4px solid #10b981',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(to right, rgba(16, 185, 129, 0.05) 0%, white 4%)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(5px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1 fw-medium">Selected</p>
                  <p className="h2 fw-bold text-success mb-0">{metrics.selected}</p>
                  <p className="small text-muted mb-0 mt-2">
                    <i className="fas fa-chart-line me-1 text-success"></i>
                    {metrics.totalApplications > 0 
                      ? ((metrics.selected / metrics.totalApplications) * 100).toFixed(1)
                      : 0}% of total
                  </p>
                </div>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle className="text-success" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-0" style={{
            borderLeft: '4px solid #ef4444',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(to right, rgba(239, 68, 68, 0.05) 0%, white 4%)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(5px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1 fw-medium">Rejected</p>
                  <p className="h2 fw-bold text-danger mb-0">{metrics.rejected}</p>
                  <p className="small text-muted mb-0 mt-2">
                    <i className="fas fa-chart-line me-1 text-danger"></i>
                    {metrics.totalApplications > 0 
                      ? ((metrics.rejected / metrics.totalApplications) * 100).toFixed(1)
                      : 0}% of total
                  </p>
                </div>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <XCircle className="text-danger" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-0" style={{
            borderLeft: '4px solid #f59e0b',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(to right, rgba(245, 158, 11, 0.05) 0%, white 4%)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(5px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1 fw-medium">No Response</p>
                  <p className="h2 fw-bold text-warning mb-0">{metrics.noResponse}</p>
                  <p className="small text-muted mb-0 mt-2">
                    <i className="fas fa-chart-line me-1 text-warning"></i>
                    {metrics.totalApplications > 0 
                      ? ((metrics.noResponse / metrics.totalApplications) * 100).toFixed(1)
                      : 0}% of total
                  </p>
                </div>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Clock className="text-warning" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        {/* Application Status Pie Chart */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100 border-0" style={{
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h5 fw-semibold mb-0 d-flex align-items-center gap-2">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PieChartIcon className="text-white" size={20} />
                  </div>
                  Application Status Distribution
                </h3>
              </div>
              {applicationStatusData.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No application data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={applicationStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {applicationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100 border-0" style={{
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h5 fw-semibold mb-0 d-flex align-items-center gap-2">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TrendingUp className="text-white" size={20} />
                  </div>
                  Monthly Trends
                </h3>
              </div>
              {monthlyTrends.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No trend data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="placements"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="New Placements"
                    />
                    <Area
                      type="monotone"
                      dataKey="placed"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Placed"
                    />
                    <Bar dataKey="offers" fill="#8b5cf6" name="Job Offers" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h5 fw-semibold mb-0 d-flex align-items-center gap-2">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AlertCircle className="text-white" size={20} />
                  </div>
                  Placement Status Distribution
                </h3>
              </div>
              {statusDistribution.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No status data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Company Wise Table */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <h3 className="h5 fw-semibold mb-0 d-flex align-items-center gap-2">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building className="text-white" size={20} />
              </div>
              Company Wise Statistics
            </h3>
            <button 
              className="btn btn-outline-info btn-sm d-flex align-items-center gap-2"
              onClick={downloadTableData}
              style={{
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 202, 240, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Download size={16} />
              Download CSV
            </button>
          </div>

              <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>S.No</th>
                  <th>Company Name</th>
                  <th className="text-center">Placements</th>
                  <th className="text-center">Job Offers</th>
                  <th className="text-center">Selected</th>
                  <th className="text-center">Rejected</th>
                  <th className="text-center">No Response</th>
                  <th className="text-center">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                {companyWiseData.length === 0 ? (
                      <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No company data available
                        </td>
                      </tr>
                    ) : (
                  companyWiseData.map((company, index) => {
                    const totalResponses = company.selected + company.rejected + company.noResponse;
                    const successRate = totalResponses > 0 
                      ? ((company.selected / totalResponses) * 100).toFixed(1)
                      : 0;
                    return (
                        <tr key={index}>
                        <td>{index + 1}</td>
                        <td className="fw-semibold">{company.company}</td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-primary">{company.placements}</span>
                          </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-purple">{company.offers}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-success">{company.selected}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-danger">{company.rejected}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-warning">{company.noResponse}</span>
                        </td>
                        <td className="text-center">
                          <span className={`badge rounded-pill ${
                            parseFloat(successRate) >= 50 ? 'bg-success' :
                            parseFloat(successRate) >= 30 ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {successRate}%
                            </span>
                          </td>
                        </tr>
                    );
                  })
                    )}
                  </tbody>
                </table>
          </div>
        </div>
      </div>

      {/* Job Sharing & Acceptance Records */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <h3 className="h5 fw-semibold mb-0 d-flex align-items-center gap-2">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Share2 className="text-white" size={20} />
              </div>
              Job Sharing & Acceptance Records
            </h3>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>S.No</th>
                  <th>Candidate Name</th>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th className="text-center">Job Shared</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Response</th>
                  <th className="text-center">Date</th>
                </tr>
              </thead>
              <tbody>
                {jobOffers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No job sharing records available
                    </td>
                  </tr>
                ) : (
                  jobOffers.slice(0, 50).map((offer, index) => {
                    const candidateName = offer._candidate?.candidateName || 
                                         offer._candidate?.name || 
                                         offer.placement?._candidate?.candidateName ||
                                         offer.placement?._candidate?.name ||
                                         'Unknown';
                    const jobTitle = offer._job?.jobTitle || 
                                   offer._job?.title || 
                                   offer.jobTitle ||
                                   'N/A';
                    const companyName = offer._company?.name || 
                                      offer._job?._company?.name ||
                                      offer.companyName ||
                                      'Unknown';
                    const isShared = offer.status === 'offered' || 
                                   offer.status === 'active' || 
                                   offer.status === 'shared';
                    const isAccepted = offer.candidateResponse === 'accepted' || 
                                     offer.status === 'accepted';
                    const response = offer.candidateResponse || offer.status || 'No Response';
                    const shareDate = offer.createdAt || offer.sharedAt || offer.updatedAt;
                    
                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td className="fw-semibold">{candidateName}</td>
                        <td>{jobTitle}</td>
                        <td>{companyName}</td>
                        <td className="text-center">
                          <span className={`badge rounded-pill ${isShared ? 'bg-success' : 'bg-secondary'}`}>
                            {isShared ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`badge rounded-pill ${
                            isAccepted ? 'bg-success' :
                            response === 'rejected' ? 'bg-danger' :
                            response === 'pending' ? 'bg-warning' : 'bg-secondary'
                          }`}>
                            {isAccepted ? 'Accepted' : 
                             response === 'rejected' ? 'Rejected' :
                             response === 'pending' ? 'Pending' : response}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`badge rounded-pill ${
                            isAccepted ? 'bg-success' :
                            response === 'rejected' ? 'bg-danger' : 'bg-warning'
                          }`}>
                            {response}
                          </span>
                        </td>
                        <td className="text-center">
                          {shareDate ? new Date(shareDate).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {jobOffers.length > 50 && (
              <div className="text-center mt-3">
                <p className="text-muted small">
                  Showing first 50 records. Total: {jobOffers.length} job shares
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Individual Candidate Job Application Count */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <h3 className="h5 fw-semibold mb-0 d-flex align-items-center gap-2">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User className="text-white" size={20} />
              </div>
              Individual Candidate Job Applications
            </h3>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>S.No</th>
                  <th>Candidate Name</th>
                  <th>Center</th>
                  <th className="text-center">Total Jobs Applied</th>
                  <th className="text-center">Selected</th>
                  <th className="text-center">Rejected</th>
                  <th className="text-center">No Response</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {candidateJobCountData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No candidate job application data available
                    </td>
                  </tr>
                ) : (
                  candidateJobCountData.map((candidate, index) => (
                    <tr key={candidate.candidateId || index}>
                      <td>{index + 1}</td>
                      <td className="fw-semibold">{candidate.candidateName}</td>
                      <td className="text-muted">{candidate.center}</td>
                      <td className="text-center">
                        <span className="badge rounded-pill bg-primary" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                          {candidate.jobCount}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge rounded-pill bg-success">{candidate.selected}</span>
                      </td>
                      <td className="text-center">
                        <span className="badge rounded-pill bg-danger">{candidate.rejected}</span>
                      </td>
                      <td className="text-center">
                        <span className="badge rounded-pill bg-warning">{candidate.noResponse}</span>
                      </td>
                      <td className="text-center">
                        <span className={`badge rounded-pill ${
                          candidate.status?.toLowerCase() === 'placed' ? 'bg-success' :
                          candidate.status?.toLowerCase() === 'unplaced' ? 'bg-danger' : 'bg-secondary'
                        }`}>
                          {candidate.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {candidateJobCountData.length > 0 && (
              <div className="text-center mt-3">
                <p className="text-muted small">
                  Showing {candidateJobCountData.length} candidates sorted by job application count
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Based Offer Letters */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <h3 className="h5 fw-semibold mb-0 d-flex align-items-center gap-2">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MapPin className="text-white" size={20} />
              </div>
              Center Based Offer Letters
            </h3>
          </div>

              <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>S.No</th>
                  <th>Center Name</th>
                  <th className="text-center">Total Placements</th>
                  <th className="text-center">Offer Letters</th>
                  <th className="text-center">Offer Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                {centerWiseData.length === 0 ? (
                      <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No center data available
                        </td>
                      </tr>
                    ) : (
                  centerWiseData.map((center, index) => {
                    const offerRate = center.placements > 0 
                      ? ((center.offers / center.placements) * 100).toFixed(1)
                      : 0;
                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td className="fw-semibold">{center.center}</td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-primary">{center.placements}</span>
                          </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-purple">{center.offers}</span>
                          </td>
                        <td className="text-center">
                          <span className={`badge rounded-pill ${
                            parseFloat(offerRate) >= 50 ? 'bg-success' :
                            parseFloat(offerRate) >= 30 ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {offerRate}%
                            </span>
                          </td>
                        </tr>
                    );
                  })
                    )}
                  </tbody>
                </table>
              </div>
        </div>
      </div>

      {/* Advanced Filters Modal */}
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
              <div className="modal-header bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-center w-100">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-filter text-primary me-2"></i>
                    <h5 className="fw-bold mb-0 text-dark">Advanced Filters</h5>
                    {totalSelected > 0 && (
                      <span className="badge bg-primary ms-2">
                        {totalSelected} Active
                      </span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={clearAllFilters}
                    >
                      <i className="fas fa-times-circle me-1"></i>
                      Clear All
                    </button>
                    <button
                      className="btn-close"
                      onClick={() => setIsFilterCollapsed(true)}
                      aria-label="Close"
                    ></button>
            </div>
          </div>
        </div>

              <div className="modal-body p-4">
                <div className="row g-4">
                  <div className="col-md-3">
                    <MultiSelectCheckbox
                      title="Project"
                      options={projectOptions}
                      selectedValues={formData?.projects?.values || []}
                      onChange={(values) => handleCriteriaChange('projects', values)}
                      icon="fas fa-sitemap"
                      isOpen={dropdownStates.projects}
                      onToggle={() => toggleDropdown('projects')}
                    />
                  </div>

                  <div className="col-md-3">
                    <MultiSelectCheckbox
                      title="Verticals"
                      options={verticalOptions}
                      selectedValues={formData?.verticals?.values || []}
                      icon="fas fa-sitemap"
                      isOpen={dropdownStates.verticals}
                      onToggle={() => toggleDropdown('verticals')}
                      onChange={(values) => handleCriteriaChange('verticals', values)}
                    />
                        </div>

                  <div className="col-md-3">
                    <MultiSelectCheckbox
                      title="Course"
                      options={courseOptions}
                      selectedValues={formData?.course?.values || []}
                      onChange={(values) => handleCriteriaChange('course', values)}
                      icon="fas fa-graduation-cap"
                      isOpen={dropdownStates.course}
                      onToggle={() => toggleDropdown('course')}
                    />
                      </div>

                  <div className="col-md-3">
                    <MultiSelectCheckbox
                      title="Center"
                      options={centerOptions}
                      selectedValues={formData?.center?.values || []}
                      onChange={(values) => handleCriteriaChange('center', values)}
                      icon="fas fa-building"
                      isOpen={dropdownStates.center}
                      onToggle={() => toggleDropdown('center')}
                    />
                      </div>

                  <div className="col-md-3">
                    <MultiSelectCheckbox
                      title="Counselor"
                      options={counselorOptions}
                      selectedValues={formData?.counselor?.values || []}
                      onChange={(values) => handleCriteriaChange('counselor', values)}
                      icon="fas fa-user-tie"
                      isOpen={dropdownStates.counselor}
                      onToggle={() => toggleDropdown('counselor')}
                    />
                      </div>
                    </div>

                <div className="row g-4 mt-3">
                  <div className="col-12">
                    <h6 className="text-dark fw-bold mb-3">
                      <i className="fas fa-calendar-alt me-2 text-primary"></i>
                      Date Range Filters
                    </h6>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-dark">
                      <i className="fas fa-calendar-plus me-1 text-success"></i>
                      Date Range
                    </label>
                    <div className="card border-0 bg-light p-3">
                      <div className="row g-2">
                        <div className="col-6">
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
                        <div className="col-6">
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

                      <div className="mt-2">
                        <button
                          className="btn btn-sm btn-outline-danger w-100"
                          onClick={() => clearDateFilter('created')}
                          disabled={!filterData.createdFromDate && !filterData.createdToDate}
                        >
                          <i className="fas fa-times me-1"></i>
                          Clear Date Filter
                        </button>
              </div>
            </div>
          </div>
        </div>
      </div>

              <div className="modal-footer bg-light border-top">
                <div className="d-flex justify-content-between align-items-center w-100">
                  <div className="text-muted small">
                    <i className="fas fa-filter me-1"></i>
                    {Object.values(filterData).filter(val => val && val !== 'true').length + totalSelected} filters applied
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
                        fetchPlacementsData();
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

      {/* Custom Styles */}
      <style>{`
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

        .calendar-container table td {
          width: 40px;
          height: 35px;
          vertical-align: middle;
          transition: all 0.2s;
        }
        .calendar-container table td:hover {
          background-color: #f0f0f0;
          cursor: pointer;
        }
        .calendar-container .bg-primary {
          border-radius: 4px;
        }
        .list-group-item {
          border-left: 3px solid transparent;
          transition: all 0.2s;
        }
        .list-group-item.active {
          border-left-color: #0d6efd;
          background-color: #e7f1ff;
          color: #0a58ca;
        }

        .table-hover tbody tr {
          transition: all 0.2s ease;
        }

        .table-hover tbody tr:hover {
          background-color: #f8f9fa;
          transform: translateX(5px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .table thead th {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #dee2e6;
        }

        .form-select, .form-control {
          transition: all 0.3s ease;
        }

        .form-select:focus, .form-control:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
          transform: scale(1.02);
        }

        .card {
          transition: all 0.3s ease;
        }

        .badge {
          transition: all 0.2s ease;
        }

        .badge:hover {
          transform: scale(1.1);
        }

        /* Multi-Select Dropdown Styles */
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
      `}</style>
    </div>
  );
};

export default DashboardPlacements;
