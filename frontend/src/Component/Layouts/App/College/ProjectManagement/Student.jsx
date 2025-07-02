import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import axios from "axios";
import moment from "moment";



const Student = ({
  selectedBatch = null,
  onBackToBatches = null,
  selectedCourse = null,
  onBackToCourses = null,
  selectedCenter = null,
  onBackToCenters = null,
}) => {

  useEffect(() => {
    const handleClick = (event) => {
      const className = event.target?.__reactProps$qsrhagrkar?.className || event.target?.className || "";

      // Ensure className is a string before using .includes()
      const classNameString = String(className || "");

      if ((!classNameString.includes('popup-button')) &&
        (!classNameString.includes('popup-icon')) &&
        (!classNameString.includes('ignore-click'))) {
        setShowPopup(null);
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  useEffect(() => {

  }, [selectedBatch, selectedCourse, selectedCenter]);
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;



  // State management
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [showPopup, setShowPopup] = useState(null);
  const [leadDetailsVisible, setLeadDetailsVisible] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [studentTabsActive, setStudentTabsActive] = useState({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const getISTDate = (date = new Date()) => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istOffset = 5.5; // IST is UTC +5:30
    const ist = new Date(utc + (istOffset * 3600000));
    return ist;
  };
  const getTodayIST = () => {
    const now = new Date();
    // Get local date without timezone conversion
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ===== ENHANCED ATTENDANCE STATE =====
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  useEffect(() => {
    console.log(selectedDate, 'selectedDate')
  }, [selectedDate])
  const [showBulkControls, setShowBulkControls] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkAttendanceStatus, setBulkAttendanceStatus] = useState("");
  const [todayAttendance, setTodayAttendance] = useState({});
  const [showAttendanceMode, setShowAttendanceMode] = useState(false);
  const [timeFilter, setTimeFilter] = useState("today");
  const [dateRange, setDateRange] = useState({
    fromDate: "",
    toDate: "",
  });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    studentId: "",
    date: "",
    type: "sick",
    leaveType: "full",
    reason: "",
    timeOut: "",
    timeIn: "",
    documents: null,
  });
  const [attendanceView, setAttendanceView] = useState("daily");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceComments, setAttendanceComments] = useState({});

  const [showAttendanceManagement, setShowAttendanceManagement] =
    useState(false);
  const [attendanceManagementView, setAttendanceManagementView] =
    useState("daily");
  const [attendanceSelectedDate, setAttendanceSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceSelectedMonth, setAttendanceSelectedMonth] = useState(
    new Date().getMonth()
  );
  const [attendanceSelectedYear, setAttendanceSelectedYear] = useState(
    new Date().getFullYear()
  );

  const [registerCurrentMonth, setRegisterCurrentMonth] = useState(new Date().getMonth());
  const [registerCurrentYear, setRegisterCurrentYear] = useState(new Date().getFullYear());
  const [registerViewMode, setRegisterViewMode] = useState('month'); // 'month', 'week', 'custom'
  const [registerDateRange, setRegisterDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // open model for upload documents
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] =
    useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentZoom, setDocumentZoom] = useState(1);
  const [documentRotation, setDocumentRotation] = useState(0);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const fileInputRef = useRef(null);
  const [currentPreviewUpload, setCurrentPreviewUpload] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [filterData, setFilterData] = useState({
    course: "",
    batch: "",
    status: "all",
    fromDate: "",
    toDate: "",
    center: "",
  });
  const [allProfilesData, setAllProfilesData] = useState([]);
  const [verticalOptions, setVerticalOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [centerOptions, setCenterOptions] = useState([]);
  const [counselorOptions, setCounselorOptions] = useState([]);



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
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    enrollmentNumber: "",
    batchId: selectedBatch?.id || "",
    admissionDate: "",
    address: "",
    parentName: "",
    parentMobile: "",
    status: "all",
    password: "",
    confirmPassword: "",
  });

  const handleFilterChange = (e) => {
    try {
      const { name, value } = e.target;
      const newFilterData = { ...filterData, [name]: value };
      setFilterData(newFilterData);

      if (newFilterData.name) {
        handleSearch(newFilterData.name);
      } else {
        applyFilters(newFilterData);
      }
    } catch (error) {
      console.error('Filter change error:', error);
    }
  };

  // const handleCriteriaChange = (criteria, values) => {
  //   setFormData((prevState) => ({
  //     ...prevState,
  //     [criteria]: {
  //       type: "includes",
  //       values: values
  //     }
  //   }));
  // };

  const [dropdownStates, setDropdownStates] = useState({
    projects: false,
    verticals: false,
    course: false,
    center: false,
    counselor: false,
    sector: false
  });

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
    applyFilters(newFilterData);
  };

  const handleDateFilterChange = (date, fieldName) => {
    const newFilterData = {
      ...filterData,
      [fieldName]: date
    };
    setFilterData(newFilterData);
    applyFilters(newFilterData);
  };

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


  // Tab definitions for each student card - Updated with 5 required tabs
  const tabs = [
    "Lead Details",
    "Profile",
    "Course History",
    "Documents",
    "Attendance",
  ];
  const scrollLeft = () => {
    const container = document.querySelector('.scrollable-content');
    if (container) {
      const cardWidth = document.querySelector('.info-card')?.offsetWidth || 200;
      container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.querySelector('.scrollable-content');
    if (container) {
      const cardWidth = document.querySelector('.info-card')?.offsetWidth || 200;
      container.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };
  // Tab definitions for main navigation
  const mainTabs = [
    { key: "all", label: "All", count: 0, icon: "bi-people-fill" },
    {
      key: "admission",
      label: "Pending for Zero Period",
      count: 0,
      icon: "bi-person-check",
    },
    {
      key: "zeroPeriod",
      label: "Zero Period List",
      count: 0,
      icon: "bi-clock",
    },
    { key: "batchFreeze", label: "Batch Freezed", count: 0, icon: "bi-snow" },
    { key: "dropout", label: "Dropout List", count: 0, icon: "bi-person-x" },
  ];

  const getFileType = (fileUrl) => {
    if (!fileUrl) return "unknown";
    const extension = fileUrl.split(".").pop().toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
      return "image";
    } else if (extension === "pdf") {
      return "pdf";
    } else if (["doc", "docx"].includes(extension)) {
      return "document";
    } else if (["xls", "xlsx"].includes(extension)) {
      return "spreadsheet";
    }
    return "unknown";
  };

  const handleAttendanceManagement = () => {
    setShowAttendanceModal(true);

  };



  const handleMoveCandidate = async (profile, e) => {

    const confirmed = window.confirm(`Are you sure you want to move this student to ${e === 'Move in Zero Period' ? 'Zero Period' : e === 'Move in Batch Freeze' ? 'Batch Freeze' : 'Dropout'}`)

    if (confirmed) {
      try {
        const response = await axios.post(`${backendUrl}/college/candidate/move-candidate-status/${profile._id}`, {
          status: e,
        }, {
          headers: {
            "x-auth": token,
          },
        });
        if (response.status === 200) {
          window.alert("Student moved to zero period successfully");
          await fetchProfileData();
        }
      } catch (error) {
        console.error("Error moving student to zero period:", error);
        window.alert("Failed to move student to zero period. Please try again.");
      }
    }
  };



  const handleBackFromAttendance = () => {
    setShowAttendanceModal(false);
  };

  const exportAttendanceData = (format) => {
    const data = getFilteredStudents().map((student) => ({
      name: student.name,
      enrollmentNumber: student.enrollmentNumber,
      email: student.email,
      mobile: student.mobile,
      attendanceStats: student.attendanceStats,
      filteredStats: getFilteredAttendanceData(student),
    }));

    // Here you can implement actual export logic
    if (format === "excel") {
      // Implement Excel export
    } else if (format === "pdf") {
      // Implement PDF export
    }
  };

  // calculateAttendance function add karein component ke andar
  const calculateAttendance = (data) => {
    try {

      const attendance = data.attendance || {};
      const batch = data.batch || {};
      const currentDate = new Date();

      // Zero Period data
      const zeroPeriod = attendance.zeroPeriod || {};
      const zeroPeriodSessions = zeroPeriod.sessions || [];

      // Regular Period data  
      const regularPeriod = attendance.regularPeriod || attendance.regular || {};
      const regularSessions = regularPeriod.sessions || [];

     

      // ===== WORKING DAYS CALCULATION (EXCLUDING SUNDAYS ONLY) =====

      // Zero Period working days
      const zeroPeriodStartDate = batch.zeroPeriodStartDate ? new Date(batch.zeroPeriodStartDate) : null;
      const zeroPeriodEndDate = batch.zeroPeriodEndDate ? new Date(batch.zeroPeriodEndDate) : null;

      let zeroPeriodWorkingDays = 0;
      if (zeroPeriodStartDate && zeroPeriodEndDate) {
        const endDate = zeroPeriodEndDate > currentDate ? currentDate : zeroPeriodEndDate;
        if (endDate >= zeroPeriodStartDate) {
          zeroPeriodWorkingDays = getWorkingDaysBetween(zeroPeriodStartDate, endDate);
        }
      }


      // Regular Period working days
      const regularStartDate = new Date(batch.startDate);
      const regularEndDate = batch.endDate ? new Date(batch.endDate) : currentDate;

      let regularWorkingDays = 0;
      if (regularStartDate) {
        const endDate = regularEndDate > currentDate ? currentDate : regularEndDate;
        if (endDate >= regularStartDate) {
          regularWorkingDays = getWorkingDaysBetween(regularStartDate, endDate);
        }
      }


      // ===== ATTENDANCE CALCULATION =====

      // Helper function to get attendance status
      const getAttendanceStatus = (session) => {
        const status = session.status || session.remarks || 'absent';
        return status.toLowerCase();
      };

      // Initialize stats for zero period
      let zeroPeriodStats = {
        totalDays: zeroPeriodWorkingDays,
        present: 0,
        absent: 0,
        holiday: 0,
        notMarked: 0,
        percentage: 0,
        periodStartDate: zeroPeriodStartDate,
        periodEndDate: zeroPeriodEndDate,
        sessions: zeroPeriodSessions
      };

      // Calculate zero period attendance
      if (zeroPeriodSessions.length > 0) {
        zeroPeriodSessions.forEach(session => {
          const status = getAttendanceStatus(session);
          if (status === 'present') {
            zeroPeriodStats.present++;
          } else if (status === 'absent') {
            zeroPeriodStats.absent++;
          } else if (status === 'holiday') {
            zeroPeriodStats.holiday++;
          }
        });
      }


      // Calculate zero period not marked and percentage
      const zeroPeriodMarkedDays = zeroPeriodStats.present + zeroPeriodStats.absent + zeroPeriodStats.holiday;
      zeroPeriodStats.notMarked = Math.max(0, zeroPeriodStats.totalDays - zeroPeriodMarkedDays);

      // Zero period percentage (holiday exclude karke)
      const zeroPeriodWorkingMarkedDays = zeroPeriodStats.present + zeroPeriodStats.absent + zeroPeriodStats.notMarked;
      if (zeroPeriodWorkingMarkedDays > 0) {
        zeroPeriodStats.percentage = Math.round((zeroPeriodStats.present / zeroPeriodWorkingMarkedDays) * 100);
      }


      // Similar for regular period...
      // Initialize stats for regular period
      let regularPeriodStats = {
        totalDays: regularWorkingDays,
        present: 0,
        absent: 0,
        holiday: 0,
        notMarked: 0,
        percentage: 0,
        periodStartDate: regularStartDate,
        periodEndDate: regularEndDate,
        sessions: regularSessions
      };

      // Calculate regular period attendance
      if (regularSessions.length > 0) {
        regularSessions.forEach(session => {
          const status = getAttendanceStatus(session);
          if (status === 'present') {
            regularPeriodStats.present++;
          } else if (status === 'absent') {
            regularPeriodStats.absent++;
          } else if (status === 'holiday') {
            regularPeriodStats.holiday++;
          }
        });
      }

      // Calculate regular period not marked and percentage
      const regularMarkedDays = regularPeriodStats.present + regularPeriodStats.absent + regularPeriodStats.holiday;
      regularPeriodStats.notMarked = Math.max(0, regularPeriodStats.totalDays - regularMarkedDays);

      // Regular period percentage (holiday exclude karke)
      const regularWorkingMarkedDays = regularPeriodStats.present + regularPeriodStats.absent + regularPeriodStats.notMarked;
      if (regularWorkingMarkedDays > 0) {
        regularPeriodStats.percentage = Math.round((regularPeriodStats.present / regularWorkingMarkedDays) * 100);
      }


      // Overall calculation
      const totalPresent = zeroPeriodStats.present + regularPeriodStats.present;
      const totalAbsent = zeroPeriodStats.absent + regularPeriodStats.absent;
      const totalHolidays = zeroPeriodStats.holiday + regularPeriodStats.holiday;
      const totalNotMarked = zeroPeriodStats.notMarked + regularPeriodStats.notMarked;
      const totalWorkingMarkedDays = totalPresent + totalAbsent + totalNotMarked; // holidays exclude
      const overallPercentage = totalWorkingMarkedDays > 0 ? Math.round((totalPresent / totalWorkingMarkedDays) * 100) : 0;

      const result = {
        success: true,
        data: {
          zeroPeriod: zeroPeriodStats,
          regularPeriod: regularPeriodStats,
          overall: {
            totalDays: zeroPeriodStats.totalDays + regularPeriodStats.totalDays,
            totalPresent: totalPresent,
            totalAbsent: totalAbsent,
            totalHolidays: totalHolidays,
            totalNotMarked: zeroPeriodStats.notMarked + regularPeriodStats.notMarked,
            overallPercentage: overallPercentage
          }
        }
      };

      return result;

    } catch (error) {
      console.error('Calculate attendance error:', error); // Debug log
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  };

  // Working days calculation function (excluding ONLY SUNDAYS)
  const getWorkingDaysBetween = (startDate, endDate) => {
    let count = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // 0 = Sunday - exclude only this
      if (dayOfWeek !== 0) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  };

  const getMonthlyAttendanceBreakdown = (profile) => {
    const allSessions = [
      ...(profile.attendance?.zeroPeriod?.sessions || []),
      ...(profile.attendance?.regularPeriod?.sessions || [])
    ];

    const monthlyData = {};

    allSessions.forEach((record) => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          monthName,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          halfDay: 0,
          shortLeave: 0,
          total: 0,
          records: [],
        };
      }

      const status = record.status?.toLowerCase() || 'absent';
      monthlyData[monthKey][status] = (monthlyData[monthKey][status] || 0) + 1;
      monthlyData[monthKey].total++;
      monthlyData[monthKey].records.push({
        ...record,
        status,
        notes: record.remarks
      });
    });

    // Calculate percentages for each month
    Object.keys(monthlyData).forEach((monthKey) => {
      const month = monthlyData[monthKey];
      month.attendancePercentage = month.total > 0
        ? (((month.present + month.late + month.halfDay * 0.5 + month.shortLeave * 0.5) / month.total) * 100).toFixed(1)
        : 0;
    });

    return monthlyData;
  };

  const getYearlyAttendanceBreakdown = (profile) => {
    const allSessions = [
      ...(profile.attendance?.zeroPeriod?.sessions || []),
      ...(profile.attendance?.regularPeriod?.sessions || [])
    ];

    const yearlyData = {};

    allSessions.forEach((record) => {
      const date = new Date(record.date);
      const year = date.getFullYear();

      if (!yearlyData[year]) {
        yearlyData[year] = {
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          halfDay: 0,
          shortLeave: 0,
          total: 0,
          months: {},
          records: [],
        };
      }

      const month = date.getMonth();
      const monthName = date.toLocaleDateString("en-US", { month: "long" });

      if (!yearlyData[year].months[month]) {
        yearlyData[year].months[month] = {
          monthName,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          halfDay: 0,
          shortLeave: 0,
          total: 0,
          records: [],
        };
      }

      const status = record.status?.toLowerCase() || 'absent';
      yearlyData[year][status] = (yearlyData[year][status] || 0) + 1;
      yearlyData[year].total++;
      yearlyData[year].records.push({
        ...record,
        status,
        notes: record.remarks
      });

      yearlyData[year].months[month][status] = (yearlyData[year].months[month][status] || 0) + 1;
      yearlyData[year].months[month].total++;
      yearlyData[year].months[month].records.push({
        ...record,
        status,
        notes: record.remarks
      });
    });

    // Calculate percentages
    Object.keys(yearlyData).forEach((year) => {
      const yearData = yearlyData[year];
      yearData.attendancePercentage = yearData.total > 0
        ? (((yearData.present + yearData.late + yearData.halfDay * 0.5 + yearData.shortLeave * 0.5) / yearData.total) * 100).toFixed(1)
        : 0;

      Object.keys(yearData.months).forEach((month) => {
        const monthData = yearData.months[month];
        monthData.attendancePercentage = monthData.total > 0
          ? (((monthData.present + monthData.late + monthData.halfDay * 0.5 + monthData.shortLeave * 0.5) / monthData.total) * 100).toFixed(1)
          : 0;
      });
    });

    return yearlyData;
  };

  const EnhancedDateRangeFilter = () => {
    return (
      <div className="d-flex align-items-center gap-3 flex-wrap">
        {/* Time Filter */}
        <div className="d-flex align-items-center">
          <label className="form-label me-2 mb-0 small fw-bold">Period:</label>
          <select
            className="form-select form-select-sm"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{ width: "120px" }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Date Picker for Today/Custom */}
        {timeFilter === "today" && (
          <div className="d-flex align-items-center">
            <label className="form-label me-2 mb-0 small fw-bold">Date:</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: "140px" }}
            />
          </div>
        )}

        {/* Custom Date Range */}
        {timeFilter === "custom" && (
          <>
            <div className="d-flex align-items-center">
              <label className="form-label me-2 mb-0 small fw-bold">
                From:
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateRange.fromDate}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    fromDate: e.target.value,
                  }))
                }
                style={{ width: "140px" }}
              />
            </div>
            <div className="d-flex align-items-center">
              <label className="form-label me-2 mb-0 small fw-bold">To:</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateRange.toDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, toDate: e.target.value }))
                }
                style={{ width: "140px" }}
              />
            </div>
          </>
        )}

        {/* Quick Month/Year Selectors */}
        {(timeFilter === "month" || timeFilter === "year") && (
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{ width: "120px" }}
              disabled={timeFilter === "year"}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2024, i, 1).toLocaleDateString("en-US", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>

            <select
              className="form-select form-select-sm"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ width: "100px" }}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>
    );
  };

  const MonthlyAttendanceSummary = ({ student }) => {
    const monthlyData = getMonthlyAttendanceBreakdown(student);

    return (
      <div className="monthly-attendance-summary mt-4">
        <h6 className="mb-3">
          <i className="fas fa-calendar-alt me-2"></i>
          Monthly Attendance Summary
        </h6>
        <div className="table-responsive">
          <table className="table table-sm table-striped">
            <thead className="table-dark">
              <tr>
                <th>Month</th>
                <th>Total Days (Excluding Sundays)</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Half Day</th>
                <th>Attendance % (Excluding Sundays)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(monthlyData)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([monthKey, data]) => (
                  <tr key={monthKey}>
                    <td className="fw-medium">{data.monthName}</td>
                    <td>{data.total}</td>
                    <td>
                      <span className="badge bg-success">
                        {data.present || 0}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-danger">
                        {data.absent || 0}
                      </span>
                    </td>

                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className="progress flex-grow-1 me-2"
                          style={{ height: "20px", width: "60px" }}
                        >
                          <div
                            className={`progress-bar bg-${getProgressColor(
                              data.attendancePercentage
                            )}`}
                            style={{ width: `${data.attendancePercentage}%` }}
                          ></div>
                        </div>
                        <small className="fw-medium">
                          {data.attendancePercentage}%
                        </small>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          setAttendanceView("daily");
                          setSelectedDate(
                            data.records[0]?.date || selectedDate
                          );
                        }}
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Yearly Attendance Summary Component
  const YearlyAttendanceSummary = ({ student }) => {
    const yearlyData = getYearlyAttendanceBreakdown(student);

    return (
      <div className="yearly-attendance-summary mt-4">
        <h6 className="mb-3">
          <i className="fas fa-calendar me-2"></i>
          Yearly Attendance Summary
        </h6>
        {Object.entries(yearlyData)
          .sort(([a], [b]) => b - a)
          .map(([year, data]) => (
            <div key={year} className="card mb-3">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Year {year}</h6>
                  <div className="d-flex gap-2">
                    <span className="badge bg-primary">
                      {data.total} Total Days
                    </span>
                    <span className="badge bg-success">
                      {data.attendancePercentage}% Attendance
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {/* Year Overview */}
                <div className="row mb-3 text-center">
                  <div className="col-2">
                    <div className="card bg-success text-white">
                      <div className="card-body p-2">
                        <div className="h6 mb-0">{data.present || 0}</div>
                        <div className="small">Present</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-2">
                    <div className="card bg-danger text-white">
                      <div className="card-body p-2">
                        <div className="h6 mb-0">{data.absent || 0}</div>
                        <div className="small">Absent</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-2">
                    <div className="card bg-primary text-white">
                      <div className="card-body p-2">
                        <div className="h6 mb-0">{data.total}</div>
                        <div className="small">Total</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly breakdown within the year */}
                <h6 className="mt-3 mb-2">Monthly Breakdown for {year}</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead className="table-light">
                      <tr>
                        <th>Month</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Attendance %</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.months)
                        .sort(([a], [b]) => a - b)
                        .map(([monthIndex, monthData]) => (
                          <tr key={monthIndex}>
                            <td className="fw-medium">{monthData.monthName}</td>
                            <td>
                              <span className="badge bg-success">
                                {monthData.present || 0}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-danger">
                                {monthData.absent || 0}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  className="progress flex-grow-1 me-2"
                                  style={{ height: "18px", width: "50px" }}
                                >
                                  <div
                                    className={`progress-bar bg-${getProgressColor(
                                      monthData.attendancePercentage
                                    )}`}
                                    style={{
                                      width: `${monthData.attendancePercentage}%`,
                                    }}
                                  ></div>
                                </div>
                                <small className="fw-medium">
                                  {monthData.attendancePercentage}%
                                </small>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => {
                                  setAttendanceView("monthly");
                                  setSelectedMonth(parseInt(monthIndex));
                                  setSelectedYear(parseInt(year));
                                }}
                                title="View Month Details"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  };

  const EnhancedAttendanceTab = ({ student, studentIndex }) => {
    const filteredStats = student?.attendance || {};

    return (
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Attendance Records</h6>
            <div className="d-flex gap-2 align-items-center">
              {/* View Selector */}
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${attendanceView === "daily"
                    ? "btn-primary"
                    : "btn-outline-primary"
                    }`}
                  onClick={() => setAttendanceView("daily")}
                >
                  <i className="fas fa-calendar-day me-1"></i>Daily
                </button>
                <button
                  type="button"
                  className={`btn ${attendanceView === "monthly"
                    ? "btn-primary"
                    : "btn-outline-primary"
                    }`}
                  onClick={() => setAttendanceView("monthly")}
                >
                  <i className="fas fa-calendar-alt me-1"></i>Monthly
                </button>
                <button
                  type="button"
                  className={`btn ${attendanceView === "yearly"
                    ? "btn-primary"
                    : "btn-outline-primary"
                    }`}
                  onClick={() => setAttendanceView("yearly")}
                >
                  <i className="fas fa-calendar me-1"></i>Yearly
                </button>
              </div>

              {/* Stats Badges */}
              <div className="d-flex gap-1">
                <span className="badge bg-primary">
                  {filteredStats.totalWorkingDays} Total
                </span>
                <span className="badge bg-success">
                  {filteredStats.presentDays} Present
                </span>
                <span className="badge bg-danger">
                  {filteredStats.absentDays} Absent
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Enhanced Time Filter */}
          {attendanceView === "daily" && (
            <div className="mb-4">
              <EnhancedDateRangeFilter />
            </div>
          )}

          {/* Filtered Attendance Summary Stats */}
          <div className="row mb-4 text-center">
            <div className="col-md-2">
              <div className="card bg-primary text-white">
                <div className="card-body p-2">
                  <div className="h5 mb-0">
                    {filteredStats.totalWorkingDays}
                  </div>
                  <div className="small">
                    {timeFilter === "today"
                      ? "Selected Day"
                      : timeFilter === "week"
                        ? "This Week"
                        : timeFilter === "month"
                          ? "This Month"
                          : timeFilter === "year"
                            ? "This Year"
                            : "Selected Period"}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card bg-success text-white">
                <div className="card-body p-2">
                  <div className="h5 mb-0">{filteredStats.presentDays}</div>
                  <div className="small">Present Days</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card bg-danger text-white">
                <div className="card-body p-2">
                  <div className="h5 mb-0">{filteredStats.absentDays}</div>
                  <div className="small">Absent Days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Attendance Percentage */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>
                  {timeFilter === "today"
                    ? "Daily Status"
                    : timeFilter === "week"
                      ? "Weekly Attendance"
                      : timeFilter === "month"
                        ? "Monthly Attendance"
                        : timeFilter === "year"
                          ? "Yearly Attendance"
                          : "Period Attendance"}
                </span>
                <span>{filteredStats.attendancePercentage}%</span>
              </div>
              <div className="progress mb-2" style={{ height: "20px" }}>
                <div
                  className={`progress-bar bg-${getProgressColor(
                    filteredStats.attendancePercentage
                  )}`}
                  style={{ width: `${filteredStats.attendancePercentage}%` }}
                >
                  {filteredStats.attendancePercentage}%
                </div>
              </div>
              <small className="text-muted">
                Target: 85% • Current: {filteredStats.attendancePercentage}%
              </small>
            </div>
            <div className="col-md-6">
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Punctuality Score</span>
                <span>{filteredStats.punctualityScore}%</span>
              </div>
              <div className="progress mb-2" style={{ height: "20px" }}>
                <div
                  className={`progress-bar bg-${getProgressColor(
                    filteredStats.punctualityScore
                  )}`}
                  style={{ width: `${filteredStats.punctualityScore}%` }}
                >
                  {filteredStats.punctualityScore}%
                </div>
              </div>
              <small className="text-muted">
                On-time arrivals out of total present days
              </small>
            </div>
          </div>

          {/* Different Views Based on Selection */}
          {attendanceView === "daily" && (
            <>
              <h6 className="mb-3">
                Daily Attendance Records
                {timeFilter !== "today" && (
                  <small className="text-muted ms-2">
                    ({filteredStats.filteredRecords?.length || 0} records found)
                  </small>
                )}
              </h6>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Status</th>
                      <th>Notes/Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredStats?.filteredRecords || student?.dailyAttendance || [])
                      .length > 0 ? (
                      (filteredStats.filteredRecords || student.dailyAttendance)
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((record, idx) => (
                          <tr key={idx}>
                            <td>
                              <strong>
                                {new Date(record.date).toLocaleDateString(
                                  "en-GB"
                                )}
                              </strong>
                            </td>
                            <td>
                              <small className="text-muted">
                                {new Date(record.date).toLocaleDateString(
                                  "en-US",
                                  { weekday: "short" }
                                )}
                              </small>
                            </td>
                            <td>
                              <span
                                className={`badge bg-${getStatusColor(
                                  record.status
                                )} px-3 py-2`}
                              >
                                <i
                                  className={`fas ${record.status === "present"
                                    ? "fa-check"
                                    : record.status === "late"
                                      ? "fa-clock"
                                      : record.status === "halfDay"
                                        ? "fa-clock-o"
                                        : record.status === "shortLeave"
                                          ? "fa-sign-out-alt"
                                          : record.status === "leave"
                                            ? "fa-calendar"
                                            : "fa-times"
                                    } me-1`}
                                ></i>
                                {record.status?.toUpperCase() || "NOT MARKED"}
                              </span>
                            </td>
                            <td>
                              <span className="fw-medium">
                                {record.timeIn || "-"}
                              </span>
                            </td>
                            <td>
                              <span className="fw-medium">
                                {record.timeOut || "-"}
                              </span>
                            </td>
                            <td>
                              {record.lateMinutes > 0 ? (
                                <span className="badge bg-warning text-dark">
                                  {record.lateMinutes} min
                                </span>
                              ) : (
                                <span className="text-muted">0 min</span>
                              )}
                            </td>
                            <td>
                              <span className="text-muted small">
                                {record.notes || record.reason || "-"}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="Add comment..."
                                  value={
                                    attendanceComments[
                                    `${student.id}-${record.date}`
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    setAttendanceComments((prev) => ({
                                      ...prev,
                                      [`${student.id}-${record.date}`]:
                                        e.target.value,
                                    }))
                                  }
                                  style={{ minWidth: "150px" }}
                                />
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    // Save comment logic here
                                    const comment =
                                      attendanceComments[
                                      `${student.id}-${record.date}`
                                      ];
                                    if (comment) {
                                      alert(`Comment saved: ${comment}`);
                                    }
                                  }}
                                  title="Save Comment"
                                >
                                  <i className="fas fa-save"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          <i className="fas fa-calendar-times fs-2 text-muted mb-2"></i>
                          <p className="text-muted mb-0">
                            No attendance records found for the selected period
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {attendanceView === "monthly" && (
            <MonthlyAttendanceSummary student={student} />
          )}

          {attendanceView === "yearly" && (
            <YearlyAttendanceSummary student={student} />
          )}

          {/* Leave Records Table (shown in all views) */}
          {student.leaves && student.leaves.length > 0 && (
            <>
              <h6 className="mb-3 mt-4">Leave Applications</h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Applied Date</th>
                      <th>Leave Date</th>
                      <th>Type</th>
                      <th>Duration</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Approved By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.leaves
                      .sort(
                        (a, b) =>
                          new Date(b.appliedDate || b.date) -
                          new Date(a.appliedDate || a.date)
                      )
                      .map((leave, idx) => (
                        <tr key={idx}>
                          <td>
                            {new Date(
                              leave.appliedDate || leave.date
                            ).toLocaleDateString("en-GB")}
                          </td>
                          <td>
                            {new Date(leave.date).toLocaleDateString("en-GB")}
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {leave.type}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${leave.leaveType === "full"
                                ? "bg-danger"
                                : leave.leaveType === "half"
                                  ? "bg-warning text-dark"
                                  : "bg-info"
                                }`}
                            >
                              {leave.leaveType === "full"
                                ? "1 Day"
                                : leave.leaveType === "half"
                                  ? "0.5 Day"
                                  : `${leave.duration || 0} Hours`}
                            </span>
                          </td>
                          <td className="small">{leave.reason}</td>
                          <td>
                            <span
                              className={`badge bg-${leave.status === "approved"
                                ? "success"
                                : leave.status === "pending"
                                  ? "warning text-dark"
                                  : "danger"
                                }`}
                            >
                              <i
                                className={`fas ${leave.status === "approved"
                                  ? "fa-check"
                                  : leave.status === "pending"
                                    ? "fa-clock"
                                    : "fa-times"
                                  } me-1`}
                              ></i>
                              {leave.status?.toUpperCase()}
                            </span>
                          </td>
                          <td className="small">{leave.approvedBy || "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const filterDocuments = (documents = []) => {
    // Ensure documents is always an array
    if (!Array.isArray(documents)) return [];
    if (statusFilter === "all") return documents;

    return documents.filter((doc) => {
      if (!doc.uploads || doc.uploads.length === 0)
        return statusFilter === "none";

      const lastUpload = doc.uploads[doc.uploads.length - 1];
      if (!lastUpload || !lastUpload.status) return false;

      return lastUpload.status.toLowerCase() === statusFilter;
    });
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedDocumentForUpload) return;

   

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("doc", selectedDocumentForUpload.docsId);

      const response = await axios.put(
        `${backendUrl}/college/upload_docs/${selectedProfile._id}`,
        formData,
        {
          headers: {
            "x-auth": token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

    

      if (response.data.status) {
        alert("Document uploaded successfully! Status: Pending Review");

        // Optionally refresh data here
        closeUploadModal();
        fetchProfileData();
      } else {
        alert("Failed to upload file");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const DocumentControls = React.memo(
    ({
      onZoomIn,
      onZoomOut,
      onRotate,
      onReset,
      onDownload,
      zoomLevel,
      fileType,
    }) => {
      return (
        <div className="preview-controls">
          <button
            onClick={onZoomIn}
            className="control-btn"
            style={{ whiteSpace: "nowrap" }}
            title="Zoom In"
          >
            <i className="fas fa-search-plus"></i> Zoom In
          </button>

          <button
            onClick={onZoomOut}
            className="control-btn"
            style={{ whiteSpace: "nowrap" }}
            title="Zoom Out"
          >
            <i className="fas fa-search-minus"></i> Zoom Out
          </button>

          {/* Show rotation button only for images */}
          {fileType === "image" && (
            <button
              onClick={onRotate}
              className="control-btn"
              style={{ whiteSpace: "nowrap" }}
              title="Rotate 90°"
            >
              <i className="fas fa-redo"></i> Rotate
            </button>
          )}

          {/* Reset View Button */}
          <button
            onClick={onReset}
            className="control-btn"
            style={{ whiteSpace: "nowrap" }}
            title="Reset View"
          >
            <i className="fas fa-sync-alt"></i> Reset
          </button>

          {/* Download Button */}
          <a
            href={onDownload}
            download
            className="control-btn"
            target="_blank"
            rel="noopener noreferrer"
            style={{ whiteSpace: "nowrap", textDecoration: "none" }}
            title="Download Document"
          >
            <i className="fas fa-download"></i> Download
          </a>

          {/* Zoom Level Indicator */}
          <div
            className="zoom-indicator"
            style={{
              fontSize: "12px",
              color: "#666",
              marginLeft: "10px",
              padding: "5px 10px",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
            }}
          >
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      );
    }
  );

  const updateDocumentStatus = (uploadId, status) => {
    // In real app, this would make an API call
    if (status === "Rejected" && !rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    alert(`Document ${status} successfully!`);
    closeDocumentModal();
  };

  const fetchProfileData = async () => {
    try {
      if (!token) {
        console.warn("No token found in session storage.");
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        tab: activeTab,
      });

      // Add search query
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }

      // Add filter data
      if (filterData.status && filterData.status !== 'all') {
        queryParams.append('status', filterData.status);
      }
      if (filterData.fromDate) {
        queryParams.append('fromDate', filterData.fromDate);
      }
      if (filterData.toDate) {
        queryParams.append('toDate', filterData.toDate);
      }
      if (filterData.courseType) {
        queryParams.append('courseType', filterData.courseType);
      }
      if (filterData.leadStatus) {
        queryParams.append('leadStatus', filterData.leadStatus);
      }
      if (filterData.sector) {
        queryParams.append('sector', filterData.sector);
      }
      if (filterData.createdFromDate) {
        queryParams.append('createdFromDate', filterData.createdFromDate);
      }
      if (filterData.createdToDate) {
        queryParams.append('createdToDate', filterData.createdToDate);
      }
      if (filterData.modifiedFromDate) {
        queryParams.append('modifiedFromDate', filterData.modifiedFromDate);
      }
      if (filterData.modifiedToDate) {
        queryParams.append('modifiedToDate', filterData.modifiedToDate);
      }
      if (filterData.nextActionFromDate) {
        queryParams.append('nextActionFromDate', filterData.nextActionFromDate);
      }
      if (filterData.nextActionToDate) {
        queryParams.append('nextActionToDate', filterData.nextActionToDate);
      }

      const response = await axios.get(
        `${backendUrl}/college/admission-list/${selectedCourse?._id}/${selectedCenter?._id}?${queryParams.toString()}`,
        {
          headers: {
            "x-auth": token,
          },
        }
      );


      if (response.data.success && response.data.data) {
        setAllProfiles(response.data.data);
        setTotalPages(response.data.totalPages);

        const getStartandEndDate = () => {
          const startDate = new Date(response.data.data[0].batch.zeroPeriodStartDate);
          const endDate = new Date(response.data.data[0].batch.endDate);
          return { startDate, endDate };
        }
        setRegisterDateRange(getStartandEndDate());

        // Update tab counts if available
        if (response.data.filterCounts) {
          // You can store tab counts in state and use them
          setTabCounts(response.data.filterCounts);
        }
      } else {
        console.error("Failed to fetch profile data", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };

  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    setCurrentPage(1); // Reset to first page on search
    // fetchProfileData will be called automatically due to useEffect dependency
  };

  const applyFilters = (filters = filterData) => {
    setFilterData(filters);
    setCurrentPage(1); // Reset to first page on filter change
    // fetchProfileData will be called automatically due to useEffect dependency
  };

  const [experiences, setExperiences] = useState([
    {
      jobTitle: "",
      companyName: "",
      from: null,
      to: null,
      jobDescription: "",
      currentlyWorking: false,
    },
  ]);

  const [user, setUser] = useState({
    image: "",
    name: "John Doe",
  });

  // Inside CRMDashboard component:

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "text-dark";
      case "verified":
        return "text-sucess";
      case "rejected":
        return "text-danger";
      default:
        return "text-secondary";
    }
  };
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type (images and PDFs)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a valid file (JPG, PNG, GIF, or PDF)");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("File size should be less than 10MB");
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };

  const formatDate = (date) => {
    // If the date is not a valid Date object, try to convert it
    if (date && !(date instanceof Date)) {
      date = new Date(date);
    }

    // Check if the date is valid
    if (!date || isNaN(date)) return ""; // Return an empty string if invalid

    // Now call toLocaleDateString
    return date.toLocaleDateString("en-GB");
  };

  const clearAllFilters = () => {
    setFilterData({
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
    });
    setAllProfiles(allProfilesData);
  };

  const openDocumentModal = (document) => {
    // Check if this is the same document that was already open
    const isSameDocument =
      selectedDocument && selectedDocument._id === document._id;

    setSelectedDocument(document);
    setShowDocumentModal(true);

    // Only reset zoom and rotation if it's a NEW document or first time opening modal
    if (!isSameDocument) {
      setDocumentZoom(1);
      setDocumentRotation(0);
      setIsNewModalOpen(true);
    } else {
      setIsNewModalOpen(false);
    }

    document.body?.classNameList.add("no-scroll");
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);

    setIsNewModalOpen(false);
    // // Only reset when actually closing modal
    setDocumentZoom(1);
    setDocumentRotation(0);
  };



  const formatDateForIST = (date) => {
    if (!date) return '';

    // If date is already a string in YYYY-MM-DD format, return as is
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    // For Date objects from date picker, get local date without timezone conversion
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // For backend dates that are already adjusted for IST (18:30 UTC = next day IST)
    if (typeof date === 'string' && date.includes('18:30:00.000')) {
      const utcDate = new Date(date);
      const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
      return istDate.toISOString().split('T')[0];
    }

    // For other dates, create date without timezone issues
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };


  const handleDatePickerChange = (date) => {
    if (date) {
      // Get the local date without timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      // Create YYYY-MM-DD format without timezone issues
      const localDateString = `${year}-${month}-${day}`;
      setSelectedDate(localDateString);

    }
  };




  const getRegisterDates = () => {
    let dates = [];

    // Get start and end dates
    const startDate = new Date(registerDateRange.startDate);
    const endDate = new Date(registerDateRange.endDate);

    // No need to convert to IST here as the dates are already in correct format
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Format the date as YYYY-MM-DD without timezone conversion
      const dateString = currentDate.toISOString().split('T')[0];

      dates.push({
        date: dateString,
        day: currentDate.getDate(),
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const getAttendanceStatus = (profile, date) => {
    const allSessions = [
      ...(profile.attendance?.zeroPeriod?.sessions || []),
      ...(profile.attendance?.regularPeriod?.sessions || [])
    ];

    // The input date is already in IST format (YYYY-MM-DD)
    const targetDate = date;


    const attendanceRecord = allSessions.find(record => {
      // Convert backend date to IST date string
      const recordDate = formatDateForIST(record.date);
      return recordDate === targetDate;
    });

    if (!attendanceRecord) {
      return { status: 'not-marked', symbol: '-', class: 'not-marked' };
    }

    const status = attendanceRecord.status?.toLowerCase() || 'absent';
    const statusMap = {
      'present': { symbol: 'P', class: 'present', title: 'Present' },
      'absent': { symbol: 'A', class: 'absent', title: 'Absent' },
    };

    const statusInfo = statusMap[status] || statusMap['not-marked'];
    return {
      ...statusInfo,
      timeIn: attendanceRecord.timeIn,
      timeOut: attendanceRecord.timeOut,
      lateMinutes: attendanceRecord.lateMinutes,
      notes: attendanceRecord.remarks
    };
  };

  const AttendanceManagementModal = ({ show, onClose }) => {
    if (!show) return null;

    // Get all students data for attendance management
    const allStudentsAttendanceData = allProfiles.map((student) => {
      const filteredStats = getFilteredAttendanceData(student);
      const monthlyData = getMonthlyAttendanceBreakdown(student);
      const yearlyData = getYearlyAttendanceBreakdown(student);

      return {
        ...student,
        filteredStats,
        monthlyData,
        yearlyData,
      };
    });

    // ===== STEP 5: Attendance Register View Component =====
    const renderAttendanceRegisterView = () => {
      const dates = getRegisterDates();

      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      return (
        <div className="attendance-register-container">


          {/* Register Title */}
          <div className="register-title text-center mb-4">
            <h4 className="fw-bold text-primary">
              <i className="fas fa-clipboard-list me-2"></i>
              Attendance Register
            </h4>
            <p className="text-muted mb-0">
              Total Students: {allStudentsAttendanceData.length} |
              Period: {dates.length > 0 ? `${dates[0]?.day}/${registerCurrentMonth + 1}/${registerCurrentYear}` : ''} to {dates.length > 0 ? `${dates[dates.length - 1]?.day}/${registerCurrentMonth + 1}/${registerCurrentYear}` : ''}
            </p>
          </div>

          {/* Attendance Register Table */}
          <div className="register-table-container">
            <div className="table-responsive">
              <table className="table table-bordered attendance-register-table">
                <thead className="table-dark sticky-top">
                  <tr>
                    <th rowSpan="2" className="student-info-header">
                      <div className="student-header-content">
                        <i className="fas fa-users me-2"></i>
                        Student Information
                      </div>
                    </th>
                    <th colSpan={dates.length} className="dates-header text-center">
                      <i className="fas fa-calendar-alt me-2"></i>
                      Attendance Dates ({dates.length} days)
                    </th>
                    <th rowSpan="2" className="summary-header">
                      <div className="summary-header-content">
                        <i className="fas fa-chart-pie me-2"></i>
                        Summary
                      </div>
                    </th>
                  </tr>
                  <tr>
                    {dates.map((dateInfo, index) => (
                      <th key={index} className={`date-header ${dateInfo.isWeekend ? 'weekend-header' : ''}`}>
                        <div className="date-header-content">
                          <div className="date-number">{dateInfo.day}</div>
                          <div className="day-name">{dateInfo.dayName}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {allStudentsAttendanceData.map((student, studentIndex) => (
                    <tr key={student._id} className="student-row">
                      {/* Student Information Column */}
                      <td className="student-info-cell">
                        <div className="student-info-content">
                          <div className="d-flex align-items-center">
                            <div className="student-avatar me-3">
                              <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "45px", height: "45px" }}>
                                <i className="bi bi-person-fill text-primary fs-5"></i>
                              </div>
                            </div>
                            <div className="student-details">
                              <h6 className="mb-1 fw-bold student-name">{student._candidate.name}</h6>
                              <small className="text-muted enrollment-number">
                                {student.enrollmentNumber}
                              </small>
                              <div className="mt-1">
                                {getAdmissionStatusBadge(student)}
                              </div>
                              <div className="student-contact mt-1">
                                <small className="text-muted">
                                  <i className="fas fa-phone me-1"></i>
                                  {student._candidate.mobile}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Attendance Cells for each date */}
                      {dates.map((dateInfo, dateIndex) => {
                        const attendanceInfo = getAttendanceStatus(student, dateInfo.date);
                        return (
                          <td
                            key={dateIndex}
                            className={`attendance-cell ${attendanceInfo.class} ${dateInfo.isWeekend ? 'weekend-cell' : ''}`}
                            title={`${student.name} - ${dateInfo.date}: ${attendanceInfo.title}${attendanceInfo.timeIn ? ` (In: ${attendanceInfo.timeIn})` : ''}${attendanceInfo.lateMinutes > 0 ? ` - Late by ${attendanceInfo.lateMinutes} min` : ''}`}
                          >
                            <div className="attendance-symbol">
                              {attendanceInfo.symbol}
                            </div>
                            {attendanceInfo.timeIn && (
                              <div className="time-info">
                                {attendanceInfo.timeIn}
                              </div>
                            )}
                            {attendanceInfo.lateMinutes > 0 && (
                              <div className="late-indicator">
                                +{attendanceInfo.lateMinutes}m
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Summary Column */}
                      <td className="summary-cell">
                        <div className="summary-content">
                          <div className="summary-stats">
                            <div className="stat-item present">
                              <span className="stat-label">P:</span>
                              <span className="stat-value">{student.filteredStats.presentDays}</span>
                            </div>
                            <div className="stat-item absent">
                              <span className="stat-label">A:</span>
                              <span className="stat-value">{student.filteredStats.absentDays}</span>
                            </div>

                          </div>
                          <div className="attendance-percentage mt-2">
                            <div className="percentage-bar">
                              <div
                                className={`percentage-fill bg-${getProgressColor(student.filteredStats.attendancePercentage)}`}
                                style={{ width: `${student.filteredStats.attendancePercentage}%` }}
                              ></div>
                            </div>
                            {/* <small className="percentage-text fw-bold">
                              {student.filteredStats.attendancePercentage}%
                            </small> */}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Summary Row */}
                <tfoot className="table-secondary">
                  <tr className="summary-row">
                    <td className="summary-row-header">
                      <strong>
                        <i className="fas fa-calculator me-2"></i>
                        Daily Summary
                      </strong>
                    </td>
                    {dates.map((dateInfo, dateIndex) => {
                      const dayStats = allStudentsAttendanceData.reduce((acc, student) => {
                        const status = getAttendanceStatus(student, dateInfo.date);
                        acc[status.class] = (acc[status.class] || 0) + 1;
                        return acc;
                      }, {});

                      const totalStudents = allStudentsAttendanceData.length;
                      const presentCount = (dayStats.present || 0) + (dayStats.late || 0);
                      const attendancePercentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : 0;

                      return (
                        <td key={dateIndex} className={`summary-cell ${dateInfo.isWeekend ? 'weekend-summary' : ''}`}>
                          <div className="day-summary">
                            <div className="summary-percentage">
                              {attendancePercentage}%
                            </div>
                            <div className="summary-counts">
                              <small>
                                P:{dayStats.present || 0} | A:{dayStats.absent || 0} | L:{dayStats.late || 0}
                              </small>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    <td className="overall-summary">
                      <div className="overall-stats">
                        <strong>Overall Average</strong>
                        <div className="overall-percentage">
                          {allStudentsAttendanceData.length > 0
                            ? (allStudentsAttendanceData.reduce((sum, s) => sum + s.filteredStats.attendancePercentage, 0) / allStudentsAttendanceData.length).toFixed(1)
                            : 0}%
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="register-legend mt-4">
            <h6 className="fw-bold mb-3">
              <i className="fas fa-info-circle me-2"></i>
              Attendance Symbols Legend
            </h6>
            <div className="legend-grid">
              <div className="legend-item">
                <span className="legend-symbol present">P</span>
                <span className="legend-text">Present</span>
              </div>
              <div className="legend-item">
                <span className="legend-symbol absent">A</span>
                <span className="legend-text">Absent</span>
              </div>

              <div className="legend-item">
                <span className="legend-symbol not-marked">-</span>
                <span className="legend-text">Not Marked</span>
              </div>
            </div>
          </div>
        </div>
      );
    };

    // ===== STEP 6: Daily Attendance View (existing) =====
    const renderDailyAttendanceView = () => {
      const processedStudents = allStudentsAttendanceData.map(student => {
        const result = calculateAttendance(student);
        return {
          ...student,
          calculatedAttendance: result.success ? result.data : null
        };
      });

      return (
        <div className="daily-attendance-management">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th rowSpan={2} style={{ minWidth: "200px" }}>Student Details</th>
                  <th colSpan={5} className="text-center">Zero Period Attendance</th>
                  <th colSpan={5} className="text-center">Regular Period Attendance</th>

                </tr>
                <tr className="text-center">
                  <th>Total Days <small>(Excluding Sundays)</small></th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Not Marked</th>
                  <th>Attendance %</th>
                  <th>Total Days <small>(Excluding Sundays)</small></th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Not Marked</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {processedStudents.map((student, index) => (

                  <tr key={student._id} className="text-center">
                    <td className="text-start">
                      <div className="d-flex align-items-center">
                        <div
                          className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: "40px", height: "40px" }}
                        >
                          <i className="bi bi-person-fill text-primary"></i>
                        </div>
                        <div>
                          <h6 className="mb-0 fw-bold">{student._candidate.name}</h6>
                          <small className="text-muted">{student._candidate.mobile}</small>
                          <div className="mt-1">
                            {getAdmissionStatusBadge(student)}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* <td>
                      <span className="fw-medium">
                        {student.enrollmentNumber}
                      </span>
                    </td> */}
                    <td>
                      <span className="badge bg-primary">
                        {student?.calculatedAttendance?.zeroPeriod?.totalDays || 0}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-success">
                        {student?.calculatedAttendance?.zeroPeriod?.present || 0}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-danger">
                        {student?.calculatedAttendance?.zeroPeriod?.absent || 0}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-warning text-dark">
                        {student?.calculatedAttendance?.zeroPeriod?.notMarked || 0}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className="progress flex-grow-1 me-2"
                          style={{ height: "20px", width: "60px" }}
                        >
                          <div
                            className={`progress-bar bg-${getProgressColor(
                              student?.calculatedAttendance?.zeroPeriod?.percentage || 0
                            )}`}
                            style={{
                              width: `${student?.calculatedAttendance?.zeroPeriod?.percentage || 0}%`,
                            }}
                          ></div>
                        </div>
                        <small className="fw-medium">
                          {student?.calculatedAttendance?.zeroPeriod?.percentage || 0}%
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-primary">
                        {student?.calculatedAttendance?.regularPeriod?.totalDays || 0}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-success">
                        {student?.calculatedAttendance?.regularPeriod?.present || 0}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-danger">
                        {student?.calculatedAttendance?.regularPeriod?.absent || 0}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-warning text-dark">
                        {student?.calculatedAttendance?.regularPeriod?.notMarked || 0}
                      </span>
                    </td>

                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className="progress flex-grow-1 me-2"
                          style={{ height: "20px", width: "60px" }}
                        >
                          <div
                            className={`progress-bar bg-${getProgressColor(
                              student?.calculatedAttendance?.regularPeriod?.percentage || 0
                            )}`}
                            style={{
                              width: `${student?.calculatedAttendance?.regularPeriod?.percentage || 0}%`,
                            }}
                          ></div>
                        </div>
                        <small className="fw-medium">
                          {student?.calculatedAttendance?.regularPeriod?.percentage || 0}%
                        </small>
                      </div>
                    </td>


                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    // ===== STEP 7: Main Modal Render =====
    return (
      <div className="attendance-management-overlay">
        <div className="attendance-management-modal">
          <div className="modal-header-enhanced">
            <div className="d-flex justify-content-between align-items-center w-100">
              <div>
                <h3 className="mb-0">
                  <i className="fas fa-chart-line me-2 text-primary"></i>
                  Attendance Management Dashboard
                </h3>
                <p className="text-muted mb-0">
                  Traditional attendance register with student-wise tracking
                </p>
              </div>
              <button className="btn btn-outline-secondary" onClick={onClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div className="modal-body-enhanced">
            {/* Enhanced Control Panel */}
            <div className="control-panel-enhanced mb-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="view-selector">
                    <label className="form-label fw-bold mb-2">
                      <i className="fas fa-eye me-2"></i>
                      View Type
                    </label>
                    <div className="btn-group w-100" role="group">
                      <button
                        type="button"
                        className={`btn ${attendanceManagementView === "register"
                          ? "btn-primary"
                          : "btn-outline-primary"
                          }`}
                        onClick={() => setAttendanceManagementView("register")}
                      >
                        <i className="fas fa-clipboard-list me-1"></i>
                        Attendance Register
                      </button>
                      <button
                        type="button"
                        className={`btn ${attendanceManagementView === "daily"
                          ? "btn-primary"
                          : "btn-outline-primary"
                          }`}
                        onClick={() => setAttendanceManagementView("daily")}
                      >
                        <i className="fas fa-calendar-day me-1"></i>
                        Summary View
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="action-buttons">
                    {/* <label className="form-label fw-bold mb-2">
                      <i className="fas fa-tools me-2"></i>
                      Actions
                    </label> */}
                    {/* <div className="d-flex gap-2">
                      <button
                        className="btn btn-success"
                        onClick={() => exportAttendanceData("excel")}
                      >
                        <i className="fas fa-file-excel me-1"></i>
                        Export
                      </button> */}
                    {/* <button
                        className="btn btn-warning"
                        onClick={() => {
                          alert("Printing attendance register...");
                          window.print();
                        }}
                      >
                        <i className="fas fa-print me-1"></i>
                        Print
                      </button> */}
                    {/* </div> */}
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Summary */}
            <div className="statistics-summary mb-4">
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="stat-card bg-primary text-white">
                    <div className="stat-number">
                      {allStudentsAttendanceData.length}
                    </div>
                    <div className="stat-label">Total Students</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card bg-success text-white">
                    <div className="stat-number">
                      {
                        allStudentsAttendanceData.filter((student) => {
                          const result = calculateAttendance(student);
                          if (result.success) {
                            const overallPercentage = result.data.overall.percentage || 0;
                            return overallPercentage >= 85;
                          }
                          return false;
                        }).length
                      }
                    </div>
                    <div className="stat-label">High Attendance (85%+)</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card bg-warning text-white">
                    <div className="stat-number">
                      {
                        allStudentsAttendanceData.filter(
                          (student) => {
                            const result = calculateAttendance(student);
                            if (result.success) {
                              const overallPercentage = result.data.overall.percentage || 0;
                              return overallPercentage >= 75 && overallPercentage < 85;
                            }
                            return false;
                          }
                        ).length
                      }
                    </div>
                    <div className="stat-label">Average (75-84%)</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card bg-danger text-white">
                    <div className="stat-number">
                      {
                        allStudentsAttendanceData.filter(
                          (student) => {
                            const result = calculateAttendance(student);
                            if (result.success) {
                              const overallPercentage = result.data.overall.percentage || 0;
                              return overallPercentage < 75;
                            }
                            return false;
                          }
                        ).length
                      }
                    </div>
                    <div className="stat-label">Low Attendance (&lt;75%)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Content Based on View */}
            <div className="attendance-content">
              {attendanceManagementView === "register" && renderAttendanceRegisterView()}
              {attendanceManagementView === "daily" && renderDailyAttendanceView()}
            </div>
          </div>
        </div>
      </div>
    );
  };


  // Document Modal Component
  const DocumentModal = () => {
    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [documentZoom, setDocumentZoom] = useState(1);
    const [documentRotation, setDocumentRotation] = useState(0);

    const latestUpload = useMemo(() => {
      if (!selectedDocument) return null;
      return selectedDocument.uploads && selectedDocument.uploads.length > 0
        ? selectedDocument.uploads[selectedDocument.uploads.length - 1]
        : selectedDocument.fileUrl && selectedDocument.status !== "Not Uploaded"
          ? selectedDocument
          : null;
    }, [selectedDocument]);

    const handleZoomIn = useCallback(() => {
      setDocumentZoom((prev) => Math.min(prev + 0.1, 2));
    }, []);

    const handleZoomOut = useCallback(() => {
      setDocumentZoom((prev) => Math.max(prev - 0.1, 0.5));
    }, []);

    const handleRotate = useCallback(() => {
      setDocumentRotation((prev) => (prev + 90) % 360);
    }, []);

    const handleReset = useCallback(() => {
      setDocumentZoom(1);
      setDocumentRotation(0);
    }, []);

    const fileUrl = latestUpload?.fileUrl || selectedDocument?.fileUrl;
    const fileType = fileUrl ? getFileType(fileUrl) : null;

    const handleRejectClick = useCallback(() => {
      setShowRejectionForm(true);
    }, []);

    const handleCancelRejection = useCallback(() => {
      setShowRejectionForm(false);
      setRejectionReason("");
    }, []);

    const handleConfirmRejection = useCallback(() => {
      if (rejectionReason.trim()) {
        updateDocumentStatus(
          latestUpload?._id || selectedDocument?._id,
          "Rejected",
          rejectionReason
        );
        handleCancelRejection();
      }
    }, [
      latestUpload,
      selectedDocument,
      rejectionReason,
      handleCancelRejection,
    ]);

    if (!showDocumentModal || !selectedDocument) return null;

    // Helper function to render document preview thumbnail using iframe/img
    const renderDocumentThumbnail = (upload, isSmall = true) => {
      const fileUrl = upload?.fileUrl;
      if (!fileUrl) {
        return (
          <div
            className={`document-thumbnail ${isSmall ? "small" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "4px",
              width: isSmall ? "100%" : "150px",
              height: isSmall ? "100%" : "100px",
              fontSize: isSmall ? "16px" : "24px",
              color: "#6c757d",
            }}
          >
            📄
          </div>
        );
      }

      const fileType = getFileType(fileUrl);

      if (fileType === "image") {
        return (
          <img
            src={fileUrl}
            alt="Document Preview"
            className={`document-thumbnail ${isSmall ? "small" : ""}`}
            style={{
              width: isSmall ? "100%" : "150px",
              height: isSmall ? "100%" : "100px",
              objectFit: "cover",
              borderRadius: "4px",
              border: "1px solid #dee2e6",
              cursor: "pointer",
            }}
            onClick={() => {
              if (isSmall) {
                // Set this upload as the current preview
                setCurrentPreviewUpload(upload);
              }
            }}
          />
        );
      } else if (fileType === "pdf") {
        return (
          <div
            style={{ position: "relative", overflow: "hidden", height: "100%" }}
          >
            <iframe
              src={fileUrl + "#navpanes=0&toolbar=0"}
              className={`document-thumbnail pdf-thumbnail ${isSmall ? "small" : ""
                }`}
              style={{
                width: isSmall ? "100%" : "150px",
                height: isSmall ? "100%" : "100px",
                border: "1px solid #dee2e6",
                borderRadius: "4px",
                cursor: "pointer",
                pointerEvents: "none",
                transformOrigin: "top left",
                overflow: "hidden",
              }}
              title="PDF Thumbnail"
              onClick={() => {
                if (isSmall) {
                  setCurrentPreviewUpload(upload);
                }
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#dc3545",
                fontSize: isSmall ? "10px" : "12px",
                fontWeight: "bold",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => {
                if (isSmall) {
                  setCurrentPreviewUpload(upload);
                }
              }}
            >
              PDF
            </div>
          </div>
        );
      } else {
        // For other document types, try to use iframe as well
        return (
          <div style={{ position: "relative" }}>
            <iframe
              src={fileUrl + "#navpanes=0&toolbar=0"}
              className={`document-thumbnail ${isSmall ? "small" : ""}`}
              style={{
                width: isSmall ? "100%" : "150px",
                height: isSmall ? "100%" : "100px",
                border: "1px solid #dee2e6",
                borderRadius: "4px",
                cursor: "pointer",
                pointerEvents: "none",
                backgroundColor: "#f8f9fa",
              }}
              title="Document Thumbnail"
              onClick={() => {
                if (isSmall) {
                  setCurrentPreviewUpload(upload);
                }
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 123, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#007bff",
                fontSize: isSmall ? "16px" : "24px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => {
                if (isSmall) {
                  setCurrentPreviewUpload(upload);
                }
              }}
            >
              {fileType === "document"
                ? "📄"
                : fileType === "spreadsheet"
                  ? "📊"
                  : "📁"}
            </div>
          </div>
        );
      }
    };

    return (
      <div className="document-modal-overlay" onClick={closeDocumentModal}>
        <div
          className="document-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>{selectedDocument.Name} Verification</h3>
            <button className="close-btn" onClick={closeDocumentModal}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="document-preview-section">
              <div className="document-preview-container">
                {latestUpload?.fileUrl ||
                  selectedDocument?.fileUrl ||
                  (selectedDocument?.status &&
                    selectedDocument?.status !== "Not Uploaded" &&
                    selectedDocument?.status !== "No Uploads") ? (
                  <>
                    {(() => {
                      

                      const fileUrl =
                        latestUpload?.fileUrl || selectedDocument?.fileUrl;
                      const hasDocument =
                        fileUrl ||
                        (selectedDocument?.status &&
                          selectedDocument?.status !== "Not Uploaded" &&
                          selectedDocument?.status !== "No Uploads");


                      if (hasDocument) {
                        // If we have a file URL, show the appropriate viewer
                        if (fileUrl) {
                          const fileType = getFileType(fileUrl);

                          if (fileType === "image") {
                            return (
                              <img
                                src={fileUrl}
                                alt="Document Preview"
                                style={{
                                  transform: `scale(${documentZoom}) rotate(${documentRotation}deg)`,
                                  transition: "transform 0.3s ease",
                                  maxWidth: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            );
                          } else if (fileType === "pdf") {
                            return (
                              <div
                                className="pdf-viewer"
                                style={{ width: "100%", height: "500px" }}
                              >
                                <iframe
                                  src={fileUrl + "#navpanes=0&toolbar=0"}
                                  width="100%"
                                  height="100%"
                                  style={{
                                    border: "none",
                                    transform: `scale(${documentZoom})`,
                                    transformOrigin: "center center",
                                    transition: "transform 0.3s ease",
                                  }}
                                  title="PDF Document"
                                />
                              </div>
                            );
                          } else {
                            return (
                              <div
                                className="document-preview"
                                style={{ textAlign: "center", padding: "40px" }}
                              >
                                <div
                                  style={{
                                    fontSize: "60px",
                                    marginBottom: "20px",
                                  }}
                                >
                                  {fileType === "document"
                                    ? "📄"
                                    : fileType === "spreadsheet"
                                      ? "📊"
                                      : "📁"}
                                </div>
                                <h4>Document Preview</h4>
                                <p>Click download to view this file</p>
                                {fileUrl ? (
                                  <a
                                    href={fileUrl}
                                    download
                                    className="btn btn-primary"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <i className="fas fa-download me-2"></i>
                                    Download & View
                                  </a>
                                ) : (
                                  <button
                                    className="btn btn-secondary"
                                    disabled
                                    title="File URL not available"
                                  >
                                    <i className="fas fa-download me-2"></i>
                                    File Not Available
                                  </button>
                                )}
                              </div>
                            );
                          }
                        } else {
                          // Document exists but no file URL - show document uploaded message
                          return (
                            <div
                              className="document-preview"
                              style={{ textAlign: "center", padding: "40px" }}
                            >
                              <div
                                style={{
                                  fontSize: "60px",
                                  marginBottom: "20px",
                                }}
                              >
                                📄
                              </div>
                              <h4>Document Uploaded</h4>
                              <p>Document is available for verification</p>
                              <p>
                                <strong>Status:</strong>{" "}
                                {selectedDocument?.status}
                              </p>
                            </div>
                          );
                        }
                      } else {
                        return (
                          <div className="no-document">
                            <i className="fas fa-file-times fa-3x text-muted mb-3"></i>
                            <p>No document uploaded</p>
                          </div>
                        );
                      }
                    })()}
                    <DocumentControls
                      onZoomIn={handleZoomIn}
                      onZoomOut={handleZoomOut}
                      onRotate={handleRotate}
                      onReset={handleReset}
                      onDownload={fileUrl}
                      zoomLevel={documentZoom}
                      fileType={fileType}
                    />
                  </>
                ) : (
                  <div className="no-document">
                    <i className="fas fa-file-times fa-3x text-muted mb-3"></i>
                    <p>No document uploaded</p>
                  </div>
                )}
              </div>

              {/* document preview container  */}

              {selectedDocument.uploads &&
                selectedDocument.uploads.length > 0 && (
                  <div className="info-card mt-4">
                    <h4>Document History</h4>
                    <div className="document-history">
                      {selectedDocument.uploads &&
                        selectedDocument.uploads.map((upload, index) => (
                          <div
                            key={index}
                            className="history-item"
                            style={{
                              display: "block",
                              padding: "12px",
                              marginBottom: "8px",
                              backgroundColor: "#f8f9fa",
                              borderRadius: "8px",
                              border: "1px solid #e9ecef",
                            }}
                          >
                            {/* Document Preview Thumbnail using iframe/img */}
                            <div
                              className="history-preview"
                              style={{ marginRight: "0px" }}
                            >
                              {renderDocumentThumbnail(upload, true)}
                            </div>

                            {/* Document Info */}
                            <div className="history-info" style={{ flex: 1 }}>
                              <div
                                className="history-date"
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  color: "#495057",
                                  marginBottom: "4px",
                                }}
                              >
                                {formatDate(upload.uploadedAt)}
                              </div>
                              <div className="history-status">
                                <span
                                  className={`${getStatusBadgeClass(
                                    upload.status
                                  )}`}
                                  style={{
                                    fontSize: "25px",
                                    padding: "4px 8px",
                                  }}
                                >
                                  {upload.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="document-info-section">
              <div className="info-card">
                <h4>Document Information</h4>
                <div className="info-row">
                  <strong>Document Name:</strong> {selectedDocument.Name}
                </div>
                <div className="info-row">
                  <strong>Upload Date:</strong>{" "}
                  {latestUpload?.uploadedAt || selectedDocument?.uploadedAt
                    ? new Date(
                      latestUpload?.uploadedAt || selectedDocument?.uploadedAt
                    ).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    : "N/A"}
                </div>
                <div className="info-row">
                  <strong>Status:</strong>
                  <span
                    className={`${getStatusBadgeClass(
                      latestUpload?.status || selectedDocument?.status
                    )} ms-2`}
                  >
                    {latestUpload?.status ||
                      selectedDocument?.status ||
                      "No Uploads"}
                  </span>
                </div>

                <button
                  className="action-btn upload-btn"
                  title="Upload Document"
                  onClick={() => {
                    openUploadModal(selectedDocument); // Just pass the selectedDocument
                  }}
                >
                  <i className="fas fa-cloud-upload-alt"></i>
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const UploadModal = () => {
    if (!showUploadModal || !selectedDocumentForUpload) return null;

    return (
      <div className="upload-modal-overlay" onClick={closeUploadModal}>
        <div
          className="upload-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="upload-modal-header">
            <h3>
              <i className="fas fa-cloud-upload-alt me-2"></i>
              Upload {selectedDocumentForUpload.Name}
            </h3>
            <button className="close-btn" onClick={closeUploadModal}>
              &times;
            </button>
          </div>

          <div className="upload-modal-body">
            <div className="upload-section">
              {!selectedFile ? (
                <div className="file-drop-zone">
                  <div className="drop-zone-content">
                    <i className="fas fa-cloud-upload-alt upload-icon"></i>
                    <h4>Choose a file to upload</h4>
                    <p>Drag and drop a file here, or click to select</p>
                    <div className="file-types">
                      <span>Supported: JPG, PNG, GIF, PDF</span>
                      <span>Max size: 10MB</span>
                    </div>
                    <input
                      type="file"
                      id="file-input"
                      accept=".jpg,.jpeg,.png,.gif,.pdf"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        document.getElementById("file-input").click()
                      }
                    >
                      <i className="fas fa-folder-open me-2"></i>
                      Choose File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="file-preview-section">
                  <div className="selected-file-info">
                    <h4>Selected File:</h4>
                    <div className="file-details">
                      <div className="file-icon">
                        <i
                          className={`fas ${selectedFile.type.startsWith("image/")
                            ? "fa-image"
                            : "fa-file-pdf"
                            }`}
                        ></i>
                      </div>
                      <div className="file-info">
                        <p className="file-name">{selectedFile.name}</p>
                        <p className="file-size">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadPreview(null);
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>

                  {uploadPreview && (
                    <div className="upload-preview">
                      <h5>Preview:</h5>
                      <img
                        src={uploadPreview}
                        alt="Upload Preview"
                        className="preview-image"
                      />
                    </div>
                  )}

                  {isUploading && (
                    <div className="upload-progress-section">
                      <h5>Uploading...</h5>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p>{uploadProgress}% Complete</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="upload-modal-footer">
            <button
              className="btn btn-secondary"
              onClick={closeUploadModal}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleFileUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-upload me-2"></i>
                  Upload Document
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const openUploadModal = (document) => {
    setSelectedDocumentForUpload(document);
    setShowUploadModal(true);
    setSelectedFile(null);
    setUploadPreview(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedDocumentForUpload(null);
    setSelectedFile(null);
    setUploadPreview(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  // Enhanced students data with comprehensive tracking
  useEffect(() => {
    if (selectedCourse && selectedCenter) {
      fetchProfileData();
    }
  }, [selectedCourse, selectedCenter, currentPage, activeTab, searchQuery, filterData]);


  // ===== ATTENDANCE FUNCTIONS =====

  // Initialize today's attendance
  useEffect(() => {
    const initialAttendance = {};
    allProfiles.forEach((student) => {
      initialAttendance[student.id] = {
        status: "",
        timeIn: "",
        timeOut: "",
        notes: "",
        isMarked: false,
        lateMinutes: 0,
      };
    });
    setTodayAttendance(initialAttendance);
  }, [selectedDate]);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Get filtered attendance data based on time filter
  const getFilteredAttendanceData = (profile) => {
    // Combine zeroPeriod and regularPeriod sessions into a single array
    const allSessions = [
      ...(profile.attendance?.zeroPeriod?.sessions || []),
      ...(profile.attendance?.regularPeriod?.sessions || [])
    ];

    const today = new Date();
    let startDate, endDate;
    let filteredRecords = [];

    switch (timeFilter) {
      case "today":
        startDate = endDate = selectedDate;
        filteredRecords = allSessions.filter((record) => {
          const recordDate = new Date(record.date).toISOString().split("T")[0];
          return recordDate === selectedDate;
        });
        break;

      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        startDate = weekStart.toISOString().split("T")[0];
        endDate = weekEnd.toISOString().split("T")[0];

        filteredRecords = allSessions.filter((record) => {
          const recordDate = new Date(record.date);
          return recordDate >= weekStart && recordDate <= weekEnd;
        });
        break;

      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        startDate = monthStart.toISOString().split("T")[0];
        endDate = monthEnd.toISOString().split("T")[0];

        filteredRecords = allSessions.filter((record) => {
          const recordDate = new Date(record.date);
          return recordDate >= monthStart && recordDate <= monthEnd;
        });
        break;

      case "year":
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear(), 11, 31);

        startDate = yearStart.toISOString().split("T")[0];
        endDate = yearEnd.toISOString().split("T")[0];

        filteredRecords = allSessions.filter((record) => {
          const recordDate = new Date(record.date);
          return recordDate >= yearStart && recordDate <= yearEnd;
        });
        break;

      case "custom":
        if (dateRange.fromDate && dateRange.toDate) {
          const customStart = new Date(dateRange.fromDate);
          const customEnd = new Date(dateRange.toDate);

          filteredRecords = allSessions.filter((record) => {
            const recordDate = new Date(record.date);
            return recordDate >= customStart && recordDate <= customEnd;
          });
        } else {
          filteredRecords = allSessions;
        }
        break;

      default:
        filteredRecords = allSessions;
    }

    // Convert status values to match frontend expectations
    const convertedRecords = filteredRecords.map(record => ({
      ...record,
      status: record.status?.toLowerCase() || 'absent',
      date: record.date,
      timeIn: record.timeIn || '',
      timeOut: record.timeOut || '',
      lateMinutes: record.lateMinutes || 0,
      notes: record.remarks || ''
    }));

    // Calculate statistics
    const presentDays = convertedRecords.filter(r => r.status === "present").length;
    const absentDays = convertedRecords.filter(r => r.status === "absent").length;
    const lateDays = convertedRecords.filter(r => r.status === "late").length;
    const leaveDays = convertedRecords.filter(r => r.status === "leave").length;
    const halfDays = convertedRecords.filter(r => r.status === "halfday").length;
    const shortLeaveDays = convertedRecords.filter(r => r.status === "shortleave").length;
    const totalWorkingDays = convertedRecords.length;

    const attendancePercentage = totalWorkingDays > 0
      ? (((presentDays + lateDays + halfDays * 0.5 + shortLeaveDays * 0.5) / totalWorkingDays) * 100).toFixed(1)
      : 0;

    const punctualityScore = (presentDays + lateDays) > 0
      ? ((presentDays / (presentDays + lateDays)) * 100).toFixed(1)
      : 0;

    return {
      presentDays,
      absentDays,
      lateDays,
      leaveDays,
      halfDays,
      shortLeaveDays,
      totalWorkingDays,
      attendancePercentage: parseFloat(attendancePercentage),
      punctualityScore: parseFloat(punctualityScore),
      filteredRecords: convertedRecords,
    };
  };

  // Calculate tab counts
  const getTabCounts = () => {

    return {
      all: allProfiles.length,
      admission: allProfiles.filter(s => s.admissionDone && !s.dropout && !s.isBatchFreeze).length,
      zeroPeriod: allProfiles.filter(s => s.isZeroPeriodAssigned && !s.admissionDone).length,
      batchFreeze: allProfiles.filter(s => s.isBatchFreeze).length,
      dropout: allProfiles.filter(s => s.dropout).length,
    };
  };

  // Filter students based on selected tab and search query
  const getFilteredStudents = () => {
    // Since backend handles filtering, just return the data from API
    return allProfiles;
  };

  // Mark individual attendance
  const markIndividualAttendance = async (studentId, status) => {

    try {
      // Use IST date for marking attendance

      const result = await axios.post(`${backendUrl}/college/attendance/mark-attendance`, {
        appliedCourseId: studentId,
        date: selectedDate, // Send IST date
        status: status,
        period: activeTab === 'zeroPeriod' ? 'zeroPeriod' : 'regularPeriod',
        remarks: ''
      }, {
        headers: {
          "x-auth": token
        }
      });

      if (result.status) {
        alert(result.data.message)
        fetchProfileData()
      } else {
        alert(result.data.message)
        fetchProfileData()
      }

    } catch (error) {
      console.error("Error marking attendance:", error);
      alert(error.response?.data?.message || "Failed to mark attendance")
    }
  };


  const isEligibleForTodayAttendance = (profile) => {
    const todayIST = getTodayIST();
    const hasAttendanceToday = [
      ...(profile.attendance?.zeroPeriod?.sessions || []),
      ...(profile.attendance?.regularPeriod?.sessions || [])
    ].some(session => formatDateForIST(session.date) === todayIST);

    return (profile.isZeroPeriodAssigned || profile.isBatchFreeze) && !hasAttendanceToday;
  };

  // Bulk attendance functions
  const toggleStudentSelection = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const selectAllStudents = () => {
    // Get eligible students based on current tab and attendance status
    const eligibleStudents = allProfiles.filter((s) => {
      // Basic eligibility - student should be assigned to zero period or batch
      const isAssigned = s.isZeroPeriodAssigned || s.isBatchFreeze;
      
      // Tab-specific filtering
      let tabCondition = false;
      
      if (activeTab === "all") {
        tabCondition = true; // All students are eligible if assigned
      } else if (activeTab === "zeroPeriod") {
        tabCondition = s.isZeroPeriodAssigned === true;
      } else if (activeTab === "batchFreeze") {
        tabCondition = s.isBatchFreeze === true;
      } else if (activeTab === "admission") {
        tabCondition = s.admissionDone === true;
      }
      
      // Check if attendance already marked for selected date
      const hasAttendanceForSelectedDate = [
        ...(s.attendance?.zeroPeriod?.sessions || []),
        ...(s.attendance?.regularPeriod?.sessions || [])
      ].some(session => {
        // Use our new date helper for comparison
        return session.date === selectedDate;
      });
      
      // Student is eligible if:
      // 1. Meets tab condition
      // 2. Is assigned to period/batch
      // 3. Doesn't have attendance marked for selected date
      return tabCondition && isAssigned && !hasAttendanceForSelectedDate;
    });
  
    
    // Toggle selection
    if (selectedStudents.size === eligibleStudents.length && eligibleStudents.length > 0) {
      // If all eligible students are selected, deselect all
      setSelectedStudents(new Set());
    } else {
      // Select all eligible students
      setSelectedStudents(new Set(eligibleStudents.map((s) => s._id))); // Use _id for MongoDB
    }
  }

  const applyBulkAttendance = () => {
    if (!bulkAttendanceStatus || selectedStudents.size === 0) return;

    selectedStudents.forEach((studentId) => {
      markIndividualAttendance(studentId, bulkAttendanceStatus);
    });

    setSelectedStudents(new Set());
    setBulkAttendanceStatus("");
    setShowBulkControls(false);
    alert(`Bulk attendance marked for ${selectedStudents.size} students`);
  };

  // Save attendance
  const saveAllAttendance = () => {
    const markedCount = Object.values(todayAttendance).filter(
      (a) => a.isMarked
    ).length;
    alert(
      `Attendance saved for ${markedCount} students on ${new Date(
        selectedDate
      ).toLocaleDateString()}`
    );
  };

  const filteredStudents = getFilteredStudents();
  const [tabCounts, setTabCounts] = useState({});

  const togglePopup = (studentIndex) => {
    setShowPopup((prev) => (prev === studentIndex ? null : studentIndex));
  };

  const toggleStudentDetails = (studentIndex) => {
    setLeadDetailsVisible((prev) =>
      prev === studentIndex ? null : studentIndex
    );
  };


  const handleTabClick = (studentIndex, tabIndex) => {
    setStudentTabsActive((prev) => ({
      ...prev,
      [studentIndex]: tabIndex,
    }));
  };
  useEffect(() => {
  }, [studentTabsActive]);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "danger";
      case "frozen":
        return "warning";
      case "present":
        return "success";
      case "late":
        return "warning";
      case "absent":
        return "danger";
      case "leave":
        return "info";
      case "halfDay":
        return "primary";
      case "shortLeave":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getAdmissionStatusBadge = (student) => {
    // Check in priority order
    if (student.dropout) {
      return <span className="badge bg-danger">Dropout</span>;
    }

    if (student.isBatchFreeze) {
      return <span className="badge bg-info">Batch Freeze</span>;
    }

    if (student.isZeroPeriodAssigned) {
      return (
        <span className="badge bg-warning">
          Zero Period ({student.attendance?.zeroPeriod?.totalSessions || 0} days)
        </span>
      );
    }

    // Default case - pending/applied
    return <span className="badge bg-secondary">Pending</span>;
  };

  const getProgressColor = (progress) => {
    if (progress >= 85) return "success";
    if (progress >= 75) return "info";
    if (progress >= 65) return "warning";
    return "danger";
  };

  const formatDuration = (student) => {
    const start = new Date(student.courseStartDate);
    const end = new Date(student.courseEndDate);
    const today = new Date();

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalDays - elapsedDays);

    return {
      total: totalDays,
      elapsed: Math.max(0, elapsedDays),
      remaining: remainingDays,
      progressPercent: Math.round((Math.max(0, elapsedDays) / totalDays) * 100),
    };
  };

  // Check if current tab shows attendance controls
  const showAttendanceControls =
    activeTab === "zeroPeriod" || activeTab === "all" || activeTab === "batchFreeze";



    const attendanceEligibleStudents = allProfiles.filter(s => {
      // Check assignment status
      const hasAssignment = s.isZeroPeriodAssigned === true || s.isBatchFreeze === true;
      
      if (!hasAssignment) {
        return false;
      }
    
      // Get all attendance sessions
      const allSessions = [
        ...(s.attendance?.zeroPeriod?.sessions || []),
        ...(s.attendance?.regularPeriod?.sessions || [])
      ];
    
      // Check if attendance exists for selected date
      const hasAttendanceForSelectedDate = allSessions.some(session => {
        let sessionDate;
        
        // Handle different date formats from backend
        if (typeof session.date === 'string') {
          if (session.date.includes('T')) {
            // Full ISO date: "2025-01-01T18:30:00.000Z"
            sessionDate = new Date(session.date).toISOString().split('T')[0];
            
            // If it's IST representation (18:30 UTC = next day IST)
            if (session.date.includes('18:30:00.000Z')) {
              const utcDate = new Date(session.date);
              const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
              sessionDate = istDate.toISOString().split('T')[0];
            }
          } else {
            // Already in YYYY-MM-DD format
            sessionDate = session.date;
          }
        } else {
          // Date object
          sessionDate = new Date(session.date).toISOString().split('T')[0];
        }
        
        return sessionDate === selectedDate;
      });
    
      const isEligible = hasAssignment && !hasAttendanceForSelectedDate;
      
    
      return isEligible;
    });





  useEffect(() => {
    console.log(selectedStudents, 'selectedStudents')
  }, [selectedStudents])
  // const totalSelected = Object.values(formData || {}).reduce((total, filter) => {
  //   return total + (filter?.values?.length || 0);
  // }, 0);
  const getCurrentISTDisplay = () => {
    const istDate = getISTDate();
    return istDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Enhanced Header */}
          <div className="position-relative">
            <div className="site-header--sticky--register">
              <div className="container-fluid">
                <div className="row align-items-center">
                  <div className="col-md-5 d-md-block d-sm-none">
                    <div className="d-flex align-items-center">


                      <ol className="breadcrumb border-0 mb-0 small">
                        {onBackToCenters && selectedCenter && (
                          <li className="breadcrumb-item">
                            <button
                              className="btn btn-link p-0 text-decoration-none"
                              onClick={onBackToCenters}
                            >
                              Centers
                            </button>
                          </li>
                        )}
                        {onBackToCourses && selectedCourse && (
                          <li className="breadcrumb-item">
                            <button
                              className="btn btn-link p-0 text-decoration-none"
                              onClick={onBackToCourses}
                            >
                              Courses
                            </button>
                          </li>
                        )}
                        {onBackToBatches && selectedBatch && (
                          <li className="breadcrumb-item">
                            <button
                              className="btn btn-link p-0 text-decoration-none"
                              onClick={onBackToBatches}
                            >
                              Batches
                            </button>
                          </li>
                        )}
                        <li
                          className="breadcrumb-item active"
                          aria-current="page"
                        >
                          Students{" "}
                          {selectedBatch && `- ${selectedBatch.name}`}
                        </li>
                      </ol>

                    </div>
                  </div>

                  <div className="col-md-7">
                    <div className="d-flex justify-content-end align-items-center gap-2">
                      {/* ===== ENHANCED ATTENDANCE CONTROLS ===== */}

                      <>
                        {/* Time Filter */}


                        {/* Attendance Mode Toggle */}
                        <button
                          onClick={() => {
                            setShowAttendanceMode(!showAttendanceMode);
                            setShowBulkControls(false)
                          }
                          }
                          className={`btn btn-sm ${showAttendanceMode
                            ? "btn-success"
                            : "btn-outline-success"
                            }`}
                        >
                          <i className="fas fa-check-circle me-1"></i>
                          {showAttendanceMode
                            ? "Exit Attendance"
                            : "Mark Attendance"}
                        </button>

                        {/* Bulk Controls */}
                        {showAttendanceMode && (
                          <button
                            onClick={() =>
                              setShowBulkControls(!showBulkControls)
                            }
                            className={`btn btn-sm ${showBulkControls
                              ? "btn-primary"
                              : "btn-outline-primary"
                              }`}
                          >
                            <i className="fas fa-users me-1"></i>
                            {showBulkControls ? "Exit Bulk Controls" : "Show Bulk Controls"}
                          </button>
                        )}

                        {/* Save & Export */}
                        {showAttendanceMode && (
                          <>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={saveAllAttendance}
                            >
                              <i className="fas fa-save me-1"></i>
                              Save
                            </button>
                          </>
                        )}
                      </>


                      {/* Search */}
                      <div
                        className="input-group"
                        style={{ maxWidth: "200px" }}
                      >
                        <span className="input-group-text bg-white border-end-0 input-height">
                          <i className="fas fa-search text-muted"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0 m-0"
                          placeholder="Search students..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                          <button
                            className="btn btn-outline-secondary border-start-0"
                            type="button"
                            onClick={() => setSearchQuery("")}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>

                      {/* Filter & View Controls */}
                      <button
                        onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                        className={`btn ${!isFilterCollapsed
                          ? "btn-primary"
                          : "btn-outline-primary"
                          }`}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        <i
                          className={`fas fa-filter me-1 ${!isFilterCollapsed ? "fa-spin" : ""
                            }`}
                        ></i>
                        Filters
                      </button>


                      {onBackToBatches && (
                        <button
                          className="btn btn-outline-secondary"
                          onClick={onBackToBatches}
                        >
                          <i className="fas fa-arrow-left"></i> Back
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="col-12 mt-2">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      {mainTabs.map((tab, index) => (
                        <div
                          key={index}
                          className="d-flex align-items-center gap-1"
                        >
                          <button
                            className={`btn btn-sm ${activeTab === tab.key
                              ? "btn-primary"
                              : "btn-outline-secondary"
                              }`}
                            onClick={() => {
                              setActiveTab(tab.key);
                              setFilterData({ ...filterData, status: tab.key });
                              setCurrentPage(1);
                            }}
                          >
                            <i className={`${tab.icon} me-1`}></i>
                            {tab.label}
                            <span
                              className={`ms-1 ${activeTab === tab.key
                                ? "text-white"
                                : "text-dark"
                                }`}
                            >
                              ({tabCounts[tab.key] || 0})
                            </span>
                          </button>
                        </div>
                      ))}
                      <div className="ms-auto">
                        {/* <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => setShowBulkUpload(true)}
                        >
                          <i className="fas fa-upload"></i> Bulk Upload
                        </button> */}
                        <button
                          onClick={handleAttendanceManagement}
                          className="btn btn-sm btn-primary me-2"
                        >
                          <i className="fas fa-chart-line me-1"></i>
                          Attendance Dashboard
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ===== BULK ATTENDANCE CONTROLS ===== */}

                  <div className="col-12 mt-3 p-3 bg-light rounded">
                    {showAttendanceMode && (
                      <div className="d-flex align-items-center gap-2">
                        <label className="form-label mb-0 small fw-bold">
                          Date:
                        </label>
                        <DatePicker
                          value={selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date()}
                          onChange={handleDatePickerChange}
                          format="dd/MM/yyyy"
                          maxDate={new Date()}
                          minDate={new Date(new Date().setDate(new Date().getDate() - 7))}
                          clearIcon={null}
                          calendarIcon={<i className="fas fa-calendar-alt"></i>}
                        />
                      </div>
                    )}
                    {showBulkControls && showAttendanceMode && (

                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <div className="d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input me-2"
                            checked={
                              selectedStudents.size ===
                              attendanceEligibleStudents.length &&
                              attendanceEligibleStudents.length > 0
                            }
                            onChange={selectAllStudents}
                          />
                          <label className="form-check-label fw-bold">
                            Select All Eligible ({selectedStudents.size}/
                            {attendanceEligibleStudents.length})
                          </label>
                        </div>


                        <>

                          <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0 small fw-bold">
                              Mark as:
                            </label>
                            <select
                              className="form-select form-select-sm"
                              value={bulkAttendanceStatus}
                              onChange={(e) =>
                                setBulkAttendanceStatus(e.target.value)
                              }
                              style={{ width: "150px" }}
                            >
                              <option value="">Select Status</option>
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>

                            </select>
                          </div>

                          <button
                            onClick={applyBulkAttendance}
                            className="btn btn-primary btn-sm"
                            disabled={!bulkAttendanceStatus}
                          >
                            <i className="fas fa-check me-1"></i>
                            Apply to {selectedStudents.size} Students
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStudents(new Set());
                              setBulkAttendanceStatus("");
                            }}
                            className="btn btn-outline-secondary btn-sm"
                          >
                            <i className="fas fa-times me-1"></i>
                            Clear
                          </button>
                        </>

                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>

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
                        {/* {totalSelected > 0 && (
                          <span className="badge bg-primary ms-2">
                            {totalSelected} Active
                          </span>
                        )} */}
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


                  {/* Modal Footer - Fixed at bottom */}
                  <div className="modal-footer bg-light border-top">
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <div className="text-muted small">
                        <i className="fas fa-filter me-1"></i>
                        {/* {Object.values(filterData).filter(val => val && val !== 'true').length + totalSelected} filters applied */}
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

          {/* Main Content - Enhanced Students Cards */}
          <div
            className="content-body"
            style={{
              marginTop:
                showBulkControls && showAttendanceMode
                  ? "320px"
                  : showAttendanceMode
                    ? "150px"
                    : "140px",
            }}
          >
            <section className="list-view">
              <div className="row">
                <div className="col-12 rounded equal-height-2 coloumn-2">
                  <div className="card px-3">
                    <div className="row" id="students-main-row">
                      {allProfiles.map((profile, studentIndex) => {
                        const courseInfo = formatDuration(profile);
                        const filteredStats = getFilteredAttendanceData(profile);
                        const isEligibleForAttendance =
                          (profile.isZeroPeriodAssigned || profile.isBatchAssigned) &&
                          !profile.attendance?.regularPeriod?.sessions?.some(session =>
                            new Date(session.date).toDateString() === new Date(selectedDate).toDateString()
                          ) &&
                          !profile.attendance?.zeroPeriod?.sessions?.some(session =>
                            new Date(session.date).toDateString() === new Date(selectedDate).toDateString()
                          );


                        return (
                          <div
                            className={`card-content transition-col mb-2`}
                            key={studentIndex}
                          >
                            {/* Enhanced Student Header Card */}
                            <div className="card border-0 shadow-sm mb-0 mt-2">
                              <div className="card-body px-3 py-3">
                                <div className="row align-items-center justify-content-between">
                                  {/* Student Info */}
                                  <div
                                    className={
                                      showAttendanceMode &&
                                        isEligibleForAttendance
                                        ? "col-md-5"
                                        : "col-md-6"
                                    }
                                  >
                                    <div className="d-flex align-items-center">
                                      {/* Bulk Selection Checkbox */}
                                      {showAttendanceMode &&
                                        showBulkControls &&
                                        isEligibleForAttendance && (
                                          <div className="form-check me-3">
                                            <input
                                              className="form-check-input"
                                              type="checkbox"
                                              checked={selectedStudents.has(
                                                profile._id
                                              )}
                                              onChange={() =>
                                                toggleStudentSelection(
                                                  profile._id
                                                )
                                              }
                                            />
                                          </div>
                                        )}

                                      <div className="me-3">
                                        <div
                                          className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                          style={{
                                            width: "50px",
                                            height: "50px",
                                          }}
                                        >
                                          <i className="bi bi-person-fill fs-4 text-primary"></i>
                                        </div>
                                      </div>
                                      <div>
                                        <h6 className="mb-0 fw-bold">
                                          {profile._candidate.name}
                                        </h6>
                                        <small className="text-muted">
                                          {profile._candidate.mobile}
                                        </small>
                                        <div className="mt-1">
                                          {getAdmissionStatusBadge(profile)}
                                          {/* Show today's attendance status if marked */}
                                          {todayAttendance[profile.id]
                                            ?.isMarked && (
                                              <span
                                                className={`badge bg-${getStatusColor(
                                                  todayAttendance[profile.id]
                                                    ?.status
                                                )} ms-1`}
                                              >
                                                <i
                                                  className={`fas ${todayAttendance[profile.id]
                                                    ?.status === "present"
                                                    ? "fa-check"
                                                    : todayAttendance[
                                                      profile.id
                                                    ]?.status === "absent"
                                                      ? "fa-calendar"
                                                      : "fa-times"
                                                    } me-1`}
                                                ></i>
                                                {todayAttendance[
                                                  profile.id
                                                ]?.status?.toUpperCase()}
                                              </span>
                                            )}
                                        </div>
                                      </div>
                                      <div style={{ marginLeft: "15px" }}>
                                        <button
                                          className="btn btn-outline-primary btn-sm border-0"
                                          title="Call"
                                          style={{ fontSize: "20px" }}
                                        >
                                          <a
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <i className="fas fa-phone"></i>
                                          </a>
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* ===== ENHANCED ATTENDANCE CONTROLS ===== */}
                                  {showAttendanceMode &&
                                    isEligibleForAttendance && !showBulkControls && (
                                      <div className="col-md-5">
                                        <div className="attendance-controls">
                                          <h6 className="text-dark mb-2 small fw-bold">
                                            <i className="fas fa-calendar-check me-1"></i>
                                            Mark Attendance -{" "}
                                            <DatePicker
                                              value={selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date()}
                                              onChange={handleDatePickerChange}
                                              format="dd/MM/yyyy"
                                              clearIcon={null}
                                              maxDate={new Date()}
                                              minDate={new Date(new Date().setDate(new Date().getDate() - 7))}
                                              calendarIcon={<i className="fas fa-calendar-alt"></i>}
                                            />
                                          </h6>
                                          <div className="row mb-2">
                                            <div className="col-12">
                                              <div
                                                className="btn-group btn-group-sm w-100 mb-2"
                                                role="group"
                                              >
                                                <button
                                                  type="button"
                                                  className={`btn ${todayAttendance[profile._id]
                                                    ?.status === "present"
                                                    ? "btn-success"
                                                    : "btn-outline-success"
                                                    }`}
                                                  onClick={() =>
                                                    markIndividualAttendance(
                                                      profile._id,
                                                      "Present"
                                                    )
                                                  }
                                                >
                                                  <i className="fas fa-check"></i>{" "}
                                                  Present
                                                </button>

                                                <button
                                                  type="button"
                                                  className={`btn ${todayAttendance[profile._id]
                                                    ?.status === "absent"
                                                    ? "btn-danger"
                                                    : "btn-outline-danger"
                                                    }`}
                                                  onClick={() =>
                                                    markIndividualAttendance(
                                                      profile._id,
                                                      "bsent"
                                                    )
                                                  }
                                                >
                                                  <i className="fas fa-times"></i>{" "}
                                                  Absent
                                                </button>
                                              </div>
                                            </div>
                                          </div>


                                        </div>
                                      </div>
                                    )}

                                  {/* Action Buttons */}
                                  <div className="col-md-2 text-end mt-2">
                                    <div className="btn-group">
                                      <div
                                        style={{
                                          position: "relative",
                                          display: "inline-block",
                                        }}
                                      >
                                        <button
                                          className="btn btn-sm btn-outline-secondary border-0 popup-button"
                                          onClick={() =>
                                            togglePopup(studentIndex)
                                          }
                                          aria-label="Options"
                                        >
                                          <i className="fas fa-ellipsis-v popup-icon"></i>
                                        </button>

                                        {showPopup === studentIndex && (
                                          <div
                                            style={{
                                              position: "absolute",
                                              top: "100%", // Card के नीचे position करें
                                              right: "0",
                                              width: "170px",
                                              backgroundColor: "white",
                                              border: "1px solid #ddd",
                                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                              borderRadius: "8px",
                                              padding: "8px 0",
                                              zIndex: 9,
                                              opacity: showPopup === studentIndex ? 1 : 0,
                                              visibility: showPopup === studentIndex ? "visible" : "hidden",
                                              transform: showPopup === studentIndex
                                                ? "translateY(8px) scale(1)"
                                                : "translateY(0) scale(0.95)",
                                              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                              transformOrigin: "top right",
                                              // Card को protect करने के लिए
                                              willChange: "transform, opacity",
                                            }}
                                          >
                                            {(filterData.status === "admission" || filterData.status === "zeroPeriod") && (profile.isZeroPeriodAssigned === false || profile.isBatchFreeze === false) && (
                                              <button
                                                className="dropdown-item"
                                                style={{
                                                  width: "100%",
                                                  padding: "10px 16px",
                                                  border: "none",
                                                  background: "none",
                                                  textAlign: "left",
                                                  fontSize: "14px",
                                                  fontWeight: "500",
                                                  transition: "background-color 0.2s ease",
                                                  cursor: "pointer",
                                                }}

                                                onClick={(e) => {
                                                  setShowPopup(null);
                                                  setSelectedStudent(profile);
                                                  handleMoveCandidate(profile, e.target.innerText);
                                                }}
                                              >
                                                {filterData.status === "admission" ? "Move in Zero Period" : "Move in Batch Freeze"}
                                              </button>)}

                                            {(filterData.status !== "dropout" || profile.dropout === false) && (
                                              <button
                                                className="dropdown-item"
                                                style={{
                                                  width: "100%",
                                                  padding: "10px 16px",
                                                  border: "none",
                                                  background: "none",
                                                  textAlign: "left",
                                                  fontSize: "14px",
                                                  fontWeight: "500",
                                                  transition: "background-color 0.2s ease",
                                                  cursor: "pointer",
                                                }}

                                                onClick={(e) => {
                                                  setShowPopup(null);
                                                  setSelectedStudent(profile);
                                                  handleMoveCandidate(profile, e.target.innerText);
                                                }}
                                              >
                                                Dropout
                                              </button>)}

                                          </div>
                                        )}


                                      </div>

                                      <button
                                        className="btn btn-sm btn-outline-secondary border-0"
                                        onClick={() =>
                                          toggleStudentDetails(studentIndex)
                                        }
                                      >
                                        {leadDetailsVisible === studentIndex ? (
                                          <i className="fas fa-chevron-up"></i>
                                        ) : (
                                          <i className="fas fa-chevron-down"></i>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Notes Section for Attendance */}
                                {showAttendanceMode &&
                                  isEligibleForAttendance &&
                                  todayAttendance[profile.id]?.isMarked && (
                                    <div className="row mt-3">
                                      <div className="col-12">
                                        <label className="form-label small mb-1">
                                          Notes (Optional)
                                        </label>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Add notes for today's attendance..."
                                          value={
                                            todayAttendance[profile.id]
                                              ?.notes || ""
                                          }
                                          onChange={(e) =>
                                            setTodayAttendance((prev) => ({
                                              ...prev,
                                              [profile.id]: {
                                                ...prev[profile.id],
                                                notes: e.target.value,
                                              },
                                            }))
                                          }
                                        />
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>

                            {/* Enhanced Tab Navigation and Content Card */}
                            {leadDetailsVisible === studentIndex && (
                              <div className="card border-0 shadow-sm mb-4">
                                <div className="card-header bg-white border-bottom py-3">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <ul className="nav nav-pills nav-pills-sm">
                                      {tabs.map((tab, tabIndex) => (
                                        <li className="nav-item" key={tabIndex}>
                                          <button
                                            className={`nav-link ${(studentTabsActive[
                                              studentIndex
                                            ] || 0) === tabIndex
                                              ? "active"
                                              : ""
                                              }`}
                                            onClick={() =>
                                              handleTabClick(
                                                studentIndex,
                                                tabIndex
                                              )
                                            }
                                          >
                                            <i
                                              className={`fas ${tabIndex === 0
                                                ? "fa-user"
                                                : tabIndex === 1
                                                  ? "fa-briefcase"
                                                  : tabIndex === 2
                                                    ? "fa-graduation-cap"
                                                    : tabIndex === 3
                                                      ? "fa-file-alt"
                                                      : "fa-calendar-check"
                                                } me-1`}
                                            ></i>
                                            {tab}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                <div className="card-body">
                                  {(studentTabsActive[studentIndex] || 0) === 0 && (
                                    <div className="tab-pane active" id="lead-details">
                                      {/* Your lead details content here */}
                                      <div className="scrollable-container">
                                        <div className="scrollable-content">
                                          <div className="info-card">
                                            <div className="info-group">
                                              <div className="info-label">LEAD AGE</div>
                                              <div className="info-value">{profile.createdAt ?
                                                Math.floor((new Date() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24)) + ' Days'
                                                : 'N/A'}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">Lead Owner</div>
                                              <div className="info-value">{profile.leadOwner?.join(', ') || 'N/A'}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">COURSE / JOB NAME</div>
                                              <div className="info-value">{profile._course?.name}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">BATCH NAME</div>
                                              <div className="info-value">{profile._course?.batchName || 'N/A'}</div>
                                            </div>
                                          </div>

                                          <div className="info-card">
                                            <div className="info-group">
                                              <div className="info-label">TYPE OF PROJECT</div>
                                              <div className="info-value">{profile._course?.typeOfProject}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">PROJECT</div>
                                              <div className="info-value">{profile._course?.projectName || 'N/A'}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">SECTOR</div>
                                              <div className="info-value">{profile.sector}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">LEAD CREATION DATE</div>
                                              <div className="info-value">{profile.createdAt ?
                                                new Date(profile.createdAt).toLocaleString() : 'N/A'}</div>
                                            </div>
                                          </div>

                                          <div className="info-card">
                                            <div className="info-group">
                                              <div className="info-label">STATE</div>
                                              <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.state || 'N/A'}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">City</div>
                                              <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.city || 'N/A'}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">BRANCH NAME</div>
                                              <div className="info-value">{profile._center?.name || 'N/A'}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">LEAD MODIFICATION DATE</div>
                                              <div className="info-value">{profile.updatedAt ?
                                                new Date(profile.updatedAt).toLocaleString() : 'N/A'}</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>


                                      <div className="scroll-arrow scroll-left d-md-none" onClick={scrollLeft}>&lt;</div>
                                      <div className="scroll-arrow scroll-right d-md-none" onClick={scrollRight}>&gt;</div>


                                      <div className="desktop-view">
                                        <div className="row g-4">

                                          <div className="col-12">
                                            <div className="scrollable-container">
                                              <div className="scrollable-content">
                                                <div className="info-card">
                                                  <div className="info-group">
                                                    <div className="info-label">LEAD AGE</div>
                                                    <div className="info-value">{profile.createdAt ?
                                                      Math.floor((new Date() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24)) + ' Days'
                                                      : 'N/A'}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">Lead Owner</div>
                                                    <div className="info-value">{profile.leadOwner?.join(', ') || 'N/A'}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">COURSE / JOB NAME</div>
                                                    <div className="info-value">{profile._course?.name}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">BATCH NAME</div>
                                                    <div className="info-value">{profile._course?.batchName || 'N/A'}</div>
                                                  </div>
                                                </div>

                                                <div className="info-card">
                                                  <div className="info-group">
                                                    <div className="info-label">TYPE OF PROJECT</div>
                                                    <div className="info-value">{profile._course?.typeOfProject}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">PROJECT</div>
                                                    <div className="info-value">{profile._course?.projectName || 'N/A'}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">SECTOR</div>
                                                    <div className="info-value">{profile._course?.sectors}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">LEAD CREATION DATE</div>
                                                    <div className="info-value">{profile.createdAt ?
                                                      new Date(profile.createdAt).toLocaleString() : 'N/A'}</div>
                                                  </div>
                                                </div>

                                                <div className="info-card">
                                                  <div className="info-group">
                                                    <div className="info-label">STATE</div>
                                                    <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.state || 'N/A'}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">City</div>
                                                    <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.city || 'N/A'}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">BRANCH NAME</div>
                                                    <div className="info-value">{profile._center?.name || 'N/A'}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">LEAD MODIFICATION DATE</div>
                                                    <div className="info-value">{profile.updatedAt ?
                                                      new Date(profile.updatedAt).toLocaleString() : 'N/A'}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">LEAD MODIFICATION By</div>
                                                    <div className="info-value">Mar 21, 2025 3:32 PM</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">Counsellor Name</div>
                                                    <div className="info-value">{profile?.leadAssignment?.length > 0 ? profile?.leadAssignment[profile?.leadAssignment?.length - 1]?.counsellorName : 'N/A'}</div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="scroll-arrow scroll-left d-md-none">&lt;</div>
                                            <div className="scroll-arrow scroll-right  d-md-none">&gt;</div>

                                            <div className="desktop-view">
                                              <div className="row">
                                                <div className="col-xl-3 col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">LEAD AGE</div>
                                                    <div className="info-value">{profile.createdAt ?
                                                      Math.floor((new Date() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24)) + ' Days'
                                                      : 'N/A'}</div>
                                                  </div>
                                                </div>

                                                <div className="col-xl-3 col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">STATE</div>
                                                    <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.state || 'N/A'}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">CITY</div>
                                                    <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.city || 'N/A'}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">TYPE OF PROJECT</div>
                                                    <div className="info-value">{profile._course?.typeOfProject}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">PROJECT</div>
                                                    <div className="info-value">{profile._course?.projectName || 'N/A'}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">Sector</div>
                                                    <div className="info-value">{profile._course?.sectors}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">COURSE / JOB NAME</div>
                                                    <div className="info-value">{profile._course?.name}</div>
                                                  </div>
                                                </div>


                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">BRANCH NAME</div>
                                                    <div className="info-value">{profile._center?.name || 'N/A'}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">NEXT ACTION DATE</div>
                                                    <div className="info-value">
                                                      {profile.followups?.length > 0
                                                        ?
                                                        (() => {
                                                          const dateObj = new Date(profile.followups[profile.followups.length - 1].date);
                                                          const datePart = dateObj.toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                          }).replace(/ /g, '-');
                                                          const timePart = dateObj.toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true,
                                                          });
                                                          return `${datePart}, ${timePart}`;
                                                        })()
                                                        : 'N/A'}
                                                    </div>

                                                  </div>
                                                </div>

                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">LEAD CREATION DATE</div>
                                                    <div className="info-value">{profile.createdAt ? (() => {
                                                      const dateObj = new Date(profile.createdAt);
                                                      const datePart = dateObj.toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                      }).replace(/ /g, '-');
                                                      const timePart = dateObj.toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true,
                                                      });
                                                      return `${datePart}, ${timePart}`;
                                                    })() : 'N/A'}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">LEAD MODIFICATION DATE</div>
                                                    <div className="info-value">{profile.updatedAt ? (() => {
                                                      const dateObj = new Date(profile.updatedAt);
                                                      const datePart = dateObj.toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                      }).replace(/ /g, '-');
                                                      const timePart = dateObj.toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true,
                                                      });
                                                      return `${datePart}, ${timePart}`;
                                                    })() : 'N/A'}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">LEAD MODIFICATION BY</div>
                                                    <div className="info-value">{profile.logs?.length ? profile.logs[profile.logs.length - 1]?.user?.name || '' : ''}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">Counsellor Name</div>
                                                    <div className="info-value"> {profile?.leadAssignment?.length > 0 ? profile?.leadAssignment[profile?.leadAssignment?.length - 1]?.counsellorName : 'N/A'}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">LEAD OWNER</div>
                                                    <div className="info-value">{profile.registeredBy?.name || 'Self Registerd'}</div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Profile Tab */}
                                  {(studentTabsActive[studentIndex] || 0) ===
                                    1 && (
                                      <div
                                        className="tab-pane active"
                                        id="profile"
                                      >
                                        <div className="resume-preview-body">
                                          <div
                                            id="resume-download"
                                            className="resume-document"
                                          >
                                            <div className="resume-document-header">
                                              <div className="resume-profile-section">
                                                {user?.image ? (
                                                  <img
                                                    src={`${bucketUrl}/${user.image}`}
                                                    alt="Profile"
                                                    className="resume-profile-image"
                                                  />
                                                ) : (
                                                  <div className="resume-profile-placeholder">
                                                    <i className="bi bi-person-circle"></i>
                                                  </div>
                                                )}

                                                <div className="resume-header-content">
                                                  <h1 className="resume-name">
                                                    {profile._candidate?.name ||
                                                      "Your Name"}
                                                  </h1>
                                                  <p className="resume-title">
                                                    {profile._candidate
                                                      ?.personalInfo
                                                      ?.professionalTitle ||
                                                      "Professional Title"}
                                                  </p>
                                                  <p className="resume-title">
                                                    {profile._candidate?.sex ||
                                                      "Sex"}
                                                  </p>

                                                  <div className="resume-contact-details">
                                                    <div className="resume-contact-item">
                                                      <i className="bi bi-telephone-fill"></i>
                                                      <span>
                                                        {
                                                          profile._candidate
                                                            ?.mobile
                                                        }
                                                      </span>
                                                    </div>

                                                    <div className="resume-contact-item">
                                                      <i className="bi bi-envelope-fill"></i>
                                                      <span>
                                                        {
                                                          profile._candidate
                                                            ?.email
                                                        }
                                                      </span>
                                                    </div>

                                                    {profile._candidate?.dob && (
                                                      <div className="resume-contact-item">
                                                        <i className="bi bi-calendar-heart-fill"></i>
                                                        {new Date(
                                                          profile._candidate.dob
                                                        ).toLocaleDateString(
                                                          "en-IN",
                                                          {
                                                            day: "2-digit",
                                                            month: "long",
                                                            year: "numeric",
                                                          }
                                                        )}
                                                      </div>
                                                    )}
                                                    {profile._candidate
                                                      ?.personalInfo
                                                      ?.currentAddress?.city && (
                                                        <div className="resume-contact-item">
                                                          <i className="bi bi-geo-alt-fill"></i>
                                                          <span>
                                                            Current:
                                                            {
                                                              profile._candidate
                                                                .personalInfo
                                                                .currentAddress
                                                                .fullAddress
                                                            }
                                                          </span>
                                                        </div>
                                                      )}
                                                    {profile._candidate
                                                      ?.personalInfo
                                                      ?.permanentAddress
                                                      ?.city && (
                                                        <div className="resume-contact-item">
                                                          <i className="bi bi-house-fill"></i>
                                                          <span>
                                                            Permanent:{" "}
                                                            {
                                                              profile._candidate
                                                                .personalInfo
                                                                .permanentAddress
                                                                .fullAddress
                                                            }
                                                          </span>
                                                        </div>
                                                      )}
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="resume-summary">
                                                <h2 className="resume-section-title">
                                                  Professional Summary
                                                </h2>
                                                <p>
                                                  {profile._candidates
                                                    ?.personalInfo?.summary ||
                                                    "No summary provided"}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="resume-document-body">
                                              <div className="resume-column resume-left-column">
                                                {profile._candidate
                                                  ?.isExperienced === false ? (
                                                  <div className="resume-section">
                                                    <h2 className="resume-section-title">
                                                      Work Experience
                                                    </h2>
                                                    <div className="resume-experience-item">
                                                      <div className="resume-item-header">
                                                        <h3 className="resume-item-title">
                                                          Fresher
                                                        </h3>
                                                      </div>
                                                      <div className="resume-item-content">
                                                        <p>
                                                          Looking for
                                                          opportunities to start
                                                          my career
                                                        </p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  profile._candidate?.experiences
                                                    ?.length > 0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">
                                                        Work Experience
                                                      </h2>
                                                      {profile._candidate.experiences.map(
                                                        (exp, index) => (
                                                          <div
                                                            className="resume-experience-item"
                                                            key={`resume-exp-${index}`}
                                                          >
                                                            <div className="resume-item-header">
                                                              {exp.jobTitle && (
                                                                <h3 className="resume-item-title">
                                                                  {exp.jobTitle}
                                                                </h3>
                                                              )}
                                                              {exp.companyName && (
                                                                <p className="resume-item-subtitle">
                                                                  {
                                                                    exp.companyName
                                                                  }
                                                                </p>
                                                              )}
                                                              {(exp.from ||
                                                                exp.to ||
                                                                exp.currentlyWorking) && (
                                                                  <p className="resume-item-period">
                                                                    {exp.from
                                                                      ? new Date(
                                                                        exp.from
                                                                      ).toLocaleDateString(
                                                                        "en-IN",
                                                                        {
                                                                          year: "numeric",
                                                                          month:
                                                                            "short",
                                                                        }
                                                                      )
                                                                      : "Start Date"}
                                                                    {" - "}
                                                                    {exp.currentlyWorking
                                                                      ? "Present"
                                                                      : exp.to
                                                                        ? new Date(
                                                                          exp.to
                                                                        ).toLocaleDateString(
                                                                          "en-IN",
                                                                          {
                                                                            year: "numeric",
                                                                            month:
                                                                              "short",
                                                                          }
                                                                        )
                                                                        : "End Date"}
                                                                  </p>
                                                                )}
                                                            </div>
                                                            {exp.jobDescription && (
                                                              <div className="resume-item-content">
                                                                <p>
                                                                  {
                                                                    exp.jobDescription
                                                                  }
                                                                </p>
                                                              </div>
                                                            )}
                                                          </div>
                                                        )
                                                      )}
                                                    </div>
                                                  )
                                                )}

                                                {profile._candidate
                                                  ?.qualifications?.length >
                                                  0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">
                                                        Education
                                                      </h2>
                                                      {profile._candidate.qualifications.map(
                                                        (edu, index) => (
                                                          <div
                                                            className="resume-education-item"
                                                            key={`resume-edu-${index}`}
                                                          >
                                                            <div className="resume-item-header">
                                                              {edu.education && (
                                                                <h3 className="resume-item-title">
                                                                  {edu.education}
                                                                </h3>
                                                              )}
                                                              {edu.course && (
                                                                <h3 className="resume-item-title">
                                                                  {edu.course}
                                                                </h3>
                                                              )}
                                                              {edu.universityName && (
                                                                <p className="resume-item-subtitle">
                                                                  {
                                                                    edu.universityName
                                                                  }
                                                                </p>
                                                              )}
                                                              {edu.schoolName && (
                                                                <p className="resume-item-subtitle">
                                                                  {edu.schoolName}
                                                                </p>
                                                              )}
                                                              {edu.collegeName && (
                                                                <p className="resume-item-subtitle">
                                                                  {edu.collegeName}
                                                                </p>
                                                              )}
                                                              {edu.passingYear && (
                                                                <p className="resume-item-period">
                                                                  {edu.passingYear}
                                                                </p>
                                                              )}
                                                            </div>
                                                            <div className="resume-item-content">
                                                              {edu.marks && (
                                                                <p>
                                                                  Marks: {edu.marks}
                                                                  %
                                                                </p>
                                                              )}
                                                              {edu.specialization && (
                                                                <p>
                                                                  Specialization:{" "}
                                                                  {
                                                                    edu.specialization
                                                                  }
                                                                </p>
                                                              )}
                                                            </div>
                                                          </div>
                                                        )
                                                      )}
                                                    </div>
                                                  )}
                                              </div>

                                              <div className="resume-column resume-right-column">
                                                {profile._candidate?.personalInfo
                                                  ?.skills?.length > 0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">
                                                        Skills
                                                      </h2>
                                                      <div className="resume-skills-list">
                                                        {profile._candidate.personalInfo.skills.map(
                                                          (skill, index) => (
                                                            <div
                                                              className="resume-skill-item"
                                                              key={`resume-skill-${index}`}
                                                            >
                                                              <div className="resume-skill-name">
                                                                {skill.skillName ||
                                                                  skill}
                                                              </div>
                                                              {skill.skillPercent && (
                                                                <div className="resume-skill-bar-container">
                                                                  <div
                                                                    className="resume-skill-bar"
                                                                    style={{
                                                                      width: `${skill.skillPercent}%`,
                                                                    }}
                                                                  ></div>
                                                                  <span className="resume-skill-percent">
                                                                    {
                                                                      skill.skillPercent
                                                                    }
                                                                    %
                                                                  </span>
                                                                </div>
                                                              )}
                                                            </div>
                                                          )
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}

                                                {profile._candidate?.personalInfo
                                                  ?.languages?.length > 0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">
                                                        Languages
                                                      </h2>
                                                      <div className="resume-languages-list">
                                                        {profile._candidate.personalInfo.languages.map(
                                                          (lang, index) => (
                                                            <div
                                                              className="resume-language-item"
                                                              key={`resume-lang-${index}`}
                                                            >
                                                              <div className="resume-language-name">
                                                                {lang.name ||
                                                                  lang.lname ||
                                                                  lang}
                                                              </div>
                                                              {lang.level && (
                                                                <div className="resume-language-level">
                                                                  {[
                                                                    1, 2, 3, 4, 5,
                                                                  ].map((dot) => (
                                                                    <span
                                                                      key={`resume-lang-dot-${index}-${dot}`}
                                                                      className={`resume-level-dot ${dot <=
                                                                        (lang.level ||
                                                                          0)
                                                                        ? "filled"
                                                                        : ""
                                                                        }`}
                                                                    ></span>
                                                                  ))}
                                                                </div>
                                                              )}
                                                            </div>
                                                          )
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}

                                                {profile._candidate?.personalInfo
                                                  ?.certifications?.length >
                                                  0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">
                                                        Certifications
                                                      </h2>
                                                      <ul className="resume-certifications-list">
                                                        {profile._candidate.personalInfo.certifications.map(
                                                          (cert, index) => (
                                                            <li
                                                              key={`resume-cert-${index}`}
                                                              className="resume-certification-item"
                                                            >
                                                              <strong>
                                                                {cert.certificateName ||
                                                                  cert.name}
                                                              </strong>
                                                              {cert.orgName && (
                                                                <span className="resume-cert-org">
                                                                  {" "}
                                                                  - {cert.orgName}
                                                                </span>
                                                              )}
                                                              {(cert.month ||
                                                                cert.year) && (
                                                                  <span className="resume-cert-date">
                                                                    {cert.month &&
                                                                      cert.year
                                                                      ? ` (${cert.month}/${cert.year})`
                                                                      : cert.month
                                                                        ? ` (${cert.month})`
                                                                        : cert.year
                                                                          ? ` (${cert.year})`
                                                                          : ""}
                                                                  </span>
                                                                )}
                                                            </li>
                                                          )
                                                        )}
                                                      </ul>
                                                    </div>
                                                  )}

                                                {profile._candidate?.personalInfo
                                                  ?.projects?.length > 0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">
                                                        Projects
                                                      </h2>
                                                      {profile._candidate.personalInfo.projects.map(
                                                        (proj, index) => (
                                                          <div
                                                            className="resume-project-item"
                                                            key={`resume-proj-${index}`}
                                                          >
                                                            <div className="resume-item-header">
                                                              <h3 className="resume-project-title">
                                                                {proj.projectName ||
                                                                  "Project"}
                                                                {proj.year && (
                                                                  <span className="resume-project-year">
                                                                    {" "}
                                                                    ({proj.year})
                                                                  </span>
                                                                )}
                                                              </h3>
                                                            </div>
                                                            {proj.description && (
                                                              <div className="resume-item-content">
                                                                <p>
                                                                  {proj.description}
                                                                </p>
                                                              </div>
                                                            )}
                                                          </div>
                                                        )
                                                      )}
                                                    </div>
                                                  )}

                                                {profile._candidate?.personalInfo
                                                  ?.interest?.length > 0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">
                                                        Interests
                                                      </h2>
                                                      <div className="resume-interests-tags">
                                                        {profile._candidate.personalInfo.interest.map(
                                                          (interest, index) => (
                                                            <span
                                                              className="resume-interest-tag"
                                                              key={`resume-interest-${index}`}
                                                            >
                                                              {interest}
                                                            </span>
                                                          )
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}
                                              </div>
                                            </div>

                                            {profile._candidate?.personalInfo
                                              ?.declaration?.text && (
                                                <div className="resume-declaration">
                                                  <h2 className="resume-section-title">
                                                    Declaration
                                                  </h2>
                                                  <p>
                                                    {
                                                      profile._candidate
                                                        .personalInfo.declaration
                                                        .text
                                                    }
                                                  </p>
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                      </div>
                                    )}




                                  {/* Course History Tab */}
                                  {(studentTabsActive[studentIndex] || 0) ===
                                    2 && (
                                      <div
                                        className="tab-pane active"
                                        id="course-history"
                                      >
                                        <div className="section-card">
                                          <div className="table-responsive">
                                            <table className="table  table-bordered course-history-table">
                                              <thead className="table-light">
                                                <tr>
                                                  <th>S.No</th>
                                                  <th>Applied Date</th>
                                                  <th>Course Name</th>
                                                  <th>Lead Added By</th>
                                                  <th>Counsellor</th>
                                                  <th>Status</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {profile?._candidate
                                                  ?._appliedCourses &&
                                                  profile._candidate._appliedCourses
                                                    .length > 0 ? (
                                                  profile._candidate._appliedCourses.map(
                                                    (course, index) => (
                                                      <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                          {new Date(
                                                            course.createdAt
                                                          ).toLocaleDateString(
                                                            "en-GB"
                                                          )}
                                                        </td>
                                                        <td>
                                                          {course._course?.name ||
                                                            "N/A"}
                                                        </td>
                                                        <td>
                                                          {course.registeredBy
                                                            ?.name ||
                                                            "Self Registered"}
                                                        </td>
                                                        <td>
                                                          {course.month || ""}{" "}
                                                          {course.year || ""}
                                                        </td>
                                                        <td>
                                                          <span className="text-success">
                                                            {course._leadStatus
                                                              ?.title || "-"}
                                                          </span>
                                                        </td>
                                                      </tr>
                                                    )
                                                  )
                                                ) : (
                                                  <tr>
                                                    <td
                                                      colSpan={6}
                                                      className="text-center"
                                                    >
                                                      No course history available
                                                    </td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                  {/* Documents Tab */}
                                  {(studentTabsActive[studentIndex] || 0) ===
                                    3 && (
                                      <div
                                        className="tab-pane active"
                                        id="studentsDocuments"
                                      >
                                        {(() => {
                                          const documentsToDisplay =
                                            profile.uploadedDocs || [];
                                          const totalRequired =
                                            profile?.docCounts?.totalRequired ||
                                            0;

                                          // If no documents are required, show a message
                                          if (totalRequired === 0) {
                                            return (
                                              <div className="col-12 text-center py-5">
                                                <div className="text-muted">
                                                  <i className="fas fa-file-check fa-3x mb-3 text-success"></i>
                                                  <h5 className="text-success">
                                                    No Documents Required
                                                  </h5>
                                                  <p>
                                                    This course does not require
                                                    any document verification.
                                                  </p>
                                                </div>
                                              </div>
                                            );
                                          }

                                          // If documents are required, show the full interface
                                          return (
                                            <div className="enhanced-documents-panel">
                                              {/* Enhanced Stats Grid */}
                                              <div className="stats-grid">
                                                {(() => {
                                                  // Use backend counts only, remove static document fallback
                                                  const backendCounts =
                                                    profile?.docCounts || {};
                                                  return (
                                                    <>
                                                      <div className="stat-card total-docs">
                                                        <div className="stat-icon">
                                                          <i className="fas fa-file-alt"></i>
                                                        </div>
                                                        <div className="stat-info">
                                                          <h4>
                                                            {backendCounts.totalRequired ||
                                                              0}
                                                          </h4>
                                                          <p>Total Required</p>
                                                        </div>
                                                        <div className="stat-trend">
                                                          <i className="fas fa-list"></i>
                                                        </div>
                                                      </div>

                                                      <div className="stat-card uploaded-docs">
                                                        <div className="stat-icon">
                                                          <i className="fas fa-cloud-upload-alt"></i>
                                                        </div>
                                                        <div className="stat-info">
                                                          <h4>
                                                            {backendCounts.uploadedCount ||
                                                              0}
                                                          </h4>
                                                          <p>Uploaded</p>
                                                        </div>
                                                        <div className="stat-trend">
                                                          <i className="fas fa-arrow-up"></i>
                                                        </div>
                                                      </div>

                                                      <div className="stat-card pending-docs">
                                                        <div className="stat-icon">
                                                          <i className="fas fa-clock"></i>
                                                        </div>
                                                        <div className="stat-info">
                                                          <h4>
                                                            {backendCounts.pendingVerificationCount ||
                                                              0}
                                                          </h4>
                                                          <p>Pending Review</p>
                                                        </div>
                                                        <div className="stat-trend">
                                                          <i className="fas fa-exclamation-triangle"></i>
                                                        </div>
                                                      </div>

                                                      <div className="stat-card verified-docs">
                                                        <div className="stat-icon">
                                                          <i className="fas fa-check-circle"></i>
                                                        </div>
                                                        <div className="stat-info">
                                                          <h4>
                                                            {backendCounts.verifiedCount ||
                                                              0}
                                                          </h4>
                                                          <p>Approved</p>
                                                        </div>
                                                        <div className="stat-trend">
                                                          <i className="fas fa-thumbs-up"></i>
                                                        </div>
                                                      </div>

                                                      <div className="stat-card rejected-docs">
                                                        <div className="stat-icon">
                                                          <i className="fas fa-times-circle"></i>
                                                        </div>
                                                        <div className="stat-info">
                                                          <h4>
                                                            {backendCounts.RejectedCount ||
                                                              0}
                                                          </h4>
                                                          <p>Rejected</p>
                                                        </div>
                                                        <div className="stat-trend">
                                                          <i className="fas fa-arrow-down"></i>
                                                        </div>
                                                      </div>
                                                    </>
                                                  );
                                                })()}
                                              </div>

                                              {/* Enhanced Filter Section */}
                                              <div className="filter-section-enhanced">
                                                <div className="filter-tabs-container">
                                                  <h5 className="filter-title">
                                                    <i className="fas fa-filter me-2"></i>
                                                    Filter Documents
                                                  </h5>
                                                  <div className="filter-tabs">
                                                    {(() => {
                                                      const backendCounts =
                                                        profile?.docCounts || {};
                                                      return (
                                                        <>
                                                          <button
                                                            className={`filter-btn ${statusFilter ===
                                                              "all"
                                                              ? "active"
                                                              : ""
                                                              }`}
                                                            onClick={() =>
                                                              setStatusFilter(
                                                                "all"
                                                              )
                                                            }
                                                          >
                                                            <i className="fas fa-list-ul"></i>
                                                            All Documents
                                                            <span className="badge">
                                                              {backendCounts.totalRequired ||
                                                                0}
                                                            </span>
                                                          </button>
                                                          <button
                                                            className={`filter-btn pending ${statusFilter ===
                                                              "pending"
                                                              ? "active"
                                                              : ""
                                                              }`}
                                                            onClick={() =>
                                                              setStatusFilter(
                                                                "pending"
                                                              )
                                                            }
                                                          >
                                                            <i className="fas fa-clock"></i>
                                                            Pending
                                                            <span className="badge">
                                                              {backendCounts.pendingVerificationCount ||
                                                                0}
                                                            </span>
                                                          </button>
                                                          <button
                                                            className={`filter-btn verified ${statusFilter ===
                                                              "verified"
                                                              ? "active"
                                                              : ""
                                                              }`}
                                                            onClick={() =>
                                                              setStatusFilter(
                                                                "verified"
                                                              )
                                                            }
                                                          >
                                                            <i className="fas fa-check-circle"></i>
                                                            Verified
                                                            <span className="badge">
                                                              {backendCounts.verifiedCount ||
                                                                0}
                                                            </span>
                                                          </button>
                                                          <button
                                                            className={`filter-btn rejected ${statusFilter ===
                                                              "rejected"
                                                              ? "active"
                                                              : ""
                                                              }`}
                                                            onClick={() =>
                                                              setStatusFilter(
                                                                "rejected"
                                                              )
                                                            }
                                                          >
                                                            <i className="fas fa-times-circle"></i>
                                                            Rejected
                                                            <span className="badge">
                                                              {backendCounts.RejectedCount ||
                                                                0}
                                                            </span>
                                                          </button>
                                                        </>
                                                      );
                                                    })()}
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Enhanced Documents Grid */}
                                              <div className="documents-grid-enhanced">
                                                {(() => {
                                                  // Filter documents based on status filter
                                                  const filteredDocs =
                                                    filterDocuments(
                                                      documentsToDisplay
                                                    );

                                                  if (filteredDocs.length === 0) {
                                                    return (
                                                      <div className="col-12 text-center py-5">
                                                        <div className="text-muted">
                                                          <i className="fas fa-filter fa-3x mb-3"></i>
                                                          <h5>
                                                            No Documents Found
                                                          </h5>
                                                          <p>
                                                            No documents match the
                                                            current filter
                                                            criteria.
                                                          </p>
                                                        </div>
                                                      </div>
                                                    );
                                                  }

                                                  return filteredDocs.map(
                                                    (doc, index) => {
                                                      // Check if this is a document with upload data or just uploaded file info
                                                      const latestUpload =
                                                        doc.uploads &&
                                                          doc.uploads.length > 0
                                                          ? doc.uploads[
                                                          doc.uploads.length -
                                                          1
                                                          ]
                                                          : doc.fileUrl &&
                                                            doc.status !==
                                                            "Not Uploaded"
                                                            ? doc
                                                            : null;

                                                      return (
                                                        <div
                                                          key={doc._id || index}
                                                          className="document-card-enhanced"
                                                        >
                                                          <div className="document-image-container">
                                                            {latestUpload ||
                                                              (doc.fileUrl &&
                                                                doc.status !==
                                                                "Not Uploaded") ? (
                                                              <>
                                                                {(() => {
                                                                  const fileUrl =
                                                                    latestUpload?.fileUrl ||
                                                                    doc.fileUrl;
                                                                  const fileType =
                                                                    getFileType(
                                                                      fileUrl
                                                                    );

                                                                  if (
                                                                    fileType ===
                                                                    "image"
                                                                  ) {
                                                                    return (
                                                                      <img
                                                                        src={
                                                                          fileUrl
                                                                        }
                                                                        alt="Document Preview"
                                                                        className="document-image"
                                                                      />
                                                                    );
                                                                  } else if (
                                                                    fileType ===
                                                                    "pdf"
                                                                  ) {
                                                                    return (
                                                                      <div className="document-preview-icon">
                                                                        <i
                                                                          className="fa-solid fa-file"
                                                                          style={{
                                                                            fontSize:
                                                                              "100px",
                                                                            color:
                                                                              "#dc3545",
                                                                          }}
                                                                        ></i>
                                                                        <p
                                                                          style={{
                                                                            fontSize:
                                                                              "12px",
                                                                            marginTop:
                                                                              "10px",
                                                                          }}
                                                                        >
                                                                          PDF
                                                                          Document
                                                                        </p>
                                                                      </div>
                                                                    );
                                                                  } else {
                                                                    return (
                                                                      <div className="document-preview-icon">
                                                                        <i
                                                                          className={`fas ${fileType ===
                                                                            "pdf"
                                                                            ? "fa-file-word"
                                                                            : fileType ===
                                                                              "spreadsheet"
                                                                              ? "fa-file-excel"
                                                                              : "fa-file"
                                                                            }`}
                                                                          style={{
                                                                            fontSize:
                                                                              "40px",
                                                                            color:
                                                                              "#6c757d",
                                                                          }}
                                                                        ></i>
                                                                        <p
                                                                          style={{
                                                                            fontSize:
                                                                              "12px",
                                                                            marginTop:
                                                                              "10px",
                                                                          }}
                                                                        >
                                                                          {fileType ===
                                                                            "document"
                                                                            ? "Document"
                                                                            : fileType ===
                                                                              "spreadsheet"
                                                                              ? "Spreadsheet"
                                                                              : "File"}
                                                                        </p>
                                                                      </div>
                                                                    );
                                                                  }
                                                                })()}
                                                                <div className="image-overlay">
                                                                  <button
                                                                    className="preview-btn"
                                                                    onClick={() =>
                                                                      openDocumentModal(
                                                                        doc
                                                                      )
                                                                    }
                                                                  >
                                                                    <i className="fas fa-search-plus"></i>
                                                                    Preview
                                                                  </button>
                                                                </div>
                                                              </>
                                                            ) : (
                                                              <div className="no-document-placeholder">
                                                                <i className="fas fa-file-upload"></i>
                                                                <p>No Document</p>
                                                              </div>
                                                            )}

                                                            {/* Status Badge Overlay */}
                                                            <div className="status-badge-overlay">
                                                              {(latestUpload?.status ===
                                                                "Pending" ||
                                                                doc.status ===
                                                                "Pending") && (
                                                                  <span className="status-badge-new pending">
                                                                    <i className="fas fa-clock"></i>
                                                                    Pending
                                                                  </span>
                                                                )}
                                                              {(latestUpload?.status ===
                                                                "Verified" ||
                                                                doc.status ===
                                                                "Verified") && (
                                                                  <span className="status-badge-new verified">
                                                                    <i className="fas fa-check-circle"></i>
                                                                    Verified
                                                                  </span>
                                                                )}
                                                              {(latestUpload?.status ===
                                                                "Rejected" ||
                                                                doc.status ===
                                                                "Rejected") && (
                                                                  <span className="status-badge-new rejected">
                                                                    <i className="fas fa-times-circle"></i>
                                                                    Rejected
                                                                  </span>
                                                                )}
                                                              {!latestUpload &&
                                                                doc.status ===
                                                                "Not Uploaded" && (
                                                                  <span className="status-badge-new not-uploaded">
                                                                    <i className="fas fa-upload"></i>
                                                                    Required
                                                                  </span>
                                                                )}
                                                            </div>
                                                          </div>

                                                          <div className="document-info-section">
                                                            <div className="document-header">
                                                              <h4 className="document-title">
                                                                {doc.Name ||
                                                                  `Document ${index + 1
                                                                  }`}
                                                              </h4>
                                                              <div className="document-actions">
                                                                {!latestUpload ? (
                                                                  <button
                                                                    className="action-btn upload-btn"
                                                                    title="Upload Document"
                                                                    onClick={() => {
                                                                      setSelectedProfile(
                                                                        profile
                                                                      ); // Set the current profile
                                                                      openUploadModal(
                                                                        doc
                                                                      ); // Open the upload modal
                                                                    }}
                                                                  >
                                                                    <i className="fas fa-cloud-upload-alt"></i>
                                                                    Upload
                                                                  </button>
                                                                ) : (
                                                                  <button
                                                                    className="action-btn verify-btn"
                                                                    onClick={() =>
                                                                      openDocumentModal(
                                                                        doc
                                                                      )
                                                                    }
                                                                    title="Verify Document"
                                                                  >
                                                                    <i className="fas fa-search"></i>
                                                                    PREVIEW
                                                                  </button>
                                                                )}
                                                              </div>
                                                            </div>

                                                            <div className="document-meta">
                                                              <div className="meta-item">
                                                                <i className="fas fa-calendar-alt text-muted"></i>
                                                                <span className="meta-text">
                                                                  {latestUpload?.uploadedAt ||
                                                                    doc.uploadedAt
                                                                    ? new Date(
                                                                      latestUpload?.uploadedAt ||
                                                                      doc.uploadedAt
                                                                    ).toLocaleDateString(
                                                                      "en-GB",
                                                                      {
                                                                        day: "2-digit",
                                                                        month:
                                                                          "short",
                                                                        year: "numeric",
                                                                      }
                                                                    )
                                                                    : "Not uploaded"}
                                                                </span>
                                                              </div>

                                                              {latestUpload && (
                                                                <div className="meta-item">
                                                                  <i className="fas fa-clock text-muted"></i>
                                                                  <span className="meta-text">
                                                                    {new Date(
                                                                      latestUpload.uploadedAt
                                                                    ).toLocaleTimeString(
                                                                      "en-GB",
                                                                      {
                                                                        hour: "2-digit",
                                                                        minute:
                                                                          "2-digit",
                                                                      }
                                                                    )}
                                                                  </span>
                                                                </div>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      );
                                                    }
                                                  );
                                                })()}
                                              </div>

                                              <DocumentModal />
                                              <UploadModal />
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}

                                  {/* Attendance Tab - Table Format Only */}
                                  {/* Attendance Tab - Table Format Only */}
                                  {(studentTabsActive[studentIndex] || 0) === 4 && (
                                    <EnhancedAttendanceTab
                                      student={{
                                        ...profile,
                                        // Create a dailyAttendance array for backward compatibility
                                        dailyAttendance: [
                                          ...(profile.attendance?.zeroPeriod?.sessions || []),
                                          ...(profile.attendance?.regularPeriod?.sessions || [])
                                        ].map(session => ({
                                          ...session,
                                          status: session.status?.toLowerCase() || 'absent',
                                          notes: session.remarks,
                                          date: session.date
                                        }))
                                      }}
                                      studentIndex={studentIndex}
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          {/* Empty State */}
          {allProfiles.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-person fs-1 text-muted"></i>
              <h5 className="text-muted mt-3">No students found</h5>
              <p className="text-muted">
                {activeTab === "all"
                  ? "Try adjusting your search or filter criteria"
                  : `No students in the ${mainTabs.find((t) => t.key === activeTab)?.label || ""
                  }`}
              </p>
            </div>
          )}
        </div>
      </div>
      <AttendanceManagementModal
        show={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
      />

      {/* Enhanced CSS for styling */}
      <style jsx>
        {`
          .site-header--sticky--register {
            position: fixed;
            top: 104px;
             {
              /* left: 15.9%;
          right: 33px; */
            }
            background: white;
            z-index: 10;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 15px 0;
          }

          .attendance-controls {
            border: 1px solid #e3f2fd;
            border-radius: 8px;
            padding: 12px;
            background: linear-gradient(135deg, #f8f9ff 0%, #f0f7ff 100%);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }

          .btn-group-sm .btn {
            font-size: 0.75rem;
            padding: 0.4rem 0.6rem;
            border-radius: 6px;
          }

          .progress {
            border-radius: 10px;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
          }

          // .card {
          //   border: none;
          //   box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          //   transition: all 0.3s ease;
          //   border-radius: 12px;
          // }

          // .card:hover {
          //   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          //   transform: translateY(-2px);
          // }

          .card-header {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-bottom: 1px solid #dee2e6;
            border-radius: 12px 12px 0 0;
          }

          .nav-pills .nav-link {
            font-size: 0.875rem;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            margin-right: 0.5rem;
            transition: all 0.3s ease;
          }

          .nav-pills .nav-link.active {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
          }

          // .nav-pills .nav-link:hover:not(.active) {
          //   background-color: #f8f9fa;
          //   transform: translateY(-1px);
          // }

          .table th {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: none;
            font-weight: 600;
            font-size: 0.875rem;
            padding: 1rem;
          }

          .table td {
            border: none;
            padding: 1rem;
            border-bottom: 1px solid #f1f3f4;
          }

          // .table tbody tr:hover {
          //   background-color: #f8f9ff;
          //   transform: scale(1.01);
          //   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          // }

          .badge {
            font-size: 0.75rem;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            font-weight: 500;
          }

          .transition-col {
            transition: all 0.3s ease;
          }

          .btn {
            border-radius: 8px;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          // .btn:hover {
          //   transform: translateY(-1px);
          //   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          // }

          .form-control,
          .form-select {
            border-radius: 8px;
            border: 1px solid #e1e5e9;
            transition: all 0.3s ease;
          }

          .form-control:focus,
          .form-select:focus {
            border-color: #80bdff;
            box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
          }

          .modal-content {
            border-radius: 15px;
            border: none;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          }

          .modal-header {
            border-bottom: 1px solid #e9ecef;
            border-radius: 15px 15px 0 0;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          }

          // .dropdown-item:hover {
          //   background-color: #f8f9fa;
          // }

          .bg-gradient-primary {
            background: linear-gradient(
              135deg,
              #007bff 0%,
              #0056b3 100%
            ) !important;
          }

          .alert-primary {
            background-color: rgba(13, 110, 253, 0.1) !important;
            border-color: rgba(13, 110, 253, 0.2) !important;
            color: #084298 !important;
          }

          @media (max-width: 768px) {
            .site-header--sticky--register {
              left: 0;
              right: 0;
              padding: 10px;
            }

            .btn-group-sm .btn {
              font-size: 0.65rem;
              padding: 0.3rem 0.4rem;
            }

            .attendance-controls {
              padding: 8px;
            }

            .card-body {
              padding: 1rem;
            }

            .table-responsive {
              font-size: 0.875rem;
            }

            .col-md-3,
            .col-md-4,
            .col-md-5,
            .col-md-6 {
              margin-bottom: 1rem;
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .card,
          .modal-content {
            animation: fadeIn 0.5s ease-out;
          }

          .content-body {
            padding: 2rem 1rem;
          }

          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }

          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }

          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }

          // ::-webkit-scrollbar-thumb:hover {
          //   background: #555;
          // }

          /* Additional responsive styles */
          @media (max-width: 576px) {
            .h5,
            .h4 {
              font-size: 1rem;
            }

            .card-title {
              font-size: 0.9rem;
            }

            .btn-group .btn {
              padding: 0.25rem 0.5rem;
              font-size: 0.75rem;
            }

            .attendance-controls .btn-group-sm .btn {
              padding: 0.2rem 0.3rem;
              font-size: 0.6rem;
            }
          }

          /* Loading states */
          .loading {
            opacity: 0.6;
            pointer-events: none;
          }

          /* Success states */
          .success-highlight {
            background-color: rgba(25, 135, 84, 0.1);
            border-left: 4px solid #198754;
          }

          /* Warning states */
          .warning-highlight {
            background-color: rgba(255, 193, 7, 0.1);
            border-left: 4px solid #ffc107;
          }

          /* Error states */
          .error-highlight {
            background-color: rgba(220, 53, 69, 0.1);
            border-left: 4px solid #dc3545;
          }

          /* Enhanced table styling */
          .table-dark th {
            background: linear-gradient(
              135deg,
              #343a40 0%,
              #495057 100%
            ) !important;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
          }

          .table-striped tbody tr:nth-of-type(odd) {
            background-color: rgba(0, 123, 255, 0.03);
          }

          /* Enhanced badge styling */
          .badge {
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid transparent;
          }

          .badge.bg-success {
            background-color: #198754 !important;
            border-color: #146c43;
          }

          .badge.bg-warning {
            background-color: #ffc107 !important;
            border-color: #ffca2c;
            color: #000;
          }

          .badge.bg-danger {
            background-color: #dc3545 !important;
            border-color: #b02a37;
          }

          .badge.bg-info {
            background-color: #0dcaf0 !important;
            border-color: #31d2f2;
            color: #000;
          }

          .badge.bg-primary {
            background-color: #0d6efd !important;
            border-color: #0a58ca;
          }

          .badge.bg-secondary {
            background-color: #6c757d !important;
            border-color: #5c636a;
          }

          /* Custom animations */
          @keyframes slideIn {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(-100%);
              opacity: 0;
            }
          }

          .slide-in {
            animation: slideIn 0.3s ease-out;
          }

          .slide-out {
            animation: slideOut 0.3s ease-out;
          }



          /* Progress bar enhancements */
          .progress-bar {
            transition: width 0.6s ease;
            background: linear-gradient(
                45deg,
                rgba(255, 255, 255, 0.2) 25%,
                transparent 25%
              ),
              linear-gradient(
                -45deg,
                rgba(255, 255, 255, 0.2) 25%,
                transparent 25%
              ),
              linear-gradient(
                45deg,
                transparent 75%,
                rgba(255, 255, 255, 0.2) 75%
              ),
              linear-gradient(
                -45deg,
                transparent 75%,
                rgba(255, 255, 255, 0.2) 75%
              );
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          }

          /* Enhanced button styles */
          .btn-outline-primary:hover {
            background-color: #0d6efd;
            border-color: #0d6efd;
            transform: translateY(-2px);
          }

          .btn-outline-success:hover {
            background-color: #198754;
            border-color: #198754;
            transform: translateY(-2px);
          }

          .btn-outline-danger:hover {
            background-color: #dc3545;
            border-color: #dc3545;
            transform: translateY(-2px);
          }

          .btn-outline-warning:hover {
            background-color: #ffc107;
            border-color: #ffc107;
            color: #000;
            transform: translateY(-2px);
          }

          .btn-outline-info:hover {
            background-color: #0dcaf0;
            border-color: #0dcaf0;
            color: #000;
            transform: translateY(-2px);
          }

          .btn-outline-secondary:hover {
            background-color: #6c757d;
            border-color: #6c757d;
            transform: translateY(-2px);
          }

          /* Enhanced focus states */
          .btn:focus,
          .form-control:focus,
          .form-select:focus {
            outline: none;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
          }

          /* Dark mode support (if needed) */
          @media (prefers-color-scheme: dark) {
            .card {
              background-color: #2d3748;
              color: #e2e8f0;
            }

            .card-header {
              background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
              border-bottom-color: #4a5568;
            }

            .table th {
              background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
              color: #e2e8f0;
            }

            .text-muted {
              color: #a0aec0 !important;
            }
          }

          .monthly-attendance-summary .table th,
          .yearly-attendance-summary .table th {
            background: linear-gradient(135deg, #343a40 0%, #495057 100%);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
            border: none;
            padding: 0.75rem;
          }

          .monthly-attendance-summary .table td,
          .yearly-attendance-summary .table td {
            border: none;
            padding: 0.75rem;
            border-bottom: 1px solid #f1f3f4;
            vertical-align: middle;
          }

          .monthly-attendance-summary .table tbody tr:hover,
          .yearly-attendance-summary .table tbody tr:hover {
            background-color: #f8f9ff;
            transform: scale(1.01);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }

          /* Enhanced Progress Bars */
          .progress {
            border-radius: 10px;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
            background-color: #e9ecef;
          }

          .progress-bar {
            border-radius: 10px;
            transition: width 0.6s ease;
            font-weight: 600;
            font-size: 0.75rem;
          }

          .progress-bar.bg-success {
            background: linear-gradient(45deg, #198754, #20c997) !important;
          }

          .progress-bar.bg-warning {
            background: linear-gradient(45deg, #ffc107, #ffca2c) !important;
          }

          .progress-bar.bg-danger {
            background: linear-gradient(45deg, #dc3545, #e85d75) !important;
          }

          .progress-bar.bg-info {
            background: linear-gradient(45deg, #0dcaf0, #31d2f2) !important;
          }

          /* Enhanced View Buttons */
          .btn-group .btn {
            border-radius: 0;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          .btn-group .btn:first-child {
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
          }

          .btn-group .btn:last-child {
            border-top-right-radius: 8px;
            border-bottom-right-radius: 8px;
          }

          /* Enhanced Cards */
          .yearly-attendance-summary .card {
            border: none;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            transition: all 0.3s ease;
          }

          .yearly-attendance-summary .card:hover {
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
          }

          .yearly-attendance-summary .card-header {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-bottom: 1px solid #dee2e6;
            border-radius: 12px 12px 0 0;
            padding: 1rem 1.25rem;
          }

          .yearly-attendance-summary .card-body {
            padding: 1.25rem;
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .monthly-attendance-summary .table,
            .yearly-attendance-summary .table {
              font-size: 0.8rem;
            }

            .monthly-attendance-summary .table th,
            .yearly-attendance-summary .table th,
            .monthly-attendance-summary .table td,
            .yearly-attendance-summary .table td {
              padding: 0.5rem;
            }

            .form-control-sm {
              min-width: 120px !important;
            }
          }

          /* Enhanced animations */

          .monthly-attendance-summary,
          .yearly-attendance-summary {
            animation: fadeInUp 0.5s ease-out;
          }

          .attendance-management-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 1050;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .attendance-management-modal {
            background: white;
            border-radius: 20px;
            width: 95%;
            max-width: 1400px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            animation: slideInUp 0.4s ease-out;
          }

          .modal-header-enhanced {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-bottom: 2px solid #dee2e6;
            padding: 1.5rem 2rem;
            border-radius: 20px 20px 0 0;
          }

          .modal-body-enhanced {
            padding: 2rem;
            overflow-y: auto;
            max-height: calc(90vh - 120px);
          }

          .control-panel-enhanced {
            background: linear-gradient(135deg, #f8f9ff 0%, #f0f7ff 100%);
            border: 1px solid #e3f2fd;
            border-radius: 15px;
            padding: 1.5rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          }

          .view-selector .btn-group .btn {
            border-radius: 0;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          .view-selector .btn-group .btn:first-child {
            border-top-left-radius: 10px;
            border-bottom-left-radius: 10px;
          }

          .view-selector .btn-group .btn:last-child {
            border-top-right-radius: 10px;
            border-bottom-right-radius: 10px;
          }

          .statistics-summary .stat-card {
            background: linear-gradient(
              135deg,
              var(--bs-primary) 0%,
              var(--bs-primary-dark, #0056b3) 100%
            );
            border-radius: 15px;
            padding: 1.5rem 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }

          .statistics-summary .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
          }

          .stat-number {
            font-size: 2.5rem;
            font-weight: 700;
            line-height: 1;
            margin-bottom: 0.5rem;
          }

          .stat-label {
            font-size: 0.75rem;
            font-weight: 500;
            opacity: 0.9;
          }

          .attendance-content .table {
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          }

          .attendance-content .table thead th {
            background: linear-gradient(135deg, #343a40 0%, #495057 100%);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
            border: none;
            padding: 1rem;
          }

          .attendance-content .table tbody tr {
            transition: all 0.3s ease;
          }

          .attendance-content .table tbody tr:hover {
            background-color: #f8f9ff;
            transform: scale(1.01);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          }

          .performance-metrics {
            text-align: center;
          }

          .performance-metrics .badge {
            font-size: 0.75rem;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
          }

          .performance-metrics small {
            font-weight: 500;
          }

          .action-buttons .btn {
            border-radius: 10px;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          .action-buttons .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }

          @media (max-width: 768px) {
            .attendance-management-modal {
              width: 98%;
              margin: 10px;
            }

            .modal-body-enhanced {
              padding: 1rem;
            }

            .control-panel-enhanced {
              padding: 1rem;
            }

            .stat-number {
              font-size: 1.8rem;
            }

            .statistics-summary .col-md-2 {
              margin-bottom: 1rem;
            }

            .attendance-content .table {
              font-size: 0.8rem;
            }

            .view-selector .btn-group {
              display: flex;
              flex-direction: column;
            }

            .view-selector .btn-group .btn {
              border-radius: 8px !important;
              margin-bottom: 0.5rem;
            }

            .action-buttons {
              margin-top: 1rem;
            }

            .action-buttons .d-flex {
              flex-direction: column;
            }

            .action-buttons .btn {
              margin-bottom: 0.5rem;
            }
          }
        `}
      </style>
      <style>
        {
          `
          .attendance-register-container {
    max-width: 100%;
    overflow-x: auto;
  }

  .register-header {
    background: linear-gradient(135deg, #f8f9ff 0%, #f0f7ff 100%);
    border: 1px solid #e3f2fd;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }

  .register-title {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border: 1px solid #e9ecef;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .register-table-container {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border-radius: 15px;
    overflow: hidden;
    border: 1px solid #e9ecef;
  }

  .attendance-register-table {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    min-width: 1000px;
  }

  .attendance-register-table thead th {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    color: white;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.5px;
    border: none;
    padding: 1rem 0.5rem;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .student-info-header {
    width: 250px;
    min-width: 250px;
    max-width: 250px;
    position: sticky;
    left: 0;
    z-index: 11;
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%) !important;
  }

  .dates-header {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%) !important;
  }

  .summary-header {
    width: 150px;
    min-width: 150px;
    background: linear-gradient(135deg, #27ae60 0%, #229954 100%) !important;
  }

  .date-header {
    width: 60px;
    min-width: 60px;
    text-align: center;
    padding: 0.5rem;
    border-right: 1px solid rgba(255, 255, 255, 0.2);
  }

  .date-header.weekend-header {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%) !important;
  }

  .date-header-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .date-number {
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1;
  }

  .day-name {
    font-size: 0.7rem;
    opacity: 0.9;
    margin-top: 2px;
  }

  .student-row {
    transition: all 0.3s ease;
  }

  .student-row:hover {
    background-color: #f8f9ff;
    transform: scale(1.01);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .student-info-cell {
    width: 250px;
    min-width: 250px;
    max-width: 250px;
    position: sticky;
    left: 0;
    background: white;
    border-right: 2px solid #e9ecef;
    z-index: 5;
    padding: 1rem;
  }

  .student-row:hover .student-info-cell {
    background-color: #f8f9ff;
  }

  .student-info-content {
    height: 100%;
    display: flex;
    align-items: center;
  }

  .student-name {
    color: #2c3e50;
    font-size: 0.95rem;
  }

  .enrollment-number {
    color: #7f8c8d;
    font-weight: 500;
  }

  .student-contact {
    font-size: 0.75rem;
  }

  .attendance-cell {
    width: 60px;
    min-width: 60px;
    text-align: center;
    padding: 0.5rem;
    border-right: 1px solid #e9ecef;
    border-bottom: 1px solid #e9ecef;
    vertical-align: middle;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .attendance-cell:hover {
    transform: scale(1.1);
    z-index: 3;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .attendance-cell.weekend-cell {
    background-color: #fff5f5;
  }

  .attendance-symbol {
    font-weight: 700;
    font-size: 1rem;
    line-height: 1;
  }

  .time-info {
    font-size: 0.6rem;
    margin-top: 2px;
    opacity: 0.8;
  }

  .late-indicator {
    font-size: 0.55rem;
    color: #e67e22;
    font-weight: 600;
    margin-top: 1px;
  }

  /* Status Colors */
  .attendance-cell.present {
    background-color: #d5f4e6;
    color: #27ae60;
  }

  .attendance-cell.absent {
    background-color: #fadbd8;
    color: #e74c3c;
  }

  .attendance-cell.late {
    background-color: #fcf3cf;
    color: #f39c12;
  }

  .attendance-cell.leave {
    background-color: #d6eaf8;
    color: #3498db;
  }

  .attendance-cell.half-day {
    background-color: #e8daef;
    color: #8e44ad;
  }

  .attendance-cell.short-leave {
    background-color: #fdeaa7;
    color: #e67e22;
  }

  .attendance-cell.not-marked {
    background-color: #f8f9fa;
    color: #95a5a6;
  }

  .summary-cell {
    width: 150px;
    min-width: 150px;
    padding: 1rem;
    border-left: 2px solid #e9ecef;
    vertical-align: middle;
  }

  .summary-content {
    text-align: center;
  }

  .summary-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    justify-content: center;
    margin-bottom: 0.5rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
  }

  .stat-item.present {
    background-color: #d5f4e6;
    color: #27ae60;
  }

  .stat-item.absent {
    background-color: #fadbd8;
    color: #e74c3c;
  }

  .stat-item.late {
    background-color: #fcf3cf;
    color: #f39c12;
  }

  .stat-item.leave {
    background-color: #d6eaf8;
    color: #3498db;
  }

  .percentage-bar {
    height: 8px;
    background-color: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.25rem;
  }

  .percentage-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .percentage-text {
    font-size: 0.75rem;
    color: #2c3e50;
  }

  .summary-row {
    background: linear-gradient(135deg, #ecf0f1 0%, #d5dbdb 100%);
    font-weight: 600;
  }

  .summary-row-header {
    position: sticky;
    left: 0;
    background: linear-gradient(135deg, #ecf0f1 0%, #d5dbdb 100%) !important;
    border-right: 2px solid #bdc3c7;
    z-index: 5;
  }

  .day-summary {
    text-align: center;
  }

  .summary-percentage {
    font-weight: 700;
    font-size: 0.9rem;
    color: #2c3e50;
  }

  .summary-counts {
    margin-top: 0.25rem;
    color: #7f8c8d;
  }

  .weekend-summary {
    background-color: #fff5f5 !important;
  }

  .overall-summary {
    background: linear-gradient(135deg, #27ae60 0%, #229954 100%) !important;
    color: white;
    text-align: center;
  }

  .overall-percentage {
    font-size: 1.1rem;
    font-weight: 700;
    margin-top: 0.25rem;
  }

  .register-legend {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 1px solid #dee2e6;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .legend-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
  }

  .legend-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .legend-symbol {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .legend-symbol.present {
    background-color: #d5f4e6;
    color: #27ae60;
  }

  .legend-symbol.absent {
    background-color: #fadbd8;
    color: #e74c3c;
  }

  .legend-symbol.late {
    background-color: #fcf3cf;
    color: #f39c12;
  }

  .legend-symbol.leave {
    background-color: #d6eaf8;
    color: #3498db;
  }

  .legend-symbol.half-day {
    background-color: #e8daef;
    color: #8e44ad;
  }

  .legend-symbol.short-leave {
    background-color: #fdeaa7;
    color: #e67e22;
  }

  .legend-symbol.not-marked {
    background-color: #f8f9fa;
    color: #95a5a6;
  }

  .legend-text {
    font-weight: 500;
    color: #2c3e50;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .student-info-header,
    .student-info-cell {
      width: 200px;
      min-width: 200px;
      max-width: 200px;
    }
    
    .date-header,
    .attendance-cell {
      width: 45px;
      min-width: 45px;
      padding: 0.25rem;
    }
    
    .attendance-symbol {
      font-size: 0.8rem;
    }
    
    .time-info {
      font-size: 0.5rem;
    }
    
    .summary-cell {
      width: 120px;
      min-width: 120px;
    }
    
    .legend-grid {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.5rem;
    }
    
    .student-name {
      font-size: 0.85rem;
    }
    
    .stat-item {
      font-size: 0.65rem;
    }
  }

  /* Print Styles */
  @media print {
    .attendance-management-overlay {
      position: static;
      background: white;
    }
    
    .attendance-management-modal {
      box-shadow: none;
      border-radius: 0;
      width: 100%;
      max-width: none;
    }
    
    .modal-header-enhanced,
    .control-panel-enhanced,
    .statistics-summary {
      display: none;
    }
    
    .attendance-register-table {
      font-size: 0.7rem;
    }
    
    .attendance-cell,
    .date-header {
      width: 25px;
      min-width: 25px;
      padding: 0.1rem;
    }
    
    .student-info-cell {
      width: 180px;
      min-width: 180px;
    }
  }
          `
        }
      </style>

      <style>
        {
          `

    /* Clean Sticky Header CSS - Replace your entire style section with this */

/* Main wrapper styling */
html body .content .content-wrapper {
    padding: calc(0.9rem - 0.1rem) 1.2rem;
    overflow: visible !important;
}

.bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .transition-all {
          transition: all 0.3s ease;
        }

        .nav-pills-sm .nav-link {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        }

        .sticky-top {
          position: sticky !important;
        }

        .btn-group .btn {
          border-radius: 0.375rem;
        }

        .btn-group .btn:not(:last-child) {
          margin-right: 0.25rem;
        }

        .card {
          transition: box-shadow 0.15s ease-in-out;
        }


        .text-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .circular-progress-container {
          position: relative;
          width: 40px;
          height: 40px;
        }

        .circular-progress-container svg {
          transform: rotate(-90deg);
        }

        .circle-bg {
          fill: none;
          stroke: #e6e6e6;
          stroke-width: 4;
        }

        .circle-progress {
          fill: none;
          stroke: #FC2B5A;
          stroke-width: 4;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.5s ease;
        }

        .circular-progress-container .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 10px;
          color: #333;
        }

        .contact-row {
          border: 1px solid #e0e0e0;
          border-radius: 2px;
          padding: 10px 15px;
          background-color: #fff;
        }

        .userCheckbox {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .contact-checkbox {
          display: flex;
          align-items: center;
        }

        .contact-name {
          font-weight: 500;
          margin-bottom: 0;
        }

        .contact-number {
          color: #888;
          font-size: 0.85rem;
        }

        .transition-col {
          transition: all 0.3s ease-in-out;
        }

        .leadsStatus {
          width: 100%;
          border-bottom: 1px solid #e0e0e0;
        }

        .leadsDetails {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          overflow-x: auto;
          white-space: nowrap;
        }

        .leadsDetails .status {
          padding: 12px 16px;
          font-size: 14px;
          color: #555;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }

        .leadsDetails .status:hover {
          color: #000;
        }

        .leadsDetails .status.active {
          color: #333;
          font-weight: 500;
        }

        .leadsDetails .status.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #007bff;
        }

        .tab-pane {
          display: none;
        }

        .tab-pane.active {
          display: block;
        }

        .info-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .section-title {
          color: #495057;
          font-weight: 600;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #dee2e6;
        }
     

        .tab-pane {
          padding: 0;
          position: relative;
        }

        .scrollable-container {
          display: none;
        }

        .desktop-view {
          display: block;
        }

        .scroll-arrow {
          display: none;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 30px;
          height: 30px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 9;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          border: 1px solid #eaeaea;
        }

        .scroll-left {
          left: 5px;
        }

        .scroll-right {
          right: 5px;
        }
        .document-preview-icon{
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        @media (max-width: 767px) {
          .scrollable-container {
            display: block;
            width: 100%;
            overflow: hidden;
            padding: 10px 0;
          }

          .desktop-view {
            display: none;
          }

          .scrollable-content {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scroll-behavior: smooth;
            padding: 10px 0;
          }

          .info-card {
            flex: 0 0 auto;
            scroll-snap-align: start;
            margin-right: 15px;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #eaeaea;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            background: #fff;
          }

          .scroll-arrow {
            display: flex;
          }

          .scrollable-content::-webkit-scrollbar {
            height: 4px;
          }

          .scrollable-content::-webkit-scrollbar-track {
            background: #f1f1f1;
          }

          .scrollable-content::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }

          .btn-group {
            flex-wrap: wrap;
          }
          
          .btn-group .btn {
            margin-bottom: 0.25rem;
          }
        }

        .whatsapp-chat {
          height: 100%;
          min-width: 300px;
          box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.12), 0px 1px 10px rgba(0, 0, 0, 0.12), 0px 2px 4px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
        }

        .right-side-panel {
          background: #ffffff !important;
          box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.12), 0px 1px 10px rgba(0, 0, 0, 0.12), 0px 2px 4px rgba(0, 0, 0, 0.04);
          width: 100%;
          height: 73dvh;
        }

        .whatsapp-chat .topbar-container {
          background-color: #fff;
          padding: 8px 16px;
          display: flex;
          /* height: 8%; */
          min-height: 43px;
          align-items: center;
          position: relative;
          justify-content: space-between;
        }

        .whatsapp-chat .topbar-container .left-topbar {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
        }

        .whatsapp-chat .topbar-container .left-topbar .img-container {
          margin-right: 12px;
        }

        .whatsapp-chat .topbar-container .left-topbar .selected-number {
          font-size: 12px;
          color: #393939;
        }

        .small-avatar {
          background: #f17e33;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          text-transform: uppercase;
          font-size: 14px;
        }

        .whatsapp-chat .chat-view {
          background: #E6DDD4;
          flex: 1;
          position: relative;
        }

        .whatsapp-chat .chat-view .chat-container {
          list-style-type: none;
          padding: 18px 10px;
          position: absolute;
          bottom: 0;
          display: flex;
          flex-direction: column;
          padding-right: 15px;
          overflow-x: hidden;
          max-height: 100%;
          margin-bottom: 0px;
          padding-bottom: 12px;
          overflow-y: scroll;
          width: 100%;
        }

        .whatsapp-chat .chat-view .counselor-msg-container {
          display: flex;
          flex-direction: column;
          align-items: end;
        }

        .whatsapp-chat .chat-view .chat-container .chatgroupdate {
          width: 92px;
          height: 24px;
          background: #DCF3FB;
          border-radius: 4px;
          margin-top: 51px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          margin-right: auto;
        }

        .whatsapp-chat .chat-view .chat-container .chatgroupdate span {
          font-size: 13px;
          color: #393939;
        }

        .whatsapp-chat .chat-view .counselor-msg {
          float: right;
          background: #D8FFC0;
          padding-right: 0;
        }

        .whatsapp-chat .chat-view .macro {
          margin-top: 12px;
          max-width: 92%;
          border-radius: 4px;
          padding: 8px;
          display: flex;
          padding-bottom: 2px;
          min-width: 22%;
          transform: scale(0);
          animation: message 0.15s ease-out 0s forwards;
        }

        @keyframes message {
          to {
            transform: scale(1);
          }
        }

        .whatsapp-chat .chat-view .text-r {
          float: right;
        }

        .whatsapp-chat .chat-view .text {
          width: 100%;
          display: flex;
          flex-direction: column;
          color: #4A4A4A;
          font-size: 12px;
        }

        .whatsapp-chat .chat-view .student-messages {
          color: #F17E33;
        }

        .whatsapp-chat .chat-view .message-header-name {
          font-weight: 600;
          font-size: 12px;
          line-height: 18px;
          color: #F17E33;
          position: relative;
          bottom: 4px;
          opacity: 0.9;
        }

        .whatsapp-chat .chat-view .text-message {
          width: 100%;
          margin-top: 0;
          margin-bottom: 2px;
          line-height: 16px;
          font-size: 12px;
          word-break: break-word;
        }

        .whatsapp-chat .chat-view pre {
          white-space: pre-wrap;
          padding: unset !important;
          font-size: unset !important;
          line-height: normal !important;
          color: #4A4A4A !important;
          overflow: unset !important;
          background-color: transparent !important;
          border: none !important;
          border-radius: unset !important;
          font-family: unset !important;
        }

        .whatsapp-chat .footer-container {
          background-color: #F5F6F6;
          box-shadow: 0px -2px 4px rgba(0, 0, 0, 0.09);
          padding: 0;
          height: auto;
          align-items: center;
          border: none !important;
        }

        .whatsapp-chat .footer-container .footer-box {
          padding: 16px;
          background: #F5F6F6;
          border-radius: 6px;
        }

        .whatsapp-chat .footer-container .footer-box .message-container {
          color: black;
          position: relative;
          height: 40px;
        }

        .whatsapp-chat .footer-container .footer-box .message-container .message-input {
          background: #FFFFFF;
          border-radius: 6px 6px 0 0 !important;
          width: 100%;
          min-height: 36px;
          padding: 0px 12px;
          font-size: 12px;
          resize: none;
          position: absolute;
          bottom: 0px;
          line-height: 20px;
          padding-top: 8px;
          border: #fff;
        }

        .whatsapp-chat .footer-container .footer-box .divider {
          border: 1px solid #D8D8D8;
          margin-bottom: 0.8px !important;
          margin-top: -0.8px !important;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input {
          display: flex;
          background: #FFFFFF;
          height: 32px;
          border-radius: 0 0 6px 6px !important;
          justify-content: space-between;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer {
          display: flex;
          justify-content: flex-start;
          align-items: center;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer .margin-bottom-5 {
          margin-bottom: 5px;
          margin-right: 15px;
          margin-left: 10px;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer .margin-right-10 {
          margin-right: 10px;
        }

        .input-template {
          margin-bottom: 5px;
          margin-left: 15px;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .right-footer .send-button {
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          color: #666;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer .fileUploadIcon {
          cursor: pointer;
          color: #666;
          transform: translateY(15px);
        }

        .sessionExpiredMsg {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          padding: 8px 12px;
          margin: 10px 0;
          font-size: 12px;
          color: #856404;
          text-align: center;
        }

        .followUp {
          font-size: 13px;
          font-weight: 500;
          padding-left: 10px;
        }

        .section-card {
          padding: 5px;
          border-radius: 8px;
        }

        .section-title {
          color: #333;
          font-weight: 600;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f0f0f0;
        }
.nav-pills .nav-link.active{
background: #fd2b5a;
}
        .resume-document {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          border-radius: 8px;
        }

        .resume-document-header {
          margin-bottom: 30px;
        }

        .resume-profile-section {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }

        .resume-profile-placeholder {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20px;
          font-size: 40px;
          color: #999;
        }

        .resume-profile-image {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 20px;
        }

        .resume-header-content {
          flex: 1;
        }

        .resume-name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 5px;
          color: #333;
        }

        .resume-title {
          font-size: 16px;
          color: #666;
          margin-bottom: 10px;
        }

        .resume-contact-details {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }

        .resume-contact-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 14px;
          color: #555;
        }

        .resume-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
        }

        .resume-section-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 5px;
        }

        .resume-document-body {
          display: flex;
          gap: 30px;
        }

        .resume-column {
          flex: 1;
        }

        .resume-section {
          margin-bottom: 25px;
        }

        .resume-experience-item,
        .resume-education-item,
        .resume-project-item {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }

        .resume-item-header {
          margin-bottom: 10px;
        }

        .resume-item-title {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }

        .resume-item-subtitle {
          font-size: 14px;
          color: #666;
          margin-bottom: 3px;
        }

        .resume-item-period {
          font-size: 13px;
          color: #888;
          font-style: italic;
        }

        .resume-item-content {
          font-size: 14px;
          color: #555;
          line-height: 1.5;
        }

        .resume-skills-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .resume-skill-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .resume-skill-name {
          flex: 1;
          font-size: 14px;
          color: #333;
        }

        .resume-skill-bar-container {
          flex: 2;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .resume-skill-bar {
          height: 100%;
          background: #007bff;
          border-radius: 4px;
        }

        .resume-languages-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .resume-language-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .resume-language-name {
          font-size: 14px;
          color: #333;
        }

        .resume-language-level {
          display: flex;
          gap: 3px;
        }

        .resume-level-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e0e0e0;
        }

        .resume-level-dot.filled {
          background: #007bff;
        }

        .resume-certifications-list {
          list-style: none;
          padding: 0;
        }

        .resume-certification-item {
          margin-bottom: 10px;
          font-size: 14px;
          color: #333;
        }

        .resume-cert-org {
          color: #666;
        }

        .resume-cert-date {
          color: #888;
          font-style: italic;
        }

        .resume-interests-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .resume-interest-tag {
          background: #f0f0f0;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 12px;
          color: #333;
        }

        .resume-declaration {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .highlight-text {
          color: #007bff;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .resume-document-body {
            flex-direction: column;
          }
          
          .resume-profile-section {
            flex-direction: column;
            text-align: center;
          }
          
          .resume-contact-details {
            justify-content: center;
          }
            .info-group{
            border: none;
            }
              .info-card {

                    flex: 0 0 auto;
                    scroll-snap-align: start;
                    margin-right: 15px;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #eaeaea;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    background: #fff;
                }
                    .input-height{
                    height: 40px;
                    }
                }

                
/* Mobile Modal Styles */
.modal {
    z-index: 1050;
}

.modal-dialog {
    margin: 1rem;
}

/* WhatsApp Panel Mobile Styles */
.whatsapp-chat {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.topbar-container {
    flex-shrink: 0;
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f8f9fa;
}

.left-topbar {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.small-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #007bff;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.lead-name {
    font-weight: 600;
    font-size: 1rem;
}

.selected-number {
    color: #666;
    font-size: 0.9rem;
}

.right-topbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.chat-view {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background-color: #f0f0f0;
}

.chat-container {
    list-style: none;
    padding: 0;
    margin: 0;
}

.counselor-msg-container {
    margin-bottom: 1.5rem;
}

.chatgroupdate {
    text-align: center;
    margin-bottom: 1rem;
}

.chatgroupdate span {
    background-color: #e3f2fd;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    color: #666;
}

.counselor-msg {
    background-color: #dcf8c6;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    max-width: 80%;
    margin-left: auto;
}

.text-message {
    white-space: pre-wrap;
    margin: 0;
    font-family: inherit;
}

.message-header-name {
    font-weight: 600;
    color: #1976d2;
}

.student-messages {
    color: #2e7d32;
}

.messageTime {
    font-size: 0.75rem;
    color: #666;
    display: block;
    text-align: right;
}

.sessionExpiredMsg {
    text-align: center;
    padding: 1rem;
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 0.5rem;
    margin-top: 1rem;
    color: #856404;
}

.footer-container {
    flex-shrink: 0;
    border-top: 1px solid #e0e0e0;
    background-color: white;
}

.footer-box {
    padding: 1rem;
}

.message-container {
    margin-bottom: 0.5rem;
}

.message-input {
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    padding: 0.5rem;
    resize: none;
    background-color: #f8f9fa;
}

.disabled-style {
    opacity: 0.6;
}

.divider {
    margin: 0.5rem 0;
    border-color: #e0e0e0;
}

.message-container-input {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.bgcolor {
    background-color: #f1f2f6 !important;
}

.left-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.margin-right-10 {
    margin-right: 10px;
}

.margin-bottom-5 {
    margin-bottom: 5px;
}

.margin-horizontal-4 {
    margin: 0 4px;
}

.margin-horizontal-5 {
    margin: 0 5px;
}

.fileUploadIcon {
    width: 20px;
    height: 20px;
    opacity: 0;
    position: absolute;
    cursor: pointer;
}

.input-template {
    cursor: pointer;
}

.send-button {
    text-decoration: none;
}

.send-img {
    width: 20px;
    height: 20px;
}

#whatsappPanel {
    height: 73dvh;
}

.info-group {
    padding: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .modal-dialog {
        margin: 0.5rem;
    }

    .whatsapp-chat .modal-content {
        height: 90vh;
    }

    .col-md-6,
    .col-md-5,
    .col-md-1 {
        flex: 0 0 100%;
        max-width: 100%;
        margin-bottom: 1rem;
    }

    .nav-pills {
        flex-wrap: wrap;
    }

    .nav-pills .nav-link {
        font-size: 0.9rem;
        padding: 0.5rem 0.75rem;
    }
}

/* Additional mobile optimizations */
@media (max-width: 576px) {
    .container-fluid.py-2 {
        padding: 0.5rem !important;
    }

    .card-body.px-1.py-0.my-2 {
        padding: 0.5rem !important;
    }

    .d-flex.align-items-center {
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .btn-group {
        flex-wrap: wrap;
    }

    .input-group {
        max-width: 100% !important;
        margin-bottom: 0.5rem;
    }
}

/* Add this to your existing style tag or CSS file */
.react-date-picker__wrapper {
    border: 1px solid #ced4da !important;
    border-radius: 0.375rem !important;
}

.react-date-picker__inputGroup input {
    border: none !important;
    outline: none !important;
}

.react-date-picker__clear-button {
    display: none !important;
}

.react-date-picker__calendar-button {
    padding: 4px !important;
}

/* Additional styling for better appearance */
.react-date-picker__inputGroup {
    width: 100%;
    white-space: nowrap;
    background: transparent;
    border: none;
}

.react-date-picker__wrapper {
    background: white !important;
}


.no-scroll {
    overflow: hidden;
}

.modal-content {
    background-color: #fff;
    max-height: 90vh;
    width: 80%;
    overflow-y: auto;
    padding: 20px;
    border-radius: 8px;
}

.doc-iframe {
    transform-origin: top left;
    transition: transform 0.3s ease;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.admin-document-panel {
    margin: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: var(--shadow);
    overflow: hidden;
}

.panel-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    background-color: #4a6fdc;
    color: white;
}

.panel-header h2 {
    color: white;
    font-size: 1.5rem;
    margin: 0;
}

.user-selector {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 14px;
    min-width: 200px;
}

.candidate-info {
    background-color: #e9f0fd;
    padding: 20px;
    border-radius: 6px;
    margin: 20px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.candidate-avatar {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: #4a6fdc;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 24px;
    margin-right: 20px;
}

.candidate-details {
    flex-grow: 1;
}

.candidate-details h3 {
    margin: 0 0 5px 0;
    font-size: 22px;
    color: #333;
}

.candidate-details p {
    margin: 0 0 5px 0;
    color: #555;
}

.candidate-stats {
    display: flex;
    margin-top: 15px;
    flex-wrap: wrap;
    gap: 15px;
}

.stat-box {
    background: white;
    border-radius: 4px;
    padding: 10px 15px;
    min-width: 120px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-box h4 {
    margin: 0 0 5px 0;
    font-size: 14px;
    color: #666;
}

.stat-box p {
    margin: 0;
    font-size: 20px;
    font-weight: bold;
}

.document-list {
    overflow-x: auto;
    margin: 0 20px 20px 20px;
}

.document-table {
    width: 100%;
    border-collapse: collapse;
}

.document-table th {
    background-color: var(--gray-light);
    padding: 12px 15px;
    text-align: left;
    font-weight: 600;
    color: #444;
    border-bottom: 2px solid var(--border-color);
    white-space: nowrap;
}



.document-table tbody tr:hover {
    background-color: #f8f9fa;
}

.document-table td {
    padding: 12px 15px;
    vertical-align: middle;
}

.status-badges {
    display: inline-block;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-pending {
    background-color: #fff3cd;
    color: #856404;
}

.status-approved {
    background-color: #d4edda;
    color: #155724;
}

.status-rejected {
    background-color: #f8d7da;
    color: #721c24;
}

.action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.view-btn {
    color: var(--primary-color);
}

.view-btn:hover {
    background-color: rgba(74, 111, 220, 0.1);
}

.approve-btn {
    color: var(--success-color);
    background-color: #d4edda;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}

.approve-btn:hover {
    background-color: #c3e6cb;
}

.reject-btn {
    color: var(--danger-color);
    background-color: #f8d7da;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}

.reject-btn:hover {
    background-color: #f5c6cb;
}

/* Document Modal Styles - Add these to your existing <style jsx> section */

.document-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    backdrop-filter: blur(5px);
}

.document-modal-content {
    background: white;
    border-radius: 12px;
    width: 70%;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.document-modal-content .modal-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e9ecef;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.document-modal-content .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
}

.document-modal-content .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.document-modal-content .close-btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

.document-modal-content .modal-body {
    padding: 2rem;
    display: flex;
    gap: 2rem;
    overflow-y: auto;
}

.document-preview-section {
    flex: 2;
    min-width: 400px;
}

.document-preview-container {
    background: #f8f9fa;
    border-radius: 8px;
    height: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 2px dashed #dee2e6;
}

.document-preview-container img {
    max-width: 100%;
    max-height: 90%;
    object-fit: contain;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preview-controls {
    position: absolute;
    bottom: 0px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    background: rgba(255, 255, 255, 0.9);
    padding: 10px 15px;
    border-radius: 25px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.2s;
}

.control-btn:hover {
    background: #0056b3;
    transform: translateY(-1px);
}

.no-document {
    text-align: center;
    color: #6c757d;
}

.document-info-section {
    flex: 1;
    /* min-width: 300px; */
}

.info-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e9ecef;
}

.info-card h4 {
    margin: 0 0 1rem 0;
    color: #495057;
    font-size: 1.1rem;
    font-weight: 600;
    border-bottom: 2px solid #007bff;
    padding-bottom: 0.5rem;
}

.info-row {
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.info-row strong {
    color: #495057;
    min-width: 120px;
}

.verification-section {
    margin-top: 1.5rem;
}

.verification-steps {
    margin: 0;
    padding-left: 1.5rem;
}

.verification-steps li {
    margin-bottom: 0.5rem;
    color: #6c757d;
    line-height: 1.5;
}

.action-buttons {
    margin-top: 1.5rem;
    display: flex;
    gap: 10px;
}

.action-buttons .btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
}

.rejection-form {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    padding: 1.5rem;
    margin-top: 1.5rem;
}

.rejection-form h4 {
    color: #856404;
    margin: 0 0 1rem 0;
}

.rejection-form textarea {
    width: 100%;
    min-height: 100px!important;
    padding: 10px;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    resize: vertical;
}

/* .document-history {
    overflow-y: auto;
} */

.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e9ecef;
}

.history-item:last-child {
    border-bottom: none;
}

.history-date {
    font-size: 0.9rem;
    color: #6c757d;
    position: absolute;
    top: 20px;
    right: 20px;
}

.history-status {
    font-size: 0.85rem;
    font-weight: 500;
    position: absolute;
    top:10px
}

/* Mobile Responsive */
@media (max-width: 768px) {
.modal-content{
width:100%;
}
    .document-modal-content {
        width: 98%;
        margin: 1rem;
        max-height: 95vh;
    }

    .document-modal-content .modal-body {
        flex-direction: column;
        padding: 1rem;
        gap: 1rem;
    }

    .document-preview-section {
        min-width: auto;
        overflow-y: auto;
    }

    .document-preview-container {
        height: 300px;
    }

    .document-info-section {
        min-width: auto;
    }
}

.m-c {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 1000px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.m-h {
    padding: 15px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f8f9fa;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #777;
}

.m-b {
    padding: 20px;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    overflow-y: auto;
}

.document-preview {
    flex: 2;
    min-width: 400px;
    background-color: var(--gray-light);
    border-radius: 4px;
    height: 500px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    flex-direction: column;

}

.document-preview img {
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.preview-controls {
    text-align: center;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 8px;
    border-radius: 4px;
}

.preview-controls button {
    background-color: #4a6fdc;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    margin: 0 5px;
    cursor: pointer;
}

.document-info {
    flex: 1;
    min-width: 300px;
}

.info-section {
    background-color: #f8f9fa;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 20px;
}

.info-section h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #4a6fdc;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 8px;
}

.document-info p {
    margin-bottom: 10px;
}

.document-history {
    margin-top: 20px;
}

.history-item {
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #e0e0e0;
}

.history-item:last-child {
    border-bottom: none;
}

.history-item .date {
    font-size: 12px;
    color: #777;
}

.modal-actions {
    margin-top: 30px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.rejection-form {
    margin-top: 20px;
    display: none;
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid #dc3545;
}

.rejection-form h4 {
    margin-top: 0;
    color: #721c24;
}

.rejection-form textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    margin-bottom: 10px;
    min-height: 100px;
    resize: vertical;
}

.rejection-form button {
    margin-right: 10px;
}

.filter-bar {
    margin: 0 20px 20px 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
    align-items: center;
}

.filter-label {
    font-weight: 600;
    color: #555;
}

.filter-select {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    min-width: 150px;
}


.page-btn {
    background-color: white;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.page-btn:hover,
.page-btn.active {
    background-color: #4a6fdc;
    color: white;
}
/* Document History Container */
.document-history {
    width: 100%;
    max-height: 1000px;
    height: auto !important;
    padding: 0;
    position: relative;
  }
  
  /* History Item Styling */
  .document-history .history-item {
    display: block !important;
    padding: 15px;
    margin-bottom: 15px;
    background-color: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .document-history .history-item:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
    border-color: #007bff;
  }
  
  /* History Preview Container */
  .document-history .history-preview {
    margin-bottom: 15px;
    width: 100%;
    overflow: visible;
  }
  
  /* Auto Height for All Document Types */
  .document-history .history-preview img {
    width: 100% !important;
    height: auto !important;
    max-width: 100%;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    background-color: #fff;
    cursor: pointer;
    transition: transform 0.3s ease;
  }
  
  .document-history .history-preview img:hover {
    transform: scale(1.02);
  }
  
  /* PDF Auto Height */
  .document-history .history-preview iframe.pdf-thumbnail {
    width: 100% !important;
    height: fit-content !important;
    min-height: 750px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    background-color: #fff;
    cursor: pointer;
  }
  
  /* History Info Section */
  .document-history .history-info {
    padding-top: 15px;
    border-top: 2px solid #e9ecef;
    margin-top: 10px;
  }
   

.enhanced-documents-panel {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    padding: 1.5rem;
    border-radius: 15px;
}

.candidate-header-section {
    margin-bottom: 2rem;
}

.candidate-info-card {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 2rem;
    position: relative;
    overflow: hidden;
}

.candidate-info-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

.candidate-avatar-large {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.candidate-details h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.5rem;
    font-weight: 700;
}

.contact-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.contact-details span {
    color: #666;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.completion-ring {
    margin-left: auto;
    position: relative;
}

.circular-progress {
    position: relative;
}

.percentage-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.percentage {
    display: block;
    font-size: 1.2rem;
    font-weight: bold;
    color: #4facfe;
}

.label {
    font-size: 0.7rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.progress-bar {
    transition: stroke-dasharray 1s ease-in-out;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    transition: all 0.3s ease;
}

.stat-card.total-docs::before {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.stat-card.uploaded-docs::before {
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card.pending-docs::before {
    background: linear-gradient(90deg, #fa709a 0%, #fee140 100%);
}

.stat-card.verified-docs::before {
    background: linear-gradient(90deg, #a8edea 0%, #fed6e3 100%);
}

.stat-card.rejected-docs::before {
    background: linear-gradient(90deg, #ff9a9e 0%, #fecfef 100%);
}

.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
}

.total-docs .stat-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.uploaded-docs .stat-icon {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.pending-docs .stat-icon {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.verified-docs .stat-icon {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.rejected-docs .stat-icon {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.stat-info h4 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: bold;
    color: #333;
}

.stat-info p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
}

.stat-trend {
    margin-left: auto;
    font-size: 1.2rem;
    color: #4facfe;
}

.filter-section-enhanced {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.filter-title {
    margin: 0 0 1rem 0;
    color: #333;
    font-weight: 600;
}

.filter-tabs {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.filter-btn {
    background: #f8f9fa;
    border: 2px solid transparent;
    border-radius: 25px;
    padding: 0.75rem 1.5rem;
    color: #666;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
}

.filter-btn .badges {
    background: #dee2e6;
    color: #495057;
    border-radius: 10px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    margin-left: 0.5rem;
}

.filter-btn:hover {
    background: #e9ecef;
    transform: translateY(-2px);
}

.filter-btn.active {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    border-color: #4facfe;
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

.filter-btn.active .badges {
    background: rgba(255, 255, 255, 0.2);
    color: #fc2b5a;
}

.filter-btn.pending.active {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    box-shadow: 0 5px 15px rgba(250, 112, 154, 0.4);
}

.filter-btn.verified.active {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    color: #2d7d32;
    box-shadow: 0 5px 15px rgba(168, 237, 234, 0.4);
}

.filter-btn.rejected.active {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
    color: #c62828;
    box-shadow: 0 5px 15px rgba(255, 154, 158, 0.4);
}

.documents-grid-enhanced {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 2rem;
}

.document-card-enhanced {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;
}

.document-card-enhanced:hover {
    transform: translateY(-10px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

.document-image-container {
    position: relative;
    height: 200px;
    overflow: hidden;
    background: #f8f9fa;
}

.document-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.document-card-enhanced:hover .document-image {
    transform: scale(1.05);
}

.image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.document-card-enhanced:hover .image-overlay {
    opacity: 1;
}

.preview-btn {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    border: none;
    border-radius: 25px;
    padding: 0.75rem 1.5rem;
    color: white;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

.preview-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(79, 172, 254, 0.6);
}

.no-document-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #ccc;
    font-size: 3rem;
}

.no-document-placeholder p {
    margin-top: 1rem;
    font-size: 1rem;
    color: #999;
}

.status-badges-overlay {
    position: absolute;
    top: 15px;
    right: 15px;
}

.status-badges-new {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.status-badges-new.pending {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    color: white;
}

.status-badges-new.verified {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    color: #2d7d32;
}

.status-badges-new.rejected {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
    color: #c62828;
}

.status-badges-new.not-uploaded {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.document-info-section {
    padding: 1.5rem;
}

.document-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.document-title {
    margin: 0;
    color: #333;
    font-size: 0.9rem;
    font-weight: 700;
    flex: 1;
}

.document-actions {
    margin-left: 1rem;
}

.action-btn {
    border: none;
    border-radius: 20px;
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.upload-btn {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    color: white;
    box-shadow: 0 3px 10px rgba(250, 112, 154, 0.4);
}

.verify-btn {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
    color: #c62828;
    box-shadow: 0 3px 10px rgba(255, 154, 158, 0.4);
}

.view-btn {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    box-shadow: 0 3px 10px rgba(79, 172, 254, 0.4);
}

.action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.document-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    font-size: 0.9rem;
}

.meta-text {
    color: #333;
}
  /* Responsive Design */
  @media (max-width: 1200px) {
    .document-history .history-preview iframe.pdf-thumbnail {
      height: auto !important;
      max-height: 600px;
    }
  }

@media (max-width: 768px) {
    .enhanced-documents-panel {
        padding: 1rem;
    }

    .candidate-info-card {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }

    .completion-ring {
        margin-left: 0;
    }

    .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }

    .documents-grid-enhanced {
        grid-template-columns: 1fr;
    }

    .filter-tabs {
        justify-content: center;
    }

    .document-header {
        flex-direction: column;
        gap: 1rem;
    }

    .document-actions {
        margin-left: 0;
        align-self: stretch;
    }

    .action-btn {
        width: 100%;
        justify-content: center;
    }
}

@media (max-width: 768px) {
    .document-history .history-preview iframe.pdf-thumbnail {
      height: 50vh !important;
      min-height: 300px;
      max-height: 500px;
    }
    
    .document-history .history-item {
      padding: 12px;
      margin-bottom: 12px;
    }
  }

@media (max-width: 768px) {
    .panel-header {
        flex-direction: column;
        align-items: stretch;
    }

    .m-b {
        flex-direction: column;
    }

    .candidate-info {
        flex-direction: column;
        text-align: center;
    }

    .candidate-avatar {
        margin: 0 0 15px 0;
    }

    .filter-bar {
        flex-direction: column;
        align-items: flex-start;
    }

    .filter-select {
        width: 100%;
    }
}
@media (max-width: 480px) {
    .document-history .history-preview iframe,
    .document-history .history-preview img {
      max-height: 300px;
      min-height: 150px;
    }
    
    .document-history .history-preview iframe.pdf-thumbnail {
      height: 40vh !important;
      min-height: 200px;
    }
  }

/* Sticky Header Container */
.sticky-header-container {
    position: sticky !important;
    top: 0 !important;
    z-index: 1020 !important;
    background-color: white !important;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1) !important;
    width: 100% !important;
    margin-bottom: 1rem !important;
}

/* Header Content Styling */
.sticky-header-container .container-fluid {
    padding: 0.5rem 1.2rem !important;
}

/* Secondary Sticky Elements (Side Panels) */
.stickyBreakpoints {
    position: sticky !important;
    top: 120px !important;
    z-index: 11 !important;
}

/* Date Picker Styles */
.react-date-picker__wrapper {
    border: none;
}

.react-date-picker__inputGroup input {
    border: none !important;
}

.react-date-picker__inputGroup {
    width: 100%;
    white-space: nowrap;
    background: transparent;
    border: none;
}

.react-date-picker__clear-button {
    display: none;
}

/* Upload Modal Styles */
.upload-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
    backdrop-filter: blur(2px);
}

.upload-modal-content {
    background-color: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
}

.upload-modal-header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.upload-modal-body {
    padding: 24px;
}

.upload-modal-footer {
    padding: 16px 24px 24px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.file-drop-zone {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 48px 24px;
    text-align: center;
    background-color: #f9fafb;
    transition: all 0.3s ease;
    cursor: pointer;
}

.file-drop-zone:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
}

.drop-zone-content .upload-icon {
    font-size: 48px;
    color: #3b82f6;
    margin-bottom: 16px;
    display: block;
}

.file-details {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background-color: #f3f4f6;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.file-icon {
    width: 48px;
    height: 48px;
    background-color: #3b82f6;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
}

.file-info {
    flex: 1;
}

.file-name {
    margin: 0 0 4px;
    font-weight: 500;
    color: #1f2937;
    font-size: 0.875rem;
}

.file-size {
    margin: 0;
    color: #6b7280;
    font-size: 0.75rem;
}

.preview-image {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.progress-bar-container {
    width: 100%;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-bar {
    height: 100%;
    background-color: #3b82f6;
    transition: width 0.3s ease;
    border-radius: 4px;
}

/* Document Modal Styles */
.document-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1500;
    backdrop-filter: blur(2px);
}

.document-modal-content {
    background-color: white;
    border-radius: 12px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
    z-index: 1501;
}
         .react-date-picker__calendar.react-date-picker__calendar--open{
    inset: 0 !important;
    width: 300px !important;
}
/* Responsive Design */
@media (max-width: 1920px) {
    .stickyBreakpoints {
        top: 120px !important;
    }
}

@media (max-width: 1400px) {
    .stickyBreakpoints {
        top: 110px !important;
    }
}

@media (max-width: 768px) {
    .sticky-header-container {
        position: sticky !important;
        top: 0 !important;
    }
    
    .stickyBreakpoints {
        position: relative !important;
    }
    
    .sticky-header-container .container-fluid {
        padding: 0.5rem 1rem !important;
    }
}

@media (max-width: 576px) {
    .sticky-header-container .container-fluid {
        padding: 0.25rem 0.5rem !important;
    }
}

    /* Final Complete CSS - Replace entire <style> section with this */

html body .content .content-wrapper {
    padding: calc(0.9rem - 0.1rem) 1.2rem;
    overflow: visible !important;
}


/* ========== STICKY HEADER STYLES ========== */
.sticky-header-container {
    position: sticky !important;
    top: 0 !important;
    z-index: 1020 !important;
    background-color: white !important;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1) !important;
    width: 100% !important;
    margin-bottom: 1rem !important;
}

.sticky-header-container .container-fluid {
    padding: 0.5rem 1.2rem !important;
}
.site-header--sticky--register:not(.mobile-sticky-enable) {
    /* position: absolute !important; */
    top: 97px;
    z-index: 10;
}
    .site-header--sticky--register--panels{
     top: 258px;
    z-index: 10;
    }

@media (min-width: 992px) {
    .site-header--sticky--register:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        /* position: absolute !important; */
        /* min-height: 200px; */
        background: white;
    }
    .site-header--sticky--register--panels:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        /* position: absolute !important; */
        /* min-height: 200px; */
        background: white;
    }
}
    @media (max-width: 767px) {
    .site-header--sticky--register:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        background: white;
        width: 100%;
        left: 0;
        right: 0;
    }
    .site-header--sticky--register--panels:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        background: white;
        width: 100%;
        left: 0;
        right: 0;
    }
    
    /* Adjust content margin to avoid overlap */
    .content-body {
        margin-top: 120px; /* Adjust based on your header height */
    }
}

.stickyBreakpoints {
    position: sticky !important;
    top: 120px !important;
    z-index: 11 !important;
}

/* ========== DATE PICKER STYLES ========== */
.react-date-picker__wrapper {
    border: none;
}

.react-date-picker__inputGroup input {
    border: none !important;
}

.react-date-picker__inputGroup {
    width: 100%;
    white-space: nowrap;
    background: transparent;
    border: none;
}

.react-date-picker__clear-button {
    display: none;
}

/* ========== UPLOAD MODAL STYLES ========== */
.upload-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
    backdrop-filter: blur(2px);
}

.upload-modal-content {
    background-color: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
}

.upload-modal-header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.upload-modal-body {
    padding: 24px;
}

.upload-modal-footer {
    padding: 16px 24px 24px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.file-drop-zone {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 48px 24px;
    text-align: center;
    background-color: #f9fafb;
    transition: all 0.3s ease;
    cursor: pointer;
}

.file-drop-zone:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
}

.drop-zone-content .upload-icon {
    font-size: 48px;
    color: #3b82f6;
    margin-bottom: 16px;
    display: block;
}

.file-details {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background-color: #f3f4f6;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.file-icon {
    width: 48px;
    height: 48px;
    background-color: #3b82f6;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
}

.file-info {
    flex: 1;
}

.file-name {
    margin: 0 0 4px;
    font-weight: 500;
    color: #1f2937;
    font-size: 0.875rem;
}

.file-size {
    margin: 0;
    color: #6b7280;
    font-size: 0.75rem;
}

.preview-image {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.progress-bar-container {
    width: 100%;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-bar {
    height: 100%;
    background-color: #3b82f6;
    transition: width 0.3s ease;
    border-radius: 4px;
}

/* ========== DOCUMENT MODAL STYLES ========== */
.document-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1500;
    backdrop-filter: blur(2px);
}

.document-modal-content {
    background-color: white;
    border-radius: 12px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
    z-index: 1501;
}
    #editFollowupPanel {
    max-height: calc(100vh - 220px); /* Adjust based on your header height */
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin; /* For Firefox */
    scrollbar-color: #cbd5e0 #f7fafc; /* For Firefox */
}

/* ========== RESPONSIVE DESIGN ========== */
@media (max-width: 1920px) {
    .stickyBreakpoints {
        top: 120px !important;
    }
}

@media (max-width: 1400px) {
    .stickyBreakpoints {
        top: 110px !important;
    }
}

@media (max-width: 768px) {
    .sticky-header-container {
        position: sticky !important;
        top: 0 !important;
    }
    
    .stickyBreakpoints {
        position: relative !important;
    }
    
    .sticky-header-container .container-fluid {
        padding: 0.5rem 1rem !important;
    }
}

@media (max-width: 576px) {
    .sticky-header-container .container-fluid {
        padding: 0.25rem 0.5rem !important;
    }
}
    
    `
        }
      </style>
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
}option-item-new

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
  z-index: 7;
}

/* Responsive adjustments */
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


    `
        }
      </style>
    </div>
  );
};

export default Student;