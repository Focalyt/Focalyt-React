import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Form, 
  Button, 
  Badge,
  Breadcrumb,
  Modal,
  Alert,
  Tabs,
  Tab,
  OverlayTrigger,
  Tooltip,
  Dropdown
} from 'react-bootstrap';
import { Edit, LogIn, Filter, Download, RefreshCw, Search, ChevronDown, X } from 'react-feather';
import moment from 'moment';
import qs from 'query-string';
import "./Registration.css";

const Registrations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // State variables
  const [candidates, setCandidates] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [canView, setCanView] = useState(true);
  const [flashMessage, setFlashMessage] = useState(null);
  const [sortingValue, setSortingValue] = useState('');
  const [sortingOrder, setSortingOrder] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    id: '',
    remarks: '',
    assignDate: '',
    url: ''
  });

  // Filter state
  const [filterData, setFilterData] = useState({
    name: '',
    FromDate: '',
    ToDate: '',
    courseType: '',
    status: 'true',
    sector: '',
    center: '',
    registrationStatus: '',
    courseId: '',
    leadStatus: '',
    demoStatus: '',
    centerStatus: '',
    dateRange: 'all'
  });

  // Reference for date filter dropdown
  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Get query params from URL
  useEffect(() => {
    const queryParams = qs.parse(location.search);
    setCurrentPage(parseInt(queryParams.page) || 1);
    
    // Set filter data from query params
    setFilterData(prev => ({
      ...prev,
      name: queryParams.name || '',
      FromDate: queryParams.FromDate || '',
      ToDate: queryParams.ToDate || '',
      courseType: queryParams.courseType || '',
      status: queryParams.status || 'true',
      sector: queryParams.sector || '',
      center: queryParams.center || '',
      registrationStatus: queryParams.registrationStatus || '',
      courseId: queryParams.courseId || '',
      leadStatus: queryParams.leadStatus || '',
      demoStatus: queryParams.demoStatus || '',
      centerStatus: queryParams.centerStatus || '',
      dateRange: queryParams.dateRange || 'all'
    }));

    // Set sorting params
    setSortingValue(queryParams.value || '');
    setSortingOrder(parseInt(queryParams.order) || 1);

    // Set active tab from URL if available
    if (queryParams.tab) {
      setActiveTab(queryParams.tab);
    }

    // Show advanced filters if any of the advanced filter fields are populated
    if (
      queryParams.sector || 
      queryParams.center || 
      queryParams.registrationStatus || 
      queryParams.courseId || 
      queryParams.leadStatus || 
      queryParams.demoStatus || 
      queryParams.centerStatus
    ) {
      setShowAdvancedFilters(true);
    }

    // Calculate selected filters for UI display
    const newSelectedFilters = [];
    for (const [key, value] of Object.entries(queryParams)) {
      if (
        value && 
        key !== 'page' && 
        key !== 'status' && 
        key !== 'value' && 
        key !== 'order' && 
        key !== 'tab'
      ) {
        newSelectedFilters.push({ key, value });
      }
    }
    setSelectedFilters(newSelectedFilters);

    // Fetch data
    fetchRegistrations(queryParams);
    fetchFilterOptions();
  }, [location.search]);

  // Fetch dropdown options for filters
  const fetchFilterOptions = async () => {
    try {
      const headers = {
        'x-auth': localStorage.getItem('token')
      };

      // Fetch sectors
      const sectorsResponse = await axios.get(`${backendUrl}/api/sectors`, { headers });
      if (sectorsResponse.data) {
        setSectors(sectorsResponse.data);
      }

      // Fetch centers
      const centersResponse = await axios.get(`${backendUrl}/api/centers`, { headers });
      if (centersResponse.data) {
        setCenters(centersResponse.data);
      }

      // Fetch courses
      const coursesResponse = await axios.get(`${backendUrl}/api/courses`, { headers });
      if (coursesResponse.data) {
        setCourses(coursesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Fetch registrations data
  const fetchRegistrations = async (params) => {
    setLoading(true);
    try {
      const headers = {
        'x-auth': localStorage.getItem('token')
      };

      // Build query string from params
      const queryString = qs.stringify(params);
      const response = await axios.get(`${backendUrl}/admin/courses/registrations?${queryString}`, { headers });

      if (response.data) {
        setCandidates(response.data.candidates || []);
        setTotalPages(response.data.totalPages || 1);
        setCanView(response.data.view !== undefined ? response.data.view : true);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setFlashMessage({
        type: 'danger',
        message: 'Failed to fetch registrations'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle input change for filter
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilterData(prev => ({ ...prev, [name]: value }));

    // If changing date range to custom, show advanced filters
    if (name === 'dateRange' && value === 'custom') {
      setShowAdvancedFilters(true);
    }

    // Auto-calculate date range based on selection
    if (name === 'dateRange' && value !== 'custom' && value !== 'all') {
      const { fromDate, toDate } = calculateDateRange(value);
      setFilterData(prev => ({ 
        ...prev, 
        [name]: value,
        FromDate: fromDate,
        ToDate: toDate
      }));
    }

    // Clear custom dates if date range is not custom
    if (name === 'dateRange' && value !== 'custom') {
      setFilterData(prev => ({ 
        ...prev, 
        [name]: value,
        FromDate: value === 'all' ? '' : prev.FromDate,
        ToDate: value === 'all' ? '' : prev.ToDate
      }));
    }
  };

  // Calculate date range based on selection
  const calculateDateRange = (range) => {
    let fromDate = '';
    let toDate = '';
    const today = moment().format('YYYY-MM-DD');

    switch (range) {
      case 'today':
        fromDate = today;
        toDate = today;
        break;
      case 'yesterday':
        fromDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
        toDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
        break;
      case 'thisWeek':
        fromDate = moment().startOf('week').format('YYYY-MM-DD');
        toDate = today;
        break;
      case 'lastWeek':
        fromDate = moment().subtract(1, 'weeks').startOf('week').format('YYYY-MM-DD');
        toDate = moment().subtract(1, 'weeks').endOf('week').format('YYYY-MM-DD');
        break;
      case 'thisMonth':
        fromDate = moment().startOf('month').format('YYYY-MM-DD');
        toDate = today;
        break;
      case 'lastMonth':
        fromDate = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
        toDate = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
        break;
      default:
        break;
    }

    return { fromDate, toDate };
  };

  // Validate date filters
  const validateFilters = () => {
    if ((filterData.FromDate && !filterData.ToDate) || (!filterData.FromDate && filterData.ToDate)) {
      return false;
    }
    return true;
  };

  // Handle filter form submit
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    
    if (!validateFilters()) {
      setFlashMessage({
        type: 'danger',
        message: 'Please provide both From Date and To Date, or leave both empty'
      });
      return;
    }

    // Build query string for navigation
    const queryParams = { tab: activeTab };
    
    Object.keys(filterData).forEach(key => {
      if (filterData[key]) {
        queryParams[key] = filterData[key];
      }
    });

    navigate(`/admin/courses/registrations?${qs.stringify(queryParams)}`);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    navigate(`/admin/courses/registrations?tab=${activeTab}`);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Create query parameters based on current filters but with new tab
    const queryParams = qs.parse(location.search);
    queryParams.tab = tab;
    
    // Define status based on tab
    switch (tab) {
      case 'unpaid':
        queryParams.registrationStatus = 'Unpaid';
        break;
      case 'paid':
        queryParams.registrationStatus = 'Paid';
        break;
      case 'hot':
        queryParams.leadStatus = 'Hot';
        break;
      case 'warm':
        queryParams.leadStatus = 'Warm';
        break;
      case 'cold':
        queryParams.leadStatus = 'Cold';
        break;
      default:
        delete queryParams.registrationStatus;
        delete queryParams.leadStatus;
    }
    
    navigate(`/admin/courses/registrations?${qs.stringify(queryParams)}`);
  };

  // Handle pagination click
  const handlePageClick = (page) => {
    const queryParams = qs.parse(location.search);
    queryParams.page = page;
    navigate(`/admin/courses/registrations?${qs.stringify(queryParams)}`);
  };

  // Handle sorting
  const handleSorting = (value) => {
    const newOrder = sortingValue === value ? -sortingOrder : 1;
    
    const queryParams = qs.parse(location.search);
    queryParams.value = value;
    queryParams.order = newOrder;
    
    navigate(`/admin/courses/registrations?${qs.stringify(queryParams)}`);
  };

  // Handle remove filter
  const handleRemoveFilter = (key) => {
    const queryParams = qs.parse(location.search);
    delete queryParams[key];
    navigate(`/admin/courses/registrations?${qs.stringify(queryParams)}`);
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    navigate(`/admin/courses/registrations?tab=${activeTab}`);
  };

  // Handle export data
  const handleExportData = () => {
    // Implement CSV export functionality here
    const csvContent = "data:text/csv;charset=utf-8," 
      + "DATE,CANDIDATE NAME,MOBILE NO.,EMAIL,DOCUMENT STATUS,LEAD STATUS,DEMO STATUS,CENTER STATUS,COURSE,REG FEE,REG STATUS,SECTOR,COURSE FEE TYPE,REGISTERED BY\n"
      + candidates.map(candidate => {
          return [
            candidate.createdAt ? moment(candidate.createdAt).utcOffset("+05:30").format('MMM DD YYYY hh:mm A') : "N/A",
            candidate.name || "N/A",
            candidate.mobile || "N/A",
            candidate.email || "N/A",
            candidate.docProgress?.percent ? `${candidate.docProgress.percent}%` : "NDR",
            candidate.leadStatus || "N/A",
            candidate.demoStatus || "N/A",
            candidate.centerStatus || "N/A",
            candidate.courseName || "N/A",
            candidate.registrationCharges || "N/A",
            candidate.registrationFee || "Unpaid",
            candidate.sector || "N/A",
            candidate.courseFeeType || "Free/Paid",
            candidate.registeredByName || "N/A"
          ].join(",");
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `registrations_${moment().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle action click (Due/Assigned)
  const handleActionClick = (id, remarks, assignDate, url) => {
    const formattedDate = assignDate ? 
      moment(assignDate).format('YYYY-MM-DD') : 
      moment().format('YYYY-MM-DD');

    setModalData({
      id,
      remarks: remarks || '',
      assignDate: formattedDate,
      url: url || ''
    });

    setShowModal(true);
  };

  // Handle assign course
  const handleAssignCourse = async () => {
    try {
      const updateCourse = {
        url: modalData.url,
        remarks: modalData.remarks,
        courseStatus: 0,
        assignDate: new Date(modalData.assignDate).toISOString()
      };

      await axios.put(
        `${backendUrl}/admin/courses/assignCourses/${modalData.id}`, 
        updateCourse,
        {
          headers: {
            'x-auth': localStorage.getItem('token')
          }
        }
      );

      setShowModal(false);
      
      // Refresh data
      fetchRegistrations(qs.parse(location.search));
      
      setFlashMessage({
        type: 'success',
        message: 'Course assigned successfully'
      });
    } catch (error) {
      console.error('Error assigning course:', error);
      setFlashMessage({
        type: 'danger',
        message: 'An error occurred while assigning the course'
      });
    }
  };

  // Handle lead status update
  const handleLeadStatusUpdate = async (appliedId, status, type) => {
    try {
      await axios.post(
        `${backendUrl}/admin/courses/leadStatus`,
        { appliedId, status, type },
        {
          headers: {
            'x-auth': localStorage.getItem('token')
          }
        }
      );
      
      // Refresh data
      fetchRegistrations(qs.parse(location.search));
      
      setFlashMessage({
        type: 'success',
        message: `${type} status updated successfully`
      });
    } catch (error) {
      console.error(`Error updating ${type} status:`, error);
      setFlashMessage({
        type: 'danger',
        message: `An error occurred while updating ${type} status`
      });
    }
  };

  // Handle login as candidate
  const handleLoginAs = async (mobile) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/loginAsCandidate`,
        { mobile, module: 'candidate' },
        {
          headers: {
            'x-auth': localStorage.getItem('token')
          }
        }
      );

      if (response.data && response.data.role === 3) {
        localStorage.setItem("candidate", response.data.name);
        localStorage.setItem("token", response.data.token);
        window.location.href = "/candidate/dashboard";
      }
    } catch (error) {
      console.error('Error logging in as candidate:', error);
      setFlashMessage({
        type: 'danger',
        message: 'An error occurred while logging in as candidate'
      });
    }
  };

  // Get tab count (can be implemented with backend API)
  const getTabCount = (tabName) => {
    if (!candidates) return 0;
    
    switch (tabName) {
      case 'unpaid':
        return candidates.filter(c => c.registrationFee === 'Unpaid').length;
      case 'paid':
        return candidates.filter(c => c.registrationFee === 'Paid').length;
      case 'hot':
        return candidates.filter(c => c.leadStatus === 'Hot').length;
      case 'warm':
        return candidates.filter(c => c.leadStatus === 'Warm').length;
      case 'cold':
        return candidates.filter(c => c.leadStatus === 'Cold').length;
      default:
        return candidates.length;
    }
  };

  // Render pagination
  const renderPagination = () => {
    if (!totalPages || totalPages <= 1) return null;

    let first = 1;
    let last = totalPages > 4 ? 4 : totalPages;

    if (totalPages > 4 && currentPage >= 2) {
      first = currentPage - 1;
      last = currentPage + 1;
      if (last > totalPages) last = totalPages;
    }

    return (
      <ul className="pagination justify-content-end ml-2 mb-2">
        {first > 1 && (
          <li className="page-item">
            <Button 
              variant="link" 
              className="page-link" 
              onClick={() => handlePageClick(1)}
            >
              First
            </Button>
          </li>
        )}
        
        {Array.from({ length: last - first + 1 }, (_, i) => i + first).map(page => (
          <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
            <Button 
              variant={page === currentPage ? 'primary' : 'link'} 
              className="page-link" 
              onClick={() => handlePageClick(page)}
              disabled={page === currentPage}
            >
              {page}
            </Button>
          </li>
        ))}
        
        {totalPages > last && (
          <>
            <li className="page-item">
              <Button 
                variant="link" 
                className="page-link" 
                onClick={() => handlePageClick(last + 1)}
              >
                ...
              </Button>
            </li>
            <li className="page-item">
              <Button 
                variant="link" 
                className="page-link" 
                onClick={() => handlePageClick(totalPages)}
              >
                Last
              </Button>
            </li>
          </>
        )}
      </ul>
    );
  };

  return (
    <div className="">
      {/* Header */}
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-12 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-9">
              <h3 className="content-header-title float-left mb-0">Registrations</h3>
              <Breadcrumb>
                <Breadcrumb.Item href="/admin">Home</Breadcrumb.Item>
                <Breadcrumb.Item active>Registrations</Breadcrumb.Item>
              </Breadcrumb>
            </div>
            <div className="col-3 text-right">
              <Button 
                variant="outline-primary" 
                className="mr-2" 
                onClick={handleExportData}
              >
                <Download size={14} className="mr-1" /> Export
              </Button>
              <Button 
                variant={showAdvancedFilters ? "primary" : "outline-primary"} 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter size={14} className="mr-1" /> {showAdvancedFilters ? "Hide Filters" : "Advanced Filters"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="content-body">
        {/* Flash Message */}
        {flashMessage && (
          <Alert 
            variant={flashMessage.type} 
            onClose={() => setFlashMessage(null)} 
            dismissible
          >
            {flashMessage.message}
          </Alert>
        )}
        
        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onSelect={handleTabChange}
          className="mb-3 registration-tabs"
        >
          <Tab 
            eventKey="all" 
            title={
              <span>
                All <Badge variant="light" className="ml-1">{getTabCount('all')}</Badge>
              </span>
            }
          />
          <Tab 
            eventKey="unpaid" 
            title={
              <span>
                Unpaid <Badge variant="danger" className="ml-1">{getTabCount('unpaid')}</Badge>
              </span>
            }
          />
          <Tab 
            eventKey="paid" 
            title={
              <span>
                Paid <Badge variant="success" className="ml-1">{getTabCount('paid')}</Badge>
              </span>
            }
          />
          <Tab 
            eventKey="hot" 
            title={
              <span>
                Hot Leads <Badge variant="danger" className="ml-1">{getTabCount('hot')}</Badge>
              </span>
            }
          />
          <Tab 
            eventKey="warm" 
            title={
              <span>
                Warm Leads <Badge variant="warning" className="ml-1">{getTabCount('warm')}</Badge>
              </span>
            }
          />
          <Tab 
            eventKey="cold" 
            title={
              <span>
                Cold Leads <Badge variant="info" className="ml-1">{getTabCount('cold')}</Badge>
              </span>
            }
          />
        </Tabs>
        
        {/* Applied Filters */}
        {selectedFilters.length > 0 && (
          <div className="applied-filters mb-3">
            <div className="d-flex align-items-center">
              <strong className="mr-2">Applied Filters:</strong>
              {selectedFilters.map((filter, index) => (
                <Badge 
                  key={index} 
                  variant="light" 
                  className="mr-2 py-2 px-3 d-flex align-items-center"
                >
                  <span>{filter.key === 'courseId' ? 'Course' : 
                        filter.key === 'FromDate' ? 'From Date' : 
                        filter.key === 'ToDate' ? 'To Date' : 
                        filter.key.charAt(0).toUpperCase() + filter.key.slice(1)}: {filter.value}</span>
                  <X 
                    size={14} 
                    className="ml-2 cursor-pointer" 
                    onClick={() => handleRemoveFilter(filter.key)} 
                  />
                </Badge>
              ))}
              <Button 
                variant="link" 
                className="text-danger p-0 ml-2" 
                onClick={handleClearAllFilters}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}
        
        <section className="list-view">
          <Row>
            <Col xs={12} className="rounded equal-height-2 coloumn-2">
              <Card>
                <Card.Body>
                  <Row>
                    <Col xs={12}>
                      <Row className="mb-3">
                        <Col xl={12} lg={12} className="px-3">
                          <Form onSubmit={handleFilterSubmit} id="filterForm">
                            <Row className="align-items-end">
                              {/* Basic Filters - Always visible */}
                              <Col xl={3} className="mb-2">
                                <Form.Group>
                                  <Form.Label>Name/Mobile/Email</Form.Label>
                                  <div className="position-relative">
                                    <Form.Control
                                      type="text"
                                      name="name"
                                      value={filterData.name}
                                      onChange={handleInputChange}
                                      placeholder="Search..."
                                      maxLength={25}
                                    />
                                    <Search size={16} className="position-absolute search-icon" />
                                  </div>
                                </Form.Group>
                              </Col>
                              
                              <Col xl={3} className="mb-2">
                                <Form.Group>
                                  <Form.Label>Date Range</Form.Label>
                                  <Form.Control
                                    as="select"
                                    name="dateRange"
                                    value={filterData.dateRange}
                                    onChange={handleInputChange}
                                  >
                                    {dateRanges.map(range => (
                                      <option key={range.value} value={range.value}>
                                        {range.label}
                                      </option>
                                    ))}
                                  </Form.Control>
                                </Form.Group>
                              </Col>
                              
                              <Col xl={3} className="mb-2">
                                <div className="d-flex">
                                  <Button
                                    variant="success"
                                    type="submit"
                                    className="waves-effect waves-light text-white mr-2"
                                  >
                                    Apply Filters
                                  </Button>
                                  <Button
                                    variant="outline-secondary"
                                    className="waves-effect waves-light"
                                    onClick={handleResetFilters}
                                  >
                                    Reset
                                  </Button>
                                </div>
                              </Col>
                              
                              <Col xl={3} className="mb-2 text-right">
                                <Button 
                                  variant={showAdvancedFilters ? "primary" : "outline-primary"} 
                                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                  className="d-xl-none d-lg-none"
                                >
                                  <Filter size={14} className="mr-1" /> 
                                  {showAdvancedFilters ? "Hide Filters" : "Advanced Filters"}
                                </Button>
                              </Col>
                            </Row>

                            {/* Advanced Filters - Togglable */}
                            {showAdvancedFilters && (
                              <Row className="mt-3 advanced-filters-container">
                                <Col xl={12}>
                                  <Card className="bg-light border-0">
                                    <Card.Body>
                                      <Row>
                                        {filterData.dateRange === 'custom' && (
                                          <>
                                            <Col xl={3} lg={4} md={6} className="mb-2">
                                              <Form.Group>
                                                <Form.Label>From Date</Form.Label>
                                                <Form.Control
                                                  type="date"
                                                  name="FromDate"
                                                  value={filterData.FromDate}
                                                  onChange={handleInputChange}
                                                  isInvalid={!filterData.FromDate && filterData.ToDate}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                  From date is required when To date is set
                                                </Form.Control.Feedback>
                                              </Form.Group>
                                            </Col>
                                            <Col xl={3} lg={4} md={6} className="mb-2">
                                              <Form.Group>
                                                <Form.Label>To Date</Form.Label>
                                                <Form.Control
                                                  type="date"
                                                  name="ToDate"
                                                  value={filterData.ToDate}
                                                  onChange={handleInputChange}
                                                  isInvalid={filterData.FromDate && !filterData.ToDate}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                  To date is required when From date is set
                                                </Form.Control.Feedback>
                                              </Form.Group>
                                            </Col>
                                          </>
                                        )}
                                        
                                        <Col xl={3} lg={4} md={6} className="mb-2">
                                          <Form.Group>
                                            <Form.Label>Sector</Form.Label>
                                            <Form.Control
                                              as="select"
                                              name="sector"
                                              value={filterData.sector}
                                              onChange={handleInputChange}
                                            >
                                              <option value="">All Sectors</option>
                                              {sectors.map(sector => (
                                                <option key={sector._id} value={sector._id}>
                                                  {sector.name}
                                                </option>
                                              ))}
                                            </Form.Control>
                                          </Form.Group>
                                        </Col>
                                        
                                        <Col xl={3} lg={4} md={6} className="mb-2">
                                          <Form.Group>
                                            <Form.Label>Training Center</Form.Label>
                                            <Form.Control
                                              as="select"
                                              name="center"
                                              value={filterData.center}
                                              onChange={handleInputChange}
                                            >
                                              <option value="">All Centers</option>
                                              {centers.map(center => (
                                                <option key={center._id} value={center._id}>
                                                  {center.name}
                                                </option>
                                              ))}
                                            </Form.Control>
                                          </Form.Group>
                                        </Col>
                                        
                                        <Col xl={3} lg={4} md={6} className="mb-2">
                                          <Form.Group>
                                            <Form.Label>Course</Form.Label>
                                            <Form.Control
                                              as="select"
                                              name="courseId"
                                              value={filterData.courseId}
                                              onChange={handleInputChange}
                                            >
                                              <option value="">All Courses</option>
                                              {courses.map(course => (
                                                <option key={course._id} value={course._id}>
                                                  {course.name}
                                                </option>
                                              ))}
                                            </Form.Control>
                                          </Form.Group>
                                        </Col>
                                        
                                        <Col xl={3} lg={4} md={6} className="mb-2">
                                          <Form.Group>
                                            <Form.Label>Course Fee Type</Form.Label>
                                            <Form.Control
                                              as="select"
                                              name="courseType"
                                              value={filterData.courseType}
                                              onChange={handleInputChange}
                                            >
                                              <option value="">All Types</option>
                                              <option value="Free">Free</option>
                                              <option value="Paid">Paid</option>
                                            </Form.Control>
                                          </Form.Group>
                                        </Col>
                                        
                                        <Col xl={3} lg={4} md={6} className="mb-2">
                                          <Form.Group>
                                            <Form.Label>Registration Status</Form.Label>
                                            <Form.Control
                                              as="select"
                                              name="registrationStatus"
                                              value={filterData.registrationStatus}
                                              onChange={handleInputChange}
                                            >
                                              <option value="">All Statuses</option>
                                              <option value="Paid">Paid</option>
                                              <option value="Unpaid">Unpaid</option>
                                            </Form.Control>
                                          </Form.Group>
                                        </Col>
                                        
                                        <Col xl={3} lg={4} md={6} className="mb-2">
                                          <Form.Group>
                                            <Form.Label>Lead Status</Form.Label>
                                            <Form.Control
                                              as="select"
                                              name="leadStatus"
                                              value={filterData.leadStatus}
                                              onChange={handleInputChange}
                                            >
                                              <option value="">All Lead Statuses</option>
                                              <option value="Hot">Hot</option>
                                              <option value="Warm">Warm</option>
                                              <option value="Cold">Cold</option>
                                            </Form.Control>
                                          </Form.Group>
                                        </Col>
                                        
                                        <Col xl={3} lg={4} md={6} className="mb-2">
                                          <Form.Group>
                                            <Form.Label>Demo Status</Form.Label>
                                            <Form.Control
                                              as="select"
                                              name="demoStatus"
                                              value={filterData.demoStatus}
                                              onChange={handleInputChange}
                                            >
                                              <option value="">All Demo Statuses</option>
                                              <option value="Demo Scheduled">Demo Scheduled</option>
                                              <option value="Demo Pending">Demo Pending</option>
                                              <option value="Demo Done">Demo Done</option>
                                            </Form.Control>
                                          </Form.Group>
                                        </Col>
                                        
                                        <Col xl={3} lg={4} md={6} className="mb-2">
                                          <Form.Group>
                                            <Form.Label>Center Status</Form.Label>
                                            <Form.Control
                                              as="select"
                                              name="centerStatus"
                                              value={filterData.centerStatus}
                                              onChange={handleInputChange}
                                            >
                                              <option value="">All Center Statuses</option>
                                              <option value="Add Center">Add Center</option>
                                              <option value="Rejected">Rejected</option>
                                              <option value="Drop Out">Drop Out</option>
                                            </Form.Control>
                                          </Form.Group>
                                        </Col>
                                      </Row>
                                    </Card.Body>
                                  </Card>
                                </Col>
                              </Row>
                            )}
                          </Form>
                        </Col>
                      </Row>

                      {/* Loading Indicator */}
                      {loading && (
                        <div className="text-center my-3">
                          <div className="spinner-border text-primary" role="status">
                            <span className="sr-only">Loading...</span>
                          </div>
                          <p className="mt-2">Loading registrations...</p>
                        </div>
                      )}

                      {/* Table */}
                      {!loading && (
                        <div className="table-responsive">
                          {candidates && candidates.length > 0 ? (
                            <Table id="tblexportData" className="table table-hover-animation mb-0 table-hover" style={{ width: '100%' }}>
                              <thead>
                                <tr>
                                  <th 
                                    className="three column wide" 
                                    style={{ width: '18%', cursor: 'pointer' }}
                                    onClick={() => handleSorting('createdAt')}
                                  >
                                    DATE <i 
                                      className={`fa-solid fa-arrow-${sortingValue === 'createdAt' ? (sortingOrder === 1 ? 'down' : 'up') : 'down'} success`} 
                                    />
                                  </th>
                                  <th 
                                    className="three column wide candidate-wrap" 
                                    style={{ width: '19%', whiteSpace: 'nowrap' }}
                                    onClick={() => handleSorting('name')}
                                  >
                                    CANDIDATE NAME
                                  </th>
                                  <th className="one column wide" style={{ width: '15%', whiteSpace: 'nowrap' }}>MOBILE NO.</th>
                                  <th className="one column wide" style={{ width: '15%' }}>Email</th>
                                  <th className="one column wide" style={{ width: '15%', whiteSpace: 'nowrap' }}>Document Status</th>
                                  <th className="one column wide" style={{ width: '15%', whiteSpace: 'nowrap' }}>Lead Status</th>
                                  <th className="one column wide" style={{ width: '15%', whiteSpace: 'nowrap' }}>Demo Status</th>
                                  <th className="one column wide" style={{ width: '15%', whiteSpace: 'nowrap' }}>Center Status</th>
                                  <th 
                                    className="one column wide" 
                                    style={{ width: '7%', cursor: 'pointer' }}
                                    onClick={() => handleSorting('courseName')}
                                  >
                                    Course <i 
                                      className={sortingValue === 'courseName' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
                                    />
                                  </th>
                                  <th 
                                    className="one column wide" 
                                    style={{ width: '7%', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    onClick={() => handleSorting('registrationCharges')}
                                  >
                                    Reg Fee <i 
                                      className={sortingValue === 'registrationCharges' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
                                    />
                                  </th>
                                  <th className="one column wide" style={{ width: '7%', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    Reg Status <i className="" />
                                  </th>
                                  <th 
                                    className="one column wide" 
                                    style={{ width: '7%', cursor: 'pointer' }}
                                    onClick={() => handleSorting('sector')}
                                  >
                                    Sector <i 
                                      className={sortingValue === 'sector' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
                                    />
                                  </th>
                                  <th className="one column wide" style={{ width: '10%', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    Course Fee Type
                                  </th>
                                  <th className="one column wide" style={{ width: '10%', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    Registered By
                                  </th>
                                  
                                  {!canView && (
                                    <th className="one column wide" style={{ width: '10%' }}>Action</th>
                                  )}
                                  <th className="one column wide" style={{ width: '10%', whiteSpace: 'nowrap' }}>View Docs</th>
                                  <th className="one column wide" style={{ width: '10%' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {candidates.map((candidate, i) => (
                                  <tr key={candidate._id}>
                                    <td className="text-capitalize">
                                      {candidate.createdAt 
                                        ? moment(candidate.createdAt).utcOffset("+05:30").format('MMM DD YYYY hh:mm A')
                                        : "N/A"
                                      }
                                    </td>
                                    <td className="text-capitalize candid-wrap">
                                      {candidate.name || "N/A"}
                                    </td>
                                    <td className="text-capitalize">
                                      {candidate.mobile || "N/A"}
                                    </td>
                                    <td className="text-capitalize">
                                      {candidate.email || "N/A"}
                                    </td>
                                    <td className="text-capitalize">
                                      {candidate.docProgress && candidate.docProgress.totalRequired && candidate.docProgress.totalRequired > 0 ? (
                                        <OverlayTrigger
                                          placement="top"
                                          overlay={<Tooltip>{candidate.docProgress.percent}% complete</Tooltip>}
                                        >
                                          <div 
                                            className="circular-progress-container" 
                                            data-percent={candidate.docProgress.percent}
                                          >
                                            <svg width="40" height="40">
                                              <circle className="circle-bg" cx="20" cy="20" r="16"></circle>
                                              <circle 
                                                className="circle-progress" 
                                                cx="20" 
                                                cy="20" 
                                                r="16"
                                                style={{
                                                  strokeDasharray: `${2 * Math.PI * 16}`,
                                                  strokeDashoffset: `${2 * Math.PI * 16 - (candidate.docProgress.percent / 100) * 2 * Math.PI * 16}`
                                                }}
                                              ></circle>
                                            </svg>
                                            <div className="progress-text">
                                              {candidate.docProgress.percent}%
                                            </div>
                                          </div>
                                        </OverlayTrigger>
                                      ) : (
                                        "NDR"
                                      )}
                                    </td>
                                    <td className="text-capitalize">
                                      <Form.Control 
                                        as="select"
                                        className="leadsSelect"
                                        onChange={(e) => handleLeadStatusUpdate(candidate._id, e.target.value, 'lead')}
                                        value={candidate.leadStatus || ''}
                                      >
                                        <option value="">Select</option>
                                        <option value="Hot">Hot</option>
                                        <option value="Warm">Warm</option>
                                        <option value="Cold">Cold</option>
                                      </Form.Control>
                                    </td>
                                    <td className="text-capitalize">
                                      <Form.Control 
                                        as="select"
                                        className="leadsSelect"
                                        value={candidate.demoStatus || ''}
                                        onChange={(e) => handleLeadStatusUpdate(candidate._id, e.target.value, 'demo')}
                                      >
                                        <option value="">Select</option>
                                        <option value="Demo Scheduled">Demo Scheduled</option>
                                        <option value="Demo Pending">Demo Pending</option>
                                        <option value="Demo Done">Demo Done</option>
                                      </Form.Control>
                                    </td>
                                    <td className="text-capitalize">
                                      <Form.Control 
                                        as="select"
                                        className="leadsSelect"
                                        value={candidate.centerStatus || ''}
                                        onChange={(e) => handleLeadStatusUpdate(candidate._id, e.target.value, 'center')}
                                      >
                                        <option value="">Select</option>
                                        <option value="Add Center">Add Center</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Drop Out">Drop Out</option>
                                      </Form.Control>
                                    </td>
                                    <td className="text-capitalize">
                                      {candidate.courseName || "N/A"}
                                    </td>
                                    <td className="text-capitalize">
                                      {candidate.registrationCharges || "N/A"}
                                    </td>
                                    <td className="text-capitalize">
                                      <Badge variant={candidate.registrationFee ? "success" : "danger"}>
                                        {candidate.registrationFee || "Unpaid"}
                                      </Badge>
                                    </td>
                                    <td className="text-capitalize">
                                      {candidate.sector || "N/A"}
                                    </td>
                                    <td className="text-capitalize">
                                      <Badge variant={candidate.courseFeeType === "Free" ? "info" : "warning"}>
                                        {candidate.courseFeeType || "N/A"}
                                      </Badge>
                                    </td>
                                    <td className="text-capitalize">
                                      {candidate.registeredByName || "N/A"}
                                    </td>
                                    
                                    {!canView && (
                                      <td className="text-capitalize">
                                        <Button
                                          variant={candidate.courseStatus === 0 ? "danger" : "success"}
                                          className="waves-effect waves-light text-white d-inline btn-sm"
                                          onClick={() => handleActionClick(
                                            candidate._id, 
                                            candidate.remarks, 
                                            candidate.assignDate, 
                                            candidate.url
                                          )}
                                        >
                                          {candidate.courseStatus === 0 ? "DUE" : "Assigned"}
                                        </Button>
                                      </td>
                                    )}
                                    
                                    <td className="text-capitalize">
                                      <Link
                                        to={`/admin/courses/${candidate.courseId}/${candidate.candidateId}/docsview`}
                                        className="btn btn-danger waves-effect waves-light text-white d-inline btn-sm"
                                        style={{ padding: '8px' }}
                                      >
                                        View Docs
                                      </Link>
                                    </td>
                                    
                                    <td className="text-capitalize">
                                      <Dropdown>
                                        <Dropdown.Toggle variant="link" id={`dropdown-${candidate._id}`} className="p-0">
                                          <Button
                                            variant="link"
                                            className="p-0"
                                          >
                                            <i className="fa fa-ellipsis-v"></i>
                                          </Button>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                          <Dropdown.Item onClick={() => handleLoginAs(candidate.mobile)}>
                                            <LogIn size={14} className="mr-2" /> Login as Candidate
                                          </Dropdown.Item>
                                          <Dropdown.Item>
                                            <Edit size={14} className="mr-2" /> Edit Profile
                                          </Dropdown.Item>
                                          <Dropdown.Item onClick={() => handleActionClick(
                                              candidate._id, 
                                              candidate.remarks, 
                                              candidate.assignDate, 
                                              candidate.url
                                            )}>
                                            {candidate.courseStatus === 0 ? "Mark as Due" : "Assign Course"}
                                          </Dropdown.Item>
                                        </Dropdown.Menu>
                                      </Dropdown>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          ) : (
                            <>
                              <Table id="tblexportData" className="table table-hover-animation mb-0 table-hover" style={{ width: '100%' }}>
                                <thead>
                                  <tr>
                                    <th 
                                      className="three column wide" 
                                      style={{ width: '18%', cursor: 'pointer' }}
                                      onClick={() => handleSorting('createdAt')}
                                    >
                                      DATE <i 
                                        className={`fa-solid fa-arrow-${sortingValue === 'createdAt' ? (sortingOrder === 1 ? 'down' : 'up') : 'down'} success`} 
                                      />
                                    </th>
                                    <th 
                                      className="three column wide candidate-wrap" 
                                      style={{ width: '19%', whiteSpace: 'nowrap' }}
                                      onClick={() => handleSorting('name')}
                                    >
                                      CANDIDATE NAME
                                    </th>
                                    <th className="one column wide" style={{ width: '15%', whiteSpace: 'nowrap' }}>MOBILE NO.</th>
                                    <th className="one column wide" style={{ width: '15%' }}>Email</th>
                                    <th className="one column wide" style={{ width: '15%', whiteSpace: 'nowrap' }}>Document Status</th>
                                    <th className="one column wide" style={{ width: '15%', whiteSpace: 'nowrap' }}>Lead Status</th>
                                    <th className="one column wide" style={{ width: '15%', whiteSpace: 'nowrap' }}>Demo Status</th>
                                    <th className="one column wide" style={{ width: '15%', whiteSpace: 'nowrap' }}>Center Status</th>
                                    <th 
                                      className="one column wide" 
                                      style={{ width: '7%', cursor: 'pointer' }}
                                      onClick={() => handleSorting('courseName')}
                                    >
                                      Course <i 
                                        className={sortingValue === 'courseName' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
                                      />
                                    </th>
                                    <th 
                                      className="one column wide" 
                                      style={{ width: '7%', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                      onClick={() => handleSorting('registrationCharges')}
                                    >
                                      Reg Fee <i 
                                        className={sortingValue === 'registrationCharges' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
                                      />
                                    </th>
                                    <th className="one column wide" style={{ width: '7%', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                      Reg Status <i className="" />
                                    </th>
                                    <th 
                                      className="one column wide" 
                                      style={{ width: '7%', cursor: 'pointer' }}
                                      onClick={() => handleSorting('sector')}
                                    >
                                      Sector <i 
                                        className={sortingValue === 'sector' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
                                      />
                                    </th>
                                    <th className="one column wide" style={{ width: '10%', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                      Course Fee Type
                                    </th>
                                    <th className="one column wide" style={{ width: '10%', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                      Registered By
                                    </th>
                                    
                                    {!canView && (
                                      <th className="one column wide" style={{ width: '10%' }}>Action</th>
                                    )}
                                    <th className="one column wide" style={{ width: '10%', whiteSpace: 'nowrap' }}>View Docs</th>
                                    <th className="one column wide" style={{ width: '10%' }}>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td colSpan={17} className="text-center py-4">
                                      <div className="empty-state">
                                        <img 
                                          src="/assets/images/no-data.svg" 
                                          alt="No records found" 
                                          style={{ width: '120px', marginBottom: '20px' }} 
                                        />
                                        <h4>No registrations found</h4>
                                        <p className="text-muted">Try adjusting your filters or create a new registration</p>
                                        <Button 
                                          variant="outline-primary" 
                                          onClick={handleResetFilters}
                                          className="mt-2"
                                        >
                                          <RefreshCw size={14} className="mr-2" /> Reset Filters
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </Table>
                            </>
                          )}
                          
                          {/* Pagination */}
                          {renderPagination()}
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>
      </div>

      {/* Course Assign Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-white text-uppercase">Assign Course</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-1">
          <Row>
            <Col xl={6} lg={6} md={6} sm={6} xs={6} className="mb-1 text-left">
              <Form.Group>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={modalData.assignDate}
                  onChange={(e) => setModalData({ ...modalData, assignDate: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col xl={6} lg={6} md={6} sm={6} xs={6} className="mb-1 text-left">
              <Form.Group>
                <Form.Label>Course URL</Form.Label>
                <Form.Control
                  type="text"
                  value={modalData.url}
                  onChange={(e) => setModalData({ ...modalData, url: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col xl={12} className="mb-1 text-left">
              <Form.Group>
                <Form.Label>Remarks</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={modalData.remarks}
                  onChange={(e) => setModalData({ ...modalData, remarks: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAssignCourse}>
            Assign Course
          </Button>
        </Modal.Footer>
      </Modal>

      {/* CSS Styles */}
      <style jsx>{`
        .content-wrapper {
          padding: 1rem;
        }
        
        #tblexportData td {
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
        
        .leadsSelect {
          width: 150px;
        }
        
        .advanced-filters {
          max-height: 0;
          opacity: 0;
          transition: max-height 0.3s ease, opacity 0.3s ease;
        }
        
        .registration-tabs .nav-link {
          position: relative;
          padding: 0.75rem 1rem;
          font-weight: 500;
        }
        
        .registration-tabs .nav-link.active {
          color: #5e50ee;
          background-color: transparent;
          border-bottom: 2px solid #5e50ee;
        }
        
        .applied-filters {
          background-color: #f8f9fa;
          padding: 10px 15px;
          border-radius: 5px;
        }
        
        .search-icon {
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 0;
        }
        
        .advanced-filters-container {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Custom styles for badges */
        .badge {
          padding: 0.5em 0.75em;
          font-weight: 500;
        }
        
        /* Mobile responsive styles */
        @media (max-width: 767px) {
          .content-wrapper {
            padding: 0.5rem;
          }
          
          .leadsSelect {
            width: 100px;
          }
          
          .registration-tabs .nav-link {
            padding: 0.5rem 0.75rem;
            font-size: 0.9rem;
          }
          
          .table-responsive {
            overflow-x: auto;
          }
          
          .pagination .page-link {
            padding: 0.3rem 0.5rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Registrations;

// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import { useNavigate, useLocation, Link } from 'react-router-dom';
// import { 
//   Container, 
//   Row, 
//   Col, 
//   Card, 
//   Table, 
//   Form, 
//   Button, 
//   Breadcrumb,
//   Modal,
//   Alert
// } from 'react-bootstrap';
// import { Edit, LogIn } from 'react-feather';
// import moment from 'moment';
// import qs from 'query-string';
// import "./Registration.css";
// const Registrations = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
//   const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

//   // State variables
//   const [candidates, setCandidates] = useState([]);
//   const [totalPages, setTotalPages] = useState(1);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
//   const [canView, setCanView] = useState(true);
//   const [flashMessage, setFlashMessage] = useState(null);
//   const [sortingValue, setSortingValue] = useState('');
//   const [sortingOrder, setSortingOrder] = useState(1);

//   // Modal state
//   const [showModal, setShowModal] = useState(false);
//   const [modalData, setModalData] = useState({
//     id: '',
//     remarks: '',
//     assignDate: '',
//     url: ''
//   });

//   // Filter state
//   const [filterData, setFilterData] = useState({
//     name: '',
//     FromDate: '',
//     ToDate: '',
//     courseType: '',
//     status: 'true'
//   });

//   // Get query params from URL
//   useEffect(() => {
//     const queryParams = qs.parse(location.search);
//     setCurrentPage(parseInt(queryParams.page) || 1);
    
//     // Set filter data from query params
//     setFilterData({
//       name: queryParams.name || '',
//       FromDate: queryParams.FromDate || '',
//       ToDate: queryParams.ToDate || '',
//       courseType: queryParams.courseType || '',
//       status: queryParams.status || 'true'
//     });

//     // Set sorting params
//     setSortingValue(queryParams.value || '');
//     setSortingOrder(parseInt(queryParams.order) || 1);

//     // Fetch registrations based on query params
//     fetchRegistrations(queryParams);
//   }, [location.search]);

//   // Fetch registrations data
//   const fetchRegistrations = async (params) => {
//     try {
//       const headers = {
//         'x-auth': localStorage.getItem('token')
//       };

//       // Build query string from params
//       const queryString = qs.stringify(params);
//       const response = await axios.get(`${backendUrl}/admin/courses/registrations?${queryString}`, { headers });

//       if (response.data) {
//         setCandidates(response.data.candidates || []);
//         setTotalPages(response.data.totalPages || 1);
//         setCanView(response.data.view !== undefined ? response.data.view : true);
//       }
//     } catch (error) {
//       console.error('Error fetching registrations:', error);
//       setFlashMessage({
//         type: 'danger',
//         message: 'Failed to fetch registrations'
//       });
//     }
//   };

//   // Handle input change for filter
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFilterData(prev => ({ ...prev, [name]: value }));
//   };

//   // Validate date filters
//   const validateFilters = () => {
//     if ((filterData.FromDate && !filterData.ToDate) || (!filterData.FromDate && filterData.ToDate)) {
//       return false;
//     }
//     return true;
//   };

//   // Handle filter form submit
//   const handleFilterSubmit = (e) => {
//     e.preventDefault();
    
//     if (!validateFilters()) {
//       return;
//     }

//     // Build query string for navigation
//     const queryParams = {};
    
//     Object.keys(filterData).forEach(key => {
//       if (filterData[key]) {
//         queryParams[key] = filterData[key];
//       }
//     });

//     navigate(`/admin/courses/registrations?${qs.stringify(queryParams)}`);
//   };

//   // Handle reset filters
//   const handleResetFilters = () => {
//     navigate('/admin/courses/registrations');
//   };

//   // Handle pagination click
//   const handlePageClick = (page) => {
//     const queryParams = qs.parse(location.search);
//     queryParams.page = page;
//     navigate(`/admin/courses/registrations?${qs.stringify(queryParams)}`);
//   };

//   // Handle sorting
//   const handleSorting = (value) => {
//     const newOrder = sortingValue === value ? -sortingOrder : 1;
    
//     const queryParams = qs.parse(location.search);
//     queryParams.value = value;
//     queryParams.order = newOrder;
    
//     navigate(`/admin/courses/registrations?${qs.stringify(queryParams)}`);
//   };

//   // Handle action click (Due/Assigned)
//   const handleActionClick = (id, remarks, assignDate, url) => {
//     const formattedDate = assignDate ? 
//       moment(assignDate).format('YYYY-MM-DD') : 
//       moment().format('YYYY-MM-DD');

//     setModalData({
//       id,
//       remarks: remarks || '',
//       assignDate: formattedDate,
//       url: url || ''
//     });

//     setShowModal(true);
//   };

//   // Handle assign course
//   const handleAssignCourse = async () => {
//     try {
//       const updateCourse = {
//         url: modalData.url,
//         remarks: modalData.remarks,
//         courseStatus: 0,
//         assignDate: new Date(modalData.assignDate).toISOString()
//       };

//       await axios.put(
//         `${backendUrl}/admin/courses/assignCourses/${modalData.id}`, 
//         updateCourse,
//         {
//           headers: {
//             'x-auth': localStorage.getItem('token')
//           }
//         }
//       );

//       setShowModal(false);
      
//       // Refresh data
//       fetchRegistrations(qs.parse(location.search));
      
//       setFlashMessage({
//         type: 'success',
//         message: 'Course assigned successfully'
//       });
//     } catch (error) {
//       console.error('Error assigning course:', error);
//       setFlashMessage({
//         type: 'danger',
//         message: 'An error occurred while assigning the course'
//       });
//     }
//   };

//   // Handle lead status update
//   const handleLeadStatusUpdate = async (appliedId, status) => {
//     try {
//       await axios.post(
//         `${backendUrl}/admin/courses/leadStatus`,
//         { appliedId, status },
//         {
//           headers: {
//             'x-auth': localStorage.getItem('token')
//           }
//         }
//       );
      
//       // Refresh data
//       fetchRegistrations(qs.parse(location.search));
      
//       setFlashMessage({
//         type: 'success',
//         message: 'Lead status updated successfully'
//       });
//     } catch (error) {
//       console.error('Error updating lead status:', error);
//       setFlashMessage({
//         type: 'danger',
//         message: 'An error occurred while updating lead status'
//       });
//     }
//   };

//   // Handle login as candidate
//   const handleLoginAs = async (mobile) => {
//     try {
//       const response = await axios.post(
//         `${backendUrl}/api/loginAsCandidate`,
//         { mobile, module: 'candidate' },
//         {
//           headers: {
//             'x-auth': localStorage.getItem('token')
//           }
//         }
//       );

//       if (response.data && response.data.role === 3) {
//         localStorage.setItem("candidate", response.data.name);
//         localStorage.setItem("token", response.data.token);
//         window.location.href = "/candidate/dashboard";
//       }
//     } catch (error) {
//       console.error('Error logging in as candidate:', error);
//       setFlashMessage({
//         type: 'danger',
//         message: 'An error occurred while logging in as candidate'
//       });
//     }
//   };

//   // Render pagination
//   const renderPagination = () => {
//     if (!totalPages || totalPages <= 1) return null;

//     let first = 1;
//     let last = totalPages > 4 ? 4 : totalPages;

//     if (totalPages > 4 && currentPage >= 2) {
//       first = currentPage - 1;
//       last = currentPage + 1;
//       if (last > totalPages) last = totalPages;
//     }

//     return (
//       <ul className="pagination justify-content-end ml-2 mb-2">
//         {first > 1 && (
//           <li className="page-item">
//             <Button 
//               variant="link" 
//               className="page-link" 
//               onClick={() => handlePageClick(1)}
//             >
//               First
//             </Button>
//           </li>
//         )}
        
//         {Array.from({ length: last - first + 1 }, (_, i) => i + first).map(page => (
//           <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
//             <Button 
//               variant={page === currentPage ? 'primary' : 'link'} 
//               className="page-link" 
//               onClick={() => handlePageClick(page)}
//               disabled={page === currentPage}
//             >
//               {page}
//             </Button>
//           </li>
//         ))}
        
//         {totalPages > last && (
//           <>
//             <li className="page-item">
//               <Button 
//                 variant="link" 
//                 className="page-link" 
//                 onClick={() => handlePageClick(last + 1)}
//               >
//                 ...
//               </Button>
//             </li>
//             <li className="page-item">
//               <Button 
//                 variant="link" 
//                 className="page-link" 
//                 onClick={() => handlePageClick(totalPages)}
//               >
//                 Last
//               </Button>
//             </li>
//           </>
//         )}
//       </ul>
//     );
//   };

//   return (
//     <div className="">
//       {/* Header */}
//       <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
//         <div className="content-header-left col-md-12 col-12 mb-2">
//           <div className="row breadcrumbs-top">
//             <div className="col-9">
//               <h3 className="content-header-title float-left mb-0">Registrations</h3>
//               <Breadcrumb>
//                 <Breadcrumb.Item href="/admin">Home</Breadcrumb.Item>
//                 <Breadcrumb.Item active>Registrations</Breadcrumb.Item>
//               </Breadcrumb>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Content Body */}
//       <div className="content-body">
//         {/* Flash Message */}
//         {flashMessage && (
//           <Alert 
//             variant={flashMessage.type} 
//             onClose={() => setFlashMessage(null)} 
//             dismissible
//           >
//             {flashMessage.message}
//           </Alert>
//         )}
        
//         <section className="list-view">
//           <Row>
//             <Col xs={12} className="rounded equal-height-2 coloumn-2">
//               <Card>
//                 <Card.Body>
//                   <Row>
//                     <Col xs={12}>
//                       <Row className="mb-2">
//                         <Col xl={12} lg={12} className="px-3">
//                           <Form onSubmit={handleFilterSubmit} id="filterForm">
//                             <Row>
//                               <Col xl={3} className="mt-1">
//                                 <Form.Group>
//                                   <Form.Label>Name/ Mobile/ Whatsapp</Form.Label>
//                                   <Form.Control
//                                     type="text"
//                                     name="name"
//                                     value={filterData.name}
//                                     onChange={handleInputChange}
//                                     maxLength={25}
//                                   />
//                                 </Form.Group>
//                               </Col>
//                               <Col 
//                                 xl={3} 
//                                 className="text-center mt-3"
//                                 style={{ marginTop: '2.5rem !important' }}
//                               >
//                                 <Button
//                                   variant="success"
//                                   type="submit"
//                                   className="waves-effect waves-light text-white d-inline"
//                                 >
//                                   Go
//                                 </Button>
//                                 <Button
//                                   variant="danger"
//                                   className="d-inline waves-effect waves-light mb-2 text-white mx-1"
//                                   onClick={handleResetFilters}
//                                 >
//                                   RESET
//                                 </Button>
//                               </Col>
//                               <Col xl={6} className="text-right mt-3">
//                                 <Form.Check
//                                   type="checkbox"
//                                   id="filterToggle"
//                                   label=""
//                                   checked={showAdvancedFilters}
//                                   onChange={() => setShowAdvancedFilters(!showAdvancedFilters)}
//                                   custom
//                                 />
//                               </Col>
//                             </Row>

//                             {showAdvancedFilters && (
//                               <Row 
//                                 className="justify-content-end" 
//                                 style={{ 
//                                   transition: '0.3s ease-in-out',
//                                   overflow: 'hidden',
//                                   maxHeight: showAdvancedFilters ? '300px' : '0',
//                                   opacity: showAdvancedFilters ? '1' : '0'
//                                 }}
//                               >
//                                 <Col xl={2} className="ml-1 mt-1">
//                                   <Form.Group>
//                                     <Form.Label>Course Fee Type</Form.Label>
//                                     <Form.Control
//                                       as="select"
//                                       name="courseType"
//                                       value={filterData.courseType}
//                                       onChange={handleInputChange}
//                                       className="text-capitalize"
//                                     >
//                                       <option value="">Select</option>
//                                       <option value="Free" className="text-capitalize">Free</option>
//                                       <option value="Paid" className="text-capitalize">Paid</option>
//                                     </Form.Control>
//                                   </Form.Group>
//                                 </Col>
//                                 <Col xl={2} className="ml-1 mt-1">
//                                   <Form.Group>
//                                     <Form.Label>From Date</Form.Label>
//                                     <Form.Control
//                                       type="date"
//                                       name="FromDate"
//                                       value={filterData.FromDate}
//                                       onChange={handleInputChange}
//                                       isInvalid={!filterData.FromDate && filterData.ToDate}
//                                     />
//                                     <Form.Control.Feedback type="invalid">
//                                       From date is required when To date is set
//                                     </Form.Control.Feedback>
//                                   </Form.Group>
//                                 </Col>
//                                 <Col xl={2} className="ml-1 mt-1">
//                                   <Form.Group>
//                                     <Form.Label>To Date</Form.Label>
//                                     <Form.Control
//                                       type="date"
//                                       name="ToDate"
//                                       value={filterData.ToDate}
//                                       onChange={handleInputChange}
//                                       isInvalid={filterData.FromDate && !filterData.ToDate}
//                                     />
//                                     <Form.Control.Feedback type="invalid">
//                                       To date is required when From date is set
//                                     </Form.Control.Feedback>
//                                   </Form.Group>
//                                 </Col>
//                                 <Form.Control 
//                                   type="hidden" 
//                                   name="status" 
//                                   value="true" 
//                                 />
//                                 <Col 
//                                   xl={3} 
//                                   className="text-center mt-3"
//                                   style={{ marginTop: '2.5rem !important' }}
//                                 >
//                                   <Button
//                                     variant="success"
//                                     type="submit"
//                                     className="waves-effect waves-light text-white d-inline"
//                                   >
//                                     Go
//                                   </Button>
//                                   <Button
//                                     variant="danger"
//                                     className="d-inline waves-effect waves-light mb-2 text-white mx-1"
//                                     onClick={handleResetFilters}
//                                   >
//                                     RESET
//                                   </Button>
//                                 </Col>
//                               </Row>
//                             )}
//                           </Form>
//                         </Col>
//                       </Row>

//                       {/* Table */}
//                       <div className="table-responsive">
//                         {candidates && candidates.length > 0 ? (
//                           <Table id="tblexportData" className="table table-hover-animation mb-0 table-hover" style={{ width: '100%' }}>
//                            <thead>
//                               <tr>
//                                 <th 
//                                   className="three column wide" 
//                                   style={{ width: '18%', cursor: 'pointer' }}
//                                   onClick={() => handleSorting('createdAt')}
//                                 >
//                                   DATE <i 
//                                     className={`fa-solid fa-arrow-${sortingValue === 'createdAt' ? (sortingOrder === 1 ? 'down' : 'up') : 'down'} success`} 
//                                   />
//                                 </th>
//                                 <th 
//                                   className="three column wide candidate-wrap" 
//                                   style={{ width: '19%' ,  whiteSpace : 'nowrap'}}
//                                   onClick={() => handleSorting('name')}
//                                 >
//                                   CANDIDATE NAME
//                                 </th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>MOBILE NO.</th>
//                                 <th className="one column wide" style={{ width: '15%' }}>Email</th>
//                                 <th className="one column wide" style={{ width: '15%' , whiteSpace : 'nowrap' }}>Document Status</th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>Lead Status</th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>Demo Status</th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>Center Status</th>
//                                 <th 
//                                   className="one column wide" 
//                                   style={{ width: '7%', cursor: 'pointer' }}
//                                   onClick={() => handleSorting('courseName')}
//                                 >
//                                   Course <i 
//                                     className={sortingValue === 'courseName' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
//                                   />
//                                 </th>
//                                 <th 
//                                   className="one column wide" 
//                                   style={{ width: '7%', cursor: 'pointer' ,  whiteSpace : 'nowrap'}}
//                                   onClick={() => handleSorting('registrationCharges')}
//                                 >
//                                   Reg Fee <i 
//                                     className={sortingValue === 'registrationCharges' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
//                                   />
//                                 </th>
//                                 <th className="one column wide" style={{ width: '7%', cursor: 'pointer' ,  whiteSpace : 'nowrap'}}>
//                                   Reg Status <i className="" />
//                                 </th>
//                                 <th 
//                                   className="one column wide" 
//                                   style={{ width: '7%', cursor: 'pointer' }}
//                                   onClick={() => handleSorting('sector')}
//                                 >
//                                   Sector <i 
//                                     className={sortingValue === 'sector' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
//                                   />
//                                 </th>
//                                 <th className="one column wide" style={{ width: '10%', cursor: 'pointer' , whiteSpace : 'nowrap' }}>
//                                   Course Fee Type
//                                 </th>
//                                 <th className="one column wide" style={{ width: '10%', cursor: 'pointer' , whiteSpace : 'nowrap'}}>
//                                   Registered By
//                                 </th>
                                
//                                 {!canView && (
//                                   <th className="one column wide" style={{ width: '10%' }}>Action</th>
//                                 )}
//                                 <th className="one column wide" style={{ width: '10%' ,  whiteSpace : 'nowrap'}}>View Docs</th>
//                                 <th className="one column wide" style={{ width: '10%' }}>Action</th>
//                               </tr>
//                             </thead>
//                             <tbody>
//                               {candidates.map((candidate, i) => (
//                                 <tr key={candidate._id}>
//                                   <td className="text-capitalize">
//                                     {candidate.createdAt 
//                                       ? moment(candidate.createdAt).utcOffset("+05:30").format('MMM DD YYYY hh:mm A')
//                                       : "N/A"
//                                     }
//                                   </td>
//                                   <td className="text-capitalize candid-wrap">
//                                     {candidate.name || "N/A"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.mobile || "N/A"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.email || "N/A"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.docProgress && candidate.docProgress.totalRequired && candidate.docProgress.totalRequired > 0 ? (
//                                       <div 
//                                         className="circular-progress-container" 
//                                         data-percent={candidate.docProgress.percent}
//                                       >
//                                         <svg width="40" height="40">
//                                           <circle className="circle-bg" cx="20" cy="20" r="16"></circle>
//                                           <circle 
//                                             className="circle-progress" 
//                                             cx="20" 
//                                             cy="20" 
//                                             r="16"
//                                             style={{
//                                               strokeDasharray: `${2 * Math.PI * 16}`,
//                                               strokeDashoffset: `${2 * Math.PI * 16 - (candidate.docProgress.percent / 100) * 2 * Math.PI * 16}`
//                                             }}
//                                           ></circle>
//                                         </svg>
//                                         <div className="progress-text">
//                                           {candidate.docProgress.percent}%
//                                         </div>
//                                       </div>
//                                     ) : (
//                                       "NDR"
//                                     )}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     <Form.Control 
//                                       as="select"
//                                       className="leadsSelect"
//                                       onChange={(e) => handleLeadStatusUpdate(candidate._id, e.target.value)}
//                                       value={candidate.leadStatus || ''}
//                                     >
//                                       <option value="">Select</option>
//                                       <option value="Hot">Hot</option>
//                                       <option value="Warm">Warm</option>
//                                       <option value="Cold">Cold</option>
//                                     </Form.Control>
//                                   </td>
//                                   <td className="text-capitalize">
//                                     <Form.Control 
//                                       as="select"
//                                       className="leadsSelect"
//                                       value={candidate.demoStatus || ''}
//                                       onChange={(e) => handleLeadStatusUpdate(candidate._id, e.target.value)}
//                                     >
//                                       <option value="">Select</option>
//                                       <option value="Demo Scheduled">Demo Scheduled</option>
//                                       <option value="Demo Pending">Demo Pending</option>
//                                       <option value="Demo Done">Demo Done</option>
//                                     </Form.Control>
//                                   </td>
//                                   <td className="text-capitalize">
//                                     <Form.Control 
//                                       as="select"
//                                       className="leadsSelect"
//                                       value={candidate.centerStatus || ''}
//                                       onChange={(e) => handleLeadStatusUpdate(candidate._id, e.target.value)}
//                                     >
//                                       <option value="">Select</option>
//                                       <option value="Add Center">Add Center</option>
//                                       <option value="Rejected">Rejected</option>
//                                       <option value="Drop Out">Drop Out</option>
//                                     </Form.Control>
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.courseName || "N/A"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.registrationCharges || "N/A"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.registrationFee || "Unpaid"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.sector || "N/A"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.courseFeeType || "Free/Paid"}
//                                   </td>
//                                   <td className="text-capitalize">
//                                     {candidate.registeredByName || "N/A"}
//                                   </td>
                                  
//                                   {!canView && (
//                                     <td className="text-capitalize">
//                                       <Button
//                                         variant={candidate.courseStatus === 0 ? "danger" : "success"}
//                                         className="waves-effect waves-light text-white d-inline btn-sm"
//                                         onClick={() => handleActionClick(
//                                           candidate._id, 
//                                           candidate.remarks, 
//                                           candidate.assignDate, 
//                                           candidate.url
//                                         )}
//                                       >
//                                         {candidate.courseStatus === 0 ? "DUE" : "Assigned"}
//                                       </Button>
//                                     </td>
//                                   )}
                                  
//                                   <td className="text-capitalize">
//                                     <Link
//                                       to={`/admin/courses/${candidate.courseId}/${candidate.candidateId}/docsview`}
//                                       className="btn btn-danger waves-effect waves-light text-white d-inline btn-sm"
//                                       style={{ padding: '8px' }}
//                                     >
//                                       View Docs
//                                     </Link>
//                                   </td>
                                  
//                                   <td className="text-capitalize">
//                                     <Button
//                                       variant="link"
//                                       className="p-0"
//                                       onClick={() => handleLoginAs(candidate.mobile)}
//                                     >
//                                       <LogIn size={18} className="text-primary cursor-pointer" title="Login As" />
//                                     </Button>
//                                   </td>
//                                 </tr>
//                               ))}
//                             </tbody>
//                           </Table>
//                         ) : (
//                             <>
//                             <Table id="tblexportData" className="table table-hover-animation mb-0 table-hover" style={{ width: '100%' }}>
//                             <thead>
//                               <tr>
//                                 <th 
//                                   className="three column wide" 
//                                   style={{ width: '18%', cursor: 'pointer' }}
//                                   onClick={() => handleSorting('createdAt')}
//                                 >
//                                   DATE <i 
//                                     className={`fa-solid fa-arrow-${sortingValue === 'createdAt' ? (sortingOrder === 1 ? 'down' : 'up') : 'down'} success`} 
//                                   />
//                                 </th>
//                                 <th 
//                                   className="three column wide candidate-wrap" 
//                                   style={{ width: '19%' ,  whiteSpace : 'nowrap'}}
//                                   onClick={() => handleSorting('name')}
//                                 >
//                                   CANDIDATE NAME
//                                 </th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>MOBILE NO.</th>
//                                 <th className="one column wide" style={{ width: '15%' }}>Email</th>
//                                 <th className="one column wide" style={{ width: '15%' , whiteSpace : 'nowrap' }}>Document Status</th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>Lead Status</th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>Demo Status</th>
//                                 <th className="one column wide" style={{ width: '15%' ,  whiteSpace : 'nowrap'}}>Center Status</th>
//                                 <th 
//                                   className="one column wide" 
//                                   style={{ width: '7%', cursor: 'pointer' }}
//                                   onClick={() => handleSorting('courseName')}
//                                 >
//                                   Course <i 
//                                     className={sortingValue === 'courseName' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
//                                   />
//                                 </th>
//                                 <th 
//                                   className="one column wide" 
//                                   style={{ width: '7%', cursor: 'pointer' ,  whiteSpace : 'nowrap'}}
//                                   onClick={() => handleSorting('registrationCharges')}
//                                 >
//                                   Reg Fee <i 
//                                     className={sortingValue === 'registrationCharges' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
//                                   />
//                                 </th>
//                                 <th className="one column wide" style={{ width: '7%', cursor: 'pointer' ,  whiteSpace : 'nowrap'}}>
//                                   Reg Status <i className="" />
//                                 </th>
//                                 <th 
//                                   className="one column wide" 
//                                   style={{ width: '7%', cursor: 'pointer' }}
//                                   onClick={() => handleSorting('sector')}
//                                 >
//                                   Sector <i 
//                                     className={sortingValue === 'sector' ? `fa-solid fa-arrow-${sortingOrder === 1 ? 'down' : 'up'} success` : ''} 
//                                   />
//                                 </th>
//                                 <th className="one column wide" style={{ width: '10%', cursor: 'pointer' , whiteSpace : 'nowrap' }}>
//                                   Course Fee Type
//                                 </th>
//                                 <th className="one column wide" style={{ width: '10%', cursor: 'pointer' , whiteSpace : 'nowrap'}}>
//                                   Registered By
//                                 </th>
                                
//                                 {!canView && (
//                                   <th className="one column wide" style={{ width: '10%' }}>Action</th>
//                                 )}
//                                 <th className="one column wide" style={{ width: '10%' ,  whiteSpace : 'nowrap'}}>View Docs</th>
//                                 <th className="one column wide" style={{ width: '10%' }}>Action</th>
//                               </tr>
//                             </thead>
//                             <tbody>
//                             <tr className="text-center mt-3">
//                                 <td colSpan={16}>  No result found </td>
//                             </tr>
//                             </tbody>
//                             </Table>
//                             </>
                         
//                         )}
                        
//                         {/* Pagination */}
//                         {renderPagination()}
//                       </div>
//                     </Col>
//                   </Row>
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row>
//         </section>
//       </div>

//       {/* Course Assign Modal */}
//       <Modal show={showModal} onHide={() => setShowModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title className="text-white text-uppercase">Assign Course</Modal.Title>
//         </Modal.Header>
//         <Modal.Body className="pt-1">
//           <Row>
//             <Col xl={6} lg={6} md={6} sm={6} xs={6} className="mb-1 text-left">
//               <Form.Group>
//                 <Form.Label>Date</Form.Label>
//                 <Form.Control
//                   type="date"
//                   value={modalData.assignDate}
//                   onChange={(e) => setModalData({ ...modalData, assignDate: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col xl={6} lg={6} md={6} sm={6} xs={6} className="mb-1 text-left">
//               <Form.Group>
//                 <Form.Label>Course URL</Form.Label>
//                 <Form.Control
//                   type="text"
//                   value={modalData.url}
//                   onChange={(e) => setModalData({ ...modalData, url: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col xl={12} className="mb-1 text-left">
//               <Form.Group>
//                 <Form.Label>Remarks</Form.Label>
//                 <Form.Control
//                   as="textarea"
//                   rows={3}
//                   value={modalData.remarks}
//                   onChange={(e) => setModalData({ ...modalData, remarks: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//           </Row>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="primary" onClick={handleAssignCourse}>
//             Assigned
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* CSS Styles */}
//       <style jsx>{`
//         #tblexportData td {
//           white-space: nowrap;
//         }
//         .circular-progress-container {
//           position: relative;
//           width: 40px;
//           height: 40px;
//         }
//         .circular-progress-container svg {
//           transform: rotate(-90deg);
//         }
//         .circle-bg {
//           fill: none;
//           stroke: #e6e6e6;
//           stroke-width: 4;
//         }
//         .circle-progress {
//           fill: none;
//           stroke: #FC2B5A;
//           stroke-width: 4;
//           stroke-linecap: round;
//           transition: stroke-dashoffset 0.5s ease;
//         }
//         .circular-progress-container .progress-text {
//           position: absolute;
//           top: 50%;
//           left: 50%;
//           transform: translate(-50%, -50%);
//           font-size: 10px;
//           color: #333;
//         }
//         .leadsSelect {
//           width: 150px;
//         }
//         .advanced-filters {
//           max-height: 0;
//           opacity: 0;
//           transition: max-height 0.3s ease, opacity 0.3s ease;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Registrations;