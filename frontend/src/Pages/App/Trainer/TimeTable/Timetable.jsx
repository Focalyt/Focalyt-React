import React, { useState, useEffect } from 'react';

function TimeTable() {
    // State Management
    const [viewMode, setViewMode] = useState('week'); // day, week, month
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sessions, setSessions] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [draggedSession, setDraggedSession] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    
    // Form States
    const [scheduleForm, setScheduleForm] = useState({
        title: '',
        batchName: '',
        subject: '',
        date: '',
        startTime: '',
        endTime: '',
        duration: '',
        recurring: 'none',
        description: '',
        color: '#3498db'
    });

    const [availabilityForm, setAvailabilityForm] = useState({
        status: 'available', // available, busy, leave
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    });

    const [availability, setAvailability] = useState([]);

    // Sample batches and subjects for demo
    const batches = ['Batch A', 'Batch B', 'Batch C', 'Batch D'];
    const subjects = ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Python', 'Data Science'];
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

    // Load sample data on mount
    useEffect(() => {
        loadSampleData();
    }, []);

    const loadSampleData = () => {
        // Sample sessions
        const sampleSessions = [
            {
                id: 1,
                title: 'React Fundamentals',
                batchName: 'Batch A',
                subject: 'React',
                date: new Date(),
                startTime: '09:00',
                endTime: '11:00',
                duration: '2 hours',
                color: '#3498db',
                description: 'Introduction to React components'
            },
            {
                id: 2,
                title: 'JavaScript Advanced',
                batchName: 'Batch B',
                subject: 'JavaScript',
                date: new Date(),
                startTime: '14:00',
                endTime: '16:00',
                duration: '2 hours',
                color: '#e74c3c',
                description: 'Advanced JS concepts'
            }
        ];
        setSessions(sampleSessions);

        // Sample availability
        setAvailability([{
            status: 'available',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            startTime: '09:00',
            endTime: '18:00',
            breakStart: '13:00',
            breakEnd: '14:00',
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }]);
    };

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

    // Schedule Management
    const handleScheduleSubmit = (e) => {
        e.preventDefault();
        
        // Check for conflicts
        if (checkConflict(scheduleForm)) {
            alert('⚠️ Conflict detected! You already have a session at this time.');
            return;
        }

        const newSession = {
            id: Date.now(),
            ...scheduleForm,
            date: new Date(scheduleForm.date)
        };

        // Handle recurring sessions
        if (scheduleForm.recurring !== 'none') {
            const recurringSessions = generateRecurringSessions(newSession);
            setSessions([...sessions, ...recurringSessions]);
        } else {
            setSessions([...sessions, newSession]);
        }

        setShowScheduleModal(false);
        resetScheduleForm();
    };

    const generateRecurringSessions = (session) => {
        const sessions = [session];
        const interval = session.recurring === 'daily' ? 1 : session.recurring === 'weekly' ? 7 : 30;
        
        for (let i = 1; i < 10; i++) { // Generate next 10 occurrences
            const newDate = new Date(session.date);
            newDate.setDate(newDate.getDate() + (interval * i));
            sessions.push({
                ...session,
                id: Date.now() + i,
                date: newDate
            });
        }
        return sessions;
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
            batchName: '',
            subject: '',
            date: '',
            startTime: '',
            endTime: '',
            duration: '',
            recurring: 'none',
            description: '',
            color: '#3498db'
        });
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

    // Delete session
    const deleteSession = (id) => {
        if (window.confirm('Are you sure you want to delete this session?')) {
            setSessions(sessions.filter(s => s.id !== id));
        }
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
                                                onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
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
                                                {session.title}
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
                        <div className="stat-value">{[...new Set(sessions.map(s => s.batchName))].length}</div>
                        <div className="stat-label">Active Batches</div>
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
                <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <i className="fas fa-calendar-plus me-2"></i>
                                Create New Schedule
                            </h3>
                            <button className="btn-close" onClick={() => setShowScheduleModal(false)}>×</button>
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
                                            onChange={(e) => setScheduleForm({...scheduleForm, title: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Batch *</label>
                                        <select
                                            className="form-control"
                                            value={scheduleForm.batchName}
                                            onChange={(e) => setScheduleForm({...scheduleForm, batchName: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Batch</option>
                                            {batches.map(batch => (
                                                <option key={batch} value={batch}>{batch}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Subject *</label>
                                        <select
                                            className="form-control"
                                            value={scheduleForm.subject}
                                            onChange={(e) => setScheduleForm({...scheduleForm, subject: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Subject</option>
                                            {subjects.map(subject => (
                                                <option key={subject} value={subject}>{subject}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Date *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={scheduleForm.date}
                                            onChange={(e) => setScheduleForm({...scheduleForm, date: e.target.value})}
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
                                                    onClick={() => setScheduleForm({...scheduleForm, color})}
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
                                            onChange={(e) => setScheduleForm({...scheduleForm, startTime: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Time *</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={scheduleForm.endTime}
                                            onChange={(e) => setScheduleForm({...scheduleForm, endTime: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Duration</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={scheduleForm.duration}
                                            onChange={(e) => setScheduleForm({...scheduleForm, duration: e.target.value})}
                                            placeholder="e.g., 2 hours"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Recurring</label>
                                        <select
                                            className="form-control"
                                            value={scheduleForm.recurring}
                                            onChange={(e) => setScheduleForm({...scheduleForm, recurring: e.target.value})}
                                        >
                                            <option value="none">None</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={scheduleForm.description}
                                            onChange={(e) => setScheduleForm({...scheduleForm, description: e.target.value})}
                                            placeholder="Add notes or description..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowScheduleModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <i className="fas fa-save me-2"></i>
                                    Create Schedule
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
                                            onChange={(e) => setAvailabilityForm({...availabilityForm, status: e.target.value})}
                                            required
                                        >
                                            <option value="available">Available</option>
                                            <option value="busy">Busy</option>
                                            <option value="leave">On Leave</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Date *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={availabilityForm.startDate}
                                            onChange={(e) => setAvailabilityForm({...availabilityForm, startDate: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={availabilityForm.endDate}
                                            onChange={(e) => setAvailabilityForm({...availabilityForm, endDate: e.target.value})}
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
                                            onChange={(e) => setAvailabilityForm({...availabilityForm, startTime: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Working Hours End *</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={availabilityForm.endTime}
                                            onChange={(e) => setAvailabilityForm({...availabilityForm, endTime: e.target.value})}
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
                                            onChange={(e) => setAvailabilityForm({...availabilityForm, breakStart: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Break End</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={availabilityForm.breakEnd}
                                            onChange={(e) => setAvailabilityForm({...availabilityForm, breakEnd: e.target.value})}
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
                                                            setAvailabilityForm({...availabilityForm, workingDays: days});
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
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-danger" 
                                onClick={() => {
                                    deleteSession(selectedSession.id);
                                    setSelectedSession(null);
                                }}
                            >
                                <i className="fas fa-trash me-2"></i>
                                Delete
                            </button>
                            <button className="btn btn-outline" onClick={() => setSelectedSession(null)}>
                                Close
                            </button>
                        </div>
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
                    color: #7f8c8d;
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