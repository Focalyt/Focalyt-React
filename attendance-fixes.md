# Attendance System - Suggested Fixes

## 1. Date Handling Standardization

### Current Issue:
- Multiple date format conversions
- IST timezone handling scattered across code
- Inconsistent date comparisons

### Suggested Fix:
```javascript
// Create a centralized date utility
const DateUtils = {
  // Standard IST date format
  toISTDate: (date) => {
    const d = new Date(date);
    return new Date(d.getTime() + (5.5 * 60 * 60 * 1000))
      .toISOString()
      .split('T')[0];
  },
  
  // Compare dates ignoring time
  isSameDay: (date1, date2) => {
    return DateUtils.toISTDate(date1) === DateUtils.toISTDate(date2);
  },
  
  // Get today in IST
  getTodayIST: () => {
    return DateUtils.toISTDate(new Date());
  }
};

// Usage
const hasAttendanceToday = sessions.some(session => 
  DateUtils.isSameDay(session.date, selectedDate)
);
```

## 2. Performance Optimization

### Current Issue:
- `calculateAttendance` function runs multiple times
- Heavy calculations on every render
- No memoization

### Suggested Fix:
```javascript
import { useMemo } from 'react';

// Memoize attendance calculations
const attendanceStats = useMemo(() => {
  return calculateAttendance(profile);
}, [profile.attendance, profile.batch]);

// Memoize filtered attendance
const filteredAttendance = useMemo(() => {
  return getFilteredAttendanceData(profile);
}, [profile, timeFilter, selectedDate, dateRange]);
```

## 3. Error Handling

### Current Issue:
- No proper error handling in API calls
- Silent failures possible
- No user feedback on errors

### Suggested Fix:
```javascript
const markIndividualAttendance = async (studentId, status) => {
  try {
    setIsLoading(true);
    setError(null);
    
    const result = await axios.post(
      `${backendUrl}/college/attendance/mark-attendance`,
      {
        appliedCourseId: studentId,
        date: selectedDate,
        status: status,
        period: activeTab === 'zeroPeriod' ? 'zeroPeriod' : 'regularPeriod',
      },
      { headers: { "x-auth": token } }
    );

    if (result.data.success) {
      showSuccessToast('Attendance marked successfully!');
      await fetchProfileData();
    } else {
      throw new Error(result.data.message);
    }
  } catch (error) {
    console.error("Error marking attendance:", error);
    showErrorToast(
      error.response?.data?.message || 
      'Failed to mark attendance. Please try again.'
    );
  } finally {
    setIsLoading(false);
  }
};
```

## 4. State Management Simplification

### Current Issue:
- Too many individual useState hooks (25+)
- Difficult to manage and debug
- Complex state updates

### Suggested Fix:
```javascript
// Group related states using useReducer
const initialAttendanceState = {
  selectedDate: new Date().toISOString().split('T')[0],
  showBulkControls: false,
  selectedStudents: new Set(),
  bulkAttendanceStatus: "",
  showAttendanceMode: false,
  timeFilter: "today",
  dateRange: { fromDate: "", toDate: "" },
  attendanceView: "daily",
  isLoading: false,
  error: null,
};

function attendanceReducer(state, action) {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, selectedDate: action.payload };
    case 'TOGGLE_BULK_MODE':
      return { ...state, showBulkControls: !state.showBulkControls };
    case 'SELECT_STUDENT':
      const newSelection = new Set(state.selectedStudents);
      if (newSelection.has(action.payload)) {
        newSelection.delete(action.payload);
      } else {
        newSelection.add(action.payload);
      }
      return { ...state, selectedStudents: newSelection };
    // ... more actions
    default:
      return state;
  }
}

const [attendanceState, dispatch] = useReducer(
  attendanceReducer, 
  initialAttendanceState
);
```

## 5. Loading States

### Current Issue:
- No loading indicators during API calls
- Poor user experience during data fetch
- No skeleton loaders

### Suggested Fix:
```javascript
// Add loading skeleton component
const AttendanceTableSkeleton = () => (
  <div className="skeleton-container">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="skeleton-row">
        <div className="skeleton skeleton-avatar"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-badge"></div>
      </div>
    ))}
  </div>
);

// Usage in component
{loadingData ? (
  <AttendanceTableSkeleton />
) : (
  <AttendanceTable data={allProfiles} />
)}
```

## 6. Accessibility Improvements

### Current Issue:
- Missing ARIA labels
- No keyboard navigation
- Poor screen reader support

### Suggested Fix:
```javascript
// Add proper ARIA attributes
<button
  onClick={() => markIndividualAttendance(profile._id, "Present")}
  aria-label={`Mark ${profile._candidate?.name} as present`}
  aria-pressed={todayAttendance[profile._id]?.status === "present"}
>
  Present
</button>

// Add keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggleStudentDetails(studentIndex);
    }
  }}
  onClick={() => toggleStudentDetails(studentIndex)}
>
  {/* Content */}
</div>
```

## 7. Data Validation

### Current Issue:
- No validation before marking attendance
- Can mark future dates
- Can mark duplicate attendance

### Suggested Fix:
```javascript
const validateAttendanceMarking = (studentId, date, status) => {
  const errors = [];
  
  // Check if date is in future
  if (new Date(date) > new Date()) {
    errors.push('Cannot mark attendance for future dates');
  }
  
  // Check if attendance already exists
  const hasExisting = profile.attendance?.sessions?.some(
    s => DateUtils.isSameDay(s.date, date)
  );
  if (hasExisting) {
    errors.push('Attendance already marked for this date');
  }
  
  // Check if student is eligible
  if (!profile.isZeroPeriodAssigned && !profile.isBatchFreeze) {
    errors.push('Student not eligible for attendance marking');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Use before marking
const validation = validateAttendanceMarking(studentId, selectedDate, status);
if (!validation.isValid) {
  showErrorToast(validation.errors.join(', '));
  return;
}
```

## 8. Code Organization

### Suggested File Structure:
```
src/
  components/
    Student/
      Student.jsx (Main component - 500 lines max)
      AttendanceTab.jsx
      AttendanceRegister.jsx
      AttendanceManagementModal.jsx
      MonthlyAttendanceSummary.jsx
      YearlyAttendanceSummary.jsx
  hooks/
    useAttendance.js
    useNavHeight.js
    useScrollBlur.js
  utils/
    attendanceCalculations.js
    dateUtils.js
  services/
    attendanceApi.js
```

## 9. Testing Recommendations

### Add Unit Tests:
```javascript
// attendanceCalculations.test.js
describe('calculateAttendance', () => {
  it('should calculate working days excluding Sundays', () => {
    const result = calculateWorkingDays('2025-01-01', '2025-01-31');
    expect(result).toBe(26); // 31 days - 5 Sundays
  });
  
  it('should calculate attendance percentage correctly', () => {
    const attendance = {
      present: 20,
      absent: 5,
      totalDays: 25
    };
    const percentage = calculatePercentage(attendance);
    expect(percentage).toBe(80);
  });
});
```

## Priority Order:
1. **HIGH**: Date handling standardization (affects data accuracy)
2. **HIGH**: Error handling (affects user experience)
3. **MEDIUM**: Performance optimization (affects load times)
4. **MEDIUM**: State management (affects maintainability)
5. **LOW**: Accessibility (affects inclusivity)
6. **LOW**: Code organization (affects long-term maintenance)

