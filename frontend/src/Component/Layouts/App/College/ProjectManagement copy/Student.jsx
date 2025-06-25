import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // URL-based state management
  const getURLParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      stage: urlParams.get('stage') || 'student',
      studentId: urlParams.get('studentId'),
      studentName: urlParams.get('studentName'),
      batchId: urlParams.get('batchId'),
      batchName: urlParams.get('batchName'),
      courseId: urlParams.get('courseId'),
      courseName: urlParams.get('courseName'),
      centerId: urlParams.get('centerId'),
      centerName: urlParams.get('centerName'),
      projectId: urlParams.get('projectId'),
      projectName: urlParams.get('projectName'),
      verticalId: urlParams.get('verticalId'),
      verticalName: urlParams.get('verticalName')
    };
  };

  const updateURL = (params) => {
    const url = new URL(window.location);
    
    // Clear existing params
    url.searchParams.delete('stage');
    url.searchParams.delete('studentId');
    url.searchParams.delete('studentName');
    url.searchParams.delete('batchId');
    url.searchParams.delete('batchName');
    
    // Set new params
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url.searchParams.set(key, params[key]);
      }
    });
    
    window.history.replaceState({}, '', url);
  };

  // State management
  const [activeTab, setActiveTab] = useState("zeroPeriod");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [showPopup, setShowPopup] = useState(null);
  const [leadDetailsVisible, setLeadDetailsVisible] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [studentTabsActive, setStudentTabsActive] = useState({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  // ===== ENHANCED ATTENDANCE STATE =====
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
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
  const [allProfilesData, setAllProfilesData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [filterData, setFilterData] = useState({
    course: "",
    batch: "",
    status: "",
    fromDate: "",
    toDate: "",
    center: "",
  });

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
    status: "active",
    password: "",
    confirmPassword: "",
  });

  // Tab definitions for each student card - Updated with 5 required tabs
  const tabs = [
    "Profile",
    "Job History",
    "Course History",
    "Documents",
    "Attendance",
  ];

  // Tab definitions for main navigation
  const mainTabs = [
    { key: "all", label: "All", count: 0, icon: "bi-people-fill" },
    {
      key: "admission",
      label: "Admission List",
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
    console.log("Attendance Dashboard clicked!");
    setShowAttendanceModal(true);
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



  const getMonthlyAttendanceBreakdown = (student) => {
    const monthlyData = {};

    student.dailyAttendance.forEach((record) => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
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

      monthlyData[monthKey][record.status] =
        (monthlyData[monthKey][record.status] || 0) + 1;
      monthlyData[monthKey].total++;
      monthlyData[monthKey].records.push(record);
    });

    // Calculate percentages for each month
    Object.keys(monthlyData).forEach((monthKey) => {
      const month = monthlyData[monthKey];
      month.attendancePercentage =
        month.total > 0
          ? (
              ((month.present +
                month.late +
                month.halfDay * 0.5 +
                month.shortLeave * 0.5) /
                month.total) *
              100
            ).toFixed(1)
          : 0;
    });

    return monthlyData;
  };
  // Yearly attendance breakdown function
  const getYearlyAttendanceBreakdown = (student) => {
    const yearlyData = {};

    student.dailyAttendance.forEach((record) => {
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

      yearlyData[year][record.status] =
        (yearlyData[year][record.status] || 0) + 1;
      yearlyData[year].total++;
      yearlyData[year].records.push(record);

      yearlyData[year].months[month][record.status] =
        (yearlyData[year].months[month][record.status] || 0) + 1;
      yearlyData[year].months[month].total++;
      yearlyData[year].months[month].records.push(record);
    });

    // Calculate percentages
    Object.keys(yearlyData).forEach((year) => {
      const yearData = yearlyData[year];
      yearData.attendancePercentage =
        yearData.total > 0
          ? (
              ((yearData.present +
                yearData.late +
                yearData.halfDay * 0.5 +
                yearData.shortLeave * 0.5) /
                yearData.total) *
              100
            ).toFixed(1)
          : 0;

      Object.keys(yearData.months).forEach((month) => {
        const monthData = yearData.months[month];
        monthData.attendancePercentage =
          monthData.total > 0
            ? (
                ((monthData.present +
                  monthData.late +
                  monthData.halfDay * 0.5 +
                  monthData.shortLeave * 0.5) /
                  monthData.total) *
                100
              ).toFixed(1)
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
                <th>Total Days</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Leave</th>
                <th>Half Day</th>
                <th>Attendance %</th>
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
                      <span className="badge bg-warning text-dark">
                        {data.late || 0}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-info">{data.leave || 0}</span>
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {(data.halfDay || 0) + (data.shortLeave || 0)}
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
                    <div className="card bg-warning text-dark">
                      <div className="card-body p-2">
                        <div className="h6 mb-0">{data.late || 0}</div>
                        <div className="small">Late</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-2">
                    <div className="card bg-info text-white">
                      <div className="card-body p-2">
                        <div className="h6 mb-0">{data.leave || 0}</div>
                        <div className="small">Leave</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-2">
                    <div className="card bg-secondary text-white">
                      <div className="card-body p-2">
                        <div className="h6 mb-0">
                          {(data.halfDay || 0) + (data.shortLeave || 0)}
                        </div>
                        <div className="small">Half Days</div>
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
                        <th>Late</th>
                        <th>Leave</th>
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
                              <span className="badge bg-warning text-dark">
                                {monthData.late || 0}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-info">
                                {monthData.leave || 0}
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
    const filteredStats = getFilteredAttendanceData(student);

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
                  className={`btn ${
                    attendanceView === "daily"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setAttendanceView("daily")}
                >
                  <i className="fas fa-calendar-day me-1"></i>Daily
                </button>
                <button
                  type="button"
                  className={`btn ${
                    attendanceView === "monthly"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setAttendanceView("monthly")}
                >
                  <i className="fas fa-calendar-alt me-1"></i>Monthly
                </button>
                <button
                  type="button"
                  className={`btn ${
                    attendanceView === "yearly"
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
                <span className="badge bg-warning text-dark">
                  {filteredStats.lateDays} Late
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
            <div className="col-md-2">
              <div className="card bg-warning text-dark">
                <div className="card-body p-2">
                  <div className="h5 mb-0">{filteredStats.lateDays}</div>
                  <div className="small">Late Days</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card bg-info text-white">
                <div className="card-body p-2">
                  <div className="h5 mb-0">{filteredStats.leaveDays}</div>
                  <div className="small">Leave Days</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card bg-secondary text-white">
                <div className="card-body p-2">
                  <div className="h5 mb-0">
                    {filteredStats.halfDays + filteredStats.shortLeaveDays}
                  </div>
                  <div className="small">Half/Short Days</div>
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
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Late Minutes</th>
                      <th>Notes/Reason</th>
                      <th>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredStats.filteredRecords || student.dailyAttendance)
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
                                  className={`fas ${
                                    record.status === "present"
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
                              className={`badge ${
                                leave.leaveType === "full"
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
                              className={`badge bg-${
                                leave.status === "approved"
                                  ? "success"
                                  : leave.status === "pending"
                                  ? "warning text-dark"
                                  : "danger"
                              }`}
                            >
                              <i
                                className={`fas ${
                                  leave.status === "approved"
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

    console.log(
      "selectedDocumentForUpload",
      selectedDocumentForUpload,
      "selectedProfile",
      selectedProfile
    );

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

      console.log("response", response);

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
    console.log(`Updating document ${uploadId} to ${status}`);
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

      // Replace with your actual profile API endpoint
      const response = await axios.get(
        `${backendUrl}/college/appliedCandidates?page=${currentPage}`,
        {
          headers: {
            "x-auth": token,
          },
        }
      );
      console.log("Backend profile data:", response.data);
      if (response.data.success && response.data.data) {
        const data = response.data.data; // create array
        setAllProfiles(response.data.data);
        setAllProfilesData(response.data.data);
        setTotalPages(response.data.totalPages);
      } else {
        console.error("Failed to fetch profile data", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) {
      applyFilters();
      return;
    }

    const searchFiltered = allProfilesData.filter((profile) => {
      try {
        const name = profile._candidate?.name
          ? String(profile._candidate.name).toLowerCase()
          : "";
        const mobile = profile._candidate?.mobile
          ? String(profile._candidate.mobile).toLowerCase()
          : "";
        const email = profile._candidate?.email
          ? String(profile._candidate.email).toLowerCase()
          : "";
        const searchLower = searchTerm.toLowerCase();

        return (
          name.includes(searchLower) ||
          mobile.includes(searchLower) ||
          email.includes(searchLower)
        );
      } catch (error) {
        console.error("Search filter error for profile:", profile, error);
        return false;
      }
    });

    setAllProfiles(searchFiltered);
  };

  const applyFilters = (filters = filterData) => {
    console.log("Applying filters with data:", filters);

    let filtered = [...allProfilesData];

    try {
      // Search filter
      if (filters.name && filters.name.trim()) {
        const searchTerm = filters.name.toLowerCase();
        filtered = filtered.filter((profile) => {
          try {
            const name = profile._candidate?.name
              ? String(profile._candidate.name).toLowerCase()
              : "";
            const mobile = profile._candidate?.mobile
              ? String(profile._candidate.mobile).toLowerCase()
              : "";
            const email = profile._candidate?.email
              ? String(profile._candidate.email).toLowerCase()
              : "";

            return (
              name.includes(searchTerm) ||
              mobile.includes(searchTerm) ||
              email.includes(searchTerm)
            );
          } catch (error) {
            return false;
          }
        });
      }

      // Course type filter
      if (filters.courseType) {
        filtered = filtered.filter((profile) => {
          try {
            const courseType = profile._course?.courseType
              ? String(profile._course.courseType).toLowerCase()
              : "";
            return courseType === filters.courseType.toLowerCase();
          } catch (error) {
            return false;
          }
        });
      }

      // Lead status filter
      if (filters.leadStatus) {
        filtered = filtered.filter(
          (profile) => profile._leadStatus?._id === filters.leadStatus
        );
      }

      // Status filter
      if (filters.status && filters.status !== "true") {
        filtered = filtered.filter(
          (profile) => profile._leadStatus?._id === filters.status
        );
      }

      // Sector filter
      if (filters.sector) {
        filtered = filtered.filter((profile) => {
          try {
            const sectors = profile._course?.sectors
              ? String(profile._course.sectors).toLowerCase()
              : "";
            return sectors === filters.sector.toLowerCase();
          } catch (error) {
            return false;
          }
        });
      }

      // CREATED DATE filter
      if (filters.createdFromDate || filters.createdToDate) {
        filtered = filtered.filter((profile) => {
          try {
            if (!profile.createdAt) return false;

            const profileDate = new Date(profile.createdAt);

            // From date check
            if (filters.createdFromDate) {
              const fromDate = new Date(filters.createdFromDate);
              fromDate.setHours(0, 0, 0, 0);
              if (profileDate < fromDate) return false;
            }

            // To date check
            if (filters.createdToDate) {
              const toDate = new Date(filters.createdToDate);
              toDate.setHours(23, 59, 59, 999);
              if (profileDate > toDate) return false;
            }

            return true;
          } catch (error) {
            return false;
          }
        });
      }

      // MODIFIED DATE filter
      if (filters.modifiedFromDate || filters.modifiedToDate) {
        filtered = filtered.filter((profile) => {
          try {
            if (!profile.updatedAt) return false;

            const profileDate = new Date(profile.updatedAt);

            // From date check
            if (filters.modifiedFromDate) {
              const fromDate = new Date(filters.modifiedFromDate);
              fromDate.setHours(0, 0, 0, 0);
              if (profileDate < fromDate) return false;
            }

            // To date check
            if (filters.modifiedToDate) {
              const toDate = new Date(filters.modifiedToDate);
              toDate.setHours(23, 59, 59, 999);
              if (profileDate > toDate) return false;
            }

            return true;
          } catch (error) {
            return false;
          }
        });
      }

      // NEXT ACTION DATE filter
      if (filters.nextActionFromDate || filters.nextActionToDate) {
        filtered = filtered.filter((profile) => {
          try {
            if (!profile.followupDate) return false;

            const profileDate = new Date(profile.followupDate);

            // From date check
            if (filters.nextActionFromDate) {
              const fromDate = new Date(filters.nextActionFromDate);
              fromDate.setHours(0, 0, 0, 0);
              if (profileDate < fromDate) return false;
            }

            // To date check
            if (filters.nextActionToDate) {
              const toDate = new Date(filters.nextActionToDate);
              toDate.setHours(23, 59, 59, 999);
              if (profileDate > toDate) return false;
            }

            return true;
          } catch (error) {
            return false;
          }
        });
      }

      console.log(
        "Filter results:",
        filtered.length,
        "out of",
        allProfilesData.length
      );
      setAllProfiles(filtered);
    } catch (error) {
      console.error("Filter error:", error);
      setAllProfiles(allProfilesData);
    }
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
 
  const getRegisterDates = (year, month, viewMode = 'month') => {
    let dates = [];
    
    if (viewMode === 'month') {
      // Get all dates for the month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        dates.push({
          date: date.toISOString().split('T')[0],
          day: day,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          isWeekend: date.getDay() === 0 || date.getDay() === 6
        });
      }
    } else if (viewMode === 'week') {
      // Get current week dates
      const today = new Date();
      const currentWeekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        dates.push({
          date: date.toISOString().split('T')[0],
          day: date.getDate(),
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          isWeekend: date.getDay() === 0 || date.getDay() === 6
        });
      }
    } else if (viewMode === 'custom' && registerDateRange.startDate && registerDateRange.endDate) {
      // Get custom date range
      const startDate = new Date(registerDateRange.startDate);
      const endDate = new Date(registerDateRange.endDate);
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        dates.push({
          date: currentDate.toISOString().split('T')[0],
          day: currentDate.getDate(),
          dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
          isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return dates;
  };
  
  const getAttendanceStatus = (student, date) => {
    const attendanceRecord = student.dailyAttendance?.find(record => record.date === date);
    if (!attendanceRecord) return { status: 'not-marked', symbol: '-', class: 'not-marked' };
    
    const statusMap = {
      'present': { symbol: 'P', class: 'present', title: 'Present' },
      'absent': { symbol: 'A', class: 'absent', title: 'Absent' },
      'late': { symbol: 'L', class: 'late', title: 'Late' },
      'leave': { symbol: 'Lv', class: 'leave', title: 'Leave' },
      'halfDay': { symbol: 'HD', class: 'half-day', title: 'Half Day' },
      'shortLeave': { symbol: 'SL', class: 'short-leave', title: 'Short Leave' },
      'not-marked': { symbol: '-', class: 'not-marked', title: 'Not Marked' }
    };
    
    const statusInfo = statusMap[attendanceRecord.status] || statusMap['not-marked'];
    return {
      ...statusInfo,
      timeIn: attendanceRecord.timeIn,
      timeOut: attendanceRecord.timeOut,
      lateMinutes: attendanceRecord.lateMinutes,
      notes: attendanceRecord.notes
    };
  };
  
  const AttendanceManagementModal = ({ show, onClose }) => {
    if (!show) return null;
  
    // Get all students data for attendance management
    const allStudentsAttendanceData = getFilteredStudents().map((student) => {
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
      const dates = getRegisterDates(registerCurrentYear, registerCurrentMonth, registerViewMode);
      
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
  
      return (
        <div className="attendance-register-container">
          {/* Register Header Controls */}
          <div className="register-header mb-4">
            <div className="row align-items-center">
              <div className="col-md-3">
                <label className="form-label fw-bold">View Mode:</label>
                <select 
                  className="form-select"
                  value={registerViewMode}
                  onChange={(e) => setRegisterViewMode(e.target.value)}
                >
                  <option value="month">Monthly View</option>
                  <option value="week">Weekly View</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              {registerViewMode === 'month' && (
                <>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Month:</label>
                    <select 
                      className="form-select"
                      value={registerCurrentMonth}
                      onChange={(e) => setRegisterCurrentMonth(parseInt(e.target.value))}
                    >
                      {monthNames.map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Year:</label>
                    <select 
                      className="form-select"
                      value={registerCurrentYear}
                      onChange={(e) => setRegisterCurrentYear(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                </>
              )}
              
              {registerViewMode === 'custom' && (
                <>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Start Date:</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={registerDateRange.startDate}
                      onChange={(e) => setRegisterDateRange(prev => ({...prev, startDate: e.target.value}))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">End Date:</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={registerDateRange.endDate}
                      onChange={(e) => setRegisterDateRange(prev => ({...prev, endDate: e.target.value}))}
                    />
                  </div>
                </>
              )}
              
              <div className="col-md-3 d-flex align-items-end">
                <button className="btn btn-primary">
                  <i className="fas fa-download me-1"></i>
                  Export Register
                </button>
              </div>
            </div>
          </div>
  
          {/* Register Title */}
          <div className="register-title text-center mb-4">
            <h4 className="fw-bold text-primary">
              <i className="fas fa-clipboard-list me-2"></i>
              Attendance Register - {monthNames[registerCurrentMonth]} {registerCurrentYear}
            </h4>
            <p className="text-muted mb-0">
              Total Students: {allStudentsAttendanceData.length} | 
              Period: {dates.length > 0 ? `${dates[0]?.day}/${registerCurrentMonth + 1}` : ''} to {dates.length > 0 ? `${dates[dates.length - 1]?.day}/${registerCurrentMonth + 1}/${registerCurrentYear}` : ''}
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
                    <tr key={student.id} className="student-row">
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
                              <h6 className="mb-1 fw-bold student-name">{student.name}</h6>
                              <small className="text-muted enrollment-number">
                                {student.enrollmentNumber}
                              </small>
                              <div className="mt-1">
                                {getAdmissionStatusBadge(student)}
                              </div>
                              <div className="student-contact mt-1">
                                <small className="text-muted">
                                  <i className="fas fa-phone me-1"></i>
                                  {student.mobile}
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
                            <div className="stat-item late">
                              <span className="stat-label">L:</span>
                              <span className="stat-value">{student.filteredStats.lateDays}</span>
                            </div>
                            <div className="stat-item leave">
                              <span className="stat-label">Lv:</span>
                              <span className="stat-value">{student.filteredStats.leaveDays}</span>
                            </div>
                          </div>
                          <div className="attendance-percentage mt-2">
                            <div className="percentage-bar">
                              <div 
                                className={`percentage-fill bg-${getProgressColor(student.filteredStats.attendancePercentage)}`}
                                style={{ width: `${student.filteredStats.attendancePercentage}%` }}
                              ></div>
                            </div>
                            <small className="percentage-text fw-bold">
                              {student.filteredStats.attendancePercentage}%
                            </small>
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
                <span className="legend-symbol late">L</span>
                <span className="legend-text">Late</span>
              </div>
              <div className="legend-item">
                <span className="legend-symbol leave">Lv</span>
                <span className="legend-text">Leave</span>
              </div>
              <div className="legend-item">
                <span className="legend-symbol half-day">HD</span>
                <span className="legend-text">Half Day</span>
              </div>
              <div className="legend-item">
                <span className="legend-symbol short-leave">SL</span>
                <span className="legend-text">Short Leave</span>
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
      return (
        <div className="daily-attendance-management">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th style={{ minWidth: "200px" }}>Student Details</th>
                  <th>Enrollment No.</th>
                  <th>Total Days</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Leave</th>
                  <th>Attendance %</th>
                  <th>Punctuality %</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allStudentsAttendanceData.map((student, index) => (
                  <tr key={student.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: "40px", height: "40px" }}
                        >
                          <i className="bi bi-person-fill text-primary"></i>
                        </div>
                        <div>
                          <h6 className="mb-0 fw-bold">{student.name}</h6>
                          <small className="text-muted">{student.email}</small>
                          <div className="mt-1">
                            {getAdmissionStatusBadge(student)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="fw-medium">
                        {student.enrollmentNumber}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-primary">
                        {student.filteredStats.totalWorkingDays}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-success">
                        {student.filteredStats.presentDays}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-danger">
                        {student.filteredStats.absentDays}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-warning text-dark">
                        {student.filteredStats.lateDays}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-info">
                        {student.filteredStats.leaveDays}
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
                              student.filteredStats.attendancePercentage
                            )}`}
                            style={{
                              width: `${student.filteredStats.attendancePercentage}%`,
                            }}
                          ></div>
                        </div>
                        <small className="fw-medium">
                          {student.filteredStats.attendancePercentage}%
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className="progress flex-grow-1 me-2"
                          style={{ height: "18px", width: "50px" }}
                        >
                          <div
                            className={`progress-bar bg-${getProgressColor(
                              student.filteredStats.punctualityScore
                            )}`}
                            style={{
                              width: `${student.filteredStats.punctualityScore}%`,
                            }}
                          ></div>
                        </div>
                        <small className="fw-medium">
                          {student.filteredStats.punctualityScore}%
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowDetailsModal(true);
                          }}
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className="btn btn-outline-success"
                          onClick={() => {
                            onClose();
                            setTimeout(() => {
                              const studentIndex =
                                getFilteredStudents().findIndex(
                                  (s) => s.id === student.id
                                );
                              if (studentIndex !== -1) {
                                toggleStudentDetails(studentIndex);
                              }
                            }, 300);
                          }}
                          title="Mark Attendance"
                        >
                          <i className="fas fa-check"></i>
                        </button>
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
                        className={`btn ${
                          attendanceManagementView === "register"
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
                        className={`btn ${
                          attendanceManagementView === "daily"
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
                    <label className="form-label fw-bold mb-2">
                      <i className="fas fa-tools me-2"></i>
                      Actions
                    </label>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-success"
                        onClick={() => exportAttendanceData("excel")}
                      >
                        <i className="fas fa-file-excel me-1"></i>
                        Export
                      </button>
                      <button
                        className="btn btn-warning"
                        onClick={() => {
                          alert("Printing attendance register...");
                          window.print();
                        }}
                      >
                        <i className="fas fa-print me-1"></i>
                        Print
                      </button>
                    </div>
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
                        allStudentsAttendanceData.filter(
                          (s) => s.filteredStats.attendancePercentage >= 85
                        ).length
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
                          (s) =>
                            s.filteredStats.attendancePercentage >= 75 &&
                            s.filteredStats.attendancePercentage < 85
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
                          (s) => s.filteredStats.attendancePercentage < 75
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
              className={`document-thumbnail pdf-thumbnail ${
                isSmall ? "small" : ""
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
                      console.log("selectedDocument:", selectedDocument);
                      console.log("latestUpload:", latestUpload);

                      const fileUrl =
                        latestUpload?.fileUrl || selectedDocument?.fileUrl;
                      const hasDocument =
                        fileUrl ||
                        (selectedDocument?.status &&
                          selectedDocument?.status !== "Not Uploaded" &&
                          selectedDocument?.status !== "No Uploads");

                      console.log("fileUrl:", fileUrl);
                      console.log("hasDocument:", hasDocument);

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
                          className={`fas ${
                            selectedFile.type.startsWith("image/")
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
  const [profile, setProfile] = useState([
    {
      id: 1,
      enrollmentNumber: "STU001",
      name: "John Doe",
      email: "john.doe@example.com",
      mobile: "+91 9876543210",
      batchId: 1,
      batchName: "CS101 Morning Batch",
      admissionDate: "2024-02-01",
      status: "active",
      admissionStatus: "admitted",
      parentName: "Robert Doe",
      parentMobile: "+91 9876543211",
      address: "123 Main Street, Mumbai",
      feeStatus: "paid",
      profileImage: null,
      dateOfBirth: "2000-05-15",
      bloodGroup: "O+",
      emergencyContact: "+91 9876543212",

      // Course Information
      courseStartDate: "2024-02-01",
      courseEndDate: "2024-08-01",
      totalCourseDays: 180,
      courseDuration: "6 months",

      // Job History
      jobHistory: [
        {
          id: 1,
          company: "TechCorp Solutions",
          position: "Junior Developer",
          startDate: "2023-06-01",
          endDate: "2024-01-31",
          salary: "₹25,000",
          reason: "Career Growth",
          status: "completed",
        },
        {
          id: 2,
          company: "WebTech Agency",
          position: "Intern",
          startDate: "2023-01-01",
          endDate: "2023-05-31",
          salary: "₹8,000",
          reason: "Internship Completion",
          status: "completed",
        },
      ],

      // Course History
      courseHistory: [
        {
          id: 1,
          courseName: "Full Stack Web Development",
          institution: "Code Academy",
          startDate: "2024-02-01",
          endDate: "2024-08-01",
          status: "ongoing",
          grade: "",
          percentage: 85,
        },
        {
          id: 2,
          courseName: "Basic Computer Applications",
          institution: "Tech Institute",
          startDate: "2023-06-01",
          endDate: "2023-12-01",
          status: "completed",
          grade: "A",
          percentage: 92,
        },
      ],

      // Enhanced attendance tracking
      attendanceStats: {
        presentDays: 152,
        absentDays: 8,
        lateDays: 12,
        leaveDays: 4,
        halfDays: 2,
        shortLeaveDays: 6,
        totalWorkingDays: 180,
        attendancePercentage: 92.2,
        punctualityScore: 89.5,
      },

      // Leave records
      leaves: [
        {
          id: 1,
          date: "2024-03-05",
          type: "sick",
          leaveType: "full",
          reason: "Fever and cold",
          status: "approved",
          appliedDate: "2024-03-04",
          approvedBy: "Teacher Name",
          duration: 1,
        },
      ],

      // Daily attendance records
      dailyAttendance: [
        {
          date: "2024-06-20",
          status: "present",
          timeIn: "09:00",
          timeOut: "17:00",
          notes: "",
          lateMinutes: 0,
        },
        {
          date: "2024-06-19",
          status: "late",
          timeIn: "09:15",
          timeOut: "17:00",
          notes: "Traffic jam",
          lateMinutes: 15,
        },
        {
          date: "2024-06-18",
          status: "present",
          timeIn: "08:55",
          timeOut: "17:00",
          notes: "",
          lateMinutes: 0,
        },
        {
          date: "2024-06-17",
          status: "absent",
          reason: "Sick leave",
          notes: "Fever",
        },
        {
          date: "2024-06-16",
          status: "late",
          timeIn: "09:25",
          timeOut: "17:00",
          notes: "Bus delay",
          lateMinutes: 25,
        },
        {
          date: "2024-06-15",
          status: "present",
          timeIn: "08:58",
          timeOut: "17:00",
          notes: "",
          lateMinutes: 0,
        },
        {
          date: "2024-06-14",
          status: "present",
          timeIn: "09:02",
          timeOut: "17:00",
          notes: "",
          lateMinutes: 2,
        },
        {
          date: "2024-06-13",
          status: "halfDay",
          timeIn: "09:00",
          timeOut: "13:00",
          notes: "Medical appointment",
          lateMinutes: 0,
        },
        {
          date: "2024-06-12",
          status: "present",
          timeIn: "08:55",
          timeOut: "17:00",
          notes: "",
          lateMinutes: 0,
        },
        {
          date: "2024-06-11",
          status: "late",
          timeIn: "09:30",
          timeOut: "17:00",
          notes: "Personal work",
          lateMinutes: 30,
        },
      ],
    },
    {
      id: 2,
      enrollmentNumber: "STU002",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      mobile: "+91 9876543220",
      batchId: 1,
      batchName: "CS101 Morning Batch",
      admissionDate: "2024-02-01",
      status: "active",
      admissionStatus: "admitted",
      parentName: "Mary Smith",
      parentMobile: "+91 9876543221",
      address: "456 Park Avenue, Mumbai",
      feeStatus: "paid",
      profileImage: null,
      dateOfBirth: "2001-08-22",
      bloodGroup: "A+",
      emergencyContact: "+91 9876543222",

      courseStartDate: "2024-02-01",
      courseEndDate: "2024-08-01",
      totalCourseDays: 180,
      courseDuration: "6 months",

      // Job History
      jobHistory: [
        {
          id: 1,
          company: "Digital Marketing Co.",
          position: "Content Writer",
          startDate: "2023-09-01",
          endDate: "2024-01-15",
          salary: "₹20,000",
          reason: "Career Change",
          status: "completed",
        },
      ],

      // Course History
      courseHistory: [
        {
          id: 1,
          courseName: "Full Stack Web Development",
          institution: "Code Academy",
          startDate: "2024-02-01",
          endDate: "2024-08-01",
          status: "ongoing",
          grade: "",
          percentage: 78,
        },
      ],

      attendanceStats: {
        presentDays: 140,
        absentDays: 15,
        lateDays: 18,
        leaveDays: 3,
        halfDays: 1,
        shortLeaveDays: 4,
        totalWorkingDays: 180,
        attendancePercentage: 85.8,
        punctualityScore: 82.3,
      },

      leaves: [
        {
          id: 2,
          date: "2024-04-10",
          type: "personal",
          leaveType: "half",
          reason: "Family function",
          status: "approved",
          appliedDate: "2024-04-08",
          approvedBy: "Principal",
          duration: 0.5,
        },
      ],

      dailyAttendance: [
        {
          date: "2024-06-20",
          status: "present",
          timeIn: "09:02",
          timeOut: "17:00",
          notes: "",
          lateMinutes: 2,
        },
        {
          date: "2024-06-19",
          status: "absent",
          reason: "Sick leave",
          notes: "Fever",
        },
        {
          date: "2024-06-18",
          status: "late",
          timeIn: "09:20",
          timeOut: "17:00",
          notes: "Bus delay",
          lateMinutes: 20,
        },
        {
          date: "2024-06-17",
          status: "present",
          timeIn: "09:05",
          timeOut: "17:00",
          notes: "",
          lateMinutes: 5,
        },
        {
          date: "2024-06-16",
          status: "present",
          timeIn: "08:58",
          timeOut: "17:00",
          notes: "",
          lateMinutes: 0,
        },
        {
          date: "2024-06-15",
          status: "late",
          timeIn: "09:18",
          timeOut: "17:00",
          notes: "Traffic",
          lateMinutes: 18,
        },
        {
          date: "2024-06-14",
          status: "present",
          timeIn: "09:00",
          timeOut: "17:00",
          notes: "",
          lateMinutes: 0,
        },
        {
          date: "2024-06-13",
          status: "absent",
          reason: "Personal work",
          notes: "Family emergency",
        },
        {
          date: "2024-06-12",
          status: "present",
          timeIn: "09:10",
          timeOut: "17:00",
          notes: "",
          lateMinutes: 10,
        },
        {
          date: "2024-06-11",
          status: "present",
          timeIn: "08:55",
          timeOut: "17:00",
          notes: "",
          lateMinutes: 0,
        },
      ],
    },
    // Adding Zero Period Students
    {
      id: 4,
      enrollmentNumber: "STU004",
      name: "Sarah Williams",
      email: "sarah.williams@example.com",
      mobile: "+91 9876543240",
      batchId: 1,
      batchName: "CS101 Morning Batch",
      admissionDate: "2024-02-15",
      status: "active",
      admissionStatus: "zeroPeriod",
      parentName: "Tom Williams",
      parentMobile: "+91 9876543241",
      address: "321 Garden Street, Mumbai",
      feeStatus: "pending",
      profileImage: null,
      dateOfBirth: "2000-11-08",
      bloodGroup: "AB+",
      emergencyContact: "+91 9876543242",

      courseStartDate: "2024-03-01",
      courseEndDate: "2024-03-31",
      totalCourseDays: 30,
      courseDuration: "1 month trial",
      zeroPeriodDays: 25,
      trialStartDate: "2024-03-01",
      trialEndDate: "2024-03-31",
      totalTrialDays: 30,

      // Job History
      jobHistory: [],

      // Course History
      courseHistory: [
        {
          id: 1,
          courseName: "Web Development Trial",
          institution: "Code Academy",
          startDate: "2024-03-01",
          endDate: "2024-03-31",
          status: "trial",
          grade: "",
          percentage: 60,
        },
      ],

      attendanceStats: {
        presentDays: 18,
        absentDays: 4,
        lateDays: 2,
        leaveDays: 1,
        halfDays: 0,
        shortLeaveDays: 2,
        totalWorkingDays: 25,
        attendancePercentage: 75.0,
        punctualityScore: 85.2,
      },

      leaves: [
        {
          id: 3,
          date: "2024-03-15",
          type: "emergency",
          leaveType: "short",
          reason: "Medical appointment",
          status: "approved",
          appliedDate: "2024-03-15",
          approvedBy: "Principal",
          timeOut: "10:30",
          timeIn: "12:00",
          duration: 1.5,
        },
      ],

      dailyAttendance: [
        {
          date: "2024-06-20",
          status: "present",
          timeIn: "09:00",
          timeOut: "13:00",
          notes: "",
          lateMinutes: 0,
        },
        {
          date: "2024-06-19",
          status: "late",
          timeIn: "09:15",
          timeOut: "13:00",
          notes: "Traffic",
          lateMinutes: 15,
        },
        {
          date: "2024-06-18",
          status: "present",
          timeIn: "08:58",
          timeOut: "13:00",
          notes: "",
          lateMinutes: 0,
        },
        {
          date: "2024-06-17",
          status: "absent",
          reason: "Personal work",
          notes: "Family function",
        },
        {
          date: "2024-06-16",
          status: "present",
          timeIn: "09:05",
          timeOut: "13:00",
          notes: "",
          lateMinutes: 5,
        },
        {
          date: "2024-06-15",
          status: "late",
          timeIn: "09:20",
          timeOut: "13:00",
          notes: "Bus delay",
          lateMinutes: 20,
        },
        {
          date: "2024-06-14",
          status: "present",
          timeIn: "09:00",
          timeOut: "13:00",
          notes: "",
          lateMinutes: 0,
        },
        {
          date: "2024-06-13",
          status: "present",
          timeIn: "08:55",
          timeOut: "13:00",
          notes: "",
          lateMinutes: 0,
        },
        {
          date: "2024-06-12",
          status: "halfDay",
          timeIn: "09:00",
          timeOut: "11:30",
          notes: "Medical appointment",
          lateMinutes: 0,
        },
        {
          date: "2024-06-11",
          status: "present",
          timeIn: "09:10",
          timeOut: "13:00",
          notes: "",
          lateMinutes: 10,
        },
      ],
    },
  ]);

  // ===== ATTENDANCE FUNCTIONS =====

  // Initialize today's attendance
  useEffect(() => {
    const initialAttendance = {};
    profile.forEach((student) => {
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
  const getFilteredAttendanceData = (student) => {
    const today = new Date();
    let startDate, endDate;
    let filteredRecords = [];

    switch (timeFilter) {
      case "today":
        startDate = endDate = selectedDate;
        filteredRecords = student.dailyAttendance.filter((record) => {
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

        filteredRecords = student.dailyAttendance.filter((record) => {
          const recordDate = new Date(record.date);
          return recordDate >= weekStart && recordDate <= weekEnd;
        });
        break;

      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        startDate = monthStart.toISOString().split("T")[0];
        endDate = monthEnd.toISOString().split("T")[0];

        filteredRecords = student.dailyAttendance.filter((record) => {
          const recordDate = new Date(record.date);
          return recordDate >= monthStart && recordDate <= monthEnd;
        });
        break;

      case "year":
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear(), 11, 31);

        startDate = yearStart.toISOString().split("T")[0];
        endDate = yearEnd.toISOString().split("T")[0];

        filteredRecords = student.dailyAttendance.filter((record) => {
          const recordDate = new Date(record.date);
          return recordDate >= yearStart && recordDate <= yearEnd;
        });
        break;

      case "custom":
        if (dateRange.fromDate && dateRange.toDate) {
          const customStart = new Date(dateRange.fromDate);
          const customEnd = new Date(dateRange.toDate);

          filteredRecords = student.dailyAttendance.filter((record) => {
            const recordDate = new Date(record.date);
            return recordDate >= customStart && recordDate <= customEnd;
          });
        } else {
          filteredRecords = student.dailyAttendance;
        }
        break;

      default:
        filteredRecords = student.dailyAttendance;
    }
    const presentDays = filteredRecords.filter(
      (r) => r.status === "present"
    ).length;
    const absentDays = filteredRecords.filter(
      (r) => r.status === "absent"
    ).length;
    const lateDays = filteredRecords.filter((r) => r.status === "late").length;
    const leaveDays = filteredRecords.filter(
      (r) => r.status === "leave"
    ).length;
    const halfDays = filteredRecords.filter(
      (r) => r.status === "halfDay"
    ).length;
    const shortLeaveDays = filteredRecords.filter(
      (r) => r.status === "shortLeave"
    ).length;
    const totalWorkingDays = filteredRecords.length;

    const attendancePercentage =
      totalWorkingDays > 0
        ? (
            ((presentDays + lateDays + halfDays * 0.5 + shortLeaveDays * 0.5) /
              totalWorkingDays) *
            100
          ).toFixed(1)
        : 0;

    const punctualityScore =
      presentDays + lateDays > 0
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
      filteredRecords,
    };
  };

  // Calculate tab counts
  const getTabCounts = () => {
    const counts = {
      all: profile.length,
      admission: profile.filter(
        (s) => s.admissionStatus === "admitted" && s.status === "active"
      ).length,
      zeroPeriod: profile.filter((s) => s.admissionStatus === "zeroPeriod")
        .length,
      batchFreeze: profile.filter((s) => s.admissionStatus === "batchFreeze")
        .length,
      dropout: profile.filter((s) => s.admissionStatus === "dropped").length,
    };
    return counts;
  };

  // Filter students based on selected tab and search query
  const getFilteredStudents = () => {
    let filtered = profile;

    if (selectedBatch && selectedBatch.id) {
      filtered = filtered.filter(
        (student) => student.batchId === selectedBatch.id
      );
    }

    switch (activeTab) {
      case "admission":
        filtered = filtered.filter(
          (s) => s.admissionStatus === "admitted" && s.status === "active"
        );
        break;
      case "zeroPeriod":
        filtered = filtered.filter((s) => s.admissionStatus === "zeroPeriod");
        break;
      case "batchFreeze":
        filtered = filtered.filter((s) => s.admissionStatus === "batchFreeze");
        break;
      case "dropout":
        filtered = filtered.filter((s) => s.admissionStatus === "dropped");
        break;
      default:
        break;
    }

    if (!isFilterCollapsed) {
      if (filterData.status) {
        filtered = filtered.filter((s) => s.status === filterData.status);
      }
      if (filterData.fromDate) {
        filtered = filtered.filter(
          (s) => new Date(s.admissionDate) >= new Date(filterData.fromDate)
        );
      }
      if (filterData.toDate) {
        filtered = filtered.filter(
          (s) => new Date(s.admissionDate) <= new Date(filterData.toDate)
        );
      }
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.enrollmentNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          student.mobile.includes(searchQuery)
      );
    }

    return filtered;
  };

  // Mark individual attendance
  const markIndividualAttendance = (studentId, status) => {
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    let lateMinutes = 0;
    if (status === "late") {
      const standardTime = new Date(`2024-01-01 09:00`);
      const currentFullTime = new Date(`2024-01-01 ${currentTime}`);
      lateMinutes = Math.max(0, (currentFullTime - standardTime) / (1000 * 60));
    }

    setTodayAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: status,
        timeIn:
          status !== "absent" && status !== "leave"
            ? prev[studentId]?.timeIn || currentTime
            : "",
        timeOut: prev[studentId]?.timeOut || "",
        isMarked: true,
        lateMinutes: lateMinutes,
      },
    }));
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
    const eligibleStudents = filteredStudents.filter(
      (s) =>
        (activeTab === "zeroPeriod" && s.admissionStatus === "zeroPeriod") ||
        activeTab === "all"
    );

    if (selectedStudents.size === eligibleStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(eligibleStudents.map((s) => s.id)));
    }
  };

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
  const tabCounts = getTabCounts();

  const togglePopup = (studentIndex) => {
    setShowPopup((prev) => (prev === studentIndex ? null : studentIndex));
  };

  const toggleStudentDetails = (studentIndex) => {
    setLeadDetailsVisible((prev) =>
      prev === studentIndex ? null : studentIndex
    );
  };

  const handleTabClick = (studentIndex, tabIndex) => {
    setStudentTabsActive((prevTabs) => ({
      ...prevTabs,
      [studentIndex]: tabIndex,
    }));
  };

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
    switch (student.admissionStatus) {
      case "admitted":
        return <span className="badge bg-success">Admitted</span>;
      case "zeroPeriod":
        return (
          <span className="badge bg-warning">
            Zero Period (
            {student.zeroPeriodDays || student.attendanceStats.totalWorkingDays}{" "}
            days)
          </span>
        );
      case "batchFreeze":
        return <span className="badge bg-info">Batch Freeze</span>;
      case "dropped":
        return <span className="badge bg-danger">Dropout</span>;
      default:
        return null;
    }
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
    activeTab === "zeroPeriod" || activeTab === "all";
  const attendanceEligibleStudents = filteredStudents.filter(
    (s) =>
      s.admissionStatus === "zeroPeriod" || s.admissionStatus === "admitted"
  );

  // Initial URL setup and state restoration
  useEffect(() => {
    const urlParams = getURLParams();
    console.log('Student component - URL params:', urlParams);
    
    // If we're not in student stage, set to student stage
    if (urlParams.stage !== 'student') {
      console.log('Setting to student stage');
      updateURL({
        stage: 'student',
        batchId: selectedBatch?._id,
        batchName: selectedBatch?.name,
        courseId: selectedCourse?._id,
        courseName: selectedCourse?.name,
        centerId: selectedCenter?._id,
        centerName: selectedCenter?.name
      });
    }
  }, [selectedBatch, selectedCourse, selectedCenter]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Enhanced Header */}
          <div className="position-relative">
            <div className="site-header--sticky--register">
              <div className="container-fluid">
                <div className="row align-items-center">
                  <div className="col-md-4 d-md-block d-sm-none">
                    <div className="d-flex align-items-center">
                      <h4 className="fw-bold text-dark mb-0 me-3">
                        Students Management
                      </h4>
                      <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0 small">
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
                      </nav>
                    </div>
                  </div>

                  <div className="col-md-8">
                    <div className="d-flex justify-content-end align-items-center gap-2">
                      {/* ===== ENHANCED ATTENDANCE CONTROLS ===== */}
                      {showAttendanceControls &&
                        attendanceEligibleStudents.length > 0 && (
                          <>
                            {/* Time Filter */}
                            <div className="d-flex align-items-center me-2">
                              <label className="form-label me-2 mb-0 small fw-bold">
                                Period:
                              </label>
                              <select
                                className="form-select form-select-sm"
                                value={timeFilter}
                                onChange={(e) => setTimeFilter(e.target.value)}
                                style={{ width: "100px" }}
                              >
                                <option value="today">Today</option>
                                <option value="week">Week</option>
                                <option value="month">Month</option>
                                <option value="year">Year</option>
                              </select>
                            </div>

                            {/* Date Picker */}
                            <div className="d-flex align-items-center me-2">
                              <label className="form-label me-2 mb-0 small fw-bold">
                                Date:
                              </label>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={selectedDate}
                                onChange={(e) =>
                                  setSelectedDate(e.target.value)
                                }
                                style={{ width: "140px" }}
                              />
                            </div>

                            {/* Attendance Mode Toggle */}
                            <button
                              onClick={() =>
                                setShowAttendanceMode(!showAttendanceMode)
                              }
                              className={`btn btn-sm ${
                                showAttendanceMode
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
                                className={`btn btn-sm ${
                                  showBulkControls
                                    ? "btn-primary"
                                    : "btn-outline-primary"
                                }`}
                              >
                                <i className="fas fa-users me-1"></i>
                                Bulk
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
                        )}

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
                        className={`btn ${
                          !isFilterCollapsed
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        <i
                          className={`fas fa-filter me-1 ${
                            !isFilterCollapsed ? "fa-spin" : ""
                          }`}
                        ></i>
                        Filters
                      </button>

                      <div className="btn-group">
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`btn ${
                            viewMode === "grid"
                              ? "btn-primary"
                              : "btn-outline-secondary"
                          }`}
                        >
                          <i className="fas fa-th"></i>
                        </button>
                        <button
                          onClick={() => setViewMode("list")}
                          className={`btn ${
                            viewMode === "list"
                              ? "btn-primary"
                              : "btn-outline-secondary"
                          }`}
                        >
                          <i className="fas fa-list"></i>
                        </button>
                      </div>

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
                            className={`btn btn-sm ${
                              activeTab === tab.key
                                ? "btn-primary"
                                : "btn-outline-secondary"
                            }`}
                            onClick={() => setActiveTab(tab.key)}
                          >
                            <i className={`${tab.icon} me-1`}></i>
                            {tab.label}
                            <span
                              className={`ms-1 ${
                                activeTab === tab.key
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
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => setShowBulkUpload(true)}
                        >
                          <i className="fas fa-upload"></i> Bulk Upload
                        </button>
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
                  {showBulkControls && showAttendanceMode && (
                    <div className="col-12 mt-3 p-3 bg-light rounded">
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

                        {selectedStudents.size > 0 && (
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
                                <option value="present">Present</option>
                                <option value="late">Late</option>
                                <option value="absent">Absent</option>
                                <option value="leave">Leave</option>
                                <option value="halfDay">Half Day</option>
                                <option value="shortLeave">Short Leave</option>
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
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {!isFilterCollapsed && (
            <div
              className="bg-white border-bottom shadow-sm"
              style={{ marginTop: "150px" }}
            >
              <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-filter text-primary me-2"></i>
                    <h5 className="fw-bold mb-0 text-dark">Advanced Filters</h5>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setIsFilterCollapsed(true)}
                  >
                    <i className="fas fa-chevron-up"></i>
                  </button>
                </div>

                <div className="row g-4">
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-dark">
                      Status
                    </label>
                    <select
                      className="form-select"
                      value={filterData.status}
                      onChange={(e) =>
                        setFilterData({ ...filterData, status: e.target.value })
                      }
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="frozen">Frozen</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-dark">
                      From Date
                    </label>
                    <input
                      type="date"
                      className="form-select"
                      value={filterData.fromDate}
                      onChange={(e) =>
                        setFilterData({
                          ...filterData,
                          fromDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-dark">
                      To Date
                    </label>
                    <input
                      type="date"
                      className="form-select"
                      value={filterData.toDate}
                      onChange={(e) =>
                        setFilterData({ ...filterData, toDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <button
                      className="btn btn-sm btn-outline-danger me-2"
                      onClick={() =>
                        setFilterData({
                          course: "",
                          batch: "",
                          status: "",
                          fromDate: "",
                          toDate: "",
                          center: "",
                        })
                      }
                    >
                      <i className="fas fa-times-circle me-1"></i>
                      Clear All
                    </button>
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
                      {filteredStudents.map((student, studentIndex) => {
                        const courseInfo = formatDuration(student);
                        const filteredStats =
                          getFilteredAttendanceData(student);
                        const isEligibleForAttendance =
                          student.admissionStatus === "zeroPeriod" ||
                          student.admissionStatus === "admitted";

                        return (
                          <div
                            className={`card-content transition-col mb-2`}
                            key={studentIndex}
                          >
                            {/* Enhanced Student Header Card */}
                            <div className="card border-0 shadow-sm mb-0 mt-2">
                              <div className="card-body px-3 py-3">
                                <div className="row align-items-center">
                                  {/* Student Info */}
                                  <div
                                    className={
                                      showAttendanceMode &&
                                      isEligibleForAttendance
                                        ? "col-md-3"
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
                                                student.id
                                              )}
                                              onChange={() =>
                                                toggleStudentSelection(
                                                  student.id
                                                )
                                              }
                                            />
                                          </div>
                                        )}

                                      <div className="form-check me-3">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                        />
                                      </div>
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
                                          {student.name}
                                        </h6>
                                        <small className="text-muted">
                                          {student.enrollmentNumber}
                                        </small>
                                        <div className="mt-1">
                                          {getAdmissionStatusBadge(student)}
                                          {/* Show today's attendance status if marked */}
                                          {todayAttendance[student.id]
                                            ?.isMarked && (
                                            <span
                                              className={`badge bg-${getStatusColor(
                                                todayAttendance[student.id]
                                                  ?.status
                                              )} ms-1`}
                                            >
                                              <i
                                                className={`fas ${
                                                  todayAttendance[student.id]
                                                    ?.status === "present"
                                                    ? "fa-check"
                                                    : todayAttendance[
                                                        student.id
                                                      ]?.status === "late"
                                                    ? "fa-clock"
                                                    : todayAttendance[
                                                        student.id
                                                      ]?.status === "halfDay"
                                                    ? "fa-clock-o"
                                                    : todayAttendance[
                                                        student.id
                                                      ]?.status === "shortLeave"
                                                    ? "fa-sign-out-alt"
                                                    : todayAttendance[
                                                        student.id
                                                      ]?.status === "leave"
                                                    ? "fa-calendar"
                                                    : "fa-times"
                                                } me-1`}
                                              ></i>
                                              {todayAttendance[
                                                student.id
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
                                    isEligibleForAttendance && (
                                      <div className="col-md-5">
                                        <div className="attendance-controls">
                                          <h6 className="text-dark mb-2 small fw-bold">
                                            <i className="fas fa-calendar-check me-1"></i>
                                            Mark Attendance -{" "}
                                            {new Date(
                                              selectedDate
                                            ).toLocaleDateString()}
                                          </h6>
                                          <div className="row mb-2">
                                            <div className="col-12">
                                              <div
                                                className="btn-group btn-group-sm w-100 mb-2"
                                                role="group"
                                              >
                                                <button
                                                  type="button"
                                                  className={`btn ${
                                                    todayAttendance[student.id]
                                                      ?.status === "present"
                                                      ? "btn-success"
                                                      : "btn-outline-success"
                                                  }`}
                                                  onClick={() =>
                                                    markIndividualAttendance(
                                                      student.id,
                                                      "present"
                                                    )
                                                  }
                                                >
                                                  <i className="fas fa-check"></i>{" "}
                                                  Present
                                                </button>
                                                <button
                                                  type="button"
                                                  className={`btn ${
                                                    todayAttendance[student.id]
                                                      ?.status === "late"
                                                      ? "btn-warning"
                                                      : "btn-outline-warning"
                                                  }`}
                                                  onClick={() =>
                                                    markIndividualAttendance(
                                                      student.id,
                                                      "late"
                                                    )
                                                  }
                                                >
                                                  <i className="fas fa-clock"></i>{" "}
                                                  Late
                                                </button>
                                                <button
                                                  type="button"
                                                  className={`btn ${
                                                    todayAttendance[student.id]
                                                      ?.status === "absent"
                                                      ? "btn-danger"
                                                      : "btn-outline-danger"
                                                  }`}
                                                  onClick={() =>
                                                    markIndividualAttendance(
                                                      student.id,
                                                      "absent"
                                                    )
                                                  }
                                                >
                                                  <i className="fas fa-times"></i>{" "}
                                                  Absent
                                                </button>
                                              </div>
                                              <div
                                                className="btn-group btn-group-sm w-100"
                                                role="group"
                                              >
                                                <button
                                                  type="button"
                                                  className={`btn ${
                                                    todayAttendance[student.id]
                                                      ?.status === "leave"
                                                      ? "btn-info"
                                                      : "btn-outline-info"
                                                  }`}
                                                  onClick={() =>
                                                    markIndividualAttendance(
                                                      student.id,
                                                      "leave"
                                                    )
                                                  }
                                                >
                                                  <i className="fas fa-calendar"></i>{" "}
                                                  Leave
                                                </button>
                                                <button
                                                  type="button"
                                                  className={`btn ${
                                                    todayAttendance[student.id]
                                                      ?.status === "halfDay"
                                                      ? "btn-primary"
                                                      : "btn-outline-primary"
                                                  }`}
                                                  onClick={() =>
                                                    markIndividualAttendance(
                                                      student.id,
                                                      "halfDay"
                                                    )
                                                  }
                                                >
                                                  <i className="fas fa-clock-o"></i>{" "}
                                                  Half Day
                                                </button>
                                                <button
                                                  type="button"
                                                  className={`btn ${
                                                    todayAttendance[student.id]
                                                      ?.status === "shortLeave"
                                                      ? "btn-secondary"
                                                      : "btn-outline-secondary"
                                                  }`}
                                                  onClick={() =>
                                                    markIndividualAttendance(
                                                      student.id,
                                                      "shortLeave"
                                                    )
                                                  }
                                                >
                                                  <i className="fas fa-sign-out-alt"></i>{" "}
                                                  Short Leave
                                                </button>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Time Fields */}
                                          {todayAttendance[student.id]
                                            ?.status &&
                                            todayAttendance[student.id]
                                              ?.status !== "absent" &&
                                            todayAttendance[student.id]
                                              ?.status !== "leave" && (
                                              <div className="row">
                                                <div className="col-6">
                                                  <label className="form-label small mb-1">
                                                    Time In
                                                  </label>
                                                  <input
                                                    type="time"
                                                    className="form-control form-control-sm"
                                                    value={
                                                      todayAttendance[
                                                        student.id
                                                      ]?.timeIn || ""
                                                    }
                                                    onChange={(e) =>
                                                      setTodayAttendance(
                                                        (prev) => ({
                                                          ...prev,
                                                          [student.id]: {
                                                            ...prev[student.id],
                                                            timeIn:
                                                              e.target.value,
                                                          },
                                                        })
                                                      )
                                                    }
                                                  />
                                                </div>
                                                <div className="col-6">
                                                  <label className="form-label small mb-1">
                                                    Time Out
                                                  </label>
                                                  <input
                                                    type="time"
                                                    className="form-control form-control-sm"
                                                    value={
                                                      todayAttendance[
                                                        student.id
                                                      ]?.timeOut || ""
                                                    }
                                                    onChange={(e) =>
                                                      setTodayAttendance(
                                                        (prev) => ({
                                                          ...prev,
                                                          [student.id]: {
                                                            ...prev[student.id],
                                                            timeOut:
                                                              e.target.value,
                                                          },
                                                        })
                                                      )
                                                    }
                                                  />
                                                </div>
                                              </div>
                                            )}

                                          {/* Late Minutes Display */}
                                          {todayAttendance[student.id]
                                            ?.status === "late" &&
                                            todayAttendance[student.id]
                                              ?.lateMinutes > 0 && (
                                              <div className="mt-2">
                                                <small className="text-warning">
                                                  <i className="fas fa-exclamation-triangle me-1"></i>
                                                  Late by{" "}
                                                  {Math.round(
                                                    todayAttendance[student.id]
                                                      .lateMinutes
                                                  )}{" "}
                                                  minutes
                                                </small>
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                    )}

                                  {/* Action Buttons */}
                                  <div className="col-md-6 text-end mt-2">
                                    <div className="btn-group">
                                      <div
                                        style={{
                                          position: "relative",
                                          display: "inline-block",
                                        }}
                                      >
                                        <button
                                          className="btn btn-sm btn-outline-secondary border-0"
                                          onClick={() =>
                                            togglePopup(studentIndex)
                                          }
                                          aria-label="Options"
                                        >
                                          <i className="fas fa-ellipsis-v"></i>
                                        </button>

                                        {showPopup === studentIndex && (
                                          <div
                                            onClick={() => setShowPopup(null)}
                                            style={{
                                              position: "fixed",
                                              top: 0,
                                              left: 0,
                                              width: "100vw",
                                              height: "100vh",
                                              backgroundColor: "transparent",
                                              zIndex: 999,
                                            }}
                                          ></div>
                                        )}

                                        <div
                                          style={{
                                            position: "absolute",
                                            top: "28px",
                                            right: "-100px",
                                            width: "170px",
                                            backgroundColor: "white",
                                            border: "1px solid #ddd",
                                            boxShadow:
                                              "0 2px 8px rgba(0,0,0,0.15)",
                                            borderRadius: "4px",
                                            padding: "8px 0",
                                            zIndex: 1000,
                                            transform:
                                              showPopup === studentIndex
                                                ? "translateX(-70px)"
                                                : "translateX(100%)",
                                            transition:
                                              "transform 0.3s ease-in-out",
                                            pointerEvents:
                                              showPopup === studentIndex
                                                ? "auto"
                                                : "none",
                                            display:
                                              showPopup === studentIndex
                                                ? "block"
                                                : "none",
                                          }}
                                        >
                                          <button
                                            className="dropdown-item"
                                            style={{
                                              width: "100%",
                                              padding: "8px 16px",
                                              border: "none",
                                              background: "none",
                                              textAlign: "left",
                                              cursor: "pointer",
                                              fontSize: "12px",
                                              fontWeight: "600",
                                            }}
                                            onClick={() => {
                                              setSelectedStudent(student);
                                              setShowDetailsModal(true);
                                              setShowPopup(null);
                                            }}
                                          >
                                            View Profile
                                          </button>
                                          <button
                                            className="dropdown-item"
                                            style={{
                                              width: "100%",
                                              padding: "8px 16px",
                                              border: "none",
                                              background: "none",
                                              textAlign: "left",
                                              cursor: "pointer",
                                              fontSize: "12px",
                                              fontWeight: "600",
                                            }}
                                            onClick={() => {
                                              setEditingStudent(student);
                                              setShowEditForm(true);
                                              setShowPopup(null);
                                            }}
                                          >
                                            Edit Student
                                          </button>
                                          <button
                                            className="dropdown-item"
                                            style={{
                                              width: "100%",
                                              padding: "8px 16px",
                                              border: "none",
                                              background: "none",
                                              textAlign: "left",
                                              cursor: "pointer",
                                              fontSize: "12px",
                                              fontWeight: "600",
                                            }}
                                            onClick={() => {
                                              setStudentToDelete(student);
                                              setShowDeleteModal(true);
                                              setShowPopup(null);
                                            }}
                                          >
                                            Delete Student
                                          </button>
                                        </div>
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
                                  todayAttendance[student.id]?.isMarked && (
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
                                            todayAttendance[student.id]
                                              ?.notes || ""
                                          }
                                          onChange={(e) =>
                                            setTodayAttendance((prev) => ({
                                              ...prev,
                                              [student.id]: {
                                                ...prev[student.id],
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
                                            className={`nav-link ${
                                              (studentTabsActive[
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
                                              className={`fas ${
                                                tabIndex === 0
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
                                  {/* Profile Tab */}
                                  {(studentTabsActive[studentIndex] || 0) ===
                                    0 && (
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
                                                                  className={`resume-level-dot ${
                                                                    dot <=
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

                                  {/* Job History Tab */}
                                  {(studentTabsActive[studentIndex] || 0) ===
                                    1 && (
                                    <div
                                      className="tab-pane active"
                                      id="job-history"
                                    >
                                      <div className="section-card">
                                        <div className="table-responsive">
                                          <table className="table table-hover table-bordered job-history-table">
                                            <thead className="table-light">
                                              <tr>
                                                <th>S.No</th>
                                                <th>Company Name</th>
                                                <th>Position</th>
                                                <th>Duration</th>
                                                <th>Location</th>
                                                <th>Status</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {experiences.map((job, index) => (
                                                <tr key={index}>
                                                  <td>{index + 1}</td>
                                                  <td>{job.companyName}</td>
                                                  <td>{job.jobTitle}</td>
                                                  <td>
                                                    {job.from
                                                      ? moment(job.from).format(
                                                          "MMM YYYY"
                                                        )
                                                      : "N/A"}{" "}
                                                    -
                                                    {job.currentlyWorking
                                                      ? "Present"
                                                      : job.to
                                                      ? moment(job.to).format(
                                                          "MMM YYYY"
                                                        )
                                                      : "N/A"}
                                                  </td>
                                                  <td>Remote</td>
                                                  <td>
                                                    <span className="text-success">
                                                      Completed
                                                    </span>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
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
                                          <table className="table table-hover table-bordered course-history-table">
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
                                                          className={`filter-btn ${
                                                            statusFilter ===
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
                                                          className={`filter-btn pending ${
                                                            statusFilter ===
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
                                                          className={`filter-btn verified ${
                                                            statusFilter ===
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
                                                          className={`filter-btn rejected ${
                                                            statusFilter ===
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
                                                                        className={`fas ${
                                                                          fileType ===
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
                                                                `Document ${
                                                                  index + 1
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
                                  {(studentTabsActive[studentIndex] || 0) ===
                                    4 && (
                                    <EnhancedAttendanceTab
                                      student={student}
                                      studentIndex={studentIndex}
                                    />
                                    // <div className="card">
                                    //   <div className="card-header">
                                    //     <div className="d-flex justify-content-between align-items-center">
                                    //       <h6 className="mb-0">Attendance Records</h6>
                                    //       <div className="d-flex gap-2">
                                    //         <span className="badge bg-primary">{student.attendanceStats.totalWorkingDays} Total Days</span>
                                    //         <span className="badge bg-success">{student.attendanceStats.presentDays} Present</span>
                                    //         <span className="badge bg-danger">{student.attendanceStats.absentDays} Absent</span>
                                    //       </div>
                                    //     </div>
                                    //   </div>
                                    //   <div className="card-body">
                                    //     {/* Attendance Summary Stats */}
                                    //     <div className="row mb-4 text-center">
                                    //       <div className="col-md-2">
                                    //         <div className="card bg-primary text-white">
                                    //           <div className="card-body p-2">
                                    //             <div className="h5 mb-0">{student.attendanceStats.totalWorkingDays}</div>
                                    //             <div className="small">Total Working Days</div>
                                    //           </div>
                                    //         </div>
                                    //       </div>
                                    //       <div className="col-md-2">
                                    //         <div className="card bg-success text-white">
                                    //           <div className="card-body p-2">
                                    //             <div className="h5 mb-0">{student.attendanceStats.presentDays}</div>
                                    //             <div className="small">Present Days</div>
                                    //           </div>
                                    //         </div>
                                    //       </div>
                                    //       <div className="col-md-2">
                                    //         <div className="card bg-danger text-white">
                                    //           <div className="card-body p-2">
                                    //             <div className="h5 mb-0">{student.attendanceStats.absentDays}</div>
                                    //             <div className="small">Absent Days</div>
                                    //           </div>
                                    //         </div>
                                    //       </div>
                                    //       <div className="col-md-2">
                                    //         <div className="card bg-warning text-white">
                                    //           <div className="card-body p-2">
                                    //             <div className="h5 mb-0">{student.attendanceStats.lateDays}</div>
                                    //             <div className="small">Late Days</div>
                                    //           </div>
                                    //         </div>
                                    //       </div>
                                    //       <div className="col-md-2">
                                    //         <div className="card bg-info text-white">
                                    //           <div className="card-body p-2">
                                    //             <div className="h5 mb-0">{student.attendanceStats.leaveDays}</div>
                                    //             <div className="small">Leave Days</div>
                                    //           </div>
                                    //         </div>
                                    //       </div>
                                    //       <div className="col-md-2">
                                    //         <div className="card bg-secondary text-white">
                                    //           <div className="card-body p-2">
                                    //             <div className="h5 mb-0">{student.attendanceStats.halfDays + student.attendanceStats.shortLeaveDays}</div>
                                    //             <div className="small">Half/Short Days</div>
                                    //           </div>
                                    //         </div>
                                    //       </div>
                                    //     </div>

                                    //     {/* Attendance Percentage */}
                                    //     <div className="row mb-4">
                                    //       <div className="col-md-6">
                                    //         <div className="d-flex justify-content-between small text-muted mb-1">
                                    //           <span>Overall Attendance</span>
                                    //           <span>{student.attendanceStats.attendancePercentage}%</span>
                                    //         </div>
                                    //         <div className="progress mb-2" style={{ height: '20px' }}>
                                    //           <div
                                    //             className={`progress-bar bg-${getProgressColor(student.attendanceStats.attendancePercentage)}`}
                                    //             style={{ width: `${student.attendanceStats.attendancePercentage}%` }}
                                    //           >
                                    //             {student.attendanceStats.attendancePercentage}%
                                    //           </div>
                                    //         </div>
                                    //       </div>
                                    //       <div className="col-md-6">
                                    //         <div className="d-flex justify-content-between small text-muted mb-1">
                                    //           <span>Punctuality Score</span>
                                    //           <span>{student.attendanceStats.punctualityScore}%</span>
                                    //         </div>
                                    //         <div className="progress mb-2" style={{ height: '20px' }}>
                                    //           <div
                                    //             className={`progress-bar bg-${getProgressColor(student.attendanceStats.punctualityScore)}`}
                                    //             style={{ width: `${student.attendanceStats.punctualityScore}%` }}
                                    //           >
                                    //             {student.attendanceStats.punctualityScore}%
                                    //           </div>
                                    //         </div>
                                    //       </div>
                                    //     </div>

                                    //     {/* Attendance Records Table */}
                                    //     <h6 className="mb-3">Daily Attendance Records</h6>
                                    //     <div className="table-responsive">
                                    //       <table className="table table-striped table-hover">
                                    //         <thead className="table-dark">
                                    //           <tr>
                                    //             <th>Date</th>
                                    //             <th>Day</th>
                                    //             <th>Status</th>
                                    //             <th>Time In</th>
                                    //             <th>Time Out</th>
                                    //             <th>Late Minutes</th>
                                    //             <th>Notes/Reason</th>
                                    //           </tr>
                                    //         </thead>
                                    //         <tbody>
                                    //           {student.dailyAttendance && student.dailyAttendance.length > 0 ? (
                                    //             student.dailyAttendance.map((record, idx) => (
                                    //               <tr key={idx}>
                                    //                 <td>
                                    //                   <strong>{new Date(record.date).toLocaleDateString()}</strong>
                                    //                 </td>
                                    //                 <td>
                                    //                   <small className="text-muted">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}</small>
                                    //                 </td>
                                    //                 <td>
                                    //                   <span className={`badge bg-${getStatusColor(record.status)} px-3 py-2`}>
                                    //                     <i className={`fas ${record.status === 'present' ? 'fa-check' :
                                    //                       record.status === 'late' ? 'fa-clock' :
                                    //                         record.status === 'halfDay' ? 'fa-clock-o' :
                                    //                           record.status === 'shortLeave' ? 'fa-sign-out-alt' :
                                    //                             record.status === 'leave' ? 'fa-calendar' : 'fa-times'} me-1`}></i>
                                    //                     {record.status?.toUpperCase() || 'NOT MARKED'}
                                    //                   </span>
                                    //                 </td>
                                    //                 <td>
                                    //                   <span className="fw-medium">{record.timeIn || '-'}</span>
                                    //                 </td>
                                    //                 <td>
                                    //                   <span className="fw-medium">{record.timeOut || '-'}</span>
                                    //                 </td>
                                    //                 <td>
                                    //                   {record.lateMinutes > 0 ? (
                                    //                     <span className="badge bg-warning">{record.lateMinutes} min</span>
                                    //                   ) : (
                                    //                     <span className="text-muted">0 min</span>
                                    //                   )}
                                    //                 </td>
                                    //                 <td>
                                    //                   <span className="text-muted small">{record.notes || record.reason || '-'}</span>
                                    //                 </td>
                                    //               </tr>
                                    //             ))
                                    //           ) : (
                                    //             <tr>
                                    //               <td colSpan="7" className="text-center py-4">
                                    //                 <i className="fas fa-calendar-times fs-2 text-muted mb-2"></i>
                                    //                 <p className="text-muted mb-0">No attendance records found</p>
                                    //               </td>
                                    //             </tr>
                                    //           )}
                                    //         </tbody>
                                    //       </table>
                                    //     </div>

                                    //     {/* Leave Records Table */}
                                    //     {student.leaves && student.leaves.length > 0 && (
                                    //       <>
                                    //         <h6 className="mb-3 mt-4">Leave Applications</h6>
                                    //         <div className="table-responsive">
                                    //           <table className="table table-sm">
                                    //             <thead className="table-light">
                                    //               <tr>
                                    //                 <th>Date</th>
                                    //                 <th>Type</th>
                                    //                 <th>Duration</th>
                                    //                 <th>Reason</th>
                                    //                 <th>Status</th>
                                    //                 <th>Approved By</th>
                                    //               </tr>
                                    //             </thead>
                                    //             <tbody>
                                    //               {student.leaves.map((leave, idx) => (
                                    //                 <tr key={idx}>
                                    //                   <td>{new Date(leave.date).toLocaleDateString()}</td>
                                    //                   <td>
                                    //                     <span className="badge bg-secondary">{leave.type}</span>
                                    //                   </td>
                                    //                   <td>
                                    //                     <span className={`badge ${leave.leaveType === 'full' ? 'bg-danger' :
                                    //                       leave.leaveType === 'half' ? 'bg-warning' : 'bg-info'}`}>
                                    //                       {leave.leaveType === 'full' ? '1 Day' :
                                    //                         leave.leaveType === 'half' ? '0.5 Day' :
                                    //                           `${leave.duration || 0} Hours`}
                                    //                     </span>
                                    //                   </td>
                                    //                   <td>{leave.reason}</td>
                                    //                   <td>
                                    //                     <span className={`badge bg-${leave.status === 'approved' ? 'success' :
                                    //                       leave.status === 'pending' ? 'warning' : 'danger'}`}>
                                    //                       {leave.status}
                                    //                     </span>
                                    //                   </td>
                                    //                   <td>{leave.approvedBy || '-'}</td>
                                    //                 </tr>
                                    //               ))}
                                    //             </tbody>
                                    //           </table>
                                    //         </div>
                                    //       </>
                                    //     )}
                                    //   </div>
                                    // </div>
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
          {filteredStudents.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-person fs-1 text-muted"></i>
              <h5 className="text-muted mt-3">No students found</h5>
              <p className="text-muted">
                {activeTab === "all"
                  ? "Try adjusting your search or filter criteria"
                  : `No students in the ${
                      mainTabs.find((t) => t.key === activeTab)?.label || ""
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

          .card {
            border: none;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
            border-radius: 12px;
          }

          .card:hover {
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
          }

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

          .nav-pills .nav-link:hover:not(.active) {
            background-color: #f8f9fa;
            transform: translateY(-1px);
          }

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

          .table tbody tr:hover {
            background-color: #f8f9ff;
            transform: scale(1.01);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

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

          .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

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

          .dropdown-item:hover {
            background-color: #f8f9fa;
          }

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

          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }

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

          /* Enhanced card hover effects */
          .card-hover-effect {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .card-hover-effect:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
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
    </div>
  );
};

export default Student;
