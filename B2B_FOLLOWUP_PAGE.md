# B2B Follow-up Calendar Page

## Overview

The B2B Follow-up Calendar page is a new feature that allows users to view and manage B2B follow-up events from their Google Calendar. This page integrates with Google Calendar API to fetch events and provides a comprehensive interface for managing B2B follow-ups.

## Features

### 🔐 Google Calendar Integration
- **OAuth Authentication**: Secure Google Calendar access using OAuth 2.0
- **Token Management**: Automatic token refresh and session management
- **B2B Event Filtering**: Automatically filters events containing B2B-related keywords

### 📅 Event Management
- **Event Display**: Shows all B2B follow-up events with detailed information
- **Status Tracking**: Real-time status tracking (Upcoming, Ongoing, Completed, Overdue)
- **Contact Information**: Extracts and displays contact details from event descriptions
- **Search & Filter**: Advanced search and filtering capabilities

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern Interface**: Clean, intuitive design with smooth animations
- **Status Indicators**: Color-coded status indicators for easy identification
- **Pagination**: Efficient pagination for large event lists

## Page Structure

### Header Section
- Page title and description
- Google Calendar connection status
- Connect/Refresh buttons

### Filters Section
- **Search Bar**: Search events by title, description, or location
- **Status Filter**: Filter by event status (All, Upcoming, Ongoing, Completed, Overdue)
- **Date Range**: Select custom date ranges
- **Advanced Filters**: Collapsible advanced filtering options

### Events Summary
- **Total Events**: Count of all events
- **Upcoming**: Count of upcoming events
- **Ongoing**: Count of currently ongoing events
- **Completed**: Count of completed events

### Events List
- **Event Cards**: Detailed event information with contact details
- **Action Buttons**: Quick actions (Call, Email, Reschedule)
- **Status Indicators**: Visual status indicators with icons
- **Pagination**: Navigation through event pages

## API Integration

### Backend Endpoints
- `POST /api/getb2bcalendarevents`: Fetches B2B calendar events
- `POST /api/creategooglecalendarevent`: Creates new calendar events

### Google Calendar API
- **Scopes**: `https://www.googleapis.com/auth/calendar`
- **Event Filtering**: Filters events containing B2B keywords
- **Token Management**: Automatic refresh token handling

## File Structure

```
frontend/src/Pages/App/College/B2B/
├── B2BFollowUp.jsx          # Main component
├── DashboardB2B.jsx         # Existing dashboard
└── B2BSales.jsx            # Existing sales page
```

## Navigation

The page is accessible through:
- **URL**: `/institute/b2bfollowup`
- **Menu**: College Layout → Sales (B2B) → Calendar Follow-up

## Usage

### 1. Connect Google Calendar
- Click "Connect Google Calendar" button
- Authorize the application in Google OAuth popup
- Grant calendar access permissions

### 2. View Events
- Events are automatically loaded after connection
- Use search and filters to find specific events
- View event details and contact information

### 3. Manage Events
- Use action buttons for quick interactions
- Monitor event status and progress
- Track follow-up activities

## Technical Details

### State Management
- `calendarEvents`: Raw events from Google Calendar
- `filteredEvents`: Filtered events based on search/filters
- `selectedDateRange`: Date range for event fetching
- `searchTerm`: Search query
- `statusFilter`: Current status filter

### Event Processing
- **Contact Extraction**: Parses contact info from event descriptions
- **Status Calculation**: Determines event status based on timestamps
- **Date Formatting**: Formats dates for display

### Error Handling
- **Network Errors**: Graceful handling of API failures
- **Token Expiry**: Automatic token refresh
- **User Feedback**: Clear error messages and loading states

## Security Considerations

- **OAuth Tokens**: Stored securely in session storage
- **API Security**: All requests use proper authentication
- **Data Privacy**: Only B2B-related events are fetched
- **Token Refresh**: Automatic token refresh to maintain access

## Future Enhancements

1. **Event Creation**: Add ability to create new follow-up events
2. **Bulk Actions**: Support for bulk event management
3. **Notifications**: Real-time notifications for upcoming events
4. **Analytics**: Event analytics and reporting
5. **Integration**: Integration with existing B2B lead management

## Dependencies

- **React**: Frontend framework
- **Axios**: HTTP client for API calls
- **Lucide React**: Icon library
- **Google OAuth**: Authentication component
- **Bootstrap**: CSS framework for styling

## Browser Support

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

## Mobile Responsiveness

- **Desktop**: Full feature set with sidebar navigation
- **Tablet**: Optimized layout with touch-friendly controls
- **Mobile**: Simplified interface with mobile-specific interactions 