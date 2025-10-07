import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, TrendingUp, Users, BookOpen, Clock, Target, CheckCircle, XCircle, Star, Award, BarChart3, Activity, AlertCircle, UserCheck, FileCheck, AlertTriangle, ChevronLeft, ChevronRight, CalendarDays, Download, Filter, Search } from 'lucide-react';

function Dashboard() {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

    // State Management
    const [loading, setLoading] = useState(true);
    const [selectedDateRange, setSelectedDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Analytics Data
    const [overviewStats, setOverviewStats] = useState({
        totalStudents: 0,
        activeCourses: 0,
        completedSessions: 0,
        totalHours: 0,
        averageRating: 0,
        attendanceRate: 0
    });

    const [performanceData, setPerformanceData] = useState([]);
    const [studentProgress, setStudentProgress] = useState([]);
    const [courseAnalytics, setCourseAnalytics] = useState([]);
    const [sessionAnalytics, setSessionAnalytics] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [studentList, setStudentList] = useState([]);
    const [assignmentStats, setAssignmentStats] = useState([]);

    // Filter States
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [courseOptions, setCourseOptions] = useState([]);
    const [studentOptions, setStudentOptions] = useState([]);

    // Load mock data
    useEffect(() => {
        const fetchTrainerAnalytics = async () => {
            try {
                setLoading(true);
                
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Mock Overview Stats
                setOverviewStats({
                    totalStudents: 45,
                    activeCourses: 8,
                    completedSessions: 156,
                    totalHours: 1240,
                    averageRating: 4.8,
                    attendanceRate: 94
                });

                // Mock Performance Data
                setPerformanceData([
                    { month: 'Jan', students: 35, sessions: 120, rating: 4.5, hours: 180 },
                    { month: 'Feb', students: 38, sessions: 135, rating: 4.6, hours: 200 },
                    { month: 'Mar', students: 42, sessions: 148, rating: 4.7, hours: 220 },
                    { month: 'Apr', students: 45, sessions: 156, rating: 4.8, hours: 240 },
                    { month: 'May', students: 48, sessions: 165, rating: 4.9, hours: 260 },
                    { month: 'Jun', students: 45, sessions: 156, rating: 4.8, hours: 240 }
                ]);

                // Mock Student Progress Data
                setStudentProgress([
                    { name: 'Web Development', total: 15, completed: 13, progress: 87, avgScore: 85 },
                    { name: 'Python Programming', total: 12, completed: 9, progress: 75, avgScore: 82 },
                    { name: 'Data Science', total: 10, completed: 7, progress: 70, avgScore: 88 },
                    { name: 'React JS', total: 8, completed: 6, progress: 75, avgScore: 90 },
                    { name: 'JavaScript', total: 14, completed: 11, progress: 79, avgScore: 83 }
                ]);

                // Mock Course Analytics
                setCourseAnalytics([
                    { name: 'Web Development', students: 15, sessions: 24, completed: 20, rating: 4.8, revenue: 75000 },
                    { name: 'Python Programming', students: 12, sessions: 20, completed: 16, rating: 4.6, revenue: 60000 },
                    { name: 'Data Science', students: 10, sessions: 18, completed: 12, rating: 4.9, revenue: 50000 },
                    { name: 'React JS', students: 8, sessions: 16, completed: 8, rating: 4.7, revenue: 40000 },
                    { name: 'JavaScript', students: 14, sessions: 22, completed: 18, rating: 4.5, revenue: 70000 }
                ]);

                // Mock Session Analytics
                setSessionAnalytics([
                    { date: '2024-01-15', course: 'Web Development', duration: 2, students: 15, attendance: 14, rating: 4.8 },
                    { date: '2024-01-16', course: 'Python Programming', duration: 1.5, students: 12, attendance: 11, rating: 4.6 },
                    { date: '2024-01-17', course: 'Data Science', duration: 2, students: 10, attendance: 9, rating: 4.9 },
                    { date: '2024-01-18', course: 'React JS', duration: 2, students: 8, attendance: 8, rating: 4.7 },
                    { date: '2024-01-19', course: 'JavaScript', duration: 1.5, students: 14, attendance: 13, rating: 4.5 }
                ]);

                // Mock Attendance Data
                setAttendanceData([
                    { course: 'Web Development', present: 14, absent: 1, percentage: 93 },
                    { course: 'Python Programming', present: 11, absent: 1, percentage: 92 },
                    { course: 'Data Science', present: 9, absent: 1, percentage: 90 },
                    { course: 'React JS', present: 8, absent: 0, percentage: 100 },
                    { course: 'JavaScript', present: 13, absent: 1, percentage: 93 }
                ]);

                // Mock Student List
                setStudentList([
                    { id: 1, name: 'Rahul Sharma', course: 'Web Development', progress: 85, attendance: 92, lastActive: '2 hours ago', rating: 4.8 },
                    { id: 2, name: 'Priya Singh', course: 'Python Programming', progress: 72, attendance: 88, lastActive: '4 hours ago', rating: 4.6 },
                    { id: 3, name: 'Amit Kumar', course: 'Data Science', progress: 68, attendance: 95, lastActive: '1 day ago', rating: 4.9 },
                    { id: 4, name: 'Sneha Patel', course: 'React JS', progress: 45, attendance: 90, lastActive: '6 hours ago', rating: 4.7 },
                    { id: 5, name: 'Rajesh Verma', course: 'JavaScript', progress: 79, attendance: 93, lastActive: '3 hours ago', rating: 4.5 }
                ]);

                // Mock Assignment Stats
                setAssignmentStats([
                    { title: 'React Component Assignment', course: 'React JS', dueDate: '2024-01-18', submitted: 6, total: 8, avgScore: 85 },
                    { title: 'Python Data Analysis', course: 'Python Programming', dueDate: '2024-01-20', submitted: 10, total: 12, avgScore: 82 },
                    { title: 'Web API Project', course: 'Web Development', dueDate: '2024-01-22', submitted: 12, total: 15, avgScore: 88 },
                    { title: 'Machine Learning Model', course: 'Data Science', dueDate: '2024-01-25', submitted: 5, total: 10, avgScore: 90 }
                ]);

                // Set filter options
                setCourseOptions(['Web Development', 'Python Programming', 'Data Science', 'React JS', 'JavaScript']);
                setStudentOptions(['Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Sneha Patel', 'Rajesh Verma']);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching trainer analytics:', error);
                setLoading(false);
            }
        };

        fetchTrainerAnalytics();
    }, [selectedDateRange]);

    // Filter handlers
    const handleDateRangeChange = (dateRange) => {
        setSelectedDateRange(dateRange);
    };

    const handleFilterChange = (filterType, values) => {
        switch (filterType) {
            case 'courses':
                setSelectedCourses(values);
                break;
            case 'students':
                setSelectedStudents(values);
                break;
        }
    };

    // Chart colors
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    if (loading) {
        return (
            <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading trainer analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <div className="mb-4">
                <h1 className="display-5 fw-bold text-dark mb-2">Trainer Analytics Dashboard</h1>
                <p className="text-muted">Comprehensive performance tracking and student progress analytics</p>
            </div>

            {/* Date Range Selector */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="row align-items-end">
                        <div className="col-md-4">
                            <label className="form-label fw-medium">Date Range:</label>
                            <button
                                className="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center"
                                onClick={() => setShowDatePicker(!showDatePicker)}
                            >
                                <div className="d-flex align-items-center">
                                    <CalendarDays className="me-2" size={20} />
                                    <span>
                                        {selectedDateRange.startDate} to {selectedDateRange.endDate}
                                    </span>
                                </div>
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-medium">Courses:</label>
                            <select 
                                className="form-select"
                                value={selectedCourses[0] || ''}
                                onChange={(e) => setSelectedCourses(e.target.value ? [e.target.value] : [])}
                            >
                                <option value="">All Courses</option>
                                {courseOptions.map(course => (
                                    <option key={course} value={course}>{course}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-4">
                            <button
                                className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                                onClick={() => window.location.reload()}
                            >
                                <Search className="me-2" size={16} />
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="row mb-4">
                <div className="col-md-2">
                    <div className="card bg-primary text-white h-100">
                        <div className="card-body text-center">
                            <Users className="mb-2" size={32} />
                            <h3 className="mb-1">{overviewStats.totalStudents}</h3>
                            <p className="mb-0">Total Students</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="card bg-success text-white h-100">
                        <div className="card-body text-center">
                            <BookOpen className="mb-2" size={32} />
                            <h3 className="mb-1">{overviewStats.activeCourses}</h3>
                            <p className="mb-0">Active Courses</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="card bg-info text-white h-100">
                        <div className="card-body text-center">
                            <CheckCircle className="mb-2" size={32} />
                            <h3 className="mb-1">{overviewStats.completedSessions}</h3>
                            <p className="mb-0">Completed Sessions</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="card bg-warning text-white h-100">
                        <div className="card-body text-center">
                            <Clock className="mb-2" size={32} />
                            <h3 className="mb-1">{overviewStats.totalHours}</h3>
                            <p className="mb-0">Total Hours</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="card bg-danger text-white h-100">
                        <div className="card-body text-center">
                            <Star className="mb-2" size={32} />
                            <h3 className="mb-1">{overviewStats.averageRating}</h3>
                            <p className="mb-0">Avg Rating</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="card bg-dark text-white h-100">
                        <div className="card-body text-center">
                            <Target className="mb-2" size={32} />
                            <h3 className="mb-1">{overviewStats.attendanceRate}%</h3>
                            <p className="mb-0">Attendance Rate</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Trends */}
            <div className="row mb-4">
                <div className="col-md-8">
                    <div className="card shadow-sm h-100">
                        <div className="card-header">
                            <h5 className="mb-0 d-flex align-items-center">
                                <TrendingUp className="me-2" size={20} />
                                Performance Trends
                            </h5>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="students" fill="#8884d8" name="Students" />
                                    <Bar yAxisId="left" dataKey="sessions" fill="#82ca9d" name="Sessions" />
                                    <Line yAxisId="right" type="monotone" dataKey="rating" stroke="#ff7300" name="Rating" strokeWidth={3} />
                                    <Line yAxisId="right" type="monotone" dataKey="hours" stroke="#ff0000" name="Hours" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header">
                            <h5 className="mb-0 d-flex align-items-center">
                                Course Distribution
                            </h5>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Progress & Course Analytics */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-header">
                            <h5 className="mb-0 d-flex align-items-center">
                                <BarChart3 className="me-2" size={20} />
                                Student Progress by Course
                            </h5>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={studentProgress}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="progress" fill="#8884d8" name="Progress %" />
                                    <Bar dataKey="avgScore" fill="#82ca9d" name="Avg Score" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-header">
                            <h5 className="mb-0 d-flex align-items-center">
                                <Activity className="me-2" size={20} />
                                Course Performance
                            </h5>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={courseAnalytics}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="students" stackId="1" stroke="#8884d8" fill="#8884d8" name="Students" />
                                    <Area type="monotone" dataKey="completed" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Completed" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance & Assignment Analytics */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-header">
                            <h5 className="mb-0 d-flex align-items-center">
                                <UserCheck className="me-2" size={20} />
                                Attendance Analytics
                            </h5>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={attendanceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="course" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="present" fill="#28a745" name="Present" />
                                    <Bar dataKey="absent" fill="#dc3545" name="Absent" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-header">
                            <h5 className="mb-0 d-flex align-items-center">
                                <FileCheck className="me-2" size={20} />
                                Assignment Statistics
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Assignment</th>
                                            <th>Course</th>
                                            <th>Submitted</th>
                                            <th>Avg Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignmentStats.map((assignment, index) => (
                                            <tr key={index}>
                                                <td>{assignment.title}</td>
                                                <td>{assignment.course}</td>
                                                <td>{assignment.submitted}/{assignment.total}</td>
                                                <td>{assignment.avgScore}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Student List */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 d-flex align-items-center">
                                <Users className="me-2" size={20} />
                                Student Progress Details
                            </h5>
                            <button className="btn btn-outline-primary btn-sm">
                                <Download className="me-2" size={16} />
                                Export
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Student Name</th>
                                            <th>Course</th>
                                            <th>Progress</th>
                                            <th>Attendance</th>
                                            <th>Last Active</th>
                                            <th>Rating</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentList.map((student) => (
                                            <tr key={student.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        {student.name}
                                                    </div>
                                                </td>
                                                <td>{student.course}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="progress me-2" style={{ width: '100px', height: '8px' }}>
                                                            <div
                                                                className="progress-bar"
                                                                style={{ width: `${student.progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <span>{student.progress}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${student.attendance >= 90 ? 'bg-success' : student.attendance >= 80 ? 'bg-warning' : 'bg-danger'}`}>
                                                        {student.attendance}%
                                                    </span>
                                                </td>
                                                <td>{student.lastActive}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <Star className="text-warning me-1" size={16} />
                                                        {student.rating}
                                                    </div>
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-primary">View Details</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Session Analytics */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h5 className="mb-0 d-flex align-items-center">
                                <Calendar className="me-2" size={20} />
                                Recent Session Analytics
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Date</th>
                                            <th>Course</th>
                                            <th>Duration (hrs)</th>
                                            <th>Students</th>
                                            <th>Attendance</th>
                                            <th>Rating</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessionAnalytics.map((session, index) => (
                                            <tr key={index}>
                                                <td>{session.date}</td>
                                                <td>{session.course}</td>
                                                <td>{session.duration}</td>
                                                <td>{session.students}</td>
                                                <td>{session.attendance}/{session.students}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <Star className="text-warning me-1" size={16} />
                                                        {session.rating}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-success">Completed</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;