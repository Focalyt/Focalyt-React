import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TimeTable() {
    // State Management
    const [viewMode, setViewMode] = useState('week'); // day, week, month
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sessions, setSessions] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [draggedSession, setDraggedSession] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [trainers, setTrainers] = useState([]);

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const token = JSON.parse(sessionStorage.getItem('token'));
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [loading, setLoading] = useState(false);

    // Advanced Features State
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [attendanceSession, setAttendanceSession] = useState(null);
    const [attendanceData, setAttendanceData] = useState({
        totalStudents: 0,
        presentStudents: 0,
        absentStudents: 0
    });


    const [scheduleForm, setScheduleForm] = useState({
        title: '',
        trainerId: '',
        trainerName: '',
        batchId: '',
        batchName: '',
        subject: '',
        date: '',
        startTime: '',
        endTime: '',
        duration: '',
        description: '',
        color: '#3498db',
        scheduleType: 'single',
        isRecurring: false,
        recurringType: '',
        recurringEndDate: '',
        weekTopics: {
            monday: '',
            tuesday: '',
            wednesday: '',
            thursday: '',
            friday: '',
            saturday: '',
            sunday: ''
        },
        monthTopics: {
            week1: {
                monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
            },
            week2: {
                monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
            },
            week3: {
                monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
            },
            week4: {
                monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
            }
        }
    });

    const clearScheduledData = () => {
        setScheduleForm({
            title: '',
            trainerId: '',
            trainerName: '',
            batchId: '',
            batchName: '',
            subject: '',
            date: '',
            startTime: '',
            endTime: '',
            duration: '',
            description: '',
            color: '#3498db',
            scheduleType: 'single',
            isRecurring: false,
            recurringType: '',
            recurringEndDate: '',
            weekTopics: {
                monday: '',
                tuesday: '',
                wednesday: '',
                thursday: '',
                friday: '',
                saturday: '',
                sunday: ''
            },
            monthTopics: {
                week1: {
                    monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
                },
                week2: {
                    monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
                },
                week3: {
                    monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
                },
                week4: {
                    monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
                }
            }
        });
    };


    const [availabilityForm, setAvailabilityForm] = useState({
        status: 'available',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        reason: ''
    });

    const [availability, setAvailability] = useState([]);


    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

    // Attendance Handler
    const handleMarkAttendance = (session) => {
        setAttendanceSession(session);
        setAttendanceData({
            totalStudents: session.attendance?.totalStudents || 0,
            presentStudents: session.attendance?.presentStudents || 0,
            absentStudents: session.attendance?.absentStudents || 0
        });
        setShowAttendanceModal(true);
    };

    const handleAttendanceSubmit = async (e) => {
        e.preventDefault();
        try {
            const attendancePercentage = attendanceData.totalStudents > 0
                ? ((attendanceData.presentStudents / attendanceData.totalStudents) * 100).toFixed(2)
                : 0;

            // Here you would make API call to save attendance
            console.log('Saving attendance:', {
                sessionId: attendanceSession.id,
                ...attendanceData,
                attendancePercentage
            });

            // Update local session
            const updatedSessions = sessions.map(s => {
                if (s.id === attendanceSession.id) {
                    return {
                        ...s,
                        attendance: {
                            ...attendanceData,
                            attendancePercentage: parseFloat(attendancePercentage)
                        },
                        status: 'completed'
                    };
                }
                return s;
            });

            setSessions(updatedSessions);
            setShowAttendanceModal(false);
            alert('Attendance marked successfully!');
        } catch (err) {
            console.error('Error saving attendance:', err);
            alert('Failed to save attendance');
        }
    };

    useEffect(() => {
        fetchCourses();
        fetchTrainers();
    }, []);


    useEffect(() => {
        if (selectedCourse) {
            fetchBatches(selectedCourse);
        } else {
            setBatches([]);
        }
    }, [selectedCourse]);


    const fetchCourses = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/college/gettrainersbycourse`, {
                headers: {
                    'x-auth': token
                }
            });

            // console.log('Courses response:', response.data);

            if (response.data && response.data.status && response.data.data) {
                const allCourses = [];
                response.data.data.forEach(trainer => {
                    if (trainer.assignedCourses && trainer.assignedCourses.length > 0) {
                        trainer.assignedCourses.forEach(course => {
                            if (!allCourses.find(c => c._id === course._id)) {
                                allCourses.push(course);
                            }
                        });
                    }
                });
                setCourses(allCourses);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            alert('Failed to fetch courses. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchBatches = async (courseId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/college/getbatchesbytrainerandcourse`, {
                params: { courseId },
                headers: {
                    'x-auth': token
                }
            });

            console.log('Batches response:', response.data);

            if (response.data && response.data.status && response.data.data) {
                setBatches(response.data.data.batches || []);
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
            alert('Failed to fetch batches. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTrainers = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${backendUrl}/college/trainers`,
                {
                    headers: {
                        'x-auth': token,
                        'Content-Type': 'application/json'
                    }
                }
            );
            // console.log("response" , response.data)


            if (response.data.status && response.data.data) {
                setTrainers(response.data.data);
            } else {
                setTrainers([]);
                alert(response.data.message || 'No trainers found');
            }

        } catch (error) {
            console.error('Error fetching trainers:', error);
            alert(
                error?.response?.data?.message || 'Failed to fetch trainers',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };
    const handleScheduleSubmit = async (e) => {
        e.preventDefault()
        try {
            const sessionData = {
                trainerId: scheduleForm.trainerId,
                trainerName: scheduleForm.trainerName,
                batchId: scheduleForm.batchId,
                batchName: scheduleForm.batchName,
                courseId: selectedCourse,
                courseName: courses.find(c => c._id === selectedCourse)?.name || '',
                subject: scheduleForm.subject,
                date: scheduleForm.date,
                startTime: scheduleForm.startTime,
                endTime: scheduleForm.endTime,
                title: scheduleForm.title,
                description: scheduleForm.description,
                color: scheduleForm.color,
                scheduleType: scheduleForm.scheduleType,

                // Recurring fields
                isRecurring: scheduleForm.isRecurring,
                recurringType: scheduleForm.isRecurring ? scheduleForm.recurringType : null,
                recurringEndDate: scheduleForm.isRecurring ? scheduleForm.recurringEndDate : null,
            };

            // Add schedule type specific data
            if (scheduleForm.scheduleType === 'weekly') {
                sessionData.weekTopics = scheduleForm.weekTopics;
            } else if (scheduleForm.scheduleType === 'monthly') {
                sessionData.monthTopics = scheduleForm.monthTopics;
            }

            console.log('Frontend sending data:', sessionData);

            const response = await axios.post(`${backendUrl}/college/scheduledTimeTable`, sessionData, {
                headers: {
                    'x-auth': token
                }
            });

            // console.log('response:', response.data);

            if (response.data.status) {
                alert('Schedule created successfully!');
                clearScheduledData();
                setShowScheduleModal(false);
                setSelectedCourse('');
                timeTable(); // Refresh timetable
            } else {
                alert(response.data.message || 'Failed to create schedule');
            }

        } catch (err) {
            console.log('Error fetching timetable:', err);
        }
    }
    useEffect(() => {
        timeTable()
    }, [])
    const timeTable = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`${backendUrl}/college/trainerTimeTable`, {
                headers: {
                    'x-auth': token
                }
            });
            // console.log("timetable", response.data);

            if (response.data.status && response.data.data) {
                const allSessions = [];

                response.data.data.forEach((session, index) => {
                    if (session.scheduleType === 'weekly' && session.weekTopics) {
                        const baseDate = new Date(session.date);
                        const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

                        weekDays.forEach((day, dayIndex) => {
                            if (session.weekTopics[day] && session.weekTopics[day].trim() !== '') {
                                const sessionDate = new Date(baseDate);
                                sessionDate.setDate(baseDate.getDate() + (dayIndex - baseDate.getDay()));

                                allSessions.push({
                                    id: `${session._id}_${day}`,
                                    originalId: session._id,
                                    title: session.weekTopics[day],
                                    trainerName: session.trainerId?.name,
                                    batchName: session.batchName,
                                    courseName: session.courseName,
                                    subject: session.subject,
                                    date: sessionDate,
                                    startTime: session.startTime,
                                    endTime: session.endTime,
                                    description: `${session.description} - ${day.charAt(0).toUpperCase() + day.slice(1)}`,
                                    color: session.color,
                                    scheduleType: session.scheduleType,
                                    weekTopics: session.weekTopics,
                                    monthTopics: session.monthTopics,
                                    status: session.status,
                                    attendance: session.attendance,
                                    isRecurring: session.isRecurring,
                                    recurringType: session.recurringType,
                                    recurringEndDate: session.recurringEndDate,
                                    hasConflict: session.hasConflict,
                                    isDeleted: session.isDeleted,
                                    deletedAt: session.deletedAt,
                                    createdAt: session.createdAt,
                                    updatedAt: session.updatedAt,
                                    dayOfWeek: day,
                                    isWeeklySession: true
                                });
                            }
                        });
                    } else {
                        allSessions.push({
                            id: session._id,
                            title: session.title,
                            trainerName: session.trainerId?.name,
                            batchName: session.batchName,
                            courseName: session.courseName,
                            subject: session.subject,
                            date: new Date(session.date),
                            startTime: session.startTime,
                            endTime: session.endTime,
                            description: session.description,
                            color: session.color,
                            scheduleType: session.scheduleType,
                            weekTopics: session.weekTopics,
                            monthTopics: session.monthTopics,
                            status: session.status,
                            attendance: session.attendance,
                            isRecurring: session.isRecurring,
                            recurringType: session.recurringType,
                            recurringEndDate: session.recurringEndDate,
                            hasConflict: session.hasConflict,
                            isDeleted: session.isDeleted,
                            deletedAt: session.deletedAt,
                            createdAt: session.createdAt,
                            updatedAt: session.updatedAt,
                            isWeeklySession: false
                        });
                    }
                });

                setSessions(allSessions);
            }
            setLoading(false);
        }
        catch (err) {
            console.error('Error fetching timetable:', err);
            setLoading(false);
        }
    }
    // Date navigation
    const navigateDate = (direction) => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() + direction);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction * 7));
        } else {
            newDate.setMonth(newDate.getMonth() + direction);
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };



    const checkConflict = (newSession) => {
        return sessions.some(session => {
            if (session.date.toDateString() !== new Date(newSession.date).toDateString()) {
                return false;
            }
            const newStart = timeToMinutes(newSession.startTime);
            const newEnd = timeToMinutes(newSession.endTime);
            const existingStart = timeToMinutes(session.startTime);
            const existingEnd = timeToMinutes(session.endTime);

            return (newStart < existingEnd && newEnd > existingStart);
        });
    };

    const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const resetScheduleForm = () => {
        setScheduleForm({
            title: '',
            trainerId: '',
            trainerName: '',
            batchId: '',
            batchName: '',
            subject: '',
            date: '',
            startTime: '',
            endTime: '',
            duration: '',
            description: '',
            color: '#3498db',
            scheduleType: 'single',
            isRecurring: false,
            recurringType: '',
            recurringEndDate: '',
            weekTopics: {
                monday: '',
                tuesday: '',
                wednesday: '',
                thursday: '',
                friday: '',
                saturday: '',
                sunday: ''
            },
            monthTopics: {
                week1: {
                    monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
                },
                week2: {
                    monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
                },
                week3: {
                    monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
                },
                week4: {
                    monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
                }
            }
        });
        setSelectedCourse('');
    };

    // Drag and Drop
    const handleDragStart = (session) => {
        setDraggedSession(session);
    };

    const handleDrop = (newDate, newTime) => {
        if (!draggedSession) return;

        const updatedSessions = sessions.map(session => {
            if (session.id === draggedSession.id) {
                return {
                    ...session,
                    date: newDate,
                    startTime: newTime
                };
            }
            return session;
        });

        setSessions(updatedSessions);
        setDraggedSession(null);
    };

    // Availability Management
    const handleAvailabilitySubmit = (e) => {
        e.preventDefault();
        const newAvailability = {
            id: Date.now(),
            ...availabilityForm,
            startDate: new Date(availabilityForm.startDate),
            endDate: new Date(availabilityForm.endDate)
        };
        setAvailability([...availability, newAvailability]);
        setShowAvailabilityModal(false);
    };



    // Get week days
    const getWeekDays = () => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(day.getDate() + i);
            days.push(day);
        }
        return days;
    };

    // Get sessions for a specific date
    const getSessionsForDate = (date) => {
        return sessions.filter(session =>
            session.date.toDateString() === date.toDateString()
        ).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    };

    // Time slots for grid
    const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const workingHours = timeSlots.filter((_, i) => i >= 8 && i <= 18); // 8 AM to 6 PM

    // Format date
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Render Calendar Views
    const renderDayView = () => {
        const daySession = getSessionsForDate(currentDate);

        return (
            <div className="day-view">
                <div className="time-grid">
                    {workingHours.map(time => (
                        <div key={time} className="time-slot" onDrop={() => handleDrop(currentDate, time)}>
                            <div className="time-label">{time}</div>
                            <div className="slot-content">
                                {daySession.filter(s => s.startTime === time).map(session => (
                                    <div
                                        key={session.id}
                                        className="session-card"
                                        style={{ borderLeftColor: session.color }}
                                        draggable
                                        onDragStart={() => handleDragStart(session)}
                                        onClick={() => setSelectedSession(session)}
                                    >
                                        <div className="session-header">
                                            <strong>{session.title}</strong>
                                            <button
                                                className="btn-delete"
                                                onClick={(e) => { e.stopPropagation(); }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <div className="session-info">
                                            <span className="badge" style={{ backgroundColor: session.color }}>
                                                {session.batchName}
                                            </span>
                                            <span className="time">{session.startTime} - {session.endTime}</span>
                                        </div>
                                        <div className="session-subject">{session.subject}</div>
                                        {session.monthTopics && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                marginTop: '0.25rem',
                                                fontSize: '0.75rem',
                                                color: '#4caf50'
                                            }}>
                                                <i className="fas fa-calendar-week" style={{ fontSize: '0.7rem' }}></i>
                                                <span>Monthly Topics Available</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        const weekDays = getWeekDays();

        return (
            <div className="week-view">
                <div className="week-grid">
                    <div className="week-header">
                        <div className="time-column-header">Time</div>
                        {weekDays.map(day => (
                            <div key={day.toString()} className="day-header">
                                <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                <div className="day-date">{day.getDate()}</div>
                            </div>
                        ))}
                    </div>
                    <div className="week-body">
                        {workingHours.map(time => (
                            <div key={time} className="week-row">
                                <div className="time-cell">{time}</div>
                                {weekDays.map(day => {
                                    const daySessions = getSessionsForDate(day).filter(s => s.startTime === time);
                                    return (
                                        <div
                                            key={`${day}-${time}`}
                                            className="day-cell"
                                            onDrop={() => handleDrop(day, time)}
                                            onDragOver={(e) => e.preventDefault()}
                                        >
                                            {daySessions.map(session => (
                                                <div
                                                    key={session.id}
                                                    className="mini-session"
                                                    style={{ backgroundColor: session.color }}
                                                    draggable
                                                    onDragStart={() => handleDragStart(session)}
                                                    onClick={() => setSelectedSession(session)}
                                                >
                                                    <div className="mini-session-title">{session.title}</div>
                                                    <div className="mini-session-batch">{session.batchName}</div>
                                                    {session.monthTopics && (
                                                        <div style={{
                                                            fontSize: '0.6rem',
                                                            color: 'rgba(255,255,255,0.9)',
                                                            marginTop: '0.1rem'
                                                        }}>
                                                            📅 Monthly Topics
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const days = [];
        const current = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return (
            <div className="month-view">
                <div className="month-grid">
                    <div className="month-header">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="month-day-header">{day}</div>
                        ))}
                    </div>
                    <div className="month-body">
                        {days.map((day, idx) => {
                            const daySessions = getSessionsForDate(day);
                            const isCurrentMonth = day.getMonth() === month;
                            const isToday = day.toDateString() === new Date().toDateString();

                            return (
                                <div
                                    key={idx}
                                    className={`month-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                                >
                                    <div className="cell-date">{day.getDate()}</div>
                                    <div className="cell-sessions">
                                        {daySessions.slice(0, 3).map(session => (
                                            <div
                                                key={session.id}
                                                className="month-session"
                                                style={{ backgroundColor: session.color }}
                                                onClick={() => setSelectedSession(session)}
                                            >
                                                <div style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                                                    {session.title}
                                                </div>
                                                {session.monthTopics && (
                                                    <div style={{
                                                        fontSize: '0.6rem',
                                                        opacity: '0.8',
                                                        marginTop: '0.1rem'
                                                    }}>
                                                        📅
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {daySessions.length > 3 && (
                                            <div className="more-sessions">
                                                +{daySessions.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="timetable-container">
            {/* Header */}
            <div className="timetable-header">
                <div className="header-left">
                    <h2 className="page-title">
                        <i className="fas fa-calendar-alt me-2"></i>
                        Trainer Timetable Management
                    </h2>
                    <p className="page-subtitle">Manage your classes, sessions, and availability</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="stats-row">
                <div className="stat-card stat-primary">
                    <div className="stat-icon">
                        <i className="fas fa-calendar-check"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{sessions.length}</div>
                        <div className="stat-label">Total Sessions</div>
                    </div>
                </div>
                <div className="stat-card stat-success">
                    <div className="stat-icon">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">
                            {sessions.filter(s => s.date.toDateString() === new Date().toDateString()).length}
                        </div>
                        <div className="stat-label">Today's Classes</div>
                    </div>
                </div>
                <div className="stat-card stat-info">
                    <div className="stat-icon">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">
                            {selectedCourse ? batches.length : [...new Set(sessions.map(s => s.batchName))].length}
                        </div>
                        <div className="stat-label">{selectedCourse ? 'Available Batches' : 'Active Batches'}</div>
                    </div>
                </div>
                <div className="stat-card stat-warning">
                    <div className="stat-icon">
                        <i className="fas fa-user-check"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">Available</div>
                        <div className="stat-label">Current Status</div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="controls-bar">
                <div className="controls-left">
                    <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>
                        <i className="fas fa-plus me-2"></i>
                        Create Schedule
                    </button>
                    <button className="btn btn-outline" onClick={() => setShowAvailabilityModal(true)}>
                        <i className="fas fa-user-clock me-2"></i>
                        Set Availability
                    </button>
                </div>

                <div className="controls-center">
                    <button className="btn-nav" onClick={() => navigateDate(-1)}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <button className="btn-today" onClick={goToToday}>Today</button>
                    <button className="btn-nav" onClick={() => navigateDate(1)}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                    <div className="current-date">
                        {viewMode === 'month'
                            ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            : formatDate(currentDate)
                        }
                    </div>
                </div>

                <div className="controls-right">
                    <div className="view-switcher">
                        <button
                            className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
                            onClick={() => setViewMode('day')}
                        >
                            Day
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
                            onClick={() => setViewMode('week')}
                        >
                            Week
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
                            onClick={() => setViewMode('month')}
                        >
                            Month
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar View */}
            <div className="calendar-container">
                {viewMode === 'day' && renderDayView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'month' && renderMonthView()}
            </div>

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowScheduleModal(false);
                    resetScheduleForm();
                }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <i className="fas fa-calendar-plus me-2"></i>
                                Create New Schedule
                            </h3>
                            <button className="btn-close" onClick={() => {
                                setShowScheduleModal(false);
                                resetScheduleForm();
                            }}>×</button>
                        </div>
                        <form onSubmit={handleScheduleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Session Title *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={scheduleForm.title}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">

                                    <div className="form-group">
                                        <label>Course *</label>
                                        <select
                                            className="form-control"
                                            value={selectedCourse}
                                            onChange={(e) => setSelectedCourse(e.target.value)}
                                            required
                                            disabled={loading || courses.length === 0}
                                        >
                                            <option value="">
                                                {loading ? 'Loading courses...' : courses.length === 0 ? 'No courses available' : 'Select Course'}
                                            </option>
                                            {courses.map(course => (
                                                <option key={course._id} value={course._id}>
                                                    {course.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Trainer *</label>
                                        <select
                                            className="form-control"
                                            value={scheduleForm.trainerId || ''}
                                            onChange={(e) => {
                                                const selectedTrainer = trainers.find(t => t._id === e.target.value);
                                                setScheduleForm({
                                                    ...scheduleForm,
                                                    trainerId: e.target.value,
                                                    trainerName: selectedTrainer ? selectedTrainer.name : ''
                                                });
                                            }}
                                            required
                                            disabled={loading || trainers.length === 0}
                                        >
                                            <option value="">
                                                {loading ? 'Loading trainers...' : trainers.length === 0 ? 'No trainers available' : 'Select Trainer'}
                                            </option>
                                            {trainers.map(trainer => (
                                                <option key={trainer._id} value={trainer._id}>
                                                    {trainer.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Batch *</label>
                                        <select
                                            className="form-control"
                                            value={scheduleForm.batchId}
                                            onChange={(e) => {
                                                const selectedBatch = batches.find(b => b._id === e.target.value);
                                                setScheduleForm({
                                                    ...scheduleForm,
                                                    batchId: e.target.value,
                                                    batchName: selectedBatch ? selectedBatch.name : ''
                                                });
                                            }}
                                            required
                                            disabled={!selectedCourse || batches.length === 0}
                                        >
                                            <option value="">
                                                {!selectedCourse ? 'Select Course First' : batches.length === 0 ? 'No Batches Available' : 'Select Batch'}
                                            </option>
                                            {batches.map(batch => (
                                                <option key={batch._id} value={batch._id}>
                                                    {batch.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Topics *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={scheduleForm.subject}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                                            placeholder="Topics"
                                            required
                                        />

                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Date *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={scheduleForm.date}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Color</label>
                                        <div className="color-picker">
                                            {colors.map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    className={`color-option ${scheduleForm.color === color ? 'active' : ''}`}
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => setScheduleForm({ ...scheduleForm, color })}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Time *</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={scheduleForm.startTime}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Time *</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={scheduleForm.endTime}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                                            required
                                        />
                                    </div>

                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Schedule Type *</label>
                                        <select
                                            className="form-control"
                                            value={scheduleForm.scheduleType}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, scheduleType: e.target.value })}
                                            required
                                        >
                                            <option value="single">Single Session</option>
                                            <option value="weekly">Weekly Schedule (7 days)</option>
                                            <option value="monthly">Monthly Schedule (4 weeks)</option>
                                        </select>
                                        <small className="form-text text-muted">
                                            Choose schedule type based on your planning needs
                                        </small>
                                    </div>
                                </div>

                                {/* Recurring Option */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={scheduleForm.isRecurring}
                                                onChange={(e) => setScheduleForm({
                                                    ...scheduleForm,
                                                    isRecurring: e.target.checked,
                                                    recurringType: e.target.checked ? 'weekly' : '',
                                                    recurringEndDate: ''
                                                })}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            Make this a Recurring Session
                                        </label>
                                        <small className="form-text text-muted">
                                            📅 Create repeating sessions automatically
                                        </small>
                                    </div>
                                </div>

                                {scheduleForm.isRecurring && (
                                    <div className="form-row" style={{
                                        padding: '1rem',
                                        backgroundColor: '#fff3cd',
                                        borderRadius: '8px',
                                        border: '2px solid #ffc107'
                                    }}>
                                        <div className="form-group">
                                            <label>Recurring Pattern *</label>
                                            <select
                                                className="form-control"
                                                value={scheduleForm.recurringType}
                                                onChange={(e) => setScheduleForm({ ...scheduleForm, recurringType: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Pattern</option>
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Repeat Until *</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={scheduleForm.recurringEndDate}
                                                onChange={(e) => setScheduleForm({ ...scheduleForm, recurringEndDate: e.target.value })}
                                                min={scheduleForm.date}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {scheduleForm.scheduleType === 'weekly' && (
                                    <div className="form-row">
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label>Week Topics *</label>
                                            <div className="week-topics-grid">
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => (
                                                    <div key={idx} className="week-topic-group">
                                                        <label className="week-topic-label">
                                                            {day}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control week-topic-input"
                                                            value={scheduleForm.weekTopics[day.toLowerCase()]}
                                                            onChange={(e) => setScheduleForm({
                                                                ...scheduleForm,
                                                                weekTopics: {
                                                                    ...scheduleForm.weekTopics,
                                                                    [day.toLowerCase()]: e.target.value
                                                                }
                                                            })}
                                                            placeholder={`Enter topics for ${day}...`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <small className="form-text text-muted">
                                                📝 <strong>Note:</strong> Only days with topics will create sessions. Leave empty to skip that day.
                                            </small>
                                        </div>
                                    </div>
                                )}

                                {/* Monthly Schedule UI */}
                                {scheduleForm.scheduleType === 'monthly' && (
                                    <div className="form-row">
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label>Monthly Topics (4 Weeks) *</label>
                                            <div style={{
                                                border: '2px solid #e0e0e0',
                                                borderRadius: '8px',
                                                padding: '1rem',
                                                backgroundColor: '#f9fafb'
                                            }}>
                                                {['week1', 'week2', 'week3', 'week4'].map((week, weekIdx) => (
                                                    <div key={week} style={{ marginBottom: '1.5rem' }}>
                                                        <h4 style={{
                                                            color: '#2c3e50',
                                                            marginBottom: '1rem',
                                                            padding: '0.5rem',
                                                            backgroundColor: '#e3f2fd',
                                                            borderRadius: '6px'
                                                        }}>
                                                            Week {weekIdx + 1}
                                                        </h4>
                                                        <div className="week-topics-grid">
                                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                                                <div key={day} className="week-topic-group">
                                                                    <label className="week-topic-label">
                                                                        {day}
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control week-topic-input"
                                                                        value={scheduleForm.monthTopics[week][day.toLowerCase()]}
                                                                        onChange={(e) => setScheduleForm({
                                                                            ...scheduleForm,
                                                                            monthTopics: {
                                                                                ...scheduleForm.monthTopics,
                                                                                [week]: {
                                                                                    ...scheduleForm.monthTopics[week],
                                                                                    [day.toLowerCase()]: e.target.value
                                                                                }
                                                                            }
                                                                        })}
                                                                        placeholder={`Topics for ${day}...`}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <small className="form-text text-muted">
                                                📅 <strong>Monthly Planning:</strong> Plan your entire month ahead. Leave empty for days without sessions.
                                            </small>
                                        </div>
                                    </div>
                                )}

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={scheduleForm.description}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                                            placeholder="Add notes or description..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => {
                                    setShowScheduleModal(false);
                                    resetScheduleForm();
                                }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    <i className="fas fa-save me-2"></i>
                                    {loading ? 'Loading...' : 'Create Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Availability Modal */}
            {showAvailabilityModal && (
                <div className="modal-overlay" onClick={() => setShowAvailabilityModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <i className="fas fa-user-clock me-2"></i>
                                Set Availability
                            </h3>
                            <button className="btn-close" onClick={() => setShowAvailabilityModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAvailabilitySubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Status *</label>
                                        <select
                                            className="form-control"
                                            value={availabilityForm.status}
                                            onChange={(e) => setAvailabilityForm({ ...availabilityForm, status: e.target.value })}
                                            required
                                            style={{
                                                backgroundColor:
                                                    availabilityForm.status === 'available' ? '#e8f5e9' :
                                                        availabilityForm.status === 'busy' ? '#fff3e0' :
                                                            availabilityForm.status === 'leave' ? '#ffebee' :
                                                                availabilityForm.status === 'sick' ? '#ffe0b2' :
                                                                    '#f3e5f5',
                                                fontWeight: '600'
                                            }}
                                        >
                                            <option value="available">✅ Available</option>
                                            <option value="busy">⏰ Busy</option>
                                            <option value="leave">🏖️ On Leave</option>
                                            <option value="sick">🤒 Sick Leave</option>
                                            <option value="vacation">🌴 Vacation</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Show reason/notes if not available */}
                                {availabilityForm.status !== 'available' && (
                                    <div className="form-row" style={{
                                        padding: '1rem',
                                        backgroundColor: '#fff3cd',
                                        borderRadius: '8px',
                                        border: '1px solid #ffc107'
                                    }}>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label>Reason / Notes</label>
                                            <textarea
                                                className="form-control"
                                                rows="2"
                                                value={availabilityForm.reason || ''}
                                                onChange={(e) => setAvailabilityForm({ ...availabilityForm, reason: e.target.value })}
                                                placeholder="Please provide a reason for your unavailability..."
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Date *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={availabilityForm.startDate}
                                            onChange={(e) => setAvailabilityForm({ ...availabilityForm, startDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={availabilityForm.endDate}
                                            onChange={(e) => setAvailabilityForm({ ...availabilityForm, endDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Working Hours Start *</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={availabilityForm.startTime}
                                            onChange={(e) => setAvailabilityForm({ ...availabilityForm, startTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Working Hours End *</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={availabilityForm.endTime}
                                            onChange={(e) => setAvailabilityForm({ ...availabilityForm, endTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Break Start</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={availabilityForm.breakStart}
                                            onChange={(e) => setAvailabilityForm({ ...availabilityForm, breakStart: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Break End</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={availabilityForm.breakEnd}
                                            onChange={(e) => setAvailabilityForm({ ...availabilityForm, breakEnd: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Working Days</label>
                                        <div className="checkbox-group">
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                <label key={day} className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={availabilityForm.workingDays.includes(day)}
                                                        onChange={(e) => {
                                                            const days = e.target.checked
                                                                ? [...availabilityForm.workingDays, day]
                                                                : availabilityForm.workingDays.filter(d => d !== day);
                                                            setAvailabilityForm({ ...availabilityForm, workingDays: days });
                                                        }}
                                                    />
                                                    {day}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowAvailabilityModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <i className="fas fa-save me-2"></i>
                                    Save Availability
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Session Detail Modal */}
            {selectedSession && (
                <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
                    <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header" style={{ borderBottom: `4px solid ${selectedSession.color}` }}>
                            <h3>
                                <i className="fas fa-info-circle me-2"></i>
                                Session Details
                            </h3>
                            <button className="btn-close" onClick={() => setSelectedSession(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-row">
                                <strong>Title:</strong>
                                <span>{selectedSession.title}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Batch:</strong>
                                <span className="badge" style={{ backgroundColor: selectedSession.color }}>
                                    {selectedSession.batchName}
                                </span>
                            </div>
                            {selectedSession.trainerName && (
                                <div className="detail-row">
                                    <strong>Trainer:</strong>
                                    <span>{selectedSession.trainerName}</span>
                                </div>
                            )}
                            <div className="detail-row">
                                <strong>Subject:</strong>
                                <span>{selectedSession.subject}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Date:</strong>
                                <span>{formatDate(selectedSession.date)}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Time:</strong>
                                <span>{selectedSession.startTime} - {selectedSession.endTime}</span>
                            </div>
                            {selectedSession.duration && (
                                <div className="detail-row">
                                    <strong>Duration:</strong>
                                    <span>{selectedSession.duration}</span>
                                </div>
                            )}
                            {selectedSession.description && (
                                <div className="detail-row">
                                    <strong>Description:</strong>
                                    <span>{selectedSession.description}</span>
                                </div>
                            )}
                            {selectedSession.attendance && selectedSession.attendance.totalStudents > 0 && (
                                <div className="detail-row">
                                    <strong>Attendance:</strong>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#4caf50',
                                            color: 'white',
                                            borderRadius: '6px',
                                            fontWeight: '600'
                                        }}>
                                            {selectedSession.attendance.attendancePercentage}%
                                        </span>
                                        <span>
                                            Present: {selectedSession.attendance.presentStudents} /
                                            Total: {selectedSession.attendance.totalStudents}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {selectedSession.monthTopics && (
                                <div className="detail-row">
                                    <strong>Month-wise Topics:</strong>
                                    <div style={{
                                        marginTop: '1rem',
                                        border: '2px solid #e3f2fd',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        backgroundColor: '#f8f9fa'
                                    }}>
                                        {Object.entries(selectedSession.monthTopics).map(([week, topics]) => (
                                            <div key={week} style={{
                                                marginBottom: '1.5rem',
                                                padding: '1rem',
                                                backgroundColor: 'white',
                                                borderRadius: '6px',
                                                border: '1px solid #e0e0e0'
                                            }}>
                                                <h5 style={{
                                                    color: '#2c3e50',
                                                    marginBottom: '1rem',
                                                    padding: '0.5rem',
                                                    backgroundColor: '#e3f2fd',
                                                    borderRadius: '6px',
                                                    fontSize: '1rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {week.charAt(0).toUpperCase() + week.slice(1).replace('week', ' Week ')}
                                                </h5>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                                    gap: '0.75rem'
                                                }}>
                                                    {Object.entries(topics).map(([day, topic]) => (
                                                        <div key={day} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding: '0.5rem',
                                                            backgroundColor: topic ? '#e8f5e9' : '#f5f5f5',
                                                            borderRadius: '4px',
                                                            border: `1px solid ${topic ? '#c8e6c9' : '#e0e0e0'}`
                                                        }}>
                                                            <span style={{
                                                                fontWeight: '600',
                                                                color: '#2c3e50',
                                                                minWidth: '70px',
                                                                fontSize: '0.9rem'
                                                            }}>
                                                                {day.charAt(0).toUpperCase() + day.slice(1)}:
                                                            </span>
                                                            <span style={{
                                                                color: topic ? '#2e7d32' : '#757575',
                                                                fontSize: '0.9rem',
                                                                marginLeft: '0.5rem',
                                                                flex: 1
                                                            }}>
                                                                {topic || 'No topic assigned'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            {/* <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setSelectedSession(null);
                                    handleMarkAttendance(selectedSession);
                                }}
                                style={{ backgroundColor: '#4caf50', borderColor: '#4caf50' }}
                            >
                                <i className="fas fa-user-check me-2"></i>
                                Mark Attendance
                            </button> */}
                            <button className="btn btn-outline" onClick={() => setSelectedSession(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Modal */}
            {showAttendanceModal && attendanceSession && (
                <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}>
                    <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header" style={{ borderBottom: '4px solid #4caf50' }}>
                            <h3>
                                <i className="fas fa-user-check me-2" style={{ color: '#4caf50' }}></i>
                                Mark Attendance
                            </h3>
                            <button className="btn-close" onClick={() => setShowAttendanceModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAttendanceSubmit}>
                            <div className="modal-body">
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#e8f5e9',
                                    borderRadius: '8px',
                                    marginBottom: '1.5rem'
                                }}>
                                    <h4 style={{ margin: 0, marginBottom: '0.5rem', color: '#2c3e50' }}>
                                        {attendanceSession.title}
                                    </h4>
                                    <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                                        <div>Batch: {attendanceSession.batchName}</div>
                                        <div>Date: {formatDate(attendanceSession.date)}</div>
                                        <div>Time: {attendanceSession.startTime} - {attendanceSession.endTime}</div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Total Students *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={attendanceData.totalStudents}
                                            onChange={(e) => {
                                                const total = parseInt(e.target.value) || 0;
                                                setAttendanceData({
                                                    ...attendanceData,
                                                    totalStudents: total,
                                                    absentStudents: Math.max(0, total - attendanceData.presentStudents)
                                                });
                                            }}
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Present Students *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={attendanceData.presentStudents}
                                            onChange={(e) => {
                                                const present = parseInt(e.target.value) || 0;
                                                setAttendanceData({
                                                    ...attendanceData,
                                                    presentStudents: present,
                                                    absentStudents: Math.max(0, attendanceData.totalStudents - present)
                                                });
                                            }}
                                            min="0"
                                            max={attendanceData.totalStudents}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Absent Students</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={attendanceData.absentStudents}
                                            readOnly
                                            style={{ backgroundColor: '#f5f7fa' }}
                                        />
                                    </div>
                                </div>

                                {attendanceData.totalStudents > 0 && (
                                    <div style={{
                                        padding: '1rem',
                                        backgroundColor: '#d1ecf1',
                                        borderRadius: '8px',
                                        marginTop: '1rem'
                                    }}>
                                        <strong style={{ color: '#0c5460' }}>Attendance Percentage: </strong>
                                        <span style={{
                                            fontSize: '1.5rem',
                                            fontWeight: '700',
                                            color: '#0c5460'
                                        }}>
                                            {((attendanceData.presentStudents / attendanceData.totalStudents) * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowAttendanceModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#4caf50', borderColor: '#4caf50' }}>
                                    <i className="fas fa-save me-2"></i>
                                    Save Attendance
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Styles */}
            <style jsx>{`
                .timetable-container {
                    padding: 2rem;
                    background: #f5f7fa;
                    min-height: 100vh;
                }

                .timetable-header {
                    margin-bottom: 2rem;
                }

                .page-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 0.5rem;
                }

                .page-subtitle {
                    color: #7f8c8d;
                    font-size: 1rem;
                }

                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    transition: transform 0.3s, box-shadow 0.3s;
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
                }

                .stat-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    margin-right: 1rem;
                }

                .stat-primary .stat-icon { background: #e3f2fd; color: #2196f3; }
                .stat-success .stat-icon { background: #e8f5e9; color: #4caf50; }
                .stat-info .stat-icon { background: #e0f7fa; color: #00bcd4; }
                .stat-warning .stat-icon { background: #fff3e0; color: #ff9800; }

                .stat-content {
                    flex: 1;
                }

                .stat-value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #2c3e50;
                }

                .stat-label {
                    color: #7f8c8d;
                    font-size: 0.9rem;
                }

                .controls-bar {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }

                .controls-left, .controls-center, .controls-right {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .btn {
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: inline-flex;
                    align-items: center;
                }

                .btn-primary {
                    background: #3498db;
                    color: white;
                }

                .btn-primary:hover {
                    background: #2980b9;
                    transform: translateY(-2px);
                }

                .btn-outline {
                    background: white;
                    color: #3498db;
                    border: 2px solid #3498db;
                }

                .btn-outline:hover {
                    background: #3498db;
                    color: white;
                }

                .btn-danger {
                    background: #e74c3c;
                    color: white;
                }

                .btn-danger:hover {
                    background: #c0392b;
                }

                .btn-nav {
                    background: white;
                    border: 2px solid #e0e0e0;
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .btn-nav:hover {
                    background: #f5f7fa;
                    border-color: #3498db;
                }

                .btn-today {
                    padding: 0.5rem 1rem;
                    background: white;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .btn-today:hover {
                    background: #3498db;
                    color: white;
                    border-color: #3498db;
                }

                .current-date {
                    font-weight: 700;
                    color: #2c3e50;
                    font-size: 1.1rem;
                    padding: 0 1rem;
                }

                .view-switcher {
                    display: flex;
                    background: #f5f7fa;
                    border-radius: 8px;
                    padding: 0.25rem;
                }

                .view-btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    background: transparent;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s;
                    color: #7f8c8d;
                }

                .view-btn.active {
                    background: white;
                    color: #3498db;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .calendar-container {
                    background: white;
                    border-radius: 12px;
                    padding: 2rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }

                /* Day View */
                .day-view {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .time-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                }

                .time-slot {
                    display: flex;
                    min-height: 80px;
                    border-bottom: 1px solid #e0e0e0;
                    transition: background 0.3s;
                }

                .time-slot:hover {
                    background: #f9fafb;
                }

                .time-label {
                    width: 100px;
                    padding: 1rem;
                    font-weight: 600;
                    color: #7f8c8d;
                    border-right: 2px solid #e0e0e0;
                }

                .slot-content {
                    flex: 1;
                    padding: 0.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .session-card {
                    background: white;
                    border-left: 4px solid;
                    border-radius: 8px;
                    padding: 1rem;
                    cursor: move;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: all 0.3s;
                }

                .session-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transform: translateY(-2px);
                }

                .session-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                    margin-bottom: 0.5rem;
                }

                .btn-delete {
                    background: #e74c3c;
                    color: white;
                    border: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.2rem;
                    line-height: 1;
                    transition: all 0.3s;
                }

                .btn-delete:hover {
                    background: #c0392b;
                    transform: scale(1.1);
                }

                .session-info {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: white;
                }

                .time {
                    color: #7f8c8d;
                    font-size: 0.9rem;
                }

                .session-subject {
                    color: #95a5a6;
                    font-size: 0.9rem;
                }

                /* Week View */
                .week-view {
                    overflow-x: auto;
                }

                .week-grid {
                    min-width: 1000px;
                }

                .week-header {
                    display: grid;
                    grid-template-columns: 80px repeat(7, 1fr);
                    gap: 1px;
                    background: #e0e0e0;
                    border-radius: 8px 8px 0 0;
                    overflow: hidden;
                }

                .time-column-header {
                    background: #f5f7fa;
                    padding: 1rem;
                    font-weight: 700;
                    text-align: center;
                }

                .day-header {
                    background: #f5f7fa;
                    padding: 1rem;
                    text-align: center;
                }

                .day-name {
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 0.25rem;
                }

                .day-date {
                    color: #7f8c8d;
                    font-size: 1.2rem;
                    font-weight: 600;
                }

                .week-body {
                    border: 1px solid #e0e0e0;
                    border-top: none;
                }

                .week-row {
                    display: grid;
                    grid-template-columns: 80px repeat(7, 1fr);
                    gap: 1px;
                    background: #e0e0e0;
                    min-height: 60px;
                }

                .time-cell {
                    background: #f5f7fa;
                    padding: 0.5rem;
                    font-weight: 600;
                    color: #7f8c8d;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .day-cell {
                    background: white;
                    padding: 0.25rem;
                    cursor: pointer;
                    transition: background 0.3s;
                    position: relative;
                }

                .day-cell:hover {
                    background: #f9fafb;
                }

                .mini-session {
                    padding: 0.5rem;
                    border-radius: 4px;
                    margin-bottom: 0.25rem;
                    cursor: pointer;
                    color: white;
                    font-size: 0.75rem;
                    transition: all 0.3s;
                }

                .mini-session:hover {
                    transform: scale(1.05);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }

                .mini-session-title {
                    font-weight: 700;
                    margin-bottom: 0.25rem;
                }

                .mini-session-batch {
                    font-size: 0.7rem;
                    opacity: 0.9;
                }

                /* Month View */
                .month-view {
                    width: 100%;
                }

                .month-grid {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .month-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 1px;
                    background: #e0e0e0;
                }

                .month-day-header {
                    background: #f5f7fa;
                    padding: 1rem;
                    text-align: center;
                    font-weight: 700;
                    color: #2c3e50;
                }

                .month-body {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 1px;
                    background: #e0e0e0;
                }

                .month-cell {
                    background: white;
                    min-height: 120px;
                    padding: 0.5rem;
                    cursor: pointer;
                    transition: background 0.3s;
                }

                .month-cell:hover {
                    background: #f9fafb;
                }

                .month-cell.other-month {
                    background: #fafafa;
                    opacity: 0.5;
                }

                .month-cell.today {
                    background: #e3f2fd;
                }

                .cell-date {
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 0.5rem;
                }

                .cell-sessions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .month-session {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    transition: all 0.3s;
                }

                .month-session:hover {
                    transform: scale(1.05);
                }

                .more-sessions {
                    color: #7f8c8d;
                    font-size: 0.7rem;
                    padding: 0.25rem;
                    text-align: center;
                }

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                }

                .modal-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }

                .modal-small {
                    max-width: 500px;
                }

                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 2px solid #f5f7fa;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h3 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 1.5rem;
                }

                .btn-close {
                    background: transparent;
                    border: none;
                    font-size: 2rem;
                    cursor: pointer;
                    color: #95a5a6;
                    line-height: 1;
                    transition: all 0.3s;
                }

                .btn-close:hover {
                    color: #e74c3c;
                    transform: rotate(90deg);
                }

                .modal-body {
                    padding: 1.5rem;
                }

                .modal-footer {
                    padding: 1.5rem;
                    border-top: 2px solid #f5f7fa;
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-group label {
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 0.5rem;
                }

                .form-control {
                    padding: 0.75rem;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: all 0.3s;
                }

                .form-control:focus {
                    outline: none;
                    border-color: #3498db;
                }

                .color-picker {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .color-option {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    border: 3px solid transparent;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .color-option:hover {
                    transform: scale(1.1);
                }

                .color-option.active {
                    border-color: #2c3e50;
                    transform: scale(1.15);
                }

                .checkbox-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .checkbox-label input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 1rem;
                    border-bottom: 1px solid #f5f7fa;
                }

                .detail-row strong {
                    color: #2c3e50;
                }

                .detail-row span {
                    color: #000;
                }

                .week-topics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1rem;
                    margin-top: 0.5rem;
                }

                .week-topic-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .week-topic-label {
                    font-weight: 600;
                    color: #2c3e50;
                    font-size: 0.9rem;
                }

                .week-topic-input {
                    padding: 0.75rem;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    transition: all 0.3s;
                }

                .week-topic-input:focus {
                    outline: none;
                    border-color: #3498db;
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
                }

                @media (max-width: 768px) {
                    .timetable-container {
                        padding: 1rem;
                    }

                    .controls-bar {
                        flex-direction: column;
                    }

                    .stats-row {
                        grid-template-columns: 1fr;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

export default TimeTable;