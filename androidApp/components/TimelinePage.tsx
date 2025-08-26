import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
  Animated,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import apiService from '../services/apiService';
import { 
  getTodayISO, 
  getTodayLocal, 
  getYesterdayISO, 
  getYesterdayLocal,
  getDateForAPI,
  getDateForStorage,
  isToday,
  isYesterday
} from '../utils/dateUtils';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number | null;
  speed?: number | null;
  rawSpeed?: number | null;
  heading?: number | null;
  isStationary?: boolean;
  address?: AddressDetails;
  batteryLevel?: number | null;
  isCharging?: boolean | null;
  // Status information
  connectivityStatus?: {
    isConnected: boolean;
    connectionType: string | null;
    isInternetReachable: boolean | null;
  };
  locationStatus?: {
    isLocationEnabled: boolean;
    permissionStatus: string | null;
  };
}

interface AddressDetails {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  formattedAddress: string;
  placeName?: string;
}

// Combined timeline data interface
interface CombinedTimelineData {
  id: string;
  type: 'location' | 'punchIn' | 'punchOut' | 'connectivity' | 'locationService';
  timestamp: string;
  toTime?: string;
  data: any;
  index?: number;
  isSignificant?: boolean;
}

interface UserData {
  executiveId: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  locationTracking: {
    [date: string]: LocationData[];
  };
  // New field for combined timeline data
  combinedTimeline: {
    [date: string]: CombinedTimelineData[];
  };
  // Status history by date
  statusHistory: {
    [date: string]: {
      connectivity: Array<{
        isConnected: boolean;
        connectionType: string | null;
        isInternetReachable: boolean | null;
        timestamp: string;
      }>;
      location: Array<{
        isLocationEnabled: boolean;
        permissionStatus: string | null;
        timestamp: string;
      }>;
    };
  };
  totalTrackingPoints: number;
  lastTrackingUpdate: string;
  createdAt: string;
  updatedAt: string;
}

// Attendance status interface
interface AttendanceStatus {
  isPunchedIn: boolean;
  punchInTime: string | null;
  punchOutTime: string | null;
  todayWorkHours: string;
  currentLocation: string;
  punchInPhoto?: string | null;
  punchOutPhoto?: string | null;
}

const { width, height } = Dimensions.get('window');

// List position constants with full range
const LIST_POSITIONS = {
  TOP: height * 0.1,         // List at top (10% - minimum height)
  MIDDLE: height * 0.5,      // List in middle (50% - initial position)
  BOTTOM: height * 0.9       // List at bottom (90% - maximum height)
};

const TimelinePage: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mapHtml, setMapHtml] = useState('');
  const [addressCache, setAddressCache] = useState<Map<string, AddressDetails>>(new Map());
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isFetchingAddresses, setIsFetchingAddresses] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  
  // API Data State
  const [apiAttendanceData, setApiAttendanceData] = useState<any>(null);
  const [loadingApiData, setLoadingApiData] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Attendance status state
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({
    isPunchedIn: false,
    punchInTime: null,
    punchOutTime: null,
    todayWorkHours: '0 hr 0 min',
    currentLocation: 'Unknown Location'
  });
  const [punchInPhotoUri, setPunchInPhotoUri] = useState<string | null>(null);
  const [punchOutPhotoUri, setPunchOutPhotoUri] = useState<string | null>(null);
  const [photoViewerModalVisible, setPhotoViewerModalVisible] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  
  // State for list position with smooth transitions
  const [listPosition, setListPosition] = useState(LIST_POSITIONS.MIDDLE);
  const [isDragging, setIsDragging] = useState(false);

  const GOOGLE_MAPS_API_KEY = 'AIzaSyB7DDN_gUp2zyrlElXtYpjTEQobYiUB9Lg';

  useEffect(() => {
    loadUserData();
    loadAttendanceStatus();
    loadSavedPhotos();
    // Don't clear data when switching to Timeline
    // clearDummyData(); // Removed this line
  }, []);

  // Refresh timeline when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 TimelinePage focused - refreshing data');
      loadUserData();
      loadAttendanceStatus();
      loadSavedPhotos();
      
      // Refresh API data if date is selected
      if (selectedDate) {
        fetchAttendanceDataFromAPI(selectedDate);
      }
    }, [selectedDate])
  );

  useEffect(() => {
    if (userData) {
      const dates = getAvailableDates();
      setAvailableDates(dates);
      // Only set initial date if no date is currently selected
      if (dates.length > 0 && !selectedDate) {
        // Validate the first date before setting it
        const firstDate = dates[0];
        try {
          const testDate = new Date(firstDate);
          if (!isNaN(testDate.getTime())) {
            setSelectedDate(firstDate);
            setCurrentDateIndex(0);
          } else {
            console.warn('Invalid first date:', firstDate);
            // Set today's date as fallback
            const today = getTodayISO();
            setSelectedDate(today);
            setCurrentDateIndex(0);
          }
        } catch (error) {
          console.error('Error validating first date:', firstDate, error);
          // Set today's date as fallback
          const today = getTodayISO();
          setSelectedDate(today);
          setCurrentDateIndex(0);
        }
      } else if (dates.length === 0 && !selectedDate) {
        // Only set today's date if no date is currently selected
        const today = getTodayISO();
        setSelectedDate(today);
        setCurrentDateIndex(0);
      }
    }
  }, [userData]); // Removed selectedDate dependency to prevent auto-reset

  useEffect(() => {
    if (userData && selectedDate) {
      // Generate map from local data first (fallback)
      generateMapHtml();
      // Fetch addresses for locations that don't have them
      fetchMissingAddresses();
      // Debug current state (only when there's data)
      const locations = userData.locationTracking[selectedDate] || [];
      if (locations.length > 0) {
        debugCurrentState();
      }
      // Fix invalid timestamps
      fixInvalidTimestamps();
      // Removed checkDataForSelectedDate to prevent infinite loop
      
      // Fetch attendance data from API for the selected date
      fetchAttendanceDataFromAPI(selectedDate);
    }
  }, [userData, selectedDate]);

  // Generate map from API data when available
  useEffect(() => {
    if (selectedDate) {
      console.log('🗺️ Map generation triggered for date:', selectedDate);
      console.log('🗺️ API Attendance Data:', apiAttendanceData);
      
      if (apiAttendanceData) {
        console.log('🗺️ Generating map from API data...');
        generateMapFromAPIData();
      } else {
        console.log('🗺️ No API data available, showing no data map...');
        // Show no data map when apiAttendanceData is null
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { margin: 0; padding: 0; }
                #map { width: 100%; height: 100vh; }
                .no-data { 
                  display: flex; 
                  justify-content: center; 
                  align-items: center;
                  flex-direction: column;
                  height: 100vh; 
                  font-family: Arial, sans-serif;
                  color: #666;
                }
              </style>
            </head>
            <body>
              <div class="no-data">
                <h3>🗺️ No Data Available</h3>
                <p>No location data found for ${selectedDate}</p>
                <p style="font-size: 12px; color: #999;">Start tracking to see your location timeline</p>
              </div>
            </body>
          </html>
        `;
        setMapHtml(html);
        console.log('🗺️ No data map set successfully');
      }
    }
  }, [apiAttendanceData, selectedDate]);

  // Separate useEffect to track selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      // Debug date formats
      debugDateFormats();
    }
  }, [selectedDate]);

  const loadUserData = async () => {
    try {
      const savedUserData = await AsyncStorage.getItem('userData');
      const dateWiseStatusHistory = await AsyncStorage.getItem('dateWiseStatusHistory');
      
      if (savedUserData) {
        const parsedData = JSON.parse(savedUserData);
        
        // Merge status history with user data
        if (dateWiseStatusHistory) {
          const statusHistory = JSON.parse(dateWiseStatusHistory);
          parsedData.statusHistory = statusHistory;
        }
        
        setUserData(parsedData);
        
        // Load address cache
        const savedCache = await AsyncStorage.getItem('addressCache');
        if (savedCache) {
          const cacheData = JSON.parse(savedCache);
          setAddressCache(new Map(Object.entries(cacheData)));
        }
      } else {
        // No user data found - show empty state
        setUserData(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceStatus = async () => {
    try {
      const savedStatus = await AsyncStorage.getItem('attendanceStatus');
      if (savedStatus) {
        const status = JSON.parse(savedStatus);
        setAttendanceStatus(status);
      }
    } catch (error) {
      console.error('Error loading attendance status:', error);
    }
  };

  // Fetch attendance data from API
  const fetchAttendanceDataFromAPI = async (date: string) => {
    try {
      console.log('🚀 ===== API CALL START =====');
      console.log('📅 Requested Date:', date);
      console.log('📅 Date Type:', typeof date);
      console.log('📅 Current Time:', new Date().toISOString());
      
      setLoadingApiData(true);
      setApiError(null);
      
      // Initialize API service
      console.log('🔧 Initializing API service...');
      await apiService.initialize();
      console.log('✅ API service initialized');
      
      // Get user data from AsyncStorage
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        console.log('❌ Cannot fetch API data: No user data found');
        setApiError('No user data found');
        return;
      }

      const userData = JSON.parse(userDataString);
      console.log('👤 User Data:', {
        executiveId: userData.executiveId,
        id: userData.id,
        collegeId: userData.collegeId
      });
      console.log('🔄 Fetching attendance data from API for date:', date);
      
      // Fetch attendance data for the specific date (convert to ISO format for API)
      const apiDate = getDateForAPI(date);
      console.log('📅 Fetching API data for date:', date, '-> API date:', apiDate);
      console.log('📡 Making API call to getAttendanceData...');
      const response = await apiService.getAttendanceData(apiDate);
      
      console.log('📥 API Response Received:');
      console.log('📥 Response Success:', response.success);
      console.log('📥 Response Message:', response.message);
      console.log('📥 Response Data:', response.data);
      console.log('📥 Response Data Type:', typeof response.data);
      
      if (response.success) {
        console.log('✅ API data fetched successfully');
        console.log('📊 Data Details:', {
          hasData: !!response.data,
          hasEntries: !!(response.data && response.data.entries),
          entriesCount: response.data?.entries?.length || 0,
          entries: response.data?.entries || []
        });
        
        setApiAttendanceData(response.data);
        
        // Generate timeline from API data
        if (response.data && response.data.entries && response.data.entries.length > 0) {
          console.log('📝 Generating timeline from API data...');
          const apiTimeline = generateTimelineFromAPIData(response.data.entries, date);
          console.log('📝 Generated Timeline:', apiTimeline);
          setTimeline(apiTimeline);
          setLoadingTimeline(false);
          console.log('✅ Timeline updated successfully');
        } else {
          // No data available for this date - clear states
          console.log('📭 No data available for date:', date);
          console.log('🧹 Clearing all states...');
          setApiAttendanceData(null);
          setTimeline([]);
          setLoadingTimeline(false);
          setApiError(null);
          console.log('✅ States cleared successfully');
        }
      } else {
        console.log('❌ API data fetch failed');
        console.log('❌ Error Message:', response.message);
        setApiError(response.message || 'Failed to fetch data');
        // Clear states on API failure
        console.log('🧹 Clearing states due to API failure...');
        setApiAttendanceData(null);
        setTimeline([]);
        setLoadingTimeline(false);
        console.log('✅ States cleared after API failure');
      }
    } catch (error: any) {
      console.error('❌ Error fetching API data:', error);
      console.error('❌ Error Details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      setApiError('Network error occurred');
    } finally {
      setLoadingApiData(false);
      console.log('🏁 ===== API CALL END =====');
    }
  };

  // Generate timeline from API data
  const generateTimelineFromAPIData = (entries: any[], date: string): any[] => {
    const timeline: any[] = [];
    
    entries.forEach((entry, index) => {
      const entryData = {
        id: entry.id || `entry-${index}`,
        type: entry.type,
        timestamp: entry.fromTime,
        toTime: entry.toTime,
        data: {
          location: entry.location,
          address: entry.address,
          fromBattery: entry.fromBattery,
          toBattery: entry.toBattery,
          fromCharging: entry.fromCharging,
          toCharging: entry.toCharging,
          mode: entry.mode,
          photo: entry.photo
        },
        index: index,
        isSignificant: entry.type === 'punchIn' || entry.type === 'punchOut'
      };
      
      timeline.push(entryData);
    });
    
    // Sort by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log('📊 Generated timeline from API data:', timeline.length, 'entries');
    return timeline;
  };

  const loadSavedPhotos = async () => {
    try {
      const punchInPhoto = await AsyncStorage.getItem('punchInPhoto');
      const punchOutPhoto = await AsyncStorage.getItem('punchOutPhoto');
      
      if (punchInPhoto) {
        setPunchInPhotoUri(punchInPhoto);
      }
      if (punchOutPhoto) {
        setPunchOutPhotoUri(punchOutPhoto);
      }
      
      // Also load from attendance status if available
      if (attendanceStatus.punchInPhoto) {
        setPunchInPhotoUri(attendanceStatus.punchInPhoto);
      }
      if (attendanceStatus.punchOutPhoto) {
        setPunchOutPhotoUri(attendanceStatus.punchOutPhoto);
      }
    } catch (error) {
      console.error('Error loading saved photos:', error);
    }
  };

  const openPhotoViewer = (photoUri: string) => {
    setSelectedPhotoUri(photoUri);
    setPhotoViewerModalVisible(true);
  };

  const fetchMissingAddresses = async () => {
    if (!userData || !selectedDate || isFetchingAddresses) return;
    
    const locations = userData.locationTracking[selectedDate] || [];
    const locationsWithoutAddress = locations.filter(location => !location.address);
    
    if (locationsWithoutAddress.length === 0) return;
    
    setIsFetchingAddresses(true);
    let hasUpdates = false;
    
    try {
      for (const location of locationsWithoutAddress) {
        try {
          const address = await getAddressFromCoords(location.latitude, location.longitude);
          if (address) {
            location.address = address;
            hasUpdates = true;
          }
        } catch (error) {
          console.error('Error fetching address for location:', location, error);
        }
        
        // Add a small delay to avoid hitting API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (hasUpdates) {
        // Update the user data with new addresses
        const updatedUserData = { ...userData };
        updatedUserData.locationTracking[selectedDate] = locations;
        setUserData(updatedUserData);
        
        // Save to AsyncStorage
        try {
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
        } catch (error) {
          console.error('Error saving user data:', error);
        }
      }
    } finally {
      setIsFetchingAddresses(false);
    }
  };

  const getAddressFromCoords = async (latitude: number, longitude: number): Promise<AddressDetails | null> => {
    const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    
    // Check cache first
    if (addressCache.has(cacheKey)) {
      return addressCache.get(cacheKey) || null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        
        const address: AddressDetails = {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          formattedAddress: result.formatted_address,
          placeName: result.name
        };

        // Parse address components
        let localityFound = false;
        let sublocalityFound = false;
        addressComponents.forEach((component: any) => {
          const types = component.types;
          if (types.includes('route')) {
            address.street = component.long_name;
          } else if (types.includes('locality') && !localityFound) {
            address.city = component.long_name;
            localityFound = true;
          } else if (types.includes('sublocality') && !sublocalityFound) {
            // Use sublocality as primary location name
            address.placeName = component.long_name;
            sublocalityFound = true;
          } else if (types.includes('administrative_area_level_1')) {
            address.state = component.long_name;
          } else if (types.includes('country')) {
            address.country = component.long_name;
          } else if (types.includes('postal_code')) {
            address.postalCode = component.long_name;
          }
        });

        // If no sublocality found, use locality as placeName
        if (!address.placeName && address.city) {
          address.placeName = address.city;
        }

        // Cache the address
        const newCache = new Map(addressCache);
        newCache.set(cacheKey, address);
        setAddressCache(newCache);
        
        // Save to AsyncStorage
        const cacheObject = Object.fromEntries(newCache);
        await AsyncStorage.setItem('addressCache', JSON.stringify(cacheObject));
        
        return address;
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
    
    return null;
  };

  const generateMapFromAPIData = () => {
    if (!apiAttendanceData || !selectedDate) {
      // No API data available - show no data message
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; }
              #map { width: 100%; height: 100vh; }
              .no-data { 
                display: flex; 
                justify-content: center; 
                align-items: center;
                flex-direction: column;
                height: 100vh; 
                font-family: Arial, sans-serif;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="no-data">
              <h3>🗺️ No Data Available</h3>
              <p>No location data found for ${selectedDate}</p>
              <p style="font-size: 12px; color: #999;">Start tracking to see your location timeline</p>
            </div>
          </body>
        </html>
      `;
      setMapHtml(html);
      return;
    }

    // Extract location entries from API data
    const locationEntries = apiAttendanceData.entries?.filter((entry: any) => 
      entry.location && entry.location.latitude && entry.location.longitude
    ) || [];

    if (locationEntries.length === 0) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; }
              #map { width: 100%; height: 100vh; }
              .no-data { 
                display: flex; 
                justify-content: center; 
                align-items: center;
                flex-direction: column;
                height: 100vh; 
                font-family: Arial, sans-serif;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="no-data">
              <h3>🗺️ No Data Available</h3>
              <p>No location data found for ${selectedDate}</p>
              <p style="font-size: 12px; color: #999;">Start tracking to see your location timeline</p>
            </div>
          </body>
        </html>
      `;
      setMapHtml(html);
      return;
    }
    

    const markers = locationEntries.map((entry: any, index: number) => {
      const location = entry.location;
      const speed = location.speed ? (location.speed * 3.6).toFixed(2) : '0.00';
      const isStationary = entry.mode === 'stationary' ? '🛑' : '🚶‍♂️';
      const address = location.address?.formattedAddress || entry.address || 'Getting address...';
      const batteryLevel = entry.fromBattery ? Math.round(entry.fromBattery * 100) : 'N/A';
      const chargingStatus = entry.fromCharging ? '🔌' : '🔋';
      
      return `
        const marker${index} = new google.maps.Marker({
          position: { lat: ${location.latitude}, lng: ${location.longitude} },
          map: map,
          title: '${entry.fromTime}',
          label: '${index + 1}',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="${entry.mode === 'stationary' ? '#ff4444' : '#4CAF50'}" stroke="white" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${index + 1}</text>
              </svg>
            `)}',
            scaledSize: new google.maps.Size(24, 24)
          }
        });
        
        // Info window
        const infoWindow${index} = new google.maps.InfoWindow({
          content: \`
            <div style="padding: 10px; font-family: Arial, sans-serif;">
              <h4 style="margin: 0 0 5px 0; color: #333;">${isStationary} ${entry.type.toUpperCase()} #${index + 1}</h4>
              <p style="margin: 5px 0; font-size: 12px; color: #666;">
                <strong>Time:</strong> ${new Date(entry.fromTime).toLocaleTimeString()}<br>
                <strong>Mode:</strong> ${entry.mode}<br>
                <strong>Speed:</strong> ${speed} km/h<br>
                <strong>Accuracy:</strong> ${location.accuracy?.toFixed(2) || 'N/A'}m<br>
                <strong>Battery:</strong> ${batteryLevel}% ${chargingStatus}<br>
                <strong>Address:</strong> ${address}
              </p>
            </div>
          \`
        });
        
        google.maps.event.addListener(marker${index}, 'click', function() {
          infoWindow${index}.open(map, marker${index});
        });
      `;
    }).join('\n');

    const pathCoordinates = locationEntries.map((entry: any) => 
      `{ lat: ${entry.location.latitude}, lng: ${entry.location.longitude} }`
    ).join(', ');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
            .map-controls {
              position: absolute;
              top: 10px;
              right: 10px;
              z-index: 1000;
            }
            .control-btn {
              background: white;
              border: 1px solid #ccc;
              border-radius: 4px;
              padding: 8px 12px;
              margin: 2px;
              cursor: pointer;
              font-size: 12px;
            }
            .control-btn:hover {
              background: #f0f0f0;
            }
          </style>
          <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places"></script>
        </head>
        <body>
          <div id="map"></div>
          <div class="map-controls">
            <button class="control-btn" onclick="togglePath()">Toggle Path</button>
            <button class="control-btn" onclick="fitBounds()">Fit Bounds</button>
          </div>
          
          <script>
            let map;
            let path;
            let pathVisible = true;
            
            function initMap() {
              const bounds = new google.maps.LatLngBounds();
              const locations = [${pathCoordinates}];
              
              locations.forEach(location => {
                bounds.extend(location);
              });
              
              map = new google.maps.Map(document.getElementById('map'), {
                zoom: 4,
                center: bounds.getCenter(),
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                styles: [
                  {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                  }
                ]
              });
              
              map.fitBounds(bounds);
              
              // Add path
              path = new google.maps.Polyline({
                path: locations,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 3
              });
              
              path.setMap(map);
              
              // Add markers
              ${markers}
            }
            
            function togglePath() {
              if (pathVisible) {
                path.setMap(null);
                pathVisible = false;
              } else {
                path.setMap(map);
                pathVisible = true;
              }
            }
            
            function fitBounds() {
              const bounds = new google.maps.LatLngBounds();
              const locations = [${pathCoordinates}];
              
              locations.forEach(location => {
                bounds.extend(location);
              });
              
              map.fitBounds(bounds);
            }
            
            // Initialize map when page loads
            window.onload = initMap;
          </script>
        </body>
      </html>
    `;
    
    setMapHtml(html);
    console.log('🗺️ Map generated from API data with', locationEntries.length, 'locations');
  };

  const generateMapHtml = () => {
    if (!userData || !selectedDate) return;

    const locations = userData.locationTracking[selectedDate] || [];

    if (locations.length === 0) {
      (`
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; }
              #map { width: 100%; height: 100vh; }
              .no-data { 
                display: flex; 
                justify-content: center; 
                align-items: center;
                flex-direction: column;
                height: 100vh; 
                font-family: Arial, sans-serif;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="no-data">
              <h3>🗺️ No Data Available</h3>
              <p>No location data found for ${selectedDate}</p>
              <p style="font-size: 12px; color: #999;">Start tracking to see your location timeline</p>
            </div>
          </body>
        </html>
      `);
      return;
    }

    const markers = locations.map((location, index) => {
      const speed = location.speed ? (location.speed * 3.6).toFixed(2) : '0.00';
      const isStationary = location.isStationary ? '🛑' : '🚶‍♂️';
      const address = location.address?.formattedAddress || 'Getting address...';
      
      return `
        new google.maps.Marker({
          position: { lat: ${location.latitude}, lng: ${location.longitude} },
          map: map,
          title: '${location.timestamp}',
          label: '${index + 1}',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="${location.isStationary ? '#ff4444' : '#4CAF50'}" stroke="white" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${index + 1}</text>
              </svg>
            `)}',
            scaledSize: new google.maps.Size(24, 24)
          }
        });
        
        // Info window
        const infoWindow${index} = new google.maps.InfoWindow({
          content: \`
            <div style="padding: 10px; font-family: Arial, sans-serif;">
              <h4 style="margin: 0 0 5px 0; color: #333;">${isStationary} Point ${index + 1}</h4>
              <p style="margin: 5px 0; font-size: 12px; color: #666;">
                <strong>Time:</strong> ${location.timestamp}<br>
                <strong>Speed:</strong> ${speed} km/h<br>
                <strong>Accuracy:</strong> ${location.accuracy?.toFixed(2) || 'N/A'}m<br>
                <strong>Address:</strong> ${address}
              </p>
            </div>
          \`
        });
        
        google.maps.event.addListener(marker${index}, 'click', function() {
          infoWindow${index}.open(map, marker${index});
        });
      `;
    }).join('\n');

    const pathCoordinates = locations.map(location => 
      `{ lat: ${location.latitude}, lng: ${location.longitude} }`
    ).join(', ');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
            .map-controls {
              position: absolute;
              top: 10px;
              right: 10px;
              z-index: 1000;
            }
            .control-btn {
              background: white;
              border: 1px solid #ccc;
              border-radius: 4px;
              padding: 8px 12px;
              margin: 2px;
              font-size: 12px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <div class="map-controls">
            <button class="control-btn" onclick="fitBounds()">Fit All</button>
            <button class="control-btn" onclick="togglePath()">Toggle Path</button>
          </div>
          
          <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places"></script>
          <script>
            let map;
            let path;
            let markers = [];
            
            function initMap() {
              const locations = [${pathCoordinates}];
              
              if (locations.length === 0) return;
              
              const bounds = new google.maps.LatLngBounds();
              locations.forEach(coord => bounds.extend(coord));
              
              // Add padding to bounds to show more area
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              const latDiff = (ne.lat() - sw.lat()) * 0.3; // 30% padding
              const lngDiff = (ne.lng() - sw.lng()) * 0.3; // 30% padding
              
              const paddedBounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(sw.lat() - latDiff, sw.lng() - lngDiff),
                new google.maps.LatLng(ne.lat() + latDiff, ne.lng() + lngDiff)
              );
              
              map = new google.maps.Map(document.getElementById('map'), {
                zoom: 12, // Reduced from 1 to 12 for better initial zoom
                center: paddedBounds.getCenter(), // Center on padded bounds
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                styles: [
                  {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                  }
                ]
              });
              
              // If only one location, use a wider zoom
              if (locations.length === 1) {
                map.setZoom(14); // Closer zoom for single point
                map.setCenter(locations[0]);
              } else {
                map.fitBounds(paddedBounds);
              }
              
              // Create markers
              ${markers}
              
              // Create path
              path = new google.maps.Polyline({
                path: locations,
                geodesic: true,
                strokeColor: '#4285F4',
                strokeOpacity: 1.0,
                strokeWeight: 4
              });
              
              path.setMap(map);
            }
            
            function fitBounds() {
              const bounds = new google.maps.LatLngBounds();
              const locations = [${pathCoordinates}];
              locations.forEach(coord => bounds.extend(coord));
              
              // Add padding to bounds to show more area
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              const latDiff = (ne.lat() - sw.lat()) * 0.3; // 30% padding
              const lngDiff = (ne.lng() - sw.lng()) * 0.3; // 30% padding
              
              const paddedBounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(sw.lat() - latDiff, sw.lng() - lngDiff),
                new google.maps.LatLng(ne.lat() + latDiff, ne.lng() + lngDiff)
              );
              
              map.fitBounds(paddedBounds);
            }
            
            function togglePath() {
              if (path.getMap()) {
                path.setMap(null);
              } else {
                path.setMap(map);
              }
            }
            
            // Initialize map when page loads
            window.onload = initMap;
          </script>
        </body>
      </html>
    `;

    setMapHtml(html);
  };

  const getAvailableDates = () => {
    if (!userData) return [];
    const dates = Object.keys(userData.locationTracking);
    
    // Filter out invalid dates and validate them
    const validDates = dates.filter(dateString => {
      try {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      } catch (error) {
        console.warn('Invalid date found in locationTracking:', dateString);
        return false;
      }
    });
    
    // Sort dates in descending order (newest first)
    return validDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  // Get status history for selected date
  const getStatusHistoryForDate = async (date: string) => {
    try {
      const savedHistory = await AsyncStorage.getItem('statusHistory');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        const targetDate = new Date(date).toDateString();
        
        // Filter status changes for the selected date
        const dateConnectivity = history.connectivity?.filter((status: any) => {
          const statusDate = new Date(status.timestamp).toDateString();
          return statusDate === targetDate;
        }) || [];
        
        const dateLocationStatus = history.location?.filter((status: any) => {
          const statusDate = new Date(status.timestamp).toDateString();
          return statusDate === targetDate;
        }) || [];
        
        return { connectivity: dateConnectivity, location: dateLocationStatus };
      }
    } catch (error) {
      console.error('Error loading status history:', error);
    }
    return { connectivity: [], location: [] };
  };

  // Create combined timeline using saved combinedTimeline data
  const createCombinedTimeline = async () => {
    if (!userData || !selectedDate) return [];
    
    console.log('=== TimelinePage createCombinedTimeline Debug ===');
    console.log('userData exists:', !!userData);
    console.log('selectedDate:', selectedDate);
    
    // Use saved combined timeline data instead of creating on-the-fly
    const savedCombinedTimeline = userData.combinedTimeline?.[selectedDate] || [];
    
    console.log('Using saved combined timeline for date:', selectedDate);
    console.log('Saved combined timeline items:', savedCombinedTimeline.length);
    
    // Sort by timestamp (newest first)
    const sortedTimeline = savedCombinedTimeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    console.log('Final timeline length:', sortedTimeline.length);
    console.log('Timeline items:', sortedTimeline.map(item => ({ type: item.type, timestamp: new Date(item.timestamp).toLocaleTimeString() })));
    console.log('=== End TimelinePage createCombinedTimeline Debug ===');
    
    return sortedTimeline;
  };

  // Load timeline when data changes
  useEffect(() => {
    const loadTimeline = async () => {
      if (!userData || !selectedDate) return;
      setLoadingTimeline(true);
      const combinedTimeline = await createCombinedTimeline();
      setTimeline(combinedTimeline);
      setLoadingTimeline(false);
    };
    
    loadTimeline();
  }, [userData, selectedDate]);

  const formatSpeed = (speed: number | null): string => {
    if (!speed || speed < 0.3) {
      return '0.00 km/h (Stationary)';
    }
    if (speed < 0.5) {
      return '0.00 km/h (Low Speed)';
    }
    return `${(speed * 3.6).toFixed(2)} km/h`;
  };

  const calculateTotalDistance = (locations: LocationData[]): number => {
    if (locations.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      const prevLocation = locations[i - 1];
      const currentLocation = locations[i];
      totalDistance += getDistance(
        prevLocation.latitude,
        prevLocation.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );
    }
    
    // Round to 2 decimal places
    return Math.round(totalDistance * 100) / 100;
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateTotalTime = (locations: LocationData[]): string => {
    if (locations.length < 2) return '0 hr 0 min';
    
    try {
      const firstTime = new Date(locations[0].timestamp);
      const lastTime = new Date(locations[locations.length - 1].timestamp);
      
      // Check if dates are valid
      if (isNaN(firstTime.getTime()) || isNaN(lastTime.getTime())) {
        return '0 hr 0 min';
      }
      
      const diffMs = lastTime.getTime() - firstTime.getTime();
      
      // Check if difference is valid
      if (isNaN(diffMs) || diffMs < 0) {
        return '0 hr 0 min';
      }
      
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      // Ensure hours and minutes are valid numbers
      const hours = isNaN(diffHours) ? 0 : diffHours;
      const minutes = isNaN(diffMinutes) ? 0 : diffMinutes;
      
      return `${hours} hr ${minutes} min`;
    } catch (error) {
      console.error('Error calculating total time:', error);
      return '0 hr 0 min';
    }
  };

  const navigateToPreviousDate = () => {
    try {
      console.log('Navigate to previous date. Current date:', selectedDate);
      
      // Test navigation
      testNavigation();
      
      // Validate current selectedDate
      if (!selectedDate || typeof selectedDate !== 'string') {
        console.warn('Invalid selectedDate:', selectedDate);
        return;
      }
      
      // DON'T CONVERT DATE FORMAT - Just subtract 1 day from original
      let previousDateString = selectedDate;
      
      if (selectedDate.includes(' ')) {
        // For "Wed Aug 06 2025" format, just subtract 1 day
        const date = new Date(selectedDate);
        if (!isNaN(date.getTime())) {
          // Subtract 1 day directly
          date.setDate(date.getDate() - 1);
          previousDateString = date.toDateString(); // Keep same format
          console.log('Previous date (same format):', previousDateString);
        } else {
          console.warn('Cannot parse date format:', selectedDate);
          return;
        }
      } else {
        // For "2025-08-06" format, subtract 1 day
        const [year, month, day] = selectedDate.split('-').map(Number);
        console.log('Parsed components:', { year, month, day });
        
        let previousDay = day - 1;
        let previousMonth = month;
        let previousYear = year;
        
        // Handle month/year boundaries
        if (previousDay === 0) {
          previousMonth = month - 1;
          if (previousMonth === 0) {
            previousMonth = 12;
            previousYear = year - 1;
          }
          const lastDayOfPrevMonth = new Date(previousYear, previousMonth, 0).getDate();
          previousDay = lastDayOfPrevMonth;
        }
        
        previousDateString = `${previousYear}-${previousMonth.toString().padStart(2, '0')}-${previousDay.toString().padStart(2, '0')}`;
        console.log('Previous date (ISO format):', previousDateString);
      }
      
      console.log('Navigating to previous date:', previousDateString);
      
      // Force state update with a small delay to ensure proper re-render
      setTimeout(() => {
        setSelectedDate(previousDateString);
        // Check if previous date has data
        if (userData && userData.locationTracking[previousDateString] && userData.locationTracking[previousDateString].length > 0) {
          // Previous date has data
        }
        
        // Check data for the new date immediately
        checkDataForSelectedDate();
      }, 50);
      
    } catch (error) {
      // Error navigating to previous date
    }
  };

  const navigateToNextDate = () => {
    try {
      // Validate current selectedDate
      if (!selectedDate || typeof selectedDate !== 'string') {
        return;
      }
      
      // DON'T CONVERT DATE FORMAT - Just add 1 day to original
      let nextDateString = selectedDate;
      
      if (selectedDate.includes(' ')) {
        // For "Wed Aug 06 2025" format, just add 1 day
        const date = new Date(selectedDate);
        if (!isNaN(date.getTime())) {
          // Add 1 day directly
          date.setDate(date.getDate() + 1);
          nextDateString = date.toDateString(); // Keep same format
          // Next date calculated
        } else {
          return;
        }
      } else {
        // For "2025-08-06" format, add 1 day
        const [year, month, day] = selectedDate.split('-').map(Number);
        console.log('Parsed components:', { year, month, day });
        
        let nextDay = day + 1;
        let nextMonth = month;
        let nextYear = year;
        
        // Handle month/year boundaries
        const daysInCurrentMonth = new Date(year, month, 0).getDate();
        if (nextDay > daysInCurrentMonth) {
          nextDay = 1;
          nextMonth = month + 1;
          if (nextMonth > 12) {
            nextMonth = 1;
            nextYear = year + 1;
          }
        }
        
        nextDateString = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${nextDay.toString().padStart(2, '0')}`;
        console.log('Next date (ISO format):', nextDateString);
      }
      
      // Check if next date is beyond today - Use local time instead of UTC
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Convert nextDateString to ISO format for comparison
      let nextDateForComparison = nextDateString;
      if (nextDateString.includes(' ')) {
        const nextDate = new Date(nextDateString);
        nextDateForComparison = nextDate.toISOString().split('T')[0];
      }
      
      console.log('Next date for comparison:', nextDateForComparison);
      console.log('Today for comparison:', todayString);
      
      // Don't allow navigation beyond today, but allow navigation to today
      console.log('=== NAVIGATION DEBUG ===');
      console.log('Current local time:', new Date().toString());
      console.log('Current UTC time:', new Date().toISOString());
      console.log('nextDateForComparison:', nextDateForComparison);
      console.log('todayString:', todayString);
      console.log('nextDateForComparison <= todayString:', nextDateForComparison <= todayString);
      console.log('nextDateForComparison === todayString:', nextDateForComparison === todayString);
      
      if (nextDateForComparison <= todayString) {
        console.log('Navigating to next date:', nextDateString);
        
        // Force state update with a small delay to ensure proper re-render
        setTimeout(() => {
          setSelectedDate(nextDateString);
          console.log('SelectedDate updated to:', nextDateString);
          
          // Check if next date has data
          if (userData && userData.locationTracking[nextDateString] && userData.locationTracking[nextDateString].length > 0) {
            console.log('Next date has data:', nextDateString);
          } else {
            console.log('Next date has no data:', nextDateString);
          }
          
          // Check data for the new date immediately
          checkDataForSelectedDate();
        }, 50);
      } else {
        console.log('Cannot navigate beyond today or already on today');
      }
      
    } catch (error) {
      console.error('Error navigating to next date:', error);
    }
  };

  // Test function to verify navigation
  const testNavigation = () => {
    console.log('=== TESTING NAVIGATION ===');
    console.log('Current selectedDate:', selectedDate);
    console.log('Available dates:', getAvailableDates());
    
    // Test date parsing
    if (selectedDate) {
      console.log('Testing navigation for date:', selectedDate);
      
      if (selectedDate.includes(' ')) {
        // For "Wed Aug 06 2025" format
        const date = new Date(selectedDate);
        if (!isNaN(date.getTime())) {
          // Test previous date
          const testPrevious = new Date(date);
          testPrevious.setDate(testPrevious.getDate() - 1);
          console.log('Test previous date (same format):', testPrevious.toDateString());
          
          // Test next date
          const testNext = new Date(date);
          testNext.setDate(testNext.getDate() + 1);
          console.log('Test next date (same format):', testNext.toDateString());
        } else {
          console.log('Cannot parse date format:', selectedDate);
        }
      } else {
        // For "2025-08-06" format
        const [year, month, day] = selectedDate.split('-').map(Number);
        console.log('Parsed components:', { year, month, day });
        
        // Test previous date calculation
        let prevDay = day - 1;
        let prevMonth = month;
        let prevYear = year;
        
        if (prevDay === 0) {
          prevMonth = month - 1;
          if (prevMonth === 0) {
            prevMonth = 12;
            prevYear = year - 1;
          }
          const lastDayOfPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
          prevDay = lastDayOfPrevMonth;
        }
        
        const testPreviousString = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${prevDay.toString().padStart(2, '0')}`;
        console.log('Test previous date (ISO format):', testPreviousString);
        
        // Test next date calculation
        let nextDay = day + 1;
        let nextMonth = month;
        let nextYear = year;
        
        const daysInCurrentMonth = new Date(year, month, 0).getDate();
        if (nextDay > daysInCurrentMonth) {
          nextDay = 1;
          nextMonth = month + 1;
          if (nextMonth > 12) {
            nextMonth = 1;
            nextYear = year + 1;
          }
        }
        
        const testNextString = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${nextDay.toString().padStart(2, '0')}`;
        console.log('Test next date (ISO format):', testNextString);
      }
    }
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    console.log('Today:', today);
    console.log('Yesterday:', yesterdayString);
    
    if (userData) {
      console.log('Today data:', userData.locationTracking[today]?.length || 0, 'locations');
      console.log('Yesterday data:', userData.locationTracking[yesterdayString]?.length || 0, 'locations');
    }
  };

  // Function to check if data exists for selected date
  const checkDataForSelectedDate = () => {
    if (!userData || !selectedDate) return;
    
    const locations = userData.locationTracking[selectedDate] || [];
    const availableDates = getAvailableDates();
    
    console.log(`Checking data for date: ${selectedDate}`);
    console.log(`Found ${locations.length} locations`);
    console.log(`Available dates: ${availableDates.join(', ')}`);
    
    if (locations.length > 0) {
      console.log('Data exists for selected date');
    } else {
      console.log('No data found for selected date');
      
      // Check if the selected date is in available dates
      if (availableDates.includes(selectedDate)) {
        console.log('Date exists in available dates but no locations found');
      } else {
        console.log('Date not found in available dates');
        console.log('Available dates for navigation:', availableDates);
      }
    }
  };

  // Function to fix invalid timestamps in existing data
  const fixInvalidTimestamps = async () => {
    if (!userData) return;
    
    let hasChanges = false;
    const updatedUserData = { ...userData };
    
    Object.keys(updatedUserData.locationTracking).forEach(dateKey => {
      const locations = updatedUserData.locationTracking[dateKey];
      locations.forEach((location: LocationData) => {
        try {
          const parsedDate = new Date(location.timestamp);
          const now = new Date();
          const minDate = new Date(2020, 0, 1);
          const maxDate = new Date(now.getFullYear() + 1, 11, 31);
          
          if (isNaN(parsedDate.getTime()) || parsedDate < minDate || parsedDate > maxDate) {
            console.log('Fixing invalid timestamp:', location.timestamp, '->', new Date().toISOString());
            location.timestamp = new Date().toISOString();
            hasChanges = true;
          }
        } catch (error) {
          console.log('Fixing timestamp error:', location.timestamp, '->', new Date().toISOString());
          location.timestamp = new Date().toISOString();
          hasChanges = true;
        }
      });
    });
    
    if (hasChanges) {
      setUserData(updatedUserData);
      try {
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
        console.log('Fixed invalid timestamps in user data');
      } catch (error) {
        console.error('Error saving fixed user data:', error);
      }
    }
  };

  // Debug function to log current state
  const debugCurrentState = () => {
    // Only log if there's actual data to show
    if (!userData || !selectedDate) return;
    
    const locations = userData.locationTracking[selectedDate] || [];
    if (locations.length === 0) return; // Don't log empty states
    
    console.log('=== DEBUG CURRENT STATE ===');
    console.log('selectedDate:', selectedDate);
    console.log('userData exists:', !!userData);
    console.log('availableDates:', availableDates);
    console.log('currentDateIndex:', currentDateIndex);
    console.log('Locations for selected date:', locations.length);
    
    // Log timestamp details for debugging (only first 3 locations)
    locations.slice(0, 3).forEach((location, index) => {
      console.log(`\n--- Location ${index + 1} Timestamp Debug ---`);
      console.log('Raw timestamp:', location.timestamp);
      console.log('Timestamp type:', typeof location.timestamp);
      
      try {
        const date = new Date(location.timestamp);
        console.log('Parsed date:', date);
        console.log('Is valid date:', !isNaN(date.getTime()));
        console.log('ISO string:', date.toISOString());
        console.log('Locale string:', date.toLocaleString());
      } catch (error) {
        console.error('Error parsing timestamp:', error);
      }
    });
    
    if (locations.length > 3) {
      console.log(`... and ${locations.length - 3} more locations`);
    }
  };

  // Function to check current date format and debug
  const debugDateFormats = () => {
    console.log('=== DATE FORMAT DEBUG ===');
    console.log('Current selectedDate:', selectedDate);
    console.log('selectedDate type:', typeof selectedDate);
    
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    console.log('Today string (local):', todayString);
    
    if (selectedDate && selectedDate.includes(' ')) {
      const date = new Date(selectedDate);
      const convertedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      console.log('Converted selectedDate (local):', convertedDate);
      console.log('Are they equal?', convertedDate === todayString);
    }
    console.log('========================');
  };

  // Check if selected date is today
  const isToday = () => {
    try {
      // Validate selectedDate
      if (!selectedDate || typeof selectedDate !== 'string') {
        console.warn('Invalid selectedDate in isToday:', selectedDate);
        return false;
      }
      
      // Use local date instead of UTC for today
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Convert selectedDate to same format as todayString for comparison
      let selectedDateForComparison = selectedDate;
      if (selectedDate.includes(' ')) {
        // Convert "Wed Aug 06 2025" to "2025-08-06" using local date
        const date = new Date(selectedDate);
        if (!isNaN(date.getTime())) {
          selectedDateForComparison = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        } else {
          console.warn('Cannot parse selectedDate in isToday:', selectedDate);
          return false;
        }
      }

      const isTodayResult = selectedDateForComparison === todayString;
      
      console.log('=== IS TODAY DEBUG ===');
      console.log('Original selectedDate:', selectedDate);
      console.log('SelectedDate for comparison:', selectedDateForComparison);
      console.log('Today for comparison:', todayString);
      console.log('Is today result:', isTodayResult);
      console.log('Button should be disabled:', isTodayResult);
      console.log('========================');
      
      return isTodayResult;
    } catch (error) {
      console.error('Error in isToday function:', error);
      return false;
    }
  };

  const formatDateForDisplay = (dateString: string): string => {
    try {
      // Validate date string
      if (!dateString || typeof dateString !== 'string') {
        console.warn('Invalid date string:', dateString);
        return 'Invalid Date';
      }

      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date object created from:', dateString);
        return 'Invalid Date';
      }

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const renderCalendarModal = () => (
    <Modal
      visible={showCalendar}
      transparent={true}
      animationType="slide"
              onRequestClose={() => {
          setShowCalendar(false);
        }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.calendarModal}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>Select Date</Text>
            <TouchableOpacity           onPress={() => {
            setShowCalendar(false);
          }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.calendarList}>
            {availableDates.length > 0 ? (
              availableDates.map((date, index) => (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.calendarItem,
                    selectedDate === date && styles.selectedCalendarItem
                  ]}
                  onPress={() => {
                    setSelectedDate(date);
                    setCurrentDateIndex(index);
                    setShowCalendar(false);
                  }}
                >
                  <Text style={[
                    styles.calendarItemText,
                    selectedDate === date && styles.selectedCalendarItemText
                  ]}>
                    {formatDateForDisplay(date)}
                  </Text>
                  <Text style={styles.calendarItemCount}>
                    {userData?.locationTracking[date]?.length || 0} points
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noDatesContainer}>
                <Text style={styles.noDatesText}>No location data available</Text>
                <Text style={styles.noDatesSubtext}>Start tracking to see your timeline</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderTimelineItem = (item: any, index: number) => {
    const timestamp = new Date(item.timestamp).toLocaleTimeString();
    const toTime = item.toTime ? new Date(item.toTime).toLocaleTimeString() : new Date(item.timestamp).toLocaleTimeString();

   
    
    if (item.type === 'punchIn') {
      const punchData = item.data;
      return (
        <View key={`punchIn-${item.timestamp}-${index}`} style={styles.periodCard}>
          <View style={styles.periodHeader}>
            <Text style={styles.periodType}>
              🟢 PUNCH IN
            </Text>
            <Text style={styles.periodStatus}>
              Work Started
            </Text>
          </View>
          
          <View style={styles.periodDetails}>
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Time:</Text>
              <Text style={styles.periodValue}>{timestamp} to {toTime}</Text>
            </View>
            
            {/* Show location information if available */}
            {punchData.location && (
              <>
                <View style={styles.periodRow}>
                  <Text style={styles.periodLabel}>Location:</Text>
                  <Text style={styles.periodValue}>
                    {punchData.location.address?.placeName || punchData.location.address?.city || 'Unknown Location'}
                  </Text>
                </View>
                
                <View style={styles.periodRow}>
                  <Text style={styles.periodLabel}>Coordinates:</Text>
                  <Text style={styles.periodValue}>
                    {punchData.location.latitude.toFixed(6)}, {punchData.location.longitude.toFixed(6)}
                  </Text>
                </View>
                
                {punchData.location.address?.formattedAddress && (
                  <View style={styles.periodRow}>
                    <Text style={styles.periodLabel}>Address:</Text>
                    <Text style={styles.periodValue}>
                      {punchData.location.address.formattedAddress}
                    </Text>
                  </View>
                )}
              </>
            )}
            
            {/* Show battery information if available */}
            {(punchData.fromBattery !== null && punchData.fromBattery !== undefined) && (
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Battery:</Text>
                <Text style={styles.periodValue}>
                  From: {Math.round(punchData.fromBattery * 100)}% {punchData.fromCharging ? '🔌' : '🔋'}
                  {punchData.toBattery !== null && punchData.toBattery !== undefined && (
                    ` → To: ${Math.round(punchData.toBattery * 100)}% ${punchData.toCharging ? '🔌' : '🔋'}`
                  )}
                </Text>
              </View>
            )}
            
            {punchData.photo && (
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Photo:</Text>
                <TouchableOpacity onPress={() => openPhotoViewer(punchData.photo)}>
                  <Image source={{ uri: punchData.photo }} style={styles.timelinePhoto} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    } else if (item.type === 'punchOut') {
      const punchData = item.data;
      return (
        <View key={`punchOut-${item.timestamp}-${index}`} style={styles.periodCard}>
          <View style={styles.periodHeader}>
            <Text style={styles.periodType}>
              🔴 PUNCH OUT
            </Text>
            <Text style={styles.periodStatus}>
              Work Ended
            </Text>
          </View>
          
          <View style={styles.periodDetails}>
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Time:</Text>
              <Text style={styles.periodValue}>{timestamp} to {toTime}</Text>
            </View>
            
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Work Hours:</Text>
              <Text style={styles.periodValue}>{punchData.workHours || attendanceStatus.todayWorkHours}</Text>
            </View>
            
            {/* Show location information if available */}
            {punchData.location && (
              <>
                <View style={styles.periodRow}>
                  <Text style={styles.periodLabel}>Location:</Text>
                  <Text style={styles.periodValue}>
                    {punchData.location.address?.placeName || punchData.location.address?.city || 'Unknown Location'}
                  </Text>
                </View>
                
                <View style={styles.periodRow}>
                  <Text style={styles.periodLabel}>Coordinates:</Text>
                  <Text style={styles.periodValue}>
                    {punchData.location.latitude.toFixed(6)}, {punchData.location.longitude.toFixed(6)}
                  </Text>
                </View>
                
                {punchData.location.address?.formattedAddress && (
                  <View style={styles.periodRow}>
                    <Text style={styles.periodLabel}>Address:</Text>
                    <Text style={styles.periodValue}>
                      {punchData.location.address.formattedAddress}
                    </Text>
                  </View>
                )}
                
                {/* Show battery information if available */}
                {(punchData.fromBattery !== null && punchData.fromBattery !== undefined) && (
                  <View style={styles.periodRow}>
                    <Text style={styles.periodLabel}>Battery:</Text>
                    <Text style={styles.periodValue}>
                      From: {Math.round(punchData.fromBattery * 100)}% {punchData.fromCharging ? '🔌' : '🔋'}
                      {punchData.toBattery !== null && punchData.toBattery !== undefined && (
                        ` → To: ${Math.round(punchData.toBattery * 100)}% ${punchData.toCharging ? '🔌' : '🔋'}`
                      )}
                    </Text>
                  </View>
                )}
              </>
            )}
            
            {punchData.photo && (
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Photo:</Text>
                <TouchableOpacity onPress={() => openPhotoViewer(punchData.photo)}>
                  <Image source={{ uri: punchData.photo }} style={styles.timelinePhoto} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    } else if (item.type === 'location') {
      const location = item.data;
      return (
        <View key={`location-${item.timestamp}-${index}`} style={styles.periodCard}>
          <View style={styles.periodHeader}>
            <Text style={styles.periodType}>
              📍 LOCATION #{item.index}
            </Text>
            <Text style={styles.periodStatus}>
              {location.address?.placeName || location.address?.city || location.address?.formattedAddress?.split(',')[0] || 'Unknown Location'}
            </Text>
          </View>
          
          <View style={styles.periodDetails}>
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Time:</Text>
              <Text style={styles.periodValue}>{timestamp}</Text>
            </View>
            
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Coordinates:</Text>
              <Text style={styles.periodValue}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </View>
            
            {location.address && (
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Address:</Text>
                <Text style={[styles.periodValue, styles.addressText]}>
                  {location.address.formattedAddress}
                </Text>
              </View>
            )}
            
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Speed:</Text>
              <Text style={styles.periodValue}>
                {formatSpeed(location.speed || null)}
              </Text>
            </View>
            
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Accuracy:</Text>
              <Text style={styles.periodValue}>
                {location.accuracy?.toFixed(2)}m
              </Text>
            </View>
            
            {(location.fromBattery !== null && location.fromBattery !== undefined) && (
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Battery:</Text>
                <Text style={styles.periodValue}>
                  From: {Math.round(location.fromBattery * 100)}% {location.fromCharging ? '🔌' : '🔋'}
                  {location.toBattery !== null && location.toBattery !== undefined && (
                    ` → To: ${Math.round(location.toBattery * 100)}% ${location.toCharging ? '🔌' : '🔋'}`
                  )}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    } else if (item.type === 'connectivity') {
      const status = item.data;
      return (
        <View key={`connectivity-${item.timestamp}-${index}`} style={styles.periodCard}>
          <View style={styles.periodHeader}>
            <Text style={styles.periodType}>
              🌐 CONNECTIVITY
            </Text>
            <Text style={[
              styles.periodStatus,
              { color: status.isConnected ? '#4CAF50' : '#f44336' }
            ]}>
              {status.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </Text>
          </View>
          
          <View style={styles.periodDetails}>
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Time:</Text>
              <Text style={styles.periodValue}>{timestamp}</Text>
            </View>
            
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Type:</Text>
              <Text style={styles.periodValue}>{status.connectionType || 'Unknown'}</Text>
            </View>
            
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Reachable:</Text>
              <Text style={styles.periodValue}>
                {status.isInternetReachable ? 'Yes' : 'No'}
              </Text>
            </View>
            
            {/* Show battery information if available */}
            {(status.fromBattery !== null && status.fromBattery !== undefined) && (
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Battery:</Text>
                <Text style={styles.periodValue}>
                  From: {Math.round(status.fromBattery * 100)}% {status.fromCharging ? '🔌' : '🔋'}
                  {status.toBattery !== null && status.toBattery !== undefined && (
                    ` → To: ${Math.round(status.toBattery * 100)}% ${status.toCharging ? '🔌' : '🔋'}`
                  )}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    } else if (item.type === 'locationService') {
      const status = item.data;
      return (
        <View key={`locationService-${item.timestamp}-${index}`} style={styles.periodCard}>
          <View style={styles.periodHeader}>
            <Text style={styles.periodType}>
              📍 LOCATION SERVICE
            </Text>
            <Text style={[
              styles.periodStatus,
              { color: status.isLocationEnabled ? '#4CAF50' : '#f44336' }
            ]}>
              {status.isLocationEnabled ? '🟢 Location ON' : '🔴 Location OFF'}
            </Text>
          </View>
          
          <View style={styles.periodDetails}>
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Time:</Text>
              <Text style={styles.periodValue}>{timestamp}</Text>
            </View>
            
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Permission:</Text>
              <Text style={styles.periodValue}>{status.permissionStatus || 'Unknown'}</Text>
            </View>
            
            {/* Show battery information if available */}
            {(status.fromBattery !== null && status.fromBattery !== undefined) && (
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Battery:</Text>
                <Text style={styles.periodValue}>
                  From: {Math.round(status.fromBattery * 100)}% {status.fromCharging ? '🔌' : '🔋'}
                  {status.toBattery !== null && status.toBattery !== undefined && (
                    ` → To: ${Math.round(status.toBattery * 100)}% ${status.toCharging ? '🔌' : '🔋'}`
                  )}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }
  };

  const renderActivityCard = (location: LocationData, index: number) => {
    const isStationary = location.isStationary;
    const icon = isStationary ? '📍' : '🚗';
    
    // Priority: placeName (sublocality) > city (locality) > meaningful area name from address
    let title = 'Unknown Location';
    if (location.address?.placeName && !location.address.placeName.includes('+')) {
      title = location.address.placeName;
    } else if (location.address?.city) {
      title = location.address.city; 
    } else if (location.address?.formattedAddress) {
      const addressParts = location.address.formattedAddress.split(', ');
      
      // Find the most meaningful part from address
      const meaningfulPart = addressParts.find(part => 
        part.length > 3 && 
        !part.match(/^\d+/) && 
        !part.includes('+') && 
        !part.includes('Rd') && 
        !part.includes('Road') &&
        !part.includes('Street') &&
        !part.includes('Avenue') &&
        !part.includes('Haryana') &&
        !part.includes('India') &&
        !part.match(/^\d{6}$/)
      );
      
      if (meaningfulPart) {
        title = meaningfulPart;
      } else {
        title = 'Unknown Location';
      }
    }
    
    const address = location.address?.formattedAddress || 'No address available';
    
    // Fix time display with proper validation
    let time = 'Invalid Time';
    try {
      if (location.timestamp) {
        let date: Date;
        
        // Handle different timestamp formats
        if (typeof location.timestamp === 'string') {
          // Try parsing as ISO string first
          date = new Date(location.timestamp);
          
          // If that fails, try parsing as locale string
          if (isNaN(date.getTime())) {
            // Try to parse as a different format
            const timestampStr = location.timestamp;
            if (timestampStr.includes(',')) {
              // Might be a locale string, try direct parsing
              date = new Date(timestampStr);
            } else {
              // Try as timestamp number
              const timestampNum = parseInt(timestampStr);
              if (!isNaN(timestampNum)) {
                date = new Date(timestampNum);
              } else {
                throw new Error('Unable to parse timestamp');
              }
            }
          }
        } else if (typeof location.timestamp === 'number') {
          date = new Date(location.timestamp);
        } else {
          throw new Error('Invalid timestamp type');
        }
        
        // Validate date bounds (not too far in past or future)
        const now = new Date();
        const minDate = new Date(2020, 0, 1); // Jan 1, 2020
        const maxDate = new Date(now.getFullYear() + 1, 11, 31); // Dec 31, next year
        
        if (!isNaN(date.getTime()) && date >= minDate && date <= maxDate) {
          time = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        } else {
          console.warn('Timestamp out of valid range:', location.timestamp, 'Parsed date:', date);
          // Use current time as fallback
          time = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      } else {
        console.warn('No timestamp available for location');
        // Use current time as fallback
        time = new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (error) {
      console.error('Error formatting time:', location.timestamp, error);
      // Use current time as fallback
      time = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    // Get status information for this location
    const statusInfo = location.connectivityStatus || location.locationStatus;
    const hasStatusInfo = statusInfo && (location.connectivityStatus || location.locationStatus);
    
    return (
      <View style={styles.activityCard}>
        <View style={styles.activityLeftSection}>
          <View style={styles.activityIconContainer}>
            <Text style={styles.activityIcon}>{icon}</Text>
          </View>
          <View style={styles.activityTimeline}>
            <View style={styles.timelineDot} />
            {index < (userData?.locationTracking[selectedDate]?.length || 0) - 1 && (
              <View style={styles.timelineLine} />
            )}
          </View>
        </View>
        
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>{title}</Text>
            <Text style={styles.activityTime}>{time}</Text>
          </View>
          <View style={styles.addressContainer}>
            <Text style={styles.activityAddress}>{address}</Text>
          </View>
          
          {/* Status Information */}
          {hasStatusInfo && (
            <View style={styles.statusContainer}>
              {location.connectivityStatus && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>🌐</Text>
                  <Text style={[
                    styles.statusText,
                    { color: location.connectivityStatus.isConnected ? '#4CAF50' : '#F44336' }
                  ]}>
                    {location.connectivityStatus.isConnected ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              )}
              {location.locationStatus && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>📍</Text>
                  <Text style={[
                    styles.statusText,
                    { color: location.locationStatus.isLocationEnabled ? '#4CAF50' : '#F44336' }
                  ]}>
                    {location.locationStatus.isLocationEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const onGestureEvent = (event: any) => {
    const { translationY } = event.nativeEvent;
    
    if (!isDragging) {
      setIsDragging(true);
    }
    
    // Make drag movement smoother with reduced sensitivity
    const dragSensitivity = 0.05; // Reduced sensitivity for slower movement
    const newPosition = listPosition - (translationY * dragSensitivity);
    
    // Allow list to go higher but with 10% minimum height and 90% maximum
    const clampedPosition = Math.max(
      height * 0.1,  // Minimum 10% height
      Math.min(height * 0.9, newPosition)  // Maximum 90% height
    );
    
    setListPosition(clampedPosition);
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      // Start dragging
      setIsDragging(true);
    } else if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
      // End dragging
      setIsDragging(false);
      
      // Snap to nearest position with smooth animation
      const positions = Object.values(LIST_POSITIONS);
      const currentPos = listPosition;
      const nearest = positions.reduce((prev, curr) => 
        Math.abs(curr - currentPos) < Math.abs(prev - currentPos) ? curr : prev
      );
      
      // Allow list to go higher but with 10% minimum height and 90% maximum
      let finalPosition = nearest;
      if (currentPos < height * 0.2) {
        finalPosition = height * 0.1; // Snap to 10% minimum if very close to top
      } else if (currentPos > height * 0.8) {
        finalPosition = height * 0.9; // Snap to 90% maximum if very close
      }
      
      // Ensure final position is within bounds
      finalPosition = Math.max(height * 0.1, Math.min(height * 0.9, finalPosition));
      
      // Smooth animation to final position
      setListPosition(finalPosition);
    }
  };

  const getMapHeight = () => {
    // Use state value for smooth transitions
    const mapHeight = height - listPosition;
    return Math.max(height * 0.1, Math.min(height, mapHeight)); // Map minimum 10%, max 100%
  };

  const getListHeight = () => {
    // Use state value for smooth transitions
    const listHeight = listPosition;
    return Math.max(height * 0.1, Math.min(height * 0.9, listHeight)); // List minimum 10%, max 90%
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading Timeline...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Map Section */}
      <View style={[styles.mapContainer, { 
        height: getMapHeight(),
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1
      }]}>
        {mapHtml ? (
          <WebView
            source={{ html: mapHtml }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
      </View>

      {/* List Section */}
      <View style={[styles.listContainer, { 
        height: getListHeight(),
        zIndex: 2
      }]}>
        {/* Draggable Header Area */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <View style={styles.draggableHeader}>
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            {/* Date Navigation Header */}
            <View style={styles.dateHeader}>
              <TouchableOpacity
                style={styles.dateArrow}
                            onPress={() => {
              navigateToPreviousDate();
            }}
              >
                <Text style={styles.dateArrowText}>←</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowCalendar(true)}
              >
                <Text style={styles.dateText}>
                  {formatDateForDisplay(selectedDate)}
                </Text>
                <Text style={styles.dateDropdown}>▾</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.dateArrow, 
                  isToday() && styles.dateArrowDisabled
                ]}
                            onPress={() => {
              if (!isToday()) {
                navigateToNextDate();
              } else {
                Alert.alert('Disabled', 'Cannot navigate beyond today');
              }
            }}
                disabled={isToday()}
                activeOpacity={isToday() ? 1 : 0.7}
              >
                <Text style={[
                  styles.dateArrowText, 
                  isToday() && styles.dateArrowTextDisabled
                ]}>
                  {isToday() ? '→' : '→'}
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </PanGestureHandler>

        {/* Summary Card */}
        {userData && selectedDate && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>🚗</Text>
              <Text style={styles.summaryText}>
                {calculateTotalDistance(userData.locationTracking[selectedDate] || []).toFixed(2)} km
              </Text>
              <Text style={styles.summaryText}>
                {calculateTotalTime(userData.locationTracking[selectedDate] || [])}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>📍</Text>
              <Text style={styles.summaryText}>
                {userData.locationTracking[selectedDate]?.length || 0} visits
              </Text>
            </View>
            {(() => {
              const locations = userData.locationTracking[selectedDate] || [];
              const batteryLevels = locations
                .filter(loc => loc.batteryLevel !== null && loc.batteryLevel !== undefined)
                .map(loc => loc.batteryLevel!);
              
              if (batteryLevels.length > 0) {
                const avgBattery = batteryLevels.reduce((sum, level) => sum + level, 0) / batteryLevels.length;
                const minBattery = Math.min(...batteryLevels);
                const maxBattery = Math.max(...batteryLevels);
                
                return (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryIcon}>🔋</Text>
                    <Text style={styles.summaryText}>
                      Avg: {Math.round(avgBattery * 100)}% | Min: {Math.round(minBattery * 100)}% | Max: {Math.round(maxBattery * 100)}%
                    </Text>
                  </View>
                );
              }
              return null;
            })()}
          </View>
        )}

        {/* API Status Card - REMOVED FOR PRODUCTION */}
        {/* <View style={styles.apiStatusCard}>
          <View style={styles.apiStatusRow}>
            <Text style={styles.apiStatusLabel}>API Data:</Text>
            <Text style={[
              styles.apiStatusValue,
              { color: loadingApiData ? '#FF9800' : apiError ? '#f44336' : apiAttendanceData ? '#4CAF50' : '#757575' }
            ]}>
              {loadingApiData ? '🔄 Loading...' : 
               apiError ? '❌ Error' : 
               apiAttendanceData ? '✅ Loaded' : '⚪ Not Loaded'}
            </Text>
          </View>
          
          {apiError && (
            <View style={styles.apiErrorRow}>
              <Text style={styles.apiErrorText}>{apiError}</Text>
            </View>
          )}
          
          {apiAttendanceData && (
            <View style={styles.apiDataRow}>
              <Text style={styles.apiDataText}>
                📊 {apiAttendanceData.entries?.length || 0} entries | 
                ⏱️ {apiAttendanceData.totalDuration ? Math.round(apiAttendanceData.totalDuration / 60000) : 0} min
              </Text>
            </View>
          )}
        </View> */}

        {/* Timeline List */}
        <View style={styles.scrollContainer}>
          <ScrollView 
            style={styles.activityList} 
            contentContainerStyle={styles.activityListContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            scrollEnabled={true}
            bounces={true}
          >
            {loadingTimeline ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={styles.loadingText}>Loading timeline...</Text>
              </View>
            ) : timeline.length > 0 ? (
              timeline.map((item, index) => renderTimelineItem(item, index))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📍</Text>
                <Text style={styles.emptyStateTitle}>
                  No Timeline Data
                </Text>
                <Text style={styles.emptyStateText}>
                  No timeline data available for {formatDateForDisplay(selectedDate)}.
                  {getAvailableDates().length > 0 && (
                    `\n\nAvailable dates: ${getAvailableDates().slice(0, 3).map(date => formatDateForDisplay(date)).join(', ')}${getAvailableDates().length > 3 ? '...' : ''}`
                  )}
                </Text>
                                  <TouchableOpacity 
                    style={styles.emptyStateButton}
                    onPress={() => {
                      // Navigate to today if available, otherwise to first available date
                      const availableDates = getAvailableDates();
                      if (availableDates.length > 0) {
                        const today = new Date().toISOString().split('T')[0];
                        const targetDate = availableDates.includes(today) ? today : availableDates[0];
                        setSelectedDate(targetDate);
                      }
                    }}
                  >
                    <Text style={styles.emptyStateButtonText}>
                      {getAvailableDates().length > 0 ? 'View Available Data' : 'Start Tracking'}
                    </Text>
                  </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <View style={styles.calendarModal}>
            <Text style={styles.calendarTitle}>Select Date</Text>
            <ScrollView style={styles.dateList}>
              {availableDates.map((date, index) => (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.dateItem,
                    selectedDate === date && styles.selectedDateItem
                  ]}
                  onPress={() => {
                    setSelectedDate(date);
                    setShowCalendar(false);
                  }}
                >
                  <Text style={[
                    styles.dateItemText,
                    selectedDate === date && styles.selectedDateItemText
                  ]}>
                    {formatDateForDisplay(date)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Photo Viewer Modal */}
      <Modal
        visible={photoViewerModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhotoViewerModalVisible(false)}
      >
        <View style={styles.photoViewerOverlay}>
          <View style={styles.photoViewerContainer}>
            <View style={styles.photoViewerHeader}>
              <TouchableOpacity
                style={styles.photoViewerCloseButton}
                onPress={() => setPhotoViewerModalVisible(false)}
              >
                <Text style={styles.photoViewerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedPhotoUri && (
              <Image 
                source={{ uri: selectedPhotoUri }} 
                style={styles.photoViewerImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Testing Section - REMOVED FOR PRODUCTION */}
      {/* <View style={styles.testingSection}>
        <Text style={styles.testingTitle}>🧪 Testing Tools</Text>
        
        <View style={styles.testingCard}>
          <Text style={styles.testingCardTitle}>Clear Attendance Data</Text>
          <Text style={styles.testingDescription}>
            This will clear attendance data including location history, punch in/out records, and photos. User login information will be preserved. Use for testing only.
          </Text>
          
          <TouchableOpacity
            style={styles.clearDataButton}
            onPress={() => {
              Alert.alert(
                'Clear Attendance Data',
                'This will delete attendance data including:\n• Location history\n• Attendance records\n• Photos\n• Status history\n\nUser login information will be preserved.\n\nThis action cannot be undone. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Clear Attendance Data', 
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        // Clear only attendance-related data, preserve user login data
                        await AsyncStorage.removeItem('attendanceStatus');
                        await AsyncStorage.removeItem('punchInPhoto');
                        await AsyncStorage.removeItem('punchOutPhoto');
                        await AsyncStorage.removeItem('statusHistory');
                        await AsyncStorage.removeItem('selectedTrackingConfig');
                        await AsyncStorage.removeItem('addressCache');
                        
                        // Clear location tracking data from userData but preserve user info
                        const currentUserData = await AsyncStorage.getItem('userData');
                        if (currentUserData) {
                          const userData = JSON.parse(currentUserData);
                          const clearedUserData = {
                            ...userData,
                            locationTracking: {},
                            combinedTimeline: {},
                            totalTrackingPoints: 0,
                            lastTrackingUpdate: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          };
                          await AsyncStorage.setItem('userData', JSON.stringify(clearedUserData));
                        }
                        
                        Alert.alert('Success', 'Attendance data has been cleared successfully. User login information preserved.');
                        
                        // Reset attendance-related state only
                        setSelectedDate('');
                        setTimeline([]);
                        setAttendanceStatus({
                          isPunchedIn: false,
                          punchInTime: null,
                          punchOutTime: null,
                          todayWorkHours: '0 hr 0 min',
                          currentLocation: 'Unknown Location'
                        });
                        setPunchInPhotoUri(null);
                        setPunchOutPhotoUri(null);
                        
                        // Reload data (user data will be preserved)
                        loadUserData();
                        loadAttendanceStatus();
                        loadSavedPhotos();
                      } catch (error) {
                        console.error('Error clearing attendance data:', error);
                        Alert.alert('Error', 'Failed to clear attendance data. Please try again.');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.clearDataButtonText}>🗑️ Clear Attendance Data</Text>
          </TouchableOpacity>
        </View>
      </View> */}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden', // Prevent overflow
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  mapContainer: {
    width: '100%',
    overflow: 'hidden', // Prevent map overflow
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  mapLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden', // Prevent list overflow
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateArrow: {
    padding: 10,
  },
  dateArrowText: {
    fontSize: 18,
    color: '#4285F4',
    fontWeight: 'bold',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dateDropdown: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  summaryCard: {
    margin: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft:40,
    paddingRight: 40,
    paddingTop:10,
    paddingBottom:10,
    
    backgroundColor: '#f8f9fa',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIcon: {
    fontSize: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  activityList: {
    flex: 1,
    paddingHorizontal: 20,
    minHeight: 200, // Ensure minimum height for scrolling
  },
  activityListContent: {
    paddingBottom: 20,
    flexGrow: 1, // Allow content to grow
  },
  scrollContainer: {
    flex: 1,
  },
  draggableHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    backgroundColor: '#fff',
    
  },
  activityLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityTimeline: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4285F4',
    marginBottom: 5,
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#e0e0e0',
    left: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  activityAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  calendarList: {
    padding: 20,
  },
  calendarItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCalendarItem: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  calendarItemText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  selectedCalendarItemText: {
    color: '#4285F4',
    fontWeight: 'bold',
  },
  calendarItemCount: {
    fontSize: 12,
    color: '#666',
  },
  loadingAddressText: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
  },
  debugInfo: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginTop: 10,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  noDatesContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDatesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  noDatesSubtext: {
    fontSize: 12,
    color: '#999',
  },
  dateList: {
    maxHeight: 300,
  },
  dateItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedDateItem: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
  },
  dateItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDateItemText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dragHandleContainer: {
    height: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  emptyStateIcon: {
    fontSize: 40,
    color: '#666',
    marginBottom: 15,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  emptyStateButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateArrowDisabled: {
    opacity: 0.2,
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
  },
  dateArrowTextDisabled: {
    color: '#999',
    fontWeight: 'normal',
  },
  addressContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statusContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 14,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Status history styles
  periodCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  periodType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  periodStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  periodDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  periodLabel: {
    fontSize: 12,
    color: '#666',
  },
  periodValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  addressText: {
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 16,
    marginLeft: 10,
  },
  timelinePhoto: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  // Photo viewer styles
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    backgroundColor: '#fff',
  },
  photoViewerCloseButton: {
    padding: 5,
  },
  photoViewerCloseText: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
  },
  photoViewerImage: {
    flex: 1,
    width: '100%',
  },
  // API Status styles - REMOVED FOR PRODUCTION
  /*
  apiStatusCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  apiStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  apiStatusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  apiStatusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  apiErrorRow: {
    marginBottom: 8,
  },
  apiErrorText: {
    fontSize: 12,
    color: '#f44336',
    fontStyle: 'italic',
  },
  apiDataRow: {
    marginBottom: 10,
  },
  apiDataText: {
    fontSize: 12,
    color: '#666',
  },
  */
  // API Refresh Button Styles - REMOVED FOR PRODUCTION (Auto refresh only)
  /*
  apiRefreshButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  apiRefreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  */
  // Testing styles - REMOVED FOR PRODUCTION
  /*
  testingSection: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  testingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  testingCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  testingCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  testingDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 15,
  },
  clearDataButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearDataButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  */
});

export default TimelinePage; 