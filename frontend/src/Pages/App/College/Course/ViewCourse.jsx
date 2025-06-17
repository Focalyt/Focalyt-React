import React, { useState, useEffect } from 'react';
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
  Breadcrumb
} from 'react-bootstrap';
import { Edit } from 'react-feather';
import qs from 'query-string';

const ViewCourses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // State variables
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [filterData, setFilterData] = useState({
    name: '',
    FromDate: '',
    ToDate: '',
    Profile: '',
    status: 'true'
  });

  // Get query params from URL
  useEffect(() => {
    const queryParams = qs.parse(location.search);
    const initialArchived = queryParams.status === 'false';
    setIsArchived(initialArchived);

    // Set filter data from query params
    setFilterData({
      name: queryParams.name || '',
      FromDate: queryParams.FromDate || '',
      ToDate: queryParams.ToDate || '',
      Profile: queryParams.Profile || '',
      status: queryParams.status || 'true'
    });

    // Fetch courses based on query params
    fetchCourses(queryParams);
  }, [location.search]);

  // Fetch courses data
  const fetchCourses = async (params) => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user'));
      const headers = {
        'x-auth': user.token,
      };
      const queryString = qs.stringify(params);

      const response = await axios.get(`${backendUrl}/college/courses?${queryString}`, { headers });

      console.log("Fetched courses:", response.data.course);
      console.log(" Response :", response);

      if (response.data) {
        setCourses(response.data.courses || []);
        setStatus(response.data.status || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Handle archived checkbox change
  const handleArchivedChange = () => {
    const newArchived = !isArchived;
    setIsArchived(newArchived);
    navigate(`/institute/viewcourse?status=${!newArchived}`);
  };

  // Handle toggle status - FIXED VERSION
  const handleToggleStatus = async (courseId, currentStatus) => {
    console.log("Course ID:", courseId, "Current Status:", currentStatus);
    
    try {
      const user = JSON.parse(sessionStorage.getItem('user'));
      
      // Toggle the status
      const newStatus = !currentStatus;
      
      await axios.put(`${backendUrl}/college/courses/update_course_status/${courseId}`, 
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth': user?.token || sessionStorage.getItem('token')
          }
        }
      );
      
      window.location.reload()
     
      
      console.log(`Course ${courseId} status updated to ${newStatus}`);
      
    } catch (error) {
      console.error('Error changing course status:', error);
      // Optionally show error message to user
    }
  };

  // Handle input change for filter
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilterData(prev => ({ ...prev, [name]: value }));
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
      return;
    }

    // Build query string for navigation
    const queryParams = {};

    Object.keys(filterData).forEach(key => {
      if (filterData[key]) {
        queryParams[key] = filterData[key];
      }
    });

    navigate(`/institute/viewcourse?${qs.stringify(queryParams)}`);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    navigate('/institute/viewcourse');
  };

  return (
    <div className="">
      {/* Header */}
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">All Courses</h3>
              <Breadcrumb>
                <Breadcrumb.Item href="/institute/dashboard">Home</Breadcrumb.Item>
                <Breadcrumb.Item active>All Courses</Breadcrumb.Item>
              </Breadcrumb>
            </div>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="content-body">
        <section className="list-view">
          <Row>
            <Col xs={12} className="rounded equal-height-2 coloumn-2">
              <Card>
                <Card.Body>
                  {/* Archive Toggle */}
                  <Row className="p-1">
                    <Col xl={6}>
                      <Row>
                        <div className="archieve pl-1">
                          <Form.Check
                            type="checkbox"
                            id="checkbox1"
                            checked={isArchived}
                            onChange={handleArchivedChange}
                            label="Show Archived"
                            style={{ marginBottom: '4px' }}
                          />
                        </div>
                      </Row>
                    </Col>
                  </Row>

                  {/* Filter Form */}
                  <Row className="mb-2">
                    <Col xl={12} lg={12}>
                      <Form onSubmit={handleFilterSubmit}>
                        <Row>
                          <Col xl={2} className="ml-1 mt-1">
                            <Form.Group>
                              <Form.Label>Name</Form.Label>
                              <Form.Control
                                type="text"
                                name="name"
                                value={filterData.name}
                                onChange={handleInputChange}
                                maxLength={25}
                              />
                            </Form.Group>
                          </Col>
                          <Col xl={2} className="ml-1 mt-1">
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
                                Please select a from date.
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col xl={2} className="ml-1 mt-1">
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
                                Please select a to date.
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col xl={2} className="ml-1 mt-1">
                            <Form.Group>
                              <Form.Label>Profile</Form.Label>
                              <Form.Control
                                as="select"
                                name="Profile"
                                value={filterData.Profile}
                                onChange={handleInputChange}
                                className="text-capitalize"
                              >
                                <option value="">Select</option>
                                <option value="All" className="text-capitalize">All</option>
                                <option value="true" className="text-capitalize">Completed</option>
                                <option value="false" className="text-capitalize">Due</option>
                              </Form.Control>
                            </Form.Group>
                          </Col>
                          <Col xl={3} className="text-center mt-1" style={{ marginTop: '2.5rem !important' }}>
                            <Button
                              variant="success"
                              type="submit"
                              className="waves-effect waves-light text-white d-inline"
                            >
                              Go
                            </Button>
                            <Button
                              variant="danger"
                              className="d-inline waves-effect waves-light mb-2 text-white mx-1"
                              onClick={handleResetFilters}
                            >
                              RESET
                            </Button>
                          </Col>
                        </Row>
                      </Form>
                    </Col>
                  </Row>

                  {/* Courses Table */}
                  <div className="table-responsive">
                    <Table hover className="table-hover-animation mb-0">
                      <thead>
                        <tr>
                          <th>Sector</th>
                          <th>Course Level</th>
                          <th>Course Name</th>
                          <th>Duration</th>
                          {(status === 'true' || status === true) && (
                            <th>Add Leads</th>
                          )}
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course, i) => (
                          <tr key={course._id}>
                            <td style={{ padding: '14px' }}>
                              {course.sectors?.map((sector, j) => (
                                <div key={sector._id}>{sector.name}</div>
                              ))}
                            </td>
                            <td>{course.courseLevel}</td>
                            <td>{course.name}</td>
                            {/* FIXED: Show actual duration instead of _id */}
                            <td>{course.duration || 'N/A'}</td>
                            {(course.status === 'true' || course.status === true) && (
                              <td className="text-capitalize text-nowrap">
                                <Link
                                  to={`/institute/viewcourse/${course._id}/candidate/addleads`}
                                  className="btn btn-danger waves-effect waves-light text-white d-inline btn-sm"
                                  style={{ padding: '7px' }}
                                >
                                  Add leads
                                </Link>
                              </td>
                            )}
                            <td>
                              <div className="custom-control custom-switch custom-control-inline p-0">
                                {/* FIXED: Unique ID and proper event handling */}
                                <input 
                                  type="checkbox" 
                                  id={`customSwitch${course._id}`} 
                                  className="custom-control-input" 
                                  onChange={() => handleToggleStatus(course._id, course.status)} 
                                  checked={course.status === true || course.status === 'true'} 
                                />
                                <label 
                                  htmlFor={`customSwitch${course._id}`} 
                                  className="toggleSwitch"
                                ></label>
                              </div>
                            </td>
                            <td valign="middle" className="qualification-action-custom-class d-flex justify-content-center border-0" style={{ padding: "14px" }}>
                              <Link to={`/institute/courses/edit/${course._id}`}>
                                <Edit size={20} className="primary" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>
      </div>

      <style>
        {`
          tbody tr{
            border-bottom: 1px solid ;
          }
          .primary {
            color: #FC2B5A!important;
          }
          .custom-table td{
            padding: 14px!important;
            font-size: 12.5px!important;
          }
          
          /* Hide the checkbox inputs */
          .custom-control-input {
            display: none;
          }

          .toggleSwitch {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 50px;
            height: 30px;
            background-color: rgb(82, 82, 82);
            border-radius: 20px;
            cursor: pointer;
            transition-duration: .2s;
          }

          .toggleSwitch::after {
            content: "";
            position: absolute;
            height: 18px;
            width: 18px;
            left: 5px;
            background-color: transparent;
            border-radius: 50%;
            transition-duration: .2s;
            box-shadow: 5px 2px 7px rgba(8, 8, 8, 0.26);
            border: 5px solid white;
          }

          .custom-control-input:checked + .toggleSwitch::after {
            transform: translateX(25px);
            transition-duration: .2s;
            background-color: white;
          }

          .custom-control-input:checked + .toggleSwitch {
            background-color: #FC2B5A;
            transition-duration: .2s;
            height: 1.671rem;
          }

          .custom-control-input:checked ~ .custom-control-label::before {
            color: #fff;
            border-color: #FC2B5A;
            background-color: #FC2B5A;
          }
        `}
      </style>
    </div>
  );
};

export default ViewCourses;