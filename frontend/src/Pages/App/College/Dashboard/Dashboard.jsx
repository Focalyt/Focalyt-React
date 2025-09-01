import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-date-picker';

import axios from 'axios';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, Doughnut } from 'recharts';
import { Calendar, TrendingUp, Users, Building, Clock, Target, CheckCircle, XCircle, DollarSign, AlertCircle, UserCheck, FileCheck, AlertTriangle, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
// import {Doughnut } from 'react-chartjs-2';
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

  const [allProfiles, setAllProfiles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [stats, setStats] = useState({
    totalCount: 0,
    unverifiedCount: 0,
    verifiedCount: 0
  });
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [showPreVerificationDatePicker, setShowPreVerificationDatePicker] = useState(false);

  // Lead tracking state
  const [leadData, setLeadData] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [studentListLoading, setStudentListLoading] = useState(true);
  const [studentListError, setStudentListError] = useState(null);

  useEffect(() => {

    fetchWeeklyStats();
    fetchSourceLeads();
  }, []);


  const fetchWeeklyStats = async () => {
    try {
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      const response = await axios.get(
        `${backendUrl}/college/candidate/pre-verification-weekly-stats`,
        { headers: { 'x-auth': token } }
      );

      if (response.data.success) {
        setWeeklyStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  };
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleSearch = () => {
    setLoading(true);
    fetchStats();
  };

  const handleClearFilters = () => {
    setSelectedDate('');
    setLoading(true);
    fetchStats();
  };

  const handleShowAll = () => {
    setSelectedDate('');
    setLoading(true);
    fetchStats();
  };

  // Keyboard shortcut for search (Enter key)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && selectedDate) {
      handleSearch();
    }
  };

  const handlePreVerificationDateSelect = (startDate, endDate) => {
    setSelectedDate(startDate);
    setShowPreVerificationDatePicker(false);
    fetchStats();
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
    counselor: [],
    leadSource: [],

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



  useEffect(() => {
    fetchStats();
  }, [filterData, startDate, endDate])


  const fetchStats = async (filters = filterData) => {
    try {
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      setIsLoading(true);

      if (!token) {
        setAppliedCoursesData([]);
        setIsLoading(false);
        return;
      }

      const queryParams = new URLSearchParams({
        ...(filters?.createdFromDate && { startDate: filters.createdFromDate.toISOString() }),
        ...(filters?.createdToDate && { endDate: filters.createdToDate.toISOString() }),


      });
      const response = await axios.get(
        `${backendUrl}/college/candidate/preVerifieedCount?${queryParams}`,
        { headers: { 'x-auth': token } }
      );
      // const response = await axios.get(
      //   `${backendUrl}/college/candidate/pre-verification-stats?${queryParams}`,
      //   { headers: { 'x-auth': token } }
      // );
      console.log("response", response.data)


      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSourceLeads();
  }, [filterData, startDate, endDate])

  const fetchSourceLeads = async (filters = filterData) => {
    try {
      setIsLoading(true);

      if (!token) {
        setAppliedCoursesData([]);
        setIsLoading(false);
        return;
      }

      const queryParams = new URLSearchParams({

        ...(filters?.createdFromDate && { startDate: filters.createdFromDate.toISOString() }),
        ...(filters?.createdToDate && { endDate: filters.createdToDate.toISOString() }),


      });
      // If no date filter is selected, send no parameters (will return all data)
      console.log(formData.counselor.values, 'queryParams')


      const response = await axios.get(`${backendUrl}/college/digitalLead/sourceLeadsData?${queryParams}`, {
        headers: { 'x-auth': token }
      });

      // const response = await axios.get(`${backendUrl}/college/digitalLead/sourceLeadsData?startDate=${startDate}&endDate=${endDate}`, {
      //   headers: { 'x-auth': token }
      // });

      console.log('Source leads response:', response.data);

      if (response.data.status) {
        setLeadData(response.data.data);
        console.log('Source leads data set:', response.data.data);
      } else {
        alert(response.data.msg);
      }
    } catch (error) {
      console.error('Error fetching source leads:', error);
      alert(error.message || 'An unexpected error occurred.');
    }
    finally {
      setIsLoading(false);
    }
  };

  const fetchStudentList = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/student/list`, {
        headers: {
          'x-auth': token
        }
      })
    }
    catch (err) {

    }
  }

  // Sample data based on actual AppliedCourses schema
  const [appliedCoursesData, setAppliedCoursesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New state for counselor performance matrix from API
  const [counselorMatrixData, setCounselorMatrixData] = useState({});
  const [counselorMatrixLoading, setCounselorMatrixLoading] = useState(false);
  const [sourceLeadsLoading, setSourceLeadsLoading] = useState(false);
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

  // Fetch counselor matrix data when filters change
  useEffect(() => {
    fetchCounselorMatrixData();
  }, [token, backendUrl, startDate, endDate, selectedCenter, filterData, formData]);

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

  // Function to fetch counselor performance matrix from API
  const fetchCounselorMatrixData = async () => {
    try {
      setCounselorMatrixLoading(true);

      if (!token) {
        setCounselorMatrixData({});
        setCounselorMatrixLoading(false);
        return;
      }

      // Use the same filter structure as fetchProfileData
      const queryParams = new URLSearchParams({
        // Use advanced filter dates if available, otherwise use basic date filters
        ...(filterData?.createdFromDate ? { startDate: filterData.createdFromDate.toLocaleDateString('en-CA') } : (startDate && { startDate })),
        ...(filterData?.createdToDate ? { endDate: filterData.createdToDate.toLocaleDateString('en-CA') } : (endDate && { endDate })),
        ...(selectedCenter !== 'all' && { centerId: selectedCenter }),
        // Advanced filters from filterData
        ...(filterData?.courseType && { courseType: filterData.courseType }),
        // Multi-select filters
        ...(formData?.projects?.values?.length > 0 && { projects: JSON.stringify(formData.projects.values) }),
        ...(formData?.verticals?.values?.length > 0 && { verticals: JSON.stringify(formData.verticals.values) }),
        ...(formData?.course?.values?.length > 0 && { course: JSON.stringify(formData.course.values) }),
        ...(formData?.center?.values?.length > 0 && { center: JSON.stringify(formData.center.values) }),
        ...(formData?.counselor?.values?.length > 0 && { counselor: JSON.stringify(formData.counselor.values) })
      });

      console.log('Counselor Matrix queryParams', queryParams)

      const response = await axios.get(`${backendUrl}/college/counselor-performance-matrix?${queryParams}`, {
        headers: {
          'x-auth': token,
        }
      });

      if (response.data.status && response.data.data) {
        setCounselorMatrixData(response.data.data);
      } else {
        setCounselorMatrixData({});
      }

    } catch (error) {
      console.error('Error fetching counselor matrix data:', error);
      setCounselorMatrixData({});
    } finally {
      setCounselorMatrixLoading(false);
    }
  };

  const downloadTableData = () => {
    if (!groupedStatusData || Object.keys(groupedStatusData).length === 0) {
      alert('No data available to download');
      return;
    }

    // Create CSV content
    const headers = [
      'Project',
      'Course',
      'Center',
      'Counsellor Name',
      'Total Leads',
      'Pending for KYC',
      'KYC Done',
      'Admission Done',
      'Batch Assigned',
      'In Zero Period (At Center)',
      'In Batch Freezed',
      'DropOut',
      'Leads vs Admission %',
      'Admission vs AtCenter %'
    ];

    const csvRows = [headers.join(',')];

    Object.entries(groupedStatusData).forEach(([courseName, centers]) => {
      Object.entries(centers).forEach(([centerName, counsellors]) => {
        counsellors.forEach((row) => {
          const leadsVsAdmission = row.totalLeads > 0
            ? ((row.admissionDoneIds?.length || 0) / row.totalLeads * 100).toFixed(1) + '%'
            : '0%';

          const admissionVsAtCenter = row.inZeroPeriodIds && row.inZeroPeriodIds.length > 0 && row.admissionDoneIds && row.admissionDoneIds.length > 0
            ? ((row.inZeroPeriodIds.length / row.admissionDoneIds.length) * 100).toFixed(1) + '%'
            : '0%';

          const csvRow = [
            row.projectName || '',
            courseName,
            centerName,
            row.counsellorName || '',
            row.totalLeads || 0,
            row.pendingKYC || 0,
            row.kycDone || 0,
            row.admissionDone || 0,
            row.batchAssigned || 0,
            row.inZeroPeriod || 0,
            row.inBatchFreezed || 0,
            row.dropOut || 0,
            leadsVsAdmission,
            admissionVsAtCenter
          ].map(field => `"${field}"`).join(',');

          csvRows.push(csvRow);
        });
      });
    });

    const csvContent = csvRows.join('\n');
    const filename = `counsellor-status-table-${new Date().toISOString().split('T')[0]}.csv`;

    // Download the file
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
        if (status && status !== 'Untouch Leads') { // Exclude "Untouch Leads" from dynamic columns
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

  // Use API data for counselor matrix instead of local calculation
  const counselorMatrix = counselorMatrixData;
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

  // ====== NEW: Course-Counsellor Status Table ======
  const getCourseCounsellorStatusMatrix = () => {
    // Group data by course, then by counsellor
    const matrix = {};
    filteredData.forEach(lead => {
      const course = lead._course?.name || 'Unknown';
      let counsellor = 'Unknown';
      if (lead.leadAssignment && lead.leadAssignment.length > 0) {
        counsellor = lead.leadAssignment[lead.leadAssignment.length - 1].counsellorName;
      }
      if (!matrix[course]) matrix[course] = {};
      if (!matrix[course][counsellor]) {
        matrix[course][counsellor] = {
          'Pending for KYC': 0,
          'KYC Done': 0,
          'Admission Done': 0,
          'Batch Assigned': 0,
          'In Zero Period': 0,
          'In Batch Freezed': 0,
          'DropOut': 0
        };
      }
      // Status mapping logic (customize as per your data)
      if (!lead.kyc && lead.kycStage) matrix[course][counsellor]['Pending for KYC']++;
      if (lead.kyc) matrix[course][counsellor]['KYC Done']++;
      // Admission Done: count only if admissionDate exists
      if (lead.admissionDate) matrix[course][counsellor]['Admission Done']++;
      if (lead.batchAssigned) matrix[course][counsellor]['Batch Assigned']++;
      if (lead.inZeroPeriod) matrix[course][counsellor]['In Zero Period']++;
      if (lead.inBatchFreezed) matrix[course][counsellor]['In Batch Freezed']++;
      if (lead.dropout) matrix[course][counsellor]['DropOut']++;
    });
    return matrix;
  };

  const [drilldown, setDrilldown] = useState({
    open: false,
    loading: false,
    leads: [],
    group: null,
    statusType: '',
    statusLabel: '',
  });


  // ====== NEW: Course-Counsellor Status Table (API Integrated) ======
  const [counsellorStatusData, setCounsellorStatusData] = useState([]);
  const [counsellorStatusLoading, setCounsellorStatusLoading] = useState(true);
  const [counsellorStatusError, setCounsellorStatusError] = useState(null);

  // Date filter state for counsellor status table
  const [counsellorStatusDateFrom, setCounsellorStatusDateFrom] = useState('');
  const [counsellorStatusDateTo, setCounsellorStatusDateTo] = useState('');
  const [showAllTime, setShowAllTime] = useState(false);
  const [showCounsellorDatePicker, setShowCounsellorDatePicker] = useState(false);

  // Transform API data into nested structure: Course > Center > Counsellor
  const groupedStatusData = useMemo(() => {
    const grouped = {};
    counsellorStatusData.forEach(row => {
      if (!row.courseName) row.courseName = 'Unknown';
      if (!row.centerName) row.centerName = 'Unknown';
      if (!row.counsellorName) row.counsellorName = 'Unknown';
      if (!grouped[row.courseName]) grouped[row.courseName] = {};
      if (!grouped[row.courseName][row.centerName]) grouped[row.courseName][row.centerName] = [];
      grouped[row.courseName][row.centerName].push(row);
    });
    return grouped;
  }, [counsellorStatusData]);

  // Function to fetch counsellor status data with date filters
  const fetchCounsellorStatusData = async (dateFrom = '', dateTo = '', showAllTime = false) => {
    setDrilldown({ open: false, loading: false, leads: [], group: null, statusType: '', statusLabel: '' });
    setCounsellorStatusLoading(true);
    setCounsellorStatusError(null);

    try {
      const params = new URLSearchParams();
      if (showAllTime) {
        params.append('allTime', 'true');
      } else if (dateFrom && dateTo) {
        params.append('dateFrom', dateFrom);
        params.append('dateTo', dateTo);
      }

      const url = `${backendUrl}/college/counsellor-status-table${params.toString() ? '?' + params.toString() : ''}`;

      const res = await axios.get(url, {
        headers: {
          'x-auth': token
        }
      });

      setCounsellorStatusData(res.data.data || []);
      setCounsellorStatusLoading(false);
    } catch (err) {
      setCounsellorStatusError('Failed to load counsellor status table');
      setCounsellorStatusLoading(false);
      console.error('Error fetching counsellor status data:', err);
    }
  };

  // Function to handle date filter changes
  const handleCounsellorStatusDateFilter = () => {
    fetchCounsellorStatusData(counsellorStatusDateFrom, counsellorStatusDateTo, false);
  };

  // Function to show all time data
  const showAllTimeData = () => {
    setCounsellorStatusDateFrom('');
    setCounsellorStatusDateTo('');
    setShowAllTime(true);
    fetchCounsellorStatusData('', '', true);
  };

  // Function to clear date filters
  const clearCounsellorStatusDateFilter = () => {
    setCounsellorStatusDateFrom('');
    setCounsellorStatusDateTo('');
    setShowAllTime(false);
    fetchCounsellorStatusData();
  };

  // Function to handle date selection from modern date picker
  const handleCounsellorDateSelect = (startDate, endDate) => {
    setCounsellorStatusDateFrom(startDate);
    setCounsellorStatusDateTo(endDate);
    setShowAllTime(false);
    fetchCounsellorStatusData(startDate, endDate, false);
  };

  useEffect(() => {
    fetchCounsellorStatusData();
  }, []);

  // Modern Date Picker Component for Counsellor Status Table
  const ModernDatePicker = ({ isOpen, onClose, onDateSelect }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedStartDate, setSelectedStartDate] = useState(null);
    const [selectedEndDate, setSelectedEndDate] = useState(null);
    const [selectedQuickRange, setSelectedQuickRange] = useState('custom');

    const today = new Date();

    const quickRanges = [
      { id: 'today', label: 'Today' },
      { id: 'yesterday', label: 'Yesterday' },
      { id: 'todayYesterday', label: 'Today and yesterday' },
      { id: 'last7', label: 'Last 7 days' },
      { id: 'last14', label: 'Last 14 days' },
      { id: 'last28', label: 'Last 28 days' },
      { id: 'last30', label: 'Last 30 days' },
      { id: 'thisWeek', label: 'This week' },
      { id: 'thisMonth', label: 'This month' },
      { id: 'lastMonth', label: 'Last month' },
      { id: 'maximum', label: 'Maximum' },
      { id: 'custom', label: 'Custom' }
    ];

    const getDaysInMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    const formatDisplayDate = (date) => {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getQuickRangeDates = (rangeId) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let startDate = new Date(today);
      let endDate = new Date(today);

      switch (rangeId) {
        case 'today':
          return { startDate, endDate };
        case 'yesterday':
          startDate.setDate(today.getDate() - 1);
          endDate = new Date(startDate);
          return { startDate, endDate };
        case 'todayYesterday':
          startDate.setDate(today.getDate() - 1);
          return { startDate, endDate };
        case 'last7':
          startDate.setDate(today.getDate() - 6);
          return { startDate, endDate };
        case 'last14':
          startDate.setDate(today.getDate() - 13);
          return { startDate, endDate };
        case 'last28':
          startDate.setDate(today.getDate() - 27);
          return { startDate, endDate };
        case 'last30':
          startDate.setDate(today.getDate() - 29);
          return { startDate, endDate };
        case 'thisWeek':
          startDate.setDate(today.getDate() - today.getDay());
          return { startDate, endDate };
        case 'thisMonth':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          return { startDate, endDate };
        case 'lastMonth':
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          endDate = new Date(today.getFullYear(), today.getMonth(), 0);
          return { startDate, endDate };
        case 'maximum':
          startDate = new Date('2020-01-01');
          return { startDate, endDate };
        default:
          return { startDate: null, endDate: null };
      }
    };

    const handleQuickRangeSelect = (rangeId) => {
      setSelectedQuickRange(rangeId);
      if (rangeId !== 'custom') {
        const { startDate, endDate } = getQuickRangeDates(rangeId);
        setSelectedStartDate(startDate);
        setSelectedEndDate(endDate);
      } else {
        setSelectedStartDate(null);
        setSelectedEndDate(null);
      }
    };

    const isDateInRange = (date) => {
      if (!selectedStartDate || !selectedEndDate) return false;
      const checkDate = new Date(date);
      return checkDate >= selectedStartDate && checkDate <= selectedEndDate;
    };

    const isDateSelected = (date) => {
      const checkDate = new Date(date);
      return (selectedStartDate && formatDate(checkDate) === formatDate(selectedStartDate)) ||
        (selectedEndDate && formatDate(checkDate) === formatDate(selectedEndDate));
    };

    const handleDateClick = (day) => {
      const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

      if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        setSelectedStartDate(clickedDate);
        setSelectedEndDate(null);
        setSelectedQuickRange('custom');
      } else {
        if (clickedDate >= selectedStartDate) {
          setSelectedEndDate(clickedDate);
          setSelectedQuickRange('custom');
        } else {
          setSelectedStartDate(clickedDate);
          setSelectedEndDate(selectedStartDate);
          setSelectedQuickRange('custom');
        }
      }
    };

    const handleApply = () => {
      if (selectedStartDate && selectedEndDate) {
        onDateSelect(formatDate(selectedStartDate), formatDate(selectedEndDate));
        onClose();
      }
    };

    const handleCancel = () => {
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      setSelectedQuickRange('custom');
      onClose();
    };

    const renderCalendar = () => {
      const daysInMonth = getDaysInMonth(currentMonth);
      const firstDay = getFirstDayOfMonth(currentMonth);
      const days = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        days.push(<td key={`empty-${i}`} className="p-1"></td>);
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const isToday = formatDate(date) === formatDate(today);
        const isFuture = date > today;
        const isInRange = isDateInRange(date);
        const isSelected = isDateSelected(date);

        let className = "p-1 text-center";
        let buttonClassName = "w-100 h-100 border-0 rounded d-flex align-items-center justify-content-center";
        let buttonStyle = { minHeight: '32px', minWidth: '32px' };

        if (isFuture) {
          buttonClassName += " text-muted bg-transparent";
        } else if (isToday) {
          buttonClassName += " text-primary fw-bold bg-transparent";
        } else if (isSelected) {
          buttonClassName += " bg-primary text-white";
        } else if (isInRange) {
          buttonClassName += " bg-primary bg-opacity-25 text-primary";
        } else {
          buttonClassName += " bg-transparent hover:bg-light";
        }

        days.push(
          <td key={day} className={className}>
            <button
              className={buttonClassName}
              onClick={() => !isFuture && handleDateClick(day)}
              disabled={isFuture}
              style={buttonStyle}
            >
              {day}
            </button>
          </td>
        );
      }

      return days;
    };

    if (!isOpen) return null;

    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="bg-white rounded-lg shadow-lg" style={{ maxWidth: '700px', width: '95%' }}>
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h5 className="mb-0">Select Date Range</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="d-flex">
            {/* Left Panel - Quick Select Options */}
            <div className="border-end p-3" style={{ width: '180px', backgroundColor: '#f8f9fa' }}>
              <h6 className="mb-3 small fw-bold">Quick Select</h6>
              <div className="d-flex flex-column gap-1">
                {quickRanges.map((range) => (
                  <div key={range.id} className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="quickRange"
                      id={range.id}
                      checked={selectedQuickRange === range.id}
                      onChange={() => handleQuickRangeSelect(range.id)}
                    />
                    <label className="form-check-label small" htmlFor={range.id}>
                      {range.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Calendar */}
            <div className="flex-grow-1 p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                >
                  ←
                </button>
                <h6 className="mb-0">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h6>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  disabled={currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()}
                >
                  →
                </button>
              </div>

              <table className="w-100 table table-borderless">
                <thead>
                  <tr>
                    <th className="p-1 text-center text-muted small fw-normal">Sun</th>
                    <th className="p-1 text-center text-muted small fw-normal">Mon</th>
                    <th className="p-1 text-center text-muted small fw-normal">Tue</th>
                    <th className="p-1 text-center text-muted small fw-normal">Wed</th>
                    <th className="p-1 text-center text-muted small fw-normal">Thu</th>
                    <th className="p-1 text-center text-muted small fw-normal">Fri</th>
                    <th className="p-1 text-center text-muted small fw-normal">Sat</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const allDays = renderCalendar();
                    const weeks = [];
                    for (let i = 0; i < allDays.length; i += 7) {
                      weeks.push(allDays.slice(i, i + 7));
                    }
                    return weeks.map((week, weekIndex) => (
                      <tr key={weekIndex}>
                        {week}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-top p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Selected Range:</span>
                <span className="fw-bold small">
                  {selectedStartDate && selectedEndDate
                    ? `${formatDisplayDate(selectedStartDate)} - ${formatDisplayDate(selectedEndDate)}`
                    : 'No date range selected'
                  }
                </span>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={handleCancel}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleApply}
                  disabled={!selectedStartDate || !selectedEndDate}
                >
                  Update
                </button>
              </div>
            </div>
            <div className="mt-2">
              <small className="text-muted">Dates are shown in local timezone</small>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add a new function to fetch lead details by IDs
  const fetchLeadDetailsByIds = async (ids, statusLabel) => {
    setDrilldown({ open: true, loading: true, leads: [], group: null, statusType: '', statusLabel });
    try {

      const res = await axios.post(`${backendUrl}/college/lead-details-by-ids`, { ids }, { headers: { 'x-auth': token } });
      console.log(res, 'res')
      // const res = await axios.get(url, { headers: { 'x-auth': token } });
      setDrilldown(prev => ({ ...prev, loading: false, leads: res.data.data || [] }));
    } catch (err) {
      setDrilldown(prev => ({ ...prev, loading: false, leads: [] }));
      alert('Failed to fetch lead details');
    }
  };

  // ====== DOWNLOAD FUNCTIONS ======

  // Function to convert data to CSV format
  const convertToCSV = (data) => {
    console.log('Converting data to CSV:', data);
    if (!data || Object.keys(data).length === 0) {
      console.log('No data available for CSV conversion');
      return '';
    }

    const headers = [
      'Project',
      'Course',
      'Center',
      'Counsellor Name',
      'Total Leads',
      'Pending for KYC',
      'KYC Done',
      'Admission Done',
      'Batch Assigned',
      'In Zero Period (At Center)',
      'In Batch Freezed',
      'DropOut',
      'Leads vs Admission %',
      'Admission vs AtCenter %'
    ];

    const csvRows = [headers.join(',')];

    Object.entries(data).forEach(([courseName, centers]) => {
      Object.entries(centers).forEach(([centerName, counsellors]) => {
        counsellors.forEach((row) => {
          const leadsVsAdmission = row.totalLeads > 0
            ? ((row.admissionDoneIds?.length || 0) / row.totalLeads * 100).toFixed(1) + '%'
            : '0%';

          const admissionVsAtCenter = row.inZeroPeriodIds && row.inZeroPeriodIds.length > 0 && row.admissionDoneIds && row.admissionDoneIds.length > 0
            ? ((row.inZeroPeriodIds.length / row.admissionDoneIds.length) * 100).toFixed(1) + '%'
            : '0%';

          const csvRow = [
            row.projectName || '',
            courseName,
            centerName,
            row.counsellorName || '',
            row.totalLeads || 0,
            row.pendingKYC || 0,
            row.kycDone || 0,
            row.admissionDone || 0,
            row.batchAssigned || 0,
            row.inZeroPeriod || 0,
            row.inBatchFreezed || 0,
            row.dropOut || 0,
            leadsVsAdmission,
            admissionVsAtCenter
          ].map(field => `"${field}"`).join(',');

          csvRows.push(csvRow);
        });
      });
    });

    const result = csvRows.join('\n');
    console.log('CSV content generated:', result.substring(0, 200) + '...');
    return result;
  };



  // Function to download as Excel (XLSX)
  const downloadExcel = async () => {
    console.log('Starting Excel download...');
    console.log('Grouped status data:', groupedStatusData);

    if (!groupedStatusData || Object.keys(groupedStatusData).length === 0) {
      alert('No data available to download');
      return;
    }

    try {
      // Dynamic import to avoid bundling issues
      const XLSX = await import('xlsx');
      console.log('XLSX library loaded successfully');

      const worksheetData = [];
      const headers = [
        'Project',
        'Course',
        'Center',
        'Counsellor Name',
        'Total Leads',
        'Pending for KYC',
        'KYC Done',
        'Admission Done',
        'Batch Assigned',
        'In Zero Period (At Center)',
        'In Batch Freezed',
        'DropOut',
        'Leads vs Admission %',
        'Admission vs AtCenter %'
      ];

      worksheetData.push(headers);

      Object.entries(groupedStatusData).forEach(([courseName, centers]) => {
        Object.entries(centers).forEach(([centerName, counsellors]) => {
          counsellors.forEach((row) => {
            const leadsVsAdmission = row.totalLeads > 0
              ? ((row.admissionDoneIds?.length || 0) / row.totalLeads * 100).toFixed(1) + '%'
              : '0%';

            const admissionVsAtCenter = row.inZeroPeriodIds && row.inZeroPeriodIds.length > 0 && row.admissionDoneIds && row.admissionDoneIds.length > 0
              ? ((row.inZeroPeriodIds.length / row.admissionDoneIds.length) * 100).toFixed(1) + '%'
              : '0%';

            worksheetData.push([
              row.projectName || '',
              courseName,
              centerName,
              row.counsellorName || '',
              row.totalLeads || 0,
              row.pendingKYC || 0,
              row.kycDone || 0,
              row.admissionDone || 0,
              row.batchAssigned || 0,
              row.inZeroPeriod || 0,
              row.inBatchFreezed || 0,
              row.dropOut || 0,
              leadsVsAdmission,
              admissionVsAtCenter
            ]);
          });
        });
      });

      console.log('Worksheet data prepared:', worksheetData.length, 'rows');

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Counsellor Status');

      // Auto-size columns
      const colWidths = headers.map(header => ({ wch: Math.max(header.length, 15) }));
      worksheet['!cols'] = colWidths;

      const fileName = `counsellor-status-table-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      console.log('Excel download completed:', fileName);
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      alert('Failed to download Excel file. Please try downloading as CSV instead.');
    }
  };

  // Function to show download options dropdown
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  // Test function to check data availability
  const testDataAvailability = () => {
    console.log('=== DATA AVAILABILITY TEST ===');
    console.log('groupedStatusData:', groupedStatusData);
    console.log('Object.keys(groupedStatusData):', Object.keys(groupedStatusData));
    console.log('Data length:', Object.keys(groupedStatusData).length);

    if (Object.keys(groupedStatusData).length > 0) {
      const firstCourse = Object.keys(groupedStatusData)[0];
      const firstCenter = Object.keys(groupedStatusData[firstCourse])[0];
      const firstRow = groupedStatusData[firstCourse][firstCenter][0];
      console.log('Sample row data:', firstRow);
    }
  };

  // Fallback download method using window.open
  const downloadFallback = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };



  // Close download dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadDropdown && !event.target.closest('.dropdown')) {
        setShowDownloadDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadDropdown]);

  // Browser compatibility check
  const checkBrowserSupport = () => {
    console.log('=== BROWSER COMPATIBILITY CHECK ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Blob support:', typeof Blob !== 'undefined');
    console.log('URL.createObjectURL support:', typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'undefined');
    console.log('Download attribute support:', 'download' in document.createElement('a'));

    const isChrome = /Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);

    console.log('Browser detected:', {
      Chrome: isChrome,
      Firefox: isFirefox,
      Safari: isSafari,
      Edge: isEdge
    });
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

          {/* Modern Date Picker for Counsellor Status Table */}
          <ModernDatePicker
            isOpen={showCounsellorDatePicker}
            onClose={() => setShowCounsellorDatePicker(false)}
            onDateSelect={handleCounsellorDateSelect}
          />

          {/* Modern Date Picker for Pre-Verification Dashboard */}
          <ModernDatePicker
            isOpen={showPreVerificationDatePicker}
            onClose={() => setShowPreVerificationDatePicker(false)}
            onDateSelect={handlePreVerificationDateSelect}
          />

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
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="table table-hover align-middle" style={{ minWidth: 'max-content' }}>
                  <thead className="table-light">
                    <tr>
                      <th rowSpan={expandedStatus ? 2 : 1} style={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: '#f8f9fa' }}>Counselor</th>
                      <th rowSpan={expandedStatus ? 2 : 1}>Leads</th>
                      <th rowSpan={expandedStatus ? 2 : 1}>Untouch</th>
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
                      <th rowSpan={expandedStatus ? 2 : 1}>KYC</th>
                      <th rowSpan={expandedStatus ? 2 : 1}>Admissions</th>
                      <th rowSpan={expandedStatus ? 2 : 1}>Dropouts</th>
                      <th rowSpan={expandedStatus ? 2 : 1}>Batch Assigned</th>
                      <th rowSpan={expandedStatus ? 2 : 1}>Batch Freezed</th>
                      <th rowSpan={expandedStatus ? 2 : 1}>Zero Period</th>
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
                    {counselorMatrixLoading ? (
                      <tr>
                        <td colSpan={allStatuses.length + 10} className="text-center py-4">
                          <div className="d-flex justify-content-center align-items-center">
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            Loading counselor performance data...
                          </div>
                        </td>
                      </tr>
                    ) : Object.keys(counselorMatrix).length === 0 ? (
                      <tr>
                        <td colSpan={allStatuses.length + 10} className="text-center py-4 text-muted">
                          No counselor performance data available for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(counselorMatrix).map(([counselor, data]) => (
                        <tr key={counselor}>
                          <td style={{ position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'white' }}>{counselor}</td>
                          <td className="text-center fw-semibold">{data.Leads}</td>
                          <td className="text-center">
                            <span className="text-warning fw-medium">{data.Untouch || 0}</span>
                          </td>
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
                            <span className="text-info fw-medium">{data.BatchAssigned || 0}</span>
                          </td>
                          <td className="text-center">
                            <span className="text-warning fw-medium">{data.BatchFreezed || 0}</span>
                          </td>
                          <td className="text-center">
                            <span className="text-primary fw-medium">{data.ZeroPeriod || 0}</span>
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
                      ))
                    )}
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

          {/* ====== NEW: Course-Counsellor Status Table ====== */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h5 fw-semibold mb-0">Course-Counsellor Status Table</h2>

                {/* Date Filter Controls */}
                <div className="d-flex gap-2 align-items-center">
                  <button
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                    onClick={() => setShowCounsellorDatePicker(true)}
                    disabled={counsellorStatusLoading}
                  >
                    <CalendarDays size={16} />
                    {counsellorStatusDateFrom && counsellorStatusDateTo
                      ? `${counsellorStatusDateFrom} to ${counsellorStatusDateTo}`
                      : 'Select Date Range'
                    }
                  </button>
                  <button
                    className={`btn btn-sm ${showAllTime ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={showAllTimeData}
                    disabled={counsellorStatusLoading}
                  >
                    All Time
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={clearCounsellorStatusDateFilter}
                    disabled={counsellorStatusLoading}
                  >
                    Today
                  </button>

                  {/* Download Button */}
                  <div className="position-relative">
                    <button
                      className="btn btn-outline-info btn-sm d-flex align-items-center gap-1"
                      type="button"
                      onClick={() => {
                        console.log('Download button clicked, current state:', showDownloadDropdown);
                        downloadTableData();
                        console.log('New state will be:', !showDownloadDropdown);
                      }}
                      disabled={counsellorStatusLoading || Object.keys(groupedStatusData).length === 0}
                    >
                      <i className="fas fa-download"></i>
                      Download
                      <i className="fas fa-chevron-down ms-1"></i>
                    </button>
                  </div>
                </div>
              </div>
              {counsellorStatusLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading counsellor status data...</p>
                </div>
              ) : counsellorStatusError ? (
                <div className="alert alert-danger">{counsellorStatusError}</div>
              ) : (
                <div className="table-container" style={{ maxHeight: '600px', overflow: 'auto' }}>
                  <table className="table table-bordered align-middle table-fixed">
                    <thead className="table-light sticky-header">
                      <tr>
                        <th style={{ minWidth: '120px', width: '120px' }}>Project</th>
                        <th style={{ minWidth: '150px', width: '150px' }}>Course</th>
                        <th style={{ minWidth: '150px', width: '150px' }}>Center</th>
                        <th style={{ minWidth: '150px', width: '150px' }}>Counsellor Name</th>
                        <th style={{ minWidth: '120px', width: '120px' }}>Total Leads</th>
                        <th style={{ minWidth: '140px', width: '140px' }}>Pending for KYC</th>
                        <th style={{ minWidth: '120px', width: '120px' }}>KYC Done</th>
                        <th style={{ minWidth: '140px', width: '140px' }}>Admission Done</th>
                        <th style={{ minWidth: '140px', width: '140px' }}>Batch Assigned</th>
                        <th style={{ minWidth: '180px', width: '180px' }}>In Zero Period (At Center)</th>
                        <th style={{ minWidth: '150px', width: '150px' }}>In Batch Freezed</th>
                        <th style={{ minWidth: '120px', width: '120px' }}>DropOut</th>
                        <th style={{ minWidth: '160px', width: '160px' }}>Leads vs Admission %</th>
                        <th style={{ minWidth: '180px', width: '180px' }}>Admission vs AtCenter %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(groupedStatusData).length === 0 ? (
                        <tr><td colSpan={14} className="text-center">No data found</td></tr>
                      ) : (
                        Object.entries(groupedStatusData).map(([courseName, centers]) => {
                          const courseRowSpan = Object.values(centers).reduce((sum, arr) => sum + arr.length, 0);
                          let courseRendered = false;
                          return Object.entries(centers).map(([centerName, counsellors], centerIdx) => {
                            const centerRowSpan = counsellors.length;
                            let centerRendered = false;
                            return counsellors.map((row, idx) => {
                              const renderCourse = !courseRendered;
                              const renderCenter = !centerRendered;
                              const tr = (
                                <tr key={`${courseName}-${centerName}-${row.counsellorId || row.counsellorName}`}>
                                  {/* Project column left blank for now, can be filled if available in row */}
                                  {renderCourse && (
                                    <td rowSpan={courseRowSpan}>{row.projectName || ''}</td>
                                  )}
                                  {renderCourse && (
                                    <td rowSpan={courseRowSpan}>{courseName}</td>
                                  )}
                                  {renderCenter && (
                                    <td rowSpan={centerRowSpan}>{centerName}</td>
                                  )}
                                  <td>{row.counsellorName}</td>
                                  <td className="text-center clickable-cell" onClick={() => fetchLeadDetailsByIds(row.totalLeadIds, 'Total Leads')}>{row.totalLeads}</td>
                                  <td className="text-center clickable-cell" onClick={() => fetchLeadDetailsByIds(row.pendingKYCIds, 'Pending for KYC')}>{row.pendingKYC}</td>
                                  <td className="text-center clickable-cell" onClick={() => fetchLeadDetailsByIds(row.kycDoneIds, 'KYC Done')}>{row.kycDone}</td>
                                  <td className="text-center clickable-cell" onClick={() => fetchLeadDetailsByIds(row.admissionDoneIds, 'Admission Done')}>{row.admissionDone}</td>
                                  <td className="text-center clickable-cell" onClick={() => fetchLeadDetailsByIds(row.batchAssignedIds, 'Batch Assigned')}>{row.batchAssigned}</td>
                                  <td className="text-center clickable-cell" onClick={() => fetchLeadDetailsByIds(row.inZeroPeriodIds, 'In Zero Period')}>{row.inZeroPeriod}</td>
                                  <td className="text-center clickable-cell" onClick={() => fetchLeadDetailsByIds(row.inBatchFreezedIds, 'In Batch Freezed')}>{row.inBatchFreezed}</td>
                                  <td className="text-center clickable-cell" onClick={() => fetchLeadDetailsByIds(row.dropOutIds, 'DropOut')}>{row.dropOut}</td>
                                  <td className="text-center">
                                    {row.totalLeads > 0
                                      ? ((row.admissionDoneIds.length / row.totalLeads) * 100).toFixed(1) + '%'
                                      : '0%'}
                                  </td>
                                  <td className="text-center">
                                    {row.inZeroPeriodIds && row.inZeroPeriodIds.length > 0
                                      ? ((row.inZeroPeriodIds.length / row.admissionDoneIds.length) * 100).toFixed(1) + '%'
                                      : '0%'}
                                  </td>
                                </tr>
                              );
                              if (!courseRendered) courseRendered = true;
                              if (!centerRendered) centerRendered = true;
                              return tr;
                            });
                          });
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="container-fluid">

            {/* Stats Cards */}
            <div className="row mb-4 ">


              <div className="col-6 border-right">

                <div className="row">
                  <div className="col-12">
                    <h2 className="mb-4">Pre-Verification Dashboard</h2>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="card bg-primary text-white">
                      <div className="card-body">
                        <h5 className="card-title">Total Pre Verified</h5>
                        <h2 className="card-text">{loading ? '...' : stats.verifiedCount}</h2>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-success text-white">
                      <div className="card-body">
                        <h5 className="card-title">Total Pre Unverified</h5>
                        <h2 className="card-text">{loading ? '...' : stats.unverifiedCount}</h2>
                      </div>
                    </div>
                  </div>
                  <div className="col-10">
                    <div className="row justify-content-center">
                      <div className="col-md-12">
                        <div className="card">
                          <div className="card-body">
                            <h5 className="card-title">Verified vs Unverified</h5>
                            {loading ? (
                              <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              </div>
                            ) : stats.verifiedCount > 0 ? (
                              <PieChart width={300} height={300}>
                                <Pie
                                  data={[
                                    { name: 'Verified', value: stats.verifiedCount ? stats.verifiedCount : 0 },
                                    { name: 'Unverified', value: stats.unverifiedCount ? stats.unverifiedCount : 0 },
                                  ]}
                                  cx={150}
                                  cy={150}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  <Cell fill="#ff6384" />
                                  <Cell fill="#36a2eb" />
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            ) : (
                              <div className="text-center py-4 text-muted">
                                No data available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* <div className="col-6">
                <div className="row justify-content-center">
                  <div className="col-md-12">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Verified vs Unverified</h5>
                        {loading ? (
                          <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : stats.verifiedCount > 0 ? (
                          <PieChart width={300} height={300}>
                            <Pie
                              data={[
                                { name: 'Verified', value: stats.verifiedCount ? stats.verifiedCount : 0 },
                                { name: 'Unverified', value: stats.unverifiedCount ? stats.unverifiedCount : 0 },
                              ]}
                              cx={150}
                              cy={150}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell fill="#ff6384" />
                              <Cell fill="#36a2eb" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        ) : (
                          <div className="text-center py-4 text-muted">
                            No data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* <div className="col-md-4">
                <div className="card bg-info text-white">
                  <div className="card-body">
                    <h5 className="card-title">Completion Rate</h5>
                    <h2 className="card-text">
                      {loading ? '...' : stats.totalCount > 0 ? Math.round((stats.verifiedCount / stats.totalCount) * 100) : 0}%
                    </h2>
                  </div>
                </div>
              </div> */}

              <div className="col-md-6">
                <div className="row">
                  <div className="col-12">
                    <div className="card shadow-sm mb-4">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h2 className="h5 fw-semibold mb-0 d-flex align-items-center gap-2">
                            <Users className="text-primary" size={20} />
                            Lead Sources Overview
                          </h2>

                        </div>

                        {/* Enhanced Lead Sources Summary Cards */}
                        <div className="row g-3 mb-4">
                          {leadData.loading && (
                            <div className="col-12 text-center">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <p className="mt-2 text-muted">Loading lead data...</p>
                            </div>
                          )}

                          {leadData.error && (
                            <div className="col-12">
                              <div className="alert alert-danger" role="alert">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                Error loading lead data: {leadData.error}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Detailed Lead Sources Table */}
                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Source Name</th>
                                <th>Total Leads</th>

                              </tr>
                            </thead>
                            <tbody>
                              {leadData.length > 0 ? (
                                leadData.map((source, index) => {
                                  return (
                                    <tr key={index}>
                                      <td>{source?.registeredBy?.name || 'Self registered'}</td>
                                      <td>{source?.leadCount || 0}</td>
                                    </tr>
                                  )
                                })
                              ) : (
                                <tr>
                                  <td colSpan="6" className="text-center text-muted">
                                    <i className="fas fa-inbox me-2"></i>
                                    No lead sources data available
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Lead Source Performance Charts */}
                        <div className="row mt-4">
                          <div className="col-md-8">
                            <div className="card border-0 bg-light">
                              <div className="card-body">
                                <h6 className="card-title mb-3">Lead Source Performance Trend</h6>
                                {leadData.loading ? (
                                  <div style={{ height: '250px' }} className="d-flex align-items-center justify-content-center">
                                    <div className="text-center">
                                      <div className="spinner-border text-primary mb-2" role="status"></div>
                                      <p className="mb-0 text-muted">Loading chart data...</p>
                                    </div>
                                  </div>
                                ) : leadData.error ? (
                                  <div style={{ height: '250px' }} className="d-flex align-items-center justify-content-center text-danger">
                                    <div className="text-center">
                                      <i className="fas fa-exclamation-triangle mb-2" style={{ fontSize: '2rem' }}></i>
                                      <p className="mb-0">Error loading chart data</p>
                                      <small>{leadData.error}</small>
                                    </div>
                                  </div>
                                ) : leadData.leadStats?.monthlyTrend?.length > 0 ? (
                                  <div style={{ height: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={leadData.leadStats.monthlyTrend.map(item => ({
                                        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
                                        [item._id.source]: item.count
                                      }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                          type="monotone"
                                          dataKey="website"
                                          stroke="#007bff"
                                          strokeWidth={2}
                                          name="Website"
                                        />
                                        <Line
                                          type="monotone"
                                          dataKey="facebook"
                                          stroke="#28a745"
                                          strokeWidth={2}
                                          name="Facebook"
                                        />
                                        <Line
                                          type="monotone"
                                          dataKey="google"
                                          stroke="#ffc107"
                                          strokeWidth={2}
                                          name="Google"
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                ) : (
                                  <div style={{ height: '250px' }} className="d-flex align-items-center justify-content-center text-muted">
                                    <div className="text-center">
                                      <i className="fas fa-chart-line mb-2" style={{ fontSize: '2rem' }}></i>
                                      <p className="mb-0">No trend data available</p>
                                      <small>Monthly lead generation trends will appear here</small>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="card border-0 bg-light">
                              <div className="card-body">
                                <h6 className="card-title mb-3">Source Distribution</h6>
                                <div className="d-flex flex-column gap-3">
                                  {leadData.loading ? (
                                    <div className="text-center">
                                      <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                      <small className="text-muted">Loading...</small>
                                    </div>
                                  ) : leadData.error ? (
                                    <div className="text-center text-danger">
                                      <i className="fas fa-exclamation-triangle"></i>
                                      <small>Error loading data</small>
                                    </div>
                                  ) : leadData.sourceLeads?.summary ? (
                                    <>
                                      <div>
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                          <span className="small fw-semibold">Portal Leads</span>
                                          <span className="badge bg-primary">
                                            {leadData.sourceLeads.summary.totalLeads > 0
                                              ? ((leadData.sourceLeads.summary.portalLeads / leadData.sourceLeads.summary.totalLeads) * 100).toFixed(1)
                                              : 0}%
                                          </span>
                                        </div>
                                        <div className="progress" style={{ height: '10px' }}>
                                          <div
                                            className="progress-bar bg-primary"
                                            style={{
                                              width: `${leadData.sourceLeads.summary.totalLeads > 0
                                                ? (leadData.sourceLeads.summary.portalLeads / leadData.sourceLeads.summary.totalLeads) * 100
                                                : 0}%`
                                            }}
                                          ></div>
                                        </div>
                                      </div>

                                      <div>
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                          <span className="small fw-semibold">Third Party</span>
                                          <span className="badge bg-success">
                                            {leadData.sourceLeads.summary.totalLeads > 0
                                              ? ((leadData.sourceLeads.summary.thirdPartyLeads / leadData.sourceLeads.summary.totalLeads) * 100).toFixed(1)
                                              : 0}%
                                          </span>
                                        </div>
                                        <div className="progress" style={{ height: '10px' }}>
                                          <div
                                            className="progress-bar bg-success"
                                            style={{
                                              width: `${leadData.sourceLeads.summary.totalLeads > 0
                                                ? (leadData.sourceLeads.summary.thirdPartyLeads / leadData.sourceLeads.summary.totalLeads) * 100
                                                : 0}%`
                                            }}
                                          ></div>
                                        </div>
                                      </div>

                                      {/* Top Sources Breakdown */}
                                      {leadData.leadStats?.topSources?.slice(0, 3).map((source, index) => (
                                        <div key={index}>
                                          <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="small fw-semibold text-capitalize">
                                              {source._id ? source._id.replace('_', ' ') : 'Unknown Source'}
                                            </span>
                                            <span className="badge bg-secondary">
                                              {source.count}
                                            </span>
                                          </div>
                                          <div className="progress" style={{ height: '8px' }}>
                                            <div
                                              className="progress-bar bg-secondary"
                                              style={{
                                                width: `${leadData.sourceLeads.summary.totalLeads > 0
                                                  ? (source.count / leadData.sourceLeads.summary.totalLeads) * 100
                                                  : 0}%`
                                              }}
                                            ></div>
                                          </div>
                                        </div>
                                      ))}
                                    </>
                                  ) : (
                                    <div className="text-center text-muted">
                                      <i className="fas fa-chart-pie"></i>
                                      <small>No data available</small>
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
                </div>
              </div>
            </div>

          </div>

        </>
      )}

      {/* Custom styles for Bootstrap colors not available by default */}
      <style jsx>{`
      .border-right{
      border-right:1px solid ;
      }
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
        
        /* Frozen Header Table Styles */
        .table-container {
          position: relative;
          border: 1px solid #dee2e6;
          border-radius: 0.375rem;
          background: white;
        }
        
        .table-container .table {
          margin-bottom: 0;
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: #f8f9fa;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .sticky-header th {
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
          font-weight: 600;
          color: #495057;
          white-space: nowrap;
          padding: 12px 8px;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .table-fixed {
          table-layout: fixed;
          width: 100%;
        }
        
        .table-fixed th,
        .table-fixed td {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 8px;
          vertical-align: middle;
          border: 1px solid #dee2e6;
        }
        
        .clickable-cell {
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .clickable-cell:hover {
          background-color: #e3f2fd !important;
          color: #1976d2;
        }
        
        /* Scrollbar styling */
        .table-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .table-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .table-container::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        .table-container::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        /* Ensure header stays on top during scroll */
        .table-container thead {
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        /* Table body scroll optimization */
        .table-container tbody {
          position: relative;
        }
        
        /* Row hover effects */
        .table-container tbody tr:hover {
          background-color: #f8f9fa;
        }
        
        /* Ensure proper border rendering */
        .table-container .table-bordered {
          border: 1px solid #dee2e6;
        }
        
        .table-container .table-bordered th,
        .table-container .table-bordered td {
          border: 1px solid #dee2e6;
        }
        
        /* Header shadow for better visual separation */
        .sticky-header::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.1), transparent);
          pointer-events: none;
        }
        
        /* Download dropdown styles */
        .dropdown-menu {
          border: 1px solid #dee2e6;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
          border-radius: 0.375rem;
          padding: 0.5rem 0;
          min-width: 200px;
        }
        
        .dropdown-item {
          padding: 0.5rem 1rem;
          color: #495057;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        
        .dropdown-item:hover {
          background-color: #f8f9fa;
          color: #212529;
        }
        
        .dropdown-item:active {
          background-color: #e9ecef;
        }
        
        .dropdown-item i {
          width: 16px;
          text-align: center;
        }
        
        /* Force dropdown visibility */
        .dropdown-menu.show {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Ensure dropdown is above other elements */
        .dropdown.position-relative {
          z-index: 1001;
        }
        
        /* Debug styles */
        .debug-dropdown {
          background-color: #ff0000 !important;
          color: white !important;
          border: 2px solid yellow !important;
        }
      `}</style>

      {drilldown.open && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">{drilldown.statusLabel} - Lead Details</h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setDrilldown({ open: false, loading: false, leads: [], group: null, statusType: '', statusLabel: '' })}
              >
                Close
              </button>
            </div>
            {drilldown.loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : drilldown.leads.length === 0 ? (
              <div className="text-center text-muted">No leads found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Candidate Name</th>
                      <th>Mobile</th>
                      <th>Email</th>

                    </tr>
                  </thead>
                  <tbody>
                    {drilldown.leads.map((lead, idx) => (
                      <tr key={idx}>
                        <td>{lead.candidateName}</td>
                        <td>{lead.candidateMobile}</td>
                        <td>{lead.candidateEmail ? lead.candidateEmail : 'NA'}</td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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

                  {/* Single Date Range Filter */}
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
                          Clear Date Filter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* pre verification filter  */}

                {/* <div className="col-md-6">
                  <div className="card shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center gap-3">
                        <div className="flex-grow-1">
                          <label className="form-label fw-medium mb-2">
                            <i className="fas fa-calendar-alt text-primary me-2"></i>
                            Filter by Date
                          </label>
                          <div className="input-group">
                            <DatePicker
                              onChange={(date) => {
                                const formattedDate = date ?
                                  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                                  : '';
                                setSelectedDate(formattedDate);
                                // Auto-trigger search when date changes
                                if (formattedDate) {
                                  setLoading(true);
                                  setTimeout(() => fetchStats(), 100);
                                }
                              }}
                              onKeyPress={handleKeyPress}
                              value={selectedDate ? new Date(selectedDate + 'T12:00:00') : null}
                              format="dd/MM/yyyy"
                              className="form-control"
                              clearIcon={null}
                              calendarIcon={<i className="fas fa-calendar text-primary"></i>}
                              placeholder="Select date to filter..."
                              maxDate={new Date()}
                            />
                            <button
                              className="btn btn-primary"
                              onClick={handleSearch}
                              disabled={loading}
                            >
                              <i className="fas fa-search me-1"></i>
                              Search
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={handleClearFilters}
                              disabled={loading}
                            >
                              <i className="fas fa-times me-1"></i>
                              Clear
                            </button>
                          </div>
                        </div>
                        <div className="d-flex flex-column gap-2">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={handleShowAll}
                            disabled={loading}
                          >
                            <i className="fas fa-list me-1"></i>
                            Show All
                          </button>

                        </div>


                      </div>
                    </div>
                  </div>
                </div> */}

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
.recharts-wrapper{
width:100%!important;
height:100%!important;
}
   
            `
        }

      </style>
    </div>


  );
};

export default LeadAnalyticsDashboard;