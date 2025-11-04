import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart } from 'recharts';
import { Calendar, TrendingUp, Users, BookOpen, Clock, Target, CheckCircle, XCircle, Star, Award, BarChart3, Activity, AlertCircle, UserCheck, FileCheck, AlertTriangle, ChevronLeft, ChevronRight, CalendarDays, Download, Filter, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

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

    const handleCheckboxChange = (value) => {
        const newValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onChange(newValues);
    };

    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) {
            return options;
        }
        return options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

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
                                {searchTerm && (
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearchTerm('');
                                        }}
                                        style={{ borderLeft: 'none' }}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                )}
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
                                    <i className="fas fa-search me-2"></i>
                                    {searchTerm ? `No results found for "${searchTerm}"` : `No ${title.toLowerCase()} available`}
                                </div>
                            )}
                        </div>

                        {/* Footer with count */}
                        <div className="options-footer">
                            <small className="text-muted">
                                {selectedValues.length > 0 && (
                                    <span className="me-2">
                                        <i className="fas fa-check-circle text-success me-1"></i>
                                        {selectedValues.length} selected
                                    </span>
                                )}
                                {searchTerm && (
                                    <span>
                                        <i className="fas fa-filter me-1"></i>
                                        {filteredOptions.length} of {options.length} shown
                                    </span>
                                )}
                                {!searchTerm && selectedValues.length === 0 && (
                                    <span>
                                        {options.length} total items
                                    </span>
                                )}
                            </small>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

function Dashboard() {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = JSON.parse(sessionStorage.getItem('token'));

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
    const [coursesData, setCoursesData] = useState([]);
    const [batchesData, setBatchesData] = useState([]);
    const [studentsData, setStudentsData] = useState([]);
    const [assignmentResults, setAssignmentResults] = useState([]);


    const [overviewStats, setOverviewStats] = useState({
        totalStudents: 0,
        activeCourses: 0,
        totalBatches: 0,
        activeBatches: 0,
        averageAttendance: 0,
        batchFreezeStudents: 0,
        totalAssignmentSubmissions: 0,
        averageAssignmentScore: 0
    });

    const [courseWiseData, setCourseWiseData] = useState([]);
    const [batchWiseData, setBatchWiseData] = useState([]);
    const [recentStudents, setRecentStudents] = useState([]);

    const [showFilters, setShowFilters] = useState(false);
    const [selectedCourseFilter, setSelectedCourseFilter] = useState([]);
    const [selectedBatchFilter, setSelectedBatchFilter] = useState([]);
    const [selectedProjectFilter, setSelectedProjectFilter] = useState([]);
    const [selectedTrainerFilter, setSelectedTrainerFilter] = useState([]);
    const [courseOptions, setCourseOptions] = useState([]);
    const [projectOptions, setProjectOptions] = useState([]);
    const [batchOptions, setBatchOptions] = useState([]);
    const [trainerOptions, setTrainerOptions] = useState([]);
    const [dropdownStates, setDropdownStates] = useState({
        course: false,
        batch: false,
        trainer: false,
        project: false
    });

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const anyDropdownOpen = Object.values(dropdownStates).some(state => state);
            if (anyDropdownOpen && !event.target.closest('.multi-select-container-new')) {
                setDropdownStates({
                    course: false,
                    batch: false,
                    trainer: false,
                    project: false
                });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownStates]);

    useEffect(() => {
        if (!showFilters) {
            closeAllDropdowns();
        }
    }, [showFilters]);

    useEffect(() => {
        fetchAllTrainersView();
        fetchAssignmentResults();
        fetchProjects();
        fetchAllTrainers();
        fetchAllCourses();
        fetchAllBatches();
    }, []);

    const fetchAllTrainersView = async () => {
        try {
            setLoading(true);

            const response = await axios.get(`${backendUrl}/college/dashboard/alltrainerscourses`, {
                headers: { 'x-auth': token }
            });

            if (response.data && response.data.status) {
                const trainersData = response.data.data || [];
                const statistics = response.data.statistics || {};

                setCoursesData(trainersData);

                const allCourses = [];
                trainersData.forEach(trainer => {
                    if (trainer.assignedCourses && trainer.assignedCourses.length > 0) {
                        trainer.assignedCourses.forEach(course => {
                            allCourses.push({
                                id: course._id,
                                name: course.name,
                                image: course.image,
                                trainerName: trainer.name,
                                trainerId: trainer._id,
                                projectId: course.project?._id,
                                projectName: course.project?.name
                            });
                        });
                    }
                });

                const allBatches = [];
                const allStudents = [];

                for (const course of allCourses) {
                    try {
                        const batchesResponse = await axios.get(`${backendUrl}/college/getbatchesbytrainerandcourse`, {
                            params: { courseId: course.id },
                            headers: { 'x-auth': token }
                        });

                        if (batchesResponse.data && batchesResponse.data.status && batchesResponse.data.data) {
                            const batches = batchesResponse.data.data.batches || [];

                            batches.forEach(batch => {
                                allBatches.push({
                                    ...batch,
                                    courseName: course.name,
                                    courseId: course.id,
                                    projectId: course.projectId,
                                    projectName: course.projectName,
                                    trainerName: course.trainerName,
                                    trainerId: course.trainerId
                                });
                            });

                            for (const batch of batches) {
                                try {
                                    const studentsResponse = await axios.get(
                                        `${backendUrl}/college/traineradmission-list/${batch._id}?page=1&limit=1000&status=batchFreeze`,
                                        {
                                            headers: { "x-auth": token }
                                        }
                                    );

                                    if (studentsResponse.data.success && studentsResponse.data.data) {
                                        const students = studentsResponse.data.data;
                                        students.forEach(student => {
                                            allStudents.push({
                                                ...student,
                                                batchName: batch.name,
                                                batchId: batch._id,
                                                courseName: course.name,
                                                courseId: course.id,
                                                projectId: course.projectId,
                                                projectName: course.projectName,
                                                trainerName: course.trainerName,
                                                trainerId: course.trainerId
                                            });
                                        });
                                    }
                                } catch (error) {
                                    console.error(`Error fetching students for batch ${batch._id}:`, error);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching batches for course ${course.id}:`, error);
                    }
                }

                setBatchesData(allBatches);
                setStudentsData(allStudents);

                processAnalyticsData(allCourses, allBatches, allStudents);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching all trainers data:', error);
            setLoading(false);
        }
    };

    const fetchAssignmentResults = async () => {
        try {
            const response = await axios.get(`${backendUrl}/college/assignment-submissions`, {
                params: {
                    viewAll: 'true'
                },
                headers: { 'x-auth': token }
            });

            if (response.data && response.data.status) {
                const results = response.data.data || [];
                setAssignmentResults(results);

                if (results.length > 0) {
                    const totalSubmissions = results.length;
                    const totalScore = results.reduce((sum, r) => sum + (r.percentage || 0), 0);
                    const averageScore = totalSubmissions > 0 ? Math.round(totalScore / totalSubmissions) : 0;

                    setOverviewStats(prev => ({
                        ...prev,
                        totalAssignmentSubmissions: totalSubmissions,
                        averageAssignmentScore: averageScore
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching assignment results:', error);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await axios.get(`${backendUrl}/college/trainer/list-projects`, {
                headers: { 'x-auth': token }
            });

            if (response.data && response.data.success) {
                const projects = response.data.data || [];
                setProjectOptions(projects.map(project => ({
                    value: project._id,
                    label: project.name
                })));
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchAllTrainers = async () => {
        try {
            const response = await axios.get(`${backendUrl}/college/trainers`, {
                headers: { 'x-auth': token }
            });

            if (response.data && response.data.status) {
                const trainers = response.data.data || [];
                setTrainerOptions(trainers.map(trainer => ({
                    value: trainer._id,
                    label: trainer.name
                })));
            }
        } catch (error) {
            console.error('Error fetching trainers:', error);
        }
    };

    const fetchAllCourses = async () => {
        try {
            const response = await axios.get(`${backendUrl}/college/all_courses`, {
                headers: { 'x-auth': token }
            });
            // console.log('All Courses Response:', response.data);

            if (response.data && response.data.success && response.data.data) {
                const courses = response.data.data || [];
                setCourseOptions(courses.map(course => ({
                    value: course._id,
                    label: course.name
                })));
            }
        } catch (error) {
            console.error('Error fetching all courses:', error);
        }
    };

    const fetchAllBatches = async () => {
        try {
            const response = await axios.get(`${backendUrl}/college/get_batches`, {
                headers: { 'x-auth': token }
            });
            // console.log('All Batches Response:', response.data);

            if (response.data && response.data.success && response.data.data) {
                const batches = response.data.data || [];
                setBatchOptions(batches.map(batch => ({
                    value: batch._id,
                    label: batch.name,
                    courseId: batch.courseId
                })));
            }
        } catch (error) {
            console.error('Error fetching all batches:', error);
        }
    };

    const processAnalyticsData = (courses, batches, students) => {

        const activeBatches = batches.filter(b => b.status === 'active').length;
        const batchFreezeCount = students.filter(s => s.isBatchFreeze).length;

        setOverviewStats({
            totalStudents: students.length,
            activeCourses: courses.length,
            totalBatches: batches.length,
            activeBatches: activeBatches,
            averageAttendance: 0,
            batchFreezeStudents: batchFreezeCount
        });

        const courseWise = courses.map(course => {
            const courseBatches = batches.filter(b => b.courseId === course.id);
            const courseStudents = students.filter(s => s.courseId === course.id);

            return {
                courseId: course.id,
                courseName: course.name,
                trainerName: course.trainerName,
                trainerId: course.trainerId,
                projectId: course.projectId,
                projectName: course.projectName,
                totalBatches: courseBatches.length,
                activeBatches: courseBatches.filter(b => b.status === 'active').length,
                totalStudents: courseStudents.length,
                batchFreezeStudents: courseStudents.filter(s => s.isBatchFreeze).length
            };
        });
        setCourseWiseData(courseWise);

        const batchWise = batches.map(batch => {
            const batchStudents = students.filter(s => s.batchId === batch._id);

            return {
                batchId: batch._id,
                batchName: batch.name,
                courseName: batch.courseName,
                courseId: batch.courseId,
                projectId: batch.projectId,
                projectName: batch.projectName,
                status: batch.status,
                startDate: batch.startDate,
                endDate: batch.endDate,
                maxStudents: batch.maxStudents,
                currentStudents: batchStudents.length,
                batchFreezeStudents: batchStudents.filter(s => s.isBatchFreeze).length,
                centerName: batch.centerId?.name || 'N/A'
            };
        });
        setBatchWiseData(batchWise);

        const sortedStudents = [...students].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 10);
        setRecentStudents(sortedStudents);
    };

    // fetchProjects(),
    // fetchAllTrainers(),
    // fetchAllCourses(),
    // fetchAllBatches()

    const handleClearFilters = () => {
        setSelectedCourseFilter([]);
        setSelectedBatchFilter([]);
        setSelectedProjectFilter([]);
        setSelectedTrainerFilter([]);
        closeAllDropdowns();
    };

    const handleApplyFilters = () => {
        closeAllDropdowns();
        setShowFilters(false);
    };

    const toggleDropdown = (dropdownName) => {
        setDropdownStates(prev => ({
            ...prev,
            [dropdownName]: !prev[dropdownName]
        }));
    };

    // Close all dropdowns
    const closeAllDropdowns = () => {
        setDropdownStates({
            course: false,
            batch: false,
            trainer: false,
            project: false
        });
    };

    // Apply filters to data
    const filteredCourseWiseData = useMemo(() => {
        let filtered = [...courseWiseData];

        if (selectedCourseFilter.length > 0) {
            filtered = filtered.filter(c => selectedCourseFilter.includes(c.courseId));
        }

        if (selectedProjectFilter.length > 0) {
            filtered = filtered.filter(c => selectedProjectFilter.includes(c.projectId));
        }

        if (selectedTrainerFilter.length > 0) {
            filtered = filtered.filter(c => selectedTrainerFilter.includes(c.trainerId));
        }

        return filtered;
    }, [courseWiseData, selectedCourseFilter, selectedProjectFilter, selectedTrainerFilter]);

    const filteredBatchWiseData = useMemo(() => {
        let filtered = [...batchWiseData];

        if (selectedCourseFilter.length > 0) {
            filtered = filtered.filter(b => selectedCourseFilter.includes(b.courseId));
        }

        if (selectedProjectFilter.length > 0) {
            filtered = filtered.filter(b => selectedProjectFilter.includes(b.projectId));
        }

        if (selectedBatchFilter.length > 0) {
            filtered = filtered.filter(b => selectedBatchFilter.includes(b.batchId));
        }

        return filtered;
    }, [batchWiseData, selectedCourseFilter, selectedProjectFilter, selectedBatchFilter]);

    const filteredStudents = useMemo(() => {
        let filtered = [...recentStudents];

        if (selectedCourseFilter.length > 0) {
            filtered = filtered.filter(s => selectedCourseFilter.includes(s.courseId));
        }

        if (selectedProjectFilter.length > 0) {
            filtered = filtered.filter(s => selectedProjectFilter.includes(s.projectId));
        }

        if (selectedBatchFilter.length > 0) {
            filtered = filtered.filter(s => selectedBatchFilter.includes(s.batchId));
        }

        return filtered;
    }, [recentStudents, selectedCourseFilter, selectedProjectFilter, selectedBatchFilter]);

    const filteredAssignmentResults = useMemo(() => {
        let filtered = [...assignmentResults];

        if (selectedCourseFilter.length > 0) {
            filtered = filtered.filter(result => selectedCourseFilter.includes(result.courseId));
        }

        if (selectedProjectFilter.length > 0) {
            filtered = filtered.filter(result => selectedProjectFilter.includes(result.projectId));
        }

        return filtered;
    }, [assignmentResults, selectedCourseFilter, selectedProjectFilter]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B9D', '#C44569', '#FFA502'];

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Download Assignment Results as Excel
    const downloadAssignmentResultsExcel = async () => {
        if (filteredAssignmentResults.length === 0) {
            alert('No assignment results to download');
            return;
        }

        try {
            const XLSX = await import('xlsx');

            const worksheetData = [];
            const headers = [
                'Student Name',
                'Student Mobile',
                'Student Email',
                'Course',
                'Project',
                'Assignment',
                'Correct',
                'Wrong',
                'Attempted',
                'Unattempted',
                'Marks Obtained',
                'Total Marks',
                'Percentage',
                'Result',
                'Submitted On'
            ];

            worksheetData.push(headers);

            filteredAssignmentResults.forEach(result => {
                worksheetData.push([
                    result.studentName,
                    result.studentMobile,
                    result.studentEmail,
                    result.courseName,
                    result.projectName || 'N/A',
                    result.assignmentTitle,
                    result.correctCount,
                    result.wrongCount,
                    result.attemptedCount,
                    result.unattemptedCount,
                    result.score,
                    result.totalMarks,
                    result.percentage.toFixed(1) + '%',
                    result.pass ? 'Pass' : 'Fail',
                    formatDate(result.submittedAt)
                ]);
            });

            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Assignment Results');

            const colWidths = headers.map(header => ({ wch: Math.max(header.length, 15) }));
            worksheet['!cols'] = colWidths;

            const fileName = `assignment-results-${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
        } catch (error) {
            console.error('Error downloading Excel:', error);
            alert('Failed to download Excel file.');
        }
    };

    if (loading) {
        return (
            <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading trainer dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>

            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h1 className="display-6 fw-bold text-dark mb-2">
                                <Activity className="me-2" size={36} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                                Trainer Dashboard
                            </h1>
                            <p className="text-muted mb-0">
                                All Trainers Performance & Analytics
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <i className="fas fa-filter me-2"></i>
                                
                                {(selectedCourseFilter.length > 0 || selectedBatchFilter.length > 0 || selectedProjectFilter.length > 0 || selectedTrainerFilter.length > 0) && (
                                    <span className="badge bg-danger ms-2">
                                        {selectedCourseFilter.length + selectedBatchFilter.length + selectedProjectFilter.length + selectedTrainerFilter.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showFilters && (
                <div
                    className="modal fade show d-block"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            closeAllDropdowns();
                            setShowFilters(false);
                        }
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            {/* Modal Header */}
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title d-flex align-items-center">
                                    <Filter className="me-2" size={20} />
                                    Filter Dashboard Data
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        closeAllDropdowns();
                                        setShowFilters(false);
                                    }}
                                ></button>
                            </div>

                            {/* Modal Body */}
                            <div className="modal-body">
                                <div className="row g-4">
                                    <div className="col-md-4">
                                        <MultiSelectCheckbox
                                            title="Project"
                                            options={projectOptions}
                                            selectedValues={selectedProjectFilter}
                                            onChange={(values) => {
                                                setSelectedProjectFilter(values);
                                                setSelectedCourseFilter([]);
                                                setSelectedBatchFilter([]);
                                            }}
                                            icon="fas fa-project-diagram"
                                            isOpen={dropdownStates.project}
                                            onToggle={() => toggleDropdown('project')}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <MultiSelectCheckbox
                                            title="Course"
                                            options={courseOptions}
                                            selectedValues={selectedCourseFilter}
                                            onChange={(values) => {
                                                setSelectedCourseFilter(values);
                                                setSelectedBatchFilter([]);
                                            }}
                                            icon="fas fa-graduation-cap"
                                            isOpen={dropdownStates.course}
                                            onToggle={() => toggleDropdown('course')}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <MultiSelectCheckbox
                                            title="Batch"
                                            options={batchOptions.filter(batch =>
                                                selectedCourseFilter.length === 0 ||
                                                selectedCourseFilter.includes(batch.courseId)
                                            )}
                                            selectedValues={selectedBatchFilter}
                                            onChange={setSelectedBatchFilter}
                                            icon="fas fa-layer-group"
                                            isOpen={dropdownStates.batch}
                                            onToggle={() => toggleDropdown('batch')}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <MultiSelectCheckbox
                                            title="Trainer"
                                            options={trainerOptions}
                                            selectedValues={selectedTrainerFilter}
                                            onChange={setSelectedTrainerFilter}
                                            icon="fas fa-user-tie"
                                            isOpen={dropdownStates.trainer}
                                            onToggle={() => toggleDropdown('trainer')}
                                        />
                                    </div>
                                </div>

                                {/* Active Filters Summary */}
                                {(selectedCourseFilter.length > 0 || selectedBatchFilter.length > 0 || selectedProjectFilter.length > 0 || selectedTrainerFilter.length > 0) && (
                                    <div className="row mt-4">
                                        <div className="col-12">
                                            <div className="alert alert-info mb-0">
                                                <div className="d-flex align-items-start">
                                                    <AlertCircle className="me-2 mt-1" size={20} />
                                                    <div className="flex-grow-1">
                                                        <strong className="d-block mb-2">Active Filters:</strong>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {selectedCourseFilter.length > 0 && (
                                                                <div>
                                                                    <small className="text-muted d-block mb-1">Courses:</small>
                                                                    {selectedCourseFilter.map(courseId => {
                                                                        const course = courseOptions.find(c => c.value === courseId);
                                                                        return (
                                                                            <span key={courseId} className="badge bg-primary me-1 mb-1">
                                                                                {course?.label || courseId}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                            {selectedProjectFilter.length > 0 && (
                                                                <div>
                                                                    <small className="text-muted d-block mb-1">Projects:</small>
                                                                    {selectedProjectFilter.map(projectId => {
                                                                        const project = projectOptions.find(p => p.value === projectId);
                                                                        return (
                                                                            <span key={projectId} className="badge bg-info me-1 mb-1">
                                                                                {project?.label || projectId}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                            {selectedBatchFilter.length > 0 && (
                                                                <div>
                                                                    <small className="text-muted d-block mb-1">Batches:</small>
                                                                    {selectedBatchFilter.map(batchId => {
                                                                        const batch = batchOptions.find(b => b.value === batchId);
                                                                        return (
                                                                            <span key={batchId} className="badge bg-success me-1 mb-1">
                                                                                {batch?.label || batchId}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                            {selectedTrainerFilter.length > 0 && (
                                                                <div>
                                                                    <small className="text-muted d-block mb-1">Trainers:</small>
                                                                    {selectedTrainerFilter.map(trainerId => {
                                                                        const trainer = trainerOptions.find(t => t.value === trainerId);
                                                                        return (
                                                                            <span key={trainerId} className="badge bg-warning me-1 mb-1">
                                                                                {trainer?.label || trainerId}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={handleClearFilters}
                                >
                                    <i className="fas fa-times me-1"></i>
                                    Clear Filters
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleApplyFilters}
                                >
                                    <i className="fas fa-check me-1"></i>
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

         
            {/* Overview Stats */}
            <div className="row mb-4">
                <div className="col-md-3 col-sm-6 mb-3">
                    <div className="card bg-gradient-primary text-white border-0 shadow-sm h-100">
                        <div className="card-body text-center">
                            <BookOpen className="mb-2" size={32} />
                            <h3 className="mb-1 fw-bold">{overviewStats.activeCourses}</h3>
                            <p className="mb-0 small">Total Courses</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-sm-6 mb-3">
                    <div className="card bg-gradient-success text-white border-0 shadow-sm h-100">
                        <div className="card-body text-center">
                            <Users className="mb-2" size={32} />
                            <h3 className="mb-1 fw-bold">{overviewStats.totalBatches}</h3>
                            <p className="mb-0 small">Total Batches</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-sm-6 mb-3">
                    <div className="card bg-gradient-info text-white border-0 shadow-sm h-100">
                        <div className="card-body text-center">
                            <CheckCircle className="mb-2" size={32} />
                            <h3 className="mb-1 fw-bold">{overviewStats.activeBatches}</h3>
                            <p className="mb-0 small">Active Batches</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-sm-6 mb-3">
                    <div className="card bg-gradient-warning text-white border-0 shadow-sm h-100">
                        <div className="card-body text-center">
                            <Target className="mb-2" size={32} />
                            <h3 className="mb-1 fw-bold">{overviewStats.totalStudents}</h3>
                            <p className="mb-0 small">Total Students</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course-wise Analytics */}
            <div className="row mb-4">
                <div className="col-md-8">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white">
                            <h5 className="mb-0 d-flex align-items-center">
                                <BarChart3 className="me-2" size={20} />
                                Course-wise Student Distribution
                            </h5>
                        </div>
                        <div className="card-body">
                            {filteredCourseWiseData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={filteredCourseWiseData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="courseName"
                                            tick={{ fontSize: 12, fill: '#666' }}
                                            height={60}
                                            interval={0}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12, fill: '#666' }}
                                            label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            formatter={(value, name, props) => {
                                                if (name === 'totalStudents') {
                                                    return [value, 'Total Students'];
                                                } else if (name === 'batchFreezeStudents') {
                                                    return [value, 'Batch Freeze'];
                                                }
                                                return [value, name];
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{ paddingTop: '20px' }}
                                        />
                                        <Bar
                                            dataKey="totalStudents"
                                            fill="#4F46E5"
                                            name="Total Students"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={60}
                                        >
                                            {filteredCourseWiseData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="#4F46E5" />
                                            ))}
                                        </Bar>
                                        <Bar
                                            dataKey="batchFreezeStudents"
                                            fill="#F59E0B"
                                            name="Batch Freeze"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={60}
                                        >
                                            {filteredCourseWiseData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="#F59E0B" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="fas fa-chart-bar fa-3x mb-3 opacity-50"></i>
                                    <p>No course data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white">
                            <h5 className="mb-0 d-flex align-items-center">
                                <Users className="me-2" size={20} />
                                Student Distribution
                            </h5>
                        </div>
                        <div className="card-body">
                            {filteredCourseWiseData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={filteredCourseWiseData}
                                            dataKey="totalStudents"
                                            nameKey="courseName"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            innerRadius={30}
                                            label={({ courseName, totalStudents, percent }) =>
                                                `${courseName}: ${totalStudents} (${(percent * 100).toFixed(1)}%)`
                                            }
                                            labelLine={false}
                                        >
                                            {filteredCourseWiseData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            formatter={(value, name, props) => [
                                                value,
                                                props.payload.courseName
                                            ]}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value, entry) => (
                                                <span style={{ color: entry.color, fontSize: '12px' }}>
                                                    {value}
                                                </span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="fas fa-chart-pie fa-3x mb-3 opacity-50"></i>
                                    <p>No student data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trainer Comparison Chart */}
            {coursesData.length > 0 && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-header bg-white border-bottom">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 d-flex align-items-center">
                                        <BarChart3 className="me-2 text-primary" size={22} />
                                        Trainer Performance Comparison
                                    </h5>
                                    <div className="d-flex gap-3">
                                        <div className="d-flex align-items-center">
                                            <div style={{width: '12px', height: '12px', backgroundColor: '#3B82F6', borderRadius: '2px', marginRight: '6px'}}></div>
                                            <small className="text-muted">Courses</small>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <div style={{width: '12px', height: '12px', backgroundColor: '#10B981', borderRadius: '2px', marginRight: '6px'}}></div>
                                            <small className="text-muted">Batches</small>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <div style={{width: '12px', height: '12px', backgroundColor: '#F59E0B', borderRadius: '2px', marginRight: '6px'}}></div>
                                            <small className="text-muted">Students</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body" style={{padding: '1.5rem'}}>
                                <ResponsiveContainer width="100%" height={450}>
                                    <BarChart 
                                        data={coursesData.map(trainer => {
                                            const trainerBatches = batchWiseData.filter(b => b.trainerId === trainer._id);
                                            const trainerStudents = studentsData.filter(s => s.trainerId === trainer._id);
                                            return {
                                                name: trainer.name,
                                                Courses: trainer.totalCourses || 0,
                                                Batches: trainerBatches.length || 0,
                                                Students: trainerStudents.length || 0
                                            };
                                        })}
                                        margin={{ top: 20, right: 40, left: 20, bottom: 80 }}
                                        barGap={8}
                                        barCategoryGap="20%"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                        <XAxis 
                                            dataKey="name" 
                                            angle={-35}
                                            textAnchor="end"
                                            height={100}
                                            interval={0}
                                            tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }}
                                        />
                                        <YAxis 
                                            tick={{ fontSize: 13, fill: '#6B7280' }}
                                            axisLine={{ stroke: '#E5E7EB' }}
                                            tickLine={{ stroke: '#E5E7EB' }}
                                            label={{ 
                                                value: 'Count', 
                                                angle: -90, 
                                                position: 'insideLeft',
                                                style: { fontSize: 14, fill: '#6B7280', fontWeight: 600 }
                                            }}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '10px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                                padding: '12px 16px'
                                            }}
                                            labelStyle={{
                                                fontWeight: 600,
                                                color: '#111827',
                                                marginBottom: '8px',
                                                fontSize: '14px'
                                            }}
                                            itemStyle={{
                                                fontSize: '13px',
                                                padding: '4px 0'
                                            }}
                                        />
                                        <Legend 
                                            wrapperStyle={{ 
                                                paddingTop: '25px',
                                                fontSize: '14px'
                                            }}
                                            iconType="rect"
                                            iconSize={14}
                                        />
                                        <Bar 
                                            dataKey="Courses" 
                                            fill="#3B82F6" 
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={60}
                                        />
                                        <Bar 
                                            dataKey="Batches" 
                                            fill="#10B981" 
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={60}
                                        />
                                        <Bar 
                                            dataKey="Students" 
                                            fill="#F59E0B" 
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={60}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Course-wise Details Table */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 d-flex align-items-center">
                                <BookOpen className="me-2" size={20} />
                                Course-wise Progress Report
                            </h5>
                            {/* <Link to="/trainer/mycourses" className="btn btn-sm btn-outline-primary">
                                View All Courses
                            </Link> */}
                        </div>
                        <div className="card-body">
                            {filteredCourseWiseData.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Course Name</th>
                                                <th>Trainer</th>
                                                <th className="text-center">Total Batches</th>
                                                <th className="text-center">Active Batches</th>
                                                <th className="text-center">Total Students</th>
                                                <th className="text-center">Batch Freeze</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCourseWiseData.map((course, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-sm bg-primary text-white rounded d-flex align-items-center justify-content-center me-2">
                                                                {course.courseName.charAt(0)}
                                                            </div>
                                                            <strong>{course.courseName}</strong>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <small className="text-muted">
                                                            <i className="fas fa-user-tie me-1"></i>
                                                            {course.trainerName}
                                                        </small>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-secondary">{course.totalBatches}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-success">{course.activeBatches}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-primary">{course.totalStudents}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-warning">{course.batchFreezeStudents}</span>
                                                    </td>
                                                    {/* <td className="text-center">
                                                        <div className="d-flex align-items-center justify-content-center">
                                                            <div className="progress me-2" style={{ width: '100px', height: '8px' }}>
                                                                <div
                                                                    className="progress-bar bg-success"
                                                                    style={{ width: `${course.totalStudents > 0 ? ((course.totalStudents - course.batchFreezeStudents) / course.totalStudents * 100) : 0}%` }}
                                                                ></div>
                                                            </div>
                                                            <small>{course.totalStudents > 0 ? Math.round((course.totalStudents - course.batchFreezeStudents) / course.totalStudents * 100) : 0}%</small>
                                                        </div>
                                                    </td> */}
                                                    {/* <td>
                                                        <Link
                                                            to={`/trainer/batchmanagement?courseId=${course.courseId}`}
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            <i className="fas fa-eye me-1"></i>View Batches
                                                        </Link>
                                                    </td> */}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <BookOpen size={48} className="mb-3 opacity-50" />
                                    <p>No courses assigned yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Batch-wise Analytics */}
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white">
                            <h5 className="mb-0 d-flex align-items-center">
                                <Users className="me-2" size={20} />
                                Batch-wise Progress Report
                            </h5>
                        </div>
                        <div className="card-body">
                            {filteredBatchWiseData.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Batch Name</th>
                                                <th>Course</th>
                                                <th>Trainer</th>
                                                <th>Center</th>
                                                <th className="text-center">Status</th>
                                                <th className="text-center">Students</th>
                                                <th className="text-center">Capacity</th>
                                                <th className="text-center">Batch Freeze</th>
                                                <th>Start Date</th>
                                                {/* <th>Actions</th> */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBatchWiseData.slice(0, 10).map((batch, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <i className="fas fa-layer-group me-2 text-primary"></i>
                                                            <strong>{batch.batchName}</strong>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <small className="text-muted">{batch.courseName}</small>
                                                    </td>
                                                    <td>
                                                        <small className="text-muted">
                                                            <i className="fas fa-user-tie me-1"></i>
                                                            {batch.trainerName || 'N/A'}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <small>{batch.centerName}</small>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`badge ${batch.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                                            {batch.status || 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-info">{batch.currentStudents}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-secondary">{batch.maxStudents || 'N/A'}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-warning">{batch.batchFreezeStudents}</span>
                                                    </td>
                                                    <td>
                                                        <small>{formatDate(batch.startDate)}</small>
                                                    </td>
                                                    {/* <td>
                                                        <Link
                                                            to={`/trainer/students?batchId=${batch.batchId}&batchName=${encodeURIComponent(batch.batchName)}&courseId=${batch.courseId}`}
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            <i className="fas fa-users me-1"></i>View Students
                                                        </Link>
                                                </td> */}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <Users size={48} className="mb-3 opacity-50" />
                                    <p>No batches assigned yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Students */}
            <div className="row mb-4">
                <div className="col-12" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                    <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 d-flex align-items-center">
                                <UserCheck className="me-2" size={20} />
                                Recent Student Enrollments
                            </h5>
                            <span className="badge bg-primary">{studentsData.length} Total Students</span>
                        </div>
                        <div className="card-body p-3">
                            {filteredStudents.length > 0 ? (
                                <div className="table-responsive recent-students-table" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                    <table className="table table-hover table-sm mb-0" style={{ fontSize: '0.875rem' }}>
                                        <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                            <tr>
                                                <th style={{ minWidth: '160px', maxWidth: '180px' }}>Student</th>
                                                <th style={{ minWidth: '130px', maxWidth: '150px' }}>Course</th>
                                                <th style={{ minWidth: '100px', maxWidth: '120px' }}>Batch</th>
                                                <th style={{ minWidth: '110px', maxWidth: '130px' }}>Trainer</th>
                                                <th style={{ minWidth: '100px', maxWidth: '120px' }}>Center</th>
                                                <th style={{ minWidth: '140px', maxWidth: '160px' }}>Email</th>
                                                <th style={{ minWidth: '100px', maxWidth: '110px' }}>Phone</th>
                                                <th style={{ minWidth: '90px', maxWidth: '100px', textAlign: 'center' }}>Status</th>
                                                <th style={{ minWidth: '100px', maxWidth: '110px' }}>Enrolled</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map((student, index) => (
                                                <tr key={index}>
                                                    <td style={{ maxWidth: '180px' }}>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-circle me-2" style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                color: 'white',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.8rem',
                                                                flexShrink: 0
                                                            }}>
                                                                {student._candidate?.name ? student._candidate.name.charAt(0).toUpperCase() : 'N'}
                                                            </div>
                                                            <div style={{ overflow: 'hidden' }}>
                                                                <div className="fw-bold" style={{ 
                                                                    fontSize: '0.875rem',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}>{student._candidate?.name || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ maxWidth: '150px' }}>
                                                        <small style={{ 
                                                            display: 'block',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }} title={student.courseName}>{student.courseName}</small>
                                                    </td>
                                                    <td style={{ maxWidth: '120px' }}>
                                                        <small style={{ 
                                                            display: 'block',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }} title={student.batchName}>{student.batchName}</small>
                                                    </td>
                                                    <td style={{ maxWidth: '130px' }}>
                                                        <small className="text-muted" style={{ 
                                                            display: 'block',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }} title={student.trainerName}>
                                                            <i className="fas fa-user-tie me-1"></i>
                                                            {student.trainerName || 'N/A'}
                                                        </small>
                                                    </td>
                                                    <td style={{ maxWidth: '120px' }}>
                                                        <small style={{ 
                                                            display: 'block',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }} title={student._center?.name}>{student._center?.name || 'N/A'}</small>
                                                    </td>
                                                    <td style={{ maxWidth: '160px' }}>
                                                        <small style={{ 
                                                            display: 'block',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }} title={student._candidate?.email}>{student._candidate?.email || 'N/A'}</small>
                                                    </td>
                                                    <td style={{ maxWidth: '110px' }}>
                                                        <small style={{ whiteSpace: 'nowrap' }}>{student._candidate?.mobile || 'N/A'}</small>
                                                    </td>
                                                    <td style={{ textAlign: 'center', maxWidth: '100px' }}>
                                                        {student.isBatchFreeze ? (
                                                            <span className="badge bg-warning" style={{ fontSize: '0.75rem' }}>Freeze</span>
                                                        ) : student.dropout ? (
                                                            <span className="badge bg-danger" style={{ fontSize: '0.75rem' }}>Dropout</span>
                                                        ) : (
                                                            <span className="badge bg-success" style={{ fontSize: '0.75rem' }}>Active</span>
                                                        )}
                                                    </td>
                                                    <td style={{ maxWidth: '110px' }}>
                                                        <small style={{ whiteSpace: 'nowrap' }}>{formatDate(student.createdAt)}</small>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <UserCheck size={48} className="mb-3 opacity-50" />
                                    <p>No students enrolled yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mb-4">
                <div className="col-12" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                    <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 d-flex align-items-center">
                                <FileCheck className="me-2" size={20} />
                                Assignment Results
                            </h5>
                            <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-primary">{filteredAssignmentResults.length} Submissions</span>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-success"
                                    onClick={downloadAssignmentResultsExcel}
                                    disabled={filteredAssignmentResults.length === 0}
                                >
                                    <Download size={16} className="me-1" />
                                    Export
                                </button>
                            </div>
                        </div>
                        <div className="card-body p-3">
                            {filteredAssignmentResults.length > 0 ? (
                                <div className="table-responsive recent-students-table" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                    <table className="table table-hover table-sm mb-0" style={{ fontSize: '0.875rem' }}>
                                        <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                            <tr>
                                                <th style={{ minWidth: '150px', maxWidth: '170px' }}>Student</th>
                                                <th style={{ minWidth: '120px', maxWidth: '140px' }}>Course</th>
                                                <th style={{ minWidth: '110px', maxWidth: '130px' }}>Trainer</th>
                                                <th style={{ minWidth: '130px', maxWidth: '150px' }}>Assignment</th>
                                                <th className="text-center" style={{ minWidth: '70px', maxWidth: '80px' }}>✓</th>
                                                <th className="text-center" style={{ minWidth: '70px', maxWidth: '80px' }}>✗</th>
                                                <th className="text-center" style={{ minWidth: '80px', maxWidth: '90px' }}>Marks</th>
                                                <th className="text-center" style={{ minWidth: '70px', maxWidth: '80px' }}>Total</th>
                                                <th className="text-center" style={{ minWidth: '70px', maxWidth: '80px' }}>%</th>
                                                <th className="text-center" style={{ minWidth: '70px', maxWidth: '80px' }}>Result</th>
                                                <th style={{ minWidth: '100px', maxWidth: '110px' }}>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAssignmentResults.map((result, index) => (
                                                <tr key={index}>
                                                    <td style={{ maxWidth: '170px' }}>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-circle me-2" style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                color: 'white',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.8rem',
                                                                flexShrink: 0
                                                            }}>
                                                                {result.studentName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ overflow: 'hidden' }}>
                                                                <div className="fw-bold" style={{ 
                                                                    fontSize: '0.875rem',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}>{result.studentName}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ maxWidth: '140px' }}>
                                                        <small style={{ 
                                                            display: 'block',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }} title={result.courseName}>{result.courseName}</small>
                                                    </td>
                                                    <td style={{ maxWidth: '130px' }}>
                                                        <small className="text-muted" style={{ 
                                                            display: 'block',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }} title={result.trainerNames && result.trainerNames.length > 0 ? result.trainerNames.join(', ') : 'N/A'}>
                                                            {result.trainerNames && result.trainerNames.length > 0 
                                                                ? result.trainerNames.join(', ') 
                                                                : 'N/A'}
                                                        </small>
                                                    </td>
                                                    <td style={{ maxWidth: '150px' }}>
                                                        <small style={{ 
                                                            display: 'block',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }} title={result.assignmentTitle}>{result.assignmentTitle}</small>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-success" style={{ fontSize: '0.75rem' }}>{result.correctCount}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-danger" style={{ fontSize: '0.75rem' }}>{result.wrongCount}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-primary" style={{ fontSize: '0.75rem' }}>{result.score}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-secondary" style={{ fontSize: '0.75rem' }}>{result.totalMarks}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`badge ${result.percentage >= 75 ? 'bg-success' : result.percentage >= 50 ? 'bg-warning' : 'bg-danger'}`} style={{ fontSize: '0.75rem' }}>
                                                            {result.percentage.toFixed(0)}%
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        {result.pass ? (
                                                            <span className="badge bg-success" style={{ fontSize: '0.75rem' }}>
                                                                Pass
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-danger" style={{ fontSize: '0.75rem' }}>
                                                                Fail
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ maxWidth: '110px' }}>
                                                        <small style={{ whiteSpace: 'nowrap' }}>{formatDate(result.submittedAt)}</small>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <FileCheck size={48} className="mb-3 opacity-50" />
                                    <p>No assignment submissions yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white">
                            <h5 className="mb-0 d-flex align-items-center">
                                <BarChart3 className="me-2" size={20} />
                                Batch Capacity Analysis
                            </h5>
                        </div>
                        <div className="card-body">
                            {filteredBatchWiseData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={filteredBatchWiseData.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="batchName"
                                            angle={-45}
                                            textAnchor="end"
                                            height={120}
                                            tick={{ fontSize: 12, fill: '#666' }}
                                            interval={0}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12, fill: '#666' }}
                                            label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{ paddingTop: '20px' }}
                                        />
                                        <Bar
                                            dataKey="currentStudents"
                                            fill="#00C49F"
                                            name="Current Students"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={50}
                                        />
                                        <Bar
                                            dataKey="maxStudents"
                                            fill="#0088FE"
                                            name="Max Capacity"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={50}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="fas fa-chart-bar fa-3x mb-3 opacity-50"></i>
                                    <p>No batch data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white">
                            <h5 className="mb-0 d-flex align-items-center">
                                <Activity className="me-2" size={20} />
                                Batch Status Distribution
                            </h5>
                        </div>
                        <div className="card-body">
                            {filteredBatchWiseData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Active Batches', value: filteredBatchWiseData.filter(b => b.status === 'active').length },
                                                { name: 'Inactive Batches', value: filteredBatchWiseData.filter(b => b.status !== 'active').length }
                                            ].sort((a, b) => a.name.localeCompare(b.name))}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="45%"
                                            outerRadius={80}
                                            innerRadius={40}
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
                                                const RADIAN = Math.PI / 180;
                                                const radius = outerRadius + 25;
                                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                                return (
                                                    <text
                                                        x={x}
                                                        y={y}
                                                        fill="#333"
                                                        textAnchor={x > cx ? 'start' : 'end'}
                                                        dominantBaseline="central"
                                                        style={{ fontSize: '13px', fontWeight: '600' }}
                                                    >
                                                        {`${value} (${((value / filteredBatchWiseData.length) * 100).toFixed(1)}%)`}
                                                    </text>
                                                );
                                            }}
                                            labelLine={{
                                                stroke: '#999',
                                                strokeWidth: 1
                                            }}
                                        >
                                            <Cell fill="#28a745" />
                                            <Cell fill="#dc3545" />
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={50}
                                            formatter={(value, entry) => (
                                                <span style={{ fontSize: '13px', fontWeight: '500' }}>
                                                    {value}
                                                </span>
                                            )}
                                            iconSize={12}
                                            iconType="circle"
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="fas fa-chart-pie fa-3x mb-3 opacity-50"></i>
                                    <p>No batch data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Styles */}
            <style>{`
                /* View Mode Selector Styles */}
                .stats-mini {
                    display: flex;
                    gap: 1rem;
                    padding: 0.5rem;
                    background: #f8f9fa;
                    border-radius: 0.5rem;
                }

                .stats-mini .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 0.5rem 1rem;
                    background: white;
                    border-radius: 0.375rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    min-width: 80px;
                }

                .stats-mini .stat-item i {
                    font-size: 1.5rem;
                    margin-bottom: 0.25rem;
                }

                .stats-mini .stat-item strong {
                    font-size: 1.25rem;
                    font-weight: 700;
                    line-height: 1;
                }

                .stats-mini .stat-item small {
                    font-size: 0.75rem;
                    margin-top: 0.25rem;
                }

                .btn-group .btn {
                    font-weight: 600;
                    padding: 0.5rem 1.25rem;
                }

                .btn-group .btn i {
                    font-size: 1rem;
                }

                /* Trainer Overview Table Enhancements */
                .table tbody tr {
                    cursor: pointer;
                }

                .table tbody tr:hover {
                    background-color: rgba(79, 70, 229, 0.05);
                }

                .avatar-sm {
                    font-size: 1.1rem;
                    font-weight: 700;
                }

                /* Responsive adjustments for view mode */
                @media (max-width: 768px) {
                    .stats-mini {
                        flex-wrap: wrap;
                        justify-content: center;
                    }

                    .btn-group {
                        width: 100%;
                    }

                    .btn-group .btn {
                        flex: 1;
                    }
                }

                .bg-gradient-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .bg-gradient-success {
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                }
                .bg-gradient-info {
                    background: linear-gradient(135deg, #17a2b8 0%, #00cfe8 100%);
                }
                .bg-gradient-warning {
                    background: linear-gradient(135deg, #ffc107 0%, #ff9f43 100%);
                }
                .bg-gradient-danger {
                    background: linear-gradient(135deg, #dc3545 0%, #ea5455 100%);
                }
                .bg-gradient-dark {
                    background: linear-gradient(135deg, #343a40 0%, #5e5873 100%);
                }
                
                .card {
                    transition: all 0.3s ease;
                    border: none;
                }
                
                .card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
                }
                
                .table thead th {
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.5px;
                    color: #6c757d;
                    border-bottom: 2px solid #dee2e6;
                }
                
                .table tbody tr {
                    transition: all 0.2s ease;
                }
                
                .table tbody tr:hover {
                    background-color: rgba(0, 123, 255, 0.05);
                }
                
                .avatar-sm {
                    width: 32px;
                    height: 32px;
                    font-size: 0.9rem;
                }
                
                .badge {
                    padding: 0.35rem 0.65rem;
                    font-weight: 500;
                    font-size: 0.75rem;
                }
                
                .card-header {
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                    padding: 1rem 1.25rem;
                }
                
                .progress {
                    background-color: #e9ecef;
                    border-radius: 10px;
                }
                
                .progress-bar {
                    border-radius: 10px;
                    transition: width 0.6s ease;
                }
                
                @media (max-width: 768px) {
                    .table {
                        font-size: 0.875rem;
                    }
                    
                    .display-6 {
                        font-size: 1.5rem;
                    }
                }

                /* MultiSelectCheckbox Styles */
                .multi-select-container-new {
                    position: relative;
                }

                .multi-select-dropdown-new {
                    position: relative;
                }

                .multi-select-trigger {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 0.5rem 1rem;
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 0.375rem;
                    transition: all 0.2s ease;
                }

                .multi-select-trigger:hover {
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.1);
                }

                .multi-select-trigger.open {
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
                }

                .select-display-text {
                    flex: 1;
                    text-align: left;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .dropdown-arrow {
                    margin-left: 0.5rem;
                    transition: transform 0.2s ease;
                    font-size: 0.75rem;
                }

                .multi-select-options-new {
                    position: absolute;
                    top: calc(100% + 4px);
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 0.375rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 1050;
                    max-height: 300px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .options-search {
                    padding: 0.75rem;
                    border-bottom: 1px solid #e9ecef;
                }

                .options-search .input-group-text {
                    background-color: #f8f9fa;
                    border-right: none;
                }

                .options-search .form-control {
                    border-left: none;
                    border-right: none;
                }

                .options-search .form-control:focus {
                    box-shadow: none;
                    border-color: #dee2e6;
                }

                .options-search .btn {
                    padding: 0.25rem 0.5rem;
                    border-top-left-radius: 0;
                    border-bottom-left-radius: 0;
                }

                .options-search .btn:hover {
                    background-color: #dc3545;
                    border-color: #dc3545;
                    color: white;
                }

                .options-list-new {
                    overflow-y: auto;
                    max-height: 200px;
                }

                .option-item-new {
                    display: flex;
                    align-items: center;
                    padding: 0.625rem 1rem;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    margin: 0;
                }

                .option-item-new:hover {
                    background-color: #f8f9fa;
                }

                .option-label-new {
                    flex: 1;
                    font-size: 0.875rem;
                }

                .options-footer {
                    padding: 0.5rem 1rem;
                    border-top: 1px solid #e9ecef;
                    background-color: #f8f9fa;
                }

                .no-options {
                    padding: 1rem;
                    text-align: center;
                    color: #6c757d;
                    font-size: 0.875rem;
                }

                /* Recent Students Table - Compact & Responsive */
                .recent-students-table {
                    max-height: 450px;
                    overflow-y: auto;
                    overflow-x: auto;
                    display: block;
                }

                .recent-students-table table {
                    width: 100%;
                    display: table;
                    table-layout: auto;
                }

                .recent-students-table table.table-sm th,
                .recent-students-table table.table-sm td {
                    padding: 0.5rem 0.6rem;
                    vertical-align: middle;
                    white-space: nowrap;
                }

                .recent-students-table thead {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    background-color: #f8f9fa;
                }

                /* Vertical Scrollbar */
                .recent-students-table::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                .recent-students-table::-webkit-scrollbar-track {
                    background: #f8f9fa;
                    border-radius: 4px;
                }

                .recent-students-table::-webkit-scrollbar-thumb {
                    background: #cbd5e0;
                    border-radius: 4px;
                    transition: background 0.2s ease;
                }

                .recent-students-table::-webkit-scrollbar-thumb:hover {
                    background: #a0aec0;
                }

                /* Make horizontal scrollbar less prominent */
                .recent-students-table::-webkit-scrollbar-corner {
                    background: #f8f9fa;
                }

                /* Reduce horizontal scroll necessity */
                .table-responsive {
                    -webkit-overflow-scrolling: touch;
                }
                
                @media (max-width: 1400px) {
                    .recent-students-table table {
                        font-size: 0.813rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default Dashboard;