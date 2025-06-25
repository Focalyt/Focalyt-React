import React, { useState, useEffect, useMemo } from 'react';
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
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
  
        if (!token) {
          console.warn('No token found in session storage.');
          setAppliedCoursesData([]);
          setIsLoading(false);
          return;
        }
  
        // Build query parameters for date filtering
        let queryParams = {};
        
        if (useCustomDate && startDate && endDate) {
          // Custom date range
          queryParams.startDate = startDate;
          queryParams.endDate = endDate;
        } else if (!useCustomDate && selectedPeriod && selectedPeriod !== 'all') {
          // Predefined period
          queryParams.period = selectedPeriod;
        }
        // If no date filter is selected, send no parameters (will return all data)
  
        // Use the new dashboard API with date filtering
        const response = await axios.get(`${backendUrl}/college/dashbord-data`, {
          headers: {
            'x-auth': token,
          },
          params: queryParams
        });
        
        console.log('Backend dashboard data:', response.data);
        if (response.data.success && response.data.data) {
          setAppliedCoursesData(response.data.data || []);
        } else {
          console.error('Failed to fetch dashboard data', response.data.message);
          setAppliedCoursesData([]);
        }
  
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setAppliedCoursesData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [token, backendUrl, startDate, endDate, selectedPeriod, useCustomDate]);

  useEffect(() => {
    console.log(appliedCoursesData, 'appliedCoursesData')
  }, [appliedCoursesData])
  
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
            console.log('Lead:', lead, 'Substatuses:', lead._leadStatus.substatuses);
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
      console.log('allSubstatuses', subMap);
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
            <div className="card-body">
              <div className="row align-items-end g-3">
                <div className="col-md-3">
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
                {!useCustomDate && selectedPeriod !== 'all' && selectedPeriod !== 'last30' && ` • Period: ${
                  selectedPeriod === 'today' ? 'Today' :
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
                          {status} <span style={{fontWeight: 'normal'}}>{expandedStatus === status ? '▲' : '▼'}</span>
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
                          <span className={`badge rounded-pill ${
                            data.ConversionRate > 50 ? 'bg-success' : 
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
                      <thead className="table-light sticky-top">
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
    </div>
  );
};

export default LeadAnalyticsDashboard;