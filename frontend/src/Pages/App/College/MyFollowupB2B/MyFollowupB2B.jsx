import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, MapPin, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { getGoogleAuthCode, getGoogleRefreshToken } from '../../../../Component/googleOAuth';

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all'); // all, today, upcoming, past
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [googleAuthStatus, setGoogleAuthStatus] = useState('disconnected'); // disconnected, connected, loading

  // Get user's Google auth token from localStorage or session
  const getGoogleAuthToken = () => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      return user.googleAuthToken?.accessToken;
    }
    return null;
  };

  // Fetch Google Calendar events
  const fetchGoogleCalendarEvents = async () => {
    const accessToken = getGoogleAuthToken();
    
    console.log('🔍 Debug: Access Token:', accessToken ? 'Present' : 'Missing');
    
    if (!accessToken) {
      setGoogleAuthStatus('disconnected');
      setError('Google Calendar not connected. Please connect your Google account first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Debug: Making API call to /api/getb2bcalendarevents');
      
      const response = await axios.post('/api/getb2bcalendarevents', {
        accessToken,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      });

      console.log('🔍 Debug: API Response:', response.data);

      if (response.data.success) {
        console.log('🔍 Debug: Events found:', response.data.data.events?.length || 0);
        
        const googleEvents = response.data.data.events.map(event => {
          const start = new Date(event.start.dateTime || event.start.date);
          const end = new Date(event.end.dateTime || event.end.date);
          
          // Extract contact information from description
          const description = event.description || '';
          const contactMatch = description.match(/Contact: ([\d\s\+\-\(\)]+)/);
          const emailMatch = description.match(/Email: ([^\s\n]+)/);
          const companyMatch = description.match(/Business: ([^\n]+)/);
          
          return {
            id: event.id,
            title: event.summary,
            description: event.description,
            start: start,
            end: end,
            contact: {
              name: extractContactName(event.summary, event.description),
              phone: contactMatch ? contactMatch[1] : '',
              email: emailMatch ? emailMatch[1] : '',
              company: companyMatch ? companyMatch[1] : extractCompanyName(event.summary)
            },
            status: start > new Date() ? 'upcoming' : 'completed',
            type: getEventType(event.summary),
            googleEventId: event.id,
            htmlLink: event.htmlLink
          };
        });

        console.log('🔍 Debug: Processed events:', googleEvents.length);
        setEvents(googleEvents);
        setGoogleAuthStatus('connected');
      } else {
        console.log('🔍 Debug: API returned error:', response.data.error);
        setError(response.data.error || 'Failed to fetch calendar events');
      }
    } catch (error) {
      console.error('❌ Error fetching Google Calendar events:', error);
      console.log('🔍 Debug: Error response:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to connect to Google Calendar');
      setGoogleAuthStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  // Extract contact name from event summary or description
  const extractContactName = (summary, description) => {
    const fullText = `${summary} ${description}`;
    const nameMatch = fullText.match(/with ([^(]+)/);
    if (nameMatch) {
      return nameMatch[1].trim();
    }
    
    // Try to extract from summary
    const summaryMatch = summary.match(/Follow-up: ([^-]+)/);
    if (summaryMatch) {
      return summaryMatch[1].trim();
    }
    
    return 'Unknown Contact';
  };

  // Extract company name from event summary
  const extractCompanyName = (summary) => {
    const companyMatch = summary.match(/Follow-up: [^-]+ - (.+)/);
    if (companyMatch) {
      return companyMatch[1].trim();
    }
    return 'Unknown Company';
  };

  // Determine event type based on summary
  const getEventType = (summary) => {
    const lowerSummary = summary.toLowerCase();
    if (lowerSummary.includes('presentation')) return 'presentation';
    if (lowerSummary.includes('contract')) return 'contract';
    if (lowerSummary.includes('meeting')) return 'meeting';
    return 'followup';
  };

  // Handle Google Calendar connection
  const handleGoogleCalendarConnection = async () => {
    try {
      console.log('🔍 Debug: Starting Google Calendar connection...');
      setGoogleAuthStatus('loading');
      setError(null);

      // Get authorization code
      console.log('🔍 Debug: Getting Google Auth Code...');
      const authCode = await getGoogleAuthCode({
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        forceConsent: true
      });
      console.log('🔍 Debug: Auth Code received:', authCode ? 'Yes' : 'No');

      // Get user data from localStorage
      const userData = localStorage.getItem('userData');
      console.log('🔍 Debug: User data from localStorage:', userData ? 'Present' : 'Missing');
      
      if (!userData) {
        throw new Error('User data not found. Please login again.');
      }

      const user = JSON.parse(userData);
      console.log('🔍 Debug: User object:', user._id ? 'Valid' : 'Invalid');

      // Exchange code for tokens
      console.log('🔍 Debug: Exchanging code for tokens...');
      const tokenResponse = await getGoogleRefreshToken({
        code: authCode,
        redirectUri: window.location.origin,
        user: user
      });

      console.log('🔍 Debug: Token response:', tokenResponse);

      if (tokenResponse.success) {
        console.log('🔍 Debug: Token exchange successful');
        // Update user data with new tokens
        const updatedUserData = {
          ...user,
          googleAuthToken: tokenResponse.data
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        console.log('🔍 Debug: Updated user data in localStorage');

        // Fetch calendar events
        console.log('🔍 Debug: Fetching calendar events...');
        await fetchGoogleCalendarEvents();
      } else {
        console.log('🔍 Debug: Token exchange failed:', tokenResponse.error);
        throw new Error(tokenResponse.error || 'Failed to connect Google Calendar');
      }

    } catch (error) {
      console.error('❌ Google Calendar connection error:', error);
      setError(error.message || 'Failed to connect Google Calendar');
      setGoogleAuthStatus('disconnected');
    }
  };

  useEffect(() => {
    fetchGoogleCalendarEvents();
  }, []);

  // Add fallback events for demonstration when Google Calendar is not connected
  const getFallbackEvents = () => {
    return [
      {
        id: 'demo-1',
        title: 'B2B Follow-up: Focalyt',
        description: 'Follow-up with Rahul Sharma (Manager) - Product demo discussion',
        start: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        end: new Date(Date.now() + 2.5 * 60 * 60 * 1000), // 2.5 hours from now
        contact: {
          name: 'Rahul Sharma',
          phone: '8699081947',
          email: 'rahul.sharma@focalyt.com',
          company: 'Focalyt: A Skill-Tech brand'
        },
        status: 'upcoming',
        type: 'meeting'
      },
      {
        id: 'demo-2',
        title: 'Client Presentation: TechCorp',
        description: 'Product demo and pricing discussion with Priya Singh',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        end: new Date(Date.now() + 24.5 * 60 * 60 * 1000),
        contact: {
          name: 'Priya Singh',
          phone: '9876543210',
          email: 'priya@techcorp.com',
          company: 'TechCorp Solutions'
        },
        status: 'upcoming',
        type: 'presentation'
      }
    ];
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'meeting': return <User className="w-4 h-4" />;
      case 'presentation': return <Calendar className="w-4 h-4" />;
      case 'contract': return <AlertCircle className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  // Use fallback events if Google Calendar is not connected and no events are loaded
  const displayEvents = events.length > 0 ? events : 
    (googleAuthStatus === 'disconnected' ? getFallbackEvents() : []);

  const filteredEvents = displayEvents.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'today') {
      const today = new Date();
      return event.start.toDateString() === today.toDateString();
    }
    if (filter === 'upcoming') {
      return event.start > new Date();
    }
    if (filter === 'past') {
      return event.start < new Date();
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Business Calendar Events</h1>
          </div>
          <div className="flex items-center space-x-3">
            {googleAuthStatus === 'connected' && (
              <button
                onClick={fetchGoogleCalendarEvents}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              googleAuthStatus === 'connected' 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : googleAuthStatus === 'loading'
                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                : 'bg-red-100 text-red-800 border-red-200'
            }`}>
              {googleAuthStatus === 'connected' ? 'Google Calendar Connected' : 
               googleAuthStatus === 'loading' ? 'Connecting...' : 'Google Calendar Disconnected'}
            </div>
          </div>
        </div>
        <p className="text-gray-600">Manage your upcoming meetings and follow-ups from Google Calendar</p>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
              {googleAuthStatus === 'disconnected' && (
                <button
                  onClick={handleGoogleCalendarConnection}
                  disabled={googleAuthStatus === 'loading'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {googleAuthStatus === 'loading' ? 'Connecting...' : 'Connect Google Calendar'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'today', 'upcoming', 'past'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                             <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                 {filterType === 'all' ? displayEvents.length : 
                  filteredEvents.filter(e => {
                    if (filterType === 'today') return e.start.toDateString() === new Date().toDateString();
                    if (filterType === 'upcoming') return e.start > new Date();
                    if (filterType === 'past') return e.start < new Date();
                    return true;
                  }).length}
               </span>
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading events...</h3>
            <p className="text-gray-500">Fetching your Google Calendar events</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">
              {googleAuthStatus === 'disconnected' 
                ? 'Connect your Google Calendar to see your B2B follow-up events' 
                : 'No events match your current filter.'}
            </p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Event Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(event.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {event.description}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>

                {/* Event Details */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Time & Date */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDate(event.start)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <span>{event.contact.name}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{event.contact.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Company & Email */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{event.contact.company}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{event.contact.email}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Join Meeting
                  </button>
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View in Google Calendar
                    </a>
                  )}
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    Edit Event
                  </button>
                  {event.status === 'upcoming' && (
                    <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{displayEvents.filter(e => e.start > new Date()).length}</div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{displayEvents.filter(e => e.status === 'completed').length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">{displayEvents.filter(e => e.start.toDateString() === new Date().toDateString()).length}</div>
            <div className="text-sm text-gray-600">Today</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{displayEvents.length}</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
        </div>
        {googleAuthStatus === 'disconnected' && events.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700 text-center">
              📅 Showing demo events. Connect your Google Calendar to see your actual B2B follow-up events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsList;