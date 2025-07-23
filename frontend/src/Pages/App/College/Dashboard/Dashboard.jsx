import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-date-picker';

import axios from 'axios';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, TrendingUp, Users, Building, Clock, Target, CheckCircle, XCircle, DollarSign, AlertCircle, UserCheck, FileCheck, AlertTriangle, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

// Add Bootstrap 5 CSS to your index.html or import it in your main app file
// <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">


// Advanced Date Picker Component

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

  // Helper function to format date as YYYY-MM-DD without timezone issues
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
        // today only
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'yesterday':
        // only yesterday
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(startDate); // endDate = startDate = yesterday
        break;
      case 'todayYesterday':
        // yesterday and today
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

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<td key={`empty-${i}`} className="text-muted"></td>);
    }

    // Days of the month
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
    // Update display when range changes
    const range = getDateRange(selectedRange);
    setCustomStartDate(range.startDate);
    setCustomEndDate(range.endDate);
  }, [selectedRange]);

  useEffect(() => {
    // Always set calendar months based on start/end date or fallback to today
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
            {/* Left side - Predefined ranges */}
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

            {/* Right side - Calendars */}
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
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options List */}
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

            {/* Footer with count */}
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

const LeadAnalyticsDashboard = () => {

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;
  // Initialize with today's date
  const getInitialDates = () => {
    const today = new Date();
    // Use the same reliable date formatting method
    const todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    return {
      start: todayStr,
      end: todayStr
    };
  };

  //filter stats

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
    }
  });

  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  const totalSelected = Object.values(formData).reduce((total, filter) => total + filter.values.length, 0);


  const [verticalOptions, setVerticalOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [centerOptions, setCenterOptions] = useState([]);
  const [counselorOptions, setCounselorOptions] = useState([]);

  // Fetch filter options from backend API on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
        const token = userData.token;
        const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
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




  const handleCriteriaChange = (criteria, values) => {
    console.log('values', values, criteria, 'criteria');
    setFormData((prevState) => ({
      ...prevState,
      [criteria]: {
        type: "includes",
        values: values
      }
    }));
    console.log(`Selected ${criteria}:`, values);
    // Reset to first page and fetch with new filters
  };

  const [dropdownStates, setDropdownStates] = useState({
    projects: false,
    verticals: false,
    course: false,
    center: false,
    counselor: false,
    sector: false
  });

  const toggleDropdown = (filterName) => {
    setDropdownStates(prev => {
      // Close all other dropdowns and toggle the current one
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = key === filterName ? !prev[key] : false;
        return acc;
      }, {});
      return newState;
    });
  };

  const [filterData, setFilterData] = useState({
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
    projects: [],
    verticals: [],
    course: [],
    center: [],
    counselor: []

  });

  const clearAllFilters = () => {
    setFilterData({
      name: '',
      courseType: '',
      status: 'true',
      kyc: false,
      leadStatus: '',
      sector: '',
      createdFromDate: null,
      createdToDate: null,
      modifiedFromDate: null,
      modifiedToDate: null,
      nextActionFromDate: null,
      nextActionToDate: null,
    });

  };

  const handleFilterChange = (e) => {
    try {
      const { name, value } = e.target;
      const newFilterData = { ...filterData, [name]: value };
      setFilterData(newFilterData);


      fetchProfileData(newFilterData);

    } catch (error) {
      console.error('Filter change error:', error);
    }
  };

  const handleDateFilterChange = (date, fieldName) => {
    const newFilterData = {
      ...filterData,
      [fieldName]: date
    };
    setFilterData(newFilterData);

  };
  const formatDate = (date) => {
    // If the date is not a valid Date object, try to convert it
    if (date && !(date instanceof Date)) {
      date = new Date(date);
    }

    // Check if the date is valid
    if (!date || isNaN(date)) return ''; // Return an empty string if invalid

    // Now call toLocaleDateString
    return date.toLocaleDateString('en-GB');
  };

  // Clear functions
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
  };

  const initialDates = getInitialDates();
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get today's date for filtering
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Handle date range change from advanced picker
  const handleDateRangeChange = (dateRange) => {
    setStartDate(dateRange.startDate);
    setEndDate(dateRange.endDate);

    // Check if this is a predefined range
    const today = new Date();
    const startDateObj = new Date(dateRange.startDate);
    const endDateObj = new Date(dateRange.endDate);

    // Calculate days difference
    const daysDiff = Math.floor((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;

    // Helper function to format date as YYYY-MM-DD without timezone issues
    const formatDateToYYYYMMDD = (date) => {
      return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
    };

    // Try to match with predefined periods
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

  // Sample data based on actual AppliedCourses schema
  const [appliedCoursesData, setAppliedCoursesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Move this inside the component
  const centers = useMemo(() => {
    if (!appliedCoursesData || appliedCoursesData.length === 0) return [];
    return [...new Set(
      appliedCoursesData
        .filter(lead => lead && lead._center && lead._center.name)
        .map(lead => lead._center.name)
    )].filter(Boolean); // Remove any empty strings
  }, [appliedCoursesData]);

  useEffect(() => {

    fetchProfileData();
  }, [token, backendUrl, startDate, endDate, selectedPeriod, useCustomDate]);

  const fetchProfileData = async (filters = filterData) => {
    try {
      setIsLoading(true);

      if (!token) {
        setAppliedCoursesData([]);
        setIsLoading(false);
        return;
      }

      const queryParams = new URLSearchParams({
        ...(filters?.name && { name: filters.name }),
        ...(filters?.courseType && { courseType: filters.courseType }),
        ...(filters?.status && filters.status !== 'true' && { status: filters.status }),
        ...(filters?.kyc && filters.kyc !== 'false' && { kyc: filters.kyc }),
        ...(filters?.leadStatus && { leadStatus: filters.leadStatus }),
        ...(filters?.sector && { sector: filters.sector }),
        ...(filters?.createdFromDate && { createdFromDate: filters.createdFromDate.toISOString() }),
        ...(filters?.createdToDate && { createdToDate: filters.createdToDate.toISOString() }),
        ...(filters?.modifiedFromDate && { modifiedFromDate: filters.modifiedFromDate.toISOString() }),
        ...(filters?.modifiedToDate && { modifiedToDate: filters.modifiedToDate.toISOString() }),
        ...(filters?.nextActionFromDate && { nextActionFromDate: filters.nextActionFromDate.toISOString() }),
        ...(filters?.nextActionToDate && { nextActionToDate: filters.nextActionToDate.toISOString() }),
        // Multi-select filters
        ...(formData?.projects?.values?.length > 0 && { projects: JSON.stringify(formData.projects.values) }),
        ...(formData?.verticals?.values?.length > 0 && { verticals: JSON.stringify(formData.verticals.values) }),
        ...(formData?.course?.values?.length > 0 && { course: JSON.stringify(formData.course.values) }),
        ...(formData?.center?.values?.length > 0 && { center: JSON.stringify(formData.center.values) }),
        ...(formData?.counselor?.values?.length > 0 && { counselor: JSON.stringify(formData.counselor.values) })
      });
      // If no date filter is selected, send no parameters (will return all data)
      console.log(formData.counselor.values, 'queryParams')
      // Use the new dashboard API with date filtering
      const response = await axios.get(`${backendUrl}/college/dashbord-data?${queryParams}`, {
        headers: {
          'x-auth': token,
        }
      });

      if (response.data.success && response.data.data) {
        setAppliedCoursesData(response.data.data || []);
      } else {
        setAppliedCoursesData([]);
      }

    } catch (error) {
      setAppliedCoursesData([]);
    } finally {
      setIsLoading(false);
    }
  };


  // After fetching data, add a fake substatus to the first lead for testing
  if (appliedCoursesData.length > 0) {
    appliedCoursesData[0]._leadStatus = appliedCoursesData[0]._leadStatus || {};
    appliedCoursesData[0]._leadStatus.substatuses = [{ title: 'Test Substatus' }];
  }

  // Data is now filtered by backend, so we use it directly
  const filteredData = appliedCoursesData;

  // Get daily admissions data
  const getDailyAdmissions = () => {
    const admissionsByDate = {};

    // Use filtered data from backend and apply center filter
    let admissionsToProcess = filteredData.filter(lead => lead && lead.admissionDone && lead.admissionDate);

    // Apply center filter if selected
    if (selectedCenter !== 'all') {
      admissionsToProcess = admissionsToProcess.filter(lead => lead._center && lead._center.name === selectedCenter);
    }

    admissionsToProcess.forEach(lead => {
      if (!lead.admissionDate) return;

      const dateStr = new Date(lead.admissionDate).toLocaleDateString('en-IN');
      if (!admissionsByDate[dateStr]) {
        admissionsByDate[dateStr] = {
          date: dateStr,
          admissions: 0,
          revenue: 0,
          centers: {},
          counselors: {}
        };
      }

      admissionsByDate[dateStr].admissions++;
      if (lead.registrationFee === 'Paid') {
        admissionsByDate[dateStr].revenue += 15000;
      }

      // Track by center
      const centerName = lead._center?.name || 'Unknown';
      if (!admissionsByDate[dateStr].centers[centerName]) {
        admissionsByDate[dateStr].centers[centerName] = 0;
      }
      admissionsByDate[dateStr].centers[centerName]++;

      // Track by counselor
      if (lead.leadAssignment && lead.leadAssignment.length > 0) {
        const counselorName = lead.leadAssignment[lead.leadAssignment.length - 1].counsellorName;
        if (!admissionsByDate[dateStr].counselors[counselorName]) {
          admissionsByDate[dateStr].counselors[counselorName] = 0;
        }
        admissionsByDate[dateStr].counselors[counselorName]++;
      }
    });

    // Convert to array and sort by date
    const sortedAdmissions = Object.values(admissionsByDate).sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-'));
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      return dateB - dateA;
    });

    return sortedAdmissions;
  };

  // Get counselor-status matrix from actual data
  const [expandedStatus, setExpandedStatus] = useState(null);
  const [allStatuses, setAllStatuses] = useState([]);
  const [allSubstatuses, setAllSubstatuses] = useState({});

  useEffect(() => {
    if (appliedCoursesData && appliedCoursesData.length > 0) {
      const statuses = new Set();
      const substatusMap = {};
      appliedCoursesData.forEach(lead => {
        const status = (lead._leadStatus?.title || '').trim();
        if (status) {
          statuses.add(status);
          if (!substatusMap[status]) substatusMap[status] = new Set();
          if (Array.isArray(lead._leadStatus?.substatuses)) {
            lead._leadStatus.substatuses.forEach(sub => {
              if (sub?.title) substatusMap[status].add(sub.title);
            });
          }
        }
      });
      setAllStatuses([...statuses]);
      // Convert substatus sets to arrays
      const subMap = {};
      Object.keys(substatusMap).forEach(status => {
        subMap[status] = Array.from(substatusMap[status]);
      });
      setAllSubstatuses(subMap);
    } else {
      setAllStatuses([]);
      setAllSubstatuses({});
    }
  }, [appliedCoursesData]);

  const getCounselorMatrix = () => {
    const matrix = {};
    // Filter leads based on selected center
    const centerFilteredLeads = selectedCenter === 'all'
      ? filteredData
      : filteredData.filter(lead => lead._center && lead._center.name === selectedCenter);
    // Process each lead
    centerFilteredLeads.forEach(lead => {
      if (lead.leadAssignment && lead.leadAssignment.length > 0) {
        // Get the latest counselor assignment
        const latestAssignment = lead.leadAssignment[lead.leadAssignment.length - 1];
        const counselorName = latestAssignment.counsellorName;
        if (!matrix[counselorName]) {
          matrix[counselorName] = {
            Total: 0,
            KYCDone: 0,
            KYCStage: 0,
            Admissions: 0,
            Dropouts: 0,
            Paid: 0,
            Unpaid: 0,
            ConversionRate: 0,
            DropoutRate: 0,
            // Status and substatus counts will be added dynamically
          };
        }
        // Count by status
        const status = (lead._leadStatus?.title || 'Unknown').trim();
        if (!matrix[counselorName][status]) matrix[counselorName][status] = { count: 0, substatuses: {} };
        matrix[counselorName][status].count++;
        matrix[counselorName].Total++;
        // Count by substatus
        if (Array.isArray(lead._leadStatus?.substatuses) && lead._leadStatus.substatuses.length > 0) {
          const sub = lead._leadStatus.substatuses[0];
          if (sub?.title) {
            if (!matrix[counselorName][status].substatuses[sub.title]) matrix[counselorName][status].substatuses[sub.title] = 0;
            matrix[counselorName][status].substatuses[sub.title]++;
          }
        }
        // KYC metrics
        if (lead.kycStage) matrix[counselorName].KYCStage++;
        if (lead.kyc) matrix[counselorName].KYCDone++;
        // Admission and dropout metrics
        if (lead.admissionDone) matrix[counselorName].Admissions++;
        if (lead.dropout) matrix[counselorName].Dropouts++;
        // Payment metrics
        if (lead.registrationFee === 'Paid') matrix[counselorName].Paid++;
        else matrix[counselorName].Unpaid++;
      }
    });
    // Calculate rates
    Object.keys(matrix).forEach(counselor => {
      const data = matrix[counselor];
      data.ConversionRate = data.Total > 0 ? ((data.Admissions / data.Total) * 100).toFixed(1) : 0;
      data.DropoutRate = data.Total > 0 ? ((data.Dropouts / data.Total) * 100).toFixed(1) : 0;
    });
    return matrix;
  };

  // Get center-wise analytics
  const getCenterAnalytics = () => {
    const centerData = {};

    // Apply center filter if selected
    let dataToProcess = filteredData;
    if (selectedCenter !== 'all') {
      dataToProcess = filteredData.filter(lead => lead._center && lead._center.name === selectedCenter);
    }

    dataToProcess.forEach(lead => {
      const centerName = lead._center?.name || 'Unknown';

      if (!centerData[centerName]) {
        centerData[centerName] = {
          totalLeads: 0,
          assigned: 0,
          due: 0,
          kyc: 0,
          admissions: 0,
          dropouts: 0,
          revenue: 0,
          counselors: {},
          statusCounts: {}
        };
      }

      centerData[centerName].totalLeads++;

      // Count by actual status from database
      const status = (lead._leadStatus?.title || 'Unknown').trim();
      if (!centerData[centerName].statusCounts[status]) {
        centerData[centerName].statusCounts[status] = 0;
      }
      centerData[centerName].statusCounts[status]++;

      if (lead.courseStatus === 1) centerData[centerName].assigned++;
      else centerData[centerName].due++;

      if (lead.kyc) centerData[centerName].kyc++;
      if (lead.admissionDone) centerData[centerName].admissions++;
      if (lead.dropout) centerData[centerName].dropouts++;
      if (lead.registrationFee === 'Paid') centerData[centerName].revenue += 15000; // Assuming 15000 per registration

      // Track counselor performance per center
      if (lead.leadAssignment && lead.leadAssignment.length > 0) {
        const counselor = lead.leadAssignment[lead.leadAssignment.length - 1].counsellorName;

        if (!centerData[centerName].counselors[counselor]) {
          centerData[centerName].counselors[counselor] = {
            leads: 0,
            admissions: 0,
            dropouts: 0,
            kyc: 0
          };
        }

        centerData[centerName].counselors[counselor].leads++;
        if (lead.admissionDone) centerData[centerName].counselors[counselor].admissions++;
        if (lead.dropout) centerData[centerName].counselors[counselor].dropouts++;
        if (lead.kyc) centerData[centerName].counselors[counselor].kyc++;
      }
    });

    return centerData;
  };

  // Get followup analytics
  const getFollowupAnalytics = () => {
    let totalFollowups = 0;
    let doneFollowups = 0;
    let missedFollowups = 0;
    let plannedFollowups = 0;

    // Apply center filter if selected
    let dataToProcess = filteredData;
    if (selectedCenter !== 'all') {
      dataToProcess = filteredData.filter(lead => lead._center && lead._center.name === selectedCenter);
    }

    dataToProcess.forEach(lead => {
      if (lead && lead.followups && Array.isArray(lead.followups) && lead.followups.length > 0) {
        lead.followups.forEach(followup => {
          if (followup && followup.status) {
            totalFollowups++;
            if (followup.status === 'Done') doneFollowups++;
            else if (followup.status === 'Missed') missedFollowups++;
            else if (followup.status === 'Planned') plannedFollowups++;
          }
        });
      }
    });

    return { totalFollowups, doneFollowups, missedFollowups, plannedFollowups };
  };

  const counselorMatrix = getCounselorMatrix();
  const centerAnalytics = getCenterAnalytics();
  const followupStats = getFollowupAnalytics();
  const dailyAdmissions = getDailyAdmissions();

  // Prepare chart data
  const conversionChartData = Object.entries(counselorMatrix).map(([name, data]) => ({
    name,
    conversionRate: parseFloat(data.ConversionRate),
    dropoutRate: parseFloat(data.DropoutRate)
  }));

  // Create status distribution from actual data
  const statusCounts = {};

  // Apply center filter if selected
  let dataToProcess = filteredData;
  if (selectedCenter !== 'all') {
    dataToProcess = filteredData.filter(lead => lead._center && lead._center.name === selectedCenter);
  }

  dataToProcess.forEach(lead => {
    const status = (lead._leadStatus?.title || 'Unknown').trim();
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count
  }));

  // Generate colors for different statuses
  const generateColors = (statuses) => {
    const colorPalette = [
      '#dc2626', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6',
      '#ef4444', '#f97316', '#06b6d4', '#84cc16', '#ec4899'
    ];
    const colors = {};
    statuses.forEach((status, index) => {
      colors[status] = colorPalette[index % colorPalette.length];
    });
    return colors;
  };

  const colors = generateColors(statusDistribution.map(s => s.name));

  // Prepare daily admissions chart data (last 7 days)
  const admissionTrendData = dailyAdmissions.slice(0, 7).reverse().map(day => ({
    date: day.date,
    admissions: day.admissions,
    revenue: day.revenue / 1000 // in thousands
  }));

  function getSubstatusTotal(data, status, substatuses) {
    if (!data[status] || !data[status].substatuses) return 0;
    return substatuses.reduce((sum, sub) => sum + (data[status].substatuses[sub] || 0), 0);
  }

  const getCourseWiseDocStats = () => {
    const courseStats = {};
    filteredData.forEach(lead => {
      const courseName = lead._course?.name || 'Unknown';
      if (!courseStats[courseName]) {
        courseStats[courseName] = {
          totalLeads: 0,
          docsPending: 0,
          docsVerified: 0
        };
      }
      courseStats[courseName].totalLeads++;
      // Count docs for this lead
      if (Array.isArray(lead.uploadedDocs)) {
        lead.uploadedDocs.forEach(doc => {
          if (doc.status === 'Verified') courseStats[courseName].docsVerified++;
          else if (doc.status === 'Pending' || doc.status === 'Not Uploaded') courseStats[courseName].docsPending++;
        });
      }
    });
    return courseStats;
  };

  const getCourseWisePendingDocs = () => {
    const courseDocs = {};
    filteredData.forEach(lead => {
      const courseName = lead._course?.name || 'Unknown';
      if (!courseDocs[courseName]) courseDocs[courseName] = {};
      if (Array.isArray(lead.uploadedDocs)) {
        lead.uploadedDocs.forEach(doc => {
          if (doc.status === 'Pending' || doc.status === 'Not Uploaded') {
            const docName = doc.Name || 'Unknown Document';
            if (!courseDocs[courseName][docName]) courseDocs[courseName][docName] = 0;
            courseDocs[courseName][docName]++;
          }
        });
      }
    });
    return courseDocs;
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold text-dark mb-2">Dashboard</h1>
        <p className="text-muted">Real-time analytics based on Applied Courses data</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading analytics data...</p>
        </div>
      )}

      {/* Show content only when not loading */}
      {!isLoading && (
        <>
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
              <div className="row justify-content-end g-3">
                {/* <div className="col-md-3">
                  <label className="form-label fw-medium">Center:</label>
                  <select 
                    value={selectedCenter} 
                    onChange={(e) => setSelectedCenter(e.target.value)}
                    className="form-select"
                  >
                    <option value="all">All Centers</option>
                    {centers.map(center => (
                      <option key={center} value={center}>{center}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-medium">Date Range:</label>
                  <div className="input-group">
                    <button 
                      className="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center"
                      onClick={() => setShowDatePicker(true)}
                    >
                      <div className="d-flex align-items-center">
                        <CalendarDays className="me-2" size={20} />
                        <span>
                          {!useCustomDate && selectedPeriod === 'today' ? 'Today' :
                            !useCustomDate && selectedPeriod === 'yesterday' ? 'Yesterday' :
                            !useCustomDate && selectedPeriod === 'todayYesterday' ? 'Today and yesterday' :
                            !useCustomDate && selectedPeriod === 'last7' ? 'Last 7 days' :
                            !useCustomDate && selectedPeriod === 'last30' ? 'Last 30 days' :
                            !useCustomDate && selectedPeriod === 'thisWeek' ? 'This week' :
                            !useCustomDate && selectedPeriod === 'lastWeek' ? 'Last week' :
                            !useCustomDate && selectedPeriod === 'thisMonth' ? 'This month' :
                            !useCustomDate && selectedPeriod === 'lastMonth' ? 'Last month' :
                            !useCustomDate && selectedPeriod === 'maximum' ? 'Maximum' :
                            !useCustomDate && selectedPeriod === 'all' ? 'All Time' :
                            startDate && endDate && startDate === endDate ?
                              `${new Date(startDate).toLocaleDateString('en-IN')}` :
                            startDate && endDate ?
                              `${new Date(startDate).toLocaleDateString('en-IN')} - ${new Date(endDate).toLocaleDateString('en-IN')}` :
                            'Select Date Range'
                          }
                        </span>
                      </div>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <button 
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      const dates = getInitialDates();
                      setSelectedCenter('all');
                      setSelectedPeriod('today');
                      setUseCustomDate(false);
                      setStartDate(dates.start);
                      setEndDate(dates.end);
                    }}
                  >
                    Reset Filters
                  </button>
                </div> */}

                <div className="col-md-12">
                  <div className="d-flex justify-content-end align-items-center gap-2">
                    <div className="input-group" style={{ maxWidth: '300px' }}>
                      <span className="input-group-text bg-white border-end-0 input-height">
                        <i className="fas fa-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        name="name"
                        className="form-control border-start-0 m-0"
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
                            fetchProfileData();
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                      className={`btn ${!isFilterCollapsed ? 'btn-primary' : 'btn-outline-primary'}`}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className={`fas fa-filter me-1 ${!isFilterCollapsed ? 'fa-spin' : ''}`}></i>
                      Filters
                      {Object.values(filterData).filter(val => val && val !== 'true').length > 0 && (
                        <span className="bg-light text-dark ms-1">
                          {Object.values(filterData).filter(val => val && val !== 'true').length}
                        </span>
                      )}
                    </button>


                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Alert */}
          {(selectedCenter !== 'all' || (selectedPeriod !== 'all' && selectedPeriod !== 'last30') || (useCustomDate && startDate && endDate)) && (
            <div className="alert alert-info py-2 mb-4 d-flex justify-content-between align-items-center" role="alert">
              <small>
                <strong>Active Filters:</strong>
                {selectedCenter !== 'all' && ` Center: ${selectedCenter}`}
                {!useCustomDate && selectedPeriod !== 'all' && selectedPeriod !== 'last30' && ` • Period: ${selectedPeriod === 'today' ? 'Today' :
                  selectedPeriod === 'yesterday' ? 'Yesterday' :
                    selectedPeriod === 'todayYesterday' ? 'Today and yesterday' :
                      selectedPeriod === 'last7' ? 'Last 7 days' :
                        selectedPeriod === 'last30' ? 'Last 30 days' :
                          selectedPeriod === 'thisWeek' ? 'This week' :
                            selectedPeriod === 'lastWeek' ? 'Last week' :
                              selectedPeriod === 'thisMonth' ? 'This month' :
                                selectedPeriod === 'lastMonth' ? 'Last month' :
                                  selectedPeriod === 'maximum' ? 'Maximum' :
                                    'Custom'
                  }`}
                {useCustomDate && startDate && endDate && ` • Date Range: ${new Date(startDate).toLocaleDateString('en-IN')} to ${new Date(endDate).toLocaleDateString('en-IN')}`}
              </small>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  const dates = getInitialDates();
                  setSelectedCenter('all');
                  setSelectedPeriod('today');
                  setUseCustomDate(false);
                  setStartDate(dates.start);
                  setEndDate(dates.end);
                }}
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Key Metrics Cards */}
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
                      <p className="text-muted small mb-1">Total Leads</p>
                      <p className="h3 fw-bold mb-0">
                        {filteredData.length}
                      </p>
                      <p className="small text-muted mb-0">
                        {filteredData.filter(l => l.courseStatus === 0).length} Due
                      </p>
                    </div>
                    <Users className="text-primary opacity-50" size={32} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-2">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted small mb-1">KYC Done</p>
                      <p className="h3 fw-bold text-purple mb-0">
                        {filteredData.filter(l => l.kyc).length}
                      </p>
                      <p className="small text-muted mb-0">
                        {filteredData.filter(l => l.kycStage && !l.kyc).length} In Progress
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
                      <p className="text-muted small mb-1">Admissions</p>
                      <p className="h3 fw-bold text-success mb-0">
                        {filteredData.filter(l => l.admissionDone).length}
                      </p>
                      <p className="small text-muted mb-0">
                        {filteredData.length > 0 ? ((filteredData.filter(l => l.admissionDone).length / filteredData.length) * 100).toFixed(0) : 0}% Rate
                      </p>
                    </div>
                    <CheckCircle className="text-success opacity-50" size={32} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted small mb-1">Revenue</p>
                      <p className="h3 fw-bold text-success mb-0">
                        ₹{(filteredData.filter(l => l.registrationFee === 'Paid').length * 15000).toLocaleString()}
                      </p>
                      <p className="small text-muted mb-0">
                        {filteredData.filter(l => l.registrationFee === 'Paid').length} Paid
                      </p>
                    </div>
                    <DollarSign className="text-success opacity-50" size={32} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted small mb-1">Dropouts</p>
                      <p className="h3 fw-bold text-danger mb-0">
                        {filteredData.filter(l => l.dropout).length}
                      </p>
                      <p className="small text-muted mb-0">
                        {filteredData.length > 0 ? ((filteredData.filter(l => l.dropout).length / filteredData.length) * 100).toFixed(0) : 0}% Rate
                      </p>
                    </div>
                    <AlertTriangle className="text-danger opacity-50" size={32} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Analytics Matrix */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h2 className="h4 fw-semibold mb-4 d-flex align-items-center gap-2">
                <UserCheck className="text-primary" size={20} />
                Counselor Performance Matrix
              </h2>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th rowSpan={expandedStatus ? 2 : 1}>Counselor</th>
                      {allStatuses.map(status => (
                        <th
                          key={status}
                          colSpan={
                            expandedStatus === status && allSubstatuses[status]?.length > 0
                              ? allSubstatuses[status].length + 1 // +1 for total
                              : 1
                          }
                          className="text-center"
                          style={{ cursor: 'pointer', background: expandedStatus === status ? '#f0f0f0' : undefined }}
                          onClick={() => setExpandedStatus(expandedStatus === status ? null : status)}
                        >
                          {status} <span style={{ fontWeight: 'normal' }}>{expandedStatus === status ? '▲' : '▼'}</span>
                        </th>
                      ))}
                      <th rowSpan={expandedStatus ? 2 : 1}>Total</th>
                      <th rowSpan={expandedStatus ? 2 : 1}>KYC</th>
                      <th rowSpan={expandedStatus ? 2 : 1}>Admissions</th>
                      <th rowSpan={expandedStatus ? 2 : 1}>Dropouts</th>
                      <th rowSpan={expandedStatus ? 2 : 1}>Revenue</th>
                      <th rowSpan={expandedStatus ? 2 : 1}>Conv. Rate</th>
                    </tr>
                    {expandedStatus && allSubstatuses[expandedStatus]?.length > 0 && (
                      <tr>
                        {allStatuses.map(status =>
                          status === expandedStatus
                            ? (
                              <>
                                {allSubstatuses[status].map(sub => (
                                  <th key={sub} className="text-center small text-muted">{sub}</th>
                                ))}
                                <th className="text-center small text-muted">Total</th>
                              </>
                            )
                            : <th key={status}></th>
                        )}
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {Object.entries(counselorMatrix).map(([counselor, data]) => (
                      <tr key={counselor}>
                        <td>{counselor}</td>
                        {allStatuses.map(status =>
                          expandedStatus === status && allSubstatuses[status]?.length > 0
                            ? (
                              <>
                                {allSubstatuses[status].map(sub => (
                                  <td key={sub} className="text-center">
                                    <span className="badge rounded-pill bg-secondary">
                                      {data[status]?.substatuses?.[sub] || 0}
                                    </span>
                                  </td>
                                ))}
                                <td className="text-center">
                                  <span className="badge rounded-pill bg-primary">
                                    {getSubstatusTotal(data, status, allSubstatuses[status])}
                                  </span>
                                </td>
                              </>
                            )
                            : (
                              <td key={status} className="text-center">
                                <span className="badge rounded-pill bg-secondary">
                                  {data[status]?.count || 0}
                                </span>
                              </td>
                            )
                        )}
                        <td className="text-center fw-semibold">{data.Total}</td>
                        <td className="text-center">
                          <span className="text-purple fw-medium">{data.KYCDone}</span>
                          <span className="text-muted small">/{data.KYCStage}</span>
                        </td>
                        <td className="text-center">
                          <span className="text-success fw-medium">{data.Admissions}</span>
                        </td>
                        <td className="text-center">
                          <span className={`fw-medium ${data.Dropouts > 0 ? 'text-danger' : 'text-muted'}`}>{data.Dropouts}</span>
                        </td>
                        <td className="text-center">
                          <span className="text-success fw-medium">₹{(data.Paid * 15000).toLocaleString()}</span>
                        </td>
                        <td className="text-center">
                          <span className={`badge rounded-pill ${data.ConversionRate > 50 ? 'bg-success' :
                            data.ConversionRate > 30 ? 'bg-warning' :
                              'bg-danger'
                            }`}>
                            {data.ConversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="row g-4 mb-4">
            {/* Conversion vs Dropout Chart */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h3 className="h5 fw-semibold mb-4 d-flex align-items-center gap-2">
                    <Target className="text-success" size={20} />
                    Conversion vs Dropout Rates
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={conversionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Bar dataKey="conversionRate" fill="#10b981" name="Conversion Rate" />
                      <Bar dataKey="dropoutRate" fill="#ef4444" name="Dropout Rate" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h3 className="h5 fw-semibold mb-4 d-flex align-items-center gap-2">
                    <AlertCircle className="text-primary" size={20} />
                    Lead Temperature Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[entry.name]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Course-wise Document Status Table */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h2 className="h5 fw-semibold mb-4">Course-wise Document Status</h2>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Course</th>
                      <th>Total Leads</th>
                      <th>Docs Pending</th>
                      <th>Docs Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(getCourseWiseDocStats()).map(([course, stats]) => (
                      <tr key={course}>
                        <td>{course}</td>
                        <td>{stats.totalLeads}</td>
                        <td>{stats.docsPending}</td>
                        <td>{stats.docsVerified}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Course-wise Pending Documents Table */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h2 className="h5 fw-semibold mb-4">Course-wise Pending Documents</h2>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Course</th>
                      <th>Document Name</th>
                      <th>Pending in Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(getCourseWisePendingDocs()).map(([course, docs]) =>
                      Object.entries(docs).map(([docName, count], idx) => (
                        <tr key={course + docName}>
                          <td>{idx === 0 ? course : ''}</td>
                          <td>{docName}</td>
                          <td>{count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Center-wise Analytics */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h2 className="h4 fw-semibold mb-4 d-flex align-items-center gap-2">
                <Building className="text-purple" size={20} />
                Center-wise Performance
              </h2>
              <div className="row g-4">
                {Object.entries(centerAnalytics).map(([center, data]) => (
                  <div key={center} className="col-lg-6">
                    <div className="border rounded p-4">
                      <h3 className="h5 fw-semibold mb-3">{center}</h3>
                      <div className="row g-3 mb-3">
                        <div className="col-4">
                          <p className="text-muted small mb-1">Total Leads</p>
                          <p className="h4 fw-bold mb-0">{data.totalLeads}</p>
                          <p className="text-muted small">{data.assigned} assigned</p>
                        </div>
                        <div className="col-4">
                          <p className="text-muted small mb-1">Admissions</p>
                          <p className="h4 fw-bold text-success mb-0">{data.admissions}</p>
                          <p className="text-muted small">{data.kyc} KYC done</p>
                        </div>
                        <div className="col-4">
                          <p className="text-muted small mb-1">Revenue</p>
                          <p className="h5 fw-bold text-success mb-0">₹{data.revenue.toLocaleString()}</p>
                          <p className="text-danger small">{data.dropouts} dropouts</p>
                        </div>
                      </div>

                      {/* Center-wise Bar Chart */}
                      <div className="row g-3 mb-3">
                        <div className="col-12">
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={[
                              { name: 'Leads', value: data.totalLeads },
                              { name: 'Admissions', value: data.admissions },
                              { name: 'Dropouts', value: data.dropouts },
                              { name: 'KYC', value: data.kyc },
                              { name: 'Revenue', value: data.revenue }
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill="#6366f1" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Center-wise Pie Chart for Status Distribution */}
                      <div className="row g-3 mb-3">
                        <div className="col-12">
                          <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                              <Pie
                                data={Object.entries(data.statusCounts).map(([status, count]) => ({ name: status, value: count }))}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {Object.keys(data.statusCounts).map((status, idx) => (
                                  <Cell key={status} fill={["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#3b82f6", "#8b5cf6", "#84cc16", "#ec4899"][idx % 8]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="border-top pt-3">
                        <p className="small fw-medium text-muted mb-2">Counselor Contribution:</p>
                        {Object.entries(data.counselors).map(([counselor, stats]) => (
                          <div key={counselor} className="d-flex justify-content-between align-items-center small mb-1">
                            <span className="text-muted">{counselor}</span>
                            <div className="text-end">
                              <span className="fw-medium">{stats.leads} leads</span>
                              <span className="text-success ms-2">{stats.admissions} adm</span>
                              {stats.dropouts > 0 && <span className="text-danger ms-2">{stats.dropouts} drop</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Admissions Analytics */}
          <div className="row g-4 mb-4">
            {/* Daily Admissions Table */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h2 className="h4 fw-semibold mb-4 d-flex align-items-center gap-2">
                    <Calendar className="text-indigo" size={20} />
                    Daily Admissions Table
                  </h2>
                  <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th className="text-uppercase small">Date</th>
                          <th className="text-center text-uppercase small">Admissions</th>
                          <th className="text-center text-uppercase small">Revenue</th>
                          <th className="text-uppercase small">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyAdmissions.length > 0 ? (
                          dailyAdmissions.map((day, index) => (
                            <tr key={index} className={day.date === new Date().toLocaleDateString('en-IN') ? 'table-primary' : ''}>
                              <td className="fw-medium">
                                {day.date}
                                {day.date === new Date().toLocaleDateString('en-IN') && (
                                  <span className="ms-2 badge bg-primary">Today</span>
                                )}
                              </td>
                              <td className="text-center">
                                <span className="h5 fw-bold text-success">{day.admissions}</span>
                              </td>
                              <td className="text-center fw-medium text-success">
                                ₹{day.revenue.toLocaleString()}
                              </td>
                              <td>
                                <div>
                                  <div className="small text-muted">
                                    Centers: {Object.entries(day.centers).map(([center, count]) =>
                                      `${center} (${count})`
                                    ).join(', ')}
                                  </div>
                                  <div className="small text-muted">
                                    Counselors: {Object.entries(day.counselors).map(([counselor, count]) =>
                                      `${counselor} (${count})`
                                    ).join(', ')}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-4 text-muted">
                              No admissions data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {dailyAdmissions.length > 0 && (
                        <tfoot className="table-light">
                          <tr>
                            <td className="fw-semibold">Total</td>
                            <td className="text-center fw-bold text-success">
                              {dailyAdmissions.reduce((sum, day) => sum + day.admissions, 0)}
                            </td>
                            <td className="text-center fw-bold text-success">
                              ₹{dailyAdmissions.reduce((sum, day) => sum + day.revenue, 0).toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Admissions Chart */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h2 className="h4 fw-semibold mb-4 d-flex align-items-center gap-2">
                    <TrendingUp className="text-indigo" size={20} />
                    Admission Trends (Last 7 Days)
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={admissionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'revenue') return [`₹${value}k`, 'Revenue'];
                          return [value, 'Admissions'];
                        }}
                      />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="admissions"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                        name="Admissions"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.3}
                        name="Revenue (₹k)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="row g-3 mt-3">
                    <div className="col-6">
                      <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                        <p className="small text-muted mb-1">Today's Admissions</p>
                        <p className="h4 fw-bold text-success mb-0">
                          {dailyAdmissions.find(d => d.date === new Date().toLocaleDateString('en-IN'))?.admissions || 0}
                        </p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 bg-indigo bg-opacity-10 rounded">
                        <p className="small text-muted mb-1">Today's Revenue</p>
                        <p className="h4 fw-bold text-indigo mb-0">
                          ₹{(dailyAdmissions.find(d => d.date === new Date().toLocaleDateString('en-IN'))?.revenue || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Followup Analytics */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h4 fw-semibold mb-4 d-flex align-items-center gap-2">
                <Clock className="text-warning" size={20} />
                Follow-up Analytics
              </h2>
              <div className="row g-3">
                <div className="col-md-3 text-center">
                  <p className="text-muted small mb-1">Total Follow-ups</p>
                  <p className="h3 fw-bold">{followupStats.totalFollowups}</p>
                </div>
                <div className="col-md-3 text-center">
                  <p className="text-muted small mb-1">Completed</p>
                  <p className="h3 fw-bold text-success">{followupStats.doneFollowups}</p>
                </div>
                <div className="col-md-3 text-center">
                  <p className="text-muted small mb-1">Missed</p>
                  <p className="h3 fw-bold text-danger">{followupStats.missedFollowups}</p>
                </div>
                <div className="col-md-3 text-center">
                  <p className="text-muted small mb-1">Planned</p>
                  <p className="h3 fw-bold text-primary">{followupStats.plannedFollowups}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Custom styles for Bootstrap colors not available by default */}
      <style jsx>{`
        .text-purple { color: #6f42c1; }
        .text-indigo { color: #6610f2; }
        .bg-purple { background-color: #6f42c1; }
        .bg-indigo { background-color: #6610f2; }
        .bg-indigo.bg-opacity-10 { background-color: rgba(102, 16, 242, 0.1); }
        .bg-purple.bg-opacity-10 { background-color: rgba(111, 66, 193, 0.1); }
        
        /* Calendar styles */
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
      `}</style>

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
                      selectedValues={formData?.projects?.values}
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
                      selectedValues={formData?.verticals?.values || []}
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
                      selectedValues={formData?.course?.values || []}
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
                      selectedValues={formData?.center?.values || []}
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
                      selectedValues={formData?.counselor?.values || []}
                      onChange={(values) => handleCriteriaChange('counselor', values)}
                      icon="fas fa-user-tie"
                      isOpen={dropdownStates.counselor}
                      onToggle={() => toggleDropdown('counselor')}
                    />
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
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark">
                      <i className="fas fa-calendar-plus me-1 text-success"></i>
                      Lead Creation Date Range
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
                          className="btn btn-sm btn-outline-danger w-100"
                          onClick={() => clearDateFilter('created')}
                          disabled={!filterData.createdFromDate && !filterData.createdToDate}
                        >
                          <i className="fas fa-times me-1"></i>
                          Clear Created Date
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Modified Date Range */}
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark">
                      <i className="fas fa-calendar-edit me-1 text-warning"></i>
                      Lead Modification Date Range
                    </label>
                    <div className="card border-0 bg-light p-3">
                      <div className="row g-2">
                        <div className="col-6">
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
                        <div className="col-6">
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
                      {(filterData.modifiedFromDate || filterData.modifiedToDate) && (
                        <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded">
                          <small className="text-warning">
                            <i className="fas fa-info-circle me-1"></i>
                            <strong>Selected:</strong>
                            {filterData.modifiedFromDate && ` From ${formatDate(filterData.modifiedFromDate)}`}
                            {filterData.modifiedFromDate && filterData.modifiedToDate && ' |'}
                            {filterData.modifiedToDate && ` To ${formatDate(filterData.modifiedToDate)}`}
                          </small>
                        </div>
                      )}

                      {/* Clear button */}
                      <div className="mt-2">
                        <button
                          className="btn btn-sm btn-outline-danger w-100"
                          onClick={() => clearDateFilter('modified')}
                          disabled={!filterData.modifiedFromDate && !filterData.modifiedToDate}
                        >
                          <i className="fas fa-times me-1"></i>
                          Clear Modified Date
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Next Action Date Range */}
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark">
                      <i className="fas fa-calendar-check me-1 text-info"></i>
                      Next Action Date Range
                    </label>
                    <div className="card border-0 bg-light p-3">
                      <div className="row g-2">
                        <div className="col-6">
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
                        <div className="col-6">
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
                          className="btn btn-sm btn-outline-danger w-100"
                          onClick={() => clearDateFilter('nextAction')}
                          disabled={!filterData.nextActionFromDate && !filterData.nextActionToDate}
                        >
                          <i className="fas fa-times me-1"></i>
                          Clear Next Action Date
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="alert alert-info">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-info-circle me-2"></i>
                        <div>

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
                        fetchProfileData(filterData);
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

      <style>
        {

          `
          
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
.react-calendar{
width:min-content !important;
height:min-content !important;
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
              .nav-tabs-main > li > button{
              padding: 15px 9px;
              }
}
text tspan{
font-size: 15px !important;
}
   
            `
        }

      </style>
    </div>


  );
};

export default LeadAnalyticsDashboard;