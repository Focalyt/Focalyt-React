# Advanced Filters Implementation for Counselor Performance Matrix

## Overview

This document describes the implementation of advanced filters for the Counselor Performance Matrix API. The advanced filters allow users to filter data based on multiple criteria including projects, verticals, courses, centers, counselors, and various status flags.

## API Endpoint

**Route:** `GET /college/candidate/counselor-performance-matrix`

## Filter Parameters

### 1. Date Filters
- `startDate` (string): Start date in YYYY-MM-DD format
- `endDate` (string): End date in YYYY-MM-DD format

### 2. Single Value Filters
- `centerId` (string): Single center ID or 'all'
- `courseId` (string): Single course ID or 'all'
- `verticalId` (string): Single vertical ID or 'all'
- `projectId` (string): Single project ID or 'all'
- `batchId` (string): Single batch ID or 'all'
- `statusId` (string): Single status ID or 'all'
- `subStatusId` (string): Single sub-status ID or 'all'
- `counselorId` (string): Single counselor ID or 'all'

### 3. Multi-Select Filters (JSON Arrays)
- `projects` (string): JSON string array of project IDs
- `verticals` (string): JSON string array of vertical IDs
- `course` (string): JSON string array of course IDs
- `center` (string): JSON string array of center IDs
- `counselor` (string): JSON string array of counselor IDs

### 4. Boolean Filters
- `kycStage` (string): 'true' or 'false'
- `kycApproved` (string): 'true' or 'false'
- `admissionStatus` (string): 'true' or 'false'
- `batchAssigned` (string): 'true' or 'false'
- `zeroPeriodAssigned` (string): 'true' or 'false'
- `batchFreezed` (string): 'true' or 'false'
- `dropOut` (string): 'true' or 'false'

## Frontend Integration

### Filter State Structure
```javascript
const [formData, setFormData] = useState({
  projects: {
    type: "includes",
    values: []
  },
  verticals: {
    type: "includes",
    values: []
  },
  course: {
    type: "includes",
    values: []
  },
  center: {
    type: "includes",
    values: []
  },
  counselor: {
    type: "includes",
    values: []
  }
});
```

### API Call with Filters
```javascript
const fetchCounselorMatrixData = async () => {
  const queryParams = new URLSearchParams({
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    ...(selectedCenter !== 'all' && { centerId: selectedCenter }),
    // Advanced filter parameters
    ...(formData?.projects?.values?.length > 0 && { 
      projects: JSON.stringify(formData.projects.values) 
    }),
    ...(formData?.verticals?.values?.length > 0 && { 
      verticals: JSON.stringify(formData.verticals.values) 
    }),
    ...(formData?.course?.values?.length > 0 && { 
      course: JSON.stringify(formData.course.values) 
    }),
    ...(formData?.center?.values?.length > 0 && { 
      center: JSON.stringify(formData.center.values) 
    }),
    ...(formData?.counselor?.values?.length > 0 && { 
      counselor: JSON.stringify(formData.counselor.values) 
    })
  });

  const response = await axios.get(
    `${backendUrl}/college/candidate/counselor-performance-matrix?${queryParams}`,
    { headers: { 'x-auth': token } }
  );
};
```

## Backend Implementation

### Filter Processing
The backend processes filters in the following order:

1. **Parse Multi-Select Filters**: Convert JSON string arrays to MongoDB ObjectId arrays
2. **Apply Single Value Filters**: Convert single IDs to MongoDB ObjectIds
3. **Apply Boolean Filters**: Convert string values to boolean
4. **Combine All Filters**: Merge all filters into a single MongoDB query object

### MongoDB Query Structure
```javascript
const combinedFilters = {
  ...dateFilter,
  ...advancedFilters
};

// Example advancedFilters object:
{
  _centerId: { $in: [ObjectId1, ObjectId2] },
  _courseId: ObjectId,
  vertical: { $in: [ObjectId1, ObjectId2] },
  project: { $in: [ObjectId1] },
  counsellor: { $in: [ObjectId1, ObjectId2] },
  kycStage: true,
  admissionStatus: false,
  // ... other boolean filters
}
```

## StatusLog Schema Fields Used

The following fields from the StatusLog schema are used for filtering:

- `_appliedId`: Reference to AppliedCourses
- `_courseId`: Reference to Course
- `vertical`: Reference to Vertical
- `project`: Reference to Project
- `_centerId`: Reference to Center
- `_batchId`: Reference to Batch
- `_statusId`: Reference to Status
- `_subStatusId`: Reference to SubStatus
- `counsellor`: Reference to User
- `kycStage`: Boolean
- `kycApproved`: Boolean
- `admissionStatus`: Boolean
- `batchAssigned`: Boolean
- `zeroPeriodAssigned`: Boolean
- `batchFreezed`: Boolean
- `dropOut`: Boolean

## Usage Examples

### Example 1: Filter by Center and Course
```
GET /college/candidate/counselor-performance-matrix?centerId=center123&courseId=course456
```

### Example 2: Multi-Select Projects and Verticals
```
GET /college/candidate/counselor-performance-matrix?projects=["proj1","proj2"]&verticals=["vert1"]
```

### Example 3: Boolean Status Filters
```
GET /college/candidate/counselor-performance-matrix?kycStage=true&admissionStatus=true
```

### Example 4: Combined Filters
```
GET /college/candidate/counselor-performance-matrix?startDate=2025-01-01&endDate=2025-12-31&centerId=center123&projects=["proj1"]&kycStage=true
```

## Testing

Use the provided test file `test_advanced_filters.js` to test all filter combinations:

```bash
node test_advanced_filters.js
```

## Notes

1. **Filter Priority**: Multi-select filters take precedence over single value filters for the same field
2. **Date Handling**: Dates are converted to IST timezone and adjusted for the 18:30 boundary
3. **Error Handling**: Invalid JSON arrays are caught and logged without breaking the query
4. **Performance**: All filters are applied at the MongoDB level for optimal performance
5. **Backward Compatibility**: Existing single-value filters continue to work alongside new advanced filters

## Frontend Filter Options

The filter options are fetched from the `/college/filters-data` endpoint and include:
- Verticals
- Projects
- Courses
- Centers
- Counselors

These options are populated based on the college's data and are used in the advanced filter dropdowns.
