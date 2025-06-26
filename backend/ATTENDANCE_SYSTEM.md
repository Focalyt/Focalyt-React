# Attendance System Documentation

## Overview
The attendance system has been added to the `AppliedCourses` model to track student attendance for both zero period and regular batch periods.

## Schema Structure

### Attendance Fields in AppliedCourses
```javascript
attendance: {
  zeroPeriod: {
    totalSessions: Number,
    attendedSessions: Number,
    attendancePercentage: Number,
    sessions: [{
      date: Date,
      status: String, // 'Present' or 'Absent'
      markedBy: ObjectId,
      markedAt: Date,
      remarks: String
    }]
  },
  regularPeriod: {
    // Same structure as zeroPeriod
  }
}
```

## API Endpoints

### 1. Mark Attendance (Single or Bulk)
**POST** `/college/candidate/mark-attendance`

**For Single Student:**
```json
{
  "appliedCourseIds": ["course_id"],
  "date": "2024-01-15",
  "status": "Present", // "Present" or "Absent"
  "period": "regularPeriod", // "zeroPeriod" or "regularPeriod"
  "remarks": "Optional remarks"
}
```

**For Multiple Students:**
```json
{
  "appliedCourseIds": ["course_id_1", "course_id_2", "course_id_3"],
  "date": "2024-01-15",
  "status": "Present", // "Present" or "Absent"
  "period": "regularPeriod", // "zeroPeriod" or "regularPeriod"
  "remarks": "Optional remarks"
}
```

**Single Student Response:**
```json
{
  "status": true,
  "message": "Attendance marked successfully",
  "data": {
    "candidateId": "candidate_id",
    "attendance": { /* attendance data */ }
  }
}
```

**Multiple Students Response:**
```json
{
  "status": true,
  "message": "Bulk attendance marked successfully. 3 successful, 0 failed",
  "data": {
    "successful": [
      {
        "appliedCourseId": "course_id_1",
        "status": "success",
        "data": {
          "candidateId": "candidate_id_1",
          "attendance": { /* attendance data */ }
        }
      }
    ],
    "failed": [],
    "totalProcessed": 3,
    "successCount": 3,
    "errorCount": 0
  }
}
```

### 2. Mark Batch Attendance
**POST** `/college/candidate/batch-mark-attendance`

**Body:**
```json
{
  "batchId": "batch_id",
  "date": "2024-01-15",
  "status": "Present", // "Present" or "Absent"
  "period": "regularPeriod", // "zeroPeriod" or "regularPeriod"
  "remarks": "Optional remarks"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Batch attendance marked successfully. 25 successful, 0 failed",
  "data": {
    "batchId": "batch_id",
    "date": "2024-01-15",
    "period": "regularPeriod",
    "successful": [
      {
        "appliedCourseId": "course_id_1",
        "candidateId": "candidate_id_1",
        "status": "success"
      }
    ],
    "failed": [],
    "totalStudents": 25,
    "successCount": 25,
    "errorCount": 0
  }
}
```

### 3. Get Attendance Report
**GET** `/college/candidate/attendance-report/:appliedCourseId`

**Query Parameters:**
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering
- `period` (optional): "zeroPeriod" or "regularPeriod"

### 4. Get Batch Attendance
**GET** `/college/candidate/batch-attendance/:batchId`

**Query Parameters:**
- `date`: Date to get attendance for
- `period` (optional): "zeroPeriod" or "regularPeriod"

### 5. Update Attendance
**PUT** `/college/candidate/update-attendance/:appliedCourseId`

**Body:**
```json
{
  "date": "2024-01-15",
  "status": "Present",
  "period": "regularPeriod",
  "remarks": "Updated remarks"
}
```

## Model Methods

### 1. markAttendance(date, status, period, markedBy, remarks)
Marks attendance for a specific date and period.

### 2. calculateAttendanceStats(period)
Recalculates attendance statistics for the specified period.

### 3. getAttendanceReport(startDate, endDate, period)
Generates a detailed attendance report with filtering options.

### 4. bulkMarkAttendance(attendanceData)
Marks attendance for multiple dates at once.

## Usage Examples

### Marking Attendance
```javascript
const appliedCourse = await AppliedCourses.findById(courseId);
await appliedCourse.markAttendance(
  new Date('2024-01-15'),
  'Present',
  'regularPeriod',
  userId,
  'On time'
);
```

### Getting Attendance Report
```javascript
const report = appliedCourse.getAttendanceReport(
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  'regularPeriod'
);
```

### API Usage
```javascript
// Mark attendance
const response = await fetch('/college/candidate/mark-attendance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    appliedCourseIds: ['course_id'],
    date: '2024-01-15',
    status: 'Present',
    period: 'regularPeriod'
  })
});

// Get attendance report
const report = await fetch('/college/candidate/attendance-report/course_id?period=regularPeriod');
```

## Validation Rules

1. **Date Validation**: Attendance can only be marked within the batch's date range
   - Zero period: Between `batch.zeroPeriodStartDate` and `batch.zeroPeriodEndDate`
   - Regular period: Between `batch.startDate` and `batch.endDate`

2. **Status Validation**: Only accepts 'Present' or 'Absent'

3. **Period Validation**: Only accepts 'zeroPeriod' or 'regularPeriod'

4. **Batch Assignment**: Attendance can only be marked if a batch is assigned

## Attendance Calculation

- **Present** = Attended sessions
- **Attendance Percentage** = (Present sessions / Total sessions) × 100
- Statistics are automatically recalculated when attendance is marked

## Error Handling

The system includes comprehensive error handling for:
- Invalid dates
- Invalid status values
- Missing batch assignments
- Non-existent applied courses
- Date range violations 