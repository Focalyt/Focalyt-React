# Counselor Performance Matrix API Implementation

## Overview
This implementation adds a new API endpoint to fetch Counselor Performance Matrix data from the `statusLogs` collection instead of calculating it from the frontend. This provides more accurate and real-time data based on actual status changes tracked in the system.

## Backend Changes

### New API Endpoint
**Route:** `GET /college/candidate/counselor-performance-matrix`

**Location:** `backend/controllers/routes/college/candidate.js`

**Features:**
- Fetches data from `statusLogs` collection using MongoDB aggregation
- Supports date range filtering (`startDate`, `endDate`)
- Supports center filtering (`centerId`)
- Returns data in the same format expected by the frontend
- Includes summary statistics

**Query Parameters:**
- `startDate` (optional): Start date for filtering (YYYY-MM-DD format)
- `endDate` (optional): End date for filtering (YYYY-MM-DD format)
- `centerId` (optional): Center ID to filter by (use 'all' for all centers)

**Response Format:**
```json
{
  "status": true,
  "message": "Counselor Performance Matrix data fetched successfully",
  "data": {
    "CounselorName": {
      "Total": 100,
      "KYCDone": 50,
      "KYCStage": 75,
      "Admissions": 30,
      "Dropouts": 5,
      "Paid": 30,
      "Unpaid": 70,
      "ConversionRate": 30.0,
      "DropoutRate": 5.0,
      "StatusName": {
        "count": 25,
        "substatuses": {
          "SubStatusName": 10
        }
      }
    }
  },
  "summary": {
    "totalCounselors": 5,
    "totalLeads": 500,
    "totalAdmissions": 150,
    "totalDropouts": 25,
    "averageConversionRate": 30.0
  }
}
```

## Frontend Changes

### New State Variables
- `counselorMatrixData`: Stores the API response data
- `counselorMatrixLoading`: Tracks loading state

### New Function
- `fetchCounselorMatrixData()`: Fetches data from the new API endpoint

### Updated Components
- Replaced local `getCounselorMatrix()` calculation with API data
- Added loading state to the Counselor Performance Matrix table
- Added empty state when no data is available
- Added useEffect to fetch data when filters change

### Data Flow
1. Component mounts or filters change
2. `fetchCounselorMatrixData()` is called
3. API request is made with current filters (date range, center)
4. Response data is stored in `counselorMatrixData` state
5. Table renders with API data or shows loading/empty states

## Benefits

1. **Real-time Data**: Data is fetched from actual status logs instead of calculated from current state
2. **Better Performance**: Reduces frontend calculations and memory usage
3. **Accurate Metrics**: Based on actual status changes tracked over time
4. **Consistent Data**: Same data source as other dashboard metrics
5. **Scalable**: Can handle large datasets efficiently with MongoDB aggregation

## Usage

The API automatically integrates with the existing dashboard filters:
- Date range selection affects the data fetched
- Center selection filters the data by center
- All existing functionality remains the same

## Testing

To test the API:
1. Start the backend server
2. Navigate to the B2C dashboard
3. Change date filters or center selection
4. Verify that the Counselor Performance Matrix updates with new data
5. Check that loading states work correctly

## Error Handling

- API errors are logged to console
- Loading states prevent UI issues during data fetching
- Empty states provide clear feedback when no data is available
- Network errors are handled gracefully
