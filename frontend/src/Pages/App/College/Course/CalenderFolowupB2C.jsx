import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Calendar, Clock, MapPin, Phone, Mail, User, Building, Filter, Search, Plus, RefreshCw, AlertCircle, CheckCircle, XCircle, CalendarDays, ChevronLeft, ChevronRight, Grid, List, Bell } from 'lucide-react';
import { getGoogleAuthCode, getGoogleRefreshToken } from '../../../../Component/googleOAuth';

const CalenderFolowupB2C = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [userData, setUserData] = useState(JSON.parse(sessionStorage.getItem("user") || "{}"));
  const token = userData.token;

  // Same session as Registrations — if Google was connected there, it appears here
  useEffect(() => {
    const syncUser = () => {
      try {
        const u = JSON.parse(sessionStorage.getItem("user") || "{}");
        setUserData(u);
      } catch (_) {
        /* ignore */
      }
    };
    syncUser();
    window.addEventListener("focus", syncUser);
    return () => window.removeEventListener("focus", syncUser);
  }, []);

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoginLoading, setIsGoogleLoginLoading] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);

  const getInitialMonthRange = () => {
    const today = new Date();
    return {
      start: new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0),
      end: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
    };
  };

  const [selectedDateRange, setSelectedDateRange] = useState(() => getInitialMonthRange());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Single date input
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, upcoming, completed, overdue
  const [showFilters, setShowFilters] = useState(true); // Set to true to show filters by default
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('calendar'); // 'list' | 'calendar' (default: Google-style month grid)
  const [calendarLayout, setCalendarLayout] = useState('month'); // 'month' | 'week'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() => {
    const t = new Date();
    const s = new Date(t);
    s.setDate(t.getDate() - t.getDay());
    s.setHours(0, 0, 0, 0);
    return s;
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    notes: ''
  });

  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarksData, setRemarksData] = useState({
    remarks: '',
    status: ''
  });
  const [selectedEventForRemarks, setSelectedEventForRemarks] = useState(null);
  const [showAllRemarks, setShowAllRemarks] = useState(false); // Toggle to show all remarks
  // Handle view mode changes and update date range accordingly
  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
    const today = new Date();

    if (newViewMode === 'calendar') {
      if (calendarLayout === 'week') {
        const ws = new Date(today);
        ws.setDate(today.getDate() - today.getDay());
        ws.setHours(0, 0, 0, 0);
        setWeekStart(ws);
        const end = new Date(ws);
        end.setDate(ws.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        setSelectedDateRange({ start: new Date(ws), end });
      } else {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        setSelectedDateRange({ start: startOfMonth, end: endOfMonth });
      }
    } else {
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      setSelectedDateRange({ start: startOfDay, end: endOfDay });
    }
  };

  // Update date range when single date changes
  const handleDateChange = (dateString) => {
    setSelectedDate(dateString);
    const selectedDateObj = new Date(dateString);
    const startOfDay = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 0, 0, 0);
    const endOfDay = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 23, 59, 59);

    setSelectedDateRange({
      start: startOfDay,
      end: endOfDay
    });
  };

  // Update date range when month changes in calendar view
  const handleMonthChange = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);

    // Update date range to match the new month
    const startOfMonth = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0, 23, 59, 59);

    setSelectedDateRange({
      start: startOfMonth,
      end: endOfMonth
    });
  };

  // Go to today and update date range
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today.toISOString().split('T')[0]);
    const ws = new Date(today);
    ws.setDate(today.getDate() - today.getDay());
    ws.setHours(0, 0, 0, 0);
    setWeekStart(ws);

    if (viewMode === 'calendar') {
      if (calendarLayout === 'week') {
        const start = new Date(ws);
        const end = new Date(ws);
        end.setDate(ws.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        setSelectedDateRange({ start, end });
      } else {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        setSelectedDateRange({ start: startOfMonth, end: endOfMonth });
      }
    } else {
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      setSelectedDateRange({ start: startOfDay, end: endOfDay });
    }
  };

  /** Same flow as Registrations.jsx — tokens stored on `user` in sessionStorage */
  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoginLoading(true);
      const result = await getGoogleAuthCode({
        scopes: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/calendar'],
        user: userData,
      });
      const refreshToken = await getGoogleRefreshToken({
        code: result,
        user: userData,
      });
      const user = {
        ...userData,
        googleAuthToken: refreshToken.data,
      };
      sessionStorage.setItem('googleAuthToken', JSON.stringify(refreshToken.data));
      sessionStorage.setItem('user', JSON.stringify(user));
      setUserData(user);
      await fetchCalendarEvents();
    } catch (error) {
      console.error('Google login failed:', error);
      if (error.message?.includes('Popup blocked')) {
        alert('Please allow popups for this site and try again.');
      } else if (error.message?.includes('closed by user')) {
        alert('Login cancelled by user.');
      } else {
        alert('Login failed: ' + error.message);
      }
    } finally {
      setIsGoogleLoginLoading(false);
    }
  };

  const handleGoogleLogout = () => {
    try {
      const updatedUser = { ...userData };
      delete updatedUser.googleAuthToken;
      setUserData(updatedUser);
      sessionStorage.removeItem('googleAuthToken');
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        delete parsedUser.googleAuthToken;
        sessionStorage.setItem('user', JSON.stringify(parsedUser));
      }
      fetchCalendarEvents();
    } catch (err) {
      console.error('Error disconnecting Google Calendar:', err);
    }
  };

  const isLikelyB2bGoogleEvent = (ge) => {
    const summary = (ge.summary || '').toLowerCase();
    const description = (ge.description || '').toLowerCase();
    return summary.includes('b2b') || description.includes('b2b');
  };

  // B2C CRM follow-ups only (no centre visits, no B2B-tagged Google events); + other Google primary events when connected
  const fetchCalendarEvents = async () => {
    try {
      setIsLoading(true);
      const auth = token || JSON.parse(sessionStorage.getItem('user') || '{}').token;

      const response = await axios.get(`${backendUrl}/college/candidate/calendar-visit-data`, {
        params: {
          startDate: selectedDateRange.start.toISOString(),
          endDate: selectedDateRange.end.toISOString(),
        },
        headers: {
          'x-auth': auth,
        },
      });

      if (!response.data.status) {
        console.error('Failed to fetch visit calendar data:', response.data.message);
        setIsLoading(false);
        return;
      }

      const raw = response.data.data || [];
      const dedup = new Map();
      raw.forEach((row) => {
        const k = `${row.sourceType}-${String(row.id)}`;
        if (!dedup.has(k)) dedup.set(k, row);
      });
      const rows = Array.from(dedup.values()).filter((r) => r.sourceType === 'b2c_followup');

      const visitEvents = rows.map((visit) => {
        const prefix = 'b2c';
        return {
          id: `${prefix}-${visit.id}`,
          summary: visit.title,
          start: {
            dateTime: visit.start,
            date: visit.start,
          },
          end: {
            dateTime: visit.end,
            date: visit.end,
          },
          description: `Visit Type: ${visit.visitType}\nCandidate: ${visit.candidateName}\nMobile: ${visit.candidateMobile}\nCourse: ${visit.courseName}\nCenter: ${visit.centerName}\nStatus: ${visit.status}`,
          location: visit.centerName,
          visitType: visit.visitType,
          remarks: visit.remarks,
          updatedBy: visit.updatedBy,
          createdAt: visit.createdAt,
          updatedAt: visit.updatedAt,
          statusUpdatedAt: visit.statusUpdatedAt,
          candidateName: visit.candidateName,
          candidateMobile: visit.candidateMobile,
          candidateEmail: visit.candidateEmail,
          courseName: visit.courseName,
          centerName: visit.centerName,
          status: visit.status,
          backgroundColor: getVisitTypeColor(visit.visitType, true),
          borderColor: getVisitTypeColor(visit.visitType, true),
          extendedProps: {
            type: 'b2c_followup',
            visitType: visit.visitType,
            candidateName: visit.candidateName,
            candidateMobile: visit.candidateMobile,
            candidateEmail: visit.candidateEmail,
            courseName: visit.courseName,
            centerName: visit.centerName,
            followupStatus: visit.followupStatus,
            googleCalendarEventId: visit.googleCalendarEventId || null,
          },
        };
      });

      const linkedGoogleIds = new Set(
        rows.filter((r) => r.googleCalendarEventId).map((r) => String(r.googleCalendarEventId))
      );

      let merged = [...visitEvents];
      const freshUser = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (freshUser.googleAuthToken?.accessToken) {
        try {
          const gres = await axios.post(`${backendUrl}/api/getgooglecalendarevents`, {
            user: freshUser,
            accessToken: freshUser.googleAuthToken.accessToken,
            startDate: selectedDateRange.start.toISOString(),
            endDate: selectedDateRange.end.toISOString(),
          });
          const payload = gres.data?.data;
          const gList = payload?.events || [];
          const googleMapped = gList
            .filter(
              (ge) =>
                ge?.id &&
                !linkedGoogleIds.has(String(ge.id)) &&
                !isLikelyB2bGoogleEvent(ge)
            )
            .map((ge) => {
              const s = ge.start?.dateTime || ge.start?.date;
              const e = ge.end?.dateTime || ge.end?.date || s;
              return {
                id: `gcal-${ge.id}`,
                summary: ge.summary || 'Google Calendar',
                htmlLink: ge.htmlLink,
                start: { dateTime: s, date: s },
                end: { dateTime: e, date: e },
                description: ge.description || '',
                location: ge.location || '',
                backgroundColor: '#fbbc04',
                borderColor: '#f59e0b',
                extendedProps: {
                  type: 'google',
                  googleEventId: ge.id,
                },
              };
            });
          merged = [...merged, ...googleMapped];
        } catch (ge) {
          console.warn('Google Calendar list failed:', ge?.response?.data || ge?.message);
        }
      }

      const seen = new Map();
      merged.forEach((ev) => {
        if (!seen.has(ev.id)) seen.set(ev.id, ev);
      });
      setCalendarEvents(Array.from(seen.values()));
      window.dispatchEvent(new CustomEvent('b2c-calendar-updated'));
    } catch (error) {
      console.error('Error fetching visit calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVisitTypeColor = (visitType, isB2cFollowup) => {
    if (isB2cFollowup) return '#6f42c1'; // purple — CRM follow-up
    switch (visitType) {
      case 'Visit':
        return '#1a73e8'; // Google-blue
      case 'Joining':
        return '#188038';
      case 'Both':
        return '#00838f';
      case 'Follow-up':
        return '#6f42c1';
      default:
        return '#5f6368';
    }
  };
  // Filter events based on search term and status
  useEffect(() => {
    let filtered = calendarEvents;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event => {
        const searchLower = searchTerm.toLowerCase();
        return (
          event.summary?.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower) ||
          event.candidateName?.toLowerCase().includes(searchLower) ||
          event.courseName?.toLowerCase().includes(searchLower) ||
          event.centerName?.toLowerCase().includes(searchLower) ||
          event.batchName?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filter by status
    const now = new Date();
    switch (statusFilter) {
      case 'upcoming':
        filtered = filtered.filter(event => {
          const eventStart = new Date(event.start.dateTime || event.start.date);
          return eventStart > now;
        });
        break;
      case 'ongoing':
        filtered = filtered.filter(event => {
          const eventStart = new Date(event.start.dateTime || event.start.date);
          const eventEnd = new Date(event.end.dateTime || event.end.date);
          return eventStart <= now && eventEnd >= now;
        });
        break;
      case 'completed':
        filtered = filtered.filter(event => {
          const eventEnd = new Date(event.end.dateTime || event.end.date);
          return eventEnd < now;
        });
        break;
      case 'overdue':
        filtered = filtered.filter(event => {
          const eventStart = new Date(event.start.dateTime || event.start.date);
          return eventStart < now && new Date(event.end.dateTime || event.end.date) > now;
        });
        break;
      default:
        break;
    }

    setFilteredEvents(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [calendarEvents, searchTerm, statusFilter]);

  // Get paginated events
  const getPaginatedEvents = () => {
    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    return filteredEvents.slice(startIndex, endIndex);
  };

  // Get total pages
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  // Format event date and time
  const formatEventDateTime = (event) => {
    const start = new Date(event.start.dateTime || event.start.date);
    const end = new Date(event.end.dateTime || event.end.date);

    const startFormatted = start.toLocaleString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const endFormatted = end.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return { startFormatted, endFormatted, start, end };
  };

  // Get event status
  const getEventStatus = (event) => {
    const now = new Date();
    const start = new Date(event.start.dateTime || event.start.date);
    const end = new Date(event.end.dateTime || event.end.date);

    if (end < now) return 'completed';
    if (start < now && end > now) return 'ongoing';
    if (start < now) return 'overdue';
    return 'upcoming';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'text-primary';
      case 'ongoing': return 'text-warning';
      case 'completed': return 'text-success';
      case 'overdue': return 'text-danger';
      default: return 'text-muted';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming': return <Clock className="text-primary" size={16} />;
      case 'ongoing': return <AlertCircle className="text-warning" size={16} />;
      case 'completed': return <CheckCircle className="text-success" size={16} />;
      case 'overdue': return <XCircle className="text-danger" size={16} />;
      default: return <Calendar className="text-muted" size={16} />;
    }
  };

  // Extract contact information from event description
  const extractContactInfo = (description) => {
    if (!description) return {};

    const contactInfo = {};

    // Extract phone numbers
    const phoneMatch = description.match(/(?:Contact|Phone|Mobile):\s*([+\d\s\-()]+)/i);
    if (phoneMatch) contactInfo.phone = phoneMatch[1].trim();

    // Extract email
    const emailMatch = description.match(/(?:Email):\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) contactInfo.email = emailMatch[1].trim();

    // Extract business name
    const businessMatch = description.match(/(?:Business|Company):\s*([^\n]+)/i);
    if (businessMatch) contactInfo.business = businessMatch[1].trim();

    return contactInfo;
  };

  // Calendar view functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Add previous month's days
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const localDateKey = (d) => {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return '';
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };

  const getEventsForDate = (date) => {
    const key = localDateKey(date);
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.start.dateTime || event.start.date);
      return localDateKey(eventDate) === key;
    });
  };

  // Keep week view date range in sync (Sun–Sat) for API fetch
  useEffect(() => {
    if (viewMode !== 'calendar' || calendarLayout !== 'week') return;
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    setSelectedDateRange({ start, end });
  }, [viewMode, calendarLayout, weekStart]);

  // Load B2C visits + follow-ups when range changes (logged-in college user)
  useEffect(() => {
    if (!token || !backendUrl) return;
    fetchCalendarEvents();
  }, [selectedDateRange, token, backendUrl]);

  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Close modal
  const closeEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  // Mark event as completed
  const handleMarkAsCompleted = async (event, status) => {
    try {
      const eventId = String(event.id).replace(/^(visit|b2c)-/, '');
      let remarks = '';
      if (status === 'cancelled') {
        remarks = window.prompt("Enter the reason for cancellation");
      } else {
        remarks = window.prompt("Enter the remarks for completion");
      }



      const response = await axios.patch(
        `${backendUrl}/college/candidate/updatecalendarevent`,
        {
          user: userData,
          eventId: eventId,
          status: status,
          remarks,
        },
        {
          headers: {
            'x-auth': token
          }
        }
      );

      if (response.data?.status) {
        await fetchCalendarEvents();
      }
    } catch (err) {
      console.error("Error marking event as completed", err.response?.data || err.message);
    }
  };



  // const handleMarkAsCompleted = async () => {
  //   if (!selectedEvent) return;

  //   try {
  //     const response = await axios.patch(`${backendUrl}/college/candidate/updatecalendarevent`, {
  //       user: userData,
  //       appliedId: selectedEvent.id,
  //       status: 'completed',
  //     });

  //     // const response = await axios.put(`${backendUrl}/college/candidate/updatecalendarevent`, {
  //     //   user: userData,
  //     //   appliedId: selectedEvent.id,
  //     //   status: 'completed',
  //     // });

  //     console.log("response" , response.data)
  //     if (response.data.success) {
  //       alert('Event marked as completed successfully!');
  //       closeEventModal();
  //       fetchCalendarEvents(); // Refresh events
  //     } else {
  //       alert('Failed to mark event as completed: ' + response.data.error);
  //     }
  //   } catch (error) {
  //     console.error('Error marking event as completed:', error);
  //     alert('Error marking event as completed. Please try again.');
  //   }
  // };

  // Handle reschedule
  const handleReschedule = () => {
    setShowRescheduleModal(true);
  };

  // Close reschedule modal
  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setRescheduleData({
      newDate: '',
      newTime: '',
      notes: ''
    });
  };

  // Submit reschedule
  // const submitReschedule = async () => {
  //   if (!selectedEvent || !rescheduleData.newDate || !rescheduleData.newTime) {
  //     alert('Please fill in all required fields.');
  //     return;
  //   }

  //   try {
  //     const newDateTime = new Date(`${rescheduleData.newDate}T${rescheduleData.newTime}`);
  //     const originalStart = new Date(selectedEvent.start.dateTime || selectedEvent.start.date);
  //     const originalEnd = new Date(selectedEvent.end.dateTime || selectedEvent.end.date);
  //     const duration = originalEnd.getTime() - originalStart.getTime();
  //     const newEndDateTime = new Date(newDateTime.getTime() + duration);

  //     const response = await axios.post(`${backendUrl}/api/updatecalendarevent`, {
  //       user: userData,
  //       eventId: selectedEvent.id,
  //       action: 'reschedule',
  //       newStartTime: newDateTime.toISOString(),
  //       newEndTime: newEndDateTime.toISOString(),
  //       notes: rescheduleData.notes || 'Event rescheduled via B2C Follow-up Calendar'
  //     });

  //     if (response.data.success) {
  //       alert('Event rescheduled successfully!');
  //       closeRescheduleModal();
  //       closeEventModal();
  //       fetchCalendarEvents(); // Refresh events
  //     } else {
  //       alert('Failed to reschedule event: ' + response.data.error);
  //     }
  //   } catch (error) {
  //     console.error('Error rescheduling event:', error);
  //     alert('Error rescheduling event. Please try again.');
  //   }
  // };

  const shiftWeek = (direction) => {
    setWeekStart((prev) => {
      const n = new Date(prev);
      n.setDate(prev.getDate() + direction * 7);
      return n;
    });
  };

  const switchCalendarLayout = (layout) => {
    setCalendarLayout(layout);
    const today = new Date();
    if (layout === 'month') {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1, 0, 0, 0);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
      setSelectedDateRange({ start: startOfMonth, end: endOfMonth });
    } else {
      const ws = new Date(today);
      ws.setDate(today.getDate() - today.getDay());
      ws.setHours(0, 0, 0, 0);
      setWeekStart(ws);
    }
  };

  const renderEventChip = (event, eventIndex) => {
    const status = getEventStatus(event);
    const t = event.extendedProps?.type;
    const isVisitEvent = t === 'visit';
    const isB2c = t === 'b2c_followup';
    const isGoogle = t === 'google';
    const rawStart = event.start?.dateTime || event.start?.date;
    const startStr = rawStart != null ? String(rawStart) : '';
    const isDateOnly =
      isGoogle && startStr.length <= 10 && !startStr.includes('T');

    return (
      <div
        key={eventIndex}
        className={`calendar-event ${getStatusColor(status)} ${isVisitEvent || isB2c || isGoogle ? 'visit-event' : ''}`}
        title={event.summary}
        onClick={() => handleEventClick(event)}
        style={{
          backgroundColor: event.backgroundColor || '#e8f0fe',
          borderLeft: `3px solid ${event.borderColor || '#1a73e8'}`,
        }}
      >
        <div className="event-time">
          {isDateOnly
            ? 'All day'
            : new Date(rawStart).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
        </div>
        {(isVisitEvent || isB2c) && event.extendedProps.candidateName && (
          <div className="event-candidate-name">
            <small className="text-white fw-bold text-truncate d-block" style={{ maxWidth: '100%' }}>
              {event.extendedProps.candidateName}
            </small>
          </div>
        )}
        {isGoogle && (
          <div className="event-candidate-name">
            <small className="text-dark fw-semibold text-truncate d-block" style={{ maxWidth: '100%' }}>
              {event.summary}
            </small>
          </div>
        )}
        <div className="event-visit-type">
          <span
            className={`badge badge-sm ${isB2c ? 'bg-purple' : isGoogle ? 'bg-warning text-dark' : 'bg-primary'}`}
            style={isB2c ? { background: '#6f42c1' } : {}}
          >
            {isGoogle ? 'Google' : isB2c ? 'Follow-up' : event.extendedProps.visitType}
          </span>
        </div>
      </div>
    );
  };

  // Calendar view: Google-style month or week
  const CalendarView = () => {
    const days =
      calendarLayout === 'week'
        ? Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            return { date: d, isCurrentMonth: true };
          })
        : getDaysInMonth(currentMonth);

    const monthName = currentMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekLabel = `${weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return (
      <div className="calendar-container shadow-sm bg-white rounded-3 p-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => (calendarLayout === 'week' ? shiftWeek(-1) : handleMonthChange(-1))}
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <h4 className="mb-0 fs-5">{calendarLayout === 'week' ? weekLabel : monthName}</h4>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => (calendarLayout === 'week' ? shiftWeek(1) : handleMonthChange(1))}
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn btn-outline-secondary ${calendarLayout === 'month' ? 'active' : ''}`}
                onClick={() => switchCalendarLayout('month')}
              >
                Month
              </button>
              <button
                type="button"
                className={`btn btn-outline-secondary ${calendarLayout === 'week' ? 'active' : ''}`}
                onClick={() => switchCalendarLayout('week')}
              >
                Week
              </button>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={goToToday}>
              Today
            </button>
          </div>
        </div>

        <div className={`calendar-grid ${calendarLayout === 'week' ? 'calendar-week-mode' : ''}`}>
          <div className="calendar-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="calendar-day-header">
                {day}
              </div>
            ))}
          </div>

          <div className={`calendar-body ${calendarLayout === 'week' ? 'calendar-week-row' : ''}`}>
            {days.map((day, index) => {
              const events = getEventsForDate(day.date);
              const isToday = day.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                >
                  <div className="day-number">{day.date.getDate()}</div>
                  <div className="day-events">
                    {events.slice(0, calendarLayout === 'week' ? 12 : 3).map((event, eventIndex) => renderEventChip(event, eventIndex))}
                    {events.length > (calendarLayout === 'week' ? 12 : 3) && (
                      <div className="more-events text-muted small">+{events.length - (calendarLayout === 'week' ? 12 : 3)} more</div>
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
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
          <div className="flex-grow-1">
            <h1 className="display-6 display-lg-5 fw-bold text-dark mb-2">B2C Follow-up Calendar</h1>
            <p className="text-muted mb-0">
              CRM follow-ups (Admission / Registrations) and your <strong>Google Calendar</strong> in one place. Connect Google once — same link as Registrations — to see events created when you save a follow-up.
            </p>
          </div>
          <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-lg-auto align-items-stretch">
            <div className="btn-group w-100 w-sm-auto" role="group">
              <button
                type="button"
                className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('list')}
                disabled={!token}
              >
                <List className="me-1" size={16} />
                <span className="d-none d-sm-inline">List</span>
              </button>
              <button
                type="button"
                className={`btn btn-outline-secondary ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('calendar')}
                disabled={!token}
              >
                <Grid className="me-1" size={16} />
                <span className="d-none d-sm-inline">Calendar</span>
              </button>
            </div>
            <button
              className="btn btn-outline-primary w-100 w-sm-auto"
              onClick={fetchCalendarEvents}
              disabled={isLoading || !token}
            >
              {isLoading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="d-none d-sm-inline">Refreshing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="me-2" size={20} />
                  <span className="d-none d-sm-inline">Refresh</span>
                </>
              )}
            </button>
            {!userData.googleAuthToken?.accessToken ? (
              <button
                type="button"
                className="btn btn-outline-secondary w-100 w-sm-auto"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoginLoading || !token}
                title="Connect Google Calendar (same as Registrations)"
              >
                {isGoogleLoginLoading ? (
                  <span className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  <>
                    <Calendar className="me-2" size={18} />
                    <span className="d-none d-sm-inline">Connect Google</span>
                  </>
                )}
              </button>
            ) : (
              <div className="d-flex flex-column flex-sm-row gap-1 align-items-stretch">
                <span className="align-self-center small text-success px-1 d-none d-sm-inline">Google linked</span>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleGoogleLogout}
                  title="Disconnect Google Calendar on this browser"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!token && (
        <div className="alert alert-warning" role="alert">
          Sign in with your institute account to load visits and B2C follow-ups.
        </div>
      )}

      {/* Filters and Search */}
      {token && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              {/* Search */}
              <div className="col-md-4">
                <div className="position-relative">
                  <Search className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted b2cSearch" size={20} />
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Search candidate names , course name , center name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Events</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="col-md-3">
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <button
                  className="btn btn-outline-secondary w-100"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="me-1" size={16} />
                  Filters
                </button>
              </div>
            </div>

            {/* Additional Filters */}
            {showFilters && (
              <div className="row g-3 mt-3 pt-3 border-top">
                {/* Quick Date Presets */}
                <div className="col-md-6">
                  <label className="form-label small fw-medium">Quick Filters</label>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        const today = new Date();
                        const todayString = today.toISOString().split('T')[0];
                        setSelectedDate(todayString);
                        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
                        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
                        setSelectedDateRange({ start: startOfDay, end: endOfDay });
                      }}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        const today = new Date();
                        const startOfWeek = new Date(today);
                        startOfWeek.setDate(today.getDate() - today.getDay());
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6);
                        setSelectedDateRange({
                          start: new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate(), 0, 0, 0),
                          end: new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59)
                        });
                      }}
                    >
                      This Week
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        const today = new Date();
                        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
                        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
                        setSelectedDateRange({ start: startOfMonth, end: endOfMonth });
                      }}
                    >
                      This Month
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        const today = new Date();
                        const startOfNextWeek = new Date(today);
                        startOfNextWeek.setDate(today.getDate() + (7 - today.getDay()));
                        const endOfNextWeek = new Date(startOfNextWeek);
                        endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
                        setSelectedDateRange({
                          start: new Date(startOfNextWeek.getFullYear(), startOfNextWeek.getMonth(), startOfNextWeek.getDate(), 0, 0, 0),
                          end: new Date(endOfNextWeek.getFullYear(), endOfNextWeek.getMonth(), endOfNextWeek.getDate(), 23, 59, 59)
                        });
                      }}
                    >
                      Next Week
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {token && (
        <div className="row">
          <div className="col-12">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading calendar events...</p>
              </div>
            ) : viewMode === 'calendar' ? (
              <CalendarView />
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-5">
                <Calendar className="text-muted mb-3" size={48} />
                <h5 className="text-muted">No events found</h5>
                <p className="text-muted">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'No B2C follow-up events found in the selected date range.'}
                </p>
              </div>
            ) : (
              <>
                {/* Events Summary */}
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <div className="card bg-primary text-white">
                      <div className="card-body text-center">
                        <h4 className="mb-1">{filteredEvents.length}</h4>
                        <small>Total Events</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-success text-white">
                      <div className="card-body text-center">
                        <h4 className="mb-1">
                          {filteredEvents.filter(e => getEventStatus(e) === 'upcoming').length}
                        </h4>
                        <small>Upcoming</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-warning text-white">
                      <div className="card-body text-center">
                        <h4 className="mb-1">
                          {filteredEvents.filter(e => getEventStatus(e) === 'ongoing').length}
                        </h4>
                        <small>Ongoing</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-info text-white">
                      <div className="card-body text-center">
                        <h4 className="mb-1">
                          {filteredEvents.filter(e => getEventStatus(e) === 'completed').length}
                        </h4>
                        <small>Completed</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Events List */}
                <div className="row g-3">
                  {getPaginatedEvents().map((event, index) => {
                    const { startFormatted, endFormatted, start, end } = formatEventDateTime(event);
                    const status = getEventStatus(event);
                    const contactInfo = extractContactInfo(event.description);

                    return (
                      <div key={event.id || index} className="col-12">
                        <div className="card shadow-sm h-100">
                          <div className="card-body">
                            <div className="row">
                              <div className="col-md-8">
                                <div className="d-flex align-items-start justify-content-between mb-3">
                                  <div>
                                    <h5 className="card-title mb-1">
                                      {event.summary || 'Untitled Event'}
                                      {event.visitType && (
                                        <span className="badge bg-primary ms-2">
                                          {event.visitType}
                                        </span>
                                      )}
                                    </h5>
                                    <div className="d-flex align-items-center gap-3 text-muted small">
                                      <span className="d-flex align-items-center">
                                        <CalendarDays className="me-1" size={14} />
                                        {startFormatted} - {endFormatted}
                                      </span>
                                      <span className={`d-flex align-items-center ${getStatusColor(status)}`}>
                                        {getStatusIcon(status)}
                                        <span className="ms-1 text-capitalize">{status}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* {event.description && (
                                  <p className="text-muted small mb-3">
                                    {event.description.length > 200
                                      ? `${event.description.substring(0, 200)}...`
                                      : event.description}
                                  </p>
                                )} */}

                                {/* Contact Information */}
                                {/* {(contactInfo.phone || contactInfo.email || contactInfo.business) && (
                                  <div className="row g-2 mb-3">
                                    {contactInfo.business && (
                                      <div className="col-md-6">
                                        <div className="d-flex align-items-center text-muted small">
                                          <Building className="me-2" size={14} />
                                          <span>{contactInfo.business}</span>
                                        </div>
                                      </div>
                                    )}
                                    {contactInfo.phone && (
                                      <div className="col-md-6">
                                        <div className="d-flex align-items-center text-muted small">
                                          <Phone className="me-2" size={14} />
                                          <a href={`tel:${contactInfo.phone}`} className="text-decoration-none">
                                            {contactInfo.phone}
                                          </a>
                                        </div>
                                      </div>
                                    )}
                                    {contactInfo.email && (
                                      <div className="col-md-6">
                                        <div className="d-flex align-items-center text-muted small">
                                          <Mail className="me-2" size={14} />
                                          <a href={`mailto:${contactInfo.email}`} className="text-decoration-none">
                                            {contactInfo.email}
                                          </a>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )} */}

                                {/* Visit Information */}
                                {event.visitType && (
                                  <div className="row g-2 mb-3">
                                    <div className="col-md-6">
                                      <div className="d-flex align-items-center text-muted small">
                                        <Calendar className="me-2" size={14} />
                                        <span>Visit Type: <strong>{event.visitType}</strong></span>
                                      </div>
                                    </div>
                                    {event.visitDate && (
                                      <div className="col-md-6">
                                        <div className="d-flex align-items-center text-muted small">
                                          <Clock className="me-2" size={14} />
                                          <span>Visit Date: <strong>{new Date(event.visitDate).toLocaleDateString()}</strong></span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Candidate Information */}
                                {/* {event.candidateName && (
                                  <div className="row g-2 mb-3">
                                    <div className="col-md-6">
                                      <div className="d-flex align-items-center text-muted small">
                                        <User className="me-2" size={14} />
                                        <span>Candidate: <strong>{event.candidateName}</strong></span>
                                      </div>
                                    </div>
                                    {event.candidateMobile && (
                                      <div className="col-md-6">
                                        <div className="d-flex align-items-center text-muted small">
                                          <Phone className="me-2" size={14} />
                                          <a href={`tel:${event.candidateMobile}`} className="text-decoration-none">
                                            <strong>{event.candidateMobile}</strong>
                                          </a>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )} */}

                                {/* {event.location && (
                                  <div className="d-flex align-items-center text-muted small mb-2">
                                    <MapPin className="me-2" size={14} />
                                    <span>{event.location}</span>
                                  </div>
                                )} */}
                                {(event.status === 'cancelled' || event.status === 'completed') && event.remarks && (
                                  <div className="alert alert-light py-2 px-3 mb-2">
                                    <div className="d-flex align-items-center text-muted small">
                                      <MapPin className="me-2" size={14} />
                                      <span><strong>Remarks:</strong> {event.remarks}</span>
                                    </div>
                                  </div>
                                )}

                              </div>

                              <div className="col-md-4">
                                <div className="d-flex flex-column gap-2">
                                  <button className="btn btn-outline-primary btn-sm">
                                    <Phone className="me-1" size={14} />
                                    Call Contact
                                  </button>
                                  <button className="btn btn-outline-success btn-sm">
                                    <Mail className="me-1" size={14} />
                                    Send Email
                                  </button>
                                  <button className="btn btn-outline-info btn-sm">
                                    <Calendar className="me-1" size={14} />
                                    Reschedule
                                  </button>
                                  <button className="btn btn-outline-info btn-sm" onClick={() => handleMarkAsCompleted(event, 'completed')}>
                                    <Calendar className="me-1" size={14} />
                                    Mark as Completed
                                  </button>
                                  <button className="btn btn-outline-info btn-sm" onClick={() => handleMarkAsCompleted(event, 'cancelled')}>
                                    <Calendar className="me-1" size={14} />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <nav aria-label="Events pagination">
                      <ul className="pagination">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft size={16} />
                          </button>
                        </li>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </button>
                            </li>
                          );
                        })}

                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom styles */}
      <style jsx>{`
        .card {
          transition: all 0.3s ease;
          border-radius: 12px;
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
        }
        
        .pagination .page-link {
          border-radius: 8px;
          margin: 0 2px;
          border: 1px solid #dee2e6;
        }
        
        .pagination .page-item.active .page-link {
          background-color: #007bff;
          border-color: #007bff;
        }
        
        .form-control, .form-select {
          border-radius: 8px;
          border: 1.5px solid #ced4da;
        }
        
        .form-control:focus, .form-select:focus {
          border-color: #007bff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        
        .btn {
          border-radius: 8px;
          font-weight: 500;
        }
        
        .alert {
          border-radius: 12px;
          border: none;
        }

        /* Calendar Styles */
        .calendar-container {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .calendar-grid {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          overflow: hidden;
        }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background-color: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .calendar-day-header {
          padding: 12px 8px;
          text-align: center;
          font-weight: 600;
          color: #6c757d;
          font-size: 0.875rem;
        }

        .calendar-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(6, 1fr);
        }

        .calendar-body.calendar-week-row {
          grid-template-rows: minmax(280px, auto);
        }

        .calendar-day {
          min-height: 120px;
          border-right: 1px solid #e9ecef;
          border-bottom: 1px solid #e9ecef;
          padding: 8px;
          position: relative;
          background: white;
        }

        .calendar-day:nth-child(7n) {
          border-right: none;
        }

        .calendar-day.other-month {
          background-color: #f8f9fa;
          color: #adb5bd;
        }

        .calendar-day.today {
          background-color: #e3f2fd;
        }

        .calendar-day.today .day-number {
          background-color: #007bff;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .day-number {
          font-weight: 500;
          margin-bottom: 4px;
          font-size: 0.875rem;
        }

        .day-events {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .calendar-event {
          background-color: #e3f2fd;
          border-left: 3px solid #007bff;
          padding: 4px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .calendar-event:hover {
          background-color: #bbdefb;
        }

        .calendar-event.text-success {
          background-color: #e8f5e8;
          border-left-color: #28a745;
        }

        .calendar-event.text-warning {
          background-color: #fff3cd;
          border-left-color: #ffc107;
        }

        .calendar-event.text-danger {
          background-color: #f8d7da;
          border-left-color: #dc3545;
        }

        .event-time {
          font-weight: 600;
          color: #fff;
          font-size: 0.7rem;
        }

        .event-title {
          color: #495057;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .event-candidate-name {
          margin: 2px 0;
          line-height: 1.2;
        }

        .event-candidate-name small {
          background-color: rgba(255, 255, 255, 0.9);
          color: #007bff !important;
          padding: 1px 4px;
          border-radius: 3px;
          font-weight: 600;
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .event-visit-type {
          margin-top: 2px;
        }

        .event-visit-type .badge {
          font-size: 0.6rem;
          padding: 2px 4px;
        }

        .more-events {
          font-size: 0.7rem;
          color: #6c757d;
          font-style: italic;
          text-align: center;
          padding: 2px;
                 }
       `}</style>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <Calendar className="me-2" size={20} />
                  Event Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeEventModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="row">
                  <div className="col-lg-8">
                    {/* Event Title */}
                    <h4 className="mb-3 text-break">{selectedEvent.summary || 'Untitled Event'}</h4>

                    {/* Event Date & Time */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center text-muted mb-2">
                        <Clock className="me-2" size={16} />
                        <strong>Date & Time</strong>
                      </div>
                      <div className="ps-4">
                        {formatEventDateTime(selectedEvent).startFormatted} - {formatEventDateTime(selectedEvent).endFormatted}
                      </div>
                    </div>

                    {/* Event Status */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center text-muted mb-2">
                        {getStatusIcon(getEventStatus(selectedEvent))}
                        <strong className="ms-2">Status</strong>
                      </div>
                      <div className="ps-4">
                        <span className={`badge ${getStatusColor(getEventStatus(selectedEvent)).replace('text-', 'bg-')}`}>
                          {getEventStatus(selectedEvent).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Event Description */}
                    {selectedEvent.description && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center text-muted mb-2">
                          <CalendarDays className="me-2" size={16} />
                          <strong>Description</strong>
                        </div>
                        <div className="ps-4">
                          <div className="text-break" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {selectedEvent.description}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact Information */}
                    {(() => {
                      const contactInfo = extractContactInfo(selectedEvent.description);
                      if (contactInfo.phone || contactInfo.email || contactInfo.business) {
                        return (
                          <div className="mb-3">
                            <div className="d-flex align-items-center text-muted mb-2">
                              <User className="me-2" size={16} />
                              <strong>Contact Information</strong>
                            </div>
                            <div className="ps-4">
                              {contactInfo.business && (
                                <div className="mb-2">
                                  <div className="d-flex align-items-center text-muted small">
                                    <Building className="me-2" size={14} />
                                    <strong>Business:</strong>
                                  </div>
                                  <div className="ms-4 text-break">{contactInfo.business}</div>
                                </div>
                              )}
                              {contactInfo.phone && (
                                <div className="mb-2">
                                  <div className="d-flex align-items-center text-muted small">
                                    <Phone className="me-2" size={14} />
                                    <strong>Phone:</strong>
                                  </div>
                                  <div className="ms-4">
                                    <a href={`tel:${contactInfo.phone}`} className="text-decoration-none">
                                      {contactInfo.phone}
                                    </a>
                                  </div>
                                </div>
                              )}
                              {contactInfo.email && (
                                <div className="mb-2">
                                  <div className="d-flex align-items-center text-muted small">
                                    <Mail className="me-2" size={14} />
                                    <strong>Email:</strong>
                                  </div>
                                  <div className="ms-4">
                                    <a href={`mailto:${contactInfo.email}`} className="text-decoration-none text-break">
                                      {contactInfo.email}
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Location */}
                    {selectedEvent.location && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center text-muted mb-2">
                          <MapPin className="me-2" size={16} />
                          <strong>Location</strong>
                        </div>
                        <div className="ps-4 text-break">
                          {selectedEvent.location}
                        </div>
                      </div>
                    )}
                    {selectedEvent.remarks && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center text-muted mb-2">
                          <MapPin className="me-2" size={16} />
                          <strong>Remarks</strong>
                        </div>
                        <div className="ps-4 text-break">
                          {selectedEvent.remarks}
                        </div>
                      </div>
                    )}
                    {selectedEvent.status && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center text-muted mb-2">
                          <MapPin className="me-2" size={16} />
                          <strong>Status</strong>
                        </div>
                        <div className="ps-4 text-break">
                          {selectedEvent.status}
                        </div>
                      </div>
                    )}
                    {selectedEvent.updatedBy && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center text-muted mb-2">
                          <MapPin className="me-2" size={16} />
                          <strong>Updated By</strong>
                        </div>
                        <div className="ps-4 text-break">
                          {selectedEvent.updatedBy}
                        </div>
                      </div>
                    )}
                    {selectedEvent.statusUpdatedAt && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center text-muted mb-2">
                          <MapPin className="me-2" size={16} />
                          <strong>Status Updated At</strong>
                        </div>
                        <div className="ps-4 text-break">
                          {new Date(selectedEvent.statusUpdatedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-lg-4">
                    {/* Action Buttons */}
                    <div className="d-flex flex-column gap-2 mb-3">
                      {selectedEvent.extendedProps?.type !== 'google' && (
                        <>
                          <button className="btn btn-primary btn-sm">
                            <Phone className="me-2" size={16} />
                            Call Contact
                          </button>
                          <button className="btn btn-success btn-sm">
                            <Mail className="me-2" size={16} />
                            Send Email
                          </button>
                          <button
                            className="btn btn-info btn-sm"
                            onClick={handleReschedule}
                          >
                            <Calendar className="me-2" size={16} />
                            Reschedule
                          </button>
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleMarkAsCompleted(selectedEvent)}
                          >
                            <AlertCircle className="me-2" size={16} />
                            Mark as Completed
                          </button>
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => handleMarkAsCompleted(selectedEvent, 'cancelled')}>Cancel</button>
                        </>
                      )}
                      {selectedEvent.htmlLink && (
                        <a
                          className="btn btn-outline-primary btn-sm"
                          href={selectedEvent.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <CalendarDays className="me-2" size={16} />
                          Open in Google Calendar
                        </a>
                      )}
                    </div>

                    {/* Event Metadata */}
                    <div className="p-3 bg-light rounded">
                      <h6 className="mb-3">Event Details</h6>
                      <div className="small text-muted">
                        {selectedEvent.createdAt && (
                        <div className="mb-1">
                          <strong>Created:</strong> {new Date(selectedEvent.createdAt).toLocaleString()}
                        </div>
                        )}
                        {selectedEvent.updatedAt && (
                        <div className="mb-1">
                          <strong>Last Updated:</strong> {new Date(selectedEvent.updatedAt).toLocaleString()}
                        </div>
                        )}
                        <div className="mb-1">
                          <strong>Event ID:</strong>
                          <div className="text-break font-monospace small">{selectedEvent.id}</div>
                        </div>
                        {selectedEvent.htmlLink && (
                          <div className="mb-1">
                            <strong>Google Calendar Link:</strong>
                            <br />
                            <a href={selectedEvent.htmlLink} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-break">
                              View in Google Calendar
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeEventModal}>
                  Close
                </button>
                <button type="button" className="btn btn-primary">
                  Edit Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedEvent && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <Calendar className="me-2" size={20} />
                  Reschedule Event
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeRescheduleModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6>Event: {selectedEvent.summary}</h6>
                  <p className="text-muted small">
                    Current: {formatEventDateTime(selectedEvent).startFormatted} - {formatEventDateTime(selectedEvent).endFormatted}
                  </p>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">New Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={rescheduleData.newDate}
                      onChange={(e) => setRescheduleData(prev => ({
                        ...prev,
                        newDate: e.target.value
                      }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">New Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={rescheduleData.newTime}
                      onChange={(e) => setRescheduleData(prev => ({
                        ...prev,
                        newTime: e.target.value
                      }))}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Notes (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Add any notes about the reschedule..."
                      value={rescheduleData.notes}
                      onChange={(e) => setRescheduleData(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeRescheduleModal}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary"
                // onClick={submitReschedule}
                >
                  Reschedule Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {
          `
          @media(max-width: 768px){
            .b2cSearch{
             width:25px!important;
             margin-top: 0px !important;
            }
          }
          `
        }
      </style>
    </div>
  );
};

export default CalenderFolowupB2C; 