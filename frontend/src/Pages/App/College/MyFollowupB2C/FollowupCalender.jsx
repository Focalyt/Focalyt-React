import React, { useState } from 'react';

const FollowupCalendar = () => {
  // State management
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [isRangeMode, setIsRangeMode] = useState(true); // Set to true by default to show range functionality
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [customDays, setCustomDays] = useState(7);
  const [rangePreset, setRangePreset] = useState('custom');

  // Sample followup data with different statuses
  const [followupDates, setFollowupDates] = useState([]);

  // Constants
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Range presets
  const rangePresets = [
    { value: 'custom', label: 'Custom Range', days: null, icon: '🎯' },
    { value: '7days', label: '7 Days', days: 7, icon: '📅' },
    { value: '15days', label: '15 Days', days: 15, icon: '📋' },
    { value: '20days', label: '20 Days', days: 20, icon: '🗓️' },
    { value: '30days', label: '30 Days', days: 30, icon: '📊' },
    { value: '60days', label: '60 Days', days: 60, icon: '📈' },
    { value: '90days', label: '90 Days', days: 90, icon: '📉' },
    { value: 'currentMonth', label: 'Current Month', days: null, icon: '🌟' },
    { value: 'lastMonth', label: 'Last Month', days: null, icon: '⬅️' },
    { value: 'nextMonth', label: 'Next Month', days: null, icon: '➡️' },
  ];

  // Utility functions
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push(currentDate);
    }
    return days;
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Date checking functions
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth;
  };

  const hasFollowup = (date) => {
    return followupDates.some(followup =>
      followup.date.toDateString() === date.toDateString()
    );
  };

  const getFollowupForDate = (date) => {
    return followupDates.find(followup =>
      followup.date.toDateString() === date.toDateString()
    );
  };

  const isSelected = (date) => {
    return selectedDate && selectedDate.toDateString() === date.toDateString();
  };

  const isInRange = (date) => {
    if (!rangeStart || !rangeEnd) return false;
    return date >= rangeStart && date <= rangeEnd;
  };

  // Range preset functions
  const setPresetRange = (presetValue) => {
    setRangePreset(presetValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start, end;

    switch (presetValue) {
      case '7days':
      case '15days':
      case '20days':
      case '30days':
      case '60days':
      case '90days':
        const preset = rangePresets.find(p => p.value === presetValue);
        start = new Date(today);
        end = new Date(today);
        end.setDate(today.getDate() + preset.days - 1);
        break;

      case 'currentMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;

      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;

      case 'nextMonth':
        start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;

      default: // custom
        return;
    }

    setRangeStart(start);
    setRangeEnd(end);
    setIsRangeMode(true);
  };

  const setCustomDaysRange = () => {
    if (!customDays || customDays < 1) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    const end = new Date(today);
    end.setDate(today.getDate() + parseInt(customDays) - 1);

    setRangeStart(start);
    setRangeEnd(end);
    setRangePreset('custom');
  };

  // Range and filtering functions
  const getFollowupsInRange = () => {
    if (!rangeStart || !rangeEnd) return [];

    return followupDates.filter(followup => {
      const followupDate = new Date(followup.date);
      followupDate.setHours(0, 0, 0, 0);
      const start = new Date(rangeStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(rangeEnd);
      end.setHours(0, 0, 0, 0);

      return followupDate >= start && followupDate <= end;
    });
  };

  const getFilteredFollowups = () => {
    const rangeFollowups = getFollowupsInRange();

    switch (selectedFilter) {
      case 'done':
        return rangeFollowups.filter(followup => followup.status === 'done');
      case 'missed':
        return rangeFollowups.filter(followup => followup.status === 'missed');
      case 'planned':
        return rangeFollowups.filter(followup => followup.status === 'planned');
      default:
        return rangeFollowups;
    }
  };

  const getStatusCounts = () => {
    const rangeFollowups = getFollowupsInRange();
    return {
      all: rangeFollowups.length,
      done: rangeFollowups.filter(f => f.status === 'done').length,
      missed: rangeFollowups.filter(f => f.status === 'missed').length,
      planned: rangeFollowups.filter(f => f.status === 'planned').length,
    };
  };

  const getRangeDays = () => {
    if (!rangeStart || !rangeEnd) return 0;
    const diffTime = Math.abs(rangeEnd - rangeStart);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleMonthChange = (e) => {
    setCurrentMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e) => {
    setCurrentYear(parseInt(e.target.value));
  };

  // Event handlers
  const handleDateClick = (date) => {
    const clickedDate = new Date(date);
    clickedDate.setHours(0, 0, 0, 0);

    if (!isRangeMode) {
      setSelectedDate(new Date(clickedDate));
      return;
    }

    if (!rangeStart) {
      setRangeStart(new Date(clickedDate));
      setRangeEnd(null);
      setSelectedDate(null);
      setRangePreset('custom');
    } else if (!rangeEnd) {
      if (clickedDate >= rangeStart) {
        setRangeEnd(new Date(clickedDate));
      } else {
        setRangeEnd(new Date(rangeStart));
        setRangeStart(new Date(clickedDate));
      }
      setRangePreset('custom');
    } else {
      setRangeStart(new Date(clickedDate));
      setRangeEnd(null);
      setRangePreset('custom');
    }
  };

  const toggleRangeMode = () => {
    setIsRangeMode(!isRangeMode);
    setRangeStart(null);
    setRangeEnd(null);
    setSelectedDate(null);
    setSelectedFilter('all');
    setRangePreset('custom');
  };

  const clearRange = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setSelectedFilter('all');
    setRangePreset('custom');
  };

  // Generate data for rendering
  const calendarDays = generateCalendarDays();
  const years = generateYears();
  const statusCounts = getStatusCounts();

  const getDayClasses = (date) => {
    const followup = getFollowupForDate(date);
    const isCurrentMonthDate = isCurrentMonth(date);
    const isTodayDate = isToday(date);
    const isSelectedDate = isSelected(date);
    const hasFollowupDate = hasFollowup(date);
    const isInRangeDate = isInRange(date);
    const isRangeStartDate = rangeStart && date.toDateString() === rangeStart.toDateString();
    const isRangeEndDate = rangeEnd && date.toDateString() === rangeEnd.toDateString();

    let classes = ['calendar-day', 'position-relative', 'text-center', 'p-2', 'border', 'cursor-pointer'];

    if (isRangeMode) {
      if (!isCurrentMonthDate) {
        classes.push('text-muted', 'bg-light');
      } else {
        classes.push('text-dark', 'bg-white');
      }
    } else {
      if (!isCurrentMonthDate) {
        classes.push('text-muted', 'bg-light');
      } else {
        classes.push('text-dark', 'bg-white');
      }
    }

    if (isTodayDate) {
      classes.push('today');
    }

    if (isSelectedDate) {
      classes.push('selected');
    }

    if (hasFollowupDate && followup) {
      if (followup.status === 'planned') {
        classes.push('followup-planned');
      } else if (followup.status === 'done') {
        classes.push('followup-done');
      } else if (followup.status === 'missed') {
        classes.push('followup-missed');
      }
    }

    if (isInRangeDate) {
      classes.push('in-range');
    }

    if (isRangeStartDate || isRangeEndDate) {
      classes.push('range-endpoint');
    }

    return classes.join(' ');
  };

  return (
    <>
      <div className="calendar-container rounded">
        <div className="card shadow">
          <div className="card-body">

            {/* Header */}
            <div className="border-bottom pb-3 mb-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <span className="me-3 fs-5">📅</span>
                  <span className="fs-5 fw-bold text-dark">Followup Calendar</span>
                </div>
               
              </div>
            </div>

            {/* Preset Range Controls */}
            <div className="mb-4 p-3 bg-primary bg-opacity-10 rounded">
              <div className="row g-2 mb-3">
                <div className="col-md-12">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <label className="form-label small fw-semibold mb-0">Quick Range Selection:</label>
                    {(rangeStart || rangeEnd) && (
                      <button 
                        onClick={clearRange} 
                        className="btn btn-outline-danger btn-sm"
                      >
                        Clear Range
                      </button>
                    )}
                  </div>

                  <div className="preset-buttons-grid">
                    {rangePresets.map(preset => (
                      <button
                        key={preset.value}
                        className={`preset-btn ${rangePreset === preset.value ? 'active' : ''}`}
                        onClick={() => setPresetRange(preset.value)}
                        disabled={preset.value === 'custom'}
                      >
                        <span className="preset-icon">{preset.icon}</span>
                        <span className="preset-label">{preset.label}</span>
                      
                      </button>
                    ))}
                  </div>

                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="d-flex justify-content-between align-items-center mb-4 py-2">
              <button
                onClick={goToPreviousMonth}
                className="btn btn-outline-secondary"
              >
                ←
              </button>

              <div className="d-flex gap-2">
                <select
                  value={currentMonth}
                  onChange={handleMonthChange}
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  value={currentYear}
                  onChange={handleYearChange}
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={goToNextMonth}
                className="btn btn-outline-secondary"
              >
                →
              </button>
            </div>

            {/* Range Info with Stats */}
            {isRangeMode && rangeStart && (
              <div className="mb-3 p-3 range-stats">
                <div className="row">
                  <div className="col-md-8">
                    <h6 className="mb-1">📅 Selected Range:</h6>
                    <p className="mb-0 small text-white">
                      <strong>{formatDate(rangeStart)}</strong>
                      {rangeEnd ? ` to ${formatDate(rangeEnd)}` : ' (select end date)'}
                    </p>
                  </div>
                  <div className="col-md-4 text-end">
                    {rangeEnd && (
                      <div>
                        <div className="fw-bold fs-4">{getRangeDays()}</div>
                        <div className="small">Days Selected</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Week Days Header */}
            <div className="calendar-grid mb-2">
              {weekDays.map(day => (
                <div key={day} className="week-header">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className={`calendar-grid ${isRangeMode ? 'range-selection-mode' : ''}`}>
              {calendarDays.map((date, index) => {
                const followup = getFollowupForDate(date);
                const isCurrentMonthDate = isCurrentMonth(date);
                const hasFollowupDate = hasFollowup(date);

                let dayClasses = getDayClasses(date);
                if (isRangeMode) {
                  dayClasses += ' range-mode';
                }

                return (
                  <div
                    key={index}
                    className={dayClasses}
                    onClick={() => handleDateClick(date)}
                    title={isRangeMode ?
                      (!rangeStart ? 'Click to set range start' :
                        !rangeEnd ? 'Click to set range end' :
                          'Click to start new range') :
                      `${formatDate(date)}${hasFollowupDate ? ` - ${followup?.title}` : ''}`
                    }
                  >
                    {date.getDate()}
                    {hasFollowupDate && isCurrentMonthDate && followup && (
                      <div className={`followup-indicator ${followup.status}`}>
                        {followup.status === 'done' ? '✓' : followup.status === 'missed' ? '✗' : '○'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Date Info */}
            {selectedDate && !isRangeMode && (
              <div className="mt-4 p-3 bg-info bg-opacity-10 rounded">
                <p className="mb-0 small">Selected Date: <strong>{formatDate(selectedDate)}</strong></p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>
        {`
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
          }
          
          .calendar-day {
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            transition: all 0.2s;
            border-radius: 4px;
          }
          
          .calendar-day:hover {
            background-color: #e9ecef !important;
            transform: scale(1.05);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .calendar-day.range-mode:hover {
            background-color: #cfe2ff !important;
            border-color: #0d6efd !important;
          }
          
          .calendar-day.today {
            background-color: #cfe2ff !important;
            color: #0a58ca !important;
            font-weight: bold;
            border: 2px solid #0d6efd !important;
          }
          
          .calendar-day.selected {
            background-color: #fd7e14 !important;
            color: white !important;
            font-weight: bold;
          }
          
          .calendar-day.followup-planned {
            background-color: #fff3cd !important;
            border-color: #ffc107 !important;
          }
          
          .calendar-day.followup-done {
            background-color: #d1e7dd !important;
            border-color: #198754 !important;
          }
          
          .calendar-day.followup-missed {
            background-color: #f8d7da !important;
            border-color: #dc3545 !important;
          }
          
          .calendar-day.in-range {
            background-color: #cfe2ff !important;
            border-color: #0d6efd !important;
          }
          
          .calendar-day.range-endpoint {
            background-color: #0d6efd !important;
            color: white !important;
            font-weight: bold;
          }
          
          .week-header {
            background-color: #e9ecef;
            padding: 8px;
            font-size: 0.75rem;
            font-weight: bold;
            color: #6c757d;
            text-align: center;
          }
          
          .followup-indicator {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            font-size: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
          }
          
          .followup-indicator.done {
            background-color: #198754;
          }
          
          .followup-indicator.missed {
            background-color: #dc3545;
          }
          
          .followup-indicator.planned {
            background-color: #ffc107;
          }
          
          .cursor-pointer {
            cursor: pointer;
          }
          
          .range-stats {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
          }
          
          .range-selection-mode {
            border: 2px dashed #0d6efd;
            border-radius: 8px;
            background: rgba(13, 110, 253, 0.05);
            padding: 4px;
          }
          
          .calendar-day.range-mode {
            position: relative;
          }
          
          .calendar-day.range-mode::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border: 2px solid transparent;
            border-radius: 6px;
            transition: all 0.2s;
          }
          
          .calendar-day.range-mode:hover::after {
            border-color: #0d6efd;
            background: rgba(13, 110, 253, 0.1);
          }

          /* Preset Buttons Styling */
          .preset-buttons-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(45px, 1fr));
            gap: 8px;
            margin-bottom: 12px;
          }
          
          .preset-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px 8px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            background: white;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            min-height: 70px;
          }
          
          .preset-btn:hover {
            border-color: #0d6efd;
            background: #f8f9fa;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
          }
          
          .preset-btn.active {
            border-color: #0d6efd;
            background: linear-gradient(135deg, #0d6efd 0%, #6610f2 100%);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(13, 110, 253, 0.3);
          }
          
          .preset-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            border-color: #dee2e6;
            background: #f8f9fa;
          }
          
          .preset-btn:disabled:hover {
            transform: none;
            box-shadow: none;
          }
          
          .preset-icon {
            font-size: 1.2em;
            margin-bottom: 4px;
          }
          
          .preset-label {
            font-size: 0.75rem;
            font-weight: 600;
            text-align: center;
            line-height: 1.2;
          }
          
          .preset-days {
            position: absolute;
            top: 4px;
            right: 4px;
            background: #ffc107;
            color: #000;
            font-size: 0.6rem;
            padding: 2px 4px;
            border-radius: 8px;
            font-weight: bold;
          }
          
          .preset-btn.active .preset-days {
            background: rgba(255, 255, 255, 0.9);
            color: #0d6efd;
          }

    #editFollowupPanel {
    max-height: calc(100vh - 220px); /* Adjust based on your header height */
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin; /* For Firefox */
    scrollbar-color: #cbd5e0 #f7fafc; /* For Firefox */
}
             .react-date-picker__calendar.react-date-picker__calendar--open{
    inset: 0 !important;
    width: 300px !important;
}
          /* Responsive Design */
          @media (max-width: 768px) {
            .preset-buttons-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            
            .preset-btn {
              min-height: 60px;
              padding: 8px 6px;
            }
            
            .preset-label {
              font-size: 0.7rem;
            }
          }
          
          @media (max-width: 480px) {
            .preset-buttons-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </>
  );
};

export default FollowupCalendar;

// import React, { useState } from 'react';

// const FollowupCalendar = () => {
//   // State management
//   const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
//   const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [rangeStart, setRangeStart] = useState(null);
//   const [rangeEnd, setRangeEnd] = useState(null);
//   const [isRangeMode, setIsRangeMode] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState('all');
//   const [customDays, setCustomDays] = useState(7);
//   const [rangePreset, setRangePreset] = useState('custom');

//   // Sample followup data with different statuses
//   const [followupDates, setFollowupDates] = useState([]);

//   // Constants
//   const monthNames = [
//     "January", "February", "March", "April", "May", "June",
//     "July", "August", "September", "October", "November", "December"
//   ];

//   const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

//   // Range presets
//   const rangePresets = [
//     { value: 'custom', label: 'Custom Range', days: null },
//     { value: '7days', label: '7 Days', days: 7 },
//     { value: '15days', label: '15 Days', days: 15 },
//     { value: '20days', label: '20 Days', days: 20 },
//     { value: '30days', label: '30 Days', days: 30 },
//     { value: '60days', label: '60 Days', days: 60 },
//     { value: '90days', label: '90 Days', days: 90 },
//     { value: 'currentMonth', label: 'Current Month', days: null },
//     { value: 'lastMonth', label: 'Last Month', days: null },
//     { value: 'nextMonth', label: 'Next Month', days: null },
//   ];

//   // Utility functions
//   const generateYears = () => {
//     const currentYear = new Date().getFullYear();
//     const years = [];
//     for (let i = currentYear - 10; i <= currentYear + 10; i++) {
//       years.push(i);
//     }
//     return years;
//   };

//   const generateCalendarDays = () => {
//     const firstDay = new Date(currentYear, currentMonth, 1);
//     const startDate = new Date(firstDay);
//     startDate.setDate(startDate.getDate() - firstDay.getDay());

//     const days = [];
//     for (let i = 0; i < 42; i++) {
//       const currentDate = new Date(startDate);
//       currentDate.setDate(startDate.getDate() + i);
//       days.push(currentDate);
//     }
//     return days;
//   };

//   const formatDate = (date) => {
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const year = date.getFullYear();
//     return `${day}/${month}/${year}`;
//   };

//   // Date checking functions
//   const isToday = (date) => {
//     const today = new Date();
//     return date.toDateString() === today.toDateString();
//   };

//   const isCurrentMonth = (date) => {
//     return date.getMonth() === currentMonth;
//   };

//   const hasFollowup = (date) => {
//     return followupDates.some(followup =>
//       followup.date.toDateString() === date.toDateString()
//     );
//   };

//   const getFollowupForDate = (date) => {
//     return followupDates.find(followup =>
//       followup.date.toDateString() === date.toDateString()
//     );
//   };

//   const isSelected = (date) => {
//     return selectedDate && selectedDate.toDateString() === date.toDateString();
//   };

//   const isInRange = (date) => {
//     if (!rangeStart || !rangeEnd) return false;
//     return date >= rangeStart && date <= rangeEnd;
//   };

//   // Range preset functions
//   const setPresetRange = (presetValue) => {
//     setRangePreset(presetValue);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     let start, end;

//     switch (presetValue) {
//       case '7days':
//       case '15days':
//       case '20days':
//       case '30days':
//       case '60days':
//       case '90days':
//         const preset = rangePresets.find(p => p.value === presetValue);
//         start = new Date(today);
//         end = new Date(today);
//         end.setDate(today.getDate() + preset.days - 1);
//         break;

//       case 'currentMonth':
//         start = new Date(today.getFullYear(), today.getMonth(), 1);
//         end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//         break;

//       case 'lastMonth':
//         start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//         end = new Date(today.getFullYear(), today.getMonth(), 0);
//         break;

//       case 'nextMonth':
//         start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
//         end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
//         break;

//       default: // custom
//         return;
//     }

//     setRangeStart(start);
//     setRangeEnd(end);
//   };

//   const setCustomDaysRange = () => {
//     if (!customDays || customDays < 1) return;

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const start = new Date(today);
//     const end = new Date(today);
//     end.setDate(today.getDate() + parseInt(customDays) - 1);

//     setRangeStart(start);
//     setRangeEnd(end);
//     setRangePreset('custom');
//   };

//   // Range and filtering functions
//   const getFollowupsInRange = () => {
//     if (!rangeStart || !rangeEnd) return [];

//     return followupDates.filter(followup => {
//       const followupDate = new Date(followup.date);
//       followupDate.setHours(0, 0, 0, 0);
//       const start = new Date(rangeStart);
//       start.setHours(0, 0, 0, 0);
//       const end = new Date(rangeEnd);
//       end.setHours(0, 0, 0, 0);

//       return followupDate >= start && followupDate <= end;
//     });
//   };

//   const getFilteredFollowups = () => {
//     const rangeFollowups = getFollowupsInRange();

//     switch (selectedFilter) {
//       case 'done':
//         return rangeFollowups.filter(followup => followup.status === 'done');
//       case 'missed':
//         return rangeFollowups.filter(followup => followup.status === 'missed');
//       case 'planned':
//         return rangeFollowups.filter(followup => followup.status === 'planned');
//       default:
//         return rangeFollowups;
//     }
//   };

//   const getStatusCounts = () => {
//     const rangeFollowups = getFollowupsInRange();
//     return {
//       all: rangeFollowups.length,
//       done: rangeFollowups.filter(f => f.status === 'done').length,
//       missed: rangeFollowups.filter(f => f.status === 'missed').length,
//       planned: rangeFollowups.filter(f => f.status === 'planned').length,
//     };
//   };

//   const getRangeDays = () => {
//     if (!rangeStart || !rangeEnd) return 0;
//     const diffTime = Math.abs(rangeEnd - rangeStart);
//     return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
//   };

//   // Navigation functions
//   const goToPreviousMonth = () => {
//     if (currentMonth === 0) {
//       setCurrentMonth(11);
//       setCurrentYear(currentYear - 1);
//     } else {
//       setCurrentMonth(currentMonth - 1);
//     }
//   };

//   const goToNextMonth = () => {
//     if (currentMonth === 11) {
//       setCurrentMonth(0);
//       setCurrentYear(currentYear + 1);
//     } else {
//       setCurrentMonth(currentMonth + 1);
//     }
//   };

//   const handleMonthChange = (e) => {
//     setCurrentMonth(parseInt(e.target.value));
//   };

//   const handleYearChange = (e) => {
//     setCurrentYear(parseInt(e.target.value));
//   };

//   // Event handlers
//   const handleDateClick = (date) => {
//     // Allow clicking on any visible date, not just current month
//     const clickedDate = new Date(date);
//     clickedDate.setHours(0, 0, 0, 0);


//     if (!rangeStart) {
//       // First click - set range start
//       setRangeStart(new Date(clickedDate));
//       setRangeEnd(null);
//       setSelectedDate(null);
//       setRangePreset('custom');
//     } else if (!rangeEnd) {
//       // Second click - set range end
//       if (clickedDate >= rangeStart) {
//         setRangeEnd(new Date(clickedDate));
//       } else {
//         // If clicked date is before start, make it the new start
//         setRangeEnd(new Date(rangeStart));
//         setRangeStart(new Date(clickedDate));
//       }
//       setRangePreset('custom');
//     } else {
//       // Third click - reset and start new range
//       setRangeStart(new Date(clickedDate));
//       setRangeEnd(null);
//       setRangePreset('custom');
//     }

//   };

//   const toggleRangeMode = () => {
//     setIsRangeMode(!isRangeMode);
//     setRangeStart(null);
//     setRangeEnd(null);
//     setSelectedDate(null);
//     setSelectedFilter('all');
//     setRangePreset('custom');
//   };

//   const clearRange = () => {
//     setRangeStart(null);
//     setRangeEnd(null);
//     setSelectedFilter('all');
//     setRangePreset('custom');
//   };

//   // Generate data for rendering
//   const calendarDays = generateCalendarDays();
//   const years = generateYears();
//   const statusCounts = getStatusCounts();

//   const getDayClasses = (date) => {
//     const followup = getFollowupForDate(date);
//     const isCurrentMonthDate = isCurrentMonth(date);
//     const isTodayDate = isToday(date);
//     const isSelectedDate = isSelected(date);
//     const hasFollowupDate = hasFollowup(date);
//     const isInRangeDate = isInRange(date);
//     const isRangeStartDate = rangeStart && date.toDateString() === rangeStart.toDateString();
//     const isRangeEndDate = rangeEnd && date.toDateString() === rangeEnd.toDateString();

//     let classes = ['calendar-day', 'position-relative', 'text-center', 'p-2', 'border', 'cursor-pointer'];

//     // In range mode, make all dates visible and clickable
//     if (isRangeMode) {
//       if (!isCurrentMonthDate) {
//         classes.push('text-muted', 'bg-light');
//       } else {
//         classes.push('text-dark', 'bg-white');
//       }
//     } else {
//       // In single date mode, only current month dates are fully visible
//       if (!isCurrentMonthDate) {
//         classes.push('text-muted', 'bg-light');
//       } else {
//         classes.push('text-dark', 'bg-white');
//       }
//     }

//     if (isTodayDate) {
//       classes.push('today');
//     }

//     if (isSelectedDate) {
//       classes.push('selected');
//     }

//     if (hasFollowupDate && followup) {
//       if (followup.status === 'planned') {
//         classes.push('followup-planned');
//       } else if (followup.status === 'done') {
//         classes.push('followup-done');
//       } else if (followup.status === 'missed') {
//         classes.push('followup-missed');
//       }
//     }

//     if (isInRangeDate) {
//       classes.push('in-range');
//     }

//     if (isRangeStartDate || isRangeEndDate) {
//       classes.push('range-endpoint');
//     }

//     return classes.join(' ');
//   };

//   return (
//     <>

//       <div className="calendar-container rounded">
//         <div className="card shadow">
//           <div className="card-body">

//             {/* Header */}
//             <div className="border-bottom pb-3 mb-4">
//               <div className="d-flex align-items-center">
//                 <span className="me-3 fs-5">📅</span>
//                 <span className="fs-5 fw-bold text-dark">Followup Calendar</span>
//               </div>
//             </div>



//             <div className="mb-4 p-3 bg-primary bg-opacity-10 rounded">
//               <div className="row g-2 mb-3">
//                 <div className="col-md-12">
//                   <label className="form-label small fw-semibold">Preset Ranges:</label>

//                   <ul className="days-list">
//                     {rangePresets.map(preset => (
//                       <li key={preset.value}>
//                         <button
//                           className="btn btn-sm btn-outline-primary"
//                           value={preset.value}
//                             onChange={(e) => setPresetRange(e.target.value)}
                       
//                         >
//                           {preset.label}
//                         </button>
//                       </li>
//                     ))}
//                   </ul>

//                 </div>


//               </div>
//             </div>

//             {/* Navigation Controls */}
//             <div className="d-flex justify-content-between align-items-center mb-4 py-2">
//               <button
//                 onClick={goToPreviousMonth}
//                 className="btn btn-outline-secondary"
//               >
//                 ←
//               </button>

//               <div className="d-flex gap-2">
//                 <select
//                   value={currentMonth}
//                   onChange={handleMonthChange}
//                   className="form-select form-select-sm"
//                   style={{ width: 'auto' }}
//                 >
//                   {monthNames.map((month, index) => (
//                     <option key={index} value={index}>
//                       {month}
//                     </option>
//                   ))}
//                 </select>

//                 <select
//                   value={currentYear}
//                   onChange={handleYearChange}
//                   className="form-select form-select-sm"
//                   style={{ width: 'auto' }}
//                 >
//                   {years.map(year => (
//                     <option key={year} value={year}>
//                       {year}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <button
//                 onClick={goToNextMonth}
//                 className="btn btn-outline-secondary"
//               >
//                 →
//               </button>
//             </div>

//             {/* Range Mode Controls */}
//             {/* <div className="mb-3 p-3 bg-light rounded">
//               <div className="d-flex justify-content-between align-items-center">
//                 <button 
//                   onClick={toggleRangeMode}
//                   className={`btn btn-sm ${
//                     isRangeMode 
//                       ? 'btn-warning' 
//                       : 'btn-outline-secondary'
//                   }`}
//                 >
//                   {isRangeMode ? '📅 Single Date' : '📊 Range Select'}
//                 </button>
                
//                 {isRangeMode && (rangeStart || rangeEnd) && (
//                   <button 
//                     onClick={clearRange} 
//                     className="btn btn-outline-danger btn-sm"
//                   >
//                     Clear Range
//                   </button>
//                 )}
//               </div>

//             </div> */}

//             {/* Range Preset Controls */}




//             {/* Range Info with Stats */}
//             {isRangeMode && rangeStart && (
//               <div className="mb-3 p-3 range-stats">
//                 <div className="row">
//                   <div className="col-md-8">
//                     <h6 className="mb-1">📅 Selected Range:</h6>
//                     <p className="mb-0 small">
//                       <strong>{formatDate(rangeStart)}</strong>
//                       {rangeEnd ? ` to ${formatDate(rangeEnd)}` : ' (select end date)'}
//                     </p>
//                   </div>
//                   <div className="col-md-4 text-end">
//                     {rangeEnd && (
//                       <div>
//                         <div className="fw-bold fs-4">{getRangeDays()}</div>
//                         <div className="small">Days Selected</div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Week Days Header */}
//             <div className="calendar-grid mb-2">
//               {weekDays.map(day => (
//                 <div key={day} className="week-header">
//                   {day}
//                 </div>
//               ))}
//             </div>

//             {/* Calendar Grid */}
//             <div className={`calendar-grid ${isRangeMode ? 'range-selection-mode' : ''}`}>
//               {calendarDays.map((date, index) => {
//                 const followup = getFollowupForDate(date);
//                 const isCurrentMonthDate = isCurrentMonth(date);
//                 const hasFollowupDate = hasFollowup(date);

//                 let dayClasses = getDayClasses(date);
//                 if (isRangeMode) {
//                   dayClasses += ' range-mode';
//                 }

//                 return (
//                   <div
//                     key={index}
//                     className={dayClasses}
//                     onClick={() => handleDateClick(date)}
//                     title={isRangeMode ?
//                       (!rangeStart ? 'Click to set range start' :
//                         !rangeEnd ? 'Click to set range end' :
//                           'Click to start new range') :
//                       `${formatDate(date)}${hasFollowupDate ? ` - ${followup?.title}` : ''}`
//                     }
//                   >
//                     {date.getDate()}
//                     {hasFollowupDate && isCurrentMonthDate && followup && (
//                       <div className={`followup-indicator ${followup.status}`}>
//                         {followup.status === 'done' ? '✓' : followup.status === 'missed' ? '✗' : '○'}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>

//             {/* Selected Date Info */}
//             {selectedDate && !isRangeMode && (
//               <div className="mt-4 p-3 bg-info bg-opacity-10 rounded">
//                 <p className="mb-0 small">Selected Date: <strong>{formatDate(selectedDate)}</strong></p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>


//       <style>
//         {`
//           .calendar-grid {
//             display: grid;
//             grid-template-columns: repeat(7, 1fr);
//             gap: 2px;
//           }
          
//           .calendar-day {
//             min-height: 40px;
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             font-size: 0.875rem;
//             transition: all 0.2s;
//             border-radius: 4px;
//           }
          
//           .calendar-day:hover {
//             background-color: #e9ecef !important;
//             transform: scale(1.05);
//             box-shadow: 0 2px 4px rgba(0,0,0,0.1);
//           }
          
//           .calendar-day.range-mode:hover {
//             background-color: #cfe2ff !important;
//             border-color: #0d6efd !important;
//           }
          
//           .calendar-day.today {
//             background-color: #cfe2ff !important;
//             color: #0a58ca !important;
//             font-weight: bold;
//             border: 2px solid #0d6efd !important;
//           }
          
//           .calendar-day.selected {
//             background-color: #fd7e14 !important;
//             color: white !important;
//             font-weight: bold;
//           }
          
//           .calendar-day.followup-planned {
//             background-color: #fff3cd !important;
//             border-color: #ffc107 !important;
//           }
          
//           .calendar-day.followup-done {
//             background-color: #d1e7dd !important;
//             border-color: #198754 !important;
//           }
          
//           .calendar-day.followup-missed {
//             background-color: #f8d7da !important;
//             border-color: #dc3545 !important;
//           }
          
//           .calendar-day.in-range {
//             background-color: #cfe2ff !important;
//             border-color: #0d6efd !important;
//           }
          
//           .calendar-day.range-endpoint {
//             background-color: #0d6efd !important;
//             color: white !important;
//             font-weight: bold;
//           }
          
//           .week-header {
//             background-color: #e9ecef;
//             padding: 8px;
//             font-size: 0.75rem;
//             font-weight: bold;
//             color: #6c757d;
//             text-align: center;
//           }
          
//           .followup-indicator {
//             position: absolute;
//             bottom: 2px;
//             right: 2px;
//             width: 12px;
//             height: 12px;
//             border-radius: 50%;
//             font-size: 8px;
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             color: white;
//             font-weight: bold;
//           }
          
//           .followup-indicator.done {
//             background-color: #198754;
//           }
          
//           .followup-indicator.missed {
//             background-color: #dc3545;
//           }
          
//           .followup-indicator.planned {
//             background-color: #ffc107;
//           }
          
//           .cursor-pointer {
//             cursor: pointer;
//           }
          
//           .max-height-300 {
//             max-height: 300px;
//             overflow-y: auto;
//           }
          
//           .range-stats {
//             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//             color: white;
//             border-radius: 10px;
//           }
          
//           .range-selection-mode {
//             border: 2px dashed #0d6efd;
//             border-radius: 8px;
//             background: rgba(13, 110, 253, 0.05);
//             padding: 4px;
//           }
          
//           .calendar-day.range-mode {
//             position: relative;
//           }
          
//           .calendar-day.range-mode::after {
//             content: '';
//             position: absolute;
//             top: -2px;
//             left: -2px;
//             right: -2px;
//             bottom: -2px;
//             border: 2px solid transparent;
//             border-radius: 6px;
//             transition: all 0.2s;
//           }
          
//           .calendar-day.range-mode:hover::after {
//             border-color: #0d6efd;
//             background: rgba(13, 110, 253, 0.1);
//           }
       
//           .days-list{
//           display:flex;
//           gap:5px;
//           flex-wrap:wrap;
//           }
//           .days-list > li{
//           background: #ccc;
//           padding:3px !important;
//           }
//           `
//         }
//       </style>
//     </>
//   );
// };

// export default FollowupCalendar;